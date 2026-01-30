const MODULE_ID = "multiversus-rpg";

export class SocialHubDatabase {
    static init() {
        // --- 1. REGISTRO DE TEMAS (CLIENTE) ---
        game.settings.register(MODULE_ID, "chatTheme", {
            name: "Tema do Nexus",
            scope: "client",
            config: false,
            type: String,
            default: "neon-link"
        });

        // --- 2. PREFERÊNCIAS GERAIS (CLIENTE) ---
        game.settings.register(MODULE_ID, "social_client_prefs", {
            scope: "client",
            config: false,
            type: Object,
            default: { theme: "neon-link", compactMode: false }
        });

        // --- 3. DADOS GLOBAIS (MUNDO) ---
        game.settings.register(MODULE_ID, "social_global_data", {
            scope: "world",
            config: false,
            type: Object,
            default: { channels: ["Global", "Sistemas", "Emergência"], activeEvents: [] }
        });

        // --- 4. GRUPOS E CANAIS (MUNDO) ---
        game.settings.register(MODULE_ID, "social_hub_groups", {
            scope: "world",
            config: false,
            type: Array, 
            default: [{id: "nexus-prime", name: "NEXUS_PRIME", icon: "fa-server", isPrivate: false}]
        });

        // --- 5. LOG DE MENSAGENS (MUNDO) ---
        game.settings.register(MODULE_ID, "social_hub_messages", {
            scope: "world",
            config: false,
            type: Array,
            default: []
        });

        console.log("MULTIVERSUS | SocialHubDatabase: Todos os protocolos registrados.");
    }

    // --- MÉTODOS DE MENSAGEM ---
    static async sendMessage(data) {
        const messages = game.settings.get(MODULE_ID, "social_hub_messages") || [];
        const newMessage = {
            id: foundry.utils.randomID(),
            timestamp: Date.now(),
            ...data
        };
        messages.push(newMessage);
        if (messages.length > 200) messages.shift();
        
        await game.settings.set(MODULE_ID, "social_hub_messages", messages);
        game.socket.emit(`module.${MODULE_ID}`, { type: "SOCIAL_HUB_REFRESH" });
        Hooks.callAll("socialHubUpdate");
    }

    // --- IDENTIDADE (FLAGS) ---
    static async setSpoofIdentity(userId, nick, active = true) {
        const user = game.users.get(userId);
        if (!user) return;
        await user.setFlag(MODULE_ID, "social_identity", {
            nick: nick,
            active: active,
            lastUpdate: Date.now()
        });
    }

    static getIdentity(userId) {
        const user = game.users.get(userId);
        return user?.getFlag(MODULE_ID, "social_identity") || { nick: user?.name, active: false };
    }

    // --- PREFERÊNCIAS VISUAIS ---
    static async setPreference(key, value) {
        const prefs = game.settings.get(MODULE_ID, "social_client_prefs") || {};
        prefs[key] = value;
        await game.settings.set(MODULE_ID, "social_client_prefs", prefs);
    }

    static getPreferences() {
        return game.settings.get(MODULE_ID, "social_client_prefs") || {};
    }
}