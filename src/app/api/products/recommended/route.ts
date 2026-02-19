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

  // Build query: prefer same category, otherwise high-rated
  let query = supabase
    .from('products')
    .select('id, title, price, images, average_rating')
    .neq('id', productId)
    .order('average_rating', { ascending: false })
    .limit(limit);

  if (product?.category_id) {
    // Try to get products from the same category first
    const { data: sameCategory } = await supabase
      .from('products')
      .select('id, title, price, images, average_rating')
      .eq('category_id', product.category_id)
      .neq('id', productId)
      .order('average_rating', { ascending: false })
      .limit(limit);

    if (sameCategory && sameCategory.length >= limit) {
      return NextResponse.json({ products: sameCategory });
    }

    // If not enough, combine with high-rated from other categories
    const remaining = limit - (sameCategory?.length || 0);
    const { data: others } = await supabase
      .from('products')
      .select('id, title, price, images, average_rating')
      .neq('category_id', product.category_id)
      .neq('id', productId)
      .order('average_rating', { ascending: false })
      .limit(remaining);

    const combined = [...(sameCategory || []), ...(others || [])];
    return NextResponse.json({ products: combined });
  }

  // Fallback: just highest rated
  const { data: products } = await query;
  return NextResponse.json({ products: products || [] });
}