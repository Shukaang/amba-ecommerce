import { createAdminClient } from "@/lib/supabase/supabaseServer";
import OrderDetails from "@/components/admin/order-details";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function OrderDetailPage({ params }: PageProps) {
  const supabase = await createAdminClient();

  // Fetch order with all related data
  const { data: order } = await supabase
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

  if (!order) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">Order not found</div>
        <Link href="/admin/orders">
          <Button variant="outline" className="mt-4">
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/orders">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">
          Order #{order.order_number}
        </h1>
        <p className="text-gray-600">Order details and management</p>
      </div>

      <OrderDetails order={order} />
    </div>
  );
}
