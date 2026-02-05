<script>
    import { fade } from 'svelte/transition';
    import { GroupDatabase } from '../../database/GroupDatabase.js';

    export let group = null; // Inicializa null para segurança
    export let isLeader = false;
    const isGM = game.user.isGM;

    // Sincronia local com proteção (Safe Access)
    // Se group for undefined, usa objeto vazio para não quebrar a UI
    $: baseBio = group?.bio || { fome: 10, sede: 10, exaustao: 0 };
    $: baseStats = group?.baseStats || { hp: 20, maxHp: 20, har: 0, lar: 0, protection: 1 };

    // --- CÁLCULO DE CONSUMO ---
    $: npcCount = group?.npcs?.length || 0;
    $: costPerAction = npcCount; 
    $: totalCycleCost = costPerAction * 2; 

    async function updateStats() {
        if (!isGM || !group?.id) return; // Proteção extra
        await GroupDatabase.updateGroupData(group.id, { baseStats, bio: baseBio });
        ui.notifications.info("Estatísticas da Base Atualizadas.");
    }

    async function runCycle() {
        if (!isGM || !group?.id) return;
        await GroupDatabase.runNPCCycle(group.id);
    }
</script>

{#if group && group.id}
    <div class="dashboard-container" in:fade>
        <div class="sustenance-panel">
            <div class="sus-header">
                <i class="fas fa-apple-alt"></i> LOGÍSTICA DE SOBREVIVÊNCIA
            </div>
            <div class="sus-grid">
                <div class="sus-item">
                    <span class="lbl">POPULAÇÃO</span>
                    <span class="val">{npcCount}</span>
                </div>
                <div class="sus-item alert">
                    <span class="lbl">CONSUMO / AÇÃO</span>
                    <span class="val">-{costPerAction} <small>un.</small></span>
                </div>
                <div class="sus-item">
                    <span class="lbl">CUSTO DO DIA</span>
                    <span class="val">{totalCycleCost} <small>un.</small></span>
                </div>
            </div>
            {#if isGM}
                <button class="cycle-btn" on:click={runCycle}>
                    <i class="fas fa-sync"></i> EXECUTAR CICLO DIÁRIO
                </button>
            {/if}
        </div>

        <div class="section-box">
            <header><i class="fas fa-users"></i> SINAIS VITAIS DO GRUPO</header>
            <div class="stats-row">
                <div class="stat-item">
                    <div class="stat-top">
                        <label>FOME</label>
                        {#if isGM}
                            <div class="gm-ctrl">
                                <i class="fas fa-minus-square" on:click={()=>{baseBio.fome--; updateStats()}}></i>
                                <i class="fas fa-plus-square" on:click={()=>{baseBio.fome++; updateStats()}}></i>
                            </div>
                        {/if}
                    </div>
                    <div class="bar-container">
                        <div class="bar-fill red" style="width: {baseBio.fome * 10}%"></div>
                        <span class="bar-text">{baseBio.fome}/10</span>
                    </div>
                </div>

                <div class="stat-item">
                    <div class="stat-top">
                        <label>SEDE</label>
                        {#if isGM}
                            <div class="gm-ctrl">
                                <i class="fas fa-minus-square" on:click={()=>{baseBio.sede--; updateStats()}}></i>
                                <i class="fas fa-plus-square" on:click={()=>{baseBio.sede++; updateStats()}}></i>
                            </div>
                        {/if}
                    </div>
                    <div class="bar-container">
                        <div class="bar-fill blue" style="width: {baseBio.sede * 10}%"></div>
                        <span class="bar-text">{baseBio.sede}/10</span>
                    </div>
                </div>

                <div class="stat-item">
                    <div class="stat-top">
                        <label>EXAUSTÃO</label>
                        {#if isGM}
                            <div class="gm-ctrl">
                                <i class="fas fa-minus-square" on:click={()=>{baseBio.exaustao--; updateStats()}}></i>
                                <i class="fas fa-plus-square" on:click={()=>{baseBio.exaustao++; updateStats()}}></i>
                            </div>
                        {/if}
                    </div>
                    <div class="bar-container">
                        <div class="bar-fill purple" style="width: {(baseBio.exaustao || 0) * 10}%"></div>
                        <span class="bar-text">{baseBio.exaustao}/10</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="section-box stats-box">
            <header><i class="fas fa-shield-alt"></i> INTEGRIDADE ESTRUTURAL</header>
            
            <div class="hp-section">
                <div class="hp-labels">
                    <label>HP DA BASE</label>
                    <span class="hp-val">
                        {#if isGM}
                            <input type="number" bind:value={baseStats.hp} on:change={updateStats} class="inline-input"> / 
                            <input type="number" bind:value={baseStats.maxHp} on:change={updateStats} class="inline-input">
                        {:else}
                            {baseStats.hp} / {baseStats.maxHp}
                        {/if}
                    </span>
                </div>
                <div class="hp-bar-track">
                    <div class="hp-bar-fill" style="width: {(baseStats.hp / baseStats.maxHp) * 100}%"></div>
                </div>
            </div>

            <div class="def-grid">
                <div class="def-card">
                    <label>HAR (Blindagem)</label>
                    {#if isGM}
                        <input type="number" bind:value={baseStats.har} on:change={updateStats}>
                    {:else}
                        <span class="val">{baseStats.har}</span>
                    {/if}
                </div>
                <div class="def-card">
                    <label>LAR (Leve)</label>
                    {#if isGM}
                        <input type="number" bind:value={baseStats.lar} on:change={updateStats}>
                    {:else}
                        <span class="val">{baseStats.lar}</span>
                    {/if}
                </div>
                <div class="def-card">
                    <label>PROTEÇÃO</label>
                    {#if isGM}
                        <input type="number" bind:value={baseStats.protection} on:change={updateStats}>
                    {:else}
                        <span class="val">{baseStats.protection}</span>
                    {/if}
                </div>
            </div>
        </div>

    </div>
{:else}
    <div style="padding: 20px; color: #00ff41; text-align: center;">
        <i class="fas fa-circle-notch fa-spin"></i> Carregando Dashboard...
    </div>
{/if}

<style>
/* CSS Mantido - Igual ao Original */
    .dashboard-container { padding: 15px; display: flex; flex-direction: column; gap: 15px; font-family: 'Share Tech Mono', monospace; color: #fff; }
    
    /* SUSTENANCE PANEL */
    .sustenance-panel { background: rgba(0, 20, 0, 0.4); border: 1px solid #004400; padding: 10px; border-radius: 4px; }
    .sus-header { font-weight: bold; color: #00ff41; margin-bottom: 10px; font-size: 14px; border-bottom: 1px solid #004400; padding-bottom: 5px; }
    .sus-grid { display: flex; justify-content: space-between; margin-bottom: 10px; }
    .sus-item { display: flex; flex-direction: column; align-items: center; background: #000; padding: 8px; width: 30%; border: 1px solid #222; }
    .sus-item.alert { border-color: #ff5555; color: #ff5555; }
    .sus-item .lbl { font-size: 9px; opacity: 0.7; }
    .sus-item .val { font-size: 18px; font-weight: bold; }
    .sus-item small { font-size: 10px; font-weight: normal; }

    .cycle-btn { width: 100%; background: #004400; color: #00ff41; border: 1px solid #00ff41; padding: 10px; cursor: pointer; font-weight: bold; font-family: inherit; }
    .cycle-btn:hover { background: #00ff41; color: #000; }

    /* SECTION BOXES */
    .section-box { background: rgba(255,255,255,0.03); border: 1px solid #333; padding: 10px; border-radius: 4px; }
    header { border-bottom: 1px solid #444; color: #ccc; font-weight: bold; margin-bottom: 10px; padding-bottom: 5px; display: flex; align-items: center; gap: 8px; font-size: 12px; }

    /* STATS ROW */
    .stats-row { display: flex; gap: 15px; }
    .stat-item { flex: 1; display: flex; flex-direction: column; gap: 5px; }
    .stat-top { display: flex; justify-content: space-between; font-size: 10px; color: #aaa; }
    .gm-ctrl { cursor: pointer; display: flex; gap: 5px; }
    .gm-ctrl i:hover { color: #fff; }

    .bar-container { background: #000; height: 18px; border: 1px solid #444; position: relative; border-radius: 2px; }
    .bar-fill { height: 100%; transition: 0.3s; }
    .bar-fill.red { background: #ef4444; } .bar-fill.blue { background: #3b82f6; } .bar-fill.purple { background: #a855f7; }
    .bar-text { position: absolute; inset: 0; display: flex; justify-content: center; align-items: center; font-size: 10px; text-shadow: 0 0 2px #000; z-index: 2; font-weight: bold; }

    /* HP & DEF */
    .hp-section { margin-bottom: 15px; }
    .hp-labels { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 11px; }
    .hp-bar-track { height: 10px; background: #220000; border: 1px solid #550000; }
    .hp-bar-fill { height: 100%; background: #ff3333; transition: width 0.3s; }
    .inline-input { width: 35px; background: transparent; border: none; border-bottom: 1px solid #666; color: #fff; text-align: center; font-family: inherit; font-size: 11px; }

    .def-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
    .def-card { background: #000; border: 1px solid #444; padding: 8px; text-align: center; display: flex; flex-direction: column; }
    .def-card label { font-size: 9px; color: #888; margin-bottom: 5px; }
    .def-card .val { font-size: 16px; font-weight: bold; color: #00ff41; }
    .def-card input { background: transparent; border: 1px solid #333; color: #fff; font-size: 16px; text-align: center; width: 100%; font-family: inherit; }
    .def-card input:focus { border-color: #00ff41; outline: none; }
</style>