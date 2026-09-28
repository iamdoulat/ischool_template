"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

function subscribeScroll(callback: () => void) {
    if (typeof window === "undefined") return () => {};

    window.addEventListener("scroll", callback, { passive: true });
    const mainEl = document.querySelector("main");
    if (mainEl) {
        mainEl.addEventListener("scroll", callback, { passive: true });
    }
    const interval = setInterval(callback, 600);

    return () => {
        window.removeEventListener("scroll", callback);
        if (mainEl) {
            mainEl.removeEventListener("scroll", callback);
        }
        clearInterval(interval);
    };
}

function getScrollSnapshot(): boolean {
    if (typeof window === "undefined") return false;
    const windowScroll = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const mainEl = document.querySelector("main");
    const mainScroll = mainEl ? mainEl.scrollTop : 0;
    return windowScroll > 200 || mainScroll > 200;
}

function getServerSnapshot(): boolean {
    return false;
}

export function ScrollToTop() {
    const pathname = usePathname();
    const isVisible = useSyncExternalStore(subscribeScroll, getScrollSnapshot, getServerSnapshot);

    const scrollToTop = () => {
        if (typeof window === "undefined") return;

        window.scrollTo({ top: 0, behavior: "smooth" });
        document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
        document.body.scrollTo({ top: 0, behavior: "smooth" });

        const mainEl = document.querySelector("main");
        if (mainEl) {
            mainEl.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const isPortal = pathname?.startsWith("/dashboard") || pathname?.startsWith("/user");

    return (
        <button
            type="button"
            onClick={scrollToTop}
            aria-label="Scroll to top"
            title="Click to top"
            className={cn(
                "fixed z-40 flex items-center justify-center rounded-full text-white cursor-pointer",
                "h-10 w-10 sm:h-11 sm:w-11",
                "bg-gradient-to-r from-[#FF9800] to-[#6366F1]",
                "shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40",
                "border border-white/20 active:scale-95 hover:scale-110",
                "transition-all duration-300 ease-out",
                // Elevated on mobile for portals so it does not overlap mobile bottom navbar
                isPortal
                    ? "bottom-20 right-3.5 sm:bottom-22 sm:right-4 md:bottom-6 md:right-6"
                    : "bottom-5 right-3.5 sm:bottom-6 sm:right-6",
                isVisible
                    ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                    : "opacity-0 translate-y-4 scale-75 pointer-events-none"
            )}
        >
            <ChevronUp className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2.5]" />
        </button>
    );
}
