import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/supabaseServer';
import { UAParser } from 'ua-parser-js';
import { verifyAuth } from '@/lib/auth/middleware';

// In /app/api/track-visit/route.ts
export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    const supabase = await createAdminClient();
    
    const user = await verifyAuth(request);
    
    // Skip tracking if user is SUPERADMIN
    if (user?.role === 'SUPERADMIN') {
      return NextResponse.json({ success: true, skipped: true });
    }
    
    // Get device info
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    
    const parser = new UAParser(userAgent);
    const deviceInfo = `${parser.getOS().name} ${parser.getOS().version} - ${parser.getBrowser().name} ${parser.getBrowser().version}`;
    
    // Check if session exists and calculate duration
    const { data: existingSession } = await supabase
      .from('visitor_tracking')
      .select('*')
      .eq('session_id', sessionId)
      .single();
    
    const now = new Date().toISOString();
    
    if (existingSession) {
      // Calculate duration in seconds
      const lastVisit = new Date(existingSession.visited_at);
      const currentVisit = new Date();
      const durationSeconds = Math.floor((currentVisit.getTime() - lastVisit.getTime()) / 1000);
      
      // Update existing session with accumulated duration
      const totalDuration = (existingSession.duration || 0) + durationSeconds;
      
      await supabase
        .from('visitor_tracking')
        .update({
          user_id: user?.id || existingSession.user_id,
          ip_address: ip, // Update IP in case it changed
          visited_at: now,
          updated_at: now,
          duration: totalDuration
        })
        .eq('session_id', sessionId);
    } else {
      // Create new session
      await supabase
        .from('visitor_tracking')
        .insert({
          session_id: sessionId,
          user_id: user?.id || null,
          ip_address: ip,
          device_info: deviceInfo,
          visited_at: now,
          updated_at: now,
          duration: 0
        });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: true });
  }
}