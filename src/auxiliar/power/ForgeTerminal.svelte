<script>
    import { createEventDispatcher } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import { PowerDatabase } from '../PowerDatabase.js';
    import { PowerParser } from './PowerParser.js';

    const dispatch = createEventDispatcher();
    const MODULE_ID = "multiversus-rpg";

    // --- ESTADOS DO TERMINAL ---
    let rawInput = "";
    let isCompiling = false;
    let terminalLogs = [
        { text: "SISTEMA DE TRADUÇÃO NEURAL INICIADO.", type: "sys" },
        { text: "AGUARDANDO INPUT DE TEXTO OU CONEXÃO DE DADOS...", type: "info" }
    ];

    // Variável que guarda o Item arrastado para o Terminal
    export let loadedItem = null;

    // --- FUNÇÕES DE LOG ---
    function addLog(msg, type = "info") {
        terminalLogs = [...terminalLogs, { text: msg, type }];
        if (terminalLogs.length > 20) terminalLogs.shift();
    }

    // --- ADAPTADOR DE SISTEMA (Camaleão) ---
    function adaptItemType() {
        const validTypes = game.documentTypes.Item;
        if (validTypes.includes("power")) return "power";
        const fallbacks = ["poder", "habilidade", "feature", "ability", "Item"];
        for (let t of fallbacks) if (validTypes.includes(t)) return t;
        return validTypes[0];
    }

    // ========================================================================
    // ROTAS A PARTIR DE TEXTO (TEXT -> DB / TEXT -> FICHA)
    // ========================================================================
    
    // ROTA 1: Texto -> Data Core (Banco de Dados)
    async function compileTextToDB() {
        if (!rawInput.trim()) return addLog("ERRO: O buffer de texto está vazio.", "error");
        isCompiling = true;
        addLog("Compilando texto para o Data Core...", "sys");

        try {
            const foundryItem = PowerParser.parseToItem(rawInput);
            const modFlags = foundryItem.flags[MODULE_ID];
            
            const dbEntry = {
                name: foundryItem.name,
                category: modFlags.category,
                rarity: modFlags.rarity,
                img: foundryItem.img,
                rawItem: foundryItem 
            };

            const result = await PowerDatabase.savePower(dbEntry);
            if (result.success) {
                addLog(`SUCESSO: [${dbEntry.name}] salvo no Data Core.`, "success");
                rawInput = ""; 
                dispatch('compile'); 
            } else {
                addLog(`ERRO DB: ${result.msg}`, "error");
            }
        } catch (e) {
            console.error(e);
            addLog("FALHA CRÍTICA NA COMPILAÇÃO DO TEXTO.", "error");
        }
        isCompiling = false;
    }

    // ROTA 2: Texto -> Ficha no Foundry (World Item)
    async function compileTextToFicha() {
        if (!rawInput.trim()) return addLog("ERRO: O buffer de texto está vazio.", "error");
        isCompiling = true;
        addLog("Sintetizando texto diretamente para Ficha Física...", "sys");

        try {
            const foundryItem = PowerParser.parseToItem(rawInput);
            foundryItem.type = adaptItemType(); // Garante o tipo aceito pelo mundo

            const newItem = await Item.create(foundryItem);
            if(newItem) {
                addLog(`SUCESSO: Ficha [${newItem.name}] gerada no Foundry.`, "success");
                rawInput = "";
            }
        } catch (e) {
            console.error(e);
            addLog("FALHA AO GERAR FICHA NO FOUNDRY.", "error");
        }
        isCompiling = false;
    }

    // ========================================================================
    // DRAG & DROP (CONECTANDO ITENS AO TERMINAL)
    // ========================================================================
    async function handleDrop(event) {
        event.preventDefault();
        const dataText = event.dataTransfer.getData('text/plain');
        if (!dataText) return;

        try {
            const dropData = JSON.parse(dataText);
            
            // Se veio do Foundry (Ficha ou Compendium)
            if (dropData.type === "Item" && dropData.uuid) {
                const item = await fromUuid(dropData.uuid);
                if (!item) return;
                loadedItem = { name: item.name, source: "Ficha (Foundry)", rawItem: item.toObject() };
                addLog(`Ficha [${item.name}] conectada com sucesso.`, "info");
            } 
            // Se veio do nosso próprio Data Core (arrastou da aba Database)
            else if (dropData.type === "Item" && dropData.data) {
                loadedItem = { name: dropData.data.name, source: "Data Core", rawItem: dropData.data };
                addLog(`Padrão [${loadedItem.name}] conectado do Data Core.`, "info");
            }
        } catch (err) {
            console.error("Falha ao interpretar o drop:", err);
            addLog("ERRO: Dados de drop irreconhecíveis.", "error");
        }
    }

    function disconnectItem() {
        loadedItem = null;
        addLog("Conexão com o padrão de dados encerrada.", "info");
    }

    // ========================================================================
    // ROTAS A PARTIR DO ITEM CONECTADO (ITEM -> TEXT / DB / FICHA)
    // ========================================================================

    // ROTA 3: Item Conectado -> Extrair Texto (Joga pro Textarea)
    function extractTextFromItem() {
        if (!loadedItem) return;
        try {
            rawInput = PowerParser.exportToText(loadedItem.rawItem);
            addLog(`Texto extraído com sucesso de [${loadedItem.name}].`, "success");
        } catch (e) {
            addLog("Falha ao extrair texto do item.", "error");
        }
    }

    // ROTA 4: Item Conectado -> Salvar no Data Core
    async function saveItemToDB() {
        if (!loadedItem) return;
        try {
            const flags = loadedItem.rawItem.flags?.[MODULE_ID] || {};
            const dbEntry = {
                name: loadedItem.rawItem.name,
                category: flags.category || "principal",
                rarity: flags.rarity || "Comum",
                img: loadedItem.rawItem.img,
                rawItem: loadedItem.rawItem
            };

            const result = await PowerDatabase.savePower(dbEntry);
            if (result.success) {
                addLog(`SUCESSO: [${dbEntry.name}] clonado para o Data Core.`, "success");
                dispatch('compile');
            } else {
                addLog(`ERRO DB: ${result.msg}`, "error");
            }
        } catch (e) {
            addLog("Falha ao clonar para o Data Core.", "error");
        }
    }

    // ROTA 5: Item Conectado -> Criar Ficha no Foundry
    async function createFichaFromItem() {
        if (!loadedItem) return;
        try {
            let itemToCreate = foundry.utils.deepClone(loadedItem.rawItem);
            itemToCreate.type = adaptItemType();
            
            const newItem = await Item.create(itemToCreate);
            if(newItem) addLog(`SUCESSO: Cópia da Ficha [${newItem.name}] gerada.`, "success");
        } catch (e) {
            addLog("Falha ao gerar a ficha no Foundry.", "error");
        }
    }

</script>

<div class="forge-terminal" in:fade={{duration: 200}}>
    
    <div class="split-layout">
        
        <div class="input-panels">
            
            <div class="panel text-editor">
                <div class="panel-header">
                    <span><i class="fas fa-code"></i> INPUT RAW (MARKDOWN / TEXTO)</span>
                </div>
                <textarea 
                    class="hacker-input custom-scroll" 
                    bind:value={rawInput} 
                    placeholder="Cole o texto gerado pelo NotebookLM ou Discord aqui...&#10;&#10;NOME: Escudo Cinético&#10;CATEGORIA: principal&#10;RARIDADE: Raro..."
                    spellcheck="false"
                ></textarea>
                
                <div class="panel-actions">
                    <button class="btn-action db" on:click={compileTextToDB} disabled={isCompiling || !rawInput}>
                        <i class="fas fa-database"></i> ENVIAR P/ DATA CORE
                    </button>
                    <button class="btn-action ftt" on:click={compileTextToFicha} disabled={isCompiling || !rawInput}>
                        <i class="fas fa-scroll"></i> GERAR FICHA
                    </button>
                </div>
            </div>

            <div class="panel drop-zone-panel">
                <div class="panel-header">
                    <span><i class="fas fa-network-wired"></i> PORTA DE CONEXÃO (DRAG & DROP)</span>
                </div>
                
                <div class="drop-zone {loadedItem ? 'loaded' : ''}" on:drop={handleDrop} on:dragover={(e) => e.preventDefault()}>
                    {#if loadedItem}
                        <div class="loaded-content" in:slide>
                            <i class="fas fa-microchip icon-loaded"></i>
                            <div class="info">
                                <strong>{loadedItem.name}</strong>
                                <small>Origem: {loadedItem.source}</small>
                            </div>
                            <button class="btn-disconnect" on:click={disconnectItem} title="Desconectar">×</button>
                        </div>
                    {:else}
                        <div class="empty-drop">
                            <i class="fas fa-download"></i>
                            <span>Arraste um Poder da <b>Ficha</b> ou do <b>Data Core</b> e solte aqui.</span>
                        </div>
                    {/if}
                </div>

                <div class="panel-actions">
                    <button class="btn-action txt" on:click={extractTextFromItem} disabled={!loadedItem}>
                        <i class="fas fa-file-alt"></i> EXTRAIR TEXTO
                    </button>
                    <button class="btn-action db" on:click={saveItemToDB} disabled={!loadedItem}>
                        <i class="fas fa-database"></i> SALVAR NO CORE
                    </button>
                    <button class="btn-action ftt" on:click={createFichaFromItem} disabled={!loadedItem}>
                        <i class="fas fa-copy"></i> CLONAR FICHA
                    </button>
                </div>
            </div>

        </div>

        <div class="console-section">
            <div class="console-header">LOG DE OPERAÇÕES DO TERMINAL</div>
            <div class="console-output custom-scroll">
                {#each terminalLogs as log}
                    <div class="log-line {log.type}">
                        <span class="timestamp">[{new Date().toLocaleTimeString()}]</span>
                        <span class="msg">> {log.text}</span>
                    </div>
                {/each}
                {#if isCompiling}
                    <div class="log-line sys blink">
                        <span class="msg">> PROCESSANDO DADOS...</span>
                    </div>
                {/if}
            </div>
        </div>

    </div>
</div>

<style>
    .forge-terminal { height: 100%; padding: 15px; display: flex; flex-direction: column; }

    .split-layout { display: flex; gap: 15px; height: 100%; }

    .input-panels { flex: 1.2; display: flex; flex-direction: column; gap: 15px; }

    .panel { background: rgba(0,0,0,0.6); border: 1px solid rgba(0, 212, 255, 0.3); border-radius: 4px; display: flex; flex-direction: column; overflow: hidden; }
    .text-editor { flex: 1.5; }
    .drop-zone-panel { flex: 1; }

    .panel-header { background: rgba(0, 212, 255, 0.1); padding: 8px 15px; border-bottom: 1px solid rgba(0, 212, 255, 0.3); }
    .panel-header span { font-size: 11px; font-weight: bold; color: #00d4ff; letter-spacing: 1px;}

    .hacker-input { flex: 1; background: transparent; border: none; padding: 15px; color: #00d4ff; font-family: inherit; font-size: 13px; resize: none; outline: none; line-height: 1.5; }
    .hacker-input::placeholder { color: rgba(0, 212, 255, 0.2); }

    /* AÇÕES DOS PAINÉIS */
    .panel-actions { display: flex; gap: 5px; padding: 8px; background: #050505; border-top: 1px solid #222; }
    .btn-action { flex: 1; border: none; font-family: inherit; font-weight: bold; font-size: 10px; padding: 10px; cursor: pointer; border-radius: 2px; transition: 0.2s; display: flex; flex-direction: column; align-items: center; gap: 5px;}
    .btn-action i { font-size: 16px; }
    .btn-action:disabled { opacity: 0.3; cursor: not-allowed; filter: grayscale(1); }
    
    .btn-action.db { background: rgba(0, 212, 255, 0.1); border: 1px solid #00d4ff; color: #00d4ff; }
    .btn-action.db:hover:not(:disabled) { background: #00d4ff; color: #000; box-shadow: 0 0 10px #00d4ff; }
    
    .btn-action.ftt { background: rgba(0, 255, 65, 0.1); border: 1px solid #00ff41; color: #00ff41; }
    .btn-action.ftt:hover:not(:disabled) { background: #00ff41; color: #000; box-shadow: 0 0 10px #00ff41; }

    .btn-action.txt { background: rgba(255, 170, 0, 0.1); border: 1px solid #ffaa00; color: #ffaa00; }
    .btn-action.txt:hover:not(:disabled) { background: #ffaa00; color: #000; box-shadow: 0 0 10px #ffaa00; }

    /* DROP ZONE */
    .drop-zone { flex: 1; margin: 10px; border: 2px dashed #444; border-radius: 4px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.02); transition: 0.3s; }
    .drop-zone.loaded { border-color: #00d4ff; background: rgba(0, 212, 255, 0.05); border-style: solid; }
    
    .empty-drop { display: flex; flex-direction: column; align-items: center; gap: 10px; color: #666; font-size: 11px; text-align: center; padding: 20px;}
    .empty-drop i { font-size: 24px; opacity: 0.5; }
    
    .loaded-content { display: flex; align-items: center; gap: 15px; width: 100%; padding: 0 20px; }
    .icon-loaded { font-size: 32px; color: #00d4ff; text-shadow: 0 0 10px rgba(0, 212, 255, 0.5); }
    .loaded-content .info { display: flex; flex-direction: column; flex: 1; }
    .loaded-content strong { color: #fff; font-size: 14px; }
    .loaded-content small { color: #00d4ff; font-size: 10px; }
    
    .btn-disconnect { background: transparent; border: 1px solid #ff3333; color: #ff3333; width: 30px; height: 30px; border-radius: 4px; cursor: pointer; transition: 0.2s; font-weight: bold; font-size: 16px;}
    .btn-disconnect:hover { background: #ff3333; color: #fff; box-shadow: 0 0 10px #ff3333; }

    /* ÁREA DO CONSOLE */
    .console-section { flex: 0.8; display: flex; flex-direction: column; background: #050505; border: 1px solid #333; border-radius: 4px; overflow: hidden; }
    .console-header { background: #111; padding: 10px; font-size: 10px; color: #666; border-bottom: 1px solid #222; font-weight: bold; letter-spacing: 1px;}
    
    .console-output { flex: 1; padding: 10px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; font-size: 11px; }
    
    .log-line { display: flex; gap: 10px; word-break: break-word; line-height: 1.4;}
    .timestamp { color: #555; font-size: 10px; flex-shrink: 0;}
    .msg { flex: 1; }

    .log-line.info .msg { color: #ccc; }
    .log-line.sys .msg { color: #00d4ff; }
    .log-line.error .msg { color: #ff3333; font-weight: bold; }
    .log-line.success .msg { color: #00ff41; text-shadow: 0 0 5px rgba(0,255,65,0.3); }
    .blink { animation: blink 1s infinite; }

    .custom-scroll::-webkit-scrollbar { width: 6px; }
    .custom-scroll::-webkit-scrollbar-track { background: transparent; }
    .custom-scroll::-webkit-scrollbar-thumb { background: rgba(0, 212, 255, 0.3); border-radius: 3px; }
    @keyframes blink { 50% { opacity: 0; } }
</style>