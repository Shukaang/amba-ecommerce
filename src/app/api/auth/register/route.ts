import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth/password';
import { createToken } from '@/lib/auth/jwt';
import { registerSchema } from '@/lib/auth/schemas';
import { createAdminClient } from '@/lib/supabase/supabaseServer';
import dns from 'dns/promises'; // built‑in, no extra package

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // 1. Extract domain from email
    const domain = validatedData.email.split('@')[1];
    if (!domain) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // 2. MX record lookup – verify domain can receive email
    try {
      const mxRecords = await dns.resolveMx(domain);
      if (!mxRecords || mxRecords.length === 0) {
        return NextResponse.json(
          { error: 'Email domain does not accept emails' },
          { status: 400 }
        );
      }
    } catch (dnsError: any) {
      // DNS resolution failed – domain probably doesn't exist
      return NextResponse.json(
        { error: 'Email does not exist. Please enter a valid email' },
        { status: 400 }
      );
    }

    // 3. Proceed with registration
    const supabase = await createAdminClient();

    // Check if user already exists
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

    if (error) throw error;

    // Create JWT token
    const token = createToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Set HTTP-only cookie
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
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}