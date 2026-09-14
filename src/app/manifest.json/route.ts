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

  let schoolName = "iSchool Management System";
  let shortName = "iSchool";
  let description = "Comprehensive School Management System & Portal";

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
    const res = await fetch(`${apiUrl}/system-setting/general-setting`, {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const json = await res.json();
      const settings = json.data || json;

      let pwaName = "iSchool";
      if (settings.pwa_app_short_name && typeof settings.pwa_app_short_name === "string" && settings.pwa_app_short_name.trim() !== "") {
        pwaName = settings.pwa_app_short_name.trim();
      }

      if (settings.pwa_app_description && typeof settings.pwa_app_description === "string" && settings.pwa_app_description.trim() !== "") {
        description = settings.pwa_app_description.trim();
      }

      schoolName = pwaName;
      shortName = pwaName;
    }
  } catch (error) {
    console.error("Dynamic manifest fetch error, using default settings:", error);
  }

  const isUser = startUrl === "/user/dashboard";

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
        name: "Notice Board",
        short_name: "Notices",
        description: "View school notices & updates",
        url: "/user/notice-board",
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
        name: "Collect Fees",
        short_name: "Fees",
        description: "Fees collection & payments",
        url: "/dashboard/fees-collection/collect-fees",
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

  return NextResponse.json(manifestData, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
