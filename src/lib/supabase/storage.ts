import { createAdminClient } from './supabaseServer';

const BUCKET_NAME = 'products';

export async function uploadProductImage(
  productId: string,
  file: File,
  fileName?: string
): Promise<string> {
  const supabase = await createAdminClient();
  const ext = file.name.split('.').pop();
  const uniqueName = fileName || `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
  const path = `${productId}/${uniqueName}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return urlData.publicUrl;
}

export async function deleteProductImage(imageUrl: string) {
  const supabase = await createAdminClient();
  const urlParts = imageUrl.split('/');
  const bucketIndex = urlParts.indexOf(BUCKET_NAME);
  if (bucketIndex === -1) return; // not in our bucket
  const path = urlParts.slice(bucketIndex + 1).join('/');

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) console.error('Failed to delete image:', error.message);
}

export async function deleteProductFolder(productId: string) {
  const supabase = await createAdminClient();
  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET_NAME)
    .list(productId);

  if (listError) {
    console.error('Failed to list images:', listError.message);
    return;
  }

  if (files && files.length > 0) {
    const paths = files.map((file) => `${productId}/${file.name}`);
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(paths);
    if (error) console.error('Failed to delete folder:', error.message);
  }
}

const CATEGORY_BUCKET = 'categories';

export async function uploadCategoryImage(
  categoryId: string,
  file: File,
  fileName?: string
): Promise<string> {
  const supabase = await createAdminClient();
  const ext = file.name.split('.').pop();
  const uniqueName = fileName || `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
  const path = `${categoryId}/${uniqueName}`;

  const { error } = await supabase.storage
    .from(CATEGORY_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from(CATEGORY_BUCKET)
    .getPublicUrl(path);

  return urlData.publicUrl;
}

export async function deleteCategoryImage(imageUrl: string) {
  const supabase = await createAdminClient();
  const urlParts = imageUrl.split('/');
  const bucketIndex = urlParts.indexOf(CATEGORY_BUCKET);
  if (bucketIndex === -1) return;
  const path = urlParts.slice(bucketIndex + 1).join('/');

  const { error } = await supabase.storage
    .from(CATEGORY_BUCKET)
    .remove([path]);

  if (error) console.error('Failed to delete category image:', error.message);
}

export async function deleteCategoryFolder(categoryId: string) {
  const supabase = await createAdminClient();
  const { data: files, error: listError } = await supabase.storage
    .from(CATEGORY_BUCKET)
    .list(categoryId);

  if (listError) {
    console.error('Failed to list category images:', listError.message);
    return;
  }

  if (files && files.length > 0) {
    const paths = files.map((file) => `${categoryId}/${file.name}`);
    const { error } = await supabase.storage
      .from(CATEGORY_BUCKET)
      .remove(paths);
    if (error) console.error('Failed to delete category folder:', error.message);
  }
}