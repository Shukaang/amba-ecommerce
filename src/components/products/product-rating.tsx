// components/products/product-rating.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, Edit2, Trash2, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/context";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Rating {
  id: string;
  rating: number;
  review: string | null;
  moderated: boolean;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface ProductRatingProps {
  productId: string;
  ratings: Rating[];
  onRatingSubmitted?: () => void;
}

export default function ProductRating({
  productId,
  ratings,
  onRatingSubmitted,
}: ProductRatingProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRating, setEditingRating] = useState<Rating | null>(null);
  const [deletingRating, setDeletingRating] = useState<Rating | null>(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  // Filter only moderated ratings for display
  const visibleRatings = ratings.filter((r) => r.moderated);

  // Find user's existing rating
  const userRating = ratings.find((r) => r.user.id === user?.id);

  const handleSubmitRating = async () => {
    if (!user) {
      toast.error("Please login to rate this product");
      return;
    }

    if (selectedRating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/products/${productId}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: selectedRating,
          review: reviewText || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit rating");
      }

      toast.success(
        "Rating submitted successfully! It will be visible after moderation.",
      );
      setSelectedRating(0);
      setReviewText("");
      setEditingRating(null);
      onRatingSubmitted?.();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRating = async () => {
    if (!editingRating) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/products/${productId}/ratings/${editingRating.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating: selectedRating,
            review: reviewText || null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update rating");
      }

      toast.success(
        "Rating updated successfully! It will be visible after moderation.",
      );
      setEditingRating(null);
      setSelectedRating(0);
      setReviewText("");
      onRatingSubmitted?.();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRating = async () => {
    if (!deletingRating) return;

    try {
      const response = await fetch(
        `/api/products/${productId}/ratings/${deletingRating.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete rating");
      }

      toast.success("Rating deleted successfully");
      setDeletingRating(null);
      onRatingSubmitted?.();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderStars = (rating: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={interactive ? () => setSelectedRating(star) : undefined}
            onMouseEnter={interactive ? () => setHoverRating(star) : undefined}
            onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
            disabled={!interactive}
            className={`${interactive ? "cursor-pointer" : "cursor-default"} focus:outline-none`}
          >
            <Star
              className={`h-5 w-5 ${
                star <= (interactive ? hoverRating || selectedRating : rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
              } ${interactive && "hover:scale-110 transition-transform"}`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Customer Reviews ({visibleRatings.length})
      </h2>

      {/* Write Review Section */}
      {user ? (
        userRating ? (
          <div className="mb-8 p-6 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Your Review
              </h3>
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingRating(userRating);
                        setSelectedRating(userRating.rating);
                        setReviewText(userRating.review || "");
                      }}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Your Review</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Your Rating
                        </label>
                        {renderStars(selectedRating, true)}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Your Review (Optional)
                        </label>
                        <Textarea
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder="Share your thoughts about this product..."
                          maxLength={500}
                          rows={4}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {reviewText.length}/500 characters
                        </p>
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingRating(null);
                            setSelectedRating(0);
                            setReviewText("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleUpdateRating}
                          disabled={isSubmitting || selectedRating === 0}
                        >
                          {isSubmitting ? "Updating..." : "Update Review"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeletingRating(userRating)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              {renderStars(userRating.rating)}
              {!userRating.moderated && (
                <Badge
                  variant="outline"
                  className="text-yellow-600 border-yellow-600"
                >
                  Pending Moderation
                </Badge>
              )}
            </div>
            {userRating.review && (
              <p className="text-gray-700 dark:text-gray-300">
                {userRating.review}
              </p>
            )}
          </div>
        ) : (
          <div className="mb-8 p-6 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Write a Review
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Your Rating <span className="text-red-500">*</span>
                </label>
                {renderStars(selectedRating, true)}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Your Review (Optional)
                </label>
                <Textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your thoughts about this product..."
                  maxLength={500}
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {reviewText.length}/500 characters
                </p>
              </div>
              <Button
                onClick={handleSubmitRating}
                disabled={isSubmitting || selectedRating === 0}
              >
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </div>
        )
      ) : (
        <div className="mb-8 p-6 bg-gray-50 dark:bg-slate-800/50 rounded-xl text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Please{" "}
            <Link href="/login" className="text-primary hover:underline">
              login
            </Link>{" "}
            to write a review
          </p>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {visibleRatings.length > 0 ? (
          visibleRatings.map((rating) => (
            <div
              key={rating.id}
              className="p-6 border border-gray-200 dark:border-slate-700 rounded-xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      {getUserInitials(rating.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {rating.user.name}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(rating.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </div>
                {renderStars(rating.rating)}
              </div>
              {rating.review && (
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {rating.review}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No reviews yet. Be the first to review this product!
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingRating}
        onOpenChange={() => setDeletingRating(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              review.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRating}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
