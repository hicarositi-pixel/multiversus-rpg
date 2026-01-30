<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import StoreCard from './StoreCard.svelte'; 
    import { StoreDatabase } from './StoreDatabase.js';

    export let storeItems = []; 
    const dispatch = createEventDispatcher();

    // CONFIGURAÇÃO
    const TAGS = ["Poder Principal", "Poder Secundario", "Habilidade Especial", "Hyper Stat", "Hyper Skill", "Item", "Veiculo", "Portais", "Bases", "Contatos", "Criaturas", "Origens", "Passe"];
    const RARITIES = ["Comum", "Raro", "Lendário", "Mítico", "Universal", "Multiversal"];

    // REGRAS
    const PB_RULES = {
        "Poder Principal": { "Comum": 2, "Raro": 4, "Lendário": 8, "Mítico": 12, "Universal": 16, "Multiversal": 32 },
        "Poder Secundario": { "Comum": 1, "Raro": 2, "Lendário": 4, "Mítico": 6, "Universal": 8, "Multiversal": 16 },
        "Item": { "Comum": 1, "Raro": 2, "Lendário": 4, "Mítico": 6, "Universal": 8, "Multiversal": 16 },
        "Veiculo": { "Comum": 2, "Raro": 4, "Lendário": 8, "Mítico": 12, "Universal": 16, "Multiversal": 32 },
        "Habilidade Especial": { "Comum": 0, "Raro": 1, "Lendário": 2, "Mítico": 3, "Universal": 4, "Multiversal": 8 }
    };
    const XP_RULES = { "Poder Principal": 8, "Poder Secundario": 4, "Habilidade Especial": 2, "Hyper Stat": 0, "Hyper Skill": 0 };

    // ESTADO
    const emptyItem = {
        id: null, name: "", systemTag: "Poder Principal", rarity: "Comum", price: 0,
        img: "icons/svg/mystery-man.svg",
        system: { description: "", costPerDie: 0, xpCost: 0, stock: -1 }
    };

    let draft = JSON.parse(JSON.stringify(emptyItem));
    
    // --- ESTADOS DE EDIÇÃO ---
    let activeSection = 'create';
    let isManualMode = false;

    // Variaveis do Gerador Automático
    let simpleDesc = "";
    let simpleWarn = "";
    let serialBase = "V2-00";

    let playerList = [];
    let transactionValues = {};
    let archiveItems = [];
    
    // NOVO: Estado de Inspeção
    let inspectedPlayer = null;

    onMount(() => { refreshAllData(); });

    function refreshAllData() {
        archiveItems = StoreDatabase.getArchive();
        playerList = game.users.filter(u => !u.isGM).map(u => {
            const data = u.getFlag("multiversus-rpg", "playerData") || { coins: 0, items: [] };
            if (transactionValues[u.id] === undefined) transactionValues[u.id] = 0;
            return { id: u.id, name: u.name, color: u.color, coins: data.coins, inventory: data.items || [] };
        });

        // Se estiver inspecionando alguém, atualiza os dados dele em tempo real
        if (inspectedPlayer) {
            const fresh = playerList.find(p => p.id === inspectedPlayer.id);
            if (fresh) inspectedPlayer = fresh;
        }
    }

    // --- GERADOR DE TEMPLATE GAMA ---
    function generateHTML(desc, warn, serial, itemName, itemRarity, itemTag) {
        const safeText = (t) => t ? t.toString() : "";
        const formatText = (t) => t ? t.replace(/\*(.*?)\*/g, '<strong style="color: #fff; text-shadow: 0 0 5px #00ff41;">$1</strong>').replace(/\n/g, '<br>') : "";

        return `
<div class="gama-window-container">
    <div class="gama-window-header">
        <div class="window-controls"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span></div>
        <div class="window-title">TERMINAL_GAMA // ${safeText(itemTag).toUpperCase()}</div>
    </div>
    <div class="gama-window-layout">
        <aside class="gama-window-sidebar">
            <div class="sidebar-section"><small>STATUS</small><div class="status-box">ONLINE</div></div>
            <div class="sidebar-section"><small>NÍVEL</small><div class="rarity-text">${safeText(itemRarity).toUpperCase()}</div></div>
            <div class="sidebar-section"><small>LOTE/TAG</small><p>${safeText(serial)}</p></div>
            <div class="sidebar-footer"><div class="pulse-icon"></div><span>CONEXÃO</span></div>
        </aside>
        <main class="gama-window-main">
            <div class="scanlines"></div>
            <h2 class="power-title">${safeText(itemName).toUpperCase() || 'NOME DO ARQUIVO'}</h2>
            <div class="text-content">
                <p>${formatText(desc)}</p>
                ${warn ? `<p class="warning-text">[AVISO]: ${formatText(warn)}</p>` : ''}
            </div>
        </main>
    </div>
</div>
<style>
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;500&display=swap');
.gama-window-container { width: 100%; height: 100%; background: #0d0208; border: 1px solid #00ff41; display: flex; flex-direction: column; overflow: hidden; font-family: 'Fira Code', monospace; box-shadow: 0 0 30px rgba(0, 255, 65, 0.2); }
.gama-window-header { background: #003b00; padding: 8px 15px; display: flex; align-items: center; border-bottom: 1px solid #00ff41; }
.window-controls { display: flex; gap: 6px; margin-right: 20px; }
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.red { background: #ff5f56; } .yellow { background: #ffbd2e; } .green { background: #27c93f; }
.window-title { color: #00ff41; font-size: 0.7rem; letter-spacing: 1px; font-weight: bold; }
.gama-window-layout { display: flex; flex: 1; overflow: hidden; }
.gama-window-sidebar { width: 140px; background: rgba(0, 20, 0, 0.5); border-right: 1px solid #003b00; padding: 15px 10px; display: flex; flex-direction: column; gap: 15px; }
.sidebar-section small { color: #008f11; font-size: 0.6rem; display: block; margin-bottom: 4px; }
.status-box { background: #00ff41; color: #000; font-size: 0.7rem; font-weight: bold; padding: 2px; text-align: center; border-radius: 2px; }
.rarity-text { color: #ff003c; text-shadow: 0 0 5px #ff003c; font-size: 0.8rem; font-weight: bold; }
.gama-window-sidebar p { margin: 0; font-size: 0.75rem; color: #fff; }
.sidebar-footer { margin-top: auto; display: flex; align-items: center; gap: 5px; font-size: 0.6rem; color: #008f11; }
.pulse-icon { width: 6px; height: 6px; background: #00ff41; border-radius: 50%; box-shadow: 0 0 5px #00ff41; animation: pulse 1s infinite; }
.gama-window-main { flex: 1; padding: 20px; overflow-y: auto; position: relative; }
.power-title { color: #fff; font-size: 1.4rem; margin-top: 0; border-bottom: 1px dotted #00ff41; padding-bottom: 10px; text-shadow: 0 0 10px #00ff41; }
.text-content { color: #00ff41; font-size: 0.9rem; line-height: 1.4; }
.warning-text { color: #00fbff; font-size: 0.8rem; margin-top: 15px; border-left: 2px solid #00fbff; padding-left: 10px; }
.scanlines { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%); background-size: 100% 4px; pointer-events: none; z-index: 10; }
@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
.gama-window-main::-webkit-scrollbar { width: 4px; }
.gama-window-main::-webkit-scrollbar-track { background: #0d0208; }
.gama-window-main::-webkit-scrollbar-thumb { background: #003b00; border-radius: 10px; }
.gama-window-main::-webkit-scrollbar-thumb:hover { background: #00ff41; }
</style>`;
    }

    // --- CÁLCULOS VISUAIS ---
    $: suggPB = (() => {
        let base = 0;
        if (PB_RULES[draft.systemTag]) base = PB_RULES[draft.systemTag][draft.rarity] || 0;
        if (draft.systemTag === 'Habilidade Especial') base += 2;
        if (draft.systemTag === 'Hyper Stat') base += 4;
        if (draft.systemTag === 'Hyper Skill') base += 1;
        return base;
    })();
    $: suggXP = XP_RULES[draft.systemTag] || 0;
    $: suggPrice = suggPB * 100;

    // PREVIEW
    $: previewHTML = isManualMode ? draft.system.description : generateHTML(simpleDesc, simpleWarn, serialBase, draft.name, draft.rarity, draft.systemTag);

    // --- AÇÕES ---
    async function saveItem() {
        try {
            let itemToSave = JSON.parse(JSON.stringify(draft));
            if (!itemToSave.id) itemToSave.id = foundry.utils.randomID();
            if (!itemToSave.name) itemToSave.name = "NOVO ITEM";
            
            // Sugestões automáticas se 0
            if (itemToSave.system.costPerDie === 0) itemToSave.system.costPerDie = suggPB;
            if (itemToSave.system.xpCost === 0) itemToSave.system.xpCost = suggXP;
            if (itemToSave.price === 0) itemToSave.price = suggPrice;

            if (isManualMode) {
                itemToSave.system.isManual = true; 
            } else {
                itemToSave.system.description = generateHTML(simpleDesc, simpleWarn, serialBase, itemToSave.name, itemToSave.rarity, itemToSave.systemTag);
                itemToSave.system.rawDesc = simpleDesc;
                itemToSave.system.rawWarn = simpleWarn;
                itemToSave.system.serialBase = serialBase;
                itemToSave.system.isManual = false;
            }

            await StoreDatabase.createItem(itemToSave);
            ui.notifications.info(`Item salvo com sucesso!`);
            resetForm();
            dispatch('refresh');

        } catch (e) {
            console.error("Erro StoreAdmin:", e);
            ui.notifications.error("Erro no salvamento.");
        }
    }

    function resetForm() {
        draft = JSON.parse(JSON.stringify(emptyItem));
        simpleDesc = ""; simpleWarn = ""; serialBase = "V2-00";
        isManualMode = false;
    }

    function editItem(item) {
        draft = JSON.parse(JSON.stringify(item));
        if (draft.system.isManual) {
            isManualMode = true;
        } else {
            isManualMode = false;
            simpleDesc = draft.system.rawDesc || "";
            simpleWarn = draft.system.rawWarn || "";
            serialBase = draft.system.serialBase || "V2-00";
        }
        activeSection = 'create';
    }

    async function deleteItem(id) { await StoreDatabase.deleteFromStore(id); dispatch('refresh'); }
    async function deletePermanent(id) { await StoreDatabase.deleteFromArchive(id); refreshAllData(); dispatch('refresh'); }
    async function toggleStore(item) { await StoreDatabase.toggleStoreListing(item); dispatch('refresh'); }
    
    // --- GESTÃO DE JOGADORES ---
    async function modifyCoins(userId, mode) {
        const amount = transactionValues[userId];
        if (!amount || amount <= 0) return;
        await StoreDatabase.adminModifyCoins(userId, amount, mode);
        transactionValues[userId] = 0;
        setTimeout(refreshAllData, 200);
    }

    async function removeItemFromPlayer(uniqueId) {
        if (!inspectedPlayer) return;
        let userData = StoreDatabase.getPlayerData(inspectedPlayer.id);
        userData.items = userData.items.filter(i => i.uniqueId !== uniqueId);
        
        const user = game.users.get(inspectedPlayer.id);
        await user.setFlag("multiversus-rpg", "playerData", userData);
        
        ui.notifications.info("Item removido do jogador.");
        refreshAllData(); // Recarrega para atualizar a tela
    }

    function openInspector(player) {
        inspectedPlayer = player;
    }
</script>

<div class="admin-panel" in:fade>
    <nav class="admin-nav">
        <button class:active={activeSection === 'create'} on:click={() => activeSection = 'create'}><i class="fas fa-hammer"></i> CRIAR</button>
        <button class:active={activeSection === 'manage'} on:click={() => activeSection = 'manage'}><i class="fas fa-list"></i> LOJA ATIVA</button>
        <button class:active={activeSection === 'archive'} on:click={() => { activeSection = 'archive'; refreshAllData(); }}><i class="fas fa-database"></i> DB GERAL</button>
        <button class:active={activeSection === 'players'} on:click={() => { activeSection = 'players'; refreshAllData(); }}><i class="fas fa-users"></i> JOGADORES</button>
    </nav>

    {#if activeSection === 'create'}
        <div class="create-form">
            <div class="col">
                <h3>DADOS TÉCNICOS</h3>
                <div class="field"><label>NOME</label> <input type="text" bind:value={draft.name} placeholder="Ex: Espada Laser" /></div>
                <div class="row">
                    <div class="field"><label>TIPO</label> <select bind:value={draft.systemTag}>{#each TAGS as t} <option value={t}>{t}</option> {/each}</select></div>
                    <div class="field"><label>RARIDADE</label> <select bind:value={draft.rarity}>{#each RARITIES as r} <option value={r}>{r}</option> {/each}</select></div>
                </div>
                <div class="field"><label>TAG DE SÉRIE (BASE)</label> <input type="text" bind:value={serialBase} placeholder="Ex: MVB-01" style="color: #00ff41;" disabled={isManualMode} /></div>
                <div class="field"><label>IMAGEM (URL)</label> <input type="text" bind:value={draft.img} /></div>
                <div class="preview-card-box">
                    <span class="preview-label">CARD PREVIEW</span>
                    <StoreCard item={{...draft, price: (draft.price || suggPrice)}} />
                </div>
            </div>
            <div class="col grow">
                <h3>ECONOMIA & MECÂNICA</h3>
                <div class="row">
                    <div class="field"><label>CUSTO PB (Auto: {suggPB})</label> <input type="number" bind:value={draft.system.costPerDie} /></div>
                    <div class="field"><label>CUSTO XP (Auto: {suggXP})</label> <input type="number" bind:value={draft.system.xpCost} /></div>
                    <div class="field"><label>PREÇO (Auto: {suggPrice})</label> <input type="number" bind:value={draft.price} style="color:#ffcc00" /></div>
                    <div class="field"><label>ESTOQUE (-1 = Infinito)</label> <input type="number" bind:value={draft.system.stock} placeholder="-1" /></div>
                </div>
                <div class="desc-header">
                    <h3>EDITOR DE DOCUMENTO</h3>
                    <button class="mode-btn" class:active={isManualMode} on:click={() => isManualMode = !isManualMode}>
                        {isManualMode ? "MODO HTML PURO (ATIVADO)" : "MODO TEMPLATE GAMA"}
                    </button>
                </div>
                <div class="editor-area">
                    {#if !isManualMode}
                        <div class="field grow">
                            <label>DESCRIÇÃO (Use *palavra* para negrito)</label>
                            <textarea class="input-desc" bind:value={simpleDesc} placeholder="Descreva o poder aqui..."></textarea>
                        </div>
                        <div class="field">
                            <label>AVISOS / FALHAS (Opcional)</label>
                            <textarea class="input-warn" bind:value={simpleWarn} placeholder="Ex: Requer 1 de Willpower para ativar."></textarea>
                        </div>
                    {:else}
                        <div class="field grow">
                            <label>CÓDIGO HTML COMPLETO</label>
                            <textarea class="input-raw" bind:value={draft.system.description} placeholder="Cole seu HTML/CSS aqui..."></textarea>
                        </div>
                    {/if}
                </div>
                <div class="html-preview-box">
                    <label>PREVIEW DO DOCUMENTO FINAL:</label>
                    <div class="render-window">{@html previewHTML}</div>
                </div>
                <button class="save-btn" on:click={saveItem}><i class="fas fa-save"></i> COMPILAR & SALVAR</button>
            </div>
        </div>

    {:else if activeSection === 'manage'}
        <div class="list">
            {#each storeItems as item}
                <div class="row-item">
                    <img src={item.img} /> <span>{item.name}</span>
                    <div class="acts">
                        <button on:click={() => editItem(item)}>EDITAR</button>
                        <button class="del" on:click={() => deleteItem(item.id)}>REMOVER</button>
                    </div>
                </div>
            {/each}
        </div>

    {:else if activeSection === 'archive'}
        <div class="archive-view">
            <div class="header-info"><span>TOTAL DE ARQUIVOS: {archiveItems.length}</span></div>
            <div class="items-list">
                {#each archiveItems as item}
                    {@const inStore = storeItems.some(s => s.id === item.id)}
                    <div class="db-row" class:is-store={inStore}>
                        <img src={item.img} />
                        <div class="info"><span class="name">{item.name}</span><span class="meta">{item.systemTag}</span></div>
                        <div class="controls">
                            <button class="toggle-btn" class:active={inStore} on:click={() => toggleStore(item)}>{inStore ? "VENDENDO" : "OFFLINE"}</button>
                            <button class="icon-btn" on:click={() => editItem(item)} title="Editar"><i class="fas fa-edit"></i></button>
                            <button class="icon-btn del" on:click={() => deletePermanent(item.id)} title="Deletar"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                {/each}
            </div>
        </div>

    {:else if activeSection === 'players'}
        <div class="players-layout">
            <div class="players-sidebar">
                {#each playerList as p}
                    <div class="player-tab" class:active={inspectedPlayer?.id === p.id} on:click={() => openInspector(p)}>
                        <div class="tab-indicator" style="background: {p.color}"></div>
                        <span class="p-name">{p.name}</span>
                        <span class="p-coins">{p.coins} MC</span>
                    </div>
                {/each}
            </div>

            <div class="inspection-panel">
                {#if inspectedPlayer}
                    <div class="insp-header">
                        <h2>{inspectedPlayer.name.toUpperCase()}</h2>
                        
                        <div class="coin-ops">
                            <span class="current-money">{inspectedPlayer.coins} MC</span>
                            <div class="transact-grp">
                                <input type="number" bind:value={transactionValues[inspectedPlayer.id]} placeholder="0" />
                                <button class="add" on:click={() => modifyCoins(inspectedPlayer.id, 'add')}>+</button>
                                <button class="sub" on:click={() => modifyCoins(inspectedPlayer.id, 'remove')}>-</button>
                            </div>
                        </div>
                    </div>

                    <div class="insp-inventory">
                        <span class="sec-label">INVENTÁRIO ({inspectedPlayer.inventory.length} ITENS)</span>
                        <div class="inv-list">
                            {#if inspectedPlayer.inventory.length === 0}
                                <div class="empty-inv">Nenhum item encontrado.</div>
                            {/if}
                            {#each inspectedPlayer.inventory as item}
<div class="inv-row-item" class:is-pass={item.isPassItem}>
    <img src={item.img} class="item-thumb" />
    <div class="item-det">
        <span class="i-name">
            {item.name} 
            {#if item.isPassItem}<small style="color: #00fbff;">[RECOMPENSA_PASSE]</small>{/if}
        </span>
        <span class="i-meta">{item.systemTag} • {item.rarity}</span>
        {#if item.active} <span class="active-badge">ATIVO</span> {/if}
    </div>
    <button class="btn-trash" on:click={() => removeItemFromPlayer(item.uniqueId)} title="Remover do Jogador">
        <i class="fas fa-trash"></i>
    </button>
</div>
                            {/each}
                        </div>
                    </div>
                {:else}
                    <div class="no-select-msg">SELECIONE UM JOGADOR PARA GERENCIAR</div>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    .admin-panel { height: 100%; display: flex; flex-direction: column; background: #111; font-family: 'Consolas', monospace; color: #ccc; }
    .admin-nav { display: flex; background: #000; border-bottom: 1px solid #333; }
    .admin-nav button { flex: 1; padding: 12px; background: none; border: none; color: #555; font-weight: bold; cursor: pointer; transition: 0.2s; }
    .admin-nav button:hover { color: #fff; background: #222; }
    .admin-nav button.active { color: #fff; background: #222; border-bottom: 2px solid #00ff41; text-shadow: 0 0 5px #00ff41; }
    
    /* FORM & GERAL */
    .create-form { display: flex; gap: 20px; padding: 20px; flex: 1; overflow-y: auto; }
    .col { display: flex; flex-direction: column; gap: 15px; width: 320px; }
    .col.grow { flex: 1; width: auto; }
    h3 { color: #00ff41; border-bottom: 1px dashed #444; padding-bottom: 5px; margin: 0; font-size: 12px; letter-spacing: 1px; }
    .field { display: flex; flex-direction: column; gap: 5px; }
    .field label { font-size: 10px; color: #888; }
    .row { display: flex; gap: 10px; }
    .row .field { flex: 1; }
    input, select, textarea { background: #050505; border: 1px solid #444; color: #fff; padding: 8px; width: 100%; box-sizing: border-box; font-family: inherit; font-size: 12px; transition: 0.2s; }
    input:focus, select:focus, textarea:focus { border-color: #00ff41; outline: none; }
    
    .input-desc { height: 100px; resize: none; color: #ddd; }
    .input-warn { height: 60px; resize: none; color: #00fbff; border-color: #00fbff; }
    .input-raw { height: 200px; resize: none; font-family: monospace; color: #00ff41; border: 1px dashed #00ff41; }
    .desc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
    .mode-btn { background: #222; border: 1px solid #555; color: #888; padding: 5px 10px; font-size: 10px; cursor: pointer; }
    .mode-btn.active { border-color: #00ff41; color: #00ff41; background: #000; }
    .html-preview-box { flex: 1; display: flex; flex-direction: column; gap: 5px; min-height: 200px; border: 1px solid #333; padding: 5px; background: #000; overflow: hidden; }
    .render-window { flex: 1; overflow-y: auto; zoom: 0.8; }
    .save-btn { background: #00ff41; color: #000; font-weight: bold; border: none; padding: 15px; cursor: pointer; margin-top: 10px; font-size: 14px; letter-spacing: 1px; }
    .save-btn:hover { box-shadow: 0 0 15px #00ff41; }
    .preview-card-box { margin-top: auto; display: flex; flex-direction: column; align-items: center; border-top: 1px solid #222; padding-top: 10px; }
    .preview-label { font-size: 9px; color: #666; margin-bottom: 5px; }

    /* LISTAS PADRÃO */
    .list, .archive-view { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 8px; }
    .row-item, .db-row { display: flex; align-items: center; gap: 10px; padding: 8px; border-bottom: 1px solid #222; background: #1a1a1a; }
    .row-item img, .db-row img { width: 35px; height: 35px; border: 1px solid #444; }
    .info { flex: 1; display: flex; flex-direction: column; }
    .meta { font-size: 10px; color: #666; }
    .controls, .acts { display: flex; gap: 5px; margin-left: auto; }
    .toggle-btn { padding: 5px 10px; font-size: 10px; cursor: pointer; border: 1px solid #555; background: #000; color: #555; width: 80px; }
    .toggle-btn.active { border-color: #00ff41; color: #00ff41; background: rgba(0, 255, 65, 0.1); }
    .icon-btn { width: 30px; height: 30px; border: none; background: #222; color: #ccc; cursor: pointer; }
    .icon-btn.del:hover { background: #ff3333; color: #fff; }

    /* PLAYERS LAYOUT (NOVO) */
    .players-layout { display: flex; height: 100%; overflow: hidden; }
    .players-sidebar { width: 220px; background: #080808; border-right: 1px solid #333; overflow-y: auto; display: flex; flex-direction: column; }
    .player-tab { display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #222; cursor: pointer; position: relative; transition: 0.2s; }
    .player-tab:hover { background: #111; }
    .player-tab.active { background: #1a1a1a; }
    .tab-indicator { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; }
    .p-name { font-weight: bold; color: #eee; flex: 1; font-size: 14px; }
    .p-coins { font-size: 11px; color: #ffcc00; font-weight: bold; }

    .inspection-panel { flex: 1; background: #111; padding: 20px; display: flex; flex-direction: column; overflow: hidden; }
    .no-select-msg { height: 100%; display: flex; align-items: center; justify-content: center; color: #444; font-weight: bold; letter-spacing: 1px; border: 2px dashed #222; }

    .insp-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #444; padding-bottom: 15px; margin-bottom: 15px; }
    .insp-header h2 { margin: 0; color: #fff; font-size: 20px; letter-spacing: 2px; }
    
    .coin-ops { display: flex; align-items: center; gap: 20px; }
    .current-money { font-size: 24px; color: #ffcc00; font-weight: bold; text-shadow: 0 0 10px #ffcc00; }
    .transact-grp { display: flex; gap: 5px; }
    .transact-grp input { width: 80px; text-align: center; font-size: 14px; background: #000; border: 1px solid #444; }
    .transact-grp button { width: 30px; font-weight: bold; cursor: pointer; border: none; }
    .add { background: #00ff41; color: #000; }
    .sub { background: #ff3333; color: #fff; }

    .insp-inventory { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .sec-label { font-size: 11px; color: #666; margin-bottom: 10px; display: block; font-weight: bold; }
    .inv-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 5px; padding-right: 5px; }
    .empty-inv { padding: 20px; text-align: center; color: #444; font-style: italic; border: 1px dashed #333; }

    .inv-row-item { display: flex; align-items: center; gap: 15px; background: #181818; padding: 10px; border: 1px solid #333; border-radius: 4px; transition: 0.2s; }
    .inv-row-item:hover { border-color: #555; background: #222; }
    .item-thumb { width: 40px; height: 40px; border: 1px solid #555; background: #000; }
    .item-det { flex: 1; display: flex; flex-direction: column; }
    .i-name { font-weight: bold; color: #fff; font-size: 14px; }
    .i-meta { font-size: 10px; color: #888; text-transform: uppercase; }
    .active-badge { color: #00ff41; font-size: 9px; font-weight: bold; margin-top: 2px; letter-spacing: 1px; }
    .btn-trash { background: transparent; border: 1px solid #444; color: #666; width: 30px; height: 30px; cursor: pointer; border-radius: 4px; transition: 0.2s; }
    .btn-trash:hover { border-color: #ff3333; color: #ff3333; background: rgba(255, 51, 51, 0.1); }
</style>