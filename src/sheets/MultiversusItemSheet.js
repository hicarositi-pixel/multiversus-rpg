import MultiversusComponent from '../components/PowerSheet.svelte'; // Ajuste o caminho se necessário

export default class MultiversusItemSheet extends ItemSheet {
  constructor(object, options = {}) {
    super(object, options);
    this.component = null;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["multiversus", "sheet", "item"],
      width: 850,
      height: 750,
      resizable: true,
      template: "modules/multiversus-rpg/templates/power-sheet.html",
      submitOnClose: false,
      submitOnChange: false,
      closeOnSubmit: false
    });
  }

  /** @override */
  async _render(force, options) {
    // 1. LIVE UPDATE (AQUI ESTÁ A CORREÇÃO DE RENDER)
    if (!force && this.component) {
      // Pega as flags atuais
      const currentFlags = this.document.flags["multiversus-rpg"] || {};
      
      this.component.$set({ 
        item: this.document,
        // O PULO DO GATO: {...currentFlags} cria um NOVO objeto na memória.
        // O Svelte detecta isso como "mudança real" e atualiza a tela.
        flags: { ...currentFlags },
        application: this
      });
      
      this.element.find(".window-title").text(this.title);
      return; 
    }

    // 2. CRIAÇÃO INICIAL
    await super._render(force, options);

    const target = this.element.find(".window-content")[0];
    if (target) {
      target.innerHTML = ""; 
      target.style.padding = "0";
      target.style.overflow = "hidden";
      target.style.height = "100%";

      if (this.component) this.component.$destroy();

      const initialFlags = this.document.flags["multiversus-rpg"] || {};

      this.component = new MultiversusComponent({
        target: target,
        props: {
          item: this.document,
          // Passamos a cópia aqui também
          flags: { ...initialFlags },
          application: this
        }
      });
    }
  }

  _getSubmitData(updateData = {}) { return {}; }

  async close(options = {}) {
    if (this.component) {
      this.component.$destroy();
      this.component = null;
    }
    return super.close(options);
  }
}