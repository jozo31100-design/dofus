// Chars de guerre égyptiens (genre `eg_chariot`) : caisse légère ouverte à l'arrière, essieu reculé, roues à six rayons,
// timon et joug, attelage de deux chevaux empanachés de plumes d'autruche ; un conducteur devant et un combattant derrière
// (archer, lancier ou guerrier au khopesh). Le char regarde vers +x, roues au sol (y = 0).
// Variantes : royal / héros (caisse dorée, archer), light (char léger), heavy (char lourd caparaçonné), assault (roues à faux).
import { PI, TAU, clamp, lerp, smooth, tone, rgba, edge, ell, poly, paint, line, sideGrad, capsule } from './unit-kit.js';
import * as G from './unit-gear.js';
import { drawHuman } from './unit-human.js';
import { idlePose, attackPose, diePose, full } from './unit-poses.js';
import { drawHorse, gallopPose, standPose, fallPose } from './unit-horse.js';
import { spokedWheel, flagPole } from './unit-gauls-parts.js';
import { ostrichPlume, GOLDE, GOLD_D, LAPIS, TURQ, CARNE } from './unit-egypt-gear.js';
import './unit-gauls-poses.js';

const FLOOR = -13.2;
const PLAT_FAR = [2.6, -2.2];
const AIM_MAX = 1.25;

/** Ornements des chevaux : plumes d'autruche entre les oreilles, disque d'or au front. */
const HORSE_HOOKS = {
  head(ctx, H, R, P) {
    const z = R.z;
    const [wx, wy] = R.tf(8.2, -4.2);
    ctx.save();
    ctx.translate(wx, wy);
    ctx.rotate(P.neck + P.pitch * 0.5);
    ostrichPlume(ctx, 6.6 * z, -16.2 * z, 8 * z, H.plume || '#dc4538', 0.15);
    ostrichPlume(ctx, 7.8 * z, -16.0 * z, 7 * z, '#f4f0e2', 0.3);
    ctx.beginPath();
    ell(ctx, 9.2 * z, -11.6 * z, 0.9 * z, 0.9 * z);
    paint(ctx, GOLDE, GOLD_D, 0.4);
    ctx.restore();
  },
};

function horse(coat, mane, tm, o = {}) {
  return { hz: o.hz || 0.86, coat, mane, socks: o.socks, cloth: o.caparison ? undefined : tm.main, clothTrim: GOLDE, caparison: o.caparison ? tm.main : undefined, capTrim: GOLDE, capPattern: 'plain', plume: o.plume || tm.main, bridle: '#3a2412', blaze: o.blaze, hooks: HORSE_HOOKS };
}

/**
 * Description d'un char. o = { type, tm, driver, fighter, hold, style, scale, near, far } ;
 * hold : manière de tenir l'arme du combattant ('bow' | 'spear' | 'sword').
 */
export function chariotSpec(o) {
  const tm = o.tm;
  const style = o.style;
  const gold = style === 'royal' || style === 'hero';
  const heavy = style === 'heavy' || style === 'assault';
  const cab = gold ? { main: '#d9a93a', trim: LAPIS } : style === 'assault' ? { main: '#7a3a26', trim: GOLDE } : style === 'heavy' ? { main: '#b98a4a', trim: GOLDE } : { main: '#e6d9b6', trim: tm.main };
  const near = o.near || horse('#8a5634', '#1c130d', tm, { caparison: heavy, socks: '#e8dcc0', blaze: true });
  const far = o.far || horse('#d9cdb0', '#3a2c20', tm, { caparison: heavy, socks: '#8a7a60', plume: tm.dark });
  return {
    kind: 'eg_chariot',
    type: o.type,
    hold: o.hold,
    hero: !!o.hero,
    ringScale: o.hero ? 1.45 : 1,
    box: [-48, -70, 56, 16],
    cht: { team: tm, style, scale: o.scale || 1, cab, driver: o.driver, fighter: o.fighter, near, far, scythe: style === 'assault', bowcase: o.hold === 'bow' },
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

/** Flanc de la caisse : bas plat, bord supérieur courbe montant vers l'avant, plaque décorée, liseré d'équipe. */
function panel(ctx, dx, dy, far, C) {
  const k = far ? -0.3 : 0;
  const cab = C.cab;
  ctx.beginPath();
  ctx.moveTo(-26 + dx, -10.6 + dy);
  ctx.lineTo(-26 + dx, -17.4 + dy);
  ctx.quadraticCurveTo(-10 + dx, -19.2 + dy, -4 + dx, -24.4 + dy);
  ctx.quadraticCurveTo(-1.6 + dx, -27.4 + dy, -0.4 + dx, -27 + dy);
  ctx.lineTo(-0.4 + dx, -10.6 + dy);
  ctx.closePath();
  paint(ctx, sideGrad(ctx, -26, 0, tone(cab.main, k), 0.22, -0.28, -18), edge(cab.main, 0.85), 0.7);
  // bordure supérieure (cadre de bois)
  ctx.beginPath();
  ctx.moveTo(-26 + dx, -17.4 + dy);
  ctx.quadraticCurveTo(-10 + dx, -19.2 + dy, -4 + dx, -24.4 + dy);
  ctx.quadraticCurveTo(-1.6 + dx, -27.4 + dy, -0.4 + dx, -27 + dy);
  ctx.strokeStyle = tone('#3a2412', k);
  ctx.lineWidth = 2.1;
  ctx.stroke();
  ctx.strokeStyle = tone('#a87840', k);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // lisse basse aux couleurs de l'équipe
  ctx.beginPath();
  poly(ctx, [-26 + dx, -10.6 + dy, -0.4 + dx, -10.6 + dy, -0.4 + dx, -13.2 + dy, -26 + dx, -13.2 + dy]);
  paint(ctx, tone(C.team.main, k), edge(C.team.main, 0.8), 0.45);
  if (!far) {
    // décor : frise de lotus et rosette du soleil
    ctx.fillStyle = cab.trim;
    for (let x = -23; x < -2; x += 3.6) {
      ctx.beginPath();
      poly(ctx, [x, -13.6, x + 1.4, -16.2, x + 2.8, -13.6]);
      ctx.fill();
    }
    ctx.beginPath();
    ell(ctx, -6.6, -19.6, 2.5, 2.5);
    paint(ctx, C.style === 'light' ? C.team.main : GOLDE, GOLD_D, 0.5);
    ctx.beginPath();
    ell(ctx, -6.6, -19.6, 0.9, 0.9);
    ctx.fillStyle = C.style === 'light' ? GOLDE : LAPIS;
    ctx.fill();
  }
}

function tilt(ctx, P) {
  if (P.rot || P.flat !== 1 || P.fx) {
    ctx.translate(P.fx, 0);
    ctx.scale(1, P.flat);
    ctx.rotate(P.rot);
  }
}

/** Faux qui jaillit du moyeu (char d'assaut). */
function scythes(ctx, x, y, r, spin) {
  ctx.lineCap = 'round';
  for (let i = 0; i < 2; i++) {
    const a = spin * 0.5 + i * PI;
    const ex = x + Math.cos(a) * (r + 6.5);
    const ey = y + Math.sin(a) * (r + 6.5) * 0.9;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = '#3a2412';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    poly(ctx, [ex - Math.sin(a) * 1.6, ey + Math.cos(a) * 1.4, ex + Math.cos(a) * 3.4, ey + Math.sin(a) * 3.0, ex + Math.sin(a) * 1.4, ey - Math.cos(a) * 1.2]);
    paint(ctx, '#dfe4ea', 'rgba(30,34,40,0.85)', 0.5);
  }
}

export const EG_CHARIOT = {
  draw(ctx, S, fr) {
    const C = S.cht;
    const tm = C.team;
    const q = fr.q;
    const walk = fr.anim === 1;
    const dying = fr.anim === 4;
    const f = dying ? smooth(clamp(q / 0.85)) : 0;
    const bump = walk ? Math.abs(Math.sin(q * TAU * 2)) * -0.9 : fr.anim === 0 ? 0.25 * Math.sin(q * TAU) : 0;
    const spin = walk ? q * 3 * (TAU / 8) : 0;
    const s = C.scale;

    ctx.save();
    if (s !== 1) ctx.scale(s, s);

    // ----- chevaux -----
    const hpNear = walk ? gallopPose(q) : dying ? fallPose(q) : standPose(fr.anim === 3 ? 0.2 : q);
    const hpFar = walk ? gallopPose(q + 0.09) : dying ? fallPose(Math.min(1, q + 0.08)) : standPose((q + 0.4) % 1);
    const horseAt = (H, hp, x, y) => {
      ctx.save();
      ctx.translate(x, y + (walk ? bump * 0.4 : 0));
      if (dying) ctx.scale(1, hp.flat);
      drawHorse(ctx, H, hp, null);
      ctx.restore();
    };

    ctx.save();
    if (dying) {
      ctx.translate(-14, 0);
      ctx.rotate(0.16 * f);
      ctx.translate(14, 0);
    }

    // roue lointaine
    spokedWheel(ctx, -11.4, -11.6, 9.0, spin, true, 6);
    horseAt(C.far, hpFar, 21 + PLAT_FAR[0], -2.6);
    // timon doré et joug
    ctx.save();
    ctx.translate(0, bump * 0.5);
    ctx.beginPath();
    ctx.moveTo(-3, -11.4);
    ctx.lineTo(25, -17.6);
    ctx.strokeStyle = '#3a2412';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.strokeStyle = C.style === 'light' ? '#b98a4a' : GOLDE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    horseAt(C.near, hpNear, 18, 0.6);
    ctx.beginPath();
    capsule(ctx, 23.4, -21.6, 0.85, 26.6, -17.4, 0.85);
    paint(ctx, sideGrad(ctx, 23, 27, GOLDE, 0.25, -0.25), edge(GOLDE, 0.8), 0.4);

    // ----- caisse -----
    ctx.save();
    ctx.translate(0, bump);
    panel(ctx, PLAT_FAR[0], PLAT_FAR[1], true, C);
    quad(ctx, [-27, -11.2], [-0.4, -11.2], [-0.4 + PLAT_FAR[0], -11.2 + PLAT_FAR[1]], [-27 + PLAT_FAR[0], -11.2 + PLAT_FAR[1]]);
    paint(ctx, '#8a6a42', edge('#8a6a42', 0.7), 0.5);
    ctx.strokeStyle = rgba('#3a2412', 0.45);
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    for (let x = -24; x < 0; x += 2.6) {
      ctx.moveTo(x, -11.2);
      ctx.lineTo(x + PLAT_FAR[0], -11.2 + PLAT_FAR[1]);
    }
    ctx.stroke();

    // conducteur : les deux mains sur les rênes
    {
      const sp = C.driver;
      let P = idlePose('sword', walk ? q : (q * 0.5) % 1, null);
      P = full({ ...P, nT: 0.14, nS: -0.18, fT: -0.12, fS: -0.08, lean: 0.1, ikN: 1, tnx: 6.4, tny: 2.4, bendN: -1, ikF: 1, tfx: 5.4, tfy: 3.2, bendF: -1, cape: walk ? 0.8 : 0.15 });
      ctx.save();
      ctx.translate(-6, FLOOR + PLAT_FAR[1] * 0.2);
      if (dying) {
        const d = diePose(clamp(q * 1.1));
        P = d;
        tilt(ctx, d);
      } else if (walk) ctx.translate(0, Math.sin(q * TAU * 2) * -0.5);
      drawHuman(ctx, sp, P, { weapon: null });
      ctx.restore();
    }
    // combattant
    {
      const sp = C.fighter;
      const hold = S.hold;
      let P;
      if (fr.anim === 3) {
        let aimA = PI / 2;
        if (hold === 'bow') aimA = PI / 2 - (-AIM_MAX + (fr.aim / 10) * 2 * AIM_MAX);
        P = attackPose(hold, q, aimA);
      } else {
        P = idlePose(hold, walk ? q : (q * 0.5) % 1, null);
        if (walk) P = full({ ...P, nT: 0.28, nS: -0.36, fT: 0.3, fS: -0.3, lean: 0.12 + 0.03 * Math.sin(q * TAU * 2), cape: 0.6 });
        else P = full({ ...P, nT: 0.2, nS: -0.26, fT: 0.22, fS: -0.2 });
      }
      ctx.save();
      ctx.translate(-18.5, FLOOR + PLAT_FAR[1] * 0.35);
      if (dying) {
        const d = diePose(clamp(q * 1.1 - 0.05));
        P = d;
        tilt(ctx, d);
        ctx.translate(-2 * f, 0);
      } else if (walk) ctx.translate(0, Math.sin(q * TAU * 2 + 0.8) * -0.6);
      drawHuman(ctx, sp, P, {});
      ctx.restore();
    }

    // flanc proche par-dessus les jambes
    panel(ctx, 0, 0, false, C);
    if (C.bowcase) {
      // étui d'arc et carquois peints sur le flanc, empennages qui dépassent
      ctx.beginPath();
      poly(ctx, [-24, -14, -21.6, -14.6, -13, -22.6, -15.4, -23.4]);
      paint(ctx, '#7a4a2a', edge('#7a4a2a', 0.85), 0.5);
      ctx.beginPath();
      poly(ctx, [-24, -14, -21.6, -14.6, -21.2, -16.4, -23.4, -16.2]);
      paint(ctx, TURQ, edge(TURQ, 0.8), 0.4);
      ctx.strokeStyle = tm.light;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      for (const [a, b] of [[-14.4, -23.2], [-15.6, -23.0], [-13.2, -22.4]]) {
        ctx.moveTo(a, b);
        ctx.lineTo(a - 0.6, b - 2.4);
      }
      ctx.stroke();
    } else {
      // bouclier de peau accroché
      G.shield(ctx, -14, -17.2, 1, 'round', tm.main, 0.7, 0, 'segments');
    }
    flagPole(ctx, -25.4, -17.4, 16, tm.main, walk ? Math.sin(q * TAU * 2) * 1.2 : Math.sin(q * TAU) * 0.6, 8);
    ctx.restore();

    // ----- roue proche -----
    ctx.save();
    ctx.translate(0, bump * 0.6);
    line(ctx, -14, -9.2, -11.4, -11.6, '#3a2412', 1.6);
    if (C.scythe) scythes(ctx, -14.6, -9.4, 9.4, spin);
    spokedWheel(ctx, -14.6, -9.4, 9.4, spin, false, 6);
    // cerclage doré des chars royaux
    if (C.style === 'royal' || C.style === 'hero') {
      ctx.beginPath();
      ell(ctx, -14.6, -9.4, 9.4 * 0.88 - 0.3, 9.4 - 0.3);
      ctx.strokeStyle = rgba(GOLDE, 0.75);
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }
    ctx.restore();

    // rênes
    if (!dying) {
      ctx.beginPath();
      ctx.moveTo(-0.6, -25.6);
      ctx.quadraticCurveTo(14, -21.6 + (walk ? Math.sin(q * TAU * 2) * 0.8 : 0), 31.6, -26.2);
      ctx.strokeStyle = 'rgba(58,36,18,0.9)';
      ctx.lineWidth = 0.55;
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  },
  shadow(S, fr) {
    const s = S.cht.scale;
    const f = fr.anim === 4 ? smooth(clamp(fr.q / 0.8)) : 0;
    return { cx: 7 * s, cy: 1.5, rx: lerp(38, 34, f) * s, ry: 8.5 * s, a: 0.3 * (1 - 0.3 * f) };
  },
};

void CARNE;
