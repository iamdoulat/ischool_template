"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useState, useEffect } from "react";
import { useSettings } from "@/components/providers/settings-provider";
import { LanguageProvider } from "@/components/providers/language-provider";
import { CurrencyProvider } from "@/components/providers/currency-provider";
import { useTranslation } from "@/hooks/use-translation";

import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { PageGuard } from "@/components/auth/page-guard";
import { getPageTitleFromPathname, formatDocumentTitle } from "@/lib/page-title";
import { MobileNavbar } from "@/components/layout/mobile-navbar";

function DashboardLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { settings, loading } = useSettings();
    const { setTheme } = useTheme();
    const { t } = useTranslation();

    // Set PWA Manifest start_url to Admin Portal
    useEffect(() => {
        if (typeof window !== 'undefined') {
            let manifestLink = document.querySelector<HTMLLinkElement>("link[rel='manifest']");
            if (!manifestLink) {
                manifestLink = document.createElement("link");
                manifestLink.rel = "manifest";
                document.head.appendChild(manifestLink);
            }
            manifestLink.href = "/manifest.json?portal=admin";
        }
    }, []);

    // Set page title and sync theme settings
    useEffect(() => {
        if (!loading && settings) {
            // Set Page Title
            const schoolName = settings.school_name || "iSchool";
            document.title = formatDocumentTitle(window.location.pathname, schoolName, t);

            // Sync Theme Mode only if no user local preference exists
            const savedTheme = typeof window !== 'undefined' ? localStorage.getItem("theme") : null;
            if (!savedTheme && settings.theme_mode) {
                setTheme(settings.theme_mode.toLowerCase());
            }

            // Sync Primary Color (ensuring it is always a valid solid color, not gradient or white)
            if (settings.primary_color) {
                let validColor = settings.primary_color.trim();
                if (validColor.startsWith('linear-gradient') || validColor.startsWith('radial-gradient')) {
                    const hexMatch = validColor.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/);
                    validColor = hexMatch ? hexMatch[0] : '#6366f1';
                }
                if (validColor.toLowerCase() === '#fff' || validColor.toLowerCase() === '#ffffff' || validColor.toLowerCase() === 'white') {
                    validColor = '#6366f1';
                }
                document.documentElement.style.setProperty('--primary', validColor);
            }

            // Initialize Sidebar State from settings
            if (settings.side_menu) {
                setSidebarCollapsed(settings.side_menu === 'collapsed');
            }
        }

        // Prevent body/html scrolling for dashboard
        document.documentElement.style.overflow = 'hidden';
        document.documentElement.style.height = '100%';
        document.body.style.overflow = 'hidden';
        document.body.style.height = '100%';

        return () => {
            document.documentElement.style.overflow = '';
            document.documentElement.style.height = '';
            document.body.style.overflow = '';
            document.body.style.height = '';
        };
    }, [settings, loading, setTheme]);

    const toggleSidebar = () => {
        if (window.innerWidth < 768) {
            setIsMobileOpen(!isMobileOpen);
        } else {
            setSidebarCollapsed(!sidebarCollapsed);
        }
    };

    return (
        <div className={cn(
            "fixed inset-0 flex h-screen w-screen overflow-hidden bg-background text-foreground",
            settings?.skins === 'bordered' ? "skin-bordered" : "skin-shadow"
        )}>
            <Sidebar
                collapsed={sidebarCollapsed}
                mobileOpen={isMobileOpen}
                onClose={() => setIsMobileOpen(false)}
            />
            <div className="flex flex-col flex-1 h-screen min-h-0 overflow-hidden shadow-2xl relative">
                <Header onToggleSidebar={toggleSidebar} sidebarCollapsed={sidebarCollapsed} />
                <main className={cn(
                    "flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-8 pt-4 md:pt-6 lg:pt-8 pb-24 md:pb-8 w-full max-w-full min-w-0",
                    settings?.box_content === 'compact' ? "max-w-[1400px] mx-auto w-full" : "w-full"
                )}>
                    <PageGuard>{children}</PageGuard>
                </main>
                <footer className="hidden md:flex h-14 flex-shrink-0 border-t bg-background items-center justify-between px-4 md:px-8 z-20 w-full max-w-full">
                    <div className="flex items-center gap-4 hidden md:flex">
                        <p className="text-[12px] text-muted-foreground/60 font-medium">
                            {t("version_x", { version: settings?.app_version || "1.0.0" })}
                        </p>
                    </div>
                    <p className="text-[12px] text-muted-foreground font-medium">
                        © 2026 {loading ? t("loading") : (settings?.school_name || t("smart_school"))}. {t("all_rights_reserved")}
                    </p>
                </footer>
                <MobileNavbar portalType="admin" />
            </div>
        </div>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <LanguageProvider>
            <CurrencyProvider>
                <DashboardLayoutContent>
                    {children}
                </DashboardLayoutContent>
            </CurrencyProvider>
        </LanguageProvider>
    );
}
