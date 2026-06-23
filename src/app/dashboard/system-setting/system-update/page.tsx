"use client";

import { useSettings } from "@/components/providers/settings-provider";
import { Info, RefreshCw } from "lucide-react";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";

export default function SystemUpdatePage() {
    const { t } = useTranslation();
    const { settings } = useSettings();
    const version = settings?.app_version || "7.2.0";

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            <Card className="pt-0 overflow-hidden flex flex-col min-h-[400px]">
                {/* Gradient Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <RefreshCw className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("system_update")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">{t("check_for_the_latest_version")}</p>
                        </div>
                    </div>
                    <Button variant="gradient" className="px-6 h-8 text-[11px] uppercase">
                        <RefreshCw className="mr-2 h-3 w-3" />
                        {t("check_for_updates")}
                    </Button>
                </div>

                {/* Content */}
                <CardContent className="p-8 flex flex-col items-center justify-center space-y-6 mt-8 flex-1">
                    {/* Version Box */}
                    <div className="bg-green-50 border border-green-200 text-green-700 px-12 py-6 rounded-md text-center shadow-sm w-full max-w-md">
                        <p className="text-[12px] font-medium text-green-600/80 mb-1">{t("your_ischool_version")}</p>
                        <p className="text-xl font-bold text-green-700">{version}</p>
                    </div>

                    {/* Status Message */}
                    <div className="flex items-center gap-1.5 text-gray-600">
                        <div className="bg-green-600 rounded-full p-[1px]">
                            <Info className="h-3 w-3 text-white fill-green-600" />
                        </div>
                        <span className="text-[12px] font-medium">{t("you_are_using_latest_version")}</span>
                    </div>

                    {/* Changelog Link */}
                    <p className="text-[12px] text-gray-600">
                        {t("please_check")} <span className="text-indigo-600 font-medium cursor-pointer hover:underline">{t("changelog")}</span> {t("for_latest_version_update")}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
