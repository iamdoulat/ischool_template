"use client";

import { useState } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Search,
    ChevronDown,
    PlusCircle,
    FileSearch,
    ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function OfflinePaymentPage() {
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Title */}
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Offline Payment</h1>

            {/* Select Criteria Card */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-6 py-4 border-b border-muted/50">
                    <CardTitle className="text-lg font-bold tracking-tight">Select Criteria</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                Class <span className="text-destructive">*</span>
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
                                Section <span className="text-destructive">*</span>
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
                                Student <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <select className="flex h-11 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all appearance-none cursor-pointer">
                                    <option value="">Select</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end mt-6">
                        <Button className="h-10 px-8 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all">
                            <Search className="h-4 w-4" />
                            Search
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Offline Payment Card */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto relative">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/30 text-muted-foreground text-[10px] font-black uppercase tracking-widest border-y border-muted/50">
                                <tr>
                                    <th className="px-6 py-4">Course</th>
                                    <th className="px-6 py-4">Section</th>
                                    <th className="px-6 py-4">Lesson</th>
                                    <th className="px-6 py-4">Quiz</th>
                                    <th className="px-6 py-4">Exam</th>
                                    <th className="px-6 py-4">Assignment</th>
                                    <th className="px-6 py-4">Course Provider</th>
                                    <th className="px-6 py-4">Price ($)</th>
                                    <th className="px-6 py-4">Current Price ($)</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="group transition-colors">
                                    <td colSpan={10} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <p className="text-destructive/60 font-medium text-xs">No data available in table</p>

                                            {/* Folder Illustration Placeholder */}
                                            <div className="relative group/folder cursor-help mb-4">
                                                <div className="absolute -inset-4 bg-primary/5 rounded-full scale-0 group-hover/folder:scale-100 transition-transform duration-500" />
                                                <div className="relative p-6 bg-card rounded-2xl shadow-sm border border-muted/50">
                                                    <FileSearch className="h-16 w-16 text-muted-foreground/20 group-hover/folder:text-primary/40 transition-colors duration-500" />
                                                </div>
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/folder:opacity-100 transition-opacity duration-500">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                                                </div>
                                            </div>

                                            <button className="flex items-center gap-2 group/btn px-4 py-2 hover:bg-primary/5 rounded-full transition-all">
                                                <ArrowRight className="h-4 w-4 text-emerald-500 group-hover/btn:translate-x-1 transition-transform" />
                                                <span className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">Add new record or search with different criteria.</span>
                                            </button>
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
                                0
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
