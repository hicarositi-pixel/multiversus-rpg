import PowerSheetShell from './components/PowerSheet.svelte'; 

export default class MultiversusItemSheet extends ItemSheet {
  constructor(object, options = {}) {
    super(object, options);
    this.component = null;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["multiversus-rpg", "sheet", "item", "nexus-window"],
      width: 800,
      height: 650,
      resizable: true,
      template: "modules/multiversus-rpg/templates/power-sheet.html", 
      submitOnChange: false, // IMPORTANTE: Deixa o Svelte lidar com os saves
      closeOnSubmit: false
    });
  }

  /* -------------------------------------------- */
  /* Ciclo de Vida do Foundry                     */
  /* -------------------------------------------- */

  /** * A Mágica Acontece Aqui:
   */
  async _render(force, options) {
    // 1. Se NÃO é forçado e o componente já existe, é apenas uma atualização de dados (Live Update)
    if (!force && this.component) {
      
      this.component.$set({ 
        item: this.document,
        application: this,
        flags: this.document.flags["multiversus-rpg"] || {}
        // O item.system já vai dentro de 'item', então o Svelte consegue ler
      });
      
      // Atualiza título da janela sem recriar
      if (this.element) {
          this.element.find(".window-title").text(this.title);
      }
      
      return; // <--- IMPEDE O FOUNDRY DE DESTRUIR O HTML (Evita piscar)
    }

    // 2. Se chegamos aqui, é a primeira vez ou um hard-reset
    await super._render(force, options);
 
    // Seleciona o corpo da janela
    const target = this.element.find(".window-content")[0];
    
    if (target) {
      target.innerHTML = "";
      target.classList.add("svelte-target"); 
    }

    if (this.component) {
      this.component.$destroy();
    }

    // Cria a Instância Svelte
    this.component = new PowerSheetShell({
      target: target,
      props: {
        item: this.document,
        application: this,
        flags: this.document.flags["multiversus-rpg"] || {}
      }
    });
  }

  /**
   * Garante que, ao fechar a janela, o componente Svelte morra da memória
   */
  async close(options = {}) {
    if (this.component) {
      this.component.$destroy();
      this.component = null;
    }
    return super.close(options);
  }
}