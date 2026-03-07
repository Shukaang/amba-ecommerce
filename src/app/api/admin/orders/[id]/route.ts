import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/supabaseServer";
import { sendOrderConfirmedEmail } from "@/lib/email";

// api/admin/orders/[id]/route.ts
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { status } = body;
    const validStatuses = [
      "PENDING",
      "CONFIRMED",
      "SHIPPED",
      "READY",
      "COMPLETED",
      "CANCELED",
      "FAILED",
    ];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // Check if order exists and get current status
    const { data: existingOrder, error: fetchError } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update order status
    const { data: order, error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Send confirmation email when status changes to CONFIRMED
    if (status === "CONFIRMED" && existingOrder.status !== "CONFIRMED") {
      try {
        // Fetch full order details for email
        const { data: fullOrder } = await supabase
          .from("orders")
          .select(
            `
            *,
            order_items(
              *,
              products(*),
              product_variants(*)
            ),
            users(*)
          `
          )
          .eq("id", id)
          .single();

        if (fullOrder?.users?.email && fullOrder.order_number) {
          const items = fullOrder.order_items.map((item: any) => ({
            title: item.products.title,
            quantity: item.quantity,
            price: item.price,
            image: item.products.images?.[0],
            variant: item.product_variants
              ? [
                  item.product_variants.color,
                  item.product_variants.size,
                  item.product_variants.unit,
                ]
                  .filter(Boolean)
                  .join(" • ")
              : undefined,
          }));

          const deliveryInfo =
            "Delivery within 2 weeks. Free in Addis Ababa, EMS shipping fee applies to other cities.";

          console.log(`Sending confirmation email for order ${fullOrder.order_number}...`);

          const emailResult = await sendOrderConfirmedEmail({
            to: fullOrder.users.email,
            customerName: fullOrder.users.name,
            orderNumber: fullOrder.order_number,
            items,
            total: fullOrder.total_price,
            shippingAddress: fullOrder.shipping_info,
            deliveryInfo,
            customerEmail: fullOrder.users.email,
            customerPhone: fullOrder.users.phone,
          });

          if (emailResult.success) {
            console.log(`Email sent successfully for order ${fullOrder.order_number}`);
          } else {
            console.error(`Failed to send email for order ${fullOrder.order_number}:`, emailResult.error);
          }
        }
      } catch (emailError) {
        // Log but don't fail the status update
        console.error("Error sending confirmation email:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      order,
      message: "Order status updated successfully",
    });
  } catch (error: any) {
    console.error("Order update error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params promise to get the actual id
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // Check if order exists
    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('id, order_number')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Order fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Delete order
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Order deletion error:', error)
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    const orderRef = existingOrder.order_number 
    ? `#${existingOrder.order_number}` 
    : `ref ${existingOrder.id.slice(0, 8)}`;

    return NextResponse.json({
      success: true,
      message: `Order ${orderRef} deleted successfully`,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Unexpected error in order deletion:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}