"use client";

interface FeePayment { amount: number; [key: string]: unknown; }
interface DueFee { 
    id: number; 
    is_transport?: boolean; 
    fee_master_id?: number; 
    transport_fee_master_id?: number; 
    fee_master: { 
        amount: number; 
        fee_group?: { name?: string }; 
        fee_type?: { name?: string; code?: string }; 
        due_date?: string; 
        fine_amount?: number; 
        [key: string]: unknown 
    }; 
    payments: FeePayment[]; 
    due_date?: string; 
    [key: string]: unknown; 
}
interface StudentData { 
    id?: number; 
    name?: string; 
    last_name?: string; 
    admission_no?: string; 
    school_class?: { name?: string; class?: string };
    schoolClass?: { name?: string; class?: string };
    section?: { name?: string; section?: string };
    [key: string]: unknown; 
}
interface ClassItem { id: number; name: string; sections?: SectionItem[]; [key: string]: unknown; }
interface SectionItem { id: number; name: string; [key: string]: unknown; }
interface StudentItem { id: number; name: string; last_name?: string; admission_no?: string; [key: string]: unknown; }

import { 
    Search, 
    Zap, 
    ChevronDown, 
    CreditCard, 
    Calendar, 
    FileText, 
    CheckCircle2, 
    Loader2, 
    Trash2, 
    Download, 
    User, 
    Pencil, 
    Layers, 
    Wallet,
    Building
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { formatDate, translateClassName, translateSectionName, translateFeeItemName, toLocaleNumber } from "@/lib/utils";

function TableSkeleton({ rows = 4, cols = 8 }: { rows?: number; cols?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3.5">
                            <div
                                className="h-4 rounded-md bg-muted/60 animate-pulse"
                                style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }}
                            />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

export default function QuickFeesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const paramStudentId = searchParams.get("student_id") || "";

    const { t, language } = useTranslation();
    const tt = useTranslateToast();
    const { symbol, formatCurrency } = useCurrencyFormatter();

    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [sections, setSections] = useState<SectionItem[]>([]);
    const [students, setStudents] = useState<StudentItem[]>([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [selectedStudentId, setSelectedStudentId] = useState(paramStudentId);

    const [loading, setLoading] = useState(false);
    const [fetchingStudents, setFetchingStudents] = useState(false);
    const [studentData, setStudentData] = useState<StudentData | null>(null);
    const [dueFees, setDueFees] = useState<DueFee[]>([]);

    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [selectedFee, setSelectedFee] = useState<DueFee | null>(null);
    const [paymentData, setPaymentData] = useState({
        amount: "",
        discount: "0",
        fine: "0",
        payment_mode: "Cash",
        note: "",
        date: new Date().toISOString().split('T')[0]
    });

    const fetchDropdowns = useCallback(async () => {
        try {
            const [classRes, sectionRes] = await Promise.all([
                api.get("/academics/classes?no_paginate=true"),
                api.get("/academics/sections?no_paginate=true")
            ]);
            setClasses(classRes.data.data?.data || classRes.data.data || []);
            setSections(sectionRes.data.data?.data || sectionRes.data.data || []);
        } catch (error) {
            console.error("Error fetching dropdowns:", error);
        }
    }, []);

    useEffect(() => {
        fetchDropdowns();
    }, [fetchDropdowns]);

    const fetchStudents = useCallback(async (classId: string, sectionId: string) => {
        if (!classId) {
            setStudents([]);
            return;
        }
        setFetchingStudents(true);
        try {
            const params: Record<string, unknown> = { school_class_id: classId, no_paginate: true };
            if (sectionId) {
                params.section_id = sectionId;
            }
            const res = await api.get("/fee-collection/search-students", { params });
            const list = res.data.data?.data || res.data.data || res.data || [];
            setStudents(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error("Failed to fetch students:", error);
            setStudents([]);
        } finally {
            setFetchingStudents(false);
        }
    }, []);

    const filteredSections = useMemo(() => {
        const classSpecific = selectedClass ? sections.filter(s => String((s as Record<string, unknown>).school_class_id || '') === String(selectedClass)) : [];
        const candidates = classSpecific.length > 0 ? classSpecific : sections.filter(s => !(s as Record<string, unknown>).school_class_id || String((s as Record<string, unknown>).school_class_id || '') === String(selectedClass));
        const seen = new Set<string>();
        return candidates.filter(s => {
            const key = s.name.trim().toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [sections, selectedClass]);

    useEffect(() => {
        if (students.length === 1 && !selectedStudentId) {
            setSelectedStudentId(students[0].id.toString());
        }
    }, [students, selectedStudentId]);

    useEffect(() => {
        fetchStudents(selectedClass, selectedSection);
    }, [selectedClass, selectedSection, fetchStudents]);

    const handleSearch = useCallback(async () => {
        if (!selectedStudentId) {
            tt.error("please_select_a_student_first");
            return;
        }
        setLoading(true);
        try {
            const res = await api.get(`/fee-collection/student-fees/${selectedStudentId}`);
            setStudentData(res.data.data.student);
            setDueFees(res.data.data.fees || []);
        } catch {
            tt.error("failed_to_fetch_student_fees");
        } finally {
            setLoading(false);
        }
    }, [selectedStudentId, tt]);

    useEffect(() => {
        if (paramStudentId) {
            handleSearch();
        }
    }, [paramStudentId, handleSearch]);

    // Student summary totals
    const studentSummary = useMemo(() => {
        if (!dueFees.length) return { total: 0, paid: 0, due: 0 };
        const total = dueFees.reduce((acc, fee) => acc + (Number(fee.fee_master?.amount) || 0), 0);
        const paid = dueFees.reduce((acc, fee) => {
            const feePaid = (fee.payments || []).reduce((pAcc: number, p: FeePayment) => pAcc + (Number(p.amount) || 0), 0);
            return acc + feePaid;
        }, 0);
        const due = Math.max(0, total - paid);
        return { total, paid, due };
    }, [dueFees]);

    const openPaymentDialog = (fee: DueFee) => {
        const total = Number(fee.fee_master?.amount) || 0;
        const paid = (fee.payments || []).reduce((acc: number, p: FeePayment) => acc + (Number(p.amount) || 0), 0);
        const due = Math.max(0, total - paid);

        setSelectedFee(fee);
        setPaymentData({
            ...paymentData,
            amount: due > 0 ? due.toFixed(2) : "0.00",
            date: new Date().toISOString().split('T')[0]
        });
        setIsPaymentDialogOpen(true);
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFee) return;
        setLoading(true);
        try {
            const payload: Record<string, unknown> = { ...paymentData };
            if (selectedFee.is_transport) {
                payload.student_transport_fee_id = selectedFee.id;
            } else {
                payload.student_fee_master_id = selectedFee.id;
            }
            await api.post("/fee-collection/collect-fee", payload);
            tt.success("fee_payment_collected_successfully");
            setIsPaymentDialogOpen(false);
            handleSearch();
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            tt.error(err.response?.data?.message || "failed_to_collect_payment");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteFee = async (fee: DueFee) => {
        if (!confirm(t("delete_confirmation_desc") || "Are you sure you want to delete this invoice fee item?")) return;
        setLoading(true);
        try {
            await api.delete(`/fee-collection/student-fees/${fee.id}`, {
                params: { is_transport: fee.is_transport ? true : false }
            });
            tt.success("invoice_fee_item_deleted");
            handleSearch();
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            tt.error(err.response?.data?.message || "failed_to_delete_fee_item");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (fee: DueFee, targetStatus: "paid" | "unpaid") => {
        setLoading(true);
        try {
            await api.put(`/fee-collection/student-fees/${fee.id}`, {
                is_transport: fee.is_transport ? true : false,
                status: targetStatus
            });
            tt.success("fee_status_changed");
            handleSearch();
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            tt.error(err.response?.data?.message || "failed_to_change_fee_status");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-3 sm:p-5 pt-1 sm:pt-2 space-y-4 max-w-[1600px] mx-auto animate-in fade-in duration-300 pb-20">
            {/* Criteria Selection Card with Generate Invoice Action */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-200/70">
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Search className="h-4 w-4" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                {t("select_criteria")}
                            </CardTitle>
                            <p className="text-xs text-slate-500 font-medium mt-1">
                                {t("filter_by_class_and_section")}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => router.push(selectedStudentId ? `/dashboard/fees-collection/generate-invoice?student_id=${selectedStudentId}` : '/dashboard/fees-collection/generate-invoice')}
                        className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white shadow-md shadow-indigo-500/20 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer border-none shrink-0"
                    >
                        <FileText className="h-3.5 w-3.5" />
                        <span>{t("generate_invoice")}</span>
                    </Button>
                </CardHeader>

                <CardContent className="p-5 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end">
                        {/* Class */}
                        <div className="space-y-1.5 group">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                <Building className="h-3.5 w-3.5 text-indigo-600" />
                                {t("class")} <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    className="flex h-10 w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs sm:text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                                    value={selectedClass}
                                    onChange={(e) => { setSelectedClass(e.target.value); setSelectedStudentId(""); }}
                                >
                                    <option value="">{t("select_class")}</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{translateClassName(c.name, language?.short_code)}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        {/* Section */}
                        <div className="space-y-1.5 group">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                <Layers className="h-3.5 w-3.5 text-indigo-600" />
                                {t("section")}
                            </label>
                            <div className="relative">
                                <select
                                    className="flex h-10 w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs sm:text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                                    value={selectedSection}
                                    onChange={(e) => { setSelectedSection(e.target.value); setSelectedStudentId(""); }}
                                >
                                    <option value="">{t("select_section")}</option>
                                    {filteredSections.map(s => <option key={s.id} value={s.id}>{translateSectionName(s.name, language?.short_code)}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        {/* Student */}
                        <div className="space-y-1.5 group">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                <User className="h-3.5 w-3.5 text-indigo-600" />
                                {t("student")} <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    className="flex h-10 w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs sm:text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                                    value={selectedStudentId}
                                    onChange={(e) => setSelectedStudentId(e.target.value)}
                                    disabled={fetchingStudents || !selectedClass}
                                >
                                    <option value="">
                                        {!selectedClass 
                                            ? t("select_class_first") 
                                            : (fetchingStudents ? `${t("loading")}...` : (students.length === 0 ? t("no_data_found") : `${t("select_student")} (${toLocaleNumber(students.length, language?.short_code)})`))}
                                    </option>
                                    {students.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} {s.last_name || ""} {s.admission_no ? `(#${toLocaleNumber(s.admission_no, language?.short_code)})` : ""}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        {/* Action Search Button */}
                        <div>
                            <Button
                                className="h-10 w-full rounded-xl font-bold text-xs bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                                onClick={handleSearch}
                                disabled={loading || !selectedStudentId}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <Search className="h-4 w-4 shrink-0" />}
                                <span>{t("search_fees")}</span>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Fees Result Section */}
            {studentData && (
                <div className="space-y-4 animate-in slide-in-from-bottom-3 duration-300">
                    {/* Student Info & Overview Stats Banner */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
                        {/* Student Badge Card */}
                        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex items-center gap-3.5">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-700 dark:text-indigo-300 font-bold text-lg flex items-center justify-center shrink-0 border border-indigo-500/20">
                                {(studentData.name || 'S').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-sm font-bold text-foreground truncate">
                                    {studentData.name} {studentData.last_name || ""}
                                </h3>
                                <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                                    {t("adm_no")}: #{toLocaleNumber(studentData.admission_no || "N/A", language?.short_code)}
                                </p>
                            </div>
                        </div>

                        {/* Total Fees Amount */}
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/15 via-purple-500/8 to-blue-500/8 border border-indigo-200/80 dark:border-indigo-900/50 shadow-xs flex flex-col justify-between">
                            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">{t("total_fees_amount")}</span>
                            <div className="mt-2 text-xl sm:text-2xl font-black text-indigo-950 dark:text-white">
                                {toLocaleNumber(formatCurrency(studentSummary.total), language?.short_code)}
                            </div>
                        </div>

                        {/* Total Paid Amount */}
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-teal-500/8 to-green-500/8 border border-emerald-200/80 dark:border-emerald-900/50 shadow-xs flex flex-col justify-between">
                            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">{t("paid_amount")}</span>
                            <div className="mt-2 text-xl sm:text-2xl font-black text-emerald-950 dark:text-white">
                                {toLocaleNumber(formatCurrency(studentSummary.paid), language?.short_code)}
                            </div>
                        </div>

                        {/* Net Due Balance */}
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-orange-500/8 to-yellow-500/8 border border-amber-200/80 dark:border-amber-900/50 shadow-xs flex flex-col justify-between">
                            <span className="text-xs font-bold text-amber-900 dark:text-amber-200">{t("net_balance_due")}</span>
                            <div className="mt-2 text-xl sm:text-2xl font-black text-amber-950 dark:text-white">
                                {toLocaleNumber(formatCurrency(studentSummary.due), language?.short_code)}
                            </div>
                        </div>
                    </div>

                    {/* Fees Table Card */}
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card overflow-hidden pt-0">
                        <CardHeader className="flex flex-row items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-200/70">
                            <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                    <Zap className="h-4 w-4" />
                                </span>
                                <div>
                                    <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                        {t("due_fees")}
                                    </CardTitle>
                                    <p className="text-xs text-slate-500 font-medium mt-1">
                                        {t("x_results_found", { count: toLocaleNumber(dueFees.length, language?.short_code) })}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/40 border-b border-border/70 hover:bg-muted/40">
                                            <TableHead className="font-bold text-foreground text-xs py-3.5 pl-6">{t("student")}</TableHead>
                                            <TableHead className="font-bold text-foreground text-xs py-3.5">{t("fees_group")}</TableHead>
                                            <TableHead className="font-bold text-foreground text-xs py-3.5">{t("fees_type")}</TableHead>
                                            <TableHead className="font-bold text-foreground text-xs py-3.5">{t("fees_code")}</TableHead>
                                            <TableHead className="font-bold text-foreground text-xs py-3.5 text-center">{t("due_date")}</TableHead>
                                            <TableHead className="font-bold text-foreground text-xs py-3.5 text-right">{t("fine_amount")} ({symbol})</TableHead>
                                            <TableHead className="font-bold text-foreground text-xs py-3.5 text-right">{t("amount")} ({symbol})</TableHead>
                                            <TableHead className="font-bold text-foreground text-xs py-3.5 text-center pr-6 w-44">{t("action")}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="divide-y divide-border/50 text-xs">
                                        {loading ? (
                                            <TableSkeleton rows={4} cols={8} />
                                        ) : (
                                            dueFees.map((fee) => {
                                                const total = Number(fee.fee_master?.amount) || 0;
                                                const paid = (fee.payments || []).reduce((acc: number, p: FeePayment) => acc + (Number(p.amount) || 0), 0);
                                                const due = Math.max(0, total - paid);
                                                const isPaid = due <= 0 && total > 0;
                                                const isPartial = paid > 0 && due > 0;
                                                const fineAmount = Number(fee.fee_master?.fine_amount) || 0;

                                                return (
                                                    <TableRow key={fee.is_transport ? `t_${fee.id}` : `r_${fee.id}`} className="hover:bg-muted/20 transition-colors">
                                                        {/* Student Name */}
                                                        <TableCell className="py-3.5 pl-6">
                                                             <div className="flex items-center gap-2.5">
                                                                <div className="h-7 w-7 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                                                                    {(studentData.name || 'S').charAt(0).toUpperCase()}
                                                                </div>
                                                                <div className="space-y-0.5">
                                                                    <p className="font-bold text-foreground truncate max-w-[140px]">{studentData.name} {studentData.last_name}</p>
                                                                    <p className="text-[10px] text-muted-foreground font-mono">#{toLocaleNumber(studentData.admission_no, language?.short_code)}</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>

                                                        {/* Fees Group */}
                                                        <TableCell className="py-3.5">
                                                            <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800 text-[11px]">
                                                                {translateFeeItemName(fee.fee_master.fee_group?.name, language?.short_code) || t("general_payment")}
                                                            </span>
                                                        </TableCell>

                                                        {/* Fees Type */}
                                                        <TableCell className="py-3.5 font-semibold text-foreground">
                                                            {translateFeeItemName(fee.fee_master.fee_type?.name, language?.short_code) || 'N/A'}
                                                        </TableCell>

                                                        {/* Fees Code */}
                                                        <TableCell className="py-3.5">
                                                            <span className="font-mono text-[10px] bg-muted/60 px-2 py-0.5 rounded text-foreground font-medium">
                                                                {fee.fee_master.fee_type?.code || "N/A"}
                                                            </span>
                                                        </TableCell>

                                                        {/* Due Date */}
                                                        <TableCell className="py-3.5 text-center text-muted-foreground font-semibold">
                                                            {fee.fee_master.due_date ? toLocaleNumber(formatDate(fee.fee_master.due_date), language?.short_code) : "—"}
                                                        </TableCell>

                                                        {/* Fine */}
                                                        <TableCell className="py-3.5 text-right font-bold text-rose-600">
                                                            {fineAmount > 0 ? toLocaleNumber(formatCurrency(fineAmount), language?.short_code) : '—'}
                                                        </TableCell>

                                                        {/* Amount / Paid / Due */}
                                                        <TableCell className="py-3.5 text-right">
                                                            <div className="space-y-0.5">
                                                                <p className="font-black text-foreground">{toLocaleNumber(formatCurrency(total), language?.short_code)}</p>
                                                                {paid > 0 && (
                                                                    <p className="text-[10px] font-bold text-emerald-600">
                                                                        {t("paid")}: {toLocaleNumber(formatCurrency(paid), language?.short_code)}
                                                                    </p>
                                                                )}
                                                                {isPartial && (
                                                                    <p className="text-[10px] font-bold text-amber-600">
                                                                        {t("due")}: {toLocaleNumber(formatCurrency(due), language?.short_code)}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </TableCell>

                                                        {/* Action Buttons */}
                                                        <TableCell className="py-3.5 text-center pr-6">
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                {isPaid ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleToggleStatus(fee, "unpaid")}
                                                                        title={t("click_to_mark_as_unpaid")}
                                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold text-[10px] uppercase cursor-pointer transition-colors"
                                                                    >
                                                                        <CheckCircle2 className="h-3 w-3" /> {t("paid")}
                                                                    </button>
                                                                ) : (
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => openPaymentDialog(fee)}
                                                                        className="h-8 rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:opacity-95 shadow-xs shadow-indigo-500/20 flex items-center gap-1 text-xs font-bold transition-all active:scale-95 px-3 cursor-pointer border-none"
                                                                    >
                                                                        <Wallet className="h-3.5 w-3.5" /> {t("collect_fees")}
                                                                    </Button>
                                                                )}

                                                                {/* PDF Download Button with Gradient */}
                                                                <Button
                                                                    size="icon"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        router.push(`/dashboard/fees-collection/generate-invoice?student_id=${selectedStudentId}&fee_id=${fee.id}&auto_pdf=true`);
                                                                    }}
                                                                    title={t("download_pdf_invoice")}
                                                                    className="h-8 w-8 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-border/80 cursor-pointer"
                                                                >
                                                                    <Download className="h-3.5 w-3.5" />
                                                                </Button>

                                                                {/* Edit Invoice Button */}
                                                                <Button
                                                                    size="icon"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        router.push(`/dashboard/fees-collection/generate-invoice?edit_id=${fee.id}&student_id=${selectedStudentId}`);
                                                                    }}
                                                                    title={t("edit_full_invoice")}
                                                                    className="h-8 w-8 rounded-lg text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border-border/80 cursor-pointer"
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </Button>

                                                                {/* Delete Fee Button */}
                                                                <Button
                                                                    size="icon"
                                                                    variant="outline"
                                                                    onClick={() => handleDeleteFee(fee)}
                                                                    title={t("delete_fee_record")}
                                                                    className="h-8 w-8 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-border/80 cursor-pointer"
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
                                {!loading && dueFees.length === 0 && (
                                    <div className="p-16 text-center space-y-2">
                                        <div className="h-14 w-14 rounded-full bg-muted/40 flex items-center justify-center mx-auto text-muted-foreground">
                                            <CreditCard className="h-7 w-7" />
                                        </div>
                                        <p className="text-muted-foreground font-semibold text-xs">{t("no_fees_records_found")}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Payment Modal Dialog */}
            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogContent className="sm:max-w-[560px] p-0 max-h-[90vh] flex flex-col overflow-hidden rounded-2xl border border-border shadow-2xl bg-card">
                    {/* Modal Header */}
                    <DialogHeader className="px-6 py-4 sm:px-7 sm:py-5 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shrink-0">
                        <div className="flex items-center gap-3.5">
                            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md border border-white/30 shrink-0 text-white">
                                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-white leading-snug">
                                    {t("collect_fees")}
                                </DialogTitle>
                                <DialogDescription className="text-white/85 text-xs font-medium truncate mt-0.5">
                                    {(selectedFee?.fee_master.fee_group?.name ? translateFeeItemName(selectedFee.fee_master.fee_group.name, language?.short_code) : t("general_payment"))} — {translateFeeItemName(selectedFee?.fee_master.fee_type?.name, language?.short_code)} ({studentData?.name || ""})
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Scrollable Form Body */}
                    <form onSubmit={handlePaymentSubmit} className="flex-1 overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-7 sm:py-6 space-y-4">
                            {/* Summary Calculation */}
                            <div className="p-3.5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-indigo-100 dark:border-indigo-900/40 rounded-xl flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-700 dark:text-slate-300">{t("net_payable_amount")}:</span>
                                <span className="text-base font-black text-indigo-700 dark:text-indigo-400">
                                    {toLocaleNumber(formatCurrency(Math.max(0, (parseFloat(paymentData.amount) || 0) + (parseFloat(paymentData.fine) || 0) - (parseFloat(paymentData.discount) || 0))), language?.short_code)}
                                </span>
                            </div>

                            {/* Row 1: Amount & Date */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {t("amount_to_pay")} ({symbol}) <span className="text-destructive">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                                            {symbol}
                                        </span>
                                        <Input
                                            type="number"
                                            step="any"
                                            min="0"
                                            className="pl-8 h-10 rounded-xl bg-background border-border/80 text-xs font-bold"
                                            value={paymentData.amount}
                                            onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {t("payment_date")} <span className="text-destructive">*</span>
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                        <Input
                                            type="date"
                                            className="pl-9 h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                                            value={paymentData.date}
                                            onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: Discount & Fine */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {t("discount")} ({symbol})
                                    </label>
                                    <Input
                                        type="number"
                                        step="any"
                                        min="0"
                                        className="h-10 rounded-xl bg-background border-border/80 text-xs"
                                        value={paymentData.discount}
                                        onChange={(e) => setPaymentData({ ...paymentData, discount: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {t("fine_amount")} ({symbol})
                                    </label>
                                    <Input
                                        type="number"
                                        step="any"
                                        min="0"
                                        className="h-10 rounded-xl bg-background border-border/80 text-xs"
                                        value={paymentData.fine}
                                        onChange={(e) => setPaymentData({ ...paymentData, fine: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Row 3: Payment Mode */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {t("payment_mode")} <span className="text-destructive">*</span>
                                </label>
                                <select
                                    className="flex h-10 w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-semibold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    value={paymentData.payment_mode}
                                    onChange={(e) => setPaymentData({ ...paymentData, payment_mode: e.target.value })}
                                >
                                    <optgroup label={t("active_online_gateways")}>
                                        <option value="UddoktaPay">⚡ UddoktaPay (Online - bKash/Nagad/Rocket/Cards)</option>
                                        <option value="Online">{t("online_gateway")}</option>
                                    </optgroup>
                                    <optgroup label={t("offline_collection")}>
                                        <option value="Cash">{t("cash")}</option>
                                        <option value="Bank Transfer">{t("bank_transfer")}</option>
                                        <option value="Cheque">{t("cheque")}</option>
                                        <option value="DD">{t("demand_draft")}</option>
                                    </optgroup>
                                </select>
                            </div>

                            {/* Payment Note */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {t("note_label")}
                                </label>
                                <div className="relative">
                                    <FileText className="absolute left-3.5 top-3 h-3.5 w-3.5 text-muted-foreground" />
                                    <textarea
                                        className="flex min-h-[75px] w-full rounded-xl border border-border/80 bg-background pl-9 pr-3 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none shadow-none"
                                        placeholder={t("payment_note_placeholder")}
                                        value={paymentData.note}
                                        onChange={(e) => setPaymentData({ ...paymentData, note: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <DialogFooter className="px-6 py-3.5 sm:px-7 sm:py-4 bg-muted/20 border-t border-border flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 shrink-0">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full sm:w-auto h-9 sm:h-10 px-5 text-xs font-bold rounded-xl border-border cursor-pointer"
                                onClick={() => setIsPaymentDialogOpen(false)}
                            >
                                {t("cancel")}
                            </Button>
                            <Button
                                type="submit"
                                className="w-full sm:w-auto h-9 sm:h-10 px-6 rounded-xl font-bold text-xs bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white shadow-md shadow-indigo-500/20 cursor-pointer border-none"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
                                {t("complete_payment")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
