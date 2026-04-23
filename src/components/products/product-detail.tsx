"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { useCart } from "@/lib/cart/context";
import {
  Star,
  ShoppingCart,
  Heart,
  Share2,
  ChevronRight,
  Clock,
  Edit2,
  Trash2,
  Truck,
  RotateCcw,
  Loader2,
  ArrowLeft,
  Info,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useTrackProduct } from "@/hooks/useTrackProduct";
import { hasVariantOptions } from "@/lib/utils/variant-checker";

// Types
interface ProductVariant {
  id: string;
  color: string | null;
  size: string | null;
  unit: string | null;
  price: number;
}

interface Category {
  id: string;
  title: string;
}

interface Rating {
  id: string;
  rating: number;
  review: string | null;
  created_at: string;
  moderated: boolean;
  users: {
    name: string;
    email: string;
  };
}

interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  average_rating: number;
  images: string[];
  categories: Category | null;
  colors: string[];
  sizes: Array<{ name: string; price: number }>;
  product_variants: ProductVariant[];
}

interface RecommendedProduct {
  id: string;
  slug: string;
  title: string;
  price: number;
  images: string[];
  average_rating: number;
}

interface ProductDetailClientProps {
  product: Product;
  initialRatings: Rating[];
  initialRecommendations: RecommendedProduct[];
  categoryPath: { id: string; title: string }[];
}

export default function ProductDetailClient({
  product,
  initialRatings,
  initialRecommendations,
  categoryPath,
}: ProductDetailClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const pathname = usePathname();
  const trackProduct = useTrackProduct();

  const requiresVariant = hasVariantOptions(product);
  const hasOnlyColors =
    product.colors?.length > 0 &&
    (!product.sizes || product.sizes.length === 0);
  const hasOnlySizes =
    product.sizes?.length > 0 &&
    (!product.colors || product.colors.length === 0);

  // State
  const [selectedColor, setSelectedColor] = useState<string | null>(
    product.colors?.[0] || null,
  );
  const [selectedSize, setSelectedSize] = useState<{
    name: string;
    price: number;
  } | null>(hasOnlySizes ? product.sizes?.[0] || null : null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    () => {
      if (product.product_variants.length > 0) {
        const firstColor = product.colors?.[0];
        const firstSize = product.sizes?.[0]?.name;
        if (firstColor && firstSize) {
          return (
            product.product_variants.find(
              (v) => v.color === firstColor && v.size === firstSize,
            ) || null
          );
        }
        return product.product_variants[0];
      }
      return null;
    },
  );
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);

  // Ratings state
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [userRating, setUserRating] = useState<Rating | null>(null);
  const [loadingRatings, setLoadingRatings] = useState(true);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRating, setEditingRating] = useState<Rating | null>(null);
  const [deletingRating, setDeletingRating] = useState<Rating | null>(null);
  const [averageRating, setAverageRating] = useState(
    product.average_rating || 0,
  );
  const [ratingFilter, setRatingFilter] = useState<"recent" | "highest">(
    "recent",
  );

  // Recommended products
  const [recommended, setRecommended] = useState<RecommendedProduct[]>([]);
  const [loadingRecommended, setLoadingRecommended] = useState(true);

  // Track product view on mount
  useEffect(() => {
    trackProduct(product.id, "view");
    fetchRatings();
    fetchRecommended();
  }, []);

  const fetchRatings = async () => {
    try {
      setLoadingRatings(true);
      const res = await fetch(`/api/products/${product.id}/ratings`);
      const data = await res.json();
      if (res.ok) {
        setRatings(data.ratings || []);
        setUserRating(data.userRating || null);
        const allRatings = data.ratings || [];
        if (allRatings.length > 0) {
          const avg =
            allRatings.reduce((acc: number, r: Rating) => acc + r.rating, 0) /
            allRatings.length;
          setAverageRating(avg);
        }
      } else {
        toast.error(data.error || "Failed to load ratings");
      }
    } catch (error) {
      toast.error("Failed to load ratings");
    } finally {
      setLoadingRatings(false);
    }
  };

  function useMediaQuery(query: string) {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
      const media = window.matchMedia(query);
      if (media.matches !== matches) {
        setMatches(media.matches);
      }
      const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }, [matches, query]);

    return matches;
  }

  const isLargeScreen = useMediaQuery("(min-width: 1024px)");

  const fetchRecommended = async () => {
    try {
      setLoadingRecommended(true);
      const res = await fetch(
        `/api/products/recommended?productId=${product.id}&limit=6`,
      );
      const data = await res.json();
      if (res.ok) {
        setRecommended(data.products || []);
      }
    } catch (error) {
      console.error("Failed to fetch recommended:", error);
    } finally {
      setLoadingRecommended(false);
    }
  };

  const displayedRecommended = isLargeScreen
    ? recommended.slice(0, 5)
    : recommended;

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

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Please login to add items to cart");
      return;
    }

    // Determine if a valid selection has been made
    let canAdd = true;
    if (requiresVariant) {
      if (hasOnlyColors && !selectedColor) canAdd = false;
      else if (hasOnlySizes && !selectedSize) canAdd = false;
      else if (!hasOnlyColors && !hasOnlySizes && !selectedVariant)
        canAdd = false;
    }

    if (!canAdd) {
      toast.error("Please select all required options");
      return;
    }

    // Build variant info for cart display
    let variantData: { color?: string; size?: string; unit?: string } | null =
      null;
    if (hasOnlyColors && selectedColor) {
      variantData = { color: selectedColor };
    } else if (hasOnlySizes && selectedSize) {
      variantData = { size: selectedSize.name };
    } else if (selectedVariant) {
      variantData = {
        color: selectedVariant.color || undefined,
        size: selectedVariant.size || undefined,
        unit: selectedVariant.unit || undefined,
      };
    }

    const price =
      selectedVariant?.price ?? selectedSize?.price ?? product.price;

    try {
      const buttonRect = document
        .getElementById("add-to-cart-btn")
        ?.getBoundingClientRect();
      if (buttonRect) createCartAnimation(buttonRect);

      trackProduct(product.id, "add_to_cart");

      // Pass variant details along with cart addition
      await addToCart({
        productId: product.id,
        variantId: selectedVariant?.id || null,
        quantity,
        price,
        // Extend the addToCart function to accept variantDetails if your cart context supports it
        // Otherwise, the cart API should be modified to handle it. For now, we rely on variantId.
        // If variantId is null, the cart may not show variant info. To fix, we need to adjust cart context.
        // We'll assume the cart context/API can accept a variant object.
        // @ts-ignore - passing extra data for single-dimension variants
        selectedOptions: variantData,
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to add to cart");
    }
  };

  // Determine if add button should be disabled
  const isAddDisabled = (() => {
    if (!requiresVariant) return false;
    if (hasOnlyColors) return !selectedColor;
    if (hasOnlySizes) return !selectedSize;
    return !selectedVariant;
  })();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const { left, top, width, height } =
      imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPosition({ x, y });
  };

  const handleSubmitRating = async () => {
    if (!user) {
      toast.error("Please login to submit a review");
      return;
    }
    if (selectedRating === 0) {
      toast.error("Please select a rating");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/products/${product.id}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: selectedRating,
          review: reviewText.trim() || null,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit review");
      }
      await fetchRatings();
      setSelectedRating(0);
      setReviewText("");
      toast.success("Review submitted! Thank you.");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRating = async () => {
    if (!editingRating) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/products/${product.id}/ratings/${editingRating.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating: selectedRating,
            review: reviewText.trim() || null,
          }),
        },
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update review");
      }
      await fetchRatings();
      setEditingRating(null);
      setSelectedRating(0);
      setReviewText("");
      toast.success("Review updated! Thank you.");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRating = async () => {
    if (!deletingRating) return;
    try {
      const response = await fetch(
        `/api/products/${product.id}/ratings/${deletingRating.id}`,
        {
          method: "DELETE",
        },
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete review");
      }
      await fetchRatings();
      setDeletingRating(null);
      toast.success("Review deleted successfully!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const sortedRatings = [...ratings].sort((a, b) => {
    if (ratingFilter === "recent") {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else {
      return b.rating - a.rating;
    }
  });

  const getDisplayPrice = () => {
    if (selectedVariant) return selectedVariant.price;
    if (hasOnlySizes && selectedSize) return selectedSize.price;
    return product.price;
  };

  const getUserInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const renderStars = (
    rating: number,
    interactive = false,
    size: "sm" | "md" | "lg" = "md",
  ) => {
    const starSize = { sm: "h-3 w-3", md: "h-4 w-4", lg: "h-5 w-5" }[size];
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={interactive ? () => setSelectedRating(star) : undefined}
            onMouseEnter={interactive ? () => setHoverRating(star) : undefined}
            onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
            disabled={!interactive}
            className={`${interactive ? "cursor-pointer" : "cursor-default"} focus:outline-none transition-transform ${interactive && "hover:scale-110"}`}
          >
            <Star
              className={`${starSize} ${
                star <= (interactive ? hoverRating || selectedRating : rating)
                  ? "fill-[#f73a00] text-[#f73a00]"
                  : "fill-gray-200 text-gray-200"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const descriptionItems = product.description
    .split("\n")
    .filter((line) => line.trim() !== "");

  useEffect(() => {
    const productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      description: product.description,
      image: product.images[0],
      offers: {
        "@type": "Offer",
        price: product.price,
        priceCurrency: "ETB",
        availability: "https://schema.org/InStock",
        seller: {
          "@type": "Organization",
          name: "AmbaStore",
        },
      },
      aggregateRating:
        averageRating > 0 && ratings.length > 0
          ? {
              "@type": "AggregateRating",
              ratingValue: averageRating,
              reviewCount: ratings.length,
            }
          : undefined,
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(productSchema);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [product, averageRating, ratings]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-4 sm:mb-8 overflow-x-auto pb-2">
          <Link
            href="/"
            className="hover:text-[#f73a00] whitespace-nowrap transition-colors"
          >
            Home
          </Link>
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
          <Link
            href="/products"
            className="hover:text-[#f73a00] whitespace-nowrap transition-colors"
          >
            Products
          </Link>
          {categoryPath.length > 0 && (
            <>
              {categoryPath.map((cat) => (
                <Fragment key={cat.id}>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                  <Link
                    href={`/products?category=${cat.id}`}
                    className="hover:text-[#f73a00] whitespace-nowrap transition-colors"
                  >
                    {cat.title}
                  </Link>
                </Fragment>
              ))}
            </>
          )}
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
          <span className="text-gray-900 font-medium truncate">
            {product.title}
          </span>
        </nav>

        {/* Main product section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Left: Image gallery */}
          <div className="flex flex-col lg:flex-row lg:gap-4">
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:max-h-[600px] order-2 lg:order-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === idx
                      ? "border-[#f73a00]"
                      : "border-transparent hover:border-gray-300"
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
            <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden lg:flex-1 order-1 lg:order-2">
              <button
                onClick={() => router.back()}
                className="absolute top-3 left-3 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow-md backdrop-blur-sm transition-all group"
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4 text-gray-700 group-hover:text-[#f73a00]" />
              </button>
              <div
                ref={imageRef}
                className="w-full h-full cursor-zoom-in"
                onMouseEnter={() => setIsImageZoomed(true)}
                onMouseLeave={() => setIsImageZoomed(false)}
                onMouseMove={handleMouseMove}
              >
                <img
                  src={product.images[selectedImage] || "/placeholder.jpg"}
                  alt={product.title}
                  className={`w-full h-full object-contain transition-transform duration-200 ${
                    isImageZoomed ? "scale-150" : "scale-100"
                  }`}
                  style={
                    isImageZoomed
                      ? {
                          transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                        }
                      : {}
                  }
                />
              </div>
            </div>
          </div>

          {/* Right: Product info */}
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {product.title}
              </h1>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {renderStars(averageRating, false, "lg")}
                  </div>
                  <span className="text-base font-semibold text-gray-900">
                    {averageRating.toFixed(1)}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      if (!isWishlisted) {
                        trackProduct(product.id, "add_to_wishlist");
                      }
                      setIsWishlisted(!isWishlisted);
                    }}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all"
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        isWishlisted
                          ? "fill-[#f73a00] text-[#f73a00]"
                          : "text-gray-600"
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => {
                      navigator
                        .share?.({
                          title: product.title,
                          text: product.description,
                          url: window.location.href,
                        })
                        .catch(() => {
                          navigator.clipboard.writeText(window.location.href);
                          toast.success("Link copied to clipboard!");
                        });
                    }}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all"
                  >
                    <Share2 className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            <div className="border-y border-gray-200 py-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Br {getDisplayPrice().toLocaleString("en-US")}
                </span>
                {requiresVariant && (
                  <span className="text-sm text-gray-500">
                    {selectedVariant || selectedColor || selectedSize
                      ? "Selected option"
                      : "From"}
                  </span>
                )}
              </div>
            </div>

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Color
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        setSelectedColor(color);
                        if (hasOnlyColors) {
                          // No sizes, we are done
                          setSelectedSize(null);
                          setSelectedVariant(null);
                        } else {
                          // Try to find a variant with this color and current size
                          const currentSize =
                            selectedSize?.name || product.sizes?.[0]?.name;
                          const variant = product.product_variants.find(
                            (v) => v.color === color && v.size === currentSize,
                          );
                          setSelectedVariant(variant || null);
                        }
                      }}
                      className={`px-4 py-2 border rounded-md transition-all ${
                        selectedColor === color
                          ? "border-[#f73a00] bg-orange-50 text-[#f73a00]"
                          : "border-gray-200 hover:border-orange-200 text-gray-800"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => {
                    const variant = !hasOnlySizes
                      ? product.product_variants.find(
                          (v) =>
                            v.color === selectedColor && v.size === size.name,
                        )
                      : null;
                    const displayPrice =
                      size.price > 0 ? size.price : product.price;
                    return (
                      <button
                        key={size.name}
                        onClick={() => {
                          setSelectedSize(size);
                          if (hasOnlySizes) {
                            setSelectedVariant(null);
                          } else if (selectedColor) {
                            const v = product.product_variants.find(
                              (v) =>
                                v.color === selectedColor &&
                                v.size === size.name,
                            );
                            setSelectedVariant(v || null);
                          }
                        }}
                        className={`px-3 py-1 border rounded-md transition-all ${
                          (hasOnlySizes && selectedSize?.name === size.name) ||
                          (selectedVariant?.size === size.name &&
                            selectedVariant?.color === selectedColor)
                            ? "border-[#f73a00] bg-orange-50 text-[#f73a00]"
                            : "border-gray-200 hover:border-orange-200 text-gray-800"
                        }`}
                      >
                        <div className="font-medium">{size.name}</div>
                        <div className="text-sm">
                          Br {displayPrice.toLocaleString("en-US")}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Quantity
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-gray-200 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-gray-600 hover:text-[#f73a00] transition-colors"
                  >
                    -
                  </button>
                  <span className="px-3 py-2 text-gray-900 font-medium min-w-[50px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 text-gray-600 hover:text-[#f73a00] transition-colors"
                  >
                    +
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  Total: Br{" "}
                  {(quantity * getDisplayPrice()).toLocaleString("en-US")}
                </div>
              </div>
            </div>

            {/* Add to cart button */}
            <div className="sticky bottom-4 z-10 lg:static lg:bottom-auto">
              <Button
                id="add-to-cart-btn"
                onClick={handleAddToCart}
                disabled={isAddDisabled}
                className="w-full py-5 text-base sm:text-lg bg-gradient-to-r from-[#f73a00] to-[#f73a00] hover:from-[#f73a00] hover:to-orange-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
            </div>

            {/* Shipping info */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <Truck className="h-5 w-5 mx-auto mb-1 text-[#f73a00]" />
                <p className="text-xs text-gray-600">Free Shipping</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <RotateCcw className="h-5 w-5 mx-auto mb-1 text-[#f73a00]" />
                <p className="text-xs text-gray-600">Return Available</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger
                value="description"
                className="text-sm text-gray-800 data-[state=active]:bg-white data-[state=active]:text-[#f73a00] dark:data-[state=active]:text-[#f73a00] rounded-md"
              >
                <Info className="h-4 w-4 mr-2" /> Description
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="text-sm text-gray-800 data-[state=active]:bg-white data-[state=active]:text-[#f73a00] dark:data-[state=active]:text-[#f73a00] rounded-md"
              >
                <MessageCircle className="h-4 w-4 mr-2" /> Reviews
              </TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                {descriptionItems.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-2 text-gray-600">
                    {descriptionItems.map((item, idx) => (
                      <li
                        key={idx}
                        className="text-sm sm:text-base leading-relaxed"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600 text-sm sm:text-base">
                    {product.description}
                  </p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="reviews" className="space-y-4">
              {/* Reviews section - unchanged from original */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-gray-900">
                    {averageRating.toFixed(1)}
                  </span>
                  <div>
                    <div className="flex">
                      {renderStars(averageRating, false, "lg")}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Average rating</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={() => setRatingFilter("recent")}
                    className={`text-xs ${ratingFilter === "recent" ? "bg-[#f73a00] hover:bg-[#f73a00]/90 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}`}
                  >
                    Recent
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setRatingFilter("highest")}
                    className={`text-xs ${ratingFilter === "highest" ? "bg-[#f73a00] hover:bg-[#f73a00]/90 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}`}
                  >
                    Highest Rated
                  </Button>
                </div>
              </div>
              {!user ? (
                <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                  <p className="text-gray-600 text-sm mb-2">
                    Sign in to write a review
                  </p>
                  <Link
                    href={`/login?redirectTo=${encodeURIComponent(pathname)}`}
                  >
                    <Button size="sm" className="bg-[#f73a00] text-white">
                      Sign In
                    </Button>
                  </Link>
                </div>
              ) : !userRating ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full text-white bg-[#f73a00] hover:bg-[#f73a00]/90 text-sm">
                      Write a Review
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Write a Review</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Your Rating *
                        </label>
                        {renderStars(selectedRating, true, "lg")}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Your Review (Optional)
                        </label>
                        <Textarea
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          maxLength={500}
                          rows={4}
                          className="resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {reviewText.length}/500
                        </p>
                      </div>
                      <div className="flex justify-end gap-2">
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Cancel
                          </Button>
                        </DialogTrigger>
                        <Button
                          onClick={handleSubmitRating}
                          disabled={isSubmitting || selectedRating === 0}
                          size="sm"
                          className="bg-[#f73a00]"
                        >
                          {isSubmitting ? "Submitting..." : "Submit"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : null}
              {userRating && (
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">Your Review</h4>
                    <div className="flex gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Edit Your Review</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-2">
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Your Rating *
                              </label>
                              {renderStars(selectedRating, true, "lg")}
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Your Review
                              </label>
                              <Textarea
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                maxLength={500}
                                rows={4}
                                className="resize-none"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingRating(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleUpdateRating}
                                disabled={isSubmitting || selectedRating === 0}
                                size="sm"
                                className="bg-[#f73a00]"
                              >
                                {isSubmitting ? "Updating..." : "Update"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeletingRating(userRating)}
                        className="h-8 px-2 text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {renderStars(userRating.rating, false, "lg")}
                  </div>
                  {userRating.review && (
                    <p className="text-sm text-gray-700">{userRating.review}</p>
                  )}
                </div>
              )}
              {loadingRatings ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[#f73a00]" />
                </div>
              ) : sortedRatings.length > 0 ? (
                <div className="space-y-4">
                  {sortedRatings.map((rating) => (
                    <div
                      key={rating.id}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-[#f73a00] text-white text-xs">
                              {getUserInitials(rating.users.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm text-gray-900">
                              {rating.users.name}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(
                                new Date(rating.created_at),
                                {
                                  addSuffix: true,
                                },
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex">
                          {renderStars(rating.rating, false, "lg")}
                        </div>
                      </div>
                      {rating.review && (
                        <p className="text-sm text-gray-700 mt-1">
                          {rating.review}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  No reviews yet. Be the first to review!
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* You May Also Like */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            You May Also Like
          </h2>
          {loadingRecommended ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#f73a00]" />
            </div>
          ) : displayedRecommended.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {displayedRecommended.map((rec) => (
                <Link
                  key={rec.id}
                  href={`/products/${rec.slug}`}
                  className="group"
                >
                  <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all h-full">
                    <div className="aspect-square bg-gray-100">
                      <img
                        src={rec.images[0] || "/placeholder.jpg"}
                        alt={rec.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-2">
                      <h3 className="font-medium text-gray-900 text-sm truncate">
                        {rec.title}
                      </h3>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-bold text-[#f73a00]">
                          Br {rec.price.toLocaleString("en-US")}
                        </span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-[#f73a00] text-[#f73a00]" />
                          <span className="text-xs text-gray-600">
                            {rec.average_rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              No recommendations available.
            </p>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!deletingRating}
          onOpenChange={() => setDeletingRating(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Review?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteRating}
                className="bg-red-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div
          id="cart-animation-element"
          className="fixed z-[100] pointer-events-none"
        />
      </div>
    </div>
  );
}
