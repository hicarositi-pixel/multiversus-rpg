<script>
    import { createEventDispatcher } from 'svelte';
    import { fade, scale } from 'svelte/transition';

    export let item;
    export let isGM = false;
    export let themeColor = "#00ff41"; 
    export let mode = 'shop'; // 'shop', 'inventory', 'view'

    const dispatch = createEventDispatcher();
    
    let pos = { x: window.innerWidth / 2 - 375, y: window.innerHeight / 2 - 250 };
    let isDragging = false;

    function startDrag() { isDragging = true; }
    function stopDrag() { isDragging = false; }
    function onMove(e) { if(isDragging) { pos.x += e.movementX; pos.y += e.movementY; } }

    // Helpers Seguros
    $: sys = item.system || {};
    $: isRendered = item.active === true;
    $: stockDisplay = sys.stock === -1 ? '∞' : sys.stock;
    $: descHTML = sys.description || '<div style="padding:20px; color:#666;">DADOS CORROMPIDOS OU INEXISTENTES.</div>';
</script>

<svelte:window on:mousemove={onMove} on:mouseup={stopDrag} />

<div class="window-overlay" transition:fade={{duration: 100}} on:click={() => dispatch('close')}>
    <div class="item-window" 
         style="left:{pos.x}px; top:{pos.y}px; --th: {themeColor}" 
         transition:scale={{duration: 200, start: 0.95}}
         on:click|stopPropagation>
        
        <div class="bg-grid"></div>
        <div class="scanline"></div>

        <header on:mousedown={startDrag}>
            <div class="title-block">
                <span class="icon">Running_Process::</span> 
                <span class="item-name">{item.name.toUpperCase()}</span>
            </div>
            <button class="close-btn" on:click={() => dispatch('close')}>[ TERMINATE ]</button>
        </header>

        <div class="window-body">
            <aside>
                <div class="holo-frame">
                    <img src={item.img} alt={item.name} />
                    <div class="crt-overlay"></div>
                    
                    {#if isRendered && mode === 'inventory'}
                        <div class="stamp active"><span>RENDER_ACTIVE</span></div>
                    {/if}
                </div>

                <div class="data-table">
                    <div class="data-row">
                        <span class="label">CLASS_TYPE</span>
                        <span class="val">{item.systemTag || 'N/A'}</span>
                    </div>
                    <div class="data-row">
                        <span class="label">RARITY_LEVEL</span>
                        <span class="val" style="color: var(--th)">{item.rarity || 'COMUM'}</span>
                    </div>
                    {#if mode === 'shop'}
                        <div class="data-row">
                            <span class="label">GLOBAL_STOCK</span>
                            <span class="val stock">{stockDisplay}</span>
                        </div>
                    {/if}
                    <div class="data-row">
                        <span class="label">COST_PB</span>
                        <span class="val gold">{sys.costPerDie || 0}</span>
                    </div>
                    <div class="data-row">
                        <span class="label">COST_XP</span>
                        <span class="val xp">{sys.xpCost || 0}</span>
                    </div>
                </div>

                <div class="actions-area">
                    {#if mode === 'shop'}
                        <div class="price-display">
                            <span class="label">UNIT_PRICE:</span>
                            <span class="amount">{item.price} MC</span>
                        </div>
                        <button class="cyber-btn buy" on:click={() => dispatch('buy', item)}>
                            <i class="fas fa-shopping-cart"></i> EXECUTE_TRANSACTION
                        </button>
                    
                    {:else if mode === 'inventory'}
                        {#if !isRendered}
                            <button class="cyber-btn activate" on:click={() => dispatch('activate', item)}>
                                <i class="fas fa-power-off"></i> RENDER_ITEM
                            </button>
                        {:else}
                            <button class="cyber-btn disabled" disabled>
                                <i class="fas fa-check"></i> SYSTEM_ONLINE
                            </button>
                        {/if}
                    
                    {:else if mode === 'view'}
                        <div class="info-tag">PREVIEW_MODE_ONLY</div>
                    {/if}
                </div>
            </aside>

            <main>
                <div class="html-renderer">
                    {@html descHTML}
                </div>
            </main>
        </div>

        <div class="resize-handle"></div>
    </div>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;500&display=swap');

    .window-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.6); z-index: 50000;
    }

    .item-window {
        position: absolute; width: 800px; height: 550px;
        background: rgba(5, 5, 5, 0.98);
        border: 1px solid var(--th);
        box-shadow: 0 0 50px rgba(0,0,0,0.8), 0 0 15px rgba(var(--th), 0.2);
        display: flex; flex-direction: column;
        font-family: 'Share Tech Mono', monospace; color: #ccc;
        resize: both; overflow: hidden;
        clip-path: polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%);
    }

    /* BACKGROUND FX */
    .bg-grid { position: absolute; inset: 0; pointer-events: none; z-index: -1; background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 20px 20px; }
    .scanline { position: absolute; width: 100%; height: 50px; background: linear-gradient(to bottom, transparent, var(--th), transparent); opacity: 0.05; animation: scan 4s linear infinite; pointer-events: none; z-index: 0; }

    /* HEADER */
    header { background: rgba(0,0,0,0.8); padding: 8px 15px; border-bottom: 1px solid var(--th); display: flex; justify-content: space-between; align-items: center; cursor: grab; user-select: none; }
    header:active { cursor: grabbing; }
    .title-block { display: flex; align-items: center; gap: 10px; }
    .icon { color: var(--th); font-size: 12px; opacity: 0.7; }
    .item-name { color: #fff; font-size: 16px; letter-spacing: 1px; text-shadow: 0 0 5px var(--th); }
    .close-btn { background: transparent; border: 1px solid #333; color: #666; font-family: inherit; font-size: 12px; cursor: pointer; padding: 2px 8px; transition: 0.2s; }
    .close-btn:hover { border-color: #ff3333; color: #ff3333; box-shadow: 0 0 10px #ff3333; }

    .window-body { flex: 1; display: flex; overflow: hidden; }

    /* ASIDE */
    aside { width: 280px; background: rgba(0,0,0,0.3); border-right: 1px solid #333; padding: 15px; display: flex; flex-direction: column; gap: 15px; }
    .holo-frame { width: 100%; height: 200px; position: relative; border: 1px solid #333; overflow: hidden; background: #000; }
    .holo-frame img { width: 100%; height: 100%; object-fit: contain; }
    .crt-overlay { position: absolute; inset: 0; pointer-events: none; background: repeating-linear-gradient(0deg, rgba(0,0,0,0.1), rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px); }
    .stamp { position: absolute; bottom: 10px; right: 10px; border: 2px solid var(--th); color: var(--th); background: rgba(0,0,0,0.8); padding: 5px 10px; font-weight: bold; transform: rotate(-5deg); box-shadow: 0 0 10px var(--th); animation: blink 2s infinite; }

    .data-table { display: flex; flex-direction: column; gap: 2px; font-size: 12px; }
    .data-row { display: flex; justify-content: space-between; padding: 4px 8px; background: rgba(255,255,255,0.02); border-left: 2px solid #333; }
    .label { color: #666; } .val { color: #eee; font-weight: bold; } .val.stock { color: #fff; } .val.gold { color: #ffcc00; } .val.xp { color: #00ff41; }

    .actions-area { margin-top: auto; display: flex; flex-direction: column; gap: 10px; }
    .price-display { text-align: right; border-top: 1px dashed #333; padding-top: 5px; display: flex; flex-direction: column; }
    .price-display .label { font-size: 10px; }
    .price-display .amount { font-size: 22px; color: #ffcc00; text-shadow: 0 0 5px #ffcc00; }
    .info-tag { text-align: center; color: #666; font-size: 10px; border: 1px dashed #333; padding: 5px; }

    .cyber-btn { width: 100%; padding: 12px; font-family: inherit; font-size: 14px; font-weight: bold; cursor: pointer; border: 1px solid transparent; transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 10px; clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); }
    .cyber-btn.buy { background: var(--th); color: #000; }
    .cyber-btn.buy:hover { filter: brightness(1.2); box-shadow: 0 0 15px var(--th); }
    .cyber-btn.activate { background: transparent; border-color: var(--th); color: var(--th); }
    .cyber-btn.activate:hover { background: var(--th); color: #000; box-shadow: 0 0 15px var(--th); }
    .cyber-btn.disabled { background: #222; border-color: #444; color: #666; cursor: not-allowed; }

    /* MAIN (HTML RENDERER) */
    main { flex: 1; padding: 0; background: #080808; overflow: hidden; display: flex; flex-direction: column; }
    .html-renderer { flex: 1; overflow-y: auto; width: 100%; height: 100%; }

    /* --- ESTILOS DO TEMPLATE GAMA (IMPORTADOS DO ADMIN) --- */
    /* Usamos :global() para que o Svelte aplique aos elementos HTML injetados */
    :global(.gama-window-container) { width: 100%; min-height: 100%; background: #0d0208; border: none; display: flex; flex-direction: column; font-family: 'Fira Code', monospace; }
    :global(.gama-window-header) { background: #003b00; padding: 8px 15px; display: flex; align-items: center; border-bottom: 1px solid #00ff41; flex-shrink: 0; }
    :global(.window-controls) { display: flex; gap: 6px; margin-right: 20px; }
    :global(.dot) { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    :global(.red) { background: #ff5f56; } :global(.yellow) { background: #ffbd2e; } :global(.green) { background: #27c93f; }
    :global(.window-title) { color: #00ff41; font-size: 0.7rem; letter-spacing: 1px; font-weight: bold; }
    :global(.gama-window-layout) { display: flex; flex: 1; flex-direction: row; }
    :global(.gama-window-sidebar) { width: 140px; background: rgba(0, 20, 0, 0.5); border-right: 1px solid #003b00; padding: 15px 10px; display: flex; flex-direction: column; gap: 15px; flex-shrink: 0; }
    :global(.sidebar-section small) { color: #008f11; font-size: 0.6rem; display: block; margin-bottom: 4px; }
    :global(.status-box) { background: #00ff41; color: #000; font-size: 0.7rem; font-weight: bold; padding: 2px; text-align: center; border-radius: 2px; }
    :global(.rarity-text) { color: #ff003c; text-shadow: 0 0 5px #ff003c; font-size: 0.8rem; font-weight: bold; }
    :global(.gama-window-sidebar p) { margin: 0; font-size: 0.75rem; color: #fff; }
    :global(.sidebar-footer) { margin-top: auto; display: flex; align-items: center; gap: 5px; font-size: 0.6rem; color: #008f11; }
    :global(.pulse-icon) { width: 6px; height: 6px; background: #00ff41; border-radius: 50%; box-shadow: 0 0 5px #00ff41; animation: pulse 1s infinite; }
    :global(.gama-window-main) { flex: 1; padding: 20px; overflow-y: auto; position: relative; }
    :global(.power-title) { color: #fff; font-size: 1.4rem; margin-top: 0; border-bottom: 1px dotted #00ff41; padding-bottom: 10px; text-shadow: 0 0 10px #00ff41; }
    :global(.text-content) { color: #00ff41; font-size: 0.9rem; line-height: 1.4; }
    :global(.warning-text) { color: #00fbff; font-size: 0.8rem; margin-top: 15px; border-left: 2px solid #00fbff; padding-left: 10px; }
    :global(.scanlines) { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%); background-size: 100% 4px; pointer-events: none; z-index: 10; }

    .resize-handle { position: absolute; bottom: 0; right: 0; width: 20px; height: 20px; background: linear-gradient(135deg, transparent 50%, var(--th) 50%); opacity: 0.5; pointer-events: none; }
    @keyframes scan { 0% { top: -10%; } 100% { top: 110%; } }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
</style>