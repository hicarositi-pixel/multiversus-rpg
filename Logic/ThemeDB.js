/**
 * ThemeDB.js
 * Banco de dados de temas visuais para o Nexus HUD
 */
export const ThemeDB = {
    getThemes: () => [
        { id: 'cyber-neon', name: 'Cyber Neon', primary: '#00ff41', bg: 'rgba(5, 5, 10, 0.95)' },
        { id: 'blood-pact', name: 'Blood Pact', primary: '#ff3333', bg: 'rgba(15, 5, 5, 0.95)' },
        { id: 'arcane-blue', name: 'Arcane Blue', primary: '#00aaff', bg: 'rgba(5, 10, 20, 0.95)' },
        { id: 'golden-sun', name: 'Golden Sun', primary: '#ffcc00', bg: 'rgba(15, 15, 5, 0.95)' },
        { id: 'hacker-term', name: 'Terminal', primary: '#00ff00', bg: 'rgba(0, 0, 0, 0.98)' }
    ],
    getDefault: () => 'cyber-neon'
};