import { writable } from 'svelte/store';

export const hubChatStore = writable([]);
export const hubGroupsStore = writable([]);
export const hubActiveTab = writable('chats'); // Define o valor inicial aqui
export const hubActiveChatId = writable('nexus-prime');
export const hubActiveChatName = writable('NEXUS_PRIME');

export function updateHubStore() {
    const MODULE_ID = "multiversus-rpg";
    // Proteção para não quebrar se o Foundry ainda não carregou
    if (!game.settings) return; 
    
    hubChatStore.set(game.settings.get(MODULE_ID, "social_hub_messages") || []);
    hubGroupsStore.set(game.settings.get(MODULE_ID, "social_hub_groups") || []);
}