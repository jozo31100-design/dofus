// Sprites des bâtiments (API publique : getBuildingSprite, getRubbleSprite, buildingMetrics).
//
// Chaque bâtiment est un dessin procédural (building-gauls.js / building-franks.js) exécuté en trois passes
// sur le même « peintre » isométrique (building-gfx.js) :
//   1. relevé des emprises (pour les fondations et la tache de terre battue au sol) ;
//   2. relevé des ombres portées (enveloppes convexes projetées vers le bas-droite, fondues ensemble) ;
//   3. peinture.
// Le résultat est recadré au plus juste et mis en cache par (type, civilisation, équipe, stade).

import { BUILDINGS } from '../../core/defs.js';
import { TILE_W, TILE_H } from './constants.js';
import { makeCanvas } from './palette.js';
import { Gfx, hash, SH_X, SH_Y } from './building-gfx.js';
import { foundation, groundPatch } from './building-parts.js';
import { GAULS } from './building-gauls.js';
import { FRANKS } from './building-franks.js';
import { farm, rubble, siteFlag } from './building-common.js';

const DESIGNS = {
  gauls: { ...GAULS, farm },
  franks: { ...FRANKS, farm },
};

/** Hauteur nominale (px, zoom 1) du sommet de chaque bâtiment terminé au-dessus du sol. */
const HEIGHT = {
  hall: 144, house: 54, farm: 30, mill: 92, lumber: 50, mining: 48, barracks: 100, archery: 80,
  stable: 76, forge: 92, tower: 166, temple: 120, siege: 92, castle: 214,
};

const cache = new Map();

export function buildingMetrics(typeId) {
  return { h: HEIGHT[typeId] || 60 };
}

/** Ombres relevées : polygones fondus dans un calque, flouté et translucide. */
function paintShadows(g) {
  if (!g.shadows.length || (globalThis.__exp || {}).noshadow) return;
  const src = g.ctx.canvas;
  const { canvas, ctx } = makeCanvas(src.width, src.height);
  ctx.fillStyle = '#0c1226';
  for (const poly of g.shadows) {
    if (poly.length < 3) continue;
    ctx.beginPath();
    ctx.moveTo(poly[0][0], poly[0][1]);
    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
    ctx.closePath();
    ctx.fill();
  }
  const c = g.ctx;
  c.save();
  c.globalAlpha = 0.27;
  c.filter = 'blur(1.6px)';
  c.drawImage(canvas, 0, 0);
  c.restore();
}

/** Recadre un canvas sur ses pixels visibles ; renvoie le nouveau canvas et le décalage appliqué. */
function crop(canvas) {
  const w = canvas.width;
  const h = canvas.height;
  const data = canvas.getContext('2d').getImageData(0, 0, w, h).data;
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    let i = y * w * 4 + 3;
    for (let x = 0; x < w; x++, i += 4) {
      if (data[i] > 2) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        maxY = y;
      }
    }
  }
  if (maxX < 0) return { canvas, dx: 0, dy: 0 };
  minX = Math.max(0, minX - 1);
  minY = Math.max(0, minY - 1);
  maxX = Math.min(w - 1, maxX + 1);
  maxY = Math.min(h - 1, maxY + 1);
  const out = makeCanvas(maxX - minX + 1, maxY - minY + 1);
  out.ctx.drawImage(canvas, -minX, -minY);
  return { canvas: out.canvas, dx: minX, dy: minY };
}

/** Première ligne non vide d'un canvas. */
function topRow(canvas) {
  const w = canvas.width;
  const h = canvas.height;
  const data = canvas.getContext('2d').getImageData(0, 0, w, h).data;
  for (let y = 0; y < h; y++) {
    for (let i = y * w * 4 + 3, e = i + w * 4; i < e; i += 4) if (data[i] > 2) return y;
  }
  return h;
}

/** Canvas de travail assez grand pour un bâtiment de taille n et de hauteur hMax (ombre comprise). */
function workCanvas(n, hMax) {
  const padL = 26;
  const padR = 26 + Math.ceil(SH_X * hMax);
  const padT = 34;
  const padB = 18 + Math.ceil(SH_Y * hMax);
  const w = n * TILE_W + padL + padR;
  const h = n * TILE_H + hMax + padT + padB;
  const { canvas, ctx } = makeCanvas(w, h);
  return { canvas, ctx, ax: padL + (n * TILE_W) / 2, ay: padT + hMax + (n * TILE_H) / 2 };
}

/**
 * Sprite d'un bâtiment. stage : 0 fondations, 1 charpente et murs à 40 %, 2 presque fini, 3 terminé.
 * Renvoie { canvas, ax, ay, h } : (ax, ay) = centre de l'emprise au sol dans le canvas, h = hauteur du sommet (px).
 */
export function getBuildingSprite(typeId, civ, teamIdx, stage = 3) {
  const st = Number.isFinite(stage) ? Math.max(0, Math.min(3, Math.round(stage))) : 3;
  const cv = civ === 'franks' ? 'franks' : 'gauls';
  const tm = teamIdx | 0;
  const key = `${typeId}|${cv}|${tm}|${st}`;
  let s = cache.get(key);
  if (s) return s;
  const def = BUILDINGS[typeId];
  const n = def ? def.size : 2;
  const design = DESIGNS[cv][typeId];
  const T0 = performance.now();
  const W = workCanvas(n, (HEIGHT[typeId] || 100) + 30);
  const g = new Gfx(W.ctx, W.ax, W.ay, { stage: st, civ: cv, team: tm, size: n, seed: hash(typeId, cv) });
  if (!design) {
    // type inconnu : simple tas de caisses pour ne jamais échouer
    g.box(-0.3, -0.3, 0.3, 0.3, 0, 12, { col: '#9a7a56' });
  } else if (design.custom) {
    g.mode = 'shadow';
    design(g);
    paintShadows(g);
    g.mode = 'draw';
    design(g);
    if (st < 3) siteFlag(g);
  } else {
    g.mode = 'plan';
    design(g);
    const plans = g.plans;
    g.mode = 'draw';
    globalThis.__t1 = performance.now() - T0;
    if (st === 0) {
      foundation(g, plans, design.found || {});
      siteFlag(g);
    } else {
      if (design.ground) design.ground(g, plans);
      else groundPatch(g, plans, { alpha: st === 3 ? 0.5 : 0.62 });
      globalThis.__t2 = performance.now() - T0;
      let T = performance.now();
      g.mode = 'shadow';
      design(g);
      const tS1 = performance.now() - T; T = performance.now();
      paintShadows(g);
      const tS2 = performance.now() - T; T = performance.now();
      g.mode = 'draw';
      design(g);
      const tD = performance.now() - T;
      if (globalThis.__prof) globalThis.__prof.push([typeId, civ, st, tS1.toFixed(1), tS2.toFixed(1), tD.toFixed(1)]);
      if (st < 3) siteFlag(g);
    }
  }
  // hauteur du sommet mesurée avant la fumée (dessins différés)
  const T3 = performance.now();
  const top = topRow(W.canvas);
  for (const f of g.late) f();
  const cr = crop(W.canvas);
  const ax = W.ax - cr.dx;
  const ay = W.ay - cr.dy;
  s = { canvas: cr.canvas, ax, ay, h: Math.max(4, Math.round(W.ay - top)) };
  if (globalThis.__prof) globalThis.__prof.push(['setup+plan', globalThis.__t1.toFixed(1), 'ground', globalThis.__t2.toFixed(1), 'crop', (performance.now() - T3).toFixed(1), 'total', (performance.now() - T0).toFixed(1)]);
  cache.set(key, s);
  return s;
}

/** Tas de gravats laissé par un bâtiment détruit de size × size cases. Renvoie { canvas, ax, ay }. */
export function getRubbleSprite(size, variant = 0) {
  const n = Math.max(1, Math.min(8, size | 0));
  const v = (variant | 0) % 4;
  const key = `rubble|${n}|${v}`;
  let s = cache.get(key);
  if (s) return s;
  const W = workCanvas(n, 30);
  const g = new Gfx(W.ctx, W.ax, W.ay, { stage: 3, size: n, seed: hash('rubble', n, v) });
  rubble(g, n, v);
  const cr = crop(W.canvas);
  s = { canvas: cr.canvas, ax: W.ax - cr.dx, ay: W.ay - cr.dy };
  cache.set(key, s);
  return s;
}
