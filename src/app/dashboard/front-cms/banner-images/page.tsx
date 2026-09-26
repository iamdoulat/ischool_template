"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import Link from "next/link";

export default function BannerImagesRedirect() {
    const router = useRouter();
    const { t } = useTranslation();

    useEffect(() => {
        router.replace("/dashboard/system-setting/front-cms-setting?tab=banners");
    }, [router]);

    return (
        <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-800">
                    {t("redirecting_to_front_cms_setting")}
                </h3>
                <p className="text-xs text-gray-500">
                    <Link 
                        href="/dashboard/system-setting/front-cms-setting?tab=banners" 
                        className="text-indigo-600 font-semibold underline hover:text-indigo-700"
                    >
                        {t("banner_images_tab")} &rarr;
                    </Link>
                </p>
            </div>
        </div>
    );
}
