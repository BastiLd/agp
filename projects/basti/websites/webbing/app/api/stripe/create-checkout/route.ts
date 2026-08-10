import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, is_pro')
      .eq('supabase_auth_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if already Pro
    if (userData.is_pro) {
      return NextResponse.json(
        { error: 'User already has Pro subscription' },
        { status: 400 }
      )
    }

    // Create Stripe Checkout Session
    const session = await createCheckoutSession({
      userId: userData.id,
      userEmail: userData.email,
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error('Error in POST /api/stripe/create-checkout:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

