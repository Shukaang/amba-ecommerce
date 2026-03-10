import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/supabaseServer';
import { verifyAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || !['ADMIN', 'SUPERADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createAdminClient();

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        users!orders_user_id_fkey(id, name, email, phone, address),
        updated_by_user:users!orders_updated_by_fkey(id, name, email),
        order_items(
        *,
        products(*),
        product_variants(*)
        )
        `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      orders: orders || [],
    });
  } catch (error: any) {
    console.error('Admin orders fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}