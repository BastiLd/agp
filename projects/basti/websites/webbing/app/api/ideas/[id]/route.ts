import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const ideaId = params.id

    // Get idea
    const { data: idea, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('id', ideaId)
      .single()

    if (error || !idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 })
    }

    // Check if published
    if (!idea.published) {
      // Only admins can see unpublished ideas
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('supabase_auth_id', user.id)
          .single()

        if (userData?.role !== 'admin') {
          return NextResponse.json({ error: 'Idea not found' }, { status: 404 })
        }
      } else {
        return NextResponse.json({ error: 'Idea not found' }, { status: 404 })
      }
    }

    // Check if user is Pro or if this is a free preview
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let isPro = false
    let isFreePreview = false

    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('is_pro')
        .eq('supabase_auth_id', user.id)
        .single()

      isPro = userData?.is_pro || false
    }

    // Check if this is marked as free preview (from search results)
    const isFreePreviewParam = request.headers.get('x-free-preview') === 'true'
    isFreePreview = isFreePreviewParam

    // If not Pro and not free preview, return limited data
    if (!isPro && !isFreePreview) {
      return NextResponse.json(
        {
          error: 'Pro subscription required',
          message: 'Upgrade to Pro to view full details',
          idea: {
            id: idea.id,
            title: idea.title,
            short_desc: idea.short_desc,
            screenshot_url: idea.screenshot_url,
            tags: idea.tags,
            is_preview: true,
          },
        },
        { status: 403 }
      )
    }

    // Return full details
    return NextResponse.json({
      ...idea,
      is_pro: isPro,
    })
  } catch (error) {
    console.error('Error in GET /api/ideas/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

