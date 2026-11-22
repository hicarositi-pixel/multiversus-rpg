import { SHEET_THEMES } from '../data/SheetThemeDB.js';
import { THEME_DB } from '../data/ThemeDB.js';
import { PASS_TIERS, PassSystem } from '../PassSystem.js';
import { loadPowerThemes } from '../utils/ThemeLoader.js';
import { ThemeEngine } from './ThemeEngine.js';

const MODULE_ID = "multiversus-rpg";

const TIER_ORDER = ["cobre", "prata", "ouro", "diamante", "gambiarrite"];

const DEFAULT_FREE_SHEET_THEMES = ['terminal', 'chamas', 'blue_magic', 'lobby'];

const BUILTIN_SHEET_SNAPSHOT = {};
const BUILTIN_TALENT_SNAPSHOT = {};

function cloneDeep(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function captureSnapshotsOnce() {
    if (Object.keys(BUILTIN_SHEET_SNAPSHOT).length === 0) {
        for (const [k, v] of Object.entries(SHEET_THEMES)) {
            BUILTIN_SHEET_SNAPSHOT[k] = cloneDeep({
                ...v,
                icon: v.icon || 'fa-terminal',
                minPassTier: v.minPassTier || (DEFAULT_FREE_SHEET_THEMES.includes(k) ? 'cobre' : 'prata'),
                allowedUsers: Array.isArray(v.allowedUsers) ? v.allowedUsers : [],
                hideWhenLocked: Boolean(v.hideWhenLocked),
                isBuiltin: true
            });
        }
    }
    if (Object.keys(BUILTIN_TALENT_SNAPSHOT).length === 0) {
        for (const [k, v] of Object.entries(THEME_DB)) {
            BUILTIN_TALENT_SNAPSHOT[k] = cloneDeep({
                ...v,
                icon: v.icon || 'fa-bolt',
                color: v.color || '#00ff41',
                minPassTier: v.minPassTier || 'cobre',
                allowedUsers: Array.isArray(v.allowedUsers) ? v.allowedUsers : [],
                hideWhenLocked: Boolean(v.hideWhenLocked),
                isBuiltin: true
            });
        }
    }
}

export function generateModularSheetCSS(themeKey, cfg = {}, vars = {}) {
    if (!cfg || !cfg.enabled) return "";
    const cls = `.theme-${themeKey}`;
    const primary = vars['--c-primary'] || '#00ff41';
    const secondary = vars['--c-secondary'] || primary;
    const panelBg = vars['--c-panel'] || 'rgba(10, 15, 20, 0.85)';
    const textCol = vars['--c-text'] || '#ffffff';

    let css = `\n/* === MODULAR ENGINE: ${themeKey} === */\n`;

    // 1. Formato de Painéis e Geometria
    if (cfg.shapePreset === 'rounded-glass') {
        css += `
        ${cls} .cyber-panel, ${cls} .cyber-list, ${cls} .bio-card, ${cls} .body-art-container,
        ${cls} .resource-display, ${cls} .willpower-module, ${cls} .origin-display, ${cls} .stat-block, ${cls} .hud-module {
            background: ${panelBg} !important;
            border-radius: 12px !important;
            border: 1px solid ${primary}88 !important;
            box-shadow: 0 0 18px ${primary}22 !important;
            backdrop-filter: blur(6px) !important;
            clip-path: none !important;
        }
        `;
    } else if (cfg.shapePreset === 'royal-double') {
        css += `
        ${cls} .cyber-panel, ${cls} .cyber-list, ${cls} .bio-card, ${cls} .body-art-container,
        ${cls} .resource-display, ${cls} .willpower-module, ${cls} .origin-display, ${cls} .stat-block, ${cls} .hud-module {
            background: ${panelBg} !important;
            border: 3px double ${primary} !important;
            border-radius: 3px !important;
            box-shadow: 0 4px 20px rgba(0,0,0,0.85), inset 0 0 15px ${secondary}22 !important;
        }
        `;
    } else if (cfg.shapePreset === 'hex-tech') {
        css += `
        ${cls} .cyber-panel, ${cls} .cyber-list, ${cls} .bio-card, ${cls} .body-art-container,
        ${cls} .resource-display, ${cls} .willpower-module, ${cls} .origin-display, ${cls} .stat-block {
            background: ${panelBg} !important;
            border: 1px solid ${primary}66 !important;
            border-left: 4px solid ${primary} !important;
            box-shadow: inset 0 0 20px ${primary}18 !important;
        }
        `;
    } else if (cfg.shapePreset === 'sharp-minimal') {
        css += `
        ${cls} .cyber-panel, ${cls} .cyber-list, ${cls} .bio-card, ${cls} .body-art-container,
        ${cls} .resource-display, ${cls} .willpower-module, ${cls} .origin-display, ${cls} .stat-block {
            background: ${panelBg} !important;
            border: 1px solid ${primary} !important;
            border-radius: 0px !important;
            clip-path: none !important;
        }
        `;
    }

    // 2. Formato dos Ícones do Desktop & Retrato
    if (cfg.iconShape === 'hexagon') {
        css += `
        ${cls} .icon-frame {
            clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%) !important;
            border-color: ${primary} !important;
        }
        `;
    } else if (cfg.iconShape === 'circle') {
        css += `
        ${cls} .icon-frame, ${cls} .portrait {
            border-radius: 50% !important;
            clip-path: none !important;
            border: 2px solid ${primary} !important;
            box-shadow: 0 0 15px ${primary}55 !important;
        }
        `;
    } else if (cfg.iconShape === 'diamond') {
        css += `
        ${cls} .icon-frame {
            transform: rotate(45deg) !important;
            border-radius: 6px !important;
            clip-path: none !important;
            border: 2px solid ${primary} !important;
        }
        ${cls} .icon-frame i {
            transform: rotate(-45deg) !important;
        }
        `;
    } else if (cfg.iconShape === 'rounded') {
        css += `
        ${cls} .icon-frame, ${cls} .portrait {
            border-radius: 14px !important;
            clip-path: none !important;
            border: 2px solid ${primary} !important;
        }
        `;
    }

    // 3. Animação de Fundo da Ficha / Login
    if (cfg.bgAnimation === 'embers') {
        css += `
        ${cls} .inner-terminal-screen::before {
            content: ""; position: absolute; inset: 0;
            background-image: radial-gradient(circle, ${secondary} 1px, transparent 1px), radial-gradient(circle, ${primary} 1.5px, transparent 1.5px);
            background-size: 80px 80px, 120px 120px;
            opacity: 0.24; z-index: 1; pointer-events: none;
            animation: mv-mod-embers-${themeKey} 12s linear infinite;
        }
        @keyframes mv-mod-embers-${themeKey} {
            from { background-position: 0 0; }
            to { background-position: -100px -600px; }
        }
        `;
    } else if (cfg.bgAnimation === 'starfield') {
        css += `
        ${cls} .inner-terminal-screen::before {
            content: ""; position: absolute; inset: 0;
            background-image: radial-gradient(${textCol} 1px, transparent 1px), radial-gradient(${primary} 1px, transparent 1px);
            background-size: 50px 50px, 90px 90px;
            background-position: 0 0, 25px 25px;
            opacity: 0.22; z-index: 1; pointer-events: none;
            animation: mv-mod-stars-${themeKey} 18s linear infinite;
        }
        @keyframes mv-mod-stars-${themeKey} {
            from { background-position: 0 0, 25px 25px; }
            to { background-position: 50px -300px, 75px -275px; }
        }
        `;
    } else if (cfg.bgAnimation === 'void-core') {
        css += `
        ${cls} .login-layer::before, ${cls} .inner-terminal-screen::after {
            content: ""; position: absolute; top: 50%; left: 50%;
            width: 60px; height: 60px; border-radius: 50%;
            background: #ffffff;
            transform: translate(-50%, -50%);
            box-shadow: 0 0 35px 12px ${primary}, 0 0 90px 45px ${secondary}66;
            opacity: 0.35; pointer-events: none; z-index: 0;
            animation: mv-mod-void-${themeKey} 4s ease-in-out infinite;
        }
        @keyframes mv-mod-void-${themeKey} {
            0%, 100% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.28; }
            50% { transform: translate(-50%, -50%) scale(1.12); opacity: 0.48; }
        }
        `;
    } else if (cfg.bgAnimation === 'radial-aura') {
        css += `
        ${cls} .inner-terminal-screen {
            background: radial-gradient(circle at center, ${secondary}28 0%, var(--c-bg) 85%) !important;
        }
        `;
    }

    // 4. Imagem/Selo Decorativo no Login
    if (cfg.overlayImageUrl && cfg.overlayImageUrl.trim()) {
        css += `
        ${cls} .login-container::before {
            content: ""; position: absolute; width: 460px; height: 460px;
            top: 50%; left: 50%; transform: translate(-50%, -50%);
            background-image: url('${cfg.overlayImageUrl.trim()}');
            background-size: contain; background-repeat: no-repeat; background-position: center;
            opacity: 0.38; mix-blend-mode: screen; pointer-events: none; z-index: 0;
            animation: mv-mod-overlay-${themeKey} 12s linear infinite;
        }
        @keyframes mv-mod-overlay-${themeKey} {
            0% { transform: translate(-50%, -50%) rotate(0deg) scale(0.98); }
            50% { transform: translate(-50%, -50%) rotate(180deg) scale(1.04); }
            100% { transform: translate(-50%, -50%) rotate(360deg) scale(0.98); }
        }
        `;
    }

    // 5. Animação de Hover em Botões / Ícones / Cards
    if (cfg.hoverAnimation === 'heat-wave') {
        css += `
        ${cls} .icon-btn:hover .icon-frame, ${cls} .bio-card:hover, ${cls} .sync-btn:hover, ${cls} .edit-lore-btn:hover {
            animation: mv-mod-heat-${themeKey} 0.45s cubic-bezier(0.25, 1, 0.5, 1) forwards !important;
        }
        @keyframes mv-mod-heat-${themeKey} {
            0% { border-color: ${primary}; filter: blur(0px); }
            40% { border-color: ${secondary}; box-shadow: 0 0 22px ${secondary}; filter: blur(1.2px); transform: scale(1.03); }
            100% { border-color: ${secondary}; box-shadow: 0 0 18px ${secondary}; filter: blur(0px); transform: scale(1.03); }
        }
        `;
    } else if (cfg.hoverAnimation === 'fire-burst') {
        css += `
        ${cls} .icon-btn:hover .icon-frame, ${cls} .sync-btn:hover, ${cls} .edit-lore-btn:hover {
            background: ${primary} !important;
            color: #000 !important;
            border-color: ${secondary} !important;
            box-shadow: 0 0 25px ${primary}, 0 -4px 15px ${secondary} !important;
            transform: translateY(-2px) scale(1.05);
        }
        `;
    } else if (cfg.hoverAnimation === 'glitch-shift') {
        css += `
        ${cls} .icon-btn:hover .icon-frame, ${cls} .sync-btn:hover {
            box-shadow: 3px 0 0 ${primary}, -3px 0 0 ${secondary} !important;
            text-shadow: 2px 0 ${primary}, -2px 0 ${secondary} !important;
        }
        `;
    } else if (cfg.hoverAnimation === 'royal-shine') {
        css += `
        ${cls} .bio-card:hover, ${cls} .detail-box:hover, ${cls} .icon-btn:hover .icon-frame {
            border-color: ${secondary} !important;
            box-shadow: 0 0 22px ${primary}88, inset 0 0 15px ${secondary}44 !important;
            transform: translateY(-2px);
        }
        `;
    }

    // 6. Animação do Bio-Scanner
    if (cfg.scannerAnimation === 'burn-aura') {
        css += `
        ${cls} .bio-scanner {
            border: 3px solid ${primary} !important;
            box-shadow: 0 0 25px ${primary}, 0 0 45px ${secondary}, inset 0 0 25px ${primary} !important;
        }
        `;
    } else if (cfg.scannerAnimation === 'magic-seal') {
        css += `
        ${cls} .bio-scanner {
            border: 2px solid ${primary} !important;
            border-radius: 50% !important;
            box-shadow: 0 0 35px ${primary}, inset 0 0 20px ${secondary} !important;
        }
        `;
    }

    // 7. Barras de XP / Capacidade / Orbe
    if (cfg.barStyle === 'gradient-flow') {
        css += `
        ${cls} .xp-fill, ${cls} .cap-bar-fill, ${cls} .hud-bar-fill, ${cls} .bar-fill {
            background: linear-gradient(90deg, ${secondary}, ${primary}, ${secondary}) !important;
            box-shadow: 0 0 12px ${primary} !important;
        }
        ${cls} .prog-ring {
            stroke: ${primary} !important;
            filter: drop-shadow(0 0 8px ${secondary});
        }
        `;
    }

    return css;
}

export function generateModularTalentCSS(cfg = {}, baseColor = '#00ff41') {
    const c1 = cfg.bgColor1 || '#08080c';
    const c2 = cfg.bgColor2 || '#1a0a2a';
    const borderCol = cfg.borderColor || baseColor || '#00ff41';
    const accentCol = cfg.accentColor || baseColor || '#00ff41';
    const nameCol = cfg.nameColor || '#ffffff';
    const radius = cfg.cardRadius || '6px';
    const bStyle = cfg.borderStyle || 'solid';
    const font = cfg.fontFamily || "'Segoe UI', sans-serif";

    let bgRule = `background-color: ${c1} !important;`;
    if (cfg.bgStyle === 'linear-v') {
        bgRule = `background: linear-gradient(180deg, ${c1} 0%, ${c2} 100%) !important;`;
    } else if (cfg.bgStyle === 'linear-h') {
        bgRule = `background: linear-gradient(90deg, ${c1} 0%, ${c2} 100%) !important;`;
    } else if (cfg.bgStyle === 'radial') {
        bgRule = `background: radial-gradient(circle at center, ${c2} 0%, ${c1} 100%) !important;`;
    } else if (cfg.bgStyle === 'striped') {
        bgRule = `background: repeating-linear-gradient(45deg, ${c1}, ${c1} 10px, ${c2} 10px, ${c2} 20px) !important;`;
    } else if (cfg.bgStyle === 'amp-mesh') {
        bgRule = `background-color: ${c1} !important; background-image: radial-gradient(${c2} 18%, transparent 19%), radial-gradient(${c2} 18%, transparent 19%) !important; background-size: 10px 10px !important; background-position: 0 0, 5px 5px !important;`;
    }

    let borderRule = `border: 2px ${bStyle === 'left-accent' ? 'solid' : bStyle} ${borderCol} !important;`;
    if (bStyle === 'double') {
        borderRule = `border: 4px double ${borderCol} !important;`;
    } else if (bStyle === 'left-accent') {
        borderRule = `border: 1px solid ${borderCol}66 !important; border-left: 5px solid ${accentCol} !important;`;
    }

    let iconBoxRules = `border: 2px solid ${accentCol} !important; background: ${c1} !important; box-shadow: 0 0 12px ${accentCol}55;`;
    if (cfg.iconBoxShape === 'circle') {
        iconBoxRules += ` border-radius: 50% !important;`;
    } else if (cfg.iconBoxShape === 'diamond') {
        iconBoxRules += ` transform: rotate(45deg); width: 38px !important; height: 38px !important; margin: 8px 16px 8px 8px !important;`;
    } else if (cfg.iconBoxShape === 'fox-eye') {
        iconBoxRules += ` border-radius: 50% 0 50% 0 !important;`;
    } else if (cfg.iconBoxShape === 'flame-shield') {
        iconBoxRules += ` border-radius: 10px 10px 50% 50% !important;`;
    } else {
        iconBoxRules += ` border-radius: 8px !important;`;
    }

    const dNormCol = cfg.dieNormalColor || baseColor;
    const dHardCol = cfg.dieHardColor || accentCol;
    const dWigCol = cfg.dieWiggleColor || '#ffffff';

    let animRules = '';
    if (cfg.cardAnimation === 'holo-shine') {
        animRules += `
        &::after {
            content: ""; position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
            background: linear-gradient(to right, transparent, rgba(255,255,255,0.14), transparent);
            transform: skewX(-25deg); animation: mv-holo-shine 5s infinite; pointer-events: none; z-index: 6;
        }
        @keyframes mv-holo-shine { 0%, 75% { left: -100%; } 100% { left: 200%; } }
        `;
    } else if (cfg.cardAnimation === 'border-pulse') {
        animRules += `
        & { animation: mv-card-pulse 2.5s infinite alternate; }
        @keyframes mv-card-pulse {
            0% { box-shadow: 0 0 10px ${borderCol}44; border-color: ${borderCol}; }
            100% { box-shadow: 0 0 24px ${accentCol}aa, inset 0 0 20px ${accentCol}22; border-color: ${accentCol}; }
        }
        `;
    } else if (cfg.cardAnimation === 'particle-rise') {
        animRules += `
        &::before {
            content: ""; position: absolute; inset: 0;
            background-image: radial-gradient(${accentCol}55 1px, transparent 1px);
            background-size: 18px 18px;
            animation: mv-mana-rise 4s linear infinite;
            opacity: 0.55; pointer-events: none; z-index: 4;
        }
        @keyframes mv-mana-rise { 0% { background-position: 0 0; } 100% { background-position: 10px -36px; } }
        `;
    } else if (cfg.cardAnimation === 'scanlines') {
        animRules += `
        &::after {
            content: ""; position: absolute; inset: 0;
            background: repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, ${borderCol}14 3px);
            pointer-events: none; z-index: 5;
        }
        `;
    } else if (cfg.cardAnimation === 'cursor-blink') {
        animRules += `
        & .power-name::after { content: "_"; animation: mv-blink 1s step-end infinite; }
        @keyframes mv-blink { 50% { opacity: 0; } }
        `;
    }

    const dieAnimMap = {
        'none': '',
        'float': 'animation: mv-die-float 2s infinite ease-in-out;',
        'spin-slow': 'animation: mv-die-spin 9s linear infinite;',
        'reactor-pulse': 'animation: mv-die-reactor 0.6s infinite alternate;',
        'heartbeat': 'animation: mv-die-heart 1.4s infinite;',
        'glitch-shake': 'animation: mv-die-shake 0.3s infinite;'
    };

    return `
      & {
        ${bgRule}
        ${borderRule}
        border-radius: ${radius} !important;
        font-family: ${font} !important;
        box-shadow: 0 4px 15px rgba(0,0,0,0.6), 0 0 12px ${borderCol}33;
      }
      & .card-front {
        background: transparent !important;
      }
      & .power-name {
        color: ${nameCol} !important;
        text-shadow: 0 0 8px ${accentCol}66;
      }
      & .xp-badge {
        background: ${accentCol} !important;
        color: #000 !important;
      }
      & .icon-box {
        ${iconBoxRules}
      }
      ${cfg.iconBoxShape === 'diamond' ? '& .power-img { transform: rotate(-45deg) scale(1.38); }' : ''}
      & .die-card {
        background: ${c1}ee !important;
        border: 1px solid ${borderCol}66 !important;
      }
      & .die-icon.normal i {
        color: ${dNormCol} !important;
        text-shadow: 0 0 6px ${dNormCol}88;
        ${dieAnimMap[cfg.dieNormalAnim || 'none'] || ''}
      }
      & .die-icon.hard i {
        color: ${dHardCol} !important;
        text-shadow: 0 0 8px ${dHardCol}aa;
        ${dieAnimMap[cfg.dieHardAnim || 'none'] || ''}
      }
      & .die-icon.wiggle i {
        color: ${dWigCol} !important;
        text-shadow: 0 0 10px ${accentCol}, 0 0 20px ${borderCol};
        ${dieAnimMap[cfg.dieWiggleAnim || 'reactor-pulse'] || ''}
      }
      & .btn-buy {
        background: ${c2} !important;
        border: 1px solid ${borderCol} !important;
        color: ${nameCol} !important;
      }
      & .btn-buy:hover:not(:disabled) {
        background: ${accentCol} !important;
        color: #000 !important;
        box-shadow: 0 0 15px ${accentCol};
      }
      @keyframes mv-die-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
      @keyframes mv-die-spin { 100% { transform: rotate(360deg); } }
      @keyframes mv-die-reactor { from { transform: scale(1); filter: brightness(1); } to { transform: scale(1.14); filter: brightness(1.35); } }
      @keyframes mv-die-heart { 0%, 30%, 60%, 100% { transform: scale(1); } 15%, 45% { transform: scale(1.18); } }
      @keyframes mv-die-shake { 0%, 100% { transform: translate(0,0); } 25% { transform: translate(1px,-1px); } 75% { transform: translate(-1px,1px); } }
      ${animRules}
    `;
}

export const CustomThemeDB = {
    init() {
        captureSnapshotsOnce();

        if (!game.settings) return;

        if (!game.settings.settings.has(`${MODULE_ID}.customSheetThemes`)) {
            game.settings.register(MODULE_ID, "customSheetThemes", {
                name: "Temas de Ficha Customizados e Editados",
                scope: "world",
                config: false,
                type: Object,
                default: {},
                onChange: () => {
                    CustomThemeDB.syncAll();
                }
            });
        }

        if (!game.settings.settings.has(`${MODULE_ID}.customTalentThemes`)) {
            game.settings.register(MODULE_ID, "customTalentThemes", {
                name: "Temas de Talento Customizados e Editados",
                scope: "world",
                config: false,
                type: Object,
                default: {},
                onChange: () => {
                    CustomThemeDB.syncAll();
                }
            });
        }

        CustomThemeDB.syncAll();
    },

    syncAll() {
        captureSnapshotsOnce();

        // 1. Limpa e reconstrói SHEET_THEMES em memória preservando a mesma referência de objeto exportada
        let savedSheets = {};
        try {
            savedSheets = game.settings?.get(MODULE_ID, "customSheetThemes") || {};
        } catch (e) {
            savedSheets = {};
        }

        for (const k of Object.keys(SHEET_THEMES)) {
            delete SHEET_THEMES[k];
        }

        for (const [k, baseTheme] of Object.entries(BUILTIN_SHEET_SNAPSHOT)) {
            const override = savedSheets[k];
            if (override && override._deleted) continue;
            const merged = override ? { ...cloneDeep(baseTheme), ...cloneDeep(override), isBuiltin: true } : cloneDeep(baseTheme);
            merged.class = merged.class || `theme-${k}`;
            merged.vars = { ...(baseTheme.vars || {}), ...(merged.vars || {}) };
            const modCSS = merged.modularConfig?.enabled ? generateModularSheetCSS(k, merged.modularConfig, merged.vars) : "";
            const rawExtra = merged.rawExtraCSS !== undefined ? merged.rawExtraCSS : (merged.extraCSS || "");
            merged.rawExtraCSS = rawExtra;
            merged.extraCSS = `${rawExtra}\n${modCSS}`;
            SHEET_THEMES[k] = merged;
        }

        for (const [k, customTheme] of Object.entries(savedSheets)) {
            if (BUILTIN_SHEET_SNAPSHOT[k] || customTheme?._deleted) continue;
            const entry = cloneDeep(customTheme);
            entry.class = entry.class || `theme-${k}`;
            entry.isBuiltin = false;
            entry.vars = entry.vars || { "--c-primary": "#00ff41", "--c-bg": "#050505", "--c-text": "#ffffff" };
            const modCSS = entry.modularConfig?.enabled ? generateModularSheetCSS(k, entry.modularConfig, entry.vars) : "";
            const rawExtra = entry.rawExtraCSS !== undefined ? entry.rawExtraCSS : (entry.extraCSS || "");
            entry.rawExtraCSS = rawExtra;
            entry.extraCSS = `${rawExtra}\n${modCSS}`;
            SHEET_THEMES[k] = entry;
        }

        // 2. Limpa e reconstrói THEME_DB (Temas de Talento) em memória preservando a referência
        let savedTalents = {};
        try {
            savedTalents = game.settings?.get(MODULE_ID, "customTalentThemes") || {};
        } catch (e) {
            savedTalents = {};
        }

        for (const k of Object.keys(THEME_DB)) {
            delete THEME_DB[k];
        }

        for (const [k, baseTheme] of Object.entries(BUILTIN_TALENT_SNAPSHOT)) {
            const override = savedTalents[k];
            if (override && override._deleted) continue;
            const merged = override ? { ...cloneDeep(baseTheme), ...cloneDeep(override), isBuiltin: true } : cloneDeep(baseTheme);
            THEME_DB[k] = merged;
        }

        for (const [k, customTheme] of Object.entries(savedTalents)) {
            if (BUILTIN_TALENT_SNAPSHOT[k] || customTheme?._deleted) continue;
            const entry = cloneDeep(customTheme);
            entry.isBuiltin = false;
            THEME_DB[k] = entry;
        }

        // 3. Reinjeta CSS de Temas de Talento e Ficha
        if (typeof document !== 'undefined') {
            loadPowerThemes(true);
            const currentKey = ThemeEngine.getLastAppliedKey?.();
            if (currentKey && SHEET_THEMES[currentKey]) {
                ThemeEngine.apply(currentKey, SHEET_THEMES[currentKey], true);
            }
        }

        if (typeof Hooks !== 'undefined') {
            Hooks.callAll("nexusThemesUpdated");
        }
    },

    getSheetThemes() {
        CustomThemeDB.syncAll();
        return SHEET_THEMES;
    },

    getTalentThemes() {
        CustomThemeDB.syncAll();
        return THEME_DB;
    },

    isBuiltinSheetTheme(key) {
        captureSnapshotsOnce();
        return Boolean(BUILTIN_SHEET_SNAPSHOT[key]);
    },

    isBuiltinTalentTheme(key) {
        captureSnapshotsOnce();
        return Boolean(BUILTIN_TALENT_SNAPSHOT[key]);
    },

    getBuiltinSheetDefault(key) {
        captureSnapshotsOnce();
        return BUILTIN_SHEET_SNAPSHOT[key] ? cloneDeep(BUILTIN_SHEET_SNAPSHOT[key]) : null;
    },

    getBuiltinTalentDefault(key) {
        captureSnapshotsOnce();
        return BUILTIN_TALENT_SNAPSHOT[key] ? cloneDeep(BUILTIN_TALENT_SNAPSHOT[key]) : null;
    },

    async saveSheetTheme(key, themeData) {
        if (!game.user.isGM) return;
        const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
        if (!cleanKey) return;

        const currentSaved = cloneDeep(game.settings.get(MODULE_ID, "customSheetThemes") || {});
        const dataToSave = cloneDeep(themeData);
        dataToSave.class = `theme-${cleanKey}`;
        currentSaved[cleanKey] = dataToSave;

        await game.settings.set(MODULE_ID, "customSheetThemes", currentSaved);
        CustomThemeDB.syncAll();
        game.socket?.emit(`module.${MODULE_ID}`, { type: "THEMES_UPDATED" });
    },

    async resetOrDeleteSheetTheme(key) {
        if (!game.user.isGM) return;
        if (key === 'terminal') {
            const currentSaved = cloneDeep(game.settings.get(MODULE_ID, "customSheetThemes") || {});
            delete currentSaved[key];
            await game.settings.set(MODULE_ID, "customSheetThemes", currentSaved);
            CustomThemeDB.syncAll();
            return;
        }
        const currentSaved = cloneDeep(game.settings.get(MODULE_ID, "customSheetThemes") || {});
        delete currentSaved[key];
        await game.settings.set(MODULE_ID, "customSheetThemes", currentSaved);
        CustomThemeDB.syncAll();
        game.socket?.emit(`module.${MODULE_ID}`, { type: "THEMES_UPDATED" });
    },

    async saveTalentTheme(key, themeData) {
        if (!game.user.isGM) return;
        const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
        if (!cleanKey) return;

        const currentSaved = cloneDeep(game.settings.get(MODULE_ID, "customTalentThemes") || {});
        currentSaved[cleanKey] = cloneDeep(themeData);

        await game.settings.set(MODULE_ID, "customTalentThemes", currentSaved);
        CustomThemeDB.syncAll();
        game.socket?.emit(`module.${MODULE_ID}`, { type: "THEMES_UPDATED" });
    },

    async resetOrDeleteTalentTheme(key) {
        if (!game.user.isGM) return;
        const currentSaved = cloneDeep(game.settings.get(MODULE_ID, "customTalentThemes") || {});
        delete currentSaved[key];
        await game.settings.set(MODULE_ID, "customTalentThemes", currentSaved);
        CustomThemeDB.syncAll();
        game.socket?.emit(`module.${MODULE_ID}`, { type: "THEMES_UPDATED" });
    },

    /**
     * Verifica se um usuário tem acesso ao tema (Ficha ou Talento)
     */
    canUserUseTheme(theme, user = game.user) {
        if (!theme) return false;
        if (!user) return true;
        if (user.isGM) return true;

        const allowedUsers = Array.isArray(theme.allowedUsers) ? theme.allowedUsers : [];
        if (allowedUsers.includes(user.id)) return true;

        const minTier = theme.minPassTier || 'cobre';
        if (minTier === 'none' || minTier === 'exclusivo') {
            return false;
        }

        const playerTier = PassSystem.getPlayerTier(user.id);
        const playerTierId = playerTier?.id || 'cobre';
        const pIdx = TIER_ORDER.indexOf(playerTierId);
        const reqIdx = TIER_ORDER.indexOf(minTier);

        if (reqIdx === -1) return true;
        return pIdx >= reqIdx;
    },

    getAccessRequirementLabel(theme) {
        if (!theme) return "";
        const minTier = theme.minPassTier || 'cobre';
        if (minTier === 'none' || minTier === 'exclusivo') {
            return "EXCLUSIVO / LOJA";
        }
        const tierObj = Object.values(PASS_TIERS).find(t => t.id === minTier);
        if (!tierObj || minTier === 'cobre') return "LIVRE (COBRE+)";
        return `REQUER PASSE ${minTier.toUpperCase()}+`;
    }
};
