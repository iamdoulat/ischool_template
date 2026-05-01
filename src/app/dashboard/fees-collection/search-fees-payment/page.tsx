"use client";

import { Search, Info, User, Calendar, CreditCard, Receipt, Eye, Printer, Download, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
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
            admission_no: string;
            school_class: { class: string };
            section: { section: string };
        };
        fee_master: {
            fee_type: { name: string };
        };
    };
    collected_by: {
        name: string;
    };
}

export default function SearchFeesPaymentPage() {
    const [paymentId, setPaymentId] = useState("");
    const [results, setResults] = useState<PaymentRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSearch = async () => {
        if (!paymentId) {
            toast("error", "Please enter a Payment ID");
            return;
        }

        setLoading(true);
        try {
            const res = await api.get("/fee-collection/search-payments", {
                params: { payment_id: paymentId }
            });
            setResults(res.data.data);
            if (res.data.data.length === 0) {
                toast("info", "No payment found with this ID");
            }
        } catch (error) {
            toast("error", "Failed to search payment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Search Fees Payment</h1>
                <p className="text-muted-foreground">Retrieve detailed transaction history using a unique Payment ID.</p>
            </div>

            {/* Search Section */}
            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md overflow-hidden">
                <CardContent className="p-8">
                    <div className="flex flex-col sm:flex-row items-end gap-6">
                        <div className="space-y-2.5 flex-1 max-w-md group">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5 ml-1 transition-colors group-focus-within:text-primary">
                                <Receipt className="h-3 w-3" /> Payment ID <span className="text-destructive font-black">*</span>
                            </label>
                            <div className="relative">
                                <Input
                                    placeholder="Enter Payment ID (e.g., 1024)"
                                    value={paymentId}
                                    onChange={(e) => setPaymentId(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    className="h-12 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-bold text-lg"
                                />
                            </div>
                        </div>
                        <Button
                            onClick={handleSearch}
                            disabled={loading}
                            className="h-12 px-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2 border-none"
                        >
                            {loading ? <Search className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            Search Payment
                        </Button>
                    </div>

                    {!results.length && (
                        <div className="mt-8 p-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-4 max-w-2xl animate-in slide-in-from-bottom-2 duration-700">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Info className="h-5 w-5 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-primary tracking-tight uppercase tracking-wider">Search Instructions</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Enter the unique <strong>Payment ID</strong> found on the student's receipt or transaction log. This will retrieve full details including student info, fee type, and collector details.
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Results Section */}
            {results.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                    {/* Main Receipt Card */}
                    {results.map((payment) => (
                        <Card key={payment.id} className="lg:col-span-2 border-none shadow-2xl bg-card overflow-hidden rounded-3xl relative">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Receipt className="h-32 w-32 rotate-12 text-primary" />
                            </div>
                            
                            <CardHeader className="p-8 border-b border-muted/20 bg-muted/5">
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                            <Receipt className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl font-bold tracking-tight">Payment Receipt</CardTitle>
                                            <p className="text-muted-foreground text-xs font-black uppercase tracking-widest">Transaction ID: #{payment.id}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" className="rounded-xl border-muted/50 font-bold text-[10px] uppercase tracking-widest h-9 px-4 hover:bg-muted/10">
                                            <Printer className="h-3.5 w-3.5 mr-2" /> Print
                                        </Button>
                                        <Button variant="outline" size="sm" className="rounded-xl border-muted/50 font-bold text-[10px] uppercase tracking-widest h-9 px-4 hover:bg-muted/10">
                                            <Download className="h-3.5 w-3.5 mr-2" /> PDF
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-8 space-y-8 relative z-10">
                                {/* Student Info Row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5"><User className="h-3 w-3" /> Student Name</span>
                                        <p className="text-lg font-bold">{payment.student_fee_master.student.name} {payment.student_fee_master.student.last_name}</p>
                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">{payment.student_fee_master.student.admission_no}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">Class & Section</span>
                                        <p className="text-lg font-bold">{payment.student_fee_master.student.school_class.class} ({payment.student_fee_master.student.section.section})</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Payment Date</span>
                                        <p className="text-lg font-bold">{new Date(payment.date).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {/* Payment Details Table */}
                                <div className="rounded-2xl border border-muted/20 bg-muted/5 overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-muted/10">
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Description</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-muted/10">
                                            <tr>
                                                <td className="px-6 py-4 font-bold text-sm">{payment.student_fee_master.fee_master.fee_type.name}</td>
                                                <td className="px-6 py-4 font-black text-sm text-right">${payment.amount.toFixed(2)}</td>
                                            </tr>
                                            {payment.discount > 0 && (
                                                <tr className="text-green-600 bg-green-50/30">
                                                    <td className="px-6 py-4 font-bold text-xs italic">Discount Applied</td>
                                                    <td className="px-6 py-4 font-black text-xs text-right">-${payment.discount.toFixed(2)}</td>
                                                </tr>
                                            )}
                                            {payment.fine > 0 && (
                                                <tr className="text-red-600 bg-red-50/30">
                                                    <td className="px-6 py-4 font-bold text-xs italic">Fine/Late Fee</td>
                                                    <td className="px-6 py-4 font-black text-xs text-right">+${payment.fine.toFixed(2)}</td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-primary/5">
                                                <td className="px-6 py-5 font-black text-primary text-sm uppercase tracking-widest">Total Received</td>
                                                <td className="px-6 py-5 font-black text-primary text-xl text-right">${(payment.amount - payment.discount + payment.fine).toFixed(2)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {/* Extra Details Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5"><CreditCard className="h-3 w-3" /> Payment Method</span>
                                        <div className="inline-flex items-center px-4 py-2 rounded-xl bg-muted/20 border border-muted/50 text-sm font-bold">
                                            {payment.payment_mode}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">Collected By</span>
                                        <p className="text-sm font-bold text-muted-foreground">{payment.collected_by.name}</p>
                                    </div>
                                </div>

                                {payment.note && (
                                    <div className="p-4 rounded-2xl bg-amber-50/30 border border-amber-100 italic text-xs text-muted-foreground">
                                        <strong>Note:</strong> {payment.note}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}

                    {/* Summary / Stats Card */}
                    <div className="space-y-6">
                        <Card className="border-none shadow-xl bg-gradient-to-br from-primary to-indigo-600 text-white overflow-hidden rounded-3xl">
                            <CardContent className="p-8 space-y-4">
                                <div className="p-3 bg-white/20 rounded-2xl w-fit">
                                    <CheckCircle2 className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white/80 tracking-tight">Verified Payment</h3>
                                    <p className="text-xs text-white/60 font-medium">This transaction has been successfully verified in the system.</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-xl bg-card overflow-hidden rounded-3xl border border-muted/20">
                            <CardHeader className="p-6 border-b border-muted/10 bg-muted/5">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Action Center</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-3">
                                <Button variant="outline" className="w-full h-11 rounded-xl border-muted/50 font-bold text-xs justify-start hover:bg-muted/10 group">
                                    <Eye className="h-4 w-4 mr-3 text-muted-foreground group-hover:text-primary transition-colors" /> View Student Profile
                                </Button>
                                <Button variant="outline" className="w-full h-11 rounded-xl border-muted/50 font-bold text-xs justify-start hover:bg-muted/10 group">
                                    <Calendar className="h-4 w-4 mr-3 text-muted-foreground group-hover:text-primary transition-colors" /> View All Student Fees
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
