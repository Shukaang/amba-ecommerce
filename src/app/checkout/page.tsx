"use client";

import React, { useState, useEffect } from "react";
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

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { items, total, clearCart, loading: cartLoading } = useCart();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [orderTotal, setOrderTotal] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false); // new state

  const isLoading = authLoading || cartLoading;

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
  });

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

  useEffect(() => {
    if (!isLoading && !user) {
      toast.error("Please login to checkout");
      const returnUrl = encodeURIComponent(window.location.pathname);
      router.push(`/login?redirectTo=${returnUrl}`);
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#f73a00] mx-auto mb-4" />
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (items.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 mb-6">
              <Package className="h-10 w-10 text-[#f73a00]" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Your cart is empty
            </h1>
            <p className="text-gray-600 mb-8">
              Add some products to your cart before checkout.
            </p>
            <Button
              onClick={() => router.push("/products")}
              className="bg-[#f73a00] hover:bg-[#f73a00]/90 text-white rounded-xl px-8 py-6 text-lg"
            >
              Browse Products
            </Button>
          </div>
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
          updateUserAddress: true,
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
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-white">
              <CardHeader className="bg-[#087f00] text-white p-8 rounded-t-lg">
                <div className="flex items-center justify-center mb-4">
                  <div className="h-20 w-20 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <CheckCircle className="h-10 w-10 text-white" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold text-center">
                  Order Submitted!
                </CardTitle>
                <CardDescription className="text-green-50 text-center text-lg">
                  Thank you for your purchase
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6 bg-white">
                <div className="bg-orange-50 rounded-xl p-6 border border-orange-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-[#f73a00]" />
                      <span className="font-semibold text-gray-900">
                        Order Status
                      </span>
                    </div>
                    <Badge className="bg-yellow-100 text-[#f73a00] px-3 py-1">
                      PENDING CONFIRMATION
                    </Badge>
                  </div>
                  <p className="text-gray-600">
                    Your order is pending confirmation. We'll contact you via
                    phone shortly to confirm details and provide your order
                    number.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Order Reference</span>
                    <span className="font-mono text-gray-900">
                      {orderId.substring(0, 8)}...
                    </span>
                  </div>
                  <Separator className="bg-gray-200" />
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Total Amount</span>
                    <span className="text-2xl font-bold text-gray-900">
                      ETB {orderTotal.toLocaleString("en-US")}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    What happens next?
                  </h4>
                  <ul className="space-y-3 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-[#f73a00] mt-0.5 shrink-0" />
                      <span>
                        We'll review your order and contact you within 24 hours.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-[#f73a00] mt-0.5 shrink-0" />
                      <span>
                        Once confirmed, you'll receive an order number (e.g.,
                        ORD-0126-0001).
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-[#f73a00] mt-0.5 shrink-0" />
                      <span>
                        Delivery will be arranged based on your location.
                      </span>
                    </li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 p-6 flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => router.push("/orders")}
                  className="bg-gradient-to-r from-[#f73a00] to-[#f73a00] hover:from-[#f73a00] hover:to-orange-700 text-white rounded-xl px-8"
                >
                  Track My Orders
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/products")}
                  className="rounded-xl border-orange-200 hover:bg-orange-50 bg-white"
                >
                  Continue Shopping
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/cart")}
            className="mb-6 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Button>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 bg-gradient-to-r from-[#f73a00] to-amber-600 bg-clip-text text-transparent">
            Checkout
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Shipping Form */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-white">
                <CardHeader className="bg-[#f73a00] text-white p-6 rounded-t-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        Shipping Information
                      </CardTitle>
                      <CardDescription className="text-orange-50">
                        Enter your delivery details
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 bg-white">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-gray-700">
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
                            className="pl-10 rounded-xl border-gray-200 text-gray-700 focus:ring-[#f73a00] focus:border-[#f73a00] bg-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-gray-700">
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
                            className="pl-10 rounded-xl border-gray-200 text-gray-700 focus:ring-[#f73a00] focus:border-[#f73a00] bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-gray-700">
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
                          className="pl-10 rounded-xl border-gray-200 text-gray-700 focus:ring-[#f73a00] focus:border-[#f73a00] bg-white"
                        />
                      </div>
                    </div>

                    <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                      <div className="flex items-start gap-3">
                        <Truck className="h-5 w-5 text-[#f73a00] mt-0.5" />
                        <div className="text-sm text-[#f73a00]">
                          <p className="font-medium mb-1">
                            Delivery Information:
                          </p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Free delivery within Addis Ababa</li>
                            <li>EMS shipping fee applies to other cities</li>
                            <li>Delivery time: 2-3 weeks</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-start gap-2 text-sm text-gray-600">
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
                          </button>{" "}
                          We'll contact you via phone to confirm your order and
                          delivery details.
                        </p>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="border-0 shadow-xl rounded-2xl overflow-hidden sticky top-24 bg-white">
                <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6 rounded-t-lg">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5" />
                    <CardTitle className="text-xl">Order Summary</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6 bg-white">
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                          {item.product.images?.[0] ? (
                            <img
                              src={item.product.images[0]}
                              alt={item.product.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                            {item.product.title}
                          </h4>
                          {item.variant && (
                            <div className="text-xs text-gray-500 mt-1">
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
                            <span className="text-xs text-gray-500">
                              Qty: {item.quantity}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              Br
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

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-gray-900">
                        Br {total.toLocaleString("en-US")}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <div className="text-right">
                        <span className="font-medium text-green-600">Free</span>
                        <p className="text-xs text-gray-500">
                          Within Addis Ababa
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-3">
                      <span className="text-base font-semibold text-gray-900">
                        Total
                      </span>
                      <span className="text-2xl font-bold text-[#f73a00]">
                        ETB {total.toLocaleString("en-US")}
                      </span>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-start gap-2">
                      <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-xs text-blue-800">
                        <p className="font-medium mb-1">Payment Method:</p>
                        <p>We will contact you with the payment methods.</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-[#f73a00] to-[#f73a00] hover:from-[#f73a00] hover:to-orange-700 text-white rounded-xl py-6 text-lg"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={submitting || items.length === 0}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      "Place Order"
                    )}
                  </Button>

                  <p className="text-xs text-center text-gray-500">
                    You only pay half the price until delivery.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Conditions Dialog */}
      {showTermsDialog && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowTermsDialog(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden animate-scale-in border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-2xl font-bold text-gray-900">
                Terms and Conditions
              </h2>
              <button
                onClick={() => setShowTermsDialog(false)}
                className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5 text-gray-700" />
              </button>
            </div>

            {/* Dialog Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh] bg-white">
              <div className="prose max-w-none">
                <p className="text-gray-600 mb-6">
                  Effective Date: {new Date().toLocaleDateString()}
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Acceptance of Terms
                </h3>
                <p className="text-gray-600 mb-4">
                  By accessing and using AmbaStore services, you accept and
                  agree to be bound by these Terms of Service.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Use of Our Services
                </h3>
                <p className="text-gray-600 mb-4">
                  You may use our services only for lawful purposes and in
                  accordance with these Terms. You agree not to use our services
                  in any way that could damage, disable, overburden, or impair
                  our website.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Account Responsibilities
                </h3>
                <p className="text-gray-600 mb-4">
                  If you create an account, you are responsible for maintaining
                  the security of your account and for all activities that occur
                  under the account. You must notify us immediately of any
                  unauthorized use.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Orders and Payments
                </h3>
                <p className="text-gray-600 mb-4">
                  By placing an order, you agree to pay the specified price for
                  the products. We reserve the right to refuse or cancel any
                  order for any reason, including but not limited to product
                  availability, errors in pricing, or suspected fraud.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Shipping and Returns
                </h3>
                <p className="text-gray-600 mb-4">
                  Our shipping and return policies are outlined separately and
                  are incorporated by reference into these Terms.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Intellectual Property
                </h3>
                <p className="text-gray-600 mb-4">
                  All content on this website, including text, graphics, logos,
                  and images, is the property of AmbaStore and is protected by
                  copyright laws.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Limitation of Liability
                </h3>
                <p className="text-gray-600 mb-4">
                  To the fullest extent permitted by law, AmbaStore shall not be
                  liable for any indirect, incidental, special, or consequential
                  damages arising out of or in connection with your use of our
                  services.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Governing Law
                </h3>
                <p className="text-gray-600">
                  These Terms shall be governed by the laws of the Federal
                  Democratic Republic of Ethiopia.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
