import { StoreDatabase } from './StoreDatabase.js';

const MODULE_ID = "multiversus-rpg";

export const StoreSocket = {
    init: () => {
        // Remove listeners antigos para evitar duplicação se o módulo reiniciar
        game.socket.off(`module.${MODULE_ID}`);

        console.log("MacroStore | Socket Listener Iniciado.");

        // Ouve pedidos
        game.socket.on(`module.${MODULE_ID}`, async (payload) => {
            // Só o GM processa
            if (!game.user.isGM) return;

            console.log("MacroStore | Pedido recebido:", payload);

            if (payload.type === "buyItem") {
                await StoreDatabase.gmProcessBuy(payload.userId, payload.item);
            }
            if (payload.type === "activateItem") {
                await StoreDatabase.gmProcessActivation(payload.userId, payload.uniqueId);
            }
        });
    },

    // Jogador pede para comprar
    requestBuy: (item) => {
        const gmOnline = game.users.find(u => u.isGM && u.active);
        
        if (!gmOnline) {
            ui.notifications.error("Erro: Nenhum Mestre online para processar a compra.");
            return;
        }

        if (game.user.isGM) {
            // GM compra direto
            console.log("MacroStore | GM comprando direto.");
            StoreDatabase.gmProcessBuy(game.user.id, item);
        } else {
            // Player envia pedido
            console.log("MacroStore | Enviando pedido de compra ao GM...");
            game.socket.emit(`module.${MODULE_ID}`, {
                type: "buyItem",
                userId: game.user.id,
                item: item
            });
            ui.notifications.info("Processando compra com o servidor...");
        }
    },

    requestActivation: (item) => {
        if (game.user.isGM) {
            StoreDatabase.gmProcessActivation(game.user.id, item.uniqueId);
        } else {
            game.socket.emit(`module.${MODULE_ID}`, {
                type: "activateItem",
                userId: game.user.id,
                uniqueId: item.uniqueId
            });
        }
    }
};