"use client";

import { useEffect, useState } from "react";
import { Package, ShoppingCart, Users, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/supabaseClient";
import { useAuth } from "@/lib/auth/context";

interface AdminStatsClientProps {
  totalOrders: number;
  totalProducts: number;
  totalUsers: number; // includes all users (including SUPERADMIN)
  pendingOrders: number;
  superAdminCount: number;
}

export default function AdminStatsClient({
  totalOrders: initialTotalOrders,
  totalProducts: initialTotalProducts,
  totalUsers: initialTotalUsers,
  pendingOrders: initialPendingOrders,
  superAdminCount,
}: AdminStatsClientProps) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPERADMIN";

  // Store raw totals and period data
  const [stats, setStats] = useState({
    totalOrders: initialTotalOrders,
    totalProducts: initialTotalProducts,
    totalUsers: isSuperAdmin
      ? initialTotalUsers
      : initialTotalUsers - superAdminCount,
    pendingOrders: initialPendingOrders,
    recentOrders: 0,
    recentProducts: 0,
    recentUsers: 0,
    recentPending: 0,
    prevOrders: 0,
    prevProducts: 0,
    prevUsers: 0,
    prevPending: 0,
  });

  const supabase = createClient();

  const fetchPeriodStats = async () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(now.getDate() - 60);

    // Build user queries with optional exclusion
    const recentUsersQuery = supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString());

    const prevUsersQuery = supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sixtyDaysAgo.toISOString())
      .lt("created_at", thirtyDaysAgo.toISOString());

    if (!isSuperAdmin) {
      recentUsersQuery.neq("role", "SUPERADMIN");
      prevUsersQuery.neq("role", "SUPERADMIN");
    }

    try {
      const [
        recentOrdersRes,
        recentProductsRes,
        recentUsersRes,
        recentPendingRes,
        prevOrdersRes,
        prevProductsRes,
        prevUsersRes,
        prevPendingRes,
      ] = await Promise.all([
        supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .gte("created_at", thirtyDaysAgo.toISOString()),
        supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .gte("created_at", thirtyDaysAgo.toISOString()),
        recentUsersQuery,
        supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("status", "PENDING")
          .gte("created_at", thirtyDaysAgo.toISOString()),
        supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .gte("created_at", sixtyDaysAgo.toISOString())
          .lt("created_at", thirtyDaysAgo.toISOString()),
        supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .gte("created_at", sixtyDaysAgo.toISOString())
          .lt("created_at", thirtyDaysAgo.toISOString()),
        prevUsersQuery,
        supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("status", "PENDING")
          .gte("created_at", sixtyDaysAgo.toISOString())
          .lt("created_at", thirtyDaysAgo.toISOString()),
      ]);

      setStats((prev) => ({
        ...prev,
        recentOrders: recentOrdersRes.count ?? 0,
        recentProducts: recentProductsRes.count ?? 0,
        recentUsers: recentUsersRes.count ?? 0,
        recentPending: recentPendingRes.count ?? 0,
        prevOrders: prevOrdersRes.count ?? 0,
        prevProducts: prevProductsRes.count ?? 0,
        prevUsers: prevUsersRes.count ?? 0,
        prevPending: prevPendingRes.count ?? 0,
      }));
    } catch (error) {
      console.error("Error fetching period stats:", error);
    }
  };

  const refreshTotals = async () => {
    // Build user total query with optional exclusion
    const totalUsersQuery = supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (!isSuperAdmin) {
      totalUsersQuery.neq("role", "SUPERADMIN");
    }

    try {
      const [
        totalOrdersRes,
        totalProductsRes,
        totalUsersRes,
        pendingOrdersRes,
      ] = await Promise.all([
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*", { count: "exact", head: true }),
        totalUsersQuery,
        supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("status", "PENDING"),
      ]);

      setStats((prev) => ({
        ...prev,
        totalOrders: totalOrdersRes.count ?? 0,
        totalProducts: totalProductsRes.count ?? 0,
        totalUsers: totalUsersRes.count ?? 0,
        pendingOrders: pendingOrdersRes.count ?? 0,
      }));

      // Also refresh period stats to keep percentages accurate
      await fetchPeriodStats();
    } catch (error) {
      console.error("Error refreshing totals:", error);
    }
  };

  useEffect(() => {
    fetchPeriodStats();

    const ordersChannel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        refreshTotals,
      )
      .subscribe();

    const productsChannel = supabase
      .channel("products-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        refreshTotals,
      )
      .subscribe();

    const usersChannel = supabase
      .channel("users-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        refreshTotals,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(usersChannel);
    };
  }, [isSuperAdmin]);

  const getChange = (recent: number, previous: number): string => {
    const prev = previous ?? 0;
    const curr = recent ?? 0;

    if (prev === 0) {
      if (curr > 0) return "+100%";
      return "0%";
    }
    const change = ((curr - prev) / prev) * 100;
    return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
  };

  const statsCards = [
    {
      name: "Total Orders",
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      change: getChange(stats.recentOrders, stats.prevOrders),
      changeType:
        stats.recentOrders > stats.prevOrders
          ? "positive"
          : stats.recentOrders < stats.prevOrders
            ? "negative"
            : "neutral",
      color: "bg-blue-500",
      showPeriod: true, // show "vs last month"
    },
    {
      name: "Total Products",
      value: stats.totalProducts.toLocaleString(),
      icon: Package,
      change: getChange(stats.recentProducts, stats.prevProducts),
      changeType:
        stats.recentProducts > stats.prevProducts
          ? "positive"
          : stats.recentProducts < stats.prevProducts
            ? "negative"
            : "neutral",
      color: "bg-green-500",
      showPeriod: true,
    },
    {
      name: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      change: getChange(stats.recentUsers, stats.prevUsers),
      changeType:
        stats.recentUsers > stats.prevUsers
          ? "positive"
          : stats.recentUsers < stats.prevUsers
            ? "negative"
            : "neutral",
      color: "bg-purple-500",
      showPeriod: true,
    },
    {
      name: "Pending Orders",
      value: stats.pendingOrders.toLocaleString(),
      icon: Clock,
      change:
        stats.pendingOrders > 0
          ? `+${stats.recentPending} this month`
          : "All Clear",
      changeType: stats.pendingOrders > 0 ? "negative" : "positive",
      color: "bg-yellow-500",
      showPeriod: false, // no period label
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {statsCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6"
          >
            <dt>
              <div className={`absolute rounded-md p-3 ${stat.color}`}>
                <Icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">
                {stat.name}
              </p>
            </dt>
            <dd className="ml-16 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">
                {stat.value}
              </p>
              <div className="ml-2 flex flex-col items-start">
                <p
                  className={`text-sm font-semibold ${
                    stat.changeType === "positive"
                      ? "text-green-600"
                      : stat.changeType === "negative"
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {stat.change}
                </p>
                {stat.showPeriod && (
                  <span className="text-xs text-gray-400">vs last month</span>
                )}
              </div>
            </dd>
          </div>
        );
      })}
    </div>
  );
}
