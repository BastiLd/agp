"use client";

import Link from "next/link";
import { usePremium } from "@/contexts/PremiumContext";
import AdPlaceholder from "@/components/AdPlaceholder";

export default function Home() {
  const { isPremium } = usePremium();

  const apps = [
    {
      title: "Ecosystem",
      description: "Build and explore interactive ecosystems",
      href: "/ecosystem",
      color: "from-green-400 to-emerald-600",
      icon: "🌱",
      gradient: "bg-gradient-to-br from-green-400 to-emerald-600",
    },
    {
      title: "World Builder",
      description: "Create and design your own worlds",
      href: "/world-builder",
      color: "from-blue-400 to-cyan-600",
      icon: "🌍",
      gradient: "bg-gradient-to-br from-blue-400 to-cyan-600",
    },
    {
      title: "Business Ideas",
      description: "Generate and explore business opportunities",
      href: "/business-ideas",
      color: "from-purple-400 to-pink-600",
      icon: "💼",
      gradient: "bg-gradient-to-br from-purple-400 to-pink-600",
    },
    {
      title: "Dreamhouse",
      description: "Design your perfect dream house",
      href: "/dreamhouse",
      color: "from-pink-400 to-rose-600",
      icon: "🏠",
      gradient: "bg-gradient-to-br from-pink-400 to-rose-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Go Premium Banner */}
      {!isPremium && (
        <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 py-3">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-4">
              <span className="text-sm font-semibold text-white">
                🎉 Unlock Premium Features - Remove Ads & Get Exclusive Content
              </span>
              <Link
                href="/premium"
                className="px-4 py-1 bg-white text-orange-600 rounded-full hover:bg-gray-100 transition-colors font-bold text-sm uppercase tracking-wide"
              >
                Go Premium
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-7xl font-bold mb-4 tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Viele WebApps
          </h1>
          <p className="text-xl text-gray-600">
            games and stuff
          </p>
        </div>

        {/* App Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto mb-16">
          {apps.map((app) => (
            <Link
              key={app.href}
              href={app.href}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200"
            >
              {/* Gradient Header */}
              <div className={`${app.gradient} h-56 flex items-center justify-center relative overflow-hidden`}>
                <div className="text-8xl transform group-hover:scale-110 transition-transform duration-300">
                  {app.icon}
                </div>
                {/* Shine effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>

              {/* Card Content */}
              <div className="p-6">
                <h2 className="text-3xl font-bold mb-2 text-gray-900 group-hover:text-gray-700 transition-colors">
                  {app.title}
                </h2>
                <p className="text-gray-600 text-base">
                  {app.description}
                </p>
                
                {/* Arrow indicator */}
                <div className="mt-4 flex items-center text-gray-400 group-hover:text-gray-600 transition-colors">
                  <span className="text-sm font-semibold mr-2">Explore</span>
                  <svg 
                    className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Hover border effect */}
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-gray-300 rounded-2xl transition-colors pointer-events-none"></div>
            </Link>
          ))}
        </div>

        {/* Ad Blocks */}
        {!isPremium && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto mb-8">
            <AdPlaceholder className="mb-0" />
            <AdPlaceholder className="mb-0" />
          </div>
        )}

        {/* Premium CTA Section */}
        {!isPremium && (
          <div className="max-w-4xl mx-auto mt-16">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white shadow-xl">
              <h2 className="text-4xl font-bold mb-4">Ready to Go Premium?</h2>
              <p className="text-xl mb-6 text-blue-100">
                Unlock all features, remove ads, and support the project
              </p>
              <Link
                href="/premium"
                className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-bold text-lg uppercase tracking-wide shadow-lg"
              >
                Get Premium Now
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
