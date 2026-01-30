import { writable } from 'svelte/store';

export const chatStore = writable([]);
export const groupsStore = writable([]);
export const activeTabStore = writable('chats');
export const activeChatIdStore = writable('global');
export const activeChatNameStore = writable('REDE_MUNDIAL');

export function updateCommsStore() {
    const log = game.settings.get("multiversus-rpg", "comms_chat_log") || [];
    const gs = game.settings.get("multiversus-rpg", "comms_groups") || [];
    chatStore.set([...log]);
    groupsStore.set([...gs]);
}