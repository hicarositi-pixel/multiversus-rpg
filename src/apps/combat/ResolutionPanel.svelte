<script>
import { onMount, onDestroy, createEventDispatcher } from 'svelte';
    import { fade } from 'svelte/transition';
    import { CombatEffect } from '../../../Logic/CombatEffect.js';
    import { CombatManager, resolutionCombatants, timelineEvents } from '../../../Logic/CombatManager.js';

    import TimelineView from './TimelineView.svelte';
    import CombatantTray from './CombatantTray.svelte';

    export let combatantsData = []; 
    export let isGM = false;
    const MODULE_ID = "multiversus-rpg";
    const dispatch = createEventDispatcher();

    let activeUnitId = null;
    let targeting = { active: false, sourceId: null, setIndex: null, setStats: null, actionData: null };
    
    let hookIdRes; // Variável para destruir o ouvinte depois

    // Auto-Seleciona o combatente correto ao carregar ou mudar a fila
    $: if ($timelineEvents && $timelineEvents.length > 0 && !activeUnitId) {
        if (isGM) {
            activeUnitId = $timelineEvents[0].actorId;
        } else {
            const myCombatant = $resolutionCombatants.find(c => c.actorId === game.user.character?.id);
            activeUnitId = myCombatant ? myCombatant.id : $timelineEvents[0].actorId;
        }
    }

    onMount(() => {
        if (isGM) {
            // GM inicia a rolagem
            if (!CombatManager.loadStateFromFlags()) {
                CombatManager.initResolution(combatantsData);
            }
        } else {
            // Jogador tenta puxar os dados
            CombatManager.loadStateFromFlags();
        }

        // =======================================================
        // REDE DE SEGURANÇA: Salvação da Tela Preta do Jogador
        // =======================================================
        hookIdRes = Hooks.on("updateScene", (scene, data) => {
            if (!isGM) {
                // Se o Mestre acabou de salvar o resultado das rolagens na Cena, o Jogador puxa na hora!
                const hasNewResolutionData = data.flags?.[MODULE_ID]?.resolutionState;
                const hasNewRevealedSets = data.flags?.[MODULE_ID]?.revealedSets;
                
                if (hasNewResolutionData || hasNewRevealedSets) {
                    CombatManager.loadStateFromFlags();
                }
            }
        });
    });

    onDestroy(() => {
        // Limpa o ouvinte se a janela fechar
        if (hookIdRes) Hooks.off("updateScene", hookIdRes);
    });

    // ... (o resto das suas funções handleWiggle, handlePrepareExecute continuam normais)

    function handleWiggle(e) {
        const { unitId, index, value } = e.detail;
        CombatManager.setWiggleDie(unitId, index, value);
    }

    function handleReaction(e) {
        CombatManager.triggerReaction(e.detail);
        ui.notifications.warn(`[ PROTOCOLO DE REAÇÃO ] Defesa de emergência ativada!`);
    }

    function handlePrepareExecute(e) {
        const { unitId, setIndex, setStats, actionData } = e.detail;
        
        // Ações que não exigem alvo (Ex: Mover ou Cura em si mesmo sem especificar)
        if (actionData.type === 'utilidade' && actionData.utility?.style === 'move') {
            executeAction(unitId, null, setStats, actionData);
            return;
        }
        
        targeting = { active: true, sourceId: unitId, setIndex, setStats, actionData };
        ui.notifications.info("SISTEMA DE MIRA ATIVADO: Clique no alvo desejado na Timeline à esquerda.");
    }

    function handleTimelineClick(e) {
        const targetItem = e.detail;
        if (targeting.active) {
            executeAction(targeting.sourceId, targetItem.actorId, targeting.setStats, targeting.actionData);
            targeting = { active: false }; // Desliga a mira após o tiro
        } else {
            activeUnitId = targetItem.actorId; // Apenas muda a visualização da bandeja
        }
    }

    // =========================================================================
    // MOTOR DE EXECUÇÃO CENTRAL E GERAÇÃO DE LOGS TÁTICOS (CHAT AAA)
    // =========================================================================
    async function executeAction(sourceId, targetId, setStats, actionData) {
        const combatants = $resolutionCombatants;
        const sourceUnit = combatants.find(c => c.id === sourceId);
        const targetUnit = targetId ? combatants.find(c => c.id === targetId) : null;
        const targetActor = targetUnit ? game.actors.get(targetUnit.actorId) : null;

        // Estética do Log
        let borderColor = actionData.type === 'ataque' ? '#f33' : actionData.type === 'defesa' ? '#08f' : '#00ff41';
        let bgHeader = actionData.type === 'ataque' ? 'rgba(255,0,0,0.1)' : actionData.type === 'defesa' ? 'rgba(0,136,255,0.1)' : 'rgba(0,255,65,0.1)';
        
        let chatHtml = `
            <div style="background: #07070a; border: 1px solid #222; border-left: 4px solid ${borderColor}; border-radius: 4px; font-family: 'Share Tech Mono', monospace; font-size: 12px; color: #ccc; box-shadow: 0 4px 10px rgba(0,0,0,0.8); overflow: hidden;">
                <div style="background: ${bgHeader}; padding: 6px 10px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;">
                    <strong style="color: ${borderColor}; letter-spacing: 1px; font-size: 14px; text-shadow: 0 0 5px ${borderColor};">[ ${actionData.type.toUpperCase()} EXECUTADO ]</strong>
                    <span style="color: #fff; background: #000; padding: 2px 6px; border: 1px solid #444; border-radius: 4px; font-weight: bold; font-size: 14px;">${setStats.w}x${setStats.h}</span>
                </div>
                <div style="padding: 10px; display: flex; flex-direction: column; gap: 8px;">
                    <div><span style="color: #888;">ORIGEM:</span> <b style="color: #fff;">${sourceUnit.name}</b></div>
        `;

        // Verifica Mutações
        if (actionData.maneuvers && actionData.maneuvers.length > 0) {
            chatHtml += `<div><span style="color: #00aaff;"><i class="fas fa-dna"></i> MUTAÇÕES ATIVAS:</span> <b style="color: #fff;">${actionData.maneuvers.join(', ').toUpperCase()}</b></div>`;
        }

        // ================= ATAQUE =================
        if (actionData.type === 'ataque') {
            chatHtml += `<div style="background: #111; padding: 6px; border-left: 2px solid #ffaa00; color: #ffaa00; font-weight: bold;">>> ALVO: ${targetUnit?.name || 'DESCONHECIDO'}</div>`;
            
            const hitLoc = actionData.tactics?.calledShot ? actionData.tactics.targetLocation : setStats.h;
            let rawShock = setStats.w + (actionData.weapon?.dmg || 0);
            
            chatHtml += `<div><span style="color: #888;">BALÍSTICA:</span> Dano Base <b>${rawShock}</b> | Pen. <b>${actionData.weapon?.pen || 0}</b></div>`;

            if (targetActor) {
                let limbs = targetActor.getFlag(MODULE_ID, 'limbs_base') || [];
                let limbIdx = limbs.findIndex(l => l.id == hitLoc);
                if (limbIdx === -1) limbIdx = 0; 
                let limb = limbs[limbIdx];

                if (limb) {
                    const mResult = CombatEffect.processManeuvers({ width: setStats.w, height: hitLoc, rawShock, rawKill: 0, pen: actionData.weapon?.pen || 0 }, actionData.maneuvers || []);
                    let sFinal = mResult.finalDamage.shock;
                    
                    limb.shock = (limb.shock || 0) + sFinal;
                    limbs[limbIdx] = limb;
                    await targetActor.update({ [`flags.${MODULE_ID}.limbs_base`]: limbs }, { render: false });

                    let gobbled = CombatManager.applyDamageGobble(targetUnit.id, sFinal);

                    chatHtml += `
                        <div style="background: rgba(255,0,0,0.1); border: 1px solid #500; padding: 8px; border-radius: 4px; margin-top: 4px;">
                            <div style="color: #fff; margin-bottom: 4px;"><b>LOCAL ATINGIDO:</b> ${limb.name || `Área ${hitLoc}`}</div>
                            <div style="font-size: 14px;"><b>DANO SOFRIDO:</b> <span style="color: #fc0; text-shadow: 0 0 5px #fc0;">${sFinal} CHOQUE</span></div>
                            ${gobbled > 0 ? `<div style="margin-top: 6px; background: #200; color: #ffaa00; padding: 4px; border-radius: 2px; border-left: 2px solid #ffaa00;"><b>[ INTERRUPÇÃO ]</b> O alvo perdeu <b>${gobbled}</b> dados da sua melhor ação!</div>` : ''}
                        </div>
                    `;
                }
            }
        }
        // ================= UTILIDADE =================
        else if (actionData.type === 'utilidade') {
            if (actionData.utility.style === 'move') {
                chatHtml += `<div style="color: #00ff41; background: rgba(0,255,65,0.1); padding: 8px; border-radius: 4px; border: 1px dashed #00ff41;"><i class="fas fa-running"></i> <b>MOVIMENTAÇÃO:</b> Reposicionamento tático executado com sucesso.</div>`;
            }
            else if (actionData.utility.style === 'heal') {
                const healAmt = setStats.w + (actionData.utility.skillBonus || 0);
                chatHtml += `<div style="color: #00ff41; background: rgba(0,255,65,0.1); padding: 8px; border-radius: 4px; border: 1px solid #00ff41;"><i class="fas fa-heartbeat"></i> <b>CURA TÁTICA:</b> Restaurou <b>${healAmt}</b> Pontos de Vida.</div>`;
            }
            else if (actionData.utility.style === 'buff') {
                chatHtml += `<div style="color: #08f; background: rgba(0,136,255,0.1); padding: 8px; border-radius: 4px; border: 1px solid #08f;"><i class="fas fa-arrow-up"></i> <b>SUPORTE:</b> Bônus de +${actionData.utility.buff?.amount || 1}D aplicado ao alvo.</div>`;
            }
            else if (actionData.utility.style === 'debuff') {
                chatHtml += `<div style="color: #a855f7; background: rgba(168,85,247,0.1); padding: 8px; border-radius: 4px; border: 1px solid #a855f7;"><i class="fas fa-arrow-down"></i> <b>SABOTAGEM:</b> Penalidade de -${actionData.utility.debuff?.amount || 1}D aplicada ao inimigo.</div>`;
            }
        }
        // ================= DEFESA =================
        else if (actionData.type === 'defesa') {
            chatHtml += `<div style="color: #08f; background: rgba(0,136,255,0.1); padding: 8px; border-radius: 4px; border: 1px dashed #08f;"><i class="fas fa-shield-alt"></i> <b>DEFESA TÁTICA:</b> Estruturas de contenção e esquiva ativadas.</div>`;
        }

        if (actionData.desc) {
            chatHtml += `<div style="color: #888; font-style: italic; border-left: 2px solid #444; padding-left: 8px; margin-top: 4px;">"${actionData.desc}"</div>`;
        }

        chatHtml += `</div></div>`; // Fecha os divs
        
        // Publica no Foundry
        ChatMessage.create({ content: chatHtml });

        // Consome o dado usado da bandeja e espalha a atualização via servidor
        CombatManager.consumeSet(sourceId, setStats.w, setStats.h);
    }
</script>

<div class="resolution-root" in:fade>
    <div class="bg-grid"></div>
    
    <TimelineView 
        timeline={$timelineEvents} 
        {activeUnitId}
        targetingActive={targeting.active}
        {isGM} 
        on:rowClicked={handleTimelineClick}
        on:reveal={(e) => CombatManager.revealSet(e.detail)} 
    />

    {#if activeUnitId}
        {@const activeUnit = $resolutionCombatants.find(c => c.id === activeUnitId)}
        {#if activeUnit}
            {@const isOwner = isGM || activeUnit.actorId === game.user.character?.id}
            
            <CombatantTray 
                unit={activeUnit}
                {isGM}
                {isOwner}
                on:wiggleChanged={handleWiggle}
                on:triggerReaction={handleReaction}
                on:prepareExecute={handlePrepareExecute}
            />
        {/if}
    {/if}

    {#if isGM}
        <button class="end-turn-btn" on:click={() => dispatch('endCombat')}>
            <i class="fas fa-power-off"></i> ENCERRAR RODADA (NOVO TURNO)
        </button>
    {/if}
</div>

<style>
    .resolution-root { 
        display: flex; height: 100%; width: 100%; background: #050508; 
        font-family: 'Share Tech Mono', monospace; position: relative; overflow: hidden; 
    }
    
    .bg-grid { 
        position: absolute; inset: 0; pointer-events: none; opacity: 0.03; 
        background-image: linear-gradient(var(--c-primary, #00ff41) 1px, transparent 1px), linear-gradient(90deg, var(--c-primary, #00ff41) 1px, transparent 1px); 
        background-size: 20px 20px; z-index: 0; 
    }

    .end-turn-btn { 
        position: absolute; bottom: 20px; right: 20px; background: #2a0000; color: #ff4444; 
        font-weight: bold; font-family: inherit; font-size: 13px; letter-spacing: 1px; 
        padding: 15px 25px; border: 1px solid #ff4444; cursor: pointer; z-index: 50; 
        border-radius: 4px; box-shadow: 0 5px 15px rgba(0,0,0,0.8); transition: all 0.3s; 
        display: flex; align-items: center; gap: 8px; text-transform: uppercase;
    }
    .end-turn-btn:hover { 
        background: #ff4444; color: #000; box-shadow: 0 0 25px #ff4444; transform: scale(1.05); 
    }
</style>