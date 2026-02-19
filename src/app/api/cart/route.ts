import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/supabaseServer'
import { verifyAuth } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      )
    }

    const supabase = await createAdminClient()

    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        products!inner(title, images),
        product_variants!left(color, size, unit)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    const formattedItems = (cartItems || []).map(item => ({
      id: item.id,
      productId: item.product_id,
      variantId: item.variant_id,
      quantity: item.quantity,
      price: item.price, // use stored price
      product: {
        title: item.products.title,
        images: item.products.images,
      },
      variant: item.product_variants ? {
        color: item.product_variants.color,
        size: item.product_variants.size,
        unit: item.product_variants.unit,
      } : null,
    }))

    const total = formattedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )

    return NextResponse.json({
      items: formattedItems,
      total,
      itemCount: formattedItems.reduce((sum, item) => sum + item.quantity, 0),
    })
  } catch (error: any) {
    console.error('Cart fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch cart' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to add items to cart.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { productId, variantId, quantity = 1 } = body

    if (!productId || quantity < 1) {
      return NextResponse.json(
        { error: 'Invalid request. Product ID and quantity (minimum 1) are required.' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // Verify user exists
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id, status')
      .eq('id', user.id)
      .single()

    if (userError || !dbUser) {
      return NextResponse.json(
        { error: 'User account not found in database.' },
        { status: 404 }
      )
    }

    if (dbUser.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Your account is not active. Please contact support.' },
        { status: 403 }
      )
    }

    // Get product base price
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, price')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found.' },
        { status: 404 }
      )
    }

    // Determine correct price (variant price if variant exists)
    let itemPrice = product.price
    if (variantId) {
      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .select('id, product_id, price')
        .eq('id', variantId)
        .single()

      if (variantError || !variant || variant.product_id !== productId) {
        return NextResponse.json(
          { error: 'Invalid variant selected.' },
          { status: 400 }
        )
      }
      itemPrice = variant.price
    }

    // Check if item already in cart
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .eq('variant_id', variantId)
      .maybeSingle()

    let cartItem

    if (existingItem) {
      // Update quantity (price remains as originally stored)
      const { data: updatedItem, error: updateError } = await supabase
        .from('cart_items')
        .update({
          quantity: existingItem.quantity + quantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingItem.id)
        .select(`
          *,
          products!inner(title, images),
          product_variants!left(color, size, unit)
        `)
        .single()

      if (updateError) throw updateError
      cartItem = updatedItem
    } else {
      // Create new cart item with the determined price
      const { data: newItem, error: insertError } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id: productId,
          variant_id: variantId,
          quantity,
          price: itemPrice, // store correct price
        })
        .select(`
          *,
          products!inner(title, images),
          product_variants!left(color, size, unit)
        `)
        .single()

      if (insertError) throw insertError
      cartItem = newItem
    }

    const formattedItem = {
      id: cartItem.id,
      productId: cartItem.product_id,
      variantId: cartItem.variant_id,
      quantity: cartItem.quantity,
      price: cartItem.price, // use stored price
      product: {
        title: cartItem.products.title,
        images: cartItem.products.images,
      },
      variant: cartItem.product_variants ? {
        color: cartItem.product_variants.color,
        size: cartItem.product_variants.size,
        unit: cartItem.product_variants.unit,
      } : null,
    }

    return NextResponse.json({
      item: formattedItem,
      message: 'Added to cart successfully',
    }, { status: 201 })
  } catch (error: any) {
    console.error('Add to cart error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add to cart. Please try again.' },
      { status: 500 }
    )
  }
}