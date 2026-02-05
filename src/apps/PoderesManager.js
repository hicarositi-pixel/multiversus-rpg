import PoderesAppShell from './PoderesApp.svelte';
const { ApplicationV2 } = foundry.applications.api;

export default class PoderesManager extends ApplicationV2 {
  constructor(actor) {
    // Título dinâmico
    const title = actor ? `Nexus Database: ${actor.name}` : "Nexus Database";
    super({ window: { title } });
    this.actor = actor;
    this.component = null;
  }

  static DEFAULT_OPTIONS = {
    tag: "div",
    window: {
      icon: "fas fa-bolt",
      resizable: true,
      width: 500,
      height: 700,
      contentClasses: ["multiversus-app"] // Classe CSS para scroll
    },
    position: {
      width: 500,
      height: 700
    }
  }

  async _renderHTML(context, options) {
    const wrapper = document.createElement("div");
    wrapper.style.height = "100%";
    wrapper.style.overflow = "hidden";
    wrapper.style.display = "flex";       
    wrapper.style.flexDirection = "column";

    // Se já existe um componente, não precisamos destruir e recriar se for apenas um render forçado pelo Foundry.
    // Mas, ApplicationV2 espera novo HTML. Então vamos recriar o Svelte limpo.
    if (this.component) {
        this.component.$destroy();
    }

    // Inicializa Svelte
    this.component = new PoderesAppShell({
      target: wrapper,
      props: {
        application: this,
        actor: this.actor,
        themeColor: "#00ff41",
        flags: this.actor?.flags?.["multiversus-rpg"] || {}
      }
    });

    return wrapper;
  }
  
  _replaceHTML(result, content, options) {
    content.replaceWith(result);
  }

  // Limpeza
  _onClose(options) {
    if (this.component) {
      this.component.$destroy();
      this.component = null;
    }
  }
}