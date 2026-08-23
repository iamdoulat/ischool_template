import { NextRequest, NextResponse } from "next/server";
import { getImageUrl } from "@/lib/image-url";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const portalParam = searchParams.get("portal");
  const referer = request.headers.get("referer") || "";

  let startUrl = "/dashboard";
  if (portalParam === "user" || referer.includes("/user")) {
    startUrl = "/user/dashboard";
  } else if (portalParam === "admin" || referer.includes("/dashboard")) {
    startUrl = "/dashboard";
  }

  let schoolName = "iSchool Management System";
  let shortName = "iSchool";
  let description = "Comprehensive School Management System & Portal";
  let rawIcon512 = "/logo-app.png";
  let rawIcon192 = "/logo-app.png";
  let rawMaskable = "/logo-app.png";
  let baseUrl = "";

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
    const res = await fetch(`${apiUrl}/system-setting/general-setting`, {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const json = await res.json();
      const settings = json.data || json;
      baseUrl = settings.base_url || "";

      let pwaName = "iSchool";
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

      schoolName = pwaName;
      shortName = pwaName;
    }
  } catch (error) {
    console.error("Dynamic manifest fetch error, using default settings:", error);
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

  const manifestData = {
    id: startUrl,
    name: schoolName,
    short_name: shortName,
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
    shortcuts: [
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
      },
      {
        name: "Notice Board",
        short_name: "Notices",
        description: "View school notices & updates",
        url: "/user/notice-board",
        icons: [{ src: icon192, sizes: "192x192", type: getMimeType(icon192) }]
      },
      {
        name: "Collect Fees",
        short_name: "Fees",
        description: "Fees collection & payments",
        url: "/dashboard/fees-collection/collect-fees",
        icons: [{ src: icon192, sizes: "192x192", type: getMimeType(icon192) }]
      }
    ]
  };

  return NextResponse.json(manifestData, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
