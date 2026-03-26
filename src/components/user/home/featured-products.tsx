"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp, Clock } from "lucide-react";
import PremiumProductCard from "@/components/products/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import useSWR from "swr";
import { fetcher } from "@/lib/utils/fetcher";

interface Product {
  id: string;
  slug: string;
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

interface ProductsResponse {
  products: Product[];
}

interface FeaturedProductsProps {
  initialProducts: Product[];
}

export default function FeaturedProducts({
  initialProducts,
}: FeaturedProductsProps) {
  const [activeTab, setActiveTab] = useState<"new" | "featured" | "trending">(
    "new",
  );
  const tabContainerRef = useRef<HTMLDivElement>(null);

  const url =
    activeTab === "new"
      ? "/api/products?limit=15&sort=newest"
      : activeTab === "trending"
        ? "/api/products?limit=15&sort=trending"
        : "/api/products?limit=15&featured=true";

  const { data, error, isLoading } = useSWR<ProductsResponse>(url, fetcher, {
    fallbackData:
      activeTab === "new" ? { products: initialProducts } : undefined,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const products = data?.products || [];

  // Scroll active tab into view on mobile when it changes
  useEffect(() => {
    if (tabContainerRef.current) {
      const activeButton = tabContainerRef.current.querySelector(
        `[data-tab="${activeTab}"]`,
      );
      if (activeButton) {
        activeButton.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [activeTab]);

  const tabs = [
    { id: "new", label: "New Arrivals", icon: Clock },
    { id: "featured", label: "Featured", icon: Sparkles },
    { id: "trending", label: "Trending", icon: TrendingUp },
  ] as const;

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        Failed to load products
      </div>
    );
  }

  return (
    <section className="py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 sm:mb-8 md:mb-12">
          <div className="w-full md:w-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#f73a00]/10 rounded-full text-[#f73a00] text-xs sm:text-sm font-medium mb-3 sm:mb-4">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
              Premium Selection
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
              Featured Products
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
              The pieces everyone is talking about this week. Curated for the
              discerning taste.
            </p>
          </div>

          {/* Scrollable tabs on mobile */}
          <div
            ref={tabContainerRef}
            className="w-full md:w-auto mt-4 md:mt-0 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div className="flex gap-1 sm:gap-2 p-1 min-w-max md:min-w-0 bg-[#f73a00]/10 rounded-xl">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    data-tab={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-white text-[#f73a00] shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                    }`}
                  >
                    <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
          {isLoading ? (
            [...Array(10)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl overflow-hidden shadow-sm"
              >
                <Skeleton className="aspect-square w-full" />
                <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
                  <Skeleton className="h-3 sm:h-4 w-full" />
                  <div className="flex justify-between">
                    <Skeleton className="h-6 sm:h-7 w-16 sm:w-20" />
                    <Skeleton className="h-6 sm:h-7 w-12 sm:w-16" />
                  </div>
                </div>
              </div>
            ))
          ) : products.length > 0 ? (
            products.map((product: Product) => (
              <PremiumProductCard key={product.id} product={product} />
            ))
          ) : (
            <div className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-5 text-center py-12">
              <p className="text-gray-500">No products found</p>
            </div>
          )}
        </div>

        <div className="text-center mt-10 sm:mt-12 md:mt-16">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-[#f73a00] text-sm sm:text-base font-semibold hover:gap-3 transition-all group"
          >
            View All Products
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
