<script>
    import { onMount } from 'svelte';
    import { fade, slide, fly } from 'svelte/transition';
    import { PlayerDatabase } from './PlayerDatabase.js';

    export let themeStyle = ""; 

    let entries = [];
    let searchQuery = "";
    let selectedType = "TODOS";
    let selectedTag = "TODOS";
    let activeEntry = null; 
    let isEditing = false;
    let editorRef; // Referência para a textarea

    const TYPES = ["Diário", "NPC", "Local", "Facção", "Anotação", "Teoria", "Inventário", "Quest"];

    const emptyEntry = { 
        id: null, name: "Novo Arquivo", type: "Anotação", tags: "", 
        img: "icons/svg/book.svg", description: "", author: "" 
    };

    onMount(() => {
        try { PlayerDatabase.ensureRegistered(); } catch(e) {}
        loadData();
        Hooks.on("nexusUpdate", loadData);
    });

    function loadData() {
        entries = PlayerDatabase.getAll();
        if (activeEntry) {
            const fresh = entries.find(e => e.id === activeEntry.id);
            if (fresh && !isEditing) activeEntry = fresh;
        }
    }

    // --- FILTROS INTELIGENTES ---
    $: allTags = ["TODOS", ...new Set(entries.flatMap(e => e.tags ? e.tags.split(',').map(t => t.trim()) : []))].sort();

    $: filtered = entries.filter(e => {
        const s = searchQuery.toLowerCase();
        const matchText = e.name.toLowerCase().includes(s) || e.description.toLowerCase().includes(s);
        const matchType = selectedType === "TODOS" || e.type === selectedType;
        const matchTag = selectedTag === "TODOS" || (e.tags && e.tags.includes(selectedTag));
        return matchText && matchType && matchTag;
    });

    function createNew() {
        activeEntry = { ...emptyEntry, id: foundry.utils.randomID(), author: game.user.name };
        isEditing = true;
    }

    async function save() {
        activeEntry.lastEditor = game.user.name;
        if(!activeEntry.img) activeEntry.img = "icons/svg/book.svg";
        await PlayerDatabase.saveEntry(activeEntry);
        isEditing = false;
        ui.notifications.info("Arquivo codificado na Database Central.");
    }

    async function del() {
        new Dialog({
            title: "Excluir Arquivo?",
            content: "<p style='color:#ff3333;'>Aviso: Isso apagará este registro da rede global permanentemente. Proceder?</p>",
            buttons: {
                yes: { label: "Deletar", icon: "<i class='fas fa-trash'></i>", callback: async () => {
                    await PlayerDatabase.deleteEntry(activeEntry.id);
                    activeEntry = null; isEditing = false;
                    ui.notifications.info("Arquivo expurgado.");
                }},
                no: { label: "Cancelar", icon: "<i class='fas fa-times'></i>" }
            },
            default: "no"
        }).render(true);
    }

    // --- SISTEMA DE INJEÇÃO HTML (RICH TEXT) ---
    function insertAtCursor(prefix, suffix = "") {
        if (!editorRef) return;
        const start = editorRef.selectionStart;
        const end = editorRef.selectionEnd;
        const text = activeEntry.description;
        const selected = text.substring(start, end);
        
        activeEntry.description = text.substring(0, start) + prefix + selected + suffix + text.substring(end);
        
        // Retorna o foco para o editor após a injeção
        setTimeout(() => {
            editorRef.focus();
            editorRef.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
        }, 10);
    }

    function formatText(type) {
        if (type === 'b') insertAtCursor("<b>", "</b>");
        if (type === 'i') insertAtCursor("<i>", "</i>");
        if (type === 'h2') insertAtCursor("<h2>", "</h2>");
        if (type === 'hr') insertAtCursor("\n<hr>\n");
        if (type === 'ul') insertAtCursor("\n<ul>\n  <li>", "</li>\n</ul>\n");
    }

    function insertLink() {
        insertAtCursor(`<a href="COLE_O_LINK_AQUI" target="_blank" class="cyber-link">`, `</a>`);
    }

    // --- GERENCIADOR DE ARQUIVOS NATIVO DO FOUNDRY ---
    function attachFile() {
        new FilePicker({ 
            type: "any", 
            callback: (path) => {
                // Se for imagem, injeta como imagem. Se for PDF/Audio, injeta como link de download.
                if (path.match(/\.(jpeg|jpg|gif|png|webp|webm)$/i)) {
                    insertAtCursor(`\n<img src="${path}" class="attached-img" alt="Anexo">\n`);
                } else {
                    insertAtCursor(`\n<a href="${path}" target="_blank" class="cyber-attachment"><i class="fas fa-file-download"></i> Baixar Arquivo Anexo</a>\n`);
                }
            } 
        }).render(true);
    }

    function changeImage() {
        new Dialog({
            title: "Imagem de Capa",
            content: `
                <div style="margin-bottom: 10px;">
                    <label>Cole um link da internet:</label>
                    <input type="text" id="img-url-input" value="${activeEntry.img}" style="width: 100%; box-sizing: border-box; margin-top:5px; background: #111; color: #fff; border: 1px solid var(--c-primary);">
                </div>
            `,
            buttons: {
                link: {
                    label: "USAR LINK",
                    icon: "<i class='fas fa-link'></i>",
                    callback: (html) => {
                        const url = html.find("#img-url-input").val();
                        if(url) activeEntry.img = url;
                    }
                },
                server: {
                    label: "PROCURAR NO SERVIDOR",
                    icon: "<i class='fas fa-folder-open'></i>",
                    callback: () => {
                        new FilePicker({ type: "image", callback: (p) => activeEntry.img = p }).render(true);
                    }
                }
            }
        }).render(true);
    }
</script>

<div class="archives-root" style="{themeStyle}">
    
    <aside class="sidebar">
        <div class="header">
            <i class="fas fa-server"></i> GLOBAL_ARCHIVES
        </div>
        
        <div class="tools">
            <div class="search-box">
                <i class="fas fa-search"></i>
                <input bind:value={searchQuery} placeholder="Buscar registros..." />
            </div>
            
            <div class="filters">
                <select bind:value={selectedType}>
                    <option value="TODOS">📁 Todos os Tipos</option>
                    {#each TYPES as t}<option>{t}</option>{/each}
                </select>
                <select bind:value={selectedTag}>
                    <option value="TODOS">🏷️ Todas as Tags</option>
                    {#each allTags as t}<option value={t}>{t}</option>{/each}
                </select>
            </div>
        </div>

        <div class="list custom-scroll">
            <button class="create-btn" on:click={createNew}>
                <i class="fas fa-plus-circle"></i> NOVO REGISTRO
            </button>

            {#each filtered as e (e.id)}
                <div class="item" class:active={activeEntry?.id === e.id} on:click={() => {activeEntry = JSON.parse(JSON.stringify(e)); isEditing=false;}}>
                    <img src={e.img} class="thumb" alt="thumb">
                    <div class="info">
                        <div class="name">{e.name}</div>
                        <div class="meta">
                            <span class="type-pill">{e.type}</span>
                            {#if e.tags} <span class="tag-pill">{e.tags.split(',')[0]}</span> {/if}
                        </div>
                    </div>
                </div>
            {/each}
            
            {#if filtered.length === 0}
                <div class="no-data"><i class="fas fa-ghost"></i><br>Nenhum dado encontrado.</div>
            {/if}
        </div>
    </aside>

    <main class="workspace">
        {#if activeEntry}
            <div class="entry-card" in:fade={{duration: 200}}>
                
                <div class="entry-header" style="background-image: url('{activeEntry.img}')">
                    <div class="header-overlay">
                        {#if isEditing}
                            <div class="edit-header" in:slide>
                                <input class="title-input" bind:value={activeEntry.name} placeholder="NOME DO ARQUIVO">
                                <div class="meta-inputs">
                                    <select bind:value={activeEntry.type}>{#each TYPES as t}<option>{t}</option>{/each}</select>
                                    <input bind:value={activeEntry.tags} placeholder="Tags (Ex: Sangue, Corporação...)">
                                    <button class="img-btn" on:click={changeImage}><i class="fas fa-image"></i> CAPA</button>
                                </div>
                            </div>
                        {:else}
                            <div class="view-header" in:fade>
                                <h1>{activeEntry.name}</h1>
                                <div class="badges">
                                    <span class="badge main">{activeEntry.type}</span>
                                    {#each (activeEntry.tags || "").split(',') as tag}
                                        {#if tag.trim()} <span class="badge tag">{tag.trim()}</span> {/if}
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>

                <div class="entry-body">
                    {#if isEditing}
                        <div class="toolbar" in:slide>
                            <button on:click={() => formatText('b')} title="Negrito"><i class="fas fa-bold"></i></button>
                            <button on:click={() => formatText('i')} title="Itálico"><i class="fas fa-italic"></i></button>
                            <button on:click={() => formatText('h2')} title="Subtítulo">H2</button>
                            <div class="divider"></div>
                            <button on:click={() => formatText('ul')} title="Lista com Marcadores"><i class="fas fa-list-ul"></i></button>
                            <button on:click={() => formatText('hr')} title="Linha Horizontal">HR</button>
                            <div class="divider"></div>
                            <button on:click={insertLink} title="Inserir Link"><i class="fas fa-link"></i> Link</button>
                            <button class="highlight-tool" on:click={attachFile} title="Anexar Arquivo do Foundry"><i class="fas fa-paperclip"></i> Anexar</button>
                        </div>
                        <textarea class="editor-area custom-scroll" bind:this={editorRef} bind:value={activeEntry.description} placeholder="Inicie o relatório. O sistema suporta HTML e injeção de arquivos..."></textarea>
                    {:else}
                        <div class="content-reader custom-scroll html-injection" in:fade>
                            {@html activeEntry.description.replace(/\n/g, '<br>')}
                        </div>
                        <div class="entry-footer">
                            <span><i class="fas fa-user-edit"></i> AUTOR_ORIGINAL: <span style="color:var(--c-primary)">{activeEntry.author}</span></span>
                            <span><i class="fas fa-clock"></i> ÚLTIMO_MOD: <span style="color:var(--c-primary)">{activeEntry.lastEditor || activeEntry.author}</span></span>
                        </div>
                    {/if}
                </div>

                <div class="actions-bar">
                    {#if isEditing}
                        <button class="btn cancel" on:click={() => {isEditing=false; loadData()}}>DESCARTAR MUDANÇAS</button>
                        <button class="btn delete" on:click={del}><i class="fas fa-trash"></i> DELETAR</button>
                        <button class="btn save" on:click={save}><i class="fas fa-save"></i> SALVAR ARQUIVO</button>
                    {:else}
                        <div class="status-id">HASH_ID: {activeEntry.id}</div>
                        <button class="btn edit" on:click={()=>isEditing=true}><i class="fas fa-terminal"></i> MODO DE EDIÇÃO</button>
                    {/if}
                </div>

            </div>
        {:else}
            <div class="empty-state" in:fade>
                <i class="fas fa-globe-americas big-icon"></i>
                <h2>GLOBAL_ARCHIVES</h2>
                <p>Acesse ou insira dados na rede compartilhada do grupo.</p>
                <div class="scanline"></div>
            </div>
        {/if}
    </main>
</div>

<style>
    /* CSS DO TEMA E JUICE */
    .archives-root {
        display: flex; height: 100%; width: 100%;
        background: var(--c-bg, #050505); 
        color: var(--c-text, #ccc); 
        font-family: var(--font-body, 'Share Tech Mono', monospace);
        overflow: hidden;
        border: 1px solid var(--c-primary);
        box-shadow: inset 0 0 30px rgba(0,0,0,0.8);
    }

    .custom-scroll::-webkit-scrollbar { width: 6px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: var(--c-primary); border-radius: 4px; }
    .custom-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); }

    /* --- SIDEBAR --- */
    .sidebar { width: 280px; background: rgba(0,0,0,0.6); border-right: 1px solid var(--c-primary); display: flex; flex-direction: column; z-index: 10;}
    
    .header { 
        padding: 20px; 
        background: rgba(var(--c-primary), 0.1); 
        color: var(--c-primary); 
        font-weight: bold; font-size: 18px; 
        border-bottom: 1px solid var(--c-primary);
        display: flex; align-items: center; gap: 10px;
        text-shadow: 0 0 10px var(--c-primary);
    }

    .tools { padding: 15px; display: flex; flex-direction: column; gap: 12px; border-bottom: 1px solid rgba(var(--c-primary), 0.3); background: rgba(0,0,0,0.4); }
    
    .search-box { 
        display: flex; align-items: center; gap: 10px; 
        background: #000; border: 1px solid var(--c-primary); 
        padding: 8px 12px; border-radius: 4px; box-shadow: inset 0 0 10px rgba(0,0,0,0.8);
    }
    .search-box input { background: transparent; border: none; color: #fff; width: 100%; outline: none; font-family: inherit;}
    .search-box i { color: var(--c-primary); }

    .filters { display: flex; flex-direction: column; gap: 8px; }
    .filters select { 
        width: 100%; background: #000; color: var(--c-primary); 
        border: 1px solid #444; padding: 6px; font-family: inherit; cursor: pointer; transition: 0.2s;
    }
    .filters select:hover { border-color: var(--c-primary); }

    .list { flex: 1; overflow-y: auto; padding: 15px; display: flex; flex-direction: column; gap: 8px; }

    .create-btn { 
        background: rgba(0,0,0,0.5); color: var(--c-primary); border: 1px dashed var(--c-primary); 
        padding: 12px; font-weight: bold; font-family: inherit; cursor: pointer; border-radius: 4px; margin-bottom: 15px;
        transition: all 0.3s; display: flex; justify-content: center; align-items: center; gap: 8px;
    }
    .create-btn:hover { background: var(--c-primary); color: #000; box-shadow: 0 0 15px var(--c-primary); transform: translateY(-2px); }

    .item { 
        display: flex; gap: 12px; padding: 10px; cursor: pointer; 
        border: 1px solid #333; border-radius: 4px; transition: all 0.2s;
        background: #0a0a0a;
    }
    .item:hover { background: #111; border-color: var(--c-primary); transform: translateX(5px); }
    .item.active { background: rgba(var(--c-primary), 0.15); border-left: 4px solid var(--c-primary); border-color: var(--c-primary); }

    .thumb { width: 45px; height: 45px; object-fit: cover; border-radius: 4px; border: 1px solid #444; }
    .item:hover .thumb { border-color: var(--c-primary); }
    
    .info { display: flex; flex-direction: column; justify-content: center; overflow: hidden; flex: 1;}
    .name { font-weight: bold; font-size: 14px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;}
    .meta { display: flex; gap: 5px; }
    .type-pill { font-size: 9px; background: #000; padding: 2px 6px; border-radius: 2px; color: var(--c-primary); border: 1px solid var(--c-primary); font-weight: bold;}
    .tag-pill { font-size: 9px; color: #aaa; background: #222; padding: 2px 6px; border-radius: 2px; border: 1px solid #444;}

    .no-data { text-align: center; font-size: 12px; color: #666; margin-top: 40px; opacity: 0.5; }
    .no-data i { font-size: 24px; margin-bottom: 10px;}

    /* --- MAIN WORKSPACE --- */
    .workspace { flex: 1; padding: 20px; display: flex; flex-direction: column; position: relative; overflow: hidden; background: #050505;}
    
    .entry-card { 
        background: #0a0a0a; border: 1px solid #333; 
        height: 100%; display: flex; flex-direction: column; border-radius: 6px; overflow: hidden; 
        box-shadow: 0 10px 30px rgba(0,0,0,0.8);
    }

    .entry-header { height: 200px; background-size: cover; background-position: center; position: relative; border-bottom: 2px solid var(--c-primary); transition: 0.3s;}
    .header-overlay { background: linear-gradient(to top, #0a0a0a, rgba(0,0,0,0.2)); height: 100%; padding: 25px; display: flex; flex-direction: column; justify-content: flex-end; }
    
    .view-header h1 { margin: 0; color: #fff; font-family: var(--font-head); font-size: 36px; text-shadow: 0 4px 15px rgba(0,0,0,0.9); }
    .badges { display: flex; gap: 8px; margin-top: 10px; }
    .badge { padding: 4px 10px; font-size: 11px; font-weight: bold; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;}
    .badge.main { background: var(--c-primary); color: #000; box-shadow: 0 0 10px var(--c-primary);}
    .badge.tag { background: rgba(0,0,0,0.8); border: 1px solid #666; color: #ddd; }

    .edit-header { display: flex; flex-direction: column; gap: 10px; width: 100%; background: rgba(0,0,0,0.7); padding: 15px; border-radius: 8px; border: 1px solid #444; backdrop-filter: blur(5px);}
    .title-input { font-size: 24px; font-family: var(--font-head); font-weight: bold; background: transparent; border: none; border-bottom: 2px solid var(--c-primary); color: #fff; padding: 5px; outline: none; transition: 0.2s;}
    .title-input:focus { background: rgba(255,255,255,0.05); }
    
    .meta-inputs { display: flex; gap: 10px; align-items: center;}
    .meta-inputs select, .meta-inputs input { background: #000; border: 1px solid #555; color: #fff; padding: 8px; flex: 1; font-family: inherit; border-radius: 4px; outline: none;}
    .meta-inputs select:focus, .meta-inputs input:focus { border-color: var(--c-primary); }
    .img-btn { background: #222; color: #fff; border: 1px solid #555; cursor: pointer; padding: 8px 15px; border-radius: 4px; transition: 0.2s; font-family: inherit; font-weight: bold;}
    .img-btn:hover { border-color: var(--c-primary); color: var(--c-primary); }

    /* TOOLBAR DO EDITOR */
    .toolbar { display: flex; gap: 5px; padding: 10px; background: #000; border-bottom: 1px solid #333; align-items: center; }
    .toolbar button { background: transparent; border: 1px solid transparent; color: #aaa; padding: 6px 12px; cursor: pointer; border-radius: 4px; transition: 0.2s; font-family: inherit; font-size: 12px;}
    .toolbar button:hover { background: #222; color: var(--c-primary); border-color: #444; }
    .toolbar .divider { width: 1px; height: 20px; background: #444; margin: 0 5px; }
    .toolbar .highlight-tool { border-color: var(--c-primary); color: var(--c-primary); font-weight: bold; }
    .toolbar .highlight-tool:hover { background: var(--c-primary); color: #000; }

    .entry-body { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #080808; }
    
    .editor-area { 
        flex: 1; width: 100%; background: transparent; border: none; color: #ddd; 
        resize: none; font-family: inherit; font-size: 15px; outline: none; line-height: 1.6; padding: 20px; box-sizing: border-box;
    }

    .content-reader { flex: 1; padding: 30px; font-size: 15px; line-height: 1.7; color: #ddd; overflow-y: auto; }
    
    /* INJEÇÃO DE ESTILOS NO MODO LEITURA */
    :global(.html-injection h2) { color: var(--c-primary); border-bottom: 1px dashed var(--c-primary); padding-bottom: 5px; margin-top: 30px;}
    :global(.html-injection hr) { border: none; border-top: 1px solid #333; margin: 20px 0; }
    :global(.html-injection ul) { background: rgba(255,255,255,0.02); padding: 15px 15px 15px 35px; border-radius: 4px; border-left: 2px solid var(--c-primary); }
    :global(.html-injection .cyber-link) { color: #00fbff; text-decoration: none; border-bottom: 1px dotted #00fbff; transition: 0.2s; }
    :global(.html-injection .cyber-link:hover) { background: rgba(0, 251, 255, 0.1); }
    :global(.html-injection .attached-img) { max-width: 100%; border: 1px solid #333; border-radius: 4px; margin: 15px 0; box-shadow: 0 5px 15px rgba(0,0,0,0.5); }
    :global(.html-injection .cyber-attachment) { display: inline-flex; align-items: center; gap: 10px; background: #111; border: 1px solid var(--c-primary); color: var(--c-primary); padding: 10px 15px; border-radius: 4px; text-decoration: none; font-weight: bold; margin: 10px 0; transition: 0.2s;}
    :global(.html-injection .cyber-attachment:hover) { background: var(--c-primary); color: #000; box-shadow: 0 0 10px var(--c-primary); }

    .entry-footer { padding: 15px 30px; background: #000; border-top: 1px dashed #333; display: flex; justify-content: space-between; font-size: 11px; color: #666; font-weight: bold;}

    .actions-bar { padding: 15px 20px; background: rgba(0,0,0,0.8); border-top: 1px solid var(--c-primary); display: flex; justify-content: flex-end; align-items: center; gap: 15px; }
    .status-id { margin-right: auto; font-family: monospace; font-size: 11px; color: #555; background: #000; padding: 4px 8px; border-radius: 4px; border: 1px solid #222;}

    .btn { padding: 10px 20px; cursor: pointer; border-radius: 4px; font-weight: bold; border: none; font-size: 13px; font-family: inherit; transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94); display: flex; align-items: center; gap: 8px;}
    .btn.save { background: var(--c-primary); color: #000; }
    .btn.save:hover { box-shadow: 0 0 20px var(--c-primary); transform: scale(1.05); }
    
    .btn.edit { background: transparent; border: 1px solid var(--c-primary); color: var(--c-primary); }
    .btn.edit:hover { background: var(--c-primary); color: #000; box-shadow: 0 0 15px var(--c-primary); }
    
    .btn.cancel { background: transparent; color: #888; border: 1px solid #444; }
    .btn.cancel:hover { background: #222; color: #fff; }
    
    .btn.delete { background: transparent; color: #ff3333; border: 1px solid #ff3333; }
    .btn.delete:hover { background: #ff3333; color: #fff; box-shadow: 0 0 15px #ff3333; }

    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--c-primary); position: relative;}
    .big-icon { font-size: 80px; margin-bottom: 20px; text-shadow: 0 0 20px var(--c-primary); opacity: 0.8;}
    .empty-state h2 { margin: 0 0 10px 0; font-size: 32px; letter-spacing: 4px; text-shadow: 0 0 10px var(--c-primary);}
    .empty-state p { color: #888; font-size: 14px; margin: 0; }
    
    .scanline { position: absolute; top:0; left:0; width: 100%; height: 50px; background: linear-gradient(to bottom, transparent, var(--c-primary), transparent); opacity: 0.1; animation: scan 4s linear infinite; pointer-events: none;}
    @keyframes scan { 0% { top: -10%; } 100% { top: 110%; } }
</style>