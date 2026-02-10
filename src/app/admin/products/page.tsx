import { createClient } from "@/lib/supabase/supabaseServer";
import ProductsTable from "@/components/admin/products-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function AdminProductsPage() {
  const supabase = await createClient();

  // Fetch products with categories
  const { data: products } = await supabase
    .from("products")
    .select(
      `
      *,
      categories(title)
    `,
    )
    .order("created_at", { ascending: false });

  // Fetch categories for filter
  const { data: categories } = await supabase
    .from("categories")
    .select("id, title")
    .order("title");

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <Link href="/admin/products/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      <ProductsTable products={products || []} categories={categories || []} />
    </div>
  );
}
