"use client";

export default function FeatureCards() {
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* AI Powered Card */}
          <div className="relative group">
            <div className="relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm border border-slate-600/40 rounded-2xl p-6 overflow-hidden">
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-pink-400 via-purple-500 to-pink-400"></div>
              <div className="relative bg-slate-900/90 rounded-xl p-6">
                <div className="w-12 h-12 bg-pink-400/10 rounded-lg flex items-center justify-center mb-4 text-pink-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-white">AI</span>
                  <span className="text-2xl font-bold text-pink-400">Powered</span>
                </div>
                <p className="text-slate-400 text-sm font-medium">Smart Optimization</p>
              </div>
            </div>
          </div>

          {/* ATS Pass-Through Card */}
          <div className="relative group">
            <div className="relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm border border-slate-600/40 rounded-2xl p-6 overflow-hidden">
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-pink-400 via-purple-500 to-pink-400"></div>
              <div className="relative bg-slate-900/90 rounded-xl p-6">
                <div className="w-12 h-12 bg-pink-400/10 rounded-lg flex items-center justify-center mb-4 text-pink-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-white">100</span>
                  <span className="text-2xl font-bold text-pink-400">%</span>
                </div>
                <p className="text-slate-400 text-sm font-medium">ATS Pass-Through</p>
              </div>
            </div>
          </div>

          {/* Interview Boost Card */}
          <div className="relative group">
            <div className="relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm border border-slate-600/40 rounded-2xl p-6 overflow-hidden">
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-pink-400 via-purple-500 to-pink-400"></div>
              <div className="relative bg-slate-900/90 rounded-xl p-6">
                <div className="w-12 h-12 bg-pink-400/10 rounded-lg flex items-center justify-center mb-4 text-pink-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-white">50</span>
                  <span className="text-2xl font-bold text-pink-400">%+</span>
                </div>
                <p className="text-slate-400 text-sm font-medium">Interview Boost</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

