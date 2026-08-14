<script>
    import { onMount } from 'svelte';
    import { fade, slide, scale } from 'svelte/transition';

    export let actor;
    export let isGM;
    export let items = []; // Itens do inventário

    const MODULE_ID = "multiversus-rpg";

    const DEFAULT_SLOTS = [
        { id: 'head', name: 'CABEÇA', loc: '10', hp: 4, lar: 0, har: 0, killing: 0, shock: 0, trauma: [], x: 50, y: 10, nonPhysicalDef: false, itemUrl: null },
        { id: 'face', name: 'FACE', loc: '', hp: 2, lar: 0, har: 0, killing: 0, shock: 0, trauma: [], x: 65, y: 15, nonPhysicalDef: false, itemUrl: null },
        { id: 'torso', name: 'TRONCO', loc: '7-9', hp: 7, lar: 0, har: 0, killing: 0, shock: 0, trauma: [], x: 50, y: 40, nonPhysicalDef: false, itemUrl: null },
        { id: 'arms', name: 'MÃOS', loc: '3-6', hp: 4, lar: 0, har: 0, killing: 0, shock: 0, trauma: [], x: 20, y: 40, nonPhysicalDef: false, itemUrl: null },
        { id: 'legs', name: 'PERNAS', loc: '1-2', hp: 5, lar: 0, har: 0, killing: 0, shock: 0, trauma: [], x: 50, y: 70, nonPhysicalDef: false, itemUrl: null },
        { id: 'feet', name: 'PÉS', loc: '1-2', hp: 3, lar: 0, har: 0, killing: 0, shock: 0, trauma: [], x: 50, y: 90, nonPhysicalDef: false, itemUrl: null }
    ];

    let equipmentSlots = actor.getFlag(MODULE_ID, 'equipment_slots');
    if (!equipmentSlots || equipmentSlots.length === 0) equipmentSlots = JSON.parse(JSON.stringify(DEFAULT_SLOTS));

    let selectedSlotId = null;
    let editingMode = false;
    let currentImg = actor.getFlag(MODULE_ID, 'img_base') || "https://i.imgur.com/1DyBPgD.png";

    let inputShock = null;
    let inputKilling = null;
    let inputPenetration = null;
    let inputNonPhysical = false;
    let inputEngolfar = false;
    let inputHeal = null;
    let inputRegen = null;

    $: selectedSlot = equipmentSlots.find(l => l.id === selectedSlotId);

    function triggerReactivity() {
        equipmentSlots = [...equipmentSlots];
        saveData();
    }

    async function saveData() {
        await actor.update({ [`flags.${MODULE_ID}.equipment_slots`]: equipmentSlots }, { render: false });
    }

    async function addSlot() {
        const newSlot = { id: foundry.utils.randomID(), name: 'NOVO SLOT', loc: '', hp: 3, lar:0, har:0, killing:0, shock:0, trauma:[], x: 50, y: 50, nonPhysicalDef: false, itemUrl: null };
        equipmentSlots.push(newSlot);
        triggerReactivity();
    }

    function deleteSlot(slotId) {
        equipmentSlots = equipmentSlots.filter(l => l.id !== slotId);
        if (selectedSlotId === slotId) selectedSlotId = null;
        triggerReactivity();
    }

    // --- DAMAGE CALC ---
    async function applyDamage() {
        if (!selectedSlot && !inputEngolfar) return ui.notifications.warn("Selecione um equipamento ou ative Engolfar!");
        let S_in = Number(inputShock || 0);
        let K_in = Number(inputKilling || 0);
        let Pen_in = Number(inputPenetration || 0);
        let isNonPhysical = inputNonPhysical;

        let targets = inputEngolfar ? equipmentSlots : [selectedSlot];

        for (let target of targets) {
            if (!target) continue;

            const baseLAR = Number(target.lar || 0);
            let ignoreArmor = isNonPhysical && !target.nonPhysicalDef;
            let effectiveLAR = ignoreArmor ? 0 : Math.max(0, baseLAR - Pen_in);

            let S_final = S_in;
            if (effectiveLAR > 0 && S_in > 0) S_final = 1; 

            let converted_K = Math.min(K_in, effectiveLAR);
            let K_final = K_in - converted_K;
            S_final += converted_K; 

            let curK = target.killing;
            let curS = target.shock;
            const hp = target.hp;
            const occupied = target.trauma ? target.trauma.length : 0; 

            let tempK = curK + K_final;
            
            if (tempK >= hp) {
                target.killing = hp; target.shock = 0;
            } else {
                let tempS = curS + S_final;
                let totalSpace = hp - occupied;
                let totalDamage = tempK + tempS;

                if (totalDamage > totalSpace) {
                    let overflow = totalDamage - totalSpace;
                    tempK += overflow;
                    target.killing = Math.min(totalSpace, tempK);
                    target.shock = Math.max(0, totalSpace - target.killing);
                } else {
                    target.killing = tempK; target.shock = tempS;
                }
            }
            if (target.killing >= target.hp && !inputEngolfar) ui.notifications.error(`Equipamento ${target.name} DESTRUÍDO!`);
        }
        
        triggerReactivity();
        inputShock = null; inputKilling = null; inputPenetration = null; inputNonPhysical = false; inputEngolfar = false;
    }

    async function applyHeal() {
        if (!selectedSlot) return;
        let amount = Number(inputHeal || 0);
        while (amount > 0) {
            if (selectedSlot.killing > 0) { selectedSlot.killing--; amount--; }
            else if (selectedSlot.shock > 0) { selectedSlot.shock--; amount--; }
            else break;
        }
        triggerReactivity();
        inputHeal = null;
    }

    async function applyRegen() {
        let amount = Number(inputRegen || 0);
        if(amount <= 0) return;
        let totalCured = 0;
        
        for (let i = 0; i < equipmentSlots.length; i++) {
            let amt = amount;
            while (amt > 0) {
                if (equipmentSlots[i].killing > 0) { equipmentSlots[i].killing--; amt--; totalCured++; }
                else if (equipmentSlots[i].shock > 0) { equipmentSlots[i].shock--; amt--; totalCured++; }
                else break;
            }
        }
        triggerReactivity();
        inputRegen = null;
    }

    // --- DRAG & DROP ---
    let draggingNode = null;
    function onNodeDragStart(e, slot) { if (editingMode) draggingNode = slot; }
    
    function onCanvasDrop(e) {
        if (!editingMode || !draggingNode) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const idx = equipmentSlots.findIndex(l => l.id === draggingNode.id);
        equipmentSlots[idx].x = ((e.clientX - rect.left) / rect.width) * 100; 
        equipmentSlots[idx].y = ((e.clientY - rect.top) / rect.height) * 100;
        draggingNode = null; 
        triggerReactivity();
    }

    let draggingItemUrl = null;
    function onItemDragStart(e, item) {
        draggingItemUrl = item.img;
    }

    function onSlotDrop(e, slotId) {
        if (draggingItemUrl) {
            e.stopPropagation();
            const idx = equipmentSlots.findIndex(l => l.id === slotId);
            if(idx !== -1) {
                equipmentSlots[idx].itemUrl = draggingItemUrl;
                triggerReactivity();
            }
            draggingItemUrl = null;
        }
    }

    function clearSlotItem(slotId) {
        const idx = equipmentSlots.findIndex(l => l.id === slotId);
        if(idx !== -1) {
            equipmentSlots[idx].itemUrl = null;
            triggerReactivity();
        }
    }
</script>

<div class="equip-dashboard">
    <div class="dash-header">
        <div class="tools">
            <button class="tool-btn {editingMode ? 'on' : ''}" on:click={() => editingMode = !editingMode} title="Modo Edição"><i class="fas fa-edit"></i> EDITAR SLOTS</button>
        </div>
    </div>

    <div class="dash-content">
        <!-- ÁREA DO CANVAS -->
        <div class="canvas-area" on:dragover|preventDefault on:drop={onCanvasDrop}>
            <img src={currentImg} class="silhouette-layer" alt="silhouette">

            {#if editingMode}
                <div class="edit-overlay-controls">
                    <button class="add" on:click={addSlot}><i class="fas fa-plus"></i> NOVO SLOT</button>
                </div>
            {/if}

            {#each equipmentSlots as slot (slot.id)}
                <div class="limb-node {selectedSlotId === slot.id ? 'selected' : ''}"
                     style="left: {slot.x}%; top: {slot.y}%;"
                     draggable={editingMode}
                     on:dragstart={(e) => onNodeDragStart(e, slot)}
                     on:dragover|preventDefault
                     on:drop={(e) => onSlotDrop(e, slot.id)}
                     on:click={() => selectedSlotId = slot.id}>
                    
                    <div class="node-header">
                        {#if editingMode}
                            <input class="mini-edit" bind:value={slot.loc} on:change={triggerReactivity} placeholder="Loc">
                            <input class="mini-edit" bind:value={slot.name} on:change={triggerReactivity}>
                        {:else}
                            <span class="loc">{slot.loc}</span>
                            <span class="name">{slot.name}</span>
                        {/if}
                    </div>
                    
                    <!-- EXIBIÇÃO DO ITEM EQUIPADO -->
                    <div class="equipped-item-area">
                        {#if slot.itemUrl}
                            <div class="item-pic-frame">
                                <img src={slot.itemUrl} alt="item">
                                {#if editingMode}
                                    <button class="btn-unequip" on:click|stopPropagation={() => clearSlotItem(slot.id)}>X</button>
                                {/if}
                            </div>
                        {:else}
                            <div class="empty-slot-hint">VAZIO</div>
                        {/if}
                    </div>

                    <div class="hp-grid">
                        {#each Array(slot.hp) as _, i}
                            <div class="hp-slot {i < slot.killing ? 'killing' : (i < slot.killing + slot.shock ? 'shock' : 'empty')}"></div>
                        {/each}
                    </div>

                    <div class="armor-flags">
                        {#if slot.lar > 0}<span class="a-flag l" title="Leve">{slot.lar}</span>{/if}
                        {#if slot.har > 0}<span class="a-flag h" title="Pesada">{slot.har}</span>{/if}
                    </div>
                    
                    {#if editingMode}
                        <button class="node-del" on:click|stopPropagation={() => deleteSlot(slot.id)}>X</button>
                    {/if}
                </div>
            {/each}
        </div>

        <!-- CALCULADORA DE REPAROS -->
        <div class="sidebar">
            <div class="calc-box">
                <div class="calc-title">{selectedSlot ? selectedSlot.name : "SELECIONE SLOT"}</div>
                {#if selectedSlot}
                    <div class="armor-edit">
                        <label>Arm. Leve<input type="number" bind:value={selectedSlot.lar} on:change={triggerReactivity}></label>
                        <label>Arm. Pesada<input type="number" bind:value={selectedSlot.har} on:change={triggerReactivity}></label>
                        <label>Durabilidade<input type="number" bind:value={selectedSlot.hp} on:change={triggerReactivity}></label>
                        <label style="color: #a855f7;">Não-Físico<input type="checkbox" bind:checked={selectedSlot.nonPhysicalDef} on:change={triggerReactivity} class="custom-chk non-phys"></label>
                    </div>
                    <div class="dmg-inputs">
                        <div class="grp"><label style="color:#eab308">Não Letal</label><input type="number" bind:value={inputShock}></div>
                        <div class="grp"><label style="color:#ef4444">Letal</label><input type="number" bind:value={inputKilling}></div>
                        <div class="grp"><label style="color:#00fbff">Perf.</label><input type="number" bind:value={inputPenetration}></div>
                        <div class="grp"><label style="color: #a855f7;">Não-Físico?</label><input type="checkbox" bind:checked={inputNonPhysical} class="custom-chk non-phys"></div>
                        <div class="grp"><label style="color: #f75555;">Engolfar</label><input type="checkbox" bind:checked={inputEngolfar} class="custom-chk engulf"></div>
                    </div>
                    <button class="btn-hit" on:click={applyDamage}>DANO</button>
                    <div class="heal-row" style="display: flex; gap: 5px;">
                        <input type="number" bind:value={inputHeal} placeholder="Reparo" style="flex: 1;">
                        <button on:click={applyHeal} class="btn-square-heal">+</button>
                    </div>
                    <div class="heal-row" style="display: flex; gap: 5px; margin-top: 5px;">
                        <input type="number" bind:value={inputRegen} placeholder="Reparo Engolf" style="border-color: #3b82f6; flex: 1;">
                        <button style="background: #3b82f6; color: #fff;" class="btn-square-heal" on:click={applyRegen} title="Reparo Todos"><i class="fas fa-tools"></i></button>
                    </div>
                {/if}
            </div>
            
            <!-- LISTA DE ITENS DO INVENTÁRIO (DRAGGABLE) -->
            <div class="inventory-mini-list custom-scroll">
                <div class="mini-title">ARRASTE PARA EQUIPAR</div>
                {#each items as item}
                    <div class="mini-item" draggable="true" on:dragstart={(e) => onItemDragStart(e, item)}>
                        <img src={item.img} alt="img">
                        <span>{item.name}</span>
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>

<style>
    .equip-dashboard { flex: 1; width: 100%; display: flex; flex-direction: column; height: 100%; background: #050505; color: #ccc; font-family: 'Rajdhani', sans-serif; overflow: hidden; position: relative; }
    .custom-scroll::-webkit-scrollbar { width: 4px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #333; }

    .dash-header { display: flex; justify-content: flex-end; background: rgba(0,0,0,0.8); padding: 5px 10px; border-bottom: 2px solid #00ff41; z-index: 20; align-items: center; }
    .tools { display: flex; gap: 5px;}
    .tool-btn { background: #222; border: 1px solid #444; color: #ccc; padding: 6px 12px; cursor: pointer; font-weight: bold; border-radius: 4px; transition: 0.2s;}
    .tool-btn:hover { background: #333; }
    .tool-btn.on { background: #00ff41; color: #000; border-color: #00ff41; }

    .dash-content { display: flex; flex: 1; overflow: hidden; position: relative; }
    
    .canvas-area { flex: 1; position: relative; overflow: hidden; border-right: 1px solid #333; background: #000; }
    .silhouette-layer { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; z-index: 1; pointer-events: none; opacity: 0.8; }
    
    .edit-overlay-controls { position: absolute; top: 10px; left: 10px; z-index: 100; display: flex; flex-direction: column; gap: 5px; }
    .edit-overlay-controls button { background: rgba(0,0,0,0.8); color: #fff; border: 1px solid #fff; cursor: pointer; font-size: 10px; padding: 6px 10px; text-align: left; font-weight: bold; border-radius: 4px;}
    .edit-overlay-controls button.add { background: #00ff41; color: #000; border: none; }

    .limb-node { position: absolute; transform: translate(-50%, -50%); background: #111; padding: 5px; min-width: 80px; display: flex; flex-direction: column; gap: 4px; cursor: pointer; transition: 0.2s; border-radius: 4px; z-index: 10; border: 1px solid #444; box-shadow: 0 0 10px rgba(0,0,0,0.8); }
    .limb-node.selected { border-color: #00ff41; box-shadow: 0 0 15px rgba(0,255,65,0.3); z-index: 50; }
    .node-header { display: flex; justify-content: space-between; font-size: 10px; border-bottom: 1px solid #333; padding-bottom: 2px;}
    .name { font-weight: bold; color: #fff; }
    .loc { color: #00ff41; font-weight: bold;}
    .mini-edit { width: 40px; background: #000; border: 1px solid #00ff41; color: #fff; font-size: 9px; text-align: center;}
    
    .equipped-item-area { display: flex; align-items: center; justify-content: center; min-height: 40px; background: rgba(0,0,0,0.5); border: 1px dashed #333; margin: 4px 0;}
    .empty-slot-hint { font-size: 10px; color: #555; }
    .item-pic-frame { width: 40px; height: 40px; position: relative; }
    .item-pic-frame img { width: 100%; height: 100%; object-fit: contain; }
    .btn-unequip { position: absolute; top: -5px; right: -5px; background: red; color: white; border: none; border-radius: 50%; width: 16px; height: 16px; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center;}

    .hp-grid { display: flex; flex-wrap: wrap; gap: 2px; justify-content: center; }
    .hp-slot { width: 14px; height: 14px; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; border-radius: 2px; border: 1px solid #333; }
    .hp-slot.shock { background: #eab308; border-color: #ca8a04; }
    .hp-slot.killing { background: #ef4444; border-color: #b91c1c; }

    .armor-flags { display: flex; gap: 2px; position: absolute; top: -10px; right: -5px; }
    .a-flag { font-size: 9px; padding: 2px 4px; border-radius: 2px; color: #fff; font-weight: bold; }
    .a-flag.l { background: #004488; }
    .a-flag.h { background: #5b21b6; }
    .node-del { position: absolute; top: -10px; left: -10px; background: red; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 12px; font-weight: bold; display: flex; align-items: center; justify-content: center; }

    /* SIDEBAR CALC */
    .sidebar { width: 260px; background: #08080a; display: flex; flex-direction: column; z-index: 20; border-left: 1px solid #333; }
    
    .calc-box { padding: 15px; border-bottom: 1px solid #333; }
    .calc-title { font-size: 13px; color: #00ff41; font-weight: bold; text-align: center; margin-bottom: 15px; letter-spacing: 1px;}
    .armor-edit, .dmg-inputs { display: flex; gap: 5px; margin-bottom: 10px; }
    .armor-edit label { flex: 1; font-size: 9px; color: #aaa; text-align: center; display: flex; flex-direction: column; gap: 3px; font-weight: bold;}
    .grp { flex: 1; display: flex; flex-direction: column; gap: 3px; }
    .grp label { font-size: 10px; font-weight: bold; text-align: center;}
    input[type="number"] { width: 100%; background: #000; border: 1px solid #444; color: #fff; text-align: center; padding: 6px; outline: none; border-radius: 4px;}
    input[type="number"]:focus { border-color: #00ff41; }
    
    .btn-hit { width: 100%; background: #ef4444; color: #fff; padding: 10px; margin-bottom: 10px; border: none; font-weight: bold; border-radius: 4px; cursor: pointer; transition: 0.2s;}
    .btn-hit:hover { background: #fff; color: #000; box-shadow: 0 0 15px #ef4444;}
    
    .btn-square-heal { width: 32px; height: 32px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 16px; background: #22c55e; color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; transition: 0.2s; }
    .btn-square-heal:hover { opacity: 0.8; }

    input.custom-chk {
        appearance: none;
        -webkit-appearance: none;
        width: 28px;
        height: 28px;
        background: #000;
        border: 1px solid #444;
        border-radius: 4px;
        cursor: pointer;
        position: relative;
        margin: 2px auto 0 auto;
        display: block;
    }
    input.custom-chk:checked::after {
        content: '✔';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 16px;
        color: #fff;
    }
    input.custom-chk.non-phys:checked { background: rgba(168, 85, 247, 0.2); border-color: #a855f7; }
    input.custom-chk.non-phys:checked::after { color: #a855f7; }
    input.custom-chk.engulf:checked { background: rgba(247, 85, 85, 0.2); border-color: #f75555; }
    input.custom-chk.engulf:checked::after { color: #f75555; }

    /* INVENTORY MINI LIST */
    .inventory-mini-list { flex: 1; padding: 15px; display: flex; flex-direction: column; gap: 8px; overflow-y: auto; background: rgba(0,0,0,0.3); }
    .mini-title { font-size: 11px; color: #888; font-weight: bold; text-align: center; border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 5px; }
    .mini-item { display: flex; align-items: center; gap: 10px; background: #111; padding: 6px; border: 1px solid #333; border-radius: 4px; cursor: grab; }
    .mini-item:hover { border-color: #555; background: #1a1a1a; }
    .mini-item img { width: 30px; height: 30px; object-fit: contain; }
    .mini-item span { font-size: 11px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
