import { writable } from 'svelte/store';

export const hubChatStore = writable([]);
export const hubGroupsStore = writable([]);
export const hubActiveTab = writable('chats'); // Define o valor inicial aqui
export const hubActiveChatId = writable('nexus-prime');
export const hubActiveChatName = writable('NEXUS_PRIME');
export const hubActiveActorId = writable(null);

export function updateHubStore() {
    const MODULE_ID = "multiversus-rpg";
    if (!game?.settings) return; 
    
    const savedMessages = game.settings.get(MODULE_ID, "social_hub_messages") || [];
    const chatMessages = (game.messages ? game.messages.contents : [])
        .filter(m => m.getFlag(MODULE_ID, "isNexusHub"))
        .map(m => m.getFlag(MODULE_ID, "nexusMessageData"))
        .filter(Boolean);

    hubChatStore.update(current => {
        const map = new Map();
        for (const m of savedMessages) {
            if (m && m.id) map.set(m.id, m);
        }
        for (const m of chatMessages) {
            if (m && m.id) map.set(m.id, m);
        }
        for (const m of current) {
            if (m && m.id && !map.has(m.id)) {
                map.set(m.id, m);
            }
        }
        return Array.from(map.values()).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    });

    const savedGroups = game.settings.get(MODULE_ID, "social_hub_groups") || [];
    hubGroupsStore.update(current => {
        const map = new Map();
        for (const g of savedGroups) {
            if (g && g.id) map.set(g.id, g);
        }
        for (const g of current) {
            if (g && g.id && !map.has(g.id)) {
                map.set(g.id, g);
            }
        }
        return Array.from(map.values());
    });
}