"use client";

import { Search, ChevronDown, Check, Loader2, Info, ArrowRight, Trash2, ArrowRightLeft, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";
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

interface Class {
    id: number;
    name: string;
    sections?: Section[];
}

interface Section {
    id: number;
    name: string;
}

interface Student {
    id: number;
    admission_no: string;
    name: string;
    father_name: string;
    balance: number;
    is_carried_forward: boolean;
    selected?: boolean;
}

export default function FeesCarryForwardPage() {
    const { formatCurrency } = useCurrencyFormatter();
    const [classes, setClasses] = useState<Class[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const { t } = useTranslation();
    const tt = useTranslateToast();

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const res = await api.get("/academics/classes?no_paginate=true");
            setClasses(res.data.data.data || res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch classes", error);
        }
    };

    const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setSelectedClass(val);
        setSelectedSection("");
        setStudents([]);
        if (val) {
            const foundClass = classes.find(c => c.id === parseInt(val));
            setSections(foundClass?.sections || []);
        } else {
            setSections([]);
        }
    };

    const handleSearch = async () => {
        if (!selectedClass || !selectedSection) {
            tt.error("please_select_class_and_section");
            return;
        }

        setLoading(true);
        setStudents([]);
        try {
            const res = await api.get("/fee-collection/carry-forward/search", {
                params: {
                    school_class_id: selectedClass,
                    section_id: selectedSection,
                }
            });
            const data = res.data.data || [];
            setStudents(data.map((s: Student) => ({
                ...s,
                selected: s.balance > 0 && !s.is_carried_forward
            })));

            if (data.length === 0) {
                tt.info("no_students_found_with_pending_balances_in_previous_session");
            }
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            tt.error(err.response?.data?.message || "failed_to_fetch_students");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (checked: boolean) => {
        setStudents(prev => prev.map(s => ({
            ...s,
            selected: s.balance > 0 && !s.is_carried_forward ? checked : s.selected
        })));
    };

    const handleSelectStudent = (id: number, checked: boolean) => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, selected: checked } : s));
    };

    const handleSave = async () => {
        const selectedStudents = students.filter(s => s.selected);
        if (selectedStudents.length === 0) {
            tt.error("please_select_at_least_one_student");
            return;
        }

        setSaving(true);
        try {
            await api.post("/fee-collection/carry-forward/save", {
                students: selectedStudents.map(s => ({
                    student_id: s.id,
                    amount: s.balance,
                }))
            });
            tt.success("fees_carried_forward_successfully");
            handleSearch(); // Refresh list
        } catch (error) {
            tt.error("failed_to_save_carry_forward");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">{t("fees_carry_forward")}</h1>
                    <p className="text-muted-foreground">{t("transfer_student_fee_balances_from_previous_session_to_current")}</p>
                </div>
                <Link href="/dashboard/fees-collection/fees-carry-forward/delete">
                    <Button variant="gradient" className="shrink-0 h-11 px-6 flex items-center gap-2">
                        <Trash2 className="h-4 w-4" /> {t("delete_carry_forward")}
                    </Button>
                </Link>
            </div>

            {/* Selection Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("select_criteria")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("filter_students_by_class_and_section")}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                        {/* Class */}
                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 ml-1 transition-colors group-focus-within:text-primary">
                                {t("class")} <span className="text-destructive font-black">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedClass}
                                    onChange={handleClassChange}
                                    className="flex h-10 w-full rounded-lg border border-muted/50 bg-muted/30 px-3 py-2 text-sm appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all font-medium text-muted-foreground"
                                >
                                    <option value="">{t("select_class")}</option>
                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none transition-transform group-focus-within:rotate-180" />
                            </div>
                        </div>

                        {/* Section */}
                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 ml-1 transition-colors group-focus-within:text-primary">
                                {t("section")} <span className="text-destructive font-black">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                    className="flex h-10 w-full rounded-lg border border-muted/50 bg-muted/30 px-3 py-2 text-sm appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all font-medium text-muted-foreground"
                                >
                                    <option value="">{t("select_section")}</option>
                                    {sections.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none transition-transform group-focus-within:rotate-180" />
                            </div>
                        </div>

                        <div className="md:col-span-2 flex justify-end">
                            <Button
                                variant="gradient"
                                onClick={handleSearch}
                                disabled={loading}
                                className="h-10 px-8 flex items-center gap-2 font-bold text-xs"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />}
                                {loading ? t("searching") : t("search_students")}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results Table */}
            {(loading || students.length > 0) ? (
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 animate-in slide-in-from-bottom-4 duration-500">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <ArrowRightLeft className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("students_with_pending_balances")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("x_students_with_pending_balances", { count: students.length })}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-muted/20 bg-muted/10">
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground w-[80px]">
                                            <Checkbox
                                                checked={students.length > 0 && students.every(s => s.is_carried_forward || s.balance === 0 || s.selected)}
                                                onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                                className="h-4 w-4 rounded border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                            />
                                        </th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("admission_no")}</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("student_name")}</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">{t("pending_balance")}</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">{t("status")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-muted/10">
                                    {loading ? (
                                        <TableSkeleton rows={5} cols={5} />
                                    ) : students.length === 0 ? (
                                        <tr><td colSpan={5} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_data_found")}</td></tr>
                                    ) : (
                                        students.map((student) => (
                                            <tr key={student.id} className={cn(
                                                "hover:bg-muted/5 transition-colors group border-b border-muted/10",
                                                student.is_carried_forward && "bg-muted/20 opacity-60"
                                            )}>
                                                <td className="px-6 py-4">
                                                    <Checkbox
                                                        checked={student.selected}
                                                        disabled={student.is_carried_forward || student.balance === 0}
                                                        onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                                                        className="h-4 w-4 rounded border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-xs font-bold text-muted-foreground">{student.admission_no}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-foreground">{student.name}</span>
                                                        <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">{student.father_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-bold text-right text-primary">
                                                    {formatCurrency(student.balance)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {student.is_carried_forward ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[9px] font-black uppercase tracking-wider">
                                                            <Check className="h-3 w-3" /> {t("done")}
                                                        </span>
                                                    ) : student.balance === 0 ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-[9px] font-black uppercase tracking-wider">
                                                            {t("no_due")}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-[9px] font-black uppercase tracking-wider">
                                                            {t("pending")}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-6 border-t border-muted/20 bg-muted/5 flex justify-end">
                            <Button
                                variant="gradient"
                                onClick={handleSave}
                                disabled={saving || students.filter(s => s.selected).length === 0}
                                className="h-10 px-8 flex items-center gap-2 font-bold text-xs"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                                {saving ? t("processing") : t("carry_forward_selected")}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                !loading && selectedClass && selectedSection && (
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden">
                        <CardContent className="p-20 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <Info className="h-12 w-12 text-muted-foreground/30" />
                                <div className="space-y-1">
                                    <h3 className="font-bold text-xl text-muted-foreground">{t("no_students_found")}</h3>
                                    <p className="text-muted-foreground/70">{t("either_no_students_exist_in_this_class_section_or_everyone_is_clear")}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            )}
        </div>
    );
}
