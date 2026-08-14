<script>
    import { onMount, createEventDispatcher } from 'svelte';
    import { ArchetypeDatabase } from '../database/ArchetypeDatabase.js';
    import { ExclusivityDatabase } from '../database/ExclusivityDatabase.js';

    export let application;
    const dispatch = createEventDispatcher();
    const MODULE_ID = "multiversus-rpg";
    const isGM = game.user.isGM;

    let activeTab = "arquétipos"; // 'arquétipos' or 'exclusividades'

    // --- ARQUÉTIPOS STATE ---
    let archetypes = [];
    let selectedArchId = null;
    let editModeArch = false;
    let archName = "";
    let archDesc = "";
    let archIcon = "icons/svg/item-bag.svg";

    $: selectedArch = archetypes.find(a => a.id === selectedArchId);

    // --- EXCLUSIVIDADES STATE ---
    let excGroups = [];
    let selectedExcGroupId = null;
    let editModeExcGroup = false;
    let excGroupName = "";
    let excSearchTerm = "";

    // Virtual Exclusivity Form State
    let showExcForm = false;
    let editExcId = null;
    let excDataName = "";
    let excDataCategory = "Geral";
    let excDataDesc = "";

    $: selectedExcGroup = excGroups.find(g => g.id === selectedExcGroupId);
    $: filteredExcGroups = excGroups.filter(g => {
        if (!excSearchTerm.trim()) return true;
        const term = excSearchTerm.toLowerCase();
        if (g.name.toLowerCase().includes(term)) return true;
        return g.exclusivities.some(e => e.name.toLowerCase().includes(term) || (e.system && e.system.description && e.system.description.toLowerCase().includes(term)));
    });

    onMount(() => {
        refreshArch();
        refreshExc();
        Hooks.on("archetypesUpdated", refreshArch);
        Hooks.on("exclusivitiesUpdated", refreshExc);
    });

    function refreshArch() {
        archetypes = ArchetypeDatabase.getArchetypes();
        if (selectedArchId && !archetypes.find(a => a.id === selectedArchId)) selectedArchId = null;
    }

    function refreshExc() {
        excGroups = ExclusivityDatabase.getGroups();
        if (selectedExcGroupId && !excGroups.find(g => g.id === selectedExcGroupId)) selectedExcGroupId = null;
    }

    // --- ARQUÉTIPOS METHODS ---
    async function handleCreateArch() {
        if (!archName.trim()) return ui.notifications.warn("Nome inválido!");
        const newArch = await ArchetypeDatabase.createArchetype(archName, archDesc, archIcon);
        selectedArchId = newArch.id;
        resetFormArch();
    }
    async function handleUpdateArch() {
        if (!selectedArchId || !archName.trim()) return;
        await ArchetypeDatabase.updateArchetype(selectedArchId, { name: archName, description: archDesc, icon: archIcon });
        editModeArch = false;
        resetFormArch();
    }
    async function handleDeleteArch(id) {
        if (confirm("Tem certeza que deseja excluir este Arquétipo?")) {
            await ArchetypeDatabase.deleteArchetype(id);
            if (selectedArchId === id) selectedArchId = null;
        }
    }
    function resetFormArch() {
        archName = ""; archDesc = ""; archIcon = "icons/svg/item-bag.svg"; editModeArch = false;
    }
    function startEditArch() {
        if (!selectedArch) return;
        archName = selectedArch.name;
        archDesc = selectedArch.description;
        archIcon = selectedArch.icon;
        editModeArch = true;
    }
    function onDragStartArchTalent(e, talent) {
        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'Talent', id: talent.id }));
    }
    async function removeArchTalent(talentId) {
        if (!selectedArchId) return;
        await ArchetypeDatabase.removeTalent(selectedArchId, talentId);
    }

    // --- EXCLUSIVIDADES METHODS ---
    async function handleCreateExcGroup() {
        if (!excGroupName.trim()) return ui.notifications.warn("Nome inválido!");
        const newGroup = await ExclusivityDatabase.createGroup(excGroupName);
        selectedExcGroupId = newGroup.id;
        resetFormExcGroup();
    }
    async function handleUpdateExcGroup() {
        if (!selectedExcGroupId || !excGroupName.trim()) return;
        await ExclusivityDatabase.updateGroup(selectedExcGroupId, { name: excGroupName });
        editModeExcGroup = false;
        resetFormExcGroup();
    }
    async function handleDeleteExcGroup(id) {
        if (confirm("Tem certeza que deseja excluir este Grupo?")) {
            await ExclusivityDatabase.deleteGroup(id);
            if (selectedExcGroupId === id) selectedExcGroupId = null;
        }
    }
    function resetFormExcGroup() {
        excGroupName = ""; editModeExcGroup = false;
    }
    function startEditExcGroup() {
        if (!selectedExcGroup) return;
        excGroupName = selectedExcGroup.name;
        editModeExcGroup = true;
    }
    function onDragStartExclusivity(e, exc) {
        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'Exclusivity', data: exc }));
    }
    async function removeExclusivity(excId) {
        if (!selectedExcGroupId) return;
        await ExclusivityDatabase.removeExclusivity(selectedExcGroupId, excId);
    }
    
    function openExcForm(exc = null) {
        if (exc) {
            editExcId = exc.id;
            excDataName = exc.name;
            excDataCategory = exc.system?.category || "Geral";
            excDataDesc = exc.system?.description || "";
        } else {
            editExcId = null;
            excDataName = "";
            excDataCategory = "Geral";
            excDataDesc = "";
        }
        showExcForm = true;
    }
    
    async function saveExcForm() {
        if (!excDataName.trim()) return ui.notifications.warn("Nome inválido!");
        if (editExcId) {
            await ExclusivityDatabase.updateExclusivity(selectedExcGroupId, editExcId, {
                name: excDataName,
                system: { category: excDataCategory, description: excDataDesc }
            });
        } else {
            await ExclusivityDatabase.createVirtualExclusivity(selectedExcGroupId, {
                name: excDataName,
                category: excDataCategory,
                description: excDataDesc
            });
        }
        showExcForm = false;
    }

    // --- GLOBAL DROP HANDLER ---
    async function onDrop(e) {
        if (!isGM) return;
        const dataStr = e.dataTransfer.getData('text/plain');
        if (!dataStr) return;
        try {
            const data = JSON.parse(dataStr);
            if (data.type === 'Item') {
                const item = await Item.implementation.fromDropData(data);
                if (item) {
                    if (activeTab === 'arquétipos' && selectedArchId) {
                        await ArchetypeDatabase.addTalent(selectedArchId, item);
                        ui.notifications.info(`Talento ${item.name} adicionado ao Arquétipo!`);
                    }
                }
            }
        } catch (err) {
            console.error(err);
        }
    }
</script>

<div class="arch-manager">
    <div class="tabs-header">
        <button class="tab-btn {activeTab === 'arquétipos' ? 'active' : ''}" on:click={() => activeTab = 'arquétipos'}>ARQUÉTIPOS</button>
        <button class="tab-btn {activeTab === 'exclusividades' ? 'active' : ''}" on:click={() => activeTab = 'exclusividades'}>EXCLUSIVIDADES</button>
    </div>

    {#if activeTab === 'arquétipos'}
        <div class="tab-content">
            <!-- ARQUÉTIPOS VIEW -->
            <div class="sidebar">
                <div class="s-header">
                    <h3>ARQUÉTIPOS</h3>
                    {#if isGM}
                    <button class="btn-icon" on:click={() => {selectedArchId = null; resetFormArch();}} title="Novo Arquétipo"><i class="fas fa-plus"></i></button>
                    {/if}
                </div>
                <div class="s-list custom-scroll">
                    {#each archetypes as a}
                        <div class="s-item {selectedArchId === a.id ? 'active' : ''}" on:click={() => {selectedArchId = a.id; editModeArch = false;}}>
                            <img src={a.icon} alt="icon"/>
                            <span>{a.name}</span>
                            {#if isGM}
                            <button class="btn-trash" on:click|stopPropagation={() => handleDeleteArch(a.id)}><i class="fas fa-trash"></i></button>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>

            <div class="main-content" on:drop={onDrop} on:dragover={(e) => e.preventDefault()}>
                {#if (!selectedArchId || editModeArch) && isGM}
                    <div class="edit-panel">
                        <h2>{editModeArch ? 'EDITAR ARQUÉTIPO' : 'CRIAR ARQUÉTIPO'}</h2>
                        <div class="form-group">
                            <label>Nome do Arquétipo</label>
                            <input type="text" class="m-input" bind:value={archName} placeholder="Ex: Mago Tech"/>
                        </div>
                        <div class="form-group" style="display:flex; gap:10px; align-items:center;">
                            <img src={archIcon} alt="Icon" style="width:50px; height:50px; border:1px solid #00ff41; border-radius:4px;" />
                            <input type="text" class="m-input" bind:value={archIcon} placeholder="Caminho da imagem..." style="flex:1;" />
                        </div>
                        <div class="form-group">
                            <label>Descrição</label>
                            <textarea class="m-input" bind:value={archDesc} rows="4"></textarea>
                        </div>
                        <div class="actions">
                            {#if editModeArch}
                                <button class="btn-main" on:click={handleUpdateArch}>SALVAR</button>
                                <button class="btn-ghost" on:click={() => editModeArch = false}>CANCELAR</button>
                            {:else}
                                <button class="btn-main" on:click={handleCreateArch}>CRIAR</button>
                            {/if}
                        </div>
                    </div>
                {:else if selectedArch}
                    <div class="view-panel">
                        <div class="v-header">
                            <img src={selectedArch.icon} alt="icon"/>
                            <div class="v-info">
                                <h2>{selectedArch.name}</h2>
                                <p>{selectedArch.description}</p>
                            </div>
                            {#if isGM}
                            <button class="btn-ghost" style="margin-left:auto;" on:click={startEditArch}><i class="fas fa-edit"></i> Editar</button>
                            {/if}
                        </div>
                        <div class="v-talents-zone">
                            <div class="zone-label">{isGM ? 'TALENTOS (Arraste itens do Foundry para cá)' : 'TALENTOS'}</div>
                            <div class="talents-grid custom-scroll">
                                {#each selectedArch.talents as t}
                                    <div class="t-card">
                                        <img src={t.img} alt="talent"/>
                                        <div class="t-info">
                                            <span class="t-name">{t.name}</span>
                                            <span class="t-cost">Custo por Dado: {t.cost}</span>
                                        </div>
                                        {#if isGM}
                                        <button class="btn-trash-t" on:click={() => removeArchTalent(t.id)}><i class="fas fa-times"></i></button>
                                        {/if}
                                    </div>
                                {/each}
                                {#if selectedArch.talents.length === 0}
                                    <div style="padding:20px; text-align:center; color:#555; font-style:italic;">Nenhum talento neste arquétipo ainda.</div>
                                {/if}
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    {:else}
        <div class="tab-content">
            <!-- EXCLUSIVIDADES VIEW -->
            <div class="sidebar">
                <div class="s-header" style="flex-direction: column; align-items: stretch; gap: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3>GRUPOS EXCLUSIVOS</h3>
                        {#if isGM}
                        <button class="btn-icon" on:click={() => {selectedExcGroupId = null; resetFormExcGroup();}} title="Novo Grupo"><i class="fas fa-plus"></i></button>
                        {/if}
                    </div>
                    <input type="text" class="m-input" style="padding: 5px; font-size: 11px;" bind:value={excSearchTerm} placeholder="Pesquisar grupos/itens..."/>
                </div>
                <div class="s-list custom-scroll">
                    {#each filteredExcGroups as g}
                        <div class="s-item {selectedExcGroupId === g.id ? 'active' : ''}" on:click={() => {selectedExcGroupId = g.id; editModeExcGroup = false;}}>
                            <span style="padding: 5px 0;"><i class="fas fa-folder"></i> {g.name}</span>
                            {#if isGM}
                            <button class="btn-trash" on:click|stopPropagation={() => handleDeleteExcGroup(g.id)}><i class="fas fa-trash"></i></button>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>

            <div class="main-content" on:drop={onDrop} on:dragover={(e) => e.preventDefault()}>
                {#if (!selectedExcGroupId || editModeExcGroup) && isGM}
                    <div class="edit-panel">
                        <h2>{editModeExcGroup ? 'EDITAR GRUPO' : 'CRIAR GRUPO DE EXCLUSIVIDADES'}</h2>
                        <div class="form-group">
                            <label>Nome do Grupo</label>
                            <input type="text" class="m-input" bind:value={excGroupName} placeholder="Ex: Social, Vantagens, etc"/>
                        </div>
                        <div class="actions">

                            {#if editModeExcGroup}
                                <button class="btn-main" on:click={handleUpdateExcGroup}>SALVAR</button>
                                <button class="btn-ghost" on:click={() => editModeExcGroup = false}>CANCELAR</button>
                            {:else}
                                <button class="btn-main" on:click={handleCreateExcGroup}>CRIAR</button>
                            {/if}
                        </div>
                    </div>
                {:else if selectedExcGroup}
                    <div class="view-panel">
                        <div class="v-header">
                            <div class="v-info">
                                <h2><i class="fas fa-folder-open" style="color: #00ff41;"></i> {selectedExcGroup.name}</h2>
                                <p style="font-size: 11px; color: #888;">Arraste e solte uma Exclusividade abaixo na Ficha do Jogador (Aba de Perfil -> Exclusividades).</p>
                            </div>
                            {#if isGM}
                            <div class="v-actions" style="display:flex; gap:10px; margin-left:auto;">
                                <button class="btn-ghost" style="border: 1px solid #9900ff; color: #e0e0e0; background: rgba(153,0,255,0.1);" on:click={() => openExcForm()}><i class="fas fa-plus" style="color:#9900ff;"></i> Criar Exclusividade</button>
                                <button class="btn-ghost" on:click={startEditExcGroup}><i class="fas fa-edit"></i> Editar Grupo</button>
                            </div>
                            {/if}
                        </div>
                        <div class="v-talents-zone">
                            <div class="zone-label">{isGM ? 'EXCLUSIVIDADES (Arraste itens do Foundry para cá)' : 'EXCLUSIVIDADES'}</div>
                            <div class="talents-grid custom-scroll">
                                {#each selectedExcGroup.exclusivities.filter(e => {
                                    if(!excSearchTerm) return true;
                                    const t = excSearchTerm.toLowerCase();
                                    return e.name.toLowerCase().includes(t) || (e.system && e.system.description && e.system.description.toLowerCase().includes(t));
                                }) as exc}
                                    <div class="t-card" draggable="true" on:dragstart={(e) => onDragStartExclusivity(e, exc)} on:click={() => { if(isGM) openExcForm(exc); }} title="Arraste para a Ficha do Jogador" style="cursor: grab;">
                                        <img src={exc.img} alt="exc"/>
                                        <div class="t-info">
                                            <span class="t-name">{exc.name} <span style="color:#00ff41; font-size:10px;">({exc.system?.category || 'Geral'})</span></span>
                                            <span class="t-cost" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">
                                                {exc.system?.description?.replace(/<[^>]+>/g, '') || 'Sem descrição.'}
                                            </span>
                                        </div>
                                        {#if isGM}
                                        <button class="btn-trash-t" on:click|stopPropagation={() => removeExclusivity(exc.id)}><i class="fas fa-times"></i></button>
                                        {/if}
                                    </div>
                                {/each}
                                {#if selectedExcGroup.exclusivities.length === 0}
                                    <div style="padding:20px; text-align:center; color:#555; font-style:italic;">Nenhuma exclusividade neste grupo.</div>
                                {/if}
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    {/if}

    {#if showExcForm}
    <div class="exc-modal-overlay">
        <div class="exc-modal">
            <h2>{editExcId ? 'EDITAR EXCLUSIVIDADE' : 'NOVA EXCLUSIVIDADE'}</h2>
            
            <div class="form-group">
                <label>Nome</label>
                <input type="text" class="m-input" bind:value={excDataName} placeholder="Nome da exclusividade..." />
            </div>
            
            <div class="form-group">
                <label>Categoria</label>
                <input type="text" class="m-input" bind:value={excDataCategory} placeholder="Ex: Geral, Social..." />
            </div>

            <div class="form-group">
                <label>Descrição</label>
                <textarea class="m-input" bind:value={excDataDesc} rows="6" placeholder="Descrição do efeito..."></textarea>
            </div>
            
            <div class="actions" style="margin-top: 15px; display: flex; gap: 10px;">
                <button class="btn-main" style="background:#9900ff; border-color:#9900ff; color:#fff;" on:click={saveExcForm}>SALVAR</button>
                <button class="btn-ghost" on:click={() => showExcForm = false}>CANCELAR</button>
            </div>
        </div>
    </div>
    {/if}
</div>

<style>
    .arch-manager { display: flex; flex-direction: column; width: 100%; height: 100%; background: #0a0a0c; color: #e0e0e0; font-family: 'Share Tech Mono', monospace; overflow: hidden; }
    
    .tabs-header { display: flex; background: rgba(0,0,0,0.8); border-bottom: 2px solid #00ff41; flex-shrink: 0;}
    .tab-btn { flex: 1; background: transparent; border: none; color: #888; font-family: inherit; font-size: 14px; font-weight: bold; padding: 12px; cursor: pointer; transition: 0.2s;}
    .tab-btn:hover { color: #00ff41; background: rgba(0,255,65,0.05); }
    .tab-btn.active { color: #000; background: #00ff41; }

    .tab-content { display: flex; flex: 1; overflow: hidden; }

    .sidebar { width: 280px; background: rgba(0,0,0,0.5); border-right: 1px solid #00ff41; display: flex; flex-direction: column; }
    .s-header { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(0,255,65,0.1); border-bottom: 1px solid #00ff41; color: #00ff41; }
    .s-header h3 { margin: 0; font-size: 16px; }
    .btn-icon { background: transparent; border: 1px solid #00ff41; color: #00ff41; padding: 5px 8px; cursor: pointer; border-radius: 4px; }
    .btn-icon:hover { background: #00ff41; color: #000; }
    .s-list { flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 5px; }
    .s-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 1px solid #333; cursor: pointer; border-radius: 4px; transition: 0.2s; background: rgba(0,0,0,0.4); }
    .s-item:hover { border-color: #00ff41; }
    .s-item.active { border-color: #00ff41; background: rgba(0,255,65,0.15); font-weight: bold; }
    .s-item img { width: 30px; height: 30px; border-radius: 4px; }
    .s-item span { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 13px; }
    .btn-trash { background: transparent; border: none; color: #ff4444; cursor: pointer; opacity: 0; }
    .s-item:hover .btn-trash { opacity: 1; }

    .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; padding: 20px; }
    .edit-panel, .view-panel { display: flex; flex-direction: column; height: 100%; max-width: 800px; margin: 0 auto; width: 100%; gap: 15px; }
    
    .edit-panel h2 { color: #00ff41; border-bottom: 1px solid #00ff41; padding-bottom: 10px; margin-bottom: 15px; }
    .form-group { display: flex; flex-direction: column; gap: 5px; margin-bottom: 15px; }
    .form-group label { color: #aaa; font-size: 12px; }
    
    .exc-modal-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 100; }
    .exc-modal { width: 400px; background: #111; border: 1px solid #9900ff; padding: 20px; border-radius: 5px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 0 20px rgba(153,0,255,0.3); }
    .exc-modal h2 { margin-top: 0; color: #9900ff; border-bottom: 1px solid #9900ff; padding-bottom: 5px; }
    .m-input { background: #111; border: 1px solid #444; color: #00ff41; padding: 10px; border-radius: 4px; font-family: inherit; width: 100%; box-sizing: border-box; outline: none; }
    .m-input:focus { border-color: #00ff41; }

    .actions { display: flex; gap: 10px; }
    .btn-main { background: #00ff41; color: #000; border: none; padding: 10px 20px; font-family: inherit; font-weight: bold; cursor: pointer; border-radius: 4px; transition: 0.2s; }
    .btn-main:hover { box-shadow: 0 0 15px #00ff41; }
    .btn-ghost { background: transparent; border: 1px solid #555; color: #aaa; padding: 10px 20px; font-family: inherit; font-weight: bold; cursor: pointer; border-radius: 4px; transition: 0.2s; }
    .btn-ghost:hover { border-color: #00ff41; color: #00ff41; }

    .v-header { display: flex; gap: 20px; background: rgba(0,0,0,0.5); border: 1px solid #333; padding: 20px; border-radius: 4px; align-items: flex-start; }
    .v-header img { width: 80px; height: 80px; border-radius: 8px; border: 2px solid #00ff41; object-fit: cover; }
    .v-info { display: flex; flex-direction: column; gap: 5px; flex: 1; }
    .v-info h2 { margin: 0; color: #00ff41; font-size: 24px; }
    .v-info p { margin: 0; color: #aaa; font-size: 14px; line-height: 1.5; }

    .v-talents-zone { flex: 1; display: flex; flex-direction: column; background: rgba(0,0,0,0.3); border: 1px dashed #00ff41; border-radius: 4px; overflow: hidden; }
    .zone-label { background: rgba(0,255,65,0.1); color: #00ff41; padding: 10px; font-weight: bold; text-align: center; border-bottom: 1px dashed #00ff41; font-size: 12px; }
    .talents-grid { flex: 1; padding: 15px; display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; overflow-y: auto; align-content: flex-start; }
    
    .t-card { background: #111; border: 1px solid #333; border-radius: 4px; display: flex; gap: 10px; padding: 10px; position: relative; transition: 0.2s; align-items: center; }
    .t-card:hover { border-color: #00ff41; }
    .t-card img { width: 40px; height: 40px; border-radius: 4px; border: 1px solid #444; }
    .t-info { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
    .t-name { color: #fff; font-weight: bold; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .t-cost { color: #00ff41; font-size: 11px; }
    .btn-trash-t { position: absolute; right: 5px; top: 5px; background: #ff4444; color: #fff; border: none; width: 20px; height: 20px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.2s; font-size: 10px;}
    .t-card:hover .btn-trash-t { opacity: 1; }

    .custom-scroll::-webkit-scrollbar { width: 6px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #00ff41; border-radius: 4px; }
</style>
