<script>
    import { scale, fade, fly } from 'svelte/transition';
    import { onMount, onDestroy, createEventDispatcher } from 'svelte';
    import { cubicOut, elasticOut } from 'svelte/easing';
    
    import CombatTerminal from './CombatTerminal.svelte'; 
    import CombatResolution from './CombatResolution.svelte';
    import StoreApp from './StoreApp.svelte'; 
    import DiceLogic from './DiceLogic.svelte'; 
    import MiroHub from './MiroHub.svelte';

    const MODULE_ID = "multiversus-rpg";
    const user = game.user;
    const dispatch = createEventDispatcher();

    // --- PROPS & ATOR ---
    export let actor = null; 
    $: currentActor = actor || user.character || canvas.tokens.controlled[0]?.actor || null;

    // --- ESTADO & CORES ---
    let pos = user.getFlag(MODULE_ID, "hubPos") || { x: 100, y: 100 };
    let isRegistered = user.getFlag(MODULE_ID, "isRegistered") || false;
    let isOpen = false;
    let activeApp = null;
    let showMiro = false;
    let miroMode = "players";
    let combatData = null;
    let showBoardSelector = false; // Seletor customizado

    // PEGA A COR DO TEMA GLOBAL (ou da ficha do personagem)
    $: themeColor = user.getFlag(MODULE_ID, "globalTheme") || (currentActor?.flags?.[MODULE_ID]?.sheetConfig?.themeColor) || "#00ff41";

    // --- LÓGICA DE MOVIMENTO ---
    let isDragging = false;
    let hasMovedSignificant = false;
    let startCoords = { x: 0, y: 0 };
    let startPos = { x: 0, y: 0 };

    function handleMouseDown(e) {
        e.preventDefault(); e.stopPropagation();
        isDragging = true; hasMovedSignificant = false;
        startCoords = { x: e.clientX, y: e.clientY };
        startPos = { x: pos.x, y: pos.y };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }

    function handleMouseMove(e) {
        if (!isDragging) return;
        const dx = e.clientX - startCoords.x;
        const dy = e.clientY - startCoords.y;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            hasMovedSignificant = true;
            pos.x = startPos.x + dx;
            pos.y = startPos.y + dy;
        }
    }

    async function handleMouseUp() {
        if (isDragging) {
            isDragging = false;
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            if (hasMovedSignificant) await user.setFlag(MODULE_ID, "hubPos", pos);
        }
    }

    // --- INTERAÇÃO ---
    async function toggleMainScanner(e) {
        e.stopPropagation();
        if (hasMovedSignificant) return;
        if (!isRegistered) {
            isRegistered = true;
            await user.setFlag(MODULE_ID, "isRegistered", true);
            ui.notifications.info("BIOMETRIA_VINCULADA");
        }
        isOpen = !isOpen;
        if (!isOpen) showBoardSelector = false;
    }

    function openApp(appId, e) {
        if (e) e.stopPropagation();
        if (appId === 'ficha') {
            if (currentActor) currentActor.sheet.render(true);
            else ui.notifications.warn("PERSONAGEM_NÃO_ENCONTRADO");
            isOpen = false; return;
        }
        if (appId === 'detetive') {
            showBoardSelector = !showBoardSelector;
            return;
        }
        activeApp = (activeApp === appId) ? null : appId;
        isOpen = false;
    }

    function launchMiro(mode) {
        if (mode === 'gm' && !user.isGM) return ui.notifications.error("ACESSO_NEGADO: PROTOCOLO_MESTRE");
        miroMode = mode;
        showMiro = true;
        isOpen = false;
        showBoardSelector = false;
    }
</script>

<svelte:window on:mousemove={handleMouseMove} on:mouseup={handleMouseUp} />

<div class="apps-overlay">
    {#if activeApp === 'combate'}<CombatTerminal actor={currentActor} on:close={() => activeApp = null} on:officialize={(e) => { combatData = e.detail; activeApp = 'resolucao'; }} />{/if}
    {#if activeApp === 'resolucao'}<CombatResolution data={combatData} themeColor={themeColor} on:close={() => activeApp = null} />{/if}
    {#if activeApp === 'loja'}<StoreApp actor={currentActor} on:close={() => activeApp = null} />{/if}
    {#if activeApp === 'dados'}<DiceLogic on:close={() => activeApp = null} />{/if}
    {#if showMiro}<MiroHub themeColor={themeColor} mode={miroMode} onClose={() => showMiro = false} />{/if}
</div>

<div class="macro-scanner-root" style="left: {pos.x}px; top: {pos.y}px; --c-primary: {themeColor}">
    
    <div class="scanner-unit">
        <div class="finger-trigger" 
             class:is-active={isOpen}
             class:is-registered={isRegistered}
             on:mousedown={handleMouseDown}
             on:click={toggleMainScanner}>
            <div class="core-glow"></div>
            <i class="fas {isRegistered ? 'fa-microchip' : 'fa-fingerprint'}"></i>
            <div class="scan-line"></div>
        </div>

        {#if isOpen}
            <div class="star-orbit" transition:scale={{duration: 400, easing: cubicOut}}>
                
                <button class="m-btn star-pt n1" on:click={(e) => openApp('ficha', e)} title="PERFIL_BIOMÉTRICO">
                    <i class="fas fa-id-card"></i>
                </button>
                
                <button class="m-btn star-pt n2" on:click={(e) => openApp('combate', e)} title="TERMINAL_ATAQUE">
                    <i class="fas fa-hand-fist"></i>
                </button>

                <button class="m-btn star-pt n3" on:click={(e) => openApp('loja', e)} title="DATABASE_ITENS">
                    <i class="fas fa-shopping-cart"></i>
                </button>

                <button class="m-btn star-pt n4" on:click={(e) => openApp('dados', e)} title="LÓGICA_DADOS">
                    <i class="fas fa-dice"></i>
                </button>

                <button class="m-btn star-pt n5" on:click={(e) => openApp('detetive', e)} title="DETETIVE_HUB">
                    <i class="fas fa-search-plus"></i>
                </button>

                <div class="star-deco"></div>
            </div>

            {#if showBoardSelector}
                <div class="board-selector-hud" transition:fly={{x: 20, duration: 300}}>
                    <div class="selector-title">SELEÇÃO_DE_MURAL</div>
                    <button class="sel-option" on:click={() => launchMiro('players')}>
                        <i class="fas fa-users"></i> ARQUIVO_GRUPO
                    </button>
                    <button class="sel-option gm-only" class:locked={!user.isGM} on:click={() => launchMiro('gm')}>
                        <i class="fas {user.isGM ? 'fa-unlock' : 'fa-lock'}"></i> 
                        SALA_ESTRATÉGICA {user.isGM ? '' : '(BLOQUEADO)'}
                    </button>
                </div>
            {/if}
        {/if}
    </div>
</div>

<style>
    .apps-overlay { position: fixed; inset: 0; pointer-events: none; z-index: 20000; }
    .apps-overlay :global(> *) { pointer-events: auto; }

    .macro-scanner-root { position: fixed; z-index: 10000; pointer-events: none; user-select: none; font-family: 'Share Tech Mono', monospace; }
    .scanner-unit { position: relative; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; }

    /* GATILHO CENTRAL */
    .finger-trigger { 
        width: 60px; height: 60px; background: #000; border: 2px solid var(--c-primary); 
        color: var(--c-primary); border-radius: 15px; display: flex; align-items: center; 
        justify-content: center; font-size: 26px; cursor: pointer; position: relative; 
        z-index: 100; pointer-events: auto; transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        box-shadow: 0 0 15px rgba(0,0,0,0.8), inset 0 0 10px var(--c-primary);
    }
    .core-glow { position: absolute; inset: 0; background: var(--c-primary); opacity: 0; border-radius: inherit; transition: 0.3s; filter: blur(15px); }
    .finger-trigger:hover .core-glow { opacity: 0.3; }
    .finger-trigger.is-active { border-radius: 50%; transform: rotate(180deg); background: var(--c-primary); color: #000; box-shadow: 0 0 30px var(--c-primary); }

    /* ÓRBITA DA ESTRELA */
    .star-orbit { position: absolute; width: 220px; height: 220px; pointer-events: none; display: flex; align-items: center; justify-content: center; }

    .m-btn { 
        position: absolute; width: 45px; height: 45px; background: #000; 
        border: 2px solid var(--c-primary); color: var(--c-primary); border-radius: 50%;
        cursor: pointer; pointer-events: auto; display: flex; align-items: center; 
        justify-content: center; font-size: 18px; transition: 0.3s;
        animation: breathe 4s infinite ease-in-out;
    }
    .m-btn:hover { background: var(--c-primary); color: #000; transform: scale(1.2); box-shadow: 0 0 20px var(--c-primary); }

    /* POSICIONAMENTO PENTAGONAL */
    .n1 { top: 0; } /* Topo */
    .n2 { top: 30%; right: 0; animation-delay: 0.5s; } /* Superior Direita */
    .n3 { bottom: 5%; right: 15%; animation-delay: 1s; } /* Inferior Direita */
    .n4 { bottom: 5%; left: 15%; animation-delay: 1.5s; } /* Inferior Esquerda */
    .n5 { top: 30%; left: 0; animation-delay: 2s; } /* Superior Esquerda */

    .star-deco { 
        position: absolute; inset: 30px; border: 1px solid var(--c-primary); 
        clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
        opacity: 0.15; animation: spin 20s linear infinite;
    }

    /* SELETOR DE MURAL */
    .board-selector-hud {
        position: absolute; left: 140px; top: 50%; transform: translateY(-50%);
        background: rgba(0,0,0,0.9); border: 1px solid var(--c-primary);
        padding: 10px; display: flex; flex-direction: column; gap: 8px;
        width: 180px; pointer-events: auto; box-shadow: 10px 0 30px rgba(0,0,0,0.5);
    }
    .selector-title { font-size: 9px; color: var(--c-primary); border-bottom: 1px solid var(--c-primary); padding-bottom: 4px; margin-bottom: 4px; opacity: 0.7; }
    .sel-option { 
        background: transparent; border: 1px solid rgba(var(--c-primary), 0.3);
        color: #fff; padding: 8px; font-size: 10px; cursor: pointer; text-align: left;
        display: flex; align-items: center; gap: 10px; transition: 0.2s;
    }
    .sel-option:hover { background: var(--c-primary); color: #000; }
    .sel-option.locked { opacity: 0.3; cursor: not-allowed; filter: grayscale(1); }

    /* ANIMAÇÕES */
    @keyframes breathe { 0%, 100% { transform: scale(1); box-shadow: 0 0 5px var(--c-primary); } 50% { transform: scale(1.08); box-shadow: 0 0 15px var(--c-primary); } }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .scan-line { position: absolute; width: 100%; height: 2px; background: var(--c-primary); top: 0; animation: scan 2s infinite linear; opacity: 0.4; pointer-events: none; }
    @keyframes scan { 0% { top: 0%; } 100% { top: 100%; } }
    .blink { animation: blink 1s infinite; }
    @keyframes blink { 50% { opacity: 0.3; } }
</style>