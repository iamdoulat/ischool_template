export function getImageUrl(
  path: string | null | undefined,
  baseUrl?: string
): string {
  if (!path) return "";

  let cleanPath = path.replace(/\\/g, '/');

  // If it's a full URL, extract the relative part after the last /storage/
  if (cleanPath.startsWith("http")) {
    const storageIndex = cleanPath.lastIndexOf("/storage/");
    if (storageIndex !== -1) {
      cleanPath = cleanPath.substring(storageIndex + 9);
    } else {
      // No /storage/ segment — can't rebuild, return as-is
      return cleanPath;
    }
  }

  // Remove redundant storage prefix if it somehow got saved in the DB
  if (cleanPath.startsWith("/storage/")) cleanPath = cleanPath.substring(9);
  else if (cleanPath.startsWith("storage/")) cleanPath = cleanPath.substring(8);
  // Also remove leading slash if any
  if (cleanPath.startsWith("/")) cleanPath = cleanPath.substring(1);

  const domain = baseUrl
    ? baseUrl.replace(/\/+$/, "")
    : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(
        /\/api\/v1\/?$/,
        ""
      );

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
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  ).replace(/\/api\/v1\/?$/, "");
}
