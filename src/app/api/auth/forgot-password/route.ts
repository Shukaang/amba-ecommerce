import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/supabaseServer';
import { sendOtpEmail } from '@/lib/email-otp';
import bcrypt from 'bcryptjs';

const OTP_EXPIRY_MINUTES = 10;
const OTP_COOLDOWN_SECONDS = 90;
const OTP_DAILY_LIMIT = 3;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // 1. Find user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', email)
      .single();

    if (userError || !user) {
      // User not found – return error
      return NextResponse.json(
        { error: 'No account found with this email address.' },
        { status: 404 }
      );
    }

    // 2. Rate limiting: daily limit (requests in last 24h)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count, error: countError } = await supabase
      .from('otp')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', todayStart.toISOString());

    if (countError) throw countError;

    const requestCount = count ?? 0;
    if (requestCount >= OTP_DAILY_LIMIT) {
      return NextResponse.json(
        { error: 'Daily OTP limit reached. Try again tomorrow.' },
        { status: 429 }
      );
    }

    // 3. Cooldown: last OTP sent less than 90 seconds ago?
    const { data: lastOtp, error: lastError } = await supabase
      .from('otp')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastOtp) {
      const lastSent = new Date(lastOtp.created_at).getTime();
      const now = Date.now();
      if (now - lastSent < OTP_COOLDOWN_SECONDS * 1000) {
        const waitSeconds = Math.ceil((OTP_COOLDOWN_SECONDS * 1000 - (now - lastSent)) / 1000);
        return NextResponse.json(
          { error: `Please wait ${waitSeconds} seconds before requesting another OTP.` },
          { status: 429 }
        );
      }
    }

    // 4. Generate OTP (6 digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // 5. Store OTP
    const { error: insertError } = await supabase
      .from('otp')
      .insert({
        user_id: user.id,
        otp_hash: otpHash,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) throw insertError;

    // 6. Send email (non‑blocking)
    sendOtpEmail({ to: user.email, otp, name: user.name }).catch(err =>
      console.error('Failed to send OTP email:', err)
    );

    return NextResponse.json({
  success: true,
  message: 'OTP sent successfully.',
  cooldownSeconds: OTP_COOLDOWN_SECONDS,
  expiryMinutes: OTP_EXPIRY_MINUTES,
});
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}