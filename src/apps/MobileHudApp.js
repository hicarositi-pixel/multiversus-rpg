import MobileHUD from './MobileHUD.svelte';
import { FichaMobileLogic } from '../../Logic/FichaMobile.js';

const { ApplicationV2 } = foundry.applications.api;

export default class MobileHudApp extends ApplicationV2 {
    constructor(options = {}) {
        super(options);
        this.actor = FichaMobileLogic.resolveActiveActor();
        this.component = null;
    }

    static DEFAULT_OPTIONS = {
        id: "nexus-mobile-hud-app", // ID invisível do Foundry
        tag: "div", 
        window: {
            frame: false, // Força a remover bordas
            positioned: false // Deixa o CSS do Svelte dominar a posição livremente
        }
    }

    async _renderHTML(context, options) {
        const wrapper = document.createElement("div");
        
        // ESTA É A LINHA QUE IMPEDE ELE DE QUEBRAR O LAYOUT DO FOUNDRY:
        wrapper.style.cssText = "position: fixed; pointer-events: none; z-index: 100;"; 

        if (!this.actor) {
            ui.notifications.warn("Nexus HUD | Selecione um token ou dê alvo.");
            return wrapper;
        }

        if (this.component) this.component.$destroy();

        this.component = new MobileHUD({
            target: wrapper,
            props: { actor: this.actor }
        });

        return wrapper;
    }

    _replaceHTML(result, content, options) {
        content.innerHTML = "";
        content.append(result);
    }

    _onClose(options) {
        if (this.component) {
            this.component.$destroy();
            this.component = null;
        }
    }
}