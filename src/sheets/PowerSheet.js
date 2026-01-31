import PowerSheetShell from './components/PowerSheet.svelte'; // AJUSTE O CAMINHO SE NECESSÁRIO

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
      // Template vazio apenas para criar a "casca"
      template: "modules/multiversus-rpg/templates/power-sheet.html", 
      submitOnChange: false, // IMPORTANTE: Deixa o Svelte lidar com os saves
      closeOnSubmit: false
    });
  }

  /* -------------------------------------------- */
  /* Ciclo de Vida do Foundry                    */
  /* -------------------------------------------- */

  /** * A Mágica Acontece Aqui:
   * Interceptamos o render padrão. Se o Svelte já existe,
   * apenas passamos os novos dados para ele e cancelamos o desenho do HTML.
   */
  async _render(force, options) {
    // 1. Se NÃO é forçado e o componente já existe, é apenas uma atualização de dados
    if (!force && this.component) {
      // Atualiza as props do Svelte reativamente
      this.component.$set({ 
        item: this.document,
        application: this,
        flags: this.document.flags["multiversus-rpg"] || {} // Passa flags atualizadas
      });
      
      // Atualiza título da janela sem recriar
      if (this.element) {
          this.element.find(".window-title").text(this.title);
      }
      
      return; // <--- IMPEDE O FOUNDRY DE DESTRUIR O HTML
    }

    // 2. Se chegamos aqui, é a primeira vez ou um hard-reset
    await super._render(force, options);
 
    // Seleciona o corpo da janela
    const target = this.element.find(".window-content")[0];
    
    if (target) {
      // Limpa qualquer lixo HTML que o template padrão tenha colocado
      target.innerHTML = "";
      target.classList.add("svelte-target"); // Classe para CSS se precisar
    }

    // Se existia antes (num hard refresh), mata para recriar limpo
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