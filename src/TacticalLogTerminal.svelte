<script>
    import { fade, slide } from 'svelte/transition';
    import { onMount, afterUpdate } from 'svelte';

    export let themeColor = "#00ff41";
    
    // Lista de logs (Pode ser alimentada via eventos globais ou props)
    let logs = [
        { id: 1, time: "00:01", type: 'sys', text: "SISTEMA DE LOGS OPERACIONAL..." },
    ];

    let logContainer;
    let pos = { x: window.innerWidth - 420, y: 100 };
    let isDragging = false;

    // Função para adicionar log externamente
    export function pushLog(text, type = 'info') {
        const time = new Date().toLocaleTimeString('pt-BR', { minute: '2-digit', second: '2-digit' });
        logs = [...logs, { id: Date.now(), time, type, text }];
    }

    function startDrag() { isDragging = true; }
    function stopDrag() { isDragging = false; }
    function onMove(e) { if (isDragging) { pos.x += e.movementX; pos.y += e.movementY; } }

    // Auto-scroll para o fim do log
    afterUpdate(() => {
        if (logContainer) logContainer.scrollTop = logContainer.scrollHeight;
    });

    // Escuta eventos de combate para logar automaticamente
    onMount(() => {
        Hooks.on("multiversus-rpg.logAction", (data) => {
            pushLog(data.text, data.type);
        });
    });
</script>

<svelte:window on:mousemove={onMove} on:mouseup={stopDrag} />

<div class="log-window" 
     style="left: {pos.x}px; top: {pos.y}px; --c-theme: {themeColor}"
     transition:fade>
    
    <header on:mousedown={startDrag}>
        <div class="header-content">
            <i class="fas fa-list-ul"></i>
            <span>TACTICAL_NARRATIVE_LOG</span>
        </div>
        <div class="status-blink">REC</div>
    </header>

    <div class="log-content scroll-area" bind:this={logContainer}>
        {#each logs as log (log.id)}
            <div class="log-entry type-{log.type}" in:slide>
                <span class="timestamp">[{log.time}]</span>
                <span class="message">{@html log.text}</span>
            </div>
        {/each}
        <div class="terminal-cursor">_</div>
    </div>

    <footer>
        <div class="encryption-tag">ENC: ORE_V5_STABLE</div>
        <button class="clear-btn" on:click={() => logs = []}>[CLEAN_LOG]</button>
    </footer>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

    .log-window {
        position: fixed;
        width: 380px;
        height: 500px;
        background: rgba(0, 5, 0, 0.9);
        border: 1px solid var(--c-theme);
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.8);
        display: flex;
        flex-direction: column;
        font-family: 'Share Tech Mono', monospace;
        z-index: 25000;
        overflow: hidden;
    }

    header {
        background: var(--c-theme);
        color: #000;
        padding: 5px 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: bold;
        font-size: 11px;
        cursor: grab;
    }

    .status-blink {
        font-size: 9px;
        background: #000;
        color: #ff3333;
        padding: 2px 6px;
        animation: blink 1s infinite;
    }

    .log-content {
        flex: 1;
        padding: 15px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .log-entry {
        font-size: 12px;
        line-height: 1.4;
        border-left: 2px solid transparent;
        padding-left: 8px;
    }

    .timestamp { color: #666; font-size: 10px; margin-right: 5px; }
    
    /* Cores por tipo de Log */
    .type-sys { color: #aaa; font-style: italic; }
    .type-info { color: var(--c-theme); border-left-color: var(--c-theme); }
    .type-atk { color: #ff3333; border-left-color: #ff3333; }
    .type-def { color: #00ccff; border-left-color: #00ccff; }
    .type-crit { color: #ffcc00; font-weight: bold; text-shadow: 0 0 5px #ffcc00; }

    .terminal-cursor {
        color: var(--c-theme);
        animation: blink 1s infinite;
        margin-top: 10px;
    }

    footer {
        padding: 8px 12px;
        background: #000;
        border-top: 1px solid #222;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .encryption-tag { font-size: 9px; color: #444; }
    .clear-btn {
        background: transparent;
        border: none;
        color: #444;
        font-family: inherit;
        font-size: 9px;
        cursor: pointer;
    }
    .clear-btn:hover { color: #ff3333; }

    .scroll-area::-webkit-scrollbar { width: 3px; }
    .scroll-area::-webkit-scrollbar-thumb { background: var(--c-theme); }

    @keyframes blink { 50% { opacity: 0; } }
</style>