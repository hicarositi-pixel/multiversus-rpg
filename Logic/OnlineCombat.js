import { activeTurnId, revealedSets, CombatManager } from './CombatManager.js';
import { get } from 'svelte/store';

export class OnlineCombat {
    static MODULE_ID = "multiversus-rpg";
    static SOCKET_NAME = `module.${this.MODULE_ID}`;

    static init() {
        game.socket.off(this.SOCKET_NAME);
        game.socket.on(this.SOCKET_NAME, this.handleSocketEvents.bind(this));
    }

    static handleSocketEvents(payload) {
        const { action, data } = payload;

        // O MESTRE RECEBE OS VETORES AQUI
        if (action === 'PLAYER_SEND_VECTORS' && game.user.isGM) {
            console.log("NEXUS | Vetores recebidos via Socket:", data);
            Hooks.callAll("nexusCombatVectorsReceived", data);
        }
        
        // JOGADOR RECEBE A RESOLUÇÃO DO MESTRE
        else if (action === 'RESOLUTION_SYNC') {
            revealedSets.set(data.revealedSets || []);
            CombatManager.updateResolutionState(data.combatants, true);
        }
        
        else if (action === 'TURN_CHANGED') {
            activeTurnId.set(data.turnId);
        }
    }

    // Função que o jogador chama para enviar os dados
    static sendVectorsToGM(payload) {
        game.socket.emit(this.SOCKET_NAME, {
            action: 'PLAYER_SEND_VECTORS',
            data: payload
        });
    }

    static broadcastResolutionUpdate(combatants, revealedSetsData) {
        game.socket.emit(this.SOCKET_NAME, { action: 'RESOLUTION_SYNC', data: { combatants, revealedSets: revealedSetsData } });
    }
}