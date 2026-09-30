// Points stratégiques neutres (2×2), communs à tous les peuples : « Trésor des Anciens » (pt_treasure, ruines d'un
// trésor au milieu d'un gué) et « Colline sacrée » (pt_hill, tertre, menhir, mât-totem, feu de signal).
// La couleur du drapeau suit l'équipe : teamIdx 0 bleu, 1 rouge, 2 neutre (gris sable, point non capturé).
// Dessins « custom » : pas de fondations ni de chantier, tous les stades se dessinent comme le stade terminé.

import { MAT, tone, rgba, ink, RX, RY } from './building-gfx.js';
import { WOOD, WOOD_DARK, stick } from './building-parts.js';
import { pennant, glow, smoke, GOLD, barrel } from './building-props.js';
import { brazier, amphora } from './building-civic.js';

const PI = Math.PI;
const MOSS = '#6f8f3e';

// ---------------------------------------------------------------------------
// Petits éléments communs
// ---------------------------------------------------------------------------

/** Tache de mousse (ellipse à plat dans le plan du sol, hauteur z). */
function moss(g, x, y, z, r, a = 0.55) {
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, z);
  c.fillStyle = `rgba(104,140,58,${a})`;
  c.beginPath();
  c.ellipse(px, py, r * 32, r * 16, 0, 0, 2 * PI);
  c.fill();
  c.fillStyle = `rgba(150,176,80,${a * 0.6})`;
  c.beginPath();
  c.ellipse(px - r * 6, py - r * 2.5, r * 16, r * 7, 0, 0, 2 * PI);
  c.fill();
}

/** Étincelle d'or à quatre branches. */
function sparkle(g, x, y, z, s = 1) {
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, z);
  c.fillStyle = 'rgba(255,248,200,0.95)';
  c.beginPath();
  c.moveTo(px, py - 4.6 * s);
  c.lineTo(px + 1 * s, py - 1 * s);
  c.lineTo(px + 4.6 * s, py);
  c.lineTo(px + 1 * s, py + 1 * s);
  c.lineTo(px, py + 4.6 * s);
  c.lineTo(px - 1 * s, py + 1 * s);
  c.lineTo(px - 4.6 * s, py);
  c.lineTo(px - 1 * s, py - 1 * s);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(230,170,40,0.8)';
  c.lineWidth = 0.5;
  c.stroke();
}

/** Tas de pièces d'or (dôme doré aux pièces visibles). r en cases. */
function goldHeap(g, x, y, z, r = 0.16, h = 6) {
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, z);
  const rx = r * 44;
  const ry = r * 22;
  const gr = c.createRadialGradient(px - rx * 0.3, py - h * 0.9, 0.5, px, py - h * 0.4, rx * 1.1);
  gr.addColorStop(0, '#fff2a8');
  gr.addColorStop(0.45, GOLD);
  gr.addColorStop(1, '#8a5e12');
  c.fillStyle = gr;
  c.beginPath();
  c.moveTo(px - rx, py);
  c.bezierCurveTo(px - rx * 0.9, py - h * 1.5, px + rx * 0.9, py - h * 1.5, px + rx, py);
  c.ellipse(px, py, rx, ry * 0.45, 0, 0, PI);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(90,55,10,0.7)';
  c.lineWidth = 0.7;
  c.stroke();
  const rnd = g.rng(x, y, z, 5);
  for (let i = 0; i < 7; i++) {
    const a = rnd() * PI;
    const cx = px + Math.cos(a + PI) * rx * 0.75 * rnd();
    const cy = py - 1 - rnd() * h * 0.9;
    c.fillStyle = i % 2 ? '#ffe680' : '#d29a24';
    c.beginPath();
    c.ellipse(cx, cy, 1.9, 1.1, 0, 0, 2 * PI);
    c.fill();
    c.strokeStyle = 'rgba(100,60,8,0.6)';
    c.lineWidth = 0.4;
    c.stroke();
  }
}

/** Quelques pièces éparpillées au sol. */
function coins(g, x, y, z, n = 5, spread = 0.22) {
  if (!g.drawing) return;
  const c = g.ctx;
  const rnd = g.rng(x, y, z, 77);
  for (let i = 0; i < n; i++) {
    const [px, py] = g.P(x + (rnd() - 0.5) * spread * 2, y + (rnd() - 0.5) * spread * 2, z);
    c.fillStyle = i % 2 ? '#f4cf58' : '#c8921f';
    c.beginPath();
    c.ellipse(px, py, 1.9, 1.05, 0, 0, 2 * PI);
    c.fill();
    c.strokeStyle = 'rgba(90,55,10,0.65)';
    c.lineWidth = 0.4;
    c.stroke();
  }
}

/** Coffre ancien entrouvert rempli d'or. Axe 'x' : ouverture vers l'avant-gauche ; s : échelle. */
function chest(g, x, y, z, s = 1, lidOpen = 1) {
  const hx = 0.17 * s;
  const hy = 0.12 * s;
  const hb = 8 * s;
  const iron = '#3e3a36';
  g.box(x - hx, y - hy, x + hx, y + hy, z, z + hb, { col: '#6a4a2a', tex: MAT.planksDark.tex, pw: 4, tile: true }, {
    topMat: { col: '#2c1e12' },
    decoL: (c, w, h) => {
      c.fillStyle = iron;
      c.fillRect(w * 0.18, 0, 2.2, h);
      c.fillRect(w * 0.74, 0, 2.2, h);
      c.fillStyle = GOLD;
      c.fillRect(w * 0.47, h * 0.2, 3, 3.2);
    },
    decoR: (c, w, h) => {
      c.fillStyle = iron;
      c.fillRect(w * 0.3, 0, 2, h);
    },
  });
  if (!g.drawing) return;
  const c = g.ctx;
  // couvercle relevé à l'arrière : planche sombre intérieure puis dessus bombé
  const T0 = g.P(x - hx, y - hy, z + hb);
  const T1 = g.P(x + hx, y - hy, z + hb);
  const up = 9 * s * lidOpen;
  c.beginPath();
  c.moveTo(T0[0], T0[1]);
  c.lineTo(T1[0], T1[1]);
  c.lineTo(T1[0] + 1.5, T1[1] - up);
  c.lineTo(T0[0] + 1.5, T0[1] - up);
  c.closePath();
  c.fillStyle = '#7a5632';
  c.fill();
  c.strokeStyle = ink('#6a4a2a', 0.8);
  c.lineWidth = 0.9;
  c.stroke();
  c.fillStyle = iron;
  c.fillRect(T0[0] + 3, T0[1] - up + 0.5, 2, up);
  c.fillRect(T1[0] - 4, T1[1] - up + 0.5, 2, up);
  goldHeap(g, x, y + 0.01, z + hb - 0.5, 0.15 * s, 5.5 * s);
}

// ---------------------------------------------------------------------------
// Pierres et bois avec z
// ---------------------------------------------------------------------------

/** Pierre dressée irrégulière posée à la hauteur z (hauteur h px, demi-largeur hw px). */
function standingStone(g, x, y, z, h, hw, col = '#a9a69a', o = {}) {
  if (g.mode === 'shadow') {
    g.shadowPole(x, y, z, z + h, hw / 34);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const rnd = g.rng(x, y, z, h, 19);
  const [px, py] = g.P(x, y, z);
  const lean = o.lean ?? 1.5;
  const top = py - h;
  const L = [
    [px - hw, py + 1.5],
    [px - hw - 1 + rnd(), py - h * 0.45],
    [px - hw * 0.72 + lean, py - h * 0.86],
    [px - hw * 0.3 + lean, top - 1],
  ];
  const tip = [px + lean + 1, top + 1.5];
  const R = [
    [px + hw * 0.6 + lean, py - h * 0.9],
    [px + hw + 0.5, py - h * 0.5],
    [px + hw, py + 1.5],
  ];
  const ridge = [px + 1, py + 2.5];
  g.fillPoly([...L, tip, ridge], tone(col, 1.04), false);
  g.fillPoly([tip, ...R, ridge], tone(col, 0.68), false);
  g.path([...L, tip, ...R]);
  c.strokeStyle = ink(col, 0.65);
  c.lineWidth = 1;
  c.stroke();
  c.fillStyle = 'rgba(120,150,70,0.5)';
  for (let i = 0; i < 4; i++) {
    c.beginPath();
    c.ellipse(px + (rnd() - 0.5) * hw * 1.5, py - 1 - rnd() * h * (o.mossTop ? 0.95 : 0.4), 1.6 + rnd() * 1.8, 1 + rnd(), 0, 0, 2 * PI);
    c.fill();
  }
  if (o.carve) {
    c.strokeStyle = 'rgba(58,54,48,0.7)';
    c.lineWidth = 0.9;
    c.beginPath();
    c.arc(px - 1.5, py - h * 0.55, 3, 0.3, 1.9 * PI);
    c.stroke();
    c.beginPath();
    c.arc(px - 1.5, py - h * 0.55, 1.2, 0, 2 * PI);
    c.stroke();
    c.beginPath();
    c.moveTo(px - 3, py - h * 0.3);
    c.lineTo(px + 2, py - h * 0.3);
    c.moveTo(px - 2, py - h * 0.22);
    c.lineTo(px + 3, py - h * 0.22);
    c.stroke();
  }
}

/** Fût de colonne brisé : cylindre de pierre claire, sommet irrégulier. */
function brokenColumn(g, x, y, z, h, r = 0.13) {
  g.cyl(x, y, r, z, z + h, MAT.stoneLight, { top: { col: '#bdb8a9' }, ao: true });
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, z + h);
  // éclat : petit coin sombre à la cassure, mousse en pied
  c.fillStyle = 'rgba(60,54,46,0.55)';
  c.beginPath();
  c.moveTo(px - r * 44 * 0.55, py + 1);
  c.lineTo(px - r * 44 * 0.1, py - 3.5);
  c.lineTo(px + r * 44 * 0.35, py + 1.5);
  c.closePath();
  c.fill();
  moss(g, x, y, z + 0.5, r * 1.3, 0.55);
}

/** Crâne-tête sculptée ou visage au totem : disque clair avec yeux. */
function carvedFace(c, px, py, s, col) {
  c.fillStyle = col;
  c.beginPath();
  c.ellipse(px, py, 5.4 * s, 6 * s, 0, 0, 2 * PI);
  c.fill();
  c.strokeStyle = 'rgba(40,24,10,0.85)';
  c.lineWidth = 0.9;
  c.stroke();
  c.fillStyle = '#20140a';
  c.beginPath();
  c.ellipse(px - 2 * s, py - 1 * s, 1.3 * s, 1.6 * s, 0, 0, 2 * PI);
  c.ellipse(px + 2 * s, py - 1 * s, 1.3 * s, 1.6 * s, 0, 0, 2 * PI);
  c.fill();
  c.fillRect(px - 1.8 * s, py + 2.2 * s, 3.6 * s, 1.3 * s);
}

// ---------------------------------------------------------------------------
// Trésor des Anciens
// ---------------------------------------------------------------------------

function glyphs(c, w, h, tc) {
  c.strokeStyle = 'rgba(230,185,60,0.9)';
  c.fillStyle = 'rgba(230,185,60,0.9)';
  c.lineWidth = 1;
  // spirale, barres et soleil gravés, rehaussés d'or
  c.beginPath();
  for (let a = 0; a < 9; a += 0.4) {
    const r = 0.6 + a * 0.85;
    const X = w * 0.5 + Math.cos(a) * r;
    const Y = h * 0.3 + Math.sin(a) * r;
    if (a === 0) c.moveTo(X, Y);
    else c.lineTo(X, Y);
  }
  c.stroke();
  c.fillRect(w * 0.2, h * 0.56, w * 0.6, 1.3);
  c.fillRect(w * 0.26, h * 0.64, w * 0.48, 1.3);
  c.beginPath();
  c.arc(w * 0.5, h * 0.8, 2.3, 0, 2 * PI);
  c.stroke();
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * 2 * PI;
    c.beginPath();
    c.moveTo(w * 0.5 + Math.cos(a) * 3.3, h * 0.8 + Math.sin(a) * 3.3);
    c.lineTo(w * 0.5 + Math.cos(a) * 5, h * 0.8 + Math.sin(a) * 5);
    c.stroke();
  }
  // pan de tissu d'équipe accroché au bord gauche
  c.fillStyle = tc.main;
  c.fillRect(1, 0, 3.4, h * 0.42);
  c.beginPath();
  c.moveTo(1, h * 0.42);
  c.lineTo(2.7, h * 0.36);
  c.lineTo(4.4, h * 0.42);
  c.closePath();
  c.fill();
  // mousse
  c.fillStyle = 'rgba(100,140,56,0.55)';
  c.fillRect(0, h - 7, w, 7);
  for (let i = 0; i < 6; i++) c.fillRect(i * (w / 6), h - 11 + ((i * 5) % 4), w / 9, 5);
}

function treasure(g) {
  const tc = g.tc;
  const items = [];
  const Z0 = 5;
  const Z1 = 9;
  const add = (d, f) => items.push({ d, f });

  // dalle de gué : deux niveaux de pierre moussue
  add(-9, () => {
    g.box(-0.98, -0.98, 0.98, 0.98, 0, Z0, MAT.stoneDark, { topMat: { col: '#8d9480' }, ao: false });
    g.box(-0.72, -0.72, 0.72, 0.72, Z0, Z1, MAT.stone, { topMat: { col: '#9b9b8c' }, ao: false });
    if (g.drawing) {
      const c = g.ctx;
      // dallage fissuré sur le premier niveau
      c.strokeStyle = 'rgba(40,40,34,0.45)';
      c.lineWidth = 0.8;
      const seg = [[-0.6, 0.9, -0.2, 0.75], [0.3, 0.9, 0.85, 0.8], [0.9, 0.4, 0.78, -0.2], [-0.9, -0.1, -0.85, 0.45], [-0.5, -0.88, 0.1, -0.85]];
      for (const [a, b, d, e] of seg) {
        const p = g.P(a, b, Z0);
        const q = g.P(d, e, Z0);
        c.beginPath();
        c.moveTo(p[0], p[1]);
        c.lineTo((p[0] + q[0]) / 2 + 1.5, (p[1] + q[1]) / 2 - 1);
        c.lineTo(q[0], q[1]);
        c.stroke();
      }
      moss(g, -0.78, 0.75, Z0, 0.26);
      moss(g, 0.85, 0.2, Z0, 0.2);
      moss(g, 0.3, -0.85, Z0, 0.22);
      moss(g, -0.35, 0.3, Z1, 0.2, 0.4);
      moss(g, 0.45, 0.45, Z1, 0.16, 0.4);
    }
  });

  // stèle gravée dressée derrière l'autel
  add(-0.6, () => {
    g.box(-0.34, -0.6, 0.34, -0.44, Z1, 60, MAT.stoneLight, { decoL: (c, w, h) => glyphs(c, w, h, tc), ao: false });
    g.box(-0.3, -0.58, 0.14, -0.46, 60, 66, MAT.stoneLight, { ao: false });
    if (g.drawing) moss(g, 0, -0.52, 60, 0.12, 0.5);
  });

  // colonnes brisées
  add(-1.5, () => brokenColumn(g, -0.78, -0.72, Z1, 44));
  add(-1.3, () => brokenColumn(g, 0.78, -0.66, Z1, 28));
  add(0.2, () => brokenColumn(g, -0.86, 0.36, Z1, 13, 0.14));
  add(0.15, () => {
    // tambour de colonne couché
    g.beam(0.45, -0.3, Z1 + 4.6, 0.85, -0.05, Z1 + 4.6, '#b7b2a3', 9);
    moss(g, 0.65, -0.18, Z1 + 9, 0.12, 0.6);
  });

  // autel bas, voile d'équipe et butin
  add(0.1, () => {
    g.box(-0.4, -0.05, 0.4, 0.42, Z1, 22, MAT.stoneLight, { ao: false, topMat: { col: '#c2bdb0' } });
    g.box(-0.46, -0.1, 0.46, 0.47, 22, 25, MAT.stone, { ao: false, topMat: { col: '#c9c4b6' } });
    if (!g.drawing) return;
    const c = g.ctx;
    // voile d'équipe posé en travers de l'autel
    const a = g.P(-0.32, 0.0, 25);
    const b = g.P(0.32, 0.0, 25);
    const d = g.P(0.32, 0.4, 25);
    const e = g.P(-0.32, 0.4, 25);
    g.fillPoly([a, b, d, e], tc.main);
    const f1 = g.P(-0.32, 0.44, 25);
    const f2 = g.P(0.32, 0.44, 25);
    g.fillPoly([e, d, [f2[0] + 1, f2[1] + 10], [(e[0] + d[0]) / 2, f2[1] + 13], [f1[0] - 1, f1[1] + 10]], tone(tc.main, 0.8));
    c.strokeStyle = rgba(tc.light, 0.7);
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(e[0] + 1, e[1] + 4);
    c.lineTo(d[0] - 1, d[1] + 4);
    c.stroke();
  });
  add(0.35, () => {
    goldHeap(g, -0.12, 0.2, 25, 0.22, 9);
    goldHeap(g, 0.2, 0.26, 25, 0.12, 6);
    sparkle(g, -0.04, 0.12, 40, 1.15);
    sparkle(g, 0.3, 0.12, 34, 0.8);
  });

  // coffres et amphores
  add(0.7, () => {
    chest(g, -0.6, 0.5, Z1, 1.05);
    coins(g, -0.5, 0.72, Z1, 6, 0.2);
  });
  add(1.0, () => {
    chest(g, 0.52, 0.62, Z1, 0.9);
    coins(g, 0.65, 0.78, Z1, 5, 0.18);
    sparkle(g, 0.52, 0.55, 30, 0.9);
  });
  add(0.3, () => {
    amphora(g, 0.78, 0.22, Z1, 1.05, '#b9723e');
    amphora(g, 0.9, 0.42, Z1, 0.8, '#a66238');
  });
  add(0.05, () => {
    // amphore renversée et répandue
    amphora(g, -0.88, 0.05, Z1, 0.9, '#c07a44');
    goldHeap(g, -0.72, 0.12, Z1, 0.1, 4);
  });

  // braseros (lumière dorée) et fanion d'équipe
  add(-0.7, () => brazier(g, -0.55, -0.35, Z1, 26));
  add(0.3, () => brazier(g, 0.6, 0.18, Z1, 22));
  add(0.6, () => {
    if (!g.drawing) return;
    glow(g, -0.55, -0.35, Z1 + 30, 14, [255, 170, 60]);
    glow(g, 0.6, 0.18, Z1 + 26, 12, [255, 170, 60]);
  });
  add(1.45, () => pennant(g, 0.95, 0.95, Z0, 58, { len: 24, h: 11, symbol: false, knob: GOLD }));
  add(1.4, () => {
    // pierres éboulées au premier plan
    g.box(-0.3, 0.86, -0.08, 0.98, Z0, Z0 + 5, MAT.stone, { quick: true });
    g.box(0.12, 0.88, 0.36, 0.99, Z0, Z0 + 4, MAT.stoneDark, { quick: true });
  });

  items.sort((a, b) => a.d - b.d);
  for (const it of items) it.f();
}
treasure.custom = true;
treasure.noFlag = true;

// ---------------------------------------------------------------------------
// Colline sacrée
// ---------------------------------------------------------------------------

/** Mât-totem à visages sculptés, traverse et oriflamme d'équipe. */
function totem(g, x, y, z, hPole) {
  const tc = g.tc;
  if (g.mode === 'shadow') {
    g.shadowPole(x, y, z, z + hPole, 0.05);
    g.shadowOf([[x, y, z + hPole - 6], [x + 0.35, y + 0.35, z + hPole - 6], [x + 0.35, y + 0.35, z + hPole - 40], [x, y, z + hPole - 40]]);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py0] = g.P(x, y, z);
  const py = py0;
  const W = 6.4;
  // fût
  const gr = c.createLinearGradient(px - W / 2, 0, px + W / 2, 0);
  gr.addColorStop(0, tone('#7a5232', 1.15));
  gr.addColorStop(0.5, '#6a4526');
  gr.addColorStop(1, tone('#4e3219', 0.8));
  c.fillStyle = gr;
  c.fillRect(px - W / 2, py - hPole, W, hPole + 1);
  c.strokeStyle = ink('#6a4526', 0.7);
  c.lineWidth = 0.9;
  c.strokeRect(px - W / 2, py - hPole, W, hPole + 1);
  // bandes peintes
  for (let k = 0; k < 4; k++) {
    const yy = py - 10 - k * 17;
    c.fillStyle = k % 2 ? tc.main : '#efe6cc';
    c.fillRect(px - W / 2, yy, W, 3.4);
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.fillRect(px + W / 4, yy, W / 4, 3.4);
  }
  // visages sculptés
  carvedFace(c, px, py - hPole * 0.55, 0.85, '#c9ad80');
  carvedFace(c, px, py - hPole * 0.8, 0.85, '#c9ad80');
  // traverse en haut et pointe
  const top = py - hPole;
  stick(c, px - 1, top + 5, px + 26, top + 5, '#5a3a20', 2.2);
  c.fillStyle = GOLD;
  c.beginPath();
  c.moveTo(px - 2.4, top);
  c.lineTo(px, top - 7);
  c.lineTo(px + 2.4, top);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(90,55,10,0.8)';
  c.lineWidth = 0.6;
  c.stroke();
  // oriflamme pendante (queue d'aronde), ondulée
  const x0 = px + 6;
  const y0 = top + 6.5;
  const Wf = 15;
  const Hf = 36;
  c.beginPath();
  c.moveTo(x0, y0);
  c.lineTo(x0 + Wf, y0);
  c.bezierCurveTo(x0 + Wf + 2, y0 + Hf * 0.3, x0 + Wf - 2, y0 + Hf * 0.6, x0 + Wf, y0 + Hf);
  c.lineTo(x0 + Wf / 2, y0 + Hf * 0.78);
  c.lineTo(x0, y0 + Hf);
  c.bezierCurveTo(x0 + 2, y0 + Hf * 0.6, x0 - 2, y0 + Hf * 0.3, x0, y0);
  c.closePath();
  const fg = c.createLinearGradient(x0, 0, x0 + Wf, 0);
  fg.addColorStop(0, tone(tc.main, 1.12));
  fg.addColorStop(0.45, tc.main);
  fg.addColorStop(1, tone(tc.main, 0.72));
  c.fillStyle = fg;
  c.fill();
  c.strokeStyle = rgba(tc.dark, 0.9);
  c.lineWidth = 1;
  c.stroke();
  // galon clair et emblème : soleil simple
  c.fillStyle = tc.light;
  c.fillRect(x0 + 1.5, y0 + 2, Wf - 3, 2);
  c.beginPath();
  c.arc(x0 + Wf / 2, y0 + 13, 3.6, 0, 2 * PI);
  c.fillStyle = tc.light;
  c.fill();
  c.strokeStyle = rgba(tc.dark, 0.8);
  c.lineWidth = 0.8;
  c.stroke();
  c.fillStyle = tc.dark;
  c.beginPath();
  c.arc(x0 + Wf / 2, y0 + 13, 1.4, 0, 2 * PI);
  c.fill();
  // gland d'or au bout de la traverse
  c.fillStyle = GOLD;
  c.beginPath();
  c.arc(px + 26.8, top + 5, 1.6, 0, 2 * PI);
  c.fill();
  // petit fanion flottant vers la droite à la pointe
  c.beginPath();
  c.moveTo(px + 1.5, top - 5);
  c.quadraticCurveTo(px + 11, top - 9, px + 21, top - 4);
  c.quadraticCurveTo(px + 11, top - 3, px + 1.5, top + 0);
  c.closePath();
  c.fillStyle = tone(tc.main, 1.08);
  c.fill();
  c.strokeStyle = rgba(tc.dark, 0.85);
  c.lineWidth = 0.7;
  c.stroke();
}

/** Feu de signal : tripode, corbeille de fer, grande flamme et lueur. */
function signalFire(g, x, y, z) {
  if (g.mode === 'shadow') {
    g.shadowCyl(x, y, 0.12, z, z + 22);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, z);
  for (const dx of [-7, 0, 7]) stick(c, px + dx, py + 1, px + dx * 0.25, py - 17, '#3b2a1b', 1.8);
  // corbeille
  c.fillStyle = '#34312f';
  c.beginPath();
  c.moveTo(px - 8, py - 21);
  c.lineTo(px + 8, py - 21);
  c.lineTo(px + 4.5, py - 14);
  c.lineTo(px - 4.5, py - 14);
  c.closePath();
  c.fill();
  c.strokeStyle = '#6b6258';
  c.lineWidth = 1;
  c.stroke();
  // braises
  c.fillStyle = '#ff9a2a';
  c.beginPath();
  c.ellipse(px, py - 21, 7.4, 2.4, 0, 0, 2 * PI);
  c.fill();
  // flamme
  const fl = (sx, sy, s, col0, col1) => {
    const gr = c.createLinearGradient(0, sy, 0, sy - 26 * s);
    gr.addColorStop(0, col0);
    gr.addColorStop(1, col1);
    c.fillStyle = gr;
    c.beginPath();
    c.moveTo(sx - 6 * s, sy);
    c.bezierCurveTo(sx - 9 * s, sy - 10 * s, sx - 2 * s, sy - 14 * s, sx - 1 * s, sy - 26 * s);
    c.bezierCurveTo(sx + 3 * s, sy - 16 * s, sx + 9 * s, sy - 12 * s, sx + 6 * s, sy);
    c.closePath();
    c.fill();
  };
  fl(px, py - 21, 1.25, 'rgba(255,110,20,0.95)', 'rgba(255,200,70,0.85)');
  fl(px + 0.5, py - 21, 0.8, 'rgba(255,190,50,1)', 'rgba(255,250,190,0.95)');
  glow(g, x, y, 34, 22, [255, 140, 40]);
  smoke(g, x, y, 52, { n: 6, h: 34 });
}

/** Tas de pierres (cairn) : assises de plus en plus petites. */
function cairn(g, x, y, z) {
  const cols = ['#9b978b', '#b2ad9f', '#8a867c', '#bdb8a9'];
  g.box(x - 0.23, y - 0.2, x + 0.23, y + 0.2, z, z + 7, { col: cols[0] }, { quick: true });
  g.box(x - 0.17, y - 0.15, x + 0.17, y + 0.16, z + 7, z + 13, { col: cols[1] }, { quick: true });
  g.box(x - 0.12, y - 0.1, x + 0.11, y + 0.11, z + 13, z + 18, { col: cols[2] }, { quick: true });
  g.box(x - 0.06, y - 0.05, x + 0.06, y + 0.06, z + 18, z + 22, { col: cols[3] }, { quick: true });
  if (g.drawing) {
    // fanion de tissu noué au sommet
    const c = g.ctx;
    const [px, py] = g.P(x, y, z + 22);
    c.fillStyle = g.tc.main;
    c.beginPath();
    c.moveTo(px, py - 1);
    c.lineTo(px + 11, py - 4);
    c.lineTo(px + 8, py + 1);
    c.lineTo(px + 11, py + 5);
    c.lineTo(px, py + 3);
    c.closePath();
    c.fill();
    c.strokeStyle = rgba(g.tc.dark, 0.85);
    c.lineWidth = 0.7;
    c.stroke();
  }
}

function hill(g) {
  const items = [];
  const add = (d, f) => items.push({ d, f });
  const grassTop = { col: '#76a24a' };
  const earth = { col: '#8a6c4c', tex: MAT.earth.tex, tile: true };

  // pied : anneau d'herbe foulée
  add(-9, () => {
    if (!g.drawing) return;
    const c = g.ctx;
    const [X, Y] = g.P(0, 0, 0);
    c.save();
    c.filter = 'blur(1.4px)';
    c.fillStyle = 'rgba(120,94,62,0.42)';
    c.beginPath();
    c.ellipse(X, Y, 1.08 * RX, 1.08 * RY, 0, 0, 2 * PI);
    c.fill();
    c.restore();
  });
  // trois gradins du tertre
  add(-8, () => {
    g.cyl(0, 0, 0.96, 0, 7, earth, { top: grassTop, ao: true });
    g.cyl(0, 0, 0.74, 7, 13, earth, { top: grassTop, ao: true });
    g.cyl(0, 0, 0.5, 13, 18, earth, { top: grassTop, ao: true });
    if (!g.drawing) return;
    // touffes d'herbe et cailloux sur les gradins
    const c = g.ctx;
    const rnd = g.rng(3);
    for (let i = 0; i < 16; i++) {
      const a = rnd() * 2 * PI;
      const lvl = i % 3;
      const r = [0.86, 0.64, 0.4][lvl] * (0.75 + rnd() * 0.25);
      const z = [7, 13, 18][lvl];
      const [px, py] = g.P(Math.cos(a) * r, Math.sin(a) * r, z);
      c.strokeStyle = i % 2 ? '#5e8d38' : '#8ab85a';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(px - 2, py);
      c.lineTo(px - 2.5, py - 4);
      c.moveTo(px, py);
      c.lineTo(px + 0.3, py - 5);
      c.moveTo(px + 2, py);
      c.lineTo(px + 2.8, py - 3.5);
      c.stroke();
    }
    // petits cailloux de bordure
    for (let i = 0; i < 9; i++) {
      const a = PI * 0.05 + (i / 8) * PI * 0.92;
      const [px, py] = g.P(Math.cos(a) * 0.95, Math.sin(a) * 0.95, 1);
      c.fillStyle = i % 2 ? '#a7a396' : '#8d897e';
      c.beginPath();
      c.ellipse(px, py, 3.2, 2, 0, 0, 2 * PI);
      c.fill();
      c.strokeStyle = 'rgba(40,36,30,0.5)';
      c.lineWidth = 0.6;
      c.stroke();
    }
  });

  // menhirs bas de la ceinture du tertre
  add(-0.5, () => standingStone(g, 0.05, -0.85, 7, 17, 5.5, '#a9a69a', { lean: 1 }));
  add(0.45, () => standingStone(g, -0.88, 0.05, 7, 20, 6, '#b1ada1', { lean: -1, carve: true }));
  add(1.6, () => standingStone(g, 0.3, 0.85, 7, 15, 5, '#a29f93', { lean: 1.5 }));
  add(1.0, () => standingStone(g, 0.9, -0.2, 7, 14, 5, '#a29f93', { lean: 0.5 }));

  // mât-totem et oriflamme
  add(-0.3, () => totem(g, 0.05, -0.3, 18, 88));
  // feu de signal
  add(-0.25, () => signalFire(g, -0.42, -0.28, 13));
  // grand menhir du sommet
  add(0.2, () => standingStone(g, -0.12, 0.12, 18, 42, 10, '#b3afa3', { lean: 2, carve: true, mossTop: true }));
  // cairn
  add(0.7, () => cairn(g, 0.34, 0.36, 13));
  // offrandes au pied
  add(2.0, () => {
    if (!g.drawing) return;
    barrel(g, -0.3, 0.78, 0, 0.6);
    coins(g, 0.05, 0.93, 0, 3, 0.12);
  });

  items.sort((a, b) => a.d - b.d);
  for (const it of items) it.f();
}
hill.custom = true;
hill.noFlag = true;

export const POINTS = {
  pt_treasure: treasure,
  pt_hill: hill,
};

void [WOOD, WOOD_DARK];
