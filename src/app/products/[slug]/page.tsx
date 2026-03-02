import { createClient } from "@/lib/supabase/supabaseServer";
import ProductDetailClient from "@/components/products/product-detail";
import { notFound } from "next/navigation";

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

  // If you need to compute average rating, do it here
  const productWithAvgRating = {
    ...product,
    average_rating: product.average_rating || 0,
  };

  return <ProductDetailClient product={productWithAvgRating} />;
}
