"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Search, ChevronLeft, ChevronRight, FileText, Wallet, Users, 
    BarChart, Activity, Download, Printer, RefreshCw, 
    TrendingDown, TrendingUp, PieChart, Info, Map
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportItem {
    id: string;
    branch: string;
    name: string;
    invoice: string;
    head: string;
    date: string;
    amount: number;
}

export default function ReportPage() {
    const { toast } = useToast();
    const [activeReport, setActiveReport] = useState("expense");
    const [searchTerm, setSearchTerm] = useState("");
    const [reportData, setReportData] = useState<ReportItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [grandTotal, setGrandTotal] = useState(0);

    const reportTypes = [
        { id: "daily", label: "Daily Collection", icon: FileText, color: "text-blue-500", bg: "bg-blue-50" },
        { id: "expense", label: "Expenses Matrix", icon: Wallet, color: "text-rose-500", bg: "bg-rose-50" },
        { id: "payroll", label: "Payroll Audit", icon: Users, color: "text-indigo-500", bg: "bg-indigo-50" },
        { id: "income", label: "Income Stream", icon: BarChart, color: "text-emerald-500", bg: "bg-emerald-50" },
        { id: "userlog", label: "System Activity", icon: Activity, color: "text-amber-500", bg: "bg-amber-50" },
    ];

    useEffect(() => {
        fetchReport();
    }, [activeReport]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await api.get('/multi-branch/reports', {
                params: {
                    type: activeReport,
                    search: searchTerm
                }
            });
            setReportData(response.data.data || []);
            setGrandTotal(response.data.grand_total || 0);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch analytical report", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Report Strategy Header */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {reportTypes.map((report) => {
                    const Icon = report.icon;
                    const isActive = activeReport === report.id;
                    return (
                        <button
                            key={report.id}
                            onClick={() => setActiveReport(report.id)}
                            className={cn(
                                "flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border-2 transition-all duration-300 group relative overflow-hidden",
                                isActive 
                                    ? "border-orange-500 bg-orange-50/50 shadow-xl shadow-orange-100/50 scale-[1.02] z-10" 
                                    : "border-gray-50 bg-white hover:border-gray-200 hover:shadow-lg"
                            )}
                        >
                            <div className={cn(
                                "h-12 w-12 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 shadow-inner",
                                isActive ? "bg-orange-500 text-white" : cn(report.bg, report.color)
                            )}>
                                <Icon className="h-6 w-6" />
                            </div>
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest text-center",
                                isActive ? "text-orange-700" : "text-gray-400 group-hover:text-gray-600"
                            )}>
                                {report.label}
                            </span>
                            {isActive && (
                                <div className="absolute -bottom-1 h-1 w-12 bg-orange-500 rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>

            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                        <div className="space-y-4 flex-1">
                            <div className="flex items-center gap-3">
                                <Map className="h-5 w-5 text-orange-500" />
                                <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Cross-Branch Audit Parameters</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Analytical Filter</label>
                                    <Select defaultValue="keyword">
                                        <SelectTrigger className="h-12 bg-white border-gray-100 rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-none">
                                            <SelectValue placeholder="Select search type" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-gray-100">
                                            <SelectItem value="keyword">Node Keyword</SelectItem>
                                            <SelectItem value="branch">Institutional Node</SelectItem>
                                            <SelectItem value="date">Temporal Range</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Global Search</label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-4 h-4 w-4 text-gray-400" />
                                        <Input 
                                            placeholder="Search node records..." 
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="h-12 pl-12 border-gray-100 bg-white rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Button 
                            onClick={fetchReport}
                            className="h-12 px-12 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-[11px] font-black uppercase gap-3 shadow-xl shadow-orange-200/50 active:scale-95 transition-all"
                        >
                            <Activity className="h-4 w-4" />
                            Execute Global Audit
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Data Visualization Table */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-8 py-6 border-b border-muted/50 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shadow-inner">
                            <PieChart className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg font-black tracking-tight text-slate-700 uppercase">
                            {activeReport.replace('log', ' Log')} Report Matrix
                        </CardTitle>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-orange-50 hover:text-orange-600 rounded-xl transition-all"><Download className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-orange-50 hover:text-orange-600 rounded-xl transition-all"><Printer className="h-4 w-4" /></Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow className="hover:bg-transparent border-b border-muted/20">
                                    <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5 pl-8">Institutional Node</TableHead>
                                    <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5">Record Identifier</TableHead>
                                    <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5">Node Reference</TableHead>
                                    <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5">Allocation Head</TableHead>
                                    <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5 text-center">Temporal Index</TableHead>
                                    <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5 pr-8 text-right">Value Node ($)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-48 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Aggregating Cross-Node Intelligence...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : reportData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-gray-400 text-[11px] font-bold uppercase tracking-widest italic">
                                            No analytical records indexed for active parameters.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    reportData.map((row, index) => (
                                        <TableRow key={row.id} className={cn(
                                            "hover:bg-orange-50/20 border-b border-muted/10 transition-colors group",
                                            index % 2 === 0 ? 'bg-white' : 'bg-muted/5'
                                        )}>
                                            <TableCell className="py-5 pl-8">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 font-bold text-[10px]">
                                                        {row.branch?.[0]}
                                                    </div>
                                                    <span className="text-slate-700 text-[11px] font-black uppercase tracking-tight">{row.branch}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-600 text-[11px] font-bold py-5 uppercase tracking-tighter">{row.name}</TableCell>
                                            <TableCell className="py-5">
                                                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest border border-gray-200">
                                                    {row.invoice}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-slate-500 text-[10px] py-5 font-black uppercase tracking-[0.1em]">
                                                <div className="flex items-center gap-2">
                                                    <Info className="h-3 w-3 text-orange-400" />
                                                    {row.head}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-600 text-[10px] font-bold py-5 text-center uppercase tracking-widest">{row.date}</TableCell>
                                            <TableCell className="text-slate-900 text-xs pr-8 py-5 text-right font-black tabular-nums tracking-widest">
                                                ${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Report Analytics Footer */}
                    <div className="p-8 border-t border-muted/20 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Global Audit Coverage:</span>
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight italic">Showing 1 to {reportData.length} of {reportData.length} nodal entries identified</span>
                        </div>
                        
                        <div className="flex items-center gap-10">
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" size="icon" className="h-10 w-10 rounded-2xl border-muted/50 hover:bg-orange-50 hover:text-orange-600 transition-all shadow-sm"
                                    disabled={loading || reportData.length === 0}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button size="icon" className="h-10 w-10 rounded-2xl bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-lg font-black text-xs">
                                    1
                                </Button>
                                <Button 
                                    variant="outline" size="icon" className="h-10 w-10 rounded-2xl border-muted/50 hover:bg-orange-50 hover:text-orange-600 transition-all shadow-sm"
                                    disabled={loading || reportData.length === 0}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Aggregate Node Valuation:</span>
                                <div className={cn(
                                    "px-8 py-3 rounded-2xl border-2 font-black text-lg tabular-nums shadow-xl transition-all duration-500",
                                    activeReport === 'income' ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-emerald-100" : "bg-rose-50 border-rose-500 text-rose-700 shadow-rose-100"
                                )}>
                                    ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
