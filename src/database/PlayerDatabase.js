const MODULE_ID = "multiversus-rpg";
const SETTING_KEY = "player_lore_data"; 

export const PlayerDatabase = {
    // --- PROTEÇÃO CONTRA ERRO DE REGISTRO ---
    ensureRegistered: () => {
        if (!game.settings.settings.has(`${MODULE_ID}.${SETTING_KEY}`)) {
            game.settings.register(MODULE_ID, SETTING_KEY, {
                name: "Player Lore Data",
                scope: "world",
                config: false,
                type: Object,
                default: [],
                onChange: () => Hooks.callAll("nexusUpdate")
            });
        }
    },

    getAll: () => {
        PlayerDatabase.ensureRegistered(); // Garante que existe antes de ler
        return game.settings.get(MODULE_ID, SETTING_KEY) || [];
    },

    saveEntry: async (entry) => {
        PlayerDatabase.ensureRegistered();
        
        if (game.user.isGM) {
            // GM Salva direto
            let db = PlayerDatabase.getAll();
            const index = db.findIndex(e => e.id === entry.id);
            if (index >= 0) db[index] = entry; 
            else db.push(entry);
            await game.settings.set(MODULE_ID, SETTING_KEY, db);
        } else {
            // Jogador pede socorro via Socket
            game.socket.emit(`module.${MODULE_ID}`, {
                type: "PLAYER_DB_SAVE",
                entry: entry
            });
            ui.notifications.info("Salvando... Aguardando confirmação do Mestre.");
        }
    },

    deleteEntry: async (id) => {
        PlayerDatabase.ensureRegistered();
        
        if (game.user.isGM) {
            let db = PlayerDatabase.getAll().filter(e => e.id !== id);
            await game.settings.set(MODULE_ID, SETTING_KEY, db);
        } else {
            game.socket.emit(`module.${MODULE_ID}`, {
                type: "PLAYER_DB_DELETE",
                id: id
            });
            ui.notifications.info("Exclusão solicitada ao Mestre...");
        }
    }
};