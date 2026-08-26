"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
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
    Loader2,
    LayoutGrid,
    Search,
    Layers,
    Sparkles,
    CheckCircle2,
    Hash
} from "lucide-react";
import api from "@/lib/api";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
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
import { cn } from "@/lib/utils";

interface Section {
    id: number;
    name: string;
    created_at?: string;
}

const SECTION_PRESETS = ["A", "B", "C", "D", "Rose", "Lotus", "Lily", "Science", "Commerce", "Arts"];

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-4 rounded-md bg-muted/60 animate-pulse"
                                style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

export default function SectionsPage() {
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [sectionName, setSectionName] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState<number | null>(null);
    const { toast } = useToast();
    const { t } = useTranslation();
    const tt = useTranslateToast();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [from, setFrom] = useState(0);
    const [to, setTo] = useState(0);

    const fetchSections = async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(`/academics/sections`, {
                params: {
                    page: page,
                    search: searchTerm,
                    limit: itemsPerPage
                }
            });
            const { data } = response.data;
            setSections(data.data || []);
            setCurrentPage(data.current_page || 1);
            setLastPage(data.last_page || 1);
            setTotal(data.total || 0);
            setFrom(data.from || 0);
            setTo(data.to || 0);
        } catch (error) {
            console.error("Error fetching sections:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSections(1);
    }, [searchTerm, itemsPerPage]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sectionName.trim()) {
            tt.error("please_fill_required_fields");
            return;
        }

        setSaving(true);
        try {
            if (editingId) {
                await api.put(`/academics/sections/${editingId}`, { name: sectionName.trim() });
                tt.success("updated_successfully");
            } else {
                await api.post(`/academics/sections`, { name: sectionName.trim() });
                tt.success("created_successfully");
            }
            resetForm();
            fetchSections(currentPage);
        } catch (error) {
            console.error("Error saving section:", error);
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            tt.error(err.response?.data?.message || "failed_to_save");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (section: Section) => {
        setSectionName(section.name);
        setEditingId(section.id);
    };

    const resetForm = () => {
        setSectionName("");
        setEditingId(null);
    };

    const confirmDelete = (id: number) => {
        setIdToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!idToDelete) return;
        setLoading(true);
        try {
            await api.delete(`/academics/sections/${idToDelete}`);
            fetchSections(currentPage);
            tt.success("deleted_successfully");
        } catch (error) {
            console.error("Error deleting section:", error);
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            tt.error(err.response?.data?.message || "failed_to_delete");
        } finally {
            setLoading(false);
            setIsDeleteDialogOpen(false);
            setIdToDelete(null);
        }
    };

    const exportToCopy = () => {
        const text = sections.map((s, idx) => `${idx + 1}. Section ${s.name}`).join("\n");
        navigator.clipboard.writeText(text);
        tt.success("copied_to_clipboard");
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(sections.map((s, idx) => ({
            "#": idx + 1,
            "Section Name": `Section ${s.name}`,
            "Status": "Active"
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sections");
        XLSX.writeFile(workbook, "sections.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Section List", 14, 15);
        autoTable(doc, {
            head: [["#", "Section Name", "Status"]],
            body: sections.map((s, idx) => [idx + 1, `Section ${s.name}`, "Active"]),
            startY: 20
        });
        doc.save("sections.pdf");
    };

    const printTable = () => {
        window.print();
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 font-sans p-3 sm:p-5 bg-gray-50/10 min-h-screen">
            {/* Left Column: Add Section Form */}
            <form onSubmit={handleSave} className="w-full lg:w-1/3">
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 sticky top-6">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <LayoutGrid className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                {editingId ? t("edit_section") : t("add_section")}
                            </CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {editingId ? t("update_existing_section") : t("create_new_section")}
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="px-5 pb-5 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="sectionName" className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                {t("section_name")} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="sectionName"
                                placeholder="e.g. A, B, Rose, Science..."
                                className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none focus-visible:ring-indigo-500"
                                value={sectionName}
                                onChange={(e) => setSectionName(e.target.value)}
                                required
                            />
                        </div>

                        {/* Quick Presets Bar */}
                        <div className="space-y-1.5 pt-1">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <Sparkles className="h-3 w-3 text-amber-500" /> Quick Section Presets
                            </Label>
                            <div className="flex flex-wrap gap-1.5">
                                {SECTION_PRESETS.map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => setSectionName(preset)}
                                        className={cn(
                                            "px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer",
                                            sectionName === preset
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                                : "bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 border-gray-200"
                                        )}
                                    >
                                        {preset}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                            {editingId && (
                                <Button
                                    type="button"
                                    onClick={resetForm}
                                    variant="outline"
                                    className="h-9 px-4 rounded-full text-xs font-bold uppercase border-gray-200"
                                >
                                    {t("cancel")}
                                </Button>
                            )}
                            <Button
                                type="submit"
                                disabled={saving}
                                className="btn-gradient text-white px-8 h-9 text-[11px] font-bold uppercase shadow-lg shadow-orange-200/50 transition-all rounded-full flex items-center gap-2"
                            >
                                {saving && <Loader2 className="h-3 w-3 animate-spin" />}
                                {editingId ? t("update") : t("save")}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>

            {/* Right Column: Section List */}
            <div className="w-full lg:w-2/3">
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <LayoutGrid className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("section_list")}</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{t("total_entries_count", { count: total })}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Select value={String(itemsPerPage)} onValueChange={(val) => { setItemsPerPage(Number(val)); setCurrentPage(1); }}>
                                <SelectTrigger className="h-8 w-16 text-xs border-gray-200 rounded-lg">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex items-center gap-1 text-gray-400">
                                <Button onClick={exportToCopy} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title="Copy">
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button onClick={exportToExcel} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title="Export Excel">
                                    <FileSpreadsheet className="h-4 w-4" />
                                </Button>
                                <Button onClick={exportToPDF} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title="Export PDF">
                                    <FileText className="h-4 w-4" />
                                </Button>
                                <Button onClick={printTable} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title="Print">
                                    <Printer className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title="Columns">
                                    <Columns className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="px-5 pb-5 space-y-4">
                        {/* Search Bar */}
                        <div className="flex justify-between items-center gap-4">
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search sections..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 h-9 text-xs border-gray-200 bg-gray-50/30 rounded-lg focus-visible:ring-indigo-500 shadow-none"
                                />
                            </div>

                            {sections.length > 0 && (
                                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10.5px] font-bold py-1 px-2.5">
                                    <Layers className="h-3 w-3 mr-1" />
                                    {total} Academic Sections
                                </Badge>
                            )}
                        </div>

                        {/* Enhanced Table */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xs">
                            <Table>
                                <TableHeader className="bg-gray-50/90 dark:bg-gray-800/80 text-[11px] uppercase font-bold text-gray-600 dark:text-gray-300">
                                    <TableRow className="hover:bg-transparent border-gray-200 dark:border-gray-700">
                                        <TableHead className="py-3 px-4 w-[60px]">#</TableHead>
                                        <TableHead className="py-3 px-4 min-w-[200px]">{t("section")}</TableHead>
                                        <TableHead className="py-3 px-4 w-[160px]">Display Badge</TableHead>
                                        <TableHead className="py-3 px-4 w-[140px]">Status</TableHead>
                                        <TableHead className="py-3 px-4 text-right w-[100px]">{t("action")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton rows={4} cols={5} />
                                    ) : sections.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="px-4 py-16 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                                                {t("no_data_found")}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        sections.map((sec, idx) => (
                                            <TableRow
                                                key={sec.id}
                                                className="text-[13px] border-b last:border-0 border-gray-100 dark:border-gray-800 hover:bg-indigo-50/25 transition-colors group"
                                            >
                                                {/* Serial Number */}
                                                <TableCell className="py-3.5 px-4 font-bold text-gray-400 text-xs">
                                                    {(currentPage - 1) * itemsPerPage + idx + 1}
                                                </TableCell>

                                                {/* Section Name with Monogram */}
                                                <TableCell className="py-3.5 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-black text-xs shadow-2xs shrink-0">
                                                            {sec.name.slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                                                                Section {sec.name}
                                                            </p>
                                                            <p className="text-[11px] text-gray-400 font-medium">
                                                                Code: SEC-{sec.name.toUpperCase()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Display Badge */}
                                                <TableCell className="py-3.5 px-4">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-100 dark:border-indigo-800 shadow-2xs">
                                                        <LayoutGrid className="h-3 w-3 text-indigo-500" />
                                                        {sec.name}
                                                    </span>
                                                </TableCell>

                                                {/* Status */}
                                                <TableCell className="py-3.5 px-4">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                                                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                                        Active
                                                    </span>
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell className="py-3.5 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            onClick={() => handleEdit(sec)}
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all shadow-xs"
                                                            title="Edit Section"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            onClick={() => confirmDelete(sec.id)}
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-7 w-7 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all shadow-xs"
                                                            title="Delete Section"
                                                        >
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

                        {/* Pagination Footer */}
                        {total > 0 && (
                            <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold pt-2 uppercase tracking-tight">
                                <div>
                                    {t("showing_x_to_y_of_z", { from, to, total })}
                                </div>
                                <div className="flex gap-1.5">
                                    <Button
                                        size="sm"
                                        className="h-8 w-8 p-0 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0 rounded-[10px] shadow-sm disabled:opacity-40"
                                        disabled={currentPage === 1}
                                        onClick={() => fetchSections(currentPage - 1)}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    {Array.from({ length: lastPage }, (_, i) => i + 1).map((page) => (
                                        <Button
                                            key={page}
                                            size="sm"
                                            className={cn(
                                                "h-8 w-8 p-0 rounded-[10px] text-xs font-black shadow-sm transition-all",
                                                currentPage === page
                                                    ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0"
                                                    : "bg-white border border-gray-200 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
                                            )}
                                            onClick={() => fetchSections(page)}
                                        >
                                            {page}
                                        </Button>
                                    ))}
                                    <Button
                                        size="sm"
                                        className="h-8 w-8 p-0 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0 rounded-[10px] shadow-sm disabled:opacity-40"
                                        disabled={currentPage === lastPage || lastPage === 0}
                                        onClick={() => fetchSections(currentPage + 1)}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">{t("are_you_absolutely_sure")}</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            {t("delete_section_confirm_message")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-9 rounded-full text-[11px] font-bold uppercase tracking-wider border-gray-200">{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-rose-500 hover:bg-rose-600 h-9 rounded-full text-[11px] font-bold uppercase tracking-wider border-0 shadow-md">
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
