import { Metadata } from "next";
import { createClient } from "@/lib/supabase/supabaseServer";
import ProductDetailClient from "@/components/products/product-detail";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("title, description, images")
    .eq("slug", slug)
    .single();

  if (error || !product) {
    return { title: "Product Not Found" };
  }

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
      images: [{ url: imageUrl, width: 1200, height: 630, alt: product.title }],
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
    .eq("status", "approved")
    .is("deleted_at", null)
    .single();

  if (error || !product) {
    notFound();
  }

  // Build category path
  let categoryPath: { id: string; title: string }[] = [];
  if (product.categories) {
    let currentCat = product.categories;
    while (currentCat) {
      categoryPath.unshift({ id: currentCat.id, title: currentCat.title }); // add to beginning
      if (currentCat.parent_id) {
        const { data: parent } = await supabase
          .from("categories")
          .select("id, title, parent_id")
          .eq("id", currentCat.parent_id)
          .single();
        currentCat = parent;
      } else {
        break;
      }
    }
  }

  // Fetch initial ratings for fallback
  const { data: initialRatings } = await supabase
    .from("ratings")
    .select("*, users(name, email)")
    .eq("product_id", product.id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Fetch initial recommendations
  const { data: initialRecommendations } = await supabase
    .from("products")
    .select("id, slug, title, price, images, average_rating")
    .neq("id", product.id)
    .eq("status", "approved")
    .is("deleted_at", null)
    .order("average_rating", { ascending: false })
    .limit(6);

  const productWithAvgRating = {
    ...product,
    average_rating: product.average_rating || 0,
  };

  return (
    <ProductDetailClient
      product={productWithAvgRating}
      initialRatings={initialRatings || []}
      initialRecommendations={initialRecommendations || []}
      categoryPath={categoryPath}
    />
  );
}
