"use client";

import { useState } from "react";
import {
    Search,
    FileText,
    Table as TableIcon,
    Printer,
    FileDown,
    ChevronDown,
    LayoutList,
    LayoutGrid,
    Plus,
    FileSearch,
    Download,
    Columns
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DisabledStudentsPage() {
    const [activeTab, setActiveTab] = useState("list");

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Select Criteria Section */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm">
                <CardHeader className="border-b border-muted/50 pb-4">
                    <CardTitle className="text-xl font-bold tracking-tight">Select Criteria</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                        <div className="md:col-span-3 space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                Class <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <select className="flex h-11 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all appearance-none cursor-pointer">
                                    <option value="">Select</option>
                                    <option>Class 1</option>
                                    <option>Class 2</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none group-focus-within:text-primary transition-colors" />
                            </div>
                        </div>

                        <div className="md:col-span-3 space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                Section
                            </label>
                            <div className="relative">
                                <select className="flex h-11 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all appearance-none cursor-pointer">
                                    <option value="">Select</option>
                                    <option>A</option>
                                    <option>B</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none group-focus-within:text-primary transition-colors" />
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button variant="gradient" className="h-11 px-8 rounded-xl">
                                    <Search className="h-4 w-4" /> Search
                                </Button>
                            </div>
                        </div>

                        <div className="md:col-span-6 space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                Search By Keyword
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Search By Student Name, Roll Number, Enroll Number, National Id, Local Id Etc."
                                    className="h-11 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all"
                                />
                                <Button variant="gradient" className="h-11 px-8 rounded-xl">
                                    <Search className="h-4 w-4" /> Search
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* View Selection & Table Section */}
            <div className="space-y-4">
                {/* Tabs */}
                <div className="flex border-b border-muted/50">
                    <button
                        onClick={() => setActiveTab("list")}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all relative",
                            activeTab === "list" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <LayoutList className="h-4 w-4" />
                        List View
                        {activeTab === "list" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab("details")}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all relative",
                            activeTab === "details" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <LayoutGrid className="h-4 w-4" />
                        Details View
                        {activeTab === "details" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
                    </button>
                </div>

                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                    <CardContent className="p-6">
                        {/* Toolbar */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search"
                                    className="pl-10 h-10 rounded-lg bg-muted/30 border-muted/50"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 mr-4">
                                    <span className="text-sm font-semibold text-muted-foreground">50</span>
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex gap-1">
                                    <IconButton icon={Printer} />
                                    <IconButton icon={FileText} />
                                    <IconButton icon={TableIcon} />
                                    <IconButton icon={FileDown} />
                                    <IconButton icon={Download} />
                                    <IconButton icon={Columns} />
                                </div>
                            </div>
                        </div>

                        {/* List View Table */}
                        <div className="min-h-[400px] flex flex-col">
                            <div className="overflow-x-auto rounded-xl border border-muted/50 border-b-0">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        <tr>
                                            <Th>Admission No</Th>
                                            <Th>Student Name</Th>
                                            <Th>Class</Th>
                                            <Th>Father Name</Th>
                                            <Th>Disable Reason</Th>
                                            <Th>Gender</Th>
                                            <Th>Mobile Number</Th>
                                            <Th className="text-right">Action</Th>
                                        </tr>
                                    </thead>
                                </table>
                            </div>

                            {/* Empty State */}
                            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-6">
                                <div className="relative">
                                    <div className="absolute -inset-4 bg-primary/5 rounded-full blur-2xl animate-pulse" />
                                    <div className="relative bg-muted/20 p-8 rounded-full border border-muted/50">
                                        <FileSearch className="h-16 w-16 text-muted-foreground/30" />
                                    </div>
                                    <div className="absolute top-0 right-0 bg-primary/10 p-2 rounded-lg -rotate-12 border border-primary/20">
                                        <Plus className="h-4 w-4 text-primary" />
                                    </div>
                                </div>
                                <div className="space-y-2 max-w-xs">
                                    <p className="text-red-400 font-bold text-sm">No data available in table</p>
                                    <button className="flex items-center gap-2 text-primary hover:underline font-bold text-sm mx-auto transition-all hover:gap-3">
                                        <span>←</span> Add new record or search with different criteria.
                                    </button>
                                </div>

                                {/* SVG Illustration from Image (Simplified simplified representation) */}
                                <div className="w-48 h-32 opacity-20">
                                    <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full grayscale">
                                        <rect x="50" y="20" width="100" height="80" rx="4" fill="currentColor" />
                                        <rect x="60" y="40" width="80" height="2" fill="white" />
                                        <rect x="60" y="50" width="60" height="2" fill="white" />
                                        <rect x="60" y="60" width="70" height="2" fill="white" />
                                        <circle cx="150" cy="90" r="15" fill="currentColor" />
                                        <path d="M145 90H155M150 85V95" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground font-medium">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Showing 0 to 0 of 0 entries</p>
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
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Helper Components
function Th({ children, className }: { children: React.ReactNode, className?: string }) {
    return <th className={cn("px-4 py-4 border-b border-muted/50", className)}>{children}</th>;
}

function IconButton({ icon: Icon }: { icon: any }) {
    return (
        <button className="p-2 hover:bg-muted rounded-lg transition-colors border border-muted/50 text-muted-foreground hover:text-foreground shadow-sm">
            <Icon className="h-4 w-4" />
        </button>
    );
}
