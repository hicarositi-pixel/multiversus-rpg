<script>
    import { createEventDispatcher } from 'svelte';
    import { flip } from 'svelte/animate';
    import { quintOut } from 'svelte/easing';

    export let timeline = [];
    export let activeUnitId = null;
    export let targetingActive = false;

    const dispatch = createEventDispatcher();
</script>

<div class="timeline-panel" class:targeting-mode={targetingActive}>
    <div class="header">
        <i class="fas fa-stream"></i> TIMELINE DE RESOLUÇÃO
        {#if targetingActive}
            <div class="target-alert blink">MODO DE MIRA: CLIQUE NO ALVO AQUI</div>
        {/if}
    </div>

    <div class="timeline-scroll custom-scroll">
        {#each timeline as item (item.uniqueId)}
            <div class="t-row {item.action.type}" 
                 class:active={activeUnitId === item.actorId && !targetingActive}
                 animate:flip={{duration: 400, easing: quintOut}}
                 on:click={() => dispatch('rowClicked', item)}>
                
                <div class="t-speed" title="Velocidade (Width + Buffs)">
                    <i class="fas fa-bolt"></i> {item.effectiveSpeed}
                </div>

                <div class="t-set"><span class="w">{item.width}</span><span class="x">x</span><span class="h">{item.height}</span></div>
                
                <img src={item.img} alt="P" />
                
                <div class="t-info">
                    <div class="name">{item.name}</div>
                    <div class="action-desc">[{item.action.type.toUpperCase()}] {item.action.style || ''}</div>
                </div>
            </div>
        {/each}
        {#if timeline.length === 0}
            <div class="empty">Nenhuma ação restante. O turno acabou.</div>
        {/if}
    </div>
</div>

<style>
    .timeline-panel { width: 320px; background: #050508; border-right: 2px solid var(--c-primary, #00ff41); display: flex; flex-direction: column; height: 100%; position: relative; }
    .header { padding: 15px; background: #111; color: var(--c-primary, #00ff41); font-weight: bold; border-bottom: 1px solid #333; display: flex; flex-direction: column; gap: 5px; }
    .target-alert { background: #ffaa00; color: #000; padding: 4px; text-align: center; border-radius: 2px; font-size: 11px; font-weight: bold; }
    .blink { animation: blink 1s infinite; }

    .timeline-scroll { flex: 1; padding: 10px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
    .t-row { display: flex; align-items: center; gap: 8px; background: #111; padding: 6px; border-radius: 4px; border: 1px solid #222; cursor: pointer; transition: 0.2s; border-left: 4px solid #555; }
    .t-row:hover { background: #1a1a1a; transform: translateX(5px); }
    .t-row.active { background: rgba(255,255,255,0.05); border-color: #666; }
    
    .t-row.ataque { border-left-color: #f33; }
    .t-row.defesa { border-left-color: #08f; }
    .t-row.utilidade { border-left-color: #a855f7; }

    .targeting-mode .t-row { opacity: 0.4; filter: grayscale(1); }
    .targeting-mode .t-row:hover { opacity: 1; filter: grayscale(0); border-color: #ffaa00; box-shadow: 0 0 15px rgba(255,170,0,0.5); cursor: crosshair; }

    .t-speed { font-size: 10px; color: #ffaa00; display: flex; flex-direction: column; align-items: center; background: #000; padding: 4px; border-radius: 4px; border: 1px dashed #333; width: 30px; }
    .t-set { font-size: 16px; font-weight: bold; color: #fff; width: 40px; text-align: center; }
    .t-set .x { font-size: 10px; color: #888; margin: 0 2px; }
    .t-row img { width: 35px; height: 35px; object-fit: cover; border-radius: 4px; border: 1px solid #555; }
    
    .t-info { flex: 1; overflow: hidden; }
    .name { font-size: 12px; font-weight: bold; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .action-desc { font-size: 9px; color: #888; text-transform: uppercase; }
    .empty { padding: 20px; text-align: center; color: #666; font-size: 11px; }

    @keyframes blink { 50% { opacity: 0.4; } }
    .custom-scroll::-webkit-scrollbar { width: 4px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #444; border-radius: 2px; }
</style>