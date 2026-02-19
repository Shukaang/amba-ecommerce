"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface SubcategoryFilterProps {
  subcategories: { id: string; title: string }[];
  selectedSubcategory?: string;
}

export default function SubcategoryFilter({
  subcategories,
  selectedSubcategory,
}: SubcategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (subcategories.length === 0) return null;

  const handleSubcategoryClick = (subId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (subId === selectedSubcategory) {
      params.delete("subcategory");
    } else {
      params.set("subcategory", subId);
    }
    router.push(`/products?${params.toString()}`);
  };

  const handleClear = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("subcategory");
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Filter by Subcategory:
      </h3>
      <div className="flex flex-wrap gap-2">
        {subcategories.map((sub) => (
          <Button
            key={sub.id}
            variant={selectedSubcategory === sub.id ? "default" : "outline"}
            size="sm"
            onClick={() => handleSubcategoryClick(sub.id)}
            className={
              selectedSubcategory === sub.id
                ? "bg-[#f73a00] hover:bg-[#f73a00]/90 text-white"
                : "border-[#f73a00] text-[#f73a00] hover:bg-[#f73a00]/10"
            }
          >
            {sub.title}
          </Button>
        ))}
        {selectedSubcategory && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-gray-500 hover:text-gray-700"
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
