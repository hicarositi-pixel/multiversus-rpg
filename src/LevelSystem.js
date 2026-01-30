export const LEVEL_DATA = [
    { lvl: 1, min: 0, max: 50, limits: "1 Principal, 1 Secundário, 1 Especial", buffs: "Criação Padrão (150 Pontos)" },
    { lvl: 2, min: 51, max: 100, limits: "1 Principal, 2 Secundários, 2 Especiais", buffs: "+1 Base Will, +1 Wound Box, +1 HD Stat, +1 WD Skill, +1 Trait" },
    { lvl: 3, min: 101, max: 200, limits: "2 Principais, 2 Secundários, 2 Especiais", buffs: "+1 Base Will, +1 Wound Box, +1 HD Stat, +1 WD Skill, +1 Trait" },
    { lvl: 4, min: 201, max: 300, limits: "2 Principais, 3 Secundários, 3 Especiais", buffs: "+1 Base Will, +1 Wound Box, +1 HD Stat, +1 WD Skill, +1 Trait" },
    { lvl: 5, min: 301, max: 400, limits: "2 Principais, 3 Secundários, 3 Especiais", buffs: "+1 Base Will, +1 Wound Box, +1 HD Stat, +1 WD Skill, +1 Trait" },
    { lvl: 6, min: 401, max: 500, limits: "3 Principais, 4 Secundários, 4 Especiais", buffs: "+1 Base Will, +1 Wound Box, +1 HD Stat, +1 WD Skill, +1 Trait" },
    { lvl: 7, min: 501, max: 650, limits: "3 Principais, 4 Secundários, 4 Especiais", buffs: "+1 Base Will, +1 Wound Box, +1 HD Stat, +1 WD Skill, +1 Trait" },
    { lvl: 8, min: 651, max: 800, limits: "3 Principais, 5 Secundários, 5 Especiais", buffs: "+1 Base Will, +1 Wound Box, +1 HD Stat, +1 WD Skill, +1 Trait" },
    { lvl: 9, min: 801, max: 950, limits: "4 Principais, 5 Secundários, 5 Especiais", buffs: "+1 Base Will, +1 Wound Box, +1 HD Stat, +1 WD Skill, +1 Trait" },
    { lvl: 10, min: 951, max: 10000, limits: "5 Principais, 6 Secundários, 6 Especiais", buffs: "NÍVEL MÁXIMO" }
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
        secondary: { new: 16, dice: { normal: 4, hard: 8, wiggle: 6 } }, // Ajustado wiggle conforme tabela
        special: { new: 8, dice: { normal: 2, hard: 4, wiggle: 8 } }
    }
};

export const LevelCalculator = {
    getLevelInfo: (earnedXP) => {
        const data = LEVEL_DATA.find(l => earnedXP >= l.min && earnedXP <= l.max) || LEVEL_DATA[LEVEL_DATA.length - 1];
        
        const nextLvl = LEVEL_DATA.find(l => l.lvl === data.lvl + 1);
        let progress = 100;
        let nextXP = data.max;

        if (nextLvl) {
            const range = data.max - data.min;
            const current = earnedXP - data.min;
            progress = range > 0 ? (current / range) * 100 : 100;
            nextXP = data.max + 1;
        }

        return {
            level: data.lvl,
            limits: data.limits,
            buffs: data.buffs,
            progress: Math.min(100, Math.max(0, progress)),
            currentXP: earnedXP,
            nextXP: nextXP
        };
    }
};