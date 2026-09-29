// Marché. Francs : étals de bois sous auvents rayés aux couleurs d'équipe autour d'un puits, charrette,
// tonneaux et sacs. Gaulois : tentes de perches et de peaux autour d'une balance géante, chaudrons, cordes
// et guirlandes de fanions.

import { MAT, tone } from './building-gfx.js';
import { WOOD, WOOD_DARK, INTERIOR, stick } from './building-parts.js';
import { pennant, banner, barrel, sack, crate, well, cart, hayBale } from './building-props.js';
import { awning, stripeMat, amphora, cauldron, bigScale, bunting, rope, coinsAt } from './building-civic.js';

const PI = Math.PI;
const CLOTH = ['#b0432f', '#3f6fae', '#d8b04a', '#5d8a4c', '#7b4a86', '#e6dcc4'];

/** Petit groupe de marchandises posé sur un comptoir en (x, y, z). */
function goodsAt(g, kind, x, y, z) {
  if (g.mode === 'shadow') return;
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, z);
  const rnd = g.rng(x * 13, y * 7, kind.length);
  if (kind === 'cloth') {
    for (let i = 0; i < 3; i++) {
      const col = CLOTH[(Math.floor(rnd() * 97) + i) % CLOTH.length];
      const y0 = py - i * 3.4;
      c.fillStyle = tone(col, 0.9);
      c.fillRect(px - 8 + i * 1.2, y0 - 3.4, 15, 3.4);
      c.fillStyle = col;
      c.fillRect(px - 8 + i * 1.2, y0 - 3.4, 15, 1.7);
      c.fillStyle = 'rgba(0,0,0,0.25)';
      c.fillRect(px - 8 + i * 1.2, y0 - 0.4, 15, 0.6);
      c.fillStyle = tone(col, 1.25);
      c.beginPath();
      c.ellipse(px - 8 + i * 1.2, y0 - 1.7, 1.2, 1.7, 0, 0, 2 * PI);
      c.fill();
    }
  } else if (kind === 'fruit') {
    c.fillStyle = '#8a6440';
    c.beginPath();
    c.ellipse(px, py - 2, 8, 3.4, 0, 0, PI);
    c.lineTo(px - 8, py - 3);
    c.fill();
    c.strokeStyle = 'rgba(40,20,5,0.7)';
    c.lineWidth = 0.7;
    c.stroke();
    const cols = ['#c8402e', '#e08a2a', '#8fb04a', '#c8402e', '#e6c040'];
    for (let i = 0; i < 9; i++) {
      c.fillStyle = cols[i % cols.length];
      c.beginPath();
      c.arc(px - 6 + i * 1.5, py - 4.4 - (i % 3) * 1.1, 1.9, 0, 2 * PI);
      c.fill();
    }
  } else if (kind === 'pots') {
    amphora(g, x - 0.1, y, z, 0.62, '#b9723e');
    amphora(g, x + 0.08, y - 0.02, z, 0.55, '#8a5a3a');
    amphora(g, x + 0.02, y + 0.09, z, 0.5, '#c98a4c');
  } else if (kind === 'coins') {
    c.fillStyle = '#6a4a2c';
    c.fillRect(px - 7, py - 3, 14, 3);
    c.fillStyle = '#7a1f1f';
    c.fillRect(px - 7, py - 3.6, 14, 1);
    coinsAt(c, px - 3, py - 4, 6);
    coinsAt(c, px + 3, py - 4, 4);
  } else if (kind === 'sacks') {
    for (const [dx, col] of [[-5, '#d8c49a'], [1, '#c9b280'], [6, '#d8c49a']]) {
      c.fillStyle = col;
      c.strokeStyle = 'rgba(80,55,25,0.7)';
      c.lineWidth = 0.7;
      c.beginPath();
      c.ellipse(px + dx, py - 3.4, 3.6, 3.8, 0, 0, 2 * PI);
      c.fill();
      c.stroke();
      c.fillStyle = tone(col, 0.6);
      c.fillRect(px + dx - 1.6, py - 7.6, 3.2, 1);
    }
  } else if (kind === 'hides') {
    c.fillStyle = '#a5794a';
    c.beginPath();
    c.ellipse(px, py - 3, 8, 3, -0.1, 0, 2 * PI);
    c.fill();
    c.strokeStyle = 'rgba(50,25,10,0.6)';
    c.lineWidth = 0.7;
    c.stroke();
    c.fillStyle = '#d9c9a8';
    c.beginPath();
    c.ellipse(px + 1, py - 5, 6.5, 2.5, 0.1, 0, 2 * PI);
    c.fill();
    c.stroke();
  }
}

/** Étal de bois : fond, comptoir, poteaux, marchandises, auvent rayé. */
function stall(g, o) {
  const { x0, y0, x1, y1, zHigh, zLow, dir } = o;
  const st = g.stage;
  const zb = zHigh - 3;
  const y = dir === 'y';
  const cnt = y ? [x0 + 0.08, y1 - 0.34, x1 - 0.08, y1 - 0.08] : [x1 - 0.34, y0 + 0.08, x1 - 0.08, y1 - 0.08];
  const posts = y
    ? [[x0 + 0.06, y0 + 0.06, zb], [x1 - 0.06, y0 + 0.06, zb], [x0 + 0.06, y1 - 0.06, zLow - 3], [x1 - 0.06, y1 - 0.06, zLow - 3]]
    : [[x0 + 0.06, y0 + 0.06, zb], [x0 + 0.06, y1 - 0.06, zb], [x1 - 0.06, y0 + 0.06, zLow - 3], [x1 - 0.06, y1 - 0.06, zLow - 3]];
  if (g.mode === 'shadow') {
    g.shadowBox(cnt[0], cnt[1], cnt[2], cnt[3], 0, 10);
    if (st >= 2) awning(g, o);
    for (const [px, py, pz] of posts) g.shadowPole(px, py, 0, pz, 0.03);
    return;
  }
  const h = st === 1 ? 6 : 10;
  if (st >= 2) {
    if (y) g.faceL(x0 + 0.05, x1 - 0.05, y0 + 0.07, 0, zb - 1, MAT.planksDark, { k: 0.72 });
    else g.faceR(x0 + 0.07, y0 + 0.05, y1 - 0.05, 0, zb - 1, MAT.planksDark, { k: 0.54 });
  }
  // poteaux arrière
  for (const [px, py, pz] of posts.slice(0, 2)) g.post(px, py, 0, pz, WOOD, 3);
  g.box(cnt[0], cnt[1], cnt[2], cnt[3], 0, h, MAT.planks, { topMat: { col: '#b08a5c' }, ao: true });
  if (st === 3) {
    const kinds = o.goods || [];
    const n = kinds.length;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const gx = y ? cnt[0] + (cnt[2] - cnt[0]) * t : (cnt[0] + cnt[2]) / 2;
      const gy = y ? (cnt[1] + cnt[3]) / 2 : cnt[1] + (cnt[3] - cnt[1]) * t;
      goodsAt(g, kinds[i], gx, gy, h);
    }
  }
  for (const [px, py, pz] of posts.slice(2)) g.post(px, py, 0, pz, WOOD, 3);
  if (st >= 2) awning(g, { ...o, partial: true });
  else {
    // chevrons de l'auvent (chantier)
    if (y) g.beam(x0 + 0.06, y0 + 0.06, zb, x0 + 0.06, y1 - 0.06, zLow - 3, WOOD, 1.8), g.beam(x1 - 0.06, y0 + 0.06, zb, x1 - 0.06, y1 - 0.06, zLow - 3, WOOD, 1.8);
    else g.beam(x0 + 0.06, y0 + 0.06, zb, x1 - 0.06, y0 + 0.06, zLow - 3, WOOD, 1.8), g.beam(x0 + 0.06, y1 - 0.06, zb, x1 - 0.06, y1 - 0.06, zLow - 3, WOOD, 1.8);
  }
}

function marketFranks(g) {
  const st = g.stage;
  const tc = g.tc;
  if (g.mode === 'plan') {
    g.planRect(-1.45, -1.45, 1.45, 1.45);
    return;
  }
  const items = [];
  items.push({
    d: -1.6,
    f: () => stall(g, { x0: -1.38, y0: -1.4, x1: 0.3, y1: -0.78, zHigh: 32, zLow: 23, dir: 'y', goods: ['cloth', 'fruit', 'cloth'], a: tc.main, b: '#efe5c8' }),
  });
  items.push({
    d: -0.8,
    f: () => stall(g, { x0: 0.55, y0: -1.4, x1: 1.4, y1: -0.78, zHigh: 32, zLow: 23, dir: 'y', goods: ['pots', 'coins'], a: tc.dark, b: tc.light }),
  });
  items.push({
    d: -1.2,
    f: () => stall(g, { x0: -1.4, y0: -0.68, x1: -0.8, y1: 0.7, zHigh: 32, zLow: 23, dir: 'x', goods: ['fruit', 'sacks', 'cloth'], a: '#efe5c8', b: tc.main }),
  });
  items.push({ d: 0.2, f: () => well(g, 0.1, 0.12) });
  if (st === 3) {
    items.push({ d: 1.2, f: () => cart(g, 1.0, 0.72, 'y', 'stone') });
    items.push({ d: 0.9, f: () => { barrel(g, -0.3, 1.0, 0, 0.95); barrel(g, -0.08, 1.12, 0, 0.9); sack(g, -0.5, 1.15, 0, { s: 0.9 }); } });
    items.push({ d: 0.5, f: () => { crate(g, 0.55, -0.4, 0); sack(g, 0.78, -0.3, 0, { s: 0.85 }); hayBale(g, 1.1, -0.3, 0, 'y'); } });
    items.push({ d: 2.4, f: () => banner(g, 1.4, 0.0, 0, 46, { w: 11, h: 16 }) });
    items.push({ d: -1.0, f: () => banner(g, -1.3, 1.25, 0, 40, { w: 9, h: 13 }) });
    items.push({ d: 0.2, f: () => { bunting(g, [-1.32, -0.8, 30], [0.1, 0.12, 40], 6, 6); bunting(g, [1.34, -0.8, 30], [0.1, 0.12, 40], 6, 6); } });
  }
  items.sort((a, b) => a.d - b.d);
  for (const it of items) it.f();
}
marketFranks.found = {};

// ---------------------------------------------------------------------------
// Gaulois : tentes de peaux et balance géante
// ---------------------------------------------------------------------------

const HIDE = {
  col: '#a8875a',
  cone(c, G, rnd, col) {
    const { X, Ya, Yb, rx, ry } = G;
    // pièces de peaux : bandes claires et sombres, coutures
    const cols = ['#b89468', '#9a774c', '#c9a878', '#8c6a42', '#d2b98e'];
    for (let i = 0; i < 40; i++) {
      const t = rnd() * PI;
      const f = 0.15 + rnd() * 0.85;
      c.fillStyle = cols[i % cols.length];
      c.globalAlpha = 0.6;
      c.beginPath();
      c.ellipse(X + f * rx * Math.cos(t), Ya + f * (Yb - Ya) + f * ry * Math.sin(t), 4 + rnd() * 9 * f, 2 + rnd() * 4, (rnd() - 0.5) * 0.7, 0, 2 * PI);
      c.fill();
    }
    c.globalAlpha = 1;
    c.strokeStyle = 'rgba(60,35,15,0.5)';
    c.lineWidth = 0.9;
    c.beginPath();
    for (let i = 0; i < 9; i++) {
      const t = (i / 8) * PI;
      c.moveTo(X, Ya);
      c.lineTo(X + rx * Math.cos(t), Yb + ry * Math.sin(t));
    }
    c.stroke();
    // laçage aux coutures
    c.strokeStyle = 'rgba(235,220,180,0.55)';
    c.lineWidth = 0.6;
    c.setLineDash([1.2, 1.6]);
    c.beginPath();
    for (let i = 1; i < 8; i += 2) {
      const t = (i / 8) * PI;
      c.moveTo(X, Ya + 2);
      c.lineTo(X + rx * Math.cos(t) * 0.97, Yb + ry * Math.sin(t) * 0.97);
    }
    c.stroke();
    c.setLineDash([]);
    void col;
  },
};

/** Tente conique de peaux : perches dépassant, ouverture, bande d'équipe, table de vente devant. */
function hideTent(g, x, y, R, h, o = {}) {
  if (g.mode === 'shadow') {
    g.shadowCone(x, y, R, 0, h);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const G = g.cone(x, y, 0, R, h, HIDE, {});
  // bande d'équipe autour du bas
  const f1 = 0.72;
  const f2 = 0.83;
  c.save();
  g.coneBandPath(G, f1, f2);
  c.fillStyle = g.tc.main;
  c.fill();
  c.strokeStyle = 'rgba(255,245,220,0.8)';
  c.lineWidth = 0.7;
  c.stroke();
  c.globalCompositeOperation = 'multiply';
  c.fillStyle = g.roundShade(G.X, G.rx * f2, 0.62);
  c.fill();
  c.restore();
  // ouverture
  const dw = G.rx * 0.2;
  const yb = G.Yb + G.ry * 0.97;
  c.fillStyle = INTERIOR;
  c.beginPath();
  c.moveTo(G.X - dw, yb);
  c.lineTo(G.X, G.Ya + (yb - G.Ya) * 0.46);
  c.lineTo(G.X + dw, yb);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(40,20,5,0.85)';
  c.lineWidth = 1;
  c.stroke();
  c.fillStyle = '#c4a072';
  c.beginPath();
  c.moveTo(G.X - dw, yb);
  c.lineTo(G.X - dw * 0.1, G.Ya + (yb - G.Ya) * 0.5);
  c.lineTo(G.X - dw * 1.7, yb + 0.5);
  c.closePath();
  c.fill();
  c.stroke();
  // perches croisées au sommet
  stick(c, G.X - 4, G.Ya - 8, G.X + 3, G.Ya + 3, '#5a3d22', 1.5);
  stick(c, G.X + 4, G.Ya - 8, G.X - 3, G.Ya + 3, '#5a3d22', 1.5);
  if (o.pennant) pennant(g, x, y, h - 1, 14, { len: 15, h: 7, symbol: false, pole: false });
}

function table(g, x, y, kind, axis = 'x') {
  const w = axis === 'x' ? [0.32, 0.14] : [0.14, 0.32];
  if (g.mode === 'shadow') {
    g.shadowBox(x - w[0], y - w[1], x + w[0], y + w[1], 0, 10);
    return;
  }
  for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.post(x + dx * (w[0] - 0.03), y + dy * (w[1] - 0.03), 0, 8, WOOD_DARK, 2.2);
  g.box(x - w[0], y - w[1], x + w[0], y + w[1], 8, 10, MAT.planks, { ao: false, topMat: { col: '#b08a5c' } });
  if (g.stage === 3) goodsAt(g, kind, x, y, 10);
}

function marketGauls(g) {
  const st = g.stage;
  if (g.mode === 'plan') {
    g.planRect(-1.45, -1.45, 1.45, 1.45);
    return;
  }
  const items = [];
  const tents = [[-0.78, -0.78, 0.58, 44], [0.72, -0.9, 0.5, 36], [-1.0, 0.6, 0.5, 34]];
  for (const [x, y, R, h] of tents) {
    items.push({
      d: x + y - 0.3,
      f: () => {
        if (st === 1) {
          // perches dressées : le cône n'est pas encore couvert
          for (let i = 0; i < 7; i++) {
            const a = (i / 7) * 2 * PI;
            g.beam(x + Math.cos(a) * R * 0.95, y + Math.sin(a) * R * 0.95, 0, x, y, h, '#8a6440', 1.7);
          }
        } else hideTent(g, x, y, R, h, { pennant: st === 3 });
      },
    });
  }
  items.push({ d: 0.15, f: () => bigScale(g, 0.15, 0.15, { h: st >= 2 ? 56 : 30 }) });
  if (st === 3) {
    items.push({ d: -1.0, f: () => table(g, 0.05, -1.05, 'pots') });
    items.push({ d: -0.6, f: () => table(g, 1.15, -0.05, 'hides', 'y') });
    items.push({ d: 0.3, f: () => table(g, -0.15, 0.95, 'coins') });
    items.push({ d: 0.8, f: () => { cauldron(g, 0.85, 0.6, 0, 1.15); } });
    items.push({ d: 1.6, f: () => { cauldron(g, 0.35, 1.1, 0, 0.9); barrel(g, 0.75, 1.05, 0, 0.9); } });
    items.push({ d: 0.2, f: () => { sack(g, -0.4, -0.05, 0, { s: 0.9 }); sack(g, -0.22, 0.12, 0, { s: 0.8 }); amphora(g, -0.5, 0.25, 0, 0.9); crate(g, 0.65, -0.3, 0); } });
    items.push({ d: 2.5, f: () => pennant(g, 1.4, 0.1, 0, 46, { len: 19, h: 9 }) });
    items.push({ d: 0.0, f: () => pennant(g, -1.3, 1.3, 0, 40, { len: 17, h: 8 }) });
    items.push({
      d: 0.4,
      f: () => {
        bunting(g, [-0.78, -0.78, 44], [0.15, 0.15, 56], 6, 5);
        bunting(g, [0.72, -0.9, 36], [0.15, 0.15, 56], 6, 5);
        bunting(g, [-1.0, 0.6, 34], [0.15, 0.15, 56], 6, 5);
        rope(g, [-0.78, -0.78, 4], [-0.45, -0.5, 1], 2);
      },
    });
  }
  items.sort((a, b) => a.d - b.d);
  for (const it of items) it.f();
}
marketGauls.found = {};

void stripeMat;

export const MARKET = { gauls: marketGauls, franks: marketFranks };
