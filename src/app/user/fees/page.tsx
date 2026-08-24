"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useCurrency } from "@/components/providers/currency-provider";
import { useTranslation } from "@/hooks/use-translation";
import { useSettings } from "@/components/providers/settings-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import {
    Printer, CreditCard, Copy, FileSpreadsheet, FileDown,
    User, Loader2, Wallet, ArrowLeft, ChevronRight, Receipt,
    Download
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas-pro";

type Payment = {
    id: number;
    payment_id: string;
    mode: string;
    date: string;
    discount: number;
    fine: number;
    paid: number;
    balance: number;
    note: string;
};

type FeeRow = {
    id: number;
    name: string;
    code: string;
    due_date: string;
    status: "Paid" | "Unpaid" | "Partial" | "Pending";
    amount: number;
    fine: number;
    discount: number;
    fine_amount: number;
    paid_amount: number;
    balance: number;
    payments: Payment[];
};

type Student = {
    name: string;
    father_name: string;
    mobile: string;
    category: string;
    class_section: string;
    admission_no: string;
    roll_no: string;
    rte: string;
    photo: string;
};

type FeesData = {
    student: Student;
    session: string;
    fees: FeeRow[];
};

function StatusBadge({ status }: { status: FeeRow["status"] }) {
    const map: Record<FeeRow["status"], { label: string; className: string }> = {
        Paid: { label: "PAID", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" },
        Unpaid: { label: "UNPAID", className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20" },
        Partial: { label: "PARTIAL", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" },
        Pending: { label: "PENDING", className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20" },
    };
    const s = map[status] || map.Unpaid;
    return (
        <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase", s.className)}>
            {s.label}
        </span>
    );
}

function CountUp({ value, prefix = "" }: { value: number; prefix?: string }) {
    const [displayed, setDisplayed] = useState(0);
    useEffect(() => {
        let start = 0;
        const duration = 600;
        const step = 16;
        const increment = value / (duration / step);
        const timer = setInterval(() => {
            start += increment;
            if (start >= value) {
                setDisplayed(value);
                clearInterval(timer);
            } else {
                setDisplayed(start);
            }
        }, step);
        return () => clearInterval(timer);
    }, [value]);
    return <span>{prefix}{displayed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
}

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function StudentFeesPage() {
    const { t } = useTranslation();
    const [data, setData] = useState<FeesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<number[]>([]);
    const [payingFee, setPayingFee] = useState<FeeRow | null>(null);
    const { toast } = useToast();
    const { selectedCurrency } = useCurrency();
    const cur = selectedCurrency?.symbol || "$";
    const [invoiceData, setInvoiceData] = useState<{
        id: number | string;
        trx_id?: string | number;
        reference_no?: string;
        date: string;
        studentName: string;
        admissionNo: string;
        detail: string;
        amount: number;
        status?: string;
    } | null>(null);
    const [printSettings, setPrintSettings] = useState<{
        header_image_base64?: string;
        footer_content?: string;
        type?: string;
    } | null>(null);
    const { settings } = useSettings();

    const fetchFees = useCallback(async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const res = await api.get("/user/fees", { skipGlobalErrorHandler: true });
            if (res.data.success) setData(res.data.data);
        } catch {
            // ignore unauthenticated or network drop
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchFees(); }, [fetchFees]);

    const fees = useMemo(() => data?.fees ?? [], [data?.fees]);
    const allIds = fees.map((f) => f.id);
    const allChecked = allIds.length > 0 && selected.length === allIds.length;
    const toggleAll = () => setSelected(allChecked ? [] : allIds);
    const toggleOne = (id: number) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    const totals = useMemo(() => fees.reduce((acc, f) => ({
        amount: acc.amount + f.amount, fine: acc.fine + f.fine, discount: acc.discount + f.discount,
        fineAmt: acc.fineAmt + f.fine_amount, paid: acc.paid + f.paid_amount, balance: acc.balance + f.balance,
    }), { amount: 0, fine: 0, discount: 0, fineAmt: 0, paid: 0, balance: 0 }), [fees]);

    const copyToClipboard = () => {
        const headers = ["Fees", "Due Date", "Status", "Amount", "Discount", "Fine", "Paid", "Balance"];
        const rows = fees.map((f) => [`${f.name} (${f.code})`, f.due_date, f.status, f.amount.toFixed(2), f.discount.toFixed(2), f.fine_amount.toFixed(2), f.paid_amount.toFixed(2), f.balance.toFixed(2)]);
        const text = [headers.join("\t"), ...rows.map((r) => r.join("\t"))].join("\n");
        navigator.clipboard.writeText(text);
        toast({ title: t("copied_to_clipboard") });
    };

    const exportToExcel = () => {
        const rows = fees.map((f) => ({ Fees: `${f.name} (${f.code})`, "Due Date": f.due_date, Status: f.status, Amount: f.amount, Discount: f.discount, Fine: f.fine_amount, Paid: f.paid_amount, Balance: f.balance }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Fees");
        XLSX.writeFile(wb, "student_fees.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text(t("student_fees_report"), 14, 15);
        autoTable(doc, { head: [["Fees", "Due Date", "Status", `Amount (${cur})`, `Paid (${cur})`, `Balance (${cur})`]], body: fees.map((f) => [`${f.name} (${f.code})`, f.due_date, f.status, fmt(f.amount), fmt(f.paid_amount), fmt(f.balance)]), startY: 20 });
        doc.save("student_fees.pdf");
    };

    const downloadPaymentInvoice = async (fee: FeeRow, payment?: Payment) => {
        let currentSettings = printSettings;
        if (!currentSettings) {
            try {
                const res = await api.get('system-setting/print-settings', { skipGlobalErrorHandler: true });
                if (res.data?.success) {
                    const list = Array.isArray(res.data.data?.data || res.data.data) ? (res.data.data?.data || res.data.data) : [];
                    const invoiceSetting = list.find((s: { type?: string }) => s.type === 'Invoice');
                    if (invoiceSetting) { setPrintSettings(invoiceSetting); currentSettings = invoiceSetting; }
                }
            } catch {}
        }
        const amt = payment ? payment.paid : (fee.paid_amount > 0 ? fee.paid_amount : fee.amount);
        const refNo = payment?.note?.replace(/.*?Ref:\s*/i, '') || payment?.payment_id || '';
        const trxId = payment?.payment_id || payment?.id || fee.id;
        const payDate = payment?.date || (fee.payments?.[0]?.date) || format(new Date(), 'dd/MM/yyyy');
        setInvoiceData({ id: payment?.id || fee.id, trx_id: trxId, reference_no: refNo, date: payDate, studentName: data?.student?.name || 'N/A', admissionNo: data?.student?.admission_no || 'N/A', detail: `${fee.name} (${fee.code || 'Fee'})`, amount: amt, status: fee.status === 'Paid' ? 'PAID' : (fee.paid_amount > 0 ? 'PARTIAL' : 'UNPAID') });
        setTimeout(async () => {
            const element = document.getElementById('modern-invoice-template-student');
            if (element) {
                try {
                    const canvas = await html2canvas(element, { scale: 2, useCORS: true, allowTaint: true });
                    const imgData = canvas.toDataURL('image/jpeg', 1.0);
                    const pdf = new jsPDF();
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                    pdf.save(`invoice_${payment?.id || fee.id}.pdf`);
                    toast({ title: t("success"), description: t("invoice_downloaded") });
                } finally { setInvoiceData(null); }
            }
        }, 500);
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center gap-2 text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin" /> <span>{t("loading_fees")}</span>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-6">
                <Card className="shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <Wallet className="h-12 w-12 opacity-30 mb-3" />
                        <p className="text-base font-medium text-gray-500">{t("no_fee_records_found")}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { student, session } = data;

    return (
        <div className="flex flex-col gap-5 p-4 lg:p-6 animate-in fade-in duration-300">
            {/* ── Summary stat cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: t("total_fees"), value: totals.amount, color: "from-[#6366F1] to-[#818cf8]", icon: Wallet },
                    { label: t("total_paid"), value: totals.paid, color: "from-[#10b981] to-[#34d399]", icon: CreditCard },
                    { label: t("balance_due"), value: totals.balance, color: "from-[#FF9800] to-[#fb923c]", icon: Receipt },
                ].map((s) => (
                    <div key={s.label} className={cn("relative overflow-hidden rounded-xl p-4 text-white shadow-md bg-gradient-to-r", s.color)}>
                        <s.icon className="absolute -top-3 -right-3 h-20 w-20 text-white/15 rotate-12 pointer-events-none" />
                        <div className="relative z-10">
                            <p className="text-[12px] font-medium opacity-90">{s.label}</p>
                            <p className="text-2xl font-bold mt-1"><CountUp value={s.value} prefix={cur} /></p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Student Info Card ── */}
            <Card className="shadow-sm border-0 p-0 gap-0 overflow-hidden bg-white dark:bg-slate-900">
                <div className="px-4 py-2.5 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900">
                    <h3 className="text-[15px] font-bold text-gray-800 dark:text-gray-100">{t("student_fees")}</h3>
                    <Link
                        href="/user/dashboard"
                        className="flex items-center gap-1 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-semibold px-3 py-1.5 rounded-[10px] hover:opacity-90 transition-opacity"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" /> {t("back")}
                    </Link>
                </div>
                <CardContent className="p-4">
                    <div className="flex gap-4 items-start">
                        <div className="h-20 w-20 shrink-0 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center text-gray-400 overflow-hidden">
                            {student.photo
                                ? <img src={student.photo} alt={student.name} className="h-full w-full object-cover" />
                                : <User className="h-8 w-8 opacity-40" />}
                        </div>
                        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3 text-sm">
                            {[
                                [t("name"), student.name],
                                [t("class_section"), student.class_section],
                                [t("father_name"), student.father_name || "—"],
                                [t("admission_no"), student.admission_no || "—"],
                                [t("mobile_number"), student.mobile || "—"],
                                [t("roll_number"), student.roll_no || "—"],
                                [t("category"), student.category || "—"],
                                [t("rte"), student.rte || "—"],
                            ].map(([label, value]) => (
                                <div key={label as string} className="space-y-0.5">
                                    <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block">{label}</span>
                                    <p className="text-[13px] font-bold text-gray-800 dark:text-gray-100 truncate">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── Fees Table Card ── */}
            <Card className="shadow-sm border-0 p-0 gap-0 overflow-hidden bg-white dark:bg-slate-900">
                <div className="px-4 py-2.5 flex items-center border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900">
                    <h3 className="text-[15px] font-bold text-gray-800 dark:text-gray-100">{t("fees_details")}</h3>
                </div>

                <CardContent className="p-0">
                    {/* Action Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-1.5 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-semibold px-3 py-1.5 rounded-[10px] hover:opacity-90 transition-opacity disabled:opacity-40"
                                disabled={selected.length === 0}
                            >
                                <Printer className="h-3.5 w-3.5" /> {t("print_selected")}
                            </button>
                            <button
                                onClick={() => toast({ title: t("online_payment"), description: t("payment_gateway_coming_soon") })}
                                className="flex items-center gap-1.5 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-semibold px-3 py-1.5 rounded-[10px] hover:opacity-90 transition-opacity disabled:opacity-40"
                                disabled={selected.length === 0}
                            >
                                <CreditCard className="h-3.5 w-3.5" /> {t("pay_selected")}
                            </button>
                        </div>

                        <span className="flex items-center gap-1.5 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-bold px-4 py-1.5 rounded-[10px] shadow-sm mx-auto">
                            {t("session")}: {session || "—"}
                        </span>

                        <div className="w-0 sm:w-[1px]" />
                    </div>

                    {/* Export Icons */}
                    <div className="flex justify-end gap-1 px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                        {[
                            { icon: Copy, label: t("copy"), action: copyToClipboard },
                            { icon: FileSpreadsheet, label: t("excel"), action: exportToExcel },
                            { icon: FileDown, label: t("pdf"), action: exportToPDF },
                            { icon: Printer, label: t("print"), action: () => window.print() },
                        ].map(({ icon: Icon, label, action }) => (
                            <Button key={label} variant="ghost" size="icon" title={label} onClick={action}
                                className="h-8 w-8 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400">
                                <Icon className="h-4 w-4" />
                            </Button>
                        ))}
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-slate-800/90 text-foreground">
                                    <th className="w-8 px-2 py-3 text-center">
                                        <input type="checkbox" checked={allChecked} onChange={toggleAll} className="rounded cursor-pointer accent-[#6366F1]" />
                                    </th>
                                    <th className="px-2 py-3 text-left font-bold text-gray-700 dark:text-gray-200 min-w-[180px]">{t("fees")}</th>
                                    <th className="px-2 py-3 text-left font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">{t("due_date")}</th>
                                    <th className="px-2 py-3 text-left font-bold text-gray-700 dark:text-gray-200">{t("status")}</th>
                                    <th className="px-2 py-3 text-right font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">{t("amount")} ({cur})</th>
                                    <th className="px-2 py-3 text-left font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">{t("payment_id")}</th>
                                    <th className="px-2 py-3 text-left font-bold text-gray-700 dark:text-gray-200">{t("mode")}</th>
                                    <th className="px-2 py-3 text-left font-bold text-gray-700 dark:text-gray-200">{t("date")}</th>
                                    <th className="px-2 py-3 text-right font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">{t("discount")} ({cur})</th>
                                    <th className="px-2 py-3 text-right font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">{t("fine")} ({cur})</th>
                                    <th className="px-2 py-3 text-right font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">{t("paid")} ({cur})</th>
                                    <th className="px-2 py-3 text-right font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">{t("balance")} ({cur})</th>
                                    <th className="px-2 py-3 text-center font-bold text-gray-700 dark:text-gray-200 w-14">{t("action")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fees.length === 0 ? (
                                    <tr><td colSpan={13} className="text-center py-10 text-gray-400">{t("no_fees_assigned")}</td></tr>
                                ) : (
                                    fees.map((fee, idx) => {
                                        const checked = selected.includes(fee.id);
                                        return (
                                            <FeeRowGroup
                                                key={fee.id}
                                                fee={fee}
                                                checked={checked}
                                                onToggle={() => toggleOne(fee.id)}
                                                onPay={() => setPayingFee(fee)}
                                                onDownloadInvoice={downloadPaymentInvoice}
                                                delay={idx * 40}
                                            />
                                        );
                                    })
                                )}

                                {/* Grand total */}
                                {fees.length > 0 && (
                                    <tr className="border-t-2 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 font-bold">
                                        <td></td>
                                        <td className="px-2 py-3 text-sm text-gray-700 dark:text-gray-200" colSpan={3}>{t("grand_total")}</td>
                                        <td className="px-2 py-3 text-right text-gray-800 dark:text-gray-100 whitespace-nowrap">
                                            {cur}{fmt(totals.amount)}
                                            {totals.fine > 0 && <span className="text-orange-500 dark:text-orange-400 ml-1">+ {fmt(totals.fine)}</span>}
                                        </td>
                                        <td colSpan={3}></td>
                                        <td className="px-2 py-3 text-right text-gray-700 dark:text-gray-300">{cur}{fmt(totals.discount)}</td>
                                        <td className="px-2 py-3 text-right text-gray-700 dark:text-gray-300">{cur}{fmt(totals.fineAmt)}</td>
                                        <td className="px-2 py-3 text-right text-green-600 dark:text-green-400">{cur}{fmt(totals.paid)}</td>
                                        <td className="px-2 py-3 text-right text-red-600 dark:text-red-400">{cur}{fmt(totals.balance)}</td>
                                        <td></td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <PaymentModal
                fee={payingFee}
                open={!!payingFee}
                onClose={() => setPayingFee(null)}
                onSuccess={fetchFees}
            />
            {/* Student Invoice Template (Hidden for PDF rendering) */}
            {invoiceData && (
                <div style={{ position: 'fixed', top: 0, left: 0, zIndex: -50, opacity: 0, pointerEvents: 'none' }}>
                    <div id="modern-invoice-template-student" style={{ width: '800px', backgroundColor: '#ffffff', padding: '48px', fontFamily: 'sans-serif', color: '#1e293b', minHeight: '1122px', boxSizing: 'border-box' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                            {/* Left Column: Logo + School Name */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: '380px' }}>
                                {printSettings?.header_image_base64 ? (
                                    <img src={printSettings.header_image_base64} alt="Header" style={{ maxHeight: '45px', maxWidth: '180px', objectFit: 'contain', marginBottom: '8px', alignSelf: 'flex-start' }} />
                                ) : settings?.print_logo_base64 ? (
                                    <img src={settings.print_logo_base64} alt="Logo" style={{ maxHeight: '45px', maxWidth: '180px', objectFit: 'contain', marginBottom: '8px', alignSelf: 'flex-start' }} />
                                ) : null}
                                <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#1e293b', lineHeight: '1.2', margin: 0, textAlign: 'left' }}>{settings?.school_name || "iSchool"}</h1>
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
                                {(() => {
                                    const siteUrl = (settings?.frontend_url || (typeof window !== 'undefined' ? window.location.origin : ''))
                                        .replace(/^https?:\/\//, '')
                                        .replace(/^api\./, '');
                                    return siteUrl ? (
                                        <div><span style={{ fontWeight: 'bold' }}>Website:</span> {siteUrl}</div>
                                    ) : null;
                                })()}
                            </div>
                        </div>

                        {/* Centered full-width black bar */}
                        <div style={{ backgroundColor: '#000000', color: '#ffffff', fontWeight: 'bold', textAlign: 'center', padding: '10px 0', letterSpacing: '0.2em', fontSize: '15px', marginBottom: '24px', textTransform: 'uppercase', borderRadius: '4px' }}>
                            INVOICE
                        </div>

                        {/* Invoice Meta Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#475569', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div>
                                    <span style={{ fontWeight: 'bold', color: '#1e293b' }}>Request ID:</span> <span style={{ color: '#4f46e5', fontWeight: '900' }}>#{invoiceData.id}</span>
                                </div>
                                <div>
                                    <span style={{ fontWeight: 'bold', color: '#1e293b' }}>Ref No:</span> <span style={{ color: '#4f46e5', fontWeight: 'bold' }}>{invoiceData.reference_no || 'N/A'}</span>
                                </div>
                                <div>
                                    <span style={{ fontWeight: 'bold', color: '#1e293b' }}>Trx ID:</span> <span style={{ color: '#4f46e5', fontWeight: 'bold' }}>#{invoiceData.trx_id || invoiceData.id}</span>
                                </div>
                            </div>
                            <div>
                                <span style={{ fontWeight: 'bold', color: '#1e293b' }}>Date:</span> <span style={{ fontWeight: '600' }}>{invoiceData.date}</span>
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
                                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '32px', padding: '0 16px', fontSize: '12px', fontWeight: 'bold', borderRadius: '4px', backgroundColor: invoiceData.status === 'PAID' ? '#dcfce7' : '#fef3c7', color: invoiceData.status === 'PAID' ? '#15803d' : '#b45309' }}>
                                    {invoiceData.status || 'PAID'}
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
                                            {cur}{fmt(invoiceData.amount)}
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
                                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>{cur}{fmt(invoiceData.amount)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #e2e8f0', marginTop: '16px' }}>
                                    <span style={{ fontSize: '16px', fontWeight: '900', color: '#1e293b' }}>Total Paid</span>
                                    <span style={{ fontSize: '20px', fontWeight: '900', color: '#4f46e5' }}>{cur}{fmt(invoiceData.amount)}</span>
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

function FeeRowGroup({ fee, checked, onToggle, onPay, onDownloadInvoice, delay }: { fee: FeeRow; checked: boolean; onToggle: () => void; onPay: () => void; onDownloadInvoice: (f: FeeRow, p?: Payment) => void; delay: number }) {
    const [visible, setVisible] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <>
            <tr
                className={cn(
                    "border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-all text-foreground",
                    checked && "bg-indigo-50/50 dark:bg-indigo-950/40",
                    visible ? "opacity-100" : "opacity-0"
                )}
                style={{ transition: `opacity 0.3s ease ${delay}ms, background-color 0.15s` }}
            >
                <td className="px-2 py-2.5 text-center">
                    <input type="checkbox" checked={checked} onChange={onToggle} className="rounded cursor-pointer accent-[#6366F1]" />
                </td>
                <td className="px-2 py-2.5">
                    <span className="text-[#6366F1] dark:text-indigo-400 font-semibold">{fee.name} ({fee.code})</span>
                </td>
                <td className="px-2 py-2.5 text-gray-600 dark:text-gray-300 whitespace-nowrap">{fee.due_date}</td>
                <td className="px-2 py-2.5">
                    <div className="flex items-center gap-1.5">
                        <StatusBadge status={fee.status} />
                        {fee.status !== "Paid" && fee.status !== "Pending" && (
                            <button
                                onClick={onPay}
                                className="px-2 py-[3px] text-[9px] uppercase tracking-wider font-bold text-white rounded bg-gradient-to-r from-[#10b981] to-[#059669] hover:shadow-md hover:-translate-y-px transition-all shadow-sm"
                            >
                                {t("pay")}
                            </button>
                        )}
                    </div>
                </td>
                <td className="px-2 py-2.5 text-right whitespace-nowrap">
                    <span className="text-gray-700 dark:text-gray-200 font-medium">{fmt(fee.amount)}</span>
                    {fee.fine > 0 && <span className="text-orange-500 dark:text-orange-400 ml-1">+ {fmt(fee.fine)}</span>}
                </td>
                <td colSpan={3}></td>
                <td className="px-2 py-2.5 text-right text-gray-600 dark:text-gray-300">{fmt(fee.discount)}</td>
                <td className="px-2 py-2.5 text-right text-gray-600 dark:text-gray-300">{fmt(fee.fine_amount)}</td>
                <td className="px-2 py-2.5 text-right text-gray-600 dark:text-gray-300">{fmt(fee.paid_amount)}</td>
                <td className="px-2 py-2.5 text-right font-medium text-gray-700 dark:text-gray-200">{fee.balance > 0 ? fmt(fee.balance) : "—"}</td>
                <td className="px-2 py-2.5 text-center">
                    {fee.paid_amount > 0 ? (
                        <button
                            onClick={() => onDownloadInvoice(fee)}
                            className="p-1.5 rounded-lg text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all inline-flex items-center justify-center shadow-xs"
                            title="Download Invoice"
                        >
                            <Download className="h-4 w-4" />
                        </button>
                    ) : (
                        <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                    )}
                </td>
            </tr>

            {fee.payments.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 dark:border-gray-800/80 text-gray-500 dark:text-gray-300 bg-gray-50/30 dark:bg-slate-900/50">
                    <td></td>
                    <td className="px-2 py-1.5 pl-6"><ChevronRight className="h-3 w-3 inline text-gray-300 dark:text-gray-600" /></td>
                    <td colSpan={2}></td>
                    <td></td>
                    <td className="px-2 py-1.5 text-[#6366F1] dark:text-indigo-400 font-medium">
                        <div className="flex items-center gap-1.5">
                            <span>{p.payment_id}</span>
                            <button
                                onClick={() => onDownloadInvoice(fee, p)}
                                className="p-0.5 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all inline-flex items-center justify-center"
                                title="Download Receipt"
                            >
                                <Download className="h-3 w-3" />
                            </button>
                        </div>
                    </td>
                    <td className="px-2 py-1.5">{p.mode}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{p.date}</td>
                    <td className="px-2 py-1.5 text-right">{p.discount > 0 ? fmt(p.discount) : "0.00"}</td>
                    <td className="px-2 py-1.5 text-right">{p.fine > 0 ? fmt(p.fine) : "0.00"}</td>
                    <td className="px-2 py-1.5 text-right">{fmt(p.paid)}</td>
                    <td className="px-2 py-1.5 text-right">{fmt(p.balance)}</td>
                    <td></td>
                </tr>
            ))}
        </>
    );
}

function PaymentModal({ fee, open, onClose, onSuccess }: { fee: FeeRow | null; open: boolean; onClose: () => void; onSuccess: () => void }) {
    const { selectedCurrency } = useCurrency();
    const cur = selectedCurrency?.symbol || "$";

    const [gateways, setGateways] = useState<Array<{ provider: string; name: string }>>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedGateway, setSelectedGateway] = useState<string>("offline");

    // form data
    const [paymentDate, setPaymentDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
    const [amount, setAmount] = useState("");
    const [referenceNo, setReferenceNo] = useState("");
    const [bankName, setBankName] = useState("");
    const [bankAccountNo, setBankAccountNo] = useState("");
    const [screenshot, setScreenshot] = useState<File | null>(null);

    useEffect(() => {
        if (open) {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (token) {
                setLoading(true);
                api.get("/user/payment-gateways", { skipGlobalErrorHandler: true })
                    .then(res => {
                        if (res.data.success) {
                            setGateways(res.data.data);
                            if (res.data.data.length > 0) {
                                setSelectedGateway(res.data.data[0].provider);
                            }
                        }
                    })
                    .catch(() => {})
                    .finally(() => setLoading(false));
            }
            
            if (fee) setAmount(fee.balance.toFixed(2));
            setPaymentDate(format(new Date(), "yyyy-MM-dd"));
        } else {
            // reset form
            setPaymentDate(format(new Date(), "yyyy-MM-dd"));
            setReferenceNo("");
            setBankName("");
            setBankAccountNo("");
            setScreenshot(null);
        }
    }, [open, fee]);

    const numAmount = parseFloat(amount) || 0;
    const remainingAfterPay = fee ? Math.max(0, fee.balance - numAmount) : 0;
    const isAmountExceeded = fee ? numAmount > (fee.balance + 0.001) : false;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fee) return;

        if (numAmount <= 0) {
            toast({ variant: "destructive", title: t("error"), description: "Please enter a valid payment amount." });
            return;
        }

        if (isAmountExceeded) {
            toast({ variant: "destructive", title: t("error"), description: `Amount cannot exceed the remaining due of ${cur}${fmt(fee.balance)}.` });
            return;
        }

        setSubmitting(true);

        const formData = new FormData();
        formData.append("student_fee_master_id", fee.id.toString());
        formData.append("amount", numAmount.toString());
        formData.append("payment_date", paymentDate);
        if (referenceNo) formData.append("reference_no", referenceNo);
        if (bankName) formData.append("bank_name", bankName);
        if (bankAccountNo) formData.append("bank_account_no", bankAccountNo);
        if (screenshot) formData.append("screenshot", screenshot);

        try {
            const res = await api.post("/user/fees/offline-payment", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            if (res.data.success) {
                toast({ title: t("success"), description: t("payment_submitted_successfully") });
                onSuccess();
                onClose();
            } else {
                toast({ variant: "destructive", title: t("error"), description: res.data.message });
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast({ variant: "destructive", title: t("error"), description: error.response?.data?.message || t("failed_to_submit_payment") });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-[95vw] sm:max-w-[520px] p-0 max-h-[90vh] flex flex-col overflow-hidden rounded-xl border border-muted/60 shadow-2xl">
                <DialogHeader className="p-5 sm:p-6 pb-4 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shrink-0">
                    <DialogTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <CreditCard className="h-5 w-5 shrink-0" />
                        <span className="truncate">{t("pay_fee")} - {fee?.name}</span>
                    </DialogTitle>
                    <p className="text-xs text-white/80">{fee?.code ? `Fee Code: ${fee.code}` : "Fee Payment"}</p>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
                            {fee && (
                                <div className="grid grid-cols-3 gap-2 p-3 bg-muted/40 rounded-lg border border-muted/60 text-center">
                                    <div className="flex flex-col justify-center">
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Fee</span>
                                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{cur}{fmt(fee.amount)}</span>
                                    </div>
                                    <div className="border-x border-muted/60 flex flex-col justify-center px-1">
                                        <span className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">Paid</span>
                                        <span className="text-xs sm:text-sm font-bold text-emerald-600 mt-0.5">{cur}{fmt(fee.paid_amount)}</span>
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <span className="text-[10px] text-amber-600 uppercase font-bold tracking-wider">Balance Due</span>
                                        <span className="text-xs sm:text-sm font-bold text-amber-600 mt-0.5">{cur}{fmt(fee.balance)}</span>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">{t("payment_method")}</Label>
                                <select 
                                    value={selectedGateway} 
                                    onChange={(e) => setSelectedGateway(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {gateways.map(g => (
                                        <option key={g.provider} value={g.provider}>{g.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {selectedGateway === "offline" ? (
                                <div className="space-y-3.5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-xs font-semibold">{t("amount")} ({cur}) <span className="text-destructive">*</span></Label>
                                                {fee && fee.balance > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setAmount(fee.balance.toFixed(2))}
                                                        className="text-[10px] text-primary hover:underline font-semibold"
                                                    >
                                                        Pay Full
                                                    </button>
                                                )}
                                            </div>
                                            <Input 
                                                type="number" 
                                                value={amount} 
                                                onChange={e => setAmount(e.target.value)} 
                                                required 
                                                min="0.01" 
                                                step="0.01"
                                                max={fee?.balance}
                                                className={cn("h-10 font-bold", isAmountExceeded && "border-destructive text-destructive")}
                                            />
                                            {fee && (
                                                <p className="text-[10px] text-muted-foreground">
                                                    {numAmount > 0 && numAmount < fee.balance ? (
                                                        <span className="text-amber-600 font-medium">Partial payment. Remaining: {cur}{fmt(remainingAfterPay)}</span>
                                                    ) : isAmountExceeded ? (
                                                        <span className="text-destructive font-medium">Exceeds remaining due of {cur}{fmt(fee.balance)}</span>
                                                    ) : (
                                                        <span>Enter partial or full remaining amount.</span>
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">{t("payment_date")} <span className="text-destructive">*</span></Label>
                                            <DatePicker
                                                value={paymentDate}
                                                onChange={(d) => setPaymentDate(d)}
                                                placeholder="DD/MM/YYYY"
                                                className="h-10 border-input bg-background w-full"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">{t("reference_no")}</Label>
                                        <Input value={referenceNo} onChange={e => setReferenceNo(e.target.value)} placeholder="Transaction ID / Slip No / Reference" className="h-10" />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">{t("bank_name")}</Label>
                                            <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. Chase Bank" className="h-10" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">{t("bank_account_no")}</Label>
                                            <Input value={bankAccountNo} onChange={e => setBankAccountNo(e.target.value)} placeholder="Account No" className="h-10" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">{t("screenshot")} / {t("proof")}</Label>
                                        <Input type="file" onChange={e => setScreenshot(e.target.files?.[0] || null)} accept="image/*,.pdf" className="h-10 text-xs cursor-pointer file:cursor-pointer" />
                                    </div>
                                </div>
                            ) : (
                                <div className="py-6 text-center text-muted-foreground text-sm">
                                    {t("payment_gateway_coming_soon")}
                                </div>
                            )}
                        </div>
                        
                        <div className="flex justify-end gap-2 p-4 sm:p-5 border-t border-muted/50 bg-background shrink-0">
                            <Button type="button" variant="outline" onClick={onClose} className="h-10 min-w-[80px]">{t("cancel")}</Button>
                            <Button type="submit" variant="gradient" disabled={submitting || selectedGateway !== "offline" || isAmountExceeded} className="h-10 min-w-[100px] font-bold">
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t("submit")}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
