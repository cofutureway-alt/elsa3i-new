/**
 * Legacy display helper for payment proofs uploaded to Cloudflare R2
 * before the platform migrated uploads to Supabase Storage.
 *
 * No credentials live here (or anywhere in the client): this only builds
 * the bucket's public r2.dev URL for objects uploaded previously.
 * New uploads go through Supabase Storage — see src/lib/manual-payment-api.ts.
 */
export const R2_PUBLIC_URL = (import.meta.env.VITE_R2_PUBLIC_URL || "https://pub-f0507ed1df394367b013332c85b5d33a.r2.dev").replace(/\/$/, "");

export function getR2PublicUrl(bucket: string, path: string): string {
  if (!path) return "";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:") ||
    path.startsWith("blob:")
  ) {
    return path;
  }
  const cleanPath = path.replace(/^\//, "");
  if (cleanPath.startsWith(`${bucket}/`)) {
    return `${R2_PUBLIC_URL}/${cleanPath}`;
  }
  return `${R2_PUBLIC_URL}/${bucket}/${cleanPath}`;
}
