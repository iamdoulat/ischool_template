"use client";

import {
    Search,
    Plus,
    FileSpreadsheet,
    FileText,
    FileCode,
    Printer,
    Eye,
    Pencil,
    Trash2,
    ChevronDown,
    LayoutGrid,
    Wallet
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const feesListData = [
    {
        group: "Class 1 General",
        items: [
            { code: "April Month Fees(apr-month-fees)", amount: "350.00", fineType: "Fix", dueDate: "04/10/2025", perDay: "No", fineAmount: "Fine: 50.00" },
            { code: "Admission Fees(admission-fees)", amount: "2,500.00", fineType: "None", dueDate: "04/10/2025", perDay: "No", fineAmount: "Fine: 0.00" },
            { code: "May Month Fees(may-month-fees)", amount: "350.00", fineType: "Fix", dueDate: "05/10/2025", perDay: "No", fineAmount: "Fine: 50.00" },
            { code: "June Month Fees(jun-month-fees)", amount: "350.00", fineType: "Fix", dueDate: "06/10/2025", perDay: "No", fineAmount: "Fine: 50.00" },
        ]
    },
    {
        group: "Class 1 Lump Sum",
        items: [
            { code: "Lumpsum fees(lumpsum-fees)", amount: "150.00", fineType: "Cumulative", dueDate: "04/15/2025", perDay: "No", fineAmount: "Days: 5-Fine: $50.00, Days: 10-Fine: $100.00" },
        ]
    },
    {
        group: "Class 1-I Installment",
        items: [
            { code: "April Month Fees(apr-month-fees)", amount: "100.00", fineType: "Cumulative", dueDate: "04/15/2025", perDay: "Yes", fineAmount: "Days: 5-Fine: $50.00, Days: 10-Fine: $100.00" },
            { code: "1st Installment Fees(1-installment-fees)", amount: "200.00", fineType: "Cumulative", dueDate: "01/30/2026", perDay: "Yes", fineAmount: "Days: 100-Fine: $25.00" },
        ]
    },
    {
        group: "Class 2 General",
        items: [
            { code: "Admission Fees(admission-fees)", amount: "2,500.00", fineType: "Fix", dueDate: "04/10/2025", perDay: "No", fineAmount: "Fine: 50.00" },
        ]
    }
];

export default function FeesMasterPage() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
            {/* Left: Add Fees Master Form */}
            <div className="lg:col-span-1 space-y-6">
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden sticky top-24">
                    <div className="px-6 py-4 border-b border-muted/50 flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Plus className="h-5 w-5 text-primary" />
                        </div>
                        <h2 className="font-bold text-lg tracking-tight">Add Fees Master : 2025-26</h2>
                    </div>
                    <CardContent className="p-6 space-y-5">
                        <div className="space-y-4">
                            {/* Fees Group */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                    Fees Group <span className="text-destructive font-black">*</span>
                                </label>
                                <div className="relative">
                                    <select className="flex h-11 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all">
                                        <option value="">Select</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>

                            {/* Fees Type */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                    Fees Type <span className="text-destructive font-black">*</span>
                                </label>
                                <div className="relative">
                                    <select className="flex h-11 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all">
                                        <option value="">Select</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>

                            {/* Due Date */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                    Due Date
                                </label>
                                <Input type="date" className="h-11 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium" />
                            </div>

                            {/* Amount */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                    Amount ($) <span className="text-destructive font-black">*</span>
                                </label>
                                <Input placeholder="0.00" className="h-11 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium" />
                            </div>

                            {/* Fine Type */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">
                                    Fine Type
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { id: "none", label: "None" },
                                        { id: "percentage", label: "Percentage" },
                                        { id: "fix", label: "Fix Amount" },
                                        { id: "cumulative", label: "Cumulative" }
                                    ].map((type) => (
                                        <label key={type.id} className="flex items-center gap-3 p-3 rounded-xl border border-muted/50 bg-muted/20 cursor-pointer hover:bg-primary/5 transition-all group">
                                            <input type="radio" name="fineType" value={type.id} className="w-4 h-4 text-primary bg-muted border-muted focus:ring-primary/20" />
                                            <span className="text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors">{type.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Fine Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 group">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                        Percentage (%) <span className="text-destructive font-black">*</span>
                                    </label>
                                    <Input placeholder="0" className="h-10 rounded-lg bg-muted/30 border-muted/50 focus-visible:bg-card" />
                                </div>
                                <div className="space-y-2 group">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                        Fix Amount ($) <span className="text-destructive font-black">*</span>
                                    </label>
                                    <Input placeholder="0.00" className="h-10 rounded-lg bg-muted/30 border-muted/50 focus-visible:bg-card" />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button variant="gradient" className="h-11 px-10 rounded-xl font-bold tracking-tight shadow-lg shadow-primary/25">
                                Save Fees Master
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right: Fees Master List */}
            <div className="lg:col-span-2">
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-muted/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Wallet className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="font-bold text-lg tracking-tight">Fees Master List : 2025-26</h2>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Toolbar */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="relative w-full max-w-sm group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Search by group or code..."
                                    className="pl-10 h-10 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                    {[
                                        { icon: FileSpreadsheet, label: "Excel" },
                                        { icon: FileText, label: "CSV" },
                                        { icon: FileCode, label: "PDF" },
                                        { icon: Printer, label: "Print" }
                                    ].map((tool, i) => (
                                        <Button
                                            key={i}
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                                        >
                                            <tool.icon className="h-4 w-4" />
                                        </Button>
                                    ))}
                                </div>
                                <div className="h-8 w-px bg-muted/50 mx-2" />
                                <select className="h-10 px-3 rounded-xl border border-muted/50 bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
                                    <option>50</option>
                                    <option>100</option>
                                    <option>All</option>
                                </select>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="rounded-2xl border border-muted/50 overflow-hidden bg-muted/10 shadow-inner">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-muted/30">
                                            {[
                                                "Fees Group", "Fees Code", "Amount", "Fine Type",
                                                "Due Date", "Per Day", "Days-Fine Amount", "Action"
                                            ].map((header) => (
                                                <th key={header} className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 border-b border-muted/50 whitespace-nowrap text-center">
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-muted/50">
                                        {feesListData.map((group, gIdx) => (
                                            group.items.map((item, iIdx) => (
                                                <tr key={`${gIdx}-${iIdx}`} className="hover:bg-muted/20 transition-colors group/row">
                                                    {iIdx === 0 && (
                                                        <td rowSpan={group.items.length} className="px-4 py-6 text-sm font-black text-foreground border-r border-muted/50 w-32 bg-muted/5">
                                                            <div className="flex flex-col items-center gap-2">
                                                                <div className="p-2 bg-primary/10 rounded-full">
                                                                    <LayoutGrid className="h-3 w-3 text-primary" />
                                                                </div>
                                                                <span className="text-center leading-tight tracking-tight uppercase text-[10px]">{group.group}</span>
                                                            </div>
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-4 text-xs font-medium text-muted-foreground">{item.code}</td>
                                                    <td className="px-4 py-4 text-sm font-black text-foreground text-center">${item.amount}</td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className={cn(
                                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm",
                                                            item.fineType === "None" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                                                        )}>
                                                            {item.fineType}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center text-xs text-muted-foreground font-bold tracking-tight">{item.dueDate}</td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className={cn(
                                                            "text-[10px] font-black uppercase tracking-widest",
                                                            item.perDay === "Yes" ? "text-emerald-500" : "text-destructive/50"
                                                        )}>
                                                            {item.perDay}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-[10px] font-bold text-muted-foreground leading-relaxed w-48 italic">
                                                        {item.fineAmount}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover/row:opacity-100 transition-opacity translate-x-1 group-hover/row:translate-x-0 transition-transform">
                                                            <Button
                                                                size="icon"
                                                                className="h-8 w-8 rounded-lg bg-[#4F39F6] hover:bg-[#4F39F6]/90 text-white shadow-lg shadow-indigo-500/20 active:scale-90"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                className="h-8 w-8 rounded-lg bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20 active:scale-90"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        {/* Pagination */}
                        <div className="flex items-center justify-between pt-4">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                Showing 1 to 8 of 8 entries
                            </p>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all">
                                    <ChevronDown className="h-4 w-4 rotate-90" />
                                </Button>
                                <Button className="h-8 w-8 rounded-lg border-none p-0 text-white font-bold active:scale-95 transition-all shadow-md shadow-orange-500/10 bg-gradient-to-br from-[#FF9800] to-[#4F39F6]">1</Button>
                                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all">
                                    <ChevronDown className="h-4 w-4 -rotate-90" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
