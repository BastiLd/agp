'use client'

import { SearchBar } from './SearchBar'
import Link from 'next/link'

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-16">
      <div className="absolute inset-0 bg-gradient-to-b from-[#03045e] via-[#023e8a] to-[#03045e] opacity-90 pointer-events-none" />
      <div className="absolute inset-0">
        <div className="absolute -left-32 top-10 w-72 h-72 bg-[#00b4d8]/20 blur-3xl" />
        <div className="absolute right-0 top-20 w-80 h-80 bg-[#48cae4]/20 blur-3xl" />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center animate-fade-in-up">
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight px-4 drop-shadow-[0_6px_24px_rgba(0,0,0,0.35)]">
            Discover profitable
            <br />
            <span className="gradient-text">web app ideas</span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-lg sm:text-xl md:text-2xl text-ocean-100 mb-8 max-w-3xl mx-auto px-4 leading-relaxed">
            Featuring over 1,150 apps and 560,700 screens — New content weekly.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/waitlist"
              className="px-8 py-4 bg-white text-gray-900 rounded-full font-semibold hover:bg-ocean-50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Join waitlist
            </Link>
            <Link
              href="/waitlist"
              className="px-8 py-4 bg-transparent text-white border-2 border-white/40 rounded-full font-semibold hover:border-white transition-all duration-300 transform hover:scale-105"
            >
              Get early access →
            </Link>
          </div>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-16 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <SearchBar />
          </div>
          
          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto animate-fade-in-up px-4" style={{ animationDelay: '0.3s' }}>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow">
                1,150
              </div>
              <div className="text-ocean-100 text-base sm:text-lg">Apps</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow">
                560,700
              </div>
              <div className="text-ocean-100 text-base sm:text-lg">Screens</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow">
                296,600
              </div>
              <div className="text-ocean-100 text-base sm:text-lg">Flows</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

