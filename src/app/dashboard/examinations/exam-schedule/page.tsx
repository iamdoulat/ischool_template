"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Copy, FileSpreadsheet, FileText, Printer, Search,
    CalendarDays, Clock, MapPin, Target, ShieldCheck,
    CalendarClock, Filter, BookOpen, Layers, CheckCircle2,
    Sparkles, AlertCircle
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ScheduleItem {
    id: string;
    subject: {
        name: string;
        code: string;
    };
    class_name?: string;
    section_name?: string;
    date_from: string;
    start_time: string;
    duration: number;
    room_no: string;
    max_marks: string;
    min_marks: string;
}

interface ExamItem {
    id: string | number;
    name: string;
}

interface ExamGroup {
    id: string | number;
    name: string;
    exams?: ExamItem[];
}

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-5 py-4">
                            <div className="h-4 rounded-md bg-muted/60 animate-pulse" style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

export default function ExamSchedulePage() {
    const { t } = useTranslation();
    const tt = useTranslateToast();

    // Criteria states
    const [examGroups, setExamGroups] = useState<ExamGroup[]>([]);
    const [exams, setExams] = useState<ExamItem[]>([]);
    const [selectedCriteria, setSelectedCriteria] = useState({
        exam_group_id: "",
        exam_id: ""
    });

    // Schedule results state
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [searching, setSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Initial Criteria Fetch
    useEffect(() => {
        fetchCriteria();
    }, []);

    const fetchCriteria = async () => {
        try {
            const res = await api.get('/examination/exam-schedules/criteria');
            const data = res.data?.data || res.data || {};
            setExamGroups(data.exam_groups || []);
        } catch {
            tt.error("failed_to_fetch_criteria");
        }
    };

    // When Exam Group Changes, populate Exams dropdown
    useEffect(() => {
        if (selectedCriteria.exam_group_id) {
            const selectedGroup = examGroups.find(
                g => g.id.toString() === selectedCriteria.exam_group_id
            );
            setExams(selectedGroup?.exams || []);
            setSelectedCriteria(prev => ({ ...prev, exam_id: "" }));
            setSchedule([]);
            setHasSearched(false);
        } else {
            setExams([]);
            setSelectedCriteria(prev => ({ ...prev, exam_id: "" }));
            setSchedule([]);
            setHasSearched(false);
        }
    }, [selectedCriteria.exam_group_id, examGroups]);

    // Handle Schedule Search
    const handleSearch = async () => {
        if (!selectedCriteria.exam_id) {
            tt.error("please_select_an_exam");
            return;
        }

        setSearching(true);
        setHasSearched(true);
        try {
            const response = await api.post('/examination/exam-schedules/search', {
                exam_id: selectedCriteria.exam_id
            });
            const data = response.data?.data || response.data || [];
            setSchedule(Array.isArray(data) ? data : []);
        } catch {
            tt.error("failed_to_fetch_schedule");
        } finally {
            setSearching(false);
        }
    };

    const filteredData = schedule.filter((item) =>
        (item.subject?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.subject?.code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.class_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.section_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.room_no || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group filtered schedule items by Class and Section
    const groupedSchedules = useMemo(() => {
        if (filteredData.length === 0) return [];

        const groups: { [key: string]: { className: string; sectionName: string; items: ScheduleItem[] } } = {};

        filteredData.forEach(item => {
            const cls = item.class_name || "General";
            const sec = item.section_name || "All";
            const key = `${cls}___${sec}`;

            if (!groups[key]) {
                groups[key] = {
                    className: cls,
                    sectionName: sec,
                    items: []
                };
            }
            groups[key].items.push(item);
        });

        return Object.values(groups);
    }, [filteredData]);

    // Export functions
    const exportToExcel = () => {
        if (filteredData.length === 0) return;
        const ws = XLSX.utils.json_to_sheet(filteredData.map(s => ({
            [t("subject")]: s.subject?.name || "",
            [t("subject_code")]: s.subject?.code || "",
            [t("class")]: s.class_name || "",
            [t("section")]: s.section_name || "",
            [t("date")]: s.date_from || "",
            [t("start_time")]: s.start_time || "",
            [t("duration_min")]: s.duration || "",
            [t("room_no")]: s.room_no || "",
            [t("max_marks")]: s.max_marks || "",
            [t("min_marks")]: s.min_marks || ""
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Exam Schedule");
        XLSX.writeFile(wb, "exam-schedule.xlsx");
        tt.success("exported_to_excel_successfully");
    };

    const exportToPDF = () => {
        if (filteredData.length === 0) return;
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(t("exam_schedule") || "Exam Schedule", 14, 15);
        autoTable(doc, {
            head: [[t("subject"), t("code"), t("class"), t("section"), t("date"), t("start_time"), t("duration"), t("room_no"), t("max_marks"), t("min_marks")]],
            body: filteredData.map(s => [
                s.subject?.name || "—",
                s.subject?.code || "—",
                s.class_name || "—",
                s.section_name || "—",
                s.date_from || "—",
                s.start_time || "—",
                `${s.duration || 0} mins`,
                s.room_no || "—",
                s.max_marks || "0",
                s.min_marks || "0"
            ]),
            startY: 22,
            styles: { fontSize: 9 }
        });
        doc.save("exam-schedule.pdf");
        tt.success("exported_to_pdf_successfully");
    };

    const copyToClipboard = () => {
        if (filteredData.length === 0) return;
        const text = filteredData.map(s => `${s.subject?.name || "—"}\t${s.subject?.code || "—"}\t${s.class_name || "—"}\t${s.section_name || "—"}\t${s.date_from || "—"}\t${s.start_time || "—"}\t${s.duration || 0} mins\t${s.room_no || "—"}\tMax: ${s.max_marks || 0}\tMin: ${s.min_marks || 0}`).join('\n');
        navigator.clipboard.writeText(text);
        tt.success("data_copied_to_clipboard");
    };

    const printTable = () => {
        window.print();
    };

    const selectedGroupObj = examGroups.find(g => g.id.toString() === selectedCriteria.exam_group_id);
    const selectedExamObj = exams.find(e => e.id.toString() === selectedCriteria.exam_id);

    return (
        <div className="space-y-6 font-sans p-4 md:p-6 bg-slate-50/40 min-h-screen">
            {/* Top Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.06)] bg-gradient-to-r from-[#FFF5E7] via-white to-[#EFF0FD]">
                <div className="flex items-center gap-3.5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-md shadow-indigo-100">
                        <CalendarClock className="h-6 w-6" />
                    </span>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            {t("exam_schedule")}
                        </h1>
                        <p className="text-xs text-gray-600 mt-0.5 font-medium">
                            {t("view_and_manage_examination_timetables_and_subject_schedules") || "View and manage examination timetables, subject dates, durations, and room allocations"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Select Criteria Section */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 rounded-2xl">
                <CardHeader className="flex flex-row items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FFF5E7] via-[#F8F4FF] to-[#EFF0FD] w-full">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-4.5 w-4.5" />
                    </span>
                    <div>
                        <CardTitle className="text-sm font-bold text-slate-800 tracking-tight leading-none">{t("select_criteria")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("choose_exam_group_and_exam")}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-5 md:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        {/* Exam Group */}
                        <div className="space-y-1.5 md:col-span-5">
                            <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <Layers className="h-3.5 w-3.5 text-indigo-500" />
                                {t("exam_group")} <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={selectedCriteria.exam_group_id}
                                onValueChange={(val) => setSelectedCriteria(prev => ({ ...prev, exam_group_id: val }))}
                            >
                                <SelectTrigger className="h-11 border-slate-200 bg-slate-50/50 hover:bg-slate-50 rounded-xl focus:ring-indigo-500 transition-all">
                                    <SelectValue placeholder={t("select_group")} />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {examGroups.length === 0 ? (
                                        <SelectItem value="empty" disabled>{t("no_exam_groups_found")}</SelectItem>
                                    ) : (
                                        examGroups.map(g => (
                                            <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Exam */}
                        <div className="space-y-1.5 md:col-span-4">
                            <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                                {t("exam")} <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={selectedCriteria.exam_id}
                                onValueChange={(val) => setSelectedCriteria(prev => ({ ...prev, exam_id: val }))}
                                disabled={!selectedCriteria.exam_group_id || exams.length === 0}
                            >
                                <SelectTrigger className="h-11 border-slate-200 bg-slate-50/50 hover:bg-slate-50 rounded-xl focus:ring-indigo-500 transition-all disabled:opacity-60">
                                    <SelectValue placeholder={!selectedCriteria.exam_group_id ? t("select_exam_group_first") : t("select_exam")} />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {exams.length === 0 ? (
                                        <SelectItem value="none" disabled>{t("no_exams_available")}</SelectItem>
                                    ) : (
                                        exams.map(e => (
                                            <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Search / Retrieve Button (Inline in 3rd Column) */}
                        <div className="md:col-span-3">
                            <Button
                                onClick={handleSearch}
                                disabled={searching || !selectedCriteria.exam_id}
                                className="w-full h-11 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-indigo-100 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                            >
                                {searching ? (
                                    <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                                ) : (
                                    <Search className="h-4 w-4" />
                                )}
                                {t("retrieve_schedule")}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Top Toolbar & Filter Row when schedules exist */}
            {schedule.length > 0 && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.06)] bg-gradient-to-r from-[#FFF5E7] via-white to-[#EFF0FD]">
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                            <Clock className="h-4 w-4" />
                        </span>
                        <div>
                            <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                {t("exam_schedule_list")}
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                                    {groupedSchedules.length} {t("classes_sections") || "Classes / Sections"}
                                </span>
                            </h2>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                {selectedGroupObj && selectedExamObj ? (
                                    <span>
                                        <strong className="text-slate-700">{selectedGroupObj.name}</strong> • {selectedExamObj.name}
                                    </span>
                                ) : (
                                    t("subject_dates_timings_and_room_allocations") || "Subject examination dates, start times, durations, and rooms"
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Right Controls: Search Input + Export Toolbar */}
                    <div className="flex items-center gap-2.5 self-end md:self-auto flex-wrap">
                        <div className="relative w-48 sm:w-60">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <Input
                                placeholder={t("search_by_subject_or_room")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8.5 h-8.5 text-xs rounded-lg border-slate-200 bg-white focus:bg-white focus:ring-indigo-500 transition-all shadow-2xs"
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={copyToClipboard}
                                title={t("copy_to_clipboard")}
                                className="h-8 w-8 rounded-lg border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer shadow-2xs"
                            >
                                <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={exportToExcel}
                                title={t("export_excel")}
                                className="h-8 w-8 rounded-lg border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all cursor-pointer shadow-2xs"
                            >
                                <FileSpreadsheet className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={exportToPDF}
                                title={t("export_pdf")}
                                className="h-8 w-8 rounded-lg border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all cursor-pointer shadow-2xs"
                            >
                                <FileText className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={printTable}
                                title={t("print")}
                                className="h-8 w-8 rounded-lg border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer shadow-2xs"
                            >
                                <Printer className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty or Searching State Card */}
            {(searching || schedule.length === 0) && (
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 rounded-2xl">
                    <CardHeader className="flex flex-row items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-[#FFF5E7] via-[#F8F4FF] to-[#EFF0FD] w-full">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                            <Clock className="h-4 w-4" />
                        </span>
                        <div>
                            <CardTitle className="text-sm font-bold text-slate-800 tracking-tight leading-none">
                                {t("exam_schedule_list")}
                            </CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {t("subject_dates_timings_and_room_allocations") || "Subject examination dates, start times, durations, and rooms"}
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        {searching ? (
                            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                                <Table>
                                    <TableBody>
                                        <TableSkeleton rows={4} cols={5} />
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="py-14 text-center">
                                <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                    <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-3 shadow-inner">
                                        <CalendarClock className="h-7 w-7 opacity-80" />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-800">
                                        {hasSearched ? t("no_schedule_found_for_this_exam") : t("please_select_an_exam")}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1 text-center">
                                        {hasSearched
                                            ? t("no_subject_schedules_created_yet_for_exam")
                                            : t("select_exam_group_and_exam_above_to_retrieve")}
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Class & Section Wise Separate Cards */}
            {!searching && schedule.length > 0 && groupedSchedules.length === 0 && (
                <Card className="border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500 bg-white">
                    {t("no_matching_subjects_found_for")} &ldquo;{searchTerm}&rdquo;
                </Card>
            )}

            {!searching && groupedSchedules.map((group, idx) => (
                <Card key={`${group.className}-${group.sectionName}-${idx}`} className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 rounded-2xl">
                    <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-[#FFF5E7] via-[#F8F4FF] to-[#EFF0FD] w-full">
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                                <Clock className="h-4 w-4" />
                            </span>
                            <div>
                                <CardTitle className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2 flex-wrap">
                                    <span className="flex items-center gap-1.5">
                                        <span className="text-slate-500 font-medium">{t("class")}:</span>
                                        <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">{group.className}</span>
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="text-slate-500 font-medium">{t("section")}:</span>
                                        <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">{group.sectionName}</span>
                                    </span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-white text-indigo-700 border border-indigo-200/80 shadow-2xs">
                                        {group.items.length} {t("subjects")}
                                    </span>
                                </CardTitle>
                                <p className="text-[11px] text-slate-500 mt-1">
                                    {selectedGroupObj && selectedExamObj ? (
                                        <span>
                                            <strong className="text-slate-700">{selectedGroupObj.name}</strong> • {selectedExamObj.name}
                                        </span>
                                    ) : (
                                        t("subject_dates_timings_and_room_allocations") || "Subject examination dates, start times, durations, and rooms"
                                    )}
                                </p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-4 md:p-5 space-y-3">
                        {/* Table Container */}
                        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                            <Table>
                                <TableHeader className="bg-slate-50/90 text-[11px] uppercase font-bold text-slate-600 border-b border-slate-200">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="py-3.5 px-5 min-w-[200px]">{t("subject")}</TableHead>
                                        <TableHead className="py-3.5 px-5 min-w-[160px]">{t("date_and_time")}</TableHead>
                                        <TableHead className="py-3.5 px-5 min-w-[110px] text-center">{t("duration")}</TableHead>
                                        <TableHead className="py-3.5 px-5 min-w-[120px]">{t("room_no")}</TableHead>
                                        <TableHead className="py-3.5 px-5 text-right min-w-[140px]">{t("marks_max_min")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {group.items.map((item, itemIdx) => (
                                        <TableRow
                                            key={item.id || itemIdx}
                                            className="text-xs text-slate-700 hover:bg-indigo-50/40 transition-colors border-b last:border-0 border-slate-100 group"
                                        >
                                            {/* Subject Name & Code */}
                                            <TableCell className="py-3.5 px-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                                                        <BookOpen className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                            {item.subject?.name || "—"}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                                                            {t("code")}: {item.subject?.code || "—"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Date & Start Time */}
                                            <TableCell className="py-3.5 px-5">
                                                <div className="flex flex-col gap-1">
                                                    <span className="flex items-center gap-1.5 font-bold text-slate-800">
                                                        <CalendarDays className="h-3.5 w-3.5 text-indigo-500" />
                                                        {item.date_from || "—"}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                                                        <Clock className="h-3 w-3 text-slate-400" />
                                                        {item.start_time || "—"}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            {/* Duration */}
                                            <TableCell className="py-3.5 px-5 text-center">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full font-bold text-[10.5px] bg-slate-100 text-slate-700 border border-slate-200/60">
                                                    {item.duration || 0} {t("mins")}
                                                </span>
                                            </TableCell>

                                            {/* Room */}
                                            <TableCell className="py-3.5 px-5">
                                                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                                                    <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                                    {item.room_no || <span className="text-slate-400 italic">{t("tba")}</span>}
                                                </span>
                                            </TableCell>

                                            {/* Threshold Marks */}
                                            <TableCell className="py-3.5 px-5 text-right">
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600 text-xs">
                                                        <Target className="h-3 w-3 text-emerald-500" />
                                                        <span className="text-[10px] uppercase text-emerald-500/80 font-semibold">{t("max")}:</span> {item.max_marks ? parseFloat(item.max_marks).toFixed(2) : "0.00"}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 font-bold text-rose-500 text-[11px]">
                                                        <ShieldCheck className="h-3 w-3 text-rose-400" />
                                                        <span className="text-[10px] uppercase text-rose-400 font-semibold">{t("min")}:</span> {item.min_marks ? parseFloat(item.min_marks).toFixed(2) : "0.00"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Table Footer: Showing entries on the left */}
                        <div className="flex items-center justify-between pt-1">
                            <div className="text-xs text-slate-500 font-medium">
                                {t("showing")} <strong className="text-slate-800">{group.items.length}</strong> {t("of")} {group.items.length} {t("entries")}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
