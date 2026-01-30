<script>
    import { onMount } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    import { cubicIn, cubicOut } from 'svelte/easing';
    
    // --- IMPORTAÇÃO DOS APPS ---
    import ProfileApp from '../../apps/ProfileApp.svelte'; 
    import SettingsApp from '../../apps/SettingsApp.svelte';
    import CombatApp from '../../apps/CombatApp.svelte';
    import SurvivalApp from '../../apps/SurvivalApp.svelte'; 
    import BaseApp from '../../apps/BaseApp.svelte';
    import PoderesApp from '../../apps/PoderesApp.svelte'; 
    import InventoryApp from '../../apps/InventoryApp.svelte';

    // --- PROPS RECEBIDAS DO PAI (Ficha.svelte) ---
    export let actor;
    export let system;
    // O pai já calculou tudo isso e nos entrega pronto
    export let currentThemeData;
    export let themeId;
    export let cssString;
    export let themeColor;

    const MODULE_ID = "multiversus-rpg";

    // --- 1. DADOS REATIVOS (FLAGS) ---
    $: flags = actor?.flags?.[MODULE_ID] || {};
    $: wallpaperURL = flags.wallpaper || "https://mir-s3-cdn-cf.behance.net/project_modules/hd/e4316a93890387.5e70ade47b737.gif"; 

    // --- 2. REATIVIDADE DO FOUNDRY ---
    onMount(() => {
        const hookId = Hooks.on("updateActor", (doc, changes) => {
            if (doc.id === actor.id) { flags = actor.flags[MODULE_ID] || {}; }
        });
        return () => Hooks.off("updateActor", hookId);
    });

    // --- 3. LÓGICA DE LOGIN (Exclusiva deste tema) ---
    let loginState = 'idle'; 
    let bootText = "";
    let activeApp = null; 
    let inputBuffer = ""; 

    $: if (loginState === 'idle' && (flags.fastBoot)) {
        loginState = 'logged_in';
    }

    function closeSystem() { actor.sheet.close(); }

    function startLoginSequence() {
        loginState = 'verifying';
        bootText = "AUTENTICANDO...";
        setTimeout(() => {
            loginState = 'welcome';
            bootText = `ACESSO CONCEDIDO: ${actor.name.toUpperCase()}`;
            setTimeout(() => { loginState = 'logged_in'; }, 1200);
        }, 1500);
    }

    function handleKeydown(e) {
        if (loginState !== 'idle') return;
        if (e.key === 'Enter') {
            if (inputBuffer.length === 6) { 
                const savedPass = flags.password || "";
                if (savedPass && inputBuffer !== savedPass) {
                    inputBuffer = ""; 
                    ui.notifications.warn(">> ACESSO NEGADO: CÓDIGO INVÁLIDO");
                    return;
                }
                startLoginSequence();
            }
        } else if (e.key === 'Backspace') {
            inputBuffer = inputBuffer.slice(0, -1);
        } else if (e.key.length === 1 && inputBuffer.length < 6 && /^[0-9a-zA-Z]*$/.test(e.key)) {
            inputBuffer += e.key;
        }
    }

    const desktopIcons = [
        { id: 'combat', icon: 'fa-crosshairs', label: 'COMBATE' },
        { id: 'profile', icon: 'fa-id-card', label: 'PERFIL' },
        { id: 'inv', icon: 'fa-box-open', label: 'INVENTÁRIO' },
        { id: 'powers', icon: 'fa-bolt', label: 'PODERES' },
        { id: 'survival', icon: 'fa-heartbeat', label: 'SOBREVIVENTE' },
        { id: 'base', icon: 'fa-warehouse', label: 'BASE / GRUPO' },
        { id: 'settings', icon: 'fa-cogs', label: 'SISTEMA' },
        { id: 'shutdown', icon: 'fa-power-off', label: 'DESLIGAR', action: closeSystem } 
    ];
</script>

<svelte:window on:keydown={handleKeydown}/>

<div class="cyber-frame root-terminal" style="{cssString}" data-theme={themeId}>
    
    <div class="decor-layer">
        <div class="code-border code-top"></div>
        <div class="code-border code-bottom"></div>
        <div class="code-border code-left"></div>
        <div class="code-border code-right"></div>
        <div class="corner-decor top-left"></div>
        <div class="corner-decor top-right"></div>
        <div class="corner-decor bottom-left"></div>
        <div class="corner-decor bottom-right"></div>
        
        <div class="wallpaper-layer" style="background-image: url('{wallpaperURL}')"></div>
        <div class="grid-layer"></div>
        <div class="scanlines"></div>
        <div class="vignette"></div>
    </div>

    {#if loginState !== 'logged_in'}
        <div class="login-layer" out:fly={{y: -50, duration: 500, easing: cubicIn}}>
            <div class="login-container">
                <div class="avatar-assembly" class:scanning={loginState === 'verifying'}>
                    <div class="ring-outer"></div>
                    <div class="ring-inner"></div>
                    <div class="avatar-hex">
                        <img src={actor.img} class="bio-img" alt="User ID"/>
                        <div class="scan-beam"></div> 
                    </div>
                </div>
                
                <div class="login-info">
                    <h1>{actor.name.toUpperCase()}</h1>
                    <div class="status-line">
                        <span class="status-dot" class:active={loginState === 'verifying'}></span>
                        <small>{loginState === 'idle' ? 'AGUARDANDO CREDENCIAIS' : bootText}</small>
                    </div>
                </div>

                {#if loginState === 'idle'}
                    <div class="pass-input-box" in:fade>
                        {#each Array(6) as _, i}
                            <div class="digit-box" class:filled={i < inputBuffer.length}>
                                {i < inputBuffer.length ? '●' : ''}
                            </div>
                        {/each}
                    </div>
                    <div class="login-prompt blink">
                        {inputBuffer.length < 6 ? "INSIRA O CÓDIGO DE ACESSO" : "[ PRESSIONE ENTER PARA INICIAR ]"}
                    </div>
                {/if}
            </div>
        </div>

    {:else}
        <div class="os-container" in:fade={{duration: 800, easing: cubicOut}}>
            <header class="status-bar">
                <div class="bar-left"><span class="led"></span> ONLINE</div>
                <div class="bar-center">SYSTEM v5.0 // {currentThemeData.label}</div>
                <div class="bar-right">{actor.name}</div>
            </header>

            <main class="viewport">
                {#if activeApp === null}
                    <div class="desktop-grid" in:fade={{duration: 300}}>
                        {#each desktopIcons as icon}
                            <button class="icon-btn" class:danger={icon.id === 'shutdown'}
                                on:click={() => icon.action ? icon.action() : activeApp = icon.id}>
                                <div class="icon-frame">
                                    <i class="fas {icon.icon}"></i>
                                    <div class="glitch-overlay"></div>
                                </div>
                                <div class="label-box"><span class="icon-label">{icon.label}</span></div>
                            </button>
                        {/each}
                    </div>
                {:else}
                    <div class="window-frame" in:fly={{ y: 20, duration: 300 }}>
                        <div class="window-header">
                            <div class="header-left">
                                <i class="fas fa-terminal"></i>
                                <span class="win-title">run/{activeApp}.exe</span>
                            </div>
                            <button class="win-close" on:click={() => activeApp = null}>
                                [ FECHAR ] <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="window-content-area">
                            {#if activeApp === 'combat'} <CombatApp {actor} {system} themeColor={themeColor} />
                            {:else if activeApp === 'profile'} <ProfileApp {actor} {system} themeColor={themeColor} />
                            {:else if activeApp === 'settings'} <SettingsApp {actor} on:close={() => activeApp = null} />
                            {:else if activeApp === 'survival'} <SurvivalApp {actor} />
                            {:else if activeApp === 'base'} <BaseApp {actor} />
                            {:else if activeApp === 'powers'} <PoderesApp {actor} themeColor={themeColor} />
                            {:else if activeApp === 'inv'} <InventoryApp {actor} themeColor={themeColor} />
                            {:else}
                                <div class="wip-msg">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    <span>MÓDULO OFF-LINE</span>
                                </div>
                            {/if}
                        </div>
                    </div> 
                {/if}
            </main>
        </div>
    {/if}
</div>

<style>
    /* Mantenha o seu CSS atual aqui dentro, ele funcionará perfeitamente 
       pois as variáveis CSS agora vêm injetadas no .root-terminal */
    .root-terminal {
        position: absolute; inset: 0;
        background: var(--c-bg);
        color: var(--c-text);
        font-family: var(--font-body);
        border: var(--border-style);
        border-radius: var(--border-radius);
        box-shadow: var(--box-shadow);
        backdrop-filter: var(--backdrop);
        overflow: hidden; display: flex; flex-direction: column;
        padding: 5px;
    }
    
    /* ... resto do seu CSS (decor-layer, login-layer, etc) ... */
    .decor-layer { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
    .wallpaper-layer { position: absolute; inset: 0; background-size: cover; background-position: center; opacity: 0.4; filter: contrast(1.1) brightness(0.8); }
    .grid-layer { position: absolute; inset: 0; background-image: radial-gradient(var(--c-primary) 1px, transparent 1px); background-size: 40px 40px; opacity: 0.1; }
    .scanlines { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.2) 50%); background-size: 100% 4px; opacity: 0.5; }
    .vignette { position: absolute; inset: 0; background: radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.8) 100%); }
    .code-border { position: absolute; opacity: 0.6; background-color: var(--c-primary); box-shadow: 0 0 5px var(--c-primary); }
    .code-top { top: 0; left: 0; right: 0; height: 2px; }
    .code-bottom { bottom: 0; left: 0; right: 0; height: 2px; }
    .corner-decor { position: absolute; width: 20px; height: 20px; border: 2px solid var(--c-primary); opacity: 0.8; }
    .top-left { top: 0; left: 0; border-right: none; border-bottom: none; }
    .top-right { top: 0; right: 0; border-left: none; border-bottom: none; }
    .bottom-left { bottom: 0; left: 0; border-right: none; border-top: none; }
    .bottom-right { bottom: 0; right: 0; border-left: none; border-top: none; }

    .login-layer { position: absolute; inset: 0; z-index: 100; background: var(--c-bg); display: flex; align-items: center; justify-content: center; pointer-events: auto; }
    .login-container { display: flex; flex-direction: column; align-items: center; gap: 20px; width: 100%; max-width: 400px; }
    .avatar-assembly { width: 160px; height: 160px; position: relative; display: flex; align-items: center; justify-content: center; }
    .ring-outer { position: absolute; inset: 0; border: 2px dashed var(--c-primary); border-radius: 50%; animation: spin-slow 10s linear infinite; opacity: 0.3; }
    .ring-inner { position: absolute; inset: 10px; border: 2px solid transparent; border-top-color: var(--c-primary); border-bottom-color: var(--c-primary); border-radius: 50%; animation: spin 3s linear infinite; opacity: 0.8; box-shadow: 0 0 10px var(--c-primary); }
    .avatar-hex { width: 120px; height: 120px; border-radius: 50%; overflow: hidden; border: 2px solid var(--c-primary); position: relative; background: #000; box-shadow: inset 0 0 20px var(--c-primary); }
    .bio-img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(1) sepia(1); transition: 0.5s; }
    .scan-beam { position: absolute; top: -10%; left: 0; right: 0; height: 5px; background: var(--c-primary); box-shadow: 0 0 15px var(--c-primary); opacity: 0.5; animation: scan-vertical 2s ease-in-out infinite; }
    .login-info h1 { font-family: var(--font-head); font-size: 28px; margin: 0; text-align: center; color: var(--c-primary); text-shadow: 0 0 10px var(--c-primary); letter-spacing: 2px; }
    .status-line { display: flex; align-items: center; gap: 8px; color: var(--c-text); opacity: 0.8; font-size: 12px; }
    .status-dot { width: 8px; height: 8px; background: #333; border-radius: 50%; }
    .status-dot.active { background: var(--c-primary); box-shadow: 0 0 8px var(--c-primary); animation: blink 0.5s infinite; }
    .pass-input-box { display: flex; gap: 12px; }
    .digit-box { width: 45px; height: 55px; border: 1px solid var(--c-primary); display: flex; align-items: center; justify-content: center; font-size: 24px; color: var(--c-primary); background: rgba(0,0,0,0.3); box-shadow: inset 0 0 10px rgba(0,0,0,0.5); transition: 0.2s; }
    .digit-box.filled { background: var(--c-primary); color: #000; box-shadow: 0 0 15px var(--c-primary); }
    .login-prompt { color: var(--c-text); font-size: 11px; letter-spacing: 2px; margin-top: 10px; opacity: 0.6; }

    .os-container { display: flex; flex-direction: column; width: 100%; height: 100%; position: relative; z-index: 10; pointer-events: auto; }
    .status-bar { height: 32px; background: rgba(0,0,0,0.8); border-bottom: 1px solid var(--c-primary); display: flex; justify-content: space-between; align-items: center; padding: 0 15px; font-size: 11px; font-weight: bold; font-family: var(--font-head); color: var(--c-primary); }
    .led { display: inline-block; width: 6px; height: 6px; background: var(--c-primary); border-radius: 50%; margin-right: 6px; box-shadow: 0 0 5px var(--c-primary); }
    .viewport { flex: 1; position: relative; overflow: hidden; padding: 15px; }
    .desktop-grid { height: 100%; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); grid-auto-rows: 120px; gap: 15px; align-content: start; justify-items: center; position: relative; z-index: 20; }
    .icon-btn { background: transparent; border: none; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px; width: 100%; transition: 0.2s; pointer-events: auto; }
    .icon-btn:hover { transform: scale(1.05); filter: brightness(1.2); }
    .icon-frame { width: 64px; height: 64px; border: 2px solid var(--c-primary); display: flex; align-items: center; justify-content: center; font-size: 28px; background: rgba(0,0,0,0.4); color: var(--c-primary); clip-path: polygon(15% 0, 100% 0, 100% 85%, 85% 100%, 0 100%, 0 15%); transition: 0.2s; position: relative; overflow: hidden; }
    .icon-btn:hover .icon-frame { background: var(--c-primary); color: #000; box-shadow: 0 0 20px var(--c-primary); }
    .icon-label { font-size: 10px; font-weight: bold; font-family: var(--font-head); background: rgba(0,0,0,0.8); border: 1px solid var(--c-primary); padding: 3px 8px; border-radius: 2px; color: var(--c-primary); }

    .window-frame { position: absolute; inset: 0; display: flex; flex-direction: column; background: var(--c-bg); border: 1px solid var(--c-primary); box-shadow: 0 0 40px rgba(0,0,0,0.8); pointer-events: auto; z-index: 50; }
    .window-header { padding: 8px 15px; background: rgba(0,0,0,0.8); border-bottom: 1px solid var(--c-primary); display: flex; justify-content: space-between; align-items: center; font-family: var(--font-head); }
    .header-left { display: flex; align-items: center; gap: 8px; font-weight: bold; font-size: 12px; color: var(--c-primary); }
    .win-close { background: transparent; border: 1px solid var(--c-primary); color: var(--c-primary); padding: 4px 10px; font-size: 10px; cursor: pointer; transition: 0.2s; }
    .win-close:hover { background: var(--c-primary); color: #000; }
    .window-content-area { flex: 1; position: relative; overflow: hidden; display: flex; flex-direction: column; }
    .wip-msg { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0.5; color: var(--c-primary); }

    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes scan-vertical { 0% { top: 0%; } 50% { top: 100%; } 100% { top: 0%; } }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

    :global(.root-terminal i) { text-shadow: 0 0 5px currentColor; }
    :global(::-webkit-scrollbar) { width: 8px; background: rgba(0,0,0,0.5); }
    :global(::-webkit-scrollbar-thumb) { background: var(--c-primary) !important; border-radius: var(--border-radius); }
</style>