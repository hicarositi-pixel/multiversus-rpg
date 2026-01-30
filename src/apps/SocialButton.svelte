<script>
    import { fade } from 'svelte/transition';
    import { onMount } from 'svelte';

    // Estados de posição
    let x = window.innerWidth - 80;
    let y = window.innerHeight - 150;
    let isDragging = false;

    // Função para abrir o Hub
    const toggleHub = () => {
        if (isDragging) return; // Não abre se estiver apenas arrastando
        if (window.NexusHub) {
            if (window.NexusHub.rendered) window.NexusHub.close();
            else window.NexusHub.render(true, { focus: true });
        }
    };

    // Lógica de Arrastar (Móvel)
    function handleMouseDown(e) {
        isDragging = false;
        const startX = e.clientX - x;
        const startY = e.clientY - y;

        function onMouseMove(e) {
            isDragging = true;
            x = e.clientX - startX;
            y = e.clientY - startY;
        }

        function onMouseUp() {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        }

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }
</script>

<div 
    class="social-floating-btn" 
    style="left: {x}px; top: {y}px;"
    on:mousedown={handleMouseDown}
    on:click={toggleHub}
    transition:fade
>
    <div class="inner-hex">
        <i class="fas fa-network-wired"></i>
        <div class="glitch-line"></div>
    </div>
    <div class="pulse-effect"></div>
    <span class="label">NEXUS</span>
</div>

<style>
    .social-floating-btn {
        position: fixed;
        width: 50px;
        height: 50px;
        z-index: 10000; /* Acima de tudo */
        cursor: grab;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        pointer-events: auto !important; /* Força o clique */
        user-select: none;
    }

    .social-floating-btn:active { cursor: grabbing; }

    .inner-hex {
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        border: 2px solid var(--chat-accent, #00ff41);
        color: var(--chat-accent, #00ff41);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        border-radius: 8px; /* Estilo pasta/chip tático */
        box-shadow: 0 0 15px rgba(0, 255, 65, 0.3);
        transition: all 0.2s ease;
        position: relative;
    }

    .social-floating-btn:hover .inner-hex {
        background: var(--chat-accent, #00ff41);
        color: #000;
        box-shadow: 0 0 20px var(--chat-accent, #00ff41);
    }

    .label {
        font-size: 8px;
        font-weight: bold;
        margin-top: 4px;
        letter-spacing: 1px;
        color: #fff;
        text-shadow: 0 0 5px #000;
        font-family: 'Share Tech Mono', monospace;
    }

    /* Efeito de Scanline no botão */
    .glitch-line {
        position: absolute;
        width: 100%;
        height: 2px;
        background: rgba(255, 255, 255, 0.2);
        top: 50%;
        left: 0;
        animation: scan 3s infinite linear;
        pointer-events: none;
    }

    @keyframes scan {
        0% { top: 0%; }
        100% { top: 100%; }
    }

    .pulse-effect {
        position: absolute;
        inset: -5px;
        border: 1px solid var(--chat-accent, #00ff41);
        border-radius: 10px;
        opacity: 0;
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0% { transform: scale(0.95); opacity: 0.5; }
        100% { transform: scale(1.2); opacity: 0; }
    }
</style>