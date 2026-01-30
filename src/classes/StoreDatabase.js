export class StoreDatabase {
    static _queue = {};
    static _timers = {};

    static init() {
        console.log("MULTIVERSUS DB | Sistema de Persistência Global Ativo");
        
        // Garante que salve tudo se o usuário tentar fechar a aba
        window.addEventListener("beforeunload", () => {
            this.flush();
        });
    }

    /**
     * Função Mágica de Salvamento
     * @param {Document} doc - O Ator ou Item
     * @param {String} path - O caminho (ex: "survival.bio.fome")
     * @param {Any} value - O valor
     * @param {Boolean} force - Se true, salva agora (botões). Se false, espera parar de digitar.
     */
    static async scheduleUpdate(doc, path, value, force = false) {
        if (!doc || !doc.id) return;

        // Normaliza o caminho: Adiciona 'system.' se não for propriedade raiz
        const rootKeys = ['name', 'img', 'folder', 'sort', 'ownership', 'prototypeToken'];
        const fullPath = rootKeys.includes(path.split('.')[0]) ? path : `system.${path}`;

        // Se for forçado (Botão), salva e ignora a fila
        if (force) {
            await doc.update({ [fullPath]: value });
            return;
        }

        // --- LÓGICA DE FILA (DEBOUNCE) ---
        const docId = doc.id;
        
        // Cria entrada na fila se não existir
        if (!this._queue[docId]) this._queue[docId] = { doc: doc, updates: {} };
        
        // Atualiza o valor na fila
        this._queue[docId].updates[fullPath] = value;

        // Reseta o timer anterior
        if (this._timers[docId]) clearTimeout(this._timers[docId]);

        // Define novo timer (800ms sem digitar = salva)
        this._timers[docId] = setTimeout(() => {
            this._commit(docId);
        }, 800);
    }

    static async _commit(docId) {
        if (!this._queue[docId]) return;

        const { doc, updates } = this._queue[docId];
        
        // Limpa a fila antes de enviar para evitar conflitos
        delete this._queue[docId];
        delete this._timers[docId];

        try {
            await doc.update(updates);
            console.log(`[DB] Auto-Save ${doc.name}:`, updates);
        } catch (err) {
            console.error("[DB] Falha ao salvar:", err);
        }
    }

    static async flush() {
        // Salva tudo pendente imediatamente
        for (const docId of Object.keys(this._queue)) {
            await this._commit(docId);
        }
    }
}