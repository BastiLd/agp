import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TagPill } from '@/components/ui/TagPill'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'

async function getIdea(slug: string, isFreePreview: boolean = false) {
  const supabase = await createClient()

  const { data: idea, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (error || !idea) {
    return null
  }

  // Check if user is Pro
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isPro = false
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('is_pro')
      .eq('supabase_auth_id', user.id)
      .single()

    isPro = userData?.is_pro || false
  }

  // If not Pro and not free preview, show upgrade CTA
  if (!isPro && !isFreePreview) {
    return { ...idea, requiresPro: true }
  }

  return { ...idea, requiresPro: false, isPro }
}

export default async function IdeaDetailPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { preview?: string }
}) {
  const isFreePreview = searchParams.preview === 'true'
  const idea = await getIdea(params.slug, isFreePreview)

  if (!idea) {
    notFound()
  }

  if (idea.requiresPro) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{idea.title}</h1>
          <p className="text-lg text-gray-600 mb-6">{idea.short_desc}</p>
          {idea.screenshot_url && (
            <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden">
              <Image
                src={idea.screenshot_url}
                alt={idea.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-primary-900 mb-2">
              Upgrade to Pro to View Full Details
            </h2>
            <p className="text-primary-700 mb-4">
              Get access to detailed revenue estimates, user metrics, and time-to-revenue data.
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Upgrade to Pro - $10/month
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const tags = Array.isArray(idea.tags) ? idea.tags : []

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {idea.screenshot_url && (
          <div className="relative w-full h-96 bg-gray-200">
            <Image
              src={idea.screenshot_url}
              alt={idea.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="p-8">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{idea.title}</h1>
            {idea.isPro && <Badge variant="success">Pro Access</Badge>}
          </div>

          <p className="text-xl text-gray-600 mb-6">{idea.short_desc}</p>

          {idea.long_desc && (
            <div className="prose max-w-none mb-8">
              <p className="text-gray-700 whitespace-pre-line">{idea.long_desc}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-8">
            {tags.map((tag) => (
              <TagPill key={tag} tag={tag} />
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-6 bg-gray-50 rounded-lg">
            {idea.monthly_revenue_estimate && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(idea.monthly_revenue_estimate)}
                </p>
              </div>
            )}
            {idea.monthly_users_estimate && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Monthly Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(idea.monthly_users_estimate)}
                </p>
              </div>
            )}
            {idea.time_to_revenue_days && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Time to Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {idea.time_to_revenue_days} days
                </p>
              </div>
            )}
          </div>

          {idea.launch_date && (
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-1">Launch Date</p>
              <p className="text-gray-900">{formatDate(idea.launch_date)}</p>
            </div>
          )}

          {idea.source_url && (
            <div className="mb-6">
              <a
                href={idea.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Visit Website
                <svg
                  className="ml-2 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

