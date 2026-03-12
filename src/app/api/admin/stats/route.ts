import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/supabaseServer';
import { verifyAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || !['ADMIN', 'SUPERADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createAdminClient();

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(now.getDate() - 60);

    const isSuperAdmin = user.role === 'SUPERADMIN';

    // Helper to build user queries with optional SUPERADMIN exclusion
    const userQuery = (gte: Date, lt?: Date) => {
      let query = supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', gte.toISOString());
      if (lt) query = query.lt('created_at', lt.toISOString());
      if (!isSuperAdmin) query = query.neq('role', 'SUPERADMIN');
      return query;
    };

    const [
      recentOrders,
      recentProducts,
      recentUsers,
      recentPending,
      prevOrders,
      prevProducts,
      prevUsers,
      prevPending,
    ] = await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo.toISOString()),
      supabase.from('products').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo.toISOString()),
      userQuery(thirtyDaysAgo),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'PENDING').gte('created_at', thirtyDaysAgo.toISOString()),
      supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', sixtyDaysAgo.toISOString()).lt('created_at', thirtyDaysAgo.toISOString()),
      supabase.from('products').select('*', { count: 'exact', head: true }).gte('created_at', sixtyDaysAgo.toISOString()).lt('created_at', thirtyDaysAgo.toISOString()),
      userQuery(sixtyDaysAgo, thirtyDaysAgo),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'PENDING').gte('created_at', sixtyDaysAgo.toISOString()).lt('created_at', thirtyDaysAgo.toISOString()),
    ]);

    return NextResponse.json({
      recentOrders: recentOrders.count ?? 0,
      recentProducts: recentProducts.count ?? 0,
      recentUsers: recentUsers.count ?? 0,
      recentPending: recentPending.count ?? 0,
      prevOrders: prevOrders.count ?? 0,
      prevProducts: prevProducts.count ?? 0,
      prevUsers: prevUsers.count ?? 0,
      prevPending: prevPending.count ?? 0,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}