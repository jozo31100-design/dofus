// Bâtiments égyptiens (suite) : greniers à coupoles et moulin, scierie de troncs de palmier, camp minier, champ des archers,
// écurie des chars, forge de Ptah, tour de guet, tour à frondes, atelier de siège, port du Nil aux barques de papyrus,
// maison de vie médicale, grande villa, chevalet de contre-siège. Briques crues enduites de chaux, toits-terrasses de roseaux,
// palmiers, jarres. Couleurs d'équipe : frises, auvents, oriflammes au bout de perches dorées.
// Contrat de building-egypt.js : plan / ombre / peinture, quatre stades de chantier.
import { tone, rgba, ink, RX, RY, mulCol } from './building-gfx.js';
import { scaffoldBox, stonePile, plankPile, doorLocal, windowLocal, crenels, railFence, stakes, linePts, stick } from './building-parts.js';
import {
  pennant, barrel, sack, crate, weaponRack, target, logPile, sawhorse, stumpAxe, cart, anvil, glow, smoke, millstone, trough, hayBale,
  debris,
} from './building-props.js';
import { horse } from './building-fauna.js';
import { ram, catapultFrame } from './building-gauls.js';
import { amphora as amph, bollard, netRack, boatHull, rope, cauldron } from './building-civic.js';
import {
  SAND, SAND_L, SAND_D, BRICK, PLASTER, DARK, GOLD, GOLD_D, LAPIS, TURQ, RED,
  glyphBand, winged, teamFrieze, cornice, frustum, column, palm, pool,
} from './building-egypt-parts.js';

const PI = Math.PI;
const TOP = { col: '#cdb07a' };
const TOP_L = { col: '#e4cf98' };
const REED = { col: '#b39350' };
const REED_TOP = { col: '#c9ab64' };
const COPPER = '#c4703c';

const items = (list) => {
  list.sort((a, b) => a.d - b.d);
  for (const it of list) it.f();
};
const kOf = (st, a = 0.4, b = 0.8) => (st === 1 ? a : st === 2 ? b : 1);
const flag = (g, x, y, z0, h, len = 17) => pennant(g, x, y, z0, h, { symbol: false, len, h: 8, poleCol: '#c9a13a', knob: GOLD });
const dep = (x, y) => x + y;

/** Jarre de terre cuite. */
function jar(g, x, y, z = 0, s = 1, col) {
  amph(g, x, y, z, s * 0.95, col || '#b86a3a');
}

/** Bande de lapis peinte sous une corniche (repère local). */
function lapisBand(c, w, v, hh = 1.6) {
  c.fillStyle = LAPIS;
  c.fillRect(0, v, w, hh);
}

/**
 * Coupole de briques crues (grenier) sur tambour cylindrique : assises en arcs, enduit clair, ouverture de chargement.
 * kScale : avancement du chantier.
 */
function dome(g, x, y, r, z0, H, o = {}) {
  if (g.mode === 'plan') {
    g.planCircle(x, y, r);
    return;
  }
  if (g.mode === 'shadow') {
    g.shadowCone(x, y, r, z0, z0 + H);
    return;
  }
  if (!g.drawing || H <= 0) return;
  const c = g.ctx;
  const col = o.col || '#d3a670';
  const [X, Y] = g.P(x, y, 0);
  const rx = r * RX;
  const ry = r * RY;
  const top = Y - z0 - H;
  const path = () => {
    c.beginPath();
    c.moveTo(X - rx, Y - z0);
    c.bezierCurveTo(X - rx, Y - z0 - H * 0.78, X - rx * 0.4, top, X, top);
    c.bezierCurveTo(X + rx * 0.4, top, X + rx, Y - z0 - H * 0.78, X + rx, Y - z0);
    c.ellipse(X, Y - z0, rx, ry, 0, 0, PI);
    c.closePath();
  };
  c.save();
  path();
  c.clip();
  c.fillStyle = col;
  c.fillRect(X - rx - 2, top - 2, rx * 2 + 4, H + ry + 4);
  // assises : arcs concentriques
  c.strokeStyle = 'rgba(90,55,25,0.3)';
  c.lineWidth = 0.8;
  for (let i = 1; i < 7; i++) {
    const t = i / 7;
    const zz = Y - z0 - H * t;
    const k = Math.sqrt(Math.max(0, 1 - Math.pow(t, 2.3)));
    c.beginPath();
    c.ellipse(X, zz, rx * k, ry * k * 0.9, 0, 0.05, PI - 0.05);
    c.stroke();
  }
  // lumière nord-ouest
  const hl = c.createRadialGradient(X - rx * 0.4, Y - z0 - H * 0.6, 1, X - rx * 0.4, Y - z0 - H * 0.6, rx * 1.1);
  hl.addColorStop(0, 'rgba(255,238,190,0.42)');
  hl.addColorStop(1, 'rgba(255,238,190,0)');
  c.fillStyle = hl;
  c.fillRect(X - rx - 2, top - 2, rx * 2 + 4, H + ry + 4);
  c.globalCompositeOperation = 'multiply';
  c.fillStyle = g.roundShade(X, rx, 0.58);
  c.fillRect(X - rx - 2, top - 2, rx * 2 + 4, H + ry + 4);
  c.restore();
  path();
  c.strokeStyle = ink(col, 0.6);
  c.lineWidth = 1;
  c.stroke();
  // ouverture de chargement en haut
  if (o.hole !== false) {
    c.fillStyle = '#3a2614';
    c.beginPath();
    c.ellipse(X, top + 1.6, rx * 0.16, ry * 0.12, 0, 0, 2 * PI);
    c.fill();
  }
  // porte basse
  if (o.door) {
    c.fillStyle = '#2b1d13';
    c.beginPath();
    c.moveTo(X + rx * 0.28 - 3, Y - z0 + ry * 0.92);
    c.lineTo(X + rx * 0.28 - 3, Y - z0 + ry * 0.92 - 7);
    c.quadraticCurveTo(X + rx * 0.28, Y - z0 + ry * 0.92 - 11, X + rx * 0.28 + 3, Y - z0 + ry * 0.92 - 7);
    c.lineTo(X + rx * 0.28 + 3, Y - z0 + ry * 0.92);
    c.closePath();
    c.fill();
  }
}

/**
 * Pavillon ouvert : murs de briques au fond (−y) et à gauche (−x), poteaux de troncs de palmier devant, toit-terrasse de roseaux.
 * o : { x0, y0, x1, y1, h, posts: [nx, ny], backDeco, sideDeco, ov, frieze }
 */
function pavilion(g, o) {
  const st = g.stage;
  const tc = g.tc;
  const { x0, y0, x1, y1 } = o;
  const k = kOf(st, 0.42, 1);
  const h = o.h;
  const t = 0.1;
  const ov = o.ov ?? 0.1;
  g.box(x0, y0, x1, y0 + t, 0, h * k, BRICK, {
    topMat: TOP,
    decoL: st >= 2 ? (c, w, hh) => { o.backDeco?.(c, w, hh); lapisBand(c, w, hh * 0.08); } : null,
  });
  g.box(x0, y0 + t, x0 + t, y1, 0, h * k, BRICK, { topMat: TOP, decoR: st >= 2 ? o.sideDeco : null });
  if (o.inside) o.inside();
  const [nx, ny] = o.posts || [4, 4];
  const ps = [];
  for (let i = 0; i < nx; i++) ps.push([x0 + 0.12 + ((x1 - x0 - 0.24) * i) / Math.max(1, nx - 1), y1 - 0.06]);
  for (let i = 1; i < ny; i++) ps.push([x1 - 0.06, y1 - 0.12 - ((y1 - y0 - 0.3) * i) / Math.max(1, ny - 1)]);
  ps.sort((a, b) => dep(...a) - dep(...b));
  for (const [x, y] of ps) g.post(x, y, 0, h * kOf(st, 0.5, 1), '#9a7a4a', 3.3);
  if (st === 1) return;
  if (st === 2) {
    // poutres maîtresses posées, toit à moitié couvert
    g.beam(x0, y1 - 0.06, h, x1, y1 - 0.06, h, '#8a6a42', 3);
    g.beam(x1 - 0.06, y0, h, x1 - 0.06, y1, h, '#8a6a42', 3);
    g.box(x0 - ov, y0 - ov, (x0 + x1) / 2, y1 + ov, h, h + 4, REED, { ao: false, topMat: REED_TOP });
    return;
  }
  g.box(x0 - ov, y0 - ov, x1 + ov, y1 + ov, h, h + 4, REED, {
    ao: false,
    topMat: REED_TOP,
    decoL: (c, w, hh) => {
      c.fillStyle = tc.main;
      c.fillRect(0, hh - 2.4, w, 2.4);
      c.fillStyle = GOLD;
      c.fillRect(0, hh - 2.9, w, 0.6);
    },
  });
}

/** Bandeau d'équipe sur le mur arrière. */
const backFrieze = (tc) => (c, w, hh) => teamFrieze(c, tc, 0, w, hh * 0.2, 3.6);

// ---------------------------------------------------------------------------
// Moulin : greniers à coupoles et meule
// ---------------------------------------------------------------------------

function mill(g) {
  if (g.mode === 'plan') return g.planRect(-0.95, -0.95, 0.95, 0.95);
  const st = g.stage;
  const tc = g.tc;
  const list = [];
  const gran = (x, y, r, hd, hdome, d, door) => ({
    d,
    f: () => {
      const kd = kOf(st, 0.4, 1);
      g.cyl(x, y, r, 0, hd * kd, { col: '#d6aa74' }, { ao: true });
      if (st >= 2) {
        g.cyl(x, y, r * 1.02, hd * 0.72, hd * 0.8, { col: LAPIS }, { ao: false });
        dome(g, x, y, r, hd, st === 2 ? hdome * 0.3 : hdome, { door });
      }
    },
  });
  list.push({ d: -2, f: () => palm(g, -0.88, 0.78, 50, 2) });
  list.push(gran(-0.42, -0.42, 0.43, 18, 28, -0.8, true));
  list.push(gran(0.42, -0.5, 0.33, 15, 22, -0.1));
  list.push(gran(-0.55, 0.38, 0.3, 14, 20, -0.17));
  if (st >= 2) {
    // échelle d'accès à l'ouverture de chargement
    list.push({ d: 0.3, f: () => { g.beam(-0.1, -0.02, 0, -0.2, -0.3, 40, '#8a6a42', 1.6); g.beam(0.0, 0.05, 0, -0.1, -0.22, 40, '#8a6a42', 1.6); } });
  }
  if (st === 3) {
    list.push({ d: 1.0, f: () => millstone(g, 0.45, 0.42, 0, 0.2, 5) });
    list.push({ d: 1.1, f: () => sack(g, 0.78, 0.15, 0, { s: 0.9, col: '#e0cc9c' }) });
    list.push({ d: 1.2, f: () => sack(g, 0.72, 0.7, 0, { s: 0.85, col: '#d8c08a' }) });
    list.push({ d: 1.0, f: () => jar(g, 0.12, 0.72) });
    list.push({ d: 0.8, f: () => flag(g, 0.85, -0.85, 0, 50, 17) });
    list.push({
      d: 0.6,
      f: () => g.box(0.05, -0.15, 0.3, 0.1, 0, 5, PLASTER, { ao: false, quick: true, topMat: TOP_L }),
    });
  }
  if (st === 1) list.push({ d: 2, f: () => stonePile(g, 0.7, 0.7, 5, '#c29563') });
  void tc;
  items(list);
}
mill.found = { stone: false };

// ---------------------------------------------------------------------------
// Scierie : troncs de palmier, scie à main, pavillon de roseaux
// ---------------------------------------------------------------------------

function lumber(g) {
  if (g.mode === 'plan') return g.planRect(-0.95, -0.95, 0.95, 0.95);
  const st = g.stage;
  const tc = g.tc;
  const list = [];
  list.push({ d: -2, f: () => palm(g, 0.8, -0.8, 54, 3) });
  list.push({
    d: -1,
    f: () => pavilion(g, {
      x0: -0.9, y0: -0.9, x1: 0.25, y1: 0.0, h: 28, posts: [3, 3], backDeco: backFrieze(tc),
      inside: () => { if (st >= 2) logPile(g, -0.2, -0.45, 'x', [4, 3, 2], 0.95, 3); },
    }),
  });
  if (st === 3) {
    list.push({ d: 0.9, f: () => logPile(g, 0.68, -0.35, 'y', [3, 2, 1], 0.72, 2.8) });
    list.push({ d: 1.0, f: () => sawhorse(g, 0.3, 0.55, 'x') });
    list.push({ d: 1.1, f: () => stumpAxe(g, -0.42, 0.62) });
    list.push({ d: 1.0, f: () => debris(g, -0.05, 0.75, 10, ['#e0c38e', '#c9a46c']) });
    list.push({ d: 1.3, f: () => flag(g, -0.8, 0.5, 0, 46, 17) });
    list.push({ d: 1.2, f: () => jar(g, 0.75, 0.75, 0, 0.9) });
  }
  if (st === 1) list.push({ d: 2, f: () => plankPile(g, 0.5, 0.5, 'x', 3, 0.5) });
  items(list);
}
lumber.found = { stone: false };

// ---------------------------------------------------------------------------
// Camp minier : hutte de briques, tas de minerai, chariot, paniers
// ---------------------------------------------------------------------------

function mining(g) {
  if (g.mode === 'plan') return g.planRect(-0.95, -0.95, 0.95, 0.95);
  const st = g.stage;
  const tc = g.tc;
  const list = [];
  const k = kOf(st, 0.42, 1);
  list.push({ d: -2, f: () => palm(g, -0.85, 0.78, 48, 1) });
  list.push({
    d: -1,
    f: () => {
      g.box(-0.92, -0.9, 0.1, -0.05, 0, 24 * k, BRICK, {
        topMat: TOP,
        decoL: (c, w, h) => { if (st >= 2) { teamFrieze(c, tc, 0, w, h * 0.14, 3.6); doorLocal(c, w * 0.62, h, 9, 14, { leaf: false }); } },
        decoR: (c, w, h) => { if (st >= 2) glyphBand(c, 3, w - 3, h * 0.4, { rows: 1, size: 3.4, a: 0.55 }); },
      });
      if (st >= 2) g.box(-0.97, -0.95, 0.15, 0.0, 24, 27, { col: '#d9bd86' }, { ao: false, quick: true, topMat: TOP_L });
    },
  });
  // galerie creusée : entrée de mine avec cadre de bois
  list.push({
    d: 0.1,
    f: () => {
      g.box(0.3, -0.85, 0.95, -0.25, 0, 16 * k + 4, SAND_D, { topMat: { col: '#d8c08a' } });
      if (st >= 2) {
        g.faceL(0.42, 0.84, -0.25, 0, 13, DARK, { k: 0.9, line: false });
        g.post(0.42, -0.25, 0, 14, '#7a5634', 2.6);
        g.post(0.84, -0.25, 0, 14, '#7a5634', 2.6);
        g.beam(0.42, -0.25, 14, 0.84, -0.25, 14, '#7a5634', 2.6);
      }
    },
  });
  if (st === 3) {
    list.push({ d: 0.9, f: () => cart(g, 0.6, 0.3, 'y', 'ore') });
    list.push({ d: 0.8, f: () => stonePile(g, -0.3, 0.5, 6, '#5fa386') }); // malachite
    list.push({ d: 0.85, f: () => stonePile(g, -0.6, 0.65, 4, COPPER) });
    list.push({ d: 1.1, f: () => sack(g, -0.05, 0.8, 0, { s: 0.85, col: '#b9a57a' }) });
    list.push({ d: 1.2, f: () => flag(g, 0.85, 0.8, 0, 44, 16) });
    list.push({
      d: 1.0,
      f: () => {
        if (!g.drawing) return;
        const c = g.ctx;
        const [px, py] = g.P(0.25, 0.7, 0);
        stick(c, px, py, px - 3, py - 16, '#7a5634', 1.3);
        c.fillStyle = '#9a9ea4';
        c.beginPath();
        c.moveTo(px - 8, py - 13);
        c.quadraticCurveTo(px - 3, py - 19, px + 3, py - 15);
        c.lineTo(px + 2.5, py - 14.2);
        c.quadraticCurveTo(px - 3, py - 17, px - 7.6, py - 12.4);
        c.closePath();
        c.fill();
      },
    });
  }
  if (st === 1) list.push({ d: 2, f: () => stonePile(g, 0.5, 0.6, 5, '#c29563') });
  items(list);
}
mining.found = { stone: false };

// ---------------------------------------------------------------------------
// Champ des archers : cour, cibles de paille, portique à colonnes, râteliers d'arcs
// ---------------------------------------------------------------------------

function archery(g) {
  if (g.mode === 'plan') return g.planRect(-1.4, -1.4, 1.4, 1.4);
  const st = g.stage;
  const tc = g.tc;
  const k = kOf(st, 0.4, 0.85);
  const list = [];
  list.push({ d: -3, f: () => palm(g, -1.25, -1.2, 56, 0) });
  list.push({
    d: -2,
    f: () => {
      g.box(-1.4, -1.4, 1.4, -1.22, 0, 30 * k, BRICK, {
        topMat: TOP,
        decoL: (c, w, h) => {
          if (st < 2) return;
          teamFrieze(c, tc, 0, w, h * 0.1, 4);
          glyphBand(c, 3, w - 3, h * 0.5, { rows: 1, size: 4.4, a: 0.6 });
          // cibles peintes en niches
          for (const f of [0.2, 0.5, 0.8]) {
            c.fillStyle = '#f0e6cc';
            c.beginPath();
            c.arc(w * f, h * 0.7, 4.4, 0, 2 * PI);
            c.fill();
            c.fillStyle = RED;
            c.beginPath();
            c.arc(w * f, h * 0.7, 2.8, 0, 2 * PI);
            c.fill();
            c.fillStyle = '#f0e6cc';
            c.beginPath();
            c.arc(w * f, h * 0.7, 1.2, 0, 2 * PI);
            c.fill();
          }
        },
      });
      if (st >= 2) cornice(g, -1.4, -1.4, 1.4, -1.22, 30 * k, { col: '#d8b870' });
    },
  });
  // portique de droite à colonnes lotiformes
  list.push({
    d: 0.4,
    f: () => {
      g.box(1.0, -1.22, 1.4, 1.1, 0, 22 * k, BRICK, { topMat: TOP, decoR: (c, w, h) => { if (st >= 2) weaponRackPaint(c, w, h, tc); } });
    },
  });
  if (st >= 2) {
    list.push({
      d: 1.6,
      f: () => {
        g.box(0.5, -1.0, 1.05, 1.1, 27, 33, SAND_L, { topMat: TOP_L, decoL: (c, w) => teamFrieze(c, tc, 0, w, 0.6, 3.2) });
        if (st === 3) cornice(g, 0.5, -1.0, 1.05, 1.1, 33, { stripe: false, col: '#d8b870' });
      },
    });
    for (const y of [-0.85, -0.25, 0.35, 0.95]) list.push({ d: 0.5 + y + 0.6, f: () => column(g, 0.78, y, 0, 27, 0.075) });
  }
  if (st === 3) {
    list.push({ d: -0.5, f: () => target(g, -0.65, -0.65, 7) });
    list.push({ d: -0.2, f: () => target(g, 0.1, -0.7, 7.5) });
    list.push({ d: 0.6, f: () => target(g, -0.85, 0.05, 6.5) });
    list.push({ d: 1.4, f: () => weaponRack(g, -0.4, 0.95, 'x', 0.8, { n: 6, bows: true }) });
    list.push({ d: 1.5, f: () => jar(g, -1.15, 0.95) });
    list.push({ d: 1.6, f: () => crate(g, 0.3, 1.1) });
    list.push({ d: 1.7, f: () => flag(g, -1.25, 1.2, 0, 50, 18) });
  }
  if (st === 1) list.push({ d: 4, f: () => scaffoldBox(g, -1.4, -1.4, 1.4, -1.22, 26, { step: 0.5 }) });
  if (st === 2) list.push({ d: 4, f: () => plankPile(g, -0.2, 1.0, 'x', 3, 0.6) });
  items(list);
}
archery.found = { stone: false };

/** Arcs et carquois peints sur un mur (repère local). */
function weaponRackPaint(c, w, h, tc) {
  teamFrieze(c, tc, 0, w, h * 0.12, 3.4);
  c.strokeStyle = '#5a3a1c';
  c.lineWidth = 1;
  for (let u = 6; u < w - 4; u += 9) {
    c.beginPath();
    c.arc(u, h * 0.62, 4.2, -1.1, 1.1);
    c.stroke();
  }
}

// ---------------------------------------------------------------------------
// Écurie des chars : auvent, chevaux à plumets, char au repos, râtelier de foin
// ---------------------------------------------------------------------------

function chariotProp(g, x, y) {
  const tc = g.tc;
  if (g.mode === 'shadow') {
    g.shadowBox(x - 0.3, y - 0.22, x + 0.3, y + 0.22, 0, 22);
    return;
  }
  if (!g.drawing) return;
  // timon et caisse
  g.beam(x - 0.2, y, 7, x - 0.75, y, 9, '#7a5634', 2.2);
  for (const dy of [-0.26, 0.26]) wheelOf(g, x + 0.02, y + dy, 8);
  g.box(x - 0.24, y - 0.2, x + 0.24, y + 0.2, 7, 15, { col: '#c9a13a' }, {
    ao: false,
    topMat: { col: '#a8822c' },
    decoL: (c, w, h) => { c.fillStyle = tc.main; c.fillRect(0, h * 0.35, w, h * 0.3); c.fillStyle = LAPIS; c.fillRect(0, h * 0.75, w, 1.4); },
    decoR: (c, w, h) => { c.fillStyle = tc.main; c.fillRect(0, h * 0.35, w, h * 0.3); },
  });
  g.post(x + 0.22, y - 0.17, 15, 23, '#c9a13a', 1.4);
  g.post(x + 0.22, y + 0.17, 15, 23, '#c9a13a', 1.4);
  g.beam(x + 0.22, y - 0.17, 23, x + 0.22, y + 0.17, 23, '#c9a13a', 1.4);
}

function wheelOf(g, x, y, r) {
  const c = g.ctx;
  const [px, py] = g.P(x, y, 0);
  c.save();
  c.translate(px, py - r);
  c.scale(0.9, 1);
  c.strokeStyle = '#6a4526';
  c.lineWidth = 2;
  c.beginPath();
  c.arc(0, 0, r, 0, 2 * PI);
  c.stroke();
  c.strokeStyle = '#a07a44';
  c.lineWidth = 0.7;
  c.stroke();
  c.lineWidth = 0.8;
  c.beginPath();
  for (let i = 0; i < 3; i++) {
    const a = (i * PI) / 3 + 0.3;
    c.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    c.lineTo(-Math.cos(a) * r, -Math.sin(a) * r);
  }
  c.stroke();
  c.fillStyle = GOLD;
  c.beginPath();
  c.arc(0, 0, 1.3, 0, 2 * PI);
  c.fill();
  c.restore();
}

function stable(g) {
  if (g.mode === 'plan') return g.planRect(-1.4, -1.4, 1.4, 1.4);
  const st = g.stage;
  const tc = g.tc;
  const list = [];
  list.push({ d: -3, f: () => palm(g, 1.25, -1.25, 56, 1) });
  list.push({
    d: -2,
    f: () => pavilion(g, {
      x0: -1.4, y0: -1.4, x1: 1.4, y1: -0.35, h: 30, posts: [6, 2], backDeco: (c, w, h) => { backFrieze(tc)(c, w, h); glyphBand(c, 3, w - 3, h * 0.55, { rows: 1, size: 4, a: 0.55 }); },
      inside: () => {
        if (st >= 2) {
          horse(g, -0.8, -0.85, { col: '#8a5530', dir: 1 });
          horse(g, -0.1, -0.88, { col: '#c9a880', dir: 1, mane: '#2a1c12' });
          horse(g, 0.7, -0.85, { col: '#6a4a30', dir: 1 });
        }
      },
    }),
  });
  if (st === 3) {
    list.push({ d: 0.8, f: () => railFence(g, [[-1.4, 0.3], [-1.4, 1.3], [-0.2, 1.4]], 9) });
    list.push({ d: 1.0, f: () => chariotProp(g, 0.75, 0.55) });
    list.push({ d: 0.6, f: () => horse(g, -0.75, 0.45, { col: '#b08a5c', dir: -1, mane: '#2a1c12' }) });
    list.push({ d: 1.3, f: () => trough(g, -0.1, 0.9, 'x', 0.55) });
    list.push({ d: 1.4, f: () => hayBale(g, 0.3, 1.2, 0, 'x') });
    list.push({ d: 1.5, f: () => hayBale(g, 0.55, 1.22, 0, 'x') });
    list.push({ d: 1.8, f: () => flag(g, 1.25, 1.2, 0, 52, 18) });
    list.push({ d: 1.6, f: () => jar(g, 1.1, 0.95) });
  }
  if (st === 1) list.push({ d: 4, f: () => plankPile(g, 0, 0.6, 'x', 4, 0.6) });
  if (st === 2) list.push({ d: 4, f: () => hayBale(g, 0.3, 0.9, 0, 'x') });
  items(list);
}
stable.found = { stone: false };

// ---------------------------------------------------------------------------
// Forge de Ptah : atelier, four à coupole, enclume, lingots de cuivre
// ---------------------------------------------------------------------------

function forge(g) {
  if (g.mode === 'plan') return g.planRect(-1.4, -1.4, 1.4, 1.4);
  const st = g.stage;
  const tc = g.tc;
  const k = kOf(st, 0.4, 0.85);
  const list = [];
  list.push({ d: -3, f: () => palm(g, 1.25, -1.25, 54, 2) });
  list.push({
    d: -2,
    f: () => {
      g.box(-1.4, -1.4, 0.4, -0.25, 0, 34 * k, BRICK, {
        topMat: TOP,
        decoL: (c, w, h) => {
          if (st < 2) return;
          teamFrieze(c, tc, 0, w, h * 0.1, 4);
          doorLocal(c, w * 0.72, h, 10, 18, { leaf: false });
          glyphBand(c, 3, w * 0.55, h * 0.55, { rows: 1, size: 4, a: 0.6 });
        },
        decoR: (c, w, h) => { if (st >= 2) glyphBand(c, 3, w - 3, h * 0.45, { rows: 1, size: 3.8, a: 0.55 }); },
      });
      if (st >= 2) cornice(g, -1.4, -1.4, 0.4, -0.25, 34 * k, { col: '#d8b870' });
    },
  });
  // four à coupole
  list.push({
    d: -0.3,
    f: () => {
      g.cyl(0.95, -0.55, 0.42, 0, 16 * k, { col: '#c4905a' }, { ao: true });
      if (st >= 2) dome(g, 0.95, -0.55, 0.42, 16, st === 2 ? 8 : 26, { col: '#c98f58', hole: false });
      if (st === 3) {
        // cheminée et braise
        g.cyl(0.95, -0.55, 0.11, 40, 52, { col: '#b07a48' }, { ao: false });
        glow(g, 0.95, -0.12, 8, 9);
        smoke(g, 0.95, -0.55, 54, { h: 26, n: 6 });
      }
    },
  });
  if (st === 3) {
    list.push({ d: 0.7, f: () => anvil(g, -0.4, 0.35) });
    list.push({
      d: 0.9,
      f: () => {
        // lingots de cuivre empilés
        g.box(0.2, 0.25, 0.5, 0.42, 0, 4, { col: COPPER }, { ao: false, quick: true, topMat: { col: '#e08850' } });
        g.box(0.26, 0.28, 0.46, 0.4, 4, 7, { col: COPPER }, { ao: false, quick: true, topMat: { col: '#e8955a' } });
      },
    });
    list.push({ d: 1.1, f: () => trough(g, -0.9, 0.75, 'x', 0.5) });
    list.push({ d: 1.2, f: () => jar(g, 0.9, 0.7) });
    list.push({ d: 1.3, f: () => sack(g, 1.1, 0.35, 0, { s: 0.85, col: '#3e3a36' }) });
    list.push({ d: 1.8, f: () => flag(g, -1.25, 1.2, 0, 50, 18) });
  }
  if (st === 1) list.push({ d: 4, f: () => scaffoldBox(g, -1.4, -1.4, 0.4, -0.25, 26, { step: 0.5 }) });
  if (st === 2) list.push({ d: 4, f: () => stonePile(g, 0.4, 0.6, 5, '#c29563') });
  items(list);
}
forge.found = { stone: true };

// ---------------------------------------------------------------------------
// Tours : tour de guet (2×2) et tour à frondes (2×2)
// ---------------------------------------------------------------------------

function towerBody(g, H, win) {
  const st = g.stage;
  const tc = g.tc;
  const k = kOf(st, 0.35, 0.8);
  frustum(g, -0.62, -0.62, 0.62, 0.62, 0, H * k, 0.15, BRICK, {
    plan: true,
    topMat: { col: '#d8c08a' },
    decoL: (c, w, h, pad) => {
      if (st < 2) return;
      teamFrieze(c, tc, 0, w, (pad || 0) + h * 0.12, 4);
      c.fillStyle = '#2b1d13';
      for (const f of win) c.fillRect(w * f[0] - 1.3, (pad || 0) + h * f[1], 2.6, 8);
      doorLocal(c, w * 0.5, h + (pad || 0), 8, 13, { leaf: false });
      glyphBand(c, 4, w - 4, (pad || 0) + h * 0.85, { rows: 1, size: 3.8, a: 0.5 });
    },
    decoR: (c, w, h, pad) => {
      if (st < 2) return;
      teamFrieze(c, tc, 0, w, (pad || 0) + h * 0.12, 4);
      c.fillStyle = '#2b1d13';
      for (const f of win) c.fillRect(w * f[0] - 1.3, (pad || 0) + h * f[1], 2.6, 8);
    },
  });
  return k;
}

function tower(g) {
  if (g.mode === 'plan') return g.planRect(-0.62, -0.62, 0.62, 0.62);
  const st = g.stage;
  const tc = g.tc;
  const H = 104;
  const k = towerBody(g, H, [[0.3, 0.45], [0.7, 0.45], [0.5, 0.65]]);
  if (st >= 2) {
    const z = H * k;
    // chambre haute de guet à cornes de roseaux
    g.box(-0.45, -0.45, 0.45, 0.45, z, z + 4, SAND_L, { ao: false, topMat: TOP_L, decoL: (c, w) => lapisBand(c, w, 0.4, 1.6) });
    crenels(g, -0.45, -0.45, 0.45, 0.45, z + 4, { col: '#e1c690' }, { t: 0.09, h: 7, mw: 0.16, gap: 0.12, hp: 2 });
  }
  if (st === 3) {
    flag(g, 0, 0, H + 6, 34, 19);
    g.post(-0.3, 0.3, H + 6, H + 22, '#8a6a42', 1.6);
  }
  if (st === 1) scaffoldBox(g, -0.62, -0.62, 0.62, 0.62, 52, { step: 0.5 });
  if (st === 2) stonePile(g, 0.85, 0.8, 4, '#c29563');
  void tc;
}
tower.found = { stone: true };

function slingtower(g) {
  if (g.mode === 'plan') return g.planRect(-0.62, -0.62, 0.62, 0.62);
  const st = g.stage;
  const tc = g.tc;
  const H = 86;
  const k = towerBody(g, H, [[0.3, 0.42], [0.7, 0.42]]);
  const z = H * k;
  if (st >= 2) {
    g.box(-0.5, -0.5, 0.5, 0.5, z, z + 4, SAND_L, { ao: false, topMat: TOP_L });
    crenels(g, -0.5, -0.5, 0.5, 0.5, z + 4, { col: '#e1c690' }, { t: 0.09, h: 6, mw: 0.16, gap: 0.12, hp: 2 });
  }
  if (st === 3) {
    const zt = H + 4;
    // chevalet en A, long bras de fronde à poche, contrepoids de pierres
    g.post(-0.25, -0.3, zt, zt + 34, '#7a5634', 3);
    g.post(-0.25, 0.3, zt, zt + 34, '#7a5634', 3);
    g.beam(-0.25, 0, zt + 32, 0.55, 0.12, zt + 54, '#8a6440', 3.4);
    g.beam(-0.25, 0, zt + 32, -0.42, -0.05, zt + 14, '#8a6440', 3.4);
    g.box(-0.55, -0.12, -0.3, 0.1, zt + 4, zt + 14, { col: '#8a7a64' }, { ao: false, quick: true, topMat: { col: '#a09078' } });
    if (g.drawing) {
      const c = g.ctx;
      const [sx, sy] = g.P(0.55, 0.12, zt + 54);
      c.strokeStyle = '#d8c9a0';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(sx, sy);
      c.quadraticCurveTo(sx + 5, sy + 10, sx + 1, sy + 14);
      c.stroke();
      c.fillStyle = '#9a9488';
      c.beginPath();
      c.arc(sx + 1, sy + 15, 2.6, 0, 2 * PI);
      c.fill();
    }
    flag(g, 0.4, -0.4, zt, 22, 15);
    stonePile(g, 0.85, 0.78, 6, '#b8b2a4');
  }
  if (st === 1) scaffoldBox(g, -0.62, -0.62, 0.62, 0.62, 46, { step: 0.5 });
  if (st === 2) stonePile(g, 0.85, 0.8, 4, '#c29563');
  void tc;
}
slingtower.found = { stone: true };

// ---------------------------------------------------------------------------
// Atelier de siège (4×4) : pavillon des charpentiers, béliers de troncs, bâtis de catapultes
// ---------------------------------------------------------------------------

function siege(g) {
  if (g.mode === 'plan') return g.planRect(-1.9, -1.9, 1.9, 1.9);
  const st = g.stage;
  const tc = g.tc;
  const list = [];
  list.push({ d: -4, f: () => palm(g, 1.75, -1.7, 58, 2) });
  list.push({
    d: -3,
    f: () => pavilion(g, {
      x0: -1.9, y0: -1.9, x1: 1.5, y1: -0.6, h: 38, posts: [7, 2], ov: 0.12,
      backDeco: (c, w, h) => { backFrieze(tc)(c, w, h); glyphBand(c, 3, w - 3, h * 0.55, { rows: 1, size: 4.4, a: 0.55 }); },
      inside: () => {
        if (st >= 2) { ram(g, -1.3, -1.1); catapultFrame(g, 0.4, -1.15, st === 3); }
      },
    }),
  });
  list.push({
    d: 0,
    f: () => {
      const kk = kOf(st, 0.4, 0.85);
      g.box(1.5, -1.9, 1.9, 1.0, 0, 30 * kk, BRICK, { topMat: TOP, decoR: (c, w, h) => { if (st >= 2) { teamFrieze(c, tc, 0, w, h * 0.12, 4); glyphBand(c, 3, w - 3, h * 0.5, { rows: 1, size: 4, a: 0.55 }); } } });
    },
  });
  if (st === 3) {
    list.push({ d: 0.6, f: () => catapultFrame(g, -0.7, 0.15, true) });
    list.push({ d: 1.4, f: () => ram(g, 0.3, 0.6) });
    list.push({ d: 1.6, f: () => logPile(g, -1.5, 0.9, 'x', [4, 3, 2], 1.1, 3.2) });
    list.push({ d: 1.8, f: () => logPile(g, 0.9, 1.45, 'x', [3, 2], 0.9, 3) });
    list.push({ d: 1.7, f: () => plankPile(g, -0.3, 1.5, 'x', 4, 0.6) });
    list.push({ d: 2.0, f: () => sawhorse(g, -1.0, 1.4, 'x') });
    list.push({ d: 2.2, f: () => jar(g, 1.3, 1.2) });
    list.push({ d: 3.1, f: () => flag(g, -1.75, 1.7, 0, 56, 19) });
    list.push({ d: 3.2, f: () => flag(g, 1.75, 1.7, 0, 56, 19) });
  }
  if (st === 1) list.push({ d: 4, f: () => plankPile(g, 0, 0.9, 'x', 4, 0.8) });
  if (st === 2) list.push({ d: 4, f: () => logPile(g, -0.5, 1.0, 'x', [3, 2], 1.0, 3) });
  items(list);
}
siege.found = { logs: true };

// ---------------------------------------------------------------------------
// Port du Nil (3×3) : quai de pierre, barque de papyrus sur son chevalet, entrepôt, filets
// ---------------------------------------------------------------------------

const QE = 1.42;
const QZ = 7;

function dock(g) {
  const st = g.stage;
  const tc = g.tc;
  if (g.mode === 'plan') return g.planRect(-QE - 0.03, -QE - 0.03, QE + 0.03, QE + 0.03);
  const list = [];
  // quai : gradins de grès
  list.push({
    d: -5,
    f: () => {
      if (g.drawing && st >= 2) {
        const c = g.ctx;
        g.path([g.P(-QE, -QE, 0), g.P(QE, -QE, 0), g.P(QE, QE, 0), g.P(-QE, QE, 0)]);
        c.fillStyle = 'rgba(8,16,30,0.45)';
        c.fill();
      }
      if (st === 1) g.box(-QE, -QE, QE, -0.15, 0, QZ, SAND_D, { topMat: { col: '#d8c08a' }, ao: false });
      else g.box(-QE, -QE, QE, QE, 0, QZ, SAND_D, { topMat: { col: '#d6bf8c' }, ao: false });
    },
  });
  if (st >= 2) {
    // entrepôt de briques à toit-terrasse
    list.push({
      d: -1,
      f: () => {
        g.box(-1.3, -1.3, 0.1, -0.35, QZ, QZ + 26, BRICK, {
          topMat: TOP,
          decoL: (c, w, h) => { teamFrieze(c, tc, 0, w, h * 0.12, 3.6); doorLocal(c, w * 0.7, h, 9, 15, { leaf: false }); },
          decoR: (c, w, h) => glyphBand(c, 3, w - 3, h * 0.45, { rows: 1, size: 3.6, a: 0.55 }),
        });
        if (st === 3) g.box(-1.35, -1.35, 0.15, -0.3, QZ + 26, QZ + 29, { col: '#d9bd86' }, { ao: false, quick: true, topMat: TOP_L });
      },
    });
  }
  list.push({ d: -4, f: () => palm(g, -1.25, 0.6, 52, 3) });
  if (st === 3) {
    list.push({ d: 0.3, f: () => boatHull(g, 0.25, 0.85, QZ, 'x', 1.3, { col: '#d8c47a' }) });
    list.push({ d: 0.6, f: () => netRack(g, [0.95, -0.55], [0.95, 0.25], QZ, 32, { seed: 2 }) });
    list.push({ d: 1.4, f: () => { jar(g, -0.6, 0.45, QZ, 1.1); jar(g, -0.4, 0.62, QZ, 0.95); jar(g, -0.78, 0.68, QZ, 1.0, '#a8602f'); } });
    list.push({ d: 1.7, f: () => { bollard(g, 1.3, -0.9, QZ); bollard(g, 1.3, 0.6, QZ); bollard(g, 0.5, 1.3, QZ); bollard(g, -0.9, 1.3, QZ); } });
    list.push({ d: 1.8, f: () => rope(g, [1.3, 0.6, QZ + 3], [1.62, 0.85, 1], 9, { col: '#c8b888', w: 1.6 }) });
    list.push({ d: 1.6, f: () => { sack(g, 0.85, 0.95, QZ, { s: 0.85, col: '#e0cc9c' }); crate(g, 1.0, 1.15, QZ); } });
    // gerbes de papyrus
    list.push({
      d: 0.8,
      f: () => {
        if (!g.drawing) return;
        const c = g.ctx;
        for (const [x, y] of [[-0.3, 0.05], [-0.15, 0.12]]) {
          const [px, py] = g.P(x, y, QZ);
          c.strokeStyle = '#5a8a3a';
          c.lineWidth = 1.2;
          c.beginPath();
          for (let i = -2; i <= 2; i++) { c.moveTo(px + i * 0.8, py); c.lineTo(px + i * 2.2, py - 14); }
          c.stroke();
          c.strokeStyle = '#c9b870';
          c.lineWidth = 1.6;
          c.beginPath();
          c.moveTo(px - 3, py - 4);
          c.lineTo(px + 3, py - 4);
          c.stroke();
        }
      },
    });
    for (const [x, y] of [[1.3, -1.2], [1.3, 1.25], [-1.3, 1.3]]) list.push({ d: x + y + 0.4, f: () => flag(g, x, y, QZ, 44, 18) });
  } else if (st === 2) {
    list.push({ d: 1.6, f: () => bollard(g, 1.3, 0.6, QZ) });
    list.push({ d: 1.0, f: () => stonePile(g, 0.6, 0.8, QZ === 7 ? 4 : 4, '#c29563') });
  } else if (st === 1) {
    list.push({ d: 1.5, f: () => scaffoldBox(g, -1.0, -1.0, 0.2, 0.1, 30, { sides: 'R' }) });
  }
  items(list);
}
dock.found = { logs: false };
dock.ground = () => {};

// ---------------------------------------------------------------------------
// Maison de vie médicale (3×3) : loggia, jardin de simples, bassin, ankh
// ---------------------------------------------------------------------------

function ankhPaint(c, u, v, s, col = '#c23a2e') {
  c.strokeStyle = col;
  c.lineWidth = 1.3;
  c.beginPath();
  c.ellipse(u, v - s * 0.6, s * 0.3, s * 0.4, 0, 0, 2 * PI);
  c.moveTo(u, v - s * 0.2);
  c.lineTo(u, v + s * 0.7);
  c.moveTo(u - s * 0.4, v);
  c.lineTo(u + s * 0.4, v);
  c.stroke();
}

function herbBed(g, x0, y0, x1, y1, z = 1.5) {
  if (!g.drawing) return;
  g.box(x0, y0, x1, y1, 0, z, { col: '#c4905a' }, { ao: false, quick: true, topMat: { col: '#5a4028' } });
  const c = g.ctx;
  const rnd = g.rng(x0, y0, 7);
  for (let i = 0; i < 14; i++) {
    const [px, py] = g.P(x0 + 0.05 + rnd() * (x1 - x0 - 0.1), y0 + 0.05 + rnd() * (y1 - y0 - 0.1), z);
    c.fillStyle = ['#5c9a3a', '#7aaa48', '#3f7a32'][i % 3];
    c.beginPath();
    c.ellipse(px, py - 2, 1.8, 2.8, 0, 0, 2 * PI);
    c.fill();
    if (i % 5 === 0) {
      c.fillStyle = '#e8c83a';
      c.fillRect(px - 0.5, py - 6, 1.4, 1.4);
    }
  }
}

function infirmary(g) {
  if (g.mode === 'plan') return g.planRect(-1.4, -1.4, 1.4, 1.4);
  const st = g.stage;
  const tc = g.tc;
  const k = kOf(st, 0.4, 0.85);
  const list = [];
  list.push({ d: -3, f: () => palm(g, -1.3, -1.2, 56, 4) });
  list.push({
    d: -2,
    f: () => {
      g.box(-1.4, -1.4, 1.4, -0.3, 0, 30 * k, PLASTER, {
        topMat: TOP_L,
        decoL: (c, w, h) => {
          if (st < 2) return;
          c.fillStyle = 'rgba(180,140,90,0.5)';
          c.fillRect(0, h - 3, w, 3);
          teamFrieze(c, tc, 0, w, h * 0.08, 3.8);
          glyphBand(c, 3, w - 3, h * 0.36, { rows: 1, size: 4, a: 0.6 });
          doorLocal(c, w * 0.5, h, 10, 16, { leaf: false });
          ankhPaint(c, w * 0.16, h * 0.68, 10);
          ankhPaint(c, w * 0.84, h * 0.68, 10);
        },
        decoR: (c, w, h) => { if (st >= 2) glyphBand(c, 3, w - 3, h * 0.4, { rows: 1, size: 4, a: 0.55 }); },
      });
      if (st === 3) cornice(g, -1.4, -1.4, 1.4, -0.3, 30, { col: '#d8b870' });
    },
  });
  if (st >= 2) {
    list.push({
      d: 0.2,
      f: () => {
        g.box(-1.3, -0.3, 1.3, 0.2, 26, 31, SAND_L, { topMat: TOP_L, decoL: (c, w) => teamFrieze(c, tc, 0, w, 0.6, 3.6) });
        if (st === 3) cornice(g, -1.3, -0.3, 1.3, 0.2, 31, { stripe: false, col: '#d8b870' });
      },
    });
    for (const x of [-1.15, -0.6, -0.05, 0.5, 1.05]) list.push({ d: 0.2 + x + 0.6, f: () => column(g, x, 0.08, 0, 26, 0.07) });
  }
  if (st === 3) {
    list.push({ d: 1.0, f: () => herbBed(g, -1.3, 0.55, -0.55, 1.25) });
    list.push({ d: 1.1, f: () => herbBed(g, 0.5, 0.55, 1.3, 1.25) });
    list.push({ d: 1.3, f: () => pool(g, -0.3, 0.75, 0.3, 1.2, 0) });
    list.push({ d: 1.6, f: () => jar(g, 0.0, 0.5, 0, 0.9) });
    list.push({ d: 2.0, f: () => flag(g, -1.3, 1.35, 0, 48, 18) });
    list.push({ d: 2.1, f: () => flag(g, 1.3, 1.35, 0, 48, 18) });
  }
  if (st === 1) list.push({ d: 4, f: () => scaffoldBox(g, -1.4, -1.4, 1.4, -0.3, 26, { step: 0.55 }) });
  if (st === 2) list.push({ d: 4, f: () => plankPile(g, 0.0, 1.0, 'x', 3, 0.6) });
  items(list);
}
infirmary.found = { stone: false };

// ---------------------------------------------------------------------------
// Grande villa (3×3) : étage à loggia, cour-jardin, bassin, petit grenier
// ---------------------------------------------------------------------------

function greatHouse(g) {
  if (g.mode === 'plan') return g.planRect(-1.4, -1.4, 1.4, 1.4);
  const st = g.stage;
  const tc = g.tc;
  const k = kOf(st, 0.4, 0.85);
  const list = [];
  list.push({ d: -3, f: () => palm(g, 1.25, -1.2, 58, 0) });
  list.push({ d: -2.8, f: () => palm(g, -1.3, -0.4, 50, 2) });
  list.push({
    d: -2,
    f: () => {
      g.box(-1.3, -1.35, 1.3, -0.15, 0, 28 * k, PLASTER, {
        topMat: TOP_L,
        decoL: (c, w, h) => {
          if (st < 2) return;
          c.fillStyle = 'rgba(180,140,90,0.5)';
          c.fillRect(0, h - 3, w, 3);
          doorLocal(c, w * 0.5, h, 10, 16, { leaf: false });
          windowLocal(c, w * 0.16, h * 0.46, 3.4, 5, { shutters: false });
          windowLocal(c, w * 0.84, h * 0.46, 3.4, 5, { shutters: false });
          teamFrieze(c, tc, 0, w, h * 0.06, 3.4);
        },
        decoR: (c, w, h) => { if (st >= 2) windowLocal(c, w * 0.5, h * 0.44, 3.4, 5, { shutters: false }); },
      });
    },
  });
  if (st >= 2) {
    list.push({
      d: -1.2,
      f: () => {
        // étage : pièce haute et loggia à deux colonnes
        g.box(-0.9, -1.1, 0.5, -0.4, 28, 28 + 22 * (st === 2 ? 0.6 : 1), PLASTER, {
          topMat: TOP_L,
          decoL: (c, w, h) => { windowLocal(c, w * 0.3, h * 0.45, 3.6, 5.4, { shutters: false }); windowLocal(c, w * 0.7, h * 0.45, 3.6, 5.4, { shutters: false }); teamFrieze(c, tc, 0, w, h * 0.06, 3.2); },
        });
        if (st === 3) cornice(g, -0.9, -1.1, 0.5, -0.4, 50, { stripe: true, col: '#d8b870' });
      },
    });
  }
  if (st === 3) {
    list.push({ d: -0.4, f: () => { column(g, 0.62, -0.25, 28, 50, 0.06); column(g, 1.05, -0.25, 28, 50, 0.06); } });
    // mur de jardin bas et bassin
    list.push({ d: 1.4, f: () => g.box(-1.3, 1.25, 1.3, 1.38, 0, 9, BRICK, { topMat: TOP, ao: false }) });
    list.push({ d: 1.0, f: () => pool(g, -0.7, 0.3, 0.2, 1.0, 0) });
    list.push({ d: 1.2, f: () => herbBed(g, 0.5, 0.45, 1.25, 1.1) });
    list.push({ d: 0.9, f: () => jar(g, -1.15, 0.5) });
    list.push({ d: 1.6, f: () => jar(g, 0.4, 1.12, 0, 0.9) });
    list.push({ d: 2.4, f: () => flag(g, 1.25, 1.3, 0, 52, 19) });
    list.push({ d: 2.2, f: () => palm(g, -1.22, 1.15, 44, 4) });
  }
  if (st === 1) list.push({ d: 4, f: () => scaffoldBox(g, -1.3, -1.35, 1.3, -0.15, 24, { step: 0.55 }) });
  if (st === 2) list.push({ d: 4, f: () => plankPile(g, 0.2, 1.0, 'x', 3, 0.6) });
  items(list);
}
greatHouse.found = { stone: false };

// ---------------------------------------------------------------------------
// Chevalet de contre-siège (3×3) : massif de briques à talus, pieux, chaudrons, oriflammes
// ---------------------------------------------------------------------------

function countersiege(g) {
  if (g.mode === 'plan') return g.planRect(-1.4, -1.4, 1.4, 1.4);
  const st = g.stage;
  const tc = g.tc;
  const k = kOf(st, 0.4, 0.85);
  const list = [];
  list.push({
    d: -2,
    f: () => {
      frustum(g, -1.05, -1.3, 1.05, 0.3, 0, 54 * k, 0.16, BRICK, {
        topMat: { col: '#d8c08a' },
        decoL: (c, w, h, pad) => {
          if (st < 2) return;
          teamFrieze(c, tc, 0, w, (pad || 0) + h * 0.1, 4);
          c.fillStyle = '#2b1d13';
          for (const f of [0.2, 0.4, 0.6, 0.8]) c.fillRect(w * f - 1.2, (pad || 0) + h * 0.46, 2.4, 9);
        },
        decoR: (c, w, h, pad) => { if (st >= 2) { teamFrieze(c, tc, 0, w, (pad || 0) + h * 0.1, 4); glyphBand(c, 3, w - 3, (pad || 0) + h * 0.5, { rows: 1, size: 4, a: 0.5 }); } },
      });
      if (st >= 2) crenels(g, -0.9, -1.15, 0.9, 0.15, 54 * k, { col: '#e1c690' }, { t: 0.1, h: 6, mw: 0.18, gap: 0.13, hp: 2 });
    },
  });
  if (st === 3) {
    list.push({ d: 1.0, f: () => stakes(g, linePts(-1.3, 0.75, 1.3, 0.75, 0.22), 14) });
    list.push({ d: 1.1, f: () => stakes(g, linePts(1.3, -0.7, 1.3, 0.75, 0.22), 14) });
    list.push({ d: 0.2, f: () => cauldron(g, -0.45, -0.2, 54, 0.8) });
    list.push({ d: 0.3, f: () => cauldron(g, 0.45, -0.2, 54, 0.8) });
    list.push({ d: 1.5, f: () => flag(g, -0.8, -0.95, 54, 28, 18) });
    list.push({ d: 1.6, f: () => flag(g, 0.8, -0.95, 54, 28, 18) });
    list.push({ d: 1.8, f: () => jar(g, -1.15, 1.05) });
    list.push({ d: 1.9, f: () => stonePile(g, 0.9, 1.1, 5, '#b8b2a4') });
  }
  if (st === 1) list.push({ d: 4, f: () => scaffoldBox(g, -1.05, -1.3, 1.05, 0.3, 36, { step: 0.55 }) });
  if (st === 2) list.push({ d: 4, f: () => stonePile(g, 0.8, 0.9, 5, '#c29563') });
  items(list);
}
countersiege.found = { stone: true };

export const EGYPT_MORE = { mill, lumber, mining, archery, stable, forge, tower, slingtower, siege, dock, infirmary, great_house: greatHouse, countersiege };
void [tone, rgba, mulCol, SAND, TURQ, GOLD_D, winged, crate, hayBale];
