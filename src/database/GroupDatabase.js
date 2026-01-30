import { get } from 'svelte/store';
// Imports dos JSONs
import personalities from '../../crafting/personalities.json';
import groupState from '../../crafting/GroupBaseState.json';
import defaultStates from '../../crafting/default_states.json';

const MODULE_ID = "multiversus-rpg";

export class GroupDatabase {
    static init() {
        // Database de Facções (Instâncias Ativas)
        game.settings.register(MODULE_ID, "factions_data", {
            scope: "world",
            config: false,
            type: Array,
            default: []
        });

        // Database de Projetos de Estruturas (Blueprints Globais)
        game.settings.register(MODULE_ID, "structure_blueprints", {
            scope: "world", 
            config: false, 
            type: Array, 
            default: []
        });

        // --- LISTENER DE SOCKET (O GM OUVE AQUI) ---
        game.socket.on(`module.${MODULE_ID}`, async (payload) => {
            // Se eu sou o GM Principal ativo, eu processo os pedidos de escrita
            if (game.user.id === game.users.activeGM?.id) {
                
                // 1. Pedido para salvar Grupos (Create/Join/Update/Delete)
                if (payload.type === "REQUEST_SAVE_GROUPS") {
                    console.log("Database: GM salvando alterações de grupos solicitadas por jogador.");
                    await game.settings.set(MODULE_ID, "factions_data", payload.data);
                    // Avisa a todos que atualizou
                    game.socket.emit(`module.${MODULE_ID}`, { type: "GROUP_UPDATE" });
                    Hooks.callAll("groupSystemUpdate");
                }

                // 2. Pedido para salvar Blueprints
                if (payload.type === "REQUEST_SAVE_BLUEPRINTS") {
                    await game.settings.set(MODULE_ID, "structure_blueprints", payload.data);
                    game.socket.emit(`module.${MODULE_ID}`, { type: "GROUP_UPDATE" });
                    Hooks.callAll("groupSystemUpdate");
                }
            }

            // Se for apenas notificação de update (para todos)
            if (payload.type === "GROUP_UPDATE") {
                Hooks.callAll("groupSystemUpdate");
            }
        });

        console.log("MULTIVERSUS | Database de Facções & Estruturas Iniciada (Socket Ready).");
    }

    // --- LEITURA (Qualquer um pode ler) ---
    static getGroups() {
        return game.settings.get(MODULE_ID, "factions_data") || [];
    }

    // --- ESCRITA INTELIGENTE (Socket Delegate) ---
    static async updateGroups(newData) {
        if (game.user.isGM) {
            // Se sou GM, salvo direto
            await game.settings.set(MODULE_ID, "factions_data", newData);
            game.socket.emit(`module.${MODULE_ID}`, { type: "GROUP_UPDATE" });
            Hooks.callAll("groupSystemUpdate");
        } else {
            // Se sou Jogador, peço pro GM salvar
            if (!game.users.activeGM) {
                ui.notifications.error("Nenhum Mestre online para validar a alteração.");
                return;
            }
            game.socket.emit(`module.${MODULE_ID}`, { 
                type: "REQUEST_SAVE_GROUPS", 
                data: newData 
            });
            // Atualização otimista local para fluidez
            Hooks.callAll("groupSystemUpdate"); 
        }
    }

    static async updateGroupData(groupId, updateData) {
        const groups = this.getGroups(); // Lê o estado atual
        const index = groups.findIndex(g => g.id === groupId);
        if (index !== -1) {
            groups[index] = { ...groups[index], ...updateData };
            await this.updateGroups(groups); 
        }
    }

    // =================================================================
    //                          GERENCIAMENTO DE GRUPO
    // =================================================================

  // --- CORREÇÃO: CRIAÇÃO ---
    static async createGroup(name, leaderId, password = "", isNomad = false) {
        const groups = this.getGroups();
        if (groups.find(g => g.name === name)) throw new Error("Nome já existe.");

        // Clone profundo para evitar referência
        const baseTemplate = JSON.parse(JSON.stringify(defaultStates.BASE || {}));
        
        const newGroup = {
            // MERGE: O template vem por último, mas NÃO pode sobrescrever o nome
            // Então espalhamos o template PRIMEIRO, e depois as props específicas
            ...baseTemplate, 
            
            id: foundry.utils.randomID(),
            name: name, // Agora o nome passado tem prioridade
            password: password,
            leader: leaderId,
            members: [leaderId],
            isNomad: isNomad,
            createdAt: Date.now(),
            
            // Garante campos vitais se o template falhar
            resources: baseTemplate.resources || { metal: 0, fuel: 0, tech: 0 },
            bio: baseTemplate.bio || { fome: 10, sede: 10, exaustao: 0 }, 
            baseStats: baseTemplate.baseStats || { hp: 20, maxHp: 20, har: 0, lar: 0, protection: 1 },
            structures: [], 
            missions: [],
            inventory: { MATERIA:{}, ENERGIA:{}, ORGANISMO:{}, NUCLEO:{} },
            npcs: [],
            population: { count: 0, max: 10 }
        };

        groups.push(newGroup);
        await this.updateGroups(groups);
        return newGroup;
    }

    // --- NOVA FUNÇÃO: RENOMEAR ---
    static async renameGroup(groupId, newName) {
        const groups = this.getGroups();
        const group = groups.find(g => g.id === groupId);
        if (group) {
            group.name = newName;
            await this.updateGroups(groups);
        }
    }
    // --- FUNÇÃO QUE FALTAVA ---
    static async deleteGroup(groupId) {
        let groups = this.getGroups();
        // Filtra o grupo fora da lista
        const newGroups = groups.filter(g => g.id !== groupId);
        
        // Se nada mudou, não faz nada
        if (newGroups.length === groups.length) return;

        await this.updateGroups(newGroups);
    }
    // --------------------------

    static async joinGroup(groupId, userId, inputPassword = "") {
        const groups = this.getGroups();
        const group = groups.find(g => g.id === groupId);
        
        if (!group) throw new Error("Grupo inexistente.");
        if (group.members.includes(userId)) throw new Error("Já é membro.");

        if (group.password && group.password !== "" && !game.user.isGM) {
            if (inputPassword !== group.password) throw new Error("Senha Incorreta.");
        }

        this.removeMemberFromAll(groups, userId);
        group.members.push(userId);
        
        await this.updateGroups(groups);
    }

    static async leaveGroup(userId) {
        const groups = this.getGroups();
        this.removeMemberFromAll(groups, userId);
        await this.updateGroups(groups);
    }

    static removeMemberFromAll(groups, userId) {
        for (let i = groups.length - 1; i >= 0; i--) {
            const g = groups[i];
            g.members = g.members.filter(m => m !== userId);
            // Se for nomade e ficar vazio, deleta automaticamente para não poluir
            if (g.isNomad && g.members.length === 0) {
                groups.splice(i, 1);
            }
        }
    }

    static getUserGroup(userId) {
        return this.getGroups().find(g => g.members.includes(userId));
    }

    static async kickMember(groupId, targetId) {
        const groups = this.getGroups();
        const group = groups.find(g => g.id === groupId);
        if (group) {
            group.members = group.members.filter(m => m !== targetId);
            await this.updateGroups(groups);
        }
    }

    // =================================================================
    //                          SISTEMA DE ESTRUTURAS
    // =================================================================

    static getBlueprints() {
        return game.settings.get(MODULE_ID, "structure_blueprints") || [];
    }

    // --- ESCRITA DE BLUEPRINTS (COM SOCKET) ---
    static async updateBlueprints(newBps) {
        if (game.user.isGM) {
            await game.settings.set(MODULE_ID, "structure_blueprints", newBps);
            game.socket.emit(`module.${MODULE_ID}`, { type: "GROUP_UPDATE" });
            Hooks.callAll("groupSystemUpdate");
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
    //                          CICLO DE VIDA & NPCs
    // =================================================================

    static async runNPCCycle(groupId) {
        const groups = this.getGroups();
        const group = groups.find(g => g.id === groupId);
        if (!group) return;

        let log = [];
        let summary = { produced: {} };

        // 1. SUSTENTO
        const npcCount = group.npcs ? group.npcs.length : 0;
        let totalOrganismNeeded = npcCount * 2; 
        let consumed = 0;

        if (!group.inventory) group.inventory = {ORGANISMO:{}}; // Proteção

        for (let t = 1; t <= 7; t++) {
            if (totalOrganismNeeded <= 0) break;
            let available = group.inventory.ORGANISMO[t] || 0;
            let take = Math.min(available, totalOrganismNeeded);
            
            group.inventory.ORGANISMO[t] -= take;
            totalOrganismNeeded -= take;
            consumed += take;
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
        newNPC.roleLabel = roleData.label; 
        newNPC.personality = randomPersKey;
        newNPC.personalityLabel = persData.label;
        newNPC.rarity = rarityKey;
        newNPC.img = "icons/svg/mystery-man.svg"; 
        newNPC.description = persData.description;

        newNPC.stats = newNPC.stats || {};
        newNPC.stats.production_bonus = rarityData.production_val;
        newNPC.stats.combat_dice = rarityData.combat_dice;
        newNPC.stats.personality_effect = persData.effect.label;

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