"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Edit,
  Trash2,
  Folder,
  FolderOpen,
  Image as ImageIcon,
} from "lucide-react";

interface Category {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  parent_id: string | null;
  created_at: string;
}

interface CategoryNode extends Category {
  children: CategoryNode[];
}

interface CategoriesTableProps {
  categories: Category[];
}

export default function CategoriesTable({ categories }: CategoriesTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const categoryTree = useMemo(() => {
    const map = new Map<string, CategoryNode>();
    categories.forEach((cat) => map.set(cat.id, { ...cat, children: [] }));
    const roots: CategoryNode[] = [];
    categories.forEach((cat) => {
      const node = map.get(cat.id)!;
      if (cat.parent_id && map.has(cat.parent_id)) {
        map.get(cat.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }, [categories]);

  const matchesSearch = (category: CategoryNode): boolean => {
    const query = searchQuery.toLowerCase();
    return (
      category.title.toLowerCase().includes(query) ||
      category.description?.toLowerCase().includes(query) ||
      category.children.some(matchesSearch)
    );
  };

  const handleDelete = async (categoryId: string, categoryTitle: string) => {
    if (confirm(`Are you sure you want to delete "${categoryTitle}"?`)) {
      try {
        const res = await fetch(`/api/categories/${categoryId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          alert("Category deleted successfully");
          window.location.reload();
        } else {
          const data = await res.json();
          alert(data.error || "Failed to delete category");
        }
      } catch (error) {
        console.error("Delete error:", error);
        alert("Failed to delete category");
      }
    }
  };

  // ✅ Use React.ReactElement[] instead of JSX.Element[]
  const renderTree = (
    nodes: CategoryNode[],
    level = 0,
  ): React.ReactElement[] => {
    return nodes.flatMap((cat) => {
      if (searchQuery && !matchesSearch(cat)) return [];

      const isMainCategory = !cat.parent_id;

      return [
        <tr key={cat.id} className="hover:bg-gray-50">
          <td className="px-6 py-4">
            <div
              className="flex items-center gap-3"
              style={{ paddingLeft: `${level * 24}px` }}
            >
              {cat.children.length > 0 ? (
                <FolderOpen className="h-4 w-4 text-blue-500 shrink-0" />
              ) : (
                <Folder className="h-4 w-4 text-gray-400 shrink-0" />
              )}

              {isMainCategory && cat.image ? (
                <div className="h-10 w-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center shrink-0">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (
                        e.target as HTMLImageElement
                      ).nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                  <ImageIcon className="h-4 w-4 text-gray-400 hidden" />
                </div>
              ) : isMainCategory ? (
                <div className="h-10 w-10 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
                  <ImageIcon className="h-4 w-4 text-gray-400" />
                </div>
              ) : (
                <div className="h-10 w-10 shrink-0"></div>
              )}

              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {cat.title}
                  {!isMainCategory && (
                    <span className="ml-2 text-xs text-gray-500">
                      (Subcategory)
                    </span>
                  )}
                </div>
                {cat.description && (
                  <div className="text-xs text-gray-500 truncate mt-1">
                    {cat.description}
                  </div>
                )}
              </div>
            </div>
          </td>

          <td className="px-6 py-4 text-sm">
            {isMainCategory ? (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                Main Category
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                Subcategory
              </span>
            )}
          </td>

          <td className="px-6 py-4 text-sm text-gray-500">
            {new Date(cat.created_at).toLocaleDateString()}
          </td>

          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <Link
                href={`/admin/categories/edit/${cat.id}`}
                className="text-blue-600 hover:text-blue-900 transition-colors"
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </Link>
              <button
                onClick={() => handleDelete(cat.id, cat.title)}
                className="text-red-600 hover:text-red-900 transition-colors"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </td>
        </tr>,

        ...renderTree(cat.children, level + 1),
      ];
    });
  };

  return (
    <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
      {/* Search */}
      <div className="p-4 border-b">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 max-w-lg">
            <input
              type="search"
              placeholder="Search categories by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="text-sm text-gray-500">
            {categoryTree.length} main categories • {categories.length} total
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
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
            {renderTree(categoryTree)}
          </tbody>
        </table>
      </div>

      {categories.length === 0 && (
        <div className="p-8 text-center">
          <div className="text-gray-400 mb-2">No categories found</div>
          <p className="text-sm text-gray-500">
            Create your first category to get started
          </p>
        </div>
      )}
    </div>
  );
}
