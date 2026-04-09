<script>
    import { createEventDispatcher } from 'svelte';
    import { fade, slide, scale } from 'svelte/transition';

    export let docData; 
    const dispatch = createEventDispatcher();

    let draft = foundry.utils.deepClone(docData);
    
    // --- 1. MIGRAÇÃO E ESTRUTURA DE DADOS (PARTIÇÕES) ---
    if (!draft.subtitle) draft.subtitle = "";
    
    // Transforma o formato antigo (desc/img únicos) no novo formato de Partições (Topics)
    if (!draft.topics || draft.topics.length === 0) {
        draft.topics = [{
            id: foundry.utils.randomID(),
            title: "Registro Principal",
            icon: "fas fa-file-alt",
            img: draft.img || "",
            content: draft.desc || ""
        }];
    }
    
    // Limpa os dados velhos da raiz para economizar espaço
    delete draft.desc;
    delete draft.img;

    // --- 2. ESTADOS DA INTERFACE ---
    let isEditing = draft.topics[0].content === "" && draft.name.includes("Novo");
    let isFocusMode = false;
    let showHelpModal = false;
    let activeTopicId = draft.topics[0].id;

    $: activeTopic = draft.topics.find(t => t.id === activeTopicId) || draft.topics[0];

    // --- 3. AÇÕES ---
    function saveDoc() { dispatch('save', draft); isEditing = false; }
    function closeDoc() { dispatch('close'); }
    function toggleFocusMode() { isFocusMode = !isFocusMode; }

    function addTopic() {
        const newTopic = { id: foundry.utils.randomID(), title: "Nova Partição", icon: "fas fa-bookmark", img: "", content: "" };
        draft.topics.push(newTopic);
        draft = draft;
        activeTopicId = newTopic.id;
    }

    function removeTopic(id) {
        draft.topics = draft.topics.filter(t => t.id !== id);
        if (draft.topics.length === 0) addTopic(); // Garante que nunca fique sem tópicos
        else if (activeTopicId === id) activeTopicId = draft.topics[0].id;
        draft = draft;
    }

    // --- 4. DECODIFICADOR CYBERPUNK (Processador de Texto Avançado) ---
    $: formattedText = processText(activeTopic.content);

    function processText(text) {
        if (!text) return '<span style="opacity: 0.5; font-style: italic;">NENHUM DADO ENCONTRADO NESTA PARTIÇÃO.</span>';
        
        let safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;"); // Proteção básica
        
        // 1. Títulos de Seção: # Título
        safeText = safeText.replace(/^# (.*$)/gim, '<h3 class="cyber-h3"><i class="fas fa-angle-right"></i> $1</h3>');
        
        // 2. Logs/Citações: > Texto
        safeText = safeText.replace(/^&gt; (.*$)/gim, '<div class="cyber-log">$1</div>');
        
        // 3. Destaque Ciano: [texto]
        safeText = safeText.replace(/\[(.*?)\]/g, '<span class="cyber-highlight">$1</span>');
        
        // 4. Destaque Vermelho: *texto*
        safeText = safeText.replace(/\*(.*?)\*/g, '<span class="cyber-alert">$1</span>');
        
        // Quebras de linha
        safeText = safeText.replace(/\n/g, '<br>');
        return safeText;
    }

    // Soma o tamanho de todas as partições para o rodapé
    $: totalBytes = draft.topics.reduce((acc, t) => acc + t.content.length, 0) * 8 + 1024;
</script>

<div class="tactical-backdrop" transition:fade={{duration: 200}}>
    <div class="military-terminal" in:scale={{duration: 300, start: 0.98}}>
        
        <div class="crt-overlay"></div>
        <div class="scanline"></div>

        <header class="mil-header">
            <div class="classification"><i class="fas fa-exclamation-triangle"></i> TOP SECRET // EYES ONLY</div>
            <div class="doc-id">SYS_REF: {draft.id || 'UNREGISTERED'}</div>
            
            <div class="top-actions">
                <button class="btn-help" on:click={() => showHelpModal = true} title="Manual de Formatação"><i class="fas fa-question-circle"></i> AJUDA</button>
                <button class="btn-focus" on:click={toggleFocusMode} title="Modo Foco"><i class="fas fa-expand"></i> FOCO</button>
                <button class="btn-close" on:click={closeDoc}>×</button>
            </div>
        </header>

        <main class="doc-workspace custom-scroll" class:focus-mode={isFocusMode}>
            
            <div class="doc-container">
                <div class="doc-meta-header">
                    {#if isEditing}
                        <div class="edit-meta-box">
                            <input type="text" class="input-title" bind:value={draft.name} placeholder="TÍTULO DO ARQUIVO">
                            <input type="text" class="input-subtitle" bind:value={draft.subtitle} placeholder="Subtítulo ou Classificação...">
                            <div class="input-source-group">
                                <label>ORIGEM DA INFORMAÇÃO:</label>
                                <input type="text" class="input-source" bind:value={draft.lastLoc} placeholder="Ex: Setor 4, Facção X...">
                            </div>
                        </div>
                    {:else}
                        <div class="titles-area">
                            <h1 class="read-title">{draft.name.toUpperCase()}</h1>
                            {#if draft.subtitle}<h3 class="read-subtitle">{draft.subtitle.toUpperCase()}</h3>{/if}
                            <div class="read-source"><i class="fas fa-satellite-dish"></i> FONTE: {draft.lastLoc || 'DESCONHECIDA'}</div>
                        </div>
                    {/if}
                </div>

                {#if draft.topics.length > 1 || isEditing}
                    <nav class="partition-nav">
                        {#each draft.topics as topic (topic.id)}
                            <button class="part-btn" class:active={activeTopicId === topic.id} on:click={() => activeTopicId = topic.id}>
                                <i class="{topic.icon || 'fas fa-file'}"></i> {topic.title.toUpperCase()}
                            </button>
                        {/each}
                        {#if isEditing}
                            <button class="part-btn add" on:click={addTopic}><i class="fas fa-plus"></i> NOVA PARTIÇÃO</button>
                        {/if}
                    </nav>
                {/if}

                <div class="doc-content-area" key={activeTopicId} in:fade={{duration: 150}}>
                    
                    {#if isEditing}
                        <div class="topic-editor">
                            <div class="topic-meta-edit">
                                <div class="f-group grow"><label>NOME DA PARTIÇÃO</label><input type="text" bind:value={activeTopic.title}></div>
                                <div class="f-group"><label>ÍCONE (Fa-Class)</label><input type="text" bind:value={activeTopic.icon} placeholder="fas fa-skull"></div>
                            </div>
                            <div class="f-group"><label>URL DA IMAGEM ANEXA (Opcional)</label><input type="text" bind:value={activeTopic.img} placeholder="http://imagem..."></div>
                            
                            <textarea class="input-body custom-scroll" bind:value={activeTopic.content} placeholder="Inicie a digitação do relatório... Use o botão AJUDA no topo para formatar." spellcheck="false"></textarea>
                            
                            <div class="topic-actions">
                                <button class="btn-del-topic" on:click={() => removeTopic(activeTopic.id)}><i class="fas fa-trash"></i> DELETAR PARTIÇÃO</button>
                            </div>
                        </div>
                    {:else}
                        <div class="topic-viewer">
                            {#if activeTopic.img}
                                <figure class="attached-figure">
                                    <img src={activeTopic.img} alt="Evidência Visual">
                                    <figcaption>ANEXO VISUAL :: {activeTopic.title.toUpperCase()}</figcaption>
                                </figure>
                            {/if}
                            <div class="read-body">
                                {@html formattedText}
                            </div>
                        </div>
                    {/if}
                </div>

            </div>
        </main>

        <footer class="mil-footer">
            <div class="status-stream"><span class="blinking">_</span> LINK: SECURE // SIZE: {totalBytes} BYTES // PARTS: {draft.topics.length}</div>
            <div class="action-core">
                {#if isEditing}
                    <button class="btn-cyber save" on:click={saveDoc}>[ <i class="fas fa-download"></i> GRAVAR_NO_SISTEMA ]</button>
                {:else}
                    <button class="btn-cyber edit" on:click={() => isEditing = true}>[ <i class="fas fa-terminal"></i> MODO_EDIÇÃO ]</button>
                {/if}
            </div>
        </footer>

        {#if showHelpModal}
            <div class="help-modal-overlay" transition:fade on:click={() => showHelpModal = false}>
                <div class="help-modal" on:click|stopPropagation>
                    <h2><i class="fas fa-terminal"></i> MANUAL DE SINTAXE NEXUS</h2>
                    <p>Utilize os códigos abaixo na área de texto para estilizar o documento oficialmente:</p>
                    
                    <div class="syntax-grid">
                        <div class="syntax-item">
                            <span class="code">[texto]</span>
                            <span class="desc">Gera um <span class="cyber-highlight">destaque analítico</span> (Azul).</span>
                        </div>
                        <div class="syntax-item">
                            <span class="code">*texto*</span>
                            <span class="desc">Gera um <span class="cyber-alert">alerta de ameaça</span> (Vermelho).</span>
                        </div>
                        <div class="syntax-item">
                            <span class="code"># texto</span>
                            <span class="desc">Cria um Título de Subseção dentro do texto.</span>
                        </div>
                        <div class="syntax-item">
                            <span class="code">> texto</span>
                            <span class="desc">Gera um bloco de citação/log de áudio isolado.</span>
                        </div>
                    </div>
                    
                    <button class="btn-close-help" on:click={() => showHelpModal = false}>ENTENDIDO</button>
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&display=swap');

    .tactical-backdrop {
        position: absolute; inset: 0; background: rgba(0, 2, 5, 0.9); backdrop-filter: blur(10px);
        z-index: 60000; display: flex; align-items: center; justify-content: center; padding: 20px;
    }

    .military-terminal {
        width: 100%; max-width: 1000px; height: 90%; background: #030608; border: 1px solid #00d4ff;
        box-shadow: 0 0 50px rgba(0, 212, 255, 0.1), inset 0 0 20px rgba(0, 212, 255, 0.05);
        display: flex; flex-direction: column; position: relative; overflow: hidden; border-radius: 2px;
        transition: max-width 0.3s;
    }

    .crt-overlay { position: absolute; inset: 0; background: repeating-linear-gradient(rgba(0,0,0,0) 0px, rgba(0,0,0,0.1) 2px); pointer-events: none; z-index: 10; }
    .scanline { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(to bottom, transparent, rgba(0, 212, 255, 0.1), transparent); height: 10px; animation: scan 6s linear infinite; z-index: 11;}
    @keyframes scan { 0% { top: -10%; } 100% { top: 110%; } }

    /* HEADER */
    .mil-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 20px; background: #00111a; border-bottom: 2px solid #00d4ff; color: #00d4ff; font-family: 'Share Tech Mono', monospace; z-index: 12;}
    .classification { font-weight: bold; letter-spacing: 2px; display: flex; align-items: center; gap: 10px; color: #ff3333; }
    .doc-id { opacity: 0.6; font-size: 12px; }
    
    .top-actions { display: flex; gap: 15px; align-items: center; }
    .btn-help, .btn-focus { background: transparent; border: 1px solid #005577; color: #0088aa; padding: 4px 10px; font-family: inherit; font-size: 11px; cursor: pointer; transition: 0.2s;}
    .btn-help:hover { border-color: #ffaa00; color: #ffaa00; }
    .btn-focus:hover { border-color: #00d4ff; color: #00d4ff; }
    .btn-close { background: transparent; border: none; color: #00d4ff; font-size: 24px; cursor: pointer; transition: 0.2s; }
    .btn-close:hover { color: #ff3333; text-shadow: 0 0 10px #ff3333; }

    /* ÁREA DE TRABALHO E FOCO */
    .doc-workspace { flex: 1; padding: 30px; overflow-y: auto; background: radial-gradient(circle at top, #050a0f 0%, #000 100%); z-index: 5; transition: padding 0.3s; }
    .doc-workspace.focus-mode { padding: 40px 15%; }
    .doc-container { max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }

    /* META CABEÇALHO */
    .doc-meta-header { display: flex; flex-direction: column; gap: 15px; }
    
    .titles-area { display: flex; flex-direction: column; gap: 8px; font-family: 'Rajdhani', sans-serif; border-bottom: 1px solid #002233; padding-bottom: 20px;}
    .read-title { margin: 0; font-size: 36px; color: #fff; font-weight: 700; letter-spacing: 2px; text-shadow: 0 0 10px rgba(0, 212, 255, 0.3);}
    .read-subtitle { margin: 0; font-size: 16px; color: #00d4ff; font-weight: 600; text-transform: uppercase; letter-spacing: 4px;}
    .read-source { margin-top: 10px; font-family: 'Share Tech Mono', monospace; font-size: 12px; color: #5588aa; display: inline-block; align-self: flex-start;}

    .edit-meta-box { display: flex; flex-direction: column; gap: 10px; background: #000c14; border: 1px solid #003344; padding: 20px; border-radius: 4px;}
    .input-title { background: transparent; border: none; border-bottom: 2px solid #00d4ff; color: #fff; font-family: 'Rajdhani', sans-serif; font-size: 28px; font-weight: bold; outline: none; padding-bottom: 5px;}
    .input-subtitle { background: transparent; border: none; border-bottom: 1px dashed #004455; color: #00d4ff; font-family: 'Rajdhani', sans-serif; font-size: 16px; font-weight: bold; outline: none; padding-bottom: 5px;}
    .input-source-group { display: flex; flex-direction: column; gap: 5px; margin-top: 5px; font-family: 'Share Tech Mono', monospace;}
    .input-source-group label { font-size: 10px; color: #5588aa; }
    .input-source { background: #000; border: 1px solid #004455; color: #88bbcc; padding: 8px; font-family: inherit; font-size: 12px; outline: none;}
    .input-source:focus { border-color: #00d4ff; }

    /* NAVEGAÇÃO DE PARTIÇÕES */
    .partition-nav { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 10px; border-bottom: 2px solid #002233; padding-bottom: 10px;}
    .part-btn { background: #00111a; border: 1px solid #003344; color: #5588aa; padding: 10px 15px; font-family: 'Share Tech Mono', monospace; font-size: 12px; font-weight: bold; cursor: pointer; transition: 0.2s; border-radius: 4px; display: flex; align-items: center; gap: 8px;}
    .part-btn:hover { background: #002233; color: #00d4ff; }
    .part-btn.active { background: rgba(0, 212, 255, 0.1); color: #00d4ff; border-color: #00d4ff; box-shadow: inset 0 0 10px rgba(0,212,255,0.2);}
    .part-btn.add { border-style: dashed; color: #ffaa00; border-color: #aa7700; }
    .part-btn.add:hover { background: rgba(255,170,0,0.1); color: #ffcc00; }

    /* CONTEÚDO E EDITOR DA PARTIÇÃO */
    .doc-content-area { display: flex; flex-direction: column; }
    
    .topic-editor { display: flex; flex-direction: column; gap: 15px; background: #000c14; padding: 20px; border: 1px solid #002233; border-radius: 4px;}
    .topic-meta-edit { display: flex; gap: 15px; }
    .f-group { display: flex; flex-direction: column; gap: 5px; font-family: 'Share Tech Mono', monospace;}
    .f-group.grow { flex: 1; }
    .f-group label { font-size: 10px; color: #00d4ff; }
    .f-group input { background: #000; border: 1px solid #004455; color: #fff; padding: 10px; font-family: inherit; font-size: 13px; outline: none;}
    .f-group input:focus { border-color: #00d4ff; }
    
    .input-body { min-height: 400px; background: #000; border: 1px solid #004455; color: #ccdddd; font-family: 'Share Tech Mono', monospace; font-size: 15px; line-height: 1.6; padding: 15px; resize: vertical; outline: none; border-radius: 4px; }
    .input-body:focus { border-color: #00d4ff; box-shadow: 0 0 15px rgba(0,212,255,0.1); }
    
    .topic-actions { display: flex; justify-content: flex-end; margin-top: 10px;}
    .btn-del-topic { background: #220000; border: 1px solid #ff3333; color: #ff3333; padding: 8px 15px; font-family: 'Share Tech Mono', monospace; font-size: 11px; cursor: pointer; transition: 0.2s;}
    .btn-del-topic:hover { background: #ff3333; color: #000; }

    /* VISUALIZADOR DA PARTIÇÃO */
    .topic-viewer { display: flex; flex-direction: column; gap: 25px; }
    
    .attached-figure { margin: 0; border: 1px solid #004455; background: #000; padding: 5px; box-shadow: 0 5px 15px rgba(0,0,0,0.5); align-self: center; max-width: 100%;}
    .attached-figure img { width: 100%; max-height: 400px; object-fit: contain; display: block; border: 1px solid #112233; filter: contrast(1.1); }
    .attached-figure figcaption { text-align: center; font-family: 'Share Tech Mono', monospace; font-size: 9px; color: #00d4ff; margin-top: 5px; letter-spacing: 2px;}

    .read-body { font-family: 'Rajdhani', sans-serif; font-size: 18px; line-height: 1.6; color: #ccdddd; white-space: pre-wrap; text-align: justify; }

    /* MÁGICA: Estilos do Decodificador */
    :global(.cyber-h3) { margin: 30px 0 10px 0; font-family: 'Share Tech Mono', monospace; font-size: 20px; color: #00d4ff; border-bottom: 1px dashed #004455; padding-bottom: 5px; text-transform: uppercase;}
    :global(.cyber-log) { background: #00111a; border-left: 3px solid #00d4ff; padding: 15px; margin: 15px 0; font-family: 'Share Tech Mono', monospace; font-size: 14px; color: #88bbcc; font-style: italic;}
    :global(.cyber-highlight) { background: rgba(0, 212, 255, 0.15); color: #00ffff; padding: 0 4px; border-bottom: 1px solid #00d4ff; text-shadow: 0 0 5px rgba(0,212,255,0.5); font-weight: 600;}
    :global(.cyber-alert) { background: rgba(255, 51, 51, 0.15); color: #ff6666; padding: 0 4px; border-bottom: 1px solid #ff3333; text-shadow: 0 0 5px rgba(255,51,51,0.5); font-weight: 600;}

    /* MODAL DE AJUDA */
    .help-modal-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.8); z-index: 100; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px);}
    .help-modal { width: 500px; background: #00111a; border: 2px solid #00d4ff; padding: 30px; border-radius: 4px; box-shadow: 0 0 40px rgba(0,212,255,0.2); font-family: 'Share Tech Mono', monospace; }
    .help-modal h2 { margin: 0 0 15px 0; color: #00d4ff; font-size: 20px; border-bottom: 1px solid #004455; padding-bottom: 10px;}
    .help-modal p { font-size: 12px; color: #88bbcc; margin-bottom: 20px; }
    .syntax-grid { display: flex; flex-direction: column; gap: 15px; margin-bottom: 25px; }
    .syntax-item { display: flex; align-items: center; gap: 15px; background: #000; padding: 10px; border: 1px solid #002233; }
    .syntax-item .code { font-weight: bold; color: #fff; width: 80px; text-align: center; }
    .syntax-item .desc { font-family: 'Rajdhani', sans-serif; font-size: 14px; color: #aaa; }
    .btn-close-help { width: 100%; background: #00d4ff; color: #000; border: none; padding: 12px; font-family: inherit; font-weight: bold; font-size: 14px; cursor: pointer; transition: 0.2s;}
    .btn-close-help:hover { background: #fff; }

    /* FOOTER */
    .mil-footer { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background: #00111a; border-top: 1px solid #004455; font-family: 'Share Tech Mono', monospace; z-index: 12;}
    .status-stream { font-size: 11px; color: #0088aa; }
    .blinking { animation: blink 1s infinite; color: #00d4ff; font-weight: bold;}

    .btn-cyber { background: transparent; border: none; font-family: inherit; font-size: 14px; font-weight: bold; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px;}
    .btn-cyber.edit { color: #00d4ff; }
    .btn-cyber.edit:hover { color: #fff; text-shadow: 0 0 10px #00d4ff; }
    .btn-cyber.save { color: #ffaa00; }
    .btn-cyber.save:hover { color: #fff; text-shadow: 0 0 10px #ffaa00; }

    .custom-scroll::-webkit-scrollbar { width: 6px; }
    .custom-scroll::-webkit-scrollbar-track { background: transparent; }
    .custom-scroll::-webkit-scrollbar-thumb { background: rgba(0, 212, 255, 0.3); border-radius: 3px; }
    @keyframes blink { 50% { opacity: 0; } }
</style>