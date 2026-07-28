"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSettings } from "@/components/providers/settings-provider";
import { useTranslation } from "@/hooks/use-translation";
import { getPageTitleFromPathname } from "@/lib/page-title";

export function DocumentTitleSync() {
    const pathname = usePathname();
    const { settings, loading } = useSettings();
    const { t } = useTranslation();

    useEffect(() => {
        const schoolName = settings?.school_name || "iSchool";
        const pageName = getPageTitleFromPathname(pathname, t);
        document.title = `${pageName} || ${schoolName}`;
    }, [pathname, settings, loading, t]);

    return null;
}
