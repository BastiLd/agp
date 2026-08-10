"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getPremiumStatus, getPremiumType } from "@/lib/premium";

interface PremiumContextType {
  isPremium: boolean;
  premiumType: string | null;
  refreshPremium: () => void;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [premiumType, setPremiumType] = useState<string | null>(null);

  const refreshPremium = () => {
    setIsPremium(getPremiumStatus());
    setPremiumType(getPremiumType());
  };

  useEffect(() => {
    refreshPremium();

    // Listen for storage changes (e.g., from other tabs)
    const handleStorageChange = () => {
      refreshPremium();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <PremiumContext.Provider value={{ isPremium, premiumType, refreshPremium }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error("usePremium must be used within a PremiumProvider");
  }
  return context;
}

