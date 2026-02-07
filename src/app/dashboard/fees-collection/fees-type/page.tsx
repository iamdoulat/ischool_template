"use client";

import {
    Plus,
    Search,
    FileSpreadsheet,
    FileText,
    FileCode,
    Printer,
    Pencil,
    Trash2,
    LayoutGrid,
    Wallet
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const feesTypes = [
    { name: "Admission Fees", code: "admission-fees" },
    { name: "1st Installment Fees", code: "1-installment-fees" },
    { name: "2nd Installment Fees", code: "2-installment-fees" },
    { name: "3rd Installment Fees", code: "3-installment-fees" },
    { name: "4th Installment Fees", code: "4-installment-fees" },
    { name: "5th Installment Fees", code: "5-installment-fees" },
    { name: "6th Installment Fees", code: "6-installment-fees" },
    { name: "April Month Fees", code: "apr-month-fees" },
    { name: "August Month Fees", code: "aug-month-fees" },
    { name: "Bus-fees", code: "Bus-fees" },
    { name: "Caution Money Fees", code: "caution-money-fees" },
    { name: "Certificate fee", code: "Cert-Fee" },
    { name: "December Month Fees", code: "dec-month-fees" },
    { name: "Exam Fees", code: "exam-fees" },
    { name: "February Month Fees", code: "feb-month-fees" },
];

export default function FeesTypePage() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
            {/* Left Column: Add Fees Type Form */}
            <div className="lg:col-span-1">
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden sticky top-24">
                    <div className="px-6 py-4 border-b border-muted/50 flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Plus className="h-5 w-5 text-primary" />
                        </div>
                        <h2 className="font-bold text-lg tracking-tight">Add Fees Type</h2>
                    </div>
                    <CardContent className="p-6 space-y-5">
                        <div className="space-y-4">
                            {/* Name */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                    Name <span className="text-destructive font-black">*</span>
                                </label>
                                <Input
                                    placeholder="Enter fees type name"
                                    className="h-11 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium border-[#4F39F6]/20 focus-visible:border-[#4F39F6]"
                                />
                            </div>

                            {/* Fees Code */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                    Fees Code <span className="text-destructive font-black">*</span>
                                </label>
                                <Input
                                    placeholder="Enter fees code"
                                    className="h-11 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                    Description
                                </label>
                                <Textarea
                                    placeholder="Enter description"
                                    className="min-h-[120px] rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium resize-none text-xs"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button variant="gradient" className="h-11 px-10 rounded-xl font-bold tracking-tight shadow-lg shadow-primary/25">
                                Save Fees Type
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Fees Type List */}
            <div className="lg:col-span-2">
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-muted/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Wallet className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="font-bold text-lg tracking-tight">Fees Type List</h2>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Toolbar */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="relative w-full max-w-sm group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Search by name or code..."
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
                                                "Name", "Fees Code", "Action"
                                            ].map((header) => (
                                                <th key={header} className={cn(
                                                    "px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 border-b border-muted/50 whitespace-nowrap",
                                                    header === "Action" ? "text-center w-24" : ""
                                                )}>
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-muted/50">
                                        {feesTypes.map((type, idx) => (
                                            <tr key={idx} className="hover:bg-muted/20 transition-colors group/row">
                                                <td className="px-6 py-4 text-sm font-bold text-foreground">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 bg-primary/10 rounded-lg group-hover/row:bg-primary/20 transition-colors">
                                                            <LayoutGrid className="h-3.5 w-3.5 text-primary" />
                                                        </div>
                                                        {type.name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-tight">
                                                    {type.code}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-1.5 translate-x-1 group-hover/row:translate-x-0 transition-transform">
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
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
