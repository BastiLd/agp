"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { usePremium } from "@/contexts/PremiumContext";
import { setPremium } from "@/lib/premium";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import PremiumBadge from "@/components/PremiumBadge";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

const PRICING = {
  monthly: { price: 1.49, currency: "EUR", label: "Monthly" },
  yearly: { price: 9.99, currency: "EUR", label: "Yearly" },
  lifetime: { price: 19, currency: "EUR", label: "Lifetime" },
};

function CheckoutForm({ plan }: { plan: keyof typeof PRICING }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { refreshPremium } = usePremium();

  // Create payment intent when component mounts
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ plan }),
        });

        const data = await response.json();
        if (data.clientSecret) {
          // If it's a mock payment (no Stripe keys), handle it differently
          if (data.isMock) {
            setClientSecret("mock");
          } else {
            setClientSecret(data.clientSecret);
          }
        } else {
          setError("Failed to initialize payment");
        }
      } catch (err) {
        setError("Failed to initialize payment");
      }
    };

    createPaymentIntent();
  }, [plan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Handle mock payments (development mode without Stripe keys)
    if (clientSecret === "mock") {
      setLoading(true);
      setError(null);
      
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setPremium(plan);
      refreshPremium();
      window.location.href = "/premium-success";
      return;
    }

    if (!stripe || !elements || !clientSecret) return;

    setLoading(true);
    setError(null);

    try {
      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/premium-success`,
        },
        redirect: "if_required",
      });

      if (stripeError) {
        setError(stripeError.message || "Payment failed");
        setLoading(false);
        return;
      }

      // If payment succeeded and didn't redirect
      if (paymentIntent && paymentIntent.status === "succeeded") {
        setPremium(plan);
        refreshPremium();
        window.location.href = "/premium-success";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-lg hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity font-semibold uppercase text-sm tracking-wide"
      >
        {loading ? "Processing..." : `Subscribe for ${PRICING[plan].price}€`}
      </button>
    </form>
  );
}

function PremiumPageContent() {
  const { isPremium, premiumType } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<keyof typeof PRICING | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        window.history.replaceState({}, "", "/premium");
      }, 5000);
    }
  }, [searchParams]);

  if (isPremium && !showSuccess) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="text-center mb-8">
            <PremiumBadge />
            <h1 className="text-5xl font-bold mt-6 mb-4 tracking-tight">You're Premium!</h1>
            <p className="text-lg text-gray-500 dark:text-gray-400">
              Your {premiumType} subscription is active. Enjoy ad-free experience and premium features!
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="text-center mb-8">
            <div className="text-6xl mb-6">✅</div>
            <h1 className="text-5xl font-bold mt-4 mb-4 tracking-tight">Payment Successful!</h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-6">
              Your premium subscription has been activated.
            </p>
            <PremiumBadge />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Go Premium</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Remove ads and unlock premium features
        </p>
      </div>

      {!selectedPlan ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(PRICING).map(([key, value]) => (
            <div
              key={key}
              className="border-2 border-black dark:border-white rounded-lg p-8 hover:scale-105 transition-transform cursor-pointer bg-white dark:bg-black"
              onClick={() => setSelectedPlan(key as keyof typeof PRICING)}
            >
              <h3 className="text-2xl font-bold mb-3 uppercase tracking-wide">{value.label}</h3>
              <div className="text-4xl font-bold mb-6">
                {value.price}€
              </div>
              <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300 mb-6">
                <li className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Ad-free experience</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Premium features</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Priority support</span>
                </li>
              </ul>
              <button className="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-lg hover:opacity-80 transition-opacity font-semibold uppercase text-sm tracking-wide">
                Select Plan
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <button
              onClick={() => setSelectedPlan(null)}
              className="text-blue-600 hover:text-blue-700"
            >
              ← Back to plans
            </button>
          </div>
          <div className="border-2 border-black dark:border-white rounded-lg p-8 bg-white dark:bg-black">
            <h2 className="text-3xl font-bold mb-6 uppercase tracking-wide">
              {PRICING[selectedPlan].label} - {PRICING[selectedPlan].price}€
            </h2>
            <Elements stripe={stripePromise}>
              <CheckoutForm plan={selectedPlan} />
            </Elements>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default function PremiumPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-black flex items-center justify-center"><div>Loading...</div></div>}>
      <PremiumPageContent />
    </Suspense>
  );
}

