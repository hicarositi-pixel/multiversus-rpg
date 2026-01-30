import MultiversusComponent from '../components/MultiversusPower.svelte';

export default class MultiversusItemSheet extends ItemSheet {
  constructor(object, options = {}) {
    super(object, options);
    this.component = null;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["multiversus-rpg", "sheet", "item", "nexus-window"],
      width: 800,
      height: 600,
      resizable: true,
      template: "modules/multiversus-rpg/templates/power-sheet.html", // O HTML vazio tem que existir
      
      // --- CRÍTICO: ISSO FAZ A EDIÇÃO FUNCIONAR ---
      submitOnClose: false,
      submitOnChange: false,
      closeOnSubmit: false
    });
  }

  // --- CRÍTICO: ISSO EVITA O ERRO DE VALIDAÇÃO ---
  _getSubmitData(updateData = {}) {
    return null; 
  }

  /** @override */
  async _render(force, options) {
    if (!force && this.component) {
      this.component.$set({ 
        item: this.document,
        application: this,
        system: this.document.system, // Garante dados frescos
        updateTick: Date.now()
      });
      return; 
    }

    await super._render(force, options);

    const target = this.element.find(".window-content")[0];
    if (target) {
      target.innerHTML = ""; 
      Object.assign(target.style, {
          padding: "0", background: "transparent", overflow: "hidden", height: "100%", display: "flex", flexDirection: "column"
      });

      if (this.component) this.component.$destroy();

      this.component = new MultiversusComponent({
        target: target,
        props: {
          item: this.document,
          application: this,
          system: this.document.system,
          updateTick: Date.now()
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