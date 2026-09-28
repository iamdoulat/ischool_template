"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

function subscribeScroll(callback: () => void) {
    if (typeof window === "undefined") return () => {};

    window.addEventListener("scroll", callback, { passive: true });
    return () => {
        window.removeEventListener("scroll", callback);
    };
}

function getScrollSnapshot(): boolean {
    if (typeof window === "undefined") return false;
    const windowScroll = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    return windowScroll > 200;
}

function getServerSnapshot(): boolean {
    return false;
}

export function ScrollToTop() {
    const pathname = usePathname();
    const isVisible = useSyncExternalStore(subscribeScroll, getScrollSnapshot, getServerSnapshot);

    // Only visible on website; hidden on admin and student portals
    const isPortal = Boolean(
        pathname?.startsWith("/dashboard") ||
        pathname?.startsWith("/user") ||
        pathname?.includes("/dashboard") ||
        pathname?.includes("/user")
    );

    if (isPortal) return null;

    const scrollToTop = () => {
        if (typeof window === "undefined") return;

        window.scrollTo({ top: 0, behavior: "smooth" });
        document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
        document.body.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <button
            type="button"
            onClick={scrollToTop}
            aria-label="Scroll to top"
            title="Click to top"
            className={cn(
                "fixed z-50 flex items-center justify-center rounded-full text-white cursor-pointer",
                "h-11 w-11 sm:h-12 sm:w-12",
                "bg-gradient-to-r from-[#FF9800] to-[#6366F1]",
                "shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50",
                "border border-white/20 active:scale-95 hover:scale-110",
                "transition-all duration-300 ease-out",
                "bottom-6 right-5 sm:bottom-8 sm:right-8",
                isVisible
                    ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                    : "opacity-0 translate-y-4 scale-75 pointer-events-none"
            )}
        >
            <ChevronUp className="h-6 w-6 stroke-[2.5]" />
        </button>
    );
}
