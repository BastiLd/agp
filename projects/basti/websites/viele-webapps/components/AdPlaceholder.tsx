"use client";

import { usePremium } from "@/contexts/PremiumContext";

interface AdPlaceholderProps {
  className?: string;
}

export default function AdPlaceholder({ className = "" }: AdPlaceholderProps) {
  const { isPremium } = usePremium();

  if (isPremium) {
    return null;
  }

  return (
    <div className={`bg-yellow-50 dark:bg-yellow-950 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-6 ${className}`}>
      <p className="text-xs text-yellow-800 dark:text-yellow-300 mb-3 text-center font-semibold uppercase tracking-wide">
        Ad Placeholder - Google Ads Ready
      </p>
      <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 flex items-center justify-center">
        <span className="text-gray-400 dark:text-gray-500 text-sm">Advertisement</span>
      </div>
    </div>
  );
}

