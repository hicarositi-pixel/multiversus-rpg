<script>
    import { onMount, onDestroy, createEventDispatcher } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import { CombatEngine } from '../../../Logic/CombatEngine.js';
    
    import CombatCarousel from './CombatCarousel.svelte';
    import CombatList from './CombatList.svelte';
    import TerminalPanel from './TerminalPanel.svelte';
    import ResolutionPanel from './ResolutionPanel.svelte';

    import { OnlineCombat } from '../../../Logic/OnlineCombat.js';
    import { activeTurnId, CombatManager } from '../../../Logic/CombatManager.js';
    import { get } from 'svelte/store'; // IMPORTANTE PARA LER O TURNO

    export let actor = null; 

    function handleClose(e) {
        e.stopPropagation();
        if (isGM && selectedNpcId) { selectedNpcId = null; return; }
        for (const app of foundry.applications.instances.values()) {
            if (app.id?.includes("combat") || app.title?.toUpperCase().includes("COMBAT")) app.close();
        }
        const legacyWin = Object.values(ui.windows).find(w => w.id?.includes("combat"));
        if (legacyWin) legacyWin.close();
        document.querySelectorAll('.combat-hub-wrapper').forEach(el => el.remove());
    }

    const isGM = game.user.isGM;
    const MODULE_ID = "multiversus-rpg";
    
    let phase = 'declaration'; 
    let declarationQueue = [];
    let npcs = []; 
    let selectedNpcId = null;
    let playerEntity = null;

    let isMinimized = false;
    let pos = { x: window.innerWidth/2 - 475, y: window.innerHeight/2 - 350 };
    let size = { w: 950, h: 700 };
    let isDragging = false;
    let isResizing = false;

    $: activeEntityToEdit = isGM ? npcs.find(n => n.id === selectedNpcId) : playerEntity;

    let hookIdScene;
    let hookIdSocket; 
    let unsubTurn; // Variável para destruir o ouvinte de turno depois

    onMount(async () => {
        OnlineCombat.init();

        const savedPos = game.user.getFlag(MODULE_ID, "hubPos");
        const savedSize = game.user.getFlag(MODULE_ID, "hubSize");
        if (savedPos) pos = savedPos;
        if (savedSize) size = savedSize;

        // NOVO: Puxa o turno salvo no banco de dados ao abrir a tela
        const savedTurn = canvas.scene?.getFlag(MODULE_ID, "activeTurnId");
        if (savedTurn) activeTurnId.set(savedTurn);

        // Puxa quem é o turno ativo agora
        const currentTurn = get(activeTurnId);

        if (isGM) {
            phase = canvas.scene?.getFlag(MODULE_ID, "combatPhase") || 'declaration';
            npcs = canvas.scene?.getFlag(MODULE_ID, "combatNpcs") || [];

            hookIdSocket = Hooks.on("nexusCombatVectorsReceived", async (data) => {
                let playerEncontrado = false;
                npcs = npcs.map(n => {
                    if (n.actorId === data.actorId) {
                        playerEncontrado = true;
                        return { ...n, actions: data.actions, pool: data.pool, poolToRoll: data.pool, stats: data.stats || n.stats, ready: true, submitted: true };
                    }
                    return n;
                });

                if (!playerEncontrado) {
                    const pActor = game.actors.get(data.actorId);
                    if (pActor) {
                        npcs.push({
                            id: foundry.utils.randomID(), actorId: data.actorId, userId: data.userId,
                            name: pActor.name, img: pActor.img, isNpc: false, ready: true, submitted: true,
                            stats: data.stats || { sense: 1, command: 1, mind: 1, coordination: 1 },
                            pool: data.pool, poolToRoll: data.pool, actions: data.actions
                        });
                    }
                }
                npcs = [...npcs]; 
                buildQueue(); 
                await saveGmState(); 
                ui.notifications.info(`VETORES RECEBIDOS: ${game.actors.get(data.actorId)?.name} está pronto.`);
            });

        } else if (actor) {
            const s = actor.system?.stats;
            const savedDec = game.user.getFlag(MODULE_ID, "combatDeclaration");
            playerEntity = {
                id: actor.id, actorId: actor.id, name: actor.name, img: actor.img, isNpc: false, 
                stats: { sense: s?.sense?.value || 1, command: s?.command?.value || 1, mind: s?.mind?.value || 1, coordination: s?.coordination?.value || 1 }, 
                pool: savedDec ? savedDec.pool : { d: s?.body?.value || 4, hd: 0, wd: 0 }, 
                actions: savedDec ? savedDec.actions : [], submitted: !!savedDec
            };
        }
        
        buildQueue();

        // OUVINTE DE TURNO (MUITO IMPORTANTE PARA O BRILHO NO JOGADOR E MESTRE)
        unsubTurn = activeTurnId.subscribe(value => {
            console.log("NEXUS | Turno Atualizado para:", value);
            // Svelte detecta a mudança na variável global e passa pro Carrossel
        });

        // OUVINTE DA CENA (PRO JOGADOR VER O QUE O MESTRE FEZ)
hookIdScene = Hooks.on("updateScene", (scene, data) => {
            if (!isGM) {
                const flags = data.flags?.[MODULE_ID];
                if (flags) {
                    if (flags.combatPhase) phase = flags.combatPhase;
                    
                    // NOVO: JOGADOR VÊ O TURNO AMARELO MUDAR AQUI:
                    if (flags.activeTurnId) activeTurnId.set(flags.activeTurnId); 
                    
                    if (flags.combatNpcs) {
                        declarationQueue = CombatEngine.buildDeclarationQueue(flags.combatNpcs);
                        declarationQueue = [...declarationQueue];
                    }
                }
            }
        });
    });

    onDestroy(() => { 
        if (hookIdSocket) Hooks.off("nexusCombatVectorsReceived", hookIdSocket); 
        if (hookIdScene) Hooks.off("updateScene", hookIdScene);
        if (unsubTurn) unsubTurn(); // Desliga a escuta do turno
    });

    async function saveGmState() {
        if (!isGM || !canvas.scene) return;
        await canvas.scene.update({
            [`flags.${MODULE_ID}.combatNpcs`]: npcs,
            [`flags.${MODULE_ID}.combatPhase`]: phase
        });
    }

    function buildQueue() {
        if (isGM) { 
            declarationQueue = CombatEngine.buildDeclarationQueue([...npcs]); 
            saveGmState(); 
        } else { 
            declarationQueue = CombatEngine.buildDeclarationQueue(canvas.scene?.getFlag(MODULE_ID, "combatNpcs") || []); 
        }
    }

    function handleNpcUpdate(e) {
        if (isGM) { 
            npcs = npcs.map(n => n.id === e.detail.id ? e.detail : n); 
            npcs = [...npcs]; // Soco Reativo pro Mestre também
            buildQueue(); 
            saveGmState(); 
        } else { 
            playerEntity = e.detail; 
        }
    }

    function handlePullPlayers() {
        const onlineUsers = game.users.filter(u => !u.isGM && u.active && u.character);
        onlineUsers.forEach(u => {
            const char = u.character;
            const savedDec = u.getFlag(MODULE_ID, "combatDeclaration");
            
            if (!npcs.find(n => n.actorId === char.id)) {
                npcs = [...npcs, {
                    id: foundry.utils.randomID(), actorId: char.id, name: char.name, img: char.img,
                    isNpc: false, userId: u.id, ready: !!savedDec,
                    stats: savedDec?.stats || { sense: char.system?.stats?.sense?.value || 1, command: char.system?.stats?.command?.value || 1, mind: 1, coordination: 1 },
                    pool: savedDec?.pool || { d: char.system?.stats?.body?.value || 4, hd: 0, wd: 0, spray: 0, buff: 0 }, 
                    poolToRoll: savedDec?.pool || null,
                    actions: savedDec?.actions || [], 
                    submitted: !!savedDec
                }];
            }
        });
        buildQueue();
    }

    async function handleForceRefresh() {
        if (!isGM) return;
        
        // Varre todos os usuários online e puxa a ficha deles de novo na marra
        game.users.filter(u => !u.isGM).forEach(u => {
            const savedDec = u.getFlag(MODULE_ID, "combatDeclaration");
            if (savedDec) {
                // Atualiza o jogador que já está na lista do mestre
                npcs = npcs.map(n => {
                    if (n.userId === u.id || n.actorId === savedDec.actorId) {
                        return {
                            ...n,
                            ready: true,
                            submitted: true,
                            stats: savedDec.stats || n.stats,
                            pool: savedDec.pool || n.pool,
                            poolToRoll: savedDec.pool || n.pool,
                            actions: savedDec.actions || []
                        };
                    }
                    return n;
                });
            }
        });

        // Soco de Reatividade Duplo
        npcs = [...npcs];
        buildQueue();
        await saveGmState();

        ui.notifications.info("SISTEMA RESSINCRONIZADO: Dados de todos os jogadores foram atualizados.");
    }

    function handleAddTargetedNpcs() {
        const targets = Array.from(game.user.targets);
        targets.forEach(t => {
            const char = t.actor;
            if (!char) return;
            npcs = [...npcs, {
                id: foundry.utils.randomID(), actorId: char.id, name: char.name, img: char.img,
                isNpc: true, ready: false, stats: { sense: char.system?.stats?.sense?.value || 1, command: char.system?.stats?.command?.value || 1, mind: 1, coordination: 1 },
                pool: { d: char.system?.stats?.body?.value || 3, hd: 0, wd: 0, spray: 0, buff: 0 }, actions: [], submitted: false
            }];
        });
        buildQueue();
    }

    async function handleStartCombat() { if (declarationQueue.length === 0) return; phase = 'resolution'; await saveGmState(); }

    async function handleReturnToDeclaration() {
        if (!isGM) return;
        await CombatManager.resetResolutionState();
        phase = 'declaration';
        npcs = npcs.map(n => ({...n, ready: false, submitted: false, actions: []}));
        for (let u of game.users) { if (!u.isGM) await u.unsetFlag(MODULE_ID, "combatDeclaration"); }
        await saveGmState();
    }

    function toggleMinimize() { isMinimized = !isMinimized; }
    function onMouseMove(e) {
        if (isDragging) { pos.x += e.movementX; pos.y += e.movementY; }
        if (isResizing && !isMinimized) { size.w += e.movementX; size.h += e.movementY; }
    }
    async function onMouseUp() {
        if (isDragging) { isDragging = false; await game.user.setFlag(MODULE_ID, "hubPos", pos); }
        if (isResizing) { isResizing = false; await game.user.setFlag(MODULE_ID, "hubSize", size); }
    }
</script>

<svelte:window on:mousemove={onMouseMove} on:mouseup={onMouseUp} />

<div class="combat-hub-wrapper no-drag" 
     class:minimized={isMinimized}
     style="left: {pos.x}px; top: {pos.y}px; width: {isMinimized ? '300px' : size.w + 'px'}; height: {isMinimized ? 'auto' : size.h + 'px'};" 
     transition:fade>
    
    <div class="window-grip" on:mousedown={() => isDragging = true}>
        <div class="grip-title">
            <i class="fas fa-crosshairs"></i> NEXUS COMBAT 
            <span style="opacity:0.5; margin-left:10px;">[{phase.toUpperCase()}]</span>
        </div>
        
        <div class="win-buttons">
            <button class="win-btn" on:mousedown|stopPropagation on:click|stopPropagation={toggleMinimize} title="Minimizar">
                <i class="fas {isMinimized ? 'fa-window-maximize' : 'fa-window-minimize'}"></i>
            </button>
            <button class="win-btn close" on:mousedown|stopPropagation on:click|stopPropagation={handleClose} title="Fechar">
                <i class="fas fa-times"></i>
            </button>
        </div>
    </div>

    {#if !isMinimized}
        <div class="hub-inner-content" transition:slide>
            
            <CombatCarousel 
                queue={declarationQueue} 
                activeTurnId={$activeTurnId} 
                {isGM} 
                {phase}
                on:setTurn={(e) => CombatManager.setTurn(e.detail)}
                on:startCombat={handleStartCombat}
                on:selectNpc={(e) => selectedNpcId = e.detail}
            />

            <div class="hub-layout">
                {#if phase === 'declaration'}
                    <div class="sidebar-wrapper">
                        {#if isGM}
<CombatList 
                                {isGM} 
                                queue={declarationQueue} 
                                selectedId={selectedNpcId} 
                                activeTurnId={$activeTurnId}
                                on:pullPlayers={handlePullPlayers} 
                                on:pullTargets={handleAddTargetedNpcs}
                                on:selectNpc={(e) => selectedNpcId = e.detail}
                                on:setTurn={(e) => CombatManager.setTurn(e.detail)}
                                on:removeNpc={(e) => { npcs = npcs.filter(n => n.id !== e.detail); buildQueue(); }}
                                on:startCombat={handleStartCombat}
                                on:refreshData={handleForceRefresh} />
                        {:else}
                            {#if playerEntity}
                                <div class="player-profile">
                                    <img src={playerEntity.img} alt="P"/>
                                    <h3>{playerEntity.name}</h3>
                                    <div class="status {playerEntity.submitted ? 'ready' : 'waiting'}">
                                        {playerEntity.submitted ? 'VETOR TRANSMITIDO' : 'PROGRAMANDO VETOR'}
                                    </div>
                                    <p class="stats">SENSE: {playerEntity.stats?.sense || 1}</p>
                                </div>
                            {/if}
                        {/if}
                    </div>
                    
                    <div class="main-wrapper">
                        {#if activeEntityToEdit}
                            <TerminalPanel entity={activeEntityToEdit} {isGM} on:npcUpdated={handleNpcUpdate} />
                        {:else}
                            <div class="empty-state">
                                <i class="fas fa-satellite-dish fa-spin"></i>
                                <p>AGUARDANDO SELEÇÃO DE ALVO...</p>
                            </div>
                        {/if}
                    </div>
                {:else}
                    <ResolutionPanel combatantsData={declarationQueue} {isGM} on:endCombat={handleReturnToDeclaration} />
                {/if}
            </div>

            <div class="resize-handle" on:mousedown|stopPropagation={() => isResizing = true}></div>
        </div>
    {/if}
</div>

<style>
    .combat-hub-wrapper { 
        position: fixed; background: #050505; border: 2px solid var(--c-primary, #00ff41); 
        box-shadow: 0 20px 50px rgba(0,0,0,0.9); border-radius: 8px; display: flex; flex-direction: column; 
        overflow: hidden; font-family: 'Share Tech Mono', monospace; pointer-events: all; 
        z-index: 100; min-width: 800px; min-height: 500px; 
    }
    .combat-hub-wrapper.minimized { min-width: 300px !important; min-height: auto !important; height: auto !important; }
    
    .window-grip { background: var(--c-primary, #00ff41); color: #000; padding: 5px 10px; display: flex; justify-content: space-between; font-weight: bold; cursor: move; user-select: none; align-items: center; z-index: 50; }
    .win-buttons { display: flex; gap: 5px; }
    .win-btn { background: transparent; border: none; font-weight: bold; cursor: pointer; font-size: 14px; color: #000; padding: 2px 6px; border-radius: 4px; pointer-events: all; }
    .win-btn:hover { background: #000; color: var(--c-primary, #00ff41); }
    .win-btn.close:hover { color: #f33; }
    
    .hub-inner-content { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; width: 100%; height: 100%; }
    .hub-layout { display: flex; flex: 1; min-height: 0; overflow: hidden; width: 100%; height: 100%; }
    
    .sidebar-wrapper { width: 260px; height: 100%; background: #0a0a0a; border-right: 1px solid var(--c-primary, #00ff41); flex-shrink: 0; overflow: hidden; }
    .main-wrapper { flex: 1; height: 100%; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }

    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #222; text-align: center; }
    .empty-state i { font-size: 60px; margin-bottom: 15px; }

    .player-profile { padding: 20px; text-align: center; color: #fff; }
    .player-profile img { width: 100px; height: 100px; border-radius: 50%; border: 2px solid var(--c-primary, #00ff41); object-fit: cover; margin-bottom: 10px; }
    .player-profile h3 { margin: 0; color: var(--c-primary, #00ff41); text-transform: uppercase; }
    .player-profile .status { font-size: 10px; font-weight: bold; margin: 10px 0; padding: 4px; border-radius: 4px; }
    .player-profile .status.waiting { background: rgba(255, 170, 0, 0.2); color: #ffaa00; border: 1px dashed #ffaa00; }
    .player-profile .status.ready { background: rgba(0, 255, 65, 0.2); color: var(--c-primary, #00ff41); border: 1px solid var(--c-primary, #00ff41); }

    .resize-handle { position: absolute; right: 0; bottom: 0; width: 20px; height: 20px; cursor: nwse-resize; background: linear-gradient(135deg, transparent 50%, var(--c-primary, #00ff41) 50%); z-index: 1000; opacity: 0.5; }
    .resize-handle:hover { opacity: 1; }
</style>