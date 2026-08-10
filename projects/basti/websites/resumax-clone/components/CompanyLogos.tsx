"use client";

export default function CompanyLogos() {
  const companies = [
    "Google", "Meta", "Apple", "Microsoft", "Amazon", "Netflix",
    "Nvidia", "Stripe", "Databricks", "Datadog", "LinkedIn", "Shopify",
    "Snapchat", "Snowflake", "TikTok"
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Build Resumes That Land Interviews At
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Create resumes optimized for roles at leading organizations
          </p>
        </div>

        {/* Logo Carousel */}
        <div className="relative overflow-hidden mb-8">
          <div className="flex animate-scroll">
            {/* First set */}
            {companies.map((company, index) => (
              <div
                key={`first-${index}`}
                className="flex-shrink-0 mx-8 flex items-center justify-center"
              >
                <div className="text-slate-400 text-2xl font-semibold hover:text-pink-400 transition-colors">
                  {company}
                </div>
              </div>
            ))}
            {/* Duplicate set for infinite scroll */}
            {companies.map((company, index) => (
              <div
                key={`second-${index}`}
                className="flex-shrink-0 mx-8 flex items-center justify-center"
              >
                <div className="text-slate-400 text-2xl font-semibold hover:text-pink-400 transition-colors">
                  {company}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4 text-green-400">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>ATS-optimized formats</span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-2">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4 text-green-400">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Industry-specific templates</span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-2">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4 text-green-400">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>AI-powered optimization</span>
          </div>
        </div>
      </div>

    </section>
  );
}

