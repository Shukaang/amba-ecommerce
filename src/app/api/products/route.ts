import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/supabaseServer'
import { withAdminAuth } from '@/lib/auth/middleware'
import { slugify } from '@/lib/utils/slug'

// GET /api/products - List products with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const featured = searchParams.get('featured') === 'true'
    const sort = searchParams.get('sort') || 'newest'
    const isNew = searchParams.get('new') === 'true'

    const supabase = await createAdminClient()

    let query = supabase
      .from('products')
      .select(`
        *,
        categories(title),
        product_variants(*)
      `, { count: 'exact' })

    // Apply filters
    if (isNew) {
      const twoWeeksAgo = new Date()
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
      query = query.gte('created_at', twoWeeksAgo.toISOString())
    }

    if (categoryId && categoryId !== 'all' && categoryId !== 'men' && categoryId !== 'women' && categoryId !== 'accessories') {
      query = query.eq('category_id', categoryId)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (featured) {
      query = query.gte('average_rating', 4.0)
    }

    // Sorting
    if (sort === 'newest') {
      query = query.order('created_at', { ascending: false })
    } else if (sort === 'trending') {
      query = query.order('average_rating', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: products, error, count } = await query.range(from, to)

    if (error) throw error

    return NextResponse.json({
      products: products || [],
      total: count || 0,
      page,
      pages: Math.ceil((count || 0) / limit),
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST /api/products - Create new product
async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createAdminClient()

    // Generate slug from title
    let slug = slugify(body.title)

    // Check if slug exists and make it unique
    const { data: existing } = await supabase
      .from('products')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle()

    if (existing) {
      // Add timestamp to make it unique
      slug = `${slug}-${Date.now()}`
    }

    // Start transaction
    try {
      // Insert the product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          title: body.title,
          slug,
          description: body.description,
          category_id: body.category_id || null,
          price: body.price,
          images: body.images || [],
        })
        .select()
        .single()

      if (productError) {
        throw productError
      }

      // Insert variants if they exist
      if (body.variants && body.variants.length > 0) {
        const variantData = body.variants.map((variant: any) => ({
          product_id: product.id,
          color: variant.color || null,
          size: variant.size || null,
          unit: variant.unit || null,
          price: variant.price || body.price,
        }))

        const { error: variantsError } = await supabase
          .from('product_variants')
          .insert(variantData)

        if (variantsError) {
          throw variantsError
        }
      }

      // Fetch the complete product with variants
      const { data: completeProduct, error: fetchError } = await supabase
        .from('products')
        .select(`
          *,
          categories(title),
          product_variants(*)
        `)
        .eq('id', product.id)
        .single()

      if (fetchError) {
        throw fetchError
      }

      return NextResponse.json({
        product: completeProduct,
        message: 'Product created successfully',
      }, { status: 201 })

    } catch (error: any) {
      console.error('Transaction error:', error)
      throw error
    }

  } catch (error: any) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    )
  }
}

export const POSTHandler = withAdminAuth(POST)
export { POSTHandler as POST }