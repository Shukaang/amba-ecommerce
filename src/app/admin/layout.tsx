import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { createAdminClient } from "@/lib/supabase/supabaseServer";
import AdminLayoutClient from "./layout-client";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    notFound(); // instead of redirect
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    notFound();
  }

  const supabase = await createAdminClient();

  const { data: userData } = await supabase
    .from("users")
    .select("id, email, name, role, status")
    .eq("id", decoded.id)
    .single();

  if (!userData || !["ADMIN", "SUPERADMIN"].includes(userData.role)) {
    notFound();
  }

  if (userData.status !== "ACTIVE") {
    notFound();
  }

  return <AdminLayoutClient user={userData}>{children}</AdminLayoutClient>;
}
