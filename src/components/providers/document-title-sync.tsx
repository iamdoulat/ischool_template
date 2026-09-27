"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSettings } from "@/components/providers/settings-provider";
import { useTranslation } from "@/hooks/use-translation";
import { getPageTitleFromPathname, formatDocumentTitle } from "@/lib/page-title";
import { getImageUrl } from "@/lib/image-url";

export function DocumentTitleSync() {
    const pathname = usePathname();
    const { settings, loading } = useSettings();
    const { t } = useTranslation();

    useEffect(() => {
        const schoolName = settings?.school_name || "iSchool";
        document.title = formatDocumentTitle(pathname, schoolName, t);

        if (typeof window !== "undefined") {
            const localFavicon = localStorage.getItem("ischool_favicon");
            const rawFavicon = settings?.favicon || localFavicon;
            if (rawFavicon) {
                const resolvedFaviconUrl = getImageUrl(rawFavicon);
                if (resolvedFaviconUrl) {
                    const cacheBusted = `${resolvedFaviconUrl}${resolvedFaviconUrl.includes('?') ? '&' : '?'}v=${Date.now()}`;
                    const existing = document.querySelectorAll<HTMLLinkElement>(
                        "link[rel='icon'], link[rel='shortcut icon']"
                    );
                    existing.forEach(el => {
                        const sizes = el.getAttribute("sizes");
                        if (sizes !== "192x192" && sizes !== "512x512") {
                            el.remove();
                        }
                    });

                    const linkIcon = document.createElement("link");
                    linkIcon.rel = "icon";
                    linkIcon.type = "image/png";
                    linkIcon.href = cacheBusted;
                    document.head.appendChild(linkIcon);

                    const linkShortcut = document.createElement("link");
                    linkShortcut.rel = "shortcut icon";
                    linkShortcut.type = "image/png";
                    linkShortcut.href = cacheBusted;
                    document.head.appendChild(linkShortcut);

                    const link32 = document.createElement("link");
                    link32.rel = "icon";
                    link32.setAttribute("sizes", "32x32");
                    link32.type = "image/png";
                    link32.href = cacheBusted;
                    document.head.appendChild(link32);
                }
            }
        }
    }, [pathname, settings, loading, t]);

    return null;
}

