<script>
    import { onMount, createEventDispatcher } from 'svelte'; // <-- IMPORTANDO AQUI
    import { fade } from 'svelte/transition';
    import { ORE } from '../../../Logic/ORE.js';
    import { CombatEffect } from '../../../Logic/CombatEffect.js';

    import TimelineView from './TimelineView.svelte';
    import CombatantTray from './CombatantTray.svelte';

    export let combatantsData = []; 
    export let isGM = false;

    const dispatch = createEventDispatcher(); // <-- DECLARANDO AQUI (Isso resolve o erro vermelho!)
    const MODULE_ID = "multiversus-rpg";

    // ... (o resto do código fica igualzinho)

    // Estados Globais da Resolução
    let combatants = [];
    let timeline = [];
    let activeUnitId = null;
    let targeting = { active: false, sourceId: null, setIndex: null, setStats: null, actionData: null };

    // --- 1. BOOT: Rola os Dados de Todo Mundo ---
    onMount(() => {
        combatants = combatantsData.map(c => {
            const finalPool = c.poolToRoll || c.pool; 
            const rolledDice = ORE.generateRoll(finalPool);
            return { ...c, rolledDice, reactionUsed: false, currentSets: [] };
        });

        if (combatants.length > 0) activeUnitId = combatants[0].id;
        recalculateTimeline();
    });

    // --- 2. O CÉREBRO: Analisa Sets e Monta a Linha do Tempo ---
    function recalculateTimeline() {
        let list = [];
        combatants.forEach(c => {
            const parsed = ORE.parseResults(c.rolledDice);
            c.currentSets = parsed.validSets;

            c.currentSets.forEach((set, i) => {
                let action = c.actions[i] || { type: 'utilidade', utility: { style: 'move' }, text: 'Ação Improvisada' };
                
                let speedBonus = 0;
                if (action.type === 'defesa') speedBonus = action.defense?.goFirst || 0;
                if (action.maneuvers?.includes('rapido')) speedBonus += 1;
                
                list.push({
                    uniqueId: `${c.id}-${set.h}-${set.w}`, actorId: c.id, name: c.name, img: c.img,
                    width: set.w, effectiveSpeed: set.w + speedBonus, height: set.h,
                    action: action, setIndex: i, sourceUnit: c
                });
            });
        });
        
        // ORDEM ORE: Velocidade Efetiva (Maior = Primeiro). Desempate: Altura (Maior = Primeiro)
        timeline = list.sort((a, b) => b.effectiveSpeed - a.effectiveSpeed || b.height - a.height);
        combatants = [...combatants]; // Força Svelte a redesenhar a HUD da direita
    }

    // --- 3. RECEBENDO EVENTOS DOS SUB-COMPONENTES ---
    
    // Do DiceManager
    function handleWiggle(e) {
        const { unitId, index, value } = e.detail;
        const cIndex = combatants.findIndex(c => c.id === unitId);
        combatants[cIndex].rolledDice = ORE.assignWiggleValue(combatants[cIndex].rolledDice, index, value);
        recalculateTimeline();
    }

    // Do CombatantTray
    function handleReaction(e) {
        const unitId = e.detail;
        const cIndex = combatants.findIndex(c => c.id === unitId);
        const c = combatants[cIndex];
        if (c.reactionUsed) return;

        const reactD = c.pool.reaction?.d || 2; 
        for(let i=0; i<reactD; i++) c.rolledDice.push({ val: Math.floor(Math.random() * 10) + 1, type: 'd' });
        c.reactionUsed = true;
        recalculateTimeline();
        ui.notifications.warn(`[ PROTOCOLO DE REAÇÃO ] ${c.name} ativou defesa de emergência!`);
    }

    // Do ActionExecutor
    function handlePrepareExecute(e) {
        const { unitId, setIndex, setStats, actionData } = e.detail;
        
        // Movimentos não pedem clique em alvo
        if (actionData.type === 'utilidade' && actionData.utility?.style === 'move') {
            executeAction(unitId, null, setStats, actionData);
            return;
        }
        
        targeting = { active: true, sourceId: unitId, setIndex, setStats, actionData };
        ui.notifications.info("SISTEMA DE MIRA ATIVO. Clique no alvo na Timeline.");
    }

    // Da TimelineView
    function handleTimelineClick(e) {
        const targetItem = e.detail;
        if (targeting.active) {
            executeAction(targeting.sourceId, targetItem.actorId, targeting.setStats, targeting.actionData);
            targeting = { active: false };
        } else {
            activeUnitId = targetItem.actorId;
        }
    }

    // --- 4. EXECUÇÃO NO FOUNDRY (BANCO DE DADOS E CHAT) ---
// --- 4. EXECUÇÃO NO FOUNDRY (BANCO DE DADOS E CHAT INLINE) ---
    async function executeAction(sourceId, targetId, setStats, actionData) {
        const sourceUnit = combatants.find(c => c.id === sourceId);
        const targetUnit = targetId ? combatants.find(c => c.id === targetId) : null;
        const targetActor = targetUnit ? game.actors.get(targetUnit.actorId) : null;

        // Definindo as cores com base no tipo de ação
        let borderColor = '#00ff41'; // Padrão
        if (actionData.type === 'ataque') borderColor = '#f33';
        if (actionData.type === 'defesa') borderColor = '#08f';
        if (actionData.type === 'utilidade') borderColor = '#a855f7';

        // INÍCIO DO HTML INLINE PARA O CHAT
        let chatHtml = `<div style="border-left: 4px solid ${borderColor}; padding-left: 8px; font-family: 'Share Tech Mono', monospace; font-size: 13px; line-height: 1.4; background: rgba(0,0,0,0.5); border-radius: 0 4px 4px 0;">`;
        
        chatHtml += `<div style="font-weight: bold; border-bottom: 1px dashed #555; padding-bottom: 4px; margin-bottom: 6px; font-size: 14px; text-shadow: 0 0 5px ${borderColor}; color: ${borderColor};">[ VETOR EXECUTADO: ${actionData.type.toUpperCase()} ]</div>`;
        
        chatHtml += `<div style="color: #ccc;"><b>ORIGEM:</b> ${sourceUnit.name}<br><b>CONJUNTO ORE:</b> <span style="color:#fff; font-weight:bold; background:#111; padding:2px 5px; border:1px solid #444; border-radius:3px;">${setStats.w}x${setStats.h}</span></div>`;

        // === ATAQUE ===
        if (actionData.type === 'ataque') {
            chatHtml += `<div style="margin-top: 6px; color: #ffaa00; font-weight: bold; background: rgba(255,170,0,0.1); padding: 2px 5px; border-left: 2px solid #ffaa00;">>> ALVO: ${targetUnit.name}</div>`;
            const hitLoc = actionData.tactics?.calledShot ? actionData.tactics.targetLocation : setStats.h;
            let rawShock = setStats.w + (actionData.weapon?.dmg || 0);
            let rawKill = actionData.weapon?.kill || 0;

            const mResult = CombatEffect.processManeuvers(
                { width: setStats.w, height: hitLoc, rawShock, rawKill, pen: actionData.weapon?.pen || 0 },
                actionData.maneuvers || []
            );

            if (targetActor) {
                let limbs = targetActor.getFlag(MODULE_ID, 'limbs_base') || [];
                let limbIdx = limbs.findIndex(l => l.id == hitLoc);
                if (limbIdx === -1) limbIdx = 0; 
                let limb = limbs[limbIdx];

                if (limb) {
                    const armorMath = CombatEffect.calculateEffectiveArmor(
                        limb.har || 0, limb.lar || 0, 
                        targetActor.getFlag(MODULE_ID, 'armorType') || 'fisica', 
                        mResult.finalDamage.pen, actionData.weapon?.penType || 'fisica'
                    );

                    let sIn = mResult.finalDamage.shock;
                    let kIn = mResult.finalDamage.kill;

                    if (armorMath.effectiveHAR > 0) {
                        sIn = Math.max(0, sIn - (armorMath.effectiveHAR * 2));
                        kIn = Math.max(0, kIn - armorMath.effectiveHAR);
                    }
                    let sFinal = Math.max(0, sIn - armorMath.effectiveLAR);
                    let convertedK = Math.min(kIn, armorMath.effectiveLAR);
                    let kFinal = kIn - convertedK;
                    sFinal += convertedK;

                    let totalDmg = kFinal + sFinal;

                    limb.killing = (limb.killing || 0) + kFinal;
                    limb.shock = (limb.shock || 0) + sFinal;
                    limbs[limbIdx] = limb;
                    await targetActor.update({ [`flags.${MODULE_ID}.limbs_base`]: limbs }, { render: false });

                    let gobbled = applyDamageGobble(targetUnit.id, totalDmg);

                    chatHtml += `<div style="background: rgba(255, 0, 0, 0.1); padding: 5px; border: 1px solid #500; margin-top: 5px; border-radius: 4px; color:#ccc;">
                        <b>LOCAL:</b> ${limb.name || `Área ${hitLoc}`}<br>
                        <b>DANO APLICADO:</b> <span style="color:#f33">${kFinal} Letal</span> | <span style="color:#fc0">${sFinal} Choque</span><br>
                        ${armorMath.ignoredArmor > 0 ? `<i>(Armadura absorveu dano bruto)</i><br>` : ''}
                        ${gobbled > 0 ? `<b style="color:#ffaa00; background:#210; padding:2px; display:block; margin-top:4px;">[ INTERRUPÇÃO ] Alvo perdeu ${gobbled} dados!</b>` : ''}
                    </div>`;
                }
            }
        }
        // === UTILIDADE ===
        else if (actionData.type === 'utilidade') {
            const ut = actionData.utility;
            if (ut.style === 'heal' && targetActor) {
                let healAmount = setStats.w + (ut.skillBonus || 0);
                let limbs = targetActor.getFlag(MODULE_ID, 'limbs_base') || [];
                
                if (ut.heal.targetLimb > 0) {
                    let idx = limbs.findIndex(l => l.id == ut.heal.targetLimb);
                    if(idx !== -1) limbs[idx] = CombatEffect.processLimbHealing(limbs[idx], healAmount);
                } else {
                    limbs = CombatEffect.processFullBodyHealing(limbs, healAmount);
                }
                await targetActor.update({ [`flags.${MODULE_ID}.limbs_base`]: limbs }, { render: false });
                
                chatHtml += `<div style="margin-top: 6px; color: #ffaa00; font-weight: bold; background: rgba(255,170,0,0.1); padding: 2px 5px; border-left: 2px solid #ffaa00;">>> ALVO: ${targetUnit.name}</div>
                             <div style="background: rgba(0, 255, 0, 0.1); padding: 5px; border: 1px solid #050; margin-top: 5px; color: #0f0; border-radius: 4px;"><b>REGENERAÇÃO:</b> Curou ${healAmount} pontos de dano!</div>`;
            }
            else if (ut.style === 'buff' && targetUnit) {
                const buffDice = ut.buff.amount + (ut.skillBonus || 0);
                for(let i=0; i<buffDice; i++) targetUnit.rolledDice.push({ val: Math.floor(Math.random() * 10) + 1, type: 'd' });
                
                chatHtml += `<div style="margin-top: 6px; color: #ffaa00; font-weight: bold; background: rgba(255,170,0,0.1); padding: 2px 5px; border-left: 2px solid #ffaa00;">>> ALVO: ${targetUnit.name}</div>
                             <div style="background: rgba(0, 170, 255, 0.1); padding: 5px; border: 1px solid #005; margin-top: 5px; color: #08f; border-radius: 4px;"><b>SUPORTE TÁTICO:</b> Adicionou +${buffDice} Dados!</div>`;
                recalculateTimeline();
            }
            else if (ut.style === 'debuff' && targetUnit) {
                const gobbleAmt = ut.debuff.amount + (ut.skillBonus || 0);
                const gobbled = applyDamageGobble(targetUnit.id, gobbleAmt);
                
                chatHtml += `<div style="margin-top: 6px; color: #ffaa00; font-weight: bold; background: rgba(255,170,0,0.1); padding: 2px 5px; border-left: 2px solid #ffaa00;">>> ALVO: ${targetUnit.name}</div>
                             <div style="background: rgba(170, 85, 247, 0.1); padding: 5px; border: 1px solid #419; margin-top: 5px; color: #a855f7; border-radius: 4px;"><b>SABOTAGEM:</b> Destruiu ${gobbled} dados do inimigo!</div>`;
            }
            else if (ut.style === 'move') {
                chatHtml += `<div style="background: rgba(255, 255, 255, 0.1); padding: 5px; border: 1px dashed #888; margin-top: 5px; color: #ccc; font-style: italic; border-radius: 4px;"><b>MOVIMENTAÇÃO:</b> Reposicionamento executado.</div>`;
            }
        }
        // === DEFESA ===
        else if (actionData.type === 'defesa') {
            if (actionData.defense?.style === 'block' && targetUnit) {
                let gobbled = applyDamageGobble(targetUnit.id, setStats.w);
                
                chatHtml += `<div style="margin-top: 6px; color: #ffaa00; font-weight: bold; background: rgba(255,170,0,0.1); padding: 2px 5px; border-left: 2px solid #ffaa00;">>> ALVO (Ataque Quebrado): ${targetUnit.name}</div>
                             <div style="background: rgba(0, 136, 255, 0.1); padding: 5px; border: 1px solid #048; margin-top: 5px; color: #08f; border-radius: 4px;"><b>ESQUIVA / BLOQUEIO:</b> Anulou ${gobbled} dados do ataque inimigo!</div>`;
            }
        }

        chatHtml += `</div>`; // Fecha a div principal
        
        // Envia para o chat nativo do Foundry
        ChatMessage.create({ content: chatHtml });

        // Remove a ação que foi gasta
        consumeSet(sourceId, setStats.w, setStats.h);
    }

    // --- FUNÇÕES INTERNAS DE GOBBLE/QUEBRA ---
    function applyDamageGobble(unitId, amount) {
        if (amount <= 0) return 0;
        let cIndex = combatants.findIndex(c => c.id === unitId);
        if (cIndex === -1) return 0;

        let diceList = [...combatants[cIndex].rolledDice];
        diceList.sort((a, b) => b.val - a.val); // Remove os melhores primeiro (Regra ORE)

        let removed = 0;
        let newList = [];
        for (let d of diceList) {
            if (removed < amount && d.val > 0) removed++;
            else newList.push(d);
        }
        
        combatants[cIndex].rolledDice = newList;
        recalculateTimeline(); 
        return removed;
    }

    function consumeSet(cId, width, height) {
        const cIndex = combatants.findIndex(c => c.id === cId);
        let removed = 0;
        combatants[cIndex].rolledDice = combatants[cIndex].rolledDice.filter(d => {
            if (removed < width && d.val === height) { removed++; return false; }
            return true;
        });
        recalculateTimeline();
    }

    function endCombatRound() {
        dispatch('endCombat');
    }
</script>

<div class="resolution-root" in:fade>
    
    <TimelineView 
        {timeline} 
        {activeUnitId}
        targetingActive={targeting.active}
        {isGM} on:rowClicked={handleTimelineClick}
    />

    {#if activeUnitId}
        {@const activeUnit = combatants.find(c => c.id === activeUnitId)}
        {#if activeUnit}
            <CombatantTray 
                unit={activeUnit}
                {isGM}
                on:wiggleChanged={handleWiggle}
                on:triggerReaction={handleReaction}
                on:prepareExecute={handlePrepareExecute}
            />
        {/if}
    {/if}

    {#if isGM}
        <button class="end-turn-btn" on:click={endCombatRound}>
            <i class="fas fa-stop"></i> ENCERRAR RODADA (NOVO TURNO)
        </button>
    {/if}

</div>

<style>
    /* CSS DO CONTAINER PRINCIPAL E DO BOTÃO */
    .resolution-root { 
        display: flex; 
        height: 100%; 
        width: 100%; 
        background: #000; 
        font-family: 'Share Tech Mono', monospace; 
        position: relative; /* Isso é vital pro botão absolute funcionar! */
        overflow: hidden;
    }

    .end-turn-btn {
        position: absolute; 
        bottom: 20px; 
        right: 20px; 
        background: #4a0000; 
        color: #ff4444; 
        font-weight: bold; 
        font-family: 'Share Tech Mono', monospace;
        font-size: 12px;
        letter-spacing: 1px;
        padding: 12px 20px; 
        border: 1px solid #ff4444; 
        cursor: pointer; 
        z-index: 50;
        border-radius: 4px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.8);
        transition: all 0.3s;
    }

    .end-turn-btn:hover {
        background: #ff4444;
        color: #000;
        box-shadow: 0 0 20px #ff4444;
        transform: scale(1.05);
    }
</style>