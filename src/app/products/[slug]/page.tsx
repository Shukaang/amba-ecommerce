import { Metadata } from "next";
import { createClient } from "@/lib/supabase/supabaseServer";
import ProductDetailClient from "@/components/products/product-detail";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

// Generate metadata for the page (used for SEO and social previews)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch only the fields needed for metadata (lightweight)
  const { data: product, error } = await supabase
    .from("products")
    .select("title, description, images")
    .eq("slug", slug)
    .single();

  if (error || !product) {
    // If product not found, you can still return default metadata
    return {
      title: "Product Not Found",
    };
  }

  // Build an absolute URL for the image
  // Use the host from the request headers or a fallback from env
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const imageUrl = product.images?.[0]
    ? product.images[0].startsWith("http")
      ? product.images[0]
      : `${baseUrl}${product.images[0]}`
    : `${baseUrl}/logo.png`;

  return {
    title: product.title,
    description: product.description,
    openGraph: {
      title: product.title,
      description: product.description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: product.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description: product.description,
      images: [imageUrl],
    },
  };
}

export default async function ProductSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select(
      `
      *,
      categories(*),
      product_variants(*)
    `,
    )
    .eq("slug", slug)
    .single();

  if (error || !product) {
    notFound();
  }

  const productWithAvgRating = {
    ...product,
    average_rating: product.average_rating || 0,
  };

  return <ProductDetailClient product={productWithAvgRating} />;
}
