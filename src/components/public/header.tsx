"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Phone,
    Mail,
    Facebook,
    Twitter,
    Instagram,
    Youtube,
    Linkedin,
    LogIn,
    GraduationCap,
    Menu,
    X,
    House
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/components/providers/settings-provider";
import { useImageUrl } from "@/lib/image-url";
import { getPublicMenus, type PublicMenuItem as MenuItem } from "@/lib/public-menus";

interface NavItem {
    name: string;
    href: string;
    newTab?: boolean;
}

export function PublicHeader() {
    const { settings } = useSettings();
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [dynamicMenus, setDynamicMenus] = useState<MenuItem[]>([]);
    const getImageUrl = useImageUrl();

    useEffect(() => {
        let active = true;
        getPublicMenus().then((menus) => {
            if (active) setDynamicMenus(menus.filter((m) => m.type === "main"));
        });
        return () => { active = false; };
    }, []);

    const defaultNavItems = [
        { name: "Home", href: "/" },
        { name: "Academics", href: "/academics" },
        { name: "Admissions", href: "/online_admission" },
        { name: "Exam Results", href: "/exam-results" },
        { name: "Notices", href: "/notices" },
        { name: "Contact Us", href: "/contact-us" },
    ];

    const displayMenus: NavItem[] = (() => {
        const seen = new Set<string>();
        const items: NavItem[] = dynamicMenus.length > 0 ? [
            { name: "Home", href: "/" },
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

                    return {
                        name: m.title,
                        href,
                        newTab: !!m.open_new_tab
                    };
                })
        ] : defaultNavItems;

        // Deduplicate by name to avoid React duplicate-key warnings
        return items.filter(item => {
            if (seen.has(item.name)) return false;
            seen.add(item.name);
            return true;
        });
    })();

    return (
        <header className="w-full flex flex-col z-50 sticky top-0 bg-white shadow-md">
            {/* Top Bar */}
            <div className="bg-primary text-primary-foreground py-2 px-4 md:px-8 text-xs md:text-sm transition-all duration-300">
                <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
                    <div className="flex items-center gap-4">
                        {settings?.phone && (
                            <a href={`tel:${settings.phone}`} className="flex items-center gap-1 hover:opacity-80 transition-opacity">
                                <Phone className="h-3 w-3 md:h-4 md:w-4" />
                                <span>{settings.phone}</span>
                            </a>
                        )}
                        {settings?.email && (
                            <a href={`mailto:${settings.email}`} className="flex items-center gap-1 hover:opacity-80 transition-opacity">
                                <Mail className="h-3 w-3 md:h-4 md:w-4" />
                                <span>{settings.email}</span>
                            </a>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            {settings?.facebook_url && (
                                <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity"><Facebook className="h-3 w-3 md:h-4 md:w-4" /></a>
                            )}
                            {settings?.twitter_url && (
                                <a href={settings.twitter_url} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity"><Twitter className="h-3 w-3 md:h-4 md:w-4" /></a>
                            )}
                            {settings?.instagram_url && (
                                <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity"><Instagram className="h-3 w-3 md:h-4 md:w-4" /></a>
                            )}
                            {settings?.youtube_url && (
                                <a href={settings.youtube_url} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity"><Youtube className="h-3 w-3 md:h-4 md:w-4" /></a>
                            )}
                            {settings?.linkedin_url && (
                                <a href={settings.linkedin_url} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity"><Linkedin className="h-3 w-3 md:h-4 md:w-4" /></a>
                            )}
                        </div>
                        <div className="w-px h-4 bg-primary-foreground/30 hidden md:block" />
                        <Link href="/login">
                            <Button variant="secondary" size="sm" className="h-7 px-3 text-xs bg-white text-primary hover:bg-white/90">
                                <LogIn className="h-3 w-3 mr-1" />
                                Login
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Navigation */}
            <div className="bg-white border-b sticky top-0 shadow-sm">
                <div className="container mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 text-primary group">
                        {settings?.app_logo ? (
                            <img
                                src={getImageUrl(settings.app_logo)}
                                alt={settings.school_name || "School Logo"}
                                className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-105"
                            />
                        ) : (
                            <>
                                <div className="flex items-center justify-center">
                                    <GraduationCap className="h-8 w-8 md:h-10 md:w-10 transition-transform group-hover:scale-110" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-extrabold text-xl md:text-2xl tracking-tight uppercase leading-none text-slate-900 group-hover:text-primary transition-colors">
                                        {settings?.school_name || "iSchool"}
                                    </span>
                                    <span className="text-[10px] md:text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                                        {settings?.school_slogan || "Excellence in Education"}
                                    </span>
                                </div>
                            </>
                        )}
                    </Link>

                    {/* Desktop Menu */}
                    <nav className="hidden md:flex items-center gap-1">
                        {displayMenus.map((item) => {
                            const isActive = item.href === '/' ? pathname === '/' : (!!item.href && item.href !== '#' && pathname.startsWith(item.href));
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href || '#'}
                                    target={item.newTab ? "_blank" : "_self"}
                                    className={cn(
                                        "px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center",
                                        isActive
                                            ? "text-primary bg-primary/10 font-bold"
                                            : "text-gray-700 hover:text-[#FF9800] hover:bg-orange-50"
                                    )}
                                >
                                    {item.name === "Home" && <House className="h-4 w-4 mr-1" />}
                                    {item.name}
                                </Link>
                            );
                        })}
                        <Button asChild className="ml-4 font-semibold">
                            <Link href="/online_admission">Apply Now</Link>
                        </Button>
                    </nav>

                    {/* Mobile Menu Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </Button>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMenuOpen && (
                    <div className="md:hidden border-t bg-white absolute w-full left-0 shadow-lg animate-in slide-in-from-top-2">
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
                                                ? "text-primary bg-primary/10 font-bold"
                                                : "text-gray-700 hover:text-[#FF9800] hover:bg-orange-50"
                                        )}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {item.name === "Home" && <House className="h-4 w-4 mr-1" />}
                                        {item.name}
                                    </Link>
                                );
                            })}
                            <div className="pt-2">
                                <Button asChild className="w-full">
                                    <Link href="/online_admission">Apply Now</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
