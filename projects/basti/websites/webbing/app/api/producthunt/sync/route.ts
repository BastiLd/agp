import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createProductHuntClient } from '@/lib/producthunt'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('supabase_auth_id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const limit = body.limit || 10

    // Fetch products from Product Hunt
    const productHuntClient = createProductHuntClient()
    const products = await productHuntClient.syncProducts(limit)

    const adminClient = createAdminClient()
    const results = []

    // Insert products into ideas table
    for (const product of products) {
      // Check if product already exists
      const { data: existing } = await adminClient
        .from('ideas')
        .select('id')
        .eq('producthunt_id', product.producthunt_id)
        .single()

      if (!existing) {
        const { data: idea, error } = await adminClient
          .from('ideas')
          .insert({
            ...product,
            published: false, // Start as unpublished for admin review
          })
          .select()
          .single()

        if (error) {
          console.error('Error inserting product:', error)
        } else {
          results.push(idea)
        }
      }
    }

    return NextResponse.json({
      message: `Synced ${results.length} products from Product Hunt`,
      products: results,
    })
  } catch (error) {
    console.error('Error in POST /api/producthunt/sync:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

