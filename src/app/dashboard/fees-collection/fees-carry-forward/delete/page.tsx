"use client";

import { Search, ChevronDown, Trash2, ArrowLeft, Loader2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useMemo, useCallback } from "react";
import api from "@/lib/api";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { useTranslation } from "@/hooks/use-translation";
import { translateClassName, translateSectionName, toLocaleNumber, formatDate } from "@/lib/utils";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
    roll_number: string;
    admission_date: string;
    balance: number;
    student_fee_master_id: number;
    selected?: boolean;
}

export default function DeleteCarryForwardPage() {
    const { formatCurrency, symbol } = useCurrencyFormatter();
    const [classes, setClasses] = useState<Class[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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
            const res = await api.get("/fee-collection/carry-forward/delete-search", {
                params: {
                    school_class_id: selectedClass,
                    section_id: selectedSection,
                }
            });
            const data = res.data.data || [];
            setStudents(data.map((s: Student) => ({ ...s, selected: false })));
            
            if (data.length === 0) {
                tt.info("no_carry_forward_records_found_for_class_section");
            }
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            tt.error(err.response?.data?.message || "failed_to_fetch_students");
        } finally {
            setLoading(false);
        }
    }, [selectedClass, selectedSection, tt]);

    const handleSelectAll = (checked: boolean) => {
        setStudents(prev => prev.map(s => ({ ...s, selected: checked })));
    };

    const handleSelectStudent = (id: number, checked: boolean) => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, selected: checked } : s));
    };

    const handleDelete = async () => {
        const selectedIds = students.filter(s => s.selected).map(s => s.student_fee_master_id);
        
        setDeleting(true);
        try {
            await api.delete("/fee-collection/carry-forward/delete", {
                data: { student_fee_master_ids: selectedIds }
            });
            tt.success("carry_forward_records_deleted_successfully");
            setIsDeleteDialogOpen(false);
            handleSearch(); // Refresh list
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            tt.error(err.response?.data?.message || "failed_to_delete_carry_forward_records");
            setIsDeleteDialogOpen(false);
        } finally {
            setDeleting(false);
        }
    };

    const filteredStudents = useMemo(() => {
        if (!searchTerm) return students;
        return students.filter(s => 
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.admission_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.father_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [students, searchTerm]);

    const selectedCount = students.filter(s => s.selected).length;

    return (
        <div className="p-3 sm:p-5 pt-1 sm:pt-2 space-y-4 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-20">
            {/* Top Page Header Card with Signature Gradient */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-3.5 sm:px-6 sm:py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-[0.5px] border-gray-300 rounded-xl shadow-[0_4px_24px_rgb(0,0,0,0.08)] overflow-hidden">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/fees-collection/fees-carry-forward">
                        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 bg-white/80 rounded-xl cursor-pointer">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <span className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-md">
                        <Trash2 className="h-5 w-5 sm:h-6 sm:w-6" />
                    </span>
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight leading-none">{t("delete_carry_forward")}</h1>
                        <p className="text-xs text-slate-600 mt-1 font-medium">{t("remove_fees_carried_from_previous_session")}</p>
                    </div>
                </div>
            </div>

            {/* Selection Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-3 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-200/70">
                    <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("select_criteria")}</CardTitle>
                </CardHeader>
                <CardContent className="p-5 sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                        {/* Class */}
                        <div className="space-y-1.5 group">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
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
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
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

                        <div className="md:col-span-2 flex justify-end mt-2">
                            <Button
                                onClick={handleSearch}
                                disabled={loading}
                                className="h-10 px-8 rounded-xl font-bold text-xs bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                <span>{loading ? t("searching") : t("search_students")}</span>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results Table */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card overflow-hidden pt-0 animate-in slide-in-from-bottom-4 duration-500">
                <CardHeader className="border-b border-gray-200/70 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] px-5 py-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("previous_session_balance_fees")}</CardTitle>
                    <div className="text-xs font-bold text-destructive">
                        {t("due_date")}: {toLocaleNumber(formatDate(new Date()), language?.short_code)}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-4 border-b border-border/70 flex items-center justify-between bg-background gap-4 flex-wrap">
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                                <Checkbox 
                                    checked={students.length > 0 && students.every(s => s.selected)}
                                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                    className="h-4 w-4 rounded-sm data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                                {t("select_all")}
                            </label>
                            <div className="relative max-w-sm w-full sm:w-[300px]">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={`${t("search")}...`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 h-9 rounded-xl text-xs"
                                />
                            </div>
                        </div>
                        <Button
                            onClick={() => setIsDeleteDialogOpen(true)}
                            disabled={selectedCount === 0}
                            className="h-9 px-4 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-700 text-white shadow-md active:scale-95 transition-all cursor-pointer border-none flex items-center gap-1.5"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>{t("delete")}</span>
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
                            <thead>
                                <tr className="bg-muted/40 border-b border-border/70">
                                    <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-foreground w-[50px]">#</th>
                                    <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-foreground">{t("student_name")}</th>
                                    <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-foreground">{t("admission_no")}</th>
                                    <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-foreground">{t("admission_date")}</th>
                                    <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-foreground">{t("roll_number")}</th>
                                    <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-foreground">{t("father_name")}</th>
                                    <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-foreground text-right">{t("balance")} ({symbol})</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map((student) => (
                                        <tr key={student.id} className="hover:bg-muted/10 transition-colors">
                                            <td className="px-6 py-3.5">
                                                <Checkbox 
                                                    checked={student.selected}
                                                    onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                                                    className="h-4 w-4 rounded-sm data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                />
                                            </td>
                                            <td className="px-6 py-3.5 font-bold text-foreground">{student.name}</td>
                                            <td className="px-6 py-3.5 font-mono text-muted-foreground">#{toLocaleNumber(student.admission_no, language?.short_code)}</td>
                                            <td className="px-6 py-3.5 text-muted-foreground">{student.admission_date ? toLocaleNumber(formatDate(student.admission_date), language?.short_code) : "-"}</td>
                                            <td className="px-6 py-3.5 text-muted-foreground">{toLocaleNumber(student.roll_number, language?.short_code)}</td>
                                            <td className="px-6 py-3.5 text-muted-foreground">{student.father_name || "-"}</td>
                                            <td className="px-6 py-3.5 text-right font-black text-primary">
                                                {toLocaleNumber(formatCurrency(student.balance), language?.short_code)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <Info className="h-10 w-10 text-muted-foreground/30" />
                                                <p className="text-muted-foreground font-semibold">{t("no_data_found")}</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("are_you_sure")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("delete_selected_carry_forward_confirm", { count: toLocaleNumber(selectedCount, language?.short_code) })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting} className="rounded-xl font-bold text-xs cursor-pointer">{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleDelete(); }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold text-xs cursor-pointer"
                            disabled={deleting}
                        >
                            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Trash2 className="h-3.5 w-3.5 mr-1.5" />}
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
