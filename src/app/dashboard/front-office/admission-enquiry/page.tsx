"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search,
    Plus,
    Printer,
    FileText,
    Table as TableIcon,
    FileDown,
    Download,
    Columns,
    ChevronDown,
    Phone,
    Pencil,
    X,
    Calendar,
    Filter,
    Loader2,
    AlertCircle,
    Trash2,
    Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
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
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";

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
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEnquiry, setEditingEnquiry] = useState<AdmissionEnquiry | null>(null);
    const { toast } = useToast();

    // Filters state
    const [filters, setFilters] = useState({
        class_id: "",
        source: "",
        from_date: "",
        to_date: "",
        status: ""
    });

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

            const response = await api.get(`/admission-enquiries?${params.toString()}`);
            setEnquiries(response.data.data);
            setSelectedIds(new Set());
        } catch (error) {
            console.error("Error fetching enquiries:", error);
            toast("error", "Failed to fetch enquiries.");
        } finally {
            setLoading(false);
        }
    }, [filters, toast]);

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

    useEffect(() => {
        fetchEnquiries();
    }, [fetchEnquiries]);

    useEffect(() => {
        fetchClasses();
        fetchSources();
        fetchReferences();
    }, [fetchClasses, fetchSources, fetchReferences]);

    const handleSave = async () => {
        if (!formData.name || !formData.phone || !formData.date) {
            toast("error", "Name, Phone and Date are required.");
            return;
        }

        setLoading(true);
        try {
            if (editingEnquiry) {
                await api.put(`/admission-enquiries/${editingEnquiry.id}`, formData);
                toast("success", "Enquiry updated successfully.");
            } else {
                await api.post("/admission-enquiries", formData);
                toast("success", "Enquiry added successfully.");
            }
            setIsDialogOpen(false);
            setEditingEnquiry(null);
            resetForm();
            fetchEnquiries();
        } catch (error: any) {
            toast("error", error.response?.data?.message || "Failed to save enquiry.");
        } finally {
            setLoading(false);
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
            toast("success", "Enquiry deleted successfully.");
            fetchEnquiries();
        } catch (error) {
            toast("error", "Failed to delete enquiry.");
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;

        setLoading(true);
        try {
            await api.post("/admission-enquiries/bulk-delete", { ids: Array.from(selectedIds) });
            toast("success", "Selected enquiries deleted successfully.");
            fetchEnquiries();
        } catch (error) {
            toast("error", "Failed to delete selected enquiries.");
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
            setSelectedIds(new Set(filteredEnquiries.map(e => e.id)));
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

    const filteredEnquiries = enquiries.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Export functions
    const exportToCopy = () => {
        if (enquiries.length === 0) return;
        const text = ["Name\tPhone\tSource\tDate\tStatus", ...enquiries.map(e => `${e.name}\t${e.phone}\t${e.source || "-"}\t${e.date}\t${e.status}`)].join("\n");
        navigator.clipboard.writeText(text);
        toast("success", "Copied to clipboard");
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
        toast("success", "Excel file downloaded");
    };

    const exportToPDF = () => {
        if (enquiries.length === 0) return;
        const doc = new jsPDF();
        autoTable(doc, {
            head: [["Name", "Phone", "Source", "Date", "Status"]],
            body: enquiries.map(e => [e.name, e.phone, e.source || "-", e.date, e.status]),
        });
        doc.save("admission_enquiries.pdf");
        toast("success", "PDF file downloaded");
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Select Criteria Section */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm">
                <CardHeader className="border-b border-muted/50 pb-4">
                    <CardTitle className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                        <Filter className="h-5 w-5 text-indigo-500" />
                        Select Criteria
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 lg:grid-cols-6 gap-4 items-end">
                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Class</label>
                            <div className="relative">
                                <select
                                    className="flex h-10 w-full rounded-lg border border-muted/50 bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer group-hover:border-indigo-200 transition-colors"
                                    value={filters.class_id}
                                    onChange={(e) => setFilters({ ...filters, class_id: e.target.value })}
                                >
                                    <option value="">Select</option>
                                    {classes.map(cls => (
                                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Source</label>
                            <div className="relative">
                                <select
                                    className="flex h-10 w-full rounded-lg border border-muted/50 bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer group-hover:border-indigo-200 transition-colors"
                                    value={filters.source}
                                    onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                                >
                                    <option value="">Select</option>
                                    {sources.map(src => (
                                        <option key={src.id} value={src.name}>{src.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Enquiry From Date</label>
                            <div className="relative">
                                <Input
                                    type="date"
                                    className="h-10 rounded-lg bg-muted/30 border-muted/50"
                                    value={filters.from_date}
                                    onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Enquiry To Date</label>
                            <div className="relative">
                                <Input
                                    type="date"
                                    className="h-10 rounded-lg bg-muted/30 border-muted/50"
                                    value={filters.to_date}
                                    onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Status</label>
                            <div className="relative">
                                <select
                                    className="flex h-10 w-full rounded-lg border border-muted/50 bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer group-hover:border-indigo-200 transition-colors"
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                >
                                    <option value="">Select</option>
                                    <option value="All">All</option>
                                    <option value="Active">Active</option>
                                    <option value="Passive">Passive</option>
                                    <option value="Dead">Dead</option>
                                    <option value="Won">Won</option>
                                    <option value="Lost">Lost</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button variant="gradient" className="h-10 px-8" onClick={fetchEnquiries} disabled={loading}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 text-white mr-2" />}
                                Search
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* List Table */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-muted/50 pb-4">
                    <CardTitle className="text-xl font-bold tracking-tight text-slate-800">Admission Enquiry</CardTitle>
                    <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingEnquiry(null); resetForm(); } }}>
                        <DialogTrigger asChild>
                            <Button variant="gradient" size="sm" className="h-9 px-6">
                                <Plus className="h-4 w-4 mr-1" /> Add
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-5xl p-0 overflow-hidden border-none shadow-2xl">
                            <div className="bg-[#4F39F6] px-6 py-4 flex items-center justify-between">
                                <DialogTitle className="text-xl font-bold text-white">Admission Enquiry</DialogTitle>
                                <button
                                    onClick={() => setIsDialogOpen(false)}
                                    className="text-white/80 hover:text-white transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6 bg-white overflow-y-auto max-h-[80vh]">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Name <span className="text-destructive">*</span></label>
                                        <Input
                                            className="h-11 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-primary/20"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder=""
                                        />
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Phone <span className="text-destructive">*</span></label>
                                        <Input
                                            className="h-11 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-primary/20"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder=""
                                        />
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Email</label>
                                        <Input
                                            className="h-11 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-primary/20"
                                            value={formData.email || ""}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder=""
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Address</label>
                                        <Input
                                            className="h-11 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-primary/20"
                                            value={formData.address || ""}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Description</label>
                                        <Input
                                            className="h-11 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-primary/20"
                                            value={formData.description || ""}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Note</label>
                                        <Input
                                            className="h-11 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-primary/20"
                                            value={formData.note || ""}
                                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Date <span className="text-destructive">*</span></label>
                                        <Input
                                            type="date"
                                            className="h-11 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-primary/20"
                                            value={formData.date || ""}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Next Follow Up Date <span className="text-destructive">*</span></label>
                                        <Input
                                            type="date"
                                            className="h-11 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-primary/20"
                                            value={formData.next_follow_up_date || ""}
                                            onChange={(e) => setFormData({ ...formData, next_follow_up_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Assigned</label>
                                        <div className="relative">
                                            <select
                                                className="flex h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                                                value={formData.assigned || ""}
                                                onChange={(e) => setFormData({ ...formData, assigned: e.target.value })}
                                            >
                                                <option value="">Select</option>
                                                <option value="Staff 1">Staff 1</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6">
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Reference</label>
                                        <div className="relative">
                                            <select
                                                className="flex h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                                                value={formData.reference || ""}
                                                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                            >
                                                <option value="">Select</option>
                                                {references.map(ref => (
                                                    <option key={ref.id} value={ref.name}>{ref.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Source <span className="text-destructive">*</span></label>
                                        <div className="relative">
                                            <select
                                                className="flex h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                                                value={formData.source || ""}
                                                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                            >
                                                <option value="">Select</option>
                                                {sources.map(src => (
                                                    <option key={src.id} value={src.name}>{src.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Class</label>
                                        <div className="relative">
                                            <select
                                                className="flex h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                                                value={formData.class_id || ""}
                                                onChange={(e) => setFormData({ ...formData, class_id: e.target.value ? parseInt(e.target.value) : null })}
                                            >
                                                <option value="">Select</option>
                                                {classes.map(cls => (
                                                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Number Of Child</label>
                                        <Input
                                            type="number"
                                            min="1"
                                            className="h-11 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-primary/20"
                                            value={formData.no_of_child}
                                            onChange={(e) => setFormData({ ...formData, no_of_child: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Status</label>
                                        <div className="relative">
                                            <select
                                                className="flex h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Passive">Passive</option>
                                                <option value="Dead">Dead</option>
                                                <option value="Won">Won</option>
                                                <option value="Lost">Lost</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="bg-slate-50/80 px-6 py-4 border-t border-slate-200">
                                <Button variant="gradient" className="h-10 px-8 rounded-lg font-bold shadow-lg shadow-primary/20" onClick={handleSave} disabled={loading}>
                                    {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                    Save
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
                                placeholder="Search by name or phone"
                                className="pl-10 h-10 rounded-lg bg-muted/30 border-muted/50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                                <IconButton icon={Printer} onClick={() => window.print()} title="Print" />
                                <IconButton icon={CopyIcon} onClick={exportToCopy} title="Copy" />
                                <IconButton icon={TableIcon} onClick={exportToExcel} title="Excel" />
                                <IconButton icon={FileText} onClick={exportToPDF} title="PDF" />
                                <IconButton icon={Download} onClick={exportToExcel} title="Download" />
                                <IconButton icon={Columns} title="Columns" />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-xl border border-muted/50">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-muted/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                <tr>
                                    <Th className="w-10">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-muted/50 text-primary cursor-pointer"
                                            checked={filteredEnquiries.length > 0 && selectedIds.size === filteredEnquiries.length}
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                        />
                                    </Th>
                                    <Th>Name</Th>
                                    <Th>Phone</Th>
                                    <Th>Source</Th>
                                    <Th>Enquiry Date</Th>
                                    <Th>Next Follow Up</Th>
                                    <Th>Status</Th>
                                    <Th className="text-right flex items-center justify-end gap-2">
                                        <span>Action</span>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <button
                                                    disabled={selectedIds.size === 0}
                                                    className={cn(
                                                        "p-1 rounded transition-all shadow-sm active:scale-90",
                                                        selectedIds.size > 0 ? "bg-red-500 text-white hover:bg-red-600" : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                                                    )}
                                                    title="Delete Selected"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently delete {selectedIds.size} selected enquiries.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleBulkDelete} className="bg-red-500 hover:bg-red-600">Delete All</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </Th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-muted/30">
                                {filteredEnquiries.length > 0 ? (
                                    filteredEnquiries.map((item) => (
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
                                            <Td className="text-slate-600 font-medium">{item.source || "-"}</Td>
                                            <Td className="text-slate-600 font-medium">{item.date ? item.date.split("T")[0] : "-"}</Td>
                                            <Td className="text-slate-600 font-medium">{item.next_follow_up_date ? item.next_follow_up_date.split("T")[0] : "-"}</Td>
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
                                                    <ActionBtn icon={Phone} className="bg-green-500" title="Call" />
                                                    <ActionBtn icon={Pencil} className="bg-indigo-500" onClick={() => handleEdit(item)} title="Edit" />
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <ActionBtn icon={X} className="bg-red-500" title="Delete" />
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This will permanently delete the enquiry for "{item.name}".
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
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
                                            {loading ? <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /> : "No enquiries found"}
                                        </Td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground font-medium">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                            Showing {filteredEnquiries.length} entries
                        </p>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all">
                                <ChevronDown className="h-4 w-4 rotate-90" />
                            </Button>
                            <Button className="h-8 w-8 rounded-lg border-none p-0 text-white font-bold active:scale-95 transition-all shadow-md shadow-orange-500/10 bg-gradient-to-br from-[#FF9800] to-[#4F39F6]">1</Button>
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all">
                                <ChevronDown className="h-4 w-4 -rotate-90" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
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

function CopyIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("lucide lucide-copy", className)}>
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
    );
}
