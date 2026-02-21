"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { useCart } from "@/lib/cart/context";
import {
  Star,
  ShoppingCart,
  Check,
  Heart,
  Share2,
  ChevronRight,
  Clock,
  Edit2,
  Trash2,
  Users,
  Shield,
  Truck,
  RotateCcw,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  title: string;
  description: string;
  price: number;
  average_rating: number;
  images: string[];
  categories: Category | null;
  product_variants: ProductVariant[];
}

interface RecommendedProduct {
  id: string;
  title: string;
  price: number;
  images: string[];
  average_rating: number;
}

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({
  product,
}: ProductDetailClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();

  // Product state
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    () =>
      product.product_variants.length > 0 ? product.product_variants[0] : null,
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

  // Fetch ratings on mount
  useEffect(() => {
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

  const fetchRecommended = async () => {
    try {
      setLoadingRecommended(true);
      const res = await fetch(
        `/api/products/recommended?productId=${product.id}&limit=5`,
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

  // Cart animation
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

    const cartIcon = document.querySelector(
      'a[href="/cart"]',
    ) as HTMLElement | null;

    // 🔥 ALWAYS RETURN A REAL DOMRect
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
      router.push("/login");
      return;
    }

    try {
      const buttonRect = document
        .getElementById("add-to-cart-btn")
        ?.getBoundingClientRect();
      if (buttonRect) createCartAnimation(buttonRect);

      await addToCart({
        productId: product.id,
        variantId: selectedVariant?.id || null,
        quantity,
        price: selectedVariant?.price || product.price,
      });

      toast.success("Added to cart!");
    } catch (error: any) {
      toast.error(error.message || "Failed to add to cart");
    }
  };

  // Zoom handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const { left, top, width, height } =
      imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPosition({ x, y });
  };

  // Rating handlers
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
      toast.success("Review submitted! It will appear after moderation.");
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
      toast.success("Review updated! It will be re-moderated.");
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

  // Filter ratings
  const sortedRatings = [...ratings].sort((a, b) => {
    if (ratingFilter === "recent") {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else {
      return b.rating - a.rating;
    }
  });

  const getDisplayPrice = () => selectedVariant?.price || product.price;
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-[#f73a00] transition-colors">
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link
            href="/products"
            className="hover:text-[#f73a00] transition-colors"
          >
            Products
          </Link>
          {product.categories && (
            <>
              <ChevronRight className="h-4 w-4" />
              <Link
                href={`/products?category=${product.categories.id}`}
                className="hover:text-[#f73a00] transition-colors"
              >
                {product.categories.title}
              </Link>
            </>
          )}
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium truncate">
            {product.title}
          </span>
        </nav>

        {/* Main product section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Image gallery with vertical thumbnails */}
          <div className="flex flex-col-reverse lg:flex-row gap-4">
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:max-h-[600px]">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
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
            <div className="relative flex-1">
              {/* Back button positioned at the top of the image */}
              <button
                onClick={() => router.back()}
                className="absolute top-4 left-4 z-10 p-2.5 rounded-full bg-white/90 hover:bg-white shadow-lg backdrop-blur-sm transition-all group"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700 group-hover:text-[#f73a00] transition-colors" />
              </button>

              <div
                ref={imageRef}
                className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden cursor-zoom-in"
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
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                {product.title}
              </h1>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {renderStars(averageRating, false, "lg")}
                    </div>
                    <span className="text-lg font-semibold text-gray-900">
                      {averageRating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-gray-500">
                    ({ratings.length}{" "}
                    {ratings.length === 1 ? "review" : "reviews"})
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all group"
                  >
                    <Heart
                      className={`h-5 w-5 transition-colors ${
                        isWishlisted
                          ? "fill-[#f73a00] text-[#f73a00]"
                          : "text-gray-600 group-hover:text-[#f73a00]"
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
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all group"
                  >
                    <Share2 className="h-5 w-5 text-gray-600 group-hover:text-[#f73a00]" />
                  </button>
                </div>
              </div>
            </div>

            <div className="border-y border-gray-200 py-6">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-gray-900">
                  ${getDisplayPrice().toFixed(2)}
                </span>
                {product.product_variants.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {selectedVariant ? "Selected variant" : "From"}
                  </span>
                )}
              </div>
            </div>

            {product.product_variants.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Available Variants
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {product.product_variants.map((variant) => {
                    const isSelected = selectedVariant?.id === variant.id;
                    const variantName = [
                      variant.color,
                      variant.size,
                      variant.unit,
                    ]
                      .filter(Boolean)
                      .join(" • ");
                    return (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        className={`p-4 border-2 rounded-xl text-left transition-all ${
                          isSelected
                            ? "border-[#f73a00] bg-orange-50"
                            : "border-gray-200 hover:border-orange-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              {variantName || "Standard"}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              ${variant.price.toFixed(2)}
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="h-5 w-5 text-[#f73a00]" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Quantity
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-gray-200 rounded-xl">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 text-gray-600 hover:text-[#f73a00] transition-colors"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-gray-900 font-medium min-w-[60px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-2 text-gray-600 hover:text-[#f73a00] transition-colors"
                  >
                    +
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  Total: ${(quantity * getDisplayPrice()).toFixed(2)}
                </div>
              </div>
            </div>

            <Button
              id="add-to-cart-btn"
              onClick={handleAddToCart}
              className="w-full py-6 text-lg bg-gradient-to-r from-[#f73a00] to-[#f73a00] hover:from-[#f73a00] hover:to-orange-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
              size="lg"
              disabled={product.product_variants.length > 0 && !selectedVariant}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>

            <div className="grid grid-cols-3 gap-4 pt-6">
              <div className="text-center">
                <Truck className="h-6 w-6 mx-auto mb-2 text-[#f73a00]" />
                <p className="text-xs text-gray-600">Free Shipping</p>
              </div>
              <div className="text-center">
                <Shield className="h-6 w-6 mx-auto mb-2 text-[#f73a00]" />
                <p className="text-xs text-gray-600">2 Year Warranty</p>
              </div>
              <div className="text-center">
                <RotateCcw className="h-6 w-6 mx-auto mb-2 text-[#f73a00]" />
                <p className="text-xs text-gray-600">30 Day Returns</p>
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 whitespace-pre-line leading-relaxed">
              {product.description}
            </p>
          </div>
        </div>

        {/* Ratings Section - Two columns */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-6 w-6 text-[#f73a00]" />
              Customer Reviews
            </h2>
            {/* Write Review button (for logged-in users without a rating) */}
            {user && !userRating && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-[#f73a00] hover:bg-[#f73a00]/90">
                    Write a Review
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">
                      Write a Review
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div>
                      <label className="block text-sm font-medium mb-3">
                        Your Rating <span className="text-[#f73a00]">*</span>
                      </label>
                      {renderStars(selectedRating, true, "lg")}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-3">
                        Your Review (Optional)
                      </label>
                      <Textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Share your thoughts..."
                        maxLength={500}
                        rows={4}
                        className="resize-none rounded-xl"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        {reviewText.length}/500 characters
                      </p>
                    </div>
                    <div className="flex justify-end gap-3">
                      <DialogTrigger asChild>
                        <Button variant="outline" className="rounded-xl">
                          Cancel
                        </Button>
                      </DialogTrigger>
                      <Button
                        onClick={handleSubmitRating}
                        disabled={isSubmitting || selectedRating === 0}
                        className="bg-gradient-to-r from-[#f73a00] to-[#f73a00] hover:from-[#f73a00] hover:to-orange-700 text-white rounded-xl"
                      >
                        {isSubmitting ? "Submitting..." : "Submit Review"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left column – rating summary and filters */}
            <div className="lg:w-1/3 space-y-4">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-5xl font-bold text-gray-900">
                    {averageRating.toFixed(1)}
                  </span>
                  <div className="space-y-1">
                    <div className="flex">
                      {renderStars(averageRating, false, "lg")}
                    </div>
                    <p className="text-sm text-gray-500">
                      Based on {ratings.length} reviews
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => setRatingFilter("recent")}
                  className={
                    ratingFilter === "recent"
                      ? "bg-[#f73a00] hover:bg-[#f73a00]/90 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }
                >
                  Recent
                </Button>
                <Button
                  size="sm"
                  onClick={() => setRatingFilter("highest")}
                  className={
                    ratingFilter === "highest"
                      ? "bg-[#f73a00] hover:bg-[#f73a00]/90 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }
                >
                  Highest Rated
                </Button>
              </div>
            </div>

            {/* Right column – user rating (if exists) + reviews list */}
            <div className="lg:w-2/3 space-y-6">
              {/* User's own rating with edit/delete */}
              {userRating && (
                <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Your Review
                    </h3>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[#f73a00] border-[#fc8b69] hover:bg-[#ff825c]"
                            onClick={() => {
                              setEditingRating(userRating);
                              setSelectedRating(userRating.rating);
                              setReviewText(userRating.review || "");
                            }}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">
                              Edit Your Review
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-6 py-4">
                            <div>
                              <label className="block text-sm font-medium mb-3">
                                Your Rating{" "}
                                <span className="text-[#f73a00]">*</span>
                              </label>
                              {renderStars(selectedRating, true, "lg")}
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-3">
                                Your Review
                              </label>
                              <Textarea
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                maxLength={500}
                                rows={4}
                                className="resize-none rounded-xl"
                              />
                            </div>
                            <div className="flex justify-end gap-3">
                              <Button
                                variant="outline"
                                onClick={() => setEditingRating(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleUpdateRating}
                                disabled={isSubmitting || selectedRating === 0}
                                className="bg-[#f73a00] hover:bg-[#f73a00]/90"
                              >
                                {isSubmitting ? "Updating..." : "Update"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        onClick={() => setDeletingRating(userRating)}
                        className="rounded-lg text-white bg-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    {renderStars(userRating.rating, false, "lg")}
                    {!userRating.moderated && (
                      <Badge
                        variant="outline"
                        className="text-[#f73a00] border-[#f73a00]"
                      >
                        Pending Moderation
                      </Badge>
                    )}
                  </div>
                  {userRating.review && (
                    <p className="text-gray-700">{userRating.review}</p>
                  )}
                </div>
              )}

              {/* All reviews */}
              {loadingRatings ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#f73a00]" />
                </div>
              ) : sortedRatings.length > 0 ? (
                sortedRatings.map((rating) => (
                  <div
                    key={rating.id}
                    className="p-6 border border-gray-200 rounded-2xl"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 ring-2 ring-[#f73a00]/20">
                          <AvatarFallback className="bg-[#f73a00] text-white">
                            {getUserInitials(rating.users.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {rating.users.name}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(rating.created_at), {
                              addSuffix: true,
                            })}
                          </div>
                        </div>
                      </div>
                      {renderStars(rating.rating, false, "lg")}
                    </div>
                    {rating.review && (
                      <p className="text-gray-700">{rating.review}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500">
                  No reviews yet. Be the first to review!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* You May Also Like Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            You May Also Like
          </h2>
          {loadingRecommended ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#f73a00]" />
            </div>
          ) : recommended.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {recommended.map((rec) => (
                <Link
                  key={rec.id}
                  href={`/products/${rec.id}`}
                  className="group"
                >
                  <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all h-full">
                    <div className="aspect-square bg-gray-100">
                      <img
                        src={rec.images[0] || "/placeholder.jpg"}
                        alt={rec.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">
                        {rec.title}
                      </h3>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-base font-bold text-[#f73a00]">
                          ${rec.price.toFixed(2)}
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
            <p className="text-gray-500">No recommendations available.</p>
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
                This action cannot be undone. This will permanently delete your
                review.
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

        {/* Cart animation element */}
        <div
          id="cart-animation-element"
          className="fixed z-[100] pointer-events-none"
        />
      </div>
    </div>
  );
}
