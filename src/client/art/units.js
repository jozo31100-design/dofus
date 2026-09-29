// Dessin des unités (API publique : drawUnit, unitMetrics).
//
// Chaque image d'animation est dessinée une seule fois en vectoriel (personnage articulé, cheval, engin),
// avec son contour de silhouette et son ombre, puis mise en cache sous forme de sprite recadré. La clé
// comprend le type, la civilisation, l'équipe, l'animation, le travail, la charge, l'image, la direction,
// la visée et la résolution. La résolution suit l'échelle réelle du contexte (zoom × scale) : à l'écran,
// le sprite est recopié au pixel près, donc net et rapide (400 unités ≈ 2 ms sans GPU).
import {
  PI, TAU, clamp, lerp, smooth, fract, setLightSide, bakeSprite, alive, SpriteCache, ScalePicker, blit,
} from './unit-kit.js';
import { drawHuman } from './unit-human.js';
import { idlePose, walkPose, attackPose, workPose, diePose, full, WORK, STANCE } from './unit-poses.js';
import { drawHorse, gallopPose, standPose, fallPose } from './unit-horse.js';
import { drawRam, drawCatapult } from './unit-siege.js';
import { unitSpec, METRICS } from './unit-specs.js';
import * as G from './unit-gear.js';

const TYPES = [
  'villager', 'militia', 'spearman', 'swordsman', 'champion', 'archer', 'crossbow', 'scout', 'cavalry',
  'knight', 'ram', 'catapult', 'francisque', 'gesate', 'healer',
];
const TYPE_IDX = Object.fromEntries(TYPES.map((t, i) => [t, i]));
const ANIMS = ['idle', 'walk', 'work', 'attack', 'die'];
const ANIM_IDX = Object.fromEntries(ANIMS.map((a, i) => [a, i]));
const WORKS = ['wood', 'mine', 'farm', 'forage', 'build', 'repair', 'hunt', 'butcher'];
const WORK_IDX = Object.fromEntries(WORKS.map((w, i) => [w, i + 1]));
const CARRIES = [null, 'wood', 'food', 'gold', 'stone'];
const CARRY_IDX = { wood: 1, food: 2, gold: 3, stone: 4 };

// Rythmes des animations (secondes) et nombre d'images par cycle.
const IDLE_T = 3.2;
const IDLE_N = 8;
const WALK_T = 0.7;
const WALK_N = 12;
const WORK_N = 12;
/** Durée d'une attaque (préparation puis frappe). Au-delà, l'unité reprend la pose d'attente. */
export const ATTACK_T = 0.55;
const ATT_N = 11;
/** Durée de l'effondrement ; l'effacement suit deathT. */
const DIE_T = 0.8;
const DIE_N = 9;
const AIM_N = 11;
const AIM_MAX = 1.25;

const OUTLINE = ['#1b120a', 0.55];

const specs = new Map();
function specOf(type, civ, team) {
  const k = type + civ + team;
  let s = specs.get(k);
  if (!s) {
    s = unitSpec(type, civ, team);
    specs.set(k, s);
  }
  return s;
}

const cache = new SpriteCache(12000);
const picker = new ScalePicker(400);

/** Dimensions pour la sélection et les barres de vie : { h : hauteur en px, w : demi-largeur en px }. */
export function unitMetrics(type) {
  return METRICS[type] || METRICS.villager;
}

const RANGED = { bow: 1, xbow: 1 };

/** Image d'animation à afficher (quantifiée) pour un état d'unité. */
function frameOf(o, S) {
  const t = Number.isFinite(o.t) ? o.t : 0;
  let anim = ANIM_IDX[o.anim] === undefined ? 0 : ANIM_IDX[o.anim];
  let f = 0;
  let q = 0;
  let work = 0;
  let carry = 0;
  let aim = 0;
  let alpha = 1;
  const isVil = S.kind === 'human' && S.sp && S.type === 'villager';
  if (anim === 3) {
    if (t >= ATTACK_T || t < 0) anim = 0;
    else {
      f = Math.min(ATT_N - 1, Math.floor((t / ATTACK_T) * ATT_N));
      q = f / ATT_N;
      if (RANGED[S.hold]) {
        let a = Number.isFinite(o.aim) ? o.aim : 0;
        if ((o.dir || 1) < 0) a = PI - a;
        a = Math.atan2(Math.sin(a), Math.cos(a));
        aim = Math.round(((clamp(a, -AIM_MAX, AIM_MAX) + AIM_MAX) / (2 * AIM_MAX)) * (AIM_N - 1));
      }
    }
  }
  if (anim === 0) {
    f = Math.floor(fract(t / IDLE_T) * IDLE_N);
    q = f / IDLE_N;
  } else if (anim === 1) {
    f = Math.floor(fract(t / WALK_T) * WALK_N);
    q = f / WALK_N;
  } else if (anim === 2) {
    work = WORK_IDX[o.work] || 5;
    const T = WORK[WORKS[work - 1]].T;
    f = Math.floor(fract(t / T) * WORK_N);
    q = f / WORK_N;
    if (!isVil) {
      // Seuls les villageois travaillent : les autres restent en attente
      anim = 0;
      work = 0;
      f = Math.floor(fract(t / IDLE_T) * IDLE_N);
      q = f / IDLE_N;
    }
  } else if (anim === 4) {
    f = Math.min(DIE_N - 1, Math.floor((Math.max(0, t) / DIE_T) * (DIE_N - 1)));
    q = f / (DIE_N - 1);
    const d = Number.isFinite(o.deathT) ? o.deathT : 0;
    alpha = clamp((1 - d) / 0.35);
  }
  if (isVil && (anim === 0 || anim === 1)) {
    carry = CARRY_IDX[o.carry] || 0;
    if (!carry && o.work && WORK_IDX[o.work]) work = WORK_IDX[o.work];
  }
  return { anim, f, q, work, carry, aim, alpha, dir: (o.dir || 1) < 0 ? -1 : 1 };
}

// ---------------------------------------------------------------------------
// Dessin d'une image (en coordonnées locales, regard vers +x)
// ---------------------------------------------------------------------------

function aimLimb(fr) {
  const local = -AIM_MAX + (fr.aim / (AIM_N - 1)) * 2 * AIM_MAX;
  return PI / 2 - local;
}

function humanFrame(ctx, S, fr) {
  const sp = S.sp;
  let hold = S.hold;
  let P;
  const opt = {};
  const vil = S.type === 'villager';
  if (fr.anim === 2) {
    const w = WORKS[fr.work - 1];
    const r = workPose(w, fr.q);
    P = r[0];
    Object.assign(opt, r[1]);
    opt.weapon = WORK[w].tool;
  } else if (fr.anim === 3) {
    if (vil) {
      hold = 'sword';
      opt.weapon = 'axe';
    }
    P = attackPose(hold, fr.q, aimLimb(fr));
  } else if (fr.anim === 4) {
    P = diePose(fr.q);
    if (vil) opt.weapon = null;
  } else {
    const carry = CARRIES[fr.carry];
    if (vil) {
      opt.carry = carry;
      opt.weapon = carry ? null : fr.work ? WORK[WORKS[fr.work - 1]].tool : null;
      if (opt.weapon === 'spear') opt.weapon = 'javelin';
    }
    P = fr.anim === 1 ? walkPose(hold, fr.q, carry) : idlePose(hold, fr.q, carry);
  }
  if (P.rot || P.flat !== 1 || P.fx) {
    ctx.save();
    ctx.translate(P.fx, 0);
    ctx.scale(1, P.flat);
    ctx.rotate(P.rot);
    drawHuman(ctx, sp, P, opt);
    ctx.restore();
  } else drawHuman(ctx, sp, P, opt);
}

/** Pose du cavalier (bassin sur la selle, jambe proche pendante). */
function riderPose(S, fr, R) {
  const hold = S.hold;
  const legs = { nT: 1.05, nS: 0.1, fT: 1.0, fS: 0.05 };
  let o;
  if (fr.anim === 3) {
    if (hold === 'lance') {
      const k = [
        [0.0, { nU: 0.6, nF: 1.5, wA: 1.75, lean: 0.05 }],
        [0.35, { nU: 0.1, nF: 1.45, wA: 1.72, lean: -0.05, bx: -0.5 }],
        [0.55, { nU: 1.3, nF: 1.6, wA: 1.62, lean: 0.25, bx: 1.0 }],
        [0.8, { nU: 1.2, nF: 1.58, wA: 1.64, lean: 0.2, bx: 0.8 }],
        [1.0, { nU: 0.6, nF: 1.5, wA: 1.75, lean: 0.05 }],
      ];
      o = full(keyPoseLocal(k, fr.q));
    } else if (hold === 'spear') {
      const k = [
        [0.0, { nU: 0.5, nF: 1.9, wA: 2.2 }],
        [0.35, { nU: 2.4, nF: 2.7, wA: 2.1, lean: -0.08 }],
        [0.55, { nU: 1.4, nF: 1.2, wA: 1.15, lean: 0.25 }],
        [0.8, { nU: 1.3, nF: 1.1, wA: 1.1, lean: 0.2 }],
        [1.0, { nU: 0.5, nF: 1.9, wA: 2.2 }],
      ];
      o = full(keyPoseLocal(k, fr.q));
    } else {
      o = attackPose('sword', fr.q, PI / 2);
      o.lean *= 0.6;
      o.bx = 0;
    }
  } else if (fr.anim === 1) {
    const s = Math.sin(fr.q * TAU);
    o = full({ lean: 0.16 + 0.04 * s, nU: 0.4, nF: 1.5, wA: hold === 'lance' ? 2.35 : 2.2, cape: 0.8 + 0.2 * s, br: 0.5 });
    if (hold === 'spear') o.wA = 2.0;
  } else {
    const b = 0.5 + 0.5 * Math.sin(fr.q * TAU);
    o = full({ lean: 0.02, nU: 0.3, nF: 1.9, wA: hold === 'lance' ? 3.0 : hold === 'spear' ? 2.9 : 2.3, br: b, cape: 0.15 });
  }
  Object.assign(o, legs);
  // Main lointaine sur les rênes (ou bouclier en avant)
  if (!S.sp.shield) Object.assign(o, { ikF: 1, tfx: 4.2, tfy: 5.0 });
  else {
    o.fU = 0.5;
    o.fF = 1.3;
  }
  o.seat = 1;
  o.mx = R.saddle[0];
  o.my = R.saddle[1] + 0.8 * R.z;
  return o;
}

function keyPoseLocal(keys, p) {
  for (let i = 0; i < keys.length - 1; i++) {
    const [p0, a] = keys[i];
    const [p1, b] = keys[i + 1];
    if (p >= p0 && p <= p1) {
      const t = smooth((p - p0) / (p1 - p0));
      const out = {};
      for (const k in a) out[k] = a[k] + ((b[k] === undefined ? a[k] : b[k]) - a[k]) * t;
      for (const k in b) if (out[k] === undefined) out[k] = b[k];
      return out;
    }
  }
  return keys[keys.length - 1][1];
}

function mountedFrame(ctx, S, fr) {
  const H = S.horse;
  let hp;
  if (fr.anim === 1) hp = gallopPose(fr.q);
  else if (fr.anim === 4) hp = fallPose(fr.q);
  else hp = standPose(fr.anim === 3 ? 0.2 : fr.q);
  const dying = fr.anim === 4;
  const f = dying ? smooth(clamp(fr.q / 0.85)) : 0;
  ctx.save();
  if (dying) {
    // Le cheval bascule sur le flanc : écrasement vertical autour du sol
    ctx.scale(1, hp.flat);
  }
  drawHorse(ctx, H, hp, (c, R) => {
    const P = riderPose(S, fr, R);
    const opt = { mounted: true };
    if (S.hold === 'lance') opt.weapon = 'lance';
    if (dying) {
      c.save();
      const [sx, sy] = R.saddle;
      c.translate(sx - 10 * f, sy + 12 * f);
      c.rotate(-1.3 * f);
      c.translate(-sx, -sy);
      drawHuman(c, S.sp, P, opt);
      c.restore();
    } else drawHuman(c, S.sp, P, opt);
  });
  ctx.restore();
}

function siegeFrame(ctx, S, fr) {
  const P = { spin: 0, swing: 0, brk: 0, wave: 0, bob: 0, arm: 0, loaded: true };
  if (fr.anim === 1) {
    P.spin = fr.q * PI;
    P.bob = Math.abs(Math.sin(fr.q * TAU * 2)) * -0.4;
    P.wave = Math.sin(fr.q * TAU) * 1.2;
  } else if (fr.anim === 0) {
    P.wave = Math.sin(fr.q * TAU) * 0.8;
  } else if (fr.anim === 3) {
    const q = fr.q;
    if (S.kind === 'ram') {
      P.swing = q < 0.4 ? -smooth(q / 0.4) : q < 0.55 ? lerp(-1, 1, smooth((q - 0.4) / 0.15)) : 1 - smooth((q - 0.55) / 0.45);
    } else {
      P.arm = q < 0.12 ? 0 : q < 0.24 ? smooth((q - 0.12) / 0.12) : 1 - smooth((q - 0.3) / 0.7) * (q > 0.3 ? 1 : 0);
      P.loaded = q < 0.16 || q > 0.92;
      P.spin = q > 0.3 ? (q - 0.3) * TAU * 1.5 : 0;
    }
  } else if (fr.anim === 4) {
    P.brk = smooth(fr.q);
  }
  if (S.kind === 'ram') drawRam(ctx, S, P);
  else drawCatapult(ctx, S, P);
}

function drawFrame(ctx, S, fr) {
  if (S.kind === 'human') humanFrame(ctx, S, fr);
  else if (S.kind === 'mounted') mountedFrame(ctx, S, fr);
  else siegeFrame(ctx, S, fr);
}

/** Ombre douce au sol, décalée vers le bas-droite (lumière en haut à gauche). */
function shadowOf(S, fr) {
  const m = METRICS[S.type] || METRICS.villager;
  let rx = m.w + 1.5;
  let ry = Math.max(3.2, rx * 0.36);
  let cx = 1.2;
  let a = 0.3;
  if (S.kind === 'human' && fr.anim === 4) {
    const f = smooth(clamp((fr.q - 0.12) / 0.78));
    rx = lerp(rx, 13, f);
    cx += fr.dir * lerp(0, -3, f);
  } else if (S.kind === 'mounted') {
    rx = m.w + 2;
    ry = 5.5;
    a = 0.32;
  } else if (S.kind === 'ram' || S.kind === 'catapult') {
    rx = 33;
    ry = 11;
    cx = 2;
    if (fr.anim === 4) a *= 1 - smooth(fr.q) * 0.5;
  }
  return { cx, cy: 1, rx, ry, a };
}

function bakeFrame(S, fr, b) {
  const [l, t, r, bt] = S.box;
  const box = fr.dir > 0 ? [l, t, r, bt] : [-r, t, -l, bt];
  return bakeSprite(
    box,
    b,
    (ctx) => {
      setLightSide(fr.dir);
      ctx.scale(fr.dir, 1);
      drawFrame(ctx, S, fr);
    },
    shadowOf(S, fr),
    OUTLINE,
  );
}

// ---------------------------------------------------------------------------
// Budget de cuisson : une image nouvelle coûte ~0,5 à 1 ms. Pour éviter les à-coups quand beaucoup
// d'images apparaissent d'un coup (début de bataille, changement de zoom), on s'accorde au plus ~5 ms de
// cuisson par image affichée (seau à jetons) ; au-delà, on affiche temporairement la même image déjà
// cuite à une autre résolution, ou à défaut la dernière image cuite de la même animation, et la bonne
// image est cuite aux images suivantes. Le résultat final est identique ; seule la montée en cache
// est étalée.
// ---------------------------------------------------------------------------

const BUDGET_MAX = 16;
const BUDGET_RATE = 0.3; // ms de cuisson accordées par ms écoulée
const budget = { tokens: BUDGET_MAX, last: -1, force: false };
const stats = { baked: 0, fallbacks: 0 };
const sameFrame = new Map(); // image (toutes résolutions) -> dernier sprite cuit
const sameAnim = new Map(); // animation (toutes images) -> dernier sprite cuit
const sameUnit = new Map(); // unité (type, civilisation, équipe) -> dernier sprite cuit

function bakeAllowed() {
  if (budget.force) return true;
  const now = performance.now();
  if (budget.last >= 0) budget.tokens = Math.min(BUDGET_MAX, budget.tokens + (now - budget.last) * BUDGET_RATE);
  budget.last = now;
  return budget.tokens > 0;
}

/**
 * Dessine une unité.
 * o : { type, civ, team, sx, sy (pieds), t (horloge en s), anim: 'idle'|'walk'|'work'|'attack'|'die',
 *       dir: 1|-1, aim (angle écran), work: 'wood'|'mine'|'farm'|'forage'|'build'|'repair'|'hunt'|'butcher',
 *       carry: null|'wood'|'food'|'gold'|'stone', deathT: 0..1, scale }
 */
export function drawUnit(ctx, o) {
  const type = TYPE_IDX[o.type] === undefined ? 'villager' : o.type;
  const civ = o.civ === 'gauls' || o.civ === 'franks' ? o.civ : type === 'gesate' ? 'gauls' : 'franks';
  const team = (o.team | 0) & 7;
  const S = specOf(type, civ, team);
  if (!S.type) S.type = type;
  const fr = frameOf(o, S);
  if (fr.alpha <= 0) return;
  const m = ctx.getTransform();
  const s = o.scale || 1;
  const k = Math.hypot(m.a, m.b) * s;
  const b = picker.pick(k);
  const unitKey = (TYPE_IDX[type] * 2 + (civ === 'gauls' ? 1 : 0)) * 8 + team;
  const animKey = (((unitKey * 5 + fr.anim) * 9 + fr.work) * 5 + fr.carry) * 2 + (fr.dir > 0 ? 0 : 1);
  const frameKey = (animKey * 16 + fr.f) * 13 + fr.aim;
  const key = frameKey * 65536 + Math.round(b * 4096);
  let spr = cache.get(key);
  if (!spr) {
    let alt = sameFrame.get(frameKey);
    if (!alt || !alive(alt.spr)) alt = sameAnim.get(animKey);
    if (!alt || !alive(alt.spr)) alt = sameUnit.get(unitKey);
    if (alt && alive(alt.spr) && !bakeAllowed()) {
      stats.fallbacks++;
      blit(ctx, alt.spr, o.sx, o.sy, s, alt.b, m, fr.alpha);
      return;
    }
    stats.baked++;
    const t0 = performance.now();
    spr = bakeFrame(S, fr, b);
    if (!budget.force) budget.tokens -= performance.now() - t0;
    cache.set(key, spr);
    if (sameFrame.size > 12000) sameFrame.clear();
    if (sameAnim.size > 4000) sameAnim.clear();
    sameFrame.set(frameKey, { spr, b });
    sameAnim.set(animKey, { spr, b });
    sameUnit.set(unitKey, { spr, b });
  }
  blit(ctx, spr, o.sx, o.sy, s, b, m, fr.alpha);
}

/**
 * Prépare à l'avance les images d'une unité (écran de chargement) pour qu'elles ne soient pas cuites
 * pendant la partie. anims : liste parmi 'idle', 'walk', 'attack', 'die', 'work'. zoom : échelle prévue
 * (zoom × devicePixelRatio). Pour les villageois, 'idle' et 'walk' incluent les variantes avec outil en
 * main et avec charge portée.
 */
export function prewarmUnit(type, civ, team, anims = ['idle', 'walk', 'attack'], zoom = 1) {
  const m = { a: zoom, b: 0, c: 0, d: zoom, e: 0, f: 0 };
  const ctx = {
    getTransform: () => m,
    setTransform() {},
    drawImage() {},
    globalAlpha: 1,
  };
  budget.force = true;
  picker.stable(zoom);
  try {
    for (const anim of anims) {
      const T = anim === 'walk' ? WALK_T : anim === 'attack' ? ATTACK_T : anim === 'die' ? DIE_T : IDLE_T;
      const n = anim === 'walk' ? WALK_N : anim === 'attack' ? ATT_N : anim === 'die' ? DIE_N : IDLE_N;
      for (const dir of [1, -1]) {
        for (let i = 0; i < n; i++) {
          const vil = type === 'villager' && (anim === 'idle' || anim === 'walk');
          const works = anim === 'work' || vil ? WORKS : [null];
          for (const w of works) {
            const T2 = anim === 'work' ? WORK[w].T : T;
            const n2 = anim === 'work' ? WORK_N : n;
            if (i >= n2) continue;
            drawUnit(ctx, { type, civ, team, sx: 0, sy: 0, t: ((i + 0.5) / n2) * T2, anim, dir, work: w });
          }
          if (vil) {
            for (const c of CARRIES) drawUnit(ctx, { type, civ, team, sx: 0, sy: 0, t: ((i + 0.5) / n) * T, anim, dir, carry: c });
          }
        }
      }
    }
  } finally {
    budget.force = false;
  }
}

/** Nombre de sprites en cache (diagnostic). */
export function unitCacheSize() {
  return cache.size;
}

/** Statistiques de cuisson (diagnostic) : sprites en cache, images cuites, replis temporaires. */
export function unitStats() {
  return { cached: cache.size, baked: stats.baked, fallbacks: stats.fallbacks };
}
