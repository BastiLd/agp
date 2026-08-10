"use client";

import { useState } from "react";

interface FormulaResultProps {
  formula: string;
  explanation?: string;
  remaining?: number;
  limit?: number;
}

export function FormulaResult({
  formula,
  explanation,
  remaining,
  limit,
}: FormulaResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formula);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Fehler beim Kopieren:", err);
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="bg-excel-gray border-2 border-excel-blue rounded-lg p-4 md:p-6">
        <div className="flex items-start justify-between gap-4 mb-2">
          <code className="text-sm md:text-base font-mono text-gray-800 break-all flex-1">
            {formula}
          </code>
          <button
            onClick={handleCopy}
            className="flex-shrink-0 px-4 py-2 bg-excel-blue text-white rounded-lg hover:bg-excel-blue-dark transition-colors text-sm font-semibold whitespace-nowrap"
          >
            {copied ? "✓ Kopiert!" : "Kopieren"}
          </button>
        </div>
      </div>

      {explanation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700">
          <p className="font-semibold mb-1">Erklärung:</p>
          <p>{explanation}</p>
        </div>
      )}

      {remaining !== undefined && limit !== undefined && (
        <div className="text-sm text-gray-600 text-center">
          Verbleibende Anfragen heute: {remaining} / {limit}
        </div>
      )}
    </div>
  );
}

