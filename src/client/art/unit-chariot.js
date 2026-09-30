// Essédaire : char de guerre gaulois à deux chevaux et roues à rayons, un conducteur et un guerrier lançant des javelots.
// Genre `chariot` : le char regarde vers +x, roues au sol (y = 0) ; ~62 px de long.
import { PI, TAU, clamp, lerp, smooth, tone, rgba, edge, ell, poly, paint, line, sideGrad, capsule } from './unit-kit.js';
import * as G from './unit-gear.js';
import { drawHuman } from './unit-human.js';
import { idlePose, attackPose, diePose, full } from './unit-poses.js';
import { drawHorse, gallopPose, standPose, fallPose } from './unit-horse.js';
import { base } from './unit-base.js';
import { spokedWheel, flagPole, wicker } from './unit-gauls-parts.js';
import { gaulWeapon } from './unit-gauls-gear.js';
import './unit-gauls-poses.js';

const FLOOR = -13.2; // hauteur des pieds des guerriers sur le plancher
const PLAT_FAR = [2.6, -2.2]; // décalage de profondeur du côté lointain

export function chariotSpec(tm) {
  const driver = base('gauls', tm, 1.0);
  driver.hair = '#6a4428';
  driver.moustache = '#6a4428';
  driver.tunic = '#d6c9a4';
  driver.cape = tm.main;
  driver.capeLen = 7;
  driver.helmet = { kind: 'leather', c: '#6e4a2c' };
  driver.weapon = null;
  driver.hem = 3.6;
  const thrower = base('gauls', tm, 1.1);
  thrower.hair = '#c8672c';
  thrower.moustache = '#c8672c';
  thrower.sleeves = 'short';
  thrower.helmet = { kind: 'montefortino', c: G.BRONZE };
  thrower.torque = true;
  thrower.bracelet = G.BRONZE;
  thrower.weapon = 'jav';
  thrower.hem = 3.6;
  thrower.hooks = { weapon: gaulWeapon };
  return {
    kind: 'chariot',
    type: 'essedaire',
    hold: 'bow',
    box: [-44, -64, 52, 14],
    cht: {
      team: tm,
      driver,
      thrower,
      near: { hz: 0.86, coat: '#8b5a34', mane: '#2c1c12', socks: '#d8cdb6', feathers: true, cloth: tm.main, bridle: '#3a2412' },
      far: { hz: 0.82, coat: '#d2c3a0', mane: '#6a5a44', socks: '#8a7a60', feathers: true, cloth: tm.dark, bridle: '#3a2412' },
    },
  };
}

function quad(ctx, a, b, c, d) {
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.lineTo(c[0], c[1]);
  ctx.lineTo(d[0], d[1]);
  ctx.closePath();
}

/** Panneau d'osier du flanc : bas du char, rebord relevé, face avant haute en forme de dash. */
function panel(ctx, dx, dy, far, tm) {
  const pts = [-26, -10.4, -26, -17.6, -17, -19.0, -9, -20.4, -4, -24.6, -1.2, -27.2, -0.4, -14, -0.4, -10.4].map((v, i) => v + (i % 2 ? dy : dx));
  wicker(ctx, pts, tone('#b48c50', far ? -0.3 : 0));
  // rebord de bois le long du bord supérieur
  ctx.beginPath();
  ctx.moveTo(pts[2], pts[3]);
  for (let i = 4; i < 14; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.strokeStyle = tone('#3a2412', far ? -0.3 : 0);
  ctx.lineWidth = 2.1;
  ctx.stroke();
  ctx.strokeStyle = tone('#8a5a32', far ? -0.3 : 0);
  ctx.lineWidth = 1.3;
  ctx.stroke();
  // lisse basse, peinte aux couleurs de l'équipe
  ctx.beginPath();
  poly(ctx, [pts[0], pts[1], pts[14], pts[15], pts[14], pts[15] - 2.3, pts[0], pts[1] - 2.3]);
  paint(ctx, tone(tm.main, far ? -0.35 : 0), edge(tm.main, 0.8), 0.5);
}

function drawCrew(ctx, sp, P, opt) {
  drawHuman(ctx, sp, P, opt);
}

function tilt(ctx, P) {
  if (P.rot || P.flat !== 1 || P.fx) {
    ctx.translate(P.fx, 0);
    ctx.scale(1, P.flat);
    ctx.rotate(P.rot);
  }
}

export const CHARIOT = {
  draw(ctx, S, fr) {
    const C = S.cht;
    const tm = C.team;
    const q = fr.q;
    const walk = fr.anim === 1;
    const dying = fr.anim === 4;
    const f = dying ? smooth(clamp(q / 0.85)) : 0;
    const bump = walk ? Math.abs(Math.sin(q * TAU * 2)) * -0.9 : fr.anim === 0 ? 0.25 * Math.sin(q * TAU) : 0;
    const spin = walk ? q * 3 * (TAU / 8) : 0;

    // ----- chevaux -----
    const hpNear = walk ? gallopPose(q) : dying ? fallPose(q) : standPose(fr.anim === 3 ? 0.2 : q);
    const hpFar = walk ? gallopPose(q + 0.09) : dying ? fallPose(Math.min(1, q + 0.08)) : standPose((q + 0.4) % 1);
    const horse = (H, hp, x, y) => {
      ctx.save();
      ctx.translate(x, y + (walk ? bump * 0.4 : 0));
      if (dying) ctx.scale(1, hp.flat);
      drawHorse(ctx, H, hp, null);
      ctx.restore();
    };

    ctx.save();
    // le char bascule vers l'avant quand les chevaux s'effondrent
    if (dying) {
      ctx.translate(-14, 0);
      ctx.rotate(0.16 * f);
      ctx.translate(14, 0);
    }

    // roue lointaine
    spokedWheel(ctx, -11.4, -11.6, 9.0, spin, true);
    horse(C.far, hpFar, 21 + PLAT_FAR[0], -2.6);
    // timon et joug, entre les deux chevaux
    ctx.save();
    ctx.translate(0, bump * 0.5);
    ctx.beginPath();
    ctx.moveTo(-3, -11.4);
    ctx.lineTo(25, -17.6);
    ctx.strokeStyle = '#3a2412';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.strokeStyle = '#9a6a3c';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    horse(C.near, hpNear, 18, 0.6);
    // palonnier : joug en travers du garrot
    ctx.beginPath();
    capsule(ctx, 23.4, -21.6, 0.85, 26.6, -17.4, 0.85);
    paint(ctx, sideGrad(ctx, 23, 27, '#9a6a3c', 0.25, -0.25), edge('#9a6a3c', 0.8), 0.4);

    // ----- caisse du char (légèrement secouée au galop) -----
    ctx.save();
    ctx.translate(0, bump);
    // flanc lointain
    panel(ctx, PLAT_FAR[0], PLAT_FAR[1], true, tm);
    // plancher vu de dessus
    quad(ctx, [-27, -11.2], [-0.4, -11.2], [-0.4 + PLAT_FAR[0], -11.2 + PLAT_FAR[1]], [-27 + PLAT_FAR[0], -11.2 + PLAT_FAR[1]]);
    paint(ctx, '#7a5230', edge('#7a5230', 0.7), 0.5);
    ctx.strokeStyle = rgba('#3a2412', 0.55);
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    for (let x = -24; x < 0; x += 3.2) {
      ctx.moveTo(x, -11.2);
      ctx.lineTo(x + PLAT_FAR[0], -11.2 + PLAT_FAR[1]);
    }
    ctx.stroke();

    // ----- équipage -----
    const fx = (x) => x;
    // conducteur : les deux mains sur les rênes
    {
      const sp = C.driver;
      let P = idlePose('sword', walk ? q : (q * 0.5) % 1, null);
      P = full({ ...P, nT: 0.14, nS: -0.18, fT: -0.12, fS: -0.08, lean: 0.1, ikN: 1, tnx: 6.4, tny: 2.4, bendN: -1, ikF: 1, tfx: 5.4, tfy: 3.2, bendF: -1, cape: walk ? 0.8 : 0.15 });
      ctx.save();
      ctx.translate(fx(-6), FLOOR + PLAT_FAR[1] * 0.2);
      if (dying) {
        const d = diePose(clamp(q * 1.1));
        P = d;
        tilt(ctx, d);
      } else if (walk) ctx.translate(0, Math.sin(q * TAU * 2) * -0.5);
      drawCrew(ctx, sp, P, { weapon: null });
      ctx.restore();
    }
    // guerrier lanceur de javelots
    {
      const sp = C.thrower;
      const bend = { nT: 0.28, nS: -0.36, fT: 0.3, fS: -0.3 };
      let P;
      if (fr.anim === 3) P = attackPose('jav', q, PI / 2);
      else {
        P = idlePose('jav', walk ? q : (q * 0.5) % 1, null);
        if (walk) P = full({ ...P, ...bend, lean: 0.12 + 0.03 * Math.sin(q * TAU * 2), cape: 0.6 });
      }
      ctx.save();
      ctx.translate(-18.5, FLOOR + PLAT_FAR[1] * 0.35);
      if (dying) {
        const d = diePose(clamp(q * 1.1 - 0.05));
        P = d;
        tilt(ctx, d);
        ctx.translate(-2 * f, 0);
      } else if (walk) ctx.translate(0, Math.sin(q * TAU * 2 + 0.8) * -0.6);
      drawCrew(ctx, sp, P, {});
      ctx.restore();
    }

    // flanc proche par-dessus les jambes des guerriers
    panel(ctx, 0, 0, false, tm);
    // bouclier de l'équipe accroché au flanc
    G.shield(ctx, -12.5, -15.4, 1, 'round', tm.main, 0.78, 0, 'segments');
    // fanion arrière
    flagPole(ctx, -25.4, -17.4, 17, tm.main, walk ? Math.sin(q * TAU * 2) * 1.2 : Math.sin(q * TAU) * 0.6, 8);
    ctx.restore();

    // ----- roue proche et essieu -----
    ctx.save();
    ctx.translate(0, bump * 0.6);
    line(ctx, -14, -9.2, -11.4, -11.6, '#3a2412', 1.6);
    spokedWheel(ctx, -14.6, -9.4, 9.4, spin, false);
    ctx.restore();

    // ----- rênes : de la main du conducteur à la bouche du cheval -----
    if (!dying) {
      ctx.beginPath();
      ctx.moveTo(-0.6, -25.6);
      ctx.quadraticCurveTo(14, -21.6 + (walk ? Math.sin(q * TAU * 2) * 0.8 : 0), 31.6, -26.2);
      ctx.strokeStyle = 'rgba(58,36,18,0.9)';
      ctx.lineWidth = 0.55;
      ctx.stroke();
    }
    ctx.restore();
  },
  shadow(S, fr, m) {
    const f = fr.anim === 4 ? smooth(clamp(fr.q / 0.8)) : 0;
    return { cx: 7, cy: 1.5, rx: lerp(38, 34, f), ry: 8.5, a: 0.3 * (1 - 0.3 * f) };
  },
};
