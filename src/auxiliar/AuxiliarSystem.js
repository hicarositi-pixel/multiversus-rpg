const MODULE_ID = "multiversus-rpg";
const SETTING_KEY = "auxiliar_access_list";

export const AuxiliarSystem = {
    init: () => {
        game.settings.register(MODULE_ID, SETTING_KEY, {
            name: "Lista de Auxiliares",
            scope: "world",
            config: false,
            type: Object,
            default: [],
            onChange: () => Hooks.callAll("auxiliarUpdate")
        });
    },

    getAuthorizedUsers: () => {
        return game.settings.get(MODULE_ID, SETTING_KEY) || [];
    },

    toggleUserAccess: async (userId) => {
        if (!game.user.isGM) return;
        let list = AuxiliarSystem.getAuthorizedUsers();
        if (list.includes(userId)) list = list.filter(id => id !== userId);
        else list.push(userId);
        await game.settings.set(MODULE_ID, SETTING_KEY, list);
        game.socket.emit(`module.${MODULE_ID}`, { type: "AUXILIAR_REFRESH" });
    },

    isAuxiliar: (user = game.user) => {
        if (user.isGM) return true;
        const list = AuxiliarSystem.getAuthorizedUsers();
        return list.includes(user.id);
    },

    // --- AÇÕES (PODERES) ---
    actions: {
        createSheet: async (charName, ownerId) => {
            if (!charName) return ui.notifications.warn("Defina um nome para a ficha.");
            
            // Envia o pedido usando a variável MODULE_ID para garantir consistência
            game.socket.emit(`module.${MODULE_ID}`, { 
                type: "AUX_ACTION_CREATE_SHEET", 
                name: charName, 
                ownerId: ownerId 
            });
            
            ui.notifications.info(`[AUX] Pedido de criação enviado: ${charName}`);
        },

        giveCoinsToAll: async (amount) => {
            game.socket.emit(`module.${MODULE_ID}`, { type: "AUX_ACTION_COINS", amount });
            ui.notifications.info(`Solicitação enviada: Dar ${amount} moedas.`);
        },
        
        healTarget: async () => {
            const targets = [...game.user.targets];
            if(!targets.length) return ui.notifications.warn("Selecione um token.");
            game.socket.emit(`module.${MODULE_ID}`, { type: "AUX_ACTION_HEAL", ids: targets.map(t => t.id) });
            ui.notifications.info("Solicitação de Suporte Médico enviada.");
        }
    }
};