"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Search, Plus, Pencil, Copy, FileSpreadsheet, FileBox, FileText, Printer,
    CheckCircle2, Loader2, Calendar, CalendarCheck, Filter, XCircle, Eye, Trash2,
    Clock, Check, X, Users, AlertCircle, FileCheck, FileX, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useImageUrl } from "@/lib/image-url";
import { useTranslation } from "@/hooks/use-translation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
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
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { cn } from "@/lib/utils";

interface LeaveRequest {
    id: number;
    user: {
        id: number;
        name: string;
        admission_no: string;
        school_class: { id?: number; name: string };
        section: { id?: number; name: string };
        avatar?: string | null;
    };
    leave_type: { id?: number; name: string };
    apply_date: string;
    leave_from: string;
    leave_to: string;
    days: number;
    status: "Approved" | "Disapproved" | "Pending";
    admin_remark: string;
    reason: string;
    attachment?: string;
}

interface SchoolClass {
    id: number;
    name: string;
    sections?: { id: number; name: string }[];
}

function TableSkeleton({ cols }: { cols: number }) {
    return (
        <>
            {Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-3 px-4">
                            <Skeleton className="h-4 rounded" style={{ width: `${55 + ((i * 3 + j * 7) % 35)}%` }} />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export default function ApproveLeavePage() {
    const getImageUrl = useImageUrl();
    const { t } = useTranslation();
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [sections, setSections] = useState<{ id: number; name: string }[]>([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");

    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [rowsPerPage, setRowsPerPage] = useState("50");

    // Review Status Modal
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
    const [adminRemark, setAdminRemark] = useState("");
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // Delete Dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [leaveToDelete, setLeaveToDelete] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Add / Edit Leave Modal
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [leaveTypes, setLeaveTypes] = useState<{ id: number; name?: string }[]>([]);
    const [newLeaveClass, setNewLeaveClass] = useState("");
    const [newLeaveSection, setNewLeaveSection] = useState("");
    const [newLeaveSections, setNewLeaveSections] = useState<{ id: number; name: string }[]>([]);
    const [students, setStudents] = useState<{ id: number; name?: string; last_name?: string }[]>([]);
    const [newLeaveStudent, setNewLeaveStudent] = useState("");
    const [newLeaveType, setNewLeaveType] = useState("");
    const [newLeaveApplyDate, setNewLeaveApplyDate] = useState(new Date().toISOString().split('T')[0]);
    const [newLeaveFromDate, setNewLeaveFromDate] = useState("");
    const [newLeaveToDate, setNewLeaveToDate] = useState("");
    const [newLeaveReason, setNewLeaveReason] = useState("");
    const [newLeaveStatus, setNewLeaveStatus] = useState("Pending");
    const [newLeaveAttachment, setNewLeaveAttachment] = useState<File | null>(null);
    const [savingLeave, setSavingLeave] = useState(false);
    const [editingLeaveId, setEditingLeaveId] = useState<number | null>(null);

    const fetchClasses = async () => {
        try {
            const response = await api.get("/academics/classes?no_paginate=true");
            if (response.data.success || response.data.data) {
                setClasses(response.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching classes:", error);
        }
    };

    const fetchLeaveTypes = async () => {
        try {
            const response = await api.get("/hr/leave-type");
            if (response.data.success || response.data.data) {
                setLeaveTypes(response.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching leave types:", error);
        }
    };

    const fetchLeaves = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/attendance/approve-leave", {
                params: {
                    school_class_id: selectedClass || undefined,
                    section_id: selectedSection || undefined,
                    search: searchTerm || undefined
                }
            });
            if (response.data.success || response.data.data) {
                setLeaves(response.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching leaves:", error);
            toast.error(t("failed_to_load_leave_requests") || "Failed to load leave records");
        } finally {
            setLoading(false);
        }
    }, [selectedClass, selectedSection, searchTerm, t]);

    useEffect(() => {
        fetchClasses();
        fetchLeaves();
        fetchLeaveTypes();
    }, [fetchLeaves]);

    useEffect(() => {
        if (selectedClass) {
            const cls = classes.find(c => c.id.toString() === selectedClass);
            setSections(cls?.sections || []);
            setSelectedSection("");
        } else {
            setSections([]);
            setSelectedSection("");
        }
    }, [selectedClass, classes]);

    useEffect(() => {
        if (newLeaveClass) {
            const cls = classes.find(c => c.id.toString() === newLeaveClass);
            setNewLeaveSections(cls?.sections || []);
            if (!editingLeaveId) {
                setNewLeaveSection("");
                setNewLeaveStudent("");
                setStudents([]);
            }
        }
    }, [newLeaveClass, classes, editingLeaveId]);

    useEffect(() => {
        if (newLeaveClass && newLeaveSection) {
            const fetchClassStudents = async () => {
                try {
                    const response = await api.get("/students", {
                        params: { school_class_id: newLeaveClass, section_id: newLeaveSection }
                    });
                    if (response.data.success || response.data.data) {
                        const rawData = response.data.data?.data || response.data.data;
                        if (Array.isArray(rawData)) {
                            setStudents(rawData);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching students:", error);
                }
            };
            fetchClassStudents();
        }
    }, [newLeaveClass, newLeaveSection]);

    const handleUpdateStatus = async (status: "Approved" | "Disapproved") => {
        if (!selectedLeave) return;

        setUpdatingStatus(true);
        try {
            const response = await api.put(`/attendance/approve-leave/${selectedLeave.id}/status`, {
                status,
                admin_remark: adminRemark
            });
            if (response.data.success || response.status === 200) {
                toast.success(status === "Approved" ? "Leave request approved successfully" : "Leave request marked as disapproved");
                setStatusDialogOpen(false);
                fetchLeaves();
            }
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status");
        } finally {
            setUpdatingStatus(false);
        }
    };

    const confirmDelete = async () => {
        if (!leaveToDelete) return;
        setDeleting(true);
        try {
            const response = await api.delete(`/attendance/approve-leave/${leaveToDelete}`);
            if (response.data.success || response.status === 200) {
                toast.success("Leave record removed successfully");
                fetchLeaves();
            }
        } catch (error) {
            console.error("Error deleting leave:", error);
            toast.error("Failed to delete leave request");
        } finally {
            setDeleting(false);
            setDeleteDialogOpen(false);
            setLeaveToDelete(null);
        }
    };

    const handleSaveLeave = async () => {
        if (!newLeaveStudent || !newLeaveType || !newLeaveApplyDate || !newLeaveFromDate || !newLeaveToDate || !newLeaveStatus) {
            toast.error("Please fill all required fields");
            return;
        }

        // Pre-check existing leave range
        if (!editingLeaveId) {
            try {
                const checkRes = await api.get("/attendance/approve-leave/check", {
                    params: {
                        user_id: newLeaveStudent,
                        leave_from: newLeaveFromDate,
                        leave_to: newLeaveToDate,
                    },
                });
                if (checkRes.data?.data?.exists) {
                    toast.error("Student already has an overlapping leave application");
                    return;
                }
            } catch {
                // proceed
            }
        }

        setSavingLeave(true);
        try {
            const formData = new FormData();
            formData.append('user_id', newLeaveStudent);
            formData.append('leave_type_id', newLeaveType);
            formData.append('apply_date', newLeaveApplyDate);
            formData.append('leave_from', newLeaveFromDate);
            formData.append('leave_to', newLeaveToDate);
            formData.append('status', newLeaveStatus);
            if (newLeaveReason) formData.append('reason', newLeaveReason);
            if (newLeaveAttachment) formData.append('attachment', newLeaveAttachment);

            let response;
            if (editingLeaveId) {
                formData.append('_method', 'PUT');
                response = await api.post(`/attendance/approve-leave/${editingLeaveId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                response = await api.post("/attendance/approve-leave", formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            if (response.data.success || response.status === 200 || response.status === 201) {
                toast.success(editingLeaveId ? "Leave request updated successfully" : "Leave request created successfully");
                setAddDialogOpen(false);
                resetForm();
                fetchLeaves();
            }
        } catch (error) {
            console.error("Error saving leave:", error);
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message || "Failed to submit leave request");
        } finally {
            setSavingLeave(false);
        }
    };

    const resetForm = () => {
        setEditingLeaveId(null);
        setNewLeaveClass("");
        setNewLeaveSection("");
        setNewLeaveStudent("");
        setNewLeaveType("");
        setNewLeaveApplyDate(new Date().toISOString().split('T')[0]);
        setNewLeaveFromDate("");
        setNewLeaveToDate("");
        setNewLeaveReason("");
        setNewLeaveStatus("Pending");
        setNewLeaveAttachment(null);
    };

    const handleEdit = (item: LeaveRequest) => {
        setEditingLeaveId(item.id);
        const classId = item.user.school_class?.id?.toString() || "";
        const sectionId = item.user.section?.id?.toString() || "";
        setNewLeaveClass(classId);
        const cls = classes.find(c => c.id.toString() === classId);
        if (cls?.sections) setNewLeaveSections(cls.sections);
        setNewLeaveSection(sectionId);
        setNewLeaveStudent(item.user.id.toString());
        setNewLeaveType(item.leave_type.id?.toString() || "");
        setNewLeaveApplyDate(item.apply_date?.substring(0, 10) || "");
        setNewLeaveFromDate(item.leave_from?.substring(0, 10) || "");
        setNewLeaveToDate(item.leave_to?.substring(0, 10) || "");
        setNewLeaveReason(item.reason || "");
        setNewLeaveStatus(item.status);
        setAddDialogOpen(true);
    };

    // Filtered list
    const filteredLeaves = useMemo(() => {
        return leaves.filter((item) => {
            if (statusFilter !== "all" && item.status.toLowerCase() !== statusFilter.toLowerCase()) {
                return false;
            }
            if (!searchTerm) return true;
            const lower = searchTerm.toLowerCase();
            return (
                (item.user?.name || "").toLowerCase().includes(lower) ||
                (item.user?.admission_no || "").toLowerCase().includes(lower) ||
                (item.leave_type?.name || "").toLowerCase().includes(lower) ||
                (item.reason || "").toLowerCase().includes(lower)
            );
        });
    }, [leaves, searchTerm, statusFilter]);

    // Statistics
    const stats = useMemo(() => {
        const total = leaves.length;
        const pending = leaves.filter(l => l.status === "Pending").length;
        const approved = leaves.filter(l => l.status === "Approved").length;
        const disapproved = leaves.filter(l => l.status === "Disapproved").length;
        return { total, pending, approved, disapproved };
    }, [leaves]);

    // Export helpers
    const exportToCopy = () => {
        if (filteredLeaves.length === 0) { toast.error("No records to copy"); return; }
        const text = [
            "Student\tAdmission No\tClass\tLeave Type\tApply Date\tDuration\tDays\tStatus\tReason",
            ...filteredLeaves.map((r) =>
                `${r.user.name}\t${r.user.admission_no}\t${r.user.school_class?.name} (${r.user.section?.name})\t${r.leave_type?.name}\t${r.apply_date}\t${r.leave_from} to ${r.leave_to}\t${r.days}\t${r.status}\t${r.reason || '-'}`
            )
        ].join("\n");
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    const exportToExcel = (isCsv = false) => {
        if (filteredLeaves.length === 0) { toast.error("No records to export"); return; }
        const mapped = filteredLeaves.map((r) => ({
            "Student Name": r.user.name,
            "Admission No": r.user.admission_no,
            "Class": `${r.user.school_class?.name || ''} (${r.user.section?.name || ''})`,
            "Leave Type": r.leave_type?.name,
            "Apply Date": r.apply_date,
            "From": r.leave_from,
            "To": r.leave_to,
            "Days": r.days,
            "Status": r.status,
            "Reason": r.reason || "-",
            "Admin Remark": r.admin_remark || "-"
        }));
        const ws = XLSX.utils.json_to_sheet(mapped);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Leave Requests");
        if (isCsv) { XLSX.writeFile(wb, "leave_requests.csv", { bookType: "csv" }); toast.success("CSV downloaded"); }
        else { XLSX.writeFile(wb, "leave_requests.xlsx"); toast.success("Excel file downloaded"); }
    };

    const exportToPDF = () => {
        if (filteredLeaves.length === 0) { toast.error("No records to export"); return; }
        const doc = new jsPDF("landscape");
        const head = [["Student", "Class", "Leave Type", "Apply Date", "Duration", "Days", "Status"]];
        const body = filteredLeaves.map((r) => [
            r.user.name,
            `${r.user.school_class?.name || ''} (${r.user.section?.name || ''})`,
            r.leave_type?.name || '',
            r.apply_date?.substring(0, 10) || '',
            `${r.leave_from?.substring(0, 10)} - ${r.leave_to?.substring(0, 10)}`,
            r.days,
            r.status
        ]);
        autoTable(doc, { head, body, theme: "grid" });
        doc.save("leave_requests.pdf");
        toast.success("PDF downloaded");
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 py-4 sm:py-6 font-sans">
            {/* Master Header Banner */}
            <div className="rounded-2xl border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] via-[#F8F9FE] to-[#EFF0FD]">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-md">
                            <CalendarCheck className="h-6 w-6" />
                        </span>
                        <div>
                            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-800 leading-none flex items-center gap-2">
                                Student Leave Approvals & Absence Permissions
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                                    Leave Management
                                </span>
                            </h1>
                            <p className="text-[11px] text-gray-500 mt-1">
                                Review, approve, disapprove, and record student leave applications and excused absence permissions.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                            onClick={() => { resetForm(); setAddDialogOpen(true); }}
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white px-5 h-9 text-xs font-bold rounded-lg shadow-sm active:scale-95 flex items-center gap-1.5 border-0 cursor-pointer"
                        >
                            <Plus className="h-4 w-4" />
                            {t("apply_leave") || "Record Student Leave"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Criteria Selection Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm rounded-2xl overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center justify-between gap-2.5 px-5 py-3.5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                            <Filter className="h-4 w-4" />
                        </span>
                        <CardTitle className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
                            {t("select_criteria") || "Filter Selection Criteria"}
                        </CardTitle>
                    </div>
                </CardHeader>

                <CardContent className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                        {/* Class */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">{t("class") || "Class"}</Label>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger className="h-9 text-xs bg-white border-slate-200 focus:ring-indigo-500 rounded-lg">
                                    <SelectValue placeholder="All Classes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Classes</SelectItem>
                                    {classes.map(cls => (
                                        <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Section */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">{t("section") || "Section"}</Label>
                            <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass || selectedClass === "all"}>
                                <SelectTrigger className="h-9 text-xs bg-white border-slate-200 focus:ring-indigo-500 rounded-lg">
                                    <SelectValue placeholder="All Sections" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sections</SelectItem>
                                    {sections.map(sec => (
                                        <SelectItem key={sec.id} value={sec.id.toString()}>{sec.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Search Button */}
                        <div>
                            <Button
                                onClick={fetchLeaves}
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white h-9 text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer border-0"
                            >
                                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                                {t("search") || "Filter Requests"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Leave Metrics Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <Card className="border-[0.5px] border-gray-200 shadow-xs rounded-2xl bg-white p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                            <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Applications</p>
                            <p className="text-lg font-extrabold text-slate-800">{stats.total}</p>
                        </div>
                    </div>
                </Card>

                <Card className="border-[0.5px] border-gray-200 shadow-xs rounded-2xl bg-white p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Review</p>
                            <p className="text-lg font-extrabold text-amber-700">{stats.pending}</p>
                        </div>
                    </div>
                </Card>

                <Card className="border-[0.5px] border-gray-200 shadow-xs rounded-2xl bg-white p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                            <FileCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Approved Leaves</p>
                            <p className="text-lg font-extrabold text-emerald-700">{stats.approved}</p>
                        </div>
                    </div>
                </Card>

                <Card className="border-[0.5px] border-gray-200 shadow-xs rounded-2xl bg-white p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                            <FileX className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Disapproved</p>
                            <p className="text-lg font-extrabold text-rose-700">{stats.disapproved}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Leave Requests Table Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm rounded-2xl overflow-hidden pt-0">
                {/* Table Header / Toolbar */}
                <CardHeader className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                            <Users className="h-4 w-4" />
                        </span>
                        <CardTitle className="text-sm font-bold text-slate-800">
                            Leave Requests Ledger ({filteredLeaves.length})
                        </CardTitle>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-8 w-32 text-xs bg-white border-slate-200">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="pending">Pending Only</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="disapproved">Disapproved</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Search Input */}
                        <div className="relative w-full sm:w-56">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <Input
                                placeholder="Search student or admission..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 h-8 text-xs bg-white border-slate-200 focus-visible:ring-indigo-500 rounded-lg shadow-none"
                            />
                        </div>

                        {/* Per page */}
                        <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
                            <SelectTrigger className="h-8 w-20 text-xs bg-white border-slate-200">
                                <SelectValue placeholder="50" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Multi-format export toolbar */}
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
                            <button
                                type="button"
                                onClick={exportToCopy}
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
                                    <TableHead className="py-3 px-4 text-xs font-bold text-slate-700 min-w-[200px]">Student Profile</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-slate-700">Class / Section</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-slate-700">Leave Category</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-slate-700">Apply Date</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-slate-700 min-w-[180px]">Leave Duration</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-slate-700">Status</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-slate-700">Doc</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-slate-700 text-right pr-6 min-w-[120px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-slate-100">
                                {loading ? (
                                    <TableSkeleton cols={8} />
                                ) : filteredLeaves.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-20 text-slate-400">
                                            <AlertCircle className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                                            <p className="text-xs font-bold text-slate-600">No leave requests found</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">Click &quot;Record Student Leave&quot; above to submit an excused absence.</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLeaves.slice(0, parseInt(rowsPerPage, 10)).map((item) => (
                                        <TableRow
                                            key={item.id}
                                            className="hover:bg-indigo-50/30 transition-colors group"
                                        >
                                            {/* Student Profile */}
                                            <TableCell className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 border border-slate-200 shadow-2xs">
                                                        <AvatarImage src={getImageUrl(item.user.avatar)} className="object-cover" />
                                                        <AvatarFallback className="text-[10px] font-bold bg-indigo-50 text-indigo-700">
                                                            {item.user.name.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors">
                                                            {item.user.name}
                                                        </p>
                                                        <span className="text-[10px] font-mono text-slate-400">
                                                            Adm: {item.user.admission_no}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Class / Section */}
                                            <TableCell className="py-3 px-4 text-xs font-semibold text-slate-700">
                                                <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                                                    {item.user.school_class?.name || "Class"} ({item.user.section?.name || "A"})
                                                </span>
                                            </TableCell>

                                            {/* Leave Type */}
                                            <TableCell className="py-3 px-4">
                                                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 px-2.5 py-0.5 text-[10px] font-bold rounded-md">
                                                    {item.leave_type?.name || "General Leave"}
                                                </Badge>
                                            </TableCell>

                                            {/* Apply Date */}
                                            <TableCell className="py-3 px-4 text-xs font-medium text-slate-600">
                                                <span className="font-mono text-[11px]">
                                                    {item.apply_date ? new Date(item.apply_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : "—"}
                                                </span>
                                            </TableCell>

                                            {/* Duration */}
                                            <TableCell className="py-3 px-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                                                        <Calendar className="h-3 w-3 text-indigo-500" />
                                                        <span>
                                                            {item.leave_from ? new Date(item.leave_from).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) : ""} - {item.leave_to ? new Date(item.leave_to).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) : ""}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-indigo-600">
                                                        {item.days} {item.days === 1 ? "day" : "days"} duration
                                                    </span>
                                                </div>
                                            </TableCell>

                                            {/* Status Badge */}
                                            <TableCell className="py-3 px-4">
                                                <span className={cn(
                                                    "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                                                    item.status === "Approved"
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                        : item.status === "Disapproved"
                                                            ? "bg-rose-50 text-rose-700 border-rose-200"
                                                            : "bg-amber-50 text-amber-700 border-amber-200"
                                                )}>
                                                    {item.status}
                                                </span>
                                            </TableCell>

                                            {/* Attachment */}
                                            <TableCell className="py-3 px-4">
                                                {item.attachment ? (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => window.open(getImageUrl(item.attachment), '_blank')}
                                                        className="h-7 w-7 p-0 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                                        title="View Attachment Document"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                ) : (
                                                    <span className="text-slate-300 text-xs">—</span>
                                                )}
                                            </TableCell>

                                            {/* Action Buttons */}
                                            <TableCell className="py-3 px-4 text-right pr-6">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {item.status === "Pending" && (
                                                        <Button
                                                            onClick={() => {
                                                                setSelectedLeave(item);
                                                                setAdminRemark(item.admin_remark || "");
                                                                setStatusDialogOpen(true);
                                                            }}
                                                            size="sm"
                                                            className="h-7 px-2.5 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white rounded-lg text-[10px] font-bold shadow-2xs transition-all active:scale-95 border-0"
                                                        >
                                                            Review
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleEdit(item)}
                                                        className="h-7 w-7 p-0 border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 rounded-lg"
                                                        title="Edit Leave Request"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setLeaveToDelete(item.id);
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                        className="h-7 w-7 p-0 border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 rounded-lg"
                                                        title="Delete Leave Request"
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
            </Card>

            {/* Review Status Dialog */}
            <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                <DialogContent className="max-w-md rounded-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <CalendarCheck className="h-5 w-5 text-indigo-600" />
                            Review Leave Application
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Evaluate student excuse details and record institutional approval.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedLeave && (
                        <div className="space-y-3.5 py-2 text-xs">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Student</p>
                                    <p className="font-bold text-slate-800">{selectedLeave.user.name}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Class & Section</p>
                                    <p className="font-semibold text-slate-700">{selectedLeave.user.school_class?.name} ({selectedLeave.user.section?.name})</p>
                                </div>
                                <div className="col-span-2 pt-1 border-t border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Absence Reason</p>
                                    <p className="italic text-slate-600 mt-0.5">&ldquo;{selectedLeave.reason || "No specific reason provided"}&rdquo;</p>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700">Official Admin Remark</Label>
                                <Textarea
                                    placeholder="Enter administrative comments or approval conditions..."
                                    value={adminRemark}
                                    onChange={(e) => setAdminRemark(e.target.value)}
                                    rows={3}
                                    className="text-xs bg-white border-slate-200"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => handleUpdateStatus("Disapproved")}
                            disabled={updatingStatus}
                            className="text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 rounded-lg gap-1"
                        >
                            {updatingStatus ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                            Disapprove
                        </Button>
                        <Button
                            onClick={() => handleUpdateStatus("Approved")}
                            disabled={updatingStatus}
                            className="text-xs font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white rounded-lg shadow-sm gap-1 border-0"
                        >
                            {updatingStatus ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                            Approve Leave
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add / Edit Leave Dialog */}
            <Dialog open={addDialogOpen} onOpenChange={(open) => {
                setAddDialogOpen(open);
                if (!open) resetForm();
            }}>
                <DialogContent className="max-w-xl rounded-2xl p-6 max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Plus className="h-5 w-5 text-indigo-600" />
                            {editingLeaveId ? "Edit Student Leave Record" : "Record New Student Leave Application"}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Submit student excuse permission details to the attendance ledger.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700">Class <span className="text-rose-500">*</span></Label>
                                <Select value={newLeaveClass} onValueChange={setNewLeaveClass}>
                                    <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                                        <SelectValue placeholder="Select Class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map(cls => (
                                            <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700">Section <span className="text-rose-500">*</span></Label>
                                <Select value={newLeaveSection} onValueChange={setNewLeaveSection} disabled={!newLeaveClass}>
                                    <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                                        <SelectValue placeholder="Select Section" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {newLeaveSections.map(sec => (
                                            <SelectItem key={sec.id} value={sec.id.toString()}>{sec.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700">Student <span className="text-rose-500">*</span></Label>
                                <Select value={newLeaveStudent} onValueChange={setNewLeaveStudent} disabled={!newLeaveSection}>
                                    <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                                        <SelectValue placeholder="Select Student" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {students.map(s => (
                                            <SelectItem key={s.id} value={s.id.toString()}>{s.name} {s.last_name || ''}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700">Leave Type <span className="text-rose-500">*</span></Label>
                                <Select value={newLeaveType} onValueChange={setNewLeaveType}>
                                    <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                                        <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {leaveTypes.map(lt => (
                                            <SelectItem key={lt.id} value={lt.id.toString()}>{lt.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700">Apply Date <span className="text-rose-500">*</span></Label>
                                <Input
                                    type="date"
                                    value={newLeaveApplyDate}
                                    onChange={(e) => setNewLeaveApplyDate(e.target.value)}
                                    className="h-9 text-xs bg-white border-slate-200"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700">Leave From <span className="text-rose-500">*</span></Label>
                                <Input
                                    type="date"
                                    value={newLeaveFromDate}
                                    onChange={(e) => setNewLeaveFromDate(e.target.value)}
                                    className="h-9 text-xs bg-white border-slate-200"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700">Leave To <span className="text-rose-500">*</span></Label>
                                <Input
                                    type="date"
                                    value={newLeaveToDate}
                                    onChange={(e) => setNewLeaveToDate(e.target.value)}
                                    className="h-9 text-xs bg-white border-slate-200"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">Reason for Absence</Label>
                            <Textarea
                                placeholder="Explain reason for leave application..."
                                value={newLeaveReason}
                                onChange={(e) => setNewLeaveReason(e.target.value)}
                                rows={2}
                                className="text-xs bg-white border-slate-200"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700">Initial Status <span className="text-rose-500">*</span></Label>
                                <Select value={newLeaveStatus} onValueChange={setNewLeaveStatus}>
                                    <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="Approved">Approved</SelectItem>
                                        <SelectItem value="Disapproved">Disapproved</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700">Attach Document</Label>
                                <Input
                                    type="file"
                                    onChange={(e) => setNewLeaveAttachment(e.target.files?.[0] || null)}
                                    className="h-9 text-xs bg-white border-slate-200 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-slate-100"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setAddDialogOpen(false)} className="text-xs">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveLeave}
                            disabled={savingLeave}
                            className="text-xs font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white rounded-lg shadow-sm gap-1 border-0"
                        >
                            {savingLeave ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                            {editingLeaveId ? "Update Leave" : "Submit Leave Record"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="max-w-md rounded-2xl bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-rose-600" />
                            Delete Leave Request?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-slate-500">
                            This will permanently remove the student&apos;s leave record and revert their absence mark.
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
