import MultiversusComponent from '../components/MultiversusPower.svelte';

export default class MultiversusItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["multiversus", "sheet", "item"],
      width: 850, // Aumentei um pouco para caber o novo layout bonito
      height: 750,
      resizable: true,
      // O template vazio que criamos antes
      template: "modules/multiversus-rpg/templates/power-sheet.html", 
      
      // --- CORREÇÃO DO BUG DE FECHAR ---
      submitOnClose: false, // Impede o erro "no registered form element" ao fechar
      submitOnChange: false, // Impede o Foundry de tentar ler o HTML ao digitar
      closeOnSubmit: false
    });
  }

  /** @override */
  async _render(force, options) {
    if (!this.isEditable && !force) return;

    // Se a ficha já existe, apenas atualiza a prop 'item' para o Svelte reagir
    if (this.component) {
      this.component.$set({ item: this.document });
      return;
    }

    // Renderiza o esqueleto HTML
    await super._render(force, options);

    // Injeta o Svelte
    const target = this.element.find(".window-content")[0];
    if (target) {
      target.innerHTML = ""; 
      target.style.padding = "0";
      target.style.overflow = "hidden"; // Remove scroll duplo

      this.component = new MultiversusComponent({
        target: target,
        props: {
          item: this.document,
          application: this
        }
      });
    }
  }

  /** * BLOQUEIO DE SEGURANÇA 
   * Se por algum motivo o Foundry tentar salvar, retornamos vazio 
   * para ele não quebrar procurando um <form> que não existe.
   */
  _getSubmitData(updateData = {}) {
    return {};
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