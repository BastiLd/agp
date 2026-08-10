"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-600/40 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-pink-400">ResuMax</div>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <button className="text-slate-300 hover:text-pink-400 transition-colors">
              AI Resume Builder
            </button>
            <button className="text-slate-300 hover:text-pink-400 transition-colors">
              ATS Analysis
            </button>
            <button className="text-slate-300 hover:text-pink-400 transition-colors">
              Templates
            </button>
            <button className="text-slate-300 hover:text-pink-400 transition-colors">
              Pricing
            </button>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white px-4 py-2"
            >
              Get Started Free
            </Link>
          </div>
          <div className="md:hidden">
            <button
              className="text-slate-300 hover:text-pink-400 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <button className="block w-full text-left text-slate-300 hover:text-pink-400 transition-colors py-2">
              AI Resume Builder
            </button>
            <button className="block w-full text-left text-slate-300 hover:text-pink-400 transition-colors py-2">
              ATS Analysis
            </button>
            <button className="block w-full text-left text-slate-300 hover:text-pink-400 transition-colors py-2">
              Templates
            </button>
            <button className="block w-full text-left text-slate-300 hover:text-pink-400 transition-colors py-2">
              Pricing
            </button>
            <Link
              href="/dashboard"
              className="block w-full text-center bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white rounded-md py-2 mt-2"
            >
              Get Started Free
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

