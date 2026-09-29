// Costumes des unités : chaque type × civilisation est composé d'accessoires (coiffure, casque, tunique,
// jambes, armure, cape, bouclier, arme) ; la couleur d'équipe va sur la tunique, les manches, la cape,
// la face du bouclier, le tapis de selle ou le caparaçon.
import { team as teamColors } from './palette.js';
import { tone } from './unit-kit.js';
import { IRON, BRONZE, GOLD, STEEL } from './unit-gear.js';

// Palettes des deux peuples
const GAUL = {
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
const FRANK = {
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

/** Hauteur visible (pieds → sommet de la tête) et demi-largeur de chaque type, en px à zoom 1. */
export const METRICS = {
  villager: { h: 30, w: 8 },
  militia: { h: 33, w: 8 },
  spearman: { h: 34, w: 9 },
  swordsman: { h: 35, w: 9 },
  champion: { h: 38, w: 10 },
  archer: { h: 33, w: 9 },
  crossbow: { h: 34, w: 9 },
  scout: { h: 44, w: 17 },
  cavalry: { h: 46, w: 18 },
  knight: { h: 52, w: 19 },
  ram: { h: 40, w: 34 },
  catapult: { h: 54, w: 32 },
  francisque: { h: 35, w: 9 },
  gesate: { h: 34, w: 9 },
  healer: { h: 32, w: 8 },
};

/** Étendue maximale du dessin (gauche, haut, droite, bas) autour des pieds, marges d'animation comprises. */
export const BOX = {
  human: [-26, -48, 30, 8],
  mounted: [-36, -70, 46, 10],
  knight: [-40, -76, 62, 10],
  ram: [-44, -58, 56, 18],
  catapult: [-48, -80, 52, 20],
};

function base(civ, tm, z) {
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
    hilt: g ? BRONZE : '#a9a28e',
  };
}

/**
 * Description complète d'une unité : { kind, sp (costume du personnage), hold (manière de tenir l'arme),
 * horse (robe et harnachement), box }.
 */
export function unitSpec(type, civ, teamIdx) {
  const tm = teamColors(teamIdx);
  const g = civ === 'gauls';
  const P = g ? GAUL : FRANK;
  let sp;
  let hold = 'sword';
  switch (type) {
    case 'villager': {
      sp = base(civ, tm, 1.0);
      if (!g) {
        sp.hairStyle = 'long';
        sp.hair = FRANK.auburn;
        sp.beard = FRANK.auburn;
      }
      sp.weapon = 'axe';
      hold = 'tool';
      break;
    }
    case 'militia': {
      sp = base(civ, tm, 1.09);
      if (g) {
        sp.hair = GAUL.red;
        sp.moustache = GAUL.red;
        sp.helmet = { kind: 'montefortino', c: BRONZE };
        sp.weapon = 'sword';
        sp.swordLen = 6.5;
      } else {
        sp.helmet = { kind: 'leather', c: '#6e4a2c' };
        sp.weapon = 'waraxe';
      }
      sp.hem = g ? 3.8 : 6.2;
      break;
    }
    case 'spearman': {
      sp = base(civ, tm, 1.11);
      if (g) {
        sp.helmet = { kind: 'montefortino', c: '#a8aaa4' };
        sp.shield = { kind: 'oval', face: tm.main };
        sp.torque = true;
      } else {
        sp.helmet = { kind: 'conical', c: IRON };
        sp.shield = { kind: 'round', face: tm.main, deco: 'segments' };
        sp.beard = FRANK.dark;
        sp.hair = FRANK.dark;
      }
      sp.weapon = 'spear';
      sp.spearFwd = 12;
      sp.spearBack = 9;
      hold = 'spear';
      break;
    }
    case 'swordsman': {
      sp = base(civ, tm, 1.14);
      sp.mail = { c: g ? GAUL.mail : FRANK.mail, hem: g ? 3.4 : 5.6 };
      sp.sleeves = 'mail';
      if (g) {
        sp.hair = GAUL.red;
        sp.moustache = GAUL.red;
        sp.helmet = { kind: 'agen', c: '#a3a8ab' };
        sp.shield = { kind: 'hex', face: tm.main };
        sp.torque = true;
        sp.weapon = 'longsword';
        sp.hem = 4.6;
      } else {
        sp.helmet = { kind: 'conical', c: IRON };
        sp.shield = { kind: 'round', face: tm.main, deco: 'segments' };
        sp.weapon = 'sword';
        sp.hem = 7.0;
      }
      break;
    }
    case 'champion': {
      sp = base(civ, tm, 1.24);
      sp.mail = { c: g ? '#a7acae' : '#a2aab2', hem: g ? 3.8 : 6.0 };
      sp.sleeves = 'mail';
      sp.gloves = '#6a4428';
      if (g) {
        sp.helmet = { kind: 'winged', c: GOLD, wing: '#f4f1e8' };
        sp.shield = { kind: 'oval', face: tm.main, s: 1.08, deco: 'boar' };
        sp.torque = true;
        sp.cape = tm.dark;
        sp.plate = BRONZE;
        sp.weapon = 'longsword';
        sp.hem = 4.8;
      } else {
        sp.helmet = { kind: 'crest', c: '#b0b8c0', crest: tm.main, band: GOLD };
        sp.shield = { kind: 'round', face: tm.main, s: 1.1, deco: 'segments' };
        sp.cape = FRANK.fur;
        sp.fur = FRANK.furLight;
        sp.aventail = FRANK.mail;
        sp.weapon = 'sword';
        sp.swordLen = 9;
        sp.hem = 7.2;
      }
      break;
    }
    case 'archer': {
      sp = base(civ, tm, 1.08);
      sp.hood = g ? GAUL.hood : FRANK.hood;
      sp.hairStyle = 'none';
      sp.weapon = 'bow';
      sp.back = 'quiver';
      if (g) sp.moustache = GAUL.red;
      sp.hem = g ? 3.8 : 6.0;
      hold = 'bow';
      break;
    }
    case 'crossbow': {
      sp = base(civ, tm, 1.11);
      sp.mail = { c: g ? GAUL.mail : FRANK.mail, hem: g ? 3.2 : 5.0 };
      sp.sleeves = 'mail';
      sp.helmet = g ? { kind: 'montefortino', c: '#a8aaa4' } : { kind: 'kettle', c: IRON };
      sp.weapon = 'crossbow';
      sp.back = 'quiver';
      sp.hem = g ? 4.2 : 6.4;
      hold = 'xbow';
      break;
    }
    case 'francisque': {
      sp = base('franks', tm, 1.14);
      sp.hair = '#a8743e';
      sp.beard = '#a8743e';
      sp.hairStyle = 'long';
      sp.mail = { c: FRANK.mail, hem: 4.6 };
      sp.sleeves = 'mail';
      sp.weapon = 'francisca';
      sp.back = 'shield';
      sp.shieldFace = tm.main;
      sp.hem = 6.6;
      hold = 'throw';
      break;
    }
    case 'gesate': {
      sp = base('gauls', tm, 1.14);
      sp.naked = true;
      sp.paint = true;
      sp.sleeves = 'bare';
      sp.hair = GAUL.white;
      sp.hairStyle = 'spiky';
      sp.moustache = GAUL.white;
      sp.torque = true;
      sp.legs = { kind: 'bare' };
      sp.shoes = tone(GAUL.skin, -0.25);
      sp.hem = 0;
      sp.loin = tm.main;
      sp.belt = '#6a4020';
      sp.buckle = GOLD;
      sp.cape = tm.main;
      sp.capeLen = 5;
      sp.weapon = 'longsword';
      hold = 'fury';
      break;
    }
    case 'healer': {
      sp = base(civ, tm, 1.06);
      sp.sleeves = 'robe';
      sp.stole = tm.main;
      if (g) {
        sp.robe = '#efeee4';
        sp.hood = '#e6e4d8';
        sp.hairStyle = 'none';
        sp.beard = '#f2f0ea';
        sp.longBeard = true;
        sp.moustache = '#f8f6f0';
        sp.belt = '#b89a5a';
        sp.sickleBelt = true;
        sp.weapon = 'druidStaff';
      } else {
        sp.robe = '#6b4a30';
        sp.hairStyle = 'tonsure';
        sp.hair = FRANK.brown;
        sp.beard = null;
        sp.belt = '#c9b27a';
        sp.weapon = 'crossStaff';
      }
      sp.hem = 10.4;
      hold = 'staff';
      break;
    }
    case 'scout':
    case 'cavalry':
    case 'knight':
      return mountedSpec(type, civ, tm);
    case 'ram':
      return { kind: 'ram', civ, team: tm, box: BOX.ram };
    case 'catapult':
      return { kind: 'catapult', civ, team: tm, box: BOX.catapult };
    default:
      sp = base(civ, tm, 1.0);
      sp.weapon = 'sword';
  }
  return { kind: 'human', sp, hold, box: BOX.human };
}

function mountedSpec(type, civ, tm) {
  const g = civ === 'gauls';
  const P = g ? GAUL : FRANK;
  let sp;
  let horse;
  let hold = 'sword';
  if (type === 'scout') {
    sp = base(civ, tm, 1.04);
    sp.cape = tm.main;
    sp.capeLen = 6;
    if (g) {
      sp.hair = GAUL.red;
      sp.moustache = GAUL.red;
      sp.weapon = 'javelin';
    } else {
      sp.helmet = { kind: 'leather', c: '#6e4a2c' };
      sp.weapon = 'javelin';
    }
    hold = 'spear';
    horse = g
      ? { hz: 0.9, coat: '#b88c55', mane: '#4a3522', socks: '#5a4230', feathers: true, cloth: tm.main }
      : { hz: 0.92, coat: '#a9a49a', mane: '#e8e4dc', dapple: true, cloth: tm.main };
  } else if (type === 'cavalry') {
    sp = base(civ, tm, 1.08);
    sp.mail = { c: P.mail, hem: 3.0 };
    sp.sleeves = 'mail';
    if (g) {
      sp.helmet = { kind: 'agen', c: '#a3a8ab' };
      sp.shield = { kind: 'oval', face: tm.main, s: 0.85 };
      sp.torque = true;
      sp.weapon = 'longsword';
    } else {
      sp.helmet = { kind: 'conical', c: IRON };
      sp.shield = { kind: 'round', face: tm.main, s: 0.85, deco: 'segments' };
      sp.weapon = 'sword';
    }
    horse = g
      ? { hz: 1.0, coat: '#a0582e', mane: '#6a3218', blaze: true, socks: '#f0e8dc', cloth: tm.main }
      : { hz: 1.0, coat: '#7a4a2a', mane: '#221812', socks: '#2a1e16', cloth: tm.main };
  } else {
    sp = base(civ, tm, 1.1);
    sp.mail = { c: P.mail, hem: 3.0 };
    sp.sleeves = 'mail';
    sp.gloves = '#6a4428';
    if (g) {
      sp.helmet = { kind: 'winged', c: GOLD, wing: '#f4f1e8' };
      sp.shield = { kind: 'oval', face: tm.main, s: 0.9, deco: 'boar' };
      sp.torque = true;
      sp.cape = tm.dark;
    } else {
      sp.helmet = { kind: 'crest', c: '#b0b8c0', crest: tm.main, band: GOLD };
      sp.shield = { kind: 'round', face: tm.main, s: 0.9, deco: 'segments' };
      sp.cape = FRANK.fur;
      sp.aventail = FRANK.mail;
    }
    sp.weapon = 'lance';
    hold = 'lance';
    horse = g
      ? { hz: 1.1, coat: '#d8d2c6', mane: '#f2eee6', caparison: tm.main, capTrim: GOLD, capPattern: 'check', armor: '#b0a060' }
      : { hz: 1.12, coat: '#2e2622', mane: '#161210', caparison: tm.main, capTrim: GOLD, capPattern: 'lys', armor: '#b8c0c8' };
  }
  return { kind: 'mounted', sp, hold, horse, box: type === 'knight' ? BOX.knight : BOX.mounted, type };
}
