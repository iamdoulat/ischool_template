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
                let resolvedFaviconUrl = getImageUrl(rawFavicon);
                if (resolvedFaviconUrl) {
                    if (window.location.protocol === "https:" && resolvedFaviconUrl.startsWith("http://")) {
                        const isLocal = resolvedFaviconUrl.includes("localhost") || resolvedFaviconUrl.includes("127.0.0.1");
                        if (!isLocal) resolvedFaviconUrl = resolvedFaviconUrl.replace(/^http:\/\//i, "https://");
                    }
                    const existing = document.querySelectorAll<HTMLLinkElement>(
                        "link[rel='icon'], link[rel='shortcut icon']"
                    );
                    if (existing.length > 0) {
                        existing.forEach(el => {
                            const sizes = el.getAttribute("sizes");
                            if (sizes !== "192x192" && sizes !== "512x512") {
                                if (el.href !== resolvedFaviconUrl) {
                                    el.href = resolvedFaviconUrl;
                                }
                            }
                        });
                    } else {
                        const linkIcon = document.createElement("link");
                        linkIcon.rel = "icon";
                        linkIcon.type = "image/png";
                        linkIcon.href = resolvedFaviconUrl;
                        document.head.appendChild(linkIcon);
                    }
                }
            }
        }
    }, [pathname, settings?.favicon, settings?.school_name, loading, t]);

    return null;
}

