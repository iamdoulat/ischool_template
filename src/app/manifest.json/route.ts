import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const portalParam = searchParams.get("portal")?.toLowerCase().trim();
  const roleParam = searchParams.get("role")?.toLowerCase().trim();
  const cookieStartUrl = request.cookies.get("pwa_start_url")?.value?.trim();
  const cookieUserRole = request.cookies.get("user_role")?.value?.toLowerCase().trim();
  const referer = request.headers.get("referer") || "";

  const isStudentOrParent =
    portalParam === "user" ||
    portalParam === "student" ||
    portalParam === "parent" ||
    roleParam === "student" ||
    roleParam === "parent" ||
    roleParam === "parents" ||
    roleParam === "guardian" ||
    roleParam === "std" ||
    roleParam === "par" ||
    cookieUserRole === "student" ||
    cookieUserRole === "parent" ||
    cookieUserRole === "parents" ||
    cookieUserRole === "guardian" ||
    cookieUserRole === "std" ||
    cookieUserRole === "par";

  const isExplicitAdminOrStaff =
    portalParam === "admin" ||
    portalParam === "dashboard" ||
    (cookieUserRole && !isStudentOrParent) ||
    (roleParam && !isStudentOrParent);

  let startUrl = "/dashboard";
  if (isStudentOrParent) {
    startUrl = "/user/dashboard";
  } else if (isExplicitAdminOrStaff) {
    startUrl = "/dashboard";
  } else if (cookieStartUrl === "/user/dashboard" || referer.includes("/user")) {
    startUrl = "/user/dashboard";
  } else {
    startUrl = "/dashboard";
  }

  let schoolName = "iSchool";
  let shortName = "iSchool";
  let description = "Comprehensive School Management System & Portal";
  let icon512 = "/icons/icon-512x512.png";
  let icon192 = "/icons/icon-192x192.png";
  let iconMaskable = "/icons/icon-512x512.png";

  const cookiePwaAppName = request.cookies.get("pwa_app_short_name")?.value?.trim();
  const cookiePwaIcon512 = request.cookies.get("pwa_icon_512")?.value?.trim();

  if (cookiePwaAppName) {
    schoolName = decodeURIComponent(cookiePwaAppName);
    shortName = decodeURIComponent(cookiePwaAppName);
  }

  const resolveIconUrl = (path?: string | null) => {
    if (!path || typeof path !== "string") return null;
    let clean = path.trim().replace(/\\/g, "/");
    if (!clean) return null;
    // Strip localhost:8000 or 127.0.0.1:8000 so asset is served same-origin by Next.js proxy
    clean = clean.replace(/^https?:\/\/(?:localhost|127\.0\.0\.1):8000/i, "");
    if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
    if (clean.startsWith("/")) return clean;
    return `/${clean}`;
  };

  if (cookiePwaIcon512) {
    const resolvedCookieIcon = resolveIconUrl(decodeURIComponent(cookiePwaIcon512));
    if (resolvedCookieIcon) {
      icon512 = resolvedCookieIcon;
      icon192 = resolvedCookieIcon;
      iconMaskable = resolvedCookieIcon;
    }
  }

  let hasCustomIcon = false;

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
    const res = await fetch(`${apiUrl}/system-setting/general-setting`, {
      next: { revalidate: 10 },
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(1500),
    }).catch(() => null);

    if (res && res.ok) {
      const json = await res.json();
      const settings = json.data || json;

      // User requirement: PWA app name must be 'PWA App Short Name (App Name) *'
      const configuredAppName = (settings.pwa_app_short_name && typeof settings.pwa_app_short_name === "string" && settings.pwa_app_short_name.trim() !== "")
        ? settings.pwa_app_short_name.trim()
        : (settings.pwa_app_name && typeof settings.pwa_app_name === "string" && settings.pwa_app_name.trim() !== "")
          ? settings.pwa_app_name.trim()
          : (settings.school_name && typeof settings.school_name === "string" && settings.school_name.trim() !== "")
            ? settings.school_name.trim()
            : "iSchool";

      schoolName = configuredAppName;
      shortName = configuredAppName;

      if (settings.pwa_app_description && typeof settings.pwa_app_description === "string" && settings.pwa_app_description.trim() !== "") {
        description = settings.pwa_app_description.trim();
      }

      if (settings.pwa_icon_512) {
        const resolved = resolveIconUrl(settings.pwa_icon_512);
        if (resolved) {
          icon512 = resolved;
          hasCustomIcon = true;
        }
      }
      if (settings.pwa_icon_192) {
        const resolved = resolveIconUrl(settings.pwa_icon_192);
        if (resolved) icon192 = resolved;
      } else if (settings.pwa_icon_512) {
        icon192 = icon512;
      }
      if (settings.pwa_icon_maskable) {
        const resolved = resolveIconUrl(settings.pwa_icon_maskable);
        if (resolved) iconMaskable = resolved;
      } else {
        iconMaskable = icon512;
      }
    }
  } catch (error) {
    console.error("Dynamic manifest fetch error, using default settings:", error);
  }

  if (icon512 && !icon512.includes("icon-512x512.png")) {
    hasCustomIcon = true;
  }

  const getMimeType = (url: string) => {
    const cleanUrl = url.split("?")[0].toLowerCase();
    if (cleanUrl.endsWith(".jpg") || cleanUrl.endsWith(".jpeg")) return "image/jpeg";
    if (cleanUrl.endsWith(".svg")) return "image/svg+xml";
    if (cleanUrl.endsWith(".webp")) return "image/webp";
    return "image/png";
  };

  const isUser = startUrl === "/user/dashboard";

  const png512 = icon512.replace(/\.(jpg|jpeg|webp)$/i, ".png");
  const png192 = icon192.replace(/\.(jpg|jpeg|webp)$/i, ".png");

  const withVer = (url: string) => `${url}${url.includes('?') ? '&' : '?'}v=ischool2`;

  // Build icons array: PNG icons are strictly required by Chromium for PWA installability in address bar (omnibox).
  // Custom PWA Icon (512x512) is listed first for both 'any' and 'maskable'.
  const iconsList = [
    {
      src: withVer(png512),
      sizes: "512x512",
      type: "image/png",
      purpose: "any"
    },
    {
      src: withVer(png512),
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable"
    },
    {
      src: withVer(icon512),
      sizes: "512x512",
      type: getMimeType(icon512),
      purpose: "any"
    },
    {
      src: withVer(png192),
      sizes: "192x192",
      type: "image/png",
      purpose: "any"
    },
    {
      src: withVer(png192),
      sizes: "192x192",
      type: "image/png",
      purpose: "maskable"
    },
    {
      src: withVer("/icons/icon-512x512.png"),
      sizes: "512x512",
      type: "image/png",
      purpose: "any"
    },
    {
      src: withVer("/icons/icon-192x192.png"),
      sizes: "192x192",
      type: "image/png",
      purpose: "any"
    }
  ];

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
    icons: iconsList,
    shortcuts: isUser ? [
      {
        name: "Student Portal",
        short_name: "Student",
        description: "Open Student Dashboard",
        url: "/user/dashboard",
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
        name: "Collect Fees",
        short_name: "Fees",
        description: "Fees collection & payments",
        url: "/dashboard/fees-collection/collect-fees",
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

  return NextResponse.json(manifestData, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
