<script>
    import { onMount } from 'svelte';
    import { slide, fade } from 'svelte/transition';
    import { XPDatabase } from '../XPDatabase.js'; // Certifique-se que o caminho está certo
    import { LevelCalculator } from '../LevelSystem.js';
    import { OriginDatabase } from '../OriginDatabase.js';

    export let actor;
    export let flags = {}; 
    export let system = {}; // Recebe o system para ler atributos

    // O tema vem das flags do ator ou usa verde padrão
    $: themeColor = flags.customColor || "#00ff41";

    const MODULE_ID = "multiversus-rpg";
    const BASE_POINTS_CAP = 150;

    // === 1. DADOS DE BIOGRAFIA ===
    $: loreContent = flags.bio_lore || "";
    $: localPsyche = flags.bio_psyche || "";
    $: localAppearance = flags.bio_appearance || "";
    $: motivations = flags.bio_motivations || [{ text: "", stars: 1 }];
    $: originUniverses = flags.bio_universes || [{ universe: "", theme: "" }];

    // === 2. SISTEMA DE VONTADE (WILLPOWER & BASE WILL) ===
    
    // Leitura dos Stats do Sistema (Ajuste conforme a estrutura do seu system.json)
    // Assumindo que Charm e Command estão em system.stats ou attributes
    $: statCharm = Number(system.stats?.charm?.value || system.attributes?.charm?.value || 0);
    $: statCommand = Number(system.stats?.command?.value || system.attributes?.command?.value || 0);
    
    // Pontos Comprados (Permanentes)
    $: boughtBaseWill = flags.boughtBaseWill || 0;
    $: boughtWillpower = flags.boughtWillpower || 0;

    // Cálculos de Totais
    // Base Will = (Charme + Comando) + Comprados
    $: maxBaseWill = statCharm + statCommand + boughtBaseWill;
    
    // Max Willpower = Base Will Total + Comprados
    $: maxWillpower = maxBaseWill + boughtWillpower;

    // Valores Atuais (Editáveis para dano/recuperação)
    $: currBaseWill = flags.currBaseWill !== undefined ? flags.currBaseWill : maxBaseWill;
    $: currWillpower = flags.currWillpower !== undefined ? flags.currWillpower : maxWillpower;

    // Custos de XP
    $: costBaseWill = boughtBaseWill * 3;
    $: costWillpower = boughtWillpower * 1;
    $: totalWillCost = costBaseWill + costWillpower;

    // === 3. LÓGICA DE PONTOS GERAIS ===
    
    // Custo de Universos
    $: universeCost = Math.max(0, originUniverses.length - 1) * 8;

    // XP Total
    $: currentXP = flags.xp || 0; // Fonte de verdade é a flag sincronizada
    $: totalPointsCap = BASE_POINTS_CAP + currentXP;

    // Custos Totais
    $: statsCost = flags.statsCost || 0;
    $: powersCost = flags.powersSpent || 0;

    // SOMA TOTAL E SALDO
    $: spentPoints = statsCost + powersCost + universeCost + totalWillCost;
    $: availablePoints = totalPointsCap - spentPoints;

    // Sincronia Inversa (Salvar totais)
    let saveTimeout;
    $: {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            actor.update({ 
                [`flags.${MODULE_ID}.bioSpent`]: universeCost,
                [`flags.${MODULE_ID}.willSpent`]: totalWillCost,
                [`flags.${MODULE_ID}.totalSpent`]: spentPoints
            }, { render: false });
        }, 1000);
    }

    // Barra Circular
    $: lvlInfo = LevelCalculator.getLevelInfo(currentXP);
    $: strokeDashoffset = 283 - (283 * lvlInfo.progress / 100);

    // === 4. ESTADOS DE UI ===
    let isSyncing = false;
    let activePopup = null;
    let originData = { name: "Desconhecido", icon: "❓", mechanic: {name: "N/A", desc: ""}, traits: [], desc: "", powers: "" };
    
    // === 5. AÇÕES ===

    async function updateFlag(key, value) {
        if (key === 'bio_universes') originUniverses = value;
        if (key === 'bio_motivations') motivations = value;
        await actor.update({ [`flags.${MODULE_ID}.${key}`]: value }, { render: false });
    }

    // SINCRONIZAÇÃO COM O GM (CORREÇÃO AQUI)
    async function importPlayerXP() {
        isSyncing = true;
        try {
            // 1. Pega ID do Usuário Dono (ou o atual se for dono)
            // Se o ator tiver um permission default, tentamos achar o dono
            const userId = game.user.id; 

            // 2. Busca no XPDatabase
            const xpData = await XPDatabase.getPlayerData(userId);
            
            // 3. Busca a Origem definida pelo GM na flag do Usuário
            const userOrigin = game.users.get(userId)?.getFlag(MODULE_ID, "origin");

            // 4. Atualiza o Ator
            const updates = {
                [`flags.${MODULE_ID}.xp`]: xpData.earnedXP || 0,
                [`flags.${MODULE_ID}.bio_group`]: xpData.group || "Sem Grupo"
            };

            if (userOrigin) {
                updates[`flags.${MODULE_ID}.origin`] = userOrigin;
            }

            await actor.update(updates, { render: false });
            
            // Recarrega dados visuais
            currentXP = xpData.earnedXP || 0;
            if (userOrigin) await loadOriginData(userOrigin);

            ui.notifications.info(`Sincronização: ${currentXP} XP recebidos. Origem atualizada.`);

        } catch (e) {
            console.error(e);
            ui.notifications.warn("Falha ao sincronizar com o Database. Verifique se o GM está online.");
        }
        isSyncing = false;
    }

    // Carregamento de Origem
    async function loadOriginData(originID) {
        try {
            const allOrigins = await OriginDatabase.load();
            originData = allOrigins[originID] || allOrigins["humano"] || originData;
        } catch (e) { console.warn("OriginDB Offline", e); }
    }

    // Manipulação de Willpower
    function buyStat(type, amount) {
        // Verifica saldo
        const cost = type === 'bw' ? 3 : 1;
        if (availablePoints < cost && amount > 0) {
            return ui.notifications.warn("XP Insuficiente para aprimoramento.");
        }

        if (type === 'bw') {
            const newVal = Math.max(0, boughtBaseWill + amount);
            actor.update({ [`flags.${MODULE_ID}.boughtBaseWill`]: newVal }, {render:false});
        } else {
            const newVal = Math.max(0, boughtWillpower + amount);
            actor.update({ [`flags.${MODULE_ID}.boughtWillpower`]: newVal }, {render:false});
        }
    }

    function updateCurrent(type, val) {
        const num = parseInt(val) || 0;
        if (type === 'bw') {
            actor.update({ [`flags.${MODULE_ID}.currBaseWill`]: num }, {render:false});
        } else {
            actor.update({ [`flags.${MODULE_ID}.currWillpower`]: num }, {render:false});
        }
    }

    // Manipulação de Universos e Motivações (Código Preservado)
    function addUniverse() { 
        const newList = [...originUniverses, { universe: "", theme: "" }];
        if (newList.length > 1 && availablePoints < 8) ui.notifications.warn("Atenção: Custo de 8 XP pendente!");
        updateFlag('bio_universes', newList); 
    }
    function removeUniverse(i) { updateFlag('bio_universes', originUniverses.filter((_, idx) => idx !== i)); }
    function updateUniverse(i, field, val) { originUniverses[i][field] = val; }
    function commitUniverse() { updateFlag('bio_universes', originUniverses); }

    function addMotivation() { updateFlag('bio_motivations', [...motivations, { text: "", stars: 1 }]); }
    function removeMotivation(i) { updateFlag('bio_motivations', motivations.filter((_, idx) => idx !== i)); }
    function commitMotivation() { updateFlag('bio_motivations', motivations); }

    function saveBioText() {
        actor.update({
            [`flags.${MODULE_ID}.bio_lore`]: loreContent,
            [`flags.${MODULE_ID}.bio_psyche`]: localPsyche,
            [`flags.${MODULE_ID}.bio_appearance`]: localAppearance
        }, { render: false });
        ui.notifications.info("DADOS BIOGRÁFICOS GRAVADOS.");
    }

    onMount(() => {
        const originID = flags.origin || "humano";
        loadOriginData(originID);
    });

    function getStars(c) { return "★".repeat(Math.min(5, Math.max(1, c))) + "☆".repeat(5 - Math.min(5, Math.max(1, c))); }
    
    async function editImg() { 
        new FilePicker({ 
            type: "image", current: actor.img, 
            callback: path => actor.update({img: path}, {render: false}) 
        }).render(true); 
    }
</script>

<div class="bio-terminal" style="--c-primary: {themeColor};">
    
    {#if activePopup}
        <div class="modal-backdrop" on:click={() => activePopup = null} transition:fade>
            <div class="modal-window" transition:scale on:click|stopPropagation>
                <div class="modal-header">
                    <span>DADOS_CRIPTOGRAFADOS // {activePopup.title}</span>
                    <button class="close-btn" on:click={() => activePopup = null}>✕</button>
                </div>
                <div class="modal-body">
                    {@html activePopup.desc}
                </div>
            </div>
        </div>
    {/if}

    <div class="content-scroll">
        
        <header class="top-hud">
            <div class="id-card">
                <div class="portrait" on:click={editImg}>
                    <img src={actor.img} alt="Avatar" />
                    <div class="scan-line"></div>
                </div>
                <div class="info-col">
                    <label>CODENAME</label>
                    <input type="text" class="name-input" value={actor.name} on:change={e => actor.update({name: e.target.value}, {render: false})} />
                    <button class="sync-btn {isSyncing ? 'pulsing' : ''}" on:click={importPlayerXP}>
                        <i class="fas fa-satellite-dish"></i> SYNC_XP_DATABASE
                    </button>
                </div>
            </div>

            <div class="resource-display">
                <div class="res-line">
                    <span class="lbl">CAPACIDADE</span>
                    <span class="val">{totalPointsCap}</span>
                </div>
                <div class="res-line">
                    <span class="lbl">CUSTO SISTEMA</span>
                    <span class="val dim">{spentPoints}</span>
                </div>
                <div class="res-line main">
                    <span class="lbl">MEMÓRIA LIVRE</span>
                    <span class="val" style="color: {availablePoints < 0 ? '#ff3333' : 'var(--c-primary)'}">
                        {availablePoints}
                    </span>
                </div>
            </div>

            <div class="level-orb">
                <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" class="bg-ring" />
                    <circle cx="50" cy="50" r="45" class="prog-ring" stroke-dashoffset={strokeDashoffset} />
                </svg>
                <div class="level-txt">
                    <small>LVL</small>
                    <strong>{lvlInfo.level}</strong>
                </div>
            </div>
        </header>

        <section class="willpower-module">
            <div class="will-row">
                <div class="will-info">
                    <span class="w-label">BASE WILL</span>
                    <div class="w-calc">
                        <span title="Charme">{statCharm}</span> + 
                        <span title="Comando">{statCommand}</span> + 
                        <span class="bought" title="Comprado">{boughtBaseWill}</span>
                        = <strong>{maxBaseWill}</strong>
                    </div>
                </div>
                <div class="will-controls">
                    <div class="buyer">
                        <button on:click={() => buyStat('bw', -1)}>-</button>
                        <span>+3 XP</span>
                        <button on:click={() => buyStat('bw', 1)}>+</button>
                    </div>
                    <div class="current-input-wrapper">
                        <label>ATUAL</label>
                        <input type="number" value={currBaseWill} on:change={e => updateCurrent('bw', e.target.value)}>
                    </div>
                </div>
            </div>

            <div class="will-row">
                <div class="will-info">
                    <span class="w-label">WILLPOWER</span>
                    <div class="w-calc">
                        <span title="Base Will">{maxBaseWill}</span> + 
                        <span class="bought" title="Comprado">{boughtWillpower}</span>
                        = <strong>{maxWillpower}</strong>
                    </div>
                </div>
                <div class="will-controls">
                    <div class="buyer">
                        <button on:click={() => buyStat('wp', -1)}>-</button>
                        <span>+1 XP</span>
                        <button on:click={() => buyStat('wp', 1)}>+</button>
                    </div>
                    <div class="current-input-wrapper">
                        <label>ATUAL</label>
                        <input type="number" value={currWillpower} on:change={e => updateCurrent('wp', e.target.value)}>
                    </div>
                </div>
            </div>
        </section>

        <section class="origin-display">
            <div class="origin-header">
                <div class="origin-icon">{originData.icon}</div>
                <div class="origin-title">
                    <small>ARQUIVO DE ORIGEM:</small>
                    <span>{originData.name.toUpperCase()}</span>
                </div>
                <button class="btn-info" on:click={() => activePopup = {title: originData.name, desc: originData.desc + "<hr>" + originData.powers}}>
                    <i class="fas fa-file-alt"></i> LER ARQUIVO
                </button>
            </div>
            
            <div class="origin-details">
                <div class="detail-box mechanic" on:click={() => activePopup = {title: originData.mechanic.name, desc: originData.mechanic.desc}}>
                    <span class="lbl">MECÂNICA ÚNICA</span>
                    <span class="val">{originData.mechanic.name}</span>
                </div>
                <div class="detail-box traits">
                    <span class="lbl">TRAÇOS GENÉTICOS</span>
                    <div class="traits-list">
                        {#each originData.traits as t}
                            <span class="trait-tag" on:click={() => activePopup = {title: t.name, desc: t.effect}}>{t.name}</span>
                        {/each}
                    </div>
                </div>
            </div>
        </section>

        <section class="dual-lists">
            <div class="cyber-list">
                <div class="list-head">
                    <span>HISTÓRICO MULTIVERSAL</span>
                    <button class="add-btn" on:click={addUniverse} title="Adicionar Universo (Custa 8 Pontos)">+</button>
                </div>
                <div class="list-content">
                    {#each originUniverses as item, i}
                        <div class="list-row" transition:slide|local>
                            <div class="input-group">
                                <input class="univ-input" value={item.universe} placeholder="Universo..." on:change={e => { updateUniverse(i, 'universe', e.target.value); commitUniverse(); }} />
                                <span class="divider">::</span>
                                <input class="theme-input" value={item.theme} placeholder="Tema..." on:change={e => { updateUniverse(i, 'theme', e.target.value); commitUniverse(); }} />
                            </div>
                            
                            <div class="controls">
                                {#if i > 0}
                                    <span class="cost-badge" title="Custo de Multiverso Adicional">-8 PT</span>
                                {/if}
                                <button class="del-btn" on:click={() => removeUniverse(i)}><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    {/each}
                    {#if originUniverses.length === 0}
                        <div class="empty-msg">Nenhum registro de origem.</div>
                    {/if}
                </div>
            </div>

            <div class="cyber-list">
                <div class="list-head">
                    <span>CONVICÇÕES & OBJETIVOS</span>
                    <button class="add-btn" on:click={addMotivation}>+</button>
                </div>
                <div class="list-content">
                    {#each motivations as mot, i}
                        <div class="list-row column" transition:slide|local>
                            <input class="full-input" value={mot.text} placeholder="Escreva um objetivo..." on:change={e => { motivations[i].text = e.target.value; commitMotivation(); }} />
                            <div class="stars-ctrl">
                                <input type="number" class="num-input" min="1" max="5" value={mot.stars} on:change={e => { motivations[i].stars = parseInt(e.target.value); commitMotivation(); }} />
                                <span class="stars-render" style="color: var(--c-primary)">{getStars(mot.stars)}</span>
                                <button class="del-btn" on:click={() => removeMotivation(i)}><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </section>

        <section class="text-areas">
            <div class="text-box full">
                <div class="box-label">REGISTRO_BIOGRÁFICO.log</div>
                <textarea value={loreContent} on:change={e => { loreContent = e.target.value; saveBioText(); }}></textarea>
            </div>
            <div class="split-text">
                <div class="text-box">
                    <div class="box-label">PERFIL_PSICOLÓGICO</div>
                    <textarea class="short" value={localPsyche} on:change={e => { localPsyche = e.target.value; saveBioText(); }}></textarea>
                </div>
                <div class="text-box">
                    <div class="box-label">DADOS_VISUAIS</div>
                    <textarea class="short" value={localAppearance} on:change={e => { localAppearance = e.target.value; saveBioText(); }}></textarea>
                </div>
            </div>
        </section>

        <div class="footer-save">
            <button on:click={saveBioText}>
                <i class="fas fa-save"></i> SALVAR DADOS NA MATRIZ
            </button>
        </div>

    </div>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

    .bio-terminal {
        height: 100%; display: flex; flex-direction: column; 
        background: #050505; color: #ccc; 
        font-family: 'Share Tech Mono', monospace;
        --glass: rgba(255, 255, 255, 0.03);
        --border: 1px solid rgba(255,255,255,0.1);
        --glow: 0 0 10px rgba(var(--c-primary), 0.2);
    }

    .content-scroll { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 20px; }
    
    /* HEADER */
    .top-hud { display: flex; gap: 20px; border-bottom: 2px solid #222; padding-bottom: 20px; align-items: center; }
    
    .id-card { flex: 2; display: flex; gap: 15px; align-items: center; }
    .portrait { 
        width: 80px; height: 80px; border: 2px solid var(--c-primary); 
        position: relative; overflow: hidden; cursor: pointer; background: #000;
        box-shadow: 0 0 15px var(--c-primary);
    }
    .portrait img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(0.5); transition: 0.3s; }
    .portrait:hover img { filter: grayscale(0); transform: scale(1.1); }
    
    .info-col { flex: 1; display: flex; flex-direction: column; justify-content: center; }
    .info-col label { font-size: 10px; color: var(--c-primary); letter-spacing: 2px; }
    .name-input { 
        background: transparent; border: none; border-bottom: 1px solid #333; 
        color: #fff; font-size: 24px; font-family: inherit; width: 100%; text-transform: uppercase; 
    }
    .name-input:focus { outline: none; border-bottom-color: var(--c-primary); }
    
    .sync-btn {
        margin-top: 5px; background: transparent; border: 1px solid #444; color: #666;
        font-size: 10px; padding: 2px 8px; cursor: pointer; width: fit-content;
        transition: 0.2s; font-family: inherit;
    }
    .sync-btn:hover { border-color: var(--c-primary); color: var(--c-primary); }
    .pulsing { animation: pulse 1s infinite; color: var(--c-primary); border-color: var(--c-primary); }

    /* MONITOR */
    .resource-display {
        flex: 1.5; background: #080808; border: var(--border); padding: 10px;
        display: flex; flex-direction: column; justify-content: center; gap: 4px;
        border-right: 4px solid var(--c-primary);
    }
    .res-line { display: flex; justify-content: space-between; font-size: 11px; }
    .res-line .val { font-weight: bold; }
    .res-line.main { margin-top: 4px; border-top: 1px dashed #333; padding-top: 4px; color: var(--c-primary); font-size: 14px; }
    .dim { color: #555; }

    /* ORB */
    .level-orb { width: 70px; height: 70px; position: relative; display: flex; align-items: center; justify-content: center; }
    .level-orb svg { width: 100%; height: 100%; transform: rotate(-90deg); }
    .bg-ring { fill: none; stroke: #111; stroke-width: 6; }
    .prog-ring { fill: none; stroke: var(--c-primary); stroke-width: 6; stroke-dasharray: 283; transition: stroke-dashoffset 1s; }
    .level-txt { position: absolute; display: flex; flex-direction: column; align-items: center; line-height: 1; }
    .level-txt small { font-size: 8px; color: #666; }
    .level-txt strong { font-size: 20px; color: #fff; }

    /* --- WILLPOWER MODULE --- */
    .willpower-module {
        background: rgba(0,0,0,0.3); border: var(--border); padding: 10px;
        display: flex; flex-direction: column; gap: 10px;
    }
    .will-row {
        display: flex; align-items: center; justify-content: space-between;
        background: rgba(255,255,255,0.02); padding: 8px; border-radius: 4px;
    }
    .will-info { flex: 1; display: flex; flex-direction: column; }
    .w-label { font-size: 10px; color: var(--c-primary); font-weight: bold; letter-spacing: 1px; }
    .w-calc { font-size: 12px; color: #888; }
    .w-calc strong { color: #fff; font-size: 14px; margin-left: 5px; }
    .w-calc .bought { color: var(--c-primary); }

    .will-controls { display: flex; align-items: center; gap: 15px; }
    .buyer { display: flex; align-items: center; gap: 5px; border: 1px solid #333; padding: 2px; border-radius: 4px; }
    .buyer button { width: 20px; background: #222; border: none; color: #fff; cursor: pointer; }
    .buyer button:hover { background: var(--c-primary); color: #000; }
    .buyer span { font-size: 9px; color: #666; width: 40px; text-align: center; }

    .current-input-wrapper { display: flex; flex-direction: column; align-items: center; }
    .current-input-wrapper label { font-size: 8px; color: #555; }
    .current-input-wrapper input { 
        width: 50px; background: #000; border: 1px solid var(--c-primary); 
        color: #fff; text-align: center; padding: 5px; font-weight: bold; font-family: inherit;
    }

    /* ORIGIN PANEL */
    .origin-display { border: var(--border); background: var(--glass); display: flex; flex-direction: column; }
    .origin-header { 
        background: rgba(255,255,255,0.05); padding: 8px 15px; display: flex; align-items: center; gap: 10px; 
        border-bottom: 1px solid #333; 
    }
    .origin-icon { font-size: 20px; }
    .origin-title { flex: 1; display: flex; flex-direction: column; line-height: 1.2; }
    .origin-title span { color: var(--c-primary); font-weight: bold; letter-spacing: 1px; }
    .origin-title small { font-size: 9px; color: #666; }
    .btn-info { background: transparent; border: 1px solid var(--c-primary); color: var(--c-primary); font-family: inherit; font-size: 10px; cursor: pointer; padding: 4px 10px; }
    .btn-info:hover { background: var(--c-primary); color: #000; }

    .origin-details { display: flex; padding: 10px; gap: 10px; }
    .detail-box { flex: 1; background: #000; border: 1px solid #222; padding: 8px; cursor: help; transition: 0.2s; }
    .detail-box:hover { border-color: #555; }
    .detail-box .lbl { font-size: 9px; color: #555; display: block; margin-bottom: 4px; }
    .detail-box .val { font-size: 12px; color: #ddd; }
    .traits-list { display: flex; flex-wrap: wrap; gap: 5px; }
    .trait-tag { background: #111; border: 1px solid #333; padding: 2px 6px; font-size: 10px; color: #aaa; cursor: help; }
    .trait-tag:hover { color: #fff; border-color: #fff; }

    /* LISTAS */
    .dual-lists { display: flex; gap: 20px; }
    .cyber-list { flex: 1; border: var(--border); background: #080808; display: flex; flex-direction: column; }
    .list-head { 
        background: rgba(255,255,255,0.05); padding: 5px 10px; font-size: 11px; font-weight: bold; 
        color: #888; display: flex; justify-content: space-between; align-items: center; 
        border-bottom: 1px solid #333; 
    }
    .add-btn { background: #222; color: #fff; border: none; width: 20px; height: 20px; cursor: pointer; font-weight: bold; }
    .add-btn:hover { background: var(--c-primary); color: #000; }

    .list-content { padding: 10px; display: flex; flex-direction: column; gap: 5px; }
    .list-row { 
        display: flex; justify-content: space-between; align-items: center; 
        background: rgba(255,255,255,0.02); padding: 5px; border: 1px solid transparent; 
        transition: 0.2s; 
    }
    .list-row:hover { border-color: #444; background: rgba(255,255,255,0.04); }
    .list-row.column { flex-direction: column; align-items: flex-start; gap: 5px; }

    .input-group { display: flex; align-items: center; gap: 5px; flex: 1; }
    .univ-input, .theme-input, .full-input { 
        background: transparent; border: none; border-bottom: 1px solid #333; 
        color: #fff; font-family: inherit; font-size: 12px; width: 100%; 
    }
    .univ-input:focus, .theme-input:focus, .full-input:focus { border-color: var(--c-primary); outline: none; }
    
    .controls, .stars-ctrl { display: flex; align-items: center; gap: 8px; }
    .del-btn { background: transparent; border: none; color: #444; cursor: pointer; }
    .del-btn:hover { color: #f33; }
    
    .cost-badge {
        font-size: 9px; color: #ff3333; border: 1px solid #ff3333; padding: 1px 4px;
        animation: blink 2s infinite; font-weight: bold;
    }

    .num-input { width: 30px; background: #000; border: 1px solid #333; color: #fff; text-align: center; }

    /* TEXT AREAS */
    .text-areas { display: flex; flex-direction: column; gap: 15px; }
    .split-text { display: flex; gap: 20px; }
    .text-box { flex: 1; border: var(--border); background: #000; position: relative; }
    .box-label { 
        position: absolute; top: -8px; left: 10px; background: #000; padding: 0 5px; 
        font-size: 10px; color: var(--c-primary); border: 1px solid #333; 
    }
    textarea { 
        width: 100%; background: transparent; border: none; padding: 15px; color: #ccc; 
        font-family: inherit; resize: none; min-height: 120px; font-size: 13px; line-height: 1.5; 
    }
    textarea.short { min-height: 80px; }
    textarea:focus { background: rgba(255,255,255,0.02); outline: none; }

    .footer-save button {
        width: 100%; background: #111; border: 1px solid var(--c-primary); color: var(--c-primary);
        padding: 12px; font-family: inherit; font-weight: bold; font-size: 14px; cursor: pointer;
        transition: 0.2s;
    }
    .footer-save button:hover { background: var(--c-primary); color: #000; box-shadow: 0 0 20px var(--c-primary); }

    /* MODAL */
    .modal-backdrop { 
        position: fixed; 
        inset: 0; 
        background: rgba(0,0,0,0.9); 
        z-index: 9999; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
    }
    .modal-window { width: 500px; max-height: 80vh; background: #050505; border: 1px solid var(--c-primary); display: flex; flex-direction: column; }
    .modal-header { background: var(--c-primary); color: #000; padding: 10px; font-weight: bold; display: flex; justify-content: space-between; }
    .modal-body { padding: 20px; overflow-y: auto; color: #ccc; line-height: 1.6; }
    .close-btn { background: none; border: none; font-weight: bold; cursor: pointer; font-size: 16px; }

    @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>