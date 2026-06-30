"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    Search,
    Printer,
    FileText,
    Table as TableIcon,
    Download,
    Columns,
    ChevronDown,
    Pencil,
    X,
    Loader2,
    Trash2,
    Home
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

interface StudentHouse {
    id: number;
    name: string;
    description: string | null;
}

export default function StudentHousePage() {
    const [houses, setHouses] = useState<StudentHouse[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [formData, setFormData] = useState({ name: "", description: "" });
    const [editingHouse, setEditingHouse] = useState<StudentHouse | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const tt = useTranslateToast();
    const { t } = useTranslation();
    const ttRef = useRef(tt);
    useEffect(() => { ttRef.current = tt; }, [tt]);

    const fetchHouses = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/student-houses");
            setHouses(response.data.data || []);
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

    const handleSave = async () => {
        if (!formData.name.trim()) {
            tt.error("house_name_is_required");
            return;
        }

        setSaving(true);
        const timeoutId = setTimeout(() => {
            setSaving(false);
            tt.error("Request timed out. Please try again.");
        }, 25000);

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
        } catch (error: any) {
            console.error("Error saving house:", error);
            if (error.code === 'ECONNABORTED') {
                tt.error("Request timed out. Please check your connection and try again.");
            } else if (error.response?.status === 422) {
                // Validation error - show the specific message
                const validationErrors = error.response?.data?.errors;
                if (validationErrors) {
                    const firstError = Object.values(validationErrors)[0];
                    tt.error(Array.isArray(firstError) ? firstError[0] : firstError);
                } else {
                    tt.error(error.response?.data?.message || "Validation failed");
                }
            } else {
                const message = error.response?.data?.message || error.message || "Failed to save house.";
                tt.error(message);
            }
        } finally {
            clearTimeout(timeoutId);
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        setSaving(true);
        try {
            await api.delete(`/student-houses/${id}`);
            tt.success("student_house_deleted_successfully");
            setSelectedIds(new Set());
            fetchHouses();
        } catch (error) {
            tt.error("failed_to_delete_house");
        } finally {
            setSaving(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;

        setSaving(true);
        try {
            await api.post("/student-houses/bulk-delete", { ids: Array.from(selectedIds) });
            tt.success("selected_houses_deleted_successfully");
            setSelectedIds(new Set());
            fetchHouses();
        } catch (error) {
            tt.error("failed_to_delete_selected_houses");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (item: StudentHouse) => {
        setEditingHouse(item);
        setFormData({ name: item.name, description: item.description || "" });
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

    const filteredHouses = houses.filter(h =>
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.description && h.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        h.id.toString().includes(searchTerm)
    );

    // Export functions
    const exportToCopy = () => {
        if (houses.length === 0) return;
        const text = [t("name") + "\t" + t("description") + "\t" + t("house_id"), ...houses.map(h => `${h.name}\t${h.description || ""}\t${h.id}`)].join("\n");
        navigator.clipboard.writeText(text);
        tt.success("copied_to_clipboard");
    };

    const exportToExcel = () => {
        if (houses.length === 0) return;
        const worksheet = XLSX.utils.json_to_sheet(houses.map(h => ({ [t("name")]: h.name, [t("description")]: h.description, [t("house_id")]: h.id })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, t("houses"));
        XLSX.writeFile(workbook, "student_houses.xlsx");
        tt.success("excel_file_downloaded");
    };

    const exportToPDF = () => {
        if (houses.length === 0) return;
        const doc = new jsPDF();
        autoTable(doc, {
            head: [[t("name"), t("description"), t("house_id")]],
            body: houses.map(h => [h.name, h.description || "-", h.id]),
        });
        doc.save("student_houses.pdf");
        tt.success("pdf_file_downloaded");
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* Left Column: Add Student House Form */}
                <div className="md:col-span-4">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 sticky top-6">
                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Home className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                    {editingHouse ? t("edit_student_house") : t("add_student_house")}
                                </CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">
                                    {editingHouse ? t("update_house_details") : t("create_new_student_house")}
                                </p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                    {t("name")} <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    className="h-11 rounded-lg bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all border-indigo-200"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder={t("enter_house_name")}
                                />
                            </div>

                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                    {t("description")}
                                </label>
                                <Textarea
                                    className="min-h-[120px] rounded-lg bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all border-indigo-200"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder={t("enter_description")}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                {editingHouse && (
                                    <Button variant="outline" className="h-10 px-6" onClick={() => { setEditingHouse(null); setFormData({ name: "", description: "" }); }}>
                                        {t("cancel")}
                                    </Button>
                                )}
                                <Button variant="gradient" className="h-10 px-8" onClick={handleSave} disabled={saving}>
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    {editingHouse ? t("update") : t("save")}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Student House List Table */}
                <div className="md:col-span-8">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Home className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("student_house_list")}</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{t("count_houses_total", { count: houses.length })}</p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {/* Toolbar */}
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={t("search")}
                                        className="pl-10 h-10 rounded-lg bg-muted/30 border-muted/50"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                        <IconButton icon={Printer} onClick={() => window.print()} title={t("print")} />
                                        <IconButton icon={Copy} onClick={exportToCopy} title={t("copy")} />
                                        <IconButton icon={TableIcon} onClick={exportToExcel} title={t("excel")} />
                                        <IconButton icon={FileText} onClick={exportToPDF} title={t("pdf")} />
                                        <IconButton icon={Download} onClick={exportToExcel} title={t("download")} />
                                        <IconButton icon={Columns} title={t("columns")} />
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-hidden rounded-lg border border-muted/50">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        <tr>
                                            <Th className="w-10">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-muted/50 text-primary cursor-pointer"
                                                    checked={filteredHouses.length > 0 && selectedIds.size === filteredHouses.length}
                                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                                />
                                            </Th>
                                            <Th>{t("name")}</Th>
                                            <Th>{t("description")}</Th>
                                            <Th>{t("house_id")}</Th>
                                            <Th className="text-right flex items-center justify-end gap-2">
                                                <span>{t("action")}</span>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <button
                                                            disabled={selectedIds.size === 0}
                                                            className={cn(
                                                                "p-1 rounded transition-all shadow-sm active:scale-90",
                                                                selectedIds.size > 0 ? "bg-red-500 text-white hover:bg-red-600" : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                                                            )}
                                                            title={t("delete_selected")}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>{t("are_you_absolutely_sure")}</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                {t("permanently_delete_selected_houses", { count: selectedIds.size })}
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                                                            <AlertDialogAction onClick={handleBulkDelete} className="bg-red-500 hover:bg-red-600">{t("delete_all")}</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </Th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-muted/30">
                                        {false ? (
                                            <TableSkeleton rows={5} cols={5} />
                                        ) : filteredHouses.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_data_found")}</td>
                                            </tr>
                                        ) : (
                                            filteredHouses.map((house) => (
                                                <tr key={house.id} className="hover:bg-muted/10 transition-colors group">
                                                    <Td>
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 rounded border-muted/50 text-primary cursor-pointer"
                                                            checked={selectedIds.has(house.id)}
                                                            onChange={() => handleSelectOne(house.id)}
                                                        />
                                                    </Td>
                                                    <Td className="font-semibold text-slate-700">{house.name}</Td>
                                                    <Td className="text-slate-600 font-medium truncate max-w-[200px]">{house.description || "-"}</Td>
                                                    <Td className="text-slate-600 font-medium">{house.id}</Td>
                                                    <Td className="text-right">
                                                        <div className="flex justify-end gap-1 px-2">
                                                            <button
                                                                className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded transition-all shadow-sm active:scale-90"
                                                                onClick={() => handleEdit(house)}
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </button>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <button className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded transition-all shadow-sm active:scale-90">
                                                                        <X className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>{t("are_you_sure")}</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            {t("permanently_delete_house", { name: house.name })}
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleDelete(house.id)} className="bg-red-500 hover:bg-red-600">{t("delete")}</AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                    </Td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {filteredHouses.length > 0 && (
                                <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground font-medium">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                        {t("showing_x_to_y_of_z", { from: 1, to: filteredHouses.length, total: filteredHouses.length })}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-[10px] bg-white border border-gray-200 text-gray-600 hover:bg-card active:scale-95 transition-all">
                                            <ChevronDown className="h-4 w-4 rotate-90" />
                                        </Button>
                                        <Button className="h-8 w-8 rounded-[10px] border-none p-0 text-white font-bold active:scale-95 transition-all shadow-md shadow-orange-500/10 bg-gradient-to-r from-[#FF9800] to-[#6366F1]">1</Button>
                                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-[10px] bg-white border border-gray-200 text-gray-600 hover:bg-card active:scale-95 transition-all">
                                            <ChevronDown className="h-4 w-4 -rotate-90" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Helper Components
function Th({ children, className }: { children: React.ReactNode, className?: string }) {
    return <th className={cn("px-4 py-4 border-b border-muted/50", className)}>{children}</th>;
}

function Td({ children, className, colSpan }: { children: React.ReactNode, className?: string, colSpan?: number }) {
    return <td colSpan={colSpan} className={cn("px-4 py-4 text-sm", className)}>{children}</td>;
}

function IconButton({ icon: Icon, onClick, title }: { icon: React.ElementType, onClick?: () => void, title?: string }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className="p-2 hover:bg-card hover:text-primary rounded-lg transition-all border border-muted/50 bg-muted/10 text-muted-foreground group active:scale-95"
        >
            <Icon className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
        </button>
    );
}

function Copy({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("lucide lucide-copy", className)}>
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
    );
}
