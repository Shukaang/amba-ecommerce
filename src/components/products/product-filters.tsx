"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";

interface Category {
  id: string;
  title: string;
}

interface ProductFiltersProps {
  categories: Category[];
}

export default function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial values from URL params
  const initialMinPrice = searchParams.get("minPrice")
    ? parseInt(searchParams.get("minPrice")!)
    : 0;
  const initialMaxPrice = searchParams.get("maxPrice")
    ? parseInt(searchParams.get("maxPrice")!)
    : 1000;
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

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  const clearFilters = () => {
    setPriceRange([0, 1000]);
    setSelectedCategories([]);
    setMinRating(0);
    // Clear URL params
    router.push("/products");
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const parsedValue = value === "" ? 0 : parseInt(value) || 0;
    setPriceRange([parsedValue, priceRange[1]]);
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const parsedValue = value === "" ? 1000 : parseInt(value) || 1000;
    setPriceRange([priceRange[0], parsedValue]);
  };

  const applyFilters = () => {
    const params = new URLSearchParams();

    if (priceRange[0] > 0) params.set("minPrice", priceRange[0].toString());
    if (priceRange[1] < 1000) params.set("maxPrice", priceRange[1].toString());
    if (selectedCategories.length > 0)
      params.set("categories", selectedCategories.join(","));
    if (minRating > 0) params.set("minRating", minRating.toString());

    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filters
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-gray-600 hover:text-gray-900"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <Label className="text-sm font-medium text-gray-900 mb-3 block">
          Price Range
        </Label>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}</span>
          </div>
          <div className="flex space-x-2">
            <Input
              type="number"
              min="0"
              max="1000"
              value={priceRange[0]}
              onChange={handleMinPriceChange}
              className="w-1/2"
            />
            <Input
              type="number"
              min="0"
              max="1000"
              value={priceRange[1]}
              onChange={handleMaxPriceChange}
              className="w-1/2"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <Label className="text-sm font-medium text-gray-900 mb-3 block">
          Categories
        </Label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center">
              <input
                type="checkbox"
                id={`category-${category.id}`}
                checked={selectedCategories.includes(category.id)}
                onChange={() => handleCategoryToggle(category.id)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor={`category-${category.id}`}
                className="ml-2 text-sm text-gray-700 cursor-pointer"
              >
                {category.title}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Minimum Rating */}
      <div className="mb-6">
        <Label className="text-sm font-medium text-gray-900 mb-3 block">
          Minimum Rating
        </Label>
        <div className="flex items-center space-x-2">
          {[0, 1, 2, 3, 4].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => setMinRating(rating)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                minRating === rating
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {rating}+
            </button>
          ))}
        </div>
      </div>

      <Button className="w-full" onClick={applyFilters}>
        Apply Filters
      </Button>
    </div>
  );
}
