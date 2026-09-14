"use client";

import { useState, useEffect } from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Building2, Check, ExternalLink, Loader2, Star, Sparkles } from "lucide-react";
import api from "@/lib/api";
import { useSettings } from "@/components/providers/settings-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";

interface Branch {
    id: string | number;
    branch_name: string;
    branch_code?: string;
    slug?: string;
    branch_url: string;
    is_main?: boolean;
    total_students_count?: number;
    total_staff_count?: number;
}

interface BranchSwitcherProps {
    user: any;
}

export function BranchSwitcher({ user }: BranchSwitcherProps) {
    const { settings } = useSettings();
    const { t } = useLanguage();
    const [mounted, setMounted] = useState(false);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [activeBranchId, setActiveBranchId] = useState<string>("");

    const allowedRoles = ["super admin", "admin", "accounts", "accountant", "headmaster", "principal"];
    const userRole = (user?.role || "").toLowerCase();
    const isAllowed = user && (allowedRoles.includes(userRole) || user?.branch_id !== undefined);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== "undefined") {
            const savedBranchId = localStorage.getItem("active_branch_id") || "";
            setActiveBranchId(savedBranchId);
        }
    }, []);

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const res = await api.get("/multi-branch/branches", {
                params: { all: "true" },
                skipGlobalErrorHandler: true
            });
            const list = res.data?.data?.data || res.data?.data || res.data || [];
            setBranches(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error("Failed to fetch branch list for switcher:", error);
            setBranches([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && isAllowed) {
            fetchBranches();
        }
    }, [isOpen, isAllowed]);

    if (!mounted || !isAllowed) {
        return null;
    }

    const mainBranchName = settings?.school_name || "Main Campus";

    const handleSelectBranch = (branch: Branch | null) => {
        setIsOpen(false);
        const isMain = !branch || branch.is_main || branch.id === 1 || String(branch.id) === "1" || branch.slug === "main";
        if (isMain) {
            // Switch to Main Branch
            if (typeof window !== "undefined") {
                localStorage.removeItem("active_branch_id");
                localStorage.removeItem("active_branch_slug");
                localStorage.removeItem("active_branch_name");
                document.cookie = "active_branch_id=; path=/; max-age=0";
                window.location.href = "/dashboard";
            }
            return;
        }

        if (typeof window !== "undefined") {
            localStorage.setItem("active_branch_id", branch.id.toString());
            localStorage.setItem("active_branch_slug", branch.slug || branch.id.toString());
            localStorage.setItem("active_branch_name", branch.branch_name);
            document.cookie = `active_branch_id=${branch.id}; path=/; max-age=2592000; SameSite=Lax`;

            if (branch.slug && branch.slug !== "main") {
                window.location.href = `/br/${branch.slug}/dashboard`;
            } else {
                window.location.href = "/dashboard";
            }
        }
    };

    const mainBranch = branches.find((b) => b.is_main);
    const additionalBranches = branches.filter((b) => !b.is_main);

    return (
        <div className="relative group flex items-center justify-center">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl relative group"
                        title={t("switch_branch") || "Switch Branch"}
                    >
                        <ArrowLeftRight className="h-5 w-5" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-80 p-2 bg-card/95 backdrop-blur-xl border-muted/60 shadow-2xl rounded-3xl"
                    align="end"
                    sideOffset={12}
                >
                    <div className="p-3 border-b border-muted/50 mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-primary" />
                            <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                                {t("switch_branch") || "Switch Campus Branch"}
                            </p>
                        </div>
                        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                    </div>

                    <div className="space-y-3 max-h-[360px] overflow-y-auto custom-scrollbar p-1">
                        {/* Main Branch Option */}
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2">
                                Central Headquarters / Main
                            </p>
                            <Button
                                variant="ghost"
                                onClick={() => handleSelectBranch(null)}
                                className={cn(
                                    "w-full justify-between items-center h-auto py-2.5 px-3 text-left font-medium rounded-2xl transition-all group/item border",
                                    !activeBranchId
                                        ? "border-primary bg-primary/10 text-primary shadow-xs"
                                        : "border-muted/50 hover:bg-primary/5 text-foreground"
                                )}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                                        <Star className="h-4 w-4 fill-primary text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-foreground truncate group-hover/item:text-primary">
                                            {mainBranch?.branch_name || mainBranchName}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground truncate">
                                            Consolidated / Primary Campus
                                        </p>
                                    </div>
                                </div>
                                {!activeBranchId ? (
                                    <Check className="h-4 w-4 text-primary shrink-0" />
                                ) : (
                                    <span className="text-[9px] font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-full uppercase shrink-0">
                                        Main
                                    </span>
                                )}
                            </Button>
                        </div>

                        {/* Additional Branches */}
                        <div className="space-y-1 pt-2 border-t border-muted/40">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2">
                                Campus Branches
                            </p>
                            {additionalBranches.length > 0 ? (
                                additionalBranches.map((branch) => {
                                    const isCurrent = activeBranchId === branch.id.toString();
                                    return (
                                        <Button
                                            key={branch.id}
                                            variant="ghost"
                                            onClick={() => handleSelectBranch(branch)}
                                            className={cn(
                                                "w-full justify-between items-center h-auto py-2.5 px-3 text-left font-medium rounded-2xl transition-all group/item border",
                                                isCurrent
                                                    ? "bg-primary/10 text-primary border-primary shadow-xs"
                                                    : "border-muted/30 hover:bg-primary/5 text-foreground"
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground shrink-0 group-hover/item:text-primary group-hover/item:bg-primary/10">
                                                    <Building2 className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-foreground truncate group-hover/item:text-primary">
                                                        {branch.branch_name}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1 font-mono">
                                                        {branch.branch_code || branch.slug || "Campus Branch"}
                                                    </p>
                                                </div>
                                            </div>
                                            {isCurrent ? (
                                                <Check className="h-4 w-4 text-primary shrink-0" />
                                            ) : (
                                                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-40 group-hover/item:opacity-100 shrink-0" />
                                            )}
                                        </Button>
                                    );
                                })
                            ) : !loading ? (
                                <div className="p-3 text-center text-[11px] text-muted-foreground italic bg-muted/20 rounded-2xl">
                                    No additional campus branches configured.
                                </div>
                            ) : null}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-[#6366f1] text-white text-[11px] font-bold rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#6366f1] rotate-45" />
                {t("switch_branch") || "Switch Campus Branch"}
            </div>
        </div>
    );
}
