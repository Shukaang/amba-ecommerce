import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { withAuth } from '@/lib/auth/middleware'
import { z } from 'zod'

const createOrderSchema = z.object({
  shippingInfo: z.string().min(10, 'Shipping info is required'),
})

// GET /api/admin/orders/route.ts - Get user's orders
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const userId = request.headers.get('x-user-id')

    const orders = await prisma.order.findMany({
      where: { userId: userId! },
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Orders fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
})

// POST /api/orders - Create new order
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const userId = request.headers.get('x-user-id')
    const body = await request.json()

    const validation = createOrderSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: validation.error.flatten() },
        { status: 400 }
      )
    }

    // Get cart items
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: userId! },
      include: { product: true },
    })

    if (cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      )
    }

    // Calculate total and verify stock
    let totalPrice = 0
    const orderItems = cartItems.map((item) => {
      totalPrice += item.product.price * item.quantity
      return {
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      }
    })

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: userId!,
        totalPrice,
        shippingInfo: validation.data.shippingInfo,
        status: 'PENDING',
        items: {
          create: orderItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    })

    // Clear cart
    await prisma.cartItem.deleteMany({
      where: { userId: userId! },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
})
