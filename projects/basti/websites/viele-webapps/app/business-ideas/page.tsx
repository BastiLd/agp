"use client";

import { useState } from "react";
import AdPlaceholder from "@/components/AdPlaceholder";
import { usePremium } from "@/contexts/PremiumContext";
import Link from "next/link";

interface BusinessIdea {
  niche: string;
  businessModel: string;
  targetAudience: string;
  monetizationStrategy: string;
}

const NICHES = [
  "Sustainable Living",
  "Remote Work Tools",
  "Health & Wellness",
  "E-Learning",
  "Pet Care",
  "Home Automation",
  "Personal Finance",
  "Fitness & Sports",
  "Food & Beverage",
  "Travel & Tourism",
  "Fashion & Style",
  "Gaming & Entertainment",
  "Real Estate",
  "Beauty & Skincare",
  "Parenting & Family",
  "Senior Care",
  "Renewable Energy",
  "Mental Health",
  "Local Services",
  "B2B Software",
];

const BUSINESS_MODELS = [
  "SaaS (Software as a Service)",
  "Marketplace Platform",
  "Subscription Box",
  "Freemium Model",
  "E-commerce Store",
  "Consulting Services",
  "Mobile App",
  "Online Course Platform",
  "Affiliate Marketing",
  "Dropshipping",
  "Digital Products",
  "Membership Community",
  "On-Demand Service",
  "White-Label Solution",
  "Franchise Model",
];

const TARGET_AUDIENCES = [
  "Millennials (25-40)",
  "Gen Z (18-24)",
  "Gen X (41-56)",
  "Baby Boomers (57+)",
  "Small Business Owners",
  "Entrepreneurs",
  "Remote Workers",
  "Parents",
  "Students",
  "Professionals",
  "Fitness Enthusiasts",
  "Tech-Savvy Users",
  "Budget-Conscious Consumers",
  "Luxury Seekers",
  "Eco-Conscious Individuals",
];

const MONETIZATION_STRATEGIES = [
  "Monthly/Annual Subscriptions",
  "One-Time Purchase",
  "Commission-Based",
  "Advertising Revenue",
  "Freemium Upsells",
  "Premium Features",
  "Affiliate Commissions",
  "Licensing Fees",
  "Transaction Fees",
  "Data Monetization",
  "Sponsored Content",
  "White-Label Licensing",
  "API Access Fees",
  "Marketplace Fees",
  "Consulting Services",
];

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateBusinessIdea(): BusinessIdea {
  return {
    niche: getRandomItem(NICHES),
    businessModel: getRandomItem(BUSINESS_MODELS),
    targetAudience: getRandomItem(TARGET_AUDIENCES),
    monetizationStrategy: getRandomItem(MONETIZATION_STRATEGIES),
  };
}

function IdeaCard({ idea, isPremium, index }: { idea: BusinessIdea; isPremium: boolean; index: number }) {
  const isBlurred = !isPremium && index > 0;

  return (
    <div className="relative bg-white dark:bg-black border-2 border-black dark:border-white rounded-lg p-6">
      {isBlurred && (
        <>
          <div className="blur-sm pointer-events-none select-none">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Niche
                </h3>
                <p className="text-lg font-bold">{idea.niche}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Business Model
                </h3>
                <p className="text-lg">{idea.businessModel}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Target Audience
                </h3>
                <p className="text-lg">{idea.targetAudience}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Monetization
                </h3>
                <p className="text-lg">{idea.monetizationStrategy}</p>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/80 dark:bg-black/80 backdrop-blur-sm rounded-lg">
            <div className="bg-white dark:bg-black border-2 border-black dark:border-white rounded-lg p-6 text-center max-w-xs">
              <div className="text-4xl mb-3">🔒</div>
              <p className="text-sm font-semibold mb-1 uppercase tracking-wide">Premium Feature</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Unlock 3 additional ideas
              </p>
              <Link
                href="/premium"
                className="inline-block px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity font-semibold uppercase text-xs tracking-wide"
              >
                Upgrade Now
              </Link>
            </div>
          </div>
        </>
      )}
      {!isBlurred && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Niche
            </h3>
            <p className="text-lg font-bold">{idea.niche}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Business Model
            </h3>
            <p className="text-lg">{idea.businessModel}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Target Audience
            </h3>
            <p className="text-lg">{idea.targetAudience}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Monetization
            </h3>
            <p className="text-lg">{idea.monetizationStrategy}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BusinessIdeasPage() {
  const { isPremium } = usePremium();
  const [ideas, setIdeas] = useState<BusinessIdea[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    
    // Generate 1 free idea + 3 premium ideas
    const newIdeas = [
      generateBusinessIdea(), // Free idea
      generateBusinessIdea(), // Premium idea 1
      generateBusinessIdea(), // Premium idea 2
      generateBusinessIdea(), // Premium idea 3
    ];

    // Small delay for better UX
    setTimeout(() => {
      setIdeas(newIdeas);
      setIsGenerating(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold mb-4 tracking-tight">Business Ideas</h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">
            Generate and explore business opportunities. Find your next big idea.
          </p>

          <div className="mb-8">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity font-semibold uppercase text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? "Generating..." : "Generate Idea"}
            </button>
          </div>

          {ideas.length > 0 && (
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {ideas.map((idea, index) => (
                  <IdeaCard
                    key={index}
                    idea={idea}
                    isPremium={isPremium}
                    index={index}
                  />
                ))}
              </div>
              
              {!isPremium && (
                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    <span className="font-semibold">💡 Premium Feature:</span> Get 3 additional business ideas per generation.{" "}
                    <Link href="/premium" className="underline hover:opacity-80">
                      Upgrade now
                    </Link>
                  </p>
                </div>
              )}
            </div>
          )}

          {ideas.length === 0 && (
            <div className="bg-white dark:bg-black border-2 border-black dark:border-white rounded-lg p-12 mb-8">
              <div className="text-center py-16">
                <div className="text-8xl mb-6">💼</div>
                <h2 className="text-3xl font-bold mb-4 uppercase tracking-wide">Business Idea Generator</h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                  Click the button above to generate your first business idea. Premium users get 3 additional ideas per generation.
                </p>
              </div>
            </div>
          )}

          <AdPlaceholder className="mb-6" />
        </div>
      </div>
    </div>
  );
}
