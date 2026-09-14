"use client";

import {
    Search,
    FileText,
    FileSpreadsheet,
    FileCode,
    Printer,
    Eye,
    ChevronDown,
    Wallet,
    CheckCircle2,
    XCircle,
    Clock,
    Loader2,
    Check,
    X,
    ExternalLink,
    Landmark,
    Download,
    Copy,
    Zap,
    AlertCircle,
    User,
    RefreshCw
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn, formatDate, toLocaleNumber } from "@/lib/utils";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useState, useEffect, useCallback, useMemo } from "react";
import api from "@/lib/api";
import { sanitizeHtml } from "@/lib/sanitize";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas-pro";
import { useSettings } from "@/components/providers/settings-provider";

interface OfflinePayment {
    id: number;
    amount: number;
    payment_date: string;
    reference_no: string;
    bank_name: string;
    bank_account_no: string;
    screenshot: string | null;
    status: "pending" | "approved" | "rejected" | string;
    status_date: string | null;
    rejection_reason: string | null;
    student?: {
        name?: string;
        last_name?: string;
        admission_no?: string;
        school_class?: { name?: string; class?: string };
        schoolClass?: { name?: string; class?: string };
        section?: { name?: string; section?: string };
    } | null;
    student_fee_master?: {
        fee_master?: {
            fee_type?: { name?: string };
            fee_group?: { name?: string };
        };
    };
    course?: {
        title?: string;
    };
    action_by?: {
        name?: string;
        last_name?: string;
    };
}

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <TableRow key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-4">
                            <div
                                className="h-4 rounded-md bg-muted/60 animate-pulse"
                                style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }}
                            />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export default function OfflineBankPaymentsPage() {
    const [payments, setPayments] = useState<OfflinePayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPayment, setSelectedPayment] = useState<OfflinePayment | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isRejectMode, setIsRejectMode] = useState(false);
    const [copiedRef, setCopiedRef] = useState(false);
    const [processing, setProcessing] = useState(false);

    const { t, language } = useTranslation();
    const shortCode = language?.short_code || "en";
    const tt = useTranslateToast();
    const { symbol, formatCurrency } = useCurrencyFormatter();
    const { settings } = useSettings();

    const getLocalizedClassName = (name?: string) => {
        if (!name || name === "-") return "-";
        const num = name.replace(/[^0-9]/g, "");
        if (num) {
            const locNum = toLocaleNumber(num, shortCode);
            if (shortCode === "bn") return `ক্লাস ${locNum}`;
            if (shortCode === "hi") return `कक्षा ${locNum}`;
            if (shortCode === "ar") return `الصف ${locNum}`;
            return `Class ${locNum}`;
        }
        const key = name.toLowerCase().replace(/[\s-]+/g, "_");
        const trans = t(key);
        return trans !== key ? trans : name;
    };

    const getLocalizedSectionName = (name?: string) => {
        if (!name || name === "-") return "-";
        const secLabel = shortCode === "bn" ? "শাখা" : shortCode === "hi" ? "अनुभाग" : shortCode === "ar" ? "قسم" : "Section";
        const key = name.toLowerCase().replace(/[\s-]+/g, "_");
        const trans = t(key);
        if (trans !== key) return `${secLabel} ${trans}`;
        return `${secLabel} ${name}`;
    };

    const [invoiceData, setInvoiceData] = useState<{
        type: string;
        id: number;
        trx_id?: number | string;
        date: string;
        reference_no?: string;
        bank_name?: string;
        bank_account_no?: string;
        studentName: string;
        admissionNo: string;
        className?: string;
        detail: string;
        amount: number;
    } | null>(null);

    const [printSettings, setPrintSettings] = useState<{
        header_image_base64?: string;
        footer_content?: string;
        type?: string;
    } | null>(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);

    const copyReferenceNo = (ref: string) => {
        if (!ref) return;
        navigator.clipboard.writeText(ref);
        setCopiedRef(true);
        tt.success("reference_copied");
        setTimeout(() => setCopiedRef(false), 2000);
    };

    const fetchPayments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("/fee-collection/offline-payments", {
                params: { status: filterStatus === "all" ? undefined : filterStatus }
            });
            setPayments(res.data.data || []);
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            tt.error(err.response?.data?.message || "failed_to_fetch_payments");
        } finally {
            setLoading(false);
        }
    }, [filterStatus, tt]);

    useEffect(() => {
        fetchPayments();
        setCurrentPage(1);
    }, [fetchPayments]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // Statistics calculations
    const stats = useMemo(() => {
        const totalCount = payments.length;
        const pendingCount = payments.filter(p => (p.status || '').toLowerCase() === 'pending').length;
        const approvedCount = payments.filter(p => (p.status || '').toLowerCase() === 'approved').length;
        const rejectedCount = payments.filter(p => (p.status || '').toLowerCase() === 'rejected').length;

        const totalAmount = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
        const approvedAmount = payments
            .filter(p => (p.status || '').toLowerCase() === 'approved')
            .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
        const pendingAmount = payments
            .filter(p => (p.status || '').toLowerCase() === 'pending')
            .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

        return {
            totalCount,
            pendingCount,
            approvedCount,
            rejectedCount,
            totalAmount,
            approvedAmount,
            pendingAmount
        };
    }, [payments]);

    const handleApprove = async () => {
        if (!selectedPayment) return;
        setProcessing(true);
        try {
            await api.post(`/fee-collection/offline-payments/${selectedPayment.id}/approve`);
            tt.success("payment_approved_and_applied_to_student_records");
            setIsDetailsOpen(false);
            fetchPayments();
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            tt.error(err.response?.data?.message || "failed_to_approve_payment");
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedPayment || !rejectionReason.trim()) {
            tt.error("please_provide_a_reason_for_rejection");
            return;
        }
        setProcessing(true);
        try {
            await api.post(`/fee-collection/offline-payments/${selectedPayment.id}/reject`, {
                rejection_reason: rejectionReason
            });
            tt.success("payment_rejected_and_student_notified");
            setIsDetailsOpen(false);
            fetchPayments();
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            tt.error(err.response?.data?.message || "failed_to_reject_payment");
        } finally {
            setProcessing(false);
        }
    };

    const filteredPayments = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return payments;
        return payments.filter(p =>
            (p.student?.name || '')?.toLowerCase().includes(query) ||
            (p.student?.last_name || '')?.toLowerCase().includes(query) ||
            (p.student?.admission_no || '')?.toString().toLowerCase().includes(query) ||
            (p.reference_no || '')?.toLowerCase().includes(query) ||
            (p.bank_name || '')?.toLowerCase().includes(query) ||
            (p.id?.toString() || '').includes(query)
        );
    }, [payments, searchQuery]);

    const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));
    const paginatedPayments = filteredPayments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handlePrint = () => { window.print(); };

    const handleExportExcel = () => {
        const data = filteredPayments.map(p => ({
            [t("request_id")]: `#${p.id}`,
            [t("student_name")]: p.student ? `${p.student.name || ''} ${p.student.last_name || ''}`.trim() : 'N/A',
            [t("adm_no")]: p.student?.admission_no || 'N/A',
            [t("class_section")]: p.student ? `${p.student.school_class?.name || p.student.school_class?.class || p.student.schoolClass?.name || p.student.schoolClass?.class || 'N/A'} (${p.student.section?.name || p.student.section?.section || 'N/A'})` : 'N/A',
            [t("fee_type")]: p.course ? `${t("course_purchase_label")}: ${p.course.title || ''}` : (p.student_fee_master?.fee_master?.fee_type?.name || t("general_payment")),
            [t("transaction_id_reference")]: p.reference_no || 'N/A',
            [t("payment_date")]: p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-GB') : 'N/A',
            [t("gateway_bank")]: p.bank_name || 'N/A',
            [t("account_no")]: p.bank_account_no || 'N/A',
            [`${t("amount")} (${symbol})`]: p.amount || 0,
            [t("status")]: p.status || ''
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Offline Payments");
        XLSX.writeFile(workbook, "offline_payments.xlsx");
        tt.success("exported_to_excel");
    };

    const handleExportCSV = () => {
        const data = filteredPayments.map(p => ({
            [t("request_id")]: `#${p.id}`,
            [t("student_name")]: p.student ? `${p.student.name || ''} ${p.student.last_name || ''}`.trim() : 'N/A',
            [t("adm_no")]: p.student?.admission_no || 'N/A',
            [t("class_section")]: p.student ? `${p.student.school_class?.name || p.student.school_class?.class || p.student.schoolClass?.name || p.student.schoolClass?.class || 'N/A'} (${p.student.section?.name || p.student.section?.section || 'N/A'})` : 'N/A',
            [t("fee_type")]: p.course ? `${t("course_purchase_label")}: ${p.course.title || ''}` : (p.student_fee_master?.fee_master?.fee_type?.name || t("general_payment")),
            [t("transaction_id_reference")]: p.reference_no || 'N/A',
            [t("payment_date")]: p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-GB') : 'N/A',
            [t("gateway_bank")]: p.bank_name || 'N/A',
            [t("account_no")]: p.bank_account_no || 'N/A',
            [`${t("amount")} (${symbol})`]: p.amount || 0,
            [t("status")]: p.status || ''
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "offline_payments.csv";
        link.click();
        tt.success("exported_to_csv");
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text(t("offline_bank_payments_report"), 14, 15);
        const tableColumn = [t("request_id"), t("student_name"), t("payment_info"), `${t("amount")} (${symbol})`, t("status")];
        const tableRows = filteredPayments.map(p => [
            `#${p.id}`,
            p.student ? `${p.student.name || ''} ${p.student.last_name || ''}`.trim() : 'N/A',
            p.course ? `${t("course_purchase_label")}: ${p.course.title || ''} (${t("ref_label")}: ${p.reference_no || 'N/A'})` : `${p.student_fee_master?.fee_master?.fee_type?.name || t("general_payment")} (${t("ref_label")}: ${p.reference_no || 'N/A'})`,
            `${symbol}${(Number(p.amount) || 0).toFixed(2)}`,
            p.status || ''
        ]);
        autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
        doc.save("offline_payments.pdf");
        tt.success("exported_to_pdf");
    };

    const downloadPaymentInvoice = async (payment: OfflinePayment) => {
        let currentSettings = printSettings;
        if (!currentSettings) {
            try {
                const res = await api.get('system-setting/print-settings');
                if (res.data?.status === 'success') {
                    const list = Array.isArray(res.data.data) ? res.data.data : [];
                    const invoiceSetting = list.find((s: { type?: string }) => s.type === 'Invoice');
                    setPrintSettings(invoiceSetting);
                    currentSettings = invoiceSetting;
                }
            } catch {
                // fallback gracefully
            }
        }

        const paymentType = payment.course 
            ? `${t("course_purchase_label")}: ${payment.course.title || ''}` 
            : (payment.student_fee_master?.fee_master?.fee_type?.name || t("general_payment"));

        const studentClass = payment.student
            ? `${payment.student.school_class?.name || payment.student.school_class?.class || payment.student.schoolClass?.name || payment.student.schoolClass?.class || ''} ${payment.student.section?.name ? `(${payment.student.section.name})` : ''}`.trim()
            : 'N/A';

        setInvoiceData({
            type: 'bank',
            id: payment.id,
            trx_id: payment.id,
            date: payment.payment_date,
            reference_no: payment.reference_no || 'N/A',
            bank_name: payment.bank_name || 'UddoktaPay',
            bank_account_no: payment.bank_account_no || 'N/A',
            studentName: payment.student ? `${payment.student.name || ''} ${payment.student.last_name || ''}`.trim() : 'N/A',
            admissionNo: payment.student?.admission_no || 'N/A',
            className: studentClass || undefined,
            detail: paymentType,
            amount: payment.amount || 0,
        });

        setTimeout(async () => {
            const element = document.getElementById('modern-invoice-template-bank');
            if (element) {
                try {
                    const canvas = await html2canvas(element, { scale: 2, useCORS: true, allowTaint: true });
                    const imgData = canvas.toDataURL('image/jpeg', 1.0);
                    const pdf = new jsPDF();
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                    pdf.save(`invoice_${payment.id}.pdf`);
                    tt.success("invoice_downloaded");
                } catch (error: unknown) {
                    const err = error as { message?: string };
                    console.error("PDF Gen Error:", err);
                    tt.error(`Failed to generate PDF: ${err.message || 'Unknown error'}`);
                } finally {
                    setInvoiceData(null);
                }
            }
        }, 500);
    };

    const getStatusBadge = (status: string) => {
        const normalized = (status || '').toLowerCase();
        switch (normalized) {
            case "pending":
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[11px] font-bold">
                        <Clock className="h-3.5 w-3.5 animate-pulse" /> {t("pending")}
                    </span>
                );
            case "approved":
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[11px] font-bold">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {t("approved")}
                    </span>
                );
            case "rejected":
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20 text-[11px] font-bold">
                        <XCircle className="h-3.5 w-3.5" /> {t("rejected")}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium">
                        {status}
                    </span>
                );
        }
    };

    return (
        <div className="p-3 sm:p-5 pt-1 sm:pt-2 space-y-4 max-w-[1600px] mx-auto animate-in fade-in duration-300">
            {/* Top Page Header Card with Gradient Colors */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] overflow-hidden p-0">
                <div className="flex flex-row items-center justify-between gap-3 px-5 py-3.5 sm:px-6 sm:py-4">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-md">
                            <Landmark className="h-5 w-5 sm:h-6 sm:w-6" />
                        </span>
                        <div>
                            <CardTitle className="text-lg sm:text-xl font-bold tracking-tight text-slate-800 leading-none">
                                {t("offline_bank_payments")}
                            </CardTitle>
                            <p className="text-xs text-slate-600 mt-1 font-medium">
                                {t("verify_and_manage_fee_payments")}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={fetchPayments}
                            disabled={loading}
                            className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white shadow-md shadow-indigo-500/20 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer border-none"
                        >
                            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin text-white")} />
                            <span>{t("refresh")}</span>
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Quick KPI Overview Cards with Rich Vibrant Full Gradients */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Total Requests */}
                <div
                    onClick={() => setFilterStatus("all")}
                    className={cn(
                        "p-4 sm:p-5 rounded-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden text-white shadow-md",
                        "bg-gradient-to-br from-[#4F46E5] via-[#6366F1] to-[#818CF8]",
                        filterStatus === "all"
                            ? "ring-4 ring-indigo-300 shadow-xl shadow-indigo-500/30 scale-[1.02]"
                            : "hover:scale-[1.01] hover:shadow-lg opacity-95 hover:opacity-100"
                    )}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-white/90 tracking-wide uppercase">
                            {t("total_requests")}
                        </span>
                        <span className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-xs">
                            <Landmark className="h-4 w-4 sm:h-5 sm:w-5" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
                            {toLocaleNumber(stats.totalCount, shortCode)}
                        </div>
                        <p className="text-xs text-white/80 font-semibold mt-1.5 flex items-center gap-1">
                            <span>{formatCurrency(stats.totalAmount)}</span>
                            <span>{t("total_x", { amount: "" })?.replace(":", "")}</span>
                        </p>
                    </div>
                </div>

                {/* Pending Review */}
                <div
                    onClick={() => setFilterStatus("pending")}
                    className={cn(
                        "p-4 sm:p-5 rounded-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden text-white shadow-md",
                        "bg-gradient-to-br from-[#D97706] via-[#F59E0B] to-[#FBBF24]",
                        filterStatus === "pending"
                            ? "ring-4 ring-amber-300 shadow-xl shadow-amber-500/30 scale-[1.02]"
                            : "hover:scale-[1.01] hover:shadow-lg opacity-95 hover:opacity-100"
                    )}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-white/95 tracking-wide uppercase flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                            {t("pending_review")}
                        </span>
                        <span className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-xs">
                            <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
                            {toLocaleNumber(stats.pendingCount, shortCode)}
                        </div>
                        <p className="text-xs text-white/85 font-semibold mt-1.5 flex items-center gap-1">
                            <span>{formatCurrency(stats.pendingAmount)}</span>
                            <span>{t("pending")}</span>
                        </p>
                    </div>
                </div>

                {/* Approved */}
                <div
                    onClick={() => setFilterStatus("approved")}
                    className={cn(
                        "p-4 sm:p-5 rounded-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden text-white shadow-md",
                        "bg-gradient-to-br from-[#059669] via-[#10B981] to-[#34D399]",
                        filterStatus === "approved"
                            ? "ring-4 ring-emerald-300 shadow-xl shadow-emerald-500/30 scale-[1.02]"
                            : "hover:scale-[1.01] hover:shadow-lg opacity-95 hover:opacity-100"
                    )}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-white/95 tracking-wide uppercase">
                            {t("approved")}
                        </span>
                        <span className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-xs">
                            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
                            {toLocaleNumber(stats.approvedCount, shortCode)}
                        </div>
                        <p className="text-xs text-white/85 font-semibold mt-1.5 flex items-center gap-1">
                            <span>{formatCurrency(stats.approvedAmount)}</span>
                            <span>{t("total_collected")}</span>
                        </p>
                    </div>
                </div>

                {/* Rejected */}
                <div
                    onClick={() => setFilterStatus("rejected")}
                    className={cn(
                        "p-4 sm:p-5 rounded-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden text-white shadow-md",
                        "bg-gradient-to-br from-[#E11D48] via-[#F43F5E] to-[#FB7185]",
                        filterStatus === "rejected"
                            ? "ring-4 ring-rose-300 shadow-xl shadow-rose-500/30 scale-[1.02]"
                            : "hover:scale-[1.01] hover:shadow-lg opacity-95 hover:opacity-100"
                    )}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-white/95 tracking-wide uppercase">
                            {t("rejected")}
                        </span>
                        <span className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-xs">
                            <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
                            {toLocaleNumber(stats.rejectedCount, shortCode)}
                        </div>
                        <p className="text-xs text-white/85 font-semibold mt-1.5">
                            {t("disapproved")}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card overflow-hidden pt-0">
                {/* Header Filled by Signature Gradient */}
                <CardHeader className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-200/70">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Landmark className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-base sm:text-lg font-bold tracking-tight text-slate-800 leading-none">
                                {t("payment_requests")}
                            </CardTitle>
                            <p className="text-xs text-slate-500 font-medium mt-1">
                                {t("x_payments_found", { count: toLocaleNumber(filteredPayments.length, shortCode) })}
                            </p>
                        </div>
                    </div>

                    {/* Filter Segmented Pill Buttons */}
                    <div className="flex items-center flex-wrap gap-1.5 bg-white/80 dark:bg-card/80 p-1 rounded-xl border border-gray-200/80 dark:border-border shadow-xs backdrop-blur-xs">
                        {[
                            { key: 'all', label: t("all"), count: stats.totalCount },
                            { key: 'pending', label: t("pending"), count: stats.pendingCount },
                            { key: 'approved', label: t("approved"), count: stats.approvedCount },
                            { key: 'rejected', label: t("rejected"), count: stats.rejectedCount },
                        ].map(({ key, label, count }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setFilterStatus(key)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer",
                                    filterStatus === key
                                        ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                                )}
                            >
                                <span>{label}</span>
                                <span
                                    className={cn(
                                        "px-1.5 py-0.2 rounded-full text-[10px] font-black leading-tight",
                                        filterStatus === key
                                            ? "bg-white/25 text-white"
                                            : "bg-slate-200/80 text-slate-700"
                                    )}
                                >
                                    {toLocaleNumber(count, shortCode)}
                                </span>
                            </button>
                        ))}
                    </div>
                </CardHeader>

                <div className="p-4 sm:p-6 space-y-4">
                    {/* Toolbar: Search, Rows, Export */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t("search_by_name_admission_no_or_ref")}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-9 h-10 rounded-lg bg-background border-border/80 focus-visible:ring-primary/20 text-xs sm:text-sm"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-3 self-end md:self-auto">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                <span>{t("show")}:</span>
                                <select
                                    value={pageSize === Number.MAX_SAFE_INTEGER ? "All" : pageSize}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setPageSize(val === "All" ? Number.MAX_SAFE_INTEGER : Number(val));
                                        setCurrentPage(1);
                                    }}
                                    className="h-9 px-2.5 rounded-lg border border-border/80 bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                                >
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                    <option value="All">{t("all")}</option>
                                </select>
                            </div>

                            <div className="h-6 w-px bg-border/60" />

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleExportExcel}
                                    className="h-9 w-9 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg border-border/80 cursor-pointer"
                                    title={t("excel")}
                                >
                                    <FileSpreadsheet className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleExportCSV}
                                    className="h-9 w-9 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg border-border/80 cursor-pointer"
                                    title={t("csv")}
                                >
                                    <FileText className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleExportPDF}
                                    className="h-9 w-9 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg border-border/80 cursor-pointer"
                                    title={t("pdf")}
                                >
                                    <FileCode className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handlePrint}
                                    className="h-9 w-9 text-muted-foreground hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-lg border-border/80 cursor-pointer"
                                    title={t("print")}
                                >
                                    <Printer className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="rounded-xl border border-border/70 overflow-hidden bg-background shadow-2xs">
                        <div className="overflow-x-auto">
                            <Table className="w-full">
                                <TableHeader className="!bg-[#f1f5f9] dark:!bg-slate-800 text-[11px] uppercase font-bold text-slate-700 dark:text-slate-200 border-b border-gray-200">
                                    <TableRow className="hover:bg-transparent border-b border-gray-200">
                                        <TableHead className="py-3.5 pl-5 font-bold text-slate-700 dark:text-slate-200 text-xs whitespace-nowrap w-24">
                                            {t("request_id")}
                                        </TableHead>
                                        <TableHead className="py-3.5 font-bold text-slate-700 dark:text-slate-200 text-xs whitespace-nowrap min-w-[200px]">
                                            {t("student_detail")}
                                        </TableHead>
                                        <TableHead className="py-3.5 font-bold text-slate-700 dark:text-slate-200 text-xs whitespace-nowrap min-w-[240px]">
                                            {t("payment_info")}
                                        </TableHead>
                                        <TableHead className="py-3.5 font-bold text-slate-700 dark:text-slate-200 text-xs whitespace-nowrap text-right min-w-[120px]">
                                            {t("amount")} ({symbol})
                                        </TableHead>
                                        <TableHead className="py-3.5 font-bold text-slate-700 dark:text-slate-200 text-xs whitespace-nowrap text-center min-w-[130px]">
                                            {t("status")}
                                        </TableHead>
                                        <TableHead className="py-3.5 pr-5 font-bold text-slate-700 dark:text-slate-200 text-xs whitespace-nowrap text-center w-28">
                                            {t("action")}
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-border/50">
                                    {loading ? (
                                        <TableSkeleton rows={6} cols={6} />
                                    ) : paginatedPayments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-16 text-center">
                                                <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                                                    <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center">
                                                        <Wallet className="h-6 w-6 text-muted-foreground/60" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-base text-foreground">
                                                            {t("no_payment_requests_found")}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {t("add_new_record_or_search_different_criteria")}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedPayments.map((payment) => {
                                            const studentFullName = payment.student
                                                ? `${payment.student.name || ''} ${payment.student.last_name || ''}`.trim()
                                                : 'N/A';
                                            const studentClass = payment.student?.school_class?.name ||
                                                payment.student?.school_class?.class ||
                                                payment.student?.schoolClass?.name ||
                                                payment.student?.schoolClass?.class || '';
                                            const studentSection = payment.student?.section?.name ||
                                                payment.student?.section?.section || '';
                                            const firstLetter = (payment.student?.name || 'S').charAt(0).toUpperCase();

                                            return (
                                                <TableRow
                                                    key={payment.id}
                                                    className="hover:bg-muted/30 transition-colors group"
                                                >
                                                    {/* Request ID */}
                                                    <TableCell className="py-3.5 pl-5 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                                        #{toLocaleNumber(payment.id, shortCode)}
                                                    </TableCell>

                                                    {/* Student Detail */}
                                                    <TableCell className="py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-500/20">
                                                                {firstLetter}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                                                                    {studentFullName}
                                                                </p>
                                                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                                                                    <span className="font-mono">
                                                                        {t("admission_no") || t("adm_no")}: {payment.student?.admission_no || 'N/A'}
                                                                    </span>
                                                                    {(studentClass || studentSection) && (
                                                                        <>
                                                                            <span>•</span>
                                                                            <span className="px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-medium">
                                                                                {getLocalizedClassName(studentClass)}{studentSection ? ` (${getLocalizedSectionName(studentSection)})` : ''}
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Payment Info */}
                                                    <TableCell className="py-3.5">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-xs font-semibold text-foreground">
                                                                    {payment.course
                                                                        ? `${t("course_purchase_label")}: ${payment.course.title}`
                                                                        : (payment.student_fee_master?.fee_master?.fee_type?.name || t("general_payment"))}
                                                                </p>
                                                                {payment.bank_name?.toLowerCase().includes('uddokta') ? (
                                                                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 px-1.5 py-0.2 rounded border border-amber-300/40 flex items-center gap-1">
                                                                        <Zap className="h-3 w-3" /> UddoktaPay
                                                                    </span>
                                                                ) : payment.bank_name ? (
                                                                    <span className="text-[10px] font-medium bg-muted text-muted-foreground px-1.5 py-0.2 rounded">
                                                                        {payment.bank_name}
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                                                <span className="font-mono bg-muted/60 px-1.5 py-0.5 rounded text-foreground/80 font-medium">
                                                                    {t("ref_label")}: {payment.reference_no || 'N/A'}
                                                                </span>
                                                                <span>•</span>
                                                                <span>
                                                                    {payment.payment_date ? formatDate(payment.payment_date) : 'N/A'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Amount */}
                                                    <TableCell className="py-3.5 text-right font-black text-sm text-foreground">
                                                        {formatCurrency(payment.amount || 0)}
                                                    </TableCell>

                                                    {/* Status Badge */}
                                                    <TableCell className="py-3.5 text-center">
                                                        {getStatusBadge(payment.status)}
                                                    </TableCell>

                                                    {/* Action Buttons */}
                                                    <TableCell className="py-3.5 pr-5 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            {payment.status === 'approved' && (
                                                                <Button
                                                                    size="icon"
                                                                    variant="outline"
                                                                    onClick={() => downloadPaymentInvoice(payment)}
                                                                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted border-border/80 transition-transform active:scale-95 cursor-pointer"
                                                                    title={t("download_receipt")}
                                                                >
                                                                    <Download className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                            <Button
                                                                size="icon"
                                                                onClick={() => {
                                                                    setSelectedPayment(payment);
                                                                    setRejectionReason("");
                                                                    setIsRejectMode(false);
                                                                    setCopiedRef(false);
                                                                    setIsDetailsOpen(true);
                                                                }}
                                                                className="h-8 w-8 rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs hover:opacity-95 transition-transform active:scale-95 cursor-pointer"
                                                                title={t("view_details")}
                                                             >
                                                                <Eye className="h-3.5 w-3.5" />
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
                    </div>

                    {/* Pagination */}
                    {filteredPayments.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                            <p className="text-xs text-muted-foreground font-medium">
                                {t("showing_x_to_y_of_z", {
                                    from: toLocaleNumber(Math.min((currentPage - 1) * pageSize + 1, filteredPayments.length), shortCode),
                                    to: toLocaleNumber(Math.min(currentPage * pageSize, filteredPayments.length), shortCode),
                                    total: toLocaleNumber(filteredPayments.length, shortCode)
                                })}
                            </p>
                            <div className="flex items-center gap-1.5">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    className="h-8 px-3 rounded-lg border-border/80 text-xs font-semibold cursor-pointer"
                                >
                                    {t("previous")}
                                </Button>
                                <div className="px-3 py-1 text-xs font-bold bg-muted rounded-lg text-foreground">
                                    {toLocaleNumber(currentPage, shortCode)} / {toLocaleNumber(totalPages, shortCode)}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    className="h-8 px-3 rounded-lg border-border/80 text-xs font-semibold cursor-pointer"
                                >
                                    {t("next")}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Details & Verification Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-[760px] max-h-[92vh] p-0 flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                    {/* Header */}
                    <DialogHeader className="px-6 py-5 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shrink-0">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md border border-white/30 shrink-0 text-white">
                                    {selectedPayment?.bank_name?.toLowerCase().includes('uddokta') ? (
                                        <Zap className="h-6 w-6 text-amber-300" />
                                    ) : (
                                        <Landmark className="h-6 w-6" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <DialogTitle className="text-lg font-bold text-white leading-snug">
                                        {t("payment_submission_details")}
                                    </DialogTitle>
                                    <DialogDescription className="text-white/85 text-xs font-medium truncate mt-0.5">
                                        {selectedPayment?.student
                                            ? `${selectedPayment.student.name || ''} ${selectedPayment.student.last_name || ''}`.trim()
                                            : t("student_fee_submission")}
                                        {selectedPayment?.student?.admission_no && ` • ${t("admission_no") || t("adm_no")}: #${selectedPayment.student.admission_no}`}
                                    </DialogDescription>
                                </div>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                                <span className="text-xl sm:text-2xl font-black text-white leading-none">
                                    {formatCurrency(selectedPayment?.amount || 0)}
                                </span>
                                <div className="mt-1.5">
                                    {getStatusBadge(selectedPayment?.status || '')}
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Scrollable Modal Body */}
                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                        {/* Student & Fee Summary Card */}
                        <div className="p-4 bg-muted/40 border border-border/80 rounded-xl space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5 text-indigo-500" /> {t("student_fee_details")}
                                </span>
                                {selectedPayment?.course ? (
                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                                        {t("online_courses")}
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-bold text-foreground bg-background px-2 py-0.5 rounded border border-border">
                                        {selectedPayment?.student_fee_master?.fee_master?.fee_group?.name || t("fees_group")}
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                                <div>
                                    <span className="text-[11px] text-muted-foreground block">{t("student_name")}</span>
                                    <p className="font-bold text-foreground">
                                        {selectedPayment?.student
                                            ? `${selectedPayment.student.name || ''} ${selectedPayment.student.last_name || ''}`.trim()
                                            : "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[11px] text-muted-foreground block">{t("class_section")}</span>
                                    <p className="font-bold text-foreground">
                                        {getLocalizedClassName(selectedPayment?.student?.school_class?.name || selectedPayment?.student?.school_class?.class || selectedPayment?.student?.schoolClass?.name || selectedPayment?.student?.schoolClass?.class || "N/A")}
                                        {selectedPayment?.student?.section?.name ? ` (${getLocalizedSectionName(selectedPayment.student.section.name)})` : ""}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[11px] text-muted-foreground block">{t("fee_type")}</span>
                                    <p className="font-bold text-indigo-600 dark:text-indigo-400">
                                        {selectedPayment?.course?.title
                                            ? `${t("course_purchase_label")}: ${selectedPayment.course.title}`
                                            : selectedPayment?.student_fee_master?.fee_master?.fee_type?.name || t("general_payment")}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Transaction & Proof Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Left: Transaction Info */}
                            <div className="space-y-3 p-4 rounded-xl bg-background border border-border/80 shadow-xs">
                                <span className="text-xs font-bold text-foreground block">
                                    {t("payment_method_and_ref_info")}
                                </span>

                                <div className="space-y-1">
                                    <span className="text-[11px] text-muted-foreground">{t("gateway_bank")}</span>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-foreground">
                                            {selectedPayment?.bank_name || 'N/A'}
                                        </p>
                                        {selectedPayment?.bank_name?.toLowerCase().includes('uddokta') ? (
                                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-300/40">
                                                {t("online_gateway_mode")}
                                            </span>
                                        ) : selectedPayment?.bank_account_no && selectedPayment.bank_account_no !== 'N/A' ? (
                                            <span className="text-[10px] font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border">
                                                {t("offline_bank_payments")}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-[11px] text-muted-foreground">{t("transaction_id_reference")}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 select-all">
                                            {selectedPayment?.reference_no || 'N/A'}
                                        </span>
                                        {selectedPayment?.reference_no && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => copyReferenceNo(selectedPayment.reference_no)}
                                                className="h-7 px-2 text-xs font-bold text-muted-foreground hover:text-indigo-600 cursor-pointer"
                                                title={t("copy_reference")}
                                            >
                                                {copiedRef ? (
                                                    <><Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> {t("copied")}</>
                                                ) : (
                                                    <><Copy className="h-3.5 w-3.5 mr-1" /> {t("copy_reference")}</>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
                                    <div>
                                        <span className="text-[11px] text-muted-foreground block">{t("account_no")}</span>
                                        <p className="font-semibold text-foreground font-mono">
                                            {selectedPayment?.bank_account_no || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-muted-foreground block">{t("payment_date")}</span>
                                        <p className="font-semibold text-foreground">
                                            {selectedPayment?.payment_date ? formatDate(selectedPayment.payment_date) : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Screenshot / Proof Card */}
                            <div className="space-y-2 p-4 rounded-xl bg-background border border-border/80 shadow-xs flex flex-col">
                                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                    <FileText className="h-3.5 w-3.5 text-indigo-500" /> {t("payment_proof_or_screenshot")}
                                </span>

                                <div className="flex-1 min-h-[140px] rounded-lg bg-muted/30 border-2 border-dashed border-border flex items-center justify-center overflow-hidden relative group/img">
                                    {selectedPayment?.screenshot ? (
                                        <>
                                            <img
                                                src={selectedPayment.screenshot}
                                                alt={t("payment_proof_or_screenshot")}
                                                className="w-full h-full object-cover transition-transform group-hover/img:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <a
                                                    href={selectedPayment.screenshot}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 bg-white rounded-full text-slate-900 hover:bg-slate-100 shadow-lg transition-colors flex items-center gap-1.5 text-xs font-bold"
                                                >
                                                    <ExternalLink className="h-3.5 w-3.5" /> {t("view_full_image")}
                                                </a>
                                            </div>
                                        </>
                                    ) : selectedPayment?.bank_name?.toLowerCase().includes('uddokta') || selectedPayment?.reference_no ? (
                                        <div className="p-4 text-center space-y-1.5">
                                            <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                                                <Zap className="h-5 w-5 text-amber-500" />
                                            </div>
                                            <p className="text-xs font-bold text-foreground">{t("online_gateway_submission")}</p>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                {t("transaction_id")}: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{selectedPayment?.reference_no}</strong>
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1 text-muted-foreground p-4 text-center">
                                            <XCircle className="h-7 w-7 text-muted-foreground/50" />
                                            <span className="text-xs font-medium">{t("no_screenshot_uploaded")}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Status Notices */}
                        {((selectedPayment?.status || '').toLowerCase() === 'approved') && (
                            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2.5">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <div>
                                    <strong className="font-bold">{t("payment_approved_status_desc")}</strong>
                                    {selectedPayment?.status_date && (
                                        <span className="block text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                                            {formatDate(selectedPayment.status_date)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {((selectedPayment?.status || '').toLowerCase() === 'rejected') && (
                            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-2.5">
                                <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                    <strong className="font-bold text-rose-800 dark:text-rose-300">{t("payment_rejected_status_desc")}</strong>
                                    <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">
                                        {t("reason")}: {selectedPayment?.rejection_reason || t("no_reason_provided")}
                                    </p>
                                    {selectedPayment?.status_date && (
                                        <span className="block text-[10px] text-rose-600 dark:text-rose-400">
                                            {formatDate(selectedPayment.status_date)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Inline Rejection Drawer */}
                        {isRejectMode && ((selectedPayment?.status || '').toLowerCase() === 'pending') && (
                            <div className="p-4 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-3 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                                        <AlertCircle className="h-4 w-4 text-rose-600" /> {t("rejection_reason_required")}
                                    </span>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setIsRejectMode(false)}
                                        className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
                                    >
                                        {t("cancel")}
                                    </Button>
                                </div>
                                <Textarea
                                    placeholder={t("enter_rejection_reason_placeholder")}
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="min-h-[85px] bg-background border-rose-200 focus:border-rose-400 rounded-lg text-xs text-foreground font-medium resize-none shadow-none"
                                    autoFocus
                                />
                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsRejectMode(false)}
                                        className="h-8 text-xs font-semibold cursor-pointer"
                                    >
                                        {t("cancel")}
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={processing || !rejectionReason.trim()}
                                        onClick={handleReject}
                                        className="h-8 text-xs font-bold bg-destructive hover:bg-destructive/90 text-white shadow-xs cursor-pointer"
                                    >
                                        {processing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <X className="h-3.5 w-3.5 mr-1" />}
                                        {t("confirm_rejection")}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <DialogFooter className="px-6 py-4 bg-muted/20 border-t border-border flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 shrink-0">
                        <Button
                            variant="outline"
                            onClick={() => setIsDetailsOpen(false)}
                            className="w-full sm:w-auto h-9 sm:h-10 px-5 text-xs font-bold rounded-lg border-border cursor-pointer"
                        >
                            {t("close")}
                        </Button>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            {/* If Approved: Download Receipt */}
                            {((selectedPayment?.status || '').toLowerCase() === 'approved') && (
                                <Button
                                    type="button"
                                    onClick={() => selectedPayment && downloadPaymentInvoice(selectedPayment)}
                                    className="w-full sm:w-auto h-9 sm:h-10 px-5 rounded-lg font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Download className="h-3.5 w-3.5" /> {t("download_receipt")}
                                </Button>
                            )}

                            {/* If Pending: Reject & Approve Buttons */}
                            {((selectedPayment?.status || '').toLowerCase() === 'pending') && !isRejectMode && (
                                <>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsRejectMode(true)}
                                        disabled={processing}
                                        className="w-full sm:w-auto h-9 sm:h-10 px-4 rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 dark:hover:bg-rose-950/40 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                                    >
                                        <X className="h-3.5 w-3.5" /> {t("reject_payment")}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleApprove}
                                        disabled={processing}
                                        className="w-full sm:w-auto h-9 sm:h-10 px-6 rounded-lg font-bold text-xs bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white shadow-md shadow-indigo-500/20 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                                    >
                                        {processing ? (
                                            <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> {t("loading")}</>
                                        ) : (
                                            <><Check className="h-4 w-4 mr-1.5" /> {t("approve_and_apply_fee")}</>
                                        )}
                                    </Button>
                                </>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Hidden Invoice Template for PDF capture */}
            {invoiceData && (
                <div style={{ position: 'fixed', top: 0, left: 0, zIndex: -50, opacity: 0, pointerEvents: 'none' }}>
                    <div id="modern-invoice-template-bank" style={{
                        width: '800px',
                        backgroundColor: '#ffffff',
                        padding: '40px 48px 36px 48px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                        color: '#0f172a',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: '600px',
                        boxSizing: 'border-box'
                    }}>
                        <div>
                            {/* Header Section */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: '24px', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    {settings?.admin_logo ? (
                                        <img src={settings.admin_logo} alt="Logo" style={{ maxHeight: '56px', maxWidth: '160px', objectFit: 'contain' }} />
                                    ) : (
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '10px',
                                            background: 'linear-gradient(135deg, #FF9800 0%, #6366F1 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#ffffff',
                                            fontWeight: '800',
                                            fontSize: '22px'
                                        }}>
                                            {(settings?.school_name || 'S').charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <h1 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0', color: '#0f172a' }}>
                                            {settings?.school_name || 'Bhujpur Government Primary School'}
                                        </h1>
                                        <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 2px 0' }}>
                                            {settings?.school_address || 'Bhujpur, Fatikchhari, Chittagong, Bangladesh'}
                                        </p>
                                        <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                                            {settings?.school_phone ? `Phone: ${settings.school_phone}` : ''} {settings?.school_email ? `| Email: ${settings.school_email}` : ''}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{
                                        display: 'inline-block',
                                        fontSize: '11px',
                                        fontWeight: '800',
                                        letterSpacing: '0.08em',
                                        textTransform: 'uppercase',
                                        backgroundColor: '#eff6ff',
                                        color: '#3b82f6',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        marginBottom: '6px'
                                    }}>
                                        BANK RECEIPT
                                    </span>
                                    <p style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0' }}>
                                        Receipt #{invoiceData.id}
                                    </p>
                                    <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                                        Date: {invoiceData.date ? (invoiceData.date.includes('/') ? invoiceData.date : new Date(invoiceData.date).toLocaleDateString('en-GB')) : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                                <div style={{ backgroundColor: '#f8fafc', padding: '16px 20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px 0' }}>
                                        STUDENT INFORMATION
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                                        <div>
                                            <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '2px' }}>Name</span>
                                            <strong style={{ color: '#0f172a', fontSize: '12.5px' }}>{invoiceData.studentName}</strong>
                                        </div>
                                        <div>
                                            <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '2px' }}>Admission No</span>
                                            <strong style={{ color: '#0f172a', fontSize: '12.5px' }}>{invoiceData.admissionNo}</strong>
                                        </div>
                                        {invoiceData.className && (
                                            <div>
                                                <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '2px' }}>Class / Section</span>
                                                <strong style={{ color: '#0f172a', fontSize: '12.5px' }}>{invoiceData.className}</strong>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ backgroundColor: '#f8fafc', padding: '16px 20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                                            PAYMENT DETAILS
                                        </p>
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            height: '20px',
                                            padding: '0 8px',
                                            fontSize: '10px',
                                            fontWeight: '700',
                                            letterSpacing: '0.04em',
                                            borderRadius: '4px',
                                            backgroundColor: '#dcfce7',
                                            color: '#15803d'
                                        }}>
                                            PAID
                                        </span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                                        <div>
                                            <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '2px' }}>Bank / Gateway</span>
                                            <strong style={{ color: '#0f172a', fontSize: '12.5px' }}>{invoiceData.bank_name || 'UddoktaPay'}</strong>
                                        </div>
                                        <div>
                                            <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '2px' }}>Account No</span>
                                            <strong style={{ color: '#0f172a', fontSize: '12.5px' }}>{invoiceData.bank_account_no || 'N/A'}</strong>
                                        </div>
                                        <div>
                                            <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '2px' }}>Reference / Trx ID</span>
                                            <strong style={{ color: '#4f46e5', fontSize: '12.5px', fontFamily: 'ui-monospace, monospace' }}>{invoiceData.reference_no || 'N/A'}</strong>
                                        </div>
                                        <div>
                                            <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '2px' }}>Payment Date</span>
                                            <strong style={{ color: '#0f172a', fontSize: '12.5px' }}>{invoiceData.date ? (invoiceData.date.includes('/') ? invoiceData.date : new Date(invoiceData.date).toLocaleDateString('en-GB')) : 'N/A'}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div style={{ borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '20px' }}>
                                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                            <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</th>
                                            <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style={{ padding: '16px 18px', borderBottom: '1px solid #f1f5f9' }}>
                                                <p style={{ fontWeight: '600', color: '#0f172a', fontSize: '13px', margin: 0 }}>{invoiceData.detail}</p>
                                            </td>
                                            <td style={{ padding: '16px 18px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: '700', color: '#0f172a', fontSize: '13px' }}>
                                                {formatCurrency(invoiceData.amount)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Total Summary */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                                <div style={{ width: '280px', backgroundColor: '#f8fafc', borderRadius: '8px', padding: '16px 20px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#64748b' }}>Subtotal</span>
                                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{formatCurrency(invoiceData.amount)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #cbd5e1', marginTop: '8px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Total Paid</span>
                                        <span style={{ fontSize: '17px', fontWeight: '900', color: '#4f46e5' }}>{formatCurrency(invoiceData.amount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
                            {printSettings?.footer_content ? (
                                <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.5' }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(printSettings.footer_content) }} />
                            ) : (
                                <p style={{ fontSize: '11px', fontWeight: '500', color: '#94a3b8', margin: 0 }}>
                                    This is a computer-generated receipt. Thank you for your payment!
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
