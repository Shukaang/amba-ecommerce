import { createAdminClient } from "@/lib/supabase/supabaseServer";
import AnalyticsDashboard from "@/components/admin/analytics-dashboard";

export default async function AnalyticsPage() {
  const supabase = await createAdminClient();

  // Fetch data for analytics
  const [
    { data: orders },
    { data: users },
    { data: products },
    { data: recentOrders },
    { data: topProducts },
    { data: visitorStats },
  ] = await Promise.all([
    // Total orders and revenue
    supabase
      .from("orders")
      .select("total_price, status, created_at")
      .gte(
        "created_at",
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      ), // Last 30 days

    // User growth
    supabase
      .from("users")
      .select("created_at, role")
      .gte(
        "created_at",
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      ),

    // Product statistics
    supabase.from("products").select("price, average_rating, created_at"),

    // Recent orders for timeline
    supabase
      .from("orders")
      .select(
        `
        order_number,
        total_price,
        status,
        created_at,
        users!inner(name)
      `,
      )
      .order("created_at", { ascending: false })
      .limit(10),

    // Top products
    supabase
      .from("products")
      .select("title, price, average_rating, images")
      .order("average_rating", { ascending: false })
      .limit(5),

    // Visitor tracking (if available)
    supabase
      .from("visitor_tracking")
      .select("visited_at, pages_visited, product_clicks")
      .gte(
        "visited_at",
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      ), // Last 7 days
  ]);

  const analyticsData = {
    orders: orders || [],
    users: users || [],
    products: products || [],
    recentOrders: recentOrders || [],
    topProducts: topProducts || [],
    visitorStats: visitorStats || [],
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Analytics Dashboard
        </h1>
        <p className="text-gray-600">
          Monitor your store performance and insights
        </p>
      </div>

      <AnalyticsDashboard data={analyticsData} />
    </div>
  );
}
