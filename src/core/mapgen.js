// Génération de LA carte du jeu : « La Rivière des Carnutes ».
//
// Deux camps aux extrémités d'une diagonale, séparés par une rivière sinueuse franchissable en trois gués.
// La carte est identique pour tout le monde (graine fixe) et strictement symétrique par rotation de 180° :
// tout ce qui existe d'un côté existe à l'identique de l'autre, donc la partie est équitable.
//
// Pour garantir la symétrie, on ne construit que la moitié haute (lignes y < S/2) puis on la recopie
// par le miroir central (x, y) -> (S-1-x, S-1-y).

import { MAP_SIZE, NODES } from './defs.js';
import { mulberry32, fbm } from './util.js';

const S = MAP_SIZE;
const HALF = S / 2;
// La carte a été dessinée pour 96 x 96 cases. Agrandie, les camps s'éloignent (F) mais gardent leur disposition locale :
// `loc` déplace ce qui appartient au camp, `mid` étire ce qui se trouve entre les camps.
const F = S / 96;

export const GRASS = 0;
export const FORD = 1;
export const WATER = 2;

export const DEFAULT_SEED = 1789;

const mirrorTile = (tx, ty) => [S - 1 - tx, S - 1 - ty];

/** Décalage latéral (en cases) de l'axe de la rivière, impair : c(S-s) = -c(s). */
function riverCenter(s) {
  const t = (s - S) / (2 * S);
  return 8 * Math.sin(2 * Math.PI * t) + 2.5 * Math.sin(4 * Math.PI * t);
}

/** Demi-largeur de la rivière (paire en t : symétrique). */
function riverHalfWidth(s) {
  const t = (s - S) / (2 * S);
  return 2.5 + 0.7 * Math.cos(6 * Math.PI * t);
}

const FORD_CENTERS = [S - 40 * F, S, S + 40 * F]; // positions le long de la diagonale (x + y)
const FORD_HALF_LEN = 5;

function terrainAt(tx, ty) {
  const cx = tx + 0.5;
  const cy = ty + 0.5;
  const s = cx + cy;
  const d = cx - cy;
  const lateral = Math.abs(d - riverCenter(s)) / Math.SQRT2;
  const hw = riverHalfWidth(s);
  if (lateral < hw) {
    for (const f of FORD_CENTERS) if (Math.abs(s - f) < FORD_HALF_LEN) return FORD;
    return WATER;
  }
  // Étangs (moitié haute uniquement : recopiés en miroir ensuite)
  for (const p of PONDS) {
    if (Math.hypot(cx - p.x, cy - p.y) < p.r) return WATER;
  }
  return GRASS;
}

const HALL_TL = [Math.round(S / 2 + (72 - 48) * F), Math.round(S / 2 + (19 - 48) * F)]; // coin haut-gauche de l'emprise 4x4 du camp du haut
const SHIFT = [HALL_TL[0] - 72, HALL_TL[1] - 19];
const loc = (x, y) => [x + SHIFT[0], y + SHIFT[1]];
const mid = (x, y) => [S / 2 + (x - 48) * F, S / 2 + (y - 48) * F];

const PONDS = [
  { x: 62.5 + SHIFT[0], y: 30.5 + SHIFT[1], r: 3.1 },
  { x: mid(20.5, 40.5)[0], y: mid(20.5, 40.5)[1], r: 2.8 },
];

// Positions de départ (moitié haute = joueur 1, côté droit de l'écran ; joueur 0 = miroir).

export function generateMap(seed = DEFAULT_SEED) {
  const rng = mulberry32(seed);
  const terrain = new Uint8Array(S * S);
  const used = new Uint8Array(S * S); // 1 = case prise par un nœud ou une zone protégée
  const nodes = [];
  const animals = [];

  // --- Terrain : on calcule la moitié haute, on recopie en miroir -----------------------
  for (let ty = 0; ty < HALF; ty++) {
    for (let tx = 0; tx < S; tx++) {
      const t = terrainAt(tx, ty);
      terrain[ty * S + tx] = t;
      const [mxT, myT] = mirrorTile(tx, ty);
      terrain[myT * S + mxT] = t;
    }
  }
  // Les étangs de la moitié basse existent déjà par miroir. Le terrain est complet.

  const isGrass = (tx, ty) => tx >= 0 && ty >= 0 && tx < S && ty < S && terrain[ty * S + tx] === GRASS;
  const free = (tx, ty) => isGrass(tx, ty) && !used[ty * S + tx];

  /** Ajoute un nœud (et son jumeau en miroir). */
  function addNode(type, tx, ty, amount) {
    if (!free(tx, ty)) return false;
    const [mxT, myT] = mirrorTile(tx, ty);
    if (!free(mxT, myT) && (mxT !== tx || myT !== ty)) return false;
    const amt = amount || NODES[type].amount;
    used[ty * S + tx] = 1;
    used[myT * S + mxT] = 1;
    nodes.push({ type, x: tx, y: ty, amount: amt });
    nodes.push({ type, x: mxT, y: myT, amount: amt });
    return true;
  }

  /** Place un animal (et son jumeau) sur la case libre la plus proche du point demandé. */
  function addAnimal(type, x, y) {
    let best = null;
    for (let r = 0; r <= 5 && !best; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const tx = Math.floor(x) + dx;
          const ty = Math.floor(y) + dy;
          if (free(tx, ty) && !animalTiles.has(ty * S + tx)) { best = [tx, ty]; break; }
        }
        if (best) break;
      }
    }
    if (!best) return;
    animalTiles.add(best[1] * S + best[0]);
    used[best[1] * S + best[0]] = 1;
    used[(S - 1 - best[1]) * S + (S - 1 - best[0])] = 1;
    const ax = best[0] + 0.3 + rng() * 0.4;
    const ay = best[1] + 0.3 + rng() * 0.4;
    animals.push({ type, x: ax, y: ay });
    animals.push({ type, x: S - ax, y: S - ay });
  }
  const animalTiles = new Set();

  /** Amas compact de n nœuds autour d'un point : on prend les cases libres les plus proches. */
  function cluster(type, cx, cy, n, opts = {}) {
    const cand = [];
    const R = 7;
    for (let dy = -R; dy <= R; dy++) {
      for (let dx = -R; dx <= R; dx++) {
        const tx = Math.round(cx) + dx;
        const ty = Math.round(cy) + dy;
        if (!free(tx, ty)) continue;
        const d = Math.hypot(tx - cx, (ty - cy) * (opts.squash || 1)) + rng() * (opts.jitter ?? 1.1);
        cand.push({ tx, ty, d });
      }
    }
    cand.sort((a, b) => a.d - b.d);
    let placed = 0;
    for (const c of cand) {
      if (placed >= n) break;
      if (addNode(type, c.tx, c.ty, opts.amount)) placed++;
    }
    return placed;
  }

  // --- Zones protégées autour des salles principales ----------------------------------
  const hallCx = HALL_TL[0] + 2;
  const hallCy = HALL_TL[1] + 2;
  const protect = (cx, cy, r) => {
    for (let ty = Math.floor(cy - r); ty <= Math.ceil(cy + r); ty++) {
      for (let tx = Math.floor(cx - r); tx <= Math.ceil(cx + r); tx++) {
        if (tx < 0 || ty < 0 || tx >= S || ty >= S) continue;
        if (Math.hypot(tx + 0.5 - cx, ty + 0.5 - cy) <= r) {
          used[ty * S + tx] = 1;
          const [mxT, myT] = mirrorTile(tx, ty);
          used[myT * S + mxT] = 1;
        }
      }
    }
  };
  protect(hallCx, hallCy, 7.5);
  // Espaces dégagés autour des gués
  for (const f of FORD_CENTERS) {
    const c = f / 2;
    protect(c, c, 6);
  }

  // --- Ressources de départ (moitié haute, miroir automatique) ---------------------------
  // Moutons près de la salle
  for (const [ox, oy] of [[-5.5, -4.5], [-7, -2.5], [-4, -7], [-7.5, -6]]) addAnimal('sheep', hallCx + ox, hallCy + oy);
  // Baies : à gauche/bas de la salle
  cluster('berries', ...loc(67, 27), 6, { jitter: 1.3 });
  // Or et pierre
  cluster('gold', ...loc(82, 31), 7, { jitter: 1.4 });
  cluster('stone', ...loc(65, 11), 5, { jitter: 1.4 });

  // Ressources d'expansion et du milieu (posées avant les arbres pour rester dégagées)
  cluster('gold', ...mid(55, 38), 4, { jitter: 1.2 });
  cluster('berries', ...loc(88, 24), 5, { jitter: 1.2 });
  cluster('stone', ...mid(50, 17), 4, { jitter: 1.2 });
  cluster('gold', ...mid(42, 13), 4, { jitter: 1.2 });
  // la carte agrandie offre aussi des gisements au large : ils valent le déplacement
  cluster('gold', ...mid(66, 24), 5, { jitter: 1.3 });
  cluster('stone', ...mid(70, 40), 4, { jitter: 1.2 });
  cluster('berries', ...mid(30, 14), 5, { jitter: 1.2 });
  cluster('stone', ...mid(24, 28), 4, { jitter: 1.2 });

  // Halo : aucune forêt ne doit enfermer une mine ou des baies (deux cases de dégagement)
  const halo = new Uint8Array(S * S);
  for (const n of nodes) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const x = n.x + dx;
        const y = n.y + dy;
        if (x >= 0 && y >= 0 && x < S && y < S) halo[y * S + x] = 1;
      }
    }
  }

  // --- Forêts -------------------------------------------------------------------------
  // Bosquet de départ derrière la salle, autre bosquet sur le flanc
  const gv = (x, y, rx, ry, p, local = true) => { const [gx, gy] = local ? loc(x, y) : mid(x, y); return { x: gx, y: gy, rx, ry, p }; };
  const groves = [
    gv(87, 12, 6.5, 6.5, 0.85),
    gv(82, 16, 3.6, 4, 0.8),
    gv(78, 6, 5, 3.5, 0.8),
    gv(60, 19, 4.5, 4, 0.8),
    gv(90, 30, 3.5, 6, 0.7),
    gv(68, 34, 5, 4.5, 0.75, false),
    gv(34, 20, 5.5, 5, 0.75, false),
  ];
  const treeSeed = seed * 7 + 3;
  for (let ty = 0; ty < HALF; ty++) {
    for (let tx = 0; tx < S; tx++) {
      if (!free(tx, ty) || halo[ty * S + tx]) continue;
      // proche d'une rive : pas d'arbre
      let nearWater = false;
      for (let dy = -2; dy <= 2 && !nearWater; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const x2 = tx + dx;
          const y2 = ty + dy;
          if (x2 >= 0 && y2 >= 0 && x2 < S && y2 < S && terrain[y2 * S + x2] !== GRASS) { nearWater = true; break; }
        }
      }
      if (nearWater) continue;
      let p = 0;
      const n = fbm(tx / 11, ty / 11, treeSeed, 3);
      if (n > 0.57) p = Math.min(0.92, 0.35 + (n - 0.57) * 9);
      else if (n > 0.5) p = 0.04;
      for (const g of groves) {
        const e = Math.hypot((tx - g.x) / g.rx, (ty - g.y) / g.ry);
        if (e < 1) p = Math.max(p, g.p * (1 - Math.max(0, e - 0.6) * 1.6));
      }
      if (p > 0 && rng() < p) addNode('tree', tx, ty);
    }
  }

  // --- Gibier ------------------------------------------------------------------------
  for (const [hx, hy] of [loc(58, 9), loc(89, 39), mid(70, 42), mid(40, 20), mid(56, 24), mid(28, 34)]) {
    for (let i = 0; i < 4; i++) addAnimal('deer', hx + (rng() - 0.5) * 3, hy + (rng() - 0.5) * 3);
  }


  // --- Poissons : quelques bancs dans l'étang de chaque camp et le long de la rivière (jumeaux en miroir) --------
  const isDeep = (tx, ty) => tx >= 0 && ty >= 0 && tx < S && ty < S && terrain[ty * S + tx] === WATER;
  const deepInterior = (tx, ty) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!isDeep(tx + dx, ty + dy)) return false;
    return true;
  };
  const fishTiles = [];
  function addFish(tx, ty) {
    if (!deepInterior(tx, ty)) return false;
    const [mxT, myT] = mirrorTile(tx, ty);
    if (mxT === tx && myT === ty) return false;
    for (const f of fishTiles) {
      if (Math.max(Math.abs(f[0] - tx), Math.abs(f[1] - ty)) < 2) return false;
      if (Math.max(Math.abs(f[0] - mxT), Math.abs(f[1] - myT)) < 2) return false;
    }
    fishTiles.push([tx, ty], [mxT, myT]);
    nodes.push({ type: 'fish', x: tx, y: ty, amount: NODES.fish.amount });
    nodes.push({ type: 'fish', x: mxT, y: myT, amount: NODES.fish.amount });
    return true;
  }
  function fishCluster(cx, cy, n, R = 4) {
    const cand = [];
    for (let dy = -R; dy <= R; dy++) {
      for (let dx = -R; dx <= R; dx++) {
        const tx = Math.round(cx) + dx;
        const ty = Math.round(cy) + dy;
        if (!deepInterior(tx, ty)) continue;
        cand.push({ tx, ty, d: Math.hypot(tx - cx, ty - cy) + rng() * 1.2 });
      }
    }
    cand.sort((a, b) => a.d - b.d);
    let placed = 0;
    for (const c of cand) {
      if (placed >= n) break;
      if (addFish(c.tx, c.ty)) placed++;
    }
  }
  for (const p of PONDS) fishCluster(p.x, p.y, 4, 3);
  for (const sPos of [24 * F, 42 * F, 74 * F]) {
    const d = riverCenter(sPos);
    fishCluster((sPos + d) / 2, (sPos - d) / 2, 3, 4);
  }

  // --- Accès : on abat les arbres qui enferment une ressource --------------------------------
  carveAccess(terrain, nodes);

  // --- Unités de départ ------------------------------------------------------------------
  const starts = [];
  // joueur 1 (moitié haute) : à gauche/bas de la salle ; joueur 0 : miroir
  const off = [[-1.5, 3.4], [0, 3.6], [1.5, 3.4], [3, 3.2], [-3, 2.5]];
  const p1Units = off.map(([ox, oy], i) => ({ type: i === 4 ? 'scout' : 'villager', x: hallCx + ox, y: hallCy + oy }));
  const p1 = { hall: { x: HALL_TL[0], y: HALL_TL[1] }, units: p1Units };
  const p0 = {
    hall: { x: S - HALL_TL[0] - 4, y: S - HALL_TL[1] - 4 },
    units: p1Units.map((u) => ({ type: u.type, x: S - u.x, y: S - u.y })),
  };
  starts[0] = p0;
  starts[1] = p1;

  return { size: S, seed, terrain, nodes, animals, starts };
}

/** Cases atteignables à pied depuis un point (l'eau et les arbres bloquent ; les mines et baies s'épuiseront). */
function floodFrom(terrain, nodes, sx, sy) {
  const blocked = new Uint8Array(S * S);
  for (let i = 0; i < blocked.length; i++) if (terrain[i] === WATER) blocked[i] = 1;
  for (const n of nodes) if (n.type === 'tree') blocked[n.y * S + n.x] = 1;
  const seen = new Uint8Array(S * S);
  const q = [sy * S + sx];
  seen[q[0]] = 1;
  for (let i = 0; i < q.length; i++) {
    const x = q[i] % S;
    const y = (q[i] / S) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= S || ny >= S) continue;
      const id = ny * S + nx;
      if (seen[id] || blocked[id]) continue;
      seen[id] = 1;
      q.push(id);
    }
  }
  return seen;
}

/** Abat les arbres autour des ressources qu'aucun chemin n'atteint, jusqu'à ce que tout soit accessible. */
function carveAccess(terrain, nodes) {
  const startX = HALL_TL[0] - 1;
  const startY = HALL_TL[1] + 4;
  for (let round = 0; round < 6; round++) {
    const seen = floodFrom(terrain, nodes, startX, startY);
    const stuck = nodes.filter((n) => {
      if (n.type === 'tree' || n.type === 'fish') return false;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const x = n.x + dx;
        const y = n.y + dy;
        if (x >= 0 && y >= 0 && x < S && y < S && seen[y * S + x]) return false;
      }
      return true;
    });
    if (!stuck.length) return;
    const doomed = new Set();
    for (const n of stuck) {
      for (let dy = -1 - round; dy <= 1 + round; dy++) for (let dx = -1 - round; dx <= 1 + round; dx++) {
        doomed.add(`${n.x + dx},${n.y + dy}`);
        doomed.add(`${S - 1 - n.x - dx},${S - 1 - n.y - dy}`);
      }
    }
    for (let i = nodes.length - 1; i >= 0; i--) {
      if (nodes[i].type === 'tree' && doomed.has(`${nodes[i].x},${nodes[i].y}`)) nodes.splice(i, 1);
    }
  }
}

/** Vérifie l'équité et l'accessibilité de la carte (utilisé par les tests). */
export function checkMap(map) {
  const problems = [];
  const { size, terrain, nodes, starts } = map;
  // symétrie du terrain
  for (let ty = 0; ty < size; ty++) {
    for (let tx = 0; tx < size; tx++) {
      if (terrain[ty * size + tx] !== terrain[(size - 1 - ty) * size + (size - 1 - tx)]) { problems.push(`terrain asymétrique en ${tx},${ty}`); ty = size; break; }
    }
  }
  // nœuds : symétrie par type et absence de superposition
  const key = (n) => `${n.type}:${n.x},${n.y}`;
  const set = new Set(nodes.map(key));
  if (set.size !== nodes.length) problems.push('nœuds superposés');
  for (const n of nodes) {
    if (!set.has(`${n.type}:${size - 1 - n.x},${size - 1 - n.y}`)) problems.push(`nœud sans jumeau ${key(n)}`);
    if (n.type === 'fish' ? terrain[n.y * size + n.x] !== WATER : terrain[n.y * size + n.x] !== GRASS) problems.push(`nœud mal placé ${key(n)}`);
  }
  // accessibilité : les deux salles sont reliées à pied
  const start = starts[0];
  const seen = floodFrom(terrain, nodes, start.hall.x + 4, start.hall.y + 1 >= 0 ? start.hall.y - 1 : 0);
  const other = starts[1];
  if (!seen[(other.hall.y + 4) * size + (other.hall.x - 1)]) problems.push('les deux bases ne sont pas reliées');
  // chaque nœud de ressource utile est atteignable (au moins une case voisine accessible)
  let unreachable = 0;
  for (const n of nodes) {
    if (n.type === 'tree' || n.type === 'fish') continue;
    let ok = false;
    for (let dy = -1; dy <= 1 && !ok; dy++) for (let dx = -1; dx <= 1; dx++) {
      const x = n.x + dx;
      const y = n.y + dy;
      if (x >= 0 && y >= 0 && x < size && y < size && seen[y * size + x]) { ok = true; break; }
    }
    if (!ok) unreachable++;
  }
  if (unreachable) problems.push(`${unreachable} ressources inaccessibles`);
  return problems;
}
