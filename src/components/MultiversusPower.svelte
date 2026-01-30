<script>
  import ExtraFlawApp from './ExtraFlawApp.js';
  import { calculateCapacity, CAPACITY_TYPES } from '../data/capacities-data.js';

  export let item;
  export let application;

  // --- ACESSO AO JOGO (Para verificar GM) ---
  const isGM = game.user.isGM;

  // --- CONFIGURAÇÕES ---
  const XP_RULES = { "principal": 8, "secundario": 4, "habilidade": 2 };
  const PB_BASE_VALUES = { "Comum": 2, "Raro": 4, "Lendário": 8, "Mítico": 12, "Universal": 16, "Multiversal": 32 };
  const PB_MULTIPLIERS = { "principal": 1, "secundario": 0.5, "habilidade": 0.25 };
  const RARITY_COLORS = { "Comum": "#b0b0b0", "Raro": "#00bfff", "Lendário": "#ffa500", "Mítico": "#ff4500", "Universal": "#e0e0e0", "Multiversal": "#d000ff" };

  // --- REATIVIDADE ---
  $: system = item.system || {};
  $: flags = item.flags?.["multiversus-rpg"] || {};
  
  // Imagens: Foundry (Library) vs Custom (URL)
  $: libraryImg = item.img;
  $: customUrl = flags.customUrl || "";
  $: displayImg = customUrl || libraryImg; // Prioriza URL na ficha

  $: qualities = system.qualities || [];
  $: name = item.name;
  
  // FLAGS
  $: rarity = flags.rarity || "Comum";
  $: category = flags.category || "principal";
  $: isInitial = flags.isInitial || false;
  
  $: diceNormal = system.dice?.normal || 0;
  $: diceHard = system.dice?.hard || 0;
  $: diceWiggle = system.dice?.wiggle || 0;
  $: totalDice = diceNormal + diceHard + diceWiggle;

  $: description = system.notes || "";
  let activeTab = 'geral';

  // --- CÁLCULOS ---
  $: baseCost = XP_RULES[category] || 8;
  $: rawXpCost = (diceNormal * baseCost) + (diceHard * baseCost * 2) + (diceWiggle * baseCost * 4);
  $: discount = isInitial ? (4 * baseCost) : 0;
  $: xpCost = Math.max(0, rawXpCost - discount);

  $: maxPB = Math.floor((PB_BASE_VALUES[rarity]||2) * (PB_MULTIPLIERS[category]||1));
  $: usedPB = qualities.reduce((total, q) => {
    const extrasCost = (q.extras || []).reduce((sum, e) => {
      const qty = e.qty || 1; 
      return sum + ((e.cost || 0) * qty);
    }, 0);
    return total + 2 + (q.level || 0) + extrasCost;
  }, 0);

  $: themeColor = item.actor?.flags?.themeColor || RARITY_COLORS[rarity] || "#00ff41";

  // --- FUNÇÕES DE IMAGEM ---
  
  // 1. Atualiza a URL customizada (Apenas visual da ficha)
  async function updateCustomUrl() {
    await item.update({'flags.multiversus-rpg.customUrl': customUrl});
  }

  // 2. Abre o FilePicker do Foundry (Imagem do Item na Biblioteca)
  function pickLibraryImage() {
    new FilePicker({
      type: "image",
      current: item.img,
      callback: path => item.update({ img: path })
    }).render(true);
  }

  // --- GERENCIAMENTO ---
  function roll() { item.roll(); }

  async function addQuality() {
    const newQ = { 
      name: "NOVA SUB-ROTINA", 
      level: 0, 
      description: "", 
      extras: [],
      capacities: [{ type: 'mass', nul: 0, booster: 0, collapsed: false }] 
    };
    await item.update({ "system.qualities": [...qualities, newQ] });
  }

  async function removeQuality(index) {
    const newQ = qualities.filter((_, i) => i !== index);
    await item.update({ "system.qualities": newQ });
  }

  async function updateQuality(index, field, value) {
    const newQ = [...qualities];
    newQ[index][field] = value;
    await item.update({ "system.qualities": newQ });
  }

  async function addCapacity(qIndex) {
    const newQ = [...qualities];
    if (!newQ[qIndex].capacities) newQ[qIndex].capacities = [];
    newQ[qIndex].capacities.push({ type: 'mass', nul: 0, booster: 0, collapsed: false });
    await item.update({ "system.qualities": newQ });
  }

  async function removeCapacity(qIndex, cIndex) {
    const newQ = [...qualities];
    newQ[qIndex].capacities.splice(cIndex, 1);
    await item.update({ "system.qualities": newQ });
  }

  async function updateCapacity(qIndex, cIndex, field, value) {
    const newQ = [...qualities];
    newQ[qIndex].capacities[cIndex][field] = value;
    await item.update({ "system.qualities": newQ });
  }

  async function toggleCapCollapse(qIndex, cIndex) {
    const newQ = [...qualities];
    newQ[qIndex].capacities[cIndex].collapsed = !newQ[qIndex].capacities[cIndex].collapsed;
    await item.update({ "system.qualities": newQ });
  }

  function openExtraSelector(index) {
    new ExtraFlawApp(item, index).render(true);
  }
</script>

<div class="terminal-frame" style="--c-primary: {themeColor}">
  <div class="scanlines"></div>
  
  <header class="header-grid">
    
    <div class="image-module">
      <div class="image-wrapper">
        <img src={displayImg} alt={name} class="display-img" />
        <button class="btn-library-picker" on:click={pickLibraryImage} title="Alterar Ícone da Biblioteca (FilePicker)">
          <i class="fas fa-folder-open"></i>
        </button>
      </div>
      <input type="text" bind:value={customUrl} on:change={updateCustomUrl} class="url-input" placeholder="HTTPS://IMG-URL..." />
    </div>

    <div class="main-data-module">
      <div class="title-bar">
        <span class="prompt">&gt;</span>
        <input type="text" value={name} on:change={(e)=>item.update({name: e.target.value})} class="input-name" placeholder="NOME DO ARQUIVO..."/>
        
        {#if isGM}
          <button 
            class="btn-gm-initial {isInitial ? 'active' : ''}" 
            on:click={() => item.update({'flags.multiversus-rpg.isInitial': !isInitial})}
            title="[GM ONLY] Define como Poder Inicial (Desconto de XP)"
          >
            <i class="fas fa-star"></i> INIT_PWR
          </button>
        {/if}
      </div>

      <div class="meta-grid">
        <div class="meta-field">
          <label>CLASSE</label>
          <select value={category} on:change={(e)=>item.update({'flags.multiversus-rpg.category': e.target.value})}>
            <option value="principal">PRINCIPAL [8xp]</option>
            <option value="secundario">SECUNDÁRIO [4xp]</option>
            <option value="habilidade">HABILIDADE [2xp]</option>
          </select>
        </div>
        <div class="meta-field">
          <label>RARIDADE</label>
          <select value={rarity} on:change={(e)=>item.update({'flags.multiversus-rpg.rarity': e.target.value})} class="rarity-hl">
            {#each Object.keys(PB_BASE_VALUES) as r} <option value={r}>{r.toUpperCase()}</option> {/each}
          </select>
        </div>
      </div>
    </div>
  </header>

  <nav class="nav-terminal">
    <button class:active={activeTab === 'geral'} on:click={() => activeTab = 'geral'}>
      [1] DADOS_GERAIS
    </button>
    <button class:active={activeTab === 'balanceamento'} on:click={() => activeTab = 'balanceamento'}>
      [2] MATRIZ_BALANCEAMENTO
    </button>
  </nav>

  <div class="viewport">
    
    {#if activeTab === 'geral'}
      <div class="pane fade-in">
        
        <div class="hud-grid">
          <div class="hud-box">
            <span class="hud-label">CUSTO_XP</span>
            <div class="hud-value xp">
              {#if isInitial}<span class="strike">{rawXpCost}</span> <i class="fas fa-chevron-right"></i>{/if}
              {xpCost}
            </div>
          </div>
          <div class="hud-box">
            <span class="hud-label">BALANCEAMENTO (PB)</span>
            <div class="hud-value pb" class:warning={usedPB > maxPB}>
              {usedPB} <span class="sep">/</span> {maxPB}
            </div>
          </div>
        </div>

        <div class="dice-module">
          <div class="dice-slot normal">
            <input type="number" value={diceNormal} on:change={(e)=>item.update({'system.dice.normal': +e.target.value})}>
            <label>NORMAL</label>
          </div>
          <div class="dice-slot hard">
            <input type="number" value={diceHard} on:change={(e)=>item.update({'system.dice.hard': +e.target.value})}>
            <label>HARD</label>
          </div>
          <div class="dice-slot wiggle">
            <input type="number" value={diceWiggle} on:change={(e)=>item.update({'system.dice.wiggle': +e.target.value})}>
            <label>WIGGLE</label>
          </div>
        </div>

        <div class="terminal-text">
          <div class="term-head">DESCRIÇÃO.LOG</div>
          <textarea value={description} on:change={(e)=>item.update({'system.notes': e.target.value})} placeholder="Insira dados descritivos..."></textarea>
        </div>
      </div>
    {/if}

    {#if activeTab === 'balanceamento'}
      <div class="pane fade-in">
        <div class="tools-bar">
          <span class="pb-status" class:blink={usedPB > maxPB}>STATUS: {usedPB > maxPB ? 'SOBRECARGA' : 'ESTÁVEL'} [{usedPB}/{maxPB}]</span>
          <button class="btn-add-module" on:click={addQuality}>+ ADD_SUBROTINA</button>
        </div>

        <div class="modules-container">
          {#each qualities as q, i}
            <div class="data-module">
              <div class="dm-header">
                <span class="dm-id">#{i+1}</span>
                <input type="text" class="dm-name" value={q.name} on:change={(e)=>updateQuality(i, 'name', e.target.value)} placeholder="NOME_MODULO">
                <div class="dm-lvl">
                  <label>LVL</label>
                  <input type="number" value={q.level} on:change={(e)=>updateQuality(i, 'level', +e.target.value)}>
                </div>
                <button class="btn-kill" on:click={() => removeQuality(i)} title="Deletar Módulo">X</button>
              </div>

              <textarea class="dm-desc" on:change={(e)=>updateQuality(i, 'description', e.target.value)} placeholder="Parâmetros de funcionamento...">{q.description || ""}</textarea>

              <div class="cap-grid-frame">
                <div class="cg-title">
                  CAPACIDADES
                  <button class="btn-tiny-add" on:click={() => addCapacity(i)}>+</button>
                </div>

                {#if q.capacities && q.capacities.length > 0}
                  {#each q.capacities as cap, cIndex}
                    {@const capResult = calculateCapacity(totalDice, cap.type, cap.nul, cap.booster)}
                    
                    <div class="cap-row {cap.collapsed ? 'minimized' : ''}">
                      <div class="cap-bar" on:click={() => toggleCapCollapse(i, cIndex)}>
                        <i class="fas fa-caret-{cap.collapsed ? 'right' : 'down'} icon"></i>
                        <span class="cap-type">{CAPACITY_TYPES.find(t=>t.id === cap.type)?.name.split(' ')[0] || 'DATA'}</span>
                        <span class="cap-result">>> {capResult}</span>
                        <button class="btn-kill-tiny" on:click|stopPropagation={() => removeCapacity(i, cIndex)}>x</button>
                      </div>

                      {#if !cap.collapsed}
                        <div class="cap-details">
                          <select class="cyber-select" value={cap.type || 'mass'} on:change={(e) => updateCapacity(i, cIndex, 'type', e.target.value)}>
                             {#each CAPACITY_TYPES as type} <option value={type.id}>{type.name}</option> {/each}
                          </select>
                          
                          <div class="cap-mods">
                            <div class="mod-unit">
                              <label>NO_LIMIT (x2)</label>
                              <div class="cyber-stepper">
                                <button on:click={() => updateCapacity(i, cIndex, 'nul', Math.max(0, (cap.nul||0)-1))}>-</button>
                                <span>{cap.nul || 0}</span>
                                <button on:click={() => updateCapacity(i, cIndex, 'nul', (cap.nul||0)+1)}>+</button>
                              </div>
                            </div>
                            <div class="mod-unit">
                              <label>BOOSTER (x10)</label>
                              <div class="cyber-stepper">
                                <button on:click={() => updateCapacity(i, cIndex, 'booster', Math.max(0, (cap.booster||0)-1))}>-</button>
                                <span>{cap.booster || 0}</span>
                                <button on:click={() => updateCapacity(i, cIndex, 'booster', (cap.booster||0)+1)}>+</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      {/if}
                    </div>
                  {/each}
                {:else}
                  <div class="empty-slot" on:click={() => addCapacity(i)}>SLOT VAZIO - CLIQUE PARA INICIAR</div>
                {/if}
              </div>

              <div class="dm-footer">
                <span class="dm-cost">CUSTO: <span class="hl">{2 + (q.level || 0)} PB + EXTRAS</span></span>
                <button class="btn-config" on:click={() => openExtraSelector(i)}>
                  CONFIGURAR EXTRAS
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  /* --- CYBERPUNK THEME VARIABLES --- */
  .terminal-frame {
    --bg-dark: #050505;
    --bg-panel: #0a0a0a;
    --border-color: #333;
    --text-primary: #eee;
    --text-dim: #666;
    --font-mono: 'Courier New', Courier, monospace;
    
    background-color: var(--bg-dark);
    color: var(--text-primary);
    font-family: var(--font-mono);
    height: 100%;
    display: flex; flex-direction: column;
    padding: 15px;
    gap: 15px;
    border: 1px solid var(--c-primary);
    box-shadow: 0 0 15px rgba(0,0,0,0.8) inset;
    position: relative;
    overflow: hidden;
  }

  /* Scanlines Effect */
  .scanlines {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
    background-size: 100% 2px, 3px 100%;
    pointer-events: none; z-index: 0;
  }

  /* --- HEADER --- */
  .header-grid { display: flex; gap: 15px; position: relative; z-index: 1; }
  
  /* Image Module */
  .image-module { display: flex; flex-direction: column; gap: 5px; width: 80px; }
  .image-wrapper { position: relative; width: 80px; height: 80px; border: 2px solid var(--c-primary); border-radius: 4px; padding: 2px; }
  .display-img { width: 100%; height: 100%; object-fit: cover; background: #000; }
  
  .btn-library-picker {
    position: absolute; bottom: -5px; right: -5px;
    background: #111; color: var(--c-primary); border: 1px solid var(--c-primary);
    width: 24px; height: 24px; border-radius: 50%;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    font-size: 0.8em; z-index: 10;
  }
  .btn-library-picker:hover { background: var(--c-primary); color: #000; }
  
  .url-input { 
    background: transparent; border: none; border-bottom: 1px solid #333; 
    color: var(--text-dim); font-size: 9px; text-align: center; font-family: inherit; 
  }
  .url-input:focus { border-color: var(--c-primary); outline: none; color: var(--c-primary); }

  /* Main Data */
  .main-data-module { flex: 1; display: flex; flex-direction: column; gap: 10px; justify-content: center; }
  
  .title-bar { display: flex; align-items: center; gap: 8px; border-bottom: 2px solid #222; padding-bottom: 5px; }
  .prompt { color: var(--c-primary); font-weight: bold; }
  .input-name { 
    flex: 1; background: transparent; border: none; 
    font-family: var(--font-mono); font-size: 1.6em; color: #fff; font-weight: bold; text-transform: uppercase; 
  }
  .input-name:focus { outline: none; text-shadow: 0 0 5px var(--c-primary); }

  /* GM Button */
  .btn-gm-initial {
    background: #111; border: 1px solid #444; color: #444; padding: 4px 8px;
    font-size: 0.7em; cursor: pointer; display: flex; align-items: center; gap: 5px;
    border-radius: 2px;
  }
  .btn-gm-initial.active { border-color: var(--c-primary); color: var(--c-primary); background: rgba(0,0,0,0.5); box-shadow: 0 0 5px var(--c-primary); }

  .meta-grid { display: flex; gap: 10px; }
  .meta-field { flex: 1; display: flex; flex-direction: column; }
  .meta-field label { font-size: 0.6em; color: var(--text-dim); letter-spacing: 2px; margin-bottom: 2px; }
  select { 
    background: #000; color: #eee; border: 1px solid #333; 
    padding: 4px; font-family: var(--font-mono); font-size: 0.9em; 
  }
  .rarity-hl { color: var(--c-primary); border-color: var(--c-primary); }

  /* --- NAVIGATION --- */
  .nav-terminal { display: flex; border-bottom: 1px solid #333; margin-bottom: 10px; position: relative; z-index: 1; }
  .nav-terminal button {
    flex: 1; background: transparent; border: none; color: #555;
    padding: 10px; font-family: var(--font-mono); font-weight: bold; cursor: pointer;
    transition: 0.2s; border-bottom: 2px solid transparent;
  }
  .nav-terminal button:hover { color: #aaa; background: rgba(255,255,255,0.02); }
  .nav-terminal button.active { color: var(--c-primary); border-color: var(--c-primary); text-shadow: 0 0 3px var(--c-primary); }

  /* --- VIEWPORT --- */
  .viewport { flex: 1; overflow: hidden; position: relative; z-index: 1; }
  .pane { height: 100%; display: flex; flex-direction: column; gap: 15px; overflow-y: auto; padding-right: 5px; }

  /* HUD Metrics */
  .hud-grid { display: flex; gap: 10px; }
  .hud-box { 
    flex: 1; background: rgba(0,0,0,0.3); border: 1px solid #333; 
    padding: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; 
  }
  .hud-label { font-size: 0.6em; color: #555; letter-spacing: 2px; margin-bottom: 5px; }
  .hud-value { font-size: 1.8em; font-weight: bold; }
  .hud-value.xp { color: var(--c-primary); text-shadow: 0 0 5px var(--c-primary); }
  .hud-value.pb.warning { color: #ff003c; text-shadow: 0 0 5px #ff003c; animation: blink 2s infinite; }
  .strike { text-decoration: line-through; color: #444; font-size: 0.6em; margin-right: 5px; }
  .sep { color: #444; font-size: 0.5em; vertical-align: middle; }

  /* Dice Module */
  .dice-module { display: flex; gap: 10px; background: #080808; padding: 10px; border: 1px solid #222; }
  .dice-slot { flex: 1; position: relative; }
  .dice-slot input { 
    width: 100%; background: #000; border: 1px solid #333; color: #fff; 
    text-align: center; font-size: 1.4em; padding: 10px 0; font-family: var(--font-mono); 
  }
  .dice-slot input:focus { border-color: var(--c-primary); outline: none; }
  .dice-slot label { position: absolute; bottom: -5px; left: 0; width: 100%; text-align: center; background: #080808; color: #555; font-size: 0.6em; }
  .dice-slot.hard input { color: #ffca28; border-color: #ffca28; }
  .dice-slot.wiggle input { color: #ff5252; border-color: #ff5252; }

  /* Terminal Text */
  .terminal-text { flex: 1; display: flex; flex-direction: column; border: 1px solid #333; background: #000; }
  .term-head { background: #111; color: #555; padding: 4px; font-size: 0.7em; border-bottom: 1px solid #333; }
  .terminal-text textarea { flex: 1; background: transparent; color: #ccc; border: none; padding: 10px; font-family: var(--font-mono); resize: none; }
  .terminal-text textarea:focus { outline: none; }

  /* --- BALANCE TOOLS --- */
  .tools-bar { display: flex; justify-content: space-between; align-items: center; }
  .pb-status { font-size: 0.8em; color: #555; }
  .pb-status.blink { color: #ff003c; animation: blink 1s infinite; }
  .btn-add-module { 
    background: transparent; border: 1px solid var(--c-primary); color: var(--c-primary); 
    padding: 6px 12px; cursor: pointer; font-family: var(--font-mono); font-size: 0.8em; 
    transition: 0.2s; 
  }
  .btn-add-module:hover { background: var(--c-primary); color: #000; box-shadow: 0 0 10px var(--c-primary); }

  /* Data Modules (Quality) */
  .modules-container { display: flex; flex-direction: column; gap: 15px; padding-bottom: 20px; }
  .data-module { 
    background: #0a0a0a; border: 1px solid #333; padding: 10px; 
    display: flex; flex-direction: column; gap: 10px; position: relative; 
  }
  .data-module:hover { border-color: #555; }
  .data-module::before { 
    content: ''; position: absolute; top: 0; left: 0; width: 10px; height: 10px; 
    border-top: 2px solid var(--c-primary); border-left: 2px solid var(--c-primary); 
  }

  .dm-header { display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #222; padding-bottom: 5px; }
  .dm-id { color: #444; font-size: 0.8em; }
  .dm-name { flex: 1; background: transparent; border: none; color: var(--c-primary); font-weight: bold; font-family: var(--font-mono); font-size: 1.1em; }
  .dm-name:focus { outline: none; text-decoration: underline; }
  .dm-lvl { display: flex; align-items: center; gap: 5px; background: #000; border: 1px solid #333; padding: 2px 6px; }
  .dm-lvl label { font-size: 0.6em; color: #555; }
  .dm-lvl input { width: 30px; background: transparent; border: none; color: #fff; text-align: center; }
  .btn-kill { background: #111; color: #555; border: 1px solid #333; width: 24px; cursor: pointer; }
  .btn-kill:hover { color: #ff003c; border-color: #ff003c; }

  .dm-desc { background: #050505; border: 1px solid #222; color: #888; padding: 8px; font-family: var(--font-mono); font-size: 0.8em; min-height: 40px; resize: vertical; }

  /* Capacity Grid */
  .cap-grid-frame { border: 1px dashed #333; padding: 5px; background: rgba(255,255,255,0.01); }
  .cg-title { font-size: 0.7em; color: #555; margin-bottom: 5px; display: flex; justify-content: space-between; }
  .btn-tiny-add { background: #222; color: #aaa; border: none; cursor: pointer; padding: 0 6px; }
  .btn-tiny-add:hover { color: #fff; background: #444; }

  .cap-row { border: 1px solid #222; margin-bottom: 5px; background: #000; }
  .cap-bar { display: flex; align-items: center; padding: 4px; cursor: pointer; gap: 8px; }
  .cap-bar:hover { background: #111; }
  .cap-type { color: #aaa; font-size: 0.8em; width: 50px; }
  .cap-result { color: var(--c-primary); font-weight: bold; font-size: 0.85em; flex: 1; }
  .btn-kill-tiny { background: transparent; border: none; color: #444; cursor: pointer; }
  .btn-kill-tiny:hover { color: #ff003c; }
  
  .cap-details { padding: 8px; border-top: 1px solid #222; animation: slideDown 0.2s; }
  .cyber-select { width: 100%; margin-bottom: 8px; background: #111; color: #ccc; border: 1px solid #333; }
  
  .cap-mods { display: flex; gap: 10px; }
  .mod-unit { flex: 1; display: flex; flex-direction: column; gap: 2px; }
  .mod-unit label { font-size: 0.6em; color: #555; }
  .cyber-stepper { display: flex; background: #111; border: 1px solid #333; }
  .cyber-stepper button { width: 20px; background: #222; color: #fff; border: none; cursor: pointer; }
  .cyber-stepper button:hover { background: var(--c-primary); color: #000; }
  .cyber-stepper span { flex: 1; text-align: center; color: #fff; font-size: 0.9em; }

  .empty-slot { text-align: center; font-size: 0.7em; color: #444; padding: 10px; cursor: pointer; }
  .empty-slot:hover { color: var(--c-primary); }

  .dm-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
  .dm-cost { font-size: 0.8em; color: #666; }
  .hl { color: var(--c-primary); }
  .btn-config { background: #111; color: #aaa; border: 1px solid #333; padding: 4px 10px; font-family: var(--font-mono); cursor: pointer; font-size: 0.8em; }
  .btn-config:hover { border-color: var(--c-primary); color: var(--c-primary); }

  @keyframes blink { 50% { opacity: 0.5; } }
  @keyframes slideDown { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
  .fade-in { animation: slideDown 0.3s ease-out; }
</style>