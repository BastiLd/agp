'use client'

import { useState } from 'react'
import Link from 'next/link'

const features = [
  {
    title: 'AI-Powered Content',
    desc: 'Generate compelling bullet points and summaries',
    icon: (
      <svg
        className="w-6 h-6 text-yellow-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
  {
    title: 'ATS Optimized',
    desc: 'Pass through applicant tracking systems',
    icon: (
      <svg
        className="w-6 h-6 text-yellow-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m4 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: 'Core Features Included',
    desc: 'No hidden costs for essentials',
    icon: (
      <svg
        className="w-6 h-6 text-yellow-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .843-3 2s1.343 2 3 2 3 .843 3 2-1.343 2-3 2m0-10v10m0 4v-2m0-14a9 9 0 110 18 9 9 0 010-18z"
        />
      </svg>
    ),
  },
]

export default function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setStatus('success')
    // In a real setup, call your API route here to store the email
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#03045e] via-[#023e8a] to-[#03045e] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <header className="text-center mb-16">
          <p className="uppercase tracking-[0.3em] text-xs text-ocean-100 mb-4">
            Coming Soon
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-[0_6px_24px_rgba(0,0,0,0.35)]">
            Webbin is coming soon
          </h1>
          <p className="text-lg md:text-xl text-ocean-100 max-w-3xl mx-auto leading-relaxed">
            Join our waitlist to get early access and be among the first to explore
            profitable web app ideas.
          </p>
        </header>

        <div className="grid gap-6 sm:grid-cols-3 mb-14">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center shadow-[0_25px_80px_rgba(0,0,0,0.25)] backdrop-blur"
            >
              <div className="flex items-center justify-center mb-3">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
              <p className="text-sm text-ocean-100 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto bg-white/8 border border-white/10 rounded-3xl p-8 shadow-[0_25px_90px_rgba(0,0,0,0.35)] backdrop-blur">
          <h2 className="text-3xl font-bold mb-3 text-center text-white drop-shadow-[0_6px_24px_rgba(0,0,0,0.35)]">
            Join the waitlist
          </h2>
          <p className="text-ocean-100 text-center mb-8 leading-relaxed">
            Be the first to know when Webbin launches. Get early access and updates.
          </p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-ocean-100 mb-2" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white text-gray-900 border border-white/20 focus:ring-2 focus:ring-ocean-300 focus:border-transparent shadow-inner"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#ffd166] via-[#fcb045] to-[#fbab7e] text-gray-900 font-semibold hover:brightness-105 transition-all duration-200 shadow-lg"
            >
              Join waitlist
            </button>
          </form>

          {status === 'success' && (
            <div className="mt-4 p-3 rounded-lg bg-green-100/90 text-green-900 text-sm text-center border border-green-200">
              Success! You&apos;re on the waitlist. We&apos;ll notify you when Webbin launches.
            </div>
          )}

          <div className="mt-8 text-center text-sm text-ocean-100">
            Follow for updates:{' '}
            <Link
              href="https://www.youtube.com/@LightningDart"
              className="text-yellow-200 hover:text-yellow-100 font-semibold"
              target="_blank"
            >
              YouTube
            </Link>{' '}
            ·{' '}
            <Link
              href="https://bastianklaus.online"
              className="text-yellow-200 hover:text-yellow-100 font-semibold"
              target="_blank"
            >
              bastianklaus.online
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}


