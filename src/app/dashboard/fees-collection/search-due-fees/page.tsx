"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, ChevronDown, UserCircle, Calendar, Wallet, CheckCircle2, AlertCircle, FileText, Download, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import api from "@/lib/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface DropdownItem {
    id: number | string;
    name: string;
}

interface FeeRecord {
    group: string;
    code: string;
    dueDate: string;
    status: string;
    amount: string;
    discount: string;
    fine: string;
    paid: string;
    balance: string;
}

interface StudentDueFee {
    admissionNo: string;
    name: string;
    fatherName: string;
    classSection: string;
    fees: FeeRecord[];
    totalAmount: string;
    totalDiscount: string;
    totalFine: string;
    totalPaid: string;
    totalBalance: string;
}

export default function SearchDueFeesPage() {
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const { symbol } = useCurrencyFormatter();

    const [classes, setClasses] = useState<DropdownItem[]>([]);
    const [sections, setSections] = useState<DropdownItem[]>([]);
    const [feesGroups, setFeesGroups] = useState<DropdownItem[]>([]);

    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [selectedFeesGroup, setSelectedFeesGroup] = useState("");

    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<StudentDueFee[]>([]);
    const [searched, setSearched] = useState(false);

    const fetchDropdowns = useCallback(async () => {
        try {
            const [classRes, sectionRes, feesGroupRes] = await Promise.all([
                api.get("/academics/classes?no_paginate=true"),
                api.get("/academics/sections?no_paginate=true"),
                api.get("/fees-groups?no_paginate=true")
            ]);
            setClasses(classRes.data?.data?.data || classRes.data?.data || []);
            setSections(sectionRes.data?.data?.data || sectionRes.data?.data || []);
            setFeesGroups(feesGroupRes.data?.data?.data || feesGroupRes.data?.data || []);
        } catch (error) {
            tt.error("failed_to_load_dropdowns");
        }
    }, [tt]);

    useEffect(() => {
        fetchDropdowns();
    }, [fetchDropdowns]);

    const handleSearch = async () => {
        if (!selectedFeesGroup) {
            tt.error("please_select_fees_group");
            return;
        }

        setLoading(true);
        try {
            const res = await api.get("/finance-reports/balance-fees-statement", {
                params: {
                    fee_group_id: selectedFeesGroup,
                    school_class_id: selectedClass || "all",
                    section_id: selectedSection || "all"
                }
            });
            const data = res.data?.data || res.data || [];
            // Filter to only include students that actually have due fees (balance > 0)
            const filteredData = data.filter((student: StudentDueFee) => parseFloat(student.totalBalance) > 0);
            setResults(filteredData);
            setSearched(true);
        } catch (error) {
            tt.error("search_failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Select Criteria Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("select_criteria")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("search_due_fees_records")}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        <div className="space-y-2.5 group">
                            <label className="text-sm font-bold text-muted-foreground flex items-center gap-1.5 ml-1 transition-colors group-focus-within:text-primary">
                                {t("fees_group")} <span className="text-destructive font-black">*</span>
                            </label>
                            <div className="relative">
                                <select 
                                    className="flex h-11 w-full rounded-lg border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all font-medium"
                                    value={selectedFeesGroup}
                                    onChange={(e) => setSelectedFeesGroup(e.target.value)}
                                >
                                    <option value="">{t("select")}</option>
                                    <option value="all">All Fees Groups</option>
                                    {feesGroups.map(fg => (
                                        <option key={fg.id} value={fg.id}>{fg.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none transition-transform group-focus-within:rotate-180" />
                            </div>
                        </div>

                        <div className="space-y-2.5 group">
                            <label className="text-sm font-bold text-muted-foreground flex items-center gap-1.5 ml-1 transition-colors group-focus-within:text-primary">
                                {t("class")}
                            </label>
                            <div className="relative">
                                <select 
                                    className="flex h-11 w-full rounded-lg border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all font-medium"
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                >
                                    <option value="">{t("select")}</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none transition-transform group-focus-within:rotate-180" />
                            </div>
                        </div>

                        <div className="space-y-2.5 group">
                            <label className="text-sm font-bold text-muted-foreground flex items-center gap-1.5 ml-1 transition-colors group-focus-within:text-primary">
                                {t("section")}
                            </label>
                            <div className="relative">
                                <select 
                                    className="flex h-11 w-full rounded-lg border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all font-medium"
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                >
                                    <option value="">{t("select")}</option>
                                    {sections.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none transition-transform group-focus-within:rotate-180" />
                            </div>
                        </div>

                        <div className="md:col-span-3 flex justify-end">
                            <Button
                                className="h-11 px-10 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#F57C00] hover:to-[#3F2BDB] text-white font-bold shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.05] active:scale-95 flex items-center gap-2 border-none"
                                onClick={handleSearch}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                {t("search")}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {searched && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Wallet className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Due Fees List</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{results.length} student{results.length === 1 ? '' : 's'} with dues</p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            {results.length === 0 ? (
                                <div className="p-20 text-center space-y-3">
                                    <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center mx-auto">
                                        <CheckCircle2 className="h-10 w-10 text-emerald-500/50" />
                                    </div>
                                    <p className="text-muted-foreground font-medium">No pending fees found for the selected criteria.</p>
                                </div>
                            ) : (
                                <Table className="w-full">
                                    <TableHeader>
                                        <TableRow className="bg-muted/30 border-b border-muted/50 hover:bg-muted/30">
                                            <TableHead className="font-bold text-slate-800 py-5 pl-8">Student</TableHead>
                                            <TableHead className="font-bold text-slate-800 py-5">Due Details</TableHead>
                                            <TableHead className="font-bold text-slate-800 py-5 text-right">Amount ({symbol})</TableHead>
                                            <TableHead className="font-bold text-slate-800 py-5 text-right">Discount ({symbol})</TableHead>
                                            <TableHead className="font-bold text-slate-800 py-5 text-right">Fine ({symbol})</TableHead>
                                            <TableHead className="font-bold text-slate-800 py-5 text-right pr-8">Balance ({symbol})</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {results.map((student, i) => (
                                            <TableRow key={i} className="group border-b border-muted/50 last:border-none hover:bg-muted/10 transition-colors">
                                                <TableCell className="py-4 pl-8 align-top">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#FF9800] to-[#6366F1] flex items-center justify-center shrink-0">
                                                            <span className="text-white font-black text-sm">{student.name.charAt(0)}</span>
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <p className="font-bold text-sm text-slate-800 truncate">{student.name}</p>
                                                            <p className="text-[11px] text-slate-500 font-medium">Class: <span className="font-bold text-slate-700">{student.classSection}</span></p>
                                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{student.admissionNo}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 align-top">
                                                    <div className="space-y-3">
                                                        {student.fees.filter(f => parseFloat(f.balance) > 0).map((fee, idx) => (
                                                            <div key={idx} className="bg-white/60 p-2.5 rounded-lg border border-muted/50 shadow-sm space-y-2">
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold px-2 py-0.5 rounded text-[10px]">
                                                                        {fee.group}
                                                                    </Badge>
                                                                    <span className="text-xs font-black text-destructive">{symbol}{fee.balance} Due</span>
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                    <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">
                                                                        {fee.code}
                                                                    </code>
                                                                    <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                                                                        <Calendar className="h-3 w-3" /> Due: {fee.dueDate}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 text-right align-top">
                                                    <p className="text-sm font-semibold text-slate-600">
                                                        {student.totalAmount}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="py-4 text-right align-top">
                                                    <p className="text-sm font-semibold text-slate-600">
                                                        {student.totalDiscount}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="py-4 text-right align-top">
                                                    <p className="text-sm font-bold text-destructive">
                                                        {student.totalFine}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="py-4 text-right pr-8 align-top">
                                                    <p className="text-base font-black text-slate-800">
                                                        {symbol}{student.totalBalance}
                                                    </p>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
