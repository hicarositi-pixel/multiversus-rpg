<script>
    import { createEventDispatcher } from 'svelte';
    import DiceManager from './DiceManager.svelte';
    import ActionExecutor from './ActionExecutor.svelte';

    export let unit;
    export let isGM = false;
    
    const dispatch = createEventDispatcher();
</script>

<div class="hud-panel">
    <div class="hud-header">
        <img src={unit.img} alt="P"/>
        <div class="h-info">
            <h2>{unit.name}</h2>
            <span>GERENCIAMENTO DE DADOS TÁTICOS</span>
        </div>
        {#if isGM && !unit.reactionUsed}
            <button class="react-btn" on:click={() => dispatch('triggerReaction', unit.id)}>
                <i class="fas fa-bolt"></i> REAÇÃO ORE
            </button>
        {/if}
    </div>

    <div class="hud-body custom-scroll">
        <DiceManager 
            unitId={unit.id} 
            rolledDice={unit.rolledDice} 
            on:wiggleChanged 
        />
        
        <div style="height: 20px;"></div> <ActionExecutor 
            unitId={unit.id} 
            currentSets={unit.currentSets} 
            actions={unit.actions} 
            on:prepareExecute 
        />
    </div>
</div>

<style>
    .hud-panel { flex: 1; display: flex; flex-direction: column; background: radial-gradient(circle at center, #0a0a0f 0%, #030305 100%); height: 100%; overflow: hidden; }
    .hud-header { display: flex; gap: 15px; padding: 20px; background: rgba(255,255,255,0.02); border-bottom: 1px solid var(--c-primary, #00ff41); align-items: center; }
    .hud-header img { width: 60px; height: 60px; border-radius: 6px; border: 2px solid var(--c-primary, #00ff41); object-fit: cover; }
    .h-info h2 { margin: 0; color: #fff; text-transform: uppercase; }
    .h-info span { font-size: 10px; color: var(--c-primary, #00ff41); }
    
    .react-btn { margin-left: auto; background: #420; border: 1px solid #f00; color: #f55; padding: 8px 12px; cursor: pointer; font-weight: bold; border-radius: 4px; transition: 0.2s; }
    .react-btn:hover { background: #f00; color: #000; box-shadow: 0 0 15px #f00; }

    .hud-body { padding: 20px; overflow-y: auto; display: flex; flex-direction: column; }
    .custom-scroll::-webkit-scrollbar { width: 4px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #444; border-radius: 2px; }
</style>