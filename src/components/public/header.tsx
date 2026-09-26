"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Phone,
    Mail,
    MapPin,
    Facebook,
    Twitter,
    Linkedin,
    Instagram,
    GraduationCap,
    Menu,
    X,
    House,
    LayoutGrid,
    Search,
    ArrowUpRight,
    ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/components/providers/settings-provider";
import { tokenManager } from "@/lib/token-manager";
import { useImageUrl } from "@/lib/image-url";
import { getPublicMenus, type PublicMenuItem as MenuItem } from "@/lib/public-menus";
import api from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/components/providers/language-provider";
import { useTranslation } from "@/hooks/use-translation";

interface NavItem {
    name: string;
    href: string;
    newTab?: boolean;
}

interface HeaderUser {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    permissions?: string[];
}

const LANGUAGES = [
    { id: 1, name: "English", short_code: "en", country_code: "us", is_rtl: false, is_active: true, is_enabled: true, label: "us English" },
    { id: 2, name: "Bengali", short_code: "bn", country_code: "bd", is_rtl: false, is_active: true, is_enabled: true, label: "bd বাংলা" },
];

/**
 * Marquee text component that automatically marquees if text overflows container,
 * with pause on hover, single line containment, and accessibility support.
 */
function MarqueeText({
    text = "",
    className = "",
    duration,
    onOverflowChange,
    onMarqueeComplete,
}: {
    text?: string;
    className?: string;
    duration?: number;
    onOverflowChange?: (overflowing: boolean) => void;
    onMarqueeComplete?: () => void;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const onOverflowChangeRef = useRef(onOverflowChange);
    const onMarqueeCompleteRef = useRef(onMarqueeComplete);

    useEffect(() => {
        onOverflowChangeRef.current = onOverflowChange;
    }, [onOverflowChange]);

    useEffect(() => {
        onMarqueeCompleteRef.current = onMarqueeComplete;
    }, [onMarqueeComplete]);

    useEffect(() => {
        const checkOverflow = () => {
            if (containerRef.current && textRef.current) {
                const cWidth = containerRef.current.clientWidth;
                const sWidth = textRef.current.scrollWidth;
                const overflowing = sWidth > cWidth + 2;
                setIsOverflowing(overflowing);
                onOverflowChangeRef.current?.(overflowing);
            }
        };

        checkOverflow();
        const t1 = setTimeout(checkOverflow, 100);
        const t2 = setTimeout(checkOverflow, 400);
        window.addEventListener("resize", checkOverflow);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            window.removeEventListener("resize", checkOverflow);
        };
    }, [text]);

    if (!text) return null;

    return (
        <div
            ref={containerRef}
            className={cn("overflow-hidden whitespace-nowrap min-w-0", className)}
            title={text}
        >
            {isOverflowing ? (
                <div
                    className="inline-flex whitespace-nowrap animate-marquee group-hover:[animation-play-state:paused]"
                    style={duration ? { animationDuration: `${duration}s` } : undefined}
                    onAnimationIteration={() => {
                        onMarqueeCompleteRef.current?.();
                    }}
                >
                    <span className="shrink-0 inline-flex items-center">
                        <span ref={textRef}>{text}</span>
                        <span className="w-8 shrink-0 inline-block" aria-hidden="true" />
                    </span>
                    <span className="shrink-0 inline-flex items-center" aria-hidden="true">
                        <span>{text}</span>
                        <span className="w-8 shrink-0 inline-block" />
                    </span>
                </div>
            ) : (
                <span ref={textRef} className="truncate block">
                    {text}
                </span>
            )}
        </div>
    );
}

/**
 * Mobile rotating contact button:
 * Smoothly cycles through Mobile Number -> Email -> Address (stays until marquee finishes full address) -> Mobile Number.
 */
function MobileRotatingContact({ settings, cmsSettings }: { settings?: Record<string, unknown> | null; cmsSettings?: Record<string, unknown> | null }) {
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const [isAddressOverflowing, setIsAddressOverflowing] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const addressMountTime = useRef(0);

    const hfsRecord = (cmsSettings?.header_footer_sections as Record<string, unknown> | undefined);
    const isMadrasha = cmsSettings?.website_template === "imadrasha";
    const phone = isMadrasha
        ? (hfsRecord?.madrasa_phone as string) || "+8801719606713"
        : (hfsRecord?.school_phone as string) || settings?.phone || "+8801851046320";
    const email = isMadrasha
        ? (hfsRecord?.madrasa_email as string) || "anwarabegumgirlsmadrasa@gmail.com"
        : (hfsRecord?.school_email as string) || settings?.email || "smartideasbd24@gmail.com";
    const address = isMadrasha
        ? (hfsRecord?.madrasa_address as string) || "১২ নং গিয়াসনগর ইউনিয়ন, মোহাম্মদপুর, মৌলভীবাজার সদর, মৌলভীবাজার"
        : (hfsRecord?.school_address as string) || settings?.address || "House#68, Road#10, Sector#10, Uttara Model Town, Dhaka-1230";

    useEffect(() => {
        if (activeIndex === 2) {
            addressMountTime.current = Date.now();
        }
    }, [activeIndex]);

    useEffect(() => {
        if (isPaused) return;

        let timer: NodeJS.Timeout | null = null;

        if (activeIndex === 0) {
            // Mobile number: show for 3.5s then change to Email
            timer = setTimeout(() => {
                setActiveIndex(1);
            }, 3500);
        } else if (activeIndex === 1) {
            // Email: show for 3.5s then change to Address
            timer = setTimeout(() => {
                setActiveIndex(2);
            }, 3500);
        } else if (activeIndex === 2) {
            // Address:
            // If address is short (doesn't marquee), change after 4s
            if (!isAddressOverflowing) {
                timer = setTimeout(() => {
                    setActiveIndex(0);
                }, 4000);
            } else {
                // Address marquees: wait for full marquee pass. Fallback safety timer of 16s.
                timer = setTimeout(() => {
                    setActiveIndex(0);
                }, 16000);
            }
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [activeIndex, isAddressOverflowing, isPaused]);

    const handleMarqueeComplete = useCallback(() => {
        // Only advance if address has been visible for at least 3 seconds
        if (Date.now() - addressMountTime.current > 3000) {
            setActiveIndex(0);
        }
    }, []);

    return (
        <div
            className="flex md:hidden items-center min-w-0 shrink max-w-[195px] xs:max-w-[230px] sm:max-w-[280px]"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
        >
            {activeIndex === 0 && (
                <a
                    key="mobile-phone"
                    href={`tel:${phone}`}
                    className="group/pill flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-slate-50 hover:bg-white border border-slate-200/90 shadow-xs transition-all duration-300 shrink-0 cursor-pointer animate-in fade-in slide-in-from-bottom-1 duration-300 max-w-full"
                    title={`Phone: ${phone}`}
                >
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#044E43] to-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover/pill:scale-105 transition-transform duration-200">
                        <Phone className="h-3 w-3 stroke-[2.2px]" />
                    </span>
                    <span className="text-[11.5px] font-semibold text-slate-700 group-hover/pill:text-[#044E43] transition-colors tracking-tight truncate">
                        {phone}
                    </span>
                </a>
            )}

            {activeIndex === 1 && (
                <a
                    key="mobile-email"
                    href={`mailto:${email}`}
                    className="group/pill flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-slate-50 hover:bg-white border border-slate-200/90 shadow-xs transition-all duration-300 shrink-0 max-w-full cursor-pointer animate-in fade-in slide-in-from-bottom-1 duration-300"
                    title={`Email: ${email}`}
                >
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#044E43] to-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover/pill:scale-105 transition-transform duration-200">
                        <Mail className="h-3 w-3 stroke-[2.2px]" />
                    </span>
                    <span className="text-[11.5px] font-semibold text-slate-700 group-hover/pill:text-[#044E43] transition-colors tracking-tight truncate">
                        {email}
                    </span>
                </a>
            )}

            {activeIndex === 2 && (
                <a
                    key="mobile-address"
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/pill flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-slate-50 hover:bg-white border border-slate-200/90 shadow-xs transition-all duration-300 shrink min-w-0 max-w-full cursor-pointer animate-in fade-in slide-in-from-bottom-1 duration-300"
                    title={`Campus Address: ${address}`}
                >
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#044E43] to-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover/pill:scale-105 transition-transform duration-200">
                        <MapPin className="h-3 w-3 stroke-[2.2px]" />
                    </span>
                    <MarqueeText
                        text={address}
                        duration={12}
                        onOverflowChange={setIsAddressOverflowing}
                        onMarqueeComplete={handleMarqueeComplete}
                        className="min-w-0 flex-1 text-[11.5px] font-semibold text-slate-700 group-hover/pill:text-[#044E43] transition-colors"
                    />
                </a>
            )}
        </div>
    );
}

export function PublicHeader({ cmsData }: { cmsData?: Record<string, unknown> | null } = {}) {
    const { settings } = useSettings();
    const pathname = usePathname();
    const router = useRouter();
    const { t } = useTranslation();
    const { selectedLanguage, setSelectedLanguage, setUserContext } = useLanguage();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [dynamicMenus, setDynamicMenus] = useState<MenuItem[]>([]);
    const [cmsSettings, setCmsSettings] = useState<Record<string, unknown> | null>(cmsData || null);
    const getImageUrl = useImageUrl();
    const [mounted, setMounted] = useState(false);
    const [user, setUser] = useState<HeaderUser | null>(null);

    const currentLangCode = selectedLanguage?.short_code || "en";

    useEffect(() => {
        if (cmsData) {
            setCmsSettings(cmsData);
            return;
        }
        let active = true;
        api.get("/front-cms/settings")
            .then((res) => {
                if (active && res.data?.data) {
                    setCmsSettings(res.data.data);
                }
            })
            .catch(() => {});
        return () => { active = false; };
    }, [cmsData]);

    const handleLanguageChange = (code: string) => {
        const target = LANGUAGES.find(l => l.short_code === code);
        if (target) {
            setSelectedLanguage(target);
        }
    };

    useEffect(() => {
        let active = true;
        getPublicMenus().then((menus) => {
            if (active) setDynamicMenus(menus.filter((m) => m.type === "main"));
        });
        return () => { active = false; };
    }, []);

    useEffect(() => {
        const checkAuth = async () => {
            const token = typeof window !== 'undefined' ? (tokenManager.getToken() || await tokenManager.syncSession()) : null;
            if (!token) {
                setUser(null);
                setUserContext(null);
                setMounted(true);
                return;
            }
            try {
                const response = await api.get("/profile", { skipGlobalErrorHandler: true });
                if (response.data?.success) {
                    const userData = response.data.data;
                    setUser(userData);
                    setUserContext(userData);
                } else {
                    setUser(null);
                    setUserContext(null);
                }
            } catch (error: unknown) {
                // If token has expired or is unauthorized, clean up stale session state
                const err = error as { response?: { status?: number } };
                if (err?.response?.status === 401) {
                    tokenManager.clearToken();
                }
                setUser(null);
                setUserContext(null);
            } finally {
                setMounted(true);
            }
        };
        checkAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getDashboardUrl = () => {
        if (!user) return "/login";
        const role = (user.role || "").toLowerCase();
        if (role === "student" || role === "parent") {
            return "/user/dashboard";
        }
        return "/dashboard";
    };

    const isMadrasha = (cmsSettings?.website_template || (cmsSettings?.header_footer_sections as Record<string, unknown> | undefined)?.website_template) === "imadrasha";

    const defaultNavItems = isMadrasha ? [
        { name: "প্রচ্ছদ", href: "/#hero" },
        { name: "মাদ্রাসা পরিচিতি", href: "/#about-madrasa" },
        { name: "মুহতামিম বাণী", href: "/#muhtamim" },
        { name: "শিক্ষকমণ্ডলী", href: "/#faculty" },
        { name: "শিক্ষাবিভাগ", href: "/#departments" },
        { name: "নোটিশ বক্স", href: "/#notices" },
        { name: "বৈশিষ্ট্যসমূহ", href: "/#features" },
        { name: "প্রজেক্ট ও পরিকল্পনা", href: "/#projects" },
        { name: "যোগাযোগ", href: "/#contact" },
        { name: "অনলাইন ভর্তি", href: "/online_admission" },
    ] : [
        { name: t("home"), href: "/" },
        { name: t("academics"), href: "/academics" },
        { name: t("admissions"), href: "/online_admission" },
        { name: t("exam_results"), href: "/exam-results" },
        { name: t("notices"), href: "/notices" },
        { name: t("about_us"), href: "/about-us" },
        { name: t("contact"), href: "/contact-us" },
    ];

    const displayMenus: NavItem[] = (() => {
        const seen = new Set<string>();
        const hasHome = dynamicMenus.some(m => ['home', 'প্রচ্ছদ'].includes(m.title.toLowerCase().trim()));
        
        const rawItems: NavItem[] = dynamicMenus.length > 0 ? [
            ...(!hasHome ? [{ name: isMadrasha ? "প্রচ্ছদ" : t("home"), href: "/" }] : []),
            ...dynamicMenus.map(m => {
                let href = '';
                if (!!m.is_external) {
                    href = m.url || '';
                } else {
                    const raw = m.page || m.url || '';
                    if (raw.startsWith('#')) {
                        href = `/${raw}`;
                    } else {
                        const pageSlug = raw === 'home' ? '' : (raw === 'admission' ? 'online_admission' : raw);
                        href = pageSlug.startsWith('/') ? pageSlug : `/${pageSlug}`;
                    }
                }

                // Translate title via key lookup
                const key = m.title.toLowerCase().trim().replace(/[\s\-_]+/g, '_');
                const translatedName = t(key);

                return {
                    name: translatedName !== key ? translatedName : m.title,
                    href,
                    newTab: !!m.open_new_tab
                };
            })
        ] : defaultNavItems;

        return rawItems.filter(item => {
            if (seen.has(item.name)) return false;
            seen.add(item.name);
            return true;
        });
    })();

    const frontCmsLogo = (cmsSettings?.logo_url as string | undefined) 
        || ((cmsSettings?.header_footer_sections as Record<string, unknown> | undefined)?.ischool_logo as string | undefined) 
        || (cmsSettings?.logo as string | undefined);
    const logoSrc = frontCmsLogo || settings?.app_logo || settings?.admin_logo || settings?.admin_small_logo;
    const hfsRecord = (cmsSettings?.header_footer_sections as Record<string, unknown> | undefined);
    const ischoolHeaderBgEnabled = hfsRecord?.ischool_header_bg_enabled !== false && hfsRecord?.header_bg_enabled !== false;
    const ischoolHeaderBg = ischoolHeaderBgEnabled 
        ? ((hfsRecord?.ischool_header_bg as string | undefined) || "#044E43")
        : "#044E43";

    const isLightColor = (hex?: string) => {
        if (!hex) return false;
        const clean = hex.replace("#", "").trim();
        if (clean.length === 3) {
            const r = parseInt(clean[0] + clean[0], 16);
            const g = parseInt(clean[1] + clean[1], 16);
            const b = parseInt(clean[2] + clean[2], 16);
            return (0.299 * r + 0.587 * g + 0.114 * b) > 165;
        }
        if (clean.length === 6) {
            const r = parseInt(clean.substring(0, 2), 16);
            const g = parseInt(clean.substring(2, 4), 16);
            const b = parseInt(clean.substring(4, 6), 16);
            return (0.299 * r + 0.587 * g + 0.114 * b) > 165;
        }
        return false;
    };

    const topbarPhone = isMadrasha
        ? (hfsRecord?.madrasa_phone as string) || "+8801719606713"
        : (hfsRecord?.school_phone as string) || (settings?.phone as string) || "+8801851046320";
    const topbarEmail = isMadrasha
        ? (hfsRecord?.madrasa_email as string) || "anwarabegumgirlsmadrasa@gmail.com"
        : (hfsRecord?.school_email as string) || (settings?.email as string) || "smartideasbd24@gmail.com";
    const topbarAddress = isMadrasha
        ? (hfsRecord?.madrasa_address as string) || "১২ নং গিয়াসনগর ইউনিয়ন, মোহাম্মদপুর, মৌলভীবাজার সদর, মৌলভীবাজার"
        : (hfsRecord?.school_address as string) || (settings?.address as string) || "House#68, Road#10, Sector#10, Uttara Model Town, Dhaka-1230";
    const topbarEnabled = hfsRecord?.topbar_enabled !== false;
    const topbarBtnBg = (!ischoolHeaderBg || isLightColor(ischoolHeaderBg)) ? "#044E43" : ischoolHeaderBg;

    return (
        <header className="w-full flex flex-col z-50 sticky top-0 shadow-sm overflow-x-clip">
            {/* Top Bar */}
            {topbarEnabled && (
            <div className="bg-white border-b border-gray-200/80 py-2 sm:py-2 md:py-2.5 px-4 sm:px-6 md:px-8 text-xs font-medium text-slate-600">
                <div className="container mx-auto flex items-center justify-between gap-3 sm:gap-4 flex-nowrap">
                    {/* Desktop Contact Badges (Phone, Email, Address) */}
                    <div className="hidden md:flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 overflow-hidden py-0.5">
                        {/* Mobile Phone Pill */}
                        <a
                            href={`tel:${topbarPhone}`}
                            className="group/pill flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-slate-50 hover:bg-white border border-slate-200/90 hover:border-[#044E43]/40 shadow-xs hover:shadow-sm transition-all duration-200 shrink-0 cursor-pointer"
                            title={`Phone: ${topbarPhone}`}
                        >
                            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#044E43] to-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover/pill:scale-105 transition-transform duration-200">
                                <Phone className="h-3 w-3 stroke-[2.2px]" />
                            </span>
                            <span className="text-[11.5px] font-semibold text-slate-700 group-hover/pill:text-[#044E43] transition-colors tracking-tight">
                                {topbarPhone}
                            </span>
                        </a>

                        {/* Email Pill */}
                        <a
                            href={`mailto:${topbarEmail}`}
                            className="group/pill flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-slate-50 hover:bg-white border border-slate-200/90 hover:border-[#044E43]/40 shadow-xs hover:shadow-sm transition-all duration-200 shrink-0 max-w-[210px] md:max-w-[250px] cursor-pointer"
                            title={`Email: ${topbarEmail}`}
                        >
                            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#044E43] to-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover/pill:scale-105 transition-transform duration-200">
                                <Mail className="h-3 w-3 stroke-[2.2px]" />
                            </span>
                            <span className="text-[11.5px] font-semibold text-slate-700 group-hover/pill:text-[#044E43] transition-colors tracking-tight truncate">
                                {topbarEmail}
                            </span>
                        </a>

                        {/* Address Pill */}
                        <div
                            className="group/pill flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-slate-50 hover:bg-white border border-slate-200/90 hover:border-[#044E43]/40 shadow-xs hover:shadow-sm transition-all duration-200 shrink min-w-0 max-w-[260px] lg:max-w-[380px] xl:max-w-[480px]"
                            title={topbarAddress}
                        >
                            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#044E43] to-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover/pill:scale-105 transition-transform duration-200">
                                <MapPin className="h-3 w-3 stroke-[2.2px]" />
                            </span>
                            <MarqueeText
                                text={topbarAddress}
                                className="min-w-0 flex-1 text-[11.5px] font-semibold text-slate-700 group-hover/pill:text-[#044E43] transition-colors"
                            />
                        </div>
                    </div>

                    {/* Mobile Rotating Contact Pill (Cycles: Phone -> Email -> Address full marquee -> Phone...) */}
                    <MobileRotatingContact settings={settings} cmsSettings={cmsSettings} />

                    {/* Social Icons, Language Dropdown, Search & Login/Dashboard */}
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
                        {/* Circular Social Buttons */}
                        <div className="hidden sm:flex items-center gap-1.5 md:gap-2">
                            <a
                                href={settings?.facebook_url && settings.facebook_url !== '#' ? settings.facebook_url : "https://facebook.com/ischool"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gray-700 hover:border-[#044E43] hover:bg-[#044E43] text-slate-800 hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm"
                                title="Facebook"
                            >
                                <Facebook className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </a>
                            <a
                                href={settings?.twitter_url && settings.twitter_url !== '#' ? settings.twitter_url : "https://twitter.com/ischool"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gray-700 hover:border-[#044E43] hover:bg-[#044E43] text-slate-800 hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm"
                                title="Twitter"
                            >
                                <Twitter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </a>
                            <a
                                href={settings?.linkedin_url && settings.linkedin_url !== '#' ? settings.linkedin_url : "https://linkedin.com/company/ischool"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gray-700 hover:border-[#044E43] hover:bg-[#044E43] text-slate-800 hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm"
                                title="LinkedIn"
                            >
                                <Linkedin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </a>
                            {(settings?.instagram_url && settings.instagram_url !== '#') && (
                                <a
                                    href={settings.instagram_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gray-700 hover:border-[#044E43] hover:bg-[#044E43] text-slate-800 hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm"
                                    title="Instagram"
                                >
                                    <Instagram className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </a>
                            )}
                        </div>

                        {/* Functional Language Selector (English, Bangla) */}
                        <div className="relative hidden sm:block">
                            <select
                                value={currentLangCode}
                                onChange={(e) => handleLanguageChange(e.target.value)}
                                className="appearance-none bg-white border border-gray-300 rounded-full py-1 pl-3 pr-7 text-xs font-bold text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#044E43] shadow-sm hover:border-gray-400 transition-all"
                            >
                                {LANGUAGES.map((lang) => (
                                    <option key={lang.short_code} value={lang.short_code}>
                                        {lang.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="h-3.5 w-3.5 text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        {/* Search Trigger Button */}
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-gray-300 hover:border-[#044E43] hover:bg-[#044E43] text-[#044E43] hover:text-white flex items-center justify-center transition-all duration-300 shadow-2xs cursor-pointer group"
                            title={t("search")}
                        >
                            <Search className="h-3.5 w-3.5 stroke-[2.2px] group-hover:scale-110 transition-transform" />
                        </button>

                        {/* Login / Dashboard Button */}
                        {!mounted || !user ? (
                            <Link href="/login" className="group">
                                <div 
                                    className="hover:opacity-95 text-white font-bold text-xs pl-3.5 pr-1.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs hover:shadow transition-all duration-300 cursor-pointer"
                                    style={{ backgroundColor: topbarBtnBg }}
                                >
                                    <span>{t("login")}</span>
                                    <div className="w-5 h-5 rounded-full bg-[#FF9800] text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                                        <ArrowUpRight className="h-3 w-3 stroke-[2.5px]" />
                                    </div>
                                </div>
                            </Link>
                        ) : (
                            <Link href={getDashboardUrl()} className="group">
                                <div 
                                    className="hover:opacity-95 text-white font-bold text-xs pl-3.5 pr-1.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs hover:shadow transition-all duration-300 cursor-pointer"
                                    style={{ backgroundColor: topbarBtnBg }}
                                >
                                    <span>{t("dashboard")}</span>
                                    <div className="w-5 h-5 rounded-full bg-[#FF9800] text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                                        <LayoutGrid className="h-3 w-3 stroke-[2.5px]" />
                                    </div>
                                </div>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
            )}

            {/* Main Navigation */}
            <div className="bg-[#F4F6F5] w-full">
                <div className="container mx-auto px-0 sm:px-6 md:px-8 min-h-[44px] sm:min-h-[56px] md:min-h-[72px] flex items-stretch justify-between relative py-0">

                    {/* Logo with Curved Badge */}
                    <div className="relative flex items-stretch shrink-0 max-w-[75vw] sm:max-w-none self-stretch">
                        <div 
                            className="h-full py-1 sm:py-1.5 pl-3 pr-2 sm:px-5 md:px-6 flex items-center relative z-10 min-w-[95px] sm:min-w-[180px] md:min-w-[220px] lg:min-w-[250px] before:content-[''] before:absolute before:right-full before:top-0 before:bottom-0 before:w-[100vw] before:[background-color:inherit] transition-colors duration-200"
                            style={{ backgroundColor: ischoolHeaderBg }}
                        >
                            <Link href="/" className="flex items-center gap-1.5 sm:gap-2 text-white group relative z-10 py-0.5">
                                {logoSrc ? (
                                    <img
                                        src={getImageUrl(logoSrc)}
                                        alt={settings?.school_name || "School Logo"}
                                        className="h-auto w-auto object-contain transition-transform group-hover:scale-105 drop-shadow-sm"
                                        style={{
                                            height: (hfsRecord?.ischool_logo_height as number | undefined) 
                                                ? `${hfsRecord?.ischool_logo_height}px` 
                                                : undefined,
                                            maxHeight: (hfsRecord?.ischool_logo_height as number | undefined) 
                                                ? `${hfsRecord?.ischool_logo_height}px` 
                                                : undefined,
                                            width: (hfsRecord?.ischool_logo_auto_ratio === false && hfsRecord?.ischool_logo_width)
                                                ? `${hfsRecord?.ischool_logo_width}px`
                                                : 'auto',
                                            maxWidth: (hfsRecord?.ischool_logo_width as number | undefined) 
                                                ? `${hfsRecord?.ischool_logo_width}px` 
                                                : undefined,
                                        }}
                                    />
                                ) : (
                                    <>
                                        <div className="flex items-center justify-center p-1 sm:p-1.5 rounded-xl bg-white/10 text-white shrink-0">
                                            <GraduationCap className="h-4 w-4 sm:h-6 sm:w-6 transition-transform group-hover:scale-110" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-black text-xs sm:text-base md:text-xl tracking-tight leading-none text-white font-sans whitespace-nowrap">
                                                {settings?.school_name || "EduEx LMS"}
                                            </span>
                                            <span className="text-[6.5px] sm:text-[8.5px] font-semibold tracking-widest text-emerald-200 uppercase mt-0.5 whitespace-nowrap">
                                                {settings?.school_slogan || "Education & LMS"}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </Link>

                            {/* SVG Curved Shape Flange - Perfectly flush continuous curve */}
                            <div 
                                className="absolute left-[calc(100%-1px)] top-0 bottom-0 h-full w-6 sm:w-16 md:w-28 lg:w-32 xl:w-36 pointer-events-none transition-colors duration-200"
                                style={{ color: ischoolHeaderBg }}
                            >
                                <svg className="h-full w-full block" viewBox="0 0 160 100" fill="currentColor" preserveAspectRatio="none">
                                    <path d="M 0 0 C 45 0 70 25 85 50 C 100 75 120 100 160 100 L 0 100 Z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Menu */}
                    <nav className="hidden lg:flex items-center gap-1 xl:gap-2 ml-16 lg:ml-24 xl:ml-32">
                        {displayMenus.map((item, idx) => {
                            const isActive = item.href === '/' ? pathname === '/' : (!!item.href && item.href !== '#' && pathname.startsWith(item.href));
                            const gradId = `menu-beam-grad-d-${idx}`;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href || '/'}
                                    target={item.newTab ? "_blank" : "_self"}
                                    className={cn(
                                        "header-menu-link group relative inline-flex items-center px-3.5 py-2 text-sm font-semibold rounded-lg transition-all",
                                        isActive
                                            ? "text-[#044E43] font-bold bg-[#044E43]/10"
                                            : "text-slate-800 hover:text-[#044E43] bg-transparent hover:bg-white/80"
                                    )}
                                >
                                    {/* Small Outer Border SVG & Traveling Beam Animation (Left to Right round) */}
                                    <svg
                                        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible rounded-lg"
                                        aria-hidden="true"
                                    >
                                        <defs>
                                            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                                                {isMadrasha ? (
                                                    <>
                                                        <stop offset="0%" stopColor="#F59E0B" />
                                                        <stop offset="50%" stopColor="#10B981" />
                                                        <stop offset="100%" stopColor="#044E43" />
                                                    </>
                                                ) : (
                                                    <>
                                                        <stop offset="0%" stopColor="#FF9800" />
                                                        <stop offset="45%" stopColor="#10B981" />
                                                        <stop offset="100%" stopColor="#044E43" />
                                                    </>
                                                )}
                                            </linearGradient>
                                        </defs>
                                        {/* Outer subtle base border */}
                                        <rect
                                            x="0"
                                            y="0"
                                            width="100%"
                                            height="100%"
                                            rx="8"
                                            ry="8"
                                            fill="none"
                                            stroke={isActive ? "#044E43" : "#CBD5E1"}
                                            strokeWidth="1.5"
                                            strokeOpacity={isActive ? "0.35" : "0.5"}
                                            className="transition-all duration-300 group-hover:stroke-[#044E43] group-hover:stroke-opacity-40"
                                        />
                                        {/* Traveling glowing border beam: Left to Right Round Animation */}
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

                                    <span className="relative z-10 flex items-center">
                                        {(item.name === t("home") || item.name === "Home") && <House className="h-4 w-4 mr-1.5 text-[#044E43]" />}
                                        {item.name}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Mobile Menu Toggle */}
                    <div className="lg:hidden flex items-center pr-3 sm:pr-0">
                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 border border-gray-200 flex items-center justify-center text-slate-700 hover:bg-[#044E43] hover:text-white transition-all duration-300 shadow-sm"
                            aria-label="Toggle Menu"
                        >
                            {isMenuOpen ? <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Menu className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMenuOpen && (
                    <div className="lg:hidden border-t bg-white absolute w-full left-0 shadow-xl animate-in slide-in-from-top-2 z-50">
                        <div className="flex flex-col p-4 space-y-2">
                            {displayMenus.map((item, idx) => {
                                const isActive = item.href === '/' ? pathname === '/' : (!!item.href && item.href !== '#' && pathname.startsWith(item.href));
                                const gradId = `menu-beam-grad-m-${idx}`;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href || '/'}
                                        target={item.newTab ? "_blank" : "_self"}
                                        className={cn(
                                            "header-menu-link group relative flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all",
                                            isActive
                                                ? "text-[#044E43] bg-[#044E43]/10 font-bold"
                                                : "text-gray-700 hover:text-[#044E43] hover:bg-slate-50"
                                        )}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <svg
                                            className="absolute inset-0 w-full h-full pointer-events-none overflow-visible rounded-lg"
                                            aria-hidden="true"
                                        >
                                            <defs>
                                                <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#FF9800" />
                                                    <stop offset="45%" stopColor="#10B981" />
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
                                                stroke={isActive ? "#044E43" : "#E2E8F0"}
                                                strokeWidth="1.5"
                                                strokeOpacity={isActive ? "0.3" : "0.5"}
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
                                        <span className="relative z-10 flex items-center">
                                            {(item.name === t("home") || item.name === "Home") && <House className="h-4 w-4 mr-2 text-[#044E43]" />}
                                            {item.name}
                                        </span>
                                    </Link>
                                );
                            })}
                            <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                                <div className="flex items-center justify-between px-1 py-1">
                                    <span className="text-xs font-bold text-slate-600">Language / ভাষা:</span>
                                    <select
                                        value={currentLangCode}
                                        onChange={(e) => handleLanguageChange(e.target.value)}
                                        className="bg-slate-50 border border-gray-300 rounded-lg py-1 px-3 text-xs font-bold text-slate-800"
                                    >
                                        {LANGUAGES.map((lang) => (
                                            <option key={lang.short_code} value={lang.short_code}>
                                                {lang.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <Link
                                    href={!user ? "/login" : getDashboardUrl()}
                                    className="w-full py-2.5 px-4 bg-[#044E43] hover:bg-[#033b33] text-white font-bold text-sm rounded-lg flex items-center justify-between shadow-sm transition-all"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <span>{!user ? t("login") : t("dashboard")}</span>
                                    <ArrowUpRight className="h-4 w-4 text-[#FF9800]" />
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Search Modal */}
            <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <DialogContent className="sm:max-w-[500px] p-6 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <Search className="h-5 w-5 text-[#044E43]" />
                            {t("search_website")}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="mt-4 space-y-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={t("type_to_search")}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#044E43]"
                                autoFocus
                            />
                            <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => setIsSearchOpen(false)} className="rounded-xl text-xs">
                                {t("cancel")}
                            </Button>
                            <Button
                                className="bg-[#044E43] hover:bg-[#033b33] text-white rounded-xl text-xs px-5"
                                onClick={() => {
                                    if (searchQuery.trim()) {
                                        setIsSearchOpen(false);
                                        router.push(`/academics?search=${encodeURIComponent(searchQuery)}`);
                                    }
                                }}
                            >
                                {t("search")}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </header>
    );
}
