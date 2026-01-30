<script>
    import { onMount, createEventDispatcher } from 'svelte';
    import { fade, fly, slide } from 'svelte/transition';
    import { XPDatabase } from './XPDatabase.js';
    import { LevelCalculator } from './LevelSystem.js';

    const dispatch = createEventDispatcher();

    // DADOS
    let users = [];
    let selectedUserIds = [];
    let xpAmount = 0;
    let groupFilter = "Todos";
    let allGroups = ["Todos", "Sem Grupo"];

    // UI
    let editingGroupUser = null;
    let newGroupName = "";
    let lastLog = "SISTEMA INICIALIZADO...";

    onMount(() => {
        refresh();
        Hooks.on("updateUser", refresh);
    });

    function refresh() {
        const rawUsers = game.users.filter(u => !u.isGM);
        users = rawUsers.map(u => {
            const data = XPDatabase.getPlayerData(u.id);
            const lvlInfo = LevelCalculator.getLevelInfo(data.earnedXP);
            return {
                id: u.id, name: u.name, color: u.color,
                data: data, levelInfo: lvlInfo
            };
        });

        const gSet = new Set(["Todos", "Sem Grupo"]);
        users.forEach(u => gSet.add(u.data.group));
        allGroups = Array.from(gSet);
    }

    function toggleSelect(id) {
        if (selectedUserIds.includes(id)) selectedUserIds = selectedUserIds.filter(i => i !== id);
        else selectedUserIds = [...selectedUserIds, id];
    }

    function selectAll() {
        const visible = users.filter(u => groupFilter === "Todos" || u.data.group === groupFilter);
        selectedUserIds = (selectedUserIds.length === visible.length) ? [] : visible.map(u => u.id);
    }

    async function giveXP() {
        if (xpAmount === 0 || selectedUserIds.length === 0) return;
        for (const id of selectedUserIds) {
            await XPDatabase.addXP(id, xpAmount, "Admin Grant");
        }
        lastLog = `TRANSFERÊNCIA DE ${xpAmount} XP CONCLUÍDA PARA ${selectedUserIds.length} AGENTES.`;
        ui.notifications.info(lastLog);
        xpAmount = 0;
        refresh();
    }

    async function changeGroup(user) {
        editingGroupUser = user.id;
        newGroupName = user.data.group;
    }

    async function saveGroup(userId) {
        await XPDatabase.setGroup(userId, newGroupName);
        editingGroupUser = null;
        lastLog = `UNIDADE DO AGENTE ATUALIZADA PARA: ${newGroupName}`;
        refresh();
    }
</script>

<div class="tactical-xp-interface">
    
    <aside class="command-panel">
        <div class="panel-header">
            <i class="fas fa-satellite-dish"></i>
            <h3>COMMAND_CENTER</h3>
        </div>

        <div class="control-group">
            <label>FILTRAGEM_DE_SQUAD</label>
            <div class="select-wrapper">
                <select bind:value={groupFilter} on:change={() => selectedUserIds = []}>
                    {#each allGroups as g} <option value={g}>{g}</option> {/each}
                </select>
            </div>
        </div>

        <div class="control-group highlight">
            <label>DISTRIBUIÇÃO_DE_CARGA</label>
            <div class="xp-input-wrapper">
                <input type="number" bind:value={xpAmount} placeholder="QUANTIA_XP" />
                <div class="target-count">ALVOS: {selectedUserIds.length}</div>
            </div>
            <button class="execute-btn" on:click={giveXP} disabled={selectedUserIds.length === 0}>
                EXECUTAR_ENVIO_NEURAL
            </button>
        </div>

        <div class="system-logs">
            <div class="log-title">LOG_DE_SISTEMA:</div>
            <div class="log-entry">> {lastLog}</div>
        </div>
    </aside>

    <section class="archive-section">
        <header class="archive-header">
            <div class="bulk-select" on:click={selectAll}>
                <div class="chk-box {selectedUserIds.length > 0 ? 'partial' : ''} {selectedUserIds.length === users.filter(u => groupFilter === 'Todos' || u.data.group === groupFilter).length && selectedUserIds.length > 0 ? 'all' : ''}"></div>
                <span>SELECIONAR_TODOS_VISÍVEIS</span>
            </div>
            <div class="archive-stats">
                AGENTES_IDENTIFICADOS: {users.length}
            </div>
        </header>

        <div class="dossier-grid">
            {#each users as u}
                {#if groupFilter === "Todos" || u.data.group === groupFilter}
                    <div class="dossier-card" 
                         class:selected={selectedUserIds.includes(u.id)}
                         in:fade={{duration: 200}}>
                        
                        <div class="dossier-id" on:click={() => toggleSelect(u.id)}>
                            <div class="selector">
                                <div class="chk-indicator {selectedUserIds.includes(u.id) ? 'active' : ''}"></div>
                            </div>
                            <div class="portrait-sim" style="--agent-color: {u.color}">
                                <i class="fas fa-user-secret"></i>
                            </div>
                        </div>

                        <div class="dossier-main">
                            <div class="name-row">
                                <span class="agent-name">{u.name}</span>
                                {#if editingGroupUser === u.id}
                                    <div class="edit-group-input" transition:slide={{axis: 'x'}}>
                                        <input type="text" bind:value={newGroupName} on:keypress={e => e.key === 'Enter' && saveGroup(u.id)} />
                                        <button on:click={() => saveGroup(u.id)}>SET</button>
                                    </div>
                                {:else}
                                    <span class="unit-tag" on:click={() => changeGroup(u)}>{u.data.group}</span>
                                {/if}
                            </div>

                            <div class="xp-logic-area">
                                <div class="progress-container">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: {u.levelInfo.progress}%"></div>
                                        <div class="glitch-line" style="left: {u.levelInfo.progress}%"></div>
                                    </div>
                                    <div class="xp-labels">
                                        <span>XP_TOTAL: {u.data.earnedXP}</span>
                                        <span>PRÓXIMO_NÍVEL: {u.levelInfo.nextXP}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="dossier-rank">
                            <div class="rank-label">NÍVEL</div>
                            <div class="rank-num">{u.levelInfo.level}</div>
                            
                            <div class="tech-tooltip">
                                <div class="tt-header">LIMITES_OPERACIONAIS</div>
                                <p>{u.levelInfo.limits}</p>
                                <div class="tt-header">BUFFS_ATIVOS</div>
                                <p>{u.levelInfo.buffs}</p>
                            </div>
                        </div>
                    </div>
                {/if}
            {/each}
        </div>
    </section>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

    .tactical-xp-interface {
        display: flex;
        height: 100%;
        width: 100%;
        background: #020202;
        font-family: 'Share Tech Mono', monospace;
        color: #00ff41;
        overflow: hidden;
    }

    /* --- SIDEBAR COMMAND PANEL --- */
    .command-panel {
        width: 280px;
        background: rgba(0, 30, 0, 0.9);
        border-right: 2px solid #00ff41;
        padding: 25px;
        display: flex;
        flex-direction: column;
        gap: 30px;
        box-shadow: 10px 0 30px rgba(0,0,0,0.5);
        z-index: 10;
    }

    .panel-header {
        display: flex;
        align-items: center;
        gap: 12px;
        border-bottom: 1px solid #00ff41;
        padding-bottom: 10px;
    }
    .panel-header h3 { margin: 0; font-size: 18px; letter-spacing: 2px; }

    .control-group { display: flex; flex-direction: column; gap: 10px; }
    .control-group label { font-size: 11px; opacity: 0.7; }

    .select-wrapper select, .xp-input-wrapper input {
        width: 100%;
        background: #000;
        border: 1px solid #00ff41;
        color: #00ff41;
        padding: 10px;
        font-family: inherit;
        outline: none;
    }

    .xp-input-wrapper { position: relative; }
    .target-count {
        font-size: 9px;
        position: absolute;
        right: 10px;
        bottom: -18px;
        color: #888;
    }

    .execute-btn {
        background: #00ff41;
        color: #000;
        border: none;
        padding: 12px;
        font-weight: bold;
        cursor: pointer;
        transition: 0.3s;
        margin-top: 15px;
    }
    .execute-btn:hover:not(:disabled) {
        box-shadow: 0 0 20px #00ff41;
        transform: translateY(-2px);
    }
    .execute-btn:disabled { opacity: 0.3; cursor: not-allowed; }

    .system-logs {
        margin-top: auto;
        font-size: 10px;
        background: rgba(0,0,0,0.5);
        padding: 10px;
        border-left: 2px solid #00ff41;
    }
    .log-entry { color: #ccc; margin-top: 5px; line-height: 1.4; }

    /* --- ARCHIVE SECTION (LIST) --- */
    .archive-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: radial-gradient(circle at center, #001a00 0%, #000 100%);
        padding: 20px;
    }

    .archive-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 20px;
        background: rgba(0, 255, 65, 0.05);
        border: 1px solid rgba(0, 255, 65, 0.2);
        margin-bottom: 20px;
        font-size: 12px;
    }

    .bulk-select { display: flex; align-items: center; gap: 10px; cursor: pointer; }
    .chk-box { width: 14px; height: 14px; border: 1px solid #00ff41; position: relative; }
    .chk-box.all::after { content: '✔'; position: absolute; top: -3px; left: 1px; font-size: 12px; }
    .chk-box.partial::after { content: ''; position: absolute; top: 5px; left: 3px; width: 6px; height: 2px; background: #00ff41; }

    .dossier-grid {
        display: flex;
        flex-direction: column;
        gap: 12px;
        overflow-y: auto;
        padding-right: 10px;
    }

    /* --- DOSSIER CARD --- */
    .dossier-card {
        display: flex;
        background: rgba(0, 40, 0, 0.2);
        border: 1px solid rgba(0, 255, 65, 0.2);
        height: 85px;
        transition: 0.3s;
        position: relative;
        clip-path: polygon(0 0, 98% 0, 100% 20%, 100% 100%, 2% 100%, 0 80%);
    }

    .dossier-card:hover {
        background: rgba(0, 255, 65, 0.08);
        border-color: #00ff41;
    }

    .dossier-card.selected {
        border-color: #00ff41;
        background: rgba(0, 255, 65, 0.15);
        box-shadow: inset 0 0 15px rgba(0, 255, 65, 0.1);
    }

    /* ID Column */
    .dossier-id {
        width: 80px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-right: 1px solid rgba(0, 255, 65, 0.2);
        cursor: pointer;
    }
    .chk-indicator {
        width: 12px; height: 12px;
        border: 1px solid #00ff41;
        margin-bottom: 8px;
    }
    .chk-indicator.active { background: #00ff41; box-shadow: 0 0 8px #00ff41; }
    
    .portrait-sim {
        font-size: 20px;
        color: var(--agent-color);
        filter: drop-shadow(0 0 5px var(--agent-color));
    }

    /* Main Column */
    .dossier-main {
        flex: 1;
        padding: 12px 20px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 8px;
    }

    .name-row { display: flex; align-items: center; gap: 15px; }
    .agent-name { font-size: 18px; font-weight: bold; color: #fff; }
    .unit-tag {
        font-size: 10px;
        background: #002200;
        padding: 2px 8px;
        border: 1px solid #00ff41;
        cursor: pointer;
    }

    .edit-group-input { display: flex; gap: 5px; }
    .edit-group-input input { background: #000; border: 1px solid #00ff41; color: #fff; font-size: 10px; width: 100px; padding: 2px 5px; }
    .edit-group-input button { background: #00ff41; color: #000; border: none; font-size: 9px; cursor: pointer; }

    /* XP Progress Bar */
    .progress-container { width: 100%; }
    .progress-bar {
        height: 4px;
        background: #001a00;
        width: 100%;
        position: relative;
        overflow: hidden;
    }
    .progress-fill {
        height: 100%;
        background: #00ff41;
        box-shadow: 0 0 10px #00ff41;
    }
    .glitch-line {
        position: absolute;
        top: 0;
        width: 2px;
        height: 100%;
        background: #fff;
        box-shadow: 0 0 5px #fff;
    }

    .xp-labels {
        display: flex;
        justify-content: space-between;
        font-size: 9px;
        margin-top: 4px;
        opacity: 0.6;
    }

    /* Rank Column */
    .dossier-rank {
        width: 100px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: rgba(0, 255, 65, 0.05);
        border-left: 1px solid rgba(0, 255, 65, 0.2);
    }
    .rank-label { font-size: 9px; opacity: 0.6; }
    .rank-num { font-size: 32px; font-weight: bold; color: #fff; }

    /* Technical Tooltip */
    .tech-tooltip {
        display: none;
        position: absolute;
        right: 105%;
        top: -10px;
        width: 260px;
        background: #000;
        border: 1px solid #00ff41;
        padding: 15px;
        z-index: 100;
        box-shadow: 0 0 30px rgba(0,0,0,0.9);
        pointer-events: none;
    }
    .dossier-rank:hover .tech-tooltip { display: block; }
    .tt-header { font-size: 10px; color: #00ff41; border-bottom: 1px solid #004400; margin-bottom: 5px; padding-bottom: 2px; }
    .tech-tooltip p { margin: 0 0 10px 0; font-size: 11px; color: #ccc; line-height: 1.3; }

    /* Custom Scrollbar */
    .dossier-grid::-webkit-scrollbar { width: 4px; }
    .dossier-grid::-webkit-scrollbar-track { background: #000; }
    .dossier-grid::-webkit-scrollbar-thumb { background: #00ff41; }
</style>