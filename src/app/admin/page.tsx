import { createAdminClient } from "@/lib/supabase/supabaseServer";
import AdminStats from "@/components/admin/stats";
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
      superAdminCount, // ADD THIS: Count SUPERADMIN users
      recentOrdersData,
      recentProductsData,
      recentActivityData,
    ] = await Promise.all([
      // Total orders
      supabase.from("orders").select("*", { count: "exact", head: true }),
      // Total products
      supabase.from("products").select("*", { count: "exact", head: true }),
      // Total users
      supabase.from("users").select("*", { count: "exact", head: true }),
      // Pending orders
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "PENDING"),
      // ADD THIS: Count SUPERADMIN users
      supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", "SUPERADMIN"),
      // Recent orders with user names
      supabase
        .from("orders")
        .select(
          `
      *,
      users!inner(id, name, email),
      order_items(
        id,
        quantity,
        price,
        products(title)
      )
    `,
        )
        .order("created_at", { ascending: false })
        .limit(10),
      // Recently added products
      supabase
        .from("products")
        .select("id, title, price, average_rating, images, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      // Recent user activity
      supabase
        .from("users")
        .select("id, name, email, role, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

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
        <AdminStats
          totalOrders={ordersCount.count || 0}
          totalProducts={productsCount.count || 0}
          totalUsers={usersCount.count || 0}
          pendingOrders={pendingOrdersCount.count || 0}
          superAdminCount={superAdminCount.count || 0} // PASS THIS PROP
        />

        {/* Grid Layout */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <RecentOrders orders={recentOrdersData.data || []} />

          {/* Recent Products */}
          <RecentProducts products={recentProductsData.data || []} />
        </div>

        {/* User Activity */}
        <div className="mt-8">
          <UserActivity users={recentActivityData.data || []} />
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
