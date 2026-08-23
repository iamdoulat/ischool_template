import { getImageUrl } from '@/lib/image-url';
import type { MetadataRoute } from 'next';
import { cookies, headers } from 'next/headers';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let pwaName = "iSchool";
  let description = "Comprehensive School Management System & Portal";
  let rawIcon512 = "/logo-app.png";
  let rawIcon192 = "/logo-app.png";
  let rawMaskable = "/logo-app.png";
  let baseUrl = "";

  let startUrl = "/dashboard";
  try {
    const cookieStore = await cookies();
    const headersList = await headers();
    const cookieStartUrl = cookieStore.get("pwa_start_url")?.value?.trim();
    const cookieUserRole = cookieStore.get("user_role")?.value?.toLowerCase().trim();
    const referer = headersList.get("referer") || "";

    const isStudentOrParent =
      cookieUserRole === "student" ||
      cookieUserRole === "parent" ||
      cookieUserRole === "parents" ||
      cookieUserRole === "guardian" ||
      cookieUserRole === "std" ||
      cookieUserRole === "par";

    const isExplicitAdminOrStaff = cookieUserRole && !isStudentOrParent;

    if (isStudentOrParent) {
      startUrl = "/user/dashboard";
    } else if (isExplicitAdminOrStaff) {
      startUrl = "/dashboard";
    } else if (cookieStartUrl === "/user/dashboard" || referer.includes("/user")) {
      startUrl = "/user/dashboard";
    } else {
      startUrl = "/dashboard";
    }
  } catch {
    // Fallback if headers/cookies are not available during build
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
    const res = await fetch(`${apiUrl}/system-setting/general-setting`, {
      next: { revalidate: 30 },
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(1500),
    }).catch(() => null);

    if (res && res.ok) {
      const json = await res.json();
      const settings = json.data || json;
      baseUrl = settings.base_url || "";

      if (settings.pwa_app_short_name && typeof settings.pwa_app_short_name === "string" && settings.pwa_app_short_name.trim() !== "") {
        pwaName = settings.pwa_app_short_name.trim();
      }

      if (settings.pwa_app_description && typeof settings.pwa_app_description === "string" && settings.pwa_app_description.trim() !== "") {
        description = settings.pwa_app_description.trim();
      }

      if (settings.pwa_icon_512 && typeof settings.pwa_icon_512 === "string" && settings.pwa_icon_512.trim() !== "") {
        rawIcon512 = settings.pwa_icon_512.trim();
      } else if (settings.pwa_icon_192 && typeof settings.pwa_icon_192 === "string" && settings.pwa_icon_192.trim() !== "") {
        rawIcon512 = settings.pwa_icon_192.trim();
      } else if (settings.pwa_icon_maskable && typeof settings.pwa_icon_maskable === "string" && settings.pwa_icon_maskable.trim() !== "") {
        rawIcon512 = settings.pwa_icon_maskable.trim();
      }

      if (settings.pwa_icon_192 && typeof settings.pwa_icon_192 === "string" && settings.pwa_icon_192.trim() !== "") {
        rawIcon192 = settings.pwa_icon_192.trim();
      } else if (settings.pwa_icon_512 && typeof settings.pwa_icon_512 === "string" && settings.pwa_icon_512.trim() !== "") {
        rawIcon192 = settings.pwa_icon_512.trim();
      } else if (settings.pwa_icon_maskable && typeof settings.pwa_icon_maskable === "string" && settings.pwa_icon_maskable.trim() !== "") {
        rawIcon192 = settings.pwa_icon_maskable.trim();
      }

      if (settings.pwa_icon_maskable && typeof settings.pwa_icon_maskable === "string" && settings.pwa_icon_maskable.trim() !== "") {
        rawMaskable = settings.pwa_icon_maskable.trim();
      } else if (settings.pwa_icon_512 && typeof settings.pwa_icon_512 === "string" && settings.pwa_icon_512.trim() !== "") {
        rawMaskable = settings.pwa_icon_512.trim();
      } else if (settings.pwa_icon_192 && typeof settings.pwa_icon_192 === "string" && settings.pwa_icon_192.trim() !== "") {
        rawMaskable = settings.pwa_icon_192.trim();
      }
    }
  } catch (e) {
    console.error("Error in manifest.ts fetch:", e);
  }

  const icon192 = getImageUrl(rawIcon192, baseUrl) || "/logo-app.png";
  const icon512 = getImageUrl(rawIcon512, baseUrl) || "/logo-app.png";
  const maskable = getImageUrl(rawMaskable, baseUrl) || icon512;

  const getMimeType = (url: string) => {
    const clean = url.split('?')[0].toLowerCase();
    if (clean.endsWith('.webp')) return 'image/webp';
    if (clean.endsWith('.jpg') || clean.endsWith('.jpeg')) return 'image/jpeg';
    if (clean.endsWith('.svg')) return 'image/svg+xml';
    if (clean.endsWith('.ico')) return 'image/x-icon';
    return 'image/png';
  };

  const isUser = startUrl === "/user/dashboard";

  return {
    id: startUrl,
    name: pwaName,
    short_name: pwaName,
    description: description,
    start_url: startUrl,
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "window-controls-overlay", "minimal-ui"],
    orientation: "any",
    background_color: "#ffffff",
    theme_color: "#6366f1",
    categories: ["education", "productivity", "management"],
    prefer_related_applications: false,
    icons: [
      {
        src: icon192,
        sizes: "192x192 any",
        type: getMimeType(icon192),
        purpose: "any"
      },
      {
        src: icon512,
        sizes: "512x512 any",
        type: getMimeType(icon512),
        purpose: "any"
      },
      {
        src: maskable,
        sizes: "512x512 any",
        type: getMimeType(maskable),
        purpose: "maskable"
      }
    ],
    shortcuts: isUser ? [
      {
        name: "Student Portal",
        short_name: "Student",
        description: "Open Student Dashboard",
        url: "/user/dashboard",
        icons: [{ src: icon192, sizes: "192x192", type: getMimeType(icon192) }]
      },
      {
        name: "Admin Portal",
        short_name: "Admin",
        description: "Open Admin Dashboard",
        url: "/dashboard",
        icons: [{ src: icon192, sizes: "192x192", type: getMimeType(icon192) }]
      }
    ] : [
      {
        name: "Admin Portal",
        short_name: "Admin",
        description: "Open Admin Dashboard",
        url: "/dashboard",
        icons: [{ src: icon192, sizes: "192x192", type: getMimeType(icon192) }]
      },
      {
        name: "Student Portal",
        short_name: "Student",
        description: "Open Student Dashboard",
        url: "/user/dashboard",
        icons: [{ src: icon192, sizes: "192x192", type: getMimeType(icon192) }]
      }
    ]
  };
}
