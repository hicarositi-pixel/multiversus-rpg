<script>
  import { onMount } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  // --- IMPORTS ---
  import InventoryCard from '../components/InventoryCard.svelte';
  import CraftingApp from '../../crafting/CraftingApp.svelte';
  import { CraftDB } from '../../crafting/CraftDB.js';

  export let actor;
  export let isLeader; 

  const isGM = game.user.isGM;

  // --- CONFIGURAÇÃO DO GRID ---
  const COLS = 8;
  const ROWS = 5; 
  const CELL_SIZE = 50; 
  const GAP = 4; 
  const TOTAL_SLOTS = COLS * ROWS;

  const getVal = (obj, path, def = 0) => foundry.utils.getProperty(obj, path) || def;

  // --- ESTADO LOCAL ---
  let localItems = getVal(actor, "flags.multiversus-rpg.inventory", []);
  let localBody = getVal(actor, "system.stats.body") || getVal(actor, "flags.multiversus-rpg.tempBody", 0);
  let localBoosters = getVal(actor, "flags.multiversus-rpg.invBoosters", 0);
  
  let showCrafting = false;
  let showCreator = false;
  let selectedItem = null;
  let isEditing = false; 

  // Limpeza de HTML
  function cleanDesc(text) {
    if (!text) return "";
    if (text.includes("&lt;")) {
        const txt = document.createElement("textarea");
        txt.innerHTML = text;
        return txt.value;
    }
    return text;
  }

  // --- CÁLCULO DE CAPACIDADE ---
  let unlockedSlots = 0;
  $: {
    const bStat = parseInt(localBody) || 0;
    const bInv = parseInt(localBoosters) || 0;
    unlockedSlots = Math.min(TOTAL_SLOTS, 10 + (bStat * 2) + (bInv * 5));
  }

  $: gridItems = localItems.filter(i => i.stored === true);
  $: stashItems = localItems.filter(i => i.stored !== true);

  // --- HOOKS ---
  onMount(async () => {
    if (isGM) await CraftDB.init();

    const hookId = Hooks.on("updateActor", (doc, changes, options, userId) => {
      if (doc.id !== actor.id || userId === game.user.id) return; // Ignora se fui eu que salvei
      
      if (foundry.utils.hasProperty(changes, "flags.multiversus-rpg.inventory")) {
          localItems = foundry.utils.getProperty(changes, "flags.multiversus-rpg.inventory");
          // Atualiza o item selecionado se ele mudou externamente
          if (selectedItem) {
              const updated = localItems.find(i => i.id === selectedItem.id);
              if (updated) selectedItem = updated;
          }
      }
      
      const bodyChange = foundry.utils.getProperty(changes, "system.stats.body") ?? foundry.utils.getProperty(changes, "flags.multiversus-rpg.tempBody");
      if (bodyChange !== undefined) localBody = bodyChange;
      
      const boostChange = foundry.utils.getProperty(changes, "flags.multiversus-rpg.invBoosters");
      if (boostChange !== undefined) localBoosters = boostChange;
    });
    
    return () => Hooks.off("updateActor", hookId);
  });

  // --- DRAG & DROP ---
  let draggingItem = null;
  let dragOffset = { x: 0, y: 0 }; 

  function handleDragStart(e, item, source) {
    draggingItem = { ...item };
    if (source === 'grid') {
        const el = e.target.closest('.item-container');
        if (el) {
            const rect = el.getBoundingClientRect();
            dragOffset = {
                x: Math.floor((e.clientX - rect.left) / (CELL_SIZE + GAP)),
                y: Math.floor((e.clientY - rect.top) / (CELL_SIZE + GAP))
            };
        }
    } else { dragOffset = { x: 0, y: 0 }; }
    
    const img = new Image(); img.src = ""; 
    e.dataTransfer.setDragImage(img, 0, 0);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }

  async function handleDropOnGrid(e) {
    e.preventDefault();
    if (!draggingItem) return;

    const gridEl = e.currentTarget.getBoundingClientRect();
    const finalX = Math.max(0, Math.floor((e.clientX - gridEl.left) / (CELL_SIZE + GAP)) - dragOffset.x);
    const finalY = Math.max(0, Math.floor((e.clientY - gridEl.top) / (CELL_SIZE + GAP)) - dragOffset.y);

    if (!isValidPosition(finalX, finalY, draggingItem.w, draggingItem.h, draggingItem.id)) {
        return ui.notifications.warn("Bloqueado ou Sem Espaço.");
    }
    updateItemLocal(draggingItem.id, { x: finalX, y: finalY, stored: true });
    draggingItem = null;
  }

  async function handleDropOnStash(e) {
    e.preventDefault();
    if (!draggingItem) return;
    if (draggingItem.stored) updateItemLocal(draggingItem.id, { stored: false, x: 0, y: 0 });
    draggingItem = null;
  }

  // --- CORE LOGIC (CORRIGIDO PARA SALVAR DIREITO) ---
  async function updateItemLocal(id, changes) {
      const index = localItems.findIndex(i => i.id === id);
      if (index === -1) return;
      
      const newItems = [...localItems];
      newItems[index] = { ...newItems[index], ...changes };
      
      // 1. Atualiza visualmente agora (Optimistic UI)
      localItems = newItems; 
      
      // 2. Garante que o modal aberto reflita a mudança imediatamente
      if (selectedItem && selectedItem.id === id) {
          selectedItem = newItems[index];
      }

      // 3. Salva no banco
      await actor.update({ "flags.multiversus-rpg.inventory": newItems }, { render: false });
  }

  function isValidPosition(x, y, w, h, ignoreId = null) {
    if (x + w > COLS || y + h > ROWS) return false;
    for(let r = 0; r < h; r++) {
      for(let c = 0; c < w; c++) {
        const slotIdx = (y + r) * COLS + (x + c);
        if (slotIdx >= unlockedSlots) return false;
        const collision = gridItems.some(i => i.id !== ignoreId && (x + c) >= i.x && (x + c) < i.x + i.w && (y + r) >= i.y && (y + r) < i.y + i.h);
        if (collision) return false;
      }
    }
    return true;
  }

  function rotateSelectedItem() {
    if (!selectedItem || !selectedItem.stored) return;
    const newW = selectedItem.h;
    const newH = selectedItem.w;
    if (isValidPosition(selectedItem.x, selectedItem.y, newW, newH, selectedItem.id)) {
        updateItemLocal(selectedItem.id, { w: newW, h: newH });
        // selectedItem atualiza automaticamente via updateItemLocal
    } else ui.notifications.warn("Obstrução detectada.");
  }

  function handleKeydown(e) {
    if ((e.key === 'r' || e.key === 'R') && selectedItem) rotateSelectedItem();
    if (e.key === 'Escape') { selectedItem = null; showCreator = false; showCrafting = false; isEditing = false; }
  }

  // --- CRUD ---
  let newItem = { name: "", type: "Recurso", rarity: "Comum", img: "", desc: "", qty: 1, w: 1, h: 1 };

  async function createItem() {
    if (!newItem.name) return;
    const itemData = { id: foundry.utils.randomID(), ...newItem, img: newItem.img || "icons/svg/item-bag.svg", stored: false };
    localItems = [...localItems, itemData];
    await actor.update({ "flags.multiversus-rpg.inventory": localItems }, { render: false });
    showCreator = false;
    newItem = { name: "", type: "Recurso", rarity: "Comum", img: "", desc: "", qty: 1, w: 1, h: 1 };
  }

  async function deleteItem(id) {
    if (!id) return;
    selectedItem = null;
    isEditing = false;
    localItems = localItems.filter(i => i.id !== id);
    await actor.update({ "flags.multiversus-rpg.inventory": localItems }, { render: false });
  }

  async function updateStat(key, val) {
    const intVal = parseInt(val) || 0;
    const updates = {};
    if (key === 'body') {
        localBody = intVal;
        if(actor.system.stats) updates["system.stats.body"] = intVal;
        else updates["flags.multiversus-rpg.tempBody"] = intVal;
    } else {
        localBoosters = intVal;
        updates["flags.multiversus-rpg.invBoosters"] = intVal;
    }
    await actor.update(updates, { render: false });
  }

  const RARITY_COLORS = { "Comum": "#a0a0a0", "Incomum": "#10b981", "Raro": "#00bfff", "Épico": "#8b5cf6", "Lendário": "#ffa500", "Mítico": "#ff4500", "Universal": "#ffffff", "Multiversal": "#d000ff" };
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="nexus-os" in:fade={{duration: 300}}>
  <div class="scanlines"></div>
  <div class="vignette"></div>

  <header class="os-header">
    <div class="os-brand">
      <i class="fas fa-box-open pulse"></i>
      <div class="os-titles"><h1>INVENTÁRIO</h1><small>{actor.name}</small></div>
    </div>
    
    <div class="os-stats">
      <div class="stat-module">
        <label>SLOTS</label>
        <div class="bar-track">
          <div class="bar-fill" style="width: {(unlockedSlots / TOTAL_SLOTS) * 100}%"></div>
        </div>
        <span class="stat-val">{unlockedSlots}/{TOTAL_SLOTS}</span>
      </div>
      
      <div class="stat-inputs">
        <div class="input-grp">
            <label>CORPO</label>
            <input type="number" value={localBody} on:change={(e)=>updateStat('body', e.target.value)} disabled={!isGM}>
        </div>
        <div class="input-grp">
            <label>MODS</label>
            <input type="number" value={localBoosters} on:change={(e)=>updateStat('booster', e.target.value)} disabled={!isGM}>
        </div>
      </div>
    </div>

    <div class="os-actions">
        <button class="action-btn" on:click={() => showCrafting = true}><i class="fas fa-hammer"></i></button>
        {#if isGM}
            <button class="action-btn" on:click={() => showCreator = true}><i class="fas fa-plus"></i></button>
        {/if}
        {#if selectedItem && selectedItem.stored}
            <button class="action-btn" on:click={rotateSelectedItem} title="Girar (R)"><i class="fas fa-sync"></i></button>
        {/if}
    </div>
  </header>

  <div class="main-stage">
    <div class="grid-panel">
      <div class="grid-frame">
        <div class="inventory-stage" 
             style="width: {COLS * (CELL_SIZE + GAP)}px; height: {ROWS * (CELL_SIZE + GAP)}px;"
             on:dragover={handleDragOver} on:drop={handleDropOnGrid} on:click={() => { selectedItem = null; isEditing = false; }}>
          
          <div class="slots-layer">
            {#each Array(TOTAL_SLOTS) as _, i}
              <div class="grid-slot {i >= unlockedSlots ? 'locked' : ''}">
                {#if i >= unlockedSlots}<i class="fas fa-lock"></i>{/if}
              </div>
            {/each}
          </div>

          <div class="items-layer">
            {#each gridItems as item (item.id)}
              <div class="item-container" 
                class:selected={selectedItem?.id === item.id}
                style="
                    position: absolute; 
                    left: {item.x * (CELL_SIZE + GAP)}px; 
                    top: {item.y * (CELL_SIZE + GAP)}px; 
                    width: {item.w * (CELL_SIZE + GAP) - GAP}px; 
                    height: {item.h * (CELL_SIZE + GAP) - GAP}px; 
                    z-index: {selectedItem?.id === item.id ? 999 : 10};
                "
                draggable="true" 
                on:dragstart={(e) => handleDragStart(e, item, 'grid')} 
                on:click|stopPropagation={() => { selectedItem = item; isEditing = false; }}
              >
                <InventoryCard 
                    item={item} index={item.id} isGM={isGM} inGrid={true} 
                    onSelect={() => { selectedItem = item; isEditing = false; }} 
                    onUpdateQty={updateItemLocal} 
                    onDelete={() => deleteItem(item.id)}
                />
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>

    <div class="stash-panel" on:dragover={handleDragOver} on:drop={handleDropOnStash} on:click={() => { selectedItem = null; isEditing = false; }}>
      <div class="stash-header"><span>ITENS FORA DO INVENTÁRIO</span> <span class="count-badge">{stashItems.length}</span></div>
      <div class="stash-grid custom-scroll">
        {#each stashItems as item (item.id)}
          <div class="stash-slot" draggable="true" on:dragstart={(e) => handleDragStart(e, item, 'stash')}>
              <InventoryCard item={item} index={item.id} isGM={isGM} inGrid={false} onSelect={() => { selectedItem = item; isEditing = false; }} onUpdateQty={updateItemLocal} onDelete={() => deleteItem(item.id)}/>
          </div>
        {/each}
      </div>
    </div>
  </div>

  {#if selectedItem}
    <div class="modal-backdrop" 
         on:click|self={() => { selectedItem = null; isEditing = false; }} 
         transition:fade={{duration:150}}>
         
        <div class="data-window" 
             on:click|stopPropagation 
             on:mousedown|stopPropagation
             in:scale={{start: 0.95, duration: 200}} 
             style="--theme: {RARITY_COLORS[selectedItem.rarity] || '#fff'}">
            
            <div class="win-header">
              <div class="win-title">
                  <i class="fas fa-cube"></i> {selectedItem.name.toUpperCase()}
              </div>
              <button class="win-close" on:click={() => { selectedItem = null; isEditing = false; }}>✕</button>
            </div>

            <div class="win-content">
                <div class="win-preview">
                    <div class="preview-box">
                        <img src={selectedItem.img} alt="preview">
                        <div class="scan-line"></div>
                    </div>
                    <div class="meta-tags">
                        <span class="tag type">{selectedItem.type || 'ITEM'}</span>
                        <span class="tag rarity" style="color:var(--theme); border-color:var(--theme)">
                            {selectedItem.rarity}
                        </span>
                    </div>
                </div>

                <div class="win-info">
                   <div class="desc-box custom-scroll">
                     {#if isGM && isEditing}
                        <textarea class="code-editor" 
                            value={selectedItem.desc} 
                            on:change={(e) => updateItemLocal(selectedItem.id, {desc: e.target.value})}
                            placeholder="HTML / Texto..."></textarea>
                     {:else}
                        <div class="html-renderer">
                            {@html cleanDesc(selectedItem.desc) || "<span style='opacity:0.3'>Sem dados.</span>"}
                        </div>
                     {/if}
                   </div>
                   
                   <div class="ctrl-bar">
                       {#if isGM}
                           <div class="gm-tools">
                               <label>QTD <input type="number" value={selectedItem.qty} on:change={(e) => updateItemLocal(selectedItem.id, {qty: parseInt(e.target.value)}) }></label>
                               
                               <button class="btn-toggle" on:click={() => isEditing = !isEditing} title={isEditing ? "Ver Visual" : "Editar Código"}>
                                   <i class="fas {isEditing ? 'fa-eye' : 'fa-pencil-alt'}"></i>
                               </button>

                               <button class="btn-del" on:click={() => deleteItem(selectedItem.id)} title="Deletar">
                                   <i class="fas fa-trash"></i>
                               </button>
                           </div>
                       {:else}
                           <div class="qty-show">QUANTIDADE: <strong>{selectedItem.qty}</strong></div>
                       {/if}
                   </div>
                </div>
            </div>
        </div>
    </div>
  {/if}

  {#if showCreator}
    <div class="modal-backdrop" on:click={() => showCreator = false}>
        <div class="data-window creator" on:click|stopPropagation>
            <div class="win-header" style="--theme: #00ff41">
                 <div class="win-title">NOVO REGISTRO</div>
                 <button class="win-close" on:click={() => showCreator = false}>✕</button>
            </div>
            <div class="form-body">
                <div class="form-row"><label>NOME <input type="text" bind:value={newItem.name}></label></div>
                <div class="form-row split">
                     <label>W <input type="number" min="1" max="4" bind:value={newItem.w}></label>
                     <label>H <input type="number" min="1" max="4" bind:value={newItem.h}></label>
                </div>
                <div class="form-row"><label>DESCRIÇÃO <textarea bind:value={newItem.desc}></textarea></label></div>
                <div class="form-row split">
                     <label>TIPO <input type="text" bind:value={newItem.type}></label>
                     <label>RARIDADE 
                        <select bind:value={newItem.rarity}>
                            {#each Object.keys(RARITY_COLORS) as r} <option value={r}>{r}</option> {/each}
                        </select>
                     </label>
                </div>
                <div class="form-row"><label>IMG URL <input type="text" bind:value={newItem.img}></label></div>
                <button class="btn-confirm" on:click={createItem}>CRIAR</button>
            </div>
        </div>
    </div>
  {/if}

  {#if showCrafting}
    <CraftingApp actor={actor} onClose={() => showCrafting = false} />
  {/if}
</div>

<style>
  /* --- GLOBAL NEXUS THEME --- */
  .nexus-os { width: 100%; height: 100%; display: flex; flex-direction: column; gap: 10px; background: #050505; color: #ccc; font-family: 'Rajdhani', sans-serif; position: relative; overflow: hidden; padding: 10px; }
  .scanlines { position: absolute; inset: 0; pointer-events: none; z-index: 5; background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06)); background-size: 100% 2px, 3px 100%; }
  .vignette { position: absolute; inset: 0; pointer-events: none; z-index: 6; background: radial-gradient(circle, transparent 50%, rgba(0,0,0,0.8) 100%); }

  /* --- HEADER --- */
  .os-header { display: flex; justify-content: space-between; align-items: center; background: rgba(10, 10, 10, 0.95); border: 1px solid #333; border-bottom: 2px solid #00ff41; padding: 8px 15px; border-radius: 4px; z-index: 10; }
  .os-brand { display: flex; align-items: center; gap: 10px; color: #00ff41; }
  .pulse { animation: pulse 2s infinite; }
  .os-titles h1 { margin: 0; font-size: 16px; font-family: 'Share Tech Mono'; letter-spacing: 1px; line-height: 1; }
  .os-titles small { font-size: 10px; color: #666; letter-spacing: 2px; }
  
  .os-stats { display: flex; align-items: center; gap: 20px; }
  .stat-module { display: flex; flex-direction: column; width: 150px; }
  .stat-module label { font-size: 9px; color: #00ff41; margin-bottom: 2px; }
  .bar-track { width: 100%; height: 6px; background: #222; border-radius: 2px; overflow: hidden; }
  .bar-fill { height: 100%; background: #00ff41; transition: width 0.5s; box-shadow: 0 0 5px #00ff41; }
  .stat-val { font-size: 10px; text-align: right; color: #fff; margin-top: 2px; }
  .stat-inputs { display: flex; gap: 8px; }
  .input-grp { display: flex; flex-direction: column; align-items: center; }
  .input-grp label { font-size: 8px; color: #666; }
  .input-grp input { width: 35px; background: #000; border: 1px solid #333; color: #fff; text-align: center; font-size: 12px; }

  .os-actions { display: flex; gap: 8px; pointer-events: auto; }
  .action-btn { background: rgba(0,0,0,0.5); border: 1px solid #444; color: #ccc; padding: 5px 12px; font-family: 'Share Tech Mono'; font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: 0.2s; }
  .action-btn:hover { background: #00ff41; color: #000; box-shadow: 0 0 10px rgba(0,255,65,0.3); }
  
  /* --- MAIN STAGE --- */
  .main-stage { flex: 1; display: flex; gap: 10px; overflow: hidden; z-index: 10; position: relative; }

  /* GRID PANEL */
  .grid-panel { display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(0,0,0,0.4); border: 1px solid #222; padding: 20px; border-radius: 4px; position: relative; z-index: 1; }
  .grid-frame { padding: 5px; border: 1px solid #333; background: #080808; box-shadow: 0 0 20px rgba(0,0,0,0.8), inset 0 0 30px rgba(0,0,0,0.9); position: relative; }
  .inventory-stage { position: relative; background-image: radial-gradient(#151515 1px, transparent 1px); background-size: 10px 10px; }
  .slots-layer { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(8, 50px); grid-template-rows: repeat(5, 50px); gap: 4px; pointer-events: none; }
  .grid-slot { border: 1px solid rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; }
  .grid-slot.locked { background: repeating-linear-gradient(45deg, #100, #100 5px, #200 5px, #200 10px); opacity: 0.5; }

  .items-layer { position: absolute; inset: 0; pointer-events: none; }
  .item-container { pointer-events: auto; transition: z-index 0s; }
  .item-container:hover { z-index: 1000 !important; }

  /* STASH PANEL */
  .stash-panel { flex: 1; display: flex; flex-direction: column; background: rgba(5,5,5,0.9); border: 1px solid #333; overflow: hidden; border-radius: 4px; position: relative; z-index: 1; }
  .stash-header { background: #0f0f0f; border-bottom: 1px solid #333; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #888; font-family: 'Share Tech Mono'; }
  .count-badge { background: #222; padding: 2px 6px; border-radius: 2px; color: #00ff41; }
  .stash-grid { flex: 1; padding: 10px; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); grid-auto-rows: 200px; gap: 10px; align-content: start; }
  .stash-slot { height: 100%; width: 100%; }

  /* --- MODAL DE DADOS --- */
  .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(2px); z-index: 2000; display: flex; align-items: center; justify-content: center; }
  .data-window { width: 600px; height: 400px; background: #080808; border: 1px solid var(--theme); box-shadow: 0 0 50px rgba(0,0,0,0.9); display: flex; flex-direction: column; border-top: 2px solid var(--theme); position: relative; z-index: 2001; pointer-events: auto; }
  .data-window.creator { width: 400px; height: auto; border-top-color: #00ff41; }

  .win-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; background: rgba(255,255,255,0.03); border-bottom: 1px solid #222; position: relative; z-index: 10; }
  .win-title { color: var(--theme); font-family: 'Share Tech Mono'; letter-spacing: 1px; font-size: 14px; display: flex; align-items: center; gap: 8px; }
  .win-close { background: rgba(255,255,255,0.05); border: 1px solid #444; color: #ccc; cursor: pointer; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; transition: 0.2s; position: relative; z-index: 20; }
  .win-close:hover { background: #f00; color: #fff; border-color: #f00; }

  .win-content { flex: 1; display: flex; padding: 20px; gap: 20px; overflow: hidden; background: #0b0b0b; }
  .win-preview { width: 140px; display: flex; flex-direction: column; gap: 15px; align-items: center; }
  .preview-box { width: 120px; height: 120px; border: 1px solid #333; background: #000; position: relative; overflow: hidden; display:flex; align-items:center; justify-content:center; }
  .preview-box img { width: 90%; height: 90%; object-fit: contain; filter: drop-shadow(0 0 10px rgba(255,255,255,0.1)); }
  .scan-line { position: absolute; top:0; left:0; width:100%; height:2px; background:rgba(255,255,255,0.3); animation: scan 3s infinite linear; }

  .meta-tags { display: flex; gap: 5px; flex-wrap: wrap; justify-content: center; width: 100%; }
  .tag { font-size: 9px; background: #151515; border: 1px solid #444; padding: 3px 6px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
  .tag.rarity { color: var(--theme); border-color: var(--theme); }

  .win-info { flex: 1; display: flex; flex-direction: column; gap: 10px; min-width: 0; }
  .desc-box { flex: 1; background: #080808; border: 1px solid #222; padding: 15px; overflow-y: auto; color: #ccc; font-size: 13px; line-height: 1.5; box-shadow: inset 0 0 20px rgba(0,0,0,0.5); }
  .code-editor { width: 100%; height: 100%; background: transparent; border: none; color: #00ff41; font-family: 'Courier New', monospace; font-size: 12px; resize: none; outline: none; }
  .html-renderer p { margin-bottom: 10px; }
  .html-renderer strong { color: #fff; }

  .ctrl-bar { height: 40px; background: #111; border-top: 1px solid #333; display: flex; align-items: center; padding: 0 10px; position: relative; z-index: 10; }
  .gm-tools { display: flex; gap: 10px; align-items: center; width: 100%; justify-content: flex-end; }
  .gm-tools label { font-size: 10px; color: #888; display: flex; align-items: center; gap: 5px; }
  .gm-tools input { width: 50px; background: #000; border: 1px solid #444; color: #fff; padding: 4px; text-align: center; }
  .btn-toggle { background: #222; color: #ccc; border: 1px solid #555; width: 30px; height: 30px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
  .btn-toggle:hover { background: #fff; color: #000; }
  .btn-del { background: #300; color: #f55; border: 1px solid #f00; width: 30px; height: 30px; cursor: pointer; margin-left: auto; display: flex; align-items: center; justify-content: center; }
  .btn-del:hover { background: #f00; color: #fff; }

  /* FORMS CREATOR */
  .form-body { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
  .form-row { display: flex; flex-direction: column; gap: 4px; }
  .form-row.split { flex-direction: row; gap: 15px; }
  .form-row.split label { flex: 1; }
  label { font-size: 10px; color: #888; font-weight: bold; }
  input, select, textarea { background: #111; border: 1px solid #333; color: #fff; padding: 8px; border-radius: 2px; width: 100%; font-family: inherit; }
  textarea { min-height: 80px; resize: vertical; }
  .btn-confirm { background: #00ff41; color: #000; font-weight: bold; padding: 12px; border: none; cursor: pointer; margin-top: 10px; font-family: 'Share Tech Mono'; letter-spacing: 1px; transition: 0.2s; }
  .btn-confirm:hover { box-shadow: 0 0 15px #00ff41; }

  .custom-scroll::-webkit-scrollbar { width: 6px; }
  .custom-scroll::-webkit-scrollbar-track { background: #050505; }
  .custom-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
  .custom-scroll::-webkit-scrollbar-thumb:hover { background: #00ff41; }

  @keyframes pulse { 0% { opacity: 0.7; } 50% { opacity: 1; } 100% { opacity: 0.7; } }
  @keyframes scan { 0% { top: -20%; opacity: 0; } 50% { opacity: 0.5; } 100% { top: 120%; opacity: 0; } }
</style>