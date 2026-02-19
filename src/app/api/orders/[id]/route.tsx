import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/supabaseServer";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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
      .eq("id", id)
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
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    const { data: currentOrder } = await supabase
      .from("orders")
      .select("status, order_number")
      .eq("id", id)
      .single();

    const updateData: any = {
      status: body.status,
      updated_at: new Date().toISOString(),
    };

    const { data: order, error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", id)
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

    return NextResponse.json({ order, message });
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
