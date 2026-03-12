import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/supabaseServer';
import { verifyAuth } from '@/lib/auth/middleware';
import { sendOrderConfirmedEmail } from '@/lib/email';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAuth(request);
    if (!admin || !['ADMIN', 'SUPERADMIN'].includes(admin.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'READY', 'COMPLETED', 'CANCELED', 'FAILED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // Check if order exists and get current status
    const { data: existing, error: fetchError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', id)
      .single();
    if (fetchError) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update with updated_by = admin.id
    const { data: order, error } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
        updated_by: admin.id,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    // Fetch the complete updated order with all relations
    const { data: fullOrder, error: fullError } = await supabase
      .from('orders')
      .select(`
        *,
        users!orders_user_id_fkey(id, name, email, phone, address),
        updated_by_user:users!orders_updated_by_fkey(id, name, email),
        order_items(
          *,
          products(*),
          product_variants(*)
        )
      `)
      .eq('id', id)
      .single();

    if (fullError) throw fullError;

    // Send email if status becomes CONFIRMED (async)
    if (status === 'CONFIRMED' && existing.status !== 'CONFIRMED') {
  if (fullOrder.users?.email && fullOrder.order_number) {
    const items = fullOrder.order_items.map((item: any) => ({
      title: item.products.title,
      quantity: item.quantity,
      price: item.price,
      variant: item.product_variants
        ? [item.product_variants.color, item.product_variants.size, item.product_variants.unit]
            .filter(Boolean)
            .join(' • ')
        : undefined,
      image: item.products.images?.[0]   // <-- this line was missing
    }));

    const deliveryInfo =
      'Delivery within 2 weeks. Free in Addis Ababa, EMS shipping fee applies to other cities.';

    sendOrderConfirmedEmail({
      to: fullOrder.users.email,
      customerName: fullOrder.users.name,
      orderNumber: fullOrder.order_number,
      items,
      total: fullOrder.total_price,
      shippingAddress: fullOrder.shipping_info,
      deliveryInfo,
    }).catch(err => console.error('Order confirmed email failed:', err));
  }
}

    return NextResponse.json({
      success: true,
      order: fullOrder,
      message: 'Order status updated successfully',
    });

  } catch (error: any) {
    console.error('Order update error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Check if order exists
    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('id, order_number')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Order fetch error:', fetchError);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Delete order
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Order deletion error:', error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    const orderRef = existingOrder.order_number
      ? `#${existingOrder.order_number}`
      : `ref ${existingOrder.id.slice(0, 8)}`;

    return NextResponse.json({
      success: true,
      message: `Order ${orderRef} deleted successfully`,
    });
  } catch (error: any) {
    console.error('Unexpected error in order deletion:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}