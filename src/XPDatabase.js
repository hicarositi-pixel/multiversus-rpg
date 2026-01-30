const MODULE_ID = "multiversus-rpg";

export const XPDatabase = {
    getPlayerData: (userId) => {
        const user = game.users.get(userId);
        if (!user) return { initialPoints: 150, earnedXP: 0, spentXP: 0, group: "Sem Grupo", log: [] };
        
        const data = user.getFlag(MODULE_ID, "xpData") || {};
        
        return {
            initialPoints: data.initialPoints ?? 150,
            earnedXP: data.earnedXP ?? 0,
            spentXP: data.spentXP ?? 0,
            group: data.group ?? "Sem Grupo",
            log: data.log ?? []
        };
    },

    spendXP: async (userId, amount) => {
        const user = game.users.get(userId);
        let data = XPDatabase.getPlayerData(userId);
        data.spentXP += amount;
        await user.setFlag(MODULE_ID, "xpData", data);
    },

    setGroup: async (userId, groupName) => {
        const user = game.users.get(userId);
        let data = XPDatabase.getPlayerData(userId);
        data.group = groupName;
        await user.setFlag(MODULE_ID, "xpData", data);
    },

    addXP: async (userId, amount, reason = "Sessão") => {
        if (!game.user.isGM) return;
        const user = game.users.get(userId);
        let data = XPDatabase.getPlayerData(userId);
        
        // Atualiza os dados
        data.earnedXP += amount;
        data.log.unshift({ date: Date.now(), amount, reason });
        if (data.log.length > 20) data.log.pop();
        
        await user.setFlag(MODULE_ID, "xpData", data);
        
        // --- NOVO: Notifica o Discord ---
        Hooks.callAll("nexusXPGain", user, amount, reason, data.earnedXP);
        
        ui.notifications.info(`XP concedido a ${user.name}`);
    }
};