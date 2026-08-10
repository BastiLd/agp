import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { createCheckoutAction } from '@/app/api/stripe/create-checkout/actions'

async function getDashboardData() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user data
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('supabase_auth_id', user.id)
    .single()

  if (!userData) {
    redirect('/login')
  }

  // Get user submissions
  const { data: submissions } = await supabase
    .from('submissions')
    .select('*')
    .eq('submitter_email', userData.email)
    .order('created_at', { ascending: false })

  // Get subscription if Pro
  let subscription = null
  if (userData.is_pro) {
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userData.id)
      .eq('status', 'active')
      .single()

    if (subData) {
      try {
        const stripeSub = await stripe.subscriptions.retrieve(
          subData.stripe_subscription_id
        )
        subscription = {
          ...subData,
          stripeData: stripeSub,
        }
      } catch (error) {
        console.error('Error fetching Stripe subscription:', error)
      }
    }
  }

  return { user: userData, submissions: submissions || [], subscription }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { success?: string; canceled?: string }
}) {
  const { user, submissions, subscription } = await getDashboardData()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {searchParams.success && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          Subscription activated successfully!
        </div>
      )}

      {searchParams.canceled && (
        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          Subscription canceled.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              My Submissions
            </h2>
            {submissions.length === 0 ? (
              <p className="text-gray-500">No submissions yet.</p>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission: any) => (
                  <div
                    key={submission.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900">
                        {submission.payload?.title || 'Untitled'}
                      </h3>
                      <Badge
                        variant={
                          submission.status === 'published'
                            ? 'success'
                            : submission.status === 'rejected'
                            ? 'error'
                            : 'default'
                        }
                      >
                        {submission.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {submission.payload?.short_desc}
                    </p>
                    <p className="text-xs text-gray-500">
                      Submitted {formatDate(submission.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Submit New Idea
            </h2>
            <form action="/api/ideas" method="POST" className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Short Description
                </label>
                <textarea
                  name="short_desc"
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source URL
                </label>
                <input
                  type="url"
                  name="source_url"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Submit Idea
              </button>
            </form>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Subscription
            </h2>
            {user.is_pro ? (
              <div>
                <Badge variant="success" className="mb-4">
                  Pro Member
                </Badge>
                {subscription && (
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-gray-600">Status:</span>{' '}
                      <span className="font-medium">
                        {subscription.stripeData?.status || subscription.status}
                      </span>
                    </p>
                    {subscription.current_period_end && (
                      <p>
                        <span className="text-gray-600">Renews:</span>{' '}
                        <span className="font-medium">
                          {formatDate(subscription.current_period_end)}
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-4">
                  Upgrade to Pro to access full idea details, revenue estimates, and
                  user metrics.
                </p>
                <form action={createCheckoutAction}>
                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    Upgrade to Pro - $10/month
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

