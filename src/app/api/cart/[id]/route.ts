import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/supabaseServer'
import { verifyAuth } from '@/lib/auth/middleware'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { quantity } = body

    if (!quantity || quantity < 0) {
      return NextResponse.json(
        { error: 'Invalid quantity. Must be 0 or greater.' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // Get cart item and verify ownership
    const { data: cartItem, error: fetchError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !cartItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 })
    }

    if (cartItem.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this item.' },
        { status: 403 }
      )
    }

    if (quantity === 0) {
      await supabase.from('cart_items').delete().eq('id', id)
      return NextResponse.json({
        success: true,
        message: 'Item removed from cart'
      })
    }

    // Update quantity only – price remains unchanged
    const { data: updatedItem, error: updateError } = await supabase
      .from('cart_items')
      .update({
        quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        products!inner(title, images),
        product_variants!left(color, size, unit)
      `)
      .single()

    if (updateError) throw updateError

    const formattedItem = {
      id: updatedItem.id,
      productId: updatedItem.product_id,
      variantId: updatedItem.variant_id,
      quantity: updatedItem.quantity,
      price: updatedItem.price, // use stored price
      product: {
        title: updatedItem.products.title,
        images: updatedItem.products.images,
      },
      variant: updatedItem.product_variants ? {
        color: updatedItem.product_variants.color,
        size: updatedItem.product_variants.size,
        unit: updatedItem.product_variants.unit,
      } : null,
    }

    return NextResponse.json({
      item: formattedItem,
      message: 'Cart updated successfully'
    })
  } catch (error: any) {
    console.error('Update cart error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update cart' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const supabase = await createAdminClient()

    const { data: cartItem, error: fetchError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !cartItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 })
    }

    if (cartItem.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to remove this item.' },
        { status: 403 }
      )
    }

    await supabase.from('cart_items').delete().eq('id', id)

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart'
    })
  } catch (error: any) {
    console.error('Delete cart item error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to remove item from cart' },
      { status: 500 }
    )
  }
}