<script>
  export let effect;       // Dados estáticos da DB (Nome, Custo, Icone)
  export let savedExtras;  // Array atual de extras salvos no item
  export let onUpdate;     // Função do pai que salva no banco
  export let onInfo;       // Função que abre o modal
  export let type;         // 'extra' (Verde) ou 'flaw' (Vermelho)

  // REATIVIDADE: 
  // Procura se este efeito específico existe na lista salva.
  // O Svelte recalcula isso instantaneamente quando 'savedExtras' muda no pai.
  $: savedData = savedExtras.find(e => e.id === effect.id);
  $: isActive = !!savedData;
  $: qty = savedData ? (savedData.qty || 1) : 0;

  // Define cores baseadas no tipo (Matrix Style)
  $: neonColor = type === 'extra' ? '#00ff41' : '#ff003c'; // Verde Matrix vs Vermelho Erro
</script>

<div 
  class="matrix-card {type} {isActive ? 'active' : ''}" 
  style="--neon-color: {neonColor}"
>
  
<div class="card-header">
  <span class="cost-badge" style="color: var(--neon-color); font-size: 1.1em;">
    [{effect.cost > 0 ? '+' : ''}{effect.cost}]
  </span>

  <span class="card-name" title={effect.name}>{effect.name}</span>
</div>

  <div class="card-body" on:click={() => onUpdate(effect, 0)}>
    <div class="icon-frame">
      <span class="icon">{effect.icon}</span>
    </div>
    <div class="scanline"></div>
  </div>

  <div class="card-footer">
    
    {#if isActive}
      <div class="control-panel">
        <button class="btn-digital minus" on:click|stopPropagation={() => onUpdate(effect, -1)}>-</button>
        <div class="screen-qty">
          <span class="label">QTD</span>
          <span class="value">{qty}</span>
        </div>
        <button class="btn-digital plus" on:click|stopPropagation={() => onUpdate(effect, 1)}>+</button>
      </div>

    {:else}
      <button class="btn-activate" on:click|stopPropagation={() => onUpdate(effect, 1)}>
        <span class="bracket">[</span> INITIALIZE <span class="bracket">]</span>
      </button>
    {/if}

  </div>

  <button 
    class="btn-info" 
    on:click|stopPropagation={() => onInfo(effect.desc, effect.name)}
    title="Access Data"
  >
    ?
  </button>

  <div class="bg-grid"></div>
</div>

<style>
  /* --- ESTRUTURA GLOBAL --- */
  .matrix-card {
    position: relative;
    background: #050505; /* Preto Profundo */
    border: 1px solid #333;
    border-radius: 4px;
    height: 140px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: all 0.2s ease-out;
    box-shadow: 0 0 5px rgba(0,0,0,0.8);
    font-family: 'Courier New', Courier, monospace; /* Fonte Hacker */
    user-select: none;
  }

  /* EFEITO AO PASSAR O MOUSE */
  .matrix-card:hover {
    border-color: #555;
    background: #0a0a0a;
  }

  /* --- ESTADO ATIVO (GLOW) --- */
  .matrix-card.active {
    border-color: var(--neon-color);
    box-shadow: 0 0 10px var(--neon-color), inset 0 0 15px rgba(0,0,0,0.8);
  }

  /* --- CABEÇALHO --- */
  .card-header {
display: flex;
  justify-content: flex-start; /* Alinha tudo à esquerda */
  align-items: center;
  gap: 10px; /* Espaço entre o custo e o nome */
    padding: 6px 8px;
    background: rgba(255,255,255,0.03);
    border-bottom: 1px solid #222;
  }

  .card-name {
    font-size: 0.8em;
    font-weight: bold;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 1px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 75%;
    margin-right: 20px; /* Margem de segurança para o botão ? */
  text-align: left; /* Alinha texto a esquerda */
  }

  .active .card-name {
    color: var(--neon-color);
    text-shadow: 0 0 5px var(--neon-color);
  }

  .cost-badge {
    font-size: 0.8em;
    color: #555;
    font-weight: bold;
  }
  .active .cost-badge { color: var(--neon-color); }

  /* --- CORPO (ÍCONE) --- */
  .card-body {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    cursor: pointer;
  }

  .icon {
    font-size: 2.2em;
    filter: grayscale(100%) opacity(0.5);
    transition: 0.3s;
  }

  .active .icon {
    filter: grayscale(0%) opacity(1) drop-shadow(0 0 8px var(--neon-color));
    transform: scale(1.1);
  }

  /* Scanline Effect */
  .scanline {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.3) 51%);
    background-size: 100% 4px;
    pointer-events: none;
    opacity: 0.3;
  }

  /* --- RODAPÉ (CONTROLES) --- */
  .card-footer {
    height: 36px;
    padding: 4px;
    background: #080808;
    border-top: 1px solid #222;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .active .card-footer { border-top-color: var(--neon-color); }

  /* Botão INITIALIZE */
  .btn-activate {
    width: 100%; height: 100%;
    background: transparent;
    border: 1px solid #444;
    color: #555;
    font-family: inherit;
    font-size: 0.7em;
    font-weight: bold;
    cursor: pointer;
    transition: 0.2s;
  }
  .btn-activate:hover {
    border-color: var(--neon-color);
    color: var(--neon-color);
    background: rgba(0, 255, 65, 0.05);
    box-shadow: 0 0 5px var(--neon-color);
  }
  .bracket { opacity: 0.5; }

  /* Painel de Controle Ativo */
  .control-panel {
    display: flex;
    width: 100%; height: 100%;
    gap: 4px;
  }

  .btn-digital {
    flex: 1;
    background: #111;
    border: 1px solid var(--neon-color);
    color: var(--neon-color);
    font-weight: bold;
    font-family: inherit;
    font-size: 1.2em;
    cursor: pointer;
    line-height: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .btn-digital:hover {
    background: var(--neon-color);
    color: #000;
  }

  .screen-qty {
    flex: 1.5;
    background: #000;
    border: 1px solid #333;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--neon-color);
    box-shadow: inset 0 0 5px rgba(0,0,0,0.8);
  }
  
  .screen-qty .label { font-size: 0.4em; opacity: 0.7; letter-spacing: 1px; }
  .screen-qty .value { font-size: 1.1em; font-weight: bold; text-shadow: 0 0 2px var(--neon-color); }

  /* --- BOTÃO INFO --- */
  .btn-info {
    position: absolute; top: 0; right: 0;
    width: 20px; height: 20px;
    background: #111;
    border: none;
    border-bottom: 1px solid #333;
    border-left: 1px solid #333;
    color: #666;
    font-size: 0.7em;
    font-weight: bold;
    cursor: pointer;
    z-index: 5;
    display: flex; align-items: center; justify-content: center;
  }
  .btn-info:hover { color: #fff; background: #333; }

  /* --- BACKGROUND GRID --- */
  .bg-grid {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 10px 10px;
    pointer-events: none;
    z-index: 0;
  }
</style>