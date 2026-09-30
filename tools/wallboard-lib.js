// Outils communs aux planches de murailles : herbe isométrique, placement de pièces avec calcul automatique du masque
// de voisinage (comme le fera le moteur), tri en profondeur et étiquettes.
import * as art from '../src/client/art/index.js';
import { BUILDINGS } from '../src/core/defs.js';

const CONNECTED = new Set(['palisade', 'palisade_gate', 'wall', 'gate', 'rampart', 'great_gate']);

/** Herbe : texture du terrain déformée en isométrie, répétée sur tout le canevas. */
export function paintGrass(ctx, W, H, seed = 7, z = 1) {
  const TW = 64;
  const tex = art.renderTerrainTexture(new Uint8Array(TW * TW), TW, TW, seed);
  ctx.save();
  ctx.scale(z, z);
  ctx.setTransform(z, 0.5 * z, -z, 0.5 * z, W / 2, -H * 2);
  ctx.fillStyle = ctx.createPattern(tex, 'repeat');
  ctx.fillRect(0, 0, 20000, 20000);
  ctx.restore();
}

export function label(ctx, text, x, y, size = 12) {
  ctx.font = `${size}px sans-serif`;
  ctx.textAlign = 'center';
  const w = ctx.measureText(text).width + 8;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(x - w / 2, y - size + 1, w, size + 4);
  ctx.fillStyle = '#fff';
  ctx.fillText(text, x, y);
}

/**
 * Scène de murailles : pieces = [{ type, civ, team, stage, x, y }] (x, y = case supérieure gauche ; une pièce 2×2 occupe 4 cases).
 * Les masques de voisinage sont calculés comme le moteur : bit 1 = un élément de muraille contre le côté +x de l'emprise, etc.
 * ox, oy : origine écran de la case (0, 0) ; z : zoom. Renvoie les temps de première génération.
 */
export function drawScene(ctx, pieces, ox, oy, z = 1, opts = {}) {
  const occ = new Map();
  const sizeOf = (p) => BUILDINGS[p.type].size;
  for (const p of pieces) {
    if (!CONNECTED.has(p.type)) continue;
    const n = sizeOf(p);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) occ.set(`${p.x + i},${p.y + j}`, p);
  }
  const has = (x, y, self) => {
    const q = occ.get(`${x},${y}`);
    return q && q !== self;
  };
  const maskOf = (p) => {
    if (!CONNECTED.has(p.type)) return 0;
    const n = sizeOf(p);
    let m = 0;
    for (let k = 0; k < n; k++) {
      if (has(p.x + n, p.y + k, p)) m |= 1;
      if (has(p.x + k, p.y + n, p)) m |= 2;
      if (has(p.x - 1, p.y + k, p)) m |= 4;
      if (has(p.x + k, p.y - 1, p)) m |= 8;
    }
    return m;
  };
  const list = pieces.map((p) => ({ p, n: sizeOf(p), key: p.x + p.y + sizeOf(p) }));
  list.sort((a, b) => a.key - b.key || a.p.x - b.p.x);
  const times = [];
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(z, z);
  for (const { p, n } of list) {
    const cx = p.x + n / 2;
    const cy = p.y + n / 2;
    const sx = (cx - cy) * 32;
    const sy = (cx + cy) * 16;
    const m = p.mask ?? maskOf(p);
    const t0 = performance.now();
    const s = art.getBuildingSprite(p.type, p.civ, p.team, p.stage ?? 3, m);
    times.push([`${p.type}/${p.civ}/s${p.stage ?? 3}/m${m}`, performance.now() - t0, s.h]);
    if (opts.diamonds) {
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(sx, sy - n * 16);
      ctx.lineTo(sx + n * 32, sy);
      ctx.lineTo(sx, sy + n * 16);
      ctx.lineTo(sx - n * 32, sy);
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.drawImage(s.canvas, Math.round(sx - s.ax), Math.round(sy - s.ay));
  }
  ctx.restore();
  return times;
}

/** Construit une liste de pièces à partir d'un plan texte : une lettre par case, '.' = vide. */
export function parsePlan(rows, legend, base = {}) {
  const out = [];
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '.' || ch === ' ') return;
      const d = legend[ch];
      if (!d) return;
      out.push({ ...base, ...d, x, y });
    });
  });
  return out;
}
