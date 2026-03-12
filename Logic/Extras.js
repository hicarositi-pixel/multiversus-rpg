/**
 * Extras.js
 * Central de Automação de Qualidades Especiais (Extras e Falhas)
 * Caminho: src/Logic/Extras.js
 */

export const ExtrasLogic = {

    // =========================================================
    // 1. CÁLCULO DE CAPACIDADES (BOOSTER E NO UPWARD LIMIT)
    // =========================================================

    /**
     * Aplica o efeito do Extra "Booster" (Escala Linear)
     * Funciona tanto para atributos brutos (Body) quanto para Poderes.
     */
    applyBooster: (baseValue, metricType, levels = 0) => {
        if (levels <= 0) return baseValue;

        switch (metricType) {
            case 'mass':
            case 'lift':
                // Lift / Massa: Aumenta em +10x linearmente (1 lvl = 10x, 2 lvls = 20x...)
                return baseValue * (levels * 10);
            
            case 'range':
            case 'speed':
            case 'sprint':
            case 'jumpLength':
            case 'jumpHeight':
                // Alcance / Velocidade / Pulo: Aumenta em +1x linearmente (1 lvl = 2x, 2 lvls = 3x...)
                return baseValue * (1 + levels);

            case 'throw':
                // Arremesso: Ganha um valor fixo de +25 yards por nível de Booster
                return baseValue + (25 * levels);
            
            default:
                return baseValue;
        }
    },

    /**
     * Aplica o efeito de "No Upward Limit" (NUL) (Escala Exponencial)
     */
    applyNoUpwardLimit: (baseValue, willpowerSpent = 0) => {
        if (willpowerSpent <= 0) return baseValue;
        // Dobra a capacidade exponencialmente para cada ponto de Willpower gasto (2^N)
        return baseValue * Math.pow(2, willpowerSpent);
    },

    /**
     * FUNÇÃO MESTRE DE CAPACIDADE UNIVERSAL:
     * Pode ser chamada para calcular atributos físicos ou capacidades de poderes.
     */
    calculateFinalCapacity: (baseValue, metricType, options = {}) => {
        
        // 1º CHECK: Limitações Absolutas (Para poderes)
        if (metricType === 'self') {
            return { isAbsolute: true, rawValue: 0, display: "Apenas Você", mechanicalType: 'self' };
        }
        if (metricType === 'touch') {
            return { isAbsolute: true, rawValue: 0, display: "Toque Físico", mechanicalType: 'touch' };
        }

        // 2º CHECK: Matemática (Booster -> NUL)
        const { boosterLevels = 0, willpowerSpent = 0 } = options;
        
        // Pula o cálculo se a base for texto descritivo (ex: dano de Corpo)
        if (typeof baseValue !== 'number') {
            return { isAbsolute: true, rawValue: baseValue, display: String(baseValue), mechanicalType: metricType };
        }

        let boostedValue = ExtrasLogic.applyBooster(baseValue, metricType, boosterLevels);
        let finalValue = ExtrasLogic.applyNoUpwardLimit(boostedValue, willpowerSpent);

        // 3º: Retorno Estruturado Universal
        return {
            isAbsolute: false,
            rawValue: finalValue,
            display: ExtrasLogic.formatUnit(finalValue, metricType),
            mechanicalType: metricType
        };
    },

    // =========================================================
    // 2. FORMATAÇÃO UNIVERSAL
    // =========================================================

    formatUnit: (value, metricType) => {
        if (typeof value !== 'number') return String(value);
        
        const formatNumber = (num) => num.toLocaleString('en-US', { maximumFractionDigits: 2 });

        if (metricType === 'mass' || metricType === 'lift') {
            if (value >= 2000) return `${formatNumber(value / 2000)} Tons`;
            return `${formatNumber(value)} lbs`;
        }
        
        if (['speed', 'throw', 'jumpLength', 'jumpHeight', 'range', 'sprint'].includes(metricType)) {
            if (value >= 1760) return `${formatNumber(value / 1760)} Miles`;
            return `${formatNumber(value)} yds`;
        }

        return String(value);
    }
};