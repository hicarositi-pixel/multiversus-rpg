<script>
    import { onMount } from 'svelte';
    import { slide, fade } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';

    export let actor;
    export let flags = {}; 
    export let themeColor = "#00ff41";

    const MODULE_ID = "multiversus-rpg";
    const isGM = game.user.isGM;

    // --- CONFIGURAÇÃO DE CUSTOS ---
    const STAT_COSTS = { normal: 5 }; // Hard e Wiggle base não existem mais
    const SKILL_COSTS = { normal: 2 };
    const BASE_POINTS_CAP = 150;

    const ATTR_CONFIG = {
        body: { label: "CORPO", icon: "fa-fist-raised" },
        coordination: { label: "COORDENAÇÃO", icon: "fa-running" },
        sense: { label: "SENTIDOS", icon: "fa-eye" },
        mind: { label: "MENTE", icon: "fa-brain" },
        charm: { label: "CHARME", icon: "fa-comments" },
        command: { label: "COMANDO", icon: "fa-crown" }
    };
    const statKeys = Object.keys(ATTR_CONFIG);

    const DEFAULT_SKILLS = {
        body: [
            {name: "Atletismo", normal: 0, img: ""}, {name: "Briga", normal: 0, img: ""},
            {name: "Resistência", normal: 0, img: ""}, {name: "Bloqueio", normal: 0, img: ""},
            {name: "Arma Corpo a Corpo", normal: 0, img: ""}
        ],
        coordination: [
            {name: "Esquiva", normal: 0, img: ""}, {name: "Furtividade", normal: 0, img: ""},
            {name: "Acrobacias", normal: 0, img: ""}, {name: "Prestidigitação", normal: 0, img: ""},
            {name: "Pilotagem", normal: 0, img: ""}, {name: "Arma a Distância", normal: 0, img: ""}
        ],
        sense: [
            {name: "Empatia", normal: 0, img: ""}, {name: "Percepção", normal: 0, img: ""},
            {name: "Intuição", normal: 0, img: ""}, {name: "Procura", normal: 0, img: ""}
        ],
        mind: [
            {name: "Primeiros Socorros", normal: 0, img: ""}, {name: "Conhecimento", normal: 0, img: ""},
            {name: "Cultura", normal: 0, img: ""}, {name: "Linguagem", normal: 0, img: ""},
            {name: "Medicina", normal: 0, img: ""}, {name: "Navegação", normal: 0, img: ""},
            {name: "Investigar", normal: 0, img: ""}, {name: "Sobrevivência", normal: 0, img: ""},
            {name: "Tática", normal: 0, img: ""}
        ],
        charm: [
            {name: "Mentir", normal: 0, img: ""}, {name: "Persuasão", normal: 0, img: ""},
            {name: "Performance", normal: 0, img: ""}
        ],
        command: [
            {name: "Interrogar", normal: 0, img: ""}, {name: "Intimidar", normal: 0, img: ""},
            {name: "Liderar", normal: 0, img: ""}, {name: "Estabilidade", normal: 0, img: ""}
        ]
    };

    function getSkillIcon(name) {
        const lower = name.toLowerCase();
        if (lower.includes("arma") || lower.includes("briga")) return "fa-gavel";
        if (lower.includes("esquiva") || lower.includes("atletismo")) return "fa-wind";
        if (lower.includes("conhecimento") || lower.includes("medicina")) return "fa-book-medical";
        if (lower.includes("percepção") || lower.includes("procura")) return "fa-search";
        if (lower.includes("mentir") || lower.includes("persuasão")) return "fa-theater-masks";
        return "fa-dice-d20";
    }

    // --- ESTADO LOCAL E TRAVAS ---
    let stats = flags.stats || {};
    let skills = flags.skills || {};
    let expandedStats = {}; 
    let localCost = flags.statsCost || 0;
    
    $: isLocked = flags.isStatsLocked || false;
    $: canEdit = isGM || !isLocked;

    let iconModalOpen = false;
    let iconEditTarget = { key: null, index: null };
    let tempIconUrl = "";

    // Estado visual do Hyper (Quem está com a gaveta de edição aberta)
    let editingHyper = {}; 

    // --- DADOS REATIVOS (Sincronia Exata com Profile) ---
    $: xpEarned = flags.xp || 0; 
    $: gmMode = flags.gmOverride || false;
    $: customPoints = flags.customPoints || BASE_POINTS_CAP;
    
    $: totalPointsCap = gmMode ? customPoints : (BASE_POINTS_CAP + xpEarned);
    
    $: powersCost = flags.powersSpent || 0; 
    $: bioCost = flags.bioSpent || 0;
    $: willCost = flags.willSpent || 0;
    $: totalSpent = localCost + powersCost + bioCost + willCost;
    
    $: pointsAvailable = totalPointsCap - totalSpent;

    // --- INICIALIZAÇÃO E MIGRAÇÃO ---
    function initData() {
        let didMigrate = false;

        statKeys.forEach(key => {
            if (!stats[key]) stats[key] = { normal: 1 };
            
            // Reembolsa Hard e Wiggle base antigos
            if (stats[key].hard > 0 || stats[key].wiggle > 0) {
                stats[key].hard = 0; stats[key].wiggle = 0; didMigrate = true;
            }
            if (stats[key].h_normal === undefined) {
                stats[key].h_normal = 0; stats[key].h_hard = 0; stats[key].h_wiggle = 0; didMigrate = true;
            }

            if (!skills[key]) skills[key] = JSON.parse(JSON.stringify(DEFAULT_SKILLS[key] || []));
            
            skills[key].forEach(sk => {
                if (sk.hard > 0 || sk.wiggle > 0) { sk.hard = 0; sk.wiggle = 0; didMigrate = true; }
                if (sk.h_normal === undefined) {
                    sk.h_normal = 0; sk.h_hard = 0; sk.h_wiggle = 0; didMigrate = true;
                }
            });

            if (expandedStats[key] === undefined) expandedStats[key] = false;
        });
        
        recalcCost();
        if (didMigrate) saveToServer(); 
    }

    // --- CÁLCULO DE CUSTO (SOMENTE DADOS BASE) ---
    function recalcCost() {
        let total = 0;
        statKeys.forEach(key => {
            if (!stats[key]) return;
            // Somente o que passa de 1 custa XP
            total += Math.max(0, stats[key].normal - 1) * STAT_COSTS.normal;

            if (skills[key]) {
                skills[key].forEach(sk => {
                    total += (sk.normal || 0) * SKILL_COSTS.normal;
                });
            }
        });
        localCost = total; 
    }

    async function saveToServer() {
        await actor.update({
            [`flags.${MODULE_ID}.stats`]: stats,
            [`flags.${MODULE_ID}.skills`]: skills,
            [`flags.${MODULE_ID}.statsCost`]: localCost
        }, { render: false });
    }

    // --- AÇÕES: ADD/SUB E LOCK ---
    async function toggleLock() {
        if (isLocked && !isGM) return; 
        
        if (!isLocked && !isGM) {
            const confirmed = await Dialog.confirm({
                title: "Protocolo de Segurança",
                content: "<p>Deseja travar sua Matriz de Atributos? Após confirmar, você <b>não poderá alterar seus dados normais</b> até que o Mestre libere o acesso novamente.</p>",
                yes: () => true, no: () => false, defaultYes: false
            });
            if (!confirmed) return;
        }

        await actor.update({ [`flags.${MODULE_ID}.isStatsLocked`]: !isLocked });
    }

    function toggleHyperDrawer(id) {
        editingHyper[id] = !editingHyper[id];
        editingHyper = editingHyper; // Força reatividade Svelte
    }

    function changeDie(obj, field, delta, isBase, isStat) {
        if (!canEdit) return;

        const current = obj[field] || 0;
        
        // Regras de limite
        let min = 0;
        if (field === 'normal' && isStat && isBase) min = 1; // Atributo base não zera
        
        let max = 99; // Hyper não tem limite
        if (isBase) max = 5; // Dados normais base limitados a 5

        const newVal = current + delta;
        if (newVal < min || newVal > max) return;

        // Regra de Custo (Hyper ignora, Base cobra)
        if (isBase && delta > 0 && !isGM) {
            const cost = isStat ? STAT_COSTS.normal : SKILL_COSTS.normal;
            if (pointsAvailable < cost) {
                ui.notifications.warn(`Energia Insuficiente. Requer ${cost} XP.`);
                return;
            }
        }
        
        obj[field] = newVal;
        stats = stats; skills = skills;
        if (isBase) recalcCost();
        saveToServer();
    }

    function gmUpdate() {
        stats = stats; skills = skills;
        recalcCost(); saveToServer();
    }

    function addSkill(key) {
        skills[key] = [...skills[key], { name: "Nova Perícia", normal: 0, h_normal: 0, h_hard: 0, h_wiggle: 0, isCustom: true, img: "" }];
        expandedStats[key] = true;
        recalcCost(); saveToServer();
    }

    function removeSkill(key, idx) {
        skills[key].splice(idx, 1);
        skills[key] = skills[key];
        recalcCost(); saveToServer();
    }

    // --- ÍCONES ---
    function openIconEditor(key, idx) {
        iconEditTarget = { key, index: idx };
        tempIconUrl = skills[key][idx].img || "";
        iconModalOpen = true;
    }
    function saveIcon() {
        if (iconEditTarget.key) {
            skills[iconEditTarget.key][iconEditTarget.index].img = tempIconUrl;
            skills = skills; saveToServer();
        }
        iconModalOpen = false;
    }
    function openFilePicker() {
        new FilePicker({ type: "image", callback: (path) => { tempIconUrl = path; } }).render(true);
    }

    onMount(() => { initData(); });
</script>

<div class="app-container" style="--theme: {themeColor}">
    
    {#if iconModalOpen}
        <div class="modal-overlay" transition:fade>
            <div class="modal-box">
                <h3>ALTERAR ÍCONE</h3>
                <div class="input-row">
                    <input type="text" bind:value={tempIconUrl} placeholder="Cole a URL..." />
                    <button on:click={openFilePicker}><i class="fas fa-folder-open"></i></button>
                </div>
                <div class="modal-actions">
                    <button class="cancel" on:click={() => iconModalOpen = false}>CANCELAR</button>
                    <button class="save" on:click={saveIcon}>SALVAR</button>
                </div>
            </div>
        </div>
    {/if}

    <header class="xp-header">
        <div class="lock-zone">
            <button class="btn-lock" class:locked={isLocked} on:click={toggleLock} title={isLocked ? (isGM ? "Destravar (Mestre)" : "Travado pelo Sistema") : "Travar Gastos"}>
                <i class="fas {isLocked ? 'fa-lock' : 'fa-lock-open'}"></i>
                {isLocked ? 'MATRIZ TRAVADA' : 'TRAVAR MATRIZ (LOCK)'}
            </button>
        </div>
        <div class="xp-info">
            <div class="xp-col">
                <span class="lbl">PONTOS TOTAIS</span>
                <span class="val">{totalPointsCap}</span>
            </div>
            <div class="xp-sep"></div>
            <div class="xp-col">
                <span class="lbl">PONTOS DISPONÍVEIS</span>
                <span class="val highlight" class:debt={pointsAvailable < 0}>{pointsAvailable}</span>
            </div>
        </div>
        <div class="xp-bar-track">
            <div class="xp-fill" style="width: {Math.min(100, (totalSpent / totalPointsCap) * 100)}%"></div>
        </div>
    </header>

    <div class="scroll-area">
        {#each statKeys as key}
            {#if stats[key]}
                <div class="stat-block" class:open={expandedStats[key]}>
                    
                    <div class="stat-head" on:click={() => expandedStats[key] = !expandedStats[key]}>
                        <div class="head-title">
                            <div class="icon-box"><i class="fas {ATTR_CONFIG[key].icon}"></i></div>
                            <span class="label">{ATTR_CONFIG[key].label}</span>
                            <button class="btn-hyper" on:click|stopPropagation={() => toggleHyperDrawer(key)}>
                                <i class="fas fa-bolt"></i>
                            </button>
                        </div>

                        <div class="head-controls" on:click|stopPropagation>
                            
                            {#if !editingHyper[key] && (stats[key].h_normal > 0 || stats[key].h_hard > 0 || stats[key].h_wiggle > 0)}
                                <div class="hyper-summary">
                                    {#if stats[key].h_normal > 0}<span class="h-tag n">N+{stats[key].h_normal}</span>{/if}
                                    {#if stats[key].h_hard > 0}<span class="h-tag h">H+{stats[key].h_hard}</span>{/if}
                                    {#if stats[key].h_wiggle > 0}<span class="h-tag w">W+{stats[key].h_wiggle}</span>{/if}
                                </div>
                            {/if}

                            <div class="cyber-stepper base">
                                {#if canEdit && !isGM}<button on:click={() => changeDie(stats[key], 'normal', -1, true, true)}><i class="fas fa-minus"></i></button>{/if}
                                {#if isGM}
                                    <input type="number" class="gm-stepper-input" bind:value={stats[key].normal} on:change={gmUpdate}>
                                {:else}
                                    <span class="val">{stats[key].normal}</span>
                                {/if}
                                {#if canEdit && !isGM}<button on:click={() => changeDie(stats[key], 'normal', 1, true, true)}><i class="fas fa-plus"></i></button>{/if}
                            </div>
                        </div>
                        <i class="fas fa-chevron-down arrow" class:rot={expandedStats[key]}></i>
                    </div>

                    {#if editingHyper[key]}
                        <div class="hyper-drawer" transition:slide={{duration: 200}}>
                            <div class="drawer-bg">
                                <span class="drawer-title">MODIFICADORES HYPER (PODERES)</span>
                                <div class="hyper-controls-row">
                                    <div class="h-mod">
                                        <label><i class="fas fa-bolt"></i> NORMAL</label>
                                        <div class="cyber-stepper h-step n">
                                            {#if canEdit}<button on:click={() => changeDie(stats[key], 'h_normal', -1, false, true)}>-</button>{/if}
                                            <span class="val">{stats[key].h_normal}</span>
                                            {#if canEdit}<button on:click={() => changeDie(stats[key], 'h_normal', 1, false, true)}>+</button>{/if}
                                        </div>
                                    </div>
                                    <div class="h-mod">
                                        <label><i class="fas fa-square"></i> HARD</label>
                                        <div class="cyber-stepper h-step h">
                                            {#if canEdit}<button on:click={() => changeDie(stats[key], 'h_hard', -1, false, true)}>-</button>{/if}
                                            <span class="val">{stats[key].h_hard}</span>
                                            {#if canEdit}<button on:click={() => changeDie(stats[key], 'h_hard', 1, false, true)}>+</button>{/if}
                                        </div>
                                    </div>
                                    <div class="h-mod">
                                        <label><i class="fas fa-star"></i> WIGGLE</label>
                                        <div class="cyber-stepper h-step w">
                                            {#if canEdit}<button on:click={() => changeDie(stats[key], 'h_wiggle', -1, false, true)}>-</button>{/if}
                                            <span class="val">{stats[key].h_wiggle}</span>
                                            {#if canEdit}<button on:click={() => changeDie(stats[key], 'h_wiggle', 1, false, true)}>+</button>{/if}
                                        </div>
                                    </div>
                                    <button class="btn-concluir" on:click={() => toggleHyperDrawer(key)}>CONCLUIR</button>
                                </div>
                            </div>
                        </div>
                    {/if}

                    {#if expandedStats[key]}
                        <div class="stat-body" transition:slide={{duration: 200, easing: cubicOut}}>
                            <div class="skills-grid">
                                {#each skills[key] as skill, i}
                                    {@const s_id = key + '_' + i}
                                    <div class="skill-card-wrapper" in:fade>
                                        <div class="skill-card">
                                            <div class="skill-icon-area" on:click={() => openIconEditor(key, i)}>
                                                {#if skill.img} <img src={skill.img} alt="icon" class="custom-icon" /> {:else} <i class="fas {getSkillIcon(skill.name)} skill-fa"></i> {/if}
                                                <div class="edit-overlay"><i class="fas fa-pen"></i></div>
                                            </div>

                                            <div class="skill-main">
                                                {#if canEdit && skill.isCustom} 
                                                    <input class="skill-name-edit" type="text" bind:value={skill.name} on:change={gmUpdate}> 
                                                {:else} 
                                                    <span class="skill-name">{skill.name}</span> 
                                                {/if}
                                                <button class="btn-hyper skill-size" on:click={() => toggleHyperDrawer(s_id)}>
                                                    <i class="fas fa-bolt"></i>
                                                </button>
                                            </div>

                                            <div class="skill-controls">
                                                {#if !editingHyper[s_id] && (skill.h_normal > 0 || skill.h_hard > 0 || skill.h_wiggle > 0)}
                                                    <div class="hyper-summary mini">
                                                        {#if skill.h_normal > 0}<span class="h-tag n">N+{skill.h_normal}</span>{/if}
                                                        {#if skill.h_hard > 0}<span class="h-tag h">H+{skill.h_hard}</span>{/if}
                                                        {#if skill.h_wiggle > 0}<span class="h-tag w">W+{skill.h_wiggle}</span>{/if}
                                                    </div>
                                                {/if}

                                                <div class="cyber-stepper base">
                                                    {#if canEdit && !isGM}<button on:click={() => changeDie(skill, 'normal', -1, true, false)}><i class="fas fa-minus"></i></button>{/if}
                                                    {#if isGM}
                                                        <input type="number" class="gm-stepper-input" bind:value={skill.normal} on:change={gmUpdate}>
                                                    {:else}
                                                        <span class="val">{skill.normal}</span>
                                                    {/if}
                                                    {#if canEdit && !isGM}<button on:click={() => changeDie(skill, 'normal', 1, true, false)}><i class="fas fa-plus"></i></button>{/if}
                                                </div>
                                                
                                                {#if canEdit && skill.isCustom} <button class="btn-trash" on:click={() => removeSkill(key, i)}><i class="fas fa-trash"></i></button> {/if}
                                            </div>
                                        </div>

                                        {#if editingHyper[s_id]}
                                            <div class="hyper-drawer skill-level" transition:slide={{duration: 150}}>
                                                <div class="drawer-bg">
                                                    <div class="hyper-controls-row">
                                                        <div class="h-mod mini">
                                                            <label>N</label>
                                                            <div class="cyber-stepper h-step n mini">
                                                                {#if canEdit}<button on:click={() => changeDie(skill, 'h_normal', -1, false, false)}>-</button>{/if}
                                                                <span class="val">{skill.h_normal}</span>
                                                                {#if canEdit}<button on:click={() => changeDie(skill, 'h_normal', 1, false, false)}>+</button>{/if}
                                                            </div>
                                                        </div>
                                                        <div class="h-mod mini">
                                                            <label>H</label>
                                                            <div class="cyber-stepper h-step h mini">
                                                                {#if canEdit}<button on:click={() => changeDie(skill, 'h_hard', -1, false, false)}>-</button>{/if}
                                                                <span class="val">{skill.h_hard}</span>
                                                                {#if canEdit}<button on:click={() => changeDie(skill, 'h_hard', 1, false, false)}>+</button>{/if}
                                                            </div>
                                                        </div>
                                                        <div class="h-mod mini">
                                                            <label>W</label>
                                                            <div class="cyber-stepper h-step w mini">
                                                                {#if canEdit}<button on:click={() => changeDie(skill, 'h_wiggle', -1, false, false)}>-</button>{/if}
                                                                <span class="val">{skill.h_wiggle}</span>
                                                                {#if canEdit}<button on:click={() => changeDie(skill, 'h_wiggle', 1, false, false)}>+</button>{/if}
                                                            </div>
                                                        </div>
                                                        <button class="btn-concluir mini" on:click={() => toggleHyperDrawer(s_id)}>OK</button>
                                                    </div>
                                                </div>
                                            </div>
                                        {/if}
                                    </div>
                                {/each}
                                {#if canEdit}
                                    <button class="btn-add-skill" on:click={() => addSkill(key)}><i class="fas fa-plus"></i> NOVA PERÍCIA</button>
                                {/if}
                            </div>
                        </div>
                    {/if}
                </div>
            {/if}
        {/each}
    </div>
</div>

<style>
    /* RESET E FONTES */
    .app-container { display: flex; flex-direction: column; height: 100%; gap: 15px; color: #eee; font-family: 'Segoe UI', sans-serif; --bg-panel: rgba(10, 10, 10, 0.5); --border: rgba(255, 255, 255, 0.1); }
    .val, .label, .skill-name { font-family: 'Share Tech Mono', monospace; }
    
    /* MODAL DE ÍCONES */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 200; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px); }
    .modal-box { background: #111; border: 1px solid var(--theme); padding: 20px; width: 300px; border-radius: 8px; box-shadow: 0 0 20px rgba(0,0,0,0.8); }
    .modal-box h3 { color: var(--theme); margin-top: 0; border-bottom: 1px solid #333; padding-bottom: 10px; }
    .input-row { display: flex; gap: 5px; margin-bottom: 20px; }
    .input-row input { flex: 1; background: #000; border: 1px solid #333; color: #fff; padding: 5px; }
    .input-row button, .modal-actions button { background: #222; border: 1px solid #444; color: #fff; cursor: pointer; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
    .modal-actions button { padding: 5px 15px; font-weight: bold; border-radius: 3px; border: none; }
    .modal-actions .cancel { background: #333; }
    .modal-actions .save { background: var(--theme); color: #000; }

    /* HEADER & LOCK */
    .xp-header { flex-shrink: 0; background: var(--bg-panel); border: 1px solid var(--theme); border-radius: 6px; padding: 12px 20px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 0 15px rgba(0,0,0,0.3); }
    .lock-zone { display: flex; justify-content: center; }
    .btn-lock { background: #050505; border: 1px dashed var(--theme); color: var(--theme); padding: 6px 20px; font-weight: bold; font-family: 'Share Tech Mono'; font-size: 0.9rem; letter-spacing: 2px; border-radius: 4px; cursor: pointer; transition: 0.3s; }
    .btn-lock:hover { background: rgba(var(--theme), 0.1); box-shadow: 0 0 10px var(--theme); }
    .btn-lock.locked { background: #ffaa00; color: #000; border: 1px solid #ffaa00; box-shadow: 0 0 15px rgba(255, 170, 0, 0.4); text-shadow: none;}
    
    .xp-info { display: flex; justify-content: space-around; align-items: center; }
    .xp-col { display: flex; flex-direction: column; align-items: center; }
    .xp-sep { width: 1px; height: 30px; background: var(--border); }
    .lbl { font-size: 0.7rem; color: #888; letter-spacing: 2px; font-weight: bold; }
    .val { font-size: 1.6rem; font-weight: 800; line-height: 1; }
    .val.highlight { color: #fff; text-shadow: 0 0 10px var(--theme); }
    .val.debt { color: #ff4444; text-shadow: 0 0 10px #ff0000; }
    .xp-bar-track { width: 100%; height: 4px; background: #222; border-radius: 2px; overflow: hidden; }
    .xp-fill { height: 100%; background: var(--theme); box-shadow: 0 0 10px var(--theme); transition: width 0.3s; }
    
    /* SCROLL E BLOCOS */
    .scroll-area { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; padding-right: 5px; }
    .stat-block { background: rgba(30, 30, 30, 0.4); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; transition: 0.2s; display: flex; flex-direction: column; }
    .stat-block.open { border-color: var(--theme); background: rgba(20, 20, 20, 0.9); }
    
    /* HEADER DO ATRIBUTO */
    .stat-head { padding: 15px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; background: linear-gradient(90deg, rgba(255,255,255,0.03), transparent); min-height: 60px; }
    .open .stat-head { border-bottom: 1px solid var(--border); }
    .head-title { display: flex; align-items: center; gap: 12px; flex: 1; }
    .icon-box { width: 40px; height: 40px; background: rgba(0,0,0,0.3); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: var(--theme); font-size: 1.2rem; border: 1px solid var(--border); }
    .label { font-size: 1.3rem; font-weight: 800; letter-spacing: 1px; color: #ccc; }
    .open .label { color: #fff; text-shadow: 0 0 5px var(--theme); }
    
    /* BOTOES HYPER E DADOS */
    .head-controls { display: flex; gap: 12px; align-items: center; margin-right: 15px; flex-wrap: wrap; justify-content: flex-end;}
    
.btn-hyper { 
        background: #050505; 
        border: 1px solid #00d4ff; 
        color: #00d4ff; 
        font-size: 0.8rem; 
        padding: 4px 8px; 
        border-radius: 4px; 
        cursor: pointer; 
        transition: 0.2s; 
        opacity: 0.6;
        /* As 3 linhas mágicas que impedem o botão de esticar: */
        height: fit-content;
        width: fit-content;
        flex-shrink: 0;
    }
    .btn-hyper:hover { opacity: 1; box-shadow: 0 0 8px rgba(0, 212, 255, 0.4); background: rgba(0, 212, 255, 0.1);}
    .btn-hyper.skill-size { font-size: 0.6rem; padding: 3px 6px; margin-left: 10px; border-color: #555; color: #aaa;}
    .btn-hyper.skill-size:hover { border-color: #00d4ff; color: #00d4ff; }

    /* STEPPERS TECH */
    .cyber-stepper { display: flex; align-items: center; background: #000; border: 1px solid #444; border-radius: 6px; overflow: hidden; height: 32px;}
    .cyber-stepper.base { border-color: var(--theme); box-shadow: inset 0 0 10px rgba(0,0,0,0.8); }
    .cyber-stepper button { width: 30px; height: 100%; background: rgba(255,255,255,0.05); border: none; color: #888; cursor: pointer; font-size: 0.9rem; transition: 0.2s; }
    .cyber-stepper button:hover { background: var(--theme); color: #000; }
    .cyber-stepper .val { font-size: 1.3rem; width: 36px; text-align: center; color: #fff; font-weight: bold;}
    
    .gm-stepper-input { width: 36px; height: 100%; background: transparent; border: none; color: #fff; text-align: center; font-size: 1.3rem; font-weight: bold; font-family: 'Share Tech Mono'; outline: none;}

    /* HYPER SUMMARY TAGS */
    .hyper-summary { display: flex; gap: 5px; }
    .h-tag { font-family: 'Share Tech Mono'; font-size: 0.8rem; font-weight: bold; padding: 3px 6px; border-radius: 4px; border: 1px solid transparent; background: #050505; }
    .h-tag.n { color: #00d4ff; border-color: rgba(0, 212, 255, 0.3); }
    .h-tag.h { color: #ffaa00; border-color: rgba(255, 170, 0, 0.3); }
    .h-tag.w { color: #ff4444; border-color: rgba(255, 68, 68, 0.3); }
    .hyper-summary.mini .h-tag { font-size: 0.6rem; padding: 2px 4px; }

    /* EDITOR HYPER (GAVETA) */
    .hyper-drawer { background: #000; border-bottom: 1px dashed rgba(0, 212, 255, 0.4); border-top: 1px solid #222;}
    .drawer-bg { padding: 15px; background: linear-gradient(to bottom, rgba(0, 212, 255, 0.05), transparent); display: flex; flex-direction: column; gap: 10px;}
    .drawer-title { font-family: 'Share Tech Mono'; font-size: 0.8rem; color: #00d4ff; text-align: center; letter-spacing: 2px;}
    
    .hyper-controls-row { display: flex; justify-content: center; align-items: center; gap: 20px; flex-wrap: wrap;}
    .h-mod { display: flex; flex-direction: column; align-items: center; gap: 5px; }
    .h-mod label { font-family: 'Share Tech Mono'; font-size: 0.7rem; color: #aaa; }
    
    .h-step.n { border-color: #00d4ff; } .h-step.n button:hover { background: #00d4ff; }
    .h-step.h { border-color: #ffaa00; } .h-step.h button:hover { background: #ffaa00; }
    .h-step.w { border-color: #ff4444; } .h-step.w button:hover { background: #ff4444; }

    .btn-concluir { background: #00d4ff; border: none; color: #000; font-family: 'Share Tech Mono'; font-weight: bold; padding: 0 15px; height: 32px; border-radius: 4px; cursor: pointer; transition: 0.2s; margin-top: 18px;}
    .btn-concluir:hover { background: #fff; box-shadow: 0 0 10px #00d4ff; }

    /* VARIACOES PARA PERÍCIA (MINI) */
    .hyper-drawer.skill-level { border-top: none; }
    .hyper-drawer.skill-level .drawer-bg { padding: 10px; background: rgba(0, 212, 255, 0.03); }
    .h-mod.mini { flex-direction: row; }
    .h-mod.mini label { width: 15px; text-align: right; color: #888;}
    .cyber-stepper.mini { height: 26px; }
    .cyber-stepper.mini button { width: 22px; font-size: 0.8rem; }
    .cyber-stepper.mini .val { width: 26px; font-size: 1.1rem; }
    .btn-concluir.mini { height: 26px; margin-top: 0; padding: 0 10px; font-size: 0.8rem;}

    /* PERÍCIAS GERAL */
    .stat-body { background: rgba(0,0,0,0.2); padding: 15px; max-height: 500px; overflow-y: auto; }
    .skills-grid { display: flex; flex-direction: column; gap: 8px; }
    .skill-card-wrapper { background: rgba(255,255,255,0.02); border-radius: 4px; border-left: 3px solid transparent; transition: 0.2s; overflow: hidden; border: 1px solid #222;}
    .skill-card-wrapper:hover { border-left-color: var(--theme); background: rgba(255,255,255,0.05); }
    .skill-card { display: flex; align-items: center; justify-content: space-between; padding: 8px 15px; }
    
    .skill-icon-area { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; position: relative; cursor: pointer; margin-right: 10px; border-radius: 4px; background: rgba(0,0,0,0.3); border: 1px solid #333; }
    .custom-icon { width: 100%; height: 100%; object-fit: cover; }
    .skill-fa { font-size: 1.2rem; color: #555; }
    .edit-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; opacity: 0; color: var(--theme); font-size: 0.8rem; }
    .skill-icon-area:hover .edit-overlay { opacity: 1; }
    
    .skill-main { display: flex; align-items: center; flex: 1; }
    .skill-name { font-size: 1.1rem; color: #ddd; }
    .skill-name-edit { background: transparent; border: none; border-bottom: 1px solid #555; color: #fff; font-size: 1rem; padding: 2px; }
    
    .skill-controls { display: flex; gap: 15px; align-items: center; }
    
    .btn-trash { background: transparent; border: none; color: #444; cursor: pointer; margin-left: 5px; font-size: 1rem;}
    .btn-trash:hover { color: #f00; }
    
    .btn-add-skill { margin-top: 10px; width: 100%; padding: 10px; background: rgba(255,255,255,0.02); border: 1px dashed #444; color: #888; cursor: pointer; border-radius: 6px; font-size: 0.8rem; letter-spacing: 1px; transition: 0.2s; font-family: 'Share Tech Mono';}
    .btn-add-skill:hover { border-color: var(--theme); color: var(--theme); }

    .arrow { transition: 0.3s; color: #555; }
    .rot { transform: rotate(180deg); color: var(--theme); }

    .scroll-area::-webkit-scrollbar { width: 6px; }
    .scroll-area::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
    .scroll-area::-webkit-scrollbar-thumb { background: var(--theme); border-radius: 3px; }
</style>