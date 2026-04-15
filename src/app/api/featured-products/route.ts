import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'new';
    const maxTotal = 15; // maximum products to return

    const supabase = await createAdminClient();

    if (tab === 'new') {
      // 1. Find categories that have the newest products
      // First, get the latest product per category (created_at)
      const { data: latestPerCategory, error: latestError } = await supabase
        .from('products')
        .select('category_id, created_at')
        .eq('status', 'approved')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (latestError) {
        console.error('[FeaturedProducts] Error fetching latest per category:', latestError);
        return NextResponse.json({ products: [] });
      }

      // Group by category_id, keep the latest created_at for each category
      const categoryLatest = new Map<string, Date>();
      for (const product of latestPerCategory || []) {
        if (product.category_id && !categoryLatest.has(product.category_id)) {
          categoryLatest.set(product.category_id, new Date(product.created_at));
        }
      }

      // Sort categories by their latest product date (newest first)
      const sortedCategories = Array.from(categoryLatest.entries())
        .sort((a, b) => b[1].getTime() - a[1].getTime())
        .slice(0, 5); // take top 5 categories

      if (sortedCategories.length === 0) {
        return NextResponse.json({ products: [] });
      }

      // For each of these categories, fetch up to 3 newest products
      const categoryIds = sortedCategories.map(([id]) => id);
      const productsPerCategory = await Promise.all(
        categoryIds.map(async (categoryId) => {
          const { data } = await supabase
            .from('products')
            .select('*, categories(title), product_variants(*)')
            .eq('status', 'approved')
            .is('deleted_at', null)
            .eq('category_id', categoryId)
            .order('created_at', { ascending: false })
            .limit(3);
          return data || [];
        })
      );

      let allProducts = productsPerCategory.flat();
      // Shuffle slightly to avoid fixed order across categories? Not needed but we can randomize within the set.
      allProducts = allProducts.sort(() => Math.random() - 0.5);
      const products = allProducts.slice(0, maxTotal);
      return NextResponse.json({ products });
    }

    if (tab === 'featured') {
      // 2. Featured: rating >= 4.3, sorted by rating descending (5 to 4.3)
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(title), product_variants(*)')
        .eq('status', 'approved')
        .is('deleted_at', null)
        .gte('average_rating', 4.3)
        .order('average_rating', { ascending: false })
        .limit(maxTotal);

      if (error) {
        console.error('[FeaturedProducts] Featured error:', error);
        return NextResponse.json({ products: [] });
      }
      return NextResponse.json({ products: data || [] });
    }

    if (tab === 'trending') {
  // First try: rating >= 4.2, sorted by rating descending then newest
  let { data, error } = await supabase
    .from('products')
    .select('*, categories(title), product_variants(*)')
    .eq('status', 'approved')
    .is('deleted_at', null)
    .gte('average_rating', 4.2)
    .order('average_rating', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(maxTotal);

  if (error) {
    console.error('[FeaturedProducts] Trending error:', error);
    return NextResponse.json({ products: [] });
  }

  // If still no products, fallback to highest rated (any rating) with recency
  if (!data || data.length === 0) {
    const { data: fallback } = await supabase
      .from('products')
      .select('*, categories(title), product_variants(*)')
      .eq('status', 'approved')
      .is('deleted_at', null)
      .order('average_rating', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(maxTotal);
    data = fallback || [];
  }

  return NextResponse.json({ products: data || [] });
}
    return NextResponse.json({ products: [] });
  } catch (error: any) {
    console.error('[FeaturedProducts] Unhandled error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}