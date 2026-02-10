"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Package,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  Shield,
  Eye,
  LayoutGrid,
} from "lucide-react";

interface AdminSidebarProps {
  role: "ADMIN" | "SUPERADMIN";
}

const navigation = [
  { name: "Dashboard", href: "/admin", icon: Home },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Categories", href: "/admin/categories", icon: LayoutGrid },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

const superAdminNavigation = [
  { name: "Visitor Tracking", href: "/admin/tracking", icon: Eye },
  { name: "Security", href: "/admin/security", icon: Shield },
];

export default function AdminSidebar({ role }: AdminSidebarProps) {
  const pathname = usePathname();

  const allNavigation = [
    ...navigation,
    ...(role === "SUPERADMIN" ? superAdminNavigation : []),
  ];

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex flex-col bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center shrink-0 px-4">
          <div className="w-8 h-8 bg-blue-600 rounded-full"></div>
          <span className="ml-3 text-lg font-semibold text-gray-900">
            AmbaStore Admin
          </span>
        </div>
        <div className="mt-8 flex-1 flex flex-col">
          <nav className="flex-1 px-2 space-y-1">
            {allNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                  )}
                >
                  <Icon
                    className={cn(
                      "mr-3 shrink-0 h-5 w-5",
                      isActive
                        ? "text-blue-500"
                        : "text-gray-400 group-hover:text-gray-500",
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="shrink-0 flex border-t border-gray-200 p-4">
          <div className="shrink-0 group block">
            <div className="flex items-center">
              <div>
                <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-300">
                  <span className="text-sm font-medium text-gray-700">
                    {role.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {role === "SUPERADMIN" ? "Super Admin" : "Admin"}
                </p>
                <p className="text-xs font-medium text-gray-500">{role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
