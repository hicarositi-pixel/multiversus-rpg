const MODULE_ID = "multiversus-rpg";

export class ArchetypeDatabase {
    static getArchetypes() {
        return game.settings.get(MODULE_ID, "archetypeData") || [];
    }

    static async saveArchetypes(data) {
        await game.settings.set(MODULE_ID, "archetypeData", data);
        game.socket.emit(`module.${MODULE_ID}`, { type: "ARCHETYPES_UPDATED" });
        Hooks.callAll("archetypesUpdated");
    }

    static async createArchetype(name, description = "", icon = "icons/svg/item-bag.svg") {
        const list = this.getArchetypes();
        const newArch = {
            id: foundry.utils.randomID(),
            name,
            description,
            icon,
            talents: []
        };
        list.push(newArch);
        await this.saveArchetypes(list);
        return newArch;
    }

    static async updateArchetype(id, updates) {
        const list = this.getArchetypes();
        const index = list.findIndex(a => a.id === id);
        if (index === -1) return;
        list[index] = { ...list[index], ...updates };
        await this.saveArchetypes(list);
    }

    static async deleteArchetype(id) {
        let list = this.getArchetypes();
        list = list.filter(a => a.id !== id);
        await this.saveArchetypes(list);
    }

    static async addTalent(archetypeId, itemData) {
        const list = this.getArchetypes();
        const arch = list.find(a => a.id === archetypeId);
        if (!arch) return;
        
        const category = itemData.flags?.["multiversus-rpg"]?.category || "principal";
        let calcCost = 1;
        if (category === "principal") calcCost = 8;
        else if (category === "secundario") calcCost = 4;
        else if (category === "habilidade" || category === "origem") calcCost = 2;

        const talentData = {
            id: foundry.utils.randomID(),
            foundryItemId: itemData._id || itemData.id,
            name: itemData.name,
            img: itemData.img,
            type: itemData.type,
            system: foundry.utils.duplicate(itemData.system || itemData.data || {}),
            flags: foundry.utils.duplicate(itemData.flags || {}),
            cost: calcCost
        };

        arch.talents.push(talentData);
        await this.saveArchetypes(list);
    }

    static async removeTalent(archetypeId, talentId) {
        const list = this.getArchetypes();
        const arch = list.find(a => a.id === archetypeId);
        if (!arch) return;
        arch.talents = arch.talents.filter(t => t.id !== talentId);
        await this.saveArchetypes(list);
    }
}
