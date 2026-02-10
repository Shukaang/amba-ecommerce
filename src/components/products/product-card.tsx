"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { useCart } from "@/lib/cart/context";
import { Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  average_rating: number;
  images: string[];
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please login to add items to cart");
      router.push("/login");
      return;
    }

    setAdding(true);
    try {
      await addToCart({
        productId: product.id,
        variantId: null,
        quantity: 1,
        price: product.price,
      });
      toast.success("Added to cart!");
    } catch (error: any) {
      toast.error(error.message || "Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="group relative bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow duration-200">
      <Link href={`/products/${product.id}`} className="block">
        {/* Product Image */}
        <div className="aspect-square w-full overflow-hidden rounded-t-xl bg-gray-100">
          {product.images && product.images.length > 0 ? (
            <div className="h-full w-full bg-gray-200 flex items-center justify-center">
              <img
                src={product.images[0]}
                alt={product.title}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          ) : (
            <div className="h-full w-full bg-gray-100 flex items-center justify-center">
              <div className="text-gray-400">No image</div>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {product.title}
          </h3>
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
            {product.description}
          </p>

          {/* Rating */}
          <div className="mt-2 flex items-center">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= Math.round(product.average_rating)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-600">
              {product.average_rating.toFixed(1)}
            </span>
          </div>

          {/* Price and CTA */}
          <div className="mt-4 flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-gray-900">
                ${parseFloat(product.price.toString()).toFixed(2)}
              </span>
            </div>
            <Button
              size="sm"
              className="flex items-center space-x-1"
              onClick={handleAddToCart}
              disabled={adding}
            >
              <ShoppingCart className="h-4 w-4" />
              <span>{adding ? "Adding..." : "Add to Cart"}</span>
            </Button>
          </div>
        </div>
      </Link>
    </div>
  );
}
