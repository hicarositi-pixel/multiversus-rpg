<script>
    import { ORE } from '../../../Logic/ORE.js';
    import { createEventDispatcher } from 'svelte';

    export let basePool = { d: 0, hd: 0, wd: 0 }; 
    export let manualOverride = false;
    export let buffPool = {}; // Recebe 'entity.pool'
    export let cost = 0;  
    export let disabled = false;

    // Pool final que o TerminalPanel vai ler para rolar
    export let finalCalculatedPool = { d: 0, hd: 0, wd: 0 };

    const dispatch = createEventDispatcher();

    // Garante integridade dos objetos de dados
    $: {
        if (!buffPool.reaction) buffPool.reaction = { d: 0, hd: 0, wd: 0, spray: 0, buff: 0 };
        if (typeof buffPool.spray === 'undefined') buffPool.spray = 0;
        if (typeof buffPool.buff === 'undefined') buffPool.buff = 0;
    }

    // =======================================================================
    // CÁLCULO REATIVO DA POOL FINAL
    // =======================================================================
    $: {
        // Sempre que qualquer valor mudar, recalculamos a pool final usando o ORE.js
        finalCalculatedPool = ORE.calculateFinalPool(
            // 1. DADOS DA AÇÃO (Se for AUTO, ele trava os campos, se for MANUAL, libera)
            { 
                d: basePool.d || 0, 
                hd: basePool.hd || 0, 
                wd: basePool.wd || 0, 
                spray: buffPool.spray || 0 
            },
            // 2. DADOS DE REAÇÃO
            { 
                d: (buffPool.reaction.d || 0) + (buffPool.reaction.buff || 0), 
                hd: buffPool.reaction.hd || 0, 
                wd: buffPool.reaction.wd || 0, 
                spray: buffPool.reaction.spray || 0 
            },
            // 3. MODIFICADORES (Buffs externos e penalidade de custo/manobra)
            { 
                buffers: buffPool.buff || 0, 
                debuffs: cost || 0 
            }
        );
    }
</script>

<div class="pool-builder" class:disabled>
    <div class="builder-matrix">
        
        <div class="b-row" class:manual-mode={manualOverride}>
            <div class="row-tag action-tag">AÇÃO</div>
            
            <div class="dice-col" class:auto-locked={!manualOverride}>
                <label>{manualOverride ? 'NORMAL' : 'AUTO (D)'}</label>
                <input type="number" min="0" bind:value={basePool.d} disabled={!manualOverride || disabled}>
            </div>

            <div class="dice-col" class:auto-locked={!manualOverride}>
                <label class="c-hd">HARD (HD)</label>
                <input type="number" min="0" class="inp-hd" bind:value={basePool.hd} disabled={!manualOverride || disabled}>
            </div>

            <div class="dice-col" class:auto-locked={!manualOverride}>
                <label class="c-wd">WIGGLE (WD)</label>
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
            <div class="b-row reaction-row">
                <div class="row-tag react-tag">REAÇÃO</div>
                
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

    <div class="final-pool">
        <div class="cost-alert" class:danger={cost > 0}>
            <span>CUSTO TÁTICO</span>
            <strong>-{cost} D</strong>
        </div>
        
        <div class="calc-divider"><i class="fas fa-equals"></i></div>

        <div class="result-box">
            <span class="r-label">POOL FINAL <i class="fas fa-dice"></i></span>
            <div class="r-dice">
                <span class="d-val" title="Dados Normais">{finalCalculatedPool.d}d</span>
                <span class="d-val c-hd" title="Hard Dice">{finalCalculatedPool.hd}h</span>
                <span class="d-val c-wd" title="Wiggle Dice">{finalCalculatedPool.wd}w</span>
            </div>
        </div>
    </div>
</div>

<style>
    .pool-builder { 
        display: flex; background: #050505; border: 1px solid #333; 
        border-radius: 6px; overflow: hidden; font-family: 'Share Tech Mono', monospace; 
        box-shadow: 0 4px 15px rgba(0,0,0,0.5);
    }
    .pool-builder.disabled { opacity: 0.6; pointer-events: none; filter: grayscale(0.5); }

    .builder-matrix { display: flex; flex-direction: column; flex: 1; }
    
    .b-row { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: rgba(255,255,255,0.02); border-bottom: 1px solid #1a1a1a; transition: 0.2s; }
    .b-row.manual-mode { background: rgba(0, 255, 65, 0.03); }
    .reaction-row { background: rgba(0, 170, 255, 0.05); border-bottom: none; }
    
    .row-tag { font-size: 10px; font-weight: bold; padding: 4px; border-radius: 2px; width: 45px; text-align: center; writing-mode: vertical-rl; transform: rotate(180deg); height: 50px; display: flex; justify-content: center; align-items: center; letter-spacing: 2px; }
    .action-tag { background: var(--c-primary); color: #000; }
    .react-tag { background: #00aaff; color: #000; }

    .separator { width: 1px; height: 35px; border-left: 1px dashed #444; margin: 0 5px; }

    .dice-col { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }
    .dice-col label { font-size: 8px; font-weight: bold; color: #666; white-space: nowrap; text-transform: uppercase; }
    .dice-col input { width: 100%; max-width: 42px; background: #000; border: 1px solid #444; color: #fff; text-align: center; font-size: 16px; font-weight: bold; padding: 4px 0; border-radius: 4px; transition: 0.2s; outline: none; }
    .dice-col input:focus { border-color: var(--c-primary); box-shadow: 0 0 10px rgba(0,255,65,0.2); }
    .dice-col input:disabled { opacity: 0.4; cursor: not-allowed; border-style: dotted; }
    
    /* Quando o modo é automático, os campos ficam visualmente travados */
    .auto-locked label { color: #444; }
    .auto-locked input { background: rgba(255,255,255,0.02); color: #888; }

    .c-hd { color: #ff4444 !important; } 
    .inp-hd { border-color: #500 !important; color: #ff4444 !important; }
    .c-wd { color: #ffaa00 !important; } 
    .inp-wd { border-color: #540 !important; color: #ffaa00 !important; }
    .c-spray { color: #a855f7 !important; } 
    .inp-spray { border-color: #4c1d95 !important; color: #a855f7 !important; }
    .c-buff { color: #00aaff !important; } 
    .inp-buff { border-color: #004488 !important; color: #00aaff !important; }

    /* PAINEL FINAL */
    .final-pool { display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 10px 20px; background: #000; border-left: 2px solid #222; min-width: 150px; gap: 8px; }
    
    .cost-alert { display: flex; flex-direction: column; align-items: center; }
    .cost-alert span { font-size: 8px; color: #555; font-weight: bold; }
    .cost-alert strong { font-size: 14px; color: #444; margin-top: 2px; transition: 0.3s; }
    .cost-alert.danger strong { color: #f33; text-shadow: 0 0 10px rgba(255,0,0,0.5); }
    
    .calc-divider { color: #333; font-size: 12px; }

    .result-box { display: flex; flex-direction: column; align-items: center; width: 100%; }
    .r-label { font-size: 9px; font-weight: bold; color: var(--c-primary); margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
    .r-dice { display: flex; gap: 8px; font-size: 18px; font-weight: bold; color: #fff; background: #0a0a0a; padding: 8px 12px; border: 1px solid #333; border-top: 2px solid var(--c-primary); border-radius: 4px; width: 100%; justify-content: center; box-shadow: 0 5px 15px rgba(0,0,0,0.5); }

    .d-val { position: relative; }
    .d-val:not(:last-child)::after { content: ''; position: absolute; right: -5px; top: 20%; height: 60%; width: 1px; background: #222; }
</style>