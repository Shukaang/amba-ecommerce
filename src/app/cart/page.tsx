"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { useCart } from "@/lib/cart/context";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Package,
  Truck,
  Shield,
  CreditCard,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import Link from "next/link";

export default function CartPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    items,
    total,
    loading: cartLoading,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const isLoading = authLoading || cartLoading;

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      toast.error("Please login to view your cart");
      const returnUrl = encodeURIComponent(window.location.pathname);
      router.push(`/login?redirectTo=${returnUrl}`);
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#f73a00] mx-auto mb-4" />
          <p className="text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center max-w-md mx-auto">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-8 rounded-2xl mb-6 shadow-sm">
              <ShoppingCart className="h-16 w-16 text-[#f73a00] mx-auto" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Your cart is empty
            </h1>
            <p className="text-gray-600 mb-8">
              Add some products to your cart and they will appear here.
            </p>
            <Button
              onClick={() => router.push("/products")}
              className="bg-gradient-to-r from-[#f73a00] to-[#f73a00] hover:from-[#f73a00] hover:to-[#f73a00] text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Browse Products
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Shopping Cart
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Review and manage your items before checkout
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                    Cart Items (
                    {items.reduce((sum, item) => sum + item.quantity, 0)})
                  </h2>
                  <Button
                    variant="ghost"
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl self-start sm:self-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Cart
                  </Button>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {items.map((item) => {
                  // Build variant display string
                  const variantParts = [];
                  if (item.variant?.color)
                    variantParts.push(`Color: ${item.variant.color}`);
                  if (item.variant?.size)
                    variantParts.push(`Size: ${item.variant.size}`);
                  if (item.variant?.unit)
                    variantParts.push(`Unit: ${item.variant.unit}`);
                  const variantDisplay = variantParts.join(" • ");

                  // Get product slug - MUST exist in database
                  const productSlug = item.product.slug;

                  return (
                    <div
                      key={item.id}
                      className="p-4 sm:p-6 hover:bg-gray-50/80 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        {/* Product Image - Link uses slug only */}
                        <div className="sm:w-28 lg:w-32 h-28 sm:h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                          {item.product.images &&
                          item.product.images.length > 0 ? (
                            <Link href={`/products/${productSlug}`}>
                              <img
                                src={item.product.images[0]}
                                alt={item.product.title}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                            </Link>
                          ) : (
                            <Link href={`/products/${productSlug}`}>
                              <div className="w-full h-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors">
                                <Package className="h-8 w-8 text-gray-400" />
                              </div>
                            </Link>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                            <div>
                              {/* Product title links to slug only */}
                              <Link href={`/products/${productSlug}`}>
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 hover:text-[#f73a00] transition-colors">
                                  {item.product.title}
                                </h3>
                              </Link>
                              {variantDisplay && (
                                <Badge
                                  variant="outline"
                                  className="mb-2 bg-[#f73a00]/5 text-[#f73a00] border-[#f73a00]/20 text-xs"
                                >
                                  {variantDisplay}
                                </Badge>
                              )}
                              <div className="text-sm text-gray-500 mb-3">
                                Unit Price: Br
                                {item.price.toLocaleString("en-US")}
                              </div>
                            </div>
                            <div className="text-left sm:text-right">
                              <div className="text-lg font-bold text-gray-900">
                                Br
                                {(item.price * item.quantity).toLocaleString(
                                  "en-US",
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center border border-gray-200 rounded-lg bg-white shadow-sm">
                                <button
                                  onClick={() =>
                                    updateQuantity(item.id, item.quantity - 1)
                                  }
                                  className="px-2 py-1 text-gray-600 hover:text-[#f73a00] transition-colors disabled:opacity-50 rounded-l-lg"
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="px-3 py-1 text-gray-900 font-medium min-w-[36px] text-center text-sm">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateQuantity(item.id, item.quantity + 1)
                                  }
                                  className="px-2 py-1 text-gray-600 hover:text-[#f73a00] transition-colors rounded-r-lg"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg h-8 px-2 text-xs sm:text-sm"
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                <span className="hidden sm:inline">Remove</span>
                                <span className="sm:hidden">Remove</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 sm:p-6 sticky top-24 hover:shadow-lg transition-shadow">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-5">
                Order Summary
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm sm:text-base text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">
                    ETB {total.toLocaleString("en-US")}
                  </span>
                </div>
                <div className="flex justify-between text-sm sm:text-base text-gray-600">
                  <span>Shipping</span>
                  <span className="text-sm text-green-600 font-medium">
                    {total > 0 ? "Free (Addis)" : "ETB 0.00"}
                  </span>
                </div>
                <Separator className="bg-gray-200" />
                <div className="flex justify-between">
                  <span className="text-base sm:text-lg font-semibold text-gray-900">
                    Total
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-[#f73a00]">
                    ETB {total.toLocaleString("en-US")}
                  </span>
                </div>
              </div>

              <Button
                className="w-full bg-[#f73a00] hover:bg-[#f73a00]/90 text-white py-5 sm:py-6 text-base sm:text-lg rounded-xl shadow-lg hover:shadow-xl transition-all mb-3"
                onClick={() => router.push("/checkout")}
                disabled={items.length === 0}
              >
                Proceed to Checkout
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>

              <Button
                variant="outline"
                className="w-full border-2 border-gray-200 hover:bg-gray-50 rounded-xl py-4 sm:py-5 text-sm sm:text-base"
                onClick={() => router.push("/products")}
              >
                Continue Shopping
              </Button>

              {/* Features */}
              <div className="mt-6 pt-5 border-t border-gray-100">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-600">
                    <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-[#f73a00] flex-shrink-0" />
                    <span>Free delivery within Addis Ababa</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-600">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-[#f73a00] flex-shrink-0" />
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-600">
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-[#f73a00] flex-shrink-0" />
                    <span>Pay half now, half on delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
