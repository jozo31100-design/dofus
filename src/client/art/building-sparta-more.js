// Bâtiments spartiates (suite) : archery (champ des archers crétois), stable (haras), forge (Héphaïstos), tower (pyrgos),
// siege (atelier des machines), dock (port de Gythion et cale à trières), mill, lumber, mining, slingtower, countersiege,
// great_house, et les pièces défensives en calcaire à tuiles (wall, gate, rampart, great_gate, bastion, outpost).
// Sparte n'avait pas de remparts : ces ouvrages sont sobres, en assises de calcaire clair, hoplons d'équipe et toits de tuiles.
import { MAT, tone } from './building-gfx.js';
import {
  longHouse, shed, scaffoldBox, doorLocal, windowLocal, railFence, pyramidRoof, leanRoof, stonePile, plankPile, scaffold, linePts, WOOD, WOOD_DARK,
} from './building-parts.js';
import {
  pennant, barrel, crate, sack, weaponRack, target, hayBale, cart, millstone, millstoneUp, sawhorse, stumpAxe, logPile, trough, anvil, glow, smoke, GOLD,
} from './building-props.js';
import { amphora, cauldron, boatHull, netRack, fishCrate, bollard } from './building-civic.js';
import { horse } from './building-fauna.js';
import { catapultFrame, ram } from './building-gauls.js';
import { wallPiece, gatePiece, FRANK_WALL, WMAT, uvRect, uvPt, boxUV, archDeco } from './building-walls.js';
import { FRANK_RAMP, FRANK_GG } from './building-defense.js';
import { dockDeck, dockDeckRail, dockMooring, dockFoundExtra, DOCK_ZT, DOCK_E } from './building-dock.js';
import {
  MARBLE, STYL, WALL, TILE, TILE_EDGE, lambdaDisc, column, doric, hoplonLocal, olive, tripod, statue, palmette, banner,
} from './building-sparta-parts.js';

const PI = Math.PI;
const INTERIOR = '#2a1f17';
const ASHLAR = { ...WMAT.ashlar, col: '#d4cebc' };
const CYL = { ...MAT.stoneLight, col: '#d4cebc' };
const ASHLAR_D = { ...WMAT.ashlarDark, col: '#bdb7a5' };

/** Stoa (portique long ouvert sur +y) : colonnes doriques devant, mur au fond, toit de tuiles. */
function stoa(g, o) {
  doric(g, { ny: 2, cut: -99, backWall: true, noAcro: true, stepH: 5, entH: 6, ...o });
}

// ---------------------------------------------------------------------------
// Militaire
// ---------------------------------------------------------------------------

function archery(g) {
  // Champ des archers crétois : stoa à râteliers d'arcs, cibles de paille et balles de foin devant
  stoa(g, {
    x0: -1.4, y0: -1.4, x1: 0.85, y1: -0.45, colH: 22, nx: 6, pedH: 15,
    extra: (gg) => {
      banner(gg, -1.3, -0.3, 0, 50, { w: 11, h: 16, pole: true });
    },
  });
  if (g.mode === 'plan') return;
  const st = g.stage;
  if (st >= 2) weaponRack(g, -0.5, -1.05, 'x', 0.9, { bows: true, n: 7 });
  if (st === 3) {
    hayBale(g, -0.9, 0.85, 0, 'x');
    target(g, -0.9, 0.85, 7.5);
    hayBale(g, -0.1, 1.1, 0, 'x');
    target(g, -0.1, 1.1, 7.5);
    hayBale(g, 0.7, 0.9, 0, 'x');
    target(g, 0.7, 0.9, 7.5);
    olive(g, 1.2, -0.85, 0.8);
    barrel(g, 1.15, 0.0, 0, 0.85);
  }
}

function stable(g) {
  // Haras : stoa aux stalles, enclos de perches où paissent des chevaux, abreuvoir et foin
  stoa(g, {
    x0: -1.4, y0: -1.4, x1: 0.45, y1: -0.45, colH: 20, nx: 5, pedH: 14,
  });
  if (g.mode === 'plan') return;
  const st = g.stage;
  if (st >= 2) {
    hayBale(g, -1.1, -1.0, 0, 'x');
    hayBale(g, -0.85, -0.85, 0, 'x');
  }
  if (st === 3) {
    horse(g, 0.55, 0.45, { col: '#7a4a2a', dir: 1, pose: 'stand', blaze: true });
    horse(g, -0.4, 0.95, { col: '#2e2622', dir: -1, pose: 'graze' });
    horse(g, 1.0, 1.0, { col: '#b5936a', dir: 1, pose: 'look', s: 0.92 });
    trough(g, -0.9, 0.2, 'x', 0.55);
    railFence(g, [[1.3, -1.35], [1.3, 1.4], [-1.4, 1.4]], 8);
    banner(g, 0.7, -0.35, 0, 46, { w: 10, h: 15, pole: true });
    olive(g, 1.25, -0.8, 0.8);
  }
}

function forge(g) {
  // Forge d'Héphaïstos : atelier de calcaire à toit de tuiles, fournaise rougeoyante, cheminée de pierre, armes de bronze
  const st = g.stage;
  const tc = g.tc;
  const x0 = -1.25;
  const y0 = -1.25;
  const x1 = 0.3;
  const y1 = 0.2;
  longHouse(g, {
    x0, y0, x1, y1, plinthH: 4, plinthMat: STYL, wallH: 26, ridgeH: 62, axis: 'y', frame: false,
    wallMat: WALL, gableMat: WALL, roofMat: TILE, edge: TILE_EDGE, ridge: '#7a3020', heads: false, ov: 0.14, ovg: 0.1, th: 3,
    decoL: (c, w, h) => {
      c.fillStyle = INTERIOR;
      c.fillRect(w * 0.25, h - 18, w * 0.5, 18);
      c.fillStyle = '#e8dcc0';
      c.fillRect(w * 0.25 - 2, h - 20, w * 0.5 + 4, 2.4);
      if (st === 3) {
        const gr = c.createRadialGradient(w * 0.5, h - 5, 1, w * 0.5, h - 5, 14);
        gr.addColorStop(0, 'rgba(255,200,90,1)');
        gr.addColorStop(0.4, 'rgba(240,110,30,0.8)');
        gr.addColorStop(1, 'rgba(120,30,10,0)');
        c.fillStyle = gr;
        c.fillRect(w * 0.25, h - 26, w * 0.5, 26);
      }
    },
    decoR: (c, w, h) => {
      windowLocal(c, w * 0.3, h * 0.45, 4, 6, { glow: st === 3 });
      if (st === 3) hoplonLocal(c, tc, w * 0.7, h * 0.42, 4.4);
    },
    gableDeco: st === 3 ? (c, w, h) => lambdaDisc(c, tc, w / 2, h * 0.5, 4.4) : null,
  });
  const cx0 = x1;
  const cx1 = x1 + 0.26;
  const cy0 = -0.92;
  const cy1 = -0.64;
  const ch = st === 1 ? 14 : st === 2 ? 70 : 92;
  if (g.mode === 'plan') g.planRect(cx0, cy0, cx1, cy1);
  else {
    g.box(cx0, cy0, cx1, cy1, 0, ch, { ...MAT.stoneLight, col: '#b8a48a' }, { topMat: { col: '#3a3432' } });
    if (st === 3) {
      g.box(cx0 - 0.03, cy0 - 0.03, cx1 + 0.03, cy1 + 0.03, ch - 4, ch, MAT.stone, { topMat: { col: '#2a2422' } });
      glow(g, (cx0 + cx1) / 2, (cy0 + cy1) / 2, ch, 5, [255, 110, 40]);
      smoke(g, (cx0 + cx1) / 2, (cy0 + cy1) / 2, ch, { h: 40, n: 7 });
    }
  }
  if (st === 3 && g.drawing) {
    anvil(g, 0.55, 0.62);
    barrel(g, 0.95, 0.25, 0, 0.9);
    amphora(g, -0.2, 0.75, 0, 1);
    weaponRack(g, -0.3, 0.95, 'x', 0.8, { n: 5 });
    banner(g, -1.25, 0.9, 0, 44, { w: 10, h: 15, pole: true });
    olive(g, 1.15, 1.05, 0.8);
  }
}
forge.found = { stone: true };

function tower(g) {
  // Pyrgos : tour carrée de calcaire, belvédère à quatre colonnettes sous un toit de tuiles
  const st = g.stage;
  const tc = g.tc;
  const s = 0.5;
  const h = 100;
  if (g.mode === 'plan') {
    g.planRect(-s, -s, s, s);
    return;
  }
  if (st === 1) {
    g.box(-s, -s, s, s, 0, h * 0.36, MAT.stoneLight, { topMat: MAT.stone });
    scaffoldBox(g, -s, -s, s, s, h * 0.36 + 16, { step: 0.5 });
    return;
  }
  const slits = (c, w, hh) => {
    for (const v of [0.25, 0.52]) {
      c.fillStyle = INTERIOR;
      c.fillRect(w / 2 - 1, hh * v, 2, 9);
    }
  };
  g.box(-s, -s, s, s, 0, 6, STYL, { topMat: STYL, quick: true });
  g.box(-s + 0.03, -s + 0.03, s - 0.03, s - 0.03, 6, h, ASHLAR, {
    decoL: (c, w, hh) => {
      doorLocal(c, w / 2, hh, 8, 13, { open: 0.2 });
      slits(c, w, hh * 0.8);
      if (st === 3) hoplonLocal(c, tc, w * 0.5, hh * 0.22, 7);
    },
    decoR: (c, w, hh) => slits(c, w, hh),
    topMat: MAT.stone,
  });
  if (st === 2) {
    scaffoldBox(g, -s, -s, s, s, h + 6, { sides: 'R' });
    return;
  }
  // corniche puis belvédère
  g.box(-s - 0.05, -s - 0.05, s + 0.05, s + 0.05, h - 4, h + 2, MARBLE, { topMat: STYL, ao: false, quick: true });
  const cols = [[-0.34, -0.34], [0.34, -0.34], [-0.34, 0.34], [0.34, 0.34]];
  for (const [x, y] of cols.slice(0, 3)) column(g, x, y, h + 2, h + 20, 0.05);
  g.box(-0.3, -0.3, 0.3, 0.3, h + 2, h + 6, { ...WALL, col: '#e0d6bc' }, { quick: true, ao: false });
  column(g, cols[3][0], cols[3][1], h + 2, h + 20, 0.05);
  pyramidRoof(g, { x0: -0.4, y0: -0.4, x1: 0.4, y1: 0.4, zb: h + 20, za: h + 44, mat: TILE, ov: 0.06, th: 2.4, edge: TILE_EDGE, finial: true });
  banner(g, 0, 0, h + 44, 16, { w: 9, h: 12, pole: true });
}

function siege(g) {
  // Atelier des machines : grande stoa, baliste et bélier sous le portique, rondins et roues dans la cour
  stoa(g, {
    x0: -1.9, y0: -1.9, x1: 1.0, y1: -0.75, colH: 30, nx: 7, pedH: 20, stepH: 5,
    extra: (gg) => {
      banner(gg, 1.15, -0.7, 0, 56, { w: 12, h: 18, pole: true });
    },
  });
  if (g.mode === 'plan') {
    g.planRect(1.0, -0.4, 1.9, 1.9);
    return;
  }
  const st = g.stage;
  if (st >= 2) logPile(g, -1.0, -1.45, 'x', [5, 4, 3], 1.1, 3.2);
  if (st === 3) {
    catapultFrame(g, -0.3, 0.45, true);
    ram(g, 0.75, 0.3, '#b98a3e');
    logPile(g, -1.3, 1.2, 'x', [3, 2], 0.8, 2.8);
    crate(g, 0.3, 1.3);
    barrel(g, 0.6, 1.35);
    stonePile(g, -0.6, 1.6, 6);
    banner(g, -1.8, 0.6, 0, 50, { w: 12, h: 18, pole: true });
    olive(g, 1.6, 1.4, 0.9);
  }
}
siege.found = { logs: true };

function dock(g) {
  // Port de Gythion : plate-forme de planches sur pilotis, cale couverte à colonnes, trière sur son chevalet, amphores et filets
  const st = g.stage;
  const ZT = DOCK_ZT;
  dockDeck(g);
  if (g.mode === 'plan') return;
  const items = [];
  items.push({
    d: -2,
    f: () => doric(g, {
      x0: -1.28, y0: -1.3, x1: 0.35, y1: -0.3, z0: ZT, colH: 20, nx: 5, ny: 2, pedH: 14, stepH: 3, entH: 6, cut: -99, backWall: true, noAcro: true,
    }),
  });
  if (st >= 2) items.push({ d: -1.2, f: () => dockDeckRail(g, linePts(-DOCK_E + 0.08, -0.15, -DOCK_E + 0.08, DOCK_E - 0.15, 0.5), 10) });
  if (st === 3) {
    items.push({ d: -0.9, f: () => netRack(g, [1.32, -1.15], [1.32, -0.35], ZT, 34, { seed: 2 }) });
    items.push({ d: 0.4, f: () => { barrel(g, 0.75, -0.75, ZT, 0.9); amphora(g, 0.95, -0.55, ZT, 1); sack(g, 0.6, -0.5, ZT, { s: 0.8 }); } });
    items.push({ d: 0.4, f: () => boatHull(g, -0.05, 1.0, ZT, 'x', 1.3) });
    items.push({ d: 1.6, f: () => { fishCrate(g, 1.15, 0.85, ZT); amphora(g, 0.95, 1.2, ZT, 1); crate(g, 1.2, 0.35, ZT, 0.13, 8); } });
    items.push({ d: 2, f: () => dockMooring(g, [[1.3, -0.1], [1.3, 0.62], [0.4, 1.3], [-0.85, 1.3]], [[[1.3, 0.62], [1.62, 0.85]], [[0.4, 1.3], [0.6, 1.62]]]) });
    items.push({ d: 1.2, f: () => banner(g, 1.28, 1.28, ZT, 46, { w: 11, h: 16, pole: true }) });
    items.push({ d: -0.3, f: () => tripod(g, -1.2, 0.35, ZT, 0.95) });
  }
  if (st === 1) items.push({ d: 1.5, f: () => scaffoldBox(g, -1.05, -1.05, 0.2, -0.1, 40, { sides: 'R' }) });
  items.sort((a, b) => a.d - b.d);
  for (const it of items) it.f();
}
dock.foundExtra = dockFoundExtra;
dock.ground = () => {};

// ---------------------------------------------------------------------------
// Économie
// ---------------------------------------------------------------------------

/** Petit pavillon à quatre piliers de calcaire sous un toit pyramidal de tuiles ; centre (cx, cy), demi-côté s. */
function pavilion(g, o) {
  const s = o.s || 0.78;
  const hc = o.hc || 24;
  const cx = o.cx || 0;
  const cy = o.cy || 0;
  if (g.mode === 'plan') {
    g.planRect(cx - s - 0.1, cy - s - 0.1, cx + s + 0.1, cy + s + 0.1);
    return;
  }
  const st = g.stage;
  const pts = [[cx - s, cy - s], [cx + s, cy - s], [cx - s, cy + s], [cx + s, cy + s]];
  g.box(cx - s - 0.1, cy - s - 0.1, cx + s + 0.1, cy + s + 0.1, 0, 4, STYL, { topMat: { col: '#cfc9b8' }, quick: true });
  if (st >= 2 && o.inside) o.inside(g);
  if (st === 1) {
    for (const [x, y] of pts.slice(0, 3)) column(g, x, y, 4, 4 + hc * 0.5, 0.07);
    if (g.mode === 'draw') scaffoldBox(g, cx - s, cy - s, cx + s, cy + s, hc + 10, { sides: 'LR' });
    return;
  }
  for (const [x, y] of pts.slice(0, 3)) column(g, x, y, 4, 4 + hc, 0.07);
  pyramidRoof(g, { x0: cx - s - 0.04, y0: cy - s - 0.04, x1: cx + s + 0.04, y1: cy + s + 0.04, zb: 4 + hc + 2, za: 4 + hc + 26, mat: TILE, ov: 0.12, th: 2.6, edge: TILE_EDGE, finial: true });
  column(g, pts[3][0], pts[3][1], 4, 4 + hc, 0.07);
  if (st === 3 && o.outside) o.outside(g);
}

function mill(g) {
  // Moulin à manège : aire dallée où un âne tourne la meule, magasin à grain sous un pavillon de tuiles
  const st = g.stage;
  pavilion(g, {
    s: 0.5, hc: 24, cx: -0.72, cy: -0.72,
    inside: (gg) => {
      sack(gg, -0.72, -0.72, 4, { s: 0.9 });
      sack(gg, -0.58, -0.86, 4, { s: 0.8 });
    },
  });
  if (g.mode === 'plan') {
    g.planRect(-0.1, -0.1, 1.0, 1.0);
    return;
  }
  if (st === 1) return;
  g.disc(0.5, 0.5, 0.55, 0, { ...MAT.stoneLight, col: '#cfc9b8' });
  millstone(g, 0.5, 0.5, 0, 0.3, 9);
  if (st === 3) {
    g.beam(0.5, 0.5, 11, 0.98, 0.5, 9, '#7a5634', 2.4);
    horse(g, 0.98, 0.6, { col: '#9a9088', dir: -1, pose: 'stand', s: 0.72 });
    sack(g, 1.0, -0.1, 0, { s: 0.9 });
    sack(g, 0.85, -0.3, 0, { s: 0.8 });
    amphora(g, -0.1, 0.9, 0, 1);
    banner(g, 1.2, -0.35, 0, 42, { w: 9, h: 13, pole: true });
  }
}

function lumber(g) {
  // Scierie : appentis sur piliers de pierre, tas de rondins, chevalet de sciage, hache plantée
  const st = g.stage;
  if (g.mode === 'plan') {
    g.planRect(-0.95, -0.95, 0.95, 0.95);
    return;
  }
  shed(g, {
    x0: -0.95, y0: -0.95, x1: 0.5, y1: 0.4, zHigh: 36, zLow: 24, dir: 'y', mat: TILE, th: 3, edge: TILE_EDGE, postCol: '#c8c2b0',
    backWall: WALL, sideWall: undefined,
  });
  if (st >= 2) logPile(g, -0.45, -0.6, 'x', [4, 3, 2], 0.8, 3);
  if (st === 3) {
    sawhorse(g, 0.05, 0.05, 'x');
    stumpAxe(g, 0.72, 0.65);
    logPile(g, 0.75, -0.3, 'y', [3, 2], 0.6, 2.8);
    banner(g, -0.9, 0.7, 0, 42, { w: 9, h: 13, pole: true });
    olive(g, -0.85, 1.0, 0.65);
  }
}

function mining(g) {
  // Camp minier (carrière du Taygète) : appentis, chariot chargé de pierres, blocs équarris, pioches
  const st = g.stage;
  if (g.mode === 'plan') {
    g.planRect(-0.95, -0.95, 0.95, 0.95);
    return;
  }
  shed(g, {
    x0: -0.95, y0: -0.95, x1: 0.2, y1: 0.0, zHigh: 34, zLow: 23, dir: 'y', mat: TILE, th: 3, edge: TILE_EDGE, postCol: '#c8c2b0', backWall: WALL,
  });
  if (st >= 2) {
    stonePile(g, -0.6, -0.6, 6);
    crate(g, -0.1, -0.55);
  }
  if (st === 3) {
    cart(g, 0.35, 0.65, 'x', 'stone');
    stonePile(g, -0.6, 0.6, 7);
    g.box(0.55, -0.5, 0.85, -0.22, 0, 7, { ...MAT.stoneLight, col: '#d8d2c0' }, { quick: true });
    banner(g, -0.9, 0.85, 0, 42, { w: 9, h: 13, pole: true });
  }
}

function greatHouse(g) {
  // Grande maison : demeure à étage de calcaire, portique à deux colonnes, balcon, toit de tuiles
  const tc = g.tc;
  const st = g.stage;
  if (g.mode === 'plan') {
    g.planRect(-1.2, -1.15, 1.2, 1.1);
    return;
  }
  g.box(-1.2, -1.15, 1.2, 1.1, 0, 5, STYL, { topMat: STYL, quick: true });
  longHouse(g, {
    x0: -1.05, y0: -1.0, x1: 0.85, y1: 0.95, z0: 5, plinthH: 0, wallH: 30, ridgeH: 62, axis: 'x', plan: false,
    wallMat: WALL, roofMat: TILE, gableMat: WALL, edge: TILE_EDGE, ov: 0.12, ovg: 0.07, th: 2.8, ridge: '#7a3020',
    decoL: (c, w, h) => {
      doorLocal(c, w * 0.3, h, 8, 13);
      windowLocal(c, w * 0.68, h * 0.66, 4, 5);
      windowLocal(c, w * 0.3, h * 0.3, 4, 5);
      windowLocal(c, w * 0.68, h * 0.3, 4, 5);
      c.fillStyle = tc.main;
      c.fillRect(w * 0.3 - 5, h - 17, 10, 2.2);
    },
    decoR: (c, w, h) => {
      windowLocal(c, w * 0.3, h * 0.6, 4, 5);
      windowLocal(c, w * 0.7, h * 0.6, 4, 5);
      if (st === 3) hoplonLocal(c, tc, w * 0.5, h * 0.3, 4.4);
    },
    gableDeco: st === 3 ? (c, w, h) => lambdaDisc(c, tc, w / 2, h * 0.5, 5) : null,
  });
  if (st === 3) {
    amphora(g, 1.0, 0.6, 5, 1);
    amphora(g, 1.0, -0.6, 5, 1);
    olive(g, -1.1, 1.05, 0.85);
    olive(g, 1.0, 1.0, 0.75);
    banner(g, 1.05, 0.0, 5, 40, { w: 9, h: 13, pole: true });
  }
}

// ---------------------------------------------------------------------------
// Défense
// ---------------------------------------------------------------------------

function slingtower(g) {
  // Tour à pierriers : tour ronde de calcaire, couronne de colonnettes et machine à bras au sommet, pile de boulets
  const st = g.stage;
  const tc = g.tc;
  if (g.mode === 'plan') {
    g.planRect(-0.85, -0.85, 0.85, 0.85);
    return;
  }
  const r = 0.72;
  const H = 70;
  g.cyl(0, 0, 0.88, 0, 6, STYL, { top: MAT.stone, ao: false });
  g.cyl(0, 0, r, 6, st === 1 ? 30 : H, CYL, {
    deco: (c, X, Y, rx, ry) => {
      if (st < 2) return;
      c.fillStyle = '#17110d';
      for (const t of [0.7, 1.57, 2.4]) {
        const sn = Math.sin(t);
        c.fillRect(X + rx * Math.cos(t) - 1 * sn, Y - 30 - 10 * 0 + ry * sn, 2 * sn + 0.4, 9);
      }
    },
    top: st === 3 ? MAT.stone : MAT.stone,
  });
  if (st === 1) {
    if (g.mode === 'draw') scaffoldBox(g, -0.6, -0.6, 0.6, 0.6, 46, { step: 0.5 });
    return;
  }
  g.cyl(0, 0, r + 0.07, H - 5, H + 2, MARBLE, { ao: false });
  if (st === 2) return;
  // colonnettes du parapet et machine
  const ring = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * PI * 2 + 0.2;
    ring.push([Math.cos(a) * (r - 0.06), Math.sin(a) * (r - 0.06)]);
  }
  ring.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  for (const [x, y] of ring.slice(0, 5)) column(g, x, y, H + 2, H + 14, 0.045);
  if (g.drawing) {
    // bras du pierrier (tendu par un faisceau de cordes) et sa poche
    const z = H + 2;
    g.beam(-0.3, 0.1, z, -0.3, -0.1, z + 18, WOOD_DARK, 3);
    g.beam(0.25, -0.05, z, 0.25, 0.15, z + 18, WOOD_DARK, 3);
    g.beam(-0.3, 0, z + 14, 0.55, -0.45, z + 40, '#9a7048', 3);
    const [bx, by] = g.P(0.55, -0.45, z + 40);
    g.ctx.fillStyle = '#5a3a20';
    g.ctx.beginPath();
    g.ctx.ellipse(bx, by, 4, 2.6, 0, 0, PI * 2);
    g.ctx.fill();
    g.ctx.fillStyle = '#b8b2a0';
    g.ctx.beginPath();
    g.ctx.arc(bx, by - 3, 2.4, 0, PI * 2);
    g.ctx.fill();
  }
  for (const [x, y] of ring.slice(5)) column(g, x, y, H + 2, H + 14, 0.045);
  stonePile(g, 0.95, 0.8, 6, '#b5afa0');
  if (g.drawing) {
    banner(g, -0.98, 0.55, 0, 50, { w: 10, h: 14, pole: true });
    const c = g.ctx;
    const [px, py] = g.P(0.0, r + 0.02, 40);
    hoplonLocal(c, tc, px, py, 8);
  }
}
slingtower.found = { stone: true };

function countersiege(g) {
  // Chevalet de contre-siège : bloc de calcaire couronné d'une haie d'hoplons, chaudrons d'huile aux angles
  const st = g.stage;
  const tc = g.tc;
  if (g.mode === 'plan') {
    g.planRect(-1.3, -1.3, 1.3, 1.3);
    return;
  }
  const s = 1.25;
  const hb = st === 1 ? 14 : 30;
  g.box(-s, -s, s, s, 0, hb, ASHLAR, {
    topMat: { col: '#c4beac' },
    decoL: (c, w, h) => {
      if (st < 3) return;
      c.fillStyle = INTERIOR;
      c.fillRect(w / 2 - 6, h - 16, 12, 16);
      for (const u of [0.15, 0.85]) hoplonLocal(c, tc, w * u, h * 0.42, 6);
    },
    decoR: (c, w, h) => {
      if (st < 3) return;
      for (const u of [0.2, 0.5, 0.8]) hoplonLocal(c, tc, w * u, h * 0.4, 6);
    },
  });
  if (st === 1) {
    if (g.mode === 'draw') scaffoldBox(g, -s, -s, s, s, hb + 14, { step: 0.6 });
    stonePile(g, 1.0, 1.5, 6);
    return;
  }
  // toit de tuiles pare-feu au centre et haie d'hoplons sur le parapet
  pyramidRoof(g, { x0: -0.85, y0: -0.85, x1: 0.85, y1: 0.85, zb: hb + 14, za: hb + 44, mat: TILE, ov: 0.1, th: 2.6, edge: TILE_EDGE, finial: true });
  if (st === 3 && g.drawing) {
    g.box(-0.9, -0.9, 0.9, 0.9, hb, hb + 14, WALL, { quick: true, ao: false });
    const c = g.ctx;
    for (const [x, y] of [[-1.15, 1.15], [1.15, 1.15], [1.15, -1.15]]) {
      cauldron(g, x, y, hb, 0.9);
    }
    for (let k = 0; k < 7; k++) {
      const t = -1.0 + k * (2.0 / 6);
      const [px, py] = g.P(t, s + 0.01, hb + 4);
      hoplonLocal(c, tc, px, py, 4.2);
    }
    for (let k = 0; k < 6; k++) {
      const t = -1.0 + k * (2.0 / 5);
      const [px, py] = g.P(s + 0.01, t, hb + 4);
      hoplonLocal(c, tc, px, py, 4.2);
    }
    banner(g, -1.2, -1.2, hb, 44, { w: 10, h: 14, pole: true });
  }
}
countersiege.found = { stone: true };

function outpost(g) {
  // Poste de guet : pilier de calcaire à belvédère de quatre colonnettes et toit de tuiles
  const st = g.stage;
  const tc = g.tc;
  if (g.mode === 'plan') {
    g.planRect(-0.36, -0.36, 0.36, 0.36);
    return;
  }
  const s = 0.26;
  const h = st === 1 ? 20 : 48;
  g.box(-s - 0.06, -s - 0.06, s + 0.06, s + 0.06, 0, 4, STYL, { topMat: STYL, quick: true });
  g.box(-s, -s, s, s, 4, h, ASHLAR, {
    decoL: (c, w, hh) => {
      if (st < 3) return;
      c.fillStyle = INTERIOR;
      c.fillRect(w / 2 - 1, hh * 0.3, 2, 8);
      hoplonLocal(c, tc, w / 2, hh * 0.72, 4.5);
    },
    decoR: (c, w, hh) => {
      c.fillStyle = INTERIOR;
      c.fillRect(w / 2 - 1, hh * 0.3, 2, 8);
    },
    topMat: MAT.stone,
  });
  if (st === 1) {
    if (g.mode === 'draw') scaffoldBox(g, -s, -s, s, s, h + 14, { step: 0.4 });
    return;
  }
  const z = h;
  g.box(-s - 0.05, -s - 0.05, s + 0.05, s + 0.05, z, z + 3, MARBLE, { topMat: STYL, quick: true, ao: false });
  const cs = [[-0.23, -0.23], [0.23, -0.23], [-0.23, 0.23], [0.23, 0.23]];
  for (const [x, y] of cs.slice(0, 3)) column(g, x, y, z + 3, z + 17, 0.04);
  column(g, cs[3][0], cs[3][1], z + 3, z + 17, 0.04);
  if (st === 3 || st === 2) pyramidRoof(g, { x0: -0.3, y0: -0.3, x1: 0.3, y1: 0.3, zb: z + 18, za: z + 38, mat: TILE, ov: 0.07, th: 2.2, edge: TILE_EDGE, finial: false });
  if (st === 3) pennant(g, 0, 0, z + 38, 14, { len: 15, h: 7, symbol: false, knob: GOLD });
}
outpost.found = {};

/** Bastion : tour ronde à fruit, tambour de calcaire, péristyle de colonnettes et toit conique de tuiles. */
function bastion(g) {
  const st = g.stage;
  const tc = g.tc;
  if (g.mode === 'plan') {
    g.planCircle(0, 0, 1.44);
    return;
  }
  const hc = st === 1 ? 8 : 18;
  const r = 0.98;
  const H = st === 1 ? 36 : 72;
  g.cyl(0, 0, 1.44, 0, hc, { ...MAT.stoneLight, col: '#cdc7b5' }, { top: MAT.stone });
  g.cyl(0, 0, 1.3, hc, hc + 6, STYL, { ao: false, top: st >= 2 ? MAT.stone : undefined });
  g.cyl(0, 0, r, hc + 6, H, CYL, {
    deco: st >= 2 ? (c, X, Y, rx, ry) => {
      c.fillStyle = '#17110d';
      for (const t of [0.6, 1.25, 1.9, 2.55]) {
        const sn = Math.sin(t);
        c.fillRect(X + rx * Math.cos(t) - 1.1 * sn, Y - 46 + ry * sn, 2.2 * sn + 0.4, 10);
      }
      const t = 1.57;
      const sn = Math.sin(t);
      hoplonLocal(c, tc, X + rx * Math.cos(t) * 0.0, Y - 30 + ry * sn, 7);
    } : null,
  });
  if (st === 1) {
    g.disc(0, 0, r, H, MAT.stone);
    if (g.mode === 'draw') scaffoldBox(g, -0.75, -0.75, 0.75, 0.75, H + 16, { step: 0.5 });
    return;
  }
  g.cyl(0, 0, r + 0.08, H - 5, H + 3, MARBLE, { ao: false, top: STYL });
  if (st === 2) {
    if (g.mode === 'draw') scaffoldBox(g, -0.75, -0.75, 0.75, 0.75, H + 12, { sides: 'R' });
    return;
  }
  const ring = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * PI * 2 + 0.3;
    ring.push([Math.cos(a) * (r - 0.05), Math.sin(a) * (r - 0.05)]);
  }
  ring.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  for (const [x, y] of ring.slice(0, 5)) column(g, x, y, H + 3, H + 18, 0.05);
  for (const [x, y] of ring.slice(5)) column(g, x, y, H + 3, H + 18, 0.05);
  const G = g.cone(0, 0, H + 18, r + 0.22, H + 18 + 46, TILE);
  if (g.drawing && G) {
    const c = g.ctx;
    c.strokeStyle = '#8a3a2a';
    c.lineWidth = 1.6;
    c.beginPath();
    c.ellipse(G.X, G.Yb + 0.5, G.rx, G.ry, 0, 0, PI);
    c.stroke();
  }
  banner(g, 0, 0, H + 18 + 44, 22, { w: 13, h: 18, pole: true });
}
bastion.found = { stone: true };

// ---- Murs, portes, grand rempart, grande porte : calcaire clair, hoplons, toits de tuiles --------------------------------------

function hoplonMark(g, S, st) {
  const tc = g.tc;
  return (c, w, h) => {
    if (st < 3) return;
    hoplonLocal(c, tc, w / 2, h * 0.34, 4.6);
  };
}

function spartaPillarTop(g, S, hp, A) {
  const pe = S.pe;
  const d = 0.045;
  g.box(-pe - d, -pe - d, pe + d, pe + d, hp - 5, hp, MARBLE, { ao: false, topMat: { col: '#cfc9b8' } });
  pyramidRoof(g, { x0: -pe + 0.03, y0: -pe + 0.03, x1: pe - 0.03, y1: pe - 0.03, zb: hp + 2, za: hp + 22, mat: TILE, ov: 0.05, th: 2, edge: TILE_EDGE, finial: false });
  if (A.n <= 1) banner(g, 0, 0, hp + 20, 20, { w: 10, h: 14, pole: true });
  else pennant(g, 0, 0, hp + 20, 12, { len: 15, h: 7, symbol: false, knob: GOLD });
}

const SP_WALL = {
  ...FRANK_WALL, civ: 'franks', h: 40, hp: 54, mat: ASHLAR, pmat: ASHLAR_D, topCol: '#c4beac', coreCol: '#9d9788', merCol: '#e0dac8',
  faceMark: (c, tc, u, h) => hoplonLocal(c, tc, u, h * 0.6, 4.4),
  pillarTop: spartaPillarTop,
};

const SP_GATE = {
  ...SP_WALL,
  gateMark: hoplonMark,
  gateTop(g, S, ax, ht, hc, pw, ev) {
    for (const [u0, u1] of [[-S.R, -pw], [pw, S.R]]) {
      const [x0, y0, x1, y1] = uvRect(ax, u0 + 0.07, -ev + 0.1, u1 - 0.07, ev - 0.1);
      pyramidRoof(g, { x0, y0, x1, y1, zb: ht + 2, za: ht + 24, mat: TILE, ov: 0.04, th: 2, edge: TILE_EDGE, finial: false });
    }
    const [bx, by] = uvPt(ax, -(S.R + pw) / 2, 0);
    const [fx, fy] = uvPt(ax, (S.R + pw) / 2, 0);
    banner(g, bx, by, ht + 18, 14, { w: 9, h: 12, pole: true });
    pennant(g, fx, fy, ht + 18, 12, { len: 15, h: 7, symbol: false, knob: GOLD });
  },
};

const SP_RAMP = {
  ...FRANK_RAMP, civ: 'franks', mat: ASHLAR, pmat: ASHLAR_D, topCol: '#c4beac', coreCol: '#9d9788', merCol: '#e0dac8', slabMat: { col: '#c2bcab' },
  faceDeco(g, S, a, b, st) {
    if (st < 3 || a > -S.R + 0.01 || b < S.R - 0.01) return null;
    const tc = g.tc;
    return (c, w, h) => {
      for (const u of [0.2, 0.5, 0.8]) hoplonLocal(c, tc, w * u, h * 0.26, 7);
    };
  },
  pdeco(g, S, hp) {
    const tc = g.tc;
    void hp;
    return (c, w, h) => {
      c.fillStyle = INTERIOR;
      c.fillRect(w * 0.3 - 1, h * 0.5, 2, 12);
      c.fillRect(w * 0.7 - 1, h * 0.5, 2, 12);
      hoplonLocal(c, tc, w * 0.5, h * 0.22, 5);
    };
  },
  pillarTop(g, S, hp, A) {
    const pe = S.pe;
    const d = 0.07;
    g.box(-pe - d, -pe - d, pe + d, pe + d, hp - 7, hp, MARBLE, { ao: false, topMat: { col: '#cfc9b8' } });
    pyramidRoof(g, { x0: -pe + 0.04, y0: -pe + 0.04, x1: pe - 0.04, y1: pe - 0.04, zb: hp + 3, za: hp + 34, mat: TILE, ov: 0.06, th: 2.4, edge: TILE_EDGE, finial: false });
    banner(g, 0, 0, hp + 30, 22, { w: 13, h: 18, pole: true });
    if (A.n >= 2) pennant(g, pe * 0.7, pe * 0.7, hp + 6, 14, { len: 15, h: 7, symbol: false, knob: GOLD });
  },
};

const SP_GG = {
  ...FRANK_GG, ...SP_RAMP,
  faceExtra: null, faceDeco: null,
  pw: 0.5, ev: 0.62, ht: 92, hc: 66, archW: 26, archH: 42, doorW: 3.4, gPitch: 0.3,
  gateMark(g, S, st) {
    const tc = g.tc;
    return (c, w, h) => {
      if (st < 3) return;
      c.fillStyle = INTERIOR;
      c.fillRect(w * 0.5 - 1, h * 0.52, 2, 12);
      hoplonLocal(c, tc, w * 0.5, h * 0.22, 8);
    };
  },
  centerDeco(g, S, st, arch) {
    const tc = g.tc;
    return (c, w, h) => {
      arch(c, w, h);
      if (st >= 3) lambdaDisc(c, tc, w / 2, h * 0.1, 5);
    };
  },
  gateTop(g, S, ax, ht, hc, pw, ev) {
    for (const [u0, u1] of [[-S.R, -pw], [pw, S.R]]) {
      const [x0, y0, x1, y1] = uvRect(ax, u0 + 0.09, -ev + 0.12, u1 - 0.09, ev - 0.12);
      pyramidRoof(g, { x0, y0, x1, y1, zb: ht + 3, za: ht + 40, mat: TILE, ov: 0.05, th: 2.5, edge: TILE_EDGE, finial: false });
    }
    const [bx, by] = uvPt(ax, -(S.R + pw) / 2, 0);
    const [fx, fy] = uvPt(ax, (S.R + pw) / 2, 0);
    banner(g, bx, by, ht + 34, 24, { w: 13, h: 18, pole: true });
    banner(g, fx, fy, ht + 34, 24, { w: 13, h: 18, pole: true });
    const [cx, cy] = uvPt(ax, 0, 0);
    pennant(g, cx, cy, hc + 10, 18, { len: 18, h: 8, symbol: false, knob: GOLD });
  },
};

function wall(g) {
  if (g.mode === 'plan') return;
  wallPiece(g, SP_WALL);
}
wall.custom = true;
wall.noFlag = true;
function gate(g) {
  if (g.mode === 'plan') return;
  gatePiece(g, SP_GATE);
}
gate.custom = true;
gate.noFlag = true;
function rampart(g) {
  if (g.mode === 'plan') return;
  wallPiece(g, SP_RAMP);
}
rampart.custom = true;
rampart.noFlag = true;
function greatGate(g) {
  if (g.mode === 'plan') return;
  gatePiece(g, SP_GG);
}
greatGate.custom = true;
greatGate.noFlag = true;

export const MORE = {
  archery, stable, forge, tower, siege, dock, mill, lumber, mining, great_house: greatHouse, slingtower, countersiege, outpost, bastion,
  wall, gate, rampart, great_gate: greatGate,
};
void [plankPile, scaffold, leanRoof, WOOD, tone, hayBale, amphora, archDeco, boxUV, statue, palmette, bollard, MARBLE];
