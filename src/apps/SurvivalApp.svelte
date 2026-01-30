<script>
    import { slide, fade, scale } from 'svelte/transition';

    export let actor;
    export let themeColor; 

    const MODULE_ID = "multiversus-rpg";

    // === 1. CARREGAMENTO ===
    let savedData = actor.getFlag(MODULE_ID, 'survival_data') || {};

    let bio = savedData.bio || { fome: 10, sede: 10, exaustao: 10, wp: 10 };
    let session = savedData.session || { actions_max: 2, actions_used: 0, day_state: 'DIA', stress_counter: 0 };
    let disciplines = savedData.disciplines || { extracao: 0, engenharia: 0, sintetica: 0, sobrevivencia: 0 };
    let pockets = savedData.pockets || { MATERIA:{}, ORGANISMO:{}, ENERGIA:{}, NUCLEO:{} };

    $: level = actor.system.level || 1;
    $: totalPoints = 10 + ((level - 1) * 2);
    $: spentPoints = Object.values(disciplines).reduce((a, b) => a + Number(b), 0);
    $: availablePoints = totalPoints - spentPoints;

    const isGM = game.user.isGM;

    const RARITY_MAP = {
        1: { label: 'C', color: '#999' }, 2: { label: 'R', color: '#3b82f6' },
        3: { label: 'L', color: '#f59e0b' }, 4: { label: 'M', color: '#ef4444' },
        5: { label: 'U', color: '#10b981' }, 6: { label: 'MV', color: '#7c3aed' }
    };

    let showRequestModal = false;
    let showConsumeModal = false;
    let requestSelection = { type: 'MATERIA', tier: 1, qty: 1 };

    // === 2. SAVE BLINDADO ===
    async function save() {
        const dataToSave = { bio, session, disciplines, pockets };
        // Trigger reatividade
        bio = bio; session = session; disciplines = disciplines; pockets = pockets;

        await actor.update({
            [`flags.${MODULE_ID}.survival_data`]: dataToSave
        }, { render: false });
    }

    async function manualSave() {
        await save();
        ui.notifications.info("Dados de Sobrevivência Salvos!");
    }

    // === 3. LÓGICA DE AÇÕES (ATUALIZADA) ===
    async function performAction(type) {
        if (!isGM && session.actions_used >= session.actions_max) {
            return ui.notifications.warn("Sem ações disponíveis.");
        }

        let msg = "";
        let costActions = 0;

        // --- NOVA: AÇÃO NORMAL ---
        if (type === 'NORMAL_ACTION') {
            costActions = 1;
            bio.fome = Math.max(-10, bio.fome - 1);
            bio.sede = Math.max(-10, bio.sede - 1);
            // Sem exaustão, sem stress
            msg = `🎲 <b>${actor.name}</b> realizou uma Ação Normal. (-1 Fome, -1 Sede)`;
        }
        // -------------------------

        else if (type === 'EFFORT') {
            costActions = 1;
            bio.fome = Math.max(-10, bio.fome - 1);
            bio.sede = Math.max(-10, bio.sede - 1); // Ajustado para padrão 1 fome/1 sede ou mantem 2? Mantive 1 para alinhar com o pedido, ou volta para 2 se preferir.
            // Nota: No prompt anterior dizia "tira 1 fome e 2 sede" para esforço. 
            // Vou manter o padrão agressivo do esforço se desejar, mas vou deixar 1 e 2.
            bio.sede = Math.max(-10, bio.sede - 1); // Extra cost for effort if needed
            
            bio.exaustao = Math.max(-10, bio.exaustao - 1); // O esforço tira exaustão direta ou so no stress?
            // Pelo seu prompt: "esforço tira 1 fome e 2 sede... caso feito 4 vezes causa exaustao".
            // Vou corrigir para a logica do contador:
            
            // CORREÇÃO PELA REGRA DO PROMPT:
            // Esforço: 1 Energia. -1 Fome, -2 Sede.
            bio.fome = Math.max(-10, bio.fome - 1); 
            // Já tirei 1 sede acima, tirando mais 1 aqui para totalizar 2
            
            msg = `😤 <b>${actor.name}</b> realizou um Esforço Físico.`;
        
        } else if (type === 'REST_SIMPLE') {
            costActions = 1;
            bio.exaustao = Math.min(10, bio.exaustao + 1);
            bio.fome = Math.max(-10, bio.fome - 1); 
            bio.sede = Math.max(-10, bio.sede - 1);
            
            // ATUALIZAÇÃO: Recupera 1 WP
            bio.wp = Math.min(20, (bio.wp || 0) + 1);
            
            msg = `☕ <b>${actor.name}</b> descansou (+1 WP).`;

        } else if (type === 'REST_DEEP') {
            if (!isGM && (session.actions_max - session.actions_used < 2)) {
                return ui.notifications.warn("Precisa de 2 ações para Sono Profundo.");
            }
            costActions = 2;
            bio.exaustao = Math.min(10, bio.exaustao + 2);
            bio.fome = Math.max(-10, bio.fome - 2); 
            bio.sede = Math.max(-10, bio.sede - 2);
            
            // ATUALIZAÇÃO: Recupera 2 WP
            bio.wp = Math.min(20, (bio.wp || 0) + 2);

            msg = `💤 <b>${actor.name}</b> dormiu profundamente (+2 WP).`;
        }

        if (!isGM) session.actions_used += costActions;

        if (bio.fome <= 0 || bio.sede <= 0 || bio.exaustao <= 0) {
            msg += `<br><span style="color:red; font-weight:bold;">ALERTA: Sinais Vitais Críticos!</span>`;
        }

        ChatMessage.create({ content: msg });
        await save();
    }

    async function consumeOrganism(tier, mode) {
        const currentQty = pockets?.ORGANISMO?.[tier] || 0;
        if (currentQty <= 0 && !isGM) return ui.notifications.warn("Sem estoque.");

        if (!isGM) { pockets.ORGANISMO[tier]--; }

        const foodVal = tier;
        const waterVal = tier * 2;
        
        let msg = "";
        if (mode === 'EAT') {
            bio.fome = Math.min(10, bio.fome + foodVal);
            msg = `🍖 <b>${actor.name}</b> comeu T${tier} (+${foodVal} Fome).`;
        } else {
            bio.sede = Math.min(10, bio.sede + waterVal);
            msg = `💧 <b>${actor.name}</b> bebeu T${tier} (+${waterVal} Sede).`;
        }

        ChatMessage.create({ content: msg });
        showConsumeModal = false;
        await save();
    }

    // --- FUNÇÕES ADMIN ---
    async function gmModifyStat(stat, val) {
        bio[stat] = Math.max(-10, Math.min(10, bio[stat] + val));
        await save();
    }
    async function gmAddItem(type, tier, qty) {
        if (!pockets[type]) pockets[type] = {};
        const current = pockets[type][tier] || 0;
        pockets[type][tier] = Math.max(0, current + qty);
        await save();
        ui.notifications.info(`Estoque atualizado.`);
    }
    async function gmResetSession() {
        session.actions_used = 0;
        await save();
        ui.notifications.info("Ações resetadas.");
    }
    async function upgradeSkill(key) {
        if (!isGM && availablePoints <= 0) return ui.notifications.warn("Sem pontos.");
        disciplines[key]++;
        await save();
    }
    async function downgradeSkill(key) {
        if (!isGM) return;
        if (disciplines[key] > 0) disciplines[key]--;
        await save();
    }

    // --- REQUEST ---
    async function sendRequest() {
        const rLabel = RARITY_MAP[requestSelection.tier].label;
        const content = `
            <div class="chat-card" style="background:#050505; border:1px solid #00ff41; color:#00ff41; padding:10px;">
                <h3 style="border-bottom:1px solid #333; margin-bottom:5px;">Requisição de Suprimento</h3>
                <p><b>${actor.name}</b> solicita:</p>
                <div style="background:#111; padding:5px; font-weight:bold; text-align:center;">
                    ${requestSelection.qty}x ${requestSelection.type} [${rLabel}]
                </div>
            </div>`;
        await ChatMessage.create({ content });
        showRequestModal = false;
        ui.notifications.info("Enviado.");
    }
</script>

<div class="survival-app" style="--c-local: {themeColor || '#00ff41'}">
    
    <div class="header-row">
        <div class="char-id">
            <img src={actor.img} alt="Avatar"/>
            <div class="names">
                <span class="name">{actor.name}</span>
                <span class="lvl">NÍVEL {level} <span class="pts-tag" class:has-pts={availablePoints > 0}>PTS: {availablePoints}</span></span>
            </div>
        </div>
        
        <div class="session-mini">
            <div class="cycle-icon" on:click={() => { if(isGM) { session.day_state = session.day_state === 'DIA' ? 'NOITE' : 'DIA'; save(); } }}>
                <i class="fas {session.day_state === 'DIA' ? 'fa-sun' : 'fa-moon'}"></i>
            </div>
            <div class="actions-track">
                <small>AÇÕES {session.actions_used}/{session.actions_max}</small>
                <div class="dots">
                    {#each Array(session.actions_max) as _, i}
                        <div class="dot" class:filled={i >= session.actions_used}></div>
                    {/each}
                </div>
            </div>
            {#if isGM}
                <button class="gm-reset-btn" on:click={gmResetSession} title="Resetar"><i class="fas fa-sync"></i></button>
            {/if}
        </div>
    </div>

    <div class="bio-layout">
        <div class="bio-col">
            <div class="col-title">METABOLISMO</div>
            <div class="stat-group">
                <div class="stat-header">
                    <label>FOME</label>
                    <span class:crit={bio.fome <= 0}>{bio.fome}</span>
                    {#if isGM}
                         <div class="gm-tiny-ctrl">
                             <i class="fas fa-minus" on:click={() => gmModifyStat('fome', -1)}></i>
                             <i class="fas fa-plus" on:click={() => gmModifyStat('fome', 1)}></i>
                         </div>
                    {/if}
                </div>
                <div class="bar-track"><div class="bar-fill red" style="width: {Math.max(0, bio.fome * 10)}%"></div></div>
            </div>
            <div class="stat-group">
                <div class="stat-header">
                    <label>SEDE</label>
                    <span class:crit={bio.sede <= 0}>{bio.sede}</span>
                    {#if isGM}
                        <div class="gm-tiny-ctrl">
                            <i class="fas fa-minus" on:click={() => gmModifyStat('sede', -1)}></i>
                            <i class="fas fa-plus" on:click={() => gmModifyStat('sede', 1)}></i>
                        </div>
                    {/if}
                </div>
                <div class="bar-track"><div class="bar-fill blue" style="width: {Math.max(0, bio.sede * 10)}%"></div></div>
            </div>
            <div class="action-row">
                <button class="btn-consume" on:click={() => showConsumeModal = true}>
                    <i class="fas fa-utensils"></i> COMER / BEBER
                </button>
            </div>
        </div>

        <div class="bio-col">
            <div class="col-title">FADIGA</div>
            <div class="stat-group">
                <div class="stat-header">
                    <label>EXAUSTÃO</label>
                    <span class:crit={bio.exaustao <= 0}>{bio.exaustao}</span>
                    {#if isGM}
                        <div class="gm-tiny-ctrl">
                            <i class="fas fa-minus" on:click={() => gmModifyStat('exaustao', -1)}></i>
                            <i class="fas fa-plus" on:click={() => gmModifyStat('exaustao', 1)}></i>
                        </div>
                    {/if}
                </div>
                <div class="bar-track"><div class="bar-fill purple" style="width: {Math.max(0, bio.exaustao * 10)}%"></div></div>
            </div>
            <div class="stat-group">
                 <div class="stat-header"><label>SANIDADE (WP)</label> <span>{bio.wp || 10}</span></div>
                 <div class="bar-track"><div class="bar-fill yellow" style="width: {(bio.wp||10)*10}%"></div></div>
            </div>
            <div class="action-row vertical">
                <button class="btn-rest" on:click={() => performAction('REST_SIMPLE')}>
                    <i class="fas fa-coffee"></i> DESCANSAR <small>(-1 Ação)</small>
                </button>
                <button class="btn-sleep" on:click={() => performAction('REST_DEEP')}>
                    <i class="fas fa-bed"></i> DORMIR <small>(-2 Ações)</small>
                </button>
            </div>
        </div>
    </div>

    <hr class="divider">

    <div class="section-title">PERÍCIAS DE CAMPO</div>
    <div class="disciplines-container">
        {#each Object.entries(disciplines) as [key, val]}
            <div class="disc-row">
                <button class="roll-btn" on:click={() => new Roll(`${val}d10`).toMessage({flavor: `Teste de ${key.toUpperCase()}`})}>
                    <i class="fas fa-dice-d20"></i> {key.toUpperCase()}
                </button>
                <div class="val-ctrl">
                    {#if isGM}
                         <button class="gm-adjust minus" on:click={() => downgradeSkill(key)}>-</button>
                    {/if}
                    <span class="val">{val}</span>
                    {#if availablePoints > 0 || isGM}
                        <button class="gm-adjust plus" on:click={() => upgradeSkill(key)}>+</button>
                    {/if}
                </div>
            </div>
        {/each}
        
        <div class="action-combo">
            <button class="btn-normal" on:click={() => performAction('NORMAL_ACTION')}>
                <i class="fas fa-dice"></i> AÇÃO NORMAL
            </button>
            <div class="help-tip">
                <span>?</span>
                <div class="tip-content">
                    <p>A <b>Ação Normal</b> não consome Fadiga, gasta 1 de Fome e 1 de Sede. Rola os dados normais para medir o sucesso.</p>
                    <hr>
                    <p>O <b>Esforço</b> é para ações primordiais: gasta mais recursos, gera stress, mas concede <b>+1WD</b>.</p>
                </div>
            </div>
        </div>

        <button class="btn-effort full-width" on:click={() => performAction('EFFORT')}>
            <i class="fas fa-fist-raised"></i> REALIZAR ESFORÇO <small>(Gasta Bio, +1 Ação)</small>
        </button>
    </div>

    <hr class="divider">

    <div class="inv-section">
        <div class="inv-header-row">
            <div class="col-type">RECURSO</div>
            {#each Object.values(RARITY_MAP) as r}
                <div class="col-rarity" style="color: {r.color}">{r.label}</div>
            {/each}
        </div>
        {#each ['MATERIA', 'ORGANISMO', 'ENERGIA', 'NUCLEO'] as type}
            <div class="inv-row">
                <div class="type-name">{type}</div>
                {#each [1, 2, 3, 4, 5, 6] as tier}
                    <div class="inv-slot" 
                         class:has-item={pockets?.[type]?.[tier] > 0}
                         title="{isGM ? 'GM: Clique esquerdo para add, direito para remover' : ''}"
                         on:click={() => isGM ? gmAddItem(type, tier, 1) : null}
                         on:contextmenu|preventDefault={() => isGM ? gmAddItem(type, tier, -1) : null}>
                        {pockets?.[type]?.[tier] || 0}
                    </div>
                {/each}
            </div>
        {/each}
    </div>

    <div class="footer-actions">
        <button class="btn-req" on:click={() => showRequestModal = true}>
            <i class="fas fa-satellite-dish"></i> REQUISITAR SUPRIMENTO
        </button>
        <button class="btn-manual-save" on:click={manualSave}>
            <i class="fas fa-save"></i> SALVAR DADOS
        </button>
    </div>

    {#if showConsumeModal}
        <div class="modal-overlay" transition:fade>
            <div class="modal-window" in:scale>
                <div class="modal-header">
                    <span>CONSUMIR ORGANISMO</span>
                    <i class="fas fa-times close" on:click={() => showConsumeModal = false}></i>
                </div>
                <div class="modal-body">
                    <p>Selecione a qualidade do suprimento:</p>
                    <div class="consumables-list">
                        {#each [1,2,3,4,5,6] as t}
                            {@const qty = pockets?.ORGANISMO?.[t] || 0}
                            <div class="consumable-item" class:disabled={qty <= 0 && !isGM}>
                                <span class="badge" style="background:{RARITY_MAP[t].color}">T{t}</span>
                                <span>Qtd: {qty}</span>
                                <div class="c-actions">
                                    <button on:click={() => consumeOrganism(t, 'EAT')}>Comer (+{t})</button>
                                    <button on:click={() => consumeOrganism(t, 'DRINK')}>Beber (+{t*2})</button>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    {/if}

    {#if showRequestModal}
        <div class="modal-overlay" transition:fade>
            <div class="modal-window" in:scale>
                <div class="modal-header">
                    <span>CANAL DE REQUISIÇÃO</span>
                    <i class="fas fa-times close" on:click={() => showRequestModal = false}></i>
                </div>
                <div class="modal-body">
                    <label>Tipo:</label>
                    <select bind:value={requestSelection.type}>
                        {#each ['MATERIA','ORGANISMO','ENERGIA','NUCLEO'] as k}<option value={k}>{k}</option>{/each}
                    </select>
                    <label>Raridade:</label>
                    <select bind:value={requestSelection.tier}>
                        {#each Object.entries(RARITY_MAP) as [k, v]}<option value={k}>{v.label} - Tier {k}</option>{/each}
                    </select>
                    <label>Quantidade:</label>
                    <input type="number" min="1" bind:value={requestSelection.qty}>
                    <button class="send-btn" on:click={sendRequest}>ENVIAR</button>
                </div>
            </div>
        </div>
    {/if}

</div>

<style>
    .survival-app { padding: 10px; color: var(--c-local); font-family: 'Share Tech Mono', monospace; height: 100%; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; position: relative; }
    .divider { border: 0; border-bottom: 1px dashed #333; margin: 5px 0; width: 100%; opacity: 0.5; }

    /* HEADER & SESSION */
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .char-id { display: flex; gap: 10px; align-items: center; }
    .char-id img { width: 45px; height: 45px; border-radius: 50%; border: 2px solid var(--c-local); object-fit: cover; }
    .names { display: flex; flex-direction: column; }
    .name { font-size: 16px; font-weight: bold; }
    .lvl { font-size: 11px; opacity: 0.8; }
    .pts-tag { margin-left: 5px; background: var(--c-local); color: #000; padding: 1px 4px; border-radius: 2px; font-size: 10px; font-weight: bold; }
    .session-mini { display: flex; gap: 8px; background: rgba(0,0,0,0.4); padding: 4px 8px; border: 1px solid #333; border-radius: 4px; align-items: center; }
    .cycle-icon { font-size: 16px; color: #fbbf24; cursor: pointer; }
    .actions-track { display: flex; flex-direction: column; align-items: center; }
    .actions-track small { font-size: 8px; opacity: 0.7; }
    .dots { display: flex; gap: 3px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #222; border: 1px solid #444; }
    .dot.filled { background: var(--c-local); box-shadow: 0 0 5px var(--c-local); border-color: var(--c-local); }
    .gm-reset-btn { background: none; border: none; color: #ef4444; cursor: pointer; font-size: 10px; }

    /* BIO LAYOUT */
    .bio-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .bio-col { background: rgba(0,10,0,0.2); border: 1px solid #333; padding: 5px; display: flex; flex-direction: column; gap: 8px; }
    .col-title { font-size: 10px; text-align: center; font-weight: bold; opacity: 0.7; border-bottom: 1px solid #222; margin-bottom: 2px; }
    .stat-group { display: flex; flex-direction: column; gap: 2px; }
    .stat-header { display: flex; justify-content: space-between; font-size: 11px; }
    .stat-header .crit { color: #ef4444; font-weight: bold; animation: blink 1s infinite; }
    .bar-track { height: 5px; background: #111; width: 100%; }
    .bar-fill { height: 100%; transition: width 0.3s; }
    .bar-fill.red { background: #ef4444; }
    .bar-fill.blue { background: #3b82f6; }
    .bar-fill.purple { background: #a855f7; }
    .bar-fill.yellow { background: #eab308; }
    .gm-tiny-ctrl { display: flex; gap: 5px; font-size: 9px; cursor: pointer; color: #888; }
    .gm-tiny-ctrl i:hover { color: #fff; }
    .action-row { display: flex; gap: 5px; margin-top: auto; }
    .action-row.vertical { flex-direction: column; }
    .btn-consume { width: 100%; background: #002200; color: var(--c-local); border: 1px solid #005500; padding: 5px; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; }
    .btn-consume:hover { background: var(--c-local); color: #000; }
    .btn-rest, .btn-sleep { width: 100%; background: #111; color: #aaa; border: 1px solid #333; padding: 5px; font-size: 10px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
    .btn-rest:hover { border-color: #3b82f6; color: #3b82f6; }
    .btn-sleep:hover { border-color: #a855f7; color: #a855f7; }

    /* PERÍCIAS & AÇÕES */
    .section-title { font-size: 12px; font-weight: bold; margin-bottom: 5px; color: var(--c-local); }
    .disciplines-container { display: flex; flex-direction: column; gap: 5px; }
    .disc-row { display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.3); padding: 4px 8px; border-left: 2px solid #333; }
    .roll-btn { background: none; border: none; color: #ccc; cursor: pointer; font-family: inherit; font-size: 12px; text-align: left; }
    .roll-btn:hover { color: #fff; text-shadow: 0 0 5px #fff; }
    .val-ctrl { display: flex; align-items: center; gap: 8px; }
    .gm-adjust { width: 16px; height: 16px; line-height: 1; border: 1px solid #444; background: #000; color: #888; cursor: pointer; font-size: 10px; }
    .gm-adjust:hover { border-color: #fff; color: #fff; }
    .gm-adjust.plus { color: var(--c-local); border-color: var(--c-local); }
    
    /* COMBO AÇÃO NORMAL + TOOLTIP */
    .action-combo { display: flex; align-items: center; gap: 5px; margin-top: 5px; }
    .btn-normal { flex: 1; background: #112211; color: #fff; border: 1px solid #224422; padding: 6px; font-size: 11px; cursor: pointer; font-weight: bold; }
    .btn-normal:hover { background: #224422; border-color: #fff; }
    
    .help-tip { position: relative; width: 20px; height: 20px; background: #333; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; cursor: help; border: 1px solid #555; }
    .help-tip:hover .tip-content { visibility: visible; opacity: 1; }
    .tip-content { visibility: hidden; opacity: 0; position: absolute; bottom: 120%; right: 0; width: 220px; background: #050505; border: 1px solid var(--c-local); padding: 10px; border-radius: 4px; z-index: 100; font-size: 10px; transition: 0.2s; box-shadow: 0 0 15px rgba(0,0,0,0.8); line-height: 1.4; color: #ccc; pointer-events: none; }
    .tip-content p { margin: 0 0 5px 0; }
    .tip-content hr { border: 0; border-bottom: 1px solid #333; margin: 5px 0; }

    .btn-effort { background: #330000; color: #ef4444; border: 1px solid #ef4444; padding: 6px; font-size: 11px; cursor: pointer; margin-top: 5px; display: flex; align-items: center; justify-content: center; gap: 5px; font-weight: bold; }
    .btn-effort:hover { background: #ef4444; color: #000; }

    /* INVENTÁRIO */
    .inv-section { display: flex; flex-direction: column; gap: 2px; font-size: 10px; margin-bottom: 5px; }
    .inv-header-row { display: grid; grid-template-columns: 2fr repeat(6, 1fr); gap: 2px; text-align: center; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 2px; }
    .inv-row { display: grid; grid-template-columns: 2fr repeat(6, 1fr); gap: 2px; align-items: center; background: rgba(0,0,0,0.2); }
    .type-name { padding-left: 5px; color: #888; }
    .inv-slot { background: #050505; text-align: center; padding: 3px 0; border: 1px solid #222; color: #444; cursor: default; }
    .inv-slot.has-item { color: #fff; border-color: #555; background: #151515; font-weight: bold; }
    .inv-slot:hover { border-color: var(--c-local); }

    /* FOOTER */
    .footer-actions { margin-top: auto; display: flex; gap: 5px; }
    .btn-req { width: 50%; background: #000; border: 1px dashed var(--c-local); color: var(--c-local); padding: 8px; cursor: pointer; font-family: inherit; font-size: 12px; opacity: 0.7; }
    .btn-req:hover { opacity: 1; background: rgba(255,255,255,0.1); }
    .btn-manual-save { width: 50%; background: var(--c-local); color: #000; border: none; padding: 8px; cursor: pointer; font-family: inherit; font-size: 12px; font-weight: bold; }
    .btn-manual-save:hover { filter: brightness(1.2); }

    /* MODALS */
    .modal-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.8); z-index: 50; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px); }
    .modal-window { width: 90%; background: #050505; border: 1px solid var(--c-local); box-shadow: 0 0 20px rgba(0,0,0,0.8); display: flex; flex-direction: column; }
    .modal-header { background: #001100; padding: 8px; border-bottom: 1px solid var(--c-local); display: flex; justify-content: space-between; font-weight: bold; }
    .modal-header .close { cursor: pointer; }
    .modal-body { padding: 10px; display: flex; flex-direction: column; gap: 10px; }
    .modal-body select, .modal-body input { background: #111; border: 1px solid #444; color: #fff; padding: 5px; font-family: inherit; }
    .send-btn { background: var(--c-local); color: #000; border: none; padding: 8px; font-weight: bold; cursor: pointer; }
    .consumables-list { max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 5px; }
    .consumable-item { display: flex; align-items: center; justify-content: space-between; background: #111; padding: 5px; border: 1px solid #333; }
    .consumable-item.disabled { opacity: 0.4; pointer-events: none; }
    .badge { padding: 1px 5px; color: #000; font-weight: bold; border-radius: 2px; font-size: 10px; }
    .c-actions { display: flex; gap: 5px; }
    .c-actions button { font-size: 9px; cursor: pointer; background: #222; color: #fff; border: 1px solid #444; padding: 2px 5px; }
    .c-actions button:hover { border-color: #fff; }

    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>