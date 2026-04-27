import { createClient } from "@/lib/supabase/supabaseServer";
import ProductCard from "@/components/products/product-card";
import CategoryMenu from "@/components/products/category-menu";
import { Suspense } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop All Products – AmbaStore",
  description:
    "Browse our full collection of quality products. New arrivals, trending items, and customer favorites.",
  openGraph: {
    title: "Shop All Products – AmbaStore",
    description:
      "Find your next favorite item. Wide range of categories with fast delivery.",
    url: "https://ambaastore.com/products",
  },
  alternates: {
    canonical: "https://ambaastore.com/products",
  },
};

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-gray-100 rounded-2xl h-96 animate-pulse" />
      ))}
    </div>
  );
}

// Smart ranking function: combines rating, recency, and a deterministic random seed
function rankProducts(products: any[]) {
  // Use a seed that changes daily to keep the listing fresh
  const seed = Math.floor(Date.now() / (1000 * 60 * 60 * 24)); // changes every 24h
  return products
    .map((product) => {
      // Normalize created_at to a number (days since epoch)
      const createdDays =
        new Date(product.created_at).getTime() / (1000 * 60 * 60 * 24);
      // Score = (rating * 0.7) + (recency normalized * 0.2) + (deterministic random * 0.1)
      const randomFactor = ((product.id.charCodeAt(0) + seed) % 100) / 1000; // pseudo-random but deterministic per day
      const recency = Math.min(createdDays / 365, 1); // newer products get higher value (max 1)
      const score =
        product.average_rating * 0.4 + recency * 0.4 + randomFactor * 0.2;
      return { ...product, score };
    })
    .sort((a, b) => b.score - a.score);
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    search?: string;
    new?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // 1. Fetch all categories (for category menu)
  const { data: allCategories } = await supabase
    .from("categories")
    .select("id, title, parent_id");

  // Build category maps
  const categoryChildrenMap = new Map<string, string[]>();
  allCategories?.forEach((cat) => {
    if (cat.parent_id) {
      const children = categoryChildrenMap.get(cat.parent_id) || [];
      children.push(cat.id);
      categoryChildrenMap.set(cat.parent_id, children);
    }
  });

  // Compute product counts per category (including descendants)
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

  // 2. Determine category IDs to filter (include descendants)
  let categoryIdsToFilter: string[] = [];
  if (params.category) {
    categoryIdsToFilter = [
      params.category,
      ...getAllDescendantIds(params.category, categoryChildrenMap),
    ];
  }

  // 3. Build the product query – use average_rating from table
  let query = supabase
    .from("products")
    .select(
      `
      *,
      categories(id, title),
      product_variants(*)
    `,
      { count: "exact" },
    )
    .eq("status", "approved")
    .is("deleted_at", null);

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

  const { data: products, error } = await query;

  if (error) {
    console.error("Error fetching products:", error);
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="text-red-600">
          Failed to load products. Please try again later.
        </div>
      </div>
    );
  }

  // Apply smart ranking
  const rankedProducts = products ? rankProducts(products) : [];

  return (
    <div className="container bg-white mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Our Products</h1>
        <p className="text-gray-600">
          Discover amazing products for every need
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/4">
          <CategoryMenu
            allCategories={allCategories || []}
            categoryCounts={categoryCounts}
            selectedCategoryId={params.category || null}
          />
        </div>

        <div className="lg:w-3/4">
          <Suspense fallback={<ProductsLoading />}>
            {rankedProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                {rankedProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    priority={index < 24}
                  />
                ))}
              </div>
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
