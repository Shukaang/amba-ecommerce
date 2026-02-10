import { createClient } from "@/lib/supabase/supabaseServer";
import ProductCard from "@/components/products/product-card";
import ProductFilters from "@/components/products/product-filters";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    minPrice?: string;
    maxPrice?: string;
    categories?: string;
    minRating?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Build query
  let query = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  // Apply price filter
  if (params.minPrice) {
    query = query.gte("price", parseFloat(params.minPrice));
  }
  if (params.maxPrice) {
    query = query.lte("price", parseFloat(params.maxPrice));
  }

  // Apply category filter
  if (params.categories) {
    const categoryIds = params.categories.split(",");
    query = query.in("category_id", categoryIds);
  }

  // Apply rating filter
  if (params.minRating) {
    query = query.gte("average_rating", parseFloat(params.minRating));
  }

  const { data: products } = await query.limit(20);

  // Fetch categories for filters
  const { data: categories } = await supabase
    .from("categories")
    .select("id, title")
    .order("title");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Our Products</h1>
        <p className="text-gray-600">
          Discover amazing products for every need
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="lg:w-1/4">
          <ProductFilters categories={categories || []} />
        </div>

        {/* Products Grid */}
        <div className="lg:w-3/4">
          {products && products.length > 0 ? (
            <>
              {/* Show active filters */}
              {(params.minPrice ||
                params.maxPrice ||
                params.categories ||
                params.minRating) && (
                <div className="mb-6">
                  <p className="text-sm text-gray-600">
                    Showing {products.length} products matching your filters
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg">No products found</div>
              <p className="text-gray-500 mt-2">
                {params.minPrice ||
                params.maxPrice ||
                params.categories ||
                params.minRating
                  ? "Try changing your filters"
                  : "Check back later for new products"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
