"use client";

import { useState, useMemo } from "react";
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
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

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

  // Helper to get date range based on timeRange
  const getDateRange = (range: string) => {
    const now = new Date();
    const currentStart = new Date();
    const previousStart = new Date();
    const previousEnd = new Date();

    switch (range) {
      case "7d":
        currentStart.setDate(now.getDate() - 7);
        previousStart.setDate(now.getDate() - 14);
        previousEnd.setDate(now.getDate() - 7);
        break;
      case "30d":
        currentStart.setDate(now.getDate() - 30);
        previousStart.setDate(now.getDate() - 60);
        previousEnd.setDate(now.getDate() - 30);
        break;
      case "90d":
        currentStart.setDate(now.getDate() - 90);
        previousStart.setDate(now.getDate() - 180);
        previousEnd.setDate(now.getDate() - 90);
        break;
      default:
        currentStart.setDate(now.getDate() - 30);
        previousStart.setDate(now.getDate() - 60);
        previousEnd.setDate(now.getDate() - 30);
    }
    return { currentStart, previousStart, previousEnd };
  };

  // Calculate metrics for both current and previous periods
  const metrics = useMemo(() => {
    const { currentStart, previousStart, previousEnd } =
      getDateRange(timeRange);

    const filterByDate = (items: any[], start: Date, end?: Date) => {
      return items.filter((item) => {
        const itemDate = new Date(item.created_at);
        if (end) return itemDate >= start && itemDate < end;
        return itemDate >= start;
      });
    };

    // Current period
    const currentOrders = filterByDate(data.orders, currentStart);
    const currentCompletedOrders = currentOrders.filter(
      (order) => order.status === "COMPLETED" || order.status === "DELIVERED",
    );
    const currentRevenue = currentCompletedOrders.reduce(
      (sum, order) => sum + parseFloat(order.total_price),
      0,
    );
    const currentUsers = filterByDate(data.users, currentStart).filter(
      (user) => user.role === "CUSTOMER",
    ).length;
    const currentVisitors = filterByDate(
      data.visitorStats,
      currentStart,
    ).length;

    // Previous period
    const prevOrders = filterByDate(data.orders, previousStart, previousEnd);
    const prevCompletedOrders = prevOrders.filter(
      (order) => order.status === "COMPLETED" || order.status === "DELIVERED",
    );
    const prevRevenue = prevCompletedOrders.reduce(
      (sum, order) => sum + parseFloat(order.total_price),
      0,
    );
    const prevUsers = filterByDate(
      data.users,
      previousStart,
      previousEnd,
    ).filter((user) => user.role === "CUSTOMER").length;
    const prevVisitors = filterByDate(
      data.visitorStats,
      previousStart,
      previousEnd,
    ).length;

    // All-time totals
    const totalCustomers = data.users.filter(
      (u) => u.role === "CUSTOMER",
    ).length;
    const totalProducts = data.products.length;
    const totalVisitors = data.visitorStats.length;
    const totalPageViews = data.visitorStats.reduce(
      (sum, visit) => sum + (visit.pages_visited?.length || 0),
      0,
    );
    const totalProductClicks = data.visitorStats.reduce(
      (sum, visit) => sum + (visit.product_clicks?.length || 0),
      0,
    );

    const avgOrderValue =
      currentCompletedOrders.length > 0
        ? currentRevenue / currentCompletedOrders.length
        : 0;

    const avgProductRating =
      data.products.length > 0
        ? data.products.reduce(
            (sum, product) => sum + (product.average_rating || 0),
            0,
          ) / data.products.length
        : 0;

    const conversionRate =
      totalVisitors > 0
        ? (currentCompletedOrders.length / totalVisitors) * 100
        : 0;
    const revenueChange =
      prevRevenue === 0
        ? currentRevenue > 0
          ? 100
          : 0
        : ((currentRevenue - prevRevenue) / prevRevenue) * 100;
    const ordersChange =
      prevCompletedOrders.length === 0
        ? currentCompletedOrders.length > 0
          ? 100
          : 0
        : ((currentCompletedOrders.length - prevCompletedOrders.length) /
            prevCompletedOrders.length) *
          100;
    const customersChange =
      prevUsers === 0
        ? currentUsers > 0
          ? 100
          : 0
        : ((currentUsers - prevUsers) / prevUsers) * 100;
    const aovChange =
      prevRevenue === 0 || prevCompletedOrders.length === 0
        ? avgOrderValue > 0
          ? 100
          : 0
        : ((avgOrderValue - prevRevenue / prevCompletedOrders.length) /
            (prevRevenue / prevCompletedOrders.length)) *
          100;

    return {
      revenue: currentRevenue,
      revenueChange,
      completedOrders: currentCompletedOrders.length,
      ordersChange,
      totalOrders: currentOrders.length,
      newCustomers: currentUsers,
      customersChange,
      totalCustomers,
      avgOrderValue,
      aovChange,
      totalProducts,
      avgProductRating,
      totalVisitors,
      totalPageViews,
      totalProductClicks,
      conversionRate,
      pendingOrders: data.orders.filter((o) => o.status === "PENDING").length,
    };
  }, [data, timeRange]);

  // Generate 6-month revenue data for chart
  const revenueChartData = useMemo(() => {
    const monthsData = [];
    const currentDate = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(currentDate.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthName = date.toLocaleDateString("en-US", { month: "short" });

      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);

      const monthlyRevenue = data.orders
        .filter((order) => {
          const orderDate = new Date(order.created_at);
          return (
            orderDate >= startDate &&
            orderDate <= endDate &&
            (order.status === "COMPLETED" || order.status === "DELIVERED")
          );
        })
        .reduce((sum, order) => sum + parseFloat(order.total_price), 0);

      monthsData.push({
        month: monthName,
        fullMonth: date.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
        revenue: monthlyRevenue,
        year,
      });
    }
    return monthsData;
  }, [data.orders]);

  // Chart.js data object
  const chartData = {
    labels: revenueChartData.map((d) => d.month),
    datasets: [
      {
        label: "Revenue (ETB)",
        data: revenueChartData.map((d) => d.revenue),
        backgroundColor: "#f73a00",
        borderColor: "rgba(247, 58, 0, 0.7)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx: any) => `$${ctx.raw.toFixed(2)}` } },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (value: any) => `$${value}` },
      },
    },
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 2,
    }).format(amount);

  const formatNumber = (num: number) =>
    new Intl.NumberFormat("en-US").format(num);

  const formatPercent = (value: number) => {
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getTrendColor = (change: number) =>
    change > 0
      ? "text-green-600"
      : change < 0
        ? "text-red-600"
        : "text-gray-600";

  return (
    <div className="space-y-6 mb-10">
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
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            {getTrendIcon(metrics.revenueChange)}
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {formatCurrency(metrics.revenue)}
          </h3>
          <p className="text-sm text-gray-600 mt-1">Revenue</p>
          <div
            className={`mt-2 text-sm ${getTrendColor(metrics.revenueChange)}`}
          >
            {formatPercent(metrics.revenueChange)} from previous period
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <ShoppingBag className="h-6 w-6 text-green-600" />
            </div>
            {getTrendIcon(metrics.ordersChange)}
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {formatNumber(metrics.completedOrders)}
          </h3>
          <p className="text-sm text-gray-600 mt-1">Completed Orders</p>
          <div className="mt-2 text-sm text-gray-600">
            {formatNumber(metrics.totalOrders)} total orders
          </div>
          <div
            className={`mt-1 text-xs ${getTrendColor(metrics.ordersChange)}`}
          >
            {formatPercent(metrics.ordersChange)} from previous
          </div>
        </div>

        {/* Customers Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            {getTrendIcon(metrics.customersChange)}
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {formatNumber(metrics.newCustomers)}
          </h3>
          <p className="text-sm text-gray-600 mt-1">New Customers</p>
          <div className="mt-2 text-sm text-gray-600">
            {formatNumber(metrics.totalCustomers)} total
          </div>
          <div
            className={`mt-1 text-xs ${getTrendColor(metrics.customersChange)}`}
          >
            {formatPercent(metrics.customersChange)} from previous
          </div>
        </div>

        {/* AOV Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
            {getTrendIcon(metrics.aovChange)}
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {formatCurrency(metrics.avgOrderValue)}
          </h3>
          <p className="text-sm text-gray-600 mt-1">Avg. Order Value</p>
          <div className={`mt-2 text-sm ${getTrendColor(metrics.aovChange)}`}>
            {formatPercent(metrics.aovChange)} from previous
          </div>
        </div>
      </div>

      {/* Charts and Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart - 6 months (Chart.js) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              6-Month Revenue Trend
            </h3>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Top Rated Products
          </h3>
          <div className="space-y-4">
            {data.topProducts.slice(0, 5).map((product, index) => (
              <div
                key={`product-${product.id || index}`}
                className="flex items-center"
              >
                <div className="shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3 overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {product.title}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Star className="h-3 w-3 text-[#f73a00] mr-1" />
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
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Package className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Product Statistics
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Products</span>
              <span className="text-sm font-medium text-gray-900">
                {formatNumber(metrics.totalProducts)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg. Rating</span>
              <span className="text-sm font-medium text-gray-900">
                {metrics.avgProductRating.toFixed(1)}/5.0
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Categories</span>
              <span className="text-sm font-medium text-gray-900">12</span>
            </div>
          </div>
        </div>

        {/* Visitor Stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Eye className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Visitor Insights
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Visitors</span>
              <span className="text-sm font-medium text-gray-900">
                {formatNumber(metrics.totalVisitors)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Page Views</span>
              <span className="text-sm font-medium text-gray-900">
                {formatNumber(metrics.totalPageViews)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Product Clicks</span>
              <span className="text-sm font-medium text-gray-900">
                {formatNumber(metrics.totalProductClicks)}
              </span>
            </div>
          </div>
        </div>

        {/* Conversion Stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <ShoppingCart className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Conversion Metrics
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Conversion Rate</span>
              <span className="text-sm font-medium text-gray-900">
                {metrics.conversionRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Completed Orders</span>
              <span className="text-sm font-medium text-gray-900">
                {formatNumber(metrics.completedOrders)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Pending Orders</span>
              <span className="text-sm font-medium text-gray-900">
                {formatNumber(metrics.pendingOrders)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
