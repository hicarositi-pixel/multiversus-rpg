<script>
    import { createEventDispatcher } from 'svelte';
    import DiceManager from './DiceManager.svelte';
    import ActionExecutor from './ActionExecutor.svelte';
    import { CombatManager } from '../../../Logic/CombatManager.js';

    export let unit;
    export let isGM = false;
    export let isOwner = false; 
    
    const dispatch = createEventDispatcher();

    // LÓGICA DE REAÇÃO: Verifica se o jogador separou dados para isso na Fase 1
    $: hasReaction = unit.pool?.reaction && (unit.pool.reaction.d > 0 || unit.pool.reaction.hd > 0 || unit.pool.reaction.wd > 0 || unit.pool.reaction.spray > 0 || unit.pool.reaction.buff > 0);

</script>

<div class="hud-panel">
    
    <div class="hud-header">
        <img src={unit.img} alt="P"/>
        <div class="h-info">
            <h2>{unit.name}</h2>
            <span class="subtitle">GERENCIAMENTO DE DADOS TÁTICOS</span>
        </div>
        
        <div class="reaction-module">
            {#if hasReaction}
                {#if !unit.reactionUsed}
                    <button class="react-btn" disabled={!isOwner} on:click={() => dispatch('triggerReaction', unit.id)} title={isOwner ? "Ativar Defesa de Emergência" : "Apenas o dono pode ativar"}>
                        <i class="fas fa-bolt"></i> REAÇÃO ORE
                    </button>
                {:else}
                    <div class="react-status used"><i class="fas fa-shield-alt"></i> REAÇÃO ESGOTADA</div>
                {/if}
            {:else}
                <div class="react-status empty"><i class="fas fa-ban"></i> SEM REAÇÃO ALOCADA</div>
            {/if}
        </div>
    </div>

    <div class="hud-body custom-scroll">
        
        {#if isOwner}
            <div class="tactical-plan">
                <div class="tp-header"><i class="fas fa-clipboard-list"></i> SEU PLANO DE AÇÃO DECLARADO:</div>
                <div class="tp-content">
                    {@html CombatManager.generateDetailedSummary(unit)}
                </div>
            </div>
        {:else}
            <div class="tactical-plan encrypted">
                <i class="fas fa-lock"></i> 
                <span>VETORES INIMIGOS CRIPTOGRAFADOS<br><small>Intenções táticas ocultas para evitar metagame.</small></span>
            </div>
        {/if}

        <div class="section-divider"><i class="fas fa-angle-double-down"></i></div>

        <DiceManager 
            unitId={unit.id} 
            rolledDice={unit.rolledDice} 
            {isOwner}
            on:wiggleChanged 
        />
        
        <div class="section-divider"><i class="fas fa-angle-double-down"></i></div>

        <ActionExecutor 
            unitId={unit.id} 
            currentSets={unit.currentSets} 
            actions={unit.actions} 
            {isOwner}
            on:prepareExecute 
        />
    </div>
</div>

<style>
    .hud-panel { flex: 1; display: flex; flex-direction: column; background: radial-gradient(circle at center, #0a0a0f 0%, #030305 100%); height: 100%; overflow: hidden; font-family: 'Share Tech Mono', monospace; }
    
    .hud-header { display: flex; gap: 15px; padding: 15px 20px; background: rgba(255,255,255,0.02); border-bottom: 2px solid var(--c-primary, #00ff41); align-items: center; box-shadow: 0 5px 15px rgba(0,0,0,0.5); z-index: 10; }
    .hud-header img { width: 50px; height: 50px; border-radius: 6px; border: 2px solid var(--c-primary, #00ff41); object-fit: cover; }
    .h-info h2 { margin: 0; color: #fff; text-transform: uppercase; font-size: 18px; text-shadow: 0 0 5px rgba(255,255,255,0.3); }
    .h-info .subtitle { font-size: 10px; color: var(--c-primary, #00ff41); letter-spacing: 1px; font-weight: bold; }
    
    /* MÓDULO DE REAÇÃO */
    .reaction-module { margin-left: auto; }
    .react-btn { background: #4a0000; border: 1px solid #ff4444; color: #ff4444; padding: 10px 15px; cursor: pointer; font-weight: bold; font-family: inherit; font-size: 12px; border-radius: 4px; transition: 0.3s; display: flex; align-items: center; gap: 6px; letter-spacing: 1px; }
    .react-btn:hover:not(:disabled) { background: #ff4444; color: #000; box-shadow: 0 0 15px #ff4444; transform: scale(1.05); }
    .react-btn:disabled { opacity: 0.5; cursor: not-allowed; border-style: dashed; }
    
    .react-status { padding: 8px 12px; font-size: 10px; font-weight: bold; border-radius: 4px; display: flex; align-items: center; gap: 6px; border: 1px dashed transparent; }
    .react-status.used { color: #888; border-color: #555; background: rgba(255,255,255,0.05); }
    .react-status.empty { color: #555; border-color: #333; background: rgba(0,0,0,0.5); font-style: italic; }

    /* CORPO DA BANDEJA */
    .hud-body { padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
    
    /* RESUMO DO PLANO */
    .tactical-plan { background: #050508; border: 1px solid #333; border-left: 3px solid #00aaff; border-radius: 4px; padding: 12px; box-shadow: inset 0 0 10px rgba(0,0,0,0.5); }
    .tp-header { font-size: 11px; color: #00aaff; font-weight: bold; margin-bottom: 10px; border-bottom: 1px dashed #222; padding-bottom: 5px; display: flex; align-items: center; gap: 6px; letter-spacing: 1px; }
    .tp-content { display: flex; flex-direction: column; gap: 8px; }
    
    .tactical-plan.encrypted { border-left-color: #555; display: flex; align-items: center; gap: 15px; color: #666; padding: 20px; justify-content: center; text-align: center; }
    .tactical-plan.encrypted i { font-size: 24px; color: #555; }
    .tactical-plan.encrypted span { font-size: 12px; font-weight: bold; }

    .section-divider { display: flex; justify-content: center; color: #333; font-size: 16px; margin: 5px 0; }

    .custom-scroll::-webkit-scrollbar { width: 6px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
    .custom-scroll::-webkit-scrollbar-thumb:hover { background: var(--c-primary, #00ff41); }
</style>