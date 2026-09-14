"use client";

import { 
    Search, 
    Info, 
    User, 
    Calendar, 
    CreditCard, 
    Receipt, 
    ReceiptText, 
    Eye, 
    Printer, 
    Download, 
    CheckCircle2,
    Wallet,
    ArrowRight,
    Sparkles,
    ShieldCheck,
    Landmark
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Link from "next/link";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useSettings } from "@/components/providers/settings-provider";
import { renderPdfHeader, renderPdfFooter } from "@/lib/pdf-utils";
import { cn } from "@/lib/utils";

interface PaymentRecord {
    id: number;
    amount: number;
    discount: number;
    fine: number;
    payment_mode: string;
    note: string | null;
    date: string;
    student_fee_master: {
        student: {
            name: string;
            last_name: string;
            id: number;
            admission_no: string;
            school_class?: { name?: string; class?: string };
            schoolClass?: { name?: string; class?: string };
            section?: { name?: string; section?: string };
        };
        fee_master?: {
            fee_type?: { name?: string };
            fee_group?: { name?: string };
        };
    };
    collected_by: {
        name: string;
    };
}

function CardSkeleton({ count = 2 }: { count?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-muted/40 p-6 space-y-4 bg-card animate-pulse shadow-sm">
                    <div className="flex items-center gap-3.5">
                        <div className="h-12 w-12 rounded-xl bg-muted/60" />
                        <div className="space-y-2 flex-1">
                            <div className="h-4 w-1/3 rounded bg-muted/60" />
                            <div className="h-3 w-1/4 rounded bg-muted/60" />
                        </div>
                    </div>
                    <div className="h-4 w-full rounded bg-muted/60" />
                    <div className="h-4 w-4/5 rounded bg-muted/60" />
                    <div className="h-10 w-full rounded-xl bg-muted/40" />
                </div>
            ))}
        </div>
    );
}

export default function SearchFeesPaymentPage() {
    const [paymentId, setPaymentId] = useState("");
    const [results, setResults] = useState<PaymentRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const { symbol, formatCurrency } = useCurrencyFormatter();
    const { settings } = useSettings();
    const receiptRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        window.print();
    };

    const handlePDF = async (payment: PaymentRecord) => {
        try {
            const doc = new jsPDF("p", "mm", "a4");
            
            let invoicePrintSettings = {};
            try {
                const res = await api.get("system-setting/print-settings");
                if (res.data?.status === "success") {
                    const list = Array.isArray(res.data.data) ? res.data.data : [];
                    invoicePrintSettings = list.find((s: { type?: string }) => s.type === "Fees Receipt") || {};
                }
            } catch (err) {
                console.error("Could not fetch print settings", err);
            }

            const baseApiUrl = api.defaults.baseURL?.replace('/api/v1', '') || "";

            let startY = await renderPdfHeader(
                doc,
                settings,
                invoicePrintSettings,
                baseApiUrl,
                t("payment_receipt").toUpperCase()
            );

            const formatPdfCurrency = (val: number | string) => {
                let str = `${symbol}${Number(val).toFixed(2)}`;
                str = str.replace(/৳/g, "Tk ");
                str = str.replace(/₹/g, "Rs ");
                str = str.replace(/€/g, "EUR ");
                str = str.replace(/£/g, "GBP ");
                return str.replace(/[^\x00-\x7F]/g, "").trim();
            };

            // Student Info
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.setFont("helvetica", "bold");
            
            const studentName = `${payment.student_fee_master.student.name || ''} ${payment.student_fee_master.student.last_name || ''}`.trim();
            const admissionNo = payment.student_fee_master.student.admission_no || 'N/A';
            const studentClass = payment.student_fee_master.student.school_class?.name || payment.student_fee_master.student.schoolClass?.name || "N/A";
            const studentSection = payment.student_fee_master.student.section?.name || "";
            const classSection = `${studentClass}${studentSection ? ` (${studentSection})` : ''}`;
            const paymentDate = payment.date ? new Date(payment.date).toLocaleDateString('en-GB') : 'N/A';
            
            doc.text(`${t("student_name")}:`, 14, startY);
            doc.setTextColor(40, 40, 40);
            doc.text(studentName, 14, startY + 5);
            doc.setFont("helvetica", "normal");
            doc.text(`${t("adm_no")}: ${admissionNo}`, 14, startY + 9);
            
            doc.setFont("helvetica", "bold");
            doc.setTextColor(100, 100, 100);
            doc.text(`${t("class_and_section")}:`, 80, startY);
            doc.setTextColor(40, 40, 40);
            doc.text(classSection, 80, startY + 5);
            
            doc.setFont("helvetica", "bold");
            doc.setTextColor(100, 100, 100);
            doc.text(`${t("payment_date")}:`, 150, startY);
            doc.setTextColor(40, 40, 40);
            doc.text(paymentDate, 150, startY + 5);

            startY += 15;

            const feeTypeName = payment.student_fee_master?.fee_master?.fee_type?.name || t("general_payment");
            const tableBody = [];
            tableBody.push([
                feeTypeName,
                formatPdfCurrency(payment.amount)
            ]);
            
            if (payment.discount > 0) {
                tableBody.push([
                    t("discount_applied"),
                    "-" + formatPdfCurrency(payment.discount)
                ]);
            }
            if (payment.fine > 0) {
                tableBody.push([
                    t("fine_or_late_fee"),
                    "+" + formatPdfCurrency(payment.fine)
                ]);
            }
            
            const total = Number(payment.amount) - Number(payment.discount) + Number(payment.fine);
            
            autoTable(doc, {
                startY: startY + 5,
                head: [[t("description").toUpperCase(), t("amount").toUpperCase()]],
                body: tableBody,
                theme: 'grid',
                headStyles: {
                    fillColor: [248, 249, 250],
                    textColor: [100, 100, 100],
                    fontStyle: 'bold',
                    fontSize: 9,
                },
                columnStyles: {
                    0: { cellWidth: 'auto' },
                    1: { halign: 'right', fontStyle: 'bold' }
                },
                foot: [[t("total_received").toUpperCase(), formatPdfCurrency(total)]],
                footStyles: {
                    fillColor: [240, 242, 255],
                    textColor: [79, 70, 229],
                    fontStyle: 'bold',
                    fontSize: 11,
                    halign: 'right'
                }
            });

            const finalY = (doc as any).lastAutoTable.finalY + 15;
            
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(100, 100, 100);
            doc.text(`${t("payment_method")}:`, 14, finalY);
            doc.setTextColor(40, 40, 40);
            doc.text(payment.payment_mode || "Cash", 14, finalY + 5);

            doc.setFont("helvetica", "bold");
            doc.setTextColor(100, 100, 100);
            doc.text(`${t("collected_by")}:`, 80, finalY);
            doc.setTextColor(40, 40, 40);
            doc.text(payment.collected_by?.name || "System Admin", 80, finalY + 5);
            
            if (payment.note) {
                doc.setFont("helvetica", "italic");
                doc.setTextColor(100, 100, 100);
                doc.text(`${t("note_label")} ${payment.note}`, 14, finalY + 15);
            }

            const footerY = payment.note ? finalY + 25 : finalY + 15;
            renderPdfFooter(doc, (invoicePrintSettings as any).footer_content || "", footerY);
            
            doc.save(`Payment_Receipt_${payment.id}.pdf`);
            tt.success("pdf_file_downloaded");
        } catch (error) {
            console.error("PDF generation failed", error);
            tt.error("failed_to_generate_pdf");
        }
    };

    const handleSearch = async () => {
        if (!paymentId.trim()) {
            tt.error("please_enter_a_payment_id");
            return;
        }

        setLoading(true);
        try {
            const res = await api.get("/fee-collection/search-payments", {
                params: { payment_id: paymentId.trim() }
            });
            const data = res.data.data || [];
            setResults(Array.isArray(data) ? data : (data ? [data] : []));
            if (!data || (Array.isArray(data) && data.length === 0)) {
                tt.info("no_payment_found_with_this_id");
            }
        } catch (_error) {
            tt.error("failed_to_search_payment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-3 sm:p-5 pt-1 sm:pt-2 space-y-4 max-w-[1600px] mx-auto animate-in fade-in duration-300">
            {/* Top Page Header Card with Signature Gradient */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] overflow-hidden p-0">
                <div className="flex flex-row items-center justify-between gap-3 px-5 py-3.5 sm:px-6 sm:py-4">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-md">
                            <ReceiptText className="h-5 w-5 sm:h-6 sm:w-6" />
                        </span>
                        <div>
                            <CardTitle className="text-lg sm:text-xl font-bold tracking-tight text-slate-800 leading-none">
                                {t("search_fees_payment")}
                            </CardTitle>
                            <p className="text-xs text-slate-600 mt-1 font-medium">
                                {t("retrieve_detailed_transaction_history")}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard/fees-collection/collect-fees" passHref>
                            <Button
                                size="sm"
                                className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white shadow-md shadow-indigo-500/20 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer border-none"
                            >
                                <Wallet className="h-3.5 w-3.5" />
                                <span>{t("collect_fees")}</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </Card>

            {/* Search Input Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-3 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-200/70">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Search className="h-4 w-4" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                            {t("search_by_payment_id_or_ref")}
                        </CardTitle>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                            {t("x_results_found", { count: results.length })}
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="p-5 sm:p-7 space-y-5">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 max-w-2xl">
                        <div className="space-y-1.5 flex-1 group">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Receipt className="h-3.5 w-3.5 text-indigo-600" /> {t("payment_id")} <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <Input
                                    placeholder={t("enter_payment_id_placeholder")}
                                    value={paymentId}
                                    onChange={(e) => setPaymentId(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    className="h-11 rounded-xl bg-background border-border/80 focus-visible:ring-primary/20 transition-all font-semibold text-sm sm:text-base pl-4"
                                />
                            </div>
                        </div>
                        <Button
                            onClick={handleSearch}
                            disabled={loading || !paymentId.trim()}
                            className="h-11 px-6 sm:px-8 rounded-xl font-bold text-xs bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer border-none shrink-0"
                        >
                            {loading ? <Search className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            <span>{t("search_payment")}</span>
                        </Button>
                    </div>

                    {!results.length && !loading && (
                        <div className="p-4 sm:p-5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 flex items-start gap-3.5 max-w-2xl">
                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                                <Info className="h-4 w-4" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
                                    {t("search_instructions")}
                                </h4>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {t("search_instructions_description")}
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Loading Skeleton */}
            {loading && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2">
                        <CardSkeleton count={1} />
                    </div>
                    <div className="space-y-4">
                        <CardSkeleton count={2} />
                    </div>
                </div>
            )}

            {/* Results Section */}
            {!loading && results.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-in slide-in-from-bottom-3 duration-300">
                    {/* Main Receipt Card */}
                    {results.map((payment) => {
                        const studentFullName = payment.student_fee_master?.student
                            ? `${payment.student_fee_master.student.name || ''} ${payment.student_fee_master.student.last_name || ''}`.trim()
                            : 'N/A';
                        const studentClass = payment.student_fee_master?.student?.school_class?.name ||
                            payment.student_fee_master?.student?.schoolClass?.name || 'N/A';
                        const studentSection = payment.student_fee_master?.student?.section?.name || '';
                        const feeTypeName = payment.student_fee_master?.fee_master?.fee_type?.name || t("general_payment");
                        const totalCalculated = Number(payment.amount || 0) - Number(payment.discount || 0) + Number(payment.fine || 0);

                        return (
                            <div key={payment.id} className="lg:col-span-2" ref={receiptRef}>
                                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card overflow-hidden pt-0 rounded-2xl relative">
                                    <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-200/70 relative z-10">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                                <ReceiptText className="h-5 w-5" />
                                            </span>
                                            <div>
                                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                                    {t("payment_receipt")}
                                                </CardTitle>
                                                <p className="text-xs text-slate-500 font-medium mt-1 font-mono">
                                                    {t("transaction_id")}: #{payment.id}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 no-print">
                                            <Button
                                                onClick={handlePrint}
                                                variant="outline"
                                                size="sm"
                                                className="h-8 px-3 rounded-lg border-border/80 font-bold text-xs hover:bg-muted/40 cursor-pointer"
                                            >
                                                <Printer className="h-3.5 w-3.5 mr-1.5" /> {t("print")}
                                            </Button>
                                            <Button
                                                onClick={() => handlePDF(payment)}
                                                variant="outline"
                                                size="sm"
                                                className="h-8 px-3 rounded-lg border-border/80 font-bold text-xs hover:bg-muted/40 cursor-pointer"
                                            >
                                                <Download className="h-3.5 w-3.5 mr-1.5" /> {t("pdf")}
                                            </Button>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="p-5 sm:p-7 space-y-6 relative z-10">
                                        {/* Student Info Card */}
                                        <div className="p-4 rounded-xl bg-muted/30 border border-border/70 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                                    <User className="h-3.5 w-3.5 text-indigo-500" /> {t("student_name")}
                                                </span>
                                                <p className="text-sm font-bold text-foreground">{studentFullName}</p>
                                                <p className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                    {t("adm_no")}: #{payment.student_fee_master?.student?.admission_no || 'N/A'}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    {t("class_and_section")}
                                                </span>
                                                <p className="text-sm font-bold text-foreground">
                                                    {studentClass}{studentSection ? ` (${studentSection})` : ''}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-indigo-500" /> {t("payment_date")}
                                                </span>
                                                <p className="text-sm font-bold text-foreground">
                                                    {payment.date ? new Date(payment.date).toLocaleDateString('en-GB') : 'N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Payment Breakdown Table */}
                                        <div className="rounded-xl border border-border/70 overflow-hidden bg-background">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-muted/40 border-b border-border/70">
                                                        <th className="px-5 py-3.5 text-xs font-bold text-foreground uppercase tracking-wider">
                                                            {t("description")}
                                                        </th>
                                                        <th className="px-5 py-3.5 text-xs font-bold text-foreground uppercase tracking-wider text-right">
                                                            {t("amount")} ({symbol})
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/50 text-sm">
                                                    <tr>
                                                        <td className="px-5 py-3.5 font-semibold text-foreground">
                                                            {feeTypeName}
                                                        </td>
                                                        <td className="px-5 py-3.5 font-bold text-foreground text-right">
                                                            {formatCurrency(payment.amount || 0)}
                                                        </td>
                                                    </tr>
                                                    {Number(payment.discount) > 0 && (
                                                        <tr className="text-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20">
                                                            <td className="px-5 py-3 font-semibold text-xs flex items-center gap-1.5">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                                {t("discount_applied")}
                                                            </td>
                                                            <td className="px-5 py-3 font-bold text-xs text-right">
                                                                -{formatCurrency(payment.discount)}
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {Number(payment.fine) > 0 && (
                                                        <tr className="text-rose-700 bg-rose-50/40 dark:bg-rose-950/20">
                                                            <td className="px-5 py-3 font-semibold text-xs flex items-center gap-1.5">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                                                {t("fine_or_late_fee")}
                                                            </td>
                                                            <td className="px-5 py-3 font-bold text-xs text-right">
                                                                +{formatCurrency(payment.fine)}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-t-2 border-indigo-500/20">
                                                        <td className="px-5 py-4 font-black text-indigo-950 dark:text-white text-sm uppercase tracking-wider">
                                                            {t("total_received")}
                                                        </td>
                                                        <td className="px-5 py-4 font-black text-indigo-600 dark:text-indigo-400 text-lg sm:text-xl text-right">
                                                            {formatCurrency(totalCalculated)}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>

                                        {/* Extra Metadata Row */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                            <div className="space-y-1.5 p-3 rounded-xl bg-muted/20 border border-border/60">
                                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                                    <CreditCard className="h-3.5 w-3.5 text-indigo-500" /> {t("payment_method")}
                                                </span>
                                                <div className="inline-flex items-center px-3 py-1 rounded-lg bg-background border border-border text-xs font-bold text-foreground">
                                                    {payment.payment_mode || "Cash"}
                                                </div>
                                            </div>
                                            <div className="space-y-1.5 p-3 rounded-xl bg-muted/20 border border-border/60">
                                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    {t("collected_by")}
                                                </span>
                                                <p className="text-xs font-bold text-foreground">
                                                    {payment.collected_by?.name || "System Admin"}
                                                </p>
                                            </div>
                                        </div>

                                        {payment.note && (
                                            <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200">
                                                <strong className="font-bold">{t("note_label")}:</strong> {payment.note}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        );
                    })}

                    {/* Right Column: Status & Quick Action Center */}
                    <div className="space-y-4 no-print">
                        {/* Verified Status Banner */}
                        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-md relative overflow-hidden">
                            <div className="flex items-center gap-3.5 relative z-10">
                                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-md border border-white/20">
                                    <ShieldCheck className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-white tracking-tight">
                                        {t("verified_payment")}
                                    </h3>
                                    <p className="text-xs text-white/80 font-medium mt-0.5">
                                        {t("transaction_successfully_verified")}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Center Card */}
                        <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card overflow-hidden pt-0 rounded-2xl">
                            <CardHeader className="flex flex-row items-center gap-3 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-200/70">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                    <Sparkles className="h-4 w-4" />
                                </span>
                                <div>
                                    <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                        {t("action_center")}
                                    </CardTitle>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        {t("quick_actions")}
                                    </p>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-5 space-y-2.5">
                                {results.length > 0 && results[0].student_fee_master?.student?.id && (
                                    <>
                                        <Link href={`/dashboard/student-information/student-details/${results[0].student_fee_master.student.id}`} passHref>
                                            <Button
                                                variant="outline"
                                                className="w-full h-10 rounded-xl border-border/80 font-bold text-xs justify-between hover:bg-muted/40 group cursor-pointer"
                                            >
                                                <span className="flex items-center gap-2 text-foreground">
                                                    <Eye className="h-4 w-4 text-indigo-600" />
                                                    {t("view_student_profile")}
                                                </span>
                                                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                                            </Button>
                                        </Link>
                                        <Link href={`/dashboard/fees-collection/collect-fees?student_id=${results[0].student_fee_master.student.id}`} passHref>
                                            <Button
                                                variant="outline"
                                                className="w-full h-10 rounded-xl border-border/80 font-bold text-xs justify-between hover:bg-muted/40 group cursor-pointer"
                                            >
                                                <span className="flex items-center gap-2 text-foreground">
                                                    <Calendar className="h-4 w-4 text-amber-600" />
                                                    {t("view_all_student_fees")}
                                                </span>
                                                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                                            </Button>
                                        </Link>
                                    </>
                                )}
                                <Link href="/dashboard/fees-collection/offline-bank-payments" passHref>
                                    <Button
                                        variant="outline"
                                        className="w-full h-10 rounded-xl border-border/80 font-bold text-xs justify-between hover:bg-muted/40 group cursor-pointer"
                                    >
                                        <span className="flex items-center gap-2 text-foreground">
                                            <Landmark className="h-4 w-4 text-emerald-600" />
                                            {t("offline_bank_payments")}
                                        </span>
                                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
