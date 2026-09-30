// Unités ajoutées (gauls) : cinq héros (Brennus, Ambiorix, Camulogène, Divico, Commios) et six unités spéciales
// (frondeur, molosse, barde, essédaire, soldurius, baliste). Voir unit-ext.js pour le contrat du module.
import { teamColors, base, GAUL, BOX } from './unit-base.js';
import { tone } from './unit-kit.js';
import { GOLD, BRONZE } from './unit-gear.js';
import { HELMS, HEADS, TORSOS, BACKS, FRONTS, gaulWeapon, decoIronRim, decoGold, decoBronze } from './unit-gauls-gear.js';
import './unit-gauls-poses.js';
import { DOG, dogSpec } from './unit-dog.js';
import { CHARIOT, chariotSpec } from './unit-chariot.js';
import { BALISTE, balisteSpec } from './unit-baliste.js';

export const TYPES = ['brennus', 'ambiorix', 'camulogene', 'divico', 'commios', 'frondeur', 'molosse', 'barde', 'essedaire', 'soldurius', 'baliste'];

export const METRICS = {
  brennus: { h: 46, w: 12 },
  ambiorix: { h: 43, w: 11 },
  camulogene: { h: 44, w: 12 },
  divico: { h: 46, w: 11 },
  commios: { h: 44, w: 11 },
  frondeur: { h: 34, w: 9 },
  molosse: { h: 18, w: 12 },
  barde: { h: 36, w: 9 },
  essedaire: { h: 46, w: 34 },
  soldurius: { h: 38, w: 10 },
  baliste: { h: 38, w: 26 },
};

export const KINDS = { dog: DOG, chariot: CHARIOT, baliste: BALISTE };

/** Crochets de dessin d'un costume : helmet, head, torso, back, front (clés des tables de unit-gauls-gear.js). */
function hooks(o) {
  const h = { weapon: gaulWeapon };
  if (o.helmet) h.helmet = HELMS[o.helmet];
  if (o.head) h.head = HEADS[o.head];
  if (o.torso) h.torso = TORSOS[o.torso];
  if (o.back) h.back = BACKS[o.back];
  if (o.front) h.front = FRONTS[o.front];
  return h;
}

function human(type, tm) {
  let sp;
  let hold = 'sword';
  let hero = false;
  switch (type) {
    case 'brennus': {
      // Sénon : colosse roux, casque de bronze à cornes, peau de loup, grande épée à deux mains, boucliers pris à l'ennemi
      sp = base('gauls', tm, 1.42);
      sp.hair = '#b8452a';
      sp.hairStyle = 'long';
      sp.moustache = '#b8452a';
      sp.moustacheLong = true;
      sp.beard = '#a83c24';
      sp.tunic = tm.main;
      sp.sleeves = 'short';
      sp.legs = { kind: 'check', c1: '#5a6a34', c2: '#8a5a30' };
      sp.helmet = { kind: 'custom' };
      sp.torque = true;
      sp.bracelet = BRONZE;
      sp.gloves = '#5a3a22';
      sp.belt = '#4a2e1a';
      sp.buckle = BRONZE;
      sp.weapon = 'greatsword';
      sp.hilt = BRONZE;
      sp.cape = '#77736a';
      sp.capeLen = 11;
      sp.capeW = 1.2;
      sp.capeTrim = '#bdb8aa';
      sp.hem = 4.6;
      sp.hooks = hooks({ helmet: 'horned', torso: 'wolf', back: 'trophies' });
      hold = 'great';
      hero = true;
      break;
    }
    case 'ambiorix': {
      // Éburon : agile, cape verte, bonnet de cuir, javelots
      sp = base('gauls', tm, 1.27);
      sp.hair = '#5a3a22';
      sp.moustache = '#5a3a22';
      sp.helmet = { kind: 'custom' };
      sp.cape = '#4f7f3a';
      sp.capeLen = 11;
      sp.capeW = 1.08;
      sp.capeTrim = '#d8c47a';
      sp.torque = true;
      sp.bracelet = BRONZE;
      sp.legs = { kind: 'check', c1: '#45672f', c2: '#7a6a34' };
      sp.shoes = '#4a2e1a';
      sp.weapon = 'jav';
      sp.hem = 3.6;
      sp.hooks = hooks({ helmet: 'bonnet', torso: 'scout', back: 'javelins' });
      hold = 'jav';
      hero = true;
      break;
    }
    case 'camulogene': {
      // Parisii : vétéran en cotte de mailles, casque d'Agen, cheveux gris, grand bouclier
      sp = base('gauls', tm, 1.33);
      sp.hair = '#c2c0b8';
      sp.moustache = '#d2d0c8';
      sp.moustacheLong = true;
      sp.mail = { c: '#9da3a6', hem: 6.4 };
      sp.sleeves = 'mail';
      sp.gloves = '#5a3a22';
      sp.tabard = tm.main;
      sp.trim = '#e8e0cc';
      sp.legs = { kind: 'check', c1: '#6a6a44', c2: '#8a7a4a' };
      sp.helmet = { kind: 'custom' };
      sp.shield = { kind: 'hex', face: tm.main, s: 1.3, deco: decoIronRim };
      sp.weapon = 'longsword';
      sp.belt = '#3a2614';
      sp.buckle = GOLD;
      sp.hilt = GOLD;
      sp.hem = 6.0;
      sp.hooks = hooks({ helmet: 'agen', torso: 'mantle' });
      hero = true;
      break;
    }
    case 'divico': {
      // Helvète : armure de parade dorée, casque ailé, cheveux et moustaches blancs, longue épée
      sp = base('gauls', tm, 1.36);
      sp.hair = '#f0ecdf';
      sp.hairStyle = 'long';
      sp.moustache = '#f4f0e6';
      sp.moustacheLong = true;
      sp.plate = GOLD;
      sp.tunic = tm.main;
      sp.sleeves = 'long';
      sp.trim2 = GOLD;
      sp.bracelet = GOLD;
      sp.gloves = '#6a4428';
      sp.legs = { kind: 'check', c1: '#8a6a2a', c2: '#c9a44a' };
      sp.shoes = '#5a3a1c';
      sp.helmet = { kind: 'custom', crest: '#c8302a' };
      sp.cape = tm.main;
      sp.capeLen = 9;
      sp.capeW = 1.1;
      sp.capeTrim = GOLD;
      sp.weapon = 'royalsword';
      sp.hem = 4.4;
      sp.belt = '#5a3a1c';
      sp.buckle = GOLD;
      sp.hooks = hooks({ helmet: 'wings', torso: 'gold' });
      hero = true;
      break;
    }
    case 'commios': {
      // Atrébate : noble au riche manteau à carreaux, diadème, torque épais, épée et bouclier ornés
      sp = base('gauls', tm, 1.31);
      sp.hair = '#e8c25a';
      sp.hairStyle = 'long';
      sp.moustache = '#e8c25a';
      sp.moustacheLong = true;
      sp.tunic = tm.main;
      sp.trim2 = GOLD;
      sp.bracelet = GOLD;
      sp.fibula = GOLD;
      sp.cape = '#2f6a66';
      sp.capeCheck = ['#2f6a66', '#d9b25a'];
      sp.capeLen = 13.5;
      sp.capeW = 1.2;
      sp.capeTrim = GOLD;
      sp.legs = { kind: 'check', c1: '#2f6a66', c2: '#b9944a' };
      sp.shield = { kind: 'oval', face: tm.main, s: 1.2, deco: decoGold };
      sp.weapon = 'noblesword';
      sp.belt = '#3a2614';
      sp.buckle = GOLD;
      sp.hem = 5.0;
      sp.hooks = hooks({ head: 'diadem', torso: 'noble' });
      hero = true;
      break;
    }
    case 'frondeur': {
      // tunique simple, fronde de cuir, gibecière de galets, bandeau
      sp = base('gauls', tm, 1.07);
      sp.hair = '#e6d9a8';
      sp.hairStyle = 'swept';
      sp.moustache = '#c8672c';
      sp.moustacheLong = true;
      sp.sleeves = 'short';
      sp.belt = '#5a3920';
      sp.weapon = 'sling';
      sp.headband = tone(tm.main, -0.1);
      sp.hem = 3.8;
      sp.hooks = hooks({ head: 'band', torso: 'slinger' });
      hold = 'sling';
      break;
    }
    case 'barde': {
      // joueur de carnyx : manteau clair, cheveux longs, couronne de chêne
      sp = base('gauls', tm, 1.1);
      sp.hair = '#e6b94e';
      sp.hairStyle = 'long';
      sp.moustache = '#e6b94e';
      sp.moustacheLong = true;
      sp.cape = '#eee4c4';
      sp.capeLen = 12;
      sp.capeW = 1.1;
      sp.capeTrim = tm.main;
      sp.torque = true;
      sp.belt = '#b89a5a';
      sp.buckle = GOLD;
      sp.weapon = 'carnyx';
      sp.hem = 7.2;
      sp.hooks = hooks({ head: 'wreath' });
      hold = 'staff';
      break;
    }
    case 'soldurius': {
      // guerrier voué : torse nu peint, bronze, casque à cimier, bouclier hexagonal
      sp = base('gauls', tm, 1.22);
      sp.naked = true;
      sp.paint = true;
      sp.sleeves = 'bare';
      sp.hair = '#3a2a1e';
      sp.hairStyle = 'long';
      sp.moustache = '#3a2a1e';
      sp.moustacheLong = true;
      sp.torque = true;
      sp.bracelet = BRONZE;
      sp.legs = { kind: 'bare' };
      sp.shoes = tone(GAUL.skin, -0.25);
      sp.hem = 0;
      sp.loin = tm.main;
      sp.belt = '#5a3920';
      sp.buckle = BRONZE;
      sp.helmet = { kind: 'custom', crest: tm.main };
      sp.shield = { kind: 'hex', face: tm.main, s: 1.08, deco: decoBronze };
      sp.weapon = 'bronzesword';
      sp.hooks = hooks({ helmet: 'crest', torso: 'straps', front: 'greaves' });
      break;
    }
    default:
      return null;
  }
  const out = { kind: 'human', sp, hold, box: hero ? BOX.hero : BOX.human };
  if (hero) out.hero = true;
  else out.box = [-28, -56, 30, 8];
  return out;
}

export function spec(type, civ, teamIdx) {
  void civ;
  const tm = teamColors(teamIdx);
  switch (type) {
    case 'molosse':
      return dogSpec(tm);
    case 'essedaire':
      return chariotSpec(tm);
    case 'baliste':
      return balisteSpec(tm);
    default:
      return human(type, tm);
  }
}
