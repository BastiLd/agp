"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePremium } from "@/contexts/PremiumContext";
import PremiumBadge from "@/components/PremiumBadge";
import Link from "next/link";

export default function PremiumSuccessPage() {
  const router = useRouter();
  const { isPremium, refreshPremium } = usePremium();

  useEffect(() => {
    // Refresh premium status in case it wasn't updated
    refreshPremium();
  }, [refreshPremium]);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="text-8xl mb-6">🎉</div>
            <PremiumBadge />
            <h1 className="text-5xl font-bold mt-6 mb-4 tracking-tight">
              Welcome to Premium!
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">
              Your premium subscription has been activated successfully.
            </p>
          </div>

          <div className="bg-white dark:bg-black border-2 border-black dark:border-white rounded-lg p-8 mb-6">
            <h2 className="text-2xl font-bold mb-4 uppercase tracking-wide">
              What's Next?
            </h2>
            <ul className="text-left space-y-3 text-gray-700 dark:text-gray-300 mb-6">
              <li className="flex items-center gap-3">
                <span className="text-2xl">✨</span>
                <span>Enjoy an ad-free experience across all apps</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl">🚀</span>
                <span>Unlock premium features in all mini-apps</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl">💎</span>
                <span>Access exclusive premium-only content</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity font-semibold uppercase text-sm tracking-wide"
            >
              Go to Homepage
            </Link>
            <Link
              href="/ecosystem"
              className="px-6 py-3 bg-gray-200 dark:bg-gray-800 text-black dark:text-white rounded-lg hover:opacity-80 transition-opacity font-semibold uppercase text-sm tracking-wide"
            >
              Try Premium Features
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

