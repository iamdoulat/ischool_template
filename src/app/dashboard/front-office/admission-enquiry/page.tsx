"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    Search,
    Plus,
    Printer,
    FileText,
    Table as TableIcon,
    Download,
    Columns,
    ChevronDown,
    Phone,
    Pencil,
    X,
    Filter,
    Loader2,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Users,
    RefreshCw,
    Mail,
    MapPin,
    User,
    FileEdit,
    StickyNote,
    CalendarDays,
    CalendarClock,
    UserCheck,
    GitBranch,
    Radio,
    GraduationCap,
    Baby,
    CircleDot
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

interface AdmissionEnquiry {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
    description: string | null;
    note: string | null;
    date: string;
    next_follow_up_date: string | null;
    assigned: string | null;
    reference: string | null;
    source: string | null;
    class_id: number | null;
    no_of_child: number;
    status: "Active" | "Passive" | "Dead" | "Won" | "Lost";
}

interface SchoolClass {
    id: number;
    name: string;
}

export default function AdmissionEnquiryPage() {
    const [enquiries, setEnquiries] = useState<AdmissionEnquiry[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [sources, setSources] = useState<any[]>([]);
    const [references, setReferences] = useState<any[]>([]);
    const [staffList, setStaffList] = useState<{ id: number; name: string; role?: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEnquiry, setEditingEnquiry] = useState<AdmissionEnquiry | null>(null);
    const tt = useTranslateToast();
    const { t } = useTranslation();

    // useTranslateToast() returns a fresh object every render, so depending on it
    // directly in useCallback recreates the data-fetching callbacks each render —
    // which made the auto-fetch effect loop forever and left the Search/Save
    // buttons permanently spinning. Hold the latest helper in a ref instead.
    const ttRef = useRef(tt);
    ttRef.current = tt;

    // Filters state
    const [filters, setFilters] = useState({
        class_id: "",
        source: "",
        from_date: "",
        to_date: "",
        status: ""
    });

    // Pagination states
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(50);
    const [total, setTotal] = useState(0);
    const [lastPage, setLastPage] = useState(1);
    const [isBackendPaginated, setIsBackendPaginated] = useState(false);

    const [formData, setFormData] = useState<Partial<AdmissionEnquiry>>({
        name: "",
        phone: "",
        email: "",
        address: "",
        description: "",
        note: "",
        date: new Date().toISOString().split("T")[0],
        next_follow_up_date: "",
        assigned: "",
        reference: "",
        source: "",
        class_id: null,
        no_of_child: 1,
        status: "Active"
    });

    const fetchEnquiries = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.class_id) params.append("class_id", filters.class_id);
            if (filters.source) params.append("source", filters.source);
            if (filters.from_date) params.append("from_date", filters.from_date);
            if (filters.to_date) params.append("to_date", filters.to_date);
            if (filters.status) params.append("status", filters.status);
            params.append("page", String(page));
            params.append("limit", String(limit));
            if (debouncedSearch) params.append("search", debouncedSearch);

            const response = await api.get(`/admission-enquiries?${params.toString()}`);
            const resData = response.data?.data;
            if (resData && Array.isArray(resData.data)) {
                setEnquiries(resData.data);
                setTotal(resData.total || 0);
                setLastPage(resData.last_page || 1);
                setIsBackendPaginated(true);
            } else {
                const list = Array.isArray(resData) ? resData : (Array.isArray(response.data) ? response.data : []);
                setEnquiries(list);
                setTotal(list.length);
                setLastPage(Math.ceil(list.length / limit) || 1);
                setIsBackendPaginated(false);
            }
            setSelectedIds(new Set());
        } catch (error) {
            console.error("Error fetching enquiries:", error);
            ttRef.current.error("failed_to_fetch_enquiries");
        } finally {
            setLoading(false);
        }
    }, [filters, page, limit, debouncedSearch]);

    const fetchClasses = useCallback(async () => {
        try {
            const response = await api.get("/academics/classes?no_paginate=true");
            const classesData = response.data.data?.data || response.data.data || [];
            if (Array.isArray(classesData)) {
                setClasses(classesData);
            }
        } catch (error) {
            console.error("Error fetching classes:", error);
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

    const fetchReferences = useCallback(async () => {
        try {
            const response = await api.get("/front-office-references?limit=1000");
            const data = response.data.data?.data || response.data.data || [];
            if (Array.isArray(data)) setReferences(data);
        } catch (error) {
            console.error("Error fetching references:", error);
        }
    }, []);

    // Staff/teachers list for the "Assigned" field (excludes Students/Parents on the backend)
    const fetchStaff = useCallback(async () => {
        try {
            const response = await api.get("/hr/staff-directory", { params: { no_paginate: true, active: "all" } });
            const data = response.data.data?.data || response.data.data || response.data || [];
            if (Array.isArray(data)) {
                setStaffList(data.map((s: { id: number; name: string; role?: string }) => ({ id: s.id, name: s.name, role: s.role })));
            }
        } catch (error) {
            console.error("Error fetching staff:", error);
        }
    }, []);

    // Debounce the search box → server-side search, reset to first page
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchEnquiries();
    }, [fetchEnquiries]);

    useEffect(() => {
        fetchClasses();
        fetchSources();
        fetchReferences();
        fetchStaff();
    }, [fetchClasses, fetchSources, fetchReferences, fetchStaff]);

    const handleSave = async () => {
        if (!formData.name || !formData.phone || !formData.date) {
            tt.error("name_phone_date_required");
            return;
        }

        setSaving(true);
        try {
            if (editingEnquiry) {
                await api.put(`/admission-enquiries/${editingEnquiry.id}`, formData);
                tt.success("enquiry_updated_successfully");
            } else {
                await api.post("/admission-enquiries", formData);
                tt.success("enquiry_added_successfully");
            }
            setIsDialogOpen(false);
            setEditingEnquiry(null);
            resetForm();
            fetchEnquiries();
        } catch (error: any) {
            tt.error(error.response?.data?.message || "failed_to_save_enquiry");
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            phone: "",
            email: "",
            address: "",
            description: "",
            note: "",
            date: new Date().toISOString().split("T")[0],
            next_follow_up_date: "",
            assigned: "",
            reference: "",
            source: "",
            class_id: null,
            no_of_child: 1,
            status: "Active"
        });
    };

    const handleDelete = async (id: number) => {
        setLoading(true);
        try {
            await api.delete(`/admission-enquiries/${id}`);
            tt.success("enquiry_deleted_successfully");
            fetchEnquiries();
        } catch (error) {
            tt.error("failed_to_delete_enquiry");
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;

        setLoading(true);
        try {
            await api.post("/admission-enquiries/bulk-delete", { ids: Array.from(selectedIds) });
            tt.success("selected_enquiries_deleted");
            fetchEnquiries();
        } catch (error) {
            tt.error("failed_to_delete_selected_enquiries");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item: AdmissionEnquiry) => {
        setEditingEnquiry(item);
        setFormData({
            ...item,
            date: item.date ? item.date.split("T")[0] : "",
            next_follow_up_date: item.next_follow_up_date ? item.next_follow_up_date.split("T")[0] : ""
        });
        setIsDialogOpen(true);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(displayedEnquiries.map(e => e.id)));
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

    const filteredEnquiries = isBackendPaginated
        ? enquiries
        : enquiries.filter(e =>
            e.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            e.phone.toLowerCase().includes(debouncedSearch.toLowerCase())
        );

    const displayedEnquiries = isBackendPaginated
        ? filteredEnquiries
        : filteredEnquiries.slice((page - 1) * limit, page * limit);

    // Export functions
    const exportToCopy = () => {
        if (enquiries.length === 0) return;
        const text = ["Name\tPhone\tSource\tDate\tStatus", ...enquiries.map(e => `${e.name}\t${e.phone}\t${e.source || "-"}\t${e.date}\t${e.status}`)].join("\n");
        navigator.clipboard.writeText(text);
        tt.success("copied_to_clipboard");
    };

    const exportToExcel = () => {
        if (enquiries.length === 0) return;
        const worksheet = XLSX.utils.json_to_sheet(enquiries.map(e => ({
            Name: e.name,
            Phone: e.phone,
            Email: e.email,
            Source: e.source,
            Date: e.date,
            Status: e.status
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Enquiries");
        XLSX.writeFile(workbook, "admission_enquiries.xlsx");
        tt.success("excel_file_downloaded");
    };

    const exportToPDF = () => {
        if (enquiries.length === 0) return;
        const doc = new jsPDF();
        autoTable(doc, {
            head: [["Name", "Phone", "Source", "Date", "Status"]],
            body: enquiries.map(e => [e.name, e.phone, e.source || "-", e.date, e.status]),
        });
        doc.save("admission_enquiries.pdf");
        tt.success("pdf_file_downloaded");
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-lg">
                            <Users className="h-5 w-5" />
                        </span>
                        {t("admission_enquiry")}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1 ml-11">{t("manage_follow_up_admission_leads")}</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 text-xs font-semibold rounded-lg self-start sm:self-auto"
                    onClick={() => { setPage(1); fetchEnquiries(); }}
                    disabled={loading}
                >
                    <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                    {t("refresh")}
                </Button>
            </div>

            {/* Select Criteria Section */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("select_criteria")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("filter_admission_enquiries")}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 lg:grid-cols-6 gap-4 items-end">
                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("class")}</label>
                            <div className="relative">
                                <select
                                    className="flex h-10 w-full rounded-lg border border-muted/50 bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer group-hover:border-indigo-200 transition-colors"
                                    value={filters.class_id}
                                    onChange={(e) => setFilters({ ...filters, class_id: e.target.value })}
                                >
                                    <option value="">{t("select")}</option>
                                    {classes.map(cls => (
                                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("source")}</label>
                            <div className="relative">
                                <select
                                    className="flex h-10 w-full rounded-lg border border-muted/50 bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer group-hover:border-indigo-200 transition-colors"
                                    value={filters.source}
                                    onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                                >
                                    <option value="">{t("select")}</option>
                                    {sources.map(src => (
                                        <option key={src.id} value={src.name}>{src.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("enquiry_from_date")}</label>
                            <DatePicker
                                value={filters.from_date}
                                onChange={(val) => setFilters({ ...filters, from_date: val })}
                                placeholder={t("from_date")}
                                className="h-10 bg-muted/30 border-muted/50 group-hover:border-indigo-200 transition-colors"
                            />
                        </div>

                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("enquiry_to_date")}</label>
                            <DatePicker
                                value={filters.to_date}
                                onChange={(val) => setFilters({ ...filters, to_date: val })}
                                placeholder={t("to_date")}
                                className="h-10 bg-muted/30 border-muted/50 group-hover:border-indigo-200 transition-colors"
                            />
                        </div>

                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("status")}</label>
                            <div className="relative">
                                <select
                                    className="flex h-10 w-full rounded-lg border border-muted/50 bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer group-hover:border-indigo-200 transition-colors"
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                >
                                    <option value="">{t("select")}</option>
                                    <option value="All">{t("all")}</option>
                                    <option value="Active">{t("active")}</option>
                                    <option value="Passive">{t("passive")}</option>
                                    <option value="Dead">{t("dead")}</option>
                                    <option value="Won">{t("won")}</option>
                                    <option value="Lost">{t("lost")}</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button variant="gradient" className="h-10 px-8" onClick={() => { setPage(1); fetchEnquiries(); }} disabled={loading}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 text-white mr-2" />}
                                {t("search")}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* List Table */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Users className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("admission_enquiry")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("total_enquiries_count", { total })}</p>
                        </div>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingEnquiry(null); resetForm(); } }}>
                        <DialogTrigger asChild>
                            <Button variant="gradient" size="sm" className="h-9 px-6">
                                <Plus className="h-4 w-4 mr-1" /> {t("add")}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl sm:!max-w-[80vw] lg:!max-w-[68rem] p-0 overflow-hidden border-none shadow-2xl gap-0">
                            {/* Gradient header */}
                            <div className="relative bg-gradient-to-r from-[#FF9800] to-[#6366F1] px-6 py-5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-white ring-1 ring-white/30">
                                        {editingEnquiry ? <FileEdit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                                    </span>
                                    <div>
                                        <DialogTitle className="text-lg font-bold text-white leading-tight">
                                            {editingEnquiry ? t("edit_enquiry") : t("add_enquiry")}
                                        </DialogTitle>
                                        <p className="text-xs text-white/80 mt-0.5">{t("manage_follow_up_admission_leads")}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsDialogOpen(false)}
                                    className="text-white/80 hover:text-white hover:bg-white/15 rounded-lg p-1.5 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6 bg-white overflow-y-auto max-h-[72vh]">
                                {/* Section: Contact Information */}
                                <ModalSection icon={User} title={t("contact_information")}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                                        <Field icon={User} label={t("name")} required>
                                            <Input
                                                className="h-11 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-primary/20"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder={t("enter_full_name")}
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
                                        <Field icon={Mail} label={t("email")}>
                                            <Input
                                                type="email"
                                                className="h-11 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-primary/20"
                                                value={formData.email || ""}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="name@example.com"
                                            />
                                        </Field>
                                        <Field icon={MapPin} label={t("address")}>
                                            <Input
                                                className="h-11 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-primary/20"
                                                value={formData.address || ""}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                placeholder={t("enter_address")}
                                            />
                                        </Field>
                                    </div>
                                </ModalSection>

                                {/* Section: Enquiry Details */}
                                <ModalSection icon={GraduationCap} title={t("enquiry_details")}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4">
                                        <Field icon={CalendarDays} label={t("date")} required>
                                            <DatePicker
                                                value={formData.date || ""}
                                                onChange={(val) => setFormData({ ...formData, date: val })}
                                                placeholder={t("select_date")}
                                                className="bg-slate-50/50 border-slate-200"
                                            />
                                        </Field>
                                        <Field icon={Radio} label={t("source")}>
                                            <ModalSelect
                                                value={formData.source || ""}
                                                onChange={(val) => setFormData({ ...formData, source: val })}
                                                placeholder={t("select")}
                                                options={sources.map(src => ({ value: src.name, label: src.name }))}
                                            />
                                        </Field>
                                        <Field icon={GraduationCap} label={t("class")}>
                                            <ModalSelect
                                                value={formData.class_id ? String(formData.class_id) : ""}
                                                onChange={(val) => setFormData({ ...formData, class_id: val ? parseInt(val) : null })}
                                                placeholder={t("select")}
                                                options={classes.map(cls => ({ value: String(cls.id), label: cls.name }))}
                                            />
                                        </Field>
                                        <Field icon={Baby} label={t("number_of_child")}>
                                            <Input
                                                type="number"
                                                min="1"
                                                className="h-11 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-primary/20"
                                                value={formData.no_of_child}
                                                onChange={(e) => setFormData({ ...formData, no_of_child: parseInt(e.target.value) || 1 })}
                                            />
                                        </Field>
                                    </div>
                                </ModalSection>

                                {/* Section: Follow-up & Assignment */}
                                <ModalSection icon={CalendarClock} title={t("follow_up_assignment")}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4">
                                        <Field icon={CalendarClock} label={t("next_follow_up_date")}>
                                            <DatePicker
                                                value={formData.next_follow_up_date || ""}
                                                onChange={(val) => setFormData({ ...formData, next_follow_up_date: val })}
                                                placeholder={t("select_date")}
                                                className="bg-slate-50/50 border-slate-200"
                                            />
                                        </Field>
                                        <Field icon={UserCheck} label={t("assigned")}>
                                            <ModalSelect
                                                value={formData.assigned || ""}
                                                onChange={(val) => setFormData({ ...formData, assigned: val })}
                                                placeholder={t("select")}
                                                options={staffList.map((s) => ({
                                                    value: s.name,
                                                    label: s.role ? `${s.name} (${s.role})` : s.name,
                                                }))}
                                            />
                                        </Field>
                                        <Field icon={GitBranch} label={t("reference")}>
                                            <ModalSelect
                                                value={formData.reference || ""}
                                                onChange={(val) => setFormData({ ...formData, reference: val })}
                                                placeholder={t("select")}
                                                options={references.map(ref => ({ value: ref.name, label: ref.name }))}
                                            />
                                        </Field>
                                        <Field icon={CircleDot} label={t("status")}>
                                            <ModalSelect
                                                value={formData.status || "Active"}
                                                onChange={(val) => setFormData({ ...formData, status: val as AdmissionEnquiry["status"] })}
                                                options={[
                                                    { value: "Active", label: t("active") },
                                                    { value: "Passive", label: t("passive") },
                                                    { value: "Dead", label: t("dead") },
                                                    { value: "Won", label: t("won") },
                                                    { value: "Lost", label: t("lost") },
                                                ]}
                                            />
                                        </Field>
                                    </div>
                                </ModalSection>

                                {/* Section: Notes */}
                                <ModalSection icon={StickyNote} title={t("additional_notes")}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                                        <Field icon={FileText} label={t("description")}>
                                            <Textarea
                                                rows={3}
                                                className="rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-primary/20 resize-none"
                                                value={formData.description || ""}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                placeholder={t("enter_description")}
                                            />
                                        </Field>
                                        <Field icon={StickyNote} label={t("note")}>
                                            <Textarea
                                                rows={3}
                                                className="rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-primary/20 resize-none"
                                                value={formData.note || ""}
                                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                                placeholder={t("enter_note")}
                                            />
                                        </Field>
                                    </div>
                                </ModalSection>
                            </div>

                            <DialogFooter className="bg-slate-50/80 px-6 py-4 border-t border-slate-200 sm:justify-end gap-2">
                                <Button variant="outline" className="h-10 px-6 rounded-lg font-semibold" onClick={() => setIsDialogOpen(false)} disabled={saving}>
                                    {t("cancel")}
                                </Button>
                                <Button variant="gradient" className="h-10 px-8 rounded-lg font-bold shadow-lg shadow-primary/20" onClick={handleSave} disabled={saving}>
                                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                    {editingEnquiry ? t("update") : t("save")}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent className="p-6">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t("search_by_name_or_phone")}
                                className="pl-10 h-10 rounded-lg bg-muted/30 border-muted/50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
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
                                    <SelectTrigger className="h-8 w-16 text-xs border border-muted/50 bg-muted/30 hover:bg-muted/50 transition-colors shadow-none rounded-lg font-semibold text-muted-foreground bg-white">
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
                                <IconButton icon={Printer} onClick={() => window.print()} title={t("print")} />
                                <IconButton icon={CopyIcon} onClick={exportToCopy} title={t("copy")} />
                                <IconButton icon={TableIcon} onClick={exportToExcel} title={t("excel")} />
                                <IconButton icon={FileText} onClick={exportToPDF} title={t("pdf")} />
                                <IconButton icon={Download} onClick={exportToExcel} title={t("download")} />
                                <IconButton icon={Columns} title={t("columns")} />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-lg border border-muted/50">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-muted/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                <tr>
                                    <Th className="w-10">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-muted/50 text-primary cursor-pointer"
                                            checked={displayedEnquiries.length > 0 && selectedIds.size === displayedEnquiries.length}
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                        />
                                    </Th>
                                    <Th>{t("name")}</Th>
                                    <Th>{t("phone")}</Th>
                                    <Th className="hidden lg:table-cell">{t("source")}</Th>
                                    <Th className="hidden md:table-cell">{t("enquiry_date")}</Th>
                                    <Th className="hidden xl:table-cell">{t("next_follow_up")}</Th>
                                    <Th>{t("status")}</Th>
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
                                                        {t("permanently_delete_selected_enquiries", { count: selectedIds.size })}
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
                                {displayedEnquiries.length > 0 ? (
                                    displayedEnquiries.map((item) => (
                                        <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                                            <Td>
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-muted/50 text-primary cursor-pointer"
                                                    checked={selectedIds.has(item.id)}
                                                    onChange={() => handleSelectOne(item.id)}
                                                />
                                            </Td>
                                            <Td className="font-semibold text-slate-700">{item.name}</Td>
                                            <Td className="text-slate-600 font-medium">{item.phone}</Td>
                                            <Td className="text-slate-600 font-medium hidden lg:table-cell">{item.source || "-"}</Td>
                                            <Td className="text-slate-600 font-medium hidden md:table-cell">{item.date ? item.date.split("T")[0] : "-"}</Td>
                                            <Td className="text-slate-600 font-medium hidden xl:table-cell">{item.next_follow_up_date ? item.next_follow_up_date.split("T")[0] : "-"}</Td>
                                            <Td>
                                                <Badge variant="outline" className={cn(
                                                    "text-[10px] font-bold px-2 py-0.5",
                                                    item.status === "Active" ? "border-green-200 text-green-700 bg-green-50/30" :
                                                        item.status === "Passive" ? "border-orange-200 text-orange-700 bg-orange-50/30" :
                                                            item.status === "Won" ? "border-emerald-200 text-emerald-700 bg-emerald-50/30" :
                                                                item.status === "Lost" ? "border-slate-200 text-slate-700 bg-slate-50/30" :
                                                                    "border-red-200 text-red-700 bg-red-50/30"
                                                )}>
                                                    {item.status}
                                                </Badge>
                                            </Td>
                                            <Td className="text-right">
                                                <div className="flex justify-end gap-1 px-2">
                                                    <ActionBtn icon={Phone} className="bg-green-500" title={t("call_x", { phone: item.phone })} onClick={() => { if (item.phone) window.location.href = `tel:${item.phone}`; }} />
                                                    <ActionBtn icon={Pencil} className="bg-indigo-500" onClick={() => handleEdit(item)} title={t("edit")} />
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <ActionBtn icon={X} className="bg-red-500" title={t("delete")} />
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>{t("are_you_sure")}</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    {t("permanently_delete_enquiry_for", { name: item.name })}
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-red-500 hover:bg-red-600">{t("delete")}</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </Td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <Td colSpan={8} className="text-center py-10">
                                            {loading ? <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /> : t("no_enquiries_found")}
                                        </Td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                            {t("showing_x_to_y_of_z", { from: total > 0 ? ((page - 1) * limit) + 1 : 0, to: Math.min(page * limit, total), total })}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap justify-center">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-[10px] border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 active:scale-95 transition-all bg-white"
                                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                disabled={page === 1 || loading}
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
                                        disabled={loading}
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
                                disabled={page === lastPage || lastPage === 0 || loading}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
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
    return <th className={cn("px-4 py-4 border-b border-muted/50", className)}>{children}</th>;
}

function Td({ children, className, colSpan }: { children: React.ReactNode, className?: string, colSpan?: number }) {
    return <td colSpan={colSpan} className={cn("px-4 py-4 text-sm", className)}>{children}</td>;
}

function IconButton({ icon: Icon, onClick, title }: { icon: any, onClick?: () => void, title?: string }) {
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

function ActionBtn({ icon: Icon, className, onClick, title }: { icon: any, className?: string, onClick?: () => void, title?: string }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={cn("p-1.5 text-white rounded transition-all shadow-sm active:scale-90", className)}
        >
            <Icon className="h-3.5 w-3.5" />
        </button>
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

function CopyIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("lucide lucide-copy", className)}>
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
    );
}
