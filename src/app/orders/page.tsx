"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/context";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  status: string;
  shipping_info: string;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

export default function UserOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "SHIPPED":
        return <Truck className="h-5 w-5 text-blue-600" />;
      case "CONFIRMED":
        return <CheckCircle className="h-5 w-5 text-purple-600" />;
      case "PENDING":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "CANCELED":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Awaiting Confirmation";
      case "CONFIRMED":
        return "Order Confirmed";
      case "READY":
        return "Ready for Shipping";
      case "SHIPPED":
        return "Shipped";
      case "COMPLETED":
        return "Delivered";
      case "CANCELED":
        return "Cancelled";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-600">Track your orders and their status</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No orders yet
          </h2>
          <p className="text-gray-600 mb-6">
            You haven't placed any orders yet.
          </p>
          <Button onClick={() => (window.location.href = "/products")}>
            Browse Products
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl shadow-sm border overflow-hidden"
            >
              {/* Order Header */}
              <div className="p-6 border-b">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      {getStatusIcon(order.status)}
                      <span
                        className={`text-sm font-medium px-2 py-1 rounded-full ${
                          order.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : order.status === "CONFIRMED"
                              ? "bg-purple-100 text-purple-800"
                              : order.status === "SHIPPED"
                                ? "bg-blue-100 text-blue-800"
                                : order.status === "COMPLETED"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Placed on {formatDate(order.created_at)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      ${order.total_price.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {order.order_number ? (
                        <>Order #: {order.order_number}</>
                      ) : (
                        <>Order ID: {order.id.substring(0, 8)}...</>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Info */}
              <div className="p-6 border-b bg-gray-50">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      Shipping Address
                    </h4>
                    <pre className="text-sm text-gray-600 whitespace-pre-line font-sans">
                      {order.shipping_info}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="p-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">
                  Order Items ({order.order_items.length})
                </h4>
                <div className="space-y-4">
                  {order.order_items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                          {item.products.images &&
                          item.products.images.length > 0 ? (
                            <img
                              src={item.products.images[0]}
                              alt={item.products.title}
                              className="h-full w-full object-cover rounded-lg"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {item.products.title}
                          </div>
                          {item.product_variants && (
                            <div className="text-xs text-gray-500">
                              {item.product_variants.color && (
                                <span className="mr-2">
                                  Color: {item.product_variants.color}
                                </span>
                              )}
                              {item.product_variants.size && (
                                <span className="mr-2">
                                  Size: {item.product_variants.size}
                                </span>
                              )}
                              {item.product_variants.unit && (
                                <span>Unit: {item.product_variants.unit}</span>
                              )}
                            </div>
                          )}
                          <div className="text-sm text-gray-600">
                            Qty: {item.quantity} × ${item.price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="font-medium text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
