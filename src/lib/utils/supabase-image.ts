let supportsAvif: boolean | null = null;

function checkAvifSupport() {
  if (supportsAvif !== null) return supportsAvif;

  try {
    const canvas = document.createElement("canvas");
    supportsAvif =
      canvas.toDataURL("image/avif").indexOf("data:image/avif") === 0;
  } catch {
    supportsAvif = false;
  }

  return supportsAvif;
}

export function getSupabaseImage(
  url: string,
  width?: number,
  quality: number = 70
) {
  if (!url) return "";

  // 🔥 auto format selection
  const format = typeof window !== "undefined" && checkAvifSupport()
    ? "avif"
    : "webp";

  // 🔥 clean existing params
  const baseUrl = url.split("?")[0];

  const params = new URLSearchParams();

  if (width) params.set("width", width.toString());

  // sweet spot for performance
  params.set("quality", quality.toString());
  params.set("format", format);

  return `${baseUrl}?${params.toString()}`;
}