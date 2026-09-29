// Ouvre l'application complète (menus) dans Chromium et lance une partie solo pour vérifier l'interface.
import { App } from '../src/client/screens.js';
(async () => {
  const root = document.getElementById('app') || document.createElement('div');
  root.id = 'app';
  document.body.appendChild(root);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'style.css';
  document.head.appendChild(link);
  const app = new App(root);
  await app.init();
  window.__app = app;
  const mode = location.hash.slice(1) || 'game';
  if (mode === 'menu') return;
  if (mode === 'solo') { app.showSolo(); return; }
  await app.startLocal({ seed: 4, mapSeed: 1789, players: [{ name: 'Jo', civ: 'franks' }, { name: 'Ordinateur', civ: 'gauls', ai: 'moyen' }], startRes: 'riche', speed: 1 }, null);
  const s = window.__game.session;
  for (let i = 0; i < 20 * 100; i++) { s.world.step(); const ev = s.world.events; s.world.events = []; s.builder.pushEvents(ev); }
  s.publish(performance.now());
  console.log('partie lancée');
})();
