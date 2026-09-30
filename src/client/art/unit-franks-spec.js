// Costumes des héros et unités spéciales franques (11 types). Chaque costume compose les accessoires communs de
// unit-human.js / unit-horse.js et les parures propres de unit-franks-wear.js (champs x* lus par les crochets HOOKS).
import { team as teamColors } from './palette.js';
import { GOLD } from './unit-gear.js';
import { base } from './unit-base.js';
import { HOOKS, HORSE_HOOKS } from './unit-franks-wear.js';

/** Boîtes de dessin (gauche, haut, droite, bas) : généreuses, le sprite est recadré au plus juste à la cuisson. */
const BOX_HERO = [-44, -72, 50, 10];
const BOX_FOOT = [-34, -58, 38, 10];
const BOX_HORSE = [-46, -92, 76, 12];
const BOX_HORSE_LIGHT = [-40, -80, 62, 10];

const HELM_FLAG = { kind: 'x' }; // valeur truthy : déclenche le crochet de casque (xhelm donne le vrai dessin)

export const TYPES = ['childeric', 'clotilde', 'charles_martel', 'charlemagne', 'roland', 'antrustion', 'leude', 'sergent', 'moine', 'preux', 'arbaletrier_imp'];

/** Hauteur visible (pieds → sommet de la tête) et demi-largeur, px à zoom 1. */
export const METRICS = {
  childeric: { h: 54, w: 20 },
  clotilde: { h: 44, w: 10 },
  charles_martel: { h: 47, w: 13 },
  charlemagne: { h: 48, w: 12 },
  roland: { h: 54, w: 20 },
  antrustion: { h: 37, w: 10 },
  leude: { h: 47, w: 17 },
  sergent: { h: 37, w: 11 },
  moine: { h: 35, w: 9 },
  preux: { h: 54, w: 20 },
  arbaletrier_imp: { h: 37, w: 10 },
};

function human(sp, hold, box, extra) {
  sp.hooks = HOOKS;
  return { kind: 'human', sp, hold, box, ...extra };
}

function mounted(sp, hold, horse, box, extra) {
  sp.hooks = HOOKS;
  horse.hooks = HORSE_HOOKS;
  return { kind: 'mounted', sp, hold, horse, box, ...extra };
}

export function franksSpec(type, teamIdx) {
  const tm = teamColors(teamIdx);
  let sp;
  switch (type) {
    case 'childeric': {
      // Roi salien, père de Clovis : cheval blanc, casque à nasal ceint d'un cercle d'or, abeilles d'or, lance à fanion
      sp = base('franks', tm, 1.14);
      sp.hair = '#8a5a32';
      sp.beard = '#8a5a32';
      sp.hairStyle = 'long';
      sp.mail = { c: '#a9b1b9', hem: 3.2 };
      sp.sleeves = 'mail';
      sp.gloves = '#6a4428';
      sp.tabard = tm.main;
      sp.trim = GOLD;
      sp.helmet = HELM_FLAG;
      sp.xhelm = { kind: 'circlet' };
      sp.cape = tm.dark;
      sp.capeLen = 10;
      sp.capeTrim = '#e8c050';
      sp.bracelet = GOLD;
      sp.shield = { kind: 'round', face: tm.main };
      sp.xshield = { kind: 'bees', s: 0.95 };
      sp.weapon = 'lance';
      sp.pennant = tm.main;
      sp.xlance = { long: 24 };
      sp.xtorso = ['bee'];
      sp.hilt = GOLD;
      const horse = { hz: 1.16, coat: '#ebe8e0', mane: '#d8d2c4', socks: '#d4cfc2', cloth: tm.main, clothTrim: '#e8c050', bridle: '#b8902c', xkind: 'childeric' };
      return mounted(sp, 'lance', horse, BOX_HORSE, { hero: true, ringScale: 1.3 });
    }
    case 'clotilde': {
      // La reine : longue robe bleue, manteau d'équipe, voile blanc et cercle d'or, tresse, haute croix de procession
      sp = base('franks', tm, 1.3);
      sp.hair = '#9a6a3a';
      sp.beard = null;
      sp.hairStyle = 'long';
      sp.sleeves = 'robe';
      sp.robe = '#4d6b91';
      sp.stole = tm.main;
      sp.hem = 11.6;
      sp.belt = '#d8b860';
      sp.buckle = GOLD;
      sp.cape = tm.main;
      sp.capeLen = 13.5;
      sp.capeW = 1.15;
      sp.capeTrim = '#e8c050';
      sp.bracelet = GOLD;
      sp.gloves = '#e6b28a';
      sp.xhead = 'veil';
      sp.xtorso = ['braid'];
      sp.weapon = 'procCross';
      sp.banner = tm.main;
      return human(sp, 'staff', BOX_HERO, { hero: true });
    }
    case 'charles_martel': {
      // Maire du palais : colosse en cotte de mailles, casque rond, col de loup, énorme maillet de guerre
      sp = base('franks', tm, 1.44);
      sp.hair = '#3b2b20';
      sp.beard = '#3b2b20';
      sp.hairStyle = 'long';
      sp.mail = { c: '#7f878f', hem: 7.6 };
      sp.sleeves = 'mail';
      sp.gloves = '#4a3020';
      sp.tabard = tm.main;
      sp.trim = '#b98a38';
      sp.helmet = HELM_FLAG;
      sp.xhelm = { kind: 'round', c: '#7a828b', band: '#a0723a', coif: '#7e868e' };
      sp.aventail = '#7e868e';
      sp.fur = '#4e3e30';
      sp.cape = '#56493d';
      sp.capeLen = 11.5;
      sp.capeW = 1.15;
      sp.capeTrim = '#6b5a48';
      sp.belt = '#3a2618';
      sp.buckle = '#b98a38';
      sp.weapon = 'maul';
      sp.xtorso = ['baldric'];
      sp.hem = 7.8;
      return human(sp, 'maul', BOX_HERO, { hero: true });
    }
    case 'charlemagne': {
      // L'empereur : couronne impériale, barbe blanche, dalmatique d'équipe à orfroi, manteau de pourpre à l'hermine,
      // Joyeuse à la main, globe impérial dans l'autre
      sp = base('franks', tm, 1.4);
      sp.hair = '#ebe8de';
      sp.beard = '#eeeae0';
      sp.longBeard = true;
      sp.hairStyle = 'long';
      sp.brow = '#c8c4b8';
      sp.sleeves = 'long';
      sp.trim2 = GOLD;
      sp.hem = 10;
      sp.belt = '#d8b860';
      sp.buckle = GOLD;
      sp.helmet = HELM_FLAG;
      sp.xhelm = { kind: 'crown' };
      sp.fur = '#f0ece0';
      sp.fibula = GOLD;
      sp.cape = '#6f2a82';
      sp.capeLen = 15;
      sp.capeW = 1.25;
      sp.capeTrim = '#f2eee4';
      sp.bracelet = GOLD;
      sp.gloves = '#e6dcbc';
      sp.weapon = 'joyeuse';
      sp.xfront = 'orb';
      sp.xtorso = ['orphrey', 'ermine'];
      sp.xback = ['ermineCape'];
      return human(sp, 'sword', BOX_HERO, { hero: true });
    }
    case 'roland': {
      // Paladin de Roncevaux : cheval gris pommelé, heaume à plumet, écu peint à chevrons, olifant, Durandal
      sp = base('franks', tm, 1.16);
      sp.hair = '#b08448';
      sp.beard = null;
      sp.hairStyle = 'long';
      sp.mail = { c: '#b4bcc4', hem: 3.2 };
      sp.sleeves = 'mail';
      sp.gloves = '#a4acb4';
      sp.tabard = tm.main;
      sp.trim = GOLD;
      sp.helmet = HELM_FLAG;
      sp.xhelm = { kind: 'round', c: '#c4ccd4', band: GOLD, plume: tm.main };
      sp.aventail = '#9aa2aa';
      sp.cape = '#efe8d6';
      sp.capeLen = 11;
      sp.capeTrim = tm.main;
      sp.bracelet = GOLD;
      sp.shield = { kind: 'round', face: tm.main };
      sp.xshield = { kind: 'heater', s: 0.98 };
      sp.weapon = 'durandal';
      sp.xtorso = ['olifant'];
      const horse = {
        hz: 1.18, coat: '#9ea4aa', mane: '#e9ebee', dapple: true, socks: '#6c7278', caparison: tm.main, capTrim: GOLD,
        capPattern: 'plain', armor: '#c8d0d8', xkind: 'roland', plume: tm.main, bridle: '#3a3a42',
      };
      return mounted(sp, 'sword', horse, BOX_HORSE, { hero: true, ringScale: 1.3 });
    }
    case 'antrustion': {
      // Garde du roi : cotte, casque conique doré à joues, rond bouclier à bordure d'or, cape d'équipe, seax et épée
      sp = base('franks', tm, 1.2);
      sp.hair = '#6a4a2a';
      sp.beard = '#5a3a22';
      sp.hairStyle = 'long';
      sp.mail = { c: '#a4acb4', hem: 5.8 };
      sp.sleeves = 'mail';
      sp.gloves = '#5a3a22';
      sp.tabard = tm.main;
      sp.trim = GOLD;
      sp.sash = '#efe6c8';
      sp.fibula = GOLD;
      sp.bracelet = GOLD;
      sp.helmet = HELM_FLAG;
      sp.xhelm = { kind: 'spang' };
      sp.cape = tm.dark;
      sp.capeLen = 10.5;
      sp.capeTrim = GOLD;
      sp.belt = '#5a3a22';
      sp.buckle = GOLD;
      sp.shield = { kind: 'round', face: tm.main };
      sp.xshield = { kind: 'guard', s: 1.05 };
      sp.weapon = 'sword';
      sp.swordLen = 9;
      sp.hilt = GOLD;
      sp.xtorso = ['seax'];
      sp.hem = 7.2;
      return human(sp, 'sword', BOX_FOOT, {});
    }
    case 'leude': {
      // Cavalier léger du roi : alezan à liste, cape flottante, petit rond bouclier, longue lance à fanion
      sp = base('franks', tm, 1.06);
      sp.hair = '#7a4a28';
      sp.beard = '#7a4a28';
      sp.hairStyle = 'long';
      sp.mail = { c: '#a4acb4', hem: 3.0 };
      sp.sleeves = 'long';
      sp.tabard = tm.main;
      sp.trim = '#e2d6b8';
      sp.helmet = { kind: 'conical', c: '#9aa2ab' };
      sp.cape = tm.dark;
      sp.capeLen = 11;
      sp.capeTrim = '#e2d6b8';
      sp.shield = { kind: 'round', face: tm.main };
      sp.xshield = { kind: 'guard', s: 0.78 };
      sp.weapon = 'lightLance';
      sp.pennant = tm.main;
      const horse = { hz: 0.98, coat: '#8a5232', mane: '#2a1c14', blaze: true, socks: '#e8dcc8', cloth: tm.main, clothTrim: '#efe2b8', xkind: 'leude', plume: tm.main };
      return mounted(sp, 'spear', horse, BOX_HORSE_LIGHT, {});
    }
    case 'sergent': {
      // Sergent d'armes : fantassin lourd, cotte longue et coiffe de mailles, salade de fer, écu en amande, masse d'armes
      sp = base('franks', tm, 1.22);
      sp.hair = '#4a3422';
      sp.beard = '#4a3422';
      sp.mail = { c: '#8f979f', hem: 7.0 };
      sp.sleeves = 'mail';
      sp.gloves = '#5a3a22';
      sp.tabard = tm.main;
      sp.trim = '#e8dcc0';
      sp.emblem = '#f2ead0';
      sp.helmet = { kind: 'kettle', c: '#7f8790' };
      sp.aventail = '#8f979f';
      sp.belt = '#3a2618';
      sp.buckle = '#b98a38';
      sp.shield = { kind: 'round', face: tm.main };
      sp.xshield = { kind: 'kite', s: 1.08 };
      sp.weapon = 'mace';
      sp.hem = 7.2;
      return human(sp, 'sword', BOX_FOOT, {});
    }
    case 'moine': {
      // Moine soldat : bure sombre, tonsure et barbe, gorgerin de mailles, scapulaire d'équipe à croix, gantelets, bâton ferré
      sp = base('franks', tm, 1.14);
      sp.sleeves = 'robe';
      sp.robe = '#3d342c';
      sp.hem = 10.2;
      sp.hairStyle = 'tonsure';
      sp.hair = '#5a3a22';
      sp.beard = '#5a3a22';
      sp.gloves = '#6a7078';
      sp.belt = '#d8c48e';
      sp.buckle = '#b89a5a';
      sp.scapular = tm.main;
      sp.xtorso = ['mailCollar', 'scapular', 'ropeTail'];
      sp.xback = ['cowl'];
      sp.weapon = 'ironStaff';
      return human(sp, 'pole', BOX_FOOT, {});
    }
    case 'preux': {
      // Chevalier d'élite : grand heaume à plumet d'équipe, écu à fleur de lys, cheval bai caparaçonné et bardé d'acier
      sp = base('franks', tm, 1.12);
      sp.hair = '#6a4a2a';
      sp.mail = { c: '#b4bcc4', hem: 3.2 };
      sp.sleeves = 'mail';
      sp.gloves = '#9aa2aa';
      sp.tabard = tm.main;
      sp.trim = GOLD;
      sp.helmet = HELM_FLAG;
      sp.xhelm = { kind: 'great', c: '#bcc4cc', band: GOLD, plume: tm.main };
      sp.cape = '#ece6d6';
      sp.capeLen = 10.5;
      sp.capeTrim = GOLD;
      sp.shield = { kind: 'round', face: tm.main };
      sp.xshield = { kind: 'knight', s: 0.98 };
      sp.weapon = 'lance';
      sp.pennant = tm.main;
      sp.xlance = { long: 26 };
      sp.xtorso = ['fleur'];
      const horse = {
        hz: 1.22, coat: '#5a3424', mane: '#1a1410', blaze: true, socks: '#e0d6c4', caparison: tm.main, capTrim: '#f0c84a',
        capPattern: 'plain', armor: '#c6ced6', xkind: 'preux', plume: tm.main,
      };
      return mounted(sp, 'lance', horse, BOX_HORSE, {});
    }
    case 'arbaletrier_imp': {
      // Arbalétrier impérial : brigandine d'équipe rivetée, salade de fer, grande arbalète à cranequin
      sp = base('franks', tm, 1.15);
      sp.hair = '#5a3a22';
      sp.beard = '#5a3a22';
      sp.mail = { c: '#9aa2aa', hem: 5.2 };
      sp.sleeves = 'mail';
      sp.gloves = '#5a3a22';
      sp.brigandine = tm.main;
      sp.helmet = HELM_FLAG;
      sp.xhelm = { kind: 'sallet', c: '#9aa3ac', wrap: tm.dark };
      sp.aventail = '#9aa2aa';
      sp.belt = '#4a3020';
      sp.buckle = GOLD;
      sp.weapon = 'xbowImp';
      sp.xtorso = ['brigandine'];
      sp.hem = 6.2;
      return human(sp, 'xbow', BOX_FOOT, {});
    }
    default:
      return null;
  }
}
