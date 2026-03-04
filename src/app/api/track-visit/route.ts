import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/supabaseServer';
import { UAParser } from 'ua-parser-js';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId } = await request.json();
    const supabase = await createAdminClient();

    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    const parser = new UAParser(userAgent);
    const deviceInfo = `${parser.getOS().name} ${parser.getOS().version} - ${parser.getBrowser().name} ${parser.getBrowser().version}`;

    const { data: existingSession } = await supabase
      .from('visitor_tracking')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    const now = new Date().toISOString();

    if (existingSession) {
      const lastVisit = new Date(existingSession.visited_at);
      const currentVisit = new Date();
      const durationSeconds = Math.floor((currentVisit.getTime() - lastVisit.getTime()) / 1000);

      const updateData: any = {
        ip_address: ip,
        visited_at: now,
        updated_at: now,
        duration: (existingSession.duration || 0) + durationSeconds,
      };

      // If user logged in and previous session was anonymous, update user_id
      if (userId && existingSession.user_id !== userId) {
        updateData.user_id = userId;
      }

      await supabase
        .from('visitor_tracking')
        .update(updateData)
        .eq('id', existingSession.id);
    } else {
      await supabase
        .from('visitor_tracking')
        .insert({
          session_id: sessionId,
          user_id: userId || null,
          ip_address: ip,
          device_info: deviceInfo,
          visited_at: now,
          updated_at: now,
          duration: 0,
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track visit error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}