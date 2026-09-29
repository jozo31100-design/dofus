// Animations des fantassins et villageois : chaque fonction renvoie une pose complète (cf. POSE0)
// et des options de dessin, à partir d'une phase (0..1) déjà quantifiée par le cache d'images.
import { PI, TAU, clamp, lerp, smooth, keyPose, wave } from './unit-kit.js';
import { POSE0 } from './unit-human.js';

/** Complète une pose partielle avec les valeurs neutres. */
export function full(o) {
  return Object.assign({}, POSE0, o);
}

/**
 * Cycle de marche paramétré : jambe proche en phase p, lointaine en p + ½.
 * La cuisse oscille, le genou fléchit pendant le passage vers l'avant ; le contact au sol est
 * calculé par le squelette, ce qui donne naturellement le rebond du bassin.
 */
export function walkLegs(p, amp = 0.44, bend = 1.0) {
  const leg = (q) => {
    const th = amp * Math.sin(q * TAU);
    const lift = Math.max(0, Math.cos(q * TAU + 0.35));
    return [th, th - bend * lift * lift - 0.04];
  };
  const [nT, nS] = leg(p);
  const [fT, fS] = leg(p + 0.5);
  return { nT, nS, fT, fS };
}

const STANCE = { nT: -0.1, nS: -0.12, fT: 0.12, fS: 0.06 };
const WIDE = { nT: -0.3, nS: -0.32, fT: 0.34, fS: 0.14 };
const KNEEL = { nT: 0.12, nS: -1.5, fT: 1.35, fS: 0.02 };
const CROUCH = { nT: 0.55, nS: -0.35, fT: 0.75, fS: -0.1 };

// Positions de repos des bras selon la manière de tenir l'arme.
const REST = {
  tool: { nU: 0.12, nF: 0.42, wA: 0.5, fU: 0.08, fF: 0.3 },
  sword: { nU: 0.28, nF: 1.15, wA: 2.25, fU: 0.2, fF: 1.3 },
  spear: { nU: 0.32, nF: 2.05, wA: 3.08, fU: 0.2, fF: 1.3 },
  bow: { nU: 0.08, nF: 0.35, fU: 0.2, fF: 0.75, aim: 0.55 },
  xbow: { ik: 3, aim: 2.3 },
  staff: { nU: 0.34, nF: 1.95, wA: 3.04, fU: 0.14, fF: 0.75 },
  fury: { nU: 0.5, nF: 1.45, wA: 2.1, fU: 0.35, fF: 1.1, lean: 0.1 },
};

/** Pose d'attente (respiration, arme qui balance légèrement). p = phase 0..1 du cycle de respiration. */
export function idlePose(hold, p, carry) {
  const b = 0.5 + 0.5 * Math.sin(p * TAU);
  const sway = Math.sin(p * TAU + 0.8) * 0.05;
  const o = full({ ...STANCE, ...REST[hold], br: b });
  o.nU += sway;
  o.wA += sway * 1.5;
  o.fU -= sway * 0.5;
  o.cape = 0.1 + 0.08 * b;
  if (carry) applyCarry(o, carry, 0);
  return o;
}

/** Pose de marche. p = phase 0..1 du pas. */
export function walkPose(hold, p, carry) {
  const o = full({ ...REST[hold], ...walkLegs(p) });
  const s = Math.sin(p * TAU);
  o.lean = (o.lean || 0) + 0.06;
  o.cape = 0.55 + 0.25 * Math.sin(p * TAU * 2);
  o.br = 0.5;
  if (hold === 'tool' || hold === 'bow') {
    o.nU = 0.1 - 0.42 * s;
    o.nF = o.nU + 0.35;
    o.fU = 0.1 + 0.42 * s;
    o.fF = o.fU + 0.4;
    o.wA = o.nF + 0.2;
    if (hold === 'bow') {
      o.fU = 0.2 + 0.2 * s;
      o.fF = 0.8 + 0.2 * s;
      o.aim = 0.6 + 0.2 * s;
    }
  } else if (hold === 'xbow') {
    // l'arbalète reste à l'épaule
  } else {
    o.nU += -0.12 * s;
    o.nF += -0.1 * s;
    o.wA += -0.1 * s;
    o.fU += 0.08 * s;
  }
  if (carry) applyCarry(o, carry, s);
  return o;
}

/** Bras qui portent une charge (cibles directes des mains). */
function applyCarry(o, carry, s) {
  if (carry === 'wood') {
    Object.assign(o, { ikN: 1, tnx: 2.4, tny: -1.2, bendN: -1 });
  } else if (carry === 'gold') {
    Object.assign(o, { ikN: 1, tnx: 0.6, tny: -1.6, bendN: -1 });
  } else if (carry === 'stone') {
    Object.assign(o, { ikN: 1, tnx: 5.0, tny: 5.4, ikF: 1, tfx: 2.8, tfy: 5.2, lean: -0.08 });
  } else if (carry === 'food') {
    Object.assign(o, { ikF: 1, tfx: 3.2, tfy: 5.8 });
  }
  if (carry === 'wood' || carry === 'gold') {
    o.fU = 0.12 + 0.4 * s;
    o.fF = o.fU + 0.4;
  }
}

// ---------------------------------------------------------------------------
// Attaques (coup unique : q = 0..1 sur la durée de l'attaque)
// ---------------------------------------------------------------------------

const SWING = [
  [0.0, { nU: 0.28, nF: 1.15, wA: 2.25, lean: 0.02, ...STANCE }],
  [0.36, { nU: 3.45, nF: 3.95, wA: 4.25, lean: -0.12, head: -0.06, fU: 0.35, fF: 1.1, ...WIDE, nT: -0.2 }],
  [0.54, { nU: 1.3, nF: 1.05, wA: 1.0, lean: 0.24, head: 0.12, bx: 0.9, fU: 0.1, fF: 0.9, ...WIDE }],
  [0.74, { nU: 1.05, nF: 0.85, wA: 0.75, lean: 0.16, bx: 0.7, ...WIDE }],
  [1.0, { nU: 0.28, nF: 1.15, wA: 2.25, lean: 0.02, bx: 0, ...STANCE }],
];

const THRUST = [
  [0.0, { nU: 0.55, nF: 1.5, wA: 1.72, fU: 0.3, fF: 1.2, ...STANCE }],
  [0.34, { nU: -0.15, nF: 1.3, wA: 1.68, lean: -0.1, bx: -0.5, ...WIDE }],
  [0.52, { nU: 1.35, nF: 1.62, wA: 1.62, lean: 0.26, bx: 1.2, ...WIDE, fT: 0.5 }],
  [0.72, { nU: 1.2, nF: 1.6, wA: 1.64, lean: 0.2, bx: 1.0, ...WIDE, fT: 0.45 }],
  [1.0, { nU: 0.55, nF: 1.5, wA: 1.72, fU: 0.3, fF: 1.2, bx: 0, ...STANCE }],
];

const THROW = [
  [0.0, { nU: 0.3, nF: 1.1, wA: 2.3, ...STANCE }],
  [0.4, { nU: 3.6, nF: 4.05, wA: 4.4, lean: -0.14, head: -0.08, fU: 1.2, fF: 1.5, ...WIDE }],
  [0.5, { nU: 2.2, nF: 2.0, wA: 2.2, lean: 0.12, fU: 0.6, fF: 1.0, ...WIDE, shot: 0 }],
  [0.52, { nU: 1.9, nF: 1.7, wA: 1.9, lean: 0.18, shot: 1, ...WIDE }],
  [0.7, { nU: 1.1, nF: 0.9, wA: 1.2, lean: 0.24, bx: 0.8, shot: 1, ...WIDE }],
  [0.94, { nU: 0.35, nF: 0.9, wA: 1.8, lean: 0.05, bx: 0.2, shot: 1, ...STANCE }],
  [1.0, { nU: 0.3, nF: 1.1, wA: 2.3, shot: 0, ...STANCE }],
];

const BLESS = [
  [0.0, { nU: 0.34, nF: 1.95, wA: 3.04, fU: 0.14, fF: 0.75, ...STANCE }],
  [0.4, { nU: 2.5, nF: 2.9, wA: 3.14, fU: 1.4, fF: 2.2, lean: -0.08, head: -0.15, ...STANCE }],
  [0.7, { nU: 2.5, nF: 2.9, wA: 3.14, fU: 1.4, fF: 2.2, lean: -0.08, head: -0.15, ...STANCE }],
  [1.0, { nU: 0.34, nF: 1.95, wA: 3.04, fU: 0.14, fF: 0.75, ...STANCE }],
];

/** Pose d'attaque. hold = manière de tenir l'arme, q = avancement 0..1, aimA = visée (convention des membres). */
export function attackPose(hold, q, aimA) {
  if (hold === 'bow') {
    // Lever l'arc, bander, décocher, garder la pose
    const up = smooth(clamp(q / 0.18));
    const pull = q < 0.2 ? 0 : q < 0.56 ? smooth((q - 0.2) / 0.36) : 0;
    const shot = q >= 0.56 && q < 0.96 ? 1 : 0;
    const o = full({ ...STANCE, ik: 1, aim: lerp(0.9, aimA, up), pull, shot, lean: -0.04 });
    if (q < 0.18) {
      o.ik = 0;
      o.nU = lerp(0.1, 0.9, up);
      o.nF = lerp(0.4, 1.6, up);
      o.fU = lerp(0.2, aimA, up);
      o.fF = lerp(0.75, aimA, up);
      o.aim = lerp(0.55, aimA, up);
    }
    if (shot) o.pull = 0.9 - 0.3 * clamp((q - 0.56) / 0.2);
    return o;
  }
  if (hold === 'xbow') {
    // Épauler (l'arme passe de la position de repos à la visée), tirer, recul, garder la visée
    if (q < 0.1) return full({ ...STANCE, ik: 3, aim: lerp(2.3, 1.9, q / 0.1) });
    const up = smooth(clamp((q - 0.1) / 0.18));
    const shot = q >= 0.45 && q < 0.97 ? 1 : 0;
    const rec = shot ? 1 - clamp((q - 0.45) / 0.2) : 0;
    return full({ ...STANCE, ik: 2, aim: lerp(1.9, aimA, up) - rec * 0.12, shot, pull: 1 - rec, lean: -0.05 - rec * 0.08, bx: -rec * 0.4 });
  }
  if (hold === 'spear') return full(keyPose(THRUST, q));
  if (hold === 'throw') return full(keyPose(THROW, q));
  if (hold === 'staff') return full(keyPose(BLESS, q));
  const o = full(keyPose(SWING, q));
  if (hold === 'fury') {
    o.lean += 0.1;
    o.bx += 0.4;
  }
  return o;
}

// ---------------------------------------------------------------------------
// Travail des villageois (cycles)
// ---------------------------------------------------------------------------

/** Durée du cycle (s) et arme/outil tenu pour chaque travail. */
export const WORK = {
  wood: { T: 1.0, tool: 'axe' },
  mine: { T: 1.1, tool: 'pickaxe' },
  farm: { T: 1.4, tool: 'hoe' },
  forage: { T: 1.6, tool: null },
  build: { T: 0.7, tool: 'hammer' },
  repair: { T: 0.8, tool: 'hammer' },
  hunt: { T: 1.0, tool: 'spear' },
  butcher: { T: 1.2, tool: 'knife' },
};

const CHOP = [
  [0.0, { ...WIDE, nU: 3.3, nF: 3.8, wA: 4.2, lean: -0.06, two: 1, grip: 2.2 }],
  [0.4, { ...WIDE, nU: 3.25, nF: 3.75, wA: 4.15, lean: -0.08, two: 1, grip: 2.2 }],
  [0.56, { ...WIDE, nU: 1.55, nF: 1.45, wA: 1.55, lean: 0.2, bx: 0.4, two: 1, grip: 2.2 }],
  [0.7, { ...WIDE, nU: 1.5, nF: 1.4, wA: 1.5, lean: 0.2, bx: 0.4, two: 1, grip: 2.2 }],
];
const PICK = [
  [0.0, { ...WIDE, nU: 3.2, nF: 3.7, wA: 4.0, lean: -0.05, two: 1, grip: 2.4 }],
  [0.38, { ...WIDE, nU: 3.15, nF: 3.65, wA: 3.95, lean: -0.05, two: 1, grip: 2.4 }],
  [0.55, { ...WIDE, nU: 1.15, nF: 0.9, wA: 0.95, lean: 0.36, bx: 0.3, two: 1, grip: 2.4 }],
  [0.7, { ...WIDE, nU: 1.1, nF: 0.85, wA: 0.9, lean: 0.36, bx: 0.3, two: 1, grip: 2.4 }],
];
const HOE = [
  [0.0, { ...WIDE, nU: 2.7, nF: 3.1, wA: 3.6, lean: 0.0, two: 1, grip: 3.2 }],
  [0.4, { ...WIDE, nU: 2.6, nF: 3.0, wA: 3.55, lean: 0.02, two: 1, grip: 3.2 }],
  [0.58, { ...WIDE, nU: 1.0, nF: 0.75, wA: 0.62, lean: 0.38, two: 1, grip: 3.2 }],
  [0.76, { ...WIDE, nU: 0.95, nF: 0.7, wA: 0.58, lean: 0.36, two: 1, grip: 3.2 }],
];
const PICKUP = [
  [0.0, { ...CROUCH, nU: 1.3, nF: 1.2, lean: 0.5, head: 0.1, fU: 0.4, fF: 1.3 }],
  [0.3, { ...CROUCH, nU: 1.1, nF: 0.9, lean: 0.55, head: 0.15, fU: 0.4, fF: 1.3 }],
  [0.55, { ...CROUCH, nU: 0.6, nF: 1.6, lean: 0.4, head: 0.05, fU: 0.4, fF: 1.3 }],
  [0.8, { ...CROUCH, nU: 1.4, nF: 1.35, lean: 0.52, head: 0.12, fU: 0.4, fF: 1.3 }],
];
const HAMMER = [
  [0.0, { ...STANCE, nU: 2.7, nF: 3.3, wA: 3.9, lean: -0.02, fU: 0.9, fF: 1.5 }],
  [0.35, { ...STANCE, nU: 2.65, nF: 3.25, wA: 3.85, lean: -0.02, fU: 0.9, fF: 1.5 }],
  [0.55, { ...STANCE, nU: 1.45, nF: 1.35, wA: 1.5, lean: 0.14, fU: 1.0, fF: 1.55 }],
  [0.7, { ...STANCE, nU: 1.4, nF: 1.3, wA: 1.45, lean: 0.14, fU: 1.0, fF: 1.55 }],
];
const HAMMER_LOW = [
  [0.0, { ...KNEEL, nU: 2.5, nF: 3.1, wA: 3.7, lean: 0.1, fU: 0.9, fF: 1.3 }],
  [0.35, { ...KNEEL, nU: 2.45, nF: 3.05, wA: 3.65, lean: 0.1, fU: 0.9, fF: 1.3 }],
  [0.55, { ...KNEEL, nU: 1.25, nF: 1.05, wA: 1.2, lean: 0.25, fU: 0.9, fF: 1.3 }],
  [0.7, { ...KNEEL, nU: 1.2, nF: 1.0, wA: 1.15, lean: 0.25, fU: 0.9, fF: 1.3 }],
];
const STAB = [
  [0.0, { ...WIDE, nU: 0.4, nF: 1.2, wA: 1.9, fU: 0.5, fF: 1.3, lean: 0.0 }],
  [0.3, { ...WIDE, nU: -0.25, nF: 1.1, wA: 1.8, fU: 0.4, fF: 1.2, lean: -0.08, bx: -0.3 }],
  [0.5, { ...WIDE, nU: 1.3, nF: 1.35, wA: 1.5, fU: 0.9, fF: 1.4, lean: 0.28, bx: 1.0 }],
  [0.66, { ...WIDE, nU: 1.25, nF: 1.3, wA: 1.45, fU: 0.9, fF: 1.4, lean: 0.26, bx: 0.9 }],
];
const CUT = [
  [0.0, { ...KNEEL, nU: 1.1, nF: 0.95, wA: 1.4, lean: 0.42, head: 0.15, fU: 0.9, fF: 0.8 }],
  [0.25, { ...KNEEL, nU: 0.8, nF: 0.55, wA: 1.0, lean: 0.46, head: 0.18, fU: 0.9, fF: 0.8 }],
  [0.5, { ...KNEEL, nU: 1.15, nF: 1.0, wA: 1.45, lean: 0.42, head: 0.15, fU: 0.85, fF: 0.75 }],
  [0.75, { ...KNEEL, nU: 0.85, nF: 0.6, wA: 1.05, lean: 0.46, head: 0.18, fU: 0.9, fF: 0.8 }],
];

/** Pose de travail d'un villageois : renvoie [pose, options]. */
export function workPose(work, p) {
  let keys;
  let opt = {};
  switch (work) {
    case 'wood':
      keys = CHOP;
      break;
    case 'mine':
      keys = PICK;
      break;
    case 'farm':
      keys = HOE;
      break;
    case 'forage':
      keys = PICKUP;
      opt = { basket: true };
      break;
    case 'build':
      keys = HAMMER;
      break;
    case 'repair':
      keys = HAMMER_LOW;
      break;
    case 'hunt':
      keys = STAB;
      break;
    case 'butcher':
      keys = CUT;
      break;
    default:
      keys = HAMMER;
  }
  return [full(keyPose(keys, p, true)), opt];
}

// ---------------------------------------------------------------------------
// Mort : s'effondre (genoux qui plient, chute en arrière), q = avancement 0..1
// ---------------------------------------------------------------------------

const FALL = [
  [0.0, { ...STANCE, nU: 0.8, nF: 1.2, fU: 0.6, fF: 1.0, lean: -0.1, head: -0.2 }],
  [0.3, { nT: 0.7, nS: -0.5, fT: 0.5, fS: -0.6, nU: 1.8, nF: 2.2, fU: 1.4, fF: 1.9, lean: -0.35, head: -0.4 }],
  [0.65, { nT: 0.6, nS: -0.2, fT: 0.9, fS: 0.2, nU: 2.6, nF: 2.9, fU: 2.2, fF: 2.6, lean: -0.2, head: -0.2 }],
  [1.0, { nT: 0.25, nS: 0.1, fT: 0.5, fS: 0.35, nU: 2.9, nF: 3.2, fU: 2.5, fF: 2.9, lean: -0.05, head: 0.1 }],
];

export function diePose(q) {
  const o = full(keyPose(FALL, q));
  // Rotation globale vers l'arrière (tête vers −x), corps recentré et écrasé au sol
  const f = smooth(clamp((q - 0.12) / 0.78));
  o.rot = -1.5 * f;
  o.flat = 1 - 0.38 * f;
  o.fx = 9 * f;
  o.wA = lerp(2.2, 1.2, q);
  return o;
}

export { STANCE, WIDE, KNEEL };
export const lerpA = lerp;
export const waveA = wave;
