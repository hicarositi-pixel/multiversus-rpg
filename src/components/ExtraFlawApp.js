// Certifique-se que o nome do arquivo Svelte bate com o import!
import ExtraFlawShell from './ExtraFlaw.svelte'; 
const { ApplicationV2 } = foundry.applications.api;

export default class ExtraFlawApp extends ApplicationV2 {
  constructor(item, qualityIndex) {
    super({ window: { title: `Gerenciador: ${item.name}` } });
    this.item = item;
    this.qualityIndex = qualityIndex;
    this.component = null; // Rastrear o componente Svelte
  }

  static DEFAULT_OPTIONS = {
    tag: "div",
    window: {
      resizable: true,
      width: 750,
      height: 600,
      icon: "fas fa-bolt",
      contentClasses: ["standard-form", "multiversus-app"] // Garante rolagem e estilo base
    },
    position: {
      width: 750,
      height: 600
    }
  }

  /* -------------------------------------------- */
  /* Renderização                                */
  /* -------------------------------------------- */

  /**
   * Cria o HTML inicial. Na V2, isso retorna o elemento DOM, não uma string.
   */
  async _renderHTML(context, options) {
    const wrapper = document.createElement("div");
    wrapper.style.height = "100%";
    wrapper.style.overflow = "hidden";
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.classList.add("svelte-wrapper");

    // Segurança: Se por algum motivo renderizar de novo, limpa o anterior
    if (this.component) {
        this.component.$destroy();
    }

    // Monta o Svelte
    // Passamos 'flags' se o seu Svelte esperar, mas seu código atual espera 'item' e 'qualityIndex'
    this.component = new ExtraFlawShell({
      target: wrapper,
      props: {
        item: this.item,
        qualityIndex: this.qualityIndex,
        application: this
      }
    });

    return wrapper;
  }

  /**
   * Substitui o conteúdo no DOM. Padrão da V2.
   */
  _replaceHTML(result, content, options) {
    content.replaceWith(result);
  }

  /* -------------------------------------------- */
  /* Ciclo de Vida (Limpeza)                     */
  /* -------------------------------------------- */

  /**
   * IMPORTANTE: Quando fechar a janela, matar o Svelte.
   * Isso previne erros de "update on destroyed component" e vazamento de memória.
   */
  _onClose(options) {
    if (this.component) {
      this.component.$destroy();
      this.component = null;
    }
  }
}