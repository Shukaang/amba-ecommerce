import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/supabaseServer';
import { withSuperAdminAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return withSuperAdminAuth(async () => {
    try {
      const supabase = await createAdminClient();
      
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '15');
      const search = searchParams.get('search') || '';
      const filter = searchParams.get('filter') || 'all';
      
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      let query = supabase
        .from('visitor_tracking')
        .select(`
          *,
          users:user_id (email, name)
        `, { count: 'exact' });
      
      // Apply filters
      if (filter === 'registered') {
        query = query.not('user_id', 'is', null);
      } else if (filter === 'anonymous') {
        query = query.is('user_id', null);
      }
      
      // Apply search
      if (search) {
        query = query.or(`
          session_id.ilike.%${search}%,
          device_info.ilike.%${search}%,
          users.email.ilike.%${search}%,
          users.name.ilike.%${search}%
        `);
      }
      
      const { data: visitors, error, count } = await query
        .order('visited_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;

      // ---- ENRICH WITH PRODUCT TITLES ----
      // Collect all product IDs from all visitors' product_clicks
      const productIds = new Set<string>();
      visitors?.forEach(v => {
        if (v.product_clicks && Array.isArray(v.product_clicks)) {
          v.product_clicks.forEach((click: any) => {
            if (click.product_id) productIds.add(click.product_id);
          });
        }
      });

      let productTitles: Record<string, string> = {};
      if (productIds.size > 0) {
        const { data: products } = await supabase
          .from('products')
          .select('id, title')
          .in('id', Array.from(productIds));
        
        if (products) {
          productTitles = products.reduce((acc, p) => ({ ...acc, [p.id]: p.title }), {});
        }
      }

      // Attach product_title to each click
      const enrichedVisitors = visitors?.map(v => ({
        ...v,
        product_clicks: v.product_clicks?.map((click: any) => ({
          ...click,
          product_title: productTitles[click.product_id] || 'Unknown Product'
        }))
      })) || [];
      
      return NextResponse.json({
        visitors: enrichedVisitors,
        total: count || 0,
        page,
        pages: Math.ceil((count || 0) / limit),
        analytics: {
          totalVisitors: count || 0,
          uniqueUsers: 0,
          anonymousVisitors: 0,
          todayVisitors: 0
        }
      });
    } catch (error) {
      console.error('Visitor fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch visitors' }, 
        { status: 500 }
      );
    }
  })(request);
}