"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import {
  Package,
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
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import Link from "next/link";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  products: {
    title: string;
    images: string[];
    slug: string;
  };
  product_variants: {
    color: string;
    size: string;
    unit: string;
  } | null;
  selected_options: {
    color?: string;
    size?: string;
  } | null;
}

interface Order {
  id: string;
  order_number: string | null;
  total_price: number;
  status: string;
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
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
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

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please login to view your orders");
      const returnUrl = encodeURIComponent(window.location.pathname);
      router.push(`/login?redirectTo=${returnUrl}`);
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#f73a00] mx-auto mb-4" />
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            My Orders
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Track and manage your orders
          </p>
        </div>

        {orders.length === 0 ? (
          <Card className="border-0 shadow-sm rounded-2xl bg-white">
            <CardContent className="py-12 sm:py-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-orange-50 mb-4 sm:mb-6">
                <Package className="h-8 w-8 sm:h-10 sm:w-10 text-[#f73a00]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                No orders yet
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-sm mx-auto">
                You haven't placed any orders. Start shopping and your orders
                will appear here.
              </p>
              <Button
                onClick={() => router.push("/products")}
                className="bg-[#f73a00] hover:bg-[#f73a00]/90 text-white rounded-xl px-6 py-5 sm:px-8 sm:py-6 text-sm sm:text-base"
              >
                Browse Products
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {orders.map((order) => {
              const shipping = parseShippingInfo(order.shipping_info);
              const displayStatus = getDisplayStatus(order.status);
              return (
                <Card
                  key={order.id}
                  className="border border-gray-200 shadow-sm rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow"
                >
                  {/* Order Header - Clickable */}
                  <div
                    className="px-2 py-1 sm:p-4 cursor-pointer hover:bg-gray-50/80 transition-colors"
                    onClick={() => toggleOrder(order.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          {getStatusIcon(order.status)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                              {order.order_number
                                ? `#${order.order_number}`
                                : `Order ref: ${order.id.substring(0, 8)}`}
                            </span>
                            <Badge
                              className={`${getStatusColor(order.status)} border text-xs px-2 py-0.5`}
                            >
                              {displayStatus}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                              {formatDate(order.created_at)}
                            </span>
                            <span>
                              {order.order_items.length}{" "}
                              {order.order_items.length === 1
                                ? "item"
                                : "items"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-sm sm:text-base font-bold text-gray-900">
                            ETB {order.total_price.toLocaleString("en-US")}
                          </div>
                        </div>
                        {expandedOrder === order.id ? (
                          <ChevronUp className="h-5 w-5 text-[#f73a00]" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedOrder === order.id && (
                    <CardContent className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50/50">
                      <div className="space-y-4 sm:space-y-6">
                        {/* Shipping Info */}
                        <div className="bg-white rounded-lg p-4 sm:p-5 shadow-sm">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
                            <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-[#f73a00]" />
                            Shipping Details
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                            <div className="flex items-start gap-2">
                              <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-gray-500">Full Name</p>
                                <p className="font-medium text-gray-900 truncate">
                                  {shipping.fullName}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <Phone className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-gray-500">Phone</p>
                                <p className="font-medium text-gray-900">
                                  {shipping.phone}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2 sm:col-span-2">
                              <Home className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0">
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
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
                            <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-[#f73a00]" />
                            Items ({order.order_items.length})
                          </h4>
                          <div className="space-y-3 sm:space-y-4">
                            {order.order_items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-start gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-white transition-colors"
                              >
                                <Link href={`/products/${item.products.slug}`}>
                                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
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
                                </Link>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                                    <div className="min-w-0">
                                      <h5 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                                        {item.products.title}
                                      </h5>
                                      {(item.product_variants ||
                                        item.selected_options) && (
                                        <div className="text-xs text-gray-500 mt-0.5">
                                          {[
                                            item.product_variants?.color &&
                                              item.product_variants.color,
                                            item.product_variants?.size &&
                                              item.product_variants.size,
                                            item.product_variants?.unit &&
                                              item.product_variants.unit,
                                            !item.product_variants &&
                                              item.selected_options?.color &&
                                              item.selected_options.color,
                                            !item.product_variants &&
                                              item.selected_options?.size &&
                                              item.selected_options.size,
                                          ]
                                            .filter(Boolean)
                                            .join(" • ")}
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-left sm:text-right flex-shrink-0">
                                      <div className="font-semibold text-gray-900 text-sm sm:text-base">
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

                        {/* Order Total */}
                        <div className="border-t border-gray-200 pt-3 sm:pt-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm sm:text-base text-gray-600">
                              Total
                            </span>
                            <span className="text-lg sm:text-xl font-bold text-[#f73a00]">
                              ETB {order.total_price.toLocaleString("en-US")}
                            </span>
                          </div>
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
