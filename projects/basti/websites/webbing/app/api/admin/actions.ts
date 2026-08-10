'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

async function checkAdmin() {
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

  return true
}

export async function publishSubmission(submissionId: string) {
  await checkAdmin()

  const adminClient = createAdminClient()

  const { data: submission } = await adminClient
    .from('submissions')
    .select('*')
    .eq('id', submissionId)
    .single()

  if (!submission) {
    return { error: 'Submission not found' }
  }

  const payload = submission.payload as any

  // Create idea from submission
  const { data: idea, error } = await adminClient
    .from('ideas')
    .insert({
      title: payload.title,
      slug: payload.slug,
      short_desc: payload.short_desc,
      long_desc: payload.long_desc,
      source_url: payload.source_url,
      tags: payload.tags || [],
      monthly_revenue_estimate: payload.monthly_revenue_estimate,
      monthly_users_estimate: payload.monthly_users_estimate,
      time_to_revenue_days: payload.time_to_revenue_days,
      published: true,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Update submission status
  await adminClient
    .from('submissions')
    .update({ status: 'published', idea_id: idea.id })
    .eq('id', submissionId)

  return { success: true, idea }
}

export async function rejectSubmission(submissionId: string) {
  await checkAdmin()

  const adminClient = createAdminClient()

  await adminClient
    .from('submissions')
    .update({ status: 'rejected' })
    .eq('id', submissionId)

  return { success: true }
}

