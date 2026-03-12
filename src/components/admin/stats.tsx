"use client";

import { useEffect, useState } from "react";
import {
  Package,
  ShoppingCart,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";

interface AdminStatsClientProps {
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  pendingOrders: number;
}

export default function AdminStatsClient({
  totalOrders: initialTotalOrders,
  totalProducts: initialTotalProducts,
  totalUsers: initialTotalUsers,
  pendingOrders: initialPendingOrders,
}: AdminStatsClientProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: initialTotalOrders,
    totalProducts: initialTotalProducts,
    totalUsers: initialTotalUsers,
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

  const fetchPeriodStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setStats((prev) => ({ ...prev, ...data }));
    } catch (error) {
      console.error("Error fetching period stats:", error);
    }
  };

  const refreshTotals = async () => {
    // Refresh totals from server props? Or re-fetch? We'll just re-fetch period stats for now.
    await fetchPeriodStats();
  };

  useEffect(() => {
    fetchPeriodStats();

    // Optional: set up polling or websocket for real-time updates
    const interval = setInterval(fetchPeriodStats, 30000); // every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getChange = (
    recent: number,
    previous: number,
  ): { percent: string; absolute: number } => {
    const prev = previous ?? 0;
    const curr = recent ?? 0;

    if (prev === 0) {
      if (curr > 0) return { percent: "+100%", absolute: curr };
      return { percent: "0%", absolute: 0 };
    }
    const changePercent = ((curr - prev) / prev) * 100;
    const sign = changePercent > 0 ? "+" : "";
    return {
      percent: `${sign}${changePercent.toFixed(1)}%`,
      absolute: curr - prev,
    };
  };

  const statsCards = [
    {
      name: "Total Orders",
      total: stats.totalOrders,
      recent: stats.recentOrders,
      prev: stats.prevOrders,
      icon: ShoppingCart,
      color: "bg-blue-500",
    },
    {
      name: "Total Products",
      total: stats.totalProducts,
      recent: stats.recentProducts,
      prev: stats.prevProducts,
      icon: Package,
      color: "bg-green-500",
    },
    {
      name: "Total Users",
      total: stats.totalUsers,
      recent: stats.recentUsers,
      prev: stats.prevUsers,
      icon: Users,
      color: "bg-purple-500",
    },
    {
      name: "Pending Orders",
      total: stats.pendingOrders,
      recent: stats.recentPending,
      prev: stats.prevPending,
      icon: Clock,
      color: "bg-yellow-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {statsCards.map((stat) => {
        const Icon = stat.icon;
        const change = getChange(stat.recent, stat.prev);
        const trendIcon =
          stat.recent > stat.prev ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : stat.recent < stat.prev ? (
            <TrendingDown className="h-4 w-4 text-red-600" />
          ) : (
            <Minus className="h-4 w-4 text-gray-400" />
          );
        const trendColor =
          stat.recent > stat.prev
            ? "text-green-600"
            : stat.recent < stat.prev
              ? "text-red-600"
              : "text-gray-500";

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
                {stat.total.toLocaleString()}
              </p>
              <div className="ml-2 flex items-center gap-1">
                {trendIcon}
                <span
                  className={`text-xs font-medium ${trendColor}`}
                  title={`${stat.recent} in last 30 days (${change.absolute > 0 ? "+" : ""}${change.absolute} vs previous period)`}
                >
                  {stat.recent} this month
                </span>
              </div>
            </dd>
            <dd className="ml-16 mt-1">
              <div className="text-xs text-gray-500">
                {change.percent} vs previous 30 days
              </div>
            </dd>
          </div>
        );
      })}
    </div>
  );
}
