"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  title: string;
  parent_id: string | null;
}

interface CategoryNode extends Category {
  children: CategoryNode[];
}

interface CategoryMenuProps {
  allCategories: Category[];
  categoryCounts: Record<string, number>;
  selectedCategoryId: string | null;
}

export default function CategoryMenu({
  allCategories,
  categoryCounts,
  selectedCategoryId,
}: CategoryMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [expandedMobileCats, setExpandedMobileCats] = useState<Set<string>>(
    new Set(),
  );

  // Build category tree
  const buildTree = (): CategoryNode[] => {
    const map = new Map<string, CategoryNode>();
    allCategories.forEach((cat) => {
      map.set(cat.id, { ...cat, children: [] });
    });
    const roots: CategoryNode[] = [];
    allCategories.forEach((cat) => {
      const node = map.get(cat.id)!;
      if (cat.parent_id && map.has(cat.parent_id)) {
        map.get(cat.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots.sort((a, b) => a.title.localeCompare(b.title));
  };

  const categoryTree = buildTree();

  // Desktop hover state
  const [hoveredCategory, setHoveredCategory] = useState<CategoryNode | null>(
    null,
  );
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = (cat: CategoryNode) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setHoveredCategory(cat);
  };

  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => {
      setHoveredCategory(null);
    }, 200);
  };

  // Navigate to category
  const navigateToCategory = (catId: string) => {
    const params = new URLSearchParams(window.location.search);
    if (catId === selectedCategoryId) {
      params.delete("category");
    } else {
      params.set("category", catId);
    }
    router.push(`${pathname}?${params.toString()}`);
    setMobileDrawerOpen(false);
    setExpandedMobileCats(new Set());
  };

  // Clear category filter
  const clearCategory = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete("category");
    router.push(`${pathname}?${params.toString()}`);
    setMobileDrawerOpen(false);
  };

  // Mobile accordion toggle
  const toggleMobileCategory = (catId: string) => {
    setExpandedMobileCats((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(catId)) {
        newSet.delete(catId);
      } else {
        newSet.add(catId);
      }
      return newSet;
    });
  };

  // Render desktop category item with optional flyout
  const renderDesktopCategory = (cat: CategoryNode) => {
    const hasChildren = cat.children.length > 0;
    const isSelected = cat.id === selectedCategoryId;
    const isHovered = hoveredCategory?.id === cat.id;

    return (
      <div
        key={cat.id}
        className="relative"
        onMouseEnter={() => hasChildren && handleMouseEnter(cat)}
        onMouseLeave={handleMouseLeave}
      >
        <button
          onClick={() => navigateToCategory(cat.id)}
          className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between group hover:bg-orange-50 ${
            isSelected
              ? "bg-orange-100 font-medium text-[#f73a00]"
              : "text-gray-700"
          }`}
        >
          <span className="truncate">{cat.title}</span>
          {hasChildren && (
            <ChevronRight className="h-4 w-4 ml-1 text-gray-400" />
          )}
        </button>

        {/* Flyout for children */}
        {hasChildren && isHovered && (
          <div
            className="absolute left-full top-0 ml-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[180px] z-50"
            onMouseEnter={() => handleMouseEnter(cat)}
            onMouseLeave={handleMouseLeave}
          >
            {cat.children.map((child) => (
              <button
                key={child.id}
                onClick={() => navigateToCategory(child.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm block hover:bg-orange-50 ${
                  child.id === selectedCategoryId
                    ? "bg-orange-100 font-medium text-[#f73a00]"
                    : "text-gray-700"
                }`}
              >
                {child.title}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Recursive render for mobile (accordion)
  const renderMobileCategory = (cat: CategoryNode, depth = 0) => {
    const hasChildren = cat.children.length > 0;
    const isExpanded = expandedMobileCats.has(cat.id);
    const isSelected = cat.id === selectedCategoryId;

    return (
      <div key={cat.id} className="border-b border-gray-100 last:border-0">
        <div className="flex items-center justify-between py-2">
          <button
            onClick={() =>
              hasChildren
                ? toggleMobileCategory(cat.id)
                : navigateToCategory(cat.id)
            }
            className={`flex-1 text-left px-2 py-1 rounded-md text-sm ${
              isSelected
                ? "bg-orange-100 font-medium text-[#f73a00]"
                : "text-gray-700"
            }`}
            style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
          >
            {cat.title}
          </button>
          {hasChildren && (
            <button
              onClick={() => toggleMobileCategory(cat.id)}
              className="p-2"
            >
              <ChevronRight
                className={`h-4 w-4 text-gray-700 transition-transform ${isExpanded ? "rotate-90" : ""}`}
              />
            </button>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {cat.children.map((child) =>
              renderMobileCategory(child, depth + 1),
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile filter button */}
      <div className="lg:hidden mb-4">
        <Button
          onClick={() => setMobileDrawerOpen(true)}
          className="w-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
        >
          <Menu className="h-4 w-4 mr-2" />
          Categories
        </Button>
      </div>

      {/* Desktop category menu */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-24">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
          {selectedCategoryId && (
            <button
              onClick={clearCategory}
              className="text-sm text-gray-500 hover:text-[#f73a00]"
            >
              Clear
            </button>
          )}
        </div>
        <div className="space-y-1">
          {categoryTree.map(renderDesktopCategory)}
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileDrawerOpen(false)}
          />
          {/* Drawer – width fits content, not full width */}
          <div className="absolute left-0 top-0 h-full w-auto min-w-48 max-w-xs bg-white shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Categories
              </h3>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              {selectedCategoryId && (
                <button
                  onClick={clearCategory}
                  className="mb-4 text-sm text-gray-500 hover:text-[#f73a00]"
                >
                  Clear filter
                </button>
              )}
              <div className="space-y-1">
                {categoryTree.map((cat) => renderMobileCategory(cat))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
