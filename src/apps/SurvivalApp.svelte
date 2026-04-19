<script>
import { onMount, onDestroy } from 'svelte';
    import { slide, fade, scale } from 'svelte/transition';

    export let actor;
    export let flags = {}; 
    export let system = {};
    export let cssVariables = "";
    export let themeColor = "#00ff41";

    const MODULE_ID = "multiversus-rpg";

    // =======================================================
    // 1. HERANÇA DE NÍVEL E VONTADE (Regras 6, 7 e 10)
    // =======================================================
    // Puxa o nível do sistema/perfil
// Puxa o nível manual da aba de sobrevivência, ou herda do sistema como base
$: activeLevel = flags.surv_level !== undefined ? flags.surv_level : (system.level || 1);

    // Calcula os Pontos de Sobrevivência (10 base + 2 por nível)
    $: totalSurvivalPoints = 10 + (Math.max(0, activeLevel - 1) * 2);

    // Lógica de Sanidade / Base Will (Herdado do Profile)
    $: statCharm = Number(system.stats?.charm?.value || flags.stats?.charm?.normal || 1);
    $: statCommand = Number(system.stats?.command?.value || flags.stats?.command?.normal || 1);
    $: boughtBaseWill = flags.boughtBaseWill || 0;
    
    // O Máximo Base do Perfil
    $: profileMaxWill = statCharm + statCommand + activeLevel + boughtBaseWill;
    // O Atual Base do Perfil
    $: profileCurrWill = flags.currWillpower !== undefined ? flags.currWillpower : profileMaxWill;

    // Sanidade Local (Pode sobrescrever a do perfil manualmente)
    $: sanityMax = flags.surv_sanity_max !== undefined ? flags.surv_sanity_max : profileMaxWill;
    $: sanityCurr = flags.surv_sanity_curr !== undefined ? flags.surv_sanity_curr : profileCurrWill;

    // =======================================================
    // 2. VITAIS: FOME, SEDE E EXAUSTÃO (Regras 2, 3 e 4)
    // =======================================================
    $: hunger = flags.surv_hunger !== undefined ? flags.surv_hunger : 10;
    $: thirst = flags.surv_thirst !== undefined ? flags.surv_thirst : 10;
    $: exhaustion = flags.surv_exhaustion !== undefined ? flags.surv_exhaustion : 0;

    // =======================================================
    // 3. ATRIBUTOS DE SOBREVIVÊNCIA (Regra 9)
    // =======================================================
    $: survSkills = flags.surv_skills || {
        extracao: 0,
        engenharia: 0,
        sintetica: 0,
        sobrevivencia: 0
    };

    $: spentSkillPoints = Object.values(survSkills).reduce((a, b) => a + Number(b), 0);
    $: availableSkillPoints = totalSurvivalPoints - spentSkillPoints;

    // =======================================================
    // 4. INVENTÁRIO (Pockets Originais + Materiais Novos) (Regra 5)
    // =======================================================
let pockets = { MATERIA:{}, ORGANISMO:{}, ENERGIA:{}, NUCLEO:{} };
    $: materialsList = flags.surv_materials_list || [];
    $: survivalNotes = flags.surv_notes || "";

    const RARITY_MAP = {
        1: { label: 'C', color: '#999' }, 2: { label: 'R', color: '#3b82f6' },
        3: { label: 'L', color: '#f59e0b' }, 4: { label: 'M', color: '#ef4444' },
        5: { label: 'U', color: '#10b981' }, 6: { label: 'MV', color: '#7c3aed' }
    };

    // UI States
    let notesExpanded = false;
    let showConsumeModal = false;
    function openNotes() { notesExpanded = true; }
    function closeNotes() { notesExpanded = false; }

    // =======================================================
    // RÁDIO COMUNICADOR: LIVE SYNC COM A BASE
    // =======================================================
// =======================================================
    // RÁDIO COMUNICADOR E INICIALIZAÇÃO FORÇADA
    // =======================================================
    onMount(() => {
        // 1. FORÇA O CARREGAMENTO INICIAL IMEDIATO ASSIM QUE A TELA ABRE
        if (actor?.system?.pockets) {
            pockets = foundry.utils.deepClone(actor.system.pockets);
        }

        const hookActor = Hooks.on("updateActor", (updatedActor) => {
            if (updatedActor.id === actor.id) {
                // 2. SINCRONIA EM TEMPO REAL SE MUDAR POR FORA
                if (updatedActor.system?.pockets) {
                    pockets = foundry.utils.deepClone(updatedActor.system.pockets);
                }
                flags = updatedActor.flags?.[MODULE_ID] || {};
            }
        });

        return () => {
            Hooks.off("updateActor", hookActor);
        };
    });

    async function savePockets() {
        await actor.update({ "system.pockets": pockets }, { render: false });
    }

    function pocketAdjust(type, tier, amt) {
        if (!pockets[type]) pockets[type] = {};
        
        let newPockets = { ...pockets };
        newPockets[type][tier] = Math.max(0, (newPockets[type][tier] || 0) + amt);
        
        pockets = newPockets; // Atualiza a interface do jogador instantaneamente
        savePockets();        // Salva silenciosamente no banco de dados
    }

    // =======================================================
    // FUNÇÕES DE ATUALIZAÇÃO BLINDADAS (Sem Tela Preta)
    // =======================================================
// =======================================================
    // FUNÇÕES DE ATUALIZAÇÃO BLINDADAS (Sem Tela Preta)
    // =======================================================
    async function updateFlag(key, value) {
        // 1. Atualiza a flag localmente primeiro
        flags[key] = value; 
        // 2. Força o Svelte a reagir e desenhar a tela instantaneamente
        flags = flags;      
        
        // 3. Salva no banco de dados do Foundry silenciosamente
        await actor.update({ [`flags.${MODULE_ID}.${key}`]: value }, { render: false });
    }

    function adjustVital(vital, amount) {
        if (vital === 'hunger') {
            updateFlag('surv_hunger', Math.max(-10, Math.min(10, hunger + amount)));
        } else if (vital === 'thirst') {
            updateFlag('surv_thirst', Math.max(-10, Math.min(10, thirst + amount)));
        } else if (vital === 'exhaustion') {
            updateFlag('surv_exhaustion', Math.max(0, exhaustion + amount));
        }
    }

    function adjustSkill(skillKey, amount) {
        const current = survSkills[skillKey] || 0;
        const newVal = Math.max(0, current + amount);
        
        if (amount > 0 && availableSkillPoints <= 0) {
            return ui.notifications.warn("Pontos de Sobrevivência Insuficientes!");
        }

        let newSkills = { ...survSkills };
        newSkills[skillKey] = newVal;
        updateFlag('surv_skills', newSkills);
    }

    // Ações Narrativas
    function actionNormal() {
        adjustVital('hunger', -1);
        adjustVital('thirst', -1);
        ChatMessage.create({ content: `<div style="background:#050505; border:1px solid var(--c-primary); color:#ccc; padding:10px; font-family:monospace;">🎲 <b>${actor.name}</b> realizou uma <b>Ação Normal</b>.<br><small style="color:#ff3333">(-1 Fome, -1 Sede)</small></div>` });
    }

    function actionEffort() {
        adjustVital('exhaustion', 1);
        ChatMessage.create({ content: `<div style="background:#1a0505; border:1px solid #ff3333; color:#ccc; padding:10px; font-family:monospace;">😤 <b>${actor.name}</b> realizou um <b>Esforço Físico</b>.<br><small style="color:#ff3333">(+1 Exaustão)</small></div>` });
    }

    // Modal de Consumo (Organismos)
    async function consumeOrganism(tier, mode) {
        if (!pockets.ORGANISMO) pockets.ORGANISMO = {};
        const currentQty = pockets.ORGANISMO[tier] || 0;
        
        if (currentQty <= 0) return ui.notifications.warn("Sem estoque deste suprimento.");

        // Atualiza Inventário
        let newPockets = { ...pockets };
        newPockets.ORGANISMO[tier]--; 
        pockets = newPockets; 
        await savePockets(); 

        const foodVal = tier;
        const waterVal = tier * 2;
        let msg = "";
        
        if (mode === 'EAT') {
            adjustVital('hunger', foodVal);
            msg = `🍖 <b>${actor.name}</b> consumiu Biomassa T${tier} <span style="color:#00ff41">(+${foodVal} Fome)</span>.`;
        } else {
            adjustVital('thirst', waterVal);
            msg = `💧 <b>${actor.name}</b> purificou fluidos T${tier} <span style="color:#00aaff">(+${waterVal} Sede)</span>.`;
        }

        ChatMessage.create({ content: `<div style="background:#050505; border:1px solid #555; color:#ccc; padding:10px; font-family:monospace;">${msg}</div>` });
        if(pockets.ORGANISMO[tier] <= 0) showConsumeModal = false;
    }

    // Adicionar/Remover Recursos
function addMaterial() {
        const newMat = { id: foundry.utils.randomID(), name: "Novo Recurso", qty: 1, desc: "" };
        updateFlag('surv_materials_list', [...materialsList, newMat]);
    }
    function removeMaterial(id) {
        updateFlag('surv_materials_list', materialsList.filter(m => m.id !== id));
    }
    function updateMaterial(index, field, value) {
        let newMats = [...materialsList];
        newMats[index][field] = value;
        updateFlag('surv_materials_list', newMats);
    }
</script>

<div class="ark-survival-app" style="{cssVariables}; --c-primary: {themeColor || '#00ff41'};">
    
    <header class="hud-panel sanity-module">
        <div class="hud-title"><i class="fas fa-brain"></i> ÍNDICE DE SANIDADE (WP)</div>
        <div class="sanity-controls">
            <div class="input-hud">
                <label>ATUAL</label>
                <input type="number" value={sanityCurr} on:change={(e) => updateFlag('surv_sanity_curr', Number(e.target.value))}>
            </div>
            <span class="divider">/</span>
            <div class="input-hud">
                <label>MÁXIMA</label>
                <input type="number" value={sanityMax} on:change={(e) => updateFlag('surv_sanity_max', Number(e.target.value))}>
            </div>
            <button class="btn-sync" title="Resetar p/ Perfil" on:click={() => {updateFlag('surv_sanity_max', profileMaxWill); updateFlag('surv_sanity_curr', profileCurrWill);}}>
                <i class="fas fa-sync"></i>
            </button>
        </div>
    </header>

    <div class="main-split">
        
        <div class="column vitals-col">
            <div class="hud-panel">
                <div class="hud-title"><i class="fas fa-heartbeat"></i> SINAIS VITAIS</div>
                
                <div class="vital-bar-container">
                    <div class="vital-header">
                        <span>ESTADO NUTRICIONAL (FOME)</span>
                        <span class="vital-val" class:danger={hunger < 0}>{hunger}</span>
                    </div>
                    <div class="bar-bg">
                        <div class="bar-fill" style="width: {((hunger + 10) / 20) * 100}%; background: {hunger < 0 ? '#ff3333' : 'var(--c-primary)'}"></div>
                    </div>
                    <div class="vital-controls">
                        <button class="adj-btn" on:click={() => adjustVital('hunger', -1)}>-</button>
                        <input type="number" class="manual-input" value={hunger} on:change={(e) => updateFlag('surv_hunger', Number(e.target.value))}>
                        <button class="adj-btn" on:click={() => adjustVital('hunger', 1)}>+</button>
                    </div>
                </div>

                <div class="vital-bar-container">
                    <div class="vital-header">
                        <span>HIDRATAÇÃO (SEDE)</span>
                        <span class="vital-val" class:danger={thirst < 0}>{thirst}</span>
                    </div>
                    <div class="bar-bg">
                        <div class="bar-fill" style="width: {((thirst + 10) / 20) * 100}%; background: {thirst < 0 ? '#ff3333' : '#00aaff'}"></div>
                    </div>
                    <div class="vital-controls">
                        <button class="adj-btn" on:click={() => adjustVital('thirst', -1)}>-</button>
                        <input type="number" class="manual-input" value={thirst} on:change={(e) => updateFlag('surv_thirst', Number(e.target.value))}>
                        <button class="adj-btn" on:click={() => adjustVital('thirst', 1)}>+</button>
                    </div>
                </div>

<div class="actions-grid">
                    <button class="action-btn" on:click={actionNormal} title="Ações normais consomem 1 de fome e sede naturalmente, sendo requisitado pelo mestre esse gasto, além da perca padrão de fome e sede ao longo do tempo. Isso é consumido em Ações de sobrevivência.">
                        <i class="fas fa-dice"></i> AÇÃO NORMAL
                    </button>
                    <button class="action-btn consume" on:click={() => showConsumeModal = true}>
                        <i class="fas fa-utensils"></i> CONSUMIR
                    </button>
                </div>

                <div class="exhaustion-container">
                    <div class="ex-header">
                        <i class="fas fa-lungs"></i> EXAUSTÃO
                        <div class="ex-adj">
                            <button on:click={() => adjustVital('exhaustion', -1)}>-</button>
                            <input type="number" value={exhaustion} on:change={(e) => updateFlag('surv_exhaustion', Number(e.target.value))}>
                            <button on:click={() => adjustVital('exhaustion', 1)}>+</button>
                        </div>
                    </div>
                    <div class="ex-penalty" class:active={exhaustion > 0}>
                        PENALIDADE GLOBAL NAS ROLAGENS: <strong>-{exhaustion}</strong>
                    </div>
<div style="font-size: 9px; color: #aaa; text-align: center; margin-bottom: 5px; line-height: 1.2; padding: 0 10px;">
                        Você recebe 1 de Exaustão, em troca de +1 WD em uma rolagem do sistema de sobrevivência.
                    </div>
                    <button class="action-btn alert" on:click={actionEffort} style="margin-top: 0;">
                        <i class="fas fa-fire"></i> ESFORÇO (+1 Exaustão)
                    </button>
                </div>
            </div>

            <div class="hud-panel">
                <div class="hud-title" style="display: flex; justify-content: space-between;">
<span style="display: flex; align-items: center; gap: 8px;">
    <i class="fas fa-dna"></i> GENÉTICA (NVL 
    <input type="number" class="manual-input" style="width:30px; height:20px; font-size:12px;" value={activeLevel} on:change={(e) => updateFlag('surv_level', Number(e.target.value))}>)
</span>
                    <span style="color: {availableSkillPoints < 0 ? '#ff3333' : 'var(--c-primary)'};">PONTOS: {availableSkillPoints} / {totalSurvivalPoints}</span>
                </div>
                <div class="skills-list custom-scroll">
                    {#each Object.keys(survSkills) as skill}
                        <div class="skill-row">
                            <span class="skill-name">{skill.replace('_', ' ').toUpperCase()}</span>
                            <div class="skill-stepper">
                                <button on:click={() => adjustSkill(skill, -1)}>-</button>
                                <span class="skill-val">{survSkills[skill]}</span>
                                <button on:click={() => adjustSkill(skill, 1)}>+</button>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </div>

<div class="column inv-col">
            
            <div class="hud-panel" style="padding-bottom: 5px;">
                <div class="hud-title"><i class="fas fa-box"></i> ARMAZENAMENTO CORE</div>
                <div class="inv-header-row">
                    <div class="col-type">RECURSO</div>
                    {#each Object.values(RARITY_MAP) as r}
                        <div class="col-rarity" style="color: {r.color}">{r.label}</div>
                    {/each}
                </div>
                {#each ['MATERIA', 'ORGANISMO', 'ENERGIA', 'NUCLEO'] as type}
                    <div class="inv-row">
                        <div class="type-name">{type}</div>
                        {#each [1, 2, 3, 4, 5, 6] as tier}
                            <div class="inv-slot" 
                                 class:has-item={(pockets?.[type]?.[tier] || 0) > 0}
                                 on:click={() => pocketAdjust(type, tier, 1)}
                                 on:contextmenu|preventDefault={() => pocketAdjust(type, tier, -1)}>
                                {pockets?.[type]?.[tier] || 0}
                            </div>
                        {/each}
                    </div>
                {/each}
            </div>

            <div class="hud-panel" style="flex: 1; display: flex; flex-direction: column;">
                <div class="hud-title" style="display: flex; justify-content: space-between; align-items: center;">
                    <span><i class="fas fa-briefcase"></i> MATERIAIS COLETADOS</span>
                    <button class="btn-add-mat" on:click={addMaterial}>+ ADICIONAR</button>
                </div>
                
               <div class="materials-list custom-scroll">
                    {#each materialsList as mat, i (mat.id)}
                        <div class="mat-row-new" transition:slide|local>
                            <div class="mat-top">
                                <input type="text" class="mat-name-new" value={mat.name} on:change={(e) => updateMaterial(i, 'name', e.target.value)} placeholder="Nome do Material..." />
                                <div class="mat-qty-box">
                                    <span>QTD:</span>
                                    <input type="number" class="mat-qty-new" value={mat.qty} on:change={(e) => updateMaterial(i, 'qty', Number(e.target.value))} min="0" />
                                </div>
                                <button class="btn-del-mat-new" on:click={() => removeMaterial(mat.id)} title="Apagar Material"><i class="fas fa-trash"></i></button>
                            </div>
                            <textarea class="mat-desc-new custom-scroll" value={mat.desc || ""} on:change={(e) => updateMaterial(i, 'desc', e.target.value)} placeholder="Descrição detalhada do item... (Pressione Enter para quebrar linha)"></textarea>
                        </div>
                    {/each}
                    {#if materialsList.length === 0}
                        <div class="empty-state">Nenhum recurso extra catalogado.</div>
                    {/if}
                </div>
            </div>

            <div class="text-editor-container mini">
                <div class="editor-header">
                    <span class="editor-label"><i class="fas fa-terminal"></i> DIÁRIO DE SOBREVIVÊNCIA</span>
                    <button class="btn-expand-notes" on:click={openNotes} title="Expandir Tela"><i class="fas fa-expand"></i></button>
                </div>
                <textarea 
                    class="cyber-textarea custom-scroll" 
                    value={survivalNotes} 
                    on:change={(e)=>updateFlag('surv_notes', e.target.value)} 
                    placeholder="Anotações sobre materiais, blueprints, rotas..."
                ></textarea>
            </div>
        </div>
    </div>

    {#if showConsumeModal}
        <div class="modal-overlay" transition:fade={{duration:150}}>
            <div class="modal-window" transition:scale>
                <div class="modal-header">
                    <span><i class="fas fa-utensils"></i> CONSUMIR ORGANISMO</span>
                    <button class="close-btn" on:click={() => showConsumeModal = false}><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body custom-scroll">
                    <p style="font-size: 11px; color:#aaa; margin-bottom: 10px;">O consumo biológico restaura Fome (igual ao Tier) ou Sede (Dobro do Tier).</p>
                    <div class="consumables-list">
                        {#each [1,2,3,4,5,6] as t}
                            {@const qty = pockets?.ORGANISMO?.[t] || 0}
                            <div class="consumable-item" class:disabled={qty <= 0}>
                                <div class="c-info">
                                    <span class="badge" style="background:{RARITY_MAP[t].color}">T{t}</span>
                                    <span class="qty-txt">Estoque: {qty}</span>
                                </div>
                                <div class="c-actions">
                                    <button on:click={() => consumeOrganism(t, 'EAT')}>Comer (+{t})</button>
                                    <button class="drink" on:click={() => consumeOrganism(t, 'DRINK')}>Beber (+{t*2})</button>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    {/if}

    {#if notesExpanded}
        <div class="notes-overlay" transition:fade={{duration: 150}} on:click={closeNotes}>
            <div class="notes-modal" on:click|stopPropagation>
                <div class="editor-header modal-header">
                    <span class="editor-label"><i class="fas fa-terminal"></i> DIÁRIO DE SOBREVIVÊNCIA (TELA CHEIA)</span>
                    <button class="btn-expand-notes" on:click={closeNotes} title="Minimizar"><i class="fas fa-compress"></i></button>
                </div>
                <textarea 
                    class="cyber-textarea expanded custom-scroll"
                    style="flex: 1; resize: none; font-size: 15px; padding: 25px; white-space: pre-wrap;"
                    value={survivalNotes} 
                    on:change={(e)=>updateFlag('surv_notes', e.target.value)} 
                    placeholder="Área livre para o diário do sobrevivente..."></textarea>
                <button class="btn-concluido" on:click={closeNotes}>CONCLUÍDO</button>
            </div>
        </div>
    {/if}

</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

    /* =========================================================================
       ESTÉTICA TERMINAL ARK (SURVIVAL TECH)
       ========================================================================= */
    .ark-survival-app {
        height: 100%; display: flex; flex-direction: column; gap: 15px;
        background: #050508;
        background-image: 
            radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(rgba(0, 212, 255, 0.02) 1px, transparent 1px);
        background-size: 20px 20px, 100% 4px;
        color: #ccc; font-family: var(--font-body, 'Segoe UI', sans-serif);
        padding: 15px; overflow: hidden;
    }

    .custom-scroll::-webkit-scrollbar { width: 4px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: var(--c-primary); border-radius: 4px; }

    /* PAINÉIS HUD */
    .hud-panel {
        background: rgba(5, 5, 10, 0.85); border: 1px solid #222;
        border-top: 2px solid var(--c-primary); border-radius: 4px;
        padding: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.5);
    }
    .hud-title {
        font-family: 'Share Tech Mono', monospace; color: var(--c-primary);
        font-size: 14px; font-weight: bold; letter-spacing: 2px;
        margin-bottom: 15px; border-bottom: 1px dashed #333; padding-bottom: 5px;
    }

    /* MÓDULO SANIDADE */
    .sanity-module { display: flex; justify-content: space-between; align-items: center; padding: 10px 20px; }
    .sanity-module .hud-title { margin: 0; border: none; padding: 0; font-size: 16px; }
    .sanity-controls { display: flex; align-items: center; gap: 15px; }
    .input-hud { display: flex; flex-direction: column; align-items: center; }
    .input-hud label { font-size: 9px; color: #666; font-weight: bold; letter-spacing: 1px; }
    .input-hud input { background: #000; border: 1px solid var(--c-primary); color: #fff; text-align: center; width: 60px; padding: 5px; font-size: 16px; font-weight: bold; font-family: 'Share Tech Mono'; border-radius: 4px; box-shadow: 0 0 10px rgba(0,212,255,0.1); }
    .divider { font-size: 24px; color: #444; font-weight: 100; }
    .btn-sync { background: transparent; border: 1px solid #555; color: #888; width: 30px; height: 30px; border-radius: 4px; cursor: pointer; transition: 0.2s;}
    .btn-sync:hover { border-color: var(--c-primary); color: var(--c-primary); }

    /* LAYOUT DE COLUNAS */
    .main-split { display: flex; gap: 15px; flex: 1; overflow: hidden; }
    .column { display: flex; flex-direction: column; gap: 15px; overflow-y: auto; padding-right: 5px;}
    .vitals-col { flex: 1.2; }
    .inv-col { flex: 1; }

    /* VITAIS (BARRAS) */
    .vital-bar-container { margin-bottom: 15px; background: rgba(0,0,0,0.4); padding: 10px; border-radius: 4px; border: 1px solid #111; }
    .vital-header { display: flex; justify-content: space-between; font-family: 'Share Tech Mono'; font-weight: bold; font-size: 11px; margin-bottom: 5px; color: #aaa; letter-spacing: 1px;}
    .vital-val { color: var(--c-primary); font-size: 14px; }
    .vital-val.danger { color: #ff3333; animation: blink 1s infinite; }
    
    .bar-bg { width: 100%; height: 8px; background: #050505; border-radius: 4px; overflow: hidden; border: 1px solid #333; margin-bottom: 10px;}
    .bar-fill { height: 100%; transition: width 0.3s ease, background-color 0.3s ease; box-shadow: 0 0 8px currentColor;}

    .vital-controls { display: flex; justify-content: flex-end; align-items: center; gap: 5px; }
    .adj-btn { background: #111; border: 1px solid #444; color: #fff; width: 24px; height: 24px; cursor: pointer; border-radius: 4px; font-weight: bold; transition: 0.2s;}
    .adj-btn:hover { background: var(--c-primary); color: #000; border-color: var(--c-primary); }
    .manual-input { width: 40px; background: #000; border: 1px solid #333; color: #fff; text-align: center; font-family: 'Share Tech Mono'; border-radius: 4px; font-size: 12px; padding: 3px;}

    /* AÇÕES */
    .actions-grid { display: flex; gap: 10px; margin-bottom: 15px; }
    .action-btn { flex: 1; padding: 10px; background: #050505; color: #fff; border: 1px solid #444; font-family: 'Share Tech Mono'; font-weight: bold; cursor: pointer; border-radius: 4px; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;}
    .action-btn:hover { background: #222; border-color: var(--c-primary); color: var(--c-primary); }
    .action-btn.consume { background: rgba(0,212,255,0.05); border-color: #00aaff; color: #00aaff; }
    .action-btn.consume:hover { background: #00aaff; color: #000; box-shadow: 0 0 10px #00aaff; }
    
    .action-btn.alert { width: 100%; background: rgba(255,51,51,0.05); color: #ff3333; border-color: #ff3333; margin-top: 10px;}
    .action-btn.alert:hover { background: #ff3333; color: #000; box-shadow: 0 0 10px #ff3333; }

    /* EXAUSTÃO */
    .exhaustion-container { border-top: 1px dashed #333; padding-top: 15px; }
    .ex-header { display: flex; justify-content: space-between; align-items: center; font-family: 'Share Tech Mono'; color: #ffaa00; font-size: 14px; margin-bottom: 10px; font-weight: bold;}
    .ex-adj { display: flex; align-items: center; gap: 5px; }
    .ex-adj button { width: 24px; height: 24px; background: #111; border: 1px solid #444; color: #fff; cursor: pointer; border-radius: 4px;}
    .ex-adj input { width: 40px; background: #000; border: 1px solid #ffaa00; color: #fff; text-align: center; font-family: 'Share Tech Mono'; border-radius: 4px;}
    .ex-penalty { font-size: 11px; color: #555; background: #050505; padding: 8px; text-align: center; border-radius: 4px; border: 1px solid #222; margin-bottom: 10px; font-weight: bold; }
    .ex-penalty.active { color: #ff3333; border-color: #ff3333; background: rgba(255,51,51,0.1); animation: blink 2s infinite; }

    /* CAPACIDADES (SKILLS) */
    .skills-list { display: flex; flex-direction: column; gap: 8px; }
    .skill-row { display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); padding: 8px 12px; border: 1px solid #222; border-radius: 4px; transition: 0.2s; }
    .skill-row:hover { border-color: var(--c-primary); background: rgba(0,212,255,0.05); }
    .skill-name { font-family: 'Share Tech Mono'; font-size: 13px; color: #ccc; font-weight: bold; letter-spacing: 1px;}
    .skill-stepper { display: flex; align-items: center; gap: 8px; }
    .skill-stepper button { width: 24px; height: 24px; background: #000; border: 1px solid #444; color: #fff; cursor: pointer; border-radius: 4px;}
    .skill-stepper button:hover { background: var(--c-primary); color: #000; }
    .skill-val { font-weight: bold; color: var(--c-primary); width: 20px; text-align: center; font-size: 16px;}

    /* POCKETS (INVENTÁRIO) */
    .inv-header-row { display: grid; grid-template-columns: 2fr repeat(6, 1fr); gap: 2px; text-align: center; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 5px; font-size: 10px; margin-bottom: 5px;}
    .inv-row { display: grid; grid-template-columns: 2fr repeat(6, 1fr); gap: 4px; align-items: center; background: rgba(0,0,0,0.3); margin-bottom: 4px; padding: 2px;}
    .type-name { padding-left: 5px; color: #888; font-size: 10px; font-weight: bold;}
    .inv-slot { background: #050505; text-align: center; padding: 5px 0; border: 1px solid #222; color: #444; cursor: pointer; border-radius: 2px; font-family: 'Share Tech Mono'; font-size: 12px;}
    .inv-slot.has-item { color: #fff; border-color: #555; background: #151515; font-weight: bold; }
    .inv-slot:hover { border-color: var(--c-primary); color: var(--c-primary); }

    /* MATERIAIS ADICIONAIS */
/* =========================================
       NOVO LAYOUT DE MATERIAIS
       ========================================= */
    .mat-row-new { background: rgba(0,0,0,0.4); border: 1px solid #333; border-radius: 4px; padding: 8px; display: flex; flex-direction: column; gap: 5px; position: relative; padding-right: 35px; }
    .mat-top { display: flex; gap: 10px; align-items: center; }
    .mat-name-new { flex: 1; background: transparent; border: none; border-bottom: 1px dashed #555; color: var(--c-primary); font-size: 13px; font-weight: bold; outline: none; font-family: 'Share Tech Mono'; padding-bottom: 2px;}
    .mat-name-new:focus { border-color: var(--c-primary); }
    .mat-qty-box { display: flex; align-items: center; gap: 4px; background: #000; border: 1px solid #444; padding: 2px 6px; border-radius: 4px; }
    .mat-qty-box span { font-size: 9px; color: #888; font-weight: bold; }
    .mat-qty-new { width: 35px; background: transparent; border: none; color: #fff; font-size: 12px; font-weight: bold; text-align: center; outline: none; }
    
.mat-desc-new { 
        background: rgba(0,0,0,0.5); 
        border: 1px solid #222; 
        color: #ccc; 
        font-size: 11px; 
        padding: 8px 10px; 
        border-radius: 4px; 
        outline: none; 
        font-family: var(--font-body, sans-serif); 
        width: 100%; 
        box-sizing: border-box;
        min-height: 60px; /* Garante espaço para umas 3 linhas direto */
        resize: vertical; /* Permite que o jogador estique a caixa para baixo se quiser escrever um livro */
        line-height: 1.5; /* Deixa o texto respirar */
        white-space: pre-wrap; /* Garante que os 'Enters' funcionem perfeitamente */
        transition: border-color 0.2s, background 0.2s;
    }
    .mat-desc-new:focus { 
        border-color: var(--c-primary); /* Brilha com a cor do tema do jogador */
        color: #fff;
        background: rgba(0,0,0,0.8); /* Fica mais escuro no fundo pra dar contraste na leitura */
        box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
    }
    
.btn-del-mat-new { 
    background: transparent; 
    border: none; 
    color: #555; 
    cursor: pointer; 
    font-size: 11px; /* Tamanho exato do ícone */
    transition: 0.2s; 
    padding: 0; 
    margin-left: 5px; 
    
    /* Trava de Tamanho */
    flex: none; /* Proíbe o botão de esticar no Flexbox */
    width: 24px; /* Largura fixa bem pequena */
    height: 24px; /* Altura fixa bem pequena */
    
    /* Centraliza o ícone dentro desse quadradinho */
    display: flex; 
    align-items: center;
    justify-content: center; 
    
    opacity: 0.6; 
}
.btn-del-mat-new:hover { 
    color: #ff3333; 
    opacity: 1; 
}

    /* NOTAS RÁPIDAS E MODAL */
    .text-editor-container { background: rgba(0, 0, 0, 0.6); border: 1px solid #222; border-radius: 4px; display: flex; flex-direction: column; overflow: hidden; box-shadow: inset 0 0 10px rgba(0,0,0,0.5); margin-top: 10px;}
    .text-editor-container.mini { min-height: 150px; flex-shrink: 0;}
    .editor-header { display: flex; justify-content: space-between; align-items: center; background: rgba(0, 212, 255, 0.05); padding: 8px 12px; border-bottom: 1px solid rgba(0, 212, 255, 0.3); }
    .editor-label { font-size: 11px; color: var(--c-primary); font-weight: bold; letter-spacing: 1px; font-family: 'Share Tech Mono'; display: flex; align-items: center; gap: 8px; }
    .btn-expand-notes { background: transparent; border: none; color: var(--c-primary); cursor: pointer; transition: 0.2s; }
    .btn-expand-notes:hover { color: #fff; transform: scale(1.1); }
    .cyber-textarea { flex: 1; background: transparent; border: none; color: #ccc; padding: 10px; resize: none; font-family: 'Share Tech Mono', monospace; font-size: 12px; line-height: 1.5; outline: none; }
    
    .notes-overlay { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.85); z-index: 1000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
    .notes-modal { width: 90%; max-width: 800px; height: 80%; background: #08080a; border: 1px solid var(--c-primary); border-radius: 4px; display: flex; flex-direction: column; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.9); overflow: hidden; }
    .btn-concluido { margin: 15px; padding: 12px; background: #111; color: var(--c-primary); border: 1px solid var(--c-primary); font-weight: bold; cursor: pointer; border-radius: 4px; font-family: 'Share Tech Mono'; transition: 0.2s; flex: none; }
    .btn-concluido:hover { background: var(--c-primary); color: #000; box-shadow: 0 0 15px var(--c-primary); }

    /* MODAL DE CONSUMO */
    .modal-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.8); z-index: 50; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px); }
    .modal-window { width: 350px; background: #050505; border: 1px solid var(--c-primary); box-shadow: 0 0 20px rgba(0,0,0,0.8); display: flex; flex-direction: column; border-radius: 4px;}
    .modal-header { background: #001100; padding: 10px 15px; border-bottom: 1px solid var(--c-primary); display: flex; justify-content: space-between; font-weight: bold; color: var(--c-primary); font-family: 'Share Tech Mono';}
    .modal-header .close-btn { background: transparent; border: none; color: var(--c-primary); cursor: pointer; }
    .modal-body { padding: 15px; display: flex; flex-direction: column; gap: 10px; }
    .consumables-list { max-height: 250px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 5px;}
    .consumable-item { display: flex; align-items: center; justify-content: space-between; background: #111; padding: 8px; border: 1px solid #333; border-radius: 4px;}
    .consumable-item.disabled { opacity: 0.3; pointer-events: none; filter: grayscale(1); }
    .c-info { display: flex; align-items: center; gap: 10px; }
    .badge { padding: 2px 6px; color: #000; font-weight: bold; border-radius: 2px; font-size: 11px; font-family: 'Share Tech Mono';}
    .qty-txt { font-size: 11px; color: #ccc; font-weight: bold;}
    .c-actions { display: flex; gap: 5px; }
    .c-actions button { font-size: 10px; cursor: pointer; background: #222; color: #fff; border: 1px solid #444; padding: 4px 8px; border-radius: 2px; font-family: 'Share Tech Mono'; font-weight: bold;}
    .c-actions button:hover { border-color: #00ff41; color: #00ff41;}
    .c-actions button.drink:hover { border-color: #00aaff; color: #00aaff;}

    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>