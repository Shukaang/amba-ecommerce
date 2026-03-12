import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/supabaseServer';
import { verifyAuth } from '@/lib/auth/middleware';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId } = await request.json();
    if (!sessionId || !userId) {
      return NextResponse.json({ error: 'sessionId and userId required' }, { status: 400 });
    }

    // Skip admin users
    const user = await verifyAuth(request);
    if (user && (user.role === 'ADMIN' || user.role === 'SUPERADMIN')) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const supabase = await createAdminClient(); // <-- await added

    await supabase
      .from('visitor_tracking')
      .update({
        user_id: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track identify error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}