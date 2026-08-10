'use client';

import { useState } from 'react';
import { SpeciesType, ServiceType } from '../data/mockVets';
import { 
  Cat, 
  Dog, 
  Rabbit, 
  Activity, 
  Home, 
  Heart, 
  Calendar, 
  MapPin, 
  CheckSquare, 
  Square, 
  ShieldAlert, 
  Search, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface SearchFiltersProps {
  selectedSpecies: SpeciesType | '';
  setSelectedSpecies: (species: SpeciesType | '') => void;
  selectedSituation: ServiceType | '';
  setSelectedSituation: (situation: ServiceType | '') => void;
  selectedDistrict: string;
  setSelectedDistrict: (district: string) => void;
  onlyConfirmed: boolean;
  setOnlyConfirmed: (val: boolean) => void;
  customSpecies: string;
  setCustomSpecies: (val: string) => void;
}

const DISTRICTS = [
  'Villach',
  'Klagenfurt',
  'Spittal',
  'Wolfsberg',
  'St. Veit',
  'Feldkirchen',
  'Völkermarkt',
  'Hermagor'
];

const QUICK_ANIMAL_SUGGESTIONS = [
  'Vogel',
  'Reptil',
  'Meerschweinchen',
  'Hamster',
  'Pferd',
  'Schildkröte',
  'Frettchen',
  'Fisch'
];

export default function SearchFilters({
  selectedSpecies,
  setSelectedSpecies,
  selectedSituation,
  setSelectedSituation,
  selectedDistrict,
  setSelectedDistrict,
  onlyConfirmed,
  setOnlyConfirmed,
  customSpecies,
  setCustomSpecies
}: SearchFiltersProps) {
  
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [tempCustomVal, setTempCustomVal] = useState(customSpecies);

  const speciesList: { value: SpeciesType; label: string; Icon: any }[] = [
    { value: 'Katze', label: 'Katze', Icon: Cat },
    { value: 'Hund', label: 'Hund', Icon: Dog },
    { value: 'Kleintier', label: 'Kleintier', Icon: Rabbit },
  ];

  const handleCustomSpeciesSubmit = (val: string) => {
    const trimmed = val.trim();
    if (trimmed) {
      setCustomSpecies(trimmed);
      setSelectedSpecies('Andere');
      setShowCustomInput(false);
    } else {
      setCustomSpecies('');
      setSelectedSpecies('');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col gap-6">
      
      {/* 1. Animal Species Selection - Large Button Grid */}
      <div>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
          1. Welches Tier braucht Hilfe?
        </h3>
        
        {/* Main Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {speciesList.map(({ value, label, Icon }) => {
            const isSelected = selectedSpecies === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setSelectedSpecies(isSelected ? '' : value);
                  setShowCustomInput(false);
                }}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-sky-50 border-sky-300 text-sky-700 shadow-sm ring-2 ring-sky-100'
                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Icon className={`h-8 w-8 mb-2 ${isSelected ? 'text-sky-600' : 'text-slate-400'}`} />
                <span className="font-bold text-sm">{label}</span>
              </button>
            );
          })}

          {/* Custom species active trigger button */}
          <button
            type="button"
            onClick={() => {
              setSelectedSpecies('Andere');
              setShowCustomInput(!showCustomInput);
            }}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all duration-200 cursor-pointer ${
              selectedSpecies === 'Andere'
                ? 'bg-sky-50 border-sky-300 text-sky-700 shadow-sm ring-2 ring-sky-100'
                : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Activity className={`h-8 w-8 mb-2 ${selectedSpecies === 'Andere' ? 'text-sky-600' : 'text-slate-400'}`} />
            <span className="font-bold text-sm truncate max-w-full px-1">
              {customSpecies ? `🐦 ${customSpecies}` : 'Anderes Tier / Suchen...'}
            </span>
          </button>
        </div>

        {/* Custom Species Drawer (Search Menu in the same window) */}
        {(showCustomInput || (selectedSpecies === 'Andere' && !customSpecies)) && (
          <div className="mt-4 p-5 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col gap-4 animate-fadeIn">
            <div>
              <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-sky-500" />
                Eigene Tierart eingeben oder auswählen:
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                Der Name erscheint sofort auf deinem vierten Suchbutton und filtert die Ergebnisse.
              </p>
            </div>

            {/* Inline Input Field */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="z.B. Vogel, Schildkröte, Pferd, Falke..."
                  value={tempCustomVal}
                  onChange={(e) => setTempCustomVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCustomSpeciesSubmit(tempCustomVal);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 font-bold text-slate-700 text-xs transition-colors"
                />
              </div>
              <button
                type="button"
                onClick={() => handleCustomSpeciesSubmit(tempCustomVal)}
                className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Bestätigen
              </button>
            </div>

            {/* Quick Suggestions Chips */}
            <div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-2">
                Häufig gesucht:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_ANIMAL_SUGGESTIONS.map(animal => (
                  <button
                    key={animal}
                    type="button"
                    onClick={() => {
                      setTempCustomVal(animal);
                      handleCustomSpeciesSubmit(animal);
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-sky-50 hover:border-sky-200 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 transition-colors cursor-pointer"
                  >
                    + {animal}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Situation / Service Type - Harmonious Premium custom grid */}
      <div>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
          2. Was ist die Situation?
        </h3>
        
        {/* We use a 6-column grid structure for perfect balance of 5 elements! */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3.5">
          
          {/* 1. Medizinischer Notfall (Top Row - 3 cols) */}
          <button
            type="button"
            onClick={() => setSelectedSituation(selectedSituation === 'Notfall' ? '' : 'Notfall')}
            className={`col-span-1 md:col-span-3 flex items-start text-left p-4.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
              selectedSituation === 'Notfall'
                ? 'bg-rose-50/50 border-rose-300 text-rose-900 ring-2 ring-rose-50'
                : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
          >
            <div className={`p-2.5 rounded-xl mr-4 ${selectedSituation === 'Notfall' ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
              <Activity className="h-6 w-6 animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="font-extrabold text-sm">Medizinischer Notfall</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">Akute Verletzung, Vergiftung, Atemnot</p>
            </div>
          </button>

          {/* 2. Schwere Erkrankung / Sonntagsschmerz (Top Row - 3 cols) */}
          <button
            type="button"
            onClick={() => setSelectedSituation(selectedSituation === 'Schwere Erkrankung' ? '' : 'Schwere Erkrankung')}
            className={`col-span-1 md:col-span-3 flex items-start text-left p-4.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
              selectedSituation === 'Schwere Erkrankung'
                ? 'bg-amber-50/50 border-amber-300 text-amber-900 ring-2 ring-amber-50'
                : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
          >
            <div className={`p-2.5 rounded-xl mr-4 ${selectedSituation === 'Schwere Erkrankung' ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-extrabold text-sm">Schwere Erkrankung / Unklarer Notfall</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Sonntags-Notlage, starke Schmerzen, Verdacht auf Tumor oder akuter Verfall
              </p>
            </div>
          </button>

          {/* 3. Einschläferung (Bottom Row - 2 cols) */}
          <button
            type="button"
            onClick={() => setSelectedSituation(selectedSituation === 'Einschläferung' ? '' : 'Einschläferung')}
            className={`col-span-1 md:col-span-2 flex items-start text-left p-4.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
              selectedSituation === 'Einschläferung'
                ? 'bg-sky-50 border-sky-300 text-sky-700 ring-2 ring-sky-100'
                : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
          >
            <div className={`p-2.5 rounded-xl mr-3 ${selectedSituation === 'Einschläferung' ? 'bg-sky-100 text-sky-600' : 'bg-slate-50 text-slate-400'}`}>
              <Heart className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-xs">Einschläferung</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">Erlösung zu Hause oder in der Klinik</p>
            </div>
          </button>

          {/* 4. Hausbesuch (Bottom Row - 2 cols) */}
          <button
            type="button"
            onClick={() => setSelectedSituation(selectedSituation === 'Hausbesuch' ? '' : 'Hausbesuch')}
            className={`col-span-1 md:col-span-2 flex items-start text-left p-4.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
              selectedSituation === 'Hausbesuch'
                ? 'bg-sky-50 border-sky-300 text-sky-700 ring-2 ring-sky-100'
                : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
          >
            <div className={`p-2.5 rounded-xl mr-3 ${selectedSituation === 'Hausbesuch' ? 'bg-sky-100 text-sky-600' : 'bg-slate-50 text-slate-400'}`}>
              <Home className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-xs">Hausbesuch</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">Stressfreie Behandlung bei Ihnen daheim</p>
            </div>
          </button>

          {/* 5. Normaler Termin (Bottom Row - 2 cols) */}
          <button
            type="button"
            onClick={() => setSelectedSituation(selectedSituation === 'normaler Termin' ? '' : 'normaler Termin')}
            className={`col-span-1 md:col-span-2 flex items-start text-left p-4.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
              selectedSituation === 'normaler Termin'
                ? 'bg-sky-50 border-sky-300 text-sky-700 ring-2 ring-sky-100'
                : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
          >
            <div className={`p-2.5 rounded-xl mr-3 ${selectedSituation === 'normaler Termin' ? 'bg-sky-100 text-sky-600' : 'bg-slate-50 text-slate-400'}`}>
              <Calendar className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-xs">Normaler Termin</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">Impfung, Routinekontrolle, Beratung</p>
            </div>
          </button>

        </div>
      </div>

      {/* 3. District & Confirmed Filter Toggle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-50">
        
        {/* District Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            3. In welchem Bezirk / Region?
          </label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 text-slate-700 font-semibold rounded-2xl appearance-none focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 transition-colors cursor-pointer"
            >
              <option value="">Ganz Kärnten</option>
              {DISTRICTS.map(d => (
                <option key={d} value={d}>
                  Bezirk {d}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold">
              ▼
            </div>
          </div>
        </div>

        {/* Verification Checkbox */}
        <div className="flex flex-col justify-end">
          <button
            type="button"
            onClick={() => setOnlyConfirmed(!onlyConfirmed)}
            className={`flex items-center gap-3.5 p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 ${
              onlyConfirmed
                ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800 ring-2 ring-emerald-50'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600'
            }`}
          >
            {onlyConfirmed ? (
              <CheckSquare className="h-6 w-6 text-emerald-600 shrink-0" />
            ) : (
              <Square className="h-6 w-6 text-slate-400 shrink-0" />
            )}
            <div>
              <p className="font-bold text-sm">Nur verifizierte Praxen anzeigen</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Blendet alle aus, die ihren Status länger als 24h nicht bestätigt haben.
              </p>
            </div>
          </button>
        </div>

      </div>

      {/* Reset button if filters are active */}
      {(selectedSpecies || selectedSituation || selectedDistrict || onlyConfirmed || customSpecies) && (
        <button
          type="button"
          onClick={() => {
            setSelectedSpecies('');
            setSelectedSituation('');
            setSelectedDistrict('');
            setOnlyConfirmed(false);
            setCustomSpecies('');
            setTempCustomVal('');
            setShowCustomInput(false);
          }}
          className="text-center text-xs font-semibold text-slate-400 hover:text-slate-600 underline cursor-pointer transition-colors pt-2"
        >
          Alle Filter zurücksetzen
        </button>
      )}

    </div>
  );
}
