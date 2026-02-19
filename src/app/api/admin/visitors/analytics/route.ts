import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/supabaseServer';
import { withSuperAdminAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return withSuperAdminAuth(async () => {
    try {
      const supabase = await createAdminClient();
      
      // Get all visitors for analytics
      const { data: visitors, error } = await supabase
        .from('visitor_tracking')
        .select('user_id, visited_at');
      
      if (error) throw error;
      
      const today = new Date().toDateString();
      const todayVisitors = visitors?.filter(v => 
        new Date(v.visited_at).toDateString() === today
      ).length || 0;

      const uniqueUserIds = new Set(
        visitors?.filter(v => v.user_id).map(v => v.user_id) || []
      );

      return NextResponse.json({
        totalVisitors: visitors?.length || 0,
        uniqueUsers: uniqueUserIds.size,
        anonymousVisitors: visitors?.filter(v => !v.user_id).length || 0,
        todayVisitors
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to fetch analytics' }, 
        { status: 500 }
      );
    }
  })(request);
}