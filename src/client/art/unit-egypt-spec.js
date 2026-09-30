// Costumes égyptiens : 13 types propres (héros, unités spéciales, chars, baliste sacrée) et costume égyptien des unités
// de base (fellah, milicien, lancier, guerrier au khopesh, garde du pharaon, archers, char léger et lourd, prêtre…).
// Lin blanc, nemes rayé, khôl, collier usekh, grands boucliers de peau ; la couleur d'équipe est portée par la ceinture,
// la bande du pagne, le bandeau, les rayures du nemes et le champ des boucliers.
import { team as teamColors } from './palette.js';
import { base } from './unit-base.js';
import { unitSpec } from './unit-specs.js';
import { HOOKS } from './unit-egypt-wear.js';
import { chariotSpec } from './unit-egypt-chariot.js';
import { balisteSpec } from './unit-baliste.js';
import { LINEN, GOLDE, TURQ, LAPIS, COPPER } from './unit-egypt-gear.js';
import './unit-gauls-poses.js';

export const TYPES = [
  'eg_narmer', 'eg_hatchepsout', 'eg_thoutmosis', 'eg_nefertari', 'eg_ramses', 'eg_cleopatre',
  'eg_medjay', 'eg_archer_desert', 'eg_sekhmet', 'eg_pretre_sekhmet', 'eg_char_assaut', 'eg_scarabee', 'eg_char_royal',
];

export const METRICS = {
  eg_narmer: { h: 52, w: 12 },
  eg_hatchepsout: { h: 45, w: 10 },
  eg_thoutmosis: { h: 52, w: 30 },
  eg_nefertari: { h: 48, w: 10 },
  eg_ramses: { h: 50, w: 13 },
  eg_cleopatre: { h: 48, w: 10 },
  eg_medjay: { h: 37, w: 10 },
  eg_archer_desert: { h: 35, w: 9 },
  eg_sekhmet: { h: 39, w: 12 },
  eg_pretre_sekhmet: { h: 36, w: 9 },
  eg_char_assaut: { h: 50, w: 30 },
  eg_scarabee: { h: 40, w: 26 },
  eg_char_royal: { h: 50, w: 30 },
};

const BOX_HERO = [-44, -76, 50, 10];
const BOX_FOOT = [-34, -62, 38, 10];
const BOX_BASE = [-28, -52, 34, 8];

const SKIN = '#bd8252';
const SKIN_W = '#cf9560';
const SKIN_NUB = '#62402a';
const BLACK = '#17110d';
const SANDAL = '#a8804e';

/** Costume égyptien de départ : torse nu, pagne de lin à liseré d'équipe, ceinture d'équipe, khôl, cheveux noirs. */
function eg(tm, z, o = {}) {
  const sp = base('franks', tm, z);
  sp.civ = 'egypt';
  sp.skin = o.skin || SKIN;
  sp.hair = o.hair || BLACK;
  sp.hairStyle = o.hairStyle || 'short';
  sp.beard = null;
  sp.naked = o.naked !== false;
  sp.sleeves = o.sleeves || 'bare';
  sp.legs = { kind: 'bare' };
  sp.shoes = o.shoes || SANDAL;
  sp.tunic = o.kilt || LINEN;
  sp.hem = o.hem === undefined ? 3.8 : o.hem;
  sp.trim2 = o.band === undefined ? tm.main : o.band;
  sp.belt = o.belt || tm.main;
  sp.buckle = GOLDE;
  sp.xkohl = true;
  sp.hooks = HOOKS;
  if (o.bracelet) sp.bracelet = o.bracelet;
  return sp;
}

/** Pose le drapeau de casque (déclenche le crochet de coiffe) et retire les cheveux dessinés par défaut. */
function dress(sp) {
  if (sp.xhelm) {
    sp.helmet = { kind: 'x' };
    sp.hairStyle = 'none';
  }
  return sp;
}

const human = (sp, hold, box, extra) => ({ kind: 'human', sp: dress(sp), hold, box, ...extra });

/** Conducteur de char : pagne, foulard, pas d'arme. */
function driver(tm) {
  const sp = eg(tm, 1.0, { hem: 3.4 });
  sp.xhelm = { kind: 'cloth', c: LINEN, band: tm.main };
  sp.weapon = null;
  return dress(sp);
}

/** Archer de char : perruque (ou coiffe donnée), collier, arc et carquois. */
function chariotArcher(tm, z, helm, royal) {
  const sp = eg(tm, z, { hem: 4.2, bracelet: GOLDE });
  sp.xhelm = helm;
  sp.xtorso = ['usekh', 'pleats'];
  if (royal) sp.xbeard = { c: GOLDE, c2: LAPIS };
  sp.weapon = 'bow';
  sp.back = 'quiver';
  return dress(sp);
}

/** Fantassin de char : lancier ou guerrier au khopesh, bouclier de peau. */
function chariotFighter(tm, z, kind) {
  const sp = eg(tm, z, { hem: 4.0, bracelet: GOLDE });
  sp.xtorso = ['usekh', 'pleats'];
  sp.shield = { kind: 'round', face: tm.main };
  if (kind === 'spear') {
    sp.xhelm = { kind: 'cap', c: '#8a5a32', band: tm.main };
    sp.xshield = { kind: 'buckler', s: 0.95 };
    sp.weapon = 'spear';
    sp.spearFwd = 12;
    sp.spearBack = 9;
  } else {
    sp.xhelm = { kind: 'cap', c: COPPER, band: tm.main, studs: true, ear: true };
    sp.xshield = { kind: 'hide', s: 0.95 };
    sp.weapon = 'khopesh';
  }
  return dress(sp);
}

function fisher(tm) {
  const sp = eg(tm, 0.9, { hem: 3.4 });
  sp.xhelm = { kind: 'cloth', c: LINEN, band: tm.main };
  sp.weapon = null;
  return dress(sp);
}

export function egyptSpec(type, teamIdx) {
  const tm = teamColors(teamIdx);
  let sp;
  switch (type) {
    // ------------------------------------------------------------------ héros
    case 'eg_narmer': {
      // Le roi unificateur : couronne blanche, masse en poire, queue de taureau, pagne au tablier d'or
      sp = eg(tm, 1.4, { hem: 4.8, bracelet: GOLDE, skin: '#b87a4c' });
      sp.xhelm = { kind: 'white' };
      sp.xbeard = { c: GOLDE, c2: LAPIS };
      sp.xtorso = ['usekh', 'bulltail', 'apron'];
      sp.xapron = { c1: GOLDE, c2: tm.main };
      sp.cape = tm.main;
      sp.capeLen = 8;
      sp.capeW = 1.0;
      sp.capeTrim = GOLDE;
      sp.weapon = 'mace';
      return human(sp, 'sword', BOX_HERO, { hero: true });
    }
    case 'eg_hatchepsout': {
      // Femme-pharaon archère : nemes à uræus et barbe postiche, fourreau de lin, arc et carquois
      sp = eg(tm, 1.28, { naked: false, hem: 10.4, sleeves: 'bare', bracelet: GOLDE, skin: SKIN_W });
      sp.xhelm = { kind: 'nemes', uraeus: true, stripe: tm.main, lappet: 6.4, back: 8 };
      sp.xbeard = { c: GOLDE, c2: LAPIS };
      sp.xtorso = ['usekh'];
      sp.weapon = 'bow';
      sp.back = 'quiver';
      return human(sp, 'bow', BOX_HERO, { hero: true });
    }
    case 'eg_thoutmosis': {
      // Char d'archer du grand conquérant : couronne bleue de guerre, barbe postiche
      return chariotSpec({
        type, tm, style: 'hero', hero: true, hold: 'bow',
        driver: driver(tm), fighter: chariotArcher(tm, 1.22, { kind: 'blue' }, true),
      });
    }
    case 'eg_nefertari': {
      // Grande épouse royale : disque solaire et cornes d'Hathor, plumes, longue robe plissée, bâton à ankh
      sp = eg(tm, 1.3, { naked: false, hem: 11.2, sleeves: 'bare', bracelet: GOLDE, skin: SKIN_W, belt: GOLDE });
      sp.stole = tm.main;
      sp.xhelm = { kind: 'hathor', plumes: true };
      sp.xtorso = ['usekh'];
      sp.weapon = 'ankhStaff';
      return human(sp, 'staff', BOX_HERO, { hero: true });
    }
    case 'eg_ramses': {
      // Ramsès le Grand : couronne bleue, barbe postiche, pagne plissé à tablier d'or, khopesh et bouclier au cartouche
      sp = eg(tm, 1.42, { hem: 5.0, bracelet: GOLDE, skin: '#b37646' });
      sp.xhelm = { kind: 'blue' };
      sp.xbeard = { c: GOLDE, c2: LAPIS };
      sp.xtorso = ['usekh', 'apron'];
      sp.xapron = { c1: GOLDE, c2: tm.main };
      sp.cape = tm.main;
      sp.capeLen = 10;
      sp.capeW = 1.1;
      sp.capeTrim = GOLDE;
      sp.shield = { kind: 'round', face: tm.main };
      sp.xshield = { kind: 'hero', s: 1.12 };
      sp.weapon = 'khopesh';
      sp.xweapon = { blade: '#f2e6b0', hilt: GOLDE, len: 1.12 };
      return human(sp, 'sword', BOX_HERO, { hero: true });
    }
    case 'eg_cleopatre': {
      // Dernière reine : coiffe de vautour à plumes, triple uræus, robe plissée ivoire, sceptre heqa
      sp = eg(tm, 1.3, { naked: false, hem: 11.4, sleeves: 'bare', bracelet: GOLDE, skin: '#d6a070', belt: GOLDE });
      sp.tunic = '#f4edd8';
      sp.stole = tm.main;
      sp.xhelm = { kind: 'vulture', plumes: true };
      sp.xtorso = ['usekh'];
      sp.weapon = 'crook';
      return human(sp, 'sword', BOX_HERO, { hero: true });
    }
    // ------------------------------------------------------------------ unités spéciales
    case 'eg_medjay': {
      // Nubien au visage peint : cheveux crépus, bandeau d'équipe et plume d'autruche, javelot et petit bouclier rond
      sp = eg(tm, 1.15, { skin: SKIN_NUB, hem: 3.6, bracelet: COPPER, shoes: '#4a3020' });
      sp.xhelm = { kind: 'nubian', band: tm.main, plume: '#f4f0e2' };
      sp.sash = '#8a5a32';
      sp.xtorso = ['pleats'];
      sp.shield = { kind: 'round', face: tm.main };
      sp.xshield = { kind: 'buckler', s: 1.0 };
      sp.weapon = 'spear';
      sp.spearFwd = 12;
      sp.spearBack = 9;
      return human(sp, 'spear', BOX_FOOT, {});
    }
    case 'eg_archer_desert': {
      // Nomade de l'Est : tunique sable, foulard noué, arc court et grand carquois
      sp = eg(tm, 1.12, { naked: false, kilt: '#dcc592', hem: 5.6, sleeves: 'short', skin: '#b07a4a', belt: tm.main });
      sp.xhelm = { kind: 'cloth', c: '#efe5c4', band: tm.main };
      sp.weapon = 'bow';
      sp.back = 'quiver';
      return human(sp, 'bow', BOX_FOOT, {});
    }
    case 'eg_sekhmet': {
      // Garde de la lionne : coiffe de lion, cuirasse d'écailles de bronze, pagne rouge, grand bouclier à la lionne, khopesh
      sp = eg(tm, 1.3, { naked: true, kilt: '#b8452e', hem: 5.0, band: GOLDE, bracelet: GOLDE, belt: tm.main });
      sp.xhelm = { kind: 'lion', band: tm.main };
      sp.xtorso = ['scales', 'usekh'];
      sp.xscales = { c: COPPER, trim: tm.main };
      sp.shield = { kind: 'round', face: tm.main };
      sp.xshield = { kind: 'tower', s: 1.0 };
      sp.weapon = 'khopesh';
      return human(sp, 'sword', BOX_FOOT, {});
    }
    case 'eg_pretre_sekhmet': {
      // Prêtre-exorciste : crâne rasé, peau de léopard, pagne rouge long, bâton à ankh ; bénit au lieu de frapper
      sp = eg(tm, 1.16, { naked: true, kilt: '#b8452e', hem: 9.4, band: tm.main, bracelet: GOLDE, belt: GOLDE });
      sp.xhelm = { kind: 'bald' };
      sp.xtorso = ['leopard'];
      sp.weapon = 'ankhStaff';
      return human(sp, 'staff', BOX_FOOT, {});
    }
    case 'eg_char_royal': {
      // Char d'archer royal : caisse dorée, archer en perruque à fillet d'or, conducteur en foulard
      return chariotSpec({
        type, tm, style: 'royal', hold: 'bow',
        driver: driver(tm), fighter: chariotArcher(tm, 1.1, { kind: 'wig', fillet: GOLDE }, false),
      });
    }
    case 'eg_char_assaut': {
      // Char d'assaut : caisse bardée de bronze rouge, chevaux caparaçonnés, faux aux roues, guerrier au khopesh
      const fighter = chariotFighter(tm, 1.16, 'sword');
      fighter.xhelm = { kind: 'lion', band: tm.main };
      fighter.xshield = { kind: 'tower', s: 0.92 };
      dress(fighter);
      return chariotSpec({ type, tm, style: 'assault', hold: 'sword', driver: driver(tm), fighter });
    }
    case 'eg_scarabee': {
      // Scarabée-catapulte : baliste sacrée ornée du disque solaire ailé, servie par un soldat égyptien
      const s = balisteSpec(tm);
      const sv = eg(tm, 1.0, { hem: 3.6 });
      sv.xhelm = { kind: 'cap', c: '#8a5a32', band: tm.main };
      sv.weapon = null;
      dress(sv);
      return { ...s, kind: 'eg_baliste', type, bal: { team: tm, servant: sv } };
    }
    default:
      return null;
  }
}

/** Costume égyptien des unités de base (null : on garde le dessin de base du peuple). */
export function egyptBase(type, teamIdx) {
  const tm = teamColors(teamIdx);
  let sp;
  switch (type) {
    case 'villager': {
      // Fellah : torse nu, pagne court, foulard de lin noué d'un liseré d'équipe
      sp = eg(tm, 1.0, { hem: 3.4 });
      sp.xhelm = { kind: 'cloth', c: LINEN, band: tm.main };
      sp.weapon = 'axe';
      return human(sp, 'tool', BOX_BASE);
    }
    case 'militia': {
      // Milicien : calotte de cuir, massue de bois, pagne et ceinture d'équipe
      sp = eg(tm, 1.09, { hem: 3.8, shoes: '#6a4a2c' });
      sp.xhelm = { kind: 'cap', c: '#8a5a32', band: tm.main };
      sp.xtorso = ['pleats'];
      sp.weapon = 'club';
      return human(sp, 'sword', BOX_BASE);
    }
    case 'spearman': {
      // Lancier : foulard, grand bouclier de peau aux couleurs de l'équipe, lance
      sp = eg(tm, 1.11, { hem: 4.0 });
      sp.xhelm = { kind: 'cloth', c: LINEN, band: tm.main };
      sp.xtorso = ['pleats'];
      sp.shield = { kind: 'round', face: tm.main };
      sp.xshield = { kind: 'hide', s: 1.0 };
      sp.weapon = 'spear';
      sp.spearFwd = 12;
      sp.spearBack = 9;
      return human(sp, 'spear', BOX_BASE);
    }
    case 'swordsman': {
      // Guerrier au khopesh : calotte de bronze à nuquière, collier usekh, grand bouclier de peau
      sp = eg(tm, 1.14, { hem: 4.4, bracelet: COPPER, shoes: '#6a4a2c' });
      sp.xhelm = { kind: 'cap', c: COPPER, band: tm.main, studs: true, ear: true };
      sp.xtorso = ['usekh', 'pleats'];
      sp.shield = { kind: 'round', face: tm.main };
      sp.xshield = { kind: 'hide', s: 1.05 };
      sp.weapon = 'khopesh';
      return human(sp, 'sword', BOX_BASE);
    }
    case 'champion': {
      // Garde du pharaon : nemes rayé aux couleurs de l'équipe, cuirasse d'écailles, tablier d'or, khopesh doré
      sp = eg(tm, 1.24, { hem: 5.0, bracelet: GOLDE, shoes: '#6a4a2c' });
      sp.xhelm = { kind: 'nemes', stripe: tm.main, lappet: 6, back: 7 };
      sp.xtorso = ['scales', 'usekh', 'apron'];
      sp.xscales = { c: '#c9a04a', trim: tm.main };
      sp.xapron = { c1: GOLDE, c2: tm.main };
      sp.shield = { kind: 'round', face: tm.main };
      sp.xshield = { kind: 'hide', s: 1.14 };
      sp.weapon = 'khopesh';
      sp.xweapon = { blade: '#ecdca0', hilt: GOLDE, len: 1.05 };
      return human(sp, 'sword', BOX_BASE);
    }
    case 'archer': {
      // Archer nubien : peau sombre, cheveux crépus, bandeau d'équipe et plume, pagne de lin, arc et carquois
      sp = eg(tm, 1.08, { skin: SKIN_NUB, hem: 3.6, shoes: '#4a3020', bracelet: COPPER });
      sp.xhelm = { kind: 'nubian', band: tm.main, plume: '#f4f0e2' };
      sp.weapon = 'bow';
      sp.back = 'quiver';
      return human(sp, 'bow', BOX_BASE);
    }
    case 'crossbow': {
      // Archer composite : grand arc de corne, cuirasse de lin aux couleurs de l'équipe, calotte de bronze
      sp = eg(tm, 1.11, { naked: false, hem: 4.8, sleeves: 'short', shoes: '#6a4a2c' });
      sp.tabard = tm.main;
      sp.trim = GOLDE;
      sp.xhelm = { kind: 'cap', c: COPPER, band: GOLDE, studs: true, ear: true };
      sp.xtorso = ['usekh'];
      sp.weapon = 'bow';
      sp.back = 'quiver';
      return human(sp, 'bow', BOX_BASE);
    }
    case 'healer': {
      // Prêtre : crâne rasé, longue robe de lin, étole d'équipe, bâton à ankh
      sp = eg(tm, 1.06, { naked: false, hem: 10.4, sleeves: 'robe', belt: GOLDE });
      sp.robe = LINEN;
      sp.stole = tm.main;
      sp.xhelm = { kind: 'bald' };
      sp.xtorso = [];
      sp.weapon = 'ankhStaff';
      return human(sp, 'staff', BOX_BASE);
    }
    case 'scout': {
      // Coureur du désert : cavalier léger au foulard, javelots, cheval sable
      const s = unitSpec('scout', 'franks', teamIdx);
      sp = eg(tm, 1.04, { hem: 3.6 });
      sp.xhelm = { kind: 'cloth', c: '#efe5c4', band: tm.main };
      sp.cape = tm.main;
      sp.capeLen = 6;
      sp.weapon = 'javelin';
      s.sp = dress(sp);
      s.horse = { hz: 0.92, coat: '#c89e68', mane: '#2a1c12', socks: '#e8dcc0', cloth: tm.main, clothTrim: GOLDE };
      return s;
    }
    case 'cavalry':
      // Char léger : caisse de lin et de bois, deux chevaux, conducteur et lancier
      return chariotSpec({ type, tm, style: 'light', hold: 'spear', scale: 0.8, driver: driver(tm), fighter: chariotFighter(tm, 1.08, 'spear') });
    case 'knight':
      // Char lourd : caisse bardée, chevaux caparaçonnés aux couleurs de l'équipe, guerrier au khopesh
      return chariotSpec({ type, tm, style: 'heavy', hold: 'sword', scale: 0.82, driver: driver(tm), fighter: chariotFighter(tm, 1.12, 'sword') });
    case 'fishingboat':
    case 'warship': {
      const s = unitSpec(type, 'franks', teamIdx);
      s.sp = fisher(tm);
      if (s.archer) {
        const a = eg(tm, 0.84, { skin: SKIN_NUB, hem: 3.4, bracelet: COPPER });
        a.xhelm = { kind: 'nubian', band: tm.main, plume: '#f4f0e2' };
        a.weapon = 'bow';
        a.back = 'quiver';
        s.archer = dress(a);
      }
      return s;
    }
    default:
      return null;
  }
}

void TURQ;
