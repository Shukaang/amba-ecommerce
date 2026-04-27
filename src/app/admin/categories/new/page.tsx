"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { getSupabaseImage } from "@/lib/utils/supabase-image";

interface Category {
  id: string;
  title: string;
  parent_id: string | null;
}

export default function NewCategoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [parentOptions, setParentOptions] = useState<
    { id: string; title: string; depth: number }[]
  >([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    parent_id: "",
  });

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Clean up preview URL
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (res.ok) {
        setCategories(data.categories);
        const options = buildCategoryOptions(data.categories);
        setParentOptions(options);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast.error("Failed to load categories");
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
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description || "");
      formDataToSend.append("parent_id", formData.parent_id || "null");
      if (imageFile) formDataToSend.append("image", imageFile);

      const res = await fetch("/api/categories", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create category");
      }

      toast.success("Category created successfully!");
      router.push("/admin/categories");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Add New Category
        </h1>
        <p className="text-gray-600">Create a new category or subcategory</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900">
              Category Information
            </CardTitle>
            <CardDescription className="text-gray-600">
              Enter category details
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
                      None (Main Category)
                    </SelectItem>
                    {parentOptions.map((option) => (
                      <SelectItem
                        key={option.id}
                        value={option.id}
                        className={
                          option.depth > 0
                            ? "pl-6 text-gray-900 hover:bg-gray-100"
                            : "text-gray-900 hover:bg-gray-100"
                        }
                      >
                        {option.title}
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
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <div className="relative w-24 h-24 border border-gray-300 rounded-md overflow-hidden bg-gray-50">
                      <Image
                        src={getSupabaseImage(imagePreview, 500)}
                        alt="Category preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
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

            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/categories")}
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#f73a00] hover:bg-[#f73a00]/90 text-white"
              >
                {loading ? "Creating..." : "Create Category"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
