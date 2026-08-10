"use client";

import { FormEvent, useState } from "react";
import {
  animalTypeLabels,
  animalTypeOptions,
  serviceLabels,
  serviceOptions,
  type AnimalType,
  type Inquiry,
  type Service,
  type VetPractice,
} from "@/types/practice";

const INQUIRY_STORAGE_KEY = "pfotennotruf-inquiries";

type InquiryFormProps = {
  practice: VetPractice;
};

export function InquiryForm({ practice }: InquiryFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [animalType, setAnimalType] = useState<AnimalType>("cat");
  const [service, setService] = useState<Service>("emergency");
  const [location, setLocation] = useState<string>(practice.region);
  const [message, setMessage] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accepted) {
      return;
    }

    const existing = window.localStorage.getItem(INQUIRY_STORAGE_KEY);
    const inquiries = existing ? (JSON.parse(existing) as Inquiry[]) : [];
    const inquiry: Inquiry = {
      id: crypto.randomUUID(),
      practiceId: practice.id,
      createdAt: new Date().toISOString(),
      name,
      phone,
      animalType,
      service,
      location,
      message,
    };

    window.localStorage.setItem(INQUIRY_STORAGE_KEY, JSON.stringify([inquiry, ...inquiries]));
    setSaved(true);
    setName("");
    setPhone("");
    setMessage("");
    setAccepted(false);
  }

  return (
    <form className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" id="anfrage" onSubmit={handleSubmit}>
      <div>
        <p className="text-sm font-semibold text-emerald-800">Sichere MVP-Anfrage</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-950">Anfrage an {practice.name}</h2>
        <p className="mt-2 text-sm text-slate-700">
          Kein Chat und keine medizinische Beratung. Bei akuten Notfällen bitte zusätzlich sofort telefonisch Kontakt aufnehmen.
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="field-label">
          Name
          <input className="field-control" required value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="field-label">
          Telefonnummer
          <input
            className="field-control"
            required
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </label>
        <label className="field-label">
          Tierart
          <select className="field-control" value={animalType} onChange={(event) => setAnimalType(event.target.value as AnimalType)}>
            {animalTypeOptions.map((option) => (
              <option key={option} value={option}>
                {animalTypeLabels[option]}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Situation
          <select className="field-control" value={service} onChange={(event) => setService(event.target.value as Service)}>
            {serviceOptions.map((option) => (
              <option key={option} value={option}>
                {serviceLabels[option]}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label sm:col-span-2">
          Bezirk / Ort
          <input className="field-control" required value={location} onChange={(event) => setLocation(event.target.value)} />
        </label>
        <label className="field-label sm:col-span-2">
          Kurze Nachricht
          <textarea
            className="field-control min-h-28"
            required
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </label>
      </div>

      <label className="mt-4 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
        <input
          checked={accepted}
          className="mt-1 h-5 w-5 shrink-0 accent-emerald-700"
          required
          type="checkbox"
          onChange={(event) => setAccepted(event.target.checked)}
        />
        <span>
          Ich verstehe, dass dies keine medizinische Beratung ersetzt und ich bei akuten Notfällen zusätzlich telefonisch Kontakt
          aufnehmen muss.
        </span>
      </label>

      <button className="btn-primary mt-4 w-full sm:w-auto" type="submit">
        Anfrage lokal speichern
      </button>

      {saved ? (
        <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-900">
          Anfrage wurde in der lokalen MVP-Liste gespeichert.
        </p>
      ) : null}
    </form>
  );
}
