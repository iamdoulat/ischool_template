"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  HeartHandshake,
  Building2,
  Users,
  Award,
  ArrowRight,
  X,
  CheckCircle2,
  Clock,
  Quote,
  Menu,
  Trophy,
  BookOpen,
  GraduationCap,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { sanitizeHtml } from "@/lib/sanitize";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/lib/image-url";
import { getPublicMenus, type PublicMenuItem } from "@/lib/public-menus";
import { useSettings } from "@/components/providers/settings-provider";
import { CardBorderBeam } from "@/components/public/card-border-beam";
export { CardBorderBeam };

interface NoticeItem {
  id?: number;
  title?: string;
  notice_date?: string;
  publish_date?: string;
  message?: string;
  message_to?: string;
  is_published?: boolean;
}

interface SliderImage {
  url: string;
  title?: string;
}

interface CourseItem {
  id: number | string;
  title: string;
  description?: string;
  image?: string;
  image_url?: string;
  category?: string;
  price?: string;
  status?: string;
  link?: string;
  url?: string;
  btn_text?: string;
}

interface ProjectItem {
  id: number | string;
  title: string;
  status: string;
  badge_bg?: string;
  image?: string;
  description: string;
}

const DEFAULT_MADRASHA_PROJECTS: ProjectItem[] = [
  {
    id: 1,
    title: "মাদ্রাসার বহুতল ভবন নির্মাণ",
    status: "চলমান",
    badge_bg: "bg-amber-500",
    image: "/madrasha/Building-under-construction.jpg",
    description: "ছাত্রীদের ক্রমবর্ধমান সংখ্যা ও নিরাপদ আবাসিক ধারণক্ষমতা বৃদ্ধির লক্ষ্যে নতুন বহুতল শিক্ষা ভবনের নির্মাণ কাজ দ্রুত এগিয়ে চলছে।"
  },
  {
    id: 2,
    title: "উচ্চতর ইসলামিক গবেষণা কেন্দ্র",
    status: "পরিকল্পনা",
    badge_bg: "bg-[#014739]",
    image: "/madrasha/dawra-daras.jpg",
    description: "নারী শিক্ষার্থীদের জন্য ইফতা, তাফসির ও হাদিস গবেষণায় উচ্চতর শিক্ষা বিস্তারের বিশেষ পরিকল্পনা গৃহীত হয়েছে।"
  },
  {
    id: 3,
    title: "আলহুদা ম্যাগাজিন ও প্রকাশনা",
    status: "প্রকাশনা",
    badge_bg: "bg-emerald-600",
    image: "/madrasha/hdiya-prodan.jpg",
    description: "শিক্ষার্থীদের প্রবন্ধ, ক্যালিগ্রাফি ও সাহিত্যচর্চাকে উৎসাহিত করতে নিয়মিত ত্রৈমাসিক দেয়াল পত্রিকা ও স্মরণিকা প্রকাশনা।"
  }
];

interface HeaderFooterSections {
  arabic_title?: string;
  madrasa_name_bn?: string;
  madrasa_name_en?: string;
  madrasa_phone?: string;
  madrasa_email?: string;
  madrasa_address?: string;
  courses_section_subtitle?: string;
  hero_slider_images?: SliderImage[];
  staff_section_badge?: string;
  staff_section_title?: string;
  staff_section_subtitle?: string;
  features_section_badge?: string;
  features_section_title?: string;
  features_section_subtitle?: string;
  footer_enabled?: boolean;
  footer_arabic_title?: string;
  footer_madrasa_name?: string;
  footer_about_text?: string;
  footer_established_year?: string;
  footer_info_label?: string;
  footer_department_links?: Array<{ title: string; url?: string }>;
  footer_menu_label?: string;
  footer_quick_links?: Array<{ title: string; url?: string }>;
  footer_contact_info_label?: string;
  footer_address?: string;
  footer_phone?: string;
  footer_email?: string;
  copyright_text?: string;
  footer_powered_by_text?: string;
  muhtamim_enabled?: boolean;
  projects_enabled?: boolean;
  projects_section_badge?: string;
  projects_section_title?: string;
  projects_section_subtitle?: string;
  projects?: ProjectItem[];
  [key: string]: unknown;
}

interface AccordionItem {
  id?: number | string;
  title: string;
  content: string;
}

interface AboutUsSection {
  section_title?: string;
  section_subtitle?: string;
  title?: string;
  description?: string;
  bullet_point_1?: string;
  bullet_point_2?: string;
  bullet_point_3?: string;
  bullet_point_4?: string;
  muhtamim_badge?: string;
  muhtamim_heading?: string;
  muhtamim_subtitle?: string;
  muhtamim_institute?: string;
  muhtamim_name?: string;
  muhtamim_designation?: string;
  muhtamim_image?: string;
  muhtamim_message?: string;
  muhtamim_btn1_text?: string;
  muhtamim_btn1_url?: string;
  muhtamim_btn2_text?: string;
  muhtamim_btn2_url?: string;
  accordions_badge?: string;
  accordions_title?: string;
  accordions_subtitle?: string;
  accordions?: AccordionItem[];
  projects_section_badge?: string;
  projects_section_title?: string;
  projects_section_subtitle?: string;
  projects?: ProjectItem[];
  [key: string]: unknown;
}

interface StaffMemberItem {
  id?: number | string;
  name: string;
  role: string;
  image_url?: string;
  image?: string;
}

interface BannerItem {
  id?: number;
  title?: string | null;
  image_path?: string;
  url?: string;
}

interface MadrashaTemplateProps {
  cms: {
    header_footer_sections?: HeaderFooterSections;
    about_us?: AboutUsSection;
    main_courses?: CourseItem[];
    experienced_staffs?: StaffMemberItem[];
    latest_notices?: NoticeItem[];
    footer_text?: string;
    [key: string]: unknown;
  } | null;
  notices: NoticeItem[];
  banners?: BannerItem[];
}

function adjustHexBrightness(hex: string, percent: number): string {
  const cleanHex = hex.replace("#", "");
  if (cleanHex.length !== 6 && cleanHex.length !== 3) return hex;
  const fullHex = cleanHex.length === 3 
    ? cleanHex.split("").map(c => c + c).join("") 
    : cleanHex;
  const num = parseInt(fullHex, 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.min(255, Math.max(0, (num >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function AnimatedCounter({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const countRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let startTimestamp: number | null = null;
    let rafId: number;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        rafId = window.requestAnimationFrame(step);
      }
    };
    rafId = window.requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [isVisible, end, duration]);

  const toBn = (n: number) => {
    const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return n.toString().replace(/\d/g, (d) => bnDigits[Number(d)] || d);
  };

  return <span ref={countRef}>{toBn(count)}{suffix}</span>;
}

function StatsCounterSection({ hfs }: { hfs: HeaderFooterSections }) {
  if (hfs.stats_enabled === false) return null;

  const stats = [
    {
      label: "ছাত্র-ছাত্রী",
      value: Number(hfs.stats_students ?? 850),
      suffix: "+",
      icon: GraduationCap,
      color: "text-emerald-300",
      iconBg: "bg-emerald-400/20 border-emerald-400/40 text-emerald-300",
      cardBorder: "hover:border-emerald-400/60 hover:bg-emerald-950/30",
      beamColors: ["#10B981", "#34D399", "#06B6D4", "#F59E0B"],
    },
    {
      label: "বিজ্ঞ শিক্ষকমণ্ডলী",
      value: Number(hfs.stats_teachers ?? 42),
      suffix: "+",
      icon: Award,
      color: "text-amber-300",
      iconBg: "bg-amber-400/20 border-amber-400/40 text-amber-300",
      cardBorder: "hover:border-amber-400/60 hover:bg-amber-950/30",
      beamColors: ["#F59E0B", "#FBBF24", "#F97316", "#10B981"],
    },
    {
      label: "শিক্ষাবিভাগ ও কোর্স",
      value: Number(hfs.stats_courses ?? 6),
      suffix: "",
      icon: BookOpen,
      color: "text-sky-300",
      iconBg: "bg-sky-400/20 border-sky-400/40 text-sky-300",
      cardBorder: "hover:border-sky-400/60 hover:bg-sky-950/30",
      beamColors: ["#0284C7", "#38BDF8", "#06B6D4", "#10B981"],
    },
    {
      label: "সাফল্য ও স্বীকৃতি",
      value: Number(hfs.stats_awards ?? 18),
      suffix: "+",
      icon: Trophy,
      color: "text-orange-300",
      iconBg: "bg-orange-400/20 border-orange-400/40 text-orange-300",
      cardBorder: "hover:border-orange-400/60 hover:bg-orange-950/30",
      beamColors: ["#EA580C", "#FB923C", "#F59E0B", "#E11D48"],
    },
  ];

  return (
    <section id="stats" className="py-14 bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#0c3140] text-white relative overflow-hidden shadow-2xl">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`relative overflow-hidden text-center space-y-3 p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 ${stat.cardBorder} transition-all duration-300 group shadow-lg`}
            >
              <CardBorderBeam
                rx={16}
                ry={16}
                strokeWidth={2.5}
                gradientId={`stat-beam-${i}`}
                colors={stat.beamColors}
              />
              <div className={`mx-auto w-14 h-14 rounded-2xl ${stat.iconBg} border flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md relative z-10`}>
                <stat.icon className="h-7 w-7 transition-colors" />
              </div>
              <h3 className={`text-3xl sm:text-4xl md:text-5xl font-black ${stat.color} tracking-tight relative z-10`}>
                <AnimatedCounter end={stat.value} suffix={stat.suffix} />
              </h3>
              <p className="text-xs sm:text-sm font-bold text-white/90 tracking-wide relative z-10">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MadrashaTemplate({ cms, notices, banners }: MadrashaTemplateProps) {
  const { settings } = useSettings();
  const [activeSlide, setActiveSlide] = useState(0);
  const [viewNotice, setViewNotice] = useState<NoticeItem | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dynamicMenus, setDynamicMenus] = useState<PublicMenuItem[]>([]);

  useEffect(() => {
    let active = true;
    getPublicMenus().then((menus) => {
      if (active && Array.isArray(menus)) {
        setDynamicMenus(menus.filter((m) => m.type === "main"));
      }
    });
    return () => { active = false; };
  }, []);

  const hfs: HeaderFooterSections = cms?.header_footer_sections || {};
  const about: AboutUsSection = cms?.about_us || {};
  const courses: CourseItem[] = Array.isArray(cms?.main_courses) && cms.main_courses.length > 0 ? cms.main_courses : [];
  const latestNotices: NoticeItem[] = (notices && notices.length > 0)
    ? notices
    : (Array.isArray(cms?.latest_notices) && cms.latest_notices.length > 0 ? cms.latest_notices : []);

  const facultyMembers: StaffMemberItem[] = Array.isArray(cms?.experienced_staffs) && cms.experienced_staffs.length > 0
    ? cms.experienced_staffs
    : [
        {
          id: 1,
          name: "শায়খ মাওলানা মুজিবুর রহমান মুজাহিদ",
          role: "মুহতামিম ও শায়খুল হাদিস",
          image: "/madrasha/muhtamim-anwara.jpg"
        },
        {
          id: 2,
          name: "মাওলানা হাফেজ ক্বারী বশির আহমদ",
          role: "নায়েবে মুহতামিম ও হিফজ বিভাগীয় প্রধান",
          image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop"
        },
        {
          id: 3,
          name: "মুফতি এনামুল হক কাসেমী",
          role: "মুহাদ্দিস ও ইফতা বিভাগীয় প্রধান",
          image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop"
        },
        {
          id: 4,
          name: "মাওলানা নুরুল ইসলাম",
          role: "সিনিয়র উস্তাদ ও কিরাত বিশেষজ্ঞ",
          image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop"
        }
      ];

  const resolveImgUrl = (url?: string) => {
    if (!url) return "";
    if (url.includes("anwar-web-banner.png") || url.includes("anwara-web-banner.png")) return "/anwara-web-banner.png";
    if (url.includes("anwarabegumgirlsmadrasa.com/wp-content/uploads/")) {
      const filename = url.split("/").pop();
      if (filename) return `/madrasha/${filename}`;
    }
    if (url.startsWith("/storage/") || url.startsWith("storage/") || url.includes("/storage/")) {
      return getImageUrl(url);
    }
    return url;
  };

  // Slider images: Prioritize banners from database, then hfs.hero_slider_images, then default presets
  const dbSliderImages = (banners && banners.length > 0)
    ? banners.map((b) => ({
        url: resolveImgUrl(b.image_path || b.url),
        title: b.title || "",
      }))
    : null;

  const rawSliderImages = dbSliderImages || (hfs?.hero_slider_images && hfs.hero_slider_images.length > 0
    ? hfs.hero_slider_images
    : [
        { url: "/madrasha/Dawra-Class.jpg", title: "দাওরায়ে হাদিস ক্লাস" },
        { url: "/madrasha/dawra-daras.jpg", title: "দরসে হাদিস ও কিতাব অধ্যায়ন" },
        { url: "/madrasha/Building-under-construction.jpg", title: "মাদ্রাসার নির্মাণাধীন বহুতল ভবন" },
        { url: "/madrasha/Madrasah-gate-update.jpg", title: "মাদরাসার প্রধান ফটক" },
        { url: "/madrasha/hdiya-prodan.jpg", title: "কৃতী ছাত্রীদের পুরস্কার ও হাদিয়া প্রদান" }
      ]);
  const sliderImages = rawSliderImages.map((s) => ({ ...s, url: resolveImgUrl(s.url) }));

  // Auto advance slider
  useEffect(() => {
    if (sliderImages.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % sliderImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [sliderImages.length]);

  const nextSlide = () => setActiveSlide((prev) => (prev + 1) % sliderImages.length);
  const prevSlide = () => setActiveSlide((prev) => (prev - 1 + sliderImages.length) % sliderImages.length);

  // Parse notice dates defensively
  const parseNoticeDate = (dateStr?: string) => {
    if (!dateStr) return { day: "০১", month: "জানু", full: "" };
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { day: "১৫", month: "মে", full: dateStr };
      return {
        day: format(d, "dd"),
        month: format(d, "MMM"),
        full: format(d, "dd MMM yyyy"),
      };
    } catch {
      return { day: "০১", month: "মে", full: dateStr };
    }
  };

  const arabicTitle = hfs.arabic_title || "مدرسة البنات دار الحديث انواره بيغم محمدفور";
  const madrasaNameBn = hfs.madrasa_name_bn || "আনোয়ারা বেগম মহিলা টাইটেল মাদ্রাসা মোহাম্মদপুর";
  const schoolDisplayName = settings?.school_name || hfs.madrasa_name_bn || madrasaNameBn || "মেনু";
  const madrasaNameEn = hfs.madrasa_name_en || "ANWARA BEGUM GIRLS TITEL MADRASHA MUHAMMADPUR";
  const madrasaPhone = hfs.madrasa_phone || "+8801719606713";
  const madrasaEmail = hfs.madrasa_email || "anwarabegumgirlsmadrasa@gmail.com";
  const madrasaAddress = hfs.madrasa_address || "১২ নং গিয়াসনগর ইউনিয়ন, মোহাম্মদপুর, মৌলভীবাজার সদর, মৌলভীবাজার";
  const rawMadrashaLogo = (hfs?.imadrasha_header_logo as string) || (hfs?.madrasha_logo as string);
  const isCustomMadrashaLogo = 
    Boolean(rawMadrashaLogo) && 
    !rawMadrashaLogo.toLowerCase().includes("ischool") && 
    !rawMadrashaLogo.includes("default_logo");

  const headerBannerLogo = isCustomMadrashaLogo
    ? resolveImgUrl(rawMadrashaLogo)
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

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF8] text-gray-800 font-sans selection:bg-[#014739] selection:text-amber-300">
      
      {/* 1. TOP CONTACT STRIP (Marquee on mobile, static row on desktop) */}
      {hfs?.topbar_enabled !== false && (
        <header 
          className="text-emerald-100 text-xs py-2 border-b border-black/20 shadow-xs relative z-30 transition-colors duration-200"
          style={{ backgroundColor: topbarBg }}
        >
        <div className="container mx-auto px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-3">
          
          {/* Mobile Continuous Marquee for Phone, Email & Address */}
          <div className="flex md:hidden overflow-hidden whitespace-nowrap min-w-0 flex-1 relative group py-0.5">
            {/* Left/Right subtle fade masks */}
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
              {/* Set 1 */}
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

              {/* Set 2 (Duplicate for seamless infinite marquee loop) */}
              <div className="inline-flex items-center gap-2.5 shrink-0" aria-hidden="true">
                {phoneNumbers.map((phone, idx) => (
                  <a
                    key={`m-p2-${idx}`}
                    href={`tel:${phone.replace(/\s+/g, "")}`}
                    tabIndex={-1}
                    className="inline-flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full bg-black/25 text-emerald-100 border border-emerald-700/40 text-[11px]"
                  >
                    <Phone className="h-3 w-3 text-amber-400 shrink-0" />
                    <span className="font-medium tracking-wide">{phone}</span>
                  </a>
                ))}
                {emailAddresses.map((email, idx) => (
                  <a
                    key={`m-e2-${idx}`}
                    href={`mailto:${email}`}
                    tabIndex={-1}
                    className="inline-flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full bg-black/25 text-emerald-100 border border-emerald-700/40 text-[11px]"
                  >
                    <Mail className="h-3 w-3 text-amber-400 shrink-0" />
                    <span>{email}</span>
                  </a>
                ))}
                {madrasaAddress && (
                  <div 
                    className="inline-flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full bg-black/25 text-emerald-200 border border-emerald-700/40 text-[11px]"
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

      {/* 2. HEADER BANNER LOGO IMAGE (Full-width in only mobile mode, contained on desktop) */}
      <section 
        className="py-0 md:py-2.5 lg:py-3 border-b-2 border-emerald-950/60 shadow-inner transition-colors duration-200 overflow-hidden"
        style={{
          backgroundColor: madrashaHeaderBg,
        }}
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
            {(dynamicMenus.length > 0 
              ? dynamicMenus
                  .filter((m) => m.title !== "অনলাইন ভর্তি" && m.page !== "/online_admission")
                  .map((m) => ({
                    title: m.title,
                    href: m.is_external ? (m.url || "#") : (m.page || m.url || "#"),
                    newTab: !!m.open_new_tab,
                  }))
              : [
                  { title: "প্রচ্ছদ", href: "#hero", newTab: false },
                  { title: "মাদ্রাসা পরিচিতি", href: "#about-madrasa", newTab: false },
                  { title: "মুহতামিম বাণী", href: "#muhtamim", newTab: false },
                  { title: "শিক্ষকমণ্ডলী", href: "#faculty", newTab: false },
                  { title: "শিক্ষাবিভাগ", href: "#departments", newTab: false },
                  { title: "নোটিশ বক্স", href: "#notices", newTab: false },
                  { title: "বৈশিষ্ট্যসমূহ", href: "#features", newTab: false },
                  { title: "প্রজেক্ট ও পরিকল্পনা", href: "#projects", newTab: false },
                  { title: "যোগাযোগ", href: "#contact", newTab: false },
                ]
            ).map((item, idx) => {
              const gradId = `madrasha-menu-beam-${idx}`;
              return (
                <Link 
                  key={idx} 
                  href={item.href} 
                  target={item.newTab ? "_blank" : "_self"}
                  className="header-menu-link group relative inline-flex items-center px-3.5 py-1.5 hover:bg-[#00382D] hover:text-amber-300 transition-colors rounded-lg"
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
              title={schoolDisplayName}
              style={{
                fontSize: settings?.header_mobile_font_size ? `${settings.header_mobile_font_size}px` : undefined,
              }}
            >
              {schoolDisplayName}
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
          <div className="md:hidden bg-[#01352A] border-t border-emerald-800 px-4 py-3 space-y-2 text-sm font-medium">
            {(dynamicMenus.length > 0 
              ? dynamicMenus
                  .filter((m) => m.title !== "অনলাইন ভর্তি" && m.page !== "/online_admission")
                  .map((m) => ({
                    title: m.title,
                    href: m.is_external ? (m.url || "#") : (m.page || m.url || "#"),
                    newTab: !!m.open_new_tab,
                  }))
              : [
                  { title: "প্রচ্ছদ", href: "#hero", newTab: false },
                  { title: "মাদ্রাসা পরিচিতি", href: "#about-madrasa", newTab: false },
                  { title: "মুহতামিম বাণী", href: "#muhtamim", newTab: false },
                  { title: "শিক্ষকমণ্ডলী", href: "#faculty", newTab: false },
                  { title: "শিক্ষাবিভাগ", href: "#departments", newTab: false },
                  { title: "নোটিশ বক্স", href: "#notices", newTab: false },
                  { title: "বৈশিষ্ট্যসমূহ", href: "#features", newTab: false },
                  { title: "প্রজেক্ট ও পরিকল্পনা", href: "#projects", newTab: false },
                  { title: "যোগাযোগ", href: "#contact", newTab: false },
                ]
            ).map((item, idx) => (
              <Link 
                key={idx} 
                href={item.href} 
                onClick={() => setMobileMenuOpen(false)} 
                target={item.newTab ? "_blank" : "_self"}
                className="block py-1.5 hover:text-amber-300"
              >
                {item.title}
              </Link>
            ))}
            <Link href="/online_admission" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-center bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg font-bold mt-2 shadow-sm">
              অনলাইন ভর্তি আবেদন
            </Link>
          </div>
        )}
      </nav>

      {/* 4. TICKER / ANNOUNCEMENT BAR */}
      <div className="bg-gradient-to-r from-[#01271F] via-[#01382C] to-[#01271F] text-emerald-100 py-2 px-4 shadow-inner text-xs font-medium overflow-hidden border-y border-emerald-900/80">
        <div className="container mx-auto flex items-center gap-3">
          <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-slate-950 px-3 py-0.5 rounded-full text-[11px] font-extrabold shrink-0 flex items-center gap-1.5 shadow-sm">
            <Megaphone className="h-3.5 w-3.5 text-slate-950" />
            জরুরি নোটিশ:
          </span>
          <div className="overflow-hidden whitespace-nowrap w-full">
            <div className="inline-block animate-marquee hover:pause text-emerald-100">
              {latestNotices.length > 0
                ? latestNotices.map((n, i) => (
                    <span key={i} className="mr-8 cursor-pointer hover:text-amber-300 transition-colors" onClick={() => setViewNotice(n)}>
                      <span className="text-amber-400 font-bold mr-1">★</span> {n.title}
                    </span>
                  ))
                : (
                    <span className="text-emerald-100">
                      <span className="text-amber-400 font-bold mr-1">★</span> নতুন শিক্ষাবর্ষে নূরানি, নাজেরা, হিফজ ও কিতাব বিভাগে ছাত্রী ভর্তি চলছে। যোগাযোগ: +৮৮০১৭১৯৬০৬৭১৩
                    </span>
                  )}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 space-y-12 pb-16">

        {/* 5. TOP SECTION: SLIDER (8-COL) + NOTICE BOX (4-COL) */}
        {(hfs.hero_enabled !== false || hfs.notices_enabled !== false) && (
          <section id="hero" className="container mx-auto px-4 pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left 8 Columns: Featured Slider */}
              {hfs.hero_enabled !== false && (
                <div className={cn(
                  "bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden relative group",
                  hfs.notices_enabled !== false ? "lg:col-span-8" : "lg:col-span-12"
                )}>
                  <CardBorderBeam
                    rx={12}
                    ry={12}
                    strokeWidth={2.5}
                    gradientId="hero-slider-beam"
                    colors={["#F59E0B", "#10B981", "#06B6D4", "#F97316"]}
                  />
              <div className="relative h-[280px] sm:h-[380px] md:h-[440px] w-full bg-slate-900">
                {sliderImages.map((slide: SliderImage, idx: number) => (
                  <div
                    key={idx}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                      idx === activeSlide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                    }`}
                  >
                    <img
                      src={slide.url}
                      alt={slide.title || "Madrasa Slide"}
                      className="w-full h-full object-cover object-center"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {slide.title && (
                      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white z-20">
                        <span className="bg-[#014739]/90 border border-amber-400 text-amber-300 text-xs px-3 py-1 rounded-full font-bold inline-block mb-1">
                          জামিয়ার কার্যক্রম
                        </span>
                        <h3 className="text-base sm:text-xl md:text-2xl font-bold tracking-tight">
                          {slide.title}
                        </h3>
                      </div>
                    )}
                  </div>
                ))}

                {/* Slider Navigation Buttons */}
                <button
                  onClick={prevSlide}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/40 hover:bg-[#014739] text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/40 hover:bg-[#014739] text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                  aria-label="Next"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>

                {/* Indicator Dots */}
                <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5">
                  {sliderImages.map((_: SliderImage, i: number) => (
                    <button
                      key={i}
                      onClick={() => setActiveSlide(i)}
                      className={`h-2.5 rounded-full transition-all ${
                        i === activeSlide ? "w-6 bg-amber-400" : "w-2.5 bg-white/60 hover:bg-white"
                      }`}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

              {/* Right 4 Columns: Notice Box (নোটিশ বক্স) */}
              {hfs.notices_enabled !== false && (
                <div id="notices" className={cn(
                  "bg-white rounded-2xl shadow-sm border border-emerald-100/90 overflow-hidden flex flex-col h-[440px] relative group",
                  hfs.hero_enabled !== false ? "lg:col-span-4" : "lg:col-span-12 max-w-4xl mx-auto w-full"
                )}>
                  <CardBorderBeam
                    rx={16}
                    ry={16}
                    strokeWidth={2.5}
                    gradientId="notice-box-beam"
                    colors={["#10B981", "#F59E0B", "#06B6D4", "#10B981"]}
                  />
                  
                  {/* Notice Box Header */}
                  <div className="bg-gradient-to-r from-[#014739] to-[#01352A] text-white px-5 py-3.5 border-b-2 border-amber-400 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 font-bold text-base">
                      <Megaphone className="h-5 w-5 text-amber-300" />
                      <span>নোটিশ বক্স</span>
                    </div>
                    <Link
                      href="/notices"
                      className="text-xs text-amber-300 hover:text-white transition-colors underline font-semibold"
                    >
                      সকল নোটিশ
                    </Link>
                  </div>

                  {/* Scrollable Notice List */}
                  <div className="flex-1 overflow-y-auto divide-y divide-gray-100 p-2">
                    {latestNotices.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 p-6 text-center">
                        <Megaphone className="h-10 w-10 opacity-30 mb-2" />
                        <p className="text-sm font-medium">বর্তমানে কোনো নোটিশ নেই</p>
                      </div>
                    ) : (
                      latestNotices.map((item, idx) => {
                        const dateInfo = parseNoticeDate(item.notice_date || item.publish_date);
                        return (
                          <div
                            key={item.id || idx}
                            onClick={() => setViewNotice(item)}
                            className="p-3 hover:bg-emerald-50/70 rounded-xl transition-colors cursor-pointer group flex items-start gap-3"
                          >
                            {/* Date Badge */}
                            <div className="shrink-0 flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-teal-50 border border-emerald-200/80 text-[#014739] rounded-xl h-12 w-12 font-bold group-hover:bg-[#014739] group-hover:text-amber-300 group-hover:border-[#014739] transition-all shadow-2xs">
                              <span className="text-sm font-extrabold leading-tight">{dateInfo.day}</span>
                              <span className="text-[10px] uppercase font-semibold">{dateInfo.month}</span>
                            </div>

                            {/* Title & Info */}
                            <div className="space-y-1 flex-1 min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-gray-800 group-hover:text-[#014739] line-clamp-2 leading-snug transition-colors">
                                {item.title}
                              </h4>
                              <p className="text-[11px] text-gray-400 flex items-center gap-1">
                                <Clock className="h-3 w-3 text-emerald-600/70" />
                                {dateInfo.full || item.notice_date}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Notice Box Footer */}
                  <div className="p-3 bg-slate-50/80 border-t border-gray-100 text-center">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full text-xs font-bold text-[#014739] border-emerald-300 hover:bg-[#014739] hover:text-amber-300 hover:border-[#014739] transition-all rounded-lg"
                    >
                      <Link href="/notices">
                        আরও নোটিশ দেখুন
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )}

            </div>
          </section>
        )}

        {/* 6. ABOUT MADRASA ("মাদ্রাসা পরিচিতি") */}
        {hfs.about_enabled !== false && (
          <section id="about-madrasa" className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Left 7-col: About Narrative */}
            <div className="lg:col-span-7 bg-white rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-8 md:p-10 space-y-6 flex flex-col justify-between relative group overflow-hidden">
              <CardBorderBeam
                rx={24}
                ry={24}
                strokeWidth={3}
                gradientId="about-narrative-beam"
                colors={["#10B981", "#F59E0B", "#3B82F6", "#8B5CF6"]}
              />
              <div className="space-y-3 border-b border-gray-100 pb-5 flex flex-col items-center md:items-start text-center md:text-left">
                <span className="text-xs font-bold uppercase tracking-widest text-[#014739] bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full inline-block">
                  {about.section_title || "আমাদের মাদ্রাসা সম্পর্কে কিছু কথা"}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight w-full">
                  {about.title || "আনোয়ারা বেগম মহিলা টাইটেল মাদ্রাসা"}
                </h2>
                {about.section_subtitle && (
                  <p className="text-xs sm:text-sm text-gray-500 font-medium italic w-full">
                    {about.section_subtitle}
                  </p>
                )}
              </div>

              {/* About Text Narrative */}
              <div className="text-sm md:text-base text-gray-700 leading-relaxed space-y-4 whitespace-pre-line text-justify">
                {about.description ||
                  `আল্লাহ তায়ালার প্রিয় হাবিব সর্বশ্রেষ্ঠ মহামানব মানবতার মুক্তির দিশারী হযরত মুহাম্মদ (সা.)-এর উপর প্রথম ওহি অবতীর্ণ হয় 'ইকরা'—পড়। হুজুর (সা.) এরশাদ করেছেন নর-নারী সকলের উপর ইলমে দ্বীন শিক্ষা করা ফরজ। কিন্তু দুঃখজনক হলেও সত্য যে বর্তমানে আমাদের দেশে সিংহভাগ মানুষই সেই শিক্ষা থেকে বঞ্চিত। বিশেষ করে মা-বোনদের মধ্যে দ্বীনি শিক্ষার প্রচলন খুবই সীমিত।

বর্তমান অপসংস্কৃতির যুগে অবহেলিত নারীসমাজকে মুক্তির লক্ষ্যে মা খাদিজাতুল কুবরা (রা.) ও মা আয়েশা (রা.)-এর মতো আদর্শ মা হিসেবে গড়ে তোলার লক্ষ্যে দেশের খ্যাতনামা উলামায়ে কেরাম, সচেতন দ্বীনদরদী ও বুদ্ধিজীবী ব্যক্তিবর্গের পরামর্শে মৌলভীবাজার জেলার সদর উপজেলাধীন ১২ নং গিয়াসনগর ইউনিয়নের অন্তর্গত মোহাম্মদপুর গ্রামে ১৭ই মার্চ ২০০৩ সালে প্রতিষ্ঠা করা হয় আনোয়ারা বেগম মহিলা টাইটেল মাদ্রাসা মোহাম্মদপুর।

আল্লাহ তায়ালা যেন এই প্রতিষ্ঠানকে মিল্লাতে ইসলামিয়ার অবহেলিত নারীসমাজকে ইলমে দ্বীনের আওতায় নিয়ে আসার জন্য কবুল করেন এবং আমাদের সকলের জন্য নাজাতের উসিলা বানিয়ে দেন। আমিন।`}
              </div>

              {/* Bullet Highlights: Modern Multi-Color Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2.5 text-xs font-semibold text-emerald-950 bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200/80 shadow-2xs hover:shadow-xs transition-all">
                  <div className="h-7 w-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span>{about.bullet_point_1 || "মা খাদিজা (রা.) ও আয়েশা (রা.)-এর আদর্শে পাঠদান"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-blue-950 bg-blue-50/80 p-3.5 rounded-xl border border-blue-200/80 shadow-2xs hover:shadow-xs transition-all">
                  <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span>{about.bullet_point_2 || "দাওরায়ে হাদিস (মাস্টার্স সমমান) স্তর পর্যন্ত শিক্ষাব্যবস্থা"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-amber-950 bg-amber-50/80 p-3.5 rounded-xl border border-amber-200/80 shadow-2xs hover:shadow-xs transition-all">
                  <div className="h-7 w-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span>{about.bullet_point_3 || "হিফজুল কুরআন ও আন্তর্জাতিক মানের বিশুদ্ধ তাজবিদ চর্চা"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-purple-950 bg-purple-50/80 p-3.5 rounded-xl border border-purple-200/80 shadow-2xs hover:shadow-xs transition-all">
                  <div className="h-7 w-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span>{about.bullet_point_4 || "কম্পিউটার শিক্ষা ও নারীদের প্রয়োজনীয় হস্তশিল্প প্রশিক্ষণ"}</span>
                </div>
              </div>
            </div>

            {/* Right 5-col: Campus Feature Card */}
            <div className="group/feature lg:col-span-5 bg-gradient-to-br from-[#064e3b] via-[#043e30] to-[#0c2e3d] text-white rounded-3xl shadow-xl p-6 sm:p-8 flex flex-col justify-between border border-emerald-500/40 relative overflow-hidden transition-all duration-300">
              <CardBorderBeam
                rx={24}
                ry={24}
                strokeWidth={3}
                gradientId="feature-card-beam-grad"
                colors={["#F59E0B", "#10B981", "#06B6D4", "#F97316"]}
                activeClass="group-hover/feature:opacity-100"
              />

              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

              <div className="space-y-4">
                <div className="relative h-56 sm:h-64 w-full rounded-2xl overflow-hidden shadow-md border-2 border-emerald-500/50">
                  <img
                    src={resolveImgUrl((about.card_image as string) || (about.image_url as string) || "/madrasha/dawra-daras.jpg")}
                    alt="মাদরাসার শিক্ষা পরিবেশ"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/madrasha/Dawra-Class.jpg";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                  <span className="absolute bottom-3 left-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-extrabold text-xs px-3.5 py-1 rounded-full shadow-md">
                    {(about.card_badge as string) || (about.experience_label ? `${about.experience_years ? about.experience_years + ' ' : ''}${about.experience_label}` : "ঐতিহ্যের দ্বীনি শিক্ষাঙ্গন • স্থাপিত ২০০৩")}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black text-amber-300">
                    {(about.card_title as string) || "আদর্শ ইসলামী নারী গড়ার অনন্য জামিয়া"}
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-normal">
                    {(about.card_description as string) || "সম্পূর্ণ শরিয়তসম্মত শালীন পর্দা, অভিজ্ঞ শিক্ষিকাবৃন্দের যত্ন এবং আধুনিক তথ্যপ্রযুক্তির সমন্বয়ে গড়ে উঠেছে আমাদের এই শিক্ষাঙ্গন।"}
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-emerald-200 font-medium">
                  {(about.card_contact_text as string) || "ভর্তি সংক্রান্ত যেকোনো তথ্যে যোগাযোগ করুন"}
                </div>
                <Link
                  href={(about.card_btn_url as string) || "/online_admission"}
                  className="w-full sm:w-auto text-center bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-extrabold px-6 py-2.5 rounded-full shadow-lg hover:shadow-orange-500/25 transition-all flex items-center justify-center gap-1.5 shrink-0"
                >
                  {(about.card_btn_text as string) || "ভর্তি নির্দেশিকা"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

          </div>
        </section>
        )}

        {/* 6.1 DEDICATED MUHTAMIM SPEECH SECTION ("মুহতামিম সাহেবের বাণী") */}
        {hfs.muhtamim_enabled !== false && (
          <section id="muhtamim" className="container mx-auto px-4">
            <div className="group/muhtamim bg-gradient-to-br from-[#022a21] via-[#054a39] to-[#0c313d] text-white rounded-3xl shadow-2xl p-8 sm:p-12 md:p-14 relative overflow-hidden border border-emerald-400/20 transition-all duration-300">
              <CardBorderBeam
                rx={24}
                ry={24}
                strokeWidth={3.5}
                gradientId="muhtamim-outer-beam-grad"
                colors={["#F59E0B", "#10B981", "#06B6D4", "#F97316"]}
                activeClass="group-hover/muhtamim:opacity-100"
              />

              {/* Dynamic Multi-Color Ambient Glow Lights */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-400/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center">
                {/* Left Portrait & Info (4 cols) */}
                <div className="lg:col-span-4 flex flex-col items-center text-center">
                  <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md mb-5">
                    <Quote className="h-3.5 w-3.5 fill-slate-950/20" />
                    {about.muhtamim_badge || "মুহতামিম সাহেবের বাণী"}
                  </div>

                  {/* Radiant Multi-Color Gradient Ring */}
                  <div className="relative h-48 w-48 sm:h-56 sm:w-56 rounded-full p-1.5 bg-gradient-to-tr from-amber-400 via-emerald-300 to-teal-300 shadow-2xl ring-4 ring-white/10 overflow-hidden group mb-4">
                    <img
                      src={resolveImgUrl(about.muhtamim_image) || "/madrasha/muhtamim-anwara.jpg"}
                      alt={about.muhtamim_name || "মুহতামিম"}
                      className="h-full w-full object-cover rounded-full group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/madrasha/muhtamim-anwara.jpg";
                      }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-100 bg-clip-text text-transparent tracking-tight">
                      {about.muhtamim_name || "শায়খ মাওলানা মুজিবুর রহমান মুজাহিদ"}
                    </h3>
                    <div>
                      <p className="inline-block px-3 py-1 bg-white/10 backdrop-blur-xs rounded-full text-xs font-semibold text-white/95 border border-white/15 shadow-xs">
                        {about.muhtamim_designation || "মুহতামিম ও শায়খুল হাদিস"}
                      </p>
                    </div>
                    <p className="text-xs text-emerald-200/90 font-medium pt-1">
                      {about.muhtamim_institute || madrasaNameBn || "আনোয়ারা বেগম মহিলা টাইটেল মাদ্রাসা মোহাম্মাদপুর"}
                    </p>
                  </div>
                </div>

                {/* Right Speech Narrative (8 cols) */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="space-y-1.5 flex flex-col items-center md:items-start text-center md:text-left">
                    <span className="text-xs font-bold text-amber-300 tracking-wider uppercase">
                      {about.muhtamim_subtitle || "দিকনির্দেশনামূলক নসিহত ও বার্তা"}
                    </span>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight w-full">
                      {about.muhtamim_heading || "দ্বীনি শিক্ষার গুরুত্ব ও খোদাভীরু নারীসমাজ গঠনের আহ্বান"}
                    </h2>
                    <div className="h-1.5 w-20 bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 rounded-full mt-2 mb-4 mx-auto md:mx-0" />
                  </div>

                  {/* Modern Luminous Card for Speech with Outer Traveling Border Beam */}
                  <div className="group/quote relative bg-white/95 backdrop-blur-md rounded-2xl p-6 sm:p-8 text-slate-800 shadow-2xl border border-white/80 overflow-hidden">
                    <CardBorderBeam
                      rx={16}
                      ry={16}
                      strokeWidth={2.5}
                      gradientId="quote-card-beam-grad"
                      colors={["#F59E0B", "#10B981", "#06B6D4", "#F97316"]}
                      activeClass="group-hover/quote:opacity-100"
                    />

                    <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md shrink-0">
                          <Quote className="h-5 w-5 fill-white/20" />
                        </div>
                        <div>
                          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                            মুহতামিম ও শায়খুল হাদিসের বাণী
                          </span>
                          <p className="text-[11px] text-slate-500 font-medium">আদর্শ নারী গঠন ও দ্বীনি শিক্ষা বার্তা</p>
                        </div>
                      </div>
                      <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-[#014739] text-[11px] font-bold border border-emerald-200 shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        প্রামাণিক বক্তব্য
                      </span>
                    </div>

                    <div className="text-sm sm:text-[15px] text-slate-700 leading-relaxed font-normal whitespace-pre-line text-justify space-y-2 relative z-10">
                      <p>
                        {about.muhtamim_message ||
                          `আসসালামু আলাইকুম ওয়ারাহমাতুল্লাহ। দ্বীনি শিক্ষা প্রতিটি মুসলমানের জন্য আত্মিক পথনির্দেশ। বিশেষ করে আমাদের সমাজে কন্যাশিশু ও মা-বোনদের খাঁটি ইসলামি অনুশাসনে শিক্ষিত করে গড়ে তোলা আজ সময়ের সবচেয়ে বড় দাবি। আনোয়ার বেগম মহিলা টাইটেল মাদ্রাসা আল্লাহর রহমতে সেই মহান লক্ষ্য নিয়ে এগিয়ে যাচ্ছে। আপনারা সকলেই এই প্রতিষ্ঠানের জন্য দোয়া করবেন এবং সার্বিক সহযোগিতা করবেন। জাযাকুমুল্লাহু খাইরান।`}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    <Link
                      href={about.muhtamim_btn1_url || "/online_admission"}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs sm:text-sm px-8 py-3.5 rounded-full shadow-xl hover:shadow-orange-500/30 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      {about.muhtamim_btn1_text || "ভর্তির বিস্তারিত নির্দেশিকা ও আবেদন"}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href={about.muhtamim_btn2_url || "#contact"}
                      className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold px-7 py-3.5 rounded-full border border-white/25 hover:border-white/50 backdrop-blur-xs transition-all"
                    >
                      {about.muhtamim_btn2_text || "যোগাযোগ করুন"}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 7. JAMIA ACADEMIC DEPARTMENTS ("জামিয়ার শিক্ষাবিভাগ") */}
        {hfs.courses_enabled !== false && (
          <section id="departments" className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto space-y-2 mb-10">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#014739] bg-emerald-50 border border-emerald-200/90 px-3.5 py-1 rounded-full shadow-2xs">
              {(hfs.courses_section_badge as string) || "দ্বীনি ও আধুনিক শিক্ষা"}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              {(hfs.courses_section_title as string) || "জামিয়ার শিক্ষাবিভাগ"}
            </h2>
            <div className="h-1 w-20 bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-600 mx-auto rounded-full" />
            <p className="text-xs sm:text-sm text-gray-600">
              {hfs.courses_section_subtitle || "দ্বীনি শিক্ষার পাশাপাশি আধুনিক তথ্যপ্রযুক্তি ও নারীদের কারিগরি আত্মকর্মসংস্থানের সুসমন্বয়।"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(courses.length > 0 ? courses : [
              {
                id: 1,
                title: "নুরানি বিভাগ",
                description: "শিশুদের সহিহ কুরআন তিলাওয়াত, কালিমা, নামাজ, প্রয়োজনীয় দোয়া ও প্রাথমিক মাসআলা শিক্ষা।",
                image: "/madrasha/1111-300x300.png",
                category: "নুরানি",
                status: "ভর্তি চলমান",
                btn_text: "আবেদন করুন",
                link: "/online_admission"
              },
              {
                id: 2,
                title: "কিতাব বিভাগ",
                description: "মিযান, নাহবেমীর থেকে শুরু করে শরহে বেকায়া, জালালাইন ও দাওরায়ে হাদিস পর্যন্ত সর্বোচ্চ স্তর।",
                image: "/madrasha/events-5-300x300.jpg",
                category: "কিতাব",
                status: "ভর্তি চলমান",
                btn_text: "আবেদন করুন",
                link: "/online_admission"
              },
              {
                id: 3,
                title: "মাহে রমজানের আয়োজন",
                description: "পবিত্র মাহে রমজান উপলক্ষে কুরআনুল কারীমের বিশুদ্ধ মাখরাজ, তাজবিদ ও মাসআলা শিক্ষা বিশেষ কোর্স।",
                image: "/madrasha/al-quran1-300x300.jpg",
                category: "বিশেষ কোর্স",
                status: "ভর্তি চলমান",
                btn_text: "আবেদন করুন",
                link: "/online_admission"
              },
              {
                id: 4,
                title: "আইটি বিভাগ",
                description: "ছাত্রীদের স্বাবলম্বী করে গড়ে তুলতে আধুনিক কম্পিউটার লিটারেসি ও ডিজিটাল জ্ঞান প্রশিক্ষণ।",
                image: "/madrasha/it_Computer-300x300.jpg",
                category: "তথ্যপ্রযুক্তি",
                status: "ভর্তি চলমান",
                btn_text: "আবেদন করুন",
                link: "/online_admission"
              },
              {
                id: 5,
                title: "কারিগরি বিভাগ",
                description: "সেলাই, কাটিং, এমব্রয়ডারি ও নারীদের দৈনন্দিন হস্তশিল্প বিষয়ে হাতেকলমে বাস্তবসম্মত প্রশিক্ষণ।",
                image: "/madrasha/sewing-machine-1369658_1920-300x300.jpg",
                category: "কারিগরি",
                status: "ভর্তি চলমান",
                btn_text: "আবেদন করুন",
                link: "/online_admission"
              },
              {
                id: 6,
                title: "স্পোকেন কোর্স",
                description: "বিশুদ্ধ আরবি ও ইংরেজি ভাষায় কথন এবং লিখন দক্ষতার বিশেষ ব্যবহারিক প্রশিক্ষণ।",
                image: "/madrasha/Example_of_Arabic_text_Wellcome_L0040185-300x300.jpg",
                category: "ভাষা শিক্ষা",
                status: "ভর্তি চলমান",
                btn_text: "আবেদন করুন",
                link: "/online_admission"
              }
            ]).map((dept: CourseItem, idx: number) => {
              const deptThemes = [
                {
                  badge: "bg-gradient-to-r from-emerald-600 to-teal-600 text-white",
                  border: "border-emerald-100 hover:border-emerald-400 hover:shadow-emerald-500/10",
                  status: "text-emerald-700 bg-emerald-50 border border-emerald-200/60",
                  titleHover: "group-hover:text-emerald-700",
                  btn: "text-emerald-700 hover:text-emerald-800",
                  beamColors: ["#10B981", "#34D399", "#06B6D4", "#F59E0B"],
                },
                {
                  badge: "bg-gradient-to-r from-indigo-600 to-blue-600 text-white",
                  border: "border-indigo-100 hover:border-indigo-400 hover:shadow-indigo-500/10",
                  status: "text-indigo-700 bg-indigo-50 border border-indigo-200/60",
                  titleHover: "group-hover:text-indigo-700",
                  btn: "text-indigo-700 hover:text-indigo-800",
                  beamColors: ["#4F46E5", "#6366F1", "#38BDF8", "#10B981"],
                },
                {
                  badge: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
                  border: "border-amber-100 hover:border-amber-400 hover:shadow-amber-500/10",
                  status: "text-amber-800 bg-amber-50 border border-amber-200/60",
                  titleHover: "group-hover:text-amber-700",
                  btn: "text-amber-700 hover:text-amber-800",
                  beamColors: ["#F59E0B", "#F97316", "#FBBF24", "#10B981"],
                },
                {
                  badge: "bg-gradient-to-r from-cyan-600 to-blue-600 text-white",
                  border: "border-cyan-100 hover:border-cyan-400 hover:shadow-cyan-500/10",
                  status: "text-cyan-800 bg-cyan-50 border border-cyan-200/60",
                  titleHover: "group-hover:text-cyan-700",
                  btn: "text-cyan-700 hover:text-cyan-800",
                  beamColors: ["#06B6D4", "#0EA5E9", "#3B82F6", "#10B981"],
                },
                {
                  badge: "bg-gradient-to-r from-rose-500 to-pink-600 text-white",
                  border: "border-rose-100 hover:border-rose-400 hover:shadow-rose-500/10",
                  status: "text-rose-700 bg-rose-50 border border-rose-200/60",
                  titleHover: "group-hover:text-rose-700",
                  btn: "text-rose-700 hover:text-rose-800",
                  beamColors: ["#F43F5E", "#FB7185", "#F59E0B", "#8B5CF6"],
                },
                {
                  badge: "bg-gradient-to-r from-purple-600 to-violet-600 text-white",
                  border: "border-purple-100 hover:border-purple-400 hover:shadow-purple-500/10",
                  status: "text-purple-700 bg-purple-50 border border-purple-200/60",
                  titleHover: "group-hover:text-purple-700",
                  btn: "text-purple-700 hover:text-purple-800",
                  beamColors: ["#9333EA", "#A855F7", "#EC4899", "#3B82F6"],
                },
              ];
              const theme = deptThemes[idx % deptThemes.length];

              return (
                <div
                  key={dept.id}
                  className={cn(
                    "bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col group relative",
                    theme.border
                  )}
                >
                  <CardBorderBeam
                    rx={16}
                    ry={16}
                    strokeWidth={2.5}
                    gradientId={`dept-beam-${dept.id || idx}`}
                    colors={theme.beamColors}
                  />
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                    <img
                      src={resolveImgUrl(dept.image || dept.image_url) || "/madrasha/Dawra-Class.jpg"}
                      alt={dept.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/madrasha/Dawra-Class.jpg";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {dept.category && (
                      <span className={cn(
                        "absolute top-3 right-3 text-[10px] font-extrabold px-3 py-1 rounded-full shadow-md",
                        theme.badge
                      )}>
                        {dept.category}
                      </span>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className={cn("font-bold text-base md:text-lg text-gray-900 transition-colors", theme.titleHover)}>
                        {dept.title}
                      </h3>
                      <p className="text-xs text-gray-600 mt-2 leading-relaxed line-clamp-3">
                        {dept.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className={cn("font-bold px-2.5 py-1 rounded-md text-xs", theme.status)}>
                        {dept.status || dept.price || "ভর্তি চলমান"}
                      </span>
                      <Link
                        href={dept.link || dept.url || "/online_admission"}
                        className={cn("font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-all", theme.btn)}
                      >
                        {dept.btn_text || "আবেদন করুন"}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        )}

        {/* 7.1 EXPERIENCED FACULTY MEMBERS ("শিক্ষক ও পরিচালকমণ্ডলী") */}
        {hfs.staff_enabled !== false && (
          <section id="faculty" className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto space-y-2 mb-10">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#014739] bg-emerald-50 border border-emerald-200/90 px-3.5 py-1 rounded-full shadow-2xs">
                {hfs.staff_section_badge || "বিজ্ঞ উলামায়ে কেরাম ও শিক্ষকমণ্ডলী"}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                {hfs.staff_section_title || "শিক্ষক ও পরিচালকমণ্ডলী"}
              </h2>
              <div className="h-1 w-20 bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-600 mx-auto rounded-full" />
              <p className="text-xs sm:text-sm text-gray-600">
                {hfs.staff_section_subtitle || "যোগ্য, অভিজ্ঞ ও নিবেদিতপ্রাণ উস্তাদ-উস্তাযাদের পরম যত্ন ও সার্বক্ষণিক তত্ত্বাবধানে পরিচালিত শিক্ষা কার্যক্রম।"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {facultyMembers.map((member, idx) => {
                const facultyThemes = [
                  {
                    ring: "group-hover:ring-amber-400 group-hover:border-amber-400",
                    role: "bg-amber-50 text-amber-900 border-amber-200/80",
                    hoverBorder: "hover:border-amber-300 hover:shadow-amber-500/10",
                    nameHover: "group-hover:text-amber-800",
                    beamColors: ["#F59E0B", "#FBBF24", "#F97316", "#10B981"],
                  },
                  {
                    ring: "group-hover:ring-emerald-400 group-hover:border-emerald-400",
                    role: "bg-emerald-50 text-emerald-900 border-emerald-200/80",
                    hoverBorder: "hover:border-emerald-300 hover:shadow-emerald-500/10",
                    nameHover: "group-hover:text-[#014739]",
                    beamColors: ["#10B981", "#34D399", "#06B6D4", "#F59E0B"],
                  },
                  {
                    ring: "group-hover:ring-blue-400 group-hover:border-blue-400",
                    role: "bg-blue-50 text-blue-900 border-blue-200/80",
                    hoverBorder: "hover:border-blue-300 hover:shadow-blue-500/10",
                    nameHover: "group-hover:text-blue-800",
                    beamColors: ["#3B82F6", "#60A5FA", "#6366F1", "#10B981"],
                  },
                  {
                    ring: "group-hover:ring-purple-400 group-hover:border-purple-400",
                    role: "bg-purple-50 text-purple-900 border-purple-200/80",
                    hoverBorder: "hover:border-purple-300 hover:shadow-purple-500/10",
                    nameHover: "group-hover:text-purple-800",
                    beamColors: ["#8B5CF6", "#A78BFA", "#EC4899", "#3B82F6"],
                  },
                ];
                const theme = facultyThemes[idx % facultyThemes.length];

                return (
                  <div
                    key={member.id || idx}
                    className={cn(
                      "bg-white rounded-2xl border border-slate-100 p-6 shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center group relative overflow-hidden",
                      theme.hoverBorder
                    )}
                  >
                    <CardBorderBeam
                      rx={16}
                      ry={16}
                      strokeWidth={2.5}
                      gradientId={`faculty-beam-${member.id || idx}`}
                      colors={theme.beamColors}
                    />
                    <div className={cn(
                      "relative h-32 w-32 rounded-full overflow-hidden border-4 border-slate-100 transition-all duration-300 shadow-md group-hover:scale-105 mb-4 bg-slate-50 flex items-center justify-center",
                      theme.ring
                    )}>
                      {member.image_url || member.image ? (
                        <img
                          src={resolveImgUrl(member.image_url || member.image)}
                          alt={member.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=400&auto=format&fit=crop";
                          }}
                        />
                      ) : (
                        <Users className="h-14 w-14 text-emerald-600 stroke-[1.5px]" />
                      )}
                      <div className="absolute inset-0 bg-emerald-900/0 group-hover:bg-emerald-900/10 transition-colors" />
                    </div>

                    <h3 className={cn("font-bold text-base sm:text-lg text-gray-900 transition-colors leading-snug", theme.nameHover)}>
                      {member.name}
                    </h3>
                    <span className={cn("inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold border shadow-2xs", theme.role)}>
                      {member.role}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 8. CHARACTERISTICS & FEATURES OF THE MADRASA ("মাদরাসার বৈশিষ্ট্যসমূহ / Educational Pillars") */}
        {hfs.features_enabled !== false && (
          <section id="features" className="bg-gradient-to-b from-[#F2F7F4] via-[#F8FAF8] to-[#EBF3ED] border-y border-emerald-100/80 py-14">
            <div className="container mx-auto px-4">
              <div className="text-center max-w-3xl mx-auto space-y-2 mb-10">
                <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#014739] bg-white border border-emerald-200 px-3.5 py-1 rounded-full shadow-2xs">
                  {about.accordions_badge || hfs.features_section_badge || "সুশৃঙ্খল পরিবেশ"}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  {about.accordions_title || hfs.features_section_title || "মাদরাসার বৈশিষ্ট্যসমূহ"}
                </h2>
                <div className="h-1 w-20 bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-600 mx-auto rounded-full" />
                <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto pt-1">
                  {about.accordions_subtitle || hfs.features_section_subtitle || "দ্বীনি শিক্ষার পূর্ণাঙ্গ বিকাশ ও চরিত্র গঠনে আমাদের বিশেষ বৈশিষ্ট্য ও সুযোগ-সুবিধা।"}
                </p>
              </div>

              {/* Responsive Cards System */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {(Array.isArray(about.accordions) && about.accordions.length > 0 ? about.accordions : [
                  {
                    id: 1,
                    title: "সার্বক্ষণিক পর্দার সুব্যবস্থা",
                    content: "নারী শিক্ষার্থীদের পরিপূর্ণ ইসলামি অনুশাসন ও শরিয়তসম্মত শালীন পর্দা নিশ্চিতকরণ।"
                  },
                  {
                    id: 2,
                    title: "চরিত্রগঠনমূলক নিবিড় তারবিয়াত",
                    content: "আদর্শ ও খোদাভীরু মা হিসেবে গড়ে তুলতে প্রতিনিয়ত বিশেষ তারবিয়াতি ও নসিহতমূলক পরিবেশ।"
                  },
                  {
                    id: 3,
                    title: "সম্পূর্ণ অরাজনৈতিক পরিবেশ",
                    content: "দলীয় রাজনৈতিক প্রভাবমুক্ত, নিবেদিতপ্রাণ খাঁটি দ্বীনি শিক্ষার অনুকূল শান্তিময় ক্যাম্পাস।"
                  },
                  {
                    id: 4,
                    title: "অভিজ্ঞ উস্তাদ ও উস্তাযাহ",
                    content: "বিজ্ঞ উলামায়ে কেরাম ও অভিজ্ঞ শিক্ষিকাবৃন্দের নিবিড় তত্ত্বাবধানে যত্নসহকারে পাঠদান।"
                  },
                  {
                    id: 5,
                    title: "স্বাস্থ্যসম্মত নিরাপদ আবাসন",
                    content: "দূর-দূরান্ত থেকে আগত ছাত্রীদের জন্য সুষম খাবার, নিরাপদ হোস্টেল ও মাতৃতুল্য অভিভাবকত্ব।"
                  },
                  {
                    id: 6,
                    title: "কেন্দ্রীয় বোর্ডে সাফল্য",
                    content: "বেফাক ও হাইয়াতুল উলয়ার অধীনে অনুষ্ঠিত কেন্দ্রীয় সমাপনী পরীক্ষায় প্রতি বছর মেধা তালিকায় গৌরবময় স্থান।"
                  }
                ]).map((feat, i) => {
                  const icons = [ShieldCheck, HeartHandshake, Sparkles, Users, Building2, Award];
                  const IconComponent = icons[i % icons.length] || ShieldCheck;
                  const featureThemes = [
                    {
                      iconGrad: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/20",
                      badge: "bg-emerald-50 text-emerald-800 border-emerald-200/60",
                      hoverBorder: "hover:border-emerald-400 hover:shadow-emerald-500/10",
                      titleHover: "group-hover:text-emerald-700",
                      dot: "bg-emerald-500",
                      beamColors: ["#10B981", "#34D399", "#06B6D4", "#F59E0B"],
                    },
                    {
                      iconGrad: "bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-rose-500/20",
                      badge: "bg-rose-50 text-rose-800 border-rose-200/60",
                      hoverBorder: "hover:border-rose-400 hover:shadow-rose-500/10",
                      titleHover: "group-hover:text-rose-700",
                      dot: "bg-rose-500",
                      beamColors: ["#F43F5E", "#FB7185", "#F59E0B", "#8B5CF6"],
                    },
                    {
                      iconGrad: "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-amber-500/20",
                      badge: "bg-amber-50 text-amber-800 border-amber-200/60",
                      hoverBorder: "hover:border-amber-400 hover:shadow-amber-500/10",
                      titleHover: "group-hover:text-amber-700",
                      dot: "bg-amber-500",
                      beamColors: ["#F59E0B", "#FBBF24", "#F97316", "#10B981"],
                    },
                    {
                      iconGrad: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/20",
                      badge: "bg-blue-50 text-blue-800 border-blue-200/60",
                      hoverBorder: "hover:border-blue-400 hover:shadow-blue-500/10",
                      titleHover: "group-hover:text-blue-700",
                      dot: "bg-blue-500",
                      beamColors: ["#3B82F6", "#60A5FA", "#6366F1", "#10B981"],
                    },
                    {
                      iconGrad: "bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-purple-500/20",
                      badge: "bg-purple-50 text-purple-800 border-purple-200/60",
                      hoverBorder: "hover:border-purple-400 hover:shadow-purple-500/10",
                      titleHover: "group-hover:text-purple-700",
                      dot: "bg-purple-500",
                      beamColors: ["#8B5CF6", "#A78BFA", "#EC4899", "#3B82F6"],
                    },
                    {
                      iconGrad: "bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-white shadow-amber-500/20",
                      badge: "bg-amber-50 text-amber-900 border-amber-200/60",
                      hoverBorder: "hover:border-amber-400 hover:shadow-amber-500/10",
                      titleHover: "group-hover:text-amber-700",
                      dot: "bg-amber-500",
                      beamColors: ["#F59E0B", "#FBBF24", "#F59E0B", "#06B6D4"],
                    },
                  ];
                  const theme = featureThemes[i % featureThemes.length];

                  return (
                    <div
                      key={feat.id || i}
                      className={cn(
                        "bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between relative overflow-hidden",
                        theme.hoverBorder
                      )}
                    >
                      <CardBorderBeam
                        rx={16}
                        ry={16}
                        strokeWidth={2.5}
                        gradientId={`feature-beam-${feat.id || i}`}
                        colors={theme.beamColors}
                      />
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-md", theme.iconGrad)}>
                            <IconComponent className="h-6 w-6" />
                          </div>
                          <span className={cn("text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border", theme.badge)}>
                            #{i + 1}
                          </span>
                        </div>

                        <h3 className={cn("font-bold text-base text-gray-900 transition-colors", theme.titleHover)}>
                          {feat.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                          {feat.content}
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-gray-100 flex items-center gap-1.5 text-[11px] font-bold text-slate-600 transition-colors">
                        <span className={cn("h-2 w-2 rounded-full", theme.dot)} />
                        <span>বিশেষ বৈশিষ্ট্য</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* 9. ONGOING PROJECTS & PUBLICATIONS */}
        {hfs.projects_enabled !== false && (
          <section id="projects" className="container mx-auto px-4 py-8 sm:py-12">
            <div className="text-center max-w-3xl mx-auto space-y-2 mb-10">
              <span className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-[#014739] bg-emerald-50 border border-emerald-200/90 px-4 py-1 rounded-full shadow-2xs">
                {about.projects_section_badge || hfs.projects_section_badge || "অগ্রযাত্রা ও ভবিষ্যৎ"}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                {about.projects_section_title || hfs.projects_section_title || "নির্মাণাধীন প্রজেক্ট ও পরিকল্পনা"}
              </h2>
              <div className="h-1 w-20 bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-600 mx-auto rounded-full" />
              <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto pt-1 leading-relaxed">
                {about.projects_section_subtitle || hfs.projects_section_subtitle || "মাদ্রাসার অবকাঠামোগত উন্নয়ন, বহুতল ভবন নির্মাণ ও ভবিষ্যৎ সম্প্রসারণের ধারাবাহিক পরিকল্পনা।"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(Array.isArray(hfs.projects) && hfs.projects.length > 0
                ? hfs.projects
                : (Array.isArray(about.projects) && about.projects.length > 0 ? about.projects : DEFAULT_MADRASHA_PROJECTS)
              ).map((project: ProjectItem, idx: number) => {
                const projectBadges = [
                  "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600",
                  "bg-gradient-to-r from-emerald-600 to-teal-600",
                  "bg-gradient-to-r from-blue-600 to-indigo-600",
                ];
                const projectBeams = [
                  ["#F59E0B", "#F97316", "#EA580C", "#10B981"],
                  ["#10B981", "#059669", "#06B6D4", "#F59E0B"],
                  ["#3B82F6", "#6366F1", "#8B5CF6", "#10B981"],
                ];
                const badgeGrad = project.badge_bg || projectBadges[idx % projectBadges.length];

                return (
                  <div
                    key={project.id || idx}
                    className="bg-white rounded-2xl shadow-2xs border border-slate-100 overflow-hidden flex flex-col group hover:shadow-xl hover:border-amber-300 hover:-translate-y-1.5 transition-all duration-300 relative"
                  >
                    <CardBorderBeam
                      rx={16}
                      ry={16}
                      strokeWidth={2.5}
                      gradientId={`project-beam-${project.id || idx}`}
                      colors={projectBeams[idx % projectBeams.length]}
                    />
                    <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100">
                      <img
                        src={resolveImgUrl(project.image) || "/madrasha/Building-under-construction.jpg"}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/madrasha/Building-under-construction.jpg";
                        }}
                      />
                      <span className={cn(
                        "absolute top-3 left-3 text-white text-[11px] font-extrabold px-3.5 py-1 rounded-full shadow-md",
                        badgeGrad
                      )}>
                        {project.status || "চলমান"}
                      </span>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-start space-y-2.5">
                      <h3 className="font-bold text-base sm:text-lg text-gray-900 group-hover:text-amber-700 transition-colors leading-snug">
                        {project.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                        {project.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 10. STATS COUNTER BAR */}
        {hfs.stats_enabled !== false && <StatsCounterSection hfs={hfs} />}

      </main>

      {/* 10. NOTICE DETAIL MODAL */}
      <Dialog open={!!viewNotice} onOpenChange={(open) => !open && setViewNotice(null)}>
        <DialogContent className="sm:max-w-[650px] p-0 rounded-xl border-none shadow-2xl overflow-hidden">
          <div className="bg-[#014739] p-5 text-white flex items-center justify-between border-b-2 border-amber-400">
            <DialogHeader className="p-0">
              <DialogTitle className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-amber-300" />
                {viewNotice?.title}
              </DialogTitle>
            </DialogHeader>
            <button
              onClick={() => setViewNotice(null)}
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {viewNotice && (
            <div className="p-6 space-y-5 bg-white overflow-y-auto max-h-[65vh]">
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4 text-[#014739]" />
                  <span>তারিখ: {viewNotice.notice_date || viewNotice.publish_date || "—"}</span>
                </div>
                {viewNotice.message_to && (
                  <span className="bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                    উদ্দেশ্য: {viewNotice.message_to}
                  </span>
                )}
              </div>

              <div
                className="prose prose-sm max-w-none text-gray-700 leading-relaxed break-words"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(viewNotice.message || "") }}
              />
            </div>
          )}

          <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewNotice(null)}
              className="font-bold text-xs rounded-full px-6"
            >
              বন্ধ করুন
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 11. EMERALD GREEN MADRASA FOOTER */}
      {hfs.footer_enabled !== false && (() => {
        const isMadrashaFooterBgEnabled = hfs.madrasha_footer_bg_enabled !== false && hfs.footer_bg_enabled !== false;
        const madrashaFooterBg = isMadrashaFooterBgEnabled
          ? ((hfs.madrasha_footer_bg as string) || (hfs.footer_bg as string) || "#01352A")
          : "#01352A";

        return (
          <footer 
            id="contact" 
            className="text-emerald-100 border-t-4 border-amber-400 transition-colors"
            style={{ backgroundColor: madrashaFooterBg }}
          >
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              
              {/* Column 1: Identity */}
              <div className="space-y-4 col-span-2 md:col-span-1 text-center md:text-left flex flex-col items-center md:items-start">
                {hfs.footer_show_logo !== false && Boolean(hfs.footer_logo) && (
                  <div className="mb-1">
                    <img 
                      src={getImageUrl(hfs.footer_logo as string)} 
                      alt={(hfs.footer_madrasa_name as string) || "Madrasa Logo"} 
                      className="h-12 w-auto object-contain rounded-md"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
                <div className="text-amber-300 font-serif text-sm w-full text-center md:text-left" dir="rtl">
                  {(hfs.footer_arabic_title as string) || arabicTitle || "مدرسة البنات دار الحديث انواره بيغم محمدفور"}
                </div>
                {hfs.footer_show_school_name !== false && hfs.footer_show_institute_name !== false && (
                  <h3 className="text-lg font-extrabold text-white leading-snug w-full text-center md:text-left">
                    {(hfs.footer_madrasa_name as string) || madrasaNameBn || "আনোয়ারা বেগম মহিলা টাইটেল মাদ্রাসা মোহাম্মদপুর"}
                  </h3>
                )}
                <p className="text-xs text-emerald-200/80 leading-relaxed max-w-md mx-auto md:mx-0 text-center md:text-left">
                  {(hfs.footer_about_text as string) || "মা খাদিজা (রা.) ও আয়েশা (রা.)-এর আদর্শে অনুকরণীয় নারীসমাজ গঠনের লক্ষ্যে প্রতিষ্ঠিত এক ঐতিহ্যবাহী দ্বীনি শিক্ষাপ্রতিষ্ঠান।"}
                </p>
                {hfs.footer_show_established_year !== false && (
                  <div className="pt-1 text-[11px] text-amber-300 font-bold w-full text-center md:text-left">
                    {(hfs.footer_established_year as string) || "স্থাপিত: ২০০৬ খ্রিস্টাব্দ"}
                  </div>
                )}

                {/* Column 1 Social Media Links */}
                {hfs.footer_show_social !== false && (
                  <div className="flex items-center gap-2 pt-2 flex-wrap justify-center md:justify-start">
                    {(() => {
                      const cmsSoc = (cms?.social_media as Record<string, string>) || {};
                      const soc = (hfs.footer_social_links as Record<string, string>) || cmsSoc;
                      const fb = soc.facebook || cmsSoc.facebook;
                      const yt = soc.youtube || cmsSoc.youtube;
                      const tw = soc.twitter || cmsSoc.twitter;
                      const insta = soc.instagram || cmsSoc.instagram;
                      const wa = soc.whatsapp || cmsSoc.whatsapp;
                      const li = soc.linkedin || cmsSoc.linkedin;
                      
                      return (
                        <>
                          {fb && (
                            <a href={fb} target="_blank" rel="noopener noreferrer" className="h-7 w-7 rounded-full bg-emerald-900/80 hover:bg-blue-600 hover:text-white text-emerald-200 flex items-center justify-center transition-colors border border-emerald-700/50 shadow-xs" title="Facebook">
                              <Facebook size={13} />
                            </a>
                          )}
                          {yt && (
                            <a href={yt} target="_blank" rel="noopener noreferrer" className="h-7 w-7 rounded-full bg-emerald-900/80 hover:bg-rose-600 hover:text-white text-emerald-200 flex items-center justify-center transition-colors border border-emerald-700/50 shadow-xs" title="YouTube">
                              <Youtube size={13} />
                            </a>
                          )}
                          {tw && (
                            <a href={tw} target="_blank" rel="noopener noreferrer" className="h-7 w-7 rounded-full bg-emerald-900/80 hover:bg-sky-500 hover:text-white text-emerald-200 flex items-center justify-center transition-colors border border-emerald-700/50 shadow-xs" title="Twitter / X">
                              <Twitter size={13} />
                            </a>
                          )}
                          {insta && (
                            <a href={insta} target="_blank" rel="noopener noreferrer" className="h-7 w-7 rounded-full bg-emerald-900/80 hover:bg-pink-600 hover:text-white text-emerald-200 flex items-center justify-center transition-colors border border-emerald-700/50 shadow-xs" title="Instagram">
                              <Instagram size={13} />
                            </a>
                          )}
                          {wa && (
                            <a href={wa.startsWith('http') ? wa : `https://wa.me/${wa.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="h-7 w-7 rounded-full bg-emerald-900/80 hover:bg-emerald-500 hover:text-white text-emerald-200 flex items-center justify-center transition-colors border border-emerald-700/50 shadow-xs" title="WhatsApp">
                              <Phone size={13} />
                            </a>
                          )}
                          {li && (
                            <a href={li} target="_blank" rel="noopener noreferrer" className="h-7 w-7 rounded-full bg-emerald-900/80 hover:bg-blue-700 hover:text-white text-emerald-200 flex items-center justify-center transition-colors border border-emerald-700/50 shadow-xs" title="LinkedIn">
                              <Linkedin size={13} />
                            </a>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Column 2: Academic Departments / Information */}
              <div className="space-y-3 col-span-1">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-emerald-800 pb-2">
                  {hfs.footer_info_label || "জামিয়ার শিক্ষাবিভাগ"}
                </h4>
                <ul className="space-y-2 text-xs">
                  {(hfs.footer_department_links && hfs.footer_department_links.length > 0 ? hfs.footer_department_links : [
                    { title: "নুরানি ও নাজেরা বিভাগ", url: "#departments" },
                    { title: "হিফজুল কুরআন বিভাগ", url: "#departments" },
                    { title: "কিতাব ও দাওরায়ে হাদিস বিভাগ", url: "#departments" },
                    { title: "আইটি ও কম্পিউটার প্রশিক্ষণ", url: "#departments" },
                    { title: "কারিগরি ও সেলাই প্রশিক্ষণ", url: "#departments" }
                  ]).map((dept, idx) => (
                    <li key={idx}>
                      <Link href={dept.url || "#departments"} className="hover:text-amber-300 transition-colors">
                        {dept.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 3: Quick Links */}
              <div className="space-y-3 col-span-1">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-emerald-800 pb-2">
                  {hfs.footer_menu_label || "জরুরি লিংকসমূহ"}
                </h4>
                <ul className="space-y-2 text-xs">
                  {(hfs.footer_quick_links && hfs.footer_quick_links.length > 0 ? hfs.footer_quick_links : [
                    { title: "অনলাইন ভর্তি আবেদন", url: "/online_admission" },
                    { title: "মাদরাসা নোটিশ বোর্ড", url: "#notices" },
                    { title: "মাদ্রাসা পরিচিতি ও ইতিহাস", url: "#about-madrasa" },
                    { title: "মুহতামিম সাহেবের বাণী", url: "#muhtamim" },
                    { title: "শিক্ষক ও পরিচালকমণ্ডলী", url: "#faculty" },
                    { title: "এডমিন / শিক্ষক লগইন", url: "/login" }
                  ]).map((qLink, idx) => (
                    <li key={idx}>
                      <Link href={qLink.url || "#"} className="hover:text-amber-300 transition-colors">
                        {qLink.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 4: Contact Information */}
              <div className="space-y-3 col-span-2 md:col-span-1">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-emerald-800 pb-2">
                  {hfs.footer_contact_info_label || "যোগাযোগের ঠিকানা"}
                </h4>
                <ul className="space-y-2.5 text-xs text-emerald-200/90">
                  <li className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{hfs.footer_address || madrasaAddress || "১২ নং গিয়াসনগর ইউনিয়ন, মোহাম্মদপুর, মৌলভীবাজার সদর, মৌলভীবাজার"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>{hfs.footer_phone || madrasaPhone || "+8801719606713"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>{hfs.footer_email || madrasaEmail || "anwarabegumgirlsmadrasa@gmail.com"}</span>
                  </li>
                </ul>
              </div>

            </div>

            <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-300/70 gap-2">
              <p>
                {hfs.copyright_text || cms?.footer_text || "© All Rights reserved by Anwara Begum Girls Titel Madrasha Muhammadpur"}
              </p>
              <p className="flex items-center gap-1">
                {!hfs.footer_powered_by_text?.includes("চালিত হচ্ছে") && (
                  <span>চালিত হচ্ছে:</span>
                )}
                <span className="font-bold text-amber-400">{hfs.footer_powered_by_text || "iSchool Management System"}</span>
              </p>
            </div>
          </div>
        </footer>
        );
      })()}

    </div>
  );
}
