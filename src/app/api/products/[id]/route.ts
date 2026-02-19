import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/supabaseServer'
import { withAdminAuth } from '@/lib/auth/middleware'

// GET single product with variants
async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createAdminClient()

    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(*),
        product_variants(*),
        ratings(*, users(name, email))
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ product })

  } catch (error: any) {
    console.error('Get product error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// PUT update product with variants (renamed to updateProduct to avoid conflict)
async function updateProduct(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const supabase = await createAdminClient()

    // Start transaction
    try {
      // Update the product
      const { data: product, error: productError } = await supabase
        .from('products')
        .update({
          title: body.title,
          description: body.description,
          category_id: body.category_id || null,
          price: body.price,
          images: body.images || [],
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)
        .select()
        .single()

      if (productError) {
        throw productError
      }

      // Handle variants
      if (body.variants !== undefined) {
        // First, delete existing variants for this product
        await supabase
          .from('product_variants')
          .delete()
          .eq('product_id', params.id)

        // Then insert new variants if they exist
        if (body.variants && body.variants.length > 0) {
          // Filter out empty variants
          const validVariants = body.variants.filter((variant: any) => 
            variant.color?.trim() || variant.size?.trim() || variant.unit?.trim()
          )

          if (validVariants.length > 0) {
            const variantData = validVariants.map((variant: any) => ({
              product_id: params.id,
              color: variant.color?.trim() || null,
              size: variant.size?.trim() || null,
              unit: variant.unit?.trim() || null,
              price: variant.price || body.price,
            }))

            const { error: variantsError } = await supabase
              .from('product_variants')
              .insert(variantData)

            if (variantsError) {
              throw variantsError
            }
          }
        }
      }

      // Fetch the complete updated product
      const { data: completeProduct, error: fetchError } = await supabase
        .from('products')
        .select(`
          *,
          categories(title),
          product_variants(*)
        `)
        .eq('id', params.id)
        .single()

      if (fetchError) {
        throw fetchError
      }

      return NextResponse.json({
        product: completeProduct,
        message: 'Product updated successfully',
      })

    } catch (error: any) {
      console.error('Transaction error:', error)
      throw error
    }

  } catch (error: any) {
    console.error('Update product error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE product and its variants (renamed to deleteProduct to avoid conflict)
async function deleteProduct(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createAdminClient()

    // Check if product exists
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id, title')
      .eq('id', params.id)
      .single()

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Delete variants first (due to foreign key constraints)
    const { error: variantsError } = await supabase
      .from('product_variants')
      .delete()
      .eq('product_id', params.id)

    if (variantsError) {
      console.error('Delete variants error:', variantsError)
    }

    // Delete product
    const { error: productError } = await supabase
      .from('products')
      .delete()
      .eq('id', params.id)

    if (productError) {
      throw productError
    }

    return NextResponse.json({
      message: `Product "${existingProduct.title}" deleted successfully`,
    })

  } catch (error: any) {
    console.error('Delete product error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete product' },
      { status: 500 }
    )
  }
}

// EXPORTS
// Public access - export GET directly
export { GET }

// Apply auth middleware to the renamed functions and export as PUT/DELETE
export const PUT = withAdminAuth(updateProduct)
export const DELETE = withAdminAuth(deleteProduct)