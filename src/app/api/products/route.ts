import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/supabaseServer'
import { withAdminAuth } from '@/lib/auth/middleware'

// GET all products
async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const supabase = await createAdminClient()

    let query = supabase
      .from('products')
      .select(`
        *,
        categories(title),
        product_variants(*),
        create_at,
        updated_at
      `, { count: 'exact' })

    // Apply filters
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: products, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      throw error
    }

    return NextResponse.json({
      products: products || [],
      total: count || 0,
      page,
      pages: Math.ceil((count || 0) / limit),
    })

  } catch (error: any) {
    console.error('Get products error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST create new product with variants
async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.description || !body.price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // Start transaction (we'll handle manually as Supabase doesn't have transactions)
    try {
      // Create the product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert([
          {
            title: body.title,
            description: body.description,
            category_id: body.category_id || null,
            price: body.price,
            images: body.images || [],
            average_rating: 0,
          },
        ])
        .select()
        .single()

      if (productError) {
        throw productError
      }

      // Create variants if they exist
      if (body.variants && body.variants.length > 0) {
        // Filter out empty variants (all empty attributes)
        const validVariants = body.variants.filter((variant: any) => 
          variant.color?.trim() || variant.size?.trim() || variant.unit?.trim()
        )

        if (validVariants.length > 0) {
          const variantData = validVariants.map((variant: any) => ({
            product_id: product.id,
            color: variant.color?.trim() || null,
            size: variant.size?.trim() || null,
            unit: variant.unit?.trim() || null,
            price: variant.price || body.price, // Fallback to base price if not specified
          }))

          const { error: variantsError } = await supabase
            .from('product_variants')
            .insert(variantData)

          if (variantsError) {
            // Rollback: delete the created product if variants fail
            await supabase.from('products').delete().eq('id', product.id)
            throw variantsError
          }
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

// Export handlers with auth middleware
export const GETHandler = withAdminAuth(GET)
export const POSTHandler = withAdminAuth(POST)

export { GETHandler as GET, POSTHandler as POST }