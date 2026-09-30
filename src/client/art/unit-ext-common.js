// Unités ajoutées (common) : sapeur (fantassin à pioche et tonnelet de poudre) et tour de siège (genre « tower »).
// Voir unit-ext.js pour le contrat du module ; la tour est dessinée dans unit-tower.js.
import { PI, TAU, smooth, clamp, tone, rgba, edge, ell, paint, line, sideGrad, rot } from './unit-kit.js';
import { base, BOX, teamColors, GOLD } from './unit-base.js';
import { drawTower, dust } from './unit-tower.js';

export const TYPES = ['sapper', 'siegetower'];
export const METRICS = {
  sapper: { h: 33, w: 9 },
  siegetower: { h: 100, w: 36 },
};

// ---------------------------------------------------------------------------
// Sapeur
// ---------------------------------------------------------------------------

/** Tonnelet de poudre sangle dans le dos, avec sa mèche (sp.backItem). */
function powderKeg(ctx, R, P, z) {
  const [bx, by] = rot(-3.9 * z, -5.6 * z, P.lean);
  const x = R.hx + bx;
  const y = R.hy + by + R.lift;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(P.lean - 0.18);
  const w = 2.6 * z;
  const h = 3.4 * z;
  // Corps bombé
  ctx.beginPath();
  ctx.moveTo(-w * 0.82, -h);
  ctx.quadraticCurveTo(-w * 1.25, 0, -w * 0.82, h);
  ctx.lineTo(w * 0.82, h);
  ctx.quadraticCurveTo(w * 1.25, 0, w * 0.82, -h);
  ctx.closePath();
  paint(ctx, sideGrad(ctx, -w * 1.2, w * 1.2, '#8a5a32', 0.22, -0.3), 'rgba(35,20,8,0.85)', 0.6);
  // Douelles
  ctx.strokeStyle = 'rgba(40,24,10,0.45)';
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  for (const k of [-0.5, 0, 0.5]) {
    ctx.moveTo(k * w * 1.2, -h);
    ctx.quadraticCurveTo(k * w * 1.55, 0, k * w * 1.2, h);
  }
  ctx.stroke();
  // Cercles de fer
  for (const yy of [-h * 0.62, h * 0.62]) {
    ctx.beginPath();
    ctx.moveTo(-w * 1.05, yy);
    ctx.lineTo(w * 1.05, yy);
    ctx.strokeStyle = '#3c4148';
    ctx.lineWidth = 0.9;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(200,205,215,0.4)';
    ctx.lineWidth = 0.3;
    ctx.beginPath();
    ctx.moveTo(-w * 1.0, yy - 0.3);
    ctx.lineTo(w * 1.0, yy - 0.3);
    ctx.stroke();
  }
  // Marque noire de poudre (tête de mort stylisée : un rond)
  ctx.fillStyle = 'rgba(20,14,10,0.8)';
  ctx.beginPath();
  ell(ctx, w * 0.1, 0, w * 0.42, w * 0.42);
  ctx.fill();
  // Mèche qui serpente vers le haut, étincelle vacillante
  ctx.beginPath();
  ctx.moveTo(0, -h);
  ctx.quadraticCurveTo(-w * 0.6, -h - 1.8 * z, w * 0.3, -h - 3.0 * z);
  ctx.strokeStyle = '#d8c89a';
  ctx.lineWidth = 0.7;
  ctx.stroke();
  const fl = 0.75 + 0.5 * P.br;
  const sx = w * 0.3;
  const sy = -h - 3.0 * z;
  const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 2.6 * z * fl);
  g.addColorStop(0, 'rgba(255,250,200,0.95)');
  g.addColorStop(0.35, 'rgba(255,190,60,0.85)');
  g.addColorStop(1, 'rgba(255,120,30,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ell(ctx, sx, sy, 2.6 * z * fl, 2.6 * z * fl);
  ctx.fill();
  ctx.restore();
}

/** Effets du sapeur : à sa mort, le tonnelet explose (éclair puis nuage de poussière). */
function sapperFx(ctx, fr) {
  if (fr.anim !== 4) return;
  const q = fr.q;
  if (q < 0.4) {
    const e = smooth(clamp(q / 0.4));
    const r = 4 + e * 13;
    const g = ctx.createRadialGradient(-2, -10, 0, -2, -10, r);
    g.addColorStop(0, rgba('#fff6c8', 0.9 * (1 - e)));
    g.addColorStop(0.5, rgba('#ffb040', 0.7 * (1 - e)));
    g.addColorStop(1, 'rgba(255,100,20,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ell(ctx, -2, -10, r, r * 0.8);
    ctx.fill();
  }
  if (q > 0.1) dust(ctx, (q - 0.1) / 0.9, 1, 11, -6);
}

function sapperSpec(civ, teamIdx) {
  const tm = teamColors(teamIdx);
  const g = civ === 'gauls';
  const sp = base(civ, tm, 1.1);
  sp.weapon = 'pickaxe';
  sp.gloves = '#5a3a22';
  sp.tabard = '#6a4a2c'; // tablier de cuir
  sp.belt = '#3a2616';
  sp.buckle = '#8a8f96';
  sp.sleeves = 'long';
  sp.backItem = powderKeg;
  sp.fx = sapperFx;
  if (g) {
    sp.hair = '#b8682a';
    sp.moustache = '#b8682a';
    sp.helmet = { kind: 'leather', c: '#7a5634' };
    sp.hem = 3.6;
  } else {
    sp.hair = '#5a3a22';
    sp.beard = '#5a3a22';
    sp.helmet = { kind: 'leather', c: '#5c4a3c' };
    sp.hem = 6.0;
  }
  void GOLD;
  return { kind: 'human', sp, hold: 'sword', box: BOX.human };
}

// ---------------------------------------------------------------------------
// Tour de siège
// ---------------------------------------------------------------------------

export const KINDS = {
  tower: {
    draw(ctx, S, fr) {
      const P = { spin: 0, bob: 0, wave: 0, bridge: 0, brk: 0, sway: 0 };
      const q = fr.q;
      if (fr.anim === 1) {
        P.spin = q * PI;
        P.bob = Math.abs(Math.sin(q * TAU * 2)) * -0.35;
        P.wave = Math.sin(q * TAU) * 1.3;
        P.sway = Math.sin(q * TAU * 2) * 0.011;
      } else if (fr.anim === 0) {
        P.wave = Math.sin(q * TAU) * 0.9;
        P.sway = Math.sin(q * TAU) * 0.003;
      } else if (fr.anim === 3) {
        // Le pont-levis s'abat vers le mur, reste tendu, puis se relève
        P.bridge = q < 0.3 ? smooth(q / 0.3) : q < 0.72 ? 1 : 1 - smooth((q - 0.72) / 0.28);
        P.wave = 0.6;
        if (q > 0.27 && q < 0.42) P.bob = Math.sin(((q - 0.27) / 0.15) * PI) * 0.7;
      } else if (fr.anim === 4) {
        P.brk = smooth(q);
        P.bridge = smooth(clamp(q * 3));
      }
      drawTower(ctx, S, P);
    },
    shadow(S, fr, m) {
      void m;
      let a = 0.3;
      if (fr.anim === 4) a *= 1 - smooth(fr.q) * 0.5;
      return { cx: 3, cy: 1, rx: 29, ry: 10, a };
    },
  },
};

function towerSpec(civ, teamIdx) {
  return { kind: 'tower', civ, team: teamColors(teamIdx), box: [-46, -118, 62, 24], type: 'siegetower' };
}

export function spec(type, civ, teamIdx) {
  if (type === 'sapper') return sapperSpec(civ, teamIdx);
  if (type === 'siegetower') return towerSpec(civ, teamIdx);
  return null;
}

void tone; void edge; void line;
