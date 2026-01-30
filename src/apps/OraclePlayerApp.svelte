<script>
    import { onMount, tick } from 'svelte';
    import { PlayerDatabase } from '../database/PlayerDatabase.js';
    import { NexusDatabase } from '../database/NexusDatabase.js';

    export let actor;
    export let themeStyle = ""; // Recebe o cssString da ficha pai

    const MODULE_ID = "multiversus-rpg";
    const HISTORY_FLAG = "oracle_player_history";

    let chatHistory = [];
    let userInput = "";
    let chatContainer;

    async function scrollChat() {
        await tick();
        if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    onMount(async () => {
        try {
            let saved = game.user.getFlag(MODULE_ID, HISTORY_FLAG);
            if (saved && Array.isArray(saved)) chatHistory = saved;
            else addMessage('model', `<div class="sys-msg">TERMINAL_LINK: ESTABELECIDO<br>OPERADOR: ${game.user.name}</div>`);
            await scrollChat();
        } catch (e) { console.log("Oracle: Erro no boot."); }

        // Listener do Mestre
        game.socket.on(`module.${MODULE_ID}`, async (payload) => {
            if (payload.type === "EXECUTE_SCRIPT") {
                if (payload.targets && !payload.targets.includes(game.user.id)) return;
                ui.notifications.info("EXECUTANDO PROTOCOLO REMOTO...");
                await executeScript(payload.code, payload.args || "");
            }
        });
    });

    async function processInput() {
        if (!userInput.trim()) return;
        const rawText = userInput.trim();
        addMessage('user', rawText);
        userInput = "";
        
        const trigger = rawText.split(" ")[0].toLowerCase();

        if (trigger === "limpar" || trigger === "cls") { clearMemory(); return; }
        if (trigger === "ajuda") { await showDynamicHelp(); return; }

        // Tenta Script do Mestre (Nexus)
        if (await tryRunPublicScript(rawText)) return;

        // Busca na DB de Lore (Archives)
        if (searchPlayerDatabase(rawText)) return;

        addMessage('error', `PROTOCOLO [${trigger.toUpperCase()}] NÃO RECONHECIDO.`);
    }

    // --- FUNÇÃO DO BOTÃO DE AJUDA ---
    async function showDynamicHelp() {
        const db = PlayerDatabase.getAll();
        // Busca o arquivo específico chamado "Comandos"
        const helpEntry = db.find(e => e.name.toLowerCase() === "comandos");

        if (helpEntry) {
            addMessage('model', `
                <div class="help-content">
                    <div class="help-header"><i class="fas fa-info-circle"></i> GUIA DE COMANDOS</div>
                    <div class="help-body">${helpEntry.description}</div>
                </div>
            `);
        } else {
            addMessage('error', "ERRO: O arquivo 'Comandos' não foi encontrado na Database dos Jogadores.");
        }
    }

    async function tryRunPublicScript(input) {
        const db = NexusDatabase.getAll();
        const parts = input.split(" ");
        const trigger = parts[0].toLowerCase();
        const args = parts.slice(1).join(" ");
        const cmd = db.find(e => e.name.toLowerCase() === trigger && e.type === "Script");

        if (cmd) {
            const tags = (cmd.tags || "").toLowerCase();
            if (tags.includes("public") || tags.includes("player")) {
                await executeScript(cmd.description, args);
                return true;
            } else {
                addMessage('error', "ACESSO NEGADO: PROTOCOLO PRIVADO.");
                return true;
            }
        }
        return false;
    }

    function searchPlayerDatabase(query) {
        const db = PlayerDatabase.getAll();
        const q = query.toLowerCase();
        const results = db.filter(e => e.name.toLowerCase().includes(q) || (e.tags && e.tags.toLowerCase().includes(q)));
        
        if (results.length > 0) {
            let html = `<div class="sys-msg">DADOS_ENCONTRADOS:</div>`;
            results.forEach(e => {
                const desc = e.description.replace(/<[^>]*>?/gm, "").slice(0, 80);
                html += `
                <div class="mini-entry">
                    <b>${e.name}</b> [${e.type}]<br>
                    <small>${desc}...</small>
                </div>`;
            });
            addMessage('model', html);
            return true;
        }
        return false;
    }

    async function executeScript(codeString, args) {
        const cleanCode = codeString.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        try {
            const asyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            const scriptFunc = new asyncFunction("actor", "game", "ui", "NexusDatabase", "PlayerDatabase", "args", "render", "socket", cleanCode);
            const render = (html) => addMessage('model', html);
            await scriptFunc(actor, game, ui, NexusDatabase, PlayerDatabase, args, render, game.socket);
        } catch (err) {
            addMessage('error', `FALHA_SISTEMA: ${err.message}`);
        }
    }

    function addMessage(role, text) {
        chatHistory = [...chatHistory, { role, text }];
        game.user.setFlag(MODULE_ID, HISTORY_FLAG, chatHistory.slice(-30));
        scrollChat();
    }
    
    function clearMemory() {
        chatHistory = [];
        game.user.unsetFlag(MODULE_ID, HISTORY_FLAG);
        addMessage('model', "MEMÓRIA VOLÁTIL LIMPA.");
    }
</script>

<div class="oracle-wrapper" style="{themeStyle}">
    <header class="terminal-header">
        <div class="status"><span class="dot"></span> ORACLE_LINK</div>
        <div class="actions">
            <button class="help-btn" on:click={showDynamicHelp} title="Ver Lista de Comandos">
                <i class="fas fa-question-circle"></i> AJUDA
            </button>
            <button class="clear-btn" on:click={clearMemory} title="Limpar Terminal">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    </header>

    <div class="chat-viewport" bind:this={chatContainer}>
        {#each chatHistory as msg}
            <div class="msg-box {msg.role}">
                <div class="bubble">{@html msg.text}</div>
            </div>
        {/each}
    </div>

    <div class="input-line">
        <span class="prompt">></span>
        <input type="text" bind:value={userInput} 
               on:keydown={(e) => e.key === 'Enter' && processInput()} 
               placeholder="AGUARDANDO_COMANDO..." />
    </div>
</div>

<style>
    .oracle-wrapper {
        display: flex; flex-direction: column; height: 100%;
        background: var(--c-bg); color: var(--c-text);
        font-family: 'Share Tech Mono', 'Courier New', monospace;
        border: 1px solid rgba(var(--c-primary), 0.3);
    }

    /* HEADER */
    .terminal-header {
        background: rgba(0,0,0,0.4); padding: 8px 12px;
        display: flex; justify-content: space-between; align-items: center;
        border-bottom: 1px solid var(--c-primary);
    }
    .status { font-size: 11px; font-weight: bold; color: var(--c-primary); letter-spacing: 1px; }
    .dot { 
        display: inline-block; width: 6px; height: 6px; 
        background: var(--c-primary); border-radius: 50%; margin-right: 5px;
        box-shadow: 0 0 5px var(--c-primary); animation: blink 2s infinite;
    }

    .actions { display: flex; gap: 10px; }
    .help-btn { 
        background: var(--c-primary); color: #000; border: none; 
        padding: 3px 10px; font-size: 10px; font-weight: bold; cursor: pointer;
        border-radius: 2px; transition: 0.2s;
    }
    .clear-btn { background: transparent; border: none; color: var(--c-primary); opacity: 0.5; cursor: pointer; }
    .clear-btn:hover { opacity: 1; }

    /* VIEWPORT */
    .chat-viewport { flex: 1; overflow-y: auto; padding: 15px; display: flex; flex-direction: column; gap: 10px; }
    .msg-box { display: flex; width: 100%; }
    .msg-box.user { justify-content: flex-end; }
    .msg-box.model { justify-content: flex-start; }

    .bubble { 
        max-width: 90%; padding: 8px 12px; font-size: 13px; 
        background: rgba(var(--c-primary), 0.05); 
        border: 1px solid rgba(var(--c-primary), 0.2);
        line-height: 1.4; border-radius: 4px;
    }
    .msg-box.user .bubble { border-color: var(--c-text); background: rgba(255,255,255,0.05); opacity: 0.8; }
    .msg-box.error .bubble { color: #ff5555; border-color: #ff5555; background: rgba(255,0,0,0.1); }

    /* INPUT */
    .input-line { 
        display: flex; align-items: center; padding: 12px; 
        background: rgba(0,0,0,0.3); border-top: 1px solid rgba(var(--c-primary), 0.3);
    }
    .prompt { color: var(--c-primary); margin-right: 10px; font-weight: bold; }
    input { 
        flex: 1; background: transparent; border: none; 
        color: #fff; font-family: inherit; font-size: 14px; outline: none;
    }

    /* AUXILIARES */
    :global(.sys-msg) { color: var(--c-primary); font-weight: bold; font-size: 11px; margin-bottom: 5px; }
    :global(.mini-entry) { 
        background: rgba(0,0,0,0.2); padding: 5px; border-left: 2px solid var(--c-primary); 
        margin-bottom: 5px; font-size: 12px; 
    }
    :global(.help-header) { color: var(--c-primary); font-weight: bold; border-bottom: 1px solid var(--c-primary); margin-bottom: 8px; }

    .chat-viewport::-webkit-scrollbar { width: 4px; }
    .chat-viewport::-webkit-scrollbar-thumb { background: var(--c-primary); }

    @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
</style>