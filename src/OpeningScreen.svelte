<script>
    import { onMount, onDestroy } from 'svelte';
    import { fade, fly, slide } from 'svelte/transition';
    import { MENU_THEMES } from './data/MainMenuThemeDB.js'; 
    import MinigameStar from './MinigameStar.svelte';

    export let app;
    export let onFinish;

    // --- CONFIGURAÇÕES GERAIS ---
    // Links que você pode configurar no Foundry (Settings)
    const VIDEO_PATH = game.settings.get("multiversus-rpg", "openingVideoUrl");
    // Adicione esta setting no seu main.js se quiser mudar via menu, ou deixe fixo aqui para teste
const MUSIC_PATH = game.settings.get("multiversus-rpg", "openingMusicUrl");

    // Preferências do Usuário
    let skipVideoPref = game.settings.get("multiversus-rpg", "skipOpeningVideo");
    let skipLoginPref = game.settings.get("multiversus-rpg", "skipLoginAnim");
    let currentThemeId = game.settings.get("multiversus-rpg", "menuTheme") || "default";

    // Tema Ativo
    $: theme = MENU_THEMES?.[currentThemeId] || MENU_THEMES?.['default'] || { colors: { primary: '#00ff41', bg: '#000' }, font: 'monospace' };

    // --- ESTADOS E VARIÁVEIS ---
    let state = 'init'; // video -> login -> minigame -> menu -> entering
    let showSettings = false;
    let terminalLines = [];
    const playerName = game.user.name;
    
    // Controle de Áudio
    let bgAudio = null;
    let audioFadeInterval = null;

    // Travas de Segurança
    let closingTimer = null;
    let finished = false; 

    // --- CICLO DE VIDA ---
    onMount(() => {
        // Força bruta visual (embora o JS principal já faça isso)
        if (app?.element) {
            app.element.css({ width: '100vw', height: '100vh', border: 'none', zIndex: 999999 });
        }

        // Decide onde começar
        if (VIDEO_PATH && !skipVideoPref) {
            state = 'video';
        } else if (!skipLoginPref) {
            startLoginSequence();
        } else {
            startMenuSequence();
        }
    });

    onDestroy(() => {
        if (closingTimer) clearTimeout(closingTimer);
        stopMusic(); // Para a música ao sair
    });

    // --- SISTEMA DE ÁUDIO (Fade In/Out) ---
    function startMusic() {
        if (!MUSIC_PATH) return;
        bgAudio = new Audio(MUSIC_PATH);
        bgAudio.loop = true;
        bgAudio.volume = 0;
        bgAudio.play().catch(e => console.log("Autoplay bloqueado pelo navegador:", e));

        // Fade In suave
        let vol = 0;
        audioFadeInterval = setInterval(() => {
            if (vol < 0.5) { // Volume máximo 50%
                vol += 0.05;
                if (bgAudio) bgAudio.volume = vol;
            } else {
                clearInterval(audioFadeInterval);
            }
        }, 200);
    }

    function stopMusic() {
        if (audioFadeInterval) clearInterval(audioFadeInterval);
        if (bgAudio) {
            // Fade Out rápido
            let vol = bgAudio.volume;
            const fadeOut = setInterval(() => {
                if (vol > 0.05) {
                    vol -= 0.05;
                    bgAudio.volume = vol;
                } else {
                    clearInterval(fadeOut);
                    bgAudio.pause();
                    bgAudio = null;
                }
            }, 100);
        }
    }

    // --- FASE 1: VÍDEO ---
    function endVideo() {
        if (!skipLoginPref) startLoginSequence();
        else startMenuSequence();
    }

    // --- FASE 2: LOGIN TERMINAL ---
    function startLoginSequence() {
        state = 'login';
        startMusic(); // A música começa aqui (após o vídeo)
        runTerminalTyping();
    }

    async function runTerminalTyping() {
        terminalLines = [];
        const delay = ms => new Promise(r => setTimeout(r, ms));
        
        // Sequência Narrativa
        await delay(500);
        terminalLines = [...terminalLines, "Conectando as Databases Centrais de todos os Eixos de Existência.."]; await delay(400);
        terminalLines = [...terminalLines, "Estabelecendo link neural com todos os jogadores..."]; await delay(600);
        terminalLines = [...terminalLines, "Buscando credenciais de acesso válidas..."]; await delay(600);
        
        terminalLines = [...terminalLines, "> USER: Volheim"]; await delay(800);
        
        // Efeito Glitch da Senha
        let passLine = "> PASS: *****";
        terminalLines = [...terminalLines, passLine];
        let passIndex = terminalLines.length - 1;

        // Loop de glitch (Elena / *****)
        for(let i=0; i<8; i++) {
            await delay(100 + Math.random()*150);
            // Alterna o texto na mesma linha
            terminalLines[passIndex] = (i % 2 === 0) ? "> PASS: <span class='glitch-elena'>ELENA</span>" : "> PASS: *****";
        }
        terminalLines[passIndex] = "> PASS: *****"; // Trava no final
        await delay(600);

        terminalLines = [...terminalLines, "Autenticando..."]; await delay(1000);
        terminalLines = [...terminalLines, "<span class='success'>ACESSO AUTORIZADO.</span>"]; await delay(500);
        terminalLines = [...terminalLines, `Bem-vindo à Rede, <strong>Guia</strong>.`]; 
        
        await delay(1500);
        state = 'minigame';
    }

    // --- FASE 3: MINIGAME ---
    function onMinigameWin() { 
        startMenuSequence();
    }

    // --- FASE 4: MENU PRINCIPAL ---
    function startMenuSequence() {
        state = 'menu';
        if (!bgAudio) startMusic(); // Garante música se pulou tudo direto pro menu
    }

    function toggleSettings() {
        showSettings = !showSettings;
    }

    async function changeTheme(id) {
        currentThemeId = id;
        await game.settings.set("multiversus-rpg", "menuTheme", id);
    }

    async function togglePref(setting, value) {
        if (setting === 'video') {
            skipVideoPref = value;
            await game.settings.set("multiversus-rpg", "skipOpeningVideo", value);
        }
        if (setting === 'login') {
            skipLoginPref = value;
            await game.settings.set("multiversus-rpg", "skipLoginAnim", value);
        }
    }

    function lockedAction() {
        ui.notifications.warn("ACESSO NEGADO: Módulo não instalado ou nível insuficiente.");
    }

    // --- FASE 5: ENTRADA FINAL ---
    function enterGame() {
        if (finished) return;
        finished = true;
        state = 'entering';
        
        // Fade out da música
        stopMusic();

        // Espera a animação visual (3.5s) e fecha
        closingTimer = setTimeout(() => {
            if (onFinish) onFinish(); // Chama o Main.js para abrir o Loading
            else if (app) app.close();
        }, 3500);
    }
</script>

<div class="main-container" style="--primary: {theme.colors.primary}; --bg-grad: {theme.colors.bg}; --font: {theme.font}">

    {#if state === 'video'}
        <div class="fullscreen-layer bg-black" out:fade={{duration: 1000}}>
            <video 
                src={VIDEO_PATH} 
                autoplay 
                crossOrigin="anonymous"
                on:ended={endVideo}
                class="video-element"
                on:click={endVideo}
            ></video>
            <button class="skip-btn" on:click={endVideo}>
                PULAR TRANSMISSÃO <i class="fas fa-forward"></i>
            </button>
        </div>
    {/if}

    {#if state === 'login'}
        <div class="fullscreen-layer bg-black terminal-layout scanlines" out:fade={{duration: 500}}>
            <div class="terminal-box">
                <div class="term-header">TERMINAL DE SEGURANÇA DA *****, DIVISÂO ALPHA</div>
                
                {#each terminalLines as line} 
                    <div class="term-line">
                        {@html line} </div> 
                {/each}
                
                <div class="typing-line">
                    <span class="cursor-blink">_</span>
                </div>
            </div>
            <button class="skip-text-btn" on:click={() => state = 'minigame'}>[ PULAR BOOT ]</button>
        </div>
    {/if}

    {#if state === 'minigame'}
        <div class="fullscreen-layer bg-black" in:fade={{duration: 500}} out:fade={{duration: 500}}>
            <MinigameStar themeColor={theme.colors.primary} on:win={onMinigameWin} />
            <div class="minigame-hint">CAPTURE O SINAL PARA PROSSEGUIR</div>
            <button class="skip-text-btn" on:click={onMinigameWin}>[ BYPASS SECURITY ]</button>
        </div>
    {/if}

    {#if state === 'menu'}
        <div class="fullscreen-layer main-menu" in:fly={{y: 50, duration: 1500, opacity: 0}}>
            
            <div class="logo-area">
                <h1 class="glitch-title">MULTIVERSUS RPG</h1>
                <div class="subtitle">SEASON 1: DATA AND DEVIL</div>
            </div>

            <div class="menu-options">
                <button class="menu-btn primary" on:click={enterGame}>
                    <i class="fas fa-power-off"></i> 
                    <span>INICIAR SESSÃO</span>
                </button>

                <button class="menu-btn locked" on:click={lockedAction}>
                    <i class="fas fa-newspaper"></i> 
                    <span>JORNAL DO NEXUS</span>
                    <span class="tag">EM BREVE</span>
                </button>

                <button class="menu-btn locked" on:click={lockedAction}>
                    <i class="fas fa-user-secret"></i> 
                    <span>REDE SECRETA</span>
                    <span class="tag">EM BREVE</span>
                </button>
            </div>

            <button class="settings-toggle" on:click={toggleSettings} class:active={showSettings}>
                <i class="fas fa-cog"></i> OPÇÕES DE SISTEMA
            </button>

            {#if showSettings}
                <div class="settings-modal" transition:slide={{duration: 300}}>
                    <h3>PREFERÊNCIAS DE BOOT</h3>
                    
                    <label class="toggle-row">
                        <span>Pular Vídeo de Abertura</span>
                        <input type="checkbox" checked={skipVideoPref} on:change={e => togglePref('video', e.target.checked)}>
                    </label>

                    <label class="toggle-row">
                        <span>Pular Login/Animação</span>
                        <input type="checkbox" checked={skipLoginPref} on:change={e => togglePref('login', e.target.checked)}>
                    </label>

                    <div class="theme-section">
                        <span>Interface Theme:</span>
                        <div class="theme-grid">
                            {#if MENU_THEMES}
                                {#each Object.values(MENU_THEMES) as t}
                                    <button 
                                        class="theme-btn" 
                                        class:selected={currentThemeId === t.id}
                                        style="background: {t.colors.primary}"
                                        on:click={() => changeTheme(t.id)}
                                        title={t.label}
                                    ></button>
                                {/each}
                            {/if}
                        </div>
                    </div>
                </div>
            {/if}

            <div class="footer-credits">
                STATUS: CONECTADO // ID: {game.user.id} // PING: {Math.floor(Math.random() * 50 + 20)}ms
            </div>
        </div>
    {/if}

    {#if state === 'entering'}
        <div class="fullscreen-layer entering-screen">
            <div class="welcome-msg">
                <span class="wel-sub">SINCRONIZANDO ATIVIDADE NEURAL DO ATIVO COM A DIVISÂO GAMA...</span>
                <span class="wel-main">BEM VINDO, {playerName.toUpperCase()}</span>
            </div>
            <div class="loading-bar-container">
                <div class="bar-fill"></div>
            </div>
        </div>
    {/if}

</div>

<style>
    /* CSS NUCLEAR PARA TELA CHEIA */
    /* Importante para sobrepor o Foundry */
    :global(#nexus-opening) {
        top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important;
        background: black !important; border: none !important; margin: 0 !important;
        pointer-events: auto !important; z-index: 999999 !important;
    }
    :global(#nexus-opening .window-header) { display: none !important; }
    :global(#nexus-opening .window-content) {
        background: black !important; padding: 0 !important; margin: 0 !important; overflow: hidden !important; width: 100% !important; height: 100% !important;
    }

    /* CONTAINER PRINCIPAL */
    .main-container { 
        width: 100%; height: 100%; 
        font-family: var(--font, 'monospace'); 
        color: #fff; 
        background: radial-gradient(circle at center, #1a1a1a 0%, #000000 100%);
        overflow: hidden; position: relative; 
    }

    .fullscreen-layer { 
        position: absolute; inset: 0; 
        display: flex; flex-direction: column; 
        align-items: center; justify-content: center; 
        width: 100%; height: 100%;
    }
    
    .bg-black { background: #000; }

    /* --- VÍDEO --- */
    .video-element { width: 100%; height: 100%; object-fit: cover; }
    .skip-btn { 
        position: absolute; bottom: 40px; right: 40px; 
        background: rgba(0,0,0,0.7); border: 1px solid #fff; color: #fff; 
        padding: 12px 25px; cursor: pointer; font-family: inherit; font-size: 1rem;
        transition: 0.3s; z-index: 10; letter-spacing: 2px;
    }
    .skip-btn:hover { background: #fff; color: #000; }

    /* --- TERMINAL --- */
    .terminal-layout { justify-content: flex-start; padding-top: 15vh; font-family: 'Courier New', monospace; }
    .terminal-box { width: 800px; max-width: 90%; text-align: left; z-index: 2; }
    .term-header { 
        border-bottom: 2px solid var(--primary); margin-bottom: 20px; padding-bottom: 10px; 
        font-weight: bold; color: var(--primary); font-size: 1.5rem; letter-spacing: 2px;
    }
    .term-line { margin-bottom: 8px; font-size: 1.6rem; color: var(--primary); text-shadow: 0 0 8px var(--primary); min-height: 1.6rem; }
    .cursor-blink { display: inline-block; animation: blink 1s infinite; font-weight: bold; color: var(--primary); font-size: 1.6rem; }
    
    /* Efeitos Especiais de Texto */
    :global(.glitch-elena) { color: #ff0055; text-shadow: 2px 0 #fff; animation: glitch 0.15s infinite; font-weight: bold; }
    :global(.success) { color: #fff; font-weight: bold; }

    /* Scanlines (Efeito CRT) */
    .scanlines::before {
        content: " "; display: block; position: absolute; top: 0; left: 0; bottom: 0; right: 0;
        background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
        z-index: 2; background-size: 100% 2px, 3px 100%; pointer-events: none;
    }

    /* --- MENU PRINCIPAL --- */
    .main-menu { background: var(--bg-grad); gap: 5vh; }
    .logo-area h1 { font-size: 5rem; margin: 0; color: #fff; text-shadow: 0 0 20px var(--primary); text-transform: uppercase; line-height: 1; letter-spacing: 8px; }
    .logo-area .subtitle { color: var(--primary); letter-spacing: 10px; font-size: 1.2rem; margin-top: 15px; opacity: 0.9; text-align: center; }

    .menu-options { display: flex; flex-direction: column; gap: 20px; width: 400px; z-index: 10; }
    
    .menu-btn { 
        padding: 20px; background: rgba(20,20,20,0.9); border: 1px solid #444; color: #ccc; 
        cursor: pointer; font-family: inherit; font-size: 1.3rem; 
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex; align-items: center; justify-content: space-between; 
        clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
    }
    
    .menu-btn.primary { border-color: var(--primary); color: #fff; box-shadow: 0 0 15px rgba(0,0,0,0.5); }
    .menu-btn.primary:hover { background: var(--primary); color: #000; transform: translateX(10px); box-shadow: 0 0 30px var(--primary); }
    
    .menu-btn.locked { border-style: dashed; opacity: 0.5; filter: grayscale(1); }
    .menu-btn.locked:hover { color: #ff3333; border-color: #ff3333; transform: translateX(5px); }
    
    .menu-btn .tag { font-size: 0.7rem; background: #000; padding: 2px 6px; border: 1px solid #555; color: #888; }

    /* CONFIGURAÇÕES */
    .settings-toggle { background: none; border: none; color: #666; cursor: pointer; margin-top: 20px; font-size: 0.9rem; z-index: 10; transition: 0.3s; letter-spacing: 1px; }
    .settings-toggle:hover, .settings-toggle.active { color: #fff; text-shadow: 0 0 10px #fff; }

    .settings-modal { 
        position: absolute; bottom: 80px; background: rgba(10,10,10,0.95); 
        border: 1px solid var(--primary); padding: 25px; width: 350px; 
        border-radius: 4px; z-index: 20; box-shadow: 0 0 50px rgba(0,0,0,0.8);
        backdrop-filter: blur(10px);
    }
    .settings-modal h3 { margin: 0 0 20px 0; color: var(--primary); border-bottom: 1px solid #333; padding-bottom: 10px; font-size: 1.1rem; }
    
    .toggle-row { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 0.9rem; cursor: pointer; align-items: center; }
    .theme-section { margin-top: 20px; border-top: 1px dashed #333; padding-top: 15px; }
    .theme-grid { display: flex; gap: 10px; margin-top: 10px; }
    .theme-btn { width: 30px; height: 30px; border-radius: 50%; border: 2px solid #444; cursor: pointer; transition: 0.2s; }
    .theme-btn:hover { transform: scale(1.1); border-color: #fff; }
    .theme-btn.selected { border-color: #fff; box-shadow: 0 0 10px #fff; transform: scale(1.2); }

    .footer-credits { position: absolute; bottom: 20px; font-size: 0.7rem; color: #444; letter-spacing: 3px; font-weight: bold; }

    /* ENTRANDO (TRANSITION SCREEN) */
    .entering-screen { background: #000; z-index: 999; animation: fadeOutScreen 3.5s forwards; }
    .welcome-msg { text-align: center; margin-bottom: 40px; }
    .wel-sub { display: block; font-size: 1rem; color: var(--primary); margin-bottom: 15px; letter-spacing: 5px; opacity: 0.8; }
    .wel-main { display: block; font-size: 4rem; color: #fff; font-weight: bold; text-shadow: 0 0 30px #fff; letter-spacing: 2px; }
    
    .loading-bar-container { width: 400px; height: 4px; background: #222; border-radius: 2px; overflow: hidden; }
    .bar-fill { height: 100%; background: var(--primary); width: 0%; animation: loadBar 3s ease-in-out forwards; box-shadow: 0 0 20px var(--primary); }

    /* ANIMAÇÕES */
    @keyframes blink { 50% { opacity: 0; } }
    @keyframes loadBar { 0% { width: 0%; } 100% { width: 100%; } }
    @keyframes fadeOutScreen {
        0% { opacity: 1; }
        85% { opacity: 1; } 
        100% { opacity: 0; pointer-events: none; }
    }
    
    .glitch-title { animation: glitch 4s infinite; }
    @keyframes glitch { 
        0%, 100% { transform: translate(0); opacity: 1; } 
        1% { transform: translate(-2px, 1px); opacity: 0.9; } 
        2% { transform: translate(2px, -1px); opacity: 1; } 
    }
</style>