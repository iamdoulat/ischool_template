/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Plus,
    Search,
    Pencil,
    Trash2,
    Save,
    RefreshCw,
    ShieldAlert,
    ChevronLeft,
    ChevronRight,
    FolderOpen,
    TrendingUp,
    TrendingDown,
    Info,
    X,
    Sparkles,
} from "lucide-react";
import { cn, toLocaleNumber } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface Incident {
    id: string;
    title: string;
    point: number;
    description: string;
}

export default function IncidentsPage() {
    const { t, language } = useTranslation();
    const tt = useTranslateToast();
    const shortCode = language?.short_code || "en";
    const [searchTerm, setSearchTerm] = useState("");
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [totalEntries, setTotalEntries] = useState(0);

    // Form State
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        point: 0,
        description: "",
    });

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchIncidents();
    }, [currentPage, itemsPerPage, searchTerm]);

    const fetchIncidents = async () => {
        setLoading(true);
        try {
            const response = await api.get("/behaviour/incidents", {
                params: {
                    page: currentPage,
                    per_page: itemsPerPage,
                    search: searchTerm,
                },
            });
            setIncidents(response.data?.data || response.data || []);
            setTotalEntries(response.data?.total || (response.data?.data ? response.data.data.length : 0));
        } catch {
            tt.error("failed_to_fetch_incident_registry");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.title.trim()) {
            tt.error("incident_title_is_required");
            return;
        }

        setSubmitting(true);
        try {
            if (editMode && selectedId) {
                await api.put(`/behaviour/incidents/${selectedId}`, formData);
                tt.success("incident_protocol_updated");
            } else {
                await api.post("/behaviour/incidents", formData);
                tt.success("new_incident_indexed");
            }
            setOpen(false);
            resetForm();
            fetchIncidents();
        } catch {
            tt.error("failed_to_save_incident_record");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (item: Incident) => {
        setEditMode(true);
        setSelectedId(item.id);
        setFormData({
            title: item.title,
            point: item.point,
            description: item.description || "",
        });
        setOpen(true);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/behaviour/incidents/${deleteId}`);
            tt.success("incident_protocol_expunged");
            fetchIncidents();
        } catch {
            tt.error("failed_to_delete_incident");
        } finally {
            setDeleteId(null);
        }
    };

    const resetForm = () => {
        setEditMode(false);
        setSelectedId(null);
        setFormData({ title: "", point: 0, description: "" });
    };

    const totalPages = Math.ceil(totalEntries / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans">
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 gap-0 text-slate-800 dark:text-slate-100 rounded-2xl">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] dark:from-gray-800 dark:to-gray-850 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <ShieldAlert className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">
                                    {t("incidents")}
                                </CardTitle>
                                {totalEntries > 0 && (
                                    <Badge variant="outline" className="bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 border-gray-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        <Sparkles className="w-2.5 h-2.5 mr-1 text-amber-500" />
                                        {toLocaleNumber(totalEntries, shortCode)} {totalEntries === 1 ? t("incident") : t("incidents")}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                                {t("manage_behaviour_incident_types_and_their_points")}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => { resetForm(); setOpen(true); }}
                        className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md hover:shadow-lg active:scale-95 transition-all shrink-0 cursor-pointer"
                    >
                        <Plus className="h-4 w-4" />
                        <span>{t("add_incident")}</span>
                    </Button>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <Input
                                placeholder={t("search_incidents")}
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-9 pr-8 h-9 text-xs rounded-lg border-gray-200 dark:border-gray-700 bg-background focus-visible:ring-indigo-500 shadow-none"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t("show")}</span>
                            <Select
                                value={itemsPerPage.toString()}
                                onValueChange={(val) => {
                                    setItemsPerPage(parseInt(val));
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="h-9 w-[75px] text-xs border-gray-200 dark:border-gray-700 rounded-lg">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10" className="text-xs font-bold">{toLocaleNumber("10", shortCode)}</SelectItem>
                                    <SelectItem value="25" className="text-xs font-bold">{toLocaleNumber("25", shortCode)}</SelectItem>
                                    <SelectItem value="50" className="text-xs font-bold">{toLocaleNumber("50", shortCode)}</SelectItem>
                                    <SelectItem value="100" className="text-xs font-bold">{toLocaleNumber("100", shortCode)}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[640px]">
                            <TableHeader className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase font-bold text-gray-600 dark:text-gray-300">
                                <TableRow className="hover:bg-transparent whitespace-nowrap">
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-300 py-3.5 px-4">{t("incident")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-300 text-center w-[120px] py-3.5 px-4">{t("points")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-300 py-3.5 px-4">{t("description")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-300 text-right w-[100px] py-3.5 px-4">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i} className="text-xs">
                                            <TableCell className="py-3 px-4">
                                                <div className="flex items-center gap-2.5">
                                                    <Skeleton className="h-7 w-7 rounded-md" />
                                                    <Skeleton className="h-3.5 w-36 rounded" />
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center py-3 px-4">
                                                <Skeleton className="h-6 w-12 rounded-full mx-auto" />
                                            </TableCell>
                                            <TableCell className="py-3 px-4">
                                                <Skeleton className="h-3.5 w-full max-w-xs rounded" />
                                            </TableCell>
                                            <TableCell className="text-right py-3 px-4">
                                                <div className="flex justify-end gap-1">
                                                    <Skeleton className="h-7 w-7 rounded" />
                                                    <Skeleton className="h-7 w-7 rounded" />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : incidents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="px-4 py-14 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                                                <FolderOpen className="h-10 w-10 opacity-30" />
                                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t("no_incidents_found")}</p>
                                                <p className="text-[11px] text-gray-400">{t("click_add_incident_to_create_your_first_incident_type")}</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    incidents.map((incident) => {
                                        const pts = Number(incident.point || 0);
                                        return (
                                            <TableRow 
                                                key={incident.id} 
                                                className="text-xs hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-all cursor-pointer group whitespace-nowrap"
                                            >
                                                <TableCell className="py-3 px-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className={cn(
                                                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-2xs",
                                                            pts >= 0 
                                                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400" 
                                                                : "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
                                                        )}>
                                                            {pts >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                                        </span>
                                                        <span className="text-gray-900 dark:text-gray-100 font-bold">{incident.title}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-center">
                                                    <span className={cn(
                                                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold font-mono border tabular-nums shadow-2xs",
                                                        pts >= 0
                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
                                                            : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300"
                                                    )}>
                                                        {pts >= 0 ? `+${toLocaleNumber(pts, shortCode)}` : `-${toLocaleNumber(Math.abs(pts), shortCode)}`}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-600 dark:text-gray-300 max-w-md">
                                                    <span className="line-clamp-2">{incident.description || "—"}</span>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button 
                                                            onClick={() => handleEdit(incident)} 
                                                            size="sm" 
                                                            title={t("edit")}
                                                            className="h-7 w-7 p-0 rounded bg-amber-500 hover:bg-amber-600 text-white shadow-2xs active:scale-95 transition-all cursor-pointer"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button 
                                                            onClick={() => setDeleteId(incident.id)} 
                                                            size="sm" 
                                                            title={t("delete")}
                                                            className="h-7 w-7 p-0 rounded bg-red-500 hover:bg-red-600 text-white shadow-2xs active:scale-95 transition-all cursor-pointer"
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

                    {/* Pagination Footer with Gradient System */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400 font-medium pt-1">
                        <div>
                            {t("showing_x_to_y_of_z", {
                                from: toLocaleNumber(totalEntries === 0 ? 0 : startIndex + 1, shortCode),
                                to: toLocaleNumber(Math.min(currentPage * itemsPerPage, totalEntries), shortCode),
                                total: toLocaleNumber(totalEntries, shortCode),
                            })}
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                className="h-8 w-8 p-0 rounded-lg bg-background border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 cursor-pointer"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    size="sm"
                                    onClick={() => setCurrentPage(page)}
                                    className={cn(
                                        "h-8 w-8 p-0 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                        currentPage === page
                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-xs"
                                            : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                                    )}
                                >
                                    {toLocaleNumber(page, shortCode)}
                                </Button>
                            ))}
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === totalPages || incidents.length < itemsPerPage}
                                onClick={() => setCurrentPage((p) => p + 1)}
                                className="h-8 w-8 p-0 rounded-lg bg-background border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 cursor-pointer"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Add/Edit Modal Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl gap-0">
                    <DialogHeader className="flex flex-row items-center gap-3 px-6 py-5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] dark:from-gray-800 dark:to-gray-850 border-b border-gray-100 dark:border-gray-800 space-y-0">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <ShieldAlert className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <DialogTitle className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-none">
                                {editMode ? t("edit_incident") : t("add_incident")}
                            </DialogTitle>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {t("manage_behaviour_incident_types_and_their_points")}
                            </p>
                        </div>
                    </DialogHeader>

                    <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                        {/* Incident Title */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                <span>{t("incident_title")}</span>
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder={t("incident_title_example")}
                                className="h-10 text-xs bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>

                        {/* Point Value */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                <span>{t("point_value")}</span>
                                <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex items-center gap-3">
                                <Input
                                    type="number"
                                    value={formData.point}
                                    onChange={(e) => setFormData({ ...formData, point: parseInt(e.target.value) || 0 })}
                                    placeholder={t("point_value_example")}
                                    className="h-10 text-xs font-mono font-bold bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 flex-1"
                                />
                                <div className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center shadow-2xs transition-colors shrink-0",
                                    formData.point >= 0 
                                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" 
                                        : "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                                )}>
                                    {formData.point >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                                </div>
                            </div>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed flex items-center gap-1 pt-0.5">
                                <Info className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                <span>{t("use_negative_for_infractions_positive_for_commendations")}</span>
                            </p>
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                {t("description")}
                            </Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder={t("description")}
                                rows={3}
                                className="text-xs bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 resize-none"
                            />
                        </div>
                    </div>

                    {/* Dialog Footer */}
                    <DialogFooter className="px-6 py-4 bg-gray-50/80 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2.5">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setOpen(false)} 
                            className="h-9 px-4 text-xs font-semibold rounded-xl border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSave}
                            disabled={submitting}
                            className="h-9 px-6 text-xs font-bold rounded-xl bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md hover:shadow-lg border-none transition-all disabled:opacity-50 cursor-pointer gap-1.5"
                        >
                            {submitting ? (
                                <>
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                    <span>{t("saving")}</span>
                                </>
                            ) : (
                                <>
                                    <Save className="h-3.5 w-3.5" />
                                    <span>{t("save")}</span>
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Alert Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(isOpen) => !isOpen && setDeleteId(null)}>
                <AlertDialogContent className="rounded-3xl border-border bg-card">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-black tracking-tight text-foreground">
                            {t("delete")}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-muted-foreground font-medium leading-relaxed">
                            {t("delete_incident_confirmation")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl border-border text-xs font-bold">
                            {t("cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={executeDelete} 
                            className="rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                        >
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
