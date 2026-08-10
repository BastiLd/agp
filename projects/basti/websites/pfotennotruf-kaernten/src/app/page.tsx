'use client';

import { useState, useEffect } from 'react';
import { Veterinarian, SpeciesType, ServiceType } from '../data/mockVets';
import { getStoredVets } from '../utils/db';
import { getEffectiveStatus } from '../utils/statusLogic';
import SearchFilters from '../components/SearchFilters';
import VetCard from '../components/VetCard';
import { 
  Heart, 
  Activity, 
  ShieldAlert, 
  Search, 
  Info, 
  PhoneCall, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export default function Home() {
  const [vets, setVets] = useState<Veterinarian[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesType | ''>('');
  const [selectedSituation, setSelectedSituation] = useState<ServiceType | ''>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [onlyConfirmed, setOnlyConfirmed] = useState<boolean>(false);
  const [customSpecies, setCustomSpecies] = useState<string>('');

  // Load vets from localStorage on component mount
  useEffect(() => {
    // We fetch stored vets (initial defaults are generated if storage empty)
    setVets(getStoredVets());

    // Listen to potential changes if tabs update
    const handleStorageChange = () => {
      setVets(getStoredVets());
    };
    window.addEventListener('storage', handleStorageChange);
    // Standard focus listener to reload in real-time when returning to the search tab
    window.addEventListener('focus', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);

  // Filter and Sort Veterinarians
  const filteredVets = vets
    .filter((vet) => {
      // 1. Species filter
      if (selectedSpecies) {
        if (selectedSpecies === 'Andere') {
          // If Andere is selected, match vets that explicitly treat 'Andere',
          // or if the custom search keyword matches their details (e.g. they treat birds)
          const matchesExplicitOther = vet.species.includes('Andere');
          const matchesKeyword = customSpecies
            ? vet.name.toLowerCase().includes(customSpecies.toLowerCase()) ||
              vet.emergencyInfo.toLowerCase().includes(customSpecies.toLowerCase())
            : false;
          
          if (!matchesExplicitOther && !matchesKeyword) {
            return false;
          }
        } else {
          if (!vet.species.includes(selectedSpecies)) {
            return false;
          }
        }
      }
      // 2. Situation/Service filter
      if (selectedSituation && !vet.services.includes(selectedSituation)) {
        return false;
      }
      // 3. District filter
      if (selectedDistrict && vet.district !== selectedDistrict) {
        return false;
      }
      // 4. "Only currently confirmed" filter
      if (onlyConfirmed) {
        const status = getEffectiveStatus(vet);
        // Exclude Red (Unavailable) and Grey (Expired/Unconfirmed)
        if (status === 'red' || status === 'grey') {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      // Custom sorting: Green (active) > Yellow (restricted) > Grey (unconfirmed) > Red (closed)
      const scoreMap: Record<string, number> = {
        green: 4,
        yellow: 3,
        grey: 2,
        red: 1,
      };

      const statusA = scoreMap[getEffectiveStatus(a)] || 0;
      const statusB = scoreMap[getEffectiveStatus(b)] || 0;

      // Sort descending (highest score first)
      if (statusA !== statusB) {
        return statusB - statusA;
      }
      
      // Secondary sort: alphabetical by name
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        {/* Subtle grid background pattern */}
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#0ea5e9_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e9_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        
        {/* Sky-Blue Glow Effect */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-sky-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-red-500/5 blur-[120px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center flex flex-col items-center gap-6">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-bold uppercase tracking-wider">
            <CheckCircle className="h-3.5 w-3.5" />
            Echtzeit-Verifizierung für Kärnten
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-2xl leading-[1.15]">
            In der Tier-Notlage zählt <span className="text-red-500 underline decoration-wavy decoration-2 underline-offset-4">jede Sekunde</span>.
          </h1>

          {/* Subtext */}
          <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed font-medium">
            Finde schnell eine passende tierärztliche Anlaufstelle in Kärnten – mit live-bestätigtem Erreichbarkeits-Status, Notfallinformationen und Direktanruf.
          </p>

          {/* Call to Action Button */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center mt-2 w-full sm:w-auto">
            <a
              href="#search-section"
              className="w-full sm:w-auto px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-red-500/20 transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
            >
              <Activity className="h-5 w-5 animate-pulse group-hover:scale-110 transition-transform" />
              Ich brauche jetzt Hilfe!
            </a>
          </div>

          {/* Safety Warning */}
          <div className="w-full max-w-2xl bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 mt-6 text-left flex gap-3 text-slate-300">
            <ShieldAlert className="h-6 w-6 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs font-semibold leading-relaxed">
              <span className="text-red-400 font-bold">WICHTIG:</span> Dies ist keine medizinische Beratung. 
              Bei lebensbedrohlichen Notfällen rufen Sie bitte <span className="text-white underline">sofort telefonisch</span> an. 
              Unser 24-Stunden-Sicherheitssystem markiert Praxen nur als <span className="text-emerald-400 font-bold">grün</span>, wenn die Erreichbarkeit aktiv vor kurzem bestätigt wurde.
            </div>
          </div>

        </div>
      </section>

      {/* 2. Main Search & Results Directory */}
      <section id="search-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 flex flex-col gap-10">
        
        {/* Filters */}
        <div>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-2">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <Search className="h-6 w-6 text-sky-600" />
                Anlaufstellen filtern
              </h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                Kombiniere Filter für ein exaktes Notfall-Ergebnis
              </p>
            </div>
            
            {/* Live Count */}
            <div className="text-xs text-slate-400 font-bold bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm w-fit">
              Gefunden: <span className="text-slate-800 font-black">{filteredVets.length}</span> Praxen
            </div>
          </div>

          <SearchFilters
            selectedSpecies={selectedSpecies}
            setSelectedSpecies={setSelectedSpecies}
            selectedSituation={selectedSituation}
            setSelectedSituation={setSelectedSituation}
            selectedDistrict={selectedDistrict}
            setSelectedDistrict={setSelectedDistrict}
            onlyConfirmed={onlyConfirmed}
            setOnlyConfirmed={setOnlyConfirmed}
            customSpecies={customSpecies}
            setCustomSpecies={setCustomSpecies}
          />
        </div>

        {/* Dynamic Traffic Light Guide */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold">
          <div className="flex items-center gap-2 text-emerald-800">
            <span className="h-3 w-3 rounded-full bg-emerald-500 animate-status-pulse shrink-0" />
            <span>Aktiv bestätigt (Erreichbar)</span>
          </div>
          <div className="flex items-center gap-2 text-amber-800">
            <span className="h-3 w-3 rounded-full bg-amber-500 shrink-0" />
            <span>Eingeschränkt (Rücksprache)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <span className="h-3 w-3 rounded-full bg-slate-400 shrink-0" />
            <span>Unbestätigt (&gt;24h abgelaufen)</span>
          </div>
          <div className="flex items-center gap-2 text-rose-800">
            <span className="h-3 w-3 rounded-full bg-rose-500 shrink-0" />
            <span>Heute nicht verfügbar</span>
          </div>
        </div>

        {/* Results Grid */}
        {filteredVets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVets.map((vet) => (
              <VetCard
                key={vet.id}
                vet={vet}
                selectedSpecies={selectedSpecies}
                selectedSituation={selectedSituation}
                customSpecies={customSpecies}
              />
            ))}
          </div>
        ) : (
          /* Detailed comforting Empty State with general regional helpline */
          <div className="bg-white border border-slate-100 rounded-3xl p-10 sm:p-16 text-center max-w-xl mx-auto shadow-md">
            <div className="bg-slate-50 p-4 rounded-full text-slate-400 w-fit mx-auto mb-4">
              <HelpCircle className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Keine passenden Tierärzte gefunden
            </h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Leider gibt es in unserer Datenbank für deine ausgewählten Filter gerade keine passende Praxis. 
              Bitte setze deine Filter zurück oder erweitere deine Suche auf ganz Kärnten.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setSelectedSpecies('');
                  setSelectedSituation('');
                  setSelectedDistrict('');
                  setOnlyConfirmed(false);
                }}
                className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-2xl cursor-pointer shadow-md transition-colors"
              >
                Alle Filter zurücksetzen
              </button>

              {/* General Kärnten emergency helpline fallback */}
              <div className="mt-4 pt-6 border-t border-slate-50 text-left">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-2 text-center">
                  Allgemeiner Tierarzt-Notdienst Kärnten
                </span>
                <a
                  href="tel:+43463513511"
                  className="flex items-center justify-center gap-2.5 p-3.5 bg-red-50 border border-red-100 hover:bg-red-100/50 rounded-2xl text-red-600 font-extrabold text-sm transition-colors text-center cursor-pointer"
                >
                  <PhoneCall className="h-4.5 w-4.5" />
                  Tierärztekammer Kärnten: +43 463 513511
                </a>
              </div>
            </div>
          </div>
        )}

      </section>

    </div>
  );
}
