/**
 * CardDatabase.js
 * Gerencia a persistência de cartas customizadas no Foundry.
 */
export const CardDatabase = {
    init: async () => {
        // Registra a configuração no Foundry para salvar as cartas
        game.settings.register("multiversus-rpg", "customCards", {
            name: "Cartas Customizadas",
            scope: "world",
            config: false,
            type: Array,
            default: []
        });
    },

    getCards: () => game.settings.get("multiversus-rpg", "customCards") || [],

    saveCard: async (cardData) => {
        const cards = CardDatabase.getCards();
        if (cardData.id) {
            const index = cards.findIndex(c => c.id === cardData.id);
            if (index > -1) cards[index] = cardData;
            else cards.push(cardData);
        } else {
            cardData.id = foundry.utils.randomID();
            cards.push(cardData);
        }
        await game.settings.set("multiversus-rpg", "customCards", cards);
        return cardData;
    },

    deleteCard: async (id) => {
        const cards = CardDatabase.getCards().filter(c => c.id !== id);
        await game.settings.set("multiversus-rpg", "customCards", cards);
    }
};