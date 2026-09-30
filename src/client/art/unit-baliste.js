// Baliste gauloise : arbalète géante à deux bras à torsion sur affût roulant, servie par un Gaulois (~50 px de long).
// Genre `baliste` : elle regarde vers +x ; chargée et armée au repos, la corde claque au tir (les bras se détendent, le
// carreau part), puis le servant la remet en tension au treuil. Coordonnées modèle : u vers l'avant, v vers le spectateur,
// h vers le haut (projection oblique comme les autres engins).
import { PI, TAU, clamp, lerp, smooth, tone, rgba, edge, ell, poly, paint, line, sideGrad, ballGrad } from './unit-kit.js';
import * as G from './unit-gear.js';
import { drawHuman } from './unit-human.js';
import { walkPose, idlePose, diePose } from './unit-poses.js';
import { base } from './unit-base.js';
import { spokedWheel, flagPole } from './unit-gauls-parts.js';

const LX = -0.66;
const LY = 0.46;
const P3 = (u, v, h) => [u + v * LX, v * LY - h];
const WOOD = '#7a4c28';
const WOOD_D = '#4e3019';
const ROPE = '#cdb67e';
const IRON = '#6b727a';
const ARM_V = 19;

export function balisteSpec(tm) {
  const sv = base('gauls', tm, 1.0);
  sv.hair = '#b8783a';
  sv.moustache = '#b8783a';
  sv.helmet = { kind: 'leather', c: '#7a4c2a' };
  sv.sleeves = 'short';
  sv.weapon = null;
  sv.belt = '#5a3920';
  sv.hem = 3.6;
  return { kind: 'baliste', type: 'baliste', hold: 'bow', box: [-46, -56, 40, 12], bal: { team: tm, servant: sv } };
}

function quad(ctx, a, b, c, d) {
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.lineTo(c[0], c[1]);
  ctx.lineTo(d[0], d[1]);
  ctx.closePath();
}

/** Poutre le long de u : dessus clair, flanc proche, bout avant sombre. */
function beamU(ctx, u0, u1, v0, v1, h0, h1, c, far) {
  const k = far ? -0.3 : 0;
  quad(ctx, P3(u0, v0, h1), P3(u1, v0, h1), P3(u1, v1, h1), P3(u0, v1, h1));
  paint(ctx, tone(c, 0.16 + k), edge(c, 0.5), 0.45);
  quad(ctx, P3(u0, v1, h1), P3(u1, v1, h1), P3(u1, v1, h0), P3(u0, v1, h0));
  paint(ctx, tone(c, k), edge(c, 0.6), 0.45);
  quad(ctx, P3(u1, v1, h1), P3(u1, v0, h1), P3(u1, v0, h0), P3(u1, v1, h0));
  paint(ctx, tone(c, -0.25 + k), edge(c, 0.6), 0.45);
}

function stick(ctx, a, b, w, c, far) {
  const k = far ? -0.3 : 0;
  ctx.lineCap = 'round';
  line(ctx, a[0], a[1], b[0], b[1], tone('#2a1a0c', k), w + 0.8);
  line(ctx, a[0], a[1], b[0], b[1], tone(c, k), w);
  line(ctx, a[0] - 0.3, a[1] - 0.3, b[0] - 0.3, b[1] - 0.3, rgba('#ffffff', far ? 0.06 : 0.18), w * 0.3);
}

/** Cadre de torsion : deux montants, bobine de cordages de nerf avec rondelles de fer, plaques d'équipe. */
function frame(ctx, v, far, tm) {
  const k = far ? -0.3 : 0;
  const [bx, by] = P3(8, v, 0);
  // fond sombre du cadre
  quad(ctx, P3(5.2, v, 10.6), P3(10.8, v, 10.6), P3(10.8, v, 21.6), P3(5.2, v, 21.6));
  paint(ctx, tone('#2a1a0e', k), null);
  // bobine de cordages
  ctx.beginPath();
  ctx.rect(bx - 1.9, by - 20.4, 3.8, 9.6);
  paint(ctx, sideGrad(ctx, bx - 2, bx + 2, tone(ROPE, k), 0.25, -0.3), edge(ROPE, 0.7), 0.4);
  ctx.strokeStyle = rgba(tone(ROPE, -0.5), 0.6);
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  for (let y = by - 20; y < by - 11; y += 1.3) {
    ctx.moveTo(bx - 1.9, y);
    ctx.lineTo(bx + 1.9, y + 0.9);
  }
  ctx.stroke();
  for (const y of [by - 20.6, by - 10.8]) {
    ctx.beginPath();
    ell(ctx, bx, y, 2.5, 0.85);
    paint(ctx, tone(IRON, k), edge(IRON, 0.8), 0.4);
  }
  // montants
  for (const u of [5.2, 10.8]) stick(ctx, P3(u, v, 10.4), P3(u, v, 21.8), 1.3, WOOD, far);
  // traverses, plaque haute aux couleurs de l'équipe
  stick(ctx, P3(5.2, v, 10.6), P3(10.8, v, 10.6), 1.2, WOOD, far);
  ctx.beginPath();
  poly(ctx, [...P3(4.6, v, 21.9), ...P3(11.4, v, 21.9), ...P3(11.4, v, 23.2), ...P3(4.6, v, 23.2)]);
  paint(ctx, tone(tm.main, k), edge(tm.main, 0.85), 0.45);
}

/** Bras de la baliste : de la bobine (u = 8) jusqu'à l'extrémité recourbée. */
function arm(ctx, v, tipU, far) {
  const s = v > 0 ? 1 : -1;
  const a = P3(8, v, 16);
  const t = P3(tipU, s * ARM_V, 16.6);
  const c = P3(8 + (tipU - 8) * 0.2 + 2.2, s * 10.5, 16.4);
  ctx.lineCap = 'round';
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.quadraticCurveTo(c[0], c[1], t[0], t[1]);
  };
  const k = far ? -0.3 : 0;
  path();
  ctx.strokeStyle = tone('#2a1a0c', k);
  ctx.lineWidth = 3.3;
  ctx.stroke();
  path();
  ctx.strokeStyle = tone('#c99a58', k);
  ctx.lineWidth = 2.1;
  ctx.stroke();
  path();
  ctx.strokeStyle = rgba('#ffe2b0', far ? 0.08 : 0.3);
  ctx.lineWidth = 0.6;
  ctx.stroke();
  // embout de bronze qui retient la corde
  ctx.beginPath();
  ell(ctx, t[0], t[1], 1.1, 1.1);
  paint(ctx, tone(G.BRONZE, k), edge(G.BRONZE, 0.85), 0.4);
  return t;
}

function bolt(ctx, uN, tm, far) {
  const a = P3(uN, 0, 17.2);
  const b = P3(uN + 25, 0, 17.4);
  ctx.lineCap = 'round';
  line(ctx, a[0], a[1], b[0], b[1], '#3a2412', 1.7);
  line(ctx, a[0], a[1], b[0], b[1], '#c69a5a', 1.0);
  // pointe de fer à ailerons
  ctx.beginPath();
  poly(ctx, [b[0] + 4.4, b[1] - 0.1, b[0] - 0.4, b[1] - 1.5, b[0] + 0.8, b[1], b[0] - 0.4, b[1] + 1.5]);
  paint(ctx, G.STEEL, 'rgba(30,34,40,0.8)', 0.4);
  // empennage aux couleurs de l'équipe
  ctx.beginPath();
  poly(ctx, [a[0] - 1.0, a[1] - 0.2, a[0] + 4.2, a[1] - 1.9, a[0] + 4.6, a[1] - 0.2, a[0] + 4.2, a[1] + 1.5]);
  paint(ctx, tm.light, edge(tm.main, 0.8), 0.4);
}

function windlass(ctx, crank) {
  // tambour du treuil à l'arrière du fût et sa manivelle
  const a = P3(-16.5, -2.6, 15.2);
  const b = P3(-16.5, 2.6, 15.2);
  ctx.lineCap = 'round';
  line(ctx, a[0], a[1], b[0], b[1], '#2a1a0c', 4.0);
  line(ctx, a[0], a[1], b[0], b[1], '#a87840', 2.8);
  line(ctx, a[0] - 0.4, a[1] - 0.4, b[0] - 0.4, b[1] - 0.4, rgba('#ffe2b0', 0.3), 0.7);
  ctx.beginPath();
  ell(ctx, b[0], b[1], 1.7, 1.7);
  paint(ctx, ballGrad(ctx, b[0], b[1], 2, IRON, 0.4, -0.3), 'rgba(20,20,20,0.75)', 0.4);
  // manivelle : deux branches et poignée
  const hx = b[0] + Math.cos(crank) * 3.6;
  const hy = b[1] + Math.sin(crank) * 3.6;
  line(ctx, b[0], b[1], hx, hy, '#2a1a0c', 1.8);
  line(ctx, b[0], b[1], hx, hy, '#8a5a32', 1.0);
  ctx.beginPath();
  ell(ctx, hx, hy, 1.0, 1.0);
  paint(ctx, '#c69a5a', edge('#8a5a32', 0.8), 0.35);
}

/** État de la machine selon l'animation : tension de la corde d (0 = détendue, 1 = tendue à fond), carreau en place. */
function state(fr) {
  const q = fr.q;
  const S = { d: 0.94, loaded: true, recoil: 0, crank: 0, spin: 0, servant: 'idle', rel: 0 };
  if (fr.anim === 3) {
    if (q < 0.3) S.d = lerp(0.94, 1, smooth(q / 0.3));
    else if (q < 0.4) S.d = 1;
    else if (q < 0.46) {
      S.d = lerp(1, 0.0, smooth((q - 0.4) / 0.06));
      S.loaded = q < 0.42;
    } else if (q < 0.62) {
      S.d = 0.05 * Math.sin((q - 0.46) * 60) * (1 - (q - 0.46) / 0.16);
      S.loaded = false;
    } else {
      S.d = lerp(0, 0.94, smooth((q - 0.62) / 0.38));
      S.loaded = q > 0.88;
      S.crank = (q - 0.62) * TAU * 3.2;
      S.servant = 'crank';
    }
    S.recoil = q >= 0.4 && q < 0.7 ? Math.sin(clamp((q - 0.4) / 0.3, 0, 1) * PI) * 2.0 : 0;
    S.rel = q >= 0.4 && q < 0.6 ? 1 : 0;
  } else if (fr.anim === 1) {
    S.spin = q * 3 * (TAU / 8);
    S.servant = 'push';
  }
  return S;
}

export const BALISTE = {
  draw(ctx, Sx, fr) {
    const B = Sx.bal;
    const tm = B.team;
    const st = state(fr);
    const q = fr.q;
    const dying = fr.anim === 4;
    const f = dying ? smooth(clamp(q / 0.85)) : 0;
    const walk = fr.anim === 1;
    const bump = walk ? Math.abs(Math.sin(q * TAU * 2)) * -0.5 : 0;
    // élévation : on pointe vers la cible (seulement pendant l'attaque)
    let elev = 0;
    if (fr.anim === 3) {
      const local = -1.25 + (fr.aim / 10) * 2.5;
      elev = clamp(local * 0.5, -0.4, 0.3);
    }
    if (dying) elev = -0.2 * f;
    const d = dying ? 0 : st.d;
    const tipU = lerp(15, 4, d);
    const nockU = lerp(13.5, -9, d);

    ctx.save();
    ctx.translate(0, bump);
    if (dying) {
      ctx.translate(-16, 0);
      ctx.rotate(-0.1 * f);
      ctx.translate(16, 0);
    }
    if (st.recoil) ctx.translate(-st.recoil, 0);

    // --- roue lointaine, béquille lointaine, longeron lointain, traverses, essieu ---
    spokedWheel(ctx, ...P3(0, -8.6, 6.8), st.spin, true, 8, 0.9);
    stick(ctx, P3(-17, -4.4, 8.6), P3(-29, -4.4, 0.8), 1.7, WOOD, true);
    beamU(ctx, -19, 15, -6.2, -4.4, 6.8, 9.4, WOOD, true);
    for (const u of [-16, 12]) beamU(ctx, u - 0.8, u + 0.8, -6.0, 6.0, 8.0, 9.6, WOOD_D, false);
    line(ctx, ...P3(0, -8, 6.8), ...P3(0, 8, 6.8), '#2a1a0c', 2.2);
    // fanion de l'équipe planté sur le longeron lointain
    {
      const fp = P3(-3, -5.2, 9.4);
      flagPole(ctx, fp[0], fp[1], 21, tm.main, walk ? Math.sin(q * TAU * 2) * 1.1 : Math.sin(q * TAU) * 0.5, 8);
    }

    // --- servant, derrière l'affût ---
    {
      const sp = B.servant;
      let Pz;
      if (dying) Pz = diePose(clamp(q * 1.15));
      else if (st.servant === 'push') {
        Pz = walkPose('tool', q, null);
        Object.assign(Pz, { ikN: 1, tnx: 6.6, tny: 3.4, bendN: -1, ikF: 1, tfx: 5.6, tfy: 4.4, bendF: -1, lean: 0.18 });
      } else {
        Pz = idlePose('tool', st.servant === 'idle' ? q : 0.3, null);
        const th = st.crank;
        const cr = st.servant === 'crank' ? 1.7 : 0.4;
        Object.assign(Pz, {
          ikN: 1, tnx: 6.0 + Math.cos(th) * cr, tny: 4.0 + Math.sin(th) * cr, bendN: -1,
          ikF: 1, tfx: 5.0 + Math.cos(th + 0.6) * cr * 0.4, tfy: 5.2, bendF: -1,
          lean: 0.12, nT: 0.18, nS: -0.2, fT: -0.14, fS: -0.1,
        });
      }
      ctx.save();
      ctx.translate(-23.6, 1.0);
      if (dying) {
        ctx.translate(-3 * f, 0);
        if (Pz.rot || Pz.flat !== 1 || Pz.fx) {
          ctx.translate(Pz.fx, 0);
          ctx.scale(1, Pz.flat);
          ctx.rotate(Pz.rot);
        }
      }
      drawHuman(ctx, sp, Pz, { weapon: null });
      ctx.restore();
    }

    // --- longeron proche, béquille proche, roue proche ---
    beamU(ctx, -19, 15, 4.4, 6.2, 6.8, 9.4, WOOD, false);
    ctx.beginPath();
    poly(ctx, [...P3(-17, 6.25, 8.9), ...P3(13, 6.25, 8.9), ...P3(13, 6.25, 7.3), ...P3(-17, 6.25, 7.3)]);
    paint(ctx, tm.main, edge(tm.main, 0.8), 0.4);
    stick(ctx, P3(-17, 4.4, 8.6), P3(-29, 4.4, 0.8), 1.9, WOOD, false);
    ctx.save();
    if (dying) {
      const w = P3(0, 8.6, 6.8);
      ctx.translate(w[0], w[1]);
      ctx.translate(16 * f, 0);
      ctx.translate(-w[0], -w[1]);
    }
    const [wx, wy] = P3(0, 8.6, 6.8);
    spokedWheel(ctx, wx, wy, 6.8, st.spin + (dying ? f * 8 : 0), false, 8, 0.9);
    ctx.restore();

    // --- partie haute pivotante (fût, cadres, bras) : au premier plan, les bras débordent devant la roue ---
    const pv = P3(-2, 0, 15);
    ctx.save();
    ctx.translate(pv[0], pv[1]);
    ctx.rotate(-elev);
    ctx.translate(-pv[0], -pv[1]);
    for (const u of [-8, 6]) beamU(ctx, u - 1.1, u + 1.1, -1.1, 1.1, 9.4, 13.8, WOOD_D, false);
    frame(ctx, -4.6, true, tm);
    arm(ctx, -4.6, tipU, true);
    beamU(ctx, -18, 19, -1.7, 1.7, 13.6, 16.6, '#b98a52', false);
    line(ctx, ...P3(-16, 0, 16.6), ...P3(18.4, 0, 16.6), rgba('#2a1a0c', 0.7), 0.9);
    ctx.beginPath();
    poly(ctx, [...P3(17, -1.8, 16.8), ...P3(19.4, -1.8, 16.8), ...P3(19.4, 1.8, 16.8), ...P3(17, 1.8, 16.8)]);
    paint(ctx, IRON, 'rgba(20,20,20,0.7)', 0.4);
    windlass(ctx, st.crank);
    if (st.loaded && !dying) bolt(ctx, nockU, tm, false);
    frame(ctx, 4.6, false, tm);
    const tN = arm(ctx, 4.6, tipU, false);
    if (!dying || f < 0.25) {
      const tF = P3(tipU, -ARM_V, 16.6);
      const nk = P3(nockU, 0, 17.0);
      ctx.beginPath();
      ctx.moveTo(tF[0], tF[1]);
      ctx.lineTo(nk[0], nk[1]);
      ctx.lineTo(tN[0], tN[1]);
      ctx.strokeStyle = 'rgba(40,30,18,0.9)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(244,236,208,0.98)';
      ctx.lineWidth = 0.65;
      ctx.stroke();
      ctx.beginPath();
      ell(ctx, nk[0], nk[1], 1.2, 1.0);
      paint(ctx, tone(G.BRONZE, 0.05), edge(G.BRONZE, 0.8), 0.35);
    }
    ctx.restore();

    ctx.restore();
  },
  shadow(S, fr, m) {
    return { cx: -3, cy: 1.5, rx: 31, ry: 8, a: 0.3 * (fr.anim === 4 ? 1 - 0.4 * smooth(fr.q) : 1) };
  },
};
