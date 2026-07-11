/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Save, ReceiptText } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { useCurrency } from "@/components/providers/currency-provider";
import { DatePicker } from "@/components/ui/date-picker";

const monthsList = [
    "April", "May", "June", "July", "August", "September",
    "October", "November", "December", "January", "February", "March"
];

interface MonthlyFee {
    month: string;
    due_date: string;
    fine_type: string;
    fine_percentage: string;
    fine_amount: string;
}

function FormSkeleton() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col lg:flex-row lg:items-center gap-6 py-4 border-b border-gray-50">
                    <div className="h-4 w-20 rounded bg-gray-200/70 animate-pulse" />
                    <div className="h-9 flex-1 max-w-xs rounded bg-gray-200/70 animate-pulse" />
                    <div className="h-9 flex-[3] rounded bg-gray-200/70 animate-pulse" />
                </div>
            ))}
        </div>
    );
}

export default function TransportFeesMasterPage() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const { selectedCurrency } = useCurrency();
    const currencySymbol = selectedCurrency?.symbol || "₹";

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
            const data = response.data.data;
            if (data && data.length > 0) {
                const mergedFees = monthsList.map(month => {
                    const existing = data.find((f: any) => f.month === month);
                    if (existing) {
                        return {
                            month,
                            due_date: existing.due_date || "",
                            fine_type: existing.fine_type || "none",
                            fine_percentage: existing.fine_percentage || "",
                            fine_amount: existing.fine_amount || ""
                        };
                    }
                    return { month, due_date: "", fine_type: "none", fine_percentage: "", fine_amount: "" };
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
                newFees[i] = { ...newFees[i], due_date: firstRow.due_date, fine_type: firstRow.fine_type, fine_percentage: firstRow.fine_percentage, fine_amount: firstRow.fine_amount };
            }
        }
        setFees(newFees);
    };

    const handleCopyAllToggle = (checked: boolean) => {
        setCopyAll(checked);
        if (checked) {
            const firstRow = fees[0];
            const newFees = fees.map((f, i) => i === 0 ? f : { ...f, due_date: firstRow.due_date, fine_type: firstRow.fine_type, fine_percentage: firstRow.fine_percentage, fine_amount: firstRow.fine_amount });
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

    return (
        <div className="space-y-6">
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <ReceiptText className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("transport_fees_master")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("configure_monthly_due_dates_and_fines")}</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 text-xs text-gray-700">
                    {fetching ? (
                        <FormSkeleton />
                    ) : (
                        <>
                            <div className="flex items-center space-x-2 pb-2">
                                <Checkbox id="copy-all" checked={copyAll} onCheckedChange={(checked) => handleCopyAllToggle(checked as boolean)} className="h-3.5 w-3.5 border-gray-300 accent-indigo-500 rounded" />
                                <Label htmlFor="copy-all" className="text-[10px] font-bold text-gray-400 uppercase tracking-tight cursor-pointer select-none">{t("copy_first_fees_detail_for_all_months")}</Label>
                            </div>

                            <div className="space-y-1">
                                {fees.map((fee, idx) => (
                                    <div key={fee.month} className="flex flex-col lg:flex-row lg:items-center gap-6 py-4 border-b border-gray-50 last:border-0 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer px-2 rounded-lg">
                                        <div className="w-24 shrink-0">
                                            <span className="text-[11px] font-bold text-gray-700">{fee.month}</span>
                                        </div>
                                        <div className="flex-1 max-w-xs space-y-1.5">
                                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("due_date")}</Label>
                                            <DatePicker value={fee.due_date} onChange={(val) => handleChange(idx, 'due_date', val)} className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none" />
                                        </div>
                                        <div className="flex flex-col lg:flex-row flex-[3] gap-6 lg:items-center">
                                            <div className="space-y-1.5 min-w-[120px]">
                                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("fine_type")}</Label>
                                                <RadioGroup value={fee.fine_type} onValueChange={(val) => handleChange(idx, 'fine_type', val)} className="flex items-center space-x-4 h-8">
                                                    <div className="flex items-center space-x-1.5">
                                                        <RadioGroupItem value="none" id={`${fee.month}-none`} className="h-3 w-3" />
                                                        <Label htmlFor={`${fee.month}-none`} className="text-[10px] font-medium text-gray-500">{t("none")}</Label>
                                                    </div>
                                                </RadioGroup>
                                            </div>
                                            <div className="flex-1 space-y-1.5">
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroup value={fee.fine_type} onValueChange={(val) => handleChange(idx, 'fine_type', val)}>
                                                        <RadioGroupItem value="percentage" id={`${fee.month}-pct`} className="h-3 w-3" />
                                                    </RadioGroup>
                                                    <Label htmlFor={`${fee.month}-pct`} className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("percentage")} (%)</Label>
                                                </div>
                                                <Input disabled={fee.fine_type !== 'percentage'} value={fee.fine_percentage} onChange={(e) => handleChange(idx, 'fine_percentage', e.target.value)} className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none" placeholder="0.00" />
                                            </div>
                                            <div className="flex-1 space-y-1.5">
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroup value={fee.fine_type} onValueChange={(val) => handleChange(idx, 'fine_type', val)}>
                                                        <RadioGroupItem value="fix" id={`${fee.month}-fix`} className="h-3 w-3" />
                                                    </RadioGroup>
                                                    <Label htmlFor={`${fee.month}-fix`} className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("fix_amount")} ({currencySymbol})</Label>
                                                </div>
                                                <Input disabled={fee.fine_type !== 'fix'} value={fee.fine_amount} onChange={(e) => handleChange(idx, 'fine_amount', e.target.value)} className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none" placeholder="0.00" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button disabled={loading} onClick={handleSave} className="h-9 px-8 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all min-w-[120px]">
                                    <Save className="h-4 w-4" /> {loading ? t("saving") : t("save")}
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
