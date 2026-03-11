import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/supabaseServer';
import { verifyAuth } from '@/lib/auth/middleware';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, productId, type, userId: providedUserId } = await request.json();
    if (!sessionId || !productId || !type) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    if (!['view', 'add_to_cart', 'add_to_wishlist'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    // Skip admin users
    const user = await verifyAuth(request);
    if (user && (user.role === 'ADMIN' || user.role === 'SUPERADMIN')) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const supabase = await createAdminClient(); // <-- await added

    // Find session
    const { data: session, error: findError } = await supabase
      .from('visitor_tracking')
      .select('id, product_clicks, duration, updated_at')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (findError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const lastActive = new Date(session.updated_at).getTime();
    const nowTime = Date.now();
    const timeDiff = Math.floor((nowTime - lastActive) / 1000);

    // Update duration only if gap < 10 minutes
    const newDuration = (session.duration || 0) + (timeDiff < 600 ? timeDiff : 0);

    const click = {
      product_id: productId,
      type,
      timestamp: now,
    };

    let clicks = session.product_clicks || [];
    clicks.push(click);
    if (clicks.length > 100) {
      clicks = clicks.slice(-100);
    }

    await supabase
      .from('visitor_tracking')
      .update({
        product_clicks: clicks,
        duration: newDuration,
        updated_at: now,
        user_id: providedUserId || undefined,
      })
      .eq('id', session.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track product click error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}