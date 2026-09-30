// Contrôle de robustesse du dessin : toutes les combinaisons doivent se dessiner sans erreur ni valeur invalide.
import * as art from '../src/client/art/index.js';
import { UNITS, BUILDINGS, TECHS, ANIMALS, NODES, CIV_IDS } from '../src/core/defs.js';
import { ICON_NAMES, TECH_ICON_IDS } from '../src/client/art/icons.js';

(async () => {
  const c = document.createElement('canvas');
  c.width = 400; c.height = 300;
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  const problems = [];
  const t0 = performance.now();
  let count = 0;
  const attempt = (label, fn) => {
    try { fn(); count++; } catch (e) { problems.push(`${label} : ${e.message}`); }
  };
  const anims = ['idle', 'walk', 'work', 'attack', 'die'];
  const works = [undefined, 'wood', 'mine', 'farm', 'forage', 'build', 'repair', 'hunt', 'butcher', 'fish', 'heal', 'climb'];
  const carries = [null, 'wood', 'food', 'gold', 'stone'];
  for (const type of Object.keys(UNITS)) {
    for (const civ of CIV_IDS) {
      if (UNITS[type].civ && UNITS[type].civ !== civ) continue;
      for (const team of [0, 1]) for (const anim of anims) for (const dir of [1, -1]) {
        for (const work of anim === 'work' ? works : [undefined]) for (const carry of type === 'villager' || type === 'fishingboat' ? carries : [null]) {
          attempt(`unité ${type}/${civ}/${team}/${anim}/${dir}/${work}/${carry}`, () => {
            ctx.clearRect(0, 0, 400, 300);
            for (const t of [0, 0.13, 0.5, 1.7]) art.drawUnit(ctx, { type, civ, team, sx: 200, sy: 220, t, anim, dir, aim: 0.7, work, carry, deathT: Math.min(1, t), scale: 1 });
          });
        }
      }
    }
    attempt(`métriques ${type}`, () => { const m = art.unitMetrics(type); if (!(m.h > 5 && m.w > 2)) throw new Error('métriques invalides ' + JSON.stringify(m)); });
    for (const civ of CIV_IDS) attempt(`portrait ${type}/${civ}`, () => { ctx.clearRect(0, 0, 400, 300); art.drawPortrait(ctx, type, civ, 1, 64); });
  }
  for (const type of Object.keys(ANIMALS)) for (const anim of ['idle', 'walk', 'flee', 'die']) for (const dir of [1, -1]) {
    attempt(`animal ${type}/${anim}`, () => art.drawAnimal(ctx, { type, sx: 100, sy: 100, t: 0.4, anim, dir, deathT: 0.5 }));
  }
  for (const type of ['tree', 'berries', 'gold', 'stone', 'carcass', 'fish']) for (let v = 0; v < 12; v++) for (const frac of [0.05, 0.3, 0.6, 1]) {
    attempt(`ressource ${type}/${v}/${frac}`, () => { const s = art.getNodeSprite(type, v, frac); if (!s || !s.canvas || !(s.canvas.width > 4)) throw new Error('sprite vide'); if (!(s.ax >= 0 && s.ay >= 0 && s.ay <= s.canvas.height)) throw new Error('ancre invalide'); });
  }
  for (const kind of ['arrow', 'axe', 'stone', 'bolt']) attempt(`projectile ${kind}`, () => art.drawProjectile(ctx, kind, 50, 50, 0.5, 0.2));
  for (const type of Object.keys(BUILDINGS)) {
    for (const civ of CIV_IDS) for (const team of [0, 1]) for (const stage of [0, 1, 2, 3]) {
      attempt(`bâtiment ${type}/${civ}/${team}/${stage}`, () => {
        const s = art.getBuildingSprite(type, civ, team, stage);
        if (!s || !s.canvas) throw new Error('pas de sprite');
        const n = BUILDINGS[type].size;
        if (stage === 3 && !(s.canvas.width >= n * 38)) throw new Error(`largeur ${s.canvas.width} trop faible pour ${n} cases`);
        if (!(s.ax > 0 && s.ax < s.canvas.width && s.ay > 0 && s.ay < s.canvas.height)) throw new Error('ancre hors du sprite');
        if (!(s.h >= 0)) throw new Error('hauteur invalide');
      });
    }
    attempt(`métriques ${type}`, () => { const m = art.buildingMetrics(type); if (!(m.h >= 0)) throw new Error('hauteur invalide'); });
    for (const civ of CIV_IDS) attempt(`portrait bâtiment ${type}/${civ}`, () => art.drawPortrait(ctx, type, civ, 0, 64));
    for (let size = 1; size <= 6; size++) attempt(`gravats ${size}`, () => { const r = art.getRubbleSprite(size, 3); if (!r.canvas) throw new Error('vide'); });
  }
  for (const id of Object.keys(TECHS)) attempt(`icône tech ${id}`, () => art.drawTechIcon(ctx, id, 48));
  for (const name of ['food', 'wood', 'gold', 'stone', 'pop', 'attack', 'stop', 'delete', 'repair', 'garrison', 'ungarrison', 'cancel', 'rally', 'build-eco', 'build-mil', 'age', 'hammer', 'sword', 'shield', 'bow', 'flag', 'menu', 'pause', 'idle-villager', 'clock', 'heal', 'check', 'lock', 'axe', 'pickaxe', 'meat', 'berries', 'wheat', 'house', 'castle', 'fish', 'coin', 'crown', 'ship', 'hero', 'buy-food', 'buy-wood', 'buy-stone', 'sell-food', 'sell-wood', 'sell-stone']) {
    attempt(`icône ${name}`, () => art.drawIcon(ctx, name, 32));
  }
  // Contrôles de contenu : le dessin doit laisser des pixels (pas d'image vide) et chaque id doit avoir son art
  const inked = (label, fn, min = 40) => attempt(label, () => {
    ctx.clearRect(0, 0, 400, 300);
    fn();
    const d = ctx.getImageData(0, 0, 400, 300).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 20) n++;
    if (n < min) throw new Error(`dessin vide (${n} pixels)`);
  });
  for (const type of ['sapper', 'siegetower']) for (const civ of CIV_IDS) for (const team of [0, 1]) {
    for (const anim of anims) inked(`vide ${type}/${civ}/${team}/${anim}`, () => art.drawUnit(ctx, { type, civ, team, sx: 200, sy: 220, t: 0.2, anim, dir: 1, deathT: 0.2, aim: 0.3 }), 150);
    attempt(`métriques dédiées ${type}`, () => { const m = art.unitMetrics(type); if (m.h < 30 || (type === 'siegetower' && m.h < 90)) throw new Error('métriques par défaut'); });
  }
  for (const civ of CIV_IDS) for (const type of ['villager', 'militia', 'spearman', 'swordsman', 'champion', 'archer', 'crossbow', 'francisque', 'gesate', 'sapper']) {
    for (const t of [0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.85]) {
      inked(`escalade ${type}/${civ}/${t}`, () => art.drawUnit(ctx, { type, civ, team: 0, sx: 200, sy: 220, t, anim: 'work', work: 'climb', dir: t > 0.5 ? -1 : 1 }), 300);
    }
  }
  for (const id of Object.keys(UNITS)) attempt(`id unité ${id}`, () => {
    const m = art.unitMetrics(id);
    if (id !== 'villager' && m === art.unitMetrics('villager')) throw new Error('métriques par défaut (type non dessiné)');
    for (const civ of CIV_IDS) {
      if (UNITS[id].civ && UNITS[id].civ !== civ) continue;
      ctx.clearRect(0, 0, 400, 300);
      art.drawUnit(ctx, { type: id, civ, team: 0, sx: 200, sy: 220, t: 0.3, anim: 'idle', dir: 1 });
      const d = ctx.getImageData(0, 0, 400, 300).data;
      let n = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 20) n++;
      if (n < 80) throw new Error(`rien de dessiné (${civ})`);
    }
  });
  for (const id of Object.keys(TECHS)) {
    attempt(`art de la tech ${id}`, () => { if (!TECH_ICON_IDS.includes(id)) throw new Error('pas d\'icône dédiée (point d\'interrogation)'); });
    for (const size of [20, 32, 64]) inked(`icône tech ${id}/${size}`, () => art.drawTechIcon(ctx, id, size), 200);
  }
  for (const name of ['star', 'choice', 'wall', 'gate', 'ladder', 'unit-special', 'build-civ', 'build-def', 'choices', 'climb', 'hero']) {
    attempt(`icône ${name} connue`, () => { if (!ICON_NAMES.includes(name)) throw new Error('icône inconnue'); });
    for (const size of [20, 44, 64]) inked(`icône ${name}/${size}`, () => art.drawIcon(ctx, name, size), 100);
  }
  const tt = performance.now();
  const size = 96;
  const terrain = new Uint8Array(size * size);
  for (let i = 0; i < size * size; i++) { const x = i % size; const y = (i / size) | 0; terrain[i] = Math.abs(x - y) < 3 ? 2 : Math.abs(x - y) < 4 ? 1 : 0; }
  let terr = null;
  attempt('terrain', () => { terr = art.renderTerrainTexture(terrain, size, size, 1789); if (terr.width !== size * art.TERRAIN_PPT) throw new Error('taille du terrain'); });
  const terrMs = performance.now() - tt;
  // vitesse de dessin : 400 unités par image (1re passe : cache froid, 2e passe : cache chaud)
  const types = Object.keys(UNITS);
  const pass = () => {
    const tb = performance.now();
    for (let f = 0; f < 20; f++) {
      ctx.clearRect(0, 0, 400, 300);
      for (let i = 0; i < 400; i++) {
        const type = types[i % types.length];
        const civ = UNITS[type].civ || CIV_IDS[i % 2];
        art.drawUnit(ctx, { type, civ, team: i % 2, sx: 20 + (i % 20) * 18, sy: 40 + Math.floor(i / 20) * 12, t: f * 0.05 + i * 0.01, anim: ['idle', 'walk', 'work', 'attack'][i % 4], dir: i % 3 ? 1 : -1, work: 'wood', carry: null, scale: 1 });
      }
    }
    return (performance.now() - tb) / 20;
  };
  const coldMs = pass();
  const perFrame = pass();
  console.log(`${count} dessins vérifiés, ${problems.length} problème(s), durée totale ${Math.round(performance.now() - t0)} ms`);
  console.log(`terrain 96x96 : ${Math.round(terrMs)} ms ; 400 unités par image : ${coldMs.toFixed(1)} ms à froid, ${perFrame.toFixed(1)} ms à chaud`);
  for (const p of problems.slice(0, 120)) console.error('PROBLÈME', p);
  if (problems.length > 120) console.error(`… et ${problems.length - 120} autres`);
})();
