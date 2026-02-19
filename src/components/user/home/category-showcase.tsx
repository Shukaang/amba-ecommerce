"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Tag } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { Skeleton } from "@/components/ui/skeleton";

interface Category {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  parent_id: string | null;
  product_count?: number;
}

export default function CategoryShowcase() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoriesWithCounts();
  }, []);

  // Real-time subscription
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel("categories-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        () => fetchCategoriesWithCounts(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCategoriesWithCounts = async () => {
    try {
      const supabase = createBrowserSupabaseClient();

      const { data: allCategories, error: catError } = await supabase
        .from("categories")
        .select("id, title, description, image, parent_id");

      if (catError) throw catError;

      const { data: products, error: prodError } = await supabase
        .from("products")
        .select("category_id");

      if (prodError) throw prodError;

      const directCounts: Record<string, number> = {};
      products?.forEach((p) => {
        if (p.category_id) {
          directCounts[p.category_id] = (directCounts[p.category_id] || 0) + 1;
        }
      });

      const childrenMap: Record<string, string[]> = {};
      allCategories?.forEach((cat) => {
        if (cat.parent_id) {
          if (!childrenMap[cat.parent_id]) childrenMap[cat.parent_id] = [];
          childrenMap[cat.parent_id].push(cat.id);
        }
      });

      const getTotalCount = (catId: string): number => {
        let total = directCounts[catId] || 0;
        const children = childrenMap[catId] || [];
        for (const childId of children) {
          total += getTotalCount(childId);
        }
        return total;
      };

      const topLevel = allCategories
        ?.filter((cat) => !cat.parent_id)
        .map((cat) => ({
          ...cat,
          product_count: getTotalCount(cat.id),
        }))
        .sort((a, b) => a.title.localeCompare(b.title))
        .slice(0, 4); // We'll use the first four

      setCategories(topLevel || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryImage = (category: Category) => {
    if (category.image) return category.image;
    return "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop";
  };

  if (loading) {
    return (
      <section className="py-16 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-48 mx-auto mb-4" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[400px] md:h-[500px] rounded-lg" />
            <div className="space-y-6">
              <Skeleton className="h-[200px] md:h-[240px] rounded-lg" />
              <div className="grid grid-cols-2 gap-6">
                <Skeleton className="h-[180px] md:h-[200px] rounded-lg" />
                <Skeleton className="h-[180px] md:h-[200px] rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section className="py-16 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Shop by Category</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Categories coming soon!
          </p>
        </div>
      </section>
    );
  }

  const [cat1, cat2, cat3, cat4] = categories;

  return (
    <section className="py-12 bg-slate-50 dark:bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#f73a00]/10 rounded-full text-[#f73a00] text-sm font-medium mb-4">
            <Tag className="h-4 w-4" />
            Shop by Category
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Curated Collections
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Discover our thoughtfully organized categories for every lifestyle
            and occasion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Left large category */}
          {cat1 && (
            <Link
              href={`/products?category=${cat1.id}`}
              className="group relative block"
            >
              <div className="relative h-[200px] md:h-[400px] rounded-lg overflow-hidden">
                <img
                  src={getCategoryImage(cat1)}
                  alt={cat1.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white z-10">
                  <h3 className="text-3xl font-bold mb-2">{cat1.title}</h3>
                  <p className="text-white/80 text-sm mb-3 line-clamp-2">
                    {cat1.description || "Explore our collection"}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold border-b-2 border-[#f73a00] pb-1 group-hover:gap-3 transition-all">
                      Shop Now
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <span className="text-white/60 text-sm">
                      {cat1.product_count} products
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Right column – stacked */}
          <div className="space-y-3">
            {/* Bottom two categories side by side */}
            <div className="grid grid-cols-2 gap-3">
              {cat3 && (
                <Link
                  href={`/products?category=${cat3.id}`}
                  className="group relative block"
                >
                  <div className="relative h-[170px] md:h-[190px] rounded-lg overflow-hidden">
                    <img
                      src={getCategoryImage(cat3)}
                      alt={cat3.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h3 className="text-lg font-bold mb-1">{cat3.title}</h3>
                      <p className="text-white/70 text-xs mb-2 line-clamp-1">
                        {cat3.description || "Shop now"}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium border-b border-[#f73a00] pb-0.5 group-hover:border-b-2 transition-all">
                          Shop
                        </span>
                        <span className="text-white/50 text-xs">
                          {cat3.product_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )}
              {cat4 && (
                <Link
                  href={`/products?category=${cat4.id}`}
                  className="group relative block"
                >
                  <div className="relative h-[170px] md:h-[190px] rounded-lg overflow-hidden">
                    <img
                      src={getCategoryImage(cat4)}
                      alt={cat4.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h3 className="text-lg font-bold mb-1">{cat4.title}</h3>
                      <p className="text-white/70 text-xs mb-2 line-clamp-1">
                        {cat4.description || "Shop now"}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium border-b border-[#f73a00] pb-0.5 group-hover:border-b-2 transition-all">
                          Shop
                        </span>
                        <span className="text-white/50 text-xs">
                          {cat4.product_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )}
            </div>
            {/* Top right (second category) */}
            {cat2 && (
              <Link
                href={`/products?category=${cat2.id}`}
                className="group relative block"
              >
                <div className="relative h-[180px] md:h-[200px] rounded-lg overflow-hidden">
                  <img
                    src={getCategoryImage(cat2)}
                    alt={cat2.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-xl font-bold mb-1">{cat2.title}</h3>
                    <p className="text-white/70 text-xs mb-2 line-clamp-1">
                      {cat2.description || "Shop now"}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium border-b border-[#f73a00] pb-0.5 group-hover:border-b-2 transition-all">
                        Shop
                      </span>
                      <span className="text-white/50 text-xs">
                        {cat2.product_count}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
