"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Printer, Loader2, FileText, Award, Percent, Trophy, Layers, Sigma } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useSettings } from "@/components/providers/settings-provider";
import { cn } from "@/lib/utils";

type Subject = {
    id: number;
    name: string;
    max: string;
    min: string;
    obtained: string;
    result: "Pass" | "Fail";
    grade: string;
    note: string;
};

type ExamResult = {
    exam_id: number;
    exam_name: string;
    exam_type: string;
    is_grading: boolean;
    subjects: Subject[];
    summary: {
        percentage: string;
        result: "Pass" | "Fail";
        division: string;
        grade: string;
        grand_total: string;
        total_obtained: string;
    };
};

export default function UserExaminationsResultPage() {
    const [results, setResults] = useState<ExamResult[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { settings } = useSettings();

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const res = await api.get("/user/exam-results");
                if (res.data.success) {
                    setResults(res.data.data ?? []);
                } else {
                    toast({ variant: "destructive", title: "Error", description: res.data.message || "Failed to load results." });
                }
            } catch {
                toast({ variant: "destructive", title: "Error", description: "Failed to load exam results." });
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [toast]);

    const ResultPill = ({ result }: { result: "Pass" | "Fail" }) => (
        <span className={cn(
            "inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-bold text-white",
            result === "Pass" ? "bg-[#5cb85c]" : "bg-[#d9534f]"
        )}>
            {result}
        </span>
    );

    return (
        <div className="p-4 lg:p-6 animate-in fade-in duration-500">
            {/* Print-only header with logo on right */}
            <div className="hidden print:flex items-start justify-between mb-4 pb-4 border-b border-gray-300">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">{settings.school_name}</h2>
                    {settings.address && <p className="text-xs text-gray-600 mt-0.5">{settings.address}</p>}
                    {settings.phone && <p className="text-xs text-gray-600">{settings.phone}</p>}
                    {settings.email && <p className="text-xs text-gray-600">{settings.email}</p>}
                </div>
                {settings.print_logo && (
                    <img src={settings.print_logo} alt="School Logo" className="h-16 w-auto object-contain ml-4" />
                )}
            </div>

            <Card className="shadow-sm print:shadow-none border border-gray-200 rounded-xl overflow-hidden p-0 gap-0">
                {/* ── Header ── */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Award className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-[16px] font-bold text-gray-800 tracking-tight leading-none">Exam Result</h1>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {loading ? "Loading results…" : `${results.length} published result${results.length === 1 ? "" : "s"}`}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => window.print()}
                        title="Print"
                        className="h-9 shrink-0 ml-auto px-3.5 gap-1.5 rounded-[10px] text-white text-[12px] font-semibold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity active:scale-95 print:hidden"
                    >
                        <Printer className="h-4 w-4" />
                        <span className="hidden sm:inline">Print</span>
                    </Button>
                </div>

                <CardContent className="p-4 lg:p-5 space-y-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span>Loading results...</span>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <FileText className="h-12 w-12 opacity-30 mb-3" />
                            <p className="text-base font-semibold text-gray-500">No published exam results yet.</p>
                            <p className="text-sm mt-1 text-gray-400">Results appear here once the school publishes them.</p>
                        </div>
                    ) : (
                        results.map((exam) => {
                            const valueCol = exam.is_grading ? "Grade" : "Result";
                            const summaryTiles = [
                                { icon: Percent, label: "Percentage", value: `${exam.summary.percentage}%`, color: "text-emerald-600" },
                                { icon: Layers, label: "Division", value: exam.summary.division || "—", color: "text-sky-600" },
                                ...(exam.summary.grade ? [{ icon: Award, label: "Grade", value: exam.summary.grade, color: "text-orange-600" }] : []),
                                { icon: Sigma, label: "Grand Total", value: exam.summary.grand_total, color: "text-indigo-600" },
                                { icon: Trophy, label: "Obtained", value: exam.summary.total_obtained, color: "text-violet-600" },
                            ];
                            return (
                                <div key={exam.exam_id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm break-inside-avoid">
                                    {/* Exam Title Bar */}
                                    <div className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] px-4 py-3 text-[14px] text-white font-bold flex items-center gap-2">
                                        <Award className="h-4 w-4" /> {exam.exam_name}
                                    </div>

                                    {/* Desktop table (lg+) */}
                                    <div className="hidden lg:block overflow-x-auto">
                                        <Table className="min-w-[760px]">
                                            <TableHeader>
                                                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 border-b border-gray-200">
                                                    <TableHead className="w-[220px] text-[10px] uppercase font-bold text-gray-600 py-3">Subject</TableHead>
                                                    <TableHead className="text-center text-[10px] uppercase font-bold text-gray-600 py-3">Max Marks</TableHead>
                                                    <TableHead className="text-center text-[10px] uppercase font-bold text-gray-600 py-3">Min Marks</TableHead>
                                                    <TableHead className="text-center text-[10px] uppercase font-bold text-gray-600 py-3">Marks Obtained</TableHead>
                                                    <TableHead className="text-center text-[10px] uppercase font-bold text-gray-600 py-3">{valueCol}</TableHead>
                                                    <TableHead className="text-right text-[10px] uppercase font-bold text-gray-600 py-3 pr-6">Note</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {exam.subjects.map((s) => (
                                                    <TableRow key={s.id} className="hover:bg-indigo-50/30 transition-colors border-b border-gray-100">
                                                        <TableCell className="text-[13px] text-gray-800 py-3 font-semibold">{s.name}</TableCell>
                                                        <TableCell className="text-center text-[13px] text-gray-600 py-3">{s.max}</TableCell>
                                                        <TableCell className="text-center text-[13px] text-gray-600 py-3">{s.min}</TableCell>
                                                        <TableCell className={cn(
                                                            "text-center text-[13px] py-3 font-bold",
                                                            s.obtained === "Absent" ? "text-red-500 italic font-medium" : "text-gray-900"
                                                        )}>
                                                            {s.obtained}
                                                        </TableCell>
                                                        <TableCell className="text-center text-[13px] py-3">
                                                            {exam.is_grading ? (
                                                                <span className="font-semibold text-gray-700">{s.grade || "—"}</span>
                                                            ) : (
                                                                <ResultPill result={s.result} />
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right text-[13px] text-gray-500 py-3 pr-6">{s.note || "—"}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Mobile cards (<lg) */}
                                    <div className="lg:hidden divide-y divide-gray-100">
                                        {exam.subjects.map((s) => (
                                            <div key={s.id} className="p-3.5">
                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                    <span className="text-[13px] font-bold text-gray-800">{s.name}</span>
                                                    {exam.is_grading
                                                        ? <span className="text-[12px] font-bold text-gray-700 bg-gray-100 rounded-full px-2.5 py-0.5">{s.grade || "—"}</span>
                                                        : <ResultPill result={s.result} />}
                                                </div>
                                                <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-1.5">
                                                    <div className="flex items-center justify-between py-1 text-[12px]">
                                                        <span className="text-gray-500">Max</span><span className="font-semibold text-gray-700">{s.max}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between py-1 text-[12px]">
                                                        <span className="text-gray-500">Min</span><span className="font-semibold text-gray-700">{s.min}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between py-1 text-[12px]">
                                                        <span className="text-gray-500">Obtained</span>
                                                        <span className={cn("font-bold", s.obtained === "Absent" ? "text-red-500 italic" : "text-gray-900")}>{s.obtained}</span>
                                                    </div>
                                                </div>
                                                {s.note && <p className="text-[11px] text-gray-500 mt-1.5">Note: {s.note}</p>}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Summary tiles */}
                                    <div className="border-t border-gray-200 bg-gray-50/50 p-3">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                                            {summaryTiles.map((t, i) => (
                                                <div key={i} className="flex items-center gap-2.5 rounded-lg border border-gray-100 bg-white px-3 py-2 shadow-sm">
                                                    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800]/10 to-[#6366F1]/10", t.color)}>
                                                        <t.icon className="h-4 w-4" />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 leading-none">{t.label}</p>
                                                        <p className={cn("text-[14px] font-bold mt-0.5", t.color)}>{t.value}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="flex items-center gap-2.5 rounded-lg border border-gray-100 bg-white px-3 py-2 shadow-sm">
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 leading-none mb-1">Result</p>
                                                    <ResultPill result={exam.summary.result} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
