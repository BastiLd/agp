const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');
const Store = require('electron-store');

const store = new Store();

const TMDB_API_KEY = process.env.TMDB_API_KEY || 'DEIN_TMDB_KEY_HIER'; // <-- Hier eigenen API-Key eintragen
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:3000');
  } else {
    win.loadFile(path.join(__dirname, 'renderer', 'build', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC: Suche nach Filmen/Serien
ipcMain.handle('search-titles', async (event, { query, type }) => {
  try {
    const url = `${TMDB_BASE_URL}/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
    const res = await axios.get(url);
    return res.data.results;
  } catch (err) {
    return { error: err.message };
  }
});

// IPC: Hole Watch-Provider für einen Film/Serie
ipcMain.handle('get-watch-providers', async (event, { id, type }) => {
  try {
    const url = `${TMDB_BASE_URL}/${type}/${id}/watch/providers?api_key=${TMDB_API_KEY}`;
    const res = await axios.get(url);
    return res.data.results;
  } catch (err) {
    return { error: err.message };
  }
});

// IPC: Lese/Schreibe Favoriten/Suchverlauf
ipcMain.handle('get-store', (event, key) => store.get(key, []));
ipcMain.handle('set-store', (event, { key, value }) => store.set(key, value)); 