/**
 * Gerenciador de Banco de Dados Global para Crafting
 * Salva os Blueprints em um JournalEntry oculto para que todos vejam.
 */
export class CraftDB {
    static DB_NAME = "CRAFTING_BLUEPRINTS_DB";

    static async init() {
        // Apenas o GM cria o banco se não existir
        if (!game.user.isGM) return;
        
        let journal = game.journal.getName(this.DB_NAME);
        if (!journal) {
            await JournalEntry.create({
                name: this.DB_NAME,
                text: { content: "[]" }, // Array vazio inicial
                ownership: { default: 3 } // Todos têm permissão de observador/owner
            });
            console.log("Multiversus RPG | Crafting DB Criada.");
        }
    }

    static getBlueprints() {
        const journal = game.journal.getName(this.DB_NAME);
        if (!journal) return [];
        try {
            // Pega o texto da primeira página
            const content = journal.pages.contents[0]?.text?.content || "[]";
            // Limpa tags HTML caso o Foundry adicione <p>
            const cleanJson = content.replace(/<[^>]*>/g, '');
            return JSON.parse(cleanJson);
        } catch (e) {
            return [];
        }
    }

    static async addBlueprint(bp) {
        const list = this.getBlueprints();
        list.push(bp);
        await this._save(list);
    }

    static async updateBlueprint(bp) {
        let list = this.getBlueprints();
        const idx = list.findIndex(b => b.id === bp.id);
        if (idx !== -1) {
            list[idx] = bp;
            await this._save(list);
        }
    }

    static async deleteBlueprint(id) {
        let list = this.getBlueprints();
        list = list.filter(b => b.id !== id);
        await this._save(list);
    }

    static async _save(data) {
        const journal = game.journal.getName(this.DB_NAME);
        if (!journal) return ui.notifications.warn("Banco de dados de Crafting não encontrado.");
        
        const page = journal.pages.contents[0];
        const jsonString = JSON.stringify(data);

        if (page) {
            await page.update({ text: { content: jsonString } });
        } else {
            await journal.createEmbeddedDocuments("JournalEntryPage", [{
                name: "DB",
                text: { content: jsonString }
            }]);
        }
    }
}