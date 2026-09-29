// Académie. Francs : Scriptorium, petite abbaye (salle de pierre à clocheton, aile des copistes, jardin de
// simples, pupitres, enseigne au grand rouleau et à la plume). Gaulois : Cercle des druides (trilithes
// de menhirs autour d'un grand chêne, hutte du druide, autel à la faucille d'or, chaudron, rubans).

import { MAT, tone } from './building-gfx.js';
import {
  WOOD, WOOD_DARK, INTERIOR, longHouse, pyramidRoof, roundHut, scaffold, scaffoldRound, postsAlong,
  doorLocal, windowLocal, stick, linePts, railFence,
} from './building-parts.js';
import { wallBannerLocal, banner, pennant, menhir, oak, barrel, sack, well, GOLD, BRONZE } from './building-props.js';
import { lectern, scrollSign, cauldron, crossTop, amphora, brazier } from './building-civic.js';

const PI = Math.PI;
const SLATE_EDGE = '#3e4652';

/** Plate-bande de simples : caisson de terre, rangs de plantes. */
function bed(g, x0, y0, x1, y1, seed) {
  if (g.mode === 'shadow') {
    g.shadowBox(x0, y0, x1, y1, 0, 4);
    return;
  }
  if (!g.drawing) return;
  g.box(x0, y0, x1, y1, 0, 4, MAT.planks, { top: false, ao: false });
  g.faceTop(x0 + 0.02, y0 + 0.02, x1 - 0.02, y1 - 0.02, 3.6, { col: '#6a4a2c' }, { line: false });
  const c = g.ctx;
  const rnd = g.rng(seed, 9);
  const cols = ['#5f9a3c', '#7fb04a', '#4a8a3a', '#c9d86a', '#8a5aa6', '#e8dcc0'];
  const items = [];
  for (let i = 0; i < 26; i++) items.push([x0 + 0.06 + rnd() * (x1 - x0 - 0.12), y0 + 0.06 + rnd() * (y1 - y0 - 0.12), rnd()]);
  items.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  for (const [x, y, k] of items) {
    const [px, py] = g.P(x, y, 3.6);
    c.fillStyle = cols[Math.floor(k * 4)];
    c.beginPath();
    c.ellipse(px, py - 2, 2.4, 2, 0, 0, 2 * PI);
    c.fill();
    if (k > 0.75) {
      c.fillStyle = cols[4 + (k > 0.9 ? 1 : 0)];
      c.fillRect(px - 0.8, py - 4.8, 1.6, 1.6);
    }
  }
}

// ---------------------------------------------------------------------------
// Francs : Scriptorium
// ---------------------------------------------------------------------------

function academyFranks(g) {
  const st = g.stage;
  const tc = g.tc;
  const H = { x0: -1.34, y0: -1.34, x1: 0.34, y1: -0.22 };
  const A = { x0: 0.5, y0: 0.5, x1: 1.4, y1: 1.24 };
  if (g.mode === 'plan') {
    g.planRect(H.x0, H.y0, H.x1, H.y1);
    g.planRect(A.x0, A.y0, A.x1, A.y1);
    
    return;
  }
  const items = [];
  const xc = (H.x0 + H.x1) / 2 - 0.2;
  const yc = (H.y0 + H.y1) / 2;
  items.push({
    d: -2,
    f: () => longHouse(g, {
      ...H, plinthH: 0, wallH: 27, ridgeH: 60, axis: 'x', frame: false, wallMat: MAT.stoneLight, gableMat: MAT.stoneLight,
      roofMat: MAT.slate, heads: false, ov: 0.12, ovg: 0.07, th: 2.5, edge: SLATE_EDGE, plan: false, scafSides2: 'L',
      decoL: (c, w, h) => {
        for (const f of [0.12, 0.62, 0.88]) windowLocal(c, w * f, h * 0.45, 4, 11, { arch: true, shutters: false, sill: '#8a8a84', glow: st === 3 && f > 0.5 });
        doorLocal(c, w * 0.37, h, 11, 17, { arch: true, open: 0.4, leafCol: '#6a4526' });
        if (st === 3) wallBannerLocal(c, tc, w * 0.22, h * 0.06, 8, 16, { emblem: 'cross' });
      },
      decoR: (c, w, h) => {
        c.fillStyle = INTERIOR;
        c.beginPath();
        c.arc(w / 2, h * 0.4, 5, 0, 2 * PI);
        c.fill();
        c.strokeStyle = '#8a8a84';
        c.lineWidth = 1.2;
        c.stroke();
        windowLocal(c, w * 0.22, h * 0.5, 3.5, 9, { arch: true, shutters: false, sill: '#8a8a84' });
        windowLocal(c, w * 0.78, h * 0.5, 3.5, 9, { arch: true, shutters: false, sill: '#8a8a84' });
      },
      gableDeco: (c, w, h) => {
        c.fillStyle = INTERIOR;
        c.beginPath();
        c.arc(w / 2, h * 0.62, 3, 0, 2 * PI);
        c.fill();
        c.strokeStyle = '#8a8a84';
        c.lineWidth = 0.8;
        c.stroke();
      },
    }),
  });
  // clocheton sur le faîtage
  if (st >= 2) {
    items.push({
      d: -1.6,
      f: () => {
        const s = 0.15;
        const zr = 60;
        const arch = (c, w, h) => {
          c.fillStyle = INTERIOR;
          c.beginPath();
          c.moveTo(w * 0.28, h);
          c.lineTo(w * 0.28, 7);
          c.arc(w * 0.5, 7, w * 0.22, PI, 0);
          c.lineTo(w * 0.72, h);
          c.closePath();
          c.fill();
          c.fillStyle = '#c9a23a';
          c.beginPath();
          c.arc(w * 0.5, 9, 2.6, PI, 0);
          c.lineTo(w * 0.5 + 3, 13);
          c.lineTo(w * 0.5 - 3, 13);
          c.closePath();
          c.fill();
        };
        g.box(xc - s, yc - s, xc + s, yc + s, zr - 10, zr + 16, MAT.stoneLight, { topMat: MAT.stone, decoL: arch, decoR: arch, ao: false });
        pyramidRoof(g, { x0: xc - s - 0.02, y0: yc - s - 0.02, x1: xc + s + 0.02, y1: yc + s + 0.02, zb: zr + 16, za: zr + 44, mat: MAT.slate, ov: 0.03, th: 2, edge: SLATE_EDGE, finial: false });
        if (st === 3) crossTop(g, xc, yc, zr + 44, 1);
      },
    });
  }
  // aile des copistes
  items.push({
    d: -0.4,
    f: () => longHouse(g, {
      ...A, plinthH: 3, plinthMat: MAT.stone, wallH: 16, ridgeH: 34, axis: 'x', wallMat: MAT.planks, gableMat: MAT.planks,
      roofMat: MAT.shingle, heads: false, ov: 0.12, ovg: 0.08, th: 2.5, plan: false, scafSides2: 'L',
      decoL: (c, w, h) => {
        doorLocal(c, w * 0.32, h, 8, 12, { open: 0.4 });
        windowLocal(c, w * 0.72, h * 0.42, 4, 6);
      },
      decoR: (c, w, h) => {
        windowLocal(c, w * 0.5, h * 0.42, 4, 6);
      },
      gableDeco: st === 3 ? (c, w, h) => wallBannerLocal(c, tc, w / 2, h * 0.3, 7, 11, { emblem: 'cross' }) : null,
    }),
  });
  if (st >= 2) {
    items.push({ d: 0.1, f: () => bed(g, -1.3, 0.45, -0.68, 0.85, 1) });
    items.push({ d: 0.6, f: () => bed(g, -1.3, 0.98, -0.68, 1.34, 2) });
    items.push({ d: 1.1, f: () => bed(g, -0.5, 1.0, 0.1, 1.34, 3) });
  }
  if (st === 3) {
    items.push({ d: 0.3, f: () => { lectern(g, -0.5, 0.02, 0, 1.0); lectern(g, -0.12, 0.14, 0, 0.95); } });
    items.push({ d: 1.3, f: () => { well(g, 0.55, 0.62 + 0.0); } });
    items.push({ d: -0.9, f: () => scrollSign(g, -0.62, -0.2, 21, 0.8) });
    items.push({ d: 2, f: () => banner(g, 1.36, 1.2, 0, 46, { w: 11, h: 16 }) });
    items.push({ d: 1.6, f: () => { barrel(g, 0.3, 1.25, 0, 0.85); sack(g, 0.5, 1.32, 0, { s: 0.8 }); } });
  }
  
  items.sort((a, b) => a.d - b.d);
  for (const it of items) it.f();
  void postsAlong;
}
academyFranks.found = { stone: true };

// ---------------------------------------------------------------------------
// Gaulois : Cercle des druides
// ---------------------------------------------------------------------------

const STONE = '#a4a197';

/** Faucille d'or plantée sur l'autel (à l'écran). */
function sickle(g, x, y, z) {
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, z);
  c.strokeStyle = '#3a2608';
  c.lineWidth = 3.4;
  c.beginPath();
  c.arc(px, py - 7, 5.4, PI * 0.15, PI * 1.2);
  c.stroke();
  c.strokeStyle = '#f2d060';
  c.lineWidth = 2;
  c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.6)';
  c.lineWidth = 0.7;
  c.beginPath();
  c.arc(px, py - 7, 5.4, PI * 0.5, PI * 1.05);
  c.stroke();
  stick(c, px + 4.5, py - 2.5, px + 7.5, py + 0.5, '#5a3d22', 2);
}

function academyGauls(g) {
  const st = g.stage;
  const tc = g.tc;
  if (g.mode === 'plan') {
    g.planCircle(0, 0, 1.42);
    return;
  }
  const items = [];
  const n = 9;
  const R = 1.16;
  const stones = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * PI + 0.5;
    stones.push({ i, x: R * Math.cos(a), y: R * Math.sin(a), h: 36 + ((i * 7) % 8) });
  }
  for (const s of stones) {
    items.push({
      d: s.x + s.y,
      f: () => {
        if (st === 1 && s.i % 2) {
          g.box(s.x - 0.26, s.y - 0.07, s.x + 0.26, s.y + 0.07, 3, 9, { col: STONE, tex: MAT.dryStone.tex }, { ao: false, topMat: { col: '#b3b0a6' } });
        } else menhir(g, s.x, s.y, st === 1 ? s.h * 0.8 : s.h, { carve: s.i % 3 === 1, w: 0.1 });
      },
    });
  }
  // linteaux entre les paires de menhirs (trilithes)
  if (st >= 2) {
    for (const i of [0, 2, 4, 6]) {
      const a = stones[i];
      const b = stones[(i + 1) % n];
      items.push({
        d: (a.x + a.y + b.x + b.y) / 2 + 0.3,
        f: () => {
          const za = Math.min(a.h, b.h) - 2;
          g.beam(a.x, a.y, za + 3, b.x, b.y, za + 3, tone(STONE, 0.75), 7);
          g.beam(a.x, a.y, za + 5.2, b.x, b.y, za + 5.2, tone(STONE, 1.08), 3);
        },
      });
    }
  }
  items.push({ d: -0.3, f: () => oak(g, 0, 0, st >= 2 ? 118 : 104, { R: 50, ribbons: st === 3 }) });
  if (st >= 1) {
    items.push({
      d: 0.0,
      f: () => roundHut(g, {
        x: 1.02, y: -1.0, r: 0.36, wallH: 13, R: 0.46, apex: 38, door: 1.9, doorW: 6, doorH: 9, posts: 4,
        roofBand: tc.main, th: 4, plan: false,
      }),
    });
  }
  if (st >= 2) {
    items.push({
      d: 1.0,
      f: () => {
        g.box(0.28, 0.4, 0.4, 0.5, 0, 5, MAT.stoneDark, { ao: false });
        g.box(0.62, 0.4, 0.74, 0.5, 0, 5, MAT.stoneDark, { ao: false });
        g.box(0.22, 0.34, 0.8, 0.56, 5, 8, MAT.stone, { ao: false });
        if (st === 3) sickle(g, 0.5, 0.45, 8);
      },
    });
  }
  if (st === 3) {
    items.push({ d: 0.6, f: () => cauldron(g, -0.42, 0.5, 0, 1.2) });
    items.push({ d: 1.4, f: () => { barrel(g, -0.85, 0.72, 0, 0.85); sack(g, -0.65, 0.85, 0, { s: 0.8 }); amphora(g, -0.98, 0.45, 0, 0.85, '#b9723e'); } });
    items.push({ d: 2.5, f: () => pennant(g, 1.2, 1.15, 0, 46, { len: 19, h: 9 }) });
    items.push({ d: -1.2, f: () => pennant(g, 0.95, -0.85, 0, 42, { len: 18, h: 8 }) });
    items.push({ d: 1.6, f: () => brazier(g, 1.0, 0.7, 0, 16) });
    items.push({ d: 1.5, f: () => brazier(g, -0.1, 1.15, 0, 16) });
  }
  if (st === 1) items.push({ d: 1.4, f: () => scaffoldRound(g, 0, 0, 0.3, 30, { n: 3 }) });
  items.sort((a, b) => a.d - b.d);
  for (const it of items) it.f();
  void WOOD;
  void WOOD_DARK;
  void GOLD;
  void BRONZE;
}
academyGauls.ground = (g) => {
  if (!g.drawing) return;
  const c = g.ctx;
  const [X, Y] = g.P(0, 0, 0);
  const RX = 32 * Math.SQRT2;
  const RY = 16 * Math.SQRT2;
  c.save();
  c.filter = 'blur(1.6px)';
  c.fillStyle = 'rgba(125,98,68,0.5)';
  c.beginPath();
  c.ellipse(X, Y, 1.44 * RX, 1.44 * RY, 0, 0, 2 * PI);
  c.fill();
  c.fillStyle = 'rgba(70,120,45,0.35)';
  c.beginPath();
  c.ellipse(X, Y, 0.95 * RX, 0.95 * RY, 0, 0, 2 * PI);
  c.fill();
  c.strokeStyle = 'rgba(90,65,40,0.35)';
  c.lineWidth = 1.5;
  for (const r of [1.1, 1.3]) {
    c.beginPath();
    c.ellipse(X, Y, r * RX, r * RY, 0, 0, 2 * PI);
    c.stroke();
  }
  c.restore();
};
academyGauls.found = {};

export const ACADEMY = { gauls: academyGauls, franks: academyFranks };
