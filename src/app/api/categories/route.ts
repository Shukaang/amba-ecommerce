import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/supabaseServer'
import { uploadCategoryImage } from '@/lib/supabase/storage'

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


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const parent_id = formData.get('parent_id') as string;
    const imageFile = formData.get('image') as File | null;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // Insert category without image first
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .insert([{
        title,
        description: description || null,
        parent_id: parent_id === 'null' ? null : parent_id,
        image: null,
      }])
      .select()
      .single();

    if (categoryError) throw categoryError;

    let imageUrl = null;
    if (imageFile) {
      try {
        imageUrl = await uploadCategoryImage(category.id, imageFile);
        // Update category with image URL
        const { error: updateError } = await supabase
          .from('categories')
          .update({ image: imageUrl })
          .eq('id', category.id);
        if (updateError) throw updateError;
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError);
        // Optionally delete the category if image upload fails? We'll keep it without image.
      }
    }

    // Fetch final category
    const { data: finalCategory, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', category.id)
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json({
      category: finalCategory,
      message: 'Category created successfully',
    });

  } catch (error: any) {
    console.error('Create category error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create category' },
      { status: 500 }
    );
  }
}