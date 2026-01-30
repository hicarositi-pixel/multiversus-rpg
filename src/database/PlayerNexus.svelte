<script>
    import { onMount } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import { PlayerDatabase } from './PlayerDatabase.js';

    // Recebe o estilo da Ficha Pai para combinar as cores
    export let themeStyle = ""; 

    let entries = [];
    let searchQuery = "";
    let selectedType = "TODOS";
    let selectedTag = "TODOS";
    let activeEntry = null; 
    let isEditing = false;

    const TYPES = ["Diário", "NPC", "Local", "Facção", "Anotação", "Teoria", "Inventário", "Quest"];

    const emptyEntry = { 
        id: null, name: "Novo Arquivo", type: "Anotação", tags: "", 
        img: "icons/svg/book.svg", description: "", author: "" 
    };

    onMount(() => {
        try { PlayerDatabase.ensureRegistered(); } catch(e) {}
        loadData();
        Hooks.on("nexusUpdate", loadData);
    });

    function loadData() {
        entries = PlayerDatabase.getAll();
        if (activeEntry) {
            const fresh = entries.find(e => e.id === activeEntry.id);
            if (fresh && !isEditing) activeEntry = fresh;
        }
    }

    // --- FILTROS INTELIGENTES ---
    $: allTags = ["TODOS", ...new Set(entries.flatMap(e => e.tags ? e.tags.split(',').map(t => t.trim()) : []))].sort();

    $: filtered = entries.filter(e => {
        const s = searchQuery.toLowerCase();
        const matchText = e.name.toLowerCase().includes(s) || e.description.toLowerCase().includes(s);
        const matchType = selectedType === "TODOS" || e.type === selectedType;
        const matchTag = selectedTag === "TODOS" || (e.tags && e.tags.includes(selectedTag));
        return matchText && matchType && matchTag;
    });

    function createNew() {
        activeEntry = { ...emptyEntry, id: foundry.utils.randomID(), author: game.user.name };
        isEditing = true;
    }

    async function save() {
        activeEntry.lastEditor = game.user.name;
        if(!activeEntry.img) activeEntry.img = "icons/svg/book.svg";
        await PlayerDatabase.saveEntry(activeEntry);
        isEditing = false;
    }

    async function del() {
        new Dialog({
            title: "Excluir?",
            content: "Tem certeza que deseja apagar este registro?",
            buttons: {
                yes: { label: "Sim", callback: async () => {
                    await PlayerDatabase.deleteEntry(activeEntry.id);
                    activeEntry = null; isEditing = false;
                }},
                no: { label: "Não" }
            },
            default: "no"
        }).render(true);
    }

    // --- NOVA FUNÇÃO DE IMAGEM (URL DA INTERNET) ---
    function changeImage() {
        new Dialog({
            title: "Escolher Imagem",
            content: `
                <div style="margin-bottom: 10px;">
                    <label><b>Opção 1:</b> Cole um link da internet (Discord, Imgur...)</label>
                    <input type="text" id="img-url-input" value="${activeEntry.img}" style="width: 100%; box-sizing: border-box; margin-top:5px;">
                </div>
                <hr>
                <div style="font-size: 11px; color: #666; margin-bottom: 5px;">
                    <b>Opção 2:</b> Usar arquivo do servidor (Apenas se tiver acesso).
                </div>
            `,
            buttons: {
                link: {
                    label: "USAR LINK",
                    icon: "<i class='fas fa-link'></i>",
                    callback: (html) => {
                        const url = html.find("#img-url-input").val();
                        if(url) activeEntry.img = url;
                    }
                },
                server: {
                    label: "SERVIDOR",
                    icon: "<i class='fas fa-folder-open'></i>",
                    callback: () => {
                        new FilePicker({ 
                            type: "image", 
                            callback: (p) => activeEntry.img = p 
                        }).render(true);
                    }
                }
            },
            default: "link"
        }).render(true);
    }
</script>

<div class="archives-root" style="{themeStyle}">
    
    <aside class="sidebar">
        <div class="header">
            <i class="fas fa-book-dead"></i> THE ARCHIVES
        </div>
        
        <div class="tools">
            <div class="search-box">
                <i class="fas fa-search"></i>
                <input bind:value={searchQuery} placeholder="Pesquisar..." />
            </div>
            
            <div class="filters">
                <select bind:value={selectedType}>
                    <option value="TODOS">Todos os Tipos</option>
                    {#each TYPES as t}<option>{t}</option>{/each}
                </select>
                <select bind:value={selectedTag}>
                    <option value="TODOS">Todas as Tags</option>
                    {#each allTags as t}<option value={t}>{t}</option>{/each}
                </select>
            </div>
        </div>

        <div class="list">
            <button class="create-btn" on:click={createNew}>
                <i class="fas fa-plus"></i> NOVA ENTRADA
            </button>

            {#each filtered as e}
                <div class="item" class:active={activeEntry?.id === e.id} on:click={() => {activeEntry = JSON.parse(JSON.stringify(e)); isEditing=false;}}>
                    <img src={e.img} class="thumb">
                    <div class="info">
                        <div class="name">{e.name}</div>
                        <div class="meta">
                            <span class="type-pill">{e.type}</span>
                            {#if e.tags} <span class="tag-pill">{e.tags.split(',')[0]}</span> {/if}
                        </div>
                    </div>
                </div>
            {/each}
            
            {#if filtered.length === 0}
                <div class="no-data">Nenhum registro encontrado.</div>
            {/if}
        </div>
    </aside>

    <main class="workspace">
        {#if activeEntry}
            <div class="entry-card" in:fade={{duration: 200}}>
                
                <div class="entry-header" style="background-image: url('{activeEntry.img}')">
                    <div class="header-overlay">
                        {#if isEditing}
                            <div class="edit-header">
                                <input class="title-input" bind:value={activeEntry.name} placeholder="Título do Arquivo">
                                <div class="meta-inputs">
                                    <select bind:value={activeEntry.type}>{#each TYPES as t}<option>{t}</option>{/each}</select>
                                    <input bind:value={activeEntry.tags} placeholder="Tags (sep. por vírgula)">
                                </div>
                                <button class="img-btn" on:click={changeImage}><i class="fas fa-globe"></i> Imagem (Link/PC)</button>
                            </div>
                        {:else}
                            <div class="view-header">
                                <h1>{activeEntry.name}</h1>
                                <div class="badges">
                                    <span class="badge main">{activeEntry.type}</span>
                                    {#each (activeEntry.tags || "").split(',') as tag}
                                        {#if tag.trim()} <span class="badge tag">{tag.trim()}</span> {/if}
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>

                <div class="entry-body">
                    {#if isEditing}
                        <textarea class="editor-area" bind:value={activeEntry.description} placeholder="Escreva aqui... Suporta HTML básico."></textarea>
                    {:else}
                        <div class="content-reader">
                            {@html activeEntry.description.replace(/\n/g, '<br>')}
                        </div>
                        <div class="entry-footer">
                            <span><i class="fas fa-user-edit"></i> Autor: {activeEntry.author}</span>
                            <span><i class="fas fa-clock"></i> Última edição: {activeEntry.lastEditor || activeEntry.author}</span>
                        </div>
                    {/if}
                </div>

                <div class="actions-bar">
                    {#if isEditing}
                        <button class="btn cancel" on:click={() => {isEditing=false; loadData()}}>CANCELAR</button>
                        <button class="btn delete" on:click={del}>EXCLUIR</button>
                        <button class="btn save" on:click={save}><i class="fas fa-save"></i> SALVAR</button>
                    {:else}
                        <div class="status-id">ID: {activeEntry.id}</div>
                        <button class="btn edit" on:click={()=>isEditing=true}><i class="fas fa-edit"></i> EDITAR</button>
                    {/if}
                </div>

            </div>
        {:else}
            <div class="empty-state">
                <i class="fas fa-archive big-icon"></i>
                <h2>THE ARCHIVES</h2>
                <p>Selecione um arquivo ou crie uma nova entrada.</p>
                <small>Contribua para o conhecimento do grupo.</small>
            </div>
        {/if}
    </main>
</div>

<style>
    /* CSS DO TEMA */
    .archives-root {
        display: flex; height: 100%; width: 100%;
        background: var(--c-bg); 
        color: var(--c-text); 
        font-family: var(--font-body);
        overflow: hidden;
    }

    /* --- SIDEBAR --- */
    .sidebar { width: 260px; background: rgba(0,0,0,0.3); border-right: 1px solid var(--c-primary); display: flex; flex-direction: column; }
    
    .header { 
        padding: 15px; 
        background: rgba(var(--c-primary), 0.1); 
        color: var(--c-primary); 
        font-family: var(--font-head);
        font-weight: bold; font-size: 16px; 
        border-bottom: 1px solid var(--c-primary);
        display: flex; align-items: center; gap: 10px;
    }

    .tools { padding: 10px; display: flex; flex-direction: column; gap: 8px; border-bottom: 1px solid rgba(var(--c-primary), 0.2); }
    
    .search-box { 
        display: flex; align-items: center; gap: 5px; 
        background: rgba(0,0,0,0.5); border: 1px solid var(--border-color); 
        padding: 5px 8px; border-radius: 4px; 
    }
    .search-box input { background: transparent; border: none; color: var(--c-text); width: 100%; outline: none; }
    .search-box i { color: var(--c-primary); }

    .filters select { 
        width: 100%; margin-bottom: 5px; 
        background: rgba(0,0,0,0.5); color: var(--c-text); 
        border: 1px solid var(--border-color); padding: 4px;
        font-size: 11px;
    }

    .list { flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 5px; }

    .create-btn { 
        background: var(--c-primary); color: #000; border: none; 
        padding: 8px; font-weight: bold; cursor: pointer; border-radius: 4px; margin-bottom: 10px;
        transition: 0.2s;
    }
    .create-btn:hover { filter: brightness(1.2); }

    .item { 
        display: flex; gap: 10px; padding: 8px; cursor: pointer; 
        border: 1px solid transparent; border-radius: 4px; transition: 0.2s;
        background: rgba(255,255,255,0.02);
    }
    .item:hover { background: rgba(var(--c-primary), 0.1); border-color: var(--c-primary); }
    .item.active { background: rgba(var(--c-primary), 0.2); border-left: 3px solid var(--c-primary); }

    .thumb { width: 36px; height: 36px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color); }
    .info { display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
    .name { font-weight: bold; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .meta { display: flex; gap: 5px; margin-top: 2px; }
    .type-pill { font-size: 9px; background: rgba(0,0,0,0.5); padding: 1px 4px; border-radius: 2px; color: var(--c-primary); border: 1px solid var(--c-primary); }
    .tag-pill { font-size: 9px; color: #888; }

    .no-data { text-align: center; font-size: 11px; color: #666; margin-top: 20px; }

    /* --- MAIN WORKSPACE --- */
    .workspace { flex: 1; padding: 15px; display: flex; flex-direction: column; position: relative; overflow: hidden; }
    
    .entry-card { 
        background: rgba(0,0,0,0.2); border: 1px solid var(--c-primary); 
        height: 100%; display: flex; flex-direction: column; border-radius: 4px; overflow: hidden; 
        box-shadow: 0 0 20px rgba(0,0,0,0.3);
    }

    .entry-header { height: 140px; background-size: cover; background-position: center; position: relative; border-bottom: 1px solid var(--c-primary); }
    .header-overlay { background: linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.3)); height: 100%; padding: 20px; display: flex; flex-direction: column; justify-content: flex-end; }
    
    .view-header h1 { margin: 0; color: #fff; font-family: var(--font-head); font-size: 28px; text-shadow: 0 0 10px rgba(0,0,0,0.8); }
    .badges { display: flex; gap: 5px; margin-top: 5px; }
    .badge { padding: 3px 8px; font-size: 10px; font-weight: bold; border-radius: 3px; text-transform: uppercase; }
    .badge.main { background: var(--c-primary); color: #000; }
    .badge.tag { background: rgba(0,0,0,0.6); border: 1px solid #555; color: #ccc; }

    .edit-header { display: flex; flex-direction: column; gap: 10px; width: 100%; }
    .title-input { font-size: 20px; background: rgba(0,0,0,0.5); border: none; border-bottom: 1px solid var(--c-primary); color: #fff; padding: 5px; }
    .meta-inputs { display: flex; gap: 10px; }
    .meta-inputs select, .meta-inputs input { background: rgba(0,0,0,0.5); border: 1px solid #555; color: #fff; padding: 5px; flex: 1; }
    .img-btn { background: rgba(0,0,0,0.5); color: #fff; border: 1px solid #fff; cursor: pointer; padding: 5px; align-self: flex-start; border-radius: 4px; }

    .entry-body { flex: 1; padding: 20px; overflow-y: auto; background: rgba(0,0,0,0.1); }
    .content-reader { font-size: 14px; line-height: 1.6; color: var(--c-text); text-align: justify; }
    
    .editor-area { 
        width: 100%; height: 100%; background: transparent; border: none; color: var(--c-text); 
        resize: none; font-family: inherit; font-size: 14px; outline: none; line-height: 1.5; 
    }

    .entry-footer { margin-top: 30px; padding-top: 10px; border-top: 1px dashed var(--border-color); display: flex; justify-content: space-between; font-size: 10px; color: #666; }

    .actions-bar { padding: 12px; background: rgba(0,0,0,0.4); border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; align-items: center; gap: 10px; }
    .status-id { margin-right: auto; font-family: monospace; font-size: 10px; color: #555; }

    .btn { padding: 8px 16px; cursor: pointer; border-radius: 4px; font-weight: bold; border: none; font-size: 11px; transition: 0.2s; }
    .btn.save { background: var(--c-primary); color: #000; }
    .btn.edit { background: rgba(255,255,255,0.1); border: 1px solid #555; color: #fff; }
    .btn.cancel { background: transparent; color: #888; }
    .btn.delete { background: #500; color: #fff; }
    .btn:hover { transform: translateY(-1px); filter: brightness(1.1); }

    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; opacity: 0.3; color: var(--c-text); }
    .big-icon { font-size: 64px; margin-bottom: 15px; color: var(--c-primary); }
</style>