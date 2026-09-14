"use client";

import { Search, ChevronDown, Check, Loader2, Info, ArrowRight, Trash2, ArrowRightLeft, Filter, Building, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { useTranslation } from "@/hooks/use-translation";
import { cn, translateClassName, translateSectionName, toLocaleNumber } from "@/lib/utils";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3.5">
                            <div
                                className="h-4 rounded-md bg-muted/60 animate-pulse"
                                style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }}
                            />
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
    const { t, language } = useTranslation();
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
            const foundClass = classes.find(c => c.id === parseInt(val, 10));
            setSections(foundClass?.sections || []);
        } else {
            setSections([]);
        }
    };

    const handleSearch = useCallback(async () => {
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
    }, [selectedClass, selectedSection, tt]);

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
            handleSearch();
        } catch (error) {
            console.error("Error saving carry forward:", error);
            tt.error("failed_to_save_carry_forward");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-3 sm:p-5 pt-1 sm:pt-2 space-y-4 max-w-[1600px] mx-auto animate-in fade-in duration-300 pb-20">
            {/* Top Page Header Card with Signature Gradient */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] overflow-hidden p-0">
                <div className="flex flex-row items-center justify-between gap-3 px-5 py-3.5 sm:px-6 sm:py-4">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-md">
                            <ArrowRightLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                        </span>
                        <div>
                            <CardTitle className="text-lg sm:text-xl font-bold tracking-tight text-slate-800 leading-none">
                                {t("fees_carry_forward")}
                            </CardTitle>
                            <p className="text-xs text-slate-600 mt-1 font-medium">
                                {t("transfer_student_fee_balances_from_previous_session_to_current")}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard/fees-collection/fees-carry-forward/delete">
                            <Button
                                className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white shadow-md shadow-indigo-500/20 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer border-none"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>{t("delete_carry_forward")}</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </Card>

            {/* Selection Criteria Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-3 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-200/70">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-4 w-4" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                            {t("select_criteria")}
                        </CardTitle>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                            {t("filter_students_by_class_and_section")}
                        </p>
                    </div>
                </CardHeader>

                <CardContent className="p-5 sm:p-6">
                    {/* Class, Section, and Search Students in ONE Horizontal Line */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-end">
                        {/* Class */}
                        <div className="space-y-1.5 group">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                <Building className="h-3.5 w-3.5 text-indigo-600" />
                                {t("class")} <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedClass}
                                    onChange={handleClassChange}
                                    className="flex h-10 w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs sm:text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                                >
                                    <option value="">{t("select_class")}</option>
                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id}>{translateClassName(c.name, language?.short_code)}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        {/* Section */}
                        <div className="space-y-1.5 group">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                <Layers className="h-3.5 w-3.5 text-indigo-600" />
                                {t("section")} <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                    className="flex h-10 w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs sm:text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                                >
                                    <option value="">{t("select_section")}</option>
                                    {sections.map((s) => (
                                        <option key={s.id} value={s.id}>{translateSectionName(s.name, language?.short_code)}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        {/* Search Students Button in the Same Line */}
                        <div>
                            <Button
                                onClick={handleSearch}
                                disabled={loading || !selectedClass || !selectedSection}
                                className="h-10 w-full rounded-xl font-bold text-xs bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                <span>{loading ? t("searching") : t("search_students")}</span>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results Table */}
            {(loading || students.length > 0) ? (
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card overflow-hidden pt-0 animate-in slide-in-from-bottom-3 duration-300">
                    <CardHeader className="flex flex-row items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-200/70">
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <ArrowRightLeft className="h-4 w-4" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                    {t("students_with_pending_balances")}
                                </CardTitle>
                                <p className="text-xs text-slate-500 font-medium mt-1">
                                    {t("x_students_with_pending_balances", { count: toLocaleNumber(students.length, language?.short_code) })}
                                </p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-muted/40 border-b border-border/70">
                                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-foreground w-16">
                                            <Checkbox
                                                checked={students.length > 0 && students.every(s => s.is_carried_forward || s.balance === 0 || s.selected)}
                                                onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                                className="h-4 w-4 rounded-sm data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                            />
                                        </th>
                                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-foreground">{t("admission_no")}</th>
                                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-foreground">{t("student_name")}</th>
                                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-foreground text-right">{t("pending_balance")}</th>
                                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-foreground text-center">{t("status")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50 text-xs">
                                    {loading ? (
                                        <TableSkeleton rows={5} cols={5} />
                                    ) : students.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground font-semibold">
                                                {t("no_data_found")}
                                            </td>
                                        </tr>
                                    ) : (
                                        students.map((student) => (
                                            <tr 
                                                key={student.id} 
                                                className={cn(
                                                    "hover:bg-muted/20 transition-colors",
                                                    student.is_carried_forward && "bg-muted/20 opacity-60"
                                                )}
                                            >
                                                <td className="px-6 py-3.5">
                                                    <Checkbox
                                                        checked={student.selected}
                                                        disabled={student.is_carried_forward || student.balance === 0}
                                                        onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                                                        className="h-4 w-4 rounded-sm data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                    />
                                                </td>
                                                <td className="px-6 py-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                    #{toLocaleNumber(student.admission_no, language?.short_code)}
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-foreground text-sm">{student.name}</span>
                                                        {student.father_name && (
                                                            <span className="text-[11px] text-muted-foreground font-medium">{student.father_name}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3.5 font-black text-right text-sm text-foreground">
                                                    {toLocaleNumber(formatCurrency(student.balance), language?.short_code)}
                                                </td>
                                                <td className="px-6 py-3.5 text-center">
                                                    {student.is_carried_forward ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold text-[10px] uppercase">
                                                            <Check className="h-3 w-3" /> {t("done")}
                                                        </span>
                                                    ) : student.balance === 0 ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-bold text-[10px] uppercase">
                                                            {t("no_due")}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-bold text-[10px] uppercase">
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

                        {/* Bottom Actions Bar */}
                        <div className="p-4 sm:p-5 border-t border-border/70 bg-muted/10 flex items-center justify-between">
                            <p className="text-xs text-muted-foreground font-medium">
                                {t("showing_x_to_y_of_z", {
                                    from: toLocaleNumber(students.length > 0 ? 1 : 0, language?.short_code),
                                    to: toLocaleNumber(students.length, language?.short_code),
                                    total: toLocaleNumber(students.length, language?.short_code)
                                })}
                            </p>
                            <Button
                                onClick={handleSave}
                                disabled={saving || students.filter(s => s.selected).length === 0}
                                className="h-10 px-6 rounded-xl font-bold text-xs bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white shadow-md shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer border-none"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <ArrowRight className="h-4 w-4 mr-1.5" />}
                                <span>{saving ? t("processing") : t("carry_forward_selected")}</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                !loading && selectedClass && selectedSection && (
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card overflow-hidden">
                        <CardContent className="p-16 text-center">
                            <div className="flex flex-col items-center gap-3">
                                <div className="h-14 w-14 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground">
                                    <Info className="h-7 w-7" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-base text-foreground">{t("no_students_found")}</h3>
                                    <p className="text-xs text-muted-foreground">{t("either_no_students_exist_in_this_class_section_or_everyone_is_clear")}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            )}
        </div>
    );
}
