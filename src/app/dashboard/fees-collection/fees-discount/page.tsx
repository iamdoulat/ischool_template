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
    Tag,
    LayoutGrid,
    BadgePercent,
    ChevronDown
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const discounts = [
    { name: "RKS Discount 1", code: "rksdisc01", percentage: "-", amount: "100.00", useCount: "5", expiryDate: "01/31/2026" },
    { name: "Sibling Discount", code: "sibling-disc", percentage: "-", amount: "300.00", useCount: "10", expiryDate: "-" },
    { name: "Handicapped Discount", code: "handicap-disc", percentage: "-", amount: "350.00", useCount: "10", expiryDate: "01/15/2026" },
    { name: "Class Topper Discount", code: "cls-top-disc", percentage: "100.00", amount: "-", useCount: "20", expiryDate: "-" },
];

export default function FeesDiscountPage() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
            {/* Left Column: Add Fees Discount Form */}
            <div className="lg:col-span-1">
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden sticky top-24">
                    <div className="px-6 py-4 border-b border-muted/50 flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Plus className="h-5 w-5 text-primary" />
                        </div>
                        <h2 className="font-bold text-lg tracking-tight">Add Fees Discount</h2>
                    </div>
                    <CardContent className="p-6 space-y-5">
                        <div className="space-y-4">
                            {/* Name */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                    Name <span className="text-destructive font-black">*</span>
                                </label>
                                <Input
                                    placeholder="Enter discount name"
                                    className="h-11 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium border-[#4F39F6]/20 focus-visible:border-[#4F39F6]"
                                />
                            </div>

                            {/* Discount Code */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                    Discount Code <span className="text-destructive font-black">*</span>
                                </label>
                                <Input
                                    placeholder="Enter discount code"
                                    className="h-11 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium"
                                />
                            </div>

                            {/* Discount Type */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">
                                    Discount Type
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { id: "percentage", label: "Percentage" },
                                        { id: "fix", label: "Fix Amount", checked: true }
                                    ].map((type) => (
                                        <label key={type.id} className="flex items-center gap-3 p-3 rounded-xl border border-muted/50 bg-muted/20 cursor-pointer hover:bg-primary/5 transition-all group">
                                            <input
                                                type="radio"
                                                name="discountType"
                                                defaultChecked={type.checked}
                                                className="w-4 h-4 text-[#4F39F6] bg-muted border-muted focus:ring-[#4F39F6]/20"
                                            />
                                            <span className="text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors">{type.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Percentage / Amount Row */}
                            <div className="grid grid-cols-2 gap-4 pt-1">
                                <div className="space-y-2 group">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                        Percentage (%) <span className="text-destructive font-black">*</span>
                                    </label>
                                    <Input
                                        placeholder="0"
                                        className="h-10 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium"
                                    />
                                </div>
                                <div className="space-y-2 group">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                        Amount ($) <span className="text-destructive font-black">*</span>
                                    </label>
                                    <Input
                                        placeholder="0.00"
                                        className="h-10 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            {/* Use Count / Expiry Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors leading-none">
                                        Number Of Use Count <span className="text-destructive font-black">*</span>
                                    </label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        className="h-10 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium"
                                    />
                                </div>
                                <div className="space-y-2 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                        Expiry Date
                                    </label>
                                    <Input
                                        type="date"
                                        className="h-10 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                    Description
                                </label>
                                <Textarea
                                    placeholder="Enter description"
                                    className="min-h-[100px] rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium resize-none text-xs"
                                />
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <Button className="h-11 px-10 rounded-full bg-gradient-to-r from-[#FF9800] to-[#4F39F6] hover:from-[#F57C00] hover:to-[#3F2BDB] text-white font-bold shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.05] active:scale-95 border-none">
                                Save
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Fees Discount List */}
            <div className="lg:col-span-2">
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-muted/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <BadgePercent className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="font-bold text-lg tracking-tight">Fees Discount List</h2>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Toolbar */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="relative w-full max-w-sm group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Search..."
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
                                                "Name", "Discount Code", "Percentage (%)", "Amount ($)", "Number of Use Count", "Expiry Date", "Action"
                                            ].map((header) => (
                                                <th key={header} className={cn(
                                                    "px-4 py-4 text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground/70 border-b border-muted/50 whitespace-nowrap",
                                                    header === "Action" ? "text-center w-36" : ""
                                                )}>
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-muted/50">
                                        {discounts.map((discount, idx) => (
                                            <tr key={idx} className="hover:bg-muted/20 transition-colors group/row">
                                                <td className="px-4 py-4 text-sm font-bold text-foreground">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 bg-primary/10 rounded-lg group-hover/row:bg-primary/20 transition-colors">
                                                            <LayoutGrid className="h-3.5 w-3.5 text-primary" />
                                                        </div>
                                                        {discount.name}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-xs font-medium text-muted-foreground uppercase tracking-tight">
                                                    {discount.code}
                                                </td>
                                                <td className="px-4 py-4 text-sm font-medium text-muted-foreground italic text-center">
                                                    {discount.percentage}
                                                </td>
                                                <td className="px-4 py-4 text-sm font-bold text-foreground text-center">
                                                    {discount.amount !== "-" ? `$${discount.amount}` : "-"}
                                                </td>
                                                <td className="px-4 py-4 text-sm font-bold text-foreground text-center">
                                                    {discount.useCount}
                                                </td>
                                                <td className="px-4 py-4 text-xs font-bold text-muted-foreground text-center">
                                                    {discount.expiryDate}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center justify-center gap-1.5 translate-x-1 group-hover/row:translate-x-0 transition-transform">
                                                        <Button
                                                            size="icon"
                                                            title="Assign"
                                                            className="h-8 w-8 rounded-lg bg-[#4F39F6] hover:bg-[#4F39F6]/90 text-white shadow-lg shadow-indigo-500/20 active:scale-90"
                                                        >
                                                            <Tag className="h-3.5 w-3.5" />
                                                        </Button>
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

                        <div className="flex items-center justify-between pt-4">
                            <p className="text-xs font-medium text-muted-foreground italic">
                                Showing 1 to 4 of 4 entries
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
