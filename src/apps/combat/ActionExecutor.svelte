<script>
    import { createEventDispatcher } from 'svelte';
    export let unitId;
    export let currentSets = [];
    export let actions = [];
    
    const dispatch = createEventDispatcher();
</script>

<div class="sets-tray">
    <h3><i class="fas fa-crosshairs"></i> VETORES ALOCADOS (AÇÕES DISPONÍVEIS)</h3>
    <div class="sets-list">
        {#each currentSets as s, i}
            {@const act = actions[i] || { type: 'utilidade', utility: { style: 'move' }, desc: 'Ação Improvisada' }}
            
            <div class="set-card {act.type}">
                <div class="set-badge">{s.w}<span class="x">x</span>{s.h}</div>
                
                <div class="set-desc">
                    <div class="act-header">
                        <strong>{act.type.toUpperCase()}</strong> 
                        <span class="style-tag">({act.style || (act.type === 'utilidade' ? act.utility?.style : 'N/A')})</span>
                    </div>

                    <div class="act-details">
                        {#if act.type === 'ataque'}
                            ⚔️ Dano Base: {s.w + (act.weapon?.dmg || 0)} | Local: {act.tactics?.calledShot ? act.tactics.targetLocation : s.h}
                        {:else if act.type === 'defesa'}
                            🛡️ {act.defense?.style === 'block' ? 'Bloqueio/Esquiva (Gobble)' : `Barreira (HAR ${act.defense?.har} | LAR ${act.defense?.lar})`}
                        {:else if act.type === 'utilidade'}
                            {#if act.utility?.style === 'heal'}
                                💖 Cura Ativa: +{s.w + (act.utility.skillBonus || 0)} HP
                            {:else if act.utility?.style === 'buff'}
                                ⚡ Suporte: +{act.utility.buff?.amount || 1} Dados
                            {:else if act.utility?.style === 'debuff'}
                                💀 Sabotagem: -{act.utility.debuff?.amount || 1} Dados
                            {:else if act.utility?.style === 'power'}
                                🔮 Poder Alocado (Massa/Alcance)
                            {:else}
                                🏃 Movimentação Tática
                            {/if}
                        {/if}
                    </div>

                    {#if act.desc}
                        <div class="flavor-text">"{act.desc}"</div>
                    {/if}
                </div>
                
                <button class="exec-btn" on:click={() => dispatch('prepareExecute', { unitId, setIndex: i, setStats: s, actionData: act })}>
                    <i class="fas fa-play"></i> <span>EXECUTAR</span>
                </button>
            </div>
        {/each}

        {#if currentSets.length === 0}
            <div class="no-sets">
                <i class="fas fa-ban"></i> Nenhum Conjunto ORE (Set) válido foi formado.
            </div>
        {/if}
    </div>
</div>

<style>
    .sets-tray h3 { margin: 0 0 10px 0; color: #888; font-size: 12px; border-bottom: 1px dashed #333; padding-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
    .sets-list { display: flex; flex-direction: column; gap: 10px; }
    
    .set-card { display: flex; align-items: center; gap: 12px; background: rgba(20,20,20,0.8); padding: 10px; border-radius: 6px; border: 1px solid #333; border-left: 4px solid #555; position: relative; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.5); }
    .set-card::before { content: ''; position: absolute; left: 0; top: 0; width: 100%; height: 100%; background: linear-gradient(90deg, rgba(255,255,255,0.05), transparent); pointer-events: none; }
    
    .set-card.ataque { border-left-color: #f33; }
    .set-card.defesa { border-left-color: #08f; }
    .set-card.utilidade { border-left-color: #a855f7; }
    
    .set-badge { font-size: 22px; font-weight: bold; color: #fff; background: #000; padding: 4px 10px; border-radius: 4px; border: 1px solid #444; font-family: 'Share Tech Mono', monospace; text-shadow: 0 2px 5px rgba(0,0,0,1); display: flex; align-items: center; justify-content: center; min-width: 60px; box-shadow: inset 0 0 10px rgba(255,255,255,0.1); }
    .set-badge .x { font-size: 12px; color: var(--c-primary); margin: 0 2px; }
    
    .set-desc { flex: 1; display: flex; flex-direction: column; gap: 2px; z-index: 2; }
    .act-header { font-size: 13px; color: #fff; font-weight: bold; letter-spacing: 1px; }
    .style-tag { font-size: 9px; color: #ffaa00; text-transform: uppercase; }
    
    .act-details { font-size: 10px; color: #aaa; background: #000; padding: 2px 6px; border-radius: 2px; border: 1px dashed #333; display: inline-block; width: fit-content; }
    .flavor-text { font-size: 10px; color: #888; font-style: italic; margin-top: 2px; border-left: 1px solid #444; padding-left: 5px; }
    
    .exec-btn { background: var(--c-primary, #00ff41); border: 1px solid rgba(0,0,0,0.5); color: #000; padding: 10px; border-radius: 4px; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 2px; font-family: inherit; font-weight: bold; font-size: 9px; z-index: 2; }
    .exec-btn i { font-size: 14px; }
    .exec-btn:hover { transform: scale(1.05); box-shadow: 0 0 15px var(--c-primary, #00ff41); background: #fff; }
    
    .no-sets { padding: 15px; text-align: center; color: #f33; border: 1px dashed #500; font-size: 11px; background: rgba(255,0,0,0.1); border-radius: 4px; font-weight: bold; }
</style>