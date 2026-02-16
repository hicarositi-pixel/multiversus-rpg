<script>
    import { slide, fade, scale } from 'svelte/transition';
    import { onMount, onDestroy } from 'svelte';

    // Props
    export let data = {
        // Metadados
        edition: "#0",
        date: "01/01/2077",
        status: "CRÍTICO",
        audio: "", // Variável de áudio
        themeColor: "#ff0055", // Cor Principal
        matrixColor: "#00ff41", // Cor Secundária
        
        // Conteúdo
        cards: [],
        stats: [],
        trends: []
    };
    export let mode = 'view'; // 'view' | 'edit'

    // Estados Locais
    let expandedCardIndex = -1; // Para View Mode
    let activeModal = null;     // Para View Mode
    
    // Estados de Áudio Local
    let localAudioPlayer = null;
    let isMuted = false;
    let isPlaying = false;
    const uniqueAudioId = "dh-audio-" + Math.random().toString(36).substr(2, 9);

    // Estados de Edição (Controle de UI)
    let editTab = 'meta'; // 'meta', 'cards', 'stats', 'trends'
    let collapsedItems = { cards: {}, stats: {}, trends: {} }; // Controle de sanfona no editor

    // --- CICLO DE VIDA DO ÁUDIO ---
    onMount(() => {
        if (mode === 'view' && data.audio) {
            playLocalAudio(data.audio);
        }
    });

    onDestroy(() => {
        stopLocalAudio();
    });

    // --- FUNÇÕES DE ÁUDIO ---
    function playLocalAudio(url) {
        if (!url) return;
        stopLocalAudio();

        // Regex para YouTube
        const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/user\/\S+|\/ytscreeningroom\?v=))([\w\-]{10,12})\b/);

        if (ytMatch && ytMatch[1]) {
            let videoId = ytMatch[1];
            const iframe = document.createElement('iframe');
            iframe.id = uniqueAudioId;
            iframe.style.display = "none";
            // Autoplay, Loop e Playlist para garantir o loop
            iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}`;
            document.body.appendChild(iframe);
            isPlaying = true;
        } else {
            // Audio Direto (MP3/WAV)
            localAudioPlayer = new Audio(url);
            localAudioPlayer.loop = true;
            localAudioPlayer.muted = isMuted;
            localAudioPlayer.volume = 0.5;
            localAudioPlayer.play().catch(e => console.error("Autoplay bloqueado pelo navegador:", e));
            isPlaying = true;
        }
    }

    function stopLocalAudio() {
        if (localAudioPlayer) {
            localAudioPlayer.pause();
            localAudioPlayer = null;
        }
        const yt = document.getElementById(uniqueAudioId);
        if (yt) yt.remove();
        isPlaying = false;
    }

    function toggleLocalMute() {
        isMuted = !isMuted;
        if (localAudioPlayer) {
            localAudioPlayer.muted = isMuted;
        }
    }

    // --- FUNÇÕES DE EDIÇÃO ---
    function addCard() {
        data.cards = [...data.cards, { title: "NOVA MANCHETE", text: "<p>Escreva aqui...</p>", image: "https://placehold.co/800x400/111/ff0055", hellQuote: "" }];
    }
    function removeCard(i) { data.cards = data.cards.filter((_, idx) => idx !== i); }

    function addStat() {
        data.stats = [...data.stats, { label: "DADO", value: "000", tooltip: "Info...", hellQuote: "" }];
    }
    function removeStat(i) { data.stats = data.stats.filter((_, idx) => idx !== i); }

    function addTrend() {
        data.trends = [...data.trends, { name: "ITEM", sub: "Detalhe", image: "", hellQuote: "" }];
    }
    function removeTrend(i) { data.trends = data.trends.filter((_, idx) => idx !== i); }

    // Toggle para minimizar itens no editor
    function toggleEditCollapse(type, index) {
        collapsedItems[type][index] = !collapsedItems[type][index];
    }

    // --- FUNÇÕES DE VISUALIZAÇÃO ---
    function toggleCardView(i) {
        if (mode === 'edit') return;
        expandedCardIndex = expandedCardIndex === i ? -1 : i;
    }

    function openHell(type, index) {
        if (mode === 'edit') return;
        activeModal = { type, index };
    }

    // Helper reativo para a frase do Hell
    $: currentHellQuote = activeModal 
        ? (activeModal.type === 'card' ? data.cards[activeModal.index].hellQuote 
           : activeModal.type === 'stat' ? data.stats[activeModal.index].hellQuote
           : data.trends[activeModal.index].hellQuote)
        : "";

    // Helper de Cores Dinâmicas
    $: cssVars = `--theme-color: ${data.themeColor || '#ff0055'}; --matrix-color: ${data.matrixColor || '#00ff41'};`;
</script>

<div class="dh-root" style="{cssVars}">

    {#if mode === 'edit'}
        <div class="editor-layout">
            
            <aside class="editor-sidebar custom-scroll">
                <div class="editor-tabs">
                    <button class:active={editTab==='meta'} on:click={() => editTab='meta'}>GERAL</button>
                    <button class:active={editTab==='cards'} on:click={() => editTab='cards'}>NOTÍCIAS</button>
                    <button class:active={editTab==='stats'} on:click={() => editTab='stats'}>DADOS</button>
                    <button class:active={editTab==='trends'} on:click={() => editTab='trends'}>TRENDS</button>
                </div>

                <div class="editor-content">
                    {#if editTab === 'meta'}
                        <h3>CONFIGURAÇÕES GERAIS</h3>
                        
                        <label>
                            <span style="color:var(--theme-color)">Edição (Topo):</span> 
                            <input type="text" bind:value={data.edition}>
                        </label>
                        
                        <label>
                            <span style="color:var(--theme-color)">Data / Dia Atual:</span> 
                            <input type="text" bind:value={data.date} placeholder="Ex: 01/06/01">
                        </label>
                        
                        <label>
                            Status do Mundo: 
                            <input type="text" bind:value={data.status}>
                        </label>

                        <div style="margin: 15px 0; border-top: 1px dashed #444; padding-top: 10px;">
                            <label>
                                <span style="display:flex; align-items:center; gap:5px; color:#fff;">
                                    🎵 Link da Música (YouTube/MP3):
                                </span>
                                <input type="text" bind:value={data.audio} placeholder="Cole o link aqui...">
                            </label>
                        </div>
                        
                        <div class="color-pickers">
                            <label>Cor Principal: <input type="color" bind:value={data.themeColor}></label>
                            <label>Cor Secundária: <input type="color" bind:value={data.matrixColor}></label>
                        </div>
                    {/if}

                    {#if editTab === 'cards'}
                        <h3>MANCHETES <button class="mini-add" on:click={addCard}>+</button></h3>
                        {#each data.cards as card, i}
                            <div class="editor-item">
                                <div class="item-header" on:click={() => toggleEditCollapse('cards', i)}>
                                    <span>#{i+1} {card.title}</span>
                                    <div class="acts">
                                        <button class="del" on:click|stopPropagation={() => removeCard(i)}>🗑️</button>
                                        <i class="fas fa-chevron-{collapsedItems.cards[i] ? 'down' : 'up'}"></i>
                                    </div>
                                </div>
                                {#if !collapsedItems.cards[i]}
                                    <div class="item-body" transition:slide>
                                        <label>Título: <input type="text" bind:value={card.title}></label>
                                        <label>Imagem URL: <input type="text" bind:value={card.image}></label>
                                        <label>Hell Quote: <input type="text" bind:value={card.hellQuote} placeholder="Deixe vazio se não tiver"></label>
                                        <label>Conteúdo (HTML): <textarea rows="6" bind:value={card.text}></textarea></label>
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    {/if}

                    {#if editTab === 'stats'}
                        <h3>ESTATÍSTICAS <button class="mini-add" on:click={addStat}>+</button></h3>
                        {#each data.stats as stat, i}
                            <div class="editor-item">
                                <div class="item-header" on:click={() => toggleEditCollapse('stats', i)}>
                                    <span>{stat.label}: {stat.value}</span>
                                    <div class="acts">
                                        <button class="del" on:click|stopPropagation={() => removeStat(i)}>🗑️</button>
                                    </div>
                                </div>
                                {#if !collapsedItems.stats[i]}
                                    <div class="item-body" transition:slide>
                                        <label>Label: <input type="text" bind:value={stat.label}></label>
                                        <label>Valor: <input type="text" bind:value={stat.value}></label>
                                        <label>Tooltip: <input type="text" bind:value={stat.tooltip}></label>
                                        <label>Hell Quote: <input type="text" bind:value={stat.hellQuote}></label>
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    {/if}

                    {#if editTab === 'trends'}
                        <h3>TENDÊNCIAS <button class="mini-add" on:click={addTrend}>+</button></h3>
                        {#each data.trends as trend, i}
                            <div class="editor-item">
                                <div class="item-header" on:click={() => toggleEditCollapse('trends', i)}>
                                    <span>{trend.name}</span>
                                    <div class="acts">
                                        <button class="del" on:click|stopPropagation={() => removeTrend(i)}>🗑️</button>
                                    </div>
                                </div>
                                {#if !collapsedItems.trends[i]}
                                    <div class="item-body" transition:slide>
                                        <label>Nome: <input type="text" bind:value={trend.name}></label>
                                        <label>Subtítulo: <input type="text" bind:value={trend.sub}></label>
                                        <label>Imagem URL: <input type="text" bind:value={trend.image}></label>
                                        <label>Hell Quote: <input type="text" bind:value={trend.hellQuote}></label>
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    {/if}
                </div>
            </aside>

            <div class="editor-preview custom-scroll">
                <div class="preview-label">PREVIEW AO VIVO</div>
                <svelte:self {data} mode="view" />
            </div>
        </div>
    {/if}

    {#if mode === 'view'}
        <div class="dh-view-container">
            
            <header class="dh-header">
                <div class="dh-title">DATA HELL</div>
                
                <div class="dh-meta">
                    <div class="meta-row">EDIÇÃO {data.edition}</div>
                    <div class="meta-row">DATA: {data.date}</div>
                    <div class="meta-row">STATUS: <span class="status-txt">{data.status}</span></div>
                    
                    {#if data.audio}
                        <div class="audio-toggle" on:click={toggleLocalMute}>
                            {#if isMuted}
                                <span style="opacity:0.5">🔇 OFF</span>
                            {:else}
                                <span class="beat-anim">🔊 ON</span>
                            {/if}
                        </div>
                    {/if}
                </div>
            </header>

            <div class="dh-grid">
                
                <main class="dh-column">
                    {#each data.cards as card, i}
                        <div class="dh-card" 
                             class:expanded={expandedCardIndex === i}
                             style="background-image: url('{card.image}');">
                            
                            {#if card.hellQuote}
                                <button class="hell-btn" on:click|stopPropagation={() => openHell('card', i)}>🔥</button>
                            {/if}

                            <div class="dh-overlay" on:click={() => toggleCardView(i)}>
                                <h2 class="dh-card-title">{card.title}</h2>
                                <div class="dh-card-text">
                                    {@html card.text}
                                </div>
                            </div>
                        </div>
                    {/each}
                </main>

                <aside class="dh-sidebar">
                    <div class="dh-data-box">
                        {#each data.stats as stat, i}
                            <div class="dh-stat-row">
                                <div class="dh-stat-label">
                                    {stat.label} 
                                    {#if stat.tooltip}<span class="qm">[?]</span><span class="dh-tooltip">{stat.tooltip}</span>{/if}
                                </div>
                                <div class="dh-stat-value">
                                    {stat.value}
                                    {#if stat.hellQuote}
                                        <button class="hell-btn-mini" on:click={() => openHell('stat', i)}>🔥</button>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>

                    <div class="dh-trends-section">
                        <div class="dh-trend-title">TENDÊNCIAS</div>
                        {#each data.trends as trend, i}
                            <div class="dh-trend-item">
                                <img src={trend.image || 'https://placehold.co/100/222/fff?text=?'} class="dh-trend-img" alt="Item">
                                <div>
                                    <strong style="color:var(--theme-color); display:block">{trend.name}</strong>
                                    <small style="color:#aaa">{trend.sub}</small>
                                </div>
                                {#if trend.hellQuote}
                                    <button class="hell-btn static" on:click={() => openHell('trend', i)}>🔥</button>
                                {/if}
                            </div>
                        {/each}
                    </div>
                </aside>
            </div>

            {#if activeModal}
                <div class="hell-modal" transition:fade on:click={() => activeModal = null}>
                    <div class="hell-content" transition:scale on:click|stopPropagation>
                        <div class="hell-avatar">
                            <img src="https://placehold.co/100/ffcc00/000?text=HELL" alt="Hell Avatar">
                        </div>
                        <p class="hell-quote">"{currentHellQuote}"</p>
                        <button class="hell-close" on:click={() => activeModal = null}>[ CALA A BOCA, HELL ]</button>
                    </div>
                </div>
            {/if}
        </div>
    {/if}

</div>

<style>
    /* VARIÁVEIS DE TEMA DINÂMICAS */
    .dh-root {
        --bg-color: #050505;
        --card-bg: #111;
        --hell-color: #ffcc00;
        
        /* HERDADAS DO PROPS */
        /* --theme-color e --matrix-color são injetadas inline pelo Svelte */
        
        font-family: 'Segoe UI', Roboto, sans-serif;
        background-color: var(--bg-color);
        color: #eee;
        height: 100%;
        position: relative;
    }

    /* --- ESTILOS DO EDITOR --- */
    .editor-layout { display: flex; height: 100%; overflow: hidden; background: #111; }
    
    .editor-sidebar { 
        width: 350px; background: #181818; border-right: 1px solid #333; 
        display: flex; flex-direction: column; overflow-y: auto; flex-shrink: 0;
    }
    
    .editor-tabs { display: flex; border-bottom: 1px solid #333; }
    .editor-tabs button { 
        flex: 1; background: #222; border: none; color: #888; padding: 10px; cursor: pointer; font-size: 0.8rem; font-weight: bold;
    }
    .editor-tabs button.active { background: var(--theme-color); color: #000; }

    .editor-content { padding: 15px; }
    .editor-content h3 { color: var(--theme-color); border-bottom: 1px solid #333; padding-bottom: 5px; margin-top: 0; display: flex; justify-content: space-between; }
    
    .editor-content label { display: flex; flex-direction: column; font-size: 0.8rem; color: #aaa; margin-bottom: 10px; }
    .editor-content input, .editor-content textarea { 
        background: #000; border: 1px solid #444; color: #fff; padding: 6px; margin-top: 4px; font-family: monospace; 
    }
    .editor-content input[type="color"] { height: 40px; padding: 0; cursor: pointer; }

    .editor-item { background: #222; border: 1px solid #333; border-radius: 4px; margin-bottom: 8px; overflow: hidden; }
    .item-header { 
        padding: 8px 10px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: #2a2a2a; 
        font-size: 0.85rem; font-weight: bold; color: #ddd;
    }
    .item-header:hover { background: #333; }
    .item-body { padding: 10px; background: #1a1a1a; border-top: 1px solid #333; }
    
    .mini-add { background: var(--theme-color); border: none; color: #000; width: 20px; height: 20px; border-radius: 50%; font-weight: bold; cursor: pointer; }
    .del { background: transparent; border: none; cursor: pointer; color: #ff5555; }

    .editor-preview { flex: 1; padding: 20px; background: #000; overflow-y: auto; position: relative; }
    .preview-label { 
        position: absolute; top: 10px; right: 10px; background: var(--theme-color); color: #000; 
        padding: 2px 8px; font-size: 0.7rem; font-weight: bold; opacity: 0.5; pointer-events: none; z-index: 100;
    }

    /* --- ESTILOS DE VISUALIZAÇÃO (VIEW MODE) --- */
    .dh-view-container { max-width: 1400px; margin: 0 auto; height: 100%; overflow-y: auto; padding: 20px; padding-bottom: 100px; }

    .dh-header { border-bottom: 2px solid var(--theme-color); display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 15px; margin-bottom: 20px; }
    .dh-title { font-family: 'Impact', sans-serif; font-size: 3rem; line-height: 0.8; text-transform: uppercase; background: linear-gradient(90deg, #fff, var(--theme-color)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .dh-meta { font-family: 'Courier New', monospace; color: var(--matrix-color); text-align: right; font-size: 0.9rem; }
    .status-txt { color: #ff3333; font-weight: bold; }

    /* BOTÃO DE AUDIO NO HEADER */
    .audio-toggle {
        margin-top: 5px; cursor: pointer; font-weight: bold; color: var(--theme-color); border: 1px solid var(--theme-color);
        padding: 2px 8px; font-size: 0.8rem; display: inline-block; text-align: center;
    }
    .audio-toggle:hover { background: var(--theme-color); color: #000; }
    .beat-anim { animation: pulse-audio 1s infinite; display: inline-block; }
    @keyframes pulse-audio { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }

    .dh-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
        /* 1. Estilizar a barra para ficar 'Cyberpunk' e não cinza padrão */
    .dh-card-text::-webkit-scrollbar {
        width: 8px; /* Largura fina */
    }
    
    .dh-card-text::-webkit-scrollbar-track {
        background: #0a0a0a; /* Fundo do trilho escuro */
    }
    
    .dh-card-text::-webkit-scrollbar-thumb {
        background-color: var(--theme-color); /* A cor do 'puxador' será a cor do tema */
        border-radius: 4px;
        border: 1px solid #000;
    }

    /* 2. Forçar a rolagem quando a notícia estiver aberta */
    /* Isso garante que se o texto for gigante, a barra aparece */
    #news-1:checked ~ .dh-grid .news-1-target .dh-card-text,
    #news-2:checked ~ .dh-grid .news-2-target .dh-card-text,
    #news-3:checked ~ .dh-grid .news-3-target .dh-card-text {
        overflow-y: auto !important; /* Força a barra vertical */
        padding-right: 10px; /* Dá um respiro pro texto não colar na barra */
    }

    
    .dh-column { display: flex; flex-direction: column; gap: 20px; }
    .dh-card {
        position: relative; min-height: 180px; border-radius: 8px; overflow: hidden;
        background-size: cover; background-position: center; border: 1px solid #333;
        cursor: pointer; transition: all 0.5s ease;
    }
    .dh-card:hover { border-color: #666; box-shadow: 0 5px 15px rgba(0,0,0,0.5); }
    .dh-card.expanded { min-height: 500px; border-color: var(--theme-color); box-shadow: 0 0 20px rgba(var(--theme-color), 0.3); }
    
    .dh-overlay {
        background: linear-gradient(to top, rgba(0,0,0,0.98) 10%, rgba(0,0,0,0.4) 100%);
        height: 100%; width: 100%; padding: 25px;
        display: flex; flex-direction: column; justify-content: flex-end;
    }
    .dh-card-title { font-family: 'Impact', sans-serif; font-size: 2.2rem; color: white; text-shadow: 2px 2px 0 #000; margin: 0; line-height: 1; }
    .dh-card-text { 
        max-height: 0; opacity: 0; overflow: hidden; transition: all 0.5s ease; 
        font-size: 1.1rem; line-height: 1.6; border-top: 1px solid var(--theme-color); color: #ddd;
    }
    .dh-card.expanded .dh-card-text { 
        /* Use vh para garantir que caiba na tela do jogador, ou aumente para 1000px */
        max-height: 60vh; 
        opacity: 1; 
        margin-top: 15px; 
        padding-top: 20px;
        
        /* ISSO AQUI QUE RESOLVE O PROBLEMA: */
        overflow-y: auto; 
        pointer-events: auto;
    }
    /* SIDEBAR VIEW */
    .dh-sidebar { display: flex; flex-direction: column; gap: 20px; }
    .dh-data-box { background: #080808; border: 1px solid var(--matrix-color); padding: 15px; font-family: 'Courier New', monospace; }
    .dh-stat-row { margin-bottom: 12px; border-bottom: 1px dashed #333; padding-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
    .dh-stat-label { font-size: 0.8rem; color: var(--matrix-color); position: relative; cursor: help; }
    .dh-stat-value { font-size: 1.4rem; color: #fff; font-weight: bold; display: flex; align-items: center; gap: 5px; }
    
    .qm { opacity: 0.5; font-size: 0.7rem; cursor: help; margin-left: 5px; }
    .dh-tooltip { visibility: hidden; background: #222; color: #fff; position: absolute; bottom: 100%; right: 0; width: 180px; font-size: 0.75rem; padding: 8px; opacity: 0; transition: 0.2s; border: 1px solid var(--matrix-color); z-index: 10; pointer-events: none; box-shadow: 0 5px 15px #000; }
    .dh-stat-label:hover .dh-tooltip { visibility: visible; opacity: 1; pointer-events: auto; }

    .dh-trend-title { font-family: 'Impact'; font-size: 1.5rem; margin-bottom: 10px; color: #fff; border-bottom: 2px solid #333; }
    .dh-trend-item { background: #151515; border-left: 3px solid var(--theme-color); padding: 10px; display: flex; gap: 10px; align-items: center; margin-bottom: 10px; }
    .dh-trend-img { width: 50px; height: 50px; object-fit: cover; background: #333; border: 1px solid #444; }

    /* HELL SYSTEM */
    .hell-btn { position: absolute; top: 15px; right: 15px; font-size: 1.8rem; cursor: pointer; z-index: 20; filter: grayscale(100%); transition: 0.2s; background: transparent; border: none; }
    .hell-btn:hover { transform: scale(1.2) rotate(10deg); filter: grayscale(0%); text-shadow: 0 0 10px orange; }
    .hell-btn.static { position: static; margin-left: auto; font-size: 1.2rem; }
    .hell-btn-mini { font-size: 1rem; background: none; border: none; cursor: pointer; filter: grayscale(100%); transition: 0.2s; }
    .hell-btn-mini:hover { filter: grayscale(0%); transform: scale(1.2); }

    .hell-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 9999; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(5px); }
    .hell-content { background: #111; border: 4px solid var(--hell-color); padding: 40px; max-width: 500px; width: 90%; transform: rotate(-2deg); box-shadow: 15px 15px 0 var(--hell-color); position: relative; text-align: center; }
    .hell-avatar { width: 100px; height: 100px; border-radius: 50%; border: 4px solid var(--hell-color); position: absolute; top: -50px; left: calc(50% - 50px); background: black; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.5); }
    .hell-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .hell-quote { font-family: 'Courier New', monospace; font-weight: bold; font-size: 1.3rem; color: var(--hell-color); margin-top: 30px; line-height: 1.4; }
    .hell-close { display: inline-block; margin-top: 25px; background: var(--hell-color); color: #000; padding: 8px 20px; font-weight: bold; cursor: pointer; text-transform: uppercase; border: 2px solid #000; font-size: 0.9rem; transition: 0.2s; }
    .hell-close:hover { background: #fff; transform: scale(1.05); }

    /* Custom Scrollbar para Sidebar e Preview */
    .custom-scroll::-webkit-scrollbar { width: 6px; background: #111; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
</style>