import type { MetadataRoute } from 'next';
import { cookies, headers } from 'next/headers';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let pwaName = "iSchool";
  let description = "Comprehensive School Management System & Portal";

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

      if (settings.pwa_app_short_name && typeof settings.pwa_app_short_name === "string" && settings.pwa_app_short_name.trim() !== "") {
        pwaName = settings.pwa_app_short_name.trim();
      }

      if (settings.pwa_app_description && typeof settings.pwa_app_description === "string" && settings.pwa_app_description.trim() !== "") {
        description = settings.pwa_app_description.trim();
      }
    }
  } catch (e) {
    console.error("Error in manifest.ts fetch:", e);
  }

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
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      }
    ],
    shortcuts: isUser ? [
      {
        name: "Student Portal",
        short_name: "Student",
        description: "Open Student Dashboard",
        url: "/user/dashboard",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }]
      },
      {
        name: "Admin Portal",
        short_name: "Admin",
        description: "Open Admin Dashboard",
        url: "/dashboard",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }]
      }
    ] : [
      {
        name: "Admin Portal",
        short_name: "Admin",
        description: "Open Admin Dashboard",
        url: "/dashboard",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }]
      },
      {
        name: "Student Portal",
        short_name: "Student",
        description: "Open Student Dashboard",
        url: "/user/dashboard",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }]
      }
    ]
  };
}
