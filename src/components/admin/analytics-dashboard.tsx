"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingBag,
  DollarSign,
  Package,
  BarChart3,
  Calendar,
  Eye,
  ShoppingCart,
  Star,
} from "lucide-react";

interface AnalyticsData {
  orders: any[];
  users: any[];
  products: any[];
  recentOrders: any[];
  topProducts: any[];
  visitorStats: any[];
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
}

export default function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState("30d");

  // Calculate metrics
  const calculateMetrics = () => {
    const now = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Only include orders with status "COMPLETED" or "DELIVERED" for revenue
    const completedOrders = data.orders.filter(
      (order) =>
        (order.status === "COMPLETED" || order.status === "DELIVERED") &&
        new Date(order.created_at) >= startDate,
    );

    // All orders for counting
    const filteredOrders = data.orders.filter(
      (order) => new Date(order.created_at) >= startDate,
    );

    const filteredUsers = data.users.filter(
      (user) => new Date(user.created_at) >= startDate,
    );

    // Only use completed/delivered orders for revenue
    const totalRevenue = completedOrders.reduce(
      (sum, order) => sum + parseFloat(order.total_price),
      0,
    );

    const totalCompletedOrders = completedOrders.length;
    const avgOrderValue =
      completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

    const customerUsers = filteredUsers.filter(
      (user) => user.role === "CUSTOMER",
    ).length;
    const adminUsers = filteredUsers.filter(
      (user) => user.role === "ADMIN" || user.role === "SUPERADMIN",
    ).length;

    const totalProducts = data.products.length;
    const avgProductRating =
      data.products.length > 0
        ? data.products.reduce(
            (sum, product) => sum + (product.average_rating || 0),
            0,
          ) / data.products.length
        : 0;

    // Calculate visitor stats
    const totalVisitors = data.visitorStats.length;
    const totalPageViews = data.visitorStats.reduce(
      (sum, visit) => sum + (visit.pages_visited?.length || 0),
      0,
    );
    const totalProductClicks = data.visitorStats.reduce(
      (sum, visit) => sum + (visit.product_clicks?.length || 0),
      0,
    );

    return {
      totalRevenue,
      totalOrders: filteredOrders.length,
      totalCompletedOrders,
      avgOrderValue,
      newCustomers: customerUsers,
      totalCustomers: data.users.filter((u) => u.role === "CUSTOMER").length,
      adminUsers,
      totalProducts,
      avgProductRating,
      totalVisitors,
      totalPageViews,
      totalProductClicks,
      conversionRate:
        totalVisitors > 0 ? (filteredOrders.length / totalVisitors) * 100 : 0,
    };
  };

  const metrics = calculateMetrics();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const getTrendIcon = (current: number, previous: number) => {
    return current >= previous ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  // Generate 6-month revenue chart data
  const generateSixMonthRevenueData = () => {
    const monthsData = [];
    const currentDate = new Date();

    // Get the last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(currentDate.getMonth() - i);

      const year = date.getFullYear();
      const month = date.getMonth() + 1; // getMonth() returns 0-11
      const monthName = date.toLocaleDateString("en-US", { month: "short" });

      // Create start and end dates for this month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      // Filter ONLY completed/delivered orders for this month
      const monthlyRevenue = data.orders
        .filter((order) => {
          const orderDate = new Date(order.created_at);
          const isInDateRange = orderDate >= startDate && orderDate <= endDate;
          const isCompleted =
            order.status === "COMPLETED" || order.status === "DELIVERED";
          return isInDateRange && isCompleted;
        })
        .reduce((sum, order) => sum + parseFloat(order.total_price), 0);

      monthsData.push({
        month: monthName,
        fullMonth: date.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
        revenue: monthlyRevenue,
        year: year,
        monthIndex: month,
      });
    }

    return monthsData;
  };

  const revenueChartData = generateSixMonthRevenueData();
  const maxRevenue = Math.max(...revenueChartData.map((d) => d.revenue), 1);

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-end">
        <div className="inline-flex rounded-lg border border-gray-200 p-1">
          {["7d", "30d", "90d"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                timeRange === range
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Card */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            {getTrendIcon(metrics.totalRevenue, metrics.totalRevenue * 0.9)}
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {formatCurrency(metrics.totalRevenue)}
          </h3>
          <p className="text-sm text-gray-600 mt-1">Total Revenue</p>
          <div className="mt-2 text-sm text-green-600">
            +12.5% from last period
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <ShoppingBag className="h-6 w-6 text-green-600" />
            </div>
            {getTrendIcon(
              metrics.totalCompletedOrders,
              metrics.totalCompletedOrders * 0.9,
            )}
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {formatNumber(metrics.totalCompletedOrders)}
          </h3>
          <p className="text-sm text-gray-600 mt-1">Completed Orders</p>
          <div className="mt-2 text-sm text-gray-600">
            {formatNumber(metrics.totalOrders)} total orders
          </div>
        </div>

        {/* Customers Card */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            {getTrendIcon(metrics.newCustomers, metrics.newCustomers * 0.9)}
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {formatNumber(metrics.newCustomers)}
          </h3>
          <p className="text-sm text-gray-600 mt-1">New Customers</p>
          <div className="mt-2 text-sm text-gray-600">
            {formatNumber(metrics.totalCustomers)} total
          </div>
        </div>

        {/* AOV Card */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
            {getTrendIcon(metrics.avgOrderValue, metrics.avgOrderValue * 0.9)}
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {formatCurrency(metrics.avgOrderValue)}
          </h3>
          <p className="text-sm text-gray-600 mt-1">Avg. Order Value</p>
          <div className="mt-2 text-sm text-green-600">
            +8.2% from last period
          </div>
        </div>
      </div>

      {/* Charts and Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart - Fixed 6 months */}
        <div className="lg:col-span-2 bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              6-Month Revenue Trend
            </h3>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64">
            <div className="flex items-end h-48 space-x-2">
              {revenueChartData.map((monthData, index) => (
                <div
                  key={`month-${index}-${monthData.month}`}
                  className="flex-1 flex flex-col items-center"
                >
                  <div className="relative w-full flex justify-center">
                    <div
                      className="w-10 bg-linear-to-t from-blue-500 to-blue-600 rounded-t-lg transition-all hover:from-blue-600 hover:to-blue-700 cursor-pointer"
                      style={{
                        height: `${(monthData.revenue / maxRevenue) * 80}%`,
                      }}
                      title={`${monthData.fullMonth}: ${formatCurrency(monthData.revenue)}`}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-2 font-medium">
                    {monthData.month}
                  </div>
                  {monthData.year !== revenueChartData[index - 1]?.year && (
                    <div className="text-xs text-gray-400 mt-1">
                      {monthData.year}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-6 text-sm text-gray-600">
              <span>
                {revenueChartData[0]?.month} {revenueChartData[0]?.year}
              </span>
              <span>
                {revenueChartData[revenueChartData.length - 1]?.month}{" "}
                {revenueChartData[revenueChartData.length - 1]?.year}
              </span>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Top Rated Products
          </h3>
          <div className="space-y-4">
            {data.topProducts.slice(0, 5).map((product, index) => (
              <div
                key={`product-${product.id || index}`}
                className="flex items-center"
              >
                <div className="shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                  {product.images && product.images.length > 0 ? (
                    <img src={product.images[0]} alt="Product image" />
                  ) : (
                    <Package className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {product.title}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Star className="h-3 w-3 text-yellow-400 mr-1" />
                    {product.average_rating?.toFixed(1) || "0.0"}
                  </div>
                </div>
                <div className="text-sm font-bold text-gray-900">
                  {formatCurrency(product.price)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Product Stats */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center mb-4">
            <Package className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Product Statistics
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Products</span>
              <span className="text-sm font-medium">
                {formatNumber(metrics.totalProducts)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg. Rating</span>
              <span className="text-sm font-medium">
                {metrics.avgProductRating.toFixed(1)}/5.0
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Categories</span>
              <span className="text-sm font-medium">12</span>
            </div>
          </div>
        </div>

        {/* Visitor Stats */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center mb-4">
            <Eye className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Visitor Insights
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Visitors</span>
              <span className="text-sm font-medium">
                {formatNumber(metrics.totalVisitors)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Page Views</span>
              <span className="text-sm font-medium">
                {formatNumber(metrics.totalPageViews)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Product Clicks</span>
              <span className="text-sm font-medium">
                {formatNumber(metrics.totalProductClicks)}
              </span>
            </div>
          </div>
        </div>

        {/* Conversion Stats */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center mb-4">
            <ShoppingCart className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Conversion Metrics
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Conversion Rate</span>
              <span className="text-sm font-medium">
                {metrics.conversionRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Completed Orders</span>
              <span className="text-sm font-medium">
                {formatNumber(metrics.totalCompletedOrders)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Pending Orders</span>
              <span className="text-sm font-medium">
                {formatNumber(
                  data.orders.filter((o) => o.status === "PENDING").length,
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Recent Orders
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.recentOrders.slice(0, 5).map((order, index) => (
                <tr key={`order-${order.id || order.order_number || index}`}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {order.order_number}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {order.users?.name}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {formatCurrency(order.total_price)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === "COMPLETED"
                          ? "bg-green-100 text-green-800"
                          : order.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : order.status === "SHIPPED"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
