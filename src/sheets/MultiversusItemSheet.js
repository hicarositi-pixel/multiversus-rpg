import MultiversusComponent from '../components/PowerSheet.svelte'; 

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
    // 1. LIVE UPDATE (O Segredo da Estabilidade)
    if (!force && this.component) {
      // Pega as flags atuais e clona para garantir reatividade
      const currentFlags = this.document.flags["multiversus-rpg"] || {};
      
      this.component.$set({ 
        item: this.document,
        flags: { ...currentFlags }, // Clona para forçar o Svelte a ver a mudança
        application: this
      });

      // Atualiza o título da janela (caso o nome mude)
      this.element.find(".window-title").text(this.title);

      return; // <--- IMPEDE O FOUNDRY DE DESTRUIR O HTML
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

      // Pega flags iniciais
      const initialFlags = this.document.flags["multiversus-rpg"] || {};

      this.component = new MultiversusComponent({
        target: target,
        props: {
          item: this.document,
          flags: { ...initialFlags }, // Passa flags desde o início
          application: this
        }
      });
    }
  }

  /** @override */
  async close(options = {}) {
    if (this.component) {
      this.component.$destroy();
      this.component = null;
    }
    return super.close(options);
  }
}