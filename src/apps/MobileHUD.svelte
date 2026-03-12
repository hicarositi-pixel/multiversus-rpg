<script>
    import { onMount, onDestroy } from 'svelte';
    import { fade, slide, scale } from 'svelte/transition';
    import { FichaMobileLogic } from '../../Logic/FichaMobile.js';
    import { CardDatabase } from '../../Logic/CardDatabase.js';
    import { ThemeDB } from '../../Logic/ThemeDB.js';
    
    import CardWindow from './components/CardWindow.svelte';
    import CardCreator from './CardCreator.svelte';
    import RollEngine from './components/RollEngine.svelte';
    import StatusHelper from './components/StatusHelper.svelte';
    import CombatVitals from './components/CombatVitals.svelte';
    import HelperMobile from './components/HelperMobile.svelte';

    export let actor;

    // --- ESTADOS DE JANELA E TEMA ---
    let data = null;
    let editMode = false;
    let isMinimized = false;
    let uiScale = 1.0; 
    let pos = { x: 100, y: 100 };
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let permissionDenied = false; // Controle de Segurança
    
    const themes = ThemeDB.getThemes();
    let currentTheme = themes[0];

    // --- NAVEGAÇÃO DE ABAS ---
    let activeTab = 'status'; 
    let deckFilter = 'Todos'; 

    // --- DADOS LOCAIS (NOTAS, INV, ATALHOS) ---
    let notes = [];
    let inventory = [];
    let quickSlots = [null, null, null, null, null];

    // --- CARTAS E MENUS ---
    let selectedCard = null;
    let showCardCreator = false;
    let rollModal = null; 

    // --- REATIVIDADE E SEGURANÇA ---
    let hookId;
    
    onMount(() => {
        // --- 1. BLINDAGEM DE SEGURANÇA ---
        // Se o ator não existir, ou se o usuário não for GM E não tiver pelo menos permissão de OBSERVADOR, barra.
        if (!actor || (!game.user.isGM && !actor.testUserPermission(game.user, "OBSERVER"))) {
            permissionDenied = true;
            ui.notifications.error("ACESSO NEGADO: Você não possui autorização biométrica para este perfil.");
            return;
        }

        loadLocalData();
        updateData();

        hookId = Hooks.on("updateActor", (updatedActor) => {
            if (updatedActor.id === actor.id) {
                actor = updatedActor;
                updateData();
            }
        });
    });

    onDestroy(() => {
        Hooks.off("updateActor", hookId);
    });

    function updateData() {
        const freshData = FichaMobileLogic.compileDashboardData(actor);
        if (freshData) {
            data = freshData;
            generateDeck();
        }
    }

    function loadLocalData() {
        notes = actor.getFlag('multiversus-rpg', 'hud_notes') || [];
        inventory = actor.getFlag('multiversus-rpg', 'hud_inv') || [];
        quickSlots = actor.getFlag('multiversus-rpg', 'hud_slots') || [null, null, null, null, null];
    }

    async function saveData() {
        await actor.update({
            'flags.multiversus-rpg.hud_notes': notes,
            'flags.multiversus-rpg.hud_inv': inventory,
            'flags.multiversus-rpg.hud_slots': quickSlots
        }, {render: false});
    }

    $: wp = data?.resources?.willpower?.current ?? 0;
    $: bw = data?.resources?.baseWill?.max ?? 1;
    $: manaPercent = bw > 0 ? Math.min(100, (wp / bw) * 100) : 0;

    let deckCards = [];
    $: filteredDeck = deckCards.filter(c => deckFilter === 'Todos' || c.deckCategory === deckFilter);

    function generateDeck() {
        if (!data) return;
        const customCards = CardDatabase.getCards();
        
        let mappedPowers = data.powers.map(p => ({
            ...p, type: 'power', deckCategory: 'Poderes'
        }));

        let mappedCustoms = customCards.map(c => {
            let cat = 'Geral';
            if(c.category.toLowerCase().includes('poder') || c.category.toLowerCase().includes('magia')) cat = 'Poderes';
            if(c.category.toLowerCase().includes('trait') || c.category.toLowerCase().includes('traço')) cat = 'Traits';
            if(c.category.toLowerCase().includes('item') || c.category.toLowerCase().includes('equipamento')) cat = 'Itens';
            return { ...c, type: 'custom', deckCategory: cat };
        });

        deckCards = [...mappedPowers, ...mappedCustoms];
    }

    function assignToSlot(slotIndex, card) {
        quickSlots[slotIndex] = card;
        saveData();
        ui.notifications.info(`Carta atribuída ao atalho ${slotIndex + 1}`);
    }
    function clearSlot(slotIndex) {
        quickSlots[slotIndex] = null;
        saveData();
    }

    function addNote() { notes = [{ id: foundry.utils.randomID(), title: "Nova Nota", img: "", text: "", open: true }, ...notes]; saveData(); }
    function deleteNote(id) { notes = notes.filter(n => n.id !== id); saveData(); }
    
    function addInv() { inventory = [{ id: foundry.utils.randomID(), name: "Novo Item", qty: 1, desc: "" }, ...inventory]; saveData(); }
    function deleteInv(id) { inventory = inventory.filter(i => i.id !== id); saveData(); }

    function closeApp() {
        for (const app of foundry.applications.instances.values()) {
            if (app.id === "nexus-mobile-hud-app") {
                app.close();
                return;
            }
        }
        const win = Object.values(ui.windows).find(w => w.id === "nexus-mobile-hud-app");
        if (win) win.close();
    }

    function onMouseDown(e) {
        if (e.target.closest('.no-drag')) return;
        isDragging = true;
        dragStart = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    }
    function onMouseMove(e) {
        if (!isDragging) return;
        pos = { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y };
    }
    function onMouseUp() { isDragging = false; }
</script>

<svelte:window on:mousemove={onMouseMove} on:mouseup={onMouseUp} />

{#if permissionDenied}
    <div class="nexus-hud-wrapper" style="left: 200px; top: 200px; --res: 1.0; --primary: #ff4444; --bg: rgba(20,0,0,0.9);">
        <div class="window-controls">
            <span class="app-title" style="color: #ff4444;">ALERTA DE SEGURANÇA</span>
            <div class="wc-btns"><button on:click={closeApp}><i class="fas fa-times"></i></button></div>
        </div>
        <div style="padding: 20px; text-align: center; color: #ffaa00; font-family: monospace;">
            <i class="fas fa-biohazard" style="font-size: 50px; margin-bottom: 10px; color: #ff4444;"></i>
            <h3>ACESSO REJEITADO</h3>
            <p>Você não possui credenciais suficientes para inspecionar os dados deste alvo.</p>
        </div>
    </div>
{/if}

{#if data && !permissionDenied}
    <div class="nexus-hud-wrapper {isMinimized ? 'minimized' : ''}" 
         style="left: {pos.x}px; top: {pos.y}px; --res: {uiScale}; --primary: {currentTheme.primary}; --bg: {currentTheme.bg};" 
         on:mousedown={onMouseDown}>
        
        <div class="window-controls">
            <span class="app-title">Ficha Móvel - Multiversus RPG</span>
            <div class="wc-btns no-drag">
                <button on:mousedown|stopPropagation on:click|stopPropagation={() => isMinimized = !isMinimized} title="Minimizar">
                    <i class="fas {isMinimized ? 'fa-window-maximize' : 'fa-window-minimize'}"></i>
                </button>
                <button class="close-win" on:mousedown|stopPropagation on:click|stopPropagation={closeApp} title="Fechar">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>

        <header class="hud-header no-drag">
            <div class="portrait-box">
                <img src={data.header.img} alt="Avatar" />
                <button class="cfg-btn" on:click={() => editMode = !editMode}><i class="fas fa-cog"></i></button>
            </div>
            
            <div class="identity-panel">
                <div class="name-plate">{data.header.name}</div>
                <div class="resource-bar willpower">
                    <div class="bar-fill" style="width: {manaPercent}%"></div>
                    <span class="bar-text">WILLPOWER: {wp} / {bw}</span>
                </div>
            </div>
            
            {#if data.isGM}
                <button class="action-btn gm-btn" on:click={() => showCardCreator = true}>
                    <i class="fas fa-magic"></i> CARD FORGE
                </button>
            {/if}
        </header>

        {#if !isMinimized}
            <div class="hotbar-container no-drag" transition:slide>
                {#each quickSlots as slot, i}
                    <div class="slot-box" title={slot ? slot.name : `Slot ${i+1} Vazio`} 
                         on:click={() => { if(slot) selectedCard = slot; }}
                         on:contextmenu|preventDefault={() => clearSlot(i)}>
                        {#if slot}
                            <img src={slot.img} alt="S"/>
                            <span class="slot-num">{i+1}</span>
                        {:else}
                            <span class="empty-slot">{i+1}</span>
                        {/if}
                    </div>
                {/each}
            </div>

            {#if editMode}
                <div class="edit-tools no-drag" transition:slide>
                    <div class="edit-row">
                        <label>Resolução ({Math.round(uiScale * 100)}%)</label>
                        <input type="range" min="0.7" max="1.5" step="0.05" bind:value={uiScale}>
                    </div>
                    <div class="edit-row themes">
                        <label>Temas:</label>
                        {#each themes as t}
                            <button class="t-btn {currentTheme.id === t.id ? 'active' : ''}" 
                                    style="background: {t.primary}" title={t.name}
                                    on:click={() => currentTheme = t}></button>
                        {/each}
                    </div>
                </div>
            {/if}

            <div class="tabs-nav no-drag">
                <button class="tab-btn {activeTab === 'status' ? 'active' : ''}" on:click={() => activeTab = 'status'}><i class="fas fa-chart-bar"></i> ATRIBUTOS</button>
                <button class="tab-btn {activeTab === 'powers' ? 'active' : ''}" on:click={() => activeTab = 'powers'}><i class="fas fa-bolt"></i> PODERES</button>
                <button class="tab-btn {activeTab === 'deck' ? 'active' : ''}" on:click={() => activeTab = 'deck'}><i class="fas fa-layer-group"></i> DECK</button>
                <button class="tab-btn {activeTab === 'notes' ? 'active' : ''}" on:click={() => activeTab = 'notes'}><i class="fas fa-book"></i> NOTAS</button>
                <button class="tab-btn {activeTab === 'inv' ? 'active' : ''}" on:click={() => activeTab = 'inv'}><i class="fas fa-box-open"></i> INVENTÁRIO</button>
            </div>

            <div class="hud-body no-drag">
                <aside class="left-panel custom-scroll">
                    {#if activeTab === 'status'}
                        <StatusHelper stats={data.stats} on:roll={(e) => rollModal = {name: e.detail.actionName, pool: e.detail.pool}} />
                    
                    {:else if activeTab === 'powers'}
                        <HelperMobile {actor} {data} on:roll={(e) => rollModal = {name: e.detail.actionName, pool: e.detail.pool}} />
                    
                    {:else if activeTab === 'deck'}
                        <div class="deck-filters">
                            {#each ['Todos', 'Geral', 'Poderes', 'Traits', 'Itens'] as f}
                                <button class:active={deckFilter === f} on:click={() => deckFilter = f}>{f}</button>
                            {/each}
                        </div>
                        <div class="deck-grid">
                            {#each filteredDeck as card}
                                <div class="card-thumb" on:click={() => selectedCard = card}>
                                    <img src={card.img} alt="C" />
                                    <span>{card.name}</span>
                                </div>
                            {/each}
                        </div>

                    {:else if activeTab === 'notes'}
                        <div class="tab-header-action"><button on:click={addNote}>+ Nova Anotação</button></div>
                        <div class="notes-list">
                            {#each notes as note}
                                <div class="note-card">
                                    <div class="n-head">
                                        <input type="text" bind:value={note.title} placeholder="Título..." on:change={saveData}>
                                        <div class="n-actions">
                                            <button on:click={() => { note.open = !note.open; saveData(); }}><i class="fas {note.open ? 'fa-compress' : 'fa-expand'}"></i></button>
                                            <button class="del" on:click={() => deleteNote(note.id)}><i class="fas fa-trash"></i></button>
                                        </div>
                                    </div>
                                    {#if note.open}
                                        <div class="n-body" transition:slide>
                                            <input type="text" bind:value={note.img} placeholder="URL da Imagem (Opcional)" on:change={saveData} class="img-input">
                                            {#if note.img} <img src={note.img} alt="Ref" class="n-img" /> {/if}
                                            <textarea bind:value={note.text} placeholder="Anotações..." on:change={saveData}></textarea>
                                        </div>
                                    {/if}
                                </div>
                            {/each}
                        </div>

                    {:else if activeTab === 'inv'}
                        <div class="tab-header-action"><button on:click={addInv}>+ Novo Item</button></div>
                        <div class="inv-list">
                            {#each inventory as item}
                                <div class="inv-row">
                                    <div class="inv-main">
                                        <input type="number" class="qty" bind:value={item.qty} on:change={saveData}>
                                        <input type="text" class="name" bind:value={item.name} placeholder="Nome do Item" on:change={saveData}>
                                        <button class="del" on:click={() => deleteInv(item.id)}><i class="fas fa-times"></i></button>
                                    </div>
                                    <input type="text" class="desc" bind:value={item.desc} placeholder="Descrição rápida..." on:change={saveData}>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </aside>

                <main class="vitals-panel">
                    <CombatVitals limbs={data.tactical.combatBody.base} />
                </main>
            </div>
        {/if}

        {#if selectedCard}
            <div class="modal-backdrop no-drag" transition:fade>
                <div class="card-display-area" transition:scale>
                    <CardWindow cardData={selectedCard} {actor} />
                    <div class="card-actions">
                        <button class="btn-play" on:click={() => {
                            if(selectedCard.type === 'power') rollModal = {name: selectedCard.name, pool: selectedCard.raw.dice};
                            selectedCard = null; 
                        }}>ATIVAR / JOGAR</button>
                        
                        <div class="assign-slots">
                            <span>Atalho:</span>
                            {#each [0,1,2,3,4] as s}
                                <button on:click={() => assignToSlot(s, selectedCard)}>{s+1}</button>
                            {/each}
                        </div>

                        <button class="btn-close" on:click={() => selectedCard = null}>FECHAR</button>
                    </div>
                </div>
            </div>
        {/if}

        {#if showCardCreator}
            <div class="modal-backdrop no-drag" transition:fade>
                <div class="creator-container" transition:scale>
                    <div class="creator-head">
                        <h2>FORJA DE CARTAS</h2>
                        <button on:click={() => {showCardCreator = false; generateDeck();}}>FECHAR</button>
                    </div>
                    <CardCreator {actor} />
                </div>
            </div>
        {/if}

        {#if rollModal}
            <RollEngine 
                actor={actor} actionName={rollModal.name} pool={rollModal.pool} theme={currentTheme}
                onClose={() => rollModal = null}
            />
        {/if}

    </div>
{/if}

<style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

    .nexus-hud-wrapper {
        position: fixed; z-index: 500; 
        font-family: 'Share Tech Mono', monospace;
        background: var(--bg);
        border: calc(2px * var(--res)) solid var(--primary);
        border-radius: calc(8px * var(--res));
        color: #fff; width: calc(650px * var(--res));
        box-shadow: 0 10px 40px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.5);
        backdrop-filter: blur(10px);
        display: flex; flex-direction: column;
        pointer-events: all; 
    }

    .minimized { width: calc(300px * var(--res)); border-bottom-color: transparent; }
    .no-drag { cursor: default; }

    .window-controls { display: flex; justify-content: space-between; background: rgba(0,0,0,0.8); padding: 5px 10px; border-bottom: 1px solid var(--primary); cursor: grab; }
    .window-controls:active { cursor: grabbing; }
    .app-title { font-size: calc(10px * var(--res)); color: var(--primary); font-weight: bold; letter-spacing: 2px; }
    .wc-btns { display: flex; gap: 10px; }
    .wc-btns button { background: none; border: none; color: #888; cursor: pointer; transition: 0.2s; font-size: calc(12px * var(--res)); }
    .wc-btns button:hover { color: #fff; }
    .close-win:hover { color: #ff4444 !important; }

    .hud-header { display: flex; gap: 15px; padding: 15px; align-items: center; border-bottom: 1px solid #333; }
    .portrait-box { position: relative; width: calc(50px * var(--res)); height: calc(50px * var(--res)); border: 2px solid var(--primary); border-radius: 4px; }
    .portrait-box img { width: 100%; height: 100%; object-fit: cover; }
    .cfg-btn { position: absolute; bottom: -8px; right: -8px; background: #000; color: var(--primary); border: 1px solid var(--primary); border-radius: 50%; font-size: calc(9px * var(--res)); padding: 4px; cursor: pointer; }
    .identity-panel { flex: 1; display: flex; flex-direction: column; gap: 5px; }
    .name-plate { font-size: calc(16px * var(--res)); font-weight: bold; color: var(--primary); text-transform: uppercase; }
    .resource-bar { position: relative; height: calc(14px * var(--res)); background: #111; border: 1px solid #444; border-radius: 4px; overflow: hidden; }
    .resource-bar.willpower .bar-fill { background: linear-gradient(90deg, #0055ff, #00aaff); height: 100%; transition: width 0.3s; }
    .bar-text { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: calc(9px * var(--res)); font-weight: bold; text-shadow: 1px 1px 0 #000; }
    .action-btn { background: #111; border: 1px solid var(--primary); color: var(--primary); font-family: inherit; font-size: calc(9px * var(--res)); padding: 4px 8px; border-radius: 4px; cursor: pointer; }
    .gm-btn { border-color: #ffaa00; color: #ffaa00; } .gm-btn:hover { background: #ffaa00; color: #000; }

    .hotbar-container { display: flex; gap: 5px; padding: 5px 15px; background: #080808; border-bottom: 1px solid #222; }
    .slot-box { width: calc(30px * var(--res)); height: calc(40px * var(--res)); border: 1px dashed #444; background: #111; border-radius: 4px; cursor: pointer; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; transition: 0.2s; }
    .slot-box:hover { border-color: var(--primary); }
    .slot-box img { width: 100%; height: 100%; object-fit: cover; }
    .slot-num { position: absolute; top: 0; right: 2px; font-size: calc(8px * var(--res)); font-weight: bold; color: #fff; text-shadow: 1px 1px 2px #000; }
    .empty-slot { font-size: calc(12px * var(--res)); color: #333; }

    .tabs-nav { display: flex; background: rgba(0,0,0,0.5); border-bottom: 2px solid #333; }
    .tab-btn { flex: 1; background: transparent; border: none; color: #888; font-family: inherit; font-size: calc(10px * var(--res)); cursor: pointer; padding: 8px 5px; transition: 0.2s; border-bottom: 2px solid transparent; }
    .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); font-weight: bold; background: rgba(255,255,255,0.05); }
    .tab-btn:hover { color: #fff; }

    .hud-body { display: flex; gap: 10px; padding: 15px; height: calc(350px * var(--res)); }
    .left-panel { flex: 1.4; overflow-y: auto; padding-right: 5px; }
    .vitals-panel { flex: 1; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; border: 1px solid #222; overflow-y: auto; }

    .deck-filters { display: flex; gap: 5px; margin-bottom: 10px; overflow-x: auto; padding-bottom: 5px; }
    .deck-filters button { background: #111; border: 1px solid #333; color: #aaa; font-family: inherit; font-size: calc(9px * var(--res)); padding: 4px 8px; border-radius: 12px; cursor: pointer; white-space: nowrap; }
    .deck-filters button.active { background: var(--primary); color: #000; font-weight: bold; border-color: var(--primary); }
    .deck-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(calc(60px * var(--res)), 1fr)); gap: 10px; }
    .card-thumb { height: calc(80px * var(--res)); background: #111; border: 1px solid #444; border-radius: 6px; cursor: pointer; display: flex; flex-direction: column; align-items: center; padding: 2px; transition: 0.2s; overflow: hidden; }
    .card-thumb:hover { border-color: var(--primary); transform: translateY(-3px); }
    .card-thumb img { width: 100%; height: 70%; object-fit: cover; border-radius: 4px; }
    .card-thumb span { font-size: calc(8px * var(--res)); margin-top: 4px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; }

    .tab-header-action { margin-bottom: 10px; }
    .tab-header-action button { width: 100%; padding: 8px; background: rgba(0,255,65,0.1); border: 1px dashed var(--primary); color: var(--primary); font-family: inherit; cursor: pointer; border-radius: 4px; }
    .notes-list, .inv-list { display: flex; flex-direction: column; gap: 10px; }
    .note-card { background: #111; border: 1px solid #333; border-radius: 6px; overflow: hidden; }
    .n-head { display: flex; justify-content: space-between; background: #1a1a1a; padding: 5px; border-bottom: 1px solid #222; }
    .n-head input { flex: 1; background: transparent; border: none; color: var(--primary); font-weight: bold; font-family: inherit; }
    .n-actions button { background: none; border: none; color: #888; cursor: pointer; } .n-actions .del:hover { color: #f33; }
    .n-body { padding: 10px; display: flex; flex-direction: column; gap: 5px; }
    .img-input { width: 100%; background: #000; border: 1px solid #333; color: #aaa; font-size: 9px; padding: 4px; }
    .n-img { width: 100%; max-height: 100px; object-fit: cover; border-radius: 4px; border: 1px solid #333; }
    .n-body textarea { width: 100%; min-height: 80px; background: transparent; border: 1px dashed #444; color: #ccc; font-family: inherit; resize: vertical; padding: 5px; font-size: 11px; }

    .inv-row { background: #111; border: 1px solid #333; border-left: 3px solid #ffaa00; padding: 5px; border-radius: 4px; display: flex; flex-direction: column; gap: 5px; }
    .inv-main { display: flex; gap: 5px; }
    .inv-main .qty { width: 40px; background: #000; border: 1px solid #444; color: #fff; text-align: center; }
    .inv-main .name { flex: 1; background: transparent; border: none; color: #fff; font-weight: bold; font-family: inherit; border-bottom: 1px solid #333; }
    .inv-row .desc { width: 100%; background: transparent; border: none; color: #888; font-size: 9px; font-family: inherit; font-style: italic; }
    .inv-main .del { background: none; border: none; color: #666; cursor: pointer; } .inv-main .del:hover { color: #f33; }

    .edit-tools { background: #111; padding: 10px; border-bottom: 1px solid var(--primary); }
    .edit-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; font-size: calc(10px * var(--res)); }
    .themes { justify-content: flex-start; gap: 10px; }
    .t-btn { width: 20px; height: 20px; border-radius: 50%; border: 2px solid #333; cursor: pointer; }
    .t-btn.active { border-color: #fff; transform: scale(1.2); }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 6000; pointer-events: all; }
    .card-display-area { display: flex; flex-direction: column; align-items: center; gap: 15px; }
    .card-actions { display: flex; flex-direction: column; gap: 10px; width: 100%; align-items: center; }
    .assign-slots { display: flex; gap: 5px; background: #111; padding: 5px 10px; border-radius: 20px; border: 1px solid var(--primary); align-items: center; }
    .assign-slots span { font-size: 10px; color: var(--primary); }
    .assign-slots button { background: #222; border: 1px solid #444; color: #fff; width: 20px; height: 20px; border-radius: 50%; cursor: pointer; font-size: 10px; }
    .assign-slots button:hover { background: var(--primary); color: #000; }
    .btn-play { background: var(--primary); color: #000; font-family: inherit; font-weight: bold; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; width: 100%; }
    .btn-close { background: transparent; color: #fff; font-family: inherit; border: 1px solid #444; padding: 5px 20px; border-radius: 4px; cursor: pointer; width: 100%; }
    
    .creator-container { width: 90vw; max-width: 1200px; height: 80vh; background: #000; border: 2px solid var(--primary); border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; }
    .creator-head { display: flex; justify-content: space-between; padding: 15px; background: #111; border-bottom: 1px solid var(--primary); }
    .creator-head h2 { color: var(--primary); margin: 0; }
    .creator-head button { background: #ff4444; color: #fff; border: none; font-weight: bold; cursor: pointer; padding: 5px 15px; }

    .custom-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #444; border-radius: 2px; }
</style>