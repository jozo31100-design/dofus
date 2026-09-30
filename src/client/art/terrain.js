// Texture du sol « à plat » (vue de dessus, TERRAIN_PPT px par case), déformée ensuite en isométrie par le moteur.
//
// Méthode (rapide : ~0,3 s pour 96 × 96 cases) :
//   1. champs basse résolution (8 px par case) : masques « mouillé » et « profond » lissés par flou (transitions
//      douces, pas de carreaux) et bruités (rivages irréguliers) ;
//   2. couleur de chaque pixel basse résolution (herbes variées, sable, galets, eau peu profonde → profonde) ;
//   3. agrandissement lissé ×4 vers la texture finale ;
//   4. détails nets tamponnés : grain, touffes d'herbe, fleurs, cailloux, galets, ondulations et reflets.
//
// Orientation : la matrice isométrique envoie la direction (1, −1) de la texture à l'horizontale de l'écran
// (ondulations de l'eau) ; la lumière écran « haut-gauche » vient de la direction (−1,5 ; −0,5) de la texture.

import { TERRAIN_PPT } from './constants.js';
import { makeCanvas, mulberry32, hexToRgb } from './palette.js';

const LR = 8; // pixels par case des champs basse résolution
const PI = Math.PI;

// ---------------------------------------------------------------------------
// Outils numériques
// ---------------------------------------------------------------------------

/** Flou en boîte séparable, répété (≈ gaussien), sur un champ w × h. */
function boxBlur(a, w, h, r, passes, tmp) {
  const k = 1 / (2 * r + 1);
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < h; y++) {
      const row = y * w;
      let sum = 0;
      for (let i = -r; i <= r; i++) sum += a[row + Math.min(w - 1, Math.max(0, i))];
      for (let x = 0; x < w; x++) {
        tmp[row + x] = sum * k;
        sum += a[row + Math.min(w - 1, x + r + 1)] - a[row + Math.max(0, x - r)];
      }
    }
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let i = -r; i <= r; i++) sum += tmp[Math.min(h - 1, Math.max(0, i)) * w + x];
      for (let y = 0; y < h; y++) {
        a[y * w + x] = sum * k;
        sum += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
      }
    }
  }
}

/** Bruit de valeur lissé (réseau aléatoire de période `per` px), échantillonné sur tout le champ w × h. */
function valueNoise(w, h, per, rnd) {
  const gw = Math.ceil(w / per) + 2;
  const gh = Math.ceil(h / per) + 2;
  const grid = new Float32Array(gw * gh);
  for (let i = 0; i < grid.length; i++) grid[i] = rnd();
  const out = new Float32Array(w * h);
  const inv = 1 / per;
  // décalage aléatoire pour que les octaves ne s'alignent pas
  const ox = rnd() * per;
  const oy = rnd() * per;
  for (let y = 0; y < h; y++) {
    const fy = (y + oy) * inv;
    const iy = fy | 0;
    let ty = fy - iy;
    ty = ty * ty * (3 - 2 * ty);
    const r0 = iy * gw;
    const r1 = r0 + gw;
    for (let x = 0; x < w; x++) {
      const fx = (x + ox) * inv;
      const ix = fx | 0;
      let tx = fx - ix;
      tx = tx * tx * (3 - 2 * tx);
      const a = grid[r0 + ix];
      const b = grid[r0 + ix + 1];
      const c = grid[r1 + ix];
      const d = grid[r1 + ix + 1];
      const top = a + (b - a) * tx;
      out[y * w + x] = top + (c + (d - c) * tx - top) * ty;
    }
  }
  return out;
}

const smooth = (a, b, x) => {
  const t = x <= a ? 0 : x >= b ? 1 : (x - a) / (b - a);
  return t * t * (3 - 2 * t);
};

// ---------------------------------------------------------------------------
// Palette du sol
// ---------------------------------------------------------------------------

const C = Object.fromEntries(
  Object.entries({
    gDark: '#3f7a2c',
    gMid: '#68a038',
    gLight: '#8cc04a',
    gYellow: '#a9bb4c',
    gCool: '#4f8a45',
    gDry: '#a2a95a',
    gLush: '#3f7a35',
    sand: '#e3cf96',
    sandWet: '#ab9a70',
    mud: '#8c7a58',
    shallow: '#6fb7b6',
    ford: '#78bfb4',
    fordSand: '#c2b98a',
    water: '#2c72ab',
    deep: '#1d5790',
    abyss: '#133f73',
    foam: '#f3fbf6',
    dirtP: '#9b7c4c',
  }).map(([k, v]) => [k, hexToRgb(v)]),
);

// ---------------------------------------------------------------------------
// Tampons de détail (petits sprites dessinés une fois)
// ---------------------------------------------------------------------------

/**
 * Vecteur de texture qui, une fois déformé en isométrie, devient le vecteur écran (hx, −hs) :
 * sert à dessiner des brins « debout » (la direction (−1, −1) de la texture est la verticale de l'écran).
 */
const upright = (hx, hs) => [0.5 * hx - hs, -0.5 * hx - hs];

/** Brin d'herbe debout (hauteur écran hs, inclinaison écran hx) partant de (x, y) dans la texture. */
function blade(c, x, y, hx, hs) {
  const [vx, vy] = upright(hx, hs);
  c.moveTo(x, y);
  c.quadraticCurveTo(x + vx * 0.5 - hx * 0.1, y + vy * 0.5 + hx * 0.1, x + vx, y + vy);
}

let STAMPS = null;
function stamps() {
  if (STAMPS) return STAMPS;
  const rnd = mulberry32(90210);
  const mk = (w, h, f) => {
    const { canvas, ctx } = makeCanvas(w, h);
    f(ctx, w, h);
    return canvas;
  };
  // touffes d'herbe debout : éventail de brins sombres à pointes claires
  const tuft = (n, H, dark, light) => mk(18, 18, (c) => {
    const bx = 12;
    const by = 12;
    c.lineCap = 'round';
    const blades = [];
    for (let i = 0; i < n; i++) blades.push([(rnd() - 0.5) * 2.2, (i / (n - 1 || 1) - 0.5) * H * 0.9 + (rnd() - 0.5), H * (0.55 + rnd() * 0.45)]);
    c.lineWidth = 0.75;
    c.strokeStyle = dark;
    c.beginPath();
    for (const [ox, hx, hs] of blades) blade(c, bx + ox * 0.5, by - ox * 0.5, hx, hs);
    c.stroke();
    c.strokeStyle = light;
    c.lineWidth = 0.6;
    c.beginPath();
    for (const [ox, hx, hs] of blades) {
      const [vx, vy] = upright(hx, hs);
      const x0 = bx + ox * 0.5 + vx * 0.45;
      const y0 = by - ox * 0.5 + vy * 0.45;
      c.moveTo(x0, y0);
      c.lineTo(bx + ox * 0.5 + vx, by - ox * 0.5 + vy);
    }
    c.stroke();
    // petite ombre au pied (vers la droite de la texture = bas-droite de l'écran)
    c.fillStyle = 'rgba(25,45,15,0.25)';
    c.beginPath();
    c.ellipse(bx + 1.2, by + 0.2, 2.2, 1.2, 0.8, 0, 2 * PI);
    c.fill();
  });
  const tufts = [];
  for (let i = 0; i < 5; i++) tufts.push(tuft(4 + i, 3.2 + (i % 3) * 0.9, 'rgba(38,72,24,0.75)', 'rgba(150,196,92,0.8)'));
  for (let i = 0; i < 4; i++) tufts.push(tuft(3 + i, 2.6 + (i % 2), 'rgba(62,98,34,0.6)', 'rgba(190,210,110,0.75)'));
  for (let i = 0; i < 3; i++) tufts.push(tuft(6 + i, 4.2 + i * 0.6, 'rgba(34,64,22,0.8)', 'rgba(120,170,75,0.8)'));
  // fleurs : tiges debout et corolles colorées, en petits bouquets
  const flowerCols = ['#f6f3e8', '#f2d35a', '#b9b3e8', '#ec9ab0', '#f0a24c'];
  const flowers = flowerCols.map((col) => mk(14, 14, (c) => {
    for (let k = 0; k < 4; k++) {
      const x = 6 + rnd() * 5;
      const y = 6 + rnd() * 5;
      const hs = 2.2 + rnd() * 1.8;
      const [vx, vy] = upright((rnd() - 0.5) * 1.5, hs);
      c.strokeStyle = 'rgba(50,90,30,0.8)';
      c.lineWidth = 0.6;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + vx, y + vy);
      c.stroke();
      c.fillStyle = col;
      c.beginPath();
      c.arc(x + vx, y + vy, 0.95, 0, 2 * PI);
      c.fill();
    }
  }));
  // cailloux : ombre à droite (+x texture), éclat à gauche
  const pebble = (r, col) => mk(r * 2 + 4, r * 2 + 4, (c, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    c.fillStyle = 'rgba(30,25,15,0.35)';
    c.beginPath();
    c.ellipse(cx + 0.9, cy + 0.4, r, r * 0.8, 0.5, 0, 2 * PI);
    c.fill();
    const g = c.createLinearGradient(cx - r, cy - r * 0.4, cx + r, cy + r * 0.4);
    g.addColorStop(0, '#e2ded4');
    g.addColorStop(0.45, col);
    g.addColorStop(1, '#6e6a62');
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(cx, cy, r, r * 0.8, 0.5, 0, 2 * PI);
    c.fill();
  });
  const pebbles = [pebble(1.3, '#a8a398'), pebble(1.8, '#9c968a'), pebble(2.4, '#b1ab9e'), pebble(1.5, '#8f8a80'), pebble(3, '#a39d90')];
  // roseaux : tiges debout avec épis bruns
  const reeds = [0, 1, 2].map(() => mk(16, 16, (c) => {
    for (let k = 0; k < 6; k++) {
      const x = 4 + rnd() * 8;
      const y = 10 + rnd() * 3;
      const hs = 5 + rnd() * 4;
      const hx = (rnd() - 0.5) * 2;
      const [vx, vy] = upright(hx, hs);
      c.strokeStyle = k % 2 ? 'rgba(86,120,48,0.95)' : 'rgba(62,98,36,0.95)';
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + vx, y + vy);
      c.stroke();
      if (k % 3 === 0) {
        c.strokeStyle = 'rgba(96,58,26,0.95)';
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(x + vx * 0.78, y + vy * 0.78);
        c.lineTo(x + vx, y + vy);
        c.stroke();
      }
    }
    c.fillStyle = 'rgba(25,40,70,0.3)';
    c.beginPath();
    c.ellipse(9, 11, 5, 2, 0.8, 0, 2 * PI);
    c.fill();
  }));
  // mottes de terre / petites taches sombres
  const dirt = mk(10, 10, (c) => {
    c.fillStyle = 'rgba(110,85,50,0.35)';
    c.beginPath();
    c.ellipse(5, 5, 4, 3, 0.7, 0, 2 * PI);
    c.fill();
  });
  // ondulations : arcs clairs doublés d'un liseré sombre, orientés (1, −1) dans la texture (horizontaux à l'écran)
  const ripple = (L, a) => mk(L + 6, L + 6, (c, w, h) => {
    c.translate(w / 2, h / 2);
    c.rotate(-PI / 4);
    c.lineCap = 'round';
    c.strokeStyle = `rgba(20,50,90,${a * 0.5})`;
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(-L / 2, 0.9);
    c.quadraticCurveTo(0, -0.7, L / 2, 0.9);
    c.stroke();
    c.strokeStyle = `rgba(225,242,248,${a})`;
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(-L / 2, 0);
    c.quadraticCurveTo(0, -1.6, L / 2, 0);
    c.stroke();
  });
  const ripples = [ripple(8, 0.42), ripple(12, 0.34), ripple(6, 0.5), ripple(16, 0.28)];
  // motif de vaguelettes (période 128 px) : petits arcs clairs et sombres alternés
  const waves = mk(128, 128, (c) => {
    const r2 = mulberry32(777);
    c.lineCap = 'round';
    for (const [col, lw, n] of [['rgba(15,45,85,0.16)', 1, 170], ['rgba(230,245,250,0.16)', 0.8, 150]]) {
      c.strokeStyle = col;
      c.lineWidth = lw;
      c.beginPath();
      for (let i = 0; i < n; i++) {
        const x = r2() * 128;
        const y = r2() * 128;
        const L = 4 + r2() * 7;
        for (const [ox, oy] of [[0, 0], [-128, 0], [0, -128], [-128, -128], [128, 0], [0, 128]]) {
          const ax = x + ox;
          const ay = y + oy;
          // direction (1, −1) de la texture = horizontale à l'écran
          c.moveTo(ax - L * 0.35, ay + L * 0.35);
          c.quadraticCurveTo(ax - 0.6, ay - 0.6, ax + L * 0.35, ay - L * 0.35);
        }
      }
      c.stroke();
    }
  });
  // reflet large et diffus
  const glint = mk(26, 26, (c) => {
    c.translate(13, 13);
    c.rotate(-PI / 4);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 11);
    g.addColorStop(0, 'rgba(210,235,245,0.22)');
    g.addColorStop(1, 'rgba(210,235,245,0)');
    c.fillStyle = g;
    c.scale(1, 0.35);
    c.beginPath();
    c.arc(0, 0, 11, 0, 2 * PI);
    c.fill();
  });
  const sparkle = mk(5, 5, (c) => {
    c.fillStyle = 'rgba(255,255,255,0.8)';
    c.fillRect(2, 1, 1, 3);
    c.fillRect(1, 2, 3, 1);
  });
  // grain : tapis de brins minuscules (debout une fois déformés) et fines taches, en motif répété
  const grain = (size, n, seed2) => mk(size, size, (c) => {
    const r2 = mulberry32(seed2);
    c.lineCap = 'round';
    const batches = [
      ['rgba(28,58,16,0.22)', 0.7, 0.45],
      ['rgba(40,80,24,0.3)', 0.6, 0.25],
      ['rgba(200,230,140,0.2)', 0.55, 0.3],
    ];
    for (const [col, lw, share] of batches) {
      c.strokeStyle = col;
      c.lineWidth = lw;
      c.beginPath();
      for (let i = 0; i < n * share; i++) {
        const x = r2() * size;
        const y = r2() * size;
        blade(c, x, y, (r2() - 0.5) * 1.6, 1.2 + r2() * 1.8);
      }
      c.stroke();
    }
    for (let i = 0; i < n * 0.15; i++) {
      c.fillStyle = r2() < 0.5 ? 'rgba(20,45,10,0.12)' : 'rgba(210,235,160,0.1)';
      c.fillRect(r2() * size, r2() * size, 1, 1);
    }
  });
  // grandes tuiles périodiques (512 px) : prairie (touffes, cailloux, mottes), fleurs, vaguelettes
  const T = 512;
  const scatter = (c, img, n, pick) => {
    for (let i = 0; i < n; i++) {
      const im = pick ? pick() : img;
      const x = rnd() * T;
      const y = rnd() * T;
      for (const ox of [0, -T, T]) {
        for (const oy of [0, -T, T]) {
          const px = x + ox;
          const py = y + oy;
          if (px > -im.width && px < T && py > -im.height && py < T) c.drawImage(im, px | 0, py | 0);
        }
      }
    }
  };
  const grainA = grain(256, 7000, 11);
  const grainB = grain(256, 7000, 23);
  const meadow = mk(T, T, (c) => {
    // grain (brins minuscules), touffes, cailloux, mottes et bouquets de fleurs dans une même tuile
    c.fillStyle = c.createPattern(grainA, 'repeat');
    c.fillRect(0, 0, T, T);
    c.save();
    c.translate(97, 53);
    c.fillStyle = c.createPattern(grainB, 'repeat');
    c.globalAlpha = 0.8;
    c.fillRect(-97, -53, T, T);
    c.restore();
    scatter(c, null, 1500, () => tufts[(rnd() * tufts.length) | 0]);
    scatter(c, null, 70, () => pebbles[(rnd() * 3) | 0]);
    scatter(c, dirt, 22);
    for (let k = 0; k < 30; k++) {
      const fl = flowers[k % flowers.length];
      const cx = rnd() * T;
      const cy = rnd() * T;
      for (let i = 0; i < 6; i++) {
        const x = cx + (rnd() - 0.5) * 30;
        const y = cy + (rnd() - 0.5) * 30;
        for (const ox of [0, -T, T]) for (const oy of [0, -T, T]) c.drawImage(fl, (x + ox) | 0, (y + oy) | 0);
      }
    }
  });
  const waveTile = mk(256, 256, (c) => {
    c.fillStyle = c.createPattern(waves, 'repeat');
    c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 70; i++) {
      const im = ripples[(rnd() * ripples.length) | 0];
      const x = rnd() * 256;
      const y = rnd() * 256;
      for (const ox of [0, -256, 256]) for (const oy of [0, -256, 256]) c.drawImage(im, (x + ox) | 0, (y + oy) | 0);
    }
  });
  STAMPS = { reeds, tufts, flowers, pebbles, dirt, ripples, sparkle, glint, waves, meadow, waveTile };
  return STAMPS;
}

// ---------------------------------------------------------------------------
// Texture
// ---------------------------------------------------------------------------

/** terrain : Uint8Array (0 herbe, 1 gué, 2 eau profonde), W × H cases. Renvoie un canvas W·PPT × H·PPT. */
export function renderTerrainTexture(terrain, W, H, seed = 1) {
  const PPT = TERRAIN_PPT;
  const { canvas, ctx } = makeCanvas(W * PPT, H * PPT);
  const lw = W * LR;
  const lh = H * LR;
  const N = lw * lh;
  const rnd = mulberry32((seed * 2654435761) >>> 0 || 1);

  // 1. masques eau / eau profonde
  const wet = new Float32Array(N);
  const deep = new Float32Array(N);
  let anyWet = false;
  let anyDeep = false;
  for (let ty = 0; ty < H; ty++) {
    for (let tx = 0; tx < W; tx++) {
      const t = terrain[ty * W + tx];
      if (!t) continue;
      anyWet = true;
      if (t === 2) anyDeep = true;
      for (let y = ty * LR; y < (ty + 1) * LR; y++) {
        const row = y * lw;
        for (let x = tx * LR; x < (tx + 1) * LR; x++) {
          wet[row + x] = 1;
          if (t === 2) deep[row + x] = 1;
        }
      }
    }
  }
  const tmp = new Float32Array(N);
  let deepC = null;
  if (anyWet) boxBlur(wet, lw, lh, 4, 3, tmp);
  if (anyDeep) {
    deepC = deep.slice();
    boxBlur(deep, lw, lh, 4, 3, tmp);
    boxBlur(deepC, lw, lh, 11, 2, tmp);
  }

  // 2. bruits (fin, moyen, large) et couleur de chaque pixel basse résolution
  const nF = valueNoise(lw, lh, 5, rnd);
  const nM = valueNoise(lw, lh, 22, rnd);
  const nL = valueNoise(lw, lh, 70, rnd);
  const nX = valueNoise(lw, lh, 11, rnd);
  const lo = makeCanvas(lw, lh);
  const img = lo.ctx.createImageData(lw, lh);
  const px = img.data;
  // calque d'eau séparé (RGBA), posé par-dessus le sol et son grain
  const wo = anyWet ? makeCanvas(lw, lh) : null;
  const wimg = anyWet ? wo.ctx.createImageData(lw, lh) : null;
  const wpx = anyWet ? wimg.data : null;
  const shore = new Float32Array(N); // valeur de rivage, réutilisée pour placer les détails
  const deepV = anyDeep ? new Float32Array(N) : null;
  const { dirtP, gDark, gMid, gLight, gYellow, gCool, gDry, gLush, sand, sandWet, mud, shallow, ford, fordSand, water, deep: dCol, abyss, foam } = C;
  for (let i = 0; i < N; i++) {
    const f = nF[i];
    const m = nM[i];
    const l = nL[i];
    const x2 = nX[i];
    // herbe : grandes plages chaudes / froides (l), plages claires (m), touches jaunies et sèches, grain fin (f)
    const t1 = smooth(0.2, 0.8, l);
    let r = gCool[0] + (gMid[0] - gCool[0]) * t1;
    let g = gCool[1] + (gMid[1] - gCool[1]) * t1;
    let b = gCool[2] + (gMid[2] - gCool[2]) * t1;
    const t2 = smooth(0.35, 0.8, m);
    r += (gLight[0] - r) * t2 * 0.62;
    g += (gLight[1] - g) * t2 * 0.62;
    b += (gLight[2] - b) * t2 * 0.62;
    const t3 = smooth(0.6, 0.95, l * 0.6 + x2 * 0.4);
    r += (gYellow[0] - r) * t3 * 0.5;
    g += (gYellow[1] - g) * t3 * 0.5;
    b += (gYellow[2] - b) * t3 * 0.5;
    const t4 = 1 - smooth(0.1, 0.38, m * 0.75 + f * 0.25);
    r += (gDark[0] - r) * t4 * 0.38;
    g += (gDark[1] - g) * t4 * 0.38;
    b += (gDark[2] - b) * t4 * 0.38;
    const t5 = smooth(0.8, 0.97, x2) * smooth(0.4, 0.7, l);
    r += (gDry[0] - r) * t5 * 0.5;
    g += (gDry[1] - g) * t5 * 0.5;
    b += (gDry[2] - b) * t5 * 0.5;
    // plaques de terre battue (rares, bordures douces)
    const t6 = smooth(0.84, 0.97, x2 * 0.7 + (1 - l) * 0.3) * smooth(0.5, 0.25, m);
    r += (dirtP[0] - r) * t6 * 0.55;
    g += (dirtP[1] - g) * t6 * 0.55;
    b += (dirtP[2] - b) * t6 * 0.55;
    // lumière du soleil : grandes plages dorées, ombres fraîches (éclairage « peint »)
    const sun = (l - 0.5) * 16 + (m - 0.5) * 8;
    r += sun * 1.1;
    g += sun * 0.8;
    b += sun * 0.15;
    const fv = (f - 0.5) * 12;
    r += fv;
    g += fv * 1.1;
    b += fv * 0.6;
    const j = i * 4;
    if (anyWet) {
      const s = wet[i] + (f - 0.5) * 0.14 + (x2 - 0.5) * 0.26;
      shore[i] = s;
      // herbe plus grasse et plus sombre près de l'eau
      const tl = smooth(0.0, 0.16, s) * (1 - smooth(0.16, 0.3, s));
      r += (gLush[0] - r) * tl * 0.55;
      g += (gLush[1] - g) * tl * 0.55;
      b += (gLush[2] - b) * tl * 0.55;
      if (s > 0.12) {
        const ts = smooth(0.14, 0.45, s);
        const wetT = smooth(0.36, 0.5, s);
        const sr = sand[0] + (sandWet[0] - sand[0]) * wetT + (f - 0.5) * 16;
        const sg = sand[1] + (sandWet[1] - sand[1]) * wetT + (f - 0.5) * 14;
        const sb = sand[2] + (sandWet[2] - sand[2]) * wetT + (f - 0.5) * 10;
        // quelques plaques de vase près de l'eau
        const tm = smooth(0.6, 0.9, x2) * smooth(0.3, 0.48, s) * 0.5;
        r += (sr + (mud[0] - sr) * tm - r) * ts;
        g += (sg + (mud[1] - sg) * tm - g) * ts;
        b += (sb + (mud[2] - sb) * tm - b) * ts;
        const tw = smooth(0.46, 0.53, s);
        if (tw > 0) {
          // limite gué / eau profonde irrégulière
          const dv = anyDeep ? deep[i] + (x2 - 0.5) * 0.3 + (m - 0.5) * 0.45 : 0;
          if (deepV) deepV[i] = dv;
          const dp = anyDeep ? smooth(0.2, 0.72, dv) : 0;
          const dc = anyDeep ? smooth(0.55, 0.98, deepC[i]) : 0;
          // gué : eau claire sur fond de sable, veinée de bancs plus clairs
          const sandy = smooth(0.38, 0.72, m * 0.8 + x2 * 0.2) * (1 - dp);
          let wr = ford[0] + (fordSand[0] - ford[0]) * sandy * 0.45;
          let wg = ford[1] + (fordSand[1] - ford[1]) * sandy * 0.45;
          let wb = ford[2] + (fordSand[2] - ford[2]) * sandy * 0.45;
          // bord : eau peu profonde turquoise, puis bleu, bleu sombre au centre
          const edge = 1 - smooth(0.5, 0.8, s);
          wr += (shallow[0] - wr) * dp;
          wg += (shallow[1] - wg) * dp;
          wb += (shallow[2] - wb) * dp;
          const deepT = dp * (1 - edge * 0.85);
          wr += (water[0] - wr) * deepT;
          wg += (water[1] - wg) * deepT;
          wb += (water[2] - wb) * deepT;
          wr += (dCol[0] - wr) * dc * 0.8;
          wg += (dCol[1] - wg) * dc * 0.8;
          wb += (dCol[2] - wb) * dc * 0.8;
          const ab = dc * smooth(0.5, 0.95, deepC[i] * 0.7 + l * 0.3);
          wr += (abyss[0] - wr) * ab * 0.7;
          wg += (abyss[1] - wg) * ab * 0.7;
          wb += (abyss[2] - wb) * ab * 0.7;
          // reflets larges (bruit moyen) et écume au bord
          const sheen = (m - 0.5) * 18 * (0.4 + dp) + (x2 - 0.5) * 8;
          wr += sheen;
          wg += sheen;
          wb += sheen * 0.8;
          // écume : liseré clair irrégulier au contact de la berge, puis léger ombrage de l'eau
          const foamBand = (1 - smooth(0.5, 0.6, s)) * tw * (0.55 + 0.6 * smooth(0.3, 0.8, f * 0.5 + x2 * 0.5));
          wr += (foam[0] - wr) * Math.min(1, foamBand) * 0.85;
          wg += (foam[1] - wg) * Math.min(1, foamBand) * 0.85;
          wb += (foam[2] - wb) * Math.min(1, foamBand) * 0.85;
          const under = smooth(0.52, 0.64, s) * (1 - smooth(0.64, 0.8, s)) * 0.16;
          wr -= wr * under * 0.6;
          wg -= wg * under * 0.4;
          wpx[j] = wr;
          wpx[j + 1] = wg;
          wpx[j + 2] = wb;
          wpx[j + 3] = tw * 255;
        }
      }
    }
    px[j] = r;
    px[j + 1] = g;
    px[j + 2] = b;
    px[j + 3] = 255;
  }
  lo.ctx.putImageData(img, 0, 0);

  // 3. agrandissement lissé du sol
  const FW = W * PPT;
  const FH = H * PPT;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'medium';
  ctx.drawImage(lo.canvas, 0, 0, lw, lh, 0, 0, FW, FH);

  // 4. détails du sol
  const S = stamps();
  const fieldAt = (x, y) => {
    const ix = Math.min(lw - 1, Math.max(0, (x / PPT) * LR | 0));
    const iy = Math.min(lh - 1, Math.max(0, (y / PPT) * LR | 0));
    return iy * lw + ix;
  };
  // masque basse résolution de densité des détails du sol (nul sur l'eau et le sable)
  const mM = makeCanvas(lw, lh);
  const mImg = mM.ctx.createImageData(lw, lh);
  for (let i = 0; i < N; i++) {
    const sh = anyWet ? shore[i] : 0;
    const land = 1 - smooth(0.04, 0.24, sh);
    mImg.data[i * 4 + 3] = 255 * land * (0.6 + 0.4 * smooth(0.1, 0.7, nM[i]));
  }
  mM.ctx.putImageData(mImg, 0, 0);
  // calque de détails : masque agrandi, puis motif posé « à l'intérieur » du masque
  const layer = makeCanvas(FW, FH);
  const lc = layer.ctx;
  lc.imageSmoothingQuality = 'low';
  lc.drawImage(mM.canvas, 0, 0, lw, lh, 0, 0, FW, FH);
  lc.globalCompositeOperation = 'source-in';
  lc.fillStyle = lc.createPattern(S.meadow, 'repeat');
  lc.fillRect(0, 0, FW, FH);
  ctx.drawImage(layer.canvas, 0, 0);
  // galets des rives : tamponnés seulement le long du rivage
  if (anyWet) {
    for (let i = 0; i < N; i += 1) {
      const sh = shore[i];
      if (sh < 0.24 || sh > 0.5 || rnd() > 0.1) continue;
      const x = ((i % lw) + rnd()) * (PPT / LR);
      const y = (((i / lw) | 0) + rnd()) * (PPT / LR);
      ctx.drawImage(S.pebbles[(rnd() * S.pebbles.length) | 0], x | 0, y | 0);
    }
  }

  // roseaux et touffes épaisses sur la berge
  if (anyWet) {
    for (let i = 0; i < N; i += 1) {
      const sh = shore[i];
      if (sh < 0.27 || sh > 0.46 || rnd() > 0.018) continue;
      const x = ((i % lw) + rnd()) * (PPT / LR);
      const y = (((i / lw) | 0) + rnd()) * (PPT / LR);
      ctx.drawImage(S.reeds[(rnd() * 3) | 0], x | 0, y | 0);
    }
  }

  // 5. eau : calque translucide agrandi, vaguelettes (motif gardé là où il y a de l'eau), reflets
  if (anyWet) {
    wo.ctx.putImageData(wimg, 0, 0);
    // eau et vaguelettes, bloc par bloc (seulement là où il y a de l'eau)
    const B = 16; // cases par bloc
    const bw = B * PPT;
    const blk = makeCanvas(bw, bw);
    const bc = blk.ctx;
    bc.imageSmoothingQuality = 'low';
    const wavePat = bc.createPattern(S.waveTile, 'repeat');
    for (let by = 0; by < H; by += B) {
      for (let bx = 0; bx < W; bx += B) {
        let any = false;
        for (let y = by; y < Math.min(H, by + B + 1) && !any; y++) {
          for (let x = Math.max(0, bx - 1); x < Math.min(W, bx + B + 1); x++) {
            if (terrain[y * W + x]) {
              any = true;
              break;
            }
          }
        }
        if (!any) continue;
        const sx = bx * LR;
        const sy = by * LR;
        const sw = Math.min(B, W - bx) * LR;
        const shh = Math.min(B, H - by) * LR;
        const dw = sw * (PPT / LR);
        const dh = shh * (PPT / LR);
        ctx.drawImage(wo.canvas, sx, sy, sw, shh, bx * PPT, by * PPT, dw, dh);
        bc.globalCompositeOperation = 'copy';
        bc.drawImage(wo.canvas, sx, sy, sw, shh, 0, 0, dw, dh);
        bc.globalCompositeOperation = 'source-in';
        bc.setTransform(1, 0, 0, 1, -bx * PPT, -by * PPT);
        bc.fillStyle = wavePat;
        bc.fillRect(bx * PPT, by * PPT, dw, dh);
        bc.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(blk.canvas, 0, 0, dw, dh, bx * PPT, by * PPT, dw, dh);
      }
    }
    // reflets, étincelles et galets vus sous l'eau des gués
    for (let i = 0; i < N; i++) {
      const sh = shore[i];
      if (sh < 0.56 || rnd() > 0.06) continue;
      const x = ((i % lw) + rnd()) * (PPT / LR);
      const y = (((i / lw) | 0) + rnd()) * (PPT / LR);
      const dp = deepV ? deepV[i] : 0;
      const r = rnd();
      if (dp < 0.35) {
        if (r < 0.35) {
          ctx.globalAlpha = 0.5;
          ctx.drawImage(S.pebbles[(rnd() * 4) | 0], x | 0, y | 0);
          ctx.globalAlpha = 1;
        }
      } else if (r < 0.12) ctx.drawImage(S.glint, x | 0, y | 0);
      else if (r < 0.15) ctx.drawImage(S.sparkle, x | 0, y | 0);
    }
  }
  layer.canvas.width = 1;
  return canvas;
}
