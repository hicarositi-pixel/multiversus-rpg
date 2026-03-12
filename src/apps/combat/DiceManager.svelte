<script>
    import { createEventDispatcher } from 'svelte';
    export let rolledDice = [];
    export let unitId;

    const dispatch = createEventDispatcher();

    function updateWiggle(index, value) {
        dispatch('wiggleChanged', { unitId, index, value: parseInt(value) });
    }
</script>

<div class="dice-tray">
    <h3><i class="fas fa-dice-d20"></i> RESULTADO DA ROLAGEM ORE</h3>
    <div class="dice-grid">
        {#each rolledDice as die, i}
            <div class="die {die.type}" class:wiggle={die.val === 0}>
                {#if die.type === 'wd' && die.val === 0}
                    <select on:change={(e) => updateWiggle(i, e.target.value)}>
                        <option value="0">?</option>
                        {#each [1,2,3,4,5,6,7,8,9,10] as n}
                            <option value={n}>{n}</option>
                        {/each}
                    </select>
                {:else}
                    {die.val}
                {/if}
            </div>
        {/each}
        {#if rolledDice.length === 0}
            <div class="empty-tray">
                <i class="fas fa-ghost"></i> 
                <span>Sem dados restantes (Ação Quebrada ou Vazia).</span>
            </div>
        {/if}
    </div>
</div>

<style>
    .dice-tray h3 { margin: 0 0 10px 0; color: #888; font-size: 12px; border-bottom: 1px dashed #333; padding-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
    .dice-grid { display: flex; flex-wrap: wrap; gap: 8px; min-height: 45px; }
    
    .die { 
        width: 45px; height: 45px; background: #111; border: 2px solid #444; border-radius: 6px; 
        display: flex; justify-content: center; align-items: center; 
        font-size: 22px; font-weight: bold; color: #fff; 
        box-shadow: inset 0 0 10px rgba(0,0,0,0.8), 0 5px 10px rgba(0,0,0,0.5); 
        transition: 0.2s; font-family: 'Share Tech Mono', monospace;
    }
    
    .die.hd { border-color: #f33; color: #f33; background: #200; text-shadow: 0 0 5px rgba(255,0,0,0.5); }
    .die.wd { border-color: #fc0; background: #221a00; color: #fc0; text-shadow: 0 0 5px rgba(255,204,0,0.5); }
    .die.wiggle { animation: pulseWiggle 1.5s infinite alternate; cursor: pointer; }
    
    .die select { 
        width: 100%; height: 100%; background: transparent; border: none; color: #fc0; 
        font-weight: bold; text-align: center; font-size: 20px; outline: none; cursor: pointer; 
        -webkit-appearance: none; font-family: inherit;
    }
    .die select option { background: #000; color: #fc0; }
    
    .empty-tray { display: flex; align-items: center; gap: 8px; color: #555; font-size: 11px; font-style: italic; background: rgba(255,0,0,0.05); padding: 5px 10px; border: 1px dashed #500; border-radius: 4px; width: 100%; }

    @keyframes pulseWiggle { 
        from { box-shadow: inset 0 0 10px rgba(0,0,0,0.8), 0 0 5px #fc0; border-color: #aa8800; } 
        to { box-shadow: inset 0 0 10px rgba(0,0,0,0.8), 0 0 20px #fc0; border-color: #fc0; } 
    }
</style>