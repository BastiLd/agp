"use client";

import Image from "next/image";

export default function ATSAnalysis() {
  return (
    <section id="ats-analysis" className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            See What Recruiters See In Your Resume
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Our AI analyzes your resume just like an ATS system would, highlighting strengths and areas for improvement to maximize your interview chances.
          </p>
        </div>

        <div className="relative min-h-[600px] lg:min-h-[700px] flex items-center justify-center">
          {/* Resume Preview */}
          <div className="relative z-10 w-full max-w-2xl mx-auto">
            <div className="relative aspect-[8.5/11] w-full shadow-2xl rounded-lg overflow-hidden">
              <Image
                src="https://www.resumax.ai/_next/image?url=%2Fassets%2FSWErikCodes_Resume.png&w=1920&q=75"
                alt="Sample Resume"
                fill
                className="object-contain bg-white"
                sizes="100vw"
              />
            </div>
          </div>

          {/* Score Card - Right */}
          <div className="hidden md:block absolute right-4 lg:right-12 top-4 lg:top-8 z-20 w-80 bg-slate-800/95 backdrop-blur-sm shadow-2xl border border-slate-600/40 rounded-xl py-6">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="relative w-28 h-28 mx-auto mb-4">
                  <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="rgb(51 65 85)" strokeWidth="6" fill="none"></circle>
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#10b981"
                      strokeWidth="6"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray="251.32741228718345"
                      strokeDashoffset="17.59291886010283"
                    ></circle>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400">93</div>
                      <div className="text-sm text-slate-400">/ 100</div>
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-green-400">Excellent Resume!</h3>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white flex items-center mb-3">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Category Breakdown
                </h4>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">ATS</span>
                    <span className="font-semibold text-green-400">25/25</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: "100%" }}></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Content</span>
                    <span className="font-semibold text-green-400">32/35</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: "91%" }}></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Writing</span>
                    <span className="font-semibold text-green-400">9/10</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: "90%" }}></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Job Match</span>
                    <span className="font-semibold text-yellow-400">20/25</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 rounded-full" style={{ width: "80%" }}></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Ready</span>
                    <span className="font-semibold text-green-400">5/5</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: "100%" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Left Analysis Card */}
          <div className="hidden md:block absolute left-4 lg:left-12 top-4 lg:top-8 z-20 w-72 bg-slate-800/95 backdrop-blur-sm shadow-2xl border border-slate-600/40 rounded-xl py-6">
            <div className="p-5 space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xs font-bold">Strengths Identified</h3>
                </div>
                <p className="text-xs text-slate-300 pl-6">
                  Strong technical skills and quantified experience bullets with business impact.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-yellow-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <h3 className="text-xs font-bold">Improvement Suggestions</h3>
                </div>
                <p className="text-xs text-slate-300 pl-6">
                  Emphasize technical leadership and add production-level projects.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-600/40">
                <p className="text-xs text-slate-400 mb-2">Score Breakdown</p>
                <div className="grid grid-cols-5 gap-1">
                  <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-green-500" style={{ width: "100%" }}></div>
                  </div>
                  <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-green-500" style={{ width: "100%" }}></div>
                  </div>
                  <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-green-500" style={{ width: "91%" }}></div>
                  </div>
                  <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-green-500" style={{ width: "90%" }}></div>
                  </div>
                  <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-yellow-500" style={{ width: "80%" }}></div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 text-right">91% of maximum</p>
              </div>
            </div>
          </div>

          {/* Bottom Left Card - Strong Bullet */}
          <div className="hidden lg:block absolute left-4 lg:left-12 bottom-12 lg:bottom-20 z-20 w-80 bg-slate-800/95 backdrop-blur-sm shadow-2xl border border-slate-600/40 rounded-xl py-6">
            <div className="p-5 space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xs font-bold">Strong Bullet</h3>
                </div>
                <div className="pl-6">
                  <p className="text-xs text-slate-300">
                    'Optimized a Redis-backed caching layer, increasing cache hit rate from 38% to 91%, resulting in a 58% reduction in p95 latency and saving $11K in monthly infrastructure costs.'
                  </p>
                  <p className="text-xs text-green-400/70 mt-1 italic">
                    Highly quantified, business impact, technical depth.
                  </p>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-slate-600/40">
                <div className="flex items-center gap-2 text-yellow-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <h3 className="text-xs font-bold">How to Improve</h3>
                </div>
                <div className="pl-6 space-y-1">
                  <p className="text-xs text-slate-400">
                    <span className="text-red-400">Weak:</span> 'Developed a Spring Boot app with Docker on AWS EC2, serving 30+ stakeholders.'
                  </p>
                  <p className="text-xs text-slate-300">
                    <span className="text-green-400">Better:</span> 'Reduced deployment overhead by 40% through containerizing Spring Boot apps with Docker on AWS EC2, enabling faster delivery to 30+ stakeholders.'
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Right Card - AI Content Writer */}
          <div className="hidden lg:block absolute right-8 lg:right-24 bottom-12 lg:bottom-20 z-20 w-64 bg-slate-800/95 backdrop-blur-sm shadow-2xl border border-slate-600/40 rounded-xl py-6">
            <div className="p-5">
              <h3 className="text-sm font-bold text-white mb-3">AI Content Writer</h3>
              <p className="text-xs text-slate-300 mb-4">
                Generate metrics-driven bullets focused on technical skills and impact.
              </p>
              <button className="inline-flex items-center justify-center gap-2 w-full bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white font-semibold rounded-md px-6 py-2.5 shadow-md transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                GENERATE BULLET
              </button>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12 lg:hidden">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="bg-slate-700 px-4 py-2 rounded-lg">
                  <h3 className="text-sm font-bold text-white">Resume Review</h3>
                </div>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-sm text-slate-300">
                Get your ResuMax Score across 23 key metrics which help you get through Applicant Tracking Systems.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="bg-slate-700 px-4 py-2 rounded-lg">
                  <h3 className="text-sm font-bold text-white">AI Content Writer</h3>
                </div>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-sm text-slate-300">
                AI writes metrics-driven resume content for you, focused on technical skills and impact that recruiters look for.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="bg-slate-700 px-4 py-2 rounded-lg">
                  <h3 className="text-sm font-bold text-white">Keyword Targeting</h3>
                </div>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-sm text-slate-300">
                ResuMax identifies and integrates the most important keywords from job descriptions to pass ATS filters.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="bg-slate-700 px-4 py-2 rounded-lg">
                  <h3 className="text-sm font-bold text-white">Strong Bullets</h3>
                </div>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-sm text-slate-300">
                Learn how to write quantified, impact-driven bullets with business value and technical depth.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

