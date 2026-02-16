<script>
    import { onMount, createEventDispatcher, onDestroy } from 'svelte';
    import { fade, slide, fly } from 'svelte/transition';
    import { MENU_THEMES } from './data/MainMenuThemeDB.js'; 
    import DataHellEntry from './DataHellEntry.svelte'; 

    export let active = false;

    const dispatch = createEventDispatcher();
    const isGM = game.user.isGM;

    // --- TEMA E CONFIGURAÇÃO ---
    let currentThemeId = game.settings.get("multiversus-rpg", "menuTheme") || "default";
    $: theme = MENU_THEMES?.[currentThemeId] || MENU_THEMES?.['default'] || { colors: { primary: '#00ff41', bg: '#000' }, font: 'monospace' };

// --- DADOS (COM PROTEÇÃO) ---
    let newsData = [];
    let categories = ["GERAL"];

    try {
        // Tenta buscar dados
        newsData = game.settings.get("multiversus-rpg", "worldNewsData") || [];
        
        // Tenta buscar categorias (O QUE CAUSOU O ERRO)
        categories = game.settings.get("multiversus-rpg", "worldNewsCategories") || ["GERAL", "MISSÕES", "RUMORES"];
    } catch (err) {
        console.error("NEXUS | Erro ao carregar configurações do Jornal:", err);
        // Fallback para não travar a tela
        if (isGM) ui.notifications.error("Erro de Configuração: Adicione 'worldNewsCategories' no main.js!");
    }

    // Garante que é array
    if (!Array.isArray(categories)) categories = ["GERAL"];

    // --- ESTADOS ---
    let viewMode = 'list'; 
    let selectedNews = null;
    let activeCategory = "GERAL"; // Categoria selecionada atualmente
    
    // Audio
    let audioPlayer = null;
    let isMuted = false;
    let isPlaying = false;

    // Forms
    let form = createEmptyForm();
    let dataHellForm = createEmptyDataHell();
    let newCategoryName = ""; // Input para nova categoria
    let showCatInput = false;

    // Filtro Reativo
    $: filteredNews = newsData.filter(n => (n.category || "GERAL") === activeCategory);

    // --- FACTORIES ---
    function createEmptyForm() {
        return {
            id: null, type: 'standard', category: activeCategory,
            title: "", summary: "", image: "", audio: "", dateGame: "", contentHtml: "",
            dateReal: new Date().toLocaleDateString('pt-BR')
        };
    }

    function createEmptyDataHell() {
        return {
            edition: "#1", date: "01/01/2077", status: "CRÍTICO",
            // Garante que a imagem de capa exista no objeto
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

        // Move noticias para GERAL
        newsData = newsData.map(n => n.category === cat ? { ...n, category: "GERAL" } : n);
        await game.settings.set("multiversus-rpg", "worldNewsData", newsData);

        // Remove Categoria
        categories = categories.filter(c => c !== cat);
        await game.settings.set("multiversus-rpg", "worldNewsCategories", categories);
        
        activeCategory = "GERAL";
    }

    function selectCategory(cat) {
        activeCategory = cat;
    }

    // --- DRAG AND DROP (Mover Notícia) ---
    function handleDragStart(event, newsId) {
        event.dataTransfer.setData("text/plain", newsId);
        event.dataTransfer.effectAllowed = "move";
    }

    function handleDragOver(event) {
        event.preventDefault(); // Necessário para permitir o drop
        event.dataTransfer.dropEffect = "move";
    }

    async function handleDrop(event, targetCategory) {
        event.preventDefault();
        const newsId = event.dataTransfer.getData("text/plain");
        
        const index = newsData.findIndex(n => n.id === newsId);
        if (index >= 0) {
            // Se a categoria for diferente, move
            if (newsData[index].category !== targetCategory) {
                newsData[index].category = targetCategory;
                // Força atualização reativa do array
                newsData = [...newsData]; 
                await game.settings.set("multiversus-rpg", "worldNewsData", newsData);
                ui.notifications.info(`Notícia movida para: ${targetCategory}`);
            }
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

    function toggleMute() {
        isMuted = !isMuted;
        if (audioPlayer) audioPlayer.muted = isMuted;
    }

    // --- NAVEGAÇÃO ---
    function openNews(news) {
        selectedNews = news;
        viewMode = 'detail';
        if (news.audio) playAudio(news.audio);
    }

    function backToList() {
        stopAudio();
        selectedNews = null;
        viewMode = 'list';
    }

    function closeApp() { stopAudio(); dispatch('close'); }

    // --- CRIAÇÃO E EDIÇÃO ---
    let showCreateOptions = false;

    function startCreate(type) {
        showCreateOptions = false;
        form = createEmptyForm();
        form.id = foundry.utils.randomID();
        // Garante que cria na categoria que estamos vendo
        form.category = activeCategory; 
        
        if (type === 'datahell') {
            form.type = 'datahell';
            form.title = "NOVA EDIÇÃO DATA HELL";
            form.image = "https://placehold.co/400x200/2a0a10/ff0055?text=DATA+HELL";
            dataHellForm = createEmptyDataHell();
            viewMode = 'admin-datahell';
        } else {
            form.type = 'standard';
            viewMode = 'admin';
        }
    }

    function editNews(news) {
        if (news.type === 'datahell') {
            form = { ...news }; 
            dataHellForm = news.dataHell || createEmptyDataHell();
            viewMode = 'admin-datahell';
        } else {
            form = { ...news };
            viewMode = 'admin';
        }
    }

    async function saveNews() {
        const index = newsData.findIndex(n => n.id === form.id);
        
        // --- CORREÇÃO DA IMAGEM E SINCRONIA DATA HELL ---
        if (form.type === 'datahell') {
            form.dataHell = dataHellForm;
            // Se a capa foi definida no editor DataHell, usa ela na lista
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
     style="--primary: {theme.colors.primary}; --bg-color: {theme.colors.bg}; --font-main: {theme.font}">
    
    <div class="scanlines"></div>

    <header class="journal-header">
        <div class="brand"><i class="fas fa-globe-americas spin-icon"></i> DATA HELL NEWS</div>
        <div class="controls">
            {#if isGM && viewMode === 'list'}
                <div class="create-wrapper">
                    <button class="btn-admin" on:click={() => showCreateOptions = !showCreateOptions}>
                        <i class="fas fa-plus"></i> NOVA PÁGINA
                    </button>
                    {#if showCreateOptions}
                        <div class="create-dropdown" transition:slide>
                            <button on:click={() => startCreate('standard')}>NOTÍCIA PADRÃO</button>
                            <button class="dh-opt" on:click={() => startCreate('datahell')}>DATA HELL (ESTILO)</button>
                        </div>
                    {/if}
                </div>
            {/if}
            <button class="btn-close" on:click={closeApp}><i class="fas fa-power-off"></i> SAIR</button>
        </div>
    </header>

    <div class="journal-body-layout">
        
        {#if viewMode === 'list'}
            
            <nav class="category-sidebar">
                <div class="cat-header">PASTAS DO SISTEMA</div>
                
                <div class="cat-list custom-scroll">
                    {#each categories as cat}
                        <div 
                            class="cat-item" 
                            class:active={activeCategory === cat}
                            on:click={() => selectCategory(cat)}
                            on:dragover={handleDragOver}
                            on:drop={(e) => handleDrop(e, cat)}
                        >
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
                            on:click={() => openNews(news)}
                            draggable={isGM} 
                            on:dragstart={(e) => handleDragStart(e, news.id)}
                        >
                            <div class="card-img" style="background-image: url('{news.image}')">
                                <div class="date-overlay">{news.dateReal}</div>
                            </div>
                            <div class="card-info">
                                <div class="game-date"><span class="bullet">•</span> {news.dateGame}</div>
                                <h3>{news.title}</h3>
                                <p>{news.summary}</p>
                                {#if isGM}
                                    <div class="gm-tools">
                                        <button class="gm-btn edit" on:click|stopPropagation={() => editNews(news)}>
                                            <i class="fas fa-edit"></i>
                                        </button>
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

        {#if viewMode === 'detail' && selectedNews}
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
                <div class="admin-sidebar custom-scroll">
                    <h3><i class="fas fa-terminal"></i> EDITOR PADRÃO</h3>
                    <div class="form-group"><label>Título</label><input type="text" bind:value={form.title}></div>
                    <div class="form-group"><label>Data In-Game</label><input type="text" bind:value={form.dateGame}></div>
                    <div class="form-group"><label>Imagem URL</label><input type="text" bind:value={form.image}></div>
                    <div class="form-group"><label>Áudio</label><input type="text" bind:value={form.audio}></div>
                    <div class="form-group"><label>Resumo</label><textarea rows="3" bind:value={form.summary}></textarea></div>
                    <div class="form-group full"><label>HTML Content</label><textarea class="code-editor" rows="15" bind:value={form.contentHtml}></textarea></div>
                    <div class="admin-actions">
                        <button class="save" on:click={saveNews}>SALVAR</button>
                        <button class="cancel" on:click={() => viewMode = 'list'}>CANCELAR</button>
                        {#if form.id}<button class="delete" on:click={() => deleteNews(form.id)}>🗑️</button>{/if}
                    </div>
                </div>
                <div class="admin-preview custom-scroll">
                    <div class="html-injection preview-body">{@html form.contentHtml}</div>
                </div>
            </div>
        {/if}

    </div>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

    /* LAYOUT GERAL */
    .journal-container {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: radial-gradient(circle at center, #111 0%, #000 100%);
        color: #ddd; display: flex; flex-direction: column;
        z-index: 100; font-family: 'Share Tech Mono', monospace;
        --border-c: rgba(255,255,255,0.1);
    }
    .scanlines { position: absolute; inset: 0; pointer-events: none; z-index: 0; background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1)); background-size: 100% 4px; opacity: 0.6; }
    
    /* SCROLLBAR */
    .custom-scroll::-webkit-scrollbar { width: 8px; background: #000; }
    .custom-scroll::-webkit-scrollbar-thumb { background: var(--primary); border-radius: 4px; }

    /* HEADER */
    .journal-header { height: 60px; background: rgba(0,0,0,0.8); border-bottom: 2px solid var(--primary); display: flex; align-items: center; justify-content: space-between; padding: 0 25px; box-shadow: 0 0 20px rgba(var(--primary), 0.2); z-index: 20; backdrop-filter: blur(5px); flex-shrink: 0; }
    .brand { font-size: 1.4rem; font-weight: bold; color: var(--primary); letter-spacing: 3px; display: flex; align-items: center; gap: 10px; }
    .spin-icon { animation: spin 10s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    /* CORPO PRINCIPAL - FLEX PARA SIDEBAR + GRID */
    .journal-body-layout { flex: 1; display: flex; overflow: hidden; position: relative; z-index: 10; }

    /* --- SIDEBAR DE CATEGORIAS --- */
    .category-sidebar {
        width: 250px; background: rgba(10,10,10,0.95); border-right: 1px solid var(--border-c);
        display: flex; flex-direction: column; flex-shrink: 0;
    }
    .cat-header {
        padding: 15px; color: var(--primary); font-weight: bold; border-bottom: 1px dashed var(--border-c);
        font-size: 0.9rem; letter-spacing: 1px;
    }
    .cat-list { flex: 1; overflow-y: auto; padding: 10px; }
    .cat-item {
        padding: 10px 15px; margin-bottom: 5px; cursor: pointer; border: 1px solid transparent; border-radius: 4px;
        display: flex; justify-content: space-between; align-items: center; transition: 0.2s;
    }
    .cat-item:hover { background: rgba(255,255,255,0.05); border-color: #333; }
    .cat-item.active { background: rgba(var(--primary), 0.1); border-color: var(--primary); color: var(--primary); font-weight: bold; box-shadow: inset 0 0 10px rgba(0,0,0,0.5); }
    .cat-name { display: flex; gap: 10px; align-items: center; }
    .del-cat { background: none; border: none; color: #555; cursor: pointer; font-weight: bold; }
    .del-cat:hover { color: #f00; }

    .cat-creator { padding: 15px; border-top: 1px dashed var(--border-c); }
    .add-cat-btn { width: 100%; background: #222; border: 1px solid #444; color: #888; padding: 8px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 5px; }
    .add-cat-btn:hover { color: var(--primary); border-color: var(--primary); }
    .cat-input-group { display: flex; gap: 5px; }
    .cat-input-group input { flex: 1; background: #000; border: 1px solid var(--primary); color: #fff; padding: 5px; font-family: inherit; }
    .cat-input-group button { background: var(--primary); color: #000; border: none; padding: 5px 10px; cursor: pointer; font-weight: bold; }

    /* AREA DA GRID DE NOTICIAS */
    .news-grid-area { flex: 1; overflow-y: auto; background: rgba(0,0,0,0.3); }
    .news-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 25px; padding: 40px; }

    /* CARDS */
    .news-card { background: rgba(20,20,20,0.9); border: 1px solid var(--border-c); height: 350px; display: flex; flex-direction: column; transition: 0.3s; cursor: pointer; position: relative; overflow: hidden; }
    .news-card:hover { transform: translateY(-5px); border-color: var(--primary); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .card-img { flex: 1.2; background-size: cover; background-position: center; position: relative; filter: grayscale(0.2); transition: 0.3s; }
    .news-card:hover .card-img { filter: grayscale(0); }
    .date-overlay { position: absolute; top: 10px; right: 10px; background: #000; color: var(--primary); padding: 4px 8px; font-size: 0.7rem; border: 1px solid var(--primary); }
    .card-info { padding: 15px; background: linear-gradient(to bottom, #151515, #0a0a0a); height: 160px; position: relative; border-top: 1px solid var(--border-c); }
    .game-date { color: var(--primary); font-size: 0.7rem; margin-bottom: 8px; opacity: 0.8; }
    .card-info h3 { margin: 0 0 10px 0; color: #fff; font-size: 1.2rem; line-height: 1.1; font-weight: normal; }
    .card-info p { color: #888; font-size: 0.85rem; margin: 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    .gm-tools { position: absolute; bottom: 10px; right: 10px; }
    .gm-btn { background: #222; color: #aaa; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .gm-btn:hover { color: var(--primary); background: #000; border: 1px solid var(--primary); }

    /* ESTILO DATA HELL NA LISTA */
    .dh-card-style { border-color: #ff0055 !important; }
    .dh-card-style h3 { color: #ff0055 !important; font-family: 'Impact'; letter-spacing: 1px; }

    /* BOTÕES GERAIS */
    button { cursor: pointer; border: none; font-weight: bold; text-transform: uppercase; transition: 0.2s; font-family: inherit; }
    .btn-close { background: transparent; border: 1px solid #555; color: #aaa; padding: 6px 15px; }
    .btn-close:hover { border-color: #ff3333; color: #ff3333; }
    .btn-admin { background: var(--primary); color: #000; padding: 6px 15px; margin-right: 10px; }
    .btn-admin:hover { background: #fff; box-shadow: 0 0 15px var(--primary); }

    /* DROPDOWN */
    .create-wrapper { position: relative; display: inline-block; }
    .create-dropdown { position: absolute; top: 100%; left: 0; background: #111; border: 1px solid var(--primary); z-index: 100; display: flex; flex-direction: column; width: 200px; box-shadow: 0 10px 30px #000; }
    .create-dropdown button { background: transparent; color: #fff; padding: 12px; text-align: left; border: none; border-bottom: 1px solid #333; }
    .create-dropdown button:hover { background: rgba(255,255,255,0.1); color: var(--primary); }
    .dh-opt { color: #ff0055 !important; border-bottom: none !important; font-family: 'Impact'; letter-spacing: 1px; }

    /* MODOS DE VISUALIZAÇÃO */
    .full-width { width: 100%; height: 100%; display: flex; flex-direction: column; }
    .admin-full-wrapper { width: 100%; height: 100%; display: flex; flex-direction: column; background: #000; }

    /* READER STYLES (PADRÃO) */
    .news-reader { background: #050505; }
    .reader-toolbar { position: sticky; top: 0; background: rgba(0,0,0,0.95); z-index: 50; padding: 10px; display: flex; justify-content: space-between; border-bottom: 1px solid #333; }
    .btn-back { background: transparent; color: #ccc; border: 1px solid #555; padding: 5px 15px; }
    .btn-back:hover { border-color: #fff; color: #fff; }
    .btn-audio { background: transparent; border: 1px solid var(--primary); color: var(--primary); padding: 5px 15px; font-size: 0.8rem; display: flex; align-items: center; gap: 8px; }
    .btn-audio.muted { border-color: #555; color: #555; }
    .reader-header { height: 25vh; min-height: 180px; background-size: cover; background-position: center; position: relative; flex-shrink: 0; display: flex; align-items: flex-end; }
    .header-overlay { position: absolute; inset: 0; background: linear-gradient(to top, #050505 0%, rgba(0,0,0,0.4) 100%); }
    .header-content { position: relative; z-index: 2; width: 100%; padding: 20px 40px; }
    .title-block h1 { margin: 0; font-size: 2.5rem; color: #fff; text-shadow: 0 2px 10px #000; line-height: 1; }
    .meta-tag { background: var(--primary); color: #000; padding: 2px 8px; font-weight: bold; font-size: 0.8rem; display: inline-block; margin-bottom: 5px; }
    .reader-scroll-area { flex: 1; overflow-y: auto; padding: 40px; background-image: radial-gradient(#151515 1px, transparent 1px); background-size: 20px 20px; }
    .reader-content { max-width: 1000px; margin: 0 auto; color: #ccc; line-height: 1.8; font-size: 1.1rem; }
    
    /* ADMIN PADRÃO */
    .admin-panel { display: flex; height: 100%; }
    .admin-sidebar { width: 400px; background: #111; padding: 20px; border-right: 1px solid #333; display: flex; flex-direction: column; gap: 15px; flex-shrink: 0; }
    .form-group { display: flex; flex-direction: column; gap: 5px; }
    .form-group label { color: var(--primary); font-size: 0.8rem; }
    .form-group input, .form-group textarea { background: #000; border: 1px solid #333; color: #fff; padding: 8px; font-family: monospace; }
    .form-group.full { flex: 1; display: flex; flex-direction: column; }
    .code-editor { flex: 1; color: #aaffaa !important; font-size: 0.85rem; }
    .admin-actions { display: flex; gap: 10px; margin-top: auto; }
    .admin-actions button { flex: 1; padding: 12px; }
    .save { background: var(--primary); color: #000; }
    .cancel { background: #333; color: #fff; }
    .delete { background: #500; color: #fff; flex: 0; width: 50px; }
    .admin-preview { flex: 1; background: #000; padding: 40px; }
    .preview-body { background: #080808; padding: 30px; border: 1px solid #222; min-height: 500px; }

    /* DATA HELL ADMIN HEADER */
    .meta-editor-bar { display: flex; gap: 10px; background: #1a1a1a; padding: 10px 20px; align-items: center; border-bottom: 2px solid #ff0055; flex-wrap: wrap; flex-shrink: 0; }
    .meta-editor-bar label { display: flex; flex-direction: column; font-size: 0.7rem; color: #aaa; flex: 1; min-width: 150px; }
    .meta-editor-bar input { background: #000; border: 1px solid #444; color: #fff; padding: 4px; margin-top: 2px; }
    .actions { display: flex; gap: 5px; align-items: flex-end; }
    .actions .save { background: #ff0055; color: #fff; padding: 8px 15px; }
    .actions .cancel { background: #333; color: #fff; }

    .empty-state { width: 100%; text-align: center; color: #444; margin-top: 100px; font-size: 2rem; display: flex; flex-direction: column; align-items: center; gap: 20px; }
    
    /* HTML Injection */
    .html-injection :global(h1), .html-injection :global(h2) { color: var(--primary); margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 5px; }
    .html-injection :global(p) { margin-bottom: 20px; text-align: justify; }
    .html-injection :global(img) { max-width: 100%; border: 1px solid var(--primary); margin: 20px 0; }
    .html-injection :global(blockquote) { border-left: 3px solid var(--primary); padding-left: 20px; margin: 20px 0; font-style: italic; color: #fff; background: rgba(255,255,255,0.05); padding: 15px; }
</style>