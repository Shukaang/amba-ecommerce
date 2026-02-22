"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  title: string;
  description: string | null;
  parent_id: string | null;
  image: string | null;
}

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [parentOptions, setParentOptions] = useState<
    { id: string; title: string; depth: number }[]
  >([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    parent_id: "",
    image: "",
  });

  useEffect(() => {
    fetchData();
  }, [categoryId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, categoryRes] = await Promise.all([
        fetch("/api/categories?all=true"),
        fetch(`/api/categories/${categoryId}`),
      ]);

      const categoriesData = await categoriesRes.json();
      const categoryData = await categoryRes.json();

      if (categoriesRes.ok) {
        // Filter out current category and its descendants to prevent circular references
        const filteredCategories = categoriesData.categories.filter(
          (cat: Category) => cat.id !== categoryId,
        );
        setCategories(filteredCategories);

        // Build options with indentation from filtered categories
        const options = buildCategoryOptions(filteredCategories);
        setParentOptions(options);
      }

      if (categoryRes.ok) {
        setCategory(categoryData.category);
        setFormData({
          title: categoryData.category.title,
          description: categoryData.category.description || "",
          parent_id: categoryData.category.parent_id || "",
          image: categoryData.category.image || "",
        });
      } else {
        toast.error("Category not found");
        router.push("/admin/categories");
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load category data");
    } finally {
      setLoading(false);
    }
  };

  const buildCategoryOptions = (
    cats: Category[],
    parentId: string | null = null,
    depth = 0,
  ): { id: string; title: string; depth: number }[] => {
    let options: { id: string; title: string; depth: number }[] = [];
    const children = cats
      .filter((cat) => (cat.parent_id || null) === parentId)
      .sort((a, b) => a.title.localeCompare(b.title));

    for (const child of children) {
      options.push({ id: child.id, title: child.title, depth });
      options = options.concat(buildCategoryOptions(cats, child.id, depth + 1));
    }
    return options;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          parent_id: formData.parent_id === "null" ? null : formData.parent_id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update category");
      }

      toast.success("Category updated successfully!");
      router.push("/admin/categories");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this category? Products in this category will become uncategorized.",
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete category");
      }

      toast.success("Category deleted successfully!");
      router.push("/admin/categories");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-400">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">Category not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Category</h1>
        <p className="text-gray-600">Update category information</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Category Information</CardTitle>
            <CardDescription>Update category details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Category Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter category name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter category description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="parent_id">Parent Category</Label>
                <Select
                  value={formData.parent_id}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, parent_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    <SelectItem value="null">None (Main Category)</SelectItem>
                    {parentOptions.map((option) => (
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

              <div className="space-y-2">
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  name="image"
                  type="url"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-6">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
              >
                Delete Category
              </Button>

              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/categories")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
