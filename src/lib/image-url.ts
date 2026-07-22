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
    if (storageIndex !== -1) {
      cleanPath = cleanPath.substring(storageIndex + 9);
    } else {
      // Replace any localhost or HTTP domain with current domain
      return cleanPath.replace(/^https?:\/\/[^\/]+/, domain);
    }
  }

  // Remove redundant storage prefix if present
  if (cleanPath.startsWith("/storage/")) cleanPath = cleanPath.substring(9);
  else if (cleanPath.startsWith("storage/")) cleanPath = cleanPath.substring(8);
  if (cleanPath.startsWith("/")) cleanPath = cleanPath.substring(1);

  return `${domain}/storage/${cleanPath}`;
}

import { useSettings } from "@/components/providers/settings-provider";

export function useImageUrl() {
  const { settings } = useSettings();
  return (path: string | null | undefined) =>
    getImageUrl(path, settings.base_url);
}

export function useBaseUrl() {
  const { settings } = useSettings();
  if (settings.base_url) {
    return settings.base_url.replace(/\/+$/, "");
  }
  return (
    process.env.NEXT_PUBLIC_API_URL || "https://api.ischool.mddoulat.com"
  ).replace(/\/api\/v1\/?$/, "");
}
