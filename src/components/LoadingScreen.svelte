<script>
    import { onMount } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    import { PlayerDatabase } from '../database/PlayerDatabase.js'; 
    import NexusOpening from '../OpeningApp.js'; 

    export let app; 
    export let isInitialBoot = false; 

    let loreItem = null;
    let loadingProgress = 0;
    let isReady = false;
    let dbIsEmpty = true;
    let isMounted = false;

    onMount(async () => {
        // Delay crítico para o DOM estar pronto
        await new Promise(r => setTimeout(r, 50));
        
        // CSS Nuclear
        if (app?.element) {
            app.element.css({
                width: '100vw', height: '100vh', top: 0, left: 0, margin: 0, border: 'none', zIndex: 999999
            });
            app.element.find(".window-content").css({
                background: "black", padding: 0, margin: 0, overflow: "hidden", height: "100%"
            });
        }

        loadLore();
        simulateLoading();
        isMounted = true;
    });

    function loadLore() {
        try {
            const allEntries = PlayerDatabase?.getAll ? PlayerDatabase.getAll() : [];
            const validEntries = allEntries.filter(e => e.img && e.description && e.description.length > 20);
            
            if (validEntries.length > 0) {
                loreItem = validEntries[Math.floor(Math.random() * validEntries.length)];
                dbIsEmpty = false;
            } else {
                dbIsEmpty = true;
            }
        } catch (e) {
            dbIsEmpty = true;
        }
    }

    function simulateLoading() {
        const interval = setInterval(() => {
            if (loadingProgress < 100) {
                loadingProgress += Math.random() * 10;
                if (loadingProgress > 100) loadingProgress = 100;
            } else {
                clearInterval(interval);
                isReady = true;
            }
        }, 120);
    }

    function finishLoading() {
        if (app) app.close();
        if (isInitialBoot) {
            // Se for boot, chama a abertura aqui
            new NexusOpening().render(true);
        }
    }

    function stripHtml(html) {
        if (!html) return "";
        let tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    }
</script>

{#if isMounted}
<div class="loading-screen" in:fade={{duration: 500}}>
    
    {#if !dbIsEmpty && loreItem}
        <div class="bg-layer" style="background-image: url('{loreItem.img}')"></div>
    {:else}
        <div class="bg-layer empty-pattern"></div>
    {/if}
    <div class="overlay-grid"></div>

    {#if !dbIsEmpty && loreItem}
        <div class="lore-card" in:fly={{y: 50, duration: 800}}>
            <div class="card-image"><img src={loreItem.img} alt="Lore"></div>
            <div class="card-content">
                <div class="card-header">
                    <span class="type-tag">{loreItem.type.toUpperCase()}</span>
                    <span class="id-tag">ID: {loreItem.id ? loreItem.id.substring(0,4) : 'N/A'}</span>
                </div>
                <h1>{loreItem.name}</h1>
                <div class="text-preview">"{stripHtml(loreItem.description).substring(0, 250)}..."</div>
                <div class="card-footer">
                    <div class="author-info"><i class="fas fa-user-secret"></i> Arquivado por: {loreItem.author}</div>
                </div>
            </div>
        </div>
    {/if}

    {#if dbIsEmpty}
        <div class="empty-warning" in:fly={{y: 50, duration: 800}}>
            <div class="warning-icon"><i class="fas fa-database"></i><div class="alert-badge">!</div></div>
            <h2>MEMÓRIA DE SISTEMA VAZIA</h2>
            <p>Utilize o aplicativo <strong style="color: #00ff41">THE ARCHIVES</strong> para popular este terminal.</p>
        </div>
    {/if}

    <div class="footer-area">
        <div class="loading-status">
            {#if !isReady}
                <div class="pc-anim"><i class="fas fa-microchip fa-spin"></i><span class="blink">CARREGANDO... {Math.floor(loadingProgress)}%</span></div>
            {:else}
                <button class="start-btn" on:click={finishLoading} in:fade>
                    {isInitialBoot ? 'INICIAR SISTEMA' : 'ACESSAR LOCAL'} <i class="fas fa-chevron-right"></i>
                </button>
            {/if}
        </div>
        <div class="progress-track"><div class="progress-fill" style="width: {loadingProgress}%" class:finished={isReady}></div></div>
    </div>

</div>
{/if}

<style>
    :global(#nexus-loading) {
        top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important;
        background: black !important; border: none !important; box-shadow: none !important; margin: 0 !important; pointer-events: auto !important;
    }
    :global(#nexus-loading .window-header) { display: none !important; }
    :global(#nexus-loading .window-content) { background: black !important; padding: 0 !important; overflow: hidden !important; }

    .loading-screen { width: 100vw; height: 100vh; background: #050505; color: #fff; font-family: 'Share Tech Mono', monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; position: relative; }
    .bg-layer { position: absolute; inset: -20px; background-size: cover; background-position: center; filter: blur(10px) brightness(0.3); z-index: 0; }
    .empty-pattern { background-color: #000; opacity: 0.5; }
    .overlay-grid { position: absolute; inset: 0; pointer-events: none; z-index: 1; background: linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 100%), linear-gradient(90deg, rgba(0, 255, 65, 0.03) 1px, transparent 1px); background-size: 100% 100%, 40px 40px; }

    .lore-card { z-index: 10; display: flex; width: 800px; height: 350px; background: rgba(10, 10, 10, 0.9); border: 1px solid #00ff41; box-shadow: 0 0 30px rgba(0, 255, 65, 0.1); border-radius: 4px; overflow: hidden; }
    .card-image { width: 35%; border-right: 1px solid #333; overflow: hidden; }
    .card-image img { width: 100%; height: 100%; object-fit: cover; }
    .card-content { flex: 1; padding: 25px; display: flex; flex-direction: column; }
    .type-tag { background: #00ff41; color: #000; padding: 2px 6px; font-weight: bold; font-size: 0.8rem; }
    .id-tag { float: right; color: #555; font-size: 0.8rem; }
    h1 { margin: 10px 0; color: #fff; font-size: 2rem; text-transform: uppercase; text-shadow: 0 0 10px rgba(0,255,65,0.5); }
    .text-preview { font-size: 1rem; color: #ccc; line-height: 1.4; flex: 1; font-style: italic; border-left: 2px solid #333; padding-left: 15px; overflow: hidden; }
    .card-footer { margin-top: 15px; color: #666; font-size: 0.8rem; border-top: 1px dashed #333; padding-top: 5px; }

    .empty-warning { z-index: 10; text-align: center; border: 1px dashed #555; padding: 40px; background: rgba(0,0,0,0.8); width: 600px; border-radius: 8px; }
    .warning-icon { font-size: 4rem; color: #333; margin-bottom: 20px; position: relative; display: inline-block; }
    .alert-badge { position: absolute; top: -5px; right: -10px; background: #ffcc00; color: #000; font-size: 1.5rem; width: 30px; height: 30px; border-radius: 50%; font-weight: bold; line-height: 30px; }
    h2 { color: #888; letter-spacing: 3px; margin-bottom: 10px; }

    .footer-area { position: absolute; bottom: 60px; width: 70%; z-index: 20; }
    .loading-status { display: flex; justify-content: flex-end; margin-bottom: 5px; height: 40px; align-items: center; }
    .pc-anim { color: #00ff41; font-size: 1.2rem; display: flex; align-items: center; gap: 10px; }
    .blink { animation: blink 1s infinite; }
    
    .start-btn { background: #00ff41; color: #000; border: none; padding: 10px 20px; font-family: inherit; font-weight: bold; font-size: 1.2rem; cursor: pointer; box-shadow: 0 0 20px rgba(0,255,65,0.4); transition: 0.2s; }
    .start-btn:hover { background: #fff; transform: scale(1.05); }

    .progress-track { width: 100%; height: 6px; background: #222; border-radius: 3px; overflow: hidden; }
    .progress-fill { height: 100%; background: #00ff41; transition: width 0.2s; box-shadow: 0 0 10px #00ff41; }
    .progress-fill.finished { background: #fff; }

    @keyframes blink { 50% { opacity: 0; } }
</style>