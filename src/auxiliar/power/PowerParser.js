import { EXTRAS_DB } from '../../data/extras-data.js';
import { FLAWS_DB } from '../../data/flaws-data.js';

const MODULE_ID = "multiversus-rpg";
const XP_RULES = { "origem": 0, "principal": 8, "secundario": 4, "habilidade": 2 };

export const PowerParser = {
    // ========================================================================
    // 1. GERA O TEXTO NO FORMATO DO LIVRO (O que a IA e o Terminal entendem)
    // ========================================================================
    exportToText: (rawItem) => {
        const flags = rawItem.flags?.[MODULE_ID] || {};
        const sys = rawItem.system || {};
        const dice = flags.dice || { normal: 0, hard: 0, wiggle: 0 };
        const qualities = flags.qualities || [];
        const cat = (flags.category || 'principal').toLowerCase();
        
        let baseCost = XP_RULES[cat] || 0;
        let xpCost = (dice.normal * baseCost) + (dice.hard * baseCost * 2) + (dice.wiggle * baseCost * 4);
        
        let usedPB = qualities.reduce((total, q) => {
            const extrasCost = (q.extras || []).reduce((sum, e) => sum + ((e.cost||0) * (e.qty || 1)), 0);
            return total + 2 + (q.level || 0) + extrasCost;
        }, 0);

        // AQUI ELE GERA AQUELE FORMATO BONITO QUE VOCÊ PEDIU!
        let text = `${(rawItem.name || 'Poder').toUpperCase()} (${usedPB} PB | ${xpCost} XP)\n`;
        text += `Categoria: ${flags.category?.toUpperCase() || 'PRINCIPAL'} | Raridade: ${flags.rarity?.toUpperCase() || 'COMUM'}\n`;
        text += `Dados: ${dice.normal}d + ${dice.hard}hd + ${dice.wiggle}wd\n\n`;

        let activeQTypes = qualities.map(q => q.type === 'atk' ? 'A' : q.type === 'def' ? 'D' : 'U');
        if (activeQTypes.length > 0) text += `Qualities: ${[...new Set(activeQTypes)].join(" ")}\n\n`;

        qualities.forEach((q, i) => {
            const typeLetter = q.type === 'atk' ? 'Ataque' : q.type === 'def' ? 'Defesa' : 'Útil';
            
            const mods = (q.extras || []).map(m => `${m.name} ${m.cost > 0 ? '+' : ''}${m.cost}${m.qty > 1 ? ` (x${m.qty})` : ''}`);
            const modString = mods.length > 0 ? mods.join(", ") : "None";
            const capString = (q.capacities || []).map(c => c.type).join(", ") || "None";

            text += `Sub-rotina #${i+1}: ${q.name} (Nv ${q.level || 0})\n`;
            text += `${typeLetter} Extras and Flaws: ${modString}. Capacities: ${capString}.\n`;
            if (q.description) text += `> ${q.description}\n`;
            text += `\n`;
        });

        // Tira o HTML caso o poder "fantasma" antigo ainda tenha
        let cleanNotes = (sys.notes || "Sem descrição narrativa.").replace(/<[^>]*>?/gm, '');
        text += `Effect: ${cleanNotes}`;
        return text;
    },

    // ========================================================================
    // 2. LÊ O TEXTO DE LIVRO DA IA E CONVERTE DE VOLTA PRA FICHA!
    // ========================================================================
    parseToItem: (rawText) => {
        let data = {
            name: "Padrão Desconhecido",
            type: "power", 
            img: "icons/magic/light/explosion-star-blue.webp",
            flags: {
                [MODULE_ID]: {
                    category: "principal", rarity: "Comum",
                    dice: { normal: 0, hard: 0, wiggle: 0 },
                    qualities: [], tags: [], themeKey: "neon-operator", isInitial: false
                }
            },
            system: { notes: "" }
        };

        const flags = data.flags[MODULE_ID];
        
        // 1. CAPTURA O NOME (Linha 1 ex: TIRO (2 PB | 16 XP))
        const firstLine = rawText.split('\n')[0];
        if (firstLine && firstLine.includes("(")) data.name = firstLine.split('(')[0].trim();
        else if (firstLine) data.name = firstLine.replace(/NOME:/i, "").trim();

        // 2. CATEGORIA E RARIDADE
        const catMatch = rawText.match(/Categoria:\s*([a-zA-ZÀ-ÿ]+)/i);
        if (catMatch) flags.category = catMatch[1].toLowerCase();
        
        const rarMatch = rawText.match(/Raridade:\s*([a-zA-ZÀ-ÿ]+)/i);
        if (rarMatch) flags.rarity = rarMatch[1];

        // 3. DADOS DA MATRIZ
        const diceMatch = rawText.match(/Dados:\s*(\d+)d\s*\+\s*(\d+)hd\s*\+\s*(\d+)wd/i);
        if (diceMatch) flags.dice = { normal: parseInt(diceMatch[1])||0, hard: parseInt(diceMatch[2])||0, wiggle: parseInt(diceMatch[3])||0 };

        // 4. EFEITO GERAL (Corta o HTML se houver sobra)
        const effectMatch = rawText.match(/Effect:\s*([\s\S]*)/i) || rawText.match(/EFEITO:\s*([\s\S]*)/i);
        if (effectMatch) data.system.notes = effectMatch[1].replace(/<[^>]*>?/gm, '').trim();

        // 5. LÊ CADA SUB-ROTINA
        const subrotinaBlocks = rawText.split(/Sub-rotina #\d+:/i).slice(1);
        
        subrotinaBlocks.forEach(block => {
            let q = {
                id: foundry.utils.randomID(), type: "util", name: "Nova Sub-rotina", level: 0,
                capacities: [], extras: [], description: ""
            };

            const headerMatch = block.match(/^\s*(.+?)\s*\(Nv\s*(\d+)\)/i);
            if (headerMatch) { q.name = headerMatch[1].trim(); q.level = parseInt(headerMatch[2]) || 0; }

            if (block.match(/Ataque Extras/i)) q.type = 'atk';
            else if (block.match(/Defesa Extras/i)) q.type = 'def';

            const capMatch = block.match(/Capacities:\s*(.*?)(?=\.|\n|$)/i);
            if (capMatch && capMatch[1].trim().toUpperCase() !== "NONE") {
                q.capacities = capMatch[1].split(',').map(s => ({
                    type: s.trim().toLowerCase(), nul: 0, booster: 0, collapsed: false
                })).filter(c => c.type !== "");
            }

            const modMatch = block.match(/Extras and Flaws:\s*(.*?)(?=\.\s*Capacities|\n|$)/i);
            if (modMatch && modMatch[1].trim().toUpperCase() !== "NONE") {
                modMatch[1].trim().split(',').forEach(modText => {
                    let matchQty = modText.match(/\(x(\d+)\)/i);
                    let qty = matchQty ? parseInt(matchQty[1]) : 1;
                    let cleanMod = modText.replace(/\(x\d+\)/i, '').replace(/[+-]\d+/, "").trim().toLowerCase();
                    
                    if (cleanMod) {
                        let ext = EXTRAS_DB.find(e => cleanMod.includes(e.name.toLowerCase()));
                        let flaw = FLAWS_DB.find(f => cleanMod.includes(f.name.toLowerCase()));
                        
                        if (ext) q.extras.push({ id: ext.id, name: ext.name, cost: ext.cost, qty: qty });
                        else if (flaw) q.extras.push({ id: flaw.id, name: flaw.name, cost: flaw.cost, qty: qty });
                        else {
                            let customCostMatch = modText.match(/([+-]\d+)/);
                            q.extras.push({ id: foundry.utils.randomID(), name: cleanMod.toUpperCase(), cost: customCostMatch ? parseInt(customCostMatch[1]) : 0, qty: qty });
                        }
                    }
                });
            }

            const descMatch = block.match(/>\s*(.*)/);
            if (descMatch) q.description = descMatch[1].trim();

            flags.qualities.push(q);
        });

        return data;
    }
};