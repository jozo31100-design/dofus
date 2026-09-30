// Port (Francs) / Embarcadère (Gaulois) : plate-forme de planches sur pilotis qui remplit l'emprise 3×3,
// sans jetée orientée (il sera posé au bord de l'eau, de n'importe quel côté). Bittes d'amarrage, cordages,
// tonneaux, caisses de poissons, filets qui sèchent, coque de barque sur chevalet.
// Francs : entrepôt à pignon et grue à poulie. Gaulois : cabane ronde de chaume, amphores, poteaux à fanions.

import { MAT, rgba, tone } from './building-gfx.js';
import { WOOD, WOOD_DARK, roundHut, longHouse, scaffoldBox, stick, doorLocal, windowLocal, linePts } from './building-parts.js';
import { pennant, banner, wallBannerLocal, barrel, sack, crate } from './building-props.js';
import { amphora, fishCrate, bollard, netRack, boatHull, rope } from './building-civic.js';

const PI = Math.PI;
const ZT = 8; // hauteur du plancher
const ZF = 4.6; // bas de la tranche du plancher
const E = 1.42; // demi-côté de la plate-forme
const DECK_TOP = { col: '#9a8468', tex: MAT.planksGrey.tex, pw: 5, tile: true };
const DECK_SIDE = MAT.planksDark;

/** Plate-forme sur pilotis : renvoie true si elle doit être peinte entièrement (stade ≥ 2). */
function deck(g) {
  const st = g.stage;
  if (g.mode === 'plan') {
    g.planRect(-E - 0.03, -E - 0.03, E + 0.03, E + 0.03);
    return;
  }
  if (g.mode === 'shadow') {
    g.shadowBox(-E, -E, E, E, ZF, ZT);
    return;
  }
  const c = g.ctx;
  // ombre froide sous le plancher
  g.path([g.P(-E, -E, 0), g.P(E, -E, 0), g.P(E, E, 0), g.P(-E, E, 0)]);
  c.fillStyle = 'rgba(8,16,30,0.62)';
  c.fill();
  // pilotis et croix de Saint-André, du fond vers l'avant
  const step = (2 * E - 0.14) / 6;
  const ps = [];
  for (let i = 0; i <= 6; i++) {
    const t = -E + 0.07 + i * step;
    ps.push([t, E - 0.07], [E - 0.07, t]);
  }
  ps.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  for (let i = 0; i + 1 <= 6; i++) {
    const t = -E + 0.07 + i * step;
    g.beam(t, E - 0.07, 0.5, t + step, E - 0.07, ZF + 0.5, '#4e3a26', 1.3);
    g.beam(E - 0.07, t, ZF + 0.5, E - 0.07, t + step, 0.5, '#4e3a26', 1.3);
  }
  for (const [x, y] of ps) g.post(x, y, 0, ZF + 1, '#5a4630', 3.4);
  // algues et humidité au pied des pieux avant
  c.fillStyle = 'rgba(40,70,40,0.35)';
  for (const [x, y] of ps) {
    if (x < E - 0.2 && y < E - 0.2) continue;
    const [px, py] = g.P(x, y, 0);
    c.fillRect(px - 2, py - 2, 4, 2);
  }
  if (st === 1) {
    // solives apparentes, plancher posé sur l'arrière seulement
    for (let t = -E + 0.1; t < E; t += 0.42) g.beam(-E + 0.03, t, 4.6, E - 0.03, t, ZF + 0.6, '#8a6a44', 1.6);
    g.beam(-E + 0.03, E - 0.05, 4.6, E - 0.03, E - 0.05, ZF + 0.6, '#8a6a44', 2.2);
    g.beam(E - 0.05, -E + 0.03, 4.6, E - 0.05, E - 0.03, ZF + 0.6, '#8a6a44', 2.2);
    g.box(-E, -E, E, -0.15, ZF, ZT, DECK_SIDE, { topMat: DECK_TOP, ao: false });
    return;
  }
  g.box(-E, -E, E, E, ZF, ZT, DECK_SIDE, { topMat: DECK_TOP, ao: false });
  // lattes du plancher (joints transversaux) et clous
  const cc = g.ctx;
  cc.strokeStyle = 'rgba(40,25,10,0.28)';
  cc.lineWidth = 0.7;
  cc.beginPath();
  for (let t = -E + 0.3; t < E - 0.1; t += 0.3) {
    const a = g.P(t, -E, ZT);
    const b = g.P(t, E, ZT);
    cc.moveTo(a[0], a[1]);
    cc.lineTo(b[0], b[1]);
  }
  cc.stroke();
}

/** Garde-corps de perches posé sur le plancher, le long d'une polyligne. */
function deckRail(g, pts, h = 10) {
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    g.beam(ax, ay, ZT + h * 0.5, bx, by, ZT + h * 0.5, '#8c6a44', 1.4);
    g.beam(ax, ay, ZT + h * 0.92, bx, by, ZT + h * 0.92, '#8c6a44', 1.5);
  }
  for (const [x, y] of pts.slice().sort((a, b) => a[0] + a[1] - (b[0] + b[1]))) g.post(x, y, ZT, ZT + h + 1, '#7a5a38', 2.2);
}

/** Bittes d'amarrage, cordages qui pendent vers l'eau. */
function mooring(g, spots, ropes) {
  for (const [x, y] of spots) bollard(g, x, y, ZT);
  for (const [a, b] of ropes) rope(g, [a[0], a[1], ZT + 3], [b[0], b[1], 1], 9, { col: '#bfae80', w: 1.6 });
}

/** Stade 0 : pieux battus, quelques planches et une maillet. */
function foundExtra(g) {
  if (!g.drawing) return;
  const rnd = g.rng(4, 4);
  const pts = [];
  for (let i = 0; i < 6; i++) pts.push([-E + 0.2 + i * 0.5, E - 0.1], [E - 0.1, -E + 0.2 + i * 0.5]);
  pts.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  for (const [x, y] of pts) g.post(x, y, 0, 6 + rnd() * 5, '#b58f5c', 3);
  for (const [x, y, ang] of [[0.3, 0.4, 0.6], [-0.5, 0.9, -0.3]]) {
    g.beam(x - Math.cos(ang) * 0.35, y - Math.sin(ang) * 0.35, 2, x + Math.cos(ang) * 0.35, y + Math.sin(ang) * 0.35, 2, '#a98252', 3);
  }
}

// ---------------------------------------------------------------------------
// Gaulois : cabane ronde sur plate-forme
// ---------------------------------------------------------------------------

function dockGauls(g) {
  const st = g.stage;
  const tc = g.tc;
  deck(g);
  if (g.mode === 'plan') return;
  const items = [];
  items.push({
    d: -1,
    f: () => roundHut(g, {
      x: -0.5, y: -0.48, r: 0.62, z0: ZT, wallH: 17, R: 0.78, apex: 47, door: 1.75, doorW: 8, doorH: 12, posts: 6,
      roofBand: tc.main, band: '#b5603a', th: 4.5, plan: false,
    }),
  });
  items.push({
    d: -0.4,
    f: () => roundHut(g, {
      x: 0.72, y: -0.86, r: 0.34, z0: ZT, wallH: 12, R: 0.44, apex: 34, door: 2.2, doorW: 6, doorH: 9, posts: 4,
      roofBand: tc.main, th: 4, plan: false,
    }),
  });
  if (st >= 2) {
    items.push({ d: -1.1, f: () => deckRail(g, linePts(-E + 0.08, -E + 0.08, E - 0.5, -E + 0.08, 0.5), 9) });
    items.push({ d: -0.9, f: () => netRack(g, [-1.3, -0.05], [-1.3, 0.85], ZT, 34, { seed: 1 }) });
  }
  if (st === 3) {
    items.push({ d: 0.3, f: () => { amphora(g, 0.95, -0.15, ZT, 1.2); amphora(g, 1.2, 0.05, ZT, 1.0, '#a8602f'); amphora(g, 1.02, 0.18, ZT, 1.05, '#c98a4c'); } });
    items.push({ d: 0.6, f: () => { barrel(g, 0.3, -0.55, ZT, 0.9); sack(g, 0.12, -0.35, ZT, { s: 0.8 }); } });
    items.push({ d: 0.5, f: () => boatHull(g, -0.1, 0.9, ZT, 'x', 1.25) });
    items.push({ d: 1.6, f: () => { fishCrate(g, 1.1, 0.7, ZT); fishCrate(g, 0.98, 1.05, ZT); } });
    items.push({ d: 0.9, f: () => { crate(g, 0.72, 0.3, ZT); } });
    items.push({ d: 2, f: () => mooring(g, [[1.3, -0.9], [1.3, 0.35], [0.4, 1.3], [-0.8, 1.3]], [[[1.3, 0.35], [1.62, 0.6]], [[0.4, 1.3], [0.6, 1.6]]]) });
    for (const [x, y] of [[1.3, -1.15], [1.3, 1.28], [-1.3, 1.3]]) {
      items.push({ d: x + y + 0.3, f: () => pennant(g, x, y, ZT, 44, { len: 19, h: 9 }) });
    }
    
  } else if (st === 2) {
    items.push({ d: 0.5, f: () => barrel(g, 0.35, -0.55, ZT, 0.9) });
    items.push({ d: 1.6, f: () => bollard(g, 1.3, 0.35, ZT) });
  } else if (st === 1) {
    items.push({ d: 1.5, f: () => scaffoldBox(g, -1.0, -1.0, 0.2, 0.1, 40, { sides: 'R' }) });
  }
  items.sort((a, b) => a.d - b.d);
  for (const it of items) it.f();
}
dockGauls.found = { logs: false };
dockGauls.foundExtra = foundExtra;
dockGauls.ground = () => {};

// ---------------------------------------------------------------------------
// Francs : entrepôt à pignon et grue à poulie
// ---------------------------------------------------------------------------

/** Grue à poulie : mât, flèche, contrefiche, câble et tonneau en cours de levage. */
function crane(g, x, y, done) {
  const H = 56;
  if (g.mode === 'shadow') {
    g.shadowPole(x, y, ZT, ZT + H, 0.05);
    g.shadowOf([[x, y, ZT + H], [x + 0.46, y - 0.46, ZT + H - 4], [x + 0.46, y - 0.46, ZT + H - 18]]);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  g.box(x - 0.16, y - 0.16, x + 0.16, y + 0.16, ZT, ZT + 5, MAT.stone, { ao: false });
  g.post(x, y, ZT + 3, ZT + H, WOOD_DARK, 5);
  g.beam(x - 0.02, y + 0.02, ZT + 40, x + 0.42, y - 0.42, ZT + H - 2, WOOD, 2.2); // contrefiche
  g.beam(x, y, ZT + H - 1, x + 0.46, y - 0.46, ZT + H - 4, '#7a5634', 3); // flèche
  g.beam(x, y, ZT + H - 2, x - 0.22, y + 0.22, ZT + H - 6, '#7a5634', 2.4); // contre-flèche
  const [jx, jy] = g.P(x + 0.46, y - 0.46, ZT + H - 4);
  const [mx, my] = g.P(x, y, ZT + H);
  // poulie
  c.fillStyle = '#5a5048';
  c.beginPath();
  c.arc(jx, jy + 2, 2.6, 0, 2 * PI);
  c.fill();
  c.strokeStyle = '#2a2622';
  c.lineWidth = 0.8;
  c.stroke();
  c.fillStyle = '#e6b93c';
  c.beginPath();
  c.arc(jx, jy + 2, 0.9, 0, 2 * PI);
  c.fill();
  // câble, palan et charge (tonneau en suspension)
  if (done) {
    const [bx, by] = g.P(x + 0.46, y - 0.46, ZT + 26);
    c.strokeStyle = '#d8c9a0';
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(jx + 0.8, jy + 4);
    c.lineTo(bx, by);
    c.stroke();
    c.beginPath();
    c.moveTo(bx, by);
    c.lineTo(bx - 4.5, by + 8);
    c.moveTo(bx, by);
    c.lineTo(bx + 4.5, by + 8);
    c.stroke();
    c.fillStyle = '#3a3a3a';
    c.beginPath();
    c.arc(bx, by, 1.4, 0, 2 * PI);
    c.fill();
    barrel(g, x + 0.46, y - 0.46, ZT + 8, 0.95);
  }
  void mx;
  void my;
}

function dockFranks(g) {
  const st = g.stage;
  const tc = g.tc;
  deck(g);
  if (g.mode === 'plan') return;
  const items = [];
  items.push({
    d: -2,
    f: () => longHouse(g, {
      x0: -1.28, y0: -1.3, x1: 0.2, y1: -0.22, z0: ZT, plinthH: 0, wallH: 22, ridgeH: 49, axis: 'x',
      wallMat: MAT.planksGrey, roofMat: MAT.shingle, heads: true, ov: 0.13, ovg: 0.08, th: 3, plan: false,
      decoL: (c, w, h) => {
        doorLocal(c, w * 0.3, h, 11, 15, { open: 0.4 });
        windowLocal(c, w * 0.7, h * 0.42, 4, 5);
        if (st === 3) {
          c.fillStyle = '#6a5a48';
          c.fillRect(w * 0.52 - 3.5, h * 0.24 - 3.5, 7, 7);
          c.fillStyle = tc.main;
          c.fillRect(w * 0.52 - 2.8, h * 0.24 - 2.8, 5.6, 5.6);
          c.fillStyle = 'rgba(255,255,255,0.75)';
          c.fillRect(w * 0.52 - 2.8, h * 0.24 - 0.5, 5.6, 1);
        }
      },
      decoR: (c, w, h) => windowLocal(c, w * 0.5, h * 0.45, 4, 5),
      gableDeco: st === 3 ? (c, w, h) => wallBannerLocal(c, tc, w / 2, h * 0.3, 7, 11) : null,
    }),
  });
  if (st >= 2) items.push({ d: -1.2, f: () => deckRail(g, linePts(-E + 0.08, -0.15, -E + 0.08, E - 0.15, 0.5), 10) });
  if (st === 3) {
    items.push({ d: -0.9, f: () => netRack(g, [1.32, -1.15], [1.32, -0.35], ZT, 34, { seed: 2 }) });
    items.push({ d: 0.4, f: () => { barrel(g, 0.5, -0.7, ZT, 0.9); barrel(g, 0.7, -0.55, ZT, 0.85); sack(g, 0.33, -0.5, ZT, { s: 0.8 }); } });
    items.push({ d: 0.4, f: () => boatHull(g, -0.05, 1.0, ZT, 'x', 1.3) });
    items.push({ d: 1.6, f: () => { fishCrate(g, 1.15, 0.85, ZT); fishCrate(g, 0.95, 1.15, ZT); crate(g, 1.2, 0.35, ZT, 0.13, 8); } });
    items.push({ d: 2, f: () => mooring(g, [[1.3, -0.1], [1.3, 0.62], [0.4, 1.3], [-0.85, 1.3]], [[[1.3, 0.62], [1.62, 0.85]], [[0.4, 1.3], [0.6, 1.62]]]) });
    items.push({ d: 1.2, f: () => banner(g, 1.28, 1.28, ZT, 46, { w: 11, h: 16 }) });
    items.push({ d: -0.3, f: () => banner(g, -1.28, 0.2, ZT, 40, { w: 9, h: 13 }) });
  }
  if (st >= 2) items.push({ d: 0.7, f: () => crane(g, 0.95, 0.18, st === 3) });
  if (st === 2) items.push({ d: 0.5, f: () => barrel(g, 0.5, -0.7, ZT, 0.9) });
  if (st === 1) items.push({ d: 1.5, f: () => scaffoldBox(g, -1.05, -1.05, 0.2, -0.1, 40, { sides: 'R' }) });
  items.sort((a, b) => a.d - b.d);
  for (const it of items) it.f();
}
dockFranks.foundExtra = foundExtra;
dockFranks.ground = () => {};

void rgba;
void tone;
void stick;

export const DOCK = { gauls: dockGauls, franks: dockFranks };

// Pièces réutilisables par d'autres peuples (plate-forme sur pilotis, amarrage, garde-corps, fondations du chantier)
export { deck as dockDeck, deckRail as dockDeckRail, mooring as dockMooring, foundExtra as dockFoundExtra, ZT as DOCK_ZT, E as DOCK_E };
