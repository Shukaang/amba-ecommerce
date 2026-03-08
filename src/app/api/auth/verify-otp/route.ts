import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/supabaseServer';
import bcrypt from 'bcryptjs';
import { createResetToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();
    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // 1. Find user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // 2. Find the latest valid (not expired) OTP for this user
    const now = new Date().toISOString();
    const { data: otpRecord, error: otpError } = await supabase
      .from('otp')
      .select('*')
      .eq('user_id', user.id)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError || !otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // 3. Verify OTP hash
    const isValid = await bcrypt.compare(otp, otpRecord.otp_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // 4. Delete all OTPs for this user (cleanup)
    await supabase.from('otp').delete().eq('user_id', user.id);

    // 5. Create a short‑lived token for password reset
    const token = createResetToken(user.id);

    return NextResponse.json({
      token,
      message: 'OTP verified successfully',
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}