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

  // ========================================================================
  // O ESCUDO DE VIBRANIUM: TRAVA ABSOLUTA CONTRA TELA PRETA
  // ========================================================================
  async render(options = {}, _options = {}) {
    // Se a janela já existe e o componente Svelte está vivo...
    if (this.rendered && this.component) {
        // Nós IGNORAMOS COMPLETAMENTE até mesmo o "options.force".
        // O Foundry é proibido de destruir a janela. O Svelte cuidará dos dados sozinho.
        this.bringToFront(); 
        return this; // Aborta a renderização do Foundry na hora.
    }
    
    // Deixa o Foundry agir APENAS na primeira vez que a janela abre.
    return super.render(options, _options);
  }

  // Intercepta atualizações silenciosas do cabeçalho da janela também
  _renderFrame(options) {
      if (this.rendered) return; 
      return super._renderFrame(options);
  }

  async _renderHTML(context, options) {
    const wrapper = document.createElement("div");
    wrapper.style.height = "100%";
    wrapper.style.overflow = "hidden";
    wrapper.style.display = "flex";       
    wrapper.style.flexDirection = "column";

    // Inicializa o Svelte uma única vez. 
    // Como bloqueamos o re-render lá em cima, ele nunca será interrompido.
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
    // Quando o usuário clica no [X] para fechar a janela, encerramos o Svelte com segurança.
    if (this.component) {
      this.component.$destroy();
      this.component = null;
    }
  }
}