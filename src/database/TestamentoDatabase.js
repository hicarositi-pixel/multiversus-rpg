const MODULE_ID = "multiversus-rpg";

export const TestamentoDatabase = {
    // ========================================================================
    // BUSCA OS DADOS (Com inicialização segura)
    // ========================================================================
    getTestData: (actor) => {
        // Usamos a flag "nexus_codex" para evitar conflito com o código velho
        return actor.getFlag(MODULE_ID, "nexus_codex") || {
            items: [], // Lista de todos os NPCs, Docs e Pastas
            memorial: {
                pin: null,  // Código de 4 dígitos
                content: "" // O texto do memorial
            }
        };
    },

    // ========================================================================
    // SALVA OS DADOS (Surgical Update c/ Bloqueio de Renderização)
    // ========================================================================
    saveTestData: async (actor, data) => {
        // Usar actor.update com { render: false } impede a tela preta!
        // O Foundry salva os dados no servidor silenciosamente, enquanto o Svelte
        // continua rodando a interface visual sem ser interrompido.
        await actor.update({
            [`flags.${MODULE_ID}.nexus_codex`]: data
        }, { render: false });
    }
};