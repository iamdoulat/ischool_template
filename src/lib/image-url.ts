export function getImageUrl(
  path: string | null | undefined,
  baseUrl?: string
): string {
  if (!path) return "";
  if (path.startsWith("data:")) return path;

  let cleanPath = path.replace(/\\/g, '/');

  const domain = (
    baseUrl ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api.ischool.mddoulat.com"
  )
    .replace(/\/+$/, "")
    .replace(/\/api\/v1\/?$/, "");

  // If it's a full URL
  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
    const storageIndex = cleanPath.lastIndexOf("/storage/");
    const uploadsIndex = cleanPath.lastIndexOf("/uploads/");
    if (storageIndex !== -1) {
      cleanPath = cleanPath.substring(storageIndex + 9);
    } else if (uploadsIndex !== -1) {
      cleanPath = cleanPath.substring(uploadsIndex + 1);
    } else if (cleanPath.includes("localhost") || cleanPath.includes("127.0.0.1")) {
      return cleanPath.replace(/^https?:\/\/[^\/]+/, domain);
    } else {
      // External absolute URL (S3, CDN, Unsplash, external domain, etc.)
      return cleanPath;
    }
  }

  // If it's a frontend static asset path (starts with / and not /storage or /uploads)
  if (cleanPath.startsWith('/') && !cleanPath.startsWith('/storage') && !cleanPath.startsWith('/uploads')) {
    return cleanPath;
  }

  // Remove redundant storage prefix if present
  if (cleanPath.startsWith("/storage/")) cleanPath = cleanPath.substring(9);
  else if (cleanPath.startsWith("storage/")) cleanPath = cleanPath.substring(8);
  if (cleanPath.startsWith("/")) cleanPath = cleanPath.substring(1);

  let url = `${domain}/storage/${cleanPath}`;
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    url = url.replace(/^http:\/\//i, "https://");
  }
  return url;
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
