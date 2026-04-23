"use client";

import { useState, Fragment, useEffect, useMemo, useCallback } from "react";
import {
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
import { createClient } from "@/lib/supabase/supabaseClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth/context";
import Link from "next/link";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  products: {
    title: string;
    images: string[];
    slug: string;
    link: string;
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
  updated_by: string | null;
  users: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
  };
  updated_by_user?: {
    id: string;
    name: string;
    email: string;
  } | null;
  order_items: OrderItem[];
}

interface OrdersTableProps {
  orders: Order[];
}

// Helper functions
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

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatFullDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

export default function OrdersTable({
  orders: initialOrders,
}: OrdersTableProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<{
    id: string;
    orderNumber: string | null;
  } | null>(null);

  const supabase = createClient();

  // Real‑time subscription for admin (INSERT, UPDATE, DELETE)
  useEffect(() => {
    const channel = supabase
      .channel("admin-orders-all")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        async (payload) => {
          const { data: newOrder, error } = await supabase
            .from("orders")
            .select(
              `
              *,
              users!orders_user_id_fkey(id, name, email, phone, address),
              updated_by_user:users!orders_updated_by_fkey(id, name, email),
              order_items(*, products(*), product_variants(*))
            `,
            )
            .eq("id", payload.new.id)
            .single();
          if (!error && newOrder) setOrders((prev) => [newOrder, ...prev]);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        async (payload) => {
          // Refresh the updated order to get the latest updated_by_user info
          const { data: updatedOrder, error } = await supabase
            .from("orders")
            .select(
              `
              *,
              users!orders_user_id_fkey(id, name, email, phone, address),
              updated_by_user:users!orders_updated_by_fkey(id, name, email),
              order_items(*, products(*), product_variants(*))
            `,
            )
            .eq("id", payload.new.id)
            .single();
          if (!error && updatedOrder) {
            setOrders((prev) =>
              prev.map((order) =>
                order.id === updatedOrder.id ? updatedOrder : order,
              ),
            );
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "orders" },
        (payload) => {
          setOrders((prev) =>
            prev.filter((order) => order.id !== payload.old.id),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Status update with updated_by
  const handleStatusUpdate = useCallback(
    async (orderId: string, newStatus: string) => {
      const currentOrder = orders.find((o) => o.id === orderId);
      if (!currentOrder || currentOrder.status === newStatus) return;

      setLoading(orderId);
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Update failed");

        // Update state with the full order from the API
        setOrders((prev) =>
          prev.map((order) => (order.id === orderId ? data.order : order)),
        );

        toast.success("Order status updated");
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setLoading(null);
      }
    },
    [orders],
  );

  // Delete with modal
  const openDeleteModal = (id: string, orderNumber: string | null) => {
    setOrderToDelete({ id, orderNumber });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!orderToDelete) return;
    setDeleteLoading(orderToDelete.id);
    try {
      const res = await fetch(`/api/admin/orders/${orderToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");

      // Remove from state
      setOrders((prev) =>
        prev.filter((order) => order.id !== orderToDelete.id),
      );
      if (expandedOrder === orderToDelete.id) {
        setExpandedOrder(null);
      }
      toast.success(data.message);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleteLoading(null);
      setDeleteModalOpen(false);
      setOrderToDelete(null);
    }
  };

  // Click to expand
  const toggleExpand = (orderId: string) => {
    setExpandedOrder((prev) => (prev === orderId ? null : orderId));
  };

  // Filtering
  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return orders.filter((order) => {
      const matchesSearch =
        (order.id ?? "").toLowerCase().includes(q) ||
        (order.order_number ?? "").toLowerCase().includes(q) ||
        (order.users?.name ?? "").toLowerCase().includes(q) ||
        (order.users?.email ?? "").toLowerCase().includes(q) ||
        (order.shipping_info ?? "").toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 max-w-lg">
            <input
              type="search"
              placeholder="Search by ref, order number, customer name, email, or shipping info..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-gray-900 text-sm ring-2 ring-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border text-gray-900 ring ring-gray-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="SHIPPED">Shipped</option>
              <option value="READY">Ready</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELED">Canceled</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table – click‑to‑expand on row */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm md:text-base">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order #
              </th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="hidden sm:table-cell px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="hidden lg:table-cell px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <Fragment key={order.id}>
                {/* Clickable row */}
                <tr
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleExpand(order.id)}
                >
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {order.order_number
                        ? `#${order.order_number}`
                        : `ref ${order.id.slice(0, 8)}`}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate max-w-[120px] md:max-w-none">
                          {order.users.name}
                        </div>
                        <div className="text-xs md:text-sm text-gray-500 truncate max-w-[120px] md:max-w-none">
                          {order.users.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-4 md:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center font-medium text-gray-900">
                      <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                      {order.total_price.toLocaleString("en-US")}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <div
                      className="flex items-center space-x-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusUpdate(order.id, e.target.value)
                        }
                        className="px-2 py-1 border rounded text-gray-900 ring-1 ring-gray-400 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        disabled={loading === order.id}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="READY">Ready</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELED">Canceled</option>
                        <option value="FAILED">Failed</option>
                      </select>
                      {loading === order.id && (
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></span>
                      )}
                    </div>
                  </td>
                  <td className="hidden lg:table-cell px-4 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm font-medium">
                    <div
                      className="flex items-center space-x-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() =>
                          openDeleteModal(order.id, order.order_number)
                        }
                        disabled={deleteLoading === order.id}
                        className="text-red-600 hover:text-red-900 flex items-center disabled:opacity-50"
                        title="Delete Order"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Expanded details */}
                {expandedOrder === order.id && (
                  <tr>
                    <td colSpan={6} className="px-4 md:px-6 py-4 bg-gray-50">
                      <div className="border rounded-lg bg-white p-4 md:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Customer info */}
                          <div>
                            <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-4 flex items-center">
                              <User className="h-5 w-5 mr-2" />
                              Customer Information
                            </h4>
                            <div className="space-y-3 text-xs md:text-sm">
                              <div>
                                <div className="font-medium text-gray-700">
                                  Name
                                </div>
                                <div className="text-gray-900 break-words">
                                  {order.users.name}
                                </div>
                              </div>
                              <div>
                                <div className="font-medium text-gray-700">
                                  Email
                                </div>
                                <div className="text-gray-900 break-words">
                                  {order.users.email}
                                </div>
                              </div>
                              {order.users.phone && (
                                <div>
                                  <div className="font-medium text-gray-700">
                                    Phone
                                  </div>
                                  <div className="text-gray-900 break-words">
                                    {order.users.phone}
                                  </div>
                                </div>
                              )}
                              {order.users.address && (
                                <div>
                                  <div className="font-medium text-gray-700">
                                    Address
                                  </div>
                                  <div className="text-gray-900 whitespace-pre-line break-words">
                                    {order.users.address}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Shipping info & timeline */}
                          <div>
                            <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-4 flex items-center">
                              <Package className="h-5 w-5 mr-2" />
                              Order Details
                            </h4>
                            <div className="text-xs md:text-sm space-y-3">
                              <div>
                                <div className="font-medium text-gray-700 mb-1">
                                  Shipping Address
                                </div>
                                <div className="text-gray-900 whitespace-pre-line break-words">
                                  {order.shipping_info}
                                </div>
                              </div>
                              <div className="pt-2 border-t">
                                <div className="font-medium text-gray-700">
                                  Order Timeline
                                </div>
                                <div className="mt-2 space-y-1">
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
                                  {order.updated_by_user && (
                                    <div className="flex justify-between items-start">
                                      <span className="text-gray-600">
                                        Updated By:
                                      </span>
                                      <div className="text-right">
                                        <div className="text-gray-900 font-medium">
                                          {order.updated_by_user.name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {order.updated_by_user.email}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Order Items */}
                          <div className="md:col-span-2">
                            <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
                              Order Items
                            </h4>
                            <div className="space-y-4">
                              {order.order_items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-lg p-4 gap-4"
                                >
                                  <div className="flex items-center flex-1 min-w-0">
                                    <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                                      {item.products.images?.[0] ? (
                                        <img
                                          src={item.products.images[0]}
                                          alt={item.products.title}
                                          className="h-full w-full object-cover rounded-lg"
                                        />
                                      ) : (
                                        <Package className="h-8 w-8 text-gray-400" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-medium text-gray-900 truncate">
                                        <Link href={item.products.link}>
                                          {item.products.title}
                                        </Link>
                                      </div>
                                      {(item.product_variants ||
                                        item.selected_options) && (
                                        <div className="mt-1 text-xs md:text-sm text-gray-500 flex flex-wrap gap-x-3">
                                          {item.product_variants?.color && (
                                            <span>
                                              Color:{" "}
                                              {item.product_variants.color}
                                            </span>
                                          )}
                                          {item.product_variants?.size && (
                                            <span>
                                              Size: {item.product_variants.size}
                                            </span>
                                          )}
                                          {item.product_variants?.unit && (
                                            <span>
                                              Unit: {item.product_variants.unit}
                                            </span>
                                          )}
                                          {!item.product_variants &&
                                            item.selected_options?.color && (
                                              <span>
                                                Color:{" "}
                                                {item.selected_options.color}
                                              </span>
                                            )}
                                          {!item.product_variants &&
                                            item.selected_options?.size && (
                                              <span>
                                                Size:{" "}
                                                {item.selected_options.size}
                                              </span>
                                            )}
                                        </div>
                                      )}
                                      <div className="mt-1 text-xs md:text-sm text-gray-600">
                                        Quantity: {item.quantity}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right sm:text-left sm:ml-auto">
                                    <div className="text-base md:text-lg font-bold text-gray-900">
                                      Br{" "}
                                      {(
                                        item.price * item.quantity
                                      ).toLocaleString("en-US")}
                                    </div>
                                    <div className="text-xs md:text-sm text-gray-500">
                                      Br {item.price.toLocaleString("en-US")}{" "}
                                      each
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Order Summary */}
                            <div className="mt-6 border-t pt-6">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                  <div className="text-xs md:text-sm text-gray-600">
                                    Total
                                  </div>
                                  <div className="text-xl md:text-2xl font-bold text-gray-900">
                                    Br{" "}
                                    {order.total_price.toLocaleString("en-US")}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs md:text-sm font-medium ${getStatusColor(order.status)}`}
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
        <div className="text-xs md:text-sm text-gray-600">
          Showing {filteredOrders.length} of {orders.length} orders
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteModalOpen}
        onOpenChange={() => setDeleteModalOpen(false)}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete order{" "}
              {orderToDelete?.orderNumber
                ? `#${orderToDelete.orderNumber}`
                : `ref ${orderToDelete?.id.slice(0, 8)}`}
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading === orderToDelete?.id}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteLoading === orderToDelete?.id}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading === orderToDelete?.id ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
