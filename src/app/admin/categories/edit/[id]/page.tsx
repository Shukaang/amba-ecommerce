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
import { Loader2, Upload, X } from "lucide-react";
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
  });

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [keepCurrentImage, setKeepCurrentImage] = useState(true); // track if we keep existing

  useEffect(() => {
    fetchData();
  }, [categoryId]);

  // Clean up preview URL
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

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
        const filteredCategories = categoriesData.categories.filter(
          (cat: Category) => cat.id !== categoryId,
        );
        setCategories(filteredCategories);
        const options = buildCategoryOptions(filteredCategories);
        setParentOptions(options);
      }

      if (categoryRes.ok) {
        setCategory(categoryData.category);
        setFormData({
          title: categoryData.category.title,
          description: categoryData.category.description || "",
          parent_id: categoryData.category.parent_id || "",
        });
        if (categoryData.category.image) {
          setExistingImage(categoryData.category.image);
        }
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    // If there was an existing image, we'll replace it
    setKeepCurrentImage(false);
    // Clear existing image display
    setExistingImage(null);
  };

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImageFile(null);
      setImagePreview(null);
    }
    if (existingImage) {
      setExistingImage(null);
    }
    setKeepCurrentImage(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description || "");
      formDataToSend.append("parent_id", formData.parent_id || "null");
      formDataToSend.append(
        "keepCurrentImage",
        keepCurrentImage ? "true" : "false",
      );
      if (imageFile) formDataToSend.append("image", imageFile);

      const res = await fetch(`/api/categories/${categoryId}`, {
        method: "PUT",
        body: formDataToSend,
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

              {/* Image upload */}
              <div className="space-y-2">
                <Label htmlFor="image">Category Image (optional)</Label>
                <div className="flex items-center gap-4">
                  {existingImage && !imagePreview && (
                    <div className="relative w-24 h-24 border rounded-md overflow-hidden">
                      <img
                        src={existingImage}
                        alt="Current category"
                        className="object-cover fill"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {imagePreview && (
                    <div className="relative w-24 h-24 border rounded-md overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="New preview"
                        className="object-cover fill"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {!existingImage && !imagePreview && (
                    <label className="w-24 h-24 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-[#f73a00]">
                      <Upload className="h-6 w-6 text-gray-400" />
                      <span className="text-xs text-gray-500">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Supported formats: JPEG, PNG, GIF
                </p>
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
