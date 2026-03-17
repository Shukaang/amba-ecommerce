import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/supabaseServer';
import { verifyAuth } from '@/lib/auth/middleware';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = request.cookies.get('visitor_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ merged: false, message: 'No session' });
    }

    const supabase = await createAdminClient();

    // Get all session favorites
    const { data: sessionFavorites, error: fetchError } = await supabase
      .from('favorites')
      .select('product_id')
      .is('user_id', null)
      .eq('session_id', sessionId);

    if (fetchError) {
      console.error('Error fetching session favorites:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!sessionFavorites || sessionFavorites.length === 0) {
      return NextResponse.json({ merged: false, message: 'No favorites to merge' });
    }

    // Insert each product for the user, ignoring duplicates
    const productIds = sessionFavorites.map(f => f.product_id);
    const inserts = productIds.map(productId => ({
      user_id: user.id,
      product_id: productId,
    }));

    const { error: insertError } = await supabase
      .from('favorites')
      .upsert(inserts, { onConflict: 'user_id, product_id', ignoreDuplicates: true });

    if (insertError) {
      console.error('Error inserting user favorites:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Delete session favorites
    const { error: deleteError } = await supabase
      .from('favorites')
      .delete()
      .is('user_id', null)
      .eq('session_id', sessionId);

    if (deleteError) {
      console.error('Error deleting session favorites:', deleteError);
      // Not critical, continue
    }

    return NextResponse.json({ merged: true, count: productIds.length });
  } catch (error: any) {
    console.error('Favorites merge error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}