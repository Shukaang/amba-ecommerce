import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/supabaseServer';
import { withSuperAdminAuth } from '@/lib/auth/middleware';

export const GET = withSuperAdminAuth(async () => {
  try {
    const supabase = await createAdminClient();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: visitors, error } = await supabase
      .from('visitor_tracking')
      .select('user_id, country, city, product_clicks, visited_at')
      .gte('visited_at', thirtyDaysAgo.toISOString());

    if (error) throw error;

    // Aggregate stats
    const totalVisitors = visitors.length;
    const uniqueUsers = new Set(visitors.filter(v => v.user_id).map(v => v.user_id)).size;
    const anonymousVisitors = visitors.filter(v => !v.user_id).length;

    const today = new Date().toDateString();
    const todayVisitors = visitors.filter(v => new Date(v.visited_at).toDateString() === today).length;

    // Group by country and city
    const countryMap = new Map<string, { count: number; cities: Map<string, number> }>();
    visitors.forEach(v => {
      const country = v.country || 'Unknown';
      const city = v.city || 'Unknown';
      if (!countryMap.has(country)) {
        countryMap.set(country, { count: 0, cities: new Map() });
      }
      const stat = countryMap.get(country)!;
      stat.count += 1;
      const cityCount = stat.cities.get(city) || 0;
      stat.cities.set(city, cityCount + 1);
    });

    const byCountry = Array.from(countryMap.entries()).map(([country, stat]) => ({
      country,
      count: stat.count,
      cities: Array.from(stat.cities.entries()).map(([city, count]) => ({ city, count })),
    }));

    // Aggregate product clicks
    const productMap = new Map<string, { views: number; cart_adds: number; wishlist_adds: number }>();
    visitors.forEach(v => {
      if (!v.product_clicks) return;
      v.product_clicks.forEach((click: any) => {
        const pid = click.product_id;
        if (!productMap.has(pid)) {
          productMap.set(pid, { views: 0, cart_adds: 0, wishlist_adds: 0 });
        }
        const stat = productMap.get(pid)!;
        if (click.type === 'view') stat.views += 1;
        else if (click.type === 'add_to_cart') stat.cart_adds += 1;
        else if (click.type === 'add_to_wishlist') stat.wishlist_adds += 1;
      });
    });

    const topProducts = Array.from(productMap.entries())
      .map(([product_id, stats]) => ({ product_id, ...stats }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // ---- FETCH PRODUCT TITLES ----
    const productIds = topProducts.map(p => p.product_id);
    let productTitles: Record<string, string> = {};
    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from('products')
        .select('id, title')
        .in('id', productIds);
      if (products) {
        productTitles = products.reduce((acc, p) => ({ ...acc, [p.id]: p.title }), {});
      }
    }

    const topProductsWithTitles = topProducts.map(p => ({
      ...p,
      title: productTitles[p.product_id] || 'Unknown Product'
    }));

    return NextResponse.json({
      totalVisitors,
      uniqueUsers,
      anonymousVisitors,
      todayVisitors,
      byCountry,
      topProducts: topProductsWithTitles,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
});