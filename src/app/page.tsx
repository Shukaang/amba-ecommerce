import { createClient } from "@/lib/supabase/supabaseServer";
import HeroSection from "@/components/user/home/hero-section";
import FeaturedProducts from "@/components/user/home/featured-products";
import CategoryShowcase from "@/components/user/home/category-showcase";
import CategorySection from "@/components/user/home/category-section";
import ScrollToTopButton from "@/components/user/scroll-to-top";

interface Category {
  id: string;
  title: string;
  parent_id: string | null;
}

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch root categories and build descendant map for sections
  const { data: allCategories } = await supabase
    .from("categories")
    .select("id, title, parent_id")
    .order("title", { ascending: false });

  if (!allCategories) return null;

  // Build map of parent to children
  const childrenMap = new Map<string, Category[]>();
  const roots: Category[] = [];
  allCategories.forEach((cat) => {
    if (cat.parent_id) {
      if (!childrenMap.has(cat.parent_id)) {
        childrenMap.set(cat.parent_id, []);
      }
      childrenMap.get(cat.parent_id)!.push(cat);
    } else {
      roots.push(cat);
    }
  });

  const getDescendantIds = (catId: string): string[] => {
    const children = childrenMap.get(catId) || [];
    const descendants = [catId];
    children.forEach((child) => {
      descendants.push(...getDescendantIds(child.id));
    });
    return descendants;
  };

  const rootCategories = roots.slice(0, 4); // use first four

  // For each root category, fetch initial products (for the server-side fallback)
  const categoryInitialData = await Promise.all(
    rootCategories.map(async (cat) => {
      const descendantIds = getDescendantIds(cat.id);
      const { data: products } = await supabase
        .from("products")
        .select("*")
        .is("deleted_at", null)
        .in("category_id", descendantIds)
        .eq("status", "approved")
        .order("average_rating", { ascending: false })
        .limit(4);
      return { id: cat.id, products: products || [] };
    }),
  );

  // For featured products, fetch initial "new" products (for fallback)
  const { data: initialNewProducts } = await supabase
    .from("products")
    .select("*")
    .is("deleted_at", null)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(15);

  // Build a map for quick lookup
  const categoryInitialMap = new Map(
    categoryInitialData.map((item) => [item.id, item.products]),
  );

  return (
    <main>
      <HeroSection />
      <FeaturedProducts initialProducts={initialNewProducts || []} />
      {rootCategories.map((cat) => (
        <CategorySection
          key={cat.id}
          categoryId={cat.id}
          categoryTitle={cat.title}
          descendantIds={getDescendantIds(cat.id)}
          limit={4}
          initialProducts={categoryInitialMap.get(cat.id) || []}
        />
      ))}
      <CategoryShowcase />
      <ScrollToTopButton />
    </main>
  );
}
