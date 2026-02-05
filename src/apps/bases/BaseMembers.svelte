<script>
    import { fade, slide } from 'svelte/transition';
    import { GroupDatabase } from '../../database/GroupDatabase.js';
    
    import groupState from '../../../crafting/GroupBaseState.json'; 
    import personalities from '../../../crafting/personalities.json';
    import defaultStates from '../../../crafting/default_states.json';

    // Props recebidas do BaseApp
    export let group = null; // Inicializa como null para segurança
    export let isLeader = false;
    export let isGM = false;

    let activeTab = 'npcs'; 
    let editingNPC = null; 
    let isCreating = false;
    let draftNPC = null;

    // --- REATIVIDADE SEGURA ---
    // Se group for nulo, retorna array vazio para não quebrar o loop
    $: npcList = group?.npcs || [];
    
    // Mapeia IDs para Users, com proteção contra group nulo
    $: playerList = (group?.members || [])
        .map(id => game.users.get(id))
        .filter(u => u !== undefined);

    const rolesList = Object.keys(groupState.ROLES);
    const rarityList = Object.keys(groupState.RARITY_SCALE);
    const personalityList = Object.keys(personalities);

    let previewEffect = { label: '', desc: '' };

    $: if (isCreating && draftNPC) {
        const rData = groupState.RARITY_SCALE[draftNPC.rarity];
        const pData = personalities[draftNPC.personality];
        
        draftNPC.stats.production_bonus = rData?.production_val || 2;
        draftNPC.stats.combat_dice = rData?.combat_dice || 1;
        draftNPC.stats.personality_effect = pData?.effect?.label || "Nenhum";

        previewEffect = getEffectData(draftNPC.personality);
    }

    // --- AÇÕES ---
    function startCreation() {
        draftNPC = JSON.parse(JSON.stringify(defaultStates.NPC));
        draftNPC.id = foundry.utils.randomID();
        draftNPC.img = "icons/svg/mystery-man.svg";
        isCreating = true;
    }

    async function confirmCreation() {
        if (!group) return; // Segurança extra
        if (!draftNPC.name) return ui.notifications.warn("O NPC precisa de um nome.");
        
        const newNpcs = [...(group.npcs || []), draftNPC];
        const newPop = { ...group.population, count: (group.population?.count || 0) + 1 };

        await GroupDatabase.updateGroupData(group.id, { npcs: newNpcs, population: newPop });
        
        isCreating = false;
        draftNPC = null;
        ui.notifications.info("Habitante registrado.");
    }

    function cancelCreation() { isCreating = false; draftNPC = null; }

    async function generateNPC() {
        if (!isGM || !group) return;
        await GroupDatabase.generateRandomNPC(group.id);
    }

    async function deleteNPC(npcId) {
        if (!isGM || !group) return;
        await GroupDatabase.deleteNPC(group.id, npcId);
    }

    async function saveEdit(npc) {
        if (!group) return;
        const newNpcs = [...group.npcs];
        const index = newNpcs.findIndex(n => n.id === npc.id);
        if (index !== -1) {
            newNpcs[index] = npc;
            await GroupDatabase.updateGroupData(group.id, { npcs: newNpcs });
        }
        editingNPC = null;
    }

    // Helpers Visuais
    function getRoleIcon(roleKey) { return groupState.ROLES[roleKey]?.icon || 'fas fa-user'; }
    function getRoleLabel(roleKey) { return groupState.ROLES[roleKey]?.label || roleKey; }
    function getRoleDesc(roleKey) { return groupState.ROLES[roleKey]?.description || ''; }
    function getPersLabel(pKey) { return personalities[pKey]?.label || pKey; }
    
    function getEffectData(pKey) {
        const p = personalities[pKey];
        if (!p || !p.effect) return { label: 'Sem Efeito', desc: '' };
        return p.effect;
    }
</script>

{#if group}
    <div class="members-container" in:fade>
        
        <div class="tabs">
            <button class:active={activeTab === 'npcs'} on:click={() => activeTab = 'npcs'}>
                POPULAÇÃO ({npcList.length})
            </button>
            <button class:active={activeTab === 'players'} on:click={() => activeTab = 'players'}> 
                JOGADORES ({playerList.length})
            </button>
        </div>

        <div class="content-scroll custom-scroll">
            
            {#if isCreating}
                <div class="creation-panel" transition:slide>
                    <div class="creation-header">NOVO REGISTRO</div>
                    <div class="creation-body">
                        <div class="form-col">
                            <div class="f-group"><label>Nome</label><input type="text" bind:value={draftNPC.name}></div>
                            <div class="f-group">
                                <label>Função</label>
                                <select bind:value={draftNPC.role}>
                                    {#each rolesList as r}<option value={r}>{getRoleLabel(r)}</option>{/each}
                                </select>
                            </div>
                            <div class="f-row">
                                <div class="f-group">
                                    <label>Raridade</label>
                                    <select bind:value={draftNPC.rarity}>
                                        {#each rarityList as r}<option value={r}>{r}</option>{/each}
                                    </select>
                                </div>
                                <div class="f-group">
                                    <label>Personalidade</label>
                                    <select bind:value={draftNPC.personality}>
                                        {#each personalityList as p}<option value={p}>{getPersLabel(p)}</option>{/each}
                                    </select>
                                </div>
                            </div>
                            <div class="f-group"><label>URL Imagem</label><input type="text" bind:value={draftNPC.img}></div>
                            <div class="f-group"><label>Histórico (Opcional)</label><textarea bind:value={draftNPC.description} rows="2"></textarea></div>
                        </div>

                        <div class="preview-col">
                            <small>PREVIEW</small>
                            <div class="npc-card rarity-{draftNPC.rarity} preview-card">
                                <div class="npc-head">
                                    <div class="role-icon"><i class={getRoleIcon(draftNPC.role)}></i></div>
                                    <div class="npc-basic">
                                        <div class="name">{draftNPC.name || 'Nome'}</div>
                                        <div class="badges">
                                            <span class="badge role">{getRoleLabel(draftNPC.role)}</span>
                                            <span class="badge rarity">{draftNPC.rarity}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="npc-body">
                                    <div class="img-box"><img src={draftNPC.img} alt="NPC"></div>
                                    <div class="details">
                                        <div class="trait-effect">
                                            <div class="eff-head"><i class="fas fa-star"></i> {previewEffect.label}</div>
                                            <div class="eff-desc">{previewEffect.desc}</div>
                                        </div>
                                        <div class="desc-box"><p>{draftNPC.description || getRoleDesc(draftNPC.role)}</p></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="creation-footer">
                        <button class="btn-cancel" on:click={cancelCreation}>CANCELAR</button>
                        <button class="btn-confirm" on:click={confirmCreation}>CONFIRMAR</button>
                    </div>
                </div>
            {/if}

            {#if activeTab === 'npcs' && !isCreating}
                <div class="npc-controls">
                    <span>Habitantes da Base</span>
                    {#if isGM}
                        <div class="gm-actions">
                            <button class="manual-btn" on:click={startCreation}><i class="fas fa-edit"></i> MANUAL</button>
                            <button class="add-btn" on:click={generateNPC}><i class="fas fa-dice"></i> ALEATÓRIO</button>
                        </div>
                    {/if}
                </div>

                <div class="npc-grid">
                    {#each npcList as npc (npc.id)}
                        {@const effect = getEffectData(npc.personality)}
                        
                        <div class="npc-card rarity-{npc.rarity}" transition:fade|local>
                            <div class="npc-head">
                                <div class="role-icon"><i class={getRoleIcon(npc.role)}></i></div>
                                <div class="npc-basic">
                                    {#if editingNPC === npc.id}
                                        <input type="text" bind:value={npc.name} class="edit-name">
                                    {:else}
                                        <div class="name">{npc.name}</div>
                                    {/if}
                                    <div class="badges">
                                        <span class="badge role">{getRoleLabel(npc.role)}</span>
                                        <span class="badge rarity">{npc.rarity}</span>
                                    </div>
                                </div>
                                
                                {#if isGM}
                                    <div class="card-tools">
                                        {#if editingNPC === npc.id}
                                            <i class="fas fa-save save" on:click={() => saveEdit(npc)}></i>
                                        {:else}
                                            <i class="fas fa-pen edit" on:click={() => editingNPC = npc.id}></i>
                                            <i class="fas fa-trash del" on:click={() => deleteNPC(npc.id)}></i>
                                        {/if}
                                    </div>
                                {/if}
                            </div>

                            <div class="npc-body">
                                <div class="img-box">
                                    {#if editingNPC === npc.id}
                                        <input type="text" bind:value={npc.img} placeholder="URL">
                                    {/if}
                                    <img src={npc.img || "icons/svg/mystery-man.svg"} alt="NPC">
                                </div>
                                
                                <div class="details">
                                    <div class="trait">
                                        <strong>{getPersLabel(npc.personality)}</strong>
                                    </div>

                                    <div class="trait-effect">
                                        <div class="eff-head"><i class="fas fa-star"></i> {effect.label}</div>
                                        <div class="eff-desc">{effect.desc}</div>
                                    </div>
                                    
                                    <div class="desc-box">
                                        {#if editingNPC === npc.id}
                                            <textarea bind:value={npc.description} rows="3"></textarea>
                                        {:else}
                                            <p>{npc.description || getRoleDesc(npc.role)}</p>
                                        {/if}
                                    </div>
                                </div>
                            </div>

                            <div class="npc-footer">
                                <span><i class="fas fa-cogs"></i> Prod: {npc.stats.production_bonus}x</span>
                                <span><i class="fas fa-fist-raised"></i> Combate: {npc.stats.combat_dice}d</span>
                            </div>
                        </div>
                    {/each}
                </div>

            {:else if activeTab === 'players'}
                <div class="player-grid">
                    {#each playerList as p (p.id)}
                        <div class="player-card" transition:slide|local>
                            <img src={p.character?.img || "icons/svg/mystery-man.svg"} alt="P">
                            <span>{p.name}</span>
                            <span class="role" style="background: {p.id === group.leader ? '#004400' : '#222'}; color: {p.id === group.leader ? '#00ff41' : '#aaa'}">
                                {p.id === group.leader ? 'LÍDER' : 'MEMBRO'}
                            </span>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
{:else}
    <div class="loading-state" style="color: #00ff41; padding: 20px; text-align: center;">
        <i class="fas fa-circle-notch fa-spin"></i> Carregando dados do grupo...
    </div>
{/if}

<style>
/* CSS Mantido */
    .members-container { height: 100%; display: flex; flex-direction: column; gap: 10px; font-family: 'Share Tech Mono', monospace; color: #fff; }
    .tabs { display: flex; gap: 5px; border-bottom: 1px solid #333; }
    .tabs button { background: transparent; border: none; color: #666; padding: 8px 15px; cursor: pointer; font-weight: bold; border-bottom: 2px solid transparent; transition: 0.2s; }
    .tabs button:hover { color: #ccc; }
    .tabs button.active { color: #00ff41; border-color: #00ff41; background: rgba(0,255,65,0.05); }
    .content-scroll { flex: 1; overflow-y: auto; padding-right: 5px; }
    
    .npc-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .gm-actions { display: flex; gap: 5px; }
    .add-btn, .manual-btn { border: 1px solid; padding: 5px 10px; cursor: pointer; font-size: 11px; transition: 0.2s; }
    .add-btn { background: #004400; color: #00ff41; border-color: #00ff41; }
    .add-btn:hover { background: #006600; color: #fff; }
    .manual-btn { background: #111; color: #ccc; border-color: #666; }
    .manual-btn:hover { border-color: #fff; color: #fff; }

    .npc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px; }
    .npc-card { background: rgba(255,255,255,0.02); border: 1px solid #333; border-radius: 4px; display: flex; flex-direction: column; overflow: hidden; transition: 0.2s; }
    .npc-card:hover { border-color: #555; box-shadow: 0 0 10px rgba(0,0,0,0.5); }
    
    .npc-card.rarity-COMUM { border-left: 3px solid #999; }
    .npc-card.rarity-RARO { border-left: 3px solid #3b82f6; }
    .npc-card.rarity-LENDARIO { border-left: 3px solid #f59e0b; }
    .npc-card.rarity-MITICO { border-left: 3px solid #ef4444; }
    .npc-card.rarity-UNIVERSAL { border-left: 3px solid #10b981; }

    .npc-head { background: rgba(0,0,0,0.3); padding: 8px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #222; }
    .role-icon { font-size: 18px; color: #00ff41; width: 30px; text-align: center; }
    .npc-basic { flex: 1; overflow: hidden; }
    .name { font-weight: bold; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .badges { display: flex; gap: 5px; margin-top: 2px; }
    .badge { font-size: 9px; background: #222; padding: 1px 4px; border-radius: 2px; color: #aaa; text-transform: uppercase; }
    .card-tools { display: flex; gap: 8px; font-size: 12px; cursor: pointer; }
    .edit { color: #facc15; } .del { color: #ef4444; } .save { color: #00ff41; }

    .npc-body { padding: 10px; display: flex; gap: 10px; }
    .img-box { width: 60px; display: flex; flex-direction: column; gap: 5px; flex-shrink: 0; }
    .img-box img { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #444; }
    .img-box input { width: 100%; font-size: 9px; background: #000; border: 1px solid #333; color: #fff; }

    .details { flex: 1; font-size: 11px; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    .trait strong { color: #fff; }
    
    .trait-effect { 
        background: rgba(255, 215, 0, 0.1); 
        border: 1px solid rgba(255, 215, 0, 0.3); 
        padding: 6px; 
        border-radius: 4px; 
        color: #facc15;
    }
    .eff-head { font-weight: bold; font-size: 10px; margin-bottom: 2px; display: flex; align-items: center; gap: 5px; }
    .eff-desc { font-size: 9px; opacity: 0.9; line-height: 1.2; font-style: italic; color: #ddd; }

    .desc-box { background: rgba(0,0,0,0.3); padding: 5px; border-radius: 4px; }
    .desc-box p { margin: 0; color: #aaa; font-size: 10px; line-height: 1.3; }
    .desc-box textarea { width: 100%; background: #111; border: 1px solid #333; color: #ddd; font-size: 10px; resize: vertical; }
    .edit-name { background: #111; border: none; color: #fff; width: 100%; font-weight: bold; }

    .npc-footer { background: #111; padding: 5px 10px; font-size: 10px; display: flex; justify-content: space-between; color: #666; border-top: 1px solid #222; }

    /* FORM CRIAÇÃO */
    .creation-panel { background: #080808; border: 1px solid #00ff41; padding: 10px; margin-bottom: 20px; box-shadow: 0 0 20px rgba(0,255,65,0.1); }
    .creation-header { background: #00ff41; color: #000; font-weight: bold; padding: 5px 10px; margin-bottom: 10px; }
    .creation-body { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .f-group { display: flex; flex-direction: column; margin-bottom: 8px; }
    .f-row { display: flex; gap: 10px; }
    .f-group label { font-size: 10px; color: #888; }
    .f-group input, .f-group select, .f-group textarea { background: #111; border: 1px solid #333; color: #fff; padding: 5px; font-family: inherit; font-size: 11px; }
    .preview-col small { color: #00ff41; display: block; margin-bottom: 5px; text-align: center; }
    .preview-card { transform: scale(0.95); transform-origin: top center; pointer-events: none; }
    .creation-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 15px; padding-top: 10px; border-top: 1px solid #333; }
    .btn-cancel { background: transparent; color: #888; border: 1px solid #555; padding: 5px 15px; cursor: pointer; }
    .btn-confirm { background: #00ff41; color: #000; border: none; padding: 5px 15px; font-weight: bold; cursor: pointer; }

    .player-grid { display: flex; flex-direction: column; gap: 5px; }
    .player-card { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.05); padding: 8px; border: 1px solid #333; transition: 0.2s; }
    .player-card:hover { border-color: #00ff41; background: rgba(0,255,65,0.05); }
    .player-card img { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; border: 1px solid #444; }
    .player-card .role { margin-left: auto; font-size: 10px; padding: 2px 6px; border-radius: 2px; }
    
    .custom-scroll::-webkit-scrollbar { width: 5px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #333; }
</style>