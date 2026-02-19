import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword } from '@/lib/auth/password'
import { createToken } from '@/lib/auth/jwt'
import { loginSchema } from '@/lib/auth/schemas'
import { createAdminClient } from '@/lib/supabase/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    // Use admin client to bypass RLS
    const supabase = await createAdminClient()

    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', validatedData.email)
      .single()

    if (error || !user) {
      console.error('User not found:', error)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    console.log('Found user:', { email: user.email, hasPassword: !!user.password })

    // Check user status
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: `Account is ${user.status.toLowerCase()}. Please contact support.` },
        { status: 403 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(validatedData.password, user.password)
    console.log('Password verification:', { isValidPassword })
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
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
    role: user.role,
  },
})

response.cookies.set('auth-token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax', // Changed from 'strict' to 'lax'
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
})

return response

  } catch (error: any) {
    console.error('Login error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    )
  }
}