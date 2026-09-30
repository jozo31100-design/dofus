// Crochets de dessin des costumes égyptiens (sp.hooks = HOOKS, cf. unit-human.js) : coiffes et couronnes, khôl et barbe
// postiche, collier usekh, peau de léopard, écailles, tablier royal, armes et boucliers propres. Chaque crochet lit les
// champs x* du costume : xhelm { kind, … }, xkohl, xbeard, xtorso [noms], xshield { kind, s }.
import * as E from './unit-egypt-gear.js';

// ---------------------------------------------------------------------------
// Tête
// ---------------------------------------------------------------------------

function helmetHook(ctx, sp, r, lw) {
  const h = sp.xhelm;
  if (!h) return false;
  switch (h.kind) {
    case 'nemes': E.nemes(ctx, r, lw, h); return true;
    case 'wig': E.wig(ctx, r, lw, h); return true;
    case 'white': E.whiteCrown(ctx, r, lw, h); return true;
    case 'red': E.redCrown(ctx, r, lw, h); return true;
    case 'blue': E.blueCrown(ctx, r, lw, h); return true;
    case 'pschent': E.pschent(ctx, r, lw, h); return true;
    case 'hathor': E.hathorDisc(ctx, r, lw, h); return true;
    case 'vulture': E.vultureCap(ctx, r, lw, h); return true;
    case 'cap': E.skullcap(ctx, r, lw, h); return true;
    case 'cloth': E.headcloth(ctx, r, lw, h); return true;
    case 'nubian': E.nubianHair(ctx, r, lw, h); return true;
    case 'lion': E.lionHead(ctx, r, lw, h); return true;
    case 'bald': return true; // prêtre au crâne rasé : rien à poser
    default: return false;
  }
}

function headHook(ctx, sp, r, lw) {
  if (sp.xkohl) E.kohl(ctx);
  if (sp.xbeard) E.falseBeard(ctx, sp.xbeard.c, sp.xbeard.c2);
  void r; void lw;
}

// ---------------------------------------------------------------------------
// Derrière le corps : retombées du nemes et des perruques (dans le repère de la tête)
// ---------------------------------------------------------------------------

function backHook(ctx, sp, R) {
  const h = sp.xhelm;
  if (!h) return;
  const k = h.kind;
  const nemesLike = k === 'nemes';
  const wigLike = k === 'wig' || k === 'hathor' || k === 'vulture';
  if (!nemesLike && !wigLike && k !== 'cloth') return;
  ctx.save();
  ctx.translate(R.head[0], R.head[1]);
  ctx.rotate(R.headA);
  ctx.scale(R.z, R.z);
  if (nemesLike) E.nemesBack(ctx, 3.55, h);
  else if (wigLike) E.wigBack(ctx, 3.55, h.long ? { back: 8.4 } : {});
  else if (k === 'cloth') {
    // pan de foulard dans le dos
    ctx.beginPath();
    ctx.moveTo(-5.2, 0.4);
    ctx.quadraticCurveTo(-5.9, 3.0, -5.3, 6.0);
    ctx.lineTo(-1.6, 5.6);
    ctx.lineTo(-0.4, 0.8);
    ctx.closePath();
    ctx.fillStyle = h.c || E.LINEN;
    ctx.fill();
    ctx.strokeStyle = 'rgba(90,70,40,0.6)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Torse (repère du torse)
// ---------------------------------------------------------------------------

function torsoHook(ctx, sp) {
  const list = sp.xtorso;
  if (!list) return;
  for (const n of list) {
    switch (n) {
      case 'usekh': E.usekh(ctx); break;
      case 'leopard': E.leopard(ctx); break;
      case 'scales': E.scales(ctx, sp.xscales || {}); break;
      case 'apron': E.apron(ctx, (sp.hem || 4) + 0.6, sp.xapron && sp.xapron.c1, sp.xapron && sp.xapron.c2); break;
      case 'pleats': E.pleats(ctx, sp.hem || 4); break;
      case 'bulltail': E.bullTail(ctx); break;
      default: break;
    }
  }
}

// ---------------------------------------------------------------------------
// Armes et boucliers
// ---------------------------------------------------------------------------

function weaponHook(ctx, sp, R, P, weapon) {
  const [x, y] = R.handN;
  const z = R.z;
  switch (weapon) {
    case 'khopesh': E.khopesh(ctx, x, y, P.wA, z, sp.xweapon || {}); return true;
    case 'mace': E.pearMace(ctx, x, y, P.wA, z); return true;
    case 'ankhStaff': E.ankhStaff(ctx, x, y, P.wA, z); return true;
    case 'crook': E.crookScepter(ctx, x, y, P.wA, z); return true;
    default: return false;
  }
}

function shieldHook(ctx, sp, ex, ey, z) {
  const s = sp.xshield;
  if (!s) return false;
  E.egyptShield(ctx, ex, ey, z, s.kind, sp.shield.face, s.s || 1);
  return true;
}

export const HOOKS = {
  helmet: helmetHook,
  head: headHook,
  back: backHook,
  torso: torsoHook,
  weapon: weaponHook,
  shield: shieldHook,
};
