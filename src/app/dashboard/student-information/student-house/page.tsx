"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    Search,
    Printer,
    FileText,
    FileSpreadsheet,
    Copy,
    Pencil,
    Loader2,
    Trash2,
    Home,
    Bookmark,
    CheckCircle2,
    Shield,
    Palette
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { cn, translateStudentHouse, toLocaleNumber } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

const HOUSE_COLOR_PALETTES = [
    { key: "house_preset_padma", defaultName: "Padma House", color: "from-rose-500 to-red-600", border: "border-rose-200", bg: "bg-rose-50 text-rose-700" },
    { key: "house_preset_meghna", defaultName: "Meghna House", color: "from-sky-500 to-blue-600", border: "border-sky-200", bg: "bg-sky-50 text-sky-700" },
    { key: "house_preset_jamuna", defaultName: "Jamuna House", color: "from-emerald-500 to-teal-600", border: "border-emerald-200", bg: "bg-emerald-50 text-emerald-700" },
    { key: "house_preset_surma", defaultName: "Surma House", color: "from-amber-500 to-orange-600", border: "border-amber-200", bg: "bg-amber-50 text-amber-700" },
    { key: "house_preset_red", defaultName: "Red House", color: "from-red-500 to-rose-600", border: "border-red-200", bg: "bg-red-50 text-red-700" },
    { key: "house_preset_blue", defaultName: "Blue House", color: "from-blue-500 to-indigo-600", border: "border-blue-200", bg: "bg-blue-50 text-blue-700" },
    { key: "house_preset_green", defaultName: "Green House", color: "from-green-500 to-emerald-600", border: "border-green-200", bg: "bg-green-50 text-green-700" },
    { key: "house_preset_yellow", defaultName: "Yellow House", color: "from-amber-400 to-yellow-500", border: "border-amber-200", bg: "bg-amber-50 text-amber-700" },
];

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3.5">
                            <div
                                className="h-4 rounded-md bg-muted/60 animate-pulse"
                                style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }}
                            />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

interface StudentHouse {
    id: number;
    name: string;
    description: string | null;
}

export default function StudentHousePage() {
    const [houses, setHouses] = useState<StudentHouse[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [formData, setFormData] = useState({ name: "", description: "" });
    const [editingHouse, setEditingHouse] = useState<StudentHouse | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    // Single delete dialog
    const [idToDelete, setIdToDelete] = useState<number | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Bulk delete dialog
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

    const tt = useTranslateToast();
    const { t, language } = useTranslation();
    const ttRef = useRef(tt);
    useEffect(() => { ttRef.current = tt; }, [tt]);

    const fetchHouses = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/student-houses");
            const data = response.data?.data || response.data || [];
            setHouses(Array.isArray(data) ? data : []);
            setSelectedIds(new Set());
        } catch (error) {
            console.error("Error fetching houses:", error);
            ttRef.current.error("failed_to_fetch_student_houses");
            setHouses([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHouses();
    }, [fetchHouses]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            tt.error("house_name_is_required");
            return;
        }

        setSaving(true);
        try {
            if (editingHouse) {
                await api.put(`/student-houses/${editingHouse.id}`, formData);
                tt.success("student_house_updated_successfully");
            } else {
                await api.post("/student-houses", formData);
                tt.success("student_house_added_successfully");
            }
            setFormData({ name: "", description: "" });
            setEditingHouse(null);
            await fetchHouses();
        } catch (error: unknown) {
            console.error("Error saving house:", error);
            const err = error as { response?: { status?: number; data?: { errors?: Record<string, string[]>; message?: string } }; message?: string };
            if (err.response?.status === 422) {
                const validationErrors = err.response?.data?.errors;
                if (validationErrors) {
                    const firstError = Object.values(validationErrors)[0];
                    tt.error(Array.isArray(firstError) ? firstError[0] : firstError);
                } else {
                    tt.error(err.response?.data?.message || "Validation failed");
                }
            } else {
                const message = err.response?.data?.message || err.message || "Failed to save house.";
                tt.error(message);
            }
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (id: number) => {
        setIdToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!idToDelete) return;
        setDeleting(true);
        try {
            await api.delete(`/student-houses/${idToDelete}`);
            tt.success("student_house_deleted_successfully");
            fetchHouses();
        } catch {
            tt.error("failed_to_delete_house");
        } finally {
            setDeleting(false);
            setIsDeleteDialogOpen(false);
            setIdToDelete(null);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;

        setDeleting(true);
        try {
            await api.post("/student-houses/bulk-delete", { ids: Array.from(selectedIds) });
            tt.success("selected_houses_deleted_successfully");
            fetchHouses();
        } catch {
            tt.error("failed_to_delete_selected_houses");
        } finally {
            setDeleting(false);
            setIsBulkDeleteDialogOpen(false);
        }
    };

    const handleEdit = (item: StudentHouse) => {
        setEditingHouse(item);
        setFormData({ name: item.name, description: item.description || "" });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(filteredHouses.map(h => h.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: number) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const filteredHouses = houses.filter(h => {
        const transName = translateStudentHouse(h.name, language?.short_code);
        return (
            h.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (h.description && h.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            h.id.toString().includes(searchTerm)
        );
    });

    // Export functions
    const exportToCopy = () => {
        if (houses.length === 0) return;
        const text = [
            "#\t" + t("house_name") + "\t" + t("description") + "\t" + t("house_id"),
            ...filteredHouses.map((h, idx) => `${toLocaleNumber(idx + 1, language?.short_code)}\t${translateStudentHouse(h.name, language?.short_code)}\t${h.description || ""}\t#${toLocaleNumber(h.id, language?.short_code)}`)
        ].join("\n");
        navigator.clipboard.writeText(text);
        tt.success("copied_to_clipboard");
    };

    const exportToExcel = () => {
        if (houses.length === 0) return;
        const worksheet = XLSX.utils.json_to_sheet(
            filteredHouses.map((h, idx) => ({
                "#": toLocaleNumber(idx + 1, language?.short_code),
                [t("house_name")]: translateStudentHouse(h.name, language?.short_code),
                [t("description")]: h.description || "-",
                [t("house_id")]: `#${toLocaleNumber(h.id, language?.short_code)}`
            }))
        );
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, t("houses"));
        XLSX.writeFile(workbook, "student_houses.xlsx");
        tt.success("excel_file_downloaded");
    };

    const exportToPDF = () => {
        if (houses.length === 0) return;
        const doc = new jsPDF();
        doc.text(t("student_house_list"), 14, 15);
        autoTable(doc, {
            head: [["#", t("house_name"), t("description"), t("house_id")]],
            body: filteredHouses.map((h, idx) => [
                toLocaleNumber(idx + 1, language?.short_code),
                translateStudentHouse(h.name, language?.short_code),
                h.description || "-",
                `#${toLocaleNumber(h.id, language?.short_code)}`
            ]),
            startY: 20
        });
        doc.save("student_houses.pdf");
        tt.success("pdf_file_downloaded");
    };

    return (
        <div className="p-3 sm:p-5 pt-1 sm:pt-2 space-y-4 max-w-[1600px] mx-auto animate-in fade-in duration-300 pb-20">
            {/* Top Page Header Banner with Signature Gradient */}
            <div className="bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden px-5 py-4">
                <div className="flex flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Home className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-800 leading-none">
                                {t("student_houses")}
                            </h1>
                            <p className="text-xs text-slate-600 mt-1 font-medium">
                                {t("manage_student_houses_and_teams")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stat Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* Total Student Houses */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#4F46E5] via-[#6366F1] to-[#818CF8] text-white shadow-md flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-white/95 uppercase tracking-wide">
                            {t("total_houses")}
                        </span>
                        <span className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-xs">
                            <Home className="h-4 w-4 sm:h-5 sm:w-5" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
                            {toLocaleNumber(houses.length, language?.short_code)}
                        </div>
                        <p className="text-xs text-white/80 font-semibold mt-1.5">
                            {t("count_houses_total", { count: toLocaleNumber(houses.length, language?.short_code) })}
                        </p>
                    </div>
                </div>

                {/* Active Houses */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#059669] via-[#10B981] to-[#34D399] text-white shadow-md flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-white/95 uppercase tracking-wide flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                            {t("active_houses")}
                        </span>
                        <span className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-xs">
                            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
                            {toLocaleNumber(houses.length, language?.short_code)}
                        </div>
                        <p className="text-xs text-white/85 font-semibold mt-1.5">
                            {t("active")}
                        </p>
                    </div>
                </div>

                {/* House System System */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#D97706] via-[#F59E0B] to-[#FBBF24] text-white shadow-md flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-white/95 uppercase tracking-wide">
                            {t("house_system")}
                        </span>
                        <span className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-xs">
                            <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
                            {houses.length > 0 ? t("enabled") : t("disabled")}
                        </div>
                        <p className="text-xs text-white/85 font-semibold mt-1.5">
                            {t("house_allocation_ready")}
                        </p>
                    </div>
                </div>
            </div>

            {/* 2-Column Responsive Layout: Left Form (1/3) + Right List (2/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left Column: Create / Edit House Form */}
                <form onSubmit={handleSave} className="lg:col-span-4">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card overflow-hidden pt-0 sticky top-4">
                        <CardHeader className="flex flex-row items-center gap-3 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-200/70">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Home className="h-4 w-4" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                    {editingHouse ? t("edit_student_house") : t("add_student_house")}
                                </CardTitle>
                                <p className="text-xs text-slate-500 font-medium mt-1">
                                    {editingHouse ? t("update_house_details") : t("create_new_student_house")}
                                </p>
                            </div>
                        </CardHeader>

                        <CardContent className="p-5 space-y-4">
                            {/* House Name Input */}
                            <div className="space-y-1.5 group">
                                <Label htmlFor="house_name" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                    {t("house_name")} <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="house_name"
                                    className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium focus:ring-2 focus:ring-primary/20"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder={t("enter_house_name")}
                                    required
                                />
                            </div>

                            {/* Quick House Presets */}
                            <div className="space-y-2 pt-2 border-t border-border/70">
                                <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                                    <Palette className="h-3.5 w-3.5 text-indigo-500" />
                                    {t("quick_house_presets")}
                                </Label>
                                <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                                    {HOUSE_COLOR_PALETTES.map((preset) => {
                                        const label = t(preset.key) || preset.defaultName;
                                        const isSelected = formData.name.trim() === label || formData.name.trim() === preset.defaultName;
                                        return (
                                            <button
                                                key={preset.key}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, name: label })}
                                                className={cn(
                                                    "px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-left",
                                                    isSelected
                                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                                        : "bg-muted/40 hover:bg-indigo-50 text-foreground hover:text-indigo-600 border-border/80"
                                                )}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Description Textarea */}
                            <div className="space-y-1.5 group">
                                <Label htmlFor="description" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                    {t("description")}
                                </Label>
                                <Textarea
                                    id="description"
                                    className="min-h-[100px] rounded-xl bg-background border-border/80 text-xs font-medium focus:ring-2 focus:ring-primary/20 resize-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder={t("enter_description")}
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
                                {editingHouse && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-9 px-4 rounded-xl text-xs font-bold cursor-pointer"
                                        onClick={() => { setEditingHouse(null); setFormData({ name: "", description: "" }); }}
                                    >
                                        {t("cancel")}
                                    </Button>
                                )}
                                <Button
                                    type="submit"
                                    disabled={saving || loading}
                                    className="h-9 px-6 rounded-xl font-bold text-xs bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none"
                                >
                                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                                    <span>{editingHouse ? t("update") : t("save")}</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>

                {/* Right Column: Student House List Table */}
                <div className="lg:col-span-8">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card overflow-hidden pt-0">
                        <CardHeader className="flex flex-row items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-200/70">
                            <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                    <Home className="h-4 w-4" />
                                </span>
                                <div>
                                    <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                        {t("student_house_list")}
                                    </CardTitle>
                                    <p className="text-xs text-slate-500 font-medium mt-1">
                                        {t("count_houses_total", { count: toLocaleNumber(houses.length, language?.short_code) })}
                                    </p>
                                </div>
                            </div>

                            {/* Export Toolbar */}
                            <div className="flex items-center gap-1">
                                {selectedIds.size > 0 && (
                                    <Button
                                        onClick={() => setIsBulkDeleteDialogOpen(true)}
                                        size="sm"
                                        className="h-8 px-2.5 text-xs text-white bg-rose-600 hover:bg-rose-700 rounded-lg flex items-center gap-1 font-bold mr-1 cursor-pointer border-none"
                                        title={t("delete_selected")}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        <span>{t("delete")} ({toLocaleNumber(selectedIds.size, language?.short_code)})</span>
                                    </Button>
                                )}
                                <Button onClick={exportToCopy} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title="Copy">
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button onClick={exportToExcel} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title="Export Excel">
                                    <FileSpreadsheet className="h-4 w-4" />
                                </Button>
                                <Button onClick={exportToPDF} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title="Export PDF">
                                    <FileText className="h-4 w-4" />
                                </Button>
                                <Button onClick={() => window.print()} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title="Print">
                                    <Printer className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            {/* Search Bar & Summary Tag */}
                            <div className="p-4 sm:p-5 border-b border-border/70 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                                <div className="relative w-full sm:w-72">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input
                                        placeholder={t("search_houses")}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8.5 h-9 text-xs rounded-xl bg-background border-border/80"
                                    />
                                </div>

                                {houses.length > 0 && (
                                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 text-xs font-bold py-1 px-3 self-start sm:self-auto">
                                        <Bookmark className="h-3 w-3 mr-1" />
                                        {t("total_houses")} ({toLocaleNumber(houses.length, language?.short_code)})
                                    </Badge>
                                )}
                            </div>

                            {/* Houses Table */}
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/40 border-b border-border/70 hover:bg-muted/40 text-xs font-bold">
                                            <TableHead className="w-12 pl-5">
                                                <Checkbox
                                                    checked={filteredHouses.length > 0 && selectedIds.size === filteredHouses.length}
                                                    onCheckedChange={handleSelectAll}
                                                    className="h-4 w-4 rounded-sm data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                />
                                            </TableHead>
                                            <TableHead className="py-3 px-3 w-14">#</TableHead>
                                            <TableHead className="py-3 px-4 min-w-[180px]">{t("house_name")}</TableHead>
                                            <TableHead className="py-3 px-4 min-w-[220px]">{t("description")}</TableHead>
                                            <TableHead className="py-3 px-4 min-w-[130px]">{t("house_id")}</TableHead>
                                            <TableHead className="py-3 px-4 text-right pr-6 w-[110px]">{t("action")}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="divide-y divide-border/50 text-xs">
                                        {loading ? (
                                            <TableSkeleton rows={4} cols={6} />
                                        ) : filteredHouses.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="px-4 py-16 text-center text-xs font-bold text-muted-foreground">
                                                    {t("no_data_found")}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredHouses.map((house, idx) => {
                                                const isSelected = selectedIds.has(house.id);
                                                const preset = HOUSE_COLOR_PALETTES[idx % HOUSE_COLOR_PALETTES.length];
                                                const translatedName = translateStudentHouse(house.name, language?.short_code);

                                                return (
                                                    <TableRow
                                                        key={house.id}
                                                        className={cn(
                                                            "hover:bg-muted/20 transition-colors",
                                                            isSelected && "bg-indigo-50/40 dark:bg-indigo-950/20"
                                                        )}
                                                    >
                                                        <TableCell className="pl-5 py-3.5">
                                                            <Checkbox
                                                                checked={isSelected}
                                                                onCheckedChange={() => handleSelectOne(house.id)}
                                                                className="h-4 w-4 rounded-sm data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                            />
                                                        </TableCell>

                                                        {/* Serial Number */}
                                                        <TableCell className="py-3.5 px-3 font-bold text-muted-foreground text-xs">
                                                            {toLocaleNumber(idx + 1, language?.short_code)}
                                                        </TableCell>

                                                        {/* House Name & Icon */}
                                                        <TableCell className="py-3.5 px-4">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className={cn(
                                                                    "h-8 w-8 rounded-xl text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs bg-gradient-to-br",
                                                                    preset.color
                                                                )}>
                                                                    {house.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <span className="font-bold text-foreground text-sm">
                                                                    {translatedName}
                                                                </span>
                                                            </div>
                                                        </TableCell>

                                                        {/* Description */}
                                                        <TableCell className="py-3.5 px-4 text-muted-foreground font-medium">
                                                            {house.description || "—"}
                                                        </TableCell>

                                                        {/* House ID Tag */}
                                                        <TableCell className="py-3.5 px-4">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-muted/60 font-mono text-xs font-bold text-foreground border border-border/80">
                                                                #{toLocaleNumber(house.id, language?.short_code)}
                                                            </span>
                                                        </TableCell>

                                                        {/* Action Buttons with Gradient Styling */}
                                                        <TableCell className="py-3.5 px-4 text-right pr-6">
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <Button
                                                                    onClick={() => handleEdit(house)}
                                                                    size="icon"
                                                                    className="h-7 w-7 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-white shadow-xs shadow-amber-500/20 active:scale-95 transition-all cursor-pointer border-none"
                                                                    title={t("edit")}
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    onClick={() => confirmDelete(house.id)}
                                                                    size="icon"
                                                                    className="h-7 w-7 rounded-lg bg-gradient-to-r from-rose-500 to-red-600 hover:opacity-95 text-white shadow-xs shadow-rose-500/20 active:scale-95 transition-all cursor-pointer border-none"
                                                                    title={t("delete")}
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

                            {/* Table Footer */}
                            {filteredHouses.length > 0 && (
                                <div className="p-4 sm:p-5 border-t border-border/70 bg-muted/10 flex items-center justify-between text-xs text-muted-foreground font-semibold">
                                    <div>
                                        {t("showing_x_to_y_of_z", {
                                            from: toLocaleNumber(1, language?.short_code),
                                            to: toLocaleNumber(filteredHouses.length, language?.short_code),
                                            total: toLocaleNumber(filteredHouses.length, language?.short_code)
                                        })}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Single Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl border border-border shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-bold text-foreground">{t("are_you_sure")}</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed mt-2">
                            {t("permanently_delete_house", { name: translateStudentHouse(houses.find(h => h.id === idToDelete)?.name || "", language?.short_code) })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel disabled={deleting} className="h-9 rounded-xl text-xs font-bold">{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white h-9 rounded-xl text-xs font-bold border-none"
                            disabled={deleting}
                        >
                            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Delete Confirmation Dialog */}
            <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl border border-border shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-bold text-foreground">{t("are_you_absolutely_sure")}</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed mt-2">
                            {t("permanently_delete_selected_houses", { count: toLocaleNumber(selectedIds.size, language?.short_code) })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel disabled={deleting} className="h-9 rounded-xl text-xs font-bold">{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleBulkDelete();
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white h-9 rounded-xl text-xs font-bold border-none"
                            disabled={deleting}
                        >
                            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                            {t("delete_all")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
