import PoderesAppShell from './PoderesApp.svelte';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class PoderesManager extends ApplicationV2 {
  static DEFAULT_OPTIONS = {
    tag: "div",
    window: {
      title: "Nexus Database: Poderes",
      icon: "fas fa-bolt",
      resizable: true,
      width: 500,
      height: 700,
    },
    classes: ["multiversus-app"],
    position: {
      width: 500,
      height: 700
    }
  }

  async _renderHTML(context, options) {
    const wrapper = document.createElement("div");
    wrapper.style.height = "100%";
    wrapper.style.overflow = "hidden";

    new PoderesAppShell({
      target: wrapper,
      props: {
        application: this
      }
    });

    return wrapper;
  }
  
  _replaceHTML(result, content, options) {
    content.replaceWith(result);
  }
}