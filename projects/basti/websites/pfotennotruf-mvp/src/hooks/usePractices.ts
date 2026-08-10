"use client";

import { useState } from "react";
import { mockPractices } from "@/data/practices";
import type { VetPractice } from "@/types/practice";

const STORAGE_KEY = "pfotennotruf-practices";

function readStoredPractices(): VetPractice[] {
  if (typeof window === "undefined") {
    return mockPractices;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return mockPractices;
  }

  try {
    const parsed = JSON.parse(raw) as VetPractice[];
    return Array.isArray(parsed) ? parsed : mockPractices;
  } catch {
    return mockPractices;
  }
}

export function usePractices() {
  const [practices, setPractices] = useState<VetPractice[]>(() => readStoredPractices());

  function persist(nextPractices: VetPractice[]) {
    setPractices(nextPractices);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPractices));
    }
  }

  function updatePractice(id: string, update: Partial<VetPractice>) {
    const nextPractices = practices.map((practice) => (practice.id === id ? { ...practice, ...update } : practice));
    persist(nextPractices);
  }

  function resetPractices() {
    persist(mockPractices);
  }

  return {
    practices,
    updatePractice,
    resetPractices,
  };
}
