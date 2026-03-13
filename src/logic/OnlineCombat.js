import { activeTurnId, combatQueue } from './CombatManager.js';

export class OnlineCombat {
    static MODULE_ID = "multiversus-rpg";
    static SOCKET_NAME = `module.${this.MODULE_ID}`;

    // Inicializa a escuta da internet (O CombatHub vai chamar isso no onMount)
    static init() {
        game.socket.on(this.SOCKET_NAME, this.handleSocketEvents.bind(this));
    }

    // Recebe as mensagens dos outros PCs
    static handleSocketEvents(payload) {
        const { action, data } = payload;

        if (action === 'TURN_CHANGED') {
            activeTurnId.set(data.turnId);
            // Toca um sonzinho pro jogador saber que é a vez dele!
            if (data.turnId === game.user.character?.id) {
                ui.notifications.warn("É A SUA VEZ DE NARRAR E AGIR!");
                AudioHelper.play({src: "sounds/notify.wav", volume: 0.5, autoplay: true});
            }
        }
        else if (action === 'ACTION_LOCKED') {
            ui.notifications.info("SINAL RECEBIDO: Um combatente transmitiu os vetores.");
            // Opcional: Tocar som de terminal "beep"
        }
    }

    // Envia o novo turno pra galera
    static broadcastTurn(turnId) {
        game.socket.emit(this.SOCKET_NAME, {
            action: 'TURN_CHANGED',
            data: { turnId }
        });
    }

    // Avisa a galera que alguém trancou a ação
    static broadcastLock(actorId) {
        game.socket.emit(this.SOCKET_NAME, {
            action: 'ACTION_LOCKED',
            data: { actorId }
        });
    }
}