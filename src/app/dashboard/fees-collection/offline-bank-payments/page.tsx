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
    Landmark
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
import { Textarea } from "@/components/ui/textarea";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
}

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-4 rounded-md bg-muted/60 animate-pulse"
                                style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }} />
                        </td>
                    ))}
                </tr>
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
        p.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.student.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.student.admission_no.includes(searchQuery) ||
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
            "Payment Fee Type": p.student_fee_master?.fee_master.fee_type.name || 'General Payment',
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
            "Payment Fee Type": p.student_fee_master?.fee_master.fee_type.name || 'General Payment',
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
            `${p.student_fee_master?.fee_master.fee_type.name || 'General Payment'} (Ref: ${p.reference_no || 'N/A'})`,
            `${symbol}${p.amount.toFixed(2)}`,
            p.status
        ]);
        autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
        doc.save("offline_payments.pdf");
        tt.success("exported_to_pdf");
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
                            <p className="text-[11px] text-gray-500 mt-1">{t("x_payments", { count: filteredPayments.length })}</p>
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
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-muted/10">
                                        {[
                                            t("request_id"), t("student_detail"), t("payment_info"), t("amount_x", { symbol }), t("status"), t("action")
                                        ].map((header) => (
                                            <th key={header} className={cn(
                                                "px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 border-b border-muted/20 whitespace-nowrap",
                                                header === t("action") ? "text-center w-32" : ""
                                            )}>
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-muted/10">
                                    {loading ? (
                                        <TableSkeleton rows={5} cols={6} />
                                    ) : filteredPayments.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center gap-3 opacity-30">
                                                    <Wallet className="h-12 w-12" />
                                                    <p className="font-bold tracking-tight text-lg">{t("no_payment_requests_found")}</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedPayments.map((payment) => (
                                            <tr key={payment.id} className="hover:bg-muted/10 transition-colors group/row">
                                                <td className="px-6 py-6 text-sm font-bold text-muted-foreground">#{payment.id}</td>
                                                <td className="px-6 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-foreground">{payment.student.name} {payment.student.last_name}</span>
                                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                                            {payment.student.admission_no} • {payment.student.school_class.class}({payment.student.section.section})
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-primary">{payment.student_fee_master?.fee_master.fee_type.name || t("general_payment")}</span>
                                                        <span className="text-[10px] text-muted-foreground font-medium">{t("ref_label")} {payment.reference_no || 'N/A'}</span>
                                                        <span className="text-[10px] text-muted-foreground font-medium">{t("date_label")} {new Date(payment.payment_date).toLocaleDateString()}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-sm font-black text-foreground">{formatCurrency(payment.amount)}</td>
                                                <td className="px-6 py-6">{getStatusBadge(payment.status)}</td>
                                                <td className="px-6 py-6">
                                                    <div className="flex justify-center">
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
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
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
        </div>
    );
}
