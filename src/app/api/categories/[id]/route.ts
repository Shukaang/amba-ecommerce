import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/supabaseServer'
import { uploadCategoryImage, deleteCategoryImage, deleteCategoryFolder } from '@/lib/supabase/storage'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createAdminClient()

    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ category })

  } catch (error: any) {
    console.error('Get category error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch category' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const parent_id = formData.get('parent_id') as string;
    const imageFile = formData.get('image') as File | null;
    const keepCurrentImage = formData.get('keepCurrentImage') === 'true'; // flag to keep existing image

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // Fetch current category to get existing image URL
    const { data: currentCategory, error: fetchError } = await supabase
      .from('categories')
      .select('image')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    let imageUrl = currentCategory.image;

    // Handle image update
    if (imageFile) {
      // Upload new image
      try {
        imageUrl = await uploadCategoryImage(id, imageFile);
        // If there was an old image, delete it
        if (currentCategory.image) {
          await deleteCategoryImage(currentCategory.image);
        }
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError);
        // Keep old image
      }
    } else if (!keepCurrentImage && currentCategory.image) {
      // User removed image (no new file and not keeping current)
      await deleteCategoryImage(currentCategory.image);
      imageUrl = null;
    }

    // Update category
    const { data: category, error: updateError } = await supabase
      .from('categories')
      .update({
        title,
        description: description || null,
        parent_id: parent_id === 'null' ? null : parent_id,
        image: imageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      category,
      message: 'Category updated successfully',
    });

  } catch (error: any) {
    console.error('Update category error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();

    // Check if category has products
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (products && products.length > 0) {
      // Update products to null category_id
      await supabase
        .from('products')
        .update({ category_id: null })
        .eq('category_id', id);
    }

    // Delete category image folder
    await deleteCategoryFolder(id);

    // Delete category
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      message: 'Category deleted successfully',
    });

  } catch (error: any) {
    console.error('Delete category error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete category' },
      { status: 500 }
    );
  }
}