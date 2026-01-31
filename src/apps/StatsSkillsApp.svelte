<script>
    import { onMount } from 'svelte';
    import { slide, fade } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';

    export let actor;
    
    // Fallback para evitar erro se 'system' vier nulo, mas o foco agora são as FLAGS
    export let system = actor.system || {}; 
    export let themeColor = "#00ff41"; // Cor padrão Matrix se não vier nada

    const MODULE_ID = "multiversus-rpg";
    const isGM = game.user.isGM;

    // --- CONFIGURAÇÃO ---
    const STAT_COSTS = { normal: 5, hard: 10, wiggle: 20 };
    const SKILL_COSTS = { normal: 2, hard: 4, wiggle: 8 };
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
        body: ["Atletismo", "Briga", "Resistência", "Bloqueio", "Arma Corpo a Corpo (Type X)"],
        coordination: ["Esquiva", "Furtividade", "Acrobacias", "Prestidigitação", "Pilotagem (Type)", "Arma a Distância (Type)"],
        sense: ["Empatia", "Percepção", "Intuição", "Procura"],
        mind: ["Primeiros Socorros", "Conhecimento (Tipo)", "Cultura (Tipo)", "Linguagem (Tipo)", "Medicina", "Navegação", "Investigar", "Sobrevivência", "Tática"],
        charm: ["Mentir", "Persuasão", "Performance (Tipo)"],
        command: ["Interrogar", "Intimidar", "Liderar", "Estabilidade"]
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

    // --- ESTADO LOCAL ---
    let stats = {};
    let skills = {};
    let expandedStats = {}; 
    let localCost = 0;

    // Estado do Modal de Ícone
    let iconModalOpen = false;
    let iconEditTarget = { key: null, index: null };
    let tempIconUrl = "";

    // --- LEITURA DE DADOS (DAS FLAGS!) ---
    // Acessa flags.multiversus-rpg com segurança
    $: actorFlags = actor.flags?.[MODULE_ID] || {};
    
    // XP e Pontos (Ainda lemos do system se o sistema original tiver XP, senão flags)
    $: xpEarned = system.xp || actorFlags.xp || 0; 
    $: powersCost = system.points?.powersSpent || actorFlags.powersSpent || 0; 
    
    $: pointsCap = BASE_POINTS_CAP + xpEarned;
    $: totalSpent = localCost + powersCost;
    $: pointsAvailable = pointsCap - totalSpent;

    // --- INICIALIZAÇÃO BLINDADA ---
    function initData() {
        // Tenta ler das flags primeiro. Se não existir, cria a estrutura padrão.
        const savedStats = actorFlags.stats ? JSON.parse(JSON.stringify(actorFlags.stats)) : {};
        const savedSkills = actorFlags.skills ? JSON.parse(JSON.stringify(actorFlags.skills)) : {};

        statKeys.forEach(key => {
            // Inicializa Stat se não existir
            if (!savedStats[key]) savedStats[key] = { normal: 1, hard: 0, wiggle: 0 };
            
            // Inicializa Skill se não existir ou estiver vazia
            if (!savedSkills[key] || savedSkills[key].length === 0) {
                savedSkills[key] = DEFAULT_SKILLS[key].map(name => ({
                    name: name,
                    normal: 0, hard: 0, wiggle: 0,
                    isCustom: false,
                    img: ""
                }));
            }
            if (expandedStats[key] === undefined) expandedStats[key] = false;
        });

        stats = savedStats;
        skills = savedSkills;
        recalcCost();
    }

    // --- CÁLCULO DE CUSTO ---
    function recalcCost() {
        let total = 0;
        statKeys.forEach(key => {
            if (!stats[key]) return;
            const s = stats[key];
            // Custo de Atributo (primeiro dado é grátis no Wild Talents, geralmente)
            const sCost = (Math.max(0, s.normal - 1) * STAT_COSTS.normal) + 
                          (s.hard * STAT_COSTS.hard) + 
                          (s.wiggle * STAT_COSTS.wiggle);
            total += sCost;

            if (skills[key]) {
                skills[key].forEach(sk => {
                    total += (sk.normal * SKILL_COSTS.normal) + 
                             (sk.hard * SKILL_COSTS.hard) + 
                             (sk.wiggle * SKILL_COSTS.wiggle);
                });
            }
        });
        localCost = total; 
    }

    // --- SALVAMENTO SEGURO (FLAGS) ---
    async function saveToServer() {
        // Salva tudo dentro de flags.multiversus-rpg
        // Isso ignora completamente as regras do sistema original
        await actor.update({
            [`flags.${MODULE_ID}.stats`]: stats,
            [`flags.${MODULE_ID}.skills`]: skills,
            [`flags.${MODULE_ID}.statsCost`]: localCost
        }, { render: false });
    }

    // --- AÇÕES ---
    function buyDie(obj, type, cost) {
        if (!isGM && pointsAvailable < cost) {
            ui.notifications.warn(`XP Insuficiente (${cost} necessário).`);
            return;
        }
        
        obj[type]++;
        
        // Força atualização Svelte
        stats = stats;
        skills = skills;
        
        recalcCost();
        saveToServer();
    }

    function gmUpdate() {
        stats = stats;
        skills = skills;
        recalcCost();
        saveToServer();
    }

    function addSkill(key) {
        skills[key] = [...skills[key], { name: "Nova Perícia", normal: 0, hard: 0, wiggle: 0, isCustom: true, img: "" }];
        expandedStats[key] = true;
        recalcCost();
        saveToServer();
    }

    function removeSkill(key, idx) {
        skills[key].splice(idx, 1);
        skills[key] = skills[key];
        recalcCost();
        saveToServer();
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
            skills = skills; 
            saveToServer();
        }
        iconModalOpen = false;
    }

    function openFilePicker() {
        new FilePicker({
            type: "image",
            callback: (path) => { tempIconUrl = path; }
        }).render(true);
    }

    onMount(() => {
        initData();
        // Hook para atualizar XP em tempo real se o mestre mudar
        const hookId = Hooks.on("updateActor", (doc, changes) => {
            if (doc.id === actor.id) {
                // Tenta pegar XP do sistema ou das flags
                const newXp = changes.system?.xp ?? changes.flags?.[MODULE_ID]?.xp;
                if (newXp !== undefined) xpEarned = newXp;
            }
        });
        return () => Hooks.off("updateActor", hookId);
    });
</script>

<div class="app-container" style="--theme: {themeColor}">
    
    {#if iconModalOpen}
        <div class="modal-overlay" transition:fade>
            <div class="modal-box">
                <h3>ALTERAR ÍCONE</h3>
                <div class="input-row">
                    <input type="text" bind:value={tempIconUrl} placeholder="Cole a URL da imagem..." />
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
        <div class="xp-info">
            <div class="xp-col">
                <span class="lbl">CAPACIDADE</span>
                <span class="val">{pointsCap}</span>
            </div>
            <div class="xp-sep"></div>
            <div class="xp-col">
                <span class="lbl">DISPONÍVEL</span>
                <span class="val highlight" class:debt={pointsAvailable < 0}>{pointsAvailable}</span>
            </div>
        </div>
        <div class="xp-bar-track">
            <div class="xp-fill" style="width: {Math.min(100, (totalSpent / pointsCap) * 100)}%"></div>
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
                        </div>

                        <div class="head-dice" on:click|stopPropagation>
                            <div class="die-group normal">
                                <i class="fas fa-cube"></i>
                                {#if isGM} 
                                    <input class="gm-input" type="number" bind:value={stats[key].normal} on:change={gmUpdate}>
                                {:else} 
                                    <span class="die-val">{stats[key].normal}</span>
                                    <button class="btn-buy" on:click={() => buyDie(stats[key], 'normal', 5)}>+</button>
                                {/if}
                            </div>
                            <div class="die-group hard" class:active={stats[key].hard > 0}>
                                <i class="fas fa-square"></i>
                                {#if isGM} 
                                    <input class="gm-input" type="number" bind:value={stats[key].hard} on:change={gmUpdate}>
                                {:else} 
                                    <span class="die-val">{stats[key].hard}</span>
                                    <button class="btn-buy" on:click={() => buyDie(stats[key], 'hard', 10)}>+</button>
                                {/if}
                            </div>
                            <div class="die-group wiggle" class:active={stats[key].wiggle > 0}>
                                <i class="fas fa-star"></i>
                                {#if isGM} 
                                    <input class="gm-input" type="number" bind:value={stats[key].wiggle} on:change={gmUpdate}>
                                {:else} 
                                    <span class="die-val">{stats[key].wiggle}</span>
                                    <button class="btn-buy" on:click={() => buyDie(stats[key], 'wiggle', 20)}>+</button>
                                {/if}
                            </div>
                        </div>
                        <i class="fas fa-chevron-down arrow" class:rot={expandedStats[key]}></i>
                    </div>

                    {#if expandedStats[key]}
                        <div class="stat-body" transition:slide={{duration: 200, easing: cubicOut}}>
                            <div class="skills-grid">
                                {#each skills[key] as skill, i}
                                    <div class="skill-card" in:fade>
                                        
                                        <div class="skill-icon-area" on:click={() => openIconEditor(key, i)}>
                                            {#if skill.img}
                                                <img src={skill.img} alt="icon" class="custom-icon" />
                                            {:else}
                                                <i class="fas {getSkillIcon(skill.name)} skill-fa"></i>
                                            {/if}
                                            <div class="edit-overlay"><i class="fas fa-pen"></i></div>
                                        </div>

                                        <div class="skill-main">
                                            {#if isGM || skill.isCustom}
                                                <input class="skill-name-edit" type="text" bind:value={skill.name} on:change={gmUpdate}>
                                            {:else}
                                                <span class="skill-name">{skill.name}</span>
                                            {/if}
                                            <div class="skill-cost-badge">
                                                XP: {(skill.normal * 2) + (skill.hard * 4) + (skill.wiggle * 8)}
                                            </div>
                                        </div>

                                        <div class="skill-controls">
                                            <div class="ctrl-box">
                                                <span class="lbl-d">N</span>
                                                {#if isGM} 
                                                    <input class="gm-input mini" type="number" bind:value={skill.normal} on:change={gmUpdate}>
                                                {:else} 
                                                    <span class="val-d">{skill.normal}</span> 
                                                    <button class="btn-up" on:click={() => buyDie(skill, 'normal', 2)}></button> 
                                                {/if}
                                            </div>
                                            <div class="ctrl-box h">
                                                <span class="lbl-d">H</span>
                                                {#if isGM} 
                                                    <input class="gm-input mini" type="number" bind:value={skill.hard} on:change={gmUpdate}>
                                                {:else} 
                                                    <span class="val-d" class:on={skill.hard > 0}>{skill.hard}</span> 
                                                    <button class="btn-up" on:click={() => buyDie(skill, 'hard', 4)}></button> 
                                                {/if}
                                            </div>
                                            <div class="ctrl-box w">
                                                <span class="lbl-d">W</span>
                                                {#if isGM} 
                                                    <input class="gm-input mini" type="number" bind:value={skill.wiggle} on:change={gmUpdate}>
                                                {:else} 
                                                    <span class="val-d" class:on={skill.wiggle > 0}>{skill.wiggle}</span> 
                                                    <button class="btn-up" on:click={() => buyDie(skill, 'wiggle', 8)}></button> 
                                                {/if}
                                            </div>
                                            <button class="btn-trash" on:click={() => removeSkill(key, i)}><i class="fas fa-trash"></i></button>
                                        </div>
                                    </div>
                                {/each}
                                <button class="btn-add-skill" on:click={() => addSkill(key)}>
                                    <i class="fas fa-plus"></i> NOVA PERÍCIA
                                </button>
                            </div>
                        </div>
                    {/if}
                </div>
            {/if}
        {/each}
    </div>
</div>

<style>
/* ... (Seu CSS original aqui, não precisa mudar nada no visual) ... */
    .app-container { display: flex; flex-direction: column; height: 100%; gap: 15px; color: #eee; font-family: 'Segoe UI', sans-serif; --bg-panel: rgba(10, 10, 10, 0.5); --border: rgba(255, 255, 255, 0.1); }
    .gm-input { background: rgba(255,255,255,0.15); border: 1px solid #999; color: #fff; font-weight: bold; text-align: center; width: 100%; height: 100%; border-radius: 4px; font-size: 1.1rem; }
    .gm-input:focus { background: rgba(255,255,255,0.3); border-color: var(--theme); outline: none; }
    .gm-input.mini { width: 35px; height: 25px; font-size: 0.9rem; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 200; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px); }
    .modal-box { background: #111; border: 1px solid var(--theme); padding: 20px; width: 300px; border-radius: 8px; box-shadow: 0 0 20px rgba(0,0,0,0.8); }
    .modal-box h3 { color: var(--theme); margin-top: 0; border-bottom: 1px solid #333; padding-bottom: 10px; }
    .input-row { display: flex; gap: 5px; margin-bottom: 20px; }
    .input-row input { flex: 1; background: #000; border: 1px solid #333; color: #fff; padding: 5px; }
    .input-row button { background: #222; border: 1px solid #444; color: #fff; cursor: pointer; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
    .modal-actions button { padding: 5px 15px; cursor: pointer; font-weight: bold; border-radius: 3px; border: none; }
    .modal-actions .cancel { background: #333; color: #fff; }
    .modal-actions .save { background: var(--theme); color: #000; }
    .xp-header { flex-shrink: 0; background: var(--bg-panel); border: 1px solid var(--theme); border-radius: 6px; padding: 12px 20px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 0 15px rgba(0,0,0,0.3); }
    .xp-info { display: flex; justify-content: space-around; align-items: center; }
    .xp-col { display: flex; flex-direction: column; align-items: center; }
    .xp-sep { width: 1px; height: 30px; background: var(--border); }
    .lbl { font-size: 0.7rem; color: #888; letter-spacing: 2px; font-weight: bold; }
    .val { font-size: 1.6rem; font-weight: 800; line-height: 1; }
    .val.highlight { color: #fff; text-shadow: 0 0 10px var(--theme); }
    .val.debt { color: #ff4444; text-shadow: 0 0 10px #ff0000; }
    .xp-bar-track { width: 100%; height: 4px; background: #222; border-radius: 2px; overflow: hidden; }
    .xp-fill { height: 100%; background: var(--theme); box-shadow: 0 0 10px var(--theme); transition: width 0.3s; }
    .scroll-area { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; padding-right: 5px; }
    .stat-block { background: rgba(30, 30, 30, 0.4); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; transition: 0.2s; min-height: 60px; display: flex; flex-direction: column; }
    .stat-block.open { border-color: var(--theme); background: rgba(20, 20, 20, 0.9); flex: 1 0 auto; max-height: 100%; }
    .stat-head { padding: 15px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; background: linear-gradient(90deg, rgba(255,255,255,0.03), transparent); border-bottom: 1px solid transparent; height: 60px; flex-shrink: 0; }
    .open .stat-head { border-bottom-color: var(--border); }
    .head-title { display: flex; align-items: center; gap: 15px; flex: 1; }
    .icon-box { width: 40px; height: 40px; background: rgba(0,0,0,0.3); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: var(--theme); font-size: 1.2rem; border: 1px solid var(--border); }
    .label { font-size: 1.2rem; font-weight: 800; letter-spacing: 1px; color: #ccc; }
    .open .label { color: #fff; text-shadow: 0 0 5px var(--theme); }
    .head-dice { display: flex; gap: 10px; margin-right: 20px; }
    .die-group { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 45px; height: 45px; background: #151515; border: 1px solid #333; border-radius: 6px; position: relative; }
    .die-group i { position: absolute; font-size: 0.8rem; opacity: 0.1; top: 2px; right: 2px; }
    .die-val { font-size: 1.1rem; font-weight: bold; line-height: 1; margin-top: 2px; }
    .btn-buy { width: 100%; height: 16px; border: none; border-top: 1px solid #333; background: rgba(255,255,255,0.05); color: var(--theme); font-weight: bold; font-size: 0.8rem; cursor: pointer; margin-top: 0px; transition: 0.1s; border-radius: 0 0 6px 6px; }
    .btn-buy:hover { background: var(--theme); color: #000; }
    .btn-buy:active { transform: scale(0.95); }
    .die-group.hard.active { border-color: #ffaa00; color: #ffaa00; }
    .die-group.wiggle.active { border-color: #ff4444; color: #ff4444; }
    .arrow { transition: 0.3s; color: #555; }
    .rot { transform: rotate(180deg); color: var(--theme); }
    .stat-body { background: rgba(0,0,0,0.2); padding: 15px; max-height: 400px; overflow-y: auto; }
    .skills-grid { display: flex; flex-direction: column; gap: 8px; }
    .skill-card { display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); padding: 8px 15px; border-radius: 4px; border-left: 3px solid transparent; transition: 0.2s; }
    .skill-card:hover { background: rgba(255,255,255,0.06); border-left-color: var(--theme); }
    .skill-icon-area { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; position: relative; cursor: pointer; margin-right: 10px; border-radius: 4px; overflow: hidden; background: rgba(0,0,0,0.3); border: 1px solid #333; }
    .custom-icon { width: 100%; height: 100%; object-fit: cover; }
    .skill-fa { font-size: 1.2rem; color: #555; }
    .edit-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.2s; color: var(--theme); font-size: 0.8rem; }
    .skill-icon-area:hover .edit-overlay { opacity: 1; }
    .skill-main { display: flex; align-items: center; gap: 10px; flex: 1; }
    .skill-name { font-size: 1rem; font-weight: 500; color: #ddd; }
    .skill-name-edit { background: transparent; border: none; border-bottom: 1px solid #555; color: #fff; font-size: 1rem; padding: 2px; }
    .skill-cost-badge { font-size: 0.7rem; background: #222; padding: 2px 6px; border-radius: 10px; color: #777; margin-left: auto; margin-right: 10px; }
    .skill-controls { display: flex; gap: 15px; align-items: center; }
    .ctrl-box { display: flex; align-items: center; gap: 5px; background: #111; padding: 4px 8px; border-radius: 4px; border: 1px solid #333; }
    .lbl-d { font-size: 0.7rem; color: #666; font-weight: bold; }
    .val-d { font-size: 1rem; font-weight: bold; width: 15px; text-align: center; color: #888; }
    .val-d.on { color: #fff; }
    .ctrl-box.h .val-d.on { color: #ffaa00; }
    .ctrl-box.w .val-d.on { color: #ff4444; }
    .btn-up { width: 20px; height: 20px; border-radius: 50%; border: 1px solid #444; background: rgba(255,255,255,0.05); cursor: pointer; position: relative; transition: 0.1s; }
    .btn-up::after { content: '+'; font-size: 12px; color: var(--theme); position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
    .btn-up:hover { background: var(--theme); border-color: var(--theme); }
    .btn-up:hover::after { color: #000; }
    .btn-up:active { transform: scale(0.9); }
    .btn-trash { background: transparent; border: none; color: #444; cursor: pointer; margin-left: 10px; }
    .btn-trash:hover { color: #f00; }
    .btn-add-skill { margin-top: 10px; width: 100%; padding: 10px; background: rgba(255,255,255,0.02); border: 1px dashed #444; color: #888; cursor: pointer; border-radius: 6px; font-size: 0.8rem; letter-spacing: 1px; transition: 0.2s; }
    .btn-add-skill:hover { border-color: var(--theme); color: var(--theme); background: rgba(var(--theme), 0.05); }
    .scroll-area::-webkit-scrollbar { width: 6px; }
    .scroll-area::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
    .scroll-area::-webkit-scrollbar-thumb { background: var(--theme); border-radius: 3px; }
</style>