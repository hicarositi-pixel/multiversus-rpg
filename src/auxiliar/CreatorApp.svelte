<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { fade, fly, scale } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import { AuxiliarSystem } from './AuxiliarSystem.js';
    import { OriginDatabase } from '../OriginDatabase.js';
    import { ArchetypeDatabase } from '../database/ArchetypeDatabase.js';

    const dispatch = createEventDispatcher();
    const MODULE_ID = "multiversus-rpg";
    
    // --- DADOS GERAIS ---
    let playerList = game.users ? game.users.filter(u => !u.isGM).map(u => ({ id: u.id, name: u.name })) : [];
    
    let origins = [];
    let archetypes = [];
    
    // --- ESTADOS DO CRIADOR ---
    let currentStep = 1; // 1: Origem, 2: Arquétipos, 3: Atributos, 4: Finalizar
    let newCharName = "";
    let selectedPlayerId = "";
    let isProcessing = false;
    let progress = 0;

    // Background & Avatar Config (Lido do game.settings)
    let bgUrl = game.settings.get(MODULE_ID, "creatorBgUrl") || "";
    let avatarUrl = game.settings.get(MODULE_ID, "creatorAvatarUrl") || "icons/svg/mystery-man.svg";

    // --- PASSO 1: ORIGEM ---
    let originSearch = "";
    let selectedOrigin = null;
    let rollCategory = "";
    $: filteredOrigins = origins.filter(o => o.name.toLowerCase().includes(originSearch.toLowerCase()));

    // --- PASSO 2: ARQUÉTIPOS (Talentos) ---
    let selectedTalents = [];
    let selectedArchetypes = new Set();
    $: canProceedArchetypes = selectedTalents.length === 3; // Regra: Escolher 3 talentos

    // --- PASSO 3: ATRIBUTOS E PERÍCIAS ---
    let totalPoints = 100;
    
    // Base Attributes (Custam 5 por nível adicional)
    let attributes = {
        body: { name: "Corpo", val: 1 }, 
        coordination: { name: "Coordenação", val: 1 }, 
        sense: { name: "Sentidos", val: 1 }, 
        mind: { name: "Mente", val: 1 }, 
        charm: { name: "Charme", val: 1 }, 
        command: { name: "Comando", val: 1 }
    };
    
    // Base Skills (Custam 2 por nível adicional)
    let skills = {
        // BODY
        atletismo: { name: "Atletismo", val: 0 }, 
        briga: { name: "Briga", val: 0 },
        resistencia: { name: "Resistência", val: 0 },
        bloqueio: { name: "Bloqueio", val: 0 },
        arma_corpo: { name: "Arma Corpo a Corpo", val: 0 },
        // COORDINATION
        esquiva: { name: "Esquiva", val: 0 }, 
        furtividade: { name: "Furtividade", val: 0 },
        acrobacias: { name: "Acrobacias", val: 0 },
        prestidigitacao: { name: "Prestidigitação", val: 0 },
        pilotagem: { name: "Pilotagem", val: 0 },
        arma_distancia: { name: "Arma a Distância", val: 0 },
        // SENSE
        empatia: { name: "Empatia", val: 0 },
        percepcao: { name: "Percepção", val: 0 }, 
        intuicao: { name: "Intuição", val: 0 },
        procura: { name: "Procura", val: 0 },
        // MIND
        primeiros_socorros: { name: "Primeiros Socorros", val: 0 },
        conhecimento: { name: "Conhecimento", val: 0 },
        cultura: { name: "Cultura", val: 0 },
        linguagem: { name: "Linguagem", val: 0 },
        medicina: { name: "Medicina", val: 0 }, 
        navegacao: { name: "Navegação", val: 0 },
        investigar: { name: "Investigar", val: 0 }, 
        sobrevivencia: { name: "Sobrevivência", val: 0 }, 
        tatica: { name: "Tática", val: 0 },
        // CHARM
        mentir: { name: "Mentir", val: 0 },
        persuasao: { name: "Persuasão", val: 0 },
        performance: { name: "Performance", val: 0 },
        // COMMAND
        interrogar: { name: "Interrogar", val: 0 },
        intimidar: { name: "Intimidar", val: 0 },
        liderar: { name: "Liderar", val: 0 },
        estabilidade: { name: "Estabilidade", val: 0 }
    };

    $: usedPoints = calculateUsedPoints(attributes, skills);
    $: pointsLeft = totalPoints - usedPoints;
    $: canProceedPoints = pointsLeft === 0 && newCharName.trim() !== "";

    onMount(async () => {
        const oDict = await OriginDatabase.load();
        origins = Object.values(oDict);
        archetypes = ArchetypeDatabase.getArchetypes();
    });

    // --- FUNÇÕES DE LÓGICA ---
    async function updateGMConfig(type) {
        if (!game.user.isGM) return;
        if (type === 'bg') {
            await game.settings.set(MODULE_ID, "creatorBgUrl", bgUrl);
            ui.notifications.info("Background Atualizado.");
        } else {
            await game.settings.set(MODULE_ID, "creatorAvatarUrl", avatarUrl);
            ui.notifications.info("Avatar Padrão Atualizado.");
        }
    }

    async function rollOrigin() {
        const roll = new Roll("1d100");
        await roll.evaluate();
        const result = roll.total;
        let rarity = "Livre (1-80)";
        
        if (result === 100) rarity = "Limitada (Aviso: Se não houverem vagas, escolha qualquer outra Origem)";
        else if (result === 98 || result === 99) rarity = "Conquista (98-99)";
        else if (result >= 91 && result <= 97) rarity = "Rara II (91-97)";
        else if (result >= 81 && result <= 90) rarity = "Rara I (81-90)";
        
        if (result === 66 || result === 69) rarity = "Pactado (66 ou 69)";
        
        rollCategory = `${result} - ${rarity}`;
        ui.notifications.info(`Rolagem: ${result} - Categoria Permitida: ${rarity}`);
        // Isso não restringe mecanicamente ainda, apenas dá a informação ao jogador
    }

    function toggleTalent(talent, archId) {
        const index = selectedTalents.findIndex(t => t.id === talent.id);
        if (index > -1) {
            selectedTalents.splice(index, 1);
            selectedTalents = [...selectedTalents];
        } else {
            if (selectedTalents.length < 3) {
                selectedTalents = [...selectedTalents, { ...talent, archId }];
            } else {
                ui.notifications.warn("Você só pode escolher 3 talentos iniciais.");
            }
        }
    }

    function calculateUsedPoints(attrs, skls) {
        let pts = 0;
        for (let k in attrs) { pts += (attrs[k].val - 1) * 5; }
        for (let k in skls) { pts += skls[k].val * 2; }
        return pts;
    }

    function increaseStat(obj, key, isAttr) {
        if (obj[key].val >= 5) return;
        const cost = isAttr ? 5 : 2;
        if (pointsLeft >= cost) {
            obj[key].val++;
            if (isAttr) attributes = {...attributes}; else skills = {...skills};
        } else {
            ui.notifications.warn("Pontos insuficientes!");
        }
    }

    function decreaseStat(obj, key, isAttr) {
        const min = isAttr ? 1 : 0;
        if (obj[key].val > min) {
            obj[key].val--;
            if (isAttr) attributes = {...attributes}; else skills = {...skills};
        }
    }

    async function confirmCreation() {
        if (pointsLeft !== 0) return ui.notifications.warn("Você precisa gastar todos os 100 pontos.");
        if (!newCharName.trim()) return ui.notifications.warn(">> ERRO: NOME INVÁLIDO.");
        if (!selectedOrigin) return ui.notifications.warn(">> ERRO: ORIGEM NÃO SELECIONADA.");

        isProcessing = true;
        let interval = setInterval(() => { progress += 8; if(progress > 95) clearInterval(interval); }, 50);

        try {
            const authorizedIDs = AuxiliarSystem.getAuthorizedUsers();
            let ownership = { default: 0 };
            game.users.forEach(u => {
                if (u.isGM || authorizedIDs.includes(u.id) || u.id === game.user.id) ownership[u.id] = 3;
            });
            if (selectedPlayerId) ownership[selectedPlayerId] = 3;

            // Formatação do sistema de atributos para a ficha
            const sysData = {
                origin: selectedOrigin.name
            };

            const actorData = {
                name: newCharName,
                type: "character", 
                img: avatarUrl,
                ownership: ownership,
                system: sysData,
                flags: {
                    [MODULE_ID]: {
                        stats: {
                            body: { normal: attributes.body.val, h_normal: 0, h_hard: 0, h_wiggle: 0 },
                            coordination: { normal: attributes.coordination.val, h_normal: 0, h_hard: 0, h_wiggle: 0 },
                            sense: { normal: attributes.sense.val, h_normal: 0, h_hard: 0, h_wiggle: 0 },
                            mind: { normal: attributes.mind.val, h_normal: 0, h_hard: 0, h_wiggle: 0 },
                            charm: { normal: attributes.charm.val, h_normal: 0, h_hard: 0, h_wiggle: 0 },
                            command: { normal: attributes.command.val, h_normal: 0, h_hard: 0, h_wiggle: 0 }
                        },
                        skills: {
                            body: [ {name: "Atletismo", normal: skills.atletismo.val}, {name: "Briga", normal: skills.briga.val}, {name: "Resistência", normal: skills.resistencia.val}, {name: "Bloqueio", normal: skills.bloqueio.val}, {name: "Arma Corpo a Corpo", normal: skills.arma_corpo.val} ],
                            coordination: [ {name: "Esquiva", normal: skills.esquiva.val}, {name: "Furtividade", normal: skills.furtividade.val}, {name: "Acrobacias", normal: skills.acrobacias.val}, {name: "Prestidigitação", normal: skills.prestidigitacao.val}, {name: "Pilotagem", normal: skills.pilotagem.val}, {name: "Arma a Distância", normal: skills.arma_distancia.val} ],
                            sense: [ {name: "Empatia", normal: skills.empatia.val}, {name: "Percepção", normal: skills.percepcao.val}, {name: "Intuição", normal: skills.intuicao.val}, {name: "Procura", normal: skills.procura.val} ],
                            mind: [ {name: "Primeiros Socorros", normal: skills.primeiros_socorros.val}, {name: "Conhecimento", normal: skills.conhecimento.val}, {name: "Cultura", normal: skills.cultura.val}, {name: "Linguagem", normal: skills.linguagem.val}, {name: "Medicina", normal: skills.medicina.val}, {name: "Navegação", normal: skills.navegacao.val}, {name: "Investigar", normal: skills.investigar.val}, {name: "Sobrevivência", normal: skills.sobrevivencia.val}, {name: "Tática", normal: skills.tatica.val} ],
                            charm: [ {name: "Mentir", normal: skills.mentir.val}, {name: "Persuasão", normal: skills.persuasao.val}, {name: "Performance", normal: skills.performance.val} ],
                            command: [ {name: "Interrogar", normal: skills.interrogar.val}, {name: "Intimidar", normal: skills.intimidar.val}, {name: "Liderar", normal: skills.liderar.val}, {name: "Estabilidade", normal: skills.estabilidade.val} ]
                        }
                    }
                }
            };

            const cls = getDocumentClass("Actor");
            const newActor = await cls.create(actorData);

            // Adiciona a Origin como um Item (se for suportado na ficha)
            if (selectedOrigin) {
                // Se a origem fosse um Item real, adicionaríamos. Aqui registramos no sysData.origin acima.
            }

            // Adiciona Talentos selecionados
            const itemsToCreate = selectedTalents.map(t => {
                let itemData = foundry.utils.duplicate(t);
                delete itemData.id; delete itemData.archId; delete itemData.foundryItemId;
                itemData.system = itemData.system || {};
                itemData.system.equipped = true;
                return itemData;
            });

            if (itemsToCreate.length > 0) {
                await newActor.createEmbeddedDocuments("Item", itemsToCreate);
            }

            clearInterval(interval);
            progress = 100;

            setTimeout(async () => {
                if (newActor) {
                    ui.notifications.info(`>> PROTOCOLO: [${newActor.name}] REGISTRADO COM SUCESSO.`);
                    await newActor.sheet.render(true);
                    dispatch('close');
                }
            }, 600);

        } catch (err) {
            console.error(err);
            ui.notifications.error(`FALHA CRÍTICA: ${err.message}`);
            isProcessing = false; progress = 0;
        }
    }
</script>

<!-- BACKDROP CLICÁVEL -->
<div class="backdrop" transition:fade on:click={() => dispatch('close')}></div>

<!-- IMERSÃO BACKGROUND -->
{#if bgUrl}
    <div class="creator-bg" style="background-image: url('{bgUrl}');" transition:fade></div>
{/if}

<div class="creator-mmo-window" in:scale={{duration: 400, start: 0.95, easing: quintOut}}>
    
    <!-- UI HEADER & CONFIGS GM -->
    <header class="mmo-header">
        <div class="h-title">
            <h1>CRIADOR DE IDENTIDADE V.2</h1>
            <span>NEXUS // CONEXÃO SEGURA</span>
        </div>
        {#if game.user.isGM}
            <div class="gm-configs">
                <input type="text" bind:value={bgUrl} placeholder="URL Imagem de Fundo" on:blur={() => updateGMConfig('bg')}/>
                <input type="text" bind:value={avatarUrl} placeholder="URL Avatar Padrão" on:blur={() => updateGMConfig('av')}/>
            </div>
        {/if}
        <button class="close-btn" on:click={() => {
            dispatch('close');
            // Fechamento forçado como fallback caso o dispatch falhe na integração V1
            const appEl = document.querySelector('.creator-mmo-window')?.closest('.app');
            if (appEl) {
                const closeBtn = appEl.querySelector('.header-button.close');
                if (closeBtn) closeBtn.click();
            }
        }}><i class="fas fa-times"></i></button>
    </header>

    <div class="mmo-body">
        <!-- AVATAR CENTRAL -->
        <div class="avatar-stage" in:fade={{delay: 300}}>
            <div class="hologram-effect"></div>
            <img src={avatarUrl} alt="Avatar" class="main-avatar" />
            <div class="stage-platform"></div>
        </div>

        <!-- PAINEL LATERAL DE STEPS -->
        <div class="side-panel custom-scroll">
            
            <div class="steps-indicator">
                <div class="step {currentStep === 1 ? 'active' : currentStep > 1 ? 'done' : ''}" on:click={()=>currentStep=1}>1. ORIGEM</div>
                <div class="step {currentStep === 2 ? 'active' : currentStep > 2 ? 'done' : ''}" on:click={()=>currentStep=2}>2. ARQUÉTIPOS</div>
                <div class="step {currentStep === 3 ? 'active' : currentStep > 3 ? 'done' : ''}" on:click={()=>currentStep=3}>3. ATRIBUTOS</div>
            </div>

            <!-- PASSO 1: ORIGEM -->
            {#if currentStep === 1}
                <div class="step-content" in:fly={{x: 20, duration: 300}}>
                    <h2>SELECIONE SUA ORIGEM</h2>
                    <p class="desc">A origem define seu passado no Multiverso.</p>
                    
                    <div class="search-box">
                        <input type="text" bind:value={originSearch} placeholder="Buscar origens..." />
                        <button class="btn-roll" on:click={rollOrigin} title="Rolar 1d100 para Raridade"><i class="fas fa-dice-d20"></i></button>
                    </div>
                    {#if rollCategory}
                        <div class="roll-result-container">
                            <div class="roll-result">{rollCategory}</div>
                        </div>
                    {/if}

                    <div class="list-container custom-scroll">
                        {#each filteredOrigins as org}
                            <div class="list-item {selectedOrigin?.id === org.id ? 'selected' : ''}" on:click={() => selectedOrigin = org}>
                                <div class="item-name">{org.name}</div>
                                <div class="item-meta">{org.type}</div>
                            </div>
                        {/each}
                    </div>

                    {#if selectedOrigin}
                        <div class="origin-preview">
                            <h3>{selectedOrigin.name}</h3>
                            <div class="origin-desc">{@html selectedOrigin.desc}</div>
                            {#if selectedOrigin.traits && selectedOrigin.traits.length > 0}
                                <h4>Traços:</h4>
                                <ul>
                                    {#each selectedOrigin.traits as trait}
                                        <li><b>{trait.name}:</b> {trait.effect}</li>
                                    {/each}
                                </ul>
                            {/if}
                        </div>
                    {/if}
                    <button class="btn-next" on:click={() => currentStep = 2}>AVANÇAR <i class="fas fa-arrow-right"></i></button>
                </div>
            {/if}

            <!-- PASSO 2: ARQUÉTIPOS E TALENTOS -->
            {#if currentStep === 2}
                <div class="step-content" in:fly={{x: 20, duration: 300}}>
                    <h2>KITS DE PODER</h2>
                    <p class="desc">Escolha até 3 talentos iniciais dos arquétipos disponíveis.</p>
                    <div class="progress-info" style="color: {selectedTalents.length === 3 ? '#00ff41' : '#fff'};">
                        Selecionados: {selectedTalents.length} / 3
                    </div>

                    <div class="accordion-list custom-scroll">
                        {#each archetypes as arch}
                            <details class="arch-group">
                                <summary>
                                    <img src={arch.icon} alt=""/> {arch.name} <span>({arch.talents.length})</span>
                                </summary>
                                <div class="arch-talents">
                                    {#each arch.talents as t}
                                        <div class="talent-card {selectedTalents.find(st => st.id === t.id) ? 'selected' : ''}" 
                                             on:click={() => toggleTalent(t, arch.id)}>
                                            <img src={t.img} alt=""/>
                                            <div class="t-info">
                                                <b>{t.name}</b>
                                                <span>Custo por Dado: {t.cost}</span>
                                            </div>
                                            {#if selectedTalents.find(st => st.id === t.id)}
                                                <i class="fas fa-check-circle check-icon"></i>
                                            {/if}
                                        </div>
                                    {/each}
                                </div>
                            </details>
                        {/each}
                    </div>

                    <button class="btn-next" on:click={() => currentStep = 3}>AVANÇAR <i class="fas fa-arrow-right"></i></button>
                </div>
            {/if}

            <!-- PASSO 3: ATRIBUTOS, PERÍCIAS E FINALIZAÇÃO -->
            {#if currentStep === 3}
                <div class="step-content" in:fly={{x: 20, duration: 300}}>
                    <h2>DISTRIBUIÇÃO DE PONTOS</h2>
                    <div class="points-header" class:perfect={pointsLeft === 0} class:error={pointsLeft < 0}>
                        <span class="pts-number">{pointsLeft}</span>
                        <span class="pts-label">PONTOS RESTANTES</span>
                    </div>

                    <div class="stats-container custom-scroll">
                        <h3>ATRIBUTOS (Custo 5)</h3>
                        <div class="stats-grid">
                            {#each Object.keys(attributes) as key}
                                <div class="stat-row">
                                    <span class="s-name">{attributes[key].name}</span>
                                    <div class="s-controls">
                                        <button on:click={() => decreaseStat(attributes, key, true)}><i class="fas fa-minus"></i></button>
                                        <div class="s-val">{attributes[key].val}</div>
                                        <button on:click={() => increaseStat(attributes, key, true)}><i class="fas fa-plus"></i></button>
                                    </div>
                                </div>
                            {/each}
                        </div>

                        <h3 style="margin-top: 20px;">PERÍCIAS (Custo 2)</h3>
                        <div class="stats-grid">
                            {#each Object.keys(skills) as key}
                                <div class="stat-row">
                                    <span class="s-name">{skills[key].name}</span>
                                    <div class="s-controls">
                                        <button on:click={() => decreaseStat(skills, key, false)}><i class="fas fa-minus"></i></button>
                                        <div class="s-val">{skills[key].val}</div>
                                        <button on:click={() => increaseStat(skills, key, false)}><i class="fas fa-plus"></i></button>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>

                    <div class="finish-zone">
                        <input type="text" class="m-input" bind:value={newCharName} placeholder="Nome do Personagem (Obrigatório)" disabled={isProcessing}/>
                        <select class="m-input" bind:value={selectedPlayerId} disabled={isProcessing}>
                            <option value="">Vincular a Jogador (Opcional)</option>
                            {#each playerList as p}
                                <option value={p.id}>{p.name}</option>
                            {/each}
                        </select>

                        {#if isProcessing}
                            <div class="loading-bar"><div class="fill" style="width: {progress}%"></div></div>
                        {:else}
                            <button class="btn-finish" disabled={!canProceedPoints} on:click={confirmCreation}>FINALIZAR CRIAÇÃO</button>
                        {/if}
                    </div>
                </div>
            {/if}

        </div>
    </div>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');

    .backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 40000; backdrop-filter: blur(10px); }
    
    .creator-bg {
        position: fixed; inset: 0; z-index: 40001; pointer-events: none;
        background-size: cover; background-position: center; opacity: 0.3;
        mix-blend-mode: screen; filter: saturate(1.5) contrast(1.2);
    }

    .creator-mmo-window {
        position: fixed; inset: 5%;
        background: rgba(10, 10, 15, 0.85); border: 1px solid rgba(0,255,65,0.3);
        box-shadow: 0 0 50px rgba(0,255,65,0.1), inset 0 0 100px rgba(0,0,0,0.8);
        z-index: 40002; display: flex; flex-direction: column; overflow: hidden;
        font-family: 'Share Tech Mono', monospace; color: #fff;
        border-radius: 10px;
    }

    .mmo-header {
        display: flex; justify-content: space-between; align-items: center; padding: 20px 30px;
        background: linear-gradient(90deg, rgba(0,255,65,0.1), transparent);
        border-bottom: 1px solid rgba(0,255,65,0.2);
    }
    .h-title h1 { margin: 0; font-family: 'Orbitron', sans-serif; font-size: 24px; color: #00ff41; letter-spacing: 2px; text-shadow: 0 0 10px rgba(0,255,65,0.5); }
    .h-title span { font-size: 11px; color: #aaa; letter-spacing: 1px; }

    .gm-configs { display: flex; gap: 10px; }
    .gm-configs input { background: rgba(0,0,0,0.5); border: 1px solid #333; color: #00ff41; padding: 5px 10px; font-family: inherit; font-size: 11px; border-radius: 4px; }
    
    .close-btn { background: transparent; border: none; color: #888; font-size: 20px; cursor: pointer; transition: 0.2s; width: 32px; height: 32px; flex-shrink: 0; display: flex; justify-content: center; align-items: center; }
    .close-btn:hover { color: #ff4444; transform: scale(1.1); }

    .mmo-body { flex: 1; display: flex; position: relative; overflow: hidden; }

    /* AVATAR STAGE (ESQUERDA) */
    .avatar-stage {
        flex: 1; position: relative; display: flex; align-items: center; justify-content: center;
        background: radial-gradient(circle at center, rgba(0,255,65,0.05) 0%, transparent 70%);
    }
    .main-avatar { max-height: 80%; max-width: 80%; object-fit: contain; z-index: 2; filter: drop-shadow(0 0 20px rgba(0,255,65,0.3)); }
    .hologram-effect { position: absolute; inset: 0; background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.03) 2px, rgba(0,255,65,0.03) 4px); z-index: 3; pointer-events: none; }
    .stage-platform { position: absolute; bottom: 5%; width: 300px; height: 30px; background: radial-gradient(ellipse at center, rgba(0,255,65,0.4) 0%, transparent 70%); border-radius: 50%; z-index: 1; filter: blur(5px); }

    /* SIDE PANEL (DIREITA) */
    .side-panel {
        width: 450px; background: rgba(0,0,0,0.6); border-left: 1px solid rgba(0,255,65,0.2);
        padding: 20px; display: flex; flex-direction: column; overflow-y: auto; backdrop-filter: blur(5px);
    }

    .steps-indicator { display: flex; gap: 5px; margin-bottom: 25px; border-bottom: 1px solid #333; padding-bottom: 10px; }
    .step { flex: 1; text-align: center; font-size: 12px; padding: 5px; cursor: pointer; color: #666; transition: 0.3s; border-bottom: 2px solid transparent; }
    .step.active { color: #00ff41; border-color: #00ff41; font-weight: bold; text-shadow: 0 0 5px rgba(0,255,65,0.5); }
    .step.done { color: #fff; border-color: #555; }

    .step-content { display: flex; flex-direction: column; flex: 1; gap: 15px; }
    .step-content h2 { margin: 0; font-family: 'Orbitron', sans-serif; font-size: 18px; color: #fff; }
    .desc { font-size: 12px; color: #aaa; margin: 0; }

    /* LISTAS E BUSCA */
    .search-box { display: flex; gap: 10px; margin-bottom: 10px; width: 100%; box-sizing: border-box; }
    .search-box input { flex: 1; height: 40px; box-sizing: border-box; background: #000; border: 1px solid #444; color: #fff; padding: 10px; border-radius: 4px; font-family: inherit; min-width: 100px; }
    .search-box input:focus { border-color: #00ff41; outline: none; }
    .roll-result-container { margin-bottom: 15px; width: 100%; box-sizing: border-box; }
    .roll-result { display: flex; align-items: center; justify-content: center; min-height: 40px; box-sizing: border-box; padding: 10px 15px; background: rgba(0,255,65,0.1); border: 1px solid #00ff41; color: #00ff41; border-radius: 4px; font-weight: bold; font-size: 13px; text-align: center; line-height: 1.4; }
    .btn-roll { height: 40px; box-sizing: border-box; background: rgba(0,255,65,0.1); border: 1px solid #00ff41; color: #00ff41; padding: 0 15px; border-radius: 4px; cursor: pointer; font-size: 16px; transition: 0.2s; }
    .btn-roll:hover { background: #00ff41; color: #000; box-shadow: 0 0 15px rgba(0,255,65,0.5); }

    .list-container { flex: 1; min-height: 150px; max-height: 250px; overflow-y: auto; border: 1px solid #333; border-radius: 4px; background: rgba(0,0,0,0.3); }
    .list-item { padding: 12px 15px; border-bottom: 1px solid #222; cursor: pointer; transition: 0.2s; display: flex; justify-content: space-between; align-items: center; }
    .list-item:hover { background: rgba(255,255,255,0.05); }
    .list-item.selected { background: rgba(0,255,65,0.15); border-left: 3px solid #00ff41; }
    .item-name { font-weight: bold; font-size: 14px; }
    .item-meta { font-size: 10px; color: #888; background: #222; padding: 2px 6px; border-radius: 4px; }

    .origin-preview { background: rgba(0,0,0,0.5); border: 1px solid #444; padding: 15px; border-radius: 4px; margin-top: 10px; font-size: 13px; line-height: 1.5; color: #ccc; }
    .origin-preview h3 { margin: 0 0 10px 0; color: #00ff41; }
    .origin-preview h4 { margin: 10px 0 5px 0; color: #fff; font-size: 12px; }
    .origin-preview ul { margin: 0; padding-left: 20px; }

    .btn-next { width: 100%; background: #00ff41; color: #000; border: none; padding: 15px; font-family: 'Orbitron', sans-serif; font-size: 14px; font-weight: bold; cursor: pointer; border-radius: 4px; margin-top: auto; transition: 0.2s; display: flex; justify-content: center; gap: 10px; align-items: center; }
    .btn-next:hover:not(:disabled) { box-shadow: 0 0 20px rgba(0,255,65,0.4); transform: translateY(-2px); }
    .btn-next:disabled { background: #333; color: #666; cursor: not-allowed; }

    /* ARQUÉTIPOS E TALENTOS */
    .accordion-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding-right: 5px; }
    .arch-group { background: rgba(0,0,0,0.5); border: 1px solid #333; border-radius: 4px; overflow: hidden; }
    .arch-group summary { padding: 12px 15px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.03); list-style: none; outline: none; }
    .arch-group summary::-webkit-details-marker { display: none; }
    .arch-group summary img { width: 24px; height: 24px; border-radius: 4px; }
    .arch-group summary span { font-size: 11px; color: #888; margin-left: auto; }
    
    .arch-talents { display: flex; flex-direction: column; padding: 10px; gap: 5px; background: rgba(0,0,0,0.8); }
    .talent-card { display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: #111; border: 1px solid #222; border-radius: 4px; cursor: pointer; transition: 0.2s; position: relative; }
    .talent-card:hover { border-color: #555; }
    .talent-card.selected { border-color: #00ff41; background: rgba(0,255,65,0.1); }
    .talent-card img { width: 30px; height: 30px; border-radius: 4px; }
    .t-info { display: flex; flex-direction: column; flex: 1; }
    .t-info b { font-size: 13px; color: #fff; }
    .t-info span { font-size: 10px; color: #888; }
    .check-icon { position: absolute; right: 10px; color: #00ff41; font-size: 16px; }

    /* ATRIBUTOS */
    .points-header { text-align: center; padding: 15px; background: rgba(0,0,0,0.6); border: 1px solid #444; border-radius: 6px; margin-bottom: 15px; transition: 0.3s; }
    .points-header.perfect { border-color: #00ff41; background: rgba(0,255,65,0.1); box-shadow: 0 0 15px rgba(0,255,65,0.2); }
    .points-header.error { border-color: #ff4444; color: #ff4444; }
    .pts-number { font-size: 32px; font-weight: bold; font-family: 'Orbitron', sans-serif; display: block; }
    .pts-label { font-size: 11px; letter-spacing: 1px; opacity: 0.8; }

    .stats-container { flex: 1; overflow-y: auto; padding-right: 5px; }
    .stats-container h3 { font-size: 12px; color: #888; border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 10px; }
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .stat-row { background: rgba(0,0,0,0.5); border: 1px solid #333; padding: 8px 10px; border-radius: 4px; display: flex; flex-direction: column; gap: 8px; }
    .s-name { font-size: 12px; font-weight: bold; text-align: center; }
    .s-controls { display: flex; justify-content: space-between; align-items: center; }
    .s-controls button { background: #222; border: 1px solid #444; color: #fff; width: 24px; height: 24px; border-radius: 4px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
    .s-controls button:hover { background: #444; }
    .s-val { font-size: 16px; font-weight: bold; font-family: 'Orbitron', sans-serif; width: 30px; text-align: center; color: #00ff41; }

    .finish-zone { margin-top: 15px; display: flex; flex-direction: column; gap: 10px; }
    .m-input { width: 100%; height: 40px; box-sizing: border-box; background: rgba(0,0,0,0.5); border: 1px solid #444; color: #fff !important; padding: 10px; border-radius: 4px; font-family: inherit; }
    .m-input:focus { border-color: #00ff41; outline: none; }
    select.m-input option { color: #000 !important; background: #fff !important; font-family: inherit; }
    
    .btn-finish { background: #00ff41; color: #000; font-family: 'Orbitron', sans-serif; font-weight: bold; font-size: 16px; padding: 15px; border: none; border-radius: 4px; cursor: pointer; transition: 0.3s; }
    .btn-finish:hover:not(:disabled) { box-shadow: 0 0 25px rgba(0,255,65,0.6); transform: scale(1.02); }
    .btn-finish:disabled { background: #333; color: #666; cursor: not-allowed; }

    .loading-bar { width: 100%; height: 40px; background: #111; border: 1px solid #333; border-radius: 4px; overflow: hidden; position: relative; }
    .loading-bar .fill { height: 100%; background: #00ff41; transition: width 0.1s; }

    .custom-scroll::-webkit-scrollbar { width: 6px; }
    .custom-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
    .custom-scroll::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
    .custom-scroll::-webkit-scrollbar-thumb:hover { background: #00ff41; }
</style>