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

    "bio": {
        name: "SYMBIOTE (Organic)",
        vars: {
            "--c-primary": "#88ff00",
            "--c-bg": "#1a0505",
            "--c-panel": "rgba(40, 10, 10, 0.9)",
            "--c-border": "#500",
            "--c-shock": "#ffff00",
            "--c-kill": "#550000",
            "--f-main": "'Courier New', monospace",
            "--r-node": "15px",
            "--r-slot": "50%" // Células Redondas
        },
        css: `
            /* Células Vivas */
            .hp-slot { 
                border-radius: 50%; 
                border: none;
                background: #311;
                box-shadow: inset -2px -2px 5px rgba(0,0,0,0.5);
            }
            .hp-slot.shock, .hp-slot.killing {
                animation: pulseBio 2s infinite;
            }
            @keyframes pulseBio { 0% { transform: scale(0.95); } 50% { transform: scale(1.1); } 100% { transform: scale(0.95); } }
            
            .limb-node { border: 2px solid #500; }
        `
    }
};