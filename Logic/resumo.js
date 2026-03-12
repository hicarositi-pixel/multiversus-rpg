/**
 * resumo.js
 * Extrator e Formatador Central de Dados do Ator (Data Access Layer)
 * Caminho: src/Logic/resumo.js
 */

const MODULE_ID = "multiversus-rpg";

const ATTR_CONFIG = {
    body: { label: "CORPO", icon: "fa-fist-raised" },
    coordination: { label: "COORDENAÇÃO", icon: "fa-running" },
    sense: { label: "SENTIDOS", icon: "fa-eye" },
    mind: { label: "MENTE", icon: "fa-brain" },
    charm: { label: "CHARME", icon: "fa-comments" },
    command: { label: "COMANDO", icon: "fa-crown" }
};

// Estrutura padrão de segurança caso o ator não tenha o corpo inicializado
const DEFAULT_LIMBS = [
    { id: 'leg-l', name: 'P.ESQ', loc: '1', hp: 4, lar: 0, har: 0, killing: 0, shock: 0, trauma: [] },
    { id: 'leg-r', name: 'P.DIR', loc: '2', hp: 4, lar: 0, har: 0, killing: 0, shock: 0, trauma: [] },
    { id: 'arm-l', name: 'B.ESQ', loc: '3-4', hp: 4, lar: 0, har: 0, killing: 0, shock: 0, trauma: [] },
    { id: 'arm-r', name: 'B.DIR', loc: '5-6', hp: 4, lar: 0, har: 0, killing: 0, shock: 0, trauma: [] },
    { id: 'torso', name: 'TORSO', loc: '7-9', hp: 7, lar: 0, har: 0, killing: 0, shock: 0, trauma: [] },
    { id: 'head', name: 'CABEÇA', loc: '10', hp: 4, lar: 0, har: 0, killing: 0, shock: 0, trauma: [] }
];

export const ResumoLogic = {

    // --- 1. getBasicInfo ---
    getBasicInfo: (actor) => {
        if (!actor) return null;
        const flags = actor.flags[MODULE_ID] || {};
        return {
            id: actor.id,
            name: actor.name,
            img: actor.img,
            xp: actor.system?.xp || flags.xp || 0
        };
    },

    // --- 2. getActiveStatsAndSkills ---
    getActiveStatsAndSkills: (actor) => {
        if (!actor) return [];
        const flags = actor.flags[MODULE_ID] || {};
        const stats = flags.stats || {};
        const skills = flags.skills || {};

        let summaryTable = [];
        for (const [key, config] of Object.entries(ATTR_CONFIG)) {
            const statData = stats[key] || { normal: 1, hard: 0, wiggle: 0 };
            const activeSkills = (skills[key] || []).filter(sk => sk.normal > 0 || sk.hard > 0 || sk.wiggle > 0);
            summaryTable.push({
                id: key, label: config.label, icon: config.icon,
                dice: { d: statData.normal, hd: statData.hard, wd: statData.wiggle },
                skills: activeSkills.map(sk => ({ name: sk.name, img: sk.img, dice: { d: sk.normal, hd: sk.hard, wd: sk.wiggle } }))
            });
        }
        return summaryTable;
    },

    // --- 3. buildSimpleRollPool ---
    buildSimpleRollPool: (actor, statKey, skillName = null) => {
        const flags = actor?.flags[MODULE_ID] || {};
        const baseStat = (flags.stats || {})[statKey] || { normal: 1, hard: 0, wiggle: 0 };
        let finalPool = { d: baseStat.normal, hd: baseStat.hard, wd: baseStat.wiggle, spray: 0 };

        if (skillName && flags.skills?.[statKey]) {
            const skill = flags.skills[statKey].find(s => s.name.toLowerCase() === skillName.toLowerCase());
            if (skill) { finalPool.d += skill.normal; finalPool.hd += skill.hard; finalPool.wd += skill.wiggle; }
        }
        return finalPool;
    },

    // =========================================================
    // NOVAS FUNÇÕES: AUTOMAÇÃO DE CORPO E COMBATE
    // =========================================================

    // --- 4. getGlobalTraumaDB ---
    /**
     * Puxa o banco de dados global de Condições/Traumas.
     */
    getGlobalTraumaDB: () => {
        try {
            return game.settings.get(MODULE_ID, 'traumaDB');
        } catch (e) {
            return {}; // Retorna vazio caso dê erro (ex: settings não inicializados)
        }
    },

    // --- 5. getBodyData ---
    /**
     * Retorna o estado completo do corpo do personagem (Forma Base ou Transformação).
     * Essa função já "mastiga" os dados, calculando se o membro está destruído
     * e anexando as informações visuais do Trauma para facilitar o uso na UI ou Macros.
     */
    getBodyData: (actor, form = 'base') => {
        if (!actor) return [];
        const flagKey = form === 'base' ? 'limbs_base' : 'limbs_trans';
        let limbs = actor.getFlag(MODULE_ID, flagKey) || JSON.parse(JSON.stringify(DEFAULT_LIMBS));
        
        const traumaDB = ResumoLogic.getGlobalTraumaDB();

        // Mapeia os membros enriquecendo com dados de status
        return limbs.map(limb => {
            // Garante array
            const traumas = limb.trauma || [];
            
            // Calcula ocupação e status
            const occupiedSlots = limb.killing + limb.shock + traumas.length;
            const isDestroyed = limb.killing >= limb.hp;
            
            // Hidrata os traumas com os dados do banco global
            const hydratedTraumas = traumas.map(t => ({
                ...t,
                details: traumaDB[t.type] || { label: "Desconhecido", color: "#fff", icon: "Biohazard" }
            }));

            return {
                ...limb,
                trauma: hydratedTraumas,
                status: {
                    occupiedSlots,
                    isDestroyed,
                    isFull: occupiedSlots >= limb.hp
                }
            };
        });
    },

    // --- 6. getLimbByHitLocation ---
    /**
     * FUNÇÃO DE AUTOMAÇÃO (ORE):
     * Você passa a Altura (Height) do Conjunto rolado no ORE,
     * e ela te devolve qual parte do corpo foi atingida e a Armadura dela!
     */
    getLimbByHitLocation: (actor, hitHeight, form = 'base') => {
        const limbs = ResumoLogic.getBodyData(actor, form);
        
        return limbs.find(limb => {
            const locStr = String(limb.loc);
            
            // Checa intervalos (ex: "7-9")
            if (locStr.includes('-')) {
                const [min, max] = locStr.split('-').map(Number);
                return hitHeight >= min && hitHeight <= max;
            }
            // Checa valores únicos (ex: "10")
            return Number(locStr) === hitHeight;
        }) || null; // Retorna null se, por algum motivo, bater num número não mapeado
    },

    // --- 7. calculateAutomatedDamage ---
    /**
     * FUNÇÃO DE AUTOMAÇÃO MATEMÁTICA:
     * Pega o dano recebido e a armadura do membro, faz toda a matemática do ORE 
     * (HAR cancela dano, LAR converte Killing em Shock, Overflow de Shock vira Killing)
     * e retorna o NOVO estado do membro pronto para ser salvo no banco de dados.
     */
    calculateAutomatedDamage: (limb, incomingShock = 0, incomingKilling = 0) => {
        let S_in = Number(incomingShock);
        let K_in = Number(incomingKilling);
        const LAR = Number(limb.lar || 0);
        const HAR = Number(limb.har || 0);

        // Regra ORE: HAR reduz primeiro (2 Shock para cada 1 HAR, 1 Killing para cada 1 HAR)
        if (HAR > 0) { 
            S_in = Math.max(0, S_in - (HAR * 2)); 
            K_in = Math.max(0, K_in - HAR); 
        }

        // Regra ORE: LAR reduz Shock, e CONVERTE Killing em Shock
        let S_final = Math.max(0, S_in - LAR);
        let converted_K = Math.min(K_in, LAR);
        let K_final = K_in - converted_K;
        S_final += converted_K; // O Killing convertido soma no Shock final

        const curK = limb.killing;
        const curS = limb.shock;
        const hp = limb.hp;
        const occupiedByTrauma = (limb.trauma || []).length; 

        let tempK = curK + K_final;
        let finalK = tempK;
        let finalS = curS;
        
        // Se Killing já for maior ou igual ao HP, destrói instantaneamente
        if (tempK >= hp) {
            finalK = hp; 
            finalS = 0;
        } else {
            let tempS = curS + S_final;
            let totalSpace = hp - occupiedByTrauma;
            let totalDamage = tempK + tempS;

            // Regra ORE: Shock que passa do limite vira Killing (Overflow)
            if (totalDamage > totalSpace) {
                let overflow = totalDamage - totalSpace;
                tempK += overflow;
                finalK = Math.min(totalSpace, tempK);
                finalS = Math.max(0, totalSpace - finalK);
            } else {
                finalK = tempK; 
                finalS = tempS;
            }
        }

        // Retorna o objeto do membro atualizado (sem alterar o original diretamente)
        return {
            ...limb,
            killing: finalK,
            shock: finalS
        };
    },

    // --- 8. getWillpowerData ---
    /**
     * Extrai os dados de Vontade do jogador.
     * Base Will = Valor Máximo / Teto
     * Willpower = Valor Atual / Recurso Gasto
     */
// --- 8. getWillpowerData ---
    /**
     * Extrai os dados de Vontade do jogador sincronizados com a ficha.
     * Base Will = Comando + Charme + Nível + Comprados
     * Willpower Máximo = Base Will
     */
    getWillpowerData: (actor) => {
        if (!actor) return null;

        const flags = actor.flags[MODULE_ID] || {};
        
        // 1. Puxa os stats (priorizando as flags do módulo, depois o system)
        const statCharm = Number(actor.system?.stats?.charm?.value || actor.system?.attributes?.charm?.value || flags.stats?.charm?.normal || 1);
        const statCommand = Number(actor.system?.stats?.command?.value || actor.system?.attributes?.command?.value || flags.stats?.command?.normal || 1);

        // 2. Calcula o Nível
        const gmMode = flags.gmOverride || false;
        const customLevel = flags.customLevel || 1;
        const xpEarned = actor.system?.xp || flags.xp || 0;
        
        let activeLevel = 1;
        if (gmMode) {
            activeLevel = customLevel;
        } else {
            // Simulação rápida do level calculator caso o import não funcione por path
            // Tabela: lvl 1 (0-50), lvl 2 (51-100), lvl 3 (101-200), lvl 4 (201-300)...
            if (xpEarned <= 50) activeLevel = 1;
            else if (xpEarned <= 100) activeLevel = 2;
            else if (xpEarned <= 200) activeLevel = 3;
            else if (xpEarned <= 300) activeLevel = 4;
            else if (xpEarned <= 400) activeLevel = 5;
            else if (xpEarned <= 500) activeLevel = 6;
            else if (xpEarned <= 650) activeLevel = 7;
            else if (xpEarned <= 800) activeLevel = 8;
            else if (xpEarned <= 950) activeLevel = 9;
            else activeLevel = 10;
        }

        // 3. Puxa os bônus comprados com XP
        const boughtBaseWill = flags.boughtBaseWill || 0;

        // 4. Cálculos do Teto (Máximos)
        const maxBaseWill = statCharm + statCommand + activeLevel + boughtBaseWill;
        const maxWillpower = maxBaseWill; // WP Maximo é sempre o Base Will

        // 5. Valores Atuais (O que realmente importa para a barra azul do HUD)
        const currentBaseWill = flags.currBaseWill !== undefined ? flags.currBaseWill : maxBaseWill;
        const currentWillpower = flags.currWillpower !== undefined ? flags.currWillpower : maxWillpower;

        return {
            baseWill: {
                current: currentBaseWill,
                max: maxBaseWill,
                percentage: maxBaseWill > 0 ? Math.round((currentBaseWill / maxBaseWill) * 100) : 0
            },
            willpower: {
                current: currentWillpower,
                max: maxWillpower,
                percentage: maxWillpower > 0 ? Math.round((currentWillpower / maxWillpower) * 100) : 0
            }
        };
    },

    // --- 9. getIdentityData ---
    /**
     * Puxa nome, imagem e Origem do personagem (útil para o cabeçalho do resumo).
     */
    getIdentityData: (actor) => {
        if (!actor) return null;
        
        const flags = actor.flags[MODULE_ID] || {};
        
        return {
            name: actor.name,
            img: actor.img,
            origin: flags.origin || "humano",
            lore: flags.bio_lore || "",
            motivations: flags.bio_motivations || []
        };
    },

    // --- 10. getActivePowers ---
    /**
     * Varre o inventário do Ator, filtra apenas os Poderes (type === "power")
     * e extrai Nome, Imagem, Categoria e a Pool de Dados de cada um.
     */
    getActivePowers: (actor) => {
        if (!actor || !actor.items) return [];

        // Filtra apenas os itens do tipo poder
        const rawPowers = actor.items.filter(i => i && i.type === "power");

        // Formata os dados para o Resumo e para Macros
        return rawPowers.map(item => {
            const iFlags = item.flags?.[MODULE_ID] || {};
            const iSys = item.system || {};

            return {
                id: item.id,
                name: item.name,
                img: item.img,
                category: iFlags.category || "principal",
                isInitial: iFlags.isInitial || false,
                dice: {
                    d: Number(iFlags.dice?.normal || iSys.dice?.normal || 0),
                    hd: Number(iFlags.dice?.hard || iSys.dice?.hard || 0),
                    wd: Number(iFlags.dice?.wiggle || iSys.dice?.wiggle || 0)
                },
                // Passamos o item original junto caso uma macro precise alterar algo nele depois
                rawItem: item 
            };
        }).sort((a, b) => a.name.localeCompare(b.name)); // Retorna em ordem alfabética
    },

    // --- 11. buildPowerRollPool ---
    /**
     * Recebe um objeto de Poder (puxado do getActivePowers ou do próprio Item)
     * e formata a Pool pronta para o motor ORE.
     * Inclui espaço para o Spray (que pode ser perguntado na UI antes de rolar).
     */
    buildPowerRollPool: (powerObject, addedSpray = 0) => {
        if (!powerObject || !powerObject.dice) {
            return { d: 0, hd: 0, wd: 0, spray: 0 };
        }

        return {
            d: powerObject.dice.d,
            hd: powerObject.dice.hd,
            wd: powerObject.dice.wd,
            spray: addedSpray
        };
    },
// --- 12. getPowerCapacities ---
    /**
     * Lê as qualidades e capacidades de um poder específico.
     * Retorna a lista detalhada para exibição e uso nos cálculos de efeito.
     */
    getPowerCapacities: (powerItem) => {
        if (!powerItem) return [];

        const flags = powerItem.flags?.[MODULE_ID] || {};
        const qualities = flags.qualities || [];
        const diceData = flags.dice || { normal: 0, hard: 0, wiggle: 0 };
        const totalDice = (diceData.normal || 0) + (diceData.hard || 0) + (diceData.wiggle || 0);

        // Mapeia e já prepara os dados para a interface e para a lógica de automação
        return qualities.map(q => {
            return {
                name: q.name,
                type: q.type, // 'atk', 'def', 'util'
                level: q.level || 0,
                desc: q.description || "",
                // O Svelte vai poder ler e usar rawData se precisar calcular na UI,
                // mas nós já vamos passar os dados crus pro effect.js depois
                rawCapacities: q.capacities || [],
                totalDiceRef: totalDice
            };
        });
    },
    

};