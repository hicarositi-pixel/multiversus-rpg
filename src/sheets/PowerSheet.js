import PowerSheetShell from '../components/PowerSheet.svelte'; // Mantido seu import original

export default class MultiversusPowerSheet extends ItemSheet {
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
      template: "modules/multiversus-rpg/templates/power-sheet.html",
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "details" }],
      
      // --- [CRÍTICO] TRAVAS DE SEGURANÇA PARA SVELTE ---
      // Sem isso, ao editar um campo, o Foundry tenta ler o form HTML e trava.
      submitOnClose: false, 
      submitOnChange: false,
      closeOnSubmit: false
    });
  }

  // --- [CRÍTICO] BLOQUEIO DE SUBMISSÃO ---
  // Isso diz ao Foundry: "Eu salvo os dados pelo Svelte, ignore o formulário HTML".
  _getSubmitData(updateData = {}) {
    return null; 
  }

  /** @override */
  async _render(force, options) {
    // 1. ATUALIZAÇÃO (Live Update)
    if (!force && this.component) {
      this.component.$set({ 
        item: this.document,
        application: this,
        system: this.document.system, // Garante que o system atualizado chegue no Svelte
        updateTick: Date.now()
      });
      this.element.find(".window-title").text(this.title);
      return; 
    }

    // 2. PRIMEIRA ABERTURA
    await super._render(force, options);

    const target = this.element.find(".window-content")[0];
    if (target) {
      target.innerHTML = ""; 
      Object.assign(target.style, {
          padding: "0", background: "transparent", overflow: "hidden", height: "100%", display: "flex", flexDirection: "column"
      });

      if (this.component) this.component.$destroy();

      this.component = new PowerSheetShell({
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