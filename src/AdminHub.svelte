<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { fade, scale, fly, slide } from 'svelte/transition';
    import { cubicOut, elasticOut } from 'svelte/easing';
    
    // Imports dos Apps
    import XPManager from './XPManager.svelte';
    import PassManager from './PassManager.svelte';
    import StoreApp from './StoreApp.svelte'; 
    import OriginManager from './OriginManager.svelte';
    import OracleApp from './OracleApp.svelte';
    import NexusApp from './database/NexusApp.svelte';
    import CalendarApp from './apps/CalendarApp.svelte'; // Adicione isto
    
    const dispatch = createEventDispatcher();

    // --- ESTADOS DO SISTEMA ---
    let isLoading = true;
    let bootLines = [];
    let currentApp = 'desktop'; 
    
    let selectedAdmin = { 
        name: 'SYSTEM_ROOT', 
        icon: 'fa-network-wired'
    };

    // --- CONFIGURAÇÕES GLOBAIS ---
    let globalTheme = "#00ff41";
    let globalWallpaper = "https://mir-s3-cdn-cf.behance.net/project_modules/hd/e4316a93890387.5e70ade47b737.gif";

    // --- JANELA ARRASTÁVEL E REDIMENSIONÁVEL ---
    let pos = { x: window.innerWidth / 2 - 550, y: window.innerHeight / 2 - 375 };
    let size = { w: 1100, h: 750 }; // Tamanho inicial
    let isDragging = false;
    let isResizing = false;

    function startDrag() { if(!isResizing) isDragging = true; }
    function startResize(e) { 
        e.preventDefault();
        e.stopPropagation();
        isResizing = true; 
    }

    function stopInteraction() { 
        isDragging = false; 
        isResizing = false; 
    }

    function onMove(e) { 
        if(isDragging) { 
            pos.x += e.movementX; 
            pos.y += e.movementY; 
        } else if (isResizing) {
            // Define um tamanho mínimo para não quebrar a UI
            size.w = Math.max(600, size.w + e.movementX);
            size.h = Math.max(400, size.h + e.movementY);
        }
    }

    // --- SEQUÊNCIA DE BOOT ---
    onMount(() => {
        simulateBoot();
    });

    async function simulateBoot() {
        const lines = [
            "> KERNEL PROTOCOL INITIATED...",
            "> ESTABLISHING SECURE CONNECTION TO VTT SERVER...",
            "> CONNECTION SUCCESSFUL. PING: 1ms",
            "> VERIFYING GM CREDENTIALS...",
            "> ACCESS GRANTED: LEVEL 10 (ROOT)",
            "> MOUNTING DATABASES (XP, STORE, ORIGINS, PASS)...",
            "> LOADING MODULES... DONE.",
            "> WELCOME, OPERATOR."
        ];

        for (const line of lines) {
            bootLines = [...bootLines, line]; 
            await new Promise(r => setTimeout(r, Math.random() * 200 + 50));
        }
        
        setTimeout(() => {
            isLoading = false;
        }, 500);
    }

    // --- NAVEGAÇÃO ---
    function openApp(appName) {
        if (appName === 'store') { launchStoreAdmin(); } 
        else { currentApp = appName; }
    }
    function goHome() { currentApp = 'desktop'; }
    function closeSystem() { dispatch('close'); }

    // --- LÓGICA DE THEME ---
    async function updateGlobalConfig() {
        await game.user.setFlag("multiversus-rpg", "globalTheme", globalTheme);
        await game.user.setFlag("multiversus-rpg", "globalWallpaper", globalWallpaper);
        ui.notifications.info("SISTEMA SINCRONIZADO: CONFIGURAÇÕES DE NÚCLEO ATUALIZADAS.");
    }

    function launchStoreAdmin() {
        const storeDiv = document.createElement('div');
        storeDiv.id = 'multiversus-store-admin-root';
        document.body.appendChild(storeDiv);
        const app = new StoreApp({
            target: storeDiv,
            props: { actor: game.user.character || game.actors.contents[0], activeTab: 'admin' }
        });
        app.$on('close', () => { app.$destroy(); storeDiv.remove(); });
    }
</script>

<svelte:window on:mousemove={onMove} on:mouseup={stopInteraction} />

<div class="admin-master-frame" 
     style="top: {pos.y}px; left: {pos.x}px; width: {size.w}px; height: {size.h}px; --c-primary: {globalTheme};" 
     transition:scale={{duration: 300, start: 0.9, easing: cubicOut}}>
    
    <div class="code-border border-t"></div>
    <div class="code-border border-b"></div>
    <div class="code-border border-l"></div>
    <div class="code-border border-r"></div>

    <div class="terminal-core">
        <div class="wallpaper-fx" style="background-image: url('{globalWallpaper}')"></div>
        <div class="crt-overlay"></div>
        <div class="vignette"></div>

        {#if isLoading}
             <div class="boot-screen" out:fade={{duration: 500}}>
                 <div class="boot-terminal">
                     {#each bootLines as line}
                         <p in:slide={{axis: 'y', duration: 200}} class="boot-line">{line}</p>
                     {/each}
                     <span class="blinking-cursor">_</span>
                 </div>
                 <div class="boot-loader">
                     <div class="spinner"></div>
                     <span>SYSTEM INITIALIZING</span>
                 </div>
             </div>
        {:else}
            <header on:mousedown={startDrag} in:fade={{delay: 200}}>
                <div class="header-left">
                    <div class="admin-avatar glowing">
                        <i class="fas {selectedAdmin.icon}"></i>
                    </div>
                    <div class="header-info">
                        <span class="sys-name">ADMIN_KERNEL_OS v.5.4</span>
                        <span class="user-id">SESSION: {selectedAdmin.name}</span>
                    </div>
                </div>

                <div class="header-controls">
                    {#if currentApp !== 'desktop'}
                        <button class="ctrl-btn" on:click={goHome}>[ RETORNAR ]</button>
                    {/if}
                    <button class="ctrl-btn terminate" on:click={closeSystem}>[ ENCERRAR ]</button>
                </div>
            </header>

            <main in:fade={{delay: 300}}>
                {#if currentApp === 'desktop'}
                    <div class="app-grid">
                        <button class="modern-app xp-theme" on:click={() => openApp('xp')}>
                            <div class="icon-box"><i class="fas fa-microchip"></i></div>
                            <div class="app-meta">
                                <span class="name">GESTOR_XP</span>
                                <span class="desc">Controle de fluxo de experiência</span>
                            </div>
                        </button>

                        <button class="modern-app cal-theme" on:click={() => openApp('calendar')}>
                            <div class="icon-box"><i class="fas fa-calendar-alt"></i></div>
                            <div class="app-meta">
                                <span class="name">CRONO_SYS</span>
                                <span class="desc">Calendário Tático & Eventos</span>
                            </div>
                        </button>

                        <button class="modern-app store-theme" on:click={() => openApp('store')}>
                            <div class="icon-box"><i class="fas fa-database"></i></div>
                            <div class="app-meta">
                                <span class="name">LOJA_DB</span>
                                <span class="desc">Acesso mestre ao servidor de itens</span>
                            </div>
                        </button>

                        <button class="modern-app origin-theme" on:click={() => openApp('origin')}>
                            <div class="icon-box"><i class="fas fa-dna"></i></div>
                            <div class="app-meta">
                                <span class="name">GENÉTICA</span>
                                <span class="desc">Gerenciador de Origens & Raças</span>
                            </div>
                        </button>

                        <button class="modern-app pass-theme" on:click={() => openApp('pass')}>
                            <div class="icon-box"><i class="fas fa-ticket-alt"></i></div>
                            <div class="app-meta">
                                <span class="name">PASS_SYS</span>
                                <span class="desc">Gerenciador de Temporadas e Tiers</span>
                            </div>
                        </button>

                        <button class="modern-app config-theme" on:click={() => openApp('config')}>
                            <div class="icon-box"><i class="fas fa-sliders-h"></i></div>
                            <div class="app-meta">
                                <span class="name">ENGINE</span>
                                <span class="desc">Configurações visuais do núcleo</span>
                            </div>
                        </button>

                        <button class="modern-app ai-theme" on:click={() => openApp('oracle')}>
                            <div class="icon-box"><i class="fas fa-brain"></i></div>
                            <div class="app-meta">
                                <span class="name">O GUIA</span>
                                <span class="desc">Assistente Inteligente</span>
                            </div>
                        </button>

                        <button class="modern-app ai-theme" on:click={() => openApp('nexus')}>
                            <div class="icon-box"><i class="fas fa-database"></i></div>
                            <div class="app-meta">
                                <span class="name">NEXUS_DB</span>
                                <span class="desc">Database & Lore Manager</span>
                            </div>
                        </button>
                    </div>

                {:else if currentApp === 'config'}
                    <div class="config-panel" in:fly={{y: 20}}>
                        <h2><i class="fas fa-cogs"></i> CONFIGURAÇÕES DE NÚCLEO</h2>
                        <div class="config-grid">
                            <div class="config-item">
                                <label>TEMA GLOBAL (COR)</label>
                                <div class="input-wrapper">
                                    <input type="color" bind:value={globalTheme} on:change={updateGlobalConfig} />
                                    <span class="hex-value" style="color: {globalTheme}">{globalTheme}</span>
                                </div>
                            </div>
                            <div class="config-item">
                                <label>PLANO DE FUNDO (URL)</label>
                                <input type="text" class="text-input" bind:value={globalWallpaper} on:change={updateGlobalConfig} />
                            </div>
                        </div>
                        <div class="status-footer" style="border-color: {globalTheme}">
                            <span><i class="fas fa-sync"></i> SINCRONIZAÇÃO: AUTOMÁTICA</span>
                        </div>
                    </div>

                {:else if currentApp === 'oracle'}
                    <div class="full-app-wrapper">
                        <OracleApp actor={game.user.character || game.actors.contents[0]} />
                    </div>
                {:else if currentApp === 'origin'}
                    <div class="full-app-wrapper"><OriginManager /></div>
                {:else if currentApp === 'xp'}
                    <div class="full-app-wrapper"><XPManager on:back={goHome} /></div>
                    {:else if currentApp === 'calendar'}
                    <div class="full-app-wrapper"><CalendarApp /></div>
                {:else if currentApp === 'nexus'}
                    <div class="full-app-wrapper"><NexusApp /></div>
                {:else if currentApp === 'pass'}
                    <div class="full-app-wrapper"><PassManager /></div>
                {/if}
            </main>

            <footer in:fade={{delay: 400}}>
                <div class="f-left"><span class="blink" style="color: var(--c-primary)">●</span> SYSTEM_STATUS: SECURE</div>
                <div class="f-right"><i class="fas fa-expand-alt"></i> RESIZE_READY</div>
            </footer>
        {/if}
    </div>

    <div class="resize-handle" on:mousedown={startResize}></div>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

    .admin-master-frame {
        position: fixed;
        background: #020202; 
        border: 2px solid var(--c-primary);
        box-shadow: 0 0 30px rgba(0, 255, 65, 0.2);
        font-family: 'Share Tech Mono', monospace; color: var(--c-primary);
        z-index: 100000; overflow: hidden;
        padding: 10px;
        display: flex;
        flex-direction: column;
    }

    /* Alça de Resize */
    .resize-handle {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 25px;
        height: 25px;
        cursor: nwse-resize;
        z-index: 100001;
        background: linear-gradient(135deg, transparent 70%, var(--c-primary) 70%);
        opacity: 0.3;
        transition: opacity 0.2s;
    }
    .resize-handle:hover { opacity: 1; }

    .code-border { position: absolute; z-index: 10; opacity: 0.7; background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAgAAAB/8bf+AAAAS0lEQVR42mNkoBwwIiP7/9eR6c9lRgbqA8a//z8y/X/NyEB9AFj1/z8jA/UB49///4wM1AeMVQ8Y/v/HyEB9wFj1gOH/f4wM1AcA4a4c5V3sPZ4AAAAASUVORK5CYII='); filter: drop-shadow(0 0 2px var(--c-primary)); }
    .border-t { top: 0; left: 0; right: 0; height: 12px; animation: scrollL 20s linear infinite; border-bottom: 1px solid var(--c-primary); }
    .border-b { bottom: 0; left: 0; right: 0; height: 12px; animation: scrollR 20s linear infinite; border-top: 1px solid var(--c-primary); }
    .border-l { top: 0; bottom: 0; left: 0; width: 12px; animation: scrollU 20s linear infinite; border-right: 1px solid var(--c-primary); }
    .border-r { top: 0; bottom: 0; right: 0; width: 12px; animation: scrollD 20s linear infinite; border-left: 1px solid var(--c-primary); }

    .terminal-core { position: relative; width: 100%; height: 100%; background: #050505; display: flex; flex-direction: column; border: 1px solid rgba(0, 255, 65, 0.2); overflow: hidden; }
    .wallpaper-fx { position: absolute; inset: 0; background-size: cover; background-position: center; opacity: 0.3; filter: contrast(1.2) hue-rotate(10deg); mix-blend-mode: luminosity; }
    .crt-overlay { position: absolute; inset: 0; z-index: 5; pointer-events: none; background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%); background-size: 100% 4px; }
    .vignette { position: absolute; inset: 0; background: radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.8) 100%); z-index: 6; pointer-events: none; }

    .boot-screen { position: absolute; inset: 0; z-index: 100; background: #000; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; gap: 30px; }
    .boot-terminal { text-align: left; width: 80%; max-width: 600px; height: 300px; overflow-y: auto; font-size: 14px; color: #ccc; }
    .boot-line { margin: 5px 0; color: var(--c-primary); text-shadow: 0 0 5px var(--c-primary); }
    .blinking-cursor { animation: blink 1s infinite; font-weight: bold; }
    .boot-loader { display: flex; align-items: center; gap: 15px; color: var(--c-primary); font-weight: bold; letter-spacing: 2px; }
    .spinner { width: 24px; height: 24px; border: 3px solid rgba(var(--c-primary), 0.2); border-top-color: var(--c-primary); border-radius: 50%; animation: spin 1s linear infinite; }

    header { position: relative; z-index: 20; background: rgba(0, 10, 0, 0.9); padding: 15px 25px; border-bottom: 2px solid var(--c-primary); display: flex; justify-content: space-between; align-items: center; cursor: grab; box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
    .header-left { display: flex; align-items: center; gap: 15px; }
    .admin-avatar { width: 50px; height: 50px; border: 2px solid var(--c-primary); display: flex; align-items: center; justify-content: center; font-size: 26px; background: rgba(0, 255, 65, 0.1); }
    .admin-avatar.glowing { box-shadow: 0 0 15px var(--c-primary); animation: pulseIcon 2s infinite alternate; }
    .sys-name { display: block; font-weight: bold; font-size: 16px; letter-spacing: 1px; }
    .user-id { font-size: 11px; opacity: 0.7; color: #aaa; }
    .ctrl-btn { background: rgba(0,0,0,0.3); border: 1px solid var(--c-primary); color: var(--c-primary); padding: 8px 18px; cursor: pointer; font-family: inherit; font-size: 12px; transition: 0.2s; font-weight: bold; }
    .ctrl-btn:hover { background: var(--c-primary); color: #000; box-shadow: 0 0 15px var(--c-primary); }
    .terminate { border-color: #ff3333; color: #ff3333; margin-left: 15px; }
    .terminate:hover { background: #ff3333; color: #000; box-shadow: 0 0 20px #ff3333; }

    main { flex: 1; position: relative; z-index: 10; overflow: hidden; padding: 30px; }
    .app-grid { 
        display: grid; 
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
        gap: 20px;
        height: 100%;
        overflow-y: auto;
    }
    
    .modern-app { 
        --app-color: var(--c-primary);
        position: relative;
        background: linear-gradient(145deg, rgba(20, 20, 20, 0.8), rgba(5, 5, 5, 0.9)); 
        border: 2px solid rgba(var(--app-color), 0.3);
        padding: 20px; display: flex; align-items: center; gap: 20px; cursor: pointer; 
        transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1); text-align: left; overflow: hidden;
    }
    
    .xp-theme { --app-color: #00ccff; }
    .store-theme { --app-color: #ffcc00; }
    .origin-theme { --app-color: #ff00ff; }
    .pass-theme { --app-color: #ff9900; }
    .config-theme { --app-color: var(--c-primary); }
    .ai-theme { --app-color: #ffffff; }

    .modern-app:hover { 
        border-color: var(--app-color);
        transform: translateY(-3px);
        box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 15px rgba(var(--app-color), 0.3);
    }

    .icon-box { width: 50px; height: 50px; background: rgba(var(--app-color), 0.1); border: 2px solid var(--app-color); display: flex; align-items: center; justify-content: center; font-size: 24px; color: var(--app-color); transition: 0.3s; }
    .modern-app:hover .icon-box { background: var(--app-color); color: #000; }

    .app-meta .name { font-weight: bold; font-size: 16px; letter-spacing: 1px; color: var(--app-color); }
    .app-meta .desc { font-size: 10px; opacity: 0.6; margin-top: 3px; color: #ccc; }

    .hover-fx { position: absolute; inset: 0; background: radial-gradient(circle at center, rgba(var(--app-color), 0.1) 0%, transparent 70%); opacity: 0; transition: 0.3s; pointer-events: none; }
    .modern-app:hover .hover-fx { opacity: 1; }

    .config-panel { max-width: 700px; margin: 20px auto; background: rgba(0,0,0,0.85); border: 2px solid var(--c-primary); padding: 30px; box-shadow: 0 0 40px rgba(0,0,0,0.8); }
    .full-app-wrapper { height: 100%; overflow-y: auto; }

    footer { background: rgba(0,0,0,0.9); padding: 8px 25px; font-size: 10px; color: #666; border-top: 2px solid var(--c-primary); display: flex; justify-content: space-between; }
    
    @keyframes blink { 50% { opacity: 0; } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulseIcon { 0% { box-shadow: 0 0 10px var(--c-primary); } 100% { box-shadow: 0 0 25px var(--c-primary), inset 0 0 10px var(--c-primary); } }
    @keyframes scrollL { from { background-position: 0 0; } to { background-position: -128px 0; } }
    @keyframes scrollR { from { background-position: 0 0; } to { background-position: 128px 0; } }
    @keyframes scrollU { from { background-position: 0 0; } to { background-position: 0 -128px; } }
    @keyframes scrollD { from { background-position: 0 0; } to { background-position: 0 128px; } }

    .app-grid::-webkit-scrollbar { width: 4px; }
    .app-grid::-webkit-scrollbar-thumb { background: var(--c-primary); }

    .cal-theme { --app-color: #ff3366; } 
    
    .config-theme { --app-color: var(--c-primary); }
</style>