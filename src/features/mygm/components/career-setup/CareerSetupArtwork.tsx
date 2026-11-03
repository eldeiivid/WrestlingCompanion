import { useState } from "react";
import type { ReactNode } from "react";

export default function CareerSetupArtwork({ src, fallback }: { src: string | null; fallback: ReactNode }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return src && src !== failedUrl
    ? <img src={src} alt="" decoding="async" onError={() => setFailedUrl(src)} />
    : fallback;
}
