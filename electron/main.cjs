'use strict';
// Processus principal d'Electron : fenêtre, réseau local (TCP/UDP) et pont IPC vers le jeu.

const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const netcore = require('./netcore.cjs');

// Sous Linux en root (conteneurs de test), le bac à sable Chromium ne peut pas démarrer.
if (process.platform === 'linux' && typeof process.getuid === 'function' && process.getuid() === 0) {
  app.commandLine.appendSwitch('no-sandbox');
}
// L'hôte fait tourner la simulation : elle ne doit pas ralentir si la fenêtre est masquée.
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
if (process.env.TDG_DISABLE_GPU) app.disableHardwareAcceleration();

app.setAppUserModelId('fr.terresdegaule.game');

let win = null;
let host = null;
let client = null;
let beacon = null;
let backlogTimer = null;

const isDev = !app.isPackaged;

function send(channel, payload) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}

function stopNetwork() {
  if (backlogTimer) { clearInterval(backlogTimer); backlogTimer = null; }
  if (beacon) { beacon.stop(); beacon = null; }
  if (host) { host.close(); host = null; }
  if (client) { client.close(); client = null; }
}

function startBacklogReports() {
  if (backlogTimer) clearInterval(backlogTimer);
  backlogTimer = setInterval(() => {
    const link = host || client;
    send('net:event', { type: 'backlog', bytes: link ? link.backlog() : 0 });
  }, 250);
}

function createWindow() {
  const iconPath = path.join(__dirname, '..', 'build', 'icon.png');
  win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 600,
    backgroundColor: '#15100c',
    show: false,
    title: 'Terres de Gaule',
    autoHideMenuBar: true,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
      spellcheck: false,
    },
  });
  win.once('ready-to-show', () => {
    win.show();
    if (process.env.TDG_FULLSCREEN) win.setFullScreen(true);
  });
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen());
      e.preventDefault();
    } else if (input.control && input.shift && String(input.key).toUpperCase() === 'I' && (isDev || process.env.TDG_DEVTOOLS)) {
      win.webContents.toggleDevTools();
    }
  });
  win.on('closed', () => { win = null; });
}

// --------------------------------------------------------------------------
// IPC : réseau
// --------------------------------------------------------------------------

ipcMain.handle('app:info', () => ({
  version: app.getVersion(),
  platform: process.platform,
  hostname: os.hostname(),
  addresses: netcore.localAddresses(),
  defaultPort: netcore.DEFAULT_PORT,
}));

ipcMain.handle('net:host', async (_e, opts = {}) => {
  stopNetwork();
  const name = String(opts.name || 'Hôte').slice(0, 24);
  const h = new netcore.GameHost({ name });
  try {
    await h.listen(Number(opts.port) || netcore.DEFAULT_PORT);
  } catch (err) {
    return { ok: false, error: (err && err.code) || String(err) };
  }
  host = h;
  h.on('guest', (hello) => send('net:event', { type: 'guest', hello }));
  h.on('guest-left', (reason) => send('net:event', { type: 'guest-left', reason }));
  h.on('message', (line) => send('net:msg', line));
  h.on('error', (err) => send('net:event', { type: 'error', error: String(err && err.message) }));
  beacon = new netcore.Beacon({
    getInfo: () => (host ? { name, port: host.port, state: host.guest ? 'full' : 'open' } : null),
  });
  beacon.start();
  startBacklogReports();
  return { ok: true, port: h.port, addresses: netcore.localAddresses() };
});

ipcMain.handle('net:join', async (_e, opts = {}) => {
  stopNetwork();
  const c = new netcore.GameClient();
  try {
    const welcome = await c.connect(String(opts.ip || '').trim(), Number(opts.port) || netcore.DEFAULT_PORT,
      { name: String(opts.name || 'Invité').slice(0, 24) });
    client = c;
    c.on('message', (line) => send('net:msg', line));
    c.on('closed', (reason) => send('net:event', { type: 'closed', reason }));
    startBacklogReports();
    return { ok: true, welcome };
  } catch (err) {
    c.close();
    return { ok: false, error: (err && err.message) || 'erreur' };
  }
});

ipcMain.handle('net:discover', async () => {
  try {
    return await netcore.discover({ timeoutMs: 1400 });
  } catch (e) {
    return [];
  }
});

ipcMain.on('net:send', (_e, line) => {
  const link = host || client;
  if (link && typeof line === 'string') link.send(line);
});

ipcMain.on('net:close', () => stopNetwork());

ipcMain.on('app:quit', () => app.quit());
ipcMain.on('window:fullscreen', () => {
  if (win) win.setFullScreen(!win.isFullScreen());
});
ipcMain.handle('window:is-fullscreen', () => (win ? win.isFullScreen() : false));

// --------------------------------------------------------------------------

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  stopNetwork();
  app.quit();
});

app.on('before-quit', () => stopNetwork());
