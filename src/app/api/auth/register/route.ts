import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth/password';
import { createToken } from '@/lib/auth/jwt';
import { registerServerSchema } from '@/lib/auth/schemas';
import { createAdminClient } from '@/lib/supabase/supabaseServer';
import dns from 'dns/promises';
import { verifyEmail } from '@/lib/email-verification'; // adjust path if needed

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => {
      throw new Error('Invalid JSON body');
    });

    const validatedData = registerServerSchema.parse(body);

    // 1. Extract domain
    const domain = validatedData.email.split('@')[1];
    if (!domain) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // 2. MX record lookup (optional but cheap)
    try {
      const mxRecords = await dns.resolveMx(domain);
      if (!mxRecords || mxRecords.length === 0) {
        return NextResponse.json(
          { error: 'Email domain does not accept emails' },
          { status: 400 }
        );
      }
    } catch (dnsError: any) {
      return NextResponse.json(
        { error: 'Email domain does not exist' },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // 3. Check if email already exists in DB (before calling DeBounce)
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', validatedData.email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // 4. DeBounce verification (only if email is new)
    if (process.env.DEBOUNCE_API_KEY) {
      try {
        const verification = await verifyEmail(validatedData.email);
        if (!verification.valid) {
          return NextResponse.json(
            { error: verification.reason || 'Email is invalid or undeliverable' },
            { status: 400 }
          );
        }
      } catch (verifyError) {
        console.error('Email verification error:', verifyError);
        // Fail open – allow registration but log error (or return 503 if you prefer)
        return NextResponse.json(
          { error: 'Email verification service unavailable. Please try again later.' },
          { status: 503 }
        );
      }
    } else {
      console.warn('DEBOUNCE_API_KEY not set – skipping email verification');
    }

    // 5. Create user
    const hashedPassword = await hashPassword(validatedData.password);

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        role: 'CUSTOMER',
        status: 'ACTIVE'
      })
      .select('id, email, name, phone, address, role, status, created_at, updated_at')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create user. Please try again.' },
        { status: 500 }
      );
    }

    const token = createToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        address: user.address,
        role: user.role,
        status: user.status,
      },
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;

  } catch (error: any) {
    console.error('Registration error:', error);

    if (error.name === 'ZodError') {
      const firstError = error.errors[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    if (error.message === 'Invalid JSON body') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}