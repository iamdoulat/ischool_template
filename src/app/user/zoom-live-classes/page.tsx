"use client";

import { useState, useEffect, useCallback } from "react";
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
    Search, ChevronLeft, ChevronRight,
    ArrowUpDown, Video, Copy, FileSpreadsheet,
    FileBox, Printer, Columns, Loader2,
    CalendarClock, Clock, GraduationCap, User, CheckCircle2, XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

interface ZoomClass {
    id: number;
    title: string;
    date_time: string;
    duration: number;
    class: string;
    host: string;
    description: string;
    status: string;
    join_url: string;
}

export default function UserZoomLiveClassesPage() {
    const [data, setData] = useState<ZoomClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState("50");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalEntries, setTotalEntries] = useState(0);
    const [lastPage, setLastPage] = useState(1);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/user/zoom-live-classes", {
                params: {
                    search: searchTerm || undefined,
                    per_page: itemsPerPage,
                    page: currentPage,
                },
            });
            const res = response.data?.data || {
                data: [], current_page: 1, last_page: 1, total: 0, per_page: 50,
            };
            setData(res.data || []);
            setTotalEntries(res.total || 0);
            setLastPage(res.last_page || 1);
            setCurrentPage(res.current_page || 1);
        } catch (error) {
            console.error("Failed to load classes", error);
            setData([]);
            setTotalEntries(0);
            setLastPage(1);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, itemsPerPage, currentPage]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const totalPages = lastPage;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * parseInt(itemsPerPage, 10);

    const getStatusStyle = (status: string) => {
        switch (status.toLowerCase()) {
            case "awaited":
                return "bg-[#ff9800] text-white";
            case "finished":
                return "bg-[#4caf50] text-white";
            case "cancelled":
                return "bg-[#e0e0e0] text-gray-600";
            default:
                return "bg-gray-200 text-gray-700";
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const s = status.toLowerCase();
        const Icon = s === "awaited" ? Clock : s === "finished" ? CheckCircle2 : s === "cancelled" ? XCircle : null;
        return (
            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold", getStatusStyle(status))}>
                {Icon && <Icon className="h-3 w-3" />}
                {status}
            </span>
        );
    };

    return (
        <div className="p-4 lg:p-6 space-y-5 min-h-screen font-sans text-xs animate-in fade-in duration-500">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Video className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[16px] font-bold text-gray-800 tracking-tight leading-none">Live Classes</h1>
                        <p className="text-[11px] text-gray-500 mt-1">{totalEntries} class{totalEntries === 1 ? "" : "es"} scheduled</p>
                    </div>
                </div>

                <div className="p-4 lg:p-5 space-y-5">
                    {/* Table Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 border-b border-gray-100 pb-4">
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search classes..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-9 h-9 text-[12px] border-gray-200 focus-visible:ring-indigo-300 rounded-lg shadow-none"
                            />
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-2">
                            <Select
                                value={itemsPerPage}
                                onValueChange={(val) => {
                                    setItemsPerPage(val);
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="h-8 w-16 text-[11px] border-gray-200 shadow-none rounded-lg font-semibold text-gray-700 bg-white">
                                    <SelectValue placeholder="50" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-1 text-gray-400">
                                {[Copy, FileSpreadsheet, FileBox, Printer, Columns].map((Icon, i) => (
                                    <Button
                                        key={i}
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-white hover:shadow-sm rounded-md border border-transparent hover:border-gray-200 transition-all"
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden lg:block rounded-lg border border-gray-100 overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[1000px]">
                            <TableHeader className="bg-gray-50/80 border-b border-gray-100">
                                <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                    <TableHead className="py-3 px-4 h-auto">
                                        Class Title <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" />
                                    </TableHead>
                                    <TableHead className="py-3 px-4 h-auto">
                                        Date Time <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" />
                                    </TableHead>
                                    <TableHead className="py-3 px-4 h-auto">
                                        Duration (Min) <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" />
                                    </TableHead>
                                    <TableHead className="py-3 px-4 h-auto">
                                        Class <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" />
                                    </TableHead>
                                    <TableHead className="py-3 px-4 h-auto">
                                        Host <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" />
                                    </TableHead>
                                    <TableHead className="py-3 px-4 h-auto">Description</TableHead>
                                    <TableHead className="py-3 px-4 h-auto text-center">
                                        Status <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" />
                                    </TableHead>
                                    <TableHead className="py-3 px-4 h-auto text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-12">
                                            <div className="flex items-center justify-center gap-2 text-gray-400">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Loading live classes...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : data.length === 0 ? (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell
                                            colSpan={8}
                                            className="text-center py-12 text-gray-400 font-bold uppercase text-[10px] tracking-widest"
                                        >
                                            No live classes available.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.map((item) => (
                                        <TableRow
                                            key={item.id}
                                            className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/30 transition-colors whitespace-nowrap"
                                        >
                                            <TableCell className="py-3 px-4 text-[#6366f1] font-semibold">
                                                {item.title}
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-gray-600">
                                                {item.date_time}
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-gray-600">
                                                {item.duration}
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-gray-600">
                                                {item.class}
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-gray-600">
                                                {item.host}
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500 max-w-[200px] truncate">
                                                {item.description || "-"}
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-center">
                                                <StatusBadge status={item.status} />
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-right">
                                                {item.status.toLowerCase() === "awaited" && (
                                                    <Button
                                                        onClick={() => {
                                                            if (item.join_url)
                                                                window.open(item.join_url, "_blank");
                                                        }}
                                                        className="bg-gradient-to-r from-[#4caf50] to-[#43a047] hover:from-[#43a047] hover:to-[#388e3c] text-white px-2.5 h-7 text-[11px] font-bold rounded-lg shadow-sm flex items-center gap-1 transition-all active:scale-95 ml-auto border-0"
                                                    >
                                                        <Video className="h-3 w-3" />
                                                        Join
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile / tablet card list */}
                    <div className="lg:hidden">
                        {loading ? (
                            <div className="flex items-center justify-center gap-2 text-gray-400 py-12">
                                <Loader2 className="h-4 w-4 animate-spin" /> Loading live classes...
                            </div>
                        ) : data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                                <Video className="h-12 w-12 opacity-30 mb-3" />
                                <p className="font-bold uppercase text-[11px] tracking-widest">No live classes available</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {data.map((item) => (
                                    <div key={item.id} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col gap-2.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="text-[13px] font-bold text-[#6366f1] leading-snug">{item.title}</h3>
                                            <StatusBadge status={item.status} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-gray-600">
                                            <span className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5 text-indigo-400 shrink-0" />{item.date_time}</span>
                                            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-indigo-400 shrink-0" />{item.duration} min</span>
                                            <span className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5 text-indigo-400 shrink-0" />{item.class}</span>
                                            <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-indigo-400 shrink-0" />{item.host}</span>
                                        </div>
                                        {item.description && (
                                            <p className="text-[11px] text-gray-500 line-clamp-2 border-t border-gray-100 pt-2">{item.description}</p>
                                        )}
                                        {item.status.toLowerCase() === "awaited" && (
                                            <Button
                                                onClick={() => { if (item.join_url) window.open(item.join_url, "_blank"); }}
                                                className="bg-gradient-to-r from-[#4caf50] to-[#43a047] hover:from-[#43a047] hover:to-[#388e3c] text-white h-8 text-[11px] font-bold rounded-lg shadow-sm flex items-center justify-center gap-1 transition-all active:scale-95 border-0 w-full mt-1"
                                            >
                                                <Video className="h-3.5 w-3.5" /> Join Class
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer Pagination */}
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2">
                        <div>
                            Showing {totalEntries > 0 ? startIndex + 1 : 0} to{" "}
                            {Math.min(startIndex + parseInt(itemsPerPage, 10), totalEntries)} of{" "}
                            {totalEntries} entries
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center gap-1.5">
                                <button
                                    disabled={safePage === 1}
                                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                    className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                    className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
