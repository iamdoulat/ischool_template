"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Search, Printer, Clock, BookOpen, MapPin, AlertCircle, LayoutGrid, Loader2
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";

interface TimetableEntry {
    class: string;
    subject: string;
    time: string;
    room: string;
}

interface TimetableDay {
    day: string;
    entries: TimetableEntry[];
}

const mockTimetable: TimetableDay[] = [
    {
        day: "Monday",
        entries: [
            { class: "Class: Class 1(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 2(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 2(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 2(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 1(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 1(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 3(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 4(C)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 150" },
            { class: "Class: Class 4(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 3(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
        ]
    },
    {
        day: "Tuesday",
        entries: [
            { class: "Class: Class 2(B)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 5(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 1(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 3(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(C)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 1(D)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 2(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 4(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 3(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 150" },
            { class: "Class: Class 3(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 3(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12FF" },
        ]
    },
    {
        day: "Wednesday",
        entries: [
            { class: "Class: Class 3(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 150" },
            { class: "Class: Class 2(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 5(C)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 5(B)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 1(D)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(C)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(B)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 1(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 2(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 3(B)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
        ]
    },
    {
        day: "Thursday",
        entries: [
            { class: "Class: Class 3(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 150" },
            { class: "Class: Class 5(C)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 5(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 1(D)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(B)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 2(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 4(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 2(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 3(B)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 3(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12FF" },
        ]
    },
    {
        day: "Friday",
        entries: [
            { class: "Class: Class 2(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 4(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 150" },
            { class: "Class: Class 5(B)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 5(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 3(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 150" },
            { class: "Class: Class 3(B)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 2(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 5(A)", subject: "Subject: Mathematics (110)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 5(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 2(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 150" },
        ]
    },
    {
        day: "Saturday",
        entries: [
            { class: "Class: Class 3(C)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 150" },
            { class: "Class: Class 5(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 5(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 1(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(B)", subject: "Subject: Mathematics (110)", time: "9:00 AM - 09:45 AM", room: "Room No: 150" },
            { class: "Class: Class 2(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 4(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 2(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 3(B)", subject: "Subject: Mathematics (110)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 5(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
        ]
    },
    {
        day: "Sunday",
        entries: []
    }
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function TeachersTimetablePage() {
    const { toast } = useToast();

    // Prerequisite states
    const [staffList, setStaffList] = useState<any[]>([]);
    const [selectedStaffId, setSelectedStaffId] = useState<string>("");

    // Timetable data
    const [timetableData, setTimetableData] = useState<any[]>(
        DAYS.map(day => ({ day, entries: [] }))
    );

    // UI states
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    // Load staff list
    useEffect(() => {
        const fetchStaff = async () => {
            setLoading(true);
            try {
                const res = await api.get("/users", { params: { role: "Staff", limit: 1000 } });
                setStaffList(res.data.data.data || []);
            } catch (error) {
                console.error("Error fetching staff:", error);
                toast("error", "Failed to load staff list");
            } finally {
                setLoading(false);
            }
        };
        fetchStaff();
    }, []);

    const handleSearch = async () => {
        if (!selectedStaffId) {
            toast("error", "Please select a Teacher");
            return;
        }

        setSearching(true);
        try {
            const res = await api.get("/class-timetables", {
                params: { staff_id: selectedStaffId }
            });
            const entries = res.data.data || [];

            // Group entries by day
            const grouped = DAYS.map(day => ({
                day,
                entries: entries.filter((e: any) => e.day === day)
            }));
            setTimetableData(grouped);
            toast("success", "Timetable loaded");
        } catch (error) {
            console.error("Error searching timetable:", error);
            toast("error", "Failed to fetch timetable");
        } finally {
            setSearching(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-4">
            {/* Header/Title */}
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100 no-print">
                <div className="flex items-center gap-2 text-[#6366f1]">
                    <Clock className="h-6 w-6" />
                    <h1 className="text-xl font-medium text-gray-800">Teacher Time Table</h1>
                </div>
            </div>

            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 no-print select-criteria-section">
                <div className="flex flex-col space-y-2">
                    <Label htmlFor="teacher" className="text-xs font-semibold text-gray-600 uppercase">
                        Teachers <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2 max-w-2xl">
                        <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                            <SelectTrigger id="teacher" className="h-10 flex-1">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {staffList.map(s => (
                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.staff_id})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={handleSearch}
                            className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white px-8 h-10 text-xs shadow-md transition-all duration-300"
                            disabled={searching || loading}
                        >
                            {searching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                            Search
                        </Button>
                    </div>
                </div>
            </div>

            {/* Timetable Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden relative min-h-[600px]">
                <div className="absolute right-4 top-4 z-10 no-print">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm p-0"
                        onClick={handlePrint}
                    >
                        <Printer className="h-4 w-4" />
                    </Button>
                </div>

                <div className="overflow-x-auto pt-14 px-4 pb-4">
                    {searching ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <Loader2 className="h-10 w-10 animate-spin mb-4 text-indigo-500" />
                            <p>Loading teacher's timetable...</p>
                        </div>
                    ) : (
                        <div className="flex min-w-max gap-4">
                            {timetableData.map((dayData) => (
                                <div key={dayData.day} className="flex-1 min-w-[220px]">
                                    <div className="bg-gray-50 py-2.5 px-3 text-left mb-3 rounded-t-lg border-b-2 border-indigo-500">
                                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{dayData.day}</span>
                                    </div>
                                    <div className="space-y-3 px-1">
                                        {dayData.entries.length > 0 ? (
                                            dayData.entries.map((entry: any, idx: number) => (
                                                <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-indigo-400">
                                                    <div className="space-y-2 text-[11px]">
                                                        <div className="flex items-start gap-2">
                                                            <LayoutGrid className="h-3.5 w-3.5 text-indigo-500 mt-0.5" />
                                                            <div>
                                                                <span className="font-bold text-gray-900 block">Class: {entry.school_class?.name}({entry.section?.name})</span>
                                                                <span className="text-gray-600 font-medium">Subject: {entry.subject?.name} ({entry.subject?.code})</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 pl-5">
                                                            <Clock className="h-3.5 w-3.5 text-orange-400" />
                                                            <span className="text-gray-700 font-semibold">{entry.start_time} - {entry.end_time}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 pl-5">
                                                            <MapPin className="h-3.5 w-3.5 text-green-500" />
                                                            <span className="text-gray-700 font-medium">Room: {entry.room || "N/A"}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="bg-gray-50/50 border border-dashed border-gray-200 rounded-lg p-4 text-center">
                                                <div className="flex flex-col items-center justify-center gap-1.5 text-gray-400">
                                                    <AlertCircle className="h-5 w-5 opacity-50" />
                                                    <span className="text-[10px] font-bold uppercase tracking-tighter">Not Scheduled</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
