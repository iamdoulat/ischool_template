"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Building2, Globe, ExternalLink, Search } from "lucide-react";

interface Branch {
    id: number;
    branch_name: string;
    branch_url: string;
}

function SkeletonCard() {
    return (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden animate-pulse">
            <div className="h-12 bg-gradient-to-r from-gray-100 to-gray-200" />
            <div className="p-4 space-y-3">
                <div className="h-3 w-3/4 rounded bg-gray-200/70" />
                <div className="h-8 w-full rounded-lg bg-gray-200/70 mt-3" />
            </div>
        </div>
    );
}

export default function UserBranchesPage() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get("/user/branches");
                const payload = res.data?.data ?? res.data;
                setBranches(payload?.branches ?? []);
            } catch {
                toast({ title: t("error"), description: t("failed_to_load_branches"), variant: "destructive" });
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = branches.filter((b) =>
        b.branch_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.branch_url.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-5 p-4 animate-in fade-in duration-300">
            {/* Title */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-md">
                        <Globe className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">{t("branches")}</h1>
                        <p className="text-xs text-gray-500">{t("explore_other_campuses_of_our_institution")}</p>
                    </div>
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder={t("search")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-9 text-xs" />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : filtered.length === 0 ? (
                <Card className="shadow-sm border-0">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <Building2 className="h-12 w-12 opacity-25 mb-3" />
                        <p className="text-base font-medium text-gray-500">{t("no_branches_available")}</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((branch) => (
                        <div key={branch.id} className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            <div className="px-4 py-3 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] flex items-center gap-2">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                    <Building2 className="h-4 w-4" />
                                </span>
                                <h3 className="text-sm font-bold text-slate-800 truncate">{branch.branch_name}</h3>
                            </div>
                            <div className="p-4 space-y-3">
                                <p className="text-[11px] text-gray-500 truncate">{branch.branch_url}</p>
                                <a
                                    href={branch.branch_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-1.5 h-9 rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
                                >
                                    {t("visit_campus")} <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
