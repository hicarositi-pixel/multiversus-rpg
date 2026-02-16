<script>
    import { slide, fade, scale } from 'svelte/transition';
    import { onMount, onDestroy } from 'svelte';

    // Props
    export let data = {
        // Metadados
        edition: "#0",
        date: "01/01/2077",
        status: "CRÍTICO",
        audio: "", 
        coverImage: "", // NOVA: Imagem de Capa
        themeColor: "#ff0055", // Cor Principal
        matrixColor: "#00ff41", // Cor Secundária
        
        // Conteúdo
        cards: [],
        stats: [],
        trends: []
    };
    export let mode = 'view'; // 'view' | 'edit'

    // Estados Locais
    let expandedCardIndex = -1; 
    let activeModal = null;     
    let hellAnim = ''; // 'angry', 'neutral', 'cinema' ou ''
    
    // --- ESTADOS DE ÁUDIO ---
    let localAudioPlayer = null; // Para MP3
    let ytPlayer = null;         // Para YouTube API
    let audioMode = null;        // 'mp3' ou 'yt'
    let isPlaying = false;
    let currentVolume = 0.5;     // Volume de 0.0 a 1.0
    const uniqueAudioId = "dh-audio-" + Math.random().toString(36).substr(2, 9);

    // Estados de Edição
    let editTab = 'meta'; 
    let collapsedItems = { cards: {}, stats: {}, trends: {} }; 

    // --- CICLO DE VIDA DO ÁUDIO ---
    onMount(() => {
        if (mode === 'view' && data.audio) {
            playLocalAudio(data.audio);
        }
    });

    onDestroy(() => {
        stopLocalAudio();
    });

    // --- CONTROLE MESTRE DE ÁUDIO (YOUTUBE & MP3) ---
    function playLocalAudio(url) {
        if (!url) return;
        stopLocalAudio();
        isPlaying = true;

        const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/user\/\S+|\/ytscreeningroom\?v=))([\w\-]{10,12})\b/);

        if (ytMatch && ytMatch[1]) {
            // É YOUTUBE
            audioMode = 'yt';
            let videoId = ytMatch[1];
            
            // Cria a div invisível para a API do YT
            const div = document.createElement('div');
            div.id = uniqueAudioId;
            div.style.position = 'absolute';
            div.style.left = '-9999px';
            div.style.width = '1px'; div.style.height = '1px';
            document.body.appendChild(div);

            // Carrega API do YT com segurança
            if (window.YT && window.YT.Player) {
                createYtPlayer(videoId);
            } else {
                if (!window.ytCallbacks) window.ytCallbacks = [];
                window.ytCallbacks.push(() => createYtPlayer(videoId));
                
                if (!document.getElementById('yt-api-script')) {
                    const tag = document.createElement('script');
                    tag.id = 'yt-api-script';
                    tag.src = "https://www.youtube.com/iframe_api";
                    document.head.appendChild(tag);
                    window.onYouTubeIframeAPIReady = () => {
                        window.ytCallbacks.forEach(cb => cb());
                    };
                }
            }
        } else {
            // É MP3 / ARQUIVO DIRETO
            audioMode = 'mp3';
            localAudioPlayer = new Audio(url);
            localAudioPlayer.loop = true;
            localAudioPlayer.volume = currentVolume;
            localAudioPlayer.play().catch(e => {
                console.error("Autoplay bloqueado pelo navegador:", e);
                isPlaying = false; // Reseta o ícone se for bloqueado
            });
        }
    }

    function createYtPlayer(videoId) {
        ytPlayer = new window.YT.Player(uniqueAudioId, {
            videoId: videoId,
            playerVars: { autoplay: 1, loop: 1, playlist: videoId, controls: 0 },
            events: {
                onReady: (e) => {
                    e.target.setVolume(currentVolume * 100);
                    if (isPlaying) e.target.playVideo();
                }
            }
        });
    }

    function stopLocalAudio() {
        if (localAudioPlayer) {
            localAudioPlayer.pause();
            localAudioPlayer = null;
        }
        if (ytPlayer && ytPlayer.destroy) {
            ytPlayer.destroy();
            ytPlayer = null;
        }
        const ytNode = document.getElementById(uniqueAudioId);
        if (ytNode) ytNode.remove();
        isPlaying = false;
        audioMode = null;
    }

    // Controle de Play/Pause Unificado
    function togglePlayPause() {
        isPlaying = !isPlaying;
        if (audioMode === 'yt' && ytPlayer && ytPlayer.getPlayerState) {
            if (isPlaying) ytPlayer.playVideo();
            else ytPlayer.pauseVideo();
        } else if (audioMode === 'mp3' && localAudioPlayer) {
            if (isPlaying) localAudioPlayer.play();
            else localAudioPlayer.pause();
        }
    }

    // Controle de Volume Unificado
    function handleVolumeChange(e) {
        currentVolume = e.target.value;
        if (audioMode === 'yt' && ytPlayer && ytPlayer.setVolume) {
            ytPlayer.setVolume(currentVolume * 100); // YT usa 0 a 100
        } else if (audioMode === 'mp3' && localAudioPlayer) {
            localAudioPlayer.volume = currentVolume; // MP3 usa 0 a 1.0
        }
    }

    // --- FUNÇÕES DE EDIÇÃO ---
    function addCard() { data.cards = [...data.cards, { title: "NOVA MANCHETE", text: "<p>Escreva aqui...</p>", image: "https://placehold.co/800x400/111/ff0055", hellQuote: "" }]; }
    function removeCard(i) { data.cards = data.cards.filter((_, idx) => idx !== i); }
    function addStat() { data.stats = [...data.stats, { label: "DADO", value: "000", tooltip: "Info...", hellQuote: "" }]; }
    function removeStat(i) { data.stats = data.stats.filter((_, idx) => idx !== i); }
    function addTrend() { data.trends = [...data.trends, { name: "ITEM", sub: "Detalhe", image: "", hellQuote: "" }]; }
    function removeTrend(i) { data.trends = data.trends.filter((_, idx) => idx !== i); }
    function toggleEditCollapse(type, index) { collapsedItems[type][index] = !collapsedItems[type][index]; }

    // --- FUNÇÕES DE VISUALIZAÇÃO ---
    function toggleCardView(i) {
        if (mode === 'edit') return;
        expandedCardIndex = expandedCardIndex === i ? -1 : i;
    }

    function openHell(type, index) {
        if (mode === 'edit') return;
        activeModal = { type, index };
        hellAnim = ''; 
    }

    function respondHell(type) {
        hellAnim = type;
        const delay = type === 'neutral' ? 300 : 1000;
        setTimeout(() => {
            activeModal = null;
            hellAnim = '';
        }, delay);
    }

    $: currentHellQuote = activeModal 
        ? (activeModal.type === 'card' ? data.cards[activeModal.index].hellQuote 
           : activeModal.type === 'stat' ? data.stats[activeModal.index].hellQuote
           : data.trends[activeModal.index].hellQuote)
        : "";

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
                        
                        <label><span style="color:var(--theme-color)">Edição (Topo):</span> <input type="text" bind:value={data.edition}></label>
                        <label><span style="color:var(--theme-color)">Data / Dia Atual:</span> <input type="text" bind:value={data.date} placeholder="Ex: 01/06/01"></label>
                        <label>Status do Mundo: <input type="text" bind:value={data.status}></label>

                        <div class="highlight-box">
                            <label><strong>🖼️ Imagem de Capa (Hero Banner):</strong>
                                <input type="text" bind:value={data.coverImage} placeholder="Cole a URL da imagem destaque...">
                            </label>
                            
                            <label style="margin-top: 10px;"><strong>🎵 Música (YouTube/MP3):</strong>
                                <input type="text" bind:value={data.audio} placeholder="Cole o link do áudio/vídeo...">
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
        <div class="dh-view-container custom-scroll">
            
            {#if data.coverImage}
                <div class="dh-hero-banner" style="background-image: url('{data.coverImage}')">
                    <div class="hero-overlay"></div>
                </div>
            {/if}

            <header class="dh-header" class:with-banner={data.coverImage}>
                <div class="dh-title">DATA HELL</div>
                
                <div class="dh-meta">
                    <div class="meta-row">EDIÇÃO {data.edition}</div>
                    <div class="meta-row">DATA: {data.date}</div>
                    <div class="meta-row">STATUS: <span class="status-txt">{data.status}</span></div>
                    
                    {#if data.audio}
                        <div class="audio-panel">
                            <button class="play-btn" on:click={togglePlayPause} title={isPlaying ? 'Pausar' : 'Tocar'}>
                                <i class="fas {isPlaying ? 'fa-pause' : 'fa-play'}"></i>
                            </button>
                            <input type="range" class="vol-slider" min="0" max="1" step="0.05" 
                                   bind:value={currentVolume} on:input={handleVolumeChange} title="Volume">
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
                                <div class="dh-card-text custom-scroll">
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
                <div class="hell-modal {hellAnim}" transition:fade>
                    <div class="hell-content" transition:scale on:click|stopPropagation>
                        <div class="hell-avatar">
                            <img src="https://placehold.co/100/ffcc00/000?text=HELL" alt="Hell Avatar">
                        </div>
                        
                        <p class="hell-quote">"{currentHellQuote}"</p>
                        
                        <div class="hell-actions">
                            <button class="h-btn angry" on:click={() => respondHell('angry')}>
                                CALA A BOCA, HELL
                            </button>
                            <button class="h-btn neutral" on:click={() => respondHell('neutral')}>
                                TANTO FAZ
                            </button>
                            <button class="h-btn cinema" on:click={() => respondHell('cinema')}>
                                ABSOLUTE CINEMA
                            </button>
                        </div>

                        {#if hellAnim === 'cinema'}
                            <div class="vfx-cinema">
                                <span class="sparkle s1">✨</span>
                                <span class="sparkle s2">🔥</span>
                                <span class="sparkle s3">✨</span>
                                <span class="sparkle s4">💥</span>
                            </div>
                        {/if}
                    </div>
                </div>
            {/if}
        </div>
    {/if}

</div>

<style>
    .dh-root {
        --bg-color: #050505; --card-bg: #111; --hell-color: #ffcc00;
        font-family: 'Segoe UI', Roboto, sans-serif; background-color: var(--bg-color); color: #eee; height: 100%; position: relative;
    }

    /* SCROLLBAR CYBERPUNK */
    .custom-scroll::-webkit-scrollbar { width: 8px; background: #0a0a0a; }
    .custom-scroll::-webkit-scrollbar-thumb { background-color: var(--theme-color); border-radius: 4px; border: 1px solid #000; }

    /* --- EDITOR STYLES --- */
    .editor-layout { display: flex; height: 100%; overflow: hidden; background: #111; }
    .editor-sidebar { width: 350px; background: #181818; border-right: 1px solid #333; display: flex; flex-direction: column; overflow-y: auto; flex-shrink: 0; }
    .editor-tabs { display: flex; border-bottom: 1px solid #333; }
    .editor-tabs button { flex: 1; background: #222; border: none; color: #888; padding: 10px; cursor: pointer; font-size: 0.8rem; font-weight: bold; }
    .editor-tabs button.active { background: var(--theme-color); color: #000; }
    
    .editor-content { padding: 15px; }
    .editor-content h3 { color: var(--theme-color); border-bottom: 1px solid #333; padding-bottom: 5px; margin-top: 0; display: flex; justify-content: space-between; }
    .editor-content label { display: flex; flex-direction: column; font-size: 0.8rem; color: #aaa; margin-bottom: 10px; }
    .editor-content input, .editor-content textarea { background: #000; border: 1px solid #444; color: #fff; padding: 6px; margin-top: 4px; font-family: monospace; }
    .editor-content input[type="color"] { height: 40px; padding: 0; cursor: pointer; }
    
    .highlight-box { background: rgba(255,255,255,0.05); padding: 10px; border-left: 3px solid var(--matrix-color); margin: 15px 0; border-radius: 0 4px 4px 0; }
    
    .editor-item { background: #222; border: 1px solid #333; border-radius: 4px; margin-bottom: 8px; overflow: hidden; }
    .item-header { padding: 8px 10px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: #2a2a2a; font-size: 0.85rem; font-weight: bold; color: #ddd; }
    .item-header:hover { background: #333; }
    .item-body { padding: 10px; background: #1a1a1a; border-top: 1px solid #333; }
    .mini-add { background: var(--theme-color); border: none; color: #000; width: 20px; height: 20px; border-radius: 50%; font-weight: bold; cursor: pointer; }
    .del { background: transparent; border: none; cursor: pointer; color: #ff5555; }
    
    .editor-preview { flex: 1; padding: 20px; background: #000; overflow-y: auto; position: relative; }
    .preview-label { position: absolute; top: 10px; right: 10px; background: var(--theme-color); color: #000; padding: 2px 8px; font-size: 0.7rem; font-weight: bold; opacity: 0.5; pointer-events: none; z-index: 100; }

    /* --- VIEW STYLES (O JORNAL) --- */
    .dh-view-container { max-width: 1400px; margin: 0 auto; height: 100%; overflow-y: auto; padding: 20px; padding-bottom: 100px; position: relative; }
    
    /* IMAGEM DE CAPA (HERO) */
    .dh-hero-banner { width: 100%; height: 300px; background-size: cover; background-position: center; border-radius: 8px 8px 0 0; position: relative; border: 1px solid #333; border-bottom: none; }
    .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to top, var(--bg-color) 0%, transparent 100%); }

    /* HEADER */
    .dh-header { border-bottom: 2px solid var(--theme-color); display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 15px; margin-bottom: 20px; }
    .dh-header.with-banner { margin-top: -60px; position: relative; z-index: 10; padding-left: 20px; padding-right: 20px; }
    .dh-title { font-family: 'Impact', sans-serif; font-size: 4rem; line-height: 0.8; text-transform: uppercase; background: linear-gradient(90deg, #fff, var(--theme-color)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: 0 5px 15px rgba(0,0,0,0.8); }
    .dh-meta { font-family: 'Courier New', monospace; color: var(--matrix-color); text-align: right; font-size: 0.95rem; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 4px; border: 1px solid #333; }
    .status-txt { color: #ff3333; font-weight: bold; animation: blink 2s infinite; }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

    /* AUDIO PLAYER UI */
    .audio-panel { display: flex; align-items: center; justify-content: flex-end; gap: 10px; margin-top: 8px; border-top: 1px dashed #444; padding-top: 8px; }
    .play-btn { background: none; border: none; color: var(--theme-color); cursor: pointer; font-size: 1.2rem; transition: 0.2s; }
    .play-btn:hover { color: #fff; transform: scale(1.1); text-shadow: 0 0 10px var(--theme-color); }
    
    .vol-slider { -webkit-appearance: none; width: 80px; height: 4px; background: #333; outline: none; border-radius: 2px; }
    .vol-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; background: var(--theme-color); cursor: pointer; border-radius: 50%; box-shadow: 0 0 5px var(--theme-color); }

    /* GRID & CARDS */
    .dh-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
    .dh-column { display: flex; flex-direction: column; gap: 20px; }
    
    .dh-card { position: relative; min-height: 180px; border-radius: 8px; overflow: hidden; background-size: cover; background-position: center; border: 1px solid #333; cursor: pointer; transition: all 0.5s ease; }
    .dh-card:hover { border-color: #666; box-shadow: 0 5px 15px rgba(0,0,0,0.5); }
    .dh-card.expanded { min-height: 550px; border-color: var(--theme-color); box-shadow: 0 0 20px rgba(var(--theme-color), 0.3); }
    
    .dh-overlay { background: linear-gradient(to top, rgba(0,0,0,0.98) 15%, rgba(0,0,0,0.4) 100%); height: 100%; width: 100%; padding: 25px; display: flex; flex-direction: column; justify-content: flex-end; }
    .dh-card-title { font-family: 'Impact', sans-serif; font-size: 2.2rem; color: white; text-shadow: 2px 2px 0 #000; margin: 0; line-height: 1.1; }
    
    /* SCROLL NO TEXTO DA NOTÍCIA */
    .dh-card-text { max-height: 0; opacity: 0; overflow: hidden; transition: all 0.5s ease; font-size: 1.1rem; line-height: 1.6; border-top: 1px solid var(--theme-color); color: #ddd; }
    .dh-card.expanded .dh-card-text { 
        max-height: 50vh; opacity: 1; margin-top: 15px; padding-top: 20px; 
        overflow-y: auto; pointer-events: auto; padding-right: 10px;
    }

    /* SIDEBAR VIEW */
    .dh-sidebar { display: flex; flex-direction: column; gap: 20px; }
    .dh-data-box { background: #080808; border: 1px solid var(--matrix-color); padding: 15px; font-family: 'Courier New', monospace; border-radius: 4px; }
    .dh-stat-row { margin-bottom: 12px; border-bottom: 1px dashed #333; padding-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
    .dh-stat-label { font-size: 0.8rem; color: var(--matrix-color); position: relative; cursor: help; }
    .dh-stat-value { font-size: 1.4rem; color: #fff; font-weight: bold; display: flex; align-items: center; gap: 5px; }
    
    .qm { opacity: 0.5; font-size: 0.7rem; cursor: help; margin-left: 5px; }
    .dh-tooltip { visibility: hidden; background: #222; color: #fff; position: absolute; bottom: 100%; right: 0; width: 180px; font-size: 0.75rem; padding: 8px; opacity: 0; transition: 0.2s; border: 1px solid var(--matrix-color); z-index: 10; pointer-events: none; box-shadow: 0 5px 15px #000; }
    .dh-stat-label:hover .dh-tooltip { visibility: visible; opacity: 1; pointer-events: auto; }

    .dh-trend-title { font-family: 'Impact'; font-size: 1.5rem; margin-bottom: 10px; color: #fff; border-bottom: 2px solid #333; }
    .dh-trend-item { background: #151515; border-left: 3px solid var(--theme-color); padding: 10px; display: flex; gap: 10px; align-items: center; margin-bottom: 10px; border-radius: 0 4px 4px 0; }
    .dh-trend-img { width: 50px; height: 50px; object-fit: cover; background: #333; border: 1px solid #444; }

    /* --- HELL SYSTEM & VFX --- */
    .hell-btn { position: absolute; top: 15px; right: 15px; font-size: 1.8rem; cursor: pointer; z-index: 20; filter: grayscale(100%); transition: 0.2s; background: transparent; border: none; }
    .hell-btn:hover { transform: scale(1.2) rotate(10deg); filter: grayscale(0%); text-shadow: 0 0 10px orange; }
    .hell-btn.static { position: static; margin-left: auto; font-size: 1.2rem; }
    .hell-btn-mini { font-size: 1rem; background: none; border: none; cursor: pointer; filter: grayscale(100%); transition: 0.2s; }
    .hell-btn-mini:hover { filter: grayscale(0%); transform: scale(1.2); }

    .hell-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 9999; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(5px); transition: 0.5s; }
    .hell-content { background: #111; border: 4px solid var(--hell-color); padding: 40px; max-width: 600px; width: 90%; transform: rotate(-2deg); box-shadow: 15px 15px 0 var(--hell-color); position: relative; text-align: center; transition: 0.5s; }
    .hell-avatar { width: 100px; height: 100px; border-radius: 50%; border: 4px solid var(--hell-color); position: absolute; top: -50px; left: calc(50% - 50px); background: black; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.5); }
    .hell-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .hell-quote { font-family: 'Courier New', monospace; font-weight: bold; font-size: 1.3rem; color: var(--hell-color); margin-top: 30px; line-height: 1.4; margin-bottom: 30px; }

    /* ACTIONS DO MODAL */
    .hell-actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
    .h-btn { padding: 10px 15px; border: 2px solid #000; font-weight: bold; cursor: pointer; text-transform: uppercase; font-family: 'Impact'; letter-spacing: 1px; transition: 0.2s; font-size: 0.9rem; }
    .h-btn:hover { transform: scale(1.1); box-shadow: 0 0 10px currentColor; }
    .h-btn.angry { background: #ff0000; color: #fff; }
    .h-btn.neutral { background: #666; color: #fff; }
    .h-btn.cinema { background: #00ccff; color: #000; border-color: #fff; }

    /* ANIMAÇÕES DO HELL */
    .hell-modal.angry .hell-content { animation: angryShake 0.5s infinite; filter: contrast(1.5) sepia(1) hue-rotate(-50deg) saturate(3); border-color: red; box-shadow: 0 0 50px red; }
    .hell-modal.angry { background: rgba(50, 0, 0, 0.95); }
    @keyframes angryShake { 0%, 100% { transform: translate(2px, 2px) rotate(0deg); } 25% { transform: translate(-2px, -2px) rotate(-5deg); } 50% { transform: translate(2px, -2px) rotate(5deg); } 75% { transform: translate(-2px, 2px) rotate(-5deg); } }

    .hell-modal.cinema .hell-content { animation: cinemaFloat 1s forwards; border-color: #00ccff; box-shadow: 0 0 50px #00ccff, inset 0 0 20px #fff; background: #001133; }
    .hell-modal.cinema { background: rgba(0, 10, 30, 0.9); }
    @keyframes cinemaFloat { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-100px) scale(1.2); opacity: 0; filter: blur(5px); } }

    .vfx-cinema { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
    .sparkle { position: absolute; color: #fff; font-size: 20px; animation: sparkleUp 1s linear forwards; opacity: 0; }
    .s1 { left: 10%; animation-delay: 0.1s; } .s2 { left: 80%; animation-delay: 0.2s; font-size: 30px; } .s3 { left: 30%; animation-delay: 0.4s; } .s4 { left: 60%; animation-delay: 0.0s; font-size: 25px; }
    @keyframes sparkleUp { 0% { bottom: 0; opacity: 1; transform: rotate(0); } 100% { bottom: 100%; opacity: 0; transform: rotate(360deg); } }
</style>