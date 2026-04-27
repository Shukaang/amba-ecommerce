// lib/utils/placeholder.ts
export function blurPlaceholder(width = 20, quality = 10): string {
  return `?width=${width}&quality=${quality}&format=webp`;
}