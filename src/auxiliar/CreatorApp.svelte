<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { fade, fly, scale } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import { AuxiliarSystem } from './AuxiliarSystem.js';
    import { OriginDatabase } from '../OriginDatabase.js';
    import { ArchetypeDatabase } from '../database/ArchetypeDatabase.js';
    import { StoreDatabase } from '../StoreDatabase.js';
    import { PowerDatabase } from './PowerDatabase.js';
    import { calculateCapacity, CAPACITY_TYPES } from '../data/capacities-data.js';
    import { getBasePowerXP, getMaxPowerPB, normalizePowerCategoryAndRarity } from '../utils/PowerRules.js';

    const dispatch = createEventDispatcher();
    const MODULE_ID = "multiversus-rpg";
    
    // --- DADOS GERAIS ---
    let playerList = game.users ? game.users.filter(u => !u.isGM).map(u => ({ id: u.id, name: u.name })) : [];
    const isPrivilegedCreator = game.user.isGM || AuxiliarSystem.isAuxiliar(game.user);
    
    let origins = [];
    let archetypes = [];
    
    // --- ESTADOS DO CRIADOR ---
    let currentStep = 1; // 1: Origem, 2: Arquétipos, 3: Atributos, 4: Finalizar
    let newCharName = "";
    let selectedPlayerId = game.user.isGM ? "" : game.user.id;
    let isProcessing = false;
    let progress = 0;

    // Controle de Rolagem e Re-roll de Origem para Jogadores
    let freeOriginRollUsed = Boolean(game.user.getFlag(MODULE_ID, "originFreeRollUsed"));
    let availableOriginRerolls = 0;
    let configuredOriginRerollName = "Re-roll de Origem";

    function refreshOriginRerollStatus() {
        try {
            configuredOriginRerollName = (game.settings.get(MODULE_ID, "originRerollItemName") || "Re-roll de Origem").trim();
        } catch (e) {
            configuredOriginRerollName = "Re-roll de Origem";
        }
        freeOriginRollUsed = Boolean(game.user.getFlag(MODULE_ID, "originFreeRollUsed"));
        const credits = Number(game.user.getFlag(MODULE_ID, "originRerollCredits")) || 0;
        const pData = StoreDatabase.getPlayerData(game.user.id);
        const targetLower = configuredOriginRerollName.toLowerCase();
        const unactivatedMatching = (pData.items || []).filter(
            i => !i.active && (i.name || "").trim().toLowerCase() === targetLower
        ).length;
        availableOriginRerolls = credits + unactivatedMatching;
    }

    // Background & Avatar Config (Lido do game.settings)
    let bgUrl = game.settings.get(MODULE_ID, "creatorBgUrl") || "";
    let avatarUrl = game.settings.get(MODULE_ID, "creatorAvatarUrl") || "icons/svg/mystery-man.svg";

    // --- PASSO 1: ORIGEM ---
    let originSearch = "";
    let selectedOrigin = null;
    let rollCategory = "";
    $: filteredOrigins = origins.filter(o => o.name.toLowerCase().includes(originSearch.toLowerCase()));

    // --- PASSO 2: TALENTO PERSONALIZÁVEL & ARQUÉTIPOS (Talentos) ---
    let customTalentName = "";
    let customTalentDesc = "";
    let expandCustomTalentModal = false;

    let selectedTalents = [];
    let selectedArchetypes = new Set();
    let powersArchiveCache = [];
    let viewedKitTalent = null;
    let viewedTalentTab = "ficha";
    let viewedTalentMaximized = false;
    $: canProceedArchetypes = selectedTalents.length === 3;

    const CATEGORY_LABELS = {
        principal: "Talento Principal",
        secundario: "Talento Secundário",
        memoria: "Memória",
        habilidade: "Habilidade Especial",
        origem: "Kit de Origem",
        item: "Item",
        estrutura: "Estrutura",
        intrinseca: "Habilidade Intrínseca"
    };

    function getQualityMeta(qType) {
        const up = (qType || "").toString().toUpperCase();
        if (up === "ATK" || up === "A" || up === "ATAQUE") return { code: "A", label: "ATAQUE", color: "#ff4444" };
        if (up === "DEF" || up === "D" || up === "DEFESA") return { code: "D", label: "DEFESA", color: "#44aaff" };
        return { code: "U", label: "UTILIDADE", color: "#ffaa00" };
    }

    function resolveAssociatedTalentData(t) {
        const targetId = t?.foundryItemId || "";
        const targetName = (t?.name || "").trim().toLowerCase();

        // 1. Procura nos Itens do Mundo (Foundry World Items)
        let worldItem = null;
        if (game.items) {
            if (targetId) worldItem = game.items.get(targetId) || null;
            if (!worldItem && targetName) {
                worldItem = game.items.find(i => i.type === "power" && (i.name || "").trim().toLowerCase() === targetName) || null;
            }
        }

        // 2. Procura no Data Core (Forja de Poder / PowerDatabase)
        let dbEntry = null;
        if (Array.isArray(powersArchiveCache) && powersArchiveCache.length > 0) {
            if (targetId) {
                dbEntry = powersArchiveCache.find(p => p.id === targetId || p.rawItem?.id === targetId) || null;
            }
            if (!dbEntry && targetName) {
                dbEntry = powersArchiveCache.find(p => (p.name || "").trim().toLowerCase() === targetName) || null;
            }
        }

        // 3. Procura no Arquivo da Loja (StoreDatabase - DB GERAL) para descrições/visualizações HTML associadas
        let storeEntry = null;
        try {
            const sArchive = StoreDatabase.getArchive() || [];
            if (targetId) storeEntry = sArchive.find(s => s.id === targetId) || null;
            if (!storeEntry && targetName) {
                storeEntry = sArchive.find(s => (s.name || "").trim().toLowerCase() === targetName) || null;
            }
        } catch (e) {}

        let itemObj;
        if (worldItem) {
            itemObj = worldItem.toObject();
        } else if (dbEntry?.rawItem) {
            itemObj = foundry.utils.deepClone(dbEntry.rawItem);
            if (!itemObj.name) itemObj.name = dbEntry.name || t.name;
            if (!itemObj.img) itemObj.img = dbEntry.img || t.img;
        } else {
            itemObj = foundry.utils.deepClone(t);
        }

        return { itemObj, storeEntry };
    }

    async function openTalentViewer(t, arch) {
        try {
            powersArchiveCache = await PowerDatabase.getArchive();
        } catch (e) {}

        const { itemObj, storeEntry } = resolveAssociatedTalentData(t);
        const flags = itemObj.flags?.[MODULE_ID] || {};
        const sys = itemObj.system || {};
        const norm = normalizePowerCategoryAndRarity(flags.category || "principal", flags.rarity || "Comum");
        const qualities = Array.isArray(flags.qualities) ? flags.qualities : [];

        const usedPB = qualities.reduce((sum, q) => {
            const extrasCost = (q.extras || []).reduce((acc, e) => acc + ((Number(e.cost) || 0) * (Number(e.qty) || 1)), 0);
            return sum + Math.max(1, 2 + (Number(q.level) || 0) + extrasCost);
        }, 0);
        const maxPB = getMaxPowerPB(norm.category, norm.rarity);
        const xpPerDie = getBasePowerXP(norm.category, norm.rarity) || t.cost || 0;

        const dice = flags.dice || { normal: 0, hard: 0, wiggle: 0 };
        const totalDice = (Number(dice.normal) || 0) + (Number(dice.hard) || 0) + (Number(dice.wiggle) || 0);
        const effectiveDiceForCap = Math.max(1, totalDice);

        const rawNotes = sys.notes ?? flags.notes ?? flags.systemNotes ?? flags.effect ?? sys.description ?? "";
        const notesStr = typeof rawNotes === "string" ? rawNotes : (rawNotes?.value || "");

        const storeHtml = (storeEntry?.system?.description && typeof storeEntry.system.description === "string" && storeEntry.system.description.includes("<"))
            ? storeEntry.system.description
            : "";
        const visualizationHtml = (flags.visualizationHtml || "").trim() || storeHtml;

        viewedTalentTab = "ficha";
        viewedKitTalent = {
            kitRef: t,
            archId: arch?.id || t.archId,
            archName: arch?.name || "Arquétipo",
            name: itemObj.name || t.name,
            img: flags.customUrl || itemObj.img || t.img || "icons/svg/lightning.svg",
            category: norm.category,
            categoryLabel: CATEGORY_LABELS[norm.category] || norm.category.toUpperCase(),
            rarity: norm.rarity,
            xpPerDie,
            usedPB,
            maxPB,
            dice: {
                normal: Number(dice.normal) || 0,
                hard: Number(dice.hard) || 0,
                wiggle: Number(dice.wiggle) || 0
            },
            totalDice,
            effectiveDiceForCap,
            tags: Array.isArray(flags.tags) ? flags.tags : [],
            qualities,
            notesStr: notesStr.trim(),
            visualizationHtml
        };
    }

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

    onMount(() => {
        rollCategory = game.user.getFlag(MODULE_ID, "lastOriginRollCategory") || "";
        refreshOriginRerollStatus();
        const storeHookId = Hooks.on("storeUpdate", refreshOriginRerollStatus);

        (async () => {
            const oDict = await OriginDatabase.load();
            origins = Object.values(oDict);
            archetypes = ArchetypeDatabase.getArchetypes();
            try {
                powersArchiveCache = await PowerDatabase.getArchive();
            } catch (e) {
                powersArchiveCache = [];
            }
        })();

        return () => {
            Hooks.off("storeUpdate", storeHookId);
        };
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
        refreshOriginRerollStatus();
        let rollType = "Mestre / Auxiliar (Livre)";

        if (!isPrivilegedCreator) {
            if (!freeOriginRollUsed) {
                await game.user.setFlag(MODULE_ID, "originFreeRollUsed", true);
                rollType = "1ª Rolagem (Gratuita)";
            } else {
                const credits = Number(game.user.getFlag(MODULE_ID, "originRerollCredits")) || 0;
                if (credits > 0) {
                    await game.user.setFlag(MODULE_ID, "originRerollCredits", Math.max(0, credits - 1));
                    rollType = `Re-roll (Crédito: ${configuredOriginRerollName})`;
                } else {
                    const pData = StoreDatabase.getPlayerData(game.user.id);
                    const targetLower = configuredOriginRerollName.toLowerCase();
                    const idx = (pData.items || []).findIndex(
                        i => !i.active && (i.name || "").trim().toLowerCase() === targetLower
                    );
                    if (idx === -1) {
                        ui.notifications.warn(`Você já realizou sua rolagem gratuita de Origem! Para rolar novamente, obtenha ou ative o item "${configuredOriginRerollName}" na Loja.`);
                        return;
                    }
                    const consumedName = pData.items[idx].name || configuredOriginRerollName;
                    pData.items[idx].active = true;
                    await game.user.setFlag(MODULE_ID, "playerData", pData);
                    Hooks.callAll("storeUpdate");
                    rollType = `Re-roll (Estoque: ${consumedName})`;
                }
            }
        }

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
        await game.user.setFlag(MODULE_ID, "lastOriginRollCategory", rollCategory);
        refreshOriginRerollStatus();

        const ownerUser = selectedPlayerId ? game.users.get(selectedPlayerId) : (!game.user.isGM ? game.user : null);
        Hooks.callAll("nexusOriginRoll", {
            rollerName: game.user.name,
            ownerName: ownerUser ? ownerUser.name : "Não vinculado",
            rollType,
            result,
            rarity
        });

        ui.notifications.info(`Rolagem: ${result} - Categoria Permitida: ${rarity}`);
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

            const sysData = {
                origin: selectedOrigin.name
            };

            const actorData = {
                name: newCharName.trim(),
                type: "character", 
                img: avatarUrl,
                ownership: ownership,
                system: sysData,
                flags: {
                    [MODULE_ID]: {
                        origin: selectedOrigin.id,
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

            try {
                powersArchiveCache = await PowerDatabase.getArchive();
            } catch (e) {}

            const hasCustomTalent = Boolean(customTalentName.trim() || customTalentDesc.trim());
            if (hasCustomTalent) {
                actorData.flags[MODULE_ID].customTalentRequest = {
                    name: customTalentName.trim(),
                    description: customTalentDesc.trim(),
                    createdAt: Date.now()
                };
            }

            const itemsToCreate = selectedTalents.map(t => {
                const { itemObj } = resolveAssociatedTalentData(t);
                let itemData = foundry.utils.duplicate(itemObj);
                delete itemData.id; delete itemData._id; delete itemData.archId; delete itemData.foundryItemId;
                itemData.type = itemData.type || "power";
                itemData.system = itemData.system || {};
                itemData.system.equipped = true;
                if (itemData.flags?.[MODULE_ID]) {
                    const norm = normalizePowerCategoryAndRarity(
                        itemData.flags[MODULE_ID].category,
                        itemData.flags[MODULE_ID].rarity
                    );
                    itemData.flags[MODULE_ID].category = norm.category;
                    itemData.flags[MODULE_ID].rarity = norm.rarity;
                }
                return itemData;
            });

            const targetOwnerId = selectedPlayerId || (!game.user.isGM ? game.user.id : "");
            const ownerUser = targetOwnerId ? game.users.get(targetOwnerId) : null;
            let newActor = null;

            if (game.user.can("ACTOR_CREATE")) {
                const cls = getDocumentClass("Actor");
                newActor = await cls.create(actorData);
                if (newActor && itemsToCreate.length > 0) {
                    await newActor.createEmbeddedDocuments("Item", itemsToCreate);
                }
                if (newActor && ownerUser && !ownerUser.isGM && !ownerUser.character && (game.user.isGM || ownerUser.id === game.user.id)) {
                    await ownerUser.update({ character: newActor.id });
                }
            } else {
                const activeGM = game.users.find(u => u.isGM && u.active);
                if (!activeGM) {
                    throw new Error("Um Mestre precisa estar online para registrar um Novo Agente.");
                }
                const requestId = foundry.utils.randomID();
                const createdActorId = await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        Hooks.off("creatorActorCreated", hookId);
                        reject(new Error("Tempo esgotado aguardando confirmação do Mestre."));
                    }, 15000);

                    const hookId = Hooks.on("creatorActorCreated", (res) => {
                        if (res?.requestId !== requestId) return;
                        clearTimeout(timeout);
                        Hooks.off("creatorActorCreated", hookId);
                        if (res.error || !res.actorId) {
                            reject(new Error(res.error || "Não foi possível criar a ficha."));
                        } else {
                            resolve(res.actorId);
                        }
                    });

                    game.socket.emit(`module.${MODULE_ID}`, {
                        type: "CREATOR_CREATE_ACTOR",
                        requestId,
                        userId: game.user.id,
                        selectedPlayerId: targetOwnerId,
                        actorData,
                        itemsToCreate
                    });
                });
                newActor = game.actors.get(createdActorId) || null;
            }

            Hooks.callAll("nexusAgentCreated", {
                charName: newCharName.trim(),
                creatorName: game.user.name,
                ownerName: ownerUser ? ownerUser.name : "Sem vínculo",
                originName: selectedOrigin.name,
                rollCategory: rollCategory || "Nenhuma rolagem realizada"
            });

            if (hasCustomTalent) {
                Hooks.callAll("nexusCustomTalentRequest", {
                    charName: newCharName.trim(),
                    creatorName: game.user.name,
                    ownerName: ownerUser ? ownerUser.name : "Sem vínculo",
                    originName: selectedOrigin.name,
                    talentName: customTalentName.trim() || "Talento Personalizado",
                    talentDescription: customTalentDesc.trim(),
                    selectedKitTalents: selectedTalents.map(t => t.name)
                });
            }

            clearInterval(interval);
            progress = 100;

            setTimeout(async () => {
                if (newActor) {
                    ui.notifications.info(`>> PROTOCOLO: [${newActor.name}] REGISTRADO COM SUCESSO.`);
                    await newActor.sheet.render(true);
                } else {
                    ui.notifications.info(`>> PROTOCOLO: [${newCharName.trim()}] REGISTRADO COM SUCESSO.`);
                }
                dispatch('close');
            }, 600);

        } catch (err) {
            clearInterval(interval);
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

                    <div class="owner-bar">
                        <span class="owner-lbl"><i class="fas fa-user-shield"></i> DONO DA FICHA:</span>
                        {#if isPrivilegedCreator}
                            <select class="owner-select" bind:value={selectedPlayerId}>
                                <option value="">Sem vínculo (Definir depois)</option>
                                {#each playerList as p}
                                    <option value={p.id}>{p.name}</option>
                                {/each}
                            </select>
                        {:else}
                            <span class="owner-fixed">{game.user.name}</span>
                        {/if}
                    </div>

                    {#if !isPrivilegedCreator}
                        <div class="reroll-status-bar" class:has-roll={!freeOriginRollUsed || availableOriginRerolls > 0}>
                            {#if !freeOriginRollUsed}
                                <i class="fas fa-check-circle"></i> 1ª Rolagem Gratuita Disponível
                            {:else if availableOriginRerolls > 0}
                                <i class="fas fa-sync-alt"></i> Re-rolls ({configuredOriginRerollName}): <b>{availableOriginRerolls}</b>
                            {:else}
                                <i class="fas fa-lock"></i> Rolagem realizada — Requer <b>{configuredOriginRerollName}</b> para re-rolar
                            {/if}
                        </div>
                    {/if}
                    
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

            <!-- PASSO 2: TALENTO PERSONALIZÁVEL, ARQUÉTIPOS E TALENTOS -->
            {#if currentStep === 2}
                <div class="step-content" in:fly={{x: 20, duration: 300}}>
                    <div class="custom-talent-box">
                        <div class="ct-header">
                            <div>
                                <h2><i class="fas fa-sparkles"></i> TALENTO PERSONALIZÁVEL</h2>
                                <p class="desc">Descreva o talento personalizado desejado para o personagem (opcional).</p>
                            </div>
                            <button class="btn-expand-ct" type="button" on:click={() => expandCustomTalentModal = true} title="Expandir campo de escrita">
                                <i class="fas fa-expand-alt"></i>
                            </button>
                        </div>
                        <input
                            type="text"
                            class="ct-input"
                            bind:value={customTalentName}
                            placeholder="Nome ou conceito do Talento Personalizado..."
                        />
                        <textarea
                            class="ct-textarea custom-scroll"
                            bind:value={customTalentDesc}
                            rows="3"
                            placeholder="Descreva efeitos, funcionamento, limites e ideia do talento para o personagem..."
                        ></textarea>
                        <div class="ct-hint">
                            <i class="fab fa-discord"></i> Encaminhado automaticamente ao Discord ao finalizar a criação.
                        </div>
                    </div>

                    <div class="ct-divider"></div>

                    <h2>KITS DE PODER</h2>
                    <p class="desc">Escolha até 3 talentos iniciais. Clique em qualquer talento para ler seus dados completos.</p>
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
                                        {@const isSelected = selectedTalents.find(st => st.id === t.id)}
                                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                                        <!-- svelte-ignore a11y-no-static-element-interactions -->
                                        <div class="talent-card {isSelected ? 'selected' : ''}"
                                             on:click={() => openTalentViewer(t, arch)}
                                             title="Clique para visualizar os dados deste talento">
                                            <div style="display: flex; gap: 10px; width: 100%; align-items: center;">
                                                <img src={t.img} alt=""/>
                                                <div class="t-info">
                                                    <b>{t.name}</b>
                                                    <span>Custo por Dado: {t.cost} • <em class="read-hint"><i class="fas fa-book-open"></i> Ler</em></span>
                                                </div>
                                                <button class="select-btn" type="button" on:click|stopPropagation={() => toggleTalent(t, arch.id)} style="background: {isSelected ? '#00ff41' : 'transparent'}; color: {isSelected ? '#000' : '#00ff41'}; border: 1px solid #00ff41; border-radius: 4px; padding: 5px 10px; cursor: pointer; font-size: 10px; font-weight: bold; margin-left: auto;">
                                                    {isSelected ? 'SELECIONADO' : 'SELECIONAR'}
                                                </button>
                                            </div>
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
                        <select class="m-input" bind:value={selectedPlayerId} disabled={!isPrivilegedCreator || isProcessing}>
                            {#if isPrivilegedCreator}
                                <option value="">Vincular a Jogador (Opcional)</option>
                            {/if}
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

<!-- MODAL: EDITOR EXPANDIDO DE TALENTO PERSONALIZÁVEL -->
{#if expandCustomTalentModal}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="submodal-backdrop" transition:fade={{duration: 150}} on:click|self={() => expandCustomTalentModal = false}>
        <div class="ct-expanded-modal" in:scale={{duration: 200, start: 0.95}}>
            <header class="submodal-hdr">
                <div class="sm-title">
                    <i class="fas fa-sparkles"></i>
                    <span>TALENTO PERSONALIZÁVEL // DESCRIÇÃO DETALHADA</span>
                </div>
                <button class="sm-close" type="button" on:click={() => expandCustomTalentModal = false}><i class="fas fa-times"></i></button>
            </header>
            <div class="ct-expanded-body">
                <label>NOME OU CONCEITO DO TALENTO</label>
                <input type="text" class="ct-input" bind:value={customTalentName} placeholder="Ex: Manipulação Gravitacional Tática..." />
                <label style="margin-top: 10px;">DESCRIÇÃO DO TALENTO DESEJADO</label>
                <textarea
                    class="ct-textarea expanded custom-scroll"
                    bind:value={customTalentDesc}
                    placeholder="Descreva com detalhes a ideia do talento, sub-rotinas desejadas (ataque, defesa, utilidade), limites narrativos e funcionamento..."
                ></textarea>
            </div>
            <footer class="submodal-ftr">
                <span class="ct-hint"><i class="fab fa-discord"></i> Será enviado ao Discord automaticamente ao finalizar o agente.</span>
                <button class="sm-btn-primary" type="button" on:click={() => expandCustomTalentModal = false}>CONCLUIR ESCRITA</button>
            </footer>
        </div>
    </div>
{/if}

<!-- MODAL: VISUALIZADOR SOMENTE LEITURA DE TALENTO DO KIT -->
{#if viewedKitTalent}
    {@const isKitSelected = Boolean(selectedTalents.find(st => st.id === viewedKitTalent.kitRef.id))}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="submodal-backdrop" transition:fade={{duration: 150}} on:click|self={() => viewedKitTalent = null}>
        <div class="talent-viewer-modal" class:maximized={viewedTalentMaximized} in:scale={{duration: 200, start: 0.95}}>
            <header class="submodal-hdr">
                <div class="tv-hdr-left">
                    <img src={viewedKitTalent.img} alt={viewedKitTalent.name} class="tv-icon" />
                    <div>
                        <div class="tv-title-row">
                            <h3>{viewedKitTalent.name}</h3>
                            <span class="tv-badge-ro"><i class="fas fa-lock"></i> SOMENTE LEITURA</span>
                        </div>
                        <div class="tv-meta-row">
                            <span class="tv-pill arch">{viewedKitTalent.archName}</span>
                            <span class="tv-pill cat">{viewedKitTalent.categoryLabel}</span>
                            <span class="tv-pill rar">{viewedKitTalent.rarity}</span>
                        </div>
                    </div>
                </div>
                <div class="tv-hdr-actions">
                    {#if viewedKitTalent.visualizationHtml}
                        <div class="tv-tabs">
                            <button type="button" class:active={viewedTalentTab === 'ficha'} on:click={() => viewedTalentTab = 'ficha'}>ESTRUTURA</button>
                            <button type="button" class:active={viewedTalentTab === 'visual'} on:click={() => viewedTalentTab = 'visual'}>VISUALIZAÇÃO</button>
                        </div>
                    {/if}
                    <button class="sm-icon-btn" type="button" on:click={() => viewedTalentMaximized = !viewedTalentMaximized} title={viewedTalentMaximized ? "Restaurar tamanho" : "Maximizar"}>
                        <i class="fas {viewedTalentMaximized ? 'fa-compress' : 'fa-expand'}"></i>
                    </button>
                    <button class="sm-close" type="button" on:click={() => viewedKitTalent = null}><i class="fas fa-times"></i></button>
                </div>
            </header>

            <div class="tv-body custom-scroll">
                {#if viewedTalentTab === 'visual' && viewedKitTalent.visualizationHtml}
                    <div class="tv-visual-render custom-scroll">
                        {@html viewedKitTalent.visualizationHtml}
                    </div>
                {:else}
                    <!-- MÉTRICAS PRINCIPAIS -->
                    <div class="tv-metrics">
                        <div class="tv-metric-card">
                            <span class="m-lbl">CUSTO POR DADO</span>
                            <span class="m-val">{viewedKitTalent.xpPerDie} XP</span>
                        </div>
                        <div class="tv-metric-card">
                            <span class="m-lbl">BALANCEAMENTO (PB)</span>
                            <span class="m-val">{viewedKitTalent.usedPB} <small>/ {viewedKitTalent.maxPB} PB</small></span>
                        </div>
                        <div class="tv-metric-card">
                            <span class="m-lbl">MATRIZ DE DADOS BASE</span>
                            <span class="m-val dice">
                                {viewedKitTalent.dice.normal}N • {viewedKitTalent.dice.hard}HD • {viewedKitTalent.dice.wiggle}WD
                            </span>
                        </div>
                    </div>

                    {#if viewedKitTalent.tags && viewedKitTalent.tags.length > 0}
                        <div class="tv-tags-bar">
                            {#each viewedKitTalent.tags as tg}
                                <span class="tv-tag">#{tg}</span>
                            {/each}
                        </div>
                    {/if}

                    <!-- SUB-ROTINAS / QUALIDADES -->
                    <div class="tv-section-title"><i class="fas fa-microchip"></i> SUB-ROTINAS & MECÂNICAS DO TALENTO</div>
                    {#if viewedKitTalent.qualities.length > 0}
                        <div class="tv-qualities-list">
                            {#each viewedKitTalent.qualities as q, idx}
                                {@const qMeta = getQualityMeta(q.type)}
                                {@const qPB = Math.max(1, 2 + (Number(q.level) || 0) + (q.extras || []).reduce((acc, e) => acc + ((Number(e.cost) || 0) * (Number(e.qty) || 1)), 0))}
                                <div class="tv-q-card" style="border-left-color: {qMeta.color};">
                                    <div class="tv-q-hdr">
                                        <span class="tv-q-badge" style="background: {qMeta.color};">{qMeta.code}</span>
                                        <span class="tv-q-type" style="color: {qMeta.color};">{qMeta.label}</span>
                                        <strong class="tv-q-name">{q.name || `Sub-rotina #${idx + 1}`}</strong>
                                        <span class="tv-q-lvl">Nível {q.level || 0} ({qPB} PB)</span>
                                    </div>

                                    {#if q.imgUrl}
                                        <div class="tv-q-banner">
                                            <img src={q.imgUrl} alt={q.name} />
                                        </div>
                                    {/if}

                                    {#if q.description}
                                        <div class="tv-q-desc">{q.description}</div>
                                    {/if}

                                    {#if q.capacities && q.capacities.length > 0}
                                        <div class="tv-q-sub">
                                            <span class="sub-lbl">CAPACIDADES (Ref. {viewedKitTalent.effectiveDiceForCap}d):</span>
                                            <div class="tv-caps-row">
                                                {#each q.capacities as cap}
                                                    {@const capType = typeof cap === 'string' ? cap : cap.type}
                                                    {@const capName = CAPACITY_TYPES.find(ct => ct.id === capType)?.name || capType}
                                                    {@const capVal = calculateCapacity(
                                                        (typeof cap === 'object' && cap.invested !== undefined && cap.invested > 0) ? cap.invested : viewedKitTalent.effectiveDiceForCap,
                                                        capType,
                                                        typeof cap === 'object' ? (cap.nul || 0) : 0,
                                                        typeof cap === 'object' ? (cap.booster || 0) : 0
                                                    )}
                                                    <div class="tv-cap-chip">
                                                        <small>{capName}:</small> <b>{capVal}</b>
                                                    </div>
                                                {/each}
                                            </div>
                                        </div>
                                    {/if}

                                    {#if q.extras && q.extras.length > 0}
                                        <div class="tv-q-sub">
                                            <span class="sub-lbl">EXTRAS & FALHAS:</span>
                                            <div class="tv-mods-row">
                                                {#each q.extras as mod}
                                                    {@const totalModCost = (Number(mod.cost) || 0) * (Number(mod.qty) || 1)}
                                                    <span class="tv-mod-pill {totalModCost >= 0 ? 'extra' : 'flaw'}">
                                                        {mod.name}{mod.qty > 1 ? ` (x${mod.qty})` : ''}
                                                        <b>{totalModCost >= 0 ? `+${totalModCost}` : totalModCost}</b>
                                                    </span>
                                                {/each}
                                            </div>
                                        </div>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <div class="tv-empty-box">Nenhuma sub-rotina estruturada cadastrada neste talento.</div>
                    {/if}

                    <!-- NOTAS DE SISTEMA / EFEITO GERAL -->
                    {#if viewedKitTalent.notesStr && viewedKitTalent.notesStr !== '<p></p>'}
                        <div class="tv-section-title" style="margin-top: 16px;"><i class="fas fa-terminal"></i> EFEITO GERAL & NOTAS DE SISTEMA</div>
                        <div class="tv-notes-box">
                            {@html viewedKitTalent.notesStr.replace(/\n/g, '<br>')}
                        </div>
                    {/if}
                {/if}
            </div>

            <footer class="submodal-ftr">
                <button
                    class="sm-btn-toggle {isKitSelected ? 'active' : ''}"
                    type="button"
                    on:click={() => toggleTalent(viewedKitTalent.kitRef, viewedKitTalent.archId)}
                >
                    <i class="fas {isKitSelected ? 'fa-check-square' : 'fa-plus-square'}"></i>
                    {isKitSelected ? 'SELECIONADO NO KIT (CLIQUE P/ REMOVER)' : 'SELECIONAR ESTE TALENTO NO KIT'}
                </button>
                <button class="sm-btn-ghost" type="button" on:click={() => viewedKitTalent = null}>FECHAR LEITURA</button>
            </footer>
        </div>
    </div>
{/if}

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

    .owner-bar {
        display: flex; align-items: center; justify-content: space-between; gap: 8px;
        background: rgba(0, 255, 65, 0.05); border: 1px solid rgba(0, 255, 65, 0.25);
        padding: 6px 10px; border-radius: 4px; font-size: 11px;
    }
    .owner-lbl { color: #00ff41; font-weight: bold; white-space: nowrap; }
    .owner-select {
        flex: 1; background: #08080c; border: 1px solid #333; color: #fff;
        padding: 4px 8px; border-radius: 3px; font-family: inherit; font-size: 11px;
    }
    .owner-select option { background: #111; color: #fff; }
    .owner-fixed { color: #fff; font-weight: bold; }

    .reroll-status-bar {
        font-size: 11px; padding: 6px 10px; border-radius: 4px;
        background: rgba(255, 170, 0, 0.08); border: 1px dashed rgba(255, 170, 0, 0.4);
        color: #ffaa00;
    }
    .reroll-status-bar.has-roll {
        background: rgba(0, 255, 65, 0.08); border-color: rgba(0, 255, 65, 0.4);
        color: #00ff41;
    }

    /* TALENTO PERSONALIZÁVEL */
    .custom-talent-box {
        display: flex; flex-direction: column; gap: 8px;
        background: rgba(0, 255, 65, 0.04); border: 1px solid rgba(0, 255, 65, 0.3);
        padding: 12px; border-radius: 6px;
    }
    .ct-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .ct-header h2 { font-size: 14px !important; color: #00ff41 !important; display: flex; align-items: center; gap: 6px; }
    .ct-header .desc { font-size: 11px; margin-top: 2px; }
    .btn-expand-ct {
        background: rgba(0, 255, 65, 0.1); border: 1px solid rgba(0, 255, 65, 0.4); color: #00ff41;
        width: 28px; height: 28px; border-radius: 4px; cursor: pointer; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center; transition: 0.2s;
    }
    .btn-expand-ct:hover { background: #00ff41; color: #000; }
    .ct-input {
        width: 100%; box-sizing: border-box; background: #050508; border: 1px solid #333;
        color: #fff; padding: 7px 10px; border-radius: 4px; font-family: inherit; font-size: 12px;
    }
    .ct-input:focus, .ct-textarea:focus { border-color: #00ff41; outline: none; }
    .ct-textarea {
        width: 100%; box-sizing: border-box; background: #050508; border: 1px solid #333;
        color: #ddd; padding: 8px 10px; border-radius: 4px; font-family: sans-serif; font-size: 12px;
        resize: vertical; min-height: 62px; line-height: 1.4;
    }
    .ct-textarea.expanded { flex: 1; min-height: 260px; resize: none; font-size: 13px; }
    .ct-hint { font-size: 10px; color: #88aa88; display: flex; align-items: center; gap: 6px; }
    .ct-divider { border-bottom: 1px dashed rgba(0, 255, 65, 0.25); margin: 2px 0; }
    .read-hint { color: #00d4ff; font-style: normal; font-weight: bold; }

    /* SUBMODAIS (EDITOR EXPANDIDO & VISUALIZADOR DE TALENTO SOMENTE LEITURA) */
    .submodal-backdrop {
        position: fixed; inset: 0; z-index: 40050; background: rgba(0, 0, 0, 0.82);
        backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center;
        font-family: 'Share Tech Mono', monospace; color: #fff;
    }
    .ct-expanded-modal {
        width: min(680px, 90vw); height: min(540px, 85vh);
        background: #0b0d13; border: 1px solid #00ff41; border-radius: 8px;
        box-shadow: 0 0 40px rgba(0, 255, 65, 0.25); display: flex; flex-direction: column; overflow: hidden;
    }
    .talent-viewer-modal {
        width: 780px; height: 600px; min-width: 460px; min-height: 380px; max-width: 95vw; max-height: 92vh;
        resize: both; overflow: hidden;
        background: #0b0d13; border: 1px solid #00ff41; border-radius: 8px;
        box-shadow: 0 0 50px rgba(0, 255, 65, 0.25); display: flex; flex-direction: column;
    }
    .talent-viewer-modal.maximized {
        width: 94vw !important; height: 90vh !important; resize: none;
    }
    .submodal-hdr {
        display: flex; justify-content: space-between; align-items: center; gap: 12px;
        padding: 14px 18px; background: linear-gradient(90deg, rgba(0, 255, 65, 0.12), rgba(0, 0, 0, 0.6));
        border-bottom: 1px solid rgba(0, 255, 65, 0.3); flex-shrink: 0;
    }
    .sm-title { display: flex; align-items: center; gap: 8px; color: #00ff41; font-weight: bold; font-size: 14px; letter-spacing: 1px; }
    .sm-close, .sm-icon-btn {
        background: rgba(255, 255, 255, 0.05); border: 1px solid #333; color: #aaa;
        width: 30px; height: 30px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center;
    }
    .sm-close:hover { border-color: #ff4444; color: #ff4444; }
    .sm-icon-btn:hover { border-color: #00ff41; color: #00ff41; }

    .ct-expanded-body { flex: 1; padding: 18px; display: flex; flex-direction: column; gap: 6px; overflow: hidden; }
    .ct-expanded-body label { font-size: 11px; color: #00ff41; letter-spacing: 1px; }

    .submodal-ftr {
        padding: 12px 18px; background: #07080c; border-top: 1px solid #222;
        display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-shrink: 0;
    }
    .sm-btn-primary {
        background: #00ff41; color: #000; border: none; padding: 8px 16px; border-radius: 4px;
        font-family: 'Orbitron', sans-serif; font-weight: bold; font-size: 12px; cursor: pointer;
    }
    .sm-btn-ghost {
        background: #1a1d24; color: #ccc; border: 1px solid #444; padding: 8px 16px; border-radius: 4px;
        font-family: inherit; font-weight: bold; font-size: 12px; cursor: pointer;
    }
    .sm-btn-ghost:hover { border-color: #fff; color: #fff; }
    .sm-btn-toggle {
        background: rgba(0, 255, 65, 0.1); color: #00ff41; border: 1px solid #00ff41;
        padding: 8px 14px; border-radius: 4px; font-family: inherit; font-weight: bold; font-size: 12px;
        cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s;
    }
    .sm-btn-toggle.active { background: #00ff41; color: #000; }

    /* TALENT VIEWER CONTENT */
    .tv-hdr-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
    .tv-icon { width: 46px; height: 46px; border-radius: 6px; border: 1px solid #00ff41; object-fit: cover; background: #000; }
    .tv-title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .tv-title-row h3 { margin: 0; font-family: 'Orbitron', sans-serif; font-size: 17px; color: #fff; }
    .tv-badge-ro { font-size: 9px; padding: 2px 6px; border-radius: 3px; background: rgba(0, 212, 255, 0.12); border: 1px solid rgba(0, 212, 255, 0.4); color: #00d4ff; }
    .tv-meta-row { display: flex; gap: 6px; margin-top: 5px; flex-wrap: wrap; }
    .tv-pill { font-size: 10px; padding: 2px 7px; border-radius: 3px; font-weight: bold; text-transform: uppercase; }
    .tv-pill.arch { background: #1c222d; color: #aaa; border: 1px solid #333; }
    .tv-pill.cat { background: rgba(0, 255, 65, 0.12); color: #00ff41; border: 1px solid rgba(0, 255, 65, 0.4); }
    .tv-pill.rar { background: rgba(255, 170, 0, 0.12); color: #ffaa00; border: 1px solid rgba(255, 170, 0, 0.4); }

    .tv-hdr-actions { display: flex; align-items: center; gap: 8px; }
    .tv-tabs { display: flex; border: 1px solid #333; border-radius: 4px; overflow: hidden; margin-right: 4px; }
    .tv-tabs button { background: #111; border: none; color: #888; padding: 5px 10px; font-family: inherit; font-size: 11px; font-weight: bold; cursor: pointer; }
    .tv-tabs button.active { background: #00ff41; color: #000; }

    .tv-body { flex: 1; padding: 18px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
    .tv-visual-render { flex: 1; overflow-y: auto; background: #050508; border: 1px solid #222; border-radius: 6px; padding: 10px; }

    .tv-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .tv-metric-card { background: rgba(255, 255, 255, 0.03); border: 1px solid #252a34; border-radius: 6px; padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; }
    .tv-metric-card .m-lbl { font-size: 10px; color: #888; }
    .tv-metric-card .m-val { font-family: 'Orbitron', sans-serif; font-size: 16px; font-weight: bold; color: #00ff41; }
    .tv-metric-card .m-val small { font-size: 11px; color: #777; }
    .tv-metric-card .m-val.dice { font-size: 13px; color: #00d4ff; }

    .tv-tags-bar { display: flex; gap: 6px; flex-wrap: wrap; }
    .tv-tag { font-size: 10px; padding: 2px 8px; border-radius: 10px; background: #161b22; border: 1px solid #30363d; color: #8b949e; }

    .tv-section-title { font-size: 12px; font-weight: bold; color: #00ff41; letter-spacing: 1px; border-bottom: 1px dashed #333; padding-bottom: 5px; display: flex; align-items: center; gap: 6px; }
    .tv-qualities-list { display: flex; flex-direction: column; gap: 10px; }
    .tv-q-card { background: #12151e; border: 1px solid #252a36; border-left: 3px solid #00ff41; border-radius: 6px; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
    .tv-q-hdr { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .tv-q-badge { color: #000; font-weight: bold; font-size: 11px; padding: 1px 6px; border-radius: 3px; }
    .tv-q-type { font-size: 11px; font-weight: bold; letter-spacing: 1px; }
    .tv-q-name { font-size: 14px; color: #fff; }
    .tv-q-lvl { margin-left: auto; font-size: 11px; color: #aaa; background: #090b10; padding: 2px 8px; border-radius: 4px; border: 1px solid #222; }
    .tv-q-banner img { width: 100%; max-height: 180px; object-fit: cover; border-radius: 4px; border: 1px solid #333; }
    .tv-q-desc { font-family: sans-serif; font-size: 12.5px; line-height: 1.5; color: #ddd; background: rgba(0, 0, 0, 0.35); padding: 8px 10px; border-radius: 4px; white-space: pre-wrap; }
    .tv-q-sub { display: flex; flex-direction: column; gap: 5px; }
    .tv-q-sub .sub-lbl { font-size: 10px; color: #888; font-weight: bold; letter-spacing: 0.5px; }
    .tv-caps-row, .tv-mods-row { display: flex; gap: 6px; flex-wrap: wrap; }
    .tv-cap-chip { background: #090b10; border: 1px solid #2c3545; padding: 3px 8px; border-radius: 4px; font-size: 11px; color: #cde; }
    .tv-cap-chip small { color: #8899aa; }
    .tv-mod-pill { font-size: 11px; padding: 3px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 5px; }
    .tv-mod-pill.extra { background: rgba(0, 255, 65, 0.1); border: 1px solid rgba(0, 255, 65, 0.35); color: #7fff9f; }
    .tv-mod-pill.flaw { background: rgba(255, 68, 68, 0.1); border: 1px solid rgba(255, 68, 68, 0.35); color: #ff8888; }

    .tv-empty-box { padding: 16px; text-align: center; color: #666; font-style: italic; background: rgba(0, 0, 0, 0.3); border: 1px dashed #333; border-radius: 4px; font-size: 12px; }
    .tv-notes-box { font-family: sans-serif; font-size: 13px; line-height: 1.55; color: #ddd; background: rgba(0, 255, 65, 0.04); border: 1px solid rgba(0, 255, 65, 0.2); padding: 12px; border-radius: 6px; }
</style>