<script>
  import { onMount, tick } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import PowerInventoryCard from '../components/PowerInventoryCard.svelte';
  import VisualizationModal from '../components/VisualizationModal.svelte';
  import RollEngine from './components/RollEngine.svelte';
  import PoderesManager from './PoderesManager.js';
  import { StoreDatabase } from '../StoreDatabase.js';
  import { getBasePowerXP, normalizePowerCategoryAndRarity } from '../utils/PowerRules.js';

  export let actor;
  export let themeColor;
  export let flags = {};

  const isGM = game.user.isGM;
  const MODULE_ID = "multiversus-rpg";

  const actorUUID = actor.uuid;
  const actorID = actor.id;

  const RARITY_COLORS = {
    "Comum": "#a0a0a0",
    "Raro": "#00bfff",
    "Lendário": "#ffa500",
    "Mítico": "#ff4500",
    "Universal": "#ffffff",
    "Multiversal": "#d000ff"
  };
  const RARITIES = ["Comum", "Raro", "Lendário", "Mítico", "Universal", "Multiversal"];

  let searchTerm = "";
  let activeCategoryTab = "principais"; // 'principais' | 'secundarios' | 'memorias' | 'intrinsecas'

  let principaisList = [];
  let secundariosList = [];
  let memoriasList = [];
  let intrinsicList = [];

  let calculatedTotalCost = 0;
  let activePowerCount = 0;
  let isReady = false;

  let rollState = { open: false, title: "", pool: { d: 0, hd: 0, wd: 0 } };

  // Estado do Modal de Visualização HTML/CSS
  let vizState = {
    open: false,
    title: "",
    subtitle: "",
    rarity: "Lendário",
    img: "",
    htmlContent: "",
    startInEdit: false,
    onSave: async () => {}
  };

  // Modais GM para Habilidades Intrínsecas
  let showStoreIntrinsicPicker = false;
  let storeIntrinsicQuery = "";
  let storeIntrinsicItems = [];

  let showManualIntrinsicModal = false;
  let intrinsicDraft = { id: null, name: "", img: "icons/svg/aura.svg", rarity: "Lendário", visualizationHtml: "" };

  function handleRoll(event) {
    const item = event.detail;
    const iFlags = item?.flags?.[MODULE_ID] || {};
    const dice = iFlags.dice || {};
    rollState = {
      open: true,
      title: item.name.toUpperCase(),
      pool: { d: dice.normal || 0, hd: dice.hard || 0, wd: dice.wiggle || 0 }
    };
  }

  function handleVisualizePower(event) {
    const item = event.detail;
    if (!item) return;
    const iFlags = item.flags?.[MODULE_ID] || {};
    const html = iFlags.visualizationHtml || "";

    if (!isGM && !html.trim()) {
      ui.notifications.info("Não há visualização disponível para este talento.");
      return;
    }

    const catLabelMap = {
      principal: "TALENTO PRINCIPAL",
      secundario: "TALENTO SECUNDÁRIO",
      memoria: "MEMÓRIA",
      habilidade: "HABILIDADE ESPECIAL",
      origem: "KIT DE ORIGEM",
      item: "ITEM"
    };

    vizState = {
      open: true,
      title: iFlags.customAlias || item.name || "Talento",
      subtitle: catLabelMap[iFlags.category || "principal"] || "TALENTO",
      rarity: iFlags.rarity || "Lendário",
      img: item.img || "",
      htmlContent: html,
      startInEdit: isGM && !html.trim(),
      onSave: async (newHtml) => {
        await item.update({ [`flags.${MODULE_ID}.visualizationHtml`]: newHtml });
        vizState.htmlContent = newHtml;
        scheduleRefresh();
      }
    };
  }

  function handleVisualizeIntrinsic(intr) {
    const html = intr.visualizationHtml || "";
    if (!isGM && !html.trim()) {
      ui.notifications.info("Não há visualização disponível para esta Habilidade Intrínseca.");
      return;
    }

    vizState = {
      open: true,
      title: intr.name || "Habilidade Intrínseca",
      subtitle: "HABILIDADE INTRÍNSECA",
      rarity: intr.rarity || "Lendário",
      img: intr.img || "",
      htmlContent: html,
      startInEdit: isGM && !html.trim(),
      onSave: async (newHtml) => {
        if (intr.isEmbeddedItem && intr.doc) {
          await intr.doc.update({ [`flags.${MODULE_ID}.visualizationHtml`]: newHtml });
        } else {
          const fresh = await getFreshActor();
          if (!fresh) return;
          const list = foundry.utils.deepClone(fresh.getFlag(MODULE_ID, "intrinsicAbilities") || []);
          const idx = list.findIndex(x => x.id === intr.id);
          if (idx !== -1) {
            list[idx].visualizationHtml = newHtml;
            await fresh.update({ [`flags.${MODULE_ID}.intrinsicAbilities`]: list }, { render: false });
          }
        }
        vizState.htmlContent = newHtml;
        scheduleRefresh();
      }
    };
  }

  async function getFreshActor() {
    let freshActor = null;
    try {
      freshActor = await fromUuid(actorUUID);
      if (!freshActor) freshActor = game.actors.get(actorID);
      if (!freshActor && canvas.tokens) {
        freshActor = canvas.tokens.placeables.find(t => t.actor?.id === actorID)?.actor;
      }
    } catch (e) {
      console.error("Erro crítico buscando ator:", e);
    }
    return freshActor;
  }

  let updateTimer = null;

  function scheduleRefresh() {
    if (updateTimer) clearTimeout(updateTimer);
    updateTimer = setTimeout(() => {
      refreshData();
    }, 100);
  }

  async function refreshData() {
    const freshActor = await getFreshActor();
    if (!freshActor) return;

    const rawPowers = freshActor.items.filter(i => i && i.type === "power");
    const allPowers = [...rawPowers].sort((a, b) => a.name.localeCompare(b.name));

    const habilidades = allPowers.filter(p => (p.flags?.[MODULE_ID]?.category || "principal") === "habilidade");
    const principais = allPowers.filter(p => {
      const c = p.flags?.[MODULE_ID]?.category || "principal";
      return c === "principal" || c === "origem";
    });
    const secundarios = allPowers.filter(p => (p.flags?.[MODULE_ID]?.category || "principal") === "secundario");
    const memorias = allPowers.filter(p => (p.flags?.[MODULE_ID]?.category || "principal") === "memoria");
    const embeddedIntrinsics = allPowers.filter(p => (p.flags?.[MODULE_ID]?.category || "principal") === "intrinseca");

    const claimedHabIds = new Set();

    // 1. Principais (recebem quaisquer Habilidades Especiais vinculadas a eles)
    for (let p of principais) {
      const children = habilidades.filter(h => h.flags?.[MODULE_ID]?.parentId === p.id);
      children.forEach(c => claimedHabIds.add(c.id));
      p.childHabilidades = children;
    }

    // 2. Secundários (NUNCA recebem Habilidades Especiais)
    for (let s of secundarios) {
      s.childHabilidades = [];
    }

    // 3. Memórias (recebem APENAS Habilidades Especiais Raro/Comum vinculadas a elas)
    for (let m of memorias) {
      const children = habilidades.filter(h => {
        if (h.flags?.[MODULE_ID]?.parentId !== m.id) return false;
        const hRar = h.flags?.[MODULE_ID]?.rarity || "Comum";
        return hRar === "Raro" || hRar === "Comum";
      });
      children.forEach(c => claimedHabIds.add(c.id));
      m.childHabilidades = children;
    }

    // Habilidades Especiais soltas (ou com vínculo inválido) ficam espalhadas na aba Talentos Principais
    const unparentedHabilidades = habilidades.filter(h => !claimedHabIds.has(h.id));

    principaisList = [...principais, ...unparentedHabilidades];
    secundariosList = [...secundarios];
    memoriasList = [...memorias];

    // 4. Habilidades Intrínsecas (0 XP - Flag + Itens embutidos categoria 'intrinseca')
    const flagIntrinsics = (freshActor.getFlag(MODULE_ID, "intrinsicAbilities") || []).map(entry => ({
      ...entry,
      isEmbeddedItem: false
    }));
    const itemIntrinsics = embeddedIntrinsics.map(doc => ({
      id: doc.id,
      name: doc.flags?.[MODULE_ID]?.customAlias || doc.name,
      img: doc.img || "icons/svg/aura.svg",
      rarity: doc.flags?.[MODULE_ID]?.rarity || "Lendário",
      visualizationHtml: doc.flags?.[MODULE_ID]?.visualizationHtml || doc.system?.notes || "",
      isEmbeddedItem: true,
      doc
    }));
    intrinsicList = [...flagIntrinsics, ...itemIntrinsics].sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    activePowerCount = principais.length + secundarios.length + memorias.length + habilidades.length + intrinsicList.length;

    // Cálculo de XP total na ficha usando PowerRules (Memória = 4 XP, Hab Rara = 1 XP, Intrínseca/Item/Origem = 0 XP)
    calculatedTotalCost = allPowers.reduce((acc, item) => {
      const iFlags = item.flags?.[MODULE_ID] || {};
      const iSys = item.system || {};

      const cat = iFlags.category || "principal";
      const rar = iFlags.rarity || "Comum";
      const base = getBasePowerXP(cat, rar);
      if (base <= 0) return acc;

      const discount = iFlags.isInitial ? 4 * base : 0;

      const dN = Number(iFlags.dice?.normal || iSys.dice?.normal || 0) || 0;
      const dH = Number(iFlags.dice?.hard || iSys.dice?.hard || 0) || 0;
      const dW = Number(iFlags.dice?.wiggle || iSys.dice?.wiggle || 0) || 0;

      const cost = dN * base + dH * base * 2 + dW * base * 4;
      return acc + Math.max(0, cost - discount);
    }, 0);

    const currentSavedCost = Number(freshActor.getFlag(MODULE_ID, "powersSpent")) || 0;
    if (calculatedTotalCost !== currentSavedCost && !isNaN(calculatedTotalCost)) {
      await freshActor.update(
        {
          [`flags.${MODULE_ID}.powersSpent`]: calculatedTotalCost
        },
        { render: false }
      );
    }

    isReady = true;
    await tick();
  }

  onMount(() => {
    refreshData();
    const hookAll = Hooks.on("updateItem", item => {
      if (item.parent?.uuid === actorUUID || item.parent?.id === actorID) scheduleRefresh();
    });
    const hookCreate = Hooks.on("createItem", item => {
      if (item.parent?.uuid === actorUUID || item.parent?.id === actorID) scheduleRefresh();
    });
    const hookDelete = Hooks.on("deleteItem", item => {
      if (item.parent?.uuid === actorUUID || item.parent?.id === actorID) scheduleRefresh();
    });
    const hookActor = Hooks.on("updateActor", doc => {
      if (doc.uuid === actorUUID || doc.id === actorID) scheduleRefresh();
    });

    return () => {
      Hooks.off("updateItem", hookAll);
      Hooks.off("createItem", hookCreate);
      Hooks.off("deleteItem", hookDelete);
      Hooks.off("updateActor", hookActor);
    };
  });

  $: q = searchTerm.trim().toLowerCase();
  $: filteredPrincipais = principaisList.filter(p =>
    p.name.toLowerCase().includes(q) ||
    (p.childHabilidades || []).some(h => h.name.toLowerCase().includes(q))
  );
  $: filteredSecundarios = secundariosList.filter(p => p.name.toLowerCase().includes(q));
  $: filteredMemorias = memoriasList.filter(p =>
    p.name.toLowerCase().includes(q) ||
    (p.childHabilidades || []).some(h => h.name.toLowerCase().includes(q))
  );
  $: filteredIntrinsics = intrinsicList.filter(i => (i.name || "").toLowerCase().includes(q));

  function openLibrary() {
    try {
      new PoderesManager(actor).render(true);
    } catch (e) {
      console.error(e);
    }
  }

  // --- GERENCIAMENTO GM DE HABILIDADES INTRÍNSECAS ---
  function openStoreIntrinsicImport() {
    if (!isGM) return;
    const allArchive = StoreDatabase.getArchive() || [];
    // Prioriza Habilidades Intrínsecas, mas permite pesquisar qualquer item do DB Geral
    storeIntrinsicItems = [...allArchive].sort((a, b) => {
      const aIntr = a.systemTag === "Habilidades Intrínsecas" ? 0 : 1;
      const bIntr = b.systemTag === "Habilidades Intrínsecas" ? 0 : 1;
      if (aIntr !== bIntr) return aIntr - bIntr;
      return (a.name || "").localeCompare(b.name || "");
    });
    storeIntrinsicQuery = "";
    showStoreIntrinsicPicker = true;
  }

  $: filteredStoreIntrinsics = storeIntrinsicItems.filter(item => {
    if (!storeIntrinsicQuery.trim()) return true;
    const term = storeIntrinsicQuery.toLowerCase();
    return (
      (item.name || "").toLowerCase().includes(term) ||
      (item.systemTag || "").toLowerCase().includes(term)
    );
  });

  async function importIntrinsicFromStore(storeItem) {
    if (!isGM) return;
    const fresh = await getFreshActor();
    if (!fresh) return;

    const current = foundry.utils.deepClone(fresh.getFlag(MODULE_ID, "intrinsicAbilities") || []);
    current.push({
      id: foundry.utils.randomID(),
      name: storeItem.name || "Habilidade Intrínseca",
      img: storeItem.img || "icons/svg/aura.svg",
      rarity: storeItem.rarity || "Lendário",
      visualizationHtml: storeItem.system?.description || "",
      sourceStoreId: storeItem.id || null
    });

    await fresh.update({ [`flags.${MODULE_ID}.intrinsicAbilities`]: current }, { render: false });
    ui.notifications.info(`Habilidade Intrínseca [${storeItem.name}] importada da Loja!`);
    showStoreIntrinsicPicker = false;
    scheduleRefresh();
  }

  function openManualIntrinsicCreator(existing = null) {
    if (!isGM) return;
    if (existing && !existing.isEmbeddedItem) {
      intrinsicDraft = {
        id: existing.id,
        name: existing.name || "",
        img: existing.img || "icons/svg/aura.svg",
        rarity: existing.rarity || "Lendário",
        visualizationHtml: existing.visualizationHtml || ""
      };
    } else {
      intrinsicDraft = {
        id: null,
        name: "",
        img: "icons/svg/aura.svg",
        rarity: "Lendário",
        visualizationHtml: ""
      };
    }
    showManualIntrinsicModal = true;
  }

  async function saveManualIntrinsic() {
    if (!isGM || !intrinsicDraft.name.trim()) {
      return ui.notifications.warn("Informe o nome da Habilidade Intrínseca.");
    }
    const fresh = await getFreshActor();
    if (!fresh) return;

    const current = foundry.utils.deepClone(fresh.getFlag(MODULE_ID, "intrinsicAbilities") || []);
    if (intrinsicDraft.id) {
      const idx = current.findIndex(x => x.id === intrinsicDraft.id);
      if (idx !== -1) {
        current[idx] = { ...current[idx], ...intrinsicDraft, name: intrinsicDraft.name.trim() };
      }
    } else {
      current.push({
        id: foundry.utils.randomID(),
        name: intrinsicDraft.name.trim(),
        img: intrinsicDraft.img || "icons/svg/aura.svg",
        rarity: intrinsicDraft.rarity || "Lendário",
        visualizationHtml: intrinsicDraft.visualizationHtml || ""
      });
    }

    await fresh.update({ [`flags.${MODULE_ID}.intrinsicAbilities`]: current }, { render: false });
    ui.notifications.info(`Habilidade Intrínseca [${intrinsicDraft.name}] salva!`);
    showManualIntrinsicModal = false;
    scheduleRefresh();
  }

  async function deleteIntrinsic(intr) {
    if (!isGM) return;
    if (intr.isEmbeddedItem && intr.doc) {
      await intr.doc.delete();
      scheduleRefresh();
      return;
    }
    const fresh = await getFreshActor();
    if (!fresh) return;
    const current = (fresh.getFlag(MODULE_ID, "intrinsicAbilities") || []).filter(x => x.id !== intr.id);
    await fresh.update({ [`flags.${MODULE_ID}.intrinsicAbilities`]: current }, { render: false });
    ui.notifications.info(`Habilidade Intrínseca [${intr.name}] removida.`);
    scheduleRefresh();
  }

  async function handleDropOnSheet(event) {
    event.preventDefault();
    const dataText = event.dataTransfer.getData("text/plain");
    if (!dataText) return;

    try {
      const dropData = JSON.parse(dataText);
      if (dropData.uuid && dropData.uuid.includes(actor.id)) {
        // Se arrastou pra fora de um card na area geral, tira o parentId
        const existingItem = actor.items.get(dropData.data._id);
        if (existingItem && existingItem.getFlag(MODULE_ID, "parentId")) {
          await existingItem.unsetFlag(MODULE_ID, "parentId");
        }
        return;
      }

      if (dropData.type === "Item" && dropData.data) {
        let itemData = foundry.utils.deepClone(dropData.data);
        const validTypes = game.documentTypes.Item;
        itemData.type = validTypes.includes("power") ? "power" : validTypes[0];
        delete itemData._id;

        itemData.flags = itemData.flags || {};
        itemData.flags[MODULE_ID] = itemData.flags[MODULE_ID] || {};
        const norm = normalizePowerCategoryAndRarity(
          itemData.flags[MODULE_ID].category || "principal",
          itemData.flags[MODULE_ID].rarity || "Comum"
        );
        itemData.flags[MODULE_ID].category = norm.category;
        itemData.flags[MODULE_ID].rarity = norm.rarity;

        await actor.createEmbeddedDocuments("Item", [itemData]);
        if (norm.category === "memoria") activeCategoryTab = "memorias";
        else if (norm.category === "secundario") activeCategoryTab = "secundarios";
        else if (norm.category === "intrinseca") activeCategoryTab = "intrinsecas";
        ui.notifications.info(`[${itemData.name}] inserido na ficha de ${actor.name}.`);
      }
    } catch (e) {
      console.error("Falha ao receber o talento na ficha:", e);
    }
  }
</script>

<div class="powers-terminal" on:drop={handleDropOnSheet} on:dragover={(e) => e.preventDefault()}>
  <header class="term-header">
    <div class="hud-module main">
      <div class="hud-top">
        <span class="hud-label"><i class="fas fa-bolt"></i> Pontos Investidos (XP)</span>
        <span class="hud-value xp">{isReady ? calculatedTotalCost : '...'}</span>
      </div>
      <div class="hud-bar-bg">
        <div class="hud-bar-fill scanning-anim"></div>
      </div>
    </div>
    <div class="hud-module side">
      <div class="hud-label">Talentos</div>
      <div class="hud-value">{isReady ? activePowerCount : '...'}</div>
    </div>
  </header>

  <div class="toolbar">
    <div class="search-box">
      <span class="prompt">Pesquisa:</span>
      <input type="text" bind:value={searchTerm} placeholder="LOCALIZAR ARQUIVO..." />
      <div class="search-icon"><i class="fas fa-search"></i></div>
    </div>
    <button class="btn-db" on:click={openLibrary} title="Upe ou Modifique os Talentos por Aqui">
      <i class="fas fa-database"></i> <span class="btn-text">MODIFICAR TALENTOS</span>
    </button>
  </div>

  <!-- 4 BOTÕES DE CATEGORIA DA ABA TALENTOS -->
  <nav class="category-tabs">
    <button
      type="button"
      class="cat-tab-btn"
      class:active={activeCategoryTab === 'principais'}
      on:click={() => (activeCategoryTab = 'principais')}
      on:dragover={(e) => { e.preventDefault(); activeCategoryTab = 'principais'; }}
    >
      <i class="fas fa-star"></i>
      <span>Talentos Principais</span>
      <small>{principaisList.length}</small>
    </button>

    <button
      type="button"
      class="cat-tab-btn"
      class:active={activeCategoryTab === 'secundarios'}
      on:click={() => (activeCategoryTab = 'secundarios')}
      on:dragover={(e) => { e.preventDefault(); activeCategoryTab = 'secundarios'; }}
    >
      <i class="fas fa-bolt"></i>
      <span>Talentos Secundários</span>
      <small>{secundariosList.length}</small>
    </button>

    <button
      type="button"
      class="cat-tab-btn"
      class:active={activeCategoryTab === 'memorias'}
      on:click={() => (activeCategoryTab = 'memorias')}
      on:dragover={(e) => { e.preventDefault(); activeCategoryTab = 'memorias'; }}
    >
      <i class="fas fa-brain"></i>
      <span>Memórias</span>
      <small>{memoriasList.length}</small>
    </button>

    <button
      type="button"
      class="cat-tab-btn"
      class:active={activeCategoryTab === 'intrinsecas'}
      on:click={() => (activeCategoryTab = 'intrinsecas')}
    >
      <i class="fas fa-dna"></i>
      <span>Habilidades Intrínsecas</span>
      <small>{intrinsicList.length}</small>
    </button>
  </nav>

  {#if activeCategoryTab === 'intrinsecas' && isGM}
    <div class="intrinsic-gm-bar">
      <button type="button" class="intr-gm-btn store" on:click={openStoreIntrinsicImport}>
        <i class="fas fa-cloud-download-alt"></i> IMPORTAR DA LOJA (DB GERAL)
      </button>
      <button type="button" class="intr-gm-btn manual" on:click={() => openManualIntrinsicCreator(null)}>
        <i class="fas fa-plus"></i> NOVA INTRÍNSECA MANUAL
      </button>
    </div>
  {/if}

  <div class="list-container">
    {#if !isReady}
      <div class="loading-state">
        <i class="fas fa-satellite-dish fa-spin"></i> Inicializando Protocolos...
      </div>
    {:else if activeCategoryTab === 'principais'}
      <div class="powers-grid">
        {#if filteredPrincipais.length > 0}
          {#each filteredPrincipais as power (power.id)}
            <div>
              <PowerInventoryCard
                item={power}
                actor={actor}
                isGM={isGM}
                on:roll={handleRoll}
                on:visualize={handleVisualizePower}
              />
            </div>
          {/each}
        {:else}
          <div class="empty-state">
            <div class="glitch-wrapper"><i class="fas fa-wifi"></i></div>
            <span class="empty-title">NENHUM TALENTO PRINCIPAL ALOCADO</span>
            <span class="empty-sub">Talentos Principais e Habilidades Especiais aparecem nesta categoria.</span>
          </div>
        {/if}
      </div>
    {:else if activeCategoryTab === 'secundarios'}
      <div class="powers-grid">
        {#if filteredSecundarios.length > 0}
          {#each filteredSecundarios as power (power.id)}
            <div>
              <PowerInventoryCard
                item={power}
                actor={actor}
                isGM={isGM}
                on:roll={handleRoll}
                on:visualize={handleVisualizePower}
              />
            </div>
          {/each}
        {:else}
          <div class="empty-state">
            <div class="glitch-wrapper"><i class="fas fa-bolt"></i></div>
            <span class="empty-title">NENHUM TALENTO SECUNDÁRIO ALOCADO</span>
            <span class="empty-sub">Talentos Secundários (4 XP) não possuem Habilidades Especiais vinculadas.</span>
          </div>
        {/if}
      </div>
    {:else if activeCategoryTab === 'memorias'}
      <div class="powers-grid">
        {#if filteredMemorias.length > 0}
          {#each filteredMemorias as power (power.id)}
            <div>
              <PowerInventoryCard
                item={power}
                actor={actor}
                isGM={isGM}
                on:roll={handleRoll}
                on:visualize={handleVisualizePower}
              />
            </div>
          {/each}
        {:else}
          <div class="empty-state">
            <div class="glitch-wrapper"><i class="fas fa-brain"></i></div>
            <span class="empty-title">NENHUMA MEMÓRIA REGISTRADA</span>
            <span class="empty-sub">Memórias (Raro • 4 PB • 4 XP) podem receber Habilidades Especiais Raras (1 PB • 1 XP).</span>
          </div>
        {/if}
      </div>
    {:else if activeCategoryTab === 'intrinsecas'}
      <div class="powers-grid">
        {#if filteredIntrinsics.length > 0}
          {#each filteredIntrinsics as intr (intr.id)}
            {@const glow = RARITY_COLORS[intr.rarity] || '#00ff41'}
            <div class="intrinsic-card" style="--glow: {glow};" on:click={() => handleVisualizeIntrinsic(intr)}>
              <div class="intr-icon-box">
                <img src={intr.img || "icons/svg/aura.svg"} alt={intr.name} />
              </div>
              <div class="intr-info">
                <div class="intr-header-row">
                  <span class="intr-name">{intr.name}</span>
                  <span class="intr-zero-xp">0 XP • PASSIVA</span>
                </div>
                <div class="intr-meta-row">
                  <span class="intr-tag">HABILIDADE INTRÍNSECA</span>
                  <span class="intr-tag rar">{(intr.rarity || 'Lendário').toUpperCase()}</span>
                  <button
                    type="button"
                    class="intr-viz-btn"
                    on:click|stopPropagation={() => handleVisualizeIntrinsic(intr)}
                  >
                    <i class="fas fa-eye"></i> Abrir Visualização
                  </button>
                </div>
              </div>
              {#if isGM}
                <div class="intr-gm-actions" on:click|stopPropagation>
                  {#if !intr.isEmbeddedItem}
                    <button type="button" title="Editar Dados" on:click={() => openManualIntrinsicCreator(intr)}>
                      <i class="fas fa-pencil-alt"></i>
                    </button>
                  {/if}
                  <button type="button" class="del" title="Remover da Ficha" on:click={() => deleteIntrinsic(intr)}>
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              {/if}
            </div>
          {/each}
        {:else}
          <div class="empty-state">
            <div class="glitch-wrapper"><i class="fas fa-dna"></i></div>
            <span class="empty-title">NENHUMA HABILIDADE INTRÍNSECA</span>
            <span class="empty-sub">Habilidades Intrínsecas não custam XP na ficha e funcionam em modo de visualização.</span>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <footer class="term-footer">
    <div class="footer-left">SYS_STATUS: <span style="color:var(--c-primary)">ONLINE</span></div>
    <div class="footer-right">SYNC_MODE: <span style="color:var(--c-primary)">AUTO</span></div>
  </footer>
</div>

{#if vizState.open}
  <VisualizationModal
    title={vizState.title}
    subtitle={vizState.subtitle}
    rarity={vizState.rarity}
    img={vizState.img}
    htmlContent={vizState.htmlContent}
    isGM={isGM}
    startInEdit={vizState.startInEdit}
    onSave={vizState.onSave}
    onClose={() => (vizState.open = false)}
  />
{/if}

{#if showStoreIntrinsicPicker && isGM}
  <div class="intr-modal-backdrop" on:click|self={() => (showStoreIntrinsicPicker = false)} transition:fade={{ duration: 150 }}>
    <div class="intr-modal-box" in:scale={{ start: 0.95, duration: 180 }} on:click|stopPropagation>
      <header class="intr-modal-header">
        <span><i class="fas fa-database"></i> IMPORTAR HABILIDADE INTRÍNSECA (DB GERAL)</span>
        <button type="button" on:click={() => (showStoreIntrinsicPicker = false)}>✕</button>
      </header>
      <div class="intr-modal-search">
        <i class="fas fa-search"></i>
        <input type="text" bind:value={storeIntrinsicQuery} placeholder="Buscar no DB Geral da Loja..." />
      </div>
      <div class="intr-store-list custom-scroll">
        {#each filteredStoreIntrinsics as sItem (sItem.id)}
          <div class="intr-store-row" on:click={() => importIntrinsicFromStore(sItem)}>
            <img src={sItem.img || "icons/svg/aura.svg"} alt={sItem.name} />
            <div class="s-det">
              <strong>{sItem.name}</strong>
              <small>{sItem.systemTag} • {sItem.rarity}</small>
            </div>
            <button type="button" class="s-import-btn"><i class="fas fa-plus"></i> INJETAR</button>
          </div>
        {/each}
        {#if filteredStoreIntrinsics.length === 0}
          <div class="intr-empty-msg">Nenhum registro encontrado no DB Geral.</div>
        {/if}
      </div>
    </div>
  </div>
{/if}

{#if showManualIntrinsicModal && isGM}
  <div class="intr-modal-backdrop" on:click|self={() => (showManualIntrinsicModal = false)} transition:fade={{ duration: 150 }}>
    <div class="intr-modal-box" style="width: 560px;" in:scale={{ start: 0.95, duration: 180 }} on:click|stopPropagation>
      <header class="intr-modal-header">
        <span><i class="fas fa-dna"></i> {intrinsicDraft.id ? "EDITAR" : "NOVA"} HABILIDADE INTRÍNSECA</span>
        <button type="button" on:click={() => (showManualIntrinsicModal = false)}>✕</button>
      </header>
      <div class="intr-form-body">
        <label>NOME DA HABILIDADE
          <input type="text" bind:value={intrinsicDraft.name} placeholder="Ex: Fisiologia Dimensional" />
        </label>
        <div style="display: flex; gap: 10px;">
          <label style="flex: 1;">RARIDADE
            <select bind:value={intrinsicDraft.rarity}>
              {#each RARITIES as r}
                <option value={r}>{r}</option>
              {/each}
            </select>
          </label>
          <label style="flex: 2;">ÍCONE (URL)
            <input type="text" bind:value={intrinsicDraft.img} placeholder="icons/svg/aura.svg" />
          </label>
        </div>
        <label>VISUALIZAÇÃO HTML / CSS (OPCIONAL — PODE EDITAR DEPOIS EM ABRIR VISUALIZAÇÃO)
          <textarea rows="6" bind:value={intrinsicDraft.visualizationHtml} placeholder="Cole aqui o código HTML / CSS da habilidade..."></textarea>
        </label>
        <button type="button" class="intr-save-btn" on:click={saveManualIntrinsic}>
          <i class="fas fa-save"></i> SALVAR NA FICHA (0 XP)
        </button>
      </div>
    </div>
  </div>
{/if}

{#if rollState.open}
  <div style="position: absolute; inset: 0; z-index: 10000; pointer-events: auto;">
    <RollEngine
      actor={actor}
      pool={rollState.pool}
      actionName={rollState.title}
      onClose={() => (rollState.open = false)}
    />
  </div>
{/if}

<style>
  .powers-terminal { height: 100%; display: flex; flex-direction: column; gap: 10px; background: transparent; color: var(--c-text); font-family: var(--font-body); padding: 5px; position: relative; overflow: hidden; }
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
  .toolbar { display: flex; gap: 10px; z-index: 1; height: 36px; flex-shrink: 0; }
  .search-box { flex: 1; display: flex; align-items: center; gap: 8px; background: rgba(0, 0, 0, 0.5); border: 1px solid #333; padding: 0 12px; border-radius: var(--border-radius); transition: border-color 0.2s; }
  .search-box:focus-within { border-color: var(--c-primary); box-shadow: 0 0 10px rgba(0,0,0,0.3); }
  .prompt { color: var(--c-primary); font-weight: bold; font-size: 0.8em; font-family: var(--font-head); }
  .search-box input { flex: 1; background: transparent; border: none; color: #fff; font-family: var(--font-body); font-size: 0.9em; padding: 5px; }
  .search-box input:focus { outline: none; }
  .search-icon { color: #555; }
  .btn-db { background: rgba(0,0,0,0.6); border: 1px solid var(--c-primary); color: var(--c-primary); padding: 0 15px; border-radius: var(--border-radius); cursor: pointer; display: flex; align-items: center; gap: 8px; font-family: var(--font-head); font-weight: bold; transition: all 0.2s; }
  .btn-db:hover { background: var(--c-primary); color: #000; box-shadow: 0 0 15px var(--c-primary); }
  .btn-text { font-size: 0.8em; }

  /* 4 BOTÕES DE CATEGORIA */
  .category-tabs {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    flex-shrink: 0;
    z-index: 1;
  }
  .cat-tab-btn {
    background: rgba(0, 0, 0, 0.55);
    border: 1px solid #2e2e2e;
    color: #888;
    padding: 7px 8px;
    border-radius: var(--border-radius, 4px);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-family: var(--font-head);
    font-size: 0.72em;
    font-weight: bold;
    text-transform: uppercase;
    transition: all 0.2s;
    min-width: 0;
  }
  .cat-tab-btn span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .cat-tab-btn small {
    background: #1a1a1a;
    border: 1px solid #333;
    color: #aaa;
    padding: 1px 5px;
    border-radius: 10px;
    font-size: 0.9em;
    flex-shrink: 0;
  }
  .cat-tab-btn:hover {
    border-color: var(--c-primary);
    color: #fff;
  }
  .cat-tab-btn.active {
    background: rgba(0, 255, 65, 0.08);
    border-color: var(--c-primary);
    color: var(--c-primary);
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5), 0 0 8px rgba(0, 255, 65, 0.15);
  }
  .cat-tab-btn.active small {
    background: var(--c-primary);
    color: #000;
    border-color: var(--c-primary);
  }

  /* BARRA GM DE INTRÍNSECAS */
  .intrinsic-gm-bar {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }
  .intr-gm-btn {
    flex: 1;
    padding: 6px 10px;
    background: rgba(0, 0, 0, 0.65);
    border: 1px dashed var(--c-primary);
    color: var(--c-primary);
    font-family: var(--font-head);
    font-size: 0.72em;
    font-weight: bold;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: 0.2s;
  }
  .intr-gm-btn:hover {
    background: var(--c-primary);
    color: #000;
  }

  /* CARDS DE HABILIDADES INTRÍNSECAS (ESTILO TALENTO, APENAS VISUALIZAÇÃO) */
  .intrinsic-card {
    display: flex;
    align-items: center;
    padding: 10px 10px;
    min-height: 70px;
    background: linear-gradient(90deg, #111 0%, #070709 100%);
    border: 1px solid #333;
    border-left: 4px solid var(--glow);
    border-radius: 6px;
    cursor: pointer;
    transition: 0.25s;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.5);
  }
  .intrinsic-card:hover {
    border-color: var(--glow);
    box-shadow: 0 0 14px var(--glow);
  }
  .intr-icon-box {
    width: 50px;
    height: 50px;
    margin-right: 12px;
    border: 1px solid #444;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;
    background: #000;
  }
  .intr-icon-box img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .intr-info {
    flex: 1;
    min-width: 0;
  }
  .intr-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    padding-right: 8px;
  }
  .intr-name {
    font-weight: 800;
    color: #fff;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .intr-zero-xp {
    font-size: 0.7em;
    color: #000;
    background: var(--glow);
    padding: 2px 8px;
    border-radius: 12px;
    font-weight: bold;
    flex-shrink: 0;
  }
  .intr-meta-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 5px;
    font-size: 0.75em;
    flex-wrap: wrap;
  }
  .intr-tag {
    background: #1e1e1e;
    border: 1px solid #333;
    color: #999;
    padding: 2px 6px;
    border-radius: 4px;
  }
  .intr-tag.rar {
    color: var(--glow);
    border-color: rgba(255, 255, 255, 0.2);
  }
  .intr-viz-btn {
    background: rgba(0, 255, 65, 0.08);
    border: 1px solid var(--glow);
    color: var(--glow);
    padding: 2px 8px;
    border-radius: 4px;
    font-family: inherit;
    font-size: 0.95em;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: 0.2s;
  }
  .intr-viz-btn:hover {
    background: var(--glow);
    color: #000;
  }
  .intr-gm-actions {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding-left: 10px;
    border-left: 1px solid #222;
  }
  .intr-gm-actions button {
    background: #161616;
    border: 1px solid #333;
    color: #aaa;
    width: 26px;
    height: 26px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
  }
  .intr-gm-actions button:hover {
    color: #fff;
    border-color: #fff;
  }
  .intr-gm-actions button.del:hover {
    background: #300;
    color: #f55;
    border-color: #f00;
  }

  /* MODAIS GM INTRÍNSECAS */
  .intr-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    z-index: 25000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 15px;
  }
  .intr-modal-box {
    width: 520px;
    max-width: 95vw;
    max-height: 82vh;
    background: #0a0a0d;
    border: 1px solid var(--c-primary, #00ff41);
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.9);
  }
  .intr-modal-header {
    padding: 10px 15px;
    background: rgba(0, 255, 65, 0.1);
    border-bottom: 1px solid #222;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: var(--c-primary, #00ff41);
    font-family: var(--font-head);
    font-size: 12px;
    font-weight: bold;
  }
  .intr-modal-header button {
    background: transparent;
    border: 1px solid #444;
    color: #ccc;
    width: 24px;
    height: 24px;
    cursor: pointer;
  }
  .intr-modal-search {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: #050505;
    border-bottom: 1px solid #222;
    color: #777;
  }
  .intr-modal-search input {
    flex: 1;
    background: transparent;
    border: none;
    color: #fff;
    outline: none;
    font-size: 12px;
  }
  .intr-store-list {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .intr-store-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    background: #121216;
    border: 1px solid #262626;
    border-radius: 4px;
    cursor: pointer;
    transition: 0.2s;
  }
  .intr-store-row:hover {
    border-color: var(--c-primary, #00ff41);
    background: #18181f;
  }
  .intr-store-row img {
    width: 36px;
    height: 36px;
    border: 1px solid #333;
    border-radius: 4px;
    object-fit: cover;
  }
  .s-det {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .s-det strong {
    font-size: 12px;
    color: #fff;
  }
  .s-det small {
    font-size: 10px;
    color: #888;
  }
  .s-import-btn {
    background: rgba(0, 255, 65, 0.12);
    border: 1px solid var(--c-primary, #00ff41);
    color: var(--c-primary, #00ff41);
    font-size: 10px;
    font-weight: bold;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
  }
  .intr-empty-msg {
    padding: 25px;
    text-align: center;
    color: #666;
    font-size: 12px;
  }
  .intr-form-body {
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .intr-form-body label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 10px;
    color: #999;
    font-weight: bold;
  }
  .intr-form-body input,
  .intr-form-body select,
  .intr-form-body textarea {
    background: #050505;
    border: 1px solid #333;
    color: #fff;
    padding: 8px;
    border-radius: 4px;
    font-family: inherit;
    font-size: 12px;
  }
  .intr-save-btn {
    background: var(--c-primary, #00ff41);
    color: #000;
    border: none;
    padding: 10px;
    font-weight: bold;
    border-radius: 4px;
    cursor: pointer;
  }

  .list-container { flex: 1; overflow-y: auto; padding-right: 5px; z-index: 1; border-top: 1px solid rgba(255,255,255,0.1); border-bottom: 1px solid rgba(255,255,255,0.1); }
  .powers-grid { display: flex; flex-direction: column; gap: 8px; padding-top: 5px; }
  .list-container::-webkit-scrollbar, .custom-scroll::-webkit-scrollbar { width: 6px; }
  .list-container::-webkit-scrollbar-track, .custom-scroll::-webkit-scrollbar-track { background: transparent; }
  .list-container::-webkit-scrollbar-thumb, .custom-scroll::-webkit-scrollbar-thumb { background: #333; border: 1px solid #000; border-radius: 3px; }
  .list-container::-webkit-scrollbar-thumb:hover, .custom-scroll::-webkit-scrollbar-thumb:hover { background: var(--c-primary); }
  .empty-state { height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: #666; border: 1px dashed #333; border-radius: var(--border-radius); margin-top: 20px; background: rgba(0,0,0,0.2); padding: 0 20px; text-align: center; }
  .glitch-wrapper { font-size: 3em; opacity: 0.5; position: relative; animation: glitch 3s infinite; color: var(--c-primary); }
  .empty-title { font-weight: bold; color: #888; font-size: 1em; letter-spacing: 1px; font-family: var(--font-head); }
  .empty-sub { font-size: 0.75em; }
  .term-footer { display: flex; justify-content: space-between; font-size: 0.6em; color: #555; z-index: 1; padding: 0 5px; font-family: var(--font-head); margin-top: auto; }
  .loading-state { text-align: center; color: var(--c-primary); margin-top: 50px; font-family: var(--font-head); }
  @keyframes scan-bar { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  @keyframes glitch { 0% { transform: translate(0); } 2% { transform: translate(-2px, 2px); } 4% { transform: translate(2px, -2px); } 6% { transform: translate(0); } 100% { transform: translate(0); } }
</style>
