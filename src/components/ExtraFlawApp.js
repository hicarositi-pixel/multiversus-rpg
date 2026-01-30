import ExtraFlawShell from './ExtraFlaw.svelte';
const { ApplicationV2 } = foundry.applications.api;

export default class ExtraFlawApp extends ApplicationV2 {
  constructor(item, qualityIndex) {
    super({ window: { title: `Gerenciador: ${item.name}` } });
    this.item = item;
    this.qualityIndex = qualityIndex;
  }

  static DEFAULT_OPTIONS = {
    tag: "div",
    window: {
      resizable: true,
      width: 750,
      height: 600,
      icon: "fas fa-bolt"
    },
    classes: ["multiversus-app"]
  }

  // 1. Cria o HTML (Onde o Svelte monta)
  async _renderHTML(context, options) {
    const wrapper = document.createElement("div");
    wrapper.style.height = "100%";
    wrapper.style.overflow = "hidden";
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";

    // Monta o Svelte
    new ExtraFlawShell({
      target: wrapper,
      props: {
        item: this.item,
        qualityIndex: this.qualityIndex,
        application: this
      }
    });

    return wrapper;
  }

  // 2. Substitui o HTML (O método que faltava e causava o erro)
  _replaceHTML(result, content, options) {
    // Troca o conteúdo antigo pelo novo elemento gerado
    content.replaceWith(result);
  }
}