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
import {
  Plus,
  Trash2,
  Loader2,
  Package,
  ChevronDown,
  ChevronUp,
  Tag,
  Ruler,
  Palette,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

interface Category {
  id: string;
  title: string;
  parent_id: string | null;
}

interface ProductVariant {
  id?: string;
  color: string;
  size: string;
  unit: string;
  price: string;
}

interface Product {
  id: string;
  title: string;
  description: string;
  category_id: string | null;
  price: number;
  images: string[];
  product_variants?: ProductVariant[];
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
  const [hasVariants, setHasVariants] = useState(false);
  const [showVariants, setShowVariants] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    link: "",
    category_id: "",
    price: "",
  });
  const [variants, setVariants] = useState<ProductVariant[]>([
    { color: "", size: "", unit: "", price: "" },
  ]);

  // Delete modal state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Image states
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

  // Clean up preview URLs
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

        // Split images into main, secondary, additional
        const images = prod.images || [];
        if (images.length > 0) setMainExisting(images[0]);
        if (images.length > 1) setSecondaryExisting(images[1]);
        if (images.length > 2) setAdditionalExisting(images.slice(2));

        if (prod.product_variants && prod.product_variants.length > 0) {
          setHasVariants(true);
          setShowVariants(true);
          setVariants(
            prod.product_variants.map((v: any) => ({
              id: v.id,
              color: v.color || "",
              size: v.size || "",
              unit: v.unit || "",
              price: v.price.toString(),
            })),
          );
        } else {
          setHasVariants(false);
          setVariants([{ color: "", size: "", unit: "", price: "" }]);
        }
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

  // Variant handlers
  const handleVariantChange = (
    index: number,
    field: keyof ProductVariant,
    value: string,
  ) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const addVariant = () => {
    setVariants([...variants, { color: "", size: "", unit: "", price: "" }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      const newVariants = variants.filter((_, i) => i !== index);
      setVariants(newVariants);
    }
  };

  const validateVariants = (): boolean => {
    if (!hasVariants) return true;
    for (const variant of variants) {
      if (!variant.price.trim()) {
        toast.error("All variants must have a price");
        return false;
      }
      if (
        !variant.color.trim() &&
        !variant.size.trim() &&
        !variant.unit.trim()
      ) {
        toast.error(
          "Each variant must have at least one attribute (color, size, or unit)",
        );
        return false;
      }
    }
    const variantKeys = variants.map((v) => `${v.color}|${v.size}|${v.unit}`);
    const uniqueKeys = new Set(variantKeys);
    if (uniqueKeys.size !== variants.length) {
      toast.error("Duplicate variants detected");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (hasVariants && !validateVariants()) {
        setSaving(false);
        return;
      }

      const formDataToSend = new FormData();

      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("category_id", formData.category_id || "null");
      formDataToSend.append("price", formData.price);
      formDataToSend.append("imagesToDelete", JSON.stringify(imagesToDelete));

      if (hasVariants) {
        const variantsData = variants
          .filter((v) => v.color.trim() || v.size.trim() || v.unit.trim())
          .map((v) => ({
            color: v.color.trim() || null,
            size: v.size.trim() || null,
            unit: v.unit.trim() || null,
            price: parseFloat(v.price),
          }));
        formDataToSend.append("variants", JSON.stringify(variantsData));
      }

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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete product");
      }

      toast.success("Product deleted successfully!");
      router.push("/admin/products");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
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
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
              <CardDescription>Update the product details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title, Description, Category, Price (unchanged) */}
              <div className="space-y-2">
                <Label htmlFor="title">Product Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category_id">Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, category_id: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      <SelectItem value="null">Uncategorized</SelectItem>
                      {categoryOptions.map((option) => (
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
                  <Label htmlFor="price">
                    {hasVariants ? "Base Price (Br) *" : "Price (Br) *"}
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
                  {hasVariants && (
                    <p className="text-xs text-gray-500 mt-1">
                      This is the base price. Variants can have different
                      prices.
                    </p>
                  )}
                </div>
              </div>

              {/* Variants Toggle & Section */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Package className="h-5 w-5 text-gray-500" />
                  <div>
                    <Label htmlFor="variants" className="text-base font-medium">
                      Product Variants
                    </Label>
                    <p className="text-sm text-gray-500">
                      Enable if this product comes in different colors, sizes,
                      or units
                    </p>
                  </div>
                </div>
                <Switch
                  checked={hasVariants}
                  onCheckedChange={(checked) => {
                    setHasVariants(checked);
                    if (checked) setShowVariants(true);
                  }}
                />
              </div>

              {hasVariants && (
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowVariants(!showVariants)}
                        className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
                      >
                        {showVariants ? (
                          <ChevronUp className="h-4 w-4 mr-1" />
                        ) : (
                          <ChevronDown className="h-4 w-4 mr-1" />
                        )}
                        Variants ({variants.length})
                      </button>
                    </div>
                  </div>

                  {showVariants && (
                    <div className="space-y-4">
                      {variants.map((variant, index) => (
                        <div
                          key={index}
                          className="p-4 border rounded-lg space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">
                              Variant {index + 1}
                            </h4>
                            {variants.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeVariant(index)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <Label
                                htmlFor={`color-${index}`}
                                className="flex items-center text-sm"
                              >
                                <Palette className="h-3 w-3 mr-1" />
                                Color
                              </Label>
                              <Input
                                id={`color-${index}`}
                                value={variant.color}
                                onChange={(e) =>
                                  handleVariantChange(
                                    index,
                                    "color",
                                    e.target.value,
                                  )
                                }
                                placeholder="e.g., Red, Blue"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor={`size-${index}`}
                                className="flex items-center text-sm"
                              >
                                <Ruler className="h-3 w-3 mr-1" />
                                Size
                              </Label>
                              <Input
                                id={`size-${index}`}
                                value={variant.size}
                                onChange={(e) =>
                                  handleVariantChange(
                                    index,
                                    "size",
                                    e.target.value,
                                  )
                                }
                                placeholder="e.g., S, M, L, 10kg"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor={`unit-${index}`}
                                className="flex items-center text-sm"
                              >
                                <Package className="h-3 w-3 mr-1" />
                                Unit
                              </Label>
                              <Input
                                id={`unit-${index}`}
                                value={variant.unit}
                                onChange={(e) =>
                                  handleVariantChange(
                                    index,
                                    "unit",
                                    e.target.value,
                                  )
                                }
                                placeholder="e.g., Pack, Box, Piece"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor={`price-${index}`}
                                className="flex items-center text-sm"
                              >
                                <Tag className="h-3 w-3 mr-1" />
                                Price (Br) *
                              </Label>
                              <Input
                                id={`price-${index}`}
                                type="number"
                                step="0.01"
                                min="0"
                                value={variant.price}
                                onChange={(e) =>
                                  handleVariantChange(
                                    index,
                                    "price",
                                    e.target.value,
                                  )
                                }
                                placeholder="0.00"
                                required={hasVariants}
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                        <p>
                          • Each variant must have at least one attribute
                          (color, size, or unit)
                        </p>
                        <p>• All variants must have a price</p>
                        <p>
                          • Variants with identical attributes will be merged
                        </p>
                      </div>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addVariant}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Variant
                  </Button>
                </div>
              )}

              {/* Product Images */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Product Images
                </h3>

                {/* Main Image */}
                <div className="space-y-2">
                  <Label>Main Image (first)</Label>
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
                      <label className="w-24 h-24 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-[#f73a00]">
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
                  <Label>Secondary Image (second)</Label>
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
                      <label className="w-24 h-24 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-[#f73a00]">
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
                  <Label>Additional Images</Label>
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
                    <label className="w-24 h-24 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-[#f73a00]">
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

              {/* Action Buttons - Mobile Optimized */}
              <div className="flex flex-col sm:flex-row sm:justify-between items-stretch sm:items-center gap-3 pt-6">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="w-full sm:w-auto"
                >
                  Delete Product
                </Button>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
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
                    className="w-full sm:w-auto"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{product.title}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
