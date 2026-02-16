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

// Sheets JS
import MultiversusItemSheet from './sheets/MultiversusItemSheet.js';

// Databases e Sistemas
import { StoreDatabase } from './classes/StoreDatabase.js'; 
import { PassSystem } from './PassSystem.js';
import { AuxiliarSystem } from './auxiliar/AuxiliarSystem.js'; 
import "./DiscordHandler.js";
import OpeningScreen from "./OpeningScreen.svelte";


const MODULE_ID = "multiversus-rpg";

// =========================================================
// 2. INICIALIZAÇÃO (INIT HOOK)
// =========================================================
Hooks.once('init', async function() {
    console.log(`!!! ${MODULE_ID.toUpperCase()} OS: KERNEL INICIALIZANDO !!!`);
    SocialHubDatabase.init();
    // --- A. SETTINGS ---
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

    game.settings.register("multiversus-rpg", "worldNewsData", {
        name: "Database de Notícias",
        scope: "world",
        config: false, // Escondido do menu padrão
        type: Object,
        default: [] // Array vazio inicial
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
        events: {}, // { "1-0-1": [{type: 'note', text: 'Inicio'}, {type: 'group', id: 'xyz'}] }
        notes: {}
    }
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

    console.log("MULTIVERSUS RPG | Init Concluído.");
});

// =========================================================
// 3. READY HOOK
// =========================================================
Hooks.once('ready', async function() {
    console.log(`!!! ${MODULE_ID.toUpperCase()} OS: SISTEMAS PRONTOS !!!`);

        console.log("MULTIVERSUS | Iniciando Nexus Social Hub...");

    // 1. Garante a instância global
    if (!window.NexusHub) {
        window.NexusHub = new SocialMenu();
    }

    game.socket.on(`module.multiversus-rpg`, (payload) => {
        if (payload.type === "SOCIAL_HUB_REFRESH") {
            Hooks.callAll("socialHubUpdate");
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


    // --- SOCKETS ---
    game.socket.on(`module.${MODULE_ID}`, async (payload) => {
        
        // >>> LÓGICA GM <<<
        if (game.user.isGM) {
            
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

            // 4. Comms
            if (payload.type === "COMMS_SEND_MSG") {
                const { CommsDatabase } = await import('./database/CommsDatabase.js');
                await CommsDatabase.sendMessage(payload.msg);
                game.socket.emit(`module.${MODULE_ID}`, { type: "COMMS_REFRESH" });
                Hooks.callAll("commsUpdate");
            }
            if (payload.type === "COMMS_DELETE_MSG") {
                const { CommsDatabase } = await import('./database/CommsDatabase.js');
                await CommsDatabase.deleteMessage(payload.msgId);
                game.socket.emit(`module.${MODULE_ID}`, { type: "COMMS_REFRESH" });
                Hooks.callAll("commsUpdate");
            }
            if (payload.type === "COMMS_CREATE_GROUP") {
                const { CommsDatabase } = await import('./database/CommsDatabase.js');
                await CommsDatabase.createGroup(payload.group.name); 
                game.socket.emit(`module.${MODULE_ID}`, { type: "COMMS_REFRESH" });
                Hooks.callAll("commsUpdate");
            }
            if (payload.type === "COMMS_UPDATE_STATUS") {
                const { CommsDatabase } = await import('./database/CommsDatabase.js');
                await CommsDatabase.updateStatus(payload.status.text);
                game.socket.emit(`module.${MODULE_ID}`, { type: "COMMS_REFRESH" });
                Hooks.callAll("commsUpdate");
            }
            if (payload.type === "PLAYER_DB_SAVE") {
                const { PlayerDatabase } = await import('./database/PlayerDatabase.js');
                await PlayerDatabase.saveEntry(payload.entry);
                game.socket.emit(`module.${MODULE_ID}`, { type: "PLAYER_DB_UPDATE_NOTIFY" });
            }
        }

        // >>> LÓGICA CLIENTE <<<
        if (payload.type === "AUXILIAR_REFRESH") Hooks.callAll("auxiliarUpdate");
        if (payload.type === "COMMS_REFRESH") Hooks.callAll("commsUpdate");
        if (payload.type === "PLAYER_DB_UPDATE_NOTIFY") Hooks.callAll("nexusUpdate");
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
        // --- MACRO HUD ---
        if (!window.multiversusMacroHUD) {
            const macroRoot = document.createElement('div');
            macroRoot.id = 'multiversus-macro-root';
            Object.assign(macroRoot.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '10000' });
            document.body.appendChild(macroRoot);
            window.multiversusMacroHUD = new MacroScanner({ target: macroRoot, props: { actor: this.actor } });
        } else {
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

            if ( !actor ) {
                updates.push({_id: id, initiative: 0});
                continue;
            }

            // --- LÓGICA DO SEU SISTEMA ---
            // Pega os valores (padrão 0 se não existir na ficha)
            const sense = Number(foundry.utils.getProperty(actor, "system.stats.sense.normal")) || 0;
            const mind = Number(foundry.utils.getProperty(actor, "system.stats.mind.normal")) || 0;
            const coord = Number(foundry.utils.getProperty(actor, "system.stats.coordination.normal")) || 0;

            // FÓRMULA MATEMÁTICA "QUANTO MENOS, MELHOR"
            // Base 100. Subtraímos os atributos. 
            // Quem tem atributos altos, fica com nota menor e vai para o final da fila.
            
            // Passo 1: Sentidos (Peso Maior)
            // Passo 2: Mente (Peso Decimal 0.01)
            // Passo 3: Coordenação (Peso Decimal 0.0001)
            
            const score = 100 - sense - (mind / 100) - (coord / 10000);

            updates.push({_id: id, initiative: score});

            // --- MENSAGEM NO CHAT (PARA CLAREZA) ---
            // Criamos uma mensagem bonita para o jogador entender o critério
            const chatData = {
                speaker: ChatMessage.getSpeaker({actor: actor, token: combatant.token, alias: combatant.name}),
                flavor: `<h4 style="border-bottom:2px solid #00ff41; margin-bottom:5px;">Iniciativa Rolada</h4>
                         <div style="display:flex; justify-content:space-between; font-size:12px; color:#ccc;">
                            <span>👁️ Sense: <strong>${sense}</strong></span>
                            <span>🧠 Mind: <strong>${mind}</strong></span>
                            <span>🏃 Coord: <strong>${coord}</strong></span>
                         </div>
                         <div style="text-align:center; margin-top:5px; font-size:10px; color:#666;">
                            (Menores atributos agem primeiro)
                         </div>`,
                content: `<div style="text-align:center; font-size:18px; font-weight:bold; color:#00ff41;">
                            Score: ${score.toFixed(4)}
                          </div>`
            };
            
            // Se for GM rolando para NPC, oculta o detalhe se quiser (mode: CONST.CHAT_MESSAGE_TYPES.WHISPER)
            // Aqui deixei público para todos verem a ordem
            messages.push(chatData);
        }

        // Atualiza o Combat Tracker
        if ( !updates.length ) return this;
        await this.updateEmbeddedDocuments("Combatant", updates);

        // Atualiza o Turno atual
        if ( updateTurn && this._combatant ) {
            await this.update({turn: this.turns.findIndex(t => t.id === this._combatant.id)});
        }

        // Envia as mensagens explicativas para o chat
        if (messages.length > 0) ChatMessage.createDocuments(messages);

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
                new NexusLoading(true).render(true);
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

// ... (Seu código de updateScene) ...

