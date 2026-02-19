"use client";

import { useState } from "react";
import {
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  Package,
  Home,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AdminHeaderProps {
  user?: any;
}

export default function AdminHeader({ user: propUser }: AdminHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { user: authUser, logout, loading } = useAuth();

  // Use propUser if provided (from server), otherwise use authUser
  const user = propUser || authUser;

  const handleLogout = async () => {
    await logout();
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return "A";
    return user.name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get role badge color
  const getRoleColor = (role: string) => {
    switch (role) {
      case "SUPERADMIN":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "ADMIN":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  // Show loading state
  if (loading) {
    return (
      <header className="bg-white dark:bg-slate-900 shadow-sm border-b border-gray-200 dark:border-slate-800">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Loading...
            </div>
          </div>
        </div>
      </header>
    );
  }

  if (!user) {
    return null; // Don't show header if no user
  }

  return (
    <header className="bg-white dark:bg-slate-900 shadow-sm border-b border-gray-200 dark:border-slate-800 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Left Section - Search */}
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
              <Input
                type="search"
                placeholder="Search orders, products, users..."
                className="pl-10 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Site Button */}
            <Link href="/" target="_blank">
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex items-center gap-2 border-gray-200 dark:border-slate-700"
              >
                <Home className="h-4 w-4" />
                <span>View Site</span>
              </Button>
            </Link>

            {/* Notifications */}
            <button className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900"></span>
            </button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 px-2 gap-2 hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:flex items-center gap-1">
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {user?.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user?.role}
                      </p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {user.name}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium text-center ${getRoleColor(user.role)}`}
                    >
                      {user.role}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/admin/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Admin Settings
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link
                    href="/"
                    target="_blank"
                    className="cursor-pointer md:hidden"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    View Site
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 dark:text-red-400 cursor-pointer focus:text-red-600 dark:focus:text-red-400"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
