<script>
    import { onMount, createEventDispatcher } from 'svelte';
    import { slide, fade, scale, fly } from 'svelte/transition';
    
    import { XPDatabase } from '../XPDatabase.js'; 
    import { LevelCalculator } from '../LevelSystem.js';
    import { OriginDatabase } from '../OriginDatabase.js';
    import { SystemBookDB } from '../SystemBookDB.js';
    import { BookAutomation } from '../BookAutomation.js';
    import { SHEET_THEMES } from '../data/SheetThemeDB.js'; 

    export let actor;
    export let flags = {}; 
    export let system = {}; 

    const dispatch = createEventDispatcher();
    const MODULE_ID = "multiversus-rpg";
    const BASE_POINTS_CAP = 150;
    const isGM = game.user.isGM;

    // === 1. HERANÇA DE TEMA ===
    $: activeThemeKey = flags.sheetConfig?.theme || 'terminal';
    $: currentThemeData = SHEET_THEMES[activeThemeKey] || SHEET_THEMES['terminal'];
    $: cssVariables = Object.entries(currentThemeData.vars).map(([key, val]) => `${key}: ${val};`).join(' ');
    // Usamos a cor primária do tema como base para o destaque
    $: themeColor = currentThemeData.vars['--c-primary'];

    // === 2. BYPASS DE SINCRONIA LOCAL (Resolve o Travamento) ===
    let gmMode = flags.gmOverride || false;
    let customPoints = flags.customPoints || 150;
    let boughtBaseWill = flags.boughtBaseWill || 0;
    let currBaseWill = flags.currBaseWill !== undefined ? flags.currBaseWill : 0;
    let currWillpower = flags.currWillpower !== undefined ? flags.currWillpower : 0;

    // Sincroniza apenas se a Database mudar externamente (ex: outro jogador mudou)
    $: { if (flags.gmOverride !== undefined && flags.gmOverride !== gmMode) gmMode = flags.gmOverride; }
    $: { if (flags.customPoints !== undefined && flags.customPoints !== customPoints) customPoints = flags.customPoints; }

    // === 3. DADOS DE BIOGRAFIA ===
    let loreContent = flags.bio_lore || "";
    let localPsyche = flags.bio_psyche || "";
    let localAppearance = flags.bio_appearance || "";
    let motivations = flags.bio_motivations || [{ text: "", stars: 1 }];
    let originUniverses = flags.bio_universes || [{ universe: "", theme: "" }];

    // === IMAGENS CUSTOMIZÁVEIS E URL PROMPT ===
    $: showImages = flags.showImages !== false; // Padrão é mostrar
    $: tokenImg = flags.tokenImg || "https://placehold.co/256x256/111/333?text=TOKEN";
    $: originBanner = flags.originBanner || "https://placehold.co/800x200/111/333?text=BANNER";

    // AGORA TEMOS DUAS FLAGS DIFERENTES
    $: halfBodyImg = flags.halfBodyImg || "https://i.imgur.com/1DyBPgD.png"; // Placeholder de silhueta
    $: fullBodyImg = flags.fullBodyImg || "https://i.imgur.com/1DyBPgD.png"; // Placeholder de silhueta

    $: isFullBody = flags.isFullBody !== false; // true = Full Body, false = Half Body

    let activeImagePrompt = null; // 'token', 'banner', 'body'
    let imageUrlInput = "";

    function openImagePrompt(type, currentUrl) {
        activeImagePrompt = type;
        // Limpa se for o placeholder padrão, senão mantém a URL do jogador
        imageUrlInput = currentUrl.includes('placehold.co') || currentUrl.includes('1DyBPgD.png') ? "" : currentUrl;
    }

    function saveImageUrl() {
        const urlToSave = imageUrlInput.trim();
        if (activeImagePrompt === 'token') {
            actor.update({ [`flags.${MODULE_ID}.tokenImg`]: urlToSave, "prototypeToken.texture.src": urlToSave }, { render: false });
        } else if (activeImagePrompt === 'banner') {
            actor.update({ [`flags.${MODULE_ID}.originBanner`]: urlToSave }, { render: false });
        } else if (activeImagePrompt === 'body') {
            // AQUI ESTÁ A MÁGICA: SALVA NA FLAG CORRETA BASEADO NO MODO ATIVO
            const flagName = isFullBody ? 'fullBodyImg' : 'halfBodyImg';
            actor.update({ [`flags.${MODULE_ID}.${flagName}`]: urlToSave }, { render: false });
        }
        activeImagePrompt = null;
    }

    function toggleImages() {
        showImages = !showImages;
        actor.update({ [`flags.${MODULE_ID}.showImages`]: showImages }, { render: false });
    }
    function toggleBodyType() {
        isFullBody = !isFullBody;
        actor.update({ [`flags.${MODULE_ID}.isFullBody`]: isFullBody }, { render: false });
    }

    // === 5. RENDERIZAÇÃO DO LORE (HTML INJECTION) ===
    let glossary = {};
    $: previewPsyche = BookAutomation.renderMarkdown(localPsyche || "Nenhum dado arquivado. Clique em editar.", glossary);
    $: previewAppearance = BookAutomation.renderMarkdown(localAppearance || "Nenhum dado arquivado. Clique em editar.", glossary);

// === 6. CÁLCULO DE NÍVEL ===
    $: currentXP = flags.xp || 0; 
    $: playerLvlInfo = LevelCalculator.getLevelInfo(currentXP);
    
    // Nível do Mestre: Calcula pelo XP "fictício" baseado nos Pontos Totais digitados
    $: customXP = Math.max(0, customPoints - BASE_POINTS_CAP);
    $: customLvlInfo = LevelCalculator.getLevelInfo(customXP);
    
    // A MÁGICA: Define qual "pacote de nível" a ficha toda vai usar
    $: activeLvlInfo = gmMode ? customLvlInfo : playerLvlInfo;
    
    $: activeLevel = activeLvlInfo.level;
    $: missingXP = playerLvlInfo.nextXP - currentXP; // Sempre baseado no player
    $: totalPointsCap = gmMode ? customPoints : (BASE_POINTS_CAP + currentXP);

    // === 7. SISTEMA DE VONTADE ===
    $: statCharm = Number(system.stats?.charm?.value || system.attributes?.charm?.value || flags.stats?.charm?.normal || 1);
    $: statCommand = Number(system.stats?.command?.value || system.attributes?.command?.value || flags.stats?.command?.normal || 1);
    
    $: maxBaseWill = statCharm + statCommand + activeLevel + boughtBaseWill;
    $: maxWillpower = maxBaseWill;

    // Se estiver zero e max for maior, inicializa o atual
    $: {
        if (currBaseWill === 0 && maxBaseWill > 0 && flags.currBaseWill === undefined) currBaseWill = maxBaseWill;
        if (currWillpower === 0 && maxWillpower > 0 && flags.currWillpower === undefined) currWillpower = maxWillpower;
    }

    $: costBaseWill = boughtBaseWill * 3;
    $: totalWillCost = costBaseWill;

    // === 8. LÓGICA DE PONTOS E SALDO ===
    $: universeCost = Math.max(0, originUniverses.length - 1) * 8;
    $: statsCost = flags.statsCost || 0;
    $: powersCost = flags.powersSpent || 0;
    $: spentPoints = statsCost + powersCost + universeCost + totalWillCost;
    $: availablePoints = totalPointsCap - spentPoints;

    let saveTimeout;
    $: {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            actor.update({ 
                [`flags.${MODULE_ID}.bioSpent`]: universeCost,
                [`flags.${MODULE_ID}.willSpent`]: totalWillCost,
                [`flags.${MODULE_ID}.totalSpent`]: spentPoints
            }, { render: false });
        }, 1000);
    }
$: strokeDashoffset = 283 - (283 * activeLvlInfo.progress / 100);

    // === 9. ESTADOS DE UI E ORIGENS ===
    let isSyncing = false;
    let activePopup = null;
    let allOriginsList = {}; // Para o Dropdown do GM
    let originData = { name: "Desconhecido", icon: "❓", mechanic: {name: "N/A", desc: ""}, traits: [], desc: "", powers: "" };
    
    // === 10. EDITOR FULLSCREEN, VIEWER & GLOSSÁRIO ===
    let activeViewer = null; 
    let activeEditor = null; 
    let editorContent = "";
    let editorTab = 'markdown'; 
    $: livePreviewHtml = BookAutomation.renderMarkdown(editorContent, glossary);
    
    let isHelperOpen = false;
    let activeTerm = null;

    function openViewer(type) { activeViewer = type; }
    function closeViewer() { activeViewer = null; }

    function openEditor(type) {
        activeEditor = type;
        editorContent = type === 'psyche' ? localPsyche : localAppearance;
    }

    function saveAndCloseEditor() {
        if (activeEditor === 'psyche') localPsyche = editorContent;
        else localAppearance = editorContent;
        
        actor.update({
            [`flags.${MODULE_ID}.bio_psyche`]: localPsyche,
            [`flags.${MODULE_ID}.bio_appearance`]: localAppearance
        }, { render: false });
        
        activeEditor = null;
    }

    function injectCode(prefix, suffix = "") { editorContent += `\n${prefix}TextoAqui${suffix}`; }
    
    function handleArticleClick(event) {
        const keyword = event.target.closest('.rule-keyword');
        if (keyword) {
            const key = keyword.getAttribute('data-key');
            if (glossary[key]) {
                activeTerm = glossary[key];
                isHelperOpen = true; 
            }
        }
    }

    // === AÇÕES DO SISTEMA ===
    onMount(async () => {
        allOriginsList = await OriginDatabase.load();
        const originID = flags.origin || "humano";
        loadOriginData(originID);
        glossary = SystemBookDB.getGlossary(); 
    });

    async function loadOriginData(originID) {
        originData = allOriginsList[originID] || allOriginsList["humano"] || originData;
    }

    async function updateFlag(key, value) {
        if (key === 'bio_universes') originUniverses = value;
        if (key === 'bio_motivations') motivations = value;
        await actor.update({ [`flags.${MODULE_ID}.${key}`]: value }, { render: false });
    }

    // --- Controles GM (Sem travamentos) ---
    function toggleGMMode() {
        gmMode = !gmMode;
        actor.update({[`flags.${MODULE_ID}.gmOverride`]: gmMode}, { render: false });
    }
    function saveGMConfig(e) {
        customPoints = Number(e.target.value);
        actor.update({ [`flags.${MODULE_ID}.customPoints`]: customPoints }, { render: false });
    }
    function changeOriginGM(e) {
        const newOrigin = e.target.value;
        actor.update({ [`flags.${MODULE_ID}.origin`]: newOrigin }, { render: false });
        loadOriginData(newOrigin);
        ui.notifications.info(`Origem alterada.`);
    }

    async function importPlayerXP() {
        isSyncing = true;
        try {
            const userId = game.user.id; 
            const xpData = await XPDatabase.getPlayerData(userId);
            const userOrigin = game.users.get(userId)?.getFlag(MODULE_ID, "origin");

            const updates = { [`flags.${MODULE_ID}.xp`]: xpData.earnedXP || 0 };
            if (userOrigin) updates[`flags.${MODULE_ID}.origin`] = userOrigin;

            await actor.update(updates, { render: false });
            currentXP = xpData.earnedXP || 0;
            if (userOrigin) await loadOriginData(userOrigin);
            ui.notifications.info(`Sincronizado: ${currentXP} XP.`);
        } catch (e) { ui.notifications.warn("Falha de Sincronia."); }
        isSyncing = false;
    }

    // --- Vontade ---
    function buyStat(amount) {
        const cost = 3;
        if (availablePoints < cost && amount > 0) return ui.notifications.warn("XP Insuficiente.");
        boughtBaseWill = Math.max(0, boughtBaseWill + amount);
        actor.update({ [`flags.${MODULE_ID}.boughtBaseWill`]: boughtBaseWill }, {render:false});
    }
    function updateCurrentBW(e) {
        currBaseWill = parseInt(e.target.value) || 0;
        actor.update({ [`flags.${MODULE_ID}.currBaseWill`]: currBaseWill }, {render:false});
    }
    function updateCurrentWP(e) {
        currWillpower = parseInt(e.target.value) || 0;
        actor.update({ [`flags.${MODULE_ID}.currWillpower`]: currWillpower }, {render:false});
    }

    // --- Listas Dinâmicas ---
    function addUniverse() { 
        const newList = [...originUniverses, { universe: "", theme: "" }];
        if (newList.length > 1 && availablePoints < 8) ui.notifications.warn("Custo de 8 XP pendente!");
        updateFlag('bio_universes', newList); 
    }
    function removeUniverse(i) { updateFlag('bio_universes', originUniverses.filter((_, idx) => idx !== i)); }
    function commitUniverse(i, field, val) { originUniverses[i][field] = val; updateFlag('bio_universes', originUniverses); }

    function addMotivation() { updateFlag('bio_motivations', [...motivations, { text: "", stars: 1 }]); }
    function removeMotivation(i) { updateFlag('bio_motivations', motivations.filter((_, idx) => idx !== i)); }
    function commitMotivation(i, field, val) { motivations[i][field] = val; updateFlag('bio_motivations', motivations); }

    function saveBioText() {
        actor.update({ [`flags.${MODULE_ID}.bio_lore`]: loreContent }, { render: false });
        ui.notifications.info("Anotações arquivadas.");
    }
    function getStars(c) { return "★".repeat(Math.min(5, Math.max(1, c))) + "☆".repeat(5 - Math.min(5, Math.max(1, c))); }
    async function editImg() { new FilePicker({ type: "image", current: actor.img, callback: path => actor.update({img: path}) }).render(true); }

</script>

<div class="bio-terminal" style="{cssVariables}; --c-primary: {themeColor};">
    {#if activeImagePrompt}
        <div class="modal-backdrop" on:click={() => activeImagePrompt = null} transition:fade style="z-index: 10000;">
            <div class="modal-window" style="width: 450px;" transition:scale on:click|stopPropagation role="dialog">
                <div class="modal-header">
                    <span><i class="fas fa-link"></i> INSERIR LINK DA ARTE</span>
                    <button class="close-btn" type="button" on:click={() => activeImagePrompt = null}><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body" style="display:flex; flex-direction:column; gap:10px;">
                    <p style="font-size: 12px; color: #aaa; margin: 0; line-height: 1.4;">
                        Cole um link direto (URL) da internet. O sistema ajustará a proporção automaticamente.
                    </p>
                    <input type="text" class="hacker-input" style="width: 100%; padding: 10px; background: #000; border: 1px solid var(--c-primary); color: #fff;" bind:value={imageUrlInput} placeholder="https://..." autofocus>
                    <button class="btn-info" style="width:100%; height:auto; padding:10px; font-size: 14px;" on:click={saveImageUrl}>SALVAR E APLICAR</button>
                </div>
            </div>
        </div>
    {/if}

    {#if activePopup}
        <div class="modal-backdrop" on:click={() => activePopup = null} transition:fade>
            <div class="modal-window" transition:scale on:click|stopPropagation role="dialog">
                <div class="modal-header">
                    <span>DADOS_CRIPTOGRAFADOS // {activePopup.title}</span>
                    <button class="close-btn" type="button" on:click|stopPropagation={() => activePopup = null}>
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body custom-scroll html-injection">
                    {@html activePopup.desc}
                </div>
            </div>
        </div>
    {/if}
{#if activeViewer}
        <div class="fullscreen-editor-layer" transition:fade>
            <header class="topbar-editor">
                <div class="brand">
                    <i class="fas fa-book-open" style="color:var(--c-primary)"></i> 
                    <span style="color:var(--c-primary)">LEITURA: {activeViewer === 'psyche' ? 'HISTÓRIA' : 'APARÊNCIA'}</span>
                </div>
                <div class="top-actions">
                    <button class="btn-tool confirm-tool" on:click={closeViewer}><i class="fas fa-times"></i> FECHAR</button>
                </div>
            </header>

            <div class="preview-pane custom-scroll html-injection" style="flex: 1; padding: 60px 20px; max-width: 900px; margin: 0 auto; background: transparent;" on:click={handleArticleClick}>
                <div class="article-container">
                    {@html activeViewer === 'psyche' ? previewPsyche : previewAppearance}
                </div>
            </div>
        </div>
    {/if}
    {#if activeEditor}
        <div class="fullscreen-editor-layer" transition:fade>
            <header class="topbar-editor">
                <div class="brand">
                    <i class="fas fa-pen-nib" style="color:var(--c-primary)"></i> 
                    <span style="color:var(--c-primary)">STUDIO: {activeEditor === 'psyche' ? 'HISTÓRIA' : 'APARÊNCIA'}</span>
                </div>
                <div class="top-actions">
                    <button class="btn-tool confirm-tool" on:click={saveAndCloseEditor}><i class="fas fa-save"></i> SALVAR & VOLTAR</button>
                </div>
            </header>

            <div class="mobile-tabs">
                <button class:active={editorTab==='markdown'} on:click={()=>editorTab='markdown'}>CÓDIGO</button>
                <button class:active={editorTab==='preview'} on:click={()=>editorTab='preview'}>PREVIEW</button>
            </div>

            <div class="split-screen custom-scroll">
                <div class="editor-pane" class:m-hide={editorTab!=='markdown'}>
                    <div class="editor-toolbar">
                        <button on:click={() => injectCode('# ')}>TÍTULO</button>
                        <button on:click={() => injectCode('> ## ')}>DESTAQUE</button>
                        <button style="color:var(--c-primary)" on:click={() => injectCode('[img:URL_DA_IMAGEM:100%]')}>IMG</button>
                    </div>
                    <textarea class="hacker-input area custom-scroll" bind:value={editorContent} placeholder="Cole do Discord aqui..."></textarea>
                </div>
                <div class="preview-pane custom-scroll html-injection" class:m-hide={editorTab!=='preview'} on:click={handleArticleClick}>
                    <div class="preview-tag">LIVE PREVIEW</div>
                    <div class="article-container">{@html livePreviewHtml}</div>
                </div>
            </div>
        </div>
    {/if}

    <aside class="helper-sidebar custom-scroll" class:open={isHelperOpen}>
        <div class="helper-header">
            <span><i class="fas fa-microchip"></i> MATRIZ DE DADOS</span>
            <button class="close-helper-btn" on:click={() => isHelperOpen = false}>✕</button>
        </div>
        <div class="helper-content">
            {#if activeTerm}
                <div class="term-card" in:fly={{x: 50, duration: 300}}>
                    <div class="term-badge">{activeTerm.type}</div>
                    <h3 class="term-title">{activeTerm.title}</h3>
                    <p class="term-desc">{activeTerm.desc}</p>
                    {#if activeTerm.img} <img src="{activeTerm.img}" class="term-img" alt="Ref Visual"> {/if}
                </div>
            {/if}
        </div>
    </aside>

    <div class="content-scroll custom-scroll">
        
<header class="top-hud">
            <div class="id-card">
                
                <div class="portrait" on:click={editImg} title="Avatar do VTT">
                    <img src={actor.img} alt="Avatar" />
                    <div class="scan-line"></div>
                </div>

                {#if showImages}
                    <div class="portrait" style="border-radius: 50%; border-color: #555;" on:click={() => openImagePrompt('token', tokenImg)} title="Token" transition:scale>
                        <img src={tokenImg} alt="Token" />
                        <div class="overlay" style="position: absolute; inset:0; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; opacity:0; transition:0.2s; color:var(--c-primary);"><i class="fas fa-link"></i></div>
                    </div>
                {/if}

                <div class="info-col">
                    <label>CODENAME</label>
                    <input type="text" class="name-input" value={actor.name} on:change={e => actor.update({name: e.target.value}, {render: false})} />
                    
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button class="sync-btn {isSyncing ? 'pulsing' : ''}" on:click={importPlayerXP}>
                            <i class="fas fa-satellite-dish"></i> SYNC XP
                        </button>
                        <button class="sync-btn" style="border-color: var(--c-primary); color: var(--c-primary);" on:click={toggleImages}>
                            <i class="fas fa-image"></i> {showImages ? 'OCULTAR ARTES' : 'GALERIA'}
                        </button>
                        {#if !gmMode && missingXP <= 0}
                            <button class="lvl-up-btn" style="margin-top:0;" on:click={() => dispatch('openLvlUp')} transition:fade>
                                <i class="fas fa-arrow-up"></i> LVL UP!
                            </button>
                        {/if}
                    </div>
                </div>
            </div>

            {#if isGM}
                <div class="gm-panel">
                    <button class="gm-toggle" class:active={gmMode} on:click={toggleGMMode} title="Modo NPC">
                        <i class="fas fa-user-shield"></i> GM Override
                    </button>
                    {#if gmMode}
                        <div class="gm-inputs" transition:slide>
                            <label>PONTOS <input type="number" value={customPoints} on:change={saveGMConfig}></label>
                            
                            <label style="margin-top: 5px;">ORIGEM 
                                <select class="gm-select" value={flags.origin || 'humano'} on:change={changeOriginGM}>
                                    {#each Object.entries(allOriginsList) as [key, data]}
                                        <option value={key}>{data.name}</option>
                                    {/each}
                                </select>
                            </label>
                        </div>
                    {/if}
                </div>
            {/if}

            <div class="resource-display">
                <div class="res-line">
                    <span class="lbl">Pontos de Ficha Totais</span>
                    <span class="val">{totalPointsCap}</span>
                </div>
                <div class="res-line">
                    <span class="lbl">Pontos de Ficha Gastos</span>
                    <span class="val dim">{spentPoints}</span>
                </div>
                <div class="res-line main">
                    <span class="lbl">Pontos Disponíveis</span>
                    <span class="val" style="color: {availablePoints < 0 ? '#ff3333' : 'var(--c-primary)'}">{availablePoints}</span>
                </div>
                {#if !gmMode}
                    <div class="res-line" style="margin-top: 5px; font-size: 9px; justify-content: center; color: #888;">
                        Faltam {missingXP > 0 ? missingXP : 0} XP p/ Nível {activeLevel + 1}
                    </div>
                {/if}
            </div>

            <div class="level-orb">
                <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" class="bg-ring" />
                    <circle cx="50" cy="50" r="45" class="prog-ring" stroke-dashoffset={strokeDashoffset} />
                </svg>
                <div class="level-txt">
                    <small>LVL</small>
                    <strong>{activeLevel}</strong>
                </div>
            </div>
        </header>


<div class="level-info-bar">
            <div class="li-item"><b style="color: var(--c-primary)">Limites Atuais:</b> {activeLvlInfo.limits}</div>
            <div class="li-item"><b style="color: var(--c-primary)">Bônus Ativos:</b> {activeLvlInfo.buffs}</div>
        </div>

        <section class="willpower-module">
            <div class="will-row">
                <div class="will-info">
                    <span class="w-label">Força de Vontade</span>
                    <div class="w-calc" title="Charme + Comando + Nível + Comprados">
                        <span>[{statCharm}]</span> + <span>[{statCommand}]</span> + <span>[{activeLevel}]</span> + 
                        <span class="bought" title="Comprado (Custa 3XP)">[{boughtBaseWill}]</span> = <strong>{maxBaseWill}</strong>
                    </div>
                </div>
                <div class="will-controls">
                    <div class="buyer">
                        <button on:click={() => buyStat(-1)}>-</button>
                        <span>+3 XP</span>
                        <button on:click={() => buyStat(1)}>+</button>
                    </div>
                    <div class="current-input-wrapper">
                        <label>ATUAL</label>
                        <input type="number" value={currBaseWill} on:change={updateCurrentBW}>
                    </div>
                </div>
            </div>

            <div class="will-row" style="border-left: 2px solid #00aaff;">
                <div class="will-info">
                    <span class="w-label" style="color: #00aaff;">Energia Nexus</span>
                    <div class="w-calc">
                        <span style="color: #666; font-style: italic;">O máximo é atrelado a Força de Vontade.</span>
                        = <strong>{maxWillpower}</strong>
                    </div>
                </div>
                <div class="will-controls">
                    <div class="current-input-wrapper">
                        <label style="color: #00aaff;">ATUAL</label>
                        <input type="number" value={currWillpower} on:change={updateCurrentWP} style="border-color: #00aaff;">
                    </div>
                </div>
            </div>
        </section>

{#if showImages}
            <div class="origin-banner" style="background-image: url('{originBanner}');" on:click={() => openImagePrompt('banner', originBanner)} transition:slide>
                <div class="banner-overlay"><i class="fas fa-link"></i> ALTERAR BANNER</div>
            </div>
        {/if}
        <section class="origin-display" style="{showImages ? 'border-top-left-radius: 0; border-top-right-radius: 0; border-top: none;' : ''}">
            <div class="origin-header">
                <div class="origin-icon">{originData.icon}</div>
                <div class="origin-title">
                    <small>ORIGEM:</small>
                    <span>{originData.name.toUpperCase()}</span>
                </div>
                <button class="btn-info" on:click={() => activePopup = {title: originData.name, desc: originData.desc + "<hr>" + originData.powers}}>
                    <i class="fas fa-file-alt"></i> Descrição da Origem
                </button>
            </div>
            
            <div class="origin-details">
                <div class="detail-box mechanic" on:click={() => activePopup = {title: originData.mechanic.name, desc: originData.mechanic.desc}}>
                    <span class="lbl">MECÂNICA ÚNICA</span>
                    <span class="val">{originData.mechanic.name}</span>
                </div>
                <div class="detail-box traits">
                    <span class="lbl">TRAÇOS ESPECIAIS</span>
                    <div class="traits-list">
                        {#each originData.traits as t}
                            <span class="trait-tag" on:click={() => activePopup = {title: t.name, desc: t.effect}}>{t.name}</span>
                        {/each}
                    </div>
                </div>
            </div>
        </section>

        <section class="dual-lists">
            <div class="cyber-list">
                <div class="list-head">
                    <span>ARQUÉTIPOS MULTIVERSAIS</span>
                    <button class="add-btn" on:click={addUniverse} title="Adicionar Universo (Custa 8 Pontos)">+</button>
                </div>
                <div class="list-content">
                    {#each originUniverses as item, i}
                        <div class="list-row" transition:slide|local>
                            <div class="input-group">
                                <input class="univ-input" value={item.universe} placeholder="Universo..." on:change={e => commitUniverse(i, 'universe', e.target.value)} />
                                <span class="divider">::</span>
                                <input class="theme-input" value={item.theme} placeholder="Tema..." on:change={e => commitUniverse(i, 'theme', e.target.value)} />
                            </div>
                            <div class="controls">
                                {#if i > 0}
                                    <span class="cost-badge" title="Custo Adicional">-8 PT</span>
                                {/if}
                                <button class="del-btn" on:click={() => removeUniverse(i)}><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>

            <div class="cyber-list">
                <div class="list-head">
                    <span>LEALDADE & PAIXÔES</span>
                    <button class="add-btn" on:click={addMotivation}>+</button>
                </div>
                <div class="list-content">
                    {#each motivations as mot, i}
                        <div class="list-row column" transition:slide|local>
                            <input class="full-input" value={mot.text} placeholder="Escreva um objetivo..." on:change={e => commitMotivation(i, 'text', e.target.value)} />
                            <div class="stars-ctrl">
                                <input type="number" class="num-input" min="1" max="5" value={mot.stars} on:change={e => commitMotivation(i, 'stars', parseInt(e.target.value))} />
                                <span class="stars-render" style="color: var(--c-primary)">{getStars(mot.stars)}</span>
                                <button class="del-btn" on:click={() => removeMotivation(i)}><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </section>

<section class="text-areas">
            
            <div class="bio-card">
                <div class="card-header">
                    <span>História do Personagem / Arquivos de Lore</span>
                    <div style="display: flex; gap: 8px;">
                        <button class="edit-lore-btn" on:click={() => openViewer('psyche')}><i class="fas fa-expand"></i> LER</button>
                        <button class="edit-lore-btn" on:click={() => openEditor('psyche')}><i class="fas fa-edit"></i> EDITAR</button>
                    </div>
                </div>
                <div class="card-preview custom-scroll html-injection" on:click={handleArticleClick}>
                    {@html previewPsyche}
                </div>
            </div>

            

            </section>
            <div class="appearance-with-art">
                
                <div class="bio-card" style="flex: 1.5; min-width: 300px;">
                    <div class="card-header">
                        <span>Aparência e Perfil Físico</span>
                        <div style="display: flex; gap: 8px;">
                            <button class="edit-lore-btn" on:click={() => openViewer('appearance')}><i class="fas fa-expand"></i> LER</button>
                            <button class="edit-lore-btn" on:click={() => openEditor('appearance')}><i class="fas fa-edit"></i> EDITAR</button>
                        </div>
                    </div>
                    <div class="card-preview custom-scroll html-injection" on:click={handleArticleClick}>
                        {@html previewAppearance}
                    </div>
                </div>

                {#if showImages}
                    <div class="body-art-container" transition:slide={{axis: 'x'}}>
                        <div class="body-art-header">
                            <span>ARTE DE COMBATE</span>
                            <button class="edit-lore-btn" on:click={toggleBodyType} title="Alternar entre Corpo Inteiro e Meio Corpo">
                                <i class="fas {isFullBody ? 'fa-arrows-alt-v' : 'fa-compress-arrows-alt'}"></i> {isFullBody ? 'FULL' : 'HALF'}
                            </button>
                        </div>
                        <div class="body-art-frame {isFullBody ? 'full-body' : 'half-body'}" 
                             on:click={() => openImagePrompt('body', isFullBody ? fullBodyImg : halfBodyImg)}>
                            <img src={isFullBody ? fullBodyImg : halfBodyImg} alt="Character Art" />
                            <div class="banner-overlay"><i class="fas fa-link"></i> COLAR LINK {isFullBody ? '(FULL)' : '(HALF)'}</div>
                        </div>
                    </div>
                {/if}

            </div>

        <div class="footer-save">
            <button on:click={saveBioText}>
                <i class="fas fa-save"></i> SALVAR ALTERAÇÕES
            </button>
        </div>

    </div>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
    
    /* =========================================================================
       HERANÇA DO TEMA DINÂMICO
       ========================================================================= */
    .bio-terminal { 
        position: relative; height: 100%; display: flex; flex-direction: column; 
        background: var(--c-bg); color: var(--c-text); font-family: var(--font-body);
        border: var(--border-style); border-radius: var(--border-radius); box-shadow: inset 0 0 40px rgba(0,0,0,0.5);
        --glass: rgba(0, 0, 0, 0.4); 
        --border: 1px solid rgba(255,255,255,0.1); 
        overflow: hidden;
    }
    
    .custom-scroll::-webkit-scrollbar { width: 6px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: var(--c-primary); border-radius: 4px; }

    .content-scroll { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 20px; }
    
    /* =========================================================================
       CSS ORIGINAL DO USUÁRIO (PERFEITAMENTE RESTAURADO)
       ========================================================================= */
    .top-hud { display: flex; gap: 20px; border-bottom: 2px solid #222; padding-bottom: 20px; align-items: center; }
    .id-card { flex: 2; display: flex; gap: 15px; align-items: center; }
    .portrait { width: 80px; height: 80px; border: 2px solid var(--c-primary); position: relative; overflow: hidden; cursor: pointer; background: #000; box-shadow: 0 0 15px var(--c-primary); border-radius: 4px; }
    .portrait img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(0.5); transition: 0.3s; }
    .portrait:hover img { filter: grayscale(0); transform: scale(1.1); }
    .info-col { flex: 1; display: flex; flex-direction: column; justify-content: center; }
    .info-col label { font-size: 10px; color: var(--c-primary); letter-spacing: 2px; font-family: var(--font-head); font-weight: bold;}
    .name-input { background: transparent; border: none; border-bottom: 1px solid #333; color: #fff; font-size: 24px; font-family: var(--font-head); width: 100%; text-transform: uppercase; font-weight: bold;}
    .name-input:focus { outline: none; border-bottom-color: var(--c-primary); }
    
    .sync-btn { margin-top: 5px; background: transparent; border: 1px solid #444; color: #666; font-size: 10px; padding: 2px 8px; cursor: pointer; width: fit-content; transition: 0.2s; font-family: inherit; }
    .sync-btn:hover { border-color: var(--c-primary); color: var(--c-primary); }
    .pulsing { animation: pulse 1s infinite; color: var(--c-primary); border-color: var(--c-primary); }
    
    .resource-display { flex: 1.5; background: rgba(0,0,0,0.6); border: var(--border); padding: 10px; display: flex; flex-direction: column; justify-content: center; gap: 4px; border-right: 4px solid var(--c-primary); border-radius: 4px; }
    .res-line { display: flex; justify-content: space-between; font-size: 11px; }
    .res-line .val { font-weight: bold; }
    .res-line.main { margin-top: 4px; border-top: 1px dashed #333; padding-top: 4px; color: var(--c-primary); font-size: 14px; }
    .dim { color: #555; }
    
    .level-orb { width: 70px; height: 70px; position: relative; display: flex; align-items: center; justify-content: center; }
    .level-orb svg { width: 100%; height: 100%; transform: rotate(-90deg); }
    .bg-ring { fill: none; stroke: #111; stroke-width: 6; }
    .prog-ring { fill: none; stroke: var(--c-primary); stroke-width: 6; stroke-dasharray: 283; transition: stroke-dashoffset 1s; }
    .level-txt { position: absolute; display: flex; flex-direction: column; align-items: center; line-height: 1; }
    .level-txt small { font-size: 8px; color: #666; font-family: var(--font-head); font-weight: bold;}
    .level-txt strong { font-size: 20px; color: #fff; font-family: var(--font-head);}
    
    .level-info-bar { background: rgba(0,0,0,0.5); border: 1px dashed var(--c-primary); border-radius: 6px; padding: 10px; display: flex; flex-direction: column; gap: 5px; font-size: 11px; }
    .li-item { border-left: 2px solid var(--c-primary); padding-left: 8px; }
    
    .lvl-up-btn { margin-top: 5px; background: #000; border: 1px solid #ffaa00; color: #ffaa00; font-weight: bold; padding: 5px; cursor: pointer; animation: pulse 1.5s infinite; font-family: inherit; border-radius: 4px;}
    .lvl-up-btn:hover { background: #ffaa00; color: #000; }

    .gm-panel { display: flex; flex-direction: column; gap: 5px; background: rgba(255, 170, 0, 0.1); padding: 5px; border-radius: 4px; border: 1px solid #ffaa00; }
    .gm-toggle { background: #111; color: #aaa; border: 1px solid #444; padding: 5px; cursor: pointer; font-size: 10px; font-weight: bold; border-radius: 4px;}
    .gm-toggle.active { background: #ffaa00; color: #000; border-color: #ffaa00; }
    .gm-inputs { display: flex; flex-direction: column; gap: 5px; margin-top: 4px;}
    .gm-inputs label { font-size: 9px; color: #ffaa00; display: flex; justify-content: space-between; align-items: center; font-weight: bold;}
    .gm-inputs input { width: 40px; background: #000; color: #fff; border: 1px solid #ffaa00; text-align: center; border-radius: 4px;}
    .gm-select { background: #000; border: 1px solid #ffaa00; color: #ffaa00; padding: 2px; border-radius: 4px; outline: none; font-family: inherit; width: 100px; font-size: 9px;}

    .willpower-module { background: rgba(0,0,0,0.4); border: var(--border); padding: 10px; display: flex; flex-direction: column; gap: 10px; border-radius: 4px;}
    .will-row { display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.02); padding: 8px; border-radius: 4px; }
    .will-info { flex: 1; display: flex; flex-direction: column; }
    .w-label { font-size: 10px; color: var(--c-primary); font-weight: bold; letter-spacing: 1px; font-family: var(--font-head);}
    .w-calc { font-size: 12px; color: #888; }
    .w-calc strong { color: #fff; font-size: 14px; margin-left: 5px; }
    .w-calc .bought { color: var(--c-primary); font-weight: bold;}
    .will-controls { display: flex; align-items: center; gap: 15px; }
    .buyer { display: flex; align-items: center; gap: 5px; border: 1px solid #333; padding: 2px; border-radius: 4px; }
    .buyer button { width: 20px; background: #222; border: none; color: #fff; cursor: pointer; border-radius: 2px;}
    .buyer button:hover { background: var(--c-primary); color: #000; }
    .buyer span { font-size: 9px; color: #666; width: 40px; text-align: center; }
    .current-input-wrapper { display: flex; flex-direction: column; align-items: center; }
    .current-input-wrapper label { font-size: 8px; color: #555; }
    .current-input-wrapper input { width: 50px; background: #000; border: 1px solid var(--c-primary); color: #fff; text-align: center; padding: 5px; font-weight: bold; font-family: inherit; border-radius: 4px;}

    /* EXATAMENTE O SEU HTML PARA ORIGENS E ARQUÉTIPOS */
    .origin-display { border: var(--border); background: rgba(0,0,0,0.5); display: flex; flex-direction: column; border-radius: 4px;}
    .origin-header { background: rgba(0,0,0,0.4); padding: 8px 15px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #333; }
    .origin-icon { font-size: 20px; }
    .origin-title { flex: 1; display: flex; flex-direction: column; line-height: 1.2; }
    .origin-title span { color: var(--c-primary); font-weight: bold; letter-spacing: 1px; font-family: var(--font-head); font-size: 14px;}
    .origin-title small { font-size: 9px; color: #666; font-weight: bold;}
    .btn-info { background: transparent; border: 1px solid var(--c-primary); color: var(--c-primary); font-family: inherit; font-size: 10px; font-weight: bold; cursor: pointer; padding: 4px 10px; border-radius: 4px;}
    .btn-info:hover { background: var(--c-primary); color: #000; }
    .origin-details { display: flex; padding: 10px; gap: 10px; }
    .detail-box { flex: 1; background: #000; border: 1px solid #222; padding: 8px; cursor: help; transition: 0.2s; border-radius: 4px;}
    .detail-box:hover { border-color: var(--c-primary); }
    .detail-box .lbl { font-size: 9px; color: #555; display: block; margin-bottom: 4px; font-weight: bold;}
    .detail-box .val { font-size: 12px; color: #ddd; font-weight: bold;}
    .traits-list { display: flex; flex-wrap: wrap; gap: 5px; }
    .trait-tag { background: #111; border: 1px solid #333; padding: 2px 6px; font-size: 10px; color: #aaa; cursor: help; border-radius: 4px;}
    .trait-tag:hover { color: var(--c-primary); border-color: var(--c-primary); }

    .dual-lists { display: flex; gap: 20px; }
    .cyber-list { flex: 1; border: var(--border); background: rgba(0,0,0,0.5); display: flex; flex-direction: column; border-radius: 4px;}
    .list-head { background: rgba(255,255,255,0.05); padding: 5px 10px; font-size: 11px; font-weight: bold; color: #888; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333; font-family: var(--font-head);}
    .add-btn { background: #222; color: #fff; border: none; width: 20px; height: 20px; cursor: pointer; font-weight: bold; border-radius: 4px;}
    .add-btn:hover { background: var(--c-primary); color: #000; }
    .list-content { padding: 10px; display: flex; flex-direction: column; gap: 5px; }
    .list-row { display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); padding: 5px; border: 1px solid transparent; transition: 0.2s; border-radius: 4px;}
    .list-row:hover { border-color: #444; background: rgba(255,255,255,0.04); }
    .list-row.column { flex-direction: column; align-items: flex-start; gap: 5px; }
.input-group { display: flex; align-items: center; gap: 10px; flex: 1; }
    .univ-input, .theme-input, .full-input { background: transparent; border: none; border-bottom: 1px solid #333; color: #fff; font-family: inherit; font-size: 12px; width: 100%; padding: 2px;}
    .univ-input:focus, .theme-input:focus, .full-input:focus { border-color: var(--c-primary); outline: none; }
.controls, .stars-ctrl { display: flex; align-items: center; gap: 8px; width: auto; justify-content: flex-end;}
.del-btn { background: transparent; border: none; color: #444; cursor: pointer; transition: 0.2s; font-size: 14px; padding: 5px; }
    .del-btn:hover { color: #f33; }
    .cost-badge { font-size: 9px; color: #ff3333; border: 1px solid #ff3333; padding: 1px 4px; animation: blink 2s infinite; font-weight: bold; border-radius: 2px;}
    .num-input { width: 30px; background: #000; border: 1px solid #333; color: #fff; text-align: center; border-radius: 4px;}

    /* =========================================================================
       NOVA SEÇÃO DE CARDS DE HISTÓRIA E STUDIO
       ========================================================================= */
    .text-areas { display: flex; flex-direction: column; gap: 15px; }
    .text-box { flex: 1; border: var(--border); background: #000; position: relative; border-radius: 4px;}
    .box-label { position: absolute; top: -8px; left: 10px; background: #000; padding: 0 5px; font-size: 10px; color: var(--c-primary); border: 1px solid #333; font-weight: bold; font-family: var(--font-head);}
    textarea { width: 100%; background: transparent; border: none; padding: 15px; color: #ccc; font-family: inherit; resize: none; min-height: 120px; font-size: 13px; line-height: 1.5; outline: none; }
    textarea:focus { background: rgba(255,255,255,0.02); }
    
    .footer-save button { width: 100%; background: #111; border: 1px solid var(--c-primary); color: var(--c-primary); padding: 12px; font-family: inherit; font-weight: bold; font-size: 14px; cursor: pointer; transition: 0.2s; border-radius: 4px;}
    .footer-save button:hover { background: var(--c-primary); color: #000; box-shadow: 0 0 20px var(--c-primary); }
    
    /* CARDS INTERATIVOS DE LORE */
    .bio-card { flex: 1; border: var(--border); background: rgba(0,0,0,0.5); display: flex; flex-direction: column; height: 260px; overflow: hidden; border-radius: 4px; border-top: 2px solid var(--c-primary);}
    .card-header { background: rgba(0,0,0,0.8); padding: 10px 15px; font-size: 12px; font-weight: bold; font-family: var(--font-head); color: #fff; display: flex; justify-content: space-between; border-bottom: 1px solid #333; align-items: center;}
    .edit-lore-btn { background: transparent; border: 1px solid #555; color: #aaa; font-size: 10px; font-weight: bold; font-family: inherit; padding: 4px 10px; border-radius: 4px; cursor: pointer; transition: 0.2s;}
    .edit-lore-btn:hover { background: var(--c-primary); color: #000; border-color: var(--c-primary); }
    .card-preview { padding: 15px; flex: 1; overflow-y: auto; }

    /* FULLSCREEN EDITOR LORE */
    .fullscreen-editor-layer { position: absolute; inset: 0; background: var(--c-bg); z-index: 1000; display: flex; flex-direction: column; font-family: var(--font-body);}
    .topbar-editor { height: 60px; background: rgba(0,0,0,0.9); border-bottom: 2px solid var(--c-primary); display: flex; align-items: center; justify-content: space-between; padding: 0 20px; flex-shrink: 0; }
    .brand { font-size: 1.2rem; font-weight: bold; font-family: var(--font-head); letter-spacing: 1px;}
    .btn-tool { background: transparent; border: 1px solid #555; color: #ccc; padding: 8px 15px; border-radius: 4px; cursor: pointer; transition: 0.2s; font-weight: bold; font-family: inherit;}
    .confirm-tool { background: var(--c-primary); color: #000; border: none; }
    .confirm-tool:hover { background: #fff; box-shadow: 0 0 15px var(--c-primary); }

    .split-screen { display: flex; flex: 1; height: 100%; overflow: hidden; }
    .editor-pane { flex: 1; display: flex; flex-direction: column; border-right: 1px solid #333; background: rgba(0,0,0,0.6); }
    .editor-toolbar { display: flex; background: rgba(0,0,0,0.8); border-bottom: 1px solid #333; }
    .editor-toolbar button { background: transparent; border: none; border-right: 1px solid #333; color: #888; padding: 12px 15px; font-size: 0.85rem; font-weight: bold; cursor: pointer; transition:0.2s; font-family: inherit;}
    .editor-toolbar button:hover { color: var(--c-primary); background: rgba(255,255,255,0.05); }
    .hacker-input.area { flex: 1; resize: none; font-size: 1rem; color: #aaffaa; border: none; padding: 20px; line-height: 1.6; font-family: monospace; outline: none; background: transparent;}
    
    .preview-pane { flex: 1.2; padding: 40px; overflow-y: auto; position: relative; background: var(--c-bg); }
    .preview-tag { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.8); color: var(--c-primary); border: 1px solid var(--c-primary); padding: 4px 10px; font-size: 0.75rem; border-radius: 4px; font-weight: bold; }
    .article-container { max-width: 800px; margin: 0 auto; padding-bottom: 80px; width: 100%; }

    /* GLOSSÁRIO LATERAL NO EDITOR */
    .helper-sidebar { position: absolute; right: 0; top: 0; width: 350px; height: 100%; background: #111; border-left: 2px solid var(--c-primary); padding: 20px; display: flex; flex-direction: column; overflow-y: auto; z-index: 1100; transform: translateX(100%); transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: -10px 0 30px rgba(0,0,0,0.8); }
    .helper-sidebar.open { transform: translateX(0); }
    .helper-header { display: flex; justify-content: space-between; align-items: center; font-family: var(--font-head); font-size: 1rem; color: var(--c-primary); border-bottom: 1px solid #333; padding-bottom: 15px; margin-bottom: 20px; font-weight: bold; }
    .close-helper-btn { background: transparent; border: 1px solid var(--c-primary); color: var(--c-primary); width: 30px; height: 30px; border-radius: 4px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center;}
    .close-helper-btn:hover { background: var(--c-primary); color: #000; }
    .term-badge { display: inline-block; background: #222; border: 1px solid #444; color: #fff; font-size: 0.7rem; padding: 2px 8px; border-radius: 12px; margin-bottom: 10px; font-weight: bold; letter-spacing: 1px;}
    .term-title { color: var(--c-primary); font-size: 1.5rem; margin: 0 0 10px 0; line-height: 1.1; font-family: var(--font-head);}
    .term-desc { font-size: 1rem; line-height: 1.6; color: #ccc; margin: 0;}
    .term-img { width: 100%; border: 1px solid #333; border-radius: 6px; margin-top: 15px; }

    /* ESTÉTICA DO PARSER HTML INJECTION (PADRÃO DATA HELL) */
    :global(.html-injection .chapter-title) { font-size: 2.2rem; color: var(--c-primary); margin-top: 0; border-bottom: 2px solid var(--c-primary); padding-bottom: 10px; text-transform: uppercase; font-family: var(--font-head, 'Share Tech Mono');}
    :global(.html-injection .section-title) { font-size: 1.4rem; color: var(--c-text); margin-top: 30px; border-bottom: 1px dashed #555; padding-bottom: 5px; text-transform: uppercase; font-family: var(--font-head, 'Share Tech Mono');}
    :global(.html-injection p) { line-height: 1.6; font-size: 1rem; margin-bottom: 15px; color: var(--c-text);}
    :global(.html-injection .dh-callout) { display: flex; flex-direction: column; padding: 20px; margin: 25px 0; border-left: 4px solid var(--c-primary); background: rgba(0,0,0,0.3); border-top: 1px solid #222; border-right: 1px solid #222; border-bottom: 1px solid #222; box-shadow: 4px 4px 0 rgba(0,0,0,0.3);}
    :global(.html-injection .dh-callout .callout-title) { font-weight: bold; font-family: var(--font-head, 'Share Tech Mono'); font-size: 1.2rem; margin-bottom: 10px; color: var(--c-primary); text-transform: uppercase; }
    :global(.html-injection blockquote) { border-left: 3px solid #555; padding-left: 15px; margin: 15px 0; color: #888; font-style: italic; background: rgba(0,0,0,0.2); padding: 12px; }
    :global(.html-injection .rule-keyword) { color: var(--c-primary); font-weight: bold; border-bottom: 1px dashed var(--c-primary); background: rgba(255,255,255,0.05); padding: 2px 4px; border-radius: 4px; cursor: pointer; transition: 0.2s;}
    :global(.html-injection .rule-keyword:hover) { background: var(--c-primary); color: #000; }
    :global(.html-injection .live-img) { display: block; margin: 20px 0; border: 1px solid #333; max-width: 100%; border-radius: 4px;}
    :global(.html-injection .md-list) { margin-bottom: 15px; padding-left: 20px; }
    :global(.html-injection .md-list-item) { margin-bottom: 8px; line-height: 1.5; color: var(--c-text); }

    /* MODAL POPUP NATIVO ORIGENS */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 9999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(3px);}
    .modal-window { width: 550px; max-height: 85vh; background: #0a0a0c; border: 1px solid var(--c-primary); display: flex; flex-direction: column; border-radius: 6px; box-shadow: 0 10px 40px rgba(0,0,0,0.8);}
    .modal-header { background: var(--c-primary); color: #000; padding: 12px 20px; font-weight: bold; font-family: var(--font-head); display: flex; justify-content: space-between; font-size: 1.1rem;}
    .modal-body { padding: 25px; overflow-y: auto; color: #ccc; line-height: 1.6; }
    .close-btn { background: transparent; border: 1px solid rgba(0,0,0,0.3); border-radius: 4px; cursor: pointer; color: #000; display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; transition: 0.2s; }
    .close-btn:hover { color: #fff; background: #ff0000; border-color: #ff0000; transform: scale(1.1); box-shadow: 0 0 10px rgba(255,0,0,0.5); }

    /* MOBILE CONTROLS */
    .mobile-tabs { display: none; background: #111; border-bottom: 1px solid var(--c-primary); flex-shrink: 0; }
    .mobile-tabs button { flex: 1; background: transparent; border: none; color: #888; padding: 12px; font-weight: bold; font-family: inherit;}
    .mobile-tabs button.active { color: var(--c-primary); background: rgba(255,255,255,0.05); border-bottom: 2px solid var(--c-primary); }

    @media (max-width: 800px) {
        .split-screen { flex-direction: column; }
        .mobile-tabs { display: flex; }
        .m-hide { display: none !important; }
        .preview-pane { padding: 20px; }
        .helper-sidebar { width: 100%; top: auto; bottom: 0; height: 70vh; border-left: none; border-top: 2px solid var(--c-primary); transform: translateY(100%); }
        .helper-sidebar.open { transform: translateY(0); }
    }

    /* =========================================
       GALERIA DE IMAGENS CUSTOMIZÁVEIS
       ========================================= */
    .portrait:hover .overlay { opacity: 1; } /* Ativa o hover no token */

   .origin-banner { 
    min-height: 150px; /* Garante que nunca colapse para uma linha */
    height: clamp(150px, 15vw, 220px); 
    width: 100%; 
    display: block;
    background-size: cover; 
    background-position: center; 
    background-color: #050505; /* Dá um fundo bonito caso não tenha imagem */
    position: relative; 
    cursor: pointer; 
    border: var(--border); 
    border-bottom: none; 
    border-radius: 4px 4px 0 0; 
    overflow: hidden; 
    flex-shrink: 0; /* Impede o Flexbox de esmagar o banner */
    margin-bottom: -1px;
}
    .banner-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; color: var(--c-primary); font-family: var(--font-head); font-weight: bold; opacity: 0; transition: 0.3s; font-size: 1rem; letter-spacing: 2px; }


    .body-art-container { flex: 1; display: flex; flex-direction: column; background: rgba(0,0,0,0.5); border: var(--border); border-top: 2px solid var(--c-primary); border-radius: 4px; overflow: hidden; min-width: 250px; height: auto;}
    .body-art-header { background: rgba(0,0,0,0.8); padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: bold; font-family: var(--font-head); color: #fff; border-bottom: 1px solid #333;}
    .body-art-frame { position: relative; cursor: pointer; background: #050505; width: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; flex: 1;}
    
    /* Mágica do ajustamento: "contain" força a imagem a caber sem quebrar proporção */
    .body-art-frame img { max-width: 100%; object-fit: contain; transition: 0.3s; }
    .body-art-frame.full-body img { height: 100%; max-height: 550px; } /* Estica bem pra ficar vertical */
    .body-art-frame.half-body img { height: auto; max-height: 350px; object-position: top; } /* Foca na parte de cima se for larga */
    

    /* =========================================
       NOVO LAYOUT DE APARÊNCIA E ARTE
       ========================================= */
    .appearance-with-art { display: flex; gap: 20px; margin-top: 20px;}
    
    .body-art-container { flex: 1; display: flex; flex-direction: column; background: rgba(0,0,0,0.5); border: var(--border); border-top: 2px solid var(--c-primary); border-radius: 4px; overflow: hidden; min-width: 250px; }
    .body-art-header { background: rgba(0,0,0,0.8); padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: bold; font-family: var(--font-head); color: #fff; border-bottom: 1px solid #333;}
    .body-art-frame { position: relative; cursor: pointer; background: #050505; width: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; flex: 1; min-height: 250px; } /* Min-height pra garantir que nao fique esmagado */
    
    .body-art-frame img { max-width: 100%; object-fit: contain; transition: 0.3s; }
    
    /* Full body pode ser mais alto */
    .body-art-frame.full-body img { height: 100%; max-height: 450px; } 
    /* Half body fica limitado pra nao esticar o card de aparência */
    .body-art-frame.half-body img { height: auto; max-height: 280px; object-position: top; } 

    .body-art-frame:hover .banner-overlay { opacity: 1; }

    /* RESPONSIVIDADE MOBILE */
    @media (max-width: 800px) {
        .appearance-with-art { flex-direction: column; }
        .body-art-container { width: 100%; min-height: 350px; }
    }

    @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>