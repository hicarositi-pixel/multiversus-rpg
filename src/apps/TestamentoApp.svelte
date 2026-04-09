<script>
    import { onMount, tick } from 'svelte';
    import { fade, slide, scale } from 'svelte/transition';
    import { TestamentoDatabase } from '../database/TestamentoDatabase.js';
    import FichaMilitar from './FichaMilitar.svelte';
    import Anotation from './Anotation.svelte'; 

    export let actor;
    export let themeStyle = "";

    const MODULE_ID = "multiversus-rpg";

    // --- ESTADOS DO CODEX ---
    let codexData = { items: [], memorial: { pin: null, content: "" } };
    let currentFolderId = null; 
    let activeTab = 'codex'; 

    // --- ESTADOS DE UI ---
    let isCreating = false;
    let editMode = false;
    let draftItem = getDefaultDraft();
    let activeDossierItem = null; // Ficha Militar
    let activeAnotationItem = null; // Anotações e Docs
    let activeAnotationType = ''; // 'doc' ou 'memorial'

    // --- ESTADOS DO MEMORIAL ---
    let memorialUnlocked = false;
    let pinInput = "";
    let pinError = false;

    onMount(() => {
        codexData = foundry.utils.deepClone(TestamentoDatabase.getTestData(actor));
    });

    // --- NAVEGAÇÃO E FILTROS ---
    $: currentItems = codexData.items.filter(i => i.parentId === currentFolderId).sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (b.type === 'folder' && a.type !== 'folder') return 1;
        return a.name.localeCompare(b.name);
    });

    $: breadcrumbs = buildBreadcrumbs(currentFolderId);

    function buildBreadcrumbs(folderId) {
        let crumbs = [];
        let currentId = folderId;
        while (currentId) {
            const folder = codexData.items.find(i => i.id === currentId);
            if (folder) {
                crumbs.unshift(folder);
                currentId = folder.parentId;
            } else { break; }
        }
        return crumbs;
    }

    function navigateTo(folderId) {
        currentFolderId = folderId;
        isCreating = false;
    }

    // --- GESTÃO DE ARQUIVOS (CRUD) ---
    function getDefaultDraft() {
        return { 
            id: null, type: 'npc', parentId: currentFolderId, name: "", img: "", 
            desc: "", lastLoc: "", lastDate: "", bodyArt: "",
            interactions: [], reports: [], history: "", descPhysical: "", descPsycho: "", titles: "", codename: ""
        };
    }

    function openCreator(type) {
        draftItem = getDefaultDraft();
        draftItem.type = type;
        isCreating = true;
        editMode = false;
    }

    function openEditor(item) {
        draftItem = foundry.utils.deepClone(item);
        isCreating = true;
        editMode = true;
    }

    async function saveDraft() {
        if (!draftItem.name.trim()) return ui.notifications.warn("O arquivo precisa de um nome.");

        if (!editMode) {
            draftItem.id = foundry.utils.randomID();
            codexData.items.push(draftItem);
        } else {
            const idx = codexData.items.findIndex(i => i.id === draftItem.id);
            if (idx !== -1) codexData.items[idx] = draftItem;
        }

        codexData = codexData; 
        await TestamentoDatabase.saveTestData(actor, codexData);
        isCreating = false;
    }

    async function deleteItem(id) {
        const confirm = await Dialog.confirm({
            title: "APAGAR REGISTRO",
            content: "<p>Tem certeza? Isso apagará o arquivo e tudo dentro dele.</p>",
            yes: () => true, no: () => false, defaultYes: false
        });
        if (!confirm) return;

        const idsToDelete = [id];
        const findChildren = (parentId) => {
            const children = codexData.items.filter(i => i.parentId === parentId);
            children.forEach(c => { idsToDelete.push(c.id); findChildren(c.id); });
        };
        findChildren(id);

        codexData.items = codexData.items.filter(i => !idsToDelete.includes(i.id));
        await TestamentoDatabase.saveTestData(actor, codexData);
    }

    // --- INTEGRAÇÃO FICHA MILITAR (NPC) ---
    function openDossier(npc) {
        activeDossierItem = npc; 
    }

    async function handleDossierSave(event) {
        const updatedNpc = event.detail;
        const idx = codexData.items.findIndex(i => i.id === updatedNpc.id);
        if (idx !== -1) {
            codexData.items[idx] = updatedNpc;
            codexData = codexData;
            await TestamentoDatabase.saveTestData(actor, codexData);
            ui.notifications.info(`Dossiê de [${updatedNpc.name}] atualizado.`);
        }
        activeDossierItem = null; 
    }

    // --- INTEGRAÇÃO ANOTATION (DOC E MEMORIAL) ---
    function openAnotation(item, type) {
        activeAnotationType = type;
        if (type === 'memorial') {
            // Adapta o Memorial para entrar no formato esperado pelo Anotation
            activeAnotationItem = {
                id: 'memorial', name: 'MEMORIAL SELADO', desc: codexData.memorial.content, img: '', lastLoc: 'NEXUS_OS PROTOCOL'
            };
        } else {
            activeAnotationItem = item;
        }
    }

    async function handleAnotationSave(event) {
        const updatedDoc = event.detail;
        if (activeAnotationType === 'memorial') {
            codexData.memorial.content = updatedDoc.desc;
            ui.notifications.info(`Memorial atualizado.`);
        } else {
            const idx = codexData.items.findIndex(i => i.id === updatedDoc.id);
            if (idx !== -1) {
                codexData.items[idx] = updatedDoc;
                ui.notifications.info(`Documento [${updatedDoc.name}] salvo.`);
            }
        }
        codexData = codexData;
        await TestamentoDatabase.saveTestData(actor, codexData);
        activeAnotationItem = null;
    }

    // --- MEMORIAL LÓGICA (TELA DE BLOQUEIO) ---
    function handlePinSubmit() {
        if (pinInput.length !== 4) return;

        if (codexData.memorial.pin === null) {
            codexData.memorial.pin = pinInput;
            TestamentoDatabase.saveTestData(actor, codexData);
            memorialUnlocked = true;
            ui.notifications.info("PIN Criptografado. O Memorial está configurado.");
            // Abre direto no modo de texto quando configura pela primeira vez
            openAnotation(null, 'memorial');
        } else {
            if (pinInput === codexData.memorial.pin) {
                memorialUnlocked = true;
                pinError = false;
                openAnotation(null, 'memorial');
            } else {
                pinError = true;
                setTimeout(() => pinError = false, 1000);
            }
        }
        pinInput = "";
    }
</script>

{#if activeDossierItem}
    <FichaMilitar npcData={activeDossierItem} on:save={handleDossierSave} on:close={() => activeDossierItem = null} />
{/if}

{#if activeAnotationItem}
    <Anotation docData={activeAnotationItem} on:save={handleAnotationSave} on:close={() => activeAnotationItem = null} />
{/if}

<div class="nexus-codex-root" style="{themeStyle}">
    <aside class="codex-sidebar">
        <div class="brand"><i class="fas fa-network-wired"></i> NEXUS_CODEX</div>
        <nav class="main-nav">
            <button class:active={activeTab === 'codex'} on:click={() => activeTab = 'codex'}><i class="fas fa-book"></i> VÍNCULOS & LORE</button>
            <button class="memorial-btn" class:active={activeTab === 'memorial'} on:click={() => activeTab = 'memorial'}><i class="fas fa-skull"></i> MEMORIAL SELADO</button>
        </nav>
    </aside>

    <main class="codex-content">
        {#if activeTab === 'codex'}
            <header class="codex-header">
                <div class="breadcrumbs">
                    <button on:click={() => navigateTo(null)}><i class="fas fa-hdd"></i> ROOT</button>
                    {#each breadcrumbs as crumb}
                        <span class="sep">/</span>
                        <button on:click={() => navigateTo(crumb.id)}>{crumb.name.toUpperCase()}</button>
                    {/each}
                </div>
                
                <div class="actions">
                    <button on:click={() => openCreator('folder')}><i class="fas fa-folder-plus"></i> PASTA</button>
                    <button on:click={() => openCreator('npc')}><i class="fas fa-user-plus"></i> NPC</button>
                    <button on:click={() => openCreator('doc')}><i class="fas fa-file-alt"></i> DOC</button>
                </div>
            </header>

            <div class="codex-body custom-scroll">
                {#if isCreating}
                    <div class="draft-panel" in:slide>
                        <div class="draft-header">
                            <h3><i class="fas fa-pen"></i> {editMode ? 'EDITAR' : 'NOVO REGISTRO'}</h3>
                            <button on:click={() => isCreating = false}>×</button>
                        </div>
                        
                        <div class="draft-form">
                            <div class="form-row">
                                <div class="field grow"><label>NOME DO ARQUIVO</label><input type="text" bind:value={draftItem.name} placeholder="Nome..."></div>
                                {#if draftItem.type !== 'doc'}
                                    <div class="field grow"><label>URL DA IMAGEM (Capa)</label><input type="text" bind:value={draftItem.img} placeholder="Caminho da imagem..."></div>
                                {/if}
                            </div>

                            {#if draftItem.type === 'npc'}
                                <div class="form-row">
                                    <div class="field grow"><label>ÚLTIMA LOCALIZAÇÃO</label><input type="text" bind:value={draftItem.lastLoc} placeholder="Onde foi visto..."></div>
                                    <div class="field"><label>DATA</label><input type="text" bind:value={draftItem.lastDate} placeholder="Data..."></div>
                                </div>
                            {/if}

                            {#if draftItem.type !== 'npc'}
                                <div class="field">
                                    <label>DADOS / ANOTAÇÕES INICIAIS</label>
                                    <textarea bind:value={draftItem.desc} class="custom-scroll" placeholder="Escreva os detalhes básicos (Você poderá usar o Editor Focado depois)..."></textarea>
                                </div>
                            {/if}

                            <button class="btn-save" on:click={saveDraft}><i class="fas fa-save"></i> SALVAR ARQUIVO</button>
                        </div>
                    </div>
                {/if}

                {#if !isCreating}
                    {#if currentItems.length === 0}
                        <div class="empty-codex"><i class="fas fa-folder-open"></i><p>DIRETÓRIO VAZIO</p></div>
                    {:else}
                        <div class="item-grid">
                            {#each currentItems as item (item.id)}
                                
                                {#if item.type === 'folder'}
                                    <div class="visual-card folder" style="background-image: url('{item.img || 'icons/svg/book.svg'}')" on:click={() => navigateTo(item.id)}>
                                        <div class="card-overlay">
                                            <h4><i class="fas fa-folder"></i> {item.name}</h4>
                                            <div class="action-bar">
                                                <button on:click|stopPropagation={() => openEditor(item)}><i class="fas fa-edit"></i></button>
                                                <button class="del" on:click|stopPropagation={() => deleteItem(item.id)}><i class="fas fa-trash"></i></button>
                                            </div>
                                        </div>
                                    </div>
                                
                                {:else if item.type === 'npc'}
                                    <div class="visual-card npc" style="background-image: url('{item.img || 'icons/svg/mystery-man.svg'}')" on:click={() => openDossier(item)}>
                                        <div class="card-overlay">
                                            <h4>{item.name}</h4>
                                            <small><i class="fas fa-map-marker-alt"></i> {item.lastLoc || 'Local Desconhecido'}</small>
                                            <div class="action-bar">
                                                <button on:click|stopPropagation={() => openEditor(item)}><i class="fas fa-edit"></i></button>
                                                <button class="del" on:click|stopPropagation={() => deleteItem(item.id)}><i class="fas fa-trash"></i></button>
                                            </div>
                                        </div>
                                    </div>

                                {:else}
                                    <div class="doc-card" on:click={() => openAnotation(item, 'doc')}>
                                        <div class="doc-header">
                                            <div class="doc-icon"><i class="fas fa-file-alt"></i></div>
                                            <div class="doc-title"><h4>{item.name}</h4></div>
                                            <div class="action-bar">
                                                <button on:click|stopPropagation={() => openEditor(item)}><i class="fas fa-edit"></i></button>
                                                <button class="del" on:click|stopPropagation={() => deleteItem(item.id)}><i class="fas fa-trash"></i></button>
                                            </div>
                                        </div>
                                    </div>
                                {/if}
                            {/each}
                        </div>
                    {/if}
                {/if}
            </div>

        {:else if activeTab === 'memorial'}
            <div class="memorial-container">
                {#if !memorialUnlocked}
                    <div class="lock-screen" in:fade>
                        <i class="fas fa-user-secret skull-icon"></i>
                        <h1>PROTOCOLO DE PRIVACIDADE</h1>
                        <p>O "Lacre de Morte" protege as memórias absolutas deste indivíduo.</p>
                        <div class="pin-box" class:error={pinError}>
                            <label>{codexData.memorial.pin === null ? 'CRIE UM PIN DE 4 DÍGITOS' : 'INSIRA O PIN PARA DESTRANCAR'}</label>
                            <input type="password" maxlength="4" bind:value={pinInput} placeholder="****" on:keydown={(e) => e.key === 'Enter' && handlePinSubmit()}>
                            <button on:click={handlePinSubmit}><i class="fas fa-chevron-right"></i></button>
                        </div>
                    </div>
                {:else}
                    <div class="memorial-editor" in:fade>
                        <div class="mem-header">
                            <div><i class="fas fa-unlock-alt" style="color: #00ff41;"></i> ACESSO CONCEDIDO</div>
                            <button on:click={() => memorialUnlocked = false}><i class="fas fa-lock"></i> RELACRAR O ARQUIVO</button>
                        </div>
                        <div class="unlocked-content">
                            <i class="fas fa-eye"></i>
                            <p>O Memorial foi destrancado. Clique no botão abaixo para iniciar a edição imersiva.</p>
                            <button class="btn-open-mem" on:click={() => openAnotation(null, 'memorial')}>ACESSAR MEMORIAL</button>
                        </div>
                    </div>
                {/if}
            </div>
        {/if}
    </main>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

    .nexus-codex-root { display: flex; height: 100%; width: 100%; background: #050505; color: #ccc; font-family: 'Share Tech Mono', monospace; }

    /* SIDEBAR */
    .codex-sidebar { width: 220px; background: #0a0a0a; border-right: 1px solid #222; display: flex; flex-direction: column; }
    .brand { padding: 20px; font-size: 14px; font-weight: bold; color: #00d4ff; border-bottom: 1px dashed #333; letter-spacing: 1px;}
    .main-nav { display: flex; flex-direction: column; padding: 10px; gap: 5px; }
    .main-nav button { background: transparent; border: 1px solid transparent; color: #888; padding: 12px; text-align: left; cursor: pointer; font-family: inherit; font-size: 12px; transition: 0.2s; border-radius: 4px; display: flex; gap: 10px; align-items: center; }
    .main-nav button:hover { background: #111; color: #fff; }
    .main-nav button.active { background: rgba(0, 212, 255, 0.1); color: #00d4ff; border-color: rgba(0, 212, 255, 0.3); }
    .main-nav button.memorial-btn { margin-top: 20px; border: 1px solid #300; color: #844; }
    .main-nav button.memorial-btn:hover { background: #200; color: #ff4444; }
    .main-nav button.memorial-btn.active { background: rgba(255, 0, 0, 0.1); color: #ff4444; border-color: #ff4444; }

    /* CONTENT ÁREA */
    .codex-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative;}
    .codex-header { display: flex; justify-content: space-between; padding: 15px; background: #080808; border-bottom: 1px solid #222;}
    .breadcrumbs { display: flex; align-items: center; gap: 5px; font-size: 12px; }
    .breadcrumbs button { background: transparent; border: none; color: #00d4ff; cursor: pointer; font-family: inherit; font-weight: bold;}
    .breadcrumbs button:hover { text-shadow: 0 0 8px #00d4ff; }
    .breadcrumbs .sep { color: #555; }
    
    .actions { display: flex; gap: 5px; }
    .actions button { background: #111; border: 1px solid #333; color: #aaa; padding: 6px 12px; cursor: pointer; border-radius: 4px; font-family: inherit; font-size: 11px; transition: 0.2s;}
    .actions button:hover { border-color: #00d4ff; color: #fff; }

    .codex-body { flex: 1; padding: 20px; overflow-y: auto; }

    /* FORMULÁRIO DRAFT */
    .draft-panel { background: #0a0a0a; border: 1px solid #00d4ff; border-radius: 6px; padding: 20px; margin-bottom: 20px; box-shadow: inset 0 0 20px rgba(0, 212, 255, 0.05); }
    .draft-header { display: flex; justify-content: space-between; margin-bottom: 15px; color: #00d4ff; font-weight: bold; border-bottom: 1px dashed #333; padding-bottom: 10px;}
    .draft-header button { background: transparent; border: none; color: #fff; font-size: 18px; cursor: pointer; }
    .form-row { display: flex; gap: 15px; margin-bottom: 15px; }
    .field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 15px;}
    .field.grow { flex: 1; margin-bottom: 0;}
    .field label { font-size: 10px; color: #888; }
    .field input, .field textarea { background: #000; border: 1px solid #333; color: #fff; padding: 10px; font-family: inherit; border-radius: 4px; outline: none;}
    .field input:focus, .field textarea:focus { border-color: #00d4ff; }
    .field textarea { min-height: 100px; resize: vertical; }
    .btn-save { width: 100%; padding: 12px; background: rgba(0, 212, 255, 0.1); border: 1px solid #00d4ff; color: #00d4ff; font-family: inherit; font-weight: bold; cursor: pointer; border-radius: 4px; transition: 0.2s;}
    .btn-save:hover { background: #00d4ff; color: #000; }

    .empty-codex { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #444; opacity: 0.5; font-size: 24px;}
    .empty-codex p { font-size: 12px; margin-top: 10px; letter-spacing: 2px;}

    .item-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px; align-items: start; }
    
    .visual-card { height: 180px; border-radius: 6px; cursor: pointer; position: relative; overflow: hidden; background-size: cover; background-position: center; border: 1px solid #333; transition: 0.3s; }
    .visual-card:hover { transform: translateY(-4px); box-shadow: 0 5px 15px rgba(0,0,0,0.8); border-color: #555; }
    .visual-card.folder { border-color: #aa8800; }
    .visual-card.folder:hover { border-color: #ffcc00; box-shadow: 0 5px 15px rgba(255,204,0,0.3); }
    .visual-card.npc:hover { border-color: #00d4ff; box-shadow: 0 5px 15px rgba(0,212,255,0.3); }

    .card-overlay { position: absolute; inset: 0; background: linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%); display: flex; flex-direction: column; justify-content: flex-end; padding: 15px; }
    .card-overlay h4 { margin: 0 0 5px 0; font-size: 16px; color: #fff; text-shadow: 0 2px 4px #000; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;}
    .visual-card.folder h4 { color: #ffcc00; }
    .card-overlay small { font-size: 10px; color: #aaa; }

    /* DOC CARD (Agora é só um botão grande sem acordeão) */
    .doc-card { background: #111; border: 1px solid #333; border-left: 4px solid #bb88ff; border-radius: 4px; cursor: pointer; transition: 0.2s;}
    .doc-card:hover { border-color: #bb88ff; transform: translateY(-2px); box-shadow: 0 5px 10px rgba(187, 136, 255, 0.2);}
    .doc-header { display: flex; align-items: center; padding: 15px; }
    .doc-icon { font-size: 20px; color: #bb88ff; margin-right: 15px;}
    .doc-title { flex: 1; }
    .doc-title h4 { margin: 0; font-size: 14px; color: #fff; }

    .action-bar { position: absolute; top: 10px; right: 10px; display: flex; gap: 5px; opacity: 0; transition: 0.2s; }
    .visual-card:hover .action-bar, .doc-card:hover .action-bar { opacity: 1; }
    .action-bar button { background: rgba(0,0,0,0.8); border: 1px solid #555; color: #fff; width: 30px; height: 30px; border-radius: 4px; cursor: pointer; transition: 0.2s;}
    .action-bar button:hover { border-color: #00d4ff; color: #00d4ff; }
    .action-bar button.del:hover { border-color: #ff3333; color: #ff3333; }

    /* MEMORIAL */
    .memorial-container { display: flex; align-items: center; justify-content: center; height: 100%; background: radial-gradient(circle at center, #1a0000 0%, #000 70%); }
    .lock-screen { text-align: center; max-width: 400px; padding: 40px; border: 1px solid #400; background: rgba(0,0,0,0.8); border-radius: 8px; box-shadow: 0 0 30px rgba(255,0,0,0.1); }
    .skull-icon { font-size: 48px; color: #ff3333; margin-bottom: 20px; text-shadow: 0 0 15px #ff3333; }
    .lock-screen h1 { color: #fff; font-size: 18px; letter-spacing: 2px; margin-bottom: 10px; }
    .lock-screen p { font-size: 11px; color: #a66; margin-bottom: 30px; line-height: 1.5; }
    .pin-box { display: flex; flex-direction: column; gap: 10px; }
    .pin-box label { font-size: 10px; color: #ff3333; font-weight: bold; }
    .pin-box input { background: #000; border: 1px solid #400; color: #ff3333; text-align: center; font-size: 24px; padding: 10px; letter-spacing: 10px; font-family: monospace; outline: none;}
    .pin-box input:focus { border-color: #ff3333; box-shadow: 0 0 10px rgba(255,0,0,0.3); }
    .pin-box button { background: #ff3333; border: none; color: #000; padding: 12px; cursor: pointer; font-weight: bold; font-size: 16px; transition: 0.2s;}
    .pin-box button:hover { background: #fff; }
    .pin-box.error input { border-color: #ff0000; animation: shake 0.4s; color: #ff0000;}

    .memorial-editor { display: flex; flex-direction: column; width: 100%; height: 100%; padding: 20px; }
    .mem-header { display: flex; justify-content: space-between; border-bottom: 1px dashed #400; padding-bottom: 15px; margin-bottom: 20px; font-size: 12px; color: #666; }
    .mem-header button { background: transparent; border: 1px solid #400; color: #ff3333; padding: 5px 10px; cursor: pointer; border-radius: 4px; font-family: inherit;}
    .mem-header button:hover { background: #ff3333; color: #000; }
    
    .unlocked-content { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; opacity: 0.5; transition: 0.3s; cursor: pointer; }
    .unlocked-content:hover { opacity: 1; }
    .unlocked-content i { font-size: 64px; color: #ff3333; margin-bottom: 20px;}
    .btn-open-mem { background: transparent; border: 1px solid #ff3333; color: #ff3333; padding: 15px 30px; font-family: inherit; font-size: 16px; font-weight: bold; cursor: pointer; transition: 0.2s; margin-top: 20px;}
    .btn-open-mem:hover { background: #ff3333; color: #000; box-shadow: 0 0 20px rgba(255,0,0,0.5);}

    .custom-scroll::-webkit-scrollbar { width: 6px; }
    .custom-scroll::-webkit-scrollbar-track { background: transparent; }
    .custom-scroll::-webkit-scrollbar-thumb { background: rgba(0, 212, 255, 0.2); border-radius: 3px; }

    @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
</style>