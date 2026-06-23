"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import {
    Printer, Copy, FileSpreadsheet, FileDown, Search, Loader2,
    CalendarClock, CalendarDays, Clock, MapPin, Timer, BookOpen,
} from "lucide-react";
import api from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useTranslation } from "@/hooks/use-translation";

interface Subject {
    id: number;
    name: string;
    date: string;
    startTime: string;
    duration: string;
    room: string;
}

interface ExamGroup {
    id: number;
    examName: string;
    subjects: Subject[];
}

const fmt = (d: string) => (d ? formatDate(d) : "—");

/** Compare an ISO date string to today: -1 past, 0 today, 1 upcoming. */
function dayStatus(iso: string): -1 | 0 | 1 | null {
    if (!iso) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d.getTime())) return null;
    if (d.getTime() === today.getTime()) return 0;
    return d.getTime() > today.getTime() ? 1 : -1;
}

function StatusPill({ iso }: { iso: string }) {
    const { t } = useTranslation();
    const s = dayStatus(iso);
    if (s === null) return null;
    if (s === 0) return <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white">{t("today")}</span>;
    if (s === 1) return <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{t("upcoming")}</span>;
    return <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">{t("done")}</span>;
}

export default function UserCBSEExamSchedulePage() {
    const { t } = useTranslation();
    const [examGroups, setExamGroups] = useState<ExamGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get("/user/cbse-exam-schedule");
            setExamGroups(response.data?.data || []);
        } catch (error) {
            console.error("Error fetching CBSE exam schedule:", error);
            toast.error(t("failed_to_load_cbse_exam_schedule"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredData = useMemo(() => {
        const term = searchTerm.toLowerCase();
        if (!term) return examGroups;
        return examGroups
            .map((g) => {
                const examMatches = g.examName.toLowerCase().includes(term);
                if (examMatches) return g;
                const subjects = g.subjects.filter((s) => s.name.toLowerCase().includes(term));
                return subjects.length ? { ...g, subjects } : null;
            })
            .filter(Boolean) as ExamGroup[];
    }, [examGroups, searchTerm]);

    const totalExams = filteredData.length;
    const totalPapers = filteredData.reduce((acc, g) => acc + g.subjects.length, 0);

    const exportRows = () =>
        filteredData.flatMap((g) =>
            g.subjects.map((s) => ({
                "Exam": g.examName,
                "Subject": s.name,
                "Date": fmt(s.date),
                "Start Time": s.startTime,
                "Duration (min)": s.duration,
                "Room No.": s.room,
            }))
        );

    const copyToClipboard = () => {
        const text = exportRows().map((r) => Object.values(r).join("\t")).join("\n");
        navigator.clipboard.writeText(text);
        toast.success(t("copied_to_clipboard"));
    };

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(exportRows());
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "CBSE Exam Schedule");
        XLSX.writeFile(wb, "cbse-exam-schedule.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF("l");
        doc.text("CBSE Exam Schedule", 14, 16);
        autoTable(doc, {
            head: [["Exam", "Subject", "Date", "Start Time", "Duration", "Room"]],
            body: exportRows().map((r) => [
                r["Exam"], r["Subject"], r["Date"], r["Start Time"], r["Duration (min)"], r["Room No."],
            ]),
            startY: 22,
            styles: { fontSize: 8 },
        });
        doc.save("cbse-exam-schedule.pdf");
    };

    return (
        <div className="p-4 lg:p-6 animate-in fade-in duration-500">
            <Card className="shadow-sm border border-gray-200 rounded-xl overflow-hidden p-0 gap-0">
                {/* ── Header ── */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <CalendarClock className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <h1 className="text-[16px] font-bold text-gray-800 tracking-tight leading-none truncate">{t("cbse_exam_timetable")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {loading
                                    ? t("loading")
                                    : `${totalExams} exam${totalExams === 1 ? "" : "s"} · ${totalPapers} paper${totalPapers === 1 ? "" : "s"}`}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => window.print()}
                        title={t("print")}
                        className="h-9 shrink-0 px-3.5 gap-1.5 rounded-[10px] text-white text-[12px] font-semibold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity active:scale-95 print:hidden"
                    >
                        <Printer className="h-4 w-4" />
                        <span className="hidden sm:inline">{t("print")}</span>
                    </Button>
                </div>

                <CardContent className="p-4">
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 print:hidden">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                placeholder={t("search_by_exam_or_subject")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 h-9 text-sm rounded-[10px]"
                            />
                        </div>

                        <div className="flex items-center border border-gray-200 rounded-[10px] overflow-hidden">
                            {[
                                { icon: Copy, label: t("copy"), action: copyToClipboard },
                                { icon: FileSpreadsheet, label: t("excel"), action: exportToExcel },
                                { icon: FileDown, label: t("pdf"), action: exportToPDF },
                                { icon: Printer, label: t("print"), action: () => window.print() },
                            ].map(({ icon: Icon, label, action }, i, arr) => (
                                <Button
                                    key={label}
                                    variant="ghost"
                                    size="icon"
                                    title={label}
                                    onClick={action}
                                    className={cn(
                                        "h-9 w-9 rounded-none hover:bg-gray-100",
                                        i < arr.length - 1 && "border-r border-gray-200"
                                    )}
                                >
                                    <Icon className="h-4 w-4 text-gray-500" />
                                </Button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span>{t("loading_exam_schedule")}</span>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <CalendarDays className="h-12 w-12 opacity-30 mb-3" />
                            <p className="text-base font-medium text-gray-500">{t("no_exam_schedule_found")}</p>
                            <p className="text-sm mt-1">{t("timetables_appear_once_published")}</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {filteredData.map((exam) => (
                                <div key={exam.id} className="rounded-xl border border-gray-200 overflow-hidden shadow-sm print:break-inside-avoid">
                                    {/* Exam title bar */}
                                    <div className="flex items-center gap-2.5 bg-gradient-to-r from-[#FF9800] to-[#6366F1] px-4 py-3 text-white">
                                        <BookOpen className="h-4 w-4 shrink-0" />
                                        <span className="text-[14px] font-bold tracking-tight">{exam.examName}</span>
                                        <span className="ml-auto text-[11px] font-medium bg-white/20 rounded-full px-2 py-0.5">
                                            {exam.subjects.length} paper{exam.subjects.length === 1 ? "" : "s"}
                                        </span>
                                    </div>

                                    {/* ── Desktop table ── */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <Table className="min-w-[760px]">
                                            <TableHeader>
                                                <TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-200">
                                                    <TableHead className="w-[34%] text-[12px] font-bold text-gray-700 py-3 px-4">{t("subject")}</TableHead>
                                                    <TableHead className="text-[12px] font-bold text-gray-700 py-3 px-4">{t("date")}</TableHead>
                                                    <TableHead className="text-[12px] font-bold text-gray-700 py-3 px-4">{t("start_time")}</TableHead>
                                                    <TableHead className="text-[12px] font-bold text-gray-700 py-3 px-4 text-center">{t("duration")}</TableHead>
                                                    <TableHead className="text-[12px] font-bold text-gray-700 py-3 px-4 text-center">{t("room_no")}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {exam.subjects.map((subject, sIdx) => (
                                                    <TableRow key={subject.id || sIdx} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                                                        <TableCell className="py-3 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-[#6366F1]">
                                                                    <BookOpen className="h-3.5 w-3.5" />
                                                                </span>
                                                                <span className="text-[13px] font-medium text-gray-800">{subject.name}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-3 px-4 text-[13px] text-gray-600">
                                                            <div className="flex items-center gap-2">
                                                                <CalendarDays className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                                <span>{fmt(subject.date)}</span>
                                                                <StatusPill iso={subject.date} />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-3 px-4 text-[13px] text-gray-600">
                                                            <span className="flex items-center gap-1.5">
                                                                <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                                {subject.startTime || "—"}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="py-3 px-4 text-center">
                                                            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium text-[11px]">
                                                                <Timer className="h-3 w-3" /> {subject.duration} min
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="py-3 px-4 text-center text-[13px] text-gray-600">
                                                            <span className="inline-flex items-center gap-1.5">
                                                                <MapPin className="h-3.5 w-3.5 text-rose-400" />
                                                                {subject.room || "TBA"}
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* ── Mobile cards ── */}
                                    <div className="md:hidden divide-y divide-gray-100 print:hidden">
                                        {exam.subjects.map((subject, sIdx) => (
                                            <div key={subject.id || sIdx} className="p-3.5">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-[#6366F1]">
                                                            <BookOpen className="h-4 w-4" />
                                                        </span>
                                                        <span className="text-[13px] font-semibold text-gray-800 truncate">{subject.name}</span>
                                                    </div>
                                                    <StatusPill iso={subject.date} />
                                                </div>
                                                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-gray-500">
                                                    <span className="flex items-center gap-1.5">
                                                        <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                                                        <span className="font-medium text-gray-700">{fmt(subject.date)}</span>
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                        <span className="font-medium text-gray-700">{subject.startTime || "—"}</span>
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Timer className="h-3.5 w-3.5 text-gray-400" />
                                                        <span className="font-medium text-gray-700">{subject.duration} min</span>
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <MapPin className="h-3.5 w-3.5 text-rose-400" />
                                                        <span className="font-medium text-gray-700">{t("room")} {subject.room || "TBA"}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
