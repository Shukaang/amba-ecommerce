import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/supabaseServer';
import { verifyResetToken } from '@/lib/auth/jwt';
import { hashPassword } from '@/lib/auth/password';
import { z } from 'zod';

const resetSchema = z.object({
  token: z.string(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = resetSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;

    // 1. Verify token
    const decoded = verifyResetToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // 2. Check user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', decoded.id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      );
    }

    // 3. Hash new password using your utility
    const hashedPassword = await hashPassword(password);

    // 4. Update password AND password_changed_at
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password: hashedPassword, 
        updated_at: new Date().toISOString(),
        password_changed_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    // 5. Delete any remaining OTPs for this user (extra cleanup)
    await supabase.from('otp').delete().eq('user_id', user.id);

    return NextResponse.json({
      message: 'Password reset successfully. You can now log in.',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}