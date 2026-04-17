"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";

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

export default function TransportFeesMasterPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [copyAll, setCopyAll] = useState(false);
    const [fees, setFees] = useState<MonthlyFee[]>(
        monthsList.map(month => ({
            month,
            due_date: "",
            fine_type: "none",
            fine_percentage: "",
            fine_amount: ""
        }))
    );

    const fetchData = async () => {
        setFetching(true);
        try {
            const response = await api.get("/transport/fees-master");
            const data = response.data.data;
            if (data && data.length > 0) {
                // Map existing data and fill gaps for missing months
                const mergedFees = monthsList.map(month => {
                    const existing = data.find((f: any) => f.month === month);
                    if (existing) {
                        return {
                            month,
                            due_date: existing.due_date ? existing.due_date.split('-').reverse().join('/') : "",
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
            toast("error", "Failed to load fees settings");
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

        // If "Copy First" is enabled and we're editing the first row
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
            toast("success", "Transport fees master saved successfully");
            fetchData();
        } catch (error) {
            toast("error", "Failed to save fees settings");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="p-8 text-center text-gray-400 italic">Loading settings...</div>;

    return (
        <div className="p-4 bg-white min-h-screen font-sans text-xs text-gray-700">
            <div className="max-w-[1400px] mx-auto space-y-6">
                <h1 className="text-sm font-medium text-gray-800 tracking-tight mb-2">Transport Fees Master</h1>

                <div className="flex items-center space-x-2 pb-4">
                    <Checkbox
                        id="copy-all"
                        checked={copyAll}
                        onCheckedChange={(checked) => handleCopyAllToggle(checked as boolean)}
                        className="h-3.5 w-3.5 border-gray-300 accent-indigo-500 rounded"
                    />
                    <Label htmlFor="copy-all" className="text-[10px] font-bold text-gray-400 uppercase tracking-tight cursor-pointer select-none">
                        Copy First Fees Detail For All Months
                    </Label>
                </div>

                <div className="space-y-4">
                    {fees.map((fee, idx) => (
                        <div key={fee.month} className="flex flex-col lg:flex-row lg:items-center gap-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors px-2 rounded-lg">
                            {/* Month Name */}
                            <div className="w-24 shrink-0">
                                <span className="text-[11px] font-bold text-gray-700">{fee.month}</span>
                            </div>

                            {/* Due Date */}
                            <div className="flex-1 max-w-xs space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Due Date</Label>
                                <Input
                                    value={fee.due_date}
                                    onChange={(e) => handleChange(idx, 'due_date', e.target.value)}
                                    className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none"
                                    placeholder="DD/MM/YYYY"
                                />
                            </div>

                            {/* Fine Type Actions */}
                            <div className="flex flex-col lg:flex-row flex-[3] gap-6 lg:items-center">

                                {/* Fine Type Selector */}
                                <div className="space-y-1.5 min-w-[120px]">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Fine Type</Label>
                                    <RadioGroup
                                        value={fee.fine_type}
                                        onValueChange={(val) => handleChange(idx, 'fine_type', val)}
                                        className="flex items-center space-x-4 h-8"
                                    >
                                        <div className="flex items-center space-x-1.5">
                                            <RadioGroupItem value="none" id={`${fee.month}-none`} className="h-3 w-3" />
                                            <Label htmlFor={`${fee.month}-none`} className="text-[10px] font-medium text-gray-500">None</Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                {/* Percentage Option */}
                                <div className="flex-1 space-y-1.5">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroup value={fee.fine_type} onValueChange={(val) => handleChange(idx, 'fine_type', val)}>
                                            <RadioGroupItem value="percentage" id={`${fee.month}-pct`} className="h-3 w-3" />
                                        </RadioGroup>
                                        <Label htmlFor={`${fee.month}-pct`} className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Percentage (%)</Label>
                                    </div>
                                    <Input
                                        disabled={fee.fine_type !== 'percentage'}
                                        value={fee.fine_percentage}
                                        onChange={(e) => handleChange(idx, 'fine_percentage', e.target.value)}
                                        className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none"
                                        placeholder="0.00"
                                    />
                                </div>

                                {/* Fix Amount Option */}
                                <div className="flex-1 space-y-1.5">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroup value={fee.fine_type} onValueChange={(val) => handleChange(idx, 'fine_type', val)}>
                                            <RadioGroupItem value="fix" id={`${fee.month}-fix`} className="h-3 w-3" />
                                        </RadioGroup>
                                        <Label htmlFor={`${fee.month}-fix`} className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Fix Amount (₹)</Label>
                                    </div>
                                    <Input
                                        disabled={fee.fine_type !== 'fix'}
                                        value={fee.fine_amount}
                                        onChange={(e) => handleChange(idx, 'fine_amount', e.target.value)}
                                        className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none"
                                        placeholder="0.00"
                                    />
                                </div>

                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end pt-8 pb-10">
                    <Button
                        disabled={loading}
                        onClick={handleSave}
                        variant="gradient"
                        className="px-8 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-md min-w-[120px]"
                    >
                        {loading ? "Saving..." : "Save"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
