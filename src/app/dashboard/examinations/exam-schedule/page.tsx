"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
    Copy, FileSpreadsheet, FileText, Printer, Columns, Search, 
    CalendarDays, Clock, MapPin, Target, ShieldCheck, 
    ChevronLeft, ChevronRight, ClipboardList
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

export default function ExamSchedulePage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    
    // Criteria Data
    const [examGroups, setExamGroups] = useState<any[]>([]);
    const [exams, setExams] = useState<any[]>([]);

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
            toast({ title: "Error", description: "Failed to load criteria data", variant: "destructive" });
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
            toast({ title: "Validation Error", description: "Please select an exam", variant: "destructive" });
            return;
        }

        setSearching(true);
        try {
            const response = await api.post('/examination/exam-schedules/search', {
                exam_id: selectedCriteria.exam_id
            });
            setSchedule(response.data || []);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch schedule", variant: "destructive" });
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
                        <CalendarDays className="h-6 w-6 text-indigo-500" />
                        Examination Timetable
                    </h1>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Official institutional examination schedule repository</p>
                </div>
            </div>

            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                    <ClipboardList className="h-5 w-5 text-indigo-500" />
                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Search Configuration</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                            Exam Group <span className="text-red-500">*</span>
                        </Label>
                        <Select value={selectedCriteria.exam_group_id} onValueChange={(val) => setSelectedCriteria({...selectedCriteria, exam_group_id: val})}>
                            <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none">
                                <SelectValue placeholder="Select Group" />
                            </SelectTrigger>
                            <SelectContent>
                                {examGroups.map(g => <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                            Exam <span className="text-red-500">*</span>
                        </Label>
                        <Select value={selectedCriteria.exam_id} onValueChange={(val) => setSelectedCriteria({...selectedCriteria, exam_id: val})}>
                            <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none">
                                <SelectValue placeholder="Select Exam" />
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
                        Retrieve Schedule
                    </Button>
                </div>
            </div>

            {/* Exam Schedule List Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest flex items-center gap-3">
                        <Clock className="h-5 w-5 text-indigo-500" />
                        Timetable Registry
                    </h2>
                    <div className="flex items-center gap-1 text-gray-400">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><Copy className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><FileSpreadsheet className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><FileText className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><Printer className="h-4 w-4" /></Button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by subject..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-11 text-sm border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none"
                        />
                    </div>
                </div>

                <div className="rounded-lg border border-gray-50 overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-gray-50/50 text-[10px] uppercase font-bold text-gray-500">
                            <TableRow className="hover:bg-transparent border-gray-50">
                                <TableHead className="py-4 px-6 min-w-[200px]">Subject</TableHead>
                                <TableHead className="py-4 px-6 min-w-[150px]">Date & Time</TableHead>
                                <TableHead className="py-4 px-6 min-w-[100px]">Duration</TableHead>
                                <TableHead className="py-4 px-6 min-w-[100px]">Venue</TableHead>
                                <TableHead className="py-4 px-6 text-right min-w-[120px]">Thresholds</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {searching ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Compiling exam dates...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : schedule.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-gray-400 text-sm italic">
                                        Please select an exam to view the schedule.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredData.map((item) => (
                                    <TableRow key={item.id} className="text-[13px] text-gray-600 hover:bg-gray-50/30 transition-colors border-b last:border-0 border-gray-50 group">
                                        <TableCell className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-indigo-600 uppercase tracking-tight">{item.subject.name}</span>
                                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Code: {item.subject.code}</span>
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
                                                {item.duration} MINS
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <span className="flex items-center gap-2 font-bold text-gray-500">
                                                <MapPin className="h-3 w-3" /> {item.room_no || "TBA"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="flex items-center gap-2 font-bold text-emerald-600 text-[11px]">
                                                    <Target className="h-3 w-3" /> MAX: {parseFloat(item.max_marks).toFixed(2)}
                                                </span>
                                                <span className="flex items-center gap-2 font-bold text-rose-500 text-[10px]">
                                                    <ShieldCheck className="h-3 w-3" /> MIN: {parseFloat(item.min_marks).toFixed(2)}
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
