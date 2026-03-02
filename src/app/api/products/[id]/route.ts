import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/supabaseServer';
import { withAdminAuth } from '@/lib/auth/middleware';
import { uploadProductImage, deleteProductImage, deleteProductFolder } from '@/lib/supabase/storage';
import { verifyAuth } from '@/lib/auth/middleware';

// GET – public: only approved; admin: any
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();

    const user = await verifyAuth(request);
    const isAdmin = user && ['ADMIN', 'SUPERADMIN'].includes(user.role);

    let query = supabase
      .from('products')
      .select(`
        *,
        categories(*),
        product_variants(*),
        ratings(*, users(name, email))
      `)
      .eq('id', id);

    if (!isAdmin) {
      query = query.eq('status', 'approved');
    }

    const { data: product, error } = await query.single();

    if (error) throw error;

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error('Get product error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

async function updateProduct(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const formData = await request.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category_id = formData.get('category_id') as string;
    const price = parseFloat(formData.get('price') as string);
    const existingImagesJson = formData.get('existingImages') as string;
    const imagesToDeleteJson = formData.get('imagesToDelete') as string;
    const variantsJson = formData.get('variants') as string | null;
    const newImageFiles = formData.getAll('newImages') as File[];

    if (!title || !description || isNaN(price)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const existingImages: string[] = existingImagesJson ? JSON.parse(existingImagesJson) : [];
    const imagesToDelete: string[] = imagesToDeleteJson ? JSON.parse(imagesToDeleteJson) : [];

    const supabase = await createAdminClient();

    // Delete images marked for deletion
    for (const url of imagesToDelete) {
      await deleteProductImage(url);
    }

    // Upload new images
    const newImageUrls: string[] = [];
    for (const file of newImageFiles) {
      try {
        const url = await uploadProductImage(id, file);
        newImageUrls.push(url);
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError);
      }
    }

    // Final images array = kept existing + new
    const finalImages = [...existingImages, ...newImageUrls];

    // Update product with updated_by set to current user
    const { error: productError } = await supabase
      .from('products')
      .update({
        title,
        description,
        category_id: category_id === 'null' ? null : category_id,
        price,
        images: finalImages,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', id);

    if (productError) throw productError;

    // Update variants: delete all and reinsert
    await supabase.from('product_variants').delete().eq('product_id', id);

    if (variantsJson) {
      const variants = JSON.parse(variantsJson);
      if (variants.length > 0) {
        const variantData = variants.map((v: any) => ({
          product_id: id,
          color: v.color,
          size: v.size,
          unit: v.unit,
          price: v.price,
        }));
        const { error: variantsError } = await supabase
          .from('product_variants')
          .insert(variantData);
        if (variantsError) throw variantsError;
      }
    }

    // Fetch updated product with creator and updater info
    const { data: completeProduct, error: fetchError } = await supabase
      .from('products')
      .select(`
        *,
        categories(title),
        product_variants(*),
        creator:users!products_created_by_fkey(id, name, email),
        updater:users!products_updated_by_fkey(id, name, email)
      `)
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json({
      product: completeProduct,
      message: 'Product updated successfully',
    });
  } catch (error: any) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}

async function deleteProduct(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();

    const { data: existingProduct } = await supabase
      .from('products')
      .select('id, title, images')
      .eq('id', id)
      .single();

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    await deleteProductFolder(id);
    await supabase.from('product_variants').delete().eq('product_id', id);
    const { error: productError } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (productError) throw productError;

    return NextResponse.json({
      message: `Product "${existingProduct.title}" deleted successfully`,
    });
  } catch (error: any) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}

export const PUT = withAdminAuth(updateProduct);
export const DELETE = withAdminAuth(deleteProduct);