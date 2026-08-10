import { NextRequest, NextResponse } from 'next/server'
import { createScreenshotAPIClient } from '@/lib/screenshot'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const screenshotSchema = z.object({
  source_url: z.string().url(),
  idea_id: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { source_url, idea_id } = screenshotSchema.parse(body)

    // Generate screenshot
    const screenshotClient = createScreenshotAPIClient()
    const screenshotUrl = await screenshotClient.generateScreenshot(source_url)

    // Download and store in Supabase Storage
    const supabase = createAdminClient()
    const fileName = idea_id
      ? `idea-${idea_id}-${Date.now()}.png`
      : `screenshot-${Date.now()}.png`

    const publicUrl = await screenshotClient.downloadAndStoreScreenshot(
      screenshotUrl,
      supabase,
      'screenshots',
      fileName
    )

    // Update idea if idea_id provided
    if (idea_id) {
      await supabase
        .from('ideas')
        .update({ screenshot_url: publicUrl })
        .eq('id', idea_id)
    }

    return NextResponse.json({
      screenshot_url: publicUrl,
      message: 'Screenshot generated and stored successfully',
    })
  } catch (error) {
    console.error('Error in POST /api/screenshot:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

