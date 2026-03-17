import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/supabaseServer';
import { verifyAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    const sessionId = request.cookies.get('visitor_session')?.value;

    if (!user && !sessionId) {
      return NextResponse.json({ items: [] });
    }

    const supabase = await createAdminClient();

    // Build the base query
    let query = supabase
      .from('favorites')
      .select(`
        product_id,
        products (
          id,
          slug,
          title,
          description,
          price,
          average_rating,
          images,
          product_variants (*),
          deleted_at
        )
      `)
      .order('created_at', { ascending: false });

    // Filter by user or session
    if (user) {
      query = query.eq('user_id', user.id);
    } else {
      query = query.is('user_id', null).eq('session_id', sessionId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Favorites fetch error:', error);
      return NextResponse.json({ items: [] });
    }

    // Filter out any products that might be soft-deleted
    const items = data
      ?.map(item => item.products)
      .filter(product => product && (product as any).deleted_at === null) || [];

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Favorites catch error:', error);
    return NextResponse.json({ items: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { productId } = await request.json();
    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const user = await verifyAuth(request);
    const sessionId = request.cookies.get('visitor_session')?.value;

    if (!user && !sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createAdminClient();

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, slug, title, description, price, average_rating, images, product_variants(*)')
      .eq('id', productId)
      .is('deleted_at', null)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if already favorited
    let checkQuery = supabase
      .from('favorites')
      .select('id')
      .eq('product_id', productId);

    if (user) {
      checkQuery = checkQuery.eq('user_id', user.id);
    } else {
      checkQuery = checkQuery.is('user_id', null).eq('session_id', sessionId);
    }

    const { data: existing } = await checkQuery.maybeSingle();

    if (existing) {
      // Remove
      const { error: deleteError } = await supabase
        .from('favorites')
        .delete()
        .eq('id', existing.id);

      if (deleteError) throw deleteError;
      return NextResponse.json({ added: false });
    } else {
      // Add
      const insertData: any = { product_id: productId };
      if (user) {
        insertData.user_id = user.id;
      } else {
        if (!sessionId) {
          return NextResponse.json({ error: 'Session required' }, { status: 400 });
        }
        insertData.session_id = sessionId;
      }
      const { error: insertError } = await supabase
        .from('favorites')
        .insert(insertData);

      if (insertError) throw insertError;
      return NextResponse.json({ added: true, product });
    }
  } catch (error: any) {
    console.error('Favorites toggle error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}