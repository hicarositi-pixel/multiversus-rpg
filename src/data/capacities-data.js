// src/data/capacities-data.js

// Tabela base (Valores para 1d até 10d)
const BASE_TABLE = [
  { d: 1, mass: 50, range: 10, speed: 2 },
  { d: 2, mass: 100, range: 20, speed: 5 },
  { d: 3, mass: 200, range: 40, speed: 10 },
  { d: 4, mass: 400, range: 80, speed: 20 },
  { d: 5, mass: 800, range: 160, speed: 40 },
  { d: 6, mass: 1600, range: 320, speed: 80 },
  { d: 7, mass: 3200, range: 640, speed: 160 },
  { d: 8, mass: 6400, range: 1280, speed: 320 },
  { d: 9, mass: 12800, range: 2560, speed: 640 },
  { d: 10, mass: 25600, range: 5120, speed: 1280 }
];

export const CAPACITY_TYPES = [
  { id: 'mass', name: 'Mass (Massa)', unit: 'lbs' },
  { id: 'range', name: 'Range (Alcance)', unit: 'yds' },
  { id: 'speed', name: 'Speed (Velocidade)', unit: 'yds' },
  { id: 'touch', name: 'Touch (Toque)', unit: '-' },
  { id: 'self', name: 'Self (Próprio)', unit: '-' }
];

/**
 * Calcula a capacidade com lógica Linear para Boosters.
 */
export function calculateCapacity(dice, type, nul = 0, booster = 0) {
  if (type === 'touch') return "Toque Físico";
  if (type === 'self') return "Apenas Você";
  if (!type) return "Selecione...";

  let baseVal = 0;
  
  // 1. Valor Base
  if (dice < 1) return "0";
  if (dice <= 10) {
    baseVal = BASE_TABLE[dice - 1][type];
  } else {
    // Extrapolação para dados acima de 10 (dobra a cada dado)
    let val10 = BASE_TABLE[9][type];
    let extraDice = dice - 10;
    baseVal = val10 * Math.pow(2, extraDice);
  }

  // 2. Cálculo dos Multiplicadores
  // No Upward Limit (NUL): Exponencial (2^N) pois "dobra" a capacidade a cada compra
  let nulMultiplier = Math.pow(2, nul);

  // Booster: Linear (N * 10) conforme solicitado.
  // Se tiver 0 boosters, multiplica por 1. Se tiver 2, multiplica por 20.
  let boosterMultiplier = booster > 0 ? (booster * 10) : 1;

  // 3. Aplicação
  // Base * NUL * Booster
  // Exemplo Base 10, 2 Boosters: 10 * 1 * 20 = 200.
  let finalValue = baseVal * nulMultiplier * boosterMultiplier;

  return formatUnit(finalValue, type);
}

function formatUnit(value, type) {
  if (type === 'mass') {
    if (value >= 2000) {
      let tons = value / 2000;
      return `${formatNumber(tons)} Tons`;
    }
    return `${formatNumber(value)} lbs`;
  }
  
  if (type === 'range' || type === 'speed') {
    // Milhas se for muito grande
    if (value >= 1760) {
      let miles = value / 1760;
      return `${formatNumber(miles)} Miles`;
    }
    return `${formatNumber(value)} yds`;
  }

  return value;
}

function formatNumber(num) {
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}