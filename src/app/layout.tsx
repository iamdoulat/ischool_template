import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Hind_Siliguri, Noto_Sans_Bengali } from "next/font/google";
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

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  subsets: ["bengali"],
  weight: ["300", "400", "500", "600", "700"],
});

const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-noto-sans-bengali",
  subsets: ["bengali"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

import { ThemeProvider } from "@/components/providers/theme-provider";
import { LanguageProvider } from "@/components/providers/language-provider";
import { CurrencyProvider } from "@/components/providers/currency-provider";
import { PWAInit } from "@/components/providers/pwa-init";
import { JsonLd } from "@/components/seo/json-ld";
import { ServerHeadCode } from "@/components/seo/server-head-code";
import { ClientCodeInjector } from "@/components/seo/custom-code-injector";
import { getSchoolSeoData } from "@/lib/seo-utils";

export async function generateMetadata(): Promise<Metadata> {
  const info = await getSchoolSeoData();
  const baseUrl = info.baseUrl;

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: `${info.schoolName} — School Management System & Portal`,
      template: `%s — ${info.schoolName}`,
    },
    description: info.schoolDescription,
    keywords: [
      info.schoolName,
      "School Management System",
      "Educational Portal",
      "Online Admission",
      "Examination Results",
      "Academic Notices",
      "Student Marksheet",
      "Digital School",
      "বিদ্যালয়",
      "মাদরাসা",
      "পরীক্ষার ফলাফল",
      "অনলাইন ভর্তি",
      "নোটিশ বোর্ড",
      "iSchool",
    ],
    authors: [{ name: info.schoolName }],
    creator: info.schoolName,
    publisher: info.schoolName,
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: "./",
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      alternateLocale: ["bn_BD", "ar_SA"],
      url: baseUrl,
      siteName: info.schoolName,
      title: `${info.schoolName} — Educational Portal & Management System`,
      description: info.schoolDescription,
      images: [
        {
          url: info.logoUrl,
          width: 512,
          height: 512,
          alt: `${info.schoolName} Official Logo`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${info.schoolName} — Educational Portal`,
      description: info.schoolDescription,
      images: [info.logoUrl],
    },
    manifest: "/manifest.json",
    icons: {
      icon: [
        { url: info.faviconUrl },
        { url: info.logoUrl, sizes: "192x192" },
        { url: info.logoUrl, sizes: "512x512" },
      ],
      apple: [
        { url: info.logoUrl, sizes: "180x180" },
        { url: info.logoUrl, sizes: "192x192" },
        { url: info.logoUrl, sizes: "512x512" },
      ],
      shortcut: [info.faviconUrl],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: info.schoolName,
    },
    formatDetection: {
      telephone: false,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const schoolInfo = await getSchoolSeoData();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansBengali.variable} ${hindSiliguri.variable}`}
      suppressHydrationWarning
    >
      <head suppressHydrationWarning>
        <ServerHeadCode code={schoolInfo.headerCode} />
        <JsonLd
          schoolName={schoolInfo.schoolName}
          description={schoolInfo.schoolDescription}
          url={schoolInfo.baseUrl}
          logoUrl={schoolInfo.logoUrl}
          telephone={schoolInfo.phone}
          email={schoolInfo.email}
          address={schoolInfo.address}
          sameAs={schoolInfo.socialLinks}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansBengali.variable} ${hindSiliguri.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ClientCodeInjector
          headCode={schoolInfo.headerCode}
          bodyCode={schoolInfo.bodyCode}
          footerCode={schoolInfo.footerCode}
        />
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
                <CurrencyProvider>
                  <SettingsProvider>
                    {children}
                    <Toaster />
                    <SonnerToaster position="top-center" richColors />
                  </SettingsProvider>
                </CurrencyProvider>
              </LanguageProvider>
            </ToastProvider>
          </MSWInit>
        </ThemeProvider>
      </body>
    </html>
  );
}
