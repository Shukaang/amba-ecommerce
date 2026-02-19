"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, User, Eye, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/supabaseClient";
interface AnalyticsData {
  totalVisitors: number;
  uniqueUsers: number;
  anonymousVisitors: number;
  todayVisitors: number;
}

export function VisitorAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalVisitors: 0,
    uniqueUsers: 0,
    anonymousVisitors: 0,
    todayVisitors: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/admin/visitors/analytics");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setAnalytics(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Auto-refresh every 30 seconds (fallback)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchAnalytics();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [loading]);

  // Supabase real-time subscription
  useEffect(() => {
    if (loading) return; // Wait for initial load

    const setupRealtime = async () => {
      try {
        const supabase = await createClient();

        const channel = supabase
          .channel("visitor_analytics_realtime")
          .on(
            "postgres_changes",
            {
              event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
              schema: "public",
              table: "visitor_tracking",
            },
            () => {
              // Refresh analytics on any change
              fetchAnalytics();
            },
          )
          .subscribe();

        // Cleanup on unmount
        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error("Real-time setup error:", error);
      }
    };

    const cleanup = setupRealtime();

    return () => {
      if (cleanup) {
        cleanup.then((fn) => fn?.());
      }
    };
  }, [loading]); // Re-run when loading state changes

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 10) return "Just now";
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  if (loading) {
    return (
      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Visitor Analytics</h2>
          <Button variant="ghost" size="sm" disabled>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-6">
      {/* Header with refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Visitor Analytics</h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-sm text-gray-500">
              Live • Updated {formatTimeAgo(lastUpdated)}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAnalytics}
          disabled={loading}
          className="min-w-100"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden border-2 border-blue-100 hover:border-blue-300 transition-colors">
          <div className="absolute top-0 right-0 w-16 h-16">
            <div className="absolute inset-0 bg-blue-500 opacity-10 rounded-full -translate-y-8 translate-x-8"></div>
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Visitors
            </CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.totalVisitors}</div>
            <p className="text-xs text-gray-500 mt-1">All sessions tracked</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 border-green-100 hover:border-green-300 transition-colors">
          <div className="absolute top-0 right-0 w-16 h-16">
            <div className="absolute inset-0 bg-green-500 opacity-10 rounded-full -translate-y-8 translate-x-8"></div>
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <User className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.uniqueUsers}</div>
            <p className="text-xs text-gray-500 mt-1">Registered users</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 border-yellow-100 hover:border-yellow-300 transition-colors">
          <div className="absolute top-0 right-0 w-16 h-16">
            <div className="absolute inset-0 bg-yellow-500 opacity-10 rounded-full -translate-y-8 translate-x-8"></div>
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anonymous</CardTitle>
            <Eye className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {analytics.anonymousVisitors}
            </div>
            <p className="text-xs text-gray-500 mt-1">Guest sessions</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 border-purple-100 hover:border-purple-300 transition-colors">
          <div className="absolute top-0 right-0 w-16 h-16">
            <div className="absolute inset-0 bg-purple-500 opacity-10 rounded-full -translate-y-8 translate-x-8"></div>
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Clock className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.todayVisitors}</div>
            <p className="text-xs text-gray-500 mt-1">Visits today</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
