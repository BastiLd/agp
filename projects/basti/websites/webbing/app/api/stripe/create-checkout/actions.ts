'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/stripe'

export async function createCheckoutAction() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  // Get user from our users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email, is_pro')
    .eq('supabase_auth_id', user.id)
    .single()

  if (userError || !userData) {
    throw new Error('User not found')
  }

  // Check if already Pro
  if (userData.is_pro) {
    throw new Error('User already has Pro subscription')
  }

  // Create Stripe Checkout Session
  const session = await createCheckoutSession({
    userId: userData.id,
    userEmail: userData.email,
  })

  if (session.url) {
    redirect(session.url)
  }

  throw new Error('Failed to create checkout session')
}

