<script>
    import { onMount } from 'svelte';
    import { CraftingLogic } from './CraftingLogic.js';
    
    // --- IMPORTANDO AS DATABASES REAIS ---
    import materialsDB from './materials.json';
    import templatesDB from './templates.json';
    import npcDB from './npc_definitions.json';

    // --- ESTADO MOCKADO (Inventário do Jogador) ---
    let inventory = {
        MATERIA: { "1": 45, "2": 0 }, 
        ORGANISMO: { "1": 10 },
        ENERGIA: { "1": 5 }
    };

    let npcs = [
        { name: "Minerador 01", rarity: "COMUM", role: "Coletor" },
        { name: "Engenheiro Chefe", rarity: "RARO", role: "Tecnico" }
    ];

    let sessionState = { actionsLeft: 2, exhaustion: 1 };
    let lastLog = "Sistema pronto. Abra o console (F12).";

    // --- FUNÇÃO DE LOG DIDÁTICO NO CONSOLE ---
    function logConsole(title, msg, data = null, color = "#00ff41") {
        console.group(`%c [${title}]`, `color: ${color}; font-weight: bold; border: 1px solid ${color}; padding: 2px;`);
        console.log(`%c${msg}`, "color: #ddd; font-family: monospace; font-size: 12px");
        if (data) console.table(data);
        console.groupEnd();
    }

    // --- FUNÇÕES DE TESTE ---
    function checkDatabase() {
        lastLog = "Verificando DB (Veja Console)...";
        logConsole("DATABASE", "Lendo Materiais:", materialsDB, "#cyan");
        logConsole("DATABASE", "Lendo Templates:", templatesDB, "#cyan");
        logConsole("DATABASE", "Lendo NPCs:", npcDB, "#cyan");
    }

    function testRefine() {
        logConsole("AÇÃO", "Refinando 20x Matéria Comum...", null, "#ffff00");
        const result = CraftingLogic.refineMaterial(inventory, "MATERIA", 1);
        lastLog = result.msg;

        if (result.success) {
            inventory.MATERIA["1"] -= result.cost.amount;
            inventory.MATERIA["2"] = (inventory.MATERIA["2"] || 0) + result.gain.amount;
            logConsole("SUCESSO", "Estoque atualizado.", inventory.MATERIA);
        } else {
            logConsole("ERRO", result.msg, null, "#ff0000");
        }
    }

    function testBuilding() {
        const template = templatesDB.BUILDING.PAREDE;
        logConsole("AÇÃO", `Construindo: ${template.label}`, template, "#ffff00");
        const result = CraftingLogic.calculateStructureStats("PAREDE", 2, 20);
        lastLog = `HP ${result.hp} | HAR ${result.har}`;
        logConsole("CONSTRUÇÃO", result.desc, result);
    }

    function testNpcCycle() {
        logConsole("AÇÃO", "Rodando Ciclo de NPCs...", npcs, "#ffff00");
        const result = CraftingLogic.calculateNpcOutput(npcs);
        inventory.MATERIA["1"] += result.resources.MATERIA;
        inventory.ENERGIA["1"] += result.resources.ENERGIA;
        lastLog = `+${result.resources.MATERIA} Matéria, +${result.resources.ENERGIA} Energia`;
        logConsole("RESULTADO", "Recursos gerados:", result.resources);
    }

    function testRest() {
        if (sessionState.actionsLeft < 2) {
            lastLog = "Ações insuficientes!";
            return;
        }
        const result = CraftingLogic.processRest(sessionState.exhaustion, 'DEEP');
        sessionState.actionsLeft -= result.cost;
        sessionState.exhaustion = Math.max(0, sessionState.exhaustion - result.exhaustionHeal);
        lastLog = result.msg;
        logConsole("SUCESSO", "Descanso processado.", sessionState);
    }

    onMount(() => {
        window.TestMultiversus = { inventory, refine: testRefine };
        console.log("TERMINAL TESTE INICIADO");
    });
</script>

<div class="test-window" style="pointer-events: auto;">
    <div class="header">
        <span>:: TEST_MODULE // V.2.1</span>
        <span class="blink">ONLINE</span>
    </div>

    <div class="monitor">
        <div class="stat-row">
            <span>📦 MATÉRIA T1:</span> <span class="val">{inventory.MATERIA["1"]}</span>
        </div>
        <div class="stat-row">
            <span>💎 MATÉRIA T2:</span> <span class="val">{inventory.MATERIA["2"]}</span>
        </div>
        <div class="stat-row">
            <span>⚡ AÇÕES:</span> <span class="val">{sessionState.actionsLeft} / 2</span>
        </div>
        <div class="console-output"><span class="prompt">></span> {lastLog}</div>
    </div>

    <div class="grid-controls">
        <button on:click|preventDefault|stopPropagation={checkDatabase} class="blue">📂 1. Ler Database</button>
        <button on:click|preventDefault|stopPropagation={testRefine}>⚙️ 2. Refinar</button>
        <button on:click|preventDefault|stopPropagation={testBuilding}>🧱 3. Construir</button>
        <button on:click|preventDefault|stopPropagation={testNpcCycle}>👥 4. NPCs</button>
        <button on:click|preventDefault|stopPropagation={testRest} class="purple">💤 5. Descanso</button>
        
        <div class="cheats">
            <button on:click|preventDefault|stopPropagation={() => inventory.MATERIA["1"] += 50}>+50 Mat</button>
            <button on:click|preventDefault|stopPropagation={() => sessionState.actionsLeft = 2}>Reset Ações</button>
        </div>
    </div>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

    .test-window {
        position: fixed; 
        top: 150px; 
        right: 20px; 
        width: 300px;
        background: rgba(0, 10, 0, 0.98); /* Fundo mais sólido */
        border: 2px solid #00ff41;
        font-family: 'Share Tech Mono', monospace;
        color: #00ff41;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.8);
        z-index: 999999; /* Z-Index extremo para garantir */
        padding: 10px;
        font-size: 12px;
        pointer-events: auto !important; /* FORÇA O CLIQUE */
    }

    .header {
        display: flex; justify-content: space-between; border-bottom: 1px solid #004411;
        padding-bottom: 5px; margin-bottom: 10px; font-weight: bold;
        user-select: none; /* Evita selecionar o texto ao clicar */
    }

    .monitor {
        background: #001100; border: 1px solid #005511; padding: 10px; margin-bottom: 10px;
    }

    .stat-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
    .val { color: #fff; }

    .console-output {
        margin-top: 10px; padding-top: 5px; border-top: 1px dashed #005511;
        color: #aaffaa; font-style: italic; min-height: 20px;
    }
    .prompt { margin-right: 5px; animation: blink 1s infinite; }

    .grid-controls { display: flex; flex-direction: column; gap: 5px; }

    button {
        background: #002200; border: 1px solid #005500; color: #00ff41;
        padding: 8px; cursor: pointer; text-align: left; font-family: inherit;
        transition: all 0.1s;
        pointer-events: auto !important; /* Garante clique no botão */
    }
    button:hover { background: #00ff41; color: #000; }
    button:active { background: #fff; } /* Feedback visual ao clicar */
    
    button.blue { border-color: cyan; color: cyan; }
    button.blue:hover { background: cyan; color: #000; }

    button.purple { border-color: #aa55ff; color: #aa55ff; }
    button.purple:hover { background: #aa55ff; color: #000; }

    .cheats { display: flex; gap: 5px; margin-top: 5px; }
    .cheats button { flex: 1; font-size: 10px; text-align: center; border-style: dashed; opacity: 0.7; }

    @keyframes blink { 50% { opacity: 0; } }
</style>