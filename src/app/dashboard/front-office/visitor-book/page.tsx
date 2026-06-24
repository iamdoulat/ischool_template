"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    Search,
    Plus,
    Printer,
    FileText,
    Download,
    Columns,
    ChevronDown,
    Eye,
    Pencil,
    Trash2,
    X,
    Copy,
    FileSpreadsheet,
    Users,
    Paperclip,
    ChevronLeft,
    ChevronRight,
    Loader2,
    User,
    Phone,
    CreditCard,
    UsersRound,
    CalendarDays,
    Clock,
    LogOut,
    Radio,
    Target,
    UserCheck,
    StickyNote,
    FileEdit
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import api from "@/lib/api";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Visitor {
    id: number;
    purpose: string;
    meeting_with: string;
    visitor_name: string;
    phone: string;
    id_card: string | null;
    number_of_person: number;
    date: string;
    in_time: string;
    out_time: string | null;
    note: string | null;
    attachment: string | null;
    source: string | null;
}

export default function VisitorBookPage() {
    const tt = useTranslateToast();
    const { t } = useTranslation();

    // useTranslateToast() returns a fresh object every render; holding it in a ref
    // keeps the data-fetching callbacks stable so the auto-fetch effect can't loop.
    const ttRef = useRef(tt);
    ttRef.current = tt;

    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [purposes, setPurposes] = useState<{ id: number; name: string }[]>([]);
    const [sources, setSources] = useState<{ id: number; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    const [currentVisitor, setCurrentVisitor] = useState<Visitor | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(50);
    const [total, setTotal] = useState(0);
    const [lastPage, setLastPage] = useState(1);
    const [isBackendPaginated, setIsBackendPaginated] = useState(false);

    const [formData, setFormData] = useState<Partial<Visitor>>({
        purpose: "",
        meeting_with: "",
        visitor_name: "",
        phone: "",
        id_card: "",
        number_of_person: 1,
        date: new Date().toISOString().split("T")[0],
        in_time: "09:00",
        out_time: "",
        note: "",
        attachment: "",
        source: ""
    });

    const fetchVisitors = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/visitors", {
                params: {
                    search: searchQuery,
                    page: page,
                    limit: limit
                }
            });
            const resData = response.data?.data;
            if (resData && Array.isArray(resData.data)) {
                setVisitors(resData.data);
                setTotal(resData.total || 0);
                setLastPage(resData.last_page || 1);
                setIsBackendPaginated(true);
            } else {
                const list = Array.isArray(resData) ? resData : (Array.isArray(response.data?.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []));
                setVisitors(list);
                setTotal(list.length);
                setLastPage(Math.ceil(list.length / limit) || 1);
                setIsBackendPaginated(false);
            }
            setSelectedIds([]);
        } catch (error) {
            console.error("Error fetching visitors:", error);
            ttRef.current.error("failed_to_load_visitors");
        } finally {
            setLoading(false);
        }
    }, [searchQuery, page, limit]);

    const fetchPurposes = useCallback(async () => {
        try {
            const response = await api.get("/front-office-purposes?limit=1000");
            const data = response.data.data?.data || response.data.data || [];
            if (Array.isArray(data)) setPurposes(data);
        } catch (error) {
            console.error("Error fetching purposes:", error);
        }
    }, []);

    const fetchSources = useCallback(async () => {
        try {
            const response = await api.get("/front-office-sources?limit=1000");
            const data = response.data.data?.data || response.data.data || [];
            if (Array.isArray(data)) setSources(data);
        } catch (error) {
            console.error("Error fetching sources:", error);
        }
    }, []);

    useEffect(() => {
        fetchVisitors();
    }, [fetchVisitors]);

    useEffect(() => {
        fetchPurposes();
        fetchSources();
    }, [fetchPurposes, fetchSources]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.purpose || !formData.meeting_with || !formData.visitor_name || !formData.phone || !formData.date || !formData.in_time) {
            tt.error("please_fill_required_fields");
            return;
        }
        setSaving(true);
        try {
            if (currentVisitor) {
                await api.put(`/visitors/${currentVisitor.id}`, formData);
                tt.success("visitor_updated_successfully");
            } else {
                await api.post("/visitors", formData);
                tt.success("visitor_added_successfully");
            }
            setIsDialogOpen(false);
            fetchVisitors();
            resetForm();
        } catch (error) {
            console.error("Error saving visitor:", error);
            const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            tt.error(msg || "failed_to_save_visitor");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/visitors/${deleteId}`);
            tt.success("visitor_deleted_successfully");
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
            fetchVisitors();
        } catch (error) {
            console.error("Error deleting visitor:", error);
            tt.error("failed_to_delete_visitor");
        }
    };

    const handleBulkDelete = async () => {
        try {
            await api.post("/visitors/bulk-delete", { ids: selectedIds });
            tt.success("visitors_deleted_successfully", { count: selectedIds.length });
            setIsBulkDeleteDialogOpen(false);
            setSelectedIds([]);
            fetchVisitors();
        } catch (error) {
            console.error("Error bulk deleting visitors:", error);
            tt.error("failed_to_delete_selected_visitors");
        }
    };

    const resetForm = () => {
        setFormData({
            purpose: "",
            meeting_with: "",
            visitor_name: "",
            phone: "",
            id_card: "",
            number_of_person: 1,
            date: new Date().toISOString().split("T")[0],
            in_time: "09:00",
            out_time: "",
            note: "",
            attachment: "",
            source: ""
        });
        setCurrentVisitor(null);
    };

    const openEditModal = (visitor: Visitor) => {
        setCurrentVisitor(visitor);
        setFormData({
            ...visitor,
            date: visitor.date ? new Date(visitor.date).toISOString().split("T")[0] : "",
            in_time: visitor.in_time ? visitor.in_time.substring(0, 5) : "",
            out_time: visitor.out_time ? visitor.out_time.substring(0, 5) : "",
            source: visitor.source || ""
        });
        setIsDialogOpen(true);
    };

    const displayedVisitors = isBackendPaginated ? visitors : visitors.slice((page - 1) * limit, page * limit);

    const toggleSelectAll = () => {
        const displayedIds = displayedVisitors.map(v => v.id);
        const allDisplayedSelected = displayedIds.every(id => selectedIds.includes(id));
        if (allDisplayedSelected) {
            setSelectedIds(selectedIds.filter(id => !displayedIds.includes(id)));
        } else {
            const newSelected = [...selectedIds];
            displayedIds.forEach(id => {
                if (!newSelected.includes(id)) {
                    newSelected.push(id);
                }
            });
            setSelectedIds(newSelected);
        }
    };

    const toggleSelect = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    // Export functions
    const handleCopy = () => {
        if (visitors.length === 0) return;
        const text = [
            "Purpose\tMeeting With\tVisitor\tPhone\tDate\tIn\tOut",
            ...visitors.map(v => `${v.purpose}\t${v.meeting_with}\t${v.visitor_name}\t${v.phone}\t${v.date}\t${v.in_time}\t${v.out_time || "-"}`)
        ].join("\n");
        navigator.clipboard.writeText(text);
        tt.success("copied_to_clipboard");
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = () => {
        if (visitors.length === 0) return;
        const worksheet = XLSX.utils.json_to_sheet(visitors.map(v => ({
            Purpose: v.purpose,
            "Meeting With": v.meeting_with,
            Visitor: v.visitor_name,
            Phone: v.phone,
            "ID Card": v.id_card,
            Persons: v.number_of_person,
            Date: v.date,
            "In Time": v.in_time,
            "Out Time": v.out_time,
            Source: v.source,
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Visitors");
        XLSX.writeFile(workbook, "visitor_book.xlsx");
        tt.success("excel_file_downloaded");
    };

    const handleExportPDF = () => {
        if (visitors.length === 0) return;
        const doc = new jsPDF();
        autoTable(doc, {
            head: [["Purpose", "Meeting With", "Visitor", "Phone", "Date", "In", "Out"]],
            body: visitors.map(v => [v.purpose, v.meeting_with, v.visitor_name, v.phone, v.date, v.in_time, v.out_time || "-"]),
        });
        doc.save("visitor_book.pdf");
        tt.success("pdf_file_downloaded");
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Users className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("visitor_book")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("total_visitors_count", { total })}</p>
                        </div>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                        <DialogTrigger asChild>
                            <Button variant="gradient" size="sm" className="h-9 px-6">
                                <Plus className="h-4 w-4 mr-2" /> {t("add")}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl sm:!max-w-[80vw] lg:!max-w-[68rem] p-0 overflow-hidden border-none shadow-2xl gap-0">
                            {/* Gradient header */}
                            <div className="relative bg-gradient-to-r from-[#FF9800] to-[#6366F1] px-6 py-5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-white ring-1 ring-white/30">
                                        {currentVisitor ? <FileEdit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                                    </span>
                                    <div>
                                        <DialogTitle className="text-lg font-bold text-white leading-tight">
                                            {currentVisitor ? t("edit_visitor") : t("add_visitor")}
                                        </DialogTitle>
                                        <p className="text-xs text-white/80 mt-0.5">{t("record_visitor_entry")}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsDialogOpen(false)}
                                    className="text-white/80 hover:text-white hover:bg-white/15 rounded-lg p-1.5 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSave}>
                                <div className="p-6 space-y-6 bg-white overflow-y-auto max-h-[72vh]">
                                    {/* Section: Visitor Information */}
                                    <ModalSection icon={User} title={t("visitor_information")}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-4">
                                            <Field icon={User} label={t("visitor_name")} required>
                                                <Input
                                                    className="h-11 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-primary/20"
                                                    value={formData.visitor_name}
                                                    onChange={(e) => setFormData({ ...formData, visitor_name: e.target.value })}
                                                    placeholder={t("enter_visitor_name")}
                                                />
                                            </Field>
                                            <Field icon={Phone} label={t("phone")} required>
                                                <Input
                                                    className="h-11 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-primary/20"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    placeholder={t("enter_phone_number")}
                                                />
                                            </Field>
                                            <Field icon={CreditCard} label={t("id_card")}>
                                                <Input
                                                    className="h-11 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-primary/20"
                                                    value={formData.id_card || ""}
                                                    onChange={(e) => setFormData({ ...formData, id_card: e.target.value })}
                                                    placeholder={t("id_card_number")}
                                                />
                                            </Field>
                                        </div>
                                    </ModalSection>

                                    {/* Section: Visit Details */}
                                    <ModalSection icon={Target} title={t("visit_details")}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-4">
                                            <Field icon={Target} label={t("purpose")} required>
                                                <ModalSelect
                                                    value={formData.purpose || ""}
                                                    onChange={(val) => setFormData({ ...formData, purpose: val })}
                                                    placeholder={t("select")}
                                                    options={purposes.map(p => ({ value: p.name, label: p.name }))}
                                                />
                                            </Field>
                                            <Field icon={UserCheck} label={t("meeting_with")} required>
                                                <Input
                                                    placeholder={t("meeting_with_placeholder")}
                                                    className="h-11 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-primary/20"
                                                    value={formData.meeting_with}
                                                    onChange={(e) => setFormData({ ...formData, meeting_with: e.target.value })}
                                                />
                                            </Field>
                                            <Field icon={UsersRound} label={t("number_of_person")} required>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    className="h-11 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-primary/20"
                                                    value={formData.number_of_person}
                                                    onChange={(e) => setFormData({ ...formData, number_of_person: parseInt(e.target.value) || 1 })}
                                                />
                                            </Field>
                                            <Field icon={Radio} label={t("source")}>
                                                <ModalSelect
                                                    value={formData.source || ""}
                                                    onChange={(val) => setFormData({ ...formData, source: val })}
                                                    placeholder={t("select")}
                                                    options={sources.map(s => ({ value: s.name, label: s.name }))}
                                                />
                                            </Field>
                                        </div>
                                    </ModalSection>

                                    {/* Section: Date & Time */}
                                    <ModalSection icon={CalendarDays} title={t("date_and_time")}>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4">
                                            <Field icon={CalendarDays} label={t("date")} required>
                                                <DatePicker
                                                    value={formData.date || ""}
                                                    onChange={(val) => setFormData({ ...formData, date: val })}
                                                    placeholder={t("select_date")}
                                                    className="bg-slate-50/50 border-slate-200"
                                                />
                                            </Field>
                                            <Field icon={Clock} label={t("in_time")} required>
                                                <Input
                                                    type="time"
                                                    className="h-11 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-primary/20"
                                                    value={formData.in_time}
                                                    onChange={(e) => setFormData({ ...formData, in_time: e.target.value })}
                                                />
                                            </Field>
                                            <Field icon={LogOut} label={t("out_time")}>
                                                <Input
                                                    type="time"
                                                    className="h-11 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-primary/20"
                                                    value={formData.out_time || ""}
                                                    onChange={(e) => setFormData({ ...formData, out_time: e.target.value })}
                                                />
                                            </Field>
                                        </div>
                                    </ModalSection>

                                    {/* Section: Additional */}
                                    <ModalSection icon={StickyNote} title={t("additional_notes")}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                                            <Field icon={StickyNote} label={t("note")}>
                                                <textarea
                                                    rows={3}
                                                    className="flex w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all focus:bg-white resize-none"
                                                    value={formData.note || ""}
                                                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                                    placeholder={t("enter_note")}
                                                />
                                            </Field>
                                            <Field icon={Paperclip} label={t("attachment")}>
                                                <div className="h-[5.25rem] w-full border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-not-allowed opacity-70">
                                                    <Paperclip className="h-5 w-5 text-slate-400" />
                                                    <span className="text-xs text-slate-500 mt-1">{t("attachment_coming_soon")}</span>
                                                </div>
                                            </Field>
                                        </div>
                                    </ModalSection>
                                </div>

                                <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
                                    <Button type="button" variant="outline" className="h-10 px-6 rounded-lg font-semibold" onClick={() => setIsDialogOpen(false)} disabled={saving}>
                                        {t("cancel")}
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="gradient"
                                        className="h-10 px-8 rounded-lg font-bold shadow-lg shadow-primary/20"
                                        disabled={saving}
                                    >
                                        {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                        {currentVisitor ? t("update") : t("save")}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent className="p-6">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t("search_visitors")}
                                className="pl-10 h-10 rounded-lg bg-muted/30 border-muted/50 focus:ring-2 focus:ring-indigo-500/20"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 mr-2">
                                <Select
                                    value={String(limit)}
                                    onValueChange={(val) => {
                                        setLimit(Number(val));
                                        setPage(1);
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-16 text-xs border border-muted/50 bg-muted/30 hover:bg-muted/50 transition-colors shadow-none rounded-lg font-semibold text-muted-foreground">
                                        <SelectValue placeholder={String(limit)} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg border-muted/50">
                                        {[20, 50, 100, 500].map((n) => (
                                            <SelectItem key={n} value={String(n)} className="font-medium text-slate-700">
                                                {n}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-1">
                                <IconButton icon={Printer} onClick={handlePrint} title={t("print")} />
                                <IconButton icon={Copy} onClick={handleCopy} title={t("copy")} />
                                <IconButton icon={FileSpreadsheet} onClick={handleExportExcel} title={t("excel")} />
                                <IconButton icon={FileText} onClick={handleExportPDF} title={t("pdf")} />
                                <IconButton icon={Download} onClick={handleExportExcel} title={t("download")} />
                                <IconButton icon={Columns} title={t("columns")} />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-lg border border-muted/50">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-muted/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-4 w-10">
                                        <Checkbox
                                            checked={displayedVisitors.length > 0 && displayedVisitors.every(v => selectedIds.includes(v.id))}
                                            onCheckedChange={toggleSelectAll}
                                        />
                                    </th>
                                    <Th>{t("purpose")}</Th>
                                    <Th>{t("meeting_with")}</Th>
                                    <Th>{t("visitor_name")}</Th>
                                    <Th>{t("phone")}</Th>
                                    <Th>{t("id_card")}</Th>
                                    <Th>{t("number_of_person")}</Th>
                                    <Th>{t("date")}</Th>
                                    <Th>{t("in_time")}</Th>
                                    <Th>{t("out_time")}</Th>
                                    <Th>{t("source")}</Th>
                                    <th className="px-4 py-4 text-right">
                                        <div className="flex justify-end">
                                            {selectedIds.length > 0 ? (
                                                <button
                                                    onClick={() => setIsBulkDeleteDialogOpen(true)}
                                                    className="bg-red-500 hover:bg-red-600 p-1.5 rounded transition-colors"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 text-white" />
                                                </button>
                                            ) : (
                                                <span className="text-muted-foreground font-bold tracking-wider">{t("action")}</span>
                                            )}
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-muted/30">
                                {loading ? (
                                    <tr>
                                        <td colSpan={12} className="px-4 py-8 text-center text-muted-foreground">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                        </td>
                                    </tr>
                                ) : displayedVisitors.length === 0 ? (
                                    <tr>
                                        <td colSpan={12} className="px-4 py-8 text-center text-muted-foreground">{t("no_visitors_found")}</td>
                                    </tr>
                                ) : (
                                    displayedVisitors.map((visitor) => (
                                        <tr key={visitor.id} className={cn(
                                            "hover:bg-muted/10 transition-colors group",
                                            selectedIds.includes(visitor.id) && "bg-muted/30"
                                        )}>
                                            <td className="px-4 py-4">
                                                <Checkbox
                                                    checked={selectedIds.includes(visitor.id)}
                                                    onCheckedChange={() => toggleSelect(visitor.id)}
                                                />
                                            </td>
                                            <Td className="text-slate-600 font-medium whitespace-nowrap">{visitor.purpose}</Td>
                                            <Td className="text-slate-600 font-medium whitespace-nowrap">{visitor.meeting_with}</Td>
                                            <Td className="text-slate-700 font-semibold whitespace-nowrap">{visitor.visitor_name}</Td>
                                            <Td className="text-slate-600 font-medium whitespace-nowrap">{visitor.phone}</Td>
                                            <Td className="text-slate-600 font-medium whitespace-nowrap">{visitor.id_card || "-"}</Td>
                                            <Td className="text-slate-600 font-medium whitespace-nowrap">{visitor.number_of_person}</Td>
                                            <Td className="text-slate-600 font-medium whitespace-nowrap">{visitor.date ? new Date(visitor.date).toLocaleDateString() : "-"}</Td>
                                            <Td className="text-slate-600 font-medium whitespace-nowrap">{visitor.in_time}</Td>
                                            <Td className="text-slate-600 font-medium whitespace-nowrap">{visitor.out_time || "-"}</Td>
                                            <Td className="text-slate-600 font-medium whitespace-nowrap">{visitor.source || "-"}</Td>
                                            <Td className="text-right">
                                                <div className="flex justify-end gap-1 px-1">
                                                    <ActionBtn icon={Eye} className="bg-indigo-500" onClick={() => { setSelectedVisitor(visitor); setIsViewDialogOpen(true); }} />
                                                    {visitor.attachment && <ActionBtn icon={Download} className="bg-indigo-500" />}
                                                    <ActionBtn icon={Pencil} className="bg-amber-500" onClick={() => openEditModal(visitor)} />
                                                    <ActionBtn icon={Trash2} className="bg-red-500" onClick={() => { setDeleteId(visitor.id); setIsDeleteDialogOpen(true); }} />
                                                </div>
                                            </Td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground font-medium">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                            {t("showing_x_to_y_of_z", { from: total > 0 ? (page - 1) * limit + 1 : 0, to: Math.min(page * limit, total), total })}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap justify-center">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-[10px] border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 active:scale-95 transition-all bg-white"
                                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            {getPageNumbers(page, lastPage).map((p, idx) =>
                                p === "…" ? (
                                    <span key={`gap-${idx}`} className="px-1.5 text-gray-400 text-sm select-none">…</span>
                                ) : (
                                    <Button
                                        key={p}
                                        variant={page === p ? "pagination-active" : "pagination-inactive"}
                                        size="icon"
                                        className="h-8 w-8 rounded-[10px] text-xs font-bold"
                                        onClick={() => setPage(p)}
                                    >
                                        {p}
                                    </Button>
                                )
                            )}
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-[10px] border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 active:scale-95 transition-all bg-white"
                                onClick={() => setPage(prev => Math.min(prev + 1, lastPage))}
                                disabled={page === lastPage || lastPage === 0}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("are_you_sure")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("permanently_delete_visitor_entry")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteId(null)}>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">{t("delete")}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("bulk_delete_visitors")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("confirm_bulk_delete_visitors", { count: selectedIds.length })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsBulkDeleteDialogOpen(false)}>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} className="bg-red-500 hover:bg-red-600">{t("delete_selected")}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl gap-0">
                    <DialogHeader className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] p-6 space-y-0">
                        <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            {t("visitor_details")}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-6">
                        <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                            <DetailItem label={t("purpose")} value={selectedVisitor?.purpose} />
                            <DetailItem label={t("source")} value={selectedVisitor?.source} />
                            <DetailItem label={t("meeting_with")} value={selectedVisitor?.meeting_with} />
                            <DetailItem label={t("visitor_name")} value={selectedVisitor?.visitor_name} />
                            <DetailItem label={t("phone")} value={selectedVisitor?.phone} />
                            <DetailItem label={t("id_card")} value={selectedVisitor?.id_card} />
                            <DetailItem label={t("number_of_person")} value={selectedVisitor?.number_of_person?.toString()} />
                            <DetailItem label={t("date")} value={selectedVisitor?.date ? new Date(selectedVisitor.date).toLocaleDateString() : "-"} />
                            <DetailItem label={t("in_time")} value={selectedVisitor?.in_time} />
                            <DetailItem label={t("out_time")} value={selectedVisitor?.out_time} />
                            <div className="col-span-2 space-y-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("note")}</label>
                                <p className="text-sm text-slate-700 bg-muted/30 p-3 rounded-lg border border-muted/50 min-h-[60px]">
                                    {selectedVisitor?.note || t("no_note_provided")}
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end mt-8">
                            <Button
                                onClick={() => setIsViewDialogOpen(false)}
                                variant="gradient"
                                className="px-8 h-10 rounded-lg shadow-lg shadow-indigo-200 transition-all active:scale-95 text-white"
                            >
                                {t("close")}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Build a windowed list of page numbers with ellipsis, e.g. [1, '…', 4, 5, 6, '…', 20]
function getPageNumbers(current: number, last: number): (number | "…")[] {
    if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
    const pages: (number | "…")[] = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(last - 1, current + 1);
    if (start > 2) pages.push("…");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < last - 1) pages.push("…");
    pages.push(last);
    return pages;
}

// Helper Components
function Th({ children, className }: { children: React.ReactNode, className?: string }) {
    return <th className={cn("px-4 py-4 border-b border-muted/50 whitespace-nowrap", className)}>{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode, className?: string }) {
    return <td className={cn("px-4 py-4 text-sm", className)}>{children}</td>;
}

function IconButton({ icon: Icon, onClick, title }: { icon: React.ElementType, onClick?: () => void, title?: string }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className="p-2 hover:bg-muted rounded-lg transition-colors border border-muted/50 text-muted-foreground hover:text-foreground shadow-sm"
        >
            <Icon className="h-4 w-4" />
        </button>
    );
}

function ActionBtn({ icon: Icon, className, onClick }: { icon: React.ElementType, className?: string, onClick?: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn("p-1.5 text-white rounded transition-all hover:shadow-md active:scale-90", className)}
        >
            <Icon className="h-3 w-3" />
        </button>
    );
}

function DetailItem({ label, value }: { label: string, value: string | null | undefined }) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</label>
            <div className="h-10 flex items-center px-3 bg-muted/30 rounded-lg border border-muted/50">
                <span className="text-sm font-semibold text-slate-700">{value || "-"}</span>
            </div>
        </div>
    );
}

// Grouped section inside the modal with a small icon heading + divider
function ModalSection({ icon: Icon, title, children }: { icon: LucideIcon, title: string, children: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800]/10 to-[#6366F1]/10 text-indigo-600">
                    <Icon className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
            </div>
            {children}
        </div>
    );
}

// Field wrapper: icon label + required marker + control
function Field({ icon: Icon, label, required, children }: { icon: LucideIcon, label: string, required?: boolean, children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 ml-0.5">
                <Icon className="h-3.5 w-3.5 text-slate-400" />
                {label}
                {required && <span className="text-destructive">*</span>}
            </label>
            {children}
        </div>
    );
}

// Styled native select used inside the modal (matches the modal field aesthetic)
function ModalSelect({ value, onChange, options, placeholder }: { value: string, onChange: (val: string) => void, options: { value: string, label: string }[], placeholder?: string }) {
    return (
        <div className="relative">
            <select
                className="flex h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white appearance-none cursor-pointer transition-all"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                {placeholder !== undefined && <option value="">{placeholder}</option>}
                {options.map((opt, idx) => (
                    <option key={`${opt.value}-${idx}`} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
    );
}
