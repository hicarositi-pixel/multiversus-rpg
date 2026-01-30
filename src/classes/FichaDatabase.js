export class FichaDatabase {
    static _timeout = null;
    static _pendingUpdates = {};

    /**
     * Salva um valor único no banco de dados do Actor.
     * Suporta tanto dados do sistema (ex: "attributes.hp") quanto flags (ex: "flags.multiversus-rpg.inventory").
     * * @param {Actor} actor - O documento do Actor do Foundry.
     * @param {String} path - O caminho do dado.
     * @param {Any} value - O valor a ser salvo.
     * @param {Boolean} force - Se true, salva instantaneamente. Se false, usa delay.
     */
    static async update(actor, path, value, force = false) {
        if (!actor) return;

        let fullPath = path;

        // LÓGICA INTELIGENTE DE CAMINHO:
        // 1. Se começar com "flags.", é uma flag (não mexe).
        // 2. Se começar com "system.", é dado do sistema (não mexe).
        // 3. Se não tiver prefixo, assumimos que é dado do sistema e adicionamos "system.".
        if (!path.startsWith("flags.") && !path.startsWith("system.")) {
            fullPath = `system.${path}`;
        }

        if (force) {
            // Salvamento Imediato (Botões, Cliques)
            await actor.update({ [fullPath]: value });
            console.log(`[DB] Salvo Imediato: ${fullPath}`);
        } else {
            // Salvamento Agendado (Digitação em Inputs)
            this._pendingUpdates[fullPath] = value;
            this._scheduleSave(actor);
        }
    }

    /**
     * Salva vários dados de uma vez (útil para migrações ou resets).
     */
    static async updateMany(actor, updates) {
        if (!actor) return;
        
        const preparedUpdates = {};
        for (const [key, val] of Object.entries(updates)) {
            let fullPath = key;
            if (!key.startsWith("flags.") && !key.startsWith("system.")) {
                fullPath = `system.${key}`;
            }
            preparedUpdates[fullPath] = val;
        }

        await actor.update(preparedUpdates);
        console.log(`[DB] Multi-Update Salvo.`);
    }

    /**
     * Função interna de Debounce (espera o usuário parar de digitar).
     */
    static _scheduleSave(actor) {
        if (this._timeout) clearTimeout(this._timeout);

        this._timeout = setTimeout(async () => {
            if (Object.keys(this._pendingUpdates).length > 0) {
                // Clona e limpa a fila antes de enviar para evitar condições de corrida
                const updatesToSave = { ...this._pendingUpdates };
                this._pendingUpdates = {}; 
                
                console.log("[DB] Salvando lote...", updatesToSave);
                await actor.update(updatesToSave);
            }
        }, 800); // 800ms de espera
    }

    /**
     * Recupera um dado do Actor com segurança.
     * @param {Actor} actor 
     * @param {String} path - Caminho (ex: 'flags.multiversus-rpg.bio' ou 'attributes.hp')
     * @param {Any} fallback - Valor padrão se não existir
     */
    static get(actor, path, fallback = null) {
        if (!actor) return fallback;

        // Se for flag, busca na raiz do ator
        if (path.startsWith("flags.")) {
            return foundry.utils.getProperty(actor, path) ?? fallback;
        }
        
        // Se for dado de sistema (ex: "attributes.hp"), busca dentro de system
        // Se o usuário passar "system.attributes.hp", o getProperty resolve.
        // Se passar "attributes.hp", buscamos em actor.system.
        if (path.startsWith("system.")) {
             return foundry.utils.getProperty(actor, path) ?? fallback;
        }

        return foundry.utils.getProperty(actor.system, path) ?? fallback;
    }
}