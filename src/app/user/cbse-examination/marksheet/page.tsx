"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Printer, Loader2, FileText, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";

export default function UserCbseMarksheetPage() {
    const { t } = useTranslation();
    const [marksheets, setMarksheets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchMarksheets = async () => {
            try {
                // Future endpoint. For now, gracefully handle 404/Empty
                const res = await api.get("/user/cbse-marksheets").catch(() => ({ data: { success: true, data: [] } }));
                if (res.data && res.data.success) {
                    setMarksheets(res.data.data ?? []);
                } else {
                    toast({ variant: "destructive", title: t("error"), description: res.data?.message || t("failed_to_load_marksheets") });
                }
            } catch {
                toast({ variant: "destructive", title: t("error"), description: t("failed_to_load_marksheets") });
            } finally {
                setLoading(false);
            }
        };
        fetchMarksheets();
    }, [toast]);

    return (
        <div className="p-4 lg:p-6 animate-in fade-in duration-500">
            <Card className="shadow-sm border border-gray-200 rounded-xl overflow-hidden p-0 gap-0">
                {/* ── Header ── */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <BadgeCheck className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-[16px] font-bold text-gray-800 tracking-tight leading-none">{t("cbse_marksheet")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {loading ? t("loading") : `${marksheets.length} published marksheet${marksheets.length === 1 ? "" : "s"}`}
                            </p>
                        </div>
                    </div>
                </div>

                <CardContent className="p-4 lg:p-5 space-y-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span>{t("loading_marksheets")}</span>
                        </div>
                    ) : marksheets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <FileText className="h-12 w-12 opacity-30 mb-3" />
                            <p className="text-base font-semibold text-gray-500">{t("no_marksheets_available")}</p>
                            <p className="text-sm mt-1 text-gray-400">{t("they_will_appear_here_when_published")}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {/* Will map marksheets here once component exists */}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
