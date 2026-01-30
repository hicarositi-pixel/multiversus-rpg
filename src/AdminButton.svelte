<script>
    import { onMount, onDestroy } from 'svelte';
    import AdminHub from './AdminHub.svelte'; 

    let pos = { x: 50, y: 50 }; 
    let isDragging = false;
    let startPos = { x: 0, y: 0 };
    let hasMoved = false;
    let hubInstance = null;

    $: themeColor = game.user.getFlag("multiversus-rpg", "globalTheme") || "#00ff41";

    function onMouseDown(e) {
        e.stopPropagation(); // BLOQUEIA INTERAÇÃO COM O FUNDO
        isDragging = true;
        hasMoved = false;
        startPos = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    }

    function onWindowMove(e) {
        if (!isDragging) return;
        hasMoved = true;
        pos.x = e.clientX - startPos.x;
        pos.y = e.clientY - startPos.y;
    }

    function onWindowUp() { isDragging = false; }

    function handleClick(e) {
        e.stopPropagation(); // BLOQUEIA INTERAÇÃO COM O FUNDO
        if (hasMoved) return;
        toggleHub();
    }

    function toggleHub() {
        if (hubInstance) {
            closeHub();
        } else {
            hubInstance = new AdminHub({
                target: document.body,
            });
            hubInstance.$on('close', closeHub);
        }
    }

    function closeHub() {
        if (hubInstance) {
            hubInstance.$destroy();
            hubInstance = null;
        }
    }
    
    onDestroy(() => { if (hubInstance) hubInstance.$destroy(); });
</script>

<svelte:window on:mousemove={onWindowMove} on:mouseup={onWindowUp} />

<div class="admin-pc-floater" 
     style="top: {pos.y}px; left: {pos.x}px; --c-theme: {themeColor};">
    
    <div class="pc-case" on:mousedown={onMouseDown} on:click={handleClick}>
        <div class="pc-screen">
            <span class="gm-label">GM</span>
            <div class="scanline"></div>
        </div>
        <div class="pc-base"></div>
        <div class="status-indicator" class:active={hubInstance}></div>
    </div>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

    .admin-pc-floater {
        position: fixed; 
        z-index: 999999;
        width: 60px; height: 60px;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        user-select: none;
        filter: drop-shadow(0 0 10px rgba(0,0,0,0.8));
        transition: transform 0.1s;
        /* NOVO: Torna a área em volta do ícone transparente para cliques */
        pointer-events: none; 
    }

    .pc-case {
        width: 45px; height: 35px;
        background: #111;
        border: 2px solid var(--c-theme);
        border-radius: 4px;
        position: relative;
        display: flex; align-items: center; justify-content: center;
        box-shadow: inset 0 0 10px var(--c-theme);
        cursor: pointer;
        /* NOVO: Reativa o clique apenas no desenho do PC */
        pointer-events: auto; 
    }

    .pc-case:hover { transform: scale(1.1); }
    .pc-case:active { cursor: grabbing; }

    /* ... restante do seu CSS igual ... */
    .pc-screen {
        width: 80%; height: 75%;
        background: #000;
        border: 1px solid var(--c-theme);
        position: relative;
        display: flex; align-items: center; justify-content: center;
        overflow: hidden;
    }

    .gm-label {
        color: var(--c-theme);
        font-family: 'Share Tech Mono', monospace;
        font-weight: bold;
        font-size: 14px;
        text-shadow: 0 0 5px var(--c-theme);
        z-index: 2;
    }

    .pc-base {
        width: 20px; height: 8px;
        background: #111;
        border: 2px solid var(--c-theme);
        border-top: none;
        position: absolute; bottom: -10px;
        clip-path: polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%);
    }

    .scanline {
        position: absolute; width: 100%; height: 2px;
        background: rgba(255, 255, 255, 0.1);
        top: 0; animation: scan 2s infinite linear;
    }

    .status-indicator {
        position: absolute; top: 2px; right: 2px;
        width: 6px; height: 6px;
        background: #333; border-radius: 50%;
        border: 1px solid rgba(0,0,0,0.5);
    }
    .status-indicator.active {
        background: var(--c-theme);
        box-shadow: 0 0 8px var(--c-theme);
        animation: blink 1.5s infinite;
    }

    @keyframes scan { 0% { top: -10%; } 100% { top: 110%; } }
    @keyframes blink { 50% { opacity: 0.3; } }
</style>