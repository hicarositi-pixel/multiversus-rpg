<script>
  import { onMount, onDestroy } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  
  // IMPORTS
  import MATERIALS_DB from './materials.json';
  import { CraftDB } from './CraftDB.js';

  export let actor;
  export let onClose;

  const isGM = game.user.isGM;
  const MODULE_ID = "multiversus-rpg";

  // --- DADOS DO ATOR (Reativos) ---
  $: survivalData = actor.flags?.[MODULE_ID]?.survival_data || {};
  $: pockets = survivalData.pockets || { MATERIA:{}, ORGANISMO:{}, ENERGIA:{}, NUCLEO:{} };
  $: inventory = actor.flags?.[MODULE_ID]?.inventory || [];
  
  // --- DATABASE GLOBAL (HOOK) ---
  let blueprints = [];
  
  // Carrega e Sincroniza Blueprints Globais
  onMount(async () => {
      // Inicializa DB se precisar
      if (isGM) await CraftDB.init();
      
      // Carrega inicial
      blueprints = CraftDB.getBlueprints();

      // Ouve mudanças em tempo real
      const hookId = Hooks.on("updateJournalEntryPage", (doc) => {
          if (doc.parent?.name === CraftDB.DB_NAME) {
              blueprints = CraftDB.getBlueprints();
          }
      });
      return () => Hooks.off("updateJournalEntryPage", hookId);
  });

  // --- NAVEGAÇÃO ---
  let activeTab = 'blueprints'; 

  // --- CONSTANTES ---
  const RARITY_DATA = {
    1: { label: "Comum",       pb: 1,  color: "#9ca3af" },
    2: { label: "Raro",        pb: 2,  color: "#3b82f6" },
    3: { label: "Lendário",    pb: 4,  color: "#f59e0b" },
    4: { label: "Mítico",      pb: 6,  color: "#ef4444" },
    5: { label: "Universal",   pb: 8,  color: "#10b981" },
    6: { label: "Multiversal", pb: 16, color: "#7c3aed" },
    7: { label: "Onipotente",  pb: 32, color: "#ffffff" }
  };

  // =================================================================
  // LÓGICA DO SIMULADOR (DESCOBERTA)
  // =================================================================
  let simSlots = {
      MATERIA: { tier: 1, qty: 0 },
      ENERGIA: { tier: 1, qty: 0 },
      ORGANISMO: { tier: 1, qty: 0 },
      NUCLEO: { tier: 1, qty: 0 }
  };
  
  let simName = "Novo Protótipo";
  let simDiscipline = "Engenharia"; 
  let simType = "Equipamento"; 

  // Resultado Calculado
  let simResult = { pb: 0, extras: 0, flaws: 0, stats: [], rarityId: 1, label: "Comum", color: "#9ca3af" };

  // Recalcula sempre que mudar slots
  $: calculateSimulation(simSlots);

  function calculateSimulation(slots) {
      let totalTier = 0;
      let count = 0;
      
      // 1. Média de Raridade
      for (const [key, data] of Object.entries(slots)) {
          if (data.qty > 0) {
              totalTier += data.tier;
              count++;
          }
      }
      
      const avgTier = count > 0 ? Math.floor(totalTier / count) : 1;
      const rarityInfo = RARITY_DATA[avgTier] || RARITY_DATA[1];

      // 2. Vars de Mecânica
      let instability = 0; // Núcleo
      let power = 0;       // Energia (Extras)
      let volatility = 0;  // Energia (Flaws)
      let bioSustento = 0; // Organismo
      let matHP = 0;       // Matéria
      let matHAR = 0;      // Matéria

      // 3. Leitura dos Dados
      // NÚCLEO: Instabilidade = +PB
      if (slots.NUCLEO.qty > 0) {
          const t = slots.NUCLEO.tier;
          instability = MATERIALS_DB.NUCLEO.tiers[t].instability || t;
      }

      // ENERGIA: Poder (Extras) & Volatilidade (Flaws)
      if (slots.ENERGIA.qty > 0) {
          const t = slots.ENERGIA.tier;
          power = MATERIALS_DB.ENERGIA.tiers[t].power || t;
          volatility = t; // Volatilidade escala com tier
      }

      // ORGANISMO: Sustento & Sede
      if (slots.ORGANISMO.qty > 0) {
          const t = slots.ORGANISMO.tier;
          bioSustento = MATERIALS_DB.ORGANISMO.tiers[t].sustento || t;
      }

      // MATÉRIA: HP & HAR
      if (slots.MATERIA.qty > 0) {
          const t = slots.MATERIA.tier;
          const d = MATERIALS_DB.MATERIA.tiers[t];
          matHP = slots.MATERIA.qty * (d.hp_mod || 1);
          matHAR = d.har || 0;
      }

      // 4. Cálculos Finais e Textos
      const basePB = rarityInfo.pb;
      const finalPB = basePB + instability;
      
      let statsText = [];
      statsText.push(`<b>Base (${rarityInfo.label}):</b> ${basePB} PB`);
      
      if (instability > 0) {
          statsText.push(`<b>Instabilidade:</b> +${instability} PB (Total: ${finalPB})`);
      }
      
      if (power > 0) {
          statsText.push(`<b>Poder:</b> Permite até +${power} em Extras.`);
      }
      
      if (volatility > 0) {
          statsText.push(`<b>Volatilidade:</b> Permite até -${volatility} em Flaws.`);
      }
      
      if (matHP > 0) {
          statsText.push(`<b>Estrutura:</b> ${matHP} HP | ${matHAR} HAR`);
      }
      
      if (bioSustento > 0) {
          statsText.push(`<b>Biológico:</b> Sustento ${bioSustento} | Sede ${bioSustento * 2}`);
      }

      simResult = {
          rarityId: avgTier,
          label: rarityInfo.label,
          color: rarityInfo.color,
          pb: finalPB,
          extras: power,
          flaws: volatility,
          stats: statsText
      };
  }

  async function registerDiscovery() {
      // 1. Validar e Consumir Materiais (Se não for GM)
      if (!isGM) {
          let missing = [];
          for (const [type, data] of Object.entries(simSlots)) {
              if (data.qty > 0) {
                  const current = pockets[type]?.[data.tier] || 0;
                  if (current < data.qty) missing.push(`${type} T${data.tier}`);
              }
          }
          
          if (missing.length > 0) return ui.notifications.warn(`Falta: ${missing.join(', ')}`);

          // Consumir
          let newPockets = JSON.parse(JSON.stringify(pockets));
          for (const [type, data] of Object.entries(simSlots)) {
              if (data.qty > 0) newPockets[type][data.tier] -= data.qty;
          }
          await actor.update({ [`flags.${MODULE_ID}.survival_data.pockets`]: newPockets });
      }

      // 2. Montar HTML da Descrição
      const descHtml = simResult.stats.map(s => `<p>${s}</p>`).join('');
      
      // 3. Criar Item na Ficha (Maleta/Buffer)
      const newItem = {
          id: foundry.utils.randomID(),
          name: simName,
          type: simType,
          rarity: simResult.label,
          img: "icons/svg/item-bag.svg",
          qty: 1,
          w: simType === 'Estrutura' ? 2 : 1,
          h: simType === 'Estrutura' ? 2 : 1,
          stored: false,
          desc: `
              <div style="border-left: 4px solid ${simResult.color}; padding-left: 10px; margin-bottom: 10px;">
                  ${descHtml}
              </div>
              <hr>
              <p><i>Disciplina: ${simDiscipline}</i></p>
          `
      };
      
      await actor.update({ [`flags.${MODULE_ID}.inventory`]: [...inventory, newItem] });

      // 4. Registrar Blueprint Global (DB)
      const newBP = {
          id: foundry.utils.randomID(),
          name: simName,
          discipline: simDiscipline,
          type: simType,
          recipe: JSON.parse(JSON.stringify(simSlots)), // Salva a receita
          result: simResult, // Salva os stats calculados
          desc: descHtml
      };
      
      await CraftDB.addBlueprint(newBP);
      
      ui.notifications.info("Descoberta Registrada! Blueprint salvo globalmente.");
      activeTab = 'blueprints';
  }

  // =================================================================
  // LÓGICA DE BLUEPRINTS (CRAFTING DA LISTA)
  // =================================================================
  let editingBP = null; // ID do BP sendo editado (GM)

  async function craftGlobal(bp) {
      // 1. Checar e Consumir Materiais (Só Player gasta)
      if (!isGM) {
          let newPockets = JSON.parse(JSON.stringify(pockets));
          let missing = [];

          for (const [type, data] of Object.entries(bp.recipe)) {
              if (data.qty > 0) {
                  const has = newPockets[type]?.[data.tier] || 0;
                  if (has < data.qty) missing.push(`${type} T${data.tier}`);
                  else newPockets[type][data.tier] -= data.qty;
              }
          }

          if (missing.length > 0) return ui.notifications.warn(`Faltam: ${missing.join(', ')}`);
          
          // Aplica o gasto
          await actor.update({ [`flags.${MODULE_ID}.survival_data.pockets`]: newPockets });
      }

      // 2. Criar Item no Inventário
      const newItem = {
          id: foundry.utils.randomID(),
          name: bp.name,
          type: bp.type,
          rarity: bp.result.label,
          img: "icons/svg/item-bag.svg",
          qty: 1,
          w: bp.type === 'Estrutura' ? 2 : 1,
          h: bp.type === 'Estrutura' ? 2 : 1,
          stored: false,
          desc: `
              <div style="border-left: 4px solid ${bp.result.color}; padding-left: 10px; margin-bottom: 10px;">
                  ${bp.desc}
              </div>
              <p style="font-size:0.8em; color:#666;">Craftado via Blueprint.</p>
          `
      };

      await actor.update({ [`flags.${MODULE_ID}.inventory`]: [...inventory, newItem] });
      ui.notifications.info(`${bp.name} forjado com sucesso!`);
  }

  // Ações de GM (Global DB)
  async function deleteGlobalBP(id) {
      await CraftDB.deleteBlueprint(id);
  }
  
  async function saveGlobalBPEdit(bp) {
      // Atualiza no banco
      await CraftDB.updateBlueprint(bp);
      editingBP = null;
  }

  // =================================================================
  // REFINARIA (20:1)
  // =================================================================
  let refType = "MATERIA";
  let refTier = 1;
  $: refStock = pockets[refType]?.[refTier] || 0;

  async function doRefine() {
      if (refStock < 20) return ui.notifications.warn("Mínimo 20 unidades.");
      if (refTier >= 6) return ui.notifications.warn("Tier máximo.");

      let newPockets = JSON.parse(JSON.stringify(pockets));
      newPockets[refType][refTier] -= 20;
      newPockets[refType][refTier + 1] = (newPockets[refType][refTier + 1] || 0) + 1;

      await actor.update({ [`flags.${MODULE_ID}.survival_data.pockets`]: newPockets });
      ui.notifications.info("Refino concluído!");
  }

</script>

<div class="crafting-terminal" in:fade>
  
  <header class="terminal-header">
      <div class="title-block">
          <i class="fas fa-microchip"></i>
          <span>SISTEMA DE MANUFATURA GLOBAL</span>
      </div>
      <button class="close-btn" on:click={onClose}>✕</button>
  </header>

  <nav class="terminal-tabs">
      <button class:active={activeTab === 'blueprints'} on:click={() => activeTab = 'blueprints'}>
          <i class="fas fa-database"></i> BLUEPRINTS
      </button>
      <button class:active={activeTab === 'simulator'} on:click={() => activeTab = 'simulator'}>
          <i class="fas fa-flask"></i> DESCOBERTA
      </button>
      <button class:active={activeTab === 'refinery'} on:click={() => activeTab = 'refinery'}>
          <i class="fas fa-filter"></i> REFINARIA
      </button>
  </nav>

  <main class="terminal-body">
      
      {#if activeTab === 'blueprints'}
          <div class="bp-list custom-scroll">
              {#each blueprints as bp}
                  <div class="bp-card" style="border-left-color: {bp.result.color}">
                      {#if editingBP === bp.id}
                          <div class="edit-mode">
                              <input type="text" bind:value={bp.name} placeholder="Nome">
                              <input type="text" bind:value={bp.discipline} placeholder="Disciplina">
                              <div class="edit-actions">
                                  <button on:click={() => saveGlobalBPEdit(bp)}><i class="fas fa-save"></i> Salvar</button>
                              </div>
                          </div>
                      {:else}
                          <div class="bp-info">
                              <div class="bp-header">
                                  <span class="bp-name">{bp.name}</span>
                                  <span class="bp-meta" style="color: {bp.result.color}">
                                      [{bp.result.label}] {bp.type}
                                  </span>
                              </div>
                              
                              <div class="bp-content">
                                  {@html bp.desc}
                              </div>

                              <div class="bp-reqs">
                                  <span>Custo: </span>
                                  {#each Object.entries(bp.recipe) as [type, d]}
                                      {#if d.qty > 0}
                                          <span class="req-item" class:missing={!isGM && (pockets[type]?.[d.tier] || 0) < d.qty}>
                                              {d.qty}x {type} T{d.tier}
                                          </span>
                                      {/if}
                                  {/each}
                              </div>
                          </div>

                          <div class="bp-actions">
                              <button class="craft-btn" on:click={() => craftGlobal(bp)}>
                                  <i class="fas fa-hammer"></i> FORJAR
                              </button>
                              {#if isGM}
                                  <div class="gm-btns">
                                      <button on:click={() => editingBP = bp.id} title="Editar"><i class="fas fa-edit"></i></button>
                                      <button class="del" on:click={() => deleteGlobalBP(bp.id)} title="Excluir"><i class="fas fa-trash"></i></button>
                                  </div>
                              {/if}
                          </div>
                      {/if}
                  </div>
              {/each}
              
              {#if blueprints.length === 0}
                  <div class="empty-state">Banco de dados vazio. Use a aba "Descoberta" para criar novos itens.</div>
              {/if}
          </div>
      {/if}

      {#if activeTab === 'simulator'}
          <div class="simulator-layout">
              <div class="sim-config custom-scroll">
                  <h3>CONFIGURAR PROTÓTIPO</h3>
                  
                  <div class="meta-inputs">
                      <input type="text" bind:value={simName} placeholder="Nome do Artefato">
                      <div class="row">
                          <select bind:value={simType}>
                              <option>Equipamento</option>
                              <option>Estrutura</option>
                              <option>Consumível</option>
                          </select>
                          <select bind:value={simDiscipline}>
                              <option>Engenharia</option>
                              <option>Sintética</option>
                              <option>Sobrevivência</option>
                          </select>
                      </div>
                  </div>

                  <hr>

                  {#each Object.keys(simSlots) as type}
                      <div class="slot-row">
                          <div class="slot-label"><i class={MATERIALS_DB[type].icon}></i> {MATERIALS_DB[type].label}</div>
                          <div class="slot-ctrls">
                              <label>Tier</label>
                              <input type="number" min="1" max="7" bind:value={simSlots[type].tier}>
                              <label>Qtd</label>
                              <input type="number" min="0" bind:value={simSlots[type].qty}>
                          </div>
                          <div class="stock-check">
                              Disp: {pockets[type]?.[simSlots[type].tier] || 0}
                          </div>
                      </div>
                  {/each}
              </div>

              <div class="sim-preview">
                  <h3>ANÁLISE TEÓRICA</h3>
                  
                  <div class="result-box" style="border-color: {simResult.color}">
                      <div class="res-rarity" style="color: {simResult.color}">
                          {simResult.label} (Tier {simResult.rarityId})
                      </div>
                      
                      <div class="res-details">
                          {#each simResult.stats as stat}
                              <div class="stat-line">{@html stat}</div>
                          {/each}
                      </div>
                  </div>

                  <div class="action-area">
                      <button class="register-btn" on:click={registerDiscovery}>
                          <i class="fas fa-save"></i> REGISTRAR DESCOBERTA
                      </button>
                      <p class="help-text">
                          Consome materiais, cria item na mala e salva Blueprint Global.
                      </p>
                  </div>
              </div>
          </div>
      {/if}

      {#if activeTab === 'refinery'}
          <div class="refinery-layout">
              <div class="refine-card">
                  <h3>CONVERSOR MOLECULAR</h3>
                  <div class="refine-grid">
                      <div class="col">
                          <label>TIPO</label>
                          <select bind:value={refType}>
                              {#each Object.keys(simSlots) as t} <option value={t}>{t}</option> {/each}
                          </select>
                      </div>
                      <div class="col">
                          <label>TIER BASE</label>
                          <input type="range" min="1" max="6" bind:value={refTier}>
                          <span class="tier-badge" style="color: {RARITY_DATA[refTier].color}">
                              {RARITY_DATA[refTier].label} (T{refTier})
                          </span>
                      </div>
                  </div>
                  <div class="refine-status">
                      <span>Custo: 20 un.</span>
                      <span class={refStock >= 20 ? 'ok' : 'no'}>Disp: {refStock}</span>
                  </div>
                  <button class="action-btn" disabled={refStock < 20} on:click={doRefine}>
                      REFINAR
                  </button>
              </div>
          </div>
      {/if}

  </main>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@500;700&display=swap');

  .crafting-terminal {
      position: absolute; inset: 0; z-index: 50;
      background: rgba(8, 8, 10, 0.98);
      display: flex; flex-direction: column;
      font-family: 'Rajdhani', sans-serif; color: #ccc;
      border: 1px solid #333;
  }

  /* HEADER */
  .terminal-header {
      background: #050505; border-bottom: 2px solid #00ff41;
      padding: 12px 20px; display: flex; justify-content: space-between; align-items: center;
  }
  .title-block { color: #00ff41; font-weight: bold; font-family: 'Share Tech Mono'; letter-spacing: 2px; }
  .close-btn { background: none; border: none; color: #ff003c; font-size: 1.2em; cursor: pointer; }

  /* TABS */
  .terminal-tabs { display: flex; background: #000; border-bottom: 1px solid #333; }
  .terminal-tabs button {
      flex: 1; background: transparent; border: none; border-right: 1px solid #333;
      color: #666; padding: 12px; cursor: pointer; font-weight: bold; font-family: 'Share Tech Mono';
      transition: 0.2s;
  }
  .terminal-tabs button:hover { color: #fff; background: #111; }
  .terminal-tabs button.active { color: #00ff41; background: #001a00; box-shadow: inset 0 -3px 0 #00ff41; }

  .terminal-body { flex: 1; overflow: hidden; position: relative; }

  /* --- BLUEPRINTS LIST --- */
  .bp-list { height: 100%; padding: 20px; display: flex; flex-direction: column; gap: 10px; overflow-y: auto; }
  .bp-card { 
      background: #111; border: 1px solid #333; border-left-width: 4px; 
      padding: 10px; display: flex; justify-content: space-between; gap: 15px;
  }
  .bp-info { flex: 1; display: flex; flex-direction: column; gap: 5px; }
  .bp-header { display: flex; justify-content: space-between; border-bottom: 1px dashed #333; padding-bottom: 5px; }
  .bp-name { font-weight: bold; color: #fff; font-size: 1.1em; }
  .bp-content { font-size: 0.9em; color: #aaa; line-height: 1.4; margin: 5px 0; }
  .bp-content p { margin: 2px 0; } 
  
  .bp-reqs { font-size: 0.8em; color: #888; margin-top: 5px; }
  .req-item { background: #222; padding: 2px 5px; margin-right: 5px; border-radius: 3px; }
  .req-item.missing { color: #ff003c; font-weight: bold; border: 1px solid #ff003c; }

  .bp-actions { display: flex; flex-direction: column; gap: 5px; justify-content: flex-start; min-width: 100px; }
  .craft-btn { 
      background: #004400; border: 1px solid #00ff41; color: #00ff41; 
      padding: 8px; cursor: pointer; font-weight: bold; font-family: 'Share Tech Mono';
  }
  .craft-btn:hover { background: #00ff41; color: #000; }
  
  .gm-btns { display: flex; gap: 5px; }
  .icon-btn { flex: 1; background: #222; border: 1px solid #444; color: #ccc; padding: 5px; cursor: pointer; }
  .icon-btn.del:hover { background: #ff003c; border-color: #ff003c; }

  /* GM EDIT MODE */
  .edit-mode { width: 100%; display: flex; flex-direction: column; gap: 5px; }
  .edit-mode input, .edit-mode textarea { background: #000; border: 1px solid #444; color: #fff; padding: 5px; }

  /* --- SIMULATOR --- */
  .simulator-layout { display: grid; grid-template-columns: 1fr 1fr; height: 100%; }
  .sim-config { padding: 20px; border-right: 1px solid #333; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; }
  .meta-inputs { display: flex; flex-direction: column; gap: 10px; }
  .meta-inputs input, .meta-inputs select { background: #111; border: 1px solid #444; color: #fff; padding: 8px; }
  .row { display: flex; gap: 10px; } .row select { flex: 1; }

  .slot-row { background: #151515; padding: 10px; border-radius: 4px; display: flex; flex-direction: column; gap: 5px; }
  .slot-label { color: #00ff41; font-weight: bold; font-family: 'Share Tech Mono'; }
  .slot-ctrls { display: flex; align-items: center; gap: 10px; }
  .slot-ctrls input { width: 50px; background: #000; border: 1px solid #333; color: #fff; text-align: center; }
  .stock-check { font-size: 0.8em; color: #666; text-align: right; }

  .sim-preview { padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 20px; }
  .result-box { width: 100%; border: 2px solid #fff; background: #050505; padding: 20px; text-align: left; }
  .res-rarity { font-size: 1.2em; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; text-align: center; }
  .stat-line { margin-bottom: 4px; font-size: 0.95em; color: #ccc; border-bottom: 1px dashed #222; padding-bottom: 2px; }

  .register-btn { 
      background: #004400; border: 1px solid #00ff41; color: #00ff41; 
      padding: 15px 30px; font-weight: bold; font-size: 1.1em; cursor: pointer; letter-spacing: 1px; width: 100%;
  }
  .register-btn:hover { box-shadow: 0 0 20px #00ff41; color: #fff; }
  .help-text { font-size: 0.8em; color: #555; font-style: italic; text-align: center; }

  /* --- REFINERY --- */
  .refinery-layout { display: flex; justify-content: center; align-items: center; height: 100%; }
  .refine-card { width: 300px; background: #111; padding: 20px; border: 1px solid #444; text-align: center; }
  .refine-grid { margin: 20px 0; display: flex; flex-direction: column; gap: 10px; }
  .refine-grid .col { display: flex; flex-direction: column; gap: 5px; text-align: left; }
  .refine-grid select, .refine-grid input { background: #000; border: 1px solid #333; color: #fff; padding: 5px; }
  .refine-status { margin-bottom: 20px; font-size: 0.9em; display: flex; justify-content: space-between; }
  .ok { color: #00ff41; } .no { color: #ff003c; }
  .action-btn { background: #222; border: 1px solid #fff; color: #fff; padding: 10px; width: 100%; cursor: pointer; font-weight: bold; }
  .action-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .action-btn:hover:not(:disabled) { background: #fff; color: #000; }

  .custom-scroll::-webkit-scrollbar { width: 6px; }
  .custom-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
  .empty-state { padding: 40px; text-align: center; color: #666; font-style: italic; }
</style>