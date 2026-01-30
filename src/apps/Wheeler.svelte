<script>
    import { onMount } from 'svelte';
    import { scale, fade } from 'svelte/transition';
    import { elasticOut } from 'svelte/easing';

    // Recebemos o ator para saber qual cor usar
    export let actor;

    let isOpen = false;
    let pos = { x: 50, y: 150 }; 

    // === LÓGICA DE COR (IGUAL À FICHA) ===
    $: flags = actor?.flags?.['multiversus-rpg'] || {};
    $: themeHex = (() => {
        const t = flags.theme || 'green';
        const map = { green: '#00ff41', amber: '#ffcc00', blue: '#0088ff', red: '#ff0000' };
        return t.startsWith('#') ? t : (map[t] || '#00ff41');
    })();

    const toggle = () => isOpen = !isOpen;

    const execute = (action) => {
        if (!actor && action !== 'map') return ui.notifications.warn("Bio-link necessário.");

        switch(action) {
            case 'bio': actor.sheet.render(true); break;
            case 'map': ui.nav.render(true); break;
            case 'gear': ui.notifications.info("Acessando banco de dados..."); break;
        }
        isOpen = false;
    };
</script>

<div class="wheeler-container" style="left: {pos.x}px; top: {pos.y}px; --c-primary: {themeHex};">
    
    <button class="trigger" on:click={toggle} class:active={isOpen}>
        <i class="fas fa-fingerprint"></i>
        <div class="scanner"></div>
    </button>

    {#if isOpen}
        <div class="radial-menu" transition:scale={{duration: 500, easing: elasticOut, start: 0.4}}>
            <button class="node n-t" title="Bio/Ficha" on:click={() => execute('bio')}>
                <i class="fas fa-id-badge"></i>
            </button>
            <button class="node n-r" title="Gear/Itens" on:click={() => execute('gear')}>
                <i class="fas fa-microchip"></i>
            </button>
            <button class="node n-b" title="Neural/Skills">
                <i class="fas fa-brain"></i>
            </button>
            <button class="node n-l" title="Sat/Mapa" on:click={() => execute('map')}>
                <i class="fas fa-satellite-dish"></i>
            </button>
            <div class="deco-ring"></div>
        </div>
    {/if}
</div>

<style>
    .wheeler-container {
        position: fixed;
        width: 70px; height: 70px;
        z-index: 10000;
        pointer-events: none;
    }

    .trigger {
        pointer-events: auto;
        width: 60px; height: 60px;
        background: #000;
        border: 2px solid var(--c-primary); /* COR DINÂMICA */
        border-radius: 50%;
        color: var(--c-primary);
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 0 15px var(--c-primary);
        position: relative; overflow: hidden;
    }

    .trigger.active { background: var(--c-primary); color: #000; }

    .scanner {
        position: absolute; width: 100%; height: 2px;
        background: var(--c-primary);
        box-shadow: 0 0 10px var(--c-primary);
        top: 0; animation: scan 2s infinite linear;
    }

    .node {
        pointer-events: auto;
        position: absolute; width: 45px; height: 45px;
        background: #000;
        border: 1px solid var(--c-primary);
        color: var(--c-primary);
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        transition: 0.2s;
        box-shadow: 0 0 10px var(--c-primary);
    }

    .node:hover { background: var(--c-primary); color: #000; transform: scale(1.2); }

    .n-t { transform: translateY(-70px); }
    .n-b { transform: translateY(70px); }
    .n-l { transform: translateX(-70px); }
    .n-r { transform: translateX(70px); }

    .deco-ring {
        position: absolute; width: 130px; height: 130px;
        border: 1px dashed var(--c-primary);
        opacity: 0.3; border-radius: 50%;
        animation: rotate 15s infinite linear;
    }

    @keyframes scan { 0% { top: 0%; } 100% { top: 100%; } }
    @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>