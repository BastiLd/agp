"use client";

import Link from "next/link";

export default function Pricing() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Choose Your Plan
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Start free and upgrade when you're ready to accelerate your job search
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-600/40 rounded-xl p-8">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
              <div className="text-3xl font-bold text-white mb-2">$0<span className="text-lg text-slate-400">/forever</span></div>
              <p className="text-slate-300">Build a great resume manually</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-slate-300">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Manual resume builder</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>3 resumes with 1 Word download</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>1 basic ATS-optimized template</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>AI-powered content generation</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>ATS keyword optimization</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Unlimited resumes & downloads</span>
              </li>
            </ul>
            <Link
              href="/review"
              className="block w-full text-center bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-md py-3 transition-colors"
            >
              Create Free Resume
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-600/40 rounded-xl p-8">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <div className="text-3xl font-bold text-white mb-2">$15<span className="text-lg text-slate-400">/month</span></div>
              <p className="text-slate-300">Supercharge your resume with AI</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-slate-300">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Everything in Free, plus:</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>AI bullet point generator</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>AI summary & headline writer</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>ATS keyword optimization & scoring</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Unlimited resumes & exports</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Full template library access</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Priority email support</span>
              </li>
            </ul>
            <Link
              href="/dashboard"
              className="block w-full text-center bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white font-semibold rounded-md py-3 transition-all"
            >
              Upgrade to Pro
            </Link>
          </div>

          {/* Recruiting Plan */}
          <div className="bg-slate-800/60 backdrop-blur-sm border-2 border-pink-500/50 rounded-xl p-8 relative">
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-t-xl py-2 px-4">
              <div className="flex items-center justify-between text-white text-sm font-semibold">
                <span>SAVE 33%</span>
                <span>Most Popular</span>
              </div>
            </div>
            <div className="mb-6 mt-8">
              <h3 className="text-2xl font-bold text-white mb-2">Recruiting Plan</h3>
              <div className="text-3xl font-bold text-white mb-2">$60<span className="text-lg text-slate-400">/6 months</span></div>
              <p className="text-slate-300">Perfect for your entire job search journey</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-slate-300">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Everything in Pro included</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>AI bullet point generator</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>ATS keyword optimization</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Unlimited resumes & exports</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Full template library access</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Priority email support</span>
              </li>
            </ul>
            <Link
              href="/dashboard"
              className="block w-full text-center bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white font-semibold rounded-md py-3 transition-all"
            >
              Get Recruiting Plan
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

