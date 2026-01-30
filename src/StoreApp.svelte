<script>
    import { fade } from 'svelte/transition';
    import { createEventDispatcher, onMount } from 'svelte';
    import StoreCard from './StoreCard.svelte'; 
    import StoreAdmin from './StoreAdmin.svelte';
    import ItemWindow from './ItemWindow.svelte'; 
    import { StoreDatabase } from './StoreDatabase.js';
    import { StoreSocket } from './StoreSocket.js';
    
    export let actor;
    const dispatch = createEventDispatcher();
    const isGM = game.user.isGM;
    const MODULE_ID = "multiversus-rpg";

    const TAGS = ["Todos", "Poder Principal", "Poder Secundario", "Habilidade Especial", "Hyper Stat", "Hyper Skill", "Item", "Veiculo", "Portais", "Bases", "Contatos", "Criaturas", "Origens", "Passe"];
    const RARITIES = ["Todas", "Comum", "Raro", "Lendário", "Mítico", "Universal", "Multiversal"];

    let activeTab = 'mercado'; 
    let selectedTag = "Todos";
    let searchQuery = "";
    let selectedRarity = "Todas";
    let userCoins = 0;
    
    let storeItems = [];      
    let inventoryItems = []; 
    let selectedItem = null;
    let viewMode = 'shop';

    let pos = { x: 150, y: 50 };
    let isDragging = false;

    $: flags = actor?.flags?.[MODULE_ID] || {};
    $: themeColor = (() => {
        const t = flags.theme || 'green';
        const colors = { green: '#00ff41', amber: '#ffcc00', blue: '#0088ff', red: '#ff3333' };
        return t.startsWith('#') ? t : (colors[t] || '#00ff41');
    })();

    // --- FUNÇÃO DE LIMPEZA (SANITIZER) ---
    // Garante que nenhum item quebre a interface por falta de dados
    function sanitizeItem(item) {
        if (!item) return null;
        // Cria uma cópia segura
        const safe = { ...item };
        
        // Garante System
        if (!safe.system) safe.system = {};
        
        // Garante Stock e Descrição
        if (safe.system.stock === undefined) safe.system.stock = -1;
        if (!safe.system.description) safe.system.description = "Sem descrição.";
        
        // Garante Tags básicas se faltar
        if (!safe.name) safe.name = "Item Desconhecido";
        if (!safe.rarity) safe.rarity = "Comum";
        
        return safe;
    }

    // --- FILTRO REATIVO ---
    $: checkFilter = (item) => {
        if (!item) return false;
        const tag = item.systemTag || "Item";
        const rarity = item.rarity || "Comum";
        const isFromPass = item.isPassItem || tag === "Passe";

        const matchTag = selectedTag === 'Todos' || tag === selectedTag;
        const matchRarity = selectedRarity === 'Todas' || rarity === selectedRarity;
        const matchSearch = searchQuery === "" || (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase()));
        
        return matchTag && matchRarity && matchSearch;
    };

    $: filteredStoreItems = storeItems.filter(checkFilter);
    $: filteredInventoryItems = inventoryItems.filter(checkFilter);

    onMount(() => {
        StoreSocket.init();
        if (StoreDatabase.init && !game.settings.settings.has(`${MODULE_ID}.storeCatalog`)) {
             StoreDatabase.init();
        }
        
        refreshData();
        
        Hooks.on("storeUpdate", refreshData);
        Hooks.on(`updateUser`, (user) => {
            if (user.id === game.user.id) refreshData();
        });
    });

    function refreshData() {
        // Carrega e Sanitiza IMEDIATAMENTE
        const rawStore = StoreDatabase.getStore() || [];
        storeItems = rawStore.map(sanitizeItem).filter(i => i); // Remove nulos

        const myData = StoreDatabase.getPlayerData(game.user.id);
        userCoins = myData.coins || 0;
        
        const rawInv = myData.items || [];
        inventoryItems = rawInv.map(sanitizeItem).filter(i => i);
    }

    function startDrag() { isDragging = true; }
    function stopDrag() { isDragging = false; }
    function onMove(e) { if(isDragging) { pos.x += e.movementX; pos.y += e.movementY; } }

    function toggleAdminMode() { activeTab = (activeTab === 'admin') ? 'mercado' : 'admin'; }
    
    // Ao abrir, garante que o item selecionado também esteja sanitizado (redundância segura)
    function openShopItem(item) { selectedItem = sanitizeItem(item); viewMode = 'shop'; }
    function openInventoryItem(item) { selectedItem = sanitizeItem(item); viewMode = 'inventory'; }

    async function handleBuy(item) {
        if (!item) return;
        // Envia para o banco
        const result = await StoreDatabase.buyItemLocal(item);
        
        if (result.success) { 
            ui.notifications.info(result.msg); 
            refreshData(); 
            selectedItem = null; 
        } else { 
            ui.notifications.warn(result.msg); 
        }
    }

    async function toggleActivate(item) {
        if (!item || !item.uniqueId) return;
        await StoreDatabase.toggleActivationLocal(item.uniqueId);
        refreshData();
        selectedItem = null;
    }
</script>

<svelte:window on:mousemove={onMove} on:mouseup={stopDrag} />

{#if selectedItem}
    <ItemWindow 
        item={selectedItem} mode={viewMode} {isGM} themeColor={themeColor}
        on:close={() => selectedItem = null} 
        on:buy={(e) => handleBuy(e.detail)} 
        on:activate={(e) => toggleActivate(e.detail)}
    />
{/if}

<div class="store-shell" style="left: {pos.x}px; top: {pos.y}px; --c-theme: {themeColor};" transition:fade>
    
    <div class="crt-lines"></div> <div class="hex-grid"></div>  <div class="scanline"></div>  
    
    <header on:mousedown={startDrag}>
        <div class="sys-info">
            <span class="blinking-cursor">></span> SYSTEM_ROOT :: {actor?.name?.toUpperCase() || 'UNKNOWN'}
        </div>
        <div class="win-controls">
            {#if isGM} 
                <button class="gm-btn" class:active={activeTab === 'admin'} on:click={toggleAdminMode}>
                    [{activeTab === 'admin' ? 'EXIT_ROOT' : 'SUDO_ADMIN'}]
                </button> 
            {/if}
            <button class="close-btn" on:click={() => dispatch('close')}>[ X ]</button>
        </div>
    </header>

    {#if activeTab !== 'admin'}
        <div class="hud-top">
            <div class="wallet-display">
                <span class="label">CREDITS_AVAILABLE</span>
                <div class="value-box">
                    <i class="fas fa-coins spin"></i> 
                    <span class="numbers">{userCoins}</span>
                    <span class="unit">MC</span>
                </div>
            </div>

            <nav class="cyber-tabs">
                <button class:active={activeTab === 'mercado'} on:click={() => activeTab = 'mercado'}>
                    <i class="fas fa-globe"></i> NET_MARKET
                </button>
                <button class:active={activeTab === 'inventario'} on:click={() => activeTab = 'inventario'}>
                    <i class="fas fa-box-open"></i> LOCAL_STORAGE
                </button>
            </nav>
        </div>

        <section class="command-bar">
            <div class="input-group">
                <span class="prompt">QUERY://</span>
                <input type="text" bind:value={searchQuery} placeholder="Search database..." spellcheck="false" />
                <div class="deco-line"></div>
            </div>
            <select class="cyber-select" bind:value={selectedRarity}>
                <option value="Todas">FILTER: RARITY (*)</option>
                {#each RARITIES as r} {#if r !== "Todas"}<option value={r}>{r.toUpperCase()}</option>{/if} {/each}
            </select>
        </section>

        <div class="tags-row">
            <div class="scroll-track">
                {#each TAGS as tag}
                    {#if tag !== "Todos"}
                        <button class="cyber-chip" class:selected={selectedTag === tag} on:click={() => selectedTag = tag}>
                            {tag.toUpperCase()}
                        </button>
                    {/if}
                {/each}
                <button class="cyber-chip" class:selected={selectedTag === "Todos"} on:click={() => selectedTag = "Todos"}>ALL_DATA</button>
            </div>
        </div>
    {/if}

    <main class="data-viewport">
        {#if activeTab === 'mercado'}
            <div class="items-grid">
                {#each filteredStoreItems as item (item.id)}
                    <StoreCard {item} {isGM} on:click={() => openShopItem(item)} />
                {/each}
            </div>
            {#if filteredStoreItems.length === 0} <div class="empty-state">NO_DATA_FOUND</div> {/if}

        {:else if activeTab === 'inventario'}
            <div class="items-grid">
                {#each filteredInventoryItems as item}
                    <div class="inv-slot" class:active={item.active} class:pass-reward={item.isPassItem}>
                        <StoreCard {item} on:click={() => openInventoryItem(item)} />
                        
                        {#if item.active}
                            <div class="active-overlay"><span class="blink">RENDER_ACTIVE</span></div>
                        {/if}

                        {#if item.isPassItem}
                            <div class="pass-tag-indicator">PASSE_DATA</div>
                        {/if}
                    </div>
                {/each}
            </div>
            {#if filteredInventoryItems.length === 0} <div class="empty-state">STORAGE_EMPTY</div> {/if}

        {:else if activeTab === 'admin' && isGM}
            <StoreAdmin {storeItems} on:refresh={refreshData} />
        {/if}
    </main>

    <footer>
        <div class="status-line">
            <span class="led"></span> CONNECTION_STABLE :: {filteredInventoryItems.length} OBJECTS LOADED
        </div>
        <div class="deco-corner"></div>
    </footer>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

    .store-shell {
        position: fixed; width: 1000px; height: 750px;
        background: #020202;
        border: 1px solid var(--c-theme);
        box-shadow: 0 0 20px rgba(0,0,0,0.9), 0 0 10px var(--c-theme);
        display: flex; flex-direction: column;
        resize: both; overflow: hidden;
        font-family: 'Share Tech Mono', monospace;
        color: var(--c-theme);
        z-index: 25000;
        clip-path: polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%);
    }

    /* BACKGROUND FX */
    .hex-grid {
        position: absolute; inset: 0; pointer-events: none; z-index: -1;
        background-image: radial-gradient(var(--c-theme) 1px, transparent 1px);
        background-size: 30px 30px; opacity: 0.1;
    }
    .crt-lines {
        position: absolute; inset: 0; pointer-events: none; z-index: 100;
        background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%);
        background-size: 100% 4px; opacity: 0.6;
    }
    .scanline {
        position: absolute; width: 100%; height: 100px; z-index: 99;
        background: linear-gradient(0deg, rgba(0,0,0,0) 0%, var(--c-theme) 50%, rgba(0,0,0,0) 100%);
        opacity: 0.1; animation: scan 6s linear infinite; pointer-events: none;
    }

    /* HEADER */
    header {
        background: rgba(0,0,0,0.8); padding: 10px 15px;
        border-bottom: 2px solid var(--c-theme);
        display: flex; justify-content: space-between; align-items: center;
        cursor: grab;
    }
    .sys-info { font-size: 16px; letter-spacing: 2px; text-shadow: 0 0 5px var(--c-theme); }
    .blinking-cursor { animation: blink 1s infinite; }
    
    .win-controls button {
        background: transparent; border: 1px solid var(--c-theme); color: var(--c-theme);
        font-family: inherit; font-size: 12px; cursor: pointer; padding: 4px 10px;
        transition: 0.2s; margin-left: 10px;
    }
    .win-controls button:hover { background: var(--c-theme); color: #000; box-shadow: 0 0 15px var(--c-theme); }
    .gm-btn { border-color: #ff3333 !important; color: #ff3333 !important; }
    .gm-btn:hover { background: #ff3333 !important; color: #000 !important; }

    /* HUD TOP */
    .hud-top { padding: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
    
    .wallet-display .label { font-size: 10px; opacity: 0.7; letter-spacing: 1px; }
    .value-box { 
        font-size: 36px; display: flex; align-items: center; gap: 10px; 
        text-shadow: 0 0 10px var(--c-theme); 
    }
    .spin { animation: spin 4s infinite linear; font-size: 24px; }

    .cyber-tabs { display: flex; gap: 5px; }
    .cyber-tabs button {
        background: rgba(0,0,0,0.5); border: 1px solid #333; color: #666;
        padding: 10px 25px; cursor: pointer; font-family: inherit; font-size: 14px;
        transition: 0.3s; clip-path: polygon(10% 0, 100% 0, 100% 100%, 0 100%);
        border-bottom: none;
    }
    .cyber-tabs button.active {
        border-color: var(--c-theme); color: var(--c-theme);
        background: linear-gradient(180deg, rgba(var(--c-theme), 0.1), rgba(0,0,0,0));
        text-shadow: 0 0 8px var(--c-theme);
    }
    .cyber-tabs button:hover { color: #fff; border-color: #fff; }

    /* COMMAND BAR */
    .command-bar {
        background: rgba(255,255,255,0.03); padding: 10px 20px;
        display: flex; gap: 20px; border-top: 1px solid #333; border-bottom: 1px solid #333;
    }
    .input-group { flex: 1; display: flex; align-items: center; position: relative; }
    .prompt { color: var(--c-theme); font-weight: bold; margin-right: 10px; }
    .input-group input {
        flex: 1; background: transparent; border: none; color: #fff;
        font-family: inherit; font-size: 18px; outline: none; text-transform: uppercase;
    }
    .deco-line {
        position: absolute; bottom: 0; left: 0; width: 100%; height: 1px;
        background: linear-gradient(90deg, var(--c-theme), transparent);
    }
    .cyber-select {
        background: #000; color: var(--c-theme); border: 1px solid #333;
        padding: 5px 15px; font-family: inherit; cursor: pointer; outline: none;
    }

    /* TAGS */
    .tags-row { padding: 10px 20px; overflow: hidden; }
    .scroll-track { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 5px; }
    .scroll-track::-webkit-scrollbar { height: 3px; background: #111; }
    .scroll-track::-webkit-scrollbar-thumb { background: var(--c-theme); }

    .cyber-chip {
        background: #0a0a0a; border: 1px solid #333; color: #555;
        padding: 6px 14px; cursor: pointer; font-family: inherit; font-size: 11px;
        white-space: nowrap; transition: 0.2s; position: relative; overflow: hidden;
    }
    .cyber-chip:hover { border-color: var(--c-theme); color: #fff; }
    .cyber-chip.selected { 
        background: var(--c-theme); color: #000; font-weight: bold; 
        box-shadow: 0 0 10px var(--c-theme); border-color: var(--c-theme);
    }

    /* VIEWPORT */
    .data-viewport { flex: 1; overflow-y: auto; padding: 20px; position: relative; }
    .items-grid { 
        display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); 
        gap: 20px; 
    }
    .empty-state {
        height: 100%; display: flex; align-items: center; justify-content: center;
        font-size: 24px; opacity: 0.3; letter-spacing: 5px;
    }

    /* INVENTARIO OVERLAYS */
    .inv-slot { position: relative; transition: 0.3s; }
    .inv-slot.active { transform: scale(1.02); filter: drop-shadow(0 0 8px var(--c-theme)); }
    
    .inv-slot.pass-reward { border: 1px solid #00fbff; box-shadow: 0 0 5px #00fbff; border-radius: 4px; }
    
    .active-overlay {
        position: absolute; bottom: 10px; right: 10px; 
        background: #000; border: 1px solid var(--c-theme); color: var(--c-theme);
        padding: 2px 8px; font-size: 10px; pointer-events: none; z-index: 10;
    }
    
    .pass-tag-indicator {
        position: absolute; top: -5px; left: 10px;
        background: #00fbff; color: #000;
        font-size: 8px; font-weight: bold; padding: 1px 5px;
        clip-path: polygon(0 0, 100% 0, 90% 100%, 10% 100%);
        z-index: 10;
    }

    .blink { animation: blink 2s infinite; }

    /* FOOTER */
    footer {
        background: #000; border-top: 1px solid #333; padding: 5px 15px;
        font-size: 10px; display: flex; justify-content: space-between; align-items: center;
        position: relative;
    }
    .led {
        display: inline-block; width: 6px; height: 6px; background: var(--c-theme);
        border-radius: 50%; margin-right: 5px; box-shadow: 0 0 5px var(--c-theme);
        animation: blink 0.5s infinite alternate;
    }
    .deco-corner {
        width: 15px; height: 15px; 
        background: linear-gradient(135deg, transparent 50%, var(--c-theme) 50%);
        opacity: 0.5;
    }

    /* ANIMATIONS */
    @keyframes scan { 0% { top: -10%; } 100% { top: 110%; } }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
    @keyframes spin { 100% { transform: rotateY(360deg); } }
</style>