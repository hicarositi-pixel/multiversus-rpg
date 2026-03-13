<script>
    import { createEventDispatcher } from 'svelte';
    import { flip } from 'svelte/animate';
    import { quintOut } from 'svelte/easing';

    export let timeline = [];
    export let activeUnitId = null;
    export let targetingActive = false;
    export let isGM = false;

    const dispatch = createEventDispatcher();

    function getActionInfo(action) {
        if (!action || action.text === 'Ação Improvisada') return { title: 'AÇÃO IMPROVISADA', css: 'improvisada' };
        if (action.type === 'ataque') return { title: `ATAQUE`, css: 'ataque' };
        if (action.type === 'defesa') return { title: `DEFESA`, css: 'defesa' };
        if (action.type === 'utilidade') return { title: `UTILIDADE`, css: 'utilidade' };
        return { title: 'OCULTO', css: 'improvisada' };
    }

    function handleRowClick(item, isClear) {
        // REGRA DE OURO: Se estiver em modo de mira, QUALQUER UM é alvo.
        if (targetingActive) {
            dispatch('rowClicked', item);
            return;
        }

        // REGRA DE SUSPENSE: Só permite selecionar para ver a bandeja se for Dono, GM ou estiver Revelado.
        if (isClear) {
            dispatch('rowClicked', item);
        } else {
            // Feedback visual de que está travado
            ui.notifications.warn("Sinal criptografado. Aguarde a revelação do Mestre.");
        }
    }
</script>

<div class="timeline-panel" class:targeting-mode={targetingActive}>
    <div class="header">
        <div class="h-title"><i class="fas fa-stream"></i> TIMELINE DE RESOLUÇÃO</div>
        <div class="h-subtitle">Clique nas suas ações para gerenciar dados.</div>
        {#if targetingActive}
            <div class="target-alert blink">
                <i class="fas fa-crosshairs"></i> SELECIONE O ALVO DA AÇÃO
            </div>
        {/if}
    </div>

    <div class="timeline-scroll custom-scroll">
        {#each timeline as item (item.uniqueId)}
            {@const isOwner = isGM || item.actorId === game.user.character?.id}
            {@const isClear = isOwner || item.isRevealed}
            {@const info = getActionInfo(item.action)}
            
            <div class="t-row {isClear ? info.css : 'encrypted'}" 
                 class:active={activeUnitId === item.actorId && !targetingActive}
                 class:locked={!isClear && !targetingActive}
                 animate:flip={{duration: 400, easing: quintOut}}
                 on:click={() => handleRowClick(item, isClear)}>
                
                <div class="t-speed">
                    <i class="fas fa-bolt"></i> {item.effectiveSpeed}
                </div>

                <div class="t-set">
                    {#if isClear}
                        <span class="w">{item.width}</span><span class="x">x</span><span class="h">{item.height}</span>
                    {:else}
                        <span class="w blur-txt">?</span><span class="x">x</span><span class="h blur-txt">?</span>
                    {/if}
                </div>
                
                <div class="t-avatar" class:blur-img={!isClear}>
                    <img src={item.img} alt="Avatar" />
                    {#if !isClear && !targetingActive}
                        <div class="lock-overlay"><i class="fas fa-lock"></i></div>
                    {/if}
                </div>
                
                <div class="t-info">
                    <div class="name-bar">
                        <span class="name">{isClear ? item.name : '[ SINAL OCULTO ]'}</span>
                        {#if isClear}
                            <span class="action-tag {info.css}">{info.title}</span>
                        {:else}
                            <span class="action-tag encrypted">DADOS RESTRITOS</span>
                        {/if}
                    </div>

                    {#if isClear}
                        <div class="details-reveal">
                            {#if item.action.desc}<div class="action-desc">"{item.action.desc}"</div>{/if}
                        </div>
                    {/if}
                </div>

                {#if isGM && !item.isRevealed}
                    <button class="gm-reveal-btn" on:click|stopPropagation={() => dispatch('reveal', item.uniqueId)}>
                        <i class="fas fa-unlock"></i> REVELAR
                    </button>
                {/if}
            </div>
        {/each}
    </div>
</div>

<style>
    .timeline-panel { 
        width: 360px; background: #050508; border-right: 2px solid #00ff41; 
        display: flex; flex-direction: column; height: 100%; position: relative; 
        font-family: 'Share Tech Mono', monospace;
    }
    
    .header { padding: 15px; background: #0a0a0f; border-bottom: 2px solid #222; }
    .h-title { color: #00ff41; font-weight: bold; font-size: 14px; display: flex; align-items: center; gap: 8px; }
    .h-subtitle { color: #666; font-size: 9px; font-style: italic; }
    
    .target-alert { background: #ffaa00; color: #000; padding: 6px; text-align: center; border-radius: 4px; font-size: 11px; font-weight: bold; margin-top: 8px; }
    .blink { animation: blink 1s infinite; }

    .timeline-scroll { flex: 1; min-height: 0; padding: 15px 10px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
    
    .t-row { 
        display: flex; align-items: flex-start; gap: 8px; background: #0a0a0e; padding: 8px; 
        border-radius: 6px; border: 1px solid #222; border-left: 4px solid #555; 
        cursor: pointer; transition: 0.2s; position: relative;
    }
    
    .t-row:hover { background: #111116; }
    .t-row.active { background: rgba(255,255,255,0.05); border-color: #666; }
    
    /* ESTADO BLOQUEADO (SUSPENSE) */
    .t-row.locked { cursor: not-allowed; opacity: 0.7; }
    .t-row.locked:hover { transform: none; background: #0a0a0e; }

    .t-row.ataque { border-left-color: #f33; }
    .t-row.defesa { border-left-color: #08f; }
    .t-row.utilidade { border-left-color: #00ff41; }
    .t-row.encrypted { border-left-color: #333; background: #050505; border-style: dashed; }

    .t-speed { font-size: 11px; color: #ffaa00; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #000; border: 1px dashed #444; width: 28px; height: 36px; }
    .t-set { font-size: 18px; font-weight: bold; color: #fff; width: 45px; text-align: center; }
    .t-set .x { font-size: 10px; color: #888; }
    
    .t-avatar { width: 36px; height: 36px; border-radius: 4px; border: 1px solid #555; overflow: hidden; position: relative; }
    .t-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .blur-img { filter: blur(6px) grayscale(1); }
    .lock-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.4); color: #fff; font-size: 14px; }

    .t-info { flex: 1; overflow: hidden; padding-top: 2px; }
    .name { font-size: 12px; font-weight: bold; color: #fff; display: block; }
    .action-tag { font-size: 8px; font-weight: bold; padding: 1px 4px; border-radius: 2px; text-transform: uppercase; }
    .action-tag.ataque { background: #300; color: #f33; }
    .action-tag.defesa { background: #002; color: #08f; }
    .action-tag.utilidade { background: #020; color: #00ff41; }
    .action-tag.encrypted { color: #555; border: 1px solid #222; }

    .details-reveal { max-height: 0; opacity: 0; overflow: hidden; transition: 0.3s; }
    .t-row:hover .details-reveal { max-height: 80px; opacity: 1; margin-top: 5px; }
    .action-desc { font-size: 10px; color: #888; font-style: italic; }

    .gm-reveal-btn { background: #00ff41; color: #000; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-family: inherit; font-weight: bold; font-size: 9px; margin-left: auto; transition: 0.2s; }
    .gm-reveal-btn:hover { background: #fff; box-shadow: 0 0 10px #00ff41; }

    .targeting-mode .t-row { cursor: crosshair; }
    .targeting-mode .t-row:hover { border-color: #ffaa00; opacity: 1; }

    @keyframes blink { 50% { opacity: 0.5; } }
</style>