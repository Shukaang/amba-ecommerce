"use client";

import {
  Bell,
  User,
  LogOut,
  Settings,
  Home,
  ChevronDown,
  Menu,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
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
  user: {
    id: string;
    email: string;
    name: string;
    role: "ADMIN" | "SUPERADMIN";
    status: string;
  };
  onMenuClick?: () => void;
}

export default function AdminHeader({ user, onMenuClick }: AdminHeaderProps) {
  const { logout } = useAuth();

  const getUserInitials = () => {
    if (!user?.name) return "A";
    return user.name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "SUPERADMIN":
        return "bg-purple-100 text-purple-800";
      case "ADMIN":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Right section */}
          <div className="flex items-center space-x-4 ml-auto">
            {/* Site Button */}
            <Link href="/" target="_blank">
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex items-center gap-2 border-gray-200"
              >
                <Home className="h-4 w-4" />
                <span>View Site</span>
              </Button>
            </Link>

            {/* Notifications */}
            <button className="relative p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 px-2 gap-2 hover:bg-gray-100"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:flex items-center gap-1">
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.name}
                      </p>
                      <p className="text-xs text-gray-500">{user?.role}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-64 bg-white sm:w-64 max-w-[calc(100vw-2rem)]"
                align="end"
                sideOffset={8}
              >
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">
                          {user.name}
                        </span>
                        <span className="text-sm text-gray-500 truncate max-w-[150px] sm:max-w-none">
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
                <DropdownMenuSeparator className="bg-gray-400" />

                <DropdownMenuItem asChild>
                  <Link
                    href="/profile"
                    className="cursor-pointer text-gray-800"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-gray-400" />

                <DropdownMenuItem asChild>
                  <Link
                    href="/"
                    target="_blank"
                    className="cursor-pointer text-gray-800 md:hidden"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    View Site
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 cursor-pointer focus:text-red-600"
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
