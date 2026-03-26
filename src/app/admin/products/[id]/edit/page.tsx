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
import { Plus, Trash2, Loader2, Package, Upload, X } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  title: string;
  parent_id: string | null;
}

interface Product {
  id: string;
  title: string;
  description: string;
  link: string | null;
  category_id: string | null;
  price: number;
  images: string[];
  colors: string[];
  sizes: Array<{ name: string; price: number }>;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<
    { id: string; title: string; depth: number }[]
  >([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    link: "",
    category_id: "",
    price: "",
  });

  // Colors and sizes
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<{ name: string; price: number }[]>([]);

  // Delete modal
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Images
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainPreview, setMainPreview] = useState<string | null>(null);
  const [mainExisting, setMainExisting] = useState<string | null>(null);

  const [secondaryImage, setSecondaryImage] = useState<File | null>(null);
  const [secondaryPreview, setSecondaryPreview] = useState<string | null>(null);
  const [secondaryExisting, setSecondaryExisting] = useState<string | null>(
    null,
  );

  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([]);
  const [additionalExisting, setAdditionalExisting] = useState<string[]>([]);

  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, [productId]);

  useEffect(() => {
    return () => {
      if (mainPreview) URL.revokeObjectURL(mainPreview);
      if (secondaryPreview) URL.revokeObjectURL(secondaryPreview);
      additionalPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [mainPreview, secondaryPreview, additionalPreviews]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, productRes] = await Promise.all([
        fetch("/api/categories"),
        fetch(`/api/products/${productId}`),
      ]);

      const categoriesData = await categoriesRes.json();
      const productData = await productRes.json();

      if (categoriesRes.ok) {
        setCategories(categoriesData.categories);
        const options = buildCategoryOptions(categoriesData.categories);
        setCategoryOptions(options);
      }

      if (productRes.ok && productData.product) {
        const prod = productData.product;
        setProduct(prod);
        setFormData({
          title: prod.title,
          description: prod.description,
          link: prod.link || "",
          category_id: prod.category_id || "",
          price: prod.price.toString(),
        });

        // Colors and sizes
        setColors(prod.colors || []);
        setSizes(prod.sizes || []);

        // Images
        const images = prod.images || [];
        if (images.length > 0) setMainExisting(images[0]);
        if (images.length > 1) setSecondaryExisting(images[1]);
        if (images.length > 2) setAdditionalExisting(images.slice(2));
      } else {
        toast.error("Product not found");
        router.push("/admin/products");
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load product data");
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

  // Image handlers
  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (mainPreview) URL.revokeObjectURL(mainPreview);
    setMainImage(file);
    setMainPreview(URL.createObjectURL(file));
    if (mainExisting) {
      setImagesToDelete((prev) => [...prev, mainExisting]);
      setMainExisting(null);
    }
  };

  const removeMainImage = () => {
    if (mainPreview) {
      URL.revokeObjectURL(mainPreview);
      setMainImage(null);
      setMainPreview(null);
    }
    if (mainExisting) {
      setImagesToDelete((prev) => [...prev, mainExisting]);
      setMainExisting(null);
    }
  };

  const handleSecondaryImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (secondaryPreview) URL.revokeObjectURL(secondaryPreview);
    setSecondaryImage(file);
    setSecondaryPreview(URL.createObjectURL(file));
    if (secondaryExisting) {
      setImagesToDelete((prev) => [...prev, secondaryExisting]);
      setSecondaryExisting(null);
    }
  };

  const removeSecondaryImage = () => {
    if (secondaryPreview) {
      URL.revokeObjectURL(secondaryPreview);
      setSecondaryImage(null);
      setSecondaryPreview(null);
    }
    if (secondaryExisting) {
      setImagesToDelete((prev) => [...prev, secondaryExisting]);
      setSecondaryExisting(null);
    }
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
    if (index < additionalExisting.length) {
      const url = additionalExisting[index];
      setImagesToDelete((prev) => [...prev, url]);
      setAdditionalExisting((prev) => prev.filter((_, i) => i !== index));
    } else {
      const newIndex = index - additionalExisting.length;
      setAdditionalImages((prev) => prev.filter((_, i) => i !== newIndex));
      URL.revokeObjectURL(additionalPreviews[index]);
      setAdditionalPreviews((prev) => prev.filter((_, i) => i !== index));
    }
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

  // Sizes handlers
  const addSize = () => setSizes([...sizes, { name: "", price: 0 }]);
  const removeSize = (index: number) =>
    setSizes(sizes.filter((_, i) => i !== index));
  const updateSizeName = (index: number, value: string) => {
    const newSizes = [...sizes];
    newSizes[index].name = value;
    setSizes(newSizes);
  };
  const updateSizePrice = (index: number, value: number) => {
    const newSizes = [...sizes];
    newSizes[index].price = value;
    setSizes(newSizes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validate
      if (colors.length === 0 || sizes.length === 0) {
        toast.error("Please add at least one color and one size");
        setSaving(false);
        return;
      }
      if (colors.some((c) => !c.trim())) {
        toast.error("All colors must have a value");
        setSaving(false);
        return;
      }
      if (sizes.some((s) => !s.name.trim() || s.price <= 0)) {
        toast.error("All sizes must have a name and positive price");
        setSaving(false);
        return;
      }

      const formDataToSend = new FormData();

      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("link", formData.link || "null");
      formDataToSend.append("category_id", formData.category_id || "null");
      formDataToSend.append("price", formData.price);
      formDataToSend.append("imagesToDelete", JSON.stringify(imagesToDelete));
      formDataToSend.append("colors", JSON.stringify(colors));
      formDataToSend.append("sizes", JSON.stringify(sizes));

      const keptImages: string[] = [];
      if (mainExisting) keptImages.push(mainExisting);
      if (secondaryExisting) keptImages.push(secondaryExisting);
      keptImages.push(...additionalExisting);

      formDataToSend.append("existingImages", JSON.stringify(keptImages));

      if (mainImage) formDataToSend.append("newImages", mainImage);
      if (secondaryImage) formDataToSend.append("newImages", secondaryImage);
      additionalImages.forEach((file) => {
        formDataToSend.append("newImages", file);
      });

      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        body: formDataToSend,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update product");
      }

      toast.success("Product updated successfully!");
      router.push("/admin/products");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-400">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">Product not found</div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Edit Product</h1>
          <p className="text-gray-600">Update product information</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900">
                Product Information
              </CardTitle>
              <CardDescription>Update the product details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-900">
                  Product Title *
                </Label>
                <Input
                  id="title"
                  name="title"
                  className="text-gray-900"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-900">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  className="text-gray-900"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link" className="text-gray-900">
                  External Link (optional)
                </Label>
                <Input
                  id="link"
                  name="link"
                  type="url"
                  className="text-gray-900"
                  value={formData.link}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <SelectTrigger className="bg-white text-gray-900">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="max-h-80 text-gray-900 bg-white">
                      <SelectItem value="null">Uncategorized</SelectItem>
                      {categoryOptions.map((option) => (
                        <SelectItem
                          key={option.id}
                          value={option.id}
                          className={
                            option.depth > 0 ? "pl-6" : "font-semibold"
                          }
                        >
                          {option.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price" className="text-gray-900">
                    Base Price (Br) *
                  </Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    className="text-gray-900"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleChange}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    This is the base price; individual sizes have their own
                    prices.
                  </p>
                </div>
              </div>

              {/* Colors Section */}
              <div className="space-y-4 border rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900">Colors</h3>
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
                </div>
              </div>

              {/* Sizes Section */}
              <div className="space-y-4 border rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Sizes & Prices
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
                        value={size.price}
                        onChange={(e) =>
                          updateSizePrice(index, parseFloat(e.target.value))
                        }
                        placeholder="Price"
                        className="w-24 text-gray-900"
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
                    className="text-gray-900"
                    size="sm"
                    onClick={addSize}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Size
                  </Button>
                </div>
              </div>

              {/* Images – same as before */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Product Images
                </h3>

                {/* Main Image */}
                <div className="space-y-2">
                  <Label className="text-gray-900">Main Image (first)</Label>
                  <div className="flex items-center gap-4">
                    {(mainPreview || mainExisting) && (
                      <div className="relative w-24 h-24 border rounded-md overflow-hidden">
                        <img
                          src={mainPreview || mainExisting || ""}
                          alt="Main"
                          className="object-cover fill"
                        />
                        <button
                          type="button"
                          onClick={removeMainImage}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    {!mainPreview && !mainExisting && (
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
                    {(secondaryPreview || secondaryExisting) && (
                      <div className="relative w-24 h-24 border rounded-md overflow-hidden">
                        <img
                          src={secondaryPreview || secondaryExisting || ""}
                          alt="Secondary"
                          className="object-cover fill"
                        />
                        <button
                          type="button"
                          onClick={removeSecondaryImage}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    {!secondaryPreview && !secondaryExisting && (
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
                  <Label className="text-gray-900">Additional Images</Label>
                  <div className="flex flex-wrap gap-4">
                    {additionalExisting.map((url, idx) => (
                      <div
                        key={`existing-${idx}`}
                        className="relative w-24 h-24 border rounded-md overflow-hidden"
                      >
                        <img
                          src={url}
                          alt={`Additional ${idx}`}
                          className="object-cover fill"
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
                    {additionalPreviews.map((preview, idx) => (
                      <div
                        key={`new-${idx}`}
                        className="relative w-24 h-24 border rounded-md overflow-hidden"
                      >
                        <img
                          src={preview}
                          alt={`New ${idx}`}
                          className="object-cover fill"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            removeAdditionalImage(
                              additionalExisting.length + idx,
                            )
                          }
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <label className="w-24 h-24 border-2 border-gray-300 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-[#f73a00]">
                      <Upload className="h-6 w-6 text-gray-400" />
                      <span className="text-xs text-gray-500">Add more</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleAdditionalImagesChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/products")}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto bg-[#f73a00] hover:bg-[#f73a00]/90"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </>
  );
}
