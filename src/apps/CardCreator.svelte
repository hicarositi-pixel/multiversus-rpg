<script>
import { onMount } from 'svelte'; // NOVO
    import { fade, slide } from 'svelte/transition';
    import { CardDatabase } from '../../Logic/CardDatabase.js';
    import CardWindow from './components/CardWindow.svelte';

    export let actor;
    export let closeApp = () => {};
    export let cardToEdit = null; // NOVO

    // --- SISTEMA DE ARRASTAR JANELA ---
    let pos = { x: window.innerWidth / 2 - 550, y: window.innerHeight / 2 - 350 };
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };

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

    // --- LÓGICA DE CARTAS ---
   let cards = [];
    let searchSource = "";
    let selectedCategory = "Todos";
    let editingCard = null; 

    // NOVO: Quando abrir, checa se mandaram uma carta pra editar
    onMount(async () => {
        await refresh();
        if (cardToEdit) {
            // Clona a carta para não mutar a original acidentalmente
            editingCard = JSON.parse(JSON.stringify(cardToEdit)); 
        }
    });
    $: categories = ["Todos", ...new Set(cards.map(c => c.category || "Geral"))];
    $: filteredCards = cards.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchSource.toLowerCase());
        const matchesCat = selectedCategory === "Todos" || c.category === selectedCategory;
        return matchesSearch && matchesCat;
    });

    async function refresh() {
        cards = await CardDatabase.getCards();
    }

    const htmlExample = "<div class='meu-botao' onclick='minhaAcao()'>Executar</div>";
    const cssExample = ".meu-botao { background: #00ff41; color: #000; padding: 10px; cursor: pointer; }";
    const jsExample = "window.minhaAcao = () => { ui.notifications.info('Rodou!'); }";

    function createNew() {
        editingCard = {
            id: null,
            name: "Nova Carta Custom",
            img: "icons/svg/mystery-man.svg",
            desc: "Descrição rápida da carta...",
            category: "Utilitário",
            tags: [{label: "Tipo", val: "Ação", color: "#00ff41"}],
            isGlobal: false,
            html: "", css: "", js: ""
        };
    }

    async function save() {
        if (!editingCard) return;
        await CardDatabase.saveCard(editingCard);
        ui.notifications.info(`Carta "${editingCard.name}" ${editingCard.id ? 'atualizada' : 'criada'} com sucesso!`);
        refresh();
    }

    async function deleteCard(id) {
        if (!confirm("Deletar esta carta permanentemente do banco de dados?")) return;
        await CardDatabase.deleteCard(id);
        editingCard = null;
        refresh();
    }

    function grantToActor(actorId) {
        const targetActor = game.actors.get(actorId);
        if (!targetActor) return;
        const existing = targetActor.getFlag("multiversus-rpg", "customCards") || [];
        if (!existing.includes(editingCard.id)) {
            targetActor.setFlag("multiversus-rpg", "customCards", [...existing, editingCard.id]);
            ui.notifications.info(`Carta concedida para: ${targetActor.name}`);
        } else {
            ui.notifications.warn(`${targetActor.name} já possui essa carta.`);
        }
    }

    refresh();
</script>

<svelte:window on:mousemove={onMouseMove} on:mouseup={onMouseUp} />

<div class="card-forge-container" style="left: {pos.x}px; top: {pos.y}px;" on:mousedown={onMouseDown} transition:fade>
    
    <aside class="library no-drag">
        <header class="lib-header">
            <h3>CARD_LIBRARY</h3>
            <button class="add-btn" on:click={createNew}>+</button>
        </header>

        <div class="search-box">
            <input type="text" placeholder="Buscar..." bind:value={searchSource} />
            <select bind:value={selectedCategory}>
                {#each categories as cat}
                    <option value={cat}>{cat}</option>
                {/each}
            </select>
        </div>

        <div class="card-list custom-scroll">
            {#each filteredCards as card}
                <div class="lib-item {editingCard?.id === card.id ? 'active' : ''}" on:click={() => editingCard = {...card}}>
                    <img src={card.img} alt="icon" />
                    <div class="lib-info">
                        <span class="n">{card.name}</span>
                        <span class="c">{card.category}</span>
                    </div>
                    {#if card.isGlobal}<i class="fas fa-globe" title="Global" style="color:#00ff41"></i>{/if}
                </div>
            {/each}
        </div>
    </aside>

    {#if editingCard}
    <main class="editor no-drag" transition:slide={{axis: 'x'}}>
        <div class="editor-scroll custom-scroll">
            
            <div class="form-row">
                <div class="form-group" style="flex: 2;">
                    <label>NOME DA CARTA</label>
                    <input type="text" bind:value={editingCard.name} />
                </div>
                <div class="form-group">
                    <label>GLOBAL (Todos)</label>
                    <input type="checkbox" bind:checked={editingCard.isGlobal} style="margin-top:10px; width:20px;height:20px;"/>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group" style="flex: 1;">
                    <label>CATEGORIA</label>
                    <input type="text" bind:value={editingCard.category} />
                </div>
                <div class="form-group" style="flex: 2;">
                    <label>URL DA IMAGEM</label>
                    <input type="text" bind:value={editingCard.img} />
                </div>
            </div>

            <div class="form-group">
                <label>DESCRIÇÃO RÁPIDA (FLAVOR)</label>
                <input type="text" bind:value={editingCard.desc} />
            </div>

            <div class="code-section">
                <div class="tab-header">ESTRUTURA (HTML)</div>
                <textarea bind:value={editingCard.html} placeholder={htmlExample}></textarea>
                
                <div class="tab-header">ESTILO (CSS)</div>
                <textarea bind:value={editingCard.css} placeholder={cssExample}></textarea>
                
                <div class="tab-header">LÓGICA (JS)</div>
                <textarea bind:value={editingCard.js} placeholder={jsExample}></textarea>
            </div>

            <div class="actions">
                <button class="save-btn" on:click={save}>
                    <i class="fas fa-save"></i> {editingCard.id ? 'ATUALIZAR CARTA' : 'CRIAR CARTA'}
                </button>
                {#if editingCard.id}
                    <button class="del-btn" on:click={() => deleteCard(editingCard.id)}>DELETAR</button>
                {/if}
            </div>
        </div>
    </main>

    <aside class="preview-panel no-drag">
        <button class="close-forge-btn" on:click={closeApp}><i class="fas fa-times"></i> FECHAR FORJA</button>

        <div class="tag" style="margin-top: 15px;">LIVE_PREVIEW</div>
        
        <div class="preview-wrapper">
            {#key editingCard}
                <CardWindow cardData={editingCard} actor={actor} />
            {/key}
        </div>

        <div class="distribution">
            <div class="tag" style="margin-top: 15px;">CONCEDER A JOGADOR</div>
            <div class="actor-grid">
                {#each game.actors.filter(a => a.hasPlayerOwner) as pActor}
                    <button class="actor-btn" on:click={() => grantToActor(pActor.id)}>
                        <i class="fas fa-user"></i> {pActor.name}
                    </button>
                {/each}
            </div>
        </div>
    </aside>
    {:else}
    <div class="empty-state no-drag">
        <button class="close-forge-btn absolute-top-right" on:click={closeApp}><i class="fas fa-times"></i></button>
        <i class="fas fa-magic"></i>
        <p>Selecione uma carta na biblioteca ou clique em + para forjar uma nova.</p>
    </div>
    {/if}
</div>

<style>
    .card-forge-container { 
        position: fixed; /* Fixa na tela */
        pointer-events: all;
        display: flex; width: 1100px; height: 700px; 
        background: #050505; border: 2px solid #00ff41; border-radius: 12px; 
        overflow: hidden; font-family: 'Share Tech Mono', monospace; color: #fff; 
        box-shadow: 0 20px 50px rgba(0,0,0,0.9);
    }
    
    .close-forge-btn {
        background: #440000; color: #fff; border: 1px solid #ff4444; padding: 5px 10px;
        cursor: pointer; width: 100%; font-weight: bold; border-radius: 4px; transition: 0.2s;
    }
    .close-forge-btn:hover { background: #ff4444; color: #000; }
    .absolute-top-right { position: absolute; top: 10px; right: 10px; width: auto; }

    /* --- TODO O RESTO DO SEU CSS CONTINUA INTACTO --- */
    .library { width: 300px; background: #0a0a0f; border-right: 1px solid #333; display: flex; flex-direction: column; }
    .lib-header { padding: 15px; display: flex; justify-content: space-between; border-bottom: 1px solid #333; }
    .lib-header h3 { color: #00ff41; margin: 0; }
    .add-btn { background: #00ff41; color: #000; border: none; padding: 0 10px; cursor: pointer; font-weight: bold; }
    .search-box { padding: 10px; display: flex; flex-direction: column; gap: 5px; }
    .search-box input, .search-box select { background: #111; border: 1px solid #333; color: #fff; padding: 5px; }
    .card-list { flex: 1; overflow-y: auto; }
    .lib-item { display: flex; align-items: center; gap: 10px; padding: 10px; border-bottom: 1px solid #111; cursor: pointer; transition: 0.2s; }
    .lib-item:hover, .lib-item.active { background: rgba(0, 255, 65, 0.1); }
    .lib-item img { width: 32px; height: 32px; object-fit: cover; border-radius: 4px; }
    .lib-info { flex: 1; display: flex; flex-direction: column; }
    .lib-info .n { font-size: 12px; font-weight: bold; }
    .lib-info .c { font-size: 9px; color: #666; }
    .editor { flex: 1; background: #080808; padding: 20px; border-right: 1px solid #333; }
    .editor-scroll { height: 100%; overflow-y: auto; padding-right: 10px; }
    .form-group { margin-bottom: 15px; display: flex; flex-direction: column; gap: 5px; }
    .form-row { display: flex; gap: 15px; }
    .form-group label { font-size: 10px; color: #00ff41; }
    .form-group input, .form-group textarea { background: #000; border: 1px solid #222; color: #fff; padding: 8px; border-radius: 4px; }
    .code-section textarea { height: 120px; font-family: 'Courier New', monospace; font-size: 11px; color: #00ff41; }
    .tab-header { font-size: 10px; background: #111; padding: 4px 10px; margin-top: 10px; border-left: 2px solid #00ff41; }
    .actions { display: flex; gap: 10px; margin-top: 20px; }
    .save-btn { flex: 1; background: #00ff41; color: #000; border: none; padding: 10px; font-weight: bold; cursor: pointer; }
    .del-btn { background: #440000; color: #fff; border: none; padding: 10px; cursor: pointer; }
    .preview-panel { position: relative; width: 360px; background: #0a0a0f; padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .preview-wrapper { transform: scale(0.9); }
    .tag { font-size: 9px; color: #00ff41; width: 100%; border-bottom: 1px solid #333; margin-bottom: 5px; opacity: 0.6; }
    .distribution { width: 100%; }
    .actor-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
    .actor-btn { background: #111; border: 1px solid #333; color: #fff; font-size: 10px; padding: 5px; cursor: pointer; text-align: left; }
    .actor-btn:hover { border-color: #00ff41; color: #00ff41; }
    .empty-state { position: relative; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #333; }
    .empty-state i { font-size: 60px; margin-bottom: 20px; }
    .custom-scroll::-webkit-scrollbar { width: 5px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
</style>