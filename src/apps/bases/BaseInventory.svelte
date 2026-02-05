<script>
    import { slide, fade } from 'svelte/transition';
    import { GroupDatabase } from '../../database/GroupDatabase.js';
    import materialsDB from '../../../crafting/materials.json';

    // CORREÇÃO 1: Inicializa com null
    export let group = null;
    export let actor; 
    export let isLeader;

    // Constantes
    const matTypes = Object.keys(materialsDB);
    const tiers = [1, 2, 3, 4, 5, 6, 7];
    const isGM = game.user.isGM; 
    const RARITY_COLORS = {
        1: '#9ca3af', 2: '#3b82f6', 3: '#f59e0b', 
        4: '#ef4444', 5: '#10b981', 6: '#7c3aed', 7: '#000000'
    };

    // Estado Local
    let activeType = 'MATERIA';
    let transferMode = 'DEPOSIT';
    let transferAmount = 1;
    
    // Safe access para notes
    let groupNotes = group?.notes || "";
    let isSavingNotes = false;

    // CORREÇÃO 2: Reatividade Segura
    // Se group existe mas inventory não, cria objeto vazio
    $: if (group && !group.inventory) group.inventory = { MATERIA:{}, ORGANISMO:{}, ENERGIA:{}, NUCLEO:{} };

    // --- FUNÇÃO DO MESTRE ---
    async function modifyStock(type, tier, amount) {
        if (!group || !group.id) return; // Proteção
        if (!isGM) return ui.notifications.warn("Apenas o GM pode alterar a realidade.");
        
        if (!group.inventory[type]) group.inventory[type] = {};

        let current = group.inventory[type][tier] || 0;
        let newVal = Math.max(0, current + amount);
        
        group.inventory[type][tier] = newVal;
        
        // Força reatividade local
        group = group; 

        await GroupDatabase.updateGroupData(group.id, { inventory: group.inventory });
    }

    // --- FUNÇÃO DO JOGADOR ---
    async function executeTransfer(type, tier, qty = null) {
        if (!group || !group.id) return; // Proteção
        if (!actor) return ui.notifications.warn("Vincule um personagem para interagir com o cofre.");

        const baseInv = group.inventory;
        const charPockets = actor.system.pockets || {}; 
        
        let amount = qty === 'ALL' ? 999999 : (qty || transferAmount);
        
        if (transferMode === 'DEPOSIT') {
            const available = charPockets[type]?.[tier] || 0;
            if (available <= 0) return ui.notifications.warn("Você não possui este item.");
            
            amount = Math.min(amount, available);

            if (!baseInv[type]) baseInv[type] = {};
            baseInv[type][tier] = (baseInv[type][tier] || 0) + amount;

            await actor.update({ [`system.pockets.${type}.${tier}`]: available - amount });

        } else { // WITHDRAW
            const available = baseInv[type]?.[tier] || 0;
            if (available <= 0) return ui.notifications.warn("Cofre vazio.");

            amount = Math.min(amount, available);

            baseInv[type][tier] = available - amount;
            const currentActorQty = charPockets[type]?.[tier] || 0;
            await actor.update({ [`system.pockets.${type}.${tier}`]: currentActorQty + amount });
        }

        group.inventory = baseInv;
        group = group; // Svelte update
        
        await GroupDatabase.updateGroupData(group.id, { inventory: baseInv });
        ui.notifications.info(`${transferMode === 'DEPOSIT' ? 'Depositado' : 'Sacado'}: ${amount}x ${type} T${tier}`);
    }

    // --- BLOCO DE NOTAS ---
    let notesTimeout;
    function handleNotesInput() {
        if (!group || !group.id) return;
        isSavingNotes = true;
        clearTimeout(notesTimeout);
        notesTimeout = setTimeout(async () => {
            await GroupDatabase.updateGroupData(group.id, { notes: groupNotes });
            isSavingNotes = false;
        }, 1500);
    }
</script>

{#if group && group.id}
    <div class="inventory-layout" in:fade>
        
        <header class="inv-header">
            <div class="mode-switch">
                <button class:active={transferMode === 'DEPOSIT'} on:click={() => transferMode = 'DEPOSIT'}>
                    <i class="fas fa-upload"></i> DEPOSITAR
                </button>
                <button class:active={transferMode === 'WITHDRAW'} on:click={() => transferMode = 'WITHDRAW'}>
                    <i class="fas fa-download"></i> SACAR
                </button>
            </div>
            
            <div class="amount-ctrl">
                <small>QTD:</small>
                <input type="number" min="1" bind:value={transferAmount} class="qty-input"/>
            </div>
        </header>

        <nav class="type-nav">
            {#each matTypes as type}
                <button class:active={activeType === type} 
                        style="--type-color: {materialsDB[type].color}"
                        on:click={() => activeType = type}>
                    <i class="{materialsDB[type].icon}"></i> {materialsDB[type].label}
                </button>
            {/each}
        </nav>

        <div class="items-grid custom-scroll">
            {#each tiers as tier}
                {@const baseQty = group.inventory?.[activeType]?.[tier] || 0}
                {@const charQty = actor?.system.pockets?.[activeType]?.[tier] || 0}
                {@const hasItem = baseQty > 0 || charQty > 0}

                <div class="item-row" class:dimmed={!hasItem}>
                    
                    <div class="item-identity">
                        <span class="tier-badge" style="background: {RARITY_COLORS[tier]}">T{tier}</span>
                        <span class="rarity-name">{materialsDB[activeType].tiers[tier].label}</span>
                    </div>

                    <div class="stocks">
                        {#if isGM}
                            <div class="gm-controls">
                                <button on:click={() => modifyStock(activeType, tier, -1)}>-</button>
                            </div>
                        {/if}

                        <div class="stock-box base" title="No Cofre da Base">
                            <i class="fas fa-archive"></i> {baseQty}
                        </div>

                        {#if isGM}
                            <div class="gm-controls">
                                <button on:click={() => modifyStock(activeType, tier, 1)}>+</button>
                            </div>
                        {/if}

                        <div class="arrow-indicator">
                            <i class="fas {transferMode === 'DEPOSIT' ? 'fa-arrow-right' : 'fa-arrow-left'}"></i>
                        </div>

                        <div class="stock-box actor" title="No seu Inventário">
                            <i class="fas fa-user"></i> {charQty}
                        </div>
                    </div>

                    <div class="actions">
                        <button class="btn-action" on:click={() => executeTransfer(activeType, tier)}>
                            {transferMode === 'DEPOSIT' ? 'GUARDAR' : 'PEGAR'}
                        </button>
                        <button class="btn-all" on:click={() => executeTransfer(activeType, tier, 'ALL')}>
                            ALL
                        </button>
                    </div>
                </div>
            {/each}
        </div>

        <div class="notes-section">
            <div class="notes-header">
                <i class="fas fa-sticky-note"></i> NOTAS DA FACÇÃO
                {#if isSavingNotes}<span class="saving">Salvando...</span>{/if}
            </div>
            <textarea 
                bind:value={groupNotes} 
                on:input={handleNotesInput} 
                placeholder="Registro logístico..."
            ></textarea>
        </div>

    </div>
{:else}
    <div style="padding: 20px; color: #ccc; text-align: center;">Carregando Cofre...</div>
{/if}

<style>
/* CSS IGUAL AO ORIGINAL */
    .inventory-layout { height: 100%; display: flex; flex-direction: column; gap: 10px; color: #fff; font-family: 'Share Tech Mono', monospace; }

    /* HEADER & NAV */
    .inv-header { display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.3); padding: 10px; border: 1px solid #333; }
    .mode-switch { display: flex; gap: 5px; background: #111; padding: 2px; border-radius: 4px; }
    .mode-switch button { background: transparent; border: none; color: #666; padding: 5px 15px; cursor: pointer; font-weight: bold; font-family: inherit; transition: 0.2s; }
    .mode-switch button.active { background: #333; color: #fff; box-shadow: 0 0 5px rgba(255,255,255,0.2); }
    .amount-ctrl { display: flex; align-items: center; gap: 5px; }
    .qty-input { width: 50px; background: #000; border: 1px solid #444; color: #fff; text-align: center; font-family: inherit; padding: 5px; }

    .type-nav { display: flex; gap: 5px; margin-bottom: 5px; }
    .type-nav button { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid #333; border-bottom: 3px solid transparent; color: #888; padding: 8px; cursor: pointer; font-family: inherit; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 5px; }
    .type-nav button:hover { background: rgba(255,255,255,0.1); color: #fff; }
    .type-nav button.active { border-bottom-color: var(--type-color); color: var(--type-color); background: rgba(0,0,0,0.5); }

    /* GRID ITENS */
    .items-grid { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 5px; padding-right: 5px; }
    .item-row { display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.4); border: 1px solid #222; padding: 8px; transition: 0.2s; }
    .item-row:hover { background: rgba(255,255,255,0.05); border-color: #444; }
    .item-row.dimmed { opacity: 0.5; }

    .item-identity { display: flex; align-items: center; gap: 10px; width: 120px; }
    .tier-badge { padding: 2px 6px; color: #000; font-weight: bold; border-radius: 2px; font-size: 11px; }
    .rarity-name { font-size: 11px; color: #ccc; }

    /* ÁREA CENTRAL DE ESTOQUE */
    .stocks { display: flex; align-items: center; gap: 10px; flex: 1; justify-content: center; }
    .stock-box { display: flex; align-items: center; gap: 5px; font-size: 14px; font-weight: bold; min-width: 40px; justify-content: center; }
    .stock-box.base { color: #00ff41; }
    .stock-box.actor { color: #3b82f6; }
    .arrow-indicator { color: #666; font-size: 10px; width: 20px; text-align: center; }

    /* CONTROLES GM */
    .gm-controls button { width: 18px; height: 18px; line-height: 1; padding: 0; background: #220000; border: 1px solid #550000; color: #ff5555; cursor: pointer; font-weight: bold; font-size: 12px; }
    .gm-controls button:hover { background: #ff5555; color: #000; }

    /* AÇÕES JOGADOR */
    .actions { display: flex; gap: 5px; }
    .actions button { cursor: pointer; border: 1px solid #444; background: #111; color: #ccc; font-size: 10px; padding: 4px 8px; font-family: inherit; min-width: 60px; }
    .actions button:hover { border-color: #fff; color: #fff; }
    .btn-all:hover { border-color: #facc15; color: #facc15; }

    /* NOTAS */
    .notes-section { height: 120px; display: flex; flex-direction: column; background: #080808; border-top: 1px solid #333; margin-top: 5px; }
    .notes-header { background: #111; padding: 5px 10px; font-size: 11px; font-weight: bold; color: #888; display: flex; justify-content: space-between; }
    .saving { color: #00ff41; animation: pulse 1s infinite; }
    textarea { flex: 1; background: transparent; border: none; color: #ddd; padding: 10px; font-family: inherit; font-size: 12px; resize: none; }
    textarea:focus { outline: none; background: rgba(255,255,255,0.02); }

    .custom-scroll::-webkit-scrollbar { width: 5px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #444; }
    @keyframes pulse { 50% { opacity: 0.5; } }
</style>