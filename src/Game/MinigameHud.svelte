<script>
    import { createEventDispatcher } from 'svelte';
    import { fade, scale, fly } from 'svelte/transition';

    export let themeColor = "#00ff41";
    export let themeBg = "#000";

    const dispatch = createEventDispatcher();

    // ==========================================
    // DATABASE DE MINIGAMES
    // Para adicionar um novo jogo, basta colocar aqui!
    // ==========================================
    const minigames = [
        {
            id: 'slay_multiversus',
            title: 'Slay The Multiversus',
            description: 'Uma jornada roguelike de construção de baralhos através do Multiverso.',
            icon: 'fas fa-layer-group', // Ícone do FontAwesome
            status: 'dev', // 'online', 'offline', 'dev'
            author: 'Sistema MV'
        },
        {
            id: 'hacker_run',
            title: 'Invasão de Rede',
            description: 'Quebre firewalls antes que o tempo acabe.',
            icon: 'fas fa-terminal',
            status: 'locked',
            author: 'Desconhecido'
        }
    ];

    let selectedGame = null;

    function closeHud() {
        dispatch('close');
    }

    function launchGame(game) {
        if (game.status === 'locked' || game.status === 'offline') {
            ui.notifications.warn(`NEXUS | [${game.title}] está inacessível no momento.`);
            return;
        }
        
        // Se for status 'dev', avisamos mas deixamos abrir a tela de placeholder
        if (game.status === 'dev') {
            ui.notifications.info(`NEXUS | Iniciando ambiente de desenvolvimento para: ${game.title}`);
        }

        selectedGame = game.id;
    }

    function returnToHud() {
        selectedGame = null;
    }
</script>

<div class="fullscreen-layer hud-background" style="--primary: {themeColor}; --bg-grad: {themeBg}" in:fade out:fade>
    
    <!-- CABEÇALHO DA CENTRAL -->
    <div class="hud-header" in:fly={{y: -20, duration: 500}}>
        <div class="header-title">
            <i class="fas fa-gamepad"></i> 
            <h2>CENTRAL DE MINIGAMES MV</h2>
        </div>
        <button class="close-btn" on:click={closeHud}>
            [ FECHAR CONEXÃO ] <i class="fas fa-times"></i>
        </button>
    </div>

    <!-- ÁREA DE CONTEÚDO -->
    <div class="hud-content">
        
        {#if !selectedGame}
            <!-- LISTA DE JOGOS -->
            <div class="game-grid" in:scale={{duration: 400, start: 0.9}}>
                {#each minigames as game}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div class="game-card status-{game.status}" on:click={() => launchGame(game)}>
                        <div class="card-icon">
                            <i class="{game.icon}"></i>
                        </div>
                        <div class="card-info">
                            <h3>{game.title}</h3>
                            <p>{game.description}</p>
                            <div class="card-footer">
                                <span class="author">DEV: {game.author}</span>
                                <span class="badge badge-{game.status}">{game.status.toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {:else}
            <!-- ÁREA DO JOGO ATIVO -->
            <div class="active-game-container" in:fade={{duration: 300}}>
                <div class="active-game-nav">
                    <button class="back-btn" on:click={returnToHud}>
                        <i class="fas fa-arrow-left"></i> VOLTAR PARA A CENTRAL
                    </button>
                    <span class="active-game-id">RUNNING: {selectedGame}.exe</span>
                </div>

                <div class="game-viewport">
                    <!-- AQUI ENTRARÁ O SLAY THE MULTIVERSUS -->
                    {#if selectedGame === 'slay_multiversus'}
                        <div class="game-placeholder">
                            <i class="fas fa-layer-group placeholder-icon"></i>
                            <h1>SLAY THE MULTIVERSUS</h1>
                            <p>O ambiente de desenvolvimento está pronto para ser programado.</p>
                            <div class="loading-dots">Aguardando inserção de código do próximo pacote...</div>
                        </div>
                    {/if}
                </div>
            </div>
        {/if}

    </div>
</div>

<style>
    /* =========================================
       BASE DA CENTRAL
       ========================================= */
    .hud-background {
        background: rgba(10, 10, 12, 0.95);
        backdrop-filter: blur(10px);
        z-index: 50; /* Fica acima do menu principal */
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        font-family: var(--font, 'monospace');
        color: #fff;
    }

    .hud-header {
        width: 100%;
        padding: 20px 40px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid var(--primary);
        background: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%);
        box-sizing: border-box;
    }

    .header-title { display: flex; align-items: center; gap: 15px; }
    .header-title i { font-size: 2rem; color: var(--primary); }
    .header-title h2 { margin: 0; font-size: 1.8rem; letter-spacing: 4px; text-shadow: 0 0 10px var(--primary); }

    .close-btn {
        background: transparent; border: 1px solid var(--primary); color: var(--primary);
        padding: 10px 20px; cursor: pointer; font-family: inherit; font-weight: bold;
        transition: 0.3s;
    }
    .close-btn:hover { background: var(--primary); color: #000; box-shadow: 0 0 15px var(--primary); }

    .hud-content {
        flex: 1;
        width: 100%;
        max-width: 1200px;
        padding: 40px 20px;
        box-sizing: border-box;
        overflow-y: auto;
    }

    /* =========================================
       GRID DE JOGOS
       ========================================= */
    .game-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 25px;
    }

    .game-card {
        background: rgba(20, 20, 25, 0.8);
        border: 1px solid #333;
        border-radius: 8px;
        padding: 20px;
        display: flex;
        gap: 20px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
    }

    .game-card:hover {
        transform: translateY(-5px);
        border-color: var(--primary);
        box-shadow: 0 10px 20px rgba(0,0,0,0.5), inset 0 0 15px rgba(255,255,255,0.05);
    }

    .game-card::before {
        content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
        background: #333; transition: 0.3s;
    }
    .game-card:hover::before { background: var(--primary); box-shadow: 0 0 10px var(--primary); }

    .card-icon {
        font-size: 2.5rem; color: #666; display: flex; align-items: center; justify-content: center;
        width: 60px; transition: 0.3s;
    }
    .game-card:hover .card-icon { color: var(--primary); text-shadow: 0 0 15px var(--primary); }

    .card-info { flex: 1; display: flex; flex-direction: column; }
    .card-info h3 { margin: 0 0 10px 0; font-size: 1.2rem; letter-spacing: 1px; color: #eee; }
    .card-info p { margin: 0 0 15px 0; font-size: 0.9rem; color: #aaa; line-height: 1.4; flex: 1; }

    .card-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #333; padding-top: 10px; }
    .author { font-size: 0.7rem; color: #555; }
    .badge { font-size: 0.7rem; padding: 4px 8px; border-radius: 4px; font-weight: bold; letter-spacing: 1px; }

    /* Cores de Status */
    .badge-dev { background: #ffaa0033; color: #ffaa00; border: 1px solid #ffaa00; }
    .badge-online { background: #00ff4133; color: #00ff41; border: 1px solid #00ff41; }
    .badge-offline { background: #ff333333; color: #ff3333; border: 1px solid #ff3333; }
    .badge-locked { background: #55555533; color: #888; border: 1px solid #555; }

    .status-locked { opacity: 0.6; filter: grayscale(1); }
    .status-locked:hover { transform: none; border-color: #555; cursor: not-allowed; }
    .status-locked:hover::before { background: #555; box-shadow: none; }

    /* =========================================
       ÁREA DO JOGO ATIVO
       ========================================= */
    .active-game-container {
        width: 100%; height: 100%; display: flex; flex-direction: column;
    }

    .active-game-nav {
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px dashed #333;
    }

    .back-btn {
        background: transparent; border: none; color: #aaa; cursor: pointer;
        font-family: inherit; font-size: 1rem; display: flex; align-items: center; gap: 10px;
        transition: 0.2s;
    }
    .back-btn:hover { color: var(--primary); text-shadow: 0 0 10px var(--primary); }
    
    .active-game-id { color: #555; font-size: 0.8rem; letter-spacing: 2px; }

    .game-viewport {
        flex: 1; background: rgba(0,0,0,0.8); border: 1px solid #222; border-radius: 8px;
        display: flex; align-items: center; justify-content: center; position: relative;
        overflow: hidden;
    }

    /* PLACEHOLDER SLAY THE MULTIVERSUS */
    .game-placeholder { text-align: center; color: #555; }
    .placeholder-icon { font-size: 5rem; color: var(--primary); opacity: 0.2; margin-bottom: 20px; }
    .game-placeholder h1 { color: var(--primary); letter-spacing: 5px; margin-bottom: 10px; }
    .loading-dots { margin-top: 20px; font-size: 0.9rem; color: #888; animation: pulse 1.5s infinite; }

    @keyframes pulse {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
    }
</style>