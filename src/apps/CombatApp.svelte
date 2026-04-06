<script>
    import { onMount } from 'svelte';
    import { fade, slide, scale } from 'svelte/transition';
    import { CombatThemes } from './CombatThemeDB.js'; 
    import { LevelCalculator } from '../LevelSystem.js';

    export let actor;

    const MODULE_ID = "multiversus-rpg";

    // =========================================================
    // 1. SETTINGS E TEMA GLOBAL
    // =========================================================
    
    function ensureSetting(key, defaultVal, type = Object) {
        if (!game.settings.settings.has(`${MODULE_ID}.${key}`)) {
            game.settings.register(MODULE_ID, key, {
                name: key, scope: "world", config: false, type: type, default: defaultVal, onChange: () => {}
            });
        }
        return game.settings.get(MODULE_ID, key);
    }

    let currentThemeKey = ensureSetting('combatThemeKey', 'nexus', String);
    
    const defaultTraumas = {
      "bullet": { icon: "Running Round", color: "#fbbf24", label: "Bala", desc: "Cirurgia." },
      "cut": { icon: "Bleeding Eye", color: "#ef4444", label: "Corte", desc: "Sutura." },
      "break": { icon: "Broken Bone", color: "#fff", label: "Fratura", desc: "Tala." }
    };
    let traumaDB = ensureSetting('traumaDB', defaultTraumas, Object);

    const fallbackTheme = {
        vars: { "--c-primary": "#00ff41", "--c-bg": "#050505", "--c-panel": "#111", "--c-shock": "#eab308", "--c-kill": "#ef4444", "--r-node": "4px", "--r-slot": "2px" },
        css: ""
    };
    $: theme = CombatThemes?.[currentThemeKey] || CombatThemes?.['nexus'] || fallbackTheme;

    // =========================================================
    // 2. ENERGIA NEXUS (MANA) COM REATIVIDADE INSTANTÂNEA
    // =========================================================
    
    // Leitura segura e reativa das flags
    $: flags = actor?.flags?.[MODULE_ID] || {};
    $: system = actor?.system || {};

    $: currentXP = flags.xp || 0; 
    $: gmMode = flags.gmOverride || false;
    $: customPoints = flags.customPoints || 150;
    $: customXP = Math.max(0, customPoints - 150);
    $: activeLevel = gmMode ? LevelCalculator.getLevelInfo(customXP).level : LevelCalculator.getLevelInfo(currentXP).level;

    $: statCharm = Number(system.stats?.charm?.value || system.attributes?.charm?.value || flags.stats?.charm?.normal || 1);
    $: statCommand = Number(system.stats?.command?.value || system.attributes?.command?.value || flags.stats?.command?.normal || 1);
    $: boughtBaseWill = flags.boughtBaseWill || 0;
    
    $: maxWillpower = statCharm + statCommand + activeLevel + boughtBaseWill;
    
    // BYPASS LOCAL COM GETFLAG: Garante que a UI inicie sem erros de undefined
    let localMana = actor.getFlag(MODULE_ID, 'currWillpower') ?? 0;
    
    // Se for a primeira vez abrindo e a mana estiver 0, preenche com o máximo
    $: { if (localMana === 0 && maxWillpower > 0 && flags.currWillpower === undefined) localMana = maxWillpower; }

    function updateMana(amount) {
        localMana = Math.min(maxWillpower, Math.max(0, localMana + amount));
        actor.update({ [`flags.${MODULE_ID}.currWillpower`]: localMana }, {render: false});
    }

    function setMana(e) {
        localMana = Math.min(maxWillpower, Math.max(0, parseInt(e.target.value) || 0));
        actor.update({ [`flags.${MODULE_ID}.currWillpower`]: localMana }, {render: false});
    }

    // =========================================================
    // 3. DADOS DE CORPO E GALERIA
    // =========================================================
    
    const DEFAULT_LIMBS = [
        { id: 'leg-l', name: 'P.ESQ', loc: '1', hp: 4, lar: 0, har: 0, killing: 0, shock: 0, trauma: [], x: 65, y: 75 },
        { id: 'leg-r', name: 'P.DIR', loc: '2', hp: 4, lar: 0, har: 0, killing: 0, shock: 0, trauma: [], x: 35, y: 75 },
        { id: 'arm-l', name: 'B.ESQ', loc: '3-4', hp: 4, lar: 0, har: 0, killing: 0, shock: 0, trauma: [], x: 80, y: 40 },
        { id: 'arm-r', name: 'B.DIR', loc: '5-6', hp: 4, lar: 0, har: 0, killing: 0, shock: 0, trauma: [], x: 20, y: 40 },
        { id: 'torso', name: 'TORSO', loc: '7-9', hp: 7, lar: 0, har: 0, killing: 0, shock: 0, trauma: [], x: 50, y: 40 },
        { id: 'head', name: 'CABEÇA', loc: '10', hp: 4, lar: 0, har: 0, killing: 0, shock: 0, trauma: [], x: 50, y: 10 }
    ];

    let activeForm = "base"; // 'base', 'trans', 'gallery'

    // Carregamento inicial via getFlag (Seguro contra travamentos)
    let bgBase = actor.getFlag(MODULE_ID, 'bg_base') || ""; 
    let imgBase = actor.getFlag(MODULE_ID, 'img_base') || "https://i.imgur.com/1DyBPgD.png";
    let bgTrans = actor.getFlag(MODULE_ID, 'bg_trans') || "";
    let imgTrans = actor.getFlag(MODULE_ID, 'img_trans') || "https://i.imgur.com/1DyBPgD.png";

    let limbsBase = actor.getFlag(MODULE_ID, 'limbs_base') || JSON.parse(JSON.stringify(DEFAULT_LIMBS));
    let limbsTrans = actor.getFlag(MODULE_ID, 'limbs_trans') || JSON.parse(JSON.stringify(DEFAULT_LIMBS));
    let galleryItems = actor.getFlag(MODULE_ID, 'combat_gallery') || [];

    // Garante array de trauma em caso de dados antigos
    limbsBase = limbsBase.map(l => ({...l, trauma: l.trauma || []}));
    limbsTrans = limbsTrans.map(l => ({...l, trauma: l.trauma || []}));

    $: currentLimbs = activeForm === 'base' ? limbsBase : limbsTrans;
    $: currentImg = activeForm === 'base' ? imgBase : imgTrans;
    $: currentBg = activeForm === 'base' ? bgBase : bgTrans;

    let selectedLimbId = null;
    let editingMode = false;
    let showConfig = false;
    let showTraumaCreator = false;
    
    let showImgModal = false;
    let imgModalType = ''; 
    let imgModalUrl = '';

    let inputShock = null;
    let inputKilling = null;
    let inputHeal = null;
    let newTrauma = { key: "", label: "", color: "#ffffff", desc: "", icon: "Biohazard" };

    $: selectedLimb = currentLimbs.find(l => l.id === selectedLimbId);

    // =========================================================
    // 4. CORE LOGIC (CÁLCULO E FORÇA REATIVIDADE)
    // =========================================================

    // O Segredo: Reatribuir a array local forçando o Svelte a renderizar INSTANTANEAMENTE
    function triggerReactivity() {
        if (activeForm === 'base') limbsBase = [...limbsBase];
        else limbsTrans = [...limbsTrans];
        saveData();
    }

    async function saveData() {
        const flagKey = activeForm === 'base' ? 'limbs_base' : 'limbs_trans';
        await actor.update({ [`flags.${MODULE_ID}.${flagKey}`]: activeForm === 'base' ? limbsBase : limbsTrans }, { render: false });
    }

    async function applyDamage() {
        if (!selectedLimb) return ui.notifications.warn("Selecione um membro!");
        let S_in = Number(inputShock || 0);
        let K_in = Number(inputKilling || 0);
        const LAR = Number(selectedLimb.lar || 0);

        // HAR APENAS VISUAL: Apenas a LAR reduz o dano mecanicamente.
        let S_final = Math.max(0, S_in - LAR);
        let converted_K = Math.min(K_in, LAR);
        let K_final = K_in - converted_K;
        S_final += converted_K;

        let curK = selectedLimb.killing;
        let curS = selectedLimb.shock;
        const hp = selectedLimb.hp;
        const occupied = selectedLimb.trauma.length; 

        let tempK = curK + K_final;
        
        if (tempK >= hp) {
            selectedLimb.killing = hp; selectedLimb.shock = 0;
        } else {
            let tempS = curS + S_final;
            let totalSpace = hp - occupied;
            let totalDamage = tempK + tempS;

            if (totalDamage > totalSpace) {
                let overflow = totalDamage - totalSpace;
                tempK += overflow;
                selectedLimb.killing = Math.min(totalSpace, tempK);
                selectedLimb.shock = Math.max(0, totalSpace - selectedLimb.killing);
            } else {
                selectedLimb.killing = tempK; selectedLimb.shock = tempS;
            }
        }
        
        triggerReactivity(); // Renderiza instantâneo na UI
        
        inputShock = null; inputKilling = null;
        if (selectedLimb.killing >= selectedLimb.hp) ui.notifications.error(`${selectedLimb.name} DESTRUÍDO!`);
    }

    async function applyHeal() {
        if (!selectedLimb) return;
        let amount = Number(inputHeal || 0);
        while (amount > 0) {
            if (selectedLimb.killing > 0) { selectedLimb.killing--; amount--; }
            else if (selectedLimb.shock > 0) { selectedLimb.shock--; amount--; }
            else break;
        }
        triggerReactivity();
        inputHeal = null;
    }

    // --- ARRASTAR E SOLTAR ---
    let draggingNode = null;
    function onNodeDragStart(e, limb) { if (editingMode) draggingNode = limb; }
    function onCanvasDrop(e) {
        if (!editingMode || !draggingNode) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const idx = currentLimbs.findIndex(l => l.id === draggingNode.id);
        currentLimbs[idx].x = ((e.clientX - rect.left) / rect.width) * 100; 
        currentLimbs[idx].y = ((e.clientY - rect.top) / rect.height) * 100;
        draggingNode = null; 
        triggerReactivity();
    }

    let draggingTrauma = null;
    function onTraumaDrop(e, limbId, slotIdx) {
        if (!draggingTrauma) return; 
        const idx = currentLimbs.findIndex(l => l.id === limbId);
        const limb = currentLimbs[idx];
        limb.trauma = limb.trauma.filter(t => t.index !== slotIdx);
        limb.trauma.push({ id: foundry.utils.randomID(), type: draggingTrauma, index: slotIdx });
        if (limb.killing <= slotIdx) limb.killing = slotIdx + 1;
        draggingTrauma = null; 
        triggerReactivity();
    }
    
    function removeTrauma(limbId, traumaId) {
        const idx = currentLimbs.findIndex(l => l.id === limbId);
        currentLimbs[idx].trauma = currentLimbs[idx].trauma.filter(t => t.id !== traumaId);
        triggerReactivity();
    }

    // --- TRAUMA CREATOR ---
    async function createGlobalTrauma() {
        if (!newTrauma.key || !newTrauma.label) return ui.notifications.warn("Preencha ID e Nome.");
        const newDB = { ...traumaDB, [newTrauma.key]: { ...newTrauma } };
        try { await game.settings.set(MODULE_ID, 'traumaDB', newDB); } catch (e) { }
        traumaDB = newDB; showTraumaCreator = false;
        newTrauma = { key: "", label: "", color: "#ffffff", desc: "", icon: "Biohazard" };
    }
    async function deleteGlobalTrauma(key) {
        const newDB = { ...traumaDB }; delete newDB[key];
        try { await game.settings.set(MODULE_ID, 'traumaDB', newDB); } catch (e) { }
        traumaDB = newDB;
    }

    // =========================================================
    // 5. MANAGER DE IMAGENS E GALERIA
    // =========================================================
    
    function openImageModal(type, currentUrl = '') {
        imgModalType = type;
        imgModalUrl = currentUrl.includes('1DyBPgD.png') ? '' : currentUrl;
        showImgModal = true;
    }

    async function applyImageUpdate() {
        const urlToSave = imgModalUrl.trim();
        
        if (imgModalType === 'gallery_new') {
            const newItem = { id: foundry.utils.randomID(), title: "Nova Arte", url: urlToSave, desc: "" };
            galleryItems = [...galleryItems, newItem];
            await actor.update({ [`flags.${MODULE_ID}.combat_gallery`]: galleryItems }, { render: false });
        } 
        else if (imgModalType.startsWith('gallery_edit_')) {
            const idx = parseInt(imgModalType.split('_')[2]);
            galleryItems[idx].url = urlToSave;
            galleryItems = [...galleryItems];
            await actor.update({ [`flags.${MODULE_ID}.combat_gallery`]: galleryItems }, { render: false });
        }
        else {
            if (activeForm === 'base') {
                if (imgModalType === 'sil') imgBase = urlToSave; else bgBase = urlToSave;
            } else {
                if (imgModalType === 'sil') imgTrans = urlToSave; else bgTrans = urlToSave;
            }
            const flagType = imgModalType === 'sil' ? 'img' : 'bg';
            await actor.update({ [`flags.${MODULE_ID}.${flagType}_${activeForm}`]: urlToSave }, { render: false });
        }
        showImgModal = false;
    }

    async function updateGalleryItem(idx, field, value) {
        galleryItems[idx][field] = value;
        await actor.update({ [`flags.${MODULE_ID}.combat_gallery`]: galleryItems }, { render: false });
    }
    async function removeGalleryItem(id) {
        galleryItems = galleryItems.filter(i => i.id !== id);
        await actor.update({ [`flags.${MODULE_ID}.combat_gallery`]: galleryItems }, { render: false });
    }

    async function addLimb() {
        const newLimb = { id: foundry.utils.randomID(), name: 'NOVO', loc: '0', hp: 3, lar:0, har:0, killing:0, shock:0, trauma:[], x: 50, y: 50 };
        currentLimbs = [...currentLimbs, newLimb]; triggerReactivity();
    }

    function getSlotState(limb, i) {
        const t = limb.trauma.find(x => x.index === i);
        if (t) return { status: 'trauma', data: traumaDB[t.type] || traumaDB['bullet'], id: t.id };
        if (i < limb.killing) return { status: 'killing' };
        if (i < (limb.killing + limb.shock)) return { status: 'shock' };
        return { status: 'empty' };
    }
</script>

<div class="body-dashboard" style="
    --c-primary: {theme.vars['--c-primary']};
    --c-bg: {theme.vars['--c-bg']};
    --c-panel: {theme.vars['--c-panel']};
    --c-shock: {theme.vars['--c-shock']};
    --c-kill: {theme.vars['--c-kill']};
    --f-main: {theme.vars['--f-main']};
    --r-node: {theme.vars['--r-node']};
    --r-slot: {theme.vars['--r-slot']};
">
    {@html `<style>${theme.css || ''}</style>`}

    <div class="dash-header">
        <div class="tabs">
            <button class="tab {activeForm === 'base' ? 'active' : ''}" on:click={() => activeForm = 'base'}>BASE</button>
            <button class="tab {activeForm === 'trans' ? 'active trans-mode' : ''}" on:click={() => activeForm = 'trans'}>TRANSFORMAÇÃO</button>
            <button class="tab {activeForm === 'gallery' ? 'active gallery-mode' : ''}" on:click={() => activeForm = 'gallery'}>GALERIA</button>
        </div>
        <div class="tools">
            {#if activeForm !== 'gallery'}
                <button class="tool-btn {editingMode ? 'on' : ''}" on:click={() => editingMode = !editingMode} title="Modo Edição"><i class="fas fa-edit"></i> EDITAR</button>
            {/if}
            <button class="tool-btn" on:click={() => showConfig = true} title="Temas"><i class="fas fa-palette"></i></button>
        </div>
    </div>

    <div class="dash-content">
        
        {#if activeForm === 'gallery'}
            <div class="gallery-area custom-scroll">
                <button class="add-gallery-btn" on:click={() => openImageModal('gallery_new')}>
                    <i class="fas fa-plus"></i> INSERIR NOVA ARTE À GALERIA (LINK WEB)
                </button>
                
                <div class="gallery-grid">
                    {#each galleryItems as item, idx}
                        <div class="gallery-card" transition:scale>
                            <div class="art-frame" on:click={() => openImageModal('gallery_edit_' + idx, item.url)}>
                                <img src={item.url} alt="Arte" />
                                <div class="overlay-hint"><i class="fas fa-link"></i> TROCAR IMAGEM</div>
                            </div>
                            <div class="art-info">
                                <input type="text" class="art-title" bind:value={item.title} on:change={() => updateGalleryItem(idx, 'title', item.title)} placeholder="Título/Tema">
                                <textarea class="art-desc custom-scroll" bind:value={item.desc} on:change={() => updateGalleryItem(idx, 'desc', item.desc)} placeholder="Anotações sobre este visual..."></textarea>
                                <button class="art-del" on:click={() => removeGalleryItem(item.id)}><i class="fas fa-trash"></i> EXCLUIR</button>
                            </div>
                        </div>
                    {/each}
                    {#if galleryItems.length === 0}
                        <div class="empty-gallery">
                            <i class="fas fa-images"></i>
                            <p>Sua galeria está vazia.</p>
                        </div>
                    {/if}
                </div>
            </div>

        {:else}
            <div class="canvas-area" on:dragover|preventDefault on:drop={onCanvasDrop}>
                
                {#if currentBg}
                    <img src={currentBg} class="bg-layer" alt="bg">
                {/if}
                
                <img src={currentImg} class="silhouette-layer" alt="silhouette">

                {#if editingMode}
                    <div class="edit-overlay-controls">
                        <button on:click={() => openImageModal('sil', currentImg)}><i class="fas fa-user"></i> IMG CORPO</button>
                        <button on:click={() => openImageModal('bg', currentBg)}><i class="fas fa-image"></i> IMG FUNDO</button>
                        <button class="add" on:click={addLimb}><i class="fas fa-plus"></i> NOVO MEMBRO</button>
                    </div>
                {/if}

                {#each currentLimbs as limb (limb.id)}
                    <div class="limb-node {selectedLimbId === limb.id ? 'selected' : ''}"
                         style="left: {limb.x}%; top: {limb.y}%;"
                         draggable={editingMode}
                         on:dragstart={(e) => onNodeDragStart(e, limb)}
                         on:click={() => selectedLimbId = limb.id}
                         in:fade>
                        
                        <div class="node-header">
                            {#if editingMode}
                                <input class="mini-edit" bind:value={limb.loc} on:change={triggerReactivity} placeholder="Loc">
                                <input class="mini-edit" bind:value={limb.name} on:change={triggerReactivity}>
                            {:else}
                                <span class="loc">{limb.loc}</span>
                                <span class="name">{limb.name}</span>
                            {/if}
                        </div>

                        <div class="hp-grid">
                            {#each Array(limb.hp) as _, i}
                                {@const slot = getSlotState(limb, i)}
                                <div class="hp-slot {slot.status}"
                                     on:dragover|preventDefault
                                     on:drop|stopPropagation={(e) => onTraumaDrop(e, limb.id, i)}
                                     on:contextmenu|preventDefault|stopPropagation={() => removeTrauma(limb.id, slot.id)}
                                     title={slot.status === 'trauma' ? slot.data.label : ''}>
                                    {#if slot.status === 'trauma'}
                                        <i class="fas fa-biohazard" style="color: {slot.data.color}"></i>
                                    {/if}
                                </div>
                            {/each}
                        </div>

                        <div class="armor-flags">
                            {#if limb.lar > 0}<span class="a-flag l" title="Leve">{limb.lar}</span>{/if}
                            {#if limb.har > 0}<span class="a-flag h" title="Pesada (Visual)">{limb.har}</span>{/if}
                        </div>
                        
                        {#if editingMode}
                            <button class="node-del" on:click|stopPropagation={() => { currentLimbs = currentLimbs.filter(l => l.id !== limb.id); triggerReactivity(); }}>×</button>
                        {/if}
                    </div>
                {/each}
            </div>

            <div class="sidebar custom-scroll">
                
                <div class="mana-module">
                    <div class="mana-head">
                        <span style="color: var(--c-shock); font-weight: bold;">ENERGIA NEXUS</span>
                        <span style="color: #fff;">{localMana} / {maxWillpower}</span>
                    </div>
                    <div class="mana-bar-bg">
                        <div class="mana-bar-fill" style="width: {(localMana / maxWillpower) * 100}%; background: var(--c-shock);"></div>
                    </div>
                    <div class="mana-controls">
                        <button class="m-btn" on:click={() => updateMana(-1)}>-</button>
                        <input type="number" class="m-input" bind:value={localMana} on:change={setMana}>
                        <button class="m-btn" on:click={() => updateMana(1)}>+</button>
                    </div>
                </div>

                <div class="calc-box">
                    <div class="calc-title">{selectedLimb ? selectedLimb.name : "SELECIONE ALVO"}</div>
                    {#if selectedLimb}
                        <div class="armor-edit">
                            <label>Arm. Leve<input type="number" bind:value={selectedLimb.lar} on:change={triggerReactivity}></label>
                            <label>Arm. Pesada<input type="number" bind:value={selectedLimb.har} on:change={triggerReactivity}></label>
                            <label>HP Total<input type="number" bind:value={selectedLimb.hp} on:change={triggerReactivity}></label>
                        </div>
                        <div class="dmg-inputs">
                            <div class="grp"><label style="color:var(--c-shock)">Não Letal</label><input type="number" bind:value={inputShock}></div>
                            <div class="grp"><label style="color:var(--c-kill)">Letal</label><input type="number" bind:value={inputKilling}></div>
                        </div>
                        <button class="btn-hit" on:click={applyDamage}>DANO</button>
                        <div class="heal-row">
                            <input type="number" bind:value={inputHeal} placeholder="Cura">
                            <button on:click={applyHeal}>+</button>
                        </div>
                    {/if}
                </div>

                <div class="trauma-box">
                    <div class="box-title">
                        <span>CONDIÇÕES & TRAUMAS</span>
                        <button class="add-cond" on:click={() => showTraumaCreator = true}>+</button>
                    </div>
                    <div class="t-list custom-scroll">
                        {#each Object.entries(traumaDB) as [key, data]}
                            <div class="t-item" draggable="true" on:dragstart={(e) => { draggingTrauma = key; }}>
                                <i class="fas fa-virus" style="color: {data.color}"></i>
                                <span class="t-name">{data.label}</span>
                                <button class="t-del" on:click={() => deleteGlobalTrauma(key)}>×</button>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        {/if}
    </div>

    {#if showImgModal}
        <div class="modal-overlay" on:click={() => showImgModal = false} transition:fade>
            <div class="modal-win" style="width: 450px;" transition:scale on:click|stopPropagation role="dialog">
                <div class="modal-header" style="background: var(--c-primary); color: #000; padding: 10px; font-weight: bold; display: flex; justify-content: space-between;">
                    <span><i class="fas fa-link"></i> INSERIR LINK DA ARTE</span>
                    <button class="close-btn-clean" on:click={() => showImgModal = false} style="background:none; border:none; cursor:pointer;"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body" style="padding: 20px; display:flex; flex-direction:column; gap:10px;">
                    <p style="font-size: 12px; color: #aaa; margin: 0; line-height: 1.4;">Cole um link direto (URL) da internet.</p>
                    <input type="text" bind:value={imgModalUrl} placeholder="https://..." autofocus style="width: 100%; background: #000; border: 1px solid var(--c-primary); color: #fff; padding: 10px;">
                    <button on:click={applyImageUpdate} style="width: 100%; background: var(--c-primary); color: #000; padding: 10px; border: none; font-weight: bold; cursor: pointer;">SALVAR E APLICAR</button>
                </div>
            </div>
        </div>
    {/if}

    {#if showConfig}
        <div class="modal-overlay" on:click={() => showConfig = false}>
            <div class="modal-win" on:click|stopPropagation>
                <h3 style="color: var(--c-primary); margin-top:0;">TEMAS DE COMBATE</h3>
                <div class="theme-list custom-scroll" style="max-height: 300px;">
                    {#each Object.entries(CombatThemes || {}) as [key, val]}
                        <button class="theme-btn {key === currentThemeKey ? 'selected' : ''}" 
                                on:click={async () => {
                                    await game.settings.set(MODULE_ID, 'combatThemeKey', key);
                                    currentThemeKey = key;
                                }}>{val.name}</button>
                    {/each}
                </div>
                <button class="close-btn" on:click={() => showConfig = false}>FECHAR</button>
            </div>
        </div>
    {/if}

    {#if showTraumaCreator}
        <div class="modal-overlay" on:click={() => showTraumaCreator = false}>
            <div class="modal-win trauma-form" on:click|stopPropagation>
                <h3 style="color: var(--c-primary); margin-top:0;">NOVA CONDIÇÃO</h3>
                <input type="text" placeholder="ID (ex: acid)" bind:value={newTrauma.key} style="width:100%; padding:8px; margin-bottom:5px; background:#000; color:#fff; border:1px solid #444;">
                <input type="text" placeholder="Nome (ex: Ácido)" bind:value={newTrauma.label} style="width:100%; padding:8px; margin-bottom:5px; background:#000; color:#fff; border:1px solid #444;">
                <input type="text" placeholder="Desc" bind:value={newTrauma.desc} style="width:100%; padding:8px; margin-bottom:10px; background:#000; color:#fff; border:1px solid #444;">
                <div class="row">
                    <input type="color" bind:value={newTrauma.color} style="height:35px; width:40px; padding:0; cursor:pointer; border:none;">
                    <button on:click={createGlobalTrauma} style="background:var(--c-primary); color:#000; flex:1; border:none; font-weight:bold; cursor:pointer;">SALVAR</button>
                    <button class="close-btn" on:click={() => showTraumaCreator = false} style="flex:1; border:none; cursor:pointer;">CANCEL</button>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    /* =========================================
       HERANÇA DE TEMA (O CSS Injection age aqui)
       ========================================= */
    .body-dashboard { display: flex; flex-direction: column; height: 100%; background: var(--c-bg); color: #ccc; font-family: var(--f-main); overflow: hidden; position: relative; }
    .custom-scroll::-webkit-scrollbar { width: 4px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #333; }

    /* HEADER E ABAS */
    .dash-header { display: flex; justify-content: space-between; background: rgba(0,0,0,0.8); padding: 5px 10px; border-bottom: 2px solid var(--c-primary); z-index: 20; align-items: center; }
    .tabs { display: flex; gap: 5px; }
    .tab { background: transparent; border: none; border-bottom: 3px solid transparent; color: #888; padding: 10px 15px; cursor: pointer; font-weight: bold; transition: 0.2s;}
    .tab:hover { color: #fff; }
    .tab.active { color: var(--c-primary); border-bottom-color: var(--c-primary); }
    .tab.trans-mode.active { border-color: #a855f7; color: #a855f7; }
    .tab.gallery-mode.active { border-color: #3b82f6; color: #3b82f6; }
    
    .tools { display: flex; gap: 5px;}
    .tool-btn { background: #222; border: 1px solid #444; color: #ccc; padding: 6px 12px; cursor: pointer; font-weight: bold; border-radius: 4px; transition: 0.2s;}
    .tool-btn:hover { background: #333; }
    .tool-btn.on { background: var(--c-primary); color: #000; border-color: var(--c-primary); }

    .dash-content { display: flex; flex: 1; overflow: hidden; position: relative; }
    
    /* =========================================
       CANVAS E NODES DA FICHA (COM --r-node E --r-slot)
       ========================================= */
    .canvas-area { flex: 1; position: relative; overflow: hidden; border-right: 1px solid #333; background: #000; }
    .bg-layer { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.5; z-index: 0; pointer-events: none; }
    .silhouette-layer { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; z-index: 1; pointer-events: none; }
    
    .edit-overlay-controls { position: absolute; top: 10px; left: 10px; z-index: 100; display: flex; flex-direction: column; gap: 5px; }
    .edit-overlay-controls button { background: rgba(0,0,0,0.8); color: #fff; border: 1px solid #fff; cursor: pointer; font-size: 10px; padding: 6px 10px; text-align: left; font-weight: bold; border-radius: 4px;}
    .edit-overlay-controls button.add { background: var(--c-primary); color: #000; border: none; }

    /* Aqui a borda dos Membros usa --r-node */
    .limb-node { position: absolute; transform: translate(-50%, -50%); background: var(--c-panel); padding: 5px; min-width: 80px; display: flex; flex-direction: column; gap: 4px; cursor: pointer; transition: 0.2s; border-radius: var(--r-node); z-index: 10; border: 1px solid #444; }
    .limb-node.selected { border-color: var(--c-primary); box-shadow: 0 0 15px rgba(0,0,0,0.5); z-index: 50; }
    .node-header { display: flex; justify-content: space-between; font-size: 10px; }
    .name { font-weight: bold; color: #fff; }
    .loc { color: var(--c-primary); font-weight: bold;}
    .mini-edit { width: 40px; background: #000; border: 1px solid var(--c-primary); color: #fff; font-size: 9px; text-align: center;}
    
    .hp-grid { display: flex; flex-wrap: wrap; gap: 2px; max-width: 100px; }
    /* Aqui as caixas de vida usam --r-slot */
    .hp-slot { width: 14px; height: 14px; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; font-size: 8px; border-radius: var(--r-slot); border: 1px solid #333; }
    .hp-slot.shock { background: var(--c-shock); }
    .hp-slot.killing { background: var(--c-kill); }
    .hp-slot.trauma { background: #000; border: 1px dashed #fff; }

    .armor-flags { display: flex; gap: 2px; position: absolute; top: -10px; right: 0; }
    .a-flag { font-size: 9px; padding: 2px 4px; border-radius: 2px; color: #fff; font-weight: bold; }
    .a-flag.l { background: #004488; }
    .a-flag.h { background: #5b21b6; }
    .node-del { position: absolute; top: -10px; left: -10px; background: red; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 12px; font-weight: bold; display: flex; align-items: center; justify-content: center; }

    /* =========================================
       SIDEBAR & MANA
       ========================================= */
    .sidebar { width: 240px; background: #08080a; display: flex; flex-direction: column; z-index: 20; }
    
    .mana-module { padding: 15px; border-bottom: 2px solid #222; background: rgba(0, 170, 255, 0.05); }
    .mana-head { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 10px; letter-spacing: 1px; }
    .mana-bar-bg { width: 100%; height: 12px; background: #111; border-radius: 6px; overflow: hidden; border: 1px solid #333; margin-bottom: 10px;}
    .mana-bar-fill { height: 100%; transition: width 0.2s ease-out; box-shadow: 0 0 10px var(--c-shock);}
    .mana-controls { display: flex; align-items: center; justify-content: center; gap: 8px; }
    .m-btn { background: #222; border: 1px solid #444; color: #fff; width: 30px; height: 30px; cursor: pointer; border-radius: 4px; font-weight: bold;}
    .m-btn:hover { background: var(--c-shock); color: #000; border-color: var(--c-shock); }
    .m-input { width: 50px; height: 30px; background: #000; border: 1px solid var(--c-shock); color: #fff; text-align: center; border-radius: 4px; font-weight: bold;}

    .calc-box { padding: 15px; border-bottom: 1px solid #333; }
    .calc-title { font-size: 13px; color: var(--c-primary); font-weight: bold; text-align: center; margin-bottom: 15px; letter-spacing: 1px;}
    .armor-edit, .dmg-inputs, .heal-row { display: flex; gap: 5px; margin-bottom: 10px; }
    .armor-edit label { flex: 1; font-size: 9px; color: #aaa; text-align: center; display: flex; flex-direction: column; gap: 3px; font-weight: bold;}
    .grp { flex: 1; display: flex; flex-direction: column; gap: 3px; }
    .grp label { font-size: 10px; font-weight: bold; text-align: center;}
    input[type="number"] { width: 100%; background: #000; border: 1px solid #444; color: #fff; text-align: center; padding: 6px; outline: none; border-radius: 4px;}
    input[type="number"]:focus { border-color: var(--c-primary); }
    
    .btn-hit { width: 100%; background: var(--c-kill); color: #fff; padding: 10px; margin-bottom: 10px; border: none; font-weight: bold; border-radius: 4px; cursor: pointer; transition: 0.2s;}
    .btn-hit:hover { background: #fff; color: #000; box-shadow: 0 0 15px var(--c-kill);}
    .heal-row button { flex: 1; background: #22c55e; color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; transition: 0.2s;}
    .heal-row button:hover { background: #16a34a; }

    .trauma-box { flex: 1; padding: 15px; background: rgba(0,0,0,0.3); display: flex; flex-direction: column; }
    .box-title { display: flex; justify-content: space-between; border-bottom: 1px solid #333; margin-bottom: 10px; color: #ccc; font-size: 10px; font-weight: bold; padding-bottom: 5px;}
    .add-cond { background: transparent; color: var(--c-primary); border: 1px solid var(--c-primary); padding: 2px 6px; cursor: pointer; border-radius: 4px;}
    .add-cond:hover { background: var(--c-primary); color: #000; }
    .t-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
    .t-item { background: #111; padding: 10px; display: flex; align-items: center; gap: 10px; cursor: grab; border: 1px solid #333; border-radius: 4px;}
    .t-item:hover { border-color: #fff; }
    .t-name { font-weight: bold; font-size: 11px; }
    .t-del { background: none; color: #555; margin-left: auto; border: none; cursor: pointer;} 
    .t-del:hover { color: red; }

    /* =========================================
       GALERIA DE ARTES
       ========================================= */
    .gallery-area { flex: 1; padding: 20px; overflow-y: auto; background: rgba(0,0,0,0.5); display: flex; flex-direction: column; gap: 20px;}
    .add-gallery-btn { padding: 15px; background: rgba(255,255,255,0.05); border: 1px dashed var(--c-primary); color: var(--c-primary); font-size: 13px; font-weight: bold; cursor: pointer; border-radius: 4px; transition: 0.2s;}
    .add-gallery-btn:hover { background: var(--c-primary); color: #000; }
    
    .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
    .gallery-card { background: #08080a; border: 1px solid #333; border-radius: 6px; display: flex; flex-direction: column; overflow: hidden;}
    .art-frame { height: 220px; background: #000; position: relative; cursor: pointer; display: flex; align-items: center; justify-content: center; overflow: hidden; border-bottom: 2px solid var(--c-primary);}
    .art-frame img { max-width: 100%; max-height: 100%; object-fit: contain; transition: 0.3s; }
    .overlay-hint { position: absolute; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; opacity: 0; transition: 0.3s; letter-spacing: 1px;}
    .art-frame:hover .overlay-hint { opacity: 1; }
    .art-frame:hover img { transform: scale(1.05); }
    
    .art-info { padding: 15px; display: flex; flex-direction: column; gap: 10px; flex: 1;}
    .art-title { background: transparent; border: none; border-bottom: 1px solid #444; color: #fff; font-size: 16px; font-weight: bold; padding: 5px; outline: none; width: 100%;}
    .art-title:focus { border-color: var(--c-primary); }
    .art-desc { background: rgba(0,0,0,0.5); border: 1px solid #333; color: #ccc; font-size: 12px; padding: 10px; border-radius: 4px; resize: none; min-height: 80px; outline: none; width: 100%;}
    .art-del { background: transparent; border: 1px solid #555; color: #888; padding: 8px; cursor: pointer; border-radius: 4px; font-weight: bold; transition: 0.2s;}
    .art-del:hover { background: #ff3333; color: #fff; border-color: #ff3333;}
    
    .empty-gallery { grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 50px; color: #555; text-align: center; gap: 15px;}

    /* MODALS & OVERLAYS */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 200; backdrop-filter: blur(2px);}
    .modal-win { background: #0a0a0c; border: 1px solid var(--c-primary); width: 350px; max-width: 90vw; display: flex; flex-direction: column; border-radius: 6px; box-shadow: 0 10px 40px rgba(0,0,0,0.8); overflow: hidden;}
    .theme-list { display: flex; flex-direction: column; gap: 5px; padding: 20px;}
    .theme-btn { padding: 12px; background: #111; border: 1px solid #333; color: #ccc; text-align: left; cursor: pointer; border-radius: 4px; transition: 0.2s; font-weight: bold;}
    .theme-btn:hover { border-color: var(--c-primary); }
    .theme-btn.selected { background: var(--c-primary); color: #000; border-color: var(--c-primary); }
    .close-btn { width: 100%; padding: 12px; background: #222; border: none; border-top: 1px solid #333; color: #fff; cursor: pointer; font-weight: bold;}
    .close-btn:hover { background: #ff3333; }

    /* =========================================
       RESPONSIVIDADE (MOBILE)
       ========================================= */
    @media (max-width: 800px) {
        .dash-content { flex-direction: column; overflow-y: auto;}
        .canvas-area { min-height: 60vh; border-right: none; border-bottom: 2px solid var(--c-primary); flex: none;}
        .sidebar { width: 100%; height: auto; flex: none;}
        .gallery-grid { grid-template-columns: 1fr; }
        .edit-overlay-controls { flex-direction: row; flex-wrap: wrap; }
    }
</style>