const MODULE_ID = "multiversus-rpg";
const ROOT_FOLDER_NAME = "NEXUS // DATA";

export const NexusDatabase = {
    // Busca dados nativos do Foundry
    getData: () => {
        const rootFolder = game.folders.find(f => f.name === ROOT_FOLDER_NAME && f.type === "JournalEntry");
        const allFolders = game.folders.filter(f => f.getFlag(MODULE_ID, "isNexus") === true);
        
        // Retorna apenas Journals que estão dentro de pastas do Nexus (ou no root, se tivesse)
        // Para garantir, filtramos pela flag.
        const allItems = game.journal.filter(j => j.getFlag(MODULE_ID, "isNexus") === true);
        
        return { rootFolder, folders: allFolders, items: allItems };
    },

    createOrUpdate: async (data, isFolder = false) => {
        if (game.user.isGM) {
            return await NexusDatabase._handleCreateOrUpdate(data, isFolder, null);
        } else {
            game.socket.emit(`module.${MODULE_ID}`, {
                type: "NEXUS_CREATE_UPDATE",
                data,
                isFolder,
                userId: game.user.id
            });
            // Opcional: mostrar um aviso pro jogador aguardar o mestre processar
            ui.notifications.info("Enviando requisição para o Mestre...");
        }
    },

    _handleCreateOrUpdate: async (data, isFolder, creatorId) => {
        // Garante que o Root Folder exista
        let root = game.folders.find(f => f.name === ROOT_FOLDER_NAME && f.type === "JournalEntry");
        if (!root) {
            root = await Folder.create({ name: ROOT_FOLDER_NAME, type: "JournalEntry", sorting: "a" });
        }

        const parentFolder = data.parentId || root.id;

        // Configuração de Ownership
        let ownership = { default: 0 };
        // Todos os GMs recebem acesso total nativamente pelo Foundry.
        // Adiciona permissão explícita para o criador e usuários selecionados:
        if (creatorId) ownership[creatorId] = 3; 
        if (data.permissions && data.permissions.length > 0) {
            data.permissions.forEach(uid => ownership[uid] = 3);
        }

        if (isFolder) {
            if (data.id) {
                const folder = game.folders.get(data.id);
                if (folder) await folder.update({ name: data.name, folder: parentFolder });
            } else {
                await Folder.create({
                    name: data.name,
                    type: "JournalEntry",
                    folder: parentFolder,
                    flags: { [MODULE_ID]: { isNexus: true } }
                });
                ui.notifications.info(`Nexus: Pasta "${data.name}" criada.`);
            }
        } else {
            if (data.id) {
                const journal = game.journal.get(data.id);
                if (journal) {
                    await journal.update({ name: data.name, folder: parentFolder, ownership });
                    if (journal.pages.size > 0) {
                        const page = journal.pages.contents[0];
                        await page.update({ 
                            text: { content: data.description }, 
                            flags: { [MODULE_ID]: { tags: data.tags, itemType: data.itemType, img: data.img } } 
                        });
                    }
                    ui.notifications.info(`Nexus: "${data.name}" atualizado.`);
                }
            } else {
                const journal = await JournalEntry.create({
                    name: data.name,
                    folder: parentFolder,
                    ownership,
                    flags: { [MODULE_ID]: { isNexus: true } }
                });
                await JournalEntryPage.create({
                    name: "Content",
                    type: "text",
                    text: { content: data.description || "" },
                    flags: { [MODULE_ID]: { tags: data.tags || "", itemType: data.itemType || "Doc", img: data.img || "" } }
                }, { parent: journal });
                ui.notifications.info(`Nexus: "${data.name}" salvo.`);
            }
        }
    },

    deleteEntry: async (id, isFolder) => {
        if (!game.user.isGM) return ui.notifications.error("Apenas o Mestre pode apagar dados do Nexus.");
        
        if (isFolder) {
            const folder = game.folders.get(id);
            if (folder) {
                await folder.delete({deleteSubfolders: true, deleteContents: true});
                ui.notifications.info("Pasta do Nexus removida.");
            }
        } else {
            const journal = game.journal.get(id);
            if (journal) {
                await journal.delete();
                ui.notifications.info("Documento do Nexus removido.");
            }
        }
    }
};