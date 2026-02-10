"use client";

import { useState } from "react";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  User,
  MapPin,
  CreditCard,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  order_number: string;
  total_price: number;
  status: string;
  shipping_info: string;
  created_at: string;
  updated_at: string;
  users: {
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
  };
  order_items: OrderItem[];
}

interface OrderDetailsProps {
  order: Order;
}

export default function OrderDetails({ order }: OrderDetailsProps) {
  const [status, setStatus] = useState(order.status);
  const [loading, setLoading] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "SHIPPED":
        return <Truck className="h-5 w-5 text-blue-600" />;
      case "PENDING":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "CANCELED":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "SHIPPED":
        return "bg-blue-100 text-blue-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELED":
        return "bg-red-100 text-red-800";
      case "CONFIRMED":
        return "bg-purple-100 text-purple-800";
      case "READY":
        return "bg-indigo-100 text-indigo-800";
      case "FAILED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleStatusUpdate = async () => {
    if (status === order.status) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update order status");
      }

      toast.success("Order status updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update order status");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const calculateSubtotal = () => {
    return order.order_items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
  };

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Order #{order.order_number}
            </h2>
            <div className="flex items-center mt-1 text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              Placed on {formatDate(order.created_at)}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}
            >
              {getStatusIcon(status)}
              <span className="ml-2 capitalize">{status.toLowerCase()}</span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              ${order.total_price.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information */}
        <div className="lg:col-span-1 space-y-6">
          {/* Customer Details */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Customer Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <User className="h-4 w-4 text-gray-400 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">
                    {order.users.name}
                  </div>
                </div>
              </div>
              <div className="flex items-center text-sm">
                <Mail className="h-4 w-4 text-gray-400 mr-3" />
                <div className="text-gray-600">{order.users.email}</div>
              </div>
              {order.users.phone && (
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 text-gray-400 mr-3" />
                  <div className="text-gray-600">{order.users.phone}</div>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Information */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Shipping Information
            </h3>
            <div className="text-sm text-gray-600 whitespace-pre-line">
              {order.shipping_info}
            </div>
          </div>

          {/* Order Actions */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Order Actions
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Status
                </label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="READY">Ready</SelectItem>
                    <SelectItem value="SHIPPED">Shipped</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELED">Canceled</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleStatusUpdate}
                className="w-full"
                disabled={loading || status === order.status}
              >
                {loading ? "Updating..." : "Update Status"}
              </Button>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Order Items
              </h3>
            </div>
            <div className="divide-y">
              {order.order_items.map((item) => (
                <div key={item.id} className="p-6">
                  <div className="flex items-start">
                    <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                      {item.products.images &&
                      item.products.images.length > 0 ? (
                        <img
                          src={item.products.images[0]}
                          alt="Product image"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {item.products.title}
                          </h4>
                          {item.product_variants && (
                            <div className="mt-1 text-sm text-gray-500">
                              {item.product_variants.color && (
                                <span className="mr-3">
                                  Color: {item.product_variants.color}
                                </span>
                              )}
                              {item.product_variants.size && (
                                <span className="mr-3">
                                  Size: {item.product_variants.size}
                                </span>
                              )}
                              {item.product_variants.unit && (
                                <span>Unit: {item.product_variants.unit}</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            ${item.price.toFixed(2)} × {item.quantity}
                          </div>
                          <div className="text-sm font-bold text-gray-900 mt-1">
                            ${(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Order Summary */}
            <div className="p-6 border-t bg-gray-50">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    ${calculateSubtotal().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">$0.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">$0.00</span>
                </div>
                <div className="flex justify-between pt-2 border-t text-lg font-bold">
                  <span>Total</span>
                  <span>${order.total_price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="mt-6 bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Order Timeline
            </h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Order Created
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(order.created_at)}
                  </div>
                </div>
              </div>
              <div className="flex items-start">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Last Updated
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(order.updated_at)}
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
