import { NextRequest, NextResponse } from 'next/server'
import { hashPassword } from '@/lib/auth/password'
import { createToken } from '@/lib/auth/jwt'
import { registerSchema } from '@/lib/auth/schemas'
import { createAdminClient } from '@/lib/supabase/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    const supabase = await createAdminClient()

    // Create user with all fields
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: validatedData.email,
        name: validatedData.name,
        password: await hashPassword(validatedData.password),
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        role: 'CUSTOMER',
        status: 'ACTIVE'
      })
      .select('id, email, name, phone, address, role, status, created_at, updated_at')
      .single()

    if (error) {
      throw error
    }

    // Create JWT token
    const token = createToken({
      id: user.id,
      email: user.email,
      role: user.role,
    })

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
    })

    response.cookies.set('auth-token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 60 * 60 * 24 * 7,
  path: '/',
})

return response

  } catch (error: any) {
    console.error('Registration error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    )
  }
}