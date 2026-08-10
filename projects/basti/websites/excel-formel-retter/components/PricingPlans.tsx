"use client";

import { useState } from "react";

export function PricingPlans() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (planType: "monthly" | "yearly" | "lifetime") => {
    setLoading(planType);

    try {
      // Optional: Email aus localStorage holen (falls bereits vorhanden)
      const savedEmail = typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          planType, 
          email: savedEmail || undefined 
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Fehler beim Erstellen der Checkout-Session");
      }
    } catch (error) {
      console.error("Checkout Error:", error);
      alert("Ein Fehler ist aufgetreten");
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    {
      name: "Monatlich",
      price: "3,99",
      period: "€ / Monat",
      planType: "monthly" as const,
      popular: false,
    },
    {
      name: "Jährlich",
      price: "36,99",
      period: "€ / Jahr",
      planType: "yearly" as const,
      popular: true,
      savings: "Sparst 23%",
    },
    {
      name: "Lifetime",
      price: "45",
      period: "€ einmalig",
      planType: "lifetime" as const,
      popular: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      {plans.map((plan) => (
        <div
          key={plan.planType}
          className={`relative border-2 rounded-lg p-6 ${
            plan.popular
              ? "border-excel-blue bg-blue-50"
              : "border-gray-300 bg-white"
          }`}
        >
          {plan.popular && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-excel-blue text-white px-3 py-1 rounded-full text-xs font-semibold">
              {plan.savings}
            </div>
          )}

          <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
          <div className="mb-4">
            <span className="text-3xl font-bold text-excel-blue">
              {plan.price}
            </span>
            <span className="text-gray-600 ml-1">{plan.period}</span>
          </div>

          <ul className="space-y-2 mb-6 text-sm text-gray-700">
            <li className="flex items-center">
              <span className="text-excel-blue mr-2">✓</span>
              Unbegrenzte Formeln
            </li>
            <li className="flex items-center">
              <span className="text-excel-blue mr-2">✓</span>
              Excel & Google Sheets
            </li>
            <li className="flex items-center">
              <span className="text-excel-blue mr-2">✓</span>
              Priorität Support
            </li>
          </ul>

          <button
            onClick={() => handleCheckout(plan.planType)}
            disabled={loading === plan.planType}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              plan.popular
                ? "bg-excel-blue text-white hover:bg-excel-blue-dark"
                : "bg-gray-200 text-gray-900 hover:bg-gray-300"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading === plan.planType ? "Wird geladen..." : "Jetzt kaufen"}
          </button>
        </div>
      ))}
    </div>
  );
}

