import PoderesAppShell from './PoderesApp.svelte';
const { ApplicationV2 } = foundry.applications.api;

export default class PoderesManager extends ApplicationV2 {
  constructor(actor) {
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
      contentClasses: ["multiversus-app"]
    },
    position: { width: 500, height: 700 }
  }

  // --- TRAVA DE SEGURANÇA 1: BLOQUEIO DE RE-RENDER ---
  /**
   * O Foundry tenta chamar isso toda vez que o ator muda.
   * Nós interceptamos. Se o componente Svelte já está vivo,
   * retornamos imediatamente, impedindo que a janela feche ou pisque.
   */
  render(options = {}, _options = {}) {
    // Se não for um "force render" explícito e o componente já existir...
    if (!options.force && this.component) {
        return this; // NÃO FAZ NADA. O Svelte cuida do resto.
    }
    return super.render(options, _options);
  }

  async _renderHTML(context, options) {
    const wrapper = document.createElement("div");
    wrapper.style.height = "100%";
    wrapper.style.overflow = "hidden";
    wrapper.style.display = "flex";       
    wrapper.style.flexDirection = "column";

    // Garante limpeza se for um Force Render
    if (this.component) {
        this.component.$destroy();
        this.component = null;
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

  _onClose(options) {
    if (this.component) {
      this.component.$destroy();
      this.component = null;
    }
  }
}