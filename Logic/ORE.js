/**
 * ORE.js
 * Motor de Regras Central do One Roll Engine (Multiversus RPG)
 * Caminho: src/Logic/ORE.js
 */

export const ORE = {

    // --- 1. SANITIZAR E LIMITAR POOL BASE ---
    /**
     * Garante que uma ação individual respeite os limites naturais do sistema.
     * Teto Natural: 10 dados combinados (D + HD + WD).
     * Teto de Spray: 10 dados normais extras.
     */
    _sanitizePool: (poolInput = {}) => {
        let { d = 0, hd = 0, wd = 0, spray = 0 } = poolInput;

        // Limita o Spray ao teto de 10
        let finalSpray = Math.min(spray, 10);

        // Limita a soma da base natural (D + HD + WD) ao teto de 10
        let totalBase = d + hd + wd;
        if (totalBase > 10) {
            // Se passar de 10, reduz os dados normais primeiro (como penalidade de overflow de sistema)
            let excess = totalBase - 10;
            d = Math.max(0, d - excess);
            
            // Se ainda passar (ex: o cara colocou 12 HD), força o corte bruto
            if (d + hd + wd > 10) {
                hd = Math.min(hd, 10);
                wd = Math.min(wd, 10 - hd);
                d = 0;
            }
        }

        return { d, hd, wd, spray: finalSpray };
    },

    // --- 2. CALCULAR POOL FINAL (AÇÃO + REAÇÃO + EFEITOS) ---
    /**
     * Agrega a Ação Principal, a Reação (se houver), e os Modificadores Globais.
     * Retorna o total bruto de dados a serem rolados.
     */
    calculateFinalPool: (action = {}, reaction = {}, mods = { debuffs: 0, buffers: 0 }) => {
        // 2.1: Sanitiza as entradas para respeitar o teto de 10 base + 10 spray
        const safeAction = ORE._sanitizePool(action);
        const safeReaction = ORE._sanitizePool(reaction);

        // 2.2: Agrega os dados totais (Soma Ação + Reação)
        // Lógica do Spray: Ele se converte diretamente em Dados Normais (D) na pool
        let currentD = safeAction.d + safeAction.spray + safeReaction.d + safeReaction.spray;
        let currentHD = safeAction.hd + safeReaction.hd;
        let currentWD = safeAction.wd + safeReaction.wd;

        // 2.3: Aplica Buffs (Buffs sempre adicionam Dados Normais)
        currentD += (mods.buffers || 0);

        // 2.4: Aplica Debuffs (A Ordem Absoluta: HD -> D -> WD)
        let remainingDebuffs = mods.debuffs || 0;

        if (remainingDebuffs > 0) {
            const removeHD = Math.min(remainingDebuffs, currentHD);
            currentHD -= removeHD;
            remainingDebuffs -= removeHD;
        }
        
        if (remainingDebuffs > 0) {
            const removeD = Math.min(remainingDebuffs, currentD);
            currentD -= removeD;
            remainingDebuffs -= removeD;
        }
        
        if (remainingDebuffs > 0) {
            const removeWD = Math.min(remainingDebuffs, currentWD);
            currentWD -= removeWD;
            remainingDebuffs -= removeWD;
        }

        return { 
            d: Math.max(0, currentD), 
            hd: Math.max(0, currentHD), 
            wd: Math.max(0, currentWD) 
        };
    },

    // --- 3. GERAR ROLAGEM BRUTA ---
    /**
     * Cria a array de dados rolados a partir da pool final agregada.
     * HD = Sempre 10 | D = Aleatório (1 a 10) | WD = 0 (Esperando input)
     */
    generateRoll: (finalPool) => {
        let rolledDice = [];

        // Adiciona Hard Dice
        for (let i = 0; i < finalPool.hd; i++) {
            rolledDice.push({ val: 10, type: 'hd' });
        }
        
        // Adiciona Normal Dice (Base + Buffs + Spray agregados)
        for (let i = 0; i < finalPool.d; i++) {
            rolledDice.push({ val: Math.floor(Math.random() * 10) + 1, type: 'd' });
        }
        
        // Adiciona Wiggle Dice
        for (let i = 0; i < finalPool.wd; i++) {
            rolledDice.push({ val: 0, type: 'wd' }); 
        }

        return rolledDice;
    },

    // --- 4. PARSEAR RESULTADOS (LARGURA x ALTURA) ---
    /**
     * Lê os dados rolados e separa em Conjuntos (Sets) e Dados Soltos (Loose Dice).
     * ORE Rule: Largura (Width) = Quantidade | Altura (Height) = Valor da Face
     */
    parseResults: (rolledDice) => {
        if (!rolledDice || rolledDice.length === 0) {
            return { validSets: [], looseDice: [], allResults: [] };
        }

        const counts = {};
        
        // Mapeia as faces, ignorando Wiggle Dice ainda não definidos (val === 0)
        rolledDice.filter(d => d.val > 0).forEach(d => {
            counts[d.val] = (counts[d.val] || 0) + 1;
        });

        // Transforma { Face: Quantidade } em [{w: Quantidade, h: Face}]
        const allResults = Object.entries(counts)
            .map(([v, c]) => ({ w: c, h: parseInt(v) }))
            .sort((a, b) => b.w - a.w || b.h - a.h); // Prioridade ORE: Conjunto Mais Largo > Conjunto Mais Alto

        const validSets = allResults.filter(r => r.w >= 2);
        const looseDice = allResults.filter(r => r.w === 1);

        return { validSets, looseDice, allResults };
    },

    // --- 5. VERIFICAR WIGGLES PENDENTES ---
    /**
     * Checa se o jogador ainda precisa alocar valores manuais (?)
     */
    getPendingWiggles: (rolledDice) => {
        return rolledDice.filter(d => d.val === 0).length;
    },

    // --- 6. ATRIBUIR VALOR AO WIGGLE DICE ---
    /**
     * Usado pela interface para definir o valor de um WD específico.
     */
    assignWiggleValue: (rolledDice, index, value) => {
        let newDiceArray = [...rolledDice];
        if (newDiceArray[index] && newDiceArray[index].type === 'wd') {
            newDiceArray[index].val = value;
        }
        return newDiceArray;
    }

    // --- 7. (ESPAÇO FUTURO) RESOLVER DANO E LOCALIZAÇÃO ---
    // Ex: calculateDamage(validSets, weaponDamage)
    // Ex: getHitLocation(height)
};