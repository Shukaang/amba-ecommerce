"use client";

import React, { useEffect } from "react"; // Add React import
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { useCart } from "@/lib/cart/context";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, total, loading, updateQuantity, removeItem, clearCart } =
    useCart();

  // Redirect if not logged in
  useEffect(() => {
    // Changed from React.useEffect to useEffect
    if (!user && !loading) {
      toast.error("Please login to view your cart");
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading cart...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center max-w-md mx-auto">
          <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Your cart is empty
          </h1>
          <p className="text-gray-600 mb-6">
            Add some products to your cart and they will appear here.
          </p>
          <Button onClick={() => router.push("/products")}>
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Cart Items (
                  {items.reduce((sum, item) => sum + item.quantity, 0)})
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear Cart
                </Button>
              </div>
            </div>

            <div className="divide-y">
              {items.map((item) => (
                <div key={item.id} className="p-6">
                  <div className="flex items-start">
                    {/* Product Image */}
                    <div className="h-24 w-24 bg-gray-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                      {item.product.images && item.product.images.length > 0 ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.title}
                          className="h-full w-full object-cover rounded-lg"
                        />
                      ) : (
                        <ShoppingCart className="h-8 w-8 text-gray-400" />
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {item.product.title}
                          </h3>
                          {item.variant && (
                            <div className="mt-1 text-sm text-gray-500">
                              {item.variant.color && (
                                <span className="mr-3">
                                  Color: {item.variant.color}
                                </span>
                              )}
                              {item.variant.size && (
                                <span className="mr-3">
                                  Size: {item.variant.size}
                                </span>
                              )}
                              {item.variant.unit && (
                                <span>Unit: {item.variant.unit}</span>
                              )}
                            </div>
                          )}
                          <div className="mt-2 text-lg font-bold text-gray-900">
                            ${item.price.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center border rounded-lg">
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              className="px-3 py-1 text-gray-600 hover:text-gray-900"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="px-3 py-1 text-gray-900 font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              className="px-3 py-1 text-gray-600 hover:text-gray-900"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500">
                            ${item.price.toFixed(2)} each
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Order Summary
            </h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">
                  {total > 0 ? (
                    <>
                      Free within Addis Ababa
                      <div className="text-xs text-gray-500">
                        EMS fee for other locations
                      </div>
                    </>
                  ) : (
                    "$0.00"
                  )}
                </span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-lg font-semibold text-gray-900">
                  Total
                </span>
                <span className="text-2xl font-bold text-gray-900">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full"
                size="lg"
                onClick={() => router.push("/checkout")}
                disabled={items.length === 0}
              >
                Proceed to Checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/products")}
              >
                Continue Shopping
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t">
              <div className="text-sm text-gray-600">
                <p className="mb-2">• Free delivery within Addis Ababa</p>
                <p className="mb-2">
                  • EMS shipping fee applies to other locations
                </p>
                <p>• Registered users only for checkout</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
