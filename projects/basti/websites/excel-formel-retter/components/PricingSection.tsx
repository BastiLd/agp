"use client";

import { useState } from "react";
import { PricingPlans } from "./PricingPlans";

export function PricingSection() {
  const [showPricing, setShowPricing] = useState(false);

  if (!showPricing) {
    return (
      <div className="w-full max-w-4xl mx-auto mt-12 mb-8">
        <div className="bg-gradient-to-r from-excel-blue to-excel-blue-dark rounded-lg shadow-lg p-6 md:p-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Hol dir unbegrenzte Formeln
          </h2>
          <p className="text-blue-100 mb-6 text-lg">
            Upgrade auf Excel Formel Retter Pro und generiere so viele Formeln
            wie du willst.
          </p>
          <button
            onClick={() => setShowPricing(true)}
            className="bg-white text-excel-blue font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors text-lg"
          >
            Preise anzeigen
          </button>
        </div>
      </div>
    );
  }

  return (
    <section id="pricing" className="w-full max-w-6xl mx-auto mt-12 mb-8 scroll-mt-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-excel-blue mb-4">
          Excel Formel Retter Pro
        </h2>
        <p className="text-gray-600 text-lg">
          Wähle den Plan, der am besten zu dir passt
        </p>
      </div>
      <PricingPlans />
      <div className="text-center mt-6">
        <button
          onClick={() => setShowPricing(false)}
          className="text-gray-500 hover:text-gray-700 underline"
        >
          Preise ausblenden
        </button>
      </div>
    </section>
  );
}

