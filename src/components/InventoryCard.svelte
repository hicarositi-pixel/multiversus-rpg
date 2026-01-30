<script>
  // --- PROPS ---
  export let item;        
  export let index;       
  export let isGM;        
  export let onSelect;    
  export let onUpdateQty; 
  export let onDelete;    
  export let inGrid = false; // Prop crucial para saber o contexto

  // --- CONFIGURAÇÃO VISUAL ---
  const RARITY_MAP = {
    "Comum":      { color: "#a0a0a0", label: "STD", fx: "grain" },
    "Incomum":    { color: "#10b981", label: "ADV", fx: "circuit" },
    "Raro":       { color: "#00bfff", label: "SPC", fx: "energy" },
    "Épico":      { color: "#8b5cf6", label: "PRO", fx: "glitch" },
    "Lendário":   { color: "#ffa500", label: "MST", fx: "gold" },
    "Mítico":     { color: "#ff4500", label: "ULT", fx: "fire" },
    "Universal":  { color: "#ffffff", label: "UNI", fx: "void" },
    "Multiversal": { color: "#d000ff", label: "MLT", fx: "nebula" }
  };

  $: config = RARITY_MAP[item.rarity] || RARITY_MAP["Comum"];
  $: neon = config.color;
  $: width = item.w || 1;
  $: height = item.h || 1;
  
  // Lógica de Exibição Compacta (Apenas para Grid 1x1)
  $: isCompact = inGrid && (width === 1 && height === 1); 
  $: showFooter = !inGrid || height > 1; // Footer exige altura > 1 no grid
  $: showHeader = !inGrid || !isCompact; // Header visível se não for compacto
</script>

<div 
  class="matrix-card {inGrid ? 'mode-grid' : 'mode-stash'} {isCompact ? 'compact' : ''} rar-{config.fx}" 
  style="--neon: {neon}; --w: {width}; --h: {height}" 
  on:click={() => onSelect(item)}
  title="{item.name} | {item.rarity}"
>
  <div class="card-base"></div>
  <div class="rarity-texture"></div>
  <div class="glass-overlay"></div>
  <div class="bg-grid"></div>

  <div class="hud-frame">
    <div class="corner tl"></div><div class="corner tr"></div>
    <div class="corner bl"></div><div class="corner br"></div>
    {#if !isCompact}
        <div class="edge-code">{config.label}-{item.id?.substring(0,4).toUpperCase() || 'NULL'}</div>
    {/if}
  </div>

  {#if showHeader}
    <div class="card-header">
      <div class="rarity-bar"></div>
      <span class="item-name">{item.name}</span>
    </div>
  {/if}

  <div class="image-port">
    <div class="img-depth"></div>
    <img src={item.img || "icons/svg/item-bag.svg"} alt={item.name} loading="lazy" draggable="false" />
    
    {#if inGrid}
        <div class="scan-beam"></div>
    {/if}
    
    {#if isCompact}
        <div class="mini-overlay">
            <span>{item.name}</span>
        </div>
    {/if}
  </div>

  {#if showFooter}
    <div class="card-footer">
      <div class="footer-grid">
        <span class="tag-type">{item.type ? item.type.substring(0, 10) : 'OBJ'}</span>
        <div class="dimension-box">{width}x{height}</div>
      </div>
    </div>
  {/if}

  {#if item.qty > 1}
    <div class="qty-badge" class:compact={isCompact}>
      {#if !isCompact}<span class="q-label">x</span>{/if}
      <span class="q-val">{item.qty}</span>
    </div>
  {/if}

  {#if isGM}
    <div class="gm-terminal" on:click|stopPropagation>
      <div class="terminal-bg"></div>
      
      {#if !isCompact}
          <div class="terminal-header">ACESSO GM</div>
      {/if}
      
      <div class="cmd-group">
        <button on:click={() => onUpdateQty(index, -1)} class="cmd-btn">-</button>
        <span class="qty-display">{item.qty}</span>
        <button on:click={() => onUpdateQty(index, 1)} class="cmd-btn">+</button>
      </div>
      
      <div class="cmd-footer">
        <button on:click={() => onSelect(item)} title="Editar"><i class="fas fa-edit"></i></button>
        <button on:click={() => onDelete(item.id || index)} title="Remover" class="del"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  {/if}
</div>

<style>
  /* --- ESTRUTURA BASE --- */
  .matrix-card {
    position: relative;
    background: #050505;
    border: 1px solid rgba(255, 255, 255, 0.15);
    display: flex; flex-direction: column;
    overflow: hidden;
    font-family: 'Share Tech Mono', monospace;
    transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s, border-color 0.2s;
    user-select: none;
    box-sizing: border-box;
    will-change: transform; /* Otimização de GPU */
  }

  /* --- MODOS DE EXIBIÇÃO --- */
  /* No Grid: O card deve preencher 100% do container pai (o slot do grid) */
  .mode-grid { width: 100%; height: 100%; }
  
  /* No Stash: Tamanho fixo e agradável para lista */
  .mode-stash { height: 200px; min-width: 140px; }

  /* --- TEXTURAS DINÂMICAS --- */
  .rarity-texture { position: absolute; inset: 0; opacity: 0.12; z-index: 1; pointer-events: none; mix-blend-mode: screen; }
  
  .rar-circuit .rarity-texture { background-image: radial-gradient(var(--neon) 1px, transparent 1px); background-size: 15px 15px; }
  .rar-energy .rarity-texture { background: repeating-linear-gradient(45deg, transparent, transparent 5px, var(--neon) 6px); opacity: 0.08; }
  .rar-gold .rarity-texture { background: radial-gradient(circle at center, var(--neon), transparent 80%); opacity: 0.15; animation: pulse 3s infinite; }
  .rar-glitch .rarity-texture { background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="4" fill="%23fff" fill-opacity="0.1"/></svg>'); }
  .rar-nebula .rarity-texture { background: linear-gradient(120deg, transparent, var(--neon), transparent); opacity: 0.2; animation: nebula 6s linear infinite; }

  /* --- LAYERS --- */
  .card-base { position: absolute; inset: 0; background: #080808; z-index: 0; }
  .glass-overlay { position: absolute; inset: 0; background: linear-gradient(160deg, rgba(255,255,255,0.03) 0%, transparent 40%); z-index: 4; pointer-events: none; }
  
  /* --- HUD --- */
  .hud-frame { position: absolute; inset: 0; z-index: 5; pointer-events: none; }
  .corner { position: absolute; width: 4px; height: 4px; border: 1px solid var(--neon); opacity: 0.3; transition: 0.3s; }
  .tl { top: 2px; left: 2px; border-right: 0; border-bottom: 0; }
  .tr { top: 2px; right: 2px; border-left: 0; border-bottom: 0; }
  .bl { bottom: 2px; left: 2px; border-right: 0; border-top: 0; }
  .br { bottom: 2px; right: 2px; border-left: 0; border-top: 0; }
  
  .edge-code { 
    position: absolute; top: 50%; right: -12px; transform: rotate(90deg) translateX(50%);
    font-size: 6px; color: var(--neon); opacity: 0.4; letter-spacing: 1px; white-space: nowrap;
  }

  /* --- HEADER --- */
  .card-header { 
    padding: 4px 6px; z-index: 10; display: flex; align-items: center; gap: 6px; flex-shrink: 0;
    background: linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0.4)); 
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .rarity-bar { width: 3px; height: 10px; background: var(--neon); box-shadow: 0 0 6px var(--neon); }
  .item-name { font-size: 10px; color: #fff; font-weight: bold; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 0 5px rgba(0,0,0,0.8); }

  /* --- IMAGE PORT --- */
  .image-port { 
    flex: 1; position: relative; display: flex; align-items: center; justify-content: center;
    background: radial-gradient(circle, #151515 0%, #050505 100%); padding: 4px; z-index: 5; overflow: hidden;
  }
  .img-depth { position: absolute; inset: 0; box-shadow: inset 0 0 15px rgba(0,0,0,0.8); z-index: 1; pointer-events: none; }
  
  .image-port img { 
    width: 90%; height: 90%; object-fit: contain; 
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6)); 
    z-index: 2; transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); 
  }
  
  .matrix-card:hover img { transform: scale(1.15) translateY(-2px); }

  .scan-beam {
    position: absolute; top: -50%; left: 0; width: 100%; height: 5px;
    background: var(--neon); opacity: 0.4; box-shadow: 0 0 10px var(--neon);
    animation: scan 4s infinite linear; z-index: 3; pointer-events: none;
  }

  .mini-overlay {
      position: absolute; bottom: 0; left: 0; width: 100%; 
      background: rgba(0,0,0,0.85); border-top: 1px solid var(--neon);
      font-size: 8px; color: #fff; text-align: center; padding: 2px 0;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      z-index: 10;
  }

  /* --- FOOTER --- */
  .card-footer { 
    padding: 3px 6px; background: rgba(0,0,0,0.9); z-index: 10; flex-shrink: 0;
    border-top: 1px solid rgba(255,255,255,0.08); 
  }
  .footer-grid { display: flex; justify-content: space-between; align-items: center; }
  .tag-type { font-size: 8px; color: #888; font-weight: bold; letter-spacing: 0.5px; }
  .dimension-box { font-size: 8px; background: rgba(255,255,255,0.08); padding: 1px 3px; border-radius: 2px; color: var(--neon); font-weight: bold; }

  /* --- QTY BADGE --- */
  .qty-badge {
    position: absolute; top: 25px; right: 4px; 
    background: rgba(0,0,0,0.85); border: 1px solid var(--neon);
    padding: 0 4px; border-radius: 2px; z-index: 15;
    box-shadow: 0 2px 5px rgba(0,0,0,0.5);
    display: flex; align-items: baseline; gap: 2px;
  }
  .qty-badge.compact { top: 2px; right: 2px; padding: 0 2px; border: none; background: rgba(0,0,0,0.6); }
  
  .q-label { font-size: 7px; color: var(--neon); }
  .q-val { font-size: 11px; font-weight: bold; color: #fff; text-shadow: 0 0 5px var(--neon); }

  /* --- GM TERMINAL --- */
  .gm-terminal {
    position: absolute; inset: 0; background: rgba(0,0,0,0.92);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    opacity: 0; transition: 0.2s; z-index: 100; border: 1px solid var(--neon);
    backdrop-filter: blur(3px); gap: 6px;
  }
  .matrix-card:hover .gm-terminal { opacity: 1; }
  
  .terminal-header { font-size: 8px; color: var(--neon); letter-spacing: 2px; margin-bottom: 5px; }
  
  .cmd-group { display: flex; align-items: center; gap: 8px; }
  .cmd-btn { 
    width: 22px; height: 22px; background: none; border: 1px solid var(--neon); 
    color: var(--neon); cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: 0.2s; font-size: 12px;
  }
  .cmd-btn:hover { background: var(--neon); color: #000; }
  .qty-display { font-size: 14px; font-weight: bold; color: #fff; min-width: 20px; text-align: center; }
  
  .cmd-footer { display: flex; gap: 8px; margin-top: 5px; }
  .cmd-footer button { 
    background: #151515; border: 1px solid #444; color: #ccc; 
    width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: 0.2s; font-size: 12px;
  }
  .cmd-footer button:hover { background: #333; color: #fff; border-color: #fff; }
  .cmd-footer button.del:hover { background: #300; border-color: #f00; color: #f00; }

  /* --- ANIMATIONS --- */
  @keyframes scan { 0% { top: -20%; opacity: 0; } 50% { opacity: 0.5; } 100% { top: 120%; opacity: 0; } }
  @keyframes pulse { 0% { opacity: 0.1; } 50% { opacity: 0.3; } 100% { opacity: 0.1; } }
  @keyframes nebula { 0% { background-position: 0% 50%; } 100% { background-position: 100% 50%; } }

  /* --- HOVER GLOBAL --- */
  .matrix-card:hover { 
    border-color: var(--neon); 
    box-shadow: 0 0 15px rgba(0,0,0,0.6), inset 0 0 10px rgba(var(--neon), 0.2); 
    z-index: 50; /* Eleva o card sobre os outros */
  }
  .matrix-card:hover .corner { opacity: 1; width: 8px; height: 8px; }
</style>