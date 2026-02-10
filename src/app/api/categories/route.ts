import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const getAll = searchParams.get('all') === 'true'

    const supabase = await createAdminClient()

    let query = supabase
      .from('categories')
      .select(`
        id,
        title,
        description,
        parent_id
      `)

    if (!getAll) {
      query = query.order('title')
    } else {
      query = query.select('*').order('title')
    }

    const { data: categories, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ categories: categories || [] })

  } catch (error: any) {
    console.error('Get categories error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// Add POST for creating categories
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    const { data: category, error } = await supabase
      .from('categories')
      .insert([{
        title: body.title,
        description: body.description || null,
        parent_id: body.parent_id || null,
        image: body.image || null,
      }])
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      category,
      message: 'Category created successfully',
    })

  } catch (error: any) {
    console.error('Create category error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create category' },
      { status: 500 }
    )
  }
}