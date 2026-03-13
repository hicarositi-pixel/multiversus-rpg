<script>
    import { createEventDispatcher } from 'svelte';
    import { slide } from 'svelte/transition';
    import { CombatManager } from '../../../Logic/CombatManager.js'; // PUXA O MANAGER!

    export let isGM = false;
    export let queue = []; 
    export let selectedId = null; 
    export let activeTurnId = null;

    const dispatch = createEventDispatcher();
    const currentUserId = game.user.id;
</script>

<div class="combat-list-container">
    <div class="panel-header">
        <i class="fas fa-satellite-dish"></i> RADAR TÁTICO
        <div class="sub-header">{isGM ? "CONTROLE DO MESTRE" : "VISTAS DA EQUIPE"}</div>
    </div>

    <div class="queue-list custom-scroll">
        {#each queue as c, i (c.id)}
            {@const isMe = !isGM && c.userId === currentUserId}
            {@const isSelected = selectedId === c.id}

            <div class="queue-item-wrapper" class:selected={isSelected}>
                <div class="queue-item {c.ready ? 'ready' : 'waiting'}" 
                     class:is-turn={activeTurnId === c.id}
                     class:is-me={isMe}
                     on:click={() => { if(isGM) dispatch('selectNpc', c.id); }}>
                    
                    <div class="q-number">{i + 1}</div>
                    <img src={c.img} alt="img" class="q-img"/>
                    
                    <div class="q-info">
                        <span class="q-name">{c.name} {isMe ? '(VOCÊ)' : ''}</span>
                        <span class="q-status">
                            {#if c.ready}
                                <span class="txt-ready"><i class="fas fa-check-circle"></i> VETORES NA REDE</span>
                            {:else}
                                <span class="txt-wait"><i class="fas fa-spinner fa-pulse"></i> PROGRAMANDO...</span>
                            {/if}
                        </span>
                    </div>

                    <div class="gm-item-actions">
                        {#if isGM}
                            <button class="speak-btn {activeTurnId === c.id ? 'on' : ''}" 
                                    on:click|stopPropagation={() => dispatch('setTurn', c.id)} title="Passar Turno para este Alvo">
                                <i class="fas fa-bullhorn"></i>
                            </button>
                            <button class="del-npc" on:click|stopPropagation={() => dispatch('removeNpc', c.id)}>
                                <i class="fas fa-times"></i>
                            </button>
                        {/if}
                    </div>
                </div>

                {#if isGM && isSelected}
                    <div class="gm-action-spy" transition:slide>
                        <div class="spy-title"><i class="fas fa-user-secret"></i> DECODIFICAÇÃO DO SISTEMA ORE:</div>
                        <div class="spy-content">
                            {@html CombatManager.generateDetailedSummary(c)}
                        </div>
                    </div>
                {/if}
            </div>
        {/each}
        {#if queue.length === 0}
            <div class="empty">Nenhum alvo rastreado pelo satélite.</div>
        {/if}
    </div>

{#if isGM}
        <div class="gm-controls">
            <div class="gm-row">
                <button class="action-btn user-btn" on:click={() => dispatch('pullPlayers')} title="Adicionar Jogadores"><i class="fas fa-users"></i> JOGADORES</button>
                <button class="action-btn npc-btn" on:click={() => dispatch('pullTargets')} title="Adicionar Alvos"><i class="fas fa-crosshairs"></i> ALVOS</button>
                <button class="action-btn sync-btn" on:click={() => dispatch('refreshData')} title="Forçar Sincronização"><i class="fas fa-sync-alt"></i> SYNC</button>
            </div>
            <button class="action-btn start-btn" on:click={() => dispatch('startCombat')}>
                <i class="fas fa-biohazard"></i> INICIAR CONFRONTO (RESOLUÇÃO)
            </button>
        </div>
    {/if}
</div>

<style>
    /* MANTENHA O SEU CSS EXATAMENTE COMO ESTAVA ANTES! Apenas colei a estrutura HTML limpa. */
    .combat-list-container { display: flex; flex-direction: column; height: 100%; background: #050508; border-right: 1px solid var(--c-primary, #00ff41); font-family: 'Share Tech Mono', monospace; }
    .panel-header { padding: 15px 10px; background: #0a0a0f; color: var(--c-primary, #00ff41); font-weight: bold; font-size: 13px; border-bottom: 2px solid #222; text-align: center; letter-spacing: 2px; }
    .sub-header { font-size: 8px; color: #666; margin-top: 4px; }
    .queue-list { flex: 1; overflow-y: auto; padding: 10px 5px; display: flex; flex-direction: column; gap: 8px; }
    .queue-item-wrapper { display: flex; flex-direction: column; background: #000; border-radius: 6px; border: 1px solid #222; overflow: hidden; transition: 0.3s; }
    .queue-item-wrapper.selected { border-color: var(--c-primary, #00ff41); box-shadow: 0 0 15px rgba(0,255,65,0.2); }
    .queue-item { display: flex; align-items: center; gap: 8px; background: #111; padding: 6px 8px; cursor: pointer; transition: background 0.2s; border-left: 4px solid #555; }
    .queue-item:hover { background: #1a1a1a; }
    .queue-item.ready { border-left-color: #00aaff; } .queue-item.waiting { border-left-color: #ffaa00; }
    .queue-item.is-turn { background: rgba(0, 170, 255, 0.15); box-shadow: inset 0 0 10px rgba(0,170,255,0.5); }
    .queue-item.is-me { background: rgba(0, 255, 65, 0.05); }
    .q-number { font-size: 14px; font-weight: bold; color: #666; width: 20px; text-align: center; text-shadow: 1px 1px 0 #000; }
    .queue-item.ready .q-number { color: #00aaff; }
    .q-img { width: 36px; height: 36px; object-fit: cover; border-radius: 4px; border: 1px solid #444; }
    .q-info { flex: 1; display: flex; flex-direction: column; overflow: hidden; gap: 2px; }
    .q-name { font-size: 12px; font-weight: bold; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .q-status { font-size: 9px; font-weight: bold; }
    .txt-ready { color: #00aaff; } .txt-wait { color: #ffaa00; }
    .gm-item-actions { display: flex; gap: 6px; }
    .speak-btn { background: #000; border: 1px solid #444; color: #666; border-radius: 4px; cursor: pointer; padding: 6px 8px; font-size: 12px; transition: 0.2s; }
    .speak-btn.on { background: #00aaff; color: #000; border-color: #00aaff; animation: pulseBlue 1.5s infinite; }
    .speak-btn:hover:not(.on) { color: #fff; border-color: #fff; }
    .del-npc { background: none; border: none; color: #666; cursor: pointer; font-size: 14px; padding: 4px; transition: 0.2s; } 
    .del-npc:hover { color: #ff4444; transform: scale(1.2); }
    
    .gm-action-spy { background: #08080a; padding: 10px; border-top: 1px dashed #333; }
    .spy-title { font-size: 9px; font-weight: bold; color: #00ff41; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
    .spy-content { font-family: 'Share Tech Mono', monospace; } /* Formatação base, o Manager cospe o HTML rico */

    .gm-controls { padding: 15px; background: #0a0a0f; border-top: 1px solid var(--c-primary, #00ff41); display: flex; flex-direction: column; gap: 10px; box-shadow: 0 -5px 15px rgba(0,0,0,0.8); z-index: 10; }
    .gm-row { display: flex; gap: 10px; }
    .action-btn { flex: 1; background: #111; border: 1px dashed var(--c-primary, #00ff41); color: var(--c-primary, #00ff41); padding: 10px; cursor: pointer; font-family: inherit; font-size: 10px; font-weight: bold; transition: 0.2s; border-radius: 4px; display: flex; justify-content: center; align-items: center; gap: 6px; }
    .user-btn { border-color: #00aaff; color: #00aaff; } .user-btn:hover { background: #00aaff; color: #000; }
    .npc-btn { border-color: #ffaa00; color: #ffaa00; } .npc-btn:hover { background: #ffaa00; color: #000; }
    .start-btn { background: #220000; border: 1px solid #ff4444; color: #ff4444; width: 100%; padding: 14px; font-size: 12px; } 
    .start-btn:hover { background: #ff4444; color: #000; box-shadow: 0 0 15px #ff4444; }
    .empty { padding: 30px; text-align: center; color: #555; font-size: 11px; font-style: italic; }
    .custom-scroll::-webkit-scrollbar { width: 4px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #444; border-radius: 2px; }
    .sync-btn { border-color: #a855f7; color: #a855f7; } 
    .sync-btn:hover { background: #a855f7; color: #000; box-shadow: 0 0 10px #a855f7; }
    @keyframes pulseBlue { 0%, 100% { box-shadow: 0 0 5px #00aaff; } 50% { box-shadow: 0 0 15px #00aaff; transform: scale(1.1); } }
</style>