<script>
    import { fade, fly } from 'svelte/transition';
    import { createEventDispatcher, onMount } from 'svelte';
    import { SystemBookDB } from './SystemBookDB.js';
    import { BookAutomation } from './BookAutomation.js';
    import { MENU_THEMES } from './data/MainMenuThemeDB.js'; // Importa os temas do Menu

    export let bookData;
    export let isGM = false;

    const dispatch = createEventDispatcher();

    // --- CARREGAMENTO DO TEMA ESCOLHIDO PELO JOGADOR ---
    let currentThemeId = "default";
    let customThemeColor = "#00ff41";

    try {
        currentThemeId = game.settings.get("multiversus-rpg", "menuTheme") || "default";
        if (game.settings.settings.has("multiversus-rpg.customThemeColor")) {
            customThemeColor = game.settings.get("multiversus-rpg", "customThemeColor");
        } else {
            customThemeColor = localStorage.getItem("multiversus-rpg-custom-color") || "#00ff41";
        }
    } catch (err) {
        console.warn("NEXUS | Erro ao carregar tema no SystemBookView", err);
    }

    $: isCustomTheme = currentThemeId === 'custom';
    $: baseTheme = MENU_THEMES?.[currentThemeId] || MENU_THEMES?.['default'] || { colors: { primary: '#00ff41', bg: '#000' }, font: 'monospace' };
    
    // Esta variável vai colorir APENAS a Interface (A aba de leitura continuará no padrão SRD)
    $: themeColor = isCustomTheme ? customThemeColor : baseTheme.colors.primary;
    $: themeFont = baseTheme.font;

    // --- ESTADOS GLOBAIS DE VISUALIZAÇÃO ---
    let theme = 'dark';
    let isFocusMode = false;
    let zoomLevel = 100; 
    
    // --- ESTADOS DE NAVEGAÇÃO E GLOSSÁRIO ---
    let currentChapterId = bookData?.chapters[0]?.id || null;
    let glossary = {};
    let isNavOpen = false; 
    let isHelperOpen = false; 
    let activeTerm = null;

    // --- REATIVIDADE DO CONTEÚDO E ÍNDICE ---
    $: activeChapter = bookData?.chapters.find(c => c.id === currentChapterId) || bookData?.chapters[0];
    $: renderedHtml = activeChapter ? BookAutomation.renderMarkdown(activeChapter.content, glossary) : "";

    $: groupedChapters = bookData.chapters.reduce((acc, chapter) => {
        const folder = chapter.folder || "Geral";
        if (!acc[folder]) acc[folder] = [];
        acc[folder].push(chapter);
        return acc;
    }, {});

    onMount(() => {
        glossary = SystemBookDB.getGlossary();
    });

    // --- CONTROLES DE INTERFACE ---
    function toggleTheme() { theme = theme === 'dark' ? 'light' : 'dark'; }
    function toggleFocus() { isFocusMode = !isFocusMode; if (isFocusMode) { isNavOpen = false; isHelperOpen = false; } }
    function closeMobileMenus() { isNavOpen = false; isHelperOpen = false; }

    function selectChapter(id) {
        currentChapterId = id;
        isNavOpen = false; 
        isHelperOpen = false; 
    }

    function handleArticleClick(event) {
        const keyword = event.target.closest('.rule-keyword');
        if (keyword) {
            const key = keyword.getAttribute('data-key');
            if (glossary[key]) {
                activeTerm = glossary[key];
                isHelperOpen = true; 
                if (window.innerWidth <= 900) isNavOpen = false;
            }
        }
    }
</script>

<div class="srd-view-root" data-theme={theme} class:focus-mode={isFocusMode} style="--ui-theme: {themeColor}; font-family: {themeFont};">
    
    {#if isNavOpen || (isHelperOpen && window.innerWidth <= 900)}
        <div class="mobile-overlay" transition:fade={{duration: 200}} on:click={closeMobileMenus}></div>
    {/if}

    <header class="topbar">
        <div class="brand">
            <button class="btn-menu" on:click={() => { isNavOpen = !isNavOpen; isHelperOpen = false; }}>☰</button>
            <i class="fas fa-book-journal-whills hide-mobile" style="margin-right: 8px;"></i>
            <span>{bookData.title}</span>
        </div>
        
        <div class="top-actions">
            <button class="btn-tool" on:click={toggleTheme} title="Alternar Tema">
                {#if theme === 'dark'} <i class="fas fa-sun"></i> {:else} <i class="fas fa-moon"></i> {/if}
            </button>
            
            {#if isFocusMode}
                <div class="zoom-control" transition:fade>
                    <i class="fas fa-search-minus" style="font-size:10px; color:var(--text-muted)"></i>
                    <input type="range" min="80" max="200" bind:value={zoomLevel} class="zoom-slider" title="{zoomLevel}%">
                    <i class="fas fa-search-plus" style="font-size:12px; color:var(--ui-theme)"></i>
                </div>
            {/if}
            <button class="btn-tool" class:active={isFocusMode} on:click={toggleFocus} title="Modo Foco">
                <i class="fas fa-expand"></i> <span class="hide-mobile">FOCO</span>
            </button>
            
            {#if isGM}
                <button class="btn-tool gm-edit-btn" on:click={() => dispatch('editBook')} title="Editar Manual">
                    <i class="fas fa-edit"></i> <span class="hide-mobile">MODO EDIÇÃO</span>
                </button>
            {/if}
            
            <button class="btn-tool danger" on:click={() => dispatch('closeBook')} title="Fechar Livro">✕</button>
        </div>
    </header>

    <div class="main-workspace">
        
        <nav class="nav-sidebar custom-scroll" class:mobile-open={isNavOpen}>
            <div class="nav-header-mobile">
                ÍNDICE <button class="btn-close-nav" on:click={() => isNavOpen = false}>✕</button>
            </div>
            
            {#each Object.keys(groupedChapters) as folderName}
                <div class="nav-group">
                    <div class="nav-group-title">{folderName}</div>
                    {#each groupedChapters[folderName] as chapter (chapter.id)}
                        <div class="nav-link" class:active={currentChapterId === chapter.id} on:click={() => selectChapter(chapter.id)}>
                            <i class="fas fa-file-alt" style="opacity:0.3; margin-right:8px; font-size: 0.8rem;"></i> {chapter.title}
                        </div>
                    {/each}
                </div>
            {/each}
        </nav>

        <main class="content-area custom-scroll">
            <article class="article-container html-injection" in:fade on:click={handleArticleClick} style="zoom: {zoomLevel}%;">
                {@html renderedHtml}
                
                {#if activeChapter?.customHtml} 
                    <div class="custom-html-block">{@html activeChapter.customHtml}</div> 
                {/if}
            </article>
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
                        {#if activeTerm.img} <img src="{activeTerm.img}" class="term-img" alt="Ref Visual"> {/if}
                    </div>
                {:else}
                    <div class="empty-state">
                        <i class="fas fa-hand-pointer"></i>
                        <p>Toque ou clique num texto destacado da página para visualizar detalhes na Matriz.</p>
                    </div>
                {/if}
            </div>
        </aside>

    </div>
</div>

<style>
    /* =========================================
       VARIÁVEIS GLOBAIS DE COR DA UI E TEXTO
       ========================================= */
    .srd-view-root {
        --bg-main: #0a0a0c; --bg-panel: #141418; --bg-hover: #1f1f25;
        --text-main: #d1d1e0; --text-muted: #888899; --border: #2a2a35;
        
        /* Cores PADRÃO DO TEXTO SRD (Blindadas contra a cor da UI para não estragar a leitura) */
        --primary: #ff0055; 
        --secondary: #00ff41; 
        --callout-bg: #0f1215; --callout-border: #333;
        
        position: absolute; inset: 0; display: flex; flex-direction: column;
        background-color: var(--bg-main); color: var(--text-main); 
        z-index: 500;
    }

    .srd-view-root[data-theme="light"] {
        --bg-main: #f4f5f7; --bg-panel: #ffffff; --bg-hover: #eef0f5;
        --text-main: #2d3748; --text-muted: #718096; --border: #cbd5e0;
        --primary: #e53e3e; 
        --secondary: #319795; --callout-bg: #f8fafc; --callout-border: #e2e8f0;
    }

    h1, h2, h3, h4, .brand { font-family: 'Share Tech Mono', monospace; }
    .custom-scroll::-webkit-scrollbar { width: 6px; }
    .custom-scroll::-webkit-scrollbar-track { background: transparent; }
    .custom-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
    
    /* A cor do scrol agora segue a cor da Interface (UI) */
    .custom-scroll::-webkit-scrollbar-thumb:hover { background: var(--ui-theme); }

    /* =========================================
       HEADER E INTERFACE (Herda a cor --ui-theme)
       ========================================= */
    .topbar { height: 60px; background: var(--bg-panel); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; padding: 0 20px; flex-shrink: 0; transition: background 0.3s, border 0.3s; }
    .brand { font-size: 1.2rem; color: var(--ui-theme); display: flex; align-items: center; gap: 10px; font-weight: bold; text-transform: uppercase; }
    .btn-menu { display: none; background: transparent; border: 1px solid var(--border); color: var(--text-main); font-size: 1.2rem; padding: 4px 10px; border-radius: 4px; cursor: pointer; }
    
    .zoom-control { display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.3); padding: 5px 12px; border-radius: 20px; border: 1px solid var(--border); }
    .zoom-slider { -webkit-appearance: none; width: 100px; height: 4px; background: var(--border); border-radius: 2px; outline: none; }
    .zoom-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: var(--ui-theme); cursor: pointer; transition: 0.2s; box-shadow: 0 0 5px var(--ui-theme); }
    .zoom-slider::-webkit-slider-thumb:hover { transform: scale(1.2); background: #fff; }

    .top-actions { display: flex; gap: 8px; }
    .btn-tool { background: transparent; border: 1px solid var(--border); color: var(--text-muted); padding: 8px 12px; border-radius: 4px; cursor: pointer; transition: 0.2s; font-weight: bold; display: flex; align-items: center; gap: 8px; }
    
    /* Botões seguem a cor da UI */
    .btn-tool:hover, .btn-tool.active { border-color: var(--ui-theme); color: var(--ui-theme); }
    .btn-tool.danger:hover { background: #ff0000; color: #fff; border-color: #ff0000; }

    .main-workspace { display: flex; flex: 1; overflow: hidden; position: relative; }
    .mobile-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.7); z-index: 80; cursor: pointer; }

    /* NAVEGAÇÃO LATERAL E ÍNDICE (Interface) */
    .nav-sidebar { width: 260px; background: var(--bg-panel); border-right: 1px solid var(--border); display: flex; flex-direction: column; overflow-y: auto; transition: transform 0.3s ease; z-index: 100; }
    .nav-header-mobile { display: none; padding: 15px 20px; border-bottom: 1px solid var(--border); justify-content: space-between; align-items: center; font-family: 'Share Tech Mono'; color: var(--ui-theme); }
    .btn-close-nav { background: none; border: none; color: var(--text-main); font-size: 1.5rem; cursor: pointer; }

    .nav-group { margin-bottom: 10px; }
    .nav-group-title { padding: 20px 20px 5px; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold; letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.05); margin-bottom: 5px;}
    .nav-link { display: flex; align-items: center; padding: 12px 20px; color: var(--text-main); border-left: 3px solid transparent; font-size: 0.95rem; cursor: pointer; transition: 0.2s;}
    .nav-link:hover { background: var(--bg-hover); color: #fff; }
    
    /* Aba Ativa segue a cor da UI */
    .nav-link.active { border-left-color: var(--ui-theme); background: rgba(255,255,255,0.05); color: var(--ui-theme); font-weight: bold; }

    /* ÁREA DE LEITURA */
    .content-area { flex: 1; display: flex; flex-direction: column; overflow-y: auto; background: var(--bg-main); scroll-behavior: smooth; padding: 40px 60px; transition: 0.3s; }
    .article-container { max-width: 800px; margin: 0 auto; padding-bottom: 80px; width: 100%; transition: max-width 0.3s; transform-origin: top left;}

    /* GLOSSÁRIO LATERAL (TERMINAL) (Interface) */
    .helper-sidebar { position: absolute; right: 0; top: 0; width: 350px; height: 100%; background: var(--bg-panel); border-left: 2px solid var(--ui-theme); padding: 20px; display: flex; flex-direction: column; overflow-y: auto; z-index: 200; transform: translateX(100%); transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: -10px 0 30px rgba(0,0,0,0.5); }
    .helper-sidebar.open { transform: translateX(0); }
    .helper-header { display: flex; justify-content: space-between; align-items: center; font-family: 'Share Tech Mono'; font-size: 1rem; color: var(--ui-theme); border-bottom: 1px solid var(--border); padding-bottom: 15px; margin-bottom: 20px; font-weight: bold; text-transform: uppercase;}
    .btn-close-helper { background: transparent; border: 1px solid var(--ui-theme); color: var(--ui-theme); width: 30px; height: 30px; border-radius: 4px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center;}
    .btn-close-helper:hover { background: var(--ui-theme); color: #000; }
    
    .empty-state { text-align: center; color: var(--text-muted); margin-top: 50px; font-style: italic; }
    .empty-state i { font-size: 2rem; margin-bottom: 15px; opacity: 0.5; display: block;}
    
    .term-badge { display: inline-block; background: var(--border); color: var(--text-main); font-size: 0.7rem; padding: 2px 8px; border-radius: 12px; margin-bottom: 10px; font-weight: bold; letter-spacing: 1px;}
    .term-title { color: var(--ui-theme); font-size: 1.5rem; margin: 0 0 10px 0; line-height: 1.1;}
    .term-desc { font-size: 1rem; line-height: 1.6; color: var(--text-main); margin: 0;}
    .term-img { width: 100%; border: 1px solid var(--border); border-radius: 6px; margin-top: 15px; }

    /* =========================================
       ✨ ESTÉTICA SRD (HTML INJECTION) ✨
       Aqui não usamos a --ui-theme. Blindamos o 
       texto para garantir que ele sempre exiba as 
       cores originais e o padrão Data Hell do Livro.
       ========================================= */
    :global(.html-injection) { width: 100%; }
    
    :global(.html-injection .chapter-title) { font-size: 2.8rem; color: var(--primary); margin-top: 0; border-bottom: 2px solid var(--primary); padding-bottom: 10px; text-transform: uppercase; line-height: 1.1; font-family: 'Share Tech Mono';}
    
    :global(.html-injection .section-title) { font-size: 1.6rem; color: var(--secondary); margin-top: 40px; border-bottom: 1px dashed var(--border); padding-bottom: 5px; text-transform: uppercase; font-family: 'Share Tech Mono';}
    
    :global(.html-injection p) { line-height: 1.7; font-size: 1.05rem; margin-bottom: 20px; color: var(--text-main);}
    :global(.html-injection strong) { color: var(--text-main); text-shadow: 0 0 5px rgba(255,255,255,0.15); }
    
    :global(.html-injection .dh-callout) { 
        display: flex; flex-direction: column; padding: 25px; margin: 30px 0; border-radius: 0; 
        border: 1px solid var(--callout-border); border-left: 6px solid var(--secondary); 
        background: var(--callout-bg); box-shadow: 6px 6px 0 rgba(0,0,0,0.15);
    }
    :global(.html-injection .dh-callout .callout-title) { font-weight: bold; font-family: 'Share Tech Mono'; font-size: 1.3rem; margin-bottom: 15px; color: var(--secondary); text-transform: uppercase; border-bottom: 1px solid var(--callout-border); padding-bottom: 8px; }
    :global(.html-injection .dh-callout p:last-child) { margin-bottom: 0; }
    :global(.html-injection blockquote) { border-left: 4px solid var(--text-muted); padding-left: 20px; margin: 20px 0; color: var(--text-muted); font-style: italic; background: rgba(255,255,255,0.02); padding: 15px; }

    :global(.html-injection .rule-keyword) { color: var(--primary); font-weight: bold; cursor: pointer; border-bottom: 1px dashed var(--primary); background: rgba(255,0,85,0.08); padding: 2px 6px; border-radius: 4px; transition: 0.2s; display: inline-block; margin: 2px 0; }
    :global(.html-injection .rule-keyword:hover) { background: var(--primary); color: #fff; border-bottom-style: solid; box-shadow: 0 4px 10px rgba(255,0,85,0.3); transform: translateY(-2px); }

    :global(.html-injection .live-img) { display: block; margin: 25px 0; border: 1px solid var(--border); box-shadow: 0 4px 15px rgba(0,0,0,0.4); max-width: 100%; }
    
    :global(.html-injection .md-list) { margin-bottom: 20px; padding-left: 25px; }
    :global(.html-injection .md-list-item) { margin-bottom: 10px; line-height: 1.5; color: var(--text-main); }
    :global(.html-injection .md-list-item::marker) { color: var(--secondary); }

    :global(.custom-html-block) { margin-top: 50px; border-top: 1px dashed var(--border); padding-top: 30px;}

    /* =========================================
       RESPONSIVIDADE E MODO FOCO
       ========================================= */
    @media (min-width: 900px) {
        .srd-view-root.focus-mode .nav-sidebar { width: 0; transform: translateX(-100%); position: absolute; border: none; }
        .srd-view-root.focus-mode .helper-sidebar { width: 0; transform: translateX(100%); position: absolute; right: 0; border: none; }
        .srd-view-root.focus-mode .content-area { padding: 60px 10%; }
        .srd-view-root.focus-mode .article-container { max-width: 900px; font-size: 1.15rem; }
        .srd-view-root.focus-mode .topbar { background: transparent; border-bottom: none; position: absolute; width: 100%; top: 0; z-index: 10; transition: background 0.3s; }
        .srd-view-root.focus-mode .topbar:hover { background: var(--bg-panel); border-bottom: 1px solid var(--border); }
    }

    @media (max-width: 900px) {
        .btn-menu { display: block; }
        .hide-mobile { display: none !important; }
        .content-area { padding: 25px 20px; }
        :global(.html-injection .chapter-title) { font-size: 2rem; }
        
        .nav-sidebar { position: absolute; top: 0; left: 0; height: 100%; max-width: 80%; transform: translateX(-100%); box-shadow: 5px 0 20px rgba(0,0,0,0.5); }
        .nav-sidebar.mobile-open { transform: translateX(0); }
        .nav-header-mobile { display: flex; }

        .helper-sidebar { width: 100%; height: auto; max-height: 85vh; top: auto; bottom: 0; border-left: none; border-top: 4px solid var(--ui-theme); border-radius: 20px 20px 0 0; transform: translateY(100%); box-shadow: 0 -10px 50px rgba(0,0,0,0.9); padding: 25px; }
        .helper-sidebar.open { transform: translateY(0); }
    }
</style>