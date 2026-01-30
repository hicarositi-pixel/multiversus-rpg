import OpeningScreen from "./OpeningScreen.svelte"; 

export default class NexusOpening extends Application {
    constructor(options = {}) {
        super(options);
        this.component = null;
        this.isClosing = false; // Trava de segurança para evitar erro de fechar 2x
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "nexus-opening",
            title: "Nexus OS",
            template: "modules/multiversus-rpg/templates/empty.html",
            classes: ["nexus-opening-window"],
            width: window.innerWidth,
            height: window.innerHeight,
            resizable: false,
            minimizable: false,
            popOut: true
        });
    }

    async _render(force, options) {
        // Se já estiver fechando ou já tiver componente, não renderiza de novo
        if (this.isClosing || this.component) return;

        await super._render(force, options);
        
        // --- CORREÇÃO DA TELA PELA METADE ---
        // Usamos setAttribute direto no DOM nativo.
        // O jQuery (.css) remove o !important, por isso sua versão anterior falhava.
        
        this.element[0].setAttribute("style", `
            display: block !important;
            position: fixed !important;  /* O segredo para ignorar o layout do Foundry */
            width: 100vw !important;
            height: 100vh !important;
            top: 0px !important;
            left: 0px !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            z-index: 999999 !important;
            background: black !important;
        `);

        // Esconde o header visualmente
        this.element.find(".window-header").css({ display: "none" });

        // Garante que o MIOLO da janela também ocupe 100%
        const target = this.element.find(".window-content")[0];
        target.setAttribute("style", `
            height: 100% !important; 
            width: 100% !important; 
            background: black !important; 
            padding: 0 !important; 
            margin: 0 !important; 
            overflow: hidden !important;
        `);

        // Instancia o Svelte
        this.component = new OpeningScreen({
            target: target,
            props: {
                app: this,
                // Callback para quando a animação terminar e for entrar no jogo
                onFinish: () => {
                    this.close();
                }
            }
        });
    }

    // Fecha com segurança destruindo o Svelte primeiro
    async close(options={}) {
        if (this.isClosing) return; 
        this.isClosing = true;

        if (this.component) {
            this.component.$destroy();
            this.component = null;
        }
        
        // Se você tiver a classe de Loading importada e quiser chamar ela aqui:
        // new NexusLoading(true).render(true);

        return super.close(options);
    } 
}