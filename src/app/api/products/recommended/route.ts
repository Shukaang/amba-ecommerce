// app/api/products/recommended/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/supabaseServer';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');
  const limit = parseInt(searchParams.get('limit') || '4');

  if (!productId) {
    return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
  }

  const supabase = await createAdminClient();

  // Get current product's category
  const { data: product } = await supabase
    .from('products')
    .select('category_id')
    .eq('id', productId)
    .single();

  // Base query with slug and approved filter
  const baseQuery = () =>
    supabase
      .from('products')
      .select('id, slug, title, price, images, average_rating')
      .neq('id', productId)
      .eq('status', 'approved');

  if (product?.category_id) {
    // Try same category first
    const { data: sameCategory } = await baseQuery()
      .eq('category_id', product.category_id)
      .order('average_rating', { ascending: false })
      .limit(limit);

    if (sameCategory && sameCategory.length >= limit) {
      return NextResponse.json({ products: sameCategory });
    }

    // Combine with high‑rated from other categories
    const remaining = limit - (sameCategory?.length || 0);
    const { data: others } = await baseQuery()
      .neq('category_id', product.category_id)
      .order('average_rating', { ascending: false })
      .limit(remaining);

    const combined = [...(sameCategory || []), ...(others || [])];
    return NextResponse.json({ products: combined });
  }

  // Fallback: highest rated overall
  const { data: products } = await baseQuery()
    .order('average_rating', { ascending: false })
    .limit(limit);

  return NextResponse.json({ products: products || [] });
}