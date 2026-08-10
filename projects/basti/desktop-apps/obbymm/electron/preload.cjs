const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('obbymmDesktop', {
  platform: process.platform,
  isDesktop: true,
});
