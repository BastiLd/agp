"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    // Email aus Stripe Session holen und in localStorage speichern
    if (sessionId) {
      fetch(`/api/session?session_id=${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.email) {
            localStorage.setItem("userEmail", data.email);
            setEmail(data.email);
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching session:", error);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-excel-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Zahlung wird verarbeitet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-excel-blue mb-2">
            Zahlung erfolgreich!
          </h1>
          <p className="text-gray-600 mb-2">
            Vielen Dank für deinen Kauf. Du hast jetzt Zugriff auf Excel Formel
            Retter Pro mit unbegrenzten Formeln.
          </p>
          {email && (
            <p className="text-sm text-gray-500 mb-2">
              Deine Email ({email}) wurde gespeichert.
            </p>
          )}
          <p className="text-sm text-gray-600">
            Du kannst jetzt unbegrenzt Formeln generieren!
          </p>
        </div>

        <Link
          href="/"
          className="inline-block px-6 py-3 bg-excel-blue text-white font-semibold rounded-lg hover:bg-excel-blue-dark transition-colors"
        >
          Zurück zur Startseite
        </Link>
      </div>
    </div>
  );
}

