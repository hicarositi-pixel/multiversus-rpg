<script>
    import { onMount, tick } from 'svelte';
    import { slide } from 'svelte/transition';
    import { NexusDatabase } from './database/NexusDatabase.js';

    export let actor; 

    // --- CONFIGURAÇÕES ---
    const MODULE_ID = "multiversus-rpg";
    const HISTORY_FLAG = "oracle_history_final";
    const SOCKET_NAME = "system.oracle.command"; // Nome do canal de comunicação

    // --- ESTADO ---
    let chatHistory = [];
    let userInput = "";
    let chatContainer; 

    // --- FUNÇÃO DE ROLAGEM ---
    async function scrollChat() {
        await tick();
        if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
    }

onMount(async () => {
        // 1. Carrega Histórico
        try {
            let saved = game.user.getFlag(MODULE_ID, HISTORY_FLAG);
            if (saved && Array.isArray(saved)) chatHistory = saved;
            else addMessage('model', `<div class="sys-init">ORACLE NET v7.1 ONLINE<br>ID: ${game.user.name}</div>`);
            await scrollChat();
        } catch (e) { console.log("Resetando..."); }

        // 2. SOCKET LISTENER COM FILTRO DE ALVO
        game.socket.on(`module.${MODULE_ID}`, async (payload) => {
            if (payload.type === "EXECUTE_SCRIPT") {
                
                // >>> AQUI ESTÁ A MÁGICA DA MIRA <<<
                // Se houver uma lista de alvos e EU não estiver nela, ignoro.
                if (payload.targets && Array.isArray(payload.targets)) {
                    if (!payload.targets.includes(game.user.id)) return;
                }

                console.log("Oracle Network: Script recebido.");
                ui.notifications.info("⚠️ Oracle: Recebendo dados do Mestre...");
                
                await executeDynamicScript(payload.code, payload.args || "");
            }
        });
        if (game.user.isGM) {
        
        // 1. Jogador quer SALVAR
        if (payload.type === "PLAYER_DB_SAVE") {
            console.log(`Oracle Server: Salvando entrada de ${payload.entry.author}...`);
            
            // Importa dinamicamente a DB dos Players para salvar
            const { PlayerDatabase } = await import('./database/PlayerDatabase.js');
            await PlayerDatabase.saveEntry(payload.entry);
            
            // Avisa todo mundo que mudou
            game.socket.emit(`module.${MODULE_ID}`, { type: "PLAYER_DB_UPDATE_NOTIFY" });
            ui.notifications.info(`Oracle: Nova entrada de jogador salva.`);
        }

        // 2. Jogador quer DELETAR
        if (payload.type === "PLAYER_DB_DELETE") {
            const { PlayerDatabase } = await import('./database/PlayerDatabase.js');
            await PlayerDatabase.deleteEntry(payload.id);
            game.socket.emit(`module.${MODULE_ID}`, { type: "PLAYER_DB_UPDATE_NOTIFY" });
        }
    }

    // --- CLIENTE (JOGADORES) ---
    // Se o servidor avisou que houve update, atualiza a tela
    if (payload.type === "PLAYER_DB_UPDATE_NOTIFY") {
        Hooks.callAll("nexusUpdate");
    }
    });

    // --- PROCESSADOR DE COMANDOS ---
    async function processInput() {
        if (!userInput.trim()) return;
        const rawText = userInput.trim();
        
        addMessage('user', rawText);
        userInput = "";
        await tick(); scrollToBottom();
        await new Promise(r => setTimeout(r, 100));

        const text = rawText.toLowerCase();
        const parts = rawText.split(" ");
        const trigger = parts[0].toLowerCase();

        // 1. NATIVOS
        if (["ajuda", "help", "?"].includes(trigger)) { showHelp(); return; }
        if (["limpar", "cls"].includes(trigger)) { clearMemory(); return; }
        
        // 2. NEXUS (SCRIPTS)
        if (await checkNexusCommands(rawText)) return;

        // 3. FALLBACKS
        if (text.includes("vida") || text.includes("hp")) { showVitals(); return; }
        if (text.includes("xp") || text.includes("dinheiro")) { showResources(); return; }
        if (text.includes("rolar") || text.includes("teste")) { if(tryRollCommand(text)) return; }
        if (searchInventory(rawText)) return;
        if (searchNexusLore(rawText)) return;

        addMessage('error', `Comando desconhecido: "<b>${trigger}</b>"`);
    }

    // --- MOTOR DE SCRIPTS ---
    async function checkNexusCommands(input) {
        try {
            const db = NexusDatabase.getAll();
            const parts = input.split(" ");
            const trigger = parts[0].toLowerCase();
            const args = parts.slice(1).join(" ");

            const cmd = db.find(e => e.name.toLowerCase() === trigger);

            if (cmd) {
                if (cmd.type === "Script") {
                    ui.notifications.info(`⚙️ Executando: ${cmd.name}`);
                    await executeDynamicScript(cmd.description, args);
                    return true;
                }
                if (["Sistema", "Instruções", "Anotações"].includes(cmd.type)) {
                    let response = stripHTML(cmd.description);
                    const rollMatch = response.match(/\[\[(.*?)\]\]/);
                    if (rollMatch) {
                        response = response.replace(rollMatch[0], ""); 
                        addMessage('model', `<div class="system-msg"><b>${cmd.name}</b><br>${response}<hr><em>Rolando: ${rollMatch[1]}</em></div>`);
                        return true;
                    }
                    addMessage('model', `<div class="system-msg"><b>${cmd.name}:</b><br>${response}</div>`);
                    return true;
                }
            }
        } catch(e) { console.error(e); }
        return false;
    }

    // --- EXECUTOR JS ---
    async function executeDynamicScript(codeString, args) {
        const cleanCode = codeString
            .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

        try {
            const asyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            const scriptFunc = new asyncFunction(
                "actor", "game", "ui", "canvas", "NexusDatabase", "args", "render", "chatContainer", "socket", // socket disponível para scripts
                cleanCode
            );
            
            const render = (html) => addMessage('model', html);
            
            // Passamos a função helper de socket para o script usar se quiser mandar algo de volta
            const socketHelper = {
                emit: (type, data) => game.socket.emit(`module.${MODULE_ID}`, {type, ...data})
            };

            await scriptFunc(actor, game, ui, canvas, NexusDatabase, args, render, chatContainer, socketHelper);
            
        } catch (err) {
            addMessage('error', `ERRO DE SCRIPT: ${err.message}`);
        }
    }

    // --- UTILS (IGUAL A ANTES) ---
    function addMessage(role, text) {
        chatHistory = [...chatHistory, { role, text }];
        game.user.setFlag(MODULE_ID, HISTORY_FLAG, chatHistory.slice(-30));
        scrollChat();
    }
    async function clearMemory() {
        chatHistory = [];
        await game.user.unsetFlag(MODULE_ID, HISTORY_FLAG);
        addMessage('model', "Terminal limpo.");
    }
    function stripHTML(html) {
        if (!html) return "";
        try { const tmp = document.createElement("DIV"); tmp.innerHTML = html; return (tmp.textContent || tmp.innerText || "").trim(); } catch(e) { return ""; }
    }
    function showVitals() {
        const hp = actor?.system?.health || { value: 0, max: 1 };
        const pct = Math.min(100, Math.max(0, (hp.value / (hp.max || 1)) * 100));
        addMessage('model', `<div class="status-card"><div class="status-title">STATUS</div><div class="hp-text">${hp.value}/${hp.max}</div><div class="bar-bg"><div class="bar-fill" style="width: ${pct}%"></div></div></div>`);
    }
    function showResources() {
        const coins = actor?.getFlag(MODULE_ID, "playerData")?.coins || 0;
        const xp = actor?.system?.spentXP || 0;
        addMessage('model', `<div class="res-block"><div>XP: <b>${xp}</b></div><div>$: <b>${coins}</b></div></div>`);
    }
    function searchInventory(query) {
        if (!actor) return false;
        const item = actor.items.find(i => i.name.toLowerCase().includes(query.toLowerCase()));
        if (item) {
            const desc = stripHTML(item.system.description?.value || "...");
            addMessage('model', `<div class="item-card"><img src="${item.img}" class="item-icon"/><div class="item-data"><strong>${item.name}</strong><p>${desc}</p></div></div>`);
            return true;
        }
        return false;
    }
    function searchNexusLore(query) {
        try {
            const db = NexusDatabase.getAll();
            const results = db.filter(e => e.type !== "Script" && (e.name.toLowerCase().includes(query.toLowerCase()) || e.tags.includes(query)));
            if (results.length > 0) {
                let html = `<div class="search-header">RESULTADOS:</div>`;
                results.forEach(e => html += `<div class="nexus-entry"><b>${e.name}</b><br>${stripHTML(e.description).slice(0,150)}...</div>`);
                addMessage('model', html);
                return true;
            }
        } catch(e) {}
        return false;
    }
    function tryRollCommand(text) {
        if (!actor) return false;
        addMessage('model', `Comando de rolagem recebido: ${text}`);
        return true;
    }
    function showHelp() {
        addMessage('model', `<div class="help-box"><b>ORACLE NET v7.0</b><br>Sistema conectado à rede.</div>`);
    }
    function scrollToBottom() { if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight; }
</script>

<div class="oracle-container">
    <header class="oracle-header">
        <div class="status-indicator"><span class="led"></span> ORACLE</div>
        <button class="btn-clear" on:click={clearMemory}><i class="fas fa-trash"></i></button>
    </header>
    <div class="chat-display" bind:this={chatContainer}>
        {#each chatHistory as msg}
            <div class="msg-row {msg.role}"><div class="bubble">{@html msg.text}</div></div>
        {/each}
    </div>
    <div class="input-area">
        <input type="text" bind:value={userInput} on:keydown={(e) => e.key === 'Enter' && processInput()} placeholder="..." />
        <button on:click={processInput}><i class="fas fa-terminal"></i></button>
    </div>
</div>

<style>
    /* MESMO CSS DAS VERSÕES ANTERIORES */
    .oracle-container { display: flex; flex-direction: column; height: 100%; background: #050505; color: #00ff41; font-family: 'Courier New', monospace; border: 1px solid #00ff41; overflow: hidden; }
    .oracle-header { background: #001100; padding: 8px; border-bottom: 1px solid #00ff41; display: flex; justify-content: space-between; align-items: center; }
    .status-indicator { font-size: 11px; font-weight: bold; display: flex; align-items: center; gap: 6px; }
    .led { width: 8px; height: 8px; background: #00ff41; border-radius: 50%; box-shadow: 0 0 5px #00ff41; animation: blink 2s infinite; }
    .btn-clear { background: transparent; border: none; color: #005522; cursor: pointer; } .btn-clear:hover { color: #f00; }
    .chat-display { flex: 1; overflow-y: auto; padding: 15px; display: flex; flex-direction: column; gap: 12px; }
    .msg-row { display: flex; max-width: 95%; } .msg-row.user { align-self: flex-end; justify-content: flex-end; } .msg-row.model { align-self: flex-start; }
    .msg-row.error .bubble { border-color: #f00; color: #f00; }
    .bubble { padding: 10px; border-radius: 4px; font-size: 12px; line-height: 1.4; background: rgba(0, 255, 65, 0.05); border: 1px solid rgba(0, 255, 65, 0.2); color: #ccc; word-wrap: break-word; }
    .msg-row.user .bubble { background: rgba(0, 136, 255, 0.1); border-color: rgba(0, 136, 255, 0.4); color: #fff; text-align: right; }
    .input-area { display: flex; padding: 10px; background: #000; border-top: 1px solid #00ff41; }
    .input-area input { flex: 1; background: transparent; border: none; color: #fff; padding: 5px; font-family: inherit; outline: none; }
    .input-area button { background: transparent; border: 1px solid #00ff41; color: #00ff41; padding: 0 15px; cursor: pointer; }
    :global(.system-msg) { border-left: 3px solid #ff9900; background: rgba(255, 153, 0, 0.1); padding: 8px; font-family: 'Consolas', monospace; color: #ffcc00; }
    :global(.nexus-entry) { margin-bottom: 8px; padding-left: 8px; border-left: 2px solid #00ff41; }
    :global(.status-card) { text-align: center; width: 100%; }
    :global(.bar-bg) { height: 8px; background: #333; border: 1px solid #555; }
    :global(.bar-fill) { height: 100%; background: #00ff41; transition: width 0.5s; }
    :global(.item-card) { display: flex; gap: 10px; align-items: flex-start; }
    :global(.item-icon) { width: 32px; height: 32px; border: 1px solid #00ff41; border-radius: 4px; }
    .chat-display::-webkit-scrollbar { width: 5px; } .chat-display::-webkit-scrollbar-thumb { background: #00ff41; }
    @keyframes blink { 50% { opacity: 0.5; } }
</style>