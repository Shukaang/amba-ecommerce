"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { useCart } from "@/lib/cart/context";
import {
  MapPin,
  CheckCircle,
  ArrowLeft,
  Package,
  Truck,
  Shield,
  CreditCard,
  Clock,
  User,
  Phone,
  Home,
  Loader2,
  X,
  ChevronRight,
  ShoppingBag,
  PhoneCall,
  MapPinned,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Force dynamic rendering to avoid prerender issues
export const dynamic = "force-dynamic";

// Loading spinner component
function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
      <div className="text-center px-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#f73a00] mx-auto mb-4" />
        <p className="text-gray-600 text-sm sm:text-base">
          Loading checkout...
        </p>
      </div>
    </div>
  );
}

// Main checkout content component
function CheckoutContent() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { items, total, clearCart, loading: cartLoading } = useCart();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [orderTotal, setOrderTotal] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isLoading = authLoading || cartLoading;

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
  });

  // Handle mounting to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user && mounted) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.name || "",
        phone: user.phone || "",
        address: user.address || "",
      }));
    }
  }, [user, mounted]);

  // Handle redirect for non-authenticated users
  useEffect(() => {
    if (mounted && !isLoading && !user) {
      toast.error("Please login to checkout");
      const returnUrl = encodeURIComponent(window.location.pathname);
      router.push(`/login?redirectTo=${returnUrl}`);
    }
  }, [user, isLoading, router, mounted]);

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted || isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  if (items.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 sm:py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-orange-100 mb-4 sm:mb-6">
            <Package className="h-8 w-8 sm:h-10 sm:w-10 text-[#f73a00]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Your cart is empty
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
            Add some products to your cart before checkout.
          </p>
          <Button
            onClick={() => router.push("/products")}
            className="bg-[#f73a00] hover:bg-[#f73a00]/90 text-white rounded-xl px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg w-full sm:w-auto"
          >
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!formData.fullName || !formData.phone || !formData.address) {
        toast.error("Please fill all required fields");
        setSubmitting(false);
        return;
      }

      const shippingInfo = `Full Name: ${formData.fullName}
Phone: ${formData.phone}
Address: ${formData.address}`;

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingInfo,
          totalPrice: total,
          updateUserAddress: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place order");

      setOrderId(data.order.id);
      setOrderNumber(data.order.order_number || "Pending");
      setOrderTotal(data.order.total_price);
      setOrderPlaced(true);

      await clearCart();

      toast.success("Order placed successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  if (orderPlaced) {
    const halfAmount = orderTotal / 2;

    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white px-3">
        <div className="max-w-lg mx-auto">
          {/* Success Card - smaller, tighter */}
          <Card className="border-0 shadow-lg rounded-xl overflow-hidden bg-white">
            {/* Header with check - smaller */}
            <CardHeader className="bg-[#087f00] text-white rounded-t-xl p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-6 -mt-6" />
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-5 -mb-5" />

              <div className="relative">
                <div className="flex items-center justify-center mb-2">
                  <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm animate-pulse">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-center mb-1">
                  Order Submitted!
                </CardTitle>
                <CardDescription className="text-green-50 text-center text-sm">
                  Thank you for your purchase
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3 bg-white">
              {/* Status Banner - compact */}
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-[#f73a00]" />
                    <span className="font-medium text-gray-900 text-xs">
                      Order Status
                    </span>
                  </div>
                  <Badge className="bg-yellow-100 text-[#f73a00] px-2 py-0.5 text-xs font-medium">
                    PENDING
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  We'll contact you via phone shortly to confirm.
                </p>
              </div>

              {/* Order Details - two compact cards */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Receipt className="h-3.5 w-3.5 text-gray-500" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                      Ref
                    </span>
                  </div>
                  <p className="font-mono text-xs text-gray-900 break-all">
                    {orderId.substring(0, 10)}...
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <ShoppingBag className="h-3.5 w-3.5 text-gray-500" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                      Total
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    ETB {orderTotal.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Payment & Delivery Info - NEW */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 space-y-1.5">
                <div className="flex items-start gap-2">
                  <CreditCard className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-gray-900">
                      Pay half now
                    </p>
                    <p className="text-[11px] text-blue-800">
                      ETB {halfAmount.toLocaleString()} on delivery (50%)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Truck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-gray-900">
                      Delivery
                    </p>
                    <p className="text-[11px] text-blue-800">
                      Free in Addis Ababa • EMS fee for other cities
                    </p>
                  </div>
                </div>
              </div>

              {/* What happens next - compact */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-2 text-xs">
                  Next steps
                </h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 bg-white p-2 rounded border border-gray-100">
                    <div className="h-5 w-5 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                      <PhoneCall className="h-3 w-3 text-[#f73a00]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900">
                        Phone verification
                      </p>
                      <p className="text-[10px] text-gray-500">Within 24h</p>
                    </div>
                    <ChevronRight className="h-3 w-3 text-gray-400 shrink-0" />
                  </div>
                  <div className="flex items-start gap-2 bg-white p-2 rounded border border-gray-100">
                    <div className="h-5 w-5 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                      <Receipt className="h-3 w-3 text-[#f73a00]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900">
                        Order number
                      </p>
                      <p className="text-[10px] text-gray-500">
                        You will receive ORD-XXXX-XXXX
                      </p>
                    </div>
                    <ChevronRight className="h-3 w-3 text-gray-400 shrink-0" />
                  </div>
                  <div className="flex items-start gap-2 bg-white p-2 rounded border border-gray-100">
                    <div className="h-5 w-5 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                      <MapPinned className="h-3 w-3 text-[#f73a00]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900">
                        Delivery arranged
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Based on location
                      </p>
                    </div>
                    <ChevronRight className="h-3 w-3 text-gray-400 shrink-0" />
                  </div>
                </div>
              </div>

              {/* Action Buttons - stacked on mobile, inline on larger screens */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <Button
                  onClick={() => router.push("/orders")}
                  className="bg-[#f73a00] hover:bg-[#f73a00]/90 text-white rounded-lg py-2.5 text-sm w-full sm:w-1/2"
                >
                  Track My Orders
                </Button>
                <Button
                  onClick={() => router.push("/products")}
                  variant="outline"
                  className="rounded-lg border-orange-200 text-gray-900 hover:bg-orange-50 py-2.5 text-sm w-full sm:w-1/2"
                >
                  Continue Shopping
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  const half = total / 2;
  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-4 sm:py-8 px-4">
        <div className="container mx-auto max-w-7xl">
          <Button
            variant="ghost"
            onClick={() => router.push("/cart")}
            className="mb-4 sm:mb-6 text-gray-600 hover:text-gray-900 text-sm sm:text-base -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
            Back to Cart
          </Button>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-8 bg-gradient-to-r from-[#f73a00] to-amber-600 bg-clip-text text-transparent">
            Checkout
          </h1>

          {/* Mobile Order Summary Toggle could go here if needed */}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Shipping Form */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              <Card className="border-0 shadow-lg sm:shadow-xl rounded-xl sm:rounded-2xl overflow-hidden bg-white">
                <CardHeader className="bg-[#f73a00] text-white p-4 sm:p-6 rounded-t-lg">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shrink-0">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base sm:text-xl">
                        Shipping Information
                      </CardTitle>
                      <CardDescription className="text-orange-50 text-xs sm:text-sm">
                        Enter your delivery details
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 bg-white">
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-4 sm:space-y-6"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label
                          htmlFor="fullName"
                          className="text-gray-700 text-sm sm:text-base"
                        >
                          Full Name <span className="text-[#f73a00]">*</span>
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                            placeholder="Enter your full name"
                            className="pl-9 sm:pl-10 rounded-xl border-gray-200 text-gray-700 focus:ring-[#f73a00] focus:border-[#f73a00] bg-white text-sm sm:text-base h-10 sm:h-12"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <Label
                          htmlFor="phone"
                          className="text-gray-700 text-sm sm:text-base"
                        >
                          Phone Number <span className="text-[#f73a00]">*</span>
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            type="tel"
                            required
                            placeholder="Enter phone number"
                            className="pl-9 sm:pl-10 rounded-xl border-gray-200 text-gray-700 focus:ring-[#f73a00] focus:border-[#f73a00] bg-white text-sm sm:text-base h-10 sm:h-12"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label
                        htmlFor="address"
                        className="text-gray-700 text-sm sm:text-base"
                      >
                        Delivery Address{" "}
                        <span className="text-[#f73a00]">*</span>
                      </Label>
                      <div className="relative">
                        <Home className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Textarea
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          rows={3}
                          required
                          placeholder="Street address, apartment, suite, etc."
                          className="pl-9 sm:pl-10 rounded-xl border-gray-200 text-gray-700 focus:ring-[#f73a00] focus:border-[#f73a00] bg-white text-sm sm:text-base"
                        />
                      </div>
                    </div>

                    <div className="bg-orange-50 rounded-xl p-3 sm:p-4 border border-orange-100">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-[#f73a00] mt-0.5 shrink-0" />
                        <div className="text-xs sm:text-sm text-[#f73a00]">
                          <p className="font-medium mb-1">
                            Delivery Information:
                          </p>
                          <ul className="list-disc list-inside space-y-0.5 sm:space-y-1">
                            <li>Free delivery within Addis Ababa</li>
                            <li>EMS shipping fee applies to other cities</li>
                            <li>Delivery time: 2-3 weeks</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 sm:pt-4 border-t border-gray-200">
                      <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                        <Shield className="h-4 w-4 text-[#f73a00] shrink-0 mt-0.5" />
                        <p>
                          By placing this order, you agree to our{" "}
                          <button
                            type="button"
                            onClick={() => setShowTermsDialog(true)}
                            className="underline cursor-pointer hover:text-[#f73a00] focus:outline-none"
                          >
                            terms
                          </button>{" "}
                          and{" "}
                          <button
                            type="button"
                            onClick={() => setShowTermsDialog(true)}
                            className="underline cursor-pointer hover:text-[#f73a00] focus:outline-none"
                          >
                            conditions.
                          </button>
                        </p>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary - Sticky on desktop */}
            <div className="lg:col-span-1 order-1 lg:order-2">
              <Card className="border-0 shadow-lg sm:shadow-xl rounded-xl sm:rounded-2xl overflow-hidden sticky top-4 lg:top-24 bg-white">
                <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-4 sm:p-6 rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                    <CardTitle className="text-base sm:text-xl">
                      Order Summary
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-white">
                  {/* Items List - Scrollable on mobile if many items */}
                  <div className="space-y-3 max-h-60 sm:max-h-96 overflow-y-auto pr-1 sm:pr-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-2 sm:gap-3">
                        <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                          {item.product.images?.[0] ? (
                            <img
                              src={item.product.images[0]}
                              alt={item.product.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-4 w-4 sm:h-6 sm:w-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-xs sm:text-sm line-clamp-1">
                            {item.product.title}
                          </h4>
                          {item.variant && (
                            <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                              {[
                                item.variant.color,
                                item.variant.size,
                                item.variant.unit,
                              ]
                                .filter(Boolean)
                                .join(" • ")}
                            </div>
                          )}
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-[10px] sm:text-xs text-gray-500">
                              Qty: {item.quantity}
                            </span>
                            <span className="text-xs sm:text-sm font-semibold text-gray-900">
                              Br{" "}
                              {(item.price * item.quantity).toLocaleString(
                                "en-US",
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="bg-gray-200" />

                  {/* Price Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-gray-900">
                        Br {total.toLocaleString("en-US")}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <div className="text-right">
                        <span className="font-medium text-green-600">Free</span>
                        <p className="text-[10px] sm:text-xs text-gray-500">
                          Within Addis
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-2 sm:pt-3">
                      <span className="text-sm sm:text-base font-semibold text-gray-900">
                        Total
                      </span>
                      <span className="text-lg sm:text-2xl font-bold text-[#f73a00]">
                        ETB {total.toLocaleString("en-US")}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm text-right">
                      You pay: {half.toLocaleString("en-US")}
                    </p>
                  </div>

                  {/* Payment Method Info */}
                  <div className="bg-blue-50 rounded-xl p-3 sm:p-4 border border-blue-100">
                    <div className="flex items-start gap-2">
                      <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 shrink-0" />
                      <div className="text-[10px] sm:text-xs text-blue-800">
                        <p className="font-medium mb-0.5">Payment Method:</p>
                        <p>We will contact you with payment options.</p>
                      </div>
                    </div>
                  </div>

                  {/* Place Order Button */}
                  <Button
                    className="w-full bg-gradient-to-r from-[#f73a00] to-[#f73a00] hover:from-[#f73a00] hover:to-orange-700 text-white rounded-xl py-4 sm:py-6 text-sm sm:text-lg"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={submitting || items.length === 0}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      "Place Order"
                    )}
                  </Button>

                  {/* Note */}
                  <p className="text-[10px] sm:text-xs text-center text-gray-500">
                    You only pay half the price until delivery.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Conditions Dialog - Mobile Optimized */}
      {showTermsDialog && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setShowTermsDialog(false)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] sm:max-h-[80vh] overflow-hidden animate-slide-up sm:animate-scale-in border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog Header - Mobile Optimized */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gray-50 sticky top-0">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
                Terms and Conditions
              </h2>
              <button
                onClick={() => setShowTermsDialog(false)}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
              </button>
            </div>

            {/* Dialog Content - Scrollable */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)] sm:max-h-[60vh] bg-white">
              <div className="prose max-w-none">
                <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">
                  Effective Date: 22/2/2026
                </p>

                <div className="space-y-4 sm:space-y-6">
                  <section>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-4">
                      Acceptance of Terms
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      By accessing and using AmbaStore services, you accept and
                      agree to be bound by these Terms of Service.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-4">
                      Use of Our Services
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      You may use our services only for lawful purposes and in
                      accordance with these Terms. You agree not to use our
                      services in any way that could damage, disable,
                      overburden, or impair our website.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-4">
                      Account Responsibilities
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      If you create an account, you are responsible for
                      maintaining the security of your account and for all
                      activities that occur under the account. You must notify
                      us immediately of any unauthorized use.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-4">
                      Orders and Payments
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      By placing an order, you agree to pay the specified price
                      for the products. We reserve the right to refuse or cancel
                      any order for any reason, including but not limited to
                      product availability, errors in pricing, or suspected
                      fraud.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-4">
                      Shipping and Returns
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      Our shipping and return policies are outlined separately
                      and are incorporated by reference into these Terms.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-4">
                      Intellectual Property
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      All content on this website, including text, graphics,
                      logos, and images, is the property of AmbaStore and is
                      protected by copyright laws.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-4">
                      Limitation of Liability
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      To the fullest extent permitted by law, AmbaStore shall
                      not be liable for any indirect, incidental, special, or
                      consequential damages arising out of or in connection with
                      your use of our services.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-4">
                      Governing Law
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      These Terms shall be governed by the laws of the Federal
                      Democratic Republic of Ethiopia.
                    </p>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Main export with Suspense boundary
export default function CheckoutPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CheckoutContent />
    </Suspense>
  );
}
