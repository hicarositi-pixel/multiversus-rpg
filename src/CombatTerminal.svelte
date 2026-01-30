<script>
    import { fade, slide } from 'svelte/transition';
    import { createEventDispatcher } from 'svelte';
    
    // IMPORTAÇÃO DA TELA DE RESOLUÇÃO
    import CombatResolution from './CombatResolution.svelte'; 
    
    // --- CONFIGURAÇÃO INICIAL ---
    const dispatch = createEventDispatcher();
    const isGM = game.user.isGM;
    const MODULE_ID = "multiversus-rpg";
    
    export let actor = null; 
    export let themeColor = "#00ff41";

    // --- ESTADOS DE JANELA (POSIÇÃO E DRAG) ---
    let winPos = { x: 100, y: 60 }; // Posição inicial
    let isDragging = false;

    // --- ESTADOS DE NAVEGAÇÃO ---
    let resolutionMode = false;
    let resolutionData = null;

    // --- FACTORY (DADOS) ---
    const createManeuver = () => ({
        id: foundry.utils.randomID(),
        type: 'utilidade', 
        description: "",
        isCollapsed: false,
        params: { damage: 0, penetration: 0, isGhost: false, isSpray: false, sprayDice: 0, defType: 'normal', isReaction: false, reactionBonus: 0 }
    });

    const createNPC = () => ({
        id: foundry.utils.randomID(),
        name: "HOSTIL_01",
        img: "icons/svg/mystery-man.svg",
        dice: { d: 4, hd: 0, wd: 0 },
        mods: { buffers: 0, debuffs: 0 },
        actions: [createManeuver()],
        submitted: false
    });

    // --- ESTADOS REATIVOS ---
    let playerActions = [createManeuver()];
    let playerDice = { d: 4, hd: 0, wd: 0 };
    let playerMods = { buffers: 0, debuffs: 0 };
    let npcs = [createNPC()];
    let selectedNpcId = npcs[0].id;
    let playersStatus = []; 

    // --- LÓGICA REATIVA ---
    $: activeEntity = isGM 
        ? npcs.find(n => n.id === selectedNpcId) 
        : { name: actor?.name, img: actor?.img, dice: playerDice, mods: playerMods, actions: playerActions };

    $: totalPool = calculateTotalPool(activeEntity);

    function calculateTotalPool(entity) {
        if (!entity) return { d:0, hd:0, wd:0 };
        const reactionSum = entity.actions.reduce((acc, act) => acc + (act.params.isReaction ? (act.params.reactionBonus || 0) : 0), 0);
        let baseD = (entity.dice.d || 0) + (entity.mods.buffers || 0) - (entity.mods.debuffs || 0) + reactionSum;
        return { d: Math.max(0, baseD), hd: entity.dice.hd || 0, wd: entity.dice.wd || 0 };
    }

    // Monitoramento (GM)
    $: if (isGM) {
        playersStatus = game.users.filter(u => !u.isGM).map(u => {
            const flag = u.getFlag(MODULE_ID, "combatDeclaration");
            return { name: u.name, id: u.id, ready: !!flag };
        });
    }

    // --- FUNÇÕES DE ARRASTAR JANELA ---
    function handleMouseDown() { isDragging = true; }
    function handleMouseUp() { isDragging = false; }
    function handleMouseMove(e) {
        if (isDragging) {
            winPos.x += e.movementX;
            winPos.y += e.movementY;
        }
    }

    // --- FUNÇÕES DE COMBATE ---
    function addManeuver() {
        if (isGM) {
            const npc = npcs.find(n => n.id === selectedNpcId);
            npc.actions = [...npc.actions, createManeuver()];
            npcs = [...npcs];
        } else {
            playerActions = [...playerActions, createManeuver()];
        }
    }

    function removeManeuver(index) {
        if (isGM) {
            const npc = npcs.find(n => n.id === selectedNpcId);
            npc.actions = npc.actions.filter((_, i) => i !== index);
            npcs = [...npcs];
        } else {
            playerActions = playerActions.filter((_, i) => i !== index);
        }
    }

    function toggleCollapse(index) {
        if (isGM) {
            const npc = npcs.find(n => n.id === selectedNpcId);
            npc.actions[index].isCollapsed = !npc.actions[index].isCollapsed;
            npcs = [...npcs];
        } else {
            playerActions[index].isCollapsed = !playerActions[index].isCollapsed;
            playerActions = [...playerActions]; 
        }
    }

    function addNewNPC() {
        const newUnit = createNPC();
        npcs = [...npcs, newUnit];
        selectedNpcId = newUnit.id;
    }

    function deleteNPC(id) {
        if (npcs.length <= 1) return; 
        npcs = npcs.filter(n => n.id !== id);
        selectedNpcId = npcs[0].id;
    }

    function saveNPCsToFlag() {
        game.user.setFlag(MODULE_ID, "gm_npc_declarations", npcs);
        ui.notifications.info(`KERNEL: ${npcs.length} Vetores Hostis Registrados.`);
    }

    async function startConfrontation() {
        const activePlayers = game.users.filter(u => !u.isGM).map(u => {
            const flag = u.getFlag(MODULE_ID, "combatDeclaration");
            if (!flag) return null;
            return { ...flag, name: u.name, actorId: flag.actorId || u.id, img: u.character?.img || "icons/svg/mystery-man.svg", isPlayer: true };
        }).filter(p => p);

        const activeNpcs = npcs.map(n => ({ ...n, actorId: n.id, isPlayer: false }));

        resolutionData = { players: activePlayers, npcs: activeNpcs };
        resolutionMode = true;
    }

    async function transmitDeclaration() {
        const payload = { actorId: actor.id, dice: playerDice, mods: playerMods, actions: playerActions, timestamp: Date.now() };
        await game.user.setFlag(MODULE_ID, "combatDeclaration", payload);
        ui.notifications.info("UPLINK: Vetores Transmitidos.");
        dispatch('close');
    }
</script>

<svelte:window on:mouseup={handleMouseUp} on:mousemove={handleMouseMove} />

<div class="combat-terminal-root" style="--c-primary: {themeColor}">
    
    {#if resolutionMode}
        <CombatResolution 
            data={resolutionData} 
            themeColor={themeColor} 
            on:close={() => dispatch('close')} 
        />

    {:else}
        <div class="terminal-window" style="left: {winPos.x}px; top: {winPos.y}px;" transition:fade>
            
            <div class="window-grip" on:mousedown={handleMouseDown}>
                <div class="grip-title">
                    <i class="fas fa-terminal"></i> VETOR_STRATEGY // {isGM ? "GM_CORE" : "UNIT_LINK"}
                </div>
                <button class="win-close" on:click={() => dispatch('close')}>×</button>
            </div>

            <div class="hacker-layout">
                <aside class="sidebar">
                    {#if isGM}
                        <div class="npc-list-container">
                            <label>>> HOSTILES</label>
                            <div class="scroll-list">
                                {#each npcs as npc}
                                    <div class="npc-card" class:selected={selectedNpcId === npc.id} on:click={() => selectedNpcId = npc.id}>
                                        <img src={npc.img} class="npc-thumb" alt="npc"/>
                                        <div class="npc-info">
                                            <span class="npc-name">{npc.name}</span>
                                        </div>
                                        <button class="btn-trash" on:click|stopPropagation={() => deleteNPC(npc.id)}>×</button>
                                    </div>
                                {/each}
                            </div>
                            <button class="btn-add-unit" on:click={addNewNPC}>+ UNIT</button>
                        </div>

                        <div class="player-monitor">
                            <label>>> SQUAD SIGNAL</label>
                            <div class="monitor-grid">
                                {#each playersStatus as p}
                                    <div class="monitor-dot" class:ready={p.ready} title="{p.name}">
                                        {p.name.substring(0, 2).toUpperCase()}
                                    </div>
                                {/each}
                            </div>
                        </div>

                        <div class="gm-footer-actions">
                            <button class="btn-save-all" on:click={saveNPCsToFlag}>SAVE STATE</button>
                            <button class="btn-init-confrontation" on:click={startConfrontation}>
                                <i class="fas fa-biohazard"></i> INICIAR
                            </button>
                        </div>

                    {:else}
                        <div class="player-profile">
                            <img src={actor?.img} class="p-img" alt="Actor"/>
                            <span class="p-name">{actor?.name}</span>
                            <span class="p-status">ONLINE</span>
                        </div>
                    {/if}
                </aside>

                <main class="main-panel">
                    <header class="entity-header">
                        {#if isGM}
                            <div class="gm-edit-row">
                                <input type="text" class="hacker-input name" bind:value={activeEntity.name} placeholder="NOME"/>
                                <input type="text" class="hacker-input img" bind:value={activeEntity.img} placeholder="IMG URL"/>
                            </div>
                        {:else}
                            <h2 class="hacker-title">DECLARAÇÃO DE VETORES</h2>
                        {/if}
                    </header>

                    <div class="actions-scroll-area">
                        {#each activeEntity.actions as action, i}
                            <div class="maneuver-card" transition:slide>
                                <div class="card-header">
                                    <span class="idx">0{i+1}</span>
                                    <select class="type-select {action.type}" bind:value={action.type}>
                                        <option value="ataque">ATK</option>
                                        <option value="defesa">DEF</option>
                                        <option value="utilidade">UTIL</option>
                                    </select>
                                    
                                    {#if action.isCollapsed}
                                        <span class="collapsed-preview">{action.description || "..."}</span>
                                    {/if}

                                    <div class="card-controls">
                                        <button class="btn-mini" on:click={() => toggleCollapse(i)}>{action.isCollapsed ? '▼' : '▲'}</button>
                                        <button class="btn-mini danger" on:click={() => removeManeuver(i)}>×</button>
                                    </div>
                                </div>

                                {#if !action.isCollapsed}
                                    <div class="card-body" transition:slide>
                                        <textarea class="desc-area" placeholder="Intenção..." bind:value={action.description}></textarea>
                                        <div class="params-grid">
                                            {#if action.type === 'ataque'}
                                                <div class="param-box"><label>DMG</label><input type="number" bind:value={action.params.damage}/></div>
                                                <div class="param-box"><label>PEN</label><input type="number" bind:value={action.params.penetration}/></div>
                                                <div class="toggle-box">
                                                    <label><input type="checkbox" bind:checked={action.params.isGhost}/> GHOST</label>
                                                    <label><input type="checkbox" bind:checked={action.params.isSpray}/> SPRAY</label>
                                                </div>
                                                {#if action.params.isSpray}
                                                    <div class="param-box"><label>D.SPRAY</label><input type="number" bind:value={action.params.sprayDice}/></div>
                                                {/if}
                                            {:else if action.type === 'defesa'}
                                                <div class="radio-group">
                                                    <label><input type="radio" bind:group={action.params.defType} value="normal"> GOBBLE</label>
                                                    <label><input type="radio" bind:group={action.params.defType} value="interferencia"> INTERF.</label>
                                                </div>
                                            {/if}
                                            <div class="reaction-section">
                                                <label class="reaction-check"><input type="checkbox" bind:checked={action.params.isReaction}/> REAÇÃO?</label>
                                                {#if action.params.isReaction}
                                                    <div class="param-box small"><label>+D</label><input type="number" bind:value={action.params.reactionBonus} max="10"/></div>
                                                {/if}
                                            </div>
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        {/each}
                        <button class="btn-add-action" on:click={addManeuver}>+ VETOR</button>
                    </div>

                    <footer class="pool-footer">
                        <div class="pool-setup">
                            <div class="input-col"><label>D</label><input type="number" bind:value={activeEntity.dice.d}/></div>
                            <div class="input-col"><label class="hd">HD</label><input type="number" class="hd-input" bind:value={activeEntity.dice.hd}/></div>
                            <div class="input-col"><label class="wd">WD</label><input type="number" class="wd-input" bind:value={activeEntity.dice.wd}/></div>
                            <div class="sep">|</div>
                            <div class="input-col"><label class="buff">BUF</label><input type="number" class="buff-input" bind:value={activeEntity.mods.buffers}/></div>
                            <div class="input-col"><label class="debuff">DBF</label><input type="number" class="debuff-input" bind:value={activeEntity.mods.debuffs}/></div>
                        </div>
                        <div class="transmit-section">
                            <div class="pool-preview">POOL: <b>{totalPool.d}d | {totalPool.hd}h | {totalPool.wd}w</b></div>
                            {#if !isGM}<button class="btn-transmit" on:click={transmitDeclaration}>ENVIAR >></button>{/if}
                        </div>
                    </footer>
                </main>
            </div>
        </div>
    {/if}
</div>

<style>
    /* 1. CONTAINER RAIZ: Transparente e ocupa tudo, mas deixa clicar no fundo */
    .combat-terminal-root {
        position: fixed; inset: 0; z-index: 30000;
        pointer-events: none; /* ESSENCIAL: Deixa clicar no Foundry */
        font-family: 'Share Tech Mono', monospace;
    }

    /* 2. JANELA ARRASTÁVEL: Opaca e Interativa */
    .terminal-window {
        position: absolute; width: 900px; height: 600px;
        background: rgba(5, 5, 5, 0.95);
        border: 1px solid var(--c-primary);
        box-shadow: 0 0 30px rgba(0,0,0,0.8);
        display: flex; flex-direction: column;
        pointer-events: auto; /* ESSENCIAL: Permite interagir com a janela */
        border-radius: 4px; overflow: hidden;
        resize: both; /* Permite redimensionar */
        min-width: 600px; min-height: 400px;
    }

    /* 3. GRIP DE ARRASTAR */
    .window-grip {
        background: var(--c-primary); color: #000; padding: 5px 10px;
        display: flex; justify-content: space-between; align-items: center;
        font-weight: bold; font-size: 12px; cursor: move; user-select: none;
    }
    .win-close { background: none; border: none; font-weight: bold; cursor: pointer; font-size: 14px; }

    /* LAYOUT INTERNO */
    .hacker-layout { display: grid; grid-template-columns: 200px 1fr; height: 100%; overflow: hidden; }

    /* SIDEBAR */
    .sidebar { background: rgba(20, 20, 20, 0.5); border-right: 1px solid #333; display: flex; flex-direction: column; padding: 10px; gap: 10px; }
    .npc-list-container { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .npc-list-container label { font-size: 10px; color: #666; margin-bottom: 5px; }
    .scroll-list { flex: 1; overflow-y: auto; padding-right: 2px; }
    
    .npc-card { display: flex; align-items: center; gap: 5px; padding: 5px; border: 1px solid #333; margin-bottom: 2px; cursor: pointer; font-size: 11px; }
    .npc-card:hover, .npc-card.selected { border-color: var(--c-primary); background: rgba(0,255,0,0.05); }
    .npc-thumb { width: 24px; height: 24px; border-radius: 2px; }
    .npc-info { flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .btn-trash { background: none; border: none; color: #666; cursor: pointer; }
    .btn-trash:hover { color: #f00; }

    .btn-add-unit { width: 100%; background: #111; border: 1px dashed #444; color: #666; font-size: 10px; cursor: pointer; padding: 4px; margin-top: 5px; }
    
    /* Monitor */
    .player-monitor { border-top: 1px solid #333; padding-top: 10px; }
    .monitor-grid { display: flex; gap: 2px; flex-wrap: wrap; margin-top: 5px; }
    .monitor-dot { width: 20px; height: 20px; background: #222; border: 1px solid #444; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #555; }
    .monitor-dot.ready { background: var(--c-primary); color: #000; border-color: #fff; }

    /* GM Actions */
    .gm-footer-actions { margin-top: auto; display: flex; flex-direction: column; gap: 5px; }
    .btn-save-all, .btn-init-confrontation { width: 100%; border: 1px solid #444; background: #111; color: #ccc; cursor: pointer; font-family: inherit; font-size: 10px; padding: 8px; }
    .btn-init-confrontation { border-color: #f33; color: #f33; background: #200; font-weight: bold; }
    .btn-init-confrontation:hover { background: #f33; color: #000; }

    /* Player Profile */
    .player-profile { text-align: center; }
    .p-img { width: 64px; height: 64px; border-radius: 50%; border: 2px solid var(--c-primary); object-fit: cover; }
    .p-name { display: block; font-weight: bold; margin-top: 5px; font-size: 12px; }
    .p-status { font-size: 9px; color: var(--c-primary); }

    /* MAIN PANEL */
    .main-panel { display: flex; flex-direction: column; padding: 15px; overflow: hidden; }
    .entity-header { border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom: 10px; }
    .gm-edit-row { display: flex; gap: 5px; }
    .hacker-input { background: #000; border: none; border-bottom: 1px solid #444; color: #fff; flex: 1; padding: 4px; font-family: inherit; }
    .hacker-input:focus { border-color: var(--c-primary); outline: none; }
    .hacker-title { margin: 0; font-size: 14px; opacity: 0.8; }

    /* CARDS */
    .actions-scroll-area { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding-right: 5px; }
    .maneuver-card { border: 1px solid #333; background: #080808; border-left: 3px solid #555; }
    .card-header { display: flex; align-items: center; gap: 10px; padding: 5px 10px; background: rgba(255,255,255,0.03); }
    .idx { font-weight: bold; color: #555; }
    .type-select { background: #000; border: 1px solid #333; color: #ccc; font-family: inherit; font-size: 10px; padding: 2px; }
    .type-select.ataque { color: #f33; } .type-select.defesa { color: #08f; } .type-select.utilidade { color: #fc0; }
    
    .collapsed-preview { flex: 1; font-size: 11px; opacity: 0.5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .card-controls { margin-left: auto; display: flex; gap: 2px; }
    .btn-mini { background: #000; border: 1px solid #333; color: #777; width: 20px; height: 20px; cursor: pointer; font-size: 10px; }
    .btn-mini:hover { color: #fff; border-color: #fff; }
    .btn-mini.danger:hover { color: #f33; border-color: #f33; }

    .card-body { padding: 10px; border-top: 1px solid #333; }
    .desc-area { width: 100%; background: #000; border: 1px solid #333; color: #ccc; min-height: 40px; font-family: inherit; resize: vertical; padding: 5px; font-size: 11px; margin-bottom: 8px; }
    
    .params-grid { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .param-box { display: flex; flex-direction: column; }
    .param-box label { font-size: 9px; color: #666; }
    .param-box input { width: 40px; background: #000; border: 1px solid #333; color: #fff; text-align: center; }
    
    .toggle-box, .radio-group { display: flex; flex-direction: column; gap: 2px; font-size: 10px; }
    .reaction-section { border-left: 1px solid #333; padding-left: 8px; display: flex; gap: 5px; align-items: center; margin-left: auto; }
    .reaction-check { font-size: 10px; color: #fc0; display: flex; align-items: center; gap: 2px; }

    .btn-add-action { background: #111; border: 1px dashed #444; color: #666; width: 100%; padding: 8px; cursor: pointer; margin-top: 5px; }
    .btn-add-action:hover { border-color: var(--c-primary); color: var(--c-primary); }

    /* FOOTER */
    .pool-footer { margin-top: 10px; border-top: 1px solid #333; padding-top: 10px; }
    .pool-setup { display: flex; gap: 15px; margin-bottom: 10px; }
    .input-col { display: flex; flex-direction: column; align-items: center; }
    .input-col label { font-size: 9px; font-weight: bold; }
    .input-col input { width: 30px; text-align: center; background: #000; border: 1px solid #444; color: #fff; }
    .hd { color: #f33; } .hd-input { border-color: #500; color: #f33; }
    .wd { color: #fc0; } .wd-input { border-color: #540; color: #fc0; }
    .buff { color: #0cf; } .buff-input { border-color: #045; color: #0cf; }
    .debuff { color: #f0f; } .debuff-input { border-color: #505; color: #f0f; }
    .sep { color: #333; }

    .transmit-section { display: flex; justify-content: space-between; align-items: center; background: #111; padding: 5px 10px; border-radius: 2px; }
    .pool-preview { font-size: 11px; }
    .btn-transmit { background: var(--c-primary); color: #000; font-weight: bold; border: none; padding: 5px 15px; cursor: pointer; font-size: 11px; }
</style>