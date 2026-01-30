import SocialMenuShell from './SocialMenu.svelte';

export default class SocialMenu extends Application {
    constructor(options = {}) {
        super(options);
        this.component = null;
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "nexus-social-hub",
            title: "NEXUS // MULTI-CHANNEL LINK",
            // Use um template .html vazio na sua pasta de templates
            template: `modules/multiversus-rpg/templates/PowerSheet.html`, 
            width: 950,
            height: 700,
            resizable: true,
            minimizable: true,
            classes: ["multiversus-rpg", "nexus-window-frame"]
        });
    }

    async _render(force, options) {
        await super._render(force, options);
        const target = this.element.find(".window-content")[0];
        
        if (target) {
            target.innerHTML = "";
            target.style.padding = "0";
            target.style.overflow = "hidden";
        }

        // Se o componente já existe, apenas atualiza, senão cria um novo
        if (this.component) {
            this.component.$set({ updateTick: Date.now() });
        } else {
            this.component = new SocialMenuShell({
                target: target,
                props: { application: this }
            });
        }
    }

    async close(options = {}) {
        if (this.component) {
            this.component.$destroy();
            this.component = null;
        }
        return super.close(options);
    }
}