import { Suspense } from 'react'
import { Hero } from '@/components/ui/Hero'
import { TrustedBy } from '@/components/ui/TrustedBy'
import { IdeasList } from '@/components/ui/IdeasList'

interface Idea {
  id: string
  title: string
  slug: string
  short_desc: string
  screenshot_url?: string | null
  tags?: string[] | null
  monthly_revenue_estimate?: number | null
  monthly_users_estimate?: number | null
  is_free_preview?: boolean
}

async function getIdeas(searchParams: { [key: string]: string | string[] | undefined }) {
  const q = searchParams.q as string | undefined
  const tags = searchParams.tags as string | undefined
  const page = searchParams.page as string | undefined

  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (tags) params.set('tags', tags)
  if (page) params.set('page', page)

  // For first search free preview, we'll handle it client-side
  // Server-side we always mark first 5 as free for now
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ideas?${params.toString()}`,
    {
      headers: {
        'x-first-search-free': 'true', // Always true for first 5 results
      },
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    return { ideas: [], pagination: { page: 1, totalPages: 0, total: 0 } }
  }

  const data = await response.json()
  return data
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const { ideas, pagination } = await getIdeas(searchParams)
  const hasSearch = searchParams.q || searchParams.tags

  return (
    <div className="min-h-screen">
      {/* Hero Section - nur wenn keine Suche */}
      {!hasSearch && (
        <>
          <Hero />
          <TrustedBy />
        </>
      )}

      {/* Ideas Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {hasSearch && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2 drop-shadow">
              Search Results
            </h2>
            <p className="text-ocean-100">
              Found {pagination.total} ideas
            </p>
          </div>
        )}
        <Suspense fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl h-96 animate-pulse" />
            ))}
          </div>
        }>
          <IdeasList initialIdeas={ideas} pagination={pagination} />
        </Suspense>
      </section>
    </div>
  )
}

