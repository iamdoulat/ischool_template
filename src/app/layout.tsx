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

import { getImageUrl } from "@/lib/image-url";

export async function generateMetadata(): Promise<Metadata> {
  let appTitle = "iSchool";
  let rawFavicon = "/logo-admin-small.png";
  let rawPwaIcon192 = "/logo-app.png";
  let rawPwaIcon512 = "/logo-app.png";

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
    const res = await fetch(`${apiUrl}/system-setting/general-setting`, {
      next: { revalidate: 30 },
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const json = await res.json();
      const settings = json.data || json;

      if (settings.pwa_app_short_name && settings.pwa_app_short_name.trim() !== "") {
        appTitle = settings.pwa_app_short_name;
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
  } catch (error) {
    console.error("Error generating SSR layout metadata:", error);
  }

  const resolvedFaviconUrl = getImageUrl(rawFavicon) || rawFavicon;
  const resolvedPwa192 = getImageUrl(rawPwaIcon192) || rawPwaIcon192;
  const resolvedPwa512 = getImageUrl(rawPwaIcon512) || rawPwaIcon512;

  return {
    title: appTitle,
    description: "Comprehensive School Management System & Portal",
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
