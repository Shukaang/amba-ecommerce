import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/supabaseServer'
import { verifyAuth } from '@/lib/auth/middleware'

// api/orders/route.ts

// POST create new order (without order number initially)
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { shippingInfo, totalPrice, updateUserAddress } = body

    if (!shippingInfo || !totalPrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // Get user's cart items
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select(`
        *,
        products!inner(*),
        product_variants!left(*)
      `)
      .eq('user_id', user.id)

    if (cartError) {
      throw cartError
    }

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      )
    }

    // Update user's address if requested and different from current
    if (updateUserAddress) {
      const addressMatch = shippingInfo.match(/Address:\s*(.+)/)
      if (addressMatch) {
        const newAddress = addressMatch[1].trim()
        await supabase
          .from('users')
          .update({ address: newAddress })
          .eq('id', user.id)
      }
    }

    // Create order WITHOUT order_number (it will be generated later)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total_price: totalPrice,
        shipping_info: shippingInfo,
        status: 'PENDING',
        order_number: null, // Will be generated when confirmed
      })
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      throw orderError
    }

    // Create order items from cart items
    const orderItems = cartItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      price: item.products.price,
    }))

    const { error: orderItemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (orderItemsError) {
      // Delete the order if order items creation fails
      await supabase.from('orders').delete().eq('id', order.id)
      throw orderItemsError
    }

    // Clear the cart
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)

    // Fetch complete order data
    const { data: completeOrder } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          *,
          products(*),
          product_variants(*)
        )
      `)
      .eq('id', order.id)
      .single()

    return NextResponse.json(
      {
        order: completeOrder,
        message: 'Order placed successfully. It will be confirmed soon.',
      },
      { status: 201 }
    )

  } catch (error: any) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    )
  }
}

// GET user's orders
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createAdminClient()

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          *,
          products(*),
          product_variants(*)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      orders: orders || [],
    })

  } catch (error: any) {
    console.error('Get orders error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}