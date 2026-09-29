// Mesure de performance : grosse bataille (2 x 120 unités) dans la vue, en logiciel (sans GPU).
import { HostSession } from '../src/client/session.js';
import { Renderer } from '../src/client/render.js';
(async () => {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width:100vw;height:100vh;display:block';
  document.body.appendChild(canvas);
  const session = new HostSession({ seed: 9, players: [{ name: 'Jo', civ: 'franks' }, { name: 'IA', civ: 'gauls', ai: 'moyen' }], startRes: 'riche', revealMap: true });
  const w = session.world;
  const r = new Renderer(canvas, session.state, { speed: 1 });
  await r.init();
  const types = ['militia', 'spearman', 'archer', 'cavalry', 'swordsman', 'knight', 'champion', 'crossbow'];
  for (let i = 0; i < 120; i++) {
    const t = types[i % types.length];
    w.addUnit(t, 0, 44 + (i % 12) * 0.7, 40 + Math.floor(i / 12) * 0.7);
    w.addUnit(types[(i + 3) % types.length], 1, 53 + (i % 12) * 0.7, 40 + Math.floor(i / 12) * 0.7);
  }
  for (let i = 0; i < 20 * 20; i++) { w.step(); const ev = w.events; w.events = []; session.builder.pushEvents(ev); }
  session.publish(performance.now());
  r.centerOn(48, 44);
  let n = 0; const times = [];
  function loop(now) {
    r.frame(now, { selected: new Set() });
    times.push(r.frameTime);
    n++;
    if (n < 90) requestAnimationFrame(loop);
    else {
      times.sort((a, b) => a - b);
      console.log(`unités: ${w.units.length}, objets dessinés: ${r.stats.drawn}, image médiane ${times[45].toFixed(1)} ms, p90 ${times[81].toFixed(1)} ms, pire ${times[89].toFixed(1)} ms`);
    }
  }
  requestAnimationFrame(loop);
  // avance la simulation pendant les mesures pour inclure les effets
  const iv = setInterval(() => { for (let i = 0; i < 2; i++) { w.step(); const ev = w.events; w.events = []; session.builder.pushEvents(ev); } session.publish(performance.now()); if (n >= 90) clearInterval(iv); }, 50);
})();
