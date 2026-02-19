import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/supabaseServer'
import { withAdminAuth } from '@/lib/auth/middleware'

async function GETHandler(request: NextRequest) {
  try {
    const supabase = await createAdminClient()

    const { data: ratings, error } = await supabase
      .from('ratings')
      .select(`
        *,
        product:products(id, title, images),
        user:users(id, name, email)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ ratings })
  } catch (error: any) {
    console.error('Fetch ratings error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch ratings' },
      { status: 500 }
    )
  }
}

export const GET = withAdminAuth(GETHandler)