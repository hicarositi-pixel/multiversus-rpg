<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import { PowerDatabase } from '../PowerDatabase.js';
    
    // Importando as suas bases de dados originais
    import { EXTRAS_DB } from '../../data/extras-data.js';
    import { FLAWS_DB } from '../../data/flaws-data.js';

    const dispatch = createEventDispatcher();
    const MODULE_ID = "multiversus-rpg";

    // --- REGRAS DO SISTEMA ---
    const XP_RULES = { "origem": 0, "principal": 8, "secundario": 4, "habilidade": 2 };
    const PB_BASE_VALUES = { "Comum": 2, "Raro": 4, "Lendário": 8, "Mítico": 12, "Universal": 16, "Multiversal": 32 };
    const PB_MULTIPLIERS = { "origem": 1, "principal": 1, "secundario": 0.5, "habilidade": 0.25 };
    const CAP_TYPES = ['mass', 'range', 'speed', 'self', 'touch'];

    // ========================================================================
    // RECEPTOR DE DADOS EXTERNOS (O FIO DE CONEXÃO COM A DATABASE)
    // ========================================================================
    export let powerToEdit = null;

    $: if (powerToEdit) {
        loadPowerForEditing(powerToEdit);
        powerToEdit = null; // Reseta para não ficar em loop infinito de carregamento
    }

    // --- CONTROLE DAS TAGS ---
    let tagsString = "";

    // --- CONTROLE DO BLOCO DE NOTAS (MODAL) ---
    let notepadState = { open: false, type: null, text: "" };

    function openNotepad(type) {
        notepadState.type = type;
        notepadState.text = type === 'effect' ? draft.effect : draft.qualities[activeQIndex].description;
        notepadState.open = true;
    }

    function closeNotepad() {
        if (notepadState.type === 'effect') draft.effect = notepadState.text;
        else if (notepadState.type === 'quality') draft.qualities[activeQIndex].description = notepadState.text;
        notepadState.open = false;
    }

    function loadPowerForEditing(p) {
        // Se vier da Database, os atributos estão em p.category, p.dice, etc.
        // Se vier como uma ficha crua, estão nas flags. O código tenta achar nos dois.
        const rawFlags = p.rawItem?.flags?.[MODULE_ID] || {};
        
        draft = {
            id: p.id || null, // Guardamos o ID! Assim, quando salvar, ele atualiza o existente em vez de criar um clone.
            name: p.name || "Poder Sem Nome",
            category: p.category || rawFlags.category || "principal",
            rarity: p.rarity || rawFlags.rarity || "Raro",
            dice: foundry.utils.deepClone(p.rawItem?.flags?.[MODULE_ID]?.dice || { normal: 0, hard: 0, wiggle: 0 }),
            qualities: foundry.utils.deepClone(p.rawItem?.flags?.[MODULE_ID]?.qualities || []),
            effect: p.rawItem?.system?.notes || ""
        };
        
        activeQIndex = draft.qualities.length > 0 ? 0 : -1;
        ui.notifications.info(`Padrão [${draft.name}] carregado no Estúdio para edição.`);
        tagsString = (rawFlags.tags || []).join(", ");
    }

    // --- ESTADO DO RASCUNHO (DRAFT VAZIO PADRÃO) ---
    let draft = {
        id: null, // Agora o draft precisa do campo ID
        name: "Novo Poder",
        category: "principal",
        rarity: "Raro",
        dice: { normal: 0, hard: 0, wiggle: 0 },
        qualities: [],
        effect: ""
    };

    let activeQIndex = -1;

    // --- CÁLCULOS EM TEMPO REAL ---
    $: baseCost = XP_RULES[draft.category] || 0;
    $: xpCost = (draft.dice.normal * baseCost) + (draft.dice.hard * baseCost * 2) + (draft.dice.wiggle * baseCost * 4);
    
    $: maxPB = Math.floor((PB_BASE_VALUES[draft.rarity] || 2) * (PB_MULTIPLIERS[draft.category] || 1));
    
    $: usedPB = draft.qualities.reduce((total, q) => {
        const extrasCost = q.extras.reduce((sum, e) => sum + (e.cost * (e.qty || 1)), 0);
        return total + 2 + (q.level || 0) + extrasCost;
    }, 0);

    // --- PREVIEW VISUAL (HTML Livro) ---
    $: bookFormatHTML = generateBookHTML(draft, usedPB);

    function generateBookHTML(d, pb) {
        if (d.qualities.length === 0) return `<div class="placeholder-text">Adicione uma Sub-rotina (Qualidade) para iniciar.</div>`;

        let activeQTypes = d.qualities.map(q => q.type === 'atk' ? 'A' : q.type === 'def' ? 'D' : 'U');

        let html = `<div class="book-title"><strong>${d.name}</strong> (${pb} PB)</div>`;
        html += `<div class="book-line"><em>Qualities:</em> ${[...new Set(activeQTypes)].join(" ")}.</div>`;

        d.qualities.forEach((q, i) => {
            const typeLetter = q.type === 'atk' ? 'Ataque' : q.type === 'def' ? 'Defesa' : 'Útil';
            
            const mods = q.extras.map(m => `${m.name} ${m.cost > 0 ? '+' : ''}${m.cost}${m.qty > 1 ? ` <strong>(x${m.qty})</strong>` : ''}`);
            const modString = mods.length > 0 ? mods.join(", ") + ". " : "None. ";
            const capString = q.capacities.map(c => c.type).join(", ") || "None";
            
            html += `<div class="book-line" style="margin-top: 8px;"><strong>Sub-rotina #${i+1}: ${q.name} (Nv ${q.level})</strong></div>`;
            html += `<div class="book-line"><em>${typeLetter} Extras and Flaws:</em> ${modString}<em>Capacities:</em> ${capString}.</div>`;
            if (q.description) {
                html += `<div class="book-line" style="padding-left: 10px; font-size: 0.9em; color: #555; border-left: 2px solid #ccc; margin-left: 5px;">${q.description}</div>`;
            }
        });

        html += `<div class="book-line" style="margin-top: 10px;"><em>Effect:</em> ${d.effect || "Sem descrição narrativa."}</div>`;
        return html;
    }

    // --- TRADUTOR JS (Exportar Texto Limpo) ---
    function exportToText() {
        if (draft.qualities.length === 0) return ui.notifications.warn("Adicione qualidades antes de exportar.");

        let text = `${draft.name.toUpperCase()} (${usedPB} PB | ${xpCost} XP)\n`;
        text += `Categoria: ${draft.category.toUpperCase()} | Raridade: ${draft.rarity.toUpperCase()}\n`;
        text += `Dados: ${draft.dice.normal}d + ${draft.dice.hard}hd + ${draft.dice.wiggle}wd\n\n`;

        let activeQTypes = draft.qualities.map(q => q.type === 'atk' ? 'A' : q.type === 'def' ? 'D' : 'U');
        text += `Qualities: ${[...new Set(activeQTypes)].join(" ")}\n\n`;

        draft.qualities.forEach((q, i) => {
            const typeLetter = q.type === 'atk' ? 'Ataque' : q.type === 'def' ? 'Defesa' : 'Útil';
            const mods = q.extras.map(m => `${m.name} ${m.cost > 0 ? '+' : ''}${m.cost}${m.qty > 1 ? ` (x${m.qty})` : ''}`);
            const modString = mods.length > 0 ? mods.join(", ") + "." : "None.";
            const capString = q.capacities.map(c => c.type).join(", ") || "None";

            text += `Sub-rotina #${i+1}: ${q.name} (Nv ${q.level})\n`;
            text += `${typeLetter} Extras and Flaws: ${modString} Capacities: ${capString}.\n`;
            if (q.description) text += `> ${q.description}\n`;
            text += `\n`;
        });

        text += `Effect: ${draft.effect || "Sem descrição narrativa."}`;

        navigator.clipboard.writeText(text).then(() => {
            ui.notifications.info("Texto do Poder copiado para a Área de Transferência!");
        }).catch(err => {
            console.error(err);
            ui.notifications.error("Erro ao copiar o texto.");
        });
    }

    // --- GERENCIAMENTO DE QUALIDADES ---
    function addQuality() {
        draft.qualities.push({
            id: foundry.utils.randomID(),
            name: "Nova Sub-rotina",
            type: "atk",
            level: 0,
            description: "",
            capacities: [],
            extras: [] 
        });
        draft = draft;
        activeQIndex = draft.qualities.length - 1;
    }

    function removeQuality(idx) {
        draft.qualities.splice(idx, 1);
        draft = draft;
        activeQIndex = draft.qualities.length > 0 ? 0 : -1;
    }

    // --- GERENCIAMENTO DE MODS ---
    function addMod(modItem) {
        if (activeQIndex < 0) return;
        let q = draft.qualities[activeQIndex];
        let existing = q.extras.find(e => e.id === modItem.id);
        
        if (existing) {
            existing.qty = (existing.qty || 1) + 1;
        } else {
            q.extras.push({ id: modItem.id, name: modItem.name, cost: modItem.cost, qty: 1 });
        }
        draft = draft;
    }

    function removeMod(modItem) {
        if (activeQIndex < 0) return;
        let q = draft.qualities[activeQIndex];
        let idx = q.extras.findIndex(e => e.id === modItem.id);
        
        if (idx >= 0) {
            if (q.extras[idx].qty > 1) {
                q.extras[idx].qty -= 1;
            } else {
                q.extras.splice(idx, 1);
            }
        }
        draft = draft;
    }

    function getModQty(modId) {
        if (activeQIndex < 0) return 0;
        let found = draft.qualities[activeQIndex].extras.find(e => e.id === modId);
        return found ? (found.qty || 1) : 0;
    }

    function toggleCap(type) {
        if (activeQIndex < 0) return;
        let q = draft.qualities[activeQIndex];
        const idx = q.capacities.findIndex(c => c.type === type);
        
        if (idx >= 0) q.capacities.splice(idx, 1);
        // Agora salva um OBJETO em vez de String, pra ficha entender nativamente
        else q.capacities.push({ type: type, nul: 0, booster: 0, collapsed: false });
        draft = draft;
    }

    function hasCap(type) {
        if (activeQIndex < 0) return false;
        return draft.qualities[activeQIndex].capacities.some(c => c.type === type);
    }

    // --- SALVAR NO DATA CORE ---
async function compilePower() {
        if (draft.qualities.length === 0) return ui.notifications.warn("O poder precisa de pelo menos uma Qualidade (Sub-rotina).");
        
        // Vamos garantir que não existe nenhuma reatividade bizarra presa nesses arrays
        const safeDice = JSON.parse(JSON.stringify(draft.dice));
        const safeQualities = JSON.parse(JSON.stringify(draft.qualities));

        const itemToSave = {
            id: draft.id, 
            name: draft.name,
            category: draft.category,
            rarity: draft.rarity,
            img: "icons/svg/lightning.svg",
            
            // rawItem VAI SER O OBJETO CRU E ABSOLUTO. SEM CHAVES DINÂMICAS QUEBRADAS.
            rawItem: {
                name: draft.name,
                img: "icons/svg/lightning.svg",
                type: "power", // <- MUITO IMPORTANTE! Faltava o type aqui pra Ficha não quebrar.
                flags: {
                    "multiversus-rpg": {
                        category: draft.category,
                        rarity: draft.rarity,
                        dice: safeDice,
                        qualities: safeQualities,
                        isInitial: false,
                        themeKey: "neon-operator",
                        tags: safeTags // <--- MUDE AQUI (Antes estava tags: [])
                    }
                },
                system: {
                    notes: draft.effect || ""
                }
            }
        };

        const result = await PowerDatabase.savePower(itemToSave);
        if (result.success) {
            ui.notifications.info(`Poder [${draft.name}] forjado com sucesso!`);
            draft.id = null; // Reseta o ID para o próximo poder criado ser NOVO e não um overwrite
            dispatch('save');
        } else {
            ui.notifications.error(result.msg);
        }

        
    }
</script>

<div class="forge-studio" in:fade={{duration: 200}}>
    
    <div class="column global-col custom-scroll">
        <div class="col-header">PARÂMETROS DA MATRIZ</div>
        
        <div class="field"><label>NOME DO PODER</label><input type="text" class="cyber-input" bind:value={draft.name}></div>
        
        <div class="row-fields">
            <div class="field">
                <label>CATEGORIA</label>
                <select class="cyber-select" bind:value={draft.category}>
                    <option value="origem">KIT DE ORIGEM</option>
                    <option value="principal">PRINCIPAL</option>
                    <option value="secundario">SECUNDÁRIO</option>
                    <option value="habilidade">HABILIDADE ESPECIAL</option>
                </select>
            </div>
            <div class="field">
                <label>RARIDADE</label>
                <select class="cyber-select" bind:value={draft.rarity}>
                    {#each Object.keys(PB_BASE_VALUES) as r} <option value={r}>{r}</option> {/each}
                </select>
            </div>

            <div class="field" style="padding-top: 0;">
            <label>TAGS (Separadas por vírgula)</label>
            <input type="text" class="cyber-input" bind:value={tagsString} placeholder="Ex: fogo, passiva, mutação">
        </div>
        </div>

        <div class="dice-matrix">
            <div class="d-box"><label>NORMAL</label><input type="number" min="0" bind:value={draft.dice.normal}></div>
            <div class="d-box"><label>HARD</label><input type="number" min="0" bind:value={draft.dice.hard}></div>
            <div class="d-box"><label>WIGGLE</label><input type="number" min="0" bind:value={draft.dice.wiggle}></div>
        </div>

        <div class="subroutines-panel">
            <div class="sr-header">
                SUB-ROTINAS (QUALIDADES)
                <button class="btn-add-sr" on:click={addQuality}><i class="fas fa-plus"></i></button>
            </div>
            <div class="sr-list">
                {#each draft.qualities as q, i}
                    <div class="sr-item {activeQIndex === i ? 'active' : ''}" on:click={() => activeQIndex = i}>
                        <div class="sr-type {q.type}">{q.type.charAt(0).toUpperCase()}</div>
                        <span class="sr-name">{q.name}</span>
                        <button class="btn-del-sr" on:click|stopPropagation={() => removeQuality(i)}><i class="fas fa-trash"></i></button>
                    </div>
                {/each}
                {#if draft.qualities.length === 0}
                    <span class="empty-msg">Nenhuma sub-rotina injetada.</span>
                {/if}
            </div>
        </div>
    </div>

    <div class="column editor-col custom-scroll">
        <div class="col-header">ESTÚDIO DE QUALIDADE</div>
        
        {#if activeQIndex >= 0 && draft.qualities[activeQIndex]}
            
            <div class="editor-body" in:fade>
                <div class="row-fields">
                    <div class="field grow"><label>IDENTIFICADOR</label><input type="text" class="cyber-input" bind:value={draft.qualities[activeQIndex].name}></div>
                    <div class="field"><label>NÍVEL</label><input type="number" class="cyber-input" style="width: 60px; text-align: center;" bind:value={draft.qualities[activeQIndex].level}></div>
                </div>

                <div class="type-selector">
                    <button class="{draft.qualities[activeQIndex].type === 'atk' ? 'active atk' : ''}" on:click={() => draft.qualities[activeQIndex].type = 'atk'}><i class="fas fa-crosshairs"></i> ATAQUE</button>
                    <button class="{draft.qualities[activeQIndex].type === 'def' ? 'active def' : ''}" on:click={() => draft.qualities[activeQIndex].type = 'def'}><i class="fas fa-shield-alt"></i> DEFESA</button>
                    <button class="{draft.qualities[activeQIndex].type === 'util' ? 'active util' : ''}" on:click={() => draft.qualities[activeQIndex].type = 'util'}><i class="fas fa-magic"></i> ÚTIL</button>
                </div>

                <div class="caps-selector">
                    <label style="width: 100%; font-size: 10px; color: #888;">CAPACIDADES BASE</label>
                    {#each CAP_TYPES as cap}
                        <button class="cap-btn {hasCap(cap) ? 'on' : ''}" on:click={() => toggleCap(cap)}>{cap.toUpperCase()}</button>
                    {/each}
                </div>

                <div class="mods-container">
                    <label style="font-size: 10px; color: #888; font-style: italic;">BOTÃO ESQUERDO: Adicionar | BOTÃO DIREITO: Remover</label>
                    <div class="mod-section">
                        <span class="sec-title"><i class="fas fa-plus-circle" style="color: #00ff41;"></i> EXTRAS</span>
                        <div class="mod-grid">
                            {#each EXTRAS_DB as ext}
                                {@const qty = getModQty(ext.id)}
                                <button class="mod-chip {qty > 0 ? 'on' : ''}" 
                                    on:click={() => addMod(ext)} 
                                    on:contextmenu|preventDefault={() => removeMod(ext)}
                                    title={ext.desc}>
                                    {ext.name} <small>+{ext.cost}</small>
                                    {#if qty > 1}<span class="qty-badge">x{qty}</span>{/if}
                                </button>
                            {/each}
                        </div>
                    </div>
                    
                    <div class="mod-section">
                        <span class="sec-title"><i class="fas fa-minus-circle" style="color: #ff3333;"></i> FLAWS</span>
                        <div class="mod-grid">
                            {#each FLAWS_DB as flaw}
                                {@const qty = getModQty(flaw.id)}
                                <button class="mod-chip flaw {qty > 0 ? 'on' : ''}" 
                                    on:click={() => addMod(flaw)} 
                                    on:contextmenu|preventDefault={() => removeMod(flaw)}
                                    title={flaw.desc}>
                                    {flaw.name} <small>{flaw.cost}</small>
                                    {#if qty > 1}<span class="qty-badge flaw">x{qty}</span>{/if}
                                </button>
                            {/each}
                        </div>
                    </div>
                </div>

<div class="field grow" style="margin-top: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <label>EFEITO ESPECÍFICO (Opcional)</label>
                        <button class="btn-add-sr" style="width: 20px; height: 20px;" on:click={() => openNotepad('quality')} title="Abrir Bloco de Notas"><i class="fas fa-expand"></i></button>
                    </div>
                    <textarea class="cyber-input desc-input custom-scroll" bind:value={draft.qualities[activeQIndex].description} placeholder="Ex: Este ataque incendeia o alvo..."></textarea>
                </div>
            </div>
        {:else}
            <div class="disabled-msg">
                <i class="fas fa-project-diagram"></i><br>
                Selecione ou crie uma Sub-rotina para editar seus Extras e Falhas.
            </div>
        {/if}
    </div>

    <div class="column preview-col">
        <div class="col-header">COMPILAÇÃO & GERAÇÃO</div>
        
        <div class="hud-container">
            <div class="hud-card">
                <span class="hud-lbl">CUSTO TOTAL (XP)</span>
                <div class="hud-val {xpCost > 0 ? 'accent-text' : ''}">{xpCost}</div>
            </div>
            <div class="hud-card">
                <span class="hud-lbl">BALANCEAMENTO (PB)</span>
                <div class="hud-val {usedPB > maxPB ? 'danger-text' : 'accent-text'}">
                    {usedPB} <span class="dim">/ {maxPB}</span>
                </div>
            </div>
        </div>

<div class="field grow" style="padding: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <label>NARRATIVA GERAL DO PODER</label>
                <button class="btn-add-sr" style="width: 20px; height: 20px;" on:click={() => openNotepad('effect')} title="Abrir Bloco de Notas"><i class="fas fa-expand"></i></button>
            </div>
            <textarea class="cyber-input desc-input custom-scroll" bind:value={draft.effect} style="min-height: 60px;"></textarea>
        </div>

        <div class="book-preview custom-scroll">
            <div class="book-paper">
                {@html bookFormatHTML}
            </div>
        </div>

        <div class="action-buttons">
            <button class="btn-copy" on:click={exportToText}>
                <i class="fas fa-copy"></i> COPIAR TEXTO
            </button>
            <button class="btn-compile-save" on:click={compilePower}>
                <i class="fas fa-microchip"></i> SALVAR
            </button>
        </div>
    </div>

    {#if notepadState.open}
    <div class="notepad-overlay" transition:fade={{duration: 150}} on:click={closeNotepad}>
        <div class="notepad-modal" on:click|stopPropagation>
            <div class="notepad-header">
                <span><i class="fas fa-edit"></i> EDITOR EXPANDIDO: {notepadState.type === 'effect' ? 'Narrativa Geral' : 'Efeito Específico'}</span>
                <button on:click={closeNotepad}><i class="fas fa-times"></i></button>
            </div>
            <textarea class="cyber-input custom-scroll" bind:value={notepadState.text} placeholder="Digite os detalhes aqui..."></textarea>
<button class="btn-compile-save" on:click={closeNotepad} style="margin-top: 15px; width: 100%; flex: none; padding: 12px;">CONCLUÍDO</button>
        </div>
    </div>
{/if}

</div>

<style>
    .forge-studio { display: flex; height: 100%; gap: 15px; padding: 15px; }

    /* COLUNAS */
    .column { display: flex; flex-direction: column; background: rgba(0,0,0,0.6); border: 1px solid rgba(0, 212, 255, 0.2); border-radius: 4px; overflow: hidden; }
    .global-col { flex: 1; min-width: 250px; overflow-y: auto; }
    .editor-col { flex: 1.5; overflow-y: auto; position: relative;}
    .preview-col { flex: 1.2; display: flex; flex-direction: column; }

    .col-header { background: rgba(0, 212, 255, 0.1); padding: 10px 15px; font-size: 11px; font-weight: bold; color: #00d4ff; border-bottom: 1px solid rgba(0, 212, 255, 0.3); text-align: center; letter-spacing: 1px;}

    /* INPUTS & FIELDS */
    .field { display: flex; flex-direction: column; gap: 5px; padding: 10px; }
    .row-fields { display: flex; gap: 5px; padding: 0 10px; }
    .field.grow { flex: 1; padding: 0; }
    label { font-size: 9px; color: #888; font-weight: bold; letter-spacing: 1px; }
    
    .cyber-input { background: #050505; border: 1px solid #333; color: #fff; padding: 8px 10px; font-family: inherit; font-size: 14px; outline: none; border-radius: 2px; transition: 0.2s; width: 100%; box-sizing: border-box;}
    .cyber-input:focus { border-color: #00d4ff; box-shadow: 0 0 5px rgba(0, 212, 255, 0.3); }
    .cyber-select { background: #050505; color: #00d4ff; border: 1px solid #333; padding: 8px; font-family: inherit; outline: none; border-radius: 2px; width: 100%;}
    .desc-input { resize: none; min-height: 80px; }

    /* DICE MATRIX */
    .dice-matrix { display: flex; gap: 5px; padding: 10px; background: rgba(0,0,0,0.3); border-top: 1px solid #222; border-bottom: 1px solid #222; margin-top: 10px; }
    .d-box { flex: 1; display: flex; flex-direction: column; gap: 5px; align-items: center; }
    .d-box input { background: #000; border: 1px solid #00d4ff; color: #00d4ff; padding: 5px; text-align: center; font-weight: bold; font-family: inherit; outline: none; width: 100%; box-sizing: border-box; border-radius: 4px;}

    /* LISTA DE SUB-ROTINAS */
    .subroutines-panel { display: flex; flex-direction: column; padding: 10px; flex: 1;}
    .sr-header { display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #00d4ff; font-weight: bold; border-bottom: 1px dashed #333; padding-bottom: 5px; margin-bottom: 10px; }
    .btn-add-sr { background: rgba(0, 212, 255, 0.1); border: 1px solid #00d4ff; color: #00d4ff; border-radius: 4px; width: 24px; height: 24px; cursor: pointer; transition: 0.2s; }
    .btn-add-sr:hover { background: #00d4ff; color: #000; }
    
    .sr-list { display: flex; flex-direction: column; gap: 5px; }
    .sr-item { display: flex; align-items: center; gap: 10px; background: #0a0a0a; border: 1px solid #222; padding: 8px; border-radius: 4px; cursor: pointer; transition: 0.2s; border-left: 3px solid transparent;}
    .sr-item:hover { background: #111; border-color: #444; }
    .sr-item.active { background: rgba(0, 212, 255, 0.05); border-color: rgba(0, 212, 255, 0.3); border-left-color: #00d4ff; }
    
    .sr-type { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; border-radius: 3px; color: #fff; }
    .sr-type.atk { background: #ff3333; } .sr-type.def { background: #0088ff; } .sr-type.util { background: #ffcc00; }
    .sr-name { flex: 1; font-size: 12px; color: #ccc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .btn-del-sr { background: transparent; border: none; color: #666; cursor: pointer; transition: 0.2s; }
    .btn-del-sr:hover { color: #ff3333; }
    .empty-msg { font-size: 10px; color: #555; font-style: italic; text-align: center; margin-top: 10px; }

    /* EDITOR DE SUB-ROTINA */
    .editor-body { display: flex; flex-direction: column; padding: 15px; gap: 15px; }
    .disabled-msg { margin: auto; text-align: center; color: #444; font-size: 12px; padding: 40px; line-height: 1.5; }
    .disabled-msg i { font-size: 32px; margin-bottom: 10px; opacity: 0.5; }

    .type-selector { display: flex; gap: 5px; }
    .type-selector button { flex: 1; background: #050505; border: 1px solid #333; color: #666; padding: 8px; font-family: inherit; font-weight: bold; font-size: 11px; cursor: pointer; border-radius: 4px; transition: 0.2s;}
    .type-selector button.active.atk { background: rgba(255, 51, 51, 0.1); border-color: #ff3333; color: #ff3333; }
    .type-selector button.active.def { background: rgba(0, 136, 255, 0.1); border-color: #0088ff; color: #0088ff; }
    .type-selector button.active.util { background: rgba(255, 204, 0, 0.1); border-color: #ffcc00; color: #ffcc00; }

    .caps-selector { display: flex; flex-wrap: wrap; gap: 5px; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px; border: 1px solid #222; }
    .cap-btn { background: #111; border: 1px solid #333; color: #888; padding: 4px 10px; font-size: 10px; cursor: pointer; border-radius: 12px; font-family: inherit; }
    .cap-btn.on { background: #00d4ff; color: #000; border-color: #00d4ff; font-weight: bold; }

    /* EXTRAS E FLAWS GRID COM BADGES */
    .mods-container { display: flex; flex-direction: column; gap: 15px; }
    .sec-title { font-size: 10px; color: #888; font-weight: bold; margin-bottom: 8px; display: block; border-bottom: 1px solid #222; padding-bottom: 4px; }
    .mod-grid { display: flex; flex-wrap: wrap; gap: 8px; padding-top: 4px;}
    
    .mod-chip { position: relative; background: #0a0a0a; border: 1px solid #333; color: #aaa; padding: 6px 10px; font-size: 10px; border-radius: 4px; cursor: pointer; font-family: inherit; transition: 0.2s; display: flex; align-items: center; gap: 5px; }
    .mod-chip small { opacity: 0.5; font-weight: bold; }
    .mod-chip:hover { border-color: #00ff41; color: #fff; }
    .mod-chip.flaw:hover { border-color: #ff3333; }
    
    .mod-chip.on { background: rgba(0, 255, 65, 0.1); color: #00ff41; border-color: #00ff41; font-weight: bold; }
    .mod-chip.on small { color: #00ff41; opacity: 1; }
    .mod-chip.flaw.on { background: rgba(255, 51, 51, 0.1); border-color: #ff3333; color: #ff3333; }
    .mod-chip.flaw.on small { color: #ff3333; }

    .qty-badge { position: absolute; top: -6px; right: -6px; background: #00ff41; color: #000; font-size: 9px; padding: 2px 5px; border-radius: 10px; font-weight: bold; border: 1px solid #000;}
    .qty-badge.flaw { background: #ff3333; color: #fff; }

    /* PREVIEW PANEL */
    .hud-container { display: flex; gap: 10px; padding: 10px; background: rgba(0,0,0,0.4); border-bottom: 1px solid #222; }
    .hud-card { flex: 1; background: #050505; border: 1px solid #333; border-radius: 4px; padding: 10px; text-align: center; }
    .hud-lbl { display: block; font-size: 9px; color: #888; margin-bottom: 5px; font-weight: bold;}
    .hud-val { font-size: 20px; font-weight: bold; color: #fff; }
    .accent-text { color: #00d4ff; text-shadow: 0 0 10px rgba(0, 212, 255, 0.5); }
    .danger-text { color: #ff3333; text-shadow: 0 0 10px rgba(255, 51, 51, 0.5); animation: pulse 1s infinite;}
    .dim { font-size: 12px; color: #666; }

    .book-preview { flex: 1; padding: 15px; background: #0a0a0a; overflow-y: auto; border-bottom: 1px solid #222;}
    .book-paper { background: #fdfdfd; color: #111; padding: 15px; border-radius: 2px; font-family: 'Times New Roman', Times, serif; font-size: 14px; line-height: 1.4; box-shadow: 2px 2px 10px rgba(0,0,0,0.5); }
    
    :global(.book-title) { font-size: 16px; margin-bottom: 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px;}
    :global(.book-line) { margin-bottom: 4px; text-align: justify; }

    .action-buttons { display: flex; gap: 5px; padding: 10px; background: #050505; }
    .btn-copy { flex: 1; background: #222; color: #fff; border: 1px solid #444; padding: 10px; font-family: inherit; font-weight: bold; font-size: 12px; cursor: pointer; transition: 0.2s; border-radius: 2px; }
    .btn-copy:hover { background: #333; border-color: #888; }
    .btn-compile-save { flex: 2; background: #00d4ff; color: #000; border: none; padding: 10px; font-family: inherit; font-weight: bold; font-size: 12px; cursor: pointer; transition: 0.2s; border-radius: 2px;}
    .btn-compile-save:hover { background: #fff; box-shadow: 0 0 15px rgba(0, 212, 255, 0.5); }

    /* SCROLLBAR */
    .custom-scroll::-webkit-scrollbar { width: 4px; }
    .custom-scroll::-webkit-scrollbar-track { background: transparent; }
    .custom-scroll::-webkit-scrollbar-thumb { background: rgba(0, 212, 255, 0.3); border-radius: 2px; }

    /* BLOCO DE NOTAS EXPANDIDO */
    .notepad-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(3px); }
    .notepad-modal { background: #050505; border: 1px solid #00d4ff; width: 80%; max-width: 600px; height: 70%; display: flex; flex-direction: column; padding: 15px; border-radius: 4px; box-shadow: 0 0 30px rgba(0, 212, 255, 0.2); }
    .notepad-header { display: flex; justify-content: space-between; color: #00d4ff; font-weight: bold; margin-bottom: 10px; font-size: 14px; align-items: center; border-bottom: 1px dashed #333; padding-bottom: 10px;}
    .notepad-header button { background: transparent; border: none; color: #ff3333; cursor: pointer; font-size: 16px; transition: 0.2s;}
    .notepad-header button:hover { color: #fff; text-shadow: 0 0 10px #ff3333; }
    .notepad-modal textarea { flex: 1; resize: none; font-size: 10px; line-height: 1.5; padding: 15px; }
    
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>