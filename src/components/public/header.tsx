"use client";

import Link from "next/link";
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
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/components/providers/settings-provider";
import api from "@/lib/api";

interface MenuItem {
    id: number;
    title: string;
    is_external: boolean;
    open_new_tab: boolean;
    url?: string;
    page?: string;
    type: string;
    parent_id?: number | null;
    order: number;
    sub_items?: MenuItem[];
}

export function PublicHeader() {
    const { settings } = useSettings();
    console.log("PublicHeader Settings:", settings);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [dynamicMenus, setDynamicMenus] = useState<MenuItem[]>([]);
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

    useEffect(() => {
        const fetchMenus = async () => {
            try {
                const res = await api.get("front-cms/menus");
                if (res.data?.status === "Success") {
                    // Filter main menu items
                    const mainMenus = res.data.data.filter((m: MenuItem) => m.type === "main");
                    setDynamicMenus(mainMenus);
                }
            } catch (error) {
                console.error("Failed to fetch menus", error);
            }
        };
        fetchMenus();
    }, []);

    const defaultNavItems = [
        { name: "Home", href: `${frontendUrl}/` },
        { name: "Academics", href: "#" },
        { name: "Admissions", href: `${frontendUrl}/online_admission` },
        { name: "Exam Results", href: `${frontendUrl}/exam-results` },
        { name: "Notices", href: `${frontendUrl}/notices` },
        { name: "About Us", href: `${frontendUrl}/about-us` },
        { name: "Contact", href: `${frontendUrl}/contact-us` },
    ];

    const displayMenus = dynamicMenus.length > 0 ? dynamicMenus.map(m => {
        const cleanBase = frontendUrl.replace(/\/$/, '');
        let path = '';
        if (!!m.is_external) {
            path = m.url || '';
        } else {
            const pageSlug = m.page === 'home' ? '' : (m.page === 'admission' ? 'online_admission' : (m.page || ''));
            path = pageSlug.startsWith('/') ? pageSlug : `/${pageSlug}`;
        }
        
        return {
            name: m.title,
            href: !!m.is_external ? path : `${cleanBase}${path}`,
            newTab: !!m.open_new_tab
        };
    }) : defaultNavItems;

    return (
        <header className="w-full flex flex-col z-50 sticky top-0 bg-white shadow-md">
            {/* Top Bar */}
            <div className="bg-primary text-primary-foreground py-2 px-4 md:px-8 text-xs md:text-sm transition-all duration-300">
                <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
                    <div className="flex items-center gap-4">
                        <a href="tel:+1234567890" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
                            <Phone className="h-3 w-3 md:h-4 md:w-4" />
                            <span>+1 234 567 8900</span>
                        </a>
                        <a href="mailto:info@smartschool.com.bd" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
                            <Mail className="h-3 w-3 md:h-4 md:w-4" />
                            <span>info@smartschool.com.bd</span>
                        </a>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <a href="#" className="hover:opacity-80 transition-opacity"><Facebook className="h-3 w-3 md:h-4 md:w-4" /></a>
                            <a href="#" className="hover:opacity-80 transition-opacity"><Twitter className="h-3 w-3 md:h-4 md:w-4" /></a>
                            <a href="#" className="hover:opacity-80 transition-opacity"><Instagram className="h-3 w-3 md:h-4 md:w-4" /></a>
                            <a href="#" className="hover:opacity-80 transition-opacity"><Youtube className="h-3 w-3 md:h-4 md:w-4" /></a>
                            <a href="#" className="hover:opacity-80 transition-opacity"><Linkedin className="h-3 w-3 md:h-4 md:w-4" /></a>
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
                                src={settings.app_logo}
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
                        {displayMenus.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href || '#'}
                                target={(item as any).newTab ? "_blank" : "_self"}
                                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-primary hover:bg-primary/5 rounded-md transition-all"
                            >
                                {item.name}
                            </Link>
                        ))}
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
                            {displayMenus.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href || '#'}
                                    target={(item as any).newTab ? "_blank" : "_self"}
                                    className="px-4 py-3 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {item.name}
                                </Link>
                            ))}
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
