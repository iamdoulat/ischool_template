"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Pencil,
    Trash2,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    CalendarDays
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { cn, toLocaleNumber, translateLeaveTypeName } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface LeaveType {
    id: number;
    name: string;
}

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-4 rounded-md bg-muted/60 animate-pulse" style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

export default function LeaveTypePage() {
    const { t, language } = useTranslation();
    const shortCode = language?.short_code || "en";
    const tt = useTranslateToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [name, setName] = useState("");

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get("hr/leave-type");
            setLeaveTypes(response.data.data);
        } catch (error) {
            console.error("Error fetching leave types:", error);
            tt.error("failed_to_load_leave_types");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async () => {
        if (!name.trim()) {
            tt.error("name_is_required");
            return;
        }

        try {
            if (isEditing && currentId) {
                await api.put(`hr/leave-type/${currentId}`, { name });
                tt.success("leave_type_updated_successfully");
            } else {
                await api.post("hr/leave-type", { name });
                tt.success("leave_type_created_successfully");
            }
            resetForm();
            fetchData();
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            tt.error(err.response?.data?.message || "failed_to_save_leave_type");
        }
    };

    const handleEdit = (lt: LeaveType) => {
        setIsEditing(true);
        setCurrentId(lt.id);
        setName(lt.name);
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t("are_you_sure_delete_leave_type"))) return;
        try {
            await api.delete(`hr/leave-type/${id}`);
            tt.success("leave_type_deleted_successfully");
            fetchData();
        } catch (error) {
            tt.error("failed_to_delete_leave_type");
        }
    };

    const resetForm = () => {
        setName("");
        setIsEditing(false);
        setCurrentId(null);
    };

    const filteredLeaveTypes = leaveTypes.filter(lt =>
        lt.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredLeaveTypes.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredLeaveTypes.slice(startIndex, startIndex + itemsPerPage);

    // Export Functions
    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(leaveTypes.map(lt => ({ "Leave Type": lt.name })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, t("leave_types"));
        XLSX.writeFile(wb, "leave_types.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text(t("leave_type_list"), 14, 15);
        autoTable(doc, {
            head: [[t("no"), t("leave_type_name")]],
            body: leaveTypes.map((lt, idx) => [idx + 1, lt.name]),
            startY: 20,
        });
        doc.save("leave_types.pdf");
    };

    const copyToClipboard = () => {
        const text = leaveTypes.map(lt => lt.name).join('\n');
        navigator.clipboard.writeText(text);
        tt.success("data_copied_to_clipboard");
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 p-4 font-sans bg-gray-50/10 min-h-screen">
            {/* Left Column: Add Leave Type Form */}
            <div className="w-full lg:w-1/3">
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 sticky top-6">
                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-3.5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <CalendarDays className="h-4 w-4" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                    {isEditing ? t("edit_leave_type") : t("add_leave_type")}
                                </CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">
                                    {isEditing ? t("update_existing_leave_type") : t("create_new_leave_type")}
                                </p>
                            </div>
                        </CardHeader>
                        <CardContent className="px-5 py-5">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                        {t("name")} <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="h-9 border-gray-200 text-xs shadow-none focus-visible:ring-indigo-500 rounded-lg"
                                        placeholder={t("eg_sick_leave")}
                                    />
                                </div>

                                <div className="flex justify-end pt-2 gap-2">
                                    {isEditing && (
                                        <Button
                                            onClick={resetForm}
                                            variant="outline"
                                            className="px-6 h-8 text-[11px] font-bold uppercase transition-all rounded-full shadow-sm cursor-pointer"
                                        >
                                            {t("cancel")}
                                        </Button>
                                    )}
                                    <Button
                                        onClick={handleSubmit}
                                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white px-8 h-8 text-[11px] uppercase font-bold rounded-full shadow-sm flex items-center gap-1.5 min-w-[80px] cursor-pointer border-0"
                                    >
                                        {isEditing ? t("update") : t("save")}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Leave Type List */}
                <div className="w-full lg:w-2/3">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-3.5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <CalendarDays className="h-4 w-4" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("leave_type_list")}</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{toLocaleNumber(filteredLeaveTypes.length, shortCode)} {filteredLeaveTypes.length === 1 ? t("total_entry") : t("total_entries")}</p>
                            </div>
                        </CardHeader>
                        <CardContent className="px-5 py-4 space-y-4">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="relative w-full md:w-64">
                                    <Input
                                        placeholder={t("search")}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-3 h-8 text-xs border-gray-200 focus-visible:ring-indigo-500 rounded-lg"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 mr-2">
                                        <Select
                                            value={itemsPerPage.toString()}
                                            onValueChange={(val) => {
                                                setItemsPerPage(parseInt(val));
                                                setCurrentPage(1);
                                            }}
                                        >
                                            <SelectTrigger className="h-8 w-16 text-[11px] font-bold border-gray-200 bg-white rounded-lg focus:ring-indigo-500 cursor-pointer">
                                                <SelectValue placeholder={toLocaleNumber(itemsPerPage, shortCode)}>
                                                    {toLocaleNumber(itemsPerPage, shortCode)}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent className="rounded-lg border-gray-100">
                                                {[10, 25, 50, 100].map(n => (
                                                    <SelectItem key={n} value={String(n)} className="cursor-pointer text-xs font-bold">
                                                        {toLocaleNumber(n, shortCode)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-400">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" onClick={copyToClipboard}>
                                            <Copy className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" onClick={exportToExcel}>
                                            <FileSpreadsheet className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" onClick={exportToPDF}>
                                            <FileText className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" onClick={() => window.print()}>
                                            <Printer className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors">
                                            <Columns className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border border-gray-200 overflow-x-auto custom-scrollbar shadow-xs bg-white">
                                <Table>
                                    <TableHeader className="!bg-[#f1f5f9] dark:!bg-slate-800 text-[11px] uppercase font-bold text-slate-700 dark:text-slate-200 border-b border-gray-200">
                                        <TableRow className="hover:bg-transparent border-b border-gray-200">
                                            <TableHead className="text-[11px] font-bold uppercase text-slate-700 py-3.5 px-4 w-[60px] text-center whitespace-nowrap">{t("no")}</TableHead>
                                            <TableHead className="text-[11px] font-bold uppercase text-slate-700 py-3.5 px-4 whitespace-nowrap">{t("leave_type")}</TableHead>
                                            <TableHead className="text-[11px] font-bold uppercase text-slate-700 py-3.5 px-4 text-right whitespace-nowrap">{t("action")}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="bg-white divide-y divide-gray-100">
                                        {loading ? (
                                            <TableSkeleton rows={5} cols={3} />
                                        ) : paginatedData.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_data_found")}</TableCell>
                                            </TableRow>
                                        ) : (
                                            paginatedData.map((lt, idx) => (
                                                <TableRow key={lt.id} className="border-b border-gray-100 hover:bg-indigo-50/40 hover:shadow-xs transition-all duration-200 text-[11px] bg-white">
                                                    <TableCell className="py-3.5 px-4 text-gray-500 font-medium text-center whitespace-nowrap">{toLocaleNumber(startIndex + idx + 1, shortCode)}</TableCell>
                                                    <TableCell className="py-3.5 px-4 text-gray-800 font-medium whitespace-nowrap">{translateLeaveTypeName(lt.name, shortCode)}</TableCell>
                                                    <TableCell className="py-3.5 px-4 text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Button onClick={() => handleEdit(lt)} size="icon" variant="ghost" className="h-7 w-7 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xs active:scale-95 transition-all cursor-pointer">
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button onClick={() => handleDelete(lt.id)} size="icon" variant="ghost" className="h-7 w-7 rounded-lg bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-xs active:scale-95 transition-all cursor-pointer">
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="flex justify-end items-center gap-2 py-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    className="h-8 w-8 rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:opacity-90 disabled:opacity-30 cursor-pointer"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <Button
                                        key={page}
                                        variant="ghost"
                                        onClick={() => setCurrentPage(page)}
                                        className={cn(
                                            "h-8 w-8 rounded-[10px] text-[10px] font-bold p-0 transition-all cursor-pointer",
                                            currentPage === page
                                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-md scale-105"
                                                : "bg-white border border-gray-200 text-gray-600 hover:text-indigo-600"
                                        )}
                                    >
                                        {toLocaleNumber(page, shortCode)}
                                    </Button>
                                ))}

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    className="h-8 w-8 rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:opacity-90 disabled:opacity-30 cursor-pointer"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
}
