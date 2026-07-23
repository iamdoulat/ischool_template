"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/components/providers/settings-provider";
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

export function PublicHeader() {
    const { settings } = useSettings();
    const pathname = usePathname();
    const { t } = useTranslation();
    const { selectedLanguage, setSelectedLanguage } = useLanguage();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [dynamicMenus, setDynamicMenus] = useState<MenuItem[]>([]);
    const getImageUrl = useImageUrl();
    const [mounted, setMounted] = useState(false);
    const [user, setUser] = useState<HeaderUser | null>(null);

    const currentLangCode = selectedLanguage?.short_code || "en";

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
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) {
                setMounted(true);
                return;
            }
            try {
                const response = await api.get("/profile", { skipGlobalErrorHandler: true });
                if (response.data?.success) {
                    setUser(response.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch profile in public header:", error);
            } finally {
                setMounted(true);
            }
        };
        checkAuth();
    }, []);

    const getDashboardUrl = () => {
        if (!user) return "/login";
        const role = (user.role || "").toLowerCase();
        if (role === "student" || role === "parent") {
            return "/user/dashboard";
        }
        return "/dashboard";
    };

    const defaultNavItems = [
        { name: t("home"), href: "/" },
        { name: t("academics"), href: "/academics" },
        { name: t("admissions"), href: "/online_admission" },
        { name: t("exam_results"), href: "/exam-results" },
        { name: t("notices"), href: "/notices" },
        { name: t("about_us"), href: "/academics" },
        { name: t("contact"), href: "/contact-us" },
    ];

    const displayMenus: NavItem[] = (() => {
        const seen = new Set<string>();
        const items: NavItem[] = dynamicMenus.length > 0 ? [
            { name: t("home"), href: "/" },
            ...dynamicMenus
                .filter(m => m.title.toLowerCase() !== 'home')
                .map(m => {
                    let href = '';
                    if (!!m.is_external) {
                        href = m.url || '';
                    } else {
                        const pageSlug = m.page === 'home' ? '' : (m.page === 'admission' ? 'online_admission' : (m.page || ''));
                        href = pageSlug.startsWith('/') ? pageSlug : `/${pageSlug}`;
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

        return items.filter(item => {
            if (seen.has(item.name)) return false;
            seen.add(item.name);
            return true;
        });
    })();

    const logoSrc = settings?.app_logo || settings?.admin_logo || settings?.admin_small_logo;

    return (
        <header className="w-full flex flex-col z-50 sticky top-0 bg-white shadow-sm overflow-x-clip">
            {/* Top Bar */}
            <div className="bg-white border-b border-gray-200/80 py-2 px-4 md:px-8 text-xs font-medium text-slate-600 transition-all duration-300">
                <div className="container mx-auto flex flex-wrap justify-between items-center gap-3">
                    {/* Contact Information */}
                    <div className="flex items-center gap-4 flex-wrap">
                        <a href={`tel:${settings?.phone || "+1 (800) 555-1234"}`} className="flex items-center gap-1.5 hover:text-[#044E43] transition-colors">
                            <Phone className="h-3.5 w-3.5 text-[#044E43]" />
                            <span>{settings?.phone || "+1 (800) 555-1234"}</span>
                        </a>
                        <div className="w-px h-3.5 bg-gray-300 hidden sm:block" />
                        <a href={`mailto:${settings?.email || "hello@eduex.com"}`} className="flex items-center gap-1.5 hover:text-[#044E43] transition-colors">
                            <Mail className="h-3.5 w-3.5 text-[#044E43]" />
                            <span>{settings?.email || "hello@eduex.com"}</span>
                        </a>
                        <div className="w-px h-3.5 bg-gray-300 hidden md:block" />
                        <div className="hidden lg:flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-[#044E43]" />
                            <span>{settings?.address || "371 7th Ave, New York, NY 10001"}</span>
                        </div>
                    </div>

                    {/* Social Icons, Language Dropdown, Search & Login/Dashboard */}
                    <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                        {/* Circular Social Buttons */}
                        <div className="flex items-center gap-2">
                            <a
                                href={settings?.facebook_url || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gray-700 hover:border-[#044E43] hover:bg-[#044E43] text-slate-800 hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm"
                                title="Facebook"
                            >
                                <Facebook className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </a>
                            <a
                                href={settings?.twitter_url || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gray-700 hover:border-[#044E43] hover:bg-[#044E43] text-slate-800 hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm"
                                title="Twitter"
                            >
                                <Twitter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </a>
                            <a
                                href={settings?.linkedin_url || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gray-700 hover:border-[#044E43] hover:bg-[#044E43] text-slate-800 hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm"
                                title="LinkedIn"
                            >
                                <Linkedin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </a>
                            {settings?.instagram_url && (
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
                        <div className="relative">
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
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 border border-gray-200 flex items-center justify-center text-slate-700 hover:bg-[#044E43] hover:text-white transition-all duration-300 shadow-sm"
                            title={t("search")}
                        >
                            <Search className="h-3.5 w-3.5" />
                        </button>

                        {/* Login / Dashboard Button */}
                        {!mounted || !user ? (
                            <Link href="/login" className="group">
                                <div className="bg-[#044E43] hover:bg-[#033b33] text-white font-bold text-xs pl-3 pr-1 py-1 rounded-full flex items-center gap-1.5 shadow-sm transition-all duration-300">
                                    <span>{t("login")}</span>
                                    <div className="w-5 h-5 rounded-full bg-[#FF9800] text-white flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                        <ArrowUpRight className="h-3 w-3" />
                                    </div>
                                </div>
                            </Link>
                        ) : (
                            <Link href={getDashboardUrl()} className="group">
                                <div className="bg-[#044E43] hover:bg-[#033b33] text-white font-bold text-xs pl-3 pr-1 py-1 rounded-full flex items-center gap-1.5 shadow-sm transition-all duration-300">
                                    <span>{t("dashboard")}</span>
                                    <div className="w-5 h-5 rounded-full bg-[#FF9800] text-white flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                        <LayoutGrid className="h-3 w-3" />
                                    </div>
                                </div>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Navigation */}
            <div className="bg-[#F4F6F5] border-b border-gray-200/60 sticky top-0 shadow-sm z-40">
                <div className="container mx-auto px-4 md:px-8 h-20 flex items-center justify-between relative">

                    {/* Logo with Curved Dark Teal Badge */}
                    <div className="relative flex items-center h-full shrink-0">
                        <div className="bg-[#044E43] h-full px-4 sm:px-5 md:px-6 flex items-center relative z-10 shadow-sm min-w-[160px] sm:min-w-[190px] md:min-w-[220px] lg:min-w-[250px] before:content-[''] before:absolute before:right-full before:top-0 before:bottom-0 before:w-[100vw] before:bg-[#044E43]">
                            <Link href="/" className="flex items-center gap-2.5 text-white group relative z-10 py-1">
                                {logoSrc ? (
                                    <img
                                        src={getImageUrl(logoSrc)}
                                        alt={settings?.school_name || "School Logo"}
                                        className="h-10 sm:h-11 md:h-12 lg:h-13 w-auto max-w-[170px] sm:max-w-[200px] md:max-w-[230px] lg:max-w-[260px] object-contain transition-transform group-hover:scale-105 drop-shadow-sm"
                                    />
                                ) : (
                                    <>
                                        <div className="flex items-center justify-center p-1.5 rounded-xl bg-white/10 text-white shrink-0">
                                            <GraduationCap className="h-6 w-6 sm:h-7 sm:w-7 transition-transform group-hover:scale-110" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-black text-base sm:text-lg md:text-xl tracking-tight leading-none text-white font-sans whitespace-nowrap">
                                                {settings?.school_name || "EduEx LMS"}
                                            </span>
                                            <span className="text-[8px] sm:text-[9px] font-semibold tracking-widest text-emerald-200 uppercase mt-0.5 whitespace-nowrap">
                                                {settings?.school_slogan || "Education & LMS"}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </Link>

                            {/* SVG Curved Shape Flange - Extra Sweeping Curve */}
                            <div className="absolute left-full top-0 h-full w-16 sm:w-24 md:w-28 lg:w-32 xl:w-36 text-[#044E43] pointer-events-none">
                                <svg className="h-full w-full" viewBox="0 0 160 100" fill="currentColor" preserveAspectRatio="none">
                                    <path d="M 0 0 C 45 0 70 25 85 50 C 100 75 120 100 160 100 L 0 100 Z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Menu */}
                    <nav className="hidden lg:flex items-center gap-1 xl:gap-2 ml-16 lg:ml-24 xl:ml-32">
                        {displayMenus.map((item) => {
                            const isActive = item.href === '/' ? pathname === '/' : (!!item.href && item.href !== '#' && pathname.startsWith(item.href));
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href || '#'}
                                    target={item.newTab ? "_blank" : "_self"}
                                    className={cn(
                                        "px-3.5 py-2 text-sm font-semibold rounded-md transition-all flex items-center",
                                        isActive
                                            ? "text-[#044E43] font-bold bg-[#044E43]/10"
                                            : "text-slate-800 hover:text-[#044E43] hover:bg-white/80"
                                    )}
                                >
                                    {(item.name === t("home") || item.name === "Home") && <House className="h-4 w-4 mr-1.5 text-[#044E43]" />}
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Mobile Menu Toggle */}
                    <div className="lg:hidden flex items-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-800"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </Button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMenuOpen && (
                    <div className="lg:hidden border-t bg-white absolute w-full left-0 shadow-xl animate-in slide-in-from-top-2 z-50">
                        <div className="flex flex-col p-4 space-y-2">
                            {displayMenus.map((item) => {
                                const isActive = item.href === '/' ? pathname === '/' : (!!item.href && item.href !== '#' && pathname.startsWith(item.href));
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href || '#'}
                                        target={item.newTab ? "_blank" : "_self"}
                                        className={cn(
                                            "px-4 py-3 text-sm font-medium rounded-lg flex items-center",
                                            isActive
                                                ? "text-[#044E43] bg-[#044E43]/10 font-bold"
                                                : "text-gray-700 hover:text-[#044E43] hover:bg-slate-50"
                                        )}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {(item.name === t("home") || item.name === "Home") && <House className="h-4 w-4 mr-2 text-[#044E43]" />}
                                        {item.name}
                                    </Link>
                                );
                            })}
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
                                        window.location.href = `/academics?search=${encodeURIComponent(searchQuery)}`;
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
