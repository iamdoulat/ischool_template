"use client";

import { useState, useEffect } from "react";
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
    CalendarClock, Filter
} from "lucide-react";

interface ScheduleItem {
    id: string;
    subject: {
        name: string;
        code: string;
    };
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
                        <td key={j} className="px-4 py-3">
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
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    // Criteria Data
    const [examGroups, setExamGroups] = useState<ExamGroup[]>([]);
    const [exams, setExams] = useState<ExamItem[]>([]);

    // Selected Criteria
    const [selectedCriteria, setSelectedCriteria] = useState({
        exam_group_id: "",
        exam_id: ""
    });

    // Schedule Data
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const response = await api.get('/examination/exam-schedules/criteria');
            setExamGroups(response.data.exam_groups || []);
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            tt.error("failed_to_load_criteria_data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedCriteria.exam_group_id) {
            const group = examGroups.find(g => g.id.toString() === selectedCriteria.exam_group_id);
            setExams(group?.exams || []);
        } else {
            setExams([]);
        }
    }, [selectedCriteria.exam_group_id, examGroups]);

    const handleSearch = async () => {
        if (!selectedCriteria.exam_id) {
            tt.error("please_select_an_exam");
            return;
        }

        setSearching(true);
        try {
            const response = await api.post('/examination/exam-schedules/search', {
                exam_id: selectedCriteria.exam_id
            });
            setSchedule(response.data || []);
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            tt.error("failed_to_fetch_schedule");
        } finally {
            setSearching(false);
        }
    };

    const filteredData = schedule.filter((item) =>
        item.subject.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 font-sans p-4 bg-gray-50/10 min-h-screen">
            {/* Header */}
            <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 uppercase tracking-widest flex items-center gap-3">
                        <CalendarClock className="h-6 w-6 text-indigo-500" />
                        {t("exam_schedule")}
                    </h1>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{t("exam_schedule_subtitle")}</p>
                </div>
            </div>

            {/* Select Criteria Section */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("select_criteria")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("choose_exam_group_and_exam")}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                {t("exam_group")} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={selectedCriteria.exam_group_id} onValueChange={(val) => setSelectedCriteria({...selectedCriteria, exam_group_id: val})}>
                                <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none">
                                    <SelectValue placeholder={t("select_group")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {examGroups.map(g => <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                {t("exam")} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={selectedCriteria.exam_id} onValueChange={(val) => setSelectedCriteria({...selectedCriteria, exam_id: val})}>
                                <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none">
                                    <SelectValue placeholder={t("select_exam")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {exams.map(e => <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={handleSearch}
                            disabled={searching}
                            className="btn-gradient text-white px-10 h-11 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full flex gap-2"
                        >
                            {searching ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <Search className="h-4 w-4" />}
                            {t("retrieve_schedule")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Exam Schedule List Section */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Clock className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("timetable_registry")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{schedule.length} {t("subjects_scheduled")}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><Copy className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><FileSpreadsheet className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><FileText className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><Printer className="h-4 w-4" /></Button>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder={t("search_by_subject")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-11 text-sm border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none"
                            />
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-50 overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="!bg-[#f3f4f6] text-[10px] uppercase font-bold text-gray-500">
                                <TableRow className="hover:bg-transparent border-gray-50">
                                    <TableHead className="py-4 px-6 min-w-[200px]">{t("subject")}</TableHead>
                                    <TableHead className="py-4 px-6 min-w-[150px]">{t("date_and_time")}</TableHead>
                                    <TableHead className="py-4 px-6 min-w-[100px]">{t("duration")}</TableHead>
                                    <TableHead className="py-4 px-6 min-w-[100px]">{t("room")}</TableHead>
                                    <TableHead className="py-4 px-6 text-right min-w-[120px]">{t("thresholds")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {searching ? (
                                    <TableSkeleton rows={5} cols={5} />
                                ) : schedule.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                            {t("please_select_an_exam_to_view_schedule")}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredData.map((item) => (
                                        <TableRow key={item.id} className="text-[13px] text-gray-600 hover:bg-gray-50/30 transition-colors border-b last:border-0 border-gray-50 group">
                                            <TableCell className="py-4 px-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-indigo-600 uppercase tracking-tight">{item.subject.name}</span>
                                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{t("code")}: {item.subject.code}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="flex items-center gap-2 font-bold text-gray-700">
                                                        <CalendarDays className="h-3 w-3 text-gray-400" /> {item.date_from}
                                                    </span>
                                                    <span className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                                        <Clock className="h-3 w-3" /> {item.start_time}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-bold text-[10px]">
                                                    {item.duration} {t("mins")}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <span className="flex items-center gap-2 font-bold text-gray-500">
                                                    <MapPin className="h-3 w-3" /> {item.room_no || t("tba")}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-4 px-6 text-right">
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="flex items-center gap-2 font-bold text-emerald-600 text-[11px]">
                                                        <Target className="h-3 w-3" /> {t("max")}: {parseFloat(item.max_marks).toFixed(2)}
                                                    </span>
                                                    <span className="flex items-center gap-2 font-bold text-rose-500 text-[10px]">
                                                        <ShieldCheck className="h-3 w-3" /> {t("min")}: {parseFloat(item.min_marks).toFixed(2)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
