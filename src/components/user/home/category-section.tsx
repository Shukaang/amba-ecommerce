"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProductCard from "@/components/products/product-card";
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
  product_variants?: Array<{
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

interface CategorySectionProps {
  categoryId: string;
  categoryTitle: string;
  descendantIds: string[];
  limit?: number;
  initialProducts?: Product[];
}

export default function CategorySection({
  categoryId,
  categoryTitle,
  descendantIds,
  limit = 4,
  initialProducts,
}: CategorySectionProps) {
  const idsParam = descendantIds.join(",");
  const url = `/api/products?category=${idsParam}&limit=${limit}`;

  const { data, error, isLoading } = useSWR<ProductsResponse>(
    descendantIds.length > 0 ? url : null,
    fetcher,
    {
      fallbackData: initialProducts ? { products: initialProducts } : undefined,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  const products = data?.products || [];

  if (descendantIds.length === 0) return null;
  if (error) return null;

  return (
    <section id={`category-${categoryId}`} className="py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {categoryTitle}
          </h2>
          <Link
            href={`/products?category=${categoryId}`}
            className="inline-flex items-center text-[#f73a00] hover:text-[#f73a00]/80 font-medium group"
          >
            View All
            <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[...Array(limit)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl overflow-hidden shadow-sm"
              >
                <Skeleton className="aspect-square w-full" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {products.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No products in this category yet.
          </p>
        )}
      </div>
    </section>
  );
}
