import { createAdminClient } from "@/lib/supabase/supabaseServer";
import OrdersTable from "@/components/admin/orders-table";

export default async function AdminOrdersPage() {
  const supabase = await createAdminClient();

  // Fetch orders with all related data
  const { data: orders } = await supabase
    .from("orders")
    .select(
      `
      *,
      users!inner(id, name, email, phone, address),
      order_items(
        *,
        products(*),
        product_variants(*)
      )
    `,
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Order Management
        </h1>
        <p className="text-gray-600">View and manage all customer orders</p>
      </div>

      <OrdersTable orders={orders || []} />
    </div>
  );
}
