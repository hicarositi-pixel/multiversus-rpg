<script>
    import { onMount, createEventDispatcher } from 'svelte';
    import { ArchetypeDatabase } from '../database/ArchetypeDatabase.js';

    export let application;
    const dispatch = createEventDispatcher();
    const MODULE_ID = "multiversus-rpg";
    const isGM = game.user.isGM;

    let archetypes = [];
    let selectedArchId = null;
    let editMode = false;
    
    // New/Edit state
    let archName = "";
    let archDesc = "";
    let archIcon = "icons/svg/item-bag.svg";

    $: selectedArch = archetypes.find(a => a.id === selectedArchId);

    onMount(() => {
        refresh();
        Hooks.on("archetypesUpdated", refresh);
    });

    function refresh() {
        archetypes = ArchetypeDatabase.getArchetypes();
        if (selectedArchId && !archetypes.find(a => a.id === selectedArchId)) selectedArchId = null;
    }

    async function handleCreate() {
        if (!archName.trim()) return ui.notifications.warn("Nome inválido!");
        const newArch = await ArchetypeDatabase.createArchetype(archName, archDesc, archIcon);
        selectedArchId = newArch.id;
        resetForm();
    }

    async function handleUpdate() {
        if (!selectedArchId || !archName.trim()) return;
        await ArchetypeDatabase.updateArchetype(selectedArchId, { name: archName, description: archDesc, icon: archIcon });
        editMode = false;
        resetForm();
    }

    async function handleDelete(id) {
        if (confirm("Tem certeza que deseja excluir este Arquétipo?")) {
            await ArchetypeDatabase.deleteArchetype(id);
            if (selectedArchId === id) selectedArchId = null;
        }
    }

    function resetForm() {
        archName = ""; archDesc = ""; archIcon = "icons/svg/item-bag.svg"; editMode = false;
    }

    function startEdit() {
        if (!selectedArch) return;
        archName = selectedArch.name;
        archDesc = selectedArch.description;
        archIcon = selectedArch.icon;
        editMode = true;
    }

    // --- Drag and Drop ---
    function onDragStart(e, talent) {
        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'Talent', id: talent.id }));
    }

    async function onDrop(e) {
        if (!isGM || !selectedArchId) return;
        const dataStr = e.dataTransfer.getData('text/plain');
        if (!dataStr) return;
        try {
            const data = JSON.parse(dataStr);
            if (data.type === 'Item') {
                const item = await Item.implementation.fromDropData(data);
                if (item) {
                    await ArchetypeDatabase.addTalent(selectedArchId, item);
                    ui.notifications.info(`Talento ${item.name} adicionado ao Arquétipo!`);
                }
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function removeTalent(talentId) {
        if (!selectedArchId) return;
        await ArchetypeDatabase.removeTalent(selectedArchId, talentId);
    }
</script>

<div class="arch-manager">
    <div class="sidebar">
        <div class="s-header">
            <h3>ARQUÉTIPOS</h3>
            {#if isGM}
            <button class="btn-icon" on:click={() => {selectedArchId = null; resetForm();}} title="Novo Arquétipo"><i class="fas fa-plus"></i></button>
            {/if}
        </div>
        <div class="s-list custom-scroll">
            {#each archetypes as a}
                <div class="s-item {selectedArchId === a.id ? 'active' : ''}" on:click={() => {selectedArchId = a.id; editMode = false;}}>
                    <img src={a.icon} alt="icon"/>
                    <span>{a.name}</span>
                    {#if isGM}
                    <button class="btn-trash" on:click|stopPropagation={() => handleDelete(a.id)}><i class="fas fa-trash"></i></button>
                    {/if}
                </div>
            {/each}
        </div>
    </div>

    <div class="main-content" on:drop={onDrop} on:dragover={(e) => e.preventDefault()}>
        {#if (!selectedArchId || editMode) && isGM}
            <div class="edit-panel">
                <h2>{editMode ? 'EDITAR ARQUÉTIPO' : 'CRIAR ARQUÉTIPO'}</h2>
                <div class="form-group">
                    <label>Nome do Arquétipo</label>
                    <input type="text" class="m-input" bind:value={archName} placeholder="Ex: Mago Tech"/>
                </div>
                <div class="form-group" style="display:flex; gap:10px; align-items:center;">
                    <img src={archIcon} alt="Icon" style="width:50px; height:50px; border:1px solid #00ff41; border-radius:4px;" />
                    <input type="text" class="m-input" bind:value={archIcon} placeholder="Caminho da imagem..." style="flex:1;" />
                    <!-- In a real scenario we'd use FilePicker, but for simplicity input is fine -->
                </div>
                <div class="form-group">
                    <label>Descrição</label>
                    <textarea class="m-input" bind:value={archDesc} rows="4"></textarea>
                </div>
                <div class="actions">
                    {#if editMode}
                        <button class="btn-main" on:click={handleUpdate}>SALVAR</button>
                        <button class="btn-ghost" on:click={() => editMode = false}>CANCELAR</button>
                    {:else}
                        <button class="btn-main" on:click={handleCreate}>CRIAR</button>
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
                    <button class="btn-ghost" style="margin-left:auto;" on:click={startEdit}><i class="fas fa-edit"></i> Editar</button>
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
                                <button class="btn-trash-t" on:click={() => removeTalent(t.id)}><i class="fas fa-times"></i></button>
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

<style>
    .arch-manager { display: flex; width: 100%; height: 100%; background: #0a0a0c; color: #e0e0e0; font-family: 'Share Tech Mono', monospace; overflow: hidden; }
    
    .sidebar { width: 250px; background: rgba(0,0,0,0.5); border-right: 1px solid #00ff41; display: flex; flex-direction: column; }
    .s-header { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(0,255,65,0.1); border-bottom: 1px solid #00ff41; color: #00ff41; }
    .s-header h3 { margin: 0; font-size: 16px; }
    .btn-icon { background: transparent; border: 1px solid #00ff41; color: #00ff41; padding: 5px 8px; cursor: pointer; border-radius: 4px; }
    .s-list { flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 5px; }
    .s-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 1px solid #333; cursor: pointer; border-radius: 4px; transition: 0.2s; background: rgba(0,0,0,0.4); }
    .s-item:hover { border-color: #00ff41; }
    .s-item.active { border-color: #00ff41; background: rgba(0,255,65,0.15); font-weight: bold; }
    .s-item img { width: 30px; height: 30px; border-radius: 4px; }
    .s-item span { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .btn-trash { background: transparent; border: none; color: #ff4444; cursor: pointer; opacity: 0; }
    .s-item:hover .btn-trash { opacity: 1; }

    .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; padding: 20px; }
    .edit-panel, .view-panel { display: flex; flex-direction: column; height: 100%; max-width: 600px; margin: 0 auto; width: 100%; gap: 15px; }
    
    .edit-panel h2 { color: #00ff41; border-bottom: 1px solid #00ff41; padding-bottom: 10px; margin-bottom: 15px; }
    .form-group { display: flex; flex-direction: column; gap: 5px; margin-bottom: 15px; }
    .form-group label { color: #aaa; font-size: 12px; }
    .m-input { background: #111; border: 1px solid #444; color: #00ff41; padding: 10px; border-radius: 4px; font-family: inherit; }
    .m-input:focus { border-color: #00ff41; outline: none; }
    .actions { display: flex; gap: 10px; margin-top: 10px; }
    .btn-main { background: #00ff41; color: #000; font-weight: bold; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
    .btn-ghost { background: transparent; color: #ccc; padding: 10px 20px; border: 1px solid #444; border-radius: 4px; cursor: pointer; }

    .view-panel { max-width: 800px; }
    .v-header { display: flex; align-items: center; gap: 20px; background: rgba(0,255,65,0.05); padding: 20px; border-radius: 8px; border: 1px solid #333; }
    .v-header img { width: 80px; height: 80px; border-radius: 8px; border: 2px solid #00ff41; }
    .v-info h2 { margin: 0 0 5px 0; color: #00ff41; }
    .v-info p { margin: 0; color: #ccc; font-size: 13px; line-height: 1.4; }

    .v-talents-zone { flex: 1; display: flex; flex-direction: column; border: 2px dashed #444; border-radius: 8px; background: rgba(0,0,0,0.3); margin-top: 20px; overflow: hidden; }
    .zone-label { background: rgba(0,0,0,0.5); padding: 10px; text-align: center; color: #888; font-size: 12px; border-bottom: 1px solid #333; }
    .talents-grid { flex: 1; padding: 15px; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; overflow-y: auto; align-content: start; }
    
    .t-card { background: #111; border: 1px solid #333; border-radius: 6px; padding: 10px; display: flex; align-items: center; gap: 10px; position: relative; transition: 0.2s; }
    .t-card:hover { border-color: #00bfff; }
    .t-card img { width: 40px; height: 40px; border-radius: 4px; }
    .t-info { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
    .t-name { font-weight: bold; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 14px; }
    .t-cost { color: #888; font-size: 11px; }
    .btn-trash-t { background: transparent; border: none; color: #ff4444; cursor: pointer; padding: 5px; opacity: 0; transition: 0.2s; }
    .t-card:hover .btn-trash-t { opacity: 1; }

    .custom-scroll::-webkit-scrollbar { width: 6px; }
    .custom-scroll::-webkit-scrollbar-track { background: transparent; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
</style>
