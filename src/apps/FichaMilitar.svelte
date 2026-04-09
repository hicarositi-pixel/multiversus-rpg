<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import Anotation from './Anotation.svelte'; // IMPORTANDO O NOVO COMPONENTE

    export let npcData; // Recebe os dados crus do NPC
    const dispatch = createEventDispatcher();

    // Clona os dados para não alterar o banco antes de clicar em "Salvar"
    let draft = foundry.utils.deepClone(npcData);

    // Garante que todas as listas existam
    if (!draft.titles) draft.titles = "";
    if (!draft.codename) draft.codename = "";
    if (!draft.age) draft.age = "";
    if (!draft.gender) draft.gender = "";
    if (!draft.birthplace) draft.birthplace = "";
    if (!draft.origin) draft.origin = "";
    if (!draft.descPhysical) draft.descPhysical = "";
    if (!draft.descPsycho) draft.descPsycho = "";
    if (!draft.history) draft.history = "";
    if (!draft.bodyArt) draft.bodyArt = ""; 

    // Padroniza as listas antigas para usarem "name" em vez de "title" (para a Anotation entender)
    if (!draft.interactions) draft.interactions = [];
    else draft.interactions = draft.interactions.map(i => ({...i, name: i.name || i.title || "Registro Sem Título"}));

    if (!draft.reports) draft.reports = [];
    else draft.reports = draft.reports.map(r => ({...r, name: r.name || r.title || "Relatório Sem Título"}));

    let isEditing = false;
    let activeTab = 'geral'; 

    // --- ESTADOS PARA A ANOTAÇÃO (FULLSCREEN) ---
    let activeAnotationItem = null;
    let activeAnotationType = ''; // 'interaction' ou 'report'

    // --- GESTÃO DE ARRAYS ---
    function addInteraction() {
        draft.interactions.push({ id: foundry.utils.randomID(), name: "Nova Interação", desc: "", img: "", lastLoc: "Dossiê Pessoal" });
        draft = draft;
    }
    function removeInteraction(id) {
        draft.interactions = draft.interactions.filter(i => i.id !== id);
    }

    function addReport() {
        draft.reports.push({ id: foundry.utils.randomID(), name: "Novo Relatório Anexado", desc: "", img: "", lastLoc: "Arquivo Confidencial" });
        draft = draft;
    }
    function removeReport(id) {
        draft.reports = draft.reports.filter(r => r.id !== id);
    }

    // --- ABRIR E SALVAR A ANOTAÇÃO (DATA HELL) ---
    function openAnotation(item, type) {
        activeAnotationItem = item;
        activeAnotationType = type;
    }

    function handleAnotationSave(event) {
        const updatedItem = event.detail;
        if (activeAnotationType === 'interaction') {
            const idx = draft.interactions.findIndex(i => i.id === updatedItem.id);
            if (idx !== -1) draft.interactions[idx] = updatedItem;
        } else if (activeAnotationType === 'report') {
            const idx = draft.reports.findIndex(r => r.id === updatedItem.id);
            if (idx !== -1) draft.reports[idx] = updatedItem;
        }
        draft = draft;
        activeAnotationItem = null;
    }

    // --- AÇÕES PRINCIPAIS ---
    function saveDossier() {
        dispatch('save', draft);
        isEditing = false;
    }

    function closeDossier() {
        dispatch('close');
    }
</script>

<div class="dossier-backdrop" transition:fade={{duration: 200}}>
    <div class="dossier-window">
        
        <div class="corner top-left"></div>
        <div class="corner top-right"></div>
        <div class="corner bottom-left"></div>
        <div class="corner bottom-right"></div>
        <div class="scanline"></div>
        
        <header class="dossier-header">
            <div class="class-badge"><i class="fas fa-biohazard"></i> CLASSIFIED</div>
            <div class="header-titles">
                <h1>ARQUIVO CONFIDENCIAL :: {draft.codename || draft.name.toUpperCase()}</h1>
                <span class="id-hash">NEXUS_ID: {draft.id.toUpperCase()} // ACESSO AUTORIZADO</span>
            </div>
            <div class="header-actions">
                <button class="btn-toggle-edit" class:editing={isEditing} on:click={() => isEditing = !isEditing}>
                    <i class="fas {isEditing ? 'fa-eye' : 'fa-pen'}"></i> {isEditing ? 'MODO VISUALIZAÇÃO' : 'MODO EDIÇÃO'}
                </button>
                <button class="btn-close" on:click={closeDossier}><i class="fas fa-times"></i></button>
            </div>
        </header>

        <main class="dossier-body">
            
            <aside class="body-art-panel">
                <div class="photo-frame">
                    {#if isEditing}
                        <div class="edit-photo-urls">
                            <label>URL ÍCONE (Miniatura)</label>
                            <input type="text" bind:value={draft.img} placeholder="URL do ícone...">
                            <label>URL BODY ART (Dossiê)</label>
                            <input type="text" bind:value={draft.bodyArt} placeholder="URL da foto completa...">
                        </div>
                    {/if}
                    
                    {#if draft.bodyArt || draft.img}
                        <img src={draft.bodyArt || draft.img} alt="Body Art" class="character-art" />
                    {:else}
                        <div class="no-photo"><i class="fas fa-user-secret"></i><p>FOTO INDISPONÍVEL</p></div>
                    {/if}
                    <div class="photo-overlay"></div>
                </div>

                <div class="quick-stats">
                    <div class="stat-box">
                        <span class="lbl">VISTO POR ÚLTIMO EM</span>
                        {#if isEditing} <input type="text" bind:value={draft.lastLoc} placeholder="Local..."> {:else} <span class="val">{draft.lastLoc || 'DESCONHECIDO'}</span> {/if}
                    </div>
                    <div class="stat-box">
                        <span class="lbl">DATA DO CONTATO</span>
                        {#if isEditing} <input type="text" bind:value={draft.lastDate} placeholder="Data..."> {:else} <span class="val">{draft.lastDate || 'DESCONHECIDA'}</span> {/if}
                    </div>
                </div>
            </aside>

            <section class="data-panel">
                
                <nav class="dossier-tabs">
                    <button class:active={activeTab === 'geral'} on:click={() => activeTab = 'geral'}>DADOS GERAIS</button>
                    <button class:active={activeTab === 'historia'} on:click={() => activeTab = 'historia'}>HISTÓRIA & PERFIL</button>
                    <button class:active={activeTab === 'interacoes'} on:click={() => activeTab = 'interacoes'}>FEITOS ({draft.interactions.length})</button>
                    <button class:active={activeTab === 'relatorios'} on:click={() => activeTab = 'relatorios'}>ANEXOS ({draft.reports.length})</button>
                </nav>

                <div class="tab-content custom-scroll">
                    
                    {#if activeTab === 'geral'}
                        <div class="data-grid" in:fade>
                            <div class="data-field"><label>NOME DE REGISTRO</label>
                                {#if isEditing} <input type="text" bind:value={draft.name}> {:else} <div class="val highlight">{draft.name}</div> {/if}
                            </div>
                            <div class="data-field"><label>CODINOME</label>
                                {#if isEditing} <input type="text" bind:value={draft.codename}> {:else} <div class="val highlight">{draft.codename || 'N/A'}</div> {/if}
                            </div>
                            <div class="data-field full-width"><label>TÍTULOS / ALCUNHAS</label>
                                {#if isEditing} <input type="text" bind:value={draft.titles}> {:else} <div class="val">{draft.titles || 'N/A'}</div> {/if}
                            </div>
                            
                            <div class="data-field"><label>IDADE</label>
                                {#if isEditing} <input type="text" bind:value={draft.age}> {:else} <div class="val">{draft.age || 'N/A'}</div> {/if}
                            </div>
                            <div class="data-field"><label>GÊNERO</label>
                                {#if isEditing} <input type="text" bind:value={draft.gender}> {:else} <div class="val">{draft.gender || 'N/A'}</div> {/if}
                            </div>
                            <div class="data-field"><label>LOCAL DE NASCIMENTO</label>
                                {#if isEditing} <input type="text" bind:value={draft.birthplace}> {:else} <div class="val">{draft.birthplace || 'N/A'}</div> {/if}
                            </div>
                            <div class="data-field"><label>ORIGEM / FACÇÃO</label>
                                {#if isEditing} <input type="text" bind:value={draft.origin}> {:else} <div class="val">{draft.origin || 'N/A'}</div> {/if}
                            </div>
                        </div>
                    {/if}

                    {#if activeTab === 'historia'}
                        <div class="text-sections" in:fade>
                            <div class="section-block">
                                <h3><i class="fas fa-fingerprint"></i> PERFIL FÍSICO</h3>
                                {#if isEditing} <textarea bind:value={draft.descPhysical}></textarea> {:else} <div class="text-val">{draft.descPhysical || 'Sem registros físicos.'}</div> {/if}
                            </div>
                            <div class="section-block">
                                <h3><i class="fas fa-brain"></i> PERFIL PSICOLÓGICO</h3>
                                {#if isEditing} <textarea bind:value={draft.descPsycho}></textarea> {:else} <div class="text-val">{draft.descPsycho || 'Sem laudo psicológico.'}</div> {/if}
                            </div>
                            <div class="section-block">
                                <h3><i class="fas fa-book-journal-whills"></i> HISTÓRICO CONHECIDO</h3>
                                {#if isEditing} <textarea bind:value={draft.history} style="min-height: 150px;"></textarea> {:else} <div class="text-val">{draft.history || 'Passado desconhecido.'}</div> {/if}
                            </div>
                        </div>
                    {/if}

                    {#if activeTab === 'interacoes'}
                        <div class="dynamic-list" in:fade>
                            {#if isEditing}
                                <button class="btn-add-item" on:click={addInteraction}><i class="fas fa-plus"></i> REGISTRAR NOVO FEITO/INTERAÇÃO</button>
                            {/if}
                            
                            <div class="cards-grid">
                                {#each draft.interactions as inter (inter.id)}
                                    <div class="doc-card" on:click={() => openAnotation(inter, 'interaction')}>
                                        <div class="doc-header">
                                            <div class="doc-icon"><i class="fas fa-bolt"></i></div>
                                            <div class="doc-title"><h4>{inter.name}</h4></div>
                                            {#if isEditing}
                                                <div class="action-bar">
                                                    <button class="del" on:click|stopPropagation={() => removeInteraction(inter.id)}><i class="fas fa-trash"></i></button>
                                                </div>
                                            {/if}
                                        </div>
                                    </div>
                                {/each}
                            </div>
                            {#if draft.interactions.length === 0 && !isEditing} <p class="empty-msg">Nenhum feito registrado.</p> {/if}
                        </div>
                    {/if}

                    {#if activeTab === 'relatorios'}
                        <div class="dynamic-list" in:fade>
                            {#if isEditing}
                                <button class="btn-add-item doc" on:click={addReport}><i class="fas fa-file-medical"></i> ANEXAR NOVO DOCUMENTO</button>
                            {/if}
                            
                            <div class="cards-grid">
                                {#each draft.reports as rep (rep.id)}
                                    <div class="doc-card report-style" on:click={() => openAnotation(rep, 'report')}>
                                        <div class="doc-header">
                                            <div class="doc-icon"><i class="fas fa-file-alt"></i></div>
                                            <div class="doc-title"><h4>{rep.name}</h4></div>
                                            {#if isEditing}
                                                <div class="action-bar">
                                                    <button class="del" on:click|stopPropagation={() => removeReport(rep.id)}><i class="fas fa-trash"></i></button>
                                                </div>
                                            {/if}
                                        </div>
                                    </div>
                                {/each}
                            </div>
                            {#if draft.reports.length === 0 && !isEditing} <p class="empty-msg">Nenhum documento anexado.</p> {/if}
                        </div>
                    {/if}

                </div>
            </section>
        </main>

        {#if isEditing}
            <footer class="dossier-footer" in:slide>
                <div class="warning-text"><i class="fas fa-exclamation-triangle"></i> ATENÇÃO: VOCÊ ESTÁ ALTERANDO REGISTROS OFICIAIS.</div>
                <button class="btn-save-dossier" on:click={saveDossier}><i class="fas fa-save"></i> GRAVAR ALTERAÇÕES NO DATA CORE</button>
            </footer>
        {/if}
    </div>
    
    {#if activeAnotationItem}
        <Anotation 
            docData={activeAnotationItem} 
            on:save={handleAnotationSave} 
            on:close={() => activeAnotationItem = null} 
        />
    {/if}
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

    .dossier-backdrop {
        position: absolute; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
        z-index: 50000; display: flex; align-items: center; justify-content: center; padding: 20px;
        font-family: 'Share Tech Mono', monospace;
    }

    .dossier-window {
        width: 100%; max-width: 1100px; height: 95%; background: #05080a;
        border: 1px solid #334444; box-shadow: 0 0 50px rgba(0,0,0,1);
        display: flex; flex-direction: column; position: relative; overflow: hidden;
    }

    /* ESTÉTICA MILITAR SCIFI */
    .corner { position: absolute; width: 20px; height: 20px; border: 2px solid #557777; pointer-events: none; z-index: 10;}
    .top-left { top: 10px; left: 10px; border-right: none; border-bottom: none; }
    .top-right { top: 10px; right: 10px; border-left: none; border-bottom: none; }
    .bottom-left { bottom: 10px; left: 10px; border-right: none; border-top: none; }
    .bottom-right { bottom: 10px; right: 10px; border-left: none; border-top: none; }
    
    .scanline { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(to bottom, transparent, rgba(100, 255, 200, 0.05), transparent); height: 50px; animation: scan 4s linear infinite; z-index: 9;}
    @keyframes scan { 0% { top: -50px; } 100% { top: 100%; } }

    /* HEADER */
    .dossier-header { display: flex; align-items: center; padding: 20px 30px; background: #0a1114; border-bottom: 2px solid #1a2a2a; z-index: 11;}
    .class-badge { background: #330000; border: 1px solid #ff3333; color: #ff3333; padding: 8px 15px; font-weight: bold; font-size: 14px; letter-spacing: 2px; margin-right: 20px; border-radius: 2px;}
    
    .header-titles { flex: 1; display: flex; flex-direction: column; }
    .header-titles h1 { margin: 0; font-size: 24px; color: #fff; letter-spacing: 1px; text-shadow: 0 0 10px rgba(255,255,255,0.3);}
    .id-hash { font-size: 11px; color: #557777; }

    .header-actions { display: flex; gap: 10px; }
    .btn-toggle-edit { background: transparent; border: 1px solid #557777; color: #88aaaa; padding: 8px 15px; cursor: pointer; font-family: inherit; font-weight: bold; transition: 0.2s; }
    .btn-toggle-edit:hover { background: #112222; color: #fff; border-color: #fff; }
    .btn-toggle-edit.editing { background: #ffaa00; color: #000; border-color: #ffaa00; box-shadow: 0 0 15px rgba(255, 170, 0, 0.5); }
    .btn-close { background: transparent; border: none; color: #88aaaa; font-size: 24px; cursor: pointer; transition: 0.2s; }
    .btn-close:hover { color: #ff3333; }

    /* CORPO */
    .dossier-body { flex: 1; display: flex; overflow: hidden; z-index: 11;}

    /* LATERAL ESQUERDA (BODY ART) */
    .body-art-panel { width: 350px; background: #080d10; border-right: 1px solid #1a2a2a; padding: 20px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto;}
    
    .photo-frame { flex: 1; min-height: 400px; border: 1px solid #334444; background: #030508; position: relative; display: flex; flex-direction: column;}
    .character-art { width: 100%; height: 100%; object-fit: contain; object-position: top; }
    .no-photo { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #223333; font-size: 48px; }
    .no-photo p { font-size: 14px; margin-top: 10px; font-weight: bold; letter-spacing: 2px;}
    .photo-overlay { position: absolute; inset: 0; background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px); pointer-events: none;}
    
    .edit-photo-urls { padding: 10px; background: rgba(255, 170, 0, 0.1); border-bottom: 1px solid #ffaa00; display: flex; flex-direction: column; gap: 5px; }
    .edit-photo-urls label { font-size: 9px; color: #ffaa00; font-weight: bold; }
    .edit-photo-urls input { background: #000; border: 1px solid #aa7700; color: #fff; padding: 5px; font-family: inherit; font-size: 11px; outline: none;}

    .quick-stats { display: flex; flex-direction: column; gap: 10px; }
    .stat-box { background: #0b1318; border: 1px solid #1a2a2a; padding: 10px; border-left: 3px solid #00d4ff; display: flex; flex-direction: column;}
    .stat-box .lbl { font-size: 9px; color: #557777; font-weight: bold; margin-bottom: 4px; }
    .stat-box .val { font-size: 14px; color: #fff; font-weight: bold;}
    .stat-box input { background: transparent; border: none; border-bottom: 1px dashed #557777; color: #fff; font-family: inherit; font-size: 14px; outline: none;}

    /* LATERAL DIREITA (DADOS) */
    .data-panel { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #0a1114;}
    
    .dossier-tabs { display: flex; border-bottom: 1px solid #1a2a2a; background: #05080a;}
    .dossier-tabs button { flex: 1; background: transparent; border: none; color: #557777; padding: 15px; font-family: inherit; font-weight: bold; font-size: 12px; cursor: pointer; transition: 0.2s; border-bottom: 2px solid transparent;}
    .dossier-tabs button:hover { background: #0b1318; color: #fff; }
    .dossier-tabs button.active { color: #00d4ff; border-bottom-color: #00d4ff; background: rgba(0, 212, 255, 0.05); }

    .tab-content { flex: 1; padding: 30px; overflow-y: auto; }

    /* FORMULÁRIOS E TEXTOS */
    .data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .data-field { display: flex; flex-direction: column; }
    .data-field.full-width { grid-column: span 2; }
    .data-field label { font-size: 10px; color: #557777; font-weight: bold; margin-bottom: 5px; }
    .data-field .val { font-size: 16px; color: #ccc; padding: 8px 0; border-bottom: 1px solid #1a2a2a; min-height: 20px;}
    .data-field .val.highlight { color: #00d4ff; font-weight: bold; font-size: 18px; }
    .data-field input { background: #05080a; border: 1px solid #334444; color: #fff; padding: 10px; font-family: inherit; font-size: 14px; outline: none; border-radius: 2px;}
    .data-field input:focus { border-color: #00d4ff; }

    .text-sections { display: flex; flex-direction: column; gap: 30px; }
    .section-block h3 { margin: 0 0 10px 0; font-size: 14px; color: #00d4ff; border-bottom: 1px dashed #1a2a2a; padding-bottom: 5px; display: flex; align-items: center; gap: 10px;}
    .text-val { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 14px; line-height: 1.6; color: #aaa; white-space: pre-wrap; text-align: justify;}
    .section-block textarea { width: 100%; min-height: 100px; background: #05080a; border: 1px solid #334444; color: #fff; padding: 15px; font-family: inherit; font-size: 13px; line-height: 1.5; resize: vertical; outline: none; }

    /* LISTAS DINÂMICAS E CARDS */
    .dynamic-list { display: flex; flex-direction: column; gap: 15px; }
    .btn-add-item { background: rgba(0, 212, 255, 0.1); border: 1px dashed #00d4ff; color: #00d4ff; padding: 15px; font-family: inherit; font-weight: bold; cursor: pointer; transition: 0.2s;}
    .btn-add-item:hover { background: #00d4ff; color: #000; }
    .btn-add-item.doc { border-color: #bb88ff; color: #bb88ff; background: rgba(187, 136, 255, 0.1); }
    .btn-add-item.doc:hover { background: #bb88ff; color: #000; }
    .empty-msg { text-align: center; color: #557777; font-style: italic; margin-top: 20px; }

    /* Cards Estilo Documento (para Interações e Relatórios) */
    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; }
    
    .doc-card { background: #111; border: 1px solid #333; border-left: 4px solid #00d4ff; border-radius: 4px; cursor: pointer; transition: 0.2s; position: relative;}
    .doc-card:hover { border-color: #555; background: #1a1a1a; transform: translateY(-2px);}
    .doc-card.report-style { border-left-color: #bb88ff; }

    .doc-header { display: flex; align-items: center; padding: 15px; }
    .doc-icon { font-size: 20px; color: #00d4ff; margin-right: 15px;}
    .doc-card.report-style .doc-icon { color: #bb88ff; }
    .doc-title { flex: 1; overflow: hidden; }
    .doc-title h4 { margin: 0; font-size: 14px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .action-bar { display: flex; gap: 5px; margin-left: 10px; }
    .action-bar button { background: rgba(0,0,0,0.8); border: 1px solid #555; color: #fff; width: 30px; height: 30px; border-radius: 4px; cursor: pointer; transition: 0.2s;}
    .action-bar button:hover { border-color: #ff3333; color: #ff3333; }

    /* FOOTER DE SALVAMENTO */
    .dossier-footer { background: #0a1114; padding: 15px 30px; border-top: 1px solid #1a2a2a; display: flex; justify-content: space-between; align-items: center; z-index: 11;}
    .warning-text { color: #ffaa00; font-size: 11px; font-weight: bold; display: flex; align-items: center; gap: 10px;}
    .btn-save-dossier { background: #00d4ff; border: none; color: #000; padding: 12px 25px; font-family: inherit; font-weight: bold; font-size: 14px; cursor: pointer; box-shadow: 0 0 15px rgba(0, 212, 255, 0.4); transition: 0.2s;}
    .btn-save-dossier:hover { background: #fff; box-shadow: 0 0 25px rgba(255,255,255,0.8); transform: translateY(-2px);}

    .custom-scroll::-webkit-scrollbar { width: 6px; }
    .custom-scroll::-webkit-scrollbar-track { background: transparent; }
    .custom-scroll::-webkit-scrollbar-thumb { background: rgba(85, 119, 119, 0.3); border-radius: 3px; }
</style>