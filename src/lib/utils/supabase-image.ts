// lib/supabase-image.ts
export function getSupabaseImage(
  url: string,
  width?: number,
  quality: number = 75
) {
  if (!url) return "";

  const params = new URLSearchParams();

  if (width) params.append("width", width.toString());
  params.append("quality", quality.toString());

  return `${url}?${params.toString()}`;
}