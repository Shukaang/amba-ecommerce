import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/supabaseServer";

// api/orders/[id]/route.ts

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createAdminClient();

    const { data: order, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        users!inner(*),
        order_items(
          *,
          products(*),
          product_variants(*)
        )
      `,
      )
      .eq("id", params.id)
      .single();

    if (error) throw error;

    return NextResponse.json({ order });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();

    if (!body.status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 },
      );
    }

    const validStatuses = [
      "PENDING",
      "CONFIRMED",
      "READY",
      "SHIPPED",
      "COMPLETED",
      "CANCELED",
      "FAILED",
    ];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 },
      );
    }

    const supabase = await createAdminClient();

    // Get current order to check if status is changing to CONFIRMED
    const { data: currentOrder } = await supabase
      .from("orders")
      .select("status, order_number")
      .eq("id", params.id)
      .single();

    const updateData: any = {
      status: body.status,
      updated_at: new Date().toISOString(),
    };

    // If changing from PENDING to CONFIRMED, trigger order number generation
    if (currentOrder?.status === "PENDING" && body.status === "CONFIRMED") {
      // The trigger will handle order number generation
      // We just need to update the status
    }

    const { data: order, error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", params.id)
      .select(
        `
        *,
        users!inner(id, name, email)
      `,
      )
      .single();

    if (error) throw error;

    let message = "Order status updated successfully";
    if (currentOrder?.status === "PENDING" && body.status === "CONFIRMED") {
      message = "Order confirmed! Order number has been generated.";
    }

    return NextResponse.json({
      order,
      message,
    });
  } catch (error: any) {
    console.error("Update order error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update order" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createAdminClient();

    // Check if order exists
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id, order_number")
      .eq("id", params.id)
      .single();

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Delete order (this will cascade to order_items due to foreign key constraints)
    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", params.id);

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
