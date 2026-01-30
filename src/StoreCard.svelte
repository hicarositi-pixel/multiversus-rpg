<script>
    import { createEventDispatcher } from 'svelte';
    export let item;
    export let isGM = false;

    const dispatch = createEventDispatcher();

    // Mapeamento de Cores por Raridade
    const R_COLORS = {
        "Comum": "#888888", 
        "Raro": "#00aaff", 
        "Lendário": "#ffcc00",
        "Mítico": "#ff3333", 
        "Universal": "#aa00ff", 
        "Multiversal": "#00ff41"
    };
    
    $: rarityColor = R_COLORS[item.rarity] || "#fff";
</script>

<div class="matrix-card" 
     style="--r-color: {rarityColor};" 
     on:click={() => dispatch('click', item)}>
    
    <div class="holo-frame">
        <img src={item.img} alt={item.name} />
        <div class="scan-overlay"></div>
        <div class="corner-bracket"></div>
    </div>

    <div class="data-block">
        <div class="header">
            <span class="type-tag">[{item.systemTag}]</span>
            <span class="rarity-dot"></span>
        </div>
        
        <div class="title-scroller">
            <h3 class="name">{item.name}</h3>
        </div>

        <div class="footer-info">
            <span class="price">{item.price} <small>MC</small></span>
            <div class="action-arrow">>></div>
        </div>
    </div>
</div>

<style>
    .matrix-card {
        background: rgba(10, 10, 10, 0.8);
        border: 1px solid #333;
        position: relative; cursor: pointer; overflow: hidden;
        transition: 0.3s;
        height: 240px;
        display: flex; flex-direction: column;
        /* Corte no canto superior direito */
        clip-path: polygon(
            0 0, calc(100% - 20px) 0, 100% 20px, 
            100% 100%, 0 100%
        );
    }

    /* Efeito Hover: Borda Brilha e Card Sobe */
    .matrix-card:hover {
        border-color: var(--r-color);
        box-shadow: 0 0 15px rgba(0,0,0,0.8), inset 0 0 10px rgba(0,0,0,0.5);
        transform: translateY(-5px);
        background: rgba(20, 20, 20, 0.9);
    }

    .holo-frame {
        height: 140px; width: 100%; position: relative;
        background: #000; border-bottom: 1px solid #333;
    }
    .holo-frame img {
        width: 100%; height: 100%; object-fit: cover;
        opacity: 0.8; transition: 0.4s; filter: grayscale(40%);
    }
    .matrix-card:hover .holo-frame img {
        opacity: 1; filter: grayscale(0%); transform: scale(1.05);
    }
    
    .scan-overlay {
        position: absolute; inset: 0; pointer-events: none;
        background: linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.2) 50%);
        background-size: 100% 4px;
    }
    .corner-bracket {
        position: absolute; top: 0; right: 0; width: 0; height: 0;
        border-style: solid; border-width: 0 20px 20px 0;
        border-color: transparent var(--r-color) transparent transparent;
        opacity: 0.5;
    }

    .data-block {
        padding: 12px; flex: 1; display: flex; flex-direction: column;
        justify-content: space-between;
    }

    .header { display: flex; justify-content: space-between; align-items: center; }
    .type-tag { font-size: 9px; color: #666; letter-spacing: 1px; }
    .rarity-dot {
        width: 8px; height: 8px; background: var(--r-color);
        border-radius: 50%; box-shadow: 0 0 5px var(--r-color);
    }

    .name {
        margin: 5px 0; font-size: 14px; font-weight: normal; color: #eee;
        font-family: 'Share Tech Mono', monospace; text-transform: uppercase;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .matrix-card:hover .name { color: var(--r-color); text-shadow: 0 0 5px var(--r-color); }

    .footer-info {
        display: flex; justify-content: space-between; align-items: flex-end;
        border-top: 1px solid #222; padding-top: 8px;
    }
    .price {
        font-size: 18px; color: var(--r-color); font-weight: bold;
    }
    .price small { font-size: 10px; color: #888; }
    
    .action-arrow { font-size: 12px; color: #444; transition: 0.3s; }
    .matrix-card:hover .action-arrow { color: #fff; transform: translateX(5px); }
</style>