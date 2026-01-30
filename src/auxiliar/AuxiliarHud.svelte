<script>
    import { onMount } from 'svelte';
    import { fade, slide, scale, fly } from 'svelte/transition';
    import { AuxiliarSystem } from './AuxiliarSystem.js';

    // --- 1. REGISTRO DE APLICATIVOS (MODULAR) ---
    // Para adicionar novo app: Importe aqui e adicione na lista INSTALLED_APPS
    import CreatorApp from './CreatorApp.svelte'; 
    import TacticalApp from './TacticalApp.svelte';
    import PowerCreatorApp from './PowerCreatorApp.svelte';

    const INSTALLED_APPS = [
        { 
            id: 'creator', 
            label: 'NOVO AGENTE', 
            desc: 'REGISTRO DE IDENTIDADE',
            icon: 'fa-user-plus', 
            component: CreatorApp, 
            width: 420, height: 500,
            color: '#00ff41' 
        },
        { 
            id: 'tactical', 
            label: 'SUPORTE TÁTICO', 
            desc: 'OPERAÇÕES DE COMBATE',
            icon: 'fa-crosshairs', 
            component: TacticalApp, 
            width: 320, height: 450,
            color: '#ffcc00' 
        },

        { 
        id: 'power_forge', 
        label: 'FORJA DE PODER', 
        desc: 'CRIAR HABILIDADE (ITEM)',
        icon: 'fa-bolt', 
        component: PowerCreatorApp, 
        width: 420, height: 500,
        color: '#ffcc00' 
    },
        // Exemplo futuro:
        // { id: 'market', label: 'MERCADO', icon: 'fa-shopping-cart', component: MarketApp, ... }
    ];

    // --- 2. ESTADOS ---
    const isGM = game.user.isGM;
    let authorizedIDs = [];
    let isMeAuxiliar = false;
    let usersList = [];
    
    // Controle de Interface
    let viewMode = 'boot'; // 'boot' | 'desktop' | 'config' | 'locked'
    let bootLines = [];
    let currentTime = "";

    // --- 3. INICIALIZAÇÃO ---
    onMount(() => {
        refreshData();
        Hooks.on("auxiliarUpdate", refreshData);
        
        // Relógio
        setInterval(() => {
            const now = new Date();
            currentTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute:'2-digit' });
        }, 1000);

        // Inicia Boot se tiver acesso
        if (isMeAuxiliar) runBootSequence();
        else viewMode = 'locked';
    });

    function refreshData() {
        authorizedIDs = AuxiliarSystem.getAuthorizedUsers();
        isMeAuxiliar = AuxiliarSystem.isAuxiliar();
        
        usersList = game.users.filter(u => !u.isGM).map(u => ({
            id: u.id, name: u.name, color: u.color, isAuth: authorizedIDs.includes(u.id)
        }));

        // Se perder acesso no meio do uso, bloqueia
        if (!isMeAuxiliar && viewMode !== 'boot') viewMode = 'locked';
    }

    // --- 4. ANIMAÇÃO DE BOOT ---
    async function runBootSequence() {
        viewMode = 'boot';
        const lines = [
            "NEXUS_OS KERNEL v4.0.2...",
            "VERIFICANDO ASSINATURA BIOMÉTRICA...",
            `USUÁRIO IDENTIFICADO: [${game.user.name.toUpperCase()}]`,
            "NÍVEL DE PERMISSÃO: AUXILIAR",
            "CARREGANDO MÓDULOS..."
        ];

        for (const line of lines) {
            bootLines = [...bootLines, line];
            await new Promise(r => setTimeout(r, 400));
        }
        
        await new Promise(r => setTimeout(r, 600));
        viewMode = 'desktop';
    }

    // --- 5. SISTEMA DE JANELAS ---
    function launchApp(appConfig) {
        if (!appConfig.component) return ui.notifications.warn("Módulo não instalado.");

        class AppWindow extends Application {
            static get defaultOptions() {
                return foundry.utils.mergeObject(super.defaultOptions, {
                    id: `nexus-app-${appConfig.id}-${foundry.utils.randomID()}`,
                    title: `NEXUS // ${appConfig.label}`,
                    template: `modules/multiversus-rpg/templates/sheet.html`, // Use um template vazio válido
                    width: appConfig.width,
                    height: appConfig.height,
                    resizable: true,
                    classes: ["cyber-dialog"]
                });
            }
            
            activateListeners(html) {
                super.activateListeners(html);
                html.empty(); // Limpa template padrão
                const app = new appConfig.component({ target: html[0] });
                app.$on('close', () => this.close());
            }
        }
        new AppWindow().render(true);
    }

    // --- 6. GESTÃO DE USUÁRIOS ---
    async function toggleAuth(userId) {
        await AuxiliarSystem.toggleUserAccess(userId);
        refreshData();
    }
</script>

<div class="shell">
    
    <div class="scanlines"></div>
    <div class="noise"></div>

    {#if viewMode === 'boot'}
        <div class="boot-screen">
            <div class="logo-boot">
                <i class="fas fa-network-wired pulse"></i>
            </div>
            <div class="console-log">
                {#each bootLines as line}
                    <p class="log-line">> {line}</p>
                {/each}
                <span class="cursor">_</span>
            </div>
        </div>

    {:else if viewMode === 'locked'}
        <div class="locked-screen" in:fade>
            <i class="fas fa-lock large-icon"></i>
            <h2>ACESSO NEGADO</h2>
            <p>Sua assinatura neural não está autorizada.</p>
        </div>

    {:else}
        <div class="desktop-interface" in:scale={{duration: 500, start: 0.95}}>
            
            <header>
                <div class="brand">
                    <i class="fas fa-satellite-dish"></i> NEXUS_OS
                </div>
                <div class="system-time">{currentTime}</div>
                {#if isGM}
                    <button class="cfg-btn {viewMode === 'config' ? 'active' : ''}" 
                            on:click={() => viewMode = (viewMode === 'config' ? 'desktop' : 'config')}
                            title="Gerenciar Permissões">
                        <i class="fas fa-users-cog"></i>
                    </button>
                {/if}
            </header>

            <main>
                {#if viewMode === 'config' && isGM}
                    <div class="config-panel" transition:slide>
                        <h3><i class="fas fa-key"></i> GERENCIAMENTO DE ACESSO</h3>
                        <div class="user-list">
                            {#each usersList as user}
                                <div class="user-row" class:authorized={user.isAuth} on:click={() => toggleAuth(user.id)}>
                                    <div class="u-avatar" style="background-color: {user.color}"></div>
                                    <div class="u-info">
                                        <span class="u-name">{user.name}</span>
                                        <span class="u-status">{user.isAuth ? 'AUTORIZADO' : 'RESTRITO'}</span>
                                    </div>
                                    <div class="u-toggle">
                                        <i class="fas {user.isAuth ? 'fa-toggle-on' : 'fa-toggle-off'}"></i>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>

                {:else}
                    <div class="app-grid">
                        {#each INSTALLED_APPS as app}
                            <button class="app-icon" 
                                    style="--app-color: {app.color}"
                                    on:click={() => launchApp(app)}>
                                <div class="icon-box">
                                    <i class="fas {app.icon}"></i>
                                </div>
                                <div class="app-meta">
                                    <span class="label">{app.label}</span>
                                    <span class="desc">{app.desc}</span>
                                </div>
                            </button>
                        {/each}
                        
                        <button class="app-icon disabled">
                            <div class="icon-box">
                                <i class="fas fa-shopping-bag"></i>
                            </div>
                            <div class="app-meta">
                                <span class="label">LOJA</span>
                                <span class="desc">OFFLINE</span>
                            </div>
                        </button>
                    </div>
                {/if}
            </main>

            <footer>
                <div class="user-block">
                    <span class="indicator online"></span>
                    LOGADO COMO: <b>{game.user.name.toUpperCase()}</b>
                </div>
                <div class="sys-status">CONEXÃO SEGURA</div>
            </footer>
        </div>
    {/if}
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

    /* --- SHELL GERAL --- */
    .shell {
        width: 100%; height: 100%;
        background: radial-gradient(circle at center, #1a1a20 0%, #000 100%);
        font-family: 'Share Tech Mono', monospace;
        color: #e0e0e0;
        overflow: hidden;
        position: relative;
    }

    /* FX */
    .scanlines {
        position: absolute; inset: 0; pointer-events: none; z-index: 10;
        background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%);
        background-size: 100% 4px;
    }

    /* --- BOOT SCREEN --- */
    .boot-screen {
        height: 100%; display: flex; flex-direction: column;
        align-items: flex-start; justify-content: center;
        padding: 40px; color: #00ff41;
    }
    .logo-boot { font-size: 48px; margin-bottom: 20px; align-self: center; text-shadow: 0 0 20px #00ff41; }
    .log-line { margin: 5px 0; font-size: 14px; text-shadow: 0 0 5px #00ff41; }
    .pulse { animation: pulse 2s infinite; }
    .cursor { animation: blink 1s infinite; }

    /* --- LOCKED SCREEN --- */
    .locked-screen {
        height: 100%; display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        color: #ff3333; text-align: center;
    }
    .large-icon { font-size: 64px; margin-bottom: 20px; animation: pulse 1s infinite; }
    .locked-screen h2 { font-size: 24px; margin: 0; letter-spacing: 3px; }

    /* --- DESKTOP INTERFACE --- */
    .desktop-interface { display: flex; flex-direction: column; height: 100%; }

    header {
        background: rgba(255,255,255,0.05); border-bottom: 1px solid #333;
        padding: 10px 20px; display: flex; align-items: center; justify-content: space-between;
    }
    .brand { color: #fff; font-size: 18px; letter-spacing: 2px; text-shadow: 0 0 10px rgba(255,255,255,0.3); }
    .system-time { color: #00ff41; font-size: 16px; }
    .cfg-btn { background: none; border: 1px solid #444; color: #666; cursor: pointer; padding: 5px 10px; transition: 0.2s; }
    .cfg-btn:hover, .cfg-btn.active { color: #ffcc00; border-color: #ffcc00; box-shadow: 0 0 10px #ffcc00; }

    main { flex: 1; padding: 30px; overflow-y: auto; }

    /* GRID DE APPS */
    .app-grid {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 20px;
    }

    .app-icon {
        background: rgba(0,0,0,0.5); border: 1px solid #444;
        display: flex; flex-direction: column; align-items: center;
        padding: 15px; cursor: pointer; transition: 0.3s;
        border-radius: 4px; position: relative; overflow: hidden;
    }
    .app-icon:hover {
        background: rgba(255,255,255,0.05);
        border-color: var(--app-color, #fff);
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.5);
    }
    
    /* Efeito de brilho no ícone ao hover */
    .app-icon:hover .icon-box { color: var(--app-color, #fff); text-shadow: 0 0 15px var(--app-color, #fff); }

    .icon-box { font-size: 32px; color: #666; margin-bottom: 10px; transition: 0.3s; }
    
    .app-meta { text-align: center; }
    .app-meta .label { display: block; font-weight: bold; color: #eee; font-size: 12px; margin-bottom: 2px; }
    .app-meta .desc { display: block; font-size: 9px; color: #666; }

    .app-icon.disabled { opacity: 0.4; cursor: not-allowed; filter: grayscale(1); }

    /* --- CONFIG PANEL --- */
    .config-panel { background: rgba(0,0,0,0.3); border: 1px solid #444; padding: 15px; }
    .config-panel h3 { border-bottom: 1px solid #333; padding-bottom: 10px; margin-top: 0; color: #ffcc00; font-size: 14px; }
    
    .user-list { display: flex; flex-direction: column; gap: 5px; max-height: 300px; overflow-y: auto; }
    .user-row {
        display: flex; align-items: center; gap: 10px; padding: 8px;
        background: #111; border: 1px solid #333; cursor: pointer; transition: 0.2s;
    }
    .user-row:hover { background: #222; }
    .user-row.authorized { border-color: #00ff41; background: rgba(0, 255, 65, 0.05); }
    
    .u-avatar { width: 24px; height: 24px; border-radius: 50%; }
    .u-info { flex: 1; display: flex; flex-direction: column; }
    .u-name { font-weight: bold; font-size: 12px; }
    .u-status { font-size: 9px; color: #666; }
    .user-row.authorized .u-status { color: #00ff41; }
    .u-toggle { font-size: 16px; color: #444; }
    .user-row.authorized .u-toggle { color: #00ff41; text-shadow: 0 0 5px #00ff41; }

    /* FOOTER */
    footer {
        background: #0a0a0a; border-top: 1px solid #333; padding: 5px 20px;
        display: flex; justify-content: space-between; font-size: 10px; color: #555;
    }
    .user-block { display: flex; align-items: center; gap: 5px; }
    .indicator { width: 6px; height: 6px; border-radius: 50%; background: #444; }
    .indicator.online { background: #00ff41; box-shadow: 0 0 5px #00ff41; }

    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
    @keyframes blink { 50% { opacity: 0; } }
</style>