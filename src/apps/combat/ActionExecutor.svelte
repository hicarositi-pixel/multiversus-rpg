<script>
    import { createEventDispatcher } from 'svelte';
    export let unitId;
    export let currentSets = [];
    export let actions = [];
    export let isOwner = false; 
    
    const dispatch = createEventDispatcher();

    function handleExecute(s, act, i) {
        // MÁGICA: Se o jogador já tem um alvo marcado no mapa (Foundry Target), 
        // nós tentamos pegar esse ID automaticamente para facilitar.
        const targets = Array.from(game.user.targets);
        
        if (targets.length > 0) {
            // Se tem alvo no mapa, executa direto sem precisar clicar na timeline
            const targetActorId = targets[0].actor.id;
            // Procuramos se esse actor está no combate atual para vincular os dados
            dispatch('prepareExecute', { 
                unitId, 
                setIndex: i, 
                setStats: s, 
                actionData: act,
                autoTargetId: targetActorId 
            });
        } else {
            // Se não tem alvo no mapa, abre o modo de mira da Timeline (o padrão)
            dispatch('prepareExecute', { unitId, setIndex: i, setStats: s, actionData: act });
        }
    }
</script>

<div class="sets-tray">
    <div class="tray-header">
        <h3><i class="fas fa-crosshairs"></i> VETORES ALOCADOS E VALIDADOS</h3>
        {#if isOwner}
            <span class="hint">Dica: Selecione um alvo no mapa (T) para execução rápida.</span>
        {/if}
    </div>

    <div class="sets-list">
        {#each currentSets as s, i}
            {@const act = actions[i] || { type: 'utilidade', utility: { style: 'move' }, desc: 'Ação Improvisada' }}
            
            <div class="set-card {isOwner ? act.type : 'encrypted'}">
                
                <div class="set-badge-col">
                    <div class="set-badge">{s.w}<span class="x">x</span>{s.h}</div>
                </div>
                
                <div class="set-desc">
                    {#if isOwner}
                        <div class="act-header">
                            <strong>[{act.type.toUpperCase()}]</strong> 
                            <span class="style-tag">
                                {act.style ? act.style.toUpperCase() : (act.utility?.style ? act.utility.style.toUpperCase() : 'N/A')}
                            </span>
                        </div>

                        <div class="act-details">
                            {#if act.type === 'ataque'}
                                <span class="d-tag dmg">Dano: {s.w + (act.weapon?.dmg || 0)}</span>
                                <span class="d-tag pen">P:{act.weapon?.pen || 0}</span>
                                <span class="d-tag loc">Loc:{act.tactics?.calledShot ? act.tactics.targetLocation : s.h}</span>
                            {:else if act.type === 'defesa'}
                                <span class="d-tag def">
                                    {act.defense?.style === 'block' ? `Esquiva` : `Barreira (${act.defense?.lar}/${act.defense?.har})`}
                                </span>
                            {:else if act.type === 'utilidade'}
                                <span class="d-tag ut">UTILITÁRIO</span>
                            {/if}
                        </div>

                        {#if act.maneuvers && act.maneuvers.length > 0}
                            <div class="effects-row">
                                {#each act.maneuvers as maneuver}
                                    <span class="maneuver-pill">{maneuver.toUpperCase()}</span>
                                {/each}
                            </div>
                        {/if}

                        {#if act.desc}
                            <div class="flavor-text">"{act.desc}"</div>
                        {/if}
                    {:else}
                        <div class="encrypted-block">
                            <i class="fas fa-user-secret"></i>
                            <div class="enc-text">
                                <strong>VETOR CRIPTOGRAFADO</strong>
                                <span>Aguardando resolução do Mestre...</span>
                            </div>
                        </div>
                    {/if}
                </div>
                
                <div class="set-action-col">
                    {#if isOwner}
                        <button class="exec-btn" on:click={() => handleExecute(s, act, i)}>
                            <i class="fas fa-play"></i> <span>EXECUTAR</span>
                        </button>
                    {:else}
                        <div class="owner-lock">
                            <i class="fas fa-lock"></i>
                        </div>
                    {/if}
                </div>
            </div>
        {/each}

        {#if currentSets.length === 0}
            <div class="no-sets">
                <i class="fas fa-ban"></i> SEM CONJUNTOS VÁLIDOS
            </div>
        {/if}
    </div>
</div>

<style>
    .sets-tray { display: flex; flex-direction: column; gap: 10px; }
    .tray-header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px dashed #333; padding-bottom: 5px; }
    .sets-tray h3 { margin: 0; color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-family: 'Share Tech Mono', monospace; }
    .hint { font-size: 8px; color: #555; font-style: italic; }

    .sets-list { display: flex; flex-direction: column; gap: 8px; font-family: 'Share Tech Mono', monospace; }
    
    .set-card { display: flex; align-items: stretch; gap: 10px; background: rgba(10,10,12,0.9); border-radius: 4px; border: 1px solid #222; border-left: 4px solid #555; position: relative; overflow: hidden; transition: 0.2s; }
    
    .set-card.ataque { border-left-color: #f33; }
    .set-card.defesa { border-left-color: #08f; }
    .set-card.utilidade { border-left-color: #00ff41; }
    .set-card.encrypted { border-left-color: #333; background: #050505; }
    
    .set-badge-col { padding: 10px 0 10px 10px; display: flex; align-items: center; }
    .set-badge { font-size: 20px; font-weight: bold; color: #fff; background: #000; padding: 4px 8px; border-radius: 4px; border: 1px solid #333; display: flex; align-items: center; justify-content: center; min-width: 55px; }
    .set-badge .x { font-size: 12px; color: #00ff41; margin: 0 2px; }
    
    .set-desc { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 4px; padding: 8px 0; }
    
    .act-header { font-size: 11px; color: #fff; font-weight: bold; display: flex; align-items: center; gap: 5px; }
    .style-tag { font-size: 8px; color: #ffaa00; opacity: 0.8; }
    
    .act-details { display: flex; flex-wrap: wrap; gap: 4px; }
    .d-tag { font-size: 9px; font-weight: bold; background: #111; padding: 2px 5px; border-radius: 3px; border: 1px solid #333; color: #aaa; }
    .d-tag.dmg { color: #f55; }
    .d-tag.pen { color: #eee; }
    .d-tag.loc { color: #fb0; }

    .effects-row { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 2px; }
    .maneuver-pill { font-size: 8px; font-weight: bold; background: rgba(0,255,65,0.1); color: #00ff41; padding: 1px 4px; border-radius: 10px; border: 1px solid rgba(0,255,65,0.3); }

    .flavor-text { font-size: 10px; color: #777; font-style: italic; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
    
    .encrypted-block { display: flex; align-items: center; gap: 10px; color: #444; }
    .enc-text { display: flex; flex-direction: column; line-height: 1; }
    .enc-text strong { font-size: 10px; }
    .enc-text span { font-size: 8px; }

    .set-action-col { background: rgba(255,255,255,0.02); padding: 10px; display: flex; align-items: center; justify-content: center; border-left: 1px solid #222; }
    .exec-btn { background: #00ff41; color: #000; border: none; padding: 8px; border-radius: 4px; cursor: pointer; transition: 0.2s; display: flex; flex-direction: column; align-items: center; gap: 2px; font-family: inherit; font-weight: bold; font-size: 9px; width: 65px; pointer-events: all; }
    .exec-btn:hover { background: #fff; box-shadow: 0 0 15px #00ff41; transform: scale(1.05); }
    
    .owner-lock { color: #333; font-size: 18px; width: 65px; text-align: center; }

    .no-sets { padding: 15px; text-align: center; color: #444; border: 1px dashed #222; font-size: 10px; border-radius: 4px; }
</style>