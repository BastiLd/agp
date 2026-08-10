"use client";

import AdPlaceholder from "@/components/AdPlaceholder";
import { usePremium } from "@/contexts/PremiumContext";

export default function DreamhousePage() {
  const { isPremium } = usePremium();

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-4 tracking-tight">Dreamhouse</h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-12">
            Design your perfect dream house. Plan every room, every detail, and make it yours.
          </p>

          <div className="bg-white dark:bg-black border-2 border-black dark:border-white rounded-lg p-12 mb-8">
            <div className="text-center py-16">
              <div className="text-8xl mb-6">🏠</div>
              <h2 className="text-3xl font-bold mb-4 uppercase tracking-wide">Dreamhouse Designer</h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                {isPremium 
                  ? "Premium Feature: Advanced house design tools unlocked!" 
                  : "This is a placeholder for the dreamhouse designer. Premium users get access to advanced features."}
              </p>
            </div>
          </div>

          <AdPlaceholder className="mb-6" />
        </div>
      </div>
    </div>
  );
}

