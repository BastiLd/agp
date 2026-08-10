import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { action } = body

    if (action === 'signup') {
      const { email, password } = signUpSchema.parse(body)

      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        },
      })

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 })
      }

      // Create user record in our users table
      if (authData.user) {
        const adminClient = createAdminClient()
        await adminClient.from('users').insert({
          email: authData.user.email!,
          supabase_auth_id: authData.user.id,
          role: 'user',
          is_pro: false,
        })
      }

      return NextResponse.json({
        message: 'Sign up successful',
        user: authData.user,
      })
    }

    if (action === 'signin') {
      const { email, password } = signInSchema.parse(body)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }

      return NextResponse.json({
        message: 'Sign in successful',
        user: data.user,
      })
    }

    if (action === 'signout') {
      const { error } = await supabase.auth.signOut()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ message: 'Sign out successful' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in POST /api/auth:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

