<script>
    import { onMount, onDestroy } from 'svelte';
    import { fade, fly, slide } from 'svelte/transition';
    import { MENU_THEMES } from './data/MainMenuThemeDB.js'; 
    import MinigameStar from './MinigameStar.svelte';
    import JornalApp from './JornalApp.svelte';

    export let app;
    export let onFinish;

    // --- CONFIGURAÇÕES GERAIS E DADOS DO FOUNDRY ---
    const MODULE_ID = "multiversus-rpg";
    const playerName = game.user.name;

    // Buscando Settings com proteção (Try/Catch) para evitar quebrar o boot
    let VIDEO_PATH = "";
    let MUSIC_PATH = "";
    let skipVideoPref = false;
    let skipLoginPref = false;
    let currentThemeId = "default";
    let customThemeColor = "#00ff41"; // Cor customizada padrão

    try {
        VIDEO_PATH = game.settings.get(MODULE_ID, "openingVideoUrl") || "";
        MUSIC_PATH = game.settings.get(MODULE_ID, "openingMusicUrl") || "";
        skipVideoPref = game.settings.get(MODULE_ID, "skipOpeningVideo");
        skipLoginPref = game.settings.get(MODULE_ID, "skipLoginAnim");
        currentThemeId = game.settings.get(MODULE_ID, "menuTheme") || "default";
        
        // Tenta buscar a cor customizada (se você tiver registrado no main.js)
        if (game.settings.settings.has(`${MODULE_ID}.customThemeColor`)) {
            customThemeColor = game.settings.get(MODULE_ID, "customThemeColor");
        } else {
            customThemeColor = localStorage.getItem(`${MODULE_ID}-custom-color`) || "#00ff41";
        }
    } catch (e) {
        console.warn("NEXUS | Algumas settings não foram encontradas. Usando padrões.", e);
    }

    // --- REATIVIDADE DO TEMA ---
    // Se o tema for "custom", usa a cor escolhida. Senão, puxa da Database.
    $: isCustomTheme = currentThemeId === 'custom';
    $: themeColor = isCustomTheme ? customThemeColor : (MENU_THEMES?.[currentThemeId]?.colors?.primary || '#00ff41');
    $: themeBg = MENU_THEMES?.[currentThemeId]?.colors?.bg || '#000';
    $: themeFont = MENU_THEMES?.[currentThemeId]?.font || 'monospace';

    // --- ESTADOS E VARIÁVEIS ---
    let state = 'init'; // video -> login -> minigame -> menu -> journal -> entering
    let showSettings = false;
    let terminalLines = [];
    
    // Controles de Animação e Áudio
    let bgAudio = null;
    let audioFadeInterval = null;
    let typingInterval = null;
    let closingTimer = null;
    let finished = false; 

    // --- CICLO DE VIDA ---
    onMount(() => {
        if (app?.element) {
            app.element.css({ width: '100vw', height: '100vh', border: 'none', zIndex: 999999, top: 0, left: 0 });
        }

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
        if (typingInterval) clearTimeout(typingInterval);
        stopMusic(); 
    });

    // --- SISTEMA DE ÁUDIO ---
    function startMusic() {
        if (!MUSIC_PATH || bgAudio) return;
        bgAudio = new Audio(MUSIC_PATH);
        bgAudio.loop = true;
        bgAudio.volume = 0;
        bgAudio.play().catch(() => console.log("Autoplay bloqueado pelo navegador."));

        let vol = 0;
        audioFadeInterval = setInterval(() => {
            if (vol < 0.4) { 
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

    // --- BOTÃO GLOBAL: PULAR INTRODUÇÃO ---
    function skipIntro() {
        if (typingInterval) clearTimeout(typingInterval);
        if (state === 'video' || state === 'login') {
            state = 'minigame';
            if (!bgAudio) startMusic();
        }
    }

    // --- FASES DA ABERTURA ---
    function endVideo() {
        if (!skipLoginPref) startLoginSequence();
        else startMenuSequence();
    }

    function startLoginSequence() {
        state = 'login';
        startMusic();
        runTerminalTyping();
    }

    async function runTerminalTyping() {
        terminalLines = [];
        const delay = ms => new Promise(r => { typingInterval = setTimeout(r, ms); });
        
        try {
            await delay(400);
            terminalLines = [...terminalLines, "Conectando Databases Centrais..."]; await delay(300);
            terminalLines = [...terminalLines, "Estabelecendo link neural..."]; await delay(400);
            terminalLines = [...terminalLines, "Buscando credenciais..."]; await delay(500);
            terminalLines = [...terminalLines, `> USER: ${playerName}`]; await delay(600);
            
            let passLine = "> PASS: *****";
            terminalLines = [...terminalLines, passLine];
            let passIndex = terminalLines.length - 1;

            for(let i=0; i<6; i++) {
                await delay(100 + Math.random()*100);
                terminalLines[passIndex] = (i % 2 === 0) ? "> PASS: <span class='glitch-elena'>SYSTEM</span>" : "> PASS: *****";
            }
            terminalLines[passIndex] = "> PASS: *****"; 
            await delay(500);

            terminalLines = [...terminalLines, "Autenticando..."]; await delay(800);
            terminalLines = [...terminalLines, "<span class='success'>ACESSO AUTORIZADO.</span>"]; await delay(600);
            terminalLines = [...terminalLines, `Bem-vindo à Rede, <strong>Guia</strong>.`]; 
            
            await delay(1200);
            if(state === 'login') state = 'minigame'; // Avança apenas se não pulou
        } catch (e) {
            // Caso o timer seja limpo pelo skip
        }
    }

    function onMinigameWin() { startMenuSequence(); }

    function startMenuSequence() {
        state = 'menu';
        if (!bgAudio) startMusic();
    }

    // --- NAVEGAÇÃO DO MENU PRINCIPAL ---
    function openJournal() { state = 'journal'; }
    function closeJournal() { state = 'menu'; }
    function openMinigames() { ui.notifications.info("Acessando Central de Minigames..."); /* Lógica futura aqui */ }
    function lockedAction() { ui.notifications.warn("ACESSO NEGADO: Módulo não instalado ou nível insuficiente."); }

    // --- CONFIGURAÇÕES ---
    async function changeTheme(id) {
        currentThemeId = id;
        try { await game.settings.set(MODULE_ID, "menuTheme", id); } catch(e) {}
    }

    async function handleCustomColorChange() {
        currentThemeId = 'custom';
        try {
            if (game.settings.settings.has(`${MODULE_ID}.customThemeColor`)) {
                await game.settings.set(MODULE_ID, "customThemeColor", customThemeColor);
            }
            localStorage.setItem(`${MODULE_ID}-custom-color`, customThemeColor);
            await game.settings.set(MODULE_ID, "menuTheme", 'custom');
        } catch(e) {}
    }

    async function togglePref(setting, value) {
        try {
            if (setting === 'video') {
                skipVideoPref = value;
                await game.settings.set(MODULE_ID, "skipOpeningVideo", value);
            }
            if (setting === 'login') {
                skipLoginPref = value;
                await game.settings.set(MODULE_ID, "skipLoginAnim", value);
            }
        } catch(e) {}
    }

    // --- ENTRADA FINAL ---
    function enterGame() {
        if (finished) return;
        finished = true;
        state = 'entering';
        
        stopMusic();

        closingTimer = setTimeout(() => {
            if (onFinish) onFinish(); 
            else if (app) app.close();
        }, 3000);
    }
</script>

<div class="main-container" style="--primary: {themeColor}; --bg-grad: {themeBg}; --font: {themeFont}">

    {#if state === 'video' || state === 'login'}
        <button class="global-skip-btn" on:click={skipIntro} in:fade={{delay: 1000}}>
            PULAR ABERTURA <i class="fas fa-forward"></i>
        </button>
    {/if}

    {#if state === 'video'}
        <div class="fullscreen-layer bg-black" out:fade={{duration: 800}}>
            <video src={VIDEO_PATH} autoplay crossOrigin="anonymous" on:ended={endVideo} class="video-element" on:click={skipIntro}></video>
        </div>
    {/if}

    {#if state === 'login'}
        <div class="fullscreen-layer bg-black terminal-layout scanlines" out:fade={{duration: 500}} on:click={skipIntro}>
            <div class="terminal-box">
                <div class="term-header">TERMINAL DE REDE // ACESSO PRIMÁRIO</div>
                <div class="term-content">
                    {#each terminalLines as line} 
                        <div class="term-line">{@html line}</div> 
                    {/each}
                    <div class="typing-line"><span class="cursor-blink">_</span></div>
                </div>
            </div>
            <div class="click-to-skip-hint">Clique em qualquer lugar para acelerar</div>
        </div>
    {/if}

    {#if state === 'minigame'}
        <div class="fullscreen-layer bg-black" in:fade={{duration: 500}} out:fade={{duration: 500}}>
            <MinigameStar themeColor={themeColor} on:win={onMinigameWin} />
            <div class="minigame-hint">SINTONIZE O SINAL PARA ENTRAR</div>
            <button class="bypass-btn" on:click={onMinigameWin}>[ BYPASS ]</button>
        </div>
    {/if}

    {#if state === 'menu'}
        <div class="fullscreen-layer main-menu" in:fly={{y: 30, duration: 1200, opacity: 0}}>
            
            <div class="logo-area">
                <h1 class="glitch-title">MULTIVERSUS RPG</h1>
                <div class="subtitle">DATA AND DEVIL</div>
            </div>

            <div class="menu-options">
                <button class="menu-btn primary" on:click={enterGame}>
                    <div class="btn-content"><i class="fas fa-power-off"></i> INICIAR SESSÃO</div>
                </button>

                <button class="menu-btn" on:click={openJournal}> 
                    <div class="btn-content"><i class="fas fa-newspaper"></i> DATA HELL NEWS</div>
                </button>

                <button class="menu-btn" on:click={openMinigames}> 
                    <div class="btn-content"><i class="fas fa-gamepad"></i> MINIGAMES</div>
                </button>

                <button class="menu-btn locked" on:click={lockedAction}>
                    <div class="btn-content"><i class="fas fa-user-secret"></i> REDE SECRETA</div>
                    <span class="tag">EM BREVE</span>
                </button>
            </div>

            <button class="settings-toggle" on:click={() => showSettings = true}>
                <i class="fas fa-cog"></i> OPÇÕES DE SISTEMA
            </button>

            {#if showSettings}
                <div class="settings-overlay" transition:fade on:click|self={() => showSettings = false}>
                    <div class="settings-modal" transition:fly={{y: 50, duration: 300}}>
                        <div class="settings-header">
                            <h3>PREFERÊNCIAS DE BOOT</h3>
                            <button class="close-settings" on:click={() => showSettings = false}>✕</button>
                        </div>
                        
                        <label class="toggle-row">
                            <span>Pular Vídeo de Abertura</span>
                            <input type="checkbox" checked={skipVideoPref} on:change={e => togglePref('video', e.target.checked)}>
                        </label>

                        <label class="toggle-row">
                            <span>Pular Terminal de Login</span>
                            <input type="checkbox" checked={skipLoginPref} on:change={e => togglePref('login', e.target.checked)}>
                        </label>

                        <div class="theme-section">
                            <span>Temas do Sistema:</span>
                            <div class="theme-grid">
                                {#if MENU_THEMES}
                                    {#each Object.values(MENU_THEMES) as t}
                                        <button class="theme-btn" class:selected={currentThemeId === t.id}
                                            style="background: {t.colors.primary}"
                                            on:click={() => changeTheme(t.id)} title={t.label}
                                        ></button>
                                    {/each}
                                {/if}
                            </div>
                        </div>

                        <div class="custom-theme-section">
                            <span>Ou crie sua própria cor:</span>
                            <div class="color-picker-wrapper">
                                <input type="color" bind:value={customThemeColor} on:change={handleCustomColorChange} class="custom-color-input">
                                <span style="color: {customThemeColor}; font-weight:bold;">{customThemeColor.toUpperCase()}</span>
                            </div>
                        </div>

                    </div>
                </div>
            {/if}

            <div class="footer-credits">
                STATUS: CONECTADO // ID: {game.user.id} // PING: {Math.floor(Math.random() * 40 + 10)}ms
            </div>
        </div>
    {/if}

    {#if state === 'journal'}
        <JornalApp on:close={closeJournal} />
    {/if}

    {#if state === 'entering'}
        <div class="fullscreen-layer entering-screen">
            <div class="welcome-msg">
                <span class="wel-sub">SINCRONIZANDO ATIVIDADE NEURAL...</span>
                <span class="wel-main">BEM VINDO, {playerName.toUpperCase()}</span>
            </div>
            <div class="loading-bar-container">
                <div class="bar-fill"></div>
            </div>
        </div>
    {/if}

</div>

<style>
    /* =========================================
       CSS GLOBAL (FORÇANDO TELA CHEIA NO FOUNDRY)
       ========================================= */
    :global(#nexus-opening) {
        top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important;
        background: black !important; border: none !important; margin: 0 !important;
        pointer-events: auto !important; z-index: 999999 !important;
    }
    :global(#nexus-opening .window-header) { display: none !important; }
    :global(#nexus-opening .window-content) { background: black !important; padding: 0 !important; overflow: hidden !important; }

    /* =========================================
       BASE & RESPONSIVIDADE
       ========================================= */
    .main-container { 
        width: 100%; height: 100%; 
        font-family: var(--font, 'monospace'); color: #fff; 
        background: radial-gradient(circle at center, #1a1a1a 0%, #000000 100%);
        overflow: hidden; position: relative; 
    }

    .fullscreen-layer { 
        position: absolute; inset: 0; display: flex; flex-direction: column; 
        align-items: center; justify-content: center; width: 100%; height: 100%;
    }
    .bg-black { background: #000; }

    /* Botão Global de Pular */
    .global-skip-btn {
        position: absolute; bottom: clamp(20px, 5vw, 50px); right: clamp(20px, 5vw, 50px);
        background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.3); color: #fff; 
        padding: 10px 20px; cursor: pointer; font-family: inherit; font-size: clamp(0.8rem, 2vw, 1rem);
        transition: 0.3s; z-index: 100; letter-spacing: 2px; border-radius: 4px; backdrop-filter: blur(4px);
    }
    .global-skip-btn:hover { background: var(--primary); border-color: var(--primary); color: #000; font-weight: bold; box-shadow: 0 0 15px var(--primary); }

    /* =========================================
       FASE 1: VÍDEO
       ========================================= */
    .video-element { width: 100%; height: 100%; object-fit: cover; cursor: pointer; }

    /* =========================================
       FASE 2: TERMINAL DE LOGIN
       ========================================= */
    .terminal-layout { justify-content: flex-start; padding-top: 15vh; font-family: 'Courier New', monospace; cursor: pointer; }
    .terminal-box { width: min(800px, 90vw); text-align: left; z-index: 2; }
    .term-header { 
        border-bottom: 2px solid var(--primary); margin-bottom: 20px; padding-bottom: 10px; 
        font-weight: bold; color: var(--primary); font-size: clamp(1rem, 3vw, 1.5rem); letter-spacing: 2px;
    }
    .term-content { font-size: clamp(1rem, 2.5vw, 1.6rem); color: var(--primary); text-shadow: 0 0 8px var(--primary); }
    .term-line { margin-bottom: 8px; min-height: 1.6rem; word-break: break-word; }
    .cursor-blink { display: inline-block; animation: blink 1s infinite; font-weight: bold; color: var(--primary); }
    .click-to-skip-hint { position: absolute; bottom: 20px; color: #555; font-size: 0.8rem; letter-spacing: 2px; animation: blink 2s infinite; }

    :global(.glitch-elena) { color: #fff; text-shadow: 2px 0 var(--primary); animation: glitch 0.15s infinite; font-weight: bold; }
    :global(.success) { color: #fff; font-weight: bold; }

    .scanlines::before {
        content: " "; display: block; position: absolute; inset: 0;
        background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
        z-index: 2; background-size: 100% 2px, 3px 100%; pointer-events: none;
    }

    /* =========================================
       FASE 3: MINIGAME
       ========================================= */
    .minigame-hint { position: absolute; bottom: 80px; color: var(--primary); letter-spacing: 4px; font-weight: bold; font-size: clamp(0.8rem, 2vw, 1.2rem); text-align: center;}
    .bypass-btn { position: absolute; bottom: 30px; background: transparent; border: none; color: #444; font-family: inherit; font-size: 0.8rem; cursor: pointer; transition: 0.2s;}
    .bypass-btn:hover { color: var(--primary); }

    /* =========================================
       FASE 4: MENU PRINCIPAL
       ========================================= */
    .main-menu { background: var(--bg-grad); gap: 4vh; }
    
    .logo-area { text-align: center; padding: 0 20px; }
    .logo-area h1 { font-size: clamp(2.5rem, 8vw, 5rem); margin: 0; color: #fff; text-shadow: 0 0 20px var(--primary); text-transform: uppercase; line-height: 1; letter-spacing: clamp(2px, 2vw, 8px); }
    .logo-area .subtitle { color: var(--primary); letter-spacing: clamp(4px, 2vw, 10px); font-size: clamp(0.8rem, 2vw, 1.2rem); margin-top: 15px; opacity: 0.9; }

    .menu-options { display: flex; flex-direction: column; gap: 15px; width: min(400px, 90vw); z-index: 10; }
    
    .menu-btn { 
        padding: clamp(15px, 3vw, 20px); background: rgba(20,20,20,0.9); border: 1px solid #444; color: #ccc; 
        cursor: pointer; font-family: inherit; font-size: clamp(1rem, 2.5vw, 1.2rem); 
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex; align-items: center; justify-content: space-between; 
        clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
    }
    .btn-content { display: flex; align-items: center; gap: 15px; }
    
    .menu-btn.primary { border-color: var(--primary); color: #fff; box-shadow: 0 0 15px rgba(0,0,0,0.5); }
    .menu-btn.primary:hover { background: var(--primary); color: #000; transform: translateX(10px); box-shadow: 0 0 30px var(--primary); font-weight: bold;}
    .menu-btn:not(.primary):not(.locked):hover { background: rgba(255,255,255,0.05); color: var(--primary); border-color: var(--primary); transform: translateX(5px); }
    
    .menu-btn.locked { border-style: dashed; opacity: 0.5; filter: grayscale(1); cursor: not-allowed; }
    .menu-btn.locked:hover { color: #ff3333; border-color: #ff3333; transform: none; }
    .menu-btn .tag { font-size: 0.7rem; background: #000; padding: 4px 8px; border: 1px solid #555; color: #888; border-radius: 2px;}

    .settings-toggle { background: none; border: none; color: #666; cursor: pointer; margin-top: 10px; font-size: clamp(0.8rem, 2vw, 0.9rem); z-index: 10; transition: 0.3s; letter-spacing: 1px; }
    .settings-toggle:hover { color: var(--primary); text-shadow: 0 0 10px var(--primary); }
    .footer-credits { position: absolute; bottom: 20px; font-size: clamp(0.5rem, 1.5vw, 0.7rem); color: #444; letter-spacing: 2px; font-weight: bold; text-align: center; width: 100%;}

    /* MODAL DE CONFIGURAÇÕES */
    .settings-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.6); z-index: 20; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .settings-modal { background: rgba(15,15,18,0.95); border: 1px solid var(--primary); padding: 30px; width: min(400px, 100%); border-radius: 8px; box-shadow: 0 10px 50px rgba(0,0,0,0.9); backdrop-filter: blur(10px); }
    .settings-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
    .settings-header h3 { margin: 0; color: var(--primary); font-size: 1.2rem; }
    .close-settings { background: transparent; border: none; color: #888; font-size: 1.2rem; cursor: pointer; transition: 0.2s; }
    .close-settings:hover { color: #ff3333; }
    
    .toggle-row { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 0.95rem; cursor: pointer; align-items: center; color: #ccc;}
    .theme-section { margin-top: 25px; border-top: 1px dashed #333; padding-top: 20px; color: #ccc;}
    .theme-grid { display: flex; gap: 12px; margin-top: 15px; flex-wrap: wrap; }
    .theme-btn { width: 35px; height: 35px; border-radius: 50%; border: 2px solid #444; cursor: pointer; transition: 0.2s; }
    .theme-btn:hover { transform: scale(1.1); border-color: #fff; }
    .theme-btn.selected { border-color: #fff; box-shadow: 0 0 15px #fff; transform: scale(1.1); }

    .custom-theme-section { margin-top: 25px; padding-top: 20px; border-top: 1px dashed #333; color: #ccc;}
    .color-picker-wrapper { display: flex; align-items: center; gap: 15px; margin-top: 10px; background: rgba(0,0,0,0.5); padding: 10px; border-radius: 4px; border: 1px solid #333;}
    .custom-color-input { width: 40px; height: 40px; border: none; border-radius: 4px; cursor: pointer; background: transparent; padding: 0; }
    .custom-color-input::-webkit-color-swatch-wrapper { padding: 0; }
    .custom-color-input::-webkit-color-swatch { border: 1px solid #555; border-radius: 4px; }

    /* =========================================
       FASE 6: ENTRANDO NO JOGO
       ========================================= */
    .entering-screen { background: #000; z-index: 999; animation: fadeOutScreen 3s forwards; padding: 20px; text-align: center; }
    .welcome-msg { margin-bottom: 40px; }
    .wel-sub { display: block; font-size: clamp(0.7rem, 2vw, 1rem); color: var(--primary); margin-bottom: 15px; letter-spacing: 4px; opacity: 0.8; }
    .wel-main { display: block; font-size: clamp(2rem, 6vw, 4rem); color: #fff; font-weight: bold; text-shadow: 0 0 30px #fff; letter-spacing: 2px; }
    
    .loading-bar-container { width: min(500px, 90vw); height: 4px; background: #222; border-radius: 2px; overflow: hidden; }
    .bar-fill { height: 100%; background: var(--primary); width: 0%; animation: loadBar 2.5s ease-in-out forwards; box-shadow: 0 0 20px var(--primary); }

    /* --- ANIMAÇÕES --- */
    @keyframes blink { 50% { opacity: 0; } }
    @keyframes loadBar { 0% { width: 0%; } 100% { width: 100%; } }
    @keyframes fadeOutScreen { 0%, 80% { opacity: 1; } 100% { opacity: 0; pointer-events: none; } }
    
    .glitch-title { animation: glitch 4s infinite; }
    @keyframes glitch { 
        0%, 100% { transform: translate(0); opacity: 1; } 
        1% { transform: translate(-2px, 1px); opacity: 0.9; } 
        2% { transform: translate(2px, -1px); opacity: 1; } 
    }
</style>