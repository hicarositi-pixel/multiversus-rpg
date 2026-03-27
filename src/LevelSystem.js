export const LEVEL_DATA = [
    { 
        lvl: 1, min: 0, max: 30, 
        limits: "1 Principal, 2 Secundários, 1 Especial/Principal, 1 Slot de Memória", 
        buffs: "150 Pontos iniciais, Origem, Kit Inicial baseado na Origem." 
    },
    { 
        lvl: 2, min: 31, max: 60, 
        limits: "1 Principal, 3 Secundários, habilidades Especiais por Poder Principal 2 Slots de Memória", 
        buffs: "+1 de HP em todas as partes, +1 Slot de Exclusividade" 
    },
    { 
        lvl: 3, min: 61, max: 90, 
        limits: "2 Principais, 4 Secundários, 2 habilidades Especiais por Poder Principal, 3 Slots de Memória", 
        buffs: "+1 de HP em todas as partes, Trait de Origem (Evolução sem debuff)" 
    },
    { 
        lvl: 4, min: 91, max: 130, 
        limits: "2 Principais, 4 Secundários, 2 habilidades Especiais por Poder Principal, 4 Slots de Memória", 
        buffs: "+1 de HP em todas as partes, +1 Slot de Exclusividade" 
    },
    { 
        lvl: 5, min: 131, max: 170, 
        limits: "3 Principais, 5 Secundários, 3 habilidades Especiais por Poder Principal, 5 Slots de Memória", 
        buffs: "+1 de HP em todas as partes" 
    },
    { 
        lvl: 6, min: 171, max: 200, 
        limits: "3 Principais, 5 Secundários, 3 habilidades Especiais por Poder Principal, 6 Slots de Memória", 
        buffs: "+1 de HP em todas as partes, Trait de Origem (Evolução sem debuff)" 
    },
    { 
        lvl: 7, min: 201, max: 240, 
        limits: "4 Principais, 6 Secundários, 4 habilidades Especiais por Poder Principal, 7 Slots de Memória", 
        buffs: "+1 de HP em todas as partes" 
    },
    { 
        lvl: 8, min: 241, max: 280, 
        limits: "4 Principais, 6 Secundários, 4 habilidades Especiais por Poder Principal, 8 Slots de Memória", 
        buffs: "+1 de HP em todas as partes, +1 Slot de Exclusividade" 
    },
    { 
        lvl: 9, min: 281, max: 320, 
        limits: "5 Principais, 7 Secundários, 5 Habilidades Especiais por Poder Principal, 9 Slots de Memória", 
        buffs: "+1 de HP em todas as partes, Trait de Origem (Evolução sem debuff)" 
    },
    { 
        lvl: 10, min: 321, max: 10000, // Deixei 10000 como teto máximo para não quebrar a lógica se passarem de 370
        limits: "5 Principais, 7 Secundários,  5 Habilidades Especiais por Poder Principal, 10 Slots de Memória", 
        buffs: "+1 de HP em todas as partes, NÍVEL MÁXIMO" 
    }
];

export const COST_TABLE = {
    stat: { normal: 5, hard: 10, wiggle: 20 },
    skill: { normal: 2, hard: 4, wiggle: 8 },
    baseWill: 3,
    willpower: 1,
    archetype: 8,
    permission: 8,
    powers: {
        main: { new: 32, dice: { normal: 8, hard: 16, wiggle: 32 } },
        secondary: { new: 16, dice: { normal: 4, hard: 8, wiggle: 6 } },
        special: { new: 8, dice: { normal: 2, hard: 4, wiggle: 8 } }
    }
};

export const LevelCalculator = {
    getLevelInfo: (earnedXP) => {
        // Encontra o nível atual baseado no XP (Se passar de 10000, crava no último nível)
        const data = LEVEL_DATA.find(l => earnedXP >= l.min && earnedXP <= l.max) || LEVEL_DATA[LEVEL_DATA.length - 1];
        
        const nextLvl = LEVEL_DATA.find(l => l.lvl === data.lvl + 1);
        let progress = 100;
        let nextXP = data.max;

        // Calcula a porcentagem da barra de XP para o próximo nível
        if (nextLvl) {
            const range = data.max - data.min;
            const current = earnedXP - data.min;
            progress = range > 0 ? (current / range) * 100 : 100;
            nextXP = data.max + 1; // XP exato necessário para "upar"
        }

        return {
            level: data.lvl,
            limits: data.limits,
            buffs: data.buffs,
            progress: Math.min(100, Math.max(0, progress)), // Mantém a barra entre 0% e 100%
            currentXP: earnedXP,
            nextXP: nextXP
        };
    }
};