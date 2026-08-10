"use client";

import { useState, useEffect } from "react";
import { FormulaResult } from "./FormulaResult";
import { LimitReachedOverlay } from "./LimitReachedOverlay";
import {
  getStoredRequestCount,
  incrementStoredRequestCount,
  checkClientSideLimit,
} from "@/lib/browser-storage";

export function FormulaGenerator() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    formula: string;
    explanation?: string;
    remaining?: number;
    limit?: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLimitOverlay, setShowLimitOverlay] = useState(false);
  const [clientRequestCount, setClientRequestCount] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    // Lade gespeicherte Request-Anzahl beim Mount
    setClientRequestCount(getStoredRequestCount());
    
    // Lade gespeicherte Email
    const savedEmail = localStorage.getItem("userEmail");
    if (savedEmail) {
      setUserEmail(savedEmail);
      setEmailInput(savedEmail);
      checkProStatus(savedEmail);
    }
  }, []);

  const checkProStatus = async (email: string) => {
    if (!email) return;
    
    setCheckingStatus(true);
    try {
      const response = await fetch(`/api/user-status?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      setIsPro(data.isPro || false);
    } catch (error) {
      console.error("Error checking Pro status:", error);
      setIsPro(false);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailInput.trim();
    
    if (!email || !email.includes("@")) {
      setError("Bitte gib eine gültige Email-Adresse ein.");
      return;
    }

    localStorage.setItem("userEmail", email);
    setUserEmail(email);
    checkProStatus(email);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Bitte gib eine Beschreibung ein.");
      return;
    }

    // Client-seitige Limit-Prüfung (Fallback) - nur wenn nicht Pro
    if (!isPro && !checkClientSideLimit(5)) {
      setShowLimitOverlay(true);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Email aus State oder localStorage holen
      const emailToUse = userEmail || localStorage.getItem("userEmail");
      
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(emailToUse && { "x-user-email": emailToUse }),
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "LIMIT_REACHED") {
          setShowLimitOverlay(true);
          incrementStoredRequestCount();
          setClientRequestCount(getStoredRequestCount());
        } else {
          setError(data.error || "Ein Fehler ist aufgetreten.");
        }
        return;
      }

      // Erfolgreiche Request: Client-seitig speichern
      incrementStoredRequestCount();
      setClientRequestCount(getStoredRequestCount());

      setResult({
        formula: data.formula,
        explanation: data.explanation,
        remaining: data.remaining,
        limit: data.limit,
      });
    } catch (err) {
      setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-excel-blue mb-2">
                Excel Formel Retter
              </h1>
              <p className="text-gray-600">
                Beschreibe dein Problem in normaler Sprache und erhalte sofort
                die passende Formel.
              </p>
            </div>
            <div className="mt-4 md:mt-0 md:ml-4 flex flex-col items-end gap-2">
              {isPro && (
                <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-semibold text-sm">
                  ✓ Pro Mitglied
                </div>
              )}
              {!isPro && (
                <a
                  href="#pricing"
                  className="px-6 py-2 bg-excel-blue text-white font-semibold rounded-lg hover:bg-excel-blue-dark transition-colors text-center whitespace-nowrap"
                >
                  Upgrade zu Pro
                </a>
              )}
            </div>
          </div>

          {/* Email-Eingabefeld */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <form onSubmit={handleEmailSubmit} className="flex flex-col md:flex-row gap-2">
              <div className="flex-1">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Deine Email-Adresse {userEmail && `(${userEmail})`}
                </label>
                <input
                  type="email"
                  id="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="deine@email.com"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-excel-blue focus:outline-none"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={checkingStatus || !emailInput.trim()}
                  className="px-6 py-2 bg-excel-blue text-white font-semibold rounded-lg hover:bg-excel-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {checkingStatus ? "Prüfe..." : userEmail ? "Aktualisieren" : "Email speichern"}
                </button>
              </div>
            </form>
            {userEmail && (
              <p className="mt-2 text-xs text-gray-600">
                {isPro 
                  ? "✓ Du hast Pro-Zugriff mit unbegrenzten Formeln!" 
                  : "ℹ Gib deine Email ein, mit der du bezahlt hast, um deinen Pro-Status zu aktivieren."}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Beschreibe dein Problem, z.B.: 'Zähle alle Werte in Spalte B, wenn in A > 10 ist.'"
                className="w-full h-32 md:h-40 p-4 border-2 border-gray-300 rounded-lg focus:border-excel-blue focus:outline-none resize-none text-base"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full md:w-auto px-8 py-3 bg-excel-blue text-white font-semibold rounded-lg hover:bg-excel-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Formel wird generiert..." : "Formel generieren"}
            </button>

            {result && (
              <FormulaResult
                formula={result.formula}
                explanation={result.explanation}
                remaining={result.remaining}
                limit={result.limit}
              />
            )}
          </div>
        </div>
      </div>

      {showLimitOverlay && (
        <LimitReachedOverlay onClose={() => setShowLimitOverlay(false)} />
      )}
    </>
  );
}

