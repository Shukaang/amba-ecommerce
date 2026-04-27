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
        products!inner(title, images, slug),
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
      price: item.price,
      product: {
        title: item.products.title,
        images: item.products.images,
        slug: item.products.slug,
      },
      variant: item.product_variants ? {
        color: item.product_variants.color,
        size: item.product_variants.size,
        unit: item.product_variants.unit,
      } : null,
      selectedOptions: item.selected_options,
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
    const { productId, variantId, quantity = 1, selectedOptions } = body

    if (!productId || quantity < 1) {
      return NextResponse.json(
        { error: 'Invalid request. Product ID and quantity (minimum 1) are required.' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // Verify user exists and is active
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
      .select('id, price, slug')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found.' },
        { status: 404 }
      )
    }

    // Determine correct price
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

    // ✅ FIXED: Smart duplicate detection that handles all cases:
    // 1. Products with variant rows → match by variant_id
    // 2. Color-only without variant rows → match by selected_options->color
    // 3. Size-only without variant rows → match by selected_options->size
    // 4. Plain products → match by product_id alone
    const baseQuery = supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('product_id', productId)

    let existingItem = null

    if (variantId) {
      const { data } = await baseQuery
        .eq('variant_id', variantId)
        .maybeSingle()
      existingItem = data
    } else if (selectedOptions?.color) {
      const { data } = await baseQuery
        .is('variant_id', null)
        .eq('selected_options->>color', selectedOptions.color)
        .maybeSingle()
      existingItem = data
    } else if (selectedOptions?.size) {
      const { data } = await baseQuery
        .is('variant_id', null)
        .eq('selected_options->>size', selectedOptions.size)
        .maybeSingle()
      existingItem = data
    } else {
      const { data } = await baseQuery
        .is('variant_id', null)
        .maybeSingle()
      existingItem = data
    }

    let cartItem

    if (existingItem) {
      // Same product + same option already in cart → bump quantity
      const { data: updatedItem, error: updateError } = await supabase
        .from('cart_items')
        .update({
          quantity: existingItem.quantity + quantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingItem.id)
        .select(`
          *,
          products!inner(title, images, slug),
          product_variants!left(color, size, unit)
        `)
        .single()

      if (updateError) throw updateError
      cartItem = updatedItem
    } else {
      // Different option or new product → new line item
      const { data: newItem, error: insertError } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id: productId,
          variant_id: variantId || null,
          quantity,
          price: itemPrice,
          selected_options: selectedOptions || null,
        })
        .select(`
          *,
          products!inner(title, images, slug),
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
      price: cartItem.price,
      product: {
        title: cartItem.products.title,
        images: cartItem.products.images,
        slug: cartItem.products.slug,
      },
      variant: cartItem.product_variants ? {
        color: cartItem.product_variants.color,
        size: cartItem.product_variants.size,
        unit: cartItem.product_variants.unit,
      } : null,
      selectedOptions: cartItem.selected_options,
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