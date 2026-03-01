import { createClient } from "@/lib/supabase/supabaseServer";
import ProductCard from "@/components/products/product-card";
import CategoryMenu from "@/components/products/category-menu";
import { Suspense } from "react";

function getAllDescendantIds(
  categoryId: string,
  categoryChildrenMap: Map<string, string[]>,
): string[] {
  const children = categoryChildrenMap.get(categoryId) || [];
  const descendants = [...children];
  for (const child of children) {
    descendants.push(...getAllDescendantIds(child, categoryChildrenMap));
  }
  return descendants;
}

function ProductsLoading() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-gray-100 rounded-2xl h-96 animate-pulse" />
      ))}
    </div>
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string; new?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // 1. Fetch all categories with parent_id
  const { data: allCategories } = await supabase
    .from("categories")
    .select("id, title, parent_id");

  // Build category maps
  const categoryChildrenMap = new Map<string, string[]>();
  const allCategoriesById = new Map<
    string,
    { id: string; title: string; parent_id: string | null }
  >();
  allCategories?.forEach((cat) => {
    allCategoriesById.set(cat.id, cat);
    if (cat.parent_id) {
      const children = categoryChildrenMap.get(cat.parent_id) || [];
      children.push(cat.id);
      categoryChildrenMap.set(cat.parent_id, children);
    }
  });

  // 2. Compute product counts per category (including descendants)
  const { data: productCategories } = await supabase
    .from("products")
    .select("category_id");

  const directCounts: Record<string, number> = {};
  productCategories?.forEach((p) => {
    if (p.category_id) {
      directCounts[p.category_id] = (directCounts[p.category_id] || 0) + 1;
    }
  });

  const getTotalCount = (catId: string): number => {
    let total = directCounts[catId] || 0;
    const children = categoryChildrenMap.get(catId) || [];
    for (const childId of children) {
      total += getTotalCount(childId);
    }
    return total;
  };

  const categoryCounts: Record<string, number> = {};
  allCategories?.forEach((cat) => {
    categoryCounts[cat.id] = getTotalCount(cat.id);
  });

  // 3. Determine category IDs to filter
  let categoryIdsToFilter: string[] = [];
  if (params.category) {
    categoryIdsToFilter = [
      params.category,
      ...getAllDescendantIds(params.category, categoryChildrenMap),
    ];
  }

  // 4. Build product query
  let query = supabase
    .from("products")
    .select(
      `
      *,
      categories(id, title),
      product_variants(*),
      ratings(*)
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (params.new === "true") {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    query = query.gte("created_at", twoWeeksAgo.toISOString());
  }
  if (params.search) {
    query = query.ilike("title", `%${params.search}%`);
  }
  if (categoryIdsToFilter.length > 0) {
    query = query.in("category_id", categoryIdsToFilter);
  }

  const { data: products, error } = await query.limit(50);

  if (error) {
    console.error("Error fetching products:", error);
  }

  const productsWithAvgRating = products?.map((product) => ({
    ...product,
    average_rating:
      product.ratings?.length > 0
        ? product.ratings.reduce(
            (acc: number, curr: any) => acc + curr.rating,
            0,
          ) / product.ratings.length
        : 0,
  }));

  const { count: totalProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });

  return (
    <div className="container bg-white mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Our Products</h1>
        <p className="text-gray-600">
          Discover amazing products for every need
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Category Menu - replaces old filters */}
        <div className="lg:w-1/4">
          <CategoryMenu
            allCategories={allCategories || []}
            categoryCounts={categoryCounts}
            selectedCategoryId={params.category || null}
          />
        </div>

        <div className="lg:w-3/4">
          <Suspense fallback={<ProductsLoading />}>
            {productsWithAvgRating && productsWithAvgRating.length > 0 ? (
              <>
                {params.category && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-600">
                      Showing {productsWithAvgRating.length} products
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                  {productsWithAvgRating.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg">No products found</div>
                <p className="text-gray-500 mt-2">
                  {params.category || params.search || params.new
                    ? "Try changing your filters"
                    : "Check back later for new products"}
                </p>
              </div>
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
