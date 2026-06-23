"use client";

import { Search, Info, User, Calendar, CreditCard, Receipt, ReceiptText, Eye, Printer, Download, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";

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

function CardSkeleton({ count = 6 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="rounded-xl border border-muted/30 p-4 space-y-3 bg-card animate-pulse">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-muted/60" />
                        <div className="space-y-2 flex-1">
                            <div className="h-3 w-1/2 rounded bg-muted/60" />
                            <div className="h-3 w-1/3 rounded bg-muted/60" />
                        </div>
                    </div>
                    <div className="h-3 w-full rounded bg-muted/60" />
                    <div className="h-3 w-3/4 rounded bg-muted/60" />
                </div>
            ))}
        </>
    );
}

export default function SearchFeesPaymentPage() {
    const [paymentId, setPaymentId] = useState("");
    const [results, setResults] = useState<PaymentRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();
    const tt = useTranslateToast();

    const handleSearch = async () => {
        if (!paymentId) {
            tt.error("please_enter_a_payment_id");
            return;
        }

        setLoading(true);
        try {
            const res = await api.get("/fee-collection/search-payments", {
                params: { payment_id: paymentId }
            });
            setResults(res.data.data);
            if (res.data.data.length === 0) {
                tt.info("no_payment_found_with_this_id");
            }
        } catch (error) {
            tt.error("failed_to_search_payment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{t("search_fees_payment")}</h1>
                <p className="text-muted-foreground">{t("retrieve_detailed_transaction_history")}</p>
            </div>

            {/* Search Section */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <ReceiptText className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("search_fees_payment")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("x_results_found", { count: results.length })}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="flex flex-col sm:flex-row items-end gap-6">
                        <div className="space-y-2.5 flex-1 max-w-md group">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5 ml-1 transition-colors group-focus-within:text-primary">
                                <Receipt className="h-3 w-3" /> {t("payment_id")} <span className="text-destructive font-black">*</span>
                            </label>
                            <div className="relative">
                                <Input
                                    placeholder={t("enter_payment_id_placeholder")}
                                    value={paymentId}
                                    onChange={(e) => setPaymentId(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    className="h-12 rounded-lg bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-bold text-lg"
                                />
                            </div>
                        </div>
                        <Button
                            variant="gradient"
                            onClick={handleSearch}
                            disabled={loading}
                            className="h-12 px-10 rounded-lg flex items-center gap-2"
                        >
                            {loading ? <Search className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            {t("search_payment")}
                        </Button>
                    </div>

                    {!results.length && !loading && (
                        <div className="mt-8 p-6 rounded-lg bg-primary/5 border border-primary/10 flex items-start gap-4 max-w-2xl animate-in slide-in-from-bottom-2 duration-700">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Info className="h-5 w-5 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-primary tracking-tight uppercase tracking-wider">{t("search_instructions")}</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {t("search_instructions_description")}
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Loading Skeleton */}
            {loading && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <CardSkeleton count={1} />
                    </div>
                    <div className="space-y-6">
                        <CardSkeleton count={2} />
                    </div>
                </div>
            )}

            {/* Results Section */}
            {!loading && results.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                    {/* Main Receipt Card */}
                    {results.map((payment) => (
                        <Card key={payment.id} className="lg:col-span-2 border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 rounded-lg relative">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Receipt className="h-32 w-32 rotate-12 text-primary" />
                            </div>

                            <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] relative z-10">
                                <div className="flex items-center gap-2.5">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                        <ReceiptText className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("payment_receipt")}</CardTitle>
                                        <p className="text-[11px] text-gray-500 mt-1">{t("transaction_id")}: #{payment.id}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="rounded-lg border-muted/50 font-bold text-[10px] uppercase tracking-widest h-9 px-4 hover:bg-muted/10">
                                        <Printer className="h-3.5 w-3.5 mr-2" /> {t("print")}
                                    </Button>
                                    <Button variant="outline" size="sm" className="rounded-lg border-muted/50 font-bold text-[10px] uppercase tracking-widest h-9 px-4 hover:bg-muted/10">
                                        <Download className="h-3.5 w-3.5 mr-2" /> {t("pdf")}
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="p-8 space-y-8 relative z-10">
                                {/* Student Info Row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5"><User className="h-3 w-3" /> {t("student_name")}</span>
                                        <p className="text-lg font-bold">{payment.student_fee_master.student.name} {payment.student_fee_master.student.last_name}</p>
                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">{payment.student_fee_master.student.admission_no}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">{t("class_and_section")}</span>
                                        <p className="text-lg font-bold">{payment.student_fee_master.student.school_class.class} ({payment.student_fee_master.student.section.section})</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {t("payment_date")}</span>
                                        <p className="text-lg font-bold">{new Date(payment.date).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {/* Payment Details Table */}
                                <div className="rounded-lg border border-muted/20 bg-muted/5 overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-muted/10">
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{t("description")}</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-right">{t("amount")}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-muted/10">
                                            <tr>
                                                <td className="px-6 py-4 font-bold text-sm">{payment.student_fee_master.fee_master.fee_type.name}</td>
                                                <td className="px-6 py-4 font-black text-sm text-right">${payment.amount.toFixed(2)}</td>
                                            </tr>
                                            {payment.discount > 0 && (
                                                <tr className="text-green-600 bg-green-50/30">
                                                    <td className="px-6 py-4 font-bold text-xs italic">{t("discount_applied")}</td>
                                                    <td className="px-6 py-4 font-black text-xs text-right">-${payment.discount.toFixed(2)}</td>
                                                </tr>
                                            )}
                                            {payment.fine > 0 && (
                                                <tr className="text-red-600 bg-red-50/30">
                                                    <td className="px-6 py-4 font-bold text-xs italic">{t("fine_or_late_fee")}</td>
                                                    <td className="px-6 py-4 font-black text-xs text-right">+${payment.fine.toFixed(2)}</td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-primary/5">
                                                <td className="px-6 py-5 font-black text-primary text-sm uppercase tracking-widest">{t("total_received")}</td>
                                                <td className="px-6 py-5 font-black text-primary text-xl text-right">${(payment.amount - payment.discount + payment.fine).toFixed(2)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {/* Extra Details Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5"><CreditCard className="h-3 w-3" /> {t("payment_method")}</span>
                                        <div className="inline-flex items-center px-4 py-2 rounded-lg bg-muted/20 border border-muted/50 text-sm font-bold">
                                            {payment.payment_mode}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">{t("collected_by")}</span>
                                        <p className="text-sm font-bold text-muted-foreground">{payment.collected_by.name}</p>
                                    </div>
                                </div>

                                {payment.note && (
                                    <div className="p-4 rounded-lg bg-amber-50/30 border border-amber-100 italic text-xs text-muted-foreground">
                                        <strong>{t("note_label")}</strong> {payment.note}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}

                    {/* Summary / Stats Card */}
                    <div className="space-y-6">
                        <Card className="border-none shadow-xl bg-gradient-to-br from-primary to-indigo-600 text-white overflow-hidden rounded-lg">
                            <CardContent className="p-8 space-y-4">
                                <div className="p-3 bg-white/20 rounded-lg w-fit">
                                    <CheckCircle2 className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white/80 tracking-tight">{t("verified_payment")}</h3>
                                    <p className="text-xs text-white/60 font-medium">{t("transaction_successfully_verified")}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 rounded-lg">
                            <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                    <ReceiptText className="h-5 w-5" />
                                </span>
                                <div>
                                    <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("action_center")}</CardTitle>
                                    <p className="text-[11px] text-gray-500 mt-1">{t("quick_links")}</p>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-3">
                                <Button variant="outline" className="w-full h-11 rounded-lg border-muted/50 font-bold text-xs justify-start hover:bg-muted/10 group">
                                    <Eye className="h-4 w-4 mr-3 text-muted-foreground group-hover:text-primary transition-colors" /> {t("view_student_profile")}
                                </Button>
                                <Button variant="outline" className="w-full h-11 rounded-lg border-muted/50 font-bold text-xs justify-start hover:bg-muted/10 group">
                                    <Calendar className="h-4 w-4 mr-3 text-muted-foreground group-hover:text-primary transition-colors" /> {t("view_all_student_fees")}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
