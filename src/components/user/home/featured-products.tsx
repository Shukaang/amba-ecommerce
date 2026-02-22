"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp, Clock } from "lucide-react";
import PremiumProductCard from "@/components/products/product-card";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { Skeleton } from "@/components/ui/skeleton";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  average_rating: number;
  images: string[];
  categories: { title: string } | null;
  product_variants: Array<{
    id: string;
    color?: string;
    size?: string;
    unit?: string;
    price: number;
  }>;
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"featured" | "new" | "trending">(
    "featured",
  );

  const fetchProducts = async (tab: typeof activeTab) => {
    setLoading(true);
    try {
      let url = "/api/products?limit=10";
      if (tab === "featured") url += "&featured=true";
      if (tab === "new") url += "&sort=newest";
      if (tab === "trending") url += "&sort=trending";

      const response = await fetch(url);
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(activeTab);
  }, [activeTab]);

  // Real-time subscription
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    const channel = supabase
      .channel("featured-products-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
        },
        () => {
          fetchProducts(activeTab);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab]);

  const tabs = [
    { id: "featured", label: "Featured", icon: Sparkles },
    { id: "new", label: "New Arrivals", icon: Clock },
    { id: "trending", label: "Trending", icon: TrendingUp },
  ] as const;

  return (
    <section className="py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#f73a00]/10 rounded-full text-[#f73a00] text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              Premium Selection
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              Featured Products
            </h2>
            <p className="text-slate-600 max-w-2xl">
              The pieces everyone is talking about this week. Curated for the
              discerning taste.
            </p>
          </div>

          <div className="flex gap-2 mt-6 md:mt-0 p-1 bg-[#f73a00]/10 rounded-xl">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-white/90 text-[#f73a00] shadow-md"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-5">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden shadow-sm"
              >
                <Skeleton className="aspect-[4/4] w-full" />
                <div className="p-6 space-y-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex justify-between">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              </div>
            ))
          ) : products.length > 0 ? (
            products.map((product) => (
              <PremiumProductCard key={product.id} product={product} />
            ))
          ) : (
            <div className="col-span-4 text-center py-12">
              <p className="text-slate-500">No products found</p>
            </div>
          )}
        </div>

        <div className="text-center mt-16">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-[#f73a00] font-semibold hover:gap-3 transition-all group"
          >
            View All Products
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
