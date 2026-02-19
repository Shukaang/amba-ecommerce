import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/supabaseServer'
import { withAdminAuth } from '@/lib/auth/middleware'

// PATCH - Moderate rating
async function PATCHHandler(
  request: NextRequest,
  { params }: { params: { ratingId: string } }
) {
  try {
    const body = await request.json()
    const supabase = await createAdminClient()

    // First get the product_id to update average later
    const { data: rating, error: fetchError } = await supabase
      .from('ratings')
      .select('product_id')
      .eq('id', params.ratingId)
      .single()

    if (fetchError || !rating) {
      return NextResponse.json(
        { error: 'Rating not found' },
        { status: 404 }
      )
    }

    // Update the rating moderation status
    const { data: updatedRating, error: updateError } = await supabase
      .from('ratings')
      .update({ 
        moderated: body.moderated,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.ratingId)
      .select(`
        *,
        product:products(id, title, images),
        user:users(id, name, email)
      `)
      .single()

    if (updateError) throw updateError

    // Update product average rating
    await updateProductAverageRating(rating.product_id)

    return NextResponse.json({ rating: updatedRating })
  } catch (error: any) {
    console.error('Moderate rating error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to moderate rating' },
      { status: 500 }
    )
  }
}

// DELETE - Delete rating
async function DELETEHandler(
  request: NextRequest,
  { params }: { params: { ratingId: string } }
) {
  try {
    const supabase = await createAdminClient()

    // Get product_id before deleting
    const { data: rating, error: fetchError } = await supabase
      .from('ratings')
      .select('product_id')
      .eq('id', params.ratingId)
      .single()

    if (fetchError || !rating) {
      return NextResponse.json(
        { error: 'Rating not found' },
        { status: 404 }
      )
    }

    // Delete the rating
    const { error: deleteError } = await supabase
      .from('ratings')
      .delete()
      .eq('id', params.ratingId)

    if (deleteError) throw deleteError

    // Update product average rating
    await updateProductAverageRating(rating.product_id)

    return NextResponse.json({ message: 'Rating deleted successfully' })
  } catch (error: any) {
    console.error('Delete rating error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete rating' },
      { status: 500 }
    )
  }
}

// Helper function to update product average rating
async function updateProductAverageRating(productId: string) {
  const supabase = await createAdminClient()

  // Get all moderated ratings for the product
  const { data: ratings } = await supabase
    .from('ratings')
    .select('rating')
    .eq('product_id', productId)
    .eq('moderated', true)

  if (ratings && ratings.length > 0) {
    const averageRating = ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length
    await supabase
      .from('products')
      .update({ average_rating: averageRating })
      .eq('id', productId)
  } else {
    await supabase
      .from('products')
      .update({ average_rating: 0 })
      .eq('id', productId)
  }
}

export const PATCH = withAdminAuth(PATCHHandler)
export const DELETE = withAdminAuth(DELETEHandler)