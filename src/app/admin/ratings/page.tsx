import { createAdminClient } from "@/lib/supabase/supabaseServer";
import { AdminRatingsClient } from "./AdminRatingsClient";

export const metadata = {
  title: "Ratings Moderation | Admin Dashboard",
  description: "Moderate and manage product ratings and reviews",
};

export default async function AdminRatingsPage() {
  const supabase = await createAdminClient();

  // Fetch initial ratings data
  const { data: ratings, error } = await supabase
    .from("ratings")
    .select(
      `
      *,
      product:products(id, title, images),
      user:users(id, name, email)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching ratings:", error);
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Failed to load ratings</p>
      </div>
    );
  }

  return <AdminRatingsClient initialRatings={ratings || []} />;
}
