<script>
    import { onMount, createEventDispatcher } from 'svelte';
    import { fade, slide, scale } from 'svelte/transition';
    import { FichaMobileLogic } from '../Logic/FichaMobile.js';

    export let actor;

    const dispatch = createEventDispatcher();
    const isGM = game.user.isGM;

    let data = null;
    let editMode = false;
    let uiScale = 1.0;
    let pos = { x: 100, y: 100 };
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let deckOpen = false;
    let selectedCard = null;
    let activeSlots = [null, null, null, null, null];

    $: if (actor) {
        data = FichaMobileLogic.compileDashboardData(actor);
        generateDeck();
    }

    $: wp = data?.resources?.willpower?.current || 0;
    $: bw = data?.resources?.baseWill?.max || 1;
    $: isOverflow = wp > bw;
    $: manaPercent = bw > 0 ? Math.min(100, (wp / bw) * 100) : 0;

    let deckCards = [];
    function generateDeck() {
        if (!data) return;
        let generated = [];
        data.powers.forEach(p => {
            generated.push({ id: p.id, type: 'power', name: p.name, img: p.img || 'icons/magic/lightning/bolt-strike-blue.webp', raw: p });
        });
        generated.push({ id: 'skill_roll', type: 'system', name: 'Perícias', img: 'icons/skills/melee/strike-sword-steel-yellow.webp', desc: 'Rolar ORE' });
        generated.push({ id: 'inventory', type: 'system', name: 'Itens', img: 'icons/containers/bags/pack-leather-brown.webp', desc: 'Equipamentos' });
        deckCards = generated;
    }

    function playCard(card) {
        if (card.type === 'power') {
            const rollData = FichaMobileLogic.preparePowerRoll(actor, card.id, 0);
            ui.notifications.info(`Carta Jogada: ${card.name}`);
        }
        selectedCard = null;
        deckOpen = false;
    }

    // --- FUNÇÕES DE AJUDA PARA EVITAR ERROS NO HTML ---
    function getLimbStatus(limb) {
        const hp = Number(limb.hp) || 0;
        const k = Number(limb.killing) || 0;
        const s = Number(limb.shock) || 0;
        const healthy = Math.max(0, hp - k - s);
        return { hp, k, s, healthy };
    }

    function onMouseDown(e) {
        if (e.target.closest('.no-drag')) return;
        isDragging = true;
        dragStart.x = e.clientX - pos.x;
        dragStart.y = e.clientY - pos.y;
    }
    function onMouseMove(e) { if (isDragging) { pos.x = e.clientX - dragStart.x; pos.y = e.clientY - dragStart.y; } }
    function onMouseUp() { isDragging = false; }
</script>

<svelte:window on:mousemove={onMouseMove} on:mouseup={onMouseUp} />

{#if data}
<div class="mmo-hud-wrapper" style="transform: scale({uiScale}); left: {pos.x}px; top: {pos.y}px;" on:mousedown={onMouseDown}>
    
    {#if editMode}
        <div class="edit-tools no-drag" transition:slide>
            <div class="edit-row">
                <span>TAMANHO HUD</span>
                <input type="range" min="0.5" max="1.5" step="0.1" bind:value={uiScale}>
            </div>
            <button class="done-btn" on:click={() => editMode = false}>SALVAR LAYOUT</button>
        </div>
    {/if}

    <div class="hud-main-frame">
        <header class="hud-header no-drag">
            <div class="portrait-container">
                <img src={data.header.img} alt="P" class="portrait" />
                <button class="cfg-btn" on:click={() => editMode = true}><i class="fas fa-edit"></i></button>
            </div>
            
            <div class="identity-box">
                <div class="name-plate">{data.header.name}</div>
                <div class="mana-widget">
                    <div class="mana-bar {isOverflow ? 'overflow' : ''}">
                        <div class="mana-fill" style="width: {manaPercent}%"></div>
                        <span class="mana-text">{wp} / {bw} WP</span>
                    </div>
                </div>
            </div>
        </header>

        <div class="hud-content no-drag">
            <section class="vitals-panel">
                <div class="section-tag">SINAIS_VITAIS</div>
                {#each data.tactical.combatBody.base as limb}
                    {@const st = getLimbStatus(limb)}
                    <div class="limb-card">
                        <div class="l-info">
                            <span class="l-loc">{limb.loc}</span>
                            <span class="l-name">{limb.name}</span>
                        </div>
                        <div class="hp-gauge">
                            {#if st.k > 0} <div class="bar killing" style="flex: {st.k}"></div> {/if}
                            {#if st.s > 0} <div class="bar shock" style="flex: {st.s}"></div> {/if}
                            {#if st.healthy > 0} <div class="bar healthy" style="flex: {st.healthy}"></div> {/if}
                        </div>
                        <div class="l-armor">
                            {#if limb.har > 0} <span class="har">{limb.har}H</span> {/if}
                            {#if limb.lar > 0} <span class="lar">{limb.lar}L</span> {/if}
                        </div>
                    </div>
                {/each}
            </section>

            <section class="stats-panel">
                <div class="section-tag">DATABASE</div>
                <div class="stats-list">
                    {#each data.stats as stat}
                        <div class="stat-item">
                            <span class="s-label">{stat.label}</span>
                            <span class="s-dice">{stat.dice.d}d|{stat.dice.hd}h|{stat.dice.wd}w</span>
                        </div>
                    {/each}
                </div>
            </section>
        </div>

        <footer class="card-dock no-drag">
            <div class="deck-trigger" on:click={() => deckOpen = !deckOpen}>
                <i class="fas fa-clone"></i>
                <span>DECK</span>
            </div>
            
            <div class="slots-container">
                {#each activeSlots as slot, i}
                    <div class="table-slot">
                        <span class="slot-id">{i + 1}</span>
                    </div>
                {/each}
            </div>

            {#if isGM}
                <button class="gm-create"><i class="fas fa-plus"></i></button>
            {/if}
        </footer>
    </div>
</div>

{#if deckOpen}
    <div class="deck-overlay no-drag" transition:fade>
        <div class="deck-window" transition:slide>
            <div class="deck-header">
                <span>BARALHO_SISTEMA</span>
                <button on:click={() => deckOpen = false}>×</button>
            </div>
            <div class="deck-grid">
                {#each deckCards as card}
                    <div class="hud-card {card.type}" on:click={() => selectedCard = card}>
                        <img src={card.img} alt="C" />
                        <div class="c-name">{card.name}</div>
                    </div>
                {/each}
            </div>
        </div>
    </div>
{/if}

{#if selectedCard}
    <div class="viewer-overlay no-drag" transition:fade>
        <div class="viewer-card" transition:scale>
            <img src={selectedCard.img} alt="V" class="v-img"/>
            <h2>{selectedCard.name}</h2>
            <div class="v-content">
                {#if selectedCard.type === 'power'}
                    {#each selectedCard.raw.qualitiesData as q}
                        <div class="q-tag">{q.name} (NVL {q.level})</div>
                    {/each}
                {:else}
                    <p>{selectedCard.desc}</p>
                {/if}
            </div>
            <div class="v-actions">
                <button class="play-btn" on:click={() => playCard(selectedCard)}>JOGAR CARTA</button>
                <button class="back-btn" on:click={() => selectedCard = null}>FECHAR</button>
            </div>
        </div>
    </div>
{/if}

{/if}

<style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

    .mmo-hud-wrapper {
        position: fixed; z-index: 1000;
        font-family: 'Share Tech Mono', monospace;
        background: rgba(5, 5, 10, 0.9);
        border: 1px solid #00ff41;
        border-radius: 8px;
        width: 480px; color: #fff;
        box-shadow: 0 0 20px rgba(0,0,0,0.8);
        backdrop-filter: blur(8px);
        padding: 10px;
    }

    .edit-tools { background: #00ff41; color: #000; padding: 10px; border-radius: 4px; margin-bottom: 10px; font-weight: bold; }
    .edit-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
    .done-btn { width: 100%; border: 1px solid #000; background: #fff; cursor: pointer; font-weight: bold; }

    .hud-header { display: flex; gap: 15px; border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom: 10px; }
    .portrait-container { position: relative; width: 60px; height: 60px; border: 2px solid #00ff41; }
    .portrait { width: 100%; height: 100%; object-fit: cover; }
    .cfg-btn { position: absolute; bottom: -5px; right: -5px; background: #000; color: #00ff41; border: 1px solid #00ff41; border-radius: 50%; font-size: 10px; cursor: pointer; }

    .identity-box { flex: 1; display: flex; flex-direction: column; justify-content: center; }
    .name-plate { font-size: 18px; font-weight: bold; color: #00ff41; text-transform: uppercase; }

    /* MANA BAR */
    .mana-bar { position: relative; height: 18px; background: #111; border: 1px solid #444; border-radius: 4px; overflow: hidden; margin-top: 5px; }
    .mana-fill { height: 100%; background: #0088ff; transition: width 0.3s; }
    .mana-bar.overflow .mana-fill { background: #ff00ff; animation: pulse 1s infinite alternate; }
    .mana-text { position: absolute; inset: 0; text-align: center; font-size: 10px; font-weight: bold; line-height: 18px; text-shadow: 1px 1px #000; }

    /* VITAIS */
    .hud-content { display: flex; gap: 10px; }
    .vitals-panel { flex: 1.5; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px; }
    .section-tag { font-size: 8px; color: #00ff41; border-bottom: 1px solid #333; margin-bottom: 5px; opacity: 0.7; }
    
    .limb-card { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 11px; }
    .l-info { display: flex; flex-direction: column; width: 60px; }
    .l-loc { font-size: 8px; color: #666; }
    .l-name { font-weight: bold; }

    .hp-gauge { display: flex; height: 10px; flex: 1; background: #222; border-radius: 2px; overflow: hidden; border: 1px solid #000; }
    .bar.killing { background: #444; }
    .bar.shock { background: #eab308; }
    .bar.healthy { background: #ef4444; }

    .l-armor { display: flex; flex-direction: column; font-size: 9px; width: 30px; text-align: right; }
    .har { color: #a855f7; } .lar { color: #0088ff; }

    .stats-panel { flex: 1; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px; }
    .stats-list { max-height: 140px; overflow-y: auto; }
    .stat-item { display: flex; flex-direction: column; padding: 4px; border-bottom: 1px solid #111; }
    .s-label { font-size: 10px; color: #888; }
    .s-dice { font-size: 10px; font-weight: bold; }

    /* DOCK CARTAS */
    .card-dock { display: flex; gap: 8px; margin-top: 10px; background: #000; padding: 8px; border-radius: 6px; align-items: center; }
    .deck-trigger { width: 50px; height: 70px; border: 2px solid #00ff41; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; background: #111; }
    .deck-trigger:hover { background: #00ff41; color: #000; }
    .deck-trigger span { font-size: 9px; font-weight: bold; }

    .slots-container { flex: 1; display: flex; gap: 5px; }
    .table-slot { flex: 1; height: 70px; border: 1px dashed #333; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #222; font-weight: bold; }
    .gm-create { background: none; border: 1px dashed #ef4444; color: #ef4444; width: 30px; height: 70px; cursor: pointer; }

    /* MODAL DECK */
    .deck-overlay { position: absolute; bottom: 100%; left: 0; width: 100%; background: #050505; border: 1px solid #00ff41; border-radius: 8px; padding: 10px; margin-bottom: 10px; }
    .deck-header { display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; color: #00ff41; margin-bottom: 10px; }
    .deck-grid { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 5px; }
    .hud-card { min-width: 80px; height: 110px; border: 1px solid #333; border-radius: 4px; cursor: pointer; transition: 0.2s; position: relative; }
    .hud-card:hover { transform: translateY(-5px); border-color: #00ff41; }
    .hud-card.power { border-color: #0088ff; }
    .hud-card img { width: 100%; height: 70%; object-fit: cover; }
    .c-name { font-size: 8px; text-align: center; font-weight: bold; padding: 2px; }

    /* VIEWER */
    .viewer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 2000; }
    .viewer-card { width: 280px; background: #111; border: 2px solid #00ff41; padding: 20px; text-align: center; border-radius: 12px; }
    .v-img { width: 100%; height: 180px; object-fit: cover; border-radius: 8px; }
    .q-tag { font-size: 10px; background: #000; border: 1px solid #333; margin: 4px 0; padding: 4px; }
    .v-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 20px; }
    .play-btn { background: #00ff41; color: #000; font-weight: bold; padding: 10px; cursor: pointer; border: none; }
    .back-btn { background: transparent; border: 1px solid #666; color: #fff; padding: 8px; cursor: pointer; }

    @keyframes pulse { from { opacity: 0.7; } to { opacity: 1; box-shadow: 0 0 10px #ff00ff; } }
    .stats-list::-webkit-scrollbar { width: 4px; }
    .stats-list::-webkit-scrollbar-thumb { background: #333; }
</style>