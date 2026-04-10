export const SHEET_THEMES = {
    terminal: {
        label: "TERMINAL_OS",
        class: "theme-terminal",
        soundPreset: "retro-beep",
        layout: "desktop", // Layout de ícones
        effects: ["scanlines", "vignette", "glitch"],
        vars: {
            "--c-primary": "#00ff41",
            "--font-main": "'Share Tech Mono', monospace",
            "--clip-path": "polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)"
        }
    },    
chamas: {
    label: "PROTOCOLO_INFERNO",
    class: "theme-chamas",
    desc: "SISTEMA EM SOBREAQUECIMENTO. CRIPTOGRAFIA POR FUSÃO.",
    vars: {
        "--c-primary": "#ff4d00",     // Laranja Incandescente
        "--c-secondary": "#ffcc00",   // Brasa Viva
        "--c-bg": "#0a0500",          // Preto Carbonizado
        "--c-text": "#ffd2b3",        // Cinza Pêssego
        "--font-head": "'Syncopate', sans-serif",
        "--font-body": "'Share Tech Mono', monospace",
        "--f-clip": "polygon(0 15px, 15px 0, 85% 0, 100% 15px, 100% 85%, 85% 100%, 15% 100%, 0 85%)",
        "--f-border": "2px solid #ff4d00",
        "--f-shadow": "0 0 30px rgba(255, 77, 0, 0.4), inset 0 0 50px rgba(0,0,0,0.9)"
    },
    extraCSS: `
        /* 1. MOTOR DE BRASAS (Cinzas em suspensão) */
        .theme-chamas .inner-terminal-screen::before {
            content: ""; position: absolute; inset: 0;
            background-image: 
                radial-gradient(circle, #ffcc00 1px, transparent 1px),
                radial-gradient(circle, #ff4d00 1.5px, transparent 1.5px);
            background-size: 80px 80px, 120px 120px;
            opacity: 0.2; z-index: 1; pointer-events: none;
            animation: embers-drift 12s linear infinite;
        }

        /* 2. LOGIN INFERNAL (Efeito de Derretimento e Fogo) */
        .theme-chamas .login-layer {
            background: #000 !important;
            overflow: hidden;
            perspective: 1000px;
        }

        /* Efeito de Ar Quente (Derretendo o fundo) */
        .theme-chamas .login-layer::before {
            content: ""; position: absolute; inset: -10%;
            background: radial-gradient(circle, #330a00 0%, #050505 100%);
            animation: heat-melt-bg 6s ease-in-out infinite alternate;
            opacity: 0.8; z-index: 0;
        }

        /* Bio-Scanner se Incendiando */
        .theme-chamas .bio-scanner {
            border: 4px solid #ff4d00 !important;
            box-shadow: 0 0 20px #ff4d00, 0 0 40px #990000, inset 0 0 30px #ff4d00 !important;
            animation: scanner-burn 0.6s infinite alternate !important;
            z-index: 2;
        }
        .theme-chamas .bio-img {
            filter: sepia(1) saturate(5) hue-rotate(-15deg) brightness(1.2);
            animation: img-flicker 0.1s infinite;
        }

        /* Letras e Blocos de Fogo (Brasa ao digitar) */
        .theme-chamas .digit-box {
            background: rgba(30, 10, 0, 0.8) !important;
            border: 2px solid #ff4d0033 !important;
            transition: 0.3s;
        }
        .theme-chamas .digit-box.filled {
            border-color: #ffcc00 !important;
            background: #ff4d00 !important;
            color: #fff !important;
            box-shadow: 0 0 25px #ff4d00, 0 -5px 15px #ffcc00 !important;
            text-shadow: 0 0 8px #fff, 0 -2px 10px #ffcc00 !important;
            transform: scale(1.15) translateY(-5px);
        }

        /* Mensagem de Login (Texto de Fogo) */
        .theme-chamas .login-msg {
            color: #ffcc00 !important;
            text-shadow: 0 0 10px #ff4d00, 0 0 20px #990000 !important;
            letter-spacing: 5px;
            animation: text-vibration 0.1s infinite;
        }

        /* 3. DESKTOP E INTERFACE (Estilo Hexagonal e Vidro) */
        .theme-chamas .wallpaper-layer {
            transform: translateZ(0); will-change: opacity;
            filter: contrast(1.2) brightness(0.5) sepia(0.2) !important;
        }
        .theme-chamas .icon-frame {
            border-color: #ff4d00 !important;
            background: rgba(40, 10, 0, 0.4) !important;
            clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%) !important;
        }
        .theme-chamas .icon-btn:hover .icon-frame {
            background: #ff4d00 !important;
            box-shadow: 0 0 30px #ff4d00, 0 0 10px #ffcc00 !important;
            color: #000 !important;
        }

        /* 4. EXTENSÃO COMBATE (Espírito do Hashira Rengoku) */
        .theme-chamas .orb-container {
            border-color: #ffcc00 !important;
            box-shadow: 0 0 20px #ff4d00, inset 0 0 20px #ff4d00 !important;
            background: radial-gradient(circle, #441100 0%, #000 100%) !important;
        }
        .theme-chamas .orb-liquid {
            background: linear-gradient(0deg, #990000 0%, #ff4d00 50%, #ffcc00 100%) !important;
            box-shadow: 0 0 30px #ff4d00 !important;
        }
        .theme-chamas .limb-row {
            border-left: 4px solid #990000 !important;
            background: linear-gradient(90deg, rgba(40,10,0,0.6) 0%, rgba(0,0,0,0.8) 100%) !important;
        }
        .theme-chamas .limb-row.selected {
            border-left: 6px solid #ffcc00 !important;
            box-shadow: -10px 0 20px rgba(255, 77, 0, 0.3) !important;
            transform: translateX(8px);
        }
        .theme-chamas .h-green { 
            color: #ffcc00 !important; 
            filter: drop-shadow(0 0 5px #ff4d00) !important;
            animation: rengoku-flicker 0.8s infinite alternate;
        }

        /* 5. MOTOR DE ANIMAÇÕES */
        @keyframes heat-melt-bg {
            0% { transform: scale(1) rotate(0deg); filter: blur(4px); }
            100% { transform: scale(1.1) rotate(1deg); filter: blur(12px); }
        }
        @keyframes scanner-burn {
            from { box-shadow: 0 0 20px #ff4d00; border-color: #ff4d00; }
            to { box-shadow: 0 0 60px #ffcc00, 0 0 100px #ff4d00; border-color: #fff; }
        }
        @keyframes text-vibration {
            0% { transform: translate(0,0); }
            50% { transform: translate(1px, -1px); text-shadow: 2px 0 #ff4d00, -2px 0 #ffcc00; }
            100% { transform: translate(0,0); }
        }
        @keyframes embers-drift {
            from { background-position: 0 0; }
            to { background-position: -100px -600px; }
        }
        @keyframes rengoku-flicker {
            from { transform: scale(1); filter: brightness(1); }
            to { transform: scale(1.25); filter: brightness(1.6) drop-shadow(0 0 8px #ffcc00); }
        }
        @keyframes img-flicker {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.85; }
        }
            /* --- EXTENSÃO PERFIL: FORJA DE OBSIDIANA --- */

        /* 1. RETRATO E IDENTIDADE */
        .theme-chamas .portrait-frame {
            border: 2px solid #ffcc00 !important;
            box-shadow: 0 0 15px #ff4d00, inset 0 0 10px #ff4d00 !important;
            overflow: visible !important;
        }
        .theme-chamas .portrait-frame::after {
            content: ""; position: absolute; inset: -5px;
            border: 1px solid #ff4d00; opacity: 0.5;
            animation: pulse-border 2s infinite alternate;
        }
        .theme-chamas .input-name {
            color: #fff !important;
            text-shadow: 0 0 10px #ff4d00, 0 0 5px #ffcc00 !important;
            border-bottom-color: #ff4d00 !important;
        }

        /* 2. PAINÉIS E MÓDULOS (Estilo Vidro Vulcânico) */
        .theme-chamas .cyber-panel, .theme-chamas .cyber-list {
            background: rgba(15, 5, 0, 0.9) !important;
            border-color: #331100 !important;
            box-shadow: inset 0 0 20px rgba(255, 77, 0, 0.1) !important;
        }
        .theme-chamas .panel-head, .theme-chamas .cyber-list header {
            background: linear-gradient(90deg, #441100 0%, #000 100%) !important;
            color: #ffcc00 !important;
            border-bottom-color: #ff4d00 !important;
        }

        /* 3. CAMPOS DE TEXTO (Brasa e Cinzas) */
        .theme-chamas textarea {
            background: rgba(10, 5, 0, 0.5) !important;
            color: #ffd2b3 !important;
            border: 1px solid #331100 !important;
            transition: 0.3s;
        }
        .theme-chamas textarea:focus {
            border-color: #ff4d00 !important;
            background: rgba(40, 10, 0, 0.3) !important;
            box-shadow: 0 0 15px rgba(255, 77, 0, 0.2) !important;
        }
        .theme-chamas .label-tab {
            background: #ff4d00 !important;
            color: #000 !important;
            font-weight: bold !important;
            border-right-color: #ffcc00 !important;
        }

        /* 4. ELEMENTOS DE LISTA (Nichirin Style) */
        .theme-chamas .list-item {
            border-left: 3px solid #990000 !important;
            background: rgba(255, 77, 0, 0.05) !important;
        }
        .theme-chamas .list-item:hover {
            border-left-color: #ffcc00 !important;
            background: rgba(255, 77, 0, 0.1) !important;
        }
        .theme-chamas .list-item input:focus {
            border-bottom-color: #ffcc00 !important;
            text-shadow: 0 0 5px #ffcc00 !important;
        }

        /* 5. MONITOR DE RECURSOS */
        .theme-chamas .resource-monitor {
            background: #000 !important;
            border-left: 4px solid #ff4d00 !important;
            box-shadow: -5px 0 15px rgba(255, 77, 0, 0.2) !important;
        }
        .theme-chamas .res-row.highlight .val.big {
            color: #fff !important;
            text-shadow: 0 0 10px #ffcc00, 0 0 20px #ff4d00 !important;
        }

        /* 6. BOTÃO DE SALVAMENTO PRINCIPAL (Chama em Fluxo) */
        .theme-chamas .btn-save-main {
            background: linear-gradient(90deg, #990000, #ff4d00, #ffcc00, #ff4d00, #990000) !important;
            background-size: 300% 100% !important;
            animation: fire-flow-save 4s linear infinite !important;
            color: #000 !important;
            border: none !important;
            font-size: 1.2em !important;
        }

        /* ANIMAÇÕES EXCLUSIVAS PERFIL */
        @keyframes fire-flow-save {
            0% { background-position: 0% 50%; }
            100% { background-position: 150% 50%; }
        }
        @keyframes pulse-border {
            from { transform: scale(1); opacity: 0.3; }
            to { transform: scale(1.05); opacity: 0.7; }
        }

        /* --- EXTENSÃO ATRIBUTOS: FORJA DO HASHIRA --- */

        /* 1. HUD DE XP (Fornalha de Progressão) */
        .theme-chamas .xp-header {
            border: 2px solid #ff4d00 !important;
            background: linear-gradient(135deg, #1a0500 0%, #000 100%) !important;
            box-shadow: 0 0 20px rgba(255, 77, 0, 0.3), inset 0 0 15px rgba(255, 77, 0, 0.1) !important;
        }
        .theme-chamas .xp-fill {
            background: linear-gradient(90deg, #990000, #ff4d00, #ffcc00) !important;
            box-shadow: 0 0 15px #ff4d00 !important;
        }
        .theme-chamas .val.highlight {
            color: #fff !important;
            text-shadow: 0 0 10px #ffcc00, 0 0 20px #ff4d00 !important;
        }

        /* 2. BLOCOS DE ATRIBUTO (Obsidiana e Brasa) */
        .theme-chamas .stat-block {
            background: rgba(15, 5, 0, 0.7) !important;
            border-color: #331100 !important;
            transition: 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .theme-chamas .stat-block.open {
            border-color: #ff4d00 !important;
            box-shadow: 0 0 25px rgba(255, 77, 0, 0.2) !important;
            background: rgba(10, 5, 0, 0.95) !important;
        }
        .theme-chamas .stat-head {
            background: linear-gradient(90deg, rgba(153, 0, 0, 0.2) 0%, transparent 100%) !important;
        }
        .theme-chamas .open .label {
            color: #fff !important;
            text-shadow: 0 0 10px #ff4d00 !important;
        }

        /* 3. DADOS (Molten Metal Look) */
        .theme-chamas .die-group {
            background: #0a0500 !important;
            border-color: #441100 !important;
            color: #ffd2b3 !important;
        }
        .theme-chamas .die-group.hard.active {
            border-color: #ffcc00 !important;
            color: #ffcc00 !important;
            box-shadow: 0 0 15px rgba(255, 204, 0, 0.4) !important;
            text-shadow: 0 0 5px #fff !important;
        }
        .theme-chamas .die-group.wiggle.active {
            border-color: #ff4d00 !important;
            color: #fff !important;
            background: #990000 !important;
            box-shadow: 0 0 15px rgba(255, 77, 0, 0.6) !important;
        }

        /* 4. PERÍCIAS (Lâminas de Nichirin) */
        .theme-chamas .skill-card {
            background: rgba(40, 10, 0, 0.3) !important;
            border-left: 3px solid #990000 !important;
            border-radius: 0 4px 4px 0 !important;
        }
        .theme-chamas .skill-card:hover {
            background: rgba(255, 77, 0, 0.1) !important;
            border-left-color: #ffcc00 !important;
            transform: translateX(5px);
        }
        .theme-chamas .skill-name {
            color: #fff !important;
            text-shadow: 0 0 5px rgba(255, 77, 0, 0.5) !important;
        }

        /* 5. BOTÕES DE UPGRADE (Explosão Solar) */
        .theme-chamas .btn-up {
            border-color: #ff4d00 !important;
            background: rgba(153, 0, 0, 0.2) !important;
        }
        .theme-chamas .btn-up:hover {
            background: #ffcc00 !important;
            box-shadow: 0 0 15px #ffcc00 !important;
        }
        .theme-chamas .btn-up::after {
            color: #ffcc00 !important;
        }
        .theme-chamas .btn-up:hover::after {
            color: #000 !important;
        }

        /* 6. BOTÃO DE COMPRA (Calor Intenso) */
        .theme-chamas .btn-buy {
            background: linear-gradient(180deg, rgba(255, 77, 0, 0.1), rgba(255, 204, 0, 0.2)) !important;
            border-top: 1px solid #ff4d00 !important;
            color: #ffcc00 !important;
        }
        .theme-chamas .btn-buy:hover {
            background: #ff4d00 !important;
            color: #000 !important;
            box-shadow: 0 -5px 15px rgba(255, 77, 0, 0.4) !important;
        }

        /* 7. ADICIONAR PERÍCIA (Fumaça e Cinzas) */
        .theme-chamas .btn-add-skill {
            border: 1px dashed #ff4d00 !important;
            color: #ff4d00 !important;
            background: rgba(0,0,0,0.3) !important;
        }
        .theme-chamas .btn-add-skill:hover {
            background: rgba(255, 77, 0, 0.15) !important;
            box-shadow: 0 0 10px rgba(255, 77, 0, 0.2) !important;
            text-shadow: 0 0 5px #ff4d00 !important;
        }

        /* --- EXTENSÃO INVENTÁRIO: ARSENAL DA FORJA --- */

        /* 1. HEADER E BARRA DE CAPACIDADE (Medidor de Pressão Térmica) */
        .theme-chamas .inv-header {
            background: linear-gradient(90deg, #1a0500 0%, #000 100%) !important;
            border-left: 4px solid #ff4d00 !important;
            border-color: #331100 !important;
            box-shadow: 0 5px 15px rgba(0,0,0,0.5) !important;
        }
        .theme-chamas .cap-bar-bg {
            background: #050505 !important;
            border-color: #441100 !important;
        }
        .theme-chamas .cap-bar-fill {
            background: linear-gradient(90deg, #990000, #ff4d00, #ffcc00) !important;
            box-shadow: 0 0 15px rgba(255, 77, 0, 0.6) !important;
        }
        .theme-chamas .val {
            color: #ffcc00 !important;
            text-shadow: 0 0 10px #ff4d00 !important;
        }

        /* 2. TOOLBAR (Botões de Comando) */
        .theme-chamas .btn-tool {
            background: rgba(40, 10, 0, 0.4) !important;
            border-color: #ff4d00 !important;
            color: #ffd2b3 !important;
        }
        .theme-chamas .btn-tool:hover {
            background: #ff4d00 !important;
            color: #000 !important;
            box-shadow: 0 0 15px #ff4d00 !important;
        }
        .theme-chamas .btn-tool.create {
            background: linear-gradient(135deg, #ff4d00, #ffcc00) !important;
            color: #000 !important;
            border: none !important;
        }

        /* 3. GRID E SLOTS VAZIOS (Brasas em Repouso) */
        .theme-chamas .empty-slot {
            background: rgba(15, 5, 0, 0.6) !important;
            border: 1px dashed #441100 !important;
            transition: 0.3s;
        }
        .theme-chamas .empty-slot:hover {
            border-color: #ff4d00 !important;
            background: rgba(255, 77, 0, 0.05) !important;
        }
        .theme-chamas .null-text {
            color: #331100 !important;
            text-shadow: none !important;
            font-weight: bold !important;
        }
        .theme-chamas .empty-slot:hover .null-text {
            color: #ff4d00 !important;
            text-shadow: 0 0 5px #ff4d00 !important;
        }

        /* 4. MODAL DE DETALHES E CRIAÇÃO (Cofre de Obsidiana) */
        .theme-chamas .modal-box {
            background: #050505 !important;
            border: 2px solid #ff4d00 !important;
            box-shadow: 0 0 50px #000, 0 0 20px rgba(255, 77, 0, 0.3) !important;
        }
        .theme-chamas .modal-header, .theme-chamas .big-header {
            background: linear-gradient(90deg, #441100 0%, #000 100%) !important;
            color: #ffcc00 !important;
            border-bottom: 1px solid #ff4d00 !important;
            text-shadow: 0 0 10px #ff4d00 !important;
        }

        /* 5. INPUTS E CAMPOS DENTRO DO MODAL */
        .theme-chamas .input-glow {
            background: #000 !important;
            border-color: #331100 !important;
            color: #ffd2b3 !important;
        }
        .theme-chamas .input-glow:focus {
            border-color: #ffcc00 !important;
            box-shadow: 0 0 10px rgba(255, 204, 0, 0.2) !important;
        }
        .theme-chamas .big-title {
            color: #fff !important;
            text-shadow: 0 0 15px #ff4d00 !important;
        }

        /* 6. TAGS DE RARIDADE (Temperas de Metal) */
        .theme-chamas .meta-tag { background: #111 !important; border-color: #333 !important; }
        .theme-chamas .meta-tag.r-comum { color: #888 !important; }
        .theme-chamas .meta-tag.r-raro { color: #00bfff !important; border-color: #00bfff !important; box-shadow: 0 0 5px #00bfff; }
        .theme-chamas .meta-tag.r-lendário { 
            color: #ffcc00 !important; 
            border-color: #ffcc00 !important; 
            box-shadow: 0 0 10px #ffcc00;
            animation: item-glow 1.5s infinite alternate;
        }

        /* 7. BOTÕES DE AÇÃO DO MODAL */
        .theme-chamas .btn-confirm {
            background: linear-gradient(90deg, #ff4d00, #ffcc00) !important;
            color: #000 !important;
            box-shadow: 0 0 15px rgba(255, 77, 0, 0.4) !important;
        }
        .theme-chamas .btn-confirm:hover {
            transform: scale(1.02);
            filter: brightness(1.2);
        }

        /* ANIMAÇÕES EXCLUSIVAS INVENTÁRIO */
        @keyframes item-glow {
            from { opacity: 0.8; filter: brightness(1); }
            to { opacity: 1; filter: brightness(1.5); }
        }

        /* --- EXTENSÃO PODERES: MANIFESTO DAS CHAMAS --- */

        /* 1. HUD DE PODERES (Medidor de Energia Térmica) */
        .theme-chamas .hud-module {
            background: rgba(15, 5, 0, 0.8) !important;
            border-color: #331100 !important;
            box-shadow: inset 0 0 15px rgba(255, 77, 0, 0.1) !important;
        }
        .theme-chamas .hud-module.main {
            border-left: 4px solid #ff4d00 !important;
        }
        .theme-chamas .hud-value.xp {
            color: #ffcc00 !important;
            text-shadow: 0 0 15px #ff4d00, 0 0 5px #fff !important;
        }
        .theme-chamas .hud-bar-bg {
            background: #000 !important;
            border: 1px solid #331100 !important;
        }
        .theme-chamas .hud-bar-fill {
            background: linear-gradient(90deg, #990000, #ff4d00, #ffcc00) !important;
            box-shadow: 0 0 15px #ff4d00 !important;
        }

        /* 2. TOOLBAR E BUSCA (Comando Incandescente) */
        .theme-chamas .search-box {
            background: rgba(10, 5, 0, 0.6) !important;
            border-color: #331100 !important;
        }
        .theme-chamas .search-box:focus-within {
            border-color: #ff4d00 !important;
            box-shadow: 0 0 15px rgba(255, 77, 0, 0.2) !important;
        }
        .theme-chamas .prompt {
            color: #ffcc00 !important;
            text-shadow: 0 0 5px #ff4d00 !important;
        }
        .theme-chamas .btn-db {
            background: linear-gradient(135deg, #441100 0%, #000 100%) !important;
            border-color: #ff4d00 !important;
            color: #ff4d00 !important;
        }
        .theme-chamas .btn-db:hover {
            background: #ff4d00 !important;
            color: #000 !important;
            box-shadow: 0 0 20px #ff4d00 !important;
        }

        /* 3. LISTA DE PODERES (Pergaminhos de Cinza) */
        .theme-chamas .list-container {
            border-top: 1px solid #331100 !important;
            border-bottom: 1px solid #331100 !important;
        }
        .theme-chamas .list-container::-webkit-scrollbar-thumb {
            background: linear-gradient(to bottom, #ff4d00, #ffcc00) !important;
        }

        /* 4. EMPTY STATE (Brasas Apagadas) */
        .theme-chamas .empty-state {
            background: rgba(15, 5, 0, 0.4) !important;
            border: 1px dashed #441100 !important;
        }
        .theme-chamas .glitch-wrapper {
            color: #ff4d00 !important;
            text-shadow: 2px 2px #000, 0 0 20px #990000 !important;
            animation: fire-glitch 3s infinite !important;
        }
        .theme-chamas .empty-title {
            color: #ffcc00 !important;
            text-shadow: 0 0 5px #ff4d00 !important;
        }

        /* 5. FOOTER (Metadados Térmicos) */
        .theme-chamas .term-footer {
            color: #662200 !important;
            text-shadow: 0 0 2px #000 !important;
        }

        /* ANIMAÇÕES EXCLUSIVAS DE PODERES */
        @keyframes fire-glitch {
            0% { transform: translate(0); filter: hue-rotate(0deg); }
            10% { transform: translate(-2px, 2px); filter: brightness(1.5); }
            20% { transform: translate(2px, -2px); text-shadow: 2px 0 #fff, -2px 0 #ff4d00; }
            30% { transform: translate(0); filter: hue-rotate(15deg); }
            100% { transform: translate(0); }
        }

        /* --- EXTENSÃO SOBREVIVÊNCIA: FORNALHA BIOMÉTRICA --- */

        /* 1. HEADER E CICLO (Sol de Kyojuro) */
        .theme-chamas .session-mini {
            background: rgba(40, 10, 0, 0.6) !important;
            border-color: #ff4d00 !important;
            box-shadow: inset 0 0 10px rgba(255, 77, 0, 0.2) !important;
        }
        .theme-chamas .cycle-icon {
            color: #ffcc00 !important;
            filter: drop-shadow(0 0 8px #ff4d00) !important;
            animation: sun-pulse 2s infinite alternate;
        }
        .theme-chamas .dot.filled {
            background: #ffcc00 !important;
            box-shadow: 0 0 10px #ff4d00, 0 0 5px #fff !important;
            border-color: #fff !important;
        }

        /* 2. BARRAS DE STATUS (Níveis de Incandescência) */
        .theme-chamas .bio-col {
            background: rgba(15, 5, 0, 0.8) !important;
            border-color: #331100 !important;
        }
        .theme-chamas .bar-track {
            background: #000 !important;
            border: 1px solid #220a00 !important;
        }
        /* Gradientes de Fogo para todas as barras */
        .theme-chamas .bar-fill.red, 
        .theme-chamas .bar-fill.blue, 
        .theme-chamas .bar-fill.purple, 
        .theme-chamas .bar-fill.yellow {
            background: linear-gradient(90deg, #990000, #ff4d00, #ffcc00) !important;
            box-shadow: 0 0 10px #ff4d00 !important;
        }
        .theme-chamas .stat-header .crit {
            color: #fff !important;
            text-shadow: 0 0 10px #ff0000, 0 0 20px #ff4d00 !important;
        }

        /* 3. BOTÕES DE CONSUMO E DESCANSO (Forja do Hashira) */
        .theme-chamas .btn-consume {
            background: #441100 !important;
            border-color: #ff4d00 !important;
            color: #ffcc00 !important;
        }
        .theme-chamas .btn-consume:hover {
            background: #ff4d00 !important;
            color: #000 !important;
            box-shadow: 0 0 15px #ff4d00 !important;
        }
        .theme-chamas .btn-rest:hover { border-color: #ffcc00 !important; color: #ffcc00 !important; }
        .theme-chamas .btn-sleep:hover { border-color: #ff4d00 !important; color: #ff4d00 !important; }

        /* 4. DISCIPLINAS E PERÍCIAS (Lâminas Nichirin) */
        .theme-chamas .disc-row {
            border-left: 3px solid #990000 !important;
            background: rgba(40, 10, 0, 0.3) !important;
            transition: 0.2s;
        }
        .theme-chamas .disc-row:hover {
            border-left-color: #ffcc00 !important;
            background: rgba(255, 77, 0, 0.1) !important;
        }
        .theme-chamas .gm-adjust.plus {
            color: #ffcc00 !important;
            border-color: #ffcc00 !important;
        }

        /* 5. GRADE DE INVENTÁRIO (Grelha de Forja) */
        .theme-chamas .inv-slot {
            background: #000 !important;
            border-color: #220a00 !important;
        }
        .theme-chamas .inv-slot.has-item {
            background: #331100 !important;
            border-color: #ff4d00 !important;
            color: #ffcc00 !important;
            box-shadow: inset 0 0 10px rgba(255, 77, 0, 0.2) !important;
        }
        .theme-chamas .inv-slot:hover {
            border-color: #ffcc00 !important;
            box-shadow: 0 0 10px rgba(255, 204, 0, 0.3) !important;
        }

        /* 6. MODAIS E HELP TOOLTIP (Pergaminhos de Fogo) */
        .theme-chamas .help-tip {
            background: #441100 !important;
            border-color: #ff4d00 !important;
            color: #ffcc00 !important;
        }
        .theme-chamas .tip-content {
            background: #0a0500 !important;
            border: 2px solid #ff4d00 !important;
            box-shadow: 0 0 25px #000 !important;
        }
        .theme-chamas .modal-window {
            border-color: #ffcc00 !important;
            background: #050505 !important;
        }
        .theme-chamas .modal-header {
            background: #441100 !important;
            border-bottom: 2px solid #ff4d00 !important;
            color: #ffcc00 !important;
        }

        /* ANIMAÇÕES EXCLUSIVAS SOBREVIVÊNCIA */
        @keyframes sun-pulse {
            from { transform: scale(1); filter: brightness(1) drop-shadow(0 0 5px #ff4d00); }
            to { transform: scale(1.2); filter: brightness(1.4) drop-shadow(0 0 15px #ffcc00); }
        }
    .theme-chamas button, 
    .theme-chamas .icon-btn,
    .theme-chamas [cursor="pointer"] {
        /* Versão da espada com brilho mais intenso para áreas clicáveis */
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%23ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4.5l-10 10a2 2 0 0 0 0 2.83L6 18.83a2 2 0 0 0 2.83 0l10-10-4.33-4.33z" fill="%2300e5ff"/><path d="M11.5 7.5L16 3l3 3-4.5 4.5"/><path d="M2 22l3-3"/></svg>') 0 0, pointer !important;
    }

/* --- ANIMAÇÃO: ÍCONES EM CHAMAS (Corrigido) --- */
    .theme-chamas .icon-btn {
        position: relative !important;
        overflow: visible !important; /* Garante que o fogo não seja cortado */
        background: transparent !important;
        z-index: 10; /* Eleva o botão para frente de tudo */
    }

    .theme-chamas .icon-btn::before {
        content: "";
        position: absolute;
        width: 180%; height: 180%;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%) scale(0.5);
        
        /* Link do GIF de fogo intenso */
        background-image: url('modules/JB2A_DnD5e/Library/3rd_Level/Fireball/FireballLoop_01_Orange_800x800.webm');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        
        /* O REMÉDIO: Mix-blend-mode precisa de um fundo escuro para brilhar */
        mix-blend-mode: screen !important;
        opacity: 0;
        pointer-events: none;
        z-index: -1; /* Fica logo atrás do ícone, mas ainda dentro do botão */
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    /* Gatilho de Hover */
    .theme-chamas .icon-btn:hover::before {
        opacity: 1 !important;
        transform: translate(-50%, -50%) scale(1.2);
        filter: brightness(1.5) contrast(1.2); /* Força o brilho das chamas */
    }

    /* Brilho no ícone central para não ser "comido" pelo fogo */
    .theme-chamas .icon-btn:hover i {
        color: #fff !important;
        text-shadow: 0 0 15px #ff4d00, 0 0 30px #fff !important;
        transition: 0.3s;
    }
        
    `
},

blue_magic: {
    label: "PROTOCOLO_BLUE_MAGIC",
    class: "theme-blue-magic",
    desc: "SINTONIA RÚNICA ESTABELECIDA. AGUARDANDO FLUXO DE MANA.",
    vars: {
        "--c-primary": "#00e5ff",     // Azul Cyan Elétrico
        "--c-secondary": "#0044ff",   // Azul Real Profundo
        "--c-bg": "#000814",          // Espaço Sideral/Abissal
        "--c-text": "#b3faff",        // Luz Estelar Suave
        "--font-head": "'Cinzel', serif", 
        "--font-body": "'Share Tech Mono', monospace",
        "--f-border": "1px solid rgba(0, 229, 255, 0.4)",
        "--f-shadow": "0 0 30px rgba(0, 68, 255, 0.5)"
    },
    extraCSS: `
        /* 1. FUNDO GERAL: PULSO MAGNÉTICO */
        .theme-blue-magic .inner-terminal-screen {
            background: radial-gradient(circle at center, #001a33 0%, #000814 100%) !important;
        }

        /* 2. LOGIN: RITUAL DE INVOCAÇÃO (O CORAÇÃO DO TEMA) */
        .theme-blue-magic .login-layer {
            background: #000814 !important;
            overflow: hidden;
        }

        /* Camada de Círculos Giratórios (GIF de Fundo Mágico) */
        .theme-blue-magic .login-container::before {
            content: ""; position: absolute;
            width: 500px; height: 500px;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            /* Link de um círculo mágico transparente de alta qualidade */
            background-image: url('https://i.imgur.com/mhR9peK.png'); 
            background-size: contain;
            background-repeat: no-repeat;
            opacity: 0.4;
            mix-blend-mode: screen;
            z-index: 0;
            animation: ritual-pulse 4s ease-in-out infinite;
        }

        /* Bio-Scanner: O Selo Central */
        .theme-blue-magic .bio-scanner {
            border: 2px solid var(--c-primary) !important;
            background: rgba(0, 20, 40, 0.8) !important;
            box-shadow: 0 0 40px rgba(0, 229, 255, 0.6), inset 0 0 20px var(--c-primary) !important;
            z-index: 2;
            transition: 0.5s;
        }

        /* Quando estiver verificando (Scanning), o selo brilha intensamente */
        .theme-blue-magic .bio-scanner.scanning {
            animation: seal-awaken 0.5s infinite alternate !important;
            transform: scale(1.1) !important;
        }

        /* Feixe de luz vira uma "Onda de Mana" horizontal */
        .theme-blue-magic .scanner-beam {
            background: linear-gradient(to right, transparent, var(--c-primary), transparent) !important;
            height: 2px !important;
            box-shadow: 0 0 20px var(--c-primary) !important;
        }

        /* 3. INPUT DE SENHA: RUNAS ACENDENDO */
        .theme-blue-magic .digit-box {
            background: rgba(0, 10, 30, 0.9) !important;
            border: 1px solid rgba(0, 229, 255, 0.2) !important;
            border-radius: 50% !important; /* Caixas circulares como runas */
            transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .theme-blue-magic .digit-box.filled {
            border-color: var(--c-primary) !important;
            background: var(--c-primary) !important;
            color: #000 !important;
            box-shadow: 0 0 20px var(--c-primary), 0 0 40px var(--c-secondary) !important;
            transform: translateY(-10px) rotate(360deg); /* Runa sobe e gira ao ser ativada */
        }

        /* Texto de Login Estilo Oráculo */
        .theme-blue-magic .login-msg {
            font-family: var(--font-head) !important;
            color: var(--c-primary) !important;
            text-shadow: 0 0 10px var(--c-primary) !important;
            letter-spacing: 4px;
            animation: oracle-flicker 2s infinite;
        }

        /* --- ANIMAÇÕES EXCLUSIVAS DO RITUAL --- */
        @keyframes ritual-pulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 0.3; }
            50% { transform: translate(-50%, -50%) scale(1.1) rotate(180deg); opacity: 0.6; }
        }

        @keyframes seal-awaken {
            from { box-shadow: 0 0 20px var(--c-primary); }
            to { box-shadow: 0 0 60px var(--c-primary), 0 0 100px var(--c-secondary); }
        }

        @keyframes oracle-flicker {
            0%, 100% { opacity: 0.7; }
            50% { opacity: 1; filter: brightness(1.5); }
        }

        /* Partículas de Mana Flutuando no Fundo */
        .theme-blue-magic .login-layer::after {
            content: ""; position: absolute; inset: 0;
            background-image: radial-gradient(circle, var(--c-primary) 1px, transparent 1px);
            background-size: 50px 50px;
            opacity: 0.1;
            animation: mana-drift 10s linear infinite;
        }

        @keyframes mana-drift {
            from { background-position: 0 0; }
            to { background-position: 500px 500px; }
        }

/* Cursor de "Mão Mística" para botões e itens clicáveis */
.theme-blue-magic button, 
.theme-blue-magic [cursor="pointer"],
.theme-blue-magic .icon-btn {
    cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%234df0ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v10"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/><circle cx="12" cy="2" r="1" fill="%23fff"><animate attributeName="opacity" values="0;1;0" dur="1s" repeatCount="indefinite" /></circle></svg>') 12 0, pointer !important;
}

        /* --- 2. BARREIRA MÁGICA (Borda da Tela) --- */
        .theme-blue-magic .cyber-frame::after {
            content: ""; position: absolute; inset: 0;
            border: 2px solid var(--c-primary);
            box-shadow: 
                inset 0 0 20px var(--c-secondary),
                0 0 30px var(--c-primary);
            pointer-events: none; z-index: 100;
            /* Efeito de Escudo Rúnico */
            background-image: url('https://www.transparenttextures.com/patterns/hexellence.png');
            opacity: 0.1;
            animation: barrier-ripple 4s ease-in-out infinite alternate;
        }

        /* --- 3. ÍCONES DO DESKTOP: RITUAL SEM FRAME --- */
        
        .theme-blue-magic .icon-btn {
            position: relative; overflow: visible !important;
        }

        /* Remove o Frame Quadrado/Hexagonal */
        .theme-blue-magic .icon-frame {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            transform: scale(1.3); /* Aumenta o ícone central */
            z-index: 2;
        }

        /* O Círculo Ritualístico "Muito Doido" (Surge no Hover) */
        .theme-blue-magic .icon-btn::before {
            content: ""; position: absolute;
            width: 140px; height: 140px;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%) scale(0.5) rotate(0deg);
            /* GIF de Círculo Ritual de Alta Complexidade */
            background-image: url('https://i.imgur.com/mhR9peK.png');
            background-size: contain;
            background-repeat: no-repeat;
            opacity: 0;
            transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            pointer-events: none;
            z-index: 1;
            mix-blend-mode: screen;
            filter: drop-shadow(0 0 10px var(--c-primary));
        }

        /* Hover: O Círculo Desperta e Gira */
        .theme-blue-magic .icon-btn:hover::before {
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(1) rotate(180deg);
        }

        /* Brilho no ícone ao passar o mouse */
        .theme-blue-magic .icon-btn:hover i {
            color: #fff !important;
            text-shadow: 0 0 20px var(--c-primary), 0 0 40px var(--c-secondary);
            transform: scale(1.2);
            transition: 0.3s;
        }

        /* --- 4. EFEITO GERAL DE MAGIA PULSANDO --- */
        .theme-blue-magic .inner-terminal-screen::after {
            content: ""; position: absolute; inset: 0;
            background: radial-gradient(circle, rgba(0, 229, 255, 0.05) 0%, transparent 70%);
            animation: global-mana-pulse 5s infinite ease-in-out;
            pointer-events: none; z-index: 5;
        }

        /* --- ANIMAÇÕES DO MOTOR BLUE MAGIC --- */
        
        @keyframes barrier-ripple {
            0% { opacity: 0.05; box-shadow: inset 0 0 10px var(--c-secondary); }
            100% { opacity: 0.2; box-shadow: inset 0 0 40px var(--c-primary); }
        }

        @keyframes global-mana-pulse {
            0%, 100% { opacity: 0.2; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.05); }
        }

        /* Ajuste do Texto (Label) para não sumir no brilho */
        .theme-blue-magic .icon-label {
            background: rgba(0, 0, 0, 0.8) !important;
            border: 1px solid var(--c-primary) !important;
            color: var(--c-primary) !important;
            margin-top: 15px !important;
            z-index: 3;
        }
    `
},

lobby: {
    label: "LOBBY_TECH",
    class: "theme-lobby",
    desc: "SISTEMA DE RECEPÇÃO ATIVO. ACESSO RESTRITO.",
    vars: {
        "--c-primary": "#00f3ff",     // Azul Neon Puro
        "--c-secondary": "#7000ff",   // Roxo High-Tech
        "--c-bg": "#050508",          // Escuridão Cibernética
        "--c-text": "#c4f9ff",        // Ciano Soft
        "--font-head": "'Rajdhani', sans-serif",
        "--font-body": "'Share Tech Mono', monospace",
        "--f-clip": "polygon(0 0, 100% 0, 100% 85%, 90% 100%, 0 100%)",
        "--f-border": "1px solid #00f3ff",
        "--f-shadow": "0 0 20px rgba(0, 243, 255, 0.3)"
    },
    extraCSS: `
/* --- 1. CURSOR PADRÃO: ROBÔ COM PONTO TÁTICO --- */
        .theme-lobby, .theme-lobby * {
            /* O '1 1' define o ponto exato do clique no centro da bolinha vermelha */
            cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="1.5" cy="1.5" r="1.5" fill="%23ff0000" stroke="%23050508" stroke-width="0.5"/><g transform="translate(4, 4)" stroke="%2300f3ff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="12" height="8" rx="2" fill="rgba(0,243,255,0.1)"/><path d="M6 10h.01" stroke="%23fff"/><path d="M10 10h.01" stroke="%23fff"/><path d="M8 6V2L3 0" opacity="0.6"/></g></svg>') 1 1, auto !important;
        }

        /* --- CURSOR POINTER (LINKS/BOTÕES): ROBÔ ATIVO --- */
        /* O ponto vermelho pulsa para indicar interação */
        .theme-lobby button, 
        .theme-lobby .icon-btn,
        .theme-lobby [cursor="pointer"] {
            cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="1.5" cy="1.5" r="1.5" fill="%23ff0000"><animate attributeName="r" values="1.5;2.5;1.5" dur="0.8s" repeatCount="indefinite"/></circle><g transform="translate(4, 4)" stroke="%2300f3ff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="12" height="8" rx="2" fill="rgba(0,243,255,0.3)"/><path d="M6 10h.01" stroke="%23fff" stroke-width="2"/><path d="M10 10h.01" stroke="%23fff" stroke-width="2"/><path d="M8 6V2L3 0" stroke-width="2"/></g></svg>') 1 1, pointer !important;
        }

        /* --- 2. LOGIN: LETREIRO NEON --- */
        .theme-lobby .login-layer {
            background-color: #050508 !important;
            background-image: 
                linear-gradient(rgba(0, 243, 255, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 243, 255, 0.03) 1px, transparent 1px) !important;
            background-size: 40px 40px !important;
        }

        .theme-lobby .login-layer::before {
            content: "BEM VINDO AO LOBBY";
            position: absolute;
            top: 12%; left: 50%;
            transform: translateX(-50%);
            font-family: var(--font-head);
            font-size: 2.2em;
            font-weight: 900;
            color: #00f3ff;
            text-shadow: 0 0 10px #00f3ff, 0 0 20px #00f3ff;
            letter-spacing: 6px;
            animation: lobby-flicker 4s infinite;
            z-index: 5;
        }

        /* --- 3. MOLDURA DE ÍCONES (HUD) --- */
        .theme-lobby .icon-frame {
            border: 1px solid rgba(0, 243, 255, 0.2) !important;
            background: rgba(0, 15, 30, 0.6) !important;
            clip-path: polygon(15% 0, 100% 0, 100% 85%, 85% 100%, 0 100%, 0 15%) !important;
            transition: 0.3s;
        }

        .theme-lobby .icon-btn:hover .icon-frame {
            border-color: #00f3ff !important;
            box-shadow: 0 0 25px rgba(0, 243, 255, 0.5) !important;
            transform: translateY(-3px) scale(1.02);
            background: rgba(0, 243, 255, 0.1) !important;
        }

        /* --- 4. COMBATE E EASTER EGG --- */
        .theme-lobby .resources-panel {
            background: #080a0f !important;
            border: 1px solid #00f3ff !important;
            position: relative;
            overflow: hidden;
        }

        /* Easter Egg: Rodando apenas uma vez por entrada do mouse */
        .theme-lobby .resources-panel::after {
            content: "Voce Sabe a Senha?";
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            font-family: var(--font-body);
            font-size: 10px;
            color: #00f3ff;
            opacity: 0;
            pointer-events: none;
            z-index: 10;
        }

        .theme-lobby .resources-panel:hover::after {
            animation: single-glitch-msg 1s steps(1) forwards;
        }

        /* Orbes em Barras de Energia */
        .theme-lobby .orb-container {
            border-radius: 2px !important;
            border: 1px solid #00f3ff !important;
            background: #000 !important;
            box-shadow: inset 0 0 10px rgba(0, 243, 255, 0.2) !important;
        }

        .theme-lobby .orb-liquid {
            background: linear-gradient(0deg, #0044ff 0%, #00f3ff 100%) !important;
            /* Efeito de Scanline na bateria */
            background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 3px) !important;
        }

        /* --- ANIMAÇÕES LOBBY --- */
        @keyframes lobby-flicker {
            0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; filter: brightness(1.2); }
            20%, 22%, 24%, 55% { opacity: 0.4; filter: brightness(0.5); }
        }

        @keyframes single-glitch-msg {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            10% { opacity: 1; transform: translate(-52%, -50%); color: #fff; }
            20% { opacity: 1; transform: translate(-48%, -52%); }
            30% { opacity: 1; transform: translate(-50%, -50%); }
            80% { opacity: 1; }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(1.2); }
        }

        /* Membros e Vida */
        .theme-lobby .limb-row {
            background: rgba(0, 243, 255, 0.05) !important;
            border-left: 4px solid #7000ff !important;
        }
        .theme-lobby .limb-row.selected {
            background: rgba(0, 243, 255, 0.15) !important;
            border-left-color: #00f3ff !important;
        }
        .theme-lobby .h-green { color: #00f3ff !important; filter: drop-shadow(0 0 5px #00f3ff); }

        /* --- 3. MOLDURAS: DIAMANTES ROTATIVOS --- */
        .theme-lobby .icon-btn {
            position: relative;
            overflow: visible !important;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .theme-lobby .icon-frame {
            width: 50px !important;
            height: 50px !important;
            background: rgba(0, 243, 255, 0.1) !important;
            border: 1px solid rgba(0, 243, 255, 0.4) !important;
            /* Transforma o quadrado em Diamante */
            clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%) !important;
            transition: 0.3s;
            /* Rotação constante mas lenta em repouso */
            animation: diamond-idle 10s linear infinite;
            z-index: 1;
        }

        /* --- 4. EFEITOS DE HOVER: ACELERAÇÃO E GLITCH --- */
        .theme-lobby .icon-btn:hover .icon-frame {
            border-color: var(--c-primary) !important;
            background: rgba(0, 243, 255, 0.2) !important;
            box-shadow: 0 0 20px var(--c-primary) !important;
            /* Acelera a rotação no hover */
            animation: diamond-active 2s linear infinite;
        }

        /* O ÍCONE CENTRAL: ESTÁVEL MAS COM GLITCH */
        .theme-lobby .icon-btn i {
            position: absolute;
            z-index: 2;
            transition: 0.2s;
            color: var(--c-primary);
        }

        .theme-lobby .icon-btn:hover i {
            color: #fff !important;
            /* Aciona o Glitch de interferência */
            animation: tech-glitch 0.3s infinite;
        }

        /* --- MOTOR DE ANIMAÇÕES LOBBY --- */

        /* Rotação lenta de espera */
        @keyframes diamond-idle {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        /* Rotação rápida de ativação */
        @keyframes diamond-active {
            from { transform: rotate(0deg) scale(1.1); }
            to { transform: rotate(360deg) scale(1.1); }
        }

        /* Efeito de Glitch Cyberpunk (Deslocamento de Cores) */
        @keyframes tech-glitch {
            0% { 
                transform: translate(0); 
                text-shadow: 2px 0 var(--c-secondary), -2px 0 var(--c-primary);
            }
            20% { 
                transform: translate(-3px, 1px); 
                text-shadow: -2px 0 var(--c-secondary), 2px 0 var(--c-primary);
                clip-path: inset(10% 0 30% 0); /* Corta fatias do ícone */
            }
            40% { 
                transform: translate(3px, -1px); 
                clip-path: inset(40% 0 10% 0);
            }
            60% { 
                transform: translate(-1px, 2px); 
                text-shadow: 1px 0 var(--c-secondary), -1px 0 #fff;
                clip-path: none;
            }
            80% { 
                transform: translate(2px, -2px);
            }
            100% { 
                transform: translate(0);
                text-shadow: 2px 0 var(--c-secondary), -2px 0 var(--c-primary);
            }
        }

        /* --- 1. WILLPOWER: BATERIA NEON --- */
        .theme-lobby .orb-container {
            width: 35px !important; 
            height: 55px !important;
            border-radius: 4px !important;
            border: 2px solid var(--c-primary) !important;
            background: #000 !important;
            clip-path: none !important;
            overflow: visible !important;
            position: relative;
        }

        /* O polo positivo da bateria */
        .theme-lobby .orb-container::before {
            content: ""; position: absolute; 
            top: -6px; left: 50%; transform: translateX(-50%);
            width: 14px; height: 6px; 
            background: var(--c-primary);
            border-radius: 1px;
            box-shadow: 0 0 10px var(--c-primary);
        }

        .theme-lobby .orb-liquid {
            background: linear-gradient(0deg, #0044ff 0%, #00f3ff 100%) !important;
            /* Segmentos de bateria */
            background-image: repeating-linear-gradient(
                0deg, 
                transparent, 
                transparent 5px, 
                rgba(0,0,0,0.4) 6px
            ) !important;
            opacity: 1 !important;
        }

        /* --- 2. BASE WILL: O PROCESSADOR ROBÔ --- */
        .theme-lobby .hg-container {
            width: 50px !important;
            height: 50px !important;
            background: transparent !important;
            clip-path: none !important;
            border: none !important;
            display: flex; align-items: center; justify-content: center;
        }

        /* Transformando o container em um ícone de Robô via Mask */
        .theme-lobby .hg-container::after {
            content: ""; position: absolute; inset: 0;
            background-color: #222; /* Cor de fundo (vazio) */
            -webkit-mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>') no-repeat center;
            mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>') no-repeat center;
        }

        .theme-lobby .hg-fill {
            background: var(--c-secondary) !important;
            z-index: 1;
            box-shadow: 0 0 15px var(--c-secondary) !important;
            /* Faz o preenchimento seguir a máscara do robô */
            -webkit-mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>') no-repeat center;
            mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>') no-repeat center;
        }

        /* --- 3. STATUS DE VIDA: MINI-ROBÔS (Substituindo Corações) --- */
        
        /* O "Macete": Esconde o ícone de coração e coloca o robô no lugar */
        .theme-lobby .hearts-container i::before {
            content: "\f544" !important; /* Código FontAwesome do fa-robot */
            font-family: "Font Awesome 5 Free" !important;
            font-weight: 900 !important;
        }

        .theme-lobby .h-green { 
            color: var(--c-primary) !important; 
            filter: drop-shadow(0 0 3px var(--c-primary)) !important; 
        }
        .theme-lobby .h-red { 
            color: #ff0000 !important; 
            animation: lobby-flicker 0.2s infinite !important; 
        }

        /* --- 4. LINHAS DE MEMBROS: DIAMANTE TECH --- */
        .theme-lobby .limb-row {
            border: 1px solid rgba(0, 243, 255, 0.1) !important;
            background: rgba(0, 243, 255, 0.02) !important;
            clip-path: polygon(0 15%, 5% 0, 100% 0, 100% 85%, 95% 100%, 0 100%) !important;
            transition: 0.2s;
        }

        .theme-lobby .limb-row.selected {
            border-color: var(--c-primary) !important;
            background: rgba(0, 243, 255, 0.1) !important;
            box-shadow: inset 0 0 15px rgba(0, 243, 255, 0.2) !important;
        }

        /* Easter Egg ajustado para o novo painel */
        .theme-lobby .resources-panel:hover::after {
            content: "Voce Sabe a Senha?";
            animation: single-glitch-msg 1s steps(1) forwards;
        }

        /* --- 1. CONFIGURAÇÕES LOBBY: TERMINAL DE ALTA SEGURANÇA --- */
        .theme-lobby .terminal-wrapper {
            background: rgba(5, 5, 8, 0.9) !important;
            border: 1px solid var(--c-primary) !important;
            box-shadow: 0 0 30px rgba(0, 243, 255, 0.1), inset 0 0 20px rgba(0, 0, 0, 1) !important;
            backdrop-filter: blur(10px) !important;
            overflow: hidden;
        }

        .theme-lobby .terminal-header {
            background: linear-gradient(90deg, var(--c-primary), var(--c-secondary)) !important;
            clip-path: polygon(0 0, 100% 0, 98% 100%, 2% 100%) !important;
            height: 35px;
        }

        .theme-lobby .profile-section {
            background: rgba(0, 20, 40, 0.4) !important;
            border-right: 1px solid rgba(0, 243, 255, 0.2) !important;
        }

        /* Avatar em Diamante Tech */
        .theme-lobby .avatar-uplink {
            border-radius: 0 !important;
            clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%) !important;
            border: 1px solid var(--c-primary) !important;
            background: #000;
        }

        /* Inputs Neon */
        .theme-lobby input[type="text"], 
        .theme-lobby input[type="number"] {
            background: rgba(0,0,0,0.8) !important;
            border: none !important;
            border-bottom: 2px solid var(--c-secondary) !important;
            color: var(--c-primary) !important;
            transition: 0.3s;
        }

        .theme-lobby input:focus {
            border-bottom-color: var(--c-primary) !important;
            box-shadow: 0 5px 15px rgba(0, 243, 255, 0.1) !important;
        }

        /* Theme Cards (Estilo Glitch) */
        .theme-lobby .theme-card {
            background: rgba(0, 10, 20, 0.6) !important;
            border: 1px solid rgba(0, 243, 255, 0.1) !important;
            clip-path: polygon(0 0, 90% 0, 100% 30%, 100% 100%, 10% 100%, 0 70%) !important;
        }

        .theme-lobby .theme-card.active {
            border-color: var(--c-primary) !important;
            background: rgba(0, 243, 255, 0.1) !important;
            animation: border-glitch 0.3s infinite;
        }

        /* --- 2. O SISTEMA DE PÂNICO (EASTER EGG DUPLO) --- */

        /* Trigger: O efeito começa quando o usuário interage/passa o mouse na janela por um tempo */
        .theme-lobby .terminal-wrapper:hover::before {
            content: "Isso é Medo?";
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            font-family: var(--font-head);
            font-size: 3em;
            color: var(--c-primary);
            opacity: 0;
            z-index: 1000;
            pointer-events: none;
            white-space: nowrap;
            /* Estágio 1: Lento, girando e subliminar */
            animation: subliminal-fear 8s ease-in-out forwards;
        }

        .theme-lobby .terminal-wrapper:hover::after {
            content: "Voce nao pode fugir de mim";
            position: fixed; /* Cobre a tela inteira do navegador */
            inset: 0;
            background: #000;
            color: #ff0000; /* Vermelho sangue para o Jump Scare */
            font-family: var(--font-head);
            font-size: 8vw;
            font-weight: 900;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999; /* Acima de TUDO no Foundry */
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            /* Estágio 2: O Jump Scare */
            animation: jump-scare-trigger 0.4s 8.5s linear forwards;
        }

        /* --- ANIMAÇÕES DE TERROR TECNOLÓGICO --- */

        /* Estágio 1: Texto girando e escrevendo lentamente */
        @keyframes subliminal-fear {
            0% { opacity: 0; transform: translate(-50%, -50%) rotate(0deg) scale(0.5); }
            20% { opacity: 0.03; }
            50% { opacity: 0.08; transform: translate(-50%, -50%) rotate(180deg) scale(1.2); }
            80% { opacity: 0.03; }
            100% { opacity: 0; transform: translate(-50%, -50%) rotate(360deg) scale(0.5); }
        }

        /* Estágio 2: Jump Scare e Blackout total */
        @keyframes jump-scare-trigger {
            0% { 
                visibility: visible; 
                opacity: 1; 
                background: #000;
                transform: scale(1);
            }
            20% { transform: scale(1.2) translate(5px, -5px); color: #fff; }
            40% { transform: scale(1.1) translate(-5px, 5px); text-shadow: 10px 0 #f00, -10px 0 #00f; }
            60% { transform: scale(1.3); background: #050000; }
            80% { transform: scale(1); opacity: 1; }
            100% { 
                visibility: hidden; 
                opacity: 0; 
            }
        }

/* --- 2. RESOURCE MONITOR: HACK DE NÍVEL E RUNAS (CORRIGIDO) --- */
        
        /* LINHA 1: FORÇANDO NÍVEL 50 (O Glitch) */
        .theme-lobby .res-row:nth-child(1) .val.big {
            visibility: hidden;
            position: relative;
        }
        .theme-lobby .res-row:nth-child(1) .val.big::after {
            content: "50";
            visibility: visible;
            position: absolute;
            right: 0;
            color: var(--c-primary);
            text-shadow: 0 0 15px var(--c-primary);
            animation: tech-glitch 2s infinite; /* Pequenos tremores no número */
        }

        /* LINHA 2: DISPONÍVEL -> RUNAS DISPONÍVEIS */
        .theme-lobby .res-row:nth-child(2) label {
            visibility: hidden;
            position: relative;
            white-space: nowrap;
        }
        .theme-lobby .res-row:nth-child(2) label::after {
            content: "RUNAS DISPONÍVEIS";
            visibility: visible;
            position: absolute;
            left: 0;
            color: var(--c-primary);
            font-weight: bold;
            letter-spacing: 1px;
        }

        /* LINHA 3: GASTOS -> RUNAS GASTAS */
        .theme-lobby .res-row:nth-child(3) label {
            visibility: hidden;
            position: relative;
            white-space: nowrap;
        }
        .theme-lobby .res-row:nth-child(3) label::after {
            content: "RUNAS GASTAS";
            visibility: visible;
            position: absolute;
            left: 0;
            color: var(--c-secondary);
            font-weight: bold;
            letter-spacing: 1px;
        }

        /* Ajuste para não sumir com os valores numéricos das runas */
        .theme-lobby .res-row:nth-child(2) .val,
        .theme-lobby .res-row:nth-child(3) .val {
            color: #fff !important;
            text-shadow: 0 0 5px var(--c-primary);
            z-index: 2;
        }

        /* --- 1. RENOMEAÇÃO DE ATRIBUTOS (HACK DE LABELS) --- */
        /* Corpo -> Força + Vigor */
        .theme-lobby [data-stat="Corpo"] .label, 
        .theme-lobby .stat-block:nth-child(1) .label { font-size: 0 !important; }
        .theme-lobby [data-stat="Corpo"] .label::after, 
        .theme-lobby .stat-block:nth-child(1) .label::after { content: "FORÇA + VIGOR"; font-size: 1.2rem; }

        /* Coordenação -> Destreza + Arcano */
        .theme-lobby [data-stat="Coordenaçao"] .label, 
        .theme-lobby .stat-block:nth-child(2) .label { font-size: 0 !important; }
        .theme-lobby [data-stat="Coordenaçao"] .label::after, 
        .theme-lobby .stat-block:nth-child(2) .label::after { content: "DESTREZA + ARCANO"; font-size: 1.2rem; }

        /* Sentidos -> Mente + Arcano */
        .theme-lobby [data-stat="Sentidos"] .label, 
        .theme-lobby .stat-block:nth-child(3) .label { font-size: 0 !important; }
        .theme-lobby [data-stat="Sentidos"] .label::after, 
        .theme-lobby .stat-block:nth-child(3) .label::after { content: "MENTE + ARCANO"; font-size: 1.2rem; }

        /* Mente -> Mente + Inteligência + Fé */
        .theme-lobby [data-stat="Mente"] .label, 
        .theme-lobby .stat-block:nth-child(4) .label { font-size: 0 !important; }
        .theme-lobby [data-stat="Mente"] .label::after, 
        .theme-lobby .stat-block:nth-child(4) .label::after { content: "MENTE + INTELIGÊNCIA + FÉ"; font-size: 0.9rem; }

        /* Charme -> Fé + Arcano */
        .theme-lobby [data-stat="Charme"] .label, 
        .theme-lobby .stat-block:nth-child(5) .label { font-size: 0 !important; }
        .theme-lobby [data-stat="Charme"] .label::after, 
        .theme-lobby .stat-block:nth-child(5) .label::after { content: "FÉ + ARCANO"; font-size: 1.2rem; }

        /* Comando -> Fé + Inteligência */
        .theme-lobby [data-stat="Comando"] .label, 
        .theme-lobby .stat-block:nth-child(6) .label { font-size: 0 !important; }
        .theme-lobby [data-stat="Comando"] .label::after, 
        .theme-lobby .stat-block:nth-child(6) .label::after { content: "FÉ + INTELIGÊNCIA"; font-size: 1.1rem; }

        /* --- 2. XP HUD: BARRA DE CARGA DE NÚCLEO --- */
        .theme-lobby .xp-header {
            background: linear-gradient(135deg, rgba(0, 243, 255, 0.1), rgba(0,0,0,0.8)) !important;
            border: 2px solid var(--c-primary) !important;
            clip-path: polygon(0 0, 100% 0, 100% 70%, 98% 100%, 0 100%) !important;
            position: relative;
            overflow: hidden;
        }

        .theme-lobby .xp-header::before {
            content: ""; position: absolute; inset: 0;
            background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 243, 255, 0.05) 3px);
            pointer-events: none;
        }

        .theme-lobby .val.highlight {
            color: #fff !important;
            text-shadow: 0 0 10px var(--c-primary), 0 0 20px var(--c-secondary) !important;
        }

        /* --- 3. STAT BLOCKS: MÓDULOS DE DADOS --- */
        .theme-lobby .stat-block {
            background: rgba(0, 10, 20, 0.8) !important;
            border: 1px solid rgba(0, 243, 255, 0.2) !important;
            border-left: 4px solid var(--c-secondary) !important;
            clip-path: polygon(0 0, 97% 0, 100% 15%, 100% 100%, 3% 100%, 0 85%) !important;
            margin-bottom: 10px;
        }

        .theme-lobby .stat-block.open {
            border-left-color: var(--c-primary) !important;
            box-shadow: 0 0 30px rgba(0, 243, 255, 0.1) !important;
        }

        .theme-lobby .icon-box {
            background: #000 !important;
            border-radius: 0 !important;
            clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%) !important;
            border: 1px solid var(--c-primary) !important;
            color: #fff !important;
        }

        /* --- 4. DADOS (DICE GROUPS): CHIPS NEON --- */
        .theme-lobby .die-group {
            background: #000 !important;
            border: 1px solid #333 !important;
            border-radius: 0 !important;
            clip-path: polygon(0 0, 100% 0, 100% 80%, 80% 100%, 0 100%) !important;
            transition: 0.2s;
        }

        .theme-lobby .die-group.active {
            border-color: var(--c-primary) !important;
            background: rgba(0, 243, 255, 0.1) !important;
            box-shadow: 0 0 15px var(--c-primary) !important;
        }

        /* Wiggle Dice (Vermelho/Roxo Glitch) */
        .theme-lobby .die-group.wiggle.active {
            border-color: #ff0055 !important;
            color: #ff0055 !important;
            box-shadow: 0 0 15px #ff0055 !important;
            animation: tech-glitch 0.3s infinite;
        }

        /* Hard Dice (Dourado Neon) */
        .theme-lobby .die-group.hard.active {
            border-color: #ffcc00 !important;
            color: #ffcc00 !important;
            box-shadow: 0 0 15px #ffcc00 !important;
        }

        /* --- 5. SKILL CARDS: ENTRADAS DE LOG --- */
        .theme-lobby .skill-card {
            background: rgba(0, 243, 255, 0.03) !important;
            border: none !important;
            border-right: 2px solid rgba(0, 243, 255, 0.1) !important;
            border-radius: 0 !important;
        }

        .theme-lobby .skill-card:hover {
            background: rgba(112, 0, 255, 0.1) !important;
            border-right-color: var(--c-primary) !important;
            transform: translateX(5px);
        }

        .theme-lobby .ctrl-box {
            background: #000 !important;
            border: 1px solid rgba(0, 243, 255, 0.2) !important;
            border-radius: 0 !important;
        }

        /* --- 6. INPUTS DO GM: ACESSO DE ADMINISTRADOR --- */
        .theme-lobby .gm-input {
            background: rgba(112, 0, 255, 0.1) !important;
            border: 1px solid var(--c-secondary) !important;
            color: var(--c-primary) !important;
            text-shadow: 0 0 5px var(--c-primary) !important;
            font-family: var(--font-body) !important;
        }

        .theme-lobby .gm-input:focus {
            background: rgba(0, 243, 255, 0.1) !important;
            border-color: var(--c-primary) !important;
        }

        /* --- 1. MENSAGEM DE INTRUSÃO (O "VOICE" DO LOBBY) --- */
        .theme-lobby .testamento-root::before {
            content: "se depender de mim, não";
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            font-family: var(--font-head);
            font-size: 1.5em;
            color: #fff;
            text-shadow: 2px 0 #ff003c, -2px 0 #00f3ff, 0 0 15px #ff003c;
            z-index: 1000;
            letter-spacing: 5px;
            text-transform: uppercase;
            font-weight: 900;
            animation: tech-glitch 0.2s infinite, voice-float 3s ease-in-out infinite;
            pointer-events: none;
        }

        /* --- 2. INTERFACE BUGADA (ESTRUTURA) --- */
        .theme-lobby .testamento-root {
            background: #000 !important;
            /* Filtro de ruído constante na tela toda */
            filter: contrast(1.2) brightness(0.9);
        }

        /* Faz a sidebar tremer e mudar de cor */
        .theme-lobby .test-sidebar {
            background: rgba(112, 0, 255, 0.05) !important;
            border-right: 1px solid var(--c-primary) !important;
            animation: structure-shake 10s infinite;
        }

        /* Cartão de barreira piscando entre segurança e erro */
        .theme-lobby .barrier-card {
            border-color: #ff003c !important;
            background: rgba(5, 0, 0, 0.9) !important;
            box-shadow: 0 0 40px #ff003c !important;
            animation: alert-flash 0.5s infinite;
        }

        /* --- 3. EDITOR DE TEXTO "IMPOSSÍVEL" --- */
        .theme-lobby .main-textarea {
            color: var(--c-primary) !important;
            text-shadow: 1px 1px 0 var(--c-secondary);
            background: repeating-linear-gradient(
                0deg,
                rgba(0, 0, 0, 0.2),
                rgba(0, 0, 0, 0.2) 1px,
                transparent 1px,
                transparent 2px
            ) !important;
        }

        /* Quando você tenta escrever, o texto sofre glitch */
        .theme-lobby .main-textarea:focus {
            animation: tech-glitch 0.5s infinite;
            color: #fff !important;
        }

        /* --- 4. ABAS E BOTÕES CORROMPIDOS --- */
        .theme-lobby .note-tab {
            clip-path: polygon(0 0, 90% 0, 100% 100%, 0% 100%) !important;
            border: 1px solid rgba(255, 0, 60, 0.2) !important;
        }

        .theme-lobby .note-tab.active {
            background: var(--c-secondary) !important;
            color: #fff !important;
            transform: skewX(-5deg);
        }

        /* O botão de "Lacre" agora parece um erro crítico */
        .theme-lobby .btn-lacre.exposed {
            background: #ff003c !important;
            color: #fff !important;
            box-shadow: 0 0 20px #ff003c !important;
            animation: border-glitch 0.1s infinite;
        }

        /* --- MOTOR DE ANIMAÇÕES "BUGADAS" --- */

        @keyframes voice-float {
            0%, 100% { top: 10px; transform: translateX(-50%) rotate(-1deg); }
            50% { top: 20px; transform: translateX(-50%) rotate(1deg); }
        }

        @keyframes alert-flash {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; border-color: #fff; }
        }

        @keyframes structure-shake {
            0%, 90%, 100% { transform: translate(0); }
            92% { transform: translate(2px, -1px) skewX(1deg); }
            94% { transform: translate(-2px, 2px) skewX(-1deg); }
            96% { transform: translate(5px, 0); filter: hue-rotate(90deg); }
            98% { transform: translate(-5px, 0); }
        }

        /* --- 1. RAIZ DO APP: INTERFERÊNCIA VISUAL --- */
        .theme-lobby .comms-app-root {
            background: #050508 !important;
            border: 1px solid var(--c-primary) !important;
            /* Efeito de Scanlines de Monitor CRT */
            background-image: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), 
                              linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06)) !important;
            background-size: 100% 4px, 3px 100% !important;
            box-shadow: inset 0 0 50px rgba(0,0,0,0.8);
        }

        /* --- 2. O BOTÃO "CHAMAR GUIA" (CLARO E VISÍVEL) --- */
        /* Posicionado no cabeçalho do chat (.chat-info) */
        .theme-lobby .chat-info {
            position: relative;
            border-bottom: 2px solid var(--c-primary) !important;
            background: rgba(0, 20, 40, 0.6) !important;
        }

        .theme-lobby .chat-info::after {
            content: "\f544  CHAMAR GUIA"; /* Ícone Robô (FontAwesome) + Texto */
            font-family: "Font Awesome 5 Free", var(--font-head) !important;
            font-weight: 900;
            font-size: 11px;
            
            /* Estilo visual claro e destacado */
            color: #000; 
            background: var(--c-primary);
            border: 1px solid var(--c-secondary);
            
            /* Posicionamento no topo direito */
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            
            padding: 8px 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
            
            /* Design Cyberpunk */
            clip-path: polygon(10% 0, 100% 0, 90% 100%, 0 100%);
            box-shadow: 0 0 15px rgba(0, 243, 255, 0.4);
            cursor: help; /* Indica que é um botão de ajuda/info */
            transition: 0.3s all ease-in-out;
            z-index: 5;
        }

        /* Efeito de Hover no botão (brilho intenso) */
        .theme-lobby .chat-info:hover::after {
            background: #fff;
            color: var(--c-primary);
            box-shadow: 0 0 30px var(--c-primary);
            text-shadow: 0 0 5px var(--c-primary);
            border-color: #fff;
        }

        /* --- 3. MENSAGENS: ESTÉTICA GLITCH --- */
        .theme-lobby .bubble {
            background: rgba(0, 20, 30, 0.8) !important;
            border: 1px solid rgba(0, 243, 255, 0.2) !important;
            border-left: 3px solid var(--c-primary) !important;
            clip-path: polygon(0 0, 100% 0, 100% 85%, 98% 100%, 0 100%) !important;
        }

        .theme-lobby .msg-block.me .bubble {
            border-left: 1px solid rgba(112, 0, 255, 0.2) !important;
            border-right: 3px solid var(--c-secondary) !important;
            background: rgba(112, 0, 255, 0.1) !important;
        }

        /* Efeito de Glitch no texto ao passar o mouse */
        .theme-lobby .b-text:hover {
            animation: tech-glitch 0.3s infinite;
            color: #fff !important;
            text-shadow: 2px 0 var(--c-secondary), -2px 0 var(--c-primary);
        }

        /* --- 4. COMPOSER: TERMINAL DE INPUT --- */
        .theme-lobby .chat-composer {
            border-top: 2px solid var(--c-primary) !important;
            background: rgba(0, 0, 0, 0.95) !important;
        }

        .theme-lobby .chat-input {
            border: 1px solid var(--c-primary) !important;
            background: #000 !important;
            color: var(--c-primary) !important;
            font-family: var(--font-body) !important;
        }
        .theme-lobby .chat-input:focus {
            box-shadow: 0 0 20px rgba(0, 243, 255, 0.2) inset !important;
        }

        /* --- ANIMAÇÕES DE AMBIENTE --- */
        /* Tremedeira sutil na navegação lateral para manter a tensão */
        .theme-lobby .app-nav {
            border-right: 1px solid var(--c-secondary) !important;
            animation: jitter 5s infinite;
        }

        @keyframes jitter {
            0%, 98%, 100% { transform: translate(0); border-color: var(--c-secondary); }
            99% { transform: translate(1px, -1px); border-color: var(--c-primary); filter: hue-rotate(20deg); }
        }

        /* --- GARANTIA DE VISIBILIDADE DO CONTAINER --- */
    .theme-lobby .os-container {
        position: relative;
        overflow: visible !important; /* Impede que o botão seja cortado */
    }

    /* 1. O ÍCONE DO ROBOZINHO (Centralizado) */
    .theme-lobby .os-container::before {
        content: "\f544"; /* Ícone do Robô */
        /* Tenta carregar a versão 5 ou 6 do FontAwesome */
        font-family: "Font Awesome 5 Free", "Font Awesome 6 Free" !important;
        font-weight: 900;
        
        position: absolute;
        bottom: 70px; /* Altura do chão */
        right: 45px;  /* Distância da direita */
        
        width: 60px;
        height: 60px;
        
        /* Cores e Estilo */
        color: var(--c-primary);
        background: rgba(0, 0, 0, 0.9);
        border: 2px solid var(--c-primary);
        
        /* Formato de Diamante */
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
        
        box-shadow: 0 0 20px var(--c-primary);
        z-index: 9999; /* Fica acima de TUDO */
        pointer-events: auto;
    }

    /* 2. O TEXTO (LOGO ABAIXO DO DIAMANTE) */
    .theme-lobby .os-container::after {
        content: "CHAMAR GUIA";
        position: absolute;
        bottom: 45px; /* Fica logo abaixo do ícone */
        right: 25px;
        width: 100px;
        
        font-family: var(--font-head), sans-serif !important;
        font-weight: 900;
        font-size: 10px;
        color: var(--c-primary);
        text-align: center;
        letter-spacing: 1px;
        
        /* Fundo sutil para legibilidade */
        background: rgba(0, 0, 0, 0.7);
        padding: 2px 5px;
        border: 1px solid var(--c-primary);
        clip-path: polygon(5% 0, 100% 0, 95% 100%, 0 100%);
        
        z-index: 10000;
        pointer-events: none;
        text-shadow: 0 0 5px #000;
    }

    /* --- EFEITO DE INTERAÇÃO --- */
    .theme-lobby .os-container:hover::before {
        filter: brightness(1.3);
        transform: scale(1.1);
        box-shadow: 0 0 30px var(--c-primary);
        transition: 0.2s;
    }
        
    `
},

antimatter: {
    label: "ANTI-MATÉRIA",
    class: "theme-antimatter",
    desc: "O VAZIO CONSOME A REALIDADE. CUIDADO COM O HORIZONTE DE EVENTOS.",
    vars: {
        "--c-primary": "#bf00ff",     // Roxo Atômico
        "--c-secondary": "#4b0082",   // Índigo Profundo
        "--c-bg": "#000000",          // Vácuo Absoluto
        "--c-text": "#e0ccff",        // Lavanda Pálido
        "--font-head": "'Orbitron', sans-serif",
        "--font-body": "'Share Tech Mono', monospace",
        "--f-clip": "circle(50% at 50% 50%)",
        "--f-border": "1px solid rgba(191, 0, 255, 0.3)",
        "--f-shadow": "0 0 20px rgba(75, 0, 130, 0.5)"
    },
    extraCSS: `
        /* --- 1. LOGIN: O BURACO NEGRO (HORIZONTE DE EVENTOS) --- */
        .theme-antimatter .login-layer {
            background: #000 !important;
            overflow: hidden;
        }

        /* O Núcleo do Buraco Negro */
        .theme-antimatter .login-layer::before {
            content: "";
            position: absolute;
            top: 50%; left: 50%;
            width: 200px; height: 200px;
            background: #000;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            box-shadow: 
                0 0 60px 20px #bf00ff, 
                0 0 100px 40px #4b0082,
                inset 0 0 50px #4b0082;
            z-index: 1;
            animation: black-hole-pulse 4s ease-in-out infinite;
        }

        /* Disco de Acreção (Anel Giratório) */
        .theme-antimatter .login-layer::after {
            content: "";
            position: absolute;
            top: 50%; left: 50%;
            width: 400px; height: 100px;
            border-radius: 50%;
            border: 2px solid var(--c-primary);
            transform: translate(-50%, -50%) rotateX(75deg);
            box-shadow: 0 0 30px var(--c-primary);
            filter: blur(2px);
            z-index: 0;
            animation: accretion-disk-spin 1s linear infinite;
        }

        /* --- 2. EFEITOS DE NEGATIVO (SUBVERSÃO) --- */
        
        /* Avatares em Negativo */
        .theme-antimatter .bio-img, 
        .theme-antimatter .portrait-frame img {
            filter: invert(1) hue-rotate(180deg) brightness(1.2) contrast(1.5) !important;
            mix-blend-mode: screen;
        }

        /* Molduras que "sugam" a luz */
        .theme-antimatter .icon-frame,
        .theme-antimatter .cyber-panel {
            background: rgba(20, 0, 40, 0.9) !important;
            border: 1px solid var(--c-primary) !important;
            box-shadow: inset 0 0 15px rgba(191, 0, 255, 0.2) !important;
        }

        /* --- 3. RECURSOS: ENERGIA NEGATIVA --- */
        .theme-antimatter .orb-liquid {
            background: linear-gradient(180deg, #000 0%, var(--c-primary) 100%) !important;
            filter: hue-rotate(-20deg);
        }

        .theme-antimatter .h-green { color: #fff !important; text-shadow: 0 0 10px var(--c-primary); }
        .theme-antimatter .h-red { color: var(--c-primary) !important; animation: void-flicker 0.1s infinite; }

        /* --- ANIMAÇÕES DE ANTI-MATÉRIA --- */
        
        @keyframes black-hole-pulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.8; }
        }

        @keyframes accretion-disk-spin {
            from { transform: translate(-50%, -50%) rotateX(75deg) rotateZ(0deg); }
            to { transform: translate(-50%, -50%) rotateX(75deg) rotateZ(360deg); }
        }

        @keyframes void-flicker {
            0% { opacity: 1; filter: invert(0); }
            50% { opacity: 0.5; filter: invert(1); }
            100% { opacity: 1; filter: invert(0); }
        }

        /* Cursor de Singularidade */
        .theme-antimatter, .theme-antimatter * {
            cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%23bf00ff" stroke-width="2"><circle cx="12" cy="12" r="3" fill="black"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></svg>') 12 12, auto !important;
        }

        /* --- 1. CURSOR: BURACO NEGRO COM PONTO DE PRECISÃO --- */
        .theme-antimatter, .theme-antimatter * {
            /* O '16 16' centraliza o clique exatamente no ponto vermelho do buraco negro */
            cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="6" fill="black" stroke="%23bf00ff" stroke-width="1"/><circle cx="16" cy="16" r="12" stroke="%23bf00ff" stroke-width="0.5" opacity="0.3"><animate attributeName="r" values="10;14;10" dur="2s" repeatCount="indefinite" /></circle><circle cx="16" cy="16" r="1.5" fill="%23ff0000" stroke="white" stroke-width="0.5"/></svg>') 16 16, auto !important;
        }

        /* Cursor ao passar em botões: O buraco negro expande */
        .theme-antimatter button, .theme-antimatter .icon-btn, .theme-antimatter [cursor="pointer"] {
            cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="8" fill="black" stroke="%23ff00ff" stroke-width="2"/><circle cx="16" cy="16" r="1.5" fill="%23ff0000"/></svg>') 16 16, pointer !important;
        }

        /* --- 2. MOLDURAS: HORIZONTE DE EVENTOS --- */
        .theme-antimatter .icon-frame {
            border: 1px solid rgba(191, 0, 255, 0.4) !important;
            background: radial-gradient(circle, rgba(75, 0, 130, 0.4) 0%, rgba(0, 0, 0, 1) 70%) !important;
            /* Formato Circular Irregular (Singularidade) */
            clip-path: circle(50% at 50% 50%) !important;
            transition: all 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55);
            position: relative;
        }

        /* --- 3. ANIMAÇÃO DE HOVER: COLAPSO GRAVITACIONAL --- */
        .theme-antimatter .icon-btn:hover .icon-frame {
            border-color: #fff !important;
            box-shadow: 0 0 30px #bf00ff, inset 0 0 20px #bf00ff !important;
            transform: scale(0.9) rotate(180deg); /* O ícone "encolhe" para dentro do buraco negro */
            filter: hue-rotate(90deg);
            background: #000 !important;
        }

        /* O ícone dentro sofre uma distorção de espelho */
        .theme-antimatter .icon-btn:hover i {
            animation: void-distortion 0.4s infinite alternate;
            color: #fff !important;
        }

        /* --- MOTOR DE ANIMAÇÃO ANTI-MATÉRIA --- */
        
        @keyframes void-distortion {
            0% { 
                transform: scale(1) skewX(0deg); 
                filter: blur(0px) brightness(1);
            }
            100% { 
                transform: scale(1.3) skewX(20deg); 
                filter: blur(2px) brightness(1.5);
                text-shadow: 0 0 10px #bf00ff, 5px 0 #ff00ff, -5px 0 #00ffff;
            }
        }

        /* Cantoneiras Estilo "Lente Gravitacional" */
        .theme-antimatter .icon-btn::before {
            content: "";
            position: absolute;
            inset: -5px;
            border: 1px solid var(--c-primary);
            border-radius: 50%;
            opacity: 0;
            transition: 0.3s;
            pointer-events: none;
        }

        .theme-antimatter .icon-btn:hover::before {
            opacity: 1;
            inset: -10px;
            border-width: 2px;
            animation: pulse-ring 1.5s linear infinite;
        }

        @keyframes pulse-ring {
            0% { transform: scale(0.8); opacity: 1; }
            100% { transform: scale(1.5); opacity: 0; }
        }

        /* --- PERFIL ANTI-MATÉRIA --- */
    
    /* Retrato: O Círculo de Singularidade */
    .theme-antimatter .portrait-frame {
        border-radius: 50% !important;
        clip-path: circle(50% at 50% 50%) !important;
        border: 2px solid var(--c-primary) !important;
        box-shadow: 0 0 20px var(--c-primary), inset 0 0 15px var(--c-secondary) !important;
        overflow: hidden;
    }

    /* Efeito de Negativo Total no Avatar */
    .theme-antimatter .portrait-frame img {
        filter: invert(1) contrast(1.2) brightness(1.1) hue-rotate(180deg) !important;
        transition: 0.5s;
    }

    .theme-antimatter .portrait-frame:hover img {
        filter: invert(1) contrast(1.5) brightness(1.5) hue-rotate(220deg) !important;
        transform: scale(1.1);
    }

    /* Status: Carga Negativa (Substituindo Runas/XP) */
    .theme-antimatter .res-row label::after {
        color: var(--c-primary) !important;
        text-shadow: 0 0 10px var(--c-primary);
        content: "NÍVEL DE COLAPSO" !important;
    }

    .theme-antimatter .res-row:nth-child(2) label::after { content: "MATÉRIA DISPONÍVEL" !important; }
    .theme-antimatter .res-row:nth-child(3) label::after { content: "ENERGIA DISPENSADA" !important; }

    /* Painéis que parecem flutuar no vácuo */
    .theme-antimatter .cyber-panel {
        background: rgba(0, 0, 0, 0.9) !important;
        border: 1px solid var(--c-secondary) !important;
        border-radius: 50px 5px 50px 5px !important; /* Curvaturas orgânicas */
        box-shadow: inset 0 0 20px rgba(75, 0, 130, 0.3) !important;
    }

    .theme-antimatter .panel-head {
        background: linear-gradient(90deg, var(--c-secondary), transparent) !important;
        border-bottom: 1px solid var(--c-primary) !important;
    }

    /* --- INVENTÁRIO ANTI-MATÉRIA --- */

    .theme-antimatter .inventory-terminal {
        background: radial-gradient(circle at center, #1a002b 0%, #000 70%) !important;
    }

    /* Barra de Carga: Radiação Hawking */
    .theme-antimatter .cap-bar-fill {
        background: linear-gradient(90deg, var(--c-secondary), #fff) !important;
        box-shadow: 0 0 20px #fff !important;
        filter: blur(1px);
    }

    /* Slots de Itens: Lentes Gravitacionais */
    .theme-antimatter .inv-grid .empty-slot {
        border-radius: 50% !important;
        border: 1px double var(--c-primary) !important;
        background: rgba(0, 0, 0, 0.5) !important;
        box-shadow: inset 0 0 10px var(--c-primary) !important;
        transition: 0.3s;
    }

    .theme-antimatter .inv-grid .empty-slot:hover {
        transform: scale(0.95);
        background: var(--c-secondary) !important;
        box-shadow: 0 0 20px var(--c-primary) !important;
    }

    /* O Botão de Item Multiversal: IMPLOSÃO (Thanos Invertido) */
    .theme-antimatter .btn-multiversal {
        background: #000 !important;
        color: var(--c-primary) !important;
        border: 1px solid var(--c-primary) !important;
        box-shadow: 0 0 10px var(--c-primary) !important;
        clip-path: circle(50%) !important;
    }

    .theme-antimatter .btn-multiversal.snap-active {
        animation: antimatter-implosion 1.5s forwards cubic-bezier(0.6, -0.28, 0.735, 0.045) !important;
    }

    @keyframes antimatter-implosion {
        0% { transform: scale(1); filter: brightness(1); opacity: 1; }
        30% { transform: scale(1.2); filter: brightness(2) contrast(2); box-shadow: 0 0 50px #fff; }
        100% { transform: scale(0); filter: blur(10px); opacity: 0; }
    }

    /* --- 1. ATRIBUTOS: NÚCLEOS DE SINGULARIDADE --- */
    
    /* Moldura do Ícone do Atributo */
    .theme-antimatter .stat-block .icon-box {
        background: #000 !important;
        border: 2px solid var(--c-primary) !important;
        border-radius: 50% !important;
        clip-path: none !important; /* Remove o diamante do Lobby */
        box-shadow: 0 0 15px var(--c-primary), inset 0 0 10px var(--c-secondary) !important;
        position: relative;
        overflow: visible !important;
        animation: void-breathing 4s ease-in-out infinite;
    }

    /* O Ícone dentro do Atributo (Animação de Flutuação no Vácuo) */
    .theme-antimatter .stat-block .icon-box i {
        animation: icon-float-void 3s ease-in-out infinite;
        filter: drop-shadow(0 0 5px var(--c-primary));
    }

    /* --- 2. SISTEMA DE UPGRADE: MASSA CRÍTICA --- */
    
    /* Botão de comprar dados (Die Groups) */
    .theme-antimatter .die-group {
        border-radius: 50% !important;
        border: 1px solid var(--c-secondary) !important;
        background: rgba(0, 0, 0, 0.8) !important;
        transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .theme-antimatter .die-group.active {
        background: var(--c-secondary) !important;
        border-color: var(--c-primary) !important;
        box-shadow: 0 0 20px var(--c-primary) !important;
        animation: active-die-glow 2s infinite alternate;
    }

    /* Botão de UP (O pequeno +) */
    .theme-antimatter .btn-up {
        background: #000 !important;
        border: 1px solid var(--c-primary) !important;
        box-shadow: 0 0 5px var(--c-primary) !important;
        transition: 0.3s;
    }

    .theme-antimatter .btn-up:hover {
        background: var(--c-primary) !important;
        transform: scale(1.3) rotate(90deg);
        box-shadow: 0 0 20px var(--c-primary) !important;
    }

    /* --- 3. ABA DE PODERES: MANIFESTAÇÕES DO VAZIO --- */
    
    .theme-antimatter .power-card {
        background: rgba(20, 0, 40, 0.3) !important;
        border: 1px solid rgba(191, 0, 255, 0.2) !important;
        border-left: 5px solid var(--c-primary) !important;
        border-radius: 0 20px 0 20px !important;
        transition: 0.3s;
        overflow: hidden;
    }

    .theme-antimatter .power-card:hover {
        background: rgba(191, 0, 255, 0.1) !important;
        border-left-width: 10px !important;
        transform: translateX(10px);
        box-shadow: -10px 0 20px rgba(191, 0, 255, 0.2) !important;
    }

    /* Ícone do Poder: Horizonte de Eventos */
    .theme-antimatter .power-icon-frame {
        border-radius: 50% !important;
        border: 1px solid var(--c-primary) !important;
        animation: rotation-void 10s linear infinite;
    }

    /* --- MOTOR DE ANIMAÇÕES ANTI-MATÉRIA --- */

    /* Pulso de respiração do vácuo */
    @keyframes void-breathing {
        0%, 100% { box-shadow: 0 0 15px var(--c-primary), inset 0 0 10px var(--c-secondary); transform: scale(1); }
        50% { box-shadow: 0 0 30px var(--c-primary), inset 0 0 20px var(--c-primary); transform: scale(1.05); }
    }

    /* Flutuação suave dos ícones */
    @keyframes icon-float-void {
        0%, 100% { transform: translateY(0) rotate(0deg); filter: brightness(1); }
        50% { transform: translateY(-5px) rotate(10deg); filter: brightness(1.5); }
    }

    /* Rotação lenta para elementos circulares */
    @keyframes rotation-void {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    /* Brilho instável para dados ativos */
    @keyframes active-die-glow {
        from { filter: saturate(1) brightness(1); }
        to { filter: saturate(2) brightness(1.3); box-shadow: 0 0 30px var(--c-primary); }
    }

    /* Estilo para as barras de progresso de poder (se houver) */
    .theme-antimatter .progress-fill {
        background: repeating-linear-gradient(
            45deg,
            var(--c-secondary),
            var(--c-secondary) 10px,
            var(--c-primary) 10px,
            var(--c-primary) 20px
        ) !important;
        animation: wave-move 2s linear infinite;
    }

    @keyframes wave-move {
        from { background-position: 0 0; }
        to { background-position: 40px 0; }
    }
    `
},
heroking: {
    label: "HERO KING",
    class: "theme-heroking",
    desc: "TODOS OS TESOUROS DO MUNDO ME PERTENCEM. CONTEMPLE A FÚRIA DO DRAGÃO.",
    vars: {
        "--c-primary": "#ffcc00",     // Ouro Babilônico
        "--c-secondary": "#ff0033",   // Carmesim (Enuma Elish / Fogo de Dragão)
        "--c-bg": "#0a0101",          // Escuridão Dracônica
        "--c-text": "#fcf6ba",        // Ouro Pálido
        "--font-head": "'Cinzel', 'Times New Roman', serif", // Traz a realeza do Gilgamesh
        "--font-body": "'Rajdhani', sans-serif",
        "--f-clip": "polygon(10% 0, 100% 0, 90% 100%, 0% 100%)", // Cortes agressivos em lança
        "--f-border": "1px solid rgba(255, 204, 0, 0.5)",
        "--f-shadow": "0 0 20px rgba(255, 0, 51, 0.6)"
    },
    extraCSS: `
        /* --- 1. CURSORES: A LANÇA EA (ENUMA ELISH) --- */
        /* Uma lança vermelha incandescente com núcleo dourado */
        .theme-heroking, .theme-heroking * {
            cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M16 2 L22 12 L16 30 L10 12 Z" fill="%23ff0033" stroke="%23ffcc00" stroke-width="1.5"/><circle cx="16" cy="12" r="2" fill="%23ffffff"/><path d="M16 2 L22 12 L16 30 L10 12 Z" fill="url(%23g)" opacity="0.5"/><defs><radialGradient id="g"><stop offset="0%" stop-color="%23ffcc00"/><stop offset="100%" stop-color="transparent"/></radialGradient></defs></svg>') 16 2, auto !important;
        }

        .theme-heroking button, .theme-heroking .icon-btn, .theme-heroking [cursor="pointer"], .theme-heroking .visual-card {
            cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M16 0 L24 14 L16 32 L8 14 Z" fill="%23ffcc00" stroke="%23ff0033" stroke-width="2"/><circle cx="16" cy="14" r="3" fill="%23ff0033"/><filter id="glow"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></svg>') 16 0, pointer !important;
        }

        /* --- 2. LOGIN/FUNDO: PORTÕES DA BABILÔNIA E OLHO DE DRAGÃO --- */
        .theme-heroking .login-layer, .theme-heroking .tactical-backdrop {
            background: radial-gradient(circle at center, #1a0202 0%, #000 100%) !important;
            overflow: hidden;
            position: relative;
        }

        /* Olho do Dragão (Pupila em Fenda) */
        .theme-heroking .login-layer::before, .theme-heroking .tactical-backdrop::before {
            content: "";
            position: absolute;
            top: 50%; left: 50%;
            width: 40px; height: 250px;
            background: #000;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            box-shadow: 
                0 0 50px 20px #ff0033, 
                0 0 100px 50px #ffcc00,
                inset 0 0 20px #ffcc00;
            z-index: 1;
            animation: dragon-eye-pulse 6s ease-in-out infinite;
        }

        /* Ondulações Douradas (Portões da Babilônia abrindo) */
        .theme-heroking .login-layer::after, .theme-heroking .tactical-backdrop::after {
            content: "";
            position: absolute;
            top: 50%; left: 50%;
            width: 300px; height: 300px;
            border-radius: 50%;
            border: 2px solid var(--c-primary);
            transform: translate(-50%, -50%);
            box-shadow: 0 0 50px var(--c-primary), inset 0 0 50px var(--c-secondary);
            z-index: 0;
            animation: gate-of-babylon 3s cubic-bezier(0.25, 1, 0.5, 1) infinite;
            opacity: 0;
        }

        /* --- 3. MOLDURAS E PAINÉIS: ESCAMAS DE DRAGÃO --- */
        .theme-heroking .cyber-panel, 
        .theme-heroking .dossier-window, 
        .theme-heroking .military-terminal {
            background-color: #0a0101 !important;
            /* Padrão CSS puro criando escamas de dragão sobrepostas */
            background-image: 
                radial-gradient(circle at 100% 150%, #0a0101 24%, #ff0033 25%, #0a0101 28%, transparent 29%),
                radial-gradient(circle at 0% 150%, #0a0101 24%, #ff0033 25%, #0a0101 28%, transparent 29%),
                radial-gradient(circle at 50% 100%, #1a0202 10%, #ffcc00 11%, #1a0202 14%, transparent 15%) !important;
            background-size: 40px 20px !important;
            border: 2px solid var(--c-primary) !important;
            box-shadow: 0 0 30px rgba(255, 0, 51, 0.4), inset 0 0 20px rgba(255, 204, 0, 0.1) !important;
            border-radius: 4px !important;
        }

        .theme-heroking .panel-head, 
        .theme-heroking .mil-header, 
        .theme-heroking .dossier-header {
            background: linear-gradient(90deg, #330000 0%, #000 100%) !important;
            border-bottom: 2px solid var(--c-primary) !important;
            box-shadow: 0 5px 15px rgba(255, 204, 0, 0.2);
        }

        /* --- 4. AVATARES E ÍCONES: OURO DERRETIDO --- */
        .theme-heroking .icon-frame, 
        .theme-heroking .portrait-frame {
            border: 2px solid var(--c-primary) !important;
            border-radius: 10px 0 10px 0 !important; /* Estética de joia/corte de espada */
            background: radial-gradient(circle, rgba(255, 204, 0, 0.3) 0%, rgba(255, 0, 51, 0.4) 50%, rgba(0, 0, 0, 1) 100%) !important;
            box-shadow: 0 0 15px var(--c-secondary) !important;
            transition: 0.3s;
        }

        .theme-heroking .portrait-frame img {
            border-radius: 8px 0 8px 0 !important;
            filter: contrast(1.1) sepia(0.3) hue-rotate(-10deg) saturate(1.2); /* Tom ligeiramente dourado/épico */
        }

        .theme-heroking .icon-btn:hover .icon-frame {
            border-color: #fff !important;
            box-shadow: 0 0 30px var(--c-primary), inset 0 0 20px var(--c-secondary) !important;
            transform: scale(1.05) translateY(-2px);
            background: radial-gradient(circle, rgba(255, 204, 0, 0.6) 0%, rgba(255, 0, 51, 0.8) 50%, rgba(0, 0, 0, 1) 100%) !important;
        }

        .theme-heroking .icon-btn:hover i {
            color: #fff !important;
            text-shadow: 0 0 10px var(--c-primary), 0 0 20px var(--c-secondary);
            animation: dragon-breath 1s ease-in-out infinite alternate;
        }

        /* --- 5. RECURSOS E BARRAS: CHAMA E OURO --- */
        .theme-heroking .orb-liquid {
            background: linear-gradient(180deg, var(--c-primary) 0%, var(--c-secondary) 80%, #000 100%) !important;
            box-shadow: inset 0 0 10px #fff;
            animation: lava-flow 3s linear infinite;
        }

        .theme-heroking .cap-bar-fill {
            background: linear-gradient(90deg, var(--c-secondary), var(--c-primary), #fff) !important;
            box-shadow: 0 0 15px var(--c-primary) !important;
            background-size: 200% 100% !important;
            animation: gold-shimmer 2s linear infinite !important;
        }

        /* --- 6. BOTÕES E INTERAÇÕES --- */
        .theme-heroking .btn-action, 
        .theme-heroking .btn-cyber,
        .theme-heroking .btn-save {
            background: rgba(255, 0, 51, 0.1) !important;
            border: 1px solid var(--c-primary) !important;
            color: var(--c-primary) !important;
            font-family: var(--font-head) !important;
            text-transform: uppercase;
            font-weight: bold;
            box-shadow: inset 0 0 5px rgba(255, 204, 0, 0.2);
            transition: 0.3s;
        }

        .theme-heroking .btn-action:hover, 
        .theme-heroking .btn-cyber:hover,
        .theme-heroking .btn-save:hover {
            background: linear-gradient(45deg, var(--c-secondary), var(--c-primary)) !important;
            color: #000 !important;
            border-color: #fff !important;
            box-shadow: 0 0 20px var(--c-primary), inset 0 0 10px #fff !important;
            transform: scale(1.02);
            text-shadow: none !important;
        }

        /* O botão Snap/Multiversal (O disparo do Enuma Elish) */
        .theme-heroking .btn-multiversal {
            background: #1a0000 !important;
            color: var(--c-primary) !important;
            border: 2px solid var(--c-secondary) !important;
            box-shadow: 0 0 20px var(--c-secondary), inset 0 0 10px var(--c-secondary) !important;
            clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%) !important; /* Hexágono */
        }

        .theme-heroking .btn-multiversal:hover {
            background: var(--c-secondary) !important;
            color: #fff !important;
            border-color: var(--c-primary) !important;
            box-shadow: 0 0 40px var(--c-secondary), 0 0 20px var(--c-primary) !important;
        }

        .theme-heroking .btn-multiversal.snap-active {
            animation: enuma-elish-blast 1.5s forwards cubic-bezier(0.8, 0, 0.2, 1) !important;
        }

        /* --- 7. DESTAQUES E TEXTOS (DECODIFICADOR) --- */
        :global(.theme-heroking .cyber-highlight) {
            background: rgba(255, 204, 0, 0.15) !important;
            color: var(--c-primary) !important;
            border-bottom: 1px solid var(--c-primary) !important;
            text-shadow: 0 0 8px rgba(255, 204, 0, 0.8) !important;
        }

        :global(.theme-heroking .cyber-alert) {
            background: rgba(255, 0, 51, 0.15) !important;
            color: #ff3333 !important;
            border-bottom: 1px solid #ff3333 !important;
            text-shadow: 0 0 8px rgba(255, 0, 51, 0.8) !important;
        }

        :global(.theme-heroking .cyber-h3) {
            color: var(--c-primary) !important;
            border-bottom: 1px solid var(--c-secondary) !important;
            font-family: var(--font-head) !important;
            text-shadow: 0 0 10px rgba(255, 0, 51, 0.5) !important;
        }

        /* --- 8. ANIMAÇÕES DO REI DOS HERÓIS --- */
        
        @keyframes dragon-eye-pulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1) scaleX(1); opacity: 0.8; box-shadow: 0 0 50px 20px #ff0033, 0 0 100px 50px #ffcc00, inset 0 0 20px #ffcc00; }
            50% { transform: translate(-50%, -50%) scale(1.05) scaleX(0.8); opacity: 1; box-shadow: 0 0 70px 30px #ff0033, 0 0 120px 60px #ffcc00, inset 0 0 30px #fff; }
            /* Blink rápido simulando o dragão piscando */
            95% { transform: translate(-50%, -50%) scale(1) scaleX(0.1); opacity: 0.2; }
            98% { transform: translate(-50%, -50%) scale(1) scaleX(1); opacity: 1; }
        }

        @keyframes gate-of-babylon {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; border-width: 5px; box-shadow: 0 0 50px var(--c-primary), inset 0 0 50px var(--c-secondary); }
            100% { transform: translate(-50%, -50%) scale(3); opacity: 0; border-width: 1px; box-shadow: 0 0 0px var(--c-primary), inset 0 0 0px var(--c-secondary); }
        }

        @keyframes lava-flow {
            0% { filter: hue-rotate(0deg) saturate(1); }
            50% { filter: hue-rotate(-15deg) saturate(1.5); }
            100% { filter: hue-rotate(0deg) saturate(1); }
        }

        @keyframes dragon-breath {
            0% { transform: translateY(0); color: var(--c-primary); }
            100% { transform: translateY(-3px); color: #fff; }
        }

        @keyframes gold-shimmer {
            0% { background-position: 200% center; }
            100% { background-position: -200% center; }
        }

        @keyframes enuma-elish-blast {
            0% { transform: scale(1) rotate(0deg); filter: brightness(1); }
            20% { transform: scale(0.8) rotate(-45deg); filter: brightness(0.5); box-shadow: inset 0 0 50px #000; }
            40% { transform: scale(1.5) rotate(180deg); filter: brightness(3); box-shadow: 0 0 100px #ff0033, 0 0 50px #ffcc00; background: #ff0033 !important;}
            100% { transform: scale(50) rotate(360deg); opacity: 0; filter: brightness(10); }
        }

        /* ========================================================
           HERO KING :: INTEGRAÇÃO ABA DE PERFIL
           ======================================================== */
        
        /* Retrato: Tesouro da Babilônia (Bordas de Espada) */
        .theme-heroking .portrait {
            border-radius: 12px 0 12px 0 !important;
            border: 2px solid var(--c-primary) !important;
            box-shadow: 0 0 15px var(--c-secondary), inset 0 0 10px #000 !important;
            background: #0a0101 !important;
        }
        .theme-heroking .portrait:hover {
            border-color: #fff !important;
            box-shadow: 0 0 30px var(--c-primary), 0 0 20px var(--c-secondary) !important;
            /* Reflexo Dourado Majestoso */
            filter: contrast(1.1) saturate(1.3) drop-shadow(0 0 10px #ffcc00);
        }
        .theme-heroking .info-col label { color: var(--c-secondary) !important; text-shadow: 0 0 5px var(--c-secondary); }
        .theme-heroking .name-input { color: var(--c-text) !important; border-bottom-color: var(--c-primary) !important; text-shadow: 0 0 10px rgba(255, 204, 0, 0.4);}
        .theme-heroking .name-input:focus { border-bottom-color: var(--c-secondary) !important; }

        /* Esferas de Nível e Recursos (Escamas e Ouro) */
        .theme-heroking .resource-display,
        .theme-heroking .willpower-module,
        .theme-heroking .origin-display,
        .theme-heroking .cyber-list,
        .theme-heroking .bio-card,
        .theme-heroking .body-art-container {
            background-color: #0a0101 !important;
            background-image: 
                radial-gradient(circle at 100% 150%, #0a0101 24%, rgba(255,0,51,0.1) 25%, #0a0101 28%, transparent 29%),
                radial-gradient(circle at 0% 150%, #0a0101 24%, rgba(255,0,51,0.1) 25%, #0a0101 28%, transparent 29%) !important;
            background-size: 30px 15px !important;
            border: 1px solid var(--c-primary) !important;
            box-shadow: inset 0 0 20px rgba(255, 0, 51, 0.2) !important;
            border-radius: 4px !important;
        }
        
        .theme-heroking .res-line.main, .theme-heroking .w-label { color: var(--c-primary) !important; text-shadow: 0 0 5px var(--c-primary); }
        .theme-heroking .res-line .val, .theme-heroking .w-calc strong { color: #fff !important; }
        .theme-heroking .dim { color: #aa8888 !important; }

        /* Level Orb: O Portal Abrindo */
        .theme-heroking .bg-ring { stroke: #220000 !important; }
        .theme-heroking .prog-ring { stroke: var(--c-primary) !important; filter: drop-shadow(0 0 10px var(--c-secondary)); }
        .theme-heroking .level-txt strong { color: var(--c-primary) !important; text-shadow: 0 0 10px var(--c-secondary); font-size: 24px !important;}

        /* Animação Fúria do Rei (Hover em Cards e Detalhes) */
        .theme-heroking .bio-card:hover,
        .theme-heroking .body-art-container:hover,
        .theme-heroking .detail-box:hover {
            border-color: var(--c-secondary) !important;
            box-shadow: 0 0 20px rgba(255, 0, 51, 0.5), inset 0 0 15px rgba(255, 204, 0, 0.2) !important;
            transform: translateY(-2px) scale(1.01);
            background-image: 
                radial-gradient(circle at 100% 150%, #1a0202 24%, rgba(255,204,0,0.2) 25%, #1a0202 28%, transparent 29%),
                radial-gradient(circle at 0% 150%, #1a0202 24%, rgba(255,204,0,0.2) 25%, #1a0202 28%, transparent 29%) !important;
        }

        .theme-heroking .card-header, .theme-heroking .origin-header, .theme-heroking .body-art-header {
            background: linear-gradient(90deg, #330000 0%, #0a0101 100%) !important;
            color: var(--c-primary) !important;
            border-bottom: 2px solid var(--c-secondary) !important;
        }

        /* Banner: Lente Enuma Elish */
        .theme-heroking .banner-overlay {
            background: rgba(10, 1, 1, 0.8) !important;
            color: var(--c-primary) !important;
            text-shadow: 0 0 10px var(--c-secondary), 0 0 20px #ff0033;
            border: 2px solid var(--c-secondary);
            box-shadow: inset 0 0 40px rgba(255,0,51,0.8);
        }

        /* Tags e Detalhes Majestosos */
        .theme-heroking .trait-tag { background: #1a0202 !important; border-color: var(--c-secondary) !important; color: var(--c-primary) !important; }
        .theme-heroking .trait-tag:hover { background: var(--c-primary) !important; border-color: #fff !important; color: #000 !important; box-shadow: 0 0 10px var(--c-primary); }
        .theme-heroking .detail-box { background: #000 !important; border-color: #330000 !important; }
        .theme-heroking .detail-box .val { color: var(--c-primary) !important; }
        
        .theme-heroking .sync-btn, .theme-heroking .edit-lore-btn { border-color: var(--c-secondary) !important; color: var(--c-primary) !important; }
        .theme-heroking .sync-btn:hover, .theme-heroking .edit-lore-btn:hover { background: var(--c-secondary) !important; border-color: #fff !important; color: #fff !important; box-shadow: 0 0 15px var(--c-secondary); }
    `
},

novoimortal: {
    label: "O NOVO IMORTAL",
    class: "theme-novoimortal",
    desc: "A EVOLUÇÃO TRANSCENDE A ALMA. O HOGYOKU DESPERTA O DRAGÃO SOLAR.",
    vars: {
        "--c-primary": "#00d4ff",     // Azul Hogyoku
        "--c-secondary": "#ff3300",   // Vermelho/Laranja Solar (Aquecimento)
        "--c-bg": "#020406",          // Preto Shinigami (Fundo Escuro)
        "--c-panel": "rgba(10, 15, 20, 0.8)", // Painel de Vidro Escuro
        "--c-text": "#ffffff",        // Textos puramente brancos
        "--font-head": "'Cinzel', serif", 
        "--font-body": "'Rajdhani', sans-serif",
        "--f-clip": "none",           // Remove os cortes geométricos para dar lugar ao arredondado
        "--f-border": "1px solid rgba(0, 212, 255, 0.6)",
        "--f-shadow": "0 0 15px rgba(0, 212, 255, 0.3)"
    },
    extraCSS: `
        /* --- 1. CURSORES TRANSCENDENTES --- */
        .theme-novoimortal, .theme-novoimortal * {
            cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M12 0 C 20 10, 28 15, 30 25 C 25 25, 15 20, 0 32 C 5 20, 8 10, 12 0 Z" fill="%2300d4ff" stroke="%23ffffff" stroke-width="1.5"/><circle cx="16" cy="18" r="2" fill="%23ffffff"/></svg>') 12 0, auto !important;
        }

        .theme-novoimortal button, .theme-novoimortal .icon-btn, .theme-novoimortal [cursor="pointer"], .theme-novoimortal .visual-card {
            cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><g><animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="3s" repeatCount="indefinite"/><path d="M16 0 L18 10 L28 8 L22 16 L28 24 L18 22 L16 32 L14 22 L4 24 L10 16 L4 8 L14 10 Z" fill="%23ff4400" stroke="%23ffcc00" stroke-width="1.5"/></g><circle cx="16" cy="16" r="4" fill="%23ffffff"/></svg>') 16 16, pointer !important;
        }

        /* --- 2. O HOGYOKU NO VÁCUO (FUNDO ESCURO) --- */
        .theme-novoimortal .login-layer, .theme-novoimortal .tactical-backdrop, .theme-novoimortal .dossier-backdrop {
            background: radial-gradient(circle at center, #050a14 0%, #000000 100%) !important;
            position: relative;
            overflow: hidden;
        }

        .theme-novoimortal .login-layer::before, .theme-novoimortal .tactical-backdrop::before, .theme-novoimortal .dossier-backdrop::before {
            content: "";
            position: absolute;
            top: 50%; left: 50%;
            width: 50px; height: 50px;
            background: #ffffff;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            box-shadow: 
                0 0 30px 10px #00d4ff, 
                0 0 80px 40px rgba(0, 85, 255, 0.4),
                inset 0 0 15px #0055ff;
            z-index: 0;
            animation: hogyoku-void-pulse 4s ease-in-out infinite;
        }

        /* --- 3. PAINÉIS E BORDAS ARREDONDADAS --- */
        .theme-novoimortal .military-terminal,
        .theme-novoimortal .dossier-window,
        .theme-novoimortal .codex-sidebar,
        .theme-novoimortal .doc-workspace,
        .theme-novoimortal .dossier-body,
        .theme-novoimortal .anotation-backdrop .data-hell-app,
        .theme-novoimortal .cyber-panel,
        .theme-novoimortal .bio-card,
        .theme-novoimortal .body-art-container {
            background-color: var(--c-panel) !important;
            border: var(--f-border) !important;
            border-radius: 12px !important; /* Arredondamento */
            box-shadow: var(--f-shadow) !important;
            color: #ffffff !important;
            backdrop-filter: blur(5px);
            clip-path: none !important; /* Desativa os recortes quadrados */
        }

        .theme-novoimortal .mil-header, 
        .theme-novoimortal .dossier-header,
        .theme-novoimortal .brand,
        .theme-novoimortal .card-header,
        .theme-novoimortal .body-art-header {
            background: rgba(0, 212, 255, 0.05) !important;
            border-bottom: 2px solid #00d4ff !important;
            border-radius: 12px 12px 0 0 !important;
            color: #ffffff !important;
            text-shadow: 0 0 8px #00d4ff;
        }

        /* --- 4. TEXTOS E DADOS CELESTIAIS --- */
        .theme-novoimortal input, .theme-novoimortal textarea {
            background: rgba(0, 0, 0, 0.4) !important;
            color: #ffffff !important;
            border: 1px solid rgba(0, 212, 255, 0.4) !important;
            border-radius: 8px !important;
        }
        
        .theme-novoimortal input:focus, .theme-novoimortal textarea:focus {
            border-color: #00d4ff !important;
            box-shadow: 0 0 10px rgba(0, 212, 255, 0.4) !important;
            outline: none;
        }

        .theme-novoimortal .read-body, .theme-novoimortal p, .theme-novoimortal label, .theme-novoimortal .val {
            color: #ffffff !important;
        }

        /* --- 5. ÍCONES COMO FRAGMENTOS DO HOGYOKU --- */
        .theme-novoimortal .icon-frame,
        .theme-novoimortal .avatar,
        .theme-novoimortal .doc-icon {
            border-radius: 50% !important;
            border: 2px solid #00d4ff !important;
            box-shadow: 0 0 15px rgba(0, 212, 255, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.2) !important;
            background: rgba(0, 0, 0, 0.5) !important;
            animation: hogyoku-fragment-pulse 3s infinite alternate;
            clip-path: none !important;
        }

        /* --- 6. ANIMAÇÃO DE AQUECIMENTO E DESFOQUE (HOVER) --- */
        .theme-novoimortal button,
        .theme-novoimortal .btn-action,
        .theme-novoimortal .btn-cyber,
        .theme-novoimortal .doc-card,
        .theme-novoimortal .icon-btn,
        .theme-novoimortal .detail-box,
        .theme-novoimortal .trait-tag {
            background: rgba(0, 212, 255, 0.05) !important;
            border: 1px solid rgba(0, 212, 255, 0.5) !important;
            color: #ffffff !important;
            border-radius: 8px !important;
            transition: all 0.3s ease !important; /* Esfria suavemente ao tirar o mouse */
        }

        /* A MÁGICA: Ao encostar o mouse, a animação assume o controle */
        .theme-novoimortal button:hover,
        .theme-novoimortal .doc-card:hover,
        .theme-novoimortal .icon-btn:hover,
        .theme-novoimortal .detail-box:hover,
        .theme-novoimortal .trait-tag:hover {
            animation: heat-up-wave 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards !important;
        }

        .theme-novoimortal button:hover i,
        .theme-novoimortal .doc-card:hover i,
        .theme-novoimortal .icon-btn:hover i {
            color: #ffffff !important;
            text-shadow: 0 0 10px #ffffff, 0 0 15px #ff6600 !important;
        }

        /* --- MOTORES DE ANIMAÇÃO TRANSCENDENTES --- */
        
        @keyframes hogyoku-void-pulse {
            0%, 100% { box-shadow: 0 0 30px 10px #00d4ff, 0 0 80px 40px rgba(0, 85, 255, 0.4), inset 0 0 10px #0055ff; transform: translate(-50%, -50%) scale(1); }
            50% { box-shadow: 0 0 50px 20px #00e5ff, 0 0 100px 50px rgba(0, 119, 255, 0.6), inset 0 0 20px #ffffff; transform: translate(-50%, -50%) scale(1.05); }
        }

        @keyframes hogyoku-fragment-pulse {
            0%, 100% { box-shadow: 0 0 10px rgba(0, 212, 255, 0.4), inset 0 0 5px rgba(255, 255, 255, 0.1); }
            50% { box-shadow: 0 0 20px rgba(0, 212, 255, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.4); }
        }

        /* Animação de Aquecimento: Começa Azul -> Embaça -> Fica Laranja -> Termina Nítido e Vermelho/Laranja */
        @keyframes heat-up-wave {
            0% {
                border-color: #00d4ff;
                box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
                filter: blur(0px);
                background: rgba(0, 212, 255, 0.1);
            }
            40% {
                border-color: #ffaa00;
                box-shadow: 0 0 20px rgba(255, 170, 0, 0.8);
                filter: blur(1.5px); /* O borrão rápido do calor */
                background: rgba(255, 170, 0, 0.2);
                transform: scale(1.02);
            }
            100% {
                border-color: #ff3300;
                box-shadow: 0 0 15px rgba(255, 51, 0, 0.6), inset 0 0 10px rgba(255, 51, 0, 0.2);
                filter: blur(0px); /* Volta a ficar nítido */
                background: rgba(255, 51, 0, 0.15);
                transform: scale(1.02);
            }
        }

        /* ========================================================
           NOVO IMORTAL :: INTEGRAÇÃO ABA DE PERFIL
           ======================================================== */
        
        .theme-novoimortal .portrait {
            border-radius: 50% !important;
            border: 3px solid #00d4ff !important;
            box-shadow: 0 0 20px rgba(0, 212, 255, 0.5), inset 0 0 15px rgba(255, 255, 255, 0.2) !important;
            background: #000 !important;
            animation: hogyoku-fragment-pulse 3s infinite alternate;
        }
        .theme-novoimortal .portrait:hover {
            animation: heat-up-wave 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards !important;
        }
        
        .theme-novoimortal .info-col label { color: #00d4ff !important; }
        .theme-novoimortal .name-input { color: #ffffff !important; border-bottom-color: #00d4ff !important; font-weight: bold;}
        .theme-novoimortal .name-input:focus { border-bottom-color: #ff3300 !important; }

        /* Level Orb Brilhante */
        .theme-novoimortal .bg-ring { stroke: rgba(0, 212, 255, 0.1) !important; }
        .theme-novoimortal .prog-ring { stroke: #00d4ff !important; filter: drop-shadow(0 0 8px #00d4ff); }
        .theme-novoimortal .level-txt strong { color: #ffffff !important; text-shadow: 0 0 10px #00d4ff; }
        .theme-novoimortal .level-txt small { color: #00d4ff !important; }

        .theme-novoimortal .res-line.main, .theme-novoimortal .w-label { color: #00d4ff !important; text-shadow: 0 0 5px rgba(0, 212, 255, 0.5); }
        
        .theme-novoimortal .sync-btn, .theme-novoimortal .edit-lore-btn { border-color: #00d4ff !important; color: #00d4ff !important; }
        .theme-novoimortal .sync-btn:hover, .theme-novoimortal .edit-lore-btn:hover { animation: heat-up-wave 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards !important; color: #fff !important; }

        /* Decodificador na Anotação */
        :global(.theme-novoimortal .cyber-highlight) {
            background: rgba(0, 212, 255, 0.2) !important;
            color: #00ffff !important;
            border-bottom: 1px solid #00d4ff !important;
        }

        :global(.theme-novoimortal .cyber-alert) {
            background: rgba(255, 51, 0, 0.2) !important;
            color: #ff6600 !important;
            border-bottom: 1px solid #ff3300 !important;
        }
    `
},

}

    


