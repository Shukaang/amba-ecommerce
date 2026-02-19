// components/products/rating-section.tsx
"use client";

import { useState } from "react";
import { Star, Trash2, Edit2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth/context";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Rating {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  product_id: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface RatingSectionProps {
  productId: string;
  initialRatings: Rating[];
  onRatingUpdate?: () => void;
}

export default function RatingSection({
  productId,
  initialRatings,
  onRatingUpdate,
}: RatingSectionProps) {
  const [ratings, setRatings] = useState<Rating[]>(initialRatings);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRating, setEditingRating] = useState<Rating | null>(null);
  const [ratingForm, setRatingForm] = useState({
    rating: 5,
    comment: "",
  });
  const { user } = useAuth();

  const averageRating = ratings.length
    ? ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length
    : 0;

  const userRating = ratings.find((r) => r.user_id === user?.id);
  const canRate = user && !userRating;

  const handleSubmitRating = async () => {
    if (!user) {
      toast.error("Please login to rate this product");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/products/${productId}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ratingForm),
      });

      if (!response.ok) throw new Error("Failed to submit rating");

      const { rating } = await response.json();

      // Add new rating to list
      const newRating = {
        ...rating,
        user: {
          id: user.id,
          name: user.name || user.email,
          email: user.email,
        },
      };

      setRatings([newRating, ...ratings]);
      setRatingForm({ rating: 5, comment: "" });
      toast.success("Rating submitted successfully!");

      if (onRatingUpdate) onRatingUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit rating");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRating = async () => {
    if (!user || !editingRating) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/products/${productId}/ratings/${editingRating.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ratingForm),
        },
      );

      if (!response.ok) throw new Error("Failed to update rating");

      const { rating } = await response.json();

      // Update rating in list
      setRatings(
        ratings.map((r) =>
          r.id === rating.id ? { ...rating, user: r.user } : r,
        ),
      );

      setEditingRating(null);
      setRatingForm({ rating: 5, comment: "" });
      toast.success("Rating updated successfully!");

      if (onRatingUpdate) onRatingUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to update rating");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRating = async (ratingId: string) => {
    if (!user) return;

    try {
      const response = await fetch(
        `/api/products/${productId}/ratings/${ratingId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) throw new Error("Failed to delete rating");

      setRatings(ratings.filter((r) => r.id !== ratingId));
      toast.success("Rating deleted successfully!");

      if (onRatingUpdate) onRatingUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete rating");
    }
  };

  const startEditing = (rating: Rating) => {
    setEditingRating(rating);
    setRatingForm({
      rating: rating.rating,
      comment: rating.comment || "",
    });
  };

  return (
    <div className="mt-12 space-y-8">
      {/* Rating Summary */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Customer Reviews
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-6 w-6 ${
                      star <= Math.round(averageRating)
                        ? "fill-orange-600 text-orange-600"
                        : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"
                    }`}
                  />
                ))}
              </div>
              <span className="text-lg font-semibold text-slate-900 dark:text-white">
                {averageRating.toFixed(1)} out of 5
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                ({ratings.length} {ratings.length === 1 ? "review" : "reviews"})
              </span>
            </div>
          </div>

          {/* Add Rating Button */}
          {canRate && (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                  Write a Review
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Write a Review</DialogTitle>
                </DialogHeader>
                <RatingForm
                  formData={ratingForm}
                  onChange={setRatingForm}
                  onSubmit={handleSubmitRating}
                  isSubmitting={isSubmitting}
                  submitLabel="Submit Review"
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Ratings List */}
      <div className="space-y-6">
        {ratings.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl">
            <p className="text-slate-500 dark:text-slate-400">
              No reviews yet. Be the first to review this product!
            </p>
          </div>
        ) : (
          ratings.map((rating) => (
            <div
              key={rating.id}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <User className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {rating.user?.name || rating.user?.email || "Anonymous"}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {formatDistanceToNow(new Date(rating.created_at), {
                        addSuffix: true,
                      })}
                      {rating.updated_at !== rating.created_at && " (edited)"}
                    </p>
                  </div>
                </div>

                {/* Rating Actions */}
                {user?.id === rating.user_id && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(rating)}
                      className="text-slate-600 hover:text-orange-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRating(rating.id)}
                      className="text-slate-600 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= rating.rating
                        ? "fill-orange-600 text-orange-600"
                        : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"
                    }`}
                  />
                ))}
              </div>

              {rating.comment && (
                <p className="text-slate-700 dark:text-slate-300">
                  {rating.comment}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Edit Rating Dialog */}
      <Dialog
        open={!!editingRating}
        onOpenChange={(open) => !open && setEditingRating(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Your Review</DialogTitle>
          </DialogHeader>
          <RatingForm
            formData={ratingForm}
            onChange={setRatingForm}
            onSubmit={handleUpdateRating}
            isSubmitting={isSubmitting}
            submitLabel="Update Review"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface RatingFormProps {
  formData: { rating: number; comment: string };
  onChange: (data: { rating: number; comment: string }) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}

function RatingForm({
  formData,
  onChange,
  onSubmit,
  isSubmitting,
  submitLabel,
}: RatingFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Rating
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange({ ...formData, rating: star })}
              className="focus:outline-none"
            >
              <Star
                className={`h-8 w-8 transition-colors ${
                  star <= formData.rating
                    ? "fill-orange-600 text-orange-600"
                    : "text-slate-300 dark:text-slate-600"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Comment (Optional)
        </label>
        <Textarea
          value={formData.comment}
          onChange={(e) => onChange({ ...formData, comment: e.target.value })}
          placeholder="Share your thoughts about this product..."
          rows={4}
        />
      </div>

      <Button
        onClick={onSubmit}
        disabled={isSubmitting}
        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
      >
        {isSubmitting ? "Submitting..." : submitLabel}
      </Button>
    </div>
  );
}
