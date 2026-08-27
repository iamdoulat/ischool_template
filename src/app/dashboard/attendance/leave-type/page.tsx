"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
    FileBox,
    FileText,
    Printer,
    ChevronLeft,
    ChevronRight,
    CalendarDays,
    Search,
    Loader2,
    Plus,
    Save,
    Tag,
    AlertCircle,
    CheckCircle2,
    Layers
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import { Skeleton } from "@/components/ui/skeleton";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface LeaveType {
    id: number;
    name: string;
}

function TableSkeleton({ cols }: { cols: number }) {
    return (
        <>
            {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-3.5 px-4">
                            <Skeleton className="h-4 rounded" style={{ width: `${55 + ((i * 3 + j * 7) % 35)}%` }} />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export default function LeaveTypePage() {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState("");
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [name, setName] = useState("");

    // Delete confirmation
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState("10");

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get("hr/leave-type");
            const data = response.data?.data || response.data || [];
            setLeaveTypes(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching leave types:", error);
            toast.error(t("failed_to_load_leave_types") || "Failed to load leave types");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!name.trim()) {
            toast.error(t("name_is_required") || "Leave type name is required");
            return;
        }

        setSaving(true);
        try {
            if (isEditing && currentId) {
                await api.put(`hr/leave-type/${currentId}`, { name: name.trim() });
                toast.success(t("leave_type_updated_successfully") || "Leave category updated successfully");
            } else {
                await api.post("hr/leave-type", { name: name.trim() });
                toast.success(t("leave_type_created_successfully") || "New leave category registered successfully");
            }
            resetForm();
            fetchData();
        } catch (error) {
            console.error("Error saving leave type:", error);
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || t("failed_to_save_leave_type") || "Failed to save category");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (lt: LeaveType) => {
        setIsEditing(true);
        setCurrentId(lt.id);
        setName(lt.name);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        setDeleting(true);
        try {
            await api.delete(`hr/leave-type/${itemToDelete}`);
            toast.success(t("leave_type_deleted_successfully") || "Leave type removed successfully");
            fetchData();
        } catch (error) {
            console.error("Error deleting leave type:", error);
            toast.error(t("failed_to_delete_leave_type") || "Failed to delete leave type");
        } finally {
            setDeleting(false);
            setDeleteDialogOpen(false);
            setItemToDelete(null);
        }
    };

    const resetForm = () => {
        setName("");
        setIsEditing(false);
        setCurrentId(null);
    };

    const filteredLeaveTypes = useMemo(() => {
        if (!searchTerm) return leaveTypes;
        const lower = searchTerm.toLowerCase();
        return leaveTypes.filter(lt => lt.name.toLowerCase().includes(lower));
    }, [leaveTypes, searchTerm]);

    const sizeNum = parseInt(itemsPerPage, 10) || 10;
    const totalEntries = filteredLeaveTypes.length;
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * sizeNum;
    const paginatedData = filteredLeaveTypes.slice(startIndex, startIndex + sizeNum);

    // Export Functions
    const exportToExcel = (isCsv = false) => {
        if (filteredLeaveTypes.length === 0) { toast.error("No data to export"); return; }
        const mapped = filteredLeaveTypes.map((lt, idx) => ({
            "SL": idx + 1,
            "Leave Type Name": lt.name
        }));
        const ws = XLSX.utils.json_to_sheet(mapped);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Leave Types");
        if (isCsv) {
            XLSX.writeFile(wb, "leave_types.csv", { bookType: "csv" });
            toast.success("CSV downloaded");
        } else {
            XLSX.writeFile(wb, "leave_types.xlsx");
            toast.success("Excel spreadsheet downloaded");
        }
    };

    const exportToPDF = () => {
        if (filteredLeaveTypes.length === 0) { toast.error("No data to export"); return; }
        const doc = new jsPDF();
        doc.text("Leave Types Registry", 14, 15);
        autoTable(doc, {
            head: [["SL", "Leave Category Name"]],
            body: filteredLeaveTypes.map((lt, idx) => [idx + 1, lt.name]),
            startY: 20,
        });
        doc.save("leave_types.pdf");
        toast.success("PDF document downloaded");
    };

    const copyToClipboard = () => {
        if (filteredLeaveTypes.length === 0) { toast.error("No data to copy"); return; }
        const text = "SL\tLeave Type Name\n" + filteredLeaveTypes.map((lt, idx) => `${idx + 1}\t${lt.name}`).join('\n');
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 py-4 sm:py-6 font-sans">
            {/* Master Header Banner */}
            <div className="rounded-2xl border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] via-[#F8F9FE] to-[#EFF0FD]">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-md">
                            <CalendarDays className="h-6 w-6" />
                        </span>
                        <div>
                            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-800 leading-none flex items-center gap-2">
                                Leave Categories & Absence Classifications
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                                    {leaveTypes.length} Configured
                                </span>
                            </h1>
                            <p className="text-[11px] text-gray-500 mt-1">
                                Define and maintain institutional leave types for student applications and staff absence tracking.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Layout: Left Form (1/3) + Right Table (2/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left Form Card */}
                <div className="lg:col-span-1">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm rounded-2xl overflow-hidden pt-0 sticky top-6">
                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-3.5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-slate-100">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                                {isEditing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            </span>
                            <div>
                                <CardTitle className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
                                    {isEditing ? (t("edit_leave_type") || "Edit Leave Type") : (t("add_leave_type") || "Add Leave Type")}
                                </CardTitle>
                                <p className="text-[10px] text-slate-500">
                                    {isEditing ? "Update existing category" : "Create new absence classification"}
                                </p>
                            </div>
                        </CardHeader>

                        <CardContent className="p-5">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-700">
                                        {t("name") || "Leave Type Name"} <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="h-9 text-xs bg-white border-slate-200 focus:ring-indigo-500 rounded-lg"
                                        placeholder={t("e_g_sick_leave") || "e.g. Medical Leave, Casual Leave, Emergency"}
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2">
                                    {isEditing && (
                                        <Button
                                            type="button"
                                            onClick={resetForm}
                                            variant="outline"
                                            className="h-9 px-4 text-xs font-semibold rounded-lg border-slate-200"
                                        >
                                            {t("cancel") || "Cancel"}
                                        </Button>
                                    )}
                                    <Button
                                        type="submit"
                                        disabled={saving || !name.trim()}
                                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white h-9 px-6 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border-0"
                                    >
                                        {saving ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : isEditing ? (
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                        ) : (
                                            <Plus className="h-3.5 w-3.5" />
                                        )}
                                        {isEditing ? (t("update") || "Update Category") : (t("save") || "Save Category")}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Table Card */}
                <div className="lg:col-span-2">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm rounded-2xl overflow-hidden pt-0">
                        {/* Table Header / Toolbar */}
                        <CardHeader className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                                    <Layers className="h-4 w-4" />
                                </span>
                                <CardTitle className="text-sm font-bold text-slate-800">
                                    {t("leave_type_list") || "Leave Type Directory"} ({filteredLeaveTypes.length})
                                </CardTitle>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Search Input */}
                                <div className="relative w-full sm:w-48">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                    <Input
                                        placeholder={t("search") || "Search categories..."}
                                        value={searchTerm}
                                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                        className="pl-8 h-8 text-xs bg-white border-slate-200 focus-visible:ring-indigo-500 rounded-lg shadow-none"
                                    />
                                </div>

                                {/* Per Page */}
                                <Select
                                    value={itemsPerPage}
                                    onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
                                >
                                    <SelectTrigger className="h-8 w-16 text-xs bg-white border-slate-200">
                                        <SelectValue placeholder="10" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* Multi-format export toolbar */}
                                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
                                    <button
                                        type="button"
                                        onClick={copyToClipboard}
                                        className="p-1.5 hover:bg-slate-100 text-slate-600 border-r border-slate-200 transition-all"
                                        title="Copy Table"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => exportToExcel(false)}
                                        className="p-1.5 hover:bg-slate-100 text-slate-600 border-r border-slate-200 transition-all"
                                        title="Export Excel"
                                    >
                                        <FileSpreadsheet className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => exportToExcel(true)}
                                        className="p-1.5 hover:bg-slate-100 text-slate-600 border-r border-slate-200 transition-all"
                                        title="Export CSV"
                                    >
                                        <FileBox className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={exportToPDF}
                                        className="p-1.5 hover:bg-slate-100 text-slate-600 border-r border-slate-200 transition-all"
                                        title="Export PDF"
                                    >
                                        <FileText className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => window.print()}
                                        className="p-1.5 hover:bg-slate-100 text-slate-600 transition-all"
                                        title="Print List"
                                    >
                                        <Printer className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        </CardHeader>

                        {/* Table Content */}
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                                        <TableRow>
                                            <TableHead className="py-3 px-4 text-xs font-bold text-slate-700 w-16 text-center">#</TableHead>
                                            <TableHead className="py-3 px-4 text-xs font-bold text-slate-700">{t("leave_type") || "Leave Classification Name"}</TableHead>
                                            <TableHead className="py-3 px-4 text-xs font-bold text-slate-700 text-right pr-6 w-28">{t("action") || "Action"}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="divide-y divide-slate-100">
                                        {loading ? (
                                            <TableSkeleton cols={3} />
                                        ) : paginatedData.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-16 text-slate-400">
                                                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                                    <p className="text-xs font-bold text-slate-600">No leave categories registered</p>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">Use the left form to add your first classification.</p>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            paginatedData.map((lt, idx) => (
                                                <TableRow
                                                    key={lt.id || idx}
                                                    className="hover:bg-indigo-50/20 transition-colors group"
                                                >
                                                    <TableCell className="py-3.5 px-4 text-center font-mono text-xs text-slate-400">
                                                        {startIndex + idx + 1}
                                                    </TableCell>
                                                    <TableCell className="py-3.5 px-4">
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
                                                                <Tag className="h-3.5 w-3.5" />
                                                            </span>
                                                            <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                                                {lt.name}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-3.5 px-4 text-right pr-6">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleEdit(lt)}
                                                                className="h-7 w-7 p-0 border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 rounded-lg"
                                                                title="Edit Category"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setItemToDelete(lt.id);
                                                                    setDeleteDialogOpen(true);
                                                                }}
                                                                className="h-7 w-7 p-0 border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 rounded-lg"
                                                                title="Delete Category"
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
                        </CardContent>

                        {/* Footer / Pagination */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
                            <div>
                                Showing {totalEntries > 0 ? startIndex + 1 : 0} to{" "}
                                {Math.min(startIndex + sizeNum, totalEntries)} of {totalEntries} entries
                            </div>

                            {totalEntries > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <button
                                        disabled={safePage === 1}
                                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                        className="h-8 w-8 bg-white hover:bg-slate-100 text-slate-600 rounded-lg transition-all border border-slate-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={cn(
                                                "h-8 w-8 transition-all text-xs flex items-center justify-center cursor-pointer font-bold rounded-lg",
                                                safePage === page
                                                    ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs"
                                                    : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                                            )}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                    <button
                                        disabled={safePage === totalPages}
                                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                        className="h-8 w-8 bg-white hover:bg-slate-100 text-slate-600 rounded-lg transition-all border border-slate-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="max-w-md rounded-2xl bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-rose-600" />
                            Delete Leave Category?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-slate-500">
                            This action will permanently delete this leave type. Existing leave records referencing it might be affected.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel className="text-xs font-semibold rounded-lg">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={deleting}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm"
                        >
                            {deleting ? "Deleting..." : "Yes, Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
