"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, ShoppingBag, Eye, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart/context";
import { useAuth } from "@/lib/auth/context";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  average_rating: number;
  images: string[];
  categories?: { title: string } | null;
  product_variants?: Array<{
    id: string;
    color?: string;
    size?: string;
    unit?: string;
    price: number;
  }>;
}

interface PremiumProductCardProps {
  product: Product;
  showQuickView?: boolean;
}

export default function PremiumProductCard({
  product,
  showQuickView = true,
}: PremiumProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const mainImage =
    product.images?.[0] ||
    "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=2070&auto=format&fit=crop";
  const secondaryImage = product.images?.[1] || mainImage;
  const hasVariants =
    product.product_variants && product.product_variants.length > 0;
  const minPrice = hasVariants
    ? Math.min(...product.product_variants.map((v) => v.price), product.price)
    : product.price;

  const createCartAnimation = (startRect: DOMRect) => {
    const animationEl = document.createElement("div");
    animationEl.className = "fixed z-[100] pointer-events-none";
    animationEl.innerHTML = `
      <div class="flex items-center justify-center h-10 w-10 rounded-full bg-[#f73a00] text-white shadow-lg">
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      </div>
    `;

    document.getElementById("cart-animation-element")?.appendChild(animationEl);

    const cartIcon = document.querySelector('a[href="/cart"]');
    const endRect = cartIcon?.getBoundingClientRect() || {
      left: window.innerWidth - 100,
      top: 80,
    };

    const startX = startRect.left + startRect.width / 2 - 20;
    const startY = startRect.top + startRect.height / 2 - 20;
    const endX = endRect.left + (endRect.width || 0) / 2 - 20;
    const endY = endRect.top + (endRect.height || 0) / 2 - 20;

    Object.assign(animationEl.style, {
      left: `${startX}px`,
      top: `${startY}px`,
      transform: "scale(1)",
      opacity: "1",
      transition: "all 800ms cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    });

    setTimeout(() => {
      Object.assign(animationEl.style, {
        transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0.5)`,
        opacity: "0",
      });
    }, 10);

    setTimeout(() => {
      animationEl.remove();
    }, 800);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please login to add items to cart");
      return;
    }

    // If product has variants, redirect to detail page to select variant
    if (hasVariants) {
      router.push(`/products/${product.id}`);
      return;
    }

    setIsAdding(true);
    try {
      const buttonRect = e.currentTarget.getBoundingClientRect();
      createCartAnimation(buttonRect);

      await addToCart({
        productId: product.id,
        variantId: null,
        quantity: 1,
        price: minPrice,
      });

      toast.success("Added to cart!");

      setTimeout(() => {
        setIsAdding(false);
      }, 800);
    } catch (error: any) {
      toast.error(error.message || "Failed to add to cart");
      setIsAdding(false);
    }
  };

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    toast.success(
      isWishlisted ? "Removed from wishlist" : "Added to wishlist!",
    );
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast.info("Quick view coming soon!");
  };

  return (
    <Link href={`/products/${product.id}`}>
      <div
        className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer flex flex-col h-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container */}
        <div className="relative aspect-[4/4] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          {/* Main Image */}
          <div
            className={`absolute inset-0 transition-opacity duration-700 ${
              isHovered && secondaryImage !== mainImage
                ? "opacity-0"
                : "opacity-100"
            }`}
          >
            <img
              src={mainImage}
              alt={product.title}
              className="w-full h-full object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>

          {/* Secondary Image */}
          {secondaryImage !== mainImage && (
            <div
              className={`absolute inset-0 transition-opacity duration-700 ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
            >
              <img
                src={secondaryImage}
                alt={product.title}
                className="w-full h-full object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#f73a00]/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          {/* Wishlist Button - always visible on mobile, appears on hover on desktop */}
          <div
            className={`
    absolute top-4 right-4 flex-col gap-2 z-10
    md:opacity-0 md:translate-x-4 md:group-hover:opacity-100 md:group-hover:translate-x-0
    transition-all duration-300
  `}
          >
            <button
              onClick={toggleWishlist}
              className="h-10 w-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:scale-110 hover:bg-white transition-all"
              aria-label={
                isWishlisted ? "Remove from wishlist" : "Add to wishlist"
              }
            >
              <Heart
                className={`h-5 w-5 ${
                  isWishlisted
                    ? "fill-[#f73a00] text-[#f73a00]"
                    : "text-[#f73a00]"
                }`}
              />
            </button>
          </div>

          {/* Quick Add Button - only on desktop (hover), hidden on mobile */}
          <div
            className={`absolute bottom-4 left-4 right-4 hidden md:block md:opacity-0 md:translate-y-4 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-300`}
          >
            <Button
              onClick={handleAddToCart}
              disabled={isAdding}
              className="w-full bg-white hover:bg-white/95 text-[#f73a00] hover:text-[#f73a00]/90 font-bold py-4 rounded-xl shadow-xl backdrop-blur-sm border-0"
              size="lg"
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              {isAdding ? "Adding..." : "Quick Add"}
            </Button>
          </div>
        </div>

        {/* Product Info - flex-1 to fill remaining space */}
        <div className="py-4 px-2 flex-1">
          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-[#f73a00] transition-colors">
            {product.title}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= Math.round(product.average_rating)
                      ? "fill-[#f73a00] text-[#f73a00]"
                      : "fill-gray-200 text-gray-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">
              {product.average_rating.toFixed(1)}
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-gray-900">
                Br {minPrice.toLocaleString("en-US")}
              </span>
              {hasVariants && (
                <div className="text-xs text-gray-500">
                  From ETB
                  {Math.min(
                    ...product.product_variants!.map((v) => v.price),
                  ).toLocaleString("en-US")}
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddToCart}
              disabled={isAdding}
              className="text-[#f73a00] hover:text-[#f73a00]/80 hover:bg-[#f73a00]/10"
            >
              <ShoppingBag className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
