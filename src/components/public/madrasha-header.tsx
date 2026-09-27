"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { useSettings } from "@/components/providers/settings-provider";
import { getImageUrl } from "@/lib/image-url";
import { getPublicMenus, type PublicMenuItem } from "@/lib/public-menus";
import api from "@/lib/api";

function adjustHexBrightness(hex: string, percent: number): string {
  if (!hex || !hex.startsWith("#")) return hex;
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    "#" +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

interface MadrashaHeaderProps {
  cmsData?: Record<string, unknown> | null;
}

export function MadrashaHeader({ cmsData }: MadrashaHeaderProps = {}) {
  const { settings } = useSettings();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dynamicMenus, setDynamicMenus] = useState<PublicMenuItem[]>([]);
  const [fetchedCms, setFetchedCms] = useState<Record<string, unknown> | null>(null);
  const cms = cmsData || fetchedCms;

  useEffect(() => {
    if (cmsData) return;
    let active = true;
    api
      .get("/front-cms/settings")
      .then((res) => {
        if (active && res.data?.data) {
          setFetchedCms(res.data.data);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [cmsData]);

  useEffect(() => {
    let active = true;
    getPublicMenus("imadrasha").then((menus) => {
      if (active) setDynamicMenus(menus.filter((m) => m.type !== "bottom"));
    });
    return () => {
      active = false;
    };
  }, []);

  const hfs = (cms?.header_footer_sections as Record<string, unknown>) || {};

  const madrasaNameBn =
    (hfs.madrasa_name_bn as string) ||
    ((settings?.school_name as string) && !String(settings?.school_name).toLowerCase().includes("school") ? (settings?.school_name as string) : "আনোয়ারা বেগম মহিলা টাইটেল মাদ্রাসা মোহাম্মদপুর");
  const madrasaNameEn = (hfs.madrasa_name_en as string) || "Anwara Begum Girls Titel Madrasha";
  const madrasaPhone = (hfs.madrasa_phone as string) || (settings?.phone as string) || "+8801719606713";
  const madrasaEmail = (hfs.madrasa_email as string) || (settings?.email as string) || "anwarabegumgirlsmadrasa@gmail.com";
  const madrasaAddress = (hfs.madrasa_address as string) || (settings?.address as string) || "১২ নং গিয়াসনগর ইউনিয়ন, মোহাম্মদপুর, মৌলভীবাজার সদর, মৌলভীবাজার";

  const rawMadrashaLogo = (hfs?.imadrasha_header_logo as string) || (hfs?.madrasha_logo as string);
  const isCustomMadrashaLogo =
    Boolean(rawMadrashaLogo) &&
    !rawMadrashaLogo.toLowerCase().includes("ischool") &&
    !rawMadrashaLogo.includes("default_logo");

  const headerBannerLogo = isCustomMadrashaLogo
    ? getImageUrl(rawMadrashaLogo)
    : "/anwara-web-banner.png";

  const madrashaHeaderBgEnabled = hfs?.madrasha_header_bg_enabled !== false && hfs?.header_bg_enabled !== false;
  const madrashaHeaderBg = madrashaHeaderBgEnabled
    ? ((hfs?.madrasha_header_bg as string) || "#014739")
    : "#014739";
  const topbarBg = madrashaHeaderBgEnabled
    ? ((hfs?.madrasha_topbar_bg as string) || adjustHexBrightness(madrashaHeaderBg, -22))
    : adjustHexBrightness("#014739", -22);

  const phoneNumbers = madrasaPhone
    .split(/[,;/]+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const emailAddresses = madrasaEmail
    .split(/[,;/]+/)
    .map((e) => e.trim())
    .filter(Boolean);

  const isSubpage = pathname !== "/";

  // Build standard navigation links
  const defaultNavItems = [
    { title: "প্রচ্ছদ", href: "/" },
    { title: "মাদ্রাসা পরিচিতি", href: isSubpage ? "/#about-madrasa" : "#about-madrasa" },
    { title: "মুহতামিম বাণী", href: isSubpage ? "/#muhtamim" : "#muhtamim" },
    { title: "শিক্ষকমণ্ডলী", href: isSubpage ? "/#faculty" : "#faculty" },
    { title: "শিক্ষাবিভাগ", href: isSubpage ? "/#departments" : "#departments" },
    { title: "নোটিশ বক্স", href: "/notices" },
    { title: "বৈশিষ্ট্যসমূহ", href: isSubpage ? "/#features" : "#features" },
    { title: "প্রজেক্ট ও পরিকল্পনা", href: isSubpage ? "/#projects" : "#projects" },
    { title: "যোগাযোগ", href: "/contact-us" },
    { title: "ফলাফল", href: "/exam-results" },
  ];

  const isDefaultIschoolMenus =
    dynamicMenus.length > 0 &&
    dynamicMenus.some(
      (m) =>
        m.title === "Home" ||
        m.title === "Academics" ||
        m.title === "Admissions" ||
        m.title === "Exam Results" ||
        m.title === "Notices" ||
        m.title === "About Us" ||
        m.title === "Contact Us"
    );

  const navItems =
    dynamicMenus.length > 0 && !isDefaultIschoolMenus
      ? dynamicMenus
          .filter((m) => m.title !== "অনলাইন ভর্তি" && m.page !== "/online_admission")
          .map((m) => {
            let href = "#";
            if (m.is_external) {
              href = m.url || "#";
            } else {
              const raw = m.page || m.url || "";
              if (raw.startsWith("#")) {
                href = isSubpage ? `/${raw}` : raw;
              } else {
                const pageSlug = raw === "home" ? "" : (raw === "admission" ? "online_admission" : raw);
                href = pageSlug.startsWith("/") ? pageSlug : `/${pageSlug}`;
              }
            }
            return {
              title: m.title,
              href,
              newTab: !!m.open_new_tab,
            };
          })
      : defaultNavItems;

  return (
    <div className="w-full text-gray-800 font-sans selection:bg-[#014739] selection:text-amber-300">
      {/* 1. TOP CONTACT STRIP */}
      {hfs?.topbar_enabled !== false && (
        <header
          className="text-emerald-100 text-xs py-2 border-b border-black/20 shadow-xs relative z-30 transition-colors duration-200"
          style={{ backgroundColor: topbarBg }}
        >
          <div className="container mx-auto px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-3">
            {/* Mobile Continuous Marquee */}
            <div className="flex md:hidden overflow-hidden whitespace-nowrap min-w-0 flex-1 relative group py-0.5">
              <div
                className="absolute left-0 top-0 bottom-0 w-3 pointer-events-none z-10"
                style={{ background: `linear-gradient(to right, ${topbarBg}, transparent)` }}
              />
              <div
                className="absolute right-0 top-0 bottom-0 w-3 pointer-events-none z-10"
                style={{ background: `linear-gradient(to left, ${topbarBg}, transparent)` }}
              />

              <div
                className="inline-flex items-center gap-3 animate-marquee group-hover:[animation-play-state:paused] active:[animation-play-state:paused]"
                style={{ animationDuration: "25s" }}
              >
                <div className="inline-flex items-center gap-2.5 shrink-0">
                  {phoneNumbers.map((phone, idx) => (
                    <a
                      key={`m-p1-${idx}`}
                      href={`tel:${phone.replace(/\s+/g, "")}`}
                      className="inline-flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full bg-black/25 text-emerald-100 border border-emerald-700/40 text-[11px]"
                      title={`Call ${phone}`}
                    >
                      <Phone className="h-3 w-3 text-amber-400 shrink-0" />
                      <span className="font-medium tracking-wide">{phone}</span>
                    </a>
                  ))}
                  {emailAddresses.map((email, idx) => (
                    <a
                      key={`m-e1-${idx}`}
                      href={`mailto:${email}`}
                      className="inline-flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full bg-black/25 text-emerald-100 border border-emerald-700/40 text-[11px]"
                      title={`Email ${email}`}
                    >
                      <Mail className="h-3 w-3 text-amber-400 shrink-0" />
                      <span>{email}</span>
                    </a>
                  ))}
                  {madrasaAddress && (
                    <div
                      className="inline-flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full bg-black/25 text-emerald-200 border border-emerald-700/40 text-[11px]"
                      title={madrasaAddress}
                    >
                      <MapPin className="h-3 w-3 text-amber-400 shrink-0" />
                      <span>{madrasaAddress}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Contact Details */}
            <div className="hidden md:flex items-center gap-2 sm:gap-3 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5 min-w-0 flex-1">
              {phoneNumbers.map((phone, idx) => (
                <a
                  key={`phone-${idx}`}
                  href={`tel:${phone.replace(/\s+/g, "")}`}
                  className="inline-flex items-center gap-1.5 shrink-0 px-2.5 py-0.5 rounded-full bg-black/20 hover:bg-black/40 hover:text-white transition-all text-emerald-100 border border-emerald-800/30"
                  title={`Call ${phone}`}
                >
                  <Phone className="h-3 w-3 text-amber-400 shrink-0" />
                  <span className="font-medium tracking-wide">{phone}</span>
                </a>
              ))}

              {emailAddresses.map((email, idx) => (
                <a
                  key={`email-${idx}`}
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-1.5 shrink-0 px-2.5 py-0.5 rounded-full bg-black/20 hover:bg-black/40 hover:text-white transition-all text-emerald-100 border border-emerald-800/30"
                  title={`Email ${email}`}
                >
                  <Mail className="h-3 w-3 text-amber-400 shrink-0" />
                  <span>{email}</span>
                </a>
              ))}

              {madrasaAddress && (
                <div
                  className="inline-flex items-center gap-1.5 shrink-0 px-2.5 py-0.5 rounded-full bg-black/20 text-emerald-200 border border-emerald-800/30"
                  title={madrasaAddress}
                >
                  <MapPin className="h-3 w-3 text-amber-400 shrink-0" />
                  <span>{madrasaAddress}</span>
                </div>
              )}
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 z-20 pl-2 border-l border-emerald-800/40">
              <Link
                href="/online_admission"
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-[11px] px-2.5 sm:px-3 py-1 rounded shadow-sm hover:shadow transition-all duration-200 shrink-0 whitespace-nowrap"
              >
                ভর্তি আবেদন
              </Link>
              <Link
                href="/login"
                className="bg-emerald-800/80 hover:bg-emerald-700 text-white text-[11px] px-2 sm:px-3 py-1 rounded border border-emerald-700 transition-colors font-semibold shrink-0 whitespace-nowrap"
              >
                লগইন
              </Link>
            </div>
          </div>
        </header>
      )}

      {/* 2. HEADER BANNER LOGO IMAGE */}
      <section
        className="py-0 md:py-2.5 lg:py-3 border-b-2 border-emerald-950/60 shadow-inner transition-colors duration-200 overflow-hidden"
        style={{ backgroundColor: madrashaHeaderBg }}
      >
        <div className="w-full px-2 md:container md:mx-auto md:px-4 flex justify-center items-center">
          {(() => {
            const logoW = Number(hfs?.madrasha_logo_width) || 580;
            const logoH = Number(hfs?.madrasha_logo_height) || 105;
            const isAuto = hfs?.madrasha_logo_auto_ratio !== false;

            return (
              <Link
                href="/"
                className="block text-center mx-auto transition-all"
                style={{
                  width: `${logoW}px`,
                  maxWidth: "100%",
                }}
              >
                <img
                  src={headerBannerLogo}
                  alt={`${madrasaNameBn} - ${madrasaNameEn}`}
                  className="w-full mx-auto transition-transform hover:scale-[1.005]"
                  style={{
                    maxWidth: "100%",
                    height: isAuto ? "auto" : `${logoH}px`,
                    maxHeight: isAuto ? `${logoH}px` : undefined,
                    objectFit: isAuto ? "contain" : "fill",
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/anwara-web-banner.png";
                  }}
                />
              </Link>
            );
          })()}
        </div>
      </section>

      {/* 3. EMERALD GREEN MAIN NAVIGATION BAR */}
      <nav className="sticky top-0 z-40 bg-[#014739] text-white shadow-md border-b-2 border-amber-400 py-2">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="hidden md:flex items-center space-x-1 font-semibold text-sm">
            {navItems.map((item, idx) => {
              const gradId = `madrasha-menu-beam-${idx}`;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : (item.href.startsWith("/") && !item.href.includes("#") && (pathname === item.href || pathname.startsWith(`${item.href}/`)));
              return (
                <Link
                  key={idx}
                  href={item.href}
                  target={item.newTab ? "_blank" : "_self"}
                  className={`header-menu-link group relative inline-flex items-center px-3 py-1.5 transition-colors rounded-lg ${
                    isActive ? "bg-[#00382D] text-amber-300 font-bold" : "hover:bg-[#00382D] hover:text-amber-300"
                  }`}
                >
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none overflow-visible rounded-lg"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="50%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#044E43" />
                      </linearGradient>
                    </defs>
                    <rect
                      x="0"
                      y="0"
                      width="100%"
                      height="100%"
                      rx="8"
                      ry="8"
                      fill="none"
                      stroke="#059669"
                      strokeWidth="1.5"
                      strokeOpacity="0.4"
                      className="transition-all duration-300 group-hover:stroke-amber-400 group-hover:stroke-opacity-60"
                    />
                    <rect
                      x="0"
                      y="0"
                      width="100%"
                      height="100%"
                      rx="8"
                      ry="8"
                      fill="none"
                      stroke={`url(#${gradId})`}
                      strokeWidth="2.5"
                      pathLength="100"
                      className="header-menu-beam opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    />
                  </svg>
                  <span className="relative z-10">{item.title}</span>
                </Link>
              );
            })}
          </div>

          <div className="md:hidden flex items-center justify-between w-full py-1 gap-2">
            <Link
              href="/"
              className="font-bold text-sm tracking-wide text-amber-300 truncate hover:text-white transition-colors"
              title={madrasaNameBn}
            >
              {madrasaNameBn}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded bg-[#01352A] text-white hover:bg-emerald-900 shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/online_admission"
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-sm hover:shadow transition-all flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              অনলাইন ভর্তি
            </Link>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#01352A] border-t border-emerald-800 px-4 py-3 space-y-2 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-200">
            {navItems.map((item, idx) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : (item.href.startsWith("/") && !item.href.includes("#") && (pathname === item.href || pathname.startsWith(`${item.href}/`)));
              return (
                <Link
                  key={idx}
                  href={item.href}
                  target={item.newTab ? "_blank" : "_self"}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md transition-colors ${
                    isActive ? "bg-emerald-900 text-amber-300 font-bold" : "text-emerald-100 hover:bg-emerald-900 hover:text-white"
                  }`}
                >
                  {item.title}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-emerald-800/60 flex items-center gap-2">
              <Link
                href="/online_admission"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-md shadow-sm"
              >
                ভর্তি আবেদন
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center bg-emerald-800 text-white text-xs font-semibold px-3 py-2 rounded-md border border-emerald-700"
              >
                লগইন
              </Link>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
