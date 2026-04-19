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
      submitOnChange: false, // Deixa o Svelte lidar com os saves
      closeOnSubmit: false
    });
  }

  /* -------------------------------------------- */
  /* Ciclo de Vida do Foundry                     */
  /* -------------------------------------------- */

  async _render(force, options) {
    // 1. LIVE UPDATE: Se não forçado, injeta os dados novos no Svelte sem piscar a tela
    if (!force && this.component) {
      this.component.$set({ 
        item: this.document,
        application: this,
        flags: this.document.flags["multiversus-rpg"] || {}
      });
      
      // Atualiza título da janela
      if (this.element) {
          this.element.find(".window-title").text(this.title);
      }
      
      return; // <-- IMPEDE O FOUNDRY DE DESTRUIR A JANELA
    }

    // 2. O GRANDE FIX: Destrói o Svelte ANTES do Foundry vaporizar o HTML!
    if (this.component) {
      this.component.$destroy();
      this.component = null;
    }

    // 3. Agora sim, o Foundry pode recriar a carcaça da janela com segurança
    await super._render(force, options);
 
    // 4. Seleciona o corpo limpo da janela e monta o Svelte novo
    const target = this.element.find(".window-content")[0];
    
    if (target) {
      target.innerHTML = "";
      target.classList.add("svelte-target"); 

      this.component = new PowerSheetShell({
        target: target,
        props: {
          item: this.document,
          application: this,
          flags: this.document.flags["multiversus-rpg"] || {}
        }
      });
    }
  }

  async close(options = {}) {
    if (this.component) {
      this.component.$destroy();
      this.component = null;
    }
    return super.close(options);
  }
}