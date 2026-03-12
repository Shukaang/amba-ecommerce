import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/supabaseServer';
import { withAdminAuth } from '@/lib/auth/middleware';
import { uploadProductImage, deleteProductImage, deleteProductFolder } from '@/lib/supabase/storage';
import { verifyAuth } from '@/lib/auth/middleware';

// GET – unchanged
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const formData = await request.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const link = formData.get('link') as string | null;
    const category_id = formData.get('category_id') as string;
    const price = parseFloat(formData.get('price') as string);
    const existingImagesJson = formData.get('existingImages') as string;
    const imagesToDeleteJson = formData.get('imagesToDelete') as string;
    const colorsJson = formData.get('colors') as string | null;
    const sizesJson = formData.get('sizes') as string | null;
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

    for (const url of imagesToDelete) {
      await deleteProductImage(url);
    }

    const newImageUrls: string[] = [];
    for (const file of newImageFiles) {
      try {
        const url = await uploadProductImage(id, file);
        newImageUrls.push(url);
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError);
      }
    }

    const finalImages = [...existingImages, ...newImageUrls];

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
        link,
        colors: colorsJson ? JSON.parse(colorsJson) : [],
        sizes: sizesJson ? JSON.parse(sizesJson) : [],
      })
      .eq('id', id);

    if (productError) throw productError;

    // Delete old variants
    await supabase.from('product_variants').delete().eq('product_id', id);

    // Generate new variants
    const colors = JSON.parse(colorsJson || '[]');
    const sizes = JSON.parse(sizesJson || '[]');
    const variants = [];

    for (const color of colors) {
      for (const size of sizes) {
        if (color.trim() && size.name.trim()) {
          variants.push({
            product_id: id,
            color: color.trim(),
            size: size.name.trim(),
            unit: null,
            price: size.price,
          });
        }
      }
    }

    if (variants.length > 0) {
      const { error: variantsError } = await supabase
        .from('product_variants')
        .insert(variants);
      if (variantsError) throw variantsError;
    }

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
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
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