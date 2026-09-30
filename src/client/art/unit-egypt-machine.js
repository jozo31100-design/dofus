// Scarabée-catapulte : la baliste à torsion (unit-baliste.js) surmontée d'un disque solaire ailé d'or et de lapis,
// servie par un soldat égyptien. Genre `eg_baliste` : même animation que la baliste, l'emblème suit le recul.
import { PI, clamp, smooth, rgba, ell, poly, paint } from './unit-kit.js';
import { BALISTE } from './unit-baliste.js';
import { GOLDE, GOLD_D, LAPIS, TURQ, CARNE } from './unit-egypt-gear.js';

const LX = -0.66;
const LY = 0.46;
const P3 = (u, v, h) => [u + v * LX, v * LY - h];

/** Disque solaire ailé : deux ailes d'or rayées de lapis et de turquoise, disque rouge, deux uræus. */
function wingedDisc(ctx, x, y, s, team) {
  ctx.lineJoin = 'round';
  for (const d of [-1, 1]) {
    const feathers = [[0, 0, 11, -1.6, 3.0], [0, 1.2, 9.6, 1.2, 2.6], [0, 2.4, 8.0, 3.6, 2.2]];
    feathers.forEach(([, oy, L, ey, w], i) => {
      ctx.beginPath();
      ctx.moveTo(x + d * 2.4 * s, y + oy * s);
      ctx.quadraticCurveTo(x + d * L * 0.55 * s, y + (oy - 2.6 + ey) * s, x + d * L * s, y + (ey - 0.4) * s);
      ctx.lineTo(x + d * (L - 1.4) * s, y + (ey + w) * s);
      ctx.quadraticCurveTo(x + d * L * 0.5 * s, y + (oy + 1.4 + w * 0.3) * s, x + d * 2.4 * s, y + (oy + 1.4) * s);
      ctx.closePath();
      paint(ctx, i === 0 ? GOLDE : i === 1 ? LAPIS : TURQ, GOLD_D, 0.4);
    });
  }
  ctx.beginPath();
  ell(ctx, x, y, 2.9 * s, 2.9 * s);
  paint(ctx, '#d8452c', GOLD_D, 0.6);
  ctx.beginPath();
  ell(ctx, x, y, 1.4 * s, 1.4 * s);
  ctx.fillStyle = rgba('#ffe27a', 0.9);
  ctx.fill();
  for (const d of [-1, 1]) {
    ctx.beginPath();
    poly(ctx, [x + d * 3.0 * s, y + 1.4 * s, x + d * 4.4 * s, y - 0.6 * s, x + d * 4.0 * s, y + 1.6 * s]);
    paint(ctx, CARNE, GOLD_D, 0.3);
  }
  ctx.beginPath();
  poly(ctx, [x - 1.6 * s, y + 2.6 * s, x + 1.6 * s, y + 2.6 * s, x, y + 4.8 * s]);
  paint(ctx, team.main, GOLD_D, 0.4);
}

export const EG_BALISTE = {
  draw(ctx, S, fr) {
    BALISTE.draw(ctx, S, fr);
    if (fr.anim === 4) return;
    const q = fr.q;
    const recoil = fr.anim === 3 && q >= 0.4 && q < 0.7 ? Math.sin(clamp((q - 0.4) / 0.3, 0, 1) * PI) * 2.0 : 0;
    const bump = fr.anim === 1 ? Math.abs(Math.sin(q * 2 * PI * 2)) * -0.5 : 0;
    const [x, y] = P3(0.5, 0, 30);
    wingedDisc(ctx, x - recoil, y + bump, 0.85, S.bal.team);
    void smooth;
  },
  shadow: BALISTE.shadow,
};
