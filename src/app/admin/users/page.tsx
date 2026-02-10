import { createAdminClient } from "@/lib/supabase/supabaseServer";
import UsersTable from "@/components/admin/users-table";

export default async function AdminUsersPage() {
  const supabase = await createAdminClient();

  // Fetch all users
  const { data: users } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          User Management
        </h1>
        <p className="text-gray-600">Manage all users in the system</p>
      </div>

      <UsersTable users={users || []} />
    </div>
  );
}
