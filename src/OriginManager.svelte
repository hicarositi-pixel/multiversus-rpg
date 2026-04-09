<script>
    import { onMount } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import { OriginDatabase } from './OriginDatabase.js';
    import { XPDatabase } from './XPDatabase.js'; 

    let actorsList = []; 
    let originList = [];
    let allOrigins = {};
    let currentTab = 'manage'; 
    let groupFilter = "Todos";
    let searchQuery = ""; // NOVO: Estado da barra de pesquisa
    let allGroups = ["Todos", "Sem Grupo"];
    let editingGroupActor = null;
    let newGroupName = "";

    // Formulário do Arquiteto (Atualizado para Níveis)
    let form = {
        name: "Nova Raça", icon: "🧬", type: "Mítico (80+)",
        desc: "<p>História aqui...</p>", mechName: "Mecânica", mechDesc: "<p>Regras aqui...</p>",
        traits: [
            { level: 1, name: "Passiva Base", effect: "Efeito inicial..." },
            { level: 3, name: "Despertar (Nv 3)", effect: "Efeito..." },
            { level: 6, name: "Evolução (Nv 6)", effect: "Efeito..." },
            { level: 9, name: "Ápice (Nv 9)", effect: "Efeito..." }
        ], 
        powers: "<h3>Poderes Aqui</h3>"
    };

    $: safeID = form.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-");
    
    // Gerador de código inclui a variável de Level agora
    $: generatedCode = `    "${safeID}": {\n        id: "${safeID}",\n        name: "${form.name}",\n        icon: "${form.icon}",\n        type: "${form.type}",\n        desc: \`${form.desc}\`,\n        mechanic: { name: "${form.mechName}", desc: \`${form.mechDesc}\` },\n        traits: [\n${form.traits.map(t => `            { level: ${t.level}, name: "${t.name}", effect: "${t.effect}" }`).join(',\n')}\n        ],\n        powers: \`${form.powers}\`\n    },`;

    onMount(async () => {
        await refreshData();
        Hooks.on("updateUser", refreshData);
        Hooks.on("updateActor", refreshData); 
        Hooks.on("createActor", refreshData);
        Hooks.on("deleteActor", refreshData);
    });

    async function refreshData() {
        allOrigins = await OriginDatabase.load();
        originList = Object.values(allOrigins);
        
        const playerActors = game.actors.filter(a => a.type === "character" && a.hasPlayerOwner);
        
        actorsList = playerActors.map(actor => {
            const ownerUser = game.users.find(u => !u.isGM && actor.testUserPermission(u, "OWNER"));
            const actorGroup = actor.getFlag("multiversus-rpg", "squadGroup") || "Sem Grupo";
            const originID = actor.getFlag("multiversus-rpg", "origin") || "humano";
            
            // NOVO: Lê a pasta atual do Ator
            const folderName = actor.folder ? actor.folder.name : "Raiz";
            
            return {
                id: actor.id, 
                name: actor.name, 
                ownerName: ownerUser ? ownerUser.name : "Órfão",
                color: ownerUser ? ownerUser.color : "#aaaaaa",
                group: actorGroup,
                origin: allOrigins[originID] || allOrigins["humano"],
                folder: folderName
            };
        });

        const gSet = new Set(["Todos", "Sem Grupo"]);
        actorsList.forEach(a => gSet.add(a.group));
        allGroups = Array.from(gSet);
    }

    // Filtro Reativo: Busca por Nome, Jogador, Pasta ou Grupo
    $: filteredActors = actorsList.filter(a => {
        const matchGroup = groupFilter === "Todos" || a.group === groupFilter;
        const term = searchQuery.toLowerCase();
        const matchSearch = a.name.toLowerCase().includes(term) || 
                            a.ownerName.toLowerCase().includes(term) || 
                            a.folder.toLowerCase().includes(term);
        return matchGroup && matchSearch;
    });

    async function setOrigin(actorId, originId) {
        const actor = game.actors.get(actorId);
        if (!actor) return;
        await actor.update({ "flags.multiversus-rpg.origin": originId });
        ui.notifications.info(`Origem de ${actor.name} atualizada para ${originId}`);
        refreshData();
    }

    function changeGroup(actorData) { editingGroupActor = actorData.id; newGroupName = actorData.group; }
    
    async function saveGroup(actorId) {
        const actor = game.actors.get(actorId);
        if (actor) { await actor.update({ "flags.multiversus-rpg.squadGroup": newGroupName }); }
        editingGroupActor = null;
        refreshData();
    }

    function addTrait() { form.traits = [...form.traits, { level: 1, name: "", effect: "" }]; }
    function removeTrait(i) { form.traits = form.traits.filter((_, idx) => idx !== i); }
    function copyCode() { navigator.clipboard.writeText(generatedCode); ui.notifications.info("CÓDIGO COPIADO."); }
</script>

<div class="tactical-origin-interface">
    <aside class="command-sidebar">
        <div class="sidebar-header">
            <i class="fas fa-dna"></i> <h3>GENETIC_HUB</h3>
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
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" bind:value={searchQuery} placeholder="Buscar Agente/Pasta..." />
                </div>
                
                <label style="margin-top:15px;">FILTRAGEM_DE_SQUAD</label>
                <select bind:value={groupFilter}>
                    {#each allGroups as g} <option value={g}>{g}</option> {/each}
                </select>
            </div>
        {/if}
        
        <div class="system-footer"><small>KERNEL_LINK: STABLE</small><div class="blink-dot"></div></div>
    </aside>

    <main class="content-area">
        {#if currentTab === 'manage'}
            <div class="dossier-view" in:fade>
                <header class="view-header"><span>AGENTES_IDENTIFICADOS_NO_SISTEMA ({filteredActors.length})</span></header>
                <div class="dossier-grid">
                    {#each filteredActors as act (act.id)}
                        <div class="dossier-card" style="border-left: 6px solid {act.color}" transition:slide|local>
                            <div class="card-identity">
                                <div class="id-icon"><i class="fas fa-fingerprint"></i></div>
                                {#if editingGroupActor === act.id}
                                    <div class="group-editor" transition:slide={{axis: 'y'}}>
                                        <input type="text" bind:value={newGroupName} on:keypress={e => e.key === 'Enter' && saveGroup(act.id)} />
                                        <button on:click={() => saveGroup(act.id)}>OK</button>
                                    </div>
                                {:else}
                                    <span class="unit-tag" on:click={() => changeGroup(act)} title="Clique para editar grupo">{act.group}</span>
                                {/if}
                            </div>
                            <div class="card-info">
                                <span class="agent-name">{act.name.toUpperCase()}</span>
                                <div class="agent-meta">
                                    <span class="meta-player"><i class="fas fa-user"></i> {act.ownerName}</span>
                                    <span class="meta-folder"><i class="fas fa-folder"></i> {act.folder}</span>
                                </div>
                                <div class="current-origin">
                                    <span class="orb" style="background: var(--c-primary)"></span>
                                    {act.origin.icon} {act.origin.name} <small>[{act.origin.type}]</small>
                                </div>
                            </div>
                            <div class="card-select">
                                <label>MODIFICAR_CÓDIGO_GENÉTICO</label>
                                <select value={act.origin.id} on:change={(e) => setOrigin(act.id, e.target.value)}>
                                    {#each originList as org}
                                        <option value={org.id}>{org.icon} {org.name}</option>
                                    {/each}
                                </select>
                            </div>
                        </div>
                    {/each}
                    {#if filteredActors.length === 0}
                        <div class="empty-state">Nenhum agente corresponde aos parâmetros de busca.</div>
                    {/if}
                </div>
            </div>
            
        {:else}
            <div class="architect-view" in:fade>
                <div class="editor-pane custom-scroll">
                    <div class="form-row">
                        <div class="f-group"><label>NOME_DA_RAÇA</label><input type="text" bind:value={form.name} /></div>
                        <div class="f-group mini"><label>ICON</label><input type="text" bind:value={form.icon} /></div>
                        <div class="f-group"><label>TIPO_CUSTO</label><input type="text" bind:value={form.type} /></div>
                    </div>
                    <label>ARQUIVO_HISTÓRICO (HTML)</label><textarea bind:value={form.desc}></textarea>
                    
                    <div class="sub-panel">
                        <label>MECÂNICA_EXCLUSIVA</label>
                        <input type="text" bind:value={form.mechName} placeholder="Nome..." />
                        <textarea bind:value={form.mechDesc} placeholder="Regras..."></textarea>
                    </div>
                    
                    <div class="sub-panel">
                        <div class="panel-header-btn"><label>TRAITS_GENÉTICAS (POR NÍVEL)</label><button on:click={addTrait}>+ ADICIONAR</button></div>
                        {#each form.traits as t, i}
                            <div class="trait-row" transition:slide|local>
                                <select bind:value={t.level} class="lvl-select" title="Nível de Desbloqueio">
                                    <option value={1}>Nv 1</option>
                                    <option value={3}>Nv 3</option>
                                    <option value={6}>Nv 6</option>
                                    <option value={9}>Nv 9</option>
                                </select>
                                <input type="text" bind:value={t.name} placeholder="Nome da Habilidade" />
                                <input type="text" bind:value={t.effect} placeholder="Efeito mecânico" />
                                <button class="del-btn" on:click={() => removeTrait(i)}><i class="fas fa-times"></i></button>
                            </div>
                        {/each}
                    </div>
                    
                    <label>PODERES_REGRAS (HTML)</label><textarea bind:value={form.powers}></textarea>
                </div>
                
                <div class="output-pane">
                    <header><span>KERNEL_BLUEPRINT.js</span><button class="copy-btn" on:click={copyCode}><i class="fas fa-copy"></i> COPIAR_DADOS</button></header>
                    <pre class="custom-scroll"><code>{generatedCode}</code></pre>
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

    /* FILTROS E BUSCA */
    .filter-panel label { font-size: 10px; opacity: 0.6; display: block; margin-bottom: 8px; }
    .search-box { display: flex; align-items: center; background: #000; border: 1px solid #00ff41; padding: 0 10px; transition: 0.2s; }
    .search-box i { color: #008822; }
    .search-box input { flex: 1; border: none; background: transparent; padding: 10px; color: #00ff41; outline: none; font-family: inherit; font-size: 11px; }
    .search-box input::placeholder { color: rgba(0, 255, 65, 0.3); }
    .search-box:focus-within { box-shadow: 0 0 10px rgba(0, 255, 65, 0.2); }
    select { background: #000; color: #00ff41; border: 1px solid #00ff41; padding: 10px; font-family: inherit; width: 100%; outline: none; }

    /* --- CONTENT AREA --- */
    .content-area { flex: 1; display: flex; flex-direction: column; height: 100%; overflow: hidden; background: radial-gradient(circle at center, #001a00 0%, #000 100%); }
    .dossier-view { flex: 1; display: flex; flex-direction: column; padding: 30px; height: 100%; overflow: hidden;}
    .view-header { font-size: 12px; margin-bottom: 20px; border-bottom: 1px solid rgba(0,255,65,0.2); padding-bottom: 10px; opacity: 0.7; }

    .dossier-grid { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; padding-right: 15px; }
    
    .dossier-card {
        display: flex; min-height: 100px; background: rgba(0, 30, 0, 0.3); border: 1px solid rgba(0, 255, 65, 0.2);
        transition: 0.2s; clip-path: polygon(0 0, 98% 0, 100% 20%, 100% 100%, 2% 100%, 0 80%);
    }
    .dossier-card:hover { background: rgba(0, 255, 65, 0.08); border-color: #00ff41; }

    .card-identity { width: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 1px solid rgba(0, 255, 65, 0.1); }
    .id-icon { font-size: 28px; opacity: 0.3; }
    .unit-tag { font-size: 9px; background: #000; padding: 2px 8px; border: 1px solid #004411; color: #00ff41; cursor: pointer; margin-top: 8px; }
    .unit-tag:hover { background: #004411; color: #fff; }

    .group-editor { display: flex; flex-direction: column; gap: 2px; padding: 5px; }
    .group-editor input { width: 80px; font-size: 9px; padding: 2px; border: 1px solid #00ff41; background: #000; color: #fff; }
    .group-editor button { background: #00ff41; color: #000; border: none; font-size: 8px; font-weight: bold; cursor: pointer; }

    .card-info { flex: 1; padding: 15px 25px; display: flex; flex-direction: column; justify-content: center; }
    .agent-name { font-size: 18px; font-weight: bold; color: #fff; text-shadow: 0 0 10px rgba(0,255,65,0.2); }
    .agent-meta { display: flex; gap: 15px; font-size: 10px; color: #555; margin-bottom: 5px; }
    .meta-player i, .meta-folder i { opacity: 0.5; margin-right: 3px; }
    
    .current-origin { font-size: 13px; color: #00ff41; display: flex; align-items: center; gap: 8px; margin-top: 5px; }
    .orb { width: 6px; height: 6px; border-radius: 50%; box-shadow: 0 0 5px currentColor; }
    .current-origin small { opacity: 0.4; font-size: 9px; }

    .card-select { width: 250px; padding: 15px; background: rgba(0,0,0,0.4); display: flex; flex-direction: column; gap: 8px; justify-content: center;}
    .card-select label { font-size: 9px; opacity: 0.5; letter-spacing: 1px; }

    .empty-state { text-align: center; color: #008822; margin-top: 40px; font-style: italic; }

    /* --- ARCHITECT VIEW --- */
    .architect-view { display: grid; grid-template-columns: 1fr 1fr; height: 100%; overflow: hidden;}
    .editor-pane { padding: 30px; overflow-y: auto; border-right: 1px solid #004411; display: flex; flex-direction: column; gap: 15px; }
    .form-row { display: grid; grid-template-columns: 1.5fr 60px 1.2fr; gap: 15px; }
    .f-group { display: flex; flex-direction: column; gap: 5px; }
    
    input, textarea { background: #080808; border: 1px solid #004411; color: #fff; padding: 10px; font-family: inherit; font-size: 13px; outline: none;}
    input:focus, textarea:focus { border-color: #00ff41; }
    textarea { resize: vertical; min-height: 80px; }
    
    .sub-panel { border: 1px solid #004411; padding: 15px; background: rgba(255,255,255,0.02); display: flex; flex-direction: column; gap: 10px; }
    .panel-header-btn { display: flex; justify-content: space-between; align-items: center; }
    .panel-header-btn button { background: #00ff41; color: #000; border: none; font-size: 10px; padding: 4px 12px; cursor: pointer; font-weight: bold; }

    /* Trait Grid: Atualizado para Select do Level */
    .trait-row { display: grid; grid-template-columns: 60px 140px 1fr 30px; gap: 8px; }
    .lvl-select { padding: 8px; font-size: 11px; }
    .del-btn { background: #300; color: #f44; border: 1px solid #f44; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .del-btn:hover { background: #f44; color: #000; }

    .output-pane { background: #000; display: flex; flex-direction: column; overflow: hidden; }
    .output-pane header { padding: 15px; background: #050505; border-bottom: 1px solid #004411; display: flex; justify-content: space-between; align-items: center; }
    .copy-btn { background: #00ff41; color: #000; border: none; padding: 8px 18px; font-family: inherit; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px;}
    .copy-btn:hover { background: #fff; }
    pre { flex: 1; padding: 25px; margin: 0; overflow: auto; color: #00ff41; font-size: 12px; line-height: 1.5; }

    .system-footer { margin-top: auto; padding-top: 20px; border-top: 1px solid #004411; display: flex; justify-content: space-between; align-items: center; }
    .blink-dot { width: 8px; height: 8px; background: #00ff41; border-radius: 50%; animation: blink 1.5s infinite; }
    
    .custom-scroll::-webkit-scrollbar { width: 6px; }
    .custom-scroll::-webkit-scrollbar-track { background: transparent; }
    .custom-scroll::-webkit-scrollbar-thumb { background: rgba(0, 255, 65, 0.3); border-radius: 3px; }
    @keyframes blink { 50% { opacity: 0.1; } }
</style>