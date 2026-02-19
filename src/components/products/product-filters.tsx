"use client";

import { useState } from "react";
import { Filter, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useRouter, useSearchParams } from "next/navigation";

interface Category {
  id: string;
  title: string;
}

interface ProductFiltersProps {
  categories: Category[];
  categoryCounts: Record<string, number>; // counts including descendants
  totalProducts?: number;
}

export default function ProductFilters({
  categories,
  categoryCounts,
  totalProducts = 0,
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialMinPrice = searchParams.get("minPrice")
    ? parseInt(searchParams.get("minPrice")!)
    : 0;
  const initialMaxPrice = searchParams.get("maxPrice")
    ? parseInt(searchParams.get("maxPrice")!)
    : 10000;
  const initialCategories = searchParams.get("categories")?.split(",") || [];
  const initialMinRating = searchParams.get("minRating")
    ? parseInt(searchParams.get("minRating")!)
    : 0;

  const [priceRange, setPriceRange] = useState([
    initialMinPrice,
    initialMaxPrice,
  ]);
  const [selectedCategories, setSelectedCategories] =
    useState<string[]>(initialCategories);
  const [minRating, setMinRating] = useState(initialMinRating);
  const [isLoading, setIsLoading] = useState(false);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  const clearFilters = () => {
    setPriceRange([0, 10000]);
    setSelectedCategories([]);
    setMinRating(0);
    router.push("/products");
  };

  const handlePriceChange = (value: number[]) => {
    setPriceRange(value);
  };

  const applyFilters = () => {
    setIsLoading(true);
    const params = new URLSearchParams();

    if (priceRange[0] > 0) params.set("minPrice", priceRange[0].toString());
    if (priceRange[1] < 10000) params.set("maxPrice", priceRange[1].toString());
    if (selectedCategories.length > 0)
      params.set("categories", selectedCategories.join(","));
    if (minRating > 0) params.set("minRating", minRating.toString());

    router.push(`/products?${params.toString()}`);
    setIsLoading(false);
  };

  const ratingOptions = [0, 1, 2, 3, 4];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Filter className="h-5 w-5 mr-2 text-[#f73a00]" />
          Filters
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-gray-600 hover:text-[#f73a00]"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>

      {/* Total Products */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <p className="text-sm text-gray-600">
          Total Products:{" "}
          <span className="font-semibold text-gray-900">{totalProducts}</span>
        </p>
      </div>

      {/* Categories - now at top with descendant counts */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <Label className="text-sm font-medium text-gray-900 mb-4 block">
          Product Categories
        </Label>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between group"
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`category-${category.id}`}
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => handleCategoryToggle(category.id)}
                  className="h-4 w-4 rounded border-gray-300 text-[#f73a00] focus:ring-[#f73a00]"
                />
                <label
                  htmlFor={`category-${category.id}`}
                  className="ml-2 text-sm text-gray-700 cursor-pointer hover:text-[#f73a00] transition-colors"
                >
                  {category.title}
                </label>
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {categoryCounts[category.id] || 0}
              </span>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-gray-500 italic">No categories found</p>
          )}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <Label className="text-sm font-medium text-gray-900 mb-4 block">
          Price Range
        </Label>
        <div className="space-y-4">
          <Slider
            min={0}
            max={10000}
            step={10}
            value={priceRange}
            onValueChange={handlePriceChange}
            className="my-6"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">ETB</span>
              <Input
                type="number"
                min={0}
                max={10000}
                value={priceRange[0]}
                onChange={(e) =>
                  setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])
                }
                className="w-24 h-9"
              />
            </div>
            <span className="text-gray-400">—</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">ETB</span>
              <Input
                type="number"
                min={0}
                max={10000}
                value={priceRange[1]}
                onChange={(e) =>
                  setPriceRange([
                    priceRange[0],
                    parseInt(e.target.value) || 10000,
                  ])
                }
                className="w-24 h-9"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Minimum Rating */}
      <div className="mb-6">
        <Label className="text-sm font-medium text-gray-900 mb-4 block">
          Minimum Rating
        </Label>
        <div className="flex flex-wrap gap-2">
          {ratingOptions.map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => setMinRating(rating)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                minRating === rating
                  ? "bg-[#f73a00]/10 text-[#f73a00] border-2 border-[#f73a00]"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent"
              }`}
            >
              {rating === 0 ? (
                "Any"
              ) : (
                <>
                  {rating}+ <Star className="h-3 w-3 fill-current" />
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      <Button
        className="w-full bg-[#f73a00] hover:bg-[#d63200] text-white border-0"
        onClick={applyFilters}
        disabled={isLoading}
      >
        {isLoading ? "Applying..." : "Apply Filters"}
      </Button>

      {/* Active Filters */}
      {(priceRange[0] > 0 ||
        priceRange[1] < 10000 ||
        selectedCategories.length > 0 ||
        minRating > 0) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Active filters:</p>
          <div className="flex flex-wrap gap-2">
            {priceRange[0] > 0 && (
              <Badge
                variant="outline"
                className="text-xs border-[#f73a00] text-[#f73a00]"
              >
                Min: ETB {priceRange[0]}
              </Badge>
            )}
            {priceRange[1] < 10000 && (
              <Badge
                variant="outline"
                className="text-xs border-[#f73a00] text-[#f73a00]"
              >
                Max: ETB {priceRange[1]}
              </Badge>
            )}
            {selectedCategories.length > 0 && (
              <Badge
                variant="outline"
                className="text-xs border-[#f73a00] text-[#f73a00]"
              >
                {selectedCategories.length} categories
              </Badge>
            )}
            {minRating > 0 && (
              <Badge
                variant="outline"
                className="text-xs border-[#f73a00] text-[#f73a00]"
              >
                {minRating}+ stars
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
