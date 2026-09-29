'use strict';
// Pont sécurisé entre le jeu (page web) et le processus principal.
const { contextBridge, ipcRenderer } = require('electron');

const listeners = { msg: new Set(), event: new Set() };

ipcRenderer.on('net:msg', (_e, line) => {
  for (const cb of listeners.msg) cb(line);
});
ipcRenderer.on('net:event', (_e, ev) => {
  for (const cb of listeners.event) cb(ev);
});

contextBridge.exposeInMainWorld('tdg', {
  info: () => ipcRenderer.invoke('app:info'),
  host: (opts) => ipcRenderer.invoke('net:host', opts),
  join: (opts) => ipcRenderer.invoke('net:join', opts),
  discover: () => ipcRenderer.invoke('net:discover'),
  send: (line) => ipcRenderer.send('net:send', line),
  closeNet: () => ipcRenderer.send('net:close'),
  onMessage: (cb) => {
    listeners.msg.add(cb);
    return () => listeners.msg.delete(cb);
  },
  onEvent: (cb) => {
    listeners.event.add(cb);
    return () => listeners.event.delete(cb);
  },
  toggleFullscreen: () => ipcRenderer.send('window:fullscreen'),
  isFullscreen: () => ipcRenderer.invoke('window:is-fullscreen'),
  quit: () => ipcRenderer.send('app:quit'),
});
