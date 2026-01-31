// src/data/ThemeDB.js

export const THEME_DB = {
  // ... (Mantenha o 'default' e 'flame_inferno' que já funcionam) ...
  'default': {
    label: 'MATRIX TERMINAL',
    icon: 'fa-terminal',
    color: '#00ff41',
    desc: 'Interface de linha de comando clássica.',
    css: `
      & {
        background-color: #000000 !important;
        border: 1px solid #00ff41 !important;
        border-radius: 0px !important;
        font-family: 'Courier New', monospace !important;
      }
      &::after {
        content: " "; display: block; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        background: repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0, 255, 65, 0.05) 3px);
        pointer-events: none; z-index: 5;
      }
      & .xp-badge { background: #00ff41 !important; color: #000 !important; border-radius: 0 !important; }
      & .btn-buy:hover:not(:disabled) { background: #00ff41 !important; color: #000 !important; box-shadow: 0 0 15px #00ff41; }
      & .die-icon i { color: #00ff41 !important; }
    `
  },

  'flame_inferno': {
    label: 'CHAMA ETERNA',
    icon: 'fa-fire-alt',
    color: '#ff4500', 
    desc: 'O calor da batalha incendeia este poder.',
    css: `
      & {
        background: linear-gradient(to top, #220500, #100000);
        border: 1px solid #ff4500 !important;
        border-bottom: 4px solid #ffaa00 !important;
        box-shadow: 0 -10px 20px rgba(255, 69, 0, 0.2);
        animation: fire-flicker 3s infinite alternate;
      }
      @keyframes fire-flicker {
        0% { border-color: #ff4500; } 100% { border-color: #ffaa00; }
      }
      & .icon-box { border-radius: 10px 10px 50% 50% !important; border: 2px solid #ffaa00 !important; background: radial-gradient(circle, #ffaa00, #550000); }
      & .die-card { background: #1a0500 !important; border: 1px solid #551100 !important; }
      & .die-icon i { filter: drop-shadow(0 0 5px #ff4500); animation: ember-glow 2s infinite; }
      & .die-icon.normal i { color: #aa5500; }
      & .die-icon.hard i { color: #ff4500; }
      & .die-icon.wiggle i { color: #ffcc00; }
      @keyframes ember-glow { 50% { filter: brightness(1.5) drop-shadow(0 0 10px #ffaa00); transform: scale(1.05); } }
      & .btn-buy { background: linear-gradient(to bottom, #500, #200) !important; border: 1px solid #f50 !important; color: #fb0 !important; }
      & .btn-buy:hover:not(:disabled) { background: linear-gradient(to top, #ff4500, #ffaa00) !important; color: #000 !important; }
    `
  },

  // ==========================================================================================
  // TEMA: HACKER (CORRIGIDO - SEM QUEBRAR ÍCONES)
  // Agora usa os dados originais, mas com visual "Matrix Glitch"
  // ==========================================================================================
  'hacker_term': {
    label: 'ROOT ACCESS',
    icon: 'fa-user-secret',
    color: '#00ff00',
    desc: 'Invasão de sistema.',
    css: `
      & { 
        background-color: #050505 !important; 
        border: 2px solid #00ff00 !important; 
        border-radius: 0 !important; 
        font-family: monospace !important; 
        color: #00ff00 !important; 
        text-shadow: 0 0 4px #00ff00; 
      }
      
      /* Cursor piscando no nome */
      & .power-name::after { content: "_"; animation: blink 1s step-end infinite; }
      @keyframes blink { 50% { opacity: 0; } }

      /* DADOS ESTILO DIGITAL */
      & .die-card {
        border: 1px dashed #00ff00 !important;
        background: rgba(0, 255, 0, 0.05) !important;
      }

      /* Ícones dos dados originais pintados de verde matrix */
      & .die-icon i { 
        color: #00ff00 !important; 
        text-shadow: 2px 0px 0px rgba(255,0,0,0.5), -2px 0px 0px rgba(0,0,255,0.5); /* Efeito Glitch RGB */
      }
      
      & .btn-buy { 
        border: 1px solid #00ff00 !important; 
        background: #000 !important; 
        color: #00ff00 !important; 
        border-radius: 0 !important; 
      }
      & .btn-buy:hover:not(:disabled) { 
        background: #00ff00 !important; 
        color: #000 !important; 
      }
    `
  },

  // ==========================================================================================
  // TEMA: RYUJIN (GEMA/DRAGÃO)
  // ==========================================================================================
  'ryujin_gem': {
    label: 'DRAGÃO CELESTIAL',
    icon: 'fa-dragon',
    color: '#0055ff', 
    desc: 'O poder selado em uma joia ancestral.',
    css: `
      & { background: #050510 !important; border: 1px solid #cca300 !important; border-left: 4px solid #ffd700 !important; border-radius: 4px !important; }
      &::after { content: ""; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1), transparent); transform: skewX(-25deg); animation: holo-shine 6s infinite; pointer-events: none; }
      @keyframes holo-shine { 0%, 80% { left: -100%; } 100% { left: 200%; } }
      & .icon-box { border: 2px solid #ffd700 !important; transform: rotate(45deg); width: 36px !important; height: 36px !important; margin: 10px 18px 10px 10px !important; }
      & .power-img { transform: rotate(-45deg) scale(1.4); }
      & .die-card { background: linear-gradient(to bottom, #0a0a20, #000) !important; border-bottom: 2px solid #cca300 !important; }

      & .die-icon.normal i { color: #ffd700; animation: spin-slow 10s linear infinite; }
      & .die-icon.hard i { color: #00aaff; text-shadow: 0 0 5px #0055ff; }
      & .die-icon.wiggle i { color: #ff3333; text-shadow: 0 0 5px #aa0000; }

      @keyframes spin-slow { 100% { transform: rotate(360deg); } }
      & .btn-buy { background: #111 !important; border: 1px solid #555 !important; color: #cca300 !important; }
      & .btn-buy:hover:not(:disabled) { background: #cca300 !important; color: #000 !important; border-color: #ffd700 !important; }
    `
  },

  // ==========================================================================================
  // TEMA: GODZILLA (CORRIGIDO - D20 VOLTOU)
  // Mantém os dados originais. O D20 (Wiggle) brilha intensamente como um reator.
  // ==========================================================================================
  'godzilla_atomic': {
    label: 'AMEAÇA TITÃ',
    icon: 'fa-radiation-alt',
    color: '#00e1ff',
    desc: 'Carregando energia nuclear.',
    css: `
      & { background-color: #0a0a10 !important; border: 3px solid #003344 !important; border-radius: 8px !important; box-shadow: 0 0 10px #000; }
      & .icon-box { background: #001122 !important; border: 2px solid #00e1ff !important; box-shadow: 0 0 15px #00e1ff; }
      & .die-card { background: rgba(0, 20, 30, 0.8) !important; border: 1px solid #005566 !important; }
      
      /* DADOS NORMAIS (Titã) */
      & .die-icon.normal i { color: #446677; }
      & .die-icon.hard i { color: #00aaff; text-shadow: 0 0 5px #00e1ff; }

      /* DADO WIGGLE (O Reator Nuclear) */
      /* Não substitui mais o ícone, apenas faz ele brilhar absurdamente */
      & .die-icon.wiggle i { 
        color: #ffffff !important; /* Núcleo Branco */
        text-shadow: 0 0 5px #00e1ff, 0 0 15px #00e1ff, 0 0 30px #00e1ff; /* Brilho Neon */
        animation: reactor-pulse 0.5s infinite alternate; 
      }
      
      @keyframes reactor-pulse { 
        from { transform: scale(1); filter: brightness(1); } 
        to { transform: scale(1.1); filter: brightness(1.3); } 
      }

      & .btn-buy { background: #002233 !important; color: #00e1ff !important; border: 1px solid #00e1ff !important; font-family: monospace; }
      & .btn-buy:hover:not(:disabled) { background: #00e1ff !important; color: #000 !important; box-shadow: 0 0 25px #00e1ff; }
    `
  },
  // ==========================================================================================
  // TEMA: VAMPIRE (CASTLEVANIA STYLE)
  // Estilo: Gótico, Elegante, Sangue e Ouro. Fonte Serifada.
  // ==========================================================================================
  'vampire_lord': {
    label: 'LINHAGEM DRÁCULA',
    icon: 'fa-wine-glass-alt', // Taça de Sangue
    color: '#8a0303', // Vermelho Sangue Escuro
    desc: 'O que é um homem? Uma pequena pilha de segredos.',
    css: `
      /* --- ARQUITETURA GÓTICA --- */
      & {
        background: linear-gradient(180deg, #000000 0%, #2a0000 100%) !important;
        border: 4px double #d4af37 !important; /* Borda dupla Dourada */
        border-radius: 2px !important;
        box-shadow: 0 5px 15px rgba(0,0,0,0.9);
        font-family: "Georgia", "Times New Roman", serif !important; /* Fonte Clássica */
      }

      /* Título Elegante */
      & .power-name {
        color: #d4af37; /* Ouro */
        text-shadow: 0 0 5px #000;
        letter-spacing: 1px;
        font-style: italic;
      }

      /* --- ÍCONE: SANGUE SAGRADO --- */
      & .icon-box {
        border-radius: 50% !important;
        border: 2px solid #8a0303 !important;
        background: #000 !important;
        box-shadow: 0 0 15px #8a0303;
      }
      & .power-img { filter: sepia(0.5) contrast(1.2) saturate(1.5); }

      /* --- DADOS: RUBIS DE SANGUE --- */
      & .die-card {
        background: rgba(20, 0, 0, 0.9) !important;
        border: 1px solid #550000 !important;
        border-top: 2px solid #d4af37 !important; /* Detalhe ouro no topo */
      }

      /* Estilização dos Ícones (Mantendo os originais) */
      & .die-icon i { 
        filter: drop-shadow(0 2px 2px rgba(0,0,0,0.8));
      }

      /* Normal (D10): Sangue */
      & .die-icon.normal i { color: #ff0000; text-shadow: 0 0 5px #550000; }
      
      /* Hard (D6): Névoa/Morcego (Cinza/Ouro) */
      & .die-icon.hard i { color: #d4af37; text-shadow: 0 0 5px #8a6c00; }
      
      /* Wiggle (D20): O Coração das Trevas */
      & .die-icon.wiggle i { 
        color: #8a0303; 
        text-shadow: 0 0 10px #ff0000; 
        animation: heartbeat 1.5s infinite; 
      }
      @keyframes heartbeat {
        0% { transform: scale(1); }
        15% { transform: scale(1.15); }
        30% { transform: scale(1); }
        45% { transform: scale(1.15); }
        60% { transform: scale(1); }
      }

      /* Botão Aristocrático */
      & .btn-buy {
        background: #1a0000 !important;
        color: #d4af37 !important;
        border: 1px solid #8a0303 !important;
        font-family: serif !important;
        font-style: italic;
      }
      & .btn-buy:hover:not(:disabled) {
        background: #550000 !important;
        color: #fff !important;
        box-shadow: 0 0 15px #8a0303;
      }
    `
  },

  // ==========================================================================================
  // TEMA: GHOUL (TOKYO GHOUL STYLE)
  // Estilo: Preto e Vermelho Neon, Textura de Músculo/Kagune, Distorção, Olho Kakugan.
  // ==========================================================================================
  'ghoul_kagune': {
    label: 'PREDADOR GHOUL',
    icon: 'fa-mask', // Máscara Kaneki
    color: '#ff0000', // Vermelho Neon
    desc: 'O gosto da carne humana... e café.',
    css: `
      /* --- PELE DE KAGUNE --- */
      & {
        background-color: #000 !important;
        /* Textura de fibras musculares preta e cinza escuro */
        background: repeating-linear-gradient(
          45deg,
          #000,
          #000 10px,
          #111 10px,
          #111 20px
        ) !important;
        
        border: 2px solid #ff0000 !important;
        border-radius: 0 15px 0 15px !important; /* Bordas cortadas agressivas */
        box-shadow: 5px 5px 0 #330000;
        overflow: hidden !important;
      }

      /* Efeito de glitch no título */
      & .power-name {
        color: #fff;
        text-shadow: 2px 0 #ff0000, -2px 0 #000;
        font-family: sans-serif;
        text-transform: uppercase;
        letter-spacing: 2px;
      }

      /* --- ÍCONE: KAKUGAN (O Olho Ghoul) --- */
      & .icon-box {
        background: #000 !important; /* Esclera Preta */
        border: 2px solid #ff0000 !important;
        border-radius: 50% !important;
        box-shadow: inset 0 0 15px #ff0000; /* Íris Vermelha Brilhante */
      }
      & .power-img { 
        filter: grayscale(1) contrast(2); 
        opacity: 0.7; 
      }
      /* Veias saindo do olho */
      & .icon-box::after {
        content: ""; position: absolute; inset: -5px;
        border-radius: 50%;
        border: 1px dashed #550000;
        animation: spin-pulse 10s linear infinite;
      }

      /* --- DADOS: CARNE E FOME --- */
      & .die-card {
        background: #050505 !important;
        border: 1px solid #330000 !important;
        border-left: 3px solid #ff0000 !important; /* Kagune saindo */
      }

      /* Estilização dos Ícones */
      /* Normal: Escuro */
      & .die-icon.normal i { color: #555; }
      
      /* Hard: Olho Vermelho */
      & .die-icon.hard i { 
        color: #ff0000; 
        text-shadow: 0 0 5px #ff0000; 
      }
      
      /* Wiggle: Modo Centopeia (Instável) */
      & .die-icon.wiggle i { 
        color: #fff; 
        text-shadow: 0 0 5px #ff0000, 0 0 15px #ff0000;
        animation: glitch-shake 0.3s infinite;
      }
      @keyframes glitch-shake {
        0% { transform: translate(0,0); }
        25% { transform: translate(1px, -1px); }
        50% { transform: translate(-1px, 1px); }
        75% { transform: translate(1px, 1px); }
        100% { transform: translate(0,0); }
      }

      /* Botão Predador */
      & .btn-buy {
        background: #220000 !important;
        color: #ff0000 !important;
        border: 1px solid #550000 !important;
        text-transform: uppercase;
        font-weight: 900;
      }
      & .btn-buy:hover:not(:disabled) {
        background: #ff0000 !important;
        color: #000 !important;
        box-shadow: 0 0 20px #ff0000;
      }
    `
  },

  // ==========================================================================================
  // TEMA: KURAMA (MODO BIJUU)
  // Estilo: Chakra Laranja borbulhante, Grades da Cela, Selo.
  // ==========================================================================================
  'kurama_mode': {
    label: 'MANTO DA RAPOSA',
    icon: 'fa-paw', // Pata/Besta
    color: '#ff6600', // Laranja Naruto
    desc: 'O selo se rompe. O chakra vaza.',
    css: `
      /* --- O SELO (CAGE) --- */
      & {
        background-color: #2a0a00 !important;
        /* Grades verticais da cela */
        background-image: repeating-linear-gradient(
          90deg,
          rgba(0,0,0,0.5) 0px,
          rgba(0,0,0,0.5) 35px,
          #000 35px,
          #000 45px, /* Barra da grade */
          rgba(255, 100, 0, 0.1) 46px, /* Brilho na barra */
          rgba(0,0,0,0.5) 47px
        ) !important;
        
        border: 3px solid #ff4500 !important;
        border-radius: 4px !important;
        /* Aura de Chakra Laranja */
        box-shadow: 0 0 20px rgba(255, 69, 0, 0.6), inset 0 0 50px rgba(255, 69, 0, 0.2);
        animation: chakra-pulse 3s infinite alternate;
      }

      @keyframes chakra-pulse {
        0% { box-shadow: 0 0 15px rgba(255, 69, 0, 0.5); border-color: #ff4500; }
        100% { box-shadow: 0 0 30px rgba(255, 140, 0, 0.8); border-color: #ffaa00; }
      }

      /* Nome com estilo de Pergaminho/Selo */
      & .power-name {
        color: #ffcc00; /* Dourado */
        font-weight: 900;
        text-shadow: 2px 2px 0 #8b0000;
        letter-spacing: 1px;
      }

      /* --- ÍCONE: OLHO DA BESTA --- */
      & .icon-box {
        background: #000 !important;
        border: 2px solid #ff0000 !important;
        border-radius: 50% 0 50% 0 !important; /* Formato de olho de raposa */
        box-shadow: inset 0 0 10px #ff0000;
        overflow: hidden !important;
      }
      & .power-img { filter: sepia(1) saturate(5) hue-rotate(-50deg); opacity: 0.8; }

      /* --- DADOS DE CHAKRA --- */
      & .die-card {
        background: rgba(50, 10, 0, 0.9) !important;
        border: 1px solid #ff4500 !important;
      }

      /* Normal: Bolha de Chakra */
      & .die-icon.normal i { 
        color: #ffaa00; 
        filter: drop-shadow(0 0 5px #ff4500);
        animation: bubble-float 2s infinite ease-in-out;
      }
      @keyframes bubble-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }

      /* Hard: Fogo/Garra */
      & .die-icon.hard i { 
        color: #ff0000; 
        text-shadow: 0 0 5px #8b0000; 
      }

      /* Wiggle: BIJUU DAMA (Esfera Negra) */
      & .die-icon.wiggle i { 
        color: #2a0a3b; /* Roxo escuro quase preto */
        background: #000;
        border-radius: 50%;
        padding: 2px;
        text-shadow: 0 0 5px #800080; /* Brilho Roxo */
        box-shadow: 0 0 10px #000;
      }

      /* Botão Selo */
      & .btn-buy {
        background: #440000 !important;
        border: 1px solid #ffaa00 !important;
        color: #ffaa00 !important;
      }
      & .btn-buy:hover:not(:disabled) {
        background: #ff4500 !important;
        color: #000 !important;
        box-shadow: 0 0 20px #ff4500;
      }
    `
  },

  // ==========================================================================================
  // TEMA: UCHIHA (LEGADO VISUAL)
  // Estilo: Sharingan, Preto e Vermelho, Amaterasu e Susanoo.
  // ==========================================================================================
  'uchiha_eyes': {
    label: 'CLÃ UCHIHA',
    icon: 'fa-eye', // Olho
    color: '#ff0000', // Vermelho Sharingan
    desc: 'Esses olhos enxergam a escuridão.',
    css: `
      /* --- ATMOSFERA UCHIHA --- */
      & {
        background: radial-gradient(circle at center, #2a0000 0%, #000000 100%) !important;
        border: 2px solid #8b0000 !important;
        border-radius: 50px 4px 50px 4px !important; /* Formato leque Uchiha estilizado */
        box-shadow: 0 0 15px rgba(255, 0, 0, 0.4);
      }

      /* Título Sangrento */
      & .power-name {
        color: #ff0000;
        text-shadow: 0 0 2px #000;
        font-family: serif; /* Elegância Uchiha */
      }

      /* --- ÍCONE: SHARINGAN GIRATÓRIO --- */
      & .icon-box {
        background: #000 !important;
        border: 2px solid #ff0000 !important;
        border-radius: 50% !important;
        box-shadow: inset 0 0 10px #ff0000;
      }
      /* Animação lenta de rotação no ícone inteiro para simular o olho */
      & .icon-box:hover .power-img {
        animation: sharingan-spin 2s linear infinite;
      }
      @keyframes sharingan-spin { 100% { transform: rotate(360deg); } }
      
      & .power-img { 
        border-radius: 50%; 
        filter: grayscale(100%) brightness(0.8) sepia(1) hue-rotate(-50deg) saturate(5); /* Força a imagem a ficar vermelha */
      }

      /* --- DADOS: AS FASES DO OLHO --- */
      & .die-card {
        background: #050505 !important;
        border: 1px solid #330000 !important;
      }

      /* Normal: Tomoe (Sharingan Base) */
      & .die-icon.normal i { 
        color: #ff0000; 
        text-shadow: 0 0 5px #000;
      }

      /* Hard: Mangekyou (Tsukuyomi - Vermelho e Preto) */
      & .die-icon.hard i { 
        color: #000; 
        text-shadow: 0 0 2px #ff0000, 0 0 5px #ff0000; /* Preto com borda vermelha */
      }

      /* Wiggle: Susanoo / Amaterasu (Roxo e Preto) */
      & .die-icon.wiggle i { 
        color: #000; /* Chama Negra */
        text-shadow: 0 0 5px #800080, 0 0 10px #4b0082; /* Aura Roxa Susanoo */
        animation: flame-burn 0.5s infinite alternate;
      }
      @keyframes flame-burn { 0% { opacity: 0.8; transform: scale(1); } 100% { opacity: 1; transform: scale(1.1); } }

      /* Botão Leque */
      & .btn-buy {
        background: linear-gradient(to bottom, #cc0000 50%, #fff 50%) !important; /* Leque Uchiha: Topo vermelho, baixo branco */
        border: 1px solid #999 !important;
        color: #000 !important;
        font-weight: bold;
      }
      & .btn-buy:hover:not(:disabled) {
        background: #ff0000 !important;
        color: #000 !important;
        box-shadow: 0 0 15px #ff0000;
      }
    `
  },
  // ==========================================================================================
  // TEMA: BLUE (SLIME ARCANO)
  // Estilo: Mago + Slime. Bordas arredondadas, mana fluindo, brilho mágico azul/ciano.
  // ==========================================================================================
  'blue_mage': {
    label: 'GRANDE SÁBIO (BLUE)',
    icon: 'fa-hat-wizard', // Chapéu de Mago
    color: '#00ccff', // Azul Mana
    desc: 'Análise mágica completa. Viscosidade e Poder.',
    css: `
      /* --- CORPO DE SLIME MÁGICO --- */
      & {
        /* Fundo de Mana Líquida */
        background: linear-gradient(180deg, rgba(0, 20, 60, 0.9) 0%, rgba(0, 100, 200, 0.8) 100%) !important;
        border: 3px solid #00ccff !important;
        /* Formato levemente "mole" */
        border-radius: 20px 20px 40px 40px !important; 
        box-shadow: 0 5px 15px rgba(0, 204, 255, 0.3), inset 0 0 20px rgba(0, 204, 255, 0.2);
        overflow: hidden !important;
        position: relative;
      }

      /* Partículas de Magia (Runas subindo) */
      &::before {
        content: ""; position: absolute; inset: 0;
        background-image: radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px);
        background-size: 20px 20px;
        animation: mana-flow 4s linear infinite;
        opacity: 0.5; pointer-events: none;
      }
      @keyframes mana-flow { 0% { background-position: 0 0; } 100% { background-position: 10px -40px; } }

      /* --- ÍCONE: NÚCLEO MÁGICO --- */
      & .icon-box {
        background: #003366 !important;
        border: 2px solid #fff !important;
        border-radius: 50% !important;
        box-shadow: 0 0 15px #00ccff, inset 0 0 10px #00ccff;
      }
      & .power-img { opacity: 0.9; }

      /* --- DADOS: CRISTAIS DE MANA --- */
      & .die-card {
        background: rgba(0, 50, 100, 0.6) !important;
        border: 1px solid #00aaff !important;
        border-radius: 10px !important;
        backdrop-filter: blur(4px);
      }

      /* Pintando os dados com cores mágicas */
      & .die-icon i { 
        filter: drop-shadow(0 0 5px currentColor);
        transition: 0.3s;
      }
      
      /* Normal: Mana Pura (Azul) */
      & .die-icon.normal i { color: #00ccff; animation: float-icon 2s infinite ease-in-out; }
      
      /* Hard: Magia de Ataque (Roxo/Rosa) */
      & .die-icon.hard i { color: #ff00ff; text-shadow: 0 0 5px #aa00aa; }
      
      /* Wiggle: O Lorde Demônio (Dourado/Preto) */
      & .die-icon.wiggle i { color: #ffd700; text-shadow: 0 0 5px #000; }

      @keyframes float-icon { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }

      /* Botão Gelatinoso */
      & .btn-buy {
        background: rgba(0, 204, 255, 0.2) !important;
        border: 1px solid #00ccff !important;
        color: #fff !important;
        border-radius: 15px !important;
      }
      & .btn-buy:hover:not(:disabled) {
        background: #00ccff !important;
        color: #002244 !important;
        box-shadow: 0 0 15px #00ccff;
      }
    `
  },

  // ==========================================================================================
  // TEMA: BAD (HEAVY METAL HERO)
  // Estilo: Industrial, Metal Escuro, Textura de Amplificador, Vermelho Agressivo.
  // ==========================================================================================
  'bad_metal': {
    label: 'BADASS METAL',
    icon: 'fa-hand-rock', // Mão Cornuta 🤘
    color: '#b0c4de', // Prata Metálico
    desc: 'Som alto, metal pesado e impacto bruto.',
    css: `
      /* --- CAIXA DE AMPLIFICADOR --- */
      & {
        background-color: #111 !important;
        /* Textura de grade de caixa de som */
        background-image: radial-gradient(#222 15%, transparent 16%), radial-gradient(#222 15%, transparent 16%) !important;
        background-size: 10px 10px !important;
        background-position: 0 0, 5px 5px !important;
        
        border: 4px solid #444 !important; /* Moldura de Aço */
        border-bottom: 4px solid #222 !important;
        border-radius: 4px !important;
        /* Cantoneiras Metálicas (via box-shadow hack) */
        box-shadow: 
          inset 2px 2px 0 #888, inset -2px -2px 0 #000,
          0 5px 10px #000;
      }

      /* Título Cromado */
      & .power-name {
        background: linear-gradient(to bottom, #fff 0%, #888 50%, #000 51%, #444 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 900;
        font-family: sans-serif;
        letter-spacing: 1px;
        filter: drop-shadow(0 2px 0 #000);
      }

      /* --- ÍCONE: O FALANTE (SPEAKER) --- */
      & .icon-box {
        background: #000 !important;
        border: 3px solid #888 !important;
        border-radius: 50% !important;
        box-shadow: 0 0 0 2px #000, 0 0 10px #000;
        /* Vibração do Bass */
        animation: speaker-beat 0.5s infinite;
      }
      @keyframes speaker-beat {
        0% { transform: scale(1); }
        10% { transform: scale(1.05); border-color: #fff; }
        20% { transform: scale(1); border-color: #888; }
      }
      
      & .power-img { filter: grayscale(1) contrast(1.5); }

      /* --- DADOS DE AÇO --- */
      & .die-card {
        background: linear-gradient(to bottom, #333, #111) !important;
        border: 1px solid #666 !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.2);
      }

      /* Dados Cromados */
      & .die-icon i { 
        background: linear-gradient(to bottom, #eee 0%, #999 50%, #333 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        filter: drop-shadow(0 2px 0 #000);
        font-size: 2em; /* Maiores */
      }
      
      /* Wiggle: Explosão Vermelha (Solo de Guitarra) */
      & .die-icon.wiggle i {
        background: linear-gradient(to bottom, #ff9900 0%, #ff0000 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: shake 0.2s infinite;
      }
      @keyframes shake { 0% { transform: rotate(0deg); } 25% { transform: rotate(5deg); } 75% { transform: rotate(-5deg); } }

      /* Botão Pedal de Guitarra */
      & .btn-buy {
        background: #333 !important;
        border: 2px solid #000 !important;
        border-top: 2px solid #555 !important;
        color: #ccc !important;
        font-weight: bold;
        text-transform: uppercase;
      }
      & .btn-buy:hover:not(:disabled) {
        background: #800 !important; /* Led Vermelho Ligado */
        color: #fff !important;
        box-shadow: 0 0 10px #f00;
        border-color: #f00 !important;
      }
    `
  },
  // ==========================================================================================
  // TEMA: O OUTRO LADO (YIN YANG / DUALIDADE)
  // Estilo: Branco puro por fora. No upgrade, divide-se: Esquerda Luz, Direita Trevas.
  // ==========================================================================================
  'yin_yang': {
    label: 'EQUILÍBRIO (YIN YANG)',
    icon: 'fa-adjust', // Ícone meio a meio
    color: '#000000', 
    desc: 'A luz projeta sombra. A sombra define a luz.',
    css: `
      /* --- VISUAL EXTERNO (BRANCO PURO) --- */
      & {
        background: #ffffff !important;
        border: 2px solid #000 !important;
        border-radius: 8px !important;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        color: #000 !important;
      }

      /* Textos escuros para fundo branco */
      & .power-name { color: #000; text-transform: uppercase; letter-spacing: 2px; }
      & .xp-badge { background: #000 !important; color: #fff !important; }
      & .dice-count strong { color: #000; }
      & .meta-tag { background: #eee !important; color: #000 !important; border: 1px solid #ccc !important; }

      /* Ícone Giratório P&B */
      & .icon-box {
        background: #fff !important;
        border: 2px solid #000 !important;
        border-radius: 50% !important;
      }
      & .power-img { filter: grayscale(1) contrast(1.5); }

      /* --- O GRADIENTE (DIVISÃO MEIO A MEIO) --- */
      & .upgrade-panel {
        /* Gradiente Duro: Branco até 50%, Preto de 50% em diante */
        background: linear-gradient(90deg, #f0f0f0 50%, #0a0a0a 50%) !important;
        border-top: 2px solid #000 !important;
      }

      /* Ajuste do HUD de XP (Centralizado na divisão) */
      & .xp-hud {
        background: #333 !important;
        border: 2px solid #fff !important;
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
      }
      & .xp-label { color: #ccc !important; }

      /* --- DADOS: LADO DA LUZ vs LADO DA SOMBRA --- */
      
      /* NORMAL (Lado Esquerdo - Luz) */
      & .die-card.normal {
        background: #fff !important;
        border: 1px solid #ddd !important;
        color: #000 !important;
      }
      & .die-card.normal .die-screen { color: #000 !important; text-shadow: none; }
      & .die-card.normal .die-icon i { color: #000 !important; }
      & .die-card.normal .btn-buy { background: #eee !important; color: #000 !important; border: 1px solid #ccc !important; }

      /* HARD (O Centro - Equilíbrio/Cinza) */
      & .die-card.hard {
        background: #444 !important;
        border: 1px solid #000 !important;
      }
      & .die-card.hard .die-icon i { color: #fff !important; }

      /* WIGGLE (Lado Direito - Trevas) */
      & .die-card.wiggle {
        background: #000 !important;
        border: 1px solid #333 !important;
      }
      & .die-card.wiggle .die-screen { color: #fff !important; }
      & .die-card.wiggle .die-icon i { color: #fff !important; text-shadow: 0 0 5px #fff; }
      & .die-card.wiggle .btn-buy { background: #222 !important; color: #fff !important; border: 1px solid #555 !important; }
    `
  },

  // ==========================================================================================
  // TEMA: GRIMÓRIO (YUNO - VENTO & ESTRELAS)
  // Estilo: Verde Esmeralda (Vento) misturado com Azul Noturno e Estrelas.
  // ==========================================================================================
  'grimoire_star': {
    label: 'GRIMÓRIO CELESTIAL',
    icon: 'fa-book-open', // Livro/Grimório
    color: '#00ff88', // Verde Vento Neon
    desc: 'A fusão da magia dos ventos com o brilho das estrelas.',
    css: `
      /* --- ATMOSFERA MÁGICA --- */
      & {
        /* Gradiente Diagonal: Vento (Verde) -> Espaço (Azul Escuro) */
        background: linear-gradient(135deg, #002b11 0%, #001a33 100%) !important;
        border: 2px solid #00ff88 !important; /* Borda Verde Neon */
        border-radius: 4px 15px 4px 15px !important; /* Formato de página dobrada */
        box-shadow: 0 0 15px rgba(0, 255, 136, 0.2);
        position: relative;
        overflow: hidden !important;
      }

      /* Fundo Estrelado (Pattern) */
      &::before {
        content: ""; position: absolute; inset: 0;
        background-image: radial-gradient(white 1px, transparent 1px);
        background-size: 30px 30px;
        opacity: 0.3;
        animation: twinkle 3s infinite alternate;
      }
      @keyframes twinkle { 0% { opacity: 0.2; } 100% { opacity: 0.5; } }

      /* Título Brilhante */
      & .power-name {
        background: linear-gradient(to right, #00ff88, #00ccff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 800;
        text-shadow: 0 0 10px rgba(0,255,136,0.5);
      }

      /* --- ÍCONE: TREVO DE 4 FOLHAS (Estilizado) --- */
      & .icon-box {
        background: #001a00 !important;
        border: 1px solid #ffd700 !important; /* Ouro */
        box-shadow: 0 0 10px #00ff88;
        border-radius: 8px !important;
      }
      & .power-img { opacity: 0.9; }

      /* --- DADOS: ELEMENTOS --- */
      & .die-card {
        background: rgba(0, 20, 10, 0.6) !important;
        border: 1px solid #005522 !important;
        backdrop-filter: blur(2px);
      }

      /* Normal: Vento (Verde) */
      & .die-icon.normal i { 
        color: #00ff88; 
        animation: wind-float 2s ease-in-out infinite; 
        filter: drop-shadow(0 0 5px #00ff88);
      }
      @keyframes wind-float { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(3px) rotate(5deg); } }

      /* Hard: Magia Espiritual (Azul/Ciano) */
      & .die-icon.hard i { 
        color: #00ccff; 
        text-shadow: 0 0 5px #00ccff;
      }

      /* Wiggle: Estrela (Quarteto - Dourado) */
      & .die-icon.wiggle i { 
        color: #ffd700; 
        text-shadow: 0 0 5px #ffd700, 0 0 15px #fff;
        animation: star-pulse 1s infinite alternate;
      }
      @keyframes star-pulse { from { transform: scale(1); } to { transform: scale(1.15); filter: brightness(1.3); } }

      /* Botão Grimório */
      & .btn-buy {
        background: #003311 !important;
        border: 1px solid #00ff88 !important;
        color: #ccffdd !important;
      }
      & .btn-buy:hover:not(:disabled) {
        background: linear-gradient(90deg, #00ff88, #00ccff) !important;
        color: #000 !important;
        box-shadow: 0 0 20px #00ff88;
      }
    `
  },// ==========================================================================================
  // TEMA: HOLLOW (A MALDIÇÃO - DARK SOULS)
  // Design: O ícone é um Eclipse (Darksign), chuva de cinzas, cores de brasa e escuridão.
  // ==========================================================================================
  'hollow_curse': {
    label: 'ECLIPSE ETERNO',
    icon: 'fa-skull', 
    color: '#ff5500', // Laranja Brasa
    desc: 'A marca da maldição pulsa como um eclipse de fogo.',
    css: `
      /* --- AMBIENTE DE CINZAS --- */
      & {
        background-color: #050505 !important;
        /* Gradiente escuro */
        background: linear-gradient(180deg, #1a0a00 0%, #000 100%) !important;
        border: 1px solid #333 !important;
        border-top: 2px solid #ff5500 !important;
        box-shadow: 0 5px 20px #000;
        position: relative;
        overflow: hidden !important;
      }

      /* Chuva de Cinzas (Partículas caindo) */
      &::before {
        content: ""; position: absolute; inset: 0;
        background-image: radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px);
        background-size: 10px 10px;
        opacity: 0.5;
        animation: ash-fall 10s linear infinite;
        pointer-events: none;
      }
      @keyframes ash-fall { 
        from { background-position: 0 0; } 
        to { background-position: 20px 100px; } 
      }

      /* Título estilo Dark Fantasy */
      & .power-name {
        font-family: serif !important;
        letter-spacing: 2px;
        color: #ccc;
        text-shadow: 0 0 5px #ff5500;
      }

      /* --- O ECLIPSE (DARKSIGN) --- */
      /* Transformamos o quadrado do ícone em um círculo perfeito com anel de fogo */
      & .icon-box {
        background: #000 !important; /* O centro escuro do eclipse */
        border-radius: 50% !important;
        border: none !important;
        /* O truque do anel de fogo: Box Shadow */
        box-shadow: 
          inset 0 0 0 2px #000, /* Separação interna */
          0 0 0 2px #ff4500, /* O Anel de fogo */
          0 0 15px #ff4500; /* O Brilho */
        animation: eclipse-pulse 3s infinite ease-in-out alternate;
        overflow: visible !important;
      }
      @keyframes eclipse-pulse {
        0% { box-shadow: inset 0 0 0 2px #000, 0 0 0 1px #803300, 0 0 5px #ff4500; }
        100% { box-shadow: inset 0 0 0 3px #000, 0 0 0 3px #ffaa00, 0 0 25px #ff4500; }
      }
      
      /* A imagem dentro fica escura (silhueta) */
      & .power-img { opacity: 0.5; filter: grayscale(1) contrast(5) brightness(0.5); }

      /* --- DADOS: BRASAS APAGADAS --- */
      & .die-card {
        background: #0a0a0a !important;
        border: 1px solid #441100 !important;
      }

      /* Ícones */
      & .die-icon i { filter: drop-shadow(0 0 2px #000); }
      & .die-icon.normal i { color: #888; } /* Cinzas */
      & .die-icon.hard i { color: #ff5500; text-shadow: 0 0 5px #ff2200; } /* Brasa */
      & .die-icon.wiggle i { color: #fff; text-shadow: 0 0 10px #ffaa00; animation: ember-spark 0.2s infinite alternate; } /* Fogo vivo */
      
      @keyframes ember-spark { from { opacity: 0.8; } to { opacity: 1; } }

      /* Botão "You Died" */
      & .btn-buy {
        background: transparent !important;
        border: 1px solid #552200 !important;
        color: #884400 !important;
        font-family: serif !important; text-transform: uppercase; letter-spacing: 1px;
      }
      & .btn-buy:hover:not(:disabled) {
        border-color: #ff5500 !important;
        color: #ffaa00 !important;
        background: linear-gradient(90deg, transparent, #331100, transparent) !important;
        text-shadow: 0 0 10px #ff5500;
      }
    `
  },

  // ==========================================================================================
  // TEMA: GODZILLA (RADIAÇÃO TOTAL)
  // Design: Escamas escuras de Kaiju, brilho azul neon intenso, animação de carga atômica.
  // ==========================================================================================
  'godzilla_radioactive': {
    label: 'REI DOS MONSTROS',
    icon: 'fa-radiation', 
    color: '#00ffff', // Azul Atômico
    desc: 'Níveis críticos de radiação detectados. Carga máxima.',
    css: `
      /* --- PELE DE KAIJU + CARGA ATÔMICA --- */
      & {
        background-color: #00111a !important;
        /* Textura de escamas */
        background-image: 
          radial-gradient(circle at 0% 50%, rgba(0,0,0,0.5) 9px, transparent 10px),
          radial-gradient(circle at 100% 50%, rgba(0,0,0,0.5) 9px, transparent 10px) !important;
        background-size: 20px 20px !important;
        
        border: 2px solid #005577 !important;
        border-radius: 6px !important;
        /* Brilho pulsante externo */
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.2);
        position: relative;
        overflow: hidden !important;
      }

      /* EFEITO: O Bafo Atômico carregando nas costas (De baixo pra cima) */
      &::after {
        content: ""; position: absolute;
        bottom: -100%; left: 0; right: 0; height: 100%;
        background: linear-gradient(to top, rgba(0,255,255,0) 0%, rgba(0,255,255,0.3) 50%, rgba(0,255,255,0) 100%);
        animation: spine-charge 4s infinite ease-in-out;
        pointer-events: none;
        z-index: 0;
      }
      @keyframes spine-charge {
        0% { bottom: -100%; opacity: 0; }
        50% { opacity: 1; }
        100% { bottom: 200%; opacity: 0; }
      }

      /* Título Neon */
      & .power-name {
        color: #fff;
        text-shadow: 0 0 5px #00ffff, 0 0 10px #00aaaa;
        font-weight: 900; z-index: 1; position: relative;
      }

      /* --- ÍCONE: NÚCLEO INSTÁVEL --- */
      & .icon-box {
        background: #002233 !important;
        border: 2px solid #00ffff !important;
        box-shadow: 0 0 20px #00ffff;
        z-index: 1;
      }
      & .power-img { filter: hue-rotate(180deg) brightness(1.5) contrast(1.2); }

      /* --- DADOS: REATORES NUCLEARES --- */
      & .die-card {
        background: rgba(0, 30, 40, 0.8) !important;
        border: 1px solid #0088aa !important;
        backdrop-filter: blur(2px);
        z-index: 1;
      }

      /* Estilização dos Ícones */
      & .die-icon i { transition: 0.3s; }
      
      /* Normal: Azul Escuro */
      & .die-icon.normal i { color: #007799; text-shadow: 0 0 2px #00ffff; }
      
      /* Hard: Azul Neon */
      & .die-icon.hard i { color: #00ffff; text-shadow: 0 0 8px #00ffff; }
      
      /* Wiggle: Meltdown (Branco/Azul Estourado) */
      & .die-icon.wiggle i { 
        color: #ffffff; 
        text-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff;
        animation: atomic-pulse 0.2s infinite alternate;
      }
      @keyframes atomic-pulse { 
        from { transform: scale(1); filter: blur(0px); } 
        to { transform: scale(1.1); filter: blur(1px); } 
      }

      /* Botão de Disparo */
      & .btn-buy {
        background: #003344 !important;
        color: #00ffff !important;
        border: 1px solid #00ffff !important;
        font-family: monospace; font-weight: bold;
      }
      & .btn-buy:hover:not(:disabled) {
        background: #00ffff !important;
        color: #000 !important;
        box-shadow: 0 0 20px #00ffff;
      }
    `
  },
  // ==========================================================================================
  // TEMA: O FUNDADOR (SHINGEKI / A COORDENADA)
  // Estilo: Linhas de luz conectadas (Paths), céu estrelado, gradiente branco/verde espectral.
  // ==========================================================================================
  'founder_coordinate': {
    label: 'A COORDENADA',
    icon: 'fa-project-diagram', // Conexões/Caminhos
    color: '#00ffaa', // Verde Espectral
    desc: 'O ponto onde todos os caminhos se cruzam.',
    css: `
      /* --- O CÉU DOS CAMINHOS --- */
      & {
        background-color: #000 !important;
        /* Fundo: Um céu noturno profundo com um brilho na base */
        background: radial-gradient(circle at 50% 100%, #003322 0%, #000000 80%) !important;
        border: 2px solid #fff !important;
        border-radius: 4px !important;
        box-shadow: 0 0 20px rgba(0, 255, 170, 0.3);
        position: relative;
        overflow: hidden !important;
      }

      /* --- A ÁRVORE DE LUZ (EFEITO COORDENADA) --- */
      /* Cria raios de luz saindo do centro inferior */
      &::before {
        content: ""; position: absolute; inset: -50%;
        background: repeating-conic-gradient(
          from 0deg at 50% 100%,
          transparent 0deg,
          transparent 10deg,
          rgba(255, 255, 255, 0.1) 10.5deg, /* Linha fina branca */
          rgba(0, 255, 170, 0.2) 11deg,    /* Brilho verde */
          transparent 12deg
        );
        animation: paths-rotate 60s linear infinite; /* Gira muito lentamente */
        z-index: 0;
        pointer-events: none;
      }
      @keyframes paths-rotate { from { transform: rotate(-10deg); } to { transform: rotate(10deg); } }

      /* Título Transcendente */
      & .power-name {
        background: linear-gradient(to right, #ffffff, #00ffaa, #ffffff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 300;
        letter-spacing: 3px;
        text-transform: uppercase;
        filter: drop-shadow(0 0 5px rgba(0,255,170,0.8));
      }

      /* --- ÍCONE: O PONTO ZERO --- */
      & .icon-box {
        background: #fff !important;
        border: 1px solid #00ffaa !important;
        border-radius: 50% !important;
        box-shadow: 0 0 30px #fff, 0 0 60px #00ffaa; /* Brilho intenso */
        z-index: 1;
      }
      /* Efeito prisma/mescla de cores no ícone */
      & .power-img { 
        filter: brightness(1.2) contrast(0.8);
        mix-blend-mode: hard-light;
      }

      /* --- DADOS: OS NOVE TITÃS --- */
      & .die-card {
        background: rgba(255, 255, 255, 0.1) !important;
        border: 1px solid rgba(255, 255, 255, 0.3) !important;
        backdrop-filter: blur(2px);
        z-index: 1;
      }

      /* Normal: Relâmpago de Transformação (Amarelo/Verde) */
      & .die-icon.normal i { 
        color: #ffffaa; 
        text-shadow: 0 0 10px #ffcc00;
      }

      /* Hard: Endurecimento (Cristal Azulado/Branco) */
      & .die-icon.hard i { 
        color: #fff; 
        text-shadow: 0 0 5px #00ffff;
        opacity: 0.8;
      }

      /* Wiggle: O Fundador (Espectral) */
      & .die-icon.wiggle i { 
        background: linear-gradient(to bottom, #ff00ff, #00ffff, #00ff00); /* Cores mescladas */
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        filter: drop-shadow(0 0 5px #fff);
        animation: founder-pulse 3s infinite ease-in-out;
      }
      @keyframes founder-pulse { 0% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } 100% { opacity: 0.6; transform: scale(1); } }

      /* Botão Caminhos */
      & .btn-buy {
        background: rgba(0,0,0,0.5) !important;
        border: 1px solid #fff !important;
        color: #fff !important;
        font-weight: 300;
      }
      & .btn-buy:hover:not(:disabled) {
        background: #fff !important;
        color: #000 !important;
        box-shadow: 0 0 20px #fff;
      }
    `
  },

  // ==========================================================================================
  // TEMA: CAVALEIRO (REI ARTHUR / FATE)
  // Estilo: Azul Real, Ouro, Armadura Prateada e Núcleo de Dragão.
  // ==========================================================================================
  'knight_king': {
    label: 'REI DOS CAVALEIROS',
    icon: 'fa-crown',
    color: '#ffd700', // Ouro
    desc: 'A espada prometida da vitória.',
    css: `
      /* --- ARMADURA REAL --- */
      & {
        background-color: #002266 !important; /* Azul Real (Roupa da Saber) */
        border: 2px solid #c0c0c0 !important; /* Prata */
        border-bottom: 4px solid #ffd700 !important; /* Base Dourada */
        border-radius: 4px 4px 15px 15px !important;
        box-shadow: 0 5px 15px rgba(0,0,0,0.5);
        /* Textura sutil de tecido real */
        background-image: linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.05) 75%, transparent 75%, transparent) !important;
        background-size: 20px 20px !important;
      }

      /* Partículas de Mana Dourada (Excalibur) */
      &::after {
        content: ""; position: absolute; inset: 0;
        background-image: radial-gradient(#ffd700 1px, transparent 1px);
        background-size: 15px 15px;
        opacity: 0.0;
        animation: mana-sparkles 2s infinite;
        pointer-events: none;
      }
      @keyframes mana-sparkles { 
        0% { opacity: 0; transform: translateY(0); } 
        50% { opacity: 0.4; } 
        100% { opacity: 0; transform: translateY(-20px); } 
      }

      /* Título Majestoso */
      & .power-name {
        font-family: serif;
        font-weight: bold;
        color: #fff;
        text-shadow: 0 2px 0 #000, 0 0 10px #ffd700;
        letter-spacing: 1px;
      }

      /* --- ÍCONE: COROA / ESPADA --- */
      & .icon-box {
        background: linear-gradient(135deg, #c0c0c0, #fff) !important; /* Prata polida */
        border: 2px solid #ffd700 !important;
        border-radius: 4px !important;
        box-shadow: 0 0 10px #ffd700;
        transform: rotate(45deg); /* Losango Nobre */
        width: 40px !important; height: 40px !important;
        margin: 5px 15px 5px 5px !important;
        overflow: hidden !important;
      }
      & .power-img { transform: rotate(-45deg) scale(1.3); }

      /* --- DADOS: LINHAGEM DO DRAGÃO --- */
      & .die-card {
        background: linear-gradient(to bottom, #eee, #ccc) !important; /* Aço */
        border: 1px solid #fff !important;
        color: #000 !important;
        box-shadow: inset 0 0 5px rgba(0,0,0,0.5);
      }
      
      /* Ajuste de cor do texto dos dados para fundo claro */
      & .die-screen { color: #333 !important; text-shadow: 0 1px 0 #fff !important; }

      /* Normal: Aço (Espada) */
      & .die-icon.normal i { color: #444; filter: drop-shadow(0 1px 0 #fff); }

      /* Hard: Ouro (Coroa/Avalon) */
      & .die-icon.hard i { color: #d4af37; filter: drop-shadow(0 0 2px #ffaa00); }

      /* Wiggle: NÚCLEO DO DRAGÃO (O Poder Oculto) */
      /* O dado Wiggle quebra a armadura e mostra o coração vermelho */
      & .die-card.wiggle {
        background: #330000 !important;
        border: 1px solid #ff0000 !important;
      }
      & .die-card.wiggle .die-screen { color: #ffcccc !important; text-shadow: 0 0 5px #f00 !important; }
      & .die-icon.wiggle i { 
        color: #ff0000; 
        text-shadow: 0 0 10px #ff0000;
        animation: dragon-heartbeat 1s infinite;
      }
      @keyframes dragon-heartbeat { 0% { transform: scale(1); } 15% { transform: scale(1.2); } 30% { transform: scale(1); } }

      /* Botão Nobre */
      & .btn-buy {
        background: #003388 !important;
        border: 1px solid #ffd700 !important;
        color: #ffd700 !important;
        text-transform: uppercase;
        font-family: serif;
      }
      & .btn-buy:hover:not(:disabled) {
        background: #ffd700 !important;
        color: #002266 !important;
        box-shadow: 0 0 15px #ffd700;
      }
    `
  },
  // ==========================================================================================
  // TEMA: CAVALEIRO ARCANO (SIEGHART - IMMORTAL)
  // Estilo: Roxo Profundo, Energia Escura, Lâminas, Aura de "Rage".
  // ==========================================================================================
  'arcane_knight': {
    label: 'O IMORTAL',
    icon: 'fa-khanda', // Espada Ancestral
    color: '#9400d3', // Roxo Escuro
    desc: 'A fúria de um guerreiro que enganou a morte.',
    css: `
      /* --- ARMADURA ESCURA --- */
      & {
        background: linear-gradient(180deg, #1a001a 0%, #000 100%) !important;
        border: 2px solid #550055 !important;
        border-bottom: 4px solid #9400d3 !important; /* Base Roxa */
        border-radius: 4px !important;
        /* Aura de Energia Escura (Rage Mode) */
        box-shadow: 0 0 15px rgba(148, 0, 211, 0.4), inset 0 0 30px rgba(0,0,0,0.8);
        position: relative;
        overflow: hidden !important;
      }

      /* Névoa de Energia (Fundo) */
      &::before {
        content: ""; position: absolute; inset: 0;
        background-image: radial-gradient(circle, rgba(148,0,211,0.2) 10%, transparent 10%);
        background-size: 20px 20px;
        filter: blur(2px);
        animation: dark-mist 10s linear infinite;
        opacity: 0.5; pointer-events: none;
      }
      @keyframes dark-mist { 0% { transform: translateY(0) scale(1); } 50% { transform: translateY(-20px) scale(1.1); } 100% { transform: translateY(0) scale(1); } }

      /* Título Lendário */
      & .power-name {
        color: #e0b0ff; /* Lilás Claro */
        font-family: serif;
        font-weight: bold;
        text-shadow: 0 0 5px #9400d3;
        letter-spacing: 1px;
      }

      /* --- ÍCONE: LÂMINA ETERNA --- */
      & .icon-box {
        background: #2a002a !important;
        border: 2px solid #9400d3 !important;
        border-radius: 4px !important;
        box-shadow: 0 0 15px #9400d3;
        transform: skewX(-10deg); /* Inclinação agressiva */
      }
      & .power-img { filter: contrast(1.2) sepia(1) hue-rotate(240deg) saturate(2); }

      /* --- DADOS: ARSENAL DO GLADIADOR --- */
      & .die-card {
        background: rgba(30, 0, 30, 0.9) !important;
        border: 1px solid #550055 !important;
      }

      /* Normal: Corte de Espada */
      & .die-icon.normal i { 
        color: #ccc; 
        filter: drop-shadow(2px 2px 0 #000);
        transform: rotate(-45deg);
      }

      /* Hard: Energia Arcana (Roxo) */
      & .die-icon.hard i { 
        color: #9400d3; 
        text-shadow: 0 0 8px #9400d3;
      }

      /* Wiggle: O Avatar (Poder Total) */
      & .die-icon.wiggle i { 
        color: #fff; 
        text-shadow: 0 0 5px #9400d3, 0 0 15px #ff00ff;
        animation: rage-pulse 0.2s infinite alternate;
      }
      @keyframes rage-pulse { from { opacity: 0.8; transform: scale(1); } to { opacity: 1; transform: scale(1.1); } }

      /* Botão Soluna */
      & .btn-buy {
        background: #2a002a !important;
        border: 1px solid #9400d3 !important;
        color: #e0b0ff !important;
        font-weight: bold;
      }
      & .btn-buy:hover:not(:disabled) {
        background: #9400d3 !important;
        color: #fff !important;
        box-shadow: 0 0 20px #9400d3;
      }
    `
  },

  // ==========================================================================================
  // TEMA: IRMÃOS DE PUNHO (RED VS PURPLE CLASH)
  // Estilo: Lado esquerdo Vermelho, Direito Roxo. No centro, um flash de impacto.
  // ==========================================================================================
  'fist_clash': {
    label: 'IRMÃOS DE PUNHO',
    icon: 'fa-handshake', // Aperto de mão / Choque
    color: '#ff0055', // Cor Híbrida
    desc: 'O impacto de duas forças inparáveis.',
    css: `
      /* --- O CAMPO DE BATALHA DIVIDIDO --- */
      & {
        /* Gradiente Vermelho -> Roxo */
        background: linear-gradient(90deg, #330000 0%, #220000 45%, #220022 55%, #1a0033 100%) !important;
        border: 2px solid #fff !important;
        border-left: 4px solid #ff0000 !important;
        border-right: 4px solid #aa00ff !important;
        border-radius: 8px !important;
        box-shadow: 0 5px 15px rgba(0,0,0,0.5);
        position: relative;
        overflow: hidden !important;
      }

      /* --- O CHOQUE (FLASH CENTRAL) --- */
      /* Uma linha de luz pulsante bem no meio do card */
      &::after {
        content: ""; position: absolute;
        top: 0; bottom: 0; left: 50%; width: 4px;
        background: #fff;
        box-shadow: 0 0 10px #fff, 0 0 20px #ff0000, 0 0 20px #aa00ff;
        transform: translateX(-50%);
        animation: clash-flash 0.1s infinite alternate;
        opacity: 0.8;
        z-index: 0;
        pointer-events: none;
      }
      @keyframes clash-flash { from { opacity: 0.5; height: 90%; top: 5%; } to { opacity: 1; height: 100%; top: 0; width: 6px; } }

      /* Título dividido (Visualmente) */
      & .power-name {
        background: linear-gradient(to right, #ff4444, #fff, #dd88ff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 900;
        font-style: italic;
        z-index: 1;
      }

      /* --- ÍCONE: O IMPACTO --- */
      & .icon-box {
        background: linear-gradient(135deg, #550000, #330055) !important;
        border: 2px solid #fff !important;
        box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
        z-index: 1;
      }
      & .power-img { mix-blend-mode: overlay; opacity: 1; }

      /* --- DADOS: LADOS OPOSTOS --- */
      & .dice-matrix { gap: 15px; position: relative; z-index: 1; }

      /* NORMAL (Lado Vermelho - Punho 1) */
      & .die-card.normal {
        background: linear-gradient(to right, #330000, #111) !important;
        border: 1px solid #ff0000 !important;
      }
      & .die-icon.normal i { color: #ff0000; filter: drop-shadow(0 0 5px #ff0000); }

      /* HARD (O Centro - A Explosão) */
      /* O dado do meio sofre com o choque das cores */
      & .die-card.hard {
        background: #000 !important;
        border: 2px solid #fff !important;
        box-shadow: 0 0 10px #fff;
      }
      & .die-icon.hard i { 
        color: #fff; 
        animation: shake-impact 0.1s infinite;
      }
      @keyframes shake-impact { 0% { transform: translate(0,0); } 100% { transform: translate(1px, -1px); } }

      /* WIGGLE (Lado Roxo - Punho 2) */
      & .die-card.wiggle {
        background: linear-gradient(to left, #1a0033, #111) !important;
        border: 1px solid #aa00ff !important;
      }
      & .die-icon.wiggle i { color: #aa00ff; filter: drop-shadow(0 0 5px #aa00ff); }

      /* Botão Híbrido */
      & .btn-buy {
        background: rgba(0,0,0,0.8) !important;
        border: 1px solid #fff !important;
        color: #fff !important;
      }
      & .btn-buy:hover:not(:disabled) {
        background: #fff !important;
        color: #000 !important;
        box-shadow: 0 0 15px #fff;
      }
    `
  },
  // ==========================================================================================
  // TEMA: FORÇA BRUTA (PRIMITIVO / CAVERNA)
  // Estilo: Pedra lascada, formato irregular (sem linhas retas), tons de terra e pele.
  // ==========================================================================================
  'brute_force': {
    label: 'ERA DAS PEDRAS',
    icon: 'fa-fist-raised', // Punho
    color: '#8b4513', // Marrom Terra
    desc: 'Sem técnica. Apenas força esmagadora.',
    css: `
      /* --- ESTILO PEDRA LASCADA --- */
      & {
        background: #3e3e3e !important;
        /* Textura de Pedra */
        background-image: radial-gradient(circle at 50% 50%, #4a4a4a 10%, transparent 10%), radial-gradient(circle at 20% 80%, #2a2a2a 5%, transparent 5%) !important;
        background-size: 30px 30px !important;
        
        border: 4px solid #5a5a5a !important;
        /* Formato Irregular (Orgânico) */
        border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px !important;
        box-shadow: 5px 5px 0 #1a1a1a;
        font-family: "Impact", "Arial Black", sans-serif !important;
      }

      /* Título Pesado */
      & .power-name {
        color: #d2b48c; /* Tan/Couro */
        text-transform: uppercase;
        text-shadow: 2px 2px 0 #000;
        letter-spacing: 1px;
        transform: rotate(-1deg);
      }

      /* --- ÍCONE: PINTURA RUPESTRE --- */
      & .icon-box {
        background: #8b4513 !important; /* Cor de barro */
        border: 3px solid #000 !important;
        border-radius: 30% 70% 70% 30% / 30% 30% 70% 70% !important; /* Forma de batata/pedra */
        box-shadow: inset 0 0 10px #000;
      }
      & .power-img { filter: sepia(1) contrast(1.5) brightness(0.8); }

      /* --- DADOS: PEDREGULHOS --- */
      & .die-card {
        background: #555 !important;
        border: none !important;
        border-radius: 5px 20px 10px 25px !important; /* Pedras tortas */
        box-shadow: inset -2px -2px 5px rgba(0,0,0,0.5);
      }

      /* Animação de Impacto (Treme Treme) */
      & .die-icon i { 
        color: #d2b48c; 
        text-shadow: 1px 1px 0 #000;
        animation: rumble 0.2s infinite alternate;
      }
      /* O D20 (Wiggle) treme mais forte */
      & .die-icon.wiggle i { animation: rumble-hard 0.1s infinite; color: #ff4500; }

      @keyframes rumble { 0% { transform: rotate(0deg); } 100% { transform: rotate(2deg); } }
      @keyframes rumble-hard { 0% { transform: translate(0,0); } 25% { transform: translate(1px,1px); } 50% { transform: translate(-1px, -1px); } 75% { transform: translate(-1px, 1px); } }

      /* Botão Tacape */
      & .btn-buy {
        background: #8b0000 !important; /* Sangue seco */
        color: #fff !important;
        border: 2px solid #000 !important;
        border-radius: 10px !important;
        font-family: "Impact", sans-serif;
      }
      & .btn-buy:hover:not(:disabled) {
        transform: scale(1.05);
        background: #ff4500 !important;
      }
    `
  },

  // ==========================================================================================
  // TEMA: IMPERATRIZ (TECH ARMOR / HUD)
  // Estilo: Vermelho Neon, Grid Tecnológico, Mira (Crosshair), Scanlines.
  // ==========================================================================================
  'empress_tech': {
    label: 'PROTOCOLO IMPERATRIZ',
    icon: 'fa-crosshairs', // Mira
    color: '#ff003c', // Vermelho Cyber
    desc: 'Sistemas de mira online. Armadura ativada.',
    css: `
      /* --- ARMADURA HIGH-TECH --- */
      & {
        background-color: #050505 !important;
        /* Grid Vermelho Fino no fundo */
        background-image: 
          linear-gradient(rgba(255, 0, 60, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 0, 60, 0.1) 1px, transparent 1px) !important;
        background-size: 20px 20px !important;

        border: 1px solid #ff003c !important;
        border-left: 5px solid #ff003c !important;
        /* CORTAR CANTOS (Clip-path) - Estilo Sci-Fi */
        clip-path: polygon(
          10px 0, 100% 0, 
          100% calc(100% - 10px), calc(100% - 10px) 100%, 
          0 100%, 0 10px
        );
        box-shadow: 0 0 10px rgba(255, 0, 60, 0.2);
        position: relative;
      }

      /* LINHA DE SCANNER (Passando pelo card) */
      &::after {
        content: ""; position: absolute; top: 0; left: 0; width: 100%; height: 2px;
        background: #ff003c;
        box-shadow: 0 0 10px #ff003c;
        animation: hud-scan 4s linear infinite;
        opacity: 0.5; pointer-events: none;
      }
      @keyframes hud-scan { 0% { top: 0; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }

      /* Título Digital */
      & .power-name {
        font-family: monospace;
        color: #ff003c;
        text-transform: uppercase;
        letter-spacing: 2px;
        text-shadow: 0 0 5px rgba(255, 0, 60, 0.8);
      }

      /* --- ÍCONE: MIRA DE PRECISÃO --- */
      & .icon-box {
        background: rgba(255, 0, 60, 0.1) !important;
        border: 1px solid #ff003c !important;
        position: relative;
      }
      /* Desenha uma mira (+) sobre a imagem */
      & .icon-box::before {
        content: "+"; 
        position: absolute; inset: 0; 
        display: flex; align-items: center; justify-content: center;
        color: rgba(255, 0, 60, 0.8); font-size: 2em; font-weight: 100;
        z-index: 2; pointer-events: none;
      }
      /* Animação de "Lock On" (Mira girando) */
      & .icon-box::after {
        content: ""; position: absolute; inset: -5px;
        border: 1px dashed #ff003c; border-radius: 50%;
        animation: lock-on 4s linear infinite;
      }
      @keyframes lock-on { 100% { transform: rotate(360deg); } }
      
      & .power-img { filter: grayscale(1) sepia(1) hue-rotate(-50deg) saturate(3); opacity: 0.6; }

      /* --- DADOS: MÓDULOS DE SISTEMA --- */
      & .die-card {
        background: rgba(0, 0, 0, 0.8) !important;
        border: 1px solid #550011 !important;
        border-radius: 0 !important; /* Quadrado tecnológico */
      }

      /* Ícones Digitais */
      & .die-icon i { transition: 0.2s; }

      /* Normal: Standby */
      & .die-icon.normal i { color: #550011; }
      
      /* Hard: Active */
      & .die-icon.hard i { color: #ff003c; text-shadow: 0 0 5px #ff003c; }

      /* Wiggle: TERMINATOR MODE (Pisca Alerta Vermelho/Branco) */
      & .die-icon.wiggle i { 
        color: #fff; 
        animation: terminator-flash 0.5s infinite steps(2);
      }
      @keyframes terminator-flash { 
        0% { color: #fff; text-shadow: 0 0 10px #fff; transform: scale(1); } 
        50% { color: #ff0000; text-shadow: 0 0 10px #ff0000; transform: scale(1.1); } 
      }

      /* Botão HUD */
      & .btn-buy {
        background: transparent !important;
        border: 1px solid #ff003c !important;
        color: #ff003c !important;
        font-family: monospace; letter-spacing: 1px;
      }
      & .btn-buy:hover:not(:disabled) {
        background: #ff003c !important;
        color: #000 !important;
        box-shadow: 0 0 15px #ff003c;
      }
    `
  },
  // ==========================================================================================
  // TEMA: DEVORADOR DE MENTES (ILLITHID / PSIONIC)
  // Estilo: Roxo Profundo, Pulsos Psíquicos, Textura Orgânica/Alien, Distorção Mental.
  // ==========================================================================================
  'mind_flayer': {
    label: 'MENTE DA COLMEIA',
    icon: 'fa-brain', // Cérebro
    color: '#9b30ff', // Roxo Psíquico Neon
    desc: 'Sua vontade não é sua. Obedeça.',
    css: `
      /* --- ONDA PSÍQUICA --- */
      & {
        background-color: #1a0033 !important;
        /* Textura orgânica/cerebral */
        background-image: radial-gradient(circle at 50% 50%, #2a0044 20%, transparent 40%), radial-gradient(circle at 0% 0%, #2a0044 10%, transparent 30%) !important;
        background-size: 40px 40px !important;
        
        border: 2px solid #9b30ff !important;
        border-radius: 8px !important;
        box-shadow: 0 0 15px rgba(155, 48, 255, 0.3);
        /* Distorção leve no card inteiro (Efeito Mental) */
        animation: mind-warp 6s infinite ease-in-out;
      }
      @keyframes mind-warp {
        0% { transform: scale(1); filter: hue-rotate(0deg); }
        50% { transform: scale(1.01); filter: hue-rotate(10deg); }
        100% { transform: scale(1); filter: hue-rotate(0deg); }
      }

      /* Título Alienígena */
      & .power-name {
        color: #d896ff;
        text-shadow: 0 0 5px #9b30ff;
        font-family: sans-serif;
        letter-spacing: 2px;
      }

      /* --- ÍCONE: O CÉREBRO PULSANTE --- */
      & .icon-box {
        background: #110022 !important;
        border: 1px solid #9b30ff !important;
        border-radius: 50% !important;
        box-shadow: inset 0 0 20px #9b30ff;
        animation: brain-pulse 2s infinite;
      }
      @keyframes brain-pulse {
        0% { box-shadow: 0 0 5px #9b30ff; }
        50% { box-shadow: 0 0 25px #9b30ff, 0 0 50px #9b30ff; }
        100% { box-shadow: 0 0 5px #9b30ff; }
      }
      & .power-img { opacity: 0.8; mix-blend-mode: lighten; filter: hue-rotate(260deg) contrast(1.5); }

      /* --- DADOS: ESFERAS PSIÔNICAS --- */
      & .die-card {
        background: rgba(40, 0, 60, 0.8) !important;
        border: 1px solid #5500aa !important;
        border-radius: 50% 50% 10px 10px !important; /* Formato alien */
      }

      /* Ícones Vibrantes */
      & .die-icon i { 
        color: #d896ff;
        text-shadow: 0 0 5px #9b30ff;
        animation: telepathy-shake 0.1s infinite paused; /* Só ativa no hover/interação se quiser */
      }
      
      /* Wiggle: O Controle Mental (Vibrando constante) */
      & .die-icon.wiggle i { 
        color: #fff;
        text-shadow: 0 0 10px #ff00ff;
        animation: telepathy-shake 0.2s infinite;
      }
      @keyframes telepathy-shake {
        0% { transform: translate(1px, 1px); }
        25% { transform: translate(-1px, -2px); }
        50% { transform: translate(-3px, 0px); }
        75% { transform: translate(3px, 2px); }
        100% { transform: translate(1px, -1px); }
      }

      /* Botão Dominação */
      & .btn-buy {
        background: #2a0044 !important;
        border: 1px solid #9b30ff !important;
        color: #d896ff !important;
      }
      & .btn-buy:hover:not(:disabled) {
        background: #9b30ff !important;
        color: #fff !important;
        box-shadow: 0 0 20px #9b30ff;
      }
    `
  },

  // ==========================================================================================
  // TEMA: REINO ESPIRITUAL (SAKURA GHOST)
  // Estilo: Rosa Pálido, Transparência, Pétalas Caindo, Fantasmagórico.
  // ==========================================================================================
  'spirit_sakura': {
    label: 'CEREJEIRA ESPIRITUAL',
    icon: 'fa-ghost',
    color: '#ffb7c5', // Rosa Sakura
    desc: 'Espíritos dançam entre as pétalas caindo.',
    css: `
      /* --- O MUNDO ETÉREO --- */
      & {
        /* Fundo semi-transparente rosado */
        background: linear-gradient(180deg, rgba(50, 0, 20, 0.9) 0%, rgba(20, 0, 10, 0.95) 100%) !important;
        border: 1px solid #ffb7c5 !important;
        border-top: 4px solid #ff88aa !important;
        border-radius: 12px !important;
        box-shadow: 0 0 15px rgba(255, 183, 197, 0.3);
        position: relative;
        overflow: hidden !important;
        backdrop-filter: blur(5px); /* Efeito fantasma */
      }

      /* CHUVA DE PÉTALAS (SAKURA) */
      &::before {
        content: ""; position: absolute; top: -100%; left: 0; right: 0; bottom: -100%;
        /* Simula pétalas com gradientes radiais pequenos */
        background-image: 
          radial-gradient(#ffb7c5 2px, transparent 3px),
          radial-gradient(#ff88aa 2px, transparent 3px),
          radial-gradient(#fff 1px, transparent 2px);
        background-size: 50px 50px, 80px 80px, 30px 30px;
        background-position: 0 0, 20px 40px, 10px 10px;
        animation: sakura-fall 10s linear infinite;
        opacity: 0.6; pointer-events: none;
      }
      @keyframes sakura-fall { 
        0% { transform: translateY(0) rotate(0deg); } 
        100% { transform: translateY(50%) rotate(20deg); } 
      }

      /* Título Suave */
      & .power-name {
        color: #ffdae0;
        text-shadow: 0 0 5px #ff88aa;
        font-family: serif; font-style: italic;
      }

      /* --- ÍCONE: FANTASMA FLUTUANTE --- */
      & .icon-box {
        background: rgba(255, 183, 197, 0.1) !important;
        border: 1px solid #ffb7c5 !important;
        border-radius: 50% !important;
        box-shadow: 0 0 10px rgba(255, 183, 197, 0.5);
        animation: ghost-float 3s ease-in-out infinite;
      }
      @keyframes ghost-float {
        0%, 100% { transform: translateY(0); opacity: 1; }
        50% { transform: translateY(-5px); opacity: 0.7; }
      }
      & .power-img { opacity: 0.7; filter: sepia(1) hue-rotate(300deg) saturate(0.5); }

      /* --- DADOS: ALMAS PERDIDAS --- */
      & .die-card {
        background: rgba(255, 255, 255, 0.05) !important;
        border: 1px solid rgba(255, 183, 197, 0.3) !important;
        border-radius: 8px !important;
      }

      /* Ícones Etéreos */
      & .die-icon i { color: #ffb7c5; filter: blur(0.5px); transition: 0.5s; }
      & .die-card:hover .die-icon i { filter: blur(0px); text-shadow: 0 0 8px #ffb7c5; }

      /* Wiggle: A Flor (Destaque) */
      & .die-icon.wiggle i { 
        color: #fff; 
        text-shadow: 0 0 5px #ff88aa;
        animation: pulse-soul 2s infinite;
      }
      @keyframes pulse-soul { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }

      /* Botão Espiritual */
      & .btn-buy {
        background: transparent !important;
        border: 1px solid #ffb7c5 !important;
        color: #ffb7c5 !important;
        font-family: serif;
      }
      & .btn-buy:hover:not(:disabled) {
        background: rgba(255, 183, 197, 0.2) !important;
        color: #fff !important;
        box-shadow: 0 0 15px #ffb7c5;
      }
    `
  },

  'princess_elemental': {
    label: 'PRINCESA ELEMENTAL',
    icon: 'fa-crown',
    color: '#00bfff', // Azul Real
    desc: 'Água, Fogo e Trovão curvam-se perante a coroa.',
    css: `
      /* --- O PALÁCIO DE CRISTAL --- */
      & {
        /* Fundo Azul Real Profundo com gradiente elegante */
        background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%) !important;
        border: 2px solid #ffd700 !important; /* Borda Dourada (Coroa) */
        border-radius: 15px !important;
        box-shadow: 0 0 20px rgba(0, 191, 255, 0.4), inset 0 0 20px rgba(0,0,0,0.5);
        position: relative;
        overflow: hidden !important;
      }

      /* BRILHO MÁGICO DE FUNDO */
      &::before {
        content: ""; position: absolute; inset: 0;
        background: radial-gradient(circle at 50% 0%, rgba(255, 215, 0, 0.15), transparent 70%);
        pointer-events: none;
        animation: royal-glow 5s ease-in-out infinite alternate;
      }
      @keyframes royal-glow { 0% { opacity: 0.5; } 100% { opacity: 1; } }

      /* TÍTULO REAL */
      & .power-name {
        color: #e0f7fa;
        text-shadow: 0 0 10px #00bfff;
        font-family: 'Cinzel', serif; /* Fonte elegante se disponível */
        letter-spacing: 1px;
      }

      /* --- ÍCONE DA COROA (PRINCIPAL) --- */
      & .icon-box {
        background: linear-gradient(45deg, #1a2a6c, #b21f1f, #fdbb2d) !important; /* Um toque sutil multicolorido escuro */
        background-size: 200% 200%;
        animation: gradient-spin 5s ease infinite !important;
        border: 2px solid #ffd700 !important;
        border-radius: 50% 50% 0 50% !important; /* Formato de gota estilizada */
        box-shadow: 0 0 15px #ffd700;
      }
      & .icon-box i { color: #fff !important; filter: drop-shadow(0 0 5px #ffd700); }
      
      @keyframes gradient-spin { 
        0% { background-position: 0% 50%; } 
        50% { background-position: 100% 50%; } 
        100% { background-position: 0% 50%; } 
      }

      /* =========================================
         ELEMENTOS DOS DADOS (A MÁGICA ACONTECE AQUI)
         ========================================= */

      /* 1. DADO NORMAL -> ÁGUA (Fluido e Calmo) */
      & .die-card.normal {
        border: 1px solid #00ffff !important;
        background: rgba(0, 255, 255, 0.05) !important;
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.2) inset;
        animation: water-float 3s ease-in-out infinite;
      }
      & .die-card.normal .die-icon i { color: #00ffff; text-shadow: 0 0 8px #00ffff; }
      
      @keyframes water-float {
        0%, 100% { transform: translateY(0); border-radius: 6px; }
        50% { transform: translateY(-2px); border-radius: 12px 4px 12px 4px; }
      }

      /* 2. DADO HARD -> FOGO (Intenso e Pulsante) */
      & .die-card.hard {
        border: 1px solid #ff4500 !important;
        background: rgba(255, 69, 0, 0.1) !important;
        box-shadow: 0 0 15px rgba(255, 69, 0, 0.3);
        animation: fire-pulse 0.1s infinite alternate; /* Tremulação rápida */
      }
      & .die-card.hard .die-icon i { color: #ffae42; text-shadow: 0 0 10px #ff0000; }
      
      @keyframes fire-pulse {
        from { box-shadow: 0 0 10px rgba(255, 69, 0, 0.3); opacity: 0.9; }
        to { box-shadow: 0 0 20px rgba(255, 69, 0, 0.6); opacity: 1; }
      }

      /* 3. DADO WIGGLE -> RAIO (Elétrico e Caótico) */
      & .die-card.wiggle {
        border: 1px solid #ffff00 !important;
        background: rgba(255, 255, 0, 0.05) !important;
        border-style: double !important;
      }
      & .die-card.wiggle .die-icon i { 
        color: #fff; 
        text-shadow: 0 0 5px #ffff00, 0 0 10px #ffff00;
        animation: thunder-strike 2s infinite;
      }

      @keyframes thunder-strike {
        0%, 90%, 100% { opacity: 1; transform: scale(1); filter: brightness(1); }
        92% { opacity: 0.5; transform: scale(1.1) rotate(5deg); filter: brightness(2); }
        94% { opacity: 1; transform: scale(1.1) rotate(-5deg); filter: brightness(2); }
        96% { opacity: 0.5; transform: scale(1) rotate(5deg); }
      }

      /* BOTÕES E CONTROLES */
      & .btn-buy {
        background: linear-gradient(90deg, transparent, rgba(0, 191, 255, 0.2), transparent) !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        color: #00bfff !important;
        font-family: serif;
        font-weight: bold;
        transition: 0.3s;
      }
      & .btn-buy:hover:not(:disabled) {
        border-color: #ffd700 !important;
        color: #ffd700 !important;
        background: rgba(255, 215, 0, 0.1) !important;
        letter-spacing: 2px; /* Expande ao passar o mouse */
      }

      /* Barrinhas e Inputs */
      & .input-group .bar { background: #ffd700 !important; }
      & input:focus ~ .bar { box-shadow: 0 0 15px #ffd700; }
    `
  },

  'melodia_acustica': {
    label: 'MELODIA ACÚSTICA',
    icon: 'fa-music',
    color: '#ff8c00', // Laranja Vibrante
    desc: 'Acordes laranjas e amarelos dançam em linhas animadas.',
    css: `
      /* --- O PALCO DO SOM --- */
      & {
        /* Fundo Gradiente Quente e Acolhedor */
        background: linear-gradient(135deg, #2b1b0a 0%, #4a2c0f 50%, #7c4a1e 100%) !important;
        border: 2px solid #ff8c00 !important; /* Borda Laranja (Violão) */
        border-radius: 15px !important;
        box-shadow: 0 0 20px rgba(255, 140, 0, 0.4), inset 0 0 20px rgba(0,0,0,0.5);
        position: relative;
        overflow: hidden !important;
      }

      /* CORDAS VIBRANTES DE FUNDO (Linhas Animadas) */
      &::before {
        content: ""; position: absolute; inset: 0;
        background-image: 
          repeating-linear-gradient(0deg, transparent 0px, transparent 19px, rgba(255, 255, 255, 0.05) 20px),
          repeating-linear-gradient(90deg, transparent 0px, transparent 19px, rgba(255, 255, 255, 0.05) 20px);
        background-size: 100% 20px, 20px 100%; /* Tamanho das células da "pauta" */
        pointer-events: none;
        animation: strings-vibrate 10s linear infinite;
      }
      /* Notas Musicais flutuando suavemente sobre as linhas */
      &::after {
        content: "♪ ♫ ♩ ♬"; /* Símbolos de Música */
        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        color: rgba(255, 215, 0, 0.2); /* Dourado Translúcido */
        font-size: 24px;
        text-align: center;
        white-space: pre; /* Mantém os espaços */
        pointer-events: none;
        animation: floating-notes 15s linear infinite;
        text-shadow: 0 0 5px rgba(255, 140, 0, 0.5);
      }

      @keyframes strings-vibrate { 
        0% { background-position: 0 0, 0 0; }
        100% { background-position: 0 100px, 100px 0; } /* Move as linhas */
      }
      @keyframes floating-notes {
        0% { transform: translateY(100%) rotate(0deg); opacity: 0; }
        20% { opacity: 1; }
        80% { opacity: 1; }
        100% { transform: translateY(-100%) rotate(360deg); opacity: 0; }
      }

      /* TÍTULO DA MÚSICA */
      & .power-name {
        color: #ffd700; /* Dourado */
        text-shadow: 0 0 10px #ff8c00;
        font-family: 'Cinzel', serif;
        letter-spacing: 1px;
      }

      /* --- ÍCONE DANÇANTE (NOTA MUSICAL) --- */
      & .icon-box {
        background: linear-gradient(45deg, #ff8c00, #ffd700, #ffa500) !important; /* Gradiente Laranja/Amarelo */
        background-size: 200% 200%;
        animation: icon-dance 3s ease-in-out infinite alternate, gradient-spin 5s ease infinite !important;
        border: 2px solid #fff !important; /* Borda Branca para destaque */
        border-radius: 50% !important;
        box-shadow: 0 0 15px #ff8c00;
      }
      & .icon-box i { color: #fff !important; filter: drop-shadow(0 0 5px #ff8c00); }
      
      /* Animação de Dança do Ícone */
      @keyframes icon-dance {
        0% { transform: translateY(0) rotate(0deg) scale(1); }
        33% { transform: translateY(-3px) rotate(10deg) scale(1.05); }
        66% { transform: translateY(0) rotate(-5deg) scale(1); }
        100% { transform: translateY(-3px) rotate(5deg) scale(1.05); }
      }
      @keyframes gradient-spin { 
        0% { background-position: 0% 50%; } 
        50% { background-position: 100% 50%; } 
        100% { background-position: 0% 50%; } 
      }

      /* =========================================
         ELEMENTOS DOS DADOS (A ORQUESTRA)
         ========================================= */

      /* 1. DADO NORMAL -> O RITMO (Pulsação Constante) */
      & .die-card.normal {
        border: 1px solid #ffa500 !important; /* Laranja Claro */
        background: rgba(255, 165, 0, 0.05) !important;
        box-shadow: 0 0 10px rgba(255, 165, 0, 0.2) inset;
        animation: rhythm-pulse 2s ease-in-out infinite;
      }
      & .die-card.normal .die-icon i { color: #ffa500; text-shadow: 0 0 8px #ffa500; }
      
      @keyframes rhythm-pulse {
        0%, 100% { transform: scale(1); box-shadow: 0 0 10px rgba(255, 165, 0, 0.2) inset; }
        50% { transform: scale(1.02); box-shadow: 0 0 15px rgba(255, 165, 0, 0.4) inset; }
      }

      /* 2. DADO HARD -> O SOLO (Destaque Brilhante) */
      & .die-card.hard {
        border: 2px solid #ffd700 !important; /* Dourado Forte */
        background: rgba(255, 215, 0, 0.1) !important;
        box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
        animation: solo-shine 3s ease-in-out infinite;
      }
      & .die-card.hard .die-icon i { color: #fff; text-shadow: 0 0 10px #ffd700, 0 0 20px #ff8c00; }
      
      @keyframes solo-shine {
        0%, 100% { filter: brightness(1); border-color: #ffd700; }
        50% { filter: brightness(1.2); border-color: #fff; box-shadow: 0 0 25px rgba(255, 215, 0, 0.5); }
      }

      /* 3. DADO WIGGLE -> O ACORDE FINAL (Vibração Intensa) */
      & .die-card.wiggle {
        border: 1px solid #ff4500 !important; /* Vermelho Alaranjado */
        background: rgba(255, 69, 0, 0.05) !important;
        border-style: dashed !important; /* Borda tracejada como ondas sonoras */
      }
      & .die-card.wiggle .die-icon i { 
        color: #ff4500; 
        text-shadow: 0 0 5px #ff4500;
        animation: chord-vibrate 0.2s infinite; /* Vibração muito rápida */
      }

      @keyframes chord-vibrate {
        0% { transform: translateX(0); }
        25% { transform: translateX(-1px); }
        50% { transform: translateX(0); }
        75% { transform: translateX(1px); }
        100% { transform: translateX(0); }
      }

      /* BOTÕES E CONTROLES */
      & .btn-buy {
        background: linear-gradient(90deg, transparent, rgba(255, 140, 0, 0.2), transparent) !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        color: #ff8c00 !important;
        font-family: serif;
        font-weight: bold;
        transition: 0.3s;
      }
      & .btn-buy:hover:not(:disabled) {
        border-color: #ffd700 !important;
        color: #ffd700 !important;
        background: rgba(255, 140, 0, 0.2) !important;
        letter-spacing: 2px; /* Expande ao passar o mouse */
        box-shadow: 0 0 10px #ff8c00;
      }

      /* Barrinhas e Inputs */
      & .input-group .bar { background: #ff8c00 !important; }
      & input:focus ~ .bar { box-shadow: 0 0 15px #ff8c00; }
    `
  },

  'hakaishin_energy': {
    label: 'DESTRUIÇÃO ABSOLUTA',
    icon: 'fa-skull',
    color: '#8a2be2', // Roxo Violeta Intenso
    desc: 'O poder da destruição. Aura roxa e raios devastadores.',
    css: `
      /* --- O VAZIO DA DESTRUIÇÃO --- */
      & {
        /* Fundo Roxo Escuro Profundo */
        background: linear-gradient(135deg, #1a0b2e 0%, #2e003e 50%, #4b0082 100%) !important;
        border: 2px solid #8a2be2 !important; /* Borda Roxa Brilhante */
        border-radius: 15px !important;
        box-shadow: 0 0 25px rgba(138, 43, 226, 0.6), inset 0 0 30px rgba(0,0,0,0.8);
        position: relative;
        overflow: hidden !important;
      }

      /* AURA DE HAKAI (Partículas de Destruição) */
      &::before {
        content: ""; position: absolute; inset: 0;
        background-image: 
          radial-gradient(circle, #d8bfd8 1px, transparent 1px),
          radial-gradient(circle, #8a2be2 1px, transparent 1px);
        background-size: 20px 20px;
        background-position: 0 0, 10px 10px;
        pointer-events: none;
        opacity: 0.3;
        animation: hakai-particles 2s linear infinite;
      }
      /* Raios Roxos Aleatórios */
      &::after {
        content: ""; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
        background: repeating-linear-gradient(
          45deg,
          transparent 0%,
          transparent 48%,
          rgba(138, 43, 226, 0.1) 50%,
          transparent 52%,
          transparent 100%
        );
        animation: electricity 3s infinite linear;
        pointer-events: none;
        opacity: 0.5;
        mix-blend-mode: screen;
      }

      @keyframes hakai-particles { 
        0% { transform: translateY(0) scale(1); opacity: 0.3; }
        100% { transform: translateY(-20px) scale(0); opacity: 0; }
      }
      @keyframes electricity {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      /* TÍTULO AMEAÇADOR */
      & .power-name {
        color: #e6e6fa; /* Lavanda */
        text-shadow: 0 0 10px #8a2be2, 0 0 20px #4b0082;
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        letter-spacing: 2px;
        text-transform: uppercase;
      }

      /* --- ÍCONE DA DESTRUIÇÃO (ESFERA DE HAKAI) --- */
      & .icon-box {
        background: radial-gradient(circle at 30% 30%, #d8bfd8, #8a2be2, #000) !important;
        border: 2px solid #fff !important;
        border-radius: 50% !important;
        box-shadow: 0 0 20px #8a2be2, 0 0 40px #4b0082;
        animation: sphere-pulse 2s infinite alternate;
      }
      & .icon-box i { 
        color: #fff !important; 
        filter: drop-shadow(0 0 5px #000); 
        animation: icon-shake 0.1s infinite; /* Vibração de instabilidade */
      }
      
      @keyframes sphere-pulse {
        0% { box-shadow: 0 0 20px #8a2be2; transform: scale(1); }
        100% { box-shadow: 0 0 40px #8a2be2, 0 0 60px #4b0082; transform: scale(1.05); }
      }
      @keyframes icon-shake {
        0% { transform: translate(0, 0); }
        25% { transform: translate(1px, 1px); }
        50% { transform: translate(-1px, -1px); }
        75% { transform: translate(-1px, 1px); }
        100% { transform: translate(1px, -1px); }
      }

      /* =========================================
         ELEMENTOS DOS DADOS (ENERGIA DESTRUTIVA)
         ========================================= */

      /* 1. DADO NORMAL -> PRESSÃO (Gravidade Roxa) */
      & .die-card.normal {
        border: 1px solid #9370db !important;
        background: rgba(75, 0, 130, 0.3) !important;
        box-shadow: inset 0 0 15px rgba(0,0,0,0.8);
        animation: pressure-crush 3s infinite ease-in-out;
      }
      & .die-card.normal .die-icon i { color: #9370db; text-shadow: 0 0 5px #9370db; }
      
      @keyframes pressure-crush {
        0%, 100% { border-color: #9370db; }
        50% { border-color: #4b0082; box-shadow: inset 0 0 25px rgba(0,0,0,1); }
      }

      /* 2. DADO HARD -> DESINTEGRAÇÃO (Partículas) */
      & .die-card.hard {
        border: 1px solid #da70d6 !important; /* Orquídea */
        background: rgba(138, 43, 226, 0.1) !important;
        box-shadow: 0 0 10px #da70d6;
        animation: disintegration 0.2s infinite; /* Piscar rápido */
      }
      & .die-card.hard .die-icon i { 
        color: #fff; 
        text-shadow: 0 0 10px #da70d6; 
        opacity: 0.8;
      }
      
      @keyframes disintegration {
        0% { opacity: 1; border-style: solid; }
        50% { opacity: 0.8; border-style: dashed; }
        100% { opacity: 1; border-style: solid; }
      }

      /* 3. DADO WIGGLE -> APAGAR DA EXISTÊNCIA (Flash Devastador) */
      & .die-card.wiggle {
        border: 2px solid #fff !important;
        background: #000 !important; /* Vazio absoluto */
        overflow: hidden;
      }
      & .die-card.wiggle::before {
        content: ""; position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
        transform: skewX(-20deg);
        animation: hakai-flash 2s infinite;
      }
      & .die-card.wiggle .die-icon i { 
        color: #8a2be2; 
        text-shadow: 0 0 5px #fff, 0 0 15px #8a2be2;
        animation: final-erasure 1s infinite alternate;
      }

      @keyframes hakai-flash {
        0% { left: -100%; }
        20% { left: 200%; }
        100% { left: 200%; }
      }
      @keyframes final-erasure {
        from { filter: blur(0px); transform: scale(1); }
        to { filter: blur(2px); transform: scale(1.1); color: #fff; }
      }

      /* BOTÕES E CONTROLES */
      & .btn-buy {
        background: rgba(0, 0, 0, 0.6) !important;
        border: 1px solid #8a2be2 !important;
        color: #da70d6 !important;
        font-family: 'Rajdhani', sans-serif;
        font-weight: 800;
        text-transform: uppercase;
        transition: 0.2s;
      }
      & .btn-buy:hover:not(:disabled) {
        background: #8a2be2 !important;
        color: #fff !important;
        border-color: #fff !important;
        box-shadow: 0 0 20px #8a2be2;
        letter-spacing: 2px;
      }

      /* Barrinhas e Inputs */
      & .input-group .bar { background: #8a2be2 !important; }
      & input:focus ~ .bar { box-shadow: 0 0 15px #8a2be2, 0 0 30px #4b0082; }
    `
  },

  'monkey_king': {
    label: 'O GRANDE SÁBIO',
    icon: 'fa-crown', // Representando a realeza do Rei Macaco
    color: '#FFD700', // Dourado Divino
    desc: 'Nuvens, bastões e a fúria do Rei dos Macacos.',
    css: `
      /* --- A MONTANHA DAS FLORES E FRUTOS --- */
      & {
        /* Fundo Vermelho e Dourado (Cores clássicas do Wukong) */
        background: linear-gradient(135deg, #4a0000 0%, #8b0000 50%, #b22222 100%) !important;
        border: 3px solid #FFD700 !important; /* Ouro */
        border-top: 5px solid #FFD700 !important;
        border-radius: 12px !important;
        box-shadow: 0 0 20px rgba(255, 215, 0, 0.4), inset 0 0 30px rgba(0,0,0,0.6);
        position: relative;
        overflow: hidden !important;
      }

      /* NUVEM VOADORA (KINTO-UN) NO FUNDO */
      &::before {
        content: ""; position: absolute; inset: 0;
        background-image: 
          radial-gradient(circle, rgba(255,255,255,0.1) 20%, transparent 20%),
          radial-gradient(circle, rgba(255,255,255,0.1) 20%, transparent 20%);
        background-position: 0 0, 50px 50px;
        background-size: 100px 100px;
        opacity: 0.4;
        animation: kinto-un-fly 20s linear infinite;
        pointer-events: none;
      }
      /* Pêlos Dourados Flutuando (Partículas) */
      &::after {
        content: ""; position: absolute; inset: 0;
        background-image: radial-gradient(#ffd700 1px, transparent 1px);
        background-size: 30px 30px;
        opacity: 0.3;
        animation: golden-fur 5s linear infinite;
        pointer-events: none;
      }

      @keyframes kinto-un-fly { 
        0% { background-position: 0 0, 50px 50px; } 
        100% { background-position: 100px 0, 150px 50px; } 
      }
      @keyframes golden-fur {
        0% { transform: translateY(0); opacity: 0; }
        50% { opacity: 0.5; }
        100% { transform: translateY(-50px); opacity: 0; }
      }

      /* TÍTULO LENDÁRIO */
      & .power-name {
        color: #FFD700;
        text-shadow: 2px 2px 0px #8b0000;
        font-family: 'Cinzel', serif; /* Fonte épica */
        font-weight: 800;
        letter-spacing: 1px;
        text-transform: uppercase;
      }

      /* --- ÍCONE: A TIARA DA MENTE (GOLDEN FILLET) --- */
      & .icon-box {
        /* O fundo é neutro, o destaque é a borda que simula a tiara */
        background: radial-gradient(circle, #333, #000) !important;
        border: 4px solid #FFD700 !important; /* A TIARA DOURADA */
        border-radius: 50% !important;
        box-shadow: 0 0 15px #FFD700, inset 0 0 10px #FFD700;
        animation: headache-spell 3s infinite ease-in-out; /* Pulsa como se estivesse apertando */
      }
      & .icon-box i { 
        color: #FFD700 !important; 
        text-shadow: 0 0 5px #ff0000;
      }
      
      @keyframes headache-spell {
        0%, 100% { transform: scale(1); border-color: #FFD700; box-shadow: 0 0 15px #FFD700; }
        50% { transform: scale(0.95); border-color: #fff; box-shadow: 0 0 25px #ff4500; } /* Aperta e brilha vermelho */
      }

      /* =========================================
         ELEMENTOS DOS DADOS (ARMAS E PODERES)
         ========================================= */

      /* 1. DADO NORMAL -> NUVEM VOADORA (Kinto-un) */
      & .die-card.normal {
        border: none !important;
        background: rgba(255, 255, 255, 0.8) !important; /* Branca como a nuvem */
        box-shadow: 0 5px 15px rgba(255, 255, 255, 0.4);
        border-radius: 20px !important; /* Arredondado */
        animation: nimbus-float 2s ease-in-out infinite alternate;
      }
      & .die-card.normal .die-header { border-bottom: 1px dashed #ccc; }
      & .die-card.normal .die-icon i { color: #87ceeb; text-shadow: none; } /* Azul céu */
      & .die-card.normal .die-screen { color: #333; text-shadow: none; }
      
      @keyframes nimbus-float {
        from { transform: translateY(2px); }
        to { transform: translateY(-2px); }
      }

      /* 2. DADO HARD -> OLHOS DE FOGO (Huo Yan Jin Jing) */
      & .die-card.hard {
        border: 2px solid #ff4500 !important;
        background: rgba(50, 0, 0, 0.6) !important;
        box-shadow: 0 0 10px #ff4500;
        animation: fiery-gaze 0.2s infinite alternate;
      }
      & .die-card.hard .die-icon i { 
        color: #ffd700; 
        text-shadow: 0 0 10px #ff0000;
        filter: brightness(1.5);
      }
      
      @keyframes fiery-gaze {
        from { box-shadow: 0 0 5px #ff4500; }
        to { box-shadow: 0 0 15px #ff0000; }
      }

      /* 3. DADO WIGGLE -> BASTÃO MÁGICO (Ruyi Jingu Bang) */
      & .die-card.wiggle {
        /* Visual do Bastão: Ouro nas pontas, Vermelho no meio */
        background: linear-gradient(180deg, 
          #FFD700 0%, #FFD700 10%, 
          #8b0000 10%, #8b0000 90%, 
          #FFD700 90%, #FFD700 100%) !important;
        border: 2px solid #FFD700 !important;
        border-radius: 4px !important; /* Reto como um bastão */
        box-shadow: 0 0 15px #FFD700;
      }
      
      & .die-card.wiggle .die-icon i { 
        color: #fff; 
        animation: staff-spin 1.5s infinite linear; /* O ícone gira como o bastão */
        text-shadow: 0 0 5px #000;
      }
      & .die-card.wiggle .die-text { color: #FFD700; text-shadow: 1px 1px 0 #000; }

      @keyframes staff-spin {
        0% { transform: rotate(0deg) scale(1); }
        50% { transform: rotate(180deg) scale(1.2); }
        100% { transform: rotate(360deg) scale(1); }
      }

      /* BOTÕES E CONTROLES */
      & .btn-buy {
        background: linear-gradient(to bottom, #FFD700, #daa520) !important;
        border: 1px solid #8b4513 !important;
        color: #4a0000 !important;
        font-weight: 900;
        text-shadow: 0 1px 0 rgba(255,255,255,0.4);
        box-shadow: 0 2px 5px rgba(0,0,0,0.5);
        transition: 0.2s;
      }
      & .btn-buy:hover:not(:disabled) {
        transform: scale(1.05);
        box-shadow: 0 0 15px #FFD700;
        filter: brightness(1.2);
      }
      & .btn-buy:disabled {
        background: #555 !important;
        color: #888 !important;
        border-color: #333 !important;
      }

      /* Inputs */
      & .input-group input { color: #FFD700; }
      & .input-group .bar { background: #FFD700 !important; height: 3px; }
      & input:focus ~ .bar { box-shadow: 0 0 20px #FFD700; }
    `
  },

  'hellheim_gate': {
    label: 'PORTAS DE HELLHEIM',
    icon: 'fa-dungeon',
    color: '#8b0000', // Vermelho Sangue
    desc: 'Um portal aberto para a dimensão dos mortos.',
    css: `
      /* --- O PORTAL ABERTO --- */
      & {
        /* Fundo que simula o portal e o fogo do inferno */
        background: 
          radial-gradient(ellipse at center, rgba(255, 69, 0, 0.3) 0%, rgba(0, 0, 0, 0.8) 70%),
          linear-gradient(to bottom, #2a0a0a, #000) !important;
        border: 4px solid #4a0a0a !important; /* Borda de ferro forjado */
        border-top: none !important; /* O topo é aberto */
        border-radius: 20px 20px 0 0 !important; /* Arco do portal */
        box-shadow: 
          0 0 30px rgba(255, 0, 0, 0.4), 
          inset 0 0 50px rgba(0,0,0,1),
          inset 0 -10px 20px rgba(255, 69, 0, 0.3);
        position: relative;
        overflow: hidden !important;
      }

      /* ALMAS SAINDO DO PORTAL (Animação de fundo) */
      &::before {
        content: "👻"; /* Usando emoji como placeholder de alma */
        position: absolute; top: 100%; left: 50%;
        font-size: 30px; color: rgba(255, 255, 255, 0.2);
        text-shadow: 0 0 10px #ff0000;
        animation: souls-rise 4s linear infinite;
        pointer-events: none;
      }
      &::after {
        content: "👻";
        position: absolute; top: 100%; left: 30%;
        font-size: 25px; color: rgba(255, 255, 255, 0.15);
        text-shadow: 0 0 10px #ff0000;
        animation: souls-rise 5s linear infinite 1s; /* Atraso */
        pointer-events: none;
      }

      @keyframes souls-rise {
        0% { transform: translate(-50%, 0) scale(0.5); opacity: 0; }
        20% { opacity: 0.6; }
        80% { opacity: 0.6; }
        100% { transform: translate(-50%, -200px) scale(1.5); opacity: 0; }
      }

      /* TÍTULO GÓTICO */
      & .power-name {
        color: #ff4500; /* Laranja Fogo */
        text-shadow: 0 0 10px #8b0000;
        font-family: 'Cinzel', serif;
        font-weight: 900;
        letter-spacing: 2px;
        text-transform: uppercase;
      }

      /* --- ÍCONE: O SELO DO PORTAL --- */
      & .icon-box {
        background: radial-gradient(circle, #4a0a0a, #000) !important;
        border: 3px solid #ff4500 !important;
        box-shadow: 0 0 20px #ff0000, inset 0 0 15px #000;
        animation: gate-pulse 3s infinite alternate;
      }
      & .icon-box i { 
        color: #ff4500 !important; 
        text-shadow: 0 0 10px #ff0000;
        animation: icon-burn 0.5s infinite alternate;
      }
      
      @keyframes gate-pulse {
        from { box-shadow: 0 0 20px #ff0000; }
        to { box-shadow: 0 0 40px #ff4500; }
      }
      @keyframes icon-burn {
        from { filter: brightness(1); }
        to { filter: brightness(1.5) blur(1px); }
      }

      /* =========================================
         ELEMENTOS DOS DADOS (OS CONDENADOS)
         ========================================= */

      /* 1. DADO NORMAL -> FOGO DO INFERNO (Brasas) */
      & .die-card.normal {
        border: 1px solid #ff4500 !important;
        background: rgba(50, 10, 10, 0.6) !important;
        box-shadow: inset 0 0 20px rgba(255, 69, 0, 0.3);
        animation: ember-glow 2s ease-in-out infinite alternate;
      }
      & .die-card.normal .die-icon i { color: #ff4500; text-shadow: 0 0 10px #ff4500; }
      
      @keyframes ember-glow {
        from { background-color: rgba(50, 10, 10, 0.6); }
        to { background-color: rgba(100, 20, 20, 0.8); }
      }

      /* 2. DADO HARD -> ALMAS APRISIONADAS (Frio e Fantasmagórico) */
      & .die-card.hard {
        border: 1px solid #87ceeb !important; /* Azul Gelo */
        background: rgba(0, 0, 50, 0.5) !important;
        box-shadow: 0 0 15px rgba(135, 206, 235, 0.3);
      }
      & .die-card.hard .die-icon i { 
        color: #e0ffff; 
        text-shadow: 0 0 10px #87ceeb;
        animation: soul-shiver 0.1s infinite; /* Tremedeira */
      }
      
      @keyframes soul-shiver {
        0% { transform: translate(0, 0); }
        25% { transform: translate(1px, 0); }
        50% { transform: translate(0, 1px); }
        75% { transform: translate(-1px, 0); }
        100% { transform: translate(0, -1px); }
      }

      /* 3. DADO WIGGLE -> O GUARDIÃO (Correntes e Sangue) */
      & .die-card.wiggle {
        border: 3px solid #8b0000 !important;
        background: rgba(30, 0, 0, 0.9) !important;
        /* Simula correntes nas bordas */
        background-image: repeating-linear-gradient(45deg, transparent 0, transparent 10px, #333 10px, #333 12px) !important;
      }
      & .die-card.wiggle .die-icon i { 
        color: #ff0000; 
        text-shadow: 0 0 10px #ff0000;
        animation: chain-rattle 1s infinite; /* Sacudir */
      }

      @keyframes chain-rattle {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(5deg); }
        75% { transform: rotate(-5deg); }
      }

      /* BOTÕES E CONTROLES */
      & .btn-buy {
        background: rgba(139, 0, 0, 0.5) !important;
        border: 1px solid #ff4500 !important;
        color: #ff4500 !important;
        font-family: 'Cinzel', serif;
        font-weight: 900;
        text-transform: uppercase;
        transition: 0.2s;
      }
      & .btn-buy:hover:not(:disabled) {
        background: #8b0000 !important;
        color: #fff !important;
        box-shadow: 0 0 20px #ff0000;
      }

      /* Barrinhas e Inputs */
      & .input-group .bar { background: #ff4500 !important; }
      & input:focus ~ .bar { box-shadow: 0 0 15px #ff0000; }
    `
  },

  'divine_prism': {
    label: 'PRISMA DIVINO',
    icon: 'fa-sun',
    color: '#FFD700', // Dourado
    desc: 'Um espetáculo de luzes refratadas e divindade.',
    css: `
      /* --- O SALÃO DOS ESPELHOS --- */
      & {
        /* Fundo Branco Perolado com leve toque dourado */
        background: linear-gradient(135deg, #ffffff 0%, #fffce6 50%, #fff5cc 100%) !important;
        border: 2px solid #fff !important;
        /* Borda animada RGB (Arco-íris) */
        box-shadow: 
          0 0 0 2px #fff, /* Borda branca interna */
          0 0 20px rgba(255, 215, 0, 0.5), /* Brilho dourado */
          inset 0 0 50px rgba(255, 255, 255, 0.8);
        border-radius: 12px !important;
        position: relative;
        overflow: hidden !important;
        animation: border-rainbow 5s linear infinite; /* A borda muda de cor */
      }

      @keyframes border-rainbow {
        0% { border-color: #ff0000; box-shadow: 0 0 15px #ff0000, inset 0 0 20px #fff; }
        20% { border-color: #ffff00; box-shadow: 0 0 15px #ffff00, inset 0 0 20px #fff; }
        40% { border-color: #00ff00; box-shadow: 0 0 15px #00ff00, inset 0 0 20px #fff; }
        60% { border-color: #00ffff; box-shadow: 0 0 15px #00ffff, inset 0 0 20px #fff; }
        80% { border-color: #0000ff; box-shadow: 0 0 15px #0000ff, inset 0 0 20px #fff; }
        100% { border-color: #ff00ff; box-shadow: 0 0 15px #ff00ff, inset 0 0 20px #fff; }
      }

      /* RAIOS DE LUZ (GOD RAYS) */
      &::before {
        content: ""; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
        background: conic-gradient(
          from 0deg,
          transparent 0deg,
          rgba(255, 215, 0, 0.1) 20deg,
          transparent 40deg,
          rgba(0, 255, 255, 0.1) 60deg,
          transparent 80deg,
          rgba(255, 0, 255, 0.1) 100deg,
          transparent 120deg
        );
        animation: god-rays-spin 10s linear infinite;
        pointer-events: none;
      }
      
      /* BRILHOS (SPARKLES) */
      &::after {
        content: ""; position: absolute; inset: 0;
        background-image: radial-gradient(white 1px, transparent 1px);
        background-size: 40px 40px;
        opacity: 0.5;
        animation: sparkle-twinkle 2s infinite alternate;
        pointer-events: none;
      }

      @keyframes god-rays-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes sparkle-twinkle { 0% { opacity: 0.3; transform: scale(0.8); } 100% { opacity: 0.8; transform: scale(1.1); } }

      /* TÍTULO LUMINOSO */
      & .power-name {
        background: linear-gradient(90deg, #daa520, #ff4500, #daa520);
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-family: 'Cinzel', serif;
        font-weight: 800;
        animation: shimmer-text 3s linear infinite;
        text-shadow: 0 0 5px rgba(255,215,0,0.3);
      }
      
      @keyframes shimmer-text { to { background-position: 200% center; } }

      /* --- ÍCONE: O SOL PRISMÁTICO --- */
      & .icon-box {
        background: #fff !important;
        border: 2px solid #fff !important;
        border-radius: 50% !important;
        /* Sombra RGB pulsante */
        animation: prism-pulse 2s infinite linear;
      }
      & .icon-box i { 
        background: linear-gradient(45deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        filter: drop-shadow(0 0 2px rgba(0,0,0,0.2));
        animation: icon-rotate-hue 5s infinite linear;
      }
      
      @keyframes prism-pulse {
        0% { box-shadow: 0 0 10px #ff0000, 0 0 20px #ff0000; }
        33% { box-shadow: 0 0 10px #00ff00, 0 0 20px #00ff00; }
        66% { box-shadow: 0 0 10px #0000ff, 0 0 20px #0000ff; }
        100% { box-shadow: 0 0 10px #ff0000, 0 0 20px #ff0000; }
      }

      /* =========================================
         ELEMENTOS DOS DADOS (FORMAS DE LUZ)
         ========================================= */

      /* 1. DADO NORMAL -> LUZ DOURADA (Constante) */
      & .die-card.normal {
        border: 1px solid #ffd700 !important;
        background: linear-gradient(135deg, #fff, #fffacd) !important;
        box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
        animation: gold-breath 3s infinite ease-in-out;
      }
      & .die-card.normal .die-icon i { color: #ffd700; text-shadow: 0 0 5px #ffd700; }
      & .die-card.normal .die-screen { color: #b8860b; }
      
      @keyframes gold-breath {
        0%, 100% { box-shadow: 0 0 10px rgba(255, 215, 0, 0.3); }
        50% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.8); border-color: #ffa500; }
      }

      /* 2. DADO HARD -> REFRAÇÃO (Mudança de Cor) */
      & .die-card.hard {
        border: 2px solid transparent !important;
        background: #fff !important;
        background-clip: padding-box !important;
        position: relative;
        /* Borda RGB */
        animation: border-rotate 2s linear infinite;
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      }
      /* Truque para borda gradiente animada */
      & .die-card.hard::after {
        content: ""; position: absolute; inset: -2px; z-index: -1;
        background: linear-gradient(45deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff);
        border-radius: 8px;
        animation: hue-spin 2s linear infinite;
      }
      & .die-card.hard .die-icon i { 
        color: #333; 
        animation: text-hue 2s linear infinite; /* Ícone muda de cor */
      }
      
      @keyframes hue-spin { 100% { filter: hue-rotate(360deg); } }
      @keyframes text-hue { 
        0% { color: #ff0000; text-shadow: 0 0 5px #ff0000; }
        50% { color: #00ffff; text-shadow: 0 0 5px #00ffff; }
        100% { color: #ff0000; text-shadow: 0 0 5px #ff0000; }
      }

      /* 3. DADO WIGGLE -> EXPLOSÃO DE LUZ (Flash) */
      & .die-card.wiggle {
        border: 2px solid #fff !important;
        background: radial-gradient(circle, #fff, #e0e0e0) !important;
        box-shadow: 0 0 20px #fff;
        animation: blinding-flash 1s infinite;
      }
      & .die-card.wiggle .die-icon i { 
        color: #ffd700; 
        font-size: 1.2em; /* Maior */
        animation: sun-spin 4s infinite linear;
      }

      @keyframes blinding-flash {
        0%, 100% { box-shadow: 0 0 10px #fff; filter: brightness(1); }
        50% { box-shadow: 0 0 30px #fff, 0 0 50px #ffff00; filter: brightness(1.2); }
      }
      @keyframes sun-spin { 100% { transform: rotate(360deg); } }

      /* BOTÕES E CONTROLES */
      & .btn-buy {
        background: white !important;
        border: 2px solid #ffd700 !important;
        color: #daa520 !important;
        font-family: 'Cinzel', serif;
        font-weight: bold;
        transition: 0.3s;
      }
      & .btn-buy:hover:not(:disabled) {
        background: linear-gradient(90deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff) !important;
        color: #fff !important;
        border-color: #fff !important;
        animation: bg-pan 2s linear infinite;
        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
      }
      @keyframes bg-pan { 0% { background-position: 0% 50%; } 100% { background-position: 100% 50%; } }

      /* Barrinhas e Inputs */
      & .input-group input { color: #d4af37; text-shadow: 0 0 1px rgba(0,0,0,0.1); }
      & .input-group .bar { background: linear-gradient(90deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff) !important; height: 3px; }
      & input:focus ~ .bar { box-shadow: 0 0 15px #ffd700; }
    `
  },

  'raphael_deal': {
    label: 'O CONTRATO INFERNAL',
    icon: 'fa-file-signature',
    color: '#b8860b', // Ouro Escuro (Brass)
    desc: 'Tudo o que você deseja... por um preço módico.',
    css: `
      /* --- A CASA DA ESPERANÇA --- */
      & {
        /* Fundo de Veludo Carmesim e Escuridão */
        background: linear-gradient(135deg, #1a0505 0%, #2e0b0b 40%, #000000 100%) !important;
        border: 2px solid #b8860b !important; /* Moldura de Ouro */
        border-top: 4px double #b8860b !important;
        border-radius: 8px !important; /* Cantos mais rectos, como um contrato */
        box-shadow: 
          0 0 25px rgba(184, 134, 11, 0.2), 
          inset 0 0 40px rgba(0,0,0,0.9);
        position: relative;
        overflow: hidden !important;
        font-family: 'Cinzel', serif !important; /* Fonte elegante obrigatória */
      }

      /* BRASAS SUBINDO (HELLFIRE) */
      &::before {
        content: ""; position: absolute; bottom: -50px; left: 0; right: 0; height: 100%;
        background-image: 
          radial-gradient(#ff4500 1px, transparent 1px),
          radial-gradient(#b8860b 1px, transparent 1px);
        background-size: 15px 15px, 30px 30px;
        background-position: 0 0, 15px 15px;
        opacity: 0.4;
        animation: embers-rise 8s linear infinite;
        pointer-events: none;
      }
      
      /* O TEXTO DO CONTRATO (Fundo Sutil) */
      &::after {
        content: "§1. The undersigned... §2. Soul transfer...";
        position: absolute; top: 10%; left: 5%; right: 5%;
        font-family: 'Times New Roman', serif;
        font-size: 40px;
        color: rgba(255, 255, 255, 0.03);
        transform: rotate(-5deg);
        pointer-events: none;
        white-space: nowrap;
        overflow: hidden;
      }

      @keyframes embers-rise {
        0% { transform: translateY(0); opacity: 0; }
        50% { opacity: 0.6; }
        100% { transform: translateY(-200px); opacity: 0; }
      }

      /* TÍTULO TEATRAL */
      & .power-name {
        color: #b8860b;
        text-shadow: 0 2px 0 #000;
        font-weight: 700;
        letter-spacing: 1px;
        text-transform: uppercase;
        border-bottom: 1px solid rgba(184, 134, 11, 0.3);
        padding-bottom: 2px;
      }

      /* --- ÍCONE: O SELO DO DIABO --- */
      & .icon-box {
        background: #2b0a0a !important;
        border: 2px solid #b8860b !important;
        border-radius: 50% !important; /* Selo de cera */
        box-shadow: 0 0 15px #8b0000;
        animation: seal-pulse 4s infinite ease-in-out;
      }
      & .icon-box i { 
        color: #b8860b !important; 
        filter: drop-shadow(0 0 2px #000);
        transform: rotate(-15deg); /* Leve inclinação elegante */
      }
      
      @keyframes seal-pulse {
        0%, 100% { box-shadow: 0 0 10px #8b0000; border-color: #b8860b; }
        50% { box-shadow: 0 0 25px #ff4500; border-color: #ff4500; } /* Brilha como fogo */
      }

      /* =========================================
         ELEMENTOS DOS DADOS (OS TERMOS DO ACORDO)
         ========================================= */

      /* 1. DADO NORMAL -> O CHARME (Veludo e Ouro) */
      & .die-card.normal {
        border: 1px solid #b8860b !important;
        background: linear-gradient(to bottom, #3d0c0c, #1a0505) !important;
        box-shadow: inset 0 0 10px #000;
        transition: 0.3s;
      }
      & .die-card.normal:hover { box-shadow: 0 0 15px #b8860b; transform: translateY(-2px); }
      & .die-card.normal .die-icon i { color: #b8860b; text-shadow: 0 1px 2px #000; }
      & .die-card.normal .die-screen { color: #e6c288; font-family: serif; }

      /* 2. DADO HARD -> A AMEAÇA (Fogo Infernal) */
      & .die-card.hard {
        border: 1px solid #ff4500 !important;
        background: rgba(50, 10, 10, 0.8) !important;
        box-shadow: 0 0 10px rgba(255, 69, 0, 0.2);
        animation: hellfire-flicker 0.1s infinite alternate;
      }
      & .die-card.hard .die-icon i { 
        color: #ff4500; 
        text-shadow: 0 0 10px #ff0000;
        transform: scale(1.1);
      }
      
      @keyframes hellfire-flicker {
        from { background-color: rgba(60, 10, 10, 0.8); opacity: 0.9; }
        to { background-color: rgba(80, 20, 20, 0.9); opacity: 1; }
      }

      /* 3. DADO WIGGLE -> A ALMA (Soul Coin) */
      & .die-card.wiggle {
        border: 2px solid #4a4a4a !important; /* Ferro Frio */
        background: radial-gradient(circle, #2f4f4f, #000) !important; /* Verde Espectral Escuro */
        border-radius: 50% !important; /* Moeda */
        width: 60px; height: 80px; /* Forçar formato levemente arredondado no card */
        margin: 0 auto;
        box-shadow: 0 0 15px #00ff7f; /* Brilho Verde Alma */
        animation: soul-coin-spin 3s infinite ease-in-out;
      }
      & .die-card.wiggle .die-icon i { 
        color: #00ff7f; 
        text-shadow: 0 0 5px #fff;
        animation: scream-pulse 1s infinite;
      }
      & .die-card.wiggle .die-text { display: none; } /* Esconde texto para focar na moeda */

      @keyframes soul-coin-spin {
        0% { border-color: #4a4a4a; box-shadow: 0 0 10px #00ff7f; }
        50% { border-color: #fff; box-shadow: 0 0 25px #00ff7f, inset 0 0 20px #00ff7f; }
        100% { border-color: #4a4a4a; box-shadow: 0 0 10px #00ff7f; }
      }
      @keyframes scream-pulse {
        0%, 100% { opacity: 0.7; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.2); }
      }

      /* BOTÕES E CONTROLES (ASSINAR) */
      & .btn-buy {
        background: transparent !important;
        border: 1px solid #b8860b !important;
        color: #b8860b !important;
        font-family: 'Cinzel', serif;
        font-weight: 900;
        letter-spacing: 1px;
        transition: 0.3s;
        position: relative;
        overflow: hidden;
      }
      /* Efeito de "Queimar Papel" ao passar o mouse */
      & .btn-buy::before {
        content: ""; position: absolute; left: -100%; top: 0; width: 100%; height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 69, 0, 0.4), transparent);
        transition: 0.5s;
      }
      & .btn-buy:hover:not(:disabled) {
        color: #fff !important;
        border-color: #ff4500 !important;
        text-shadow: 0 0 5px #ff4500;
        box-shadow: 0 0 15px #b8860b;
      }
      & .btn-buy:hover::before { left: 100%; }

      /* Inputs elegantes */
      & .input-group input { 
        color: #b8860b; 
        font-family: serif; 
        font-style: italic;
      }
      & .input-group .bar { background: #b8860b !important; }
      & input:focus ~ .bar { box-shadow: 0 0 20px #b8860b; }
    `
  },

  'techno_guide': {
    label: 'PROTOCOLO: O GUIA',
    icon: 'fa-microchip',
    color: '#00f3ff', // Azul Neon Cyberpunk
    desc: 'Interface divina. O Deus da Tecnologia vê tudo.',
    css: `
      /* --- INTERFACE HOLOGRÁFICA (HUD) --- */
      & {
        /* Fundo Tech Escuro */
        background: linear-gradient(135deg, #050a10 0%, #001525 90%) !important;
        border: 1px solid rgba(0, 243, 255, 0.3) !important;
        /* Cantos cortados tecnologicamente */
        clip-path: polygon(
          15px 0, 100% 0, 
          100% calc(100% - 15px), calc(100% - 15px) 100%, 
          0 100%, 0 15px
        );
        box-shadow: 0 0 15px rgba(0, 243, 255, 0.1), inset 0 0 30px rgba(0, 243, 255, 0.05);
        position: relative;
        overflow: hidden !important;
        font-family: 'Share Tech Mono', monospace !important; /* Fonte Tech */
        cursor: crosshair !important; /* Cursor de Mira */
        transition: 0.3s;
      }

      /* EFEITO DE HOVER NO CARD (Target Locked) */
      &:hover {
        border-color: #00f3ff !important;
        box-shadow: 0 0 25px rgba(0, 243, 255, 0.3), inset 0 0 20px rgba(0, 243, 255, 0.1);
      }

      /* GRID DE FUNDO + SCANLINE */
      &::before {
        content: ""; position: absolute; inset: 0;
        /* Grid Hexagonal sutil */
        background-image: 
          linear-gradient(rgba(0, 243, 255, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 243, 255, 0.1) 1px, transparent 1px);
        background-size: 20px 20px;
        pointer-events: none;
        z-index: 0;
      }
      &::after {
        content: ""; position: absolute; top: -50%; left: 0; width: 100%; height: 50%;
        background: linear-gradient(to bottom, transparent, rgba(0, 243, 255, 0.3), transparent);
        animation: hud-scan 3s linear infinite;
        pointer-events: none;
      }

      @keyframes hud-scan {
        0% { top: -50%; opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { top: 150%; opacity: 0; }
      }

      /* TÍTULO DIGITAL */
      & .power-name {
        color: #fff;
        text-shadow: 0 0 5px #00f3ff, 0 0 10px #00f3ff;
        font-weight: 400;
        letter-spacing: 2px;
        text-transform: uppercase;
        position: relative;
        padding-left: 10px;
        border-left: 3px solid #00f3ff;
      }

      /* --- ÍCONE: O NÚCLEO (ARC REACTOR) --- */
      & .icon-box {
        background: radial-gradient(circle, #001525, #000) !important;
        border: 2px solid #00f3ff !important;
        border-radius: 50% !important;
        box-shadow: 0 0 15px #00f3ff, inset 0 0 10px #00f3ff;
        position: relative;
      }
      /* Anel Giratório em volta do ícone */
      & .icon-box::before {
        content: ""; position: absolute; inset: -4px;
        border: 1px dashed #fff;
        border-radius: 50%;
        animation: reactor-spin 10s linear infinite;
      }
      & .icon-box i { 
        color: #fff !important; 
        text-shadow: 0 0 5px #00f3ff;
        animation: core-pulse 2s infinite;
      }
      
      @keyframes reactor-spin { 100% { transform: rotate(360deg); } }
      @keyframes core-pulse { 0%, 100% { opacity: 1; text-shadow: 0 0 10px #00f3ff; } 50% { opacity: 0.7; text-shadow: 0 0 2px #00f3ff; } }

      /* =========================================
         ELEMENTOS DOS DADOS (MODULOS DE SISTEMA)
         ========================================= */

      /* 1. DADO NORMAL -> DADOS ESTÁVEIS (Azul) */
      & .die-card.normal {
        border: 1px solid rgba(0, 243, 255, 0.3) !important;
        background: rgba(0, 243, 255, 0.05) !important;
        box-shadow: inset 0 0 10px rgba(0, 243, 255, 0.1);
        position: relative;
      }
      /* Cantos de Mira no Card */
      & .die-card.normal::after {
        content: ""; position: absolute; inset: 2px;
        border: 1px solid transparent;
        border-top: 1px solid #00f3ff;
        border-bottom: 1px solid #00f3ff;
        opacity: 0.5;
        transform: scaleX(0);
        transition: 0.3s;
      }
      & .die-card.normal:hover::after { transform: scaleX(1); }
      & .die-card.normal .die-icon i { color: #00f3ff; text-shadow: 0 0 5px #00f3ff; }

      /* 2. DADO HARD -> OVERCLOCK (Branco/Ciano Intenso) */
      & .die-card.hard {
        border: 1px solid #fff !important;
        background: rgba(255, 255, 255, 0.1) !important;
        box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
        animation: data-flicker 0.1s infinite; /* Leve glitch */
      }
      & .die-card.hard .die-icon i { 
        color: #fff; 
        text-shadow: 0 0 10px #fff, 0 0 20px #00f3ff;
      }
      
      @keyframes data-flicker {
        0% { opacity: 1; }
        95% { opacity: 1; }
        96% { opacity: 0.8; }
        100% { opacity: 1; }
      }

      /* 3. DADO WIGGLE -> ERRO DE SISTEMA / PODER MAXIMO (Glitch) */
      & .die-card.wiggle {
        border: 1px solid #00f3ff !important;
        background: repeating-linear-gradient(
          45deg,
          rgba(0, 243, 255, 0.1),
          rgba(0, 243, 255, 0.1) 10px,
          rgba(0, 0, 0, 0.2) 10px,
          rgba(0, 0, 0, 0.2) 20px
        ) !important;
      }
      & .die-card.wiggle .die-icon i { 
        color: #fff; 
        text-shadow: 2px 0 #ff0000, -2px 0 #0000ff; /* Efeito 3D Anaglifo */
        animation: glitch-skew 0.3s infinite;
      }

      @keyframes glitch-skew {
        0% { transform: skew(0deg); }
        20% { transform: skew(-10deg); }
        40% { transform: skew(10deg); }
        60% { transform: skew(-5deg); }
        80% { transform: skew(5deg); }
        100% { transform: skew(0deg); }
      }

      /* BOTÕES E CONTROLES (HOLOGRAFIA) */
      & .btn-buy {
        background: rgba(0, 243, 255, 0.05) !important;
        border: 1px solid #00f3ff !important;
        color: #00f3ff !important;
        font-family: 'Share Tech Mono', monospace;
        letter-spacing: 1px;
        text-transform: uppercase;
        position: relative;
        overflow: hidden;
        transition: 0.2s;
        cursor: crosshair !important;
      }
      /* Efeito de preenchimento ao passar o mouse */
      & .btn-buy:hover:not(:disabled) {
        background: #00f3ff !important;
        color: #000 !important;
        box-shadow: 0 0 20px #00f3ff;
      }
      
      /* Inputs Tecnológicos */
      & .input-group input { 
        color: #00f3ff; 
        font-family: 'Share Tech Mono', monospace;
      }
      & .input-group .bar { background: #fff !important; }
      & input:focus ~ .bar { background: #00f3ff !important; box-shadow: 0 0 10px #00f3ff; }
    `
  },

  
  
};