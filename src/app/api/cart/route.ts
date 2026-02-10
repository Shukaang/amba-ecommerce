import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/supabaseServer'
import { verifyAuth } from '@/lib/auth/middleware'

// GET cart - returns user's cart items
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      )
    }

    // Use admin client to bypass RLS for reading
    const supabase = await createAdminClient()

    // Fetch cart items for this user
    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        products!inner(title, images, price),
        product_variants!left(color, size, unit)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching cart:', error)
      throw error
    }

    // Format the response
    const formattedItems = (cartItems || []).map(item => ({
      id: item.id,
      productId: item.product_id,
      variantId: item.variant_id,
      quantity: item.quantity,
      price: item.products.price,
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
      (sum: number, item: any) => sum + item.price * item.quantity,
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

// POST add to cart - adds item to user's cart
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

    // Validate input
    if (!productId || quantity < 1) {
      return NextResponse.json(
        { error: 'Invalid request. Product ID and quantity (minimum 1) are required.' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // First, verify the user exists in database (important for RLS)
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

    // Check if product exists
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

    // Check if variant exists (if provided)
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
    }

    // Check if item already in cart
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .eq('variant_id', variantId)
      .single()

    let cartItem

    if (existingItem) {
      // Update quantity if item exists
      const { data: updatedItem, error: updateError } = await supabase
        .from('cart_items')
        .update({
          quantity: existingItem.quantity + quantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingItem.id)
        .select(`
          *,
          products!inner(title, images, price),
          product_variants!left(color, size, unit)
        `)
        .single()

      if (updateError) {
        console.error('Update cart error:', updateError)
        throw updateError
      }
      cartItem = updatedItem
    } else {
      // Create new cart item
      const { data: newItem, error: insertError } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id: productId,
          variant_id: variantId,
          quantity,
        })
        .select(`
          *,
          products!inner(title, images, price),
          product_variants!left(color, size, unit)
        `)
        .single()

      if (insertError) {
        console.error('Insert cart error:', insertError)
        // Check for RLS violation
        if (insertError.message.includes('row-level security')) {
          return NextResponse.json(
            { 
              error: 'Permission denied. Please make sure you are logged in correctly.',
              details: 'RLS policy violation' 
            },
            { status: 403 }
          )
        }
        throw insertError
      }
      cartItem = newItem
    }

    // Format response
    const formattedItem = {
      id: cartItem.id,
      productId: cartItem.product_id,
      variantId: cartItem.variant_id,
      quantity: cartItem.quantity,
      price: cartItem.products.price,
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