<script>
    import { onMount } from 'svelte';
    import { fade, slide, fly } from 'svelte/transition';
    import { OriginDatabase } from './OriginDatabase.js';
    import { XPDatabase } from './XPDatabase.js'; 

    // --- ESTADOS DO SISTEMA ---
    let users = [];
    let originList = [];
    let allOrigins = {};
    let isLoading = true;
    let currentTab = 'manage'; 

    // --- FILTRAGEM E EDIÇÃO ---
    let groupFilter = "Todos";
    let allGroups = ["Todos", "Sem Grupo"];
    let editingGroupUser = null; // ID do usuário sendo editado
    let newGroupName = "";

    // --- ARQUITETO (FORMULÁRIO) ---
    let form = {
        name: "Nova Raça", icon: "🧬", type: "Mítico (80+)",
        desc: "<p>História aqui...</p>", mechName: "Mecânica",
        mechDesc: "<p>Regras aqui...</p>",
        traits: [{ name: "Trait 1", effect: "Efeito..." }],
        powers: "<h3>Poderes Aqui</h3>"
    };

    // --- GERADOR DE CÓDIGO ---
    $: safeID = form.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-");
    $: generatedCode = `    "${safeID}": {
        id: "${safeID}",
        name: "${form.name}",
        icon: "${form.icon}",
        type: "${form.type}",
        desc: \`${form.desc}\`,
        mechanic: { name: "${form.mechName}", desc: \`${form.mechDesc}\` },
        traits: [
${form.traits.map(t => `            { name: "${t.name}", effect: "${t.effect}" }`).join(',\n')}
        ],
        powers: \`${form.powers}\`
    },`;

    onMount(async () => {
        await refreshData();
        Hooks.on("updateUser", refreshData);
    });

    async function refreshData() {
        allOrigins = await OriginDatabase.load();
        originList = Object.values(allOrigins);
        
        const rawUsers = game.users.filter(u => !u.isGM);
        
        users = rawUsers.map(u => {
            const xpData = XPDatabase.getPlayerData(u.id);
            const originID = u.getFlag("multiversus-rpg", "origin") || "humano";
            return {
                id: u.id, name: u.name, color: u.color,
                group: xpData.group || "Sem Grupo",
                origin: allOrigins[originID] || allOrigins["humano"]
            };
        });

        const gSet = new Set(["Todos", "Sem Grupo"]);
        users.forEach(u => gSet.add(u.group));
        allGroups = Array.from(gSet);
        
        isLoading = false;
    }

    // --- AÇÕES ---
    async function setOrigin(userId, originId) {
        const user = game.users.get(userId);
        if (user) await user.setFlag("multiversus-rpg", "origin", originId);
        refreshData();
    }

    function changeGroup(user) {
        editingGroupUser = user.id;
        newGroupName = user.group;
    }

    async function saveGroup(userId) {
        await XPDatabase.setGroup(userId, newGroupName);
        editingGroupUser = null;
        ui.notifications.info("UNIDADE DE AGENTE ATUALIZADA.");
        refreshData();
    }

    // --- UTILS ARQUITETO ---
    function addTrait() { form.traits = [...form.traits, { name: "", effect: "" }]; }
    function removeTrait(i) { form.traits = form.traits.filter((_, idx) => idx !== i); }
    function copyCode() { 
        navigator.clipboard.writeText(generatedCode);
        ui.notifications.info("CÓDIGO COPIADO.");
    }
</script>

<div class="tactical-origin-interface">
    
    <aside class="command-sidebar">
        <div class="sidebar-header">
            <i class="fas fa-dna"></i>
            <h3>GENETIC_HUB</h3>
        </div>

        <nav class="nav-menu">
            <button class:active={currentTab === 'manage'} on:click={() => currentTab = 'manage'}>
                <i class="fas fa-users-cog"></i> GESTÃO_AGENTES
            </button>
            <button class:active={currentTab === 'architect'} on:click={() => currentTab = 'architect'}>
                <i class="fas fa-microchip"></i> ARQUITETO_CODE
            </button>
        </nav>

        {#if currentTab === 'manage'}
            <div class="filter-panel" in:fade>
                <label>FILTRAGEM_DE_SQUAD</label>
                <select bind:value={groupFilter}>
                    {#each allGroups as g} <option value={g}>{g}</option> {/each}
                </select>
            </div>
        {/if}

        <div class="system-footer">
            <small>KERNEL_LINK: STABLE</small>
            <div class="blink-dot"></div>
        </div>
    </aside>

    <main class="content-area">
        {#if currentTab === 'manage'}
            <div class="dossier-view" in:fade>
                <header class="view-header">
                    <span>AGENTES_IDENTIFICADOS_NO_SISTEMA</span>
                </header>

                <div class="dossier-grid">
                    {#each users as u}
                        {#if groupFilter === "Todos" || u.group === groupFilter}
                            <div class="dossier-card" style="border-left: 6px solid {u.color}">
                                <div class="card-identity">
                                    <div class="id-icon"><i class="fas fa-fingerprint"></i></div>
                                    
                                    {#if editingGroupUser === u.id}
                                        <div class="group-editor" transition:slide={{axis: 'y'}}>
                                            <input type="text" bind:value={newGroupName} on:keypress={e => e.key === 'Enter' && saveGroup(u.id)} />
                                            <button on:click={() => saveGroup(u.id)}>OK</button>
                                        </div>
                                    {:else}
                                        <span class="unit-tag" on:click={() => changeGroup(u)} title="Clique para editar grupo">
                                            {u.group}
                                        </span>
                                    {/if}
                                </div>
                                
                                <div class="card-info">
                                    <span class="agent-name">{u.name.toUpperCase()}</span>
                                    <div class="current-origin">
                                        <span class="orb" style="background: var(--c-primary)"></span>
                                        {u.origin.icon} {u.origin.name} 
                                        <small>[{u.origin.type}]</small>
                                    </div>
                                </div>

                                <div class="card-select">
                                    <label>MODIFICAR_CÓDIGO_GENÉTICO</label>
                                    <select value={u.origin.id} on:change={(e) => setOrigin(u.id, e.target.value)}>
                                        {#each originList as org}
                                            <option value={org.id}>{org.icon} {org.name}</option>
                                        {/each}
                                    </select>
                                </div>
                            </div>
                        {/if}
                    {/each}
                </div>
            </div>

        {:else}
            <div class="architect-view" in:fade>
                <div class="editor-pane">
                    <div class="form-row">
                        <div class="f-group">
                            <label>NOME_DA_RAÇA</label>
                            <input type="text" bind:value={form.name} />
                        </div>
                        <div class="f-group mini">
                            <label>ICON</label>
                            <input type="text" bind:value={form.icon} />
                        </div>
                        <div class="f-group">
                            <label>TIPO_CUSTO</label>
                            <input type="text" bind:value={form.type} />
                        </div>
                    </div>

                    <label>ARQUIVO_HISTÓRICO (HTML)</label>
                    <textarea bind:value={form.desc}></textarea>

                    <div class="sub-panel">
                        <label>MECÂNICA_EXCLUSIVA</label>
                        <input type="text" bind:value={form.mechName} placeholder="Nome..." />
                        <textarea bind:value={form.mechDesc} placeholder="Regras..."></textarea>
                    </div>

                    <div class="sub-panel">
                        <div class="panel-header-btn">
                            <label>TRAITS_GENÉTICAS</label>
                            <button on:click={addTrait}>+ ADICIONAR</button>
                        </div>
                        {#each form.traits as t, i}
                            <div class="trait-row" transition:slide>
                                <input type="text" bind:value={t.name} placeholder="Nome" />
                                <input type="text" bind:value={t.effect} placeholder="Efeito" />
                                <button class="del-btn" on:click={() => removeTrait(i)}>X</button>
                            </div>
                        {/each}
                    </div>

                    <label>PODERES_REGRAS (HTML)</label>
                    <textarea bind:value={form.powers}></textarea>
                </div>

                <div class="output-pane">
                    <header>
                        <span>KERNEL_BLUEPRINT.js</span>
                        <button class="copy-btn" on:click={copyCode}>COPIAR_DADOS</button>
                    </header>
                    <pre><code>{generatedCode}</code></pre>
                </div>
            </div>
        {/if}
    </main>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

    .tactical-origin-interface {
        display: flex; height: 100%; width: 100%; background: #000;
        font-family: 'Share Tech Mono', monospace; color: #00ff41; overflow: hidden;
    }

    /* --- SIDEBAR --- */
    .command-sidebar {
        width: 280px; background: rgba(0, 20, 0, 0.95); border-right: 2px solid #00ff41;
        padding: 25px; display: flex; flex-direction: column; gap: 30px;
    }
    .sidebar-header { display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #00ff41; padding-bottom: 10px; }
    .nav-menu { display: flex; flex-direction: column; gap: 10px; }
    .nav-menu button {
        background: rgba(255,255,255,0.02); border: 1px solid rgba(0,255,65,0.2); color: #008822;
        padding: 12px; text-align: left; cursor: pointer; font-family: inherit; font-size: 12px; transition: 0.2s;
    }
    .nav-menu button.active { color: #00ff41; border-color: #00ff41; background: rgba(0,255,65,0.05); }

    .filter-panel label { font-size: 10px; opacity: 0.6; display: block; margin-bottom: 8px; }
    select { background: #000; color: #00ff41; border: 1px solid #00ff41; padding: 10px; font-family: inherit; width: 100%; outline: none; }

    /* --- CONTENT AREA (FULL HEIGHT) --- */
    .content-area { flex: 1; display: flex; flex-direction: column; height: 100%; overflow: hidden; background: radial-gradient(circle at center, #001a00 0%, #000 100%); }
    .dossier-view { flex: 1; display: flex; flex-direction: column; padding: 30px; height: 100%; }
    .view-header { font-size: 12px; margin-bottom: 20px; border-bottom: 1px solid rgba(0,255,65,0.2); padding-bottom: 10px; opacity: 0.7; }

    /* DOSSIER GRID COM SCROLL */
    .dossier-grid { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; padding-right: 15px; }
    .dossier-grid::-webkit-scrollbar { width: 4px; }
    .dossier-grid::-webkit-scrollbar-thumb { background: #00ff41; border-radius: 2px; }

    /* CARD DOSSIÊ */
    .dossier-card {
        display: flex; min-height: 100px; background: rgba(0, 30, 0, 0.3); border: 1px solid rgba(0, 255, 65, 0.2);
        transition: 0.2s; clip-path: polygon(0 0, 98% 0, 100% 20%, 100% 100%, 2% 100%, 0 80%);
    }
    .dossier-card:hover { background: rgba(0, 255, 65, 0.08); border-color: #00ff41; }

    .card-identity { width: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 1px solid rgba(0, 255, 65, 0.1); }
    .id-icon { font-size: 28px; opacity: 0.3; }
    .unit-tag { font-size: 9px; background: #000; padding: 2px 8px; border: 1px solid #004411; color: #00ff41; cursor: pointer; margin-top: 8px; }
    .unit-tag:hover { background: #004411; color: #fff; }

    /* Editor de Grupo no Card */
    .group-editor { display: flex; flex-direction: column; gap: 2px; padding: 5px; }
    .group-editor input { width: 80px; font-size: 9px; padding: 2px; border: 1px solid #00ff41; background: #000; color: #fff; }
    .group-editor button { background: #00ff41; color: #000; border: none; font-size: 8px; font-weight: bold; cursor: pointer; }

    .card-info { flex: 1; padding: 15px 25px; display: flex; flex-direction: column; justify-content: center; }
    .agent-name { font-size: 18px; font-weight: bold; color: #fff; text-shadow: 0 0 10px rgba(0,255,65,0.2); }
    .current-origin { font-size: 13px; color: #00ff41; display: flex; align-items: center; gap: 8px; margin-top: 5px; }
    .orb { width: 6px; height: 6px; border-radius: 50%; box-shadow: 0 0 5px currentColor; }
    .current-origin small { opacity: 0.4; font-size: 9px; }

    .card-select { width: 250px; padding: 15px; background: rgba(0,0,0,0.4); display: flex; flex-direction: column; gap: 8px; }
    .card-select label { font-size: 9px; opacity: 0.5; letter-spacing: 1px; }

    /* ARCHITECT VIEW */
    .architect-view { display: grid; grid-template-columns: 1fr 1fr; height: 100%; }
    .editor-pane { padding: 30px; overflow-y: auto; border-right: 1px solid #004411; display: flex; flex-direction: column; gap: 15px; }
    .form-row { display: grid; grid-template-columns: 1.5fr 60px 1.2fr; gap: 15px; }
    .f-group { display: flex; flex-direction: column; gap: 5px; }
    
    input, textarea { background: #080808; border: 1px solid #004411; color: #fff; padding: 10px; font-family: inherit; font-size: 13px; }
    input:focus, textarea:focus { border-color: #00ff41; outline: none; }
    
    .sub-panel { border: 1px solid #004411; padding: 15px; background: rgba(255,255,255,0.02); display: flex; flex-direction: column; gap: 10px; }
    .panel-header-btn { display: flex; justify-content: space-between; align-items: center; }
    .panel-header-btn button { background: #00ff41; color: #000; border: none; font-size: 10px; padding: 4px 12px; cursor: pointer; }

    .trait-row { display: grid; grid-template-columns: 120px 1fr 30px; gap: 10px; }
    .del-btn { background: #300; color: #f44; border: none; cursor: pointer; }

    .output-pane { background: #000; display: flex; flex-direction: column; overflow: hidden; }
    .output-pane header { padding: 15px; background: #050505; border-bottom: 1px solid #004411; display: flex; justify-content: space-between; align-items: center; }
    .copy-btn { background: #00ff41; color: #000; border: none; padding: 8px 18px; font-family: inherit; font-weight: bold; cursor: pointer; }
    pre { flex: 1; padding: 25px; margin: 0; overflow: auto; color: #00ff41; font-size: 12px; line-height: 1.5; }

    .system-footer { margin-top: auto; padding-top: 20px; border-top: 1px solid #004411; display: flex; justify-content: space-between; align-items: center; }
    .blink-dot { width: 8px; height: 8px; background: #00ff41; border-radius: 50%; animation: blink 1.5s infinite; }
    @keyframes blink { 50% { opacity: 0.1; } }
</style>