<script>
    import { slide, fade } from 'svelte/transition';
    import { createEventDispatcher } from 'svelte';
    import { CombatEffect } from '../../../Logic/CombatEffect.js';
import { CombatManager } from '../../../Logic/CombatManager.js';
    import { OnlineCombat } from '../../../Logic/OnlineCombat.js'; 
    
    import ActionCard from './ActionCard.svelte';
    import PoolBuilder from './PoolBuilder.svelte';

    export let entity; 
    export let isGM = false;

    const dispatch = createEventDispatcher();
    const MODULE_ID = "multiversus-rpg";

    let focusedActionIndex = null; 

    const createManeuver = () => ({
        id: foundry.utils.randomID(), type: 'ataque', style: 'melee', desc: "", sourceId: "custom",
        basePool: { d: entity.pool?.d || 0, hd: 0, wd: 0 }, maneuvers: [], 
        tactics: { aimingTurns: 0, calledShot: false, targetLocation: 10, sneakAttack: false, disarm: false },
        env: { range: 'curta', movement: 'parado' }, weapon: { dmg: 1, pen: 0, penType: 'fisica', spray: 0, isSlow: false, isThrownObject: false },
        defense: { style: 'block', defType: 'normal', lar: 0, har: 0, hp: 0, goFirst: 0, durationTurns: 0, lastsWholeScene: false },
        utility: { style: 'power', duration: 0, skillBonus: 0, heal: { type: 'active', targetLimb: 0, regenOnDamage: false }, buff: { type: 'normal', amount: 1 }, debuff: { type: 'normal', amount: 1 }, power: { range: 0, mass: 0, speed: 0, capacity: 0 } }
    });

    function addAction() { entity.actions = [...entity.actions, createManeuver()]; triggerUpdate(); }
    function removeAction(idx) { entity.actions = entity.actions.filter((_, i) => i !== idx); triggerUpdate(); }
    function triggerUpdate() { entity.actions = [...entity.actions]; if (isGM) dispatch('npcUpdated', entity); }

    function pingEntity() {
        ChatMessage.create({
            content: `<div style="background:rgba(0,0,0,0.8); border:1px solid var(--c-primary, #00ff41); color:var(--c-primary, #00ff41); padding:10px; font-family:'Share Tech Mono', monospace; text-align:center; border-radius:4px;"><i class="fas fa-crosshairs fa-spin" style="font-size:24px; margin-bottom:8px;"></i><br><b style="font-size:16px; text-transform:uppercase;">${entity.name}</b><br><span style="font-size:11px; color:#aaa;">Marcado como alvo pelo comando Tático.</span></div>`
        });
    }

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
        entity.ready = true; // NOVO: Garante que a luz azul acenda no carrossel!
        const finalSubmitPool = entity.poolToRoll || entity.pool;

        const payload = JSON.parse(JSON.stringify({ 
            actorId: entity.actorId, 
            userId: game.user?.id,
            pool: finalSubmitPool, 
            actions: entity.actions,
            stats: entity.stats 
        }));

        if (!isGM) {
            await game.user.setFlag(MODULE_ID, "combatDeclaration", payload);
            OnlineCombat.sendVectorsToGM(payload);
            ui.notifications.info("VETORES TRANSMITIDOS.");
        } else {
            // MESTRE EDITANDO: Manda pro Hub atualizar a lista
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

<div class="terminal-panel" in:fade={{duration: 300}}>
    <div class="bg-grid"></div>

    {#if focusedActionIndex === null}
        <header class="t-header" transition:slide>
            <div class="avatar-wrapper"><img src={entity.img} alt="img"/><div class="scanline"></div></div>
            <div class="t-info">
                <h2>{entity.name}</h2>
                <div class="status-row">
                    <div class="status-dot {entity.submitted ? 'locked' : 'online'}"></div>
                    <span class="status-text {entity.submitted ? 'locked' : 'online'}">
                        {entity.submitted ? 'VETOR CONFIRMADO // AGUARDANDO INICIATIVA' : 'SISTEMA ONLINE // PRONTO PARA DECLARAÇÃO'}
                    </span>
                </div>
            </div>
            <div class="win-controls">
                {#if isGM}
                    <button class="win-btn ping" on:click|stopPropagation={pingEntity}><i class="fas fa-bullseye"></i> PING</button>
                {/if}
            </div>
        </header>

        <div class="initiative-tracker" transition:slide>
            <div class="i-info">
                <div class="i-title"><i class="fas fa-microchip"></i> INICIATIVA SENSORIAL</div>
            </div>
            <div class="i-stats">
                <div class="i-box"><span>SNS</span><input type="number" bind:value={entity.stats.sense} on:input={triggerUpdate} disabled={entity.submitted}></div>
                <div class="i-box"><span>CMD</span><input type="number" bind:value={entity.stats.command} on:input={triggerUpdate} disabled={entity.submitted}></div>
                <div class="i-box"><span>MND</span><input type="number" bind:value={entity.stats.mind} on:input={triggerUpdate} disabled={entity.submitted}></div>
                <div class="i-box"><span>CRD</span><input type="number" bind:value={entity.stats.coordination} on:input={triggerUpdate} disabled={entity.submitted}></div>
            </div>
        </div>
    {/if}

    <div class="actions-area custom-scroll" class:disabled-area={entity.submitted}>
        {#each entity.actions as action, i (action.id)}
            <div class="action-wrapper" style="display: {focusedActionIndex !== null && focusedActionIndex !== i ? 'none' : 'block'}">
                <ActionCard 
                    bind:action={action} 
                    index={i} 
                    disabled={entity.submitted} 
                    isFocused={focusedActionIndex === i}
                    on:toggleFocus={() => focusedActionIndex = focusedActionIndex === i ? null : i}
                    on:remove={() => removeAction(i)} 
                    on:updatePool={triggerUpdate} 
                />
            </div>
        {/each}

        {#if focusedActionIndex === null}
            <button class="add-act-btn" on:click={addAction} disabled={entity.submitted}>
                <i class="fas fa-plus-circle"></i> ABRIR NOVO VETOR 
                {#if entity.actions.length > 0}<span class="penalty-tag">(-1D)</span>{/if}
            </button>
        {/if}
    </div>

    {#if focusedActionIndex === null}
        <footer class="t-footer" transition:slide>
            <PoolBuilder bind:basePool={derivedBasePool} manualOverride={isManualOverride} bind:buffPool={entity.pool} cost={poolCost} disabled={entity.submitted} bind:finalCalculatedPool={entity.poolToRoll} />
            <div class="action-buttons">
                {#if entity.submitted}
                    <button class="submit-btn cancel" on:click={cancelSubmit}><i class="fas fa-unlock"></i> CÓDIGOS ENVIADOS! DESTRAVAR</button>
                {:else}
                    <button class="submit-btn active" on:click={submitActions}><i class="fas fa-paper-plane"></i> TRANSMITIR PROTOCOLOS</button>
                {/if}
            </div>
        </footer>
    {/if}
</div>

<style>
    /* CSS CRÍTICO DO LAYOUT FLEXBOX PARA HABILITAR SCROLL */
    .terminal-panel { 
        display: flex; flex-direction: column; 
        width: 100%; height: 100%; 
        overflow: hidden; position: relative; 
        background: #07070a; font-family: 'Share Tech Mono', monospace; 
    }
    
    .t-header { flex-shrink: 0; display: flex; gap: 15px; padding: 15px 20px; background: linear-gradient(90deg, rgba(255,255,255,0.05) 0%, transparent 100%); border-bottom: 1px solid rgba(0,255,65,0.2); }
    .initiative-tracker { flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.7); border-bottom: 1px solid #222; padding: 10px 20px; }
    
    /* A MÁGICA DA ROLAGEM ACONTECE AQUI: flex: 1 E min-height: 0 */
    .actions-area { flex: 1; min-height: 0; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 15px; position: relative; }
    
    .t-footer { flex-shrink: 0; background: #050505; border-top: 1px solid #333; padding: 15px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 -10px 30px rgba(0,0,0,0.8); }

    /* Estilos Estéticos */
    .bg-grid { position: absolute; inset: 0; pointer-events: none; opacity: 0.03; background-image: linear-gradient(var(--c-primary, #00ff41) 1px, transparent 1px), linear-gradient(90deg, var(--c-primary, #00ff41) 1px, transparent 1px); background-size: 20px 20px; z-index: 0; }
    .avatar-wrapper { position: relative; width: 45px; height: 45px; border-radius: 6px; border: 2px solid var(--c-primary, #00ff41); overflow: hidden; background: #000; flex-shrink: 0; }
    .avatar-wrapper img { width: 100%; height: 100%; object-fit: cover; }
    .scanline { position: absolute; top: 0; left: 0; width: 100%; height: 5px; background: rgba(255,255,255,0.3); opacity: 0.5; animation: scan 3s linear infinite; pointer-events: none; }
    
    .t-info { display: flex; flex-direction: column; justify-content: center; flex: 1; overflow: hidden; }
    .t-info h2 { margin: 0; color: #fff; font-size: 16px; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .status-row { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
    .status-dot { width: 10px; height: 10px; border-radius: 50%; box-shadow: 0 0 8px currentColor; }
    .status-dot.online { color: var(--c-primary, #00ff41); background: var(--c-primary, #00ff41); animation: pulse 2s infinite; }
    .status-dot.locked { color: #ffaa00; background: #ffaa00; animation: pulseFast 0.5s infinite; }
    .status-text { font-size: 10px; font-weight: bold; letter-spacing: 1px; }
    .status-text.online { color: var(--c-primary, #00ff41); }
    .status-text.locked { color: #ffaa00; }

    .win-controls { display: flex; align-items: center; z-index: 100; }
    .win-btn.ping { background: rgba(0, 255, 65, 0.1); border: 1px dashed var(--c-primary, #00ff41); color: var(--c-primary, #00ff41); font-size: 10px; font-weight: bold; font-family: inherit; padding: 6px 12px; border-radius: 4px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 6px; }
    .win-btn.ping:hover { background: var(--c-primary, #00ff41); color: #000; box-shadow: 0 0 15px var(--c-primary, #00ff41); }

    .i-info { display: flex; flex-direction: column; gap: 4px; }
    .i-title { font-size: 12px; font-weight: bold; color: var(--c-primary, #00ff41); letter-spacing: 1px; display: flex; align-items: center; gap: 6px; }
    .i-stats { display: flex; gap: 6px; }
    .i-box { display: flex; flex-direction: column; align-items: center; background: #08080a; border: 1px solid #333; border-top: 2px solid #555; padding: 4px 6px; border-radius: 4px; min-width: 42px; }
    .i-box span { font-size: 9px; color: #aaa; font-weight: bold; margin-bottom: 2px; }
    .i-box input { background: transparent; border: none; border-bottom: 1px solid var(--c-primary, #00ff41); color: #fff; font-family: inherit; font-size: 14px; font-weight: bold; text-align: center; width: 35px; outline: none; padding-bottom: 2px; }
    
    .disabled-area { opacity: 0.6; pointer-events: none; filter: grayscale(0.8); transition: all 0.5s; }
    .action-wrapper { width: 100%; position: relative; }

    .add-act-btn { background: rgba(0,0,0,0.6); border: 2px dashed #444; color: #888; padding: 15px; cursor: pointer; font-family: inherit; transition: all 0.3s; width: 100%; border-radius: 6px; font-size: 13px; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 10px; flex-shrink: 0; }
    .add-act-btn:hover:not(:disabled) { background: rgba(0, 255, 65, 0.05); border-color: var(--c-primary, #00ff41); color: var(--c-primary, #00ff41); }
    .penalty-tag { background: #333; color: #ffaa00; padding: 2px 8px; border-radius: 4px; font-size: 10px; margin-left: 5px; }

    .action-buttons { width: 100%; }
    .submit-btn { width: 100%; padding: 15px; font-family: inherit; font-size: 14px; font-weight: bold; border: none; border-radius: 6px; cursor: pointer; transition: all 0.3s; text-transform: uppercase; letter-spacing: 2px; display: flex; justify-content: center; align-items: center; gap: 10px; }
    .submit-btn.active { background: var(--c-primary, #00ff41); color: #000; box-shadow: 0 0 15px rgba(0,255,65,0.4); }
    .submit-btn.active:hover { box-shadow: 0 0 30px var(--c-primary, #00ff41); transform: translateY(-2px); }
    .submit-btn.cancel { background: #111; border: 2px solid #ffaa00; color: #ffaa00; }

    .custom-scroll::-webkit-scrollbar { width: 6px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
    .custom-scroll::-webkit-scrollbar-thumb:hover { background: var(--c-primary, #00ff41); }
    @keyframes scan { 0% { top: -10%; } 100% { top: 110%; } }
    @keyframes pulse { 0%, 100% { opacity: 1; box-shadow: 0 0 5px currentColor; } 50% { opacity: 0.5; box-shadow: 0 0 15px currentColor; } }
    @keyframes pulseFast { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
</style>