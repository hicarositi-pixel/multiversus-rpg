<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { slide } from 'svelte/transition';
  import { THEME_DB } from '../data/ThemeDB.js';
  import { loadPowerThemes } from '../utils/ThemeLoader.js';
  import { getBasePowerXP, normalizePowerCategoryAndRarity } from '../utils/PowerRules.js';
  import { CustomThemeDB } from '../database/CustomThemeDB.js';

  export let item;
  export let actor;
  export let isGM = false;

  const dispatch = createEventDispatcher();
  const MODULE_ID = "multiversus-rpg";

  let themeRevision = 0;
  let hookThemesId;
  let hookPassId;

  onMount(() => {
    CustomThemeDB.syncAll();
    loadPowerThemes();
    syncLocalVars();
    themeRevision++;
    hookThemesId = Hooks.on("nexusThemesUpdated", () => {
      loadPowerThemes(true);
      themeRevision++;
    });
    hookPassId = Hooks.on("passSystemUpdate", () => {
      themeRevision++;
    });
  });

  onDestroy(() => {
    if (hookThemesId) Hooks.off("nexusThemesUpdated", hookThemesId);
    if (hookPassId) Hooks.off("passSystemUpdate", hookPassId);
  });

  $: talentThemesMap = (themeRevision >= 0) ? { ...THEME_DB } : THEME_DB;
  $: visibleTalentThemes = Object.entries(talentThemesMap).filter(([key, data]) => {
    if (isGM) return true;
    if (data?.hideWhenLocked && !CustomThemeDB.canUserUseTheme(data, game.user)) return false;
    return true;
  });
  $: isTalentThemeLocked = (data) => (themeRevision >= 0) && !CustomThemeDB.canUserUseTheme(data, game.user);

  $: flags = item?.flags?.[MODULE_ID] || {};
  $: img = item?.img || "icons/svg/item-bag.svg";
  $: realName = item?.name || "Desconhecido";

  $: diceData = flags.dice || {};
  $: dNormal = diceData.normal || 0;
  $: dHard = diceData.hard || 0;
  $: dWiggle = diceData.wiggle || 0;
  $: totalDice = dNormal + dHard + dWiggle;

  $: category = flags.category || "principal";
  $: rarity = flags.rarity || "Comum";
  $: isInitial = flags.isInitial || false;

  $: baseCost = getBasePowerXP(category, rarity);

  $: rawCost = (dNormal * baseCost) + (dHard * baseCost * 2) + (dWiggle * baseCost * 4);
  $: discount = isInitial ? (4 * baseCost) : 0;
  $: currentCost = Math.max(0, rawCost - discount);

  $: xpEarned = actor.system?.xp || actor.flags?.[MODULE_ID]?.xp || 0;
  $: totalCap = 150 + xpEarned;
  $: totalSpent = actor.flags?.[MODULE_ID]?.totalSpent || 0;
  $: availableXP = totalCap - totalSpent;

  let editAlias = "";
  let editTheme = "default";
  let editColor = "#ffffff";
  let isExpanded = false;
  let isConfiguring = false;
  let showHabilidades = false;

  $: {
      if (flags && !isConfiguring) {
          if (editAlias !== (flags.customAlias || "") || editTheme !== (flags.animationTheme || 'default')) {
              syncLocalVars();
          }
      }
  }

  function syncLocalVars() {
      editAlias = flags.customAlias || "";
      editTheme = (flags.animationTheme && THEME_DB[flags.animationTheme]) ? flags.animationTheme : 'default';
      editColor = flags.customColor || "#ffffff";
  }

  $: activeDisplayTheme = isConfiguring ? editTheme : (flags.animationTheme || 'default');
  $: currentThemeData = talentThemesMap[activeDisplayTheme] || talentThemesMap['default'] || THEME_DB['default'] || { color: '#00ff41' };
  
  $: displayName = flags.customAlias || realName;
  const RARITY_COLORS = { "Comum": "#a0a0a0", "Raro": "#00bfff", "Lendário": "#ffa500", "Mítico": "#ff4500", "Universal": "#ffffff", "Multiversal": "#d000ff" };
  $: glowColor = (isConfiguring ? editColor : flags.customColor) || currentThemeData.color || RARITY_COLORS[rarity] || "#00ff41";

  async function saveSettings() {
    await item.update({
      [`flags.${MODULE_ID}.customAlias`]: editAlias,
      [`flags.${MODULE_ID}.customColor`]: editColor, 
      [`flags.${MODULE_ID}.animationTheme`]: editTheme
    });
    isConfiguring = false;
    ui.notifications.info(`Visual salvo!`);
  }

  let isUpdating = false;

  async function upgradeDice(type) {
    if (!item || isUpdating) return;
    
    let cost = (type === 'wiggle') ? baseCost * 4 : (type === 'hard') ? baseCost * 2 : baseCost;
    
    if (!isGM && availableXP < cost) {
        ui.notifications.warn(`XP Insuficiente! Precisa de ${cost}, tem ${availableXP}.`);
        return;
    }

    isUpdating = true; 

    const currentVal = diceData[type] || 0;
    const newVal = currentVal + 1;
    const remaining = availableXP - cost;

    Hooks.call("nexusPointSpent", actor.name, category === "habilidade" ? "Habilidade" : "Talento", `${displayName} (${type}): ${currentVal} ➔ ${newVal}`, cost, remaining);
      
    let newDiceData = { normal: dNormal, hard: dHard, wiggle: dWiggle, ...diceData };
    newDiceData[type] = newVal;

    await item.update({ [`flags.${MODULE_ID}.dice`]: newDiceData });
    
    setTimeout(() => { isUpdating = false; }, 300);
  }

  function resetColor() { editColor = ""; }

  function toggleConfig() {
      isConfiguring = !isConfiguring;
      if (isConfiguring) { isExpanded = false; syncLocalVars(); }
  }

  function openSheet() { item?.sheet?.render(true); }
  async function deletePower() { await item.delete(); }

  function handleDragStart(event) {
      const dragData = {
          type: "Item",
          uuid: item.uuid,
          data: item.toObject()
      };
      event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
      event.stopPropagation();
  }

  async function handleDropOnCard(event) {
      event.preventDefault();
      event.stopPropagation();
      if (category === "habilidade" || category === "item" || category === "intrinseca") return;
      if (category === "secundario") {
          ui.notifications.warn("Talentos Secundários não podem receber Habilidades Especiais.");
          return;
      }

      const dataText = event.dataTransfer.getData('text/plain');
      if (!dataText) return;

      try {
          const dropData = JSON.parse(dataText);
          if (dropData.type === "Item" && dropData.data) {
              let itemData = foundry.utils.deepClone(dropData.data);
              const validTypes = game.documentTypes.Item;
              if (validTypes.includes("power")) itemData.type = "power";

              if (itemData.type !== "power") return;
              if (itemData.flags?.[MODULE_ID]?.category !== "habilidade") return;

              const habRar = itemData.flags?.[MODULE_ID]?.rarity || "Comum";
              const isRareHab = habRar === "Raro" || habRar === "Comum";

              if (category === "memoria" && !isRareHab) {
                  ui.notifications.warn("Memórias só podem ter Habilidades Especiais de categoria Raro vinculadas!");
                  return;
              }

              if (dropData.uuid && dropData.uuid.includes(actor.id)) {
                  const existingItem = actor.items.get(itemData._id);
                  if (existingItem) {
                      const upd = { [`flags.${MODULE_ID}.parentId`]: item.id };
                      if (isRareHab) upd[`flags.${MODULE_ID}.rarity`] = "Raro";
                      await existingItem.update(upd);
                      ui.notifications.info(`Habilidade anexada a [${realName}].`);
                  }
                  return;
              }

              delete itemData._id;
              if (!itemData.flags) itemData.flags = {};
              if (!itemData.flags[MODULE_ID]) itemData.flags[MODULE_ID] = {};
              itemData.flags[MODULE_ID].parentId = item.id;
              if (isRareHab) itemData.flags[MODULE_ID].rarity = "Raro";

              await actor.createEmbeddedDocuments("Item", [itemData]);
              ui.notifications.info(`[${itemData.name}] anexada a [${realName}].`);
          }
      } catch (e) {
          console.error("Falha ao receber habilidade na carta:", e);
      }
  }

  $: availableParents = (category === "habilidade" && actor?.items)
      ? actor.items.filter(i => {
          if (i.type !== "power" || i.id === item.id) return false;
          const pCat = i.flags?.[MODULE_ID]?.category || "principal";
          if (pCat === "principal" || pCat === "origem") return true;
          if (pCat === "memoria" && (rarity === "Raro" || rarity === "Comum")) return true;
          return false;
      })
      : [];

  async function changeParentLink(newParentId) {
      if (!item) return;
      if (!newParentId) {
          await item.unsetFlag(MODULE_ID, "parentId");
          ui.notifications.info(`[${realName}] desvinculada.`);
      } else {
          await item.update({ [`flags.${MODULE_ID}.parentId`]: newParentId });
          ui.notifications.info(`[${realName}] vinculada com sucesso.`);
      }
  }

  $: childHabilidades = item.childHabilidades || [];
</script>

{#if item}
<div 
  class="power-card theme-{activeDisplayTheme} {category === 'habilidade' ? 'is-habilidade' : ''}" 
  style="--glow: {glowColor};"
  class:expanded={isExpanded || isConfiguring}
  draggable="true" 
  on:dragstart={handleDragStart}
  on:drop={handleDropOnCard}
  on:dragover={(e) => { if (category === 'principal' || category === 'origem' || category === 'memoria') e.preventDefault(); }}
>
  <div class="card-front">
    <div class="icon-box" on:click={openSheet} title="Abrir Ficha Técnica">
      <img src={img} alt={realName} class="power-img"/>
      <div class="fx-overlay"></div>
    </div>

    <div class="info-box" on:click={() => { isExpanded = !isExpanded; isConfiguring = false; }}>
      <div class="header-row">
        <span class="power-name">{displayName}</span>
        <span class="xp-badge">{currentCost} XP</span>
      </div>
      <div class="meta-row">
        <span class="meta-tag">{category === 'memoria' ? 'MEMÓRIA' : category.toUpperCase()}</span>
        <span class="meta-tag rar-tag">{rarity.toUpperCase()}</span>
        <span class="dice-count">TOTAL: <strong>{totalDice}</strong></span>
        <button type="button" class="viz-open-btn" on:click|stopPropagation={() => dispatch('visualize', item)} title="Abrir Visualização HTML/CSS">
          <i class="fas fa-eye"></i> Abrir Visualização
        </button>
        {#if childHabilidades.length > 0}
           <button class="hab-count" on:click|stopPropagation={() => showHabilidades = !showHabilidades}>
               <i class="fas {showHabilidades ? 'fa-chevron-down' : 'fa-link'}"></i> {childHabilidades.length} Habilidades
           </button>
        {/if}
      </div>
    </div>

    <div class="action-box">
      <button class="btn-icon roll" style="color:var(--c-primary, #00ff41)" title="Rolar Talento" on:click|stopPropagation={() => dispatch('roll', item)}>
        <i class="fas fa-dice-d20"></i>
      </button>
      <button class="btn-icon gear" class:active={isConfiguring} on:click|stopPropagation={toggleConfig}>
        <i class="fas fa-cog"></i>
      </button>
      <button class="btn-icon arrow" on:click={() => { isExpanded = !isExpanded; isConfiguring = false; }}>
        <i class="fas fa-chevron-{isExpanded ? 'up' : 'down'}"></i>
      </button>
    </div>
  </div>

  {#if isConfiguring}
    <div class="panel-drawer config-panel" on:click|stopPropagation>
      <div class="drawer-header">>>> PERSONALIZAÇÃO</div>
      <div class="config-grid">
        <div class="field-group">
          <label>APELIDO</label>
          <input type="text" bind:value={editAlias} placeholder={realName} class="interactive-input"/>
        </div>
        <div class="field-group highlight-group">
          <label>ESCOLHER TEMA</label>
          <div class="theme-selector-grid">
            {#each visibleTalentThemes as [key, data] (key)}
              {@const locked = isTalentThemeLocked(data)}
              <button 
                class="theme-option" 
                class:selected={editTheme === key}
                class:locked={locked}
                disabled={locked}
                on:click={() => !locked && (editTheme = key)}
                style="--theme-preview-color: {data.color}"
                title={locked ? `${data.label}: ${CustomThemeDB.getAccessRequirementLabel(data)}` : (data.desc || data.label)}
              >
                <i class="fas {locked ? 'fa-lock' : (data.icon || 'fa-bolt')} theme-icon"></i>
                <span class="theme-label">{data.label}</span>
                {#if locked}
                  <span class="theme-lock-badge">{CustomThemeDB.getAccessRequirementLabel(data)}</span>
                {:else if isGM && ((data.minPassTier && data.minPassTier !== 'cobre') || (data.allowedUsers && data.allowedUsers.length > 0))}
                  <span class="theme-lock-badge gm">{CustomThemeDB.getAccessRequirementLabel(data)}</span>
                {/if}
              </button>
            {/each}
          </div>
        </div>
        <div class="field-group">
          <label>COR DO LED</label>
          <div class="color-row">
            <input type="color" bind:value={editColor} class="interactive-input color-picker" />
            <button class="btn-reset" on:click={resetColor}>RESET</button>
          </div>
        </div>
      </div>
      <button class="btn-save-cfg" on:click={saveSettings}><i class="fas fa-save"></i> OFICIALIZAR</button>
    </div>
  {/if}

  {#if isExpanded}
    <div class="panel-drawer upgrade-panel">
      <div class="xp-hud" class:broke={availableXP <= 0}>
        <div class="xp-label">XP DISPONÍVEL</div>
        <div class="xp-value">{availableXP}</div>
      </div>
      
      <div class="dice-matrix">
        <div class="die-card normal" class:affordable={availableXP >= baseCost}>
          <div class="die-header">
            <div class="die-icon normal"><i class="fas fa-dice-d10"></i></div>
            <span class="die-text">NORMAL</span>
          </div>
          <div class="die-screen">{dNormal}</div>
          <button class="btn-buy" disabled={!isGM && availableXP < baseCost} on:click={() => upgradeDice('normal')}>
            <span class="lbl">UPGRADE</span>
            <span class="cost">{baseCost} XP</span>
          </button>
        </div>

        <div class="die-card hard" class:affordable={availableXP >= baseCost*2}>
          <div class="die-header">
            <div class="die-icon hard"><i class="fas fa-dice-d6"></i></div>
            <span class="die-text">HARD</span>
          </div>
          <div class="die-screen">{dHard}</div>
          <button class="btn-buy" disabled={!isGM && availableXP < baseCost*2} on:click={() => upgradeDice('hard')}>
            <span class="lbl">UPGRADE</span>
            <span class="cost">{baseCost*2} XP</span>
          </button>
        </div>

        <div class="die-card wiggle" class:affordable={availableXP >= baseCost*4}>
          <div class="die-header">
            <div class="die-icon wiggle"><i class="fas fa-dice-d20"></i></div>
            <span class="die-text">WIGGLE</span>
          </div>
          <div class="die-screen">{dWiggle}</div>
          <button class="btn-buy" disabled={!isGM && availableXP < baseCost*4} on:click={() => upgradeDice('wiggle')}>
            <span class="lbl">UPGRADE</span>
            <span class="cost">{baseCost*4} XP</span>
          </button>
        </div>
      </div>

      {#if category === 'habilidade'}
        <div class="link-parent-row" on:click|stopPropagation>
          <label><i class="fas fa-link"></i> VINCULAR HABILIDADE A:</label>
          <select value={flags.parentId || ""} on:change={(e) => changeParentLink(e.target.value)}>
            <option value="">Sem vínculo (Solta em Principais)</option>
            {#each availableParents as p}
              <option value={p.id}>{p.name} ({(p.flags?.[MODULE_ID]?.category || 'principal') === 'memoria' ? 'Memória' : 'Principal'})</option>
            {/each}
          </select>
        </div>
      {/if}

      {#if isGM}
        <button class="gm-delete" on:click={deletePower}><i class="fas fa-trash"></i> DELETAR {category.toUpperCase()} (GM)</button>
      {/if}
    </div>
  {/if}

  {#if childHabilidades.length > 0 && showHabilidades}
     <div class="habilidades-container">
        {#each childHabilidades as hab (hab.id)}
           <svelte:self item={hab} actor={actor} isGM={isGM} on:roll on:visualize />
        {/each}
     </div>
  {/if}
</div>
{/if}

<style>
/* CSS do seu código original MANTIDO */
.viz-open-btn { background: rgba(0, 255, 65, 0.08); color: var(--glow, #00ff41); padding: 2px 8px; border-radius: 4px; border: 1px solid var(--glow, #00ff41); font-size: 0.9em; font-weight: bold; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 5px; font-family: inherit; }
.viz-open-btn:hover { background: var(--glow, #00ff41); color: #000; box-shadow: 0 0 8px var(--glow, #00ff41); }
.rar-tag { color: var(--glow, #aaa); border-color: rgba(255,255,255,0.18); }
.link-parent-row { margin-top: 12px; display: flex; align-items: center; gap: 8px; background: #141414; border: 1px dashed #333; padding: 6px 10px; border-radius: 4px; }
.link-parent-row label { font-size: 0.7em; color: #aaa; font-weight: bold; white-space: nowrap; }
.link-parent-row select { flex: 1; background: #080808; border: 1px solid #444; color: #fff; padding: 4px 6px; border-radius: 4px; font-size: 0.8em; }
.power-card { background: #050505; border: 1px solid #333; border-left: 4px solid var(--glow); border-radius: 6px; margin-bottom: 10px; font-family: 'Segoe UI', sans-serif; position: relative; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.5); transition: 0.3s; cursor: grab;}
.power-card.is-habilidade { margin-left: 20px; border-left-width: 2px; opacity: 0.95; transform: scale(0.98); margin-bottom: 5px; box-shadow: none; border: 1px dashed #444; }
.power-card:active { cursor: grabbing; }
.power-card:hover { box-shadow: 0 0 15px var(--glow); border-color: var(--glow); }
.card-front { display: flex; align-items: center; padding: 10px 8px; min-height: 72px; background: linear-gradient(90deg, #111 0%, #080808 100%); position: relative; z-index: 10; }
.icon-box { width: 52px; height: 52px; margin-right: 12px; cursor: pointer; border: 1px solid #444; border-radius: 8px; overflow: hidden; position: relative; }
.power-img { width: 100%; height: 100%; object-fit: cover; }
.info-box { flex: 1; cursor: pointer; }
.header-row { display: flex; justify-content: space-between; align-items: center; padding-right: 10px; }
.power-name { font-weight: 800; color: #fff; text-transform: uppercase; text-shadow: 0 0 5px rgba(0,0,0,0.8); }
.xp-badge { font-size: 0.75em; color: #000; background: var(--glow); padding: 2px 8px; border-radius: 12px; font-weight: bold; }
.meta-row { display: flex; gap: 10px; margin-top: 4px; font-size: 0.75em; color: #777; align-items: center; }
.meta-tag { background: #222; padding: 2px 6px; border-radius: 4px; border: 1px solid #333; }
.hab-count { background: rgba(0,255,255,0.1); color: #0ff; padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(0,255,255,0.3); font-size: 0.9em; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 4px;}
.hab-count:hover { background: rgba(0, 255, 255, 0.2); }
.dice-count strong { color: #fff; font-size: 1.1em; }
.action-box { display: flex; flex-direction: column; gap: 6px; padding-left: 10px; border-left: 1px solid #222; }
.btn-icon { background: transparent; border: none; color: #444; cursor: pointer; font-size: 1.1em; transition: 0.2s; }
.btn-icon:hover { color: #fff; }
.btn-icon.active { color: var(--glow); }
.panel-drawer { background: #0c0c0c; border-top: 1px solid var(--glow); padding: 12px; position: relative; }
.drawer-header { font-size: 0.7em; color: var(--glow); font-weight: bold; margin-bottom: 12px; }
.theme-selector-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; max-height: 150px; overflow-y: auto; padding: 2px; background: rgba(0,0,0,0.3); border: 1px solid #333; border-radius: 4px; }
.theme-option { background: #1a1a1a; border: 1px solid #333; border-left: 3px solid var(--theme-preview-color); color: #888; padding: 6px; border-radius: 4px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px; transition: 0.2s; }
.theme-option:hover:not(.locked), .theme-option.selected { background: #000; border-color: var(--glow); color: var(--glow); box-shadow: 0 0 5px var(--glow); }
.theme-option.locked { opacity: 0.45; cursor: not-allowed; filter: grayscale(0.6); }
.theme-lock-badge { font-size: 0.5em; color: #ff5555; background: rgba(255,0,0,0.12); border: 1px solid rgba(255,68,68,0.35); padding: 1px 4px; border-radius: 3px; text-align: center; line-height: 1.1; }
.theme-lock-badge.gm { color: #00e5ff; background: rgba(0,229,255,0.1); border-color: rgba(0,229,255,0.35); }
.theme-icon { font-size: 1.2em; } .theme-label { font-size: 0.6em; font-weight: bold; text-align: center; }
.config-grid { display: flex; flex-direction: column; gap: 10px; }
.field-group label { font-size: 0.7em; color: #aaa; margin-bottom: 4px; display: block; font-weight: bold; }
.interactive-input { background: #111; border: 1px solid #444; color: #fff; padding: 8px; width: 100%; border-radius: 4px; }
.highlight-group { border: 1px dashed #444; padding: 8px; border-radius: 4px; background: rgba(255,255,255,0.02); }
.color-row { display: flex; gap: 8px; }
.color-picker { padding: 0; width: 50px; height: 32px; cursor: pointer; }
.btn-reset { flex: 1; background: #222; border: 1px solid #444; color: #aaa; cursor: pointer; border-radius: 4px; }
.btn-save-cfg { width: 100%; margin-top: 15px; background: var(--glow); color: #000; border: none; padding: 10px; font-weight: bold; cursor: pointer; border-radius: 4px; }
.xp-hud { background: #000; border: 1px solid #333; border-radius: 6px; padding: 6px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.xp-hud.broke { border-color: #500; } .xp-hud.broke .xp-value { color: #f55; }
.xp-label { font-size: 0.7em; color: #888; font-weight: bold; } .xp-value { font-size: 1.2em; color: var(--glow); font-weight: bold; font-family: monospace; }
.dice-matrix { display: flex; gap: 8px; }
.die-card { flex: 1; background: #151515; border: 1px solid #333; border-radius: 6px; display: flex; flex-direction: column; align-items: center; padding: 8px 4px; transition: 0.3s; }
.die-card.affordable:hover { border-color: var(--glow); transform: translateY(-2px); }
.die-header { width: 100%; text-align: center; border-bottom: 1px dashed #333; padding-bottom: 4px; margin-bottom: 6px; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.die-icon { font-size: 1.8em; margin-bottom: 2px; height: 32px; display: flex; align-items: center; justify-content: center; transition: 0.3s; }
.die-icon i { color: #888; transition: 0.3s; } 
.die-text { font-size: 0.65em; font-weight: bold; color: #888; }
.die-screen { font-size: 2em; font-weight: 900; color: #fff; margin-bottom: 8px; text-shadow: 0 2px 4px #000; line-height: 1; }
.btn-buy { width: 90%; border: none; background: #222; color: #555; border-radius: 4px; padding: 6px 2px; cursor: not-allowed; display: flex; flex-direction: column; align-items: center; gap: 2px; transition: 0.2s; }
.die-card.affordable .btn-buy { background: #333; color: #fff; cursor: pointer; border: 1px solid #555; }
.die-card.affordable .btn-buy:hover { background: var(--glow); border-color: var(--glow); color: #000; box-shadow: 0 0 10px var(--glow); }
.btn-buy .lbl { font-size: 0.6em; font-weight: bold; } .btn-buy .cost { font-size: 0.75em; font-weight: bold; }
.gm-delete { width: 100%; margin-top: 15px; background: #110000; border: 1px solid #300; color: #844; font-size: 0.7em; padding: 8px; cursor: pointer; border-radius: 4px; }

.habilidades-container {
    padding: 10px 10px 0 10px;
    background: rgba(0,0,0,0.3);
    border-top: 1px dashed #333;
}
</style>