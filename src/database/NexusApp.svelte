<script>
    import { onMount } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import { NexusDatabase } from './NexusDatabase.js';

    // --- ESTADO ---
    let entries = [];
    let searchQuery = "";
    
    // Filtros
    let selectedType = "TODOS";
    let selectedTag = "TODOS";
    
    let activeEntry = null; 
    let isEditing = false;

    // --- CATEGORIAS ---
    const TYPES = [
        "Jogador", "NPC", "Local", "Facção", 
        "História Macro", "História Micro", "Quest", 
        "Sistema", "Instruções", "Anotações",
        "Script" 
    ];

    const emptyEntry = { 
        id: null, 
        name: "Nova Entrada", 
        type: "Script", 
        tags: "", 
        img: "icons/svg/mystery-man.svg", 
        description: "" 
    };

    onMount(() => {
        try { NexusDatabase.init(); } catch(e) {}
        loadData();
        Hooks.on("nexusUpdate", loadData);
    });

    function loadData() {
        try {
            entries = NexusDatabase.getAll();
            if (activeEntry) {
                const fresh = entries.find(e => e.id === activeEntry.id);
                if (fresh && !isEditing) activeEntry = fresh;
            }
        } catch (err) {
            console.error("Erro ao carregar Nexus:", err);
            entries = [];
        }
    }

    // --- LÓGICA DE FILTROS ---
    $: allTags = ["TODOS", ...new Set(entries.flatMap(e => 
        e.tags.split(',').map(t => t.trim()).filter(t => t !== "")
    ))].sort();

    $: filtered = entries.filter(e => {
        const searchLower = searchQuery.toLowerCase();
        const matchSearch = e.name.toLowerCase().includes(searchLower) || 
                            e.description.toLowerCase().includes(searchLower);
        const matchType = selectedType === "TODOS" || e.type === selectedType;
        const matchTag = selectedTag === "TODOS" || e.tags.includes(selectedTag);
        return matchSearch && matchType && matchTag;
    });

    // --- AÇÕES ---
    function createNew() {
        activeEntry = { ...emptyEntry, id: foundry.utils.randomID() };
        isEditing = true;
        selectedType = "TODOS";
        searchQuery = "";
    }

    async function save() {
        await NexusDatabase.saveEntry(activeEntry);
        isEditing = false;
        ui.notifications.info(`Nexus: "${activeEntry.name}" salvo.`);
        loadData();
    }

    async function del() {
        new Dialog({
            title: "Excluir?",
            content: `Apagar <b>${activeEntry.name}</b> permanentemente?`,
            buttons: {
                yes: { label: "Apagar", icon: "<i class='fas fa-trash'></i>", callback: async () => {
                    await NexusDatabase.deleteEntry(activeEntry.id);
                    activeEntry = null;
                    isEditing = false;
                    loadData();
                }},
                no: { label: "Cancelar" }
            },
            default: "no"
        }).render(true);
    }

    function pickImg() {
        new FilePicker({ type: "image", callback: (p) => activeEntry.img = p }).render(true);
    }

    function isSystemType(type) {
        return ["Sistema", "Instruções", "Anotações", "Script"].includes(type);
    }

    // ======================================================
    //              SISTEMA DE BACKUP (CORRIGIDO)
    // ======================================================
    
    // 1. EXPORTAR (USANDO FUNÇÃO NATIVA DO FOUNDRY)
    function exportDB() {
        try {
            const data = NexusDatabase.getAll();
            const jsonStr = JSON.stringify(data, null, 2);
            
            // CORREÇÃO: Usa a função global do Foundry para forçar download do arquivo
            saveDataToFile(jsonStr, "json", "nexus_backup.json");
            
        } catch(e) {
            ui.notifications.error("Erro ao exportar: " + e.message);
        }
    }

    // 2. IMPORTAR (CARREGAR ARQUIVO)
    function importDB() {
        new Dialog({
            title: "Importar Backup do Nexus",
            content: `
                <div style="margin-bottom:10px;">
                    <p>Abra o arquivo <b>.json</b> que você baixou, copie todo o texto e cole abaixo:</p>
                </div>
                <textarea id="nexus-import-textarea" 
                    style="width:100%; height:300px; font-family:monospace; font-size:11px; background:#222; color:#0f0; border:1px solid #444; padding:10px;"
                    placeholder='Cole o código JSON aqui... Ex: [{"id": "...", "name": "..."}]'></textarea>
            `,
            buttons: {
                import: {
                    label: "SUBSTITUIR DADOS ATUAIS",
                    icon: "<i class='fas fa-file-import'></i>",
                    callback: async (html) => {
                        const jsonString = html.find("#nexus-import-textarea").val();
                        
                        if (!jsonString || jsonString.trim() === "") {
                            return ui.notifications.warn("A caixa de texto está vazia!");
                        }

                        try {
                            const data = JSON.parse(jsonString);
                            if (!Array.isArray(data)) throw new Error("Formato inválido.");

                            // Salva direto na config do mundo
                            await game.settings.set("multiversus-rpg", "nexus_lore_data", data);
                            
                            ui.notifications.info(`Sucesso! ${data.length} registros importados.`);
                            loadData(); 
                            
                        } catch (e) {
                            ui.notifications.error("Erro Crítico: JSON Inválido. " + e.message);
                        }
                    }
                },
                cancel: { label: "Cancelar" }
            },
            default: "cancel"
        }, { width: 500 }).render(true);
    }
</script>

<div class="nexus-shell">
    
    <aside class="sidebar">
        <div class="backup-tools">
            <button on:click={exportDB} class="backup-btn" title="Baixar Backup (Exportar)">
                <i class="fas fa-download"></i> EXPORTAR
            </button>
            <button on:click={importDB} class="backup-btn import" title="Carregar Backup (Importar)">
                <i class="fas fa-upload"></i> IMPORTAR
            </button>
        </div>

        <div class="header-tools">
            <div class="search-row">
                <i class="fas fa-search"></i>
                <input bind:value={searchQuery} placeholder="Pesquisar..." />
            </div>
            
            <div class="filter-row">
                <select bind:value={selectedType}>
                    <option value="TODOS">Todos os Tipos</option>
                    {#each TYPES as t} <option value={t}>{t}</option> {/each}
                </select>
            </div>

            <div class="filter-row">
                <select bind:value={selectedTag}>
                    {#each allTags as tag} <option value={tag}>Tag: {tag}</option> {/each}
                </select>
            </div>
        </div>

        <div class="list-area">
            <button class="add-btn" on:click={createNew}>
                <i class="fas fa-plus"></i> CRIAR NOVO
            </button>

            {#each filtered as e}
                <div class="item" 
                     class:active={activeEntry?.id === e.id} 
                     class:system-item={isSystemType(e.type)}
                     class:script-item={e.type === 'Script'}
                     on:click={() => {activeEntry = JSON.parse(JSON.stringify(e)); isEditing=false;}}>
                    
                    <div class="item-img">
                        {#if e.type === 'Script'}
                            <div class="code-icon"><i class="fas fa-code"></i></div>
                        {:else}
                            <img src={e.img} alt="icon"/>
                        {/if}
                    </div>
                    
                    <div class="item-info">
                        <span class="item-name">{e.name}</span>
                        <div class="item-meta">
                            <span class="type-pill">{e.type}</span>
                            {#if e.tags} <span class="tag-pill">{e.tags.split(',')[0]}</span> {/if}
                        </div>
                    </div>
                </div>
            {/each}
            
            {#if filtered.length === 0}
                <div class="no-results">Nada encontrado.</div>
            {/if}
        </div>
    </aside>

    <main class="content">
        {#if activeEntry}
            <div class="card" in:fade={{duration: 150}}>
                
                <div class="header" class:system-header={isSystemType(activeEntry.type)} style="background-image: url('{activeEntry.img}')">
                    <div class="header-overlay">
                        {#if isEditing}
                            <div class="edit-mode-header">
                                <input class="title-input" bind:value={activeEntry.name} placeholder="Nome (Comando)" />
                                <div class="meta-inputs">
                                    <select bind:value={activeEntry.type}>
                                        {#each TYPES as t} <option>{t}</option> {/each}
                                    </select>
                                    <input class="tags-input" bind:value={activeEntry.tags} placeholder="Tags" />
                                </div>
                            </div>
                            <button class="img-btn" on:click={pickImg} title="Alterar Imagem"><i class="fas fa-image"></i></button>
                        {:else}
                            <div class="view-mode-header">
                                <h1>{activeEntry.name}</h1>
                                <div class="badges">
                                    <span class="badge main">{activeEntry.type}</span>
                                    {#each activeEntry.tags.split(',') as tag}
                                        {#if tag.trim()} <span class="badge tag">{tag.trim()}</span> {/if}
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>

                <div class="body">
                    {#if isEditing}
                        <textarea 
                            class:code-editor={activeEntry.type === 'Script'}
                            bind:value={activeEntry.description} 
                            placeholder={
                                activeEntry.type === 'Script' ? 
                                "// JAVASCRIPT AQUI.\n// Disponíveis: actor, game, args, render(html), addMessage(), socket." :
                                isSystemType(activeEntry.type) ? "Escreva as regras do sistema..." : 
                                "Escreva a história ou descrição do NPC..."
                            }
                        ></textarea>
                    {:else}
                        <div class="reader">
                            {#if activeEntry.type === 'Script'}
                                <div class="system-alert script-alert">
                                    <i class="fas fa-terminal"></i> SCRIPT ATIVO
                                </div>
                                <pre class="code-block">{activeEntry.description}</pre>
                            {:else if isSystemType(activeEntry.type)}
                                <div class="system-alert"><i class="fas fa-book"></i> DADOS DE SISTEMA</div>
                                <p>{@html activeEntry.description.replace(/\n/g, '<br>')}</p>
                            {:else}
                                <p>{@html activeEntry.description.replace(/\n/g, '<br>')}</p>
                            {/if}
                        </div>
                    {/if}
                </div>

                <div class="footer">
                    {#if isEditing}
                        <button class="btn cancel" on:click={() => { isEditing = false; loadData(); }}>CANCELAR</button>
                        <button class="btn delete" on:click={del}>EXCLUIR</button>
                        <button class="btn save" on:click={save}>SALVAR</button>
                    {:else}
                        <div class="footer-info">ID: {activeEntry.id}</div>
                        <button class="btn edit" on:click={() => isEditing = true}><i class="fas fa-edit"></i> EDITAR</button>
                    {/if}
                </div>

            </div>
        {:else}
            <div class="empty-state">
                <i class="fas fa-database big-icon"></i>
                <h1>NEXUS ADMIN</h1>
                <p>Selecione um arquivo ou crie um novo.</p>
                <div class="tips">
                    <small>Crie um tipo <b>"Script"</b> para adicionar comandos ao Oracle.</small>
                </div>
            </div>
        {/if}
    </main>
</div>

<style>
    :root {
        --c-bg: #0e0e0e;
        --c-sidebar: #050505;
        --c-border: #333;
        --c-accent: #00ff41; 
        --c-system: #ff9900; 
        --c-script: #0088ff; 
        --c-text: #ccc;
    }

    .nexus-shell { display: flex; height: 100%; background: var(--c-bg); color: var(--c-text); font-family: 'Segoe UI', sans-serif; overflow: hidden; }
    
    /* SIDEBAR */
    .sidebar { width: 280px; background: var(--c-sidebar); border-right: 1px solid var(--c-border); display: flex; flex-direction: column; }
    
    /* --- CSS BACKUP --- */
    .backup-tools { display: flex; gap: 5px; padding: 10px; background: #111; border-bottom: 1px solid #222; align-items: center; }
    .backup-btn { 
        flex: 1; 
        background: #222; 
        border: 1px solid #444; 
        color: #888; 
        cursor: pointer; 
        padding: 6px; 
        border-radius: 4px; 
        transition: 0.2s; 
        font-size: 10px; 
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
    }
    .backup-btn:hover { background: #333; color: #fff; border-color: #666; }
    .backup-btn.import:hover { background: #003300; color: #0f0; border-color: #0f0; }

    .header-tools { padding: 10px; border-bottom: 1px solid var(--c-border); display: flex; flex-direction: column; gap: 8px; }
    .search-row { display: flex; align-items: center; background: #1a1a1a; padding: 0 8px; border-radius: 4px; border: 1px solid #222; }
    .search-row input { background: transparent; border: none; color: #fff; width: 100%; padding: 6px; outline: none; }
    .filter-row select { width: 100%; background: #1a1a1a; color: #aaa; border: 1px solid #333; padding: 4px; border-radius: 4px; }
    .list-area { flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 4px; }
    
    .add-btn { background: var(--c-accent); color: #000; border: none; font-weight: bold; padding: 8px; cursor: pointer; border-radius: 4px; margin-bottom: 10px; width: 100%; }
    .add-btn:hover { filter: brightness(1.2); }

    .item { display: flex; gap: 10px; padding: 8px; cursor: pointer; border-radius: 4px; border: 1px solid transparent; transition: 0.2s; }
    .item:hover { background: #151515; border-color: #333; }
    .item.active { background: #1a1a1a; border-left: 3px solid var(--c-accent); }
    
    .item.system-item.active { border-left-color: var(--c-system); } 
    .item.script-item.active { border-left-color: var(--c-script); }
    .item.script-item .type-pill { color: var(--c-script); }

    .item-img { width: 36px; height: 36px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: #000; border-radius: 4px; }
    .item-img img { width: 100%; height: 100%; object-fit: cover; border-radius: 4px; }
    .code-icon { color: var(--c-script); font-size: 18px; }
    
    .item-info { display: flex; flex-direction: column; justify-content: center; overflow: hidden; flex: 1; }
    .item-name { font-weight: bold; font-size: 13px; color: #eee; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .item-meta { display: flex; gap: 5px; margin-top: 2px; }
    .type-pill { font-size: 9px; background: #222; padding: 1px 4px; border-radius: 3px; color: #888; text-transform: uppercase; }
    .tag-pill { font-size: 9px; color: #666; }

    .no-results { text-align: center; opacity: 0.5; padding: 20px; font-size: 12px; }

    /* CONTENT */
    .content { flex: 1; padding: 15px; background: #111; overflow: hidden; display: flex; flex-direction: column; }
    .card { background: #151515; border: 1px solid var(--c-border); height: 100%; display: flex; flex-direction: column; box-shadow: 0 0 20px rgba(0,0,0,0.5); border-radius: 4px; overflow: hidden; }

    .header { height: 140px; background-size: cover; background-position: center; position: relative; border-bottom: 2px solid var(--c-accent); }
    .header.system-header { border-bottom-color: var(--c-system); }

    .header-overlay { background: linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.4)); width: 100%; height: 100%; padding: 20px; display: flex; flex-direction: column; justify-content: flex-end; }

    .view-mode-header h1 { margin: 0; font-size: 28px; color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.8); }
    .badges { display: flex; gap: 5px; margin-top: 5px; }
    .badge { padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
    .badge.main { background: var(--c-accent); color: #000; }
    .system-header .badge.main { background: var(--c-system); }
    .badge.tag { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); }

    .edit-mode-header { width: 100%; display: flex; flex-direction: column; gap: 10px; }
    .title-input { font-size: 24px; font-weight: bold; background: rgba(0,0,0,0.5); border: none; border-bottom: 1px solid #fff; color: #fff; width: 100%; }
    .meta-inputs { display: flex; gap: 10px; }
    .meta-inputs select, .meta-inputs input { background: rgba(0,0,0,0.6); border: 1px solid #555; color: #fff; padding: 5px; font-size: 12px; }
    .tags-input { flex: 1; }

    .img-btn { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.5); border: 1px solid #fff; color: #fff; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; }

    .body { flex: 1; padding: 20px; overflow-y: auto; background: #151515; }
    .reader { font-size: 14px; line-height: 1.6; color: #ddd; }
    
    .system-alert { background: rgba(255, 153, 0, 0.1); border: 1px solid var(--c-system); color: var(--c-system); padding: 10px; margin-bottom: 15px; border-radius: 4px; font-weight: bold; font-size: 12px; }
    .script-alert { background: rgba(0, 136, 255, 0.1); border-color: var(--c-script); color: var(--c-script); }

    .code-block { background: #000; padding: 10px; border: 1px solid #333; color: #00ff41; font-family: 'Consolas', monospace; white-space: pre-wrap; font-size: 12px; border-radius: 4px; }

    textarea { width: 100%; height: 100%; background: transparent; border: none; color: #ccc; resize: none; font-family: inherit; font-size: 14px; line-height: 1.5; outline: none; }
    textarea.code-editor { font-family: 'Consolas', monospace; color: #aaffaa; background: #080808; padding: 10px; border: 1px solid #333; }

    .footer { padding: 12px; background: #111; border-top: 1px solid var(--c-border); display: flex; justify-content: flex-end; align-items: center; gap: 10px; }
    .footer-info { margin-right: auto; font-size: 10px; color: #555; font-family: monospace; }
    
    .btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 11px; }
    .save { background: var(--c-accent); color: #000; }
    .edit { background: #333; color: #fff; border: 1px solid #555; }
    .cancel { background: transparent; color: #888; }
    .delete { background: #500; color: #fff; }

    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; opacity: 0.5; color: #fff; }
    .big-icon { font-size: 64px; margin-bottom: 20px; color: var(--c-accent); }
    .tips { margin-top: 30px; display: flex; flex-direction: column; gap: 5px; font-size: 11px; color: #666; text-align: center; }
</style>