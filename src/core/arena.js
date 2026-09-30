// Carte « Grande arène » pour 3 à 8 joueurs : les camps sont répartis sur un cercle autour d'un lieu central (le Trésor des Anciens).
//
// Équité : chaque camp reçoit exactement les mêmes amas de ressources (mêmes nombres, placés dans un repère tourné vers le centre),
// les mêmes moutons et le même étang de pêche ; entre deux camps voisins se trouvent des gisements à se partager et des points
// stratégiques. Terrain, forêts et étangs du reste de la carte sont tirés d'une graine fixe (la carte est la même pour tous).

import { MAP_SIZE, NODES } from './defs.js';
import { mulberry32, fbm } from './util.js';
import { GRASS, WATER, DEFAULT_SEED } from './mapgen.js';

const S = MAP_SIZE;
const C = S / 2;

/** Emplacement (centre de la salle) du camp i parmi n. */
export function campCenter(i, n) {
  const R = n <= 4 ? 44 : 50;
  const a = 0.75 * Math.PI + (i * 2 * Math.PI) / n;
  return { x: Math.round(C + R * Math.cos(a)), y: Math.round(C + R * Math.sin(a)), a, R };
}

export function generateArena(seed = DEFAULT_SEED, n = 4) {
  n = Math.max(3, Math.min(8, n | 0));
  const rng = mulberry32((seed ^ (n * 7919)) >>> 0);
  const terrain = new Uint8Array(S * S); // tout en herbe (GRASS = 0)
  const used = new Uint8Array(S * S);
  const nodes = [];
  const animals = [];
  const points = [];
  const inMap = (x, y) => x >= 0 && y >= 0 && x < S && y < S;
  const free = (x, y) => inMap(x, y) && terrain[y * S + x] === GRASS && !used[y * S + x];
  const protect = (cx, cy, r) => {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) if (inMap(x, y) && Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r) used[y * S + x] = 1;
    }
  };
  const addNode = (type, x, y, amount) => {
    if (!free(x, y)) return false;
    used[y * S + x] = 1;
    nodes.push({ type, x, y, amount: amount || NODES[type].amount });
    return true;
  };
  const cluster = (type, cx, cy, count, jitter = 1.2) => {
    const cand = [];
    const R = 7;
    for (let dy = -R; dy <= R; dy++) {
      for (let dx = -R; dx <= R; dx++) {
        const x = Math.round(cx) + dx;
        const y = Math.round(cy) + dy;
        if (free(x, y)) cand.push({ x, y, d: Math.hypot(x - cx, y - cy) + rng() * jitter });
      }
    }
    cand.sort((a, b) => a.d - b.d);
    let placed = 0;
    for (const c of cand) {
      if (placed >= count) break;
      if (addNode(type, c.x, c.y)) placed++;
    }
  };
  const animal = (type, x, y) => {
    for (let r = 0; r <= 5; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const tx = Math.floor(x) + dx;
          const ty = Math.floor(y) + dy;
          if (free(tx, ty)) { used[ty * S + tx] = 1; animals.push({ type, x: tx + 0.3 + rng() * 0.4, y: ty + 0.3 + rng() * 0.4 }); return; }
        }
      }
    }
  };
  const pond = (cx, cy, r) => {
    for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++) {
      for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++) {
        if (inMap(x, y) && Math.hypot(x + 0.5 - cx, y + 0.5 - cy) < r + (((x * 7 + y * 13) % 5) - 2) * 0.12) { terrain[y * S + x] = WATER; used[y * S + x] = 1; }
      }
    }
  };
  const fish = (cx, cy) => {
    for (const [dx, dy] of [[0, 0], [1, 1], [-1, 0], [0, -1]]) {
      const x = Math.round(cx) + dx;
      const y = Math.round(cy) + dy;
      let deep = true;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (!inMap(x + i, y + j) || terrain[(y + j) * S + x + i] !== WATER) deep = false;
      if (deep && !nodes.some((q) => q.x === x && q.y === y)) { nodes.push({ type: 'fish', x, y, amount: NODES.fish.amount }); return; }
    }
  };

  const camps = [];
  for (let i = 0; i < n; i++) camps.push(campCenter(i, n));

  // zones dégagées : camps, centre
  for (const c of camps) protect(c.x, c.y, 10);
  protect(C, C, 8);

  // étang de pêche de chaque camp (même position relative : vers le centre, un peu de côté)
  for (const c of camps) {
    const tx = -Math.cos(c.a);
    const ty = -Math.sin(c.a);
    const px = -ty;
    const py = tx;
    const fx = c.x + tx * 15 + px * 6;
    const fy = c.y + ty * 15 + py * 6;
    pond(fx, fy, 3.2);
    fish(fx, fy);
    fish(fx + 0.5, fy + 0.5);
    fish(fx - 0.5, fy - 0.5);
  }
  // quelques étangs supplémentaires entre les camps
  for (let i = 0; i < n; i++) {
    const a = camps[i].a + Math.PI / n;
    const r = camps[i].R * 0.55;
    if (i % 2 === 0) pond(C + r * Math.cos(a) + 3, C + r * Math.sin(a) - 3, 2.6);
  }

  // points stratégiques : trésor au centre, collines entre les camps
  points.push({ type: 'pt_treasure', tx: C - 1, ty: C - 1 });
  const hillCount = Math.max(2, n >> 1);
  for (let k = 0; k < hillCount; k++) {
    const gap = Math.floor((k * n) / hillCount);
    const a = camps[gap].a + Math.PI / n;
    const r = camps[gap].R * 0.62;
    const hx = Math.round(C + r * Math.cos(a)) - 1;
    const hy = Math.round(C + r * Math.sin(a)) - 1;
    points.push({ type: 'pt_hill', tx: hx, ty: hy });
    protect(hx + 1, hy + 1, 5);
  }
  for (const p of points) for (let y = p.ty; y < p.ty + 2; y++) for (let x = p.tx; x < p.tx + 2; x++) if (inMap(x, y)) terrain[y * S + x] = GRASS;

  // ressources de chaque camp (repère : t = vers le centre, p = perpendiculaire)
  for (const c of camps) {
    const tx = -Math.cos(c.a);
    const ty = -Math.sin(c.a);
    const px = -ty;
    const py = tx;
    const at = (u, v) => [c.x + tx * u + px * v, c.y + ty * u + py * v];
    for (const [u, v] of [[-5, -4], [-7, -2], [-4, -7], [-7, -6]]) animal('sheep', ...at(u, v));
    cluster('berries', ...at(3, -10), 6);
    cluster('gold', ...at(-9, 10), 9);
    cluster('stone', ...at(-9, -10), 9);
    cluster('stone', ...at(0, -16), 6);
    cluster('berries', ...at(6, 12), 5);
    cluster('gold', ...at(13, 13), 6);
    cluster('stone', ...at(13, -13), 6);
    for (const [u, v] of [[-14, 3], [-12, -4]]) for (let k = 0; k < 4; k++) animal('deer', at(u, v)[0] + (rng() - 0.5) * 3, at(u, v)[1] + (rng() - 0.5) * 3);
  }
  // gisements à se partager entre camps voisins et gibier
  for (let i = 0; i < n; i++) {
    const a = camps[i].a + Math.PI / n;
    const r = camps[i].R * 0.86;
    const mx = C + r * Math.cos(a);
    const my = C + r * Math.sin(a);
    cluster('gold', mx, my, 6);
    cluster('stone', mx + Math.cos(a + 1.5) * 6, my + Math.sin(a + 1.5) * 6, 7);
    for (let k = 0; k < 4; k++) animal('deer', mx + (rng() - 0.5) * 4, my + (rng() - 0.5) * 4);
  }
  cluster('gold', C + 9, C - 4, 5);
  cluster('stone', C - 9, C + 4, 5);

  // halo : pas de forêt collée aux ressources
  const halo = new Uint8Array(S * S);
  for (const q of nodes) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (inMap(q.x + dx, q.y + dy)) halo[(q.y + dy) * S + q.x + dx] = 1;

  // forêts
  const treeSeed = (seed * 31 + n) >>> 0;
  for (let ty = 0; ty < S; ty++) {
    for (let tx = 0; tx < S; tx++) {
      if (!free(tx, ty) || halo[ty * S + tx]) continue;
      let nearWater = false;
      for (let dy = -2; dy <= 2 && !nearWater; dy++) for (let dx = -2; dx <= 2; dx++) if (inMap(tx + dx, ty + dy) && terrain[(ty + dy) * S + tx + dx] !== GRASS) { nearWater = true; break; }
      if (nearWater) continue;
      const v = fbm(tx / 11, ty / 11, treeSeed, 3);
      let p = 0;
      if (v > 0.57) p = Math.min(0.9, 0.35 + (v - 0.57) * 9);
      else if (v > 0.5) p = 0.05;
      if (p > 0 && rng() < p) addNode('tree', tx, ty);
    }
  }

  // couloirs entre camps voisins : on abat les arbres sur la droite qui les relie (et jusqu'au centre)
  const treeAt = new Map();
  nodes.forEach((q, idx) => { if (q.type === 'tree') treeAt.set(q.y * S + q.x, idx); });
  const carve = (x0, y0, x1, y1) => {
    const len = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
    for (let k = 0; k <= len; k++) {
      const x = Math.round(x0 + ((x1 - x0) * k) / len);
      const y = Math.round(y0 + ((y1 - y0) * k) / len);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const idx = treeAt.get((y + dy) * S + x + dx);
        if (idx !== undefined) { nodes[idx].type = 'removed'; treeAt.delete((y + dy) * S + x + dx); }
      }
    }
  };
  for (let i = 0; i < n; i++) {
    const c = camps[i];
    const d = camps[(i + 1) % n];
    carve(c.x, c.y, d.x, d.y);
    carve(c.x, c.y, C, C);
  }
  const finalNodes = nodes.filter((q) => q.type !== 'removed');

  // unités de départ : mêmes positions relatives pour tous
  const starts = camps.map((c) => {
    const tx = -Math.cos(c.a);
    const ty = -Math.sin(c.a);
    const px = -ty;
    const py = tx;
    const off = [[3.4, -1.5], [3.6, 0], [3.4, 1.5], [3.2, 3], [2.5, -3]];
    return {
      hall: { x: c.x - 2, y: c.y - 2 },
      units: off.map(([u, v], i) => ({ type: i === 4 ? 'scout' : 'villager', x: c.x + tx * u + px * v, y: c.y + ty * u + py * v })),
    };
  });
  return { size: S, seed, terrain, nodes: finalNodes, animals, starts, points, arena: n };
}

/** Contrôle d'une carte d'arène : salles reliées à pied, rien d'enterré sous un bâtiment. */
export function checkArena(map) {
  const problems = [];
  const { size, terrain, nodes, starts } = map;
  const blocked = new Uint8Array(size * size);
  for (let i = 0; i < blocked.length; i++) if (terrain[i] === WATER) blocked[i] = 1;
  for (const q of nodes) if (q.type === 'tree') blocked[q.y * size + q.x] = 1;
  const seen = new Uint8Array(size * size);
  const h0 = starts[0].hall;
  const q = [(h0.y + 4) * size + h0.x + 1];
  seen[q[0]] = 1;
  for (let i = 0; i < q.length; i++) {
    const x = q[i] % size;
    const y = (q[i] / size) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
      const id = ny * size + nx;
      if (seen[id] || blocked[id]) continue;
      seen[id] = 1;
      q.push(id);
    }
  }
  starts.forEach((s, i) => { if (!seen[(s.hall.y + 4) * size + s.hall.x + 1]) problems.push(`le camp ${i} n'est pas relié au camp 0`); });
  let unreachable = 0;
  for (const nd of nodes) {
    if (nd.type === 'tree' || nd.type === 'fish') continue;
    let ok = false;
    for (let dy = -1; dy <= 1 && !ok; dy++) for (let dx = -1; dx <= 1; dx++) { const x = nd.x + dx; const y = nd.y + dy; if (x >= 0 && y >= 0 && x < size && y < size && seen[y * size + x]) { ok = true; break; } }
    if (!ok) unreachable++;
  }
  if (unreachable) problems.push(`${unreachable} ressources inaccessibles`);
  return problems;
}
