import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/supabaseServer';
import { withSuperAdminAuth } from '@/lib/auth/middleware';

// DELETE visitor session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await the params promise to get the actual id
  const { id } = await params;

  return withSuperAdminAuth(async () => {
    try {
      const supabase = await createAdminClient();

      const { error } = await supabase
        .from('visitor_tracking')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to delete visitor' },
        { status: 500 }
      );
    }
  })(request);
}