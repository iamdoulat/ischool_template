"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Copy, FileSpreadsheet, FileDown, Printer, Search, Loader2,
    ChevronLeft, ChevronRight, BedDouble, Building2, Hotel,
    DollarSign, CheckCircle2, Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useToast } from "@/components/ui/use-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface HostelRoom {
    id: number;
    hostel: string;
    room_type: string;
    room_number: string;
    number_of_bed: number;
    cost_per_bed: number;
    status: string;
}

const PAGE_SIZES = [10, 25, 50, 100];
const money = (v: number | string) => `$${parseFloat(String(v ?? 0)).toFixed(2)}`;

export default function UserHostelRoomsPage() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [rooms, setRooms] = useState<HostelRoom[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [fetching, setFetching] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    const fetchData = async () => {
        setFetching(true);
        try {
            const response = await api.get("/user/hostel-rooms");
            if (response.data.success) {
                setRooms(response.data.data || []);
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: t("error"),
                description: t("failed_to_fetch_hostel_rooms"),
            });
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const assignedRoom = useMemo(() => rooms.find((r) => r.status === "Assigned"), [rooms]);

    const filteredRooms = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return rooms.filter((r) =>
            r.room_number?.toLowerCase().includes(term) ||
            r.hostel?.toLowerCase().includes(term) ||
            r.room_type?.toLowerCase().includes(term)
        );
    }, [rooms, searchTerm]);

    const totalPages = Math.ceil(filteredRooms.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedRooms = filteredRooms.slice(startIndex, startIndex + itemsPerPage);

    const exportRows = () =>
        filteredRooms.map((r) => ({
            [t("hostel")]: r.hostel,
            [t("room_type")]: r.room_type,
            [t("room_number_name")]: r.room_number,
            [t("no_of_bed")]: r.number_of_bed,
            [t("status")]: r.status || t("available"),
            [t("cost_per_bed")]: money(r.cost_per_bed),
        }));

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(exportRows());
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Hostel_Rooms");
        XLSX.writeFile(wb, "hostel_rooms.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text(t("hostel_rooms_list"), 14, 15);
        autoTable(doc, {
            head: [[t("hostel"), t("room_type"), t("room_number_name"), t("no_of_bed"), t("status"), t("cost_per_bed")]],
            body: filteredRooms.map((r) => [
                r.hostel || "", r.room_type || "", r.room_number || "",
                String(r.number_of_bed), r.status || t("available"), money(r.cost_per_bed),
            ]),
            startY: 20,
        });
        doc.save("hostel_rooms.pdf");
    };

    const copyToClipboard = () => {
        const header = [t("hostel"), t("room_type"), t("room_number_name"), t("no_of_bed"), t("status"), t("cost_per_bed")].join("\t");
        const text = filteredRooms
            .map((r) => `${r.hostel}\t${r.room_type}\t${r.room_number}\t${r.number_of_bed}\t${r.status || t("available")}\t${money(r.cost_per_bed)}`)
            .join("\n");
        navigator.clipboard.writeText(`${header}\n${text}`);
        toast({ title: t("success"), description: t("copied_to_clipboard") });
    };

    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
        .reduce<(number | "…")[]>((acc, p, i, arr) => {
            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
            acc.push(p);
            return acc;
        }, []);

    const statusBadge = (status: string) =>
        status === "Assigned" ? (
            <Badge className="border bg-green-100 text-green-700 border-green-200 hover:bg-green-100 font-medium gap-1">
                <CheckCircle2 className="h-3 w-3" /> {t("assigned")}
            </Badge>
        ) : (
            <Badge className="border bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100 font-medium">
                {t("available")}
            </Badge>
        );

    return (
        <div className="p-4 lg:p-6 animate-in fade-in duration-500">
            <Card className="shadow-sm border border-gray-200 rounded-xl overflow-hidden p-0 gap-0">
                {/* ── Header ── */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Hotel className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <h1 className="text-[16px] font-bold text-gray-800 tracking-tight leading-none truncate">{t("hostel_rooms")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {fetching ? t("loading") : `${rooms.length} room${rooms.length === 1 ? "" : "s"} listed`}
                            </p>
                        </div>
                    </div>
                </div>

                <CardContent className="p-4">
                    {/* ── Assigned room highlight ── */}
                    {assignedRoom && (
                        <div className="mb-4 rounded-xl border border-green-200 bg-green-50/60 p-4 print:hidden">
                            <div className="flex items-center gap-2 mb-3">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="text-[13px] font-bold text-green-800">{t("your_assigned_room")}</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px]">
                                <div className="flex items-center gap-2 min-w-0">
                                    <Building2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                    <span className="text-gray-500">{t("hostel")}: <span className="font-semibold text-gray-800">{assignedRoom.hostel}</span></span>
                                </div>
                                <div className="flex items-center gap-2 min-w-0">
                                    <BedDouble className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                    <span className="text-gray-500">{t("room")}: <span className="font-semibold text-gray-800">{assignedRoom.room_number}</span></span>
                                </div>
                                <div className="flex items-center gap-2 min-w-0">
                                    <Tag className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                    <span className="text-gray-500">{t("type")}: <span className="font-semibold text-gray-800">{assignedRoom.room_type}</span></span>
                                </div>
                                <div className="flex items-center gap-2 min-w-0">
                                    <DollarSign className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                    <span className="text-gray-500">{t("per_bed")}: <span className="font-semibold text-gray-800">{money(assignedRoom.cost_per_bed)}</span></span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 print:hidden">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                placeholder={t("search_hostel_room_type")}
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-8 h-9 text-sm rounded-[10px]"
                            />
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <Select value={itemsPerPage.toString()} onValueChange={(val) => { setItemsPerPage(parseInt(val)); setCurrentPage(1); }}>
                                <SelectTrigger className="h-9 w-[70px] text-[12px] border border-gray-200 bg-white rounded-[10px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAGE_SIZES.map((s) => (
                                        <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="flex items-center border border-gray-200 rounded-[10px] overflow-hidden">
                                {[
                                    { icon: Copy, label: t("copy"), action: copyToClipboard },
                                    { icon: FileSpreadsheet, label: t("excel"), action: exportToExcel },
                                    { icon: FileDown, label: t("pdf"), action: exportToPDF },
                                    { icon: Printer, label: t("print"), action: () => window.print() },
                                ].map(({ icon: Icon, label, action }, i, arr) => (
                                    <Button
                                        key={label}
                                        variant="ghost"
                                        size="icon"
                                        title={label}
                                        onClick={action}
                                        className={cn(
                                            "h-9 w-9 rounded-none hover:bg-gray-100",
                                            i < arr.length - 1 && "border-r border-gray-200"
                                        )}
                                    >
                                        <Icon className="h-4 w-4 text-gray-500" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Desktop table ── */}
                    <div className="hidden md:block rounded-md border border-gray-200 overflow-x-auto print:hidden">
                        <Table className="min-w-[800px]">
                            <TableHeader>
                                <TableRow className="bg-gray-100 hover:bg-gray-100 border-b border-gray-200">
                                    <TableHead className="text-[12px] font-bold text-gray-700 py-3 px-4">{t("hostel")}</TableHead>
                                    <TableHead className="text-[12px] font-bold text-gray-700 py-3 px-4">{t("room_type")}</TableHead>
                                    <TableHead className="text-[12px] font-bold text-gray-700 py-3 px-4">{t("room_number_name")}</TableHead>
                                    <TableHead className="text-[12px] font-bold text-gray-700 py-3 px-4 text-center">{t("no_of_bed")}</TableHead>
                                    <TableHead className="text-[12px] font-bold text-gray-700 py-3 px-4 text-center">{t("status")}</TableHead>
                                    <TableHead className="text-[12px] font-bold text-gray-700 py-3 px-4 text-right">{t("cost_per_bed")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fetching ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center">
                                            <div className="flex items-center justify-center gap-2 text-gray-400">
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                <span>{t("loading_hostel_rooms")}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedRooms.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                                                <BedDouble className="h-8 w-8 opacity-30" />
                                                <span className="text-sm">{t("no_rooms_found")}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedRooms.map((room) => {
                                        const isAssigned = room.status === "Assigned";
                                        return (
                                            <TableRow
                                                key={room.id}
                                                className={cn(
                                                    "text-[13px] text-gray-600 border-b border-gray-100 transition-colors",
                                                    isAssigned ? "bg-green-50/50 hover:bg-green-50" : "hover:bg-gray-50/60"
                                                )}
                                            >
                                                <TableCell className="py-3 px-4 font-medium text-gray-800">
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-[#6366F1]">
                                                            <Building2 className="h-3.5 w-3.5" />
                                                        </span>
                                                        {room.hostel}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 px-4">{room.room_type}</TableCell>
                                                <TableCell className="py-3 px-4 font-medium text-gray-700">{room.room_number}</TableCell>
                                                <TableCell className="py-3 px-4 text-center">
                                                    <span className="inline-flex items-center gap-1 text-gray-600">
                                                        <BedDouble className="h-3.5 w-3.5 text-gray-400" /> {room.number_of_bed}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-center">{statusBadge(room.status)}</TableCell>
                                                <TableCell className="py-3 px-4 text-right font-semibold text-gray-800">{money(room.cost_per_bed)}</TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* ── Mobile cards ── */}
                    <div className="md:hidden space-y-3 print:hidden">
                        {fetching ? (
                            <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>{t("loading")}</span>
                            </div>
                        ) : paginatedRooms.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
                                <BedDouble className="h-8 w-8 opacity-30" />
                                <span className="text-sm">{t("no_rooms_found")}</span>
                            </div>
                        ) : (
                            paginatedRooms.map((room) => {
                                const isAssigned = room.status === "Assigned";
                                return (
                                    <div
                                        key={room.id}
                                        className={cn(
                                            "rounded-xl border p-3.5 shadow-sm",
                                            isAssigned ? "border-green-300 bg-green-50/60 ring-1 ring-green-200" : "border-gray-200 bg-white"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800]/10 to-[#6366F1]/10">
                                                    <BedDouble className="h-4.5 w-4.5 text-[#6366F1]" />
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-[13px] font-bold text-gray-800 truncate">{t("room")}{" "}{room.room_number}</p>
                                                    <p className="text-[11px] text-gray-500 truncate">{room.room_type}</p>
                                                </div>
                                            </div>
                                            {statusBadge(room.status)}
                                        </div>

                                        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-gray-500">
                                            <span className="flex items-center gap-1.5 min-w-0">
                                                <Building2 className="h-3 w-3 text-gray-400 shrink-0" />
                                                <span className="truncate">{room.hostel}</span>
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <BedDouble className="h-3 w-3 text-gray-400 shrink-0" />
                                                {room.number_of_bed} bed{room.number_of_bed === 1 ? "" : "s"}
                                            </span>
                                            <span className="flex items-center gap-1.5 col-span-2">
                                                <DollarSign className="h-3 w-3 text-gray-400 shrink-0" />
                                                {t("cost_per_bed")}: <span className="font-semibold text-gray-800">{money(room.cost_per_bed)}</span>
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Pagination */}
                    {!fetching && (
                        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-3 print:hidden">
                            <span className="text-[12px] text-gray-500">
                                {filteredRooms.length === 0
                                    ? t("no_entries")
                                    : `${t("showing")} ${startIndex + 1} ${t("to")} ${Math.min(startIndex + itemsPerPage, filteredRooms.length)} ${t("of")} ${filteredRooms.length} ${t("entries")}`}
                            </span>

                            {totalPages > 1 && (
                                <div className="flex items-center gap-1.5">
                                    <Button
                                        size="icon"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        className="h-8 w-8 rounded-[10px] text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity disabled:opacity-40"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>

                                    {pageNumbers.map((p, i) =>
                                        p === "…" ? (
                                            <span key={`e-${i}`} className="text-gray-400 text-[12px] px-1">…</span>
                                        ) : (
                                            <Button
                                                key={p}
                                                size="icon"
                                                onClick={() => setCurrentPage(p as number)}
                                                className={cn(
                                                    "h-8 w-8 rounded-[10px] text-[12px] font-medium transition-opacity",
                                                    currentPage === p
                                                        ? "text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90"
                                                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                                                )}
                                            >
                                                {p}
                                            </Button>
                                        )
                                    )}

                                    <Button
                                        size="icon"
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        className="h-8 w-8 rounded-[10px] text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity disabled:opacity-40"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
