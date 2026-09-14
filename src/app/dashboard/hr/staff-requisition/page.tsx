"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
    Card,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    Plus,
    Search,
    FileText,
    FileSpreadsheet,
    Printer,
    Copy,
    MoreVertical,
    CheckCircle,
    XCircle,
    Clock,
    Building2,
    Eye,
    Edit,
    Trash2,
    Briefcase,
    CheckCheck,
    Ban
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import {
    StaffRequisition,
    StaffRequisitionDialog,
    getStoredRequisitions,
    saveRequisitionToStorage,
    deleteRequisitionFromStorage
} from "@/components/hr/staff-requisition-dialog";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function StaffRequisitionPage() {
    const { t } = useTranslation();
    const pathname = usePathname() || "";

    // Sub-branch detection
    const branchMatch = pathname.match(/^\/br\/([^\/]+)/);
    const isSubBranch = !!branchMatch && branchMatch[1] !== "main";
    const currentBranchSlug = branchMatch && branchMatch[1] !== "main" ? branchMatch[1] : null;

    const getInitialRequisitions = useCallback(() => {
        const stored = getStoredRequisitions();
        if (isSubBranch && currentBranchSlug) {
            return stored.filter(
                (r) => r.branch_slug === currentBranchSlug || r.branch_name.toLowerCase().includes(currentBranchSlug.toLowerCase())
            );
        }
        return stored;
    }, [isSubBranch, currentBranchSlug]);

    const [requisitions, setRequisitions] = useState<StaffRequisition[]>([]);
    const [loading] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [branchFilter, setBranchFilter] = useState("all");

    // Dialogs
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editingRequisition, setEditingRequisition] = useState<StaffRequisition | null>(null);
    const [viewingRequisition, setViewingRequisition] = useState<StaffRequisition | null>(null);
    const [deleteRequisition, setDeleteRequisition] = useState<StaffRequisition | null>(null);

    // Action Dialogs (Approve / Reject)
    const [approveDialogReq, setApproveDialogReq] = useState<StaffRequisition | null>(null);
    const [approvalRemarks, setApprovalRemarks] = useState("");

    const [rejectDialogReq, setRejectDialogReq] = useState<StaffRequisition | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");

    const gradientBtn = "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#e68900] hover:to-[#4f46e5] text-white shadow-md shadow-indigo-500/20";

    const loadData = useCallback(() => {
        setRequisitions(getInitialRequisitions());
    }, [getInitialRequisitions]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setRequisitions(getInitialRequisitions());
        }, 0);
        return () => clearTimeout(timer);
    }, [getInitialRequisitions]);

    // Filtered data
    const filteredRequisitions = requisitions.filter((req) => {
        const matchesSearch =
            !searchQuery.trim() ||
            req.requisition_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.branch_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.reason.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "all" || req.status === statusFilter;
        const matchesPriority = priorityFilter === "all" || req.priority === priorityFilter;
        const matchesBranch = branchFilter === "all" || req.branch_name === branchFilter;

        return matchesSearch && matchesStatus && matchesPriority && matchesBranch;
    });

    // Unique branches list for filter
    const uniqueBranches = Array.from(new Set(requisitions.map((r) => r.branch_name)));

    // Counts
    const totalCount = requisitions.length;
    const pendingCount = requisitions.filter((r) => r.status === "Pending").length;
    const approvedCount = requisitions.filter((r) => r.status === "Approved").length;
    const rejectedCount = requisitions.filter((r) => r.status === "Rejected").length;

    // Handle Approve
    const handleApproveConfirm = () => {
        if (!approveDialogReq) return;
        const updated: StaffRequisition = {
            ...approveDialogReq,
            status: "Approved",
            approval_remarks: approvalRemarks.trim() || "Approved by Central HR Administration.",
            action_date: new Date().toISOString()
        };
        saveRequisitionToStorage(updated);
        toast.success(t("requisition_approved_success") || "Requisition has been approved successfully!");
        setApproveDialogReq(null);
        setApprovalRemarks("");
        loadData();
    };

    // Handle Reject
    const handleRejectConfirm = () => {
        if (!rejectDialogReq) return;
        if (!rejectionReason.trim()) {
            toast.error(t("please_enter_reason") || "Please provide a reason for rejecting this requisition.");
            return;
        }
        const updated: StaffRequisition = {
            ...rejectDialogReq,
            status: "Rejected",
            rejection_reason: rejectionReason.trim(),
            action_date: new Date().toISOString()
        };
        saveRequisitionToStorage(updated);
        toast.success(t("requisition_rejected_success") || "Requisition has been rejected!");
        setRejectDialogReq(null);
        setRejectionReason("");
        loadData();
    };

    // Handle Delete
    const handleDeleteConfirm = () => {
        if (!deleteRequisition) return;
        if (isSubBranch && deleteRequisition.status === "Approved") {
            toast.error(t("cannot_delete_approved_requisition") || "Approved requisitions cannot be deleted.");
            setDeleteRequisition(null);
            return;
        }
        deleteRequisitionFromStorage(deleteRequisition.id);
        toast.success(t("requisition_deleted_success") || "Requisition deleted successfully!");
        setDeleteRequisition(null);
        loadData();
    };

    // Export Excel
    const handleExportExcel = () => {
        const exportData = filteredRequisitions.map((r) => ({
            "Requisition ID": r.requisition_no,
            "Branch": r.branch_name,
            "Role": r.role,
            "Department": r.department,
            "Vacancies": r.vacancies,
            "Priority": r.priority,
            "Employment Type": r.employment_type,
            "Expected Joining Date": r.expected_joining_date,
            "Status": r.status,
            "Reason": r.reason,
            "Date Submitted": new Date(r.created_at).toLocaleDateString()
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Requisitions");
        XLSX.writeFile(wb, `Staff_Requisitions_${new Date().toISOString().split("T")[0]}.xlsx`);
        toast.success("Excel sheet exported successfully!");
    };

    // Export PDF
    const handleExportPDF = () => {
        const doc = new jsPDF("landscape");
        doc.text("Staff Requisition List", 14, 15);
        const tableBody = filteredRequisitions.map((r) => [
            r.requisition_no,
            r.branch_name,
            r.role,
            r.department,
            r.vacancies.toString(),
            r.priority,
            r.expected_joining_date,
            r.status,
            new Date(r.created_at).toLocaleDateString()
        ]);
        autoTable(doc, {
            head: [["Req ID", "Branch", "Role", "Department", "Vacancies", "Priority", "Joining Date", "Status", "Date"]],
            body: tableBody,
            startY: 20
        });
        doc.save(`Staff_Requisitions_${new Date().toISOString().split("T")[0]}.pdf`);
        toast.success("PDF document exported successfully!");
    };

    // Export Copy
    const handleCopy = () => {
        const text = filteredRequisitions
            .map((r) => `${r.requisition_no} | ${r.branch_name} | ${r.role} | ${r.department} | Vacancies: ${r.vacancies} | ${r.status}`)
            .join("\n");
        navigator.clipboard.writeText(text);
        toast.success("Requisitions copied to clipboard!");
    };

    // Print
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#FFF5E7] via-[#F8F9FE] to-[#EFF0FD] p-6 rounded-2xl border border-indigo-100/80 shadow-[0_4px_24px_rgb(99,102,241,0.06)] relative overflow-hidden">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF9800] via-[#F59E0B] to-[#6366F1] flex items-center justify-center text-white shadow-lg shadow-orange-500/25 ring-4 ring-white">
                        <Briefcase className="h-7 w-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">
                            {t("staff_requisition") || "Staff Requisition"}
                        </h1>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">
                            {isSubBranch
                                ? (t("branch_requisition_desc") || "Submit and manage staff hiring requests for this branch to Main Branch HR")
                                : (t("central_requisition_desc") || "Review, approve, and manage staff requisitions submitted by branches")}
                        </p>
                    </div>
                </div>

                <Button
                    onClick={() => {
                        setEditingRequisition(null);
                        setCreateDialogOpen(true);
                    }}
                    className={`${gradientBtn} gap-2 rounded-xl h-11 px-6 text-sm font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 transition-all`}
                >
                    <Plus className="h-4 w-4 stroke-[3]" />
                    <span>{t("new_requisition") || "New Requisition"}</span>
                </Button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Total Requisitions */}
                <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-[#6366F1] via-[#4F46E5] to-[#3730A3] text-white shadow-[0_8px_24px_rgb(99,102,241,0.28)] hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
                    <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform pointer-events-none" />
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-[11px] font-extrabold text-indigo-100 uppercase tracking-wider">{t("total_requisitions") || "TOTAL REQUISITIONS"}</p>
                            <h3 className="text-3xl font-black text-white mt-1.5 drop-shadow-xs">{totalCount}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center border border-white/30 shadow-inner">
                            <Briefcase className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                {/* Pending Requisitions */}
                <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-[#FF9800] via-[#F59E0B] to-[#D97706] text-white shadow-[0_8px_24px_rgb(245,158,11,0.28)] hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
                    <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform pointer-events-none" />
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-[11px] font-extrabold text-amber-100 uppercase tracking-wider">{t("pending_requisitions") || "PENDING REQUISITIONS"}</p>
                            <h3 className="text-3xl font-black text-white mt-1.5 drop-shadow-xs">{pendingCount}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center border border-white/30 shadow-inner">
                            <Clock className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                {/* Approved Requisitions */}
                <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-[#10B981] via-[#059669] to-[#047857] text-white shadow-[0_8px_24px_rgb(16,185,129,0.28)] hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
                    <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform pointer-events-none" />
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-[11px] font-extrabold text-emerald-100 uppercase tracking-wider">{t("approved_requisitions") || "APPROVED REQUISITIONS"}</p>
                            <h3 className="text-3xl font-black text-white mt-1.5 drop-shadow-xs">{approvedCount}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center border border-white/30 shadow-inner">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                {/* Rejected Requisitions */}
                <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-[#F43F5E] via-[#E11D48] to-[#9F1239] text-white shadow-[0_8px_24px_rgb(244,63,94,0.28)] hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
                    <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform pointer-events-none" />
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-[11px] font-extrabold text-rose-100 uppercase tracking-wider">{t("rejected_requisitions") || "REJECTED REQUISITIONS"}</p>
                            <h3 className="text-3xl font-black text-white mt-1.5 drop-shadow-xs">{rejectedCount}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center border border-white/30 shadow-inner">
                            <XCircle className="h-6 w-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter & Table Container */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 rounded-2xl">
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-200/70">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Briefcase className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                {t("requisition_list") || "Requisition List"}
                            </CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {filteredRequisitions.length} {t("staff_requisition") || "Requisitions"}
                            </p>
                        </div>
                    </div>

                    {/* Export Tools */}
                    <div className="flex flex-wrap items-center gap-2">
                        <Button onClick={handleCopy} variant="outline" size="sm" className="h-9 px-3.5 rounded-xl border-gray-200 text-xs font-semibold gap-1.5 hover:bg-indigo-50 hover:text-indigo-600 shadow-xs">
                            <Copy className="h-3.5 w-3.5" />
                            <span>{t("copy") || "Copy"}</span>
                        </Button>
                        <Button onClick={handleExportExcel} variant="outline" size="sm" className="h-9 px-3.5 rounded-xl border-gray-200 text-xs font-semibold gap-1.5 hover:bg-emerald-50 hover:text-emerald-600 shadow-xs">
                            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                            <span>{t("excel") || "Excel"}</span>
                        </Button>
                        <Button onClick={handleExportPDF} variant="outline" size="sm" className="h-9 px-3.5 rounded-xl border-gray-200 text-xs font-semibold gap-1.5 hover:bg-rose-50 hover:text-rose-600 shadow-xs">
                            <FileText className="h-3.5 w-3.5 text-rose-600" />
                            <span>{t("pdf") || "PDF"}</span>
                        </Button>
                        <Button onClick={handlePrint} variant="outline" size="sm" className="h-9 px-3.5 rounded-xl border-gray-200 text-xs font-semibold gap-1.5 hover:bg-indigo-50 hover:text-indigo-600 shadow-xs">
                            <Printer className="h-3.5 w-3.5" />
                            <span>{t("print") || "Print"}</span>
                        </Button>
                    </div>
                </CardHeader>

                {/* Filter Toolbar */}
                <div className="p-5 border-b border-gray-100 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Keyword search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t("search_by_keyword") || "Search requisitions..."}
                            className="h-10 pl-9 rounded-xl border-gray-200 text-xs"
                        />
                    </div>

                    {/* Status filter */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-10 rounded-xl border-gray-200 text-xs">
                            <SelectValue placeholder={t("status") || "Status"} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="all">{t("all_status") || "All Status"}</SelectItem>
                            <SelectItem value="Pending">{t("pending") || "Pending"}</SelectItem>
                            <SelectItem value="Approved">{t("approved") || "Approved"}</SelectItem>
                            <SelectItem value="Rejected">{t("rejected") || "Rejected"}</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Priority filter */}
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="h-10 rounded-xl border-gray-200 text-xs">
                            <SelectValue placeholder={t("priority") || "Priority"} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="all">{t("all_priorities") || "All Priorities"}</SelectItem>
                            <SelectItem value="Low">{t("low_priority") || "Low"}</SelectItem>
                            <SelectItem value="Medium">{t("medium_priority") || "Medium"}</SelectItem>
                            <SelectItem value="High">{t("high_priority") || "High"}</SelectItem>
                            <SelectItem value="Urgent">{t("urgent_priority") || "Urgent"}</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Branch filter (if multi-branch view) */}
                    {!isSubBranch && (
                        <Select value={branchFilter} onValueChange={setBranchFilter}>
                            <SelectTrigger className="h-10 rounded-xl border-gray-200 text-xs">
                                <SelectValue placeholder={t("all_branches") || "All Branches"} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all">{t("all_branches") || "All Branches"}</SelectItem>
                                {uniqueBranches.map((b) => (
                                    <SelectItem key={b} value={b}>{b}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/70 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                                <TableHead className="py-3.5 pl-6">{t("requisition_id") || "Req ID"}</TableHead>
                                {!isSubBranch && <TableHead>{t("campus_branch") || "Branch"}</TableHead>}
                                <TableHead>{t("role") || "Position / Role"}</TableHead>
                                <TableHead>{t("department") || "Department"}</TableHead>
                                <TableHead className="text-center">{t("vacancies") || "Vacancies"}</TableHead>
                                <TableHead className="text-center">{t("priority") || "Priority"}</TableHead>
                                <TableHead>{t("expected_joining_date") || "Joining Date"}</TableHead>
                                <TableHead className="text-center">{t("status") || "Status"}</TableHead>
                                <TableHead>{t("submission_date") || "Submitted"}</TableHead>
                                <TableHead className="text-right pr-6">{t("actions") || "Actions"}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="py-12 text-center text-gray-400 text-xs font-semibold">
                                        Loading requisitions...
                                    </TableCell>
                                </TableRow>
                            ) : filteredRequisitions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="py-16 text-center">
                                        <Briefcase className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-sm font-semibold text-gray-500">{t("no_data_found") || "No requisitions found"}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">Click &quot;New Requisition&quot; to submit a staff hiring request.</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRequisitions.map((req) => (
                                    <TableRow key={req.id} className="hover:bg-gray-50/80 transition-colors border-b border-gray-100">
                                        <TableCell className="py-4 pl-6 font-bold text-xs text-indigo-600">
                                            {req.requisition_no}
                                        </TableCell>

                                        {!isSubBranch && (
                                            <TableCell>
                                                <div className="flex items-center gap-1.5">
                                                    <Building2 className="h-3.5 w-3.5 text-gray-400" />
                                                    <span className="text-xs font-semibold text-gray-800">{req.branch_name}</span>
                                                </div>
                                            </TableCell>
                                        )}

                                        <TableCell>
                                            <div className="font-bold text-xs text-gray-900">{req.role}</div>
                                            <div className="text-[10px] text-gray-400">
                                                {req.employment_type === "Full-Time"
                                                    ? (t("full_time") || "Full-Time")
                                                    : req.employment_type === "Part-Time"
                                                    ? (t("part_time") || "Part-Time")
                                                    : req.employment_type === "Contractual"
                                                    ? (t("contractual") || "Contractual")
                                                    : req.employment_type}
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-xs text-gray-600 font-medium">
                                            {req.department === "Academic"
                                                ? (t("academic_teaching") || "Academic")
                                                : req.department === "Administration"
                                                ? (t("administration") || "Administration")
                                                : req.department === "Accounts & Finance"
                                                ? (t("accounts_finance") || "Accounts & Finance")
                                                : req.department === "IT & Technical"
                                                ? (t("it_technical") || "IT & Technical")
                                                : req.department === "Support Staff"
                                                ? (t("support_staff") || "Support Staff")
                                                : req.department}
                                        </TableCell>

                                        <TableCell className="text-center font-bold text-xs text-gray-800">
                                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white text-xs font-bold shadow-xs">
                                                {req.vacancies}
                                            </span>
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-tight shadow-xs ${
                                                req.priority === "Urgent"
                                                    ? "bg-gradient-to-r from-rose-500 to-red-600 text-white"
                                                    : req.priority === "High"
                                                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                                                    : req.priority === "Medium"
                                                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                                                    : "bg-slate-100 text-slate-700 border border-slate-200"
                                            }`}>
                                                {req.priority === "Urgent"
                                                    ? (t("urgent_priority") || "Urgent")
                                                    : req.priority === "High"
                                                    ? (t("high_priority") || "High")
                                                    : req.priority === "Medium"
                                                    ? (t("medium_priority") || "Medium")
                                                    : (t("low_priority") || "Low")}
                                            </span>
                                        </TableCell>

                                        <TableCell className="text-xs text-gray-600 font-medium">
                                            {req.expected_joining_date}
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-xs ${
                                                req.status === "Approved"
                                                    ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-300"
                                                    : req.status === "Rejected"
                                                    ? "bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border border-rose-300"
                                                    : "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-300"
                                            }`}>
                                                {req.status === "Approved" && <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />}
                                                {req.status === "Rejected" && <XCircle className="h-3.5 w-3.5 text-rose-600" />}
                                                {req.status === "Pending" && <Clock className="h-3.5 w-3.5 text-amber-600" />}
                                                <span>{req.status === "Approved" ? (t("approved") || "Approved") : req.status === "Rejected" ? (t("rejected") || "Rejected") : (t("pending") || "Pending")}</span>
                                            </span>
                                        </TableCell>

                                        <TableCell className="text-xs text-gray-500">
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </TableCell>

                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="h-8 w-8 inline-flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-indigo-600 transition-colors rounded-full shadow-xs">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 shadow-xl border-gray-100">
                                                    {/* View Details - Always Active */}
                                                    <DropdownMenuItem
                                                        onClick={() => setViewingRequisition(req)}
                                                        className="cursor-pointer text-xs font-medium rounded-lg"
                                                    >
                                                        <Eye className="h-4 w-4 mr-2 text-indigo-600" />
                                                        {t("view_details") || "View Details"}
                                                    </DropdownMenuItem>

                                                    {/* Admin Actions: Approve / Reject (Main branch only for pending) */}
                                                    {!isSubBranch && req.status === "Pending" && (
                                                        <>
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setApproveDialogReq(req);
                                                                    setApprovalRemarks("");
                                                                }}
                                                                className="cursor-pointer text-xs font-medium text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 rounded-lg"
                                                            >
                                                                <CheckCheck className="h-4 w-4 mr-2" />
                                                                {t("approve_requisition") || "Approve Requisition"}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setRejectDialogReq(req);
                                                                    setRejectionReason("");
                                                                }}
                                                                className="cursor-pointer text-xs font-medium text-rose-600 focus:text-rose-700 focus:bg-rose-50 rounded-lg"
                                                            >
                                                                <Ban className="h-4 w-4 mr-2" />
                                                                {t("reject_requisition") || "Reject Requisition"}
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}

                                                    {/* Edit Action */}
                                                    {(() => {
                                                        const isEditDisabled = isSubBranch && req.status === "Approved";
                                                        return (
                                                            <DropdownMenuItem
                                                                disabled={isEditDisabled}
                                                                onClick={() => {
                                                                    if (isEditDisabled) return;
                                                                    setEditingRequisition(req);
                                                                    setCreateDialogOpen(true);
                                                                }}
                                                                className={`text-xs font-medium rounded-lg ${
                                                                    isEditDisabled
                                                                        ? "opacity-40 cursor-not-allowed text-gray-400 select-none pointer-events-none focus:bg-transparent"
                                                                        : "cursor-pointer text-blue-600 focus:bg-blue-50"
                                                                }`}
                                                            >
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                {t("edit") || "Edit"}
                                                            </DropdownMenuItem>
                                                        );
                                                    })()}

                                                    {/* Delete Action */}
                                                    {(() => {
                                                        const isDeleteDisabled = isSubBranch && req.status === "Approved";
                                                        return (
                                                            <DropdownMenuItem
                                                                disabled={isDeleteDisabled}
                                                                onClick={() => {
                                                                    if (isDeleteDisabled) return;
                                                                    setDeleteRequisition(req);
                                                                }}
                                                                className={`text-xs font-medium rounded-lg ${
                                                                    isDeleteDisabled
                                                                        ? "opacity-40 cursor-not-allowed text-gray-400 select-none pointer-events-none focus:bg-transparent"
                                                                        : "cursor-pointer text-rose-600 focus:text-rose-700 focus:bg-rose-50"
                                                                }`}
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                {t("delete") || "Delete"}
                                                            </DropdownMenuItem>
                                                        );
                                                    })()}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Create / Edit Dialog */}
            <StaffRequisitionDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                editingRequisition={editingRequisition}
                defaultBranchSlug={currentBranchSlug || undefined}
                onSuccess={() => {
                    loadData();
                }}
            />

            {/* View Requisition Details Modal */}
            <Dialog open={!!viewingRequisition} onOpenChange={(open) => !open && setViewingRequisition(null)}>
                <DialogContent className="sm:max-w-[600px] p-0 rounded-3xl overflow-hidden border-muted shadow-2xl">
                    <div className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                                    <Briefcase className="h-5 w-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-lg font-bold text-white">
                                        {viewingRequisition?.role}
                                    </DialogTitle>
                                    <DialogDescription className="text-white/80 text-xs mt-0.5">
                                        {viewingRequisition?.requisition_no} • {viewingRequisition?.branch_name}
                                    </DialogDescription>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                viewingRequisition?.status === "Approved"
                                    ? "bg-emerald-500 text-white"
                                    : viewingRequisition?.status === "Rejected"
                                    ? "bg-rose-500 text-white"
                                    : "bg-amber-400 text-slate-900"
                            }`}>
                                {viewingRequisition?.status}
                            </span>
                        </div>
                    </div>

                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-sm">
                        <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-2xl">
                            <div>
                                <span className="text-[10px] uppercase font-bold text-muted-foreground block">{t("department") || "Department"}</span>
                                <span className="font-semibold text-foreground">{viewingRequisition?.department}</span>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-muted-foreground block">{t("vacancies") || "Vacancies"}</span>
                                <span className="font-semibold text-foreground">{viewingRequisition?.vacancies} Position(s)</span>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-muted-foreground block">{t("priority") || "Priority"}</span>
                                <span className="font-semibold text-foreground">{viewingRequisition?.priority}</span>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-muted-foreground block">{t("expected_joining_date") || "Expected Joining"}</span>
                                <span className="font-semibold text-foreground">{viewingRequisition?.expected_joining_date}</span>
                            </div>
                        </div>

                        {viewingRequisition?.qualification && (
                            <div>
                                <h4 className="text-xs font-bold text-muted-foreground uppercase mb-1">{t("qualification") || "Required Qualifications"}</h4>
                                <p className="text-xs text-foreground bg-muted/20 p-3 rounded-xl border border-muted/50">{viewingRequisition.qualification}</p>
                            </div>
                        )}

                        <div>
                            <h4 className="text-xs font-bold text-muted-foreground uppercase mb-1">{t("justification_notes") || "Hiring Justification / Reason"}</h4>
                            <p className="text-xs text-foreground bg-muted/20 p-3 rounded-xl border border-muted/50 leading-relaxed">{viewingRequisition?.reason}</p>
                        </div>

                        {/* Approval / Rejection Feedback if available */}
                        {viewingRequisition?.approval_remarks && (
                            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
                                <strong className="block font-bold mb-0.5">Central HR Approval Note:</strong>
                                {viewingRequisition.approval_remarks}
                            </div>
                        )}
                        {viewingRequisition?.rejection_reason && (
                            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                                <strong className="block font-bold mb-0.5">Central HR Rejection Reason:</strong>
                                {viewingRequisition.rejection_reason}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-6 pt-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setViewingRequisition(null)}
                            className="rounded-xl h-10 px-5 w-full"
                        >
                            {t("close") || "Close"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Approve Confirmation Dialog */}
            <Dialog open={!!approveDialogReq} onOpenChange={(open) => !open && setApproveDialogReq(null)}>
                <DialogContent className="sm:max-w-[480px] p-6 rounded-3xl border-muted shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-emerald-600 font-bold">
                            <CheckCircle className="h-5 w-5" />
                            {t("approve_requisition") || "Approve Staff Requisition"}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Confirm approval for <strong>{approveDialogReq?.role}</strong> ({approveDialogReq?.vacancies} vacancies) for <strong>{approveDialogReq?.branch_name}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 my-3">
                        <Label className="text-xs font-bold text-foreground">
                            {t("approval_remarks") || "Approval Remarks (Optional)"}
                        </Label>
                        <Textarea
                            value={approvalRemarks}
                            onChange={(e) => setApprovalRemarks(e.target.value)}
                            placeholder="Add any recruitment instructions, approval notes, or HR reference..."
                            rows={3}
                            className="rounded-xl text-xs resize-none"
                        />
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setApproveDialogReq(null)} className="rounded-xl h-10">
                            {t("cancel") || "Cancel"}
                        </Button>
                        <Button onClick={handleApproveConfirm} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 font-bold gap-2">
                            <CheckCheck className="h-4 w-4" />
                            {t("approve") || "Confirm Approval"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Confirmation Dialog */}
            <Dialog open={!!rejectDialogReq} onOpenChange={(open) => !open && setRejectDialogReq(null)}>
                <DialogContent className="sm:max-w-[480px] p-6 rounded-3xl border-muted shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-600 font-bold">
                            <XCircle className="h-5 w-5" />
                            {t("reject_requisition") || "Reject Staff Requisition"}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Rejecting request for <strong>{rejectDialogReq?.role}</strong> from <strong>{rejectDialogReq?.branch_name}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 my-3">
                        <Label className="text-xs font-bold text-foreground">
                            {t("rejection_reason") || "Rejection Reason"} <span className="text-rose-500">*</span>
                        </Label>
                        <Textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Please specify why this requisition cannot be approved at this time..."
                            rows={3}
                            required
                            className="rounded-xl text-xs resize-none"
                        />
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setRejectDialogReq(null)} className="rounded-xl h-10">
                            {t("cancel") || "Cancel"}
                        </Button>
                        <Button onClick={handleRejectConfirm} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-10 font-bold gap-2">
                            <Ban className="h-4 w-4" />
                            {t("reject") || "Confirm Rejection"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Alert */}
            <AlertDialog open={!!deleteRequisition} onOpenChange={(open) => !open && setDeleteRequisition(null)}>
                <AlertDialogContent className="rounded-3xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("are_you_absolutely_sure") || "Are you sure?"}</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will delete requisition <strong>{deleteRequisition?.requisition_no}</strong> ({deleteRequisition?.role}). This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteRequisition(null)}>{t("cancel") || "Cancel"}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
                            {t("delete") || "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
