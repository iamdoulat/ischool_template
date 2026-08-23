import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { SettingsProvider } from "@/components/providers/settings-provider";
import { MSWInit } from "@/lib/msw";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

import { ThemeProvider } from "@/components/providers/theme-provider";
import { LanguageProvider } from "@/components/providers/language-provider";
import { PWAInit } from "@/components/providers/pwa-init";
import { JsonLd } from "@/components/seo/json-ld";
import { getImageUrl } from "@/lib/image-url";

export async function generateMetadata(): Promise<Metadata> {
  let appTitle = "iSchool";
  let schoolDescription = "iSchool is an advanced, all-in-one School Management System and Educational Portal providing online admissions, examination results, student tracking, attendance, fees collection, and digital notices.";
  let rawFavicon = "/logo-admin-small.png";
  let rawPwaIcon192 = "/logo-app.png";
  let rawPwaIcon512 = "/logo-app.png";

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

      if (settings.school_name && settings.school_name.trim() !== "") {
        appTitle = settings.school_name.trim();
      } else if (settings.pwa_app_short_name && settings.pwa_app_short_name.trim() !== "") {
        appTitle = settings.pwa_app_short_name;
      }

      if (settings.school_description && settings.school_description.trim() !== "") {
        schoolDescription = settings.school_description.trim();
      }

      if (settings.favicon) {
        rawFavicon = settings.favicon;
      }

      if (settings.pwa_icon_192) {
        rawPwaIcon192 = settings.pwa_icon_192;
      } else if (settings.pwa_icon_512) {
        rawPwaIcon192 = settings.pwa_icon_512;
      } else if (settings.pwa_icon_maskable) {
        rawPwaIcon192 = settings.pwa_icon_maskable;
      }

      if (settings.pwa_icon_512) {
        rawPwaIcon512 = settings.pwa_icon_512;
      } else if (settings.pwa_icon_192) {
        rawPwaIcon512 = settings.pwa_icon_192;
      } else if (settings.pwa_icon_maskable) {
        rawPwaIcon512 = settings.pwa_icon_maskable;
      }
    }
  } catch {
    // Graceful fallback to default metadata when backend is offline
  }

  const resolvedFaviconUrl = getImageUrl(rawFavicon) || rawFavicon;
  const resolvedPwa192 = getImageUrl(rawPwaIcon192) || rawPwaIcon192;
  const resolvedPwa512 = getImageUrl(rawPwaIcon512) || rawPwaIcon512;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ischool.com";

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: `${appTitle} — Comprehensive School Management System & Portal`,
      template: `%s — ${appTitle}`,
    },
    description: schoolDescription,
    keywords: [
      "School Management System",
      "SMS",
      "LMS",
      "Online Admission",
      "Exam Results",
      "Student Information System",
      "School Portal",
      "iSchool",
    ],
    authors: [{ name: appTitle }],
    alternates: {
      canonical: "./",
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: baseUrl,
      siteName: appTitle,
      title: `${appTitle} — Comprehensive School Management System`,
      description: schoolDescription,
      images: [
        {
          url: resolvedPwa512,
          width: 512,
          height: 512,
          alt: `${appTitle} Logo`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${appTitle} — Modern School Management System`,
      description: schoolDescription,
      images: [resolvedPwa512],
    },
    manifest: "/manifest.json",
    icons: {
      icon: [
        { url: resolvedFaviconUrl },
        { url: resolvedPwa192, sizes: "192x192", type: "image/png" },
        { url: resolvedPwa512, sizes: "512x512", type: "image/png" },
      ],
      apple: [
        { url: resolvedPwa192, sizes: "180x180", type: "image/png" },
        { url: resolvedPwa192, sizes: "192x192", type: "image/png" },
        { url: resolvedPwa512, sizes: "512x512", type: "image/png" },
      ],
      shortcut: [resolvedFaviconUrl],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: appTitle,
    },
    formatDetection: {
      telephone: false,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <JsonLd />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PWAInit />
          <MSWInit>
            <ToastProvider duration={3000}>
              <LanguageProvider>
                <SettingsProvider>
                  {children}
                  <Toaster />
                  <SonnerToaster position="top-center" richColors />
                </SettingsProvider>
              </LanguageProvider>
            </ToastProvider>
          </MSWInit>
        </ThemeProvider>
      </body>
    </html>
  );
}
