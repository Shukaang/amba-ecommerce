import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/supabaseServer'
import { verifyToken } from '@/lib/auth/jwt'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ user: null })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ user: null })
    }

    // Use admin client to bypass RLS
    const supabase = await createAdminClient()
    const { data: user } = await supabase
      .from('users')
      .select('id, email, name, phone, address, role, status, created_at, updated_at')
      .eq('id', decoded.id)
      .single()

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        address: user.address,
        role: user.role,
        status: user.status,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    })
  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json({ user: null })
  }
}