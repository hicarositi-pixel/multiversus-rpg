import { get } from 'svelte/store';
import personalities from '../../crafting/personalities.json';
import groupState from '../../crafting/GroupBaseState.json';
import defaultStates from '../../crafting/default_states.json';

const MODULE_ID = "multiversus-rpg";

export class GroupDatabase {
    static init() {
        // Database de Facções
        game.settings.register(MODULE_ID, "factions_data", {
            scope: "world",
            config: false,
            type: Array,
            default: []
        });

        // Database de Blueprints
        game.settings.register(MODULE_ID, "structure_blueprints", {
            scope: "world", 
            config: false, 
            type: Array, 
            default: []
        });

        // --- SOCKET LISTENER (O CÉREBRO DA SINCRONIA) ---
        game.socket.on(`module.${MODULE_ID}`, async (payload) => {
            // Apenas o GM Ativo processa as escritas para evitar duplicidade
            if (game.user.id === game.users.activeGM?.id) {
                
                if (payload.type === "REQUEST_SAVE_GROUPS") {
                    console.log("[Nexus DB] GM processando save de grupos...");
                    // O GM salva os dados recebidos (Merge ou Overwrite dependendo da lógica)
                    // Aqui assumimos que o payload.data já é o array completo tratado pelo solicitante
                    // Nota: Em sistemas complexos, o ideal é o GM fazer o merge, mas para simplificar:
                    await game.settings.set(MODULE_ID, "factions_data", payload.data);
                    
                    // Avisa a todos que houve mudança
                    game.socket.emit(`module.${MODULE_ID}`, { type: "GROUP_UPDATE" });
                    Hooks.callAll("nexusGroupUpdate");
                }

                if (payload.type === "REQUEST_SAVE_BLUEPRINTS") {
                    await game.settings.set(MODULE_ID, "structure_blueprints", payload.data);
                    game.socket.emit(`module.${MODULE_ID}`, { type: "GROUP_UPDATE" });
                    Hooks.callAll("nexusGroupUpdate");
                }
            }

            // Todos os clientes (incluindo o GM que não processou) recebem isso
            if (payload.type === "GROUP_UPDATE") {
                Hooks.callAll("nexusGroupUpdate");
            }
        });

        console.log("MULTIVERSUS | Database de Facções Iniciada.");
    }

    // --- LEITURA ---
    static getGroups() {
        return game.settings.get(MODULE_ID, "factions_data") || [];
    }

    static getBlueprints() {
        return game.settings.get(MODULE_ID, "structure_blueprints") || [];
    }

    // --- ESCRITA SEGURA ---
    static async updateGroups(newData) {
        if (game.user.isGM) {
            // GM salva direto
            await game.settings.set(MODULE_ID, "factions_data", newData);
            game.socket.emit(`module.${MODULE_ID}`, { type: "GROUP_UPDATE" });
            Hooks.callAll("nexusGroupUpdate");
        } else {
            // Jogador pede pro GM salvar
            if (!game.users.activeGM) {
                return ui.notifications.error("Nenhum Mestre online para salvar as alterações.");
            }
            game.socket.emit(`module.${MODULE_ID}`, { 
                type: "REQUEST_SAVE_GROUPS", 
                data: newData 
            });
            // Atualiza localmente para feedback instantâneo (Otimista)
            Hooks.callAll("nexusGroupUpdate");
        }
    }

    static async updateGroupData(groupId, updateData) {
        // Recarrega para garantir dados frescos antes de mergear
        const groups = this.getGroups(); 
        const index = groups.findIndex(g => g.id === groupId);
        
        if (index !== -1) {
            // Merge recursivo para não perder dados aninhados (Inventory, Bio)
            groups[index] = foundry.utils.mergeObject(groups[index], updateData);
            await this.updateGroups(groups); 
        }
    }

    // =================================================================
    //                          AÇÕES DE GRUPO
    // =================================================================

    static async createGroup(name, leaderId, password = "", isNomad = false) {
        const groups = this.getGroups();
        if (groups.find(g => g.name === name)) throw new Error("Nome já existe.");

        const baseTemplate = JSON.parse(JSON.stringify(defaultStates.BASE || {}));
        
        const newGroup = {
            ...baseTemplate, 
            id: foundry.utils.randomID(),
            name: name, 
            password: password,
            leader: leaderId,
            members: [leaderId], // Líder já entra como membro
            isNomad: isNomad,
            createdAt: Date.now(),
            
            // Garante inicialização de objetos vitais
            resources: baseTemplate.resources || { metal: 0, fuel: 0, tech: 0 },
            bio: baseTemplate.bio || { fome: 10, sede: 10, exaustao: 0 }, 
            baseStats: baseTemplate.baseStats || { hp: 20, maxHp: 20, har: 0, lar: 0, protection: 1 },
            structures: [], 
            missions: [],
            // Importante: Inicializa todos os tipos de material para evitar undefined
            inventory: { MATERIA:{}, ENERGIA:{}, ORGANISMO:{}, NUCLEO:{}, ...(baseTemplate.inventory || {}) },
            npcs: [],
            population: { count: 0, max: 10 }
        };

        groups.push(newGroup);
        await this.updateGroups(groups);
        return newGroup;
    }

    static async renameGroup(groupId, newName) {
        const groups = this.getGroups();
        const group = groups.find(g => g.id === groupId);
        if (group) {
            group.name = newName;
            await this.updateGroups(groups);
        }
    }

    static async deleteGroup(groupId) {
        let groups = this.getGroups();
        const newGroups = groups.filter(g => g.id !== groupId);
        if (newGroups.length === groups.length) return;
        await this.updateGroups(newGroups);
    }

    static async joinGroup(groupId, userId, inputPassword = "") {
        const groups = this.getGroups();
        const group = groups.find(g => g.id === groupId);
        
        if (!group) throw new Error("Grupo inexistente.");
        if (group.members.includes(userId)) throw new Error("Já é membro.");

        if (group.password && group.password !== "" && !game.user.isGM) {
            if (inputPassword !== group.password) throw new Error("Senha Incorreta.");
        }

        // Remove de outros grupos antes de entrar (Regra de 1 grupo por vez)
        this.removeMemberFromAll(groups, userId);
        
        group.members.push(userId);
        await this.updateGroups(groups);
    }

    static async leaveGroup(userId) {
        const groups = this.getGroups();
        this.removeMemberFromAll(groups, userId);
        await this.updateGroups(groups);
    }

    // Helper interno: Remove usuário de qualquer grupo e limpa grupos nômades vazios
    static removeMemberFromAll(groups, userId) {
        for (let i = groups.length - 1; i >= 0; i--) {
            const g = groups[i];
            // Filtra membros
            g.members = g.members.filter(m => m !== userId);
            
            // Se for nômade e ficar vazio, deleta o grupo
            if (g.isNomad && g.members.length === 0) {
                groups.splice(i, 1);
            }
        }
    }

    static getUserGroup(userId) {
        return this.getGroups().find(g => g.members.includes(userId));
    }

    // =================================================================
    //                          ESTRUTURAS (BLUEPRINTS)
    // =================================================================

    static async updateBlueprints(newBps) {
        if (game.user.isGM) {
            await game.settings.set(MODULE_ID, "structure_blueprints", newBps);
            game.socket.emit(`module.${MODULE_ID}`, { type: "GROUP_UPDATE" });
            Hooks.callAll("nexusGroupUpdate");
        } else {
            if (!game.users.activeGM) return;
            game.socket.emit(`module.${MODULE_ID}`, { type: "REQUEST_SAVE_BLUEPRINTS", data: newBps });
        }
    }

    static async saveBlueprint(blueprint) {
        const bps = this.getBlueprints();
        const index = bps.findIndex(b => b.id === blueprint.id);
        if (index !== -1) bps[index] = blueprint;
        else bps.push(blueprint);
        await this.updateBlueprints(bps);
    }

    static async deleteBlueprint(bpId) {
        let bps = this.getBlueprints();
        bps = bps.filter(b => b.id !== bpId);
        await this.updateBlueprints(bps);
    }

    static async buildStructure(groupId, blueprint) {
        const groups = this.getGroups();
        const group = groups.find(g => g.id === groupId);
        if (!group) return;

        const newStruct = JSON.parse(JSON.stringify(blueprint));
        newStruct.instanceId = foundry.utils.randomID();
        newStruct.active = true;
        newStruct.currentHp = newStruct.stats.hp;

        if (!Array.isArray(group.structures)) group.structures = [];
        group.structures.push(newStruct);
        
        await this.updateGroups(groups);
    }

    static async deleteStructureInstance(groupId, instanceId) {
        const groups = this.getGroups();
        const group = groups.find(g => g.id === groupId);
        if (!group) return;
        group.structures = group.structures.filter(s => s.instanceId !== instanceId);
        await this.updateGroups(groups);
    }

    // =================================================================
    //                          CICLO E NPCS
    // =================================================================

    static async runNPCCycle(groupId) {
        const groups = this.getGroups();
        const group = groups.find(g => g.id === groupId);
        if (!group) return;

        let log = [];
        let summary = { produced: {} };

        // 1. SUSTENTO
        const npcCount = group.npcs ? group.npcs.length : 0;
        let totalOrganismNeeded = npcCount * 2; // 2 recursos por NPC
        let consumed = 0;

        if (!group.inventory) group.inventory = {ORGANISMO:{}}; 
        if (!group.inventory.ORGANISMO) group.inventory.ORGANISMO = {};

        for (let t = 1; t <= 7; t++) {
            if (totalOrganismNeeded <= 0) break;
            let available = group.inventory.ORGANISMO[t] || 0;
            let take = Math.min(available, totalOrganismNeeded);
            
            if (take > 0) {
                group.inventory.ORGANISMO[t] -= take;
                totalOrganismNeeded -= take;
                consumed += take;
            }
        }

        if (totalOrganismNeeded > 0) {
            group.bio.fome = Math.max(0, group.bio.fome - 2);
            group.bio.sede = Math.max(0, group.bio.sede - 2);
            log.push(`<span style="color:red">⚠️ Escassez! Sinais vitais reduzidos. (Faltou: ${totalOrganismNeeded} un)</span>`);
        } else {
            log.push(`<span style="color:green">✅ Sustento garantido. Consumido: ${consumed} Organismos.</span>`);
        }

        // 2. PRODUÇÃO
        if (group.npcs) {
            group.npcs.forEach(npc => {
                const roleData = groupState.ROLES ? groupState.ROLES[npc.role] : null;
                if (!roleData || roleData.output_resource === "DEFESA") return;

                let productionVal = npc.stats.production_bonus || 2;
                const resType = roleData.output_resource;
                
                if (!summary.produced[resType]) summary.produced[resType] = 0;
                summary.produced[resType] += productionVal;
                
                if(!group.inventory[resType]) group.inventory[resType] = {};
                group.inventory[resType][1] = (group.inventory[resType][1] || 0) + productionVal;
            });
        }

        if (Object.keys(summary.produced).length > 0) {
             for (const [res, qtd] of Object.entries(summary.produced)) {
                log.push(`Produzido: <b>${qtd}x ${res}</b> (Comum)`);
            }
        } else {
            log.push(`Sem produção neste ciclo.`);
        }

        await this.updateGroups(groups);
        
        ChatMessage.create({
            content: `
            <div style="background:#050505; color:#00ff41; border:1px solid #00ff41; padding:10px; font-family:'Share Tech Mono'">
                <h3 style="border-bottom:1px solid #00ff41; margin-top:0;">RELATÓRIO DE CICLO</h3>
                ${log.join('<br>')}
            </div>`
        });
    }

    static async generateRandomNPC(groupId) {
        const groups = this.getGroups();
        const group = groups.find(g => g.id === groupId);
        if (!group) return;

        const rolesKeys = Object.keys(groupState.ROLES);
        const randomRoleKey = rolesKeys[Math.floor(Math.random() * rolesKeys.length)];
        const roleData = groupState.ROLES[randomRoleKey];
        
        const persKeys = Object.keys(personalities);
        const randomPersKey = persKeys[Math.floor(Math.random() * persKeys.length)];
        const persData = personalities[randomPersKey];

        const rarityKey = "COMUM";
        const rarityData = groupState.RARITY_SCALE[rarityKey];

        const newNPC = JSON.parse(JSON.stringify(defaultStates.NPC || {}));
        newNPC.id = foundry.utils.randomID();
        newNPC.name = `Sobrevivente ${Math.floor(Math.random()*1000)}`;
        newNPC.role = randomRoleKey;
        newNPC.personality = randomPersKey;
        newNPC.rarity = rarityKey;
        newNPC.img = "icons/svg/mystery-man.svg"; 
        newNPC.description = persData.description;

        newNPC.stats = {
            production_bonus: rarityData.production_val,
            combat_dice: rarityData.combat_dice,
            personality_effect: persData.effect.label
        };

        if(!group.npcs) group.npcs = [];
        group.npcs.push(newNPC);
        group.population.count++;
        
        await this.updateGroups(groups);
    }

    static async deleteNPC(groupId, npcId) {
        const groups = this.getGroups();
        const group = groups.find(g => g.id === groupId);
        if (!group) return;
        group.npcs = group.npcs.filter(n => n.id !== npcId);
        group.population.count = Math.max(0, group.population.count - 1);
        await this.updateGroups(groups);
    }

    // =================================================================
    //                          MISSÕES
    // =================================================================

    static async addMission(groupId, missionData) {
        const groups = this.getGroups();
        const group = groups.find(g => g.id === groupId);
        if (!group) return;

        const newMission = {
            id: foundry.utils.randomID(),
            title: missionData.title,
            difficulty: missionData.difficulty,
            desc: missionData.desc,
            objectives: missionData.objectives.map(obj => ({
                text: obj.text,
                hidden: obj.hidden,
                completed: false
            })),
            rewards: missionData.rewards,
            status: "ACTIVE"
        };

        if (!group.missions) group.missions = [];
        group.missions.push(newMission);
        await this.updateGroups(groups);
    }

    static async toggleObjective(groupId, missionId, objIndex, field) {
        const groups = this.getGroups();
        const group = groups.find(g => g.id === groupId);
        const mission = group.missions.find(m => m.id === missionId);
        
        if (mission && mission.objectives[objIndex]) {
            mission.objectives[objIndex][field] = !mission.objectives[objIndex][field];
            await this.updateGroups(groups);
        }
    }
    
    static async deleteMission(groupId, missionId) {
        const groups = this.getGroups();
        const group = groups.find(g => g.id === groupId);
        group.missions = group.missions.filter(m => m.id !== missionId);
        await this.updateGroups(groups);
    }
}