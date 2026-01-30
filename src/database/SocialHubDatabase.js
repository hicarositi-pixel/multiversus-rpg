const MODULE_ID = "multiversus-rpg";

export class SocialHubDatabase {
    static init() {
        console.log("MULTIVERSUS | Database Carregada.");
        
        game.settings.register(MODULE_ID, "chatTheme", {
            scope: "client", config: false, type: String, default: "neon-link"
        });

        game.settings.register(MODULE_ID, "social_hub_groups", {
            scope: "world", config: false, type: Array, 
            default: [{id: "nexus-prime", name: "NEXUS_PRIME", icon: "fa-server", isPrivate: false}]
        });

        game.settings.register(MODULE_ID, "social_hub_messages", {
            scope: "world", config: false, type: Array, default: []
        });
    }

    // --- GRUPOS ---
    static async createGroup(name, password = null) {
        if (!name) return;
        const groups = game.settings.get(MODULE_ID, "social_hub_groups") || [];
        groups.push({
            id: foundry.utils.randomID(),
            name: name.toUpperCase(),
            icon: password ? "fa-lock" : "fa-hashtag",
            isPrivate: !!password,
            password: password
        });
        await game.settings.set(MODULE_ID, "social_hub_groups", groups);
        this.notifyUpdate();
    }

    static async deleteGroup(groupId) {
        const groups = game.settings.get(MODULE_ID, "social_hub_groups") || [];
        // Filtra removendo o grupo alvo
        const newGroups = groups.filter(g => g.id !== groupId);
        await game.settings.set(MODULE_ID, "social_hub_groups", newGroups);
        this.notifyUpdate();
    }

    // --- MENSAGENS ---
    static async sendMessage(data) {
        const messages = game.settings.get(MODULE_ID, "social_hub_messages") || [];
        messages.push({
            id: foundry.utils.randomID(),
            timestamp: Date.now(),
            ...data
        });
        if (messages.length > 200) messages.shift();
        
        await game.settings.set(MODULE_ID, "social_hub_messages", messages);
        this.notifyUpdate();
    }

    static async clearChat() {
        // Limpa todas as mensagens (Comando /cls)
        await game.settings.set(MODULE_ID, "social_hub_messages", []);
        this.notifyUpdate();
    }

    // --- CONTATOS ---
    static async addContact(actor, contactID) {
        if (!actor) return;
        const contacts = actor.getFlag(MODULE_ID, "contacts") || [];
        if (contacts.find(c => c.commID === contactID)) return;
        contacts.push({
            id: foundry.utils.randomID(),
            name: "Conexão " + contactID,
            commID: contactID,
            img: "icons/svg/mystery-man.svg"
        });
        await actor.setFlag(MODULE_ID, "contacts", contacts);
        Hooks.callAll("socialHubUpdate"); 
    }

    static notifyUpdate() {
        game.socket.emit(`module.${MODULE_ID}`, { type: "SOCIAL_HUB_REFRESH" });
        Hooks.callAll("socialHubUpdate");
    }
}