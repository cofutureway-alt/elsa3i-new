import { useEffect, useState } from "react";
import { getStorageObjectUrl } from "@/lib/storage-url";

export const useSignedUrl = (
  bucket: string,
  path: string | null | undefined,
  _ttlSeconds = 3600,
) => {
  const [url, setUrl] = useState<string | null>(() => getStorageObjectUrl(bucket, path));

  useEffect(() => {
    setUrl(getStorageObjectUrl(bucket, path));
  }, [bucket, path]);

  return url;
};
