import AdminHub from './AdminHub.svelte';

export class AdminHubApp extends Application {
    constructor(options = {}) {
        super(options);
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "multiversus-admin-hub",
            title: "SYSTEM ADMIN",
            template: "modules/multiversus-rpg/templates/empty.html", // Crie um html vazio só pra constar ou use Svelte direto
            width: 900,
            height: 600,
            resizable: true,
            minimizable: true
        });
    }

    render(force, options) {
        // Renderiza o Svelte dentro da janela
        new AdminHub({
            target: document.body, // Ou monta dentro do this.element se configurar corretamente
            props: {
                // props
            }
        });
        // Nota: O método padrão do Foundry de renderizar Svelte é um pouco mais complexo se quiser dentro da janela dele.
        // Se você já tem um método que usa no StoreApp, use o mesmo para o AdminHub.
    }
}