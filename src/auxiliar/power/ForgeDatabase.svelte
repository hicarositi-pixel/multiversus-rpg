<script>
    import { createEventDispatcher } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import { PowerDatabase } from '../PowerDatabase.js';
    import { PowerParser } from './PowerParser.js'; 

    export let powersArchive = [];
    const dispatch = createEventDispatcher();
    const MODULE_ID = "multiversus-rpg";

    let dbMode = "studio"; // 'studio' ou 'ficha'

    let searchQuery = "";
    let selectedCategory = "Todas";
    let selectedRarity = "Todas";
    let searchTag = ""; 

    const CATEGORIES = ["Todas", "origem", "principal", "secundario", "habilidade"];
    const RARITIES = ["Todas", "Comum", "Raro", "Lendário", "Mítico", "Universal", "Multiversal"];

    const isPowerFicha = (p) => p.isFicha || p.source === "Ficha (Foundry)" || p.source === "Terminal" || p.rawItem?.flags?.[MODULE_ID]?.isFicha;

    $: filteredPowers = powersArchive.filter(p => {
        const matchMode = dbMode === 'ficha' ? isPowerFicha(p) : !isPowerFicha(p);
        const matchSearch = searchQuery === "" || p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCat = selectedCategory === "Todas" || p.category === selectedCategory;
        const matchRarity = selectedRarity === "Todas" || p.rarity === selectedRarity;
        const pTags = p.rawItem?.flags?.[MODULE_ID]?.tags || [];
        const matchTag = searchTag === "" || pTags.some(t => t.toLowerCase().includes(searchTag.toLowerCase()));
        return matchMode && matchSearch && matchCat && matchRarity && matchTag;
    });

    function adaptItemType(originalType) {
        const validTypes = game.documentTypes.Item;
        if (validTypes.includes(originalType)) return originalType;
        const fallbacks = ["power", "poder", "habilidade", "feature", "ability", "Item"];
        for (let t of fallbacks) { if (validTypes.includes(t)) return t; }
        return validTypes[0];
    }

    async function promptAddTag(power) {
        new Dialog({
            title: "Adicionar Classificador (Tag)",
            content: `<input type="text" id="new-cyber-tag" placeholder="Ex: Fogo, Cyberware..." style="width: 100%; margin-bottom: 10px;"/>`,
            buttons: { add: { label: "ADICIONAR", callback: async (html) => { let newTag = html.find('#new-cyber-tag').val().trim(); if (newTag) await addTagToPower(power, newTag); } } },
            default: "add"
        }).render(true);
    }

    async function addTagToPower(power, tag) {
        foundry.utils.setProperty(power.rawItem, `flags.${MODULE_ID}.tags`, power.rawItem.flags?.[MODULE_ID]?.tags || []);
        if (!power.rawItem.flags[MODULE_ID].tags.includes(tag)) {
            power.rawItem.flags[MODULE_ID].tags.push(tag);
            await PowerDatabase.savePower(power);
            dispatch('refresh');
        }
    }

    async function removeTag(power, tagToRemove) {
        let tags = power.rawItem.flags?.[MODULE_ID]?.tags || [];
        power.rawItem.flags[MODULE_ID].tags = tags.filter(t => t !== tagToRemove);
        await PowerDatabase.savePower(power);
        dispatch('refresh');
    }

    // ========================================================================
    // AÇÕES DA DATABASE E DA DESTRUIÇÃO (O SEU EXPURGO)
    // ========================================================================
    
    // Deleta apenas 1
    async function deletePower(id, name) {
        await PowerDatabase.deletePower(id);
        powersArchive = powersArchive.filter(p => p.id !== id);
        ui.notifications.info(`[${name}] deletado.`);
        dispatch('refresh');
    }

    // A SOLUÇÃO: BOTÃO QUE OBRIGA O DATABASE A DELETAR TUDO
    async function NUKE_DATABASE() {
        const confirmed = await Dialog.confirm({
            title: "CÓDIGO VERMELHO",
            content: `<p style="color:red;">ISSO VAI DELETAR ABSOLUTAMENTE TODOS OS PODERES SALVOS. CERTEZA?</p>`,
            yes: () => true, no: () => false, defaultYes: false
        });
        
        if (confirmed) {
            ui.notifications.warn("Formatando sistema...");
            // Como eu não sei como seu backend guarda, eu loopo e mato um por um
            for (let p of powersArchive) {
                await PowerDatabase.deletePower(p.id);
            }
            powersArchive = [];
            ui.notifications.info("DATA CORE FORMATADO. Crie poderes limpos agora.");
            dispatch('refresh');
        }
    }

    function editInStudio(power) {
        dispatch('edit', power); 
        ui.notifications.info(`Enviando [${power.name}] para o Studio...`);
    }

    function sendToTerminal(power) {
        dispatch('sendTerminal', power); 
        ui.notifications.info(`Conectando [${power.name}] ao Terminal...`);
    }

    function exportPowerText(power) {
        if (!power.rawItem) return ui.notifications.error("Estrutura corrompida.");
        if (!power.rawItem.flags) power.rawItem.flags = {};
        const text = PowerParser.exportToText(power.rawItem);
        navigator.clipboard.writeText(text).then(() => {
            ui.notifications.info(`Texto copiado no Formato Livro!`);
        });
    }

    async function injectPower(power) {
        const tokens = canvas.tokens.controlled;
        if (tokens.length === 0) return ui.notifications.warn("Selecione um Token no mapa.");
        let itemToInject = foundry.utils.deepClone(power.rawItem);
        itemToInject.type = adaptItemType(itemToInject.type || "power");
        for (let token of tokens) { await token.actor.createEmbeddedDocuments("Item", [itemToInject]); }
        ui.notifications.info(`Ficha injetada.`);
    }

    async function createWorldItem(power) {
        let itemToCreate = foundry.utils.deepClone(power.rawItem);
        itemToCreate.type = adaptItemType(itemToCreate.type || "power");
        await Item.create(itemToCreate);
        ui.notifications.info(`Ficha gerada no diretório.`);
    }

    function handleDragStart(event, power) {
        let dragData = foundry.utils.deepClone(power.rawItem);
        dragData.type = adaptItemType(dragData.type || "power");
        event.dataTransfer.setData("text/plain", JSON.stringify({ type: "Item", data: dragData }));
    }

    async function handleDrop(event) {
        event.preventDefault();
        const dataText = event.dataTransfer.getData('text/plain');
        if (!dataText) return;
        try {
            const dropData = JSON.parse(dataText);
            let rawObj = null;
            if (dropData.type === "Item" && dropData.uuid) {
                const item = await fromUuid(dropData.uuid);
                if (item) rawObj = item.toObject();
            } else if (dropData.type === "Item" && dropData.data) { rawObj = dropData.data; }

            if (rawObj) {
                foundry.utils.setProperty(rawObj, `flags.${MODULE_ID}.isFicha`, true);
                delete rawObj._id;
                const dbPayload = { name: rawObj.name, category: rawObj.flags?.[MODULE_ID]?.category || "principal", rarity: rawObj.flags?.[MODULE_ID]?.rarity || "Comum", img: rawObj.img || "icons/svg/lightning.svg", isFicha: true, source: "Ficha (Foundry)", rawItem: rawObj };
                const result = await PowerDatabase.savePower(dbPayload);
                if (result.success) { ui.notifications.info(`Ficha clonada!`); dispatch('refresh'); }
            }
        } catch (err) { console.error("Falha no Drop:", err); }
    }
</script>

<div class="forge-database" in:fade={{duration: 200}} on:drop={handleDrop} on:dragover={(e) => e.preventDefault()}>
    
    <div class="db-tabs">
        <button class="db-tab {dbMode === 'studio' ? 'active' : ''}" on:click={() => dbMode = 'studio'}><i class="fas fa-book-open"></i> ACERVO DO ESTÚDIO</button>
        <button class="db-tab {dbMode === 'ficha' ? 'active' : ''}" on:click={() => dbMode = 'ficha'}><i class="fas fa-microchip"></i> MATRIZES DE FICHA</button>
    </div>

    <header class="filter-bar">
        <div class="search-box grow"><i class="fas fa-search"></i><input type="text" bind:value={searchQuery} placeholder="Buscar pelo Nome..."></div>
        <div class="search-box"><i class="fas fa-tags"></i><input type="text" bind:value={searchTag} placeholder="Filtrar Tag..."></div>
        <select bind:value={selectedCategory} class="cyber-select"><option value="Todas">CATEGORIA (*)</option>{#each CATEGORIES as cat} {#if cat !== "Todas"}<option value={cat}>{cat.toUpperCase()}</option>{/if} {/each}</select>
        <select bind:value={selectedRarity} class="cyber-select"><option value="Todas">RARIDADE (*)</option>{#each RARITIES as r} {#if r !== "Todas"}<option value={r}>{r.toUpperCase()}</option>{/if} {/each}</select>
        
        <button class="btn-nuke" on:click={NUKE_DATABASE} title="Deletar TODOS os poderes salvos"><i class="fas fa-radiation"></i> RESETAR MATRIZ</button>
    </header>

    <div class="db-stats">
        <span>EXIBINDO: {filteredPowers.length} REGISTROS</span>
    </div>

    <div class="powers-grid custom-scroll">
        {#each filteredPowers as power (power.id)}
            <div class="power-card {dbMode}" transition:slide|local draggable="true" on:dragstart={(e) => handleDragStart(e, power)}>
                <div class="card-drag-handle" title="Arraste para copiar"><i class="fas fa-grip-vertical"></i></div>
                <div class="card-img"><img src={power.img} alt={power.name}><div class="img-scanline"></div></div>
                <div class="card-info">
                    <h3 class="p-name">{power.name} <span class="format-badge">{dbMode === 'studio' ? 'ESTÚDIO' : 'FICHA'}</span></h3>
                    <div class="p-tags">
                        <span class="tag cat">{power.category}</span><span class="tag rar">{power.rarity}</span>
                        {#each (power.rawItem?.flags?.[MODULE_ID]?.tags || []) as tag}
                            <span class="tag custom" title="Remover Tag" on:contextmenu|preventDefault={() => removeTag(power, tag)}>{tag} <i class="fas fa-times del-tag"></i></span>
                        {/each}
                        <button class="add-tag-btn" on:click={() => promptAddTag(power)} title="Adicionar Classificador"><i class="fas fa-plus"></i> TAG</button>
                    </div>
                </div>

                <div class="card-actions">
                    {#if dbMode === 'studio'}
                        <button class="btn-action b-edit" on:click={() => editInStudio(power)} title="Abrir no Estúdio"><i class="fas fa-hammer"></i></button>
                        <button class="btn-action b-export" on:click={() => exportPowerText(power)} title="Copiar Texto Livro (IA)"><i class="fas fa-copy"></i></button>
                        <button class="btn-action b-term" on:click={() => sendToTerminal(power)} title="Enviar ao Terminal Neural"><i class="fas fa-terminal"></i></button>
                    {:else}
                        <button class="btn-action b-inject" on:click={() => injectPower(power)} title="Injetar no Token"><i class="fas fa-syringe"></i></button>
                        <button class="btn-action b-create" on:click={() => createWorldItem(power)} title="Criar no Diretório"><i class="fas fa-book-medical"></i></button>
                        <button class="btn-action b-term" on:click={() => sendToTerminal(power)} title="Enviar ao Terminal Neural"><i class="fas fa-terminal"></i></button>
                    {/if}
                    <div class="action-divider"></div>
                    <button class="btn-action b-del" on:click={() => deletePower(power.id, power.name)} title="Excluir Registro"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        {/each}

        {#if filteredPowers.length === 0}
            <div class="empty-state"><i class="fas fa-ghost"></i> NENHUM ARQUIVO ENCONTRADO</div>
        {/if}
    </div>
</div>

<style>
    .forge-database { display: flex; flex-direction: column; height: 100%; padding: 15px; gap: 10px; }
    .db-tabs { display: flex; gap: 10px; margin-bottom: 5px; }
    .db-tab { flex: 1; background: rgba(0,0,0,0.4); border: 1px solid #333; color: #666; padding: 10px; font-family: inherit; font-size: 13px; font-weight: bold; cursor: pointer; transition: 0.2s; border-radius: 4px; display: flex; align-items: center; justify-content: center; gap: 10px;}
    .db-tab small { font-weight: normal; opacity: 0.7; font-size: 10px; }
    .db-tab:hover:not(.active) { background: rgba(255,255,255,0.05); color: #aaa; }
    .db-tab.active { background: rgba(0, 212, 255, 0.1); border-color: #00d4ff; color: #00d4ff; box-shadow: inset 0 0 10px rgba(0,212,255,0.2); }
    .filter-bar { display: flex; gap: 10px; background: rgba(0,0,0,0.6); padding: 10px; border: 1px solid #222; border-radius: 4px; flex-wrap: wrap;}
    .search-box { display: flex; align-items: center; background: #050505; border: 1px solid #333; border-radius: 4px; padding: 0 10px; flex: 1; min-width: 150px; transition: 0.2s;}
    .search-box:focus-within { border-color: #00d4ff; }
    .search-box.grow { flex: 2; min-width: 200px; }
    .search-box i { color: #888; transition: 0.2s; }
    .search-box:focus-within i { color: #00d4ff; }
    .search-box input { flex: 1; border: none; background: transparent; padding: 8px; color: #fff; font-family: inherit; font-size: 12px; outline: none; }
    .cyber-select { flex: 1; min-width: 120px; background: #050505; color: #aaa; border: 1px solid #333; padding: 5px 10px; font-family: inherit; font-size: 11px; cursor: pointer; outline: none; border-radius: 4px; transition: 0.2s;}
    .cyber-select:hover { border-color: #00d4ff; color: #00d4ff; }
    
    .btn-nuke { background: rgba(255,0,0,0.1); border: 1px solid #ff3333; color: #ff3333; padding: 5px 15px; font-family: inherit; font-weight: bold; font-size: 11px; cursor: pointer; border-radius: 4px; transition: 0.2s;}
    .btn-nuke:hover { background: #ff3333; color: #fff; box-shadow: 0 0 15px #ff3333;}

    .db-stats { font-size: 10px; color: #00d4ff; font-weight: bold; letter-spacing: 1px; border-bottom: 1px dashed rgba(0, 212, 255, 0.3); padding-bottom: 5px; display: flex; justify-content: space-between; }
    .dim-text { color: #666; font-style: italic; }
    .powers-grid { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 5px; }
    .power-card { display: flex; align-items: center; background: #0a0a0a; border: 1px solid #222; border-left: 3px solid transparent; border-radius: 4px; padding: 8px 8px 8px 0; transition: 0.2s; gap: 10px; }
    .power-card.studio { border-left-color: #ffaa00; }
    .power-card.ficha { border-left-color: #00ff41; }
    .power-card:hover { background: #111; border-color: #444; }
    .card-drag-handle { padding: 10px; color: #333; cursor: grab; display: flex; align-items: center; }
    .power-card:hover .card-drag-handle { color: #00d4ff; }
    .card-drag-handle:active { cursor: grabbing; }
    .card-img { width: 50px; height: 50px; border-radius: 4px; overflow: hidden; position: relative; border: 1px solid #333; flex-shrink: 0; }
    .card-img img { width: 100%; height: 100%; object-fit: cover; }
    .img-scanline { position: absolute; inset: 0; background: linear-gradient(rgba(0,0,0,0) 50%, rgba(0,212,255,0.2) 50%); background-size: 100% 4px; pointer-events: none; }
    .card-info { flex: 1; display: flex; flex-direction: column; overflow: hidden; gap: 5px;}
    .p-name { margin: 0; font-size: 15px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: bold; display: flex; align-items: center; gap: 10px; }
    .format-badge { font-size: 8px; padding: 2px 6px; border-radius: 10px; background: #222; color: #888; border: 1px solid #444; font-weight: normal; letter-spacing: 1px;}
    .power-card.studio .format-badge { color: #ffaa00; border-color: rgba(255, 170, 0, 0.5); background: rgba(255, 170, 0, 0.1); }
    .power-card.ficha .format-badge { color: #00ff41; border-color: rgba(0, 255, 65, 0.5); background: rgba(0, 255, 65, 0.1); }
    .p-tags { display: flex; gap: 5px; flex-wrap: wrap; align-items: center;}
    .tag { font-size: 9px; padding: 3px 6px; border-radius: 2px; font-weight: bold; background: #111; border: 1px solid #333; color: #888; text-transform: uppercase; display: flex; align-items: center; gap: 4px;}
    .tag.rar { color: #ffaa00; border-color: rgba(255, 170, 0, 0.3); }
    .tag.custom { color: #00d4ff; border-color: rgba(0, 212, 255, 0.3); background: rgba(0, 212, 255, 0.05); cursor: pointer; transition: 0.2s;}
    .tag.custom:hover { background: rgba(255, 51, 51, 0.1); border-color: #ff3333; color: #ff3333; }
    .del-tag { font-size: 8px; opacity: 0.5; }
    .tag.custom:hover .del-tag { opacity: 1; }
    .add-tag-btn { background: transparent; border: 1px dashed #444; color: #666; font-family: inherit; font-size: 9px; font-weight: bold; padding: 2px 6px; cursor: pointer; border-radius: 2px; transition: 0.2s;}
    .add-tag-btn:hover { border-color: #00d4ff; color: #00d4ff; background: rgba(0, 212, 255, 0.05);}
    .card-actions { display: flex; gap: 5px; align-items: center;}
    .action-divider { width: 1px; height: 20px; background: #333; margin: 0 5px; }
    .btn-action { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.02); border: 1px solid #333; color: #888; cursor: pointer; border-radius: 4px; transition: 0.2s; font-size: 14px;}
    .b-inject:hover { background: rgba(0, 255, 65, 0.1); border-color: #00ff41; color: #00ff41; box-shadow: 0 0 8px rgba(0,255,65,0.3); }
    .b-create:hover { background: rgba(0, 255, 65, 0.1); border-color: #00ff41; color: #00ff41; box-shadow: 0 0 8px rgba(0,255,65,0.3); }
    .b-edit:hover   { background: rgba(255, 170, 0, 0.1); border-color: #ffaa00; color: #ffaa00; box-shadow: 0 0 8px rgba(255,170,0,0.3); }
    .b-export:hover { background: rgba(255, 170, 0, 0.1); border-color: #ffaa00; color: #ffaa00; box-shadow: 0 0 8px rgba(255,170,0,0.3); }
    .b-term:hover   { background: rgba(200, 0, 255, 0.1); border-color: #c800ff; color: #c800ff; box-shadow: 0 0 8px rgba(200,0,255,0.3); }
    .b-del:hover    { background: rgba(255, 51, 51, 0.1); border-color: #ff3333; color: #ff3333; box-shadow: 0 0 8px rgba(255,51,51,0.3); }
    .empty-state { padding: 40px; text-align: center; color: #444; font-size: 14px; letter-spacing: 2px; display: flex; flex-direction: column; gap: 10px; margin-top: 20px;}
    .empty-state i { font-size: 32px; opacity: 0.5; }
    .custom-scroll::-webkit-scrollbar { width: 4px; }
    .custom-scroll::-webkit-scrollbar-track { background: transparent; }
    .custom-scroll::-webkit-scrollbar-thumb { background: rgba(0, 212, 255, 0.3); border-radius: 2px; }
</style>