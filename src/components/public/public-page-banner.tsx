"use client";

import React from "react";
import Link from "next/link";
import { House, ChevronRight, Sparkles, GraduationCap, BookOpen, Bell, Mail, Award } from "lucide-react";
import { useSettings } from "@/components/providers/settings-provider";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";

export interface PublicPageBannerProps {
  title: string;
  subtitle?: string;
  badgeText?: string;
  badgeIcon?: React.ReactNode;
  breadcrumbTitle?: string;
  parentBreadcrumb?: { name: string; href: string };
  bgImageUrl?: string;
  cmsData?: Record<string, unknown> | null;
  className?: string;
}

/**
 * Modern, theme-aware hero banner component for public website pages.
 * Automatically adapts colors, ambient glows, badges, and breadcrumbs
 * based on the active website template (iSchool vs iMadrasha).
 */
export function PublicPageBanner({
  title,
  subtitle,
  badgeText,
  badgeIcon,
  breadcrumbTitle,
  parentBreadcrumb,
  bgImageUrl,
  cmsData,
  className,
}: PublicPageBannerProps) {
  const { settings } = useSettings();
  const { t } = useTranslation();

  const isMadrasha =
    settings?.website_template === "imadrasha" ||
    cmsData?.website_template === "imadrasha" ||
    (cmsData?.header_footer_sections as Record<string, unknown>)?.website_template === "imadrasha";

  // Infer smart badge icon & text based on page title if not explicitly supplied
  const lowerTitle = (title || "").toLowerCase();
  
  let defaultBadgeText = isMadrasha ? "মাদরাসা অফিসিয়াল পোর্টাল" : "Official Academic Portal";
  let defaultBadgeIcon = <Sparkles className="h-3.5 w-3.5" />;

  if (lowerTitle.includes("result") || lowerTitle.includes("exam") || lowerTitle.includes("ফলাফল")) {
    defaultBadgeText = isMadrasha ? "পরীক্ষা ও মূল্যায়ন ফলাফল" : "Academic Verification & Results";
    defaultBadgeIcon = <GraduationCap className="h-3.5 w-3.5" />;
  } else if (lowerTitle.includes("about") || lowerTitle.includes("school") || lowerTitle.includes("পরিচিতি")) {
    defaultBadgeText = isMadrasha ? "ঐতিহ্য ও পরিচিতি" : "Campus Heritage & Leadership";
    defaultBadgeIcon = <Award className="h-3.5 w-3.5" />;
  } else if (lowerTitle.includes("academic") || lowerTitle.includes("curriculum") || lowerTitle.includes("বিভাগ")) {
    defaultBadgeText = isMadrasha ? "শিক্ষা কারিকুলাম ও বিভাগ" : "Curriculum & Academic Standards";
    defaultBadgeIcon = <BookOpen className="h-3.5 w-3.5" />;
  } else if (lowerTitle.includes("notice") || lowerTitle.includes("circular") || lowerTitle.includes("নোটিশ")) {
    defaultBadgeText = isMadrasha ? "বিজ্ঞপ্তি ও নোটিশ বোর্ড" : "Bulletins & Official Notices";
    defaultBadgeIcon = <Bell className="h-3.5 w-3.5" />;
  } else if (lowerTitle.includes("contact") || lowerTitle.includes("যোগাযোগ")) {
    defaultBadgeText = isMadrasha ? "যোগাযোগ ও তথ্যসেবা" : "Helpdesk & Communications";
    defaultBadgeIcon = <Mail className="h-3.5 w-3.5" />;
  }

  const finalBadgeText = badgeText || defaultBadgeText;
  const finalBadgeIcon = badgeIcon || defaultBadgeIcon;
  const currentBreadcrumb = breadcrumbTitle || title;
  const baseUrl = (process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || "https://ischool.coolify.mddoulat.com").replace(/\/+$/, "");

  // Schema.org BreadcrumbList structured data for search engine rich results
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      ...(parentBreadcrumb
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: parentBreadcrumb.name,
              item: `${baseUrl}${parentBreadcrumb.href.startsWith("/") ? "" : "/"}${parentBreadcrumb.href}`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: currentBreadcrumb,
            },
          ]
        : [
            {
              "@type": "ListItem",
              position: 2,
              name: currentBreadcrumb,
            },
          ]),
    ],
  };

  return (
    <section
      className={cn(
        "relative text-white pt-5 pb-6 sm:pt-6 sm:pb-7 md:pt-7 md:pb-8 overflow-hidden isolate select-none",
        isMadrasha
          ? "bg-gradient-to-br from-[#01221B] via-[#01352A] to-[#024436]"
          : "bg-gradient-to-br from-[#032620] via-[#044E43] to-[#0A2633]",
        className
      )}
    >
      {/* Schema.org BreadcrumbList for Google Search Engines */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* 1. Ambient Decorative Glowing Light Orbs */}
      {isMadrasha ? (
        <>
          <div className="absolute -top-24 -left-20 w-80 h-80 bg-amber-400/20 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: "7s" }} />
          <div className="absolute top-1/2 -right-24 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: "9s" }} />
          <div className="absolute -bottom-24 left-1/3 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute -top-28 -left-24 w-80 h-80 bg-emerald-400/25 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: "6s" }} />
          <div className="absolute top-1/3 -right-24 w-80 h-80 bg-[#FF9800]/15 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: "8s" }} />
          <div className="absolute -bottom-24 left-1/4 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        </>
      )}

      {/* 2. Modern Vector Dot-Grid Texture */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(#ffffff18_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40 mix-blend-overlay" 
        aria-hidden="true"
      />

      {/* 3. Subtle Photography Backdrop Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10 mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url('${bgImageUrl || "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop"}')`,
        }}
        aria-hidden="true"
      />

      {/* 4. Soft Vignette Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none" />

      {/* 5. Islamic Star Pattern Watermark for Madrasha */}
      {isMadrasha && (
        <svg
          className="absolute -right-12 -bottom-12 w-64 h-64 text-amber-400/10 pointer-events-none"
          viewBox="0 0 100 100"
          fill="currentColor"
          aria-hidden="true"
        >
          <polygon points="50 0, 62 38, 100 50, 62 62, 50 100, 38 62, 0 50, 38 38" />
          <circle cx="50" cy="50" r="18" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      )}

      {/* 6. Main Content Area */}
      <div className="container mx-auto px-4 sm:px-6 md:px-12 relative z-10 max-w-5xl">
        
        {/* Top Bar: Breadcrumb on the Left, Badge on the Right */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 sm:gap-3 mb-3 sm:mb-4">
          {/* Breadcrumb Trail on Left */}
          <nav 
            aria-label="Breadcrumb"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md bg-black/30 border border-white/15 text-white/80 shadow-xs hover:bg-black/40 transition-colors"
          >
            <Link 
              href="/" 
              className="hover:text-white transition-colors inline-flex items-center gap-1 text-white/70"
              title="Home"
            >
              <House className="h-3 w-3" />
              <span>{t("home") || "Home"}</span>
            </Link>
            
            {parentBreadcrumb && (
              <>
                <ChevronRight className="h-3 w-3 text-white/40 shrink-0" />
                <Link 
                  href={parentBreadcrumb.href} 
                  className="hover:text-white transition-colors text-white/70"
                >
                  {parentBreadcrumb.name}
                </Link>
              </>
            )}

            <ChevronRight className="h-3 w-3 text-white/40 shrink-0" />
            <span className="text-white font-semibold truncate max-w-[170px] sm:max-w-[280px]">
              {currentBreadcrumb}
            </span>
          </nav>

          {/* Category / Feature Pill on Right */}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border shadow-xs transition-transform hover:scale-105 shrink-0",
              isMadrasha
                ? "bg-amber-500/15 text-amber-300 border-amber-400/30"
                : "bg-white/10 text-emerald-300 border-emerald-400/30"
            )}
          >
            {finalBadgeIcon}
            <span>{finalBadgeText}</span>
          </span>
        </div>

        {/* Center Page Title & Subtitle */}
        <div className="text-center max-w-3xl mx-auto">
          {/* Page Title (h1) */}
          <h1 
            className={cn(
              "text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight uppercase leading-[1.14] drop-shadow-sm",
              isMadrasha && "font-serif"
            )}
          >
            {title}
          </h1>

          {/* Subtitle / Description */}
          {subtitle && (
            <p
              className={cn(
                "mt-2 sm:mt-2.5 text-xs sm:text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-normal",
                isMadrasha ? "text-amber-100/90" : "text-emerald-50/90"
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* 7. Bottom Radiant Border Separator */}
      {isMadrasha ? (
        <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500/40 via-amber-400 to-amber-500/40 shadow-[0_10px_25px_-5px_rgba(245,158,11,0.5)]" />
      ) : (
        <>
          <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 h-4 bg-gradient-to-t from-black/15 to-transparent pointer-events-none" />
        </>
      )}
    </section>
  );
}
