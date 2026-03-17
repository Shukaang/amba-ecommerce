import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/supabaseServer';
import { verifyAuth } from '@/lib/auth/middleware';

// api/favorites/[productId]/route.ts
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const user = await verifyAuth(request);
    const sessionId = request.cookies.get('visitor_session')?.value;

    if (!user && !sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createAdminClient();

    let query = supabase
      .from('favorites')
      .delete()
      .eq('product_id', productId);

    if (user) {
      query = query.eq('user_id', user.id);
    } else {
      query = query.is('user_id', null).eq('session_id', sessionId);
    }

    const { error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Favorites delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}