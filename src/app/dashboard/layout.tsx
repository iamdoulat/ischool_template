"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useState, useEffect } from "react";
import { useSettings } from "@/components/providers/settings-provider";
import { LanguageProvider } from "@/components/providers/language-provider";
import { CurrencyProvider } from "@/components/providers/currency-provider";

import { useTheme, ThemeProvider } from "next-themes";
import { cn } from "@/lib/utils";

function DashboardLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { settings, loading } = useSettings();
    const { setTheme } = useTheme();

    // Set dashboard page title and sync theme settings
    useEffect(() => {
        if (!loading && settings) {
            // Set Page Title
            const schoolName = settings.school_name || "Smart School";
            document.title = `${schoolName} - iSchool`;

            // Sync Theme Mode
            if (settings.theme_mode) {
                setTheme(settings.theme_mode);
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
            "fixed inset-0 flex h-screen w-screen overflow-hidden bg-background",
            settings?.skins === 'bordered' ? "skin-bordered" : "skin-shadow"
        )}>
            <Sidebar
                collapsed={sidebarCollapsed}
                mobileOpen={isMobileOpen}
                onClose={() => setIsMobileOpen(false)}
            />
            <div className="flex flex-col flex-1 w-full h-full min-h-0 overflow-hidden shadow-2xl relative">
                <Header onToggleSidebar={toggleSidebar} />
                <main className={cn(
                    "flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8",
                    settings?.box_content === 'compact' ? "max-w-[1400px] mx-auto w-full" : "w-full"
                )}>
                    {children}
                </main>
                <footer className="border-t bg-card h-14 min-h-[56px] flex items-center justify-between px-4 md:px-8 z-20">
                    <div className="flex items-center gap-4 hidden md:flex">
                        <p className="text-[12px] text-muted-foreground/60 font-medium">
                            Version 5.1.0
                        </p>
                    </div>
                    <p className="text-[15px] text-muted-foreground">
                        © 2026 {loading ? "" : (settings?.school_name || "Smart School")}. All rights reserved.
                    </p>
                </footer>
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
        <ThemeProvider attribute="class" defaultTheme="light">
            <LanguageProvider>
                <CurrencyProvider>
                    <DashboardLayoutContent>
                        {children}
                    </DashboardLayoutContent>
                </CurrencyProvider>
            </LanguageProvider>
        </ThemeProvider>
    );
}
