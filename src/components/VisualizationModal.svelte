<script>
  import { fade, scale } from 'svelte/transition';

  export let title = "VISUALIZAÇÃO";
  export let subtitle = "TALENTO";
  export let rarity = "Lendário";
  export let img = "";
  export let htmlContent = "";
  export let isGM = false;
  export let startInEdit = false;
  export let onSave = async () => {};
  export let onClose = () => {};

  const RARITY_COLORS = {
    "Comum": "#a0a0a0",
    "Incomum": "#10b981",
    "Raro": "#00bfff",
    "Épico": "#8b5cf6",
    "Lendário": "#ffa500",
    "Mítico": "#ff4500",
    "Universal": "#ffffff",
    "Multiversal": "#d000ff"
  };

  $: themeColor = RARITY_COLORS[rarity] || "#00ff41";

  let viewMode = (isGM && startInEdit) ? 'split' : 'preview'; // 'preview' | 'split' | 'code'
  let draftHtml = htmlContent || "";
  let isMaximized = false;
  let hideSidebar = false;
  let isSaving = false;

  // Gerador opcional rápido no estilo Gama da Loja
  let showGamaHelper = false;
  let gamaDesc = "";
  let gamaWarn = "";
  let gamaSerial = "TLT-01";

  function decodeHtmlIfEscaped(text) {
    if (!text) return "";
    if (text.includes("&lt;") && !text.includes("<div") && !text.includes("<style")) {
      const txt = document.createElement("textarea");
      txt.innerHTML = text;
      return txt.value;
    }
    return text;
  }

  $: renderedHtml = decodeHtmlIfEscaped(isGM ? draftHtml : htmlContent);

  function applyGamaTemplate() {
    const safe = (t) => (t ? t.toString() : "");
    const fmt = (t) =>
      t
        ? t
            .replace(/\*(.*?)\*/g, '<strong style="color: #fff; text-shadow: 0 0 5px #00ff41;">$1</strong>')
            .replace(/\n/g, "<br>")
        : "";

    draftHtml = `<div class="gama-window-container">
    <div class="gama-window-header">
        <div class="window-controls"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span></div>
        <div class="window-title">TERMINAL_GAMA // ${safe(subtitle).toUpperCase()}</div>
    </div>
    <div class="gama-window-layout">
        <aside class="gama-window-sidebar">
            <div class="sidebar-section"><small>STATUS</small><div class="status-box">ONLINE</div></div>
            <div class="sidebar-section"><small>NÍVEL</small><div class="rarity-text">${safe(rarity).toUpperCase()}</div></div>
            <div class="sidebar-section"><small>LOTE/TAG</small><p>${safe(gamaSerial)}</p></div>
            <div class="sidebar-footer"><div class="pulse-icon"></div><span>CONEXÃO</span></div>
        </aside>
        <main class="gama-window-main">
            <div class="scanlines"></div>
            <h2 class="power-title">${safe(title).toUpperCase()}</h2>
            <div class="text-content">
                <p>${fmt(gamaDesc)}</p>
                ${gamaWarn ? `<p class="warning-text">[AVISO]: ${fmt(gamaWarn)}</p>` : ""}
            </div>
        </main>
    </div>
</div>
<style>
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;500&display=swap');
.gama-window-container { width: 100%; min-height: 100%; background: #0d0208; border: 1px solid #00ff41; display: flex; flex-direction: column; overflow: hidden; font-family: 'Fira Code', monospace; box-shadow: 0 0 30px rgba(0, 255, 65, 0.2); box-sizing: border-box; }
.gama-window-header { background: #003b00; padding: 8px 15px; display: flex; align-items: center; border-bottom: 1px solid #00ff41; }
.window-controls { display: flex; gap: 6px; margin-right: 20px; }
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.red { background: #ff5f56; } .yellow { background: #ffbd2e; } .green { background: #27c93f; }
.window-title { color: #00ff41; font-size: 0.7rem; letter-spacing: 1px; font-weight: bold; }
.gama-window-layout { display: flex; flex: 1; overflow: hidden; }
.gama-window-sidebar { width: 140px; background: rgba(0, 20, 0, 0.5); border-right: 1px solid #003b00; padding: 15px 10px; display: flex; flex-direction: column; gap: 15px; }
.sidebar-section small { color: #008f11; font-size: 0.6rem; display: block; margin-bottom: 4px; }
.status-box { background: #00ff41; color: #000; font-size: 0.7rem; font-weight: bold; padding: 2px; text-align: center; border-radius: 2px; }
.rarity-text { color: #ff003c; text-shadow: 0 0 5px #ff003c; font-size: 0.8rem; font-weight: bold; }
.gama-window-sidebar p { margin: 0; font-size: 0.75rem; color: #fff; }
.sidebar-footer { margin-top: auto; display: flex; align-items: center; gap: 5px; font-size: 0.6rem; color: #008f11; }
.pulse-icon { width: 6px; height: 6px; background: #00ff41; border-radius: 50%; box-shadow: 0 0 5px #00ff41; animation: pulse 1s infinite; }
.gama-window-main { flex: 1; padding: 20px; overflow-y: auto; position: relative; }
.power-title { color: #fff; font-size: 1.4rem; margin-top: 0; border-bottom: 1px dotted #00ff41; padding-bottom: 10px; text-shadow: 0 0 10px #00ff41; }
.text-content { color: #00ff41; font-size: 0.9rem; line-height: 1.4; }
.warning-text { color: #00fbff; font-size: 0.8rem; margin-top: 15px; border-left: 2px solid #00fbff; padding-left: 10px; }
.scanlines { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%); background-size: 100% 4px; pointer-events: none; z-index: 10; }
@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
</style>`;
    showGamaHelper = false;
    viewMode = 'preview';
  }

  async function handleSave() {
    if (!isGM || isSaving) return;
    isSaving = true;
    try {
      await onSave(draftHtml);
      ui.notifications.info(`Visualização de [${title}] salva com sucesso!`);
      viewMode = 'preview';
    } catch (err) {
      console.error("Erro ao salvar visualização:", err);
      ui.notifications.error("Erro ao salvar visualização.");
    } finally {
      isSaving = false;
    }
  }
</script>

<div class="viz-backdrop" on:click|self={onClose} transition:fade={{ duration: 150 }}>
  <div
    class="viz-window"
    class:maximized={isMaximized}
    style="--theme: {themeColor};"
    on:click|stopPropagation
    on:mousedown|stopPropagation
    in:scale={{ start: 0.95, duration: 180 }}
  >
    <header class="viz-header">
      <div class="viz-title">
        <i class="fas fa-eye"></i>
        <span>{title.toUpperCase()}</span>
        <small class="sub-pill">{subtitle}</small>
      </div>

      <div class="viz-header-actions">
        {#if isGM}
          <div class="mode-group">
            <button type="button" class:active={viewMode === 'preview'} on:click={() => (viewMode = 'preview')} title="Apenas Visualização">
              <i class="fas fa-eye"></i> VISUAL
            </button>
            <button type="button" class:active={viewMode === 'split'} on:click={() => (viewMode = 'split')} title="Código + Preview lado a lado">
              <i class="fas fa-columns"></i> DIVIDIR
            </button>
            <button type="button" class:active={viewMode === 'code'} on:click={() => (viewMode = 'code')} title="Editar HTML / CSS">
              <i class="fas fa-code"></i> HTML/CSS
            </button>
          </div>
          <button type="button" class="hdr-btn gama-btn" on:click={() => (showGamaHelper = !showGamaHelper)} title="Gerar Template Gama (Loja)">
            <i class="fas fa-magic"></i> GAMA
          </button>
        {/if}

        {#if img}
          <button type="button" class="hdr-btn" on:click={() => (hideSidebar = !hideSidebar)} title={hideSidebar ? "Mostrar Card Lateral" : "Ocultar Card Lateral"}>
            <i class="fas fa-id-badge"></i>
          </button>
        {/if}
        <button type="button" class="hdr-btn" on:click={() => (isMaximized = !isMaximized)} title={isMaximized ? "Restaurar Tamanho" : "Maximizar"}>
          <i class="fas {isMaximized ? 'fa-compress' : 'fa-expand'}"></i>
        </button>
        <button type="button" class="hdr-btn close" on:click={onClose} title="Fechar">✕</button>
      </div>
    </header>

    {#if isGM && showGamaHelper}
      <div class="gama-helper-bar">
        <input type="text" bind:value={gamaSerial} placeholder="Lote/Tag (Ex: TLT-01)" style="width: 130px;" />
        <input type="text" bind:value={gamaDesc} placeholder="Descrição rápida (*negrito* suportado)..." style="flex: 2;" />
        <input type="text" bind:value={gamaWarn} placeholder="Aviso opcional..." style="flex: 1;" />
        <button type="button" class="apply-gama-btn" on:click={applyGamaTemplate}>GERAR HTML</button>
      </div>
    {/if}

    <div class="viz-body">
      {#if img && !hideSidebar && viewMode === 'preview'}
        <aside class="viz-sidebar">
          <div class="img-box">
            <img src={img} alt={title} />
            <div class="scan-line"></div>
          </div>
          <span class="rar-pill">{rarity}</span>
        </aside>
      {/if}

      {#if isGM && (viewMode === 'code' || viewMode === 'split')}
        <div class="code-pane">
          <div class="pane-label"><i class="fas fa-terminal"></i> EDITOR HTML / CSS ( EXCLUSIVO MESTRE )</div>
          <textarea
            class="html-textarea custom-scroll"
            bind:value={draftHtml}
            placeholder="Cole ou escreva aqui o código HTML / CSS da visualização (igual aos itens da Loja)..."
          ></textarea>
        </div>
      {/if}

      {#if viewMode === 'preview' || viewMode === 'split' || !isGM}
        <div class="render-pane custom-scroll">
          {#if renderedHtml && renderedHtml.trim() !== ""}
            <div class="html-host">
              {@html renderedHtml}
            </div>
          {:else}
            <div class="empty-viz">
              <i class="fas fa-file-code"></i>
              <span>Nenhuma visualização HTML/CSS inserida ainda.</span>
              {#if isGM}
                <small>Use a aba HTML/CSS ao lado ou clique em GAMA acima para criar uma visualização.</small>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <footer class="viz-footer">
      <span class="resize-hint"><i class="fas fa-arrows-alt"></i> Arraste o canto inferior direito para redimensionar</span>
      {#if isGM}
        <div class="gm-save-group">
          <button type="button" class="btn-clear" on:click={() => (draftHtml = "")} title="Limpar HTML">LIMPAR</button>
          <button type="button" class="btn-save" disabled={isSaving} on:click={handleSave}>
            <i class="fas fa-save"></i> {isSaving ? "SALVANDO..." : "SALVAR VISUALIZAÇÃO"}
          </button>
        </div>
      {:else}
        <span class="readonly-pill"><i class="fas fa-lock"></i> MODO LEITURA</span>
      {/if}
    </footer>
  </div>
</div>

<style>
  .viz-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.86);
    backdrop-filter: blur(3px);
    z-index: 30000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }

  .viz-window {
    width: 860px;
    height: 580px;
    min-width: 460px;
    min-height: 340px;
    max-width: 96vw;
    max-height: 92vh;
    resize: both;
    overflow: hidden;
    background: #08080a;
    border: 1px solid var(--theme);
    border-top: 2px solid var(--theme);
    box-shadow: 0 0 50px rgba(0, 0, 0, 0.95);
    display: flex;
    flex-direction: column;
    font-family: 'Share Tech Mono', monospace;
    color: #ddd;
    border-radius: 4px;
  }

  .viz-window.maximized {
    width: 95vw !important;
    height: 90vh !important;
  }

  .viz-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    background: rgba(255, 255, 255, 0.03);
    border-bottom: 1px solid #222;
    flex-shrink: 0;
    gap: 10px;
  }

  .viz-title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--theme);
    font-size: 14px;
    font-weight: bold;
    letter-spacing: 1px;
    min-width: 0;
  }
  .viz-title span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .sub-pill {
    font-size: 9px;
    color: #aaa;
    border: 1px solid #333;
    background: #111;
    padding: 2px 6px;
    border-radius: 3px;
    text-transform: uppercase;
  }

  .viz-header-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .mode-group {
    display: flex;
    border: 1px solid #333;
    border-radius: 3px;
    overflow: hidden;
  }
  .mode-group button {
    background: #111;
    border: none;
    border-right: 1px solid #222;
    color: #888;
    font-family: inherit;
    font-size: 10px;
    padding: 5px 9px;
    cursor: pointer;
    transition: 0.2s;
  }
  .mode-group button:last-child {
    border-right: none;
  }
  .mode-group button.active {
    background: var(--theme);
    color: #000;
    font-weight: bold;
  }

  .hdr-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #444;
    color: #ccc;
    height: 26px;
    min-width: 26px;
    padding: 0 7px;
    cursor: pointer;
    font-family: inherit;
    font-size: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    transition: 0.2s;
  }
  .hdr-btn:hover {
    background: var(--theme);
    color: #000;
    border-color: var(--theme);
  }
  .hdr-btn.gama-btn {
    color: #00ff41;
    border-color: rgba(0, 255, 65, 0.5);
  }
  .hdr-btn.gama-btn:hover {
    background: #00ff41;
    color: #000;
  }
  .hdr-btn.close:hover {
    background: #ff3333;
    color: #fff;
    border-color: #ff3333;
  }

  .gama-helper-bar {
    display: flex;
    gap: 8px;
    padding: 8px 15px;
    background: #051208;
    border-bottom: 1px solid #00ff41;
    flex-shrink: 0;
  }
  .gama-helper-bar input {
    background: #000;
    border: 1px solid #2a5a32;
    color: #fff;
    padding: 5px 8px;
    font-family: inherit;
    font-size: 11px;
  }
  .apply-gama-btn {
    background: #00ff41;
    color: #000;
    border: none;
    font-family: inherit;
    font-weight: bold;
    font-size: 10px;
    padding: 0 12px;
    cursor: pointer;
  }

  .viz-body {
    flex: 1;
    display: flex;
    gap: 12px;
    padding: 14px;
    overflow: hidden;
    min-height: 0;
    background: #0b0b0e;
  }

  .viz-sidebar {
    width: 135px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
  .img-box {
    width: 120px;
    height: 120px;
    background: #000;
    border: 1px solid #333;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .img-box img {
    width: 92%;
    height: 92%;
    object-fit: contain;
  }
  .scan-line {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: rgba(255, 255, 255, 0.3);
    animation: scan 3s infinite linear;
  }
  .rar-pill {
    font-size: 10px;
    padding: 3px 8px;
    border: 1px solid var(--theme);
    color: var(--theme);
    background: #111;
    text-transform: uppercase;
  }

  .code-pane {
    flex: 1;
    display: flex;
    flex-direction: column;
    border: 1px solid #2a2a2a;
    background: #050505;
    min-width: 0;
    min-height: 0;
  }
  .pane-label {
    font-size: 10px;
    color: #00ff41;
    padding: 6px 10px;
    background: rgba(0, 255, 65, 0.06);
    border-bottom: 1px solid #1f3b24;
  }
  .html-textarea {
    flex: 1;
    width: 100%;
    background: transparent;
    border: none;
    color: #00ff41;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.45;
    padding: 12px;
    resize: none;
    outline: none;
    box-sizing: border-box;
  }

  .render-pane {
    flex: 1.2;
    background: #060608;
    border: 1px solid #222;
    padding: 12px;
    overflow: auto;
    min-width: 0;
    min-height: 0;
  }
  .html-host {
    width: 100%;
    min-height: 100%;
  }

  .empty-viz {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #555;
    text-align: center;
  }
  .empty-viz i {
    font-size: 28px;
    opacity: 0.5;
  }
  .empty-viz small {
    color: #777;
    font-size: 11px;
  }

  .viz-footer {
    height: 42px;
    flex-shrink: 0;
    background: #101014;
    border-top: 1px solid #262626;
    padding: 0 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .resize-hint {
    font-size: 10px;
    color: #666;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .gm-save-group {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .btn-clear {
    background: #1a1a1a;
    border: 1px solid #444;
    color: #999;
    font-family: inherit;
    font-size: 10px;
    padding: 5px 10px;
    cursor: pointer;
  }
  .btn-clear:hover {
    border-color: #ff4444;
    color: #ff4444;
  }
  .btn-save {
    background: #00ff41;
    color: #000;
    border: none;
    font-family: inherit;
    font-weight: bold;
    font-size: 11px;
    padding: 6px 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .btn-save:hover:not(:disabled) {
    box-shadow: 0 0 12px rgba(0, 255, 65, 0.6);
  }

  .readonly-pill {
    font-size: 9px;
    color: #00ff41;
    border: 1px solid rgba(0, 255, 65, 0.35);
    background: rgba(0, 255, 65, 0.08);
    padding: 3px 8px;
    border-radius: 3px;
  }

  .custom-scroll::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .custom-scroll::-webkit-scrollbar-track {
    background: #050505;
  }
  .custom-scroll::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 3px;
  }
  .custom-scroll::-webkit-scrollbar-thumb:hover {
    background: var(--theme);
  }

  @keyframes scan {
    0% { top: -20%; opacity: 0; }
    50% { opacity: 0.5; }
    100% { top: 120%; opacity: 0; }
  }
</style>
