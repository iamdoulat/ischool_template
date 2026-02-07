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
    FileText,
    FileSearch,
    ArrowRight,
    BarChart3,
    Trophy,
    CheckCircle2,
    Users,
    Activity,
    ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const reportTypes = [
    { name: "Student Course Purchase Report", icon: FileText, active: true },
    { name: "Course Sell Count Report", icon: ShoppingBag, active: false },
    { name: "Course Trending Report", icon: Activity, active: false },
    { name: "Course Complete Report", icon: CheckCircle2, active: false },
    { name: "Course Assignment Report", icon: FileText, active: false },
    { name: "Course Exam Result Report", icon: Trophy, active: false },
    { name: "Course Exam Attempt Report", icon: BarChart3, active: false },
];

export default function OnlineCourseReportPage() {
    const [selectedReport, setSelectedReport] = useState("Student Course Purchase Report");

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Title */}
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Online Course Report</h1>

            {/* Report Selection Grid */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {reportTypes.map((report) => (
                            <button
                                key={report.name}
                                onClick={() => setSelectedReport(report.name)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all text-left group",
                                    selectedReport === report.name
                                        ? "bg-muted text-primary shadow-sm"
                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                )}
                            >
                                <report.icon className={cn(
                                    "h-4 w-4 transition-colors",
                                    selectedReport === report.name ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                )} />
                                <span className="truncate">{report.name}</span>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Filter Section */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-6 py-4 border-b border-muted/50">
                    <CardTitle className="text-lg font-bold tracking-tight">{selectedReport}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                        <FilterSelect label="Search Type" required />
                        <FilterSelect label="Payment Type" required defaultValue="All" />
                        <FilterSelect label="Payment Status" defaultValue="Success" />
                        <FilterSelect label="Users Type" defaultValue="All" />

                        <div className="lg:col-start-4 flex justify-end">
                            <Button className="h-10 px-8 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all">
                                <Search className="h-4 w-4" />
                                Search
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results Table */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto relative">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/30 text-muted-foreground text-[10px] font-black uppercase tracking-widest border-y border-muted/50">
                                <tr>
                                    <th className="px-6 py-4">Student / Guest</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Course</th>
                                    <th className="px-6 py-4">Course Provider</th>
                                    <th className="px-6 py-4">Payment Type</th>
                                    <th className="px-6 py-4">Payment Method</th>
                                    <th className="px-6 py-4 text-right">Price ($)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="group transition-colors">
                                    <td colSpan={7} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <p className="text-destructive/60 font-medium text-xs">No data available in table</p>

                                            <div className="relative group/folder cursor-help mb-4">
                                                <div className="absolute -inset-4 bg-primary/5 rounded-full scale-0 group-hover/folder:scale-100 transition-transform duration-500" />
                                                <div className="relative p-6 bg-card rounded-2xl shadow-sm border border-muted/50">
                                                    <FileSearch className="h-16 w-16 text-muted-foreground/20 group-hover/folder:text-primary/40 transition-colors duration-500" />
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

function FilterSelect({ label, required, defaultValue }: { label: string, required?: boolean, defaultValue?: string }) {
    return (
        <div className="space-y-2 group">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                {label} {required && <span className="text-destructive">*</span>}
            </label>
            <div className="relative">
                <select className="flex h-11 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all appearance-none cursor-pointer">
                    <option value="">{defaultValue || "Select"}</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
        </div>
    );
}
