const MODULE_ID = "multiversus-rpg";
const KEYS = { 
    ARCHIVE: "masterArchive", 
    STORE: "storeCatalog",
    SEASON: "battlePassSeason" 
};

export const StoreDatabase = {
    // --- INICIALIZAÇÃO PADRÃO ---
    init: () => {
        StoreDatabase._registerAll();
        console.log("Multiversus RPG | Database Inicializada.");
    },

    _registerAll: () => {
        if (!game.settings) return;

        const register = (key, defaultVal) => {
            if (!game.settings.settings.has(`${MODULE_ID}.${key}`)) {
                game.settings.register(MODULE_ID, key, {
                    name: key,
                    scope: "world",
                    config: false,
                    type: Object,
                    default: defaultVal,
                    onChange: () => {
                        if (key === KEYS.SEASON) Hooks.callAll("passSystemUpdate");
                        else Hooks.callAll("storeUpdate");
                    }
                });
            }
        };

        register(KEYS.ARCHIVE, []);
        register(KEYS.STORE, []);
        register(KEYS.SEASON, { status: 'closed', startDate: null, endDate: null, name: 'Temporada 1', rewardsMap: [] });
    },

    _safeGet: (key) => {
        try {
            return game.settings.get(MODULE_ID, key);
        } catch (e) {
            console.warn(`StoreDatabase | Recuperando database perdida: ${key}`);
            StoreDatabase._registerAll();
            return game.settings.get(MODULE_ID, key);
        }
    },

    _safeSet: async (key, value) => {
        try {
            await game.settings.set(MODULE_ID, key, value);
        } catch (e) {
            console.warn(`StoreDatabase | Criando database para salvar: ${key}`);
            StoreDatabase._registerAll();
            await game.settings.set(MODULE_ID, key, value);
        }
    },

    getArchive: () => StoreDatabase._safeGet(KEYS.ARCHIVE) || [],
    getStore: () => StoreDatabase._safeGet(KEYS.STORE) || [],
    getSeasonData: () => StoreDatabase._safeGet(KEYS.SEASON) || { status: 'closed', name: 'Temporada X' },

    getPlayerData: (userId) => {
        const user = game.users.get(userId);
        if (!user) return { coins: 0, items: [] };
        return user.getFlag(MODULE_ID, "playerData") || { coins: 0, items: [] };
    },

    getPassData: (userId) => {
        const user = game.users.get(userId);
        if (!user) return { tier: "cobre" };
        return user.getFlag(MODULE_ID, "passData") || { tier: "cobre" };
    },

    updateSeason: async (data) => {
        if (!game.user.isGM) return;
        const current = StoreDatabase.getSeasonData();
        const updated = { ...current, ...data };
        await StoreDatabase._safeSet(KEYS.SEASON, updated);
        
        game.socket.emit(`module.${MODULE_ID}`, { type: "passUpdate" });
        Hooks.callAll("passSystemUpdate");
    },

    setPlayerTier: async (userId, tierId) => {
        if (!game.user.isGM) return;
        const user = game.users.get(userId);
        if (!user) return;
        await user.setFlag(MODULE_ID, "passData", { tier: tierId });
        game.socket.emit(`module.${MODULE_ID}`, { type: "passUpdate" });
        Hooks.callAll("passSystemUpdate");
    },

    createItem: async (item) => {
        if (!game.user.isGM) return;
        
        let cleanItem = JSON.parse(JSON.stringify(item));
        
        // 1. Arquivo Geral
        let archive = StoreDatabase.getArchive();
        const idx = archive.findIndex(i => i.id === cleanItem.id);
        if (idx >= 0) archive[idx] = cleanItem; 
        else archive.push(cleanItem);
        
        await StoreDatabase._safeSet(KEYS.ARCHIVE, archive);

        // 2. Loja Ativa (se existir lá ou se for criação nova direta na loja)
        // Nota: A lógica original só atualizava se já existisse. 
        // Se você quiser que createItem também ADICIONE à loja, mude a lógica aqui.
        // Assumindo comportamento original de UPDATE aqui.
        let store = StoreDatabase.getStore();
        const sIdx = store.findIndex(i => i.id === cleanItem.id);
        if (sIdx >= 0) { 
            store[sIdx] = cleanItem; 
            await StoreDatabase._safeSet(KEYS.STORE, store); 
        }
    },

    // --- MERCADOR: Adicionar Item à Loja ---
    toggleStoreListing: async (item) => {
        if (!game.user.isGM) return;
        let store = StoreDatabase.getStore();
        const idx = store.findIndex(i => i.id === item.id);
        
        if (idx >= 0) {
            // Removendo da loja
            store.splice(idx, 1); 
        } else {
            // Adicionando à loja -> DISCORD TRIGGER
            store.push(item);
            Hooks.callAll("nexusStoreItemAdded", item); // <--- HOOK NOVO
        }
        
        await StoreDatabase._safeSet(KEYS.STORE, store);
    },

    deleteFromStore: async (id) => {
        if (!game.user.isGM) return;
        let store = StoreDatabase.getStore();
        store = store.filter(i => i.id !== id);
        await StoreDatabase._safeSet(KEYS.STORE, store);
    },

    deleteFromArchive: async (id) => {
        if (!game.user.isGM) return;
        let archive = StoreDatabase.getArchive().filter(i => i.id !== id);
        let store = StoreDatabase.getStore().filter(i => i.id !== id);
        
        await StoreDatabase._safeSet(KEYS.ARCHIVE, archive);
        await StoreDatabase._safeSet(KEYS.STORE, store);
    },

buyItemLocal: async (itemToBuy) => {
        const user = game.user;
        let userData = StoreDatabase.getPlayerData(user.id);

        if (userData.coins < itemToBuy.price) {
            return { success: false, msg: "Saldo Insuficiente!" };
        }

        // Desconta o dinheiro
        userData.coins -= itemToBuy.price;

        const newItem = { 
            ...itemToBuy, 
            uniqueId: foundry.utils.randomID(), 
            purchaseDate: Date.now(), 
            active: false,
            isPassItem: false 
        };

        if (!userData.items) userData.items = [];
        userData.items.push(newItem);

        await user.setFlag(MODULE_ID, "playerData", userData);

        if (itemToBuy.system.stock !== -1) {
            game.socket.emit(`module.${MODULE_ID}`, { type: "updateStock", itemId: itemToBuy.id });
        }

        // --- NOVO: AVISA O CAIXA QUE HOUVE UMA VENDA ---
        Hooks.callAll("nexusTransaction", user, itemToBuy); 
        // ------------------------------------------------

        return { success: true, msg: `Adquirido: ${itemToBuy.name}` };
    },

    injectPassItem: async (userId, item) => {
        const user = game.users.get(userId);
        if (!user) return { success: false };

        let userData = StoreDatabase.getPlayerData(userId);
        
        const newItem = { 
            ...item, 
            uniqueId: foundry.utils.randomID(), 
            purchaseDate: Date.now(), 
            active: false,
            isPassItem: true, 
            price: 0 
        };

        if (!userData.items) userData.items = [];
        userData.items.push(newItem);

        await user.setFlag(MODULE_ID, "playerData", userData);
        return { success: true };
    },

    adminModifyCoins: async (userId, amount, mode) => {
        if (!game.user.isGM) return;
        const targetUser = game.users.get(userId);
        if (!targetUser) return;

        let data = StoreDatabase.getPlayerData(userId);
        
        if (mode === 'add') data.coins += amount;
        if (mode === 'remove') data.coins = Math.max(0, data.coins - amount);
        
        await targetUser.setFlag(MODULE_ID, "playerData", data);
    },

    // --- ATIVADOR: Renderizar Item ---
    toggleActivationLocal: async (uniqueId) => {
        const user = game.user;
        let userData = StoreDatabase.getPlayerData(user.id);
        if (!userData || !userData.items) return;

        const idx = userData.items.findIndex(i => i.uniqueId === uniqueId);
        if (idx >= 0) {
            // Se NÃO estava ativo, e agora vai ativar -> DISCORD TRIGGER
            if (!userData.items[idx].active) {
                userData.items[idx].active = true;
                await user.setFlag(MODULE_ID, "playerData", userData);
                ui.notifications.info("Renderização Iniciada...");
                
                // Dispara o Hook com o Item e o Usuário
                Hooks.callAll("nexusItemActivated", userData.items[idx], user); // <--- HOOK NOVO
            }
            // Se já estava ativo, nada acontece (ou desativa, dependendo da sua lógica futura)
        }
    },

    decreaseStock: async (itemId) => {
        if (!game.user.isGM) return;
        let store = StoreDatabase.getStore();
        const idx = store.findIndex(i => i.id === itemId);
        
        if (idx >= 0 && store[idx].system.stock > 0) {
            store[idx].system.stock -= 1;
            await StoreDatabase._safeSet(KEYS.STORE, store);
        }
    }
};