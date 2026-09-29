// Éléments communs aux deux civilisations : champ cultivé (ferme), décombres, fanion de chantier.

import { MAT, RX, RY, tone, rgba } from './building-gfx.js';
import { WOOD, stick, wickerFence, railFence, groundPatch, linePts } from './building-parts.js';
import { scarecrow, sack, pennant, banner, STRAW } from './building-props.js';

const PI = Math.PI;

/** Fanion d'équipe planté au bord d'un chantier (stades 0 à 2). */
export function siteFlag(g) {
  const s = g.size / 2;
  const x = s * 0.9 - 0.1;
  const y = s * 0.55;
  if (g.civ === 'franks') banner(g, x, y, 0, 26, { w: 8, h: 11 });
  else pennant(g, x, y, 0, 26, { len: 14, h: 7, symbol: false });
}

/** Terre labourée : sillons parallèles à x (texture « à plat » dans le repère du sol). */
function soilTex(stage) {
  return (c, w, h, rnd) => {
    const fresh = stage === 0;
    const rows = 7.2;
    for (let v = 0; v < h + rows; v += rows) {
      const g = c.createLinearGradient(0, v, 0, v + rows);
      g.addColorStop(0, fresh ? '#6a4a2c' : '#6e5134');
      g.addColorStop(0.45, fresh ? '#8d6a45' : '#8a6a48');
      g.addColorStop(0.55, fresh ? '#9a7650' : '#977553');
      g.addColorStop(1, fresh ? '#5a3d24' : '#634730');
      c.fillStyle = g;
      c.fillRect(-2, v, w + 4, rows);
    }
    for (let i = 0; i < (w * h) / 22; i++) {
      c.fillStyle = rnd() < 0.5 ? 'rgba(255,230,190,0.18)' : 'rgba(40,20,5,0.2)';
      c.fillRect(rnd() * w, rnd() * h, 1 + rnd(), 1);
    }
  };
}

/** Ferme : champ plat, semis (stades 0-2) ou blé mûr (3), clôture basse et épouvantail. */
export function farm(g) {
  const st = g.stage;
  const s = 1.4;
  if (g.mode === 'plan') {
    g.planRect(-s, -s, s, s);
    return;
  }
  const gaul = g.civ !== 'franks';
  if (g.mode === 'shadow') {
    if (st === 3) scarecrow(g, -0.45, -0.55, g.civ);
    return;
  }
  const c = g.ctx;
  // bordure de terre tassée, puis le champ
  groundPatch(g, [{ k: 'rect', x0: -s, y0: -s, x1: s, y1: s }], { grow: 0.08, alpha: 0.5, blur: 2, speckle: false });
  g.faceTop(-s, -s, s, s, 0, { col: '#7a5a3a', tex: soilTex(st) }, { line: false });
  const [tx, ty] = g.P(0, -s, 0);
  void tx;
  void ty;
  // bord du champ
  g.path([g.P(-s, -s, 0), g.P(s, -s, 0), g.P(s, s, 0), g.P(-s, s, 0)]);
  c.strokeStyle = 'rgba(60,40,20,0.45)';
  c.lineWidth = 1.2;
  c.stroke();
  // clôture basse sur les bords arrière
  if (st >= 1) {
    if (gaul) {
      wickerFence(g, linePts(-s, -s - 0.02, s * 0.3, -s - 0.02, 0.4), 5);
      wickerFence(g, linePts(-s - 0.02, -s * 0.2, -s - 0.02, s * 0.45, 0.4), 5);
    } else {
      railFence(g, linePts(-s * 0.2, -s - 0.02, s, -s - 0.02, 0.45), 7);
      railFence(g, linePts(-s - 0.02, -s, -s - 0.02, s * 0.3, 0.45), 7);
    }
  }
  // cultures, rang par rang (de l'arrière vers l'avant)
  const rnd = g.rng(5, st);
  const rowStep = 7.2 / 32;
  const rows = [];
  for (let y = -s + rowStep * 0.5; y < s; y += rowStep) rows.push(y);
  if (st === 1) {
    c.fillStyle = '#7fae4a';
    for (const y of rows) {
      for (let x = -s + 0.05; x < s; x += 0.09 + rnd() * 0.05) {
        if (rnd() < 0.35) continue;
        const [px, py] = g.P(x, y, 0);
        c.fillRect(px - 0.6, py - 1.6, 1.2, 1.6);
      }
    }
  } else if (st === 2) {
    for (const y of rows) {
      c.strokeStyle = '#6f9e3c';
      c.lineWidth = 1;
      c.beginPath();
      for (let x = -s + 0.04; x < s; x += 0.045 + rnd() * 0.02) {
        const [px, py] = g.P(x, y, 0);
        const hh = 3 + rnd() * 2;
        c.moveTo(px, py);
        c.lineTo(px + (rnd() - 0.4) * 1.5, py - hh);
      }
      c.stroke();
      c.strokeStyle = 'rgba(170,215,110,0.7)';
      c.lineWidth = 0.6;
      c.beginPath();
      for (let x = -s + 0.06; x < s; x += 0.09 + rnd() * 0.03) {
        const [px, py] = g.P(x, y, 0);
        c.moveTo(px + 0.5, py - 1);
        c.lineTo(px + 1.2, py - 4);
      }
      c.stroke();
    }
  } else if (st === 3) {
    // blé mûr : tiges dorées serrées, épis plus clairs, légère ondulation
    for (const y of rows) {
      const base = [];
      for (let x = -s + 0.03; x < s - 0.01; x += 0.032 + rnd() * 0.016) base.push(x);
      c.lineWidth = 1;
      c.strokeStyle = '#b8902e';
      c.beginPath();
      const tops = [];
      for (const x of base) {
        const [px, py] = g.P(x, y, 0);
        const hh = 6 + rnd() * 2.5;
        const lean = 1.2 + Math.sin(x * 5 + y * 3) * 0.8 + (rnd() - 0.5) * 0.8;
        c.moveTo(px, py);
        c.lineTo(px + lean, py - hh);
        tops.push([px + lean, py - hh]);
      }
      c.stroke();
      c.fillStyle = '#e8c257';
      for (const [px, py] of tops) {
        c.beginPath();
        c.ellipse(px + 0.3, py - 0.6, 0.9, 1.9, 0.35, 0, 2 * PI);
        c.fill();
      }
      c.fillStyle = 'rgba(255,245,190,0.7)';
      for (let i = 0; i < tops.length; i += 3) c.fillRect(tops[i][0] - 0.2, tops[i][1] - 1.8, 0.8, 0.8);
    }
  }
  if (st === 0) {
    // piquets et cordeau aux coins, charrue abandonnée au bord
    const pts = [[-s, -s], [s, -s], [s, s], [-s, s]];
    c.strokeStyle = rgba('#efe6cc', 0.85);
    c.lineWidth = 0.8;
    c.beginPath();
    pts.forEach(([x, y], i) => {
      const [px, py] = g.P(x, y, 5);
      if (i) c.lineTo(px, py);
      else c.moveTo(px, py);
    });
    c.closePath();
    c.stroke();
    for (const [x, y] of pts.slice().sort((a, b) => a[0] + a[1] - (b[0] + b[1]))) {
      const [px, py] = g.P(x, y, 0);
      stick(c, px, py, px, py - 8, '#c9a676', 1.8);
    }
  }
  if (st === 3) {
    scarecrow(g, -0.45, -0.55, g.civ);
    sack(g, s - 0.15, s - 0.35, 0, { col: '#d8c49a', s: 0.85 });
    sack(g, s - 0.35, s - 0.12, 0, { col: '#cdb88c', s: 0.8 });
  }
}
farm.custom = true;

/** Décombres d'un bâtiment détruit : cendres, pierres éparses, poutres brisées et calcinées. */
export function rubble(g, size, variant) {
  const s = (size / 2) * 0.86;
  const rnd = g.rng(size, variant, 99);
  const c = g.ctx;
  const [X, Y] = g.P(0, 0, 0);
  // cendres et terre brûlée
  c.save();
  c.filter = 'blur(3px)';
  c.fillStyle = 'rgba(45,35,30,0.55)';
  c.beginPath();
  c.ellipse(X, Y, s * RX * 1.05, s * RY * 1.05, 0, 0, 2 * PI);
  c.fill();
  c.fillStyle = 'rgba(25,20,18,0.5)';
  for (let i = 0; i < 3 + size; i++) {
    const a = rnd() * 2 * PI;
    const d = rnd() * s * 0.6;
    c.beginPath();
    c.ellipse(X + Math.cos(a) * d * RX, Y + Math.sin(a) * d * RY, (0.3 + rnd() * 0.4) * RX, (0.3 + rnd() * 0.4) * RY, 0, 0, 2 * PI);
    c.fill();
  }
  c.restore();
  // braises éteintes / cendres grises
  for (let i = 0; i < size * size * 18; i++) {
    const x = (rnd() - 0.5) * 2 * s;
    const y = (rnd() - 0.5) * 2 * s;
    if (Math.hypot(x, y) > s) continue;
    const [px, py] = g.P(x, y, 0);
    c.fillStyle = rnd() < 0.6 ? 'rgba(160,150,140,0.55)' : 'rgba(20,15,12,0.6)';
    c.fillRect(px, py, 1.5, 1);
  }
  // éléments en relief triés par profondeur
  const items = [];
  const nStones = size * size * 3 + 4;
  for (let i = 0; i < nStones; i++) {
    const a = rnd() * 2 * PI;
    const d = Math.sqrt(rnd()) * s * 0.95;
    items.push({ k: 'stone', x: Math.cos(a) * d, y: Math.sin(a) * d, r: 0.05 + rnd() * 0.07, h: 2.5 + rnd() * 3 });
  }
  const nBeams = size * 2 + 1;
  for (let i = 0; i < nBeams; i++) {
    const a = rnd() * 2 * PI;
    const d = rnd() * s * 0.7;
    items.push({ k: 'beam', x: Math.cos(a) * d, y: Math.sin(a) * d, ang: rnd() * PI, L: 0.3 + rnd() * 0.25 * size, z: rnd() * 5, burnt: rnd() < 0.6 });
  }
  for (let i = 0; i < Math.max(1, size - 1); i++) {
    const a = rnd() * 2 * PI;
    const d = s * (0.5 + rnd() * 0.4);
    items.push({ k: 'post', x: Math.cos(a) * d, y: Math.sin(a) * d, h: 8 + rnd() * 10 });
  }
  items.sort((a, b) => a.x + a.y - (b.x + b.y));
  for (const it of items) {
    if (it.k === 'stone') {
      const col = tone('#a19c92', 0.8 + rnd() * 0.35);
      g.box(it.x - it.r, it.y - it.r * 0.8, it.x + it.r, it.y + it.r * 0.8, 0, it.h, { col }, { ao: false });
    } else if (it.k === 'beam') {
      const dx = Math.cos(it.ang) * it.L * 0.5;
      const dy = Math.sin(it.ang) * it.L * 0.5;
      g.beam(it.x - dx, it.y - dy, it.z, it.x + dx, it.y + dy, 1.5, it.burnt ? '#2f2520' : '#6a4a2c', 3);
    } else {
      const [px, py] = g.P(it.x, it.y, 0);
      const gr = c.createLinearGradient(px - 2, 0, px + 2, 0);
      gr.addColorStop(0, '#5a4636');
      gr.addColorStop(1, '#1e1814');
      c.fillStyle = gr;
      c.beginPath();
      c.moveTo(px - 2, py);
      c.lineTo(px - 2, py - it.h + 2);
      c.lineTo(px - 0.5, py - it.h);
      c.lineTo(px + 0.6, py - it.h + 3);
      c.lineTo(px + 2, py - it.h + 1);
      c.lineTo(px + 2, py);
      c.closePath();
      c.fill();
    }
  }
  void MAT;
  void STRAW;
  void WOOD;
}
