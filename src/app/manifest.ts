import { getImageUrl } from '@/lib/image-url';
import type { MetadataRoute } from 'next';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let pwaName = "iSchool";
  let description = "Comprehensive School Management System & Portal";
  let rawIcon512 = "/logo-app.png";
  let rawIcon192 = "/logo-app.png";
  let rawMaskable = "/logo-app.png";
  let baseUrl = "";

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
    const res = await fetch(`${apiUrl}/system-setting/general-setting`, {
      next: { revalidate: 10 },
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const json = await res.json();
      const settings = json.data || json;
      baseUrl = settings.base_url || "";

      if (settings.pwa_app_short_name && settings.pwa_app_short_name.trim() !== "") {
        pwaName = settings.pwa_app_short_name;
      } else if (settings.school_name) {
        pwaName = settings.school_name;
      }

      if (settings.pwa_app_description && settings.pwa_app_description.trim() !== "") {
        description = settings.pwa_app_description;
      } else if (settings.school_description) {
        description = settings.school_description;
      }

      if (settings.pwa_icon_512) {
        rawIcon512 = settings.pwa_icon_512;
      } else if (settings.app_logo) {
        rawIcon512 = settings.app_logo;
      }

      if (settings.pwa_icon_192) {
        rawIcon192 = settings.pwa_icon_192;
      } else if (settings.app_logo) {
        rawIcon192 = settings.app_logo;
      }

      if (settings.pwa_icon_maskable) {
        rawMaskable = settings.pwa_icon_maskable;
      } else {
        rawMaskable = rawIcon512;
      }
    }
  } catch (e) {
    console.error("Error in manifest.ts fetch:", e);
  }

  const icon192 = getImageUrl(rawIcon192, baseUrl) || "/logo-app.png";
  const icon512 = getImageUrl(rawIcon512, baseUrl) || "/logo-app.png";
  const maskable = getImageUrl(rawMaskable, baseUrl) || icon512;

  return {
    id: "/dashboard",
    name: pwaName,
    short_name: pwaName,
    description: description,
    start_url: "/dashboard",
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
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: icon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: maskable,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    shortcuts: [
      {
        name: "Student Portal",
        short_name: "Student",
        description: "Open Student Dashboard",
        url: "/user/dashboard",
        icons: [{ src: icon192, sizes: "192x192" }]
      },
      {
        name: "Admin Portal",
        short_name: "Admin",
        description: "Open Admin Dashboard",
        url: "/dashboard",
        icons: [{ src: icon192, sizes: "192x192" }]
      }
    ]
  };
}
