const MODULE_ID = "multiversus-rpg";

export const CommsDatabase = {
    init: () => {
        const settings = [
            { key: "comms_chat_log", def: [] },
            { key: "comms_groups", def: [{ id: "global", name: "REDE_MUNDIAL", icon: "fa-globe", isPrivate: false, password: null }]},
            { key: "comms_status", def: [] }
        ];
        settings.forEach(s => {
            if (!game.settings.settings.has(`${MODULE_ID}.${s.key}`)) {
                game.settings.register(MODULE_ID, s.key, { scope: "world", config: false, type: Object, default: s.def, onChange: () => Hooks.callAll("commsUpdate") });
            }
        });
    },

getRPWarning: () => `
        <div class="rp-warning-box" style="font-family: 'Share Tech Mono', monospace; color: #fff;">
            <h2 style="color: var(--c-primary); border-bottom: 2px solid var(--c-primary); padding-bottom: 5px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 2px;">
                ⚠️ PROTOCOLO DE TRANSMISSÃO CANÔNICA
            </h2>
            
            <p style="font-size: 14px; line-height: 1.5; margin-bottom: 15px; border-left: 3px solid var(--c-primary); padding-left: 10px;">
                Este terminal de comunicações é um <b>ITEM INTEGRAL DO MUNDO (IN-GAME)</b>. Toda e qualquer interação realizada aqui é considerada canônica e interpretada pelo seu personagem.
            </p>

            <div style="background: rgba(var(--c-primary), 0.1); padding: 10px; border: 1px solid rgba(var(--c-primary), 0.3); font-size: 12px;">
                <ul style="list-style: none; padding: 0; margin: 0;">
                    <li style="margin-bottom: 8px;"><b>🔹 EXPOSIÇÃO DE ID:</b> Ao transmitir em canais públicos (Rede Mundial), seu <b>MV-ID</b> será automaticamente exposto, permitindo que outros usuários rastreiem sua frequência.</li>
                    
                    <li style="margin-bottom: 8px;"><b>🔹 AQUISIÇÃO DE LINKS:</b> A sincronização de contatos e entrada em grupos privados exige <b>DIÁLOGO IN-GAME</b> prévio. Você só pode contatar indivíduos que seu personagem conheceu narrativamente e obteve o ID.</li>
                    
                    <li style="margin-bottom: 8px;"><b>🔹 INTERLÚDIOS:</b> Este chat permanece ativo entre as sessões para simular comunicações de longa distância. O momento canônico destas mensagens ocorre durante os <b>INTERLÚDIOS</b> (momentos de descanso/viagem).</li>
                    
                    <li style="margin-bottom: 8px; color: #ff4444;"><b>⚠️ META-GAME:</b> Discussões fora do personagem (OFF-GAME) são <b>ESTRITAMENTE PROIBIDAS</b> neste terminal e resultarão em punição administrativa. Para comunicações externas, utilize o <b>Discord</b>.</li>
                </ul>
            </div>

            <p style="text-align: center; margin-top: 15px; font-size: 11px; opacity: 0.6; font-style: italic;">
                "Sua voz ecoa na rede da Multiversus. Escolha bem suas palavras, elas deixam rastros."
            </p>
        </div>`,

    getCommID: async (actor) => {
        let code = actor.getFlag(MODULE_ID, "commID");
        if (!code) {
            const prefix = actor.type === "character" ? "MV" : "NET";
            code = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
            await actor.setFlag(MODULE_ID, "commID", code);
        }
        return code;
    },

    sendMessage: async (msgData) => {
        if (game.user.isGM) {
            let log = game.settings.get(MODULE_ID, "comms_chat_log") || [];
            log.push({ id: foundry.utils.randomID(), timestamp: Date.now(), ...msgData });
            if (log.length > 500) log.shift();
            await game.settings.set(MODULE_ID, "comms_chat_log", log);
            Hooks.callAll("commsUpdate");
            game.socket.emit(`module.${MODULE_ID}`, { type: "COMMS_REFRESH" });
        } else {
            game.socket.emit(`module.${MODULE_ID}`, { type: "COMMS_SEND_MSG", msg: msgData });
        }
    },

    createGroup: async (name, password = null) => {
        const newGroup = { id: foundry.utils.randomID(), name: name.toUpperCase(), icon: password ? "fa-user-lock" : "fa-users", isPrivate: !!password, password };
        if (game.user.isGM) {
            let gs = game.settings.get(MODULE_ID, "comms_groups") || [];
            gs.push(newGroup);
            await game.settings.set(MODULE_ID, "comms_groups", gs);
            Hooks.callAll("commsUpdate");
            game.socket.emit(`module.${MODULE_ID}`, { type: "COMMS_REFRESH" });
        } else {
            game.socket.emit(`module.${MODULE_ID}`, { type: "COMMS_CREATE_GROUP", group: newGroup });
        }
    },

    addContact: async (myActor, targetCommID) => {
        const target = game.actors.find(a => a.getFlag(MODULE_ID, "commID") === targetCommID);
        if (!target) return ui.notifications.warn("ID_NÃO_LOCALIZADO");
        let contacts = myActor.getFlag(MODULE_ID, "contacts") || [];
        if (contacts.find(c => c.id === target.id)) return;
        contacts.push({ id: target.id, name: target.name, img: target.img, commID: targetCommID });
        await myActor.setFlag(MODULE_ID, "contacts", contacts);
        Hooks.callAll("commsUpdate");
    },

updateStatus: async (actor, statusData) => {
        if (game.user.isGM) {
            let all = game.settings.get(MODULE_ID, "comms_status");
            if (!Array.isArray(all)) all = [];

            // 1. Remove o status antigo desse mesmo ator
            all = all.filter(s => s.actorId !== actor.id);

            // 2. Adiciona o novo status
            all.push({ 
                actorId: actor.id, 
                name: actor.name, 
                img: actor.img, 
                timestamp: Date.now(), 
                ...statusData 
            });

            // --- LINHA DE LIMPEZA (ADICIONE ISSO AQUI) ---
            const vinteEQuatroHoras = 24 * 60 * 60 * 1000;
            all = all.filter(s => (Date.now() - s.timestamp) < vinteEQuatroHoras);
            // ---------------------------------------------

            await game.settings.set(MODULE_ID, "comms_status", all);
            Hooks.callAll("commsUpdate");
            game.socket.emit(`module.${MODULE_ID}`, { type: "COMMS_REFRESH" });
        } else {
            game.socket.emit(`module.${MODULE_ID}`, { type: "COMMS_UPDATE_STATUS", actorId: actor.id, status: statusData });
        }
    },
    
    getPrivateChatId: (id1, id2) => [id1, id2].sort().join("_")
};