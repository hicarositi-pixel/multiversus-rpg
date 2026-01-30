// GameRules.js

export const ITEM_CONFIG = {
    // --- PODERES E COMBATE ---
    "Poder Principal": {
        foundryType: "power",
        hasDice: true,
        template: "power-layout", // Layout com A/D/U e Custo
        icon: "fas fa-bolt"
    },
    "Poder Secundario": {
        foundryType: "power",
        hasDice: true,
        template: "power-layout",
        icon: "fas fa-plug"
    },
    "Hyper Stat": {
        foundryType: "power", // Hyperstats mecanicamente são poderes
        hasDice: true,
        template: "stat-layout",
        icon: "fas fa-dumbbell"
    },
    
    // --- EQUIPAMENTO E LOCAIS ---
    "Item": {
        foundryType: "focus",
        hasDice: false,
        template: "gear-layout", // Layout de inventário clássico
        icon: "fas fa-box"
    },
    "Veiculo": {
        foundryType: "focus",
        hasDice: true, // Dados de Estrutura
        template: "vehicle-layout", // Layout com HP e Velocidade
        icon: "fas fa-car"
    },
    "Bases": {
        foundryType: "focus", // Bases são Focus grandes
        hasDice: false,
        template: "base-layout", // Layout focado em Cômodos/Add-ons
        icon: "fas fa-warehouse"
    },

    // --- META E SOCIAIS ---
    "Portais": {
        foundryType: "metaquality", // Apenas descrição/permissão
        hasDice: false,
        template: "desc-layout", // Focado em texto e imagem
        icon: "fas fa-dungeon"
    },
    "Contatos": {
        foundryType: "metaquality", // Criamos um novo tipo lógico
        hasDice: false,
        template: "contact-layout", // Focado em Lealdade/Influência
        icon: "fas fa-address-book"
    },
    "Criaturas": {
        foundryType: "metaquality", // Representa a posse/lealdade da criatura
        hasDice: true, // Pode ter dados de Lealdade ou Pool genérico
        template: "creature-layout", // Focado em stats resumidos
        icon: "fas fa-paw"
    },
    
    // --- EXTRAS ---
    "Origens": { foundryType: "archetype", template: "desc-layout", icon: "fas fa-dna" },
    "Passe": { foundryType: "metaquality", template: "desc-layout", icon: "fas fa-ticket-alt" }
};

export const RARITY_COLORS = {
    "Comum": "#b0b0b0",
    "Raro": "#0074d9",
    "Lendário": "#ffdc00",
    "Mítico": "#ff4136",
    "Universal": "#b10dc9",
    "Multiversal": "#00ff41"
};