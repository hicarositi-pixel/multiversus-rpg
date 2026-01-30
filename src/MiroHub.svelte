<script>
    import { onMount } from 'svelte';
    import { fade, scale } from 'svelte/transition';
    import { MiroDatabase } from './database/MiroDatabase.js';

    export let themeColor = "#00ff41"; 
    export let mode = "players"; 
    export let onClose;

    // --- SEU LINK DE ACESSO LIVRE (CONFIGURADO) ---
    const DEFAULT_LINKS = {
        gm: "https://miro.com/welcomeonboard/Y3ZjSklZbHY2NC9CeExwSW4vVjQwSmVBekxBdlhRNEZYWXVUZEJDc2JydERLeDlMWG12U2tHeW9Yamk2VjJYT0hIM0xtM0FYekI1Znd2eGR1WWZXcGE5d2EyS0ExWW83Z24xYllQRVROOUY3dWx6eGdva1g2KzdPUlJIZHlybStnbHpza3F6REdEcmNpNEFOMmJXWXBBPT0hdjE=?share_link_id=634191516972", // Link de visualização rápida
        players: "https://miro.com/welcomeonboard/WG9lTnNFek13RTVKOXBrQ3JOR04rUk11UTBOeExkemplV0xJbTVhQnUzNE9PTG5uaWUxWno1Uks2ZXY0aUxpMFFlYnRWdG0yTFEyeWZOV0lZMzFlY3E5d2EyS0ExWW83Z24xYllQRVROOUdEVVJJVmpJbU05RmI2eHZhT1pRenR3VHhHVHd5UWtSM1BidUtUYmxycDRnPT0hdjE=?share_link_id=331100619246"
    };

    let miroURL = "";
    let isEditing = false;
    let isExternalLink = false;

    $: {
        // Detecção automática: Se não tiver "live-embed", é um link que o Chrome vai bloquear no iframe
        isExternalLink = miroURL && !miroURL.includes("live-embed");
    }

    onMount(() => {
        const savedURL = MiroDatabase.getURL(mode);
        miroURL = savedURL || DEFAULT_LINKS[mode];
    });

    function launchExternal() {
        window.open(miroURL, '_blank');
    }

    async function saveURL() {
        await MiroDatabase.setURL(mode, miroURL);
        isEditing = false;
        ui.notifications.info("PROTOCOLO DE ACESSO ATUALIZADO.");
    }
</script>

<div class="miro-window-root" style="--c-primary: {themeColor}" transition:fade>
    
    <header class="miro-header">
        <div class="header-left">
            <span class="led"></span>
            <span class="title">DETETIVE_HUB // {mode.toUpperCase()}</span>
        </div>
        
        <div class="header-actions">
            {#if game.user.isGM}
                <button class="action-btn config" on:click={() => isEditing = !isEditing}>
                    <i class="fas fa-cog"></i>
                </button>
            {/if}
            <button class="action-btn close" on:click={onClose}>[X]</button>
        </div>
    </header>

    <div class="miro-body">
        {#if isEditing}
            <div class="setup-overlay">
                <div class="setup-card">
                    <h3>CONFIGURAÇÃO DE LINK</h3>
                    <input type="text" bind:value={miroURL} placeholder="Cole o link do Miro aqui..." />
                    <button class="save-btn" on:click={saveURL}>VINCULAR NÚCLEO</button>
                </div>
            </div>
        {/if}

        {#if isExternalLink}
            <div class="external-launcher" in:fade>
                <div class="hacker-loader">
                    <div class="scan-bar"></div>
                </div>
                <i class="fas fa-shield-alt icon-big"></i>
                <h2>CONEXÃO EXTERNA REQUERIDA</h2>
                <p>O servidor Miro exige autenticação via terminal externo para este link de colaboração.</p>
                
                <div class="link-display">{miroURL.substring(0, 50)}...</div>

                <button class="launch-button" on:click={launchExternal}>
                    <i class="fas fa-external-link-alt"></i> ESTABELECER CONEXÃO
                </button>
                
                <div class="status-log">
                    > STATUS: AGUARDANDO_INTERAÇÃO_HUMANA...<br>
                    > SEGURANÇA: ENCRIPTADO_SSL
                </div>
            </div>
        {:else if miroURL && miroURL.includes("live-embed")}
            <iframe src={miroURL} title="Miro Board" allowfullscreen></iframe>
        {:else}
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>LINK_NÃO_CONFIGURADO</p>
            </div>
        {/if}
    </div>
</div>

<style>
    .miro-window-root {
        position: fixed; inset: 40px;
        background: #020202; border: 1px solid var(--c-primary);
        z-index: 30000; display: flex; flex-direction: column;
        box-shadow: 0 0 50px #000; font-family: 'Share Tech Mono', monospace;
    }

    .miro-header {
        background: #0a0a0a; padding: 10px 20px;
        display: flex; justify-content: space-between; align-items: center;
        border-bottom: 1px solid rgba(var(--c-primary), 0.3);
    }

    .led { width: 8px; height: 8px; background: var(--c-primary); border-radius: 50%; display: inline-block; margin-right: 10px; box-shadow: 0 0 8px var(--c-primary); }
    .title { color: var(--c-primary); font-size: 12px; letter-spacing: 1px; }

    .action-btn { background: transparent; border: none; color: #555; cursor: pointer; transition: 0.2s; }
    .action-btn:hover { color: var(--c-primary); }

    .miro-body { flex: 1; position: relative; background: #000; overflow: hidden; }
    iframe { width: 100%; height: 100%; border: none; }

    /* VISUAL DO LANÇADOR */
    .external-launcher {
        height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;
        color: var(--c-primary); text-align: center; background: radial-gradient(circle, #0a0a0a 0%, #000 100%);
    }

    .icon-big { font-size: 60px; margin-bottom: 20px; opacity: 0.8; filter: drop-shadow(0 0 10px var(--c-primary)); }

    .link-display {
        font-size: 10px; background: #111; padding: 5px 15px; border-radius: 20px;
        color: #444; margin: 15px 0; border: 1px solid #222;
    }

    .launch-button {
        background: var(--c-primary); color: #000; border: none;
        padding: 15px 40px; font-weight: bold; cursor: pointer;
        font-family: inherit; font-size: 16px; transition: 0.3s;
        margin-bottom: 30px; clip-path: polygon(10% 0, 100% 0, 90% 100%, 0% 100%);
    }

    .launch-button:hover { transform: scale(1.05); box-shadow: 0 0 25px var(--c-primary); }

    .status-log { text-align: left; font-size: 10px; color: #333; line-height: 1.5; }

    .hacker-loader {
        position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: #111;
    }
    .scan-bar {
        width: 30%; height: 100%; background: var(--c-primary);
        animation: scan 2s infinite linear;
    }

    .setup-overlay { position: absolute; inset: 0; z-index: 100; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; }
    .setup-card { background: #0a0a0a; border: 1px solid var(--c-primary); padding: 30px; text-align: center; }
    .setup-card input { width: 350px; background: #000; border: 1px solid #333; color: #fff; padding: 10px; margin: 15px 0; outline: none; }
    .save-btn { background: var(--c-primary); color: #000; border: none; padding: 10px 20px; font-weight: bold; cursor: pointer; font-family: inherit; }

    @keyframes scan { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }
</style>