const MODULE_ID = "multiversus-rpg";
const SETTING_NAME = "powersArchive"; // O nome do "cofre" no banco de dados

export const PowerDatabase = {
    // ========================================================================
    // 1. INICIALIZAÇÃO DO BANCO DE DADOS
    // ========================================================================
    init: async () => {
        // Registra o cofre oculto no Foundry se ele ainda não existir
        if (!game.settings.settings.has(`${MODULE_ID}.${SETTING_NAME}`)) {
            game.settings.register(MODULE_ID, SETTING_NAME, {
                name: "Data Core Archive",
                hint: "Banco de dados interno da Forja de Poderes.",
                scope: "world",      // 'world' garante que o Mestre e os Jogadores compartilhem a mesma base
                config: false,       // 'false' esconde isso do menu de configurações normal do Foundry
                type: Array,         // Nossa base é uma lista (Array) de itens
                default: [],
            });
            console.log("NEXUS_OS :: PowerDatabase inicializada com sucesso.");
        }
    },

    // ========================================================================
    // 2. LER TODOS OS PODERES (Carregar a Lista)
    // ========================================================================
    getArchive: async () => {
        try {
            // Puxa o Array lá do servidor do Foundry
            const archive = game.settings.get(MODULE_ID, SETTING_NAME);
            return archive || [];
        } catch (e) {
            console.error("NEXUS_OS :: Erro crítico ao ler o Data Core:", e);
            return [];
        }
    },

    // ========================================================================
    // 3. SALVAR OU ATUALIZAR UM PODER
    // ========================================================================
    savePower: async (powerData) => {
        try {
            let archive = await PowerDatabase.getArchive();

            // Se o poder já tiver um ID, significa que estamos EDITANDO ele
            if (powerData.id) {
                const index = archive.findIndex(p => p.id === powerData.id);
                if (index !== -1) {
                    // Substitui o antigo pelo atualizado
                    archive[index] = { ...archive[index], ...powerData };
                } else {
                    // Se por algum motivo tinha ID mas não achou na lista, cria de novo
                    archive.push(powerData);
                }
            } 
            // Se NÃO tiver ID, significa que é um poder NOVO sendo criado
            else {
                powerData.id = foundry.utils.randomID(); // O Foundry gera um ID único (ex: 'jK8xP2aL')
                archive.push(powerData);
            }

            // Grava o Array inteiro de volta no servidor do Foundry
            await game.settings.set(MODULE_ID, SETTING_NAME, archive);
            
            return { 
                success: true, 
                msg: "Matriz salva com sucesso no Data Core.", 
                id: powerData.id 
            };

        } catch (e) {
            console.error("NEXUS_OS :: Erro ao gravar no Data Core:", e);
            return { success: false, msg: "Falha crítica de gravação no servidor." };
        }
    },

    // ========================================================================
    // 4. EXCLUIR UM PODER
    // ========================================================================
    deletePower: async (id) => {
        try {
            let archive = await PowerDatabase.getArchive();
            
            // Filtra a lista, removendo quem tem o ID que queremos deletar
            archive = archive.filter(p => p.id !== id);
            
            // Salva a lista limpa de volta
            await game.settings.set(MODULE_ID, SETTING_NAME, archive);
            
            return { success: true };
        } catch (e) {
            console.error("NEXUS_OS :: Erro ao deletar do Data Core:", e);
            return { success: false };
        }
    }
};