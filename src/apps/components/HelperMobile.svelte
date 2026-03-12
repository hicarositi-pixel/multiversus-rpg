<script>
    import { slide, fade } from 'svelte/transition';
    import { createEventDispatcher } from 'svelte';
    import { FichaMobileLogic } from '../../../Logic/FichaMobile.js';
    import { EffectLogic } from '../../../Logic/effect.js';

    export let actor;
    export let data; // Dados recebidos do MobileHUD

    const dispatch = createEventDispatcher();

    // --- ESTADO DO HELPER ---
    let selectedAttributeForCaps = 'body'; 
    let calculatedCaps = null;

    // --- CÁLCULO DINÂMICO DE CAPACIDADES ---
    // Recalcula sempre que o ator ou o atributo escolhido mudar
    $: if (actor && selectedAttributeForCaps) {
        calculatedCaps = EffectLogic.calculateBodyMetrics(actor, { baseStat: selectedAttributeForCaps });
    }

    // --- LÓGICA DE ROLAGEM ---
    // Quando clicar no dado, ele envia a Pool formatada para o MobileHUD abrir o RollEngine
    function requestPowerRoll(power) {
        const rollData = FichaMobileLogic.preparePowerRoll(actor, power.id);
        if (rollData) {
            dispatch('roll', { actionName: rollData.actionName, pool: rollData.pool });
        }
    }
</script>

<div class="helper-container custom-scroll">
    
    <section class="helper-section">
        <div class="section-header">
            <h3>CAPACIDADES FÍSICAS</h3>
            <select bind:value={selectedAttributeForCaps} class="attr-select" title="Atributo Base">
                <option value="body">Corpo (Físico)</option>
                <option value="coordination">Coordenação</option>
                <option value="mind">Mente (Telecinese)</option>
            </select>
        </div>

        {#if calculatedCaps}
            <div class="caps-grid" transition:fade>
                <div class="cap-card">
                    <span class="cap-label">Massa / Levantar</span>
                    <span class="cap-value">{calculatedCaps.lift}</span>
                </div>
                <div class="cap-card">
                    <span class="cap-label">Arremesso</span>
                    <span class="cap-value">{calculatedCaps.throw}</span>
                </div>
                <div class="cap-card">
                    <span class="cap-label">Corrida (Sprint)</span>
                    <span class="cap-value">{calculatedCaps.sprint}</span>
                </div>
                <div class="cap-card">
                    <span class="cap-label">Salto (L / A)</span>
                    <span class="cap-value">{calculatedCaps.jumpLength} / {calculatedCaps.jumpHeight}</span>
                </div>
            </div>
        {/if}
    </section>

    <section class="helper-section">
        <div class="section-header">
            <h3>PODERES E CAPACIDADES</h3>
        </div>

        <div class="powers-list">
            {#each data.powers as power}
                <div class="power-row">
                    <div class="power-icon-wrap">
                        <img src={power.img} alt="P" class="power-icon"/>
                    </div>
                    <div class="power-info">
                        <span class="power-name">{power.name}</span>
                        <div class="power-tags">
                            {#each power.qualitiesData as q}
                                <span class="q-tag" class:atk={q.type==='atk'} class:def={q.type==='def'} class:util={q.type==='util'}>
                                    {q.name} ({q.level})
                                </span>
                            {/each}
                        </div>
                    </div>
                    <div class="power-action">
                        <span class="power-dice">{power.dice.d}D | {power.dice.hd}HD | {power.dice.wd}WD</span>
                        <button class="roll-btn" on:click={() => requestPowerRoll(power)} title="Rolar Poder">
                            <i class="fas fa-dice-d20"></i>
                        </button>
                    </div>
                </div>
            {/each}

            {#if data.powers.length === 0}
                <div class="empty-state">
                    <i class="fas fa-biohazard" style="font-size: 24px; opacity: 0.3; margin-bottom: 5px;"></i>
                    <p>Nenhuma anomalia ou poder detectado neste hospedeiro.</p>
                </div>
            {/if}
        </div>
    </section>
</div>

<style>
    /* Utiliza as variáveis CSS (--primary) passadas pelo Pai (MobileHUD) */
    
    .helper-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .helper-section {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid #222;
        border-radius: 6px;
        padding: 10px;
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px dashed var(--primary);
        padding-bottom: 5px;
        margin-bottom: 10px;
    }

    .section-header h3 {
        margin: 0;
        font-size: calc(11px * var(--res));
        color: var(--primary);
        text-shadow: 0 0 5px rgba(0,0,0,0.8);
    }

    /* SELETOR DE ATRIBUTO */
    .attr-select {
        background: #111;
        color: var(--primary);
        border: 1px solid var(--primary);
        font-family: inherit;
        font-size: calc(9px * var(--res));
        padding: 2px 4px;
        border-radius: 3px;
        outline: none;
    }

    /* GRID DE CAPACIDADES */
    .caps-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 6px;
    }

    .cap-card {
        background: #0a0a0a;
        border: 1px solid #333;
        border-radius: 4px;
        padding: 8px 5px;
        display: flex;
        flex-direction: column;
        text-align: center;
        box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
    }

    .cap-label {
        font-size: calc(8px * var(--res));
        color: #888;
        text-transform: uppercase;
        margin-bottom: 2px;
    }

    .cap-value {
        font-size: calc(11px * var(--res));
        font-weight: bold;
        color: #eee;
    }

    /* LISTA DE PODERES */
    .powers-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .power-row {
        display: flex;
        align-items: center;
        gap: 10px;
        background: #111;
        border: 1px solid #222;
        border-left: 3px solid var(--primary);
        padding: 6px;
        border-radius: 4px;
        transition: 0.2s;
    }
    .power-row:hover {
        background: #151515;
        border-color: #444;
    }

    .power-icon-wrap {
        width: calc(36px * var(--res));
        height: calc(36px * var(--res));
        border: 1px solid #444;
        border-radius: 4px;
        overflow: hidden;
    }

    .power-icon {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .power-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .power-name {
        font-size: calc(12px * var(--res));
        font-weight: bold;
        color: #fff;
        margin-bottom: 3px;
    }

    .power-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
    }

    .q-tag {
        font-size: calc(8px * var(--res));
        padding: 1px 4px;
        border-radius: 2px;
        background: #222;
        color: #aaa;
        border: 1px solid #333;
    }
    /* Cores especiais para as qualidades */
    .q-tag.atk { color: #ff4444; border-color: #551111; background: #220000; }
    .q-tag.def { color: #00aaff; border-color: #003355; background: #001122; }
    .q-tag.util { color: #ffaa00; border-color: #553300; background: #221100; }

    .power-action {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
    }

    .power-dice {
        font-size: calc(9px * var(--res));
        color: #888;
        font-weight: bold;
    }

    .roll-btn {
        background: transparent;
        color: var(--primary);
        border: 1px solid var(--primary);
        border-radius: 4px;
        padding: 4px 12px;
        cursor: pointer;
        font-size: calc(12px * var(--res));
        transition: 0.2s;
    }

    .roll-btn:hover {
        background: var(--primary);
        color: #000;
        box-shadow: 0 0 10px var(--primary);
    }
    
    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px 0;
        color: #555;
        text-align: center;
        font-size: calc(10px * var(--res));
    }
</style>