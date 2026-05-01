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
    ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

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

export default function OfflineBankPaymentsPage() {
    const [payments, setPayments] = useState<OfflinePayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPayment, setSelectedPayment] = useState<OfflinePayment | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [processing, setProcessing] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchPayments();
    }, [filterStatus]);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const res = await api.get("/fee-collection/offline-payments", {
                params: { status: filterStatus === "all" ? undefined : filterStatus }
            });
            setPayments(res.data.data || []);
        } catch (error) {
            toast("error", "Failed to fetch payments");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!selectedPayment) return;
        setProcessing(true);
        try {
            await api.post(`/fee-collection/offline-payments/${selectedPayment.id}/approve`);
            toast("success", "Payment approved and applied to student records");
            setIsDetailsOpen(false);
            fetchPayments();
        } catch (error) {
            toast("error", "Failed to approve payment");
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedPayment || !rejectionReason) {
            toast("error", "Please provide a reason for rejection");
            return;
        }
        setProcessing(true);
        try {
            await api.post(`/fee-collection/offline-payments/${selectedPayment.id}/reject`, {
                rejection_reason: rejectionReason
            });
            toast("success", "Payment rejected and student notified");
            setIsDetailsOpen(false);
            fetchPayments();
        } catch (error) {
            toast("error", "Failed to reject payment");
        } finally {
            setProcessing(false);
        }
    };

    const filteredPayments = payments.filter(p => 
        p.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.student.admission_no.includes(searchQuery) ||
        p.reference_no?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-wider"><Clock className="h-3 w-3" /> Pending</span>;
            case "approved":
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-wider"><CheckCircle2 className="h-3 w-3" /> Approved</span>;
            case "rejected":
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-wider"><XCircle className="h-3 w-3" /> Rejected</span>;
            default:
                return null;
        }
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Offline Bank Payments</h1>
                <p className="text-muted-foreground">Verify and manage fee payments submitted via bank transfer or offline deposits.</p>
            </div>

            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md overflow-hidden">
                <CardHeader className="border-b border-muted/20 bg-muted/5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                <Wallet className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Payment Requests</CardTitle>
                                <CardDescription>Review receipts and reference numbers to approve student payments.</CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-muted/20 p-1 rounded-xl border border-muted/50">
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
                                    {status}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardHeader>

                <div className="p-6 space-y-6">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full max-sm group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search by name, admission no or ref..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-11 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium"
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                                {[
                                    { icon: FileSpreadsheet, label: "Excel" },
                                    { icon: FileText, label: "CSV" },
                                    { icon: FileCode, label: "PDF" },
                                    { icon: Printer, label: "Print" }
                                ].map((tool, i) => (
                                    <Button
                                        key={i}
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all rounded-xl"
                                    >
                                        <tool.icon className="h-4 w-4" />
                                    </Button>
                                ))}
                            </div>
                            <div className="h-8 w-px bg-muted/50 mx-2" />
                            <select className="h-11 px-4 rounded-xl border border-muted/50 bg-muted/30 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold text-muted-foreground">
                                <option>50</option>
                                <option>100</option>
                                <option>All</option>
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-2xl border border-muted/20 overflow-hidden bg-muted/5 shadow-inner">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-muted/10">
                                        {[
                                            "Request ID", "Student Detail", "Payment Info", "Amount ($)", "Status", "Action"
                                        ].map((header) => (
                                            <th key={header} className={cn(
                                                "px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 border-b border-muted/20 whitespace-nowrap",
                                                header === "Action" ? "text-center w-32" : ""
                                            )}>
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-muted/10">
                                    {loading ? (
                                        Array.from({ length: 3 }).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan={6} className="px-6 py-8">
                                                    <div className="h-12 bg-muted/20 rounded-xl" />
                                                </td>
                                            </tr>
                                        ))
                                    ) : filteredPayments.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center gap-3 opacity-30">
                                                    <Wallet className="h-12 w-12" />
                                                    <p className="font-bold tracking-tight text-lg">No payment requests found</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredPayments.map((payment) => (
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
                                                        <span className="text-xs font-bold text-primary">{payment.student_fee_master?.fee_master.fee_type.name || 'General Payment'}</span>
                                                        <span className="text-[10px] text-muted-foreground font-medium">Ref: {payment.reference_no || 'N/A'}</span>
                                                        <span className="text-[10px] text-muted-foreground font-medium">Date: {new Date(payment.payment_date).toLocaleDateString()}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-sm font-black text-foreground">${payment.amount.toFixed(2)}</td>
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
                                                            className="h-9 w-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-110 active:scale-95"
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
                </div>
            </Card>

            {/* Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-3xl border-none shadow-2xl rounded-3xl overflow-hidden p-0 bg-background/95 backdrop-blur-xl">
                    <DialogHeader className="p-8 border-b border-muted/20 bg-muted/5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                    <Wallet className="h-6 w-6" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-bold">Payment Details</DialogTitle>
                                    <DialogDescription className="text-muted-foreground font-medium">
                                        Review the submission from {selectedPayment?.student.name}
                                    </DialogDescription>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-2xl font-black text-primary">${selectedPayment?.amount.toFixed(2)}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Request #{selectedPayment?.id}</span>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[60vh] overflow-y-auto">
                        {/* Info Section */}
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">Bank Name</span>
                                    <p className="text-sm font-bold">{selectedPayment?.bank_name || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">Account No</span>
                                    <p className="text-sm font-bold">{selectedPayment?.bank_account_no || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">Reference No</span>
                                    <p className="text-sm font-bold text-primary">{selectedPayment?.reference_no || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">Payment Date</span>
                                    <p className="text-sm font-bold">{selectedPayment?.payment_date ? new Date(selectedPayment.payment_date).toLocaleDateString() : 'N/A'}</p>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-muted/20 border border-muted/50 space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">Rejection Reason (Required for rejection)</span>
                                <Textarea 
                                    placeholder="Provide a reason if rejecting this payment..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="min-h-[100px] bg-background/50 border-muted/50 rounded-xl text-xs font-medium resize-none focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        {/* Image Section */}
                        <div className="space-y-3">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                                <FileText className="h-3 w-3" /> Payment Proof / Screenshot
                            </span>
                            <div className="aspect-[4/3] rounded-2xl bg-muted/10 border-2 border-dashed border-muted/50 flex items-center justify-center overflow-hidden group/img relative">
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
                                        <span className="text-xs font-bold">No Screenshot Uploaded</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-8 bg-muted/5 border-t border-muted/20 flex flex-col sm:flex-row gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsDetailsOpen(false)}
                            className="flex-1 h-12 rounded-2xl font-bold uppercase tracking-widest text-[10px] border-muted/50 hover:bg-muted/10"
                        >
                            Close
                        </Button>
                        {selectedPayment?.status === 'pending' && (
                            <>
                                <Button
                                    onClick={handleReject}
                                    disabled={processing}
                                    className="flex-1 h-12 rounded-2xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-destructive/20 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                    Reject Payment
                                </Button>
                                <Button
                                    onClick={handleApprove}
                                    disabled={processing}
                                    className="flex-[1.5] h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                    Approve & Apply Fee
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

