// Costumes des Vikings : unités propres (héros, spéciales, unique, drakkar-catapulte) et costume propre des unités de base.
// Règles de style : casques à nasal ou bonnets de fourrure (JAMAIS de cornes), cottes de mailles, barbes tressées, peaux de bêtes,
// boucliers ronds peints aux couleurs de l'équipe, hache danoise.
import { team as teamColors } from './palette.js';
import { tone } from './unit-kit.js';
import { GOLD } from './unit-gear.js';
import { base, BOX } from './unit-base.js';
import { unitSpec } from './unit-specs.js';
import { HOOKS, roundShield, IRONC } from './unit-vikings-gear.js';
import './unit-gauls-poses.js';
import { vkProw, vkSailCols, vkShieldCols, vkCatapultDeck } from './unit-vikings-ship.js';

const BOX_FOOT = [-34, -60, 40, 10];
const BOX_HERO = [-46, -74, 52, 10];
const BOX_TALL = [-52, -90, 52, 10];

export const TYPES = [
  'vk_housecarl', 'vk_ragnar', 'vk_lagertha', 'vk_ivar', 'vk_bjorn', 'vk_harald', 'vk_erik',
  'vk_berserker', 'vk_skjaldmo', 'vk_ulfhednar', 'vk_skald', 'vk_varangian', 'vk_siegeship',
];

export const METRICS = {
  vk_housecarl: { h: 40, w: 11 },
  vk_ragnar: { h: 46, w: 13 },
  vk_lagertha: { h: 43, w: 11 },
  vk_ivar: { h: 43, w: 11 },
  vk_bjorn: { h: 47, w: 13 },
  vk_harald: { h: 52, w: 14 },
  vk_erik: { h: 45, w: 11 },
  vk_berserker: { h: 36, w: 10 },
  vk_skjaldmo: { h: 35, w: 9 },
  vk_ulfhednar: { h: 39, w: 10 },
  vk_skald: { h: 36, w: 9 },
  vk_varangian: { h: 42, w: 11 },
  vk_siegeship: { h: 76, w: 54 },
};

const MAIL = '#98a0a8';

/** Costume nordique : jambes à bandelettes, barbe (tressée), plus de moustache gauloise ni de torque. */
function norse(sp, o = {}) {
  sp.moustache = null;
  sp.moustacheLong = false;
  sp.torque = false;
  sp.legs = { kind: 'wrap', c1: o.legs || '#8e8676', c2: '#4a3a2a' };
  sp.shoes = '#46301f';
  sp.belt = '#3e2c1e';
  sp.buckle = '#b8a060';
  sp.trim2 = '#d9cfb4';
  sp.hilt = '#c9a24a';
  if (o.hair) sp.hair = o.hair;
  sp.hairStyle = o.hairStyle || 'long';
  if (o.beard === null) sp.beard = null;
  else {
    sp.beard = o.beard || sp.hair;
    sp.xbeard = { c: sp.beard, len: o.beardLen || 0, two: !!o.twoBraids, bead: o.bead };
  }
  if (o.hem !== undefined) sp.hem = o.hem;
  sp.hooks = HOOKS;
  return sp;
}

function human(sp, hold, box, extra) {
  sp.hooks = HOOKS;
  return { kind: 'human', sp, hold, box, ...extra };
}

/** Pêcheur / matelot à bord : tunique d'équipe, bonnet de fourrure. */
function sailor(tm) {
  const sp = norse(base('gauls', tm, 0.9), { hair: '#a8743e', hem: 5.2 });
  sp.weapon = null;
  sp.helmet = { kind: 'fur' };
  return sp;
}

/** Costume viking d'une unité de base, ou null (les engins de siège et les sapeurs gardent le style de base). */
function baseSpec(type, teamIdx) {
  const tm = teamColors(teamIdx);
  switch (type) {
    case 'villager': {
      const S = unitSpec('villager', 'gauls', teamIdx);
      norse(S.sp, { hair: '#a8743e', beardLen: 0, hem: 5.4 });
      S.sp.xtorso = ['fur'];
      S.sp.fur = '#8c6a48';
      S.sp.hooks = HOOKS;
      return S;
    }
    case 'militia': {
      const S = unitSpec('militia', 'gauls', teamIdx);
      const sp = norse(S.sp, { hair: '#9a6a3a', hem: 5.6 });
      sp.helmet = { kind: 'cap' };
      sp.weapon = 'axe1';
      delete sp.swordLen;
      sp.back = 'shield';
      sp.shieldFace = tm.main;
      return S;
    }
    case 'spearman': {
      const S = unitSpec('spearman', 'gauls', teamIdx);
      const sp = norse(S.sp, { hair: '#6a4a2a', hem: 5.8 });
      sp.helmet = { kind: 'nasal' };
      sp.shield = roundShield(tm.main, 'spokes');
      sp.weapon = 'vspear';
      return S;
    }
    case 'swordsman': {
      const S = unitSpec('swordsman', 'gauls', teamIdx);
      const sp = norse(S.sp, { hair: '#b07a3a', hem: 6.2 });
      sp.mail = { c: MAIL, hem: 5.6 };
      sp.helmet = { kind: 'nasal' };
      sp.shield = roundShield(tm.main, 'half');
      sp.weapon = 'vsword';
      return S;
    }
    case 'champion': {
      const S = unitSpec('champion', 'gauls', teamIdx);
      const sp = norse(S.sp, { hair: '#4a3222', hem: 6.4, twoBraids: true, beardLen: 1 });
      sp.mail = { c: '#a4abb3', hem: 6.4 };
      sp.helmet = { kind: 'spectacle' };
      sp.aventail = '#8e959d';
      sp.shield = roundShield(tm.main, 'iron', 1.1);
      sp.weapon = 'axe1';
      sp.cape = '#54443a';
      sp.capeTrim = '#cfc4ac';
      sp.emblem = GOLD;
      sp.xtorso = ['fur'];
      sp.fur = '#6b5642';
      return S;
    }
    case 'archer': {
      const S = unitSpec('archer', 'gauls', teamIdx);
      const sp = norse(S.sp, { hair: '#9a6a3a', hem: 5.4 });
      sp.hood = null;
      sp.helmet = { kind: 'fur' };
      return S;
    }
    case 'crossbow': {
      // Pas d'arbalète chez les Vikings : archer d'élite, cotte de mailles, casque à nasal, grand arc
      const S = unitSpec('archer', 'gauls', teamIdx);
      const sp = norse(S.sp, { hair: '#6a4a2a', hem: 6.0, sz: 1.11 });
      sp.sz = 1.11;
      sp.hood = null;
      sp.mail = { c: MAIL, hem: 4.6 };
      sp.sleeves = 'mail';
      sp.tabard = tm.main;
      sp.helmet = { kind: 'nasal' };
      sp.back = 'quiver';
      return S;
    }
    case 'scout': {
      const S = unitSpec('scout', 'gauls', teamIdx);
      const sp = norse(S.sp, { hair: '#a8743e', hem: 4.8 });
      sp.helmet = { kind: 'fur' };
      sp.cape = tm.main;
      S.horse = { hz: 0.9, coat: '#c4a470', mane: '#efe4c8', socks: '#6a5a44', cloth: tm.main };
      return S;
    }
    case 'cavalry': {
      const S = unitSpec('cavalry', 'gauls', teamIdx);
      const sp = norse(S.sp, { hair: '#6a4a2a', hem: 4.6 });
      sp.helmet = { kind: 'nasal' };
      sp.shield = roundShield(tm.main, 'spokes', 0.85);
      sp.weapon = 'vsword';
      S.horse = { hz: 1.0, coat: '#6a5040', mane: '#231a14', socks: '#3a2e22', cloth: tm.main };
      return S;
    }
    case 'knight': {
      const S = unitSpec('knight', 'gauls', teamIdx);
      const sp = norse(S.sp, { hair: '#8a5a32', hem: 4.8, twoBraids: true });
      sp.helmet = { kind: 'spectacle' };
      sp.aventail = '#8e959d';
      sp.shield = roundShield(tm.main, 'gold', 0.9);
      sp.cape = '#54443a';
      sp.capeTrim = '#cfc4ac';
      sp.xtorso = ['fur'];
      sp.fur = '#6b5642';
      S.horse = { hz: 1.1, coat: '#3a3430', mane: '#14100e', caparison: tm.main, capTrim: GOLD, capPattern: 'plain' };
      return S;
    }
    case 'healer': {
      const S = unitSpec('healer', 'gauls', teamIdx);
      const sp = norse(S.sp, { hair: '#d8d2c0', beard: null, hairStyle: 'none', hem: 10.4 });
      sp.robe = '#364660';
      sp.hood = '#2c3a54';
      sp.stole = tm.main;
      sp.sickleBelt = false;
      sp.longBeard = false;
      sp.belt = '#8a6a48';
      sp.weapon = 'volva';
      sp.xtorso = ['fur'];
      sp.fur = '#d9d2c0';
      S.hold = 'staff';
      return S;
    }
    case 'fishingboat':
      return { kind: 'boat', ship: 'fish', civ: 'vikings', team: tm, box: BOX.fishingboat, sp: sailor(tm), hold: 'tool', type };
    case 'warship': {
      const arch = baseSpec('archer', teamIdx).sp;
      return {
        kind: 'boat', ship: 'war', civ: 'vikings', team: tm, box: BOX.warship, sp: sailor(tm), archer: { ...arch, sz: 0.84 }, hold: 'bow', type,
        prow: vkProw, sailCols: vkSailCols, shieldCols: vkShieldCols,
      };
    }
    default:
      return null;
  }
}

export function vikingsSpec(type, teamIdx) {
  const tm = teamColors(teamIdx);
  let sp;
  switch (type) {
    case 'vk_housecarl': {
      // Garde du roi : grande cotte, casque à nasal et camail, hache danoise à deux mains, bouclier dans le dos
      sp = norse(base('gauls', tm, 1.27), { hair: '#7a5432', hem: 6.4, twoBraids: true, beardLen: 1 });
      sp.mail = { c: MAIL, hem: 6.6 };
      sp.sleeves = 'mail';
      sp.tabard = tm.main;
      sp.trim = GOLD;
      sp.helmet = { kind: 'nasal', band: GOLD };
      sp.aventail = '#8a9199';
      sp.xtorso = ['fur'];
      sp.fur = '#6b5642';
      sp.weapon = 'daneaxe';
      sp.back = 'shield';
      sp.shieldFace = tm.main;
      return human(sp, 'great', BOX_FOOT);
    }
    case 'vk_ragnar': {
      // Ragnar « Braies-velues » : longue chevelure cuivrée, barbe tressée, cape de fourrure, hache à barbe et bouclier au nœud d'or
      sp = norse(base('gauls', tm, 1.4), { hair: '#b0682e', hem: 6.8, twoBraids: true, beardLen: 2 });
      sp.mail = { c: MAIL, hem: 6.4 };
      sp.sleeves = 'mail';
      sp.gloves = '#6a4428';
      sp.tabard = tm.main;
      sp.trim = GOLD;
      sp.helmet = { kind: 'circlet' };
      sp.cape = '#5a4232';
      sp.capeLen = 12;
      sp.capeW = 1.15;
      sp.capeTrim = '#d9cfbd';
      sp.fur = '#d9cfbd';
      sp.xtorso = ['fur', 'brooch'];
      sp.bracelet = GOLD;
      sp.shield = roundShield(tm.main, 'knot', 1.12);
      sp.weapon = 'axe1';
      return human(sp, 'sword', BOX_HERO, { hero: true });
    }
    case 'vk_lagertha': {
      // Skjaldmö : longue natte blonde, cotte légère, bandeau d'or, épée et bouclier aux anneaux
      sp = norse(base('gauls', tm, 1.3), { hair: '#e0ae42', beard: null, hem: 6.0 });
      sp.xbraid = { c: '#e0ae42', ribbon: '#c8312e' };
      sp.mail = { c: MAIL, hem: 3.6 };
      sp.sleeves = 'mail';
      sp.gloves = '#6a4428';
      sp.tabard = tm.main;
      sp.trim = GOLD;
      sp.helmet = { kind: 'circlet' };
      sp.cape = '#2f5a78';
      sp.capeLen = 11;
      sp.capeTrim = '#d9cfbd';
      sp.xtorso = ['brooch'];
      sp.bracelet = GOLD;
      sp.shield = roundShield(tm.main, 'rings', 1.05);
      sp.weapon = 'vsword';
      sp.swordLen = 9.6;
      return human(sp, 'sword', BOX_HERO, { hero: true });
    }
    case 'vk_ivar': {
      // Ivar sans-os : cheveux et barbe blancs, toque de fourrure claire, grande cape, arc de chasse
      sp = norse(base('gauls', tm, 1.27), { hair: '#dcd6c2', hem: 6.6, beardLen: 3 });
      sp.longBeard = true;
      sp.mail = { c: MAIL, hem: 5.2 };
      sp.sleeves = 'mail';
      sp.tabard = tm.main;
      sp.trim = GOLD;
      sp.helmet = { kind: 'fur', c: '#e0dccd' };
      sp.cape = '#2e3a54';
      sp.capeLen = 12;
      sp.capeW = 1.15;
      sp.capeTrim = '#e0dccd';
      sp.fur = '#e0dccd';
      sp.xtorso = ['fur', 'brooch'];
      sp.bracelet = GOLD;
      sp.weapon = 'bow';
      sp.back = 'quiver';
      return human(sp, 'bow', BOX_HERO, { hero: true });
    }
    case 'vk_bjorn': {
      // Bjorn Côtes-de-fer : colosse brun, plastron de côtes de fer, casque-lunettes, grand bouclier cerclé de fer
      sp = norse(base('gauls', tm, 1.44), { hair: '#3a2a20', hem: 7.0, twoBraids: true, beardLen: 2 });
      sp.mail = { c: '#8a929a', hem: 7.4 };
      sp.sleeves = 'mail';
      sp.gloves = '#4a3020';
      sp.tabard = tm.main;
      sp.trim = '#b98a38';
      sp.helmet = { kind: 'spectacle' };
      sp.aventail = '#7e868e';
      sp.cape = '#4a3a30';
      sp.capeLen = 11.5;
      sp.capeW = 1.15;
      sp.capeTrim = '#8a7a66';
      sp.fur = '#4e3e30';
      sp.xtorso = ['ribs', 'fur'];
      sp.shield = roundShield(tm.main, 'iron', 1.2);
      sp.weapon = 'vsword';
      sp.swordLen = 10.5;
      return human(sp, 'sword', BOX_HERO, { hero: true });
    }
    case 'vk_harald': {
      // Harald Hardrada : géant blond, casque doré à lunettes et couronne, manteau d'équipe à l'hermine, étendard au corbeau
      sp = norse(base('gauls', tm, 1.52), { hair: '#dcbc62', hem: 7.4, beardLen: 3 });
      sp.longBeard = true;
      sp.mail = { c: '#b7bdc5', hem: 7.6 };
      sp.sleeves = 'mail';
      sp.gloves = '#6a4428';
      sp.tabard = tm.main;
      sp.trim = GOLD;
      sp.emblem = GOLD;
      sp.helmet = { kind: 'gilded' };
      sp.aventail = '#b7bdc5';
      sp.cape = tm.dark;
      sp.capeLen = 14;
      sp.capeW = 1.25;
      sp.capeTrim = '#f2eee4';
      sp.bracelet = GOLD;
      sp.xtorso = ['brooch'];
      sp.xback = 'raven';
      sp.ravenCol = tm.main;
      sp.weapon = 'gildedaxe';
      return human(sp, 'great', BOX_TALL, { hero: true, ringScale: 1.2 });
    }
    case 'vk_erik': {
      // Erik le Rouge : crinière et barbe rousses, toque de loutre, cape vert-de-mer, lance de chasse, bouclier dans le dos
      sp = norse(base('gauls', tm, 1.3), { hair: '#c2471e', hem: 6.4, beardLen: 3 });
      sp.mail = { c: MAIL, hem: 4.2 };
      sp.sleeves = 'mail';
      sp.gloves = '#6a4428';
      sp.tabard = tm.main;
      sp.helmet = { kind: 'fur', c: '#6e5a44' };
      sp.cape = '#2e6a70';
      sp.capeLen = 12;
      sp.capeW = 1.1;
      sp.capeTrim = '#d9cfbd';
      sp.fur = '#d9cfbd';
      sp.xtorso = ['fur'];
      sp.back = 'shield';
      sp.shieldFace = tm.main;
      sp.weapon = 'vspear';
      sp.spearFwd = 14;
      sp.spearBack = 10;
      return human(sp, 'spear', BOX_HERO, { hero: true });
    }
    case 'vk_berserker': {
      // Berserker : torse nu tatoué, peau d'ours, yeux peints, deux haches
      sp = norse(base('gauls', tm, 1.14), { hair: '#5a3a20', hem: 0, beardLen: 1 });
      sp.naked = true;
      sp.sleeves = 'bare';
      sp.legs = { kind: 'wrap', c1: '#7a6a54', c2: '#4a3a2a' };
      sp.loin = tm.main;
      sp.sash = tm.main;
      sp.gloves = '#4a3020';
      sp.helmet = { kind: 'bear' };
      sp.xpaint = { c: '#23335e' };
      sp.xtorso = ['bear'];
      sp.weapon = 'axe1';
      sp.xfront = 'twinaxe';
      sp.bracelet = '#b98a3e';
      return human(sp, 'fury', BOX_FOOT);
    }
    case 'vk_skjaldmo': {
      // Skjaldmö archère : natte blonde, bonnet de cuir, cotte courte, bouclier rond dans le dos
      sp = norse(base('gauls', tm, 1.08), { hair: '#d09a36', beard: null, hem: 5.4 });
      sp.xbraid = { c: '#d09a36', ribbon: tm.main };
      sp.mail = { c: MAIL, hem: 3.0 };
      sp.sleeves = 'mail';
      sp.tabard = tm.main;
      sp.helmet = { kind: 'cap', c: '#5e4630' };
      sp.weapon = 'bow';
      sp.back = 'shield';
      sp.shieldFace = tm.main;
      return human(sp, 'bow', BOX_FOOT);
    }
    case 'vk_ulfhednar': {
      // Ulfhednar : guerrier-loup, capuche et peau de loup, mailles grises, hache et petit bouclier
      sp = norse(base('gauls', tm, 1.17), { hair: '#8a8478', hem: 4.8, beardLen: 1 });
      sp.mail = { c: '#8a9096', hem: 4.0 };
      sp.sleeves = 'mail';
      sp.gloves = '#3a2a20';
      sp.cape = tm.main;
      sp.capeLen = 8;
      sp.helmet = { kind: 'wolf' };
      sp.xtorso = ['wolf'];
      sp.shield = roundShield(tm.main, 'half', 0.9);
      sp.weapon = 'axe1';
      return human(sp, 'sword', BOX_FOOT);
    }
    case 'vk_skald': {
      // Skald : poète guerrier à la barbe argentée, cape bleu nuit, bandeau d'argent, lyre
      sp = norse(base('gauls', tm, 1.12), { hair: '#cfc8b4', hem: 8.6, beardLen: 2 });
      sp.longBeard = true;
      sp.sleeves = 'long';
      sp.helmet = { kind: 'circlet', c: '#d8dce2', gem: '#3a6ac8' };
      sp.cape = '#34446a';
      sp.capeLen = 11;
      sp.capeTrim = '#cfc8b4';
      sp.belt = '#8a6a48';
      sp.stole = tm.main;
      sp.xtorso = ['brooch'];
      sp.weapon = 'lyre';
      return human(sp, 'staff', BOX_FOOT);
    }
    case 'vk_varangian': {
      // Garde varègue : casque à crête d'équipe et camail, grande cotte, manteau pourpre de Byzance, grande hache dorée
      sp = norse(base('gauls', tm, 1.3), { hair: '#6a4a2a', hem: 6.8, twoBraids: true, beardLen: 1 });
      sp.mail = { c: '#a9b0b8', hem: 7.0 };
      sp.sleeves = 'mail';
      sp.gloves = '#3a2a20';
      sp.tabard = tm.main;
      sp.trim = GOLD;
      sp.emblem = GOLD;
      sp.helmet = { kind: 'nasal', c: '#b7bec6', band: GOLD, crest: tm.main };
      sp.aventail = '#9aa1a9';
      sp.cape = '#6b2a3a';
      sp.capeLen = 12;
      sp.capeW = 1.1;
      sp.capeTrim = GOLD;
      sp.bracelet = GOLD;
      sp.weapon = 'gildedaxe';
      sp.back = 'shield';
      sp.shieldFace = tm.main;
      return human(sp, 'great', BOX_HERO);
    }
    case 'vk_siegeship': {
      const arch = baseSpec('archer', teamIdx).sp;
      return {
        kind: 'boat', ship: 'war', civ: 'vikings', team: tm, box: BOX.warship, sp: sailor(tm), archer: { ...arch, sz: 0.84 }, hold: 'bow', type,
        prow: vkProw, sailCols: vkSailCols, shieldCols: vkShieldCols, deck: vkCatapultDeck, siege: true,
      };
    }
    default:
      return null;
  }
}

/** Point d'entrée de unit-ext-vikings.js. */
export function vikingsEntry(type, civ, teamIdx) {
  if (TYPES.includes(type)) return vikingsSpec(type, teamIdx);
  if (civ !== 'vikings') return null;
  return baseSpec(type, teamIdx);
}

void IRONC;
void tone;
