const MODULE_ID = "multiversus-rpg";

export class ExclusivityDatabase {
    static getGroups() {
        return game.settings.get(MODULE_ID, "exclusivityData") || [];
    }

    static async saveGroups(data) {
        await game.settings.set(MODULE_ID, "exclusivityData", data);
        game.socket.emit(`module.${MODULE_ID}`, { type: "EXCLUSIVITIES_UPDATED" });
        Hooks.callAll("exclusivitiesUpdated");
    }

    static async createGroup(name) {
        const list = this.getGroups();
        const newGroup = {
            id: foundry.utils.randomID(),
            name,
            exclusivities: []
        };
        list.push(newGroup);
        await this.saveGroups(list);
        return newGroup;
    }

    static async updateGroup(id, updates) {
        const list = this.getGroups();
        const index = list.findIndex(g => g.id === id);
        if (index === -1) return;
        list[index] = { ...list[index], ...updates };
        await this.saveGroups(list);
    }

    static async deleteGroup(id) {
        let list = this.getGroups();
        list = list.filter(g => g.id !== id);
        await this.saveGroups(list);
    }

    static async createVirtualExclusivity(groupId, data) {
        const list = this.getGroups();
        const group = list.find(g => g.id === groupId);
        if (!group) return;
        
        const exclusivityData = {
            id: foundry.utils.randomID(),
            name: data.name || "Nova Exclusividade",
            img: "icons/svg/item-bag.svg",
            type: "exclusividade",
            system: {
                category: data.category || "Geral",
                description: data.description || ""
            }
        };

        group.exclusivities.push(exclusivityData);
        await this.saveGroups(list);
    }

    static async updateExclusivity(groupId, exclusivityId, updates) {
        const list = this.getGroups();
        const group = list.find(g => g.id === groupId);
        if (!group) return;
        
        const index = group.exclusivities.findIndex(e => e.id === exclusivityId);
        if (index !== -1) {
            group.exclusivities[index] = { ...group.exclusivities[index], ...updates };
            await this.saveGroups(list);
        }
    }

    static async removeExclusivity(groupId, exclusivityId) {
        const list = this.getGroups();
        const group = list.find(g => g.id === groupId);
        if (!group) return;
        group.exclusivities = group.exclusivities.filter(e => e.id !== exclusivityId);
        await this.saveGroups(list);
    }
}
