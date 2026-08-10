import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { publishSubmission, rejectSubmission } from '@/app/api/admin/actions'

async function getAdminData() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('supabase_auth_id', user.id)
    .single()

  if (userData?.role !== 'admin') {
    redirect('/dashboard')
  }

  const adminClient = createAdminClient()

  // Get pending submissions
  const { data: submissions } = await adminClient
    .from('submissions')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  // Get all ideas
  const { data: ideas } = await adminClient
    .from('ideas')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return { submissions: submissions || [], ideas: ideas || [] }
}

export default async function AdminPage() {
  const { submissions, ideas } = await getAdminData()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Panel</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Pending Submissions ({submissions.length})
          </h2>
          <div className="space-y-4">
            {submissions.length === 0 ? (
              <p className="text-gray-500">No pending submissions.</p>
            ) : (
              submissions.map((submission: any) => (
                <div
                  key={submission.id}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {submission.payload?.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {submission.submitter_email}
                      </p>
                    </div>
                    <Badge variant="warning">{submission.status}</Badge>
                  </div>
                  <p className="text-gray-700 mb-4">
                    {submission.payload?.short_desc}
                  </p>
                  <div className="flex gap-2">
                    <form action={publishSubmission.bind(null, submission.id)}>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Publish
                      </button>
                    </form>
                    <form action={rejectSubmission.bind(null, submission.id)}>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Submitted {formatDate(submission.created_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Ideas ({ideas.length})
          </h2>
          <div className="space-y-4">
            {ideas.map((idea: any) => (
              <div
                key={idea.id}
                className="bg-white rounded-lg shadow-md p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{idea.title}</h3>
                  <Badge variant={idea.published ? 'success' : 'default'}>
                    {idea.published ? 'Published' : 'Draft'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{idea.short_desc}</p>
                <p className="text-xs text-gray-500">
                  Created {formatDate(idea.created_at)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

