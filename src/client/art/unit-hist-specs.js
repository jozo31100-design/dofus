// Costumes historiques des unités de base des deux peuples du jeu : Gaulois (La Tène finale, Ier s. av. J.-C.) et
// Francs (Mérovingiens puis Carolingiens, Ve-VIIIe s.). Ce module ne sert QUE aux civilisations « gauls » et « franks » :
// les autres peuples (Sparte, Vikings, Égypte) dérivent encore de unitSpec() (unit-specs.js), inchangé.
//
// Gaulois : cheveux chaulés relevés, longues moustaches tombantes, braies à carreaux, sagum (manteau) agrafé par une fibule,
//   torque d'or pour les guerriers, cottes de mailles (invention celte), casques Coolus / Montefortino / Agen, grands
//   boucliers ovales ou hexagonaux à nervure centrale et umbo fusiforme, longues épées, lances ; druides en robe blanche.
// Francs : coupe « au bol » et moustaches sans barbe, tunique courte, braies serrées de bandelettes, manteau agrafé,
//   francisque, angon, scramasaxe, rond bouclier à umbo et bouton ; cotte de mailles et casque conique à nasal réservés
//   aux élites ; cavalerie lourde carolingienne : haubert, casque conique à nasal, bouclier en amande.
import { team as teamColors } from './palette.js';
import { tone } from './unit-kit.js';
import { IRON, BRONZE, GOLD } from './unit-gear.js';
import { GAUL, FRANK, BOX, base } from './unit-base.js';
import { unitSpec, artOf } from './unit-specs.js';

// Cheveux
const LIMED = '#efe3b8'; // cheveux blanchis à l'eau de chaux
const MOUSTACHE_BLOND = '#d9a94c';
const STRAW = '#e2b456';
const RED = '#bd5a26';
const BROWN = '#6a4426';

// Braies à carreaux : quatre « tartans » de laine (vert, rouge, bleu, brun)
const BRAIES = [
  ['#6f7f3a', '#a8763a'],
  ['#8a3e2c', '#d2a24e'],
  ['#3f6580', '#cfc49a'],
  ['#5e6a3a', '#8d6a3a'],
];

// Sagum (manteau de laine) : teintes naturelles
const SAGUM = { brown: '#7a5b3a', green: '#4d6a3a', red: '#8a3e2c', grey: '#77756a', ochre: '#a8823e' };

/** Gaulois de base : moustaches longues, cheveux chaulés relevés, braies à carreaux, tunique d'équipe. */
function gaul(tm, z, o = {}) {
  const sp = base('gauls', tm, z);
  sp.hair = o.hair || LIMED;
  sp.hairStyle = o.hairStyle || 'swept';
  sp.moustache = o.moustache || (sp.hair === LIMED ? MOUSTACHE_BLOND : sp.hair);
  sp.moustacheLong = true;
  const br = BRAIES[(o.braies || 0) % BRAIES.length];
  sp.legs = { kind: 'check', c1: br[0], c2: br[1] };
  sp.hem = o.hem || 3.8;
  sp.belt = '#5a3920';
  sp.buckle = BRONZE;
  return sp;
}

/** Sagum : manteau court de laine agrafé sur l'épaule par une fibule de bronze. */
function sagum(sp, color, o = {}) {
  sp.cape = color;
  sp.capeLen = o.len || 7.5;
  sp.capeW = o.w || 1.0;
  if (o.check) sp.capeCheck = [color, tone(color, -0.4)];
  sp.fibula = o.fibula || BRONZE;
  if (o.trim) sp.capeTrim = o.trim;
}

/** Franc de base : cheveux en bol, moustaches sans barbe, tunique courte d'équipe, braies serrées de bandelettes. */
function frank(tm, z, o = {}) {
  const sp = base('franks', tm, z);
  sp.hair = o.hair || FRANK.brown;
  sp.hairStyle = o.hairStyle || 'bowl';
  sp.beard = null;
  sp.moustache = o.moustache || tone(sp.hair, -0.05);
  sp.hem = o.hem || 5.2;
  sp.legs = { kind: 'wrap', c1: o.legs || '#857d66', c2: '#4a3a2a' };
  sp.belt = '#3e2c1e';
  sp.buckle = '#c9b070';
  return sp;
}

/** Manteau franc : pièce de laine rectangulaire agrafée sur l'épaule (fibule discoïde d'or ou de bronze). */
function mantle(sp, color, o = {}) {
  sp.cape = color;
  sp.capeLen = o.len || 8;
  sp.capeW = o.w || 1.0;
  sp.fibula = o.fibula || GOLD;
  if (o.trim) sp.capeTrim = o.trim;
}

function gaulSpec(type, tm) {
  let sp;
  let hold = 'sword';
  switch (type) {
    case 'villager': {
      // Paysan : tunique, braies, cheveux chaulés et moustaches ; il porte son outil
      sp = gaul(tm, 1.0, { hair: STRAW, braies: 3 });
      sp.weapon = 'axe';
      hold = 'tool';
      break;
    }
    case 'militia': {
      // Levée de paysans-guerriers : tête nue aux cheveux chaulés, courte épée de fer, pas de bouclier
      sp = gaul(tm, 1.09, { hair: LIMED, braies: 1 });
      sp.weapon = 'sword';
      sp.swordLen = 7;
      sp.sleeves = 'short';
      break;
    }
    case 'spearman': {
      // Lancier : casque Coolus de bronze, sagum agrafé, long bouclier ovale à nervure et umbo fusiforme, torque
      sp = gaul(tm, 1.11, { hair: RED, braies: 0 });
      sp.helmet = { kind: 'coolus', c: '#c7923f' };
      sp.shield = { kind: 'oval', face: tm.main };
      sp.torque = true;
      sagum(sp, SAGUM.brown);
      sp.weapon = 'spear';
      sp.spearFwd = 12.5;
      sp.spearBack = 9;
      hold = 'spear';
      break;
    }
    case 'swordsman': {
      // Épéiste : cotte de mailles, casque d'Agen de fer aux clous d'or, bouclier hexagonal, longue épée, sagum d'équipe
      sp = gaul(tm, 1.14, { hair: RED, braies: 2 });
      sp.mail = { c: GAUL.mail, hem: 3.6 };
      sp.sleeves = 'mail';
      sp.helmet = { kind: 'agen', c: '#a3a8ab' };
      sp.shield = { kind: 'hex', face: tm.main };
      sp.torque = true;
      sp.weapon = 'longsword';
      sp.hem = 4.6;
      sagum(sp, tm.main, { len: 8 });
      break;
    }
    case 'champion': {
      // Champion : mailles, casque d'Agen doré à cimier de crin d'équipe, grand bouclier peint au sanglier, torque d'or
      sp = gaul(tm, 1.24, { hair: RED, braies: 1 });
      sp.mail = { c: '#a9aeb0', hem: 3.8 };
      sp.sleeves = 'mail';
      sp.gloves = '#6a4428';
      sp.trim = GOLD;
      sp.helmet = { kind: 'agen', c: '#d4a83e', crest: tm.main, stud: '#fff0b0' };
      sp.shield = { kind: 'oval', face: tm.main, s: 1.08, deco: 'boar' };
      sp.torque = true;
      sp.bracelet = GOLD;
      sagum(sp, tm.main, { len: 11, w: 1.1, check: true, trim: GOLD });
      sp.weapon = 'longsword';
      sp.hilt = GOLD;
      sp.hem = 4.8;
      break;
    }
    case 'archer': {
      // Archer : cucullus (capuche gauloise) de laine, moustaches, carquois
      sp = gaul(tm, 1.08, { braies: 3 });
      sp.hood = '#6a7a3c';
      sp.hairStyle = 'none';
      sp.weapon = 'bow';
      sp.back = 'quiver';
      hold = 'bow';
      break;
    }
    case 'crossbow': {
      // Arbalétrier : cotte courte, casque Montefortino, carquois
      sp = gaul(tm, 1.11, { hair: STRAW, braies: 0 });
      sp.mail = { c: GAUL.mail, hem: 3.2 };
      sp.sleeves = 'mail';
      sp.helmet = { kind: 'montefortino', c: '#a8aaa4' };
      sp.weapon = 'crossbow';
      sp.back = 'quiver';
      sp.hem = 4.2;
      hold = 'xbow';
      break;
    }
    case 'gesate': {
      // Gésate : guerrier nu peint de guède, cheveux hérissés à la chaux, torque, ceinture et braguette d'équipe
      sp = gaul(tm, 1.14, { hair: LIMED });
      sp.hairStyle = 'spiky';
      sp.naked = true;
      sp.paint = true;
      sp.sleeves = 'bare';
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
      // Druide : longue robe blanche, capuche, barbe blanche, faucille d'or à la ceinture, bâton au gui
      sp = gaul(tm, 1.06);
      sp.sleeves = 'robe';
      sp.stole = tm.main;
      sp.robe = '#f0eee2';
      sp.hood = '#e9e7da';
      sp.hairStyle = 'none';
      sp.beard = '#f2f0ea';
      sp.longBeard = true;
      sp.moustache = '#f8f6f0';
      sp.belt = '#b89a5a';
      sp.sickleBelt = true;
      sp.weapon = 'druidStaff';
      sp.hem = 10.4;
      hold = 'staff';
      break;
    }
    case 'vercingetorix': {
      // Chef des Arvernes : casque ailé d'or (parure de chef), longues moustaches rousses, torque et bracelets d'or, sagum à carreaux
      sp = gaul(tm, 1.36, { hair: '#c8752f', moustache: '#d99a3c' });
      sp.mail = { c: '#a7acae', hem: 3.8 };
      sp.sleeves = 'mail';
      sp.gloves = '#6a4428';
      sp.trim = GOLD;
      sp.helmet = { kind: 'winged', c: GOLD, wing: '#f6e6a0' };
      sp.torque = true;
      sp.bracelet = GOLD;
      sagum(sp, tm.main, { len: 12.5, w: 1.15, check: true, trim: GOLD, fibula: GOLD });
      sp.shield = { kind: 'oval', face: tm.main, s: 1.22, deco: 'boar' };
      sp.weapon = 'longsword';
      sp.hilt = GOLD;
      sp.hem = 4.8;
      return { kind: 'human', sp, hold: 'sword', box: BOX.hero, hero: true };
    }
    default:
      return null;
  }
  return { kind: 'human', sp, hold, box: BOX.human };
}

function frankSpec(type, tm) {
  let sp;
  let hold = 'sword';
  switch (type) {
    case 'villager': {
      sp = frank(tm, 1.0, { hair: FRANK.auburn, legs: '#8a8062' });
      sp.weapon = 'axe';
      hold = 'tool';
      break;
    }
    case 'militia': {
      // Milicien : bonnet de cuir, hache de guerre, tunique courte
      sp = frank(tm, 1.09, { hair: FRANK.dark });
      sp.helmet = { kind: 'leather', c: '#6e4a2c' };
      sp.weapon = 'waraxe';
      sp.sleeves = 'short';
      sp.hem = 5.0;
      break;
    }
    case 'spearman': {
      // Lancier : tête nue (coupe en bol), rond bouclier à umbo et bouton, angon barbelé
      sp = frank(tm, 1.11, { hair: FRANK.dark, legs: '#6f7a52' });
      sp.shield = { kind: 'round', face: tm.main, deco: 'segments' };
      sp.weapon = 'angon';
      sp.spearFwd = 12;
      sp.spearBack = 9;
      mantle(sp, tone(tm.main, -0.3), { len: 6.5, fibula: '#c9b070' });
      hold = 'spear';
      break;
    }
    case 'swordsman': {
      // Épéiste : haubert de mailles, casque conique à nasal, rond bouclier, épée, manteau d'équipe
      sp = frank(tm, 1.14, { hair: FRANK.brown });
      sp.mail = { c: FRANK.mail, hem: 5.4 };
      sp.sleeves = 'mail';
      sp.helmet = { kind: 'conical', c: IRON };
      sp.shield = { kind: 'round', face: tm.main, deco: 'segments' };
      sp.weapon = 'sword';
      sp.hem = 6.6;
      mantle(sp, tm.main, { len: 8.5, fibula: GOLD });
      break;
    }
    case 'champion': {
      // Champion : haubert, casque à cimier de crin d'équipe et bandeau d'or, manteau à col de fourrure, grand bouclier
      sp = frank(tm, 1.24, { hair: FRANK.auburn });
      sp.mail = { c: '#a2aab2', hem: 6.2 };
      sp.sleeves = 'mail';
      sp.gloves = '#6a4428';
      sp.trim = GOLD;
      sp.helmet = { kind: 'crest', c: '#b0b8c0', crest: tm.main, band: GOLD };
      sp.shield = { kind: 'round', face: tm.main, s: 1.1, deco: 'segments' };
      sp.cape = FRANK.fur;
      sp.capeLen = 10.5;
      sp.fur = FRANK.furLight;
      sp.fibula = GOLD;
      sp.capeTrim = tm.main;
      sp.aventail = FRANK.mail;
      sp.bracelet = GOLD;
      sp.weapon = 'sword';
      sp.swordLen = 9;
      sp.hilt = GOLD;
      sp.hem = 7.0;
      break;
    }
    case 'archer': {
      // Archer : capuche de laine, tunique courte, carquois
      sp = frank(tm, 1.08, { legs: '#7f7a5e' });
      sp.hood = FRANK.hood;
      sp.hairStyle = 'none';
      sp.weapon = 'bow';
      sp.back = 'quiver';
      sp.hem = 5.0;
      hold = 'bow';
      break;
    }
    case 'crossbow': {
      // Arbalétrier : cotte courte de mailles, bonnet de cuir cerclé de fer
      sp = frank(tm, 1.11, { hair: FRANK.brown });
      sp.mail = { c: FRANK.mail, hem: 4.6 };
      sp.sleeves = 'mail';
      sp.helmet = { kind: 'leather', c: '#6e4a2c' };
      sp.weapon = 'crossbow';
      sp.back = 'quiver';
      sp.hem = 5.8;
      hold = 'xbow';
      break;
    }
    case 'francisque': {
      // Lanceur de francisque : guerrier salien sans armure, cheveux en bol, moustaches, baudrier d'équipe, bouclier dans le dos
      sp = frank(tm, 1.14, { hair: '#a8743e', legs: '#75704f' });
      sp.sleeves = 'short';
      sp.sash = tm.main;
      sp.weapon = 'francisca';
      sp.back = 'shield';
      sp.shieldFace = tm.main;
      sp.hem = 5.6;
      hold = 'throw';
      break;
    }
    case 'healer': {
      // Prêtre : robe de bure, tonsure, corde à la taille, bâton à croix, étole d'équipe
      sp = frank(tm, 1.06);
      sp.sleeves = 'robe';
      sp.stole = tm.main;
      sp.robe = '#6b4a30';
      sp.hairStyle = 'tonsure';
      sp.hair = FRANK.brown;
      sp.moustache = null;
      sp.belt = '#c9b27a';
      sp.weapon = 'crossStaff';
      sp.hem = 10.4;
      hold = 'staff';
      break;
    }
    case 'clovis': {
      // Roi des Francs : longue chevelure royale, couronne d'or, moustaches sans barbe, cotte, manteau bleu-gris à fourrure, fibule d'or
      sp = frank(tm, 1.36, { hair: '#8a5a32', hairStyle: 'long' });
      sp.mail = { c: '#a6aeb6', hem: 6.4 };
      sp.sleeves = 'mail';
      sp.gloves = '#6a4428';
      sp.tabard = tm.main;
      sp.trim = GOLD;
      sp.emblem = GOLD;
      sp.helmet = { kind: 'crown', c: GOLD };
      sp.fur = FRANK.furLight;
      sp.fibula = GOLD;
      sp.cape = '#5d6f86';
      sp.capeLen = 13.5;
      sp.capeW = 1.2;
      sp.capeTrim = FRANK.furLight;
      sp.bracelet = GOLD;
      sp.shield = { kind: 'round', face: tm.main, s: 1.18, deco: 'royal' };
      sp.weapon = 'sword';
      sp.swordLen = 10;
      sp.hilt = GOLD;
      sp.hem = 7.4;
      return { kind: 'human', sp, hold: 'sword', box: BOX.hero, hero: true };
    }
    default:
      return null;
  }
  return { kind: 'human', sp, hold, box: BOX.human };
}

function gaulMounted(type, tm) {
  let sp;
  let horse;
  let hold = 'sword';
  if (type === 'scout') {
    // Éclaireur : cavalier léger sans armure, sagum flottant, javelots, petit cheval gaulois à fanons sur selle à quatre cornes
    sp = gaul(tm, 1.04, { hair: RED, braies: 1 });
    sagum(sp, tm.main, { len: 8 });
    sp.weapon = 'javelin';
    hold = 'spear';
    horse = { hz: 0.9, coat: '#b88c55', mane: '#4a3522', socks: '#5a4230', feathers: true, cloth: tm.main, horns: true };
  } else if (type === 'cavalry') {
    // Cavalier : cotte de mailles, casque d'Agen, bouclier ovale, longue épée
    sp = gaul(tm, 1.08, { hair: STRAW, braies: 2 });
    sp.mail = { c: GAUL.mail, hem: 3.0 };
    sp.sleeves = 'mail';
    sp.helmet = { kind: 'agen', c: '#a3a8ab' };
    sp.shield = { kind: 'oval', face: tm.main, s: 0.85 };
    sp.torque = true;
    sp.weapon = 'longsword';
    sagum(sp, tm.main, { len: 9 });
    horse = { hz: 1.0, coat: '#a0582e', mane: '#6a3218', blaze: true, socks: '#f0e8dc', cloth: tm.main, horns: true };
  } else {
    // Chevalier : noble en mailles, casque d'Agen doré à cimier, sagum à carreaux, cheval caparaçonné de carreaux d'équipe
    sp = gaul(tm, 1.1, { hair: RED, braies: 1 });
    sp.mail = { c: GAUL.mail, hem: 3.0 };
    sp.sleeves = 'mail';
    sp.gloves = '#6a4428';
    sp.trim = GOLD;
    sp.helmet = { kind: 'agen', c: '#d4a83e', crest: tm.main, stud: '#fff0b0' };
    sp.shield = { kind: 'oval', face: tm.main, s: 0.9, deco: 'boar' };
    sp.torque = true;
    sp.bracelet = GOLD;
    sagum(sp, tm.main, { len: 11, w: 1.1, check: true, trim: GOLD });
    sp.weapon = 'lance';
    hold = 'lance';
    horse = { hz: 1.1, coat: '#d8d2c6', mane: '#f2eee6', caparison: tm.main, capTrim: GOLD, capPattern: 'check', armor: '#b0a060', horns: true };
  }
  return { kind: 'mounted', sp, hold, horse, box: type === 'knight' ? BOX.knight : BOX.mounted, type };
}

function frankMounted(type, tm) {
  let sp;
  let horse;
  let hold = 'sword';
  if (type === 'scout') {
    // Éclaireur : cavalier léger en tunique, bonnet de cuir, javelot, cheval gris pommelé
    sp = frank(tm, 1.04, { hair: FRANK.auburn });
    sp.helmet = { kind: 'leather', c: '#6e4a2c' };
    mantle(sp, tm.main, { len: 7 });
    sp.weapon = 'javelin';
    hold = 'spear';
    horse = { hz: 0.92, coat: '#a9a49a', mane: '#e8e4dc', dapple: true, cloth: tm.main };
  } else if (type === 'cavalry') {
    // Cavalier : haubert, casque conique à nasal, rond bouclier, épée
    sp = frank(tm, 1.08, { hair: FRANK.brown });
    sp.mail = { c: FRANK.mail, hem: 4.6 };
    sp.sleeves = 'mail';
    sp.helmet = { kind: 'conical', c: IRON };
    sp.shield = { kind: 'round', face: tm.main, s: 0.85, deco: 'segments' };
    sp.weapon = 'sword';
    mantle(sp, tm.main, { len: 8.5 });
    horse = { hz: 1.0, coat: '#7a4a2a', mane: '#221812', socks: '#2a1e16', cloth: tm.main };
  } else {
    // Chevalier carolingien : long haubert de mailles, casque conique à nasal, bouclier en amande, lance à fanion
    sp = frank(tm, 1.1, { hair: FRANK.dark });
    sp.mail = { c: FRANK.mail, hem: 7.4 };
    sp.sleeves = 'mail';
    sp.gloves = '#6a4428';
    sp.trim = GOLD;
    sp.helmet = { kind: 'conical', c: '#b4bcc4', band: GOLD };
    sp.shield = { kind: 'almond', face: tm.main, s: 0.95 };
    sp.aventail = FRANK.mail;
    mantle(sp, tm.main, { len: 10.5, trim: GOLD });
    sp.fur = FRANK.furLight;
    sp.weapon = 'lance';
    sp.pennant = tm.main;
    hold = 'lance';
    horse = { hz: 1.12, coat: '#3b2d26', mane: '#1b1512', caparison: tm.main, capTrim: GOLD, capPattern: 'plain', armor: '#b8c0c8' };
  }
  return { kind: 'mounted', sp, hold, horse, box: type === 'knight' ? BOX.knight : BOX.mounted, type };
}

/**
 * Description d'une unité gauloise ou franque de base (historique), ou celle de unitSpec() pour tout autre cas
 * (engins, bateaux, unités d'extension, autres peuples). Même contrat que unitSpec().
 */
export function histSpec(type, civ, teamIdx) {
  if (civ !== 'gauls' && civ !== 'franks') return unitSpec(type, civ, teamIdx);
  const tm = teamColors(teamIdx);
  const g = artOf(civ) === 'gauls';
  let r = null;
  if (type === 'scout' || type === 'cavalry' || type === 'knight') r = g ? gaulMounted(type, tm) : frankMounted(type, tm);
  else if (type === 'gesate' || type === 'vercingetorix') r = g ? gaulSpec(type, tm) : null;
  else if (type === 'francisque' || type === 'clovis') r = g ? null : frankSpec(type, tm);
  else r = g ? gaulSpec(type, tm) : frankSpec(type, tm);
  return r || unitSpec(type, civ, teamIdx);
}
