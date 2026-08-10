"use client";

import { PricingPlans } from "./PricingPlans";

interface LimitReachedOverlayProps {
  onClose: () => void;
}

export function LimitReachedOverlay({ onClose }: LimitReachedOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 md:p-8">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl md:text-3xl font-bold text-excel-blue">
              Tageslimit erreicht
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <p className="text-gray-700 mb-6 text-lg">
            Du hast dein Tageslimit erreicht. Hol dir unbegrenzte Formeln mit{" "}
            <span className="font-semibold text-excel-blue">
              Excel Formel Retter Pro
            </span>
            .
          </p>

          <PricingPlans />
        </div>
      </div>
    </div>
  );
}

