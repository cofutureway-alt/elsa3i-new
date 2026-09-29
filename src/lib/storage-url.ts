import { supabase } from "@/integrations/supabase/client";

/**
 * Build the public URL for an object stored in a Supabase Storage bucket.
 * Platform assets (thumbnails, book-assets) are uploaded to Supabase Storage,
 * so display URLs must come from the same place — NOT from the R2 public host.
 * Absolute URLs (http/https/data/blob) are passed through untouched.
 */
export function getStorageObjectUrl(
  bucket: string,
  path: string | null | undefined,
): string | null {
  if (!path) return null;
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  let clean = path.replace(/^\/+/, "");
  // Tolerate paths saved with the bucket prefix to avoid doubling it.
  if (clean.startsWith(`${bucket}/`)) clean = clean.slice(bucket.length + 1);
  if (!clean) return null;
  const { data } = supabase.storage.from(bucket).getPublicUrl(clean);
  return data?.publicUrl ?? null;
}
