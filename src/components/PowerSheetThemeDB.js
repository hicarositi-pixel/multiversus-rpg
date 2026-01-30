/**
 * BANCO DE DADOS DE TEMAS VISUAIS
 * Adicione novos objetos aqui para criar novos temas.
 * As variáveis CSS (--bg, --accent, etc) são injetadas automaticamente na ficha.
 */

export const THEME_DB = {
    "neon-operator": { 
        label: "Neon Operator (Padrão)", 
        vars: { 
            "--bg-base": "#090a0c", 
            "--bg-card": "rgba(20, 22, 28, 0.9)", 
            "--bg-input": "#050505",
            "--accent": "#00ff41", /* Cor principal (Verde Matrix) */
            "--text-main": "#e0e6ed", 
            "--text-muted": "#64748b",
            "--border": "#1f2229", 
            "--radius": "4px", 
            "--font": "'Exo 2', sans-serif" 
        }
    },
    "royal-fantasy": { 
        label: "Royal Fantasy", 
        vars: { 
            "--bg-base": "#1a1614", 
            "--bg-card": "rgba(40, 30, 25, 0.95)", 
            "--bg-input": "#120e0c",
            "--accent": "#ffbb00", /* Dourado */
            "--text-main": "#f0e6d2", 
            "--text-muted": "#8a7b70",
            "--border": "#4a3b32", 
            "--radius": "2px", 
            "--font": "'Cinzel', serif" 
        }
    },
    "cyber-red": { 
        label: "Arasaka Red", 
        vars: { 
            "--bg-base": "#000000", 
            "--bg-card": "rgba(20, 0, 0, 0.95)", 
            "--bg-input": "#1a0000",
            "--accent": "#ff003c", /* Vermelho Cyberpunk */
            "--text-main": "#ffffff", 
            "--text-muted": "#888888",
            "--border": "#330000", 
            "--radius": "0px", 
            "--font": "'Rajdhani', sans-serif" 
        }
    },
    "clean-glass": { 
        label: "Clean Glass", 
        vars: { 
            "--bg-base": "#1e293b", 
            "--bg-card": "rgba(255, 255, 255, 0.05)", 
            "--bg-input": "rgba(0, 0, 0, 0.2)",
            "--accent": "#38bdf8", /* Azul Céu */
            "--text-main": "#f1f5f9", 
            "--text-muted": "#94a3b8",
            "--border": "rgba(255,255,255,0.1)", 
            "--radius": "12px", 
            "--font": "'Inter', sans-serif" 
        }
    },
    "paper-rpg": { 
        label: "Grimório Antigo", 
        vars: { 
            "--bg-base": "#2c241b", 
            "--bg-card": "#e3dac9", /* Cor de Papel */
            "--bg-input": "rgba(0,0,0,0.05)",
            "--accent": "#8b0000", /* Vinho */
            "--text-main": "#222222", /* Texto Escuro no papel */
            "--text-muted": "#555555",
            "--border": "#8b7355", 
            "--radius": "2px", 
            "--font": "'Times New Roman', serif" 
        }
    }
};