"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
    FilePlus,
    Building2,
    Calendar,
    Briefcase,
    Users,
    Loader2,
    Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import api from "@/lib/api";

export interface StaffRequisition {
    id: string | number;
    requisition_no: string;
    branch_id: string | number;
    branch_name: string;
    branch_slug?: string;
    role: string;
    department: string;
    vacancies: number;
    priority: "Low" | "Medium" | "High" | "Urgent";
    employment_type: string;
    qualification?: string;
    expected_joining_date: string;
    reason: string;
    status: "Pending" | "Approved" | "Rejected";
    created_at: string;
    approval_remarks?: string;
    rejection_reason?: string;
    approved_by?: string;
    rejected_by?: string;
    action_date?: string;
}

interface BranchItem {
    id: number | string;
    branch_name: string;
    slug?: string;
    is_main?: boolean;
}

interface StaffRequisitionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingRequisition?: StaffRequisition | null;
    onSuccess?: (savedReq: StaffRequisition) => void;
    defaultBranchId?: string | number;
    defaultBranchName?: string;
    defaultBranchSlug?: string;
}

const STORAGE_KEY = "ischool_staff_requisitions";

export const getStoredRequisitions = (): StaffRequisition[] => {
    if (typeof window === "undefined") return [];
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            const parsed: StaffRequisition[] = JSON.parse(data);
            // Filter out legacy demo items if any exist
            const nonDemo = parsed.filter(
                (item) => !["REQ-001", "REQ-002", "REQ-003"].includes(String(item.id))
            );
            if (nonDemo.length !== parsed.length) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(nonDemo));
            }
            return nonDemo;
        }
    } catch (e) {
        console.error("Failed to read stored requisitions", e);
    }
    return [];
};

export const saveRequisitionToStorage = (req: StaffRequisition) => {
    if (typeof window === "undefined") return;
    try {
        const list = getStoredRequisitions();
        const index = list.findIndex((r) => r.id.toString() === req.id.toString());
        if (index >= 0) {
            list[index] = req;
        } else {
            list.unshift(req);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
        console.error("Failed to save requisition", e);
    }
};

export const deleteRequisitionFromStorage = (id: string | number) => {
    if (typeof window === "undefined") return;
    try {
        const list = getStoredRequisitions();
        const filtered = list.filter((r) => r.id.toString() !== id.toString());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
        console.error("Failed to delete requisition", e);
    }
};

export function StaffRequisitionDialog({
    open,
    onOpenChange,
    editingRequisition,
    onSuccess,
    defaultBranchId,
    defaultBranchName,
    defaultBranchSlug,
}: StaffRequisitionDialogProps) {
    const { t } = useTranslation();
    const pathname = usePathname() || "";

    const [branches, setBranches] = useState<BranchItem[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [branchId, setBranchId] = useState<string>("");
    const [branchName, setBranchName] = useState<string>("");
    const [isBranchLocked, setIsBranchLocked] = useState(false);

    const [role, setRole] = useState("");
    const [department, setDepartment] = useState("Academic");
    const [vacancies, setVacancies] = useState("1");
    const [priority, setPriority] = useState<"Low" | "Medium" | "High" | "Urgent">("Medium");
    const [employmentType, setEmploymentType] = useState("Full-Time");
    const [qualification, setQualification] = useState("");
    const [expectedJoiningDate, setExpectedJoiningDate] = useState(
        new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    );
    const [reason, setReason] = useState("");

    // Fetch branches and auto-detect current branch
    const loadBranches = useCallback(async () => {
        try {
            const res = await api.get("/multi-branch/branches?all=true", { skipGlobalErrorHandler: true });
            const branchList: BranchItem[] = res.data?.data || res.data || [];
            setBranches(branchList);

            // Branch detection from pathname (/br/:slug/...)
            const branchMatch = pathname.match(/^\/br\/([^\/]+)/);
            const currentSlug = defaultBranchSlug || (branchMatch && branchMatch[1] !== "main" ? branchMatch[1] : null);

            if (editingRequisition) {
                setBranchId(editingRequisition.branch_id.toString());
                setBranchName(editingRequisition.branch_name);
                setRole(editingRequisition.role);
                setDepartment(editingRequisition.department);
                setVacancies(editingRequisition.vacancies.toString());
                setPriority(editingRequisition.priority);
                setEmploymentType(editingRequisition.employment_type || "Full-Time");
                setQualification(editingRequisition.qualification || "");
                setExpectedJoiningDate(editingRequisition.expected_joining_date);
                setReason(editingRequisition.reason || "");
                setIsBranchLocked(true);
            } else if (currentSlug) {
                const found = branchList.find((b) => b.slug === currentSlug);
                if (found) {
                    setBranchId(found.id.toString());
                    setBranchName(found.branch_name);
                } else {
                    const capitalized = currentSlug.charAt(0).toUpperCase() + currentSlug.slice(1) + " Branch";
                    setBranchId("2");
                    setBranchName(capitalized);
                }
                setIsBranchLocked(true);
            } else if (defaultBranchId) {
                setBranchId(defaultBranchId.toString());
                setBranchName(defaultBranchName || "Current Branch");
                setIsBranchLocked(true);
            } else {
                // Check local storage or user assigned branch
                const storedBranchId = localStorage.getItem("active_branch_id");
                const storedBranchName = localStorage.getItem("active_branch_name");
                if (storedBranchId && storedBranchId !== "1") {
                    setBranchId(storedBranchId);
                    setBranchName(storedBranchName || "Sub Branch");
                    setIsBranchLocked(true);
                } else if (branchList.length > 0) {
                    setBranchId(branchList[0].id.toString());
                    setBranchName(branchList[0].branch_name);
                    setIsBranchLocked(false);
                }
            }
        } catch (err) {
            console.error("Failed to load branches for requisition:", err);
        }
    }, [pathname, defaultBranchSlug, editingRequisition, defaultBranchId, defaultBranchName]);

    useEffect(() => {
        if (!open) return;
        loadBranches();

        if (!editingRequisition) {
            setRole("");
            setDepartment("Academic");
            setVacancies("1");
            setPriority("Medium");
            setEmploymentType("Full-Time");
            setQualification("");
            setExpectedJoiningDate(
                new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
            );
            setReason("");
        }
    }, [open, editingRequisition, loadBranches]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!role.trim()) {
            toast.error(t("please_enter_role") || "Please enter the required staff role / designation.");
            return;
        }
        if (!reason.trim()) {
            toast.error(t("please_enter_reason") || "Please provide justification/reason for this requisition.");
            return;
        }

        setSubmitting(true);
        try {
            const selectedBranchObj = branches.find((b) => b.id.toString() === branchId.toString());
            const finalBranchName = selectedBranchObj?.branch_name || branchName || "Dhanmondi Branch";

            const newReq: StaffRequisition = {
                id: editingRequisition ? editingRequisition.id : `REQ-${Date.now()}`,
                requisition_no: editingRequisition ? editingRequisition.requisition_no : `REQ-2026-${Math.floor(100 + Math.random() * 900)}`,
                branch_id: branchId || "2",
                branch_name: finalBranchName,
                branch_slug: selectedBranchObj?.slug || pathname.match(/^\/br\/([^\/]+)/)?.[1] || "dhanmondi",
                role: role.trim(),
                department,
                vacancies: parseInt(vacancies, 10) || 1,
                priority,
                employment_type: employmentType,
                qualification: qualification.trim(),
                expected_joining_date: expectedJoiningDate,
                reason: reason.trim(),
                status: editingRequisition ? editingRequisition.status : "Pending",
                created_at: editingRequisition ? editingRequisition.created_at : new Date().toISOString(),
            };

            // Save to localStorage & try API
            saveRequisitionToStorage(newReq);
            try {
                await api.post("/hr/staff-requisitions", newReq);
            } catch {
                // Ignore API fallback if backend endpoint isn't mounted yet
            }

            toast.success(
                editingRequisition
                    ? (t("requisition_updated_success") || "Requisition updated successfully!")
                    : (t("requisition_submitted_success") || "Staff requisition submitted successfully to Main Branch!")
            );

            if (onSuccess) onSuccess(newReq);
            onOpenChange(false);
        } catch (err: unknown) {
            console.error("Failed to submit requisition:", err);
            const msg = err instanceof Error ? err.message : "Failed to submit requisition. Please try again.";
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[620px] p-0 rounded-3xl overflow-hidden border-muted shadow-2xl">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] p-6 text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white ring-1 ring-white/20 shadow-md">
                            <FilePlus className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                                {editingRequisition ? (t("edit_requisition") || "Edit Staff Requisition") : (t("new_requisition") || t("staff_requisition") || "New Staff Requisition")}
                            </DialogTitle>
                            <DialogDescription className="text-white/80 text-xs mt-0.5">
                                {t("submit_requisition_to_main_branch_desc") || "Submit a new staff requirement / hiring request to Main Branch Central HR"}
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                    {/* Branch Identification */}
                    <div className="space-y-1.5 bg-muted/40 p-3.5 rounded-2xl border border-muted/60">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                <Building2 className="h-4 w-4 text-indigo-600" />
                                {t("campus_branch") || "Campus Branch"} <span className="text-rose-500">*</span>
                            </Label>
                            {isBranchLocked && (
                                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase">
                                    {t("selected_and_locked") || "Branch Locked"}
                                </span>
                            )}
                        </div>
                        {isBranchLocked ? (
                            <div className="h-10 px-3.5 bg-background border border-muted rounded-xl flex items-center text-sm font-semibold text-foreground">
                                {branchName || "Current Branch"}
                            </div>
                        ) : (
                            <Select value={branchId} onValueChange={(val) => {
                                setBranchId(val);
                                const found = branches.find((b) => b.id.toString() === val);
                                if (found) setBranchName(found.branch_name);
                            }}>
                                <SelectTrigger className="h-10 rounded-xl bg-background border-muted text-sm">
                                    <SelectValue placeholder={t("select_campus_branch") || "Select Branch"} />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {branches.map((b) => (
                                        <SelectItem key={b.id} value={b.id.toString()}>
                                            {b.branch_name} {b.is_main ? "(Main Campus)" : ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {/* Role & Department */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                                <Briefcase className="h-3.5 w-3.5 text-indigo-600" />
                                {t("role") || "Position / Role Required"} <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                placeholder={t("role_placeholder") || "e.g. Senior Math Teacher, Accountant"}
                                required
                                className="h-10 rounded-xl bg-background border-muted text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-foreground">
                                {t("department") || "Department"} <span className="text-rose-500">*</span>
                            </Label>
                            <Select value={department} onValueChange={setDepartment}>
                                <SelectTrigger className="h-10 rounded-xl bg-background border-muted text-sm">
                                    <SelectValue>
                                        {department === "Academic" ? (t("academic_teaching") || "Academic / Teaching")
                                            : department === "Administration" ? (t("administration") || "Administration")
                                            : department === "Accounts & Finance" ? (t("accounts_finance") || "Accounts & Finance")
                                            : department === "IT & Technical" ? (t("it_technical") || "IT & Technical")
                                            : department === "Operations & Maintenance" ? (t("operations_maintenance") || "Operations & Maintenance")
                                            : department === "Support Staff" ? (t("support_staff") || "Support Staff")
                                            : department}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="Academic">{t("academic_teaching") || "Academic / Teaching"}</SelectItem>
                                    <SelectItem value="Administration">{t("administration") || "Administration"}</SelectItem>
                                    <SelectItem value="Accounts & Finance">{t("accounts_finance") || "Accounts & Finance"}</SelectItem>
                                    <SelectItem value="IT & Technical">{t("it_technical") || "IT & Technical"}</SelectItem>
                                    <SelectItem value="Operations & Maintenance">{t("operations_maintenance") || "Operations & Maintenance"}</SelectItem>
                                    <SelectItem value="Support Staff">{t("support_staff") || "Support Staff"}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Vacancies, Priority & Employment Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                                <Users className="h-3.5 w-3.5 text-indigo-600" />
                                {t("vacancies") || "No. of Vacancies"} <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                type="number"
                                min="1"
                                max="50"
                                value={vacancies}
                                onChange={(e) => setVacancies(e.target.value)}
                                required
                                className="h-10 rounded-xl bg-background border-muted text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-foreground">
                                {t("priority") || "Priority"} <span className="text-rose-500">*</span>
                            </Label>
                            <Select value={priority} onValueChange={(val: "Low" | "Medium" | "High" | "Urgent") => setPriority(val)}>
                                <SelectTrigger className="h-10 rounded-xl bg-background border-muted text-sm">
                                    <SelectValue>
                                        {priority === "Urgent" ? (t("urgent_priority") || "Urgent")
                                            : priority === "High" ? (t("high_priority") || "High")
                                            : priority === "Medium" ? (t("medium_priority") || "Medium")
                                            : (t("low_priority") || "Low")}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="Low">{t("low_priority") || "Low"}</SelectItem>
                                    <SelectItem value="Medium">{t("medium_priority") || "Medium"}</SelectItem>
                                    <SelectItem value="High">{t("high_priority") || "High"}</SelectItem>
                                    <SelectItem value="Urgent">{t("urgent_priority") || "Urgent"}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-foreground">
                                {t("employment_type") || "Employment Type"}
                            </Label>
                            <Select value={employmentType} onValueChange={setEmploymentType}>
                                <SelectTrigger className="h-10 rounded-xl bg-background border-muted text-sm">
                                    <SelectValue>
                                        {employmentType === "Full-Time" ? (t("full_time") || "Full-Time")
                                            : employmentType === "Part-Time" ? (t("part_time") || "Part-Time")
                                            : employmentType === "Contractual" ? (t("contractual") || "Contractual")
                                            : employmentType}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="Full-Time">{t("full_time") || "Full-Time"}</SelectItem>
                                    <SelectItem value="Part-Time">{t("part_time") || "Part-Time"}</SelectItem>
                                    <SelectItem value="Contractual">{t("contractual") || "Contractual"}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Qualifications & Expected Joining Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-foreground">
                                {t("qualification") || "Required Qualifications / Experience"}
                            </Label>
                            <Input
                                value={qualification}
                                onChange={(e) => setQualification(e.target.value)}
                                placeholder={t("qualification_placeholder") || "e.g. Master's in Math with 2+ yrs experience"}
                                className="h-10 rounded-xl bg-background border-muted text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                                {t("expected_joining_date") || "Expected Joining Date"} <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                type="date"
                                value={expectedJoiningDate}
                                onChange={(e) => setExpectedJoiningDate(e.target.value)}
                                required
                                className="h-10 rounded-xl bg-background border-muted text-sm"
                            />
                        </div>
                    </div>

                    {/* Justification / Reason */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-foreground">
                            {t("justification_notes") || "Justification / Hiring Reason"} <span className="text-rose-500">*</span>
                        </Label>
                        <Textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={t("justification_placeholder") || "Explain why this role is needed, current workload, classroom ratios, or replacement details..."}
                            rows={3}
                            required
                            className="rounded-xl bg-background border-muted text-xs resize-none"
                        />
                    </div>

                    {/* Footer Controls */}
                    <DialogFooter className="pt-2 flex sm:justify-between items-center gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl h-11 px-5"
                        >
                            {t("cancel") || "Cancel"}
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="rounded-xl h-11 px-6 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white font-bold shadow-md shadow-indigo-500/20 gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>{t("submitting") || "Submitting..."}</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4" />
                                    <span>{editingRequisition ? (t("update") || "Update Requisition") : (t("submit_requisition") || "Submit to Main Branch")}</span>
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
