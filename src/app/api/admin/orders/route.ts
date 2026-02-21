import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { withAuth } from '@/lib/auth/middleware'

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

