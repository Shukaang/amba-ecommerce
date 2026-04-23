import { createAdminClient } from "@/lib/supabase/supabaseServer";
import OrdersTable from "@/components/admin/orders-table";

export default async function AdminOrdersPage() {
  const supabase = await createAdminClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      users!orders_user_id_fkey(id, name, email, phone, address),
      updated_by_user:users!orders_updated_by_fkey(id, name, email),
      order_items(*, products(*), product_variants(*), selected_options)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch orders:", error);
    return (
      <div className="p-8 text-center text-red-600">
        Error loading orders: {error.message}
      </div>
    );
  }

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
