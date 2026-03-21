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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
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
  const [keepCurrentImage, setKeepCurrentImage] = useState(true);

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
        toast.error("Category not found", {
          duration: 1000,
        });
        router.push("/admin/categories");
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load category data", {
        duration: 1000,
      });
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
    setKeepCurrentImage(false);
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

      toast.success("Category updated successfully!", {
        duration: 1000,
      });
      router.push("/admin/categories");
    } catch (error: any) {
      toast.error(error.message, {
        duration: 1000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteModalOpen(false);
    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete category");
      }

      toast.success("Category deleted successfully!", {
        duration: 1000,
      });
      router.push("/admin/categories");
    } catch (error: any) {
      toast.error(error.message, {
        duration: 1000,
      });
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
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900">
              Category Information
            </CardTitle>
            <CardDescription className="text-gray-600">
              Update category details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 bg-white">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-700">
                Category Title *
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter category name"
                required
                className="bg-white border-gray-300 text-gray-900 focus:ring-[#f73a00] focus:border-[#f73a00]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-700">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter category description"
                rows={3}
                className="bg-white border-gray-300 text-gray-900 focus:ring-[#f73a00] focus:border-[#f73a00]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="parent_id" className="text-gray-700">
                  Parent Category
                </Label>
                <Select
                  value={formData.parent_id}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, parent_id: value }))
                  }
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Select parent category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem
                      value="null"
                      className="text-gray-900 hover:bg-gray-100"
                    >
                      None (Uncategorized)
                    </SelectItem>
                    {parentOptions.map((option) => (
                      <SelectItem
                        key={option.id}
                        value={option.id}
                        className={
                          option.depth > 0
                            ? "pl-6 text-gray-900 hover:bg-gray-100"
                            : "text-gray-900 font-bold hover:bg-gray-100"
                        }
                      >
                        {option.title}{" "}
                        <span className="font-normal">
                          {option.depth > 0 ? "" : "(main)"}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Image upload */}
              <div className="space-y-2">
                <Label htmlFor="image" className="text-gray-700">
                  Category Image (optional)
                </Label>
                <div className="flex items-center gap-4 flex-wrap">
                  {existingImage && !imagePreview && (
                    <div className="relative w-24 h-24 border border-gray-300 rounded-md overflow-hidden bg-gray-50">
                      <img
                        src={existingImage}
                        alt="Current category"
                        className="object-cover w-full h-full"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {imagePreview && (
                    <div className="relative w-24 h-24 border border-gray-300 rounded-md overflow-hidden bg-gray-50">
                      <img
                        src={imagePreview}
                        alt="New preview"
                        className="object-cover w-full h-full"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {!existingImage && !imagePreview && (
                    <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-[#f73a00] bg-white">
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

            {/* Action buttons - responsive */}
            <div className="flex flex-col sm:flex-row sm:justify-between items-stretch sm:items-center gap-3 pt-6">
              <Button
                type="button"
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white order-2 sm:order-1"
              >
                Delete Category
              </Button>

              <div className="flex flex-col sm:flex-row gap-3 order-1 sm:order-2">
                <Button
                  type="button"
                  onClick={() => router.push("/admin/categories")}
                  className="border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-100 w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-gray-900 hover:bg-gray-900/90 text-white w-full sm:w-auto"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent className="bg-white border border-gray-200 shadow-xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 text-lg font-semibold">
              Delete Category
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 text-sm">
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-900">
                {category?.title}
              </span>
              ? This action cannot be undone. Products in this category will
              become uncategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 mt-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
