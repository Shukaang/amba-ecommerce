import { createAdminClient } from "@/lib/supabase/supabaseServer";
import AdminStatsClient from "@/components/admin/stats";
import RecentOrders from "@/components/admin/recent-orders";
import RecentProducts from "@/components/admin/recent-products";
import UserActivity from "@/components/admin/user-activity";

export default async function AdminDashboard() {
  const supabase = await createAdminClient();

  try {
    // Fetch dashboard data in parallel
    const [
      ordersCount,
      productsCount,
      usersCount,
      pendingOrdersCount,
      recentOrdersResult,
      recentProductsResult,
      recentActivityResult,
    ] = await Promise.all([
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "PENDING"),
      supabase
        .from("orders")
        .select(
          `
          *,
          users!orders_user_id_fkey(id, name, email),
          order_items(
            id,
            quantity,
            price,
            products(title)
          )
        `,
        )
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("products")
        .select("id, title, price, average_rating, images, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("users")
        .select("id, name, email, role, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    // Log any errors for debugging
    if (recentOrdersResult.error) {
      console.error("Recent orders error:", recentOrdersResult.error);
    }
    if (recentProductsResult.error) {
      console.error("Recent products error:", recentProductsResult.error);
    }
    if (recentActivityResult.error) {
      console.error("Recent activity error:", recentActivityResult.error);
    }

    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Dashboard Overview
          </h1>
          <p className="text-gray-600">
            Welcome back! Here's what's happening with your store today.
          </p>
        </div>

        {/* Stats Cards */}
        <AdminStatsClient
          totalOrders={ordersCount.count || 0}
          totalProducts={productsCount.count || 0}
          totalUsers={usersCount.count || 0}
          pendingOrders={pendingOrdersCount.count || 0}
        />

        {/* Grid Layout */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <RecentOrders orders={recentOrdersResult.data || []} />

          {/* Recent Products */}
          <RecentProducts products={recentProductsResult.data || []} />
        </div>

        {/* User Activity */}
        <div className="mt-8">
          <UserActivity users={recentActivityResult.data || []} />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Dashboard error:", error);
    return (
      <div className="text-center py-12">
        <div className="text-red-600">Failed to load dashboard data</div>
        <p className="text-gray-600 mt-2">Please try refreshing the page</p>
      </div>
    );
  }
}
