"use client";

import { useState, useMemo, useCallback, Fragment, useEffect } from "react";
import Link from "next/link";
import {
  Edit,
  Trash2,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Package,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/supabaseClient";

interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  link: string | null;
  price: number;
  average_rating: number;
  images: string[];
  status: "pending" | "approved" | "rejected";
  categories: {
    id: string;
    title: string;
  } | null;
  colors: string[];
  sizes: Array<{ name: string; price: number }>;
  product_variants?: Array<{
    id: string;
    color?: string;
    size?: string;
    unit?: string;
    price: number;
  }>;
  created_at: string;
  updated_at: string;
  created_by: {
    id: string;
    name: string;
    email: string;
  } | null;
  updated_by: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface Category {
  id: string;
  title: string;
  parent_id: string | null;
}

interface ProductsTableProps {
  products: Product[];
  categories: Category[];
}

const PAGE_SIZE = 20;

export default function ProductsTable({
  products: initialProducts,
  categories,
}: ProductsTableProps) {
  const { user } = useAuth();
  const supabase = createClient();
  const isSuperAdmin = user?.role === "SUPERADMIN";

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(
    null,
  );
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedStatus, sortBy]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("admin-products-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          // Refetch products when any change occurs
          fetchProducts();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
      } else {
        console.error("Failed to refetch products:", data.error);
      }
    } catch (error) {
      console.error("Error refetching products:", error);
    }
  };

  // Build category lookup map
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categories]);

  // Build parent → children map
  const categoryChildrenMap = useMemo(() => {
    const map = new Map<string, string[]>();
    categories.forEach((cat) => {
      if (cat.parent_id) {
        if (!map.has(cat.parent_id)) map.set(cat.parent_id, []);
        map.get(cat.parent_id)!.push(cat.id);
      }
    });
    return map;
  }, [categories]);

  // Get all descendant IDs of a category
  const getDescendantIds = useCallback(
    (catId: string): string[] => {
      const children = categoryChildrenMap.get(catId) || [];
      const descendants = [...children];
      children.forEach((childId) => {
        descendants.push(...getDescendantIds(childId));
      });
      return descendants;
    },
    [categoryChildrenMap],
  );

  // Get full category path for display
  const getCategoryPath = useCallback(
    (catId: string | null): string => {
      if (!catId) return "Uncategorized";
      const path: string[] = [];
      let current: Category | undefined = categoryMap.get(catId);
      while (current) {
        path.unshift(current.title);
        if (!current.parent_id) break;
        current = categoryMap.get(current.parent_id);
      }
      return path.join(" > ");
    },
    [categoryMap],
  );

  // Build category options with indentation depth
  const categoryOptions = useMemo(() => {
    const buildOptions = (
      parentId: string | null = null,
      depth = 0,
    ): { id: string; title: string; depth: number }[] => {
      return categories
        .filter((cat) => (cat.parent_id || null) === parentId)
        .sort((a, b) => a.title.localeCompare(b.title))
        .flatMap((cat) => [
          { id: cat.id, title: cat.title, depth },
          ...buildOptions(cat.id, depth + 1),
        ]);
    };
    return buildOptions(null);
  }, [categories]);

  // Allowed category IDs (selected category + all its descendants)
  const allowedCategoryIds = useMemo(() => {
    if (selectedCategory === "all") return null;
    return new Set([selectedCategory, ...getDescendantIds(selectedCategory)]);
  }, [selectedCategory, getDescendantIds]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesSearch = product.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

        const matchesCategory =
          allowedCategoryIds === null ||
          (product.categories?.id &&
            allowedCategoryIds.has(product.categories.id));

        const matchesStatus =
          selectedStatus === "all" || product.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "price-low":
            return a.price - b.price;
          case "price-high":
            return b.price - a.price;
          case "rating":
            return b.average_rating - a.average_rating;
          case "newest":
          default:
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
        }
      });
  }, [products, searchQuery, allowedCategoryIds, selectedStatus, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  const toggleExpand = (productId: string) => {
    setExpandedProductId(expandedProductId === productId ? null : productId);
  };

  const handleDeleteClick = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setProductToDelete(product);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/products/${productToDelete.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle non-200 responses (like 500, 404)
        toast.error(data.error || "Failed to delete product");
        return;
      }

      // Success – remove from UI (product is now either soft-deleted or permanently deleted)
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));

      // Show appropriate message based on whether it was soft or hard deleted
      if (data.softDelete) {
        toast.success(
          "Product has been hidden (soft deleted) because it has orders.",
        );
      } else {
        toast.success("Product deleted permanently.");
      }

      setProductToDelete(null);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete product");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (
    productId: string,
    newStatus: "pending" | "approved" | "rejected",
    e?: React.MouseEvent,
  ) => {
    if (e) e.stopPropagation();

    // Optimistically update UI
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              status: newStatus,
              updated_by: user
                ? { id: user.id, name: user.name || "", email: user.email }
                : p.updated_by,
            }
          : p,
      ),
    );

    setStatusUpdating(productId);
    try {
      const res = await fetch(`/api/products/${productId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        // Revert on error
        const originalProduct = products.find((p) => p.id === productId);
        if (originalProduct) {
          setProducts((prev) =>
            prev.map((p) => (p.id === productId ? originalProduct : p)),
          );
        }
        const data = await res.json();
        toast.error(data.error || "Failed to update status");
      } else {
        toast.success(
          `Product ${newStatus === "approved" ? "approved" : newStatus === "rejected" ? "rejected" : "set to pending"} successfully`,
        );
      }
    } catch (error) {
      // Revert on error
      const originalProduct = products.find((p) => p.id === productId);
      if (originalProduct) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? originalProduct : p)),
        );
      }
      console.error("Status update error:", error);
      toast.error("Failed to update status");
    } finally {
      setStatusUpdating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Pending
          </Badge>
        );
    }
  };

  return (
    <>
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {/* Header with filters (unchanged) */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="pl-10 py-1.5 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-36 h-8 text-sm">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categoryOptions.map((option) => (
                      <SelectItem
                        key={option.id}
                        value={option.id}
                        className={option.depth > 0 ? "pl-6" : ""}
                      >
                        {option.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32 h-8 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32 h-8 text-sm">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price ↑</SelectItem>
                  <SelectItem value="price-high">Price ↓</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Products table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Category
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Rating
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedProducts.map((product) => (
                <Fragment key={product.id}>
                  {/* Main row (unchanged) */}
                  <tr
                    onClick={() => toggleExpand(product.id)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-2">
                      <div className="flex items-center">
                        <div className="shrink-0 h-10 w-10 bg-gray-200 rounded-md overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                              <Package className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-3 max-w-[120px] sm:max-w-[200px]">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {product.title}
                          </div>
                        </div>
                        {expandedProductId === product.id ? (
                          <ChevronUp className="ml-2 h-4 w-4 text-gray-400 shrink-0" />
                        ) : (
                          <ChevronDown className="ml-2 h-4 w-4 text-gray-400 shrink-0" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 hidden md:table-cell">
                      <Badge
                        variant="outline"
                        className="text-xs max-w-[150px] truncate"
                      >
                        {getCategoryPath(product.categories?.id || null)}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      Br {product.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap hidden sm:table-cell">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 mr-1">
                          {product.average_rating.toFixed(1)}
                        </span>
                        <span className="text-yellow-400 text-xs">★</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {getStatusBadge(product.status)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 text-indigo-600 hover:text-indigo-900 rounded hover:bg-indigo-50"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>

                        {isSuperAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                disabled={statusUpdating === product.id}
                                className="p-1 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-100"
                                title="Change status"
                              >
                                {statusUpdating === product.id ? (
                                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
                                ) : (
                                  <MoreVertical className="h-4 w-4" />
                                )}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) =>
                                  handleStatusChange(product.id, "pending", e)
                                }
                                disabled={product.status === "pending"}
                              >
                                Set Pending
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) =>
                                  handleStatusChange(product.id, "approved", e)
                                }
                                disabled={product.status === "approved"}
                              >
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) =>
                                  handleStatusChange(product.id, "rejected", e)
                                }
                                disabled={product.status === "rejected"}
                              >
                                Reject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}

                        {isSuperAdmin && (
                          <button
                            onClick={(e) => handleDeleteClick(product, e)}
                            className="p-1 text-red-600 hover:text-red-900 rounded hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded details – UPDATED to show colors and sizes */}
                  {expandedProductId === product.id && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-3 bg-gray-50 border-t border-gray-200"
                      >
                        <div className="space-y-3 text-sm">
                          {product.link && (
                            <div>
                              <h4 className="font-medium text-gray-700 mb-1">
                                External Link
                              </h4>
                              <a
                                href={product.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline break-all"
                              >
                                {product.link}
                              </a>
                            </div>
                          )}

                          {/* Colors */}
                          {product.colors && product.colors.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-700 mb-1">
                                Colors
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {product.colors.map((color) => (
                                  <Badge
                                    key={color}
                                    variant="outline"
                                    className="bg-white p-2 rounded border border-gray-200 text-xs font-medium text-gray-900"
                                  >
                                    {color}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Sizes */}
                          {product.sizes && product.sizes.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-700 mb-1">
                                Sizes & Prices
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {product.sizes.map((size) => {
                                  // Use size.price if it's a number > 0, otherwise use product.price
                                  const displayPrice =
                                    size.price && size.price > 0
                                      ? size.price
                                      : product.price;
                                  return (
                                    <div
                                      key={size.name}
                                      className="bg-white p-2 rounded border border-gray-200 text-xs"
                                    >
                                      <div className="font-medium text-gray-900">
                                        {size.name}
                                      </div>
                                      <div className="text-gray-600 mt-1">
                                        Br {displayPrice.toLocaleString()}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {/* Created / Updated info (unchanged) */}
                          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                            <div>
                              <h4 className="font-medium text-gray-700 mb-1">
                                Created
                              </h4>
                              <p className="text-xs text-gray-600">
                                {product.created_by ? (
                                  <>
                                    by {product.created_by.name} (
                                    {product.created_by.email})
                                  </>
                                ) : (
                                  "Unknown"
                                )}
                                <br />
                                {new Date(product.created_at).toLocaleString()}
                              </p>
                            </div>
                            {product.updated_by && (
                              <div>
                                <h4 className="font-medium text-gray-700 mb-1">
                                  Last Updated
                                </h4>
                                <p className="text-xs text-gray-600">
                                  by {product.updated_by.name} (
                                  {product.updated_by.email})
                                  <br />
                                  {new Date(
                                    product.updated_at,
                                  ).toLocaleString()}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="px-4 py-8 text-center">
              <div className="text-gray-400 mb-2">No products found</div>
              <p className="text-sm text-gray-500">
                {searchQuery ||
                selectedCategory !== "all" ||
                selectedStatus !== "all"
                  ? "Try changing your filters"
                  : "Add your first product to get started"}
              </p>
            </div>
          )}
        </div>

        {/* Pagination (unchanged) */}
        <div className="px-4 py-2 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-xs text-gray-700">
              Showing{" "}
              <span className="font-medium">
                {filteredProducts.length === 0
                  ? 0
                  : (currentPage - 1) * PAGE_SIZE + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(currentPage * PAGE_SIZE, filteredProducts.length)}
              </span>{" "}
              of <span className="font-medium">{filteredProducts.length}</span>{" "}
              products
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || filteredProducts.length === 0}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled
              >
                {currentPage}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={
                  currentPage === totalPages || filteredProducts.length === 0
                }
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog (unchanged) */}
      <AlertDialog
        open={!!productToDelete}
        onOpenChange={() => setProductToDelete(null)}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{productToDelete?.title}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} size="sm">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
              size="sm"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
