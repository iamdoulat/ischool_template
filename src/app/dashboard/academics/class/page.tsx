"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Pencil, Trash2, Copy, FileSpreadsheet, FileText, Printer, Columns, ChevronLeft, ChevronRight, Loader2, X, School
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
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
import api from "@/lib/api";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Section {
    id: number;
    name: string;
}

interface ClassData {
    id: number;
    name: string;
    sections: Section[];
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

export default function ClassPage() {
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [className, setClassName] = useState("");
    // sections stored as array of name strings e.g. ["A","B","C"]
    const [availableSections, setAvailableSections] = useState<Section[]>([]);
    const [sectionTags, setSectionTags] = useState<string[]>([]);
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

    const fetchClasses = async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(`/academics/classes`, {
                params: { page, search: searchTerm, limit: 10 }
            });
            const { data } = response.data;
            setClasses(data.data);
            setCurrentPage(data.current_page);
            setLastPage(data.last_page);
            setTotal(data.total);
            setFrom(data.from || 0);
            setTo(data.to || 0);
        } catch (error) {
            console.error("Error fetching classes:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableSections = async () => {
        try {
            const response = await api.get(`/academics/sections?no_paginate=true`);
            if (response.data?.data) {
                setAvailableSections(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching available sections:", error);
        }
    };

    useEffect(() => {
        fetchClasses(1);
        fetchAvailableSections();
    }, [searchTerm]);

    // Add a section tag when user presses Enter or comma
    const addSectionTag = (val: string) => {
        const cleanVal = val.trim().replace(/,/g, "");
        if (cleanVal && !sectionTags.map(t => t.toUpperCase()).includes(cleanVal.toUpperCase())) {
            setSectionTags(prev => [...prev, cleanVal.toUpperCase()]);
        }
    };

    const removeSectionTag = (tag: string) => {
        setSectionTags(prev => prev.filter(t => t !== tag));
    };

    const resetForm = () => {
        setClassName("");
        setSectionTags([]);
        setEditingId(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        const allTags = [...sectionTags];

        if (!className.trim()) {
            tt.error("please_fill_required_fields");
            return;
        }
        if (allTags.length === 0) {
            tt.error("add_at_least_one_section");
            return;
        }

        setSaving(true);
        try {
            const payload = { name: className, sections: allTags };

            if (editingId) {
                await api.put(`/academics/classes/${editingId}`, payload);
            } else {
                await api.post(`/academics/classes`, payload);
            }
            resetForm();
            fetchClasses(currentPage);
            tt.success(editingId ? "updated_successfully" : "created_successfully");
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            tt.error(err.response?.data?.message || "failed_to_save");
            console.error("Error saving class:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (cls: ClassData) => {
        setClassName(cls.name);
        setSectionTags(cls.sections.map(s => s.name));
        setEditingId(cls.id);
    };

    const confirmDelete = (id: number) => {
        setIdToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!idToDelete) return;
        setLoading(true);
        try {
            const response = await api.delete(`/academics/classes/${idToDelete}`);
            if (response.data.status === "success") {
                tt.success("deleted_successfully");
                fetchClasses(currentPage);
            }
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            tt.error(err.response?.data?.message || "failed_to_delete");
        } finally {
            setLoading(false);
            setIsDeleteDialogOpen(false);
            setIdToDelete(null);
        }
    };

    const exportToCopy = () => {
        const text = classes.map(c => `${c.name}: ${c.sections.map(s => s.name).join(", ")}`).join("\n");
        navigator.clipboard.writeText(text);
        tt.success("copied_to_clipboard");
    };

    const exportToExcel = () => {
        const data = classes.map(c => ({ [t("class")]: c.name, [t("sections")]: c.sections.map(s => s.name).join(", ") }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Classes");
        XLSX.writeFile(workbook, "classes.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        autoTable(doc, {
            head: [[t("class"), t("sections")]],
            body: classes.map(c => [c.name, c.sections.map(s => s.name).join(", ")]),
        });
        doc.save("classes.pdf");
    };

    const printTable = () => {
        const printWindow = window.open("", "", "height=600,width=800");
        if (!printWindow) return;
        printWindow.document.write("<html><head><title>" + t("class_list") + "</title>");
        printWindow.document.write("<style>table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background:#f2f2f2;}</style>");
        printWindow.document.write("</head><body><h2>" + t("class_list") + "</h2><table><thead><tr><th>" + t("class") + "</th><th>" + t("sections") + "</th></tr></thead><tbody>");
        classes.forEach(c => { printWindow.document.write(`<tr><td>${c.name}</td><td>${c.sections.map(s => s.name).join(", ")}</td></tr>`); });
        printWindow.document.write("</tbody></table></body></html>");
        printWindow.document.close();
        printWindow.print();
    };

    const saveGradient = "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white shadow-sm transition-all";

    return (
        <div className="flex flex-col lg:flex-row gap-6 font-sans">
            {/* Left Column: Add/Edit Class Form */}
            <form onSubmit={handleSave} className="w-full lg:w-1/3">
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 sticky top-6">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <School className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                {editingId ? t("edit_class") : t("add_class")}
                            </CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {editingId ? t("update_class_details") : t("create_class_with_sections")}
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="space-y-4">
                            {/* Class Name */}
                            <div className="space-y-2">
                                <Label htmlFor="className" className="text-sm font-medium text-gray-700">
                                    {t("class")} <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="className"
                                    className="h-9 focus-visible:ring-indigo-500"
                                    value={className}
                                    onChange={(e) => setClassName(e.target.value)}
                                    placeholder={t("e.g. class_1")}
                                    required
                                />
                            </div>

                            {/* Sections Tag Input */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">
                                    {t("sections")} <span className="text-red-500">*</span>
                                </Label>
                                <p className="text-xs text-gray-400">{t("select_sections_to_add")}</p>

                                <Select onValueChange={addSectionTag}>
                                    <SelectTrigger className="h-9 focus-visible:ring-indigo-500">
                                        <SelectValue placeholder={t("select_section_to_add")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableSections.length === 0 && (
                                            <div className="p-2 text-xs text-gray-500 text-center">{t("no_sections_available")}</div>
                                        )}
                                        {availableSections.map((sec) => (
                                            <SelectItem key={sec.name} value={sec.name} disabled={sectionTags.includes(sec.name)}>
                                                {sec.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Tag display */}
                                {sectionTags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 p-2 border border-gray-200 rounded-md bg-gray-50 min-h-[40px] mt-2">
                                        {sectionTags.map(tag => (
                                            <span
                                                key={tag}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700"
                                            >
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => removeSectionTag(tag)}
                                                    className="hover:text-indigo-900 cursor-pointer"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                {editingId && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={resetForm}
                                        className="px-4 h-9 text-xs"
                                    >
                                        {t("cancel")}
                                    </Button>
                                )}
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

            {/* Right Column: Class List */}
            <div className="w-full lg:w-2/3">
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <School className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("class_list")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("total_entries_count", { count: total })}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="relative w-full md:w-64">
                                <Input
                                    placeholder={t("search")}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-3 h-8 text-xs border-gray-200 focus-visible:ring-indigo-500"
                                />
                            </div>

                            <div className="flex items-center gap-1 text-gray-400">
                                <Button onClick={exportToCopy} variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50 hover:text-indigo-600" title={t("copy")}>
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button onClick={exportToExcel} variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50 hover:text-indigo-600" title={t("excel")}>
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                </Button>
                                <Button onClick={exportToPDF} variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50 hover:text-indigo-600" title={t("pdf")}>
                                    <FileText className="h-3.5 w-3.5" />
                                </Button>
                                <Button onClick={printTable} variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50 hover:text-indigo-600" title={t("print")}>
                                    <Printer className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50 hover:text-indigo-600" title={t("columns")}>
                                    <Columns className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>

                        <div className="rounded-lg border border-gray-200/50 shadow-sm overflow-hidden min-h-[300px] relative">
                            <Table>
                                <TableHeader className="bg-gray-100 text-[11px] uppercase font-bold text-gray-600">
                                    <TableRow className="hover:bg-transparent border-gray-100">
                                        <TableHead className="font-bold text-gray-700 py-3">{t("class")}</TableHead>
                                        <TableHead className="font-bold text-gray-700 py-3">{t("sections")}</TableHead>
                                        <TableHead className="font-bold text-gray-700 text-right py-3">{t("action")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton rows={5} cols={3} />
                                    ) : classes.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_data_found")}</td>
                                        </tr>
                                    ) : (
                                        classes.map((cls) => (
                                            <TableRow key={cls.id} className="text-[13px] hover:bg-gray-50/50 border-b last:border-0 border-gray-50">
                                                <TableCell className="text-gray-600 font-medium py-3.5 align-middle">{cls.name}</TableCell>
                                                <TableCell className="text-gray-600 py-3.5 align-middle">
                                                    <div className="flex flex-wrap gap-1">
                                                        {cls.sections.length > 0
                                                            ? cls.sections.map((section) => (
                                                                <span
                                                                    key={section.id}
                                                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700"
                                                                >
                                                                    {section.name}
                                                                </span>
                                                            ))
                                                            : <span className="text-gray-400 text-xs italic">{t("no_sections")}</span>
                                                        }
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-3.5 align-middle">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            onClick={() => handleEdit(cls)}
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded shadow-sm"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            onClick={() => confirmDelete(cls.id)}
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

                        {/* Pagination */}
                        <div className="flex items-center justify-between text-xs text-gray-500 font-medium pt-2">
                            <div>{t("showing_x_to_y_of_z", { from, to, total })}</div>
                            <div className="flex gap-1">
                                <Button
                                    variant="outline" size="sm"
                                    className="h-7 w-7 p-0 bg-white border border-gray-200 text-gray-600 rounded-[10px]"
                                    disabled={currentPage === 1}
                                    onClick={() => fetchClasses(currentPage - 1)}
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                {Array.from({ length: lastPage }, (_, i) => i + 1).map((page) => (
                                    <Button
                                        key={page}
                                        variant={currentPage === page ? "default" : "outline"}
                                        size="sm"
                                        className={`h-7 w-7 p-0 rounded-[10px] ${currentPage === page ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0" : "bg-white border border-gray-200 text-gray-600"}`}
                                        onClick={() => fetchClasses(page)}
                                    >
                                        {page}
                                    </Button>
                                ))}
                                <Button
                                    variant="outline" size="sm"
                                    className="h-7 w-7 p-0 bg-white border border-gray-200 text-gray-600 rounded-[10px]"
                                    disabled={currentPage === lastPage}
                                    onClick={() => fetchClasses(currentPage + 1)}
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
                            {t("delete_class_confirm_message")}
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
