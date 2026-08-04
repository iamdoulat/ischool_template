"use client";

import { UserSidebar } from "@/components/layout/user-sidebar";
import { Header } from "@/components/layout/header";
import { useState, useEffect } from "react";
import { useSettings } from "@/components/providers/settings-provider";
import { LanguageProvider } from "@/components/providers/language-provider";
import { CurrencyProvider } from "@/components/providers/currency-provider";
import { useTranslation } from "@/hooks/use-translation";

import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { PageGuard } from "@/components/auth/page-guard";
import { getPageTitleFromPathname } from "@/lib/page-title";

import { MobileNavbar } from "@/components/layout/mobile-navbar";

function UserLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { settings, loading } = useSettings();
    const { setTheme } = useTheme();
    const { t } = useTranslation();

    // Set page title and sync theme settings
    useEffect(() => {
        if (!loading && settings) {
            // Set Page Title
            const schoolName = settings.school_name || "iSchool";
            const pageName = getPageTitleFromPathname(window.location.pathname, t);
            document.title = `${pageName} || ${schoolName}`;

            // Sync Theme Mode only if no user local preference exists
            const savedTheme = typeof window !== 'undefined' ? localStorage.getItem("theme") : null;
            if (!savedTheme && settings.theme_mode) {
                setTheme(settings.theme_mode.toLowerCase());
            }

            // Sync Primary Color
            if (settings.primary_color) {
                document.documentElement.style.setProperty('--primary', settings.primary_color);
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
            <UserSidebar
                collapsed={sidebarCollapsed}
                mobileOpen={isMobileOpen}
                onClose={() => setIsMobileOpen(false)}
            />
            <div className="flex flex-col flex-1 h-screen min-h-0 overflow-hidden shadow-2xl relative">
                <Header onToggleSidebar={toggleSidebar} />
                <main className={cn(
                    "flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-8 pt-4 md:pt-6 lg:pt-8 pb-24 md:pb-8 w-full max-w-full min-w-0",
                    settings?.box_content === 'compact' ? "max-w-[1400px] mx-auto w-full" : "w-full"
                )}>
                    <PageGuard>{children}</PageGuard>
                </main>
                <footer className="hidden md:flex h-14 flex-shrink-0 border-t bg-background items-center justify-between px-4 md:px-8 z-20 w-full max-w-full">
                    <div className="flex items-center gap-4 hidden md:flex">
                        <p className="text-[12px] text-muted-foreground/60 font-medium">
                            Version {settings?.app_version || "1.0.0"}
                        </p>
                    </div>
                    <p className="text-[12px] text-muted-foreground font-medium">
                        © 2026 {loading ? "" : (settings?.school_name || "iSchool")}. {t("all_rights_reserved")}
                    </p>
                </footer>
                <MobileNavbar portalType="user" />
            </div>
        </div>
    );
}

export default function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <LanguageProvider>
            <CurrencyProvider>
                <UserLayoutContent>
                    {children}
                </UserLayoutContent>
            </CurrencyProvider>
        </LanguageProvider>
    );
}
