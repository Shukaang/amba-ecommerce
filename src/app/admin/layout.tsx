import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { createAdminClient } from "@/lib/supabase/supabaseServer";
import AdminSidebar from "@/components/admin/sidebar";
import AdminHeader from "@/components/admin/header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    redirect("/login");
  }

  // Verify JWT token
  const decoded = verifyToken(token);
  if (!decoded) {
    redirect("/login");
  }

  // Use admin client to bypass RLS
  const supabase = await createAdminClient();

  // Get user from database
  const { data: userData } = await supabase
    .from("users")
    .select("id, email, name, role, status")
    .eq("id", decoded.id)
    .single();

  // Check if user exists and has admin role
  if (!userData || !["ADMIN", "SUPERADMIN"].includes(userData.role)) {
    redirect("/products");
  }

  // Check if user is active
  if (userData.status !== "ACTIVE") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar role={userData.role} />
      <div className="lg:pl-64">
        <AdminHeader user={userData} />
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
