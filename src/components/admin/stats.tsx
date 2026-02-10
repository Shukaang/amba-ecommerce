import { Package, ShoppingCart, Users, Clock } from "lucide-react";

interface AdminStatsProps {
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  pendingOrders: number;
  superAdminCount?: number; // ADD THIS PROP
}

export default function AdminStats({
  totalOrders,
  totalProducts,
  totalUsers,
  pendingOrders,
  superAdminCount = 1, // Default to 1 SUPERADMIN
}: AdminStatsProps) {
  // Adjust user count by subtracting SUPERADMIN count
  const adjustedUserCount = Math.max(0, totalUsers - superAdminCount);

  const stats = [
    {
      name: "Total Orders",
      value: totalOrders.toLocaleString(),
      icon: ShoppingCart,
      change: "+12%",
      changeType: "positive",
      color: "bg-blue-500",
    },
    {
      name: "Total Products",
      value: totalProducts.toLocaleString(),
      icon: Package,
      change: "+8%",
      changeType: "positive",
      color: "bg-green-500",
    },
    {
      name: "Total Users",
      value: adjustedUserCount.toLocaleString(),
      icon: Users,
      change: `users`,
      changeType: "neutral",
      color: "bg-purple-500",
    },
    {
      name: "Pending Orders",
      value: pendingOrders.toLocaleString(),
      icon: Clock,
      change: pendingOrders > 0 ? "Needs Attention" : "All Clear",
      changeType: pendingOrders > 0 ? "negative" : "positive",
      color: "bg-yellow-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
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
              <p
                className={`ml-2 flex items-baseline text-sm font-semibold ${
                  stat.changeType === "positive"
                    ? "text-green-600"
                    : stat.changeType === "negative"
                      ? "text-red-600"
                      : "text-gray-600"
                }`}
              >
                {stat.change}
              </p>
            </dd>
          </div>
        );
      })}
    </div>
  );
}
