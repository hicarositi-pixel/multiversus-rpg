import PowerSheetShell from '../components/PowerSheet.svelte'; // Verifique se o caminho da pasta apps está certo

export default class MultiversusPowerSheet extends ItemSheet {
  constructor(object, options = {}) {
    super(object, options);
    this.component = null;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["multiversus-rpg", "sheet", "item", "nexus-window"],
      width: 800, // Ajustei para caber melhor o layout novo
      height: 600,
      resizable: true,
      // O template HTML deve existir, mesmo que vazio
template: "modules/multiversus-rpg/templates/power-sheet.html",
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "details" }]
    });
  }

  /** @override */
  async _render(force, options) {
    // 1. CENÁRIO DE ATUALIZAÇÃO (LIVE UPDATE)
    // Se a ficha já foi desenhada e o componente Svelte existe,
    // nós apenas atualizamos os dados dentro dele e abortamos o resto.
    if (!force && this.component) {
      // Atualiza os props do Svelte
      this.component.$set({ 
        item: this.document,
        application: this,
        updateTick: Date.now() // Força a reatividade
      });

      // Atualiza o Título da Janela manualmente (já que pulamos o super._render)
      this.element.find(".window-title").text(this.title);
      
      return; // <--- O PULO DO GATO: Para aqui e não deixa o Foundry destruir o HTML.
    }

    // 2. CENÁRIO DE CRIAÇÃO (PRIMEIRA ABERTURA)
    // Se chegamos aqui, é porque force=true ou a ficha ainda não existe.
    await super._render(force, options);

    const target = this.element.find(".window-content")[0];
    
    // Limpeza visual para o Svelte assumir o controle total
    if (target) {
      target.innerHTML = ""; 
      target.style.padding = "0";
      target.style.background = "transparent";
      target.style.overflow = "hidden"; 
      target.style.height = "100%"; // Garante que o container ocupe tudo
    }

    // Inicia o componente Svelte
    // Se por acaso ele já existia (force=true), destruímos antes para evitar memória vazada
    if (this.component) {
      this.component.$destroy();
    }

    this.component = new PowerSheetShell({
      target: target,
      props: {
        item: this.document,
        application: this,
        updateTick: Date.now()
      }
    });
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