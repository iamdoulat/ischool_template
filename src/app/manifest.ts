import type { MetadataRoute } from 'next';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let pwaName = "iSchool";
  let description = "Comprehensive School Management System & Portal";
  let icon512 = "/logo-app.png";
  let icon192 = "/logo-app.png";

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";
    const res = await fetch(`${apiUrl}/system-setting/general-setting`, {
      next: { revalidate: 10 },
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const json = await res.json();
      const settings = json.data || json;

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
  } catch (e) {
    console.error("Error in manifest.ts fetch:", e);
  }

  return {
    id: "/dashboard",
    name: pwaName,
    short_name: pwaName,
    description: description,
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
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
        src: icon512,
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
