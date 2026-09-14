"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowRightLeft,
    Building2,
    Calendar,
    Loader2,
    CheckCircle2,
    AlertCircle,
    User,
    GraduationCap,
    Briefcase,
    Sparkles,
    FileText,
    QrCode,
    BookOpen,
    Layers,
    Clock,
    Hash
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";

interface Branch {
    id: number;
    branch_name: string;
    branch_code?: string;
    slug?: string;
    is_main?: boolean;
}

interface SchoolClass {
    id: number | string;
    name: string;
}

interface Section {
    id: number | string;
    name: string;
    school_class_id?: number | string;
}

interface TransferDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: "student" | "staff";
    record: {
        id: number | string;
        name: string;
        last_name?: string;
        admission_no?: string;
        roll_no?: string;
        staff_id?: string;
        branch_id?: number | string | null;
        branch?: {
            id?: number | string;
            branch_name?: string;
        } | null;
        role?: string;
        school_class_id?: number | string;
        section_id?: number | string;
        department?: string;
        designation?: string;
    } | null;
    onSuccess?: () => void;
}

const TRANSFER_REASON_OPTIONS = [
    { key: "reason_campus_relocation", value: "Campus Relocation", fallback: "Campus Relocation" },
    { key: "reason_parent_request", value: "Parent / Guardian Request", fallback: "Parent / Guardian Request" },
    { key: "reason_administrative", value: "Administrative Transfer", fallback: "Administrative Transfer" },
    { key: "reason_promotion", value: "Promotion / Reassignment", fallback: "Promotion / Reassignment" },
    { key: "reason_other", value: "Other", fallback: "Other Reason" }
];

export function TransferDialog({
    open,
    onOpenChange,
    type,
    record,
    onSuccess,
}: TransferDialogProps) {
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Classes & Sections for student relocation
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [loadingClasses, setLoadingClasses] = useState(false);
    const [loadingSections, setLoadingSections] = useState(false);

    // Form states
    const [toBranchId, setToBranchId] = useState<string>("");
    const [transferDate, setTransferDate] = useState<string>(
        new Date().toISOString().split("T")[0]
    );
    const [reason, setReason] = useState<string>("Campus Relocation");
    const [notes, setNotes] = useState<string>("");

    // Student relocation alignment states
    const [schoolClassId, setSchoolClassId] = useState<string>("");
    const [sectionId, setSectionId] = useState<string>("");
    const [admissionNo, setAdmissionNo] = useState<string>("");
    const [rollNo, setRollNo] = useState<string>("");

    // Staff relocation alignment states
    const [staffId, setStaffId] = useState<string>("");
    const [department, setDepartment] = useState<string>("");
    const [designation, setDesignation] = useState<string>("");

    // Smart Attendance & System Options
    const [regenerateQr, setRegenerateQr] = useState<boolean>(true);
    const [clearOldTimetables, setClearOldTimetables] = useState<boolean>(true);
    const [keepActive, setKeepActive] = useState<boolean>(false);

    useEffect(() => {
        if (open) {
            fetchBranches();
            if (type === "student") {
                fetchClasses();
            }
            setToBranchId("");
            setTransferDate(new Date().toISOString().split("T")[0]);
            setReason("Campus Relocation");
            setNotes("");
            setRegenerateQr(true);
            setClearOldTimetables(true);
            setKeepActive(false);

            if (record) {
                setAdmissionNo(record.admission_no || "");
                setRollNo(record.roll_no || "");
                setStaffId(record.staff_id || "");
                setDepartment(record.department || "");
                setDesignation(record.designation || "");
                setSchoolClassId(record.school_class_id ? record.school_class_id.toString() : "");
                setSectionId(record.section_id ? record.section_id.toString() : "");
            }
        }
    }, [open, record]);

    useEffect(() => {
        if (schoolClassId && type === "student") {
            fetchSections(schoolClassId);
        } else {
            setSections([]);
        }
    }, [schoolClassId]);

    const fetchBranches = async () => {
        setLoadingBranches(true);
        try {
            const res = await api.get("/multi-branch/branches", {
                params: { all: "true" },
                skipGlobalErrorHandler: true,
            });
            const list = res.data?.data || res.data || [];
            setBranches(Array.isArray(list) ? list : []);
        } catch (e) {
            console.error("Failed to load branches for transfer:", e);
            setBranches([]);
        } finally {
            setLoadingBranches(false);
        }
    };

    const fetchClasses = async () => {
        setLoadingClasses(true);
        try {
            const res = await api.get("/academics/classes?no_paginate=true");
            const list = res.data?.data || res.data || [];
            setClasses(Array.isArray(list) ? list : []);
        } catch (e) {
            console.error("Failed to load classes:", e);
            setClasses([]);
        } finally {
            setLoadingClasses(false);
        }
    };

    const fetchSections = async (classId: string) => {
        setLoadingSections(true);
        try {
            const res = await api.get(`/academics/sections?no_paginate=true&school_class_id=${classId}`);
            const list = res.data?.data || res.data || [];
            setSections(Array.isArray(list) ? list : []);
        } catch (e) {
            console.error("Failed to load sections:", e);
            setSections([]);
        } finally {
            setLoadingSections(false);
        }
    };

    const handleTransfer = async () => {
        if (!record?.id) return;
        if (!toBranchId) {
            toast.error(t("please_select_destination_branch") || "Please select a destination campus branch.");
            return;
        }
        if (!transferDate) {
            toast.error(t("please_specify_transfer_date") || "Please specify a transfer date.");
            return;
        }

        setSubmitting(true);
        try {
            if (type === "student") {
                await api.post("/multi-branch/transfer/student", {
                    student_id: record.id,
                    to_branch_id: toBranchId,
                    school_class_id: schoolClassId || undefined,
                    section_id: sectionId || undefined,
                    admission_no: admissionNo.trim() || undefined,
                    roll_no: rollNo.trim() || undefined,
                    transfer_date: transferDate,
                    reason: reason.trim(),
                    notes: notes.trim() || undefined,
                    regenerate_qr: regenerateQr,
                    active: keepActive,
                });
                toast.success(t("student_transfer_success", { name: record.name }) || `Student ${record.name} successfully transferred!`);
            } else {
                await api.post("/multi-branch/transfer/staff", {
                    staff_id: record.id,
                    to_branch_id: toBranchId,
                    new_staff_id: staffId.trim() || undefined,
                    department: department.trim() || undefined,
                    designation: designation.trim() || undefined,
                    transfer_date: transferDate,
                    reason: reason.trim(),
                    notes: notes.trim() || undefined,
                    regenerate_qr: regenerateQr,
                    clear_old_assignments: clearOldTimetables,
                });
                toast.success(t("staff_transfer_success", { name: record.name }) || `Staff member ${record.name} successfully transferred!`);
            }

            onOpenChange(false);
            if (onSuccess) onSuccess();
        } catch (err: any) {
            console.error("Transfer failed:", err);
            toast.error(
                err.response?.data?.message || "Failed to complete branch transfer. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (!record) return null;

    const currentBranchName =
        record.branch?.branch_name ||
        (record.branch_id
            ? branches.find((b) => b.id.toString() === record.branch_id?.toString())?.branch_name
            : "Main Campus");

    const availableDestinationBranches = branches.filter(
        (b) => b.id.toString() !== record.branch_id?.toString()
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[96vw] sm:max-w-2xl p-0 rounded-3xl overflow-hidden border border-border/80 shadow-2xl bg-card">
                {/* Signature Gradient Modal Header */}
                <div className="bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-200/70 p-5 sm:p-6 text-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] flex items-center justify-center text-white shadow-md shrink-0">
                            <ArrowRightLeft className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight leading-none">
                                {t("transfer_campus_branch")}
                            </DialogTitle>
                            <DialogDescription className="text-slate-600 text-xs mt-1 font-medium">
                                {type === "student"
                                    ? t("move_student_profile_desc")
                                    : t("move_staff_profile_desc")}
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-5 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                    {/* User Summary Card */}
                    <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                                {type === "student" ? <GraduationCap className="h-5 w-5" /> : <Briefcase className="h-5 w-5" />}
                            </div>
                            <div>
                                <p className="font-bold text-sm text-foreground leading-tight">{record.name} {record.last_name || ""}</p>
                                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                                    {type === "student"
                                        ? `${t("admission_no") || "ভর্তি নং"}: ${record.admission_no || "-"}`
                                        : `${t("staff_id") || "স্টাফ আইডি"}: ${record.staff_id || "-"}`}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                                {t("current_branch")}
                            </span>
                            <span className="text-xs font-bold text-foreground">
                                {currentBranchName}
                            </span>
                        </div>
                    </div>

                    {/* Transfer & Relocation Form Inputs */}
                    <div className="space-y-4">
                        {/* Destination Branch */}
                        <div className="space-y-1.5 group">
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                                {t("destination_campus_branch")} <span className="text-destructive">*</span>
                            </Label>
                            <Select value={toBranchId} onValueChange={setToBranchId}>
                                <SelectTrigger className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium focus:ring-2 focus:ring-primary/20">
                                    <SelectValue placeholder={loadingBranches ? t("loading") : t("select_destination_branch")} />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {availableDestinationBranches.map((b) => (
                                        <SelectItem key={b.id} value={b.id.toString()} className="text-xs font-medium">
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="font-semibold">{b.branch_name}</span>
                                                {b.is_main && (
                                                    <span className="text-[10px] font-bold uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                                        Main
                                                    </span>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                    {availableDestinationBranches.length === 0 && !loadingBranches && (
                                        <div className="p-3 text-center text-xs text-muted-foreground">
                                            {t("no_data_found")}
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Student Specific Alignments: Class, Section, Admission No, Roll No */}
                        {type === "student" && (
                            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-3">
                                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                                    <Layers className="h-4 w-4" />
                                    <span>{t("realign_records_title") || "Academic & Identity Alignment"}</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                            {t("destination_class")}
                                        </Label>
                                        <Select value={schoolClassId} onValueChange={setSchoolClassId}>
                                            <SelectTrigger className="h-9 rounded-xl bg-background border-border/80 text-xs">
                                                <SelectValue placeholder={loadingClasses ? t("loading") : t("select_class")} />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                {classes.map((c) => (
                                                    <SelectItem key={c.id} value={c.id.toString()} className="text-xs">
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                            {t("destination_section")}
                                        </Label>
                                        <Select value={sectionId} onValueChange={setSectionId} disabled={!schoolClassId}>
                                            <SelectTrigger className="h-9 rounded-xl bg-background border-border/80 text-xs">
                                                <SelectValue placeholder={loadingSections ? t("loading") : t("select_section")} />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                {sections.map((s) => (
                                                    <SelectItem key={s.id} value={s.id.toString()} className="text-xs">
                                                        {s.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                            {t("new_admission_no")}
                                        </Label>
                                        <Input
                                            value={admissionNo}
                                            onChange={(e) => setAdmissionNo(e.target.value)}
                                            placeholder={record.admission_no || "e.g. ADM-DHN-001"}
                                            className="h-9 rounded-xl bg-background border-border/80 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                            {t("new_roll_no")}
                                        </Label>
                                        <Input
                                            value={rollNo}
                                            onChange={(e) => setRollNo(e.target.value)}
                                            placeholder={record.roll_no || "e.g. 01"}
                                            className="h-9 rounded-xl bg-background border-border/80 text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Staff Specific Alignments: Staff ID, Department, Designation */}
                        {type === "staff" && (
                            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 space-y-3">
                                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                                    <Briefcase className="h-4 w-4" />
                                    <span>{t("realign_records_title") || "Staff Role & Identity Alignment"}</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                            {t("new_staff_id")}
                                        </Label>
                                        <Input
                                            value={staffId}
                                            onChange={(e) => setStaffId(e.target.value)}
                                            placeholder={record.staff_id || "e.g. STF-004"}
                                            className="h-9 rounded-xl bg-background border-border/80 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                            {t("department")}
                                        </Label>
                                        <Input
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value)}
                                            placeholder="e.g. Academic"
                                            className="h-9 rounded-xl bg-background border-border/80 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                            {t("designation")}
                                        </Label>
                                        <Input
                                            value={designation}
                                            onChange={(e) => setDesignation(e.target.value)}
                                            placeholder="e.g. Senior Teacher"
                                            className="h-9 rounded-xl bg-background border-border/80 text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Date and Reason */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5 group">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                                    {t("effective_transfer_date")} <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    type="date"
                                    value={transferDate}
                                    onChange={(e) => setTransferDate(e.target.value)}
                                    className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <div className="space-y-1.5 group">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                    {t("transfer_reason")}
                                </Label>
                                <Select value={reason} onValueChange={setReason}>
                                    <SelectTrigger className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium focus:ring-2 focus:ring-primary/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {TRANSFER_REASON_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value} className="text-xs font-medium">
                                                {t(opt.key) || opt.fallback}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Inactive Status upon Relocation Banner */}
                        {type === "student" && (
                            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1.5">
                                <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{t("status_inactive_pending_adjustment")}</span>
                                </div>
                                <p className="text-[11.5px] text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                                    {t("inactive_until_adjusted_desc")}
                                </p>
                                <label className="flex items-center gap-2 pt-1 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={keepActive}
                                        onChange={(e) => setKeepActive(e.target.checked)}
                                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
                                    />
                                    <span>{t("activate_immediately_checkbox")}</span>
                                </label>
                            </div>
                        )}

                        {/* Smart Attendance & Relocation Options Checklist */}
                        <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/70 space-y-2.5">
                            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-foreground">
                                <input
                                    type="checkbox"
                                    checked={regenerateQr}
                                    onChange={(e) => setRegenerateQr(e.target.checked)}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                                />
                                <span className="flex items-center gap-1.5">
                                    <QrCode className="h-3.5 w-3.5 text-indigo-600" />
                                    {t("regenerate_qr_smart_pass")}
                                </span>
                            </label>

                            {type === "staff" && (
                                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-foreground">
                                    <input
                                        type="checkbox"
                                        checked={clearOldTimetables}
                                        onChange={(e) => setClearOldTimetables(e.target.checked)}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                                    />
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                                        {t("clear_old_timetables_desc")}
                                    </span>
                                </label>
                            )}

                            <div className="flex items-start gap-2 pt-1 text-[11px] text-muted-foreground">
                                <BookOpen className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{t("library_fee_retention_notice")}</span>
                            </div>
                        </div>

                        {/* Notes / Remarks */}
                        <div className="space-y-1.5 group">
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5 text-slate-500" />
                                {t("transfer_notes_remarks")}
                            </Label>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder={t("transfer_notes_placeholder") || "Add any details, reason documentation, or handover notes..."}
                                rows={2}
                                className="rounded-xl bg-background border-border/80 text-xs resize-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <DialogFooter className="p-5 sm:p-6 pt-0 bg-background flex flex-row items-center justify-end gap-2.5 border-t border-border/40 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="rounded-xl h-10 px-5 text-xs font-bold cursor-pointer"
                    >
                        {t("cancel")}
                    </Button>
                    <Button
                        type="button"
                        disabled={submitting || !toBranchId}
                        onClick={handleTransfer}
                        className="rounded-xl h-10 px-6 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer border-none"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>{t("processing_transfer")}</span>
                            </>
                        ) : (
                            <>
                                <ArrowRightLeft className="h-4 w-4" />
                                <span>{t("confirm_and_transfer")}</span>
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
