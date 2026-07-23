<script>
    import { PassSystem } from '../PassSystem.js';
    import { StoreDatabase } from '../StoreDatabase.js';
    import { onMount } from 'svelte';
    import StoreCard from '../StoreCard.svelte'; 

    // --- DADOS ---
    let rewardsMap = [];
    let archive = [];
    let filteredArchive = [];
    
    // --- ESTADOS DE UI ---
    let selectedCell = null; // { weekIdx, tier }
    let activeTab = 'list'; // 'list' | 'form' | 'seasons'
    let formMode = 'create'; // 'create' | 'edit'
    let searchQuery = "";

    // --- ESTADOS DE TEMPORADAS ---
    let seasonsList = [];
    let currentSeason = {};
    let editSeasonId = "";
    let editSeasonName = "";
    let editSeasonStatus = "closed";
    let editStartDateStr = "";
    let editEndDateStr = "";
    let newSeasonName = "";
    let newSeasonIdInput = "";
    
    // --- DRAFT (FORMULÁRIO) ---
    const emptyItem = {
        id: null, name: "", systemTag: "Passe", rarity: "Comum", price: 0,
        img: "icons/svg/item-bag.svg",
        system: { description: "", costPerDie: 0, xpCost: 0, stock: -1, serialBase: "BP-00", isManual: false }
    };
    let draft = JSON.parse(JSON.stringify(emptyItem));

    // Variáveis do Editor de Texto
    let simpleDesc = "";
    let simpleWarn = "";
    let isManualMode = false;

    // Constantes
    const TAGS = ["Passe", "Poder Principal", "Poder Secundario", "Habilidade Especial", "Item", "Veiculo", "Moeda"];
    const RARITIES = ["Comum", "Raro", "Lendário", "Mítico", "Universal", "Multiversal"];

    // Preview Reativo (Sincronizado com o App)
    $: previewHTML = isManualMode ? draft.system.description : generateHTML(simpleDesc, simpleWarn, draft.system.serialBase, draft.name, draft.rarity, draft.systemTag);

    // O item que será renderizado no Preview
    $: previewItem = {
        ...draft,
        system: { ...draft.system, description: previewHTML }
    };

    onMount(() => {
        if (StoreDatabase.getArchive) {
            loadData();
        } else {
            setTimeout(loadData, 1000);
        }
    });

    function loadData() {
        rewardsMap = PassSystem.getRewardsMap();
        archive = StoreDatabase.getArchive() || [];
        seasonsList = PassSystem.getSeasonsList();
        currentSeason = PassSystem.getSeasonData();
        selectSeasonForEdit(currentSeason.id || "Season01_PASS");
        filterList();
    }

    function toInputDate(timestamp) {
        if (!timestamp) return "";
        const d = new Date(timestamp);
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    function fromInputDate(str) {
        if (!str) return null;
        return new Date(str).getTime();
    }

    function selectSeasonForEdit(sid) {
        const found = seasonsList.find(s => s.id === sid) || currentSeason;
        editSeasonId = found.id || "Season01_PASS";
        editSeasonName = found.name || "Temporada 1";
        editSeasonStatus = found.status || "closed";
        editStartDateStr = toInputDate(found.startDate);
        editEndDateStr = toInputDate(found.endDate);
    }

    async function handleSwitchSeason() {
        await PassSystem.switchSeason(editSeasonId);
        loadData();
        ui.notifications.info(`Temporada [${editSeasonName}] ativada como atual!`);
    }

    async function handleSaveSeasonConfig() {
        await PassSystem.updateSeason({
            id: editSeasonId,
            name: editSeasonName,
            status: editSeasonStatus,
            startDate: fromInputDate(editStartDateStr),
            endDate: fromInputDate(editEndDateStr)
        });
        loadData();
        ui.notifications.info("Configurações da Temporada Atualizadas!");
    }

    async function handleCreateNewSeason() {
        if (!newSeasonName) return ui.notifications.warn("Digite o nome da nova temporada.");
        const created = await PassSystem.createSeason(newSeasonName, newSeasonIdInput ? newSeasonIdInput.trim() : null);
        newSeasonName = "";
        newSeasonIdInput = "";
        loadData();
        ui.notifications.info(`Temporada [${created.name}] criada e selecionada como atual!`);
    }

    function filterList() {
        if (!searchQuery) {
            filteredArchive = archive;
        } else {
            const q = searchQuery.toLowerCase();
            filteredArchive = archive.filter(i => i.name.toLowerCase().includes(q));
        }
    }

    // --- TEMPLATE GENERATOR (GAMA - Padrão Visual do App) ---
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
                    <div class="sidebar-section"><small>STATUS</small><div class="status-box">PASSE</div></div>
                    <div class="sidebar-section"><small>NÍVEL</small><div class="rarity-text">${safeText(itemRarity).toUpperCase()}</div></div>
                    <div class="sidebar-section"><small>LOTE</small><p>${safeText(serial)}</p></div>
                </aside>
                <main class="gama-window-main">
                    <div class="scanlines"></div>
                    <h2 class="power-title">${safeText(itemName).toUpperCase()}</h2>
                    <div class="text-content">
                        <p>${formatText(desc)}</p>
                        ${warn ? `<p class="warning-text">[AVISO]: ${formatText(warn)}</p>` : ''}
                    </div>
                </main>
            </div>
        </div>`;
    }

    // --- ALOCAÇÃO ---
    function selectCell(weekIdx, tier) {
        selectedCell = { weekIdx, tier };
    }

    function clearCell(weekIdx, tier) {
        rewardsMap[weekIdx][tier] = null;
    }

    async function assignItem(item) {
        if (!selectedCell) return ui.notifications.warn("Selecione um slot na tabela primeiro.");
        
        // Salva uma versão leve no mapa, mas com dados suficientes pro StoreCard
        rewardsMap[selectedCell.weekIdx][selectedCell.tier] = {
            id: item.id,
            name: item.name,
            img: item.img,
            systemTag: item.systemTag,
            rarity: item.rarity,
            // Se for moeda, define tipo currency para o App saber dar dinheiro
            type: (item.systemTag === 'Moeda' || item.type === 'currency') ? 'currency' : 'item'
        };
        
        ui.notifications.info(`Item [${item.name}] alocado.`);
    }

    async function saveConfig() {
        await PassSystem.saveRewardsMap(rewardsMap);
        ui.notifications.info("Matriz do Passe Salva!");
    }

    // --- CRUD ---
    
    function startCreate() {
        draft = JSON.parse(JSON.stringify(emptyItem));
        simpleDesc = ""; simpleWarn = ""; isManualMode = false;
        formMode = 'create';
        activeTab = 'form';
    }

    function startEdit(item) {
        draft = JSON.parse(JSON.stringify(item));
        
        // Garante estrutura
        if (!draft.system) draft.system = {};
        
        if (draft.system.isManual) {
            isManualMode = true;
        } else {
            isManualMode = false;
            simpleDesc = draft.system.rawDesc || "";
            simpleWarn = draft.system.rawWarn || "";
        }
        
        formMode = 'edit';
        activeTab = 'form';
    }

    async function deleteItem(id) {
        await StoreDatabase.deleteFromArchive(id);
        loadData();
        ui.notifications.info("Item apagado.");
    }

    async function saveItem() {
        if (!draft.name) return ui.notifications.warn("Nome é obrigatório.");

        if (!draft.id) draft.id = foundry.utils.randomID();

        // Compila o HTML da descrição antes de salvar
        if (!isManualMode) {
            draft.system.description = generateHTML(simpleDesc, simpleWarn, draft.system.serialBase, draft.name, draft.rarity, draft.systemTag);
            draft.system.rawDesc = simpleDesc;
            draft.system.rawWarn = simpleWarn;
        }
        draft.system.isManual = isManualMode;

        // Salva no banco geral
        await StoreDatabase.createItem(draft);
        loadData();
        
        ui.notifications.info(formMode === 'create' ? "Item Criado!" : "Item Atualizado!");
        
        // Auto-alocação se estiver criando
        if (formMode === 'create' && selectedCell) {
            assignItem(draft);
        }

        activeTab = 'list';
    }

</script>

<div class="pass-admin">
    
    <div class="grid-area">
        <div class="table-header">
            <h3>MATRIZ DE RECOMPENSAS</h3>
            <button class="save-main-btn" on:click={saveConfig}>
                <i class="fas fa-save"></i> SALVAR MATRIZ
            </button>
        </div>
        
        <div class="table-scroll">
            <table>
                <thead>
                    <tr>
                        <th class="w-col">#</th>
                        <th class="gambi">GAMBIARRITE</th>
                        <th class="diam">DIAMANTE</th>
                        <th class="ouro">OURO</th>
                        <th class="prata">PRATA</th>
                        <th class="cobre">COBRE</th>
                    </tr>
                </thead>
                <tbody>
                    {#each rewardsMap as week, idx}
                        <tr>
                            <td class="week-idx">S{idx + 1}</td>
                            {#each ['gambiarrite', 'diamante', 'ouro', 'prata', 'cobre'] as tier}
                                <td class="cell {tier}" 
                                    class:selected={selectedCell?.weekIdx === idx && selectedCell?.tier === tier}
                                    on:click={() => selectCell(idx, tier)}
                                    on:contextmenu|preventDefault={() => clearCell(idx, tier)}>
                                    
                                    {#if week[tier]}
                                        <div class="content">
                                            <img src={week[tier].img} title={week[tier].name} alt="item"/>
                                            <span class="tiny-name">{week[tier].name}</span>
                                        </div>
                                    {:else}
                                        <span class="empty-plus">+</span>
                                    {/if}
                                </td>
                            {/each}
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
        <div class="help-text">
            <small>Clique = Selecionar | Dir. Clique = Limpar | Selecione um slot e clique na seta da lista para alocar.</small>
        </div>
    </div>

    <aside class="sidebar-tools" style="width: 360px;">
        <div class="tabs">
            <button class:active={activeTab === 'list'} on:click={() => activeTab = 'list'}>DATABASE</button>
            <button class:active={activeTab === 'form'} on:click={startCreate}>CRIAR NOVO</button>
            <button class:active={activeTab === 'seasons'} on:click={() => activeTab = 'seasons'} style="color: #ffcc00;">PASSES / TEMPORADAS</button>
        </div>

        {#if activeTab === 'list'}
            <div class="tool-content">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Buscar..." bind:value={searchQuery} on:input={filterList} />
                </div>
                
                <div class="item-list">
                    {#each filteredArchive as item}
                        <div class="db-item">
                            <div class="actions-left">
                                <button class="act-btn edit" on:click={() => startEdit(item)} title="Editar"><i class="fas fa-edit"></i></button>
                                <button class="act-btn del" on:click={() => deleteItem(item.id)} title="Apagar"><i class="fas fa-trash"></i></button>
                            </div>

                            <div class="item-display" on:click={() => assignItem(item)}>
                                <img src={item.img} alt="i" />
                                <div class="inf">
                                    <div class="n">{item.name}</div>
                                    <div class="t">{item.systemTag} • {item.rarity}</div>
                                </div>
                            </div>

                            <button class="assign-btn" on:click={() => assignItem(item)} title="Alocar no Slot Selecionado">
                                <i class="fas fa-arrow-left"></i>
                            </button>
                        </div>
                    {/each}
                </div>
            </div>
        {:else if activeTab === 'form'}
            <div class="tool-content create-mode">
                <div class="form-title">{formMode === 'create' ? 'CRIAR NOVO ITEM' : 'EDITAR ITEM'}</div>
                
                <div class="form-group">
                    <label>NOME</label>
                    <input type="text" bind:value={draft.name} />
                </div>
                
                <div class="row">
                    <div class="field"><label>TIPO</label> <select bind:value={draft.systemTag}>{#each TAGS as t} <option value={t}>{t}</option> {/each}</select></div>
                    <div class="field"><label>RARIDADE</label> <select bind:value={draft.rarity}>{#each RARITIES as r} <option value={r}>{r}</option> {/each}</select></div>
                </div>

                <div class="form-group">
                    <label>IMAGEM</label>
                    <div class="img-row">
                        <input type="text" bind:value={draft.img} />
                        <img src={draft.img} class="preview-mini" alt="p"/>
                    </div>
                </div>

                <div class="row">
                    <div class="field"><label>SERIAL</label> <input type="text" bind:value={draft.system.serialBase} /></div>
                    <div class="field"><label>ESTOQUE</label> <input type="number" bind:value={draft.system.stock} placeholder="-1" /></div>
                </div>

                <div class="desc-header">
                    <label>DESCRIÇÃO</label>
                    <button class="mini-mode" on:click={() => isManualMode = !isManualMode}>
                        {isManualMode ? "MODO HTML" : "MODO FÁCIL"}
                    </button>
                </div>

                {#if !isManualMode}
                    <textarea class="input-desc" bind:value={simpleDesc} placeholder="Descrição visual do item..."></textarea>
                    <textarea class="input-warn" bind:value={simpleWarn} placeholder="Avisos de regra (opcional)..."></textarea>
                {:else}
                    <textarea class="input-raw" bind:value={draft.system.description} placeholder="Código HTML completo..."></textarea>
                {/if}

                <div class="preview-box">
                    <label>PREVIEW:</label>
                    <div class="card-render">
                        <StoreCard item={previewItem} />
                    </div>
                </div>

                <div class="create-actions">
                    <button class="do-save" on:click={saveItem}>
                        {formMode === 'create' ? 'CRIAR ITEM' : 'SALVAR ALTERAÇÕES'}
                    </button>
                    <button class="do-cancel" on:click={() => activeTab = 'list'}>CANCELAR</button>
                </div>
            </div>

        {:else if activeTab === 'seasons'}
            <div class="tool-content create-mode" style="overflow-y: auto; gap: 14px; padding: 12px;">
                <div style="border-bottom: 1px dashed #00ff41; padding-bottom: 10px;">
                    <h4 style="color: #00ff41; margin: 0 0 6px 0; font-size: 13px;"><i class="fas fa-calendar-alt"></i> SELECIONAR TEMPORADA ATUAL</h4>
                    <small style="color: #888; font-size: 10px;">Alterna entre os passes criados para carregar a matriz na tela e ativar para os jogadores.</small>
                    <div style="display: flex; gap: 6px; margin-top: 8px;">
                        <select bind:value={editSeasonId} on:change={() => selectSeasonForEdit(editSeasonId)} style="flex: 1; background: #000; border: 1px solid #444; color: #fff; padding: 6px; font-size: 11px;">
                            {#each seasonsList as s}
                                <option value={s.id}>{s.name} [{s.id}] {s.status === 'active' ? '(ATIVO)' : ''}</option>
                            {/each}
                        </select>
                        <button class="save-main-btn" on:click={handleSwitchSeason} style="padding: 6px 12px; font-size: 10px; white-space: nowrap;">
                            <i class="fas fa-bolt"></i> ATIVAR PASSE
                        </button>
                    </div>
                </div>

                <div style="border-bottom: 1px dashed #333; padding-bottom: 12px;">
                    <h4 style="color: #fff; margin: 0 0 10px 0; font-size: 12px;"><i class="fas fa-sliders-h"></i> CONFIGURAR PASSE SELECIONADO</h4>
                    
                    <div class="form-group" style="margin-bottom: 8px;">
                        <label>ID DO PASSE (Imutável)</label>
                        <input type="text" bind:value={editSeasonId} disabled style="background: #111; color: #666;" />
                    </div>

                    <div class="form-group" style="margin-bottom: 8px;">
                        <label>NOME EXIBIDO DA TEMPORADA</label>
                        <input type="text" bind:value={editSeasonName} placeholder="Ex: Temporada 1 - Cyberpunk" />
                    </div>

                    <div class="form-group" style="margin-bottom: 8px;">
                        <label>STATUS DA TEMPORADA</label>
                        <select bind:value={editSeasonStatus}>
                            <option value="active">ATIVO (Jogadores progridem e resgatam)</option>
                            <option value="closed">FECHADO / INATIVO</option>
                        </select>
                    </div>

                    <div class="row" style="margin-bottom: 10px;">
                        <div class="field">
                            <label>DATA DE INÍCIO</label>
                            <input type="datetime-local" bind:value={editStartDateStr} style="font-size: 10px;" />
                        </div>
                        <div class="field">
                            <label>DATA DE TÉRMINO</label>
                            <input type="datetime-local" bind:value={editEndDateStr} style="font-size: 10px;" />
                        </div>
                    </div>

                    <button class="do-save" on:click={handleSaveSeasonConfig} style="width: 100%; font-size: 11px; padding: 8px;">
                        <i class="fas fa-save"></i> SALVAR CONFIGURAÇÕES DO PASSE
                    </button>
                </div>

                <div>
                    <h4 style="color: #ffcc00; margin: 0 0 6px 0; font-size: 12px;"><i class="fas fa-plus-circle"></i> CRIAR NOVO PASSE DE BATALHA</h4>
                    <small style="color: #999; font-size: 10px; display: block; margin-bottom: 10px;">Cria uma nova temporada mantendo os dados das anteriores e matriz 100% limpa.</small>
                    
                    <div class="form-group" style="margin-bottom: 8px;">
                        <label>NOME DO NOVO PASSE</label>
                        <input type="text" bind:value={newSeasonName} placeholder="Ex: Temporada 2 - O Retorno" />
                    </div>

                    <div class="form-group" style="margin-bottom: 10px;">
                        <label>ID DO PASSE (Opcional, ex: Season02_PASS)</label>
                        <input type="text" bind:value={newSeasonIdInput} placeholder="Season02_PASS" />
                    </div>

                    <button class="do-save" on:click={handleCreateNewSeason} style="width: 100%; background: #ffcc00; color: #000; font-size: 11px; padding: 8px;">
                        <i class="fas fa-magic"></i> CRIAR E SELECIONAR NOVO PASSE
                    </button>
                </div>
            </div>
        {/if}
    </aside>
</div>

<style>
    .pass-admin { display: flex; height: 100%; width: 100%; background: #080808; color: #ccc; font-family: 'Share Tech Mono', monospace; overflow: hidden; }
    
    .grid-area { flex: 1; display: flex; flex-direction: column; padding: 15px; overflow: hidden; border-right: 1px solid #333; }
    .table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 10px; }
    .table-header h3 { margin: 0; color: #00ff41; font-size: 14px; letter-spacing: 1px; }
    
    .save-main-btn { background: #00ff41; color: #000; border: none; padding: 8px 20px; font-weight: bold; cursor: pointer; border-radius: 2px; }
    .save-main-btn:hover { box-shadow: 0 0 15px #00ff41; color: #fff; }

    .table-scroll { flex: 1; overflow-y: auto; background: #000; border: 1px solid #333; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th { position: sticky; top: 0; background: #111; padding: 8px; border-bottom: 1px solid #444; z-index: 10; font-size: 9px; }
    .gambi { color: #ff3333; } .diam { color: #00fbff; } .ouro { color: #ffcc00; } .prata { color: #e0e0e0; } .cobre { color: #cd7f32; }
    
    td { border: 1px solid #222; text-align: center; height: 50px; width: 18%; vertical-align: middle; position: relative; }
    .week-idx { font-weight: bold; color: #555; background: #0a0a0a; width: 30px; }

    .cell { cursor: pointer; transition: 0.1s; }
    .cell:hover { background: rgba(255,255,255,0.05); }
    .cell.selected { border: 2px solid #00ff41; background: rgba(0, 255, 65, 0.05); }
    .cell.selected::after { content: "▼"; position: absolute; top: 0; right: 0; color: #00ff41; font-size: 8px; padding: 2px; }
    
    .content { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; width: 100%; }
    .content img { width: 28px; height: 28px; object-fit: contain; }
    .tiny-name { font-size: 8px; max-width: 90%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff; margin-top: 4px; }
    .empty-plus { color: #222; font-size: 20px; font-weight: bold; }
    .help-text { padding: 5px; color: #555; font-size: 9px; text-align: center; }

    /* SIDEBAR */
    .sidebar-tools { width: 300px; background: #0f0f0f; display: flex; flex-direction: column; }
    .tabs { display: flex; border-bottom: 1px solid #333; }
    .tabs button { flex: 1; background: #151515; border: none; color: #666; padding: 12px; cursor: pointer; font-weight: bold; font-size: 11px; }
    .tabs button.active { background: #0f0f0f; color: #fff; border-bottom: 2px solid #00ff41; }

    .tool-content { flex: 1; display: flex; flex-direction: column; padding: 10px; overflow: hidden; gap: 10px; }
    .search-box { display: flex; align-items: center; background: #000; border: 1px solid #333; padding: 5px 10px; }
    .search-box i { color: #555; margin-right: 5px; }
    .search-box input { background: transparent; border: none; color: #fff; width: 100%; font-family: inherit; }
    
    /* ITEM LIST */
    .item-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 5px; }
    .db-item { display: flex; align-items: center; gap: 8px; padding: 6px; background: #181818; border: 1px solid #222; transition: 0.2s; }
    .db-item:hover { border-color: #555; background: #222; }
    
    .actions-left { display: flex; flex-direction: column; gap: 2px; }
    .act-btn { width: 20px; height: 20px; border: none; background: #222; color: #666; cursor: pointer; font-size: 10px; }
    .act-btn:hover { color: #fff; background: #444; }
    .act-btn.del:hover { color: #f33; }

    .item-display { flex: 1; display: flex; align-items: center; gap: 8px; cursor: pointer; }
    .item-display img { width: 32px; height: 32px; border: 1px solid #444; background: #000; }
    .inf { flex: 1; overflow: hidden; }
    .n { font-weight: bold; font-size: 12px; color: #eee; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .t { font-size: 9px; color: #00ff41; }

    .assign-btn { width: 30px; height: 100%; background: transparent; border: none; color: #444; cursor: pointer; font-size: 14px; }
    .assign-btn:hover { color: #00ff41; }

    /* CREATE MODE */
    .create-mode { gap: 10px; overflow-y: auto; }
    .form-title { color: #00ff41; font-weight: bold; border-bottom: 1px dashed #333; padding-bottom: 5px; text-align: center; }
    .form-group { display: flex; flex-direction: column; gap: 3px; }
    .form-group label { font-size: 9px; color: #888; }
    input, select { background: #000; border: 1px solid #333; color: #fff; padding: 6px; width: 100%; font-family: inherit; font-size: 11px; }
    .row { display: flex; gap: 5px; } .field { flex: 1; }
    .img-row { display: flex; gap: 5px; align-items: center; }
    .preview-mini { width: 30px; height: 30px; border: 1px solid #333; background: #000; }

    .desc-header { display: flex; justify-content: space-between; align-items: center; margin-top: 5px; }
    .mini-mode { font-size: 9px; background: #222; border: 1px solid #444; color: #ccc; cursor: pointer; }
    .input-desc { height: 60px; resize: none; background: #000; border: 1px solid #333; color: #ddd; padding: 5px; }
    .input-warn { height: 30px; border-color: #00fbff; color: #00fbff; background: #000; padding: 5px; }
    .input-raw { height: 100px; font-family: monospace; color: #00ff41; background: #000; border: 1px solid #333; }

    .preview-box { border: 1px solid #333; padding: 5px; background: #000; margin-top: 5px; }
    .preview-box label { font-size: 9px; color: #666; display: block; margin-bottom: 2px; }
    .card-render { transform: scale(0.9); transform-origin: top left; }

    .create-actions { display: flex; gap: 5px; margin-top: 10px; }
    .do-save { flex: 2; background: #00ff41; color: #000; font-weight: bold; padding: 10px; border: none; cursor: pointer; }
    .do-cancel { flex: 1; background: #333; color: #fff; border: none; cursor: pointer; }
</style>