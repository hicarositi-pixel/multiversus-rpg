<script>
    import { fade, fly } from 'svelte/transition';
    import { createEventDispatcher, onMount } from 'svelte';
    
    import { SystemBookDB } from './SystemBookDB.js';
    import { BookAutomation } from './BookAutomation.js';
    import SystemBookView from './SystemBookView.svelte'; // Importa a nossa tela de jogador!

    export let bookData; 
    export let isGM = false;

    
    const dispatch = createEventDispatcher();

    // --- ESTADOS GLOBAIS DO ORQUESTRADOR ---
    let mode = 'view'; // Começa sempre na View limpa
    let glossary = {};
    
    // --- ESTADOS DO EDITOR (GM ONLY) ---
    let currentChapterId = bookData?.chapters[0]?.id || null;
    let draggedChapterIdx = null;
    let editTab = 'markdown'; 
    let editTabMobile = 'editor'; 
    
    let activeModal = null; 
    let modalData = {};
    let isNavOpen = false;
    let isHelperOpen = false;
    let activeTerm = null;

    // --- REATIVIDADE CORRIGIDA (Live Preview Funcional) ---
    $: activeChapter = bookData?.chapters.find(c => c.id === currentChapterId) || bookData?.chapters[0];
    $: { 
        if (activeChapter) {
            if (typeof activeChapter.customHtml === 'undefined') activeChapter.customHtml = "";
            if (typeof activeChapter.folder === 'undefined') activeChapter.folder = "Geral"; 
        }
    }
    
    // Força o renderizador a escutar a variável de texto corretamente
    $: currentContent = activeChapter?.content || "";
    $: renderedHtml = BookAutomation.renderMarkdown(currentContent, glossary);

    onMount(() => { glossary = SystemBookDB.getGlossary(); });

    // Força atualização da cadeia de dados (Gatilho do Live Preview)
    function forceReactivity() {
        activeChapter = activeChapter;
        bookData = bookData;
    }

    // --- CONTROLE DE MODO E SALVAMENTO (Corrigido) ---
    function toggleEdit() {
        if (!isGM) return;
        mode = 'edit';
        editTab = 'markdown'; // Garante que abra na aba de texto
    }

async function saveAndExit() {
        if (!isGM) return;
        const allBooks = SystemBookDB.getBooks();
        const index = allBooks.findIndex(b => b.id === bookData.id);
        
        if (index > -1) {
            allBooks[index] = bookData;
            await SystemBookDB.saveBooks(allBooks);
            ui.notifications.info("Alterações do Livro salvas com sucesso!");
            
            // A MÁGICA AQUI: Avisa o Jornal (Componente Pai) para atualizar a capa lá fora
            dispatch('updateMeta', {
                title: bookData.title,
                image: bookData.image,
                summary: bookData.summary
            });
        }
        
        mode = 'view'; // Volta para o SystemBookView.svelte
    }

    // --- GERENCIAMENTO DE CAPÍTULOS ---
    function selectChapter(id) { currentChapterId = id; isNavOpen = false; }
    function addNewChapter() {
        const newCap = { id: foundry.utils.randomID(), folder: "Nova Categoria", title: "Nova Seção", content: "# Novo Título\nRegras...", customHtml: "" };
        bookData.chapters = [...bookData.chapters, newCap];
        currentChapterId = newCap.id;
    }
    function deleteChapter(id) {
        if (!confirm("Deletar página permanentemente?")) return;
        bookData.chapters = bookData.chapters.filter(c => c.id !== id);
        if (currentChapterId === id) currentChapterId = bookData.chapters[0]?.id;
    }
    function handleDragStart(e, idx) { draggedChapterIdx = idx; e.dataTransfer.effectAllowed = "move"; }
    function handleDrop(e, targetIdx) {
        e.preventDefault();
        if (draggedChapterIdx !== null && draggedChapterIdx !== targetIdx) {
            const chaps = [...bookData.chapters];
            const [moved] = chaps.splice(draggedChapterIdx, 1);
            chaps.splice(targetIdx, 0, moved);
            bookData.chapters = chaps;
            draggedChapterIdx = null;
        }
    }

    // --- MATRIZ (GLOSSÁRIO GLOBAL) ---
    let newTerm = { word: "", title: "", type: "REGRA", desc: "", img: "" };
    async function saveGlossaryTerm() {
        if (!newTerm.word || !newTerm.title) return ui.notifications.warn("Preencha palavra exata e título.");
        const key = newTerm.word.toLowerCase().replace(/\s+/g, '_');
        glossary[key] = { ...newTerm };
        await SystemBookDB.saveGlossary(glossary);
        glossary = SystemBookDB.getGlossary(); 
        ui.notifications.info(`Termo "${newTerm.word}" inserido na Matriz.`);
        newTerm = { word: "", title: "", type: "REGRA", desc: "", img: "" };
        forceReactivity();
    }
    async function deleteTerm(key) {
        if(!confirm("Deletar termo do glossário global?")) return;
        delete glossary[key];
        await SystemBookDB.saveGlossary(glossary);
        glossary = SystemBookDB.getGlossary();
        forceReactivity();
    }

    // --- INTERAÇÕES NA LIVE PREVIEW ---
    function handlePreviewClick(event) {
        if (mode !== 'edit' || !isGM) return;
        
        // Clicou no link do glossário dentro do preview
        const keyword = event.target.closest('.rule-keyword');
        if (keyword) {
            const key = keyword.getAttribute('data-key');
            if (glossary[key]) {
                activeTerm = glossary[key];
                isHelperOpen = true;
            }
            return;
        }

        // Redimensionar Imagem
        if (event.target.tagName === 'IMG' && event.target.classList.contains('live-img')) {
            modalData = { url: event.target.getAttribute('data-url'), size: '100%' };
            activeModal = 'image_resize';
        }
    }

    function handleRightClick(event) {
        if (mode !== 'edit' || !isGM) return;
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        if (!selectedText) return;

        modalData = { text: selectedText, color: '#00ff41' }; 
        activeModal = 'color';
    }

    // --- FUNÇÕES DOS MODAIS INTERNOS ---
    function applyColor() {
        if (modalData.text) {
            const target = modalData.text;
            activeChapter.content = activeChapter.content.replace(target, `[color:${modalData.color}]${target}[/color]`);
            forceReactivity();
        }
        activeModal = null;
        window.getSelection().removeAllRanges();
    }
    function applyImage() {
        if (modalData.url) {
            activeChapter.content += `\n[img:${modalData.url}:${modalData.width}]`;
            forceReactivity();
        }
        activeModal = null;
    }
    function applyResize() {
        const urlSafe = modalData.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
        const regex = new RegExp(`\\[img:${urlSafe}:.*?\\]`, 'g');
        activeChapter.content = activeChapter.content.replace(regex, `[img:${modalData.url}:${modalData.size}]`);
        forceReactivity();
        activeModal = null;
    }
    function injectCode(prefix, suffix = "") { 
        activeChapter.content += `\n${prefix}TextoAqui${suffix}`; 
        forceReactivity();
    }
</script>

{#if mode === 'view'}
    <SystemBookView 
        {bookData} 
        {isGM} 
        on:editBook={toggleEdit} 
        on:closeBook={() => dispatch('closeBook')} 
    />

{:else if mode === 'edit' && isGM}
    
    <div class="srd-editor-root" in:fade>
        
        {#if activeModal || isNavOpen || isHelperOpen}
            <div class="modal-layer" transition:fade on:click={() => {if(!activeModal){isNavOpen=false; isHelperOpen=false;}}}>
                
                {#if activeModal}
                    <div class="hacker-modal" in:fly={{y:-20}} on:click|stopPropagation>
                        {#if activeModal === 'color'}
                            <h3>🎨 PINTAR TEXTO</h3>
                            <p>Texto: <strong>"{modalData.text}"</strong></p>
                            <input type="color" bind:value={modalData.color} class="color-picker">
                            <div class="modal-btns">
                                <button on:click={() => activeModal = null}>Cancelar</button>
                                <button class="confirm" on:click={applyColor}>Aplicar Cor</button>
                            </div>
                        {:else if activeModal === 'image_add'}
                            <h3>🖼️ INSERIR IMAGEM</h3>
                            <label>URL (Link): <input type="text" bind:value={modalData.url} class="hacker-input"></label>
                            <label>Largura (ex: 100%, 300px): <input type="text" bind:value={modalData.width} class="hacker-input"></label>
                            <div class="modal-btns">
                                <button on:click={() => activeModal = null}>Cancelar</button>
                                <button class="confirm" on:click={applyImage}>Inserir</button>
                            </div>
                        {:else if activeModal === 'image_resize'}
                            <h3>📏 REDIMENSIONAR IMAGEM</h3>
                            <label>Novo Tamanho: <input type="text" bind:value={modalData.size} class="hacker-input"></label>
                            <div class="modal-btns">
                                <button on:click={() => activeModal = null}>Cancelar</button>
                                <button class="confirm" on:click={applyResize}>Ajustar</button>
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
        {/if}

        <header class="topbar-editor">
            <div class="brand">
                <button class="btn-menu" on:click={() => isNavOpen = !isNavOpen}>☰</button>
                <i class="fas fa-wrench"></i> STUDIO DATA HELL
            </div>
            <div class="top-actions">
                <button class="btn-tool confirm-tool" on:click={saveAndExit}><i class="fas fa-save"></i> <span class="hide-mobile">SALVAR E VER</span></button>
            </div>
        </header>

        <div class="main-workspace">
            
            <nav class="nav-sidebar custom-scroll" class:mobile-open={isNavOpen}>
                <div class="nav-header-mobile">PÁGINAS <button class="btn-close-nav" on:click={() => isNavOpen=false}>✕</button></div>
                <div class="nav-group">
                    <div class="nav-group-title">Índice do Livro</div>
                    {#each bookData.chapters as chapter, i (chapter.id)}
                        <div class="nav-link" class:active={currentChapterId === chapter.id} 
                             on:click={() => selectChapter(chapter.id)}
                             draggable="true" on:dragstart={(e) => handleDragStart(e, i)} on:dragover|preventDefault on:drop={(e) => handleDrop(e, i)}>
                            <span>
                                <i class="fas fa-file-alt" style="opacity:0.5; margin-right:5px"></i> 
                                {chapter.title}
                            </span>
                            <button class="btn-trash" on:click|stopPropagation={() => deleteChapter(chapter.id)}>🗑️</button>
                        </div>
                    {/each}
                </div>
                <button class="btn-add-page" on:click={addNewChapter}>+ CRIAR PÁGINA</button>
            </nav>

            <main class="content-area">
                <div class="editor-header-tabs">
                    <button class:active={editTab==='markdown'} on:click={()=>editTab='markdown'}><i class="fab fa-discord"></i> DISCORD/TEXTO</button>
                    <button class:active={editTab==='html'} on:click={()=>editTab='html'}><i class="fab fa-html5"></i> HTML LIVRE</button>
                    <button class:active={editTab==='capa'} on:click={()=>editTab='capa'}><i class="fas fa-cog"></i> CAPA</button>
                    <button class:active={editTab==='matriz'} on:click={()=>editTab='matriz'}><i class="fas fa-database"></i> MATRIZ</button>
                    <button class:active={editTab==='ajuda'} on:click={()=>editTab='ajuda'}><i class="fas fa-question-circle"></i> AJUDA</button>
                </div>

                <div class="mobile-tabs">
                    <button class:active={editTabMobile==='editor'} on:click={()=>editTabMobile='editor'}>CÓDIGO</button>
                    <button class:active={editTabMobile==='preview'} on:click={()=>editTabMobile='preview'}>PREVIEW</button>
                </div>

                <div class="split-screen" in:fade>
                    
                    <div class="editor-pane" class:m-hide={editTabMobile !== 'editor'}>
                        
                        {#if editTab === 'markdown'}
                            <div class="meta-inputs">
                                <input type="text" class="hacker-input large" bind:value={activeChapter.title} on:input={forceReactivity} placeholder="Título da Página">
                                <input type="text" class="hacker-input" bind:value={activeChapter.folder} on:input={forceReactivity} placeholder="Categoria (Ex: Regras)">
                            </div>
                            <div class="editor-toolbar">
                                <button on:click={() => injectCode('# ')}>TÍTULO</button>
                                <button on:click={() => injectCode('> ## ')}>CAIXA</button>
                                <button style="color:var(--primary)" on:click={() => { modalData={url:"", width:"100%"}; activeModal='image_add'; }}><i class="fas fa-image"></i> IMG</button>
                            </div>
                            <textarea class="hacker-input area custom-scroll" bind:value={activeChapter.content} on:input={forceReactivity} placeholder="Cole do Discord aqui..."></textarea>
                        
                        {:else if editTab === 'html'}
                            <div class="html-alert"><i class="fas fa-code"></i> HTML Livre renderizado no final desta página.</div>
                            <textarea class="hacker-input area html-code custom-scroll" bind:value={activeChapter.customHtml} on:input={forceReactivity} placeholder={`<style> .teste { color: red; } </style>\n<div class='teste'>Olá</div>`}></textarea>
                        
                        {:else if editTab === 'capa'}
                            <div class="config-inner custom-scroll">
                                <h3>Metadados do Jornal</h3>
                                <label>Título do Livro:<input type="text" class="hacker-input" bind:value={bookData.title} on:input={forceReactivity}></label>
                                <label>Pasta no Jornal:<input type="text" class="hacker-input" bind:value={bookData.category}></label>
                                <label>URL da Capa:<input type="text" class="hacker-input" bind:value={bookData.image}></label>
                                <label>Sinopse:<textarea class="hacker-input" rows="4" bind:value={bookData.summary}></textarea></label>
                            </div>

                        {:else if editTab === 'matriz'}
                            <div class="config-inner custom-scroll">
                                <h3>Matriz do Glossário</h3>
                                <div class="glossary-adder">
                                    <input type="text" class="hacker-input" bind:value={newTerm.word} placeholder="Exata palavra a buscar (Ex: Corpo)">
                                    <input type="text" class="hacker-input" bind:value={newTerm.title} placeholder="Título (Ex: Atributo: Corpo)">
                                    <input type="text" class="hacker-input" bind:value={newTerm.type} placeholder="Tag (Ex: ATRIBUTO)">
                                    <textarea class="hacker-input" rows="3" bind:value={newTerm.desc} placeholder="Descrição detalhada..."></textarea>
                                    <button class="confirm" on:click={saveGlossaryTerm}>+ CADASTRAR TERMO</button>
                                </div>
                                {#each Object.entries(glossary) as [key, term]}
                                    <div class="glossary-row">
                                        <span><strong style="color:var(--secondary)">{term.word}</strong></span>
                                        <button class="btn-trash" style="display:block" on:click={() => deleteTerm(key)}>🗑️</button>
                                    </div>
                                {/each}
                            </div>
                            
                        {:else if editTab === 'ajuda'}
                            <div class="config-inner custom-scroll guide-box">
                                <h3 style="color:var(--secondary)">GUIA RÁPIDO DO MESTRE</h3>
                                <p><strong>Títulos Principais:</strong> <code># Título</code></p>
                                <p><strong>Subtítulos:</strong> <code>## Subtítulo</code></p>
                                <p><strong>Caixa Quadrada Especial (SRD):</strong> <code>&gt; ## Informação</code><br><em>Ótimo para separar uma regra de classe ou efeito.</em></p>
                                <p><strong>Interatividade Preview:</strong><br>
                                - <b>Pintar:</b> Selecione um texto no Preview (Direita) e clique c/ botão DIREITO.<br>
                                - <b>Imagem:</b> Insira uma imagem e clique nela no Preview para redimensionar.</p>
                            </div>
                        {/if}
                    </div>

                    <div class="preview-pane custom-scroll html-injection" class:m-hide={editTabMobile !== 'preview'} on:click={handlePreviewClick} on:contextmenu|preventDefault={handleRightClick}>
                        <div class="preview-tag">LIVE PREVIEW | BOTÃO DIREITO: COR | CLIQUE IMG: AJUSTE</div>
                        <div class="article-container">
                            {@html renderedHtml}
                            {#if activeChapter.customHtml} <div class="custom-html-block">{@html activeChapter.customHtml}</div> {/if}
                        </div>
                    </div>

                </div>
            </main>

            <aside class="helper-sidebar custom-scroll" class:open={isHelperOpen}>
                <div class="helper-header">
                    <span><i class="fas fa-microchip"></i> TERMINAL AUXILIAR</span>
                    <button class="btn-close-helper" on:click={() => isHelperOpen = false}>✕</button>
                </div>
                <div class="helper-content">
                    {#if activeTerm}
                        <div class="term-card" in:fly={{x: 50, duration: 300}}>
                            <div class="term-badge">{activeTerm.type}</div>
                            <h3 class="term-title">{activeTerm.title}</h3>
                            <p class="term-desc">{activeTerm.desc}</p>
                        </div>
                    {/if}
                </div>
            </aside>

        </div>
    </div>
{/if}

<style>
    /* ==============================================================
       ESTILOS EXCLUSIVOS DO MODO EDIÇÃO (GM STUDIO)
       O MODO VIEW USA O CSS DO SystemBookView.svelte
       ============================================================== */
    .srd-editor-root {
        --bg-main: #0a0a0c; --bg-panel: #111114; --bg-hover: #1f1f25;
        --text-main: #d1d1e0; --text-muted: #888899; --border: #2a2a35;
        --primary: #ff0055; --secondary: #00ff41; --callout-bg: #0f1215; 
        
        position: absolute; inset: 0; display: flex; flex-direction: column;
        font-family: 'Inter', sans-serif; background-color: var(--bg-main); color: var(--text-main); z-index: 500;
    }

    h1, h2, h3, h4, .brand { font-family: 'Share Tech Mono', monospace; }
    .custom-scroll::-webkit-scrollbar { width: 6px; }
    .custom-scroll::-webkit-scrollbar-track { background: transparent; }
    .custom-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
    .custom-scroll::-webkit-scrollbar-thumb:hover { background: var(--primary); }

    /* MODAIS NATIVOS SVELTE */
    .modal-layer { position: absolute; inset: 0; background: rgba(0,0,0,0.85); z-index: 1000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(3px); }
    .hacker-modal { background: var(--bg-panel); border: 2px solid var(--primary); padding: 30px; width: 400px; max-width: 90%; border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.8); }
    .hacker-modal h3 { color: var(--primary); margin-top: 0; border-bottom: 1px dashed var(--border); padding-bottom: 10px; }
    .hacker-modal p { color: var(--text-main); font-size: 0.9rem; margin-bottom: 15px;}
    .hacker-modal label { display: block; margin-top: 15px; color: var(--text-muted); font-size: 0.8rem; }
    .color-picker { width: 100%; height: 50px; cursor: pointer; border: 1px solid var(--border); background: #000; margin-top: 10px; }
    .modal-btns { display: flex; justify-content: flex-end; gap: 10px; margin-top: 25px; }
    .modal-btns button { background: transparent; border: 1px solid var(--text-muted); color: var(--text-muted); padding: 8px 15px; cursor: pointer; font-weight: bold; border-radius: 4px; transition:0.2s;}
    .modal-btns button:hover { color: #fff; border-color: #fff; }
    .modal-btns button.confirm { background: var(--secondary); color: #000; border: none; }
    .modal-btns button.confirm:hover { background: #fff; box-shadow: 0 0 15px var(--secondary); }

    /* CABEÇALHO DO EDITOR */
    .topbar-editor { height: 60px; background: var(--bg-panel); border-bottom: 2px solid var(--primary); display: flex; align-items: center; justify-content: space-between; padding: 0 20px; flex-shrink: 0; }
    .brand { font-size: 1.3rem; color: #fff; display: flex; align-items: center; gap: 12px; }
    .btn-menu { display: none; background: transparent; border: 1px solid var(--border); color: var(--text-main); font-size: 1.2rem; padding: 5px 10px; border-radius: 4px; }
    
    .btn-tool { background: transparent; border: 1px solid var(--border); color: var(--text-muted); padding: 8px 15px; border-radius: 4px; cursor: pointer; transition: 0.2s; font-family: inherit; font-weight: bold; display: flex; align-items: center; gap: 8px; }
    .btn-tool.confirm-tool { background: var(--primary); color: #000; border: none; }
    .btn-tool.confirm-tool:hover { background: #fff; box-shadow: 0 0 15px var(--primary); }

    /* SIDEBAR (ÍNDICE) */
    .main-workspace { display: flex; flex: 1; overflow: hidden; position: relative; }
    .nav-sidebar { width: 280px; background: var(--bg-panel); border-right: 1px solid var(--border); display: flex; flex-direction: column; z-index: 100; transition: transform 0.3s; flex-shrink: 0; }
    .nav-header-mobile { display: none; padding: 15px 20px; border-bottom: 1px solid var(--border); justify-content: space-between; font-weight: bold; color: var(--primary); }
    .btn-close-nav { background: none; border: none; color: var(--text-main); font-size: 1.5rem; cursor: pointer; }
    
    .nav-group-title { padding: 20px 20px 5px; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold; letter-spacing: 1px; }
    .nav-link { display: flex; justify-content: space-between; padding: 12px 20px; color: var(--text-main); border-left: 3px solid transparent; font-size: 0.95rem; cursor: pointer; }
    .nav-link:hover { background: var(--bg-hover); }
    .nav-link.active { border-left-color: var(--primary); background: rgba(255,0,85,0.1); color: var(--primary); font-weight: bold; }
    .btn-trash { background: transparent; border: none; color: #ff5555; cursor: pointer; display: none; }
    .nav-link:hover .btn-trash { display: block; }
    
    .btn-add-page { margin-top: auto; padding: 15px; background: rgba(0,255,65,0.05); color: var(--secondary); border: none; border-top: 1px solid var(--border); cursor: pointer; font-weight: bold; transition: 0.2s; }
    .btn-add-page:hover { background: var(--secondary); color: #000; }

    /* ÁREA CENTRAL E TABS */
    .content-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #000; }
    .editor-header-tabs { display: flex; background: var(--bg-panel); border-bottom: 1px solid var(--border); overflow-x: auto; }
    .editor-header-tabs button { flex: 1; background: transparent; border: none; color: var(--text-muted); padding: 12px; font-weight: bold; cursor: pointer; border-bottom: 2px solid transparent; min-width: 150px; transition: 0.2s;}
    .editor-header-tabs button:hover { color: #fff; }
    .editor-header-tabs button.active { color: var(--primary); background: rgba(255,0,85,0.1); border-color: var(--primary); }

    /* SPLIT SCREEN E INPUTS */
    .split-screen { display: flex; flex: 1; height: 100%; overflow: hidden; }
    .editor-pane { flex: 1; display: flex; flex-direction: column; border-right: 1px solid var(--border); background: #050505; }
    
    .meta-inputs { display: flex; background: #000; }
    .hacker-input { background: #08080a; border: 1px solid var(--border); color: #fff; padding: 10px; font-family: monospace; outline: none; width: 100%; box-sizing: border-box; }
    .hacker-input:focus { border-color: var(--primary); }
    .hacker-input.large { font-size: 1.1rem; font-family: 'Share Tech Mono'; border-bottom: 1px solid var(--primary); border-right: 1px solid var(--border); flex: 2;}
    .meta-inputs .hacker-input:nth-child(2) { flex: 1; border-bottom: 1px solid var(--border); border-left: none; }
    
    .hacker-input.area { flex: 1; resize: none; font-size: 0.95rem; color: #aaffaa; border: none; padding: 15px; line-height: 1.5; }
    .hacker-input.html-code { color: #ffcc00; }
    
    .editor-toolbar { display: flex; background: var(--bg-panel); border-bottom: 1px solid var(--border); }
    .editor-toolbar button { background: transparent; border: none; border-right: 1px solid var(--border); color: var(--text-muted); padding: 10px 15px; font-size: 0.8rem; font-weight: bold; cursor: pointer; transition:0.2s;}
    .editor-toolbar button:hover { color: var(--primary); background: var(--bg-hover); }

    /* PREVIEW PANE E INJECTION CSS (Estética Cyberpunk) */
    .preview-pane { flex: 1.2; padding: 40px; overflow-y: auto; position: relative; background: var(--bg-main); }
    .preview-tag { position: absolute; top: 10px; right: 10px; background: rgba(255,0,85,0.1); color: var(--primary); border: 1px solid var(--primary); padding: 4px 8px; font-size: 0.7rem; border-radius: 4px; pointer-events: none; z-index: 10; font-weight: bold; }
    .article-container { max-width: 800px; margin: 0 auto; padding-bottom: 80px; width: 100%; }

    /* ABAS DE CONFIG E MATRIZ */
    .config-inner { padding: 30px; max-width: 800px; margin: 0 auto; width: 100%; }
    .config-inner label { display: block; margin-bottom: 15px; color: var(--text-muted); font-size: 0.85rem; }
    .config-inner h3 { color: var(--primary); border-bottom: 1px dashed var(--border); padding-bottom: 10px; margin-top: 0;}
    
    .glossary-adder { background: var(--bg-panel); border: 1px dashed var(--secondary); padding: 20px; border-radius: 8px; display: flex; flex-direction: column; gap: 10px; margin-bottom: 30px; }
    .glossary-row { display: flex; justify-content: space-between; padding: 12px; border-bottom: 1px solid var(--border); align-items: center; }
    .glossary-row:hover { background: var(--bg-hover); }
    .guide-box p { color: var(--text-main); font-size: 0.95rem; margin-bottom: 15px; line-height: 1.6;}
    .guide-box code { background: rgba(0,255,65,0.1); color: var(--secondary); padding: 2px 6px; border-radius: 4px; font-family: monospace; }

    /* GLOSSÁRIO DESLIZANTE (DIREITA) */
    .helper-sidebar { position: absolute; right: 0; top: 0; width: 350px; height: 100%; background: var(--bg-panel); border-left: 2px solid var(--primary); padding: 20px; display: flex; flex-direction: column; overflow-y: auto; z-index: 200; transform: translateX(100%); transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: -10px 0 30px rgba(0,0,0,0.5); }
    .helper-sidebar.open { transform: translateX(0); }
    .helper-header { display: flex; justify-content: space-between; align-items: center; font-family: 'Share Tech Mono'; font-size: 1rem; color: var(--primary); border-bottom: 1px solid var(--border); padding-bottom: 15px; margin-bottom: 20px; font-weight: bold; }
    .btn-close-helper { background: transparent; border: 1px solid var(--primary); color: var(--primary); width: 30px; height: 30px; border-radius: 4px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
    .btn-close-helper:hover { background: var(--primary); color: #000; }
    .term-badge { display: inline-block; background: var(--border); color: var(--text-main); font-size: 0.7rem; padding: 2px 8px; border-radius: 12px; margin-bottom: 10px; font-weight: bold; letter-spacing: 1px;}
    .term-title { color: var(--primary); font-size: 1.5rem; margin: 0 0 10px 0; line-height: 1.1;}
    .term-desc { font-size: 1rem; line-height: 1.6; color: var(--text-main); margin: 0;}

    /* =========================================
       ✨ HTML INJECTION (A MAGIA VISUAL DO PREVIEW) ✨
       ========================================= */
    :global(.html-injection) { width: 100%; }
    :global(.html-injection .chapter-title) { font-size: 2.8rem; color: var(--primary); margin-top: 0; border-bottom: 2px solid var(--primary); padding-bottom: 10px; text-transform: uppercase; line-height: 1.1; font-family: 'Share Tech Mono';}
    :global(.html-injection .section-title) { font-size: 1.6rem; color: var(--secondary); margin-top: 40px; border-bottom: 1px dashed var(--border); padding-bottom: 5px; text-transform: uppercase; font-family: 'Share Tech Mono';}
    :global(.html-injection p) { line-height: 1.7; font-size: 1.05rem; margin-bottom: 20px; color: var(--text-main);}
    :global(.html-injection strong) { color: var(--text-main); text-shadow: 0 0 5px rgba(255,255,255,0.15); }
    
    /* Callouts Quadrados (> ## Titulo \n > Texto) */
    :global(.html-injection .dh-callout) { display: flex; flex-direction: column; padding: 25px; margin: 30px 0; border-radius: 0; border: 1px solid var(--callout-border); border-left: 6px solid var(--secondary); background: var(--callout-bg); box-shadow: 6px 6px 0 rgba(0,0,0,0.15); }
    :global(.html-injection .dh-callout .callout-title) { font-weight: bold; font-family: 'Share Tech Mono'; font-size: 1.3rem; margin-bottom: 15px; color: var(--secondary); text-transform: uppercase; border-bottom: 1px solid var(--callout-border); padding-bottom: 8px; }
    :global(.html-injection .dh-callout .callout-body) { font-family: 'Inter', sans-serif; font-size: 1.05rem; color: var(--text-main); line-height: 1.7; }
    
    /* Blockquote Comum (> Texto) */
    :global(.html-injection blockquote) { border-left: 4px solid var(--text-muted); padding-left: 20px; margin: 20px 0; color: var(--text-muted); font-style: italic; background: rgba(255,255,255,0.02); padding: 15px; }

    /* Glossário */
    :global(.html-injection .rule-keyword) { color: var(--primary); font-weight: bold; cursor: pointer; border-bottom: 1px dashed var(--primary); background: rgba(255,0,85,0.08); padding: 2px 6px; border-radius: 4px; transition: 0.2s; display: inline-block; margin: 2px 0; }
    :global(.html-injection .rule-keyword:hover) { background: var(--primary); color: #fff; border-bottom-style: solid; box-shadow: 0 4px 10px rgba(255,0,85,0.3); transform: translateY(-2px); }

    /* Imagens Livres */
    :global(.html-injection .live-img) { display: block; margin: 25px 0; border: 1px solid var(--border); box-shadow: 0 4px 15px rgba(0,0,0,0.4); max-width: 100%; transition:0.2s; cursor: pointer;}
    :global(.html-injection .live-img:hover) { outline: 3px dashed var(--secondary); filter: brightness(1.2); }

    /* Listas */
    :global(.html-injection .md-list) { margin-bottom: 20px; padding-left: 25px; }
    :global(.html-injection .md-list-item) { margin-bottom: 10px; line-height: 1.5; color: var(--text-main); }
    :global(.html-injection .md-list-item::marker) { color: var(--secondary); }

    :global(.custom-html-block) { margin-top: 50px; border-top: 1px dashed var(--border); padding-top: 30px;}

    /* RESPONSIVIDADE MOBILE (TABS) */
    .mobile-tabs { display: none; background: var(--bg-panel); border-bottom: 1px solid var(--primary); flex-shrink: 0; }
    .mobile-tabs button { flex: 1; background: transparent; border: none; color: var(--text-muted); padding: 12px; font-weight: bold; }
    .mobile-tabs button.active { color: var(--primary); background: var(--primary-glow); border-bottom: 2px solid var(--primary); }

    @media (max-width: 900px) {
        .btn-menu { display: block; }
        .hide-mobile { display: none !important; }
        .preview-pane { padding: 20px; }
        
        .nav-sidebar { position: absolute; top: 0; left: 0; height: 100%; max-width: 80%; transform: translateX(-100%); box-shadow: 5px 0 20px rgba(0,0,0,0.5); }
        .nav-sidebar.mobile-open { transform: translateX(0); }
        .nav-header-mobile { display: flex; }

        .helper-sidebar { width: 100%; height: auto; max-height: 85vh; top: auto; bottom: 0; border-left: none; border-top: 4px solid var(--primary); border-radius: 20px 20px 0 0; transform: translateY(100%); box-shadow: 0 -10px 40px rgba(0,0,0,0.9); }
        .helper-sidebar.open { transform: translateY(0); }

        .mobile-tabs { display: flex; }
        .split-screen { flex-direction: column; }
        .m-hide { display: none !important; }
    }
</style>