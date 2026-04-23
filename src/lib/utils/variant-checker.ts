// lib/utils/variant-utils.ts

/**
 * Checks if a product requires variant selection (has colors or sizes).
 */
export function hasVariantOptions(product: {
  colors?: string[] | null;
  sizes?: Array<{ name: string; price: number }> | null;
}): boolean {
  const hasColors = Array.isArray(product.colors) && product.colors.length > 0;
  const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;
  return hasColors || hasSizes;
}

/**
 * Returns the number of variant dimensions (0, 1, or 2)
 */
export function getVariantDimensionCount(product: {
  colors?: string[] | null;
  sizes?: Array<{ name: string; price: number }> | null;
}): number {
  const hasColors = Array.isArray(product.colors) && product.colors.length > 0;
  const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;
  return (hasColors ? 1 : 0) + (hasSizes ? 1 : 0);
}