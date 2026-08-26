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
    User
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
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
                        <TableCell key={j} className="py-5">
                            <div className="h-4 rounded-md bg-muted/60 animate-pulse"
                                style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }} />
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

    const copyReferenceNo = (ref: string) => {
        if (!ref) return;
        navigator.clipboard.writeText(ref);
        setCopiedRef(true);
        tt.success("copied_to_clipboard");
        setTimeout(() => setCopiedRef(false), 2000);
    };
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const { symbol, formatCurrency } = useCurrencyFormatter();
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
    const { settings } = useSettings();

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);

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
        if (!selectedPayment || !rejectionReason) {
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

    const filteredPayments = payments.filter(p =>
        p.student?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.student?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.student?.admission_no?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.reference_no?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredPayments.length / pageSize);
    const paginatedPayments = filteredPayments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handlePrint = () => { window.print(); };

    const handleExportExcel = () => {
        const data = filteredPayments.map(p => ({
            "Request ID": `#${p.id}`,
            "Student Name": p.student ? `${p.student.name || ''} ${p.student.last_name || ''}`.trim() : 'N/A',
            "Admission No": p.student?.admission_no || 'N/A',
            "Class & Section": p.student ? `${p.student.school_class?.name || p.student.school_class?.class || p.student.schoolClass?.name || p.student.schoolClass?.class || 'N/A'} (${p.student.section?.name || p.student.section?.section || 'N/A'})` : 'N/A',
            "Payment Fee Type": p.course ? `Course Purchase: ${p.course.title || ''}` : (p.student_fee_master?.fee_master?.fee_type?.name || 'General Payment'),
            "Reference No": p.reference_no || 'N/A',
            "Payment Date": p.payment_date ? new Date(p.payment_date).toLocaleDateString() : 'N/A',
            "Bank Name": p.bank_name || 'N/A',
            "Account No": p.bank_account_no || 'N/A',
            [`Amount (${symbol})`]: p.amount || 0,
            "Status": p.status || ''
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Offline Payments");
        XLSX.writeFile(workbook, "offline_payments.xlsx");
        tt.success("exported_to_excel");
    };

    const handleExportCSV = () => {
        const data = filteredPayments.map(p => ({
            "Request ID": `#${p.id}`,
            "Student Name": p.student ? `${p.student.name || ''} ${p.student.last_name || ''}`.trim() : 'N/A',
            "Admission No": p.student?.admission_no || 'N/A',
            "Class & Section": p.student ? `${p.student.school_class?.name || p.student.school_class?.class || p.student.schoolClass?.name || p.student.schoolClass?.class || 'N/A'} (${p.student.section?.name || p.student.section?.section || 'N/A'})` : 'N/A',
            "Payment Fee Type": p.course ? `Course Purchase: ${p.course.title || ''}` : (p.student_fee_master?.fee_master?.fee_type?.name || 'General Payment'),
            "Reference No": p.reference_no || 'N/A',
            "Payment Date": p.payment_date ? new Date(p.payment_date).toLocaleDateString() : 'N/A',
            "Bank Name": p.bank_name || 'N/A',
            "Account No": p.bank_account_no || 'N/A',
            [`Amount (${symbol})`]: p.amount || 0,
            "Status": p.status || ''
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
        const tableColumn = ["Request ID", "Student Name", "Payment Info", `Amount (${symbol})`, "Status"];
        const tableRows = filteredPayments.map(p => [
            `#${p.id}`,
            p.student ? `${p.student.name || ''} ${p.student.last_name || ''}`.trim() : 'N/A',
            p.course ? `Course Purchase: ${p.course.title || ''} (Ref: ${p.reference_no || 'N/A'})` : `${p.student_fee_master?.fee_master?.fee_type?.name || 'General Payment'} (Ref: ${p.reference_no || 'N/A'})`,
            `${symbol}${(p.amount || 0).toFixed(2)}`,
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
            ? `Course Purchase: ${payment.course.title || ''}` 
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
        switch (status) {
            case "pending":
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-wider"><Clock className="h-3 w-3" /> {t("pending")}</span>;
            case "approved":
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-wider"><CheckCircle2 className="h-3 w-3" /> {t("approved")}</span>;
            case "rejected":
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-wider"><XCircle className="h-3 w-3" /> {t("rejected")}</span>;
            default:
                return null;
        }
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{t("offline_bank_payments")}</h1>
                <p className="text-muted-foreground">{t("verify_and_manage_fee_payments")}</p>
            </div>

            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Landmark className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("payment_requests")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{filteredPayments.length} Payment{filteredPayments.length === 1 ? '' : 's'} Found</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/20 p-1 rounded-lg border border-muted/50">
                        {['all', 'pending', 'approved', 'rejected'].map((status) => (
                            <Button
                                key={status}
                                variant="ghost"
                                size="sm"
                                onClick={() => setFilterStatus(status)}
                                className={cn(
                                    "rounded-lg px-4 h-8 text-[10px] font-black uppercase tracking-wider transition-all",
                                    filterStatus === status
                                        ? "bg-primary text-primary-foreground shadow-md"
                                        : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                                )}
                            >
                                {t(status as "all" | "pending" | "approved" | "rejected")}
                            </Button>
                        ))}
                    </div>
                </CardHeader>

                <div className="p-6 space-y-6">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full max-sm group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder={t("search_by_name_admission_no_or_ref")}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-11 rounded-lg bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium"
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <select
                                value={pageSize === Number.MAX_SAFE_INTEGER ? "All" : pageSize}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setPageSize(val === "All" ? Number.MAX_SAFE_INTEGER : Number(val));
                                    setCurrentPage(1);
                                }}
                                className="h-11 px-4 rounded-lg border border-muted/50 bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold text-muted-foreground transition-all cursor-pointer"
                            >
                                <option value="50">50</option>
                                <option value="100">100</option>
                                <option value="All">All</option>
                            </select>
                            <div className="h-8 w-px bg-muted/50 mx-2" />
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleExportExcel}
                                    className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all rounded-lg"
                                    title={t("excel")}
                                >
                                    <FileSpreadsheet className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleExportCSV}
                                    className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all rounded-lg"
                                    title={t("csv")}
                                >
                                    <FileText className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleExportPDF}
                                    className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all rounded-lg"
                                    title={t("pdf")}
                                >
                                    <FileCode className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handlePrint}
                                    className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all rounded-lg"
                                    title={t("print")}
                                >
                                    <Printer className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-lg border border-muted/20 overflow-hidden bg-muted/5 shadow-inner">
                        <div className="overflow-x-auto">
                            <Table className="w-full">
                                <TableHeader>
                                    <TableRow className="bg-muted/10 border-b border-muted/20">
                                        {[
                                            t("request_id"), t("student_detail"), t("payment_info"), `Amount (${symbol})`, t("status"), t("action")
                                        ].map((header, index) => (
                                            <TableHead key={header} className={cn(
                                                "py-5 font-bold text-slate-800 whitespace-nowrap",
                                                header === t("action") ? "text-center w-32 pr-8" : "",
                                                index === 0 ? "pl-8" : "",
                                                header === `Amount (${symbol})` ? "text-right" : ""
                                            )}>
                                                {header}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-muted/10">
                                    {loading ? (
                                        <TableSkeleton rows={5} cols={6} />
                                    ) : filteredPayments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-20 text-center">
                                                <div className="flex flex-col items-center gap-3 opacity-30">
                                                    <Wallet className="h-12 w-12" />
                                                    <p className="font-bold tracking-tight text-lg">{t("no_payment_requests_found")}</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedPayments.map((payment) => (
                                            <TableRow key={payment.id} className="hover:bg-muted/10 transition-colors group border-b border-muted/50 last:border-none">
                                                <TableCell className="py-4 pl-8 text-sm font-bold text-slate-600">#{payment.id}</TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-800">
                                                             {payment.student ? `${payment.student.name || ''} ${payment.student.last_name || ''}`.trim() : 'N/A'}
                                                        </span>
                                                        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">
                                                            {payment.student?.admission_no || 'N/A'} • {payment.student?.school_class?.name || payment.student?.school_class?.class || payment.student?.schoolClass?.name || payment.student?.schoolClass?.class || ''}({payment.student?.section?.name || payment.student?.section?.section || ''})
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-slate-600">
                                                            {payment.course ? `Course Purchase: ${payment.course.title}` : (payment.student_fee_master?.fee_master?.fee_type?.name || t("general_payment"))}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground font-medium">{t("ref_label")} {payment.reference_no || 'N/A'}</span>
                                                        <span className="text-[10px] text-muted-foreground font-medium">{t("date_label")} {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-GB') : 'N/A'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 text-sm font-black text-slate-800 text-right">{formatCurrency(payment.amount || 0)}</TableCell>
                                                <TableCell className="py-4">{getStatusBadge(payment.status)}</TableCell>
                                                <TableCell className="py-4 pr-8">
                                                    <div className="flex justify-center gap-2">
                                                        {payment.status === 'approved' && (
                                                            <Button
                                                                size="icon"
                                                                onClick={() => downloadPaymentInvoice(payment)}
                                                                className="h-9 w-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white shadow-lg shadow-slate-800/20 transition-all hover:scale-110 active:scale-95"
                                                                title="Download Invoice"
                                                            >
                                                                <Download className="h-4 w-4" />
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
                                                            className="h-9 w-9 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-110 active:scale-95"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {filteredPayments.length > 0 && (
                        <div className="p-6 border-t border-muted/20 flex items-center justify-between">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                {t("showing_x_to_y_of_z", { from: Math.min((currentPage - 1) * pageSize + 1, filteredPayments.length), to: Math.min(currentPage * pageSize, filteredPayments.length), total: filteredPayments.length })}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    className="h-8 w-8 rounded-[10px] bg-white border border-gray-200 text-gray-600 hover:bg-card active:scale-95 transition-all"
                                >
                                    <ChevronDown className="h-4 w-4 rotate-90" />
                                </Button>
                                <Button className="h-8 w-8 rounded-[10px] border-none p-0 text-white font-bold active:scale-95 transition-all shadow-md shadow-orange-500/10 bg-gradient-to-r from-[#FF9800] to-[#6366F1]">
                                    {currentPage}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    className="h-8 w-8 rounded-[10px] bg-white border border-gray-200 text-gray-600 hover:bg-card active:scale-95 transition-all"
                                >
                                    <ChevronDown className="h-4 w-4 -rotate-90" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Complete Functional & Scrollable Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-[720px] max-h-[90vh] p-0 flex flex-col overflow-hidden rounded-2xl border border-gray-100 shadow-2xl bg-white">
                    {/* Fixed Modal Header */}
                    <DialogHeader className="px-6 py-4 sm:px-8 sm:py-5 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shrink-0 relative">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className="p-2.5 sm:p-3 bg-white/20 rounded-xl backdrop-blur-md border border-white/30 shrink-0 text-white">
                                    {selectedPayment?.bank_name?.toLowerCase().includes('uddokta') ? (
                                        <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-amber-300" />
                                    ) : (
                                        <Landmark className="h-5 w-5 sm:h-6 sm:w-6" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-white leading-snug">
                                        Payment Submission Details
                                    </DialogTitle>
                                    <DialogDescription className="text-white/90 text-xs font-medium truncate mt-0.5">
                                        {selectedPayment?.student
                                            ? `${selectedPayment.student.name || ''} ${selectedPayment.student.last_name || ''}`.trim()
                                            : "Student Fee Submission"}
                                        {selectedPayment?.student?.admission_no && ` • Adm #${selectedPayment.student.admission_no}`}
                                    </DialogDescription>
                                </div>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                                <span className="text-xl sm:text-2xl font-black text-white leading-none">
                                    {symbol}{(selectedPayment?.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <div className="flex items-center gap-1.5 mt-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 bg-white/10 px-2 py-0.5 rounded-full border border-white/20">
                                        Request #{selectedPayment?.id}
                                    </span>
                                    {((selectedPayment?.status || '').toLowerCase() === 'approved') ? (
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 bg-emerald-600/60 px-2 py-0.5 rounded-full border border-emerald-400/40 flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" /> Approved
                                        </span>
                                    ) : ((selectedPayment?.status || '').toLowerCase() === 'rejected') ? (
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-100 bg-red-600/60 px-2 py-0.5 rounded-full border border-red-400/40 flex items-center gap-1">
                                            <XCircle className="h-3 w-3" /> Rejected
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-100 bg-amber-600/60 px-2 py-0.5 rounded-full border border-amber-400/40 flex items-center gap-1 animate-pulse">
                                            <Clock className="h-3 w-3" /> Pending Review
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Scrollable Form Body */}
                    <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-8 sm:py-6 space-y-5">
                        {/* Student & Fee Summary Card */}
                        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5 text-indigo-600" /> Student & Fee Details
                                </span>
                                {selectedPayment?.course ? (
                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                        Online Course
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                                        {selectedPayment?.student_fee_master?.fee_master?.fee_group?.name || "Tuition Fee"}
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                                <div>
                                    <span className="text-[10px] font-medium text-slate-400 block">Student Name</span>
                                    <p className="font-bold text-slate-800">
                                        {selectedPayment?.student
                                            ? `${selectedPayment.student.name || ''} ${selectedPayment.student.last_name || ''}`.trim()
                                            : "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-medium text-slate-400 block">Class & Section</span>
                                    <p className="font-bold text-slate-800">
                                        {selectedPayment?.student?.school_class?.name || selectedPayment?.student?.school_class?.class || selectedPayment?.student?.schoolClass?.name || selectedPayment?.student?.schoolClass?.class || "N/A"}
                                        {selectedPayment?.student?.section?.name ? ` (${selectedPayment.student.section.name})` : ""}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-medium text-slate-400 block">Fee Type</span>
                                    <p className="font-bold text-indigo-600">
                                        {selectedPayment?.course?.title
                                            ? `Course: ${selectedPayment.course.title}`
                                            : selectedPayment?.student_fee_master?.fee_master?.fee_type?.name || "General Fee Collection"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Transaction Information Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Left: Transaction Info */}
                            <div className="space-y-3.5 p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                                    Payment Method & Reference
                                </span>

                                <div className="space-y-1">
                                    <span className="text-[10px] font-medium text-gray-500">Gateway / Bank</span>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-gray-900">
                                            {selectedPayment?.bank_name || 'N/A'}
                                        </p>
                                        {selectedPayment?.bank_name?.toLowerCase().includes('uddokta') ? (
                                            <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-300">
                                                Online Gateway
                                            </span>
                                        ) : selectedPayment?.bank_account_no && selectedPayment.bank_account_no !== 'N/A' ? (
                                            <span className="text-[9px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-300">
                                                Bank Account
                                            </span>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-[10px] font-medium text-gray-500">Transaction ID / Reference</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 select-all">
                                            {selectedPayment?.reference_no || 'N/A'}
                                        </span>
                                        {selectedPayment?.reference_no && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => copyReferenceNo(selectedPayment.reference_no)}
                                                className="h-7 px-2 text-[10px] font-bold text-gray-600 hover:text-indigo-600"
                                                title="Copy Transaction ID"
                                            >
                                                {copiedRef ? (
                                                    <><Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Copied</>
                                                ) : (
                                                    <><Copy className="h-3.5 w-3.5 mr-1" /> Copy</>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-medium text-gray-500">Account No</span>
                                        <p className="text-xs font-semibold text-gray-800">
                                            {selectedPayment?.bank_account_no || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-medium text-gray-500">Payment Date</span>
                                        <p className="text-xs font-semibold text-gray-800">
                                            {selectedPayment?.payment_date ? new Date(selectedPayment.payment_date).toLocaleDateString('en-GB') : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Screenshot / Online Proof Card */}
                            <div className="space-y-2 p-4 rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                                    <FileText className="h-3.5 w-3.5 text-indigo-500" /> Payment Proof / Screenshot
                                </span>

                                <div className="flex-1 min-h-[140px] rounded-lg bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group/img">
                                    {selectedPayment?.screenshot ? (
                                        <>
                                            <img
                                                src={selectedPayment.screenshot}
                                                alt="Payment Proof"
                                                className="w-full h-full object-cover transition-transform group-hover/img:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <a
                                                    href={selectedPayment.screenshot}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2.5 bg-white rounded-full text-gray-900 hover:bg-gray-100 shadow-lg transition-colors flex items-center gap-1 text-xs font-bold"
                                                >
                                                    <ExternalLink className="h-4 w-4" /> View Full Image
                                                </a>
                                            </div>
                                        </>
                                    ) : selectedPayment?.bank_name?.toLowerCase().includes('uddokta') || selectedPayment?.reference_no ? (
                                        <div className="p-4 text-center space-y-1.5">
                                            <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                                                <Zap className="h-5 w-5 text-amber-500" />
                                            </div>
                                            <p className="text-xs font-bold text-gray-800">Online Gateway Submission</p>
                                            <p className="text-[10px] text-gray-500 leading-relaxed max-w-[200px]">
                                                Transaction verified with Reference ID: <strong className="font-mono text-indigo-600">{selectedPayment?.reference_no}</strong>
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1 text-gray-400 p-4 text-center">
                                            <XCircle className="h-8 w-8 text-gray-300" />
                                            <span className="text-xs font-medium">No Screenshot Uploaded</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Status Banners */}
                        {((selectedPayment?.status || '').toLowerCase() === 'approved') && (
                            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                                <div>
                                    <strong className="font-bold">Payment Approved & Fee Applied:</strong> This payment has been verified and credited to the student record.
                                    {selectedPayment?.status_date && (
                                        <span className="block text-[11px] text-emerald-700 mt-0.5">
                                            Approved on {new Date(selectedPayment.status_date).toLocaleString('en-GB')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {((selectedPayment?.status || '').toLowerCase() === 'rejected') && (
                            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-2.5">
                                <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <strong className="font-bold text-red-800">Payment Submission Rejected:</strong>
                                    <p className="text-xs text-red-700 font-medium">
                                        Reason: {selectedPayment?.rejection_reason || "No reason specified."}
                                    </p>
                                    {selectedPayment?.status_date && (
                                        <span className="block text-[10px] text-red-600">
                                            Rejected on {new Date(selectedPayment.status_date).toLocaleString('en-GB')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Inline Rejection Reason Box (Activated when Admin clicks Reject) */}
                        {isRejectMode && ((selectedPayment?.status || '').toLowerCase() === 'pending') && (
                            <div className="p-4 rounded-xl bg-red-50/80 border border-red-200 space-y-3 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-red-800 flex items-center gap-1.5">
                                        <AlertCircle className="h-4 w-4 text-red-600" /> Provide Rejection Reason (Required)
                                    </span>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setIsRejectMode(false)}
                                        className="h-6 px-2 text-[10px] text-gray-500 hover:text-gray-800"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                                <Textarea
                                    placeholder="Enter reason for rejecting this payment (e.g. Invalid transaction ID, amount mismatch, etc.)..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="min-h-[85px] bg-white border-red-200 focus:border-red-400 rounded-lg text-xs text-gray-800 font-medium resize-none shadow-none"
                                    autoFocus
                                />
                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsRejectMode(false)}
                                        className="h-8 text-xs font-semibold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={processing || !rejectionReason.trim()}
                                        onClick={handleReject}
                                        className="h-8 text-xs font-bold bg-destructive hover:bg-destructive/90 text-white shadow-sm"
                                    >
                                        {processing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <X className="h-3.5 w-3.5 mr-1" />}
                                        Confirm Rejection
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Fixed Modal Footer */}
                    <DialogFooter className="px-6 py-3.5 sm:px-8 sm:py-4 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 shrink-0">
                        <Button
                            variant="outline"
                            onClick={() => setIsDetailsOpen(false)}
                            className="w-full sm:w-auto h-9 sm:h-10 px-5 text-xs font-bold rounded-lg border-gray-200 hover:bg-white text-gray-700"
                        >
                            Close
                        </Button>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            {/* If Approved, offer Invoice Download */}
                            {((selectedPayment?.status || '').toLowerCase() === 'approved') && (
                                <Button
                                    type="button"
                                    onClick={() => selectedPayment && downloadPaymentInvoice(selectedPayment)}
                                    className="w-full sm:w-auto h-9 sm:h-10 px-5 rounded-lg font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white shadow-sm flex items-center gap-1.5"
                                >
                                    <Download className="h-3.5 w-3.5" /> Download Invoice
                                </Button>
                            )}

                            {/* If Pending and not in reject mode, show Reject & Approve buttons */}
                            {((selectedPayment?.status || '').toLowerCase() === 'pending') && !isRejectMode && (
                                <>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsRejectMode(true)}
                                        disabled={processing}
                                        className="w-full sm:w-auto h-9 sm:h-10 px-4 rounded-lg border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
                                    >
                                        <X className="h-3.5 w-3.5" /> Reject Payment
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleApprove}
                                        disabled={processing}
                                        className="w-full sm:w-auto h-9 sm:h-10 px-6 rounded-lg font-bold text-xs bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white shadow-md shadow-indigo-500/20 flex items-center gap-1.5 active:scale-95 transition-all"
                                    >
                                        {processing ? (
                                            <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Processing...</>
                                        ) : (
                                            <><Check className="h-4 w-4 mr-1.5" /> Approve & Apply Fee</>
                                        )}
                                    </Button>
                                </>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Invoice Template (Hidden) */}
            {invoiceData && (
                <div style={{ position: 'fixed', top: 0, left: 0, zIndex: -50, opacity: 0, pointerEvents: 'none' }}>
                    <div id="modern-invoice-template-bank" style={{ 
                        width: '800px', 
                        backgroundColor: '#ffffff', 
                        padding: '40px 48px 36px 48px', 
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', 
                        color: '#0f172a', 
                        minHeight: '1122px', 
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                    }}>
                        {/* Main Content Body */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            {/* Header: Logo & School Contact */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: '380px' }}>
                                    {printSettings?.header_image_base64 ? (
                                        <img src={printSettings.header_image_base64} alt="Header" style={{ maxHeight: '48px', maxWidth: '200px', objectFit: 'contain', marginBottom: '8px', alignSelf: 'flex-start' }} />
                                    ) : settings?.print_logo_base64 ? (
                                        <img src={settings.print_logo_base64} alt="Logo" style={{ maxHeight: '48px', maxWidth: '200px', objectFit: 'contain', marginBottom: '8px', alignSelf: 'flex-start' }} />
                                    ) : null}
                                    <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', lineHeight: '1.25', margin: 0, textAlign: 'left' }}>
                                        {settings?.school_name || "iSchool Management System"}
                                    </h1>
                                </div>
                                
                                <div style={{ textAlign: 'right', fontSize: '11.5px', color: '#475569', lineHeight: '1.6' }}>
                                    {settings?.address && (
                                        <div><span style={{ fontWeight: '600', color: '#1e293b' }}>Address:</span> {settings.address}</div>
                                    )}
                                    {settings?.phone && (
                                        <div><span style={{ fontWeight: '600', color: '#1e293b' }}>Phone:</span> {settings.phone}</div>
                                    )}
                                    {settings?.email && (
                                        <div><span style={{ fontWeight: '600', color: '#1e293b' }}>Email:</span> {settings.email}</div>
                                    )}
                                    {(() => {
                                        const siteUrl = (settings?.frontend_url || (typeof window !== 'undefined' ? window.location.origin : ''))
                                            .replace(/^https?:\/\//, '')
                                            .replace(/^api\./, '');
                                        return siteUrl ? (
                                            <div><span style={{ fontWeight: '600', color: '#1e293b' }}>Website:</span> {siteUrl}</div>
                                        ) : null;
                                    })()}
                                </div>
                            </div>

                            {/* Sleek INVOICE Banner: Left = Invoice No, Middle = INVOICE, Right = Date */}
                            <div style={{ 
                                backgroundColor: '#0f172a', 
                                color: '#ffffff', 
                                borderRadius: '6px', 
                                padding: '10px 18px', 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                marginBottom: '20px' 
                            }}>
                                <div style={{ fontSize: '12px', fontWeight: '500', color: '#94a3b8', width: '220px', textAlign: 'left' }}>
                                    <span>Invoice No: <strong style={{ color: '#ffffff', fontWeight: '700' }}>#{invoiceData.id}</strong></span>
                                </div>
                                <div style={{ textAlign: 'center', flex: 1 }}>
                                    <span style={{ fontSize: '14px', fontWeight: '800', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#ffffff' }}>
                                        INVOICE
                                    </span>
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: '500', color: '#94a3b8', width: '220px', textAlign: 'right' }}>
                                    <span>Date: <strong style={{ color: '#ffffff', fontWeight: '700' }}>{invoiceData.date ? (invoiceData.date.includes('/') ? invoiceData.date : new Date(invoiceData.date).toLocaleDateString('en-GB')) : 'N/A'}</strong></span>
                                </div>
                            </div>

                            {/* 2-Column Info Grid: Billed To & Payment Details */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                {/* Left Column: Student Details */}
                                <div style={{ backgroundColor: '#f8fafc', padding: '16px 20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px 0' }}>
                                        BILLED TO
                                    </p>
                                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0' }}>
                                        {invoiceData.studentName}
                                    </h3>
                                    <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.6' }}>
                                        <div>Admission No: <strong style={{ color: '#0f172a' }}>{invoiceData.admissionNo}</strong></div>
                                        {invoiceData.className && (
                                            <div>Class & Section: <strong style={{ color: '#0f172a' }}>{invoiceData.className}</strong></div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Column: Payment Details */}
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

                        {/* Footer (Always at Bottom) */}
                        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
                            {printSettings?.footer_content ? (
                                <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.5' }} dangerouslySetInnerHTML={{ __html: printSettings.footer_content }} />
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
