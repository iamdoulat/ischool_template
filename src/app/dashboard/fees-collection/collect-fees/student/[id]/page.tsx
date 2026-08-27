"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
    CreditCard,
    Calendar,
    FileText,
    CheckCircle2,
    Loader2,
    ArrowLeft,
    Wallet,
    Banknote,
    Building,
    Zap,
    ExternalLink,
    Receipt,
    Calculator,
    AlertCircle,
    Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { useTranslation } from "@/hooks/use-translation";
import api from "@/lib/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { getImageUrl } from "@/lib/image-url";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast as sonnerToast } from "sonner";
import { cn } from "@/lib/utils";

interface FeePayment { amount: number; [key: string]: unknown; }
interface DueFee {
    id: number;
    is_transport?: boolean;
    pending_payment?: { id?: number; reference_no?: string; status?: string; [key: string]: unknown };
    fee_master: {
        amount: number;
        fee_group?: { name?: string };
        fee_type?: { name?: string; code?: string };
        due_date?: string;
        fine_amount?: number;
        [key: string]: unknown;
    };
    payments: FeePayment[];
    due_date?: string;
    [key: string]: unknown;
}
interface StudentData {
    name?: string;
    last_name?: string;
    admission_no?: string;
    avatar?: string;
    email?: string;
    schoolClass?: { name: string };
    section?: { name: string };
    [key: string]: unknown;
}

interface PaymentModeOption {
    id: string;
    label: string;
    isOnline: boolean;
    providerKey?: string;
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

export default function CollectStudentFeesPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { t } = useTranslation();
    const router = useRouter();
    const { symbol } = useCurrencyFormatter();
    const tt = useTranslateToast();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [initiatingOnline, setInitiatingOnline] = useState(false);
    const [studentData, setStudentData] = useState<StudentData | null>(null);
    const [dueFees, setDueFees] = useState<DueFee[]>([]);

    // Payment Modes dynamic list from backend gateways
    const [paymentModes, setPaymentModes] = useState<PaymentModeOption[]>([
        { id: "Cash", label: "Cash", isOnline: false },
        { id: "Bank Transfer", label: "Bank Transfer", isOnline: false },
        { id: "Cheque", label: "Cheque", isOnline: false },
        { id: "DD", label: "Demand Draft (DD)", isOnline: false },
    ]);

    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [selectedFee, setSelectedFee] = useState<DueFee | null>(null);
    const [paymentData, setPaymentData] = useState({
        amount: "",
        discount: "0",
        fine: "0",
        payment_mode: "Cash",
        transaction_id: "",
        note: "",
        date: new Date().toISOString().split('T')[0]
    });

    const fetchPaymentGateways = useCallback(async () => {
        try {
            const res = await api.get('system-setting/payment-settings');
            if (res.data?.status === 'success') {
                const settings = res.data.data || [];
                const offlineModes: PaymentModeOption[] = [
                    { id: "Cash", label: "Cash", isOnline: false },
                    { id: "Bank Transfer", label: "Bank Transfer", isOnline: false },
                    { id: "Cheque", label: "Cheque", isOnline: false },
                    { id: "DD", label: "Demand Draft (DD)", isOnline: false },
                ];

                const onlineModes: PaymentModeOption[] = [];

                settings.forEach((s: any) => {
                    if (s.status && s.provider !== 'offline' && s.provider !== 'active_gateway') {
                        let label = s.provider;
                        if (s.provider === 'uddoktapay') label = 'UddoktaPay (bKash / Nagad / Cards)';
                        else if (s.provider === 'stripe') label = 'Stripe (Credit/Debit Card)';
                        else if (s.provider === 'paypal') label = 'PayPal';
                        else if (s.provider === 'razorpay') label = 'Razorpay';
                        else if (s.provider === 'sslcommerz') label = 'SSLCommerz';
                        else if (s.provider === 'payu') label = 'PayU';
                        else if (s.provider === 'flutter_wave') label = 'Flutterwave';
                        else if (s.provider === 'jazzcash') label = 'JazzCash';
                        else if (s.provider === 'paytm') label = 'Paytm';
                        else if (s.provider === 'mollie') label = 'Mollie';
                        else if (s.provider === 'payfast') label = 'Payfast';
                        else label = s.provider.charAt(0).toUpperCase() + s.provider.slice(1);

                        onlineModes.push({
                            id: s.provider === 'uddoktapay' ? 'UddoktaPay' : s.provider.charAt(0).toUpperCase() + s.provider.slice(1),
                            label: label,
                            isOnline: true,
                            providerKey: s.provider
                        });
                    }
                });

                setPaymentModes([...onlineModes, ...offlineModes]);
            }
        } catch (error) {
            console.error("Failed to load payment gateways:", error);
        }
    }, []);

    const fetchStudentFees = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/fee-collection/student-fees/${id}`);
            setStudentData(res.data.data.student);
            setDueFees(res.data.data.fees);
        } catch (error) {
            tt.error("failed_to_fetch_student_fees");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchStudentFees();
        fetchPaymentGateways();
    }, [fetchStudentFees, fetchPaymentGateways]);

    const openPaymentDialog = (fee: DueFee) => {
        const total = Number(fee.fee_master?.amount) || 0;
        const paid = (fee.payments || []).reduce((acc: number, p: FeePayment) => acc + (Number(p.amount) || 0), 0);
        const due = Math.max(0, total - paid);
        const fineAmount = Number(fee.fee_master?.fine_amount) || 0;

        setSelectedFee(fee);
        setPaymentData({
            amount: due > 0 ? due.toFixed(2) : "0.00",
            discount: "0",
            fine: fineAmount > 0 ? fineAmount.toFixed(2) : "0",
            payment_mode: paymentModes[0]?.id || "Cash",
            transaction_id: "",
            note: "",
            date: new Date().toISOString().split('T')[0]
        });
        setIsPaymentDialogOpen(true);
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFee) return;

        const amountVal = parseFloat(paymentData.amount) || 0;
        if (amountVal <= 0) {
            sonnerToast.error("Amount to pay must be greater than 0");
            return;
        }

        setSubmitting(true);
        try {
            const payload: any = {
                amount: paymentData.amount,
                discount: paymentData.discount || "0",
                fine: paymentData.fine || "0",
                payment_mode: paymentData.payment_mode,
                transaction_id: paymentData.transaction_id?.trim() || undefined,
                is_online: isOnlineMode,
                date: paymentData.date,
                note: paymentData.transaction_id
                    ? `${paymentData.note ? paymentData.note + ' | ' : ''}TrxID: ${paymentData.transaction_id.trim()}`
                    : paymentData.note
            };

            if (selectedFee.is_transport) {
                payload.student_transport_fee_id = selectedFee.id;
            } else {
                payload.student_fee_master_id = selectedFee.id;
            }

            const res = await api.post("/fee-collection/collect-fee", payload);
            if (res.data?.data?.is_pending || (isOnlineMode && paymentData.transaction_id)) {
                tt.success("Payment submitted for approval");
                sonnerToast.success(res.data?.message || `Payment submitted (Ref: ${paymentData.transaction_id}). Status is Pending until Admin/Accounts approval.`);
            } else {
                tt.success("fee_payment_collected_successfully");
                sonnerToast.success("Payment recorded successfully");
            }
            setIsPaymentDialogOpen(false);
            fetchStudentFees();
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            tt.error(err.response?.data?.message || "failed_to_collect_payment");
            sonnerToast.error(err.response?.data?.message || "Failed to collect payment");
        } finally {
            setSubmitting(false);
        }
    };

    const handleInitiateOnlineCheckout = async () => {
        if (!selectedFee) return;
        const amountVal = parseFloat(paymentData.amount) || 0;
        if (amountVal <= 0) {
            sonnerToast.error("Please enter a valid amount");
            return;
        }

        setInitiatingOnline(true);
        try {
            const fullName = [studentData?.name, studentData?.last_name].filter(Boolean).join(" ") || "Student";
            const email = studentData?.email || "student@example.com";
            const activeOnline = paymentSettings.find(s => s.status && s.provider !== 'offline')?.provider || 'uddoktapay';
            const endpoint = activeOnline === 'paypal' ? '/payment/paypal/initiate' : '/payment/uddoktapay/initiate';

            const res = await api.post(endpoint, {
                amount: amountVal + (parseFloat(paymentData.fine) || 0) - (parseFloat(paymentData.discount) || 0),
                full_name: fullName,
                email: email,
                description: `${selectedFee.fee_master?.fee_type?.name || 'Fee'} Payment for ${fullName}`,
                metadata: {
                    student_id: id,
                    student_fee_master_id: !selectedFee.is_transport ? selectedFee.id : undefined,
                    student_transport_fee_id: selectedFee.is_transport ? selectedFee.id : undefined,
                    fee_type: selectedFee.fee_master?.fee_type?.name || "Fee",
                },
                redirect_url: window.location.href,
                cancel_url: window.location.href,
            });

            if (res.data?.status === 'success' && res.data?.payment_url) {
                sonnerToast.success(`Redirecting to ${activeOnline === 'paypal' ? 'PayPal' : 'UddoktaPay'} Checkout...`);
                window.open(res.data.payment_url, '_blank');
            } else {
                sonnerToast.error(res.data?.message || "Failed to initiate online checkout");
            }
        } catch (error: any) {
            const errMsg = error.response?.data?.message || "Online gateway error. Please verify gateway settings.";
            sonnerToast.error(errMsg);
        } finally {
            setInitiatingOnline(false);
        }
    };

    const fullName = [studentData?.name, studentData?.last_name].filter(Boolean).join(" ");
    const avatarFallback = (studentData?.name?.[0] || "S") + (studentData?.last_name?.[0] || "");

    const selectedModeObj = paymentModes.find(m => m.id === paymentData.payment_mode);
    const isOnlineMode = selectedModeObj?.isOnline || paymentData.payment_mode === "UddoktaPay" || !["Cash", "Bank Transfer", "Cheque", "DD"].includes(paymentData.payment_mode);

    // Validation
    const trxLength = (paymentData.transaction_id || "").trim().length;
    const isTrxValid = !isOnlineMode || trxLength > 6;
    const isAmountValid = (parseFloat(paymentData.amount) || 0) > 0;
    const isFormValid = isAmountValid && isTrxValid;

    // Calculation summary
    const numAmount = parseFloat(paymentData.amount) || 0;
    const numDiscount = parseFloat(paymentData.discount) || 0;
    const numFine = parseFloat(paymentData.fine) || 0;
    const netTotal = Math.max(0, numAmount + numFine - numDiscount);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans">
            {/* Header section with back button and student info */}
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={() => router.push(`/dashboard/fees-collection/collect-fees?student_id=${id}`)}
                    className="hover:bg-muted/50 -ml-2 text-muted-foreground hover:text-foreground transition-colors text-xs font-semibold"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Student List
                </Button>
            </div>

            {studentData && (
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.06)] bg-card/50 backdrop-blur-sm overflow-hidden rounded-xl">
                    <CardContent className="p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-white shadow-lg ring-2 ring-primary/20 shrink-0">
                                <AvatarImage src={studentData.avatar ? getImageUrl(studentData.avatar) : undefined} alt={fullName} className="object-cover" />
                                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white">
                                    {avatarFallback}
                                </AvatarFallback>
                            </Avatar>
                            <div className="space-y-2 text-center sm:text-left">
                                <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">{fullName}</h2>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold px-3 py-1 rounded-lg text-xs">
                                        Admission No: {studentData.admission_no || "N/A"}
                                    </Badge>
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 font-bold px-3 py-1 rounded-lg text-xs">
                                        Class {studentData.schoolClass?.name || "-"} ({studentData.section?.name || "-"})
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Fees Table */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.06)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Wallet className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-sm sm:text-base font-bold tracking-tight text-slate-800 leading-none">Student Fees Details</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{dueFees.length} fee record{dueFees.length === 1 ? '' : 's'}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow className="bg-muted/30 border-b border-muted/50 hover:bg-muted/30 text-xs">
                                <TableHead className="font-bold text-slate-800 py-4 pl-6 sm:pl-8">Fees Group</TableHead>
                                <TableHead className="font-bold text-slate-800 py-4">Fees Type</TableHead>
                                <TableHead className="font-bold text-slate-800 py-4">Fees Code</TableHead>
                                <TableHead className="font-bold text-slate-800 py-4">Due Date</TableHead>
                                <TableHead className="font-bold text-slate-800 py-4 text-right">Fine ({symbol})</TableHead>
                                <TableHead className="font-bold text-slate-800 py-4 text-right">Amount ({symbol})</TableHead>
                                <TableHead className="font-bold text-slate-800 py-4 text-center pr-6 sm:pr-8">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableSkeleton rows={3} cols={7} />
                            ) : dueFees.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-20 text-center">
                                        <div className="space-y-3">
                                            <div className="h-14 w-14 rounded-full bg-muted/30 flex items-center justify-center mx-auto">
                                                <CreditCard className="h-7 w-7 text-muted-foreground/30" />
                                            </div>
                                            <p className="text-muted-foreground text-sm font-medium">No fee records found for this student.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                dueFees.map((fee) => {
                                    const total = Number(fee.fee_master?.amount) || 0;
                                    const paid = (fee.payments || []).reduce((acc: number, p: FeePayment) => acc + (Number(p.amount) || 0), 0);
                                    const due = Math.max(0, total - paid);
                                    const isPaid = due <= 0 && total > 0;
                                    const isPartial = paid > 0 && due > 0;
                                    const fineAmount = Number(fee.fee_master?.fine_amount) || 0;

                                    return (
                                         <TableRow key={fee.is_transport ? `t_${fee.id}` : `r_${fee.id}`} className="group border-b border-muted/50 last:border-none hover:bg-muted/10 transition-colors">
                                             <TableCell className="py-4 pl-6 sm:pl-8">
                                                 <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold px-2.5 py-0.5 rounded-lg whitespace-nowrap text-xs">
                                                     {fee.fee_master?.fee_group?.name || "General"}
                                                 </Badge>
                                             </TableCell>
                                             <TableCell className="py-4">
                                                 <p className="text-xs sm:text-sm font-semibold text-slate-700">{fee.fee_master?.fee_type?.name || "N/A"}</p>
                                             </TableCell>
                                             <TableCell className="py-4">
                                                 <code className="text-[11px] bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-600">
                                                     {fee.fee_master?.fee_type?.code || "N/A"}
                                                 </code>
                                             </TableCell>
                                             <TableCell className="py-4">
                                                 <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                                                     <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                     {fee.fee_master?.due_date ? new Date(fee.fee_master.due_date).toLocaleDateString('en-GB') : "No Date"}
                                                 </div>
                                             </TableCell>
                                             <TableCell className="py-4 text-right">
                                                 <p className="text-xs sm:text-sm font-bold text-destructive">
                                                     {symbol}{fineAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                 </p>
                                             </TableCell>
                                             <TableCell className="py-4 text-right">
                                                 <div className="space-y-0.5">
                                                     <p className="text-xs sm:text-sm font-black text-slate-800">
                                                         {symbol}{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                     </p>
                                                     <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">
                                                         Paid: {symbol}{paid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                     </p>
                                                     {isPartial && (
                                                         <p className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">
                                                             Due: {symbol}{due.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                         </p>
                                                     )}
                                                 </div>
                                             </TableCell>
                                             <TableCell className="py-4 text-center pr-6 sm:pr-8">
                                                 {fee.pending_payment ? (
                                                     <div className="flex flex-col items-center gap-1">
                                                         <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-bold text-[10px] uppercase tracking-wider border border-amber-300 shadow-sm">
                                                             <Clock className="h-3 w-3 animate-pulse text-amber-600" /> Pending Approval
                                                         </div>
                                                         <span className="text-[9px] text-gray-500 font-mono">Trx: {fee.pending_payment.reference_no}</span>
                                                     </div>
                                                 ) : isPaid ? (
                                                     <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] uppercase tracking-wider">
                                                         <CheckCircle2 className="h-3 w-3" /> Paid
                                                     </div>
                                                 ) : (
                                                     <div className="flex flex-col items-center gap-1">
                                                         <Button
                                                             size="sm"
                                                             onClick={() => openPaymentDialog(fee)}
                                                             className="h-8 rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white shadow-sm flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 px-3 mx-auto"
                                                         >
                                                             <CreditCard className="h-3.5 w-3.5" /> Collect
                                                         </Button>
                                                         {isPartial && (
                                                             <Badge variant="outline" className="text-[9px] font-semibold text-amber-600 border-amber-300 bg-amber-50 px-1.5 py-0">
                                                                 Partial
                                                             </Badge>
                                                         )}
                                                     </div>
                                                 )}
                                             </TableCell>
                                         </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Complete Functional & Scrollable Payment Dialog */}
            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogContent className="sm:max-w-[560px] p-0 max-h-[90vh] flex flex-col overflow-hidden rounded-2xl border border-gray-100 shadow-2xl">
                    {/* Fixed Modal Header */}
                    <DialogHeader className="px-6 py-4 sm:px-7 sm:py-5 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shrink-0 relative">
                        <div className="flex items-center gap-3.5">
                            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md border border-white/30 shrink-0">
                                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight leading-snug">
                                    Collect Fee
                                </DialogTitle>
                                <DialogDescription className="text-white/90 text-xs font-medium truncate mt-0.5">
                                    {selectedFee?.fee_master.fee_group?.name || "General"} — {selectedFee?.fee_master.fee_type?.name} ({studentData?.name || "Student"})
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Scrollable Form Body */}
                    <form onSubmit={handlePaymentSubmit} className="flex-1 overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-7 sm:py-6 space-y-4 sm:space-y-5">
                            
                            {/* Summary calculation pill */}
                            <div className="p-3 bg-gradient-to-r from-amber-50/70 to-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Calculator className="h-4 w-4 text-indigo-600 shrink-0" />
                                    <span className="font-semibold text-gray-700">Net Payable Amount:</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-black text-indigo-700">
                                        {symbol}{netTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>

                            {/* Row 1: Amount & Date */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                                        Amount To Pay ({symbol}) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                                            {symbol}
                                        </span>
                                        <Input
                                            type="number"
                                            step="any"
                                            min="0"
                                            className="pl-8 h-10 rounded-lg bg-gray-50/60 border-gray-200 focus:bg-white text-xs font-bold text-gray-800 shadow-none focus:ring-1 focus:ring-indigo-500"
                                            value={paymentData.amount}
                                            onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                                        Payment Date <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                        <Input
                                            type="date"
                                            className="pl-9 h-10 rounded-lg bg-gray-50/60 border-gray-200 focus:bg-white text-xs font-medium text-gray-800 shadow-none focus:ring-1 focus:ring-indigo-500"
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
                                    <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                                        Discount ({symbol})
                                    </label>
                                    <Input
                                        type="number"
                                        step="any"
                                        min="0"
                                        className="h-10 rounded-lg bg-gray-50/60 border-gray-200 focus:bg-white text-xs text-gray-800 shadow-none focus:ring-1 focus:ring-indigo-500"
                                        value={paymentData.discount}
                                        onChange={(e) => setPaymentData({ ...paymentData, discount: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                                        Fine ({symbol})
                                    </label>
                                    <Input
                                        type="number"
                                        step="any"
                                        min="0"
                                        className="h-10 rounded-lg bg-gray-50/60 border-gray-200 focus:bg-white text-xs text-gray-800 shadow-none focus:ring-1 focus:ring-indigo-500"
                                        value={paymentData.fine}
                                        onChange={(e) => setPaymentData({ ...paymentData, fine: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Row 3: Dynamic Payment Mode from Active Gateways */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                                        Payment Mode <span className="text-red-500">*</span>
                                    </label>
                                    {isOnlineMode && (
                                        <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-200 text-[10px] font-bold px-2 py-0.5">
                                            Online Gateway Mode
                                        </Badge>
                                    )}
                                </div>
                                
                                <Select
                                    value={paymentData.payment_mode}
                                    onValueChange={(val) => setPaymentData({ ...paymentData, payment_mode: val })}
                                >
                                    <SelectTrigger className="h-10 rounded-lg border-gray-200 bg-gray-50/60 text-xs font-semibold focus:ring-indigo-500">
                                        <SelectValue placeholder="Select Payment Mode" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-56">
                                        {paymentModes.some(m => m.isOnline) && (
                                            <SelectGroup>
                                                <SelectLabel className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Active Online Gateways</SelectLabel>
                                                {paymentModes.filter(m => m.isOnline).map((mode) => (
                                                    <SelectItem key={mode.id} value={mode.id} className="text-xs py-2">
                                                        <div className="flex items-center gap-2">
                                                            <Zap className="h-3.5 w-3.5 text-amber-500" />
                                                            <span className="font-medium text-indigo-950">{mode.label}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        )}

                                        <SelectGroup>
                                            <SelectLabel className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Offline Collection</SelectLabel>
                                            {paymentModes.filter(m => !m.isOnline).map((mode) => (
                                                <SelectItem key={mode.id} value={mode.id} className="text-xs py-2">
                                                    <div className="flex items-center gap-2">
                                                        {mode.id === "Cash" ? <Banknote className="h-3.5 w-3.5 text-emerald-600" /> : <Building className="h-3.5 w-3.5 text-slate-500" />}
                                                        <span>{mode.label}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Online Mode Helper / Direct Checkout Box */}
                            {isOnlineMode && (
                                <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-3 text-xs animate-in fade-in duration-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-[11px]">
                                            <Zap className="h-3.5 w-3.5 text-amber-500" />
                                            <span>{paymentData.payment_mode} Online Processing</span>
                                        </div>
                                        {paymentData.payment_mode === "UddoktaPay" && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={handleInitiateOnlineCheckout}
                                                disabled={initiatingOnline}
                                                className="h-7 px-2.5 text-[10px] font-bold bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-600 hover:text-white transition-colors"
                                            >
                                                {initiatingOnline ? (
                                                    <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Launching...</>
                                                ) : (
                                                    <><ExternalLink className="h-3 w-3 mr-1" /> Pay via UddoktaPay</>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                                                Transaction ID / Reference (If already paid online) <span className="text-red-500">*</span>
                                            </label>
                                            <span className={cn(
                                                "text-[10px] font-mono font-bold",
                                                trxLength > 6 ? "text-emerald-600" : "text-amber-600"
                                            )}>
                                                {trxLength > 6 ? `✓ ${trxLength} chars` : `${trxLength}/7 min chars`}
                                            </span>
                                        </div>
                                        <Input
                                            type="text"
                                            placeholder="e.g. TRX99887766 or Invoice ID (more than 6 characters)"
                                            className={cn(
                                                "h-9 text-xs bg-white font-mono shadow-none transition-colors",
                                                trxLength === 0
                                                    ? "border-gray-300"
                                                    : trxLength > 6
                                                        ? "border-emerald-500 focus:ring-emerald-500"
                                                        : "border-amber-400 focus:ring-amber-500"
                                            )}
                                            value={paymentData.transaction_id}
                                            onChange={(e) => setPaymentData({ ...paymentData, transaction_id: e.target.value })}
                                            required={isOnlineMode}
                                        />
                                        {trxLength <= 6 ? (
                                            <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1 pt-0.5">
                                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                                Please input more than 6 characters to enable &quot;Complete Payment&quot;
                                            </p>
                                        ) : (
                                            <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 pt-0.5">
                                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                                Valid Transaction ID — Payment will be submitted as <strong>Pending Approval</strong>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Payment Note */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                                    Payment Note / Remarks
                                </label>
                                <div className="relative">
                                    <FileText className="absolute left-3.5 top-3 h-3.5 w-3.5 text-gray-400" />
                                    <textarea
                                        className="flex min-h-[75px] w-full rounded-lg border border-gray-200 bg-gray-50/60 pl-9 pr-3 py-2.5 text-xs text-gray-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:bg-white transition-all resize-none shadow-none"
                                        placeholder="Add receipt number, memo, or payment instructions..."
                                        value={paymentData.note}
                                        onChange={(e) => setPaymentData({ ...paymentData, note: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Fixed Modal Footer */}
                        <DialogFooter className="px-6 py-3.5 sm:px-7 sm:py-4 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 shrink-0">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full sm:w-auto h-9 sm:h-10 px-5 text-xs font-bold rounded-lg border-gray-200 hover:bg-white text-gray-700"
                                onClick={() => setIsPaymentDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className={cn(
                                    "w-full sm:w-auto h-9 sm:h-10 px-6 rounded-lg font-bold text-xs text-white shadow-md transition-all",
                                    isFormValid
                                        ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 shadow-indigo-500/20"
                                        : "bg-gray-300 text-gray-500 shadow-none cursor-not-allowed opacity-60"
                                )}
                                disabled={submitting || !isFormValid}
                            >
                                {submitting ? (
                                    <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Processing...</>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                                        {isOnlineMode ? "Submit for Approval" : "Complete Payment"}
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
