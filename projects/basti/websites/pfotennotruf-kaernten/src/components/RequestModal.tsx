'use client';

import { useState } from 'react';
import { Veterinarian, SpeciesType, ServiceType } from '../data/mockVets';
import { addInquiry } from '../utils/db';
import { X, Send, ShieldAlert, Heart, CheckCircle2 } from 'lucide-react';

interface RequestModalProps {
  vet: Veterinarian;
  isOpen: boolean;
  onClose: () => void;
  defaultSpecies: SpeciesType | '';
  defaultSituation: ServiceType | '';
  customSpecies?: string;
}

export default function RequestModal({
  vet,
  isOpen,
  onClose,
  defaultSpecies = '',
  defaultSituation = '',
  customSpecies = ''
}: RequestModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [species, setSpecies] = useState<SpeciesType>(defaultSpecies || 'Katze');
  const [specificAnimal, setSpecificAnimal] = useState(customSpecies || '');
  const [situation, setSituation] = useState<ServiceType>(defaultSituation || 'Notfall');
  const [message, setMessage] = useState('');
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !disclaimerAccepted) return;
    if (species === 'Andere' && !specificAnimal.trim()) return;

    const finalSpecies = species === 'Andere' ? specificAnimal.trim() : species;

    // Save to localStorage
    addInquiry({
      vetId: vet.id,
      name,
      phone,
      species: finalSpecies,
      situation,
      message,
    });

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setName('');
      setPhone('');
      setSpecificAnimal('');
      setMessage('');
      setDisclaimerAccepted(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Box */}
      <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden transform transition-all z-10">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500 fill-red-100" />
              Anfrage senden
            </h3>
            <p className="text-xs text-slate-400 font-semibold">{vet.name}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {success ? (
          <div className="p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
            <div className="bg-emerald-50 p-4 rounded-full text-emerald-500 mb-4 animate-bounce">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <h4 className="text-xl font-bold text-slate-800 mb-1">Anfrage erfolgreich gesendet!</h4>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              Die Praxis hat Ihre Anfrage erhalten. Bei akuten Fällen bitte zusätzlich immer direkt anrufen!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[75vh]">
            
            {/* Urgent warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-800">
              <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs font-semibold leading-relaxed">
                <span className="font-bold">Lebensgefahr?</span> Falls Ihr Tier in Lebensgefahr schwebt, rufen Sie bitte direkt an unter: 
                <a href={`tel:${vet.phone}`} className="block text-red-600 font-bold mt-1 text-sm underline">
                  {vet.phone}
                </a>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Ihr Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="z.B. Max Mustermann"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 font-medium text-slate-700 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Ihre Telefonnummer *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="z.B. +43 664 123456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 font-medium text-slate-700 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Welches Tier?
                </label>
                <select
                  value={species === 'Andere' || (!['Katze', 'Hund', 'Kleintier'].includes(species)) ? 'Andere' : species}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSpecies(val);
                    if (val !== 'Andere') {
                      setSpecificAnimal('');
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 font-semibold text-slate-700 cursor-pointer"
                >
                  <option value="Katze">Katze</option>
                  <option value="Hund">Hund</option>
                  <option value="Kleintier">Kleintier</option>
                  <option value="Andere">Anderes Tier</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Welche Situation?
                </label>
                <select
                  value={situation}
                  onChange={(e) => setSituation(e.target.value as ServiceType)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 font-semibold text-slate-700 cursor-pointer"
                >
                  <option value="Notfall">Medizinischer Notfall</option>
                  <option value="Schwere Erkrankung">Schwere Erkrankung / Unklarer Notfall</option>
                  <option value="normaler Termin">Normaler Termin</option>
                  <option value="Einschläferung">Einschläferung</option>
                  <option value="Hausbesuch">Hausbesuch</option>
                </select>
              </div>
            </div>

            {/* Custom Species Input Drawer */}
            {(species === 'Andere' || (!['Katze', 'Hund', 'Kleintier'].includes(species))) && (
              <div className="p-4 bg-sky-50/50 border border-sky-100 rounded-2xl animate-fadeIn">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Spezifische Tierart eingeben (z.B. Vogel, Reptil, Pferd) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Welches Tier genau braucht Hilfe?"
                  value={specificAnimal}
                  onChange={(e) => setSpecificAnimal(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 font-bold text-slate-700 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Nachricht (Symptome / Dringlichkeit)
              </label>
              <textarea
                rows={3}
                placeholder="Beschreiben Sie kurz das Problem (z.B. Katze erbricht, apathisch)..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 font-medium text-slate-700 transition-colors resize-none"
              />
            </div>

            {/* Safety Disclaimer Checkbox */}
            <label className="flex items-start gap-3 mt-2 p-3 bg-red-50/50 border border-red-100 rounded-2xl cursor-pointer">
              <input
                type="checkbox"
                required
                checked={disclaimerAccepted}
                onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                className="mt-1 h-4.5 w-4.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
              <span className="text-[11px] font-bold text-slate-600 leading-relaxed">
                Ich verstehe, dass dies <span className="text-red-600 underline">keine medizinische Beratung ersetzt</span> und ich bei akuten, lebensbedrohlichen Notfällen zusätzlich <span className="text-red-600 underline">sofort telefonisch Kontakt</span> aufnehmen muss. *
              </span>
            </label>

            {/* Footer Buttons */}
            <div className="flex gap-3 justify-end pt-3 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={!name || !phone || !disclaimerAccepted}
                className="px-5 py-2 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Send className="h-4 w-4" />
                Anfrage senden
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
