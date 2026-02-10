import { createAdminClient } from "@/lib/supabase/supabaseServer";
import CategoriesTable from "@/components/admin/categories-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function AdminCategoriesPage() {
  const supabase = await createAdminClient();

  const { data: categories } = await supabase
    .from("categories")
    .select(
      `
      *,
      parent:categories!parent_id(title)
    `,
    )
    .order("created_at", { ascending: false });

  const transformedCategories =
    categories?.map((category) => ({
      ...category,
      parent_categories: category.parent
        ? { title: category.parent.title }
        : null,
    })) || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Categories</h1>
          <p className="text-gray-600">
            Manage product categories and subcategories
          </p>
        </div>
        <Link href="/admin/categories/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </Link>
      </div>

      <CategoriesTable categories={transformedCategories} />
    </div>
  );
}
