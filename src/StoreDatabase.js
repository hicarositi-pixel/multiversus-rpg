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

    getNextResetTimestamp: () => {
        let d = new Date();
        d.setHours(2, 0, 0, 0); // 2 AM
        let day = d.getDay();
        let daysUntilSaturday = (6 - day + 7) % 7;
        
        if (daysUntilSaturday === 0 && Date.now() > d.getTime()) {
            daysUntilSaturday = 7;
        }
        
        d.setDate(d.getDate() + daysUntilSaturday);
        return d.getTime();
    },

    generateExclusiveStore: async (userId, force = false) => {
        const user = game.users.get(userId);
        if (!user) return;
        
        let userData = StoreDatabase.getPlayerData(userId);
        let nextReset = StoreDatabase.getNextResetTimestamp();
        
        if (!force && userData.exclusiveStore && userData.exclusiveStore.nextReset === nextReset && userData.exclusiveStore.items.length === 8) {
            return userData.exclusiveStore.items; // Já gerada para esta semana
        }
        
        let archive = StoreDatabase.getArchive();
        if (archive.length === 0) return [];
        
        // Define categorias e pesos (0-100)
        const weights = [
            { rarity: "Comum", weight: 40 },
            { rarity: "Raro", weight: 30 },
            { rarity: "Lendário", weight: 15 },
            { rarity: "Mítico", weight: 10 },
            { rarity: "Universal", weight: 4 },
            { rarity: "Multiversal", weight: 1 }
        ];
        
        let totalWeight = weights.reduce((acc, curr) => acc + curr.weight, 0);
        let storeItems = [];
        
        for (let i = 0; i < 8; i++) {
            let rnd = Math.random() * totalWeight;
            let acc = 0;
            let chosenRarity = "Comum";
            for (let w of weights) {
                acc += w.weight;
                if (rnd <= acc) { chosenRarity = w.rarity; break; }
            }
            
            let possibleItems = archive.filter(item => {
                if (item.rarity !== chosenRarity) return false;
                let tag = item.systemTag || "Item";
                let isPower = tag === "Poder Principal" || tag === "Poder Secundario";
                
                if (chosenRarity === "Comum" || chosenRarity === "Raro") {
                    if (isPower) return false;
                }
                if (chosenRarity === "Multiversal") {
                    if (isPower) return false;
                }
                return true;
            });
            
            if (possibleItems.length > 0) {
                let rItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];
                let clone = JSON.parse(JSON.stringify(rItem));
                clone.exclusiveId = foundry.utils.randomID();
                clone.purchased = false;
                clone.discounted = false;
                storeItems.push(clone);
            } else {
                // Fallback: pega qualquer item que não seja poder
                let fItems = archive.filter(item => {
                    let tag = item.systemTag || "Item";
                    return tag !== "Poder Principal" && tag !== "Poder Secundario";
                });
                if (fItems.length > 0) {
                    let rItem = fItems[Math.floor(Math.random() * fItems.length)];
                    let clone = JSON.parse(JSON.stringify(rItem));
                    clone.exclusiveId = foundry.utils.randomID();
                    clone.purchased = false;
                    clone.discounted = false;
                    storeItems.push(clone);
                }
            }
        }
        
        if (storeItems.length > 0) {
            let discountIndex = Math.floor(Math.random() * storeItems.length);
            storeItems[discountIndex].discounted = true;
            storeItems[discountIndex].originalPrice = storeItems[discountIndex].price;
            storeItems[discountIndex].price = Math.floor(storeItems[discountIndex].price * 0.8);
        }
        
        userData.exclusiveStore = {
            items: storeItems,
            nextReset: nextReset
        };
        
        await user.setFlag(MODULE_ID, "playerData", userData);
        return storeItems;
    },

    rerollExclusiveStore: async (userId) => {
        const user = game.users.get(userId);
        if (!user) return { success: false, msg: "Usuário não encontrado." };
        
        let userData = StoreDatabase.getPlayerData(userId);
        if (userData.coins < 200) {
            return { success: false, msg: "Saldo Insuficiente para Reroll!" };
        }
        
        userData.coins -= 200;
        await user.setFlag(MODULE_ID, "playerData", userData);
        
        await StoreDatabase.generateExclusiveStore(userId, true);
        return { success: true, msg: "Loja Exclusiva Renovada!" };
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

    buyExclusiveItemLocal: async (exclusiveId) => {
        const user = game.user;
        let userData = StoreDatabase.getPlayerData(user.id);
        
        if (!userData.exclusiveStore || !userData.exclusiveStore.items) return { success: false, msg: "Loja não encontrada." };
        
        let eItem = userData.exclusiveStore.items.find(i => i.exclusiveId === exclusiveId);
        if (!eItem) return { success: false, msg: "Item não encontrado." };
        if (eItem.purchased) return { success: false, msg: "Item já adquirido!" };
        
        if (userData.coins < eItem.price) {
            return { success: false, msg: "Saldo Insuficiente!" };
        }
        
        userData.coins -= eItem.price;
        eItem.purchased = true;
        
        const newItem = { 
            ...eItem, 
            uniqueId: foundry.utils.randomID(), 
            purchaseDate: Date.now(), 
            active: false,
            isPassItem: false 
        };
        
        delete newItem.exclusiveId;
        delete newItem.purchased;
        delete newItem.discounted;
        delete newItem.originalPrice;
        
        if (!userData.items) userData.items = [];
        userData.items.push(newItem);
        
        await user.setFlag(MODULE_ID, "playerData", userData);
        
        Hooks.callAll("nexusTransaction", user, newItem);
        
        return { success: true, msg: `Adquirido: ${newItem.name} (Exclusivo)` };
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