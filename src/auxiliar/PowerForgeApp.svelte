<script>
    import { onMount, createEventDispatcher } from 'svelte';
    import { fade, scale } from 'svelte/transition';
    import { PowerDatabase } from './PowerDatabase.js';
    
    // MÓDULOS ATIVADOS COM SUCESSO!
    import ForgeDatabase from './power/ForgeDatabase.svelte';
    import ForgeStudio from './power/ForgeStudio.svelte';
    import ForgeTerminal from './power/ForgeTerminal.svelte';

    const dispatch = createEventDispatcher();
    const isGM = game.user.isGM;

    // --- ESTADOS DA JANELA ---
    let activeTab = 'database'; // 'database', 'studio', 'terminal'
    let powersArchive = [];
    let isSyncing = false;

    // --- VARIÁVEIS DE TRÂNSITO (Os "Fios" entre as abas) ---
    let powerToEdit = null;
    let powerToTerminal = null;

    // --- CONTROLES DE JANELA (DRAG) ---
    let pos = { x: 150, y: 80 };
    let isDragging = false;

    function startDrag() { isDragging = true; }
    function stopDrag() { isDragging = false; }
    function onMove(e) { if(isDragging) { pos.x += e.movementX; pos.y += e.movementY; } }

    // --- CICLO DE VIDA E DADOS ---
    onMount(async () => {
        await PowerDatabase.init();
        await loadPowers();
    });

    async function loadPowers() {
        isSyncing = true;
        powersArchive = await PowerDatabase.getArchive();
        
        setTimeout(() => {
            isSyncing = false;
        }, 400);
    }

    // --- RECEPTORES DE EVENTO (Escutam a Database) ---
    function handleEdit(event) {
        powerToEdit = event.detail; // Guarda o poder que veio da Database
        activeTab = 'studio';       // Troca a aba para o Studio
    }

    function handleTerminal(event) {
        // Formata o item do jeito que o Terminal está esperando receber
        powerToTerminal = { 
            name: event.detail.name, 
            source: "Data Core", 
            rawItem: event.detail.rawItem 
        };
        activeTab = 'terminal';     // Troca a aba para o Terminal
    }
</script>

<svelte:window on:mousemove={onMove} on:mouseup={stopDrag} />

<div class="forge-shell" style="left: {pos.x}px; top: {pos.y}px;" transition:fade>
    
    <div class="crt-lines"></div>
    <div class="hex-grid"></div>
    <div class="scanline"></div>
    
    <header on:mousedown={startDrag}>
        <div class="sys-info">
            <div class="icon-frame">
                <i class="fas fa-bolt"></i>
            </div>
            <div class="title-text">
                <span class="brand">NEXUS_OS :: POWER_FORGE</span>
                <span class="sub-brand"><span class="blinking-cursor">></span> ACESSO MESTRE ESTABELECIDO</span>
            </div>
        </div>
        <div class="win-controls" on:mousedown|stopPropagation>
            <button class="sync-btn" class:spin={isSyncing} on:click={loadPowers} title="Sincronizar Banco de Dados">
                <i class="fas fa-sync-alt"></i>
            </button>
            <button class="close-btn" on:click={() => dispatch('close')} title="Encerrar Sistema">
                <i class="fas fa-times"></i>
            </button>
        </div>
    </header>

    <nav class="cyber-tabs">
        <button class:active={activeTab === 'database'} on:click={() => activeTab = 'database'}>
            <i class="fas fa-database"></i> DATA_CORE
        </button>
        <button class:active={activeTab === 'studio'} on:click={() => activeTab = 'studio'}>
            <i class="fas fa-hammer"></i> PROTOCOLO DE SÍNTESE
        </button>
        <button class:active={activeTab === 'terminal'} on:click={() => activeTab = 'terminal'}>
            <i class="fas fa-terminal"></i> TERMINAL NEURAL
        </button>
    </nav>

    <main class="forge-viewport">
        {#if activeTab === 'database'}
            <div class="tab-content" in:fade={{duration: 250, delay: 50}}>
                <ForgeDatabase 
                    {powersArchive} 
                    on:refresh={loadPowers} 
                    on:edit={handleEdit}
                    on:sendTerminal={handleTerminal}
                />
            </div>

        {:else if activeTab === 'studio'}
            <div class="tab-content" in:fade={{duration: 250, delay: 50}}>
                <ForgeStudio {powerToEdit} on:save={loadPowers} />
            </div>

        {:else if activeTab === 'terminal'}
            <div class="tab-content" in:fade={{duration: 250, delay: 50}}>
                <ForgeTerminal loadedItem={powerToTerminal} on:compile={loadPowers} />
            </div>
        {/if}
    </main>

    <footer>
        <div class="status-line">
            <span class="led" class:syncing={isSyncing}></span> 
            {#if isSyncing}
                ATUALIZANDO BLOCOS DE DADOS...
            {:else}
                {powersArchive.length} PADRÕES DE PODER ARQUIVADOS E PRONTOS
            {/if}
        </div>
        <div class="deco-corner"></div>
    </footer>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

    :root {
        --forge-color: #00d4ff;
        --forge-dark: #0088aa;
        --forge-bg: #030a14;
    }

    .forge-shell {
        position: fixed; width: 1050px; height: 750px;
        background: var(--forge-bg);
        border: 1px solid var(--forge-color);
        box-shadow: 0 0 40px rgba(0,0,0,0.9), 0 0 15px rgba(0, 212, 255, 0.2);
        display: flex; flex-direction: column;
        resize: both; overflow: hidden;
        font-family: 'Share Tech Mono', monospace;
        color: var(--forge-color);
        z-index: 25000;
        clip-path: polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%);
    }

    .hex-grid {
        position: absolute; inset: 0; pointer-events: none; z-index: -1;
        background-image: radial-gradient(var(--forge-color) 1px, transparent 1px);
        background-size: 30px 30px; opacity: 0.05;
    }
    .crt-lines {
        position: absolute; inset: 0; pointer-events: none; z-index: 100;
        background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%);
        background-size: 100% 4px; opacity: 0.6;
    }
    .scanline {
        position: absolute; width: 100%; height: 50px; z-index: 99;
        background: linear-gradient(0deg, transparent 0%, rgba(0, 212, 255, 0.1) 50%, transparent 100%);
        animation: scan 4s linear infinite; pointer-events: none;
    }

    header {
        background: rgba(0, 0, 0, 0.85); padding: 12px 20px;
        border-bottom: 2px solid var(--forge-color);
        display: flex; justify-content: space-between; align-items: center;
        cursor: grab; position: relative; z-index: 101;
    }
    
    .sys-info { display: flex; align-items: center; gap: 15px; }
    .icon-frame { width: 32px; height: 32px; border: 1px solid var(--forge-color); display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: inset 0 0 10px rgba(0, 212, 255, 0.2); }
    .title-text { display: flex; flex-direction: column; }
    .brand { font-size: 18px; letter-spacing: 2px; text-shadow: 0 0 8px var(--forge-color); color: #fff; font-weight: bold;}
    .sub-brand { font-size: 10px; color: var(--forge-dark); letter-spacing: 1px; }
    .blinking-cursor { animation: blink 1s infinite; color: var(--forge-color); }
    
    .win-controls { display: flex; gap: 8px; }
    .win-controls button {
        background: transparent; border: 1px solid var(--forge-dark); color: var(--forge-color);
        font-family: inherit; font-size: 14px; cursor: pointer; width: 32px; height: 32px;
        display: flex; align-items: center; justify-content: center; border-radius: 4px;
        transition: 0.2s;
    }
    .win-controls button:hover { background: var(--forge-color); color: #000; box-shadow: 0 0 15px var(--forge-color); border-color: var(--forge-color); }
    .close-btn:hover { background: #ff3333 !important; color: #fff !important; border-color: #ff3333 !important; box-shadow: 0 0 15px #ff3333 !important;}
    .sync-btn.spin i { animation: spin 1s infinite linear; }

    .cyber-tabs { 
        display: flex; background: rgba(0,0,0,0.6); 
        border-bottom: 1px solid #111; z-index: 101; position: relative;
    }
    .cyber-tabs button {
        flex: 1; background: transparent; border: none; border-right: 1px solid #222; border-bottom: 2px solid transparent;
        color: #555; padding: 15px; cursor: pointer; font-family: inherit; font-size: 14px; font-weight: bold;
        transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 10px;
    }
    .cyber-tabs button.active {
        color: #fff;
        background: linear-gradient(180deg, rgba(0, 212, 255, 0.1), transparent);
        border-bottom: 2px solid var(--forge-color);
        text-shadow: 0 0 8px var(--forge-color);
    }
    .cyber-tabs button:hover:not(.active) { color: var(--forge-color); background: rgba(255,255,255,0.02); }

    .forge-viewport { flex: 1; position: relative; overflow: hidden; display: flex; flex-direction: column; z-index: 101;}
    .tab-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; height: 100%; }

    footer {
        background: #000; border-top: 1px solid #222; padding: 6px 20px;
        font-size: 11px; display: flex; justify-content: space-between; align-items: center;
        z-index: 101; position: relative; color: #888;
    }
    .led {
        display: inline-block; width: 8px; height: 8px; background: #00ff41;
        border-radius: 50%; margin-right: 8px; box-shadow: 0 0 8px #00ff41;
    }
    .led.syncing { background: #ffaa00; box-shadow: 0 0 8px #ffaa00; animation: blink 0.2s infinite; }
    
    .deco-corner {
        width: 15px; height: 15px; 
        background: linear-gradient(135deg, transparent 50%, var(--forge-color) 50%);
        opacity: 0.5;
    }

    @keyframes scan { 0% { top: -10%; } 100% { top: 110%; } }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
    @keyframes spin { 100% { transform: rotate(360deg); } }
</style>