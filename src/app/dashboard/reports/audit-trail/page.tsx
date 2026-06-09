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
    Search,
    History,
    Plus,
    Copy,
    FileSpreadsheet,
    FileBox,
    Printer,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Trash2
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

export default function AuditTrailReportPage() {
    const [searchTerm, setSearchTerm] = useState("");

    // Report Result States
    const [reportList, setReportList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState("50");

    // Fetch Audit Trail logs on mount
    const fetchAuditTrail = async () => {
        setLoading(true);
        try {
            const response = await api.get("/reports/audit-trail");
            setReportList(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch audit trail logs", error);
            toast.error("Failed to load audit trail logs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuditTrail();
    }, []);

    // Clear Audit Trail Action
    const handleClearAudit = async () => {
        try {
            await api.post("/reports/audit-trail/clear");
            setReportList([]);
            toast.success("Audit trail cleared successfully");
        } catch (error) {
            console.error("Failed to clear audit trail logs", error);
            toast.error("Failed to clear audit trail logs");
        } finally {
            setIsClearDialogOpen(false);
        }
    };

    // Filtered Report logic based on searchTerm
    const filteredReport = reportList.filter((item) => {
        if (!searchTerm) return true;
        const lower = searchTerm.toLowerCase();
        return (
            (item.message || "").toLowerCase().includes(lower) ||
            (item.users || "").toLowerCase().includes(lower) ||
            (item.ip_address || "").toLowerCase().includes(lower) ||
            (item.action || "").toLowerCase().includes(lower) ||
            (item.platform || "").toLowerCase().includes(lower) ||
            (item.agent || "").toLowerCase().includes(lower) ||
            (item.date_time || "").toLowerCase().includes(lower)
        );
    });

    // Pagination calculations
    const sizeNum = parseInt(itemsPerPage, 10) || 50;
    const totalEntries = filteredReport.length;
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * sizeNum;
    const paginatedReportList = filteredReport.slice(startIndex, startIndex + sizeNum);

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-sm font-medium text-gray-800 tracking-tight">Audit Trail Report List</h1>
                <Button 
                    onClick={() => setIsClearDialogOpen(true)}
                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-3 h-7 text-[10px] font-bold uppercase transition-all rounded shadow-sm flex items-center gap-1.5"
                >
                    <Trash2 className="h-3 w-3" />
                    Clear Audit Trail Record
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[500px]">

                {/* Table Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-50 pb-3">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <Input
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-8 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                        />
                    </div>

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
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                            {[Copy, FileSpreadsheet, FileBox, Printer].map((Icon, i) => (
                                <Button key={i} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded">
                                    <Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Audit Trail Table */}
                <div className="rounded border border-gray-100 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1400px]">
                        <TableHeader className="bg-transparent border-b border-gray-100">
                            <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                <TableHead className="py-3 px-4">Message <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Users <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">IP Address <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Action <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Platform <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Agent <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 text-right">Date Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12">
                                        <div className="flex items-center justify-center gap-2 text-gray-400">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
                                            Loading...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : reportList.length === 0 ? (
                                <TableRow className="hover:bg-transparent h-64">
                                    <TableCell colSpan={7} className="text-center py-12">
                                        <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                            <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest whitespace-nowrap">No data available in table</p>
                                            <div className="relative">
                                                <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                    <History className="h-8 w-8 text-gray-200" />
                                                </div>
                                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border border-indigo-50 flex items-center justify-center">
                                                    <Plus className="h-3 w-3 text-indigo-300" />
                                                </div>
                                            </div>
                                            <p className="text-emerald-500 font-bold text-[10px] flex items-center gap-1">
                                                <span className="text-lg">←</span> No logs have been generated yet.
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedReportList.length > 0 ? (
                                paginatedReportList.map((item, idx) => (
                                    <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors whitespace-nowrap">
                                        <TableCell className="py-3 px-4 text-gray-700 font-medium max-w-[400px] truncate" title={item.message}>{item.message}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-700 font-medium">{item.users}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-500">{item.ip_address}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-500">{item.action}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-500">{item.platform}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-500 max-w-[200px] truncate" title={item.agent}>{item.agent}</TableCell>
                                        <TableCell className="py-3 px-4 text-right text-indigo-600 font-bold">{item.date_time}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={7} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                        No audit trail records match the search.
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
                            This action cannot be undone. This will permanently clear all audit trail records from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded font-bold text-xs h-9">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearAudit} className="bg-red-500 hover:bg-red-600 rounded font-bold text-xs h-9 text-white">
                            Clear All
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
