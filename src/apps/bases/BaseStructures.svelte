<script>
    import { slide, fade } from 'svelte/transition';
    import { GroupDatabase } from '../../database/GroupDatabase.js';
    import materialsDB from '../../../crafting/materials.json';

    export let group;
    export let isLeader;
    const isGM = game.user.isGM;

    // --- ESTADO ---
    let activeTab = 'built'; // 'built', 'blueprints', 'creator'
    let blueprints = [];
    let builtStructures = Array.isArray(group.structures) ? group.structures : []; // Garante array

    // --- DADOS DO CRIADOR (DRAFT) ---
    let draft = {
        id: "",
        name: "",
        icon: "fas fa-home",
        description: "",
        stats: { hp: 20, maxHp: 20, har: 0, lar: 0, protection: 0 },
        costs: [], // { type, tier, qty }
        effects: [], // { label, desc }
        script: "// Escreva JS aqui. Variáveis disponíveis: actor, group, structure, ui, chat..."
    };

    // Recarrega blueprints quando houver update
    $: {
        blueprints = GroupDatabase.getBlueprints();
        builtStructures = Array.isArray(group.structures) ? group.structures : [];
    }

    // --- FUNÇÕES DE CRIAÇÃO (GM) ---
    function initCreator(bp = null) {
        if (bp) {
            draft = JSON.parse(JSON.stringify(bp)); // Edição
        } else {
            // Novo
            draft = {
                id: foundry.utils.randomID(),
                name: "Nova Estrutura",
                icon: "fas fa-cube",
                description: "",
                stats: { hp: 20, har: 0, lar: 0, protection: 0 },
                costs: [],
                effects: [],
                script: `// Exemplo: Curar o grupo ao ativar\n// group.bio.hp += 1;\n// ui.notifications.info("Sistema Ativado!");`
            };
        }
        activeTab = 'creator';
    }

    function addCostRow() {
        draft.costs = [...draft.costs, { type: 'MATERIA', tier: 1, qty: 10 }];
    }
    function removeCostRow(i) {
        draft.costs = draft.costs.filter((_, idx) => idx !== i);
    }

    function addEffectRow() {
        draft.effects = [...draft.effects, { label: "Novo Efeito", desc: "Descrição..." }];
    }
    function removeEffectRow(i) {
        draft.effects = draft.effects.filter((_, idx) => idx !== i);
    }

    async function saveBlueprint() {
        if (!draft.name) return ui.notifications.warn("Nome obrigatório.");
        draft.stats.maxHp = draft.stats.hp; // Sincroniza MaxHP
        await GroupDatabase.saveBlueprint(draft);
        ui.notifications.info("Projeto Salvo na Database Global.");
        activeTab = 'blueprints';
    }

    async function deleteBlueprint(id) {
        await GroupDatabase.deleteBlueprint(id);
    }

    // --- FUNÇÕES DE CONSTRUÇÃO (JOGADOR) ---
    function checkResources(costs) {
        if (!costs || costs.length === 0) return true;
        for (let c of costs) {
            if ((group.inventory[c.type]?.[c.tier] || 0) < c.qty) return false;
        }
        return true;
    }

    async function build(bp) {
        if (!isLeader && !isGM) return ui.notifications.warn("Apenas o líder constrói.");
        if (!isGM && !checkResources(bp.costs)) return ui.notifications.warn("Recursos insuficientes.");

        // Consome recursos
        if (!isGM) {
            for (let c of bp.costs) {
                group.inventory[c.type][c.tier] -= c.qty;
            }
        }

        // Salva estrutura e inventário
        await GroupDatabase.buildStructure(group.id, bp);
        // Atualiza inventário na DB também (pois buildStructure salva group, mas inventory mudou localmente)
        await GroupDatabase.updateGroupData(group.id, { inventory: group.inventory });
        
        ui.notifications.info(`${bp.name} construído!`);
        activeTab = 'built';
    }

    async function demolish(instanceId) {
        if (!isLeader && !isGM) return;
        await GroupDatabase.deleteStructureInstance(group.id, instanceId);
    }

    // --- INTERAÇÃO COM ESTRUTURA ---
    async function sendEffectToChat(effect, structName) {
        const content = `
            <div style="background:#050505; border:1px solid #00ff41; padding:10px; color:#fff; font-family:'Share Tech Mono'">
                <h3 style="color:#00ff41; border-bottom:1px solid #333; margin:0 0 5px 0;">${structName}</h3>
                <div style="font-weight:bold; color:#facc15;">SYSTEM: ${effect.label}</div>
                <div style="font-size:12px; margin-top:5px;">${effect.desc}</div>
            </div>
        `;
        ChatMessage.create({ content });
    }

    // --- ORACLE ENGINE (EXECUÇÃO DE SCRIPT) ---
    async function runScript(structure) {
        if (!structure.script || structure.script.length < 5) return;
        
        ui.notifications.info(`Executando protocolos de ${structure.name}...`);

        try {
            // Cria função assíncrona isolada
            const asyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            
            const scriptFunc = new asyncFunction(
                "structure", "group", "actor", "game", "ui", "GroupDatabase",
                structure.script
            );

            // Executa passando o contexto atual
            // structure é passado como objeto. Se o script alterar 'structure.currentHp', 
            // precisaremos salvar isso manualmente depois se quisermos persistência.
            
            // Para permitir persistência fácil, passamos uma função de saveHelper
            const saveHelper = async () => {
                await GroupDatabase.updateGroupData(group.id, { structures: group.structures });
            };

            await scriptFunc(structure, group, game.user.character, game, ui, GroupDatabase);
            
            // Auto-save após script rodar (caso tenha alterado stats da estrutura)
            await saveHelper();

        } catch (err) {
            console.error(err);
            ui.notifications.error(`Erro no Script: ${err.message}`);
        }
    }

    const RARITY_COLORS = { 1:'#999', 2:'#3b82f6', 3:'#f59e0b', 4:'#ef4444', 5:'#10b981', 6:'#7c3aed', 7:'#000' };
</script>

<div class="structures-layout" in:fade>
    
    <div class="tabs">
        <button class:active={activeTab==='built'} on:click={()=>activeTab='built'}>BASE OPERACIONAL</button>
        <button class:active={activeTab==='blueprints'} on:click={()=>activeTab='blueprints'}>PROJETOS</button>
        {#if isGM}
            <button class:active={activeTab==='creator'} on:click={()=>initCreator()} class="gm-tab">CRIADOR (GM)</button>
        {/if}
    </div>

    <div class="content-area custom-scroll">
        
        {#if activeTab === 'built'}
            {#if builtStructures.length === 0}
                <div class="empty">Nenhuma estrutura funcional. Vá em Projetos para construir.</div>
            {/if}
            <div class="struct-grid">
                {#each builtStructures as struct}
                    <div class="struct-card">
                        <div class="head">
                            <i class={struct.icon}></i> 
                            <span class="s-name">{struct.name}</span>
                            <div class="hp-badge">
                                HP {struct.currentHp ?? struct.stats.hp}/{struct.stats.hp}
                            </div>
                            {#if isGM || isLeader}
                                <i class="fas fa-trash del-btn" on:click={()=>demolish(struct.instanceId)}></i>
                            {/if}
                        </div>
                        
                        <div class="stats-row">
                            <span title="Blindagem">HAR: {struct.stats.har}</span>
                            <span title="Armadura Leve">LAR: {struct.stats.lar}</span>
                            <span title="Proteção Geral">PROT: {struct.stats.protection}</span>
                        </div>

                        <div class="desc">{struct.description}</div>

                        <div class="effects-list">
                            {#each struct.effects as eff}
                                <button class="eff-btn" on:click={()=>sendEffectToChat(eff, struct.name)}>
                                    <i class="fas fa-bolt"></i> {eff.label}
                                </button>
                            {/each}
                        </div>

                        {#if struct.script && struct.script.length > 10}
                            <button class="script-btn" on:click={()=>runScript(struct)}>
                                <i class="fas fa-terminal"></i> EXECUTAR SISTEMA
                            </button>
                        {/if}
                    </div>
                {/each}
            </div>

        {:else if activeTab === 'blueprints'}
            <div class="bp-grid">
                {#each blueprints as bp}
                    {@const canBuild = checkResources(bp.costs)}
                    <div class="bp-card" class:disabled={!canBuild && !isGM}>
                        <div class="bp-head">
                            <strong>{bp.name}</strong>
                            {#if isGM}
                                <div class="gm-tools">
                                    <i class="fas fa-edit" on:click={()=>initCreator(bp)}></i>
                                    <i class="fas fa-trash" on:click={()=>deleteBlueprint(bp.id)}></i>
                                </div>
                            {/if}
                        </div>
                        
                        <div class="bp-stats">
                            HP:{bp.stats.hp} | HAR:{bp.stats.har} | PROT:{bp.stats.protection}
                        </div>

                        <div class="costs-list">
                            {#each bp.costs as c}
                                <div class="cost-tag" class:ok={(group.inventory[c.type]?.[c.tier]||0) >= c.qty}>
                                    {c.qty}x {c.type} <span style="color:{RARITY_COLORS[c.tier]}">T{c.tier}</span>
                                </div>
                            {/each}
                            {#if bp.costs.length === 0}<span class="free">GRÁTIS</span>{/if}
                        </div>

                        <button class="build-btn" disabled={!canBuild && !isGM} on:click={()=>build(bp)}>
                            CONSTRUIR
                        </button>
                    </div>
                {/each}
            </div>

        {:else if activeTab === 'creator'}
            <div class="creator-panel">
                <div class="form-row">
                    <input type="text" bind:value={draft.name} placeholder="Nome da Estrutura">
                    <input type="text" bind:value={draft.icon} placeholder="Ícone (fas fa-...)">
                </div>
                <textarea bind:value={draft.description} rows="2" placeholder="Descrição temática..."></textarea>
                
                <div class="stats-inputs">
                    <label>HP <input type="number" bind:value={draft.stats.hp}></label>
                    <label>HAR <input type="number" bind:value={draft.stats.har}></label>
                    <label>LAR <input type="number" bind:value={draft.stats.lar}></label>
                    <label>PROT <input type="number" bind:value={draft.stats.protection}></label>
                </div>

                <div class="list-editor">
                    <div class="le-head">CUSTOS DE CONSTRUÇÃO <i class="fas fa-plus" on:click={addCostRow}></i></div>
                    {#each draft.costs as c, i}
                        <div class="le-row">
                            <select bind:value={c.type}>
                                {#each Object.keys(materialsDB) as k}<option value={k}>{k}</option>{/each}
                            </select>
                            <select bind:value={c.tier}>
                                {#each [1,2,3,4,5,6,7] as t}<option value={t}>Tier {t}</option>{/each}
                            </select>
                            <input type="number" bind:value={c.qty} style="width:50px">
                            <i class="fas fa-times" on:click={()=>removeCostRow(i)}></i>
                        </div>
                    {/each}
                </div>

                <div class="list-editor">
                    <div class="le-head">EFEITOS (Botões de Chat) <i class="fas fa-plus" on:click={addEffectRow}></i></div>
                    {#each draft.effects as e, i}
                        <div class="le-row">
                            <input type="text" bind:value={e.label} placeholder="Nome do Botão">
                            <input type="text" bind:value={e.desc} placeholder="Texto do Chat...">
                            <i class="fas fa-times" on:click={()=>removeEffectRow(i)}></i>
                        </div>
                    {/each}
                </div>

                <div class="script-editor">
                    <div class="le-head">ORACLE SCRIPT ENGINE (JS)</div>
                    <textarea bind:value={draft.script} class="code-area"></textarea>
                    <small>Contexto: structure, group, actor, game, ui, GroupDatabase</small>
                </div>

                <div class="creator-footer">
                    <button class="save-bp" on:click={saveBlueprint}>SALVAR PROJETO GLOBAL</button>
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    .structures-layout { height: 100%; display: flex; flex-direction: column; gap: 10px; color: #fff; font-family: 'Share Tech Mono', monospace; }
    
    .tabs { display: flex; gap: 5px; border-bottom: 1px solid #333; }
    .tabs button { background: transparent; border: none; color: #666; padding: 8px 15px; cursor: pointer; font-weight: bold; border-bottom: 2px solid transparent; }
    .tabs button.active { color: #00ff41; border-color: #00ff41; background: rgba(0,255,65,0.05); }
    .gm-tab { color: #facc15 !important; }
    .gm-tab.active { border-color: #facc15 !important; }

    .content-area { flex: 1; overflow-y: auto; padding-right: 5px; }

    /* BUILT STRUCTURES */
    .struct-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; }
    .struct-card { background: rgba(0,30,0,0.4); border: 1px solid #00ff41; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
    .head { display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #004400; padding-bottom: 5px; }
    .head i { font-size: 18px; color: #00ff41; }
    .s-name { font-weight: bold; font-size: 14px; flex: 1; }
    .hp-badge { font-size: 10px; background: #220000; padding: 2px 5px; border: 1px solid #550000; color: #ff5555; }
    .del-btn { color: #555; cursor: pointer; } .del-btn:hover { color: red; }

    .stats-row { display: flex; justify-content: space-between; font-size: 10px; color: #aaa; background: #000; padding: 3px; }
    .desc { font-size: 11px; opacity: 0.8; font-style: italic; min-height: 30px; }

    .effects-list { display: flex; flex-wrap: wrap; gap: 5px; }
    .eff-btn { background: #111; border: 1px solid #444; color: #ddd; font-size: 10px; padding: 4px 8px; cursor: pointer; flex: 1; }
    .eff-btn:hover { border-color: #facc15; color: #facc15; }

    .script-btn { background: #002200; border: 1px dashed #00ff41; color: #00ff41; width: 100%; padding: 5px; cursor: pointer; font-size: 10px; margin-top: auto; }
    .script-btn:hover { background: #00ff41; color: #000; }

    /* BLUEPRINTS */
    .bp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
    .bp-card { background: #080808; border: 1px dashed #444; padding: 10px; display: flex; flex-direction: column; gap: 5px; opacity: 0.8; }
    .bp-card:hover { opacity: 1; border-color: #666; }
    .bp-card.disabled { opacity: 0.4; filter: grayscale(1); }
    
    .bp-head { display: flex; justify-content: space-between; color: #ccc; font-size: 13px; }
    .gm-tools i { cursor: pointer; margin-left: 5px; font-size: 10px; } .gm-tools i:hover { color: #facc15; }
    .bp-stats { font-size: 10px; color: #666; }
    
    .costs-list { display: flex; flex-wrap: wrap; gap: 3px; font-size: 10px; margin: 5px 0; }
    .cost-tag { background: #111; border: 1px solid #333; padding: 1px 4px; color: #888; }
    .cost-tag.ok { border-color: #00ff41; color: #fff; }
    .free { color: #00ff41; font-weight: bold; }

    .build-btn { margin-top: auto; background: #222; border: 1px solid #444; color: #fff; padding: 5px; cursor: pointer; }
    .build-btn:not(:disabled):hover { background: #00ff41; color: #000; border-color: #00ff41; }

    /* CREATOR */
    .creator-panel { display: flex; flex-direction: column; gap: 10px; padding: 10px; background: #050505; border: 1px solid #333; }
    .form-row { display: flex; gap: 5px; }
    input, textarea, select { background: #111; border: 1px solid #333; color: #fff; padding: 5px; font-family: inherit; font-size: 11px; width: 100%; }
    .stats-inputs { display: flex; gap: 10px; justify-content: space-between; background: #000; padding: 5px; }
    .stats-inputs label { font-size: 10px; color: #888; text-align: center; }
    .stats-inputs input { width: 40px; text-align: center; border-bottom: 1px solid #555; border-top:none; border-left:none; border-right:none; }

    .list-editor { border: 1px solid #222; padding: 5px; background: rgba(255,255,255,0.02); }
    .le-head { font-size: 10px; font-weight: bold; color: #aaa; margin-bottom: 5px; display: flex; justify-content: space-between; cursor: pointer; }
    .le-row { display: flex; gap: 5px; align-items: center; margin-bottom: 3px; }
    .le-row i { cursor: pointer; color: #555; } .le-row i:hover { color: red; }

    .code-area { font-family: 'Consolas', monospace; height: 100px; color: #aaffaa; background: #001100; font-size: 10px; }
    .save-bp { background: #004400; color: #00ff41; border: 1px solid #00ff41; padding: 10px; width: 100%; font-weight: bold; cursor: pointer; }
    .save-bp:hover { background: #00ff41; color: #000; }

    .custom-scroll::-webkit-scrollbar { width: 5px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #333; }
    .empty { text-align: center; color: #555; margin-top: 20px; }
</style>