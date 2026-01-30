const MODULE_ID = "multiversus-rpg";

// --- 1. DEFINIÇÕES (CONSTANTES) ---
export const PASS_TIERS = {
    COBRE:       { id: "cobre",       label: "🥉 COBRE (Padrão)",   color: "#cd7f32" },
    PRATA:       { id: "prata",       label: "🥈 PRATA",            color: "#e0e0e0" },
    OURO:        { id: "ouro",        label: "🥇 OURO",             color: "#ffcc00" },
    DIAMANTE:    { id: "diamante",    label: "💎 DIAMANTE",         color: "#00fbff" },
    GAMBIARRITE: { id: "gambiarrite", label: "☣️ GAMBIARRITE",      color: "#ff3333" }
};

// --- 2. O GERENCIADOR (Lógica + Banco de Dados) ---
export const PassSystem = {
    
    // INICIALIZAÇÃO (Registra a Setting no Foundry)
    init: () => {
        if (!game.settings) return;
        
        // Registra o banco de dados da Temporada Global
        game.settings.register(MODULE_ID, "battlePassSeason", {
            name: "Dados da Temporada",
            scope: "world",
            config: false,
            type: Object,
            default: { status: 'closed', startDate: null, endDate: null, name: 'Temporada 1' },
            onChange: () => Hooks.callAll("passSystemUpdate") // Avisa a UI para atualizar
        });

        console.log("PassSystem | Módulo de Passe Inicializado.");
    },

    // --- MÉTODOS DE TEMPORADA (Global) ---
    getSeasonData: () => {
        try {
            return game.settings.get(MODULE_ID, "battlePassSeason");
        } catch (e) {
            return { status: 'closed', startDate: null, endDate: null, name: 'Temporada X' };
        }
    },

    async updateSeason(data) {
        if (!game.user.isGM) return;
        const current = PassSystem.getSeasonData();
        const updated = { ...current, ...data };
        
        await game.settings.set(MODULE_ID, "battlePassSeason", updated);
        // Notifica via Socket para atualizar telas de outros jogadores
        game.socket.emit(`module.${MODULE_ID}`, { type: "passUpdate" });
    },

    // --- MÉTODOS DE JOGADOR (Individual via Flags) ---
    getPlayerTier: (userId) => {
        const user = game.users.get(userId);
        if (!user) return PASS_TIERS.COBRE;

        const savedId = user.getFlag(MODULE_ID, "passTier");
        // Retorna o objeto do Tier completo (Cor, Label) ou Cobre se não tiver
        return Object.values(PASS_TIERS).find(t => t.id === savedId) || PASS_TIERS.COBRE;
    },

    async setPlayerTier(userId, tierId) {
        if (!game.user.isGM) return;
        const user = game.users.get(userId);
        if (!user) return;

        await user.setFlag(MODULE_ID, "passTier", tierId);
        Hooks.callAll("passSystemUpdate");
    },

    // --- UTILITÁRIOS (Matemática) ---
    utils: {
        calculateEndDate: (startDate) => {
            const date = new Date(startDate);
            date.setMonth(date.getMonth() + 3);
            return date.getTime();
        },

        formatDate: (timestamp) => {
            if (!timestamp) return "--/--/----";
            return new Date(timestamp).toLocaleDateString("pt-BR");
        },

        getDaysRemaining: (endDate) => {
            if (!endDate) return 0;
            const now = Date.now();
            if (now > endDate) return 0;
            const diff = endDate - now;
            return Math.ceil(diff / (1000 * 60 * 60 * 24));
        }
    },

    // Busca o mapa de 12 semanas do banco de dados global
    getRewardsMap: () => {
        const season = PassSystem.getSeasonData();
        return season.rewardsMap || Array(12).fill({}).map((_, i) => ({
            week: i + 1,
            gambiarrite: null, diamante: null, ouro: null, prata: null, cobre: null
        }));
    },

    // Salva o mapa (Apenas GM)
    saveRewardsMap: async (map) => {
        if (!game.user.isGM) return;
        await PassSystem.updateSeason({ rewardsMap: map });
    },

    // Lógica STONKS: Retorna quais tiers o jogador ganha ao resgatar um específico
    getEligibleTiers: (playerTierId) => {
        const order = ["cobre", "prata", "ouro", "diamante", "gambiarrite"];
        const playerIndex = order.indexOf(playerTierId);
        return order.slice(0, playerIndex + 1); // Retorna ele e todos abaixo
    }
};

