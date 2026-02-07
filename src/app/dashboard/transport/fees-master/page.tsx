"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

const months = [
    "April", "May", "June", "July", "August", "September",
    "October", "November", "December", "January", "February", "March"
];

const initialData = months.map((month, index) => ({
    month,
    dueDate: index < 9 ? `10/05/2025` : `10/05/2026`, // Mock dates
    fineType: "none",
    percentage: "",
    fixAmount: "",
}));

export default function TransportFeesMasterPage() {
    const [data, setData] = useState(initialData);
    const [copyAll, setCopyAll] = useState(false);

    return (
        <div className="p-4 bg-white min-h-screen font-sans text-xs text-gray-700">
            <div className="max-w-[1400px] mx-auto space-y-6">
                <h1 className="text-sm font-medium text-gray-800 tracking-tight mb-2">Transport Fees Master</h1>

                <div className="flex items-center space-x-2 pb-4">
                    <Checkbox
                        id="copy-all"
                        checked={copyAll}
                        onChange={(e) => setCopyAll(e.target.checked)}
                        className="h-3.5 w-3.5 border-gray-300 accent-indigo-500"
                    />
                    <Label htmlFor="copy-all" className="text-[10px] font-bold text-gray-400 uppercase tracking-tight cursor-pointer">
                        Copy First Fees Detail For All Months
                    </Label>
                </div>

                <div className="space-y-4">
                    {months.map((month, idx) => (
                        <div key={month} className="flex flex-col lg:flex-row lg:items-center gap-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors px-2 rounded-lg">
                            {/* Month Name */}
                            <div className="w-24 shrink-0">
                                <span className="text-[11px] font-bold text-gray-700">{month}</span>
                            </div>

                            {/* Due Date */}
                            <div className="flex-1 max-w-xs space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Due Date</Label>
                                <Input
                                    defaultValue={idx === 0 ? "04/05/2025" : idx === 1 ? "10/05/2025" : idx === 2 ? "10/05/2025" : ""}
                                    className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none"
                                    placeholder="DD/MM/YYYY"
                                />
                            </div>

                            {/* Fine Type Actions */}
                            <div className="flex flex-col lg:flex-row flex-[3] gap-6 lg:items-center">

                                {/* None Option */}
                                <div className="space-y-1.5 min-w-[80px]">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Fine Type</Label>
                                    <div className="flex items-center space-x-2 h-8">
                                        <RadioGroup defaultValue="none" className="flex items-center space-x-2">
                                            <div className="flex items-center space-x-1.5">
                                                <RadioGroupItem value="none" id={`${month}-none`} className="h-3 w-3 border-gray-300 text-indigo-500 focus:ring-indigo-500" />
                                                <Label htmlFor={`${month}-none`} className="text-[10px] font-medium text-gray-500">None</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                </div>

                                {/* Percentage Option */}
                                <div className="flex-1 space-y-1.5">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroup className="flex items-center">
                                            <RadioGroupItem value="percentage" id={`${month}-pct`} className="h-3 w-3 border-gray-300 text-indigo-500" />
                                        </RadioGroup>
                                        <Label htmlFor={`${month}-pct`} className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Percentage (%)</Label>
                                    </div>
                                    <Input
                                        defaultValue={idx === 0 || idx === 3 || idx === 4 || idx === 5 || idx === 9 || idx === 10 ? "10.00" : ""}
                                        className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none"
                                    />
                                </div>

                                {/* Fix Amount Option */}
                                <div className="flex-1 space-y-1.5">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroup className="flex items-center">
                                            <RadioGroupItem value="fix" id={`${month}-fix`} className="h-3 w-3 border-gray-300 text-indigo-500" />
                                        </RadioGroup>
                                        <Label htmlFor={`${month}-fix`} className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Fix Amount (₹)</Label>
                                    </div>
                                    <Input
                                        defaultValue={idx === 1 || idx === 2 || idx === 6 || idx === 7 || idx === 8 || idx === 11 ? "3500.00" : ""}
                                        className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none"
                                    />
                                </div>

                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end pt-8 pb-10">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-md">
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
}
