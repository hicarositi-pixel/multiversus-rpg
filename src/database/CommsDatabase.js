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

    // --- FUNÇÕES DE SALVAMENTO NO FOUNDRY (Apenas GM ou Flags locais) ---
    saveMessageLog: async (msg) => {
        let log = game.settings.get(MODULE_ID, "comms_chat_log") || [];
        log.push(msg);
        if (log.length > 500) log.shift();
        await game.settings.set(MODULE_ID, "comms_chat_log", log);
    },

    saveGroup: async (group) => {
        let gs = game.settings.get(MODULE_ID, "comms_groups") || [];
        gs.push(group);
        await game.settings.set(MODULE_ID, "comms_groups", gs);
    },

    saveStatus: async (status) => {
        let all = game.settings.get(MODULE_ID, "comms_status") || [];
        all = all.filter(s => s.actorId !== status.actorId);
        all.push(status);
        const vinteEQuatro = 24 * 60 * 60 * 1000;
        all = all.filter(s => (Date.now() - s.timestamp) < vinteEQuatro);
        await game.settings.set(MODULE_ID, "comms_status", all);
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