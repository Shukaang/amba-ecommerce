"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { useCart } from "@/lib/cart/context";
import { MapPin, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
  });

  // Pre-fill with user's info if available (as suggestions only)
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.name || "",
        phone: user.phone || "",
        address: user.address || "",
      }));
    }
  }, [user]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      toast.error("Please login to checkout");
      router.push("/login");
    }
  }, [user, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (!formData.fullName || !formData.phone || !formData.address) {
        toast.error("Please fill all required fields");
        setLoading(false);
        return;
      }

      // Prepare shipping info
      const shippingInfo = `
Full Name: ${formData.fullName}
Phone: ${formData.phone}
Address: ${formData.address}
      `.trim();

      // Create order
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingInfo,
          totalPrice: total,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to place order");
      }

      // Clear cart
      await clearCart();

      // Show success
      setOrderId(data.order.id);
      setOrderPlaced(true);

      toast.success("Order placed successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (items.length === 0 && !orderPlaced) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Your cart is empty
          </h1>
          <p className="text-gray-600 mb-6">
            Add some products to your cart before checkout.
          </p>
          <Button onClick={() => router.push("/products")}>
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto text-center">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Order Submitted!
          </h1>
          <p className="text-gray-600 mb-6">
            Thank you for your order. Your order is{" "}
            <span className="font-semibold text-yellow-600">PENDING</span>{" "}
            confirmation. We'll contact you soon with your order number once
            it's confirmed.
          </p>
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="text-sm text-gray-500 mb-2">Order Reference</div>
            <div className="text-xl font-mono text-gray-900 mb-4">
              ID: {orderId.substring(0, 8)}...
            </div>
            <div className="text-sm text-gray-600">
              • Your order will get an order number (ORD-XXXX-XXXX) once
              confirmed
            </div>
            <div className="text-sm text-gray-600 mt-2">
              • We'll contact you via phone for confirmation
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => router.push("/orders")}>
              Track My Orders
            </Button>
            <Button variant="outline" onClick={() => router.push("/products")}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => router.push("/cart")}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Cart
      </Button>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shipping Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Shipping Information
                </h2>
                <p className="text-sm text-gray-600">
                  Enter your delivery details
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    type="tel"
                    required
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  required
                  placeholder="Street address, apartment, suite, etc."
                />
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Delivery Information:</p>
                  <p>• Free delivery within Addis Ababa</p>
                  <p>• EMS shipping fee applies to other cities</p>
                  <p>• Delivery time: 1-3 business days in Addis Ababa</p>
                  <p>• 3-7 business days for other cities</p>
                </div>
              </div>

              <div className="pt-6 border-t">
                <div className="text-sm text-gray-600">
                  <p className="mb-2">
                    By placing this order, you agree to our terms and
                    conditions.
                  </p>
                  <p>
                    We'll contact you via phone to confirm your order and
                    delivery details.
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Order Summary
            </h2>

            <div className="space-y-3 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div>
                    <div className="font-medium text-gray-900">
                      {item.product.title}
                      {item.quantity > 1 && ` × ${item.quantity}`}
                    </div>
                    {item.variant && (
                      <div className="text-gray-500 text-xs">
                        {[
                          item.variant.color,
                          item.variant.size,
                          item.variant.unit,
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </div>
                    )}
                  </div>
                  <div className="font-medium">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}

              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    <>
                      <p className="text-green-500 text-sm">Free</p>
                      <div className="text-xs text-gray-500">
                        Within Addis Ababa
                      </div>
                    </>
                    <>
                      <p className="text-amber-500 text-sm">EMS Fee</p>
                      <div className="text-xs text-gray-500">
                        For other cities
                      </div>
                    </>
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
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={loading || items.length === 0}
            >
              {loading ? "Placing Order..." : "Place Order"}
            </Button>

            <div className="mt-6 pt-6 border-t">
              <div className="text-sm text-gray-600">
                <p className="mb-2">Payment Information:</p>
                <p>• Cash on delivery only</p>
                <p>• No online payment required</p>
                <p>• You'll pay when you receive your order</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
