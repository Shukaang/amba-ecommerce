import { createClient } from '@/lib/supabase/supabaseServer';

export default async function sitemap() {
  const baseUrl = 'https://ambaastore.com';
  const supabase = await createClient();

  // Static pages
  const staticPages = ['', '/products'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Product pages
  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('status', 'approved')
    .is('deleted_at', null);

  const productPages = products?.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: new Date(product.updated_at),
    changeFrequency: 'weekly',
    priority: 0.7,
  })) || [];

  // Category pages (optional)
  const { data: categories } = await supabase
    .from('categories')
    .select('id');

  const categoryPages = categories?.map((cat) => ({
    url: `${baseUrl}/products?category=${cat.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  })) || [];

  return [...staticPages, ...productPages, ...categoryPages];
}