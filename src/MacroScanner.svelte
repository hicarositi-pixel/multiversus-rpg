<script>
    import { scale, fade, fly } from 'svelte/transition';
    import { onMount, onDestroy, createEventDispatcher } from 'svelte';
    import { cubicOut, elasticOut } from 'svelte/easing';
    
    // --- IMPORTS DE APLICATIVOS (Atualizado para o novo CombatHub) ---
import CombatHub from './apps/combat/CombatHub.svelte'; // Caminho corrigido
    import StoreApp from './StoreApp.svelte'; // Mantido (já estava certo)
    import RollEngine from './apps/components/RollEngine.svelte'; // Caminho corrigido
    import MiroHub from './MiroHub.svelte'; // Mantido (já estava certo)

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
    let showBoardSelector = false;

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
            ui.notifications.info("BIOMETRIA VINCULADA");
        }
        isOpen = !isOpen;
        if (!isOpen) showBoardSelector = false;
    }

    function openApp(appId, e) {
        if (e) e.stopPropagation();
        
        // 1. Ficha Original do Foundry
        if (appId === 'ficha') {
            if (currentActor) currentActor.sheet.render(true);
            else ui.notifications.warn("Nenhum alvo selecionado. Clique em um token primeiro.");
            isOpen = false; return;
        }
        
        // 2. Ficha Móvel Tática (Svelte App Independente)
        if (appId === 'mobileHud') {
            const api = game.modules.get(MODULE_ID)?.api;
            if (api && api.MobileHudApp) {
                const existing = Object.values(ui.windows).find(w => w.id === "nexus-mobile-hud-app");
                if (existing) existing.close();
                else new api.MobileHudApp().render(true);
            } else {
                ui.notifications.error("SISTEMA TÁTICO OFFLINE. A API não foi carregada.");
            }
            isOpen = false; return;
        }

        // 3. Seletor do Detetive (Miro)
        if (appId === 'detetive') {
            showBoardSelector = !showBoardSelector;
            return;
        }
        
        // 4. Os outros apps que abrem direto em cima da tela (CombatHub, Loja, Dados)
        activeApp = (activeApp === appId) ? null : appId;
        isOpen = false;
        showBoardSelector = false;
    }

    function launchMiro(mode) {
        if (mode === 'gm' && !user.isGM) return ui.notifications.error("ACESSO NEGADO: PROTOCOLO DE MESTRE EXIGIDO");
        miroMode = mode;
        showMiro = true;
        isOpen = false;
        showBoardSelector = false;
    }
</script>

<svelte:window on:mousemove={handleMouseMove} on:mouseup={handleMouseUp} />

<div class="apps-overlay">
    {#if activeApp === 'combate'}
        <CombatHub actor={currentActor} on:close={() => activeApp = null} />
    {/if}

    {#if activeApp === 'loja'}
        <StoreApp actor={currentActor} on:close={() => activeApp = null} />
    {/if}

    {#if activeApp === 'dados'}
        <RollEngine 
            actor={currentActor} 
            actionName="Ação Padrão (Sem Poder)" 
            pool={{d: 2, hd: 0, wd: 0}} 
            theme={{primary: themeColor, bg: "#000"}} 
            onClose={() => activeApp = null} 
        />
    {/if}

    {#if showMiro}
        <MiroHub themeColor={themeColor} mode={miroMode} onClose={() => showMiro = false} />
    {/if}
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
            <div class="star-orbit" transition:scale={{duration: 500, easing: elasticOut}}>
                
                <div class="tech-ring"></div>
                <div class="hex-wireframe"></div>

                <button class="m-btn star-pt n1" on:click={(e) => openApp('ficha', e)} title="FICHA ORIGINAL">
                    <i class="fas fa-id-card"></i>
                </button>
                
                <button class="m-btn star-pt n2" on:click={(e) => openApp('combate', e)} title="NEXUS COMBAT OS">
                    <i class="fas fa-crosshairs"></i>
                </button>

                <button class="m-btn star-pt n3" on:click={(e) => openApp('loja', e)} title="DATABASE DE ITENS">
                    <i class="fas fa-shopping-cart"></i>
                </button>

                <button class="m-btn star-pt n4" on:click={(e) => openApp('mobileHud', e)} title="FICHA MÓVEL TÁTICA">
                    <i class="fas fa-tablet-alt"></i>
                </button>

                <button class="m-btn star-pt n5" on:click={(e) => openApp('dados', e)} title="ROLAGEM RÁPIDA">
                    <i class="fas fa-dice"></i>
                </button>

                <button class="m-btn star-pt n6" on:click={(e) => openApp('detetive', e)} title="DETETIVE HUB">
                    <i class="fas fa-search-plus"></i>
                </button>

            </div>

            {#if showBoardSelector}
                <div class="board-selector-hud" transition:fly={{x: -20, duration: 300, easing: cubicOut}}>
                    <div class="selector-title">SELEÇÃO DE MURAL</div>
                    <button class="sel-option" on:click={() => launchMiro('players')}>
                        <i class="fas fa-users"></i> ARQUIVO DO GRUPO
                    </button>
                    <button class="sel-option gm-only" class:locked={!user.isGM} on:click={() => launchMiro('gm')}>
                        <i class="fas {user.isGM ? 'fa-unlock' : 'fa-lock'}"></i> 
                        SALA ESTRATÉGICA {user.isGM ? '' : '(BLOQUEADO)'}
                    </button>
                </div>
            {/if}
        {/if}
    </div>
</div>

<style>
    /* TODO O SEU CSS DO MACROSCANNER CONTINUA EXATAMENTE AQUI */
    /* NÃO APAGUE O CSS QUE EU TE PASSEI DUAS ETAPAS ATRÁS PARA OS HEXÁGONOS PERFEITOS! */

    .apps-overlay { position: fixed; inset: 0; pointer-events: none; z-index: 20000; }
    .apps-overlay :global(> *) { pointer-events: auto; }

    .macro-scanner-root { position: fixed; z-index: 10000; pointer-events: none; user-select: none; font-family: 'Share Tech Mono', monospace; }
    .scanner-unit { position: relative; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; }

    /* GATILHO CENTRAL */
    .finger-trigger { 
        width: 60px; height: 60px; background: #050505; border: 2px solid var(--c-primary); 
        color: var(--c-primary); border-radius: 16px; display: flex; align-items: center; 
        justify-content: center; font-size: 26px; cursor: pointer; position: relative; 
        z-index: 200; pointer-events: auto; transition: 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 5px 15px rgba(0,0,0,0.8), inset 0 0 12px rgba(var(--c-primary), 0.5);
    }
    .core-glow { position: absolute; inset: 0; background: var(--c-primary); opacity: 0; border-radius: inherit; transition: 0.3s; filter: blur(15px); }
    .finger-trigger:hover { transform: scale(1.05); }
    .finger-trigger:hover .core-glow { opacity: 0.4; }
    
    .finger-trigger.is-active { 
        border-radius: 50%; transform: rotate(180deg); 
        background: var(--c-primary); color: #000; 
        box-shadow: 0 0 25px var(--c-primary); 
    }

    .star-orbit { position: absolute; width: 240px; height: 240px; pointer-events: none; display: flex; align-items: center; justify-content: center; z-index: 150; }

    .tech-ring { position: absolute; inset: 10px; border-radius: 50%; border: 1px dashed var(--c-primary); opacity: 0.3; animation: spin 25s linear infinite; }
    .hex-wireframe { position: absolute; inset: 30px; border: 1px solid var(--c-primary); opacity: 0.2; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); animation: pulseGlow 3s infinite alternate; }

    .m-btn { 
        position: absolute; width: 48px; height: 48px; background: #0a0a0f; 
        border: 2px solid var(--c-primary); color: var(--c-primary); border-radius: 50%;
        cursor: pointer; pointer-events: auto; display: flex; align-items: center; 
        justify-content: center; font-size: 18px; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        box-shadow: 0 5px 15px rgba(0,0,0,0.8), inset 0 0 10px rgba(0, 0, 0, 0.9);
        z-index: 160;
    }
    
    .m-btn:hover { 
        background: var(--c-primary); color: #000; 
        transform: translate(-50%, -50%) scale(1.2) !important; 
        box-shadow: 0 0 20px var(--c-primary), inset 0 0 5px #fff; 
    }

    .n1 { top: 0%; left: 50%; transform: translate(-50%, -50%); animation: float1 4s ease-in-out infinite; } 
    .n2 { top: 25%; left: 93.3%; transform: translate(-50%, -50%); animation: float2 4.5s ease-in-out infinite; } 
    .n3 { top: 75%; left: 93.3%; transform: translate(-50%, -50%); animation: float3 4.2s ease-in-out infinite; } 
    .n4 { top: 100%; left: 50%; transform: translate(-50%, -50%); animation: float1 4.7s ease-in-out infinite; } 
    .n5 { top: 75%; left: 6.7%; transform: translate(-50%, -50%); animation: float2 4.1s ease-in-out infinite; } 
    .n6 { top: 25%; left: 6.7%; transform: translate(-50%, -50%); animation: float3 4.6s ease-in-out infinite; } 

    .board-selector-hud { position: absolute; left: 160px; top: 50%; transform: translateY(-50%); background: rgba(5,5,10,0.95); border: 1px solid var(--c-primary); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px; width: 180px; pointer-events: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.8); backdrop-filter: blur(5px); }
    .selector-title { font-size: 10px; font-weight: bold; color: var(--c-primary); border-bottom: 1px dashed var(--c-primary); padding-bottom: 6px; margin-bottom: 4px; letter-spacing: 1px; }
    .sel-option { background: rgba(255,255,255,0.05); border: 1px solid transparent; border-radius: 4px; color: #ddd; padding: 10px; font-size: 11px; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 10px; transition: 0.2s; }
    .sel-option:hover { background: var(--c-primary); color: #000; border-color: var(--c-primary); font-weight: bold; }
    .sel-option.locked { opacity: 0.4; cursor: not-allowed; filter: grayscale(1); }
    .sel-option.locked:hover { background: rgba(255,0,0,0.2); border-color: red; color: red; }

    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes pulseGlow { from { opacity: 0.1; } to { opacity: 0.5; box-shadow: inset 0 0 30px var(--c-primary); } }
    
    @keyframes float1 { 0%, 100% { margin-top: 0px; } 50% { margin-top: -6px; } }
    @keyframes float2 { 0%, 100% { margin-top: 0px; } 50% { margin-top: -4px; } }
    @keyframes float3 { 0%, 100% { margin-top: 0px; } 50% { margin-top: -8px; } }

    .scan-line { position: absolute; width: 100%; height: 2px; background: var(--c-primary); top: 0; animation: scan 2s infinite linear; opacity: 0.4; pointer-events: none; }
    @keyframes scan { 0% { top: 0%; } 100% { top: 100%; } }
</style>