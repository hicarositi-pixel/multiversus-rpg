import { appendMessage, loadInitialComms, groupsStore, chatStore } from '../database/CommsStore.js';
import { CommsDatabase } from '../database/CommsDatabase.js';

const MODULE_ID = "multiversus-rpg";

export const OnlineComms = {
    _isListening: false,

    // ISSO SÓ PODE SER CHAMADO UMA VEZ QUANDO O MUNDO CARREGA
    init: () => {
        if (OnlineComms._isListening) return;
        OnlineComms._isListening = true;

        console.log("📡 [Multiversus] Inicializando Roteador de Comunicações...");

        // Garante que as configurações do Foundry existam
        CommsDatabase.registerSettings();
        
        // Carrega o histórico para a Store do Svelte
        loadInitialComms();

        // O ROTEADOR GERAL DE SOCKETS
        game.socket.on(`module.${MODULE_ID}`, async (payload) => {
            
            // 1. CHEGOU MENSAGEM
            if (payload.type === "COMMS_NEW_MSG") {
                appendMessage(payload.msg); 

                const chatParts = payload.msg.chatId.split('_');
                const myActor = game.user.character;
                
                // MÁGICA DO PRIVADO (DM)
                if (myActor && chatParts.length === 2 && chatParts.includes(myActor.id) && payload.msg.senderActorId !== myActor.id) {
                    await CommsDatabase.ensureContactSaved(myActor, payload.msg);
                }
                
                // Ninguém precisa fazer backup porque quem envia já salva!
            } 
            
            // 2. NOVO GRUPO
            else if (payload.type === "COMMS_NEW_GROUP") {
                groupsStore.update(gs => {
                    if (gs.find(g => g.id === payload.group.id)) return gs;
                    return [...gs, payload.group];
                });
            }
            
            // 3. NOVO STATUS
            else if (payload.type === "COMMS_UPDATE_STATUS") {
                Hooks.callAll("commsStatusUpdate"); 
                if (game.user.isGM) CommsDatabase.saveStatus(payload.status);
            }
        });
    },

    // FUNÇÕES DE ENVIO (A interface chama essas funções)
    sendMessage: async (msgData) => {
        const finalMsg = { id: foundry.utils.randomID(), timestamp: Date.now(), ...msgData };
        
        appendMessage(finalMsg); // Mostra na minha tela via Store
        game.socket.emit(`module.${MODULE_ID}`, { type: "COMMS_NEW_MSG", msg: finalMsg }); // Manda pra rede

        // O PRÓPRIO REMETENTE SALVA NO BANCO DE DADOS
        CommsDatabase.saveMessageLog(finalMsg);
    },

    createGroup: async (name, password = null) => {
        const newGroup = { id: foundry.utils.randomID(), name: name.toUpperCase(), icon: password ? "fa-user-lock" : "fa-users", isPrivate: !!password, password };
        
        groupsStore.update(gs => [...gs, newGroup]);
        game.socket.emit(`module.${MODULE_ID}`, { type: "COMMS_NEW_GROUP", group: newGroup });
        
        // O PRÓPRIO CRIADOR SALVA
        CommsDatabase.saveGroup(newGroup);
    },

    updateStatus: async (actor, statusData) => {
        const finalStatus = { actorId: actor.id, name: actor.name, img: actor.img, timestamp: Date.now(), ...statusData };
        
        game.socket.emit(`module.${MODULE_ID}`, { type: "COMMS_UPDATE_STATUS", status: finalStatus });
        Hooks.callAll("commsStatusUpdate");

        // O PRÓPRIO ATOR SALVA
        CommsDatabase.saveStatus(finalStatus);
    }
};