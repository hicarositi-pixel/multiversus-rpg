<script>
    import { onMount } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    
    // Tenta importar, se falhar usa fallback interno
    import { CombatThemes } from './CombatThemeDB.js'; 

    export let actor;

    const MODULE_ID = "multiversus-rpg";
    // REMOVIDO: const isGM = game.user.isGM; (Não precisamos mais restringir)

    // =========================================================
    // 1. SETTINGS & TEMA (Auto-Repair)
    // =========================================================
    
    function ensureSetting(key, defaultVal, type = Object) {
        // Settings globais ainda precisam ser registradas, mas leitura é livre
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

    // Fallback de Tema caso o arquivo não exista
    const fallbackTheme = {
        vars: { "--c-primary": "#00ff41", "--c-bg": "#050505", "--c-panel": "#111", "--c-shock": "#eab308", "--c-kill": "#ef4444", "--r-node": "4px", "--r-slot": "0px" },
        css: ""
    };
    $: theme = CombatThemes?.[currentThemeKey] || CombatThemes?.['nexus'] || fallbackTheme;

    // =========================================================
    // 2. DADOS & ESTADO (IMAGENS + LOCAIS)
    // =========================================================
    
    const DEFAULT_LIMBS = [
        { id: 'leg-l', name: 'P.ESQ', loc: '1', hp: 4, lar: 0, har: 0, killing: 0, shock: 0, trauma: [], x: 65, y: 75 },
        { id: 'leg-r', name: 'P.DIR', loc: '2', hp: 4, lar: 0, har: 0, killing: 0, shock: 0, trauma: [], x: 35, y: 75 },
        { id: 'arm-l', name: 'B.ESQ', loc: '3-4', hp: 4, lar: 0, har: 0, killing: 0, shock: 0, trauma: [], x: 80, y: 40 },
        { id: 'arm-r', name: 'B.DIR', loc: '5-6', hp: 4, lar: 0, har: 0, killing: 0, shock: 0, trauma: [], x: 20, y: 40 },
        { id: 'torso', name: 'TORSO', loc: '7-9', hp: 7, lar: 0, har: 0, killing: 0, shock: 0, trauma: [], x: 50, y: 40 },
        { id: 'head', name: 'CABEÇA', loc: '10', hp: 4, lar: 0, har: 0, killing: 0, shock: 0, trauma: [], x: 50, y: 10 }
    ];

    let activeForm = "base"; // 'base' ou 'trans'

    // Carregamento Inicial (Flags)
    let bgBase = actor.getFlag(MODULE_ID, 'bg_base') || ""; 
    let imgBase = actor.getFlag(MODULE_ID, 'img_base') || "icons/svg/mystery-man.svg";
    
    let bgTrans = actor.getFlag(MODULE_ID, 'bg_trans') || "";
    let imgTrans = actor.getFlag(MODULE_ID, 'img_trans') || "icons/svg/mystery-man.svg";

    let limbsBase = actor.getFlag(MODULE_ID, 'limbs_base') || JSON.parse(JSON.stringify(DEFAULT_LIMBS));
    let limbsTrans = actor.getFlag(MODULE_ID, 'limbs_trans') || JSON.parse(JSON.stringify(DEFAULT_LIMBS));

    // Migração de Segurança (Garante array de trauma)
    limbsBase = limbsBase.map(l => ({...l, trauma: l.trauma || []}));
    limbsTrans = limbsTrans.map(l => ({...l, trauma: l.trauma || []}));

    // Reatividade para troca de abas
    $: currentLimbs = activeForm === 'base' ? limbsBase : limbsTrans;
    $: currentImg = activeForm === 'base' ? imgBase : imgTrans;
    $: currentBg = activeForm === 'base' ? bgBase : bgTrans;

    // Estados de UI
    let selectedLimbId = null;
    let editingMode = false;
    let showConfig = false;
    let showTraumaCreator = false;
    
    // Estado do Modal de Imagem Customizado (Substituto do Prompt)
    let showImgModal = false;
    let imgModalType = ''; // 'sil' ou 'bg'
    let imgModalUrl = '';

    let inputShock = null;
    let inputKilling = null;
    let inputHeal = null;
    let newTrauma = { key: "", label: "", color: "#ffffff", desc: "", icon: "Biohazard" };

    $: selectedLimb = currentLimbs.find(l => l.id === selectedLimbId);

    // =========================================================
    // 3. CORE LOGIC & SAVE
    // =========================================================

    async function saveData() {
        const flagKey = activeForm === 'base' ? 'limbs_base' : 'limbs_trans';
        // Atualiza variável local explicitamente para reatividade imediata
        if (activeForm === 'base') limbsBase = currentLimbs; else limbsTrans = currentLimbs;
        
        // Salva no banco
        await actor.update({ [`flags.${MODULE_ID}.${flagKey}`]: currentLimbs }, { render: false });
    }

    // --- CALCULADORA ORE ---
    async function applyDamage() {
        if (!selectedLimb) return ui.notifications.warn("Selecione um membro!");
        let S_in = Number(inputShock || 0);
        let K_in = Number(inputKilling || 0);
        const LAR = Number(selectedLimb.lar || 0);
        const HAR = Number(selectedLimb.har || 0);

        if (HAR > 0) { S_in = Math.max(0, S_in - (HAR * 2)); K_in = Math.max(0, K_in - HAR); }
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
        saveData();
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
        saveData();
        inputHeal = null;
    }

    // --- EDITOR DE LAYOUT ---
    let draggingNode = null;
    function onNodeDragStart(e, limb) { if (editingMode) draggingNode = limb; }
    function onCanvasDrop(e) {
        if (!editingMode || !draggingNode) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        const idx = currentLimbs.findIndex(l => l.id === draggingNode.id);
        currentLimbs[idx].x = x; currentLimbs[idx].y = y;
        draggingNode = null; saveData();
    }

    // --- TRAUMA DRAG & DROP ---
    let draggingTrauma = null;
    function onTraumaDrop(e, limbId, slotIdx) {
        if (!draggingTrauma) return; // Removido check isGM
        const idx = currentLimbs.findIndex(l => l.id === limbId);
        const limb = currentLimbs[idx];
        limb.trauma = limb.trauma.filter(t => t.index !== slotIdx);
        limb.trauma.push({ id: foundry.utils.randomID(), type: draggingTrauma, index: slotIdx });
        if (limb.killing <= slotIdx) limb.killing = slotIdx + 1;
        draggingTrauma = null; saveData();
    }
    function removeTrauma(limbId, traumaId) {
        // Removido check isGM
        const idx = currentLimbs.findIndex(l => l.id === limbId);
        currentLimbs[idx].trauma = currentLimbs[idx].trauma.filter(t => t.id !== traumaId);
        saveData();
    }

    // --- TRAUMA CREATOR ---
    async function createGlobalTrauma() {
        if (!newTrauma.key || !newTrauma.label) return ui.notifications.warn("Preencha ID e Nome.");
        const newDB = { ...traumaDB, [newTrauma.key]: { ...newTrauma } };
        
        // NOTA: Para jogadores, salvamos localmente primeiro para UX, 
        // mas game.settings.set requer permissão de GM normalmente. 
        // Se der erro de permissão, o jogador só vai ver localmente até reiniciar.
        // O ideal seria um socket GM, mas para simplificar:
        try {
            await game.settings.set(MODULE_ID, 'traumaDB', newDB);
        } catch (e) {
            console.warn("Sem permissão para salvar Trauma globalmente. Salvando na sessão.", e);
        }
        
        traumaDB = newDB;
        showTraumaCreator = false;
        newTrauma = { key: "", label: "", color: "#ffffff", desc: "", icon: "Biohazard" };
    }
    
    async function deleteGlobalTrauma(key) {
        const newDB = { ...traumaDB };
        delete newDB[key];
        try {
            await game.settings.set(MODULE_ID, 'traumaDB', newDB);
        } catch (e) { console.warn("Sem permissão para deletar global.", e); }
        traumaDB = newDB;
    }

    // =========================================================
    // 4. IMAGE MANAGER (CUSTOM MODAL)
    // =========================================================
    
    function openImageModal(type) {
        imgModalType = type;
        imgModalUrl = ''; // Limpa input
        showImgModal = true;
    }

    async function applyImageUpdate(path) {
        if (activeForm === 'base') {
            if (imgModalType === 'sil') imgBase = path;
            else bgBase = path;
        } else {
            if (imgModalType === 'sil') imgTrans = path;
            else bgTrans = path;
        }

        const flagType = imgModalType === 'sil' ? 'img' : 'bg';
        const key = `${flagType}_${activeForm}`;
        await actor.update({ [`flags.${MODULE_ID}.${key}`]: path }, { render: false });
        
        showImgModal = false;
    }

    function openFilePicker() {
        new FilePicker({
            type: "image",
            callback: (path) => applyImageUpdate(path)
        }).browse();
    }

    async function addLimb() {
        const newLimb = { id: foundry.utils.randomID(), name: 'NOVO', loc: '0', hp: 3, lar:0, har:0, killing:0, shock:0, trauma:[], x: 50, y: 50 };
        currentLimbs = [...currentLimbs, newLimb]; saveData();
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
        </div>
        <div class="tools">
            <button class="tool-btn {editingMode ? 'on' : ''}" on:click={() => editingMode = !editingMode} title="Modo Edição"><i class="fas fa-edit"></i></button>
            <button class="tool-btn" on:click={() => showConfig = true} title="Temas"><i class="fas fa-palette"></i></button>
        </div>
    </div>

    <div class="dash-content">
        
        <div class="canvas-area" 
             on:dragover|preventDefault 
             on:drop={onCanvasDrop}>
            
            {#if currentBg}
                <img src={currentBg} class="bg-layer" alt="bg">
            {/if}
            
            <img src={currentImg} class="silhouette-layer" alt="silhouette">

            {#if editingMode}
                <div class="edit-overlay-controls">
                    <button on:click={() => openImageModal('sil')}>IMG PERSONAGEM</button>
                    <button on:click={() => openImageModal('bg')}>IMG FUNDO (GIF)</button>
                    <button class="add" on:click={addLimb}>+ MEMBRO</button>
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
                            <input class="mini-edit" bind:value={limb.loc} on:change={saveData} placeholder="Loc">
                            <input class="mini-edit" bind:value={limb.name} on:change={saveData}>
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
                        {#if limb.lar > 0}<span class="a-flag l">{limb.lar}</span>{/if}
                        {#if limb.har > 0}<span class="a-flag h">{limb.har}</span>{/if}
                    </div>
                    
                    {#if editingMode}
                        <button class="node-del" on:click|stopPropagation={() => { currentLimbs = currentLimbs.filter(l => l.id !== limb.id); saveData(); }}>×</button>
                    {/if}
                </div>
            {/each}
        </div>

        <div class="sidebar">
            <div class="calc-box">
                <div class="calc-title">{selectedLimb ? selectedLimb.name : "SELECIONE ALVO"}</div>
                {#if selectedLimb}
                    <div class="armor-edit">
                        <label>L <input type="number" bind:value={selectedLimb.lar} on:change={saveData}></label>
                        <label>H <input type="number" bind:value={selectedLimb.har} on:change={saveData}></label>
                        <label>HP <input type="number" bind:value={selectedLimb.hp} on:change={saveData}></label>
                    </div>
                    <div class="dmg-inputs">
                        <div class="grp"><label style="color:var(--c-shock)">SHOCK</label><input type="number" bind:value={inputShock}></div>
                        <div class="grp"><label style="color:var(--c-kill)">KILL</label><input type="number" bind:value={inputKilling}></div>
                    </div>
                    <button class="btn-hit" on:click={applyDamage}>DANO</button>
                    <div class="heal-row"><input type="number" bind:value={inputHeal} placeholder="Cura"><button on:click={applyHeal}>+</button></div>
                {/if}
            </div>

            <div class="trauma-box">
                <div class="box-title">
                    <span>CONDIÇÕES</span>
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
    </div>

    {#if showImgModal}
        <div class="modal-overlay">
            <div class="modal-win">
                <h3>SELECIONAR {imgModalType === 'sil' ? 'PERSONAGEM' : 'FUNDO'}</h3>
                <p style="font-size:10px; color:#888; margin-bottom:10px;">Cole uma URL da internet (Discord/Imgur) ou abra a pasta.</p>
                
                <input type="text" bind:value={imgModalUrl} placeholder="https://..." autofocus>
                
                <div class="row">
                    <button on:click={() => applyImageUpdate(imgModalUrl)}>USAR URL</button>
                    <button on:click={openFilePicker} style="background:#444">PASTA 📂</button>
                </div>
                <button class="close-btn" on:click={() => showImgModal = false} style="margin-top:5px;">CANCELAR</button>
            </div>
        </div>
    {/if}

    {#if showConfig}
        <div class="modal-overlay">
            <div class="modal-win">
                <h3>TEMAS VISUAIS</h3>
                <div class="theme-list">
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
        <div class="modal-overlay">
            <div class="modal-win trauma-form">
                <h3>NOVA CONDIÇÃO</h3>
                <input type="text" placeholder="ID (ex: acid)" bind:value={newTrauma.key}>
                <input type="text" placeholder="Nome (ex: Ácido)" bind:value={newTrauma.label}>
                <input type="text" placeholder="Desc" bind:value={newTrauma.desc}>
                <div class="row">
                    <input type="color" bind:value={newTrauma.color}>
                    <button on:click={createGlobalTrauma}>SALVAR</button>
                    <button class="close-btn" on:click={() => showTraumaCreator = false}>CANCEL</button>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    /* CSS MANTIDO IDÊNTICO */
    .body-dashboard { display: flex; flex-direction: column; height: 100%; background: var(--c-bg); color: #ccc; font-family: var(--f-main); overflow: hidden; position: relative; }
    
    .dash-header { display: flex; justify-content: space-between; background: #111; padding: 5px; border-bottom: 2px solid var(--c-primary); z-index: 20; }
    .tabs { display: flex; gap: 5px; }
    .tab { background: #222; border: 1px solid #444; color: #888; padding: 5px 15px; cursor: pointer; font-weight: bold; }
    .tab.active { background: var(--c-primary); color: #000; border-color: var(--c-primary); }
    .tab.trans-mode.active { background: #a855f7; border-color: #a855f7; color: #fff; }
    .tool-btn { background: #222; border: 1px solid #444; color: #ccc; width: 30px; cursor: pointer; }
    .tool-btn.on { background: #fff; color: #000; }

    .dash-content { display: flex; flex: 1; overflow: hidden; position: relative; }
    
    /* CANVAS LAYERS */
    .canvas-area { flex: 1; position: relative; overflow: hidden; border-right: 1px solid #333; background: #000; }
    
    .bg-layer { 
        position: absolute; inset: 0; width: 100%; height: 100%; 
        object-fit: cover; opacity: 0.5; z-index: 0; pointer-events: none; 
    }
    .silhouette-layer { 
        position: absolute; inset: 0; width: 100%; height: 100%; 
        object-fit: contain; z-index: 1; pointer-events: none; 
    }
    
    .edit-overlay-controls { position: absolute; top: 10px; left: 10px; z-index: 100; display: flex; flex-direction: column; gap: 5px; }
    .edit-overlay-controls button { background: rgba(0,0,0,0.8); color: #fff; border: 1px solid #fff; cursor: pointer; font-size: 10px; padding: 5px; text-align: left; }
    .edit-overlay-controls button.add { background: var(--c-primary); color: #000; border: none; font-weight: bold; }

    /* NODES */
    .limb-node { position: absolute; transform: translate(-50%, -50%); background: var(--c-panel); padding: 4px; min-width: 80px; display: flex; flex-direction: column; gap: 3px; cursor: pointer; transition: 0.2s; border-radius: var(--r-node); z-index: 10; border: 1px solid #444; }
    .limb-node.selected { border-color: var(--c-primary); box-shadow: 0 0 15px rgba(0,0,0,0.5); z-index: 50; }
    .node-header { display: flex; justify-content: space-between; font-size: 10px; }
    .name { font-weight: bold; color: #fff; }
    .mini-edit { width: 40px; background: #000; border: none; color: #fff; font-size: 9px; }
    
    .hp-grid { display: flex; flex-wrap: wrap; gap: 2px; max-width: 100px; }
    .hp-slot { width: 12px; height: 12px; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; font-size: 8px; border-radius: var(--r-slot); border: 1px solid #333; }
    .hp-slot.shock { background: var(--c-shock); }
    .hp-slot.killing { background: var(--c-kill); }
    .hp-slot.trauma { background: #000; border: 1px dashed #fff; }

    .armor-flags { display: flex; gap: 2px; position: absolute; top: -8px; right: 0; }
    .a-flag { font-size: 8px; padding: 1px 3px; border-radius: 2px; color: #fff; font-weight: bold; }
    .a-flag.l { background: #004488; }
    .a-flag.h { background: #5b21b6; }
    .node-del { position: absolute; top: -8px; left: -8px; background: red; color: white; border: none; border-radius: 50%; width: 16px; height: 16px; cursor: pointer; font-size: 10px; display: flex; align-items: center; justify-content: center; }

    /* SIDEBAR */
    .sidebar { width: 200px; background: #111; display: flex; flex-direction: column; border-left: 2px solid var(--c-primary); z-index: 20; }
    .calc-box { padding: 10px; border-bottom: 1px solid #333; }
    .calc-title { font-size: 14px; color: var(--c-primary); font-weight: bold; text-align: center; margin-bottom: 10px; }
    .armor-edit, .dmg-inputs, .heal-row { display: flex; gap: 5px; margin-bottom: 5px; }
    input { width: 100%; background: #000; border: 1px solid #444; color: #fff; text-align: center; padding: 5px; }
    button { cursor: pointer; border: none; font-weight: bold; }
    .btn-hit { width: 100%; background: #aa0000; color: #fff; padding: 8px; margin-bottom: 5px; }
    .heal-row button { background: #006600; color: #fff; padding: 0 10px; }

    .trauma-box { flex: 1; padding: 10px; background: #0a0a0a; display: flex; flex-direction: column; }
    .box-title { display: flex; justify-content: space-between; border-bottom: 1px solid #333; margin-bottom: 5px; color: #888; font-size: 10px; }
    .add-cond { background: none; color: var(--c-primary); border: 1px solid var(--c-primary); padding: 0 5px; cursor: pointer; }
    .t-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 5px; }
    .t-item { background: #222; padding: 5px; display: flex; align-items: center; gap: 8px; cursor: grab; border: 1px solid #333; }
    .t-item:hover { border-color: #fff; }
    .t-del { background: none; color: #555; margin-left: auto; } .t-del:hover { color: red; }

    /* MODALS */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 200; }
    .modal-win { background: #111; border: 1px solid var(--c-primary); padding: 20px; width: 300px; display: flex; flex-direction: column; gap: 10px; }
    .theme-list { display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px; }
    .theme-btn { padding: 10px; background: #222; color: #ccc; text-align: left; }
    .theme-btn.selected { background: var(--c-primary); color: #000; }
    .close-btn { width: 100%; padding: 10px; background: #333; color: #fff; }
    .row { display: flex; gap: 5px; } .row button { flex: 1; }

    .custom-scroll::-webkit-scrollbar { width: 4px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #333; }
</style>