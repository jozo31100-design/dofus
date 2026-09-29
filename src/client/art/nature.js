// Ressources, gibier et projectiles (API publique : getNodeSprite, drawAnimal, drawProjectile).
import { TAU, PI, clamp, fract, tone, rgba, edge, capsule, ell, poly, paint, line, ballGrad, setLightSide, bake, SpriteCache, ScalePicker, blit } from './unit-kit.js';
import { drawTree, treeShadow, TREE_KINDS } from './nature-trees.js';
import { drawBerries, drawGold, drawStone } from './nature-nodes.js';
import { drawBeast, drawCarcass, grazePose, walkPoseA, fleePose, fallPoseA } from './nature-animals.js';
import { francisca } from './unit-gear.js';

const spriteCache = new Map();

/** Nombre de variantes distinctes par type de ressource. */
export const NODE_VARIANTS = { tree: TREE_KINDS.length * 2, berries: 3, gold: 3, stone: 3, carcass: 2 };

function groundShadow(rx, ry, cx = 2, a = 0.28) {
  return (ctx) => {
    const g = ctx.createRadialGradient(cx, 1, 0, cx, 1, rx);
    g.addColorStop(0, `rgba(10,18,6,${a})`);
    g.addColorStop(0.65, `rgba(10,18,6,${a * 0.7})`);
    g.addColorStop(1, 'rgba(10,18,6,0)');
    ctx.save();
    ctx.translate(cx, 1);
    ctx.scale(1, ry / rx);
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, TAU);
    ctx.restore();
    ctx.fillStyle = g;
    ctx.fill();
  };
}

function dirtShadow(c) {
  return (ctx) => {
    const g = ctx.createRadialGradient(0, 2, 0, 0, 2, 30);
    g.addColorStop(0, rgba(c, 0.8));
    g.addColorStop(0.65, rgba(c, 0.5));
    g.addColorStop(1, rgba(c, 0));
    ctx.save();
    ctx.translate(0, 2);
    ctx.scale(1, 0.46);
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, TAU);
    ctx.restore();
    ctx.fillStyle = g;
    ctx.fill();
  };
}

/**
 * Sprite statique d'une ressource. Renvoie { canvas, ax, ay, h } (ax, ay : point au sol au centre de
 * la case dans le canvas, h : hauteur visible en px). variant est pris modulo le nombre de variantes ;
 * frac ∈ ]0,1] = quantité restante (ignorée pour les arbres).
 */
export function getNodeSprite(type, variant = 0, frac = 1) {
  const nv = NODE_VARIANTS[type] || 1;
  const v = ((variant | 0) % nv + nv) % nv;
  const f = clamp(frac, 0.01, 1);
  const fq = type === 'tree' ? 0 : type === 'berries' ? Math.ceil(f * 8) : Math.ceil(f * 5);
  const key = type + '|' + v + '|' + fq;
  let s = spriteCache.get(key);
  if (s) return s;
  const q = type === 'berries' ? fq / 8 : fq / 5;
  setLightSide(1);
  let h = 30;
  let r;
  if (type === 'tree') {
    const kind = v % TREE_KINDS.length;
    const seed = Math.floor(v / TREE_KINDS.length) + 1;
    r = bake([-40, -84, 46, 16], 1, (ctx) => { h = drawTree(ctx, kind, seed); }, (ctx) => treeShadow(ctx, kind), ['#0f1e08', 0.5]);
  } else if (type === 'berries') {
    r = bake([-22, -32, 24, 10], 1, (ctx) => { h = drawBerries(ctx, v, q); }, groundShadow(15, 6, 3), ['#10200a', 0.5]);
  } else if (type === 'gold') {
    r = bake([-34, -34, 36, 20], 1, (ctx) => { h = drawGold(ctx, v, q); }, dirtShadow('#6e5a40'), ['#1c140a', 0.5]);
  } else if (type === 'stone') {
    r = bake([-34, -34, 36, 20], 1, (ctx) => { h = drawStone(ctx, v, q); }, dirtShadow('#766c5c'), ['#1c1a14', 0.5]);
  } else if (type === 'carcass') {
    r = bake([-22, -22, 24, 10], 1, (ctx) => { drawCarcass(ctx, v === 1 ? 'sheep' : 'deer', q); }, groundShadow(14, 5, 1), ['#1c120a', 0.45]);
    h = 12;
  } else {
    r = bake([-16, -24, 16, 8], 1, (ctx) => {
      ctx.beginPath();
      ell(ctx, 0, -8, 10, 8);
      paint(ctx, '#aa33aa', null);
    }, null, null);
  }
  s = { canvas: r.c, ax: r.ox, ay: r.oy, h };
  spriteCache.set(key, s);
  return s;
}

// ---------------------------------------------------------------------------
// Gibier animé
// ---------------------------------------------------------------------------

const animalCache = new SpriteCache(1500);
const picker = new ScalePicker(300);
const GRAZE_T = 6;
const GRAZE_N = 16;
const WALK_T = 0.7;
const WALK_N = 12;
const FLEE_T = 1.2;
const FLEE_N = 10;
const FALL_T = 0.6;
const FALL_N = 7;
const A_ANIMS = { idle: 0, walk: 1, flee: 2, die: 3 };

/**
 * Animal animé. o : { type: 'deer'|'sheep', sx, sy, t, anim: 'idle'|'walk'|'flee'|'die', dir: 1|-1, deathT, scale }.
 * 'die' : t = secondes depuis la mort, l'animal tombe sur le flanc (deathT 0→1) et reste couché.
 */
export function drawAnimal(ctx, o) {
  const type = o.type === 'sheep' ? 'sheep' : 'deer';
  let a = A_ANIMS[o.anim];
  if (a === undefined) a = 0;
  const t = o.t || 0;
  let f;
  if (a === 0) f = Math.floor(fract(t / GRAZE_T) * GRAZE_N);
  else if (a === 1) f = Math.floor(fract(t / WALK_T) * WALK_N);
  else if (a === 2) f = type === 'sheep' ? Math.floor(fract(t / (WALK_T * 0.6)) * WALK_N) : Math.floor(fract(t / FLEE_T) * FLEE_N);
  else f = Math.min(FALL_N - 1, Math.floor(Math.max(t / FALL_T, o.deathT || 0) * (FALL_N - 1)));
  const dir = (o.dir || 1) < 0 ? -1 : 1;
  const m = ctx.getTransform();
  const s = o.scale || 1;
  const b = picker.pick(Math.hypot(m.a, m.b) * s);
  const key = ((((type === 'sheep' ? 1 : 0) * 4 + a) * 32 + f) * 2 + (dir > 0 ? 0 : 1)) * 1024 + Math.round(b * 64);
  let spr = animalCache.get(key);
  if (!spr) {
    let P;
    if (a === 0) P = grazePose(f / GRAZE_N);
    else if (a === 1) P = walkPoseA(f / WALK_N);
    else if (a === 2) P = type === 'sheep' ? walkPoseA(f / WALK_N) : fleePose(f / FLEE_N);
    else P = fallPoseA(f / (FALL_N - 1));
    const box = type === 'sheep' ? [-16, -22, 18, 6] : [-18, -38, 22, 6];
    const bx = dir > 0 ? box : [-box[2], box[1], -box[0], box[3]];
    const rx = type === 'sheep' ? 10 : 12;
    spr = bake(bx, b, (c) => {
      setLightSide(dir);
      c.scale(dir, 1);
      drawBeast(c, type, P);
    }, groundShadow(a === 3 ? rx + 2 : rx, 4, 1.5), ['#1b120a', 0.5]);
    animalCache.set(key, spr);
  }
  blit(ctx, spr, o.sx, o.sy, s, b, m, 1);
}

// ---------------------------------------------------------------------------
// Projectiles
// ---------------------------------------------------------------------------

/** Projectile en vol. kind : 'arrow' | 'axe' | 'stone' | 'bolt'. angle : direction à l'écran (radians), t en s. */
export function drawProjectile(ctx, kind, sx, sy, angle, t = 0) {
  ctx.save();
  ctx.translate(sx, sy);
  if (kind === 'stone') {
    ctx.rotate(t * 7);
    ctx.beginPath();
    poly(ctx, [-4.6, -1.2, -2.8, -4.2, 1.4, -4.6, 4.4, -2.0, 4.6, 1.8, 1.8, 4.4, -2.4, 4.2, -4.6, 1.8]);
    ctx.fillStyle = ballGrad(ctx, 0, 0, 5, '#9c978c', 0.35, -0.4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,36,30,0.85)';
    ctx.lineWidth = 0.9;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ell(ctx, -1.4, -1.8, 1.4, 0.9, -0.5);
    ctx.fill();
  } else if (kind === 'axe') {
    ctx.rotate(angle + t * 22);
    francisca(ctx, -2.5, 1.5, -2.2, 1.0);
  } else if (kind === 'bolt') {
    ctx.rotate(angle);
    line(ctx, -6, 0, 4, 0, '#2a1a0c', 2.0);
    line(ctx, -6, 0, 4, 0, '#8a6038', 1.2);
    ctx.beginPath();
    poly(ctx, [4, -1.4, 7.5, 0, 4, 1.4]);
    ctx.fillStyle = '#c3cad3';
    ctx.fill();
    ctx.strokeStyle = 'rgba(30,30,30,0.8)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.fillStyle = '#e8e0c8';
    ctx.beginPath();
    poly(ctx, [-6, 0, -3.8, -2.0, -2.6, -0.3]);
    poly(ctx, [-6, 0, -3.8, 2.0, -2.6, 0.3]);
    ctx.fill();
  } else {
    ctx.rotate(angle);
    line(ctx, -8, 0, 6, 0, 'rgba(30,20,10,0.8)', 1.6);
    line(ctx, -8, 0, 6, 0, '#d8b880', 0.9);
    ctx.beginPath();
    poly(ctx, [5.2, -1.6, 9, 0, 5.2, 1.6]);
    ctx.fillStyle = '#c3cad3';
    ctx.fill();
    ctx.strokeStyle = 'rgba(30,30,30,0.8)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    // Empennage
    ctx.fillStyle = '#f2ece0';
    ctx.beginPath();
    poly(ctx, [-8.4, 0, -5.4, -2.2, -4.2, -0.2]);
    ctx.fill();
    ctx.fillStyle = '#c8402a';
    ctx.beginPath();
    poly(ctx, [-8.4, 0, -5.4, 2.2, -4.2, 0.2]);
    ctx.fill();
  }
  ctx.restore();
}
