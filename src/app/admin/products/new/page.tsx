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
import {
  Plus,
  Trash2,
  Package,
  ChevronDown,
  ChevronUp,
  Tag,
  Ruler,
  Palette,
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

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTree, setCategoryTree] = useState<
    { root: Category; children: Category[] }[]
  >([]);
  const [hasVariants, setHasVariants] = useState(false);
  const [showVariants, setShowVariants] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    price: "",
    images: [""],
  });
  const [variants, setVariants] = useState<ProductVariant[]>([
    { color: "", size: "", unit: "", price: "" },
  ]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (res.ok) {
        setCategories(data.categories);
        // Build tree: separate roots and children
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
        // Sort roots and children alphabetically
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

    // Check if all variants have at least one attribute and price
    for (const variant of variants) {
      if (!variant.price.trim()) {
        toast.error("All variants must have a price");
        return false;
      }

      // At least one of color, size, or unit should be filled
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

    // Check for duplicate variants
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
    setLoading(true);

    try {
      // Validate variants if enabled
      if (hasVariants && !validateVariants()) {
        setLoading(false);
        return;
      }

      // Prepare product data
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        images: formData.images.filter((img) => img.trim() !== ""),
        category_id:
          formData.category_id === "null" ? null : formData.category_id,
      };

      // Prepare variants data
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
              price: parseFloat(variant.price),
            }))
        : [];

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...productData,
          variants: variantsData,
        }),
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
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
            <CardDescription>Enter the product details</CardDescription>
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
                    {categoryTree.map(({ root, children }) => (
                      <div key={root.id}>
                        {/* Root category as selectable option */}
                        <SelectItem value={root.id} className="font-medium">
                          {root.title}
                        </SelectItem>
                        {/* Children as indented options */}
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
                {hasVariants && (
                  <p className="text-xs text-gray-500 mt-1">
                    This is the base price. Variants can have different prices.
                  </p>
                )}
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
                    Enable if this product comes in different colors, sizes, or
                    units
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

                    <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                      <p>
                        • Each variant must have at least one attribute (color,
                        size, or unit)
                      </p>
                      <p>• All variants must have a price</p>
                      <p>• Variants with identical attributes will be merged</p>
                    </div>
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
                      onChange={(e) => handleImageChange(index, e.target.value)}
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

            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
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
