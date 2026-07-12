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
    Download
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useState, useEffect } from "react";
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
    status: "pending" | "approved" | "rejected";
    status_date: string | null;
    rejection_reason: string | null;
    student: {
        name: string;
        last_name: string;
        admission_no: string;
        school_class: { class: string };
        section: { section: string };
    };
    student_fee_master?: {
        fee_master: {
            fee_type: { name: string };
        };
    };
    course?: {
        title: string;
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
    const [processing, setProcessing] = useState(false);
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const { symbol, formatCurrency } = useCurrencyFormatter();
    const [invoiceData, setInvoiceData] = useState<any>(null);
    const [printSettings, setPrintSettings] = useState<any>(null);
    const { settings } = useSettings();

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);

    useEffect(() => {
        fetchPayments();
        setCurrentPage(1);
    }, [filterStatus]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const fetchPayments = async () => {
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
    };

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
            "Student Name": `${p.student.name} ${p.student.last_name}`,
            "Admission No": p.student.admission_no,
            "Class & Section": `${p.student.school_class.class} (${p.student.section.section})`,
            "Payment Fee Type": p.course ? `Course Purchase: ${p.course.title}` : (p.student_fee_master?.fee_master.fee_type.name || 'General Payment'),
            "Reference No": p.reference_no || 'N/A',
            "Payment Date": new Date(p.payment_date).toLocaleDateString(),
            "Bank Name": p.bank_name || 'N/A',
            "Account No": p.bank_account_no || 'N/A',
            [`Amount (${symbol})`]: p.amount,
            "Status": p.status
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
            "Student Name": `${p.student.name} ${p.student.last_name}`,
            "Admission No": p.student.admission_no,
            "Class & Section": `${p.student.school_class.class} (${p.student.section.section})`,
            "Payment Fee Type": p.course ? `Course Purchase: ${p.course.title}` : (p.student_fee_master?.fee_master.fee_type.name || 'General Payment'),
            "Reference No": p.reference_no || 'N/A',
            "Payment Date": new Date(p.payment_date).toLocaleDateString(),
            "Bank Name": p.bank_name || 'N/A',
            "Account No": p.bank_account_no || 'N/A',
            [`Amount (${symbol})`]: p.amount,
            "Status": p.status
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
            `${p.student.name} ${p.student.last_name}`,
            p.course ? `Course Purchase: ${p.course.title} (Ref: ${p.reference_no || 'N/A'})` : `${p.student_fee_master?.fee_master.fee_type.name || 'General Payment'} (Ref: ${p.reference_no || 'N/A'})`,
            `${symbol}${p.amount.toFixed(2)}`,
            p.status
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
                    const invoiceSetting = res.data.data.find((s: any) => s.type === 'Invoice');
                    setPrintSettings(invoiceSetting);
                    currentSettings = invoiceSetting;
                }
            } catch (e) {}
        }

        const paymentType = payment.course 
            ? `Course Purchase: ${payment.course.title}` 
            : (payment.student_fee_master?.fee_master.fee_type.name || t("general_payment"));

        setInvoiceData({
            type: 'bank',
            id: payment.id,
            date: payment.payment_date,
            reference_no: payment.reference_no,
            studentName: `${payment.student.name} ${payment.student.last_name}`,
            admissionNo: payment.student.admission_no,
            detail: paymentType,
            amount: payment.amount,
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
                } catch (e: any) {
                    console.error("PDF Gen Error:", e);
                    tt.error(`Failed to generate PDF: ${e.message || 'Unknown error'}`);
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
                                                        <span className="text-sm font-bold text-slate-800">{payment.student.name} {payment.student.last_name}</span>
                                                        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">
                                                            {payment.student.admission_no} • {payment.student.school_class.class}({payment.student.section.section})
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-slate-600">
                                                            {payment.course ? `Course Purchase: ${payment.course.title}` : (payment.student_fee_master?.fee_master.fee_type.name || t("general_payment"))}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground font-medium">{t("ref_label")} {payment.reference_no || 'N/A'}</span>
                                                        <span className="text-[10px] text-muted-foreground font-medium">{t("date_label")} {new Date(payment.payment_date).toLocaleDateString('en-GB')}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 text-sm font-black text-slate-800 text-right">{formatCurrency(payment.amount)}</TableCell>
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

            {/* Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-3xl border-none shadow-2xl rounded-lg overflow-hidden p-0 bg-background/95 backdrop-blur-xl">
                    <DialogHeader className="p-8 border-b border-muted/20 bg-gradient-to-r from-[#FF9800] to-[#6366F1]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-lg text-white">
                                    <Landmark className="h-6 w-6" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-bold text-white">{t("payment_details")}</DialogTitle>
                                    <DialogDescription className="text-white/80 font-medium">
                                        {t("review_the_submission_from", { name: selectedPayment?.student.name ?? "" })}
                                    </DialogDescription>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-2xl font-black text-white">{symbol}{selectedPayment?.amount.toFixed(2)}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{t("request")} #{selectedPayment?.id}</span>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[60vh] overflow-y-auto">
                        {/* Info Section */}
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">{t("bank_name")}</span>
                                    <p className="text-sm font-bold">{selectedPayment?.bank_name || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">{t("account_no")}</span>
                                    <p className="text-sm font-bold">{selectedPayment?.bank_account_no || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">{t("reference_no")}</span>
                                    <p className="text-sm font-bold text-primary">{selectedPayment?.reference_no || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">{t("payment_date")}</span>
                                    <p className="text-sm font-bold">{selectedPayment?.payment_date ? new Date(selectedPayment.payment_date).toLocaleDateString() : 'N/A'}</p>
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-muted/20 border border-muted/50 space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">{t("rejection_reason_required")}</span>
                                <Textarea
                                    placeholder={t("provide_reason_for_rejection")}
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="min-h-[100px] bg-background/50 border-muted/50 rounded-lg text-xs font-medium resize-none focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        {/* Image Section */}
                        <div className="space-y-3">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                                <FileText className="h-3 w-3" /> {t("payment_proof_or_screenshot")}
                            </span>
                            <div className="aspect-[4/3] rounded-lg bg-muted/10 border-2 border-dashed border-muted/50 flex items-center justify-center overflow-hidden group/img relative">
                                {selectedPayment?.screenshot ? (
                                    <>
                                        <img
                                            src={selectedPayment.screenshot}
                                            alt="Payment Proof"
                                            className="w-full h-full object-cover transition-transform group-hover/img:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                            <a href={selectedPayment.screenshot} target="_blank" className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors">
                                                <ExternalLink className="h-5 w-5" />
                                            </a>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
                                        <XCircle className="h-10 w-10" />
                                        <span className="text-xs font-bold">{t("no_screenshot_uploaded")}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-8 bg-muted/5 border-t border-muted/20 flex flex-col sm:flex-row gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsDetailsOpen(false)}
                            className="flex-1 h-12 rounded-lg font-bold uppercase tracking-widest text-[10px] border-muted/50 hover:bg-muted/10"
                        >
                            {t("close")}
                        </Button>
                        {selectedPayment?.status === 'pending' && (
                            <>
                                <Button
                                    onClick={handleReject}
                                    disabled={processing}
                                    className="flex-1 h-12 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-destructive/20 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                    {t("reject_payment")}
                                </Button>
                                <Button
                                    onClick={handleApprove}
                                    disabled={processing}
                                    className="flex-[1.5] h-12 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                    {t("approve_and_apply_fee")}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Invoice Template (Hidden) */}
            {invoiceData && (
                <div style={{ position: 'fixed', top: 0, left: 0, zIndex: -50, opacity: 0, pointerEvents: 'none' }}>
                    <div id="modern-invoice-template-bank" style={{ width: '800px', backgroundColor: '#ffffff', padding: '48px', fontFamily: 'sans-serif', color: '#1e293b', minHeight: '1122px', boxSizing: 'border-box' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                            {/* Left Column: Logo + School Name */}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {printSettings?.header_image_base64 ? (
                                    <img src={printSettings.header_image_base64} alt="Header" style={{ maxHeight: '80px', objectFit: 'contain', marginBottom: '8px' }} />
                                ) : settings?.print_logo_base64 ? (
                                    <img src={settings.print_logo_base64} alt="Logo" style={{ maxHeight: '80px', objectFit: 'contain', marginBottom: '8px' }} />
                                ) : null}
                                <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#1e293b', lineHeight: '1.2', margin: 0 }}>{settings?.school_name || "iSchool"}</h1>
                            </div>
                            
                            {/* Right Column: Address and Others */}
                            <div style={{ textAlign: 'right', fontSize: '13px', color: '#1e293b', lineHeight: '1.5' }}>
                                {settings?.address && (
                                    <div><span style={{ fontWeight: 'bold' }}>Address:</span> {settings.address}</div>
                                )}
                                {settings?.phone && (
                                    <div><span style={{ fontWeight: 'bold' }}>Phone No.:</span> {settings.phone}</div>
                                )}
                                {settings?.email && (
                                    <div><span style={{ fontWeight: 'bold' }}>Email:</span> {settings.email}</div>
                                )}
                                {settings?.base_url && (
                                    <div><span style={{ fontWeight: 'bold' }}>Website:</span> {settings.base_url.replace(/^https?:\/\//, '')}</div>
                                )}
                            </div>
                        </div>

                        {/* Centered full-width black bar */}
                        <div style={{ backgroundColor: '#000000', color: '#ffffff', fontWeight: 'bold', textAlign: 'center', padding: '10px 0', letterSpacing: '0.2em', fontSize: '15px', marginBottom: '24px', textTransform: 'uppercase', borderRadius: '4px' }}>
                            INVOICE
                        </div>

                        {/* Invoice Meta Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#475569', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', gap: '24px' }}>
                                <div>
                                    <span style={{ fontWeight: 'bold', color: '#1e293b' }}>Request ID:</span> <span style={{ color: '#4f46e5', fontWeight: '900' }}>#{invoiceData.id}</span>
                                </div>
                                {invoiceData.reference_no && (
                                    <div>
                                        <span style={{ fontWeight: 'bold', color: '#1e293b' }}>Ref No:</span> <span style={{ color: '#4f46e5', fontWeight: 'bold' }}>{invoiceData.reference_no}</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <span style={{ fontWeight: 'bold', color: '#1e293b' }}>Date:</span> <span style={{ fontWeight: '600' }}>{new Date(invoiceData.date).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Billed To */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Billed To</p>
                                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 4px 0' }}>{invoiceData.studentName}</h3>
                                <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '500', margin: 0 }}>Admission No: {invoiceData.admissionNo}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Status</p>
                                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '32px', padding: '0 16px', fontSize: '12px', fontWeight: 'bold', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#15803d' }}>
                                    PAID
                                </span>
                            </div>
                        </div>

                        {/* Table */}
                        <div style={{ borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '32px' }}>
                            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</th>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
                                            <p style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '14px', margin: 0 }}>{invoiceData.detail}</p>
                                        </td>
                                        <td style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 'bold', color: '#1e293b', fontSize: '14px' }}>
                                            {formatCurrency(invoiceData.amount)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Total */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '64px' }}>
                            <div style={{ width: '50%', backgroundColor: '#f8fafc', borderRadius: '12px', padding: '24px', border: '1px solid #f1f5f9', boxSizing: 'border-box' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#64748b' }}>Subtotal</span>
                                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>{formatCurrency(invoiceData.amount)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #e2e8f0', marginTop: '16px' }}>
                                    <span style={{ fontSize: '16px', fontWeight: '900', color: '#1e293b' }}>Total Paid</span>
                                    <span style={{ fontSize: '20px', fontWeight: '900', color: '#4f46e5' }}>{formatCurrency(invoiceData.amount)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ textAlign: 'center', paddingTop: '32px', borderTop: '1px solid #e2e8f0' }}>
                            {printSettings?.footer_content ? (
                                <div style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5' }} dangerouslySetInnerHTML={{ __html: printSettings.footer_content }} />
                            ) : (
                                <p style={{ fontSize: '14px', fontWeight: '500', color: '#64748b', margin: 0 }}>Thank you for your payment!</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
