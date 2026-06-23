"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Trash2,
    ArrowUpDown,
    DoorOpen,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Hostel {
    id: number;
    name: string;
}

interface RoomType {
    id: number;
    name: string;
}

interface HostelRoom {
    id: number;
    room_number: string;
    hostel_id: number;
    room_type_id: number;
    number_of_bed: number;
    cost_per_bed: number;
    description: string;
    hostel?: Hostel;
    room_type?: RoomType;
}

function SkeletonRows({ rows = 6, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <TableRow key={i} className="border-b border-gray-50">
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-3">
                            <div
                                className="h-3 rounded bg-gray-200/70 animate-pulse"
                                style={{ width: `${55 + ((i * 3 + j * 7) % 40)}%` }}
                            />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export default function HostelRoomPage() {
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const [rooms, setRooms] = useState<HostelRoom[]>([]);
    const [hostels, setHostels] = useState<Hostel[]>([]);
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [form, setForm] = useState({
        id: null as number | null,
        room_number: "",
        hostel_id: "",
        room_type_id: "",
        number_of_bed: "",
        cost_per_bed: "",
        description: "",
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    const fetchData = async () => {
        setFetching(true);
        try {
            const [roomsRes, hostelsRes, typesRes] = await Promise.all([
                api.get("/rooms"),
                api.get("/hostels"),
                api.get("/room-types")
            ]);
            setRooms(roomsRes.data.data || []);
            setHostels(hostelsRes.data.data || []);
            setRoomTypes(typesRes.data.data || []);
        } catch (error) {
            tt.error("failed_to_fetch_data");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async () => {
        if (!form.room_number || !form.hostel_id || !form.room_type_id || !form.number_of_bed || !form.cost_per_bed) {
            tt.error("please_fill_required_fields");
            return;
        }

        setLoading(true);
        const submitData = {
            ...form,
            hostel_id: parseInt(form.hostel_id),
            room_type_id: parseInt(form.room_type_id),
            number_of_bed: parseInt(form.number_of_bed),
            cost_per_bed: parseFloat(form.cost_per_bed)
        };

        try {
            if (form.id) {
                await api.put(`/rooms/${form.id}`, submitData);
                tt.success("room_updated_successfully");
            } else {
                await api.post("/rooms", submitData);
                tt.success("room_created_successfully");
            }
            setForm({ id: null, room_number: "", hostel_id: "", room_type_id: "", number_of_bed: "", cost_per_bed: "", description: "" });
            fetchData();
        } catch (error) {
            tt.error("failed_to_save_room");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (room: HostelRoom) => {
        setForm({
            id: room.id,
            room_number: room.room_number,
            hostel_id: room.hostel_id.toString(),
            room_type_id: room.room_type_id.toString(),
            number_of_bed: room.number_of_bed.toString(),
            cost_per_bed: room.cost_per_bed.toString(),
            description: room.description || "",
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t("are_you_sure_delete_room"))) return;
        try {
            await api.delete(`/rooms/${id}`);
            tt.success("room_deleted_successfully");
            fetchData();
        } catch (error) {
            tt.error("failed_to_delete_room");
        }
    };

    const filteredRooms = rooms.filter((r) =>
        r.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.hostel?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination logic
    const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedRooms = filteredRooms.slice(startIndex, startIndex + itemsPerPage);

    const exportToExcel = () => {
        const data = filteredRooms.map(r => ({
            [t("room_number_name")]: r.room_number,
            [t("hostel")]: r.hostel?.name,
            [t("room_type")]: r.room_type?.name,
            [t("number_of_bed")]: r.number_of_bed,
            [t("cost_per_bed")]: r.cost_per_bed
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Rooms");
        XLSX.writeFile(wb, "hostel_rooms.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text(t("hostel_room_list"), 14, 15);
        autoTable(doc, {
            head: [[t("room_number_name"), t("hostel"), t("room_type"), t("number_of_bed"), t("cost_per_bed")]],
            body: filteredRooms.map(r => [r.room_number, r.hostel?.name || '', r.room_type?.name || '', r.number_of_bed, r.cost_per_bed]),
            startY: 20,
        });
        doc.save("hostel_rooms.pdf");
    };

    const copyToClipboard = () => {
        const text = filteredRooms.map(r => `${r.room_number}\t${r.hostel?.name}\t${r.room_type?.name}\t${r.number_of_bed}\t${r.cost_per_bed}`).join('\n');
        navigator.clipboard.writeText(text);
        tt.success("copied_to_clipboard");
    };

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Section: Add Hostel Room Form */}
                <div className="w-full lg:w-1/3 xl:w-1/4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="flex items-center gap-2.5 px-4 py-3.5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <DoorOpen className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                                <h2 className="text-sm font-semibold text-gray-800 tracking-tight">{form.id ? t("edit_hostel_room") : t("add_hostel_room")}</h2>
                                <p className="text-[11px] text-gray-500">{t("hostel_room_record")}</p>
                            </div>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    {t("room_number_name")} <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Input
                                    value={form.room_number}
                                    onChange={(e) => setForm({ ...form, room_number: e.target.value })}
                                    className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none"
                                    placeholder=""
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    {t("hostel")} <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Select value={form.hostel_id} onValueChange={(val) => setForm({ ...form, hostel_id: val })}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] focus:ring-indigo-500 rounded shadow-none">
                                        <SelectValue placeholder={t("select")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {hostels.map((h) => (
                                            <SelectItem key={h.id} value={h.id.toString()}>{h.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    {t("room_type")} <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Select value={form.room_type_id} onValueChange={(val) => setForm({ ...form, room_type_id: val })}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] focus:ring-indigo-500 rounded shadow-none">
                                        <SelectValue placeholder={t("select")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roomTypes.map((t) => (
                                            <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    {t("number_of_bed")} <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Input
                                    value={form.number_of_bed}
                                    onChange={(e) => setForm({ ...form, number_of_bed: e.target.value })}
                                    className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none"
                                    placeholder=""
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    {t("cost_per_bed")} <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Input
                                    value={form.cost_per_bed}
                                    onChange={(e) => setForm({ ...form, cost_per_bed: e.target.value })}
                                    className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none"
                                    placeholder=""
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("description")}</Label>
                                <Textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="min-h-[80px] border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none resize-none"
                                    placeholder=""
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button
                                    onClick={handleSave}
                                    disabled={loading}
                                    variant="gradient"
                                    className="px-8 h-10 text-[11px] font-bold uppercase transition-all rounded-full shadow-lg min-w-[100px]"
                                >
                                    {loading ? t("saving") : t("save")}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Hostel Room List */}
                <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="flex flex-wrap items-center gap-2.5 px-4 py-3.5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <DoorOpen className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                                <h2 className="text-sm font-semibold text-gray-800 tracking-tight">{t("hostel_room_list")}</h2>
                                <p className="text-[11px] text-gray-500">{t("x_rooms", { count: filteredRooms.length })}</p>
                            </div>
                        </div>
                        <div className="p-4 space-y-4">

                        {/* Toolbar */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-50 pb-4">
                            <div className="relative w-full md:w-64">
                                <Input
                                    placeholder={t("search")}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 mr-2">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{itemsPerPage}</span>
                                    <Select value={itemsPerPage.toString()} onValueChange={(val) => { setItemsPerPage(parseInt(val)); setCurrentPage(1); }}>
                                        <SelectTrigger className="h-7 w-14 text-[10px] border-none bg-gray-50 hover:bg-gray-100 transition-colors shadow-none rounded-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-1 text-gray-400">
                                    <Button onClick={copyToClipboard} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded">
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button onClick={exportToExcel} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded">
                                        <FileSpreadsheet className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button onClick={exportToPDF} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded">
                                        <FileText className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button onClick={() => window.print()} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded">
                                        <Printer className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded">
                                        <Columns className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-[800px]">
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap">
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">{t("room_number_name")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">{t("hostel")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">{t("room_type")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1 cursor-pointer">{t("number_of_bed")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1 cursor-pointer">{t("cost_per_bed")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">{t("action")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fetching ? (
                                        <SkeletonRows cols={6} />
                                    ) : paginatedRooms.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-10 text-gray-400 italic">{t("no_rooms_found")}</TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedRooms.map((room) => (
                                            <TableRow key={room.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap">
                                                <TableCell className="py-3 text-gray-700 font-medium">{room.room_number}</TableCell>
                                                <TableCell className="py-3 text-gray-500">{room.hostel?.name}</TableCell>
                                                <TableCell className="py-3 text-gray-500">{room.room_type?.name}</TableCell>
                                                <TableCell className="py-3 text-gray-500 text-right">{room.number_of_bed}</TableCell>
                                                <TableCell className="py-3 text-gray-500 text-right">₹{room.cost_per_bed}</TableCell>
                                                <TableCell className="py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button onClick={() => handleEdit(room)} size="icon" variant="gradient" className="h-6 w-6 text-white rounded shadow-sm">
                                                            <Pencil className="h-3 w-3" />
                                                        </Button>
                                                        <Button onClick={() => handleDelete(room.id)} size="icon" variant="ghost" className="h-6 w-6 bg-red-500 hover:bg-red-600 text-white rounded shadow-sm">
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium pt-4 border-t border-gray-100">
                                <div>
                                    {t("showing_x_to_y_of_z", { from: startIndex + 1, to: Math.min(startIndex + itemsPerPage, filteredRooms.length), total: filteredRooms.length })}
                                </div>
                                <div className="flex gap-1.5 items-center">
                                    <Button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-lg border border-gray-100 hover:bg-gray-50 disabled:opacity-30"
                                    >
                                        <ChevronLeft className="h-5 w-5 text-gray-600" />
                                    </Button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <Button
                                            key={page}
                                            variant={currentPage === page ? "gradient" : "ghost"}
                                            onClick={() => setCurrentPage(page)}
                                            className={cn(
                                                "h-9 w-9 rounded-lg text-[12px] font-bold p-0 transition-all shadow-sm",
                                                currentPage === page ? "scale-105 border-0" : "border border-gray-50 text-gray-400 hover:text-indigo-600"
                                            )}
                                        >
                                            {page}
                                        </Button>
                                    ))}

                                    <Button
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-lg border border-gray-100 hover:bg-gray-50 disabled:opacity-30"
                                    >
                                        <ChevronRight className="h-5 w-5 text-gray-600" />
                                    </Button>
                                </div>
                            </div>
                        )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
