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
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    Loader2,
    BookOpen,
    FlaskConical,
    Sparkles,
    Hash,
    CheckCircle2,
    Tag
} from "lucide-react";
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
import api from "@/lib/api";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { cn, toLocaleNumber, translateSubjectName } from "@/lib/utils";

interface Subject {
    id: number;
    name: string;
    code: string;
    type: string;
}

const SUBJECT_PRESETS = [
    { name: "Bangla", key: "bangla", code: "101", type: "theory" },
    { name: "English", key: "english", code: "107", type: "theory" },
    { name: "Mathematics", key: "mathematics", code: "109", type: "theory" },
    { name: "Science", key: "science", code: "127", type: "theory" },
    { name: "Social Science", key: "social_science", code: "150", type: "theory" },
    { name: "Physics", key: "physics", code: "136", type: "practical" },
    { name: "Chemistry", key: "chemistry", code: "137", type: "practical" },
    { name: "Biology", key: "biology", code: "138", type: "practical" },
    { name: "ICT", key: "ict", code: "154", type: "practical" },
    { name: "Religion", key: "religion", code: "111", type: "theory" },
    { name: "Higher Math", key: "higher_math", code: "126", type: "practical" },
    { name: "Accounting", key: "accounting", code: "146", type: "theory" },
];

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

export default function SubjectsPage() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Form state
    const [subjectName, setSubjectName] = useState("");
    const [subjectCode, setSubjectCode] = useState("");
    const [subjectType, setSubjectType] = useState("theory");
    const [editingId, setEditingId] = useState<number | null>(null);

    // Delete dialog state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState<number | null>(null);
    const { t, language } = useTranslation();
    const shortCode = language?.short_code || "en";
    const tt = useTranslateToast();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [from, setFrom] = useState(0);
    const [to, setTo] = useState(0);

    const fetchSubjects = async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(`/academics/subjects`, {
                params: { page, search: searchTerm, limit: itemsPerPage }
            });
            const { data } = response.data;
            setSubjects(data.data || []);
            setCurrentPage(data.current_page || 1);
            setLastPage(data.last_page || 1);
            setTotal(data.total || 0);
            setFrom(data.from || 0);
            setTo(data.to || 0);
        } catch (error) {
            console.error("Error fetching subjects:", error);
            tt.error("failed_to_fetch");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchSubjects(1);
        }, 200);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, itemsPerPage]);

    const resetForm = () => {
        setSubjectName("");
        setSubjectCode("");
        setSubjectType("theory");
        setEditingId(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!subjectName.trim()) {
            tt.error("please_fill_required_fields");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name: subjectName.trim(),
                code: subjectCode.trim(),
                type: subjectType
            };

            if (editingId) {
                await api.put(`/academics/subjects/${editingId}`, payload);
            } else {
                await api.post(`/academics/subjects`, payload);
            }
            resetForm();
            fetchSubjects(currentPage);
            tt.success(editingId ? "updated_successfully" : "created_successfully");
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            tt.error(err.response?.data?.message || "failed_to_save");
            console.error("Error saving subject:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (sub: Subject) => {
        setSubjectName(sub.name);
        setSubjectCode(sub.code || "");
        setSubjectType(sub.type?.toLowerCase() === "practical" ? "practical" : "theory");
        setEditingId(sub.id);
    };

    const confirmDelete = (id: number) => {
        setIdToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!idToDelete) return;
        setLoading(true);
        try {
            const response = await api.delete(`/academics/subjects/${idToDelete}`);
            if (response.data.status === "success" || response.status === 200) {
                tt.success("deleted_successfully");
                fetchSubjects(currentPage);
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

    const handlePresetSelect = (preset: typeof SUBJECT_PRESETS[0]) => {
        const translatedName = t(preset.key);
        setSubjectName(translatedName && translatedName !== preset.key ? translatedName : preset.name);
        if (!subjectCode || editingId === null) {
            setSubjectCode(preset.code);
        }
        setSubjectType(preset.type);
    };

    // Export functions
    const exportToCopy = () => {
        const text = subjects.map((s, idx) => `${idx + 1}. ${s.name} (Code: ${s.code || '-'}) [${s.type.toUpperCase()}]`).join("\n");
        navigator.clipboard.writeText(text);
        tt.success("copied_to_clipboard");
    };

    const exportToExcel = () => {
        const data = subjects.map((s, idx) => ({
            "#": idx + 1,
            [t("subject")]: translateSubjectName(s.name, shortCode),
            [t("subject_code")]: s.code || '-',
            [t("subject_type")]: s.type.toUpperCase(),
            [t("status")]: t("active")
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Subjects");
        XLSX.writeFile(workbook, "subjects.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text(t("subject_list") || "Subject List", 14, 15);
        autoTable(doc, {
            head: [["#", t("subject"), t("subject_code"), t("subject_type"), t("status")]],
            body: subjects.map((s, idx) => [
                idx + 1,
                translateSubjectName(s.name, shortCode),
                s.code || '-',
                s.type.toUpperCase(),
                t("active")
            ]),
            startY: 20
        });
        doc.save("subjects.pdf");
    };

    const printTable = () => {
        window.print();
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 font-sans p-3 sm:p-5 bg-gray-50/10 min-h-screen">
            {/* Left Column: Add Subject Form */}
            <form onSubmit={handleSave} className="w-full lg:w-1/3">
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 sticky top-6">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <BookOpen className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                {editingId ? t("edit_subject") : t("add_subject")}
                            </CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {editingId ? t("update_existing_subject_details") : t("create_new_subject_entry")}
                            </p>
                        </div>
                    </CardHeader>

                    <CardContent className="px-5 pb-5 space-y-4">
                        {/* Subject Name */}
                        <div className="space-y-2">
                            <Label htmlFor="subjectName" className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                {t("subject_name")} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="subjectName"
                                className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none focus-visible:ring-indigo-500"
                                value={subjectName}
                                onChange={(e) => setSubjectName(e.target.value)}
                                placeholder={t("subject_name_placeholder") || "e.g. Mathematics, Physics, English..."}
                                required
                            />
                        </div>

                        {/* Quick Subject Presets */}
                        <div className="space-y-1.5 pt-1">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <Sparkles className="h-3 w-3 text-amber-500" /> {t("quick_subject_presets") || "Quick Subject Presets"}
                            </Label>
                            <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto pr-1">
                                {SUBJECT_PRESETS.map((preset) => {
                                    const presetLabel = t(preset.key) !== preset.key ? t(preset.key) : preset.name;
                                    const isSelected = subjectName === preset.name || subjectName === presetLabel;
                                    return (
                                        <button
                                            key={preset.name}
                                            type="button"
                                            onClick={() => handlePresetSelect(preset)}
                                            className={cn(
                                                "px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer",
                                                isSelected
                                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                                    : "bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 border-gray-200"
                                            )}
                                        >
                                            {presetLabel}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Subject Type Segment */}
                        <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-800">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                {t("subject_type")} <span className="text-red-500">*</span>
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSubjectType("theory")}
                                    className={cn(
                                        "h-10 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer",
                                        subjectType === "theory"
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                            : "bg-gray-50/50 hover:bg-indigo-50/50 text-gray-600 border-gray-200"
                                    )}
                                >
                                    <BookOpen className="h-4 w-4" />
                                    {t("theory") || "Theory"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSubjectType("practical")}
                                    className={cn(
                                        "h-10 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer",
                                        subjectType === "practical"
                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                            : "bg-gray-50/50 hover:bg-emerald-50/50 text-gray-600 border-gray-200"
                                    )}
                                >
                                    <FlaskConical className="h-4 w-4" />
                                    {t("practical") || "Practical"}
                                </button>
                            </div>
                        </div>

                        {/* Subject Code */}
                        <div className="space-y-2">
                            <Label htmlFor="subjectCode" className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                {t("subject_code")}
                            </Label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="subjectCode"
                                    className="pl-9 h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none focus-visible:ring-indigo-500"
                                    value={subjectCode}
                                    onChange={(e) => setSubjectCode(e.target.value)}
                                    placeholder={t("subject_code_placeholder") || "e.g. 101, 210, PHY-01..."}
                                />
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

            {/* Right Column: Subject List */}
            <div className="w-full lg:w-2/3">
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 font-sans">
                    <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <BookOpen className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("subject_list")}</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{t("total_entries_count", { count: toLocaleNumber(total, shortCode) })}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Select value={String(itemsPerPage)} onValueChange={(val) => { setItemsPerPage(Number(val)); setCurrentPage(1); }}>
                                <SelectTrigger className="h-8 w-16 text-xs border-gray-200 rounded-lg">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">{toLocaleNumber(10, shortCode)}</SelectItem>
                                    <SelectItem value="25">{toLocaleNumber(25, shortCode)}</SelectItem>
                                    <SelectItem value="50">{toLocaleNumber(50, shortCode)}</SelectItem>
                                    <SelectItem value="100">{toLocaleNumber(100, shortCode)}</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex items-center gap-1 text-gray-400">
                                <Button onClick={exportToCopy} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title={t("copy")}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button onClick={exportToExcel} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title={t("excel")}>
                                    <FileSpreadsheet className="h-4 w-4" />
                                </Button>
                                <Button onClick={exportToPDF} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title={t("pdf")}>
                                    <FileText className="h-4 w-4" />
                                </Button>
                                <Button onClick={printTable} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title={t("print")}>
                                    <Printer className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title={t("columns")}>
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
                                    placeholder={t("search_subjects") || "Search subjects..."}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 h-9 text-xs border-gray-200 bg-gray-50/30 rounded-lg focus-visible:ring-indigo-500 shadow-none"
                                />
                            </div>

                            {subjects.length > 0 && (
                                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10.5px] font-bold py-1 px-2.5">
                                    <BookOpen className="h-3 w-3 mr-1" />
                                    {t("x_academic_subjects", { count: toLocaleNumber(total, shortCode) })}
                                </Badge>
                            )}
                        </div>

                        {/* Enhanced Table */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xs">
                            <Table>
                                <TableHeader className="bg-gray-50/90 dark:bg-gray-800/80 text-[11px] uppercase font-bold text-gray-600 dark:text-gray-300">
                                    <TableRow className="hover:bg-transparent border-gray-200 dark:border-gray-700">
                                        <TableHead className="py-3 px-4 w-[60px]">#</TableHead>
                                        <TableHead className="py-3 px-4 min-w-[200px]">{t("subject")}</TableHead>
                                        <TableHead className="py-3 px-4 w-[160px]">{t("subject_code")}</TableHead>
                                        <TableHead className="py-3 px-4 w-[160px]">{t("subject_type")}</TableHead>
                                        <TableHead className="py-3 px-4 w-[120px]">{t("status")}</TableHead>
                                        <TableHead className="py-3 px-4 text-right w-[100px]">{t("action")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton rows={4} cols={6} />
                                    ) : subjects.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="px-4 py-16 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                                                {t("no_data_found")}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        subjects.map((sub, idx) => {
                                            const isPractical = sub.type?.toLowerCase() === "practical";
                                            return (
                                                <TableRow
                                                    key={sub.id}
                                                    className="text-[13px] border-b last:border-0 border-gray-100 dark:border-gray-800 hover:bg-indigo-50/25 transition-colors group"
                                                >
                                                    {/* Serial Number */}
                                                    <TableCell className="py-3.5 px-4 font-bold text-gray-400 text-xs">
                                                        {toLocaleNumber((currentPage - 1) * itemsPerPage + idx + 1, shortCode)}
                                                    </TableCell>

                                                    {/* Subject Name with Monogram Avatar */}
                                                    <TableCell className="py-3.5 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "h-8 w-8 rounded-xl text-white flex items-center justify-center font-black text-xs shadow-2xs shrink-0",
                                                                isPractical
                                                                    ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                                                                    : "bg-gradient-to-br from-[#FF9800] to-[#6366F1]"
                                                            )}>
                                                                {isPractical ? <FlaskConical className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                                                                    {translateSubjectName(sub.name, shortCode)}
                                                                </p>
                                                                <p className="text-[11px] text-gray-400 font-medium">
                                                                    {isPractical ? (t("lab_practical_module") || "Lab & Practical Module") : (t("standard_theory_curriculum") || "Standard Theory Curriculum")}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Subject Code */}
                                                    <TableCell className="py-3.5 px-4">
                                                        {sub.code ? (
                                                             <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono text-xs font-bold border border-gray-200 dark:border-gray-700">
                                                                <Tag className="h-3 w-3 text-gray-400" />
                                                                {toLocaleNumber(sub.code, shortCode)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs italic">—</span>
                                                        )}
                                                    </TableCell>

                                                    {/* Subject Type */}
                                                    <TableCell className="py-3.5 px-4">
                                                        <span
                                                            className={cn(
                                                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs border shadow-2xs",
                                                                isPractical
                                                                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                                                    : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                                                            )}
                                                        >
                                                            {isPractical ? (
                                                                <>
                                                                    <FlaskConical className="h-3.5 w-3.5 text-emerald-500" />
                                                                    {t("practical") || "Practical"}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                                                                    {t("theory") || "Theory"}
                                                                </>
                                                            )}
                                                        </span>
                                                    </TableCell>

                                                    {/* Status */}
                                                    <TableCell className="py-3.5 px-4">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                                                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                                            {t("active") || "Active"}
                                                        </span>
                                                    </TableCell>

                                                    {/* Actions */}
                                                    <TableCell className="py-3.5 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Button
                                                                onClick={() => handleEdit(sub)}
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all shadow-xs"
                                                                title={t("edit_subject") || "Edit Subject"}
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                onClick={() => confirmDelete(sub.id)}
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-7 w-7 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all shadow-xs"
                                                                title={t("delete_subject") || "Delete Subject"}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {total > 0 && (
                            <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold pt-2 uppercase tracking-tight">
                                <div>{t("showing_x_to_y_of_z", { from: toLocaleNumber(from, shortCode), to: toLocaleNumber(to, shortCode), total: toLocaleNumber(total, shortCode) })}</div>
                                <div className="flex gap-1.5">
                                    <Button
                                        size="sm"
                                        className="h-8 w-8 p-0 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0 rounded-[10px] shadow-sm disabled:opacity-40"
                                        disabled={currentPage === 1}
                                        onClick={() => fetchSubjects(currentPage - 1)}
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
                                            onClick={() => fetchSubjects(page)}
                                        >
                                            {toLocaleNumber(page, shortCode)}
                                        </Button>
                                    ))}
                                    <Button
                                        size="sm"
                                        className="h-8 w-8 p-0 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0 rounded-[10px] shadow-sm disabled:opacity-40"
                                        disabled={currentPage === lastPage || lastPage === 0}
                                        onClick={() => fetchSubjects(currentPage + 1)}
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
                            {t("delete_subject_confirm_message")}
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
