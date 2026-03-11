import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/supabaseServer';
import { verifyAuth } from '@/lib/auth/middleware';
import { UAParser } from 'ua-parser-js';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    // Skip admin users
    const user = await verifyAuth(request);
    if (user && (user.role === 'ADMIN' || user.role === 'SUPERADMIN')) {
      return NextResponse.json({ success: true, skipped: true });
    }

    // Get geolocation from Vercel headers
    const country = request.headers.get('x-vercel-ip-country') || null;
    const city = request.headers.get('x-vercel-ip-city') || null;
    const region = request.headers.get('x-vercel-ip-country-region') || null;
    const latitude = request.headers.get('x-vercel-ip-latitude');
    const longitude = request.headers.get('x-vercel-ip-longitude');

    // Parse user agent
    const ua = request.headers.get('user-agent') || '';
    const parser = new UAParser(ua);
    const deviceInfo = `${parser.getOS().name} ${parser.getOS().version} - ${parser.getBrowser().name} ${parser.getBrowser().version}`;

    const supabase = await createAdminClient(); // <-- await added

    // Check if session exists
    const { data: existing } = await supabase
      .from('visitor_tracking')
      .select('id')
      .eq('session_id', sessionId)
      .maybeSingle();

    const now = new Date().toISOString();

    if (existing) {
      // Update existing session
      await supabase
        .from('visitor_tracking')
        .update({
          user_id: userId || undefined,
          updated_at: now,
          country,
          city,
          region,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          device_info: deviceInfo,
        })
        .eq('id', existing.id);
    } else {
      // Insert new session
      await supabase
        .from('visitor_tracking')
        .insert({
          session_id: sessionId,
          user_id: userId || null,
          visited_at: now,
          updated_at: now,
          country,
          city,
          region,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          device_info: deviceInfo,
          product_clicks: [],
          duration: 0,
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track init error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}