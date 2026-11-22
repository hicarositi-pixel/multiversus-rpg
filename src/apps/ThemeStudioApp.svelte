<script>
    import { onMount, onDestroy } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import { SHEET_THEMES } from '../data/SheetThemeDB.js';
    import { THEME_DB } from '../data/ThemeDB.js';
    import { PASS_TIERS, PassSystem } from '../PassSystem.js';
    import {
        CustomThemeDB,
        generateModularSheetCSS,
        generateModularTalentCSS
    } from '../database/CustomThemeDB.js';

    const ICON_PRESETS = [
        'fa-terminal', 'fa-fire-alt', 'fa-dragon', 'fa-hat-wizard', 'fa-crown',
        'fa-skull', 'fa-eye', 'fa-bolt', 'fa-radiation-alt', 'fa-biohazard',
        'fa-khanda', 'fa-moon', 'fa-sun', 'fa-ghost', 'fa-microchip',
        'fa-shield-alt', 'fa-gem', 'fa-mask', 'fa-atom', 'fa-dna',
        'fa-user-secret', 'fa-wine-glass-alt', 'fa-paw', 'fa-hand-rock',
        'fa-adjust', 'fa-book-open', 'fa-project-diagram', 'fa-music',
        'fa-dungeon', 'fa-file-signature', 'fa-crosshairs', 'fa-brain'
    ];

    const FONT_PRESETS = [
        { label: "Share Tech Mono (Terminal)", val: "'Share Tech Mono', monospace" },
        { label: "Syncopate (Cyber Header)", val: "'Syncopate', sans-serif" },
        { label: "Cinzel (Épico / Real)", val: "'Cinzel', serif" },
        { label: "Rajdhani (Tático Moderno)", val: "'Rajdhani', sans-serif" },
        { label: "Exo 2 (Sci-Fi Clean)", val: "'Exo 2', sans-serif" },
        { label: "Georgia (Clássico / Gótico)", val: "'Georgia', serif" },
        { label: "Courier New (Matrix Retro)", val: "'Courier New', monospace" },
        { label: "Segoe UI (Padrão Limpo)", val: "'Segoe UI', sans-serif" }
    ];

    const PASS_OPTIONS = [
        { id: 'cobre', label: '🥉 COBRE (Livre para Todos)', color: '#cd7f32' },
        { id: 'prata', label: '🥈 PRATA ou Superior', color: '#e0e0e0' },
        { id: 'ouro', label: '🥇 OURO ou Superior', color: '#ffcc00' },
        { id: 'diamante', label: '💎 DIAMANTE ou Superior', color: '#00fbff' },
        { id: 'gambiarrite', label: '☣️ GAMBIARRITE', color: '#ff3333' },
        { id: 'none', label: '🔒 EXCLUSIVO / VENDA INDIVIDUAL (Só Jogadores Marcados)', color: '#d000ff' }
    ];

    let studioMode = 'sheet'; // 'sheet' | 'talent'
    let editorSubTab = 'visual'; // 'visual' | 'modular' | 'access' | 'code'
    let searchQuery = '';
    let filterTier = 'all';
    let playerSearchQuery = '';

    let sheetThemes = {};
    let talentThemes = {};
    let selectedKey = 'terminal';
    let isCreatingNew = false;
    let newKeyInput = '';

    // Estado editável para Tema de Ficha
    let editSheet = createEmptySheetTheme();

    // Estado editável para Tema de Talento
    let editTalent = createEmptyTalentTheme();

    let hookId;

    function createEmptySheetTheme() {
        return {
            label: "NOVO_PROTOCOLO",
            class: "theme-novo_protocolo",
            desc: "CONEXÃO ESTABELECIDA COM O NÚCLEO.",
            icon: "fa-terminal",
            minPassTier: "cobre",
            allowedUsers: [],
            hideWhenLocked: false,
            vars: {
                "--c-primary": "#00ff41",
                "--c-secondary": "#00bfff",
                "--c-bg": "#05070a",
                "--c-panel": "rgba(10, 15, 22, 0.88)",
                "--c-text": "#e0f7ff",
                "--font-head": "'Syncopate', sans-serif",
                "--font-body": "'Share Tech Mono', monospace",
                "--f-clip": "polygon(0 12px, 12px 0, 88% 0, 100% 12px, 100% 88%, 88% 100%, 12% 100%, 0 88%)",
                "--f-border": "1px solid rgba(0, 255, 65, 0.5)",
                "--f-shadow": "0 0 25px rgba(0, 255, 65, 0.25)"
            },
            modularConfig: {
                enabled: true,
                shapePreset: "rounded-glass",
                iconShape: "clipped",
                bgAnimation: "embers",
                hoverAnimation: "heat-wave",
                scannerAnimation: "burn-aura",
                barStyle: "gradient-flow",
                overlayImageUrl: ""
            },
            rawExtraCSS: ""
        };
    }

    function createEmptyTalentTheme() {
        const defaultModular = {
            bgStyle: "linear-v",
            bgColor1: "#080810",
            bgColor2: "#1f0828",
            borderColor: "#00e5ff",
            accentColor: "#ff007f",
            nameColor: "#ffffff",
            borderStyle: "solid",
            cardRadius: "8px",
            iconBoxShape: "circle",
            cardAnimation: "holo-shine",
            fontFamily: "'Segoe UI', sans-serif",
            dieNormalColor: "#00e5ff",
            dieNormalAnim: "float",
            dieHardColor: "#ff007f",
            dieHardAnim: "none",
            dieWiggleColor: "#ffcc00",
            dieWiggleAnim: "reactor-pulse"
        };
        return {
            label: "NOVO TEMA DE TALENTO",
            icon: "fa-bolt",
            color: "#00e5ff",
            desc: "Energia canalizada através do Nexus.",
            minPassTier: "cobre",
            allowedUsers: [],
            hideWhenLocked: false,
            modularConfig: defaultModular,
            css: generateModularTalentCSS(defaultModular, "#00e5ff")
        };
    }

    function refreshLists() {
        CustomThemeDB.syncAll();
        sheetThemes = { ...SHEET_THEMES };
        talentThemes = { ...THEME_DB };
    }

    onMount(() => {
        refreshLists();
        selectTheme('terminal', 'sheet');
        hookId = Hooks.on("nexusThemesUpdated", () => {
            sheetThemes = { ...SHEET_THEMES };
            talentThemes = { ...THEME_DB };
        });
    });

    onDestroy(() => {
        if (hookId) Hooks.off("nexusThemesUpdated", hookId);
    });

    function switchStudioMode(mode) {
        studioMode = mode;
        isCreatingNew = false;
        editorSubTab = 'visual';
        if (mode === 'sheet') {
            const firstKey = Object.keys(sheetThemes)[0] || 'terminal';
            selectTheme(firstKey, 'sheet');
        } else {
            const firstKey = Object.keys(talentThemes)[0] || 'default';
            selectTheme(firstKey, 'talent');
        }
    }

    function selectTheme(key, mode = studioMode) {
        isCreatingNew = false;
        selectedKey = key;
        if (mode === 'sheet') {
            const src = sheetThemes[key] || SHEET_THEMES['terminal'];
            const baseVars = {
                "--c-primary": "#00ff41",
                "--c-secondary": src?.vars?.["--c-primary"] || "#00ff41",
                "--c-bg": "#050505",
                "--c-panel": "rgba(12, 16, 20, 0.85)",
                "--c-text": "#ffffff",
                "--font-head": src?.vars?.["--font-main"] || "'Share Tech Mono', monospace",
                "--font-body": src?.vars?.["--font-main"] || "'Share Tech Mono', monospace",
                "--f-clip": src?.vars?.["--clip-path"] || "none",
                "--f-border": `1px solid ${src?.vars?.["--c-primary"] || "#00ff41"}`,
                "--f-shadow": `0 0 20px rgba(0, 255, 65, 0.2)`,
                ...(src?.vars || {})
            };
            editSheet = {
                label: src?.label || key.toUpperCase(),
                class: src?.class || `theme-${key}`,
                desc: src?.desc || "",
                icon: src?.icon || "fa-terminal",
                minPassTier: src?.minPassTier || "cobre",
                allowedUsers: Array.isArray(src?.allowedUsers) ? [...src.allowedUsers] : [],
                hideWhenLocked: Boolean(src?.hideWhenLocked),
                vars: baseVars,
                modularConfig: {
                    enabled: Boolean(src?.modularConfig?.enabled),
                    shapePreset: src?.modularConfig?.shapePreset || "rounded-glass",
                    iconShape: src?.modularConfig?.iconShape || "clipped",
                    bgAnimation: src?.modularConfig?.bgAnimation || "none",
                    hoverAnimation: src?.modularConfig?.hoverAnimation || "neon-glow",
                    scannerAnimation: src?.modularConfig?.scannerAnimation || "pulse-ring",
                    barStyle: src?.modularConfig?.barStyle || "gradient-flow",
                    overlayImageUrl: src?.modularConfig?.overlayImageUrl || ""
                },
                rawExtraCSS: src?.rawExtraCSS !== undefined ? src.rawExtraCSS : (src?.extraCSS || "")
            };
        } else {
            const src = talentThemes[key] || THEME_DB['default'];
            const col = src?.color || "#00ff41";
            editTalent = {
                label: src?.label || key.toUpperCase(),
                icon: src?.icon || "fa-bolt",
                color: col,
                desc: src?.desc || "",
                minPassTier: src?.minPassTier || "cobre",
                allowedUsers: Array.isArray(src?.allowedUsers) ? [...src.allowedUsers] : [],
                hideWhenLocked: Boolean(src?.hideWhenLocked),
                modularConfig: {
                    bgStyle: src?.modularConfig?.bgStyle || "linear-v",
                    bgColor1: src?.modularConfig?.bgColor1 || "#08080c",
                    bgColor2: src?.modularConfig?.bgColor2 || "#181824",
                    borderColor: src?.modularConfig?.borderColor || col,
                    accentColor: src?.modularConfig?.accentColor || col,
                    nameColor: src?.modularConfig?.nameColor || "#ffffff",
                    borderStyle: src?.modularConfig?.borderStyle || "solid",
                    cardRadius: src?.modularConfig?.cardRadius || "6px",
                    iconBoxShape: src?.modularConfig?.iconBoxShape || "rounded",
                    cardAnimation: src?.modularConfig?.cardAnimation || "holo-shine",
                    fontFamily: src?.modularConfig?.fontFamily || "'Segoe UI', sans-serif",
                    dieNormalColor: src?.modularConfig?.dieNormalColor || col,
                    dieNormalAnim: src?.modularConfig?.dieNormalAnim || "none",
                    dieHardColor: src?.modularConfig?.dieHardColor || "#ffffff",
                    dieHardAnim: src?.modularConfig?.dieHardAnim || "none",
                    dieWiggleColor: src?.modularConfig?.dieWiggleColor || "#ffcc00",
                    dieWiggleAnim: src?.modularConfig?.dieWiggleAnim || "reactor-pulse"
                },
                css: src?.css || ""
            };
        }
    }

    function startNewTheme() {
        isCreatingNew = true;
        newKeyInput = studioMode === 'sheet' ? `protocolo_${Math.floor(Math.random() * 900 + 100)}` : `talento_${Math.floor(Math.random() * 900 + 100)}`;
        selectedKey = newKeyInput;
        editorSubTab = 'visual';
        if (studioMode === 'sheet') {
            editSheet = createEmptySheetTheme();
        } else {
            editTalent = createEmptyTalentTheme();
        }
    }

    function duplicateCurrentTheme() {
        isCreatingNew = true;
        const baseKey = `${selectedKey}_copia`;
        newKeyInput = baseKey;
        if (studioMode === 'sheet') {
            editSheet = JSON.parse(JSON.stringify(editSheet));
            editSheet.label = `${editSheet.label} (CÓPIA)`;
        } else {
            editTalent = JSON.parse(JSON.stringify(editTalent));
            editTalent.label = `${editTalent.label} (CÓPIA)`;
        }
        selectedKey = newKeyInput;
        ui.notifications.info("Tema duplicado! Defina o ID e clique em SALVAR TEMA.");
    }

    function applyModularToTalentCSS() {
        editTalent.css = generateModularTalentCSS(editTalent.modularConfig, editTalent.color);
        ui.notifications.info("CSS do Card de Talento atualizado com os módulos visuais!");
    }

    function pickOverlayImage() {
        new FilePicker({
            type: "imagevideo",
            current: editSheet.modularConfig.overlayImageUrl || "",
            callback: (path) => {
                editSheet.modularConfig.overlayImageUrl = path;
            }
        }).browse();
    }

    function toggleAllowedUser(userId) {
        if (studioMode === 'sheet') {
            if (editSheet.allowedUsers.includes(userId)) {
                editSheet.allowedUsers = editSheet.allowedUsers.filter(id => id !== userId);
            } else {
                editSheet.allowedUsers = [...editSheet.allowedUsers, userId];
            }
        } else {
            if (editTalent.allowedUsers.includes(userId)) {
                editTalent.allowedUsers = editTalent.allowedUsers.filter(id => id !== userId);
            } else {
                editTalent.allowedUsers = [...editTalent.allowedUsers, userId];
            }
        }
    }

    async function saveCurrentTheme() {
        const rawKey = isCreatingNew ? newKeyInput : selectedKey;
        const cleanKey = (rawKey || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
        if (!cleanKey) {
            return ui.notifications.warn("Insira um ID válido para o tema (apenas letras, números e _).");
        }

        if (studioMode === 'sheet') {
            editSheet.class = `theme-${cleanKey}`;
            await CustomThemeDB.saveSheetTheme(cleanKey, editSheet);
            refreshLists();
            selectTheme(cleanKey, 'sheet');
            ui.notifications.info(`Tema de Ficha [${editSheet.label}] salvo e sincronizado com a mesa!`);
        } else {
            await CustomThemeDB.saveTalentTheme(cleanKey, editTalent);
            refreshLists();
            selectTheme(cleanKey, 'talent');
            ui.notifications.info(`Tema de Talento [${editTalent.label}] salvo e sincronizado com a mesa!`);
        }
        isCreatingNew = false;
    }

    async function resetOrDeleteCurrent() {
        if (isCreatingNew) {
            switchStudioMode(studioMode);
            return;
        }
        const key = selectedKey;
        const isBuiltin = studioMode === 'sheet'
            ? CustomThemeDB.isBuiltinSheetTheme(key)
            : CustomThemeDB.isBuiltinTalentTheme(key);

        if (studioMode === 'sheet') {
            await CustomThemeDB.resetOrDeleteSheetTheme(key);
            refreshLists();
            selectTheme(isBuiltin ? key : 'terminal', 'sheet');
            ui.notifications.info(isBuiltin ? `Tema [${key}] restaurado para o original.` : `Tema [${key}] removido.`);
        } else {
            await CustomThemeDB.resetOrDeleteTalentTheme(key);
            refreshLists();
            selectTheme(isBuiltin ? key : 'default', 'talent');
            ui.notifications.info(isBuiltin ? `Tema [${key}] restaurado para o original.` : `Tema [${key}] removido.`);
        }
    }

    // Listas filtradas
    $: activeListEntries = Object.entries(studioMode === 'sheet' ? sheetThemes : talentThemes).filter(([key, t]) => {
        if (!t) return false;
        const q = searchQuery.trim().toLowerCase();
        const matchesSearch = !q || key.toLowerCase().includes(q) || (t.label || '').toLowerCase().includes(q) || (t.desc || '').toLowerCase().includes(q);
        const tTier = t.minPassTier || 'cobre';
        const matchesTier = filterTier === 'all' || tTier === filterTier || (filterTier === 'vip' && t.allowedUsers?.length > 0);
        return matchesSearch && matchesTier;
    });

    $: allPlayers = (game.users?.contents || []).filter(u => !u.isGM).filter(u => {
        const q = playerSearchQuery.trim().toLowerCase();
        if (!q) return true;
        const charName = (u.character?.name || '').toLowerCase();
        return u.name.toLowerCase().includes(q) || charName.includes(q);
    });

    // Preview CSS Dinâmico para Ficha
    $: activePreviewKey = (isCreatingNew ? newKeyInput : selectedKey).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'preview';
    $: previewSheetVars = Object.entries(editSheet.vars || {}).map(([k, v]) => `${k}: ${v};`).join(' ');
    $: previewSheetScopedCSS = (() => {
        const mod = editSheet.modularConfig?.enabled
            ? generateModularSheetCSS(activePreviewKey, editSheet.modularConfig, editSheet.vars)
            : "";
        return `<style>${editSheet.rawExtraCSS || ""}\n${mod}</style>`;
    })();

    // Preview CSS Dinâmico para Talento
    $: previewTalentScopedCSS = (() => {
        const raw = (editTalent.css || "").replace(/&/g, `.power-card.theme-preview-live`);
        return `<style>${raw}</style>`;
    })();
</script>

<div class="theme-studio-root" in:fade={{ duration: 200 }}>
    <!-- TOP BAR -->
    <div class="studio-topbar">
        <div class="mode-tabs">
            <button class="mode-tab" class:active={studioMode === 'sheet'} on:click={() => switchStudioMode('sheet')}>
                <i class="fas fa-desktop"></i> TEMAS DE FICHA ({Object.keys(sheetThemes).length})
            </button>
            <button class="mode-tab" class:active={studioMode === 'talent'} on:click={() => switchStudioMode('talent')}>
                <i class="fas fa-bolt"></i> TEMAS DE TALENTO ({Object.keys(talentThemes).length})
            </button>
        </div>

        <div class="topbar-actions">
            <button class="action-btn new-btn" on:click={startNewTheme}>
                <i class="fas fa-plus-circle"></i> + CRIAR {studioMode === 'sheet' ? 'TEMA DE FICHA' : 'TEMA DE TALENTO'}
            </button>
            <button class="action-btn dup-btn" on:click={duplicateCurrentTheme} title="Usar tema atual como base para um novo">
                <i class="fas fa-copy"></i> DUPLICAR
            </button>
            <button class="action-btn save-btn" on:click={saveCurrentTheme}>
                <i class="fas fa-save"></i> SALVAR TEMA
            </button>
        </div>
    </div>

    <div class="studio-workspace">
        <!-- COLUNA 1: LISTA DE TEMAS -->
        <aside class="themes-sidebar">
            <div class="sidebar-filters">
                <div class="search-input-wrap">
                    <i class="fas fa-search"></i>
                    <input type="text" bind:value={searchQuery} placeholder="Buscar tema..." />
                </div>
                <select bind:value={filterTier} class="tier-filter-select">
                    <option value="all">Todos os Tiers / Acessos</option>
                    <option value="cobre">🥉 Cobre (Livre)</option>
                    <option value="prata">🥈 Prata+</option>
                    <option value="ouro">🥇 Ouro+</option>
                    <option value="diamante">💎 Diamante+</option>
                    <option value="gambiarrite">☣️ Gambiarrite</option>
                    <option value="none">🔒 Exclusivo / Loja</option>
                    <option value="vip">⭐ Com Jogadores VIP</option>
                </select>
            </div>

            <div class="themes-list custom-scroll">
                {#each activeListEntries as [key, t] (key)}
                    {@const primaryCol = studioMode === 'sheet' ? (t.vars?.['--c-primary'] || '#00ff41') : (t.color || '#00ff41')}
                    {@const isBuiltin = studioMode === 'sheet' ? CustomThemeDB.isBuiltinSheetTheme(key) : CustomThemeDB.isBuiltinTalentTheme(key)}
                    <button
                        class="theme-list-item"
                        class:selected={!isCreatingNew && selectedKey === key}
                        style="--item-col: {primaryCol}"
                        on:click={() => selectTheme(key)}
                    >
                        <div class="item-icon">
                            <i class="fas {t.icon || (studioMode === 'sheet' ? 'fa-terminal' : 'fa-bolt')}"></i>
                        </div>
                        <div class="item-meta">
                            <div class="item-title-row">
                                <span class="item-name">{t.label}</span>
                                <span class="item-badge {isBuiltin ? 'builtin' : 'custom'}">{isBuiltin ? 'BASE' : 'CUSTOM'}</span>
                            </div>
                            <div class="item-sub-row">
                                <span class="item-id">#{key}</span>
                                <span class="item-tier">{CustomThemeDB.getAccessRequirementLabel(t)}</span>
                            </div>
                            {#if t.allowedUsers?.length > 0}
                                <div class="item-vip-tag">
                                    <i class="fas fa-user-check"></i> {t.allowedUsers.length} jogador(es) liberado(s)
                                </div>
                            {/if}
                        </div>
                    </button>
                {/each}
            </div>
        </aside>

        <!-- COLUNA 2: EDITOR MODULAR -->
        <section class="editor-main">
            <div class="editor-subtabs">
                <button class:active={editorSubTab === 'visual'} on:click={() => editorSubTab = 'visual'}>
                    <i class="fas fa-palette"></i> 1. IDENTIDADE & CORES
                </button>
                <button class:active={editorSubTab === 'modular'} on:click={() => editorSubTab = 'modular'}>
                    <i class="fas fa-magic"></i> 2. ANIMAÇÕES & MÓDULOS
                </button>
                <button class:active={editorSubTab === 'access'} on:click={() => editorSubTab = 'access'}>
                    <i class="fas fa-ticket-alt"></i> 3. PASSE & JOGADORES
                </button>
                <button class:active={editorSubTab === 'code'} on:click={() => editorSubTab = 'code'}>
                    <i class="fas fa-code"></i> 4. CSS AVANÇADO
                </button>
            </div>

            <div class="editor-body custom-scroll">
                {#if studioMode === 'sheet'}
                    <!-- ==================== EDITOR DE TEMA DE FICHA ==================== -->
                    {#if editorSubTab === 'visual'}
                        <div class="form-section" in:fade={{ duration: 120 }}>
                            <h3><i class="fas fa-id-badge"></i> IDENTIDADE DO TEMA DE FICHA</h3>
                            <div class="grid-2">
                                <div class="field">
                                    <label>ID ÚNICO (CHAVE)</label>
                                    {#if isCreatingNew}
                                        <input type="text" bind:value={newKeyInput} placeholder="ex: protocolo_eclipse" />
                                    {:else}
                                        <input type="text" value={selectedKey} disabled />
                                    {/if}
                                </div>
                                <div class="field">
                                    <label>NOME DO TEMA (LABEL)</label>
                                    <input type="text" bind:value={editSheet.label} placeholder="ex: PROTOCOLO_ECLIPSE" />
                                </div>
                            </div>

                            <div class="field">
                                <label>MENSAGEM / DESCRIÇÃO DE SISTEMA</label>
                                <input type="text" bind:value={editSheet.desc} placeholder="ex: SINTONIA ABISSAL ESTABELECIDA." />
                            </div>

                            <div class="field">
                                <label>ÍCONE DO TEMA (CLIQUE OU DIGITE CLASSE FONTAWESOME)</label>
                                <input type="text" bind:value={editSheet.icon} placeholder="fa-terminal" style="margin-bottom: 6px;" />
                                <div class="icon-picker-grid">
                                    {#each ICON_PRESETS as ic}
                                        <button type="button" class="icon-pick-btn" class:active={editSheet.icon === ic} on:click={() => editSheet.icon = ic} title={ic}>
                                            <i class="fas {ic}"></i>
                                        </button>
                                    {/each}
                                </div>
                            </div>

                            <h3><i class="fas fa-Sliders-h"></i> PALETA DE CORES DA FICHA (CSS VARS)</h3>
                            <div class="color-grid">
                                <div class="color-field">
                                    <label>Cor Primária (--c-primary)</label>
                                    <div class="color-input-row">
                                        <input type="color" bind:value={editSheet.vars['--c-primary']} />
                                        <input type="text" bind:value={editSheet.vars['--c-primary']} />
                                    </div>
                                </div>
                                <div class="color-field">
                                    <label>Cor Secundária (--c-secondary)</label>
                                    <div class="color-input-row">
                                        <input type="color" bind:value={editSheet.vars['--c-secondary']} />
                                        <input type="text" bind:value={editSheet.vars['--c-secondary']} />
                                    </div>
                                </div>
                                <div class="color-field">
                                    <label>Fundo Principal (--c-bg)</label>
                                    <div class="color-input-row">
                                        <input type="color" bind:value={editSheet.vars['--c-bg']} />
                                        <input type="text" bind:value={editSheet.vars['--c-bg']} />
                                    </div>
                                </div>
                                <div class="color-field">
                                    <label>Cor do Texto (--c-text)</label>
                                    <div class="color-input-row">
                                        <input type="color" bind:value={editSheet.vars['--c-text']} />
                                        <input type="text" bind:value={editSheet.vars['--c-text']} />
                                    </div>
                                </div>
                            </div>

                            <div class="grid-2" style="margin-top: 10px;">
                                <div class="field">
                                    <label>Fundo de Painéis (--c-panel)</label>
                                    <input type="text" bind:value={editSheet.vars['--c-panel']} placeholder="rgba(10, 15, 20, 0.85)" />
                                </div>
                                <div class="field">
                                    <label>Borda Base (--f-border)</label>
                                    <input type="text" bind:value={editSheet.vars['--f-border']} placeholder="1px solid #00ff41" />
                                </div>
                            </div>

                            <h3><i class="fas fa-font"></i> TIPOGRAFIA</h3>
                            <div class="grid-2">
                                <div class="field">
                                    <label>Fonte de Títulos (--font-head)</label>
                                    <select bind:value={editSheet.vars['--font-head']}>
                                        {#each FONT_PRESETS as fp}
                                            <option value={fp.val}>{fp.label}</option>
                                        {/each}
                                    </select>
                                    <input type="text" bind:value={editSheet.vars['--font-head']} style="margin-top:4px;" />
                                </div>
                                <div class="field">
                                    <label>Fonte de Corpo (--font-body)</label>
                                    <select bind:value={editSheet.vars['--font-body']}>
                                        {#each FONT_PRESETS as fp}
                                            <option value={fp.val}>{fp.label}</option>
                                        {/each}
                                    </select>
                                    <input type="text" bind:value={editSheet.vars['--font-body']} style="margin-top:4px;" />
                                </div>
                            </div>
                        </div>

                    {:else if editorSubTab === 'modular'}
                        <div class="form-section" in:fade={{ duration: 120 }}>
                            <div class="modular-toggle-banner">
                                <div>
                                    <strong><i class="fas fa-bolt"></i> MOTOR DE EFEITOS & ANIMAÇÕES MODULARES</strong>
                                    <p>Gera automaticamente animações, formatos de ícones, partículas e efeitos de hover combinados com as cores do tema.</p>
                                </div>
                                <label class="cyber-switch">
                                    <input type="checkbox" bind:checked={editSheet.modularConfig.enabled} />
                                    <span>{editSheet.modularConfig.enabled ? 'ATIVO' : 'DESATIVADO'}</span>
                                </label>
                            </div>

                            <div class="grid-2">
                                <div class="field">
                                    <label>ESTILO DOS PAINÉIS & MOLDURAS</label>
                                    <select bind:value={editSheet.modularConfig.shapePreset}>
                                        <option value="rounded-glass">Vidro Arredondado + Blur (Estilo Hogyoku)</option>
                                        <option value="hex-tech">Hex-Tech com Barra Lateral (Estilo Hashira)</option>
                                        <option value="royal-double">Borda Dupla Majestosa (Estilo Hero King / Gótico)</option>
                                        <option value="sharp-minimal">Terminal Reto Minimalista</option>
                                        <option value="custom">Padrão / Usar apenas CSS Avançado</option>
                                    </select>
                                </div>

                                <div class="field">
                                    <label>FORMATO DOS ÍCONES DO DESKTOP & RETRATO</label>
                                    <select bind:value={editSheet.modularConfig.iconShape}>
                                        <option value="clipped">Chanfrado Cyberpunk (Padrão)</option>
                                        <option value="hexagon">Hexágono Tático</option>
                                        <option value="circle">Orbe Circular Brilhante</option>
                                        <option value="diamond">Losango / Gema 45°</option>
                                        <option value="rounded">Quadrado Suave (14px)</option>
                                    </select>
                                </div>

                                <div class="field">
                                    <label>ANIMAÇÃO DE FUNDO DA TELA</label>
                                    <select bind:value={editSheet.modularConfig.bgAnimation}>
                                        <option value="none">Nenhuma (Apenas Wallpaper)</option>
                                        <option value="embers">Brasas / Partículas Flutuando</option>
                                        <option value="starfield">Poeira Estelar / Mana Ascendente</option>
                                        <option value="void-core">Núcleo de Energia Pulsante no Vácuo</option>
                                        <option value="radial-aura">Aura Radial Respirando</option>
                                    </select>
                                </div>

                                <div class="field">
                                    <label>ANIMAÇÃO DE HOVER (BOTÕES, CARDS & ÍCONES)</label>
                                    <select bind:value={editSheet.modularConfig.hoverAnimation}>
                                        <option value="neon-glow">Brilho Neon Padrão</option>
                                        <option value="heat-wave">Onda de Calor & Desfoque (Heat Wave)</option>
                                        <option value="fire-burst">Explosão Incandescente (Fire Burst)</option>
                                        <option value="glitch-shift">Glitch RGB Cyberpunk</option>
                                        <option value="royal-shine">Reflexo Majestoso Dourado/Secundário</option>
                                    </select>
                                </div>

                                <div class="field">
                                    <label>ESTILO DO BIO-SCANNER (TELA DE LOGIN)</label>
                                    <select bind:value={editSheet.modularConfig.scannerAnimation}>
                                        <option value="pulse-ring">Anel Biométrico Padrão</option>
                                        <option value="burn-aura">Sobrecarga / Aura Ardente</option>
                                        <option value="magic-seal">Selo Rúnico / Orbe Arcano</option>
                                    </select>
                                </div>

                                <div class="field">
                                    <label>BARRAS DE PROGRESSO & ORBE DE NÍVEL</label>
                                    <select bind:value={editSheet.modularConfig.barStyle}>
                                        <option value="gradient-flow">Gradiente Luminoso (Primária ➔ Secundária)</option>
                                        <option value="default">Padrão do Sistema</option>
                                    </select>
                                </div>
                            </div>

                            <div class="field" style="margin-top: 10px;">
                                <label>IMAGEM / GIF DECORATIVO DE FUNDO NO LOGIN (CÍRCULO MÁGICO, EMBLEMA, CHAMAS)</label>
                                <div class="input-with-btn">
                                    <input type="text" bind:value={editSheet.modularConfig.overlayImageUrl} placeholder="https://... ou caminho no Foundry (opcional)" />
                                    <button type="button" on:click={pickOverlayImage} title="Selecionar Arquivo"><i class="fas fa-folder-open"></i></button>
                                </div>
                            </div>
                        </div>
                    {/if}

                {:else}
                    <!-- ==================== EDITOR DE TEMA DE TALENTO ==================== -->
                    {#if editorSubTab === 'visual'}
                        <div class="form-section" in:fade={{ duration: 120 }}>
                            <h3><i class="fas fa-bolt"></i> IDENTIDADE DO TEMA DE TALENTO</h3>
                            <div class="grid-2">
                                <div class="field">
                                    <label>ID ÚNICO (CHAVE)</label>
                                    {#if isCreatingNew}
                                        <input type="text" bind:value={newKeyInput} placeholder="ex: deus_trovao" />
                                    {:else}
                                        <input type="text" value={selectedKey} disabled />
                                    {/if}
                                </div>
                                <div class="field">
                                    <label>NOME DO TEMA (LABEL)</label>
                                    <input type="text" bind:value={editTalent.label} placeholder="ex: DEUS DO TROVÃO" />
                                </div>
                            </div>

                            <div class="grid-2">
                                <div class="field">
                                    <label>DESCRIÇÃO CURTA (TOOLTIP)</label>
                                    <input type="text" bind:value={editTalent.desc} placeholder="ex: Relâmpagos percorrem os dados deste poder." />
                                </div>
                                <div class="color-field">
                                    <label>COR PRINCIPAL / LED DO TEMA</label>
                                    <div class="color-input-row">
                                        <input type="color" bind:value={editTalent.color} />
                                        <input type="text" bind:value={editTalent.color} />
                                    </div>
                                </div>
                            </div>

                            <div class="field">
                                <label>ÍCONE DO TEMA DE TALENTO</label>
                                <input type="text" bind:value={editTalent.icon} placeholder="fa-bolt" style="margin-bottom: 6px;" />
                                <div class="icon-picker-grid">
                                    {#each ICON_PRESETS as ic}
                                        <button type="button" class="icon-pick-btn" class:active={editTalent.icon === ic} on:click={() => editTalent.icon = ic} title={ic}>
                                            <i class="fas {ic}"></i>
                                        </button>
                                    {/each}
                                </div>
                            </div>
                        </div>

                    {:else if editorSubTab === 'modular'}
                        <div class="form-section" in:fade={{ duration: 120 }}>
                            <div class="modular-toggle-banner">
                                <div>
                                    <strong><i class="fas fa-Sliders-h"></i> CONSTRUTOR MODULAR DE CARD DE TALENTO</strong>
                                    <p>Configure cores, texturas, formato do ícone e animações dos dados Normal, Hard e Wiggle e clique em Gerar/Aplicar CSS.</p>
                                </div>
                                <button type="button" class="apply-mod-btn" on:click={applyModularToTalentCSS}>
                                    <i class="fas fa-sync-alt"></i> APLICAR MÓDULOS AO CARD
                                </button>
                            </div>

                            <div class="grid-2">
                                <div class="field">
                                    <label>ESTILO DE FUNDO DO CARD</label>
                                    <select bind:value={editTalent.modularConfig.bgStyle} on:change={applyModularToTalentCSS}>
                                        <option value="solid">Cor Sólida</option>
                                        <option value="linear-v">Gradiente Vertical</option>
                                        <option value="linear-h">Gradiente Horizontal (Dualidade)</option>
                                        <option value="radial">Gradiente Radial (Centro)</option>
                                        <option value="striped">Listras / Fibras (Estilo Kagune / Cela)</option>
                                        <option value="amp-mesh">Grade Metálica (Estilo Heavy Metal)</option>
                                    </select>
                                </div>
                                <div class="field">
                                    <label>ANIMAÇÃO ESPECIAL DO CARD</label>
                                    <select bind:value={editTalent.modularConfig.cardAnimation} on:change={applyModularToTalentCSS}>
                                        <option value="holo-shine">Brilho Holográfico Deslizante</option>
                                        <option value="border-pulse">Aura / Borda Pulsante</option>
                                        <option value="particle-rise">Partículas de Mana Subindo</option>
                                        <option value="scanlines">Scanlines Matrix CRT</option>
                                        <option value="cursor-blink">Cursor Hacker (_) Piscando no Nome</option>
                                        <option value="none">Sem Animação Extra</option>
                                    </select>
                                </div>
                            </div>

                            <div class="color-grid">
                                <div class="color-field">
                                    <label>Cor de Fundo 1</label>
                                    <div class="color-input-row">
                                        <input type="color" bind:value={editTalent.modularConfig.bgColor1} on:change={applyModularToTalentCSS} />
                                        <input type="text" bind:value={editTalent.modularConfig.bgColor1} on:change={applyModularToTalentCSS} />
                                    </div>
                                </div>
                                <div class="color-field">
                                    <label>Cor de Fundo 2</label>
                                    <div class="color-input-row">
                                        <input type="color" bind:value={editTalent.modularConfig.bgColor2} on:change={applyModularToTalentCSS} />
                                        <input type="text" bind:value={editTalent.modularConfig.bgColor2} on:change={applyModularToTalentCSS} />
                                    </div>
                                </div>
                                <div class="color-field">
                                    <label>Cor da Borda</label>
                                    <div class="color-input-row">
                                        <input type="color" bind:value={editTalent.modularConfig.borderColor} on:change={applyModularToTalentCSS} />
                                        <input type="text" bind:value={editTalent.modularConfig.borderColor} on:change={applyModularToTalentCSS} />
                                    </div>
                                </div>
                                <div class="color-field">
                                    <label>Cor de Destaque / Badge XP</label>
                                    <div class="color-input-row">
                                        <input type="color" bind:value={editTalent.modularConfig.accentColor} on:change={applyModularToTalentCSS} />
                                        <input type="text" bind:value={editTalent.modularConfig.accentColor} on:change={applyModularToTalentCSS} />
                                    </div>
                                </div>
                            </div>

                            <div class="grid-3" style="margin-top: 8px;">
                                <div class="field">
                                    <label>ESTILO DA BORDA</label>
                                    <select bind:value={editTalent.modularConfig.borderStyle} on:change={applyModularToTalentCSS}>
                                        <option value="solid">Sólida Neon</option>
                                        <option value="double">Dupla Real / Gótica</option>
                                        <option value="dashed">Tracejada Hacker</option>
                                        <option value="left-accent">Barra Lateral Grossa</option>
                                    </select>
                                </div>
                                <div class="field">
                                    <label>FORMATO DO CARD (RADIUS)</label>
                                    <select bind:value={editTalent.modularConfig.cardRadius} on:change={applyModularToTalentCSS}>
                                        <option value="0px">Reto Terminal (0px)</option>
                                        <option value="6px">Padrão Tático (6px)</option>
                                        <option value="20px">Arredondado / Orgânico (20px)</option>
                                        <option value="0 16px 0 16px">Corte Agressivo Diagonal</option>
                                        <option value="40px 4px 40px 4px">Curva Clã / Leque</option>
                                    </select>
                                </div>
                                <div class="field">
                                    <label>MOLDURA DO ÍCONE</label>
                                    <select bind:value={editTalent.modularConfig.iconBoxShape} on:change={applyModularToTalentCSS}>
                                        <option value="rounded">Quadrado Suave</option>
                                        <option value="circle">Orbe Circular</option>
                                        <option value="diamond">Joia / Losango 45°</option>
                                        <option value="fox-eye">Olho de Fera</option>
                                        <option value="flame-shield">Brasão de Chama</option>
                                    </select>
                                </div>
                            </div>

                            <h3><i class="fas fa-dice-d20"></i> CORES & ANIMAÇÕES DOS DADOS (NORMAL / HARD / WIGGLE)</h3>
                            <div class="grid-3">
                                <div class="die-cfg-box">
                                    <label>DADO NORMAL (D10)</label>
                                    <div class="color-input-row">
                                        <input type="color" bind:value={editTalent.modularConfig.dieNormalColor} on:change={applyModularToTalentCSS} />
                                        <input type="text" bind:value={editTalent.modularConfig.dieNormalColor} on:change={applyModularToTalentCSS} />
                                    </div>
                                    <select bind:value={editTalent.modularConfig.dieNormalAnim} on:change={applyModularToTalentCSS}>
                                        <option value="none">Estático</option>
                                        <option value="float">Flutuar (Mana)</option>
                                        <option value="spin-slow">Rotação Orbital</option>
                                        <option value="reactor-pulse">Pulso de Brilho</option>
                                    </select>
                                </div>

                                <div class="die-cfg-box">
                                    <label>DADO HARD (D6)</label>
                                    <div class="color-input-row">
                                        <input type="color" bind:value={editTalent.modularConfig.dieHardColor} on:change={applyModularToTalentCSS} />
                                        <input type="text" bind:value={editTalent.modularConfig.dieHardColor} on:change={applyModularToTalentCSS} />
                                    </div>
                                    <select bind:value={editTalent.modularConfig.dieHardAnim} on:change={applyModularToTalentCSS}>
                                        <option value="none">Estático</option>
                                        <option value="reactor-pulse">Pulso Intenso</option>
                                        <option value="heartbeat">Batimento</option>
                                        <option value="float">Flutuar</option>
                                    </select>
                                </div>

                                <div class="die-cfg-box">
                                    <label>DADO WIGGLE (D20)</label>
                                    <div class="color-input-row">
                                        <input type="color" bind:value={editTalent.modularConfig.dieWiggleColor} on:change={applyModularToTalentCSS} />
                                        <input type="text" bind:value={editTalent.modularConfig.dieWiggleColor} on:change={applyModularToTalentCSS} />
                                    </div>
                                    <select bind:value={editTalent.modularConfig.dieWiggleAnim} on:change={applyModularToTalentCSS}>
                                        <option value="reactor-pulse">Reator Nuclear (Pulso)</option>
                                        <option value="heartbeat">Batimento Cardíaco</option>
                                        <option value="glitch-shake">Vibração / Glitch</option>
                                        <option value="spin-slow">Rotação</option>
                                        <option value="none">Estático</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    {/if}
                {/if}

                <!-- ==================== ABA 3: ACESSO, PASSE & JOGADORES (COMUM A AMBOS) ==================== -->
                {#if editorSubTab === 'access'}
                    {@const targetObj = studioMode === 'sheet' ? editSheet : editTalent}
                    <div class="form-section" in:fade={{ duration: 120 }}>
                        <h3><i class="fas fa-ticket-alt"></i> DISPONIBILIDADE POR TIER DO PASSE DE BATALHA</h3>
                        <p class="section-hint">
                            Selecione a partir de qual Tier do Passe este tema fica liberado automaticamente, ou marque <strong>Exclusivo / Venda Individual</strong> para liberá-lo apenas aos jogadores marcados abaixo.
                        </p>

                        <div class="tier-selector-cards">
                            {#each PASS_OPTIONS as po}
                                <button
                                    type="button"
                                    class="tier-option-card"
                                    class:active={targetObj.minPassTier === po.id}
                                    style="--t-col: {po.color}"
                                    on:click={() => {
                                        if (studioMode === 'sheet') editSheet.minPassTier = po.id;
                                        else editTalent.minPassTier = po.id;
                                    }}
                                >
                                    <span class="t-name">{po.label}</span>
                                </button>
                            {/each}
                        </div>

                        <div class="hide-locked-row">
                            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                                {#if studioMode === 'sheet'}
                                    <input type="checkbox" bind:checked={editSheet.hideWhenLocked} />
                                {:else}
                                    <input type="checkbox" bind:checked={editTalent.hideWhenLocked} />
                                {/if}
                                <span><strong>Ocultar tema da lista</strong> para jogadores que ainda não possuem acesso (útil para temas secretos/comissionados).</span>
                            </label>
                        </div>

                        <h3><i class="fas fa-users"></i> LIBERAÇÃO INDIVIDUAL POR JOGADOR (COMPRADORES / VIP)</h3>
                        <p class="section-hint">
                            Jogadores marcados abaixo terão acesso garantido a este tema <strong>independentemente do Tier do Passe</strong>.
                        </p>

                        <div class="player-access-toolbar">
                            <div class="search-input-wrap" style="flex:1;">
                                <i class="fas fa-search"></i>
                                <input type="text" bind:value={playerSearchQuery} placeholder="Pesquisar jogador ou personagem..." />
                            </div>
                            <button type="button" class="mini-btn" on:click={() => {
                                const allIds = (game.users?.contents || []).filter(u => !u.isGM).map(u => u.id);
                                if (studioMode === 'sheet') editSheet.allowedUsers = allIds;
                                else editTalent.allowedUsers = allIds;
                            }}>Marcar Todos</button>
                            <button type="button" class="mini-btn" on:click={() => {
                                if (studioMode === 'sheet') editSheet.allowedUsers = [];
                                else editTalent.allowedUsers = [];
                            }}>Limpar</button>
                        </div>

                        <div class="players-check-grid">
                            {#each allPlayers as u (u.id)}
                                {@const pTier = PassSystem.getPlayerTier(u.id)}
                                {@const isChecked = targetObj.allowedUsers.includes(u.id)}
                                <button
                                    type="button"
                                    class="player-check-card"
                                    class:checked={isChecked}
                                    on:click={() => toggleAllowedUser(u.id)}
                                >
                                    <div class="p-check-icon">
                                        <i class="fas {isChecked ? 'fa-check-square' : 'fa-square'}"></i>
                                    </div>
                                    <div class="p-info">
                                        <span class="p-uname">{u.name}</span>
                                        <span class="p-cname">{u.character?.name || 'Sem ficha vinculada'}</span>
                                    </div>
                                    <span class="p-tier-badge" style="color: {pTier.color}; border-color: {pTier.color}55;">
                                        {pTier.id.toUpperCase()}
                                    </span>
                                </button>
                            {/each}
                            {#if allPlayers.length === 0}
                                <div class="empty-players">Nenhum jogador encontrado.</div>
                            {/if}
                        </div>
                    </div>
                {/if}

                <!-- ==================== ABA 4: CSS AVANÇADO ==================== -->
                {#if editorSubTab === 'code'}
                    <div class="form-section" in:fade={{ duration: 120 }}>
                        {#if studioMode === 'sheet'}
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <h3><i class="fas fa-code"></i> EXTRA CSS DO TEMA DE FICHA (.theme-{activePreviewKey})</h3>
                                <span style="font-size:10px; color:#888;">Use <code>.theme-{activePreviewKey}</code> como seletor raiz</span>
                            </div>
                            <textarea
                                class="code-textarea custom-scroll"
                                bind:value={editSheet.rawExtraCSS}
                                placeholder="/* Insira regras CSS e @keyframes personalizados para .theme-{activePreviewKey} */"
                            ></textarea>
                        {:else}
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <h3><i class="fas fa-code"></i> CSS DO CARD DE TALENTO (USE & COMO RAIZ DO CARD)</h3>
                                <button type="button" class="mini-btn" on:click={applyModularToTalentCSS}>
                                    <i class="fas fa-magic"></i> Regerar CSS dos Módulos
                                </button>
                            </div>
                            <textarea
                                class="code-textarea custom-scroll"
                                bind:value={editTalent.css}
                                placeholder="/* O símbolo & é substituído automaticamente por .power-card.theme-{activePreviewKey} */"
                            ></textarea>
                        {/if}
                    </div>
                {/if}
            </div>

            <footer class="editor-footer">
                <button type="button" class="reset-del-btn" on:click={resetOrDeleteCurrent}>
                    <i class="fas fa-undo"></i>
                    {#if isCreatingNew}
                        CANCELAR CRIAÇÃO
                    {:else if (studioMode === 'sheet' ? CustomThemeDB.isBuiltinSheetTheme(selectedKey) : CustomThemeDB.isBuiltinTalentTheme(selectedKey))}
                        RESTAURAR PADRÃO ORIGINAL
                    {:else}
                        EXCLUIR TEMA CUSTOMIZADO
                    {/if}
                </button>
                <button type="button" class="action-btn save-btn" on:click={saveCurrentTheme}>
                    <i class="fas fa-save"></i> SALVAR E APLICAR NA MESA
                </button>
            </footer>
        </section>

        <!-- COLUNA 3: LIVE PREVIEW INTERATIVO -->
        <aside class="preview-sidebar">
            <div class="preview-header">
                <span><i class="fas fa-eye"></i> LIVE PREVIEW INTERATIVO</span>
                <span class="preview-badge">{CustomThemeDB.getAccessRequirementLabel(studioMode === 'sheet' ? editSheet : editTalent)}</span>
            </div>

            {#if studioMode === 'sheet'}
                {@html previewSheetScopedCSS}
                <div class="sheet-preview-stage theme-{activePreviewKey}" style="{previewSheetVars}">
                    <div class="inner-terminal-screen preview-terminal-screen">
                        <div class="preview-status-bar">
                            <span>● ONLINE</span>
                            <span>MULTIVERSUS OS // {editSheet.label}</span>
                            <span>NV 5</span>
                        </div>

                        <div class="preview-body">
                            <!-- Mini Card de Perfil -->
                            <div class="bio-card preview-bio-card">
                                <div class="card-header preview-card-head">
                                    <span><i class="fas {editSheet.icon || 'fa-terminal'}"></i> AGENTE NEXUS</span>
                                    <button type="button" class="sync-btn preview-mini-btn">PASSE</button>
                                </div>
                                <div class="preview-profile-row">
                                    <div class="portrait preview-portrait">
                                        <i class="fas fa-user-astronaut"></i>
                                    </div>
                                    <div class="preview-stats">
                                        <div class="input-name preview-name">OPERADOR_01</div>
                                        <div class="preview-desc">{editSheet.desc || 'SISTEMA OPERACIONAL ATIVO.'}</div>
                                        <div class="xp-header preview-xp-track">
                                            <div class="xp-fill preview-xp-fill"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Mini Ícones do Desktop -->
                            <div class="preview-desktop-icons">
                                <button type="button" class="icon-btn preview-icon-btn">
                                    <div class="icon-frame preview-icon-frame"><i class="fas fa-crosshairs"></i></div>
                                    <span class="preview-icon-lbl">COMBATE</span>
                                </button>
                                <button type="button" class="icon-btn preview-icon-btn">
                                    <div class="icon-frame preview-icon-frame"><i class="fas fa-id-card"></i></div>
                                    <span class="preview-icon-lbl">PERFIL</span>
                                </button>
                                <button type="button" class="icon-btn preview-icon-btn">
                                    <div class="icon-frame preview-icon-frame"><i class="fas fa-bolt"></i></div>
                                    <span class="preview-icon-lbl">TALENTOS</span>
                                </button>
                            </div>

                            <!-- Mini Login Bio-Scanner -->
                            <div class="login-layer preview-login-box">
                                <div class="login-container preview-login-container">
                                    <div class="bio-scanner preview-bio-scanner">
                                        <i class="fas {editSheet.icon || 'fa-fingerprint'}"></i>
                                    </div>
                                    <div class="login-msg preview-login-msg">PASSE O MOUSE PARA TESTAR EFEITOS</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            {:else}
                {@html previewTalentScopedCSS}
                <div class="talent-preview-stage">
                    <div class="power-card theme-preview-live expanded" style="--glow: {editTalent.color || '#00ff41'}; cursor: default;">
                        <div class="card-front">
                            <div class="icon-box" style="display:flex; align-items:center; justify-content:center;">
                                <i class="fas {editTalent.icon || 'fa-bolt'} power-img" style="font-size: 22px; color: {editTalent.color}; display:flex; align-items:center; justify-content:center;"></i>
                            </div>
                            <div class="info-box">
                                <div class="header-row">
                                    <span class="power-name">{editTalent.label || 'TALENTO EXEMPLO'}</span>
                                    <span class="xp-badge">32 XP</span>
                                </div>
                                <div class="meta-row">
                                    <span class="meta-tag">PRINCIPAL</span>
                                    <span class="meta-tag">MÍTICO</span>
                                    <span class="dice-count">TOTAL: <strong>6</strong></span>
                                </div>
                            </div>
                        </div>

                        <div class="panel-drawer upgrade-panel">
                            <div class="xp-hud">
                                <div class="xp-label">XP DISPONÍVEL</div>
                                <div class="xp-value">120</div>
                            </div>
                            <div class="dice-matrix">
                                <div class="die-card normal affordable">
                                    <div class="die-header">
                                        <div class="die-icon normal"><i class="fas fa-dice-d10"></i></div>
                                        <span class="die-text">NORMAL</span>
                                    </div>
                                    <div class="die-screen">3</div>
                                    <button type="button" class="btn-buy">
                                        <span class="lbl">UPGRADE</span>
                                        <span class="cost">8 XP</span>
                                    </button>
                                </div>
                                <div class="die-card hard affordable">
                                    <div class="die-header">
                                        <div class="die-icon hard"><i class="fas fa-dice-d6"></i></div>
                                        <span class="die-text">HARD</span>
                                    </div>
                                    <div class="die-screen">2</div>
                                    <button type="button" class="btn-buy">
                                        <span class="lbl">UPGRADE</span>
                                        <span class="cost">16 XP</span>
                                    </button>
                                </div>
                                <div class="die-card wiggle affordable">
                                    <div class="die-header">
                                        <div class="die-icon wiggle"><i class="fas fa-dice-d20"></i></div>
                                        <span class="die-text">WIGGLE</span>
                                    </div>
                                    <div class="die-screen">1</div>
                                    <button type="button" class="btn-buy">
                                        <span class="lbl">UPGRADE</span>
                                        <span class="cost">32 XP</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p class="preview-tip">Passe o mouse sobre os botões de UPGRADE e observe as animações dos dados e do card ao vivo.</p>
                </div>
            {/if}
        </aside>
    </div>
</div>

<style>
    .theme-studio-root {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        background: rgba(4, 6, 10, 0.96);
        color: #e0e6ed;
        font-family: 'Share Tech Mono', monospace;
        overflow: hidden;
    }

    .studio-topbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 14px;
        background: rgba(0, 0, 0, 0.85);
        border-bottom: 1px solid var(--c-primary, #00ff41);
        gap: 10px;
        flex-wrap: wrap;
    }

    .mode-tabs {
        display: flex;
        gap: 8px;
    }

    .mode-tab {
        background: #0c1017;
        border: 1px solid #2b3545;
        color: #8b9bb4;
        padding: 7px 14px;
        border-radius: 4px;
        cursor: pointer;
        font-family: inherit;
        font-weight: bold;
        font-size: 12px;
        transition: 0.2s;
    }

    .mode-tab.active {
        background: var(--c-primary, #00ff41);
        color: #000;
        border-color: var(--c-primary, #00ff41);
        box-shadow: 0 0 12px rgba(0, 255, 65, 0.4);
    }

    .topbar-actions {
        display: flex;
        gap: 8px;
    }

    .action-btn {
        padding: 7px 12px;
        border-radius: 4px;
        font-family: inherit;
        font-weight: bold;
        font-size: 11px;
        cursor: pointer;
        border: 1px solid #444;
        background: #111;
        color: #fff;
        transition: 0.2s;
    }

    .new-btn { border-color: #00e5ff; color: #00e5ff; background: rgba(0, 229, 255, 0.1); }
    .new-btn:hover { background: #00e5ff; color: #000; }
    .dup-btn { border-color: #ffaa00; color: #ffaa00; background: rgba(255, 170, 0, 0.1); }
    .dup-btn:hover { background: #ffaa00; color: #000; }
    .save-btn { border-color: #00ff41; background: #00ff41; color: #000; box-shadow: 0 0 10px rgba(0, 255, 65, 0.3); }
    .save-btn:hover { filter: brightness(1.15); box-shadow: 0 0 18px rgba(0, 255, 65, 0.6); }

    .studio-workspace {
        display: grid;
        grid-template-columns: 240px 1fr 310px;
        flex: 1;
        min-height: 0;
        overflow: hidden;
    }

    /* SIDEBAR DE LISTA */
    .themes-sidebar {
        border-right: 1px solid #1e2631;
        display: flex;
        flex-direction: column;
        background: rgba(0, 0, 0, 0.55);
        min-height: 0;
    }

    .sidebar-filters {
        padding: 8px;
        border-bottom: 1px solid #1e2631;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .search-input-wrap {
        display: flex;
        align-items: center;
        gap: 6px;
        background: #06080c;
        border: 1px solid #2b3545;
        padding: 4px 8px;
        border-radius: 4px;
    }

    .search-input-wrap input {
        background: transparent;
        border: none;
        color: #fff;
        font-family: inherit;
        font-size: 11px;
        width: 100%;
        outline: none;
    }

    .tier-filter-select {
        background: #06080c;
        border: 1px solid #2b3545;
        color: #ccc;
        padding: 4px 6px;
        border-radius: 4px;
        font-family: inherit;
        font-size: 11px;
    }

    .themes-list {
        flex: 1;
        overflow-y: auto;
        padding: 6px;
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .theme-list-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        background: rgba(15, 19, 26, 0.85);
        border: 1px solid #232b38;
        border-left: 4px solid var(--item-col, #00ff41);
        border-radius: 4px;
        cursor: pointer;
        text-align: left;
        color: #d0d8e4;
        font-family: inherit;
        transition: 0.15s;
    }

    .theme-list-item:hover, .theme-list-item.selected {
        background: rgba(0, 255, 65, 0.08);
        border-color: var(--item-col, #00ff41);
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    }

    .item-icon {
        width: 28px;
        height: 28px;
        border-radius: 4px;
        background: rgba(0,0,0,0.5);
        border: 1px solid var(--item-col, #00ff41);
        color: var(--item-col, #00ff41);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        flex-shrink: 0;
    }

    .item-meta { flex: 1; min-width: 0; }
    .item-title-row { display: flex; justify-content: space-between; align-items: center; gap: 4px; }
    .item-name { font-weight: bold; font-size: 11px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .item-badge { font-size: 8px; padding: 1px 4px; border-radius: 2px; font-weight: bold; }
    .item-badge.builtin { background: #1e293b; color: #94a3b8; }
    .item-badge.custom { background: rgba(0, 229, 255, 0.2); color: #00e5ff; border: 1px solid #00e5ff; }
    .item-sub-row { display: flex; justify-content: space-between; font-size: 9px; color: #7e8ba0; margin-top: 2px; }
    .item-vip-tag { font-size: 9px; color: #ffcc00; margin-top: 2px; }

    /* EDITOR CENTRAL */
    .editor-main {
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow: hidden;
    }

    .editor-subtabs {
        display: flex;
        background: #080b10;
        border-bottom: 1px solid #1e2631;
    }

    .editor-subtabs button {
        flex: 1;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        color: #8896ab;
        padding: 9px 6px;
        font-family: inherit;
        font-size: 11px;
        font-weight: bold;
        cursor: pointer;
        transition: 0.2s;
    }

    .editor-subtabs button.active {
        color: var(--c-primary, #00ff41);
        border-bottom-color: var(--c-primary, #00ff41);
        background: rgba(0, 255, 65, 0.05);
    }

    .editor-body {
        flex: 1;
        overflow-y: auto;
        padding: 14px;
    }

    .form-section h3 {
        font-size: 12px;
        color: var(--c-primary, #00ff41);
        border-bottom: 1px solid #1e2631;
        padding-bottom: 5px;
        margin: 12px 0 10px 0;
    }
    .form-section h3:first-child { margin-top: 0; }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 10px; }

    .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
    .field label, .color-field label { font-size: 10px; color: #94a3b8; font-weight: bold; }
    .field input, .field select {
        background: #06080c;
        border: 1px solid #2b3545;
        color: #fff;
        padding: 6px 8px;
        border-radius: 4px;
        font-family: inherit;
        font-size: 11px;
    }

    .color-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .color-input-row { display: flex; gap: 6px; align-items: center; }
    .color-input-row input[type="color"] { width: 34px; height: 28px; padding: 0; border: 1px solid #444; background: #000; cursor: pointer; border-radius: 4px; }
    .color-input-row input[type="text"] { flex: 1; background: #06080c; border: 1px solid #2b3545; color: #fff; padding: 5px 8px; border-radius: 4px; font-family: inherit; font-size: 11px; }

    .icon-picker-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(30px, 1fr));
        gap: 5px;
        background: #06080c;
        padding: 8px;
        border-radius: 4px;
        border: 1px solid #1e2631;
    }

    .icon-pick-btn {
        height: 28px;
        background: #11161f;
        border: 1px solid #2b3545;
        color: #94a3b8;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .icon-pick-btn:hover, .icon-pick-btn.active {
        background: var(--c-primary, #00ff41);
        color: #000;
        border-color: #fff;
    }

    .modular-toggle-banner {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        background: rgba(0, 229, 255, 0.07);
        border: 1px solid rgba(0, 229, 255, 0.35);
        padding: 10px 12px;
        border-radius: 6px;
        margin-bottom: 12px;
    }
    .modular-toggle-banner strong { color: #00e5ff; font-size: 11px; }
    .modular-toggle-banner p { margin: 3px 0 0 0; font-size: 10px; color: #94a3b8; }

    .apply-mod-btn {
        background: #00e5ff;
        color: #000;
        border: none;
        padding: 7px 12px;
        border-radius: 4px;
        font-family: inherit;
        font-weight: bold;
        font-size: 10px;
        cursor: pointer;
        white-space: nowrap;
    }

    .input-with-btn { display: flex; gap: 6px; }
    .input-with-btn input { flex: 1; }
    .input-with-btn button { background: #141b24; border: 1px solid #00e5ff; color: #00e5ff; padding: 0 12px; border-radius: 4px; cursor: pointer; }

    .die-cfg-box {
        background: #080b10;
        border: 1px solid #232b38;
        padding: 8px;
        border-radius: 6px;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }
    .die-cfg-box label { font-size: 10px; color: #00e5ff; font-weight: bold; }
    .die-cfg-box select { background: #06080c; border: 1px solid #2b3545; color: #fff; padding: 4px; border-radius: 4px; font-family: inherit; font-size: 10px; }

    /* ACESSO & PASSE */
    .section-hint { font-size: 10px; color: #94a3b8; margin: 0 0 10px 0; line-height: 1.4; }
    .tier-selector-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
    .tier-option-card {
        background: #090d14;
        border: 1px solid #263040;
        border-left: 4px solid var(--t-col);
        color: #ccc;
        padding: 9px 10px;
        border-radius: 4px;
        cursor: pointer;
        text-align: left;
        font-family: inherit;
        font-size: 11px;
        font-weight: bold;
        transition: 0.15s;
    }
    .tier-option-card.active {
        background: rgba(255, 255, 255, 0.08);
        border-color: var(--t-col);
        color: #fff;
        box-shadow: 0 0 12px rgba(0, 0, 0, 0.6);
    }

    .hide-locked-row {
        background: rgba(255, 255, 255, 0.03);
        border: 1px dashed #2b3545;
        padding: 8px 10px;
        border-radius: 4px;
        font-size: 10px;
        margin-bottom: 14px;
    }

    .player-access-toolbar { display: flex; gap: 6px; margin-bottom: 8px; align-items: center; }
    .mini-btn {
        background: #141b24;
        border: 1px solid #38465a;
        color: #cbd5e1;
        padding: 5px 10px;
        border-radius: 4px;
        font-family: inherit;
        font-size: 10px;
        cursor: pointer;
    }
    .mini-btn:hover { border-color: #00e5ff; color: #00e5ff; }

    .players-check-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
        max-height: 220px;
        overflow-y: auto;
    }

    .player-check-card {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 7px 9px;
        background: #080b10;
        border: 1px solid #222a36;
        border-radius: 4px;
        cursor: pointer;
        text-align: left;
        font-family: inherit;
        color: #94a3b8;
    }
    .player-check-card.checked {
        border-color: #00ff41;
        background: rgba(0, 255, 65, 0.08);
        color: #fff;
    }
    .p-check-icon { color: #00ff41; font-size: 13px; }
    .p-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .p-uname { font-size: 11px; font-weight: bold; color: #fff; }
    .p-cname { font-size: 9px; color: #64748b; }
    .p-tier-badge { font-size: 8px; padding: 2px 5px; border: 1px solid; border-radius: 3px; font-weight: bold; }

    .code-textarea {
        width: 100%;
        height: 360px;
        background: #040608;
        border: 1px solid #2b3545;
        color: #00ff88;
        padding: 10px;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        line-height: 1.45;
        resize: vertical;
        box-sizing: border-box;
    }

    .editor-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 14px;
        background: #080b10;
        border-top: 1px solid #1e2631;
    }

    .reset-del-btn {
        background: rgba(255, 51, 51, 0.1);
        border: 1px solid #ff4444;
        color: #ff5555;
        padding: 7px 12px;
        border-radius: 4px;
        font-family: inherit;
        font-size: 11px;
        font-weight: bold;
        cursor: pointer;
    }
    .reset-del-btn:hover { background: #ff4444; color: #000; }

    /* COLUNA 3: PREVIEW */
    .preview-sidebar {
        border-left: 1px solid #1e2631;
        background: #040609;
        display: flex;
        flex-direction: column;
        padding: 10px;
        gap: 10px;
        overflow-y: auto;
    }

    .preview-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 10px;
        font-weight: bold;
        color: #00e5ff;
        border-bottom: 1px solid #1e2631;
        padding-bottom: 6px;
    }
    .preview-badge {
        background: rgba(0, 229, 255, 0.12);
        border: 1px solid rgba(0, 229, 255, 0.4);
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 9px;
    }

    /* MINI FICHA PREVIEW */
    .sheet-preview-stage {
        flex: 1;
        border: 2px solid var(--c-primary, #00ff41);
        border-radius: 6px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        background: var(--c-bg, #050505);
        color: var(--c-text, #fff);
        font-family: var(--font-body, monospace);
        position: relative;
        box-shadow: 0 0 20px rgba(0,0,0,0.8);
    }

    .preview-terminal-screen {
        position: relative;
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 8px;
        gap: 10px;
        overflow: hidden;
    }

    .preview-status-bar {
        display: flex;
        justify-content: space-between;
        background: rgba(0,0,0,0.8);
        border-bottom: 1px solid var(--c-primary);
        padding: 4px 8px;
        font-size: 9px;
        font-family: var(--font-head);
        color: var(--c-primary);
        font-weight: bold;
        z-index: 2;
    }

    .preview-body {
        display: flex;
        flex-direction: column;
        gap: 10px;
        z-index: 2;
    }

    .preview-bio-card {
        background: var(--c-panel, rgba(15, 20, 25, 0.85));
        border: var(--f-border, 1px solid var(--c-primary));
        padding: 8px;
        border-radius: 4px;
        transition: 0.3s;
    }

    .preview-card-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-family: var(--font-head);
        font-size: 10px;
        color: var(--c-primary);
        border-bottom: 1px solid var(--c-primary);
        padding-bottom: 4px;
        margin-bottom: 8px;
    }

    .preview-mini-btn {
        background: transparent;
        border: 1px solid var(--c-primary);
        color: var(--c-primary);
        font-size: 8px;
        padding: 2px 6px;
        cursor: pointer;
        font-family: inherit;
    }

    .preview-profile-row { display: flex; gap: 10px; align-items: center; }
    .preview-portrait {
        width: 44px;
        height: 44px;
        border: 2px solid var(--c-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        color: var(--c-primary);
        background: #000;
        flex-shrink: 0;
    }
    .preview-stats { flex: 1; min-width: 0; }
    .preview-name { font-family: var(--font-head); font-weight: bold; font-size: 12px; color: var(--c-primary); }
    .preview-desc { font-size: 9px; opacity: 0.8; margin: 3px 0 6px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .preview-xp-track { height: 6px; background: #000; border: 1px solid var(--c-primary); border-radius: 3px; overflow: hidden; }
    .preview-xp-fill { width: 72%; height: 100%; background: var(--c-primary); }

    .preview-desktop-icons {
        display: flex;
        justify-content: space-around;
        padding: 6px 0;
    }
    .preview-icon-btn {
        background: transparent;
        border: none;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        cursor: pointer;
        color: var(--c-primary);
    }
    .preview-icon-frame {
        width: 42px;
        height: 42px;
        border: 2px solid var(--c-primary);
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        color: var(--c-primary);
        clip-path: polygon(15% 0, 100% 0, 100% 85%, 85% 100%, 0 100%, 0 15%);
        transition: 0.25s;
    }
    .preview-icon-lbl { font-size: 8px; font-family: var(--font-head); color: var(--c-primary); }

    .preview-login-box {
        position: relative;
        height: 115px;
        border: 1px dashed rgba(255,255,255,0.15);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        background: var(--c-bg);
    }
    .preview-login-container {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        z-index: 2;
    }
    .preview-bio-scanner {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        border: 2px solid var(--c-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        color: var(--c-primary);
        background: rgba(0,0,0,0.7);
        box-shadow: 0 0 15px var(--c-primary);
    }
    .preview-login-msg { font-size: 8px; letter-spacing: 1px; color: var(--c-primary); text-align: center; }

    /* TALENT CARD PREVIEW */
    .talent-preview-stage {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding-top: 10px;
    }
    .talent-preview-stage .power-card {
        background: #050505; border: 1px solid #333; border-left: 4px solid var(--glow);
        border-radius: 6px; font-family: 'Segoe UI', sans-serif; position: relative; overflow: hidden;
        box-shadow: 0 4px 10px rgba(0,0,0,0.6);
    }
    .talent-preview-stage .card-front { display: flex; align-items: center; padding: 10px 8px; min-height: 64px; background: linear-gradient(90deg, #111 0%, #080808 100%); position: relative; z-index: 10; }
    .talent-preview-stage .icon-box { width: 48px; height: 48px; margin-right: 10px; border: 1px solid #444; border-radius: 8px; overflow: hidden; position: relative; flex-shrink: 0; }
    .talent-preview-stage .info-box { flex: 1; min-width: 0; }
    .talent-preview-stage .header-row { display: flex; justify-content: space-between; align-items: center; gap: 4px; }
    .talent-preview-stage .power-name { font-weight: 800; color: #fff; font-size: 12px; text-transform: uppercase; }
    .talent-preview-stage .xp-badge { font-size: 10px; color: #000; background: var(--glow); padding: 2px 7px; border-radius: 10px; font-weight: bold; }
    .talent-preview-stage .meta-row { display: flex; gap: 6px; margin-top: 5px; font-size: 9px; color: #888; align-items: center; }
    .talent-preview-stage .meta-tag { background: #222; padding: 2px 5px; border-radius: 4px; border: 1px solid #333; }
    .talent-preview-stage .panel-drawer { background: #0c0c0c; border-top: 1px solid var(--glow); padding: 10px; position: relative; }
    .talent-preview-stage .xp-hud { background: #000; border: 1px solid #333; border-radius: 6px; padding: 5px 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .talent-preview-stage .xp-label { font-size: 9px; color: #888; font-weight: bold; }
    .talent-preview-stage .xp-value { font-size: 13px; color: var(--glow); font-weight: bold; }
    .talent-preview-stage .dice-matrix { display: flex; gap: 6px; }
    .talent-preview-stage .die-card { flex: 1; background: #151515; border: 1px solid #333; border-radius: 6px; display: flex; flex-direction: column; align-items: center; padding: 6px 3px; }
    .talent-preview-stage .die-header { width: 100%; text-align: center; border-bottom: 1px dashed #333; padding-bottom: 3px; margin-bottom: 4px; display: flex; flex-direction: column; align-items: center; }
    .talent-preview-stage .die-icon { font-size: 20px; height: 26px; display: flex; align-items: center; justify-content: center; }
    .talent-preview-stage .die-text { font-size: 8px; font-weight: bold; color: #888; }
    .talent-preview-stage .die-screen { font-size: 20px; font-weight: 900; color: #fff; margin-bottom: 6px; }
    .talent-preview-stage .btn-buy { width: 92%; border: 1px solid #555; background: #333; color: #fff; border-radius: 4px; padding: 4px 2px; cursor: pointer; display: flex; flex-direction: column; align-items: center; font-size: 9px; font-weight: bold; }
    .preview-tip { font-size: 10px; color: #64748b; text-align: center; line-height: 1.4; }
</style>
