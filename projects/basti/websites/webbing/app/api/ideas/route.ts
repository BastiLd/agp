import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const searchSchema = z.object({
  q: z.string().optional(),
  tags: z.string().optional(),
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
})

const ITEMS_PER_PAGE = 12
const FREE_PREVIEW_LIMIT = 5

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const params = searchSchema.parse({
      q: searchParams.get('q') || undefined,
      tags: searchParams.get('tags') || undefined,
      page: searchParams.get('page') || '1',
    })

    const page = params.page || 1
    const offset = (page - 1) * ITEMS_PER_PAGE

    // Check if this is the first search (for free preview logic)
    const firstSearchFree = request.headers.get('x-first-search-free') === 'true'

    // Build query
    let query = supabase
      .from('ideas')
      .select('*', { count: 'exact' })
      .eq('published', true)
      .order('created_at', { ascending: false })

    // Apply search filter
    if (params.q) {
      query = query.or(
        `title.ilike.%${params.q}%,short_desc.ilike.%${params.q}%`
      )
    }

    // Apply tag filter
    if (params.tags) {
      const tagArray = params.tags.split(',').map((t) => t.trim())
      query = query.contains('tags', tagArray)
    }

    // Apply pagination
    query = query.range(offset, offset + ITEMS_PER_PAGE - 1)

    const { data: ideas, error, count } = await query

    if (error) {
      console.error('Error fetching ideas:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Mark first 5 results as free preview (if first search)
    const ideasWithPreview = (ideas || []).map((idea, index) => ({
      ...idea,
      is_free_preview: firstSearchFree && index < FREE_PREVIEW_LIMIT,
    }))

    return NextResponse.json({
      ideas: ideasWithPreview,
      pagination: {
        page,
        perPage: ITEMS_PER_PAGE,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / ITEMS_PER_PAGE),
      },
    })
  } catch (error) {
    console.error('Error in GET /api/ideas:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const createIdeaSchema = z.object({
  title: z.string().min(1).max(200),
  short_desc: z.string().min(1).max(500),
  long_desc: z.string().optional(),
  source_url: z.string().url(),
  tags: z.array(z.string()).optional().default([]),
  monthly_revenue_estimate: z.number().optional(),
  monthly_users_estimate: z.number().optional(),
  time_to_revenue_days: z.number().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Validate input
    const validated = createIdeaSchema.parse(body)

    // Get current user (optional)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Generate slug
    const slug = validated.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Check if user exists in our users table
    let userId = null
    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('supabase_auth_id', user.id)
        .single()

      if (userData) {
        userId = userData.id
      }
    }

    // Create submission
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert({
        submitter_email: user?.email || body.submitter_email || null,
        submitter_name: body.submitter_name || null,
        payload: {
          title: validated.title,
          short_desc: validated.short_desc,
          long_desc: validated.long_desc,
          source_url: validated.source_url,
          tags: validated.tags,
          monthly_revenue_estimate: validated.monthly_revenue_estimate,
          monthly_users_estimate: validated.monthly_users_estimate,
          time_to_revenue_days: validated.time_to_revenue_days,
          slug,
        },
        status: 'draft',
      })
      .select()
      .single()

    if (submissionError) {
      console.error('Error creating submission:', submissionError)
      return NextResponse.json(
        { error: submissionError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Submission created successfully',
        submission,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/ideas:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

