"use client";

import { useState } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Plus,
    Search,
    FileSpreadsheet,
    FileText,
    FileDigit,
    Printer,
    Trash2,
    FileUp,
    ChevronDown,
    Loader2,
    Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function QuestionBankPage() {
    const [viewEntries, setViewEntries] = useState(100);
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Select Criteria Card */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="px-6 py-4 border-b border-muted/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Search className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg font-bold tracking-tight">Select Criteria</CardTitle>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button className="h-9 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all">
                            <Plus className="h-4 w-4" />
                            Add Tag
                        </Button>
                        <Button className="h-9 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all">
                            <Plus className="h-4 w-4" />
                            Add Question
                        </Button>
                        <Button className="h-9 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all">
                            <FileUp className="h-4 w-4" />
                            Import
                        </Button>
                        <Button className="h-9 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all">
                            <Trash2 className="h-4 w-4" />
                            Bulk Delete
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                Question Tag
                            </label>
                            <div className="relative">
                                <select className="flex h-11 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all appearance-none cursor-pointer">
                                    <option value="">Select</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                Question Type
                            </label>
                            <div className="relative">
                                <select className="flex h-11 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all appearance-none cursor-pointer">
                                    <option value="">Select</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                Question Level
                            </label>
                            <div className="relative">
                                <select className="flex h-11 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all appearance-none cursor-pointer">
                                    <option value="">Select</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                Created By
                            </label>
                            <div className="relative">
                                <select className="flex h-11 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all appearance-none cursor-pointer">
                                    <option value="">Select</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                        <div className="lg:col-start-4 flex justify-end pt-2 sm:pt-0">
                            <Button className="h-10 px-8 min-w-[140px] rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all">
                                <Search className="h-4 w-4" />
                                Search
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Question Bank Card */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="px-6 py-4 border-b border-muted/50">
                    <CardTitle className="text-lg font-bold tracking-tight">Question Bank</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Table Tools */}
                    <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-muted/20">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-10 rounded-lg bg-muted/20 border-muted/30 focus-visible:ring-primary/20 transition-all shadow-sm"
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                            <div className="flex items-center bg-muted/20 border border-muted/30 rounded-lg px-3 h-10 shadow-sm">
                                <select
                                    value={viewEntries}
                                    onChange={(e) => setViewEntries(Number(e.target.value))}
                                    className="bg-transparent text-xs font-bold border-none focus:ring-0 cursor-pointer min-w-[60px]"
                                >
                                    <option value={100}>100</option>
                                    <option value={50}>50</option>
                                    <option value={20}>20</option>
                                </select>
                                <ChevronDown className="h-3 w-3 text-muted-foreground ml-1 pointer-events-none" />
                            </div>
                            <div className="h-8 w-[1px] bg-muted/30 mx-1 hidden sm:block" />
                            <div className="flex items-center gap-1">
                                <TableToolButton icon={Copy} />
                                <TableToolButton icon={FileSpreadsheet} />
                                <TableToolButton icon={FileText} />
                                <TableToolButton icon={FileDigit} />
                                <TableToolButton icon={Printer} />
                            </div>
                        </div>
                    </div>

                    {/* Table Content */}
                    <div className="overflow-x-auto relative min-h-[400px]">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/30 text-muted-foreground text-[10px] font-black uppercase tracking-widest border-b border-muted/50">
                                <tr>
                                    <th className="px-6 py-4 w-12 text-center">
                                        <div className="flex items-center justify-center">
                                            <div className="w-4 h-4 rounded border border-muted/50" />
                                        </div>
                                    </th>
                                    <th className="px-6 py-4">Q. ID</th>
                                    <th className="px-6 py-4">Question Tag</th>
                                    <th className="px-6 py-4">Question Type</th>
                                    <th className="px-6 py-4">Level</th>
                                    <th className="px-6 py-4">Question</th>
                                    <th className="px-6 py-4">Created By</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="group border-b border-muted/20 hover:bg-muted/10 transition-colors">
                                    <td colSpan={8} className="px-6 py-32 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="relative">
                                                <Loader2 className="h-12 w-12 text-primary/40 animate-spin" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-slate-700">Loading...</p>
                                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.2em]">Preparing Question Bank</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="px-6 py-4 bg-muted/10 border-t border-muted/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                            Showing 0 to 0 of 0 entries
                        </p>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all">
                                <ChevronDown className="h-4 w-4 rotate-90" />
                            </Button>
                            <Button className="h-8 w-8 rounded-lg border-none p-0 text-white font-bold active:scale-95 transition-all shadow-md shadow-orange-500/10 bg-gradient-to-r from-[#FF9800] to-[#6366F1]">
                                1
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all">
                                <ChevronDown className="h-4 w-4 -rotate-90" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function TableToolButton({ icon: Icon }: { icon: any }) {
    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 active:scale-90 transition-all"
        >
            <Icon className="h-4 w-4" />
        </Button>
    );
}
