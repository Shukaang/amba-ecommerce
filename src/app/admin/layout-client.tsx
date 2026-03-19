"use client";

import { useState } from "react";
import AdminHeader from "@/components/admin/header";
import AdminSidebar from "@/components/admin/sidebar";

interface AdminLayoutClientProps {
  children: React.ReactNode;
  user: {
    id: string;
    email: string;
    name: string;
    role: "ADMIN" | "SUPERADMIN";
    status: string;
  };
}

export default function AdminLayoutClient({
  children,
  user,
}: AdminLayoutClientProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <>
      <AdminSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <div className="lg:pl-64">
        <AdminHeader
          user={user}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />
        <main className="py-6 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
