/**
 * Convert any text to a URL-friendly slug
 * Handles special characters, multiple spaces, and edge cases
 */
export function slugify(text: string): string {
  if (!text) return '';
  
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Replace special characters with spaces
    .replace(/[^\w\s-]/g, ' ')
    // Replace multiple spaces or hyphens with single hyphen
    .replace(/[\s_-]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a unique slug by checking database
 */
export async function generateUniqueSlug(title: string, supabase: any, currentId?: string): Promise<string> {
  let slug = slugify(title);
  let finalSlug = slug;
  let counter = 1;
  
  // Keep checking until we find a unique slug
  while (true) {
    let query = supabase
      .from('products')
      .select('slug')
      .eq('slug', finalSlug);
    
    // If updating existing product, exclude current ID
    if (currentId) {
      query = query.neq('id', currentId);
    }
    
    const { data } = await query.maybeSingle();
    
    if (!data) break; // Slug is unique
    
    // Add counter and try again
    finalSlug = `${slug}-${counter}`;
    counter++;
  }
  
  return finalSlug;
}