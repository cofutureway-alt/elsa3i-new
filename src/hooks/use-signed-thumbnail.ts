import { useEffect, useState } from "react";
import { getStorageObjectUrl } from "@/lib/storage-url";

export const useSignedThumbnail = (path: string | null | undefined) => {
  const [url, setUrl] = useState<string | null>(() => getStorageObjectUrl("thumbnails", path));

  useEffect(() => {
    setUrl(getStorageObjectUrl("thumbnails", path));
  }, [path]);

  return url;
};
