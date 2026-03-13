<script>
    import { slide, fade } from 'svelte/transition';
    import { createEventDispatcher } from 'svelte';
    import SpecialEffectsPanel from './SpecialEffectsPanel.svelte';

    export let action; 
    export let index;
    export let disabled = false;
    
    // AVISA O TERMINAL QUE ESTA CARTA ESTÁ EM MODO TELA CHEIA
    export let isFocused = false; 

    const dispatch = createEventDispatcher();
    let isCollapsed = false;
    let showSpecialEffects = false;

    function toggleFocus() {
        isFocused = !isFocused;
    }
</script>

<div class="action-card" class:disabled class:focused={isFocused}>
    <div class="ac-header">
        <div class="ac-title">
            <span class="num">0{index + 1}</span>
            <select bind:value={action.type} {disabled} class="type-select {action.type}">
                <option value="ataque">ATAQUE</option>
                <option value="defesa">DEFESA</option>
                <option value="utilidade">UTILIDADE</option>
            </select>
        </div>

        {#if isCollapsed && !isFocused}
            <span class="collapsed-preview">{action.desc || "Vetor não detalhado..."}</span>
        {/if}

        <div class="controls">
            <button class="btn-mini focus-btn" on:click={toggleFocus} title={isFocused ? "Minimizar Aba" : "Expandir Configuração"}>
                <i class="fas {isFocused ? 'fa-compress' : 'fa-expand'}"></i>
            </button>
            <button class="btn-mini" on:click={() => isCollapsed = !isCollapsed} title="Recolher Aba">
                <i class="fas {isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'}"></i>
            </button>
            <button class="btn-mini danger" on:click={() => dispatch('remove')} {disabled} title="Deletar Ação">
                <i class="fas fa-times"></i>
            </button>
        </div>
    </div>

    {#if !isCollapsed || isFocused}
        <div class="ac-body custom-scroll" transition:slide>
            
            <div class="desc-box">
                <i class="fas fa-terminal"></i>
                <input type="text" class="desc-input" placeholder="Descreva a narrativa tática desta ação..." bind:value={action.desc} {disabled}>
            </div>
            
            <div class="tactic-modules">

                {#if action.type === 'ataque'}
                    <div class="module full-width">
                        <div class="segmented-control">
                            <label class="seg-btn {action.style === 'melee' ? 'active' : ''}">
                                <input type="radio" bind:group={action.style} value="melee" {disabled} class="hidden-radio">
                                <i class="fas fa-fist-raised"></i> CORPO A CORPO
                            </label>
                            <label class="seg-btn {action.style === 'ranged' ? 'active' : ''}">
                                <input type="radio" bind:group={action.style} value="ranged" {disabled} class="hidden-radio">
                                <i class="fas fa-crosshairs"></i> À DISTÂNCIA
                            </label>
                        </div>
                    </div>
                    
                    <div class="module">
                        <span class="mod-title"><i class="fas fa-fire"></i> BALÍSTICA E IMPACTO</span>
                        <div class="tactic-grid">
                            <label class="stat-lbl">DANO: <input type="number" min="0" bind:value={action.weapon.dmg} {disabled}></label>
                            <label class="stat-lbl">PEN: <input type="number" min="0" bind:value={action.weapon.pen} {disabled}></label>
                            <select bind:value={action.weapon.penType} {disabled} class="mini-select">
                                <option value="fisica">Física</option>
                                <option value="nao-fisica">Não-Física</option>
                                <option value="verdadeira">Verdadeira</option>
                            </select>
                            
                            {#if action.style === 'ranged'}
                                <label class="stat-lbl highlight">SPRAY: <input type="number" min="0" bind:value={action.weapon.spray} {disabled}></label>
                                <label class="check-lbl"><input type="checkbox" bind:checked={action.weapon.isSlow} {disabled}> Arma Lenta</label>
                            {:else}
                                <label class="check-lbl"><input type="checkbox" bind:checked={action.weapon.isThrownObject} {disabled}> Arremesso Pesado</label>
                            {/if}
                        </div>
                    </div>

                    {#if action.style === 'ranged'}
                        <div class="module">
                            <span class="mod-title"><i class="fas fa-wind"></i> AMBIENTE E PENALIDADES</span>
                            <div class="tactic-grid col-layout">
                                <select bind:value={action.env.range} {disabled} class="mini-select">
                                    <option value="curta">🎯 Alcance: Curto</option>
                                    <option value="longa">🎯 Alcance: Longo (-1D)</option>
                                    <option value="extrema">🎯 Alcance: Extremo (1 Gobble)</option>
                                </select>
                                <select bind:value={action.env.movement} {disabled} class="mini-select">
                                    <option value="parado">🏃 Movimento: Parado</option>
                                    <option value="lento">🏃 Movimento: &lt; 50% Vel. (-1D)</option>
                                    <option value="rapido">🏃 Movimento: &gt; 50% Vel. (1 Gobble)</option>
                                </select>
                            </div>
                        </div>
                    {/if}

                    <div class="module">
                        <span class="mod-title"><i class="fas fa-brain"></i> PREPARO E TÁTICA</span>
                        <div class="tactic-grid">
                            <label class="check-lbl"><input type="checkbox" bind:checked={action.tactics.calledShot} on:change={() => dispatch('updatePool')} {disabled}> Mirar Alvo (-1D)</label>
                            {#if action.tactics.calledShot}
                                <label class="stat-lbl warning">LOCAL: <input type="number" min="1" max="10" bind:value={action.tactics.targetLocation} {disabled}></label>
                            {/if}
                            <label class="check-lbl"><input type="checkbox" bind:checked={action.tactics.disarm} on:change={() => dispatch('updatePool')} {disabled}> Desarmar (-1D)</label>
                            <label class="stat-lbl info">MIRA LENTA: <input type="number" min="0" max="2" bind:value={action.tactics.aimingTurns} {disabled}> (Turnos)</label>
                        </div>
                    </div>
                {/if}

                {#if action.type === 'defesa'}
                    <div class="module full-width">
                        <div class="segmented-control">
                            <label class="seg-btn {action.defense.style === 'block' ? 'active' : ''}">
                                <input type="radio" bind:group={action.defense.style} value="block" {disabled} class="hidden-radio">
                                <i class="fas fa-shield-alt"></i> ESQUIVA / GOBBLE
                            </label>
                            <label class="seg-btn {action.defense.style === 'barrier' ? 'active' : ''}">
                                <input type="radio" bind:group={action.defense.style} value="barrier" {disabled} class="hidden-radio">
                                <i class="fas fa-cube"></i> ARMADURA / BARREIRA
                            </label>
                        </div>
                    </div>

                    {#if action.defense.style === 'block'}
                        <div class="module">
                            <span class="mod-title"><i class="fas fa-running"></i> MECÂNICA DE EVASÃO</span>
                            <div class="tactic-grid col-layout">
                                <label class="check-lbl"><input type="radio" bind:group={action.defense.defType} value="normal" {disabled}> Gobble Normal</label>
                                <label class="check-lbl"><input type="radio" bind:group={action.defense.defType} value="interferencia" {disabled}> Interferência</label>
                            </div>
                        </div>
                    {/if}

                    {#if action.defense.style === 'barrier'}
                        <div class="module">
                            <span class="mod-title"><i class="fas fa-layer-group"></i> ESTRUTURA FÍSICA</span>
                            <div class="tactic-grid">
                                <label class="stat-lbl">LAR: <input type="number" min="0" bind:value={action.defense.lar} {disabled}></label>
                                <label class="stat-lbl">HAR: <input type="number" min="0" bind:value={action.defense.har} {disabled}></label>
                                <label class="stat-lbl warning">HP/CARGA: <input type="number" min="0" bind:value={action.defense.hp} {disabled}></label>
                            </div>
                        </div>
                    {/if}

                    <div class="module">
                        <span class="mod-title"><i class="fas fa-stopwatch"></i> TEMPO E DURAÇÃO</span>
                        <div class="tactic-grid col-layout">
                            <label class="stat-lbl info">GO FIRST (+Vel): <input type="number" min="0" max="5" bind:value={action.defense.goFirst} {disabled}></label>
                            <label class="stat-lbl">DURAÇÃO: <input type="number" min="0" bind:value={action.defense.durationTurns} {disabled}> Turnos</label>
                            <label class="check-lbl"><input type="checkbox" bind:checked={action.defense.lastsWholeScene} {disabled}> Manter até Fim da Cena</label>
                        </div>
                    </div>
                {/if}

                {#if action.type === 'utilidade'}
                    <div class="module full-width">
                        <div class="segmented-control small">
                            <label class="seg-btn {action.utility.style === 'power' ? 'active' : ''}"><input type="radio" bind:group={action.utility.style} value="power" {disabled} class="hidden-radio"> PODER</label>
                            <label class="seg-btn {action.utility.style === 'heal' ? 'active' : ''}"><input type="radio" bind:group={action.utility.style} value="heal" {disabled} class="hidden-radio"> CURA</label>
                            <label class="seg-btn {action.utility.style === 'buff' ? 'active' : ''}"><input type="radio" bind:group={action.utility.style} value="buff" {disabled} class="hidden-radio"> BUFF</label>
                            <label class="seg-btn {action.utility.style === 'debuff' ? 'active' : ''}"><input type="radio" bind:group={action.utility.style} value="debuff" {disabled} class="hidden-radio"> DEBUFF</label>
                            <label class="seg-btn {action.utility.style === 'move' ? 'active' : ''}"><input type="radio" bind:group={action.utility.style} value="move" {disabled} class="hidden-radio"> MOVER</label>
                        </div>
                    </div>

                    {#if action.utility.style === 'power'}
                        <div class="module">
                            <span class="mod-title"><i class="fas fa-atom"></i> DIVISÃO CAPACITIVA</span>
                            <div class="tactic-grid">
                                <label class="stat-lbl">RANGE: <input type="number" min="0" bind:value={action.utility.power.range} {disabled}></label>
                                <label class="stat-lbl">MASS: <input type="number" min="0" bind:value={action.utility.power.mass} {disabled}></label>
                                <label class="stat-lbl info">SPEED: <input type="number" min="0" bind:value={action.utility.power.speed} {disabled}></label>
                                <label class="stat-lbl warning">CAPACITY: <input type="number" min="0" bind:value={action.utility.power.capacity} {disabled}></label>
                            </div>
                        </div>
                    {/if}

                    {#if action.utility.style === 'heal'}
                        <div class="module">
                            <span class="mod-title"><i class="fas fa-heartbeat"></i> VETOR MÉDICO</span>
                            <div class="tactic-grid col-layout">
                                <label class="check-lbl"><input type="radio" bind:group={action.utility.heal.type} value="active" {disabled}> Cura Direta</label>
                                <label class="check-lbl"><input type="radio" bind:group={action.utility.heal.type} value="regen" {disabled}> Regeneração / Turno</label>
                                <label class="stat-lbl info">PERÍCIA (+HP): <input type="number" min="0" bind:value={action.utility.skillBonus} {disabled}></label>
                                {#if action.utility.heal.type === 'active'}
                                    <label class="stat-lbl warning">MEMBRO (0=Todo): <input type="number" min="0" max="10" bind:value={action.utility.heal.targetLimb} {disabled}></label>
                                {:else}
                                    <label class="check-lbl"><input type="checkbox" bind:checked={action.utility.heal.regenOnDamage} {disabled}> Regenerar ao Sofrer Dano</label>
                                {/if}
                                <label class="stat-lbl">DURAÇÃO: <input type="number" min="0" bind:value={action.utility.duration} {disabled}></label>
                            </div>
                        </div>
                    {/if}

                    {#if action.utility.style === 'buff'}
                        <div class="module">
                            <span class="mod-title"><i class="fas fa-angle-double-up"></i> SUPORTE TÁTICO</span>
                            <div class="tactic-grid col-layout">
                                <label class="check-lbl"><input type="radio" bind:group={action.utility.buff.type} value="normal" {disabled}> Pool +D</label>
                                <label class="check-lbl"><input type="radio" bind:group={action.utility.buff.type} value="reaction" {disabled}> Defesa +D (Reação)</label>
                                <label class="check-lbl"><input type="radio" bind:group={action.utility.buff.type} value="spray" {disabled}> Multi-Defesa (Spray)</label>
                                <div style="display: flex; gap: 10px;">
                                    <label class="stat-lbl warning">VALOR: <input type="number" min="1" bind:value={action.utility.buff.amount} {disabled}></label>
                                    <label class="stat-lbl">DURAÇÃO: <input type="number" min="0" bind:value={action.utility.duration} {disabled}></label>
                                </div>
                            </div>
                        </div>
                    {/if}

                    {#if action.utility.style === 'debuff'}
                        <div class="module">
                            <span class="mod-title"><i class="fas fa-angle-double-down"></i> SABOTAGEM</span>
                            <div class="tactic-grid col-layout">
                                <label class="check-lbl"><input type="radio" bind:group={action.utility.debuff.type} value="normal" {disabled}> Redução Direta (-D)</label>
                                <label class="check-lbl"><input type="radio" bind:group={action.utility.debuff.type} value="interference" {disabled}> Interferência (-Sets)</label>
                                <div style="display: flex; gap: 10px;">
                                    <label class="stat-lbl warning">IMPACTO: <input type="number" min="1" bind:value={action.utility.debuff.amount} {disabled}></label>
                                    <label class="stat-lbl">DURAÇÃO: <input type="number" min="0" bind:value={action.utility.duration} {disabled}></label>
                                </div>
                            </div>
                        </div>
                    {/if}

                    {#if action.utility.style === 'move'}
                        <div class="module">
                            <span class="mod-title"><i class="fas fa-shoe-prints"></i> REPOSICIONAMENTO</span>
                            <div class="tactic-grid">
                                <p style="font-size: 10px; color: #888; margin: 0; line-height: 1.4; padding: 5px; border-left: 2px solid var(--c-primary); background: rgba(0,255,65,0.05);">
                                    Essa ação não exige rolagem de dados e aplicará um Gobble/Penalidade de -1D na pool principal.
                                </p>
                            </div>
                        </div>
                    {/if}
                {/if}
            </div>

            {#if action.type === 'ataque' || (action.type === 'utilidade' && action.utility.style === 'debuff')}
                <button class="toggle-effects-btn {action.maneuvers.length > 0 ? 'has-effects' : ''}" 
                        on:click={() => showSpecialEffects = !showSpecialEffects} {disabled}>
                    <i class="fas fa-dna"></i> 
                    {showSpecialEffects ? 'OCULTAR MUTAÇÕES / EFEITOS' : 'ADICIONAR MUTAÇÕES E MANOBRAS (-D)'}
                    {#if action.maneuvers.length > 0}
                        <span class="badge">{action.maneuvers.length} ATIVAS</span>
                    {/if}
                </button>

                {#if showSpecialEffects}
                    <SpecialEffectsPanel bind:action={action} {disabled} on:updatePool={() => dispatch('updatePool')} />
                {/if}
            {/if}
        </div>
    {/if}
</div>

<style>
    .action-card { background: rgba(10, 10, 15, 0.95); border: 1px solid #333; border-left: 4px solid var(--c-primary, #00ff41); border-radius: 6px; margin-bottom: 15px; display: flex; flex-direction: column; overflow: hidden; font-family: 'Share Tech Mono', monospace; transition: all 0.3s; }
    .action-card.disabled { opacity: 0.6; pointer-events: none; filter: grayscale(0.5); border-left-color: #555; }
    
    /* A MÁGICA DO FULLSCREEN DENTRO DA ÁREA */
    .action-card.focused { 
        position: absolute; inset: 10px; z-index: 100; margin: 0; 
        box-shadow: 0 0 50px rgba(0, 255, 65, 0.2), inset 0 0 20px rgba(0, 255, 65, 0.05); 
        border: 2px solid var(--c-primary, #00ff41);
    }
    .action-card.focused .ac-body { overflow-y: auto; flex: 1; padding: 20px; }

    .ac-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 15px; background: linear-gradient(90deg, rgba(255,255,255,0.05), transparent); border-bottom: 1px solid #222; }
    .ac-title { display: flex; align-items: center; gap: 10px; }
    .num { font-weight: bold; color: var(--c-primary); font-size: 16px; text-shadow: 0 0 5px var(--c-primary); }
    
    .type-select { background: #000; border: 1px solid #444; color: #fff; font-family: inherit; font-size: 12px; font-weight: bold; padding: 4px 8px; border-radius: 4px; outline: none; cursor: pointer; }
    .type-select.ataque { color: #f33; border-color: #f33; box-shadow: inset 0 0 5px rgba(255,0,0,0.5); }
    .type-select.defesa { color: #08f; border-color: #08f; box-shadow: inset 0 0 5px rgba(0,136,255,0.5); }
    .type-select.utilidade { color: #a855f7; border-color: #a855f7; box-shadow: inset 0 0 5px rgba(168,85,247,0.5); }

    .collapsed-preview { flex: 1; font-size: 11px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0 15px; font-style: italic; }
    
    .controls { display: flex; gap: 5px; }
    .btn-mini { background: #111; border: 1px solid #444; color: #aaa; width: 28px; height: 28px; border-radius: 4px; cursor: pointer; font-size: 12px; display: flex; justify-content: center; align-items: center; transition: 0.2s; }
    .btn-mini:hover { background: #222; color: #fff; border-color: #888; }
    .btn-mini.focus-btn { color: var(--c-primary); border-color: var(--c-primary); background: rgba(0,255,65,0.1); }
    .btn-mini.focus-btn:hover { background: var(--c-primary); color: #000; box-shadow: 0 0 10px var(--c-primary); }
    .btn-mini.danger:hover { background: #f33; color: #000; border-color: #f33; box-shadow: 0 0 10px #f33; }

    .ac-body { padding: 15px; display: flex; flex-direction: column; gap: 15px; }
    .desc-box { display: flex; align-items: center; background: #000; border: 1px solid #333; border-radius: 4px; padding: 5px 10px; gap: 10px; box-shadow: inset 0 2px 5px rgba(0,0,0,0.5); }
    .desc-box i { color: var(--c-primary); font-size: 12px; }
    .desc-input { flex: 1; background: transparent; border: none; color: #fff; font-family: inherit; font-size: 13px; outline: none; }

    .segmented-control { display: flex; width: 100%; background: #050505; border-radius: 6px; border: 1px solid #333; overflow: hidden; }
    .seg-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 8px 10px; font-size: 11px; font-weight: bold; color: #666; cursor: pointer; transition: 0.2s; text-align: center; }
    .seg-btn:hover { background: rgba(255,255,255,0.05); color: #fff; }
    .seg-btn.active { background: var(--c-primary); color: #000; box-shadow: inset 0 0 10px rgba(0,0,0,0.5); }
    .hidden-radio { display: none; }
    .segmented-control.small .seg-btn { padding: 6px 4px; font-size: 9px; }

    .tactic-modules { display: flex; flex-wrap: wrap; gap: 10px; align-items: stretch; }
    .module { flex: 1; min-width: 200px; background: #0d0d12; padding: 12px; border: 1px solid #222; border-radius: 6px; box-shadow: inset 0 0 15px rgba(0,0,0,0.4); }
    .module.full-width { flex: 100%; padding: 0; border: none; box-shadow: none; background: transparent; }
    .mod-title { display: flex; align-items: center; gap: 6px; font-size: 10px; color: #00aaff; font-weight: bold; margin-bottom: 10px; border-bottom: 1px dashed #222; padding-bottom: 5px; }
    
    .tactic-grid { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .tactic-grid.col-layout { flex-direction: column; align-items: flex-start; gap: 8px; }
    
    .stat-lbl { display: flex; align-items: center; gap: 6px; font-size: 10px; color: #888; font-weight: bold; background: #000; padding: 2px 2px 2px 8px; border-radius: 4px; border: 1px solid #333; }
    .stat-lbl input[type="number"] { width: 40px; background: transparent; border: none; border-left: 1px solid #333; color: #fff; text-align: center; font-family: inherit; font-size: 12px; font-weight: bold; outline: none; padding: 4px; }
    .stat-lbl.warning { border-color: #550000; color: #ff4444; } .stat-lbl.warning input { color: #ffaa00; border-left-color: #550000; }
    .stat-lbl.info { border-color: #002244; color: #00aaff; } .stat-lbl.info input { color: #00ffaa; border-left-color: #002244; }
    .stat-lbl.highlight { border-color: #4c1d95; color: #a855f7; } .stat-lbl.highlight input { color: #d8b4fe; border-left-color: #4c1d95; }

    .check-lbl { display: flex; align-items: center; gap: 6px; font-size: 10px; color: #aaa; cursor: pointer; transition: 0.2s; }
    .check-lbl:hover { color: #fff; }
    .check-lbl input { accent-color: var(--c-primary); width: 14px; height: 14px; cursor: pointer; }

    .mini-select { background: #000; color: #ccc; border: 1px solid #444; padding: 4px; font-size: 10px; font-family: inherit; border-radius: 4px; outline: none; flex: 1; min-width: 100px; }
    .toggle-effects-btn { width: 100%; background: #111; border: 1px dashed #444; color: #888; padding: 10px; cursor: pointer; font-family: inherit; font-size: 11px; font-weight: bold; border-radius: 6px; transition: 0.2s; display: flex; justify-content: center; align-items: center; gap: 8px; letter-spacing: 1px; margin-top: 5px; }
    .toggle-effects-btn:hover { background: #1a1a1a; color: #fff; border-color: #888; }
    .toggle-effects-btn.has-effects { border-color: var(--c-primary); color: var(--c-primary); border-style: solid; background: rgba(0,255,65,0.05); }
    .toggle-effects-btn .badge { background: var(--c-primary); color: #000; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 900; }

    .custom-scroll::-webkit-scrollbar { width: 6px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
</style>