const MODULE_ID = "multiversus-rpg";

export const PB_BASE_VALUES = {
    "Comum": 2,
    "Raro": 4,
    "Lendário": 8,
    "Mítico": 12,
    "Universal": 16,
    "Multiversal": 32
};

export const PB_MULTIPLIERS = {
    "origem": 1,
    "principal": 1,
    "estrutura": 1,
    "secundario": 0.5,
    "memoria": 1,
    "habilidade": 0.25,
    "intrinseca": 0.25,
    "item": 0.5
};

/**
 * Normaliza categoria e raridade de poderes:
 * - Talentos Principais e Secundários criados/salvos como Raro ou Comum tornam-se automaticamente "memoria" (Raro: 4 PB, 4 XP).
 * - Habilidades Especiais criadas/salvas como Raro ou Comum permanecem "habilidade" (Raro: 1 PB, 1 XP).
 * - Categorias "item", "estrutura", "origem" e "intrinseca" mantêm sua categoria original.
 */
export function normalizePowerCategoryAndRarity(category = "principal", rarity = "Comum") {
    let cat = (category || "principal").toString().trim().toLowerCase();
    if (cat === "memória" || cat === "memorias" || cat === "memórias") cat = "memoria";
    if (cat === "secundário") cat = "secundario";
    if (cat === "intrínseca" || cat === "habilidade intrínseca" || cat === "habilidades intrínsecas") cat = "intrinseca";
    if (cat === "itens") cat = "item";
    if (cat === "estruturas") cat = "estrutura";

    let rar = (rarity || "Comum").toString().trim();
    const isLowRarity = rar === "Raro" || rar === "Comum";

    if ((cat === "principal" || cat === "secundario") && isLowRarity) {
        return { category: "memoria", rarity: "Raro", converted: true };
    }

    if (cat === "memoria") {
        return { category: "memoria", rarity: "Raro", converted: rar !== "Raro" || category !== "memoria" };
    }

    if (cat === "habilidade" && isLowRarity) {
        return { category: "habilidade", rarity: "Raro", converted: rar !== "Raro" };
    }

    return { category: cat, rarity: rar, converted: false };
}

/**
 * Retorna o custo base de XP por dado Normal.
 */
export function getBasePowerXP(category = "principal", rarity = "Lendário") {
    const norm = normalizePowerCategoryAndRarity(category, rarity);
    switch (norm.category) {
        case "origem":
        case "item":
        case "estrutura":
        case "intrinseca":
            return 0;
        case "memoria":
            return 4;
        case "secundario":
            return 4;
        case "habilidade":
            return (norm.rarity === "Raro" || norm.rarity === "Comum") ? 1 : 2;
        case "principal":
        default:
            return 8;
    }
}

/**
 * Retorna o limite máximo de PB para a combinação de categoria e raridade.
 * - Toda Memória possui 4 de PB.
 * - Habilidade Especial Rara possui 1 de PB.
 * - Item possui o mesmo multiplicador de PB de um Talento Secundário (0.5x).
 */
export function getMaxPowerPB(category = "principal", rarity = "Lendário") {
    const norm = normalizePowerCategoryAndRarity(category, rarity);
    if (norm.category === "memoria") return 4;
    if (norm.category === "habilidade" && (norm.rarity === "Raro" || norm.rarity === "Comum")) return 1;

    const base = PB_BASE_VALUES[norm.rarity] ?? PB_BASE_VALUES[rarity] ?? 2;
    const mult = PB_MULTIPLIERS[norm.category] ?? 1;
    return Math.floor(base * mult);
}

/**
 * Normaliza um item do catálogo da Loja (StoreDatabase / StoreAdmin):
 * - Talentos Principais e Secundários com raridade Raro ou Comum viram "Memórias" (Raro, 4 PB, 4 XP).
 * - Habilidades Especiais com raridade Raro ou Comum ficam com 1 PB e 1 XP (Raro).
 */
export function normalizeStoreItem(item) {
    if (!item || typeof item !== "object") return { item, changed: false };
    let changed = false;
    item.system = item.system || {};

    const tag = item.systemTag || "";
    const rar = item.rarity || "Comum";
    const isLowRarity = rar === "Raro" || rar === "Comum";

    if ((tag === "Talentos Principais" || tag === "Talentos Secundários") && isLowRarity) {
        item.systemTag = "Memórias";
        item.rarity = "Raro";
        item.system.costPerDie = 4;
        item.system.xpCost = 4;
        changed = true;
    } else if (tag === "Memórias") {
        if (item.rarity !== "Raro") { item.rarity = "Raro"; changed = true; }
        if (item.system.xpCost !== 4) { item.system.xpCost = 4; changed = true; }
        if (!item.system.costPerDie || item.system.costPerDie !== 4) { item.system.costPerDie = 4; changed = true; }
    } else if (tag === "Habilidades Especiais" && isLowRarity) {
        if (item.rarity !== "Raro") { item.rarity = "Raro"; changed = true; }
        if (item.system.xpCost !== 1) { item.system.xpCost = 1; changed = true; }
        if (item.system.costPerDie !== 1) { item.system.costPerDie = 1; changed = true; }
    }

    return { item, changed };
}

/**
 * Executa verificação e migração automática silenciosa de itens/poderes já existentes nos bancos de dados (apenas Mestre).
 */
export async function runDatabasePowerMigration() {
    if (!game.user?.isGM) return;

    try {
        // 1. PowerDatabase (powersArchive)
        if (game.settings.settings.has(`${MODULE_ID}.powersArchive`)) {
            const pArchive = foundry.utils.deepClone(game.settings.get(MODULE_ID, "powersArchive") || []);
            let pChanged = false;
            for (const entry of pArchive) {
                const rawFlags = entry.rawItem?.flags?.[MODULE_ID] || {};
                const curCat = entry.category || rawFlags.category || "principal";
                const curRar = entry.rarity || rawFlags.rarity || "Comum";
                const norm = normalizePowerCategoryAndRarity(curCat, curRar);
                if (norm.category !== curCat || norm.rarity !== curRar) {
                    entry.category = norm.category;
                    entry.rarity = norm.rarity;
                    if (entry.rawItem) {
                        entry.rawItem.flags = entry.rawItem.flags || {};
                        entry.rawItem.flags[MODULE_ID] = entry.rawItem.flags[MODULE_ID] || {};
                        entry.rawItem.flags[MODULE_ID].category = norm.category;
                        entry.rawItem.flags[MODULE_ID].rarity = norm.rarity;
                    }
                    pChanged = true;
                }
            }
            if (pChanged) {
                await game.settings.set(MODULE_ID, "powersArchive", pArchive);
            }
        }

        // 2. StoreDatabase (masterArchive & storeCatalog)
        for (const settingKey of ["masterArchive", "storeCatalog"]) {
            if (game.settings.settings.has(`${MODULE_ID}.${settingKey}`)) {
                const list = foundry.utils.deepClone(game.settings.get(MODULE_ID, settingKey) || []);
                let sChanged = false;
                for (const item of list) {
                    const res = normalizeStoreItem(item);
                    if (res.changed) sChanged = true;
                }
                if (sChanged) {
                    await game.settings.set(MODULE_ID, settingKey, list);
                }
            }
        }

        // 3. ArchetypeDatabase (archetypeData)
        if (game.settings.settings.has(`${MODULE_ID}.archetypeData`)) {
            const archs = foundry.utils.deepClone(game.settings.get(MODULE_ID, "archetypeData") || []);
            let aChanged = false;
            for (const arch of archs) {
                if (Array.isArray(arch.talents)) {
                    for (const t of arch.talents) {
                        if (t?.flags?.[MODULE_ID]) {
                            const f = t.flags[MODULE_ID];
                            const norm = normalizePowerCategoryAndRarity(f.category || "principal", f.rarity || "Comum");
                            if (norm.category !== (f.category || "principal") || norm.rarity !== (f.rarity || "Comum")) {
                                f.category = norm.category;
                                f.rarity = norm.rarity;
                                aChanged = true;
                            }
                        }
                    }
                }
            }
            if (aChanged) {
                await game.settings.set(MODULE_ID, "archetypeData", archs);
            }
        }

        // 4. World Items (type === "power")
        if (game.items) {
            for (const item of game.items.filter(i => i.type === "power")) {
                const f = item.flags?.[MODULE_ID] || {};
                const curCat = f.category || "principal";
                const curRar = f.rarity || "Comum";
                const norm = normalizePowerCategoryAndRarity(curCat, curRar);
                if (norm.category !== curCat || norm.rarity !== curRar) {
                    await item.update({
                        [`flags.${MODULE_ID}.category`]: norm.category,
                        [`flags.${MODULE_ID}.rarity`]: norm.rarity
                    }, { render: false });
                }
            }
        }

        // 5. Embedded Actor Power Items
        if (game.actors) {
            for (const actor of game.actors) {
                const updates = [];
                for (const item of actor.items.filter(i => i.type === "power")) {
                    const f = item.flags?.[MODULE_ID] || {};
                    const curCat = f.category || "principal";
                    const curRar = f.rarity || "Comum";
                    const norm = normalizePowerCategoryAndRarity(curCat, curRar);
                    if (norm.category !== curCat || norm.rarity !== curRar) {
                        updates.push({
                            _id: item.id,
                            [`flags.${MODULE_ID}.category`]: norm.category,
                            [`flags.${MODULE_ID}.rarity`]: norm.rarity
                        });
                    }
                }
                if (updates.length > 0) {
                    await actor.updateEmbeddedDocuments("Item", updates, { render: false });
                }
            }
        }
    } catch (err) {
        console.error("MULTIVERSUS | Erro na verificação automática de Memórias:", err);
    }
}
