"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
    Copy,
    FileSpreadsheet,
    FileBox,
    FileText,
    Printer,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Eraser,
    Activity,
    Monitor
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const tabs = ["All Users", "Staff", "Students", "Parent", "Guest"];

function TableSkeleton({ cols }: { cols: number }) {
    return (
        <>
            {Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-3">
                            <Skeleton className="h-4 rounded" style={{ width: `${55 + ((i * 3 + j * 7) % 35)}%` }} />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export default function UserLogPage() {
    const [activeTab, setActiveTab] = useState("All Users");
    const [searchTerm, setSearchTerm] = useState("");

    // Report Result States
    const [reportList, setReportList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState("50");

    // Fetch User logs when activeTab changes
    const fetchUserLogs = async () => {
        setLoading(true);
        try {
            const response = await api.get("/reports/user-log", {
                params: { role: activeTab }
            });
            setReportList(response.data.data || []);
            setCurrentPage(1);
        } catch (error) {
            console.error("Failed to fetch user logs", error);
            toast.error("Failed to load user logs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserLogs();
    }, [activeTab]);

    // Clear User logs Action
    const handleClearLogs = async () => {
        try {
            await api.post("/reports/user-log/clear");
            setReportList([]);
            toast.success("User log cleared successfully");
        } catch (error) {
            console.error("Failed to clear user logs", error);
            toast.error("Failed to clear user logs");
        } finally {
            setIsClearDialogOpen(false);
        }
    };

    // Filtered Report logic based on searchTerm
    const filteredReport = reportList.filter((item) => {
        if (!searchTerm) return true;
        const lower = searchTerm.toLowerCase();
        return (
            (item.user || "").toLowerCase().includes(lower) ||
            (item.role || "").toLowerCase().includes(lower) ||
            (item.class || "").toLowerCase().includes(lower) ||
            (item.ipAddress || "").toLowerCase().includes(lower) ||
            (item.loginTime || "").toLowerCase().includes(lower) ||
            (item.userAgent || "").toLowerCase().includes(lower)
        );
    });

    // Pagination calculations
    const sizeNum = parseInt(itemsPerPage, 10) || 50;
    const totalEntries = filteredReport.length;
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * sizeNum;
    const paginatedReportList = filteredReport.slice(startIndex, startIndex + sizeNum);

    // ── Export helpers ────────────────────────────────────────────────────────
    const exportToCopy = () => {
        if (filteredReport.length === 0) { toast.error("No data to copy"); return; }
        const text = [
            "Users\tRole\tClass\tIP Address\tLogin Date Time\tUser Agent",
            ...filteredReport.map((r: any) => `${r.user}\t${r.role}\t${r.class || "-"}\t${r.ipAddress}\t${r.loginTime}\t${r.userAgent}`)
        ].join("\n");
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    const exportToExcel = (isCsv = false) => {
        if (filteredReport.length === 0) { toast.error("No data to export"); return; }
        const mapped = filteredReport.map((r: any) => ({
            "Users": r.user,
            "Role": r.role,
            "Class": r.class || "-",
            "IP Address": r.ipAddress,
            "Login Date Time": r.loginTime,
            "User Agent": r.userAgent,
        }));
        const ws = XLSX.utils.json_to_sheet(mapped);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `User Log - ${activeTab}`);
        if (isCsv) { XLSX.writeFile(wb, `user_log_${activeTab.toLowerCase().replace(/\s+/g, '_')}.csv`, { bookType: "csv" }); toast.success("CSV downloaded"); }
        else { XLSX.writeFile(wb, `user_log_${activeTab.toLowerCase().replace(/\s+/g, '_')}.xlsx`); toast.success("Excel file downloaded"); }
    };

    const exportToPDF = () => {
        if (filteredReport.length === 0) { toast.error("No data to export"); return; }
        const doc = new jsPDF("landscape");
        const head = [["Users", "Role", "Class", "IP Address", "Login Date Time", "User Agent"]];
        const body = filteredReport.map((r: any) => [r.user, r.role, r.class || "-", r.ipAddress, r.loginTime, r.userAgent]);
        autoTable(doc, { head, body, theme: "grid" });
        doc.save(`user_log_${activeTab.toLowerCase().replace(/\s+/g, '_')}.pdf`);
        toast.success("PDF downloaded");
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-4 lg:p-6 space-y-5 animate-in fade-in duration-500 pb-20 text-xs">
            <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] overflow-hidden pt-0 gap-0">
                <CardHeader className="px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Activity className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold text-slate-800 leading-none">User Log</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">System user activity and login records</p>
                            </div>
                        </div>
                        <div className="flex bg-white border border-gray-100 rounded-md overflow-hidden shadow-sm">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        "px-3 py-1.5 text-[10px] font-bold uppercase transition-colors border-r border-gray-50 last:border-0 cursor-pointer",
                                        activeTab === tab
                                            ? "bg-indigo-50 text-indigo-600 shadow-inner"
                                            : "text-gray-400 hover:bg-gray-50 bg-transparent"
                                    )}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[600px]">

                {/* Actions Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-50 pb-3">
                    <div className="relative w-full md:w-64">
                        <Input
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                        />
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                        <Button 
                            onClick={() => setIsClearDialogOpen(true)}
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-3 h-7 text-[10px] font-bold uppercase transition-all rounded shadow-sm flex items-center gap-1.5 w-full md:w-auto"
                        >
                            <Eraser className="h-3 w-3" />
                            Clear Userlog Record
                        </Button>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 mr-2">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Rows</span>
                                <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                    <SelectTrigger className="h-7 w-16 text-[10px] border-gray-200 shadow-none rounded font-semibold">
                                        <SelectValue placeholder="50" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                                <Button variant="ghost" size="icon" title="Copy" onClick={exportToCopy} className="h-7 w-7 hover:bg-gray-100 hover:text-indigo-600 rounded">
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Excel" onClick={() => exportToExcel(false)} className="h-7 w-7 hover:bg-gray-100 hover:text-emerald-600 rounded">
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="CSV" onClick={() => exportToExcel(true)} className="h-7 w-7 hover:bg-gray-100 hover:text-amber-600 rounded">
                                    <FileBox className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="PDF" onClick={exportToPDF} className="h-7 w-7 hover:bg-gray-100 hover:text-rose-600 rounded">
                                    <FileText className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Print" onClick={handlePrint} className="h-7 w-7 hover:bg-gray-100 hover:text-gray-900 rounded">
                                    <Printer className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Log Table */}
                <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1200px]">
                        <TableHeader className="bg-transparent border-b border-gray-100">
                            <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                <TableHead className="py-3 px-4">Users <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Role <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Class <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">IP Address <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Login Date Time <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 text-right">User Agent</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableSkeleton cols={6} />
                            ) : reportList.length === 0 ? (
                                <TableRow className="hover:bg-transparent h-64">
                                    <TableCell colSpan={6} className="text-center py-12">
                                        <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                            <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest whitespace-nowrap">No data available in table</p>
                                            <p className="text-emerald-500 font-bold text-[10px]">
                                                No logs are currently registered for this tab.
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedReportList.length > 0 ? (
                                paginatedReportList.map((log, idx) => (
                                    <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors whitespace-nowrap">
                                        <TableCell className="py-3 px-4 text-gray-700 font-medium">{log.user}</TableCell>
                                        <TableCell className="py-3 px-4">
                                            <span className={cn(
                                                log.role === "Super Admin" ? "text-blue-600 font-semibold" : "text-gray-500"
                                            )}>
                                                {log.role}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-gray-500">{log.class || "-"}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-500">{log.ipAddress}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-500">{log.loginTime}</TableCell>
                                        <TableCell className="py-3 px-4 text-right text-gray-400 font-normal truncate max-w-[300px]" title={log.userAgent}>{log.userAgent}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={6} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                        No user logs match the search.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-4 border-t border-gray-50 mt-2">
                    <div>
                        Showing {totalEntries > 0 ? startIndex + 1 : 0} to{" "}
                        {Math.min(startIndex + sizeNum, totalEntries)} of {totalEntries} entries
                        {searchTerm && ` (filtered from ${reportList.length} total entries)`}
                    </div>

                    {reportList.length > 0 && (
                        <div className="flex items-center gap-1.5">
                            <button
                                disabled={safePage === 1}
                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={cn(
                                        "h-8 w-8 transition-all duration-300 text-xs flex items-center justify-center cursor-pointer font-bold",
                                        safePage === page
                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-lg shadow-indigo-500/25 rounded-xl hover:scale-105 active:scale-95"
                                            : "bg-white hover:bg-gray-50/80 text-gray-500 hover:text-gray-700 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 border border-gray-100"
                                    )}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                disabled={safePage === totalPages}
                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Clear Confirmation Dialog */}
            <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
                <AlertDialogContent className="rounded bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently clear all user login logs from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded font-bold text-xs h-9">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearLogs} className="bg-red-500 hover:bg-red-600 rounded font-bold text-xs h-9 text-white">
                            Clear All
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
