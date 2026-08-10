"use client";

import Link from "next/link";

export default function ResuMaxScore() {
  return (
    <section id="ai-builder" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Upload Your Resume to Start for Free
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Get your ResuMax Score instantly and discover how to maximize your resume's impact. Our AI analyzes every aspect of your resume to ensure it gets past ATS systems.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-600/40 rounded-xl py-6 shadow-sm">
            <div className="p-8">
              <div className="grid grid-cols-1 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-semibold text-white">Your ResuMax Score</h3>
                    <span className="text-4xl font-bold text-pink-400">0/100</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-4">
                    <div className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-4 rounded-full transition-all duration-300" style={{ width: "0%" }}></div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg transition-all duration-300">
                      <div className="w-4 h-4 bg-red-500 rounded-full transition-colors duration-500"></div>
                      <span className="font-medium text-white">Content Quality</span>
                      <div className="ml-auto text-sm font-semibold text-red-400 transition-colors duration-500">9/35</div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg transition-all duration-300">
                      <div className="w-4 h-4 bg-red-500 rounded-full transition-colors duration-500"></div>
                      <span className="font-medium text-white">ATS & Structure</span>
                      <div className="ml-auto text-sm font-semibold text-red-400 transition-colors duration-500">9/25</div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg transition-all duration-300">
                      <div className="w-4 h-4 bg-red-500 rounded-full transition-colors duration-500"></div>
                      <span className="font-medium text-white">Job Optimization</span>
                      <div className="ml-auto text-sm font-semibold text-red-400 transition-colors duration-500">3/25</div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg transition-all duration-300">
                      <div className="w-4 h-4 bg-green-500 rounded-full transition-colors duration-500"></div>
                      <span className="font-medium text-white">Writing Quality</span>
                      <div className="ml-auto text-sm font-semibold text-green-400 transition-colors duration-500">1/10</div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg transition-all duration-300">
                      <div className="w-4 h-4 bg-red-500 rounded-full transition-colors duration-500"></div>
                      <span className="font-medium text-white">Application Ready</span>
                      <div className="ml-auto text-sm font-semibold text-red-400 transition-colors duration-500">1/5</div>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm">
                    Import your resume to get a detailed analysis and personalized recommendations
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <Link
                    href="/review"
                    className="inline-flex items-center justify-center gap-2 w-full max-w-sm bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white font-semibold rounded-md px-6 py-2.5 shadow-lg transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Import Resume
                  </Link>
                  <p className="text-xs text-slate-400 mt-4 text-center max-w-sm">
                    Get your detailed ResuMax Score with personalized feedback for each category
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

