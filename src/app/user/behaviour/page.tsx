"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    ShieldCheck,
    ShieldAlert,
    Calendar,
    User,
    TrendingUp,
    TrendingDown,
    Zap,
    FolderOpen,
} from "lucide-react";

interface IncidentRecord {
    id: number;
    incident_date: string | null;
    title: string | null;
    point: number;
    description: string | null;
    assigned_by: string | null;
}

interface BehaviourData {
    total_points: number;
    total_incidents: number;
    incidents: IncidentRecord[];
}

function SkeletonRow() {
    return (
        <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 animate-pulse">
            <div className="h-9 w-9 rounded-lg bg-gray-200/70 shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 rounded bg-gray-200/70" />
                <div className="h-2.5 w-1/2 rounded bg-gray-200/60" />
            </div>
            <div className="h-6 w-12 rounded-full bg-gray-200/70" />
        </div>
    );
}

export default function UserBehaviourPage() {
    const { t } = useTranslation();
    const [data, setData] = useState<BehaviourData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get("/user/behaviour");
                const payload = res.data?.data ?? res.data;
                setData(payload);
            } catch {
                toast.error(t("failed_to_load_behaviour_records"));
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const totalPoints = data?.total_points ?? 0;
    const totalIncidents = data?.total_incidents ?? 0;
    const positivePoints = totalPoints >= 0;

    return (
        <div className="p-4 lg:p-6 space-y-5 min-h-screen font-sans animate-in fade-in duration-500">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

                {/* ── Header ── */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <ShieldCheck className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-[16px] font-bold text-gray-800 tracking-tight leading-none">{t("behaviour_records")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">{t("your_incident_history_and_behaviour_points")}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 lg:p-5 space-y-5">

                    {/* ── Summary cards ── */}
                    {loading ? (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="h-20 rounded-xl bg-gray-100 animate-pulse" />
                            <div className="h-20 rounded-xl bg-gray-100 animate-pulse" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                                <div className={cn("h-1 w-full bg-gradient-to-r", positivePoints ? "from-green-500 to-emerald-400" : "from-red-500 to-rose-400")} />
                                <div className="px-4 py-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 leading-none">{t("total_points")}</p>
                                        <p className={cn("mt-1.5 text-2xl font-bold", positivePoints ? "text-green-700" : "text-red-700")}>
                                            {positivePoints ? "+" : ""}{totalPoints}
                                        </p>
                                    </div>
                                    <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", positivePoints ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500")}>
                                        {positivePoints ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                                    </span>
                                </div>
                            </div>
                            <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                                <div className="h-1 w-full bg-gradient-to-r from-[#FF9800] to-[#6366F1]" />
                                <div className="px-4 py-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 leading-none">{t("total_incidents")}</p>
                                        <p className="mt-1.5 text-2xl font-bold text-indigo-700">{totalIncidents}</p>
                                    </div>
                                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
                                        <ShieldAlert className="h-5 w-5" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Incident list ── */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-200">
                            <h2 className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">{t("incident_history")}</h2>
                        </div>

                        {loading ? (
                            <div>
                                <SkeletonRow />
                                <SkeletonRow />
                                <SkeletonRow />
                                <SkeletonRow />
                            </div>
                        ) : !data?.incidents?.length ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
                                <FolderOpen className="h-12 w-12 opacity-30" />
                                <p className="text-[12px] font-semibold">{t("no_behaviour_records_found")}</p>
                                <p className="text-[11px] text-gray-400">{t("clean_record_keep_it_up")}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {data.incidents.map((item) => {
                                    const positive = item.point >= 0;
                                    return (
                                        <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5 hover:bg-gray-50/60 transition-colors">
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", positive ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500")}>
                                                    {positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-[13px] font-bold text-gray-800 leading-tight">{item.title || t("incident")}</p>
                                                    {item.description && (
                                                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                                                    )}
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[10px] text-gray-400 font-medium">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" /> {item.incident_date || "—"}
                                                        </span>
                                                        {item.assigned_by && (
                                                            <span className="flex items-center gap-1">
                                                                <User className="h-3 w-3" /> {item.assigned_by}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="shrink-0 self-start sm:self-center pl-12 sm:pl-0">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-bold border",
                                                    positive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                                                )}>
                                                    <Zap className="h-3 w-3" />
                                                    {positive ? "+" : ""}{item.point}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
