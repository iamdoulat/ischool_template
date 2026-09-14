/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Save,
    Bus,
    Calendar,
    Percent,
    Coins,
    ShieldAlert,
    Copy,
    CheckCircle2,
    CalendarDays,
    Info,
    Sparkles,
    Check,
    Layers,
    Clock
} from "lucide-react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { useCurrency } from "@/components/providers/currency-provider";
import { DatePicker } from "@/components/ui/date-picker";
import { translateMonthName, toLocaleNumber, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const monthsList = [
    "April", "May", "June", "July", "August", "September",
    "October", "November", "December", "January", "February", "March"
];

interface MonthlyFee {
    month: string;
    due_date: string;
    fine_type: "none" | "percentage" | "fix";
    fine_percentage: string;
    fine_amount: string;
}

function FormSkeleton() {
    return (
        <div className="space-y-4">
            <div className="h-16 w-full rounded-2xl bg-muted/40 animate-pulse" />
            <div className="rounded-2xl border border-muted/50 overflow-hidden bg-card/30">
                <div className="h-12 bg-muted/40 border-b border-muted/40 animate-pulse" />
                <div className="divide-y divide-muted/30">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex flex-col lg:flex-row lg:items-center gap-4 p-4">
                            <div className="h-6 w-28 rounded-lg bg-muted/50 animate-pulse" />
                            <div className="h-9 w-44 rounded-lg bg-muted/50 animate-pulse" />
                            <div className="h-9 flex-1 rounded-lg bg-muted/50 animate-pulse" />
                            <div className="h-9 w-36 rounded-lg bg-muted/50 animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function TransportFeesMasterPage() {
    const { t, language } = useTranslation();
    const tt = useTranslateToast();
    const { selectedCurrency } = useCurrency();
    const shortCode = language?.short_code || "en";
    const currencySymbol = selectedCurrency?.symbol || "৳";

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [copyAll, setCopyAll] = useState(false);
    const [fees, setFees] = useState<MonthlyFee[]>(
        monthsList.map(month => ({ month, due_date: "", fine_type: "none", fine_percentage: "", fine_amount: "" }))
    );

    const fetchData = async () => {
        setFetching(true);
        try {
            const response = await api.get("/transport/fees-master");
            const data = response.data?.data || response.data;
            if (data && Array.isArray(data) && data.length > 0) {
                const mergedFees = monthsList.map(month => {
                    const existing = data.find((f: any) => f.month === month);
                    if (existing) {
                        return {
                            month,
                            due_date: existing.due_date || "",
                            fine_type: (existing.fine_type || "none") as "none" | "percentage" | "fix",
                            fine_percentage: existing.fine_percentage ? String(existing.fine_percentage) : "",
                            fine_amount: existing.fine_amount ? String(existing.fine_amount) : ""
                        };
                    }
                    return { month, due_date: "", fine_type: "none" as const, fine_percentage: "", fine_amount: "" };
                });
                setFees(mergedFees);
            }
        } catch (error) {
            console.error("Error fetching fees master:", error);
            tt.error("failed_to_load_fees_settings");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (index: number, field: keyof MonthlyFee, value: string) => {
        const newFees = [...fees];
        newFees[index] = { ...newFees[index], [field]: value };
        if (copyAll && index === 0) {
            const firstRow = newFees[0];
            for (let i = 1; i < newFees.length; i++) {
                newFees[i] = {
                    ...newFees[i],
                    due_date: firstRow.due_date,
                    fine_type: firstRow.fine_type,
                    fine_percentage: firstRow.fine_percentage,
                    fine_amount: firstRow.fine_amount
                };
            }
        }
        setFees(newFees);
    };

    const handleCopyAllToggle = (checked: boolean) => {
        setCopyAll(checked);
        if (checked) {
            const firstRow = fees[0];
            const newFees = fees.map((f, i) => i === 0 ? f : {
                ...f,
                due_date: firstRow.due_date,
                fine_type: firstRow.fine_type,
                fine_percentage: firstRow.fine_percentage,
                fine_amount: firstRow.fine_amount
            });
            setFees(newFees);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.post("/transport/fees-master", { fees });
            tt.success("transport_fees_master_saved_successfully");
            fetchData();
        } catch (error) {
            tt.error("failed_to_save_fees_settings");
        } finally {
            setLoading(false);
        }
    };

    // Calculate Summary Stats
    const totalConfiguredDueDates = fees.filter(f => Boolean(f.due_date)).length;
    const totalActiveFines = fees.filter(f => f.fine_type !== "none").length;

    return (
        <div className="space-y-6 w-full pb-12 animate-in fade-in duration-500">
            {/* Fully Filled Gradient Header Banner Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FF9800] via-[#8B5CF6] to-[#6366F1] p-5 sm:p-7 text-white shadow-xl shadow-indigo-500/15 border border-white/20">
                {/* Luminous Glow Background Effects */}
                <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/15 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-black/10 blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 border border-white/40 text-white shadow-inner backdrop-blur-md">
                            <Bus className="h-7 w-7" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-xs">
                                    {t("transport_fees_master")}
                                </h1>
                                <Badge className="bg-white/25 hover:bg-white/30 text-white border-white/40 text-xs font-bold px-3 py-0.5 rounded-full backdrop-blur-md shadow-xs">
                                    <Sparkles className="w-3 h-3 mr-1 text-amber-200 animate-pulse" />
                                    {toLocaleNumber("12", shortCode)} {t("months")}
                                </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-white/90 font-medium max-w-2xl leading-relaxed">
                                {t("configure_monthly_due_dates_and_fines")}
                            </p>
                        </div>
                    </div>

                    {/* Top Action Button */}
                    <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                        <Button
                            disabled={loading || fetching}
                            onClick={handleSave}
                            className="h-11 px-7 rounded-2xl bg-white hover:bg-white/95 text-slate-900 font-black text-xs sm:text-sm shadow-xl shadow-black/20 hover:scale-105 active:scale-95 transition-all gap-2 cursor-pointer border border-white/60"
                        >
                            <Save className="h-4 w-4 text-indigo-600" />
                            <span>{loading ? t("saving") : t("save")}</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <Card className="border border-muted/60 shadow-lg bg-card/60 backdrop-blur-xl overflow-hidden rounded-3xl">
                <CardContent className="p-4 sm:p-6 space-y-6">
                    {fetching ? (
                        <FormSkeleton />
                    ) : (
                        <>
                            {/* Summary & Bulk Action Banner */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                {/* Auto-Sync Box */}
                                <div className="md:col-span-7 bg-muted/30 border border-border/60 hover:border-primary/40 rounded-2xl p-3.5 transition-all">
                                    <div className="flex items-start gap-3">
                                        <Checkbox
                                            id="copy-all"
                                            checked={copyAll}
                                            onCheckedChange={(checked) => handleCopyAllToggle(checked as boolean)}
                                            className="h-5 w-5 rounded-md mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground cursor-pointer"
                                        />
                                        <div className="space-y-0.5 select-none cursor-pointer" onClick={() => handleCopyAllToggle(!copyAll)}>
                                            <Label htmlFor="copy-all" className="text-xs sm:text-sm font-bold text-foreground cursor-pointer flex items-center gap-1.5">
                                                <Copy className="h-3.5 w-3.5 text-primary" />
                                                <span>{t("copy_first_fees_detail_for_all_months")}</span>
                                            </Label>
                                            <p className="text-[11px] text-muted-foreground leading-snug">
                                                {t("bulk_apply_first_month")} ({translateMonthName("April", shortCode)})
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Overview Chips */}
                                <div className="md:col-span-5 grid grid-cols-2 gap-2.5">
                                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-2.5 flex items-center gap-2.5">
                                        <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
                                            <CalendarDays className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground truncate">{t("due_date")}</p>
                                            <p className="text-xs sm:text-sm font-black text-indigo-600 dark:text-indigo-400">
                                                {toLocaleNumber(totalConfiguredDueDates, shortCode)} / {toLocaleNumber(12, shortCode)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-2.5 flex items-center gap-2.5">
                                        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                                            <ShieldAlert className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground truncate">{t("fine_rule")}</p>
                                            <p className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400">
                                                {toLocaleNumber(totalActiveFines, shortCode)} {t("active") || "Active"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Fees Master Table / Cards */}
                            <div className="rounded-2xl border border-border/60 overflow-hidden shadow-sm bg-card/40">
                                {/* Desktop Header */}
                                <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 bg-muted/50 border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                    <div className="col-span-2 flex items-center gap-1.5">
                                        <Layers className="h-3.5 w-3.5" />
                                        <span>{t("month")}</span>
                                    </div>
                                    <div className="col-span-3 flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>{t("due_date")}</span>
                                    </div>
                                    <div className="col-span-4 flex items-center gap-1.5">
                                        <Percent className="h-3.5 w-3.5" />
                                        <span>{t("fine_type")}</span>
                                    </div>
                                    <div className="col-span-3 flex items-center justify-end gap-1.5">
                                        <Coins className="h-3.5 w-3.5" />
                                        <span>{t("fine_amount")} / {t("percentage")}</span>
                                    </div>
                                </div>

                                {/* Month Rows */}
                                <div className="divide-y divide-border/40">
                                    {fees.map((fee, idx) => {
                                        const localizedMonth = translateMonthName(fee.month, shortCode);
                                        const isFirstRow = idx === 0;

                                        return (
                                            <div
                                                key={fee.month}
                                                className={cn(
                                                    "p-4 lg:px-5 lg:py-3.5 transition-all hover:bg-primary/[0.03] flex flex-col lg:grid lg:grid-cols-12 gap-3.5 lg:gap-4 lg:items-center",
                                                    isFirstRow && copyAll && "bg-primary/[0.04] border-l-4 border-l-primary"
                                                )}
                                            >
                                                {/* Column 1: Month Name & Badge */}
                                                <div className="lg:col-span-2 flex items-center justify-between lg:justify-start gap-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs font-mono">
                                                            {toLocaleNumber(String(idx + 1).padStart(2, '0'), shortCode)}
                                                        </span>
                                                        <div>
                                                            <span className="text-xs sm:text-sm font-bold text-foreground block leading-tight">
                                                                {localizedMonth}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground font-mono">
                                                                {fee.month}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {isFirstRow && copyAll && (
                                                        <Badge className="bg-primary/20 hover:bg-primary/20 text-primary border-primary/30 text-[9px] font-bold px-1.5 py-0.5 rounded-md lg:hidden">
                                                            Master
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Column 2: Due Date Picker */}
                                                <div className="lg:col-span-3 space-y-1">
                                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground lg:hidden flex items-center gap-1">
                                                        <Calendar className="h-3 w-3 text-primary" />
                                                        <span>{t("due_date")}</span>
                                                    </Label>
                                                    <DatePicker
                                                        value={fee.due_date}
                                                        onChange={(val) => handleChange(idx, 'due_date', val)}
                                                        placeholder={t("select_due_date") || t("due_date")}
                                                        className="h-9 w-full bg-background/80 border-border/80 text-xs font-medium rounded-xl shadow-none focus-visible:ring-primary hover:border-primary/50 transition-colors"
                                                    />
                                                </div>

                                                {/* Column 3: Segmented Fine Mode Pill */}
                                                <div className="lg:col-span-4 space-y-1">
                                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground lg:hidden flex items-center gap-1">
                                                        <Percent className="h-3 w-3 text-primary" />
                                                        <span>{t("fine_type")}</span>
                                                    </Label>
                                                    <div className="grid grid-cols-3 gap-1 p-1 bg-muted/40 border border-border/60 rounded-xl">
                                                        {/* Option: None */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleChange(idx, 'fine_type', 'none')}
                                                            className={cn(
                                                                "flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                                                                fee.fine_type === 'none'
                                                                    ? "bg-background text-foreground shadow-xs border border-border/80"
                                                                    : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                                                            )}
                                                        >
                                                            <span>{t("none")}</span>
                                                        </button>

                                                        {/* Option: Percentage */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleChange(idx, 'fine_type', 'percentage')}
                                                            className={cn(
                                                                "flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                                                                fee.fine_type === 'percentage'
                                                                    ? "bg-indigo-600 text-white shadow-xs"
                                                                    : "text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-background/40"
                                                            )}
                                                        >
                                                            <Percent className="h-3 w-3 shrink-0" />
                                                            <span>{t("percentage")}</span>
                                                        </button>

                                                        {/* Option: Fix Amount */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleChange(idx, 'fine_type', 'fix')}
                                                            className={cn(
                                                                "flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                                                                fee.fine_type === 'fix'
                                                                    ? "bg-emerald-600 text-white shadow-xs"
                                                                    : "text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-background/40"
                                                            )}
                                                        >
                                                            <Coins className="h-3 w-3 shrink-0" />
                                                            <span>{t("fix_amount")}</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Column 4: Fine Input with Currency / Percentage Addon */}
                                                <div className="lg:col-span-3 space-y-1">
                                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground lg:hidden flex items-center gap-1">
                                                        <Coins className="h-3 w-3 text-primary" />
                                                        <span>{t("fine_amount")} / {t("percentage")}</span>
                                                    </Label>
                                                    <div>
                                                        {fee.fine_type === "none" ? (
                                                            <div className="h-9 w-full rounded-xl bg-muted/20 border border-dashed border-border/60 flex items-center justify-center text-[11px] text-muted-foreground italic select-none">
                                                                <span>— {t("no_fine")} —</span>
                                                            </div>
                                                        ) : fee.fine_type === "percentage" ? (
                                                            <div className="relative w-full flex items-center rounded-xl border border-indigo-400/60 dark:border-indigo-700/80 bg-background overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 shadow-xs">
                                                                <Input
                                                                    type="number"
                                                                    step="any"
                                                                    min="0"
                                                                    max="100"
                                                                    value={fee.fine_percentage}
                                                                    onChange={(e) => handleChange(idx, 'fine_percentage', e.target.value)}
                                                                    placeholder="0.00"
                                                                    className="h-9 border-0 bg-transparent text-xs font-bold rounded-none focus-visible:ring-0 shadow-none px-3"
                                                                />
                                                                <div className="h-9 px-3 bg-indigo-500/15 border-l border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center select-none shrink-0">
                                                                    %
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="relative w-full flex items-center rounded-xl border border-emerald-400/60 dark:border-emerald-700/80 bg-background overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 shadow-xs">
                                                                <div className="h-9 px-3 bg-emerald-500/15 border-r border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center select-none shrink-0">
                                                                    {currencySymbol}
                                                                </div>
                                                                <Input
                                                                    type="number"
                                                                    step="any"
                                                                    min="0"
                                                                    value={fee.fine_amount}
                                                                    onChange={(e) => handleChange(idx, 'fine_amount', e.target.value)}
                                                                    placeholder="0.00"
                                                                    className="h-9 border-0 bg-transparent text-xs font-bold rounded-none focus-visible:ring-0 shadow-none px-3"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Bottom Footer Save Bar */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/50">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                    <Info className="h-4 w-4 text-primary shrink-0" />
                                    <span>{t("transport_fees_fine_auto_applied_hint")}</span>
                                </div>

                                <Button
                                    disabled={loading}
                                    onClick={handleSave}
                                    className="h-10 px-8 rounded-xl bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#4f46e5] text-white font-bold text-xs shadow-lg shadow-indigo-500/20 active:scale-95 transition-all gap-2 w-full sm:w-auto"
                                >
                                    <Save className="h-4 w-4" />
                                    <span>{loading ? t("saving") : t("save")}</span>
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
