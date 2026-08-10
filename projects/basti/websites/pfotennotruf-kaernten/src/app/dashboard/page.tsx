'use client';

import { useState, useEffect } from 'react';
import { Veterinarian, VetInquiry, VetStatus, SpeciesType, ServiceType } from '../../data/mockVets';
import { 
  getStoredVets, 
  updateVetStatus, 
  updateVetProfile, 
  getInquiriesForVet 
} from '../../utils/db';
import { 
  getEffectiveStatus, 
  getRemainingTimeString, 
  getExpirationDate, 
  formatLocalDateTime 
} from '../../utils/statusLogic';
import { 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  User, 
  Phone, 
  Check, 
  Save, 
  Mail, 
  Activity, 
  Home, 
  Heart, 
  Calendar,
  Settings,
  AlertCircle
} from 'lucide-react';

export default function Dashboard() {
  const [vets, setVets] = useState<Veterinarian[]>([]);
  const [selectedVetId, setSelectedVetId] = useState<string>('vet-1');
  const [currentVet, setCurrentVet] = useState<Veterinarian | null>(null);
  const [inquiries, setInquiries] = useState<VetInquiry[]>([]);

  // Form states
  const [openingHours, setOpeningHours] = useState('');
  const [emergencyInfo, setEmergencyInfo] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesType[]>([]);
  const [selectedServices, setSelectedServices] = useState<ServiceType[]>([]);

  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'info' } | null>(null);
  const [timeCounter, setTimeCounter] = useState<number>(0); // Triggers re-renders for live expiration timer

  // Load all veterinarians from local storage on mount
  useEffect(() => {
    const list = getStoredVets();
    setVets(list);
    
    // Default selection
    if (list.length > 0) {
      const active = list.find(v => v.id === selectedVetId) || list[0];
      setSelectedVetId(active.id);
      setCurrentVet(active);
    }
  }, []);

  // Reload selected veterinarian data whenever ID changes
  useEffect(() => {
    if (selectedVetId) {
      reloadVetData();
    }
  }, [selectedVetId]);

  // Expiration countdown live ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeCounter(prev => prev + 1);
    }, 10000); // Trigger countdown repaint every 10 seconds
    return () => clearInterval(timer);
  }, []);

  const reloadVetData = () => {
    const list = getStoredVets();
    setVets(list);
    const active = list.find(v => v.id === selectedVetId);
    if (active) {
      setCurrentVet(active);
      setOpeningHours(active.openingHours);
      setEmergencyInfo(active.emergencyInfo);
      setSelectedSpecies(active.species);
      setSelectedServices(active.services);

      // Load inbox requests
      setInquiries(getInquiriesForVet(active.id));
    }
  };

  const showNotification = (text: string, type: 'success' | 'info' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // 24 Hour confirmation action
  const handleConfirm24h = () => {
    if (!currentVet) return;
    updateVetStatus(currentVet.id, 'green');
    reloadVetData();
    showNotification('Status erfolgreich um 24 Stunden verlängert!');
  };

  // Status manual override toggles
  const handleStatusChange = (status: VetStatus) => {
    if (!currentVet) return;
    updateVetStatus(currentVet.id, status);
    reloadVetData();
    showNotification(`Status auf "${status === 'yellow' ? 'Eingeschränkt' : status === 'red' ? 'Nicht verfügbar' : 'Aktiv bestätigt'}" geändert.`);
  };

  // Save profile meta settings
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVet) return;

    updateVetProfile(currentVet.id, {
      openingHours,
      emergencyInfo,
      species: selectedSpecies,
      services: selectedServices
    });

    reloadVetData();
    showNotification('Profil erfolgreich gespeichert!');
  };

  // Checkbox toggle helpers
  const toggleSpecies = (spec: SpeciesType) => {
    setSelectedSpecies(prev => 
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  };

  const toggleService = (ser: ServiceType) => {
    setSelectedServices(prev => 
      prev.includes(ser) ? prev.filter(s => s !== ser) : [...prev, ser]
    );
  };

  if (!currentVet) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="animate-spin h-8 w-8 border-4 border-sky-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const effectiveStatus = getEffectiveStatus(currentVet);
  const remainingTime = getRemainingTimeString(currentVet.lastConfirmed);
  const expirationDate = getExpirationDate(currentVet.lastConfirmed);

  return (
    <div className="flex-1 bg-slate-50 py-10">
      
      {/* MVP Simulation Banner Selector */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="bg-sky-500/10 p-3 rounded-2xl text-sky-400 shrink-0">
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base">MVP-Praxissimulation (Jugend Innovativ)</h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                Wähle eine der 8 Mock-Kliniken aus, um dich als dieser Tierarzt einzuloggen.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400">Aktiver Tierarzt:</span>
            <select
              value={selectedVetId}
              onChange={(e) => setSelectedVetId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white font-bold text-sm px-4 py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              {vets.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.district})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Floating Notification */}
        {notification && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white border border-slate-800 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-bounce">
            <Check className="h-4.5 w-4.5 text-emerald-400" />
            {notification.text}
          </div>
        )}

        {/* Column 1 & 2: Status & Edit Forms */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Status Section */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col gap-6">
            
            <div className="border-b border-slate-50 pb-4">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                Ihr Erreichbarkeits-Status
              </h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                Stellen Sie sicher, dass Ihr Status aktuell ist
              </p>
            </div>

            {/* Expired alert warning */}
            {effectiveStatus === 'grey' && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-800">
                <AlertCircle className="h-5.5 w-5.5 text-amber-600 shrink-0" />
                <div className="text-xs font-semibold leading-relaxed">
                  <span className="font-bold">Achtung: Ihr Status ist abgelaufen!</span> 
                  <p className="mt-1">
                    Sie haben Ihren Status seit über 24 Stunden nicht bestätigt. Auf der Suchseite werden Sie nun als 
                    <span className="font-black text-amber-900"> unbestätigt (grau)</span> angezeigt und weiter unten gelistet.
                  </p>
                </div>
              </div>
            )}

            {/* Dynamic visual representation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                  Berechneter Live-Status:
                </span>
                <div className="flex items-center gap-2.5">
                  <span className={`h-4.5 w-4.5 rounded-full shrink-0 ${
                    effectiveStatus === 'green' ? 'bg-emerald-500 animate-status-pulse' :
                    effectiveStatus === 'yellow' ? 'bg-amber-500' :
                    effectiveStatus === 'red' ? 'bg-rose-500' : 'bg-slate-400'
                  }`} />
                  <span className="font-black text-slate-800 text-lg uppercase tracking-tight">
                    {effectiveStatus === 'green' ? 'Aktiv bestätigt' :
                     effectiveStatus === 'yellow' ? 'Eingeschränkt' :
                     effectiveStatus === 'red' ? 'Nicht erreichbar' : 'Unbestätigt (Abgelaufen)'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1 justify-center border-t sm:border-t-0 sm:border-l border-slate-200 pt-4 sm:pt-0 sm:pl-6">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                  Status verfällt in:
                </span>
                <span className={`text-base font-black tracking-tight block ${
                  effectiveStatus === 'grey' ? 'text-red-500' : 'text-slate-700'
                }`}>
                  {remainingTime}
                </span>
                <span className="text-[9px] text-slate-400 font-semibold block">
                  Ablauf: {formatLocalDateTime(expirationDate.toISOString())}
                </span>
              </div>
            </div>

            {/* Quick 24h confirmation CTA */}
            <button
              onClick={handleConfirm24h}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-emerald-500/20 cursor-pointer transition-all hover:-translate-y-0.5 text-center flex items-center justify-center gap-2"
            >
              <CheckCircle className="h-5.5 w-5.5" />
              Status für 24 Stunden bestätigen
            </button>

            {/* Manual state changes */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Oder Status manuell ändern:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleStatusChange('yellow')}
                  className={`px-4 py-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-2 ${
                    currentVet.status === 'yellow'
                      ? 'bg-amber-50 border-amber-300 text-amber-800 ring-2 ring-amber-50'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Eingeschränkt / Tel.
                </button>
                <button
                  onClick={() => handleStatusChange('red')}
                  className={`px-4 py-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-2 ${
                    currentVet.status === 'red'
                      ? 'bg-rose-50 border-rose-300 text-rose-800 ring-2 ring-rose-50'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <XCircle className="h-4 w-4 text-rose-500" />
                  Nicht verfügbar
                </button>
              </div>
            </div>

          </div>

          {/* Profile metadata editor */}
          <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col gap-6">
            
            <div className="border-b border-slate-50 pb-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">
                  Praxisdaten bearbeiten
                </h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  Halten Sie die Informationen für Tierhalter aktuell
                </p>
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Save className="h-4 w-4" />
                Speichern
              </button>
            </div>

            {/* Inputs */}
            <div className="flex flex-col gap-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Öffnungszeiten
                </label>
                <input
                  type="text"
                  value={openingHours}
                  onChange={(e) => setOpeningHours(e.target.value)}
                  placeholder="z.B. Mo-Fr: 08:00 - 18:00"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 font-medium text-slate-700 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Spezielle Notdienst-Hinweise
                </label>
                <textarea
                  rows={3}
                  value={emergencyInfo}
                  onChange={(e) => setEmergencyInfo(e.target.value)}
                  placeholder="Beschreiben Sie Ihre Notdienst-Verfahren (z.B. Nur nach telefonischer Voranmeldung)..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 font-medium text-slate-700 transition-colors resize-none"
                />
              </div>

              {/* Treated species */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  Behandelte Tierarten
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(['Katze', 'Hund', 'Kleintier', 'Andere'] as SpeciesType[]).map(s => {
                    const isChecked = selectedSpecies.includes(s);
                    return (
                      <button
                        type="button"
                        key={s}
                        onClick={() => toggleSpecies(s)}
                        className={`py-2 px-3 border text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
                          isChecked
                            ? 'bg-sky-50 border-sky-300 text-sky-700'
                            : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-slate-500'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Services */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  Dienstleistungen / Spezialgebiete
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(['Notfall', 'Schwere Erkrankung', 'normaler Termin', 'Einschläferung', 'Hausbesuch'] as ServiceType[]).map(ser => {
                    const isChecked = selectedServices.includes(ser);
                    return (
                      <button
                        type="button"
                        key={ser}
                        onClick={() => toggleService(ser)}
                        className={`py-2.5 px-3 border text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
                          isChecked
                            ? 'bg-rose-50 border-rose-300 text-rose-700 font-extrabold ring-1 ring-rose-300'
                            : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-slate-500'
                        }`}
                      >
                        {ser}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

          </form>

        </div>

        {/* Column 3: Inquiries Inbox */}
        <div className="flex flex-col gap-6">
          
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col gap-5 min-h-[450px]">
            
            <div className="border-b border-slate-50 pb-4">
              <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                <Mail className="h-5 w-5 text-sky-600 animate-bounce" />
                Posteingang (Anfragen)
              </h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                Eingehende Formulare von Tierhaltern
              </p>
            </div>

            {/* Inquiry card lists */}
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto max-h-[600px] pr-1">
              {inquiries.length > 0 ? (
                inquiries.map((inq) => (
                  <div 
                    key={inq.id}
                    className="p-4 bg-slate-50/70 hover:bg-slate-50 border border-slate-150 rounded-2xl transition-colors flex flex-col gap-2.5"
                  >
                    {/* Inquiry Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {inq.name}
                        </p>
                        <a 
                          href={`tel:${inq.phone}`}
                          className="text-[10px] text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1 mt-0.5 underline"
                        >
                          <Phone className="h-3 w-3 shrink-0" />
                          {inq.phone}
                        </a>
                      </div>
                      
                      <span className="text-[9px] text-slate-400 font-bold">
                        {formatLocalDateTime(inq.timestamp)}
                      </span>
                    </div>

                    {/* Inquiry Badges */}
                    <div className="flex gap-1.5">
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-[9px] font-bold">
                        {inq.species}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        inq.situation === 'Notfall' ? 'bg-red-50 text-red-600 border border-red-100' :
                        inq.situation === 'Schwere Erkrankung' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        inq.situation === 'Einschläferung' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                        'bg-slate-200 text-slate-600'
                      }`}>
                        {inq.situation}
                      </span>
                    </div>

                    {/* Inquiry Message */}
                    {inq.message ? (
                      <p className="text-[11px] text-slate-600 bg-white border border-slate-100 p-2.5 rounded-xl leading-relaxed italic font-medium">
                        "{inq.message}"
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">
                        Keine Nachricht hinterlassen.
                      </p>
                    )}

                  </div>
                ))
              ) : (
                /* Empty inbox state */
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="bg-slate-50 p-3 rounded-full text-slate-400 mb-3">
                    <Mail className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">Keine Anfragen vorhanden</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-normal">
                    Sobald ein Tierhalter ein Anfrageformular an Ihre Praxis sendet, erscheint es sofort in dieser Liste.
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
