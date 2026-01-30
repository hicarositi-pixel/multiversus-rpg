const MODULE_ID = "multiversus-rpg";

export const MiroDatabase = {
    ensureRegistered: () => {
        if (!game.settings.settings.has(`${MODULE_ID}.miro_url_players`)) {
            game.settings.register(MODULE_ID, "miro_url_players", {
                scope: "world", config: false, type: String, default: ""
            });
            game.settings.register(MODULE_ID, "miro_url_gm", {
                scope: "world", config: false, type: String, default: ""
            });
        }
    },
    getURL: (mode) => {
        MiroDatabase.ensureRegistered();
        return game.settings.get(MODULE_ID, mode === 'gm' ? "miro_url_gm" : "miro_url_players");
    },
    setURL: async (mode, url) => {
        MiroDatabase.ensureRegistered();
        await game.settings.set(MODULE_ID, mode === 'gm' ? "miro_url_gm" : "miro_url_players", url);
    }
};