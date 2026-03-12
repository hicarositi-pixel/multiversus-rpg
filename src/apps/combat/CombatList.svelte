<script>
    import { createEventDispatcher } from 'svelte';
    export let isGM = false;
    export let queue = []; // Recebe a fila de declaração já ordenada do Hub
    export let selectedId = null; 
    export let activeTurnId = null; // Quem está com o megafone

    const dispatch = createEventDispatcher();
</script>

<div class="combat-list-container">
    <div class="panel-header">
        <i class="fas fa-satellite-dish"></i> ORDEM DE DECLARAÇÃO
    </div>

    <div class="queue-list custom-scroll">
        {#each queue as c, i}
            <div class="queue-item {c.ready ? 'ready' : 'waiting'}" 
                 class:selected={selectedId === c.id}
                 class:is-turn={activeTurnId === c.id}
                 on:click={() => { if(isGM) dispatch('selectNpc', c.id); }}>
                
                <div class="q-number">{i + 1}</div>
                <img src={c.img} alt="img" class="q-img"/>
                
                <div class="q-info">
                    <span class="q-name">{c.name}</span>
                    <span class="q-status">
                        {#if c.ready}
                            <span style="color:#00ff41;">[ ENVIADO ]</span>
                        {:else}
                            <span style="color:#ffaa00;">[ PENSANDO ]</span>
                        {/if}
                    </span>
                </div>

                <div class="gm-item-actions">
                    {#if isGM}
                        <button class="speak-btn {activeTurnId === c.id ? 'on' : ''}" 
                                on:click|stopPropagation={() => dispatch('setTurn', c.id)} title="Marcar quem está declarando">
                            <i class="fas fa-bullhorn"></i>
                        </button>
                        
                        <button class="del-npc" on:click|stopPropagation={() => dispatch('removeNpc', c.id)} title="Remover do Combate">
                            <i class="fas fa-trash"></i>
                        </button>
                    {/if}
                </div>
            </div>
        {/each}
        {#if queue.length === 0}
            <div class="empty">Nenhum vetor rastreado.</div>
        {/if}
    </div>

    {#if isGM}
        <div class="gm-controls">
            <button class="action-btn user-btn" on:click={() => dispatch('pullPlayers')}>
                <i class="fas fa-users"></i> PUXAR JOGADORES ONLINE
            </button>
            <button class="action-btn" on:click={() => dispatch('pullTargets')}>
                <i class="fas fa-crosshairs"></i> PUXAR ALVOS (TARGET)
            </button>
            <button class="action-btn start-btn" on:click={() => dispatch('startCombat')}>
                <i class="fas fa-biohazard"></i> INICIAR CONFRONTO
            </button>
        </div>
    {/if}
</div>

<style>
    .combat-list-container { display: flex; flex-direction: column; height: 100%; background: rgba(10,10,15,0.9); border-right: 1px solid var(--c-primary); }
    .panel-header { padding: 10px; background: #000; color: var(--c-primary); font-weight: bold; font-size: 11px; border-bottom: 1px solid #333; text-align: center; letter-spacing: 1px; }
    
    .queue-list { flex: 1; overflow-y: auto; padding: 5px; display: flex; flex-direction: column; gap: 4px; }
    .queue-item { display: flex; align-items: center; gap: 8px; background: #111; border: 1px solid #222; border-left: 3px solid #555; padding: 4px; border-radius: 4px; transition: 0.2s; cursor: pointer; }
    .queue-item.selected { border-color: var(--c-primary); background: rgba(0,255,65,0.1); }
    .queue-item.is-turn { border-left: 4px solid #00aaff; background: rgba(0, 170, 255, 0.15); box-shadow: inset 0 0 10px rgba(0,170,255,0.5); }
    
    .q-number { font-size: 10px; font-weight: bold; color: #666; width: 15px; text-align: center; }
    .q-img { width: 30px; height: 30px; object-fit: cover; border-radius: 4px; border: 1px solid #444; }
    .q-info { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .q-name { font-size: 11px; font-weight: bold; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .q-status { font-size: 9px; font-weight: bold; }
    
    .gm-item-actions { display: flex; gap: 5px; }
    .speak-btn { background: #000; border: 1px solid #444; color: #666; border-radius: 4px; cursor: pointer; padding: 4px 6px; font-size: 10px; }
    .speak-btn.on { background: #00aaff; color: #000; border-color: #00aaff; animation: pulseBlue 1.5s infinite; }
    .del-npc { background: none; border: none; color: #666; cursor: pointer; font-size: 12px; } 
    .del-npc:hover { color: #ff4444; }

    .gm-controls { padding: 10px; background: #050505; border-top: 1px solid var(--c-primary); display: flex; flex-direction: column; gap: 6px; }
    .action-btn { background: #111; border: 1px dashed var(--c-primary); color: var(--c-primary); padding: 8px; cursor: pointer; font-family: inherit; font-size: 10px; transition: 0.2s; border-radius: 4px; }
    .action-btn:hover { background: var(--c-primary); color: #000; font-weight: bold; }
    .user-btn { border-color: #00aaff; color: #00aaff; } .user-btn:hover { background: #00aaff; color: #000; }
    .start-btn { background: #220000; border: 1px solid #ff4444; color: #ff4444; } .start-btn:hover { background: #ff4444; color: #000; }
    .empty { padding: 20px; text-align: center; color: #555; font-size: 10px; }

    @keyframes pulseBlue { 0%, 100% { box-shadow: 0 0 5px #00aaff; } 50% { box-shadow: 0 0 15px #00aaff; transform: scale(1.1); } }
</style>