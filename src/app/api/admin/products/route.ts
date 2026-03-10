import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/supabaseServer";

export async function GET() {
  const supabase = await createAdminClient();

  const { data: products, error } = await supabase
    .from("products")
    .select(
      `
      *,
      categories(id, title),
      product_variants(*),
      creator:users!products_created_by_fkey(id, name, email),
      updater:users!products_updated_by_fkey(id, name, email)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform to match Product interface
  const transformed = products?.map((product) => ({
    ...product,
    created_by: product.creator,
    updated_by: product.updater,
  }));

  return NextResponse.json({ products: transformed || [] });
}