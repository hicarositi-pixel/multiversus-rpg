const MODULE_ID = "multiversus-rpg";

export const CommsDatabase = {
    registerSettings: () => {
        const settings = [
            { key: "comms_chat_log", def: [] },
            { key: "comms_groups", def: [{ id: "global", name: "REDE_MUNDIAL", icon: "fa-globe", isPrivate: false, password: null }]},
            { key: "comms_status", def: [] }
        ];
        settings.forEach(s => {
            if (!game.settings.settings.has(`${MODULE_ID}.${s.key}`)) {
                try { game.settings.register(MODULE_ID, s.key, { scope: "world", config: false, type: Object, default: s.def }); } catch(e) {}
            }
        });
    },

    // --- FUNÇÕES DE SALVAMENTO NO FOUNDRY (Via JournalEntry) ---
    getDB: async () => {
        let entry = game.journal.getName("ZAP_NET_DB");
        if (!entry && game.user.isGM) {
            entry = await JournalEntry.create({
                name: "ZAP_NET_DB",
                ownership: { default: 3 } // Permite leitura e escrita para todos
            });
            // Migração de dados antigos
            const oldLog = game.settings.get(MODULE_ID, "comms_chat_log") || [];
            if (oldLog.length > 0) await entry.setFlag(MODULE_ID, "chat_log", oldLog);
            const oldGroups = game.settings.get(MODULE_ID, "comms_groups") || [{ id: "global", name: "REDE_MUNDIAL", icon: "fa-globe", isPrivate: false, password: null }];
            if (oldGroups.length > 0) await entry.setFlag(MODULE_ID, "groups", oldGroups);
            const oldStatus = game.settings.get(MODULE_ID, "comms_status") || [];
            if (oldStatus.length > 0) await entry.setFlag(MODULE_ID, "status", oldStatus);
        }
        return entry;
    },

    saveMessageLog: async (msg) => {
        const db = await CommsDatabase.getDB();
        if (!db) return;
        let log = db.getFlag(MODULE_ID, "chat_log") || [];
        if (log.find(m => m.id === msg.id)) return; // Evita duplicatas
        log.push(msg);
        if (log.length > 1000) log.shift();
        await db.setFlag(MODULE_ID, "chat_log", log);
    },

    saveGroup: async (group) => {
        const db = await CommsDatabase.getDB();
        if (!db) return;
        let gs = db.getFlag(MODULE_ID, "groups") || [];
        if (gs.find(g => g.id === group.id)) return;
        gs.push(group);
        await db.setFlag(MODULE_ID, "groups", gs);
    },

    saveStatus: async (status) => {
        const db = await CommsDatabase.getDB();
        if (!db) return;
        let all = db.getFlag(MODULE_ID, "status") || [];
        all = all.filter(s => s.actorId !== status.actorId);
        all.push(status);
        const vinteEQuatro = 24 * 60 * 60 * 1000;
        all = all.filter(s => (Date.now() - s.timestamp) < vinteEQuatro);
        await db.setFlag(MODULE_ID, "status", all);
    },

    ensureContactSaved: async (myActor, msgPayload) => {
        let contacts = myActor.getFlag(MODULE_ID, "contacts") || [];
        if (!contacts.find(c => c.id === msgPayload.senderActorId)) {
            contacts.push({ id: msgPayload.senderActorId, name: msgPayload.senderName, img: msgPayload.senderImg, commID: msgPayload.senderCommID });
            await myActor.setFlag(MODULE_ID, "contacts", contacts);
            Hooks.callAll("commsContactUpdate");
        }
    },

    addContact: async (myActor, targetCommID) => {
        const target = game.actors.find(a => a.getFlag(MODULE_ID, "commID") === targetCommID);
        if (!target) return ui.notifications.warn("ID NÃO LOCALIZADO");
        
        let contacts = myActor.getFlag(MODULE_ID, "contacts") || [];
        if (contacts.find(c => c.id === target.id)) return ui.notifications.info("Contato já sincronizado.");
        
        contacts.push({ id: target.id, name: target.name, img: target.img, commID: targetCommID });
        await myActor.setFlag(MODULE_ID, "contacts", contacts);
        ui.notifications.info(`Contato ${target.name} adicionado!`);
        Hooks.callAll("commsContactUpdate");
    },

    getCommID: async (actor) => {
        let code = actor.getFlag(MODULE_ID, "commID");
        if (!code) {
            const prefix = actor.type === "character" ? "MV" : "NET";
            code = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
            await actor.setFlag(MODULE_ID, "commID", code);
        }
        return code;
    },

    getRPWarning: () => `... seu html de warning aqui ...`,
    getPrivateChatId: (id1, id2) => [id1, id2].sort().join("_")
};