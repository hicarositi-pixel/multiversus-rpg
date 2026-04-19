<script>
  import { onMount } from 'svelte';
  import { fade, slide, scale } from 'svelte/transition';
  
  // Imports de Lógica Originais
  import ExtraFlawApp from './ExtraFlawApp.js'; 
  import { THEME_DB } from './PowerSheetThemeDB.js'; 
  import { calculateCapacity, CAPACITY_TYPES } from '../data/capacities-data.js';

  export let item;
  export let application;
  // --- CONTROLE DE NOTAS DE SISTEMA ---
    let notesExpanded = false;
    function openNotes() { notesExpanded = true; }
    function closeNotes() { notesExpanded = false; }
  
  // Recebe as flags e o system atualizados do JS
  export let flags = item.flags?.["multiversus-rpg"] || {};
  
  // --- REATIVIDADE CRUCIAL ---
  $: system = item.system || {};

  const isGM = game.user.isGM;
  const MODULE_ID = "multiversus-rpg";

  // --- CONFIGURAÇÕES DE REGRAS ---
  const XP_RULES = { "principal": 8, "secundario": 4, "habilidade": 2 };
  const PB_BASE_VALUES = { "Comum": 2, "Raro": 4, "Lendário": 8, "Mítico": 12, "Universal": 16, "Multiversal": 32 };
  const PB_MULTIPLIERS = { "principal": 1, "secundario": 0.5, "habilidade": 0.25 };
  
  const QUALITY_MODES = [
    {id: 'atk', label: 'ATAQUE'},
    {id: 'def', label: 'DEFESA'},
    {id: 'util', label: 'UTILIDADE'}
  ];

  // TEMA
  $: currentThemeKey = flags.themeKey || "neon-operator";
  $: activeTheme = THEME_DB[currentThemeKey] || THEME_DB["neon-operator"];
  
  // IMAGENS
  $: libraryImg = item.img;
  $: customUrl = flags.customUrl || "";
  $: displayImg = customUrl || libraryImg;

  // DADOS PRINCIPAIS
  $: name = item.name;
  $: qualities = flags.qualities || []; 
  $: rarity = flags.rarity || "Comum";
  $: category = flags.category || "principal";
  $: isInitial = flags.isInitial || false;
  
  // DADOS (DICE)
  $: diceData = flags.dice || {};
  $: diceNormal = diceData.normal || 0;
  $: diceHard = diceData.hard || 0;
  $: diceWiggle = diceData.wiggle || 0;
  $: totalDice = diceNormal + diceHard + diceWiggle;

  // DESCRIÇÃO PADRÃO DO FOUNDRY
  $: description = system.notes || "";

  // UI State
  let activeTab = 'geral';
  let showThemeSelector = false;

  // --- CÁLCULOS AUTOMÁTICOS ---
  $: baseCost = XP_RULES[category] || 8;
  $: rawXpCost = (diceNormal * baseCost) + (diceHard * baseCost * 2) + (diceWiggle * baseCost * 4);
  $: discount = isInitial ? (4 * baseCost) : 0;
  $: xpCost = Math.max(0, rawXpCost - discount);

  $: maxPB = Math.floor((PB_BASE_VALUES[rarity]||2) * (PB_MULTIPLIERS[category]||1));
  
  $: usedPB = qualities.reduce((total, q) => {
    const extrasCost = (q.extras || []).reduce((sum, e) => sum + ((e.cost || 0) * (e.qty || 1)), 0);
    return total + 2 + (q.level || 0) + extrasCost;
  }, 0);

  // --- CONTROLE DE EXPANSÃO DA DESCRIÇÃO (QUALIDADES) ---
    let descExpanded = false;
    let activeDescIndex = -1;

    function openDescNotes(index) {
        activeDescIndex = index;
        descExpanded = true;
    }

    function closeDescNotes() {
        descExpanded = false;
        activeDescIndex = -1;
    }

  // --- FUNÇÕES DE ATUALIZAÇÃO ---
  async function updateFlag(key, value) {
      await item.update({ [`flags.${MODULE_ID}.${key}`]: value });
  }

  async function updateDescription(value) {
      await item.update({ "system.notes": value });
  }

  async function updateDice(type, value) {
      let newDice = { ...diceData }; 
      newDice[type] = parseInt(value) || 0;
      await updateFlag('dice', newDice);
  }

  async function updateCustomUrl() { await updateFlag('customUrl', customUrl); }
  
  function pickLibraryImage() { 
      if (!isGM) return;
      new FilePicker({ 
          type: "image", 
          current: item.img, 
          callback: path => item.update({ img: path }) 
      }).render(true); 
  }
  
  async function setTheme(key) {
    await updateFlag('themeKey', key);
    showThemeSelector = false;
  }

  // --- LÓGICA DE QUALIDADES (Apenas GM) ---
  async function addQuality() {
    const newQ = { 
      name: "Nova Sub-rotina", type: "atk", level: 0, 
      description: "", extras: [], 
      capacities: [{ type: 'mass', nul: 0, booster: 0, collapsed: false }],
      collapsed: false 
    };
    await updateFlag('qualities', [...qualities, newQ]);
  }

  async function removeQuality(index) { 
      const newQs = qualities.filter((_, i) => i !== index);
      await updateFlag('qualities', newQs); 
  }

  async function updateQuality(index, field, value) {
    const newQs = JSON.parse(JSON.stringify(qualities)); 
    newQs[index][field] = value; 
    await updateFlag('qualities', newQs);
  }

  async function addCapacity(qIndex) {
    const newQs = JSON.parse(JSON.stringify(qualities));
    if (!newQs[qIndex].capacities) newQs[qIndex].capacities = [];
    newQs[qIndex].capacities.push({ type: 'mass', nul: 0, booster: 0, collapsed: false }); 
    await updateFlag('qualities', newQs);
  }

  async function removeCapacity(qIndex, cIndex) {
    const newQs = JSON.parse(JSON.stringify(qualities));
    if (newQs[qIndex].capacities && newQs[qIndex].capacities.length > cIndex) {
        newQs[qIndex].capacities.splice(cIndex, 1); 
        await updateFlag('qualities', newQs);
    }
  }

  async function updateCapacity(qIndex, cIndex, field, value) {
    const newQs = JSON.parse(JSON.stringify(qualities));
    if (newQs[qIndex].capacities && newQs[qIndex].capacities[cIndex]) {
        newQs[qIndex].capacities[cIndex][field] = value; 
        await updateFlag('qualities', newQs);
    }
  }

  async function toggleCapCollapse(qIndex, cIndex) {
    const newQs = JSON.parse(JSON.stringify(qualities));
    if (newQs[qIndex].capacities && newQs[qIndex].capacities[cIndex]) {
        newQs[qIndex].capacities[cIndex].collapsed = !newQs[qIndex].capacities[cIndex].collapsed; 
        await updateFlag('qualities', newQs);
    }
  }
  
  function openExtraSelector(index) { 
      new ExtraFlawApp(item, index).render(true); 
  }
</script>

<div class="rpg-sheet-root" style="{Object.entries(activeTheme.vars).map(([k,v]) => `${k}:${v}`).join(';')}">
  
  {#if showThemeSelector}
    <div class="modal-backdrop" on:click|self={() => showThemeSelector = false} transition:fade={{duration:150}}>
      <div class="theme-modal" transition:scale={{start:0.95}}>
        <h3>SELECIONAR TEMA VISUAL</h3>
        <div class="theme-grid">
          {#each Object.entries(THEME_DB) as [key, theme]}
            <button class="theme-btn {currentThemeKey === key ? 'active' : ''}" 
                    style="border-left: 4px solid {theme.vars['--accent']}"
                    on:click={() => setTheme(key)}>
              {theme.label}
            </button>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <header class="sheet-header">
    <div class="profile-section">
      <div class="avatar-frame">
        <img src={displayImg} alt={name} />
        {#if isGM}
            <div class="avatar-overlay" on:click={pickLibraryImage}>a
            <i class="fas fa-edit"></i>
            </div>
        {/if}
      </div>
    </div>

    <div class="info-section">
      <div class="title-row">
        <div class="input-group grow">
          <input type="text" value={name} on:change={(e)=>item.update({name: e.target.value})} placeholder=" "  />
          <label>NOME DO PODER</label>
          <span class="bar"></span>
        </div>
        
        <button class="icon-btn" on:click={() => showThemeSelector = !showThemeSelector} title="Configurar Tema">
          <i class="fas fa-cog"></i>
        </button>

        {#if isGM}
          <button class="icon-btn {isInitial ? 'active-star' : ''}" on:click={() => updateFlag('isInitial', !isInitial)}>
            <i class="fas fa-star"></i>
          </button>
        {/if}
      </div>

      <div class="meta-row">
        <div class="custom-select grow">
          <label>CATEGORIA</label>
          <select value={category} on:change={(e)=>updateFlag('category', e.target.value)} >
            <option value="principal">PRINCIPAL (8xp)</option>
            <option value="secundario">SECUNDÁRIO (4xp)</option>
            <option value="habilidade">HABILIDADE (2xp)</option>
          </select>
          <i class="fas fa-chevron-down arrow"></i>
        </div>

        <div class="custom-select grow">
          <label>RARIDADE</label>
          <select value={rarity} on:change={(e)=>updateFlag('rarity', e.target.value)} >
            {#each Object.keys(PB_BASE_VALUES) as r} <option value={r}>{r.toUpperCase()}</option> {/each}
          </select>
          <i class="fas fa-chevron-down arrow"></i>
        </div>
      </div>
    </div>
  </header>

  <nav class="sheet-nav">
    <button class:active={activeTab === 'geral'} on:click={() => activeTab = 'geral'}>VISÃO GERAL</button>
    {#if isGM}
        <button class:active={activeTab === 'balanceamento'} on:click={() => activeTab = 'balanceamento'}>ENGENHARIA</button>
    {/if}
  </nav>

  <main class="sheet-content custom-scroll">
    
    {#if activeTab === 'geral'}
      <div class="tab-pane" in:fade={{duration:200}}>
        
        <div class="hud-container">
          <div class="hud-card">
            <span class="hud-lbl">CUSTO TOTAL (XP)</span>
            <div class="hud-val accent-text">
              {#if isInitial}<span class="strike">{rawXpCost}</span>{/if} {xpCost}
            </div>
          </div>
          <div class="hud-card">
            <span class="hud-lbl">BALANCEAMENTO (PB)</span>
            <div class="hud-val {usedPB > maxPB ? 'danger-text' : ''}">
              {usedPB} <span class="dim">/ {maxPB}</span>
            </div>
          </div>
        </div>

        <div class="dice-matrix">
          <div class="dice-input normal">
            <input type="number" min="0" value={diceNormal} on:change={(e)=>updateDice('normal', e.target.value)} >
            <span class="lbl">Normal (1x)</span>
          </div>
          <div class="dice-input hard">
            <input type="number" min="0" value={diceHard} on:change={(e)=>updateDice('hard', e.target.value)} >
            <span class="lbl">Fixo (2x)</span>
          </div>
          <div class="dice-input wiggle">
            <input type="number" min="0" value={diceWiggle} on:change={(e)=>updateDice('wiggle', e.target.value)} >
            <span class="lbl">Variavél (4x)</span>
          </div>
        </div>

{#if qualities.length > 0}
            <div class="visual-qualities">
                <div class="editor-label">ESTRUTURA DO PODER</div>
                
                {#each qualities as q}
                    <div class="vq-card">
                        
                        <div class="vq-header">
                            <span class="vq-type {q.type}">{QUALITY_MODES.find(m => m.id === q.type)?.label.charAt(0) || '?'}</span>
                            <span class="vq-name">{q.name}</span>
                            <span class="vq-lvl">Nível {q.level || 0}</span>
                        </div>

                        {#if q.imgUrl}
                            <div class="vq-banner">
                                <img src={q.imgUrl} alt="Efeito Visual de {q.name}">
                            </div>
                        {/if}

                        <div class="vq-body">
                            {#if q.description}
                                <div class="vq-desc-full">
                                    {q.description}
                                </div>
                            {/if}

                            {#if q.capacities && q.capacities.length > 0}
                                <div class="vq-caps">
                                    <span class="vq-sec-title">CAPACIDADES MATRIZ:</span>
                                    <div class="caps-grid">
                                        {#each q.capacities as cap}
                                            <div class="cap-box">
                                                <span class="cap-lbl">{CAPACITY_TYPES.find(t=>t.id === cap.type)?.name || 'Capacidade'}</span>
                                                <span class="cap-val">{calculateCapacity(totalDice, cap.type, cap.nul, cap.booster)}</span>
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            {/if}

                            {#if q.extras && q.extras.length > 0}
                                <div class="vq-tags-container">
                                    <span class="vq-sec-title">MODIFICADORES ATIVOS:</span>
                                    <div class="vq-tags">
                                        {#each q.extras.filter(e => (e.cost * (e.qty || 1)) > 0) as ext}
                                            <span class="pill extra" title={ext.name}>{ext.name} <small>+{ext.cost * (ext.qty || 1)}</small></span>
                                        {/each}
                                        {#each q.extras.filter(e => (e.cost * (e.qty || 1)) <= 0) as flaw}
                                            <span class="pill flaw" title={flaw.name}>{flaw.name} <small>{flaw.cost * (flaw.qty || 1)}</small></span>
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                        </div>

                    </div>
                {/each}
            </div>
        {/if}
<div class="text-editor-container">
          <div class="editor-header">
            <span class="editor-label"><i class="fas fa-terminal"></i> NOTAS DE SISTEMA (WILD TALENTS)</span>
            <button class="btn-expand-notes" on:click={openNotes} title="Expandir Tela">
              <i class="fas fa-expand"></i>
            </button>
          </div>
          <textarea 
            class="cyber-textarea custom-scroll"
            value={description} 
            on:change={(e)=>updateDescription(e.target.value)} 
            placeholder={isGM ? "Descreva mecânicas ocultas, cálculos ou regras específicas do sistema..." : "Nenhuma anotação de sistema disponível."}
            ></textarea>
        </div>

        {#if notesExpanded}
        <div class="notes-overlay" transition:fade={{duration: 150}} on:click={closeNotes}>
            <div class="notes-modal" on:click|stopPropagation>
                <div class="editor-header modal-header">
                    <span class="editor-label"><i class="fas fa-terminal"></i> NOTAS DE SISTEMA (MODO TELA CHEIA)</span>
                    <button class="btn-expand-notes" on:click={closeNotes} title="Minimizar">
                        <i class="fas fa-compress"></i>
                    </button>
                </div>
                <textarea 
                    class="cyber-textarea expanded custom-scroll"
                    value={description} 
                    on:change={(e)=>updateDescription(e.target.value)} 
                    placeholder="Área livre para regras e anotações do mestre..."
                    ></textarea>
            </div>
        </div>
        {/if}
      </div>
    {/if}

    {#if activeTab === 'balanceamento' && isGM}
      <div class="tab-pane" in:fade={{duration:200}}>
        
        <div class="toolbar">
          <div class="status-pill {usedPB > maxPB ? 'danger' : 'success'}">
            <i class="fas fa-circle"></i> {usedPB > maxPB ? 'SOBRECARGA' : 'ESTÁVEL'}
          </div>
          <button class="btn-new" on:click={addQuality}>
            <i class="fas fa-plus"></i> NOVA Qualidade
          </button>
        </div>

<div class="cards-list">
          {#each qualities as q, i}
            <div class="quality-card" transition:slide|local>
              
              <div class="card-header">
                <div class="header-left">
                  <span class="index-badge">#{i+1}</span>
                  <div class="input-inline">
                    <input type="text" value={q.name} on:change={(e)=>updateQuality(i, 'name', e.target.value)} placeholder="Nome..." />
                    <span class="underline"></span>
                  </div>
                </div>

                <div class="header-right">
                  <div class="mini-select">
                    <select value={q.type || 'atk'} on:change={(e)=>updateQuality(i, 'type', e.target.value)}>
                      {#each QUALITY_MODES as mode}
                        <option value={mode.id}>{mode.label}</option>
                      {/each}
                    </select>
                  </div>

                  <div class="lvl-control">
                    <span>NVL</span>
                    <input type="number" value={q.level} on:change={(e)=>updateQuality(i, 'level', +e.target.value)}>
                  </div>

                  <button class="btn-icon delete" on:click={() => removeQuality(i)}><i class="fas fa-times"></i></button>
                </div>
              </div>

<div class="card-body">
                
                <div class="input-inline" style="margin-bottom: 5px;">
                  <input type="text" 
                         style="background: rgba(0,0,0,0.5); border: 1px dashed #444; color: #888; font-size: 11px; padding: 6px; width: 100%; border-radius: 4px;" 
                         value={q.imgUrl || ""} 
                         on:change={(e)=>updateQuality(i, 'imgUrl', e.target.value)} 
                         placeholder="🔗 URL da Imagem ou GIF (Opcional)..." />
                </div>

                <div class="text-editor-container mini">
                  <div class="editor-header" style="display: flex; justify-content: space-between; padding: 5px; background: rgba(0, 212, 255, 0.1); border-bottom: 1px solid rgba(0, 212, 255, 0.3);">
                    <span class="editor-label" style="font-size: 10px; color: #00d4ff;"><i class="fas fa-align-left"></i> EFEITO DA SUB-ROTINA</span>
                    <button class="btn-expand-notes" style="background: none; border: none; color: #00d4ff; cursor: pointer;" on:click={() => openDescNotes(i)} title="Expandir Descrição">
                      <i class="fas fa-expand"></i>
                    </button>
                  </div>
                  <textarea 
                    class="cyber-textarea custom-scroll" 
                    style="width: 100%; min-height: 60px; background: rgba(0,0,0,0.5); border: none; color: #ccc; padding: 8px; resize: none; font-size: 12px; outline: none; box-sizing: border-box;"
                    value={q.description || ""} 
                    on:change={(e)=>updateQuality(i, 'description', e.target.value)} 
                    placeholder="Descrição curta do efeito..."
                  ></textarea>
                </div>
                <div class="caps-list">
                  <div class="caps-header">
                    <span>CAPACIDADES</span>
                    <button class="btn-text" on:click={() => addCapacity(i)}>+ Adicionar</button>
                  </div>

                  {#each (q.capacities || []) as cap, cIndex}
                    {@const capResult = calculateCapacity(totalDice, cap.type, cap.nul, cap.booster)}
                    
                    <div class="cap-row {cap.collapsed ? 'collapsed' : ''}">
                      <div class="cap-main" on:click={() => toggleCapCollapse(i, cIndex)}>
                        <i class="fas fa-chevron-{cap.collapsed ? 'right' : 'down'} chevron"></i>
                        <span class="cap-label">{CAPACITY_TYPES.find(t=>t.id === cap.type)?.name || '...'}</span>
                        
                        <span class="cap-result">{capResult}</span>
                        
                        <button class="btn-icon small" on:click|stopPropagation={() => removeCapacity(i, cIndex)}>×</button>
                      </div>

                      {#if !cap.collapsed}
                        <div class="cap-tools" transition:slide>
                          <div class="custom-select full">
                            <select value={cap.type || 'mass'} on:change={(e) => updateCapacity(i, cIndex, 'type', e.target.value)}>
                                {#each CAPACITY_TYPES as type} <option value={type.id}>{type.name}</option> {/each}
                            </select>
                            <i class="fas fa-caret-down arrow"></i>
                          </div>
                          
                          <div class="steppers">
                            <div class="stepper">
                              <label>Sem Limite (x2)</label>
                              <div class="step-ctrl">
                                <button on:click={() => updateCapacity(i, cIndex, 'nul', Math.max(0, (cap.nul||0)-1))}>-</button>
                                <span>{cap.nul || 0}</span>
                                <button on:click={() => updateCapacity(i, cIndex, 'nul', (cap.nul||0)+1)}>+</button>
                              </div>
                            </div>
                            <div class="stepper">
                              <label>Booster (x10)</label>
                              <div class="step-ctrl">
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
                </div>

                <div class="card-footer">
                  <div class="cost-badge">CUSTO: <strong>{2 + (q.level || 0)} PB</strong></div>
                  <button class="btn-extra" on:click={() => openExtraSelector(i)}>
                    <i class="fas fa-sliders-h"></i> CONFIGURAR EXTRAS
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>

      </div>
    {/if}

  </main>
  {#if descExpanded && activeDescIndex !== -1}
  <div class="notes-overlay" transition:fade={{duration: 150}} on:click={closeDescNotes}>
      <div class="notes-modal" on:click|stopPropagation>
          <div class="editor-header modal-header">
              <span class="editor-label">
                  <i class="fas fa-align-left"></i> 
                  EDITANDO: {qualities[activeDescIndex].name || 'Sub-rotina Sem Nome'}
              </span>
              <button class="btn-expand-notes" on:click={closeDescNotes} title="Concluído">
                  <i class="fas fa-compress"></i>
              </button>
          </div>
          <textarea 
              class="cyber-textarea custom-scroll"
              style="flex: 1; resize: none; font-size: 15px; padding: 25px; background: transparent; color: #ccc; border: none; outline: none; line-height: 1.6;"
              value={qualities[activeDescIndex].description || ""} 
              on:change={(e)=>updateQuality(activeDescIndex, 'description', e.target.value)} 
              placeholder="Área livre para a descrição completa desta sub-rotina..."></textarea>
          
          <button class="btn-new" on:click={closeDescNotes} style="margin: 15px; justify-content: center; flex: none;">CONCLUÍDO</button>
      </div>
  </div>
  {/if}
</div> 

<style>
  @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@400;500;600;700&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

  .rpg-sheet-root { width: 100%; height: 100%; background-color: var(--bg-base); color: var(--text-main); font-family: var(--font); display: flex; flex-direction: column; overflow: hidden; font-size: 13px; transition: background-color 0.3s ease, color 0.3s ease; }
  
  /* SCROLLBAR GERAL */
  .custom-scroll::-webkit-scrollbar { width: 6px; }
  .custom-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
  .custom-scroll::-webkit-scrollbar-thumb { background: var(--accent); border-radius: 3px; }

  /* HEADER & MODAL THEME */
  .modal-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.8); z-index: 50; display: flex; justify-content: center; align-items: center; }
  .theme-modal { background: var(--bg-card); padding: 20px; border-radius: var(--radius); border: 1px solid var(--accent); box-shadow: 0 0 30px rgba(0,0,0,0.5); width: 300px; }
  .theme-modal h3 { margin: 0 0 15px 0; color: var(--accent); text-align: center; border-bottom: 1px solid var(--border); padding-bottom: 10px; }
  .theme-grid { display: flex; flex-direction: column; gap: 8px; }
  .theme-btn { background: rgba(255,255,255,0.05); border: none; padding: 10px; color: #fff; cursor: pointer; text-align: left; transition: 0.2s; font-family: inherit; }
  .theme-btn:hover { background: rgba(255,255,255,0.1); padding-left: 15px; }
  .theme-btn.active { background: var(--accent); color: #000; font-weight: bold; }
  
  .sheet-header { padding: 20px; background: linear-gradient(180deg, rgba(255,255,255,0.03), transparent); display: flex; gap: 20px; border-bottom: 1px solid var(--border); }
  .profile-section { width: 80px; flex-shrink: 0; }
  .avatar-frame { width: 80px; height: 80px; border-radius: var(--radius); overflow: hidden; position: relative; border: 2px solid var(--border); box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
  .avatar-frame img { width: 100%; height: 100%; object-fit: cover; }
  .avatar-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; opacity: 0; transition: 0.2s; cursor: pointer; color: #fff; font-size: 1.5em; }
  .avatar-frame:hover .avatar-overlay { opacity: 1; }
  
  .info-section { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 15px; }
  .title-row { display: flex; gap: 10px; align-items: center; }
  .input-group { position: relative; display: flex; flex-direction: column; }
  .input-group.grow { flex: 1; }
  .input-group input { background: transparent; border: none; font-family: inherit; color: #fff; font-size: 1.5em; font-weight: 700; padding: 5px 0; width: 100%; z-index: 1; }
  .input-group input:focus { outline: none; }
  .input-group input:disabled { color: var(--accent); }
  .input-group label { position: absolute; top: -8px; left: 0; font-size: 0.7em; color: var(--accent); opacity: 0; transition: 0.2s; font-weight: 600; }
  .input-group input:not(:placeholder-shown) + label, .input-group input:focus + label { opacity: 1; top: -12px; }
  .input-group .bar { height: 2px; width: 100%; background: var(--border); position: absolute; bottom: 0; transition: 0.3s; }
  .input-group input:focus ~ .bar { background: var(--accent); box-shadow: 0 0 10px var(--accent); }
  
  .icon-btn { width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--border); background: transparent; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
  .icon-btn:hover { color: #fff; border-color: #fff; }
  .icon-btn.active-star { color: #ffd700; border-color: #ffd700; background: rgba(255, 215, 0, 0.1); box-shadow: 0 0 10px rgba(255, 215, 0, 0.2); }
  
  .meta-row { display: flex; gap: 15px; }
  .custom-select { position: relative; background: var(--bg-card); border-radius: var(--radius); border: 1px solid var(--border); display: flex; flex-direction: column; padding: 2px 10px; transition: 0.2s; }
  .custom-select.grow { flex: 1; }
  .custom-select:hover { border-color: var(--accent); }
  .custom-select label { font-size: 0.65em; color: var(--text-muted); font-weight: 700; margin-bottom: -2px; }
  .custom-select select { background: transparent; border: none; color: #fff; font-family: inherit; font-weight: 600; font-size: 0.95em; cursor: pointer; appearance: none; width: 100%; z-index: 2; padding: 2px 0; }
  .custom-select select:disabled { cursor: default; opacity: 1; -webkit-appearance: none; }
  .custom-select .arrow { position: absolute; right: 10px; top: 50%; transform: translateY(-20%); font-size: 0.8em; color: var(--text-muted); pointer-events: none; }
  
  .sheet-nav { display: flex; padding: 0 20px; border-bottom: 1px solid var(--border); gap: 30px; }
  .sheet-nav button { background: transparent; border: none; padding: 15px 0; color: var(--text-muted); font-family: inherit; font-weight: 700; font-size: 1.1em; cursor: pointer; border-bottom: 3px solid transparent; transition: 0.2s; }
  .sheet-nav button:hover { color: #fff; }
  .sheet-nav button.active { color: var(--accent); border-color: var(--accent); }
  .sheet-content { flex: 1; overflow-y: auto; padding: 20px; position: relative; }
  .tab-pane { display: flex; flex-direction: column; gap: 20px; }
  
  /* HUD E DADOS */
  .hud-container { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
  .hud-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 15px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
  .hud-lbl { display: block; font-size: 0.7em; color: var(--text-muted); letter-spacing: 1px; font-weight: 700; margin-bottom: 5px; }
  .hud-val { font-size: 2em; font-weight: 700; color: #fff; line-height: 1; }
  .accent-text { color: var(--accent); text-shadow: 0 0 15px var(--accent); }
  .danger-text { color: var(--danger); text-shadow: 0 0 15px var(--danger); }
  .strike { text-decoration: line-through; color: var(--text-muted); font-size: 0.5em; margin-right: 5px; }
  .dim { color: var(--text-muted); font-size: 0.5em; }
  
  .dice-matrix { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
  .dice-input { background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: var(--radius); padding: 10px; display: flex; flex-direction: column; align-items: center; position: relative; }
  .dice-input input { width: 100%; background: transparent; border: none; text-align: center; font-size: 1.8em; color: #fff; font-family: inherit; font-weight: 700; }
  .dice-input input:focus { outline: none; }
  .dice-input input:disabled { color: #fff; }
  .dice-input .lbl { font-size: 0.7em; color: var(--text-muted); font-weight: 700; }
  .dice-input.hard input { color: #fbbf24; }
  .dice-input.wiggle input { color: #ef4444; }
  
 /* =========================================
    VISUAL QUALITIES (MODO LEITURA / CODEX)
    ========================================= */
 .visual-qualities { display: flex; flex-direction: column; gap: 20px; margin-top: 15px; }
 
 .vq-card { 
    background: rgba(0,0,0,0.4); 
    border: 1px solid var(--border); 
    border-radius: var(--radius); 
    display: flex; 
    flex-direction: column; 
    overflow: hidden; 
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
 }
 
 /* HEADER */
 .vq-header { 
    display: flex; 
    align-items: center; 
    gap: 12px; 
    padding: 12px 15px; 
    background: rgba(255,255,255,0.03); 
    border-bottom: 1px solid var(--border); 
 }
 .vq-type { font-family: 'Share Tech Mono', monospace; font-size: 16px; font-weight: bold; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 4px; color: #fff; }
 .vq-type.atk { background: #ff3333; box-shadow: 0 0 10px rgba(255, 51, 51, 0.5); }
 .vq-type.def { background: #0088ff; box-shadow: 0 0 10px rgba(0, 136, 255, 0.5); }
 .vq-type.util { background: #ffcc00; box-shadow: 0 0 10px rgba(255, 204, 0, 0.5); }
 .vq-name { font-weight: 700; font-size: 1.2em; flex: 1; color: var(--accent); letter-spacing: 1px; text-transform: uppercase; }
 .vq-lvl { font-size: 0.8em; color: #aaa; background: #000; padding: 4px 10px; border-radius: 12px; font-family: 'Share Tech Mono', monospace; border: 1px solid #333;}

 /* BANNER DE IMAGEM/GIF */
 .vq-banner { width: 100%; height: 120px; background: #000; border-bottom: 1px solid var(--border); overflow: hidden; display: flex; align-items: center; justify-content: center;}
.vq-banner img { width: 100%; height: 100%; object-fit: contain; opacity: 0.8; transition: 0.3s; mix-blend-mode: screen;}
 .vq-card:hover .vq-banner img { opacity: 1; transform: scale(1.05); }

 /* CORPO (DESCRIÇÃO E TAGS) */
 .vq-body { padding: 15px; display: flex; flex-direction: column; gap: 15px; }
 
.vq-desc-full { 
    font-size: 1em; 
    color: #ddd; 
    line-height: 1.6; 
    text-align: justify; 
    padding-left: 10px; 
    border-left: 3px solid var(--accent); 
    font-style: italic;
    white-space: pre-wrap; /* MÁGICA QUE MANTÉM AS QUEBRAS DE LINHA */
 }

 .vq-sec-title { font-size: 0.7em; color: var(--text-muted); font-weight: 700; margin-bottom: 8px; display: block; border-bottom: 1px dashed #333; padding-bottom: 4px; }

 /* CAPACIDADES NO MODO VISUAL */
 .vq-caps { background: rgba(0,0,0,0.2); padding: 10px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.05); }
 .caps-grid { display: flex; flex-wrap: wrap; gap: 10px; }
 .cap-box { display: flex; align-items: center; gap: 8px; background: #000; border: 1px solid #333; padding: 5px 12px; border-radius: 4px; font-family: 'Share Tech Mono', monospace;}
 .cap-lbl { font-size: 11px; color: #888; text-transform: uppercase; }
 .cap-val { font-size: 13px; color: var(--accent); font-weight: bold; }

 /* TAGS DE MODS */
 .vq-tags-container { background: rgba(0,0,0,0.2); padding: 10px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.05); }
 .vq-tags { display: flex; flex-wrap: wrap; gap: 6px; }
 .pill { font-family: 'Share Tech Mono', monospace; font-size: 11px; padding: 4px 10px; border-radius: 4px; border: 1px solid transparent; display: flex; align-items: center; gap: 5px; background: #050505; }
 .pill small { opacity: 0.8; font-weight: bold; }
 .pill.extra { border-color: #00ff41; color: #00ff41; }
 .pill.flaw { border-color: #ff3333; color: #ff3333; }
  /* TEXT EDITOR NATIVO */
 /* --- CONTAINER DE NOTAS DE SISTEMA --- */
    .text-editor-container { 
        background: rgba(0, 0, 0, 0.4); 
        border: 1px solid var(--border, #333); 
        border-radius: var(--radius, 4px); 
        display: flex; 
        flex-direction: column; 
        margin-top: 15px; 
        overflow: hidden;
        box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
    }

    .editor-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(255, 255, 255, 0.05);
        padding: 8px 15px;
        border-bottom: 1px solid var(--border, #333);
    }

    .editor-label {
        font-size: 11px;
        color: var(--c-primary, #00d4ff);
        font-weight: bold;
        letter-spacing: 1px;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .btn-expand-notes {
        background: transparent;
        border: none;
        color: #888;
        cursor: pointer;
        transition: 0.2s;
        font-size: 14px;
        padding: 2px 5px;
    }
    .btn-expand-notes:hover {
        color: var(--c-primary, #fff);
        transform: scale(1.1);
        text-shadow: 0 0 8px var(--c-primary, #fff);
    }

    .cyber-textarea {
        flex: 1;
        background: transparent;
        border: none;
        color: #ccc;
        padding: 15px;
        min-height: 150px;
        resize: none;
        font-family: var(--f-main, 'Share Tech Mono', monospace);
        font-size: 13px;
        line-height: 1.6;
        outline: none;
    }

    /* Adaptação para o card não ficar esticado demais */
    .text-editor-container.mini {
        margin-top: 0;
        margin-bottom: 15px;
        min-height: 100px; /* Menor que a nota de sistema geral */
    }
    
    .text-editor-container.mini .cyber-textarea {
        min-height: 60px;
        padding: 10px;
    }
    .cyber-textarea:focus { background: rgba(0, 212, 255, 0.02); }
    .cyber-textarea:disabled { opacity: 0.6; cursor: not-allowed; }

    /* --- MODO EXPANDIDO (MODAL) --- */
    .notes-overlay {
        position: absolute; /* ou fixed, dependendo de como sua janela do Foundry se comporta */
        inset: 0;
        background: rgba(0, 0, 0, 0.85);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(4px);
    }
    
    .notes-modal {
        width: 85%;
        max-width: 800px;
        height: 80%;
        background: #08080a;
        border: 1px solid var(--c-primary, #00d4ff);
        border-radius: var(--radius, 4px);
        display: flex;
        flex-direction: column;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.9), 0 0 20px rgba(0, 212, 255, 0.1);
        overflow: hidden;
    }

    .notes-modal .modal-header {
        background: rgba(0, 212, 255, 0.1);
        border-bottom: 2px solid var(--c-primary, #00d4ff);
        padding: 12px 20px;
    }

    .cyber-textarea.expanded {
        font-size: 15px; /* Fonte ligeiramente maior no modo leitura */
        padding: 25px;
    }
  .editor-label { font-size: 0.75em; color: var(--accent); font-weight: 700; margin-bottom: 10px; border-bottom: 1px dashed var(--border); padding-bottom: 5px; }
  textarea { background: transparent; border: none; color: var(--text-main); font-family: inherit; font-size: 1em; resize: none; flex: 1; line-height: 1.6; }
  textarea:focus { outline: none; }
  textarea:disabled { color: #ccc; }

  /* ABA ENGENHARIA (MANTIDA) */
  .toolbar { display: flex; justify-content: space-between; align-items: center; }
  .status-pill { font-weight: 700; font-size: 0.8em; padding: 5px 10px; border-radius: 20px; display: flex; align-items: center; gap: 5px; }
  .status-pill.success { background: rgba(0,255,65,0.1); color: var(--accent); border: 1px solid var(--accent); }
  .status-pill.danger { background: rgba(239,68,68,0.1); color: var(--danger); border: 1px solid var(--danger); animation: pulse 1s infinite; }
  .btn-new { background: var(--accent); color: #000; border: none; padding: 8px 15px; border-radius: var(--radius); font-weight: 700; cursor: pointer; font-family: inherit; display: flex; gap: 5px; align-items: center; transition: 0.2s; }
  .btn-new:hover { box-shadow: 0 0 15px var(--accent); transform: translateY(-2px); }
  
  .cards-list { display: flex; flex-direction: column; gap: 15px; margin-top: 15px; }
  .quality-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; transition: 0.2s; }
  .quality-card:hover { border-color: #555; }
  .card-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; background: rgba(255,255,255,0.02); border-bottom: 1px solid var(--border); }
  .header-left { display: flex; align-items: center; gap: 10px; flex: 1; }
  .index-badge { font-size: 0.7em; color: var(--text-muted); font-weight: 700; opacity: 0.5; }
  .input-inline { position: relative; flex: 1; }
  .input-inline input { width: 100%; background: transparent; border: none; color: #fff; font-size: 1.1em; font-weight: 700; font-family: inherit; }
  .input-inline input:focus { outline: none; }
  .input-inline .underline { position: absolute; bottom: 0; left: 0; width: 0; height: 1px; background: var(--accent); transition: 0.3s; }
  .input-inline input:focus + .underline { width: 100%; }
  .header-right { display: flex; align-items: center; gap: 10px; }
  .mini-select select { background: #000; border: 1px solid var(--border); color: #ccc; padding: 2px 5px; border-radius: 4px; font-size: 0.8em; cursor: pointer; }
  .mini-select select:hover { border-color: var(--accent); }
  .lvl-control { display: flex; align-items: center; background: rgba(0,0,0,0.3); border: 1px solid var(--border); border-radius: 4px; padding: 0 5px; }
  .lvl-control span { font-size: 0.6em; color: var(--text-muted); font-weight: 700; margin-right: 5px; }
  .lvl-control input { width: 25px; background: transparent; border: none; color: #fff; text-align: center; font-weight: 700; font-size: 0.9em; }
  .btn-icon.delete { width: 24px; height: 24px; border-radius: 4px; background: transparent; border: 1px solid transparent; color: var(--text-muted); cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
  .btn-icon.delete:hover { background: rgba(239, 68, 68, 0.2); color: var(--danger); border-color: var(--danger); }
  
  .card-body { padding: 15px; display: flex; flex-direction: column; gap: 15px; }
  .mini-desc { width: 100%; background: transparent; border: none; border-bottom: 1px dashed var(--border); color: var(--text-muted); font-family: inherit; resize: none; font-size: 0.9em; }
  .mini-desc:focus { outline: none; border-color: var(--text-main); color: var(--text-main); }
  
  .caps-list { background: rgba(0,0,0,0.2); border-radius: var(--radius); padding: 10px; border: 1px solid rgba(255,255,255,0.05); }
  .caps-header { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.7em; color: var(--text-muted); font-weight: 700; }
  .btn-text { background: none; border: none; color: var(--accent); font-weight: 700; cursor: pointer; font-size: 1em; }
  .btn-text:hover { text-decoration: underline; }
  .cap-row { margin-bottom: 5px; border-radius: 4px; overflow: hidden; background: rgba(255,255,255,0.02); border: 1px solid transparent; transition: 0.2s; }
  .cap-row:hover { border-color: var(--border); }
  .cap-main { display: flex; align-items: center; padding: 6px 10px; cursor: pointer; gap: 10px; }
  .chevron { font-size: 0.7em; color: var(--text-muted); width: 10px; }
  .cap-label { flex: 1; font-weight: 600; font-size: 0.9em; }
  .cap-result { color: var(--accent); font-weight: 700; font-size: 0.9em; margin-right: 10px; }
  .btn-icon.small { width: 18px; height: 18px; font-size: 0.8em; }
  .cap-tools { padding: 10px; background: rgba(0,0,0,0.3); border-top: 1px solid var(--border); }
  .custom-select.full { background: #000; margin-bottom: 10px; }
  
  .steppers { display: flex; gap: 10px; }
  .stepper { flex: 1; background: #000; border: 1px solid var(--border); border-radius: 4px; padding: 5px; display: flex; flex-direction: column; align-items: center; }
  .stepper label { font-size: 0.6em; color: var(--text-muted); margin-bottom: 2px; }
  .step-ctrl { display: flex; width: 100%; align-items: center; }
  .step-ctrl button { width: 20px; background: #222; color: #fff; border: none; cursor: pointer; border-radius: 2px; }
  .step-ctrl button:hover { background: var(--accent); color: #000; }
  .step-ctrl span { flex: 1; text-align: center; font-weight: 700; font-size: 0.9em; }
  
  .card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 5px; }
  .cost-badge { font-size: 0.8em; color: var(--text-muted); }
  .cost-badge strong { color: var(--text-main); }
  .btn-extra { background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: var(--text-main); padding: 5px 10px; border-radius: 4px; font-size: 0.8em; cursor: pointer; transition: 0.2s; }
  .btn-extra:hover { border-color: #fff; }
  
  @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
</style>