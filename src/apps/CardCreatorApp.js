import CardCreator from './CardCreator.svelte';

const { ApplicationV2 } = foundry.applications.api;

export default class CardCreatorApp extends ApplicationV2 {
    constructor(options = {}) {
        super(options);
        this.actor = options.actor || null; 
        this.cardToEdit = options.cardToEdit || null; // NOVO: Guarda a carta que vai ser editada
        this.component = null;
    }

    static DEFAULT_OPTIONS = {
        id: "nexus-card-forge-app",
        tag: "div",
        window: { frame: false, positioned: false }
    }

    async _renderHTML(context, options) {
        const wrapper = document.createElement("div");
        wrapper.style.cssText = "position: fixed; pointer-events: none; z-index: 25000;";

        if (this.component) this.component.$destroy();

        this.component = new CardCreator({
            target: wrapper,
            props: { 
                actor: this.actor,
                cardToEdit: this.cardToEdit, // NOVO: Passa a carta pro Svelte
                closeApp: () => this.close()
            }
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