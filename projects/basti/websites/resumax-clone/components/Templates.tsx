"use client";

import Link from "next/link";
import Image from "next/image";

export default function Templates() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Professional Resume Templates
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            ATS-optimized templates designed by industry professionals to help you land your dream job.
          </p>
        </div>

        {/* Template Previews */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="relative aspect-[8.5/11] bg-white rounded-lg shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <span className="text-slate-400 text-sm">Matty's Resume Template</span>
            </div>
          </div>
          <div className="relative aspect-[8.5/11] bg-white rounded-lg shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <span className="text-slate-400 text-sm">Jake's Resume Template</span>
            </div>
          </div>
          <div className="relative aspect-[8.5/11] bg-white rounded-lg shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <span className="text-slate-400 text-sm">SWErikCodes Resume Template</span>
            </div>
          </div>
        </div>

        <div className="text-center mb-12">
          <Link
            href="/dashboard/resumes"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white font-semibold rounded-md px-8 py-3 shadow-lg transition-all mb-4"
          >
            Start Building Your Resume
          </Link>
          <p className="text-slate-400 text-sm">
            All templates are ATS-friendly and fully customizable
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-pink-400/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Industry Tested</h3>
            <p className="text-slate-300 text-sm">
              Every template is designed by industry professionals to ensure maximum impact
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-pink-400/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">AI-Powered Bullet Points</h3>
            <p className="text-slate-300 text-sm">
              Generate compelling, metrics-driven bullets trained specifically for what recruiters look for
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-pink-400/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Instant Download</h3>
            <p className="text-slate-300 text-sm">
              Export your ATS friendly resume as PDF with one click so you actually get hired
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

