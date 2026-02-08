"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ThemeProvider } from "next-themes";
import { useState, useEffect } from "react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Set dashboard page title
    useEffect(() => {
        document.title = "Smart School - iSchool";
    }, []);

    const toggleSidebar = () => {
        if (window.innerWidth < 768) {
            setIsMobileOpen(!isMobileOpen);
        } else {
            setSidebarCollapsed(!sidebarCollapsed);
        }
    };

    return (
        <ThemeProvider attribute="class" defaultTheme="light">
            <div className="flex h-screen overflow-hidden bg-background">
                <Sidebar
                    collapsed={sidebarCollapsed}
                    mobileOpen={isMobileOpen}
                    onClose={() => setIsMobileOpen(false)}
                />
                <div className="flex shadow-2xl flex-col flex-1 overflow-hidden">
                    <Header onToggleSidebar={toggleSidebar} />
                    <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                        {children}
                    </main>
                    <footer className="border-t bg-card h-14 min-h-[56px] flex items-center justify-end px-4 md:px-8">
                        <p className="text-[15px] text-muted-foreground">© 2026 Smart School. All rights reserved.</p>
                    </footer>
                </div>
            </div>
        </ThemeProvider>
    );
}
