// Éléments de base partagés par tous les costumes d'unités : palettes des deux peuples, boîtes de dessin, costume de départ.
import { team as teamColors } from './palette.js';
import { BRONZE, GOLD, IRON } from './unit-gear.js';

export { BRONZE, GOLD, IRON, teamColors };

// Palettes des deux peuples
export const GAUL = {
  skin: '#ecbb90',
  blond: '#e6b94e',
  red: '#c8672c',
  white: '#f1e6c2',
  check1: '#6f7f3a',
  check2: '#a8763a',
  shoes: '#5c3b22',
  belt: '#5a3920',
  hood: '#667a38',
  mail: '#9aa0a2',
};
export const FRANK = {
  skin: '#e6b28a',
  brown: '#6b4428',
  dark: '#3f2b1d',
  auburn: '#8a5a32',
  legs: '#8e8676',
  wraps: '#4a3a2a',
  shoes: '#46301f',
  belt: '#3e2c1e',
  hood: '#6f6a5c',
  mail: '#99a1a9',
  fur: '#8c6a48',
  furLight: '#d9cfbd',
};

/** Étendue maximale du dessin (gauche, haut, droite, bas) autour des pieds, marges d'animation comprises. */
export const BOX = {
  human: [-26, -48, 30, 8],
  mounted: [-36, -70, 46, 10],
  knight: [-40, -76, 62, 10],
  ram: [-44, -58, 56, 18],
  catapult: [-48, -80, 52, 20],
  hero: [-34, -60, 38, 10],
  fishingboat: [-72, -64, 60, 22],
  warship: [-108, -100, 74, 30],
};

export function base(civ, tm, z) {
  const g = civ === 'gauls';
  const P = g ? GAUL : FRANK;
  return {
    sz: z,
    civ,
    skin: P.skin,
    hair: g ? P.blond : P.brown,
    hairStyle: g ? 'short' : 'long',
    moustache: g ? P.blond : null,
    beard: g ? null : P.brown,
    tunic: tm.main,
    hem: g ? 3.6 : 6.4,
    sleeves: 'long',
    legs: g ? { kind: 'check', c1: P.check1, c2: P.check2 } : { kind: 'wrap', c1: P.legs, c2: P.wraps },
    shoes: P.shoes,
    belt: P.belt,
    buckle: g ? BRONZE : '#b8a060',
    trim2: g ? '#efd894' : '#e2d6b8',
    hilt: g ? BRONZE : '#a9a28e',
  };
}

