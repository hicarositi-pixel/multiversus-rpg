<script>
    import { onMount, onDestroy, createEventDispatcher } from 'svelte';
    import { fade } from 'svelte/transition';
    import { CombatEngine } from '../../../Logic/CombatEngine.js';
    
    import CombatCarousel from './CombatCarousel.svelte';
    import CombatList from './CombatList.svelte';
    import TerminalPanel from './TerminalPanel.svelte';
    import ResolutionPanel from './ResolutionPanel.svelte';

    export let actor = null; 
    const dispatch = createEventDispatcher();

    // --- FUNÇÃO DE FECHAMENTO FORÇADO ---
    export let closeApp = () => {
        // Tenta fechar por todas as instâncias possíveis do Foundry
        for (const app of foundry.applications.instances.values()) {
            if (app.id.includes("combat") || app.options?.id?.includes("combat")) {
                app.close();
            }
        }
        const legacyWin = Object.values(ui.windows).find(w => w.id?.includes("combat"));
        if (legacyWin) legacyWin.close();
    }; 

    const isGM = game.user.isGM;
    const MODULE_ID = "multiversus-rpg";
    
    let phase = 'declaration'; 
    let declarationQueue = [];
    let npcs = []; 
    let selectedNpcId = null;
    let activeTurnId = null;
    let playerEntity = null;

    $: activeEntityToEdit = isGM ? npcs.find(n => n.id === selectedNpcId) : playerEntity;

    // Estados de Janela
    let pos = { x: window.innerWidth/2 - 475, y: window.innerHeight/2 - 350 };
    let size = { w: 950, h: 700 };
    let isDragging = false;
    let isResizing = false;

    let hookIdUser;
    let hookIdScene;

    onMount(async () => {
        // 1. Recuperar posição e tamanho salvos
        const savedPos = game.user.getFlag(MODULE_ID, "hubPos");
        const savedSize = game.user.getFlag(MODULE_ID, "hubSize");
        if (savedPos) pos = savedPos;
        if (savedSize) size = savedSize;

        // 2. Recuperar Estado da Cena (Persistência no F5)
        if (isGM) {
            const savedPhase = canvas.scene?.getFlag(MODULE_ID, "combatPhase") || 'declaration';
            const savedNpcs = canvas.scene?.getFlag(MODULE_ID, "combatNpcs") || [];
            phase = savedPhase;
            npcs = savedNpcs;
        } else if (actor) {
            // Inicializa Jogador
            const s = actor.system?.stats;
            const savedDec = game.user.getFlag(MODULE_ID, "combatDeclaration");

            playerEntity = {
                id: actor.id, actorId: actor.id, name: actor.name, img: actor.img,
                isNpc: false, stats: { 
                    sense: s?.sense?.value || 1, 
                    command: s?.command?.value || 1,
                    mind: s?.mind?.value || 1,
                    coordination: s?.coordination?.value || 1
                }, 
                pool: savedDec ? savedDec.pool : { d: s?.body?.value || 4, hd: 0, wd: 0 }, 
                actions: savedDec ? savedDec.actions : [], 
                submitted: !!savedDec
            };
        }

        buildQueue();

        // 3. Hooks de Sincronização
        hookIdUser = Hooks.on("updateUser", (user) => { 
            if (isGM) {
                npcs = npcs.map(n => {
                    if (n.userId) {
                        const u = game.users.get(n.userId);
                        n.ready = !!u?.getFlag(MODULE_ID, "combatDeclaration");
                    }
                    return n;
                });
                buildQueue();
            } else if (user.id === game.user.id) {
                const isSub = !!user.getFlag(MODULE_ID, "combatDeclaration");
                if (playerEntity) {
                    playerEntity.submitted = isSub;
                    playerEntity = {...playerEntity};
                }
            }
        });

        hookIdScene = Hooks.on("updateScene", (scene, data) => {
            const phaseUpdate = data.flags?.[MODULE_ID]?.combatPhase;
            if (!isGM && phaseUpdate) phase = phaseUpdate;
        });
    });

    onDestroy(() => { 
        Hooks.off("updateUser", hookIdUser); 
        Hooks.off("updateScene", hookIdScene);
    });

    async function saveGmState() {
        if (!isGM || !canvas.scene) return;
        await canvas.scene.setFlag(MODULE_ID, "combatNpcs", npcs);
        await canvas.scene.setFlag(MODULE_ID, "combatPhase", phase);
    }

    function buildQueue() {
        if (isGM) {
            declarationQueue = CombatEngine.buildDeclarationQueue([...npcs]);
            saveGmState();
        }
    }

    function handleNpcUpdate(e) {
        const updated = e.detail;
        if (isGM) {
            npcs = npcs.map(n => n.id === updated.id ? updated : n);
            buildQueue();
        } else {
            playerEntity = updated;
        }
    }

    // --- O LOOP DE RESET DA RODADA ---
    async function handleReturnToDeclaration() {
        if (!isGM) return;
        phase = 'declaration';
        
        // Destrava os NPCs locais do mestre
        npcs = npcs.map(n => ({...n, ready: false, submitted: false}));
        
        // Destrava os Jogadores no banco de dados do Foundry
        for (let u of game.users) {
            if (!u.isGM) await u.unsetFlag(MODULE_ID, "combatDeclaration");
        }
        
        await saveGmState();
        ui.notifications.info("RODADA ENCERRADA. Vetores liberados para nova programação.");
    }

    // --- MOVIMENTAÇÃO E RESIZE ---
    function onMouseMove(e) {
        if (isDragging) { pos.x += e.movementX; pos.y += e.movementY; }
        if (isResizing) { size.w += e.movementX; size.h += e.movementY; }
    }
    async function onMouseUp() {
        if (isDragging) { isDragging = false; await game.user.setFlag(MODULE_ID, "hubPos", pos); }
        if (isResizing) { isResizing = false; await game.user.setFlag(MODULE_ID, "hubSize", size); }
    }
</script>

<svelte:window on:mousemove={onMouseMove} on:mouseup={onMouseUp} />

<div class="combat-hub-wrapper no-drag" 
     style="left: {pos.x}px; top: {pos.y}px; width: {size.w}px; height: {size.h}px;" 
     transition:fade>
    
    <div class="window-grip" on:mousedown={() => isDragging = true}>
        <div class="grip-title">
            <i class="fas fa-crosshairs"></i> NEXUS COMBAT OS 
            <span style="opacity:0.5; margin-left:10px;">[{phase.toUpperCase()}]</span>
        </div>
        <button class="win-close" on:mousedown|stopPropagation on:click|stopPropagation={closeApp}>
            <i class="fas fa-times"></i>
        </button>
    </div>

    <CombatCarousel queue={declarationQueue} />

    <div class="hub-layout">
        {#if phase === 'declaration'}
            <div class="sidebar-wrapper">
                {#if isGM}
                    <CombatList {isGM} queue={declarationQueue} selectedId={selectedNpcId} activeTurnId={activeTurnId}
                        on:pullPlayers={() => {/* lógica pull já existente */}} 
                        on:pullTargets={() => {/* lógica targets já existente */}}
                        on:selectNpc={(e) => selectedNpcId = e.detail}
                        on:setTurn={(e) => activeTurnId = (activeTurnId === e.detail ? null : e.detail)}
                        on:removeNpc={(e) => { npcs = npcs.filter(n => n.id !== e.detail); buildQueue(); }}
                        on:startCombat={async () => { phase = 'resolution'; await saveGmState(); }}
                    />
                {:else}
                    {#if playerEntity}
                        <div class="player-profile">
                            <img src={playerEntity.img} alt="P"/>
                            <h3>{playerEntity.name}</h3>
                            <p class="status">VÍNCULO BIOMÉTRICO ATIVO</p>
                        </div>
                    {/if}
                {/if}
            </div>
            
            <div class="main-wrapper">
                {#if activeEntityToEdit}
                    <TerminalPanel 
                        entity={activeEntityToEdit} 
                        {isGM} 
                        on:npcUpdated={handleNpcUpdate} 
                        on:closePanel={() => { if (isGM) selectedNpcId = null; else closeApp(); }} 
                    />
                {:else}
                    <div class="empty-state">
                        <i class="fas fa-satellite-dish fa-spin"></i>
                        <p>AGUARDANDO SELEÇÃO DE VETOR...</p>
                    </div>
                {/if}
            </div>
        {:else}
            <ResolutionPanel combatantsData={declarationQueue} {isGM} on:endCombat={handleReturnToDeclaration} />
        {/if}
    </div>

    <div class="resize-handle" on:mousedown|stopPropagation={() => isResizing = true}></div>
</div>

<style>
    .combat-hub-wrapper { position: fixed; background: #050505; border: 2px solid #00ff41; box-shadow: 0 20px 50px rgba(0,0,0,0.9); border-radius: 8px; display: flex; flex-direction: column; overflow: hidden; font-family: 'Share Tech Mono', monospace; pointer-events: all; z-index: 100; min-width: 800px; min-height: 500px; }
    
    .window-grip { background: #00ff41; color: #000; padding: 5px 10px; display: flex; justify-content: space-between; font-weight: bold; cursor: move; user-select: none; align-items: center; }
    .win-close { background: transparent; border: none; font-weight: bold; cursor: pointer; font-size: 16px; color: #000; display: flex; align-items: center; justify-content: center; width: 25px; height: 25px; transition: 0.2s; }
    .win-close:hover { background: #000; color: #00ff41; border-radius: 4px; }
    
    .hub-layout { display: flex; height: 100%; overflow: hidden; }
    .sidebar-wrapper { width: 260px; height: 100%; background: #0a0a0a; border-right: 1px solid #00ff41; flex-shrink: 0; }
    .main-wrapper { flex: 1; height: 100%; overflow: hidden; }

    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #222; text-align: center; }
    .empty-state i { font-size: 60px; margin-bottom: 15px; }
    .empty-state p { font-weight: bold; letter-spacing: 2px; }

    .player-profile { padding: 20px; text-align: center; color: #fff; }
    .player-profile img { width: 100px; height: 100px; border-radius: 50%; border: 2px solid #00ff41; object-fit: cover; margin-bottom: 10px; box-shadow: 0 0 20px rgba(0,255,65,0.3); }
    .player-profile h3 { margin: 0; color: #00ff41; text-transform: uppercase; }
    .player-profile .status { font-size: 9px; color: #00aaff; font-weight: bold; margin-top: 5px; }

    .resize-handle { position: absolute; right: 0; bottom: 0; width: 20px; height: 20px; cursor: nwse-resize; background: linear-gradient(135deg, transparent 50%, #00ff41 50%); z-index: 1000; opacity: 0.5; }
    .resize-handle:hover { opacity: 1; }
</style>