"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Pencil, Trash2, Copy, FileSpreadsheet, FileText, Printer, Columns, ChevronLeft, ChevronRight, Loader2, LayoutGrid
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

interface Section {
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
                    limit: 10
                }
            });
            const { data } = response.data;
            setSections(data.data);
            setCurrentPage(data.current_page);
            setLastPage(data.last_page);
            setTotal(data.total);
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
    }, [searchTerm]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sectionName.trim()) {
            tt.error("please_fill_required_fields");
            return;
        }

        setSaving(true);
        try {
            if (editingId) {
                await api.put(`/academics/sections/${editingId}`, { name: sectionName });
                tt.success("updated_successfully");
            } else {
                await api.post(`/academics/sections`, { name: sectionName });
                tt.success("created_successfully");
            }
            setSectionName("");
            setEditingId(null);
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
        const text = sections.map(s => s.name).join("\n");
        navigator.clipboard.writeText(text);
        tt.success("copied_to_clipboard");
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(sections.map(s => ({ [t("section")]: s.name })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sections");
        XLSX.writeFile(workbook, "sections.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        autoTable(doc, {
            head: [[t("section")]],
            body: sections.map(s => [s.name]),
        });
        doc.save("sections.pdf");
    };

    const printTable = () => {
        const printWindow = window.open('', '', 'height=600,width=800');
        if (!printWindow) return;
        printWindow.document.write('<html><head><title>' + t("section_list") + '</title>');
        printWindow.document.write('<style>table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; }</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write('<h2>' + t("section_list") + '</h2>');
        printWindow.document.write('<table><thead><tr><th>' + t("section") + '</th></tr></thead><tbody>');
        sections.forEach(s => {
            printWindow.document.write(`<tr><td>${s.name}</td></tr>`);
        });
        printWindow.document.write('</tbody></table></body></html>');
        printWindow.document.close();
        printWindow.print();
    };

    // Gradient background utility for save button (primary action)
    const saveGradient = "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white shadow-sm transition-all";

    return (
        <div className="flex flex-col lg:flex-row gap-6 font-sans">
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
                    <CardContent>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="sectionName" className="text-sm font-medium text-gray-700">
                                    {t("section_name")} <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="sectionName"
                                    className="h-9 focus-visible:ring-indigo-500"
                                    value={sectionName}
                                    onChange={(e) => setSectionName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className={`px-8 h-9 text-xs flex items-center gap-2 ${saveGradient}`}
                                >
                                    {saving && <Loader2 className="h-3 w-3 animate-spin" />}
                                    {editingId ? t("update") : t("save")}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </form>

            {/* Right Column: Section List */}
            <div className="w-full lg:w-2/3">
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <LayoutGrid className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("section_list")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("total_entries_count", { count: total })}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="relative w-full md:w-64">
                                <Input
                                    placeholder={t("search")}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-3 h-8 text-xs border-gray-200 focus-visible:ring-indigo-500"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 mr-2">
                                    <span className="text-xs text-gray-500 font-medium">50</span>
                                    <ChevronLeft className="h-3 w-3 text-gray-400 rotate-90" />
                                </div>
                                <div className="flex items-center gap-1 text-gray-400">
                                    <Button onClick={exportToCopy} variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button onClick={exportToExcel} variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                        <FileSpreadsheet className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button onClick={exportToPDF} variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                        <FileText className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button onClick={printTable} variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                        <Printer className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                        <Columns className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border border-gray-200/50 shadow-sm overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-100 text-[11px] uppercase font-bold text-gray-600">
                                    <TableRow className="hover:bg-transparent border-gray-100">
                                        <TableHead className="font-bold text-gray-700 py-3">{t("section")}</TableHead>
                                        <TableHead className="font-bold text-gray-700 text-right py-3">{t("action")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton rows={5} cols={2} />
                                    ) : sections.length === 0 ? (
                                        <tr>
                                            <td colSpan={2} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_data_found")}</td>
                                        </tr>
                                    ) : (
                                        sections.map((sec) => (
                                            <TableRow key={sec.id} className="text-[13px] hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer group border-b last:border-0 border-gray-50">
                                                <TableCell className="text-gray-600 font-normal py-3.5">{sec.name}</TableCell>
                                                <TableCell className="text-right py-3.5">
                                                    <div className="flex items-center justify-end gap-1 transition-opacity">
                                                        <Button
                                                            onClick={() => handleEdit(sec)}
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded shadow-sm"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            onClick={() => confirmDelete(sec.id)}
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded shadow-sm"
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

                        <div className="flex items-center justify-between text-xs text-gray-500 font-medium pt-2">
                            <div>
                                {t("showing_x_to_y_of_z", { from, to, total })}
                            </div>
                            <div className="flex gap-1">
                                <Button
                                    size="sm"
                                    className="h-7 w-7 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50"
                                    disabled={currentPage === 1}
                                    onClick={() => fetchSections(currentPage - 1)}
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                {Array.from({ length: lastPage }, (_, i) => i + 1).map((page) => (
                                    <Button
                                        key={page}
                                        size="sm"
                                        className={`h-7 w-7 p-0 rounded-[10px] ${currentPage === page
                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0"
                                            : "bg-white border border-gray-200 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"}`}
                                        onClick={() => fetchSections(page)}
                                    >
                                        {page}
                                    </Button>
                                ))}
                                <Button
                                    size="sm"
                                    className="h-7 w-7 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50"
                                    disabled={currentPage === lastPage}
                                    onClick={() => fetchSections(currentPage + 1)}
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("are_you_absolutely_sure")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("delete_section_confirm_message")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
