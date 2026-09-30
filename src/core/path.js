// Recherche de chemin sur la grille de cases : A* à 8 directions, puis lissage.
//
// Les buts peuvent être :
//   { kind: 'point', x, y }                        aller en un point
//   { kind: 'rect', x0, y0, x1, y1, reach }        s'approcher d'un rectangle (bâtiment, ressource, unité)
//                                                  jusqu'à `reach` cases de son bord
// Si le but est inaccessible, on renvoie le chemin vers la case atteignable la plus proche (partial = true).

import { MinHeap } from './util.js';

const SQRT2 = Math.SQRT2;
const DX = [1, -1, 0, 0, 1, 1, -1, -1];
const DY = [0, 0, 1, -1, 1, -1, 1, -1];
const COST = [1, 1, 1, 1, SQRT2, SQRT2, SQRT2, SQRT2];

export function distToRect(px, py, x0, y0, x1, y1) {
  const dx = px < x0 ? x0 - px : px > x1 ? px - x1 : 0;
  const dy = py < y0 ? y0 - py : py > y1 ? py - y1 : 0;
  return Math.hypot(dx, dy);
}

export class PathGrid {
  /** @param {number} size côté de la carte ; @param {Uint8Array} blocked 1 = case infranchissable (partagé, mis à jour par le monde) */
  constructor(size, blocked) {
    this.S = size;
    this.blocked = blocked;
    const N = size * size;
    this.g = new Float32Array(N);
    this.parent = new Int32Array(N);
    this.seen = new Uint32Array(N);
    this.done = new Uint32Array(N);
    this.goal = new Uint32Array(N);
    this.stamp = 0;
    this.heap = new MinHeap();
  }

  isBlocked(tx, ty) {
    return tx < 0 || ty < 0 || tx >= this.S || ty >= this.S || this.blocked[ty * this.S + tx] === 1;
  }

  /** Case libre la plus proche (recherche en anneaux), ou null. */
  nearestFree(tx, ty, maxR = 14) {
    if (!this.isBlocked(tx, ty)) return [tx, ty];
    for (let r = 1; r <= maxR; r++) {
      let best = null;
      let bestD = 1e9;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          if (this.isBlocked(tx + dx, ty + dy)) continue;
          const d = dx * dx + dy * dy;
          if (d < bestD) { bestD = d; best = [tx + dx, ty + dy]; }
        }
      }
      if (best) return best;
    }
    return null;
  }

  /** Le segment est-il entièrement libre (parcours exact des cases traversées) ? */
  lineClear(x0, y0, x1, y1) {
    let tx = Math.floor(x0);
    let ty = Math.floor(y0);
    const ex = Math.floor(x1);
    const ey = Math.floor(y1);
    const dx = x1 - x0;
    const dy = y1 - y0;
    const stepX = dx > 0 ? 1 : -1;
    const stepY = dy > 0 ? 1 : -1;
    const tDeltaX = dx !== 0 ? Math.abs(1 / dx) : Infinity;
    const tDeltaY = dy !== 0 ? Math.abs(1 / dy) : Infinity;
    let tMaxX = dx !== 0 ? (stepX > 0 ? tx + 1 - x0 : x0 - tx) * tDeltaX : Infinity;
    let tMaxY = dy !== 0 ? (stepY > 0 ? ty + 1 - y0 : y0 - ty) * tDeltaY : Infinity;
    for (let guard = 0; guard < 400; guard++) {
      if (this.isBlocked(tx, ty)) return false;
      if (tx === ex && ty === ey) return true;
      if (tMaxX < tMaxY) { tx += stepX; tMaxX += tDeltaX; } else { ty += stepY; tMaxY += tDeltaY; }
    }
    return false;
  }

  /** Segment libre avec une marge latérale r (l'unité a une épaisseur). */
  wideLineClear(x0, y0, x1, y1, r) {
    if (!this.lineClear(x0, y0, x1, y1)) return false;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy);
    if (len < 1e-6) return true;
    const px = (-dy / len) * r;
    const py = (dx / len) * r;
    return this.lineClear(x0 + px, y0 + py, x1 + px, y1 + py) && this.lineClear(x0 - px, y0 - py, x1 - px, y1 - py);
  }

  /**
   * Cherche un chemin. Renvoie { path: [x0, y0, x1, y1, ...], partial } ou null si rien de mieux que sur place.
   * `path` est vide si le point de départ satisfait déjà le but.
   */
  find(sx, sy, goal, radius = 0.3, maxExpand = 12000) {
    const S = this.S;
    const blocked = this.blocked;
    let stx = Math.floor(sx);
    let sty = Math.floor(sy);
    if (stx < 0) stx = 0; else if (stx >= S) stx = S - 1;
    if (sty < 0) sty = 0; else if (sty >= S) sty = S - 1;
    const stamp = ++this.stamp;
    const goalMark = this.goal;

    let hx;
    let hy;
    let reach = 0;
    let rx0 = 0;
    let ry0 = 0;
    let rx1 = 0;
    let ry1 = 0;
    let isRect = false;
    let goalCount = 0;
    let exact = null;

    if (goal.kind === 'point') {
      let gtx = Math.floor(goal.x);
      let gty = Math.floor(goal.y);
      if (this.isBlocked(gtx, gty)) {
        const n = this.nearestFree(gtx, gty);
        if (!n) return null;
        gtx = n[0];
        gty = n[1];
      } else {
        exact = [goal.x, goal.y];
      }
      goalMark[gty * S + gtx] = stamp;
      goalCount = 1;
      hx = gtx + 0.5;
      hy = gty + 0.5;
    } else {
      isRect = true;
      rx0 = goal.x0;
      ry0 = goal.y0;
      rx1 = goal.x1;
      ry1 = goal.y1;
      reach = goal.reach;
      hx = (rx0 + rx1) / 2;
      hy = (ry0 + ry1) / 2;
      const minX = Math.max(0, Math.floor(rx0 - reach));
      const maxX = Math.min(S - 1, Math.floor(rx1 + reach));
      const minY = Math.max(0, Math.floor(ry0 - reach));
      const maxY = Math.min(S - 1, Math.floor(ry1 + reach));
      for (let ty = minY; ty <= maxY; ty++) {
        for (let tx = minX; tx <= maxX; tx++) {
          if (blocked[ty * S + tx] === 1) continue;
          if (distToRect(tx + 0.5, ty + 0.5, rx0, ry0, rx1, ry1) <= reach + 1e-6) {
            goalMark[ty * S + tx] = stamp;
            goalCount++;
          }
        }
      }
    }

    const startId = sty * S + stx;
    if (goalMark[startId] === stamp) return { path: [], partial: false };

    const heur = (tx, ty) => {
      if (isRect) return Math.max(0, distToRect(tx + 0.5, ty + 0.5, rx0, ry0, rx1, ry1) - reach);
      const dx = Math.abs(tx + 0.5 - hx);
      const dy = Math.abs(ty + 0.5 - hy);
      return dx + dy + (SQRT2 - 2) * Math.min(dx, dy);
    };

    const g = this.g;
    const parent = this.parent;
    const seen = this.seen;
    const done = this.done;
    const heap = this.heap;
    heap.clear();
    g[startId] = 0;
    parent[startId] = -1;
    seen[startId] = stamp;
    heap.push(heur(stx, sty), startId);
    let bestId = startId;
    let bestH = heur(stx, sty);
    let foundId = -1;
    let expanded = 0;

    while (heap.size) {
      const cur = heap.pop();
      if (done[cur] === stamp) continue;
      done[cur] = stamp;
      if (goalMark[cur] === stamp) { foundId = cur; break; }
      if (++expanded > maxExpand) break;
      const cx = cur % S;
      const cy = (cur / S) | 0;
      const gc = g[cur];
      for (let k = 0; k < 8; k++) {
        const nx = cx + DX[k];
        const ny = cy + DY[k];
        if (nx < 0 || ny < 0 || nx >= S || ny >= S) continue;
        const nid = ny * S + nx;
        if (blocked[nid] === 1 || done[nid] === stamp) continue;
        if (k >= 4 && (blocked[cy * S + nx] === 1 || blocked[ny * S + cx] === 1)) continue; // pas de coupe d'angle
        const ng = gc + COST[k];
        if (seen[nid] === stamp && ng >= g[nid]) continue;
        seen[nid] = stamp;
        g[nid] = ng;
        parent[nid] = cur;
        const h = heur(nx, ny);
        if (h < bestH - 1e-9 || (Math.abs(h - bestH) < 1e-9 && ng < g[bestId])) { bestH = h; bestId = nid; }
        heap.push(ng + h, nid);
      }
    }

    let partial = false;
    let endId = foundId;
    if (endId < 0) {
      partial = true;
      endId = bestId;
      if (endId === startId) return null;
    }
    // reconstruction (de l'arrivée vers le départ)
    const pts = [];
    for (let id = endId; id !== startId && id !== -1; id = parent[id]) pts.push(id);
    pts.reverse();
    const raw = [];
    for (const id of pts) raw.push((id % S) + 0.5, ((id / S) | 0) + 0.5);
    if (!partial && exact && raw.length >= 2) {
      const lastTx = Math.floor(raw[raw.length - 2]);
      const lastTy = Math.floor(raw[raw.length - 1]);
      if (Math.floor(exact[0]) === lastTx && Math.floor(exact[1]) === lastTy) {
        raw[raw.length - 2] = exact[0];
        raw[raw.length - 1] = exact[1];
      }
    }
    return { path: this.smooth(sx, sy, raw, radius), partial };
  }

  /** Lissage par « tirage de fil » : on saute les points intermédiaires quand la ligne droite est libre. */
  smooth(sx, sy, pts, r) {
    const n = pts.length / 2;
    if (n <= 1) return pts;
    const out = [];
    let ax = sx;
    let ay = sy;
    let i = 0;
    while (i < n) {
      let j = i;
      // on avance tant que la ligne droite reste libre
      while (j + 1 < n && this.wideLineClear(ax, ay, pts[(j + 1) * 2], pts[(j + 1) * 2 + 1], r)) j++;
      out.push(pts[j * 2], pts[j * 2 + 1]);
      ax = pts[j * 2];
      ay = pts[j * 2 + 1];
      i = j + 1;
    }
    return out;
  }
}
