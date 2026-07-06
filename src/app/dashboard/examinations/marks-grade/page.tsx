"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Pencil, Trash2, Search, Award, GraduationCap,
    BadgeCheck, Copy, FileSpreadsheet,
    FileText, Printer, Columns, ChevronLeft, ChevronRight
} from "lucide-react";
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
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface GradeEntry {
    id: string;
    exam_type: string;
    name: string;
    percent_from: string;
    percent_upto: string;
    grade_point: string;
    description: string;
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

export default function MarksGradePage() {
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [grades, setGrades] = useState<GradeEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form State
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        exam_type: "",
        name: "",
        percent_from: "",
        percent_upto: "",
        grade_point: "",
        description: ""
    });

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Pagination (client-side since backend returns all records)
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState("50");
    const itemsPerPage = parseInt(rowsPerPage);

    const fetchGrades = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/examination/marks-grades', {
                params: { search: searchTerm }
            });
            // Defensive unwrapping per AGENTS.md convention
            const result = response.data;
            const list = result?.data?.data || result?.data || result || [];
            setGrades(Array.isArray(list) ? list : []);
        } catch (error) {
            tt.error("failed_to_fetch_grades");
            setGrades([]);
        } finally {
            setLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        fetchGrades();
    }, [fetchGrades]);

    // Filter and paginate on client side
    const filteredGrades = useMemo(() => {
        if (!searchTerm) return grades;
        const term = searchTerm.toLowerCase();
        return grades.filter(g =>
            g.name.toLowerCase().includes(term) ||
            g.exam_type.toLowerCase().includes(term)
        );
    }, [grades, searchTerm]);

    const totalEntries = filteredGrades.length;
    const totalPages = Math.ceil(totalEntries / itemsPerPage);
    const paginatedGrades = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredGrades.slice(start, start + itemsPerPage);
    }, [filteredGrades, currentPage, itemsPerPage]);

    // Group paginated data by exam_type for rowSpan display
    const groupedData = useMemo(() => {
        const groups: { [key: string]: GradeEntry[] } = {};
        paginatedGrades.forEach((entry) => {
            if (!groups[entry.exam_type]) {
                groups[entry.exam_type] = [];
            }
            groups[entry.exam_type].push(entry);
        });
        return Object.entries(groups);
    }, [paginatedGrades]);

    const handleSave = async () => {
        if (!formData.exam_type || !formData.name.trim() || !formData.percent_from || !formData.percent_upto || !formData.grade_point) {
            tt.error("please_fill_in_all_required_fields");
            return;
        }

        const pFrom = parseFloat(formData.percent_from);
        const pUpto = parseFloat(formData.percent_upto);
        const gPoint = parseFloat(formData.grade_point);

        if (pFrom < 0 || pFrom > 100 || pUpto < 0 || pUpto > 100) {
            tt.error("percentage_must_be_between_0_and_100");
            return;
        }

        if (pFrom > pUpto) {
            tt.error("percent_from_must_be_less_than_percent_upto");
            return;
        }

        if (gPoint < 0) {
            tt.error("grade_point_must_be_non_negative");
            return;
        }

        const payload = {
            exam_type: formData.exam_type,
            name: formData.name.trim(),
            percent_from: pFrom,
            percent_upto: pUpto,
            grade_point: gPoint,
            description: formData.description.trim()
        };

        setSaving(true);
        try {
            if (editMode && selectedId) {
                await api.put(`/examination/marks-grades/${selectedId}`, payload);
                tt.success("grade_updated_successfully");
            } else {
                await api.post('/examination/marks-grades', payload);
                tt.success("grade_created_successfully");
            }
            resetForm();
            fetchGrades();
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            tt.error(err.response?.data?.message || "failed_to_save_grade");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (grade: GradeEntry) => {
        setFormData({
            exam_type: grade.exam_type,
            name: grade.name,
            percent_from: grade.percent_from,
            percent_upto: grade.percent_upto,
            grade_point: grade.grade_point,
            description: grade.description || ""
        });
        setSelectedId(grade.id);
        setEditMode(true);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/examination/marks-grades/${deleteId}`);
            tt.success("grade_deleted_successfully");
            // Adjust page if needed after delete
            if (filteredGrades.length === 1 && currentPage > 1) {
                setCurrentPage(prev => prev - 1);
            } else {
                fetchGrades();
            }
        } catch (error) {
            tt.error("failed_to_delete_grade");
        } finally {
            setDeleteId(null);
        }
    };

    const resetForm = () => {
        setFormData({
            exam_type: "",
            name: "",
            percent_from: "",
            percent_upto: "",
            grade_point: "",
            description: ""
        });
        setEditMode(false);
        setSelectedId(null);
    };

    // Export functions
    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(filteredGrades.map(g => ({
            [t("exam_type")]: g.exam_type,
            [t("grade_name")]: g.name,
            [t("percent_from")]: g.percent_from,
            [t("percent_upto")]: g.percent_upto,
            [t("grade_point")]: g.grade_point,
            [t("description")]: g.description || ""
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, t("marks_grade"));
        XLSX.writeFile(wb, "marks-grades.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text(t("marks_grade"), 14, 15);
        autoTable(doc, {
            head: [[t("exam_type"), t("grade_name"), t("percent_from"), t("percent_upto"), t("grade_point"), t("description")]],
            body: filteredGrades.map(g => [g.exam_type, g.name, `${g.percent_from}%`, `${g.percent_upto}%`, g.grade_point, g.description || "-"]),
            startY: 20,
        });
        doc.save("marks-grades.pdf");
    };

    const copyToClipboard = () => {
        const text = filteredGrades.map(g => `${g.exam_type}\t${g.name}\t${g.percent_from}%\t${g.percent_upto}%\t${g.grade_point}\t${g.description || "-"}`).join('\n');
        navigator.clipboard.writeText(text);
        tt.success("data_copied_to_clipboard");
    };

    return (
        <div className="space-y-6 font-sans p-4 bg-gray-50/10 min-h-screen">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Column: Add Marks Grade Form */}
                <div className="lg:col-span-1">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 sticky top-6">
                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <BadgeCheck className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                    {editMode ? t("edit_grade") : t("add_grade")}
                                </CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{t("define_grading_criteria")}</p>
                            </div>
                        </CardHeader>
                        <CardContent className="px-6 pb-6">
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                        {t("exam_type")} <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={formData.exam_type} onValueChange={(val) => setFormData({...formData, exam_type: val})}>
                                        <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 text-sm rounded-lg focus:ring-indigo-500 shadow-none">
                                            <SelectValue placeholder={t("select")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="General Purpose (Pass/Fail)">{t("general_purpose_pass_fail")}</SelectItem>
                                            <SelectItem value="School Based Grading System">{t("school_based_grading_system")}</SelectItem>
                                            <SelectItem value="College Based Grading System">{t("college_based_grading_system")}</SelectItem>
                                            <SelectItem value="GPA Grading System">{t("gpa_grading_system")}</SelectItem>
                                            <SelectItem value="Average Passing">{t("average_passing")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                        {t("grade_name")} <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        placeholder="e.g. A+"
                                        className="h-11 border-gray-100 bg-gray-50/30 text-sm rounded-lg focus:ring-indigo-500 shadow-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                            {t("percent_from")} <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            type="number"
                                            value={formData.percent_from}
                                            onChange={(e) => setFormData({...formData, percent_from: e.target.value})}
                                            placeholder="0.00"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            className="h-11 border-gray-100 bg-gray-50/30 text-sm rounded-lg focus:ring-indigo-500 shadow-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                            {t("percent_upto")} <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            type="number"
                                            value={formData.percent_upto}
                                            onChange={(e) => setFormData({...formData, percent_upto: e.target.value})}
                                            placeholder="100.00"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            className="h-11 border-gray-100 bg-gray-50/30 text-sm rounded-lg focus:ring-indigo-500 shadow-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                        {t("grade_point")} <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        value={formData.grade_point}
                                        onChange={(e) => setFormData({...formData, grade_point: e.target.value})}
                                        placeholder="e.g. 4.0"
                                        className="h-11 border-gray-100 bg-gray-50/30 text-sm rounded-lg focus:ring-indigo-500 shadow-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                        {t("description")}
                                    </Label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        placeholder={t("enter_grade_description")}
                                        className="min-h-[100px] border-gray-100 bg-gray-50/30 text-sm rounded-lg focus:ring-indigo-500 p-4"
                                    />
                                </div>

                                <div className="flex gap-2 pt-4 justify-end">
                                    {editMode && (
                                        <Button onClick={resetForm} variant="outline" className="h-10 rounded-full text-[10px] font-bold uppercase tracking-widest border-gray-200 px-5">
                                            {t("cancel")}
                                        </Button>
                                    )}
                                    <Button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white h-9 text-[10px] font-bold uppercase tracking-wider rounded-full px-6 transition-all active:scale-95"
                                    >
                                        {saving ? t("saving") : editMode ? t("update") : t("save")}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Grade List */}
                <div className="lg:col-span-3">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                        <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                    <GraduationCap className="h-5 w-5" />
                                </span>
                                <div>
                                    <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("marks_grade")}</CardTitle>
                                    <p className="text-[11px] text-gray-500 mt-1">{t("x_grades", { count: totalEntries })}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Select value={rowsPerPage} onValueChange={(v) => { setRowsPerPage(v); setCurrentPage(1); }}>
                                    <SelectTrigger className="w-[65px] h-8 text-xs border-gray-200 rounded-lg">
                                        <SelectValue placeholder="50" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                        <SelectItem value="500">500</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex items-center gap-1 text-gray-400">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer" onClick={copyToClipboard} title={t("copy")}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer" onClick={exportToExcel} title={t("export_excel")}>
                                        <FileSpreadsheet className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer" onClick={exportToPDF} title={t("export_pdf")}>
                                        <FileText className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer" onClick={() => window.print()} title={t("print")}>
                                        <Printer className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer" title={t("columns")}>
                                        <Columns className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-6 pb-6 space-y-6">
                            <div className="flex justify-end">
                                <div className="relative w-full md:w-72">
                                    <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder={t("search_grades")}
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="pl-10 h-11 text-sm border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none"
                                    />
                                </div>
                            </div>

                            <div className="rounded-lg border border-gray-50 overflow-hidden shadow-sm">
                                <Table>
                                    <TableHeader className="bg-gray-50/50 text-[11px] uppercase font-bold text-gray-600">
                                        <TableRow className="hover:bg-transparent border-gray-50">
                                            <TableHead className="py-4 px-6">{t("exam_type")}</TableHead>
                                            <TableHead className="py-4 px-6">{t("grade_name")}</TableHead>
                                            <TableHead className="py-4 px-6">{t("percent_from_upto")}</TableHead>
                                            <TableHead className="py-4 px-6">{t("grade_point")}</TableHead>
                                            <TableHead className="py-4 px-6">{t("description")}</TableHead>
                                            <TableHead className="py-4 px-6 text-right">{t("action")}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableSkeleton rows={5} cols={6} />
                                        ) : groupedData.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                                    {t("no_data_found")}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            groupedData.map(([type, entries]) => (
                                                entries.map((entry, index) => (
                                                    <TableRow key={entry.id} className="text-[13px] border-b last:border-0 border-gray-50 hover:bg-gray-50/30 group transition-colors">
                                                        {index === 0 ? (
                                                            <TableCell
                                                                rowSpan={entries.length}
                                                                className="font-bold text-gray-400 align-top border-r border-gray-50 pt-5 text-[10px] uppercase tracking-tighter w-[150px]"
                                                            >
                                                                {type}
                                                            </TableCell>
                                                        ) : null}
                                                        <TableCell className="py-4 px-6 font-bold text-indigo-600 tracking-tight">{entry.name}</TableCell>
                                                        <TableCell className="py-4 px-6">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full font-bold text-[10px] border border-emerald-100">
                                                                    {entry.percent_from}%
                                                                </span>
                                                                <span className="text-gray-300">→</span>
                                                                <span className="bg-rose-50 text-rose-600 px-2.5 py-0.5 rounded-full font-bold text-[10px] border border-rose-100">
                                                                    {entry.percent_upto}%
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4 px-6 font-bold text-gray-700">
                                                            <div className="flex items-center gap-1.5">
                                                                <Award className="h-3.5 w-3.5 text-amber-400" />
                                                                {entry.grade_point}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4 px-6 text-gray-400 italic text-[11px] max-w-[200px] truncate">
                                                            {entry.description || t("no_description")}
                                                        </TableCell>
                                                        <TableCell className="py-4 px-6 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Button size="icon" variant="ghost" onClick={() => handleEdit(entry)} className="h-8 w-8 bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-md transition-all">
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                                <Button size="icon" variant="ghost" onClick={() => setDeleteId(entry.id)} className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {totalEntries > 0 && (
                                <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold pt-4 uppercase tracking-tight">
                                    <div>
                                        {t("showing_x_to_y_of_z", {
                                            from: ((currentPage - 1) * itemsPerPage) + 1,
                                            to: Math.min(currentPage * itemsPerPage, totalEntries),
                                            total: totalEntries
                                        })}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            size="sm" className="h-8 w-8 p-0 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0 rounded-[10px] shadow-md disabled:opacity-50"
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" className="h-8 w-8 p-0 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0 rounded-[10px] shadow-md">
                                            {currentPage}
                                        </Button>
                                        <Button
                                            onClick={() => setCurrentPage(p => p + 1)}
                                            size="sm" className="h-8 w-8 p-0 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0 rounded-[10px] shadow-md disabled:opacity-50"
                                            disabled={currentPage >= totalPages}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-lg border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">{t("delete_grade")}</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            {t("delete_grade_confirmation")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-11 rounded-full text-[10px] font-bold uppercase tracking-wider border-gray-200">{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-red-500 hover:bg-red-600 h-11 rounded-full text-[10px] font-bold uppercase tracking-wider border-0 shadow-md">
                            {t("yes_delete_grade")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
