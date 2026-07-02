"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
    UserCircle,
    CreditCard,
    Calendar,
    FileText,
    CheckCircle2,
    Loader2,
    ArrowLeft,
    Wallet
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

interface FeePayment { amount: number; [key: string]: unknown; }
interface DueFee {
    id: number;
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
    schoolClass?: { name: string };
    section?: { name: string };
    [key: string]: unknown;
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
    }, [fetchStudentFees]);

    const openPaymentDialog = (fee: DueFee) => {
        const total = fee.fee_master.amount;
        const paid = fee.payments.reduce((acc: number, p: FeePayment) => acc + p.amount, 0);
        const due = total - paid;

        setSelectedFee(fee);
        setPaymentData({
            ...paymentData,
            amount: due.toString(),
            date: new Date().toISOString().split('T')[0]
        });
        setIsPaymentDialogOpen(true);
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFee) return;
        setSubmitting(true);
        try {
            await api.post("/fee-collection/collect-fee", {
                student_fee_master_id: selectedFee.id,
                ...paymentData
            });
            tt.success("fee_payment_collected_successfully");
            setIsPaymentDialogOpen(false);
            fetchStudentFees(); // Refresh fees
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            tt.error(err.response?.data?.message || "failed_to_collect_payment");
        } finally {
            setSubmitting(false);
        }
    };

    const fullName = [studentData?.name, studentData?.last_name].filter(Boolean).join(" ");
    const avatarFallback = (studentData?.name?.[0] || "S") + (studentData?.last_name?.[0] || "");

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header section with back button and student info */}
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={() => router.push(`/dashboard/fees-collection/collect-fees?student_id=${id}`)}
                    className="hover:bg-muted/50 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Student List
                </Button>
            </div>

            {studentData && (
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden">
                    <CardContent className="p-8">
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <Avatar className="h-24 w-24 border-4 border-white shadow-lg ring-2 ring-primary/20 shrink-0">
                                <AvatarImage src={studentData.avatar ? getImageUrl(studentData.avatar) : undefined} alt={fullName} className="object-cover" />
                                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white">
                                    {avatarFallback}
                                </AvatarFallback>
                            </Avatar>
                            <div className="space-y-2 text-center sm:text-left">
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{fullName}</h2>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold px-3 py-1 rounded-lg text-sm">
                                        {studentData.admission_no}
                                    </Badge>
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 font-bold px-3 py-1 rounded-lg text-sm">
                                        Class {studentData.schoolClass?.name} ({studentData.section?.name})
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Fees Table */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Wallet className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Student Fees Details</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{dueFees.length} fee record{dueFees.length === 1 ? '' : 's'}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow className="bg-muted/30 border-b border-muted/50 hover:bg-muted/30">
                                <TableHead className="font-bold text-slate-800 py-5 pl-8">Fees Group</TableHead>
                                <TableHead className="font-bold text-slate-800 py-5">Fees Type</TableHead>
                                <TableHead className="font-bold text-slate-800 py-5">Fees Code</TableHead>
                                <TableHead className="font-bold text-slate-800 py-5">Due Date</TableHead>
                                <TableHead className="font-bold text-slate-800 py-5 text-right">Fine ({symbol})</TableHead>
                                <TableHead className="font-bold text-slate-800 py-5 text-right">Amount ({symbol})</TableHead>
                                <TableHead className="font-bold text-slate-800 py-5 text-center pr-8">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableSkeleton rows={3} cols={7} />
                            ) : dueFees.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-20 text-center">
                                        <div className="space-y-3">
                                            <div className="h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto">
                                                <CreditCard className="h-8 w-8 text-muted-foreground/30" />
                                            </div>
                                            <p className="text-muted-foreground font-medium">No fees records found for this student.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                dueFees.map((fee) => {
                                    const total = fee.fee_master.amount;
                                    const paid = fee.payments.reduce((acc: number, p: FeePayment) => acc + p.amount, 0);
                                    const due = total - paid;
                                    const isPaid = due <= 0;

                                    return (
                                        <TableRow key={fee.id} className="group border-b border-muted/50 last:border-none hover:bg-muted/10 transition-colors">
                                            <TableCell className="py-4 pl-8">
                                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold px-2.5 py-0.5 rounded-lg whitespace-nowrap">
                                                    {fee.fee_master.fee_group?.name || "N/A"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <p className="text-sm font-semibold text-slate-700">{fee.fee_master.fee_type?.name || "N/A"}</p>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <code className="text-[11px] bg-slate-100 px-2 py-1 rounded font-mono text-slate-600">
                                                    {fee.fee_master.fee_type?.code || "N/A"}
                                                </code>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {fee.fee_master.due_date ? new Date(fee.fee_master.due_date).toLocaleDateString('en-GB') : "No Date"}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 text-right">
                                                <p className="text-sm font-bold text-destructive">
                                                    {symbol}{(fee.fee_master.fine_amount || 0).toLocaleString()}
                                                </p>
                                            </TableCell>
                                            <TableCell className="py-4 text-right">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black text-slate-800">{symbol}{total.toLocaleString()}</p>
                                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">Paid: {symbol}{paid.toLocaleString()}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 text-center pr-8">
                                                {isPaid ? (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] uppercase tracking-wider">
                                                        <CheckCircle2 className="h-3 w-3" /> Paid
                                                    </div>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => openPaymentDialog(fee)}
                                                        className="h-8 rounded-lg bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-200 flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 px-3 mx-auto"
                                                    >
                                                        <span className="font-bold text-sm leading-none">{symbol}</span> Collect
                                                    </Button>
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

            {/* Payment Dialog */}
            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-lg border-none shadow-2xl">
                    <DialogHeader className="p-8 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white relative">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-md border border-white/30">
                                <CreditCard className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-bold tracking-tight">Collect Fee</DialogTitle>
                                <DialogDescription className="text-white/80 font-medium">
                                    {selectedFee?.fee_master.fee_group?.name} - {selectedFee?.fee_master.fee_type?.name}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handlePaymentSubmit}>
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                        Amount To Pay <span className="text-destructive">*</span>
                                    </label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            className="pl-11 h-12 rounded-lg bg-muted/30 border-muted/50 focus:bg-white font-bold"
                                            value={paymentData.amount}
                                            onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                        Payment Date <span className="text-destructive">*</span>
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="date"
                                            className="pl-11 h-12 rounded-lg bg-muted/30 border-muted/50 focus:bg-white font-medium"
                                            value={paymentData.date}
                                            onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                        Discount
                                    </label>
                                    <Input
                                        type="number"
                                        className="h-12 rounded-lg bg-muted/30 border-muted/50 focus:bg-white"
                                        value={paymentData.discount}
                                        onChange={(e) => setPaymentData({ ...paymentData, discount: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                        Fine
                                    </label>
                                    <Input
                                        type="number"
                                        className="h-12 rounded-lg bg-muted/30 border-muted/50 focus:bg-white"
                                        value={paymentData.fine}
                                        onChange={(e) => setPaymentData({ ...paymentData, fine: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                    Payment Mode <span className="text-destructive">*</span>
                                </label>
                                <select
                                    className="flex h-12 w-full rounded-lg border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-white focus-visible:border-primary transition-all font-medium"
                                    value={paymentData.payment_mode}
                                    onChange={(e) => setPaymentData({ ...paymentData, payment_mode: e.target.value })}
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="DD">DD</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Online">Online</option>
                                </select>
                            </div>

                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                    Payment Note
                                </label>
                                <div className="relative">
                                    <FileText className="absolute left-4 top-3 h-4 w-4 text-muted-foreground" />
                                    <textarea
                                        className="flex min-h-[100px] w-full rounded-lg border border-muted/50 bg-muted/30 px-11 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-white transition-all resize-none"
                                        placeholder="Add any specific instructions or notes..."
                                        value={paymentData.note}
                                        onChange={(e) => setPaymentData({ ...paymentData, note: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="p-8 bg-muted/20 border-t border-muted/50 flex gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 h-12 rounded-lg font-bold border-muted/50 hover:bg-white hover:text-slate-900"
                                onClick={() => setIsPaymentDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="gradient"
                                className="flex-1 h-12 rounded-lg font-bold shadow-lg shadow-primary/20"
                                disabled={submitting}
                            >
                                {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
                                Complete Payment
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
