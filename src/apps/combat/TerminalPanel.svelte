<script>
    import { slide, fly, fade } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import { createEventDispatcher } from 'svelte';
    import { CombatEffect } from '../../../Logic/CombatEffect.js';
    import { FichaMobileLogic } from '../../../Logic/FichaMobile.js';
    
    import ActionCard from './ActionCard.svelte';
    import PoolBuilder from './PoolBuilder.svelte';

    export let entity; 
    export let isGM = false;

    const dispatch = createEventDispatcher();
    const MODULE_ID = "multiversus-rpg";

    // 1. CARREGA OS DADOS REAIS DO FOUNDRY
    $: actorRaw = game.actors.get(entity.actorId);
    $: dashboardData = actorRaw ? FichaMobileLogic.compileDashboardData(actorRaw) : null;

    // 2. DATA BANK (MEMÓRIA PERSISTENTE DO ATOR)
    // Usamos $ para manter reativo caso o Foundry atualize as flags
    $: savedActions = actorRaw ? (actorRaw.getFlag(MODULE_ID, 'savedActions') || []) : [];

    // FÁBRICA DA AÇÃO
    const createManeuver = () => ({
        id: foundry.utils.randomID(),
        type: 'ataque', 
        style: 'melee', 
        desc: "",
        sourceId: "custom",
        basePool: { d: entity.pool?.d || 0, hd: 0, wd: 0 }, 
        maneuvers: [], 
        tactics: { aimingTurns: 0, calledShot: false, targetLocation: 10, sneakAttack: false, disarm: false, sprayMode: 'none', rapidFire: false, largeStationaryTarget: false },
        env: { range: 'curta', movement: 'parado' },
        weapon: { dmg: 1, pen: 0, penType: 'fisica', spray: 0, isSlow: false, isThrownObject: false },
        defense: { style: 'block', defType: 'normal', lar: 0, har: 0, hp: 0, goFirst: 0, durationTurns: 0, lastsWholeScene: false },
        utility: { style: 'power', duration: 0, skillBonus: 0, heal: { type: 'active', targetLimb: 0, regenOnDamage: false }, buff: { type: 'normal', amount: 1 }, debuff: { type: 'normal', amount: 1 }, power: { range: 0, mass: 0, speed: 0, capacity: 0 } }
    });

    // --- CONTROLE DE AÇÕES ATUAIS ---
    function addAction() {
        entity.actions = [...entity.actions, createManeuver()];
        triggerUpdate();
    }

    function removeAction(idx) {
        entity.actions = entity.actions.filter((_, i) => i !== idx);
        triggerUpdate();
    }

    function triggerUpdate() {
        entity.actions = [...entity.actions];
        if (isGM) dispatch('npcUpdated', entity);
    }

    // --- PING TÁTICO ---
    function pingEntity() {
        ChatMessage.create({
            content: `
            <div style="background:#0a0a0a; border:1px solid var(--c-primary); color:var(--c-primary); padding:8px; font-family:'Share Tech Mono', monospace; text-align:center; border-radius:4px; box-shadow: 0 0 10px rgba(0,255,65,0.5);">
                <i class="fas fa-crosshairs fa-spin" style="font-size:18px; margin-bottom:5px;"></i><br>
                <b style="font-size:14px; text-transform:uppercase;">${entity.name}</b><br>
                <span style="font-size:10px; color:#aaa;">Foi destacado no radar tático da Timeline.</span>
            </div>`
        });
        ui.notifications.info("Sinal de radar tático enviado para o chat!");
    }

    // --- DATA BANK (PERSISTÊNCIA) ---
// --- DATA BANK (PERSISTÊNCIA) ---
    async function saveActionToBank(actionData) {
        if (!actorRaw) return ui.notifications.error("Entidade sem ficha acoplada.");
        
        // Substituindo o prompt() nativo por uma Dialog do Foundry VTT
        const name = await new Promise((resolve) => {
            new Dialog({
                title: "DATA BANK: SALVAR VETOR",
                content: `
                    <div style="padding: 10px; font-family: 'Share Tech Mono', monospace; background: #0a0a0f; color: #fff;">
                        <label style="color: #00aaff; font-weight: bold; font-size: 12px;">NOME DO CARTÃO DE MEMÓRIA:</label>
                        <p style="font-size: 10px; color: #888; margin: 4px 0 10px 0;">Ex: 'Tiro Focado na Cabeça', 'Regeneração Constante'</p>
                        <input type="text" id="db-action-name" value="${actionData.type.toUpperCase()} PADRÃO" 
                               style="width: 100%; padding: 8px; background: #000; border: 1px solid #00aaff; color: #00aaff; font-family: inherit; font-weight: bold;">
                    </div>
                `,
                buttons: {
                    save: {
                        icon: '<i class="fas fa-download"></i>',
                        label: "GRAVAR",
                        callback: (html) => resolve(html.find("#db-action-name").val())
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "CANCELAR",
                        callback: () => resolve(null)
                    }
                },
                default: "save",
                close: () => resolve(null)
            }, {
                width: 350,
                classes: ["nexus-dialog"] // Classe customizada, caso queira estilizar depois
            }).render(true);
        });

        // Se o usuário cancelou ou deixou vazio
        if (!name || name.trim() === "") return;

        const newSaved = foundry.utils.deepClone(actionData);
        newSaved.dbId = foundry.utils.randomID();
        newSaved.dbName = name;

        const updatedBank = [...savedActions, newSaved];
        await actorRaw.setFlag(MODULE_ID, 'savedActions', updatedBank);
        ui.notifications.info(`Ação [${name}] salva no banco de dados do personagem.`);
    }

    async function removeSavedAction(dbId) {
        if (!actorRaw) return;
        const updatedBank = savedActions.filter(a => a.dbId !== dbId);
        await actorRaw.setFlag(MODULE_ID, 'savedActions', updatedBank);
    }

    function loadActionFromBank(savedAction) {
        const loaded = foundry.utils.deepClone(savedAction);
        loaded.id = foundry.utils.randomID(); // Renova o ID pra ele ser único na tela
        entity.actions = [...entity.actions, loaded];
        triggerUpdate();
        ui.notifications.info(`Ação carregada da memória com sucesso.`);
    }

    // =======================================================
    // MATEMÁTICA CENTRAL DO ORE
    // =======================================================
    $: derivedBasePool = computeDerivedPool(entity.actions, entity.pool);
    $: isManualOverride = entity.actions.length === 0 || entity.actions.every(a => a.sourceId === 'custom');
    $: poolCost = calculateTotalCost(entity.actions);

    function computeDerivedPool(actions, fallbackPool) {
        if (!actions || actions.length === 0) return fallbackPool;
        let minD = 999, minHD = 999, minWD = 999, hasData = false;

        actions.forEach(a => {
            if (a.sourceId !== 'custom' && a.basePool) {
                hasData = true;
                if (a.basePool.d < minD) minD = a.basePool.d;
                if (a.basePool.hd < minHD) minHD = a.basePool.hd;
                if (a.basePool.wd < minWD) minWD = a.basePool.wd;
            }
        });
        if (!hasData) return { d: fallbackPool.d, hd: fallbackPool.hd, wd: fallbackPool.wd };
        return { d: minD === 999 ? 0 : minD, hd: minHD === 999 ? 0 : minHD, wd: minWD === 999 ? 0 : minWD };
    }

    function calculateTotalCost(actions) {
        if (!actions) return 0;
        let totalManeuversCost = 0, tacticsPenalty = 0;
        let multipleActionsCost = Math.max(0, actions.length - 1); 

        actions.forEach(a => {
            const mResult = CombatEffect.calculateManeuverCost(a.maneuvers || [], 0);
            totalManeuversCost += mResult.actualDicePenalty;
            if (a.tactics?.calledShot) tacticsPenalty += 1;
            if (a.tactics?.disarm) tacticsPenalty += 1;
        });
        return totalManeuversCost + tacticsPenalty + multipleActionsCost;
    }

    async function submitActions() {
        entity.submitted = true;
        const finalSubmitPool = entity.poolToRoll || entity.pool;

        if (!isGM) {
            await game.user.setFlag(MODULE_ID, "combatDeclaration", { actorId: entity.actorId, pool: finalSubmitPool, actions: entity.actions });
            ui.notifications.info("AÇÕES TRANSMITIDAS AO SERVIDOR TÁTICO.");
        } else {
            entity.poolToRoll = finalSubmitPool;
            dispatch('npcUpdated', entity);
        }
    }

    async function cancelSubmit() {
        entity.submitted = false;
        if (!isGM) await game.user.unsetFlag(MODULE_ID, "combatDeclaration");
        else dispatch('npcUpdated', entity);
    }
</script>

<div class="terminal-workspace" in:fade={{duration: 300}}>
    
    <div class="terminal-panel">
        <div class="bg-grid"></div>

<header class="t-header">
            <div class="avatar-wrapper">
                <img src={entity.img} alt="img"/>
                <div class="scanline"></div>
            </div>
            
            <div class="t-info">
                <h2>{entity.name}</h2>
                <div class="status-row">
                    <div class="status-dot {entity.submitted ? 'locked' : 'online'}"></div>
                    <span class="status-text {entity.submitted ? 'locked' : 'online'}">
                        {entity.submitted ? 'SISTEMA TRAVADO // VETORES ENVIADOS' : 'SISTEMA ONLINE // AGUARDANDO DECLARAÇÃO'}
                    </span>
                </div>
            </div>

            <div class="win-controls">
                <button class="win-btn ping" 
                        on:mousedown|stopPropagation 
                        on:click|stopPropagation={pingEntity} 
                        title="Pingar Alvo na Mesa">
                    <i class="fas fa-bullseye"></i> PING
                </button>

                <button class="win-btn close" 
                        on:mousedown|stopPropagation 
                        on:click|stopPropagation={() => dispatch('closePanel')} 
                        title="Fechar Janela">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </header>

        <div class="initiative-tracker">
            <div class="i-info">
                <div class="i-title"><i class="fas fa-microchip"></i> AJUSTE DE INICIATIVA // MANUAL</div>
                <span class="i-desc">Menos sentidos declara 1º. Desempates: Comando ➡ Mente ➡ Coord.</span>
            </div>
            <div class="i-stats">
                <div class="i-box"><span>SENSE</span><input type="number" bind:value={entity.stats.sense} on:input={triggerUpdate} disabled={entity.submitted}></div>
                <div class="i-box"><span>CMD</span><input type="number" bind:value={entity.stats.command} on:input={triggerUpdate} disabled={entity.submitted}></div>
                <div class="i-box"><span>MIND</span><input type="number" bind:value={entity.stats.mind} on:input={triggerUpdate} disabled={entity.submitted}></div>
                <div class="i-box"><span>COORD</span><input type="number" bind:value={entity.stats.coordination} on:input={triggerUpdate} disabled={entity.submitted}></div>
            </div>
        </div>

        <div class="actions-area custom-scroll" class:disabled-area={entity.submitted}>
            {#each entity.actions as action, i (action.id)}
                <div class="action-wrapper" in:fly={{ y: 30, duration: 400, delay: i * 100, easing: quintOut }} out:slide>
                    
                    <div class="action-toolbar">
                        <span class="a-label">SLOT DE VETOR: 0{i+1}</span>
                        <button class="save-btn" on:click={() => saveActionToBank(action)} disabled={entity.submitted}>
                            <i class="fas fa-download"></i> SALVAR NO DATA BANK
                        </button>
                    </div>

                    <ActionCard bind:action={action} index={i} dashboardData={dashboardData} disabled={entity.submitted} on:remove={() => removeAction(i)} on:updatePool={triggerUpdate} />
                </div>
            {/each}

            <button class="add-act-btn" on:click={addAction} disabled={entity.submitted}>
                <i class="fas fa-plus-circle"></i> INSERIR AÇÃO SECUNDÁRIA <span class="penalty-tag">(-1D)</span>
            </button>
        </div>

        <footer class="t-footer">
            <PoolBuilder bind:basePool={derivedBasePool} manualOverride={isManualOverride} bind:buffPool={entity.pool} cost={poolCost} disabled={entity.submitted} bind:finalCalculatedPool={entity.poolToRoll} />

            <div class="action-buttons">
                {#if entity.submitted}
                    <button class="submit-btn cancel" on:click={cancelSubmit} in:fade><i class="fas fa-unlock"></i> DESTRAVAR SISTEMA E EDITAR</button>
                {:else}
                    <button class="submit-btn active" on:click={submitActions} in:fade><i class="fas fa-paper-plane"></i> TRANSMITIR VETORES DE COMBATE</button>
                {/if}
            </div>
        </footer>
    </div>

    <div class="databank-panel custom-scroll">
        <div class="db-header">
            <div class="db-title"><i class="fas fa-server"></i> DATA BANK</div>
            <span class="db-subtitle">Memória Persistente do Ator</span>
        </div>
        
        <div class="db-list">
            {#each savedActions as sAct}
                <div class="db-card {sAct.type}">
                    <div class="db-c-info">
                        <i class="fas {sAct.type === 'ataque' ? 'fa-fist-raised' : sAct.type === 'defesa' ? 'fa-shield-alt' : 'fa-magic'}"></i>
                        <strong>{sAct.dbName}</strong>
                    </div>
                    <div class="db-c-actions">
                        <button class="db-load" on:click={() => loadActionFromBank(sAct)} disabled={entity.submitted} title="Carregar para a área de ações"><i class="fas fa-upload"></i></button>
                        <button class="db-del" on:click={() => removeSavedAction(sAct.dbId)} disabled={entity.submitted} title="Apagar da Memória"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            {/each}

            {#if savedActions.length === 0}
                <div class="empty-db">
                    <i class="fas fa-sd-card"></i>
                    <span>O Banco de Dados está vazio.<br>Exporte ações para acessá-las rapidamente em qualquer rodada.</span>
                </div>
            {/if}
        </div>
    </div>

</div>

<style>
    /* ================= WORKSPACE (PAINEL DUPLO REDIMENSIONÁVEL) ================= */
    .terminal-workspace { 
        display: flex; height: 100%; width: 100%; background: #000; 
        font-family: 'Share Tech Mono', monospace; 
        /* Essa propriedade CSS permite ao Mestre redimensionar o painel caso ele seja muito largo ou queira esconder o DataBank */
        resize: horizontal; overflow: hidden; min-width: 600px;
    }

    /* ================= TERMINAL PRINCIPAL ================= */
    .terminal-panel { flex: 1; display: flex; flex-direction: column; position: relative; overflow: hidden; background: radial-gradient(circle at center, #0a0a0f 0%, #030305 100%); }
    .bg-grid { position: absolute; inset: 0; pointer-events: none; opacity: 0.05; background-image: linear-gradient(var(--c-primary) 1px, transparent 1px), linear-gradient(90deg, var(--c-primary) 1px, transparent 1px); background-size: 20px 20px; z-index: 0; }
    
    .t-header { display: flex; gap: 15px; padding: 15px 20px; z-index: 10; background: linear-gradient(90deg, rgba(255,255,255,0.05) 0%, transparent 100%); border-bottom: 1px solid rgba(0,255,65,0.3); box-shadow: 0 5px 15px rgba(0,0,0,0.5); }
    .avatar-wrapper { position: relative; width: 55px; height: 55px; border-radius: 6px; border: 2px solid var(--c-primary); overflow: hidden; }
    .avatar-wrapper img { width: 100%; height: 100%; object-fit: cover; }
    .scanline { position: absolute; top: 0; left: 0; width: 100%; height: 5px; background: rgba(255,255,255,0.3); opacity: 0.5; animation: scan 3s linear infinite; }
    .t-info { display: flex; flex-direction: column; justify-content: center; flex: 1; }
    .t-info h2 { margin: 0; color: #fff; font-size: 18px; text-transform: uppercase; }
    .status-row { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; }
    .status-dot.online { background: var(--c-primary); animation: pulse 2s infinite; }
    .status-dot.locked { background: #ffaa00; animation: pulseFast 0.5s infinite; }
    .status-text { font-size: 10px; font-weight: bold; }
    .status-text.online { color: var(--c-primary); }
    .status-text.locked { color: #ffaa00; }

    /* CONTROLES DE JANELA (NOVO) */
.win-controls { 
        display: flex; 
        gap: 5px; 
        align-items: flex-start; 
        pointer-events: all; /* Garante que a div receba cliques */
        z-index: 100;
    }

    .win-btn { 
        pointer-events: all !important; /* Força o botão a ser clicável */
        border: none; 
        font-family: inherit; 
        font-weight: bold; 
        border-radius: 4px; 
        cursor: pointer; 
        transition: 0.2s; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        gap: 4px; 
    }
    .win-btn.ping { background: rgba(0, 255, 65, 0.1); border: 1px dashed var(--c-primary); color: var(--c-primary); font-size: 10px; padding: 4px 8px; height: 24px; }
    .win-btn.ping:hover { background: var(--c-primary); color: #000; box-shadow: 0 0 10px var(--c-primary); }
    .win-btn.close { background: transparent; color: #888; font-size: 16px; padding: 4px; height: 24px; }
    .win-btn.close:hover { color: #f33; transform: scale(1.1); }

    /* INICIATIVA MANUAL */
    .initiative-tracker { display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.6); border-bottom: 1px solid #222; padding: 10px 20px; z-index: 10; backdrop-filter: blur(5px); }
    .i-info { display: flex; flex-direction: column; gap: 2px; }
    .i-title { font-size: 11px; font-weight: bold; color: var(--c-primary); letter-spacing: 1px; }
    .i-desc { font-size: 9px; color: #666; }
    .i-stats { display: flex; gap: 8px; }
    .i-box { display: flex; flex-direction: column; align-items: center; justify-content: center; background: #080808; border: 1px solid #333; border-top: 2px solid #555; padding: 4px 10px; border-radius: 4px; min-width: 45px; box-shadow: inset 0 5px 10px rgba(0,0,0,0.5); }
    .i-box span { font-size: 8px; color: #888; text-transform: uppercase; margin-bottom: 2px; }
    .i-box input { background: transparent; border: none; border-bottom: 1px solid var(--c-primary); color: #fff; font-family: inherit; font-size: 16px; font-weight: bold; text-align: center; width: 35px; outline: none; transition: 0.2s; }
    .i-box input:focus { border-bottom-width: 2px; text-shadow: 0 0 10px var(--c-primary); }
    .i-box input::-webkit-inner-spin-button, .i-box input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }

    /* ÁREA DE AÇÕES (COM BARRA DE FERRAMENTAS) */
    .actions-area { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; z-index: 10; }
    .disabled-area { opacity: 0.5; pointer-events: none; filter: grayscale(0.8); transition: all 0.5s; }
    
    .action-wrapper { display: flex; flex-direction: column; gap: 5px; }
    .action-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 0 5px; }
    .a-label { font-size: 10px; font-weight: bold; color: var(--c-primary); opacity: 0.7; }
    .save-btn { background: #111; border: 1px solid #444; color: #aaa; font-family: inherit; font-size: 9px; font-weight: bold; padding: 2px 8px; border-radius: 12px; cursor: pointer; transition: 0.2s; display: flex; gap: 4px; align-items: center; }
    .save-btn:hover:not(:disabled) { background: #00aaff; color: #000; border-color: #00aaff; box-shadow: 0 0 10px #00aaff; }

    .add-act-btn { background: rgba(0,0,0,0.4); border: 1px dashed #555; color: #888; padding: 15px; cursor: pointer; font-family: inherit; transition: all 0.3s; width: 100%; border-radius: 6px; font-size: 12px; font-weight: bold; }
    .add-act-btn:hover:not(:disabled) { background: rgba(255,255,255,0.05); border-color: var(--c-primary); color: var(--c-primary); }
    .penalty-tag { background: #333; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 10px; }

    /* FOOTER */
    .t-footer { background: #050505; border-top: 1px solid #333; padding: 20px; display: flex; flex-direction: column; gap: 15px; z-index: 10; box-shadow: 0 -10px 20px rgba(0,0,0,0.8); }
    .action-buttons { position: relative; width: 100%; }
    .submit-btn { width: 100%; padding: 14px; font-family: inherit; font-size: 14px; font-weight: bold; border: none; border-radius: 4px; cursor: pointer; transition: all 0.3s; text-transform: uppercase; letter-spacing: 2px; display: flex; justify-content: center; align-items: center; gap: 10px; }
    .submit-btn.active { background: var(--c-primary); color: #000; box-shadow: 0 0 15px rgba(0,255,65,0.4); }
    .submit-btn.active:hover { box-shadow: 0 0 25px var(--c-primary); }
    .submit-btn.cancel { background: #111; border: 1px solid #ffaa00; color: #ffaa00; }

    /* ================= DATA BANK (DIREITA) ================= */
    .databank-panel { width: 240px; background: #07070a; border-left: 2px solid #222; display: flex; flex-direction: column; padding: 15px; box-shadow: inset 10px 0 20px rgba(0,0,0,0.5); z-index: 10; }
    .db-header { display: flex; flex-direction: column; gap: 2px; border-bottom: 1px dashed #333; padding-bottom: 10px; margin-bottom: 15px; }
    .db-title { color: #00aaff; font-size: 14px; font-weight: bold; display: flex; align-items: center; gap: 8px; }
    .db-subtitle { font-size: 9px; color: #666; }

    .db-list { display: flex; flex-direction: column; gap: 8px; flex: 1; }
    
    .db-card { display: flex; justify-content: space-between; align-items: center; background: #111; border: 1px solid #333; border-left: 4px solid #555; padding: 8px 10px; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.3); transition: 0.2s; }
    .db-card:hover { border-color: #666; background: #151515; }
    .db-card.ataque { border-left-color: #f33; } .db-card.defesa { border-left-color: #08f; } .db-card.utilidade { border-left-color: #a855f7; }

    .db-c-info { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #fff; flex: 1; overflow: hidden; }
    .db-c-info strong { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: bold; }
    .db-c-info i { opacity: 0.7; font-size: 10px; }
    
    .db-c-actions { display: flex; gap: 5px; }
    .db-load { background: rgba(0, 170, 255, 0.1); border: 1px solid #00aaff; color: #00aaff; font-size: 10px; padding: 4px 6px; border-radius: 2px; cursor: pointer; transition: 0.2s; }
    .db-load:hover:not(:disabled) { background: #00aaff; color: #000; box-shadow: 0 0 5px #00aaff; }
    .db-del { background: transparent; border: 1px solid #444; color: #666; font-size: 10px; padding: 4px 6px; border-radius: 2px; cursor: pointer; transition: 0.2s; }
    .db-del:hover:not(:disabled) { border-color: #f33; color: #f33; }

    .empty-db { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #444; font-size: 10px; padding: 20px 0; gap: 10px; }
    .empty-db i { font-size: 30px; opacity: 0.5; }

    .custom-scroll::-webkit-scrollbar { width: 4px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #444; border-radius: 2px; }

    @keyframes scan { 0% { top: -10%; } 100% { top: 110%; } }
    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } }
    @keyframes pulseFast { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
</style>