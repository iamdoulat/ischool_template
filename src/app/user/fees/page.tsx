"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useCurrency } from "@/components/providers/currency-provider";
import { useTranslation } from "@/hooks/use-translation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Printer, CreditCard, Copy, FileSpreadsheet, FileDown,
    User, Loader2, Wallet, ArrowLeft, ChevronRight, Receipt,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

type FeesData = { student: Student; session: string; fees: FeeRow[] };

const fmt = (n: number) =>
    n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function StatusBadge({ status }: { status: string }) {
    const { t } = useTranslation();
    const map: Record<string, string> = {
        Paid: "bg-green-100 text-green-700 border-green-200",
        Unpaid: "bg-red-100 text-red-600 border-red-200",
        Partial: "bg-amber-100 text-amber-700 border-amber-200",
        Pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    };
    return (
        <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border", map[status] ?? "bg-gray-100 text-gray-600 border-gray-200")}>
            {t(status.toLowerCase())}
        </span>
    );
}

/* Animated count-up number */
function CountUp({ value, prefix }: { value: number; prefix: string }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        let raf = 0;
        const start = performance.now();
        const dur = 700;
        const tick = (now: number) => {
            const p = Math.min(1, (now - start) / dur);
            setDisplay(value * (1 - Math.pow(1 - p, 3)));
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [value]);
    return <>{prefix}{fmt(display)}</>;
}

export default function StudentFeesPage() {
    const { t } = useTranslation();
    const [data, setData] = useState<FeesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<number[]>([]);
    const [payingFee, setPayingFee] = useState<FeeRow | null>(null);
    const { toast } = useToast();
    const { selectedCurrency } = useCurrency();
    const cur = selectedCurrency?.symbol || "$";

    const fetchFees = useCallback(async () => {
        try {
            const res = await api.get("/user/fees");
            if (res.data.success) {
                setData(res.data.data);
            } else {
                toast({ variant: "destructive", title: t("error"), description: res.data.message || t("failed_to_load_fees") });
            }
        } catch {
            toast({ variant: "destructive", title: t("error"), description: t("failed_to_load_fees") });
        } finally {
            setLoading(false);
        }
    }, [toast, t]);

    useEffect(() => {
        fetchFees();
    }, [fetchFees]);

    const fees = data?.fees ?? [];
    const allIds = fees.map((f) => f.id);
    const allChecked = allIds.length > 0 && selected.length === allIds.length;
    const toggleAll = () => setSelected(allChecked ? [] : allIds);
    const toggleOne = (id: number) =>
        setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    const totals = fees.reduce(
        (acc, f) => ({
            amount: acc.amount + f.amount,
            fine: acc.fine + f.fine,
            discount: acc.discount + f.discount,
            fineAmt: acc.fineAmt + f.fine_amount,
            paid: acc.paid + f.paid_amount,
            balance: acc.balance + f.balance,
        }),
        { amount: 0, fine: 0, discount: 0, fineAmt: 0, paid: 0, balance: 0 }
    );

    const exportToExcel = useCallback(() => {
        const ws = XLSX.utils.json_to_sheet(fees.map((f) => ({
            Fees: `${f.name} (${f.code})`,
            "Due Date": f.due_date,
            Status: f.status,
            "Amount": f.amount,
            "Discount": f.discount,
            "Fine": f.fine_amount,
            "Paid": f.paid_amount,
            "Balance": f.balance,
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Fees");
        XLSX.writeFile(wb, "student-fees.xlsx");
    }, [fees]);

    const exportToPDF = useCallback(() => {
        const doc = new jsPDF("l");
        doc.text("Student Fees", 14, 16);
        autoTable(doc, {
            head: [["Fees", "Due Date", "Status", "Amount", "Discount", "Fine", "Paid", "Balance"]],
            body: fees.map((f) => [
                `${f.name} (${f.code})`, f.due_date, f.status,
                fmt(f.amount), fmt(f.discount), fmt(f.fine_amount), fmt(f.paid_amount), fmt(f.balance),
            ]),
            startY: 22,
            styles: { fontSize: 8 },
        });
        doc.save("student-fees.pdf");
    }, [fees]);

    const copyToClipboard = useCallback(() => {
        const text = fees.map((f) =>
            [`${f.name} (${f.code})`, f.due_date, f.status, fmt(f.amount), fmt(f.paid_amount), fmt(f.balance)].join("\t")
        ).join("\n");
        navigator.clipboard.writeText(text);
        toast({ title: t("copied_to_clipboard") });
    }, [fees, toast, t]);

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
            <Card className="shadow-sm border-0 p-0 gap-0 overflow-hidden">
                <div className="px-4 py-2.5 flex items-center justify-between border-b border-gray-200 bg-white">
                    <h3 className="text-[15px] font-bold text-gray-800">{t("student_fees")}</h3>
                    <Link
                        href="/user/dashboard"
                        className="flex items-center gap-1 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-semibold px-3 py-1.5 rounded-[10px] hover:opacity-90 transition-opacity"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" /> {t("back")}
                    </Link>
                </div>
                <CardContent className="p-4">
                    <div className="flex gap-4 items-start">
                        <div className="h-20 w-20 shrink-0 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 overflow-hidden">
                            {student.photo
                                ? <img src={student.photo} alt={student.name} className="h-full w-full object-cover" />
                                : <User className="h-8 w-8 opacity-40" />}
                        </div>
                        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                            {[
                                [t("name"), student.name, "text-[#6366F1] font-semibold", true],
                                [t("class_section"), student.class_section, "text-gray-800", true],
                                [t("father_name"), student.father_name || "—", "text-[#6366F1] font-medium", true],
                                [t("admission_no"), student.admission_no || "—", "text-gray-800", true],
                                [t("mobile_number"), student.mobile || "—", "text-gray-800", true],
                                [t("roll_number"), student.roll_no || "—", "text-gray-800", true],
                                [t("category"), student.category || "—", "text-gray-800", true],
                                [t("rte"), student.rte, "text-red-500 font-semibold", true],
                            ].map(([label, value, cls, boldLabel]) => (
                                <div key={label as string}>
                                    <span className={boldLabel ? "text-gray-700 font-bold text-sm" : "text-gray-500 text-xs"}>{label}</span>
                                    <p className={cls as string}>{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── Fees Table Card ── */}
            <Card className="shadow-sm border-0 p-0 gap-0 overflow-hidden">
                <div className="px-4 py-2.5 flex items-center border-b border-gray-200 bg-white">
                    <h3 className="text-[15px] font-bold text-gray-800">{t("fees_details")}</h3>
                </div>

                <CardContent className="p-0">
                    {/* Action Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-100">
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
                    <div className="flex justify-end gap-1 px-4 py-2 border-b border-gray-100">
                        {[
                            { icon: Copy, label: t("copy"), action: copyToClipboard },
                            { icon: FileSpreadsheet, label: t("excel"), action: exportToExcel },
                            { icon: FileDown, label: t("pdf"), action: exportToPDF },
                            { icon: Printer, label: t("print"), action: () => window.print() },
                        ].map(({ icon: Icon, label, action }) => (
                            <Button key={label} variant="ghost" size="icon" title={label} onClick={action}
                                className="h-8 w-8 rounded hover:bg-gray-100 text-gray-500">
                                <Icon className="h-4 w-4" />
                            </Button>
                        ))}
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-100">
                                    <th className="w-8 px-2 py-3 text-center">
                                        <input type="checkbox" checked={allChecked} onChange={toggleAll} className="rounded cursor-pointer accent-[#6366F1]" />
                                    </th>
                                    <th className="px-2 py-3 text-left font-bold text-gray-700 min-w-[180px]">{t("fees")}</th>
                                    <th className="px-2 py-3 text-left font-bold text-gray-700 whitespace-nowrap">{t("due_date")}</th>
                                    <th className="px-2 py-3 text-left font-bold text-gray-700">{t("status")}</th>
                                    <th className="px-2 py-3 text-right font-bold text-gray-700 whitespace-nowrap">{t("amount")} ({cur})</th>
                                    <th className="px-2 py-3 text-left font-bold text-gray-700 whitespace-nowrap">{t("payment_id")}</th>
                                    <th className="px-2 py-3 text-left font-bold text-gray-700">{t("mode")}</th>
                                    <th className="px-2 py-3 text-left font-bold text-gray-700">{t("date")}</th>
                                    <th className="px-2 py-3 text-right font-bold text-gray-700 whitespace-nowrap">{t("discount")} ({cur})</th>
                                    <th className="px-2 py-3 text-right font-bold text-gray-700 whitespace-nowrap">{t("fine")} ({cur})</th>
                                    <th className="px-2 py-3 text-right font-bold text-gray-700 whitespace-nowrap">{t("paid")} ({cur})</th>
                                    <th className="px-2 py-3 text-right font-bold text-gray-700 whitespace-nowrap">{t("balance")} ({cur})</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fees.length === 0 ? (
                                    <tr><td colSpan={12} className="text-center py-10 text-gray-400">{t("no_fees_assigned")}</td></tr>
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
                                                delay={idx * 40}
                                            />
                                        );
                                    })
                                )}

                                {/* Grand total */}
                                {fees.length > 0 && (
                                    <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                                        <td></td>
                                        <td className="px-2 py-3 text-sm text-gray-700" colSpan={3}>{t("grand_total")}</td>
                                        <td className="px-2 py-3 text-right text-gray-800 whitespace-nowrap">
                                            {cur}{fmt(totals.amount)}
                                            {totals.fine > 0 && <span className="text-orange-500 ml-1">+ {fmt(totals.fine)}</span>}
                                        </td>
                                        <td colSpan={3}></td>
                                        <td className="px-2 py-3 text-right text-gray-700">{cur}{fmt(totals.discount)}</td>
                                        <td className="px-2 py-3 text-right text-gray-700">{cur}{fmt(totals.fineAmt)}</td>
                                        <td className="px-2 py-3 text-right text-green-600">{cur}{fmt(totals.paid)}</td>
                                        <td className="px-2 py-3 text-right text-red-600">{cur}{fmt(totals.balance)}</td>
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
        </div>
    );
}

/* Fee row + its payment sub-rows, with entrance animation */
function FeeRowGroup({ fee, checked, onToggle, onPay, delay }: { fee: FeeRow; checked: boolean; onToggle: () => void; onPay: () => void; delay: number }) {
    const [visible, setVisible] = useState(false);
    const { t } = useTranslation();
    const { toast } = useToast();

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(t);
    }, [delay]);

    return (
        <>
            <tr
                className={cn(
                    "border-b border-gray-100 hover:bg-gray-50/70 transition-all",
                    checked && "bg-indigo-50/50",
                    visible ? "opacity-100" : "opacity-0"
                )}
                style={{ transition: `opacity 0.3s ease ${delay}ms, background-color 0.15s` }}
            >
                <td className="px-2 py-2.5 text-center">
                    <input type="checkbox" checked={checked} onChange={onToggle} className="rounded cursor-pointer accent-[#6366F1]" />
                </td>
                <td className="px-2 py-2.5">
                    <span className="text-[#6366F1] font-medium">{fee.name} ({fee.code})</span>
                </td>
                <td className="px-2 py-2.5 text-gray-600 whitespace-nowrap">{fee.due_date}</td>
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
                    <span className="text-gray-700">{fmt(fee.amount)}</span>
                    {fee.fine > 0 && <span className="text-orange-500 ml-1">+ {fmt(fee.fine)}</span>}
                </td>
                <td colSpan={3}></td>
                <td className="px-2 py-2.5 text-right text-gray-600">{fmt(fee.discount)}</td>
                <td className="px-2 py-2.5 text-right text-gray-600">{fmt(fee.fine_amount)}</td>
                <td className="px-2 py-2.5 text-right text-gray-600">{fmt(fee.paid_amount)}</td>
                <td className="px-2 py-2.5 text-right font-medium text-gray-700">{fee.balance > 0 ? fmt(fee.balance) : "—"}</td>
            </tr>

            {fee.payments.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 text-gray-500 bg-gray-50/30">
                    <td></td>
                    <td className="px-2 py-1.5 pl-6"><ChevronRight className="h-3 w-3 inline text-gray-300" /></td>
                    <td colSpan={2}></td>
                    <td></td>
                    <td className="px-2 py-1.5 text-[#6366F1]">{p.payment_id}</td>
                    <td className="px-2 py-1.5">{p.mode}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{p.date}</td>
                    <td className="px-2 py-1.5 text-right">{p.discount > 0 ? fmt(p.discount) : "0.00"}</td>
                    <td className="px-2 py-1.5 text-right">{p.fine > 0 ? fmt(p.fine) : "0.00"}</td>
                    <td className="px-2 py-1.5 text-right">{fmt(p.paid)}</td>
                    <td className="px-2 py-1.5 text-right">{fmt(p.balance)}</td>
                </tr>
            ))}
        </>
    );
}

function PaymentModal({ fee, open, onClose, onSuccess }: { fee: FeeRow | null; open: boolean; onClose: () => void; onSuccess: () => void }) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [gateways, setGateways] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedGateway, setSelectedGateway] = useState<string>("offline");

    // form data
    const [paymentDate, setPaymentDate] = useState("");
    const [amount, setAmount] = useState("");
    const [referenceNo, setReferenceNo] = useState("");
    const [bankName, setBankName] = useState("");
    const [bankAccountNo, setBankAccountNo] = useState("");
    const [screenshot, setScreenshot] = useState<File | null>(null);

    useEffect(() => {
        if (open) {
            setLoading(true);
            api.get("/user/payment-gateways")
                .then(res => {
                    if (res.data.success) {
                        setGateways(res.data.data);
                        if (res.data.data.length > 0) {
                            setSelectedGateway(res.data.data[0].provider);
                        }
                    }
                })
                .finally(() => setLoading(false));
            
            if (fee) setAmount(fee.balance.toString());
        } else {
            // reset form
            setPaymentDate("");
            setReferenceNo("");
            setBankName("");
            setBankAccountNo("");
            setScreenshot(null);
        }
    }, [open, fee]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fee) return;
        setSubmitting(true);

        const formData = new FormData();
        formData.append("student_fee_master_id", fee.id.toString());
        formData.append("amount", amount);
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
        } catch (err: any) {
            toast({ variant: "destructive", title: t("error"), description: err.response?.data?.message || t("failed_to_submit_payment") });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t("pay_fee")} - {fee?.name}</DialogTitle>
                </DialogHeader>
                {loading ? (
                    <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t("payment_method")}</Label>
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
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{t("amount")}</Label>
                                        <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="0.01" step="0.01" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t("payment_date")}</Label>
                                        <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>{t("reference_no")}</Label>
                                    <Input value={referenceNo} onChange={e => setReferenceNo(e.target.value)} placeholder="Cheque No / Transaction ID" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{t("bank_name")}</Label>
                                        <Input value={bankName} onChange={e => setBankName(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t("bank_account_no")}</Label>
                                        <Input value={bankAccountNo} onChange={e => setBankAccountNo(e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>{t("screenshot")} / {t("proof")}</Label>
                                    <Input type="file" onChange={e => setScreenshot(e.target.files?.[0] || null)} accept="image/*,.pdf" />
                                </div>
                            </div>
                        ) : (
                            <div className="py-4 text-center text-muted-foreground text-sm">
                                {t("payment_gateway_coming_soon")}
                            </div>
                        )}
                        
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={onClose}>{t("cancel")}</Button>
                            <Button type="submit" disabled={submitting || selectedGateway !== "offline"}>
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
