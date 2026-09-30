// Contre-siège (3×3), bâtiment de défense très coûteux qui contre les machines de siège.
//   Francs : « Chevalet de contre-siège » = donjon de pierre à hourds de bois et toit de tuiles, avant-mur crénelé avec
//            herse, chaudrons de poix, grappins à crochets, grandes arbalètes de rempart sur tourelles.
//   Gaulois : « Murs de contre-siège » = massif de murus gallicus aux têtes de poutres, tour de rondins couronnée de
//            pieux, chaudrons, crochets, fosse à pieux au pied, bannière aux crânes de bélier.
// Stades : 0 fondations (automatique), 1 soubassement + échafaudage, 2 gros œuvre sans couronnement, 3 terminé.

import { MAT, tone, rgba, ink } from './building-gfx.js';
import {
  WOOD, WOOD_DARK, scaffoldBox, pyramidRoof, stonePile, plankPile, crenels, roundCrenels, stick, stakes, linePts,
} from './building-parts.js';
import { banner, pennant, glow, smoke, GOLD, barrel, wallBannerLocal, shieldLocal, triskele, STEEL } from './building-props.js';
import { cauldron } from './building-civic.js';

const PI = Math.PI;
const IRON = '#3b3d42';

// ---------------------------------------------------------------------------
// Accessoires
// ---------------------------------------------------------------------------

/** Chaudron de poix bouillante sur un petit foyer : chaudron, braises dessous, vapeur figée. */
function pitchPot(g, x, y, z, s = 1, steam = true) {
  if (g.mode === 'shadow') {
    g.shadowCyl(x, y, 0.13 * s, z, z + 13 * s);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, z);
  // foyer de pierres et braises
  c.fillStyle = '#4a4540';
  c.beginPath();
  c.ellipse(px, py, 8 * s, 3.4 * s, 0, 0, 2 * PI);
  c.fill();
  c.fillStyle = 'rgba(255,120,30,0.85)';
  c.beginPath();
  c.ellipse(px, py - 0.5, 5 * s, 1.8 * s, 0, 0, 2 * PI);
  c.fill();
  cauldron(g, x, y, z + 1, s);
  glow(g, x, y, z + 9 * s, 10 * s, [255, 130, 40]);
  if (steam) smoke(g, x, y, z + 14 * s, { n: 4, h: 18 });
}

/** Grappin : perche de bois et crochet de fer recourbé, de (x0, y0, z0) à (x1, y1, z1). */
function hook(g, x0, y0, z0, x1, y1, z1) {
  if (g.mode === 'shadow') {
    g.shadowPole(x0, y0, z0, z0 + 6, 0.02);
    return;
  }
  if (!g.drawing) return;
  g.beam(x0, y0, z0, x1, y1, z1, WOOD, 2.6);
  const c = g.ctx;
  const [px, py] = g.P(x1, y1, z1);
  c.strokeStyle = IRON;
  c.lineWidth = 2;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(px, py);
  c.lineTo(px, py + 4);
  c.arc(px + 2.6, py + 4, 2.6, PI, PI * 0.15, true);
  c.stroke();
  c.strokeStyle = STEEL;
  c.lineWidth = 0.7;
  c.stroke();
  c.lineCap = 'butt';
  // frette de fer à la jonction
  c.fillStyle = IRON;
  c.fillRect(px - 2, py - 3, 4, 2);
}

/** Grande arbalète de rempart (écran) : arc large, fût, étrier, flèche d'acier et pivot. dir : 1 vers la droite, −1 vers la gauche. */
function wallCrossbow(g, x, y, z, dir = 1, s = 1) {
  if (g.mode === 'shadow') {
    g.shadowCyl(x, y, 0.1 * s, z, z + 10 * s);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, z);
  c.save();
  c.translate(px, py);
  c.scale(dir * s, s);
  // affût
  stick(c, -1, 0, -4, -8, '#4e3219', 2.2);
  stick(c, 1, 0, 4, -8, '#4e3219', 2.2);
  // fût
  c.fillStyle = '#7a5634';
  c.strokeStyle = 'rgba(30,18,8,0.9)';
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(-9, -10.5);
  c.lineTo(11, -13.5);
  c.lineTo(11, -11);
  c.lineTo(-9, -8);
  c.closePath();
  c.fill();
  c.stroke();
  // arc (vu de trois quarts : grand croissant de bois cerclé)
  c.strokeStyle = '#3a2614';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(7, -22);
  c.quadraticCurveTo(10.5, -12.5, 7, -3);
  c.stroke();
  c.strokeStyle = '#8a6440';
  c.lineWidth = 1.5;
  c.stroke();
  // corde
  c.strokeStyle = '#efe6cc';
  c.lineWidth = 0.7;
  c.beginPath();
  c.moveTo(7, -22);
  c.lineTo(-1, -12.3);
  c.lineTo(7, -3);
  c.stroke();
  // carreau
  c.strokeStyle = '#2a2a2a';
  c.lineWidth = 1.1;
  c.beginPath();
  c.moveTo(-3, -12);
  c.lineTo(15, -14.4);
  c.stroke();
  c.fillStyle = STEEL;
  c.beginPath();
  c.moveTo(15, -14.4);
  c.lineTo(12, -16);
  c.lineTo(12, -12.8);
  c.closePath();
  c.fill();
  c.restore();
}

/** Herse : arche sombre fermée d'une grille de fer, en repère local de face. */
function portcullis(c, u, w, h, open = 0) {
  const x0 = u - w / 2;
  c.fillStyle = '#1b130d';
  c.beginPath();
  c.moveTo(x0, h);
  c.lineTo(x0, h * 0.42);
  c.quadraticCurveTo(x0, 0, u, 0);
  c.quadraticCurveTo(x0 + w, 0, x0 + w, h * 0.42);
  c.lineTo(x0 + w, h);
  c.closePath();
  c.fill();
  c.save();
  c.clip();
  c.strokeStyle = '#5a5e66';
  c.lineWidth = 1.4;
  for (let i = 1; i < 5; i++) {
    c.beginPath();
    c.moveTo(x0 + (w * i) / 5, 0);
    c.lineTo(x0 + (w * i) / 5, h - open);
    c.stroke();
  }
  for (let v = 3 + open; v < h; v += 4.4) {
    c.beginPath();
    c.moveTo(x0, v);
    c.lineTo(x0 + w, v);
    c.stroke();
  }
  // pointes
  c.fillStyle = '#8b9098';
  for (let i = 1; i < 5; i++) {
    const X = x0 + (w * i) / 5;
    c.beginPath();
    c.moveTo(X - 1, h - open);
    c.lineTo(X, h - open + 3);
    c.lineTo(X + 1, h - open);
    c.closePath();
    c.fill();
  }
  c.restore();
  c.strokeStyle = 'rgba(40,36,30,0.9)';
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(x0, h);
  c.lineTo(x0, h * 0.42);
  c.quadraticCurveTo(x0, 0, u, 0);
  c.quadraticCurveTo(x0 + w, 0, x0 + w, h * 0.42);
  c.lineTo(x0 + w, h);
  c.stroke();
}

/** Crâne de bélier : museau clair, orbites, deux cornes enroulées. */
function ramSkull(c, px, py, s = 1) {
  c.lineCap = 'round';
  for (const d of [-1, 1]) {
    c.strokeStyle = '#6b5a3e';
    c.lineWidth = 2.6 * s;
    c.beginPath();
    c.moveTo(px + d * 2.4 * s, py - 2.6 * s);
    c.bezierCurveTo(px + d * 9 * s, py - 6 * s, px + d * 10 * s, py + 5 * s, px + d * 5.4 * s, py + 4.6 * s);
    c.bezierCurveTo(px + d * 3 * s, py + 4.2 * s, px + d * 4.8 * s, py + 1.4 * s, px + d * 6.4 * s, py + 2 * s);
    c.stroke();
    c.strokeStyle = '#d8ccae';
    c.lineWidth = 1.1 * s;
    c.stroke();
  }
  c.lineCap = 'butt';
  c.fillStyle = '#e6dcc2';
  c.strokeStyle = 'rgba(50,38,22,0.85)';
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(px - 3.6 * s, py - 3.4 * s);
  c.quadraticCurveTo(px, py - 6 * s, px + 3.6 * s, py - 3.4 * s);
  c.lineTo(px + 2.2 * s, py + 3 * s);
  c.quadraticCurveTo(px, py + 6.6 * s, px - 2.2 * s, py + 3 * s);
  c.closePath();
  c.fill();
  c.stroke();
  c.fillStyle = '#2a1b10';
  c.beginPath();
  c.ellipse(px - 1.6 * s, py - 1.2 * s, 1 * s, 1.3 * s, 0, 0, 2 * PI);
  c.ellipse(px + 1.6 * s, py - 1.2 * s, 1 * s, 1.3 * s, 0, 0, 2 * PI);
  c.fill();
  c.fillRect(px - 0.4 * s, py + 2.2 * s, 0.8 * s, 2 * s);
}

/** Tête de poutre (bout de rondin) sur une face : disque de bois clair à cernes, cerclé. */
function beamHeads(c, w, h, rows, step, col = '#b98c58', r = 3.3) {
  for (const v of rows) {
    for (let u = step * 0.5; u < w; u += step) {
      c.fillStyle = 'rgba(20,10,4,0.4)';
      c.beginPath();
      c.ellipse(u + 0.5, v + 1, r + 0.8, r + 0.8, 0, 0, 2 * PI);
      c.fill();
      c.fillStyle = col;
      c.beginPath();
      c.arc(u, v, r, 0, 2 * PI);
      c.fill();
      c.strokeStyle = 'rgba(70,40,16,0.75)';
      c.lineWidth = 0.7;
      c.stroke();
      c.strokeStyle = 'rgba(90,56,26,0.55)';
      c.beginPath();
      c.arc(u, v, r * 0.55, 0, 2 * PI);
      c.stroke();
    }
  }
  void h;
}

// ---------------------------------------------------------------------------
// Francs : Chevalet de contre-siège
// ---------------------------------------------------------------------------

function machicolations(c, w, h) {
  // planches du hourd, fentes de tir et rangée de mâchicoulis sombres sous le plancher
  c.fillStyle = '#6b4b2d';
  c.fillRect(-2, -2, w + 4, h + 4);
  c.strokeStyle = 'rgba(30,16,6,0.5)';
  c.lineWidth = 0.8;
  for (let u = 4; u < w; u += 5) {
    c.beginPath();
    c.moveTo(u, 0);
    c.lineTo(u, h);
    c.stroke();
  }
  c.fillStyle = '#19110b';
  for (let u = 5; u < w - 6; u += 11) c.fillRect(u, 2.2, 6.6, 4.6);
  c.fillStyle = 'rgba(255,230,180,0.14)';
  c.fillRect(0, 0, w, 1);
  c.fillStyle = '#19110b';
  for (let u = 8; u < w - 4; u += 11) c.fillRect(u, h - 4, 3, 4);
}

function keepDeco(face) {
  return (c, w, h) => {
    const tc = face.tc;
    // fentes de tir et banderole d'équipe
    c.fillStyle = '#17110d';
    for (const uu of [0.2, 0.8]) {
      c.fillRect(w * uu - 0.9, h * 0.22, 1.8, 13);
      c.fillRect(w * uu - 2.6, h * 0.22 + 4, 5.2, 1.5);
    }
    wallBannerLocal(c, tc, w * 0.5, h * 0.12, 14, 34);
  };
}

function frankCore(g, st) {
  const tc = g.tc;
  const face = { tc };
  const stone = MAT.stone;
  const hKeep = st === 1 ? 26 : 62;
  // donjon
  g.box(-0.95, -0.95, 0.95, 0.95, 0, hKeep, stone, { plan: true, decoL: keepDeco(face), decoR: keepDeco(face), topMat: { col: '#9b968a' } });
  // contreforts d'angle
  if (st >= 2) {
    for (const [x, y] of [[-0.95, 0.95], [0.95, 0.95], [0.95, -0.95]]) {
      g.box(x - 0.11, y - 0.11, x + 0.11, y + 0.11, 0, hKeep + 4, MAT.stoneLight, { ao: false, topMat: { col: '#c2bdb0' } });
    }
  }
  // avant-mur crénelé en L, avec porte à herse
  const fh = st === 1 ? 14 : 24;
  const wallMat = MAT.stoneLight;
  g.box(-1.45, 1.0, 1.45, 1.45, 0, fh, wallMat, {
    plan: true,
    topMat: { col: '#b9b3a4' },
    decoL: (c, w, h) => {
      if (st < 3) return;
      portcullis(c, w * 0.5, 22, h - 1.5, 3);
      c.fillStyle = '#6b6258';
      c.fillRect(w * 0.5 - 14, 1, 28, 2.4);
      for (const uu of [0.14, 0.86]) {
        c.fillStyle = '#17110d';
        c.fillRect(w * uu - 0.9, h * 0.25, 1.8, 10);
        c.fillRect(w * uu - 2.4, h * 0.25 + 3.4, 4.8, 1.4);
      }
    },
  });
  g.box(1.0, -1.45, 1.45, 1.0, 0, fh, wallMat, {
    plan: true,
    topMat: { col: '#b9b3a4' },
    decoR: (c, w, h) => {
      if (st < 3) return;
      for (const uu of [0.22, 0.5, 0.78]) {
        c.fillStyle = '#17110d';
        c.fillRect(w * uu - 0.9, h * 0.22, 1.8, 10);
        c.fillRect(w * uu - 2.4, h * 0.22 + 3.4, 4.8, 1.4);
      }
    },
  });
  if (st >= 3) {
    crenels(g, -1.45, 1.0, 1.45, 1.45, fh, { col: '#cfc9bb' }, { h: 7, t: 0.45, mw: 0.22, gap: 0.14, hp: 0 });
  }
}

function frankTurrets(g, st) {
  for (const [x, y] of [[-1.28, 1.28], [1.28, 1.28], [1.28, -1.28]]) {
    const top = st === 1 ? 20 : 40;
    g.cyl(x, y, 0.3, 0, top, MAT.stone, { top: { col: '#a8a294' }, ao: true, plan: true });
    if (st >= 3) {
      roundCrenels(g, x, y, 0.3, top, { col: '#cfc9bb' }, { h: 7, n: 9, depth: 3 });
    }
  }
}

function frankHourd(g) {
  // poutres en encorbellement sous le hourd
  for (const v of [-0.6, -0.1, 0.4, 0.8]) {
    g.beam(v, 0.95, 52, v, 1.1, 60, WOOD_DARK, 2.6);
    g.beam(0.95, v, 52, 1.1, v, 60, WOOD_DARK, 2.6);
  }
  const mat = { col: '#6b4b2d' };
  g.box(-1.13, -1.13, 1.13, 1.13, 60, 76, mat, { decoL: machicolations, decoR: machicolations, topMat: { col: '#5a3d25' }, ao: false });
  // liteaux d'angle
  for (const [x, y] of [[-1.13, 1.13], [1.13, 1.13], [1.13, -1.13]]) g.post(x, y, 60, 78, '#4a3018', 3.4);
  pyramidRoof(g, { x0: -1.03, y0: -1.03, x1: 1.03, y1: 1.03, zb: 76, za: 98, mat: MAT.shingle, ov: 0.16, th: 3, edge: WOOD_DARK, finial: true });
}

function frankAccessories(g, st) {
  const items = [];
  const add = (d, f) => items.push({ d, f });
  if (st >= 3) {
    const fh = 24;
    // chaudrons de poix sur l'avant-mur
    add(2.0, () => pitchPot(g, -0.55, 1.22, fh, 1, true));
    add(2.4, () => pitchPot(g, 0.5, 1.22, fh, 0.95, false));
    add(1.9, () => pitchPot(g, 1.22, -0.45, fh, 0.95, true));
    add(1.9, () => pitchPot(g, 1.22, 0.45, fh, 0.95, false));
    add(2.6, () => barrel(g, 0.05, 1.2, fh, 0.7));
    // arbalètes de rempart sur les tourelles
    add(2.9, () => wallCrossbow(g, -1.28, 1.28, 40, -1, 1.05));
    add(3.3, () => wallCrossbow(g, 1.28, 1.28, 40, 1, 1.05));
    add(2.0, () => wallCrossbow(g, 1.28, -1.28, 40, 1, 1));
    // grappins qui débordent des hourds
    add(2.4, () => hook(g, 0.5, 1.0, 66, 0.55, 1.62, 50));
    add(2.0, () => hook(g, -0.5, 1.0, 68, -0.5, 1.6, 52));
    add(2.0, () => hook(g, 1.0, 0.15, 68, 1.6, 0.2, 52));
    add(1.3, () => hook(g, 1.0, -0.6, 66, 1.58, -0.6, 50));
    // bannière d'équipe au sommet
    add(9, () => banner(g, 0, 0, 98, 18, { w: 13, h: 18, pole: true }));
  }
  items.sort((a, b) => a.d - b.d);
  return items;
}

function franks(g) {
  const st = g.stage;
  if (g.mode === 'plan') {
    g.box(-1.45, -1.45, 1.45, 1.45, 0, 1, MAT.stone, { plan: true });
    return;
  }
  // arrière et flancs d'abord : donjon, tourelles, hourd ; puis l'avant-mur et ses accessoires
  frankCore(g, st);
  if (st >= 2) frankTurrets(g, st);
  if (st >= 3) frankHourd(g);
  for (const it of frankAccessories(g, st)) it.f();
  if (st === 1) {
    scaffoldBox(g, -0.95, -0.95, 0.95, 0.95, 26, { deck: 22 });
    stonePile(g, -1.1, 0.4, 7);
    plankPile(g, 1.1, 0.6, 'y', 4);
  } else if (st === 2) {
    scaffoldBox(g, -0.95, -0.95, 0.95, 0.95, 66, { deck: 50, gap: 0.3 });
    stonePile(g, -0.9, 1.2, 6);
  }
}
franks.found = { stone: true };

// ---------------------------------------------------------------------------
// Gaulois : Murs de contre-siège
// ---------------------------------------------------------------------------

function timberHeads(rows, step) {
  return (c, w, h) => beamHeads(c, w, h, rows, step);
}

function gaulDeco(tc, wide) {
  return (c, w, h) => {
    // rondins horizontaux en bande, disque d'équipe et crâne de bélier
    beamHeads(c, w, h, [h * 0.18, h * 0.86], 10);
    c.fillStyle = tc.main;
    c.beginPath();
    c.arc(w / 2, h * 0.5, wide ? 10 : 8, 0, 2 * PI);
    c.fill();
    c.fillStyle = '#efe6cc';
    c.beginPath();
    c.arc(w / 2, h * 0.5, wide ? 8 : 6.4, 0, 2 * PI);
    c.fill();
    ramSkull(c, w / 2, h * 0.5 + 0.6, wide ? 0.78 : 0.62);
  };
}

function gauls(g) {
  const st = g.stage;
  const tc = g.tc;
  if (g.mode === 'plan') {
    g.box(-1.15, -1.15, 1.15, 1.15, 0, 1, MAT.murus, { plan: true });
    return;
  }
  const hBase = st === 1 ? 14 : 30;
  // fosse à pieux au pied (sol, avant) : tranchée sombre hérissée de pieux
  if (g.drawing && st >= 2) {
    const c = g.ctx;
    const trench = (pts) => {
      c.beginPath();
      pts.forEach(([x, y], i) => {
        const [px, py] = g.P(x, y, 0);
        if (i) c.lineTo(px, py);
        else c.moveTo(px, py);
      });
      c.closePath();
      c.fillStyle = 'rgba(28,18,10,0.82)';
      c.fill();
    };
    trench([[-1.4, 1.22], [1.4, 1.22], [1.4, 1.46], [-1.4, 1.46]]);
    trench([[1.22, -1.4], [1.46, -1.4], [1.46, 1.22], [1.22, 1.22]]);
  }
  // socle : massif de murus gallicus, têtes de poutres en façade
  g.box(-1.15, -1.15, 1.15, 1.15, 0, hBase, MAT.murus, {
    plan: true,
    topMat: { col: '#8d6d48' },
    decoL: timberHeads([8, 22], 9),
    decoR: timberHeads([8, 22], 9),
  });
  // bandeaux de poutres apparentes
  if (st >= 2) {
    g.box(-1.19, -1.19, 1.19, 1.19, 12, 15, { col: '#7a5634' }, { ao: false, topMat: { col: '#8a6440' } });
  }
  // pieux de la fosse
  if (st >= 2) {
    const pts = [];
    for (const p of linePts(-1.35, 1.34, 1.35, 1.34, 0.17)) pts.push(p);
    for (const p of linePts(1.34, -1.35, 1.34, 1.2, 0.17)) pts.push(p);
    for (const p of linePts(1.34, 1.2, 1.34, 1.34, 0.17)) pts.push(p);
    stakes(g, pts, 13, { col: '#9a7448' });
    const pts2 = linePts(1.34, -1.35, 1.34, 1.2, 0.17);
    stakes(g, pts2, 13, { col: '#9a7448' });
  }
  // tour de rondins
  const hTop = st === 1 ? hBase : st === 2 ? 62 : 62;
  if (st >= 2) {
    g.box(-0.78, -0.78, 0.78, 0.78, hBase, hTop, MAT.logs, {
      decoL: gaulDeco(tc, true),
      decoR: (c, w, h) => {
        beamHeads(c, w, h, [h * 0.14, h * 0.88], 10);
        shieldLocal(c, g.tc, w * 0.3, h * 0.5, 7, 'gauls', 1);
        shieldLocal(c, g.tc, w * 0.7, h * 0.5, 7, 'gauls', 0);
      },
      topMat: { col: '#7a5e3c' },
    });
    // poteaux d'angle montant au-dessus
    for (const [x, y] of [[-0.78, 0.78], [0.78, 0.78], [0.78, -0.78], [-0.78, -0.78]]) g.post(x, y, hBase, hTop + (st >= 3 ? 20 : 4), '#6a4526', 3.8);
  }
  if (st >= 3) {
    // galerie en encorbellement et palissade de pieux
    const gz = 62;
    for (const v of [-0.55, 0, 0.55]) {
      g.beam(v, 0.78, gz - 9, v, 0.98, gz, WOOD_DARK, 2.6);
      g.beam(0.78, v, gz - 9, 0.98, v, gz, WOOD_DARK, 2.6);
    }
    g.box(-1.0, -1.0, 1.0, 1.0, gz, gz + 4, { col: '#8a6440', tex: MAT.planks.tex, pw: 5, tile: true }, { ao: false, topMat: { col: '#8a6440' } });
    const ring = [];
    for (const p of linePts(-1.0, 1.0, 1.0, 1.0, 0.16)) ring.push(p);
    for (const p of linePts(1.0, 1.0, 1.0, -1.0, 0.16)) ring.push(p);
    // chaudrons et crochets, dessinés derrière la palissade avant
    const items = [];
    const add = (d, f) => items.push({ d, f });
    add(0.0, () => {
      const back = [];
      for (const p of linePts(-1.0, -1.0, 1.0, -1.0, 0.16)) back.push(p);
      for (const p of linePts(-1.0, -1.0, -1.0, 1.0, 0.16)) back.push(p);
      stakes(g, back, 22, { col: '#9a7448', z0: gz + 4 });
    });
    add(1.0, () => pitchPot(g, -0.4, 0.55, gz + 4, 0.95, true));
    add(1.3, () => pitchPot(g, 0.55, 0.3, gz + 4, 0.95, false));
    add(1.6, () => stakes(g, ring, 20, { col: '#a07a4c', z0: gz + 4 }));
    // poteau de bannière central : deux crânes de bélier et étoffe d'équipe
    add(0.5, () => {
      g.post(0.0, -0.2, gz + 4, gz + 50, '#5a3a20', 3.6);
      if (!g.drawing) return;
      const c = g.ctx;
      const [px, py] = g.P(0, -0.2, gz + 4);
      const top = py - 46;
      stick(c, px - 15, top + 8, px + 15, top + 8, '#5a3a20', 2.4);
      // étoffe pendante
      c.beginPath();
      c.moveTo(px - 12, top + 9);
      c.lineTo(px + 12, top + 9);
      c.lineTo(px + 12, top + 32);
      c.lineTo(px + 6, top + 27);
      c.lineTo(px, top + 33);
      c.lineTo(px - 6, top + 27);
      c.lineTo(px - 12, top + 32);
      c.closePath();
      const gr = c.createLinearGradient(px - 12, 0, px + 12, 0);
      gr.addColorStop(0, tone(tc.main, 1.1));
      gr.addColorStop(0.5, tc.main);
      gr.addColorStop(1, tone(tc.main, 0.72));
      c.fillStyle = gr;
      c.fill();
      c.strokeStyle = rgba(tc.dark, 0.9);
      c.lineWidth = 0.9;
      c.stroke();
      triskele(c, px, top + 22, 5.6, '#f3ead2');
      ramSkull(c, px - 14, top + 9, 0.8);
      ramSkull(c, px + 14, top + 9, 0.8);
      c.fillStyle = GOLD;
      c.beginPath();
      c.arc(px, top - 1, 2.1, 0, 2 * PI);
      c.fill();
    });
    add(2.0, () => hook(g, 0.7, 1.0, gz + 12, 0.75, 1.6, gz - 4));
    add(2.0, () => hook(g, -0.6, 1.0, gz + 12, -0.6, 1.6, gz - 4));
    add(1.6, () => hook(g, 1.0, -0.4, gz + 12, 1.6, -0.4, gz - 4));
    add(1.6, () => hook(g, 1.0, 0.5, gz + 12, 1.62, 0.5, gz - 4));
    add(3.0, () => pennant(g, 1.0, 1.0, gz + 4, 34, { len: 20, h: 9, symbol: false }));
    add(3.0, () => pennant(g, -1.0, 1.0, gz + 4, 30, { len: 18, h: 8, symbol: false }));
    add(3.0, () => pennant(g, 1.0, -1.0, gz + 4, 30, { len: 18, h: 8, symbol: false }));
    // chaudron au pied, sur le socle
    add(4.0, () => pitchPot(g, 0.95, 1.0, hBase, 0.8, false));
    items.sort((a, b) => a.d - b.d);
    for (const it of items) it.f();
  }
  if (st === 1) {
    scaffoldBox(g, -1.15, -1.15, 1.15, 1.15, 26, { deck: 12 });
    plankPile(g, 0.6, 1.3, 'x', 4);
  } else if (st === 2) {
    scaffoldBox(g, -0.78, -0.78, 0.78, 0.78, 58, { deck: 44, gap: 0.3 });
    plankPile(g, -0.9, 1.3, 'x', 3);
  }
  void [tone, ink, WOOD, STEEL];
}
gauls.found = {};

export const COUNTERSIEGE = {
  franks: { countersiege: franks },
  gauls: { countersiege: gauls },
};
