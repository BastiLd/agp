const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  searchTitles: (query, type) => ipcRenderer.invoke('search-titles', { query, type }),
  getWatchProviders: (id, type) => ipcRenderer.invoke('get-watch-providers', { id, type }),
  getStore: (key) => ipcRenderer.invoke('get-store', key),
  setStore: (key, value) => ipcRenderer.invoke('set-store', { key, value })
}); 