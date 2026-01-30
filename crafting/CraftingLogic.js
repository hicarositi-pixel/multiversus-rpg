/**
 * MULTIVERSUS 2.0 - Lógica de Crafting e Sobrevivência
 * Local: /crafting/CraftingLogic.js
 */

// Simulação das constantes (Baseado nos JSONs que definimos)
const CONSTANTS = {
    REFINERY_RATE: 20, // 20 Comuns = 1 Raro
    RARITY_STATS: {
        1: { label: "Comum", hp_mod: 5, har: 0 },
        2: { label: "Raro", hp_mod: 10, har: 2 },
        3: { label: "Lendário", hp_mod: 20, har: 4 },
        4: { label: "Mítico", hp_mod: 40, har: 6 },
        5: { label: "Universal", hp_mod: 80, har: 10 },
        6: { label: "Multiversal", hp_mod: 200, har: 20 }
    },
    NPC_PRODUCTION: {
        "COMUM": { prod: 2, combat_dice: 1 },
        "RARO": { prod: 4, combat_dice: 2 },
        "LENDARIO": { prod: 8, combat_dice: 4 }
    }
};

export const CraftingLogic = {

    /**
     * 1. REFINARIA
     * Tenta converter 20 unidades de Tier N para 1 unidade de Tier N+1
     */
    refineMaterial(inventory, type, fromTier) {
        const tierStr = String(fromTier);
        const nextTierStr = String(parseInt(fromTier) + 1);
        
        // Verifica se tem material suficiente
        if (!inventory[type] || (inventory[type][tierStr] || 0) < CONSTANTS.REFINERY_RATE) {
            return { success: false, msg: `Recursos insuficientes. Precisa de ${CONSTANTS.REFINERY_RATE}x Tier ${fromTier}.` };
        }

        // Executa a troca (retorna o delta para ser aplicado na ficha)
        return {
            success: true,
            msg: `Refino concluído: 1x ${type} Tier ${nextTierStr} criado.`,
            cost: { type, tier: tierStr, amount: CONSTANTS.REFINERY_RATE },
            gain: { type, tier: nextTierStr, amount: 1 }
        };
    },

    /**
     * 2. BUILDING LOGIC (ESTRUTURAS)
     * Calcula HP e HAR baseados na quantidade e raridade do material
     */
    calculateStructureStats(templateType, materialTier, amount) {
        const stats = CONSTANTS.RARITY_STATS[materialTier] || CONSTANTS.RARITY_STATS[1];
        
        // Ex: Parede Comum (20 unid) = 20 * 5 = 100 HP. Parede Rara (20 unid) = 20 * 10 = 200 HP.
        // Se for um "Portão" (templateType), poderia ter multiplicadores extras aqui.
        const finalHP = amount * stats.hp_mod; 
        const finalHAR = stats.har;

        return {
            hp: finalHP,
            har: finalHAR,
            desc: `Estrutura Tier ${materialTier} (${stats.label}) feita com ${amount} unidades.`
        };
    },

    /**
     * 3. PRODUÇÃO DE NPCS
     * Calcula o total gerado pelos NPCs em um Ciclo de Sessão
     */
    calculateNpcOutput(npcList) {
        let output = { MATERIA: 0, ORGANISMO: 0, ENERGIA: 0 };
        let combatSupport = 0; // Quantos NPCs estão guardando/lutando

        npcList.forEach(npc => {
            const data = CONSTANTS.NPC_PRODUCTION[npc.rarity] || CONSTANTS.NPC_PRODUCTION["COMUM"];
            
            if (npc.role === "Coletor") output.MATERIA += data.prod;
            else if (npc.role === "Provident") output.ORGANISMO += data.prod;
            else if (npc.role === "Tecnico") output.ENERGIA += data.prod;
            else if (npc.role === "Guarda") combatSupport++;
        });

        return { resources: output, combatNpcs: combatSupport };
    },

    /**
     * 4. VALIDAÇÃO DE BANCADA
     * Verifica se a bancada aguenta o tier do material
     */
    checkWorkbenchRequirement(materialTier, workbenchLevel) {
        if (workbenchLevel >= materialTier) {
            return { allowed: true };
        } else {
            return { allowed: false, msg: `Nível da Bancada insuficiente (Atual: ${workbenchLevel} | Req: ${materialTier})` };
        }
    },

    /**
     * 5. LÓGICA DE SESSÃO (ESFORÇO)
     * Gerencia o gasto de ações e recuperação
     */
    processRest(currentExhaustion, actionType) {
        // actionType: 'SIMPLE' (1 ação) ou 'DEEP' (2 ações)
        if (actionType === 'DEEP') {
            return { 
                wpGain: 2, 
                exhaustionHeal: 2, 
                cost: 2,
                msg: "Descanso Profundo: Recuperou 2 WP e limpou exaustão." 
            };
        } else {
            return { 
                wpGain: 1, 
                exhaustionHeal: 0, 
                cost: 1,
                msg: "Descanso Simples: Recuperou 1 WP." 
            };
        }
    }
};