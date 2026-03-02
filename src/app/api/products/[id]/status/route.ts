import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/supabaseServer';
import { verifyAuth } from '@/lib/auth/middleware';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    if (user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Only SUPERADMIN can change product status' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { status } = await request.json();

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from('products')
      .update({ status })
      .eq('id', id)
      .select('id, title, status')
      .single();

    if (error) throw error;

    return NextResponse.json({
      product: data,
      message: `Product status updated to ${status}`,
    });
  } catch (error: any) {
    console.error('Update product status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update product status' },
      { status: 500 }
    );
  }
}