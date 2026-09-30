// Costumes spartiates : les 13 unités propres (unique, héros, spéciales) et le costume des unités de base quand civ === 'sparta'
// (hilote, péltaste, hoplite, xiphophore, Spartiate, archer crétois, gastraphète, cavaliers, prêtre d'Asclépios, bateaux).
// Couleur d'équipe : tunique, cape et champ du hoplon ; crinière rouge et bronze restent ceux de Sparte.
import { team as teamColors } from './palette.js';
import { BRONZE, GOLD } from './unit-gear.js';
import { base, BOX } from './unit-base.js';
import { balisteSpec } from './unit-baliste.js';
import { HOOKS, BRONZE_S, CREST_RED } from './unit-sparta-wear.js';
import { unitSpec } from './unit-specs.js';

const BOX_HERO = [-44, -74, 50, 10];
const BOX_FOOT = [-34, -60, 38, 10];
const BOX_HORSE = [-46, -92, 76, 12];

const CRIMSON = '#a8222a';
const HELM_FLAG = { kind: 'x' }; // valeur truthy : déclenche le crochet de casque (xhelm donne le vrai dessin)

export const TYPES = [
  'sp_lochage', 'sp_brasidas', 'sp_gorgo', 'sp_leonidas', 'sp_lysandre', 'sp_agesilas', 'sp_pausanias',
  'sp_lacedemonien', 'sp_skirite', 'sp_hilote', 'sp_hippeus', 'sp_homoios', 'sp_oxybele',
];

export const METRICS = {
  sp_lochage: { h: 44, w: 12 },
  sp_brasidas: { h: 50, w: 13 },
  sp_gorgo: { h: 45, w: 10 },
  sp_leonidas: { h: 54, w: 14 },
  sp_lysandre: { h: 47, w: 12 },
  sp_agesilas: { h: 53, w: 14 },
  sp_pausanias: { h: 54, w: 14 },
  sp_lacedemonien: { h: 41, w: 11 },
  sp_skirite: { h: 36, w: 9 },
  sp_hilote: { h: 34, w: 9 },
  sp_hippeus: { h: 54, w: 19 },
  sp_homoios: { h: 49, w: 13 },
  sp_oxybele: { h: 38, w: 26 },
};

/** Fantassin spartiate de départ : chiton court, jambes nues, sandales, cheveux longs, bras nus. */
function sb(tm, z) {
  const sp = base('franks', tm, z);
  sp.hem = 3.8;
  sp.legs = { kind: 'bare' };
  sp.shoes = '#7a5232';
  sp.sleeves = 'bare';
  sp.hair = '#5a3a22';
  sp.beard = '#4a3020';
  sp.hairStyle = 'long';
  sp.belt = '#6a4020';
  sp.buckle = BRONZE;
  sp.trim2 = '#e8d8a0';
  sp.hooks = HOOKS;
  return sp;
}

function corinth(sp, o) {
  sp.helmet = HELM_FLAG;
  sp.xhelm = { kind: 'corinth', ...o };
}

function human(sp, hold, box, extra) {
  return { kind: 'human', sp, hold, box: box || BOX.human, ...extra };
}

function mounted(sp, hold, horse, box, extra) {
  return { kind: 'mounted', sp, hold, horse, box, ...extra };
}

/** Unités propres à Sparte (null pour un autre type). */
export function spartaSpec(type, teamIdx) {
  const tm = teamColors(teamIdx);
  let sp;
  switch (type) {
    case 'sp_lochage': {
      // Officier de la phalange : crinière transversale, cuirasse de bronze, manteau rouge court, hoplon orné
      sp = sb(tm, 1.22);
      corinth(sp, { c: '#b98a3c', crest: CREST_RED, trans: true, crestH: 3.6, trim: GOLD });
      sp.xtorso = ['cuirass'];
      sp.cape = tm.dark;
      sp.capeLen = 10.5;
      sp.capeTrim = '#e8c050';
      sp.bracelet = GOLD;
      sp.shield = { kind: 'round', face: tm.main };
      sp.xshield = { s: 1.14, lambda: '#f8e8a0', rim: '#d2ac52', emblem: GOLD };
      sp.weapon = 'spear';
      sp.spearFwd = 12.5;
      sp.spearBack = 8;
      return human(sp, 'spear', BOX_FOOT, {});
    }
    case 'sp_brasidas': {
      // Stratège : casque à haute crinière, cuirasse de bronze, manteau écarlate, épée courte
      sp = sb(tm, 1.34);
      sp.hair = '#6a4a2a';
      sp.beard = '#5a3a22';
      corinth(sp, { c: '#c49a48', crest: CREST_RED, crestH: 4.2, trim: GOLD });
      sp.xtorso = ['cuirass'];
      sp.cape = CRIMSON;
      sp.capeLen = 12.5;
      sp.capeW = 1.1;
      sp.capeTrim = '#e8c050';
      sp.bracelet = GOLD;
      sp.shield = { kind: 'round', face: tm.main };
      sp.xshield = { s: 1.12, lambda: '#f8e8a0', rim: '#d2ac52' };
      sp.weapon = 'sword';
      sp.swordLen = 9.5;
      sp.hilt = GOLD;
      return human(sp, 'sword', BOX_HERO, { hero: true });
    }
    case 'sp_gorgo': {
      // La reine : peplos clair, manteau d'équipe, diadème et voile, bâton d'olivier (pas d'arme)
      sp = sb(tm, 1.3);
      sp.hair = '#4a2e1c';
      sp.beard = null;
      sp.sleeves = 'robe';
      sp.robe = '#eee9dc';
      sp.stole = tm.main;
      sp.hem = 11.6;
      sp.belt = '#d8b860';
      sp.buckle = GOLD;
      sp.cape = tm.main;
      sp.capeLen = 12.5;
      sp.capeW = 1.1;
      sp.capeTrim = '#e8c050';
      sp.bracelet = GOLD;
      sp.gloves = '#e6b28a';
      sp.helmet = HELM_FLAG;
      sp.xhelm = { kind: 'diadem', c: GOLD, veil: '#f3efe4' };
      sp.xtorso = ['ephod'];
      sp.weapon = 'oliveStaff';
      return human(sp, 'staff', BOX_HERO, { hero: true });
    }
    case 'sp_leonidas': {
      // Le roi des Trois Cents : casque à crinière transversale, cuirasse d'or pâle, grand manteau rouge, énorme hoplon
      sp = sb(tm, 1.42);
      sp.hair = '#3a281a';
      sp.beard = '#3a281a';
      sp.brow = '#2a1c12';
      corinth(sp, { c: '#d0a648', crest: CREST_RED, trans: true, crestH: 4.6, trim: GOLD });
      sp.xtorso = ['cuirass'];
      sp.xcuirass = '#cfa444';
      sp.xpteruges = tm.dark;
      sp.cape = CRIMSON;
      sp.capeLen = 14.5;
      sp.capeW = 1.2;
      sp.capeTrim = '#f0c84a';
      sp.bracelet = GOLD;
      sp.shield = { kind: 'round', face: tm.main };
      sp.xshield = { s: 1.3, lambda: '#f8e8a0', rim: '#e0b850', emblem: GOLD };
      sp.weapon = 'spear';
      sp.spearFwd = 14;
      sp.spearBack = 8.5;
      sp.xspear = '#e6c060';
      return human(sp, 'spear', BOX_HERO, { hero: true });
    }
    case 'sp_lysandre': {
      // Amiral : couronne de laurier de la victoire, cuirasse de lin, manteau d'équipe, épée et hoplon
      sp = sb(tm, 1.34);
      sp.hair = '#7a5a34';
      sp.beard = '#6a4a2a';
      sp.helmet = HELM_FLAG;
      sp.xhelm = { kind: 'laurel', c: '#6a9a40' };
      sp.xtorso = ['linen'];
      sp.xtrim = tm.main;
      sp.cape = tm.main;
      sp.capeLen = 12.5;
      sp.capeW = 1.1;
      sp.capeTrim = '#e8d8a0';
      sp.bracelet = GOLD;
      sp.shield = { kind: 'round', face: tm.main };
      sp.xshield = { s: 1.05, lambda: '#f8e8a0', rim: '#d2ac52', emblem: GOLD };
      sp.weapon = 'sword';
      sp.swordLen = 9.5;
      sp.hilt = GOLD;
      return human(sp, 'sword', BOX_HERO, { hero: true });
    }
    case 'sp_agesilas': {
      // Le vieux roi : barbe blanche, casque doré à crinière blanche, manteau pourpre, hoplon doré
      sp = sb(tm, 1.4);
      sp.hair = '#ebe6da';
      sp.beard = '#eeeae0';
      sp.longBeard = true;
      sp.brow = '#c8c4b8';
      corinth(sp, { c: '#dcb44e', crest: '#f2ecdc', crestH: 4.4, trim: '#fff0b0' });
      sp.xtorso = ['cuirass'];
      sp.xcuirass = '#d8b04a';
      sp.xpteruges = '#7a2034';
      sp.cape = '#842238';
      sp.capeLen = 14.5;
      sp.capeW = 1.25;
      sp.capeTrim = '#f0c84a';
      sp.bracelet = GOLD;
      sp.shield = { kind: 'round', face: tm.main };
      sp.xshield = { s: 1.22, lambda: '#fff0b0', rim: '#e8c050', emblem: GOLD };
      sp.weapon = 'sword';
      sp.swordLen = 10;
      sp.hilt = GOLD;
      return human(sp, 'sword', BOX_HERO, { hero: true });
    }
    case 'sp_pausanias': {
      // Régent vainqueur de Platées : armure argentée, haute crinière d'équipe, manteau clair, lance de parade
      sp = sb(tm, 1.4);
      sp.hair = '#2e2018';
      sp.beard = '#2e2018';
      corinth(sp, { c: '#c6ced6', crest: tm.main, crestH: 4.8, trim: GOLD });
      sp.xtorso = ['cuirass'];
      sp.xcuirass = '#c4ccd4';
      sp.xpteruges = tm.dark;
      sp.cape = '#efe8d8';
      sp.capeLen = 14.5;
      sp.capeW = 1.2;
      sp.capeTrim = tm.main;
      sp.bracelet = GOLD;
      sp.shield = { kind: 'round', face: tm.main };
      sp.xshield = { s: 1.28, lambda: '#f4ead0', rim: '#d8dde2', emblem: '#d8dde2' };
      sp.weapon = 'spear';
      sp.spearFwd = 14;
      sp.spearBack = 8.5;
      sp.xspear = '#e4e8ec';
      return human(sp, 'spear', BOX_HERO, { hero: true });
    }
    case 'sp_lacedemonien': {
      // Hoplite de ligne lourdement équipé : casque à crinière, cuirasse, manteau court, hoplon
      sp = sb(tm, 1.18);
      corinth(sp, { c: '#b07e36', crest: CREST_RED, crestH: 3.2 });
      sp.xtorso = ['cuirass'];
      sp.xcuirass = '#a8793a';
      sp.cape = tm.dark;
      sp.capeLen = 8.5;
      sp.capeTrim = '#e8c050';
      sp.shield = { kind: 'round', face: tm.main };
      sp.xshield = { s: 1.1, rim: '#c9a04a' };
      sp.weapon = 'spear';
      sp.spearFwd = 12.5;
      sp.spearBack = 8;
      return human(sp, 'spear', BOX_FOOT, {});
    }
    case 'sp_skirite': {
      // Skiritès : montagnard léger, bonnet de feutre, tunique écourtée, javelot, petit bouclier dans le dos
      sp = sb(tm, 1.1);
      sp.hair = '#6a4a2a';
      sp.beard = '#6a4a2a';
      sp.helmet = HELM_FLAG;
      sp.xhelm = { kind: 'pilos', c: '#b8a27a', band: '#8a4a30' };
      sp.hem = 3.0;
      sp.xtorso = ['baldric'];
      sp.back = 'shield';
      sp.shieldFace = tm.main;
      sp.weapon = 'javelin';
      sp.belt = '#5a3a20';
      return human(sp, 'throw', BOX_FOOT, {});
    }
    case 'sp_hilote': {
      // Hilote armé : bonnet de peau, cape courte d'équipe, petit bouclier d'osier, faucille
      sp = sb(tm, 1.08);
      sp.hair = '#5a4026';
      sp.beard = '#5a4026';
      sp.tunic = '#8a7550';
      sp.helmet = { kind: 'leather', c: '#8a6a42' };
      sp.cape = tm.main;
      sp.capeLen = 6.5;
      sp.capeTrim = null;
      sp.hem = 3.2;
      sp.sash = tm.main;
      sp.shield = { kind: 'round', face: '#a8844e' };
      sp.xshield = { s: 0.72, rim: '#6a4a2a', lambda: 'none' };
      sp.weapon = 'sickle';
      return human(sp, 'sword', BOX_FOOT, {});
    }
    case 'sp_hippeus': {
      // Garde à cheval du roi : casque à crinière, cuirasse de lin, cape longue d'équipe, lance, petit hoplon
      sp = sb(tm, 1.1);
      corinth(sp, { c: '#b98a3c', crest: CREST_RED, trans: true, crestH: 3.2 });
      sp.xtorso = ['linen'];
      sp.xtrim = tm.main;
      sp.cape = tm.main;
      sp.capeLen = 11.5;
      sp.capeTrim = '#e8c050';
      sp.shield = { kind: 'round', face: tm.main };
      sp.xshield = { s: 0.8, rim: '#c9a04a' };
      sp.weapon = 'spear';
      sp.spearFwd = 15;
      sp.spearBack = 6;
      const horse = { hz: 1.04, coat: '#7a4a2a', mane: '#1e140e', blaze: true, socks: '#e8dcc8', cloth: tm.main, clothTrim: '#e8c050' };
      return mounted(sp, 'spear', horse, BOX_HORSE, {});
    }
    case 'sp_homoios': {
      // Spartiate de plein droit : haute crinière, cuirasse sombre, manteau rouge, grand hoplon, lance
      sp = sb(tm, 1.3);
      sp.hair = '#4a3020';
      sp.beard = '#3a281a';
      corinth(sp, { c: '#c2933e', crest: CREST_RED, crestH: 4.0, trim: GOLD });
      sp.xtorso = ['cuirass'];
      sp.xcuirass = '#b58838';
      sp.xpteruges = tm.dark;
      sp.cape = CRIMSON;
      sp.capeLen = 13;
      sp.capeW = 1.12;
      sp.capeTrim = '#e8c050';
      sp.bracelet = GOLD;
      sp.shield = { kind: 'round', face: tm.main };
      sp.xshield = { s: 1.22, lambda: '#f8e8a0', rim: '#d2ac52', emblem: GOLD };
      sp.weapon = 'spear';
      sp.spearFwd = 13;
      sp.spearBack = 8.5;
      return human(sp, 'spear', BOX_HERO, {});
    }
    case 'sp_oxybele': {
      // Baliste grecque : même machine que la baliste gauloise, servie par un Laconien en pilos
      const s = balisteSpec(tm);
      const sv = sb(tm, 1.0);
      sv.helmet = HELM_FLAG;
      sv.xhelm = { kind: 'pilos', c: '#b8a27a', band: '#8a4a30' };
      sv.weapon = null;
      sv.hem = 3.6;
      s.bal = { ...s.bal, servant: sv };
      return { ...s, type: 'sp_oxybele' };
    }
    default:
      return null;
  }
}

/** Costume spartiate des unités de base (null pour les types qui gardent le style de base : béliers, catapultes…). */
export function spartaBase(type, teamIdx) {
  const tm = teamColors(teamIdx);
  let sp;
  switch (type) {
    case 'villager': {
      // Hilote : chiton court d'équipe, bonnet de peau
      sp = sb(tm, 1.0);
      sp.hair = '#6a4a2a';
      sp.beard = '#6a4a2a';
      sp.helmet = { kind: 'leather', c: '#9a7a52' };
      sp.hem = 3.4;
      sp.weapon = 'axe';
      return human(sp, 'tool', undefined, {});
    }
    case 'militia': {
      // Péltaste : pilos, chiton court, petit hoplon, épée courte
      sp = sb(tm, 1.09);
      sp.helmet = HELM_FLAG;
      sp.xhelm = { kind: 'pilos', c: '#c4b088', band: '#8a4a30' };
      sp.shield = { kind: 'round', face: tm.main };
      sp.xshield = { s: 0.8, rim: '#9a7a44', lambda: 'none' };
      sp.weapon = 'sword';
      sp.swordLen = 6.5;
      return human(sp, 'sword', undefined, {});
    }
    case 'spearman': {
      // Hoplite : casque corinthien à crinière rouge, hoplon, lance courte, manteau d'équipe
      sp = sb(tm, 1.12);
      corinth(sp, { c: '#b98a3c', crest: CREST_RED, crestH: 3.0 });
      sp.cape = tm.dark;
      sp.capeLen = 8;
      sp.shield = { kind: 'round', face: tm.main };
      sp.xshield = { s: 1.04, rim: '#c9a04a' };
      sp.weapon = 'spear';
      sp.spearFwd = 12;
      sp.spearBack = 9;
      return human(sp, 'spear', undefined, {});
    }
    case 'swordsman': {
      // Xiphophore : linothorax, casque à crinière transversale, hoplon, xiphos
      sp = sb(tm, 1.15);
      corinth(sp, { c: '#a8793a', crest: CREST_RED, trans: true, crestH: 3.0 });
      sp.xtorso = ['linen'];
      sp.xtrim = tm.main;
      sp.cape = tm.dark;
      sp.capeLen = 8.5;
      sp.shield = { kind: 'round', face: tm.main };
      sp.xshield = { s: 1.08, rim: '#c9a04a' };
      sp.weapon = 'sword';
      sp.swordLen = 8;
      sp.hilt = GOLD;
      return human(sp, 'sword', undefined, {});
    }
    case 'champion': {
      // Spartiate : cuirasse de bronze, grande crinière, manteau écarlate, hoplon au lambda d'or
      sp = sb(tm, 1.24);
      corinth(sp, { c: '#c49a48', crest: CREST_RED, crestH: 4.0, trim: GOLD });
      sp.xtorso = ['cuirass'];
      sp.xpteruges = tm.dark;
      sp.cape = CRIMSON;
      sp.capeLen = 12;
      sp.capeW = 1.1;
      sp.capeTrim = '#e8c050';
      sp.bracelet = GOLD;
      sp.shield = { kind: 'round', face: tm.main };
      sp.xshield = { s: 1.18, lambda: '#f8e8a0', rim: '#d2ac52', emblem: GOLD };
      sp.weapon = 'sword';
      sp.swordLen = 9;
      sp.hilt = GOLD;
      return human(sp, 'sword', undefined, {});
    }
    case 'archer': {
      // Archer crétois : pilos, chiton court, carquois
      sp = sb(tm, 1.08);
      sp.helmet = HELM_FLAG;
      sp.xhelm = { kind: 'pilos', c: '#c4b088', band: '#8a4a30' };
      sp.weapon = 'bow';
      sp.back = 'quiver';
      sp.hem = 3.4;
      return human(sp, 'bow', undefined, {});
    }
    case 'crossbow': {
      // Gastraphète : arbalète de ventre, linothorax, pilos
      sp = sb(tm, 1.11);
      sp.helmet = HELM_FLAG;
      sp.xhelm = { kind: 'pilos', c: '#b8a27a', band: tm.main };
      sp.xtorso = ['linen'];
      sp.xtrim = tm.main;
      sp.weapon = 'crossbow';
      sp.back = 'quiver';
      return human(sp, 'xbow', undefined, {});
    }
    case 'healer': {
      // Prêtre d'Asclépios : robe claire, couronne de laurier, bâton au serpent
      sp = sb(tm, 1.06);
      sp.sleeves = 'robe';
      sp.robe = '#eee9dc';
      sp.stole = tm.main;
      sp.hem = 10.4;
      sp.hair = '#6a4a2a';
      sp.beard = '#6a4a2a';
      sp.belt = '#c9b27a';
      sp.helmet = HELM_FLAG;
      sp.xhelm = { kind: 'laurel', c: '#6a9a40' };
      sp.weapon = 'serpentStaff';
      return human(sp, 'staff', undefined, {});
    }
    case 'scout':
    case 'cavalry':
    case 'knight': {
      const f = unitSpec(type, 'franks', teamIdx);
      if (type === 'scout') {
        sp = sb(tm, 1.04);
        sp.helmet = HELM_FLAG;
        sp.xhelm = { kind: 'pilos', c: '#c4b088', band: '#8a4a30' };
        sp.cape = tm.main;
        sp.capeLen = 6;
        sp.weapon = 'javelin';
        f.horse = { hz: 0.92, coat: '#9a7a52', mane: '#3a2a1a', socks: '#6a5034', cloth: tm.main };
      } else if (type === 'cavalry') {
        sp = sb(tm, 1.08);
        corinth(sp, { c: '#a8793a', crest: CREST_RED, trans: true, crestH: 3.0 });
        sp.xtorso = ['linen'];
        sp.xtrim = tm.main;
        sp.cape = tm.dark;
        sp.capeLen = 9;
        sp.shield = { kind: 'round', face: tm.main };
        sp.xshield = { s: 0.8, rim: '#c9a04a' };
        sp.weapon = 'sword';
        f.horse = { hz: 1.0, coat: '#6a3e26', mane: '#1e140e', blaze: true, socks: '#e8dcc8', cloth: tm.main, clothTrim: '#e8c050' };
      } else {
        sp = sb(tm, 1.1);
        corinth(sp, { c: '#c49a48', crest: CREST_RED, crestH: 3.6, trim: GOLD });
        sp.xtorso = ['cuirass'];
        sp.xpteruges = tm.dark;
        sp.cape = CRIMSON;
        sp.capeLen = 11;
        sp.capeTrim = '#e8c050';
        sp.shield = { kind: 'round', face: tm.main };
        sp.xshield = { s: 0.88, lambda: '#f8e8a0', rim: '#d2ac52' };
        sp.weapon = 'lance';
        f.horse = {
          hz: 1.1, coat: '#2e2622', mane: '#161210', blaze: true, caparison: tm.main, capTrim: '#e8c050', capPattern: 'plain', armor: '#c8a050',
        };
      }
      return { ...f, sp };
    }
    case 'fishingboat': {
      const f = unitSpec(type, 'franks', teamIdx);
      const fs = sb(tm, 0.9);
      fs.weapon = null;
      fs.helmet = { kind: 'leather', c: '#9a7a52' };
      fs.hem = 3.0;
      return { ...f, sp: fs };
    }
    case 'warship': {
      const f = unitSpec(type, 'franks', teamIdx);
      const fs = sb(tm, 0.9);
      fs.weapon = null;
      fs.hem = 3.0;
      const ar = sb(tm, 0.84);
      ar.helmet = HELM_FLAG;
      ar.xhelm = { kind: 'corinth', c: '#b98a3c', crest: CREST_RED, crestH: 2.6 };
      ar.weapon = 'bow';
      ar.back = 'quiver';
      ar.hem = 3.0;
      return { ...f, sp: fs, archer: ar };
    }
    default:
      return null;
  }
}

void BRONZE_S;
