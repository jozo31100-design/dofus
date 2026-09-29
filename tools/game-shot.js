// Banc d'essai visuel : lance une partie solo, fait tourner le temps et dessine la scène.
import { HostSession } from '../src/client/session.js';
import { Renderer } from '../src/client/render.js';

(async () => {
const canvas = document.createElement('canvas');
canvas.style.cssText = 'width:100vw;height:100vh;display:block';
document.body.appendChild(canvas);
const session = new HostSession({ seed: 3, players: [{ name: 'Jo', civ: 'franks' }, { name: 'IA', civ: 'gauls', ai: 'moyen' }], startRes: 'riche', revealMap: false });
const r = new Renderer(canvas, session.state, { speed: 1 });
await r.init();
// on avance vite dans la partie
const w = session.world;
for (let i = 0; i < 20 * 150; i++) { w.step(); const ev = w.events; w.events = []; session.builder.pushEvents(ev); }
session.publish(performance.now());
const hall = w.playerBuildings(0, 'hall')[0];
r.centerOn(hall.x, hall.y + 2);
window.__r = r;
window.__s = session;
let n = 0;
function loop(now) { r.frame(now, { selected: new Set(w.playerUnits(0, 'villager').slice(0, 3).map((u) => u.id)) }); n++; if (n < 30) requestAnimationFrame(loop); else console.log('rendu ok, dernier temps de trame', r.frameTime.toFixed(1), 'ms, entités dessinées', r.stats.drawn); }
requestAnimationFrame(loop);
})();
