<script>
  import { onMount, tick } from 'svelte';
  import { slide, fade } from 'svelte/transition';
  import PowerInventoryCard from '../components/PowerInventoryCard.svelte';
  import PoderesManager from './PoderesManager.js'; 

  export let actor;
  export let themeColor;
  export let flags = {}; 

  const isGM = game.user.isGM;
  const MODULE_ID = "multiversus-rpg";

  // --- DADOS REATIVOS ---
  let searchTerm = "";
  let powers = [];
  let calculatedTotalCost = 0;
  let activePowerCount = 0;

  // --- CONTROLE DE ATUALIZAÇÃO (DEBOUNCE) ---
  let updateTimer = null;

  function scheduleRefresh() {
      if (updateTimer) clearTimeout(updateTimer);
      // 100ms é o tempo ideal para o banco de dados do Foundry processar a criação do item
      updateTimer = setTimeout(() => {
          refreshData();
      }, 100); 
  }

  // --- FUNÇÃO DE BUSCA E CÁLCULO (BLINDADA) ---
  async function refreshData() {
    // 1. BUSCA O ATOR "REAL" ATUALIZADO
    // Isso é crucial. A prop 'actor' pode ficar desatualizada.
    const realActor = game.actors.get(actor.id);
    
    if (!realActor) return; // Segurança caso o ator tenha sido deletado

    // 2. Filtra itens usando a FONTE ATUALIZADA
    // Forçamos a criação de um novo array [...] para o Svelte detectar mudança
    const rawPowers = realActor.items.filter(i => i && i.type === "power");
    
    // 3. Atualiza a lista visual
    powers = [...rawPowers].sort((a, b) => a.name.localeCompare(b.name));
    activePowerCount = powers.length;

    // 4. Recalcula XP (Lógica mantida)
    const XP_RULES = { "principal": 8, "secundario": 4, "habilidade": 2 };
    
    calculatedTotalCost = powers.reduce((acc, item) => {
        const itemFlags = item.flags?.[MODULE_ID] || {};
        const itemSystem = item.system || {}; 

        const cat = itemFlags.category || "principal";
        const base = XP_RULES[cat] || 8;
        
        const isInitial = itemFlags.isInitial || false;
        const discount = isInitial ? (4 * base) : 0;
        
        const diceData = itemFlags.dice || itemSystem.dice || {};
        const dN = Number(diceData.normal) || 0;
        const dH = Number(diceData.hard) || 0;
        const dW = Number(diceData.wiggle) || 0;
        
        const cost = (dN * base) + (dH * base * 2) + (dW * base * 4);
        return acc + Math.max(0, cost - discount);
    }, 0);

    // 5. Salva no Ator se mudou (Render False para não piscar a ficha inteira)
    const currentSavedCost = Number(realActor.flags?.[MODULE_ID]?.powersSpent) || 0;

    if (calculatedTotalCost !== currentSavedCost) {
        await realActor.update({ 
            [`flags.${MODULE_ID}.powersSpent`]: calculatedTotalCost 
        }, { render: false });
        console.log(`[Nexus] XP Sincronizado: ${calculatedTotalCost}`);
    }
    
    await tick(); // Força atualização do DOM
  }

  // --- HOOKS ---
  onMount(() => {
    refreshData(); 

    // Hook unificado para qualquer mudança em itens deste ator
    // Isso cobre: Criar, Deletar, Editar (Nome, Dados)
    const hookId = Hooks.on("updateActor", (doc) => {
        if (doc.id === actor.id) scheduleRefresh();
    });
    
    const hookCreate = Hooks.on("createItem", (item) => { 
        if(item.parent?.id === actor.id) scheduleRefresh(); 
    });

    const hookDelete = Hooks.on("deleteItem", (item) => { 
        if(item.parent?.id === actor.id) scheduleRefresh(); 
    });

    const hookUpdate = Hooks.on("updateItem", (item) => { 
        if(item.parent?.id === actor.id) scheduleRefresh(); 
    });

    return () => {
      Hooks.off("updateActor", hookId);
      Hooks.off("createItem", hookCreate);
      Hooks.off("deleteItem", hookDelete);
      Hooks.off("updateItem", hookUpdate);
    };
  });

  $: filteredPowers = powers.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  function openLibrary() {
    // Se o Manager precisa do ator, temos que passar!
    try { new PoderesManager(actor).render(true); } catch (e) { console.error(e); }
  }
</script>

<div class="powers-terminal">
  <header class="term-header">
    <div class="hud-module main">
      <div class="hud-top">
        <span class="hud-label"><i class="fas fa-bolt"></i> DRENAGEM DE SISTEMA (XP)</span>
        <span class="hud-value xp">{calculatedTotalCost}</span>
      </div>
      <div class="hud-bar-bg">
        <div class="hud-bar-fill scanning-anim"></div>
      </div>
    </div>

    <div class="hud-module side">
      <div class="hud-label">MÓDULOS</div>
      <div class="hud-value">{activePowerCount}</div>
    </div>
  </header>

  <div class="toolbar">
    <div class="search-box">
      <span class="prompt">&gt;_QUERY:</span>
      <input type="text" bind:value={searchTerm} placeholder="LOCALIZAR ARQUIVO..." />
      <div class="search-icon"><i class="fas fa-search"></i></div>
    </div>

    <button class="btn-db" on:click={openLibrary} title="Acessar Nexus Database">
      <i class="fas fa-database"></i> <span class="btn-text">DATABASE</span>
    </button>
  </div>

  <div class="list-container">
    <div class="powers-grid">
      {#if filteredPowers.length > 0}
        {#each filteredPowers as power (power.id)}
          <div transition:slide|local={{duration: 200}}>
             <PowerInventoryCard 
                item={power} 
                actor={actor} 
                isGM={isGM} 
             />
          </div>
        {/each}
      {:else}
        <div class="empty-state" in:fade>
          <div class="glitch-wrapper">
            <i class="fas fa-wifi"></i>
          </div>
          <span class="empty-title">NENHUM MÓDULO DETECTADO</span>
          <span class="empty-sub">Acesse a Database para iniciar download.</span>
        </div>
      {/if}
    </div>
  </div>

  <footer class="term-footer">
    <div class="footer-left">SYS_STATUS: <span style="color:var(--c-primary)">ONLINE</span></div>
    <div class="footer-right">SYNC_MODE: <span style="color:var(--c-primary)">AUTO_RT</span></div>
  </footer>
</div>

<style>
  /* Use o mesmo CSS que você já tem */
  /* Copie o bloco <style> do seu código anterior para cá */
  .powers-terminal { height: 100%; display: flex; flex-direction: column; gap: 12px; background: transparent; color: var(--c-text); font-family: var(--font-body); padding: 5px; position: relative; overflow: hidden; }
  .term-header { display: flex; gap: 10px; z-index: 1; height: 60px; flex-shrink: 0; }
  .hud-module { background: rgba(0, 0, 0, 0.6); border: 1px solid #333; border-radius: var(--border-radius); display: flex; flex-direction: column; justify-content: center; padding: 0 15px; position: relative; overflow: hidden; }
  .hud-module.main { flex: 3; border-left: 4px solid var(--c-primary); }
  .hud-module.side { flex: 1; align-items: center; border-right: 4px solid #333; }
  .hud-top { display: flex; justify-content: space-between; align-items: center; width: 100%; }
  .hud-label { font-size: 0.65em; color: #888; letter-spacing: 2px; font-weight: bold; text-transform: uppercase; font-family: var(--font-head); }
  .hud-value { font-size: 1.8em; font-weight: bold; line-height: 1; font-family: var(--font-head); }
  .hud-value.xp { color: var(--c-primary); text-shadow: 0 0 10px var(--c-primary); }
  .hud-bar-bg { width: 100%; height: 4px; background: #1a1a1a; margin-top: 8px; border-radius: 2px; overflow: hidden; position: relative; }
  .hud-bar-fill { height: 100%; background: var(--c-primary); box-shadow: 0 0 8px var(--c-primary); width: 100%; }
  .scanning-anim { background: linear-gradient(90deg, transparent, var(--c-primary), transparent); background-size: 50% 100%; background-repeat: no-repeat; animation: scan-bar 2s infinite linear; }
  .toolbar { display: flex; gap: 10px; z-index: 1; height: 38px; flex-shrink: 0; }
  .search-box { flex: 1; display: flex; align-items: center; gap: 8px; background: rgba(0, 0, 0, 0.5); border: 1px solid #333; padding: 0 12px; border-radius: var(--border-radius); transition: border-color 0.2s; }
  .search-box:focus-within { border-color: var(--c-primary); box-shadow: 0 0 10px rgba(0,0,0,0.3); }
  .prompt { color: var(--c-primary); font-weight: bold; font-size: 0.8em; font-family: var(--font-head); }
  .search-box input { flex: 1; background: transparent; border: none; color: #fff; font-family: var(--font-body); font-size: 0.9em; padding: 5px; }
  .search-box input:focus { outline: none; }
  .search-icon { color: #555; }
  .btn-db { background: rgba(0,0,0,0.6); border: 1px solid var(--c-primary); color: var(--c-primary); padding: 0 15px; border-radius: var(--border-radius); cursor: pointer; display: flex; align-items: center; gap: 8px; font-family: var(--font-head); font-weight: bold; transition: all 0.2s; }
  .btn-db:hover { background: var(--c-primary); color: #000; box-shadow: 0 0 15px var(--c-primary); }
  .btn-text { font-size: 0.8em; }
  .list-container { flex: 1; overflow-y: auto; padding-right: 5px; z-index: 1; border-top: 1px solid rgba(255,255,255,0.1); border-bottom: 1px solid rgba(255,255,255,0.1); }
  .powers-grid { display: flex; flex-direction: column; gap: 8px; padding-top: 5px; }
  .list-container::-webkit-scrollbar { width: 6px; }
  .list-container::-webkit-scrollbar-track { background: transparent; }
  .list-container::-webkit-scrollbar-thumb { background: #333; border: 1px solid #000; border-radius: 3px; }
  .list-container::-webkit-scrollbar-thumb:hover { background: var(--c-primary); }
  .empty-state { height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: #666; border: 1px dashed #333; border-radius: var(--border-radius); margin-top: 20px; background: rgba(0,0,0,0.2); }
  .glitch-wrapper { font-size: 3em; opacity: 0.5; position: relative; animation: glitch 3s infinite; color: var(--c-primary); }
  .empty-title { font-weight: bold; color: #888; font-size: 1em; letter-spacing: 1px; font-family: var(--font-head); }
  .empty-sub { font-size: 0.7em; }
  .term-footer { display: flex; justify-content: space-between; font-size: 0.6em; color: #555; z-index: 1; padding: 0 5px; font-family: var(--font-head); margin-top: auto; }
  @keyframes scan-bar { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  @keyframes glitch { 0% { transform: translate(0); } 2% { transform: translate(-2px, 2px); } 4% { transform: translate(2px, -2px); } 6% { transform: translate(0); } 100% { transform: translate(0); } }
</style>