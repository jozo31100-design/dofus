// Postures propres aux héros et unités gauloises : grande épée à deux mains, javelot, fronde.
// S'enregistrent dans unit-poses.js (REST pour l'attente et la marche, ATTACK_EXT pour l'attaque).
import { TAU, clamp, lerp, smooth, keyPose } from './unit-kit.js';
import { REST, ATTACK_EXT, STANCE, WIDE, full } from './unit-poses.js';

REST.great = { nU: 0.6, nF: 1.45, wA: 2.5, two: 1, grip: 2.6, lean: 0.02 };
REST.jav = { nU: 0.3, nF: 1.85, wA: 2.8, fU: 0.2, fF: 1.0 };
REST.sling = { nU: 0.14, nF: 0.5, wA: 0, fU: 0.25, fF: 0.8 };

const GREAT = [
  [0.0, { ...STANCE, ...REST.great }],
  [0.4, { ...WIDE, nU: 3.2, nF: 3.7, wA: 4.4, lean: -0.16, head: -0.08, nT: -0.2, two: 1, grip: 2.6 }],
  [0.56, { ...WIDE, nU: 1.25, nF: 1.0, wA: 0.95, lean: 0.3, head: 0.12, bx: 1.1, two: 1, grip: 2.6 }],
  [0.78, { ...WIDE, nU: 1.1, nF: 0.9, wA: 0.85, lean: 0.2, bx: 0.8, two: 1, grip: 2.6 }],
  [1.0, { ...STANCE, ...REST.great, bx: 0 }],
];

ATTACK_EXT.great = (q) => full(keyPose(GREAT, q));

const THROWJ = [
  [0.0, { ...STANCE, ...REST.jav }],
  [0.4, { nU: 3.6, nF: 4.05, wA: 4.5, lean: -0.16, head: -0.08, fU: 1.2, fF: 1.5, ...WIDE }],
  [0.5, { nU: 2.2, nF: 2.0, wA: 2.2, lean: 0.12, fU: 0.6, fF: 1.0, ...WIDE, shot: 0 }],
  [0.52, { nU: 1.9, nF: 1.7, wA: 1.9, lean: 0.18, shot: 1, ...WIDE }],
  [0.7, { nU: 1.1, nF: 0.9, wA: 1.2, lean: 0.26, bx: 0.8, shot: 1, ...WIDE }],
  [0.94, { nU: 0.4, nF: 1.2, wA: 2.2, lean: 0.05, bx: 0.2, shot: 1, ...STANCE }],
  [1.0, { ...STANCE, ...REST.jav, shot: 0 }],
];
ATTACK_EXT.jav = (q) => full(keyPose(THROWJ, q));

/** Fronde : on lève le bras, la poche tournoie plusieurs tours, puis on lâche vers la cible (aimA). */
ATTACK_EXT.sling = (q, aimA) => {
  const up = smooth(clamp(q / 0.2));
  const rel = smooth(clamp((q - 0.6) / 0.12));
  const shot = q >= 0.66;
  const back = smooth(clamp((q - 0.78) / 0.22));
  let nU = lerp(0.14, 3.0, up);
  let nF = lerp(0.5, 3.3, up);
  if (q >= 0.6) {
    nU = lerp(3.0, aimA, rel);
    nF = lerp(3.3, aimA + 0.15, rel);
  }
  if (q >= 0.78) {
    nU = lerp(aimA, 0.14, back);
    nF = lerp(aimA + 0.15, 0.5, back);
  }
  const o = full({
    ...(q < 0.3 || q > 0.6 ? STANCE : WIDE),
    nU, nF, wA: 0, fU: lerp(0.25, 0.9, up) * (1 - back * 0.7) + 0.05, fF: lerp(0.8, 1.3, up),
    lean: q < 0.6 ? lerp(0, -0.1, up) : lerp(-0.1, 0.22, rel) * (1 - back),
    head: q < 0.6 ? lerp(0, -0.12, up) : 0,
    bx: q >= 0.6 ? 0.8 * rel * (1 - back) : 0,
  });
  // poche qui tournoie (absente au repos : la fronde pend), puis corde détendue après le lancer
  o.sl = q < 0.1 ? undefined : q * TAU * 4.6;
  o.slShot = shot ? 1 : 0;
  return o;
};
