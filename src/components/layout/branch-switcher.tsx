"use client";

import { useState, useEffect } from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Building2, Check, ExternalLink, Loader2, Star } from "lucide-react";
import api from "@/lib/api";
import { useSettings } from "@/components/providers/settings-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";

interface Branch {
    id: string | number;
    branch_name: string;
    branch_url: string;
    is_main?: boolean;
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
    const [activeBranchUrl, setActiveBranchUrl] = useState("");

    const allowedRoles = ["super admin", "admin", "accounts", "accountant"];
    const userRole = (user?.role || "").toLowerCase();
    const isAllowed = user && allowedRoles.includes(userRole);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== "undefined") {
            setActiveBranchUrl(window.location.origin);
        }
    }, []);

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const res = await api.get("/multi-branch/branches", { skipGlobalErrorHandler: true });
            const list = res.data?.data || res.data || [];
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

    const mainBranchName = settings?.school_name || "Main Branch";

    const handleSwitchBranch = (url: string) => {
        if (!url) return;
        setIsOpen(false);
        if (url.startsWith("http://") || url.startsWith("https://")) {
            window.location.href = url;
        } else if (url.startsWith("/")) {
            window.location.href = url;
        } else {
            window.location.href = `https://${url}`;
        }
    };

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
                    className="w-72 p-2 bg-card/95 backdrop-blur-md border-muted/50 shadow-2xl rounded-2xl"
                    align="end"
                    sideOffset={12}
                >
                    <div className="p-3 border-b border-muted/50 mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-primary" />
                            <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                                {t("switch_branch") || "Switch Branch"}
                            </p>
                        </div>
                        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                    </div>

                    <div className="space-y-3 max-h-[320px] overflow-y-auto custom-scrollbar p-1">
                        {/* Main Branch Section */}
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2">
                                Main Branch
                            </p>
                            <Button
                                variant="ghost"
                                onClick={() => handleSwitchBranch("/dashboard")}
                                className="w-full justify-between items-center h-auto py-2.5 px-3 text-left font-medium rounded-xl hover:bg-primary/10 transition-all group/item border border-primary/20 bg-primary/5"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                                        <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-foreground truncate group-hover/item:text-primary">
                                            {mainBranchName}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground truncate">
                                            Primary Campus
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[9px] font-bold bg-primary text-white px-2 py-0.5 rounded-full uppercase shrink-0">
                                    Main
                                </span>
                            </Button>
                        </div>

                        {/* Additional Branches Section */}
                        <div className="space-y-1 pt-1 border-t border-muted/40">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2">
                                Additional Branches
                            </p>
                            {branches.length > 0 ? (
                                branches.map((branch) => {
                                    const isCurrent = activeBranchUrl.includes(branch.branch_url) || false;
                                    return (
                                        <Button
                                            key={branch.id}
                                            variant="ghost"
                                            onClick={() => handleSwitchBranch(branch.branch_url)}
                                            className={cn(
                                                "w-full justify-between items-center h-auto py-2 px-3 text-left font-medium rounded-xl hover:bg-primary/10 transition-all group/item",
                                                isCurrent ? "bg-primary/15 text-primary border border-primary/30" : "text-foreground"
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground shrink-0 group-hover/item:text-primary group-hover/item:bg-primary/10">
                                                    <Building2 className="h-3.5 w-3.5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-foreground truncate group-hover/item:text-primary">
                                                        {branch.branch_name}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                                                        {branch.branch_url}
                                                        <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                                                    </p>
                                                </div>
                                            </div>
                                            {isCurrent && (
                                                <Check className="h-4 w-4 text-primary shrink-0" />
                                            )}
                                        </Button>
                                    );
                                })
                            ) : !loading ? (
                                <div className="p-3 text-center text-[11px] text-muted-foreground italic bg-muted/20 rounded-xl">
                                    No additional branches added
                                </div>
                            ) : null}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-[#6366f1] text-white text-[11px] font-bold rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#6366f1] rotate-45" />
                {t("switch_branch") || "Switch Branch"}
            </div>
        </div>
    );
}
