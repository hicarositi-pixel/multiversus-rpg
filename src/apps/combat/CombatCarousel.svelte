<script>
    import { flip } from 'svelte/animate';
    import { quintOut } from 'svelte/easing';
    import { createEventDispatcher } from 'svelte';

    export let queue = []; 
    export let activeTurnId = null; // Quem está declarando agora
    export let isGM = false;
    export let phase = 'declaration'; // Para mudar o visual na Fase 2

    const dispatch = createEventDispatcher();

    // --- LÓGICA DE PROGESSO ---
    $: total = queue.length;
    $: readyCount = queue.filter(c => c.ready).length;
    $: progressPercent = total > 0 ? (readyCount / total) * 100 : 0;
    $: allReady = total > 0 && readyCount === total;

    // --- CONTROLES DE TURNO (Mestre) ---
    function nextTurn() {
        if (!queue.length) return;
        const currentIndex = queue.findIndex(c => c.id === activeTurnId);
        let nextIndex = currentIndex + 1;
        if (nextIndex >= queue.length) nextIndex = 0; // Volta pro início se passar do último
        dispatch('setTurn', queue[nextIndex].id);
    }

    function prevTurn() {
        if (!queue.length) return;
        const currentIndex = queue.findIndex(c => c.id === activeTurnId);
        let prevIndex = currentIndex - 1;
        if (prevIndex < 0) prevIndex = queue.length - 1;
        dispatch('setTurn', queue[prevIndex].id);
    }
</script>

<div class="carousel-wrapper">
    
    <div class="c-header">
        <div class="progress-bar">
            <div class="fill" style="width: {progressPercent}%"></div>
        </div>
        
        <div class="c-controls">
            <div class="c-status">
                {#if phase === 'declaration'}
                    <i class="fas fa-bullhorn"></i> FASE DE DECLARAÇÃO: <span class="highlight">{readyCount} / {total}</span> PRONTOS
                {:else}
                    <i class="fas fa-play-circle"></i> FASE DE RESOLUÇÃO EM ANDAMENTO
                {/if}
            </div>

            {#if isGM && phase === 'declaration'}
                <div class="gm-turn-tools">
                    <button class="turn-btn" on:click={prevTurn} title="Voltar Turno"><i class="fas fa-chevron-left"></i></button>
                    <button class="turn-btn" on:click={nextTurn} title="Avançar Turno"><i class="fas fa-chevron-right"></i></button>
                    
                    <button class="start-btn {allReady ? 'glow' : ''}" on:click={() => dispatch('startCombat')} disabled={!allReady && queue.length > 0}>
                        <i class="fas fa-bolt"></i> INICIAR RESOLUÇÃO
                    </button>
                </div>
            {/if}
        </div>
    </div>

<div class="track custom-scroll">
        {#each queue as c, i (c.id)}
            {@const isActive = c.id === activeTurnId}
            
            <div class="portrait-card" 
                 class:ready={c.ready} 
                 class:active={isActive}
                 animate:flip={{duration: 400, easing: quintOut}}
                 on:click={() => dispatch('selectNpc', c.id)}
                 title="Clique para inspecionar no Terminal">
                
                <div class="order-badge" title="Ordem na Fila">{i + 1}</div>
                
                {#if phase === 'declaration'}
                    <div class="stat-badge" title="Sentidos (Define a ordem)"><i class="fas fa-eye"></i> {c.stats?.sense || 1}</div>
                {/if}

                <img src={c.img} alt="Avatar" />
                
                <div class="p-name">{c.name}</div>
                
                {#if isActive && phase === 'declaration'}
                    <div class="active-scanner"></div>
                {/if}
            </div>
        {/each}

        {#if queue.length === 0}
            <div class="empty-track">
                <i class="fas fa-satellite-dish fa-spin"></i> Rede Tática Vazia. Adicione combatentes.
            </div>
        {/if}
    </div>
</div>

<style>
    /* O wrapper relativo e com z-index baixo evita invadir o Grip da janela */
    .carousel-wrapper { position: relative; width: 100%; background: #050508; border-bottom: 2px solid #333; display: flex; flex-direction: column; z-index: 10; }
    
    /* PROGRESSO E STATUS */
    .c-header { display: flex; flex-direction: column; background: #0a0a0f; }
    .progress-bar { width: 100%; height: 4px; background: #222; }
    .progress-bar .fill { height: 100%; background: var(--c-primary, #00ff41); transition: width 0.4s ease-out; box-shadow: 0 0 10px var(--c-primary, #00ff41); }
    
    .c-controls { display: flex; justify-content: space-between; align-items: center; padding: 6px 15px; border-bottom: 1px dashed #333; }
    .c-status { font-size: 11px; font-weight: bold; color: #aaa; display: flex; align-items: center; gap: 8px; letter-spacing: 1px; }
    .c-status i { color: var(--c-primary, #00ff41); }
    .highlight { color: #fff; background: #222; padding: 2px 6px; border-radius: 4px; border: 1px solid #444; }

    /* FERRAMENTAS DO MESTRE NO CARROSSEL */
    .gm-turn-tools { display: flex; gap: 5px; align-items: stretch; }
    .turn-btn { background: #111; border: 1px solid #444; color: #aaa; border-radius: 4px; cursor: pointer; padding: 4px 12px; transition: 0.2s; }
    .turn-btn:hover { background: #222; color: #fff; border-color: #666; }
    
    .start-btn { background: #111; border: 1px solid #00aaff; color: #00aaff; font-family: 'Share Tech Mono', monospace; font-size: 10px; font-weight: bold; padding: 4px 15px; cursor: pointer; border-radius: 4px; transition: 0.3s; display: flex; align-items: center; gap: 6px; }
    .start-btn:disabled { opacity: 0.5; border-color: #444; color: #666; cursor: not-allowed; }
    .start-btn.glow { background: rgba(0, 255, 65, 0.1); border-color: var(--c-primary, #00ff41); color: var(--c-primary, #00ff41); animation: pulseGreen 1.5s infinite; }
    .start-btn.glow:hover { background: var(--c-primary, #00ff41); color: #000; box-shadow: 0 0 15px var(--c-primary, #00ff41); }

    /* TRILHO E CARTÕES */
    .track { display: flex; gap: 12px; overflow-x: auto; padding: 15px 15px 10px 15px; }
    
    .portrait-card {
        position: relative; width: 65px; height: 85px; flex-shrink: 0;
        border: 2px solid #444; border-radius: 6px; overflow: hidden;
        filter: grayscale(0.8) brightness(0.4); transition: all 0.3s; cursor: pointer;
        box-shadow: 0 4px 10px rgba(0,0,0,0.8);
    }
    .portrait-card:hover { filter: grayscale(0.4) brightness(0.8); transform: translateY(-3px); }
    
    /* ESTADOS VISUAIS (A MÁGICA ESTÁ AQUI) */
    .portrait-card.ready { filter: grayscale(0) brightness(1); border-color: #00aaff; box-shadow: 0 0 10px rgba(0,170,255,0.4); }
    
    /* O estado Active agora sobrescreve e brilha junto, mesmo se estiver pronto */
    .portrait-card.active { 
        filter: grayscale(0) brightness(1.3) !important; 
        border-color: #ffaa00 !important; 
        box-shadow: 0 0 15px rgba(255,170,0,0.8) !important; 
        transform: scale(1.08) !important; 
        z-index: 5; 
    }
    
    .portrait-card img { width: 100%; height: 100%; object-fit: cover; }
    
    .order-badge { position: absolute; top: -2px; left: -2px; background: #000; color: #fff; font-weight: bold; font-size: 11px; padding: 2px 6px; border: 1px solid #444; border-radius: 6px 0 6px 0; z-index: 2; }
    .ready .order-badge { background: #00aaff; color: #000; border-color: #00aaff; }
    .active .order-badge { background: #ffaa00 !important; color: #000 !important; border-color: #ffaa00 !important; }

    .stat-badge { position: absolute; top: -2px; right: -2px; background: rgba(0,0,0,0.8); color: #ccc; font-size: 9px; padding: 2px 4px; border-bottom: 1px solid #444; border-left: 1px solid #444; border-radius: 0 6px 0 6px; z-index: 2; }
    
    .p-name { position: absolute; bottom: 0; width: 100%; background: rgba(0,0,0,0.85); color: #fff; font-size: 9px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 4px 2px; font-weight: bold; z-index: 2; border-top: 1px solid rgba(255,255,255,0.1); }
    
    /* Scanner de radar no card ativo */
    .active-scanner { position: absolute; top: 0; left: 0; width: 100%; height: 10px; background: rgba(255,170,0,0.6); box-shadow: 0 0 10px #ffaa00; opacity: 0.8; z-index: 3; animation: scanDown 1.5s linear infinite; pointer-events: none; }
    
    .empty-track { width: 100%; text-align: center; color: #666; font-size: 12px; font-weight: bold; padding: 15px; display: flex; align-items: center; justify-content: center; gap: 10px; }
    
    .custom-scroll::-webkit-scrollbar { height: 6px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #444; border-radius: 4px; }
    .custom-scroll::-webkit-scrollbar-thumb:hover { background: var(--c-primary, #00ff41); }

    @keyframes pulseGreen { 0%, 100% { box-shadow: 0 0 5px rgba(0,255,65,0.4); } 50% { box-shadow: 0 0 20px rgba(0,255,65,0.8); } }
    @keyframes scanDown { 0% { top: -10%; } 100% { top: 100%; } }
</style>