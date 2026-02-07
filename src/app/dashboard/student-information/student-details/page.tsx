"use client";

import { useState } from "react";
import {
    Search,
    ListFilter,
    LayoutList,
    LayoutGrid,
    FolderSearch,
    Plus,
    ChevronDown
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function StudentDetailsPage() {
    const [viewMode, setViewMode] = useState<"list" | "details">("list");

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Select Criteria Card */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-muted/50 flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <ListFilter className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="font-bold text-lg tracking-tight">Select Criteria</h2>
                </div>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                        {/* Class and Section fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                    Class <span className="text-destructive">*</span>
                                </label>
                                <div className="relative">
                                    <select className="flex h-11 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all appearance-none cursor-pointer">
                                        <option value="">Select Class</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                    Section
                                </label>
                                <div className="relative">
                                    <select className="flex h-11 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all appearance-none cursor-pointer">
                                        <option value="">Select Section</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                            <div className="sm:col-span-2 flex justify-end">
                                <Button variant="gradient" className="h-11 px-8">
                                    <Search className="h-4 w-4" />
                                    Search
                                </Button>
                            </div>
                        </div>

                        {/* Search By Keyword field */}
                        <div className="space-y-4 border-l border-muted/50 pl-8 hidden md:block">
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                    Search By Keyword
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        placeholder="Search By Student Name, Roll Number, Enroll Number, National Id, etc."
                                        className="h-11 pl-11 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button variant="gradient" className="h-11 px-8">
                                    <Search className="h-4 w-4" />
                                    Search
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results Table Card */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="border-b border-muted/50">
                    <div className="flex px-2">
                        <button
                            onClick={() => setViewMode("list")}
                            className={cn(
                                "flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative",
                                viewMode === "list" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <LayoutList className="h-4 w-4" />
                            List View
                            {viewMode === "list" && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(var(--primary),0.5)]" />
                            )}
                        </button>
                        <button
                            onClick={() => setViewMode("details")}
                            className={cn(
                                "flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative",
                                viewMode === "details" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <LayoutGrid className="h-4 w-4" />
                            Details View
                            {viewMode === "details" && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(var(--primary),0.5)]" />
                            )}
                        </button>
                    </div>
                </div>

                <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/30">
                                {[
                                    "Admission No", "Student Name", "Roll No.", "Class",
                                    "Father Name", "Date Of Birth", "Gender", "Category",
                                    "Mobile Number", "Action"
                                ].map((header) => (
                                    <th key={header} className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 border-b border-muted/50 whitespace-nowrap">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                    </table>

                    {/* Empty State */}
                    <div className="py-24 flex flex-col items-center justify-center text-center space-y-6">
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="relative p-8 bg-muted/30 rounded-[2.5rem] border border-muted/50 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                <img
                                    src="https://cdn-icons-png.flaticon.com/512/7486/7486744.png"
                                    alt="No Data"
                                    className="h-24 w-24 object-contain opacity-80 drop-shadow-2xl grayscale group-hover:grayscale-0 transition-all duration-500"
                                />
                                <div className="absolute -bottom-2 -right-2 p-3 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-muted/50">
                                    <FolderSearch className="h-6 w-6 text-amber-500" />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="font-black text-xl tracking-tight text-foreground uppercase">
                                No Data Available In Table
                            </p>
                            <p className="text-sm text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
                                Use the search filters above to find students or add a new record.
                            </p>
                        </div>
                        <Button variant="gradient" className="h-12 px-8 rounded-2xl">
                            <Plus className="h-5 w-5" />
                            Add new record or search with different criteria
                        </Button>
                    </div>
                </div>

                <div className="px-6 py-4 bg-muted/10 border-t border-muted/50 flex items-center justify-between">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        Showing 0 to 0 of 0 entries
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
            </Card>
        </div>
    );
}
