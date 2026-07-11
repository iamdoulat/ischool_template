"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
    Printer, CalendarDays, Clock, MapPin, Timer, 
    BookOpen, ShieldCheck, Download, Share2,
    CalendarCheck2, LayoutGrid, Info
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ExamSubject {
    id: number;
    subject: {
        name: string;
        code: string;
    };
    date: string;
    start_time: string;
    duration: number;
    room_no: string;
}

interface ExamGrouped {
    id: number;
    name: string;
    schedules: ExamSubject[];
}

export default function ExamSchedulePage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [examGroups, setExamGroups] = useState<ExamGrouped[]>([]);

    useEffect(() => {
        fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        setLoading(true);
        try {
            // Fetch CBSE Exams from backend
            const response = await api.get('/examination/cbse-exams');
            
            // Mock schedule data for CBSE Exams (since backend doesn't support cbse schedules yet)
            const mockSchedules = (response.data.data || []).map((exam: any) => {
                return {
                    id: exam.id,
                    name: exam.name || "CBSE Examination",
                    schedules: [
                        {
                            id: 1,
                            subject: { name: "Mathematics", code: "MATH101" },
                            date: new Date().toISOString().split('T')[0],
                            start_time: "09:00:00",
                            duration: 180,
                            room_no: "Room 101"
                        },
                        {
                            id: 2,
                            subject: { name: "Science", code: "SCI102" },
                            date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                            start_time: "09:00:00",
                            duration: 180,
                            room_no: "Room 102"
                        }
                    ]
                };
            });
            
            setExamGroups(mockSchedules);
        } catch (error) {
            toast({ title: "Error", description: "Failed to load CBSE exam schedules", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 font-sans p-4 bg-gray-50/10 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <CalendarCheck2 className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">Board Examination Timetable</h1>
                        <p className="text-[11px] text-gray-500 mt-1">Examination logistics and venue management</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="h-10 rounded-full text-[10px] font-bold uppercase tracking-widest flex gap-2 border-gray-200">
                        <Download className="h-3.5 w-3.5" /> Download PDF
                    </Button>
                    <Button className="btn-gradient text-white h-10 rounded-full text-[10px] font-bold uppercase tracking-widest flex gap-2 shadow-lg shadow-orange-200/50">
                        <Share2 className="h-3.5 w-3.5" /> Publish Cycle
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 gap-8">
                    {[1, 2].map(i => (
                        <div key={i} className="bg-white rounded-lg border border-gray-100 p-8 h-64 animate-pulse flex flex-col justify-center items-center space-y-4">
                            <div className="h-8 w-64 bg-gray-100 rounded-full" />
                            <div className="h-32 w-full bg-gray-50 rounded-lg" />
                        </div>
                    ))}
                </div>
            ) : examGroups.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-100 p-24 text-center space-y-4 opacity-40">
                    <CalendarDays className="h-16 w-16 text-gray-300 mx-auto" />
                    <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-gray-500">No Active Schedules</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mx-auto max-w-sm">There are no institutional examination cycles currently scheduled for this academic term</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-8">
                    {examGroups.map((group) => (
                        <div key={group.id} className="bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-indigo-100/50">
                            {/* Card Header */}
                            <div className="bg-gray-50/50 px-6 py-4 flex justify-between items-center border-b border-gray-100 group-hover:bg-indigo-50/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-lg bg-white shadow-sm flex items-center justify-center border border-gray-100">
                                        <ShieldCheck className="h-5 w-5 text-indigo-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-gray-800 font-bold text-sm uppercase tracking-widest">{group.name}</h3>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">Verified Cycle</span>
                                            <div className="h-1 w-1 rounded-full bg-gray-300" />
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{group.schedules.length} Subjects Listed</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                                    <Button size="icon" variant="ghost" className="h-9 w-9 bg-white border border-gray-100 hover:bg-indigo-500 hover:text-white rounded-lg shadow-sm">
                                        <Printer className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-9 w-9 bg-white border border-gray-100 hover:bg-indigo-500 hover:text-white rounded-lg shadow-sm">
                                        <Info className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Card Table */}
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-gray-50/20 text-[10px] uppercase font-bold text-gray-500">
                                        <TableRow className="hover:bg-transparent border-b border-gray-50">
                                            <TableHead className="py-4 px-8 w-[30%]">Subject Dimension</TableHead>
                                            <TableHead className="py-4 px-6 text-center">Examination Date</TableHead>
                                            <TableHead className="py-4 px-6 text-center">Start Velocity</TableHead>
                                            <TableHead className="py-4 px-6 text-center">Duration</TableHead>
                                            <TableHead className="py-4 px-8 text-right">Venue / Room</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {group.schedules.map((subject, index) => (
                                            <TableRow key={index} className="text-[13px] border-b last:border-0 border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                                                <TableCell className="py-5 px-8">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100 text-gray-400">
                                                            <BookOpen className="h-4 w-4" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-indigo-700 uppercase tracking-tighter">{subject.subject.name}</span>
                                                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{subject.subject.code}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-bold text-gray-600">
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100 text-[11px]">
                                                        <CalendarDays className="h-3.5 w-3.5 text-indigo-500" />
                                                        {subject.date}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-bold text-gray-500">
                                                    <div className="inline-flex items-center gap-2 text-[11px]">
                                                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                        {subject.start_time}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[10px] border border-emerald-100">
                                                        <Timer className="h-3 w-3" /> {subject.duration} MINS
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-5 px-8">
                                                    <div className="inline-flex items-center gap-2 font-bold text-gray-400 text-[11px] uppercase">
                                                        <MapPin className="h-3.5 w-3.5 text-rose-500" /> Room {subject.room_no || "TBA"}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
