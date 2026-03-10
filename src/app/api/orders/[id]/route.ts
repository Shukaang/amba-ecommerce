import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/supabaseServer'
import { sendOrderConfirmedEmail } from '@/lib/email'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { status } = body
    const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'READY', 'COMPLETED', 'CANCELED', 'FAILED']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // Check if order exists
    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('id')
      .eq('id', id)
      .single()
    if (fetchError) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Update order status
    const { data: order, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error

    // If status is CONFIRMED, send confirmation email
    if (status === 'CONFIRMED') {
      // Fetch full order with items and user details
      const { data: fullOrder } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            products(*),
            product_variants(*)
          ),
          users(*)
        `)
        .eq('id', id)
        .single()

      if (fullOrder?.users?.email && fullOrder.order_number) {
        const items = fullOrder.order_items.map((item: any) => ({
          title: item.products.title,
          quantity: item.quantity,
          price: item.price,
          variant: item.product_variants
            ? [item.product_variants.color, item.product_variants.size, item.product_variants.unit]
                .filter(Boolean)
                .join(' • ')
            : undefined,
        }))

        const deliveryInfo =
          'Delivery within 2 weeks. Free in Addis Ababa, EMS shipping fee applies to other cities.'

        // Send email asynchronously (don't await, don't block response)
        sendOrderConfirmedEmail({
          to: fullOrder.users.email,
          customerName: fullOrder.users.name,
          orderNumber: fullOrder.order_number,
          items,
          total: fullOrder.total_price,
          shippingAddress: fullOrder.shipping_info,
          deliveryInfo,
        }).catch(err => console.error('Order confirmed email failed:', err))
      }
    }

    return NextResponse.json({
      success: true,
      order,
      message: 'Order status updated successfully',
    })

  } catch (error: any) {
    console.error('Order update error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();

    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id, order_number")
      .eq("id", id)
      .single();

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { error } = await supabase.from("orders").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      message: `Order ${existingOrder.order_number || existingOrder.id} deleted successfully`,
    });
  } catch (error: any) {
    console.error("Order deletion error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete order" },
      { status: 500 },
    );
  }
}
