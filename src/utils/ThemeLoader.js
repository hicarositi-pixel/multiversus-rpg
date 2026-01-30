// src/utils/ThemeLoader.js
import { THEME_DB } from '../data/ThemeDB.js';

export function loadPowerThemes() {
  const styleId = 'multiversus-power-themes-style';
  
  // Evita carregar duas vezes
  if (document.getElementById(styleId)) return;

  let cssOutput = "";

  for (const [key, theme] of Object.entries(THEME_DB)) {
    // Substitui o "&" pela classe .theme-NOME do card
    const themeCss = theme.css.replace(/&/g, `.power-card.theme-${key}`);
    cssOutput += `\n/* TEMA: ${theme.label} */\n${themeCss}\n`;
  }

  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = cssOutput;
  document.head.appendChild(style);
  
  console.log("Multiversus RPG | Database de Temas Carregada.");
}