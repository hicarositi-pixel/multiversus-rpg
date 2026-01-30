<script>
    import { onMount, createEventDispatcher } from 'svelte';
    import { fade, fly, slide } from 'svelte/transition';
    import { flip } from 'svelte/animate';
    import { quintOut } from 'svelte/easing';

    export let data; // { players: [], npcs: [] }
    export let themeColor = "#00ff41";
    
    const dispatch = createEventDispatcher();
    const isGM = game.user.isGM;
    const MODULE_ID = "multiversus-rpg";

    // --- POSICIONAMENTO (WIDGETS FLUTUANTES) ---
    // A Timeline fica na esquerda, o HUD fica grudado nela
    let pos = { x: 20, y: 100 }; 
    let isDragging = false;

    // --- ESTADOS ---
    let combatants = [];
    let activeUnitId = null; // Quem está sendo exibido no HUD
    let timeline = [];

    // --- MIRA (TARGETING) ---
    let targeting = { active: false, sourceId: null, setType: null, setIndex: null, setStats: {w:0,h:0}, isInterference: false };

    // --- INICIALIZAÇÃO ---
    onMount(() => {
        const rawList = [...data.players, ...data.npcs];
        
        combatants = rawList.map(c => {
            const unitId = c.actorId || foundry.utils.randomID();
            
            // Define se é o personagem do usuário atual
            const isMyChar = !isGM && (c.name === game.user.name || c.name === game.user.character?.name);
            if (isMyChar) activeUnitId = unitId;

            return {
                ...c,
                id: unitId,
                pool: initPool(c), // Gera pool SEM reação
                reactionUsed: false,
                reactionPool: { d: c.dice.reactD || 0 }, // Guarda dados de reação
                currentSets: [],
                actions: ensureActions(c.actions)
            };
        });

        // Se for GM, seleciona o primeiro da lista
        if (isGM && combatants.length > 0) activeUnitId = combatants[0].id;
        
        calculateTimeline();
    });

    function ensureActions(actions) {
        if (!actions || actions.length === 0) return [{ type: 'geral', text: 'Ação Improvisada' }];
        return actions;
    }

    // Gera pool inicial (D + HD + WD - Reação)
    function initPool(c) {
        let p = [];
        // Hard Dice
        for(let i=0; i<(c.dice.hd||0); i++) p.push({ val: 10, type: 'hd', locked: true });
        // Normal Dice (Base + Buffs - Debuffs)
        // Nota: Reação NÃO entra aqui ainda
        let normalD = Math.max(0, (c.dice.d || 0)); 
        for(let i=0; i<normalD; i++) p.push({ val: rollD10(), type: 'd', locked: true });
        // Wiggle Dice
        for(let i=0; i<(c.dice.wd||0); i++) p.push({ val: 0, type: 'wd', locked: false });
        return p;
    }

    function rollD10() { return Math.floor(Math.random() * 10) + 1; }

    // --- CÁLCULO CORE DO ORE (REATIVO) ---
    // Chamado sempre que um dado muda ou reação é ativada
    function calculateTimeline() {
        let list = [];
        
        combatants.forEach(c => {
            // 1. Contagem de Dados
            const counts = {};
            c.pool.filter(d => d.val > 0).forEach(d => counts[d.val] = (counts[d.val] || 0) + 1);
            
            // 2. Formação de Sets
            const sets = Object.entries(counts)
                .filter(([v, count]) => count >= 2)
                .map(([v, count]) => ({ width: count, height: parseInt(v) }))
                .sort((a, b) => b.width - a.width || b.height - a.height); // Ordena sets internos

            c.currentSets = sets; // Atualiza o objeto combatente

            // 3. Criação de Itens da Timeline (Sets cruzados com Ações)
            sets.forEach((set, i) => {
                // Se o set existe mas não tem ação declarada (ex: rolou 3 sets mas só declarou 1 ação)
                // Usa uma ação genérica ou a última disponível
                let action = c.actions[i] || { type: 'utilidade', text: 'Ação Extra' };

                list.push({
                    uniqueId: `${c.id}-${set.height}-${set.width}`, // ID para animação
                    actorId: c.id,
                    name: c.name,
                    img: c.img,
                    width: set.width,
                    height: set.height,
                    action: action,
                    setIndex: i
                });
            });
        });

        // 4. ORDENAÇÃO GLOBAL DA INICIATIVA
        // Critério: Largura (Velocidade) > Altura (Qualidade)
        timeline = list.sort((a, b) => b.width - a.width || b.height - a.height);
    }

    // --- AÇÕES DO MESTRE ---
    async function endRound() {
        if (!isGM) return;
        
        // 1. Limpa as flags de declaração dos jogadores para a próxima rodada
        for (let u of game.users) {
            if (!u.isGM) await u.unsetFlag(MODULE_ID, "combatDeclaration");
        }

        // 2. Avisa no chat
        ChatMessage.create({
            content: `<div style="border:1px solid ${themeColor}; background:#000; color:${themeColor}; padding:5px; text-align:center; font-family:monospace;">>> FIM DA RODADA TÁTICA <<</div>`
        });

        // 3. Fecha a janela
        dispatch('close');
    }

    // --- REAÇÃO (O PULO DO GATO) ---
    function triggerReaction(cId) {
        const idx = combatants.findIndex(c => c.id === cId);
        const c = combatants[idx];

        if (c.reactionUsed || c.reactionPool.d <= 0) return;

        // Rola os dados novos AGORA
        for(let i=0; i<c.reactionPool.d; i++) {
            c.pool.push({ val: rollD10(), type: 'd', locked: true });
        }
        
        c.reactionUsed = true; // Marca como usada
        combatants[idx] = c;
        
        calculateTimeline(); // RECALCULA TUDO
        
        // Feedback Visual
        ui.notifications.warn(`${c.name}: Reação Ativada! Iniciativa Recalculada.`);
    }

    // --- INTERAÇÃO HUD ---
    function handleTimelineClick(item) {
        // Se estiver mirando, resolve o alvo
        if (targeting.active) {
            resolveTarget(item);
            return;
        }
        // Se for GM, clica para inspecionar no HUD
        if (isGM) {
            activeUnitId = item.actorId;
        }
    }

    // --- MIRA E EFEITOS ---
    function activateSet(cId, setIdx, setStats) {
        const c = combatants.find(u => u.id === cId);
        const act = c.actions[setIdx];

        if (act.type === 'ataque' || act.type === 'defesa') {
            targeting = {
                active: true,
                sourceId: cId,
                setType: act.type === 'ataque' ? 'ATAQUE' : 'DEFESA',
                setIndex: setIdx,
                setStats,
                isInterference: act.params?.defType === 'interferencia',
                actionData: act
            };
            ui.notifications.info(`CLIQUE NO ALVO NA LISTA DE INICIATIVA`);
        } else {
            ChatMessage.create({ content: `<b>${c.name}</b> executa: ${act.text}` });
        }
    }

    function resolveTarget(targetItem) {
        if (targetItem.actorId === targeting.sourceId) return ui.notifications.warn("Alvo inválido.");
        
        const sourceName = combatants.find(c => c.id === targeting.sourceId).name;

        if (targeting.setType === 'ATAQUE') {
            const p = targeting.actionData.params;
            ChatMessage.create({
                content: `
                <div style="background:#220000; color:#ffaaaa; border:1px solid #f00; padding:5px; font-family:monospace; font-size:11px;">
                    <div style="border-bottom:1px solid #f00; font-weight:bold; margin-bottom:4px;">${sourceName} >> ATAQUE >> ${targetItem.name}</div>
                    VEL: ${targeting.setStats.width} | LOC: ${p.location || targeting.setStats.height}<br>
                    DMG: ${p.damage} | PEN: ${p.penetration}
                    ${p.isSpray ? `<br><span style="color:#fc0">⚠ SPRAY (${p.sprayDice}D)</span>` : ''}
                </div>`
            });
        } else {
            // Lógica de Gobble Dice
            const defWidth = targeting.setStats.width;
            const atkWidth = targetItem.width;
            
            // Regra de Velocidade
            if (!targeting.isInterference && atkWidth > defWidth) {
                ui.notifications.error("DEFESA FALHOU: Ataque mais rápido que a defesa. Necessário 'Interferência'.");
                targeting = { active: false };
                return;
            }

            // Remove o dado do alvo
            const tIdx = combatants.findIndex(c => c.id === targetItem.actorId);
            let removed = 0;
            combatants[tIdx].pool = combatants[tIdx].pool.filter(d => {
                if (removed < defWidth && d.val === targetItem.height) {
                    removed++;
                    return false; // Quebra o dado
                }
                return true;
            });
            
            // Remove o dado da defesa usada
            const sIdx = combatants.findIndex(c => c.id === targeting.sourceId);
            let selfRemoved = 0;
            combatants[sIdx].pool = combatants[sIdx].pool.filter(d => {
                if (selfRemoved < defWidth && d.val === targeting.setStats.height) {
                    selfRemoved++;
                    return false; // Consome defesa
                }
                return true;
            });

            calculateTimeline(); // Atualiza visualmente
            
            ChatMessage.create({
                content: `<div style="background:#001122; color:#aaf; border:1px solid #00f; padding:5px; font-family:monospace; font-size:11px;">
                    <b>${sourceName} >> DEFESA</b><br>
                    Quebrou ${removed} dados de ${targetItem.name}.
                </div>`
            });
        }
        targeting = { active: false };
    }

    // Wiggle Dice
    function setWiggle(cId, dieIdx, val) {
        const idx = combatants.findIndex(c => c.id === cId);
        combatants[idx].pool[dieIdx].val = val;
        calculateTimeline();
    }

    // Toggle de Tipo de Ação na hora H
    function toggleType(cId, setIdx, type) {
        const idx = combatants.findIndex(c => c.id === cId);
        combatants[idx].actions[setIdx].type = type;
        calculateTimeline(); // Apenas para refresh svelte
    }

</script>

<svelte:window 
    on:mousemove={(e) => { if(isDragging) { pos.x += e.movementX; pos.y += e.movementY; } }} 
    on:mouseup={() => isDragging = false} 
/>

<div class="overlay-root" style="--theme: {themeColor}">
    
    <div class="widget timeline-widget" style="top: {pos.y}px; left: {pos.x}px;">
        <header class="drag-header" on:mousedown={() => isDragging = true}>
            <i class="fas fa-list-ol"></i>
            <span>INICIATIVA</span>
        </header>

        <div class="widget-content scrollable" class:targeting={targeting.active}>
            {#each timeline as item (item.uniqueId)}
                <div class="t-row"
                     animate:flip={{duration: 400, easing: quintOut}}
                     class:atk={item.action.type === 'ataque'}
                     class:def={item.action.type === 'defesa'}
                     class:active={activeUnitId === item.actorId}
                     on:click={() => handleTimelineClick(item)}>
                    
                    <div class="speed-badge">
                        <div class="w">{item.width}</div>
                        <div class="sep">x</div>
                        <div class="h">{item.height}</div>
                    </div>

                    <img src={item.img} alt="img" />
                    
                    <div class="t-data">
                        <div class="name">{item.name}</div>
                        <div class="desc">
                            {item.action.type.toUpperCase()}
                            {#if item.action.type === 'ataque'} <span class="dmg">+{item.action.params?.damage}</span> {/if}
                        </div>
                    </div>
                </div>
            {/each}
            {#if timeline.length === 0}
                <div class="empty">AGUARDANDO...</div>
            {/if}
        </div>
    </div>

    {#if activeUnitId}
        {@const unit = combatants.find(c => c.id === activeUnitId)}
        <div class="widget hud-widget" style="top: {pos.y}px; left: {pos.x + 230}px;" transition:fly={{x:-20, duration:300}}>
            <header class="drag-header">
                <span>>> {unit.name}</span>
                {#if !unit.reactionUsed && unit.reactionPool.d > 0}
                    <button class="react-btn" on:click={() => triggerReaction(unit.id)}>
                        ⚡ REAGIR ({unit.reactionPool.d})
                    </button>
                {/if}
            </header>

            <div class="widget-content">
                <div class="pool-grid">
                    {#each unit.pool as die, i}
                        <div class="die {die.type}" class:wiggle={die.val === 0}>
                            {#if die.val === 0}
                                <select on:change={(e) => setWiggle(unit.id, i, parseInt(e.target.value))}>
                                    <option value="0">?</option>
                                    {#each [1,2,3,4,5,6,7,8,9,10] as n}<option value={n}>{n}</option>{/each}
                                </select>
                            {:else}
                                {die.val}
                            {/if}
                        </div>
                    {/each}
                </div>

                <div class="sets-list">
                    {#each unit.currentSets as s, i}
                        <div class="set-row">
                            <span class="badge">{s.width}x{s.height}</span>
                            <div class="toggles">
                                <button class="tb atk" class:on={unit.actions[i]?.type === 'ataque'} on:click={() => toggleType(unit.id, i, 'ataque')}>⚔️</button>
                                <button class="tb def" class:on={unit.actions[i]?.type === 'defesa'} on:click={() => toggleType(unit.id, i, 'defesa')}>🛡️</button>
                            </div>
                            <button class="go-btn" on:click={() => activateSet(unit.id, i, s)}>GO</button>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    {/if}

    {#if isGM}
        <div class="gm-controls" style="top: {pos.y + 400}px; left: {pos.x}px;">
            <button class="end-round-btn" on:click={endRound}>ENCERRAR RODADA</button>
        </div>
    {/if}

    {#if targeting.active}
        <div class="target-float" style="top: {pos.y - 40}px; left: {pos.x}px;">
            <span class="blink">SELECIONE ALVO: {targeting.setType}</span>
            <button on:click={() => targeting = {active:false}}>X</button>
        </div>
    {/if}

</div>

<style>
    /* O Container Global é invisível para cliques */
    .overlay-root {
        position: fixed; inset: 0; z-index: 45000; pointer-events: none;
        font-family: 'Share Tech Mono', monospace;
    }

    /* Estilo Base dos Widgets (Opacos e Clicáveis) */
    .widget {
        position: absolute; pointer-events: auto;
        background: rgba(5, 5, 5, 0.95);
        border: 1px solid var(--theme);
        box-shadow: 0 0 15px rgba(0,0,0,0.8);
        border-radius: 4px; display: flex; flex-direction: column;
    }

    .drag-header {
        background: var(--theme); color: #000; padding: 4px 8px;
        font-size: 11px; font-weight: bold; cursor: grab; display: flex; justify-content: space-between; align-items: center;
    }
    .drag-header:active { cursor: grabbing; }

    .widget-content { padding: 5px; }
    .scrollable { overflow-y: auto; max-height: 400px; }
    
    /* --- TIMELINE WIDGET --- */
    .timeline-widget { width: 220px; }
    
    .t-row {
        display: flex; align-items: center; padding: 4px; margin-bottom: 2px;
        background: rgba(255,255,255,0.05); border-left: 3px solid #444;
        cursor: pointer; transition: 0.2s;
    }
    .t-row:hover { background: rgba(255,255,255,0.1); }
    .t-row.active { background: rgba(255,255,255,0.15); border-right: 3px solid var(--theme); }
    .t-row.atk { border-left-color: #f33; }
    .t-row.def { border-left-color: #08f; }

    .speed-badge {
        display: flex; align-items: center; font-weight: bold; color: var(--theme);
        font-size: 14px; width: 35px; justify-content: center;
    }
    .speed-badge .sep { font-size: 9px; margin: 0 1px; color: #666; }
    .speed-badge .h { font-size: 11px; }

    .t-row img { width: 28px; height: 28px; border-radius: 4px; border: 1px solid #555; object-fit: cover; margin: 0 6px; }
    
    .t-data { flex: 1; overflow: hidden; }
    .name { font-size: 10px; opacity: 0.7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .desc { font-size: 11px; font-weight: bold; color: #eee; }
    .dmg { color: #f33; font-size: 9px; }

    /* --- HUD WIDGET --- */
    .hud-widget { width: 240px; }
    
    .react-btn { background: #fc0; border: none; color: #000; font-size: 9px; font-weight: bold; cursor: pointer; border-radius: 2px; padding: 1px 4px; animation: pulse 1s infinite; }

    .pool-grid { display: flex; flex-wrap: wrap; gap: 2px; margin-bottom: 8px; padding-bottom: 5px; border-bottom: 1px dashed #333; }
    .die { width: 22px; height: 22px; background: #111; border: 1px solid #444; color: #fff; font-size: 11px; font-weight: bold; display: flex; align-items: center; justify-content: center; }
    .die.hd { color: #f33; border-color: #f33; }
    .die.wd { color: #fc0; border-color: #fc0; }
    .die select { width: 100%; height: 100%; background: transparent; border: none; color: inherit; font-weight: bold; text-align: center; -webkit-appearance: none; }

    .set-row { display: flex; align-items: center; background: #151515; padding: 3px; margin-bottom: 3px; border-radius: 2px; }
    .badge { background: var(--theme); color: #000; font-weight: bold; font-size: 11px; padding: 1px 4px; border-radius: 2px; }
    
    .toggles { display: flex; gap: 1px; margin-left: auto; margin-right: 4px; }
    .tb { width: 18px; height: 18px; border: 1px solid #333; background: #000; color: #555; cursor: pointer; font-size: 9px; padding: 0; display: flex; align-items: center; justify-content: center; }
    .tb:hover { color: #fff; }
    .tb.atk.on { background: #f33; color: #fff; border-color: #f33; }
    .tb.def.on { background: #08f; color: #fff; border-color: #08f; }

    .go-btn { background: #333; border: none; color: #fff; font-size: 9px; font-weight: bold; cursor: pointer; padding: 0 5px; height: 18px; }
    .go-btn:hover { background: var(--theme); color: #000; }

    /* --- CONTROLES GM --- */
    .gm-controls { position: absolute; width: 220px; pointer-events: auto; }
    .end-round-btn { width: 100%; background: #400; border: 1px solid #f00; color: #fff; padding: 8px; font-weight: bold; cursor: pointer; }
    .end-round-btn:hover { background: #f00; color: #000; }

    /* --- ALERTS --- */
    .target-float { position: absolute; background: #fc0; color: #000; padding: 4px 8px; font-weight: bold; font-size: 10px; pointer-events: auto; border-radius: 2px; display: flex; gap: 10px; align-items: center; box-shadow: 0 0 10px #fc0; }
    .target-float button { background: #000; color: #fc0; border: none; cursor: pointer; font-weight: bold; }
    .blink { animation: blink 1s infinite; }
    .targeting .t-row { cursor: crosshair; opacity: 0.5; }
    .targeting .t-row:hover { opacity: 1; background: rgba(255, 204, 0, 0.15); }

    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }
    @keyframes blink { 50% { opacity: 0.5; } }
</style>