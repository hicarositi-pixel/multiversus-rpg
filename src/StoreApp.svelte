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

    const TAGS = ["Todos", "Talentos Principais", "Talentos Secundários", "Habilidades Especiais", "Habilidades Intrínsecas", "Itens", "Veículos", "Portais", "Bases", "Contatos", "Criaturas", "Origens", "Passe"];
    const RARITIES = ["Todas", "Comum", "Raro", "Lendário", "Mítico", "Universal", "Multiversal"];

    let activeTab = 'mercado'; 
    let selectedTag = "Todos";
    let searchQuery = "";
    let selectedRarity = "Todas";
    let userCoins = 0;
    
    let storeItems = [];      
    let inventoryItems = []; 
    let exclusiveItems = [];
    let selectedItem = null;
    let viewMode = 'shop';
    let nextResetFormatted = "";

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

    async function refreshData() {
        // Carrega e Sanitiza IMEDIATAMENTE
        const rawStore = StoreDatabase.getStore() || [];
        storeItems = rawStore.map(sanitizeItem).filter(i => i);

        const myData = StoreDatabase.getPlayerData(game.user.id);
        userCoins = myData.coins || 0;
        
        const rawInv = myData.items || [];
        inventoryItems = rawInv.map(sanitizeItem).filter(i => i);

        let eItems = await StoreDatabase.generateExclusiveStore(game.user.id);
        if (eItems) {
            exclusiveItems = eItems.map(sanitizeItem).filter(i => i && !i.purchased);
        }
        formatNextReset();
    }

    function formatNextReset() {
        const myData = StoreDatabase.getPlayerData(game.user.id);
        if(myData.exclusiveStore && myData.exclusiveStore.nextReset) {
            let diff = myData.exclusiveStore.nextReset - Date.now();
            if(diff > 0) {
                let d = Math.floor(diff / (1000 * 60 * 60 * 24));
                let h = Math.floor((diff / (1000 * 60 * 60)) % 24);
                nextResetFormatted = `${d}d ${h}h`;
            } else {
                nextResetFormatted = "Agora";
            }
        }
    }

    async function rerollStore() {
        const result = await StoreDatabase.rerollExclusiveStore(game.user.id);
        if (result.success) {
            ui.notifications.info(result.msg);
            refreshData();
        } else {
            ui.notifications.warn(result.msg);
        }
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
        
        // --- TRAVA DE PREVIEW TEMÁTICO ---
        if (item.system?.isThematic && item.system?.thematicStatus === 'preview') {
            return ui.notifications.warn("ACESSO NEGADO: Este item está em Preview e ainda não foi liberado para compra.");
        }

        if (item.system?.stock === 0) {
            return ui.notifications.error("FALHA: Este item está esgotado globalmente.");
        }

        let result;
        if (item.exclusiveId) {
            result = await StoreDatabase.buyExclusiveItemLocal(item.exclusiveId);
        } else {
            result = await StoreDatabase.buyItemLocal(item);
        }
        
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
                    <span class="unit">NX</span>
                </div>
            </div>

            <nav class="cyber-tabs">
                <button class:active={activeTab === 'mercado'} on:click={() => activeTab = 'mercado'}>
                    <i class="fas fa-globe"></i> NET_MARKET
                </button>
                <button class:active={activeTab === 'tematica'} on:click={() => activeTab = 'tematica'}>
                    <i class="fas fa-fire"></i> THEMATIC_DROP
                </button>
                <button class:active={activeTab === 'exclusiva'} on:click={() => activeTab = 'exclusiva'}>
                    <i class="fas fa-star"></i> EXCLUSIVE
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

        {:else if activeTab === 'exclusiva'}
            <div class="exclusive-header">
                <span class="reset-timer">NEXT_RESET: {nextResetFormatted}</span>
                <button class="reroll-btn" on:click={rerollStore}>
                    <i class="fas fa-sync"></i> REROLL [200 NX]
                </button>
            </div>
            {#if exclusiveItems.length > 0}
                <div class="exclusive-layout" class:no-featured={!exclusiveItems.some(i => i.discounted)}>
                    {#if exclusiveItems.some(i => i.discounted)}
                        <div class="exclusive-featured">
                            {#each exclusiveItems.filter(i => i.discounted) as item}
                                <StoreCard {item} {isGM} featured={true} on:click={() => openShopItem(item)} />
                            {/each}
                        </div>
                    {/if}
                    <div class="exclusive-regular-grid items-grid">
                        {#each exclusiveItems.filter(i => !i.discounted) as item (item.exclusiveId)}
                            <StoreCard {item} {isGM} on:click={() => openShopItem(item)} />
                        {/each}
                    </div>
                </div>
            {:else}
                <div class="empty-state">NO_EXCLUSIVE_DATA</div>
            {/if}

            {:else if activeTab === 'tematica'}
            <div class="exclusive-header" style="margin-bottom: 10px;">
                <span class="reset-timer"><i class="fas fa-fire"></i> COLEÇÃO LIMITADA TEMÁTICA</span>
            </div>
            <div class="items-grid">
                {#each storeItems.filter(i => i.system?.isThematic) as item (item.id)}
                    <div class="inv-slot">
                        <StoreCard {item} {isGM} on:click={() => openShopItem(item)} />
                        
                        {#if item.system?.thematicStatus === 'preview'}
                            <div class="overlay lock" style="background: rgba(0,0,0,0.7); pointer-events: none; border: 1px dashed #ffcc00; color: #ffcc00;">
                                <i class="fas fa-eye"></i> MODO PREVIEW
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
            {#if storeItems.filter(i => i.system?.isThematic).length === 0} 
                <div class="empty-state">NO_THEMATIC_DATA</div> 
            {/if}

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

    /* =========================================
       VARIÁVEIS DA LOJA TEMÁTICA (PREPARAÇÃO)
       Quando criarmos o Gerador de Temas, o JS 
       só vai precisar mudar essas variáveis!
       ========================================= */
    .store-shell {
        --t-primary: #ff3333; /* Cor principal do tema atual */
        --t-glow: rgba(255, 51, 51, 0.6); /* Brilho do tema */
        --t-bg: rgba(30, 5, 5, 0.4); /* Fundo do tema */
        --t-text: #ffffff;
    }

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
        /* --- JUICE: Animação de entrada da janela --- */
        animation: bootUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }

    /* BACKGROUND FX */
    .hex-grid {
        position: absolute; inset: 0; pointer-events: none; z-index: -1;
        background-image: radial-gradient(var(--c-theme) 1px, transparent 1px);
        background-size: 30px 30px; opacity: 0.1;
        /* --- JUICE: O grid se move lentamente --- */
        animation: panBg 30s linear infinite;
    }
    .crt-lines {
        position: absolute; inset: 0; pointer-events: none; z-index: 100;
        background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%);
        background-size: 100% 4px; opacity: 0.6;
    }
    .scanline {
        position: absolute; width: 100%; height: 100px; z-index: 99;
        background: linear-gradient(0deg, rgba(0,0,0,0) 0%, var(--c-theme) 50%, rgba(0,0,0,0) 100%);
        opacity: 0.15; animation: scan 6s linear infinite; pointer-events: none;
    }

    /* HEADER */
    header {
        background: rgba(0,0,0,0.8); padding: 10px 15px;
        border-bottom: 2px solid var(--c-theme);
        display: flex; justify-content: space-between; align-items: center;
        cursor: grab;
    }
    header:active { cursor: grabbing; } /* --- JUICE --- */

    .sys-info { font-size: 16px; letter-spacing: 2px; text-shadow: 0 0 5px var(--c-theme); }
    .blinking-cursor { animation: blink 1s infinite; }
    
    .win-controls button {
        background: transparent; border: 1px solid var(--c-theme); color: var(--c-theme);
        font-family: inherit; font-size: 12px; cursor: pointer; padding: 4px 10px;
        transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94); margin-left: 10px;
    }
    /* --- JUICE: Botões apertando --- */
    .win-controls button:hover { background: var(--c-theme); color: #000; box-shadow: 0 0 15px var(--c-theme); transform: scale(1.05); }
    .win-controls button:active { transform: scale(0.95); }
    
    .gm-btn { border-color: #ff3333 !important; color: #ff3333 !important; }
    .gm-btn:hover { background: #ff3333 !important; color: #000 !important; box-shadow: 0 0 15px #ff3333 !important; }

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
        transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94); clip-path: polygon(10% 0, 100% 0, 100% 100%, 0 100%);
        border-bottom: none; transform-origin: bottom;
    }
    /* --- JUICE: Abas levantando --- */
    .cyber-tabs button:hover:not(.active) { color: #fff; border-color: #fff; transform: translateY(-2px); }
    .cyber-tabs button.active {
        border-color: var(--c-theme); color: var(--c-theme); font-weight: bold;
        background: linear-gradient(180deg, rgba(var(--c-theme), 0.1), rgba(0,0,0,0));
        text-shadow: 0 0 8px var(--c-theme); transform: translateY(-4px); padding-bottom: 14px;
    }

    /* THEMATIC STORE & EXCLUSIVES (JUICED) */
    .exclusive-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 10px; background: var(--t-bg); border: 1px solid var(--t-primary); border-radius: 4px; box-shadow: inset 0 0 20px var(--t-glow); }
    .reset-timer { color: var(--t-primary); font-size: 14px; text-shadow: 0 0 8px var(--t-primary); font-weight: bold; letter-spacing: 1px; }
    .reroll-btn { 
        background: rgba(255, 204, 0, 0.1); border: 1px solid #ffcc00; color: #ffcc00;
        padding: 8px 20px; cursor: pointer; font-family: inherit; font-size: 12px; font-weight: bold;
        transition: all 0.2s; position: relative; overflow: hidden;
    }
    /* --- JUICE: Botão de Reroll com brilho passando --- */
    .reroll-btn::after {
        content: ""; position: absolute; top: -50%; left: -50%; width: 20px; height: 200%;
        background: #fff; opacity: 0.2; transform: rotate(45deg) translateY(-100px); transition: 0s;
    }
    .reroll-btn:hover::after { transform: rotate(45deg) translateY(100px); transition: 0.5s; }
    .reroll-btn:hover { background: #ffcc00; color: #000; box-shadow: 0 0 20px #ffcc00; transform: scale(1.05); }
    .reroll-btn:active { transform: scale(0.95); }

    .exclusive-layout { display: flex; flex-direction: column; gap: 20px; }
    .exclusive-featured { width: 100%; }

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
    .input-group input:focus + .deco-line { background: linear-gradient(90deg, #fff, transparent); height: 2px; } /* --- JUICE --- */
    
    .deco-line { position: absolute; bottom: 0; left: 0; width: 100%; height: 1px; background: linear-gradient(90deg, var(--c-theme), transparent); transition: 0.3s; }
    
    .cyber-select {
        background: #000; color: var(--c-theme); border: 1px solid #333;
        padding: 5px 15px; font-family: inherit; cursor: pointer; outline: none; transition: 0.3s;
    }
    .cyber-select:focus { border-color: var(--c-theme); box-shadow: 0 0 10px rgba(var(--c-theme), 0.3); }

    /* TAGS */
    .tags-row { padding: 10px 20px; overflow: hidden; }
    .scroll-track { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 5px; }
    .scroll-track::-webkit-scrollbar { height: 3px; background: #111; }
    .scroll-track::-webkit-scrollbar-thumb { background: var(--c-theme); }

    .cyber-chip {
        background: #0a0a0a; border: 1px solid #333; color: #555;
        padding: 6px 14px; cursor: pointer; font-family: inherit; font-size: 11px;
        white-space: nowrap; transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); position: relative; overflow: hidden;
    }
    /* --- JUICE: Tags saltando --- */
    .cyber-chip:hover { border-color: var(--c-theme); color: #fff; transform: translateY(-2px); }
    .cyber-chip.selected { 
        background: var(--c-theme); color: #000; font-weight: bold; 
        box-shadow: 0 0 10px var(--c-theme); border-color: var(--c-theme);
        transform: translateY(-2px) scale(1.05);
    }
    .cyber-chip:active { transform: scale(0.95); }

    /* VIEWPORT & GRID */
    .data-viewport { flex: 1; overflow-y: auto; padding: 20px; position: relative; scroll-behavior: smooth; }
    .items-grid { 
        display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); 
        gap: 20px; 
    }
    .empty-state { height: 100%; display: flex; align-items: center; justify-content: center; font-size: 24px; opacity: 0.3; letter-spacing: 5px; }

    /* INVENTARIO OVERLAYS & CARDS (JUICED) */
    .inv-slot { 
        position: relative; transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94); 
        /* --- JUICE: Efeito de "Lift" nos cards --- */
        transform-style: preserve-3d;
    }
    .inv-slot:hover { transform: translateY(-5px) scale(1.02); filter: drop-shadow(0 10px 15px rgba(0,0,0,0.8)); z-index: 10; }
    
    .inv-slot.active { filter: drop-shadow(0 0 12px var(--c-theme)); border-color: var(--c-theme); }
    .inv-slot.pass-reward { border: 1px solid #00fbff; box-shadow: 0 0 5px #00fbff; border-radius: 4px; }
    
    .active-overlay {
        position: absolute; bottom: 10px; right: 10px; 
        background: #000; border: 1px solid var(--c-theme); color: var(--c-theme);
        padding: 2px 8px; font-size: 10px; pointer-events: none; z-index: 10; box-shadow: 0 0 10px rgba(0,0,0,0.8);
    }
    
    .pass-tag-indicator {
        position: absolute; top: -5px; left: 10px;
        background: #00fbff; color: #000; box-shadow: 0 0 10px #00fbff;
        font-size: 8px; font-weight: bold; padding: 2px 8px;
        clip-path: polygon(0 0, 100% 0, 90% 100%, 10% 100%);
        z-index: 10; animation: pulseGlow 2s infinite;
    }

    /* --- JUICE: O Overlay de PREVIEW da loja temática --- */
    .overlay.lock {
        background: rgba(0, 0, 0, 0.85) !important;
        border: 2px dashed var(--t-primary) !important;
        color: var(--t-primary) !important;
        backdrop-filter: blur(3px);
        font-size: 14px;
        letter-spacing: 2px;
        text-shadow: 0 0 10px var(--t-primary);
        box-shadow: inset 0 0 30px var(--t-glow);
        animation: pulseWarning 2s infinite alternate;
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
    .deco-corner { width: 15px; height: 15px; background: linear-gradient(135deg, transparent 50%, var(--c-theme) 50%); opacity: 0.5; }

    /* ANIMATIONS */
    @keyframes scan { 0% { top: -10%; } 100% { top: 110%; } }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
    @keyframes spin { 100% { transform: rotateY(360deg); } }
    
    /* NOVAS ANIMAÇÕES DE JUICE */
    @keyframes bootUp { 
        0% { opacity: 0; transform: scale(0.95) translateY(20px); filter: blur(5px); } 
        100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); } 
    }
    @keyframes panBg { 
        0% { background-position: 0 0; } 
        100% { background-position: 100px 100px; } 
    }
    @keyframes pulseGlow { 
        0%, 100% { box-shadow: 0 0 5px currentColor; } 
        50% { box-shadow: 0 0 15px currentColor; filter: brightness(1.2); } 
    }
    @keyframes pulseWarning {
        0% { background: rgba(0,0,0,0.85); box-shadow: inset 0 0 10px var(--t-glow); }
        100% { background: rgba(20,0,0,0.9); box-shadow: inset 0 0 40px var(--t-glow); }
    }
</style>