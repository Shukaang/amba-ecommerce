"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  MapPin,
  Package,
  Eye,
  ShoppingCart,
  Heart,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Badge } from "@/components/ui/badge";

interface DashboardData {
  totalVisitors: number;
  uniqueUsers: number;
  anonymousVisitors: number;
  todayVisitors: number;
  byCountry: Array<{
    country: string;
    count: number;
    cities: Array<{ city: string; count: number }>;
  }>;
  topProducts: Array<{
    product_id: string;
    title: string;
    views: number;
    cart_adds: number;
    wishlist_adds: number;
  }>;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export function VisitorAnalyticsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/visitors/dashboard");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  if (!data) return <div>No data available</div>;

  const countryChartData = data.byCountry.map((c) => ({
    name: c.country || "Unknown",
    value: c.count,
  }));
  const topProductsData = data.topProducts.slice(0, 5).map((p) => ({
    name: p.title || p.product_id.substring(0, 8) + "...",
    views: p.views,
    cart: p.cart_adds,
    wishlist: p.wishlist_adds,
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={fetchDashboard} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Visitors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalVisitors}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Registered Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.uniqueUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Anonymous</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.anonymousVisitors}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.todayVisitors}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" /> Visitors by Country
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={countryChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent = 0 }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {countryChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {data.byCountry.map((countryStat) => (
                <div
                  key={countryStat.country}
                  className="border rounded-lg p-3"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">
                      {countryStat.country || "Unknown"}
                    </span>
                    <Badge>{countryStat.count} visitors</Badge>
                  </div>
                  {countryStat.cities.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-xs">
                      {countryStat.cities.slice(0, 3).map((city) => (
                        <Badge
                          key={city.city}
                          variant="outline"
                          className="bg-gray-100"
                        >
                          {city.city || "Unknown"}: {city.count}
                        </Badge>
                      ))}
                      {countryStat.cities.length > 3 && (
                        <span className="text-gray-500">
                          +{countryStat.cities.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" /> Most Viewed Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="views" fill="#3b82f6" name="Views" />
                <Bar dataKey="cart" fill="#10b981" name="Add to Cart" />
                <Bar dataKey="wishlist" fill="#ef4444" name="Wishlist" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            {data.topProducts.map((product) => (
              <div
                key={product.product_id}
                className="text-sm border rounded p-2 flex justify-between"
              >
                <span className="font-mono">
                  {product.title || product.product_id.substring(0, 8)}...
                </span>
                <div className="flex gap-2">
                  <span className="text-blue-600" title="Views">
                    <Eye className="h-3 w-3 inline mr-1" /> {product.views}
                  </span>
                  <span className="text-green-600" title="Cart">
                    <ShoppingCart className="h-3 w-3 inline mr-1" />{" "}
                    {product.cart_adds}
                  </span>
                  <span className="text-red-600" title="Wishlist">
                    <Heart className="h-3 w-3 inline mr-1" />{" "}
                    {product.wishlist_adds}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
