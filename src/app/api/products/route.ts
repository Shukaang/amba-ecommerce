import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/supabaseServer';
import { withAdminAuth } from '@/lib/auth/middleware';
import { generateUniqueSlug } from '@/lib/utils/slug';
import { uploadProductImage } from '@/lib/supabase/storage';
import { verifyAuth } from '@/lib/auth/middleware';

// Public GET – unchanged
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get('category');
    let categoryIds: string[] = [];
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const featured = searchParams.get('featured') === 'true';
    const sort = searchParams.get('sort') || 'newest';
    const isNew = searchParams.get('new') === 'true';

    const supabase = await createAdminClient();

    let query = supabase
      .from('products')
      .select(
        `
        *,
        categories(title),
        product_variants(*)
      `,
        { count: 'exact' }
      )
      .is('deleted_at', null)
      .eq('status', 'approved'); 

    if (isNew) {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      query = query.gte('created_at', twoWeeksAgo.toISOString());
    }

    if (categoryParam && !['all', 'men', 'women', 'electronics', 'kids'].includes(categoryParam)) {
  // If it's a single UUID or a comma‑separated list
    categoryIds = categoryParam.split(',');
    query = query.in('category_id', categoryIds);
  }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (featured) {
      query = query.gte('average_rating', 4.0);
    }

    if (sort === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else if (sort === 'trending') {
      query = query.order('average_rating', { ascending: false });
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: products, error, count } = await query.range(from, to);

    if (error) throw error;

    return NextResponse.json(
  {
    products: products || [],
    total: count || 0,
    page,
    pages: Math.ceil((count || 0) / limit),
  },
  {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=30',
    },
  }
);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

async function createProduct(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const link = formData.get('link') as string | null;
    const category_id = formData.get('category_id') as string;
    const price = parseFloat(formData.get('price') as string);
    const colorsJson = formData.get('colors') as string | null;
    const sizesJson = formData.get('sizes') as string | null;
    const imageFiles = formData.getAll('images') as File[];

    if (!title || !description || isNaN(price)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    const slug = await generateUniqueSlug(title, supabase);

    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        title,
        slug,
        description,
        category_id: category_id === 'null' ? null : category_id,
        price,
        images: [],
        status: 'pending',
        created_by: user.id,
        updated_by: user.id,
        link,
        colors: colorsJson ? JSON.parse(colorsJson) : [],
        sizes: sizesJson ? JSON.parse(sizesJson) : [],
      })
      .select()
      .single();

    if (productError) throw productError;

    // Upload images
    const imageUrls: string[] = [];
    for (const file of imageFiles) {
      try {
        const url = await uploadProductImage(product.id, file);
        imageUrls.push(url);
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError);
      }
    }

    const { error: updateError } = await supabase
      .from('products')
      .update({ images: imageUrls })
      .eq('id', product.id);

    if (updateError) throw updateError;

    // Generate variants from colors and sizes
    const colors = JSON.parse(colorsJson || '[]');
    const sizes = JSON.parse(sizesJson || '[]');
    const variants = [];

    for (const color of colors) {
      for (const size of sizes) {
        if (color.trim() && size.name.trim()) {
          variants.push({
            product_id: product.id,
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
      .select(
        `
        *,
        categories(title),
        product_variants(*),
        creator:users!products_created_by_fkey(id, name, email),
        updater:users!products_updated_by_fkey(id, name, email)
      `
      )
      .eq('id', product.id)
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json(
      {
        product: completeProduct,
        message: 'Product created successfully (pending approval)',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}

export const POST = withAdminAuth(createProduct);