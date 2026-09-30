// Kit commun des bâtiments vikings : matériaux (tourbe, bois noirci), boucliers peints, poteaux à tête de dragon,
// étendard au corbeau, séchoirs à poisson, runes. Utilisé par building-vikings*.js.
import { MAT, tone, rgba } from './building-gfx.js';
import { stick } from './building-parts.js';
import { campfire, GOLD } from './building-props.js';

const PI = Math.PI;
export const CREAM = '#efe6cc';
// ---------------------------------------------------------------------------
// Matériaux propres : bois noirci, bardeaux sombres, toit de tourbe
// ---------------------------------------------------------------------------

/** Toit de tourbe : plaques d'herbe rase, joints sombres, touffes et quelques fleurs. Période (w, h). */
export function texTurf(c, w, h, rnd, col) {
  const lt = tone(col, 1.25);
  const dk = tone(col, 0.68);
  const put = (x, y, r, f) => {
    f(x, y);
    if (x < r) f(x + w, y);
    if (x > w - r) f(x - w, y);
    if (y < r) f(x, y + h);
    if (y > h - r) f(x, y - h);
  };
  // touffes
  for (const [sty, a] of [[dk, 0.5], [lt, 0.55]]) {
    c.strokeStyle = sty;
    c.globalAlpha = a;
    c.lineWidth = 0.8;
    c.beginPath();
    for (let i = 0; i < (w * h) / 6; i++) {
      const L = 2 + rnd() * 3.4;
      const du = (rnd() - 0.5) * 1.6;
      put(rnd() * w, rnd() * h, L, (x, y) => {
        c.moveTo(x, y);
        c.lineTo(x + du, y - L);
      });
    }
    c.stroke();
  }
  c.globalAlpha = 1;
  // plaques de gazon : joints horizontaux ondulés et quelques joints verticaux
  const rows = Math.max(1, Math.round(h / 8));
  const rh = h / rows;
  for (let r = 0; r < rows; r++) {
    const v = (r + 0.8) * rh;
    c.fillStyle = 'rgba(40,30,10,0.26)';
    c.fillRect(0, v, w, 1.3);
    c.fillStyle = 'rgba(220,240,150,0.16)';
    c.fillRect(0, v - 1.2, w, 1);
    c.fillStyle = 'rgba(40,30,10,0.2)';
    for (let k = 0; k < 3; k++) c.fillRect(((k + 0.3 + ((r * 0.37) % 0.4)) * w) / 3, v - rh, 0.9, rh);
  }
  // fleurs des champs
  for (let i = 0; i < (w * h) / 420; i++) {
    c.fillStyle = rnd() < 0.5 ? 'rgba(250,240,170,0.85)' : 'rgba(240,250,255,0.8)';
    put(rnd() * w, rnd() * h, 2, (x, y) => c.fillRect(x, y, 1.3, 1.3));
  }
}

export const TURF = { col: '#6d8040', tex: texTurf, tile: true, lh: 8 };
export const DARK = { ...MAT.planksDark, col: '#51402f' };
export const DARKER = { ...MAT.planksDark, col: '#463727' };
export const SHINGLE = { ...MAT.shingle, col: '#5b4a3b' };
export const STONE_BASE = { ...MAT.stoneDark, col: '#8d8980' };

// ---------------------------------------------------------------------------
// Accessoires
// ---------------------------------------------------------------------------

/** Bouclier rond peint accroché (repère d'une face) : couleurs alternées équipe / jaune / noir / crème. */
export function vShield(c, tc, u, v, r, i = 0) {
  const cols = [tc.main, '#e0b53a', tc.main, '#1c1a18', CREAM, tc.main];
  const col = cols[i % cols.length];
  c.fillStyle = '#4a3826';
  c.beginPath();
  c.arc(u, v, r + 0.9, 0, 2 * PI);
  c.fill();
  c.fillStyle = col;
  c.beginPath();
  c.arc(u, v, r, 0, 2 * PI);
  c.fill();
  c.fillStyle = rgba('#ffffff', 0.25);
  c.beginPath();
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * 2 * PI + 0.3;
    c.moveTo(u, v);
    c.arc(u, v, r * 0.94, a, a + PI / 4);
    c.closePath();
  }
  c.fill();
  c.fillStyle = '#b6bcc4';
  c.beginPath();
  c.arc(u, v, r * 0.3, 0, 2 * PI);
  c.fill();
}

export function shieldRowV(c, tc, w, v, n, r, from = 0.1, to = 0.9) {
  for (let i = 0; i < n; i++) vShield(c, tc, w * (from + ((to - from) * i) / Math.max(1, n - 1)), v, r, i);
}

/** Poteau sculpté à tête de dragon regardant vers (dx, dy) à l'écran. */
export function dragonPost(g, x, y, h, z0 = 0, dir = 1) {
  if (g.mode === 'shadow') {
    g.shadowPole(x, y, z0, z0 + h + 6, 0.05);
    return;
  }
  if (!g.drawing) return;
  g.post(x, y, z0, z0 + h, '#3c2a1a', 3.6);
  const c = g.ctx;
  const [px, py] = g.P(x, y, z0 + h);
  c.save();
  c.translate(px, py);
  c.scale(dir, 1);
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(0, 1);
  c.quadraticCurveTo(-1.5, -4, 1.2, -7);
  c.strokeStyle = '#1e130a';
  c.lineWidth = 4.2;
  c.stroke();
  c.strokeStyle = '#5a3a20';
  c.lineWidth = 2.6;
  c.stroke();
  c.fillStyle = '#5a3a20';
  c.strokeStyle = '#1e130a';
  c.lineWidth = 0.6;
  c.beginPath();
  c.moveTo(-0.6, -6.6);
  c.quadraticCurveTo(0.6, -10.6, 4.6, -10.0);
  c.lineTo(8.2, -8.6);
  c.lineTo(5.0, -8.0);
  c.lineTo(7.6, -6.6);
  c.quadraticCurveTo(3.6, -6.2, -0.6, -6.6);
  c.closePath();
  c.fill();
  c.stroke();
  c.fillStyle = GOLD;
  c.beginPath();
  c.arc(2.6, -8.6, 0.8, 0, 2 * PI);
  c.fill();
  c.beginPath();
  c.moveTo(0.6, -9.8);
  c.lineTo(-1.6, -12.4);
  c.lineTo(1.6, -10.6);
  c.closePath();
  c.fill();
  c.restore();
}

/** Étendard à hampe : gonfanon d'équipe à queue d'aronde orné d'un corbeau noir aux ailes ouvertes. */
export function vBanner(g, x, y, z0, hPole, o = {}) {
  if (g.mode === 'shadow') {
    g.shadowPole(x, y, z0, z0 + hPole);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, z0);
  const top = py - hPole;
  const W = o.w ?? 12;
  const H = o.h ?? 17;
  const tc = g.tc;
  stick(c, px, py, px, top - 2, '#3c2a1a', 1.8);
  stick(c, px - W / 2 - 1.5, top + 1, px + W / 2 + 1.5, top + 1, '#3c2a1a', 1.3);
  const xl = px - W / 2;
  const y0 = top + 1.8;
  c.beginPath();
  c.moveTo(xl, y0);
  c.lineTo(xl + W, y0);
  c.lineTo(xl + W, y0 + H * 0.9);
  c.lineTo(xl + W * 0.5, y0 + H * 0.66);
  c.lineTo(xl, y0 + H * 0.9);
  c.closePath();
  const gr = c.createLinearGradient(xl, 0, xl + W, 0);
  gr.addColorStop(0, tone(tc.main, 1.1));
  gr.addColorStop(0.5, tc.main);
  gr.addColorStop(1, tone(tc.main, 0.72));
  c.fillStyle = gr;
  c.fill();
  c.strokeStyle = rgba(tc.dark, 0.9);
  c.lineWidth = 0.9;
  c.stroke();
  // corbeau
  const cx = px;
  const cy = y0 + H * 0.36;
  const k = W / 12;
  c.fillStyle = '#16120e';
  c.beginPath();
  c.moveTo(cx - 4.4 * k, cy - 2.2 * k);
  c.lineTo(cx - 1.2 * k, cy - 0.6 * k);
  c.lineTo(cx, cy - 2.6 * k);
  c.lineTo(cx + 1.2 * k, cy - 0.6 * k);
  c.lineTo(cx + 4.4 * k, cy - 2.2 * k);
  c.lineTo(cx + 2 * k, cy + 1.2 * k);
  c.lineTo(cx + 0.8 * k, cy + 2.6 * k);
  c.lineTo(cx - 0.8 * k, cy + 2.6 * k);
  c.lineTo(cx - 2 * k, cy + 1.2 * k);
  c.closePath();
  c.fill();
  c.fillStyle = GOLD;
  c.beginPath();
  c.arc(px - W / 2 - 1.6, top + 1, 1.1, 0, 2 * PI);
  c.arc(px + W / 2 + 1.6, top + 1, 1.1, 0, 2 * PI);
  c.arc(px, top - 2.5, 1.5, 0, 2 * PI);
  c.fill();
}

/** Séchoir à poisson (morue séchée) : deux perches et une barre chargée de poissons. */
export function fishRack(g, x, y, axis = 'x', L = 0.55) {
  const ax = axis === 'x' ? L / 2 : 0;
  const ay = axis === 'y' ? L / 2 : 0;
  if (g.mode === 'shadow') {
    g.shadowOf([[x - ax, y - ay, 0], [x + ax, y + ay, 0], [x - ax, y - ay, 16], [x + ax, y + ay, 16]]);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  g.post(x - ax, y - ay, 0, 16, '#6a4a2c', 1.8);
  g.beam(x - ax, y - ay, 15, x + ax, y + ay, 15, '#6a4a2c', 1.6);
  const n = 5;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const [px, py] = g.P(x - ax + 2 * ax * t, y - ay + 2 * ay * t, 15);
    c.fillStyle = i % 2 ? '#c9b48a' : '#d8c59c';
    c.beginPath();
    c.ellipse(px, py + 4.5, 1.5, 4.6, 0.05 * (i - 2), 0, 2 * PI);
    c.fill();
    c.fillStyle = '#b09a70';
    c.beginPath();
    c.moveTo(px - 1.6, py + 8.4);
    c.lineTo(px + 1.6, py + 8.4);
    c.lineTo(px, py + 10.4);
    c.closePath();
    c.fill();
  }
  g.post(x + ax, y + ay, 0, 16, '#6a4a2c', 1.8);
}

/** Fosse de feu de la grande salle : pierres, braises et flammes vives. */
export function firePit(g, x, y) {
  if (!g.drawing) return;
  campfire(g, x, y);
}

/** Runes peintes (face d'une stèle) : fût central et rameaux, rouge sang. */
export function runeColumn(c, w, h, n = 5, col = '#a8252a') {
  c.strokeStyle = col;
  c.lineWidth = 1.3;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(w / 2, 5);
  c.lineTo(w / 2, h - 5);
  const step = (h - 14) / n;
  for (let i = 0; i < n; i++) {
    const y = 8 + i * step;
    if (i % 3 === 0) {
      c.moveTo(w / 2, y);
      c.lineTo(w / 2 + 3.4, y + 3);
      c.lineTo(w / 2, y + 6);
    } else if (i % 3 === 1) {
      c.moveTo(w / 2 - 3.2, y + 4);
      c.lineTo(w / 2, y);
      c.lineTo(w / 2 + 3.2, y + 4);
    } else {
      c.moveTo(w / 2 - 3, y);
      c.lineTo(w / 2 + 3, y + 5);
      c.moveTo(w / 2 + 3, y);
      c.lineTo(w / 2 - 3, y + 5);
    }
  }
  c.stroke();
}

