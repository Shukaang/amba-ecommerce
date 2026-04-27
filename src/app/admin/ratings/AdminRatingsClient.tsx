"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Star,
  Search,
  CheckCircle,
  XCircle,
  Trash2,
  Filter,
  RefreshCw,
  Clock,
  Package,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { getSupabaseImage } from "@/lib/utils/supabase-image";

interface Rating {
  id: string;
  rating: number;
  review: string | null;
  moderated: boolean;
  created_at: string;
  product: {
    id: string;
    title: string;
    images: string[];
    slug: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface AdminRatingsClientProps {
  initialRatings: Rating[];
}

export function AdminRatingsClient({
  initialRatings,
}: AdminRatingsClientProps) {
  const [ratings, setRatings] = useState<Rating[]>(initialRatings);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved"
  >("all");
  const [ratingFilter, setRatingFilter] = useState<number | "all">("all");
  const [selectedRating, setSelectedRating] = useState<Rating | null>(null);
  const [deletingRating, setDeletingRating] = useState<Rating | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter ratings
  const filteredRatings = ratings.filter((rating) => {
    if (statusFilter === "pending" && rating.moderated) return false;
    if (statusFilter === "approved" && !rating.moderated) return false;
    if (ratingFilter !== "all" && rating.rating !== ratingFilter) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        rating.product.title.toLowerCase().includes(searchLower) ||
        rating.user.name.toLowerCase().includes(searchLower) ||
        rating.user.email.toLowerCase().includes(searchLower) ||
        rating.review?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredRatings.length / itemsPerPage);
  const paginatedRatings = filteredRatings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const stats = {
    total: ratings.length,
    pending: ratings.filter((r) => !r.moderated).length,
    approved: ratings.filter((r) => r.moderated).length,
    average:
      ratings.length > 0
        ? (
            ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length
          ).toFixed(1)
        : "0.0",
  };

  const handleModerate = async (ratingId: string, moderated: boolean) => {
    try {
      const response = await fetch(`/api/admin/ratings/${ratingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ moderated }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        throw new Error("Server returned an invalid response");
      }

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to moderate rating");

      setRatings(
        ratings.map((r) => (r.id === ratingId ? { ...r, moderated } : r)),
      );
      toast.success(
        <div className="flex items-center gap-2">
          <span>Rating {moderated ? "approved" : "set to pending"}!</span>
        </div>,
      );
    } catch (error: any) {
      console.error("Moderate error:", error);
      toast.error(error.message || "Failed to moderate rating");
    }
  };

  const handleDelete = async () => {
    if (!deletingRating) return;
    try {
      const response = await fetch(`/api/admin/ratings/${deletingRating.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        throw new Error("Server returned an invalid response");
      }

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to delete rating");

      setRatings(ratings.filter((r) => r.id !== deletingRating.id));
      setDeletingRating(null);
      toast.success(
        <div className="flex items-center gap-2">
          <span>Rating deleted successfully</span>
        </div>,
      );
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete rating");
    }
  };

  const refreshRatings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/ratings");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setRatings(data.ratings);
      toast.success("Ratings refreshed");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const renderStars = (rating: number, size: "sm" | "md" | "lg" = "md") => {
    const sizes = { sm: "h-3 w-3", md: "h-4 w-4", lg: "h-5 w-5" };
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizes[size]} ${
              star <= rating
                ? "fill-[#f73a00] text-[#f73a00]"
                : "fill-gray-100 text-gray-100"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Ratings Moderation
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and moderate customer reviews
          </p>
        </div>
        <Button
          onClick={refreshRatings}
          variant="outline"
          className="gap-2 border-gray-300 text-gray-700 hover:bg-gray-100 w-full sm:w-auto"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-gray-200 to-gray-100 text-white border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900 font-medium opacity-90">
              Total Ratings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-slate-900 font-bold">
              {stats.total}
            </div>
            <p className="text-xs text-gray-600 opacity-75 mt-1">
              All time reviews
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-300 to-slate-400 text-white border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-900 font-medium opacity-90">
              Average Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-slate-900 font-bold">
              {stats.average}
            </div>
            <div className="mt-1">
              {renderStars(parseFloat(stats.average), "sm")}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pending}</div>
            <p className="text-xs opacity-75 mt-1">Awaiting moderation</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.approved}</div>
            <p className="text-xs opacity-75 mt-1">Published reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200 bg-white">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search reviews..."
                className="pl-10 bg-white border-gray-300 text-gray-900"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value: any) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                <Filter className="h-4 w-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem
                  value="all"
                  className="text-gray-900 hover:bg-gray-100"
                >
                  All Status
                </SelectItem>
                <SelectItem
                  value="pending"
                  className="text-gray-900 hover:bg-gray-100"
                >
                  Pending
                </SelectItem>
                <SelectItem
                  value="approved"
                  className="text-gray-900 hover:bg-gray-100"
                >
                  Approved
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={ratingFilter.toString()}
              onValueChange={(value) => {
                setRatingFilter(value === "all" ? "all" : parseInt(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                <Star className="h-4 w-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem
                  value="all"
                  className="text-gray-900 hover:bg-gray-100"
                >
                  All Ratings
                </SelectItem>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <SelectItem
                    key={rating}
                    value={rating.toString()}
                    className="text-gray-900 hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      {renderStars(rating, "sm")}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-sm text-gray-600 flex items-center justify-end">
              Showing {paginatedRatings.length} of {filteredRatings.length}{" "}
              reviews
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ratings List */}
      <Card className="border border-gray-200 bg-white overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-full bg-gray-200" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/4 bg-gray-200" />
                    <Skeleton className="h-4 w-1/3 bg-gray-200" />
                    <Skeleton className="h-20 w-full bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : paginatedRatings.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <MessageSquare className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No reviews found
              </h3>
              <p className="text-gray-600">
                {search || statusFilter !== "all" || ratingFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No reviews have been submitted yet"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {paginatedRatings.map((rating) => (
                <div
                  key={rating.id}
                  className="p-4 sm:p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* User Avatar and Info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <Avatar className="h-12 w-12 ring-2 ring-[#f73a00]/20 flex-shrink-0">
                        <AvatarFallback className="bg-[#f73a00] text-white">
                          {getUserInitials(rating.user.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-semibold text-gray-900">
                            {rating.user.name}
                          </span>
                          <span className="text-sm text-gray-500 truncate">
                            {rating.user.email}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-xs border-gray-300 text-gray-500"
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDistanceToNow(new Date(rating.created_at), {
                              addSuffix: true,
                            })}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mb-3">
                          {renderStars(rating.rating, "md")}
                          <Badge
                            variant={rating.moderated ? "default" : "outline"}
                            className={
                              rating.moderated
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-yellow-100 text-yellow-800 border-yellow-200"
                            }
                          >
                            {rating.moderated ? "Approved" : "Pending"}
                          </Badge>
                        </div>

                        {rating.review && (
                          <div className="bg-gray-50 rounded-lg p-4 mb-3">
                            <p className="text-gray-700 whitespace-pre-wrap">
                              "{rating.review}"
                            </p>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Package className="h-4 w-4" />
                          <span>Product: </span>
                          <button
                            onClick={() => setSelectedRating(rating)}
                            className="text-[#f73a00] hover:text-[#f73a00]/80 font-medium hover:underline"
                          >
                            {rating.product.title}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-row sm:flex-col items-center gap-2 sm:ml-4 flex-shrink-0">
                      {!rating.moderated ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleModerate(rating.id, true)}
                            className="bg-green-600 hover:bg-green-700 text-white w-full"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span className="">Approve</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleModerate(rating.id, false)}
                            className="border-red-300 text-red-700 hover:bg-red-50 w-full"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            <span className="">Reject</span>
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleModerate(rating.id, false)}
                          className="border-yellow-300 text-yellow-700 hover:bg-yellow-50 w-full"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          <span className="">Set Pending</span>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeletingRating(rating)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <CardFooter className="flex flex-col sm:flex-row sm:justify-between items-center gap-4 border-t border-gray-200 px-6 py-4 bg-white">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* View Product Dialog */}
      <Dialog
        open={!!selectedRating}
        onOpenChange={() => setSelectedRating(null)}
      >
        <DialogContent className="sm:max-w-2xl bg-white border border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Product Details</DialogTitle>
            <DialogDescription className="text-gray-600">
              View the product that this review is for
            </DialogDescription>
          </DialogHeader>
          {selectedRating && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                  {selectedRating.product.images?.[0] ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={getSupabaseImage(
                          selectedRating.product.images[0],
                          300,
                        )}
                        alt={selectedRating.product.title}
                        fill
                        sizes="128px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {selectedRating.product.title}
                  </h3>
                  <div className="flex items-center gap-4 mb-4">
                    {renderStars(selectedRating.rating, "lg")}
                    <span className="text-sm text-gray-500">
                      {selectedRating.rating}.0 average rating
                    </span>
                  </div>
                  {selectedRating.review && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 italic">
                        "{selectedRating.review}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  asChild
                  className="bg-[#f73a00] hover:bg-[#f73a00]/90 text-white"
                >
                  <Link href={`/products/${selectedRating.product.slug}`}>
                    View Product Page
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingRating}
        onOpenChange={() => setDeletingRating(null)}
      >
        <AlertDialogContent className="bg-white border border-gray-200 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-gray-900">
              Delete Review?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              This action cannot be undone. This will permanently delete the
              review from {deletingRating?.user.name} for "
              {deletingRating?.product.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="rounded-xl border-gray-300 text-gray-700 hover:bg-gray-100 mt-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
