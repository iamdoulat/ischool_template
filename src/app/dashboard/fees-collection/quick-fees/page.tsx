"use client";

interface FeePayment { amount: number; [key: string]: unknown; }
interface DueFee { id: number; is_transport?: boolean; fee_master_id?: number; transport_fee_master_id?: number; fee_master: { amount: number; fee_group?: { name?: string }; fee_type?: { name?: string; code?: string }; due_date?: string; fine_amount?: number; [key: string]: unknown }; payments: FeePayment[]; due_date?: string; [key: string]: unknown; }
interface StudentData { id?: number; name?: string; last_name?: string; admission_no?: string; [key: string]: unknown; }
interface ClassItem { id: number; name: string; sections?: SectionItem[]; [key: string]: unknown; }
interface SectionItem { id: number; name: string; [key: string]: unknown; }
interface StudentItem { id: number; name: string; last_name?: string; admission_no?: string; [key: string]: unknown; }

import { Search, Zap, ChevronDown, UserCircle, CreditCard, Calendar, FileText, CheckCircle2, Loader2, Edit, Trash2, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
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
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";

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

export default function QuickFeesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const paramStudentId = searchParams.get("student_id") || "";

    const { symbol } = useCurrencyFormatter();
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [sections, setSections] = useState<SectionItem[]>([]);
    const [students, setStudents] = useState<StudentItem[]>([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [selectedStudentId, setSelectedStudentId] = useState(paramStudentId);

    const [loading, setLoading] = useState(false);
    const [fetchingStudents, setFetchingStudents] = useState(false);
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

    const { toast } = useToast();

    const fetchDropdowns = useCallback(async () => {
        try {
            const [classRes, sectionRes] = await Promise.all([
                api.get("/academics/classes?no_paginate=true"),
                api.get("/academics/sections?no_paginate=true")
            ]);
            setClasses(classRes.data.data?.data || classRes.data.data || []);
            setSections(sectionRes.data.data?.data || sectionRes.data.data || []);
        } catch (error) {
            console.error("Error fetching dropdowns:", error);
        }
    }, []);

    useEffect(() => {
        fetchDropdowns();
    }, [fetchDropdowns]);

    const fetchStudents = useCallback(async (classId: string, sectionId: string) => {
        if (!classId) {
            setStudents([]);
            return;
        }
        setFetchingStudents(true);
        try {
            const params: Record<string, unknown> = { school_class_id: classId, no_paginate: true };
            if (sectionId) {
                params.section_id = sectionId;
            }
            const res = await api.get("/fee-collection/search-students", { params });
            const list = res.data.data?.data || res.data.data || res.data || [];
            setStudents(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error("Failed to fetch students:", error);
            setStudents([]);
        } finally {
            setFetchingStudents(false);
        }
    }, []);

    const filteredSections = (() => {
        const classSpecific = selectedClass ? sections.filter(s => String((s as Record<string, unknown>).school_class_id || '') === String(selectedClass)) : [];
        const candidates = classSpecific.length > 0 ? classSpecific : sections.filter(s => !(s as Record<string, unknown>).school_class_id || String((s as Record<string, unknown>).school_class_id || '') === String(selectedClass));
        const seen = new Set<string>();
        return candidates.filter(s => {
            const key = s.name.trim().toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    })();

    useEffect(() => {
        if (students.length === 1 && !selectedStudentId) {
            setSelectedStudentId(students[0].id.toString());
        }
    }, [students, selectedStudentId]);

    useEffect(() => {
        fetchStudents(selectedClass, selectedSection);
    }, [selectedClass, selectedSection, fetchStudents]);

    const handleSearch = async () => {
        if (!selectedStudentId) {
            toast("error", "Please select a student first");
            return;
        }
        setLoading(true);
        try {
            const res = await api.get(`/fee-collection/student-fees/${selectedStudentId}`);
            setStudentData(res.data.data.student);
            setDueFees(res.data.data.fees);
        } catch {
            toast("error", "Failed to fetch student fees");
        } finally {
            setLoading(false);
        }
    };

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
        setLoading(true);
        try {
            const payload: Record<string, unknown> = { ...paymentData };
            if (selectedFee.is_transport) {
                payload.student_transport_fee_id = selectedFee.id;
            } else {
                payload.student_fee_master_id = selectedFee.id;
            }
            await api.post("/fee-collection/collect-fee", payload);
            toast("success", "Fee payment collected successfully");
            setIsPaymentDialogOpen(false);
            handleSearch(); // Refresh fees
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            toast("error", err.response?.data?.message || "Failed to collect payment");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteFee = async (fee: DueFee) => {
        if (!confirm("Are you sure you want to delete this invoice fee item?")) return;
        setLoading(true);
        try {
            await api.delete(`/fee-collection/student-fees/${fee.id}`, {
                params: { is_transport: fee.is_transport ? true : false }
            });
            toast("success", "Invoice fee item deleted successfully");
            handleSearch();
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            toast("error", err.response?.data?.message || "Failed to delete fee item");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (fee: DueFee, targetStatus: "paid" | "unpaid") => {
        setLoading(true);
        try {
            await api.put(`/fee-collection/student-fees/${fee.id}`, {
                is_transport: fee.is_transport ? true : false,
                status: targetStatus
            });
            toast("success", `Fee status changed to ${targetStatus.toUpperCase()}`);
            handleSearch();
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            toast("error", err.response?.data?.message || "Failed to change fee status");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Quick Fees Master Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Zap className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Quick Fees Master</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">Search and collect student fees</p>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        {/* Class */}
                        <div className="space-y-2.5 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 transition-colors group-focus-within:text-primary">
                                Class
                            </label>
                            <div className="relative">
                                <select
                                    className="flex h-11 w-full rounded-lg border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all font-medium"
                                    value={selectedClass}
                                    onChange={(e) => { setSelectedClass(e.target.value); setSelectedStudentId(""); }}
                                >
                                    <option value="">Select Class</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none transition-transform group-focus-within:rotate-180" />
                            </div>
                        </div>

                        {/* Section */}
                        <div className="space-y-2.5 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 transition-colors group-focus-within:text-primary">
                                Section
                            </label>
                            <div className="relative">
                                <select
                                    className="flex h-11 w-full rounded-lg border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all font-medium"
                                    value={selectedSection}
                                    onChange={(e) => { setSelectedSection(e.target.value); setSelectedStudentId(""); }}
                                >
                                    <option value="">Select Section</option>
                                    {filteredSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none transition-transform group-focus-within:rotate-180" />
                            </div>
                        </div>

                        {/* Student */}
                        <div className="space-y-2.5 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 transition-colors group-focus-within:text-primary">
                                Student
                            </label>
                            <div className="relative">
                                <select
                                    className="flex h-11 w-full rounded-lg border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all font-medium"
                                    value={selectedStudentId}
                                    onChange={(e) => setSelectedStudentId(e.target.value)}
                                    disabled={fetchingStudents || !selectedClass}
                                >
                                    <option value="">
                                        {!selectedClass ? "Select Class First" : (fetchingStudents ? "Loading..." : (students.length === 0 ? "No Students Found" : `Select Student (${students.length})`))}
                                    </option>
                                    {students.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} {s.last_name || ""} {s.admission_no ? `(${s.admission_no})` : ""}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none transition-transform group-focus-within:rotate-180" />
                            </div>
                        </div>

                        <div className="md:col-span-3 flex justify-end gap-3 flex-wrap">
                            <Button
                                variant="outline"
                                className="h-11 px-6 rounded-lg font-bold border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 flex items-center gap-2 transition-all"
                                onClick={() => router.push(selectedStudentId ? `/dashboard/fees-collection/generate-invoice?student_id=${selectedStudentId}` : '/dashboard/fees-collection/generate-invoice')}
                            >
                                <FileText className="h-4 w-4" />
                                Generate Invoice
                            </Button>
                            <Button
                                variant="gradient"
                                className="h-11 px-10 rounded-lg font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2"
                                onClick={handleSearch}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                Search Fees
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Fees Result Section */}
            {studentData && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    {/* Fees Table */}
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Zap className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Due Fees</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{dueFees.length} fee record{dueFees.length === 1 ? '' : 's'}</p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50 hover:bg-muted/50 border-none">
                                        <TableHead className="font-bold text-slate-800 py-5 pl-8">Student</TableHead>
                                        <TableHead className="font-bold text-slate-800 py-5">Fees Group</TableHead>
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
                                        <TableSkeleton rows={5} cols={8} />
                                    ) : (
                                        dueFees.map((fee) => {
                                            const total = fee.fee_master.amount;
                                            const paid = fee.payments.reduce((acc: number, p: FeePayment) => acc + p.amount, 0);
                                            const due = total - paid;
                                            const isPaid = due <= 0;

                                            return (
                                                <TableRow key={fee.is_transport ? `t_${fee.id}` : `r_${fee.id}`} className="group border-b border-muted/50 last:border-none hover:bg-muted/20 transition-colors">
                                                    <TableCell className="py-4 pl-8">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                                <UserCircle className="h-5 w-5 text-primary" />
                                                            </div>
                                                            <div className="space-y-0.5">
                                                                <p className="font-bold text-sm text-slate-800 truncate max-w-[150px]">{studentData.name} {studentData.last_name}</p>
                                                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{studentData.admission_no}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold px-2.5 py-0.5 rounded-lg">
                                                            {fee.fee_master.fee_group?.name}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <p className="text-sm font-semibold text-slate-600">{fee.fee_master.fee_type?.name}</p>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <code className="text-[11px] bg-slate-100 px-2 py-1 rounded font-mono text-slate-600">
                                                            {fee.fee_master.fee_type?.code || "N/A"}
                                                        </code>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                            {fee.fee_master.due_date ? new Date(fee.fee_master.due_date).toLocaleDateString() : "No Date"}
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
                                                        <div className="flex items-center justify-center gap-2">
                                                            {isPaid ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleToggleStatus(fee, "unpaid")}
                                                                    title="Click to mark as Unpaid"
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold text-[10px] uppercase tracking-wider cursor-pointer transition-colors"
                                                                >
                                                                    <CheckCircle2 className="h-3 w-3" /> Paid
                                                                </button>
                                                            ) : (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => openPaymentDialog(fee)}
                                                                    className="h-8 rounded-lg bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-200 flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 px-3"
                                                                >
                                                                    <span className="font-bold text-sm leading-none">{symbol}</span> Collect
                                                                </Button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    router.push(`/dashboard/fees-collection/generate-invoice?student_id=${selectedStudentId}&fee_id=${fee.id}&auto_pdf=true`);
                                                                }}
                                                                title="Download PDF Invoice"
                                                                className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 transition-colors border border-transparent hover:border-emerald-100"
                                                            >
                                                                <Download className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    router.push(`/dashboard/fees-collection/generate-invoice?edit_id=${fee.id}&student_id=${selectedStudentId}`);
                                                                }}
                                                                title="Edit Full Invoice"
                                                                className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-colors border border-transparent hover:border-indigo-100"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteFee(fee)}
                                                                title="Delete Fee Record"
                                                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors border border-transparent hover:border-red-100"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                            {!loading && dueFees.length === 0 && (
                                <div className="p-20 text-center space-y-3">
                                    <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center mx-auto">
                                        <CreditCard className="h-10 w-10 text-muted-foreground/30" />
                                    </div>
                                    <p className="text-muted-foreground font-medium">No fees records found for this student.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

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
                                <div className="relative">
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
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
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
                                className="flex-1 h-12 rounded-lg font-bold border-muted/50"
                                onClick={() => setIsPaymentDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="gradient"
                                className="flex-1 h-12 rounded-lg font-bold shadow-lg shadow-primary/20"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
                                Complete Payment
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
