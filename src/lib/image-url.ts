export function getImageUrl(
  path: string | null | undefined,
  baseUrl?: string
): string {
  if (!path || typeof path !== 'string') return "";
  if (path.startsWith("data:")) return path;

  let cleanPath = path.replace(/\\/g, '/').trim();
  if (!cleanPath) return "";

  const isLocalHost = typeof window !== "undefined" && (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.startsWith("192.168.") ||
    window.location.hostname.startsWith("10.") ||
    window.location.hostname.endsWith(".local")
  );

  const defaultDomain = isLocalHost
    ? (typeof window !== "undefined" ? `${window.location.protocol}//${window.location.hostname}:8000` : "http://localhost:8000")
    : (typeof window !== "undefined" ? `${window.location.protocol}//${window.location.hostname}` : "");

  let domain = (
    baseUrl ||
    process.env.NEXT_PUBLIC_API_URL ||
    defaultDomain
  )
    .replace(/\/+$/, "")
    .replace(/\/api\/v1\/?$/, "");

  if (typeof window !== "undefined" && window.location.protocol === "https:" && !isLocalHost) {
    domain = domain.replace(/^http:\/\//i, "https://");
  }

  // Handle absolute URLs (including localhost:8000 stored in database)
  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
    const storageIdx = cleanPath.lastIndexOf("/storage/");
    const uploadsIdx = cleanPath.lastIndexOf("/uploads/");

    if (storageIdx !== -1) {
      const rel = cleanPath.substring(storageIdx + 9).replace(/^\/+/, '');
      return domain ? `${domain}/storage/${rel}` : `/storage/${rel}`;
    }
    if (uploadsIdx !== -1) {
      const rel = cleanPath.substring(uploadsIdx + 9).replace(/^\/+/, '');
      return domain ? `${domain}/uploads/${rel}` : `/uploads/${rel}`;
    }

    // External absolute URL (S3, CDN, etc.) - upgrade http to https if window is https
    if (typeof window !== "undefined" && window.location.protocol === "https:") {
      return cleanPath.replace(/^http:\/\//i, "https://");
    }
    return cleanPath;
  }

  // Handle frontend static asset paths (e.g. /images/default-avatar.png)
  if (cleanPath.startsWith('/') && !cleanPath.startsWith('/storage') && !cleanPath.startsWith('/uploads')) {
    return cleanPath;
  }

  // Strip redundant leading prefixes
  cleanPath = cleanPath
    .replace(/^\/?public\//i, '')
    .replace(/^\/?storage\//i, '');

  if (cleanPath.startsWith('uploads/') || cleanPath.startsWith('/uploads/')) {
    const rel = cleanPath.replace(/^\/?uploads\//i, '');
    return domain ? `${domain}/uploads/${rel}` : `/uploads/${rel}`;
  }

  cleanPath = cleanPath.replace(/^\/+/, '');
  return domain ? `${domain}/storage/${cleanPath}` : `/storage/${cleanPath}`;
}

import { useSettings } from "@/components/providers/settings-provider";

export function useImageUrl() {
  const { settings } = useSettings();
  return (path: string | null | undefined) =>
    getImageUrl(path, settings.base_url);
}

export function useBaseUrl() {
  const { settings } = useSettings();
  let url = settings.base_url
    ? settings.base_url.replace(/\/+$/, "")
    : (process.env.NEXT_PUBLIC_API_URL || "https://api.ischool.mddoulat.com").replace(/\/api\/v1\/?$/, "");
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    url = url.replace(/^http:\/\//i, "https://");
  }
  return url;
}
