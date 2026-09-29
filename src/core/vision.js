// Brouillard de guerre : cases actuellement visibles et cases déjà explorées, par joueur.

import { BUILDINGS } from './defs.js';

const offsets = new Map();

/** Décalages (dx, dy) des cases dont le centre est dans un disque de rayon r (par pas de 0,5). */
function disk(r) {
  const key = Math.round(r * 2);
  let o = offsets.get(key);
  if (o) return o;
  const rr = key / 2;
  o = [];
  const R = Math.ceil(rr);
  for (let dy = -R; dy <= R; dy++) {
    for (let dx = -R; dx <= R; dx++) {
      if (dx * dx + dy * dy <= rr * rr + 0.25) o.push(dx, dy);
    }
  }
  offsets.set(key, o);
  return o;
}

export function computeVision(world, pl) {
  const S = world.S;
  const vis = pl.vis;
  const exp = pl.explored;
  if (world.revealMap) {
    vis.fill(1);
    exp.fill(1);
    return;
  }
  vis.fill(0);
  const idx = pl.idx;
  const stamp = (cx, cy, r) => {
    const tx = Math.floor(cx);
    const ty = Math.floor(cy);
    const o = disk(r);
    for (let i = 0; i < o.length; i += 2) {
      const x = tx + o[i];
      const y = ty + o[i + 1];
      if (x < 0 || y < 0 || x >= S || y >= S) continue;
      const id = y * S + x;
      vis[id] = 1;
      exp[id] = 1;
    }
  };
  for (const u of world.units) {
    if (u.owner === idx && !u.dead && !u.inside) stamp(u.x, u.y, world.stat(idx, u.type).los);
  }
  for (const b of world.buildings) {
    if (b.owner !== idx || b.dead) continue;
    stamp(b.x, b.y, (b.done ? BUILDINGS[b.type].los : 3) + b.w / 2);
  }
}
