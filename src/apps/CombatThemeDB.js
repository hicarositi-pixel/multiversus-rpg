// CombatThemeDB.js

export const CombatThemes = {
    "nexus": {
        name: "NEXUS OS (Tech)",
        vars: {
            "--c-primary": "#00ff41",
            "--c-bg": "#050505",
            "--c-panel": "rgba(10, 10, 10, 0.95)",
            "--c-border": "#333",
            "--c-shock": "#eab308",
            "--c-kill": "#ef4444",
            "--f-main": "'Share Tech Mono', monospace",
            "--r-node": "4px", // Arredondamento do node
            "--r-slot": "0px"  // Arredondamento do HP (quadrado)
        },
        // CSS Customizado para este tema (Muda formas e comportamentos)
        css: `
            .limb-node { border: 1px solid var(--c-border); box-shadow: 0 0 10px rgba(0,0,0,0.5); }
            .hp-slot { border: 1px solid #444; }
            .hp-slot.shock { box-shadow: 0 0 5px var(--c-shock); }
            .loc-tag { text-transform: uppercase; letter-spacing: 1px; }
        `
    },

    "ether": {
        name: "ETHER CRYSTAL (Magic)",
        vars: {
            "--c-primary": "#00ffff",
            "--c-bg": "#0a0a15",
            "--c-panel": "rgba(20, 30, 50, 0.8)",
            "--c-border": "#4466aa",
            "--c-shock": "#d8b4fe", // Roxo claro
            "--c-kill": "#ff0055", // Magenta
            "--f-main": "'Cinzel', serif",
            "--r-node": "0px",
            "--r-slot": "0px"
        },
        css: `
            /* Transforma caixas em CRISTAIS */
            .hp-slot { 
                transform: rotate(45deg); 
                margin: 4px; 
                box-shadow: inset 0 0 2px rgba(255,255,255,0.3);
                border: 1px solid rgba(255,255,255,0.2);
            }
            .hp-grid { padding: 5px; } /* Espaço extra para a rotação */
            
            .limb-node { 
                background: linear-gradient(135deg, rgba(0,0,0,0.8), rgba(20,30,60,0.9));
                border: 1px solid var(--c-primary);
                box-shadow: 0 0 15px var(--c-primary);
            }
            .loc-tag { background: transparent; border: 1px solid var(--c-primary); color: var(--c-primary); }
        `
    },
"heroking": {
        name: "HERO KING (Tesouro)",
        vars: {
            "--c-primary": "#ffcc00",     // Ouro Babilônico
            "--c-bg": "#0a0101",          // Fundo Escuro Carmesim
            "--c-panel": "rgba(20, 2, 2, 0.95)",
            "--c-border": "#ff0033",      // Vermelho Enuma Elish
            "--c-shock": "#c0c0c0",       // Prata
            "--c-kill": "#cd7f32",        // Bronze
            "--f-main": "'Cinzel', serif",// Fonte Imperial
            "--r-node": "6px",            // Borda do card do membro
            "--r-slot": "50%"             // Deixa o slot perfeitamente redondo (Moeda)
        },
        css: `
            /* Caixa do membro (Placa Imperial) */
            .limb-node { 
                border: 1px solid var(--c-border) !important; 
                background: radial-gradient(circle at top, #1a0202 0%, #000 100%) !important;
                box-shadow: inset 0 0 20px rgba(0,0,0,0.8), 0 0 10px rgba(255,0,51,0.2) !important;
            }
            
            /* Nome do Membro */
            .loc-tag { 
                color: var(--c-primary) !important; 
                font-weight: bold !important; 
                letter-spacing: 1px !important; 
                text-shadow: 0 0 5px rgba(255, 204, 0, 0.5) !important;
            }

            /* HP Cheio: MOEDA DE OURO */
            .hp-slot { 
                border: 1px solid #b8860b !important; 
                background: radial-gradient(circle at 35% 35%, #ffea00, #daa520) !important; 
                box-shadow: inset 0 -2px 4px rgba(0,0,0,0.6) !important; 
            }

            /* Dano Shock: MOEDA DE PRATA */
            .hp-slot.shock, .hp-slot.bashing { 
                border: 1px solid #888888 !important; 
                background: radial-gradient(circle at 35% 35%, #ffffff, #a0a0a0) !important; 
                box-shadow: inset 0 -2px 4px rgba(0,0,0,0.6) !important; 
            }

            /* Dano Killing: MOEDA DE BRONZE */
            .hp-slot.kill, .hp-slot.lethal, .hp-slot.killing { 
                border: 1px solid #8b4513 !important; 
                background: radial-gradient(circle at 35% 35%, #ffa07a, #cd7f32) !important; 
                box-shadow: inset 0 -2px 4px rgba(0,0,0,0.6) !important; 
            }
        `
    },

    "novoimortal": {
        name: "NOVO IMORTAL (Hogyoku)",
        vars: {
            "--c-primary": "#00d4ff",     // Azul Hogyoku
            "--c-bg": "#020406",          // Preto vácuo
            "--c-panel": "rgba(10, 15, 20, 0.85)",
            "--c-border": "#00d4ff",      // Borda Azul
            "--c-shock": "#ffea00",       // Amarelo
            "--c-kill": "#ff0000",        // Vermelho
            "--f-main": "'Orbitron', sans-serif",
            "--r-node": "12px",           // Card do membro arredondado
            "--r-slot": "50%"             // Células de energia redondas
        },
        css: `
            /* Caixa do membro (Cápsula de Energia) */
            .limb-node { 
                border: 1px solid var(--c-border) !important; 
                background: rgba(5, 10, 15, 0.8) !important;
                box-shadow: 0 0 15px rgba(0, 212, 255, 0.1), inset 0 0 10px rgba(0, 212, 255, 0.05) !important; 
                backdrop-filter: blur(5px) !important;
            }
            
            /* Nome do Membro */
            .loc-tag { 
                color: #ffffff !important; 
                font-weight: bold !important; 
                text-shadow: 0 0 5px var(--c-primary) !important; 
            }

            /* HP Cheio: BOLINHA AZUL (Energia Hogyoku) */
            .hp-slot { 
                border: 1px solid #0055aa !important; 
                background: radial-gradient(circle at 35% 35%, #ffffff, #00d4ff) !important; 
                box-shadow: 0 0 5px rgba(0, 212, 255, 0.5) !important; 
            }

            /* Dano Shock: BOLINHA AMARELA (Energia Corrompida) */
            .hp-slot.shock, .hp-slot.bashing { 
                border: 1px solid #aa8800 !important; 
                background: radial-gradient(circle at 35% 35%, #ffffff, var(--c-shock)) !important; 
                box-shadow: 0 0 5px var(--c-shock) !important; 
            }

            /* Dano Killing: BOLINHA VERMELHA (Morte Celular) */
            .hp-slot.kill, .hp-slot.lethal, .hp-slot.killing { 
                border: 1px solid #880000 !important; 
                background: radial-gradient(circle at 35% 35%, #ffcccc, var(--c-kill)) !important; 
                box-shadow: 0 0 5px var(--c-kill) !important; 
            }
        `
    },

    "vampire": {
        name: "NOSFERATU (Sangue)",
        vars: {
            "--c-primary": "#dc143c",     // Carmesim Sangue
            "--c-bg": "#080103",          // Preto Abissal
            "--c-panel": "rgba(18, 2, 5, 0.95)",
            "--c-border": "#8a0303",      // Borda Sangue Seco
            "--c-shock": "#f59e0b",       // Âmbar / Amarelo Dourado (Shock)
            "--c-kill": "#ff002b",        // Vermelho Vivo (Killing)
            "--f-main": "'Cinzel Decorative', serif",
            "--r-node": "8px",
            "--r-slot": "0 50% 50% 50%"   // Formato base de gota
        },
        css: `
            @keyframes blood-pulse {
                0%, 100% { box-shadow: 0 0 6px rgba(255, 0, 43, 0.6), inset 0 0 4px #ff6b81; }
                50%      { box-shadow: 0 0 14px rgba(255, 0, 43, 1), inset 0 0 8px #ffffff; }
            }

            /* Card do Membro (Relicário Gótico) */
            .limb-node { 
                border: 1px solid #d4af37 !important; 
                background: radial-gradient(circle at top, #240309 0%, #070102 100%) !important;
                box-shadow: inset 0 0 18px rgba(138, 3, 3, 0.45), 0 4px 12px rgba(0, 0, 0, 0.9) !important;
                position: relative;
            }

            /* Nome do Membro */
            .loc-tag { 
                color: #d4af37 !important; 
                font-weight: bold !important; 
                letter-spacing: 1.5px !important;
                text-transform: uppercase !important;
                text-shadow: 0 0 6px rgba(220, 20, 60, 0.8) !important;
                border-bottom: 1px solid rgba(212, 175, 55, 0.3) !important;
            }

            /* Espaçamento extra na grade para a ponta da gota não cortar */
            .hp-grid { 
                padding: 8px 6px !important; 
                gap: 8px !important; 
            }

            /* VIDA CHEIA: GOTA PRETA (Obsidiana / Sangue Coagulado) */
            .hp-slot { 
                border-radius: 0 50% 50% 50% !important;
                transform: rotate(45deg) scale(0.92) !important;
                margin: 3px !important;
                background: radial-gradient(circle at 35% 35%, #2b2b2b 0%, #050505 80%) !important; 
                border: 1px solid #555555 !important; 
                box-shadow: inset 0 -2px 4px rgba(0, 0, 0, 0.9), 0 2px 4px rgba(0, 0, 0, 0.8) !important;
                transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
            }
            .hp-slot:hover {
                transform: rotate(45deg) scale(1.12) !important;
                border-color: #d4af37 !important;
            }

            /* DANO NÃO-LETAL (SHOCK): GOTA AMARELA (Icor / Brasa) */
            .hp-slot.shock, .hp-slot.bashing { 
                background: radial-gradient(circle at 35% 35%, #fef08a 0%, #eab308 55%, #854d0e 100%) !important; 
                border: 1px solid #fef08a !important; 
                box-shadow: 0 0 8px rgba(234, 179, 8, 0.75), inset 0 0 4px rgba(255, 255, 255, 0.5) !important; 
            }

            /* DANO LETAL (KILLING): GOTA VERMELHA (Sangue Fresco Pulsante) */
            .hp-slot.kill, .hp-slot.lethal, .hp-slot.killing { 
                background: radial-gradient(circle at 35% 35%, #ff8fa3 0%, #dc143c 55%, #590202 100%) !important; 
                border: 1px solid #ff4d6d !important; 
                animation: blood-pulse 1.8s infinite ease-in-out !important;
            }
        `
    },
};
