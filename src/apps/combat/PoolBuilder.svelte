<script>
    import { ORE } from '../../../Logic/ORE.js';
    import { createEventDispatcher } from 'svelte';

    export let basePool = { d: 0, hd: 0, wd: 0 }; 
    export let manualOverride = false;
    export let buffPool = {}; 
    export let cost = 0;  
    export let disabled = false;

    export let finalCalculatedPool = { d: 0, hd: 0, wd: 0 };
    const dispatch = createEventDispatcher();

    $: {
        if (!buffPool.reaction) buffPool.reaction = { d: 0, hd: 0, wd: 0, spray: 0, buff: 0 };
        if (typeof buffPool.spray === 'undefined') buffPool.spray = 0;
        if (typeof buffPool.buff === 'undefined') buffPool.buff = 0;
    }

    $: {
        finalCalculatedPool = ORE.calculateFinalPool(
            { d: basePool.d || 0, hd: basePool.hd || 0, wd: basePool.wd || 0, spray: buffPool.spray || 0 },
            { d: (buffPool.reaction.d || 0) + (buffPool.reaction.buff || 0), hd: buffPool.reaction.hd || 0, wd: buffPool.reaction.wd || 0, spray: buffPool.reaction.spray || 0 },
            { buffers: buffPool.buff || 0, debuffs: cost || 0 }
        );
    }
</script>

<div class="pool-builder" class:disabled>
    
    <div class="builder-matrix">
        
        <div class="b-block action-block" class:manual-mode={manualOverride}>
            <div class="block-label">AÇÃO BASE</div>
            <div class="dice-col" class:auto-locked={!manualOverride}>
                <label>{manualOverride ? 'NORMAL' : 'AUTO (D)'}</label>
                <input type="number" min="0" bind:value={basePool.d} disabled={!manualOverride || disabled}>
            </div>
            <div class="dice-col" class:auto-locked={!manualOverride}>
                <label class="c-hd">HARD (H)</label>
                <input type="number" min="0" class="inp-hd" bind:value={basePool.hd} disabled={!manualOverride || disabled}>
            </div>
            <div class="dice-col" class:auto-locked={!manualOverride}>
                <label class="c-wd">WIGGLE (W)</label>
                <input type="number" min="0" class="inp-wd" bind:value={basePool.wd} disabled={!manualOverride || disabled}>
            </div>
            <div class="separator"></div>
            <div class="dice-col">
                <label class="c-spray">SPRAY</label>
                <input type="number" min="0" class="inp-spray" bind:value={buffPool.spray} {disabled}>
            </div>
            <div class="dice-col">
                <label class="c-buff">BUFF (+D)</label>
                <input type="number" min="0" class="inp-buff" bind:value={buffPool.buff} {disabled}>
            </div>
        </div>

        {#if buffPool.reaction}
            <div class="b-block react-block">
                <div class="block-label">REAÇÃO</div>
                <div class="dice-col">
                    <label>NORMAL</label>
                    <input type="number" min="0" bind:value={buffPool.reaction.d} {disabled}>
                </div>
                <div class="dice-col">
                    <label class="c-hd">HARD</label>
                    <input type="number" min="0" class="inp-hd" bind:value={buffPool.reaction.hd} {disabled}>
                </div>
                <div class="dice-col">
                    <label class="c-wd">WIGGLE</label>
                    <input type="number" min="0" class="inp-wd" bind:value={buffPool.reaction.wd} {disabled}>
                </div>
                <div class="separator"></div>
                <div class="dice-col">
                    <label class="c-spray">R. SPRAY</label>
                    <input type="number" min="0" class="inp-spray" bind:value={buffPool.reaction.spray} {disabled}>
                </div>
                <div class="dice-col">
                    <label class="c-buff">R. BUFF</label>
                    <input type="number" min="0" class="inp-buff" bind:value={buffPool.reaction.buff} {disabled}>
                </div>
            </div>
        {/if}
    </div>

    <div class="final-pool-panel">
        <div class="cost-alert" class:danger={cost > 0}>
            <span>CUSTO TÁTICO</span>
            <strong>-{cost} D</strong>
        </div>
        
        <div class="calc-divider"><i class="fas fa-arrow-right"></i></div>

        <div class="result-box">
            <span class="r-label">POOL TOTAL <i class="fas fa-dice"></i></span>
            <div class="r-dice-grid">
                <div class="d-val" title="Dados Normais"><span>{finalCalculatedPool.d}</span><small>D</small></div>
                <div class="d-val c-hd" title="Hard Dice"><span>{finalCalculatedPool.hd}</span><small>H</small></div>
                <div class="d-val c-wd" title="Wiggle Dice"><span>{finalCalculatedPool.wd}</span><small>W</small></div>
            </div>
        </div>
    </div>
</div>

<style>
    .pool-builder { 
        display: flex; flex-wrap: wrap; background: #000; border: 1px solid #333; 
        border-radius: 6px; overflow: hidden; font-family: 'Share Tech Mono', monospace; 
        box-shadow: 0 10px 20px rgba(0,0,0,0.8);
    }
    .pool-builder.disabled { opacity: 0.6; pointer-events: none; filter: grayscale(0.5); }

    /* Lado Esquerdo (Inputs) */
    .builder-matrix { display: flex; flex-wrap: wrap; flex: 1; }
    
    .b-block { display: flex; align-items: center; gap: 8px; padding: 8px 12px; flex-grow: 1; transition: 0.2s; position: relative; }
    .action-block { background: rgba(255,255,255,0.02); border-bottom: 1px solid #1a1a1a; border-right: 1px dashed #333; }
    .action-block.manual-mode { background: rgba(0, 255, 65, 0.03); }
    .react-block { background: rgba(0, 170, 255, 0.05); }
    
    .block-label { font-size: 8px; font-weight: bold; color: #555; position: absolute; top: 2px; left: 4px; letter-spacing: 1px; }

    .separator { width: 1px; height: 35px; border-left: 1px dashed #444; margin: 0 2px; }

    .dice-col { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; margin-top: 8px; }
    .dice-col label { font-size: 8px; font-weight: bold; color: #666; white-space: nowrap; text-transform: uppercase; }
    
    .dice-col input { width: 100%; max-width: 45px; background: #0a0a0f; border: 1px solid #444; color: #fff; text-align: center; font-size: 16px; font-weight: bold; padding: 6px 0; border-radius: 4px; transition: 0.2s; outline: none; box-shadow: inset 0 2px 5px rgba(0,0,0,0.5); }
    .dice-col input:focus { border-color: var(--c-primary, #00ff41); box-shadow: inset 0 0 10px rgba(0,255,65,0.3); }
    .dice-col input:disabled { opacity: 0.5; cursor: not-allowed; border-style: dotted; }
    
    .auto-locked label { color: #444; }
    .auto-locked input { background: transparent; color: #888; border-color: #222; }

    .c-hd { color: #ff4444 !important; } .inp-hd { border-color: #500 !important; color: #ff4444 !important; background: rgba(255,0,0,0.05) !important; }
    .c-wd { color: #ffaa00 !important; } .inp-wd { border-color: #540 !important; color: #ffaa00 !important; background: rgba(255,170,0,0.05) !important; }
    .c-spray { color: #a855f7 !important; } .inp-spray { border-color: #4c1d95 !important; color: #a855f7 !important; }
    .c-buff { color: #00aaff !important; } .inp-buff { border-color: #004488 !important; color: #00aaff !important; }

    /* Lado Direito (Resultado Final) */
    .final-pool-panel { display: flex; justify-content: center; align-items: center; padding: 15px 25px; background: #050508; border-left: 2px solid var(--c-primary, #00ff41); gap: 15px; flex-grow: 1; }
    
    .cost-alert { display: flex; flex-direction: column; align-items: center; }
    .cost-alert span { font-size: 8px; color: #555; font-weight: bold; letter-spacing: 1px; }
    .cost-alert strong { font-size: 16px; color: #444; margin-top: 2px; transition: 0.3s; background: #000; padding: 4px 10px; border-radius: 4px; border: 1px solid #222; }
    .cost-alert.danger strong { color: #f33; border-color: #500; text-shadow: 0 0 10px rgba(255,0,0,0.5); box-shadow: inset 0 0 10px rgba(255,0,0,0.2); }
    
    .calc-divider { color: var(--c-primary, #00ff41); font-size: 16px; opacity: 0.5; }

    .result-box { display: flex; flex-direction: column; align-items: center; }
    .r-label { font-size: 9px; font-weight: bold; color: var(--c-primary, #00ff41); margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
    
    .r-dice-grid { display: flex; gap: 8px; background: #111; padding: 8px 15px; border: 1px solid #333; border-top: 2px solid var(--c-primary, #00ff41); border-radius: 6px; box-shadow: 0 5px 15px rgba(0,0,0,0.8); }
    .d-val { display: flex; align-items: baseline; gap: 2px; font-size: 24px; font-weight: bold; color: #fff; text-shadow: 0 2px 5px #000; }
    .d-val small { font-size: 10px; color: #666; font-weight: normal; }
</style>