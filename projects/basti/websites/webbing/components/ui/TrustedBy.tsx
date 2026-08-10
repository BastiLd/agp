'use client'

export function TrustedBy() {
  const companies = [
    'Uber',
    'Airbnb',
    'Shopify',
    'Stripe',
    'Notion',
    'Figma',
    'Dropbox',
  ]

  return (
    <section className="py-12 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-ocean-200 mb-8">
          Trusted by design teams at
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-60 hover:opacity-100 transition-opacity duration-300">
          {companies.map((company, index) => (
            <div
              key={company}
              className="text-white/70 font-semibold text-lg"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {company}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

