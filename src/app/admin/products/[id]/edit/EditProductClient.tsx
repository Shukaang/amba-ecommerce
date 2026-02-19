// app/admin/products/[id]/edit/EditProductClient.tsx
"use client";

import { useState } from "react";
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
import {
  Plus,
  Trash2,
  Package,
  ChevronDown,
  ChevronUp,
  Tag,
  Ruler,
  Palette,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
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

interface Category {
  id: string;
  title: string;
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
  categories?: { id: string; title: string } | null;
}

interface EditProductClientProps {
  product: Product;
  categories: Category[];
}

export default function EditProductClient({
  product,
  categories,
}: EditProductClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [hasVariants, setHasVariants] = useState(
    product.product_variants && product.product_variants.length > 0,
  );
  const [showVariants, setShowVariants] = useState(
    product.product_variants && product.product_variants.length > 0,
  );

  const [formData, setFormData] = useState({
    title: product.title,
    description: product.description,
    category_id: product.category_id || "",
    price: product.price.toString(),
    images: product.images.length > 0 ? product.images : [""],
  });

  const [variants, setVariants] = useState<ProductVariant[]>(
    product.product_variants && product.product_variants.length > 0
      ? product.product_variants.map((v: any) => ({
          id: v.id,
          color: v.color || "",
          size: v.size || "",
          unit: v.unit || "",
          price: v.price.toString(),
        }))
      : [{ color: "", size: "", unit: "", price: "" }],
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData((prev) => ({ ...prev, images: newImages }));
  };

  const addImageField = () => {
    setFormData((prev) => ({ ...prev, images: [...prev.images, ""] }));
  };

  const removeImageField = (index: number) => {
    if (formData.images.length > 1) {
      const newImages = formData.images.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, images: newImages }));
    }
  };

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

      const variantsData = hasVariants
        ? variants
            .filter(
              (variant) =>
                variant.color.trim() ||
                variant.size.trim() ||
                variant.unit.trim(),
            )
            .map((variant) => ({
              color: variant.color.trim() || null,
              size: variant.size.trim() || null,
              unit: variant.unit.trim() || null,
              price: parseFloat(variant.price) || parseFloat(formData.price),
            }))
        : [];

      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          images: formData.images.filter((img) => img.trim() !== ""),
          category_id:
            formData.category_id === "null" ? null : formData.category_id,
          variants: variantsData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update product");
      }

      toast.success("Product updated successfully!");
      router.push("/admin/products");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete product");
      }

      toast.success("Product deleted successfully!");
      router.push("/admin/products");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

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
                    <SelectContent>
                      <SelectItem value="null">Uncategorized</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">
                    {hasVariants ? "Base Price ($) *" : "Price ($) *"}
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
                </div>
              </div>

              {/* Variants Toggle */}
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
                    if (checked) {
                      setShowVariants(true);
                    }
                  }}
                />
              </div>

              {/* Variants Section */}
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
                                Price ($) *
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
                    </div>
                  )}
                </div>
              )}

              {/* Product Images */}
              <div className="space-y-2">
                <Label>Product Images</Label>
                <div className="space-y-3">
                  {formData.images.map((image, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={image}
                        onChange={(e) =>
                          handleImageChange(index, e.target.value)
                        }
                        placeholder={`Image URL ${index + 1}`}
                        type="url"
                      />
                      {formData.images.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeImageField(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addImageField}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Image
                </Button>
              </div>

              <div className="flex justify-between items-center pt-6">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Delete Product
                </Button>

                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/admin/products")}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
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
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              product and all its variants and reviews.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
