import Link from 'next/link'

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-[0_6px_24px_rgba(0,0,0,0.35)]">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-ocean-100 mb-8">
            Choose the plan that&apos;s right for you. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white/5 backdrop-blur-md border-2 border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all duration-300 shadow-xl">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-ocean-200 ml-2">/month</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-ocean-100">Browse latest 5 ideas</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-ocean-100">Free preview of first search</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-ocean-100">Basic search functionality</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-ocean-100">Tag filtering</span>
              </li>
            </ul>

            <Link
              href="/waitlist"
              className="block w-full text-center px-6 py-3 border-2 border-white/30 rounded-full font-semibold text-white hover:border-white/50 hover:bg-white/10 transition-all duration-300"
            >
              Join waitlist
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-gradient-to-br from-ocean-600/30 to-ocean-400/20 backdrop-blur-md border-2 border-ocean-400/50 rounded-2xl p-8 relative hover:shadow-2xl transition-all duration-300 shadow-xl">
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-ocean-500 text-white text-xs font-semibold rounded-full shadow-lg">
                Popular
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-white">$10</span>
                <span className="text-ocean-100 ml-2">/month</span>
              </div>
              <p className="text-sm text-ocean-200 mt-2">Billed monthly</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white font-medium">Everything in Free</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-ocean-100">Unlimited idea access</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-ocean-100">Full revenue & user metrics</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-ocean-100">Time-to-revenue data</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-ocean-100">Submit your own ideas</span>
              </li>
            </ul>

            <Link
              href="/waitlist"
              className="block w-full text-center px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full font-semibold hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Join waitlist
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-8 drop-shadow">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-ocean-100">
                Yes, you can cancel your subscription at any time. You&apos;ll continue to have access until the end of your billing period.
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-ocean-100">
                We accept all major credit cards through Stripe. Payments are secure and encrypted.
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                When will I be charged?
              </h3>
              <p className="text-ocean-100">
                You&apos;ll be charged immediately when you subscribe to Pro. You can cancel anytime and will continue to have access until the end of your billing period.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

