// src/utils/ThemeLoader.js
import { THEME_DB } from '../data/ThemeDB.js';

export function loadPowerThemes(forceReload = false) {
  const styleId = 'multiversus-power-themes-style';
  const existing = document.getElementById(styleId);
  
  // Evita carregar duas vezes a menos que seja atualização em tempo real
  if (existing && !forceReload) return;

  let cssOutput = "";

  for (const [key, theme] of Object.entries(THEME_DB)) {
    if (!theme || !theme.css) continue;
    // Substitui o "&" pela classe .theme-NOME do card
    const themeCss = theme.css.replace(/&/g, `.power-card.theme-${key}`);
    cssOutput += `\n/* TEMA: ${theme.label} */\n${themeCss}\n`;
  }

  if (existing) {
    existing.innerHTML = cssOutput;
    return;
  }

  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = cssOutput;
  document.head.appendChild(style);
  
  console.log("Multiversus RPG | Database de Temas Carregada.");
}