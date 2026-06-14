export function getImageUrl(
  path: string | null | undefined,
  baseUrl?: string
): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;

  const domain = baseUrl
    ? baseUrl.replace(/\/+$/, "")
    : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(
        /\/api\/v1\/?$/,
        ""
      );

  return `${domain}/storage/${path}`;
}

import { useSettings } from "@/components/providers/settings-provider";

export function useImageUrl() {
  const { settings } = useSettings();

  return (path: string | null | undefined) =>
    getImageUrl(path, settings?.base_url);
}

export function useBaseUrl() {
  const { settings } = useSettings();

  if (settings?.base_url) {
    return settings.base_url.replace(/\/+$/, "");
  }

  return (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  ).replace(/\/api\/v1\/?$/, "");
}
