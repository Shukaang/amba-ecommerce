import { createClient } from "@/lib/supabase/supabaseServer";
import HeroSection from "@/components/user/home/hero-section";
import FeaturedProducts from "@/components/user/home/featured-products";
import CategoryShowcase from "@/components/user/home/category-showcase";
import CategorySection from "@/components/user/home/category-section";
import ScrollToTopButton from "@/components/user/scroll-to-top";
import { Metadata } from "next";
import OrganizationSchema from "@/components/seo/organization-schema";

interface Category {
  id: string;
  title: string;
  parent_id: string | null;
}

export const metadata: Metadata = {
  title: "AmbaStore – Ethiopia’s Premium Online Shopping",
  description:
    "Shop the best fashion, electronics, and more in Ethiopia. Free delivery in Addis Ababa. Secure payments.",
  openGraph: {
    title: "AmbaStore – Ethiopia’s Premium Online Shopping",
    description:
      "Discover quality products at great prices. New arrivals, trending items, and customer favorites.",
    url: "https://ambaastore.com",
    siteName: "AmbaStore",
    images: [
      {
        url: "https://ambaastore.com/hero-image.jpg",
        width: 1200,
        height: 630,
        alt: "AmbaStore - Shop Online in Ethiopia",
      },
    ],
    locale: "en_ET",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AmbaStore – Ethiopia’s Premium Online Shopping",
    description: "Shop with confidence. Free shipping in Addis Ababa!",
    images: ["https://ambaastore.com/hero-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://ambaastore.com",
  },
};

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch all categories
  const { data: allCategories } = await supabase
    .from("categories")
    .select("id, title, parent_id")
    .order("title", { ascending: false });

  if (!allCategories) return null;

  // Build category tree and root categories
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

  const rootCategories = roots.slice(0, 4);

  // For each root category, fetch initial products for CategorySection
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

  const categoryInitialMap = new Map(
    categoryInitialData.map((item) => [item.id, item.products]),
  );

  return (
    <main>
      <OrganizationSchema />
      <HeroSection />
      <FeaturedProducts /> {/* No props – API handles logic */}
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
