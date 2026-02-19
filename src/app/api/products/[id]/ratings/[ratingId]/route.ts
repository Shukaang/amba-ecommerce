import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/supabaseServer'
import { verifyAuth } from '@/lib/auth/middleware'

async function updateProductAverage(productId: string) {
  const supabase = await createAdminClient()
  const { data: ratings } = await supabase
    .from('ratings')
    .select('rating')
    .eq('product_id', productId)
    .eq('moderated', true)

  const avg = ratings?.length
    ? ratings.reduce((a, b) => a + b.rating, 0) / ratings.length
    : 0

  await supabase
    .from('products')
    .update({ average_rating: avg })
    .eq('id', productId)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; ratingId: string } }
) {
  try {
    const user = await verifyAuth(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { rating, review } = body

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('ratings')
      .select('user_id')
      .eq('id', params.ratingId)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Rating not found' }, { status: 404 })
    }
    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update
    const { data: updated, error } = await supabase
      .from('ratings')
      .update({
        rating,
        review: review || null,
        moderated: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.ratingId)
      .select(`*, users ( name, email )`)
      .single()

    if (error) throw error

    await updateProductAverage(params.id)

    return NextResponse.json({ rating: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; ratingId: string } }
) {
  try {
    const user = await verifyAuth(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await createAdminClient()

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('ratings')
      .select('user_id')
      .eq('id', params.ratingId)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Rating not found' }, { status: 404 })
    }
    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('ratings')
      .delete()
      .eq('id', params.ratingId)

    if (error) throw error

    await updateProductAverage(params.id)

    return NextResponse.json({ message: 'Rating deleted' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}