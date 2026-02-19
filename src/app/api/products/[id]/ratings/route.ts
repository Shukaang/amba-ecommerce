import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/supabaseServer'
import { verifyAuth } from '@/lib/auth/middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request)
    const supabase = await createAdminClient()

    const { data: ratings, error } = await supabase
      .from('ratings')
      .select(`
        *,
        users ( name, email )
      `)
      .eq('product_id', params.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    // All moderated ratings go to public list
    const publicRatings = ratings?.filter(r => r.moderated) || []

    // Find user's rating if logged in (for the "Your Review" section)
    const userRating = user ? ratings?.find(r => r.user_id === user.id) || null : null

    return NextResponse.json({ ratings: publicRatings, userRating })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Check if already rated
    const { data: existing } = await supabase
      .from('ratings')
      .select('id')
      .eq('product_id', params.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Already rated' }, { status: 409 })
    }

    const { data: newRating, error } = await supabase
      .from('ratings')
      .insert({
        product_id: params.id,
        user_id: user.id,
        rating,
        review: review || null,
        moderated: false,
      })
      .select(`*, users ( name, email )`)
      .single()

    if (error) throw error

    return NextResponse.json({ rating: newRating }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}