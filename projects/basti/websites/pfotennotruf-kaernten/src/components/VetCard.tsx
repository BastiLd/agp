'use client';

import { useState } from 'react';
import { Veterinarian, SpeciesType, ServiceType } from '../data/mockVets';
import { getEffectiveStatus, formatLocalDateTime } from '../utils/statusLogic';
import StatusBadge from './StatusBadge';
import RequestModal from './RequestModal';
import { 
  Phone, 
  MapPin, 
  Clock, 
  Info, 
  Cat, 
  Dog, 
  Heart, 
  Activity, 
  ChevronRight, 
  Navigation,
  MessageSquare
} from 'lucide-react';

interface VetCardProps {
  vet: Veterinarian;
  selectedSpecies: SpeciesType | '';
  selectedSituation: ServiceType | '';
  customSpecies: string;
}

export default function VetCard({ vet, selectedSpecies, selectedSituation, customSpecies }: VetCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Calculate dynamic active status
  const effectiveStatus = getEffectiveStatus(vet);

  const getSpeciesIcon = (spec: SpeciesType) => {
    switch (spec) {
      case 'Katze': return <Cat className="h-3.5 w-3.5" />;
      case 'Hund': return <Dog className="h-3.5 w-3.5" />;
      default: return <Activity className="h-3.5 w-3.5" />;
    }
  };

  // Google Maps search query URL using practice name and address
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${vet.name}, ${vet.address}`
  )}`;

  return (
    <div className={`bg-white rounded-3xl border transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50 flex flex-col overflow-hidden ${
      effectiveStatus === 'green'
        ? 'border-emerald-100 shadow-md ring-2 ring-emerald-500/5'
        : effectiveStatus === 'yellow'
        ? 'border-amber-100 shadow-sm'
        : effectiveStatus === 'red'
        ? 'border-rose-100 opacity-80'
        : 'border-slate-200/80 shadow-sm'
    }`}>
      
      {/* Top Header - Name & Status */}
      <div className="p-6 pb-4 border-b border-slate-50 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">
            Bezirk {vet.district}
          </span>
          <h3 className="font-bold text-slate-800 text-lg hover:text-sky-600 transition-colors leading-tight">
            {vet.name}
          </h3>
          
          <div className="flex items-center gap-1 text-xs text-slate-400 font-semibold mt-1">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{vet.address}</span>
          </div>
        </div>

        {/* Dynamic Status Traffic Light */}
        <div className="shrink-0 flex flex-col items-end">
          <StatusBadge status={effectiveStatus} />
          <span className="text-[10px] text-slate-400 font-semibold mt-1.5 block">
            Bestätigt: {formatLocalDateTime(vet.lastConfirmed)}
          </span>
        </div>
      </div>

      {/* Middle Content - Opening Hours, Emergency Warning, Species */}
      <div className="p-6 flex-1 flex flex-col gap-4">
        
        {/* Verification Alert Banner for Grey status */}
        {effectiveStatus === 'grey' && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex gap-2.5 text-slate-700">
            <Info className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-[11px] font-bold leading-normal">
              Status ist älter als 24h. Bitte rufen Sie an, um Erreichbarkeit und Öffnungszeiten abzugleichen.
            </p>
          </div>
        )}

        {/* Emergency Info Box */}
        {vet.emergencyInfo && (
          <div className={`p-4 rounded-2xl text-xs font-semibold leading-relaxed border ${
            effectiveStatus === 'green'
              ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800'
              : effectiveStatus === 'yellow'
              ? 'bg-amber-50/50 border-amber-100 text-amber-800'
              : 'bg-slate-50/50 border-slate-100 text-slate-600'
          }`}>
            <span className="font-bold uppercase tracking-wider block mb-1 text-[10px]">
              Notdienst-Hinweis:
            </span>
            {vet.emergencyInfo}
          </div>
        )}

        {/* Standard Info Rows */}
        <div className="flex flex-col gap-2.5 text-xs text-slate-600 font-semibold">
          <div className="flex items-center gap-2">
            <Clock className="h-4.5 w-4.5 text-slate-400 shrink-0" />
            <span>Öffnungszeiten: {vet.openingHours}</span>
          </div>
        </div>

        {/* Species & Services Tags */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {vet.species.map(s => {
            const isFilterMatch = selectedSpecies === s;
            return (
              <span 
                key={s} 
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                  isFilterMatch
                    ? 'bg-sky-50 text-sky-700 border-sky-200 shadow-sm'
                    : 'bg-slate-50 text-slate-500 border-slate-100'
                }`}
              >
                {getSpeciesIcon(s)}
                {s}
              </span>
            );
          })}

          {vet.services.map(ser => {
            const isFilterMatch = selectedSituation === ser;
            return (
              <span 
                key={ser} 
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                  isFilterMatch
                    ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm'
                    : 'bg-slate-50 text-slate-400 border-slate-100'
                }`}
              >
                <Heart className="h-3 w-3 shrink-0" />
                {ser}
              </span>
            );
          })}
        </div>

      </div>

      {/* Action Buttons Footer */}
      <div className="p-6 pt-0 border-t border-slate-50 bg-slate-50/50 grid grid-cols-2 gap-2">
        {/* Call Now */}
        <a
          href={`tel:${vet.phone}`}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-2xl shadow-md shadow-red-500/10 cursor-pointer transition-colors text-center"
        >
          <Phone className="h-4 w-4 shrink-0" />
          Jetzt anrufen
        </a>

        {/* Route Open */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-sm rounded-2xl cursor-pointer transition-colors text-center"
        >
          <Navigation className="h-4 w-4 text-slate-400 shrink-0" />
          Route öffnen
        </a>

        {/* Request system */}
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={effectiveStatus === 'red'}
          className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 mt-1 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl cursor-pointer transition-colors shadow-sm"
        >
          <MessageSquare className="h-4 w-4 shrink-0" />
          Anfrage senden
        </button>
      </div>

      {/* Modal Overlay */}
      <RequestModal 
        vet={vet}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultSpecies={selectedSpecies}
        defaultSituation={selectedSituation}
        customSpecies={customSpecies}
      />

    </div>
  );
}
