"use client";

import { useState, Fragment } from "react";
import {
  Eye,
  EyeOff,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  User,
  Trash2,
} from "lucide-react";
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
    id: string;
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
  };
  order_items: OrderItem[];
}

interface OrdersTableProps {
  orders: Order[];
}

export default function OrdersTable({
  orders: initialOrders,
}: OrdersTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "SHIPPED":
        return <Truck className="h-4 w-4 text-blue-600" />;
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "CANCELED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
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
      case "FAILED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    // Don't update if status hasn't changed
    const currentOrder = orders.find((order) => order.id === orderId);
    if (currentOrder?.status === newStatus) {
      return;
    }

    setLoading(orderId);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      // Check if response is JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        // Try to get the error text
        const errorText = await res.text();
        console.error("Non-JSON response:", errorText.substring(0, 200));
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || `Failed to update order status (${res.status})`,
        );
      }

      toast.success(data.message || "Order status updated successfully");

      // Update the local state immediately for better UX
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus,
                updated_at: new Date().toISOString(),
              }
            : order,
        ),
      );
    } catch (error: any) {
      console.error("Status update error:", error);
      toast.error(error.message || "Failed to update order status");

      // Revert the select value on error
      const selectElement = document.querySelector(
        `select[data-order-id="${orderId}"]`,
      ) as HTMLSelectElement;
      if (selectElement && currentOrder) {
        selectElement.value = currentOrder.status;
      }
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (
      !confirm(
        `Are you sure you want to delete order #${orderNumber}? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setDeleteLoading(orderId);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Check if response is JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await res.text();
        console.error("Non-JSON response:", errorText.substring(0, 200));
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to delete order (${res.status})`);
      }

      toast.success(data.message || "Order deleted successfully");

      // Remove the order from local state
      setOrders((prevOrders) =>
        prevOrders.filter((order) => order.id !== orderId),
      );

      // If the deleted order was expanded, close it
      if (expandedOrder === orderId) {
        setExpandedOrder(null);
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete order");
    } finally {
      setDeleteLoading(null);
    }
  };

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase();

    const matchesSearch =
      (order.order_number ?? "").toLowerCase().includes(q) ||
      (order.users?.name ?? "").toLowerCase().includes(q) ||
      (order.users?.email ?? "").toLowerCase().includes(q) ||
      (order.shipping_info ?? "").toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 max-w-lg">
            <input
              type="search"
              placeholder="Search by order number, customer name, email, or shipping info..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="READY">Ready</option>
              <option value="SHIPPED">Shipped</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELED">Canceled</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <Fragment key={order.id}>
                <>
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {order.order_number}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.users.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.users.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm font-medium text-gray-900">
                        <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                        {order.total_price.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusUpdate(order.id, e.target.value)
                          }
                          className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          disabled={loading === order.id}
                          data-order-id={order.id}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="READY">Ready</option>
                          <option value="SHIPPED">Shipped</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELED">Canceled</option>
                          <option value="FAILED">Failed</option>
                        </select>
                        {loading === order.id && (
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleOrderDetails(order.id)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          {expandedOrder === order.id ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-1" />
                              Hide
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-1" />
                              Details
                            </>
                          )}
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteOrder(order.id, order.order_number)
                          }
                          disabled={deleteLoading === order.id}
                          className="text-red-600 hover:text-red-900 flex items-center disabled:opacity-50"
                          title="Delete Order"
                        >
                          <Trash2 className="h-4 w-4" />
                          {deleteLoading === order.id && (
                            <span className="ml-1 h-3 w-3 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></span>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Expanded Order Details */}
                  {expandedOrder === order.id && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 bg-gray-50">
                        <div className="border rounded-lg bg-white p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Customer Information */}
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <User className="h-5 w-5 mr-2" />
                                Customer Information
                              </h4>
                              <div className="space-y-3 text-sm">
                                <div>
                                  <div className="font-medium text-gray-700">
                                    Name
                                  </div>
                                  <div className="text-gray-900">
                                    {order.users.name}
                                  </div>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-700">
                                    Email
                                  </div>
                                  <div className="text-gray-900">
                                    {order.users.email}
                                  </div>
                                </div>
                                {order.users.phone && (
                                  <div>
                                    <div className="font-medium text-gray-700">
                                      Phone
                                    </div>
                                    <div className="text-gray-900">
                                      {order.users.phone}
                                    </div>
                                  </div>
                                )}
                                {order.users.address && (
                                  <div>
                                    <div className="font-medium text-gray-700">
                                      Address
                                    </div>
                                    <div className="text-gray-900 whitespace-pre-line">
                                      {order.users.address}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Shipping Information */}
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Package className="h-5 w-5 mr-2" />
                                Shipping Information
                              </h4>
                              <div className="text-sm">
                                <div className="font-medium text-gray-700 mb-2">
                                  Shipping Address
                                </div>
                                <div className="text-gray-900 whitespace-pre-line">
                                  {order.shipping_info}
                                </div>
                                <div className="mt-4 pt-4 border-t">
                                  <div className="font-medium text-gray-700">
                                    Order Timeline
                                  </div>
                                  <div className="mt-2 space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">
                                        Created:
                                      </span>
                                      <span className="text-gray-900">
                                        {formatFullDate(order.created_at)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">
                                        Last Updated:
                                      </span>
                                      <span className="text-gray-900">
                                        {formatFullDate(order.updated_at)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Order Items */}
                            <div className="md:col-span-2">
                              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                                Order Items
                              </h4>
                              <div className="space-y-4">
                                {order.order_items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center justify-between border rounded-lg p-4"
                                  >
                                    <div className="flex items-center">
                                      <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                                        {item.products.images &&
                                        item.products.images.length > 0 ? (
                                          <img
                                            src={item.products.images[0]}
                                            alt={item.products.title}
                                            className="h-full w-full object-cover rounded-lg"
                                          />
                                        ) : (
                                          <Package className="h-8 w-8 text-gray-400" />
                                        )}
                                      </div>
                                      <div>
                                        <div className="font-medium text-gray-900">
                                          {item.products.title}
                                        </div>
                                        {item.product_variants && (
                                          <div className="mt-1 text-sm text-gray-500">
                                            {item.product_variants.color && (
                                              <span className="mr-3">
                                                Color:{" "}
                                                {item.product_variants.color}
                                              </span>
                                            )}
                                            {item.product_variants.size && (
                                              <span className="mr-3">
                                                Size:{" "}
                                                {item.product_variants.size}
                                              </span>
                                            )}
                                            {item.product_variants.unit && (
                                              <span>
                                                Unit:{" "}
                                                {item.product_variants.unit}
                                              </span>
                                            )}
                                          </div>
                                        )}
                                        <div className="mt-1 text-sm text-gray-600">
                                          Quantity: {item.quantity}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-lg font-bold text-gray-900">
                                        $
                                        {(item.price * item.quantity).toFixed(
                                          2,
                                        )}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        ${item.price.toFixed(2)} each
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Order Summary */}
                              <div className="mt-6 border-t pt-6">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <div className="text-sm text-gray-600">
                                      Total
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900">
                                      ${order.total_price.toFixed(2)}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <div
                                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}
                                    >
                                      {getStatusIcon(order.status)}
                                      <span className="ml-2 capitalize">
                                        {order.status.toLowerCase()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              </Fragment>
            ))}
          </tbody>
        </table>
        {filteredOrders.length === 0 && (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-2">No orders found</div>
            <p className="text-sm text-gray-500">
              {searchQuery || statusFilter !== "all"
                ? "Try changing your filters"
                : "No orders in the system yet"}
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="p-4 border-t bg-gray-50">
        <div className="text-sm text-gray-600">
          Showing {filteredOrders.length} of {orders.length} orders
        </div>
      </div>
    </div>
  );
}
