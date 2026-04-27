export function getSupabaseImage(
  url: string,
  width?: number,
  quality: number = 75,
  format: "webp" | "avif" = "webp"
) {
  if (!url) return "";

  const params = new URLSearchParams();

  if (width) params.append("width", width.toString());
  params.append("quality", quality.toString());
  params.append("format", format);

  return `${url}?${params.toString()}`;
}