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
    gDark: '#4a7d33',
    gMid: '#5f9440',
    gLight: '#79ad4c',
    gYellow: '#93ae4f',
    gCool: '#4f8a45',
    gDry: '#a2a95a',
    sand: '#d6c38d',
    sandWet: '#ab9a70',
    mud: '#8c7a58',
    shallow: '#6fb7b6',
    ford: '#86c2b3',
    fordSand: '#c2b98a',
    water: '#3278ad',
    deep: '#235d93',
    abyss: '#1b4a7d',
    foam: '#e4f1ec',
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
  // mottes de terre / petites taches sombres
  const dirt = mk(10, 10, (c) => {
    c.fillStyle = 'rgba(110,85,50,0.35)';
    c.beginPath();
    c.ellipse(5, 5, 4, 3, 0.7, 0, 2 * PI);
    c.fill();
  });
  // ondulations : traits clairs orientés (1, −1) dans la texture (horizontaux à l'écran)
  const ripple = (L, a) => mk(L + 4, L + 4, (c, w, h) => {
    c.translate(w / 2, h / 2);
    c.rotate(-PI / 4);
    c.strokeStyle = `rgba(230,245,250,${a})`;
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(-L / 2, 0);
    c.quadraticCurveTo(0, -1.6, L / 2, 0);
    c.stroke();
  });
  const ripples = [ripple(8, 0.35), ripple(12, 0.3), ripple(6, 0.45), ripple(16, 0.22)];
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
  STAMPS = { tufts, flowers, pebbles, dirt, ripples, sparkle, grainA: grain(256, 7000, 11), grainB: grain(331, 9000, 23) };
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
  const shore = new Float32Array(N); // valeur de rivage, réutilisée pour placer les détails
  const { gDark, gMid, gLight, gYellow, gCool, gDry, sand, sandWet, mud, shallow, ford, fordSand, water, deep: dCol, abyss, foam } = C;
  for (let i = 0; i < N; i++) {
    const f = nF[i];
    const m = nM[i];
    const l = nL[i];
    const x2 = nX[i];
    // herbe : grandes plages (l), plages moyennes (m), variations fines (f)
    const t1 = smooth(0.25, 0.75, l);
    let r = gCool[0] + (gMid[0] - gCool[0]) * t1;
    let g = gCool[1] + (gMid[1] - gCool[1]) * t1;
    let b = gCool[2] + (gMid[2] - gCool[2]) * t1;
    const t2 = smooth(0.35, 0.8, m);
    r += (gLight[0] - r) * t2 * 0.75;
    g += (gLight[1] - g) * t2 * 0.75;
    b += (gLight[2] - b) * t2 * 0.75;
    const t3 = smooth(0.62, 0.95, l * 0.6 + x2 * 0.4);
    r += (gYellow[0] - r) * t3 * 0.55;
    g += (gYellow[1] - g) * t3 * 0.55;
    b += (gYellow[2] - b) * t3 * 0.55;
    const t4 = smooth(0.1, 0.3, m) * 0 + (1 - smooth(0.12, 0.4, m * 0.7 + f * 0.3));
    r += (gDark[0] - r) * t4 * 0.6;
    g += (gDark[1] - g) * t4 * 0.6;
    b += (gDark[2] - b) * t4 * 0.6;
    const t5 = smooth(0.8, 0.97, x2) * smooth(0.4, 0.7, l);
    r += (gDry[0] - r) * t5 * 0.5;
    g += (gDry[1] - g) * t5 * 0.5;
    b += (gDry[2] - b) * t5 * 0.5;
    const fv = (f - 0.5) * 14;
    r += fv;
    g += fv * 1.1;
    b += fv * 0.6;
    // rivage
    let s = 0;
    if (anyWet) {
      s = wet[i] + (f - 0.5) * 0.14 + (x2 - 0.5) * 0.26;
      shore[i] = s;
      if (s > 0.12) {
        const ts = smooth(0.14, 0.45, s);
        const sr = sand[0] + (sandWet[0] - sand[0]) * smooth(0.38, 0.5, s) + (f - 0.5) * 18;
        const sg = sand[1] + (sandWet[1] - sand[1]) * smooth(0.38, 0.5, s) + (f - 0.5) * 16;
        const sb = sand[2] + (sandWet[2] - sand[2]) * smooth(0.38, 0.5, s) + (f - 0.5) * 12;
        // quelques plaques de vase près de l'eau
        const tm = smooth(0.6, 0.9, x2) * smooth(0.3, 0.48, s) * 0.5;
        r += (sr + (mud[0] - sr) * tm - r) * ts;
        g += (sg + (mud[1] - sg) * tm - g) * ts;
        b += (sb + (mud[2] - sb) * tm - b) * ts;
        const tw = smooth(0.47, 0.53, s);
        if (tw > 0) {
          const dp = anyDeep ? smooth(0.12, 0.75, deep[i]) : 0;
          const dc = anyDeep ? smooth(0.55, 0.98, deepC[i]) : 0;
          // gué : eau claire sur fond de sable, veinée de bancs plus clairs
          const sandy = smooth(0.4, 0.7, m * 0.6 + f * 0.4) * (1 - dp);
          let wr = ford[0] + (fordSand[0] - ford[0]) * sandy * 0.6;
          let wg = ford[1] + (fordSand[1] - ford[1]) * sandy * 0.6;
          let wb = ford[2] + (fordSand[2] - ford[2]) * sandy * 0.6;
          // bord : eau peu profonde turquoise
          const edge = 1 - smooth(0.5, 0.78, s);
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
          const sheen = (m - 0.5) * 16 * (0.4 + dp);
          wr += sheen;
          wg += sheen;
          wb += sheen * 0.8;
          const fo = (1 - smooth(0.5, 0.57, s)) * tw;
          wr += (foam[0] - wr) * fo * 0.45;
          wg += (foam[1] - wg) * fo * 0.45;
          wb += (foam[2] - wb) * fo * 0.45;
          r += (wr - r) * tw;
          g += (wg - g) * tw;
          b += (wb - b) * tw;
        }
      }
    }
    const j = i * 4;
    px[j] = r;
    px[j + 1] = g;
    px[j + 2] = b;
    px[j + 3] = 255;
  }
  lo.ctx.putImageData(img, 0, 0);

  // 3. agrandissement lissé
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(lo.canvas, 0, 0, lw, lh, 0, 0, W * PPT, H * PPT);

  // 4. détails
  const S = stamps();
  const fieldAt = (x, y) => {
    const ix = Math.min(lw - 1, Math.max(0, (x / PPT) * LR | 0));
    const iy = Math.min(lh - 1, Math.max(0, (y / PPT) * LR | 0));
    return iy * lw + ix;
  };
  // grain sur tout le sol
  ctx.save();
  ctx.fillStyle = ctx.createPattern(S.grainA, 'repeat');
  ctx.fillRect(0, 0, W * PPT, H * PPT);
  ctx.fillStyle = ctx.createPattern(S.grainB, 'repeat');
  ctx.globalAlpha = 0.8;
  ctx.fillRect(0, 0, W * PPT, H * PPT);
  ctx.restore();
  const total = W * H;
  // touffes, fleurs, mottes
  const nT = total * 7;
  for (let k = 0; k < nT; k++) {
    const x = rnd() * W * PPT;
    const y = rnd() * H * PPT;
    const i = fieldAt(x, y);
    const s = anyWet ? shore[i] : 0;
    if (s > 0.3) continue;
    const r = rnd();
    const dense = nM[i];
    if (r < 0.8) {
      if (rnd() > 0.35 + dense * 0.6) continue;
      const t = S.tufts[(rnd() * S.tufts.length) | 0];
      ctx.drawImage(t, (x - t.width / 2) | 0, (y - t.height / 2) | 0);
    } else if (r < 0.9) {
      // fleurs groupées dans certaines plages
      if (nX[i] < 0.55 || s > 0.1) continue;
      const fl = S.flowers[((nL[i] * 7 + rnd() * 1.5) | 0) % S.flowers.length];
      ctx.drawImage(fl, x | 0, y | 0);
    } else if (r < 0.96) {
      const p = S.pebbles[(rnd() * 3) | 0];
      ctx.drawImage(p, x | 0, y | 0);
    } else {
      ctx.drawImage(S.dirt, x | 0, y | 0);
    }
  }
  if (anyWet) {
    // galets sur les rives et dans les gués, ondulations et reflets sur l'eau
    const nW = total * 5;
    for (let k = 0; k < nW; k++) {
      const x = rnd() * W * PPT;
      const y = rnd() * H * PPT;
      const i = fieldAt(x, y);
      const s = shore[i];
      if (s < 0.2) continue;
      const dp = anyDeep ? deep[i] : 0;
      if (s < 0.5) {
        if (rnd() < 0.55) {
          const p = S.pebbles[(rnd() * S.pebbles.length) | 0];
          ctx.drawImage(p, x | 0, y | 0);
        }
      } else if (dp < 0.35) {
        // gué
        const r = rnd();
        if (r < 0.25) ctx.drawImage(S.pebbles[(rnd() * 4) | 0], x | 0, y | 0);
        else if (r < 0.7) ctx.drawImage(S.ripples[(rnd() * 3) | 0], x | 0, y | 0);
      } else {
        const r = rnd();
        if (r < 0.45) ctx.drawImage(S.ripples[(rnd() * S.ripples.length) | 0], x | 0, y | 0);
        else if (r < 0.52) ctx.drawImage(S.sparkle, x | 0, y | 0);
      }
    }
  }
  return canvas;
}
