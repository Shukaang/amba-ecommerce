"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  User,
  Phone,
  Home,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser-client";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  products: {
    title: string;
    images: string[];
  };
  product_variants: {
    color: string;
    size: string;
    unit: string;
  } | null;
}

interface Order {
  id: string;
  order_number: string | null;
  total_price: number;
  status: string; // actual DB status: PENDING, CONFIRMED, SHIPPED, READY, COMPLETED, CANCELED, FAILED
  shipping_info: string;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

export default function UserOrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const supabase = createBrowserSupabaseClient();

  const isLoading = authLoading || ordersLoading;

  // Map actual status to display status
  const getDisplayStatus = (status: string): string => {
    switch (status) {
      case "PENDING":
        return "PENDING";
      case "CONFIRMED":
      case "SHIPPED":
      case "READY":
        return "CONFIRMED";
      case "COMPLETED":
        return "COMPLETED";
      case "CANCELED":
      case "FAILED":
        return "CANCELED";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    const display = getDisplayStatus(status);
    switch (display) {
      case "COMPLETED":
        return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      case "CONFIRMED":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "PENDING":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "CANCELED":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    const display = getDisplayStatus(status);
    switch (display) {
      case "COMPLETED":
        return "bg-gray-200 text-gray-800 border-gray-200";
      case "CONFIRMED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "CANCELED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const fetchOrders = async () => {
    if (!user) return;
    try {
      setOrdersLoading(true);
      const res = await fetch("/api/orders");
      const data = await res.json();

      if (res.ok) {
        setOrders(data.orders || []);
      } else {
        toast.error(data.error || "Failed to load orders");
      }
    } catch (error) {
      toast.error("Failed to load orders");
    } finally {
      setOrdersLoading(false);
    }
  };

  // Redirect if not logged in after auth loads
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please login to view your orders");
      const returnUrl = encodeURIComponent(window.location.pathname);
      router.push(`/login?redirectTo=${returnUrl}`);
    }
  }, [user, authLoading, router]);

  // Fetch orders when user is available
  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("user-orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchOrders();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const parseShippingInfo = (info: string) => {
    const lines = info.split("\n");
    const fullName =
      lines
        .find((l) => l.startsWith("Full Name:"))
        ?.replace("Full Name:", "")
        .trim() || "";
    const phone =
      lines
        .find((l) => l.startsWith("Phone:"))
        ?.replace("Phone:", "")
        .trim() || "";
    const address =
      lines
        .find((l) => l.startsWith("Address:"))
        ?.replace("Address:", "")
        .trim() || "";
    return { fullName, phone, address };
  };

  const toggleOrder = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  // Show loading spinner while auth is loading or orders are loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#f73a00] mx-auto mb-4" />
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  // If not logged in after loading, return null (redirect will happen)
  if (!user) {
    return null;
  }

  // Now user is authenticated, render orders
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-[#f73a00] to-amber-600 bg-clip-text text-transparent">
            My Orders
          </h1>
          <p className="text-gray-600">Track your orders and their status</p>
        </div>

        {orders.length === 0 ? (
          <Card className="border-0 shadow-xl rounded-2xl bg-white">
            <CardContent className="py-16 text-center bg-white">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 mb-6">
                <Package className="h-10 w-10 text-[#f73a00]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                No orders yet
              </h2>
              <p className="text-gray-600 mb-8">
                You haven't placed any orders yet.
              </p>
              <Button
                onClick={() => (window.location.href = "/products")}
                className="bg-gradient-to-r from-orange-500 to-[#f73a00] hover:from-[#f73a00] hover:to-orange-700 text-white rounded-xl px-8 py-6 text-lg"
              >
                Browse Products
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const shipping = parseShippingInfo(order.shipping_info);
              const displayStatus = getDisplayStatus(order.status);
              return (
                <Card
                  key={order.id}
                  className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white"
                >
                  {/* Order Header - Clickable */}
                  <div
                    className="p-6 bg-gradient-to-r from-gray-50 to-white cursor-pointer hover:bg-orange-50 transition-colors"
                    onClick={() => toggleOrder(order.id)}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                          {getStatusIcon(order.status)}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-lg font-semibold text-gray-900">
                              {order.order_number
                                ? `#${order.order_number}`
                                : `Order ref ${order.id.substring(0, 8)}...`}
                            </span>
                            <Badge
                              className={`${getStatusColor(order.status)} border`}
                            >
                              {displayStatus}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(order.created_at)}
                            </span>
                            <span>{order.order_items.length} items</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 ml-auto">
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            ETB {order.total_price.toLocaleString("en-US")}
                          </div>
                        </div>
                        {expandedOrder === order.id ? (
                          <ChevronUp className="h-6 w-6 text-orange-500" />
                        ) : (
                          <ChevronDown className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedOrder === order.id && (
                    <CardContent className="p-6 space-y-6 border-t border-gray-200 bg-white">
                      {/* Shipping Info */}
                      <div className="bg-orange-50 rounded-xl p-5">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-orange-500" />
                          Shipping Details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-start gap-2">
                            <User className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-gray-500">Full Name</p>
                              <p className="font-medium text-gray-900">
                                {shipping.fullName}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-gray-500">Phone</p>
                              <p className="font-medium text-gray-900">
                                {shipping.phone}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 md:col-span-2">
                            <Home className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-gray-500">Address</p>
                              <p className="font-medium text-gray-900">
                                {shipping.address}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <ShoppingBag className="h-5 w-5 text-orange-500" />
                          Items ({order.order_items.length})
                        </h4>
                        <div className="space-y-4">
                          {order.order_items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                              <div className="h-16 w-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                {item.products.images?.[0] ? (
                                  <img
                                    src={item.products.images[0]}
                                    alt={item.products.title}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center">
                                    <Package className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between">
                                  <div>
                                    <h5 className="font-medium text-gray-900">
                                      {item.products.title}
                                    </h5>
                                    {item.product_variants && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        {[
                                          item.product_variants.color &&
                                            `Color: ${item.product_variants.color}`,
                                          item.product_variants.size &&
                                            `Size: ${item.product_variants.size}`,
                                          item.product_variants.unit &&
                                            `Unit: ${item.product_variants.unit}`,
                                        ]
                                          .filter(Boolean)
                                          .join(" • ")}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <div className="font-semibold text-gray-900">
                                      Br
                                      {(
                                        item.price * item.quantity
                                      ).toLocaleString("en-US")}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Br{item.price.toLocaleString("en-US")} ×{" "}
                                      {item.quantity}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Total</span>
                          <span className="text-2xl font-bold text-[#f73a00]">
                            ETB {order.total_price.toLocaleString("en-US")}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
