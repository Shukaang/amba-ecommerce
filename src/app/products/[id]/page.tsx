import { createClient } from "@/lib/supabase/supabaseServer";
import ProductDetail from "@/components/products/product-detail";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const productId = (await params).id;
  const supabase = await createClient();

  // Fetch product with variants and category
  const { data: product } = await supabase
    .from("products")
    .select(
      `
      *,
      categories(*),
      product_variants(*)
    `,
    )
    .eq("id", productId)
    .single();

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
        <p className="text-gray-600 mt-2">
          The product you're looking for doesn't exist.
        </p>
      </div>
    );
  }

  return <ProductDetail product={product} />;
}
