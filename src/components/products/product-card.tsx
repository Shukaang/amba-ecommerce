"use client";

import { memo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, ShoppingBag, Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart/context";
import { useAuth } from "@/lib/auth/context";
import { useFavorites } from "@/lib/favorites/context";
import { useRouter } from "next/navigation";
import { useTrackProduct } from "@/hooks/useTrackProduct";
import { hasVariantOptions } from "@/lib/utils/variant-checker";
import { getSupabaseImage } from "@/lib/utils/supabase-image";

interface Product {
  id: string;
  slug: string;
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
  colors?: string[] | null;
  sizes?: Array<{ name: string; price: number }> | null;
}

interface PremiumProductCardProps {
  product: Product;
}

function PremiumProductCard({ product }: PremiumProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const router = useRouter();
  const trackProduct = useTrackProduct();

  const mainImage = product.images?.[0];
  const secondaryImage = product.images?.[1] || mainImage;

  const variantPrices = product.product_variants?.map((v) => v.price) ?? [];
  const hasVariants = variantPrices.length > 0;
  const minPrice = hasVariants
    ? Math.min(...variantPrices, product.price)
    : product.price;

  const productIsFavorite = isFavorite(product.id);
  const requiresVariant = hasVariantOptions(product);

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

    const cartLinks = document.querySelectorAll('a[href="/cart"]');
    let cartIcon: Element | null = null;
    for (const link of cartLinks) {
      const rect = link.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        cartIcon = link;
        break;
      }
    }
    const endRect: DOMRect = cartIcon
      ? cartIcon.getBoundingClientRect()
      : new DOMRect(window.innerWidth - 100, 80, 40, 40);

    const startX = startRect.left + startRect.width / 2 - 20;
    const startY = startRect.top + startRect.height / 2 - 20;
    const endX = endRect.left + endRect.width / 2 - 20;
    const endY = endRect.top + endRect.height / 2 - 20;

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

    setTimeout(() => animationEl.remove(), 800);
  };

  const handleCardClick = () => {
    trackProduct(product.id, "view");
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Redirect to detail page if product has variant options
    if (requiresVariant) {
      router.push(`/products/${product.slug}`);
      return;
    }

    setIsAdding(true);
    try {
      const currentEl = e.currentTarget as HTMLElement;
      const r = currentEl.getBoundingClientRect();
      const buttonRect = new DOMRect(r.x, r.y, r.width, r.height);

      createCartAnimation(buttonRect);
      trackProduct(product.id, "add_to_cart");

      await addToCart({
        productId: product.id,
        variantId: null,
        quantity: 1,
        price: minPrice,
      });

      setTimeout(() => setIsAdding(false), 800);
    } catch (error) {
      setIsAdding(false);
    }
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (favoriteLoading) return;
    setFavoriteLoading(true);
    try {
      await toggleFavorite(product.id, product);
      if (!productIsFavorite) {
        trackProduct(product.id, "add_to_wishlist");
      }
    } finally {
      setFavoriteLoading(false);
    }
  };

  return (
    <Link href={`/products/${product.slug}`} onClick={handleCardClick}>
      <div
        className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer flex flex-col h-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-[4/4] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          {/* Images */}
          <div
            className={`absolute inset-0 transition-opacity duration-700 ${
              isHovered && secondaryImage !== mainImage
                ? "opacity-0"
                : "opacity-100"
            }`}
          >
            <img
              src={getSupabaseImage(mainImage, 500)}
              alt={product.title}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover"
            />
          </div>
          {secondaryImage !== mainImage && (
            <div
              className={`absolute inset-0 transition-opacity duration-700 ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
            >
              <img
                src={getSupabaseImage(secondaryImage, 500)}
                alt={product.title}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="object-cover"
              />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#f73a00]/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
            {product.average_rating >= 4.5 && (
              <Badge className="bg-[#f73a00] hover:bg-[#fe4208] text-white text-sm border-0 shadow-md">
                <Star className="h-3 w-3 mr-1" /> Premium
              </Badge>
            )}
          </div>

          {/* Favorite button */}
          <div
            className={`
              absolute top-4 right-4 flex-col gap-2 z-10
              md:opacity-0 md:translate-x-4 md:group-hover:opacity-100 md:group-hover:translate-x-0
              transition-all duration-300
            `}
          >
            <button
              onClick={handleFavoriteClick}
              disabled={favoriteLoading}
              className="h-10 w-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:scale-110 hover:bg-white transition-all disabled:opacity-50"
              aria-label={
                productIsFavorite ? "Remove from favorites" : "Add to favorites"
              }
            >
              {favoriteLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#f73a00]" />
              ) : (
                <Heart
                  className={`h-5 w-5 ${
                    productIsFavorite
                      ? "fill-[#f73a00] text-[#f73a00]"
                      : "text-[#f73a00]"
                  }`}
                />
              )}
            </button>
          </div>

          {/* Quick add button */}
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

        <div className="py-2 px-2 flex-1">
          <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-[#f73a00] transition-colors">
            {product.title}
          </h3>
          <div className="flex items-center gap-2 mb-2">
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
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-gray-900">
                Br {minPrice.toLocaleString("en-US")}
              </span>
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

export default memo(PremiumProductCard);
