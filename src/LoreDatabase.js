export const LoreDatabase = {
    /**
     * Busca ou Cria o Diário de Lore do Personagem
     */
    getLoreJournal: async (actor) => {
        const flagKey = "loreJournalId";
        let journalId = actor.getFlag("multiversus-rpg", flagKey);
        let journal = game.journal.get(journalId);

        // Se não existe ou foi deletado, cria um novo
        if (!journal) {
            // Define permissões: O dono do ator é dono do diário
            const ownership = { ...actor.ownership };
            
            journal = await JournalEntry.create({
                name: `Dossiê: ${actor.name}`,
                content: "Iniciando registro de memória...",
                ownership: ownership,
                folder: null // Ou coloque o ID de uma pasta se quiser organizar
            });

            // Cria a primeira página (Foundry V10+)
            await JournalEntryPage.create({
                name: "História Principal",
                text: { content: "" },
                title: { show: false }
            }, { parent: journal });

            // Salva o ID no ator para linkar
            await actor.setFlag("multiversus-rpg", flagKey, journal.id);
            console.log(`Lore Database Criada para ${actor.name}`);
        }

        return journal;
    },

    /**
     * Lê o conteúdo HTML atual
     */
    readLore: async (actor) => {
        const journal = await LoreDatabase.getLoreJournal(actor);
        const page = journal.pages.contents[0]; // Pega a primeira página
        return page.text.content || "";
    },

    /**
     * Salva o conteúdo no Diário
     */
    saveLore: async (actor, htmlContent) => {
        const journal = await LoreDatabase.getLoreJournal(actor);
        const page = journal.pages.contents[0];
        
        // Atualiza apenas o texto da página
        await page.update({ "text.content": htmlContent });
        return true;
    }
};