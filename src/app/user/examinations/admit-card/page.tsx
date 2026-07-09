"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { Printer, Loader2, FileText, FileBadge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { AdmitCardData, AdmitCardTemplateLayout } from "@/components/examination/AdmitCardTemplateLayout";
import { useReactToPrint } from "react-to-print";

export default function UserAdmitCardPage() {
    const { t } = useTranslation();
    const [admitCards, setAdmitCards] = useState<AdmitCardData[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const componentRefs = useRef<(HTMLDivElement | null)[]>([]);
    const printRef = useRef<any>(null);
    const handlePrint = useReactToPrint({
        contentRef: printRef,
    });

    useEffect(() => {
        const fetchAdmitCards = async () => {
            try {
                // Future endpoint. For now, gracefully handle 404/Empty
                const res = await api.get("/user/admit-cards").catch(() => ({ data: { success: true, data: [] } }));
                if (res.data && res.data.success) {
                    setAdmitCards(res.data.data ?? []);
                } else {
                    toast({ variant: "destructive", title: t("error"), description: res.data?.message || t("failed_to_load_admit_cards") });
                }
            } catch {
                toast({ variant: "destructive", title: t("error"), description: t("failed_to_load_admit_cards") });
            } finally {
                setLoading(false);
            }
        };
        fetchAdmitCards();
    }, [toast]);

    return (
        <div className="p-4 lg:p-6 animate-in fade-in duration-500">
            <Card className="shadow-sm border border-gray-200 rounded-xl overflow-hidden p-0 gap-0">
                {/* ── Header ── */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <FileBadge className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-[16px] font-bold text-gray-800 tracking-tight leading-none">{t("admit_card")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {loading ? t("loading") : `${admitCards.length} published admit card${admitCards.length === 1 ? "" : "s"}`}
                            </p>
                        </div>
                    </div>
                </div>

                <CardContent className="p-4 lg:p-5 space-y-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span>{t("loading_admit_cards")}</span>
                        </div>
                    ) : admitCards.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <FileText className="h-12 w-12 opacity-30 mb-3" />
                            <p className="text-base font-semibold text-gray-500">{t("no_admit_cards_available")}</p>
                            <p className="text-sm mt-1 text-gray-400">{t("they_will_appear_here_when_published")}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {admitCards.map((card, index) => (
                                <div key={index} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-gradient-to-r from-gray-50 to-white px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-gray-800">{card.exam.name}</h3>
                                            <p className="text-xs text-gray-500">{card.exam.session}</p>
                                        </div>
                                        <Button 
                                            onClick={() => {
                                                printRef.current = componentRefs.current[index];
                                                handlePrint();
                                            }}
                                            className="h-8 gap-2 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0 hover:opacity-90"
                                        >
                                            <Printer className="h-4 w-4" />
                                            {t("print")}
                                        </Button>
                                    </div>
                                    <div className="p-4 overflow-x-auto bg-gray-50 flex justify-center">
                                        <div className="bg-white shadow-sm border border-gray-200 print:shadow-none print:border-none">
                                            <AdmitCardTemplateLayout 
                                                ref={(el) => { componentRefs.current[index] = el; }} 
                                                data={card} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
