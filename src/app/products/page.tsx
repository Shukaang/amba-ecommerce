import { createClient } from "@/lib/supabase/supabaseServer";
import ProductCard from "@/components/products/product-card";
import ProductFilters from "@/components/products/product-filters";
import SubcategoryFilter from "@/components/products/subcategory-filter";
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
  searchParams: Promise<{
    minPrice?: string;
    maxPrice?: string;
    category?: string;
    categories?: string;
    subcategory?: string;
    minRating?: string;
    new?: string;
    search?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // 1. Fetch all categories
  const { data: allCategories } = await supabase
    .from("categories")
    .select("id, title, parent_id");

  // Build maps
  const categoryChildrenMap = new Map<string, string[]>();
  const childToParentMap = new Map<string, string>();
  const parentCategories: { id: string; title: string }[] = [];
  const subcategoriesByParent: Record<string, { id: string; title: string }[]> =
    {};

  allCategories?.forEach((cat) => {
    if (cat.parent_id) {
      // child
      const children = categoryChildrenMap.get(cat.parent_id) || [];
      children.push(cat.id);
      categoryChildrenMap.set(cat.parent_id, children);
      childToParentMap.set(cat.id, cat.parent_id);

      if (!subcategoriesByParent[cat.parent_id]) {
        subcategoriesByParent[cat.parent_id] = [];
      }
      subcategoriesByParent[cat.parent_id].push({
        id: cat.id,
        title: cat.title,
      });
    } else {
      // parent
      parentCategories.push({ id: cat.id, title: cat.title });
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

  const parentCategoryCounts: Record<string, number> = {};
  parentCategories.forEach((parent) => {
    parentCategoryCounts[parent.id] = getTotalCount(parent.id);
  });

  // 3. Determine category IDs to filter and the parent for subcategory filter
  let categoryIdsToFilter: string[] = [];
  let selectedParentId: string | null = null;

  if (params.subcategory) {
    // Filter by this subcategory only
    categoryIdsToFilter = [params.subcategory];
    // Find its parent to show the subcategory filter row
    selectedParentId = childToParentMap.get(params.subcategory) || null;
  } else if (params.category) {
    // Single parent from header
    selectedParentId = params.category;
    categoryIdsToFilter = [
      params.category,
      ...getAllDescendantIds(params.category, categoryChildrenMap),
    ];
  } else if (params.categories) {
    const selected = params.categories.split(",");
    if (
      selected.length === 1 &&
      parentCategories.some((p) => p.id === selected[0])
    ) {
      // Single parent selected via filter sidebar
      selectedParentId = selected[0];
      categoryIdsToFilter = [
        selected[0],
        ...getAllDescendantIds(selected[0], categoryChildrenMap),
      ];
    } else {
      // Multiple categories or non-parents – expand each
      const expanded = selected.flatMap((id) => [
        id,
        ...getAllDescendantIds(id, categoryChildrenMap),
      ]);
      categoryIdsToFilter = [...new Set(expanded)];
    }
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
  if (params.minPrice) {
    query = query.gte("price", parseFloat(params.minPrice));
  }
  if (params.maxPrice) {
    query = query.lte("price", parseFloat(params.maxPrice));
  }
  if (categoryIdsToFilter.length > 0) {
    query = query.in("category_id", categoryIdsToFilter);
  }
  if (params.minRating) {
    query = query.gte("average_rating", parseFloat(params.minRating));
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Our Products</h1>
        <p className="text-gray-600">
          Discover amazing products for every need
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/4">
          <ProductFilters
            categories={parentCategories}
            categoryCounts={parentCategoryCounts}
            totalProducts={totalProducts || 0}
          />
        </div>

        <div className="lg:w-3/4">
          {/* Subcategory Filter – show if we have a parent with children */}
          {selectedParentId &&
            subcategoriesByParent[selectedParentId]?.length > 0 && (
              <SubcategoryFilter
                subcategories={subcategoriesByParent[selectedParentId]}
                selectedSubcategory={params.subcategory}
              />
            )}

          <Suspense fallback={<ProductsLoading />}>
            {productsWithAvgRating && productsWithAvgRating.length > 0 ? (
              <>
                {(params.minPrice ||
                  params.maxPrice ||
                  categoryIdsToFilter.length > 0 ||
                  params.minRating ||
                  params.new ||
                  params.search) && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-600">
                      Showing {productsWithAvgRating.length} products matching
                      your filters
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {productsWithAvgRating.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg">No products found</div>
                <p className="text-gray-500 mt-2">
                  {params.minPrice ||
                  params.maxPrice ||
                  categoryIdsToFilter.length > 0 ||
                  params.minRating ||
                  params.new ||
                  params.search
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
