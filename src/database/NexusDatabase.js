const MODULE_ID = "multiversus-rpg";
const SETTING_KEY = "nexus_lore_data";

export const NexusDatabase = {
    ensureRegistered: () => {
        if (!game.settings.settings.has(`${MODULE_ID}.${SETTING_KEY}`)) {
            game.settings.register(MODULE_ID, SETTING_KEY, {
                name: "Nexus Data",
                scope: "world",
                config: false,
                type: Object,
                default: [],
                onChange: () => Hooks.callAll("nexusUpdate")
            });
        }
    },

    getAll: () => {
        NexusDatabase.ensureRegistered();
        return game.settings.get(MODULE_ID, SETTING_KEY) || [];
    },

    saveEntry: async (entry) => {
        NexusDatabase.ensureRegistered();
        let db = NexusDatabase.getAll();
        const index = db.findIndex(e => e.id === entry.id);
        if (index >= 0) db[index] = entry; 
        else db.push(entry);
        await game.settings.set(MODULE_ID, SETTING_KEY, db);
    },

    deleteEntry: async (id) => {
        NexusDatabase.ensureRegistered();
        let db = NexusDatabase.getAll().filter(e => e.id !== id);
        await game.settings.set(MODULE_ID, SETTING_KEY, db);
    },

    // --- NOVO: SISTEMA DE BACKUP ---
    
    // 1. Exportar: Transforma tudo em texto JSON
    exportData: () => {
        const data = NexusDatabase.getAll();
        return JSON.stringify(data, null, 2);
    },

    // 2. Importar: Recebe texto, valida e salva
    importData: async (jsonString) => {
        NexusDatabase.ensureRegistered();
        try {
            const data = JSON.parse(jsonString);
            if (!Array.isArray(data)) throw new Error("Formato inválido (deve ser uma lista).");
            
            // Pergunta de segurança
            return new Promise((resolve) => {
                new Dialog({
                    title: "Importar Database?",
                    content: `<p>Isso irá <b>SUBSTITUIR</b> todos os dados atuais do Nexus pelos dados do backup.<br>Tem certeza?</p>`,
                    buttons: {
                        yes: {
                            label: "Sim, Substituir",
                            icon: "<i class='fas fa-file-import'></i>",
                            callback: async () => {
                                await game.settings.set(MODULE_ID, SETTING_KEY, data);
                                ui.notifications.info(`Sucesso! ${data.length} registros importados.`);
                                resolve(true);
                            }
                        },
                        no: { label: "Cancelar", callback: () => resolve(false) }
                    },
                    default: "no"
                }).render(true);
            });
        } catch (e) {
            ui.notifications.error("Erro ao importar: " + e.message);
        }
    }
};