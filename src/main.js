// =========================================================
// 1. IMPORTS GERAIS
// =========================================================
import './styles/global.css'; 

// Apps Svelte
import FichaComponente from './apps/Ficha.svelte';
import AdminButton from './AdminButton.svelte'; 
import MacroScanner from './MacroScanner.svelte';
import AuxiliarButton from './auxiliar/AuxiliarButton.svelte';
import SocialButton from './apps/SocialButton.svelte';
import SocialMenu from './apps/SocialMenu.js';
import { SocialHubDatabase } from './database/SocialHubDatabase.js';
import { GroupDatabase } from "./database/GroupDatabase.js";
import MobileHudApp from './apps/MobileHudApp.js';

// Sheets JS
import MultiversusItemSheet from './sheets/MultiversusItemSheet.js';

// Databases e Sistemas
import { PlayerDatabase } from './database/PlayerDatabase.js';
import { StoreDatabase } from './classes/StoreDatabase.js'; 
import { PassSystem } from './PassSystem.js';
import { AuxiliarSystem } from './auxiliar/AuxiliarSystem.js'; 
import "./DiscordHandler.js";
import OpeningScreen from "./OpeningScreen.svelte";

import { CardDatabase } from '../Logic/CardDatabase.js';
import { OriginDatabase } from './OriginDatabase.js';
import { PowerDatabase } from './auxiliar/PowerDatabase.js';
import { SystemBookDB } from './SystemBookDB.js';

Hooks.once('init', () => {
    CardDatabase.init();
    SystemBookDB.init();
});

 
const MODULE_ID = "multiversus-rpg";

// =========================================================
// 2. INICIALIZAÇÃO (INIT HOOK)
// =========================================================

Hooks.once('init', async function() {
    console.log(`!!! ${MODULE_ID.toUpperCase()} OS: KERNEL INICIALIZANDO !!!`);
    SocialHubDatabase.init();
    await OriginDatabase.init();
    await PowerDatabase.init();

    // Fix para TYPES.Item.power aparecer corretamente nos dropdowns
    CONFIG.Item.typeLabels = CONFIG.Item.typeLabels || {};
    CONFIG.Item.typeLabels.power = "Poder";

    // --- A. SETTINGS ---
    game.settings.register(MODULE_ID, "chatThemeBg", {
        name: "Cor de Fundo do Chat", hint: "Cor de fundo das mensagens no chat. Padrão: rgba(45, 45, 50, 0.4)",
        scope: "client", config: true, type: String, default: "rgba(45, 45, 50, 0.4)",
        onChange: val => document.documentElement.style.setProperty('--mv-chat-bg', val)
    });
    game.settings.register(MODULE_ID, "chatThemeNeon", {
        name: "Cor Neon do Chat", hint: "Cor da borda e dos detalhes das mensagens. Padrão: #00bfff",
        scope: "client", config: true, type: String, default: "#00bfff",
        onChange: val => document.documentElement.style.setProperty('--mv-chat-neon', val)
    });
    game.settings.register(MODULE_ID, "chatThemeScanlines", {
        name: "Ativar Scanlines no Chat", hint: "Adiciona o efeito de monitor antigo no fundo do chat.",
        scope: "client", config: true, type: Boolean, default: true,
        onChange: val => document.body.classList.toggle('mv-chat-scanlines-off', !val)
    });

    // Inject initial variables
    Hooks.once('ready', () => {
        document.documentElement.style.setProperty('--mv-chat-bg', game.settings.get(MODULE_ID, 'chatThemeBg'));
        document.documentElement.style.setProperty('--mv-chat-neon', game.settings.get(MODULE_ID, 'chatThemeNeon'));
        document.body.classList.toggle('mv-chat-scanlines-off', !game.settings.get(MODULE_ID, 'chatThemeScanlines'));
    });
    game.settings.register(MODULE_ID, "battlePassSeason", {
        name: "Dados da Temporada", scope: "world", config: false, type: Object,
        default: { status: 'closed', startDate: null, endDate: null, name: 'Temporada Inicial', rewardsMap: [] }
    });

    game.settings.register(MODULE_ID, "battlePassUsers", {
        name: "Progresso dos Jogadores", scope: "world", config: false, type: Object, default: {}
    });

    game.settings.register(MODULE_ID, "comms_chat_log", {
        scope: "world", config: false, type: Array, default: []
    });

    game.settings.register(MODULE_ID, "comms_groups", {
        scope: "world", config: false, type: Array, default: [{id: "global", name: "CANAL_GERAL", icon: "fa-globe"}]
    });

game.settings.register("multiversus-rpg", "openingVideoUrl", {
        name: "URL do Vídeo de Abertura",
        hint: "Cole o link do Discord ou Internet (mp4/webm). Se vazio, pula o vídeo.",
        scope: "world",
        config: true,
        type: String,
        default: ""
    });

    game.settings.register("multiversus-rpg", "worldNewsCategories", {
    name: "Categorias do Jornal",
    scope: "world",
    config: false, // Escondido do menu, pois o App gerencia
    type: Object,  // Foundry salva Arrays como Object/JSON
    default: ["GERAL", "MISSÕES", "RUMORES"]
});

    game.settings.register("multiversus-rpg", "worldNewsData", {
        name: "Database de Notícias",
        scope: "world",
        config: false, // Escondido do menu padrão
        type: Object,
        default: [] // Array vazio inicial
    });

    game.settings.register("multiversus-rpg", "socialVisibleActors", {
        name: "Atores Visíveis no Nexus Hub",
        scope: "world",
        config: false,
        type: Object,
        default: []
    });

    // No seu Hooks.once("init", ...) junto com a config do vídeo:


game.settings.register("multiversus-rpg", "skipOpeningVideo", {
    name: "Sempre Pular Vídeo",
    scope: "client", // Cada jogador escolhe o seu
    config: false,   // Não aparece no menu padrão (vamos controlar pelo nosso menu)
    type: Boolean,
    default: false
});

game.settings.register("multiversus-rpg", "openingMusicUrl", {
        name: "URL da Música de Menu",
        hint: "Link direto (mp3/ogg) que toca após o vídeo, durante o login e menu.",
        scope: "world",
        config: true,
        type: String,
        default: "" // Ex: "modules/multiversus-rpg/sounds/cyber_theme.mp3"
    });

game.settings.register("multiversus-rpg", "skipLoginAnim", {
    name: "Sempre Pular Animação/Login",
    scope: "client",
    config: false,
    type: Boolean,
    default: false
});

game.settings.register("multiversus-rpg", "menuTheme", {
    name: "Tema do Menu",
    scope: "client",
    config: false,
    type: String,
    default: "default"
});


    game.settings.register(MODULE_ID, "comms_status", {
        scope: "world", config: false, type: Object, default: {}
    });

    game.settings.register("multiversus-rpg", "calendarData", {
    scope: "world",
    config: false,
    type: Object,
    default: {
        currentDate: { day: 1, month: 0, year: 1 },
        weather: "clear",
        customEvents: []
    }
    });

    game.settings.register("multiversus-rpg", "archetypeData", {
        name: "Banco de Dados de Arquétipos",
        scope: "world",
        config: false,
        type: Array,
        default: []
    });

    game.settings.register("multiversus-rpg", "creatorBgUrl", {
        name: "Fundo do Criador de Personagem (URL)",
        scope: "world",
        config: true,
        type: String,
        default: ""
    });

    game.settings.register("multiversus-rpg", "creatorAvatarUrl", {
        name: "Avatar Padrão do Criador (URL)",
        scope: "world",
        config: true,
        type: String,
        default: "icons/svg/mystery-man.svg"
    });

    game.settings.register("multiversus-rpg", "nexusNotificationLevel", {
        name: "Nível de Notificação do Nexus Hub",
        hint: "Define como você recebe avisos de novas mensagens.",
        scope: "client",
        config: false,
        type: String,
        default: "completa"
    });

    // --- B. BANCOS DE DADOS ---
    StoreDatabase.init();
    GroupDatabase.init();

    PassSystem.init();    
    AuxiliarSystem.init(); 

    // --- C. REGISTRO DE FICHAS ---
    Items.unregisterSheet("wildtalents", ItemSheet);
    Items.registerSheet("wildtalents", MultiversusItemSheet, {
        types: ["power"], makeDefault: true, label: "Multiversus Power Sheet"
    });

    CONFIG.Actor.sheetClasses.character = {}; 
    Actors.registerSheet("core", FichaSvelte, {
        types: ["character"], makeDefault: true, label: "Multiversus RPG"
    });

    // --- D. PROTOTIPO ---
    const ActorClass = CONFIG.Actor.documentClass;
    ActorClass.prototype.save = function(path, value, force = false) {
        StoreDatabase.scheduleUpdate(this, path, value, force);
    };

        const moduleData = game.modules.get("multiversus-rpg");
    moduleData.api = {
        ...moduleData.api,
        MobileHudApp: MobileHudApp
    };

    console.log("MULTIVERSUS RPG | Init Concluído.");
});

// --- NEXUS HUB CHAT MESSAGE HOOKS ---
Hooks.once("ready", () => {
    const originalNotify = ChatLog.prototype.notify;
    ChatLog.prototype.notify = function(message) {
        if (message.getFlag(MODULE_ID, "isNexusHub")) {
            const muteState = game.settings.get(MODULE_ID, "nexusNotificationLevel") || "completa";
            
            if (muteState === "nenhuma") return; // Completely silent, no visual, no sound

            if (muteState === "visual") {
                // Visual only: We bypass the native sound but still notify the UI.
                // We can just show a silent toast and skip original notify to avoid the ping sound.
                ui.notifications.info("Nexus Hub: Nova mensagem recebida!");
                return;
            }
            
            // "completa" -> let Foundry do its native ping/sound
        }
        return originalNotify.apply(this, arguments);
    };
});

Hooks.on("renderChatMessage", (message, html) => {
    if (message.getFlag(MODULE_ID, "isNexusHub")) {
        if (html && typeof html.hide === 'function') html.hide();
        else if (html && html[0] && typeof html[0].style === 'object') html[0].style.display = 'none';
    }
});

Hooks.on("createChatMessage", (message) => {
    if (message.getFlag(MODULE_ID, "isNexusHub")) {
        import('./database/SocialHubStore.js').then(({ updateHubStore }) => {
            updateHubStore();
            Hooks.callAll("socialHubUpdate");
        }).catch(() => {});
    }
});

Hooks.on("deleteChatMessage", (message) => {
    if (message.getFlag(MODULE_ID, "isNexusHub")) {
        import('./database/SocialHubStore.js').then(({ updateHubStore }) => {
            updateHubStore();
            Hooks.callAll("socialHubUpdate");
        }).catch(() => {});
    }
});

import CombatHUD from './apps/combat/CombatHUD.svelte';

Hooks.on("renderCombatTracker", (app, html, data) => {
    // V12 passa um array de HTMLElement ou HTMLElement direto.
    const tracker = html[0] || html;
    if (!tracker || typeof tracker.querySelectorAll !== 'function') return;

    if (game.user.isGM && game.combat) {
        // Auto-roll para combatentes sem iniciativa (para não precisar clicar no dado)
        const unrolled = game.combat.combatants.filter(c => c.initiative === null).map(c => c.id);
        if (unrolled.length > 0) {
            game.combat.rollInitiative(unrolled, { messageOptions: { rollMode: "gmroll" } });
        }
    }

    tracker.querySelectorAll(".combatant").forEach(el => {
        const id = el.dataset.combatantId;
        const combatant = game.combat.combatants.get(id);
        if (combatant && combatant.actor) {
            const getStat = (stat) => {
                const base = Number(foundry.utils.getProperty(combatant.actor, `flags.multiversus-rpg.stats.${stat}.normal`))
                    || Number(foundry.utils.getProperty(combatant.actor, `system.stats.${stat}.value`))
                    || Number(foundry.utils.getProperty(combatant.actor, `system.stats.${stat}.normal`))
                    || Number(foundry.utils.getProperty(combatant.actor, `system.attributes.${stat}.val`))
                    || Number(foundry.utils.getProperty(combatant.actor, `system.attributes.${stat}.value`))
                    || 0;
                
                const hn = Number(foundry.utils.getProperty(combatant.actor, `flags.multiversus-rpg.stats.${stat}.h_normal`)) || 0;
                const hh = Number(foundry.utils.getProperty(combatant.actor, `flags.multiversus-rpg.stats.${stat}.h_hard`)) || 0;
                const hw = Number(foundry.utils.getProperty(combatant.actor, `flags.multiversus-rpg.stats.${stat}.h_wiggle`)) || 0;
                
                return base + hn + hh + hw;
            };
            const sense = getStat("sense");
            const mind = getStat("mind");
            
            const initEl = el.querySelector(".token-initiative");
            if (initEl && combatant.initiative !== null) {
                // Remove the original dice roll button if present
                initEl.innerHTML = `<span class="initiative" style="font-size: 11px; font-weight: bold;" title="Sense: ${sense} | Mind: ${mind}">${sense} / ${mind}</span>`;
            }
        }
    });
});

Hooks.on("preCreateCombatant", (combatant, data, options, userId) => {
    if (!combatant.actor) return;
    const actor = combatant.actor;
    const getStat = (stat) => {
        const base = Number(foundry.utils.getProperty(actor, `flags.multiversus-rpg.stats.${stat}.normal`))
            || Number(foundry.utils.getProperty(actor, `system.stats.${stat}.value`))
            || Number(foundry.utils.getProperty(actor, `system.stats.${stat}.normal`))
            || Number(foundry.utils.getProperty(actor, `system.attributes.${stat}.val`))
            || Number(foundry.utils.getProperty(actor, `system.attributes.${stat}.value`))
            || 0;
        
        const hn = Number(foundry.utils.getProperty(actor, `flags.multiversus-rpg.stats.${stat}.h_normal`)) || 0;
        const hh = Number(foundry.utils.getProperty(actor, `flags.multiversus-rpg.stats.${stat}.h_hard`)) || 0;
        const hw = Number(foundry.utils.getProperty(actor, `flags.multiversus-rpg.stats.${stat}.h_wiggle`)) || 0;
        
        return base + hn + hh + hw;
    };
    const sense = getStat("sense");
    const mind = getStat("mind");
    const score = - (sense + (mind / 100));
    combatant.updateSource({ initiative: score });
});

// =========================================================
// 3. READY HOOK
// =========================================================
Hooks.on("ready", () => {
    // Monta o CombatHUD globalmente se não existir
    if (!document.getElementById("nexus-combat-hud-container")) {
        const hudContainer = document.createElement("div");
        hudContainer.id = "nexus-combat-hud-container";
        document.body.appendChild(hudContainer);
        
        new CombatHUD({
            target: hudContainer,
            props: {
                themeColor: game.settings.get(MODULE_ID, "chatThemeBg") || "rgba(0, 0, 0, 0.7)",
                neonColor: game.settings.get(MODULE_ID, "chatThemeNeon") || "#00ff41"
            }
        });
    }

    // Aplica o tema do Diário global
    const themeBg = game.settings.get(MODULE_ID, "chatThemeBg");
});

Hooks.once('ready', async function() {
    console.log(`!!! ${MODULE_ID.toUpperCase()} OS: SISTEMAS PRONTOS !!!`);

        console.log("MULTIVERSUS | Iniciando Nexus Social Hub...");

    // 1. Garante a instância global
    if (!window.NexusHub) {
        window.NexusHub = new SocialMenu();
    }

    game.socket.on(`module.multiversus-rpg`, (payload) => {
        if (payload.type === "SOCIAL_HUB_NEW_MESSAGE" && payload.msg) {
            import('./database/SocialHubStore.js').then(({ hubChatStore }) => {
                hubChatStore.update(messages => {
                    if (messages.find(m => m.id === payload.msg.id)) return messages;
                    const arr = [...messages, payload.msg];
                    if (arr.length > 200) arr.shift();
                    return arr;
                });
                Hooks.callAll("socialHubUpdate");
            }).catch(() => Hooks.callAll("socialHubUpdate"));
        } else if (payload.type === "SOCIAL_HUB_NEW_GROUP" && payload.group) {
            import('./database/SocialHubStore.js').then(({ hubGroupsStore }) => {
                hubGroupsStore.update(groups => {
                    if (groups.find(g => g.id === payload.group.id)) return groups;
                    return [...groups, payload.group];
                });
                Hooks.callAll("socialHubUpdate");
            }).catch(() => Hooks.callAll("socialHubUpdate"));
        } else if (payload.type === "SOCIAL_HUB_DELETE_GROUP" && payload.groupId) {
            import('./database/SocialHubStore.js').then(({ hubGroupsStore }) => {
                hubGroupsStore.update(groups => groups.filter(g => g.id !== payload.groupId));
                Hooks.callAll("socialHubUpdate");
            }).catch(() => Hooks.callAll("socialHubUpdate"));
        } else if (payload.type === "SOCIAL_HUB_CLEAR_CHAT") {
            import('./database/SocialHubStore.js').then(({ hubChatStore }) => {
                hubChatStore.set([]);
                Hooks.callAll("socialHubUpdate");
            }).catch(() => Hooks.callAll("socialHubUpdate"));
        } else if (payload.type === "SOCIAL_HUB_REFRESH") {
            import('./database/SocialHubStore.js').then(({ updateHubStore }) => {
                updateHubStore();
                Hooks.callAll("socialHubUpdate");
            }).catch(() => Hooks.callAll("socialHubUpdate"));
        }
    });



    // 2. Cria o container do botão se não existir
    let socialRoot = document.getElementById('multiversus-social-button-root');
    if (!socialRoot) {
        socialRoot = document.createElement('div');
        socialRoot.id = 'multiversus-social-button-root';
        // Crítico: O root não pode ter tamanho, apenas os filhos (botões)
        Object.assign(socialRoot.style, {
            position: 'fixed',
            inset: '0',
            pointerEvents: 'none',
            zIndex: '10000'
        });
        document.body.appendChild(socialRoot);
    }

    // 3. Renderiza o botão
    try {
        new SocialButton({
            target: socialRoot
        });
        console.log("MULTIVERSUS | Botão Nexus Social: ONLINE");
    } catch (err) {
        console.error("MULTIVERSUS | Erro ao carregar botão social:", err);
    }
    // --- GM INTERFACE ---
    if (game.user.isGM) {
        let adminRoot = document.getElementById('multiversus-admin-root');
        if (!adminRoot) {
            adminRoot = document.createElement('div');
            adminRoot.id = 'multiversus-admin-root';
            Object.assign(adminRoot.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '10000' });
            document.body.appendChild(adminRoot);
        }
        if (!window.multiversusAdminHUD) {
            window.multiversusAdminHUD = new AdminButton({ target: adminRoot });
        }
    }

    // --- AUXILIAR INTERFACE (PARA TODOS - CONTROLE DE ACESSO NO COMPONENTE) ---
    let auxRoot = document.getElementById('multiversus-aux-root');
    if (!auxRoot) {
        auxRoot = document.createElement('div');
        auxRoot.id = 'multiversus-aux-root';
        Object.assign(auxRoot.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '9000' });
        document.body.appendChild(auxRoot);
    }
    new AuxiliarButton({ target: auxRoot });

    // --- MACRO HUD (GLOBAL) ---
    let macroRoot = document.getElementById('multiversus-macro-root');
    if (!macroRoot) {
        macroRoot = document.createElement('div');
        macroRoot.id = 'multiversus-macro-root';
        Object.assign(macroRoot.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '10000' });
        document.body.appendChild(macroRoot);
    }
    if (!window.multiversusMacroHUD) {
        window.multiversusMacroHUD = new MacroScanner({ target: macroRoot, props: { actor: null } });
    }

    // --- SOCKETS ---
    game.socket.on(`module.${MODULE_ID}`, async (payload) => {
        
        // >>> LÓGICA GM <<<
        if (game.user.isGM) {
            if (payload.type === "COMBAT_ADD_PASSIVE" && (!game.users.activeGM || game.users.activeGM.id === game.user.id)) {
                const activeCombat = game.combat;
                if (activeCombat) {
                    let pFlag = activeCombat.getFlag('multiversus-rpg', 'combatPassives');
                    let arr = Array.isArray(pFlag) ? [...pFlag] : [];
                    arr.push(payload.passive);
                    await activeCombat.setFlag('multiversus-rpg', 'combatPassives', arr);
                }
            }

            if (payload.type === "SOCIAL_HUB_SEND_MESSAGE" && (!game.users.activeGM || game.users.activeGM.id === game.user.id)) {
                await SocialHubDatabase.sendMessage(payload.data);
            }
            if (payload.type === "SOCIAL_HUB_CREATE_GROUP" && (!game.users.activeGM || game.users.activeGM.id === game.user.id)) {
                await SocialHubDatabase.createGroup(payload.name, payload.password);
            }
            if (payload.type === "SOCIAL_HUB_DELETE_GROUP" && (!game.users.activeGM || game.users.activeGM.id === game.user.id)) {
                await SocialHubDatabase.deleteGroup(payload.groupId);
            }
            if (payload.type === "SOCIAL_HUB_CLEAR_CHAT" && (!game.users.activeGM || game.users.activeGM.id === game.user.id)) {
                await SocialHubDatabase.clearChat();
            }
            
            // 1. CRIAR FICHA COM PERMISSÕES (NOVO)
            if (payload.type === "AUX_ACTION_CREATE_SHEET") {
                const { name, ownerId } = payload;
                
                // Configuração de Permissões (Ownership)
                let ownership = {
                    default: 0, // Ninguém vê por padrão
                };

                // Define o jogador escolhido como Dono
                if (ownerId) ownership[ownerId] = 3;

                // Define TODOS os Auxiliares como Donos
                const authorizedAuxiliaries = AuxiliarSystem.getAuthorizedUsers();
                authorizedAuxiliaries.forEach(auxId => {
                    ownership[auxId] = 3; 
                });

                // Cria o Ator
                const newActor = await Actor.create({
                    name: name,
                    type: "character",
                    ownership: ownership,
                    img: "icons/svg/mystery-man.svg"
                });

                ui.notifications.info(`[AUX] Ficha '${newActor.name}' criada.`);
            }

            // 2. Dar Moedas
            if (payload.type === "AUX_ACTION_COINS") {
                const amount = payload.amount;
                for (const user of game.users.filter(u => !u.isGM)) {
                    await StoreDatabase.adminModifyCoins(user.id, amount, 'add');
                }
                ui.notifications.info(`[AUX] +${amount} MC para todos.`);
            }

            // 3. Curar
            if (payload.type === "AUX_ACTION_HEAL") {
                const targetIds = payload.ids || [];
                for (const id of targetIds) {
                    const token = canvas.tokens.get(id);
                    if (token && token.actor) {
                        ui.notifications.info(`[AUX] Cura solicitada em: ${token.name}`);
                        // Lógica de cura real aqui, se quiser
                    }
                }
            }

            // 4. Player DB Save/Delete
            if (payload.type === "PLAYER_DB_SAVE") {
                const { PlayerDatabase } = await import('./database/PlayerDatabase.js');
                await PlayerDatabase.saveEntry(payload.entry);
                game.socket.emit(`module.${MODULE_ID}`, { type: "PLAYER_DB_UPDATE_NOTIFY" });
            }
            if (payload.type === "PLAYER_DB_DELETE") {
                const { PlayerDatabase } = await import('./database/PlayerDatabase.js');
                await PlayerDatabase.deleteEntry(payload.id);
                game.socket.emit(`module.${MODULE_ID}`, { type: "PLAYER_DB_UPDATE_NOTIFY" });
            }
            if (payload.type === "PLAYER_DB_SAVE_GROUP") {
                const { PlayerDatabase } = await import('./database/PlayerDatabase.js');
                await PlayerDatabase.saveGroup(payload.group);
                game.socket.emit(`module.${MODULE_ID}`, { type: "PLAYER_DB_UPDATE_NOTIFY" });
            }
            if (payload.type === "PLAYER_DB_DELETE_GROUP") {
                const { PlayerDatabase } = await import('./database/PlayerDatabase.js');
                await PlayerDatabase.deleteGroup(payload.id);
                game.socket.emit(`module.${MODULE_ID}`, { type: "PLAYER_DB_UPDATE_NOTIFY" });
            }

        }

        // >>> LÓGICA CLIENTE <<<
        if (payload.type === "AUXILIAR_REFRESH") Hooks.callAll("auxiliarUpdate");
        if (payload.type === "COMMS_REFRESH") Hooks.callAll("commsUpdate");
        if (payload.type === "PLAYER_DB_UPDATE_NOTIFY") {
            Hooks.callAll("nexusUpdate");
            Hooks.callAll("nexusGroupsUpdate");
        }
        if (payload.type === "passUpdate") Hooks.callAll("passSystemUpdate");
    });
});

// =========================================================
// 4. CLASSE DA FICHA (CORRIGIDA)
// =========================================================
class FichaSvelte extends ActorSheet {
    constructor(...args) { super(...args); this.component = null; }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            // ADICIONE ESTE ID FIXO PARA GARANTIR
            id: "multiversus-actor-sheet",
            
            classes: ["multiversus-os", "sheet", "actor"],
            width: 1400, height: 900, resizable: true,
            template: `modules/${MODULE_ID}/templates/sheet.html`
        });
    }

    // SOBRESCREVA O GET ID PARA FORÇAR UM ID SEGURO
    get id() {
        return `multiversus-actor-${this.actor.id}`; 
    }

    _getSubmitData(updateData) { return null; } 
    async _updateObject(event, formData) { return; } 

    async _render(force, options) {
        if (!force && this.component) {
            if (window.multiversusMacroHUD) window.multiversusMacroHUD.$set({ actor: this.actor });
            this.component.$set({ actor: this.actor, system: this.actor.system });
            if (this.element && this.element.length) this.element.find(".window-title").text(this.title);
            return;
        }

        // --- MACRO HUD ---
        if (window.multiversusMacroHUD) {
            window.multiversusMacroHUD.$set({ actor: this.actor });
        }

        // --- CORREÇÃO DO ERRO JQUERY ---
        // Se por algum motivo o ID ainda for inválido, forçamos um válido antes do render
        if (!this.options.id || this.options.id.includes("$")) {
             this.options.id = `multiversus-actor-${this.actor.id}`;
        }

        await super._render(force, options);
        
        // Se o elemento não existir, aborta
        if (!this.element || !this.element.length) return;

        const windowContent = this.element.find(".window-content")[0];
        if (!windowContent) return;

        windowContent.innerHTML = "";
        Object.assign(windowContent.style, { padding: "0", margin: "0", height: "100%", overflow: "hidden", background: "#000", display: "flex", flexDirection: "column" });

        if (this.component) {
            this.component.$set({ actor: this.actor, system: this.actor.system });
        } else {
            try {
                this.component = new FichaComponente({ target: windowContent, props: { actor: this.actor, system: this.actor.system } });
            } catch (err) { console.error("MULTIVERSUS | Erro ao montar ficha:", err); }
        }
    }

    async maximize() {
        let result = await super.maximize();
        if (this.element && this.element.length) {
            const windowContent = this.element.find(".window-content")[0];
            if (windowContent) windowContent.style.display = "flex";
        }
        return result;
    }

    async close(options) {
        if (this.component) { this.component.$destroy(); this.component = null; }
        return super.close(options);
    }
}






// 1. Definimos a Classe de Combate Customizada
class NexusCombat extends Combat {
    
    /** @override */
    async rollInitiative(ids, {formula=null, updateTurn=true, messageOptions={}}={}) {
        const updates = [];
        const messages = [];

        // Itera sobre quem foi selecionado para rolar
        for ( let [i, id] of ids.entries() ) {
            const combatant = this.combatants.get(id);
            const actor = combatant.actor;

            if ( !actor ) continue;

            const getStat = (stat) => {
                const base = Number(foundry.utils.getProperty(actor, `flags.multiversus-rpg.stats.${stat}.normal`))
                    || Number(foundry.utils.getProperty(actor, `system.stats.${stat}.value`))
                    || Number(foundry.utils.getProperty(actor, `system.stats.${stat}.normal`))
                    || Number(foundry.utils.getProperty(actor, `system.attributes.${stat}.val`))
                    || Number(foundry.utils.getProperty(actor, `system.attributes.${stat}.value`))
                    || 0;
                
                const hn = Number(foundry.utils.getProperty(actor, `flags.multiversus-rpg.stats.${stat}.h_normal`)) || 0;
                const hh = Number(foundry.utils.getProperty(actor, `flags.multiversus-rpg.stats.${stat}.h_hard`)) || 0;
                const hw = Number(foundry.utils.getProperty(actor, `flags.multiversus-rpg.stats.${stat}.h_wiggle`)) || 0;
                
                return base + hn + hh + hw;
            };
            const sense = getStat("sense");
            const mind = getStat("mind");

            // O Tracker vai ordenar pelo valor de initiative (decimais para Mind).
            // Para o foundry (decrescente = maior valor age primeiro), como queremos que MENOR aja primeiro,
            // usaremos um valor negativo para forçar a ordenação certa no Tracker se ele estiver em modo decrescente.
            const score = - (sense + (mind / 100));

            updates.push({_id: id, initiative: score});
        }

        // Atualiza o Combat Tracker
        if ( !updates.length ) return this;
        await this.updateEmbeddedDocuments("Combatant", updates);

        // Atualiza o Turno atual
        if ( updateTurn && this.combatant ) {
            await this.update({turn: this.turns.findIndex(t => t.id === this.combatant.id)});
        }

        return this;
    }
}

// 2. Registra no Foundry ao iniciar
Hooks.on("init", () => {
    // Substitui a lógica padrão de combate pela nossa
    CONFIG.Combat.documentClass = NexusCombat;
    
    // Configura a visualização no tracker para mostrar 2 casas decimais (para ver o desempate de Mente)
    CONFIG.Combat.initiative = {
        decimals: 2 
    };

    
});

// ... (Seus imports e configurações iniciais) ...

// =========================================================
// CLASSE OPENING (MÉTODO INVASÃO DE DOM)
// =========================================================
class NexusOpeningClass extends Application {
    constructor(options = {}) {
        super(options);
        this.svelteContainer = null; // Container próprio, fora da janela do Foundry
        this.component = null;
        this.completed = false;
    }

    // Mantemos o defaultOptions apenas para o Foundry não reclamar, 
    // mas não vamos usar a janela que ele cria.
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "nexus-opening-controller",
            popOut: true,
            template: "modules/multiversus-rpg/templates/empty.html", // Template vazio
            minimizable: false,
            resizable: false,
            width: 100, height: 100 // Irrelevante
        });
    }

    // Sobrescrevemos o render para NÃO desenhar a janela padrão
    async _render(force, options) {
        // Se já existe, não faz nada
        if (this.component) return;

        // 1. CRIAMOS NOSSO PRÓPRIO CONTAINER (FORA DA JANELA DO FOUNDRY)
        this.svelteContainer = document.createElement('div');
        this.svelteContainer.id = "nexus-opening-overlay";
        
        // 2. APLICAMOS O CSS NUCLEAR DIRETO NELE
        Object.assign(this.svelteContainer.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            zIndex: '9999999', // Acima de tudo, até do Loading nativo
            backgroundColor: 'black',
            margin: '0',
            padding: '0',
            overflow: 'hidden',
            border: 'none'
        });

        // 3. INJETAMOS NO CORPO DA PÁGINA
        document.body.appendChild(this.svelteContainer);

        // 4. INICIAMOS O SVELTE DENTRO DESSE CONTAINER LIMPO
        this.component = new OpeningScreen({
            target: this.svelteContainer,
            props: {
                app: this, // Passamos 'this' para o Svelte poder chamar close()
                onFinish: () => {
                    if (!this.completed) {
                        this.completed = true;
                        this.close();
                    }
                }
            }
        });
    }

    // Sobrescrevemos o close para limpar nossa bagunça
    async close(options={}) {
        // 1. Destrói o Svelte
        if (this.component) {
            this.component.$destroy();
            this.component = null;
        }

        // 2. Remove nosso container do HTML
        if (this.svelteContainer) {
            this.svelteContainer.remove();
            this.svelteContainer = null;
        }

        // 3. Chama o Loading se tiver completado
        if (this.completed) {
            // Pequeno delay para garantir transição suave
            setTimeout(() => {
                // new NexusLoading(true).render(true);
            }, 50);
        }

        // Avisa o Foundry que "fechamos" (mesmo que não tenhamos usado a janela dele)
        return Promise.resolve(); 
    }
}

// =========================================================
// 3. READY HOOK (CORRIGIDO)
// =========================================================
Hooks.once('ready', async function() {
    console.log(`!!! ${MODULE_ID.toUpperCase()} OS: SISTEMAS PRONTOS !!!`);

    // ... (Seu código do Social Hub e Botões fica aqui) ...

    // --- CORREÇÃO DO GATILHO DE ENTRADA ---
    // Apenas chame o Opening. Ele chamará o Loading depois.
    new NexusOpeningClass().render(true);
});

Hooks.once('ready', () => {
    // OnlineComms.init();
});

// ... (Seu código de updateScene) ...

// Exemplo de import (ajuste o caminho e o nome da classe conforme seu projeto)
// import { MobileHudApp } from "./apps/MobileHudApp.js"; 

Hooks.on("chatMessage", (chatLog, messageText, chatData) => {
  if (messageText.trim().toLowerCase() === "/mv") {
    
    // 1. Procuramos se a sua janela principal (onde fica o openApp) está aberta
    // Substitua "nexus-mobile-hud" pelo ID da sua aplicação principal
    const hudWindow = Object.values(ui.windows).find(w => w.id === "nexus-mobile-hud-app");

    if (hudWindow) {
      // Se estiver aberta, apenas trocamos para a aba de dados
      Hooks.callAll("nexusToggleApp", "dados");
    } else {
      // Se estiver fechada, você pode optar por abrir a aplicação 
      // ou enviar uma notificação. Exemplo abrindo:
      // const api = game.modules.get("multiversus-rpg")?.api;
      // if (api?.MobileHudApp) {
      //    new api.MobileHudApp().render(true, { focus: true });
      //    // Pequeno delay para dar tempo do Svelte montar e ouvir o hook
      //    setTimeout(() => Hooks.callAll("nexusToggleApp", "dados"), 100);
      // }
      ui.notifications.info("Abra o HUD Tático para usar o motor de dados.");
    }

    return false; // Impede a mensagem de aparecer no chat
  }
});

// =======================================================
// RETORNO AO MENU NEXUS (ESC & CHAT)
// =======================================================

// 1. Injeta o botão na aba de Configurações (Abre com ESC)
Hooks.on("renderSettings", (app, html) => {
    // Cria o botão com a nossa classe customizada
    const nexusBtn = $(`
        <button class="nexus-return-btn">
            <i class="fas fa-satellite-dish"></i> RETORNAR AO MENU NEXUS
        </button>
    `);

    // Ação de clique do botão
    nexusBtn.on("click", () => {
        // Substitua 'OpeningApp' pelo nome correto da classe que abre o seu menu principal
        const api = game.modules.get("multiversus-rpg")?.api;
        if (api && api.OpeningApp) {
            new api.OpeningApp().render(true);
        } else {
            ui.notifications.warn("NEXUS OFFLINE: Módulo de interface não encontrado.");
        }
    });

    // Injeta o botão logo no topo dos botões de jogo
    $(html).find("#settings-game").prepend(nexusBtn);
});

// 2. Comando de Chat opcional para abrir rapidamente
Hooks.on("chatMessage", (chatLog, messageText, chatData) => {
    if (messageText.trim().toLowerCase() === "/nexus" || messageText.trim().toLowerCase() === "/menu") {
        const api = game.modules.get("multiversus-rpg")?.api;
        if (api && api.OpeningApp) {
            new api.OpeningApp().render(true);
        }
        return false; // Impede que o comando apareça no chat
    }
});