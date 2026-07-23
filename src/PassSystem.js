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
            default: { status: 'closed', startDate: null, endDate: null, name: 'Temporada 1', id: 'Season01_PASS' },
            onChange: () => Hooks.callAll("passSystemUpdate") // Avisa a UI para atualizar
        });

        game.settings.register(MODULE_ID, "battlePassSeasonsList", {
            name: "Lista de Temporadas do Passe",
            scope: "world",
            config: false,
            type: Array,
            default: [],
            onChange: () => Hooks.callAll("passSystemUpdate")
        });

        console.log("PassSystem | Módulo de Passe Inicializado.");
    },

    // --- MÉTODOS DE TEMPORADA (Global) ---
    getSeasonsList: () => {
        try {
            let list = game.settings.get(MODULE_ID, "battlePassSeasonsList") || [];
            if (list.length === 0) {
                let current = PassSystem.getSeasonData();
                if (!current.id) current.id = "Season01_PASS";
                list = [current];
            }
            return list;
        } catch (e) {
            return [{ status: 'closed', startDate: null, endDate: null, name: 'Temporada 1', id: 'Season01_PASS' }];
        }
    },

    getSeasonData: () => {
        try {
            let current = game.settings.get(MODULE_ID, "battlePassSeason");
            if (!current || !current.id) {
                current = { ...current, status: current?.status || 'closed', startDate: current?.startDate || null, endDate: current?.endDate || null, name: current?.name || 'Temporada 1', id: current?.id || 'Season01_PASS' };
            }
            return current;
        } catch (e) {
            return { status: 'closed', startDate: null, endDate: null, name: 'Temporada X', id: 'Season01_PASS' };
        }
    },

    async updateSeason(data) {
        if (!game.user.isGM) return;
        const current = PassSystem.getSeasonData();
        const updated = { ...current, ...data };
        if (!updated.id) updated.id = "Season01_PASS";
        
        await game.settings.set(MODULE_ID, "battlePassSeason", updated);
        
        let list = PassSystem.getSeasonsList();
        const idx = list.findIndex(s => s.id === updated.id);
        if (idx !== -1) {
            list[idx] = updated;
        } else {
            list.push(updated);
        }
        await game.settings.set(MODULE_ID, "battlePassSeasonsList", list);
        
        game.socket.emit(`module.${MODULE_ID}`, { type: "passUpdate" });
        Hooks.callAll("passSystemUpdate");
    },

    async switchSeason(seasonId) {
        if (!game.user.isGM) return;
        const list = PassSystem.getSeasonsList();
        const found = list.find(s => s.id === seasonId);
        if (found) {
            await game.settings.set(MODULE_ID, "battlePassSeason", found);
            game.socket.emit(`module.${MODULE_ID}`, { type: "passUpdate" });
            Hooks.callAll("passSystemUpdate");
        }
    },

    async createSeason(name, seasonId, startDate = null, endDate = null) {
        if (!game.user.isGM) return;
        let list = PassSystem.getSeasonsList();
        let newId = seasonId || `Season0${list.length + 1}_PASS`;
        if (list.find(s => s.id === newId)) {
            newId = `Season0${list.length + 1}_${foundry.utils.randomID().slice(0,4)}_PASS`;
        }
        
        const emptyMap = Array(12).fill({}).map((_, i) => ({
            week: i + 1,
            gambiarrite: null, diamante: null, ouro: null, prata: null, cobre: null
        }));
        
        const newSeason = {
            id: newId,
            name: name || `Temporada ${list.length + 1}`,
            status: 'closed',
            startDate: startDate || Date.now(),
            endDate: endDate || (Date.now() + 1000 * 60 * 60 * 24 * 90),
            rewardsMap: emptyMap
        };
        
        list.push(newSeason);
        await game.settings.set(MODULE_ID, "battlePassSeasonsList", list);
        await game.settings.set(MODULE_ID, "battlePassSeason", newSeason);
        game.socket.emit(`module.${MODULE_ID}`, { type: "passUpdate" });
        Hooks.callAll("passSystemUpdate");
        return newSeason;
    },

    async deleteSeason(seasonId) {
        if (!game.user.isGM) return;
        let list = PassSystem.getSeasonsList();
        if (list.length <= 1) return ui?.notifications?.warn("Você não pode deletar o único passe existente.");
        list = list.filter(s => s.id !== seasonId);
        await game.settings.set(MODULE_ID, "battlePassSeasonsList", list);
        const current = PassSystem.getSeasonData();
        if (current.id === seasonId && list[0]) {
            await game.settings.set(MODULE_ID, "battlePassSeason", list[0]);
        }
        game.socket.emit(`module.${MODULE_ID}`, { type: "passUpdate" });
        Hooks.callAll("passSystemUpdate");
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

