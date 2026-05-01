"use client";

import { Search, Zap, ChevronDown, UserCircle, CreditCard, Calendar, FileText, CheckCircle2, Loader2, AlertCircle, History, ArrowRight, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
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

export default function QuickFeesPage() {
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [selectedStudentId, setSelectedStudentId] = useState("");
    
    const [loading, setLoading] = useState(false);
    const [fetchingStudents, setFetchingStudents] = useState(false);
    const [studentData, setStudentData] = useState<any>(null);
    const [dueFees, setDueFees] = useState<any[]>([]);
    
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [selectedFee, setSelectedFee] = useState<any>(null);
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
        if (!classId || !sectionId) return;
        setFetchingStudents(true);
        try {
            const res = await api.get("/fee-collection/search-students", {
                params: { school_class_id: classId, section_id: sectionId, no_paginate: true }
            });
            setStudents(res.data.data?.data || res.data.data || []);
        } catch (error) {
            toast("error", "Failed to fetch students");
        } finally {
            setFetchingStudents(false);
        }
    }, [toast]);

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
        } catch (error) {
            toast("error", "Failed to fetch student fees");
        } finally {
            setLoading(false);
        }
    };

    const openPaymentDialog = (fee: any) => {
        const total = fee.fee_master.amount;
        const paid = fee.payments.reduce((acc: number, p: any) => acc + p.amount, 0);
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
        setLoading(true);
        try {
            await api.post("/fee-collection/collect-fee", {
                student_fee_master_id: selectedFee.id,
                ...paymentData
            });
            toast("success", "Fee payment collected successfully");
            setIsPaymentDialogOpen(false);
            handleSearch(); // Refresh fees
        } catch (error: any) {
            toast("error", error.response?.data?.message || "Failed to collect payment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Quick Fees Master Card */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-muted/50 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Zap className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-xl font-bold tracking-tight text-slate-800">Quick Fees Master</CardTitle>
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
                                    className="flex h-11 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all font-medium"
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
                                    className="flex h-11 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all font-medium"
                                    value={selectedSection}
                                    onChange={(e) => { setSelectedSection(e.target.value); setSelectedStudentId(""); }}
                                >
                                    <option value="">Select Section</option>
                                    {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
                                    className="flex h-11 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all font-medium"
                                    value={selectedStudentId}
                                    onChange={(e) => setSelectedStudentId(e.target.value)}
                                    disabled={fetchingStudents}
                                >
                                    <option value="">{fetchingStudents ? "Loading..." : "Select Student"}</option>
                                    {students.map(s => <option key={s.id} value={s.id}>{s.name} {s.last_name} ({s.admission_no})</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none transition-transform group-focus-within:rotate-180" />
                            </div>
                        </div>

                        <div className="md:col-span-3 flex justify-end">
                            <Button
                                variant="gradient"
                                className="h-11 px-10 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2"
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
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card overflow-hidden">
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50 hover:bg-muted/50 border-none">
                                        <TableHead className="font-bold text-slate-800 py-5 pl-8">Student</TableHead>
                                        <TableHead className="font-bold text-slate-800 py-5">Fees Group</TableHead>
                                        <TableHead className="font-bold text-slate-800 py-5">Fees Type</TableHead>
                                        <TableHead className="font-bold text-slate-800 py-5">Fees Code</TableHead>
                                        <TableHead className="font-bold text-slate-800 py-5">Due Date</TableHead>
                                        <TableHead className="font-bold text-slate-800 py-5 text-right">Fine ($)</TableHead>
                                        <TableHead className="font-bold text-slate-800 py-5 text-right">Amount ($)</TableHead>
                                        <TableHead className="font-bold text-slate-800 py-5 text-center pr-8">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dueFees.map((fee) => {
                                        const total = fee.fee_master.amount;
                                        const paid = fee.payments.reduce((acc: number, p: any) => acc + p.amount, 0);
                                        const due = total - paid;
                                        const isPaid = due <= 0;

                                        return (
                                            <TableRow key={fee.id} className="group border-b border-muted/50 last:border-none hover:bg-muted/20 transition-colors">
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
                                                        ${(fee.fee_master.fine_amount || 0).toLocaleString()}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="py-4 text-right">
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-black text-slate-800">${total.toLocaleString()}</p>
                                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">Paid: ${paid.toLocaleString()}</p>
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
                                                            className="h-8 rounded-lg bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-200 flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 px-3"
                                                        >
                                                            <DollarSign className="h-3 w-3" /> Collect
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                            {dueFees.length === 0 && (
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
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                    <DialogHeader className="p-8 bg-slate-900 text-white relative">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/30">
                                <CreditCard className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-bold tracking-tight">Collect Fee</DialogTitle>
                                <DialogDescription className="text-slate-300 font-medium">
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
                                            className="pl-11 h-12 rounded-xl bg-muted/30 border-muted/50 focus:bg-white font-bold"
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
                                            className="pl-11 h-12 rounded-xl bg-muted/30 border-muted/50 focus:bg-white font-medium"
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
                                        className="h-12 rounded-xl bg-muted/30 border-muted/50 focus:bg-white"
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
                                        className="h-12 rounded-xl bg-muted/30 border-muted/50 focus:bg-white"
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
                                        className="flex h-12 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-white focus-visible:border-primary transition-all font-medium"
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
                                        className="flex min-h-[100px] w-full rounded-xl border border-muted/50 bg-muted/30 px-11 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-white transition-all resize-none"
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
                                className="flex-1 h-12 rounded-2xl font-bold border-muted/50" 
                                onClick={() => setIsPaymentDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                variant="gradient" 
                                className="flex-1 h-12 rounded-2xl font-bold shadow-lg shadow-primary/20"
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
