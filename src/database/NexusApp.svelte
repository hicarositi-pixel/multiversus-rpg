<script>
    import { onMount, onDestroy } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import { NexusDatabase } from './NexusDatabase.js';

    // --- ESTADO ---
    let rootFolder = null;
    let allFolders = [];
    let allItems = [];
    
    let currentFolderId = null; 
    let navigationPath = []; // [{id, name}]

    let activeItem = null; // Item sendo visualizado
    let activeDraft = null; // Item/Pasta sendo criado/editado
    let userSearchQuery = ""; // Busca de usuários para permissão

    // --- CATEGORIAS ---
    const ITEM_TYPES = ["Doc", "NPC", "Item", "Local", "Facção", "História Macro", "História Micro", "Quest", "Sistema", "Instruções", "Anotações", "Script"];

    onMount(() => {
        loadData();
        // Hooks do Foundry para reatividade
        Hooks.on("createJournalEntry", loadData);
        Hooks.on("updateJournalEntry", loadData);
        Hooks.on("deleteJournalEntry", loadData);
        Hooks.on("createFolder", loadData);
        Hooks.on("updateFolder", loadData);
        Hooks.on("deleteFolder", loadData);
    });

    onDestroy(() => {
        Hooks.off("createJournalEntry", loadData);
        Hooks.off("updateJournalEntry", loadData);
        Hooks.off("deleteJournalEntry", loadData);
        Hooks.off("createFolder", loadData);
        Hooks.off("updateFolder", loadData);
        Hooks.off("deleteFolder", loadData);
    });

    function loadData() {
        const data = NexusDatabase.getData();
        rootFolder = data.rootFolder;
        allFolders = data.folders;
        
        // Filtra apenas itens que o jogador atual tem permissão para ver (testado pelo testUserPermission do Foundry V10+)
        // Ou simplesmente j.visible no Foundry V11.
        allItems = data.items.filter(j => j.visible);

        // Se currentFolderId for nulo, iniciamos na raiz
        if (currentFolderId === null && rootFolder) {
            currentFolderId = rootFolder.id;
        }

        // Se estivemos numa pasta que foi deletada, voltamos pra raiz
        if (currentFolderId !== (rootFolder ? rootFolder.id : null) && !allFolders.find(f => f.id === currentFolderId)) {
            navigateToRoot();
        }
    }

    $: currentFolders = allFolders.filter(f => f.folder?.id === currentFolderId);
    $: currentItems = allItems.filter(j => j.folder?.id === currentFolderId);

    // --- NAVEGAÇÃO ---
    function navigateTo(folderId, folderName) {
        currentFolderId = folderId;
        const idx = navigationPath.findIndex(p => p.id === folderId);
        if (idx !== -1) {
            navigationPath = navigationPath.slice(0, idx + 1); // Corta o path até essa pasta
        } else {
            navigationPath = [...navigationPath, { id: folderId, name: folderName }];
        }
        closePanels();
    }

    function navigateToRoot() {
        currentFolderId = rootFolder ? rootFolder.id : null;
        navigationPath = [];
        closePanels();
    }

    function closePanels() {
        activeItem = null;
        activeDraft = null;
    }

    // --- AÇÕES DE CRIAÇÃO/EDIÇÃO ---
    function createFolder() {
        activeItem = null;
        activeDraft = {
            isFolder: true,
            name: "Nova Pasta",
            parentId: currentFolderId,
            permissions: []
        };
    }

    function createFile() {
        activeItem = null;
        activeDraft = {
            isFolder: false,
            name: "Novo Arquivo",
            description: "",
            itemType: "Doc",
            tags: "",
            img: "icons/svg/mystery-man.svg",
            parentId: currentFolderId,
            permissions: []
        };
    }

    function editItem(item) {
        // Extrai os dados do JournalEntry e sua Page principal
        const page = item.pages.size > 0 ? item.pages.contents[0] : null;
        const flags = page ? (page.flags["multiversus-rpg"] || {}) : {};
        
        // Extrai IDs dos usuários com permissão
        const perms = [];
        for (const [userId, level] of Object.entries(item.ownership)) {
            if (level >= 2 && userId !== "default" && userId !== game.user.id) {
                perms.push(userId);
            }
        }

        activeItem = null;
        activeDraft = {
            id: item.id,
            isFolder: false,
            name: item.name,
            description: page ? page.text.content : "",
            itemType: flags.itemType || "Doc",
            tags: flags.tags || "",
            img: flags.img || "icons/svg/mystery-man.svg",
            parentId: item.folder?.id || currentFolderId,
            permissions: perms
        };
    }

    function editFolder(folder) {
        activeItem = null;
        activeDraft = {
            id: folder.id,
            isFolder: true,
            name: folder.name,
            parentId: folder.folder?.id || currentFolderId,
            permissions: []
        };
    }

    async function saveDraft() {
        if (!activeDraft.name.trim()) return ui.notifications.warn("O nome não pode ser vazio.");
        await NexusDatabase.createOrUpdate(activeDraft, activeDraft.isFolder);
        activeDraft = null;
    }

    async function deleteDraft() {
        if (!activeDraft.id) return (activeDraft = null);
        new Dialog({
            title: "Excluir?",
            content: `Deseja excluir <b>${activeDraft.name}</b> permanentemente?`,
            buttons: {
                yes: { label: "Apagar", icon: "<i class='fas fa-trash'></i>", callback: async () => {
                    await NexusDatabase.deleteEntry(activeDraft.id, activeDraft.isFolder);
                    activeDraft = null;
                }},
                no: { label: "Cancelar" }
            },
            default: "no"
        }).render(true);
    }

    async function deleteViewedItem() {
        new Dialog({
            title: "Excluir?",
            content: `Deseja excluir <b>${activeItem.name}</b> permanentemente?`,
            buttons: {
                yes: { label: "Apagar", icon: "<i class='fas fa-trash'></i>", callback: async () => {
                    await NexusDatabase.deleteEntry(activeItem.id, false);
                    activeItem = null;
                }},
                no: { label: "Cancelar" }
            },
            default: "no"
        }).render(true);
    }

    function openItem(item) {
        const page = item.pages.size > 0 ? item.pages.contents[0] : null;
        const flags = page ? (page.flags["multiversus-rpg"] || {}) : {};
        
        activeDraft = null;
        activeItem = {
            id: item.id,
            name: item.name,
            description: page ? page.text.content : "",
            itemType: flags.itemType || "Doc",
            tags: flags.tags || "",
            img: flags.img || "icons/svg/mystery-man.svg"
        };
    }

    function pickImg() {
        if (activeDraft && !activeDraft.isFolder) {
            new FilePicker({ type: "image", callback: (p) => activeDraft.img = p }).render(true);
        }
    }

    // --- UTIL ---
    function getFlags(item) {
        const page = item.pages.size > 0 ? item.pages.contents[0] : null;
        return page ? (page.flags["multiversus-rpg"] || {}) : {};
    }
</script>

<div class="codex-shell">
    <div class="codex-content">
        <!-- HEADER / BREADCRUMBS -->
        <div class="codex-header">
            <div class="breadcrumbs">
                <button on:click={navigateToRoot}><i class="fas fa-hdd"></i> ROOT</button>
                {#each navigationPath as path}
                    <span class="sep">/</span>
                    <button on:click={() => navigateTo(path.id, path.name)}>{path.name}</button>
                {/each}
                {#if activeItem}
                    <span class="sep">/</span>
                    <span style="color: #fff; font-weight: bold;">{activeItem.name}</span>
                {/if}
            </div>

            <div class="actions">
                {#if activeItem}
                    <button on:click={closePanels}><i class="fas fa-arrow-left"></i> VOLTAR</button>
                    {#if game.user.isGM || game.journal.get(activeItem.id)?.isOwner}
                        <button on:click={() => editItem(game.journal.get(activeItem.id))}><i class="fas fa-edit"></i> EDITAR</button>
                    {/if}
                    {#if game.user.isGM}
                        <button on:click={deleteViewedItem} style="color:#ff3333; border-color:#ff3333;"><i class="fas fa-trash"></i></button>
                    {/if}
                {:else if activeDraft}
                    <button on:click={() => activeDraft = null}><i class="fas fa-times"></i> CANCELAR</button>
                    <button on:click={saveDraft} style="color: var(--c-primary); border-color: var(--c-primary);"><i class="fas fa-save"></i> SALVAR</button>
                {:else}
                    <button on:click={createFolder}><i class="fas fa-folder-plus"></i> NOVA PASTA</button>
                    <button on:click={createFile}><i class="fas fa-file-plus"></i> NOVO ARQUIVO</button>
                {/if}
            </div>
        </div>

        <div class="codex-body custom-scroll">
            <!-- VISUALIZAÇÃO DE ITEM -->
            {#if activeItem}
                <div class="reader-panel" in:fade={{duration: 200}}>
                    <div class="reader-header" style={activeItem.itemType !== 'Doc' ? `background-image: url('${activeItem.img}')` : ''}>
                        <div class="reader-overlay">
                            <h1>{activeItem.name}</h1>
                            <div class="reader-meta">
                                <span class="badge main">{activeItem.itemType}</span>
                                {#if activeItem.tags}
                                    {#each activeItem.tags.split(',') as tag}
                                        {#if tag.trim()} <span class="badge tag">{tag.trim()}</span> {/if}
                                    {/each}
                                {/if}
                            </div>
                        </div>
                    </div>
                    <div class="reader-content">
                        <p>{@html activeItem.description.replace(/\n/g, '<br>')}</p>
                    </div>
                </div>

            <!-- MODO DE EDIÇÃO / CRIAÇÃO -->
            {:else if activeDraft}
                <div class="draft-panel" in:slide={{duration: 200}}>
                    <div class="draft-header">
                        <span>{activeDraft.id ? 'EDITANDO' : 'CRIANDO'} {activeDraft.isFolder ? 'PASTA' : 'ARQUIVO'}</span>
                        {#if activeDraft.id && game.user.isGM}
                            <button on:click={deleteDraft} title="Excluir"><i class="fas fa-trash" style="color:#ff3333;"></i></button>
                        {/if}
                    </div>

                    <div class="form-row">
                        <div class="field grow">
                            <label>NOME</label>
                            <input type="text" bind:value={activeDraft.name} placeholder="Ex: Relatório Beta" />
                        </div>
                    </div>

                    {#if !activeDraft.isFolder}
                        <div class="form-row">
                            <div class="field">
                                <label>TIPO</label>
                                <select bind:value={activeDraft.itemType} style="background: #000; border: 1px solid #333; color: #fff; padding: 9px;">
                                    {#each ITEM_TYPES as t} <option>{t}</option> {/each}
                                </select>
                            </div>
                            <div class="field grow">
                                <label>TAGS (Separadas por vírgula)</label>
                                <input type="text" bind:value={activeDraft.tags} placeholder="Ex: Secreto, Missão" />
                            </div>
                            {#if activeDraft.itemType !== 'Doc'}
                                <div class="field">
                                    <label>IMAGEM</label>
                                    <button class="img-btn" on:click={pickImg} style="background-image: url('{activeDraft.img}')">
                                        <i class="fas fa-image"></i>
                                    </button>
                                </div>
                            {/if}
                        </div>

                        <div class="field">
                            <label>CONTEÚDO</label>
                            <textarea bind:value={activeDraft.description} placeholder="Escreva os detalhes aqui... HTML é suportado."></textarea>
                        </div>
                    {/if}

                    <div class="field">
                        <label style="display: flex; justify-content: space-between; align-items: center;">
                            PERMISSÕES DE VISUALIZAÇÃO (Quem pode ver?)
                            <input type="text" placeholder="Buscar usuário..." bind:value={userSearchQuery} style="width: 200px; padding: 4px; font-size: 11px; margin-bottom: 5px;" />
                        </label>
                        <div class="permissions-list">
                            {#each game.users.filter(u => !u.isGM && u.name.toLowerCase().includes(userSearchQuery.toLowerCase())) as user}
                                <label class="perm-check">
                                    <input type="checkbox" value={user.id} bind:group={activeDraft.permissions} /> 
                                    <span class="user-color" style="background: {user.color};"></span> {user.name}
                                </label>
                            {/each}
                            {#if game.users.filter(u => !u.isGM).length === 0}
                                <span style="font-size: 10px; color:#555;">Nenhum jogador na mesa.</span>
                            {/if}
                        </div>
                    </div>

                    <button class="btn-save" on:click={saveDraft} style="margin-top: 15px;">
                        <i class="fas fa-check"></i> CONCLUIR
                    </button>
                </div>

            <!-- GRID PRINCIPAL -->
            {:else}
                {#if currentFolders.length === 0 && currentItems.length === 0}
                    <div class="empty-codex">
                        <i class="fas fa-folder-open"></i>
                        <p>ESTA PASTA ESTÁ VAZIA</p>
                    </div>
                {:else}
                    <div class="item-grid">
                        <!-- PASTAS -->
                        {#each currentFolders as folder}
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <!-- svelte-ignore a11y-no-static-element-interactions -->
                            <div class="visual-card folder" on:click={() => navigateTo(folder.id, folder.name)}>
                                <div class="card-overlay">
                                    <h4><i class="fas fa-folder"></i> {folder.name}</h4>
                                    <small>{allFolders.filter(f => f.folder?.id === folder.id).length} Pastas | {allItems.filter(j => j.folder?.id === folder.id).length} Arquivos</small>
                                </div>
                                {#if game.user.isGM}
                                    <div class="action-bar">
                                        <button class="edit" on:click|stopPropagation={() => editFolder(folder)}><i class="fas fa-edit"></i></button>
                                    </div>
                                {/if}
                            </div>
                        {/each}

                        <!-- ITENS -->
                        {#each currentItems as item}
                            {@const flags = getFlags(item)}
                            
                            {#if flags.itemType === 'Doc'}
                                <!-- svelte-ignore a11y-click-events-have-key-events -->
                                <!-- svelte-ignore a11y-no-static-element-interactions -->
                                <div class="doc-card" on:click={() => openItem(item)}>
                                    <div class="doc-header">
                                        <i class="fas fa-file-alt doc-icon"></i>
                                        <div class="doc-title">
                                            <h4>{item.name}</h4>
                                            {#if flags.tags}
                                                <small style="color:#666; font-size:10px;">{flags.tags.split(',')[0]}</small>
                                            {/if}
                                        </div>
                                    </div>
                                    {#if game.user.isGM || item.isOwner}
                                        <div class="action-bar">
                                            <button class="edit" on:click|stopPropagation={() => editItem(item)}><i class="fas fa-edit"></i></button>
                                        </div>
                                    {/if}
                                </div>
                            {:else}
                                <!-- svelte-ignore a11y-click-events-have-key-events -->
                                <!-- svelte-ignore a11y-no-static-element-interactions -->
                                <div class="visual-card {flags.itemType === 'Item' ? 'item-type' : 'npc'}" style="background-image: url('{flags.img || 'icons/svg/mystery-man.svg'}')" on:click={() => openItem(item)}>
                                    <div class="card-overlay">
                                        <h4>{item.name}</h4>
                                        <small>{flags.itemType || 'Desconhecido'}</small>
                                    </div>
                                    {#if game.user.isGM || item.isOwner}
                                        <div class="action-bar">
                                            <button class="edit" on:click|stopPropagation={() => editItem(item)}><i class="fas fa-edit"></i></button>
                                        </div>
                                    {/if}
                                </div>
                            {/if}
                        {/each}
                    </div>
                {/if}
            {/if}
        </div>
    </div>
</div>

<style>
    :root {
        --c-primary: #00ff41;
    }

    .codex-shell { display: flex; height: 100%; background: #050505; color: #ccc; font-family: 'Segoe UI', sans-serif; overflow: hidden; }
    
    .codex-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative;}
    .codex-header { display: flex; justify-content: space-between; padding: 15px; background: #080808; border-bottom: 1px solid #222;}
    .breadcrumbs { display: flex; align-items: center; gap: 5px; font-size: 12px; }
    .breadcrumbs button { background: transparent; border: none; color: var(--c-primary); cursor: pointer; font-family: inherit; font-weight: bold;}
    .breadcrumbs button:hover { text-shadow: 0 0 8px var(--c-primary); }
    .breadcrumbs .sep { color: #555; }
    
    .actions { display: flex; gap: 5px; }
    .actions button { background: #111; border: 1px solid #333; color: #aaa; padding: 6px 12px; cursor: pointer; border-radius: 4px; font-family: inherit; font-size: 11px; transition: 0.2s;}
    .actions button:hover { border-color: var(--c-primary); color: #fff; }

    .codex-body { flex: 1; padding: 20px; overflow-y: auto; }

    /* FORMULÁRIO DRAFT */
    .draft-panel { background: #0a0a0a; border: 1px solid var(--c-primary); border-radius: 6px; padding: 20px; margin-bottom: 20px; box-shadow: inset 0 0 20px color-mix(in srgb, var(--c-primary) 5%, transparent); }
    .draft-header { display: flex; justify-content: space-between; margin-bottom: 15px; color: var(--c-primary); font-weight: bold; border-bottom: 1px dashed #333; padding-bottom: 10px;}
    .draft-header button { background: transparent; border: none; color: #fff; font-size: 18px; cursor: pointer; }
    .form-row { display: flex; gap: 15px; margin-bottom: 15px; flex-wrap: wrap; }
    .field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 15px;}
    .field.grow { flex: 1; margin-bottom: 0; min-width: 200px;}
    .field label { font-size: 10px; color: #888; font-weight: bold;}
    .field input, .field textarea { background: #000; border: 1px solid #333; color: #fff; padding: 10px; font-family: inherit; border-radius: 4px; outline: none;}
    .field input:focus, .field textarea:focus { border-color: var(--c-primary); }
    .field textarea { min-height: 200px; resize: vertical; }
    
    .img-btn { width: 40px; height: 40px; border: 1px solid #333; border-radius: 4px; background-size: cover; background-position: center; cursor: pointer; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.5); font-size: 18px; transition: 0.2s;}
    .img-btn:hover { border-color: var(--c-primary); color: #fff;}

    .permissions-list { display: flex; flex-wrap: wrap; gap: 10px; background: #000; border: 1px solid #333; padding: 10px; border-radius: 4px; }
    .perm-check { display: flex; align-items: center; gap: 5px; font-size: 12px; cursor: pointer; color: #aaa; background: #111; padding: 4px 8px; border-radius: 4px; border: 1px solid #222; transition: 0.2s;}
    .perm-check:hover { color: #fff; border-color: #555; }
    .perm-check input { display: none; }
    .perm-check input:checked + .user-color { box-shadow: 0 0 5px var(--c-primary); border: 2px solid var(--c-primary); }
    .perm-check:has(input:checked) { color: var(--c-primary); border-color: var(--c-primary); background: rgba(0,255,65,0.1); }
    .user-color { width: 10px; height: 10px; border-radius: 50%; display: inline-block; border: 2px solid transparent;}

    .btn-save { width: 100%; padding: 12px; background: color-mix(in srgb, var(--c-primary) 10%, transparent); border: 1px solid var(--c-primary); color: var(--c-primary); font-family: inherit; font-weight: bold; cursor: pointer; border-radius: 4px; transition: 0.2s;}
    .btn-save:hover { background: var(--c-primary); color: #000; }

    .empty-codex { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #444; opacity: 0.5; font-size: 24px;}
    .empty-codex p { font-size: 12px; margin-top: 10px; letter-spacing: 2px;}

    .item-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px; align-items: start; }
    
    .visual-card { height: 180px; border-radius: 6px; cursor: pointer; position: relative; overflow: hidden; background-size: contain; background-repeat: no-repeat; background-position: center; background-color: #0a0a0a; border: 1px solid #333; transition: 0.3s; }
    .visual-card:hover { transform: translateY(-4px); box-shadow: 0 5px 15px rgba(0,0,0,0.8); border-color: #555; }
    
    .visual-card.folder { border-color: #aa8800; background: #111; }
    .visual-card.folder:hover { border-color: #ffcc00; box-shadow: 0 5px 15px rgba(255,204,0,0.3); }
    .visual-card.npc:hover { border-color: #00d4ff; box-shadow: 0 5px 15px rgba(0,212,255,0.3); }
    .visual-card.item-type:hover { border-color: #ff4400; box-shadow: 0 5px 15px rgba(255,68,0,0.3); }

    .card-overlay { position: absolute; inset: 0; background: linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%); display: flex; flex-direction: column; justify-content: flex-end; padding: 15px; }
    .card-overlay h4 { margin: 0 0 5px 0; font-size: 16px; color: #fff; text-shadow: 0 2px 4px #000; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;}
    .visual-card.folder h4 { color: #ffcc00; }
    .card-overlay small { font-size: 10px; color: #aaa; }

    .doc-card { background: #111; border: 1px solid #333; border-left: 4px solid color-mix(in srgb, var(--c-primary) 60%, white); border-radius: 4px; cursor: pointer; transition: 0.2s;}
    .doc-card:hover { border-color: color-mix(in srgb, var(--c-primary) 60%, white); transform: translateY(-2px); box-shadow: 0 5px 10px color-mix(in srgb, var(--c-primary) 20%, transparent);}
    .doc-header { display: flex; align-items: center; padding: 15px; }
    .doc-icon { font-size: 20px; color: color-mix(in srgb, var(--c-primary) 60%, white); margin-right: 15px;}
    .doc-title { flex: 1; }
    .doc-title h4 { margin: 0; font-size: 14px; color: #fff; }

    .action-bar { position: absolute; top: 10px; right: 10px; display: flex; gap: 5px; opacity: 0; transition: 0.2s; }
    .visual-card:hover .action-bar, .doc-card:hover .action-bar { opacity: 1; }
    .action-bar button { background: rgba(0,0,0,0.8); border: 1px solid #555; color: #fff; width: 30px; height: 30px; border-radius: 4px; cursor: pointer; transition: 0.2s;}
    .action-bar button:hover { border-color: var(--c-primary); color: var(--c-primary); }

    /* READER PANEL */
    .reader-panel { background: #111; border: 1px solid #333; border-radius: 6px; display: flex; flex-direction: column; overflow: hidden; min-height: 400px;}
    .reader-header { height: 200px; background-size: cover; background-position: center; position: relative; border-bottom: 2px solid var(--c-primary); }
    .reader-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.9), transparent); display: flex; flex-direction: column; justify-content: flex-end; padding: 20px; }
    .reader-overlay h1 { margin: 0; font-size: 32px; color: #fff; text-shadow: 0 2px 4px #000;}
    .reader-meta { display: flex; gap: 5px; margin-top: 10px; }
    .badge { padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
    .badge.main { background: var(--c-primary); color: #000; }
    .badge.tag { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); }
    
    .reader-content { padding: 30px; font-size: 15px; line-height: 1.6; color: #ddd; background: #0a0a0a;}

    .custom-scroll::-webkit-scrollbar { width: 6px; }
    .custom-scroll::-webkit-scrollbar-track { background: transparent; }
    .custom-scroll::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--c-primary) 20%, transparent); border-radius: 3px; }
</style>