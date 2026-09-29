// Point d'entrée du jeu (page web chargée par Electron).
import { App } from './screens.js';

window.addEventListener('error', (e) => console.error('Erreur :', e.message, e.filename, e.lineno));
window.addEventListener('unhandledrejection', (e) => console.error('Promesse rejetée :', e.reason));

const app = new App(document.getElementById('app'));
window.__app = app;
app.init();
