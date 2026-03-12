/**
 * effect.js
 * Motor de Regras Específicas, Efeitos e Cálculos de Jogo
 * Caminho: src/Logic/effect.js
 */

import { ResumoLogic } from './resumo.js';
import { ExtrasLogic } from './Extras.js';

const MODULE_ID = "multiversus-rpg";

// Tabela Oficial de Capacidades ORE (1d a 10d+)
// HD e WD contam como dados normais (1 dado cada) para fins de capacidade bruta.
const BODY_CAPACITY_TABLE = {
    0: { lift: 0, throw: 0, dmg: "Nenhum", sprint: 0, jumpL: 0, jumpH: 0 },
    1: { lift: 50, throw: 6.2, dmg: "Shock", sprint: 8, jumpL: 2, jumpH: 0.5 },
    2: { lift: 100, throw: 12.5, dmg: "Shock", sprint: 10, jumpL: 3, jumpH: 1 },
    3: { lift: 200, throw: 25, dmg: "Shock", sprint: 12, jumpL: 4, jumpH: 1 },
    4: { lift: 400, throw: 50, dmg: "Shock", sprint: 15, jumpL: 5, jumpH: 1 },
    5: { lift: 800, throw: 100, dmg: "Shock", sprint: 20, jumpL: 6, jumpH: 1.5 },
    6: { lift: 1600, throw: 200, dmg: "Killing", sprint: 25, jumpL: 8, jumpH: 2 },
    7: { lift: 3200, throw: 400, dmg: "Killing", sprint: 30, jumpL: 10, jumpH: 2.5 },
    8: { lift: 6400, throw: 800, dmg: "Shock & Killing", sprint: 40, jumpL: 12, jumpH: 3 },
    9: { lift: 12800, throw: 1600, dmg: "Shock & Killing", sprint: 50, jumpL: 15, jumpH: 4 },
    10: { lift: 25600, throw: 3200, dmg: "Shock & Killing", sprint: 60, jumpL: 20, jumpH: 5 }
};

export const EffectLogic = {

    // --- 1. FUNÇÃO AUXILIAR: CONTAR DADOS TOTAIS ---
    /**
     * Calcula o total de dados (D + HD + WD) de um atributo específico.
     * Na regra ORE, para capacidades de peso/distância, o tipo do dado não importa,
     * apenas a QUANTIDADE total de dados na pool daquele atributo.
     */
    _getTotalDiceForStat: (actor, statKey) => {
        // Usa o resumo.js para buscar a pool de dados pura do atributo
        const statPool = ResumoLogic.buildSimpleRollPool(actor, statKey);
        return statPool.d + statPool.hd + statPool.wd;
    },

    // --- 2. CÁLCULO EXTRAPOLADO (PARA MAIS DE 10 DADOS) ---
    /**
     * Se um jogador tiver, por exemplo, 12 dados de Corpo por causa de um poder,
     * a tabela original para no 10. Isso faz a matemática continuar dobrando.
     */
    _extrapolateBodyCapacity: (diceTotal) => {
        if (diceTotal <= 10) return BODY_CAPACITY_TABLE[diceTotal];
        
        // A partir do 10, o peso dobra a cada dado.
        // 10d = 12.8 tons. 11d = 25.6 tons. 12d = 51.2 tons...
        const diff = diceTotal - 10;
        const multiplier = Math.pow(2, diff); 
        
        return {
            lift: 25600 * multiplier, // Retorna valor numérico puro para o ExtrasLogic processar
            throw: 3200 * multiplier,
            dmg: "Shock & Killing (Devastador)", // Dano continua como string
            // Movimento e pulo escalam de forma mais linear/suave no ORE do que peso
            sprint: 60 + (diff * 10),
            jumpL: 20 + (diff * 5),
            jumpH: 5 + (diff * 1.5)
        };
    },

    // --- 3. CÁLCULO DA MATEMÁTICA CORPORAL (COM SUBSTITUIÇÕES) ---
    /**
     * Retorna a capacidade física do personagem.
     * Permite modificadores (ex: poderes que dão bônus) e substituições 
     * (ex: usar 'mind' para calcular o 'lift' via Telecinese).
     * @param {Object} actor - O documento do ator no Foundry
     * @param {Object} overrides - Objeto com substituições (Opcional)
     * Exemplo de overrides: { baseStat: 'body', liftStat: 'mind', jumpBonus: +2, boosterLevels: 1, willpowerSpent: 2 }
     */
    calculateBodyMetrics: (actor, overrides = {}) => {
        if (!actor) return null;

        // 1. Define qual atributo rege o que (Padrão: tudo é 'body')
        const statKeys = {
            lift: overrides.liftStat || overrides.baseStat || 'body',
            throw: overrides.throwStat || overrides.baseStat || 'body',
            dmg: overrides.dmgStat || overrides.baseStat || 'body',
            sprint: overrides.sprintStat || overrides.baseStat || 'body',
            jump: overrides.jumpStat || overrides.baseStat || 'body'
        };

        // 2. Busca o total de dados para cada capacidade e soma bônus flat se existirem
        const diceTotals = {
            lift: EffectLogic._getTotalDiceForStat(actor, statKeys.lift) + (overrides.liftBonus || 0),
            throw: EffectLogic._getTotalDiceForStat(actor, statKeys.throw) + (overrides.throwBonus || 0),
            dmg: EffectLogic._getTotalDiceForStat(actor, statKeys.dmg) + (overrides.dmgBonus || 0),
            sprint: EffectLogic._getTotalDiceForStat(actor, statKeys.sprint) + (overrides.sprintBonus || 0),
            jump: EffectLogic._getTotalDiceForStat(actor, statKeys.jump) + (overrides.jumpBonus || 0)
        };

        // 3. Extrai a base bruta (em números puros)
        const rawBase = {
            lift: EffectLogic._extrapolateBodyCapacity(diceTotals.lift).lift,
            throw: EffectLogic._extrapolateBodyCapacity(diceTotals.throw).throw,
            dmg: EffectLogic._extrapolateBodyCapacity(diceTotals.dmg).dmg,
            sprint: EffectLogic._extrapolateBodyCapacity(diceTotals.sprint).sprint,
            jumpL: EffectLogic._extrapolateBodyCapacity(diceTotals.jump).jumpL,
            jumpH: EffectLogic._extrapolateBodyCapacity(diceTotals.jump).jumpH,
        };

        // 4. Passa os valores puros pelo filtro de Extras Universais para aplicar Booster e NUL
        return {
            lift: ExtrasLogic.calculateFinalCapacity(rawBase.lift, 'lift', overrides).display,
            throw: ExtrasLogic.calculateFinalCapacity(rawBase.throw, 'throw', overrides).display,
            baseDamage: ExtrasLogic.calculateFinalCapacity(rawBase.dmg, 'dmg', overrides).display,
            sprint: ExtrasLogic.calculateFinalCapacity(rawBase.sprint, 'sprint', overrides).display,
            jumpLength: ExtrasLogic.calculateFinalCapacity(rawBase.jumpL, 'jumpLength', overrides).display,
            jumpHeight: ExtrasLogic.calculateFinalCapacity(rawBase.jumpH, 'jumpHeight', overrides).display,
            // Guardamos os dados brutos caso a interface precise mostrar "Quantos dados foram usados"
            rawDiceUsed: diceTotals
        };
    },

    // =========================================================
    // CÁLCULOS DE CAPACIDADES DE PODERES (WILD TALENTS / ORE)
    // =========================================================

    // --- 4. CALCULAR CAPACIDADE DE UM PODER ---
    /**
     * Calcula Mass, Range ou Speed baseado na regra do ORE com Boosters Lineares (x10) e NUL Exponencial.
     */
    calculatePowerCapacity: (diceTotal, type, nul = 0, booster = 0) => {
        const BASE_TABLE = [
            { d: 1, mass: 50, range: 10, speed: 2 },
            { d: 2, mass: 100, range: 20, speed: 5 },
            { d: 3, mass: 200, range: 40, speed: 10 },
            { d: 4, mass: 400, range: 80, speed: 20 },
            { d: 5, mass: 800, range: 160, speed: 40 },
            { d: 6, mass: 1600, range: 320, speed: 80 },
            { d: 7, mass: 3200, range: 640, speed: 160 },
            { d: 8, mass: 6400, range: 1280, speed: 320 },
            { d: 9, mass: 12800, range: 2560, speed: 640 },
            { d: 10, mass: 25600, range: 5120, speed: 1280 }
        ];

        let baseVal = 0;
        
        if (diceTotal > 0) {
            if (diceTotal <= 10) {
                baseVal = BASE_TABLE[diceTotal - 1][type];
            } else {
                let val10 = BASE_TABLE[9][type];
                let extraDice = diceTotal - 10;
                baseVal = val10 * Math.pow(2, extraDice);
            }
        }

        // Passa o valor base para a Lógica de Extras resolver o Booster e NUL
        // Retorna o objeto completo formatado pelo ExtrasLogic
        return ExtrasLogic.calculateFinalCapacity(baseVal, type, { boosterLevels: booster, willpowerSpent: nul });
    },

    // --- 5. OBTER MAIOR ALCANCE/VELOCIDADE DE UM ATOR ---
    /**
     * Automação Suprema: Varre todos os poderes do ator e descobre qual
     * é a distância máxima que ele consegue atacar ou correr/voar usando poderes.
     */
    getMaxPowerCapacities: (actor) => {
        // Usa o Resumo para puxar os poderes limpos
        const powers = ResumoLogic.getActivePowers(actor);
        
        let maxRangeYards = 0;
        let maxSpeedYards = 0;
        let maxRangeText = "N/A";
        let maxSpeedText = "N/A";

        // Varre poder por poder
        for (const p of powers) {
            const qualities = p.rawItem?.flags?.[MODULE_ID]?.qualities || [];
            const totalDice = p.dice.d + p.dice.hd + p.dice.wd;

            for (const q of qualities) {
                const caps = q.capacities || [];
                
                for (const c of caps) {
                    const result = EffectLogic.calculatePowerCapacity(totalDice, c.type, c.nul, c.booster);
                    
                    // Lógica para separar alcance do ataque vs utilidade/velocidade
                    if (!result.isAbsolute) {
                        if (c.type === 'range' && q.type === 'atk' && result.rawValue > maxRangeYards) {
                            maxRangeYards = result.rawValue;
                            maxRangeText = result.display; // Guarda o texto formatado do maior ataque
                        }
                        if (c.type === 'speed' && result.rawValue > maxSpeedYards) {
                            maxSpeedYards = result.rawValue;
                            maxSpeedText = result.display;
                        }
                    }
                }
            }
        }

        return {
            maxAttackRange: maxRangeText,
            maxTravelSpeed: maxSpeedText
        };
    }
};