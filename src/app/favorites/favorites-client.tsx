"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useFavorites } from "@/lib/favorites/context";
import PremiumProductCard from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft, ShoppingBag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function FavoritesClient() {
  const { items, loading, refreshFavorites } = useFavorites();

  useEffect(() => {
    refreshFavorites();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            My Favorites
          </h1>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-50 mb-6">
              <Heart className="h-10 w-10 text-[#f73a00]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Your favorites list is empty
            </h1>
            <p className="text-gray-600 mb-8">
              Save your favorite items and come back to them anytime.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                className="bg-[#f73a00] hover:bg-[#f73a00]/90 text-white rounded-xl px-6 py-5"
              >
                <Link href="/products">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Browse Products
                </Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="rounded-xl px-6 py-5"
              >
                <Link href="/">
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Go Home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          My Favorites
        </h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((product) => (
            <PremiumProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
