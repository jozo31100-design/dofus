// Couleurs et petits outils partagés par tous les modules de dessin.
import { TEAM_COLORS } from '../../core/defs.js';

export function hexToRgb(h) {
  const s = h.replace('#', '');
  const n = parseInt(s.length === 3 ? s.split('').map((c) => c + c).join('') : s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgbToHex([r, g, b]) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}
/** Mélange deux couleurs (« #rrggbb »), t de 0 à 1. */
export function mix(a, b, t) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
}
/** Éclaircit (amount > 0) ou assombrit (amount < 0) une couleur, de -1 à 1. */
export function shade(c, amount) {
  return amount >= 0 ? mix(c, '#ffffff', amount) : mix(c, '#000000', -amount);
}
export function alpha(c, a) {
  const [r, g, b] = hexToRgb(c);
  return `rgba(${r},${g},${b},${a})`;
}

/** Générateur pseudo-aléatoire reproductible (le dessin ne doit jamais utiliser Math.random). */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(w));
  canvas.height = Math.max(1, Math.ceil(h));
  return { canvas, ctx: canvas.getContext('2d') };
}

export function team(idx) {
  return TEAM_COLORS[idx] || TEAM_COLORS[0];
}

/** Palette de base commune (nature, matériaux). */
export const PAL = {
  outline: '#2a1c12',
  grass: ['#5f9440', '#6aa346', '#558a3a', '#79ad4e', '#4d8036'],
  sand: '#d9c48a',
  shallow: '#7fc4c8',
  water: '#2f79b8',
  deepWater: '#1d4f86',
  wood: '#8a5a32',
  woodDark: '#5c3a1e',
  woodLight: '#b98351',
  thatch: '#c9a55b',
  thatchDark: '#9a7a36',
  stone: '#9a9a94',
  stoneDark: '#6c6c68',
  stoneLight: '#c4c3bb',
  plaster: '#e8dcc0',
  skin: ['#f0c8a0', '#e3b088', '#c98d62'],
  hair: ['#f2d16b', '#c8752f', '#5a3a22', '#2c2018', '#b0402a'],
  steel: '#b9c0c8',
  steelDark: '#7c848e',
  gold: '#e6b93c',
  leather: '#7a4c2a',
  cloth: ['#9b6a3c', '#b9a06a', '#7d8c4a', '#a0522d', '#d8cfae'],
};
