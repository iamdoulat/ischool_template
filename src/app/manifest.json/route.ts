import { NextResponse } from "next/server";

export async function GET() {
  let schoolName = "iSchool Management System";
  let shortName = "iSchool";
  let description = "Comprehensive School Management System & Portal";
  let icon512 = "/logo-app.png";
  let icon192 = "/logo-app.png";

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";
    const res = await fetch(`${apiUrl}/system-setting/general-setting`, {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const json = await res.json();
      const settings = json.data || json;

      if (settings.school_name) {
        schoolName = settings.school_name;
      }

      if (settings.pwa_app_short_name && settings.pwa_app_short_name.trim() !== "") {
        shortName = settings.pwa_app_short_name;
      } else if (settings.school_name) {
        shortName = settings.school_name;
      }

      if (settings.pwa_app_description && settings.pwa_app_description.trim() !== "") {
        description = settings.pwa_app_description;
      } else if (settings.school_description) {
        description = settings.school_description;
      }

      if (settings.pwa_icon_512) {
        icon512 = settings.pwa_icon_512;
      } else if (settings.app_logo) {
        icon512 = settings.app_logo;
      }

      if (settings.pwa_icon_192) {
        icon192 = settings.pwa_icon_192;
      } else if (settings.app_logo) {
        icon192 = settings.app_logo;
      }
    }
  } catch (error) {
    console.error("Dynamic manifest fetch error, using default settings:", error);
  }

  const manifestData = {
    name: schoolName,
    short_name: shortName,
    description: description,
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#6366f1",
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
        purpose: "any maskable"
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
