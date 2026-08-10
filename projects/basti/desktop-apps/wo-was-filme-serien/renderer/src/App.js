import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const COUNTRY_COORDS = {
  // Beispiel: 'DE': [51.1657, 10.4515], ...
  US: [37.0902, -95.7129],
  DE: [51.1657, 10.4515],
  FR: [46.6034, 1.8883],
  GB: [55.3781, -3.4360],
  // ... weitere Länder nach Bedarf
};

const PROVIDER_NAMES = {
  8: 'Netflix',
  9: 'Amazon Prime Video',
  337: 'Disney+',
  384: 'WOW',
  350: 'Apple TV+',
  // ... weitere Provider nach Bedarf
};

function App() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('movie');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [providers, setProviders] = useState({});
  const [countryFilter, setCountryFilter] = useState('');
  const [dark, setDark] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);

  // Dark Mode Toggle
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  // Lade Favoriten & Verlauf
  useEffect(() => {
    window.api.getStore('favorites').then(setFavorites);
    window.api.getStore('history').then(setHistory);
  }, []);

  // Suche
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;
    const res = await window.api.searchTitles(query, type);
    setResults(res || []);
    setSelected(null);
    setProviders({});
    // Verlauf speichern
    window.api.setStore('history', [query, ...history.filter(q => q !== query)].slice(0, 10));
    setHistory([query, ...history.filter(q => q !== query)].slice(0, 10));
  };

  // Hole Watch-Provider
  const fetchProviders = async (item) => {
    setSelected(item);
    setProviders({});
    const res = await window.api.getWatchProviders(item.id, type);
    setProviders(res || {});
  };

  // Favorit hinzufügen
  const addFavorite = (item) => {
    if (favorites.find(f => f.id === item.id && f.type === type)) return;
    const newFavs = [{ ...item, type }, ...favorites].slice(0, 20);
    setFavorites(newFavs);
    window.api.setStore('favorites', newFavs);
  };

  // Länder für Filter
  const availableCountries = Object.keys(providers).sort();

  // Weltkarte Marker
  const mapMarkers = Object.entries(providers)
    .filter(([cc]) => !countryFilter || cc === countryFilter)
    .map(([cc, prov]) =>
      COUNTRY_COORDS[cc] ? (
        <Marker key={cc} position={COUNTRY_COORDS[cc]}>
          <Popup>
            <b>{cc}</b><br />
            {prov.flatrate?.map(p => PROVIDER_NAMES[p.provider_id] || p.provider_name).join(', ') || 'Keine Flatrate'}
          </Popup>
        </Marker>
      ) : null
    );

  return (
    <div className={`min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors`}> 
      <header className="p-4 flex flex-col md:flex-row items-center justify-between gap-2 border-b dark:border-gray-700">
        <h1 className="text-2xl font-bold">Wo was Filme Serien</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setDark(d => !d)} className="px-2 py-1 rounded border dark:border-gray-600">{dark ? '☀️' : '🌙'} Dark Mode</button>
        </div>
      </header>
      <main className="p-4 max-w-4xl mx-auto">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-2 mb-4">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Filmtitel oder Serie..." className="flex-1 px-3 py-2 rounded border dark:bg-gray-800 dark:border-gray-600" />
          <select value={type} onChange={e => setType(e.target.value)} className="px-2 py-2 rounded border dark:bg-gray-800 dark:border-gray-600">
            <option value="movie">Film</option>
            <option value="tv">Serie</option>
          </select>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Suchen</button>
        </form>
        {history.length > 0 && (
          <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">Letzte Suchen: {history.map((h, i) => <button key={i} className="underline mr-2" onClick={() => { setQuery(h); setType('movie'); }}>{h}</button>)}</div>
        )}
        <div className="grid md:grid-cols-2 gap-4">
          <section>
            <h2 className="font-semibold mb-2">Ergebnisse</h2>
            <ul>
              {results.map(item => (
                <li key={item.id} className="mb-2 p-2 rounded border dark:border-gray-700 flex flex-col gap-1 bg-white dark:bg-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{item.title || item.name}</span>
                    <button onClick={() => addFavorite(item)} title="Favorit" className="ml-auto text-yellow-500">★</button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => fetchProviders(item)} className="text-blue-600 underline">Verfügbarkeiten anzeigen</button>
                  </div>
                </li>
              ))}
            </ul>
            {selected && (
              <div className="mt-4">
                <h3 className="font-semibold">Verfügbarkeit für: {selected.title || selected.name}</h3>
                <div className="mb-2">
                  <label>Land filtern: </label>
                  <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)} className="px-2 py-1 rounded border dark:bg-gray-800 dark:border-gray-600">
                    <option value="">Alle</option>
                    {availableCountries.map(cc => <option key={cc} value={cc}>{cc}</option>)}
                  </select>
                </div>
                <ul>
                  {Object.entries(providers)
                    .filter(([cc]) => !countryFilter || cc === countryFilter)
                    .map(([cc, prov]) => (
                      <li key={cc} className="mb-1">
                        <b>{cc}:</b> {prov.flatrate?.map(p => PROVIDER_NAMES[p.provider_id] || p.provider_name).join(', ') || 'Keine Flatrate'}
                      </li>
                    ))}
                </ul>
                {Object.keys(providers).length === 0 && <div className="text-red-500 mt-2">In deinem Land nicht verfügbar? Probiere es mit einem VPN.</div>}
              </div>
            )}
          </section>
          <section>
            <h2 className="font-semibold mb-2">Weltkarte</h2>
            <div className="h-64 rounded overflow-hidden border dark:border-gray-700">
              <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {mapMarkers}
              </MapContainer>
            </div>
            <h2 className="font-semibold mt-4 mb-2">Favoriten</h2>
            <ul>
              {favorites.map(fav => (
                <li key={fav.id} className="mb-1 flex items-center gap-2">
                  <span>{fav.title || fav.name}</span>
                  <span className="text-xs text-gray-400">({fav.type === 'movie' ? 'Film' : 'Serie'})</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
      <footer className="p-4 text-center text-xs text-gray-500 dark:text-gray-400 border-t dark:border-gray-700">
        Daten: TMDb & JustWatch | <a href="https://www.themoviedb.org/" className="underline">TMDb API</a> | Attribution erforderlich
      </footer>
    </div>
  );
}

export default App; 