"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { useCart } from "@/lib/cart/context";
import { Star, ShoppingCart, Package, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProductVariant {
  id: string;
  color: string | null;
  size: string | null;
  unit: string | null;
  price: number;
}

interface Category {
  id: string;
  title: string;
}

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  average_rating: number;
  images: string[];
  categories: Category | null;
  product_variants: ProductVariant[];
}

interface ProductDetailProps {
  product: Product;
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.product_variants.length > 0 ? null : null,
  );
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Please login to add items to cart");
      router.push("/login");
      return;
    }

    try {
      await addToCart({
        productId: product.id,
        variantId: selectedVariant?.id || null,
        quantity,
        price: selectedVariant?.price || product.price,
      });

      toast.success("Added to cart!");
    } catch (error: any) {
      toast.error(error.message || "Failed to add to cart");
    }
  };

  const getDisplayPrice = () => {
    return selectedVariant?.price || product.price;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div>
          <div className="aspect-square w-full overflow-hidden rounded-xl bg-gray-100 mb-4">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[selectedImage]}
                alt={product.title}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                <Package className="h-24 w-24 text-gray-400" />
              </div>
            )}
          </div>

          {/* Thumbnail Images */}
          {product.images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto py-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`shrink-0 h-20 w-20 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index
                      ? "border-blue-600"
                      : "border-gray-200"
                  }`}
                >
                  <img
                    src={image}
                    alt={`Product image ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {/* Breadcrumb */}
          <div className="text-sm text-gray-600 mb-4">
            {product.categories && (
              <>
                <span>Products</span>
                <span className="mx-2">/</span>
                <span className="text-blue-600">
                  {product.categories.title}
                </span>
              </>
            )}
          </div>

          {/* Title and Rating */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {product.title}
          </h1>
          <div className="flex items-center mb-6">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(product.average_rating)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="ml-2 text-gray-600">
              {product.average_rating.toFixed(1)} rating
            </span>
          </div>

          {/* Price */}
          <div className="mb-6">
            <div className="text-3xl font-bold text-gray-900">
              ${getDisplayPrice().toFixed(2)}
            </div>
            {product.product_variants.length > 0 && !selectedVariant && (
              <p className="text-sm text-gray-500 mt-1">
                Select a variant to see price
              </p>
            )}
          </div>

          {/* Description */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Description
            </h3>
            <p className="text-gray-600 whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {/* Variants */}
          {product.product_variants.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Available Variants
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {product.product_variants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  const variantName = [
                    variant.color,
                    variant.size,
                    variant.unit,
                  ]
                    .filter(Boolean)
                    .join(" • ");

                  return (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`p-4 border rounded-lg text-left transition-all ${
                        isSelected
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            {variantName || "Standard"}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            ${variant.price.toFixed(2)}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quantity
            </h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  -
                </button>
                <span className="px-4 py-2 text-gray-900 font-medium">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  +
                </button>
              </div>
              <div className="text-sm text-gray-600">
                {quantity} × ${getDisplayPrice().toFixed(2)} = $
                {(quantity * getDisplayPrice()).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            className="w-full py-6 text-lg"
            size="lg"
            disabled={product.product_variants.length > 0 && !selectedVariant}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            Add to Cart
          </Button>

          {/* Warning for variant selection */}
          {product.product_variants.length > 0 && !selectedVariant && (
            <p className="text-sm text-red-600 mt-2 text-center">
              Please select a variant
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
