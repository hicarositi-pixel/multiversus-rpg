import { writable } from 'svelte/store';

export const chatStore = writable([]);
export const groupsStore = writable([]);
export const activeTabStore = writable('chats');
export const activeChatIdStore = writable('global');
export const activeChatNameStore = writable('REDE_MUNDIAL');
export const chatModeStore = writable('ingame'); 

export function loadInitialComms() {
    const log = game.settings.get("multiversus-rpg", "comms_chat_log") || [];
    const gs = game.settings.get("multiversus-rpg", "comms_groups") || [];
    chatStore.set([...log]);
    groupsStore.set([...gs]);
}

// ESTA FUNÇÃO GARANTE QUE A TELA ATUALIZE ANTES MESMO DO BANCO DE DADOS SALVAR
export function appendMessage(msg) {
    chatStore.update(log => {
        // Previne duplicação caso a rede mande duas vezes
        if (log.find(m => m.id === msg.id)) return log;
        const newLog = [...log, msg];
        if (newLog.length > 500) newLog.shift(); // Limite de otimização
        return newLog;
    });
}