<script>
    import { slide } from 'svelte/transition';
    import { createEventDispatcher } from 'svelte';
    import SpecialEffectsPanel from './SpecialEffectsPanel.svelte';

    export let action; 
    export let index;
    export let disabled = false;
    export let dashboardData = null; // Dados puxados do FichaMobileLogic

    const dispatch = createEventDispatcher();
    let isCollapsed = false;
    let showSpecialEffects = false;

    // Quando o jogador escolhe uma Perícia/Poder do menu dropdown
    function handleSourceChange() {
        if (!dashboardData || action.sourceId === 'custom') return;
        
        if (action.sourceId.startsWith('stat_')) {
            const statKey = action.sourceId.split('_')[1];
            const val = dashboardData.stats[statKey]?.value || 1;
            action.basePool = { d: val, hd: 0, wd: 0 };
        } else if (action.sourceId.startsWith('power_')) {
            const pId = action.sourceId.split('_')[1];
            const power = dashboardData.powers.find(p => p.id === pId);
            if (power) {
                action.basePool = { d: power.dice.d, hd: power.dice.hd, wd: power.dice.wd };
                // Auto-preenche dano se o poder for de ataque
                const atkQ = power.qualitiesData?.find(q => q.type === 'atk');
                if (atkQ) action.weapon.dmg = atkQ.level;
            }
        }
        dispatch('updatePool');
    }
</script>

<div class="action-card" class:disabled>
    <div class="ac-header">
        <span class="num">0{index + 1}</span>
        <select bind:value={action.type} {disabled} class="type-select {action.type}">
            <option value="ataque">ATAQUE</option>
            <option value="defesa">DEFESA</option>
            <option value="utilidade">UTILIDADE</option>
        </select>

        {#if dashboardData}
            <select class="source-select" bind:value={action.sourceId} on:change={handleSourceChange} {disabled}>
                <option value="custom">Manual (Base Geral)</option>
                <optgroup label="Atributos Base">
                    {#each Object.entries(dashboardData.stats) as [key, stat]}
                        <option value="stat_{key}">{key.toUpperCase()} [{stat.value}d]</option>
                    {/each}
                </optgroup>
                {#if dashboardData.powers.length > 0}
                    <optgroup label="Poderes / Anomalias">
                        {#each dashboardData.powers as power}
                            <option value="power_{power.id}">{power.name} [{power.dice.d}d {power.dice.hd}hd {power.dice.wd}wd]</option>
                        {/each}
                    </optgroup>
                {/if}
            </select>
        {/if}

        {#if isCollapsed}
            <span class="collapsed-preview">{action.desc || "..."}</span>
        {/if}

        <div class="controls">
            <button class="btn-mini" on:click={() => isCollapsed = !isCollapsed}>{isCollapsed ? '▼' : '▲'}</button>
            <button class="btn-mini danger" on:click={() => dispatch('remove')} {disabled}>×</button>
        </div>
    </div>

    {#if !isCollapsed}
        <div class="ac-body" transition:slide>
            <input type="text" class="desc-input" placeholder="Descreva a narrativa da ação..." bind:value={action.desc} {disabled}>
            
            <div class="tactic-modules">

                {#if action.type === 'ataque'}
                    <div class="module full-width">
                        <div class="radio-bar">
                            <label><input type="radio" bind:group={action.style} value="melee" {disabled}> Corpo a Corpo</label>
                            <label><input type="radio" bind:group={action.style} value="ranged" {disabled}> À Distância</label>
                        </div>
                    </div>
                    
                    <div class="module">
                        <span class="mod-title">DADOS DA ARMA/PODER</span>
                        <div class="tactic-grid">
                            <label>DMG: <input type="number" bind:value={action.weapon.dmg} {disabled}></label>
                            <label>PEN: <input type="number" bind:value={action.weapon.pen} {disabled}></label>
                            <select bind:value={action.weapon.penType} {disabled} class="mini-select">
                                <option value="fisica">Pen: Física</option>
                                <option value="nao-fisica">Pen: Não-Física</option>
                                <option value="verdadeira">Pen: Verdadeira</option>
                            </select>
                            
                            {#if action.style === 'ranged'}
                                <label>Spray: <input type="number" min="0" bind:value={action.weapon.spray} {disabled}></label>
                                <label><input type="checkbox" bind:checked={action.weapon.isSlow} {disabled}> Arma Lenta</label>
                            {:else}
                                <label><input type="checkbox" bind:checked={action.weapon.isThrownObject} {disabled}> Objeto Arremessado</label>
                            {/if}
                        </div>
                    </div>

                    {#if action.style === 'ranged'}
                        <div class="module">
                            <span class="mod-title">AMBIENTE (Penalidades)</span>
                            <div class="tactic-grid col-layout">
                                <select bind:value={action.env.range} {disabled} class="mini-select">
                                    <option value="curta">Alcance: Curto</option>
                                    <option value="longa">Alcance: Longo (-1D)</option>
                                    <option value="extrema">Alcance: Extremo (1 Gobble)</option>
                                </select>
                                <select bind:value={action.env.movement} {disabled} class="mini-select">
                                    <option value="parado">Movimento: Parado</option>
                                    <option value="lento">Movimento: &lt; 50% vel. (-1D)</option>
                                    <option value="rapido">Movimento: &gt; 50% vel. (1 Gobble)</option>
                                </select>
                            </div>
                        </div>
                    {/if}

                    <div class="module">
                        <span class="mod-title">PREPARO TÁTICO (-D)</span>
                        <div class="tactic-grid">
                            <label><input type="checkbox" bind:checked={action.tactics.calledShot} on:change={() => dispatch('updatePool')} {disabled}> Mirar Local (-1D)</label>
                            {#if action.tactics.calledShot}
                                <label class="highlight">Local: <input type="number" min="1" max="10" bind:value={action.tactics.targetLocation} {disabled}></label>
                            {/if}
                            <label><input type="checkbox" bind:checked={action.tactics.disarm} on:change={() => dispatch('updatePool')} {disabled}> Desarmar (-1D)</label>
                            <label>Aguardar: <input type="number" min="0" max="2" bind:value={action.tactics.aimingTurns} {disabled}> turnos (+D)</label>
                        </div>
                    </div>
                {/if}

                {#if action.type === 'defesa'}
                    
                    <div class="module full-width">
                        <span class="mod-title">ESTILO DEFENSIVO</span>
                        <div class="radio-bar small-radio">
                            <label><input type="radio" bind:group={action.defense.style} value="block" {disabled}> Esquiva / Bloqueio (Gobble)</label>
                            <label><input type="radio" bind:group={action.defense.style} value="barrier" {disabled}> Barreira / Armadura Ativa</label>
                        </div>
                    </div>

                    {#if action.defense.style === 'block'}
                        <div class="module">
                            <span class="mod-title">MECÂNICA DE EVASÃO</span>
                            <div class="tactic-grid col-layout">
                                <label title="Requer Largura maior para apagar dados inimigos.">
                                    <input type="radio" bind:group={action.defense.defType} value="normal" {disabled}> Gobble Normal (Exige Vel. Maior)
                                </label>
                                <label title="Anula o ataque inimigo e também o seu ataque atual.">
                                    <input type="radio" bind:group={action.defense.defType} value="interferencia" {disabled}> Interferência (Anula mais rápido)
                                </label>
                            </div>
                        </div>
                    {/if}

                    {#if action.defense.style === 'barrier'}
                        <div class="module">
                            <span class="mod-title">ESTRUTURA DA BARREIRA</span>
                            <div class="tactic-grid">
                                <label title="Armadura Leve (Converte Kill em Shock)">LAR: <input type="number" min="0" bind:value={action.defense.lar} {disabled}></label>
                                <label title="Armadura Pesada (Reduz dano bruto)">HAR: <input type="number" min="0" bind:value={action.defense.har} {disabled}></label>
                                <label title="0 = Dura apenas o ataque atual">HP/Carga: <input type="number" min="0" bind:value={action.defense.hp} {disabled}></label>
                            </div>
                        </div>
                    {/if}

                    <div class="module">
                        <span class="mod-title">TEMPO E VELOCIDADE</span>
                        <div class="tactic-grid col-layout">
                            <label title="+1D na rolagem aumenta a chance de você agir primeiro.">
                                Buff Go First (Vel): <input type="number" min="0" max="5" bind:value={action.defense.goFirst} {disabled}>
                            </label>
                            <label title="Mantém esse Set rolando automaticamente por X turnos.">
                                Duração (Turnos): <input type="number" min="0" bind:value={action.defense.durationTurns} {disabled}>
                            </label>
                            <label><input type="checkbox" bind:checked={action.defense.lastsWholeScene} {disabled}> Reter Efeito até o Fim da Cena</label>
                        </div>
                    </div>

                {/if}

                {#if action.type === 'utilidade'}
                    
                    <div class="module full-width">
                        <span class="mod-title">VETOR DE UTILIDADE</span>
                        <div class="radio-bar small-radio" style="flex-wrap: wrap;">
                            <label><input type="radio" bind:group={action.utility.style} value="power" {disabled}> Alocar Poder</label>
                            <label><input type="radio" bind:group={action.utility.style} value="heal" {disabled}> Cura/Regen</label>
                            <label><input type="radio" bind:group={action.utility.style} value="buff" {disabled}> Buff (Aliado)</label>
                            <label><input type="radio" bind:group={action.utility.style} value="debuff" {disabled}> Debuff (Inimigo)</label>
                            <label><input type="radio" bind:group={action.utility.style} value="move" {disabled}> Movimentação</label>
                        </div>
                    </div>

                    {#if action.utility.style === 'power'}
                        <div class="module">
                            <span class="mod-title">DIVISÃO DA POOL DE DADOS (Capacidades)</span>
                            <div class="tactic-grid">
                                <label title="Distância do efeito">Alcance: <input type="number" min="0" bind:value={action.utility.power.range} {disabled}></label>
                                <label title="Peso ou tamanho afetado">Massa: <input type="number" min="0" bind:value={action.utility.power.mass} {disabled}></label>
                                <label title="Iniciativa extra ou aceleração">Velocidade: <input type="number" min="0" bind:value={action.utility.power.speed} {disabled}></label>
                                <label title="Poder bruto do efeito">Capacidade: <input type="number" min="0" bind:value={action.utility.power.capacity} {disabled}></label>
                            </div>
                        </div>
                    {/if}

                    {#if action.utility.style === 'heal'}
                        <div class="module">
                            <span class="mod-title">MECÂNICA DE RECUPERAÇÃO</span>
                            <div class="tactic-grid col-layout">
                                <label><input type="radio" bind:group={action.utility.heal.type} value="active" {disabled}> Cura Ativa (Imediata)</label>
                                <label><input type="radio" bind:group={action.utility.heal.type} value="regen" {disabled}> Regeneração Contínua</label>
                                <label>Bônus de Perícia (+Cura): <input type="number" min="0" bind:value={action.utility.skillBonus} {disabled}></label>
                                
                                {#if action.utility.heal.type === 'active'}
                                    <label class="highlight">Local Alvo (0=Tudo): <input type="number" min="0" max="10" bind:value={action.utility.heal.targetLimb} {disabled}></label>
                                    <label>Duração (0=Instantâneo): <input type="number" min="0" bind:value={action.utility.duration} {disabled}></label>
                                {:else}
                                    <label class="highlight"><input type="checkbox" bind:checked={action.utility.heal.regenOnDamage} {disabled}> Regen. por Interferência (Tick de Cura ao Sofrer Dano)</label>
                                    <label>Duração (0=Fim do Combate): <input type="number" min="0" bind:value={action.utility.duration} {disabled}></label>
                                {/if}
                            </div>
                        </div>
                    {/if}

                    {#if action.utility.style === 'buff'}
                        <div class="module">
                            <span class="mod-title">SUPORTE TÁTICO (BUFF)</span>
                            <div class="tactic-grid col-layout">
                                <label><input type="radio" bind:group={action.utility.buff.type} value="normal" {disabled}> Bônus Padrão (+D Geral)</label>
                                <label><input type="radio" bind:group={action.utility.buff.type} value="reaction" {disabled}> Buff de Reação (+D Defensivo)</label>
                                <label><input type="radio" bind:group={action.utility.buff.type} value="spray" {disabled}> Spray de Reação (Múltiplas Defesas)</label>
                                <label class="highlight">Dados Concedidos: <input type="number" min="1" bind:value={action.utility.buff.amount} {disabled}></label>
                                <label>Bônus de Perícia (+D): <input type="number" min="0" bind:value={action.utility.skillBonus} {disabled}></label>
                                <label>Duração (0=Fim do Combate): <input type="number" min="0" bind:value={action.utility.duration} {disabled}></label>
                            </div>
                        </div>
                    {/if}

                    {#if action.utility.style === 'debuff'}
                        <div class="module">
                            <span class="mod-title">SABOTAGEM TÁTICA (DEBUFF)</span>
                            <div class="tactic-grid col-layout">
                                <label><input type="radio" bind:group={action.utility.debuff.type} value="normal" {disabled}> Redução Direta (-D Inimigo)</label>
                                <label><input type="radio" bind:group={action.utility.debuff.type} value="interference" {disabled}> Interferência (-Conjuntos ORE)</label>
                                <label class="highlight">Impacto (-Quantidade): <input type="number" min="1" bind:value={action.utility.debuff.amount} {disabled}></label>
                                <label>Bônus de Perícia: <input type="number" min="0" bind:value={action.utility.skillBonus} {disabled}></label>
                                <label>Duração (0=Fim do Combate): <input type="number" min="0" bind:value={action.utility.duration} {disabled}></label>
                            </div>
                        </div>
                    {/if}

                    {#if action.utility.style === 'move'}
                        <div class="module">
                            <span class="mod-title">MOVIMENTAÇÃO ESTRATÉGICA</span>
                            <div class="tactic-grid">
                                <p style="font-size: 10px; color: #aaa; margin: 0; line-height: 1.4;">
                                    <i class="fas fa-running" style="color: var(--c-primary);"></i> 
                                    Essa ação não exige rolagem de dados. Ela conta como uma ação declarada, gerando o <strong>Custo Tático (-1D)</strong> padrão no sistema ORE para as suas outras ações.
                                </p>
                            </div>
                        </div>
                    {/if}
                    
                {/if}
            </div>

            {#if action.type === 'ataque' || (action.type === 'utilidade' && action.utility.style === 'debuff')}
                <button class="toggle-effects-btn {action.maneuvers.length > 0 ? 'has-effects' : ''}" 
                        on:click={() => showSpecialEffects = !showSpecialEffects} {disabled}>
                    <i class="fas fa-bolt"></i> 
                    {showSpecialEffects ? 'OCULTAR EFEITOS ESPECIAIS' : 'MANOBRAS / EFEITOS ESPECIAIS (-D)'}
                    {#if action.maneuvers.length > 0}
                        <span class="badge">{action.maneuvers.length} ATIVOS</span>
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
    .action-card { background: #0a0a0a; border: 1px solid #333; border-left: 3px solid var(--c-primary); border-radius: 4px; margin-bottom: 10px; display: flex; flex-direction: column; overflow: hidden; font-family: 'Share Tech Mono', monospace; }
    .action-card.disabled { opacity: 0.6; pointer-events: none; filter: grayscale(0.5); border-left-color: #555; }
    
    .ac-header { display: flex; align-items: center; gap: 10px; padding: 5px 10px; background: rgba(255,255,255,0.05); border-bottom: 1px solid #222; }
    .num { font-weight: bold; color: var(--c-primary); font-size: 14px; }
    
    .type-select { background: #000; border: 1px solid #444; color: #ccc; font-family: inherit; font-size: 11px; font-weight: bold; padding: 2px 5px; }
    .type-select.ataque { color: #f33; border-color: #500; }
    .type-select.defesa { color: #08f; border-color: #048; }
    .type-select.utilidade { color: #a855f7; border-color: #4c1d95; }

    .source-select { background: #001122; border: 1px dashed #00aaff; color: #00aaff; font-family: inherit; font-size: 10px; padding: 2px 5px; flex: 1; border-radius: 2px; }
    .source-select:focus { outline: none; background: #002244; }

    .collapsed-preview { flex: 1; font-size: 11px; opacity: 0.5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .controls { margin-left: auto; display: flex; gap: 4px; }
    .btn-mini { background: #111; border: 1px solid #444; color: #aaa; width: 22px; height: 22px; cursor: pointer; font-size: 10px; display: flex; justify-content: center; align-items: center; }
    .btn-mini:hover { color: #fff; border-color: #fff; }
    .btn-mini.danger:hover { color: #f33; border-color: #f33; }

    .ac-body { padding: 10px; display: flex; flex-direction: column; gap: 10px; }
    .desc-input { width: 100%; background: #000; border: 1px solid #333; color: #fff; padding: 8px; font-family: inherit; font-size: 12px; }
    
    .tactic-modules { display: flex; flex-wrap: wrap; gap: 8px; align-items: stretch; }
    .module { flex: 1; min-width: 180px; background: #111; padding: 8px; border: 1px solid #222; border-radius: 4px; }
    .module.full-width { flex: 100%; padding: 4px 8px; background: #050505; border-color: #333; border-style: dashed; }
    .mod-title { display: block; font-size: 9px; color: #888; font-weight: bold; margin-bottom: 6px; letter-spacing: 1px; border-bottom: 1px solid #222; padding-bottom: 3px; }
    
    .radio-bar { display: flex; gap: 15px; font-size: 11px; color: #ccc; font-weight: bold; }
    .radio-bar.small-radio { font-size: 9px; gap: 8px; background: #000; padding: 4px; border: 1px dashed #444; width: 100%; margin-top: 5px; }

    .tactic-grid { display: flex; flex-wrap: wrap; gap: 8px; font-size: 10px; color: #aaa; align-items: center; }
    .tactic-grid.col-layout { flex-direction: column; align-items: flex-start; gap: 5px; }
    .tactic-grid label { display: flex; align-items: center; gap: 4px; }
    .tactic-grid input[type="number"] { width: 35px; background: #000; border: 1px solid #444; color: #fff; text-align: center; padding: 2px; }
    .mini-select { background: #000; color: #ccc; border: 1px solid #444; padding: 2px; font-size: 9px; font-family: inherit; width: 100%; }
    .highlight { color: #ffaa00; font-weight: bold; }

    .toggle-effects-btn { width: 100%; background: #1a1a1a; border: 1px dashed #555; color: #aaa; padding: 8px; cursor: pointer; font-family: inherit; font-size: 10px; font-weight: bold; transition: 0.2s; display: flex; justify-content: center; align-items: center; gap: 8px; }
    .toggle-effects-btn:hover { background: #222; color: #fff; border-color: var(--c-primary); }
    .toggle-effects-btn.has-effects { border-color: var(--c-primary); color: var(--c-primary); border-style: solid; background: rgba(0,255,65,0.05); }
    .toggle-effects-btn .badge { background: var(--c-primary); color: #000; padding: 2px 6px; border-radius: 10px; font-size: 9px; }
</style>