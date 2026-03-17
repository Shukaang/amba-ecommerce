import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/supabaseServer';
import { verifyAuth } from '@/lib/auth/middleware';
import { verifyPassword, hashPassword } from '@/lib/auth/password';
import { changePasswordServerSchema } from '@/lib/auth/schemas';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = changePasswordServerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validation.data;

    const supabase = await createAdminClient();

    const { data: dbUser, error: fetchError } = await supabase
      .from('users')
      .select('id, password, password_changed_at')
      .eq('id', user.id)
      .single();

    if (fetchError || !dbUser) {
      console.error('User fetch error:', fetchError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const passwordValid = await verifyPassword(currentPassword, dbUser.password);
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Check if new password is the same as current
    const isSamePassword = await verifyPassword(newPassword, dbUser.password);
    if (isSamePassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      );
    }

    const now = new Date();
    const lastChanged = dbUser.password_changed_at
      ? new Date(dbUser.password_changed_at)
      : new Date(0);

    const daysSinceLastChange = Math.floor(
      (now.getTime() - lastChanged.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastChange < 30) {
      const daysRemaining = 30 - daysSinceLastChange;
      return NextResponse.json(
        {
          error: `You can only change your password once every 30 days. Please wait ${daysRemaining} more day(s).`,
        },
        { status: 403 }
      );
    }

    const hashedPassword = await hashPassword(newPassword);

    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        password_changed_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Password update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}