"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
    Search, Printer, ChevronLeft, ChevronRight, Copy, FileSpreadsheet,
    FileBox, Columns, Loader2, Award, Percent, Trophy, BadgeCheck, Sigma,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { toast } from "sonner";

interface ColumnDef {
    name: string;
    max: number;
}

interface SubjectResult {
    name: string;
    scores: string[];
    total: string;
    note: string;
}

interface ExamSummary {
    totalMarks: string;
    percentage: string;
    grade: string;
    rank: string;
}

interface ExamResult {
    examName: string;
    columns: ColumnDef[];
    subjects: SubjectResult[];
    summary: ExamSummary;
}

export default function UserCBSEExamResultPage() {
    const [examData, setExamData] = useState<ExamResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState("50");
    const [currentPage, setCurrentPage] = useState(1);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get("/user/cbse-exam-result");
            setExamData(response.data?.data || []);
        } catch (error) {
            console.error("Error fetching CBSE exam results:", error);
            toast.error("Failed to load exam results");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredData = examData.filter(g =>
        g.examName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.subjects.some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const sizeNum = parseInt(itemsPerPage, 10) || 50;
    const totalEntries = filteredData.length;
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * sizeNum;

    const paginatedData = filteredData.slice(startIndex, startIndex + sizeNum);

    const SummaryTiles = ({ summary }: { summary: ExamSummary }) => {
        const tiles = [
            { icon: Sigma, label: "Total Marks", value: summary.totalMarks, color: "text-indigo-600" },
            { icon: Percent, label: "Percentage", value: `${summary.percentage}%`, color: "text-emerald-600" },
            { icon: BadgeCheck, label: "Grade", value: summary.grade, color: "text-orange-600" },
            { icon: Trophy, label: "Rank", value: summary.rank, color: "text-violet-600" },
        ];
        return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 border-t border-gray-200 bg-gray-50/50">
                {tiles.map((t, i) => (
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
            </div>
        );
    };

    return (
        <div className="p-4 lg:p-6 space-y-5 min-h-screen font-sans animate-in fade-in duration-500">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

                {/* ── Header ── */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Award className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-[16px] font-bold text-gray-800 tracking-tight leading-none">CBSE Exam Result</h1>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {loading ? "Loading results…" : `${totalEntries} exam result${totalEntries === 1 ? "" : "s"}`}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => window.print()}
                        title="Print"
                        className="h-9 shrink-0 px-3.5 gap-1.5 rounded-[10px] text-white text-[12px] font-semibold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity active:scale-95 print:hidden"
                    >
                        <Printer className="h-4 w-4" />
                        <span className="hidden sm:inline">Print</span>
                    </Button>
                </div>

                <div className="p-4 lg:p-5 space-y-5">

                    {/* ── Toolbar ── */}
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 border-b border-gray-100 pb-4 print:hidden">
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by exam or subject..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-9 h-9 text-[12px] border-gray-200 focus-visible:ring-indigo-300 rounded-lg shadow-none"
                            />
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-2">
                            <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                <SelectTrigger className="h-8 w-16 text-[11px] border-gray-200 shadow-none rounded-lg font-semibold text-gray-700 bg-white">
                                    <SelectValue placeholder="50" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-1 text-gray-400">
                                {[Copy, FileSpreadsheet, FileBox, Printer, Columns].map((Icon, i) => (
                                    <Button
                                        key={i}
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-white hover:shadow-sm rounded-md border border-transparent hover:border-gray-200 transition-all"
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-16 text-gray-400 text-sm">
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading exam results...
                            </div>
                        </div>
                    ) : paginatedData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <Award className="h-12 w-12 opacity-30 mb-3" />
                            <p className="font-bold uppercase text-[11px] tracking-widest">No exam results available</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {paginatedData.map((exam, index) => (
                                <div key={index} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    {/* Exam Title Bar */}
                                    <div className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] px-4 py-3 text-[14px] text-white font-bold flex items-center gap-2">
                                        <Award className="h-4 w-4" /> {exam.examName}
                                    </div>

                                    {/* Desktop table (lg+) */}
                                    <div className="hidden lg:block overflow-x-auto">
                                        <Table className="min-w-[800px]">
                                            <TableHeader className="bg-gray-50/80">
                                                <TableRow className="hover:bg-transparent">
                                                    <TableHead className="w-[200px] text-[10px] uppercase font-bold text-gray-600 h-auto py-3">Subject</TableHead>
                                                    {exam.columns.map((col, cIdx) => (
                                                        <TableHead key={cIdx} className="text-center text-[10px] uppercase font-bold text-gray-600 h-auto py-3">
                                                            <div>{col.name}</div>
                                                            <div className="font-normal normal-case text-gray-400">(Max {col.max})</div>
                                                        </TableHead>
                                                    ))}
                                                    <TableHead className="text-center text-[10px] uppercase font-bold text-gray-600 h-auto py-3">Total</TableHead>
                                                    <TableHead className="text-[10px] uppercase font-bold text-gray-600 h-auto py-3">Note</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {exam.subjects.map((subject, sIdx) => (
                                                    <TableRow key={sIdx} className="hover:bg-indigo-50/30 transition-colors border-b border-gray-100">
                                                        <TableCell className="text-[13px] text-gray-800 py-2.5 font-semibold">{subject.name}</TableCell>
                                                        {subject.scores.map((score, idx) => (
                                                            <TableCell key={idx} className="text-center text-[13px] text-gray-600 py-2.5">{score}</TableCell>
                                                        ))}
                                                        <TableCell className="text-center text-[13px] text-gray-900 font-bold py-2.5">{subject.total}</TableCell>
                                                        <TableCell className="text-[13px] text-gray-500 py-2.5">{subject.note}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Mobile cards (<lg) */}
                                    <div className="lg:hidden divide-y divide-gray-100">
                                        {exam.subjects.map((subject, sIdx) => (
                                            <div key={sIdx} className="p-3.5">
                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                    <span className="text-[13px] font-bold text-gray-800">{subject.name}</span>
                                                    <span className="text-[12px] font-bold text-gray-900 bg-gray-100 rounded-full px-2.5 py-0.5">Total {subject.total}</span>
                                                </div>
                                                <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-1.5">
                                                    {exam.columns.map((col, idx) => (
                                                        <div key={idx} className="flex items-center justify-between py-1 text-[12px]">
                                                            <span className="text-gray-500">{col.name} <span className="text-gray-400">(Max {col.max})</span></span>
                                                            <span className="font-semibold text-gray-700">{subject.scores[idx] ?? "-"}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                {subject.note && <p className="text-[11px] text-gray-500 mt-1.5">Note: {subject.note}</p>}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Summary tiles */}
                                    <SummaryTiles summary={exam.summary} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Pagination ── */}
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2 print:hidden">
                        <div>
                            Showing {totalEntries > 0 ? startIndex + 1 : 0} to{" "}
                            {Math.min(startIndex + sizeNum, totalEntries)} of {totalEntries} entries
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center gap-1.5">
                                <button
                                    disabled={safePage === 1}
                                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                    className="h-8 w-8 bg-white text-gray-400 rounded-[10px] border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none hover:shadow-sm transition-all active:scale-95"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={cn(
                                            "h-8 w-8 transition-all duration-300 text-xs flex items-center justify-center cursor-pointer font-bold rounded-[10px]",
                                            safePage === page
                                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-md shadow-indigo-500/20"
                                                : "bg-white text-gray-500 border border-gray-200 hover:shadow-sm active:scale-95"
                                        )}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    disabled={safePage === totalPages}
                                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                    className="h-8 w-8 bg-white text-gray-400 rounded-[10px] border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none hover:shadow-sm transition-all active:scale-95"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
