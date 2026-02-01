<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import { SHEET_THEMES } from '../data/SheetThemeDB.js'; 
    import PassManager from '../PassManager.svelte'; // Se ainda for usar, mantenha

    export let actor;
    export let flags; // Recebe as flags atualizadas da Ficha Pai

    const dispatch = createEventDispatcher();
    const MODULE_ID = "multiversus-rpg";
    const isGM = game.user.isGM;

    // --- ESTADO LOCAL ---
    // Sincroniza com as flags recebidas
    $: activeThemeKey = flags.sheetConfig?.theme || 'terminal';
    $: wallpaper = flags.sheetConfig?.wallpaper || "";
    $: fastBoot = flags.sheetConfig?.fastBoot || false;
    $: password = flags.sheetConfig?.password || ""; // Senha salva
    
    // Tamanho da janela
    $: winWidth = flags.sheetConfig?.windowSize?.width || 800;
    $: winHeight = flags.sheetConfig?.windowSize?.height || 700;
    
    let actorImg = actor.img;
    let tempUrl = ""; 
    let showPassManager = false;

    // --- REATIVIDADE DE TEMA ---
    $: currentThemeData = SHEET_THEMES[activeThemeKey] || SHEET_THEMES['terminal'];
    $: cssVariables = Object.entries(currentThemeData.vars)
        .map(([key, val]) => `${key}: ${val};`)
        .join(' ');

    // --- FUNÇÃO DE SALVAMENTO UNIFICADA ---
    async function updateConfig(key, value) {
        // Atualiza a flag específica dentro de sheetConfig
        await actor.update({
            [`flags.${MODULE_ID}.sheetConfig.${key}`]: value
        }, { render: false }); 
        
        // Dica: A ficha pai (Ficha.svelte) vai detectar essa mudança via Hook e atualizar o login
    }

    // --- AÇÕES ESPECÍFICAS ---

    function selectTheme(key) {
        updateConfig('theme', key);
    }

    function applyWallpaper() {
        if (!tempUrl) return ui.notifications.warn("Insira uma URL válida.");
        updateConfig('wallpaper', tempUrl);
        ui.notifications.info("Wallpaper do terminal atualizado.");
    }

    // Fast Boot: Se ligado, pula a tela de login
    function toggleFastBoot(checked) {
        updateConfig('fastBoot', checked);
        if (checked) {
            ui.notifications.info("Fast Boot ativado: Login será automático.");
        } else {
            ui.notifications.info("Fast Boot desativado: Senha será exigida.");
        }
    }

    // Senha: Salva o código de 6 dígitos
    function savePassword(newPass) {
        // Remove caracteres não numéricos se quiser forçar PIN
        // const cleanPass = newPass.replace(/\D/g, ''); 
        updateConfig('password', newPass);
    }

    function pickImage() {
        new FilePicker({
            type: "image",
            current: actorImg,
            callback: async (path) => { 
                actorImg = path;
                await actor.update({ img: path });
            }
        }).browse();
    }

    // --- JANELA (RESIZE) ---
    async function manualResize(w, h) {
        // Atualiza visualmente agora
        actor.sheet.setPosition({ width: w, height: h });
        // Salva para persistir
        await actor.update({ [`flags.${MODULE_ID}.sheetConfig.windowSize`]: { width: w, height: h } }, { render: false });
    }
    
    function resetWindow() { manualResize(800, 700); }

    function close() { dispatch('close'); }
</script>

<div class="terminal-wrapper" transition:fade={{ duration: 200 }} style="{cssVariables}">
    
    <header class="terminal-header">
        <div class="branding">
            <span class="pulse-dot"></span>
            <span class="title">SYS_CONFIG // {currentThemeData.label}</span>
        </div>
        <button type="button" class="close-trigger" on:click={close}>[ X ]</button>
    </header>

    <div class="terminal-content">
        
        <aside class="profile-section">
            <div class="avatar-uplink" on:click={pickImage}>
                <img src={actorImg} alt="Uplink" />
                <div class="overlay"><i class="fas fa-camera"></i></div>
            </div>
            <div class="actor-id">
                <small>ID_USER</small>
                <div class="name">{actor.name}</div>
                {#if isGM}
                    <span class="gm-tag">[ ADMIN ACCESS ]</span>
                {/if}
            </div>
        </aside>

        <main class="settings-grid">
            
            <section class="group">
                <h2 class="group-title">:: TEMA VISUAL ::</h2>
                <div class="theme-grid">
                    {#each Object.entries(SHEET_THEMES) as [key, data]}
                        <button 
                            class="theme-card" 
                            class:active={activeThemeKey === key}
                            on:click={() => selectTheme(key)}
                            style="--preview-primary: {data.vars['--c-primary']}; --preview-bg: {data.vars['--c-bg']}"
                        >
                            <div class="theme-preview"></div>
                            <div class="theme-info">
                                <span class="theme-name">{data.label}</span>
                                <span class="theme-desc">{data.desc}</span>
                            </div>
                            {#if activeThemeKey === key}
                                <i class="fas fa-check-circle check-icon"></i>
                            {/if}
                        </button>
                    {/each}
                </div>

                <div class="setting-row vertical">
                    <label>Wallpaper do Terminal (URL)</label>
                    <div class="input-with-button">
                        <input 
                            type="text" 
                            bind:value={tempUrl} 
                            placeholder={wallpaper || "Cole a URL do GIF aqui..."}
                            class="url-input"
                        />
                        <button type="button" class="apply-btn" on:click={applyWallpaper} title="Sincronizar Link">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                    <small class="helper-text">Recomendado: GIFs dark ou tech. Atual: {wallpaper ? 'Definido' : 'Padrão'}</small>
                </div>
            </section>

            <section class="group">
                <h2 class="group-title">:: SEGURANÇA & ACESSO ::</h2>
                
                <div class="security-panel">
                    <div class="setting-row">
                        <div class="label-group">
                            <label>Fast Boot Protocol</label>
                            <small>Pular tela de login e verificação de biometria.</small>
                        </div>
                        <label class="switch">
                            <input type="checkbox" checked={fastBoot} on:change={e => toggleFastBoot(e.target.checked)}>
                            <span class="slider round"></span>
                        </label>
                    </div>

                    <div class="setting-row vertical">
                        <div class="label-group">
                            <label>Código de Acesso Pessoal (PIN)</label>
                            <small>Senha de 6 dígitos exigida se o Fast Boot estiver desligado.</small>
                        </div>
                        
                        <div class="pass-input-wrapper">
                            <input 
                                type="text" 
                                value={password} 
                                maxlength="6" 
                                placeholder="******"
                                on:change={e => savePassword(e.target.value)} 
                                class="pass-input"
                            />
                            <i class="fas fa-lock lock-icon"></i>
                        </div>
                        
                        {#if isGM}
                            <div class="gm-note">
                                <i class="fas fa-eye"></i> GM: Você pode ver e resetar a senha do jogador aqui.
                            </div>
                        {/if}
                    </div>
                </div>
            </section>

            <section class="group">
                <h2 class="group-title">:: RESOLUÇÃO ::</h2>
                <div class="res-control">
                    <div class="res-input">
                        <span>LARGURA</span>
                        <input type="number" value={winWidth} on:change={e => manualResize(Number(e.target.value), winHeight)}>
                    </div>
                    <span class="x">x</span>
                    <div class="res-input">
                        <span>ALTURA</span>
                        <input type="number" value={winHeight} on:change={e => manualResize(winWidth, Number(e.target.value))}>
                    </div>
                    <button class="reset-btn" on:click={resetWindow} title="Resetar Padrão"><i class="fas fa-undo"></i></button>
                </div>
            </section>

        </main>
    </div>
</div>


<style>
    /* =========================================================================
       CSS DINÂMICO (HERDA TUDO DO TEMA SELECIONADO)
       ========================================================================= */
    .terminal-wrapper {
        width: 100%; height: 100%; display: flex; flex-direction: column;
        
        /* Aqui a mágica acontece: essas variáveis vêm do 'cssVariables' injetado */
        background: var(--c-bg);
        border: var(--border-style);
        border-radius: var(--border-radius);
        box-shadow: var(--box-shadow);
        color: var(--c-text);
        font-family: var(--font-body);
        backdrop-filter: var(--backdrop);

        position: relative;
    }

    .terminal-header {
        background: var(--c-primary); color: #000;
        display: flex; justify-content: space-between; align-items: center;
        padding: 5px 15px;
        font-family: var(--font-head);
    }
    .close-trigger { background: transparent; border: none; font-weight: bold; cursor: pointer; color: #000; }
    .pulse-dot { width: 8px; height: 8px; background: #000; border-radius: 50%; display: inline-block; margin-right: 8px; animation: pulse 2s infinite; }

    .terminal-content { display: flex; flex: 1; overflow: hidden; }

    /* SIDEBAR */
    .profile-section {
        width: 180px; padding: 20px;
        border-right: 1px solid rgba(255, 255, 255, 0.1);
        display: flex; flex-direction: column; align-items: center; gap: 15px;
        background: rgba(0,0,0,0.2);
    }
    .avatar-uplink {
        width: 100px; height: 100px; position: relative;
        border: 2px solid var(--c-primary); 
        border-radius: 50%; overflow: hidden; cursor: pointer;
        transition: 0.3s;
    }
    .avatar-uplink:hover { box-shadow: 0 0 15px var(--c-primary); }
    .avatar-uplink img { width: 100%; height: 100%; object-fit: cover; }
    .overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.2s; color: var(--c-primary); }
    .avatar-uplink:hover .overlay { opacity: 1; }
    .name { font-weight: bold; font-family: var(--font-head); color: var(--c-primary); font-size: 1.1em; margin-top: 5px; text-align: center; }

    /* SETTINGS GRID */
    .settings-grid { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 25px; }
    .group-title { 
        font-family: var(--font-head); 
        color: var(--c-primary); 
        border-bottom: 1px solid var(--c-primary); 
        padding-bottom: 5px; margin-bottom: 10px; 
        font-size: 0.9em; opacity: 0.9;
    }

    /* THEME CARDS */
    .theme-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; }
    .theme-card {
        background: rgba(0,0,0,0.3);
        border: 1px solid #444;
        border-left: 4px solid var(--preview-primary); /* Preview da cor */
        padding: 8px; border-radius: 4px;
        text-align: left; cursor: pointer;
        display: flex; align-items: center; gap: 10px;
        position: relative; transition: 0.2s;
    }
    .theme-card:hover { background: rgba(255,255,255,0.05); transform: translateY(-2px); }
    .theme-card.active { 
        border-color: var(--c-primary); 
        background: rgba(var(--c-primary), 0.1); /* Fundo sutil com a cor do tema */
        box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
    }
    .theme-preview { width: 12px; height: 12px; border-radius: 50%; background: var(--preview-primary); box-shadow: 0 0 5px var(--preview-primary); }
    .theme-info { display: flex; flex-direction: column; }
    .theme-name { font-weight: bold; font-size: 0.8em; color: #fff; }
    .theme-desc { font-size: 0.65em; color: #aaa; }
    .check-icon { position: absolute; right: 8px; top: 8px; color: var(--c-primary); }

    /* INPUTS GERAIS */
    input[type="text"], input[type="number"] {
        width: 100%; background: rgba(0,0,0,0.5); 
        border: 1px solid #444; color: var(--c-primary);
        padding: 8px; font-family: var(--font-body);
        border-radius: 4px;
    }
    input:focus { border-color: var(--c-primary); outline: none; box-shadow: 0 0 5px var(--c-primary); }

    /* SWITCH */
    .switch { position: relative; display: inline-block; width: 40px; height: 20px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; inset: 0; background-color: #333; transition: .4s; border-radius: 20px; }
    .slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
    input:checked + .slider { background-color: var(--c-primary); }
    input:checked + .slider:before { transform: translateX(20px); background-color: #000; }

    /* CONTROLE DE RESOLUÇÃO */
    .res-control { display: flex; gap: 10px; align-items: center; }
    .reset-btn { background: #333; border: 1px solid #555; color: #fff; padding: 8px; cursor: pointer; border-radius: 4px; }
    .reset-btn:hover { background: var(--c-primary); color: #000; }

    .resize-handle { position: absolute; bottom: 5px; right: 5px; color: var(--c-primary); cursor: nwse-resize; opacity: 0.7; }
    
    @keyframes pulse { 50% { opacity: 0.4; } }

    /* SCROLLBAR */
    :global(::-webkit-scrollbar) { width: 8px; background: rgba(0,0,0,0.5); }
    :global(::-webkit-scrollbar-thumb) { background: var(--c-primary); border-radius: 4px; }

    .input-with-button {
        display: flex;
        gap: 8px;
        margin-top: 5px;
    }

    .url-input {
        flex: 1;
        background: rgba(0, 0, 0, 0.7) !important;
        border: 1px solid #444 !important;
        color: var(--c-primary) !important;
        padding: 10px !important;
        font-size: 0.85em !important;
    }

    .apply-btn {
        background: transparent;
        border: 1px solid var(--c-primary);
        color: var(--c-primary);
        width: 45px;
        cursor: pointer;
        border-radius: 4px;
        transition: 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .apply-btn:hover {
        background: var(--c-primary);
        color: #000;
        box-shadow: 0 0 15px var(--c-primary);
    }

    .helper-text {
        font-size: 0.6em;
        color: #666;
        margin-top: 5px;
        letter-spacing: 1px;
    }

    /* Adições Específicas para o Painel de Segurança */
    .security-panel {
        background: rgba(0,0,0,0.3);
        border: 1px solid rgba(255,255,255,0.1);
        padding: 15px;
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .label-group {
        display: flex;
        flex-direction: column;
    }
    .label-group label {
        font-weight: bold;
        color: var(--c-primary);
        font-family: var(--font-head);
    }
    .label-group small {
        font-size: 0.7em;
        color: #aaa;
    }

    .pass-input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        margin-top: 5px;
    }
    .pass-input {
        width: 100%;
        background: rgba(0,0,0,0.6) !important;
        border: 1px solid var(--c-primary) !important;
        color: var(--c-primary) !important;
        padding: 10px 35px 10px 15px !important; /* Espaço para o ícone */
        font-family: monospace !important;
        letter-spacing: 3px;
        font-size: 1.2em !important;
        text-align: center;
    }
    .lock-icon {
        position: absolute;
        right: 15px;
        color: var(--c-primary);
        opacity: 0.7;
    }

    .gm-note {
        margin-top: 5px;
        font-size: 0.7em;
        color: #ffaa00; /* Laranja para destaque GM */
        display: flex;
        align-items: center;
        gap: 5px;
    }

    .gm-tag {
        font-size: 0.6em;
        background: #ffaa00;
        color: #000;
        padding: 2px 5px;
        border-radius: 2px;
        font-weight: bold;
        margin-top: 5px;
    }

    /* Ajuste de Inputs de Resolução */
    .res-input {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    .res-input span {
        font-size: 0.6em;
        color: #aaa;
    }

    /* ... (RESTANTE DO CSS EXISTENTE) ... */
    
    /* VARIÁVEIS HERDADAS */
    .terminal-wrapper {
        width: 100%; height: 100%; display: flex; flex-direction: column;
        background: var(--c-bg);
        border: var(--border-style);
        border-radius: var(--border-radius);
        box-shadow: var(--box-shadow);
        color: var(--c-text);
        font-family: var(--font-body);
        backdrop-filter: var(--backdrop);
        position: relative;
    }
</style>