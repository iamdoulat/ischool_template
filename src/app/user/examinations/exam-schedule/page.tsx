"use client";

import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Search, ChevronLeft, ChevronRight,
    ArrowUpDown, Copy, FileSpreadsheet,
    FileBox, Printer, Columns, Eye, Loader2,
    CalendarDays, Clock, MapPin, Target, ShieldCheck, CalendarClock, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { toast } from "sonner";

interface ScheduleItem {
    id: number;
    subject: string;
    subject_code: string;
    date_from: string;
    start_time: string;
    duration: number;
    room_no: string;
    max_marks: number;
    min_marks: number;
}

interface Exam {
    id: number;
    exam: string;
    description: string;
    schedules: ScheduleItem[];
}

export default function UserExaminationsSchedulePage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState("50");
    const [currentPage, setCurrentPage] = useState(1);

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get("/user/exam-schedule");
            setExams(response.data?.data || []);
        } catch (error) {
            console.error("Error fetching exam schedule:", error);
            toast.error("Failed to load exam schedule");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openScheduleDialog = (exam: Exam) => {
        setSelectedExam(exam);
        setDialogOpen(true);
    };

    const filteredData = exams.filter(c =>
        c.exam.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sizeNum = parseInt(itemsPerPage, 10) || 50;
    const totalEntries = filteredData.length;
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * sizeNum;

    const paginatedData = filteredData.slice(startIndex, startIndex + sizeNum);

    return (
        <div className="p-4 lg:p-6 space-y-5 min-h-screen font-sans text-xs animate-in fade-in duration-500">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

                {/* ── Header ── */}
                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <CalendarClock className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[16px] font-bold text-gray-800 tracking-tight leading-none">Exam Schedule</h1>
                        <p className="text-[11px] text-gray-500 mt-1">
                            {loading ? "Loading schedule…" : `${totalEntries} exam${totalEntries === 1 ? "" : "s"} scheduled`}
                        </p>
                    </div>
                </div>

                <div className="p-4 lg:p-5 space-y-5">

                    {/* ── Toolbar ── */}
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 border-b border-gray-100 pb-4">
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search exams..."
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

                    {/* ── Desktop Table (md+) ── */}
                    <div className="hidden md:block rounded-lg border border-gray-100 overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[700px]">
                            <TableHeader className="bg-gray-50/80 border-b border-gray-100">
                                <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                    <TableHead className="py-3 px-4 h-auto w-20">S.No.</TableHead>
                                    <TableHead className="py-3 px-4 h-auto w-1/3">Exam <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto">Description</TableHead>
                                    <TableHead className="py-3 px-4 h-auto text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-12">
                                            <div className="flex items-center justify-center gap-2 text-gray-400">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Loading exam schedule...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedData.length === 0 ? (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={4} className="py-14 text-center">
                                            <div className="flex flex-col items-center text-gray-400">
                                                <CalendarClock className="h-10 w-10 opacity-30 mb-2" />
                                                <p className="text-[11px] font-bold uppercase tracking-widest">No exams scheduled</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedData.map((item, idx) => (
                                        <TableRow key={item.id || idx} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/30 transition-colors text-gray-600">
                                            <TableCell className="py-3 px-4 text-gray-400 font-medium">{startIndex + idx + 1}</TableCell>
                                            <TableCell className="py-3 px-4 font-semibold text-gray-800">
                                                <span className="flex items-center gap-2">
                                                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-indigo-50 text-indigo-500 text-[10px] font-bold shrink-0">{item.schedules?.length ?? 0}</span>
                                                    {item.exam}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3 px-4">{item.description || "-"}</TableCell>
                                            <TableCell className="py-3 px-4 text-right">
                                                <Button
                                                    onClick={() => openScheduleDialog(item)}
                                                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white h-7 px-2.5 rounded-lg text-[11px] font-bold shadow-sm transition-all active:scale-95 border-0 inline-flex items-center gap-1.5"
                                                >
                                                    <Eye className="h-3.5 w-3.5" /> View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* ── Mobile cards (<md) ── */}
                    <div className="md:hidden">
                        {loading ? (
                            <div className="flex items-center justify-center gap-2 text-gray-400 py-12">
                                <Loader2 className="h-4 w-4 animate-spin" /> Loading exam schedule...
                            </div>
                        ) : paginatedData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                                <CalendarClock className="h-12 w-12 opacity-30 mb-3" />
                                <p className="font-bold uppercase text-[11px] tracking-widest">No exams scheduled</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {paginatedData.map((item, idx) => (
                                    <div key={item.id || idx} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col gap-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <h3 className="text-[13px] font-bold text-gray-800 leading-snug">{item.exam}</h3>
                                                {item.description && <p className="text-[11px] text-gray-500 mt-0.5">{item.description}</p>}
                                            </div>
                                            <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                                <BookOpen className="h-3 w-3" />{item.schedules?.length ?? 0}
                                            </span>
                                        </div>
                                        <Button
                                            onClick={() => openScheduleDialog(item)}
                                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white h-8 text-[11px] font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 border-0 w-full mt-1"
                                        >
                                            <Eye className="h-3.5 w-3.5" /> View Schedule
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Pagination ── */}
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2">
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

            {/* ── Schedule Dialog ── */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[760px] w-[95vw] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-gray-800 text-base font-bold flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white">
                                <CalendarClock className="h-4 w-4" />
                            </span>
                            {selectedExam?.exam}
                        </DialogTitle>
                        <DialogDescription className="text-gray-500 text-xs">
                            {selectedExam?.description || "Exam schedule details"}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedExam && selectedExam.schedules.length > 0 ? (
                        <>
                            {/* Desktop table */}
                            <div className="hidden sm:block rounded-lg border border-gray-100 overflow-x-auto custom-scrollbar mt-2">
                                <Table>
                                    <TableHeader className="bg-gray-50/80">
                                        <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] uppercase font-bold text-gray-600">
                                            <TableHead className="py-2.5 px-3">Subject</TableHead>
                                            <TableHead className="py-2.5 px-3">Date</TableHead>
                                            <TableHead className="py-2.5 px-3">Time</TableHead>
                                            <TableHead className="py-2.5 px-3">Duration</TableHead>
                                            <TableHead className="py-2.5 px-3">Room</TableHead>
                                            <TableHead className="py-2.5 px-3 text-right">Max/Min</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedExam.schedules.map((s) => (
                                            <TableRow key={s.id} className="text-[12px] border-b border-gray-50 hover:bg-indigo-50/30 transition-colors text-gray-600">
                                                <TableCell className="py-2.5 px-3 font-semibold text-gray-800">
                                                    {s.subject}
                                                    {s.subject_code && <span className="text-[10px] text-gray-400 ml-1">({s.subject_code})</span>}
                                                </TableCell>
                                                <TableCell className="py-2.5 px-3">
                                                    <span className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3 text-indigo-400" />{s.date_from}</span>
                                                </TableCell>
                                                <TableCell className="py-2.5 px-3">
                                                    <span className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-indigo-400" />{s.start_time}</span>
                                                </TableCell>
                                                <TableCell className="py-2.5 px-3">
                                                    <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-semibold text-[10px]">{s.duration} MIN</span>
                                                </TableCell>
                                                <TableCell className="py-2.5 px-3">
                                                    <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-indigo-400" />{s.room_no || "TBA"}</span>
                                                </TableCell>
                                                <TableCell className="py-2.5 px-3 text-right">
                                                    <div className="flex flex-col items-end gap-0.5">
                                                        <span className="flex items-center gap-1 text-emerald-600 font-medium text-[10px]"><Target className="h-2.5 w-2.5" /> Max: {s.max_marks.toFixed(2)}</span>
                                                        <span className="flex items-center gap-1 text-rose-500 font-medium text-[10px]"><ShieldCheck className="h-2.5 w-2.5" /> Min: {s.min_marks.toFixed(2)}</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile cards */}
                            <div className="sm:hidden space-y-2.5 mt-2">
                                {selectedExam.schedules.map((s) => (
                                    <div key={s.id} className="rounded-xl border border-gray-200 bg-white shadow-sm p-3.5">
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <span className="text-[13px] font-bold text-gray-800">
                                                {s.subject}
                                                {s.subject_code && <span className="text-[10px] text-gray-400 ml-1">({s.subject_code})</span>}
                                            </span>
                                            <span className="shrink-0 bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-semibold text-[10px]">{s.duration} MIN</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-gray-600">
                                            <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-indigo-400 shrink-0" />{s.date_from}</span>
                                            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-indigo-400 shrink-0" />{s.start_time}</span>
                                            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-indigo-400 shrink-0" />{s.room_no || "TBA"}</span>
                                            <span className="flex items-center gap-1.5 text-emerald-600"><Target className="h-3.5 w-3.5 shrink-0" />Max {s.max_marks.toFixed(0)}</span>
                                            <span className="flex items-center gap-1.5 text-rose-500"><ShieldCheck className="h-3.5 w-3.5 shrink-0" />Min {s.min_marks.toFixed(0)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-10 text-gray-400 text-sm italic">
                            No schedule entries found for this exam.
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
