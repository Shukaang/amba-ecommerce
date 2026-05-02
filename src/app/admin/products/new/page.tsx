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
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Trash2, Package, Upload, X } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { getSupabaseImage } from "@/lib/utils/supabase-image";

interface Category {
  id: string;
  title: string;
  parent_id: string | null;
}

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTree, setCategoryTree] = useState<
    { root: Category; children: Category[] }[]
  >([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    link: "",
    category_id: "",
    price: "",
  });

  // Colors and sizes – now optional, prices optional for sizes
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<{ name: string; price: number | null }[]>(
    [],
  );

  // Images
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainPreview, setMainPreview] = useState<string | null>(null);
  const [secondaryImage, setSecondaryImage] = useState<File | null>(null);
  const [secondaryPreview, setSecondaryPreview] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    return () => {
      if (mainPreview) URL.revokeObjectURL(mainPreview);
      if (secondaryPreview) URL.revokeObjectURL(secondaryPreview);
      additionalPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [mainPreview, secondaryPreview, additionalPreviews]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (res.ok) {
        setCategories(data.categories);
        const childrenMap = new Map<string, Category[]>();
        const roots: Category[] = [];
        data.categories.forEach((cat: Category) => {
          if (cat.parent_id) {
            if (!childrenMap.has(cat.parent_id)) {
              childrenMap.set(cat.parent_id, []);
            }
            childrenMap.get(cat.parent_id)!.push(cat);
          } else {
            roots.push(cat);
          }
        });
        roots.sort((a, b) => a.title.localeCompare(b.title));
        const tree = roots.map((root) => ({
          root,
          children: (childrenMap.get(root.id) || []).sort((a, b) =>
            a.title.localeCompare(b.title),
          ),
        }));
        setCategoryTree(tree);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast.error("Failed to load categories");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Image handlers (unchanged)
  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (mainPreview) URL.revokeObjectURL(mainPreview);
    setMainImage(file);
    setMainPreview(URL.createObjectURL(file));
  };

  const removeMainImage = () => {
    if (mainPreview) URL.revokeObjectURL(mainPreview);
    setMainImage(null);
    setMainPreview(null);
  };

  const handleSecondaryImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (secondaryPreview) URL.revokeObjectURL(secondaryPreview);
    setSecondaryImage(file);
    setSecondaryPreview(URL.createObjectURL(file));
  };

  const removeSecondaryImage = () => {
    if (secondaryPreview) URL.revokeObjectURL(secondaryPreview);
    setSecondaryImage(null);
    setSecondaryPreview(null);
  };

  const handleAdditionalImagesChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    setAdditionalImages((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setAdditionalPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(additionalPreviews[index]);
    setAdditionalPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Colors handlers
  const addColor = () => setColors([...colors, ""]);
  const removeColor = (index: number) =>
    setColors(colors.filter((_, i) => i !== index));
  const updateColor = (index: number, value: string) => {
    const newColors = [...colors];
    newColors[index] = value;
    setColors(newColors);
  };

  // Sizes handlers – price is now optional
  const addSize = () => setSizes([...sizes, { name: "", price: null }]);
  const removeSize = (index: number) =>
    setSizes(sizes.filter((_, i) => i !== index));
  const updateSizeName = (index: number, value: string) => {
    const newSizes = [...sizes];
    newSizes[index].name = value;
    setSizes(newSizes);
  };
  const updateSizePrice = (index: number, value: string) => {
    const newSizes = [...sizes];
    const price = value === "" ? null : parseFloat(value);
    newSizes[index].price = price;
    setSizes(newSizes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate only required fields
      if (!formData.title || !formData.description || !formData.price) {
        toast.error("Please fill in all required fields");
        setLoading(false);
        return;
      }
      // Validate colors: if any, each must be non‑empty
      if (colors.some((c) => c.trim() === "")) {
        toast.error("All colors must have a value");
        setLoading(false);
        return;
      }
      // Validate sizes: each must have a name
      if (sizes.some((s) => !s.name.trim())) {
        toast.error("All sizes must have a name");
        setLoading(false);
        return;
      }

      const formDataToSend = new FormData();

      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("link", formData.link || "null");
      formDataToSend.append("category_id", formData.category_id || "null");
      formDataToSend.append("price", formData.price);
      formDataToSend.append("colors", JSON.stringify(colors));
      // Send sizes as they are – price can be null
      formDataToSend.append("sizes", JSON.stringify(sizes));

      if (mainImage) formDataToSend.append("images", mainImage);
      if (secondaryImage) formDataToSend.append("images", secondaryImage);
      additionalImages.forEach((file) => {
        formDataToSend.append("images", file);
      });

      const res = await fetch("/api/products", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create product");
      }

      toast.success("Product created successfully!");
      router.push("/admin/products");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Add New Product
        </h1>
        <p className="text-gray-600">Create a new product for your store</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-gray-900">Product Information</CardTitle>
            <CardDescription className="text-gray-500">
              Enter the product details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-900">
                Product Title<span className="text-red-400">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter product name"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-900">
                Description<span className="text-red-400">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter product description"
                rows={4}
                required
              />
            </div>

            {/* Link */}
            <div className="space-y-2">
              <Label htmlFor="link" className="text-gray-900">
                External Link (optional)
              </Label>
              <Input
                id="link"
                name="link"
                type="url"
                value={formData.link}
                onChange={handleChange}
                placeholder="https://example.com/product"
              />
              <p className="text-xs text-gray-500">
                An external URL where customers can buy or learn more.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category_id" className="text-gray-900">
                  Category
                </Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category_id: value }))
                  }
                >
                  <SelectTrigger className="bg-white text-gray-900 focus:ring-gray-500">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-gray-900">
                    <SelectItem value="null">Uncategorized</SelectItem>
                    {categoryTree.map(({ root, children }) => (
                      <div key={root.id}>
                        <SelectItem value={root.id} className="font-medium">
                          {root.title}
                        </SelectItem>
                        {children.length > 0 && (
                          <SelectGroup>
                            <SelectLabel className="sr-only">
                              {root.title} subcategories
                            </SelectLabel>
                            {children.map((child) => (
                              <SelectItem
                                key={child.id}
                                value={child.id}
                                className="pl-6"
                              >
                                {child.title}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        )}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price" className="text-gray-900">
                  Base Price (Br) *
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is the base price; individual sizes will use this if
                  their price is left empty.
                </p>
              </div>
            </div>

            {/* Colors Section – optional */}
            <div className="space-y-4 border rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900">
                Colors{" "}
                <span className="text-sm font-normal text-gray-500">
                  (optional)
                </span>
              </h3>
              <div className="space-y-2">
                {colors.map((color, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      value={color}
                      onChange={(e) => updateColor(index, e.target.value)}
                      placeholder="e.g., Red"
                      className="flex-1 text-gray-900"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeColor(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="text-gray-900"
                  size="sm"
                  onClick={addColor}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Color
                </Button>
                <p className="text-xs text-gray-500">
                  Add each color separately (e.g., Red, Blue, Green)
                </p>
              </div>
            </div>

            {/* Sizes Section – optional, price optional */}
            <div className="space-y-4 border rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900">
                Sizes & Prices{" "}
                <span className="text-sm font-normal text-gray-500">
                  (optional)
                </span>
              </h3>
              <div className="space-y-2">
                {sizes.map((size, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      value={size.name}
                      onChange={(e) => updateSizeName(index, e.target.value)}
                      placeholder="Size (e.g., S, M, L)"
                      className="flex-1 text-gray-900"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      value={size.price === null ? "" : size.price}
                      onChange={(e) => updateSizePrice(index, e.target.value)}
                      placeholder="Leave empty to use base price"
                      className="w-32 text-gray-900"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSize(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-gray-900"
                  onClick={addSize}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Size
                </Button>
                <p className="text-xs text-gray-500">
                  Add each size with its price. Leave price empty to use the
                  base price.
                </p>
              </div>
            </div>

            {/* Product Images – unchanged */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                Product Images
              </h3>

              {/* Main Image */}
              <div className="space-y-2">
                <Label className="text-gray-900">
                  Main Image (first)<span className="text-red-400">*</span>
                </Label>
                <div className="flex items-center gap-4">
                  {mainPreview ? (
                    <div className="relative w-24 h-24 border rounded-md overflow-hidden">
                      <img
                        src={mainPreview}
                        alt="Main preview"
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeMainImage}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-24 h-24 border-2 border-gray-300 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-[#f73a00]">
                      <Upload className="h-6 w-6 text-gray-400" />
                      <span className="text-xs text-gray-500">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMainImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Secondary Image */}
              <div className="space-y-2">
                <Label className="text-gray-900">
                  Secondary Image (second)
                </Label>
                <div className="flex items-center gap-4">
                  {secondaryPreview ? (
                    <div className="relative w-24 h-24 border rounded-md overflow-hidden">
                      <img
                        src={secondaryPreview}
                        alt="Secondary preview"
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeSecondaryImage}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-24 h-24 border-2 border-gray-300 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-[#f73a00]">
                      <Upload className="h-6 w-6 text-gray-400" />
                      <span className="text-xs text-gray-500">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSecondaryImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Additional Images */}
              <div className="space-y-2">
                <Label className="text-gray-900">
                  Additional Images (optional)
                </Label>
                <div className="flex flex-wrap gap-4">
                  {additionalPreviews.map((preview, idx) => (
                    <div
                      key={idx}
                      className="relative w-24 h-24 border rounded-md overflow-hidden"
                    >
                      <img
                        src={preview}
                        alt={`Additional ${idx}`}
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeAdditionalImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <label className="w-24 h-24 border-2 border-gray-300 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-[#f73a00]">
                    <Upload className="h-6 w-6 text-gray-400" />
                    <span className="text-xs text-gray-500">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleAdditionalImagesChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  You can upload multiple additional images.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                className="text-gray-900"
                onClick={() => router.push("/admin/products")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Product"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
