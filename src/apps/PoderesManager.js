import PoderesAppShell from './PoderesApp.svelte';
const { ApplicationV2 } = foundry.applications.api;

export default class PoderesManager extends ApplicationV2 {
  constructor(actor) {
    // Definimos um título dinâmico se tiver ator
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
      contentClasses: ["multiversus-app"] // Garante rolagem correta
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
    wrapper.style.display = "flex";       // Garante flexbox
    wrapper.style.flexDirection = "column";

    // Limpeza de segurança
    if (this.component) {
        this.component.$destroy();
    }

    // Inicializa Svelte com o Ator
    this.component = new PoderesAppShell({
      target: wrapper,
      props: {
        application: this,
        actor: this.actor, // <--- CRUCIAL: Passa o ator para o App funcionar
        themeColor: "#00ff41", // Cor padrão se faltar
        flags: this.actor?.flags?.["multiversus-rpg"] || {}
      }
    });

    return wrapper;
  }
  
  _replaceHTML(result, content, options) {
    content.replaceWith(result);
  }

  // Limpeza de memória ao fechar
  _onClose(options) {
    if (this.component) {
      this.component.$destroy();
      this.component = null;
    }
  }
}