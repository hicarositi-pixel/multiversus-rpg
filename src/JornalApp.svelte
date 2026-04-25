<script>
    import { onMount, createEventDispatcher, onDestroy } from 'svelte';
    import { fade, slide, fly } from 'svelte/transition';
    import { MENU_THEMES } from './data/MainMenuThemeDB.js'; 
    import DataHellEntry from './DataHellEntry.svelte'; 
    
    // IMPORTAÇÕES DO NOVO SISTEMA DE LIVROS
    import SystemBook from './SystemBook.svelte';
    import { SystemBookDB } from './SystemBookDB.js';

    export let active = false;

    const dispatch = createEventDispatcher();
    const isGM = game.user.isGM;

// --- TEMA E CONFIGURAÇÃO ---
    let currentThemeId = "default";
    let customThemeColor = "#00ff41";

    try {
        currentThemeId = game.settings.get("multiversus-rpg", "menuTheme") || "default";
        
        // Tenta buscar a cor customizada igual na tela de abertura
        if (game.settings.settings.has("multiversus-rpg.customThemeColor")) {
            customThemeColor = game.settings.get("multiversus-rpg", "customThemeColor");
        } else {
            customThemeColor = localStorage.getItem("multiversus-rpg-custom-color") || "#00ff41";
        }
    } catch (err) {
        console.warn("NEXUS | Erro ao carregar tema no Jornal", err);
    }

    // Reatividade do Tema
    $: isCustomTheme = currentThemeId === 'custom';
    $: baseTheme = MENU_THEMES?.[currentThemeId] || MENU_THEMES?.['default'] || { colors: { primary: '#00ff41', bg: '#000' }, font: 'monospace' };
    
    // Variáveis finais que vão pro CSS
    $: themeColor = isCustomTheme ? customThemeColor : baseTheme.colors.primary;
    $: themeBg = baseTheme.colors.bg;
    $: themeFont = baseTheme.font;

    // --- DADOS (COM PROTEÇÃO) ---
    let newsData = [];
    let categories = ["GERAL"];

    onMount(() => {
        // Inicializa o banco de dados dos livros
        SystemBookDB.init();
    });

    try {
        newsData = game.settings.get("multiversus-rpg", "worldNewsData") || [];
        categories = game.settings.get("multiversus-rpg", "worldNewsCategories") || ["GERAL", "MISSÕES", "RUMORES"];
    } catch (err) {
        console.error("NEXUS | Erro ao carregar configurações do Jornal:", err);
        if (isGM) ui.notifications.error("Erro de Configuração: Adicione 'worldNewsCategories' no main.js!");
    }

    if (!Array.isArray(categories)) categories = ["GERAL"];

    // --- ESTADOS ---
    let viewMode = 'list'; // 'list', 'detail', 'admin', 'admin-datahell', 'book'
    let selectedNews = null;
    let activeCategory = "GERAL"; 
    
    // NOVO: Estado para os Livros
    let activeBookData = null;

    // NOVO: Estado Mobile
    let isSidebarOpen = false;
    let editTabMobile = 'form'; // 'form' ou 'preview' para o admin padrão no celular
    
    // Audio
    let audioPlayer = null;
    let isMuted = false;
    let isPlaying = false;

    // Forms
    let form = createEmptyForm();
    let dataHellForm = createEmptyDataHell();
    let newCategoryName = ""; 
    let showCatInput = false;

    $: filteredNews = newsData.filter(n => (n.category || "GERAL") === activeCategory);

    // --- FACTORIES ---
    function createEmptyForm() {
        return {
            id: null, type: 'standard', category: activeCategory,
            title: "", summary: "", image: "", audio: "", dateGame: "", contentHtml: "",
            dateReal: new Date().toLocaleDateString('pt-BR'),
            bookId: null // Referência para caso seja um Livro
        };
    }

    function createEmptyDataHell() {
        return {
            edition: "#1", date: "01/01/2077", status: "CRÍTICO",
            coverImage: "", 
            cards: [{ title: "MANCHETE", text: "<p>Texto...</p>", image: "", hellQuote: "" }],
            stats: [{ label: "CASOS", value: "0", tooltip: "Info" }],
            trends: []
        };
    }

    // --- GERENCIAMENTO DE CATEGORIAS ---
    async function addCategory() {
        if (!newCategoryName) return;
        if (!categories.includes(newCategoryName.toUpperCase())) {
            categories = [...categories, newCategoryName.toUpperCase()];
            await game.settings.set("multiversus-rpg", "worldNewsCategories", categories);
        }
        newCategoryName = "";
        showCatInput = false;
    }

    async function deleteCategory(cat) {
        if (cat === "GERAL") return ui.notifications.warn("Não pode deletar a categoria padrão.");
        if (!confirm(`Deletar a pasta ${cat}? Notícias nela irão para GERAL.`)) return;

        newsData = newsData.map(n => n.category === cat ? { ...n, category: "GERAL" } : n);
        await game.settings.set("multiversus-rpg", "worldNewsData", newsData);

        categories = categories.filter(c => c !== cat);
        await game.settings.set("multiversus-rpg", "worldNewsCategories", categories);
        activeCategory = "GERAL";
    }

    function selectCategory(cat) {
        activeCategory = cat;
        isSidebarOpen = false; // Fecha sidebar no mobile ao clicar
    }

    // --- DRAG AND DROP ---
    function handleDragStart(event, newsId) {
        event.dataTransfer.setData("text/plain", newsId);
        event.dataTransfer.effectAllowed = "move";
    }
    function handleDragOver(event) {
        event.preventDefault(); 
        event.dataTransfer.dropEffect = "move";
    }
    async function handleDrop(event, targetCategory) {
        event.preventDefault();
        const newsId = event.dataTransfer.getData("text/plain");
        const index = newsData.findIndex(n => n.id === newsId);
        if (index >= 0 && newsData[index].category !== targetCategory) {
            newsData[index].category = targetCategory;
            newsData = [...newsData]; 
            await game.settings.set("multiversus-rpg", "worldNewsData", newsData);
            ui.notifications.info(`Arquivo movido para: ${targetCategory}`);
        }
    }

    // --- AUDIO CONTROL ---
    function playAudio(url) {
        if (!url) return;
        stopAudio();
        const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/user\/\S+|\/ytscreeningroom\?v=))([\w\-]{10,12})\b/);

        if (ytMatch && ytMatch[1]) {
            let videoId = ytMatch[1];
            const iframe = document.createElement('iframe');
            iframe.id = "news-audio-yt";
            iframe.style.display = "none";
            iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}`;
            document.body.appendChild(iframe);
            isPlaying = true;
        } else {
            audioPlayer = new Audio(url);
            audioPlayer.loop = true;
            audioPlayer.muted = isMuted;
            audioPlayer.volume = 0.5;
            audioPlayer.play().catch(e => console.error("Autoplay bloqueado:", e));
            isPlaying = true;
        }
    }

    function stopAudio() {
        if (audioPlayer) { audioPlayer.pause(); audioPlayer = null; }
        const yt = document.getElementById("news-audio-yt");
        if (yt) { yt.src = ""; yt.remove(); }
        isPlaying = false;
    }
    function toggleMute() { isMuted = !isMuted; if (audioPlayer) audioPlayer.muted = isMuted; }

    // --- NAVEGAÇÃO E ABERTURA ---
    async function openNews(news) {
        selectedNews = news;
        
        // NOVO: Se for um Livro de Sistema (SRD)
        if (news.type === 'book') {
            const allBooks = SystemBookDB.getBooks();
            activeBookData = allBooks.find(b => b.id === news.bookId);
            if (activeBookData) {
                viewMode = 'book';
            } else {
                ui.notifications.error("Arquivo mestre do livro não encontrado.");
            }
            return;
        }

        viewMode = 'detail';
        if (news.audio) playAudio(news.audio);
    }

    function backToList() {
        stopAudio();
        selectedNews = null;
        activeBookData = null;
        viewMode = 'list';
    }
    function closeApp() { stopAudio(); dispatch('close'); }

    // --- CRIAÇÃO E EDIÇÃO ---
    let showCreateOptions = false;

async function startCreate(type) {
        showCreateOptions = false;
        form = createEmptyForm();
        form.id = foundry.utils.randomID();
        form.category = activeCategory; 
        
        if (type === 'datahell') {
            form.type = 'datahell';
            form.title = "NOVA EDIÇÃO DATA HELL";
            form.image = "https://placehold.co/400x200/2a0a10/ff0055?text=DATA+HELL";
            dataHellForm = createEmptyDataHell();
            viewMode = 'admin-datahell';
        } else if (type === 'book') {
            // Apenas prepara o formulário básico, mas NÃO salva nem abre ainda.
            form.type = 'book';
            form.title = "Novo Manual do Sistema";
            form.image = "https://placehold.co/400x200/0a0a0c/00ff41?text=SRD+LIVRO+DE+REGRAS";
            form.summary = "Manual de regras interativo. Abra para editar.";
            
            // Joga o Mestre para a tela de edição do Jornal para ele alterar os dados acima
            viewMode = 'admin'; 
        } else {
            form.type = 'standard';
            viewMode = 'admin';
        }
    }

    async function handleBookMetaUpdate(event) {
        const { title, image, summary } = event.detail;
        
        // Encontra o livro na lista do Jornal e atualiza
        const index = newsData.findIndex(n => n.bookId === activeBookData.id);
        if (index !== -1) {
            newsData[index].title = title;
            newsData[index].image = image;
            newsData[index].summary = summary;
            
            // Salva a lista atualizada
            await game.settings.set("multiversus-rpg", "worldNewsData", newsData);
        }
    } // <--- FALTAVA ESSA CHAVE AQUI

    function editNews(news) {
        if (news.type === 'datahell') {
            form = { ...news }; 
            dataHellForm = news.dataHell || createEmptyDataHell();
            viewMode = 'admin-datahell';
        } else if (news.type === 'book') {
            // Edição de Livro é feita abrindo ele
            openNews(news);
        } else {
            form = { ...news };
            viewMode = 'admin';
        }
    }

    async function saveNews() {
        // A lógica de criar o banco de dados do livro entra AQUI dentro do saveNews
        if (form.type === 'book' && !form.bookId) {
            const newBook = await SystemBookDB.createNewBook(form.title);
            form.bookId = newBook.id;
        }

        const index = newsData.findIndex(n => n.id === form.id);
        
        if (form.type === 'datahell') {
            form.dataHell = dataHellForm;
            if (dataHellForm.coverImage && dataHellForm.coverImage.trim() !== "") {
                form.image = dataHellForm.coverImage;
            }
        }

        if (index >= 0) newsData[index] = { ...form };
        else newsData = [form, ...newsData]; 
        
        await game.settings.set("multiversus-rpg", "worldNewsData", newsData);
        viewMode = 'list';
    }

    async function deleteNews(id) {
        if (!confirm("Deletar arquivo permanentemente?")) return;
        newsData = newsData.filter(n => n.id !== id);
        await game.settings.set("multiversus-rpg", "worldNewsData", newsData);
        viewMode = 'list';
    }

    onDestroy(() => stopAudio());
</script>

<div class="journal-container" in:fade={{duration: 300}} 
     style="--primary: {themeColor}; --bg-color: {themeBg}; --font-main: {themeFont}">
    
    <div class="scanlines"></div>

{#if viewMode === 'book' && activeBookData}
    <div class="book-layer" in:fade>
        <SystemBook 
            bookData={activeBookData} 
            isGM={isGM} 
            on:closeBook={backToList} 
            on:updateMeta={handleBookMetaUpdate} 
        />
    </div>
    {:else}
        <header class="journal-header">
            <div class="brand">
                <button class="btn-mobile-menu" on:click={() => isSidebarOpen = !isSidebarOpen}>
                    <i class="fas fa-bars"></i>
                </button>
                <i class="fas fa-globe-americas spin-icon"></i> DATA HELL NEWS
            </div>
            <div class="controls">
                {#if isGM && viewMode === 'list'}
                    <div class="create-wrapper">
                        <button class="btn-admin" on:click={() => showCreateOptions = !showCreateOptions}>
                            <i class="fas fa-plus"></i><span class="hide-mobile"> NOVA PÁGINA</span>
                        </button>
                        {#if showCreateOptions}
                            <div class="create-dropdown" transition:slide>
                                <button on:click={() => startCreate('standard')}>NOTÍCIA PADRÃO</button>
                                <button class="dh-opt" on:click={() => startCreate('datahell')}>DATA HELL (ESTILO)</button>
                                <button class="srd-opt" on:click={() => startCreate('book')}>LIVRO SRD (REGRAS)</button>
                            </div>
                        {/if}
                    </div>
                {/if}
                <button class="btn-close" on:click={closeApp}><i class="fas fa-power-off"></i> <span class="hide-mobile">SAIR</span></button>
            </div>
        </header>

        <div class="journal-body-layout">
            
            {#if viewMode === 'list'}
                
                {#if isSidebarOpen}
                    <div class="mobile-overlay" transition:fade on:click={() => isSidebarOpen = false}></div>
                {/if}

                <nav class="category-sidebar custom-scroll" class:mobile-open={isSidebarOpen}>
                    <div class="cat-header-mobile">PASTAS <button class="btn-close-mobile" on:click={() => isSidebarOpen = false}>✕</button></div>
                    <div class="cat-header hide-mobile">PASTAS DO SISTEMA</div>
                    
                    <div class="cat-list">
                        {#each categories as cat}
                            <div class="cat-item" class:active={activeCategory === cat} on:click={() => selectCategory(cat)}
                                 on:dragover={handleDragOver} on:drop={(e) => handleDrop(e, cat)}>
                                <div class="cat-name">
                                    <i class="fas {activeCategory === cat ? 'fa-folder-open' : 'fa-folder'}"></i>
                                    {cat}
                                </div>
                                {#if isGM && cat !== "GERAL"}
                                    <button class="del-cat" on:click|stopPropagation={() => deleteCategory(cat)}>×</button>
                                {/if}
                            </div>
                        {/each}
                    </div>

                    {#if isGM}
                        <div class="cat-creator">
                            {#if showCatInput}
                                <div class="cat-input-group" transition:slide>
                                    <input type="text" bind:value={newCategoryName} placeholder="Nome..." autoFocus on:keydown={e => e.key === 'Enter' && addCategory()}>
                                    <button on:click={addCategory}>OK</button>
                                </div>
                            {:else}
                                <button class="add-cat-btn" on:click={() => showCatInput = true}>
                                    <i class="fas fa-plus-circle"></i> NOVA PASTA
                                </button>
                            {/if}
                        </div>
                    {/if}
                </nav>

                <div class="news-grid-area custom-scroll">
                    <div class="news-grid" in:slide={{y:20, duration:400}}>
                        {#each filteredNews as news (news.id)}
                            <div 
                                class="news-card" 
                                class:dh-card-style={news.type === 'datahell'} 
                                class:book-card-style={news.type === 'book'} 
                                on:click={() => openNews(news)}
                                draggable={isGM} 
                                on:dragstart={(e) => handleDragStart(e, news.id)}
                            >
                                <div class="card-img" style="background-image: url('{news.image}')">
                                    <div class="date-overlay">{news.dateReal}</div>
                                </div>
                                <div class="card-info">
                                    <div class="game-date">
                                        <span class="bullet">•</span> 
                                        {#if news.type === 'book'} MATERIAL DO SISTEMA {:else} {news.dateGame} {/if}
                                    </div>
                                    <h3>{news.title}</h3>
                                    <p>{news.summary}</p>
                                    {#if isGM}
                                        <div class="gm-tools">
                                            <button class="gm-btn edit" on:click|stopPropagation={() => editNews(news)}>
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            {#if news.type === 'book'}
                                                <button class="gm-btn delete" style="margin-left: 5px; color:#ff5555" on:click|stopPropagation={() => deleteNews(news.id)}>
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            {/if}
                                        </div>
                                    {/if}
                                </div>
                                <div class="card-glow"></div>
                            </div>
                        {/each}
                        
                        {#if filteredNews.length === 0}
                            <div class="empty-state">
                                <i class="fas fa-folder-open"></i>
                                <span>PASTA VAZIA</span>
                            </div>
                        {/if}
                    </div>
                </div>
            {/if}

            {#if viewMode === 'detail' && selectedNews && selectedNews.type !== 'book'}
                <div class="news-reader full-width" in:fade>
                    <div class="reader-toolbar">
                        <button class="btn-back" on:click={backToList}><i class="fas fa-chevron-left"></i> VOLTAR</button>
                        <div class="audio-controls">
                            {#if selectedNews.audio}
                                <button class="btn-audio" class:muted={isMuted} on:click={toggleMute}>
                                    {#if isMuted} <i class="fas fa-volume-mute"></i> OFF {:else} <i class="fas fa-volume-up"></i> TOCANDO... {/if}
                                </button>
                            {/if}
                        </div>
                    </div>

                    {#if selectedNews.type === 'datahell'}
                        <DataHellEntry data={selectedNews.dataHell} mode="view" />
                    {:else}
                        <div class="reader-header" style="background-image: url('{selectedNews.image}');">
                            <div class="header-overlay"></div>
                            <div class="header-content">
                                <div class="title-block">
                                    <span class="meta-tag">{selectedNews.dateGame}</span>
                                    <h1>{selectedNews.title}</h1>
                                </div>
                            </div>
                        </div>
                        <div class="reader-scroll-area custom-scroll">
                            <div class="reader-content html-injection">
                                {@html selectedNews.contentHtml}
                            </div>
                            <div class="end-mark">/// FIM DA TRANSMISSÃO ///</div>
                        </div>
                    {/if}
                </div>
            {/if}

            {#if viewMode === 'admin-datahell' && isGM}
                <div class="admin-full-wrapper" in:slide>
                    <div class="meta-editor-bar">
                        <span style="color:#ff0055; font-weight:bold; margin-right: 10px;">EDITOR DATA HELL</span>
                        <label>Título (Lista): <input type="text" bind:value={form.title}></label>
                        <label>Resumo (Lista): <input type="text" bind:value={form.summary}></label>
                        <div class="actions" style="margin-left: auto;">
                            <button class="save" on:click={saveNews} title="Salvar">💾 SALVAR</button>
                            <button class="cancel" on:click={() => viewMode = 'list'} title="Cancelar">❌</button>
                        </div>
                    </div>
                    <div style="flex: 1; overflow: hidden;">
                        <DataHellEntry bind:data={dataHellForm} mode="edit" />
                    </div>
                </div>
            {/if}

            {#if viewMode === 'admin' && isGM}
                <div class="admin-panel full-width" in:slide>
                    
                    <div class="mobile-edit-tabs">
                        <button class:active={editTabMobile === 'form'} on:click={() => editTabMobile = 'form'}>FORMULÁRIO</button>
                        <button class:active={editTabMobile === 'preview'} on:click={() => editTabMobile = 'preview'}>PREVIEW</button>
                    </div>

                    <div class="admin-sidebar custom-scroll" class:mobile-hidden={editTabMobile !== 'form'}>
                        <h3><i class="fas fa-terminal"></i> EDITOR PADRÃO</h3>
                        <div class="form-group"><label>Título</label><input type="text" bind:value={form.title}></div>
                        <div class="form-group"><label>Data In-Game</label><input type="text" bind:value={form.dateGame}></div>
                        <div class="form-group"><label>Imagem URL</label><input type="text" bind:value={form.image}></div>
                        <div class="form-group"><label>Áudio</label><input type="text" bind:value={form.audio}></div>
                        <div class="form-group"><label>Resumo</label><textarea rows="3" bind:value={form.summary}></textarea></div>
                        <div class="form-group full"><label>HTML Content</label><textarea class="code-editor" rows="10" bind:value={form.contentHtml}></textarea></div>
                        <div class="admin-actions">
                            <button class="save" on:click={saveNews}>SALVAR</button>
                            <button class="cancel" on:click={() => viewMode = 'list'}>CANCELAR</button>
                            {#if form.id}<button class="delete" on:click={() => deleteNews(form.id)}>🗑️</button>{/if}
                        </div>
                    </div>
                    
                    <div class="admin-preview custom-scroll" class:mobile-hidden={editTabMobile !== 'preview'}>
                        <div class="html-injection preview-body">{@html form.contentHtml}</div>
                    </div>
                </div>
            {/if}

        </div>
    {/if}
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

    /* LAYOUT GERAL (Herdando as variáveis globais do Menu) */
/* LAYOUT GERAL (Adaptável para Tela Cheia ou Janelas do Foundry) */
    .journal-container { 
        position: relative; /* Mudou de absolute para relative */
        width: 100%; height: 100%; /* Preenche exatamente o espaço da ficha */
        background: radial-gradient(circle at center, #111 0%, #000 100%); 
        color: #ddd; display: flex; flex-direction: column; z-index: 10; 
        font-family: 'Share Tech Mono', monospace; 
        --border-c: rgba(255,255,255,0.1); 
        overflow: hidden; /* Garante que nada vaze pelas bordas da ficha */
    }
    
    .scanlines { position: absolute; inset: 0; pointer-events: none; z-index: 0; background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1)); background-size: 100% 4px; opacity: 0.6; }
    .book-layer { position: absolute; inset: 0; z-index: 200; background: #000; }

    /* SCROLLBAR */
    .custom-scroll::-webkit-scrollbar { width: 6px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: var(--primary); border-radius: 4px; }

    /* HEADER */
    .journal-header { height: 60px; background: rgba(0,0,0,0.8); border-bottom: 2px solid var(--primary); display: flex; align-items: center; justify-content: space-between; padding: 0 20px; box-shadow: 0 0 20px rgba(0,0,0,0.5); z-index: 20; flex-shrink: 0; }
    .brand { font-size: 1.3rem; font-weight: bold; color: var(--primary); letter-spacing: 2px; display: flex; align-items: center; gap: 10px; }
    .spin-icon { animation: spin 10s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    .btn-mobile-menu { display: none; background: transparent; border: 1px solid var(--primary); color: var(--primary); padding: 5px 10px; border-radius: 4px; cursor: pointer; transition: 0.2s; }
    .btn-mobile-menu:hover { background: var(--primary); color: #000; }

    /* CORPO E SIDEBAR */
    .journal-body-layout { flex: 1; display: flex; overflow: hidden; position: relative; z-index: 10; }
    .mobile-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.7); z-index: 80; }

    .category-sidebar { width: 250px; background: rgba(10,10,10,0.95); border-right: 1px solid var(--border-c); display: flex; flex-direction: column; flex-shrink: 0; z-index: 100; transition: transform 0.3s; }
    .cat-header { padding: 15px; color: var(--primary); font-weight: bold; border-bottom: 1px dashed var(--border-c); font-size: 0.9rem; letter-spacing: 1px; }
    .cat-header-mobile { display: none; padding: 15px; color: var(--primary); font-weight: bold; border-bottom: 1px solid var(--border-c); justify-content: space-between; align-items: center; }
    .btn-close-mobile { background: transparent; border: none; color: #fff; font-size: 1.2rem; cursor: pointer; transition: 0.2s;}
    .btn-close-mobile:hover { color: var(--primary); }

    .cat-list { flex: 1; overflow-y: auto; padding: 10px; }
    .cat-item { padding: 10px 15px; margin-bottom: 5px; cursor: pointer; border: 1px solid transparent; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; transition: 0.2s; }
    .cat-item:hover { background: rgba(255,255,255,0.05); }
    /* Ajustei a sombra inset e a cor para usar o var(--primary) */
    .cat-item.active { background: rgba(255,255,255,0.05); border-color: var(--primary); color: var(--primary); font-weight: bold; box-shadow: inset 2px 0 0 var(--primary); }
    .cat-name { display: flex; gap: 10px; align-items: center; }
    .del-cat { background: none; border: none; color: #555; cursor: pointer; font-weight: bold; transition: 0.2s; }
    .del-cat:hover { color: #ff5555; }
    
    .cat-creator { padding: 15px; border-top: 1px dashed var(--border-c); }
    .add-cat-btn { width: 100%; background: #222; border: 1px solid #444; color: #888; padding: 8px; cursor: pointer; transition: 0.2s; display: flex; gap: 5px; justify-content: center; }
    .add-cat-btn:hover { color: var(--primary); border-color: var(--primary); }
    .cat-input-group { display: flex; gap: 5px; }
    .cat-input-group input { flex: 1; background: #000; border: 1px solid var(--primary); color: #fff; padding: 5px; outline: none; }
    .cat-input-group button { background: var(--primary); color: #000; border: none; padding: 5px 10px; font-weight: bold; cursor: pointer; }

    /* GRID DE NOTÍCIAS */
    .news-grid-area { flex: 1; overflow-y: auto; background: rgba(0,0,0,0.3); }
    .news-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; padding: 30px; }
    
    .news-card { background: rgba(20,20,20,0.9); border: 1px solid var(--border-c); height: 320px; display: flex; flex-direction: column; transition: 0.3s; cursor: pointer; position: relative; overflow: hidden; border-radius: 4px; }
    .news-card:hover { transform: translateY(-5px); border-color: var(--primary); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .card-img { flex: 1.2; background-size: cover; background-position: center; position: relative; filter: grayscale(0.2); transition: 0.3s; border-bottom: 1px solid var(--border-c); }
    .news-card:hover .card-img { filter: grayscale(0); }
    .date-overlay { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.8); color: var(--primary); padding: 4px 8px; font-size: 0.7rem; border: 1px solid var(--primary); border-radius: 2px;}
    
    .card-info { padding: 15px; background: linear-gradient(to bottom, #151515, #0a0a0a); height: 150px; position: relative; }
    .game-date { color: var(--primary); font-size: 0.7rem; margin-bottom: 8px; opacity: 0.8; font-weight: bold; }
    .card-info h3 { margin: 0 0 8px 0; color: #fff; font-size: 1.1rem; line-height: 1.2; font-weight: normal; }
    .card-info p { color: #888; font-size: 0.85rem; margin: 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    .gm-tools { position: absolute; bottom: 10px; right: 10px; display: flex; gap: 5px; }
    .gm-btn { background: #222; color: #aaa; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; transition: 0.2s;}
    .gm-btn:hover { color: var(--primary); background: #000; border: 1px solid var(--primary); }

    /* ESTILOS DE CARDS ESPECIAIS (Mantidos para destaque, mas usando a primária para o Data Hell e Livro) */
    .dh-card-style { border-color: var(--primary) !important; }
    .dh-card-style h3 { color: var(--primary) !important; font-family: 'Impact'; letter-spacing: 1px; }
    
    /* O Card de Livro (SRD) agora usa uma cor secundária fixa do CSS ou branca para diferenciar */
    .book-card-style { border-color: #fff !important; box-shadow: inset 0 0 20px rgba(255,255,255,0.05); }
    .book-card-style h3 { color: #fff !important; font-family: 'Share Tech Mono'; text-shadow: 0 0 5px rgba(255,255,255,0.3); text-transform: uppercase; }
    .book-card-style .game-date { color: #fff; }

    /* BOTÕES & DROPDOWN GERAIS */
    button { cursor: pointer; border: none; font-weight: bold; text-transform: uppercase; transition: 0.2s; font-family: inherit; }
    .btn-close { background: transparent; border: 1px solid #555; color: #aaa; padding: 6px 15px; border-radius: 4px;}
    .btn-close:hover { border-color: #ff3333; color: #ff3333; }
    .btn-admin { background: var(--primary); color: #000; padding: 6px 15px; margin-right: 10px; border-radius: 4px; }
    .btn-admin:hover { background: #fff; box-shadow: 0 0 15px var(--primary); }

    .create-wrapper { position: relative; display: inline-block; }
    .create-dropdown { position: absolute; top: 100%; right: 10px; background: #111; border: 1px solid var(--primary); z-index: 100; display: flex; flex-direction: column; width: 220px; box-shadow: 0 10px 30px #000; margin-top: 5px; border-radius: 4px; overflow: hidden;}
    .create-dropdown button { background: transparent; color: #fff; padding: 15px; text-align: left; border: none; border-bottom: 1px solid #333; transition: 0.2s;}
    .create-dropdown button:last-child { border-bottom: none; }
    .create-dropdown button:hover { background: rgba(255,255,255,0.1); color: var(--primary); padding-left: 20px; }
    .dh-opt { font-family: 'Impact'; letter-spacing: 1px; }

    /* MODOS DE VISUALIZAÇÃO GERAIS */
    .full-width { width: 100%; height: 100%; display: flex; flex-direction: column; }
    .admin-full-wrapper { width: 100%; height: 100%; display: flex; flex-direction: column; background: #000; }
    .reader-toolbar { position: sticky; top: 0; background: rgba(0,0,0,0.95); z-index: 50; padding: 10px 20px; display: flex; justify-content: space-between; border-bottom: 1px solid #333; align-items: center;}
    .btn-back { background: transparent; color: #ccc; border: 1px solid #555; padding: 6px 15px; border-radius: 4px;}
    .btn-back:hover { border-color: #fff; color: #fff; }

    /* EDITOR PADRÃO E PREVIEW */
    .admin-panel { display: flex; height: 100%; }
    .admin-sidebar { width: 400px; background: #08080a; padding: 25px; border-right: 1px solid #222; display: flex; flex-direction: column; gap: 15px; flex-shrink: 0; }
    .admin-sidebar h3 { margin: 0; color: var(--primary); border-bottom: 1px dashed var(--primary); padding-bottom: 10px; }
    
    .form-group { display: flex; flex-direction: column; gap: 5px; }
    .form-group label { color: var(--primary); font-size: 0.8rem; font-weight: bold;}
    .form-group input, .form-group textarea { background: #000; border: 1px solid #333; color: #fff; padding: 10px; font-family: monospace; outline: none; border-radius: 4px; transition: 0.2s;}
    .form-group input:focus, .form-group textarea:focus { border-color: var(--primary); }
    .form-group.full { flex: 1; display: flex; flex-direction: column; }
    .code-editor { flex: 1; color: #aaffaa !important; resize: none; line-height: 1.4; }
    
    .admin-actions { display: flex; gap: 10px; margin-top: auto; padding-top: 15px; }
    .admin-actions button { flex: 1; padding: 12px; border-radius: 4px;}
    .save { background: var(--primary); color: #000; }
    .save:hover { background: #fff; }
    .cancel { background: #333; color: #fff; }
    .cancel:hover { background: #555; }
    .delete { background: #500; color: #fff; flex: 0; min-width: 50px; }
    .delete:hover { background: #f00; }
    
    .admin-preview { flex: 1; background: #111; padding: 40px; overflow-y: auto; }
    .preview-body { background: #050505; padding: 40px; border: 1px solid #222; min-height: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }

    .mobile-edit-tabs { display: none; background: #08080a; border-bottom: 1px solid var(--primary); }
    .mobile-edit-tabs button { flex: 1; background: transparent; padding: 15px; color: #888; border-bottom: 3px solid transparent; }
    .mobile-edit-tabs button.active { color: var(--primary); border-bottom-color: var(--primary); background: rgba(255,255,255,0.05); }

    /* RESPONSIVIDADE (MOBILE V2) */
    @media (max-width: 800px) {
        .btn-mobile-menu { display: block; }
        .hide-mobile { display: none; }
        .cat-header-mobile { display: flex; }
        
        .journal-header { padding: 0 15px; }
        .news-grid { padding: 15px; grid-template-columns: 1fr; }
        
        /* Drawer Sidebar */
        .category-sidebar { position: absolute; left: 0; top: 0; height: 100%; max-width: 85%; transform: translateX(-100%); box-shadow: 5px 0 15px rgba(0,0,0,0.8); }
        .category-sidebar.mobile-open { transform: translateX(0); }
        
        /* Editor Vertical com Abas */
        .admin-panel { flex-direction: column; }
        .mobile-edit-tabs { display: flex; }
        .mobile-hidden { display: none !important; }
        .admin-sidebar { width: 100%; border-right: none; flex: 1; }
        .admin-preview { padding: 0; }
        .preview-body { border: none; box-shadow: none; padding: 20px;}
        
        .create-dropdown { right: 0; width: 100%; position: fixed; bottom: 0; top: auto; border-radius: 12px 12px 0 0; }
    }
</style>