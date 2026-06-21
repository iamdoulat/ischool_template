"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search, FileText, Wallet, Users, BarChart, Activity,
    Copy, FileSpreadsheet, Printer, PieChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/components/providers/currency-provider";

interface ReportItem {
    id: string;
    branch: string;
    name: string;
    invoice: string;
    head: string;
    date: string;
    amount: number;
}

const REPORT_TYPES = [
    { id: "daily", label: "Daily Collection", icon: FileText },
    { id: "expense", label: "Expenses", icon: Wallet },
    { id: "payroll", label: "Payroll", icon: Users },
    { id: "income", label: "Income", icon: BarChart },
    { id: "userlog", label: "System Activity", icon: Activity },
];

const TABLE_COLS = 6;

function SkeletonRows({ rows = 6 }: { rows?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <TableRow key={i} className="border-b border-gray-50">
                    {Array.from({ length: TABLE_COLS }).map((_, j) => (
                        <TableCell key={j} className="py-3">
                            <div className="h-3 rounded bg-gray-200/70 animate-pulse" style={{ width: `${55 + ((i * 3 + j * 7) % 40)}%` }} />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export default function ReportPage() {
    const { toast } = useToast();
    const { selectedCurrency } = useCurrency();
    const cur = selectedCurrency?.symbol || "$";

    const [activeReport, setActiveReport] = useState("expense");
    const [searchTerm, setSearchTerm] = useState("");
    const [reportData, setReportData] = useState<ReportItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [grandTotal, setGrandTotal] = useState(0);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await api.get("/multi-branch/reports", { params: { type: activeReport, search: searchTerm } });
            setReportData(response.data.data || []);
            setGrandTotal(response.data.grand_total || 0);
        } catch {
            toast({ title: "Error", description: "Failed to fetch report", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeReport]);

    const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const handleCopy = () => {
        navigator.clipboard.writeText(reportData.map((r) => `${r.branch}\t${r.name}\t${r.invoice}\t${r.head}\t${r.date}\t${r.amount}`).join("\n"));
        toast({ title: "Copied", description: "Data copied to clipboard" });
    };
    const handleExportCSV = () => {
        const rows = [["Branch", "Name", "Invoice", "Head", "Date", "Amount"],
            ...reportData.map((r) => [r.branch, r.name, r.invoice, r.head, r.date, String(r.amount)])];
        const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `multi_branch_${activeReport}_report.csv`;
        link.click();
    };

    const toolbarActions = [
        { Icon: Copy, onClick: handleCopy, title: "Copy" },
        { Icon: FileSpreadsheet, onClick: handleExportCSV, title: "Excel" },
        { Icon: FileText, onClick: handleExportCSV, title: "CSV" },
        { Icon: Printer, onClick: () => window.print(), title: "Print" },
    ];

    const activeLabel = REPORT_TYPES.find((r) => r.id === activeReport)?.label || activeReport;

    return (
        <div className="space-y-6">
            {/* Report type selector */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {REPORT_TYPES.map((report) => {
                    const Icon = report.icon;
                    const isActive = activeReport === report.id;
                    return (
                        <button
                            key={report.id}
                            onClick={() => setActiveReport(report.id)}
                            className={cn(
                                "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-200",
                                isActive
                                    ? "border-transparent bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] shadow-md ring-1 ring-[#6366F1]/30"
                                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                            )}
                        >
                            <span className={cn(
                                "h-10 w-10 rounded-lg flex items-center justify-center transition-all",
                                isActive ? "bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm" : "bg-gray-100 text-gray-500"
                            )}>
                                <Icon className="h-5 w-5" />
                            </span>
                            <span className={cn("text-[10px] font-bold uppercase tracking-wide text-center", isActive ? "text-slate-800" : "text-gray-500")}>
                                {report.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Report table */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <PieChart className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{activeLabel} Report</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">Cross-branch aggregated records</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                        <form onSubmit={(e) => { e.preventDefault(); fetchReport(); }} className="flex items-center gap-2 w-full md:w-auto">
                            <Input placeholder="Search records..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-3 h-9 text-xs w-full md:w-64" />
                            <Button type="submit" className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all">
                                <Search className="h-4 w-4" /> Search
                            </Button>
                        </form>
                        <div className="flex items-center border rounded-md p-1 bg-gray-50 text-gray-500 self-end md:self-auto">
                            {toolbarActions.map((a, i) => (
                                <Button key={i} variant="ghost" size="icon" onClick={a.onClick} title={a.title} className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200"><a.Icon className="h-4 w-4" /></Button>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-md border overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[820px]">
                            <TableHeader className="bg-gray-50 text-xs uppercase">
                                <TableRow className="hover:bg-transparent whitespace-nowrap">
                                    <TableHead className="font-semibold text-gray-600">Branch</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Name</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Invoice</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Head</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-center">Date</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">Amount ({cur})</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <SkeletonRows />
                                ) : reportData.length === 0 ? (
                                    <TableRow><TableCell colSpan={TABLE_COLS} className="py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">No records found</TableCell></TableRow>
                                ) : reportData.map((row) => (
                                    <TableRow key={row.id} className="text-xs hover:bg-gray-50/60 transition-colors whitespace-nowrap">
                                        <TableCell className="py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 font-bold text-[10px]">{row.branch?.[0]}</span>
                                                <span className="font-medium text-gray-700">{row.branch}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3 text-gray-600">{row.name}</TableCell>
                                        <TableCell className="py-3"><span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium text-[10px] border border-gray-200">{row.invoice}</span></TableCell>
                                        <TableCell className="py-3 text-gray-500">{row.head}</TableCell>
                                        <TableCell className="py-3 text-center text-gray-500">{row.date}</TableCell>
                                        <TableCell className="py-3 text-right font-bold text-gray-800 tabular-nums">{cur}{fmt(row.amount)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium pt-2">
                        <div>Showing {reportData.length} {reportData.length === 1 ? "entry" : "entries"}</div>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Grand Total:</span>
                            <span className={cn(
                                "px-4 py-1.5 rounded-[10px] font-bold text-sm tabular-nums shadow-sm",
                                activeReport === "income" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                            )}>
                                {cur}{fmt(grandTotal)}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
