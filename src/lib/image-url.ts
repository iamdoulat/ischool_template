export function getImageUrl(
  path: string | null | undefined,
  baseUrl?: string
): string {
  if (!path || typeof path !== 'string') return "";
  if (path.startsWith("data:") || path.startsWith("blob:")) return path;

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

  const apiHost = process.env.NEXT_PUBLIC_API_URL ? (() => {
    try { return new URL(process.env.NEXT_PUBLIC_API_URL).hostname; } catch { return ""; }
  })() : "";

  const isRemotePlaceholder = baseUrl && (
    baseUrl.includes("example.com") ||
    baseUrl.includes("ischool.mddoulat.com") ||
    (Boolean(apiHost) && baseUrl.includes(apiHost) && isLocalHost && !apiHost.includes("localhost") && !apiHost.includes("127.0.0.1"))
  );

  let domain = (
    (isLocalHost && isRemotePlaceholder ? defaultDomain : (baseUrl || process.env.NEXT_PUBLIC_API_URL || defaultDomain))
  )
    .replace(/\/+$/, "")
    .replace(/\/api\/v1\/?$/, "");

  const isHttpsContext = (typeof window !== "undefined" && window.location.protocol === "https:") ||
    (process.env.NODE_ENV === "production" && !isLocalHost);

  if (isHttpsContext && domain && !domain.includes("localhost") && !domain.includes("127.0.0.1")) {
    domain = domain.replace(/^http:\/\//i, "https://");
  }

  // Handle absolute URLs (including localhost:8000 stored in database)
  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
    const storageIdx = cleanPath.lastIndexOf("/storage/");
    const uploadsIdx = cleanPath.lastIndexOf("/uploads/");

    if (storageIdx !== -1) {
      const rel = cleanPath.substring(storageIdx + 9).replace(/^\/+/, '');
      let res = domain ? `${domain}/storage/${rel}` : `/storage/${rel}`;
      if (isHttpsContext && !res.includes("localhost") && !res.includes("127.0.0.1")) {
        res = res.replace(/^http:\/\//i, "https://");
      }
      return res;
    }
    if (uploadsIdx !== -1) {
      const rel = cleanPath.substring(uploadsIdx + 9).replace(/^\/+/, '');
      let res = domain ? `${domain}/uploads/${rel}` : `/uploads/${rel}`;
      if (isHttpsContext && !res.includes("localhost") && !res.includes("127.0.0.1")) {
        res = res.replace(/^http:\/\//i, "https://");
      }
      return res;
    }

    // External absolute URL (S3, CDN, etc.) - upgrade http to https if context is https
    if (isHttpsContext && !cleanPath.includes("localhost") && !cleanPath.includes("127.0.0.1")) {
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
    let res = domain ? `${domain}/uploads/${rel}` : `/uploads/${rel}`;
    if (isHttpsContext && !res.includes("localhost") && !res.includes("127.0.0.1")) {
      res = res.replace(/^http:\/\//i, "https://");
    }
    return res;
  }

  cleanPath = cleanPath.replace(/^\/+/, '');
  let res = domain ? `${domain}/storage/${cleanPath}` : `/storage/${cleanPath}`;
  if (isHttpsContext && !res.includes("localhost") && !res.includes("127.0.0.1")) {
    res = res.replace(/^http:\/\//i, "https://");
  }
  return res;
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
    : (process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "") || (typeof window !== "undefined" ? window.location.origin : "http://localhost:8000"));
  const isLocal = url.includes("localhost") || url.includes("127.0.0.1");
  const isHttps = (typeof window !== "undefined" && window.location.protocol === "https:") || (process.env.NODE_ENV === "production" && !isLocal);
  if (isHttps) {
    url = url.replace(/^http:\/\//i, "https://");
  }
  return url;
}
