"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Plus,
    Search,
    Pencil,
    List,
    Eye,
    ChevronLeft,
    ChevronRight,
    CircleSlash,
    Calendar,
    Clock,
    MapPin,
    ClipboardList
} from "lucide-react";

interface LessonPlanItem {
    id: string;
    subject: string;
    subjectCode: string;
    className: string;
    timeRange: string;
    roomNo: string;
    actions: ("add" | "edit" | "report" | "view")[];
}

interface DayPlan {
    day: string;
    date: string;
    lessons: LessonPlanItem[];
}

const mockWeekPlan: DayPlan[] = [
    {
        day: "Monday",
        date: "02/02/2026",
        lessons: [
            { id: "1", subject: "Computer", subjectCode: "00220", className: "Class 1(A)", timeRange: "03:45 PM - 04:45 PM", roomNo: "122", actions: ["add"] },
            { id: "2", subject: "English", subjectCode: "210", className: "Class 1(B)", timeRange: "9:00 AM - 09:45 AM", roomNo: "153", actions: ["report", "edit", "add"] },
            { id: "3", subject: "Hindi", subjectCode: "230", className: "Class 1(B)", timeRange: "10:30 AM - 11:15 AM", roomNo: "12", actions: ["report", "edit", "add"] },
            { id: "4", subject: "English", subjectCode: "210", className: "Class 2(A)", timeRange: "9:00 AM - 09:45 AM", roomNo: "153", actions: ["report", "edit", "view"] },
            { id: "5", subject: "Hindi", subjectCode: "230", className: "Class 2(A)", timeRange: "10:30 AM - 11:15 AM", roomNo: "153", actions: ["report", "edit", "add"] },
        ]
    },
    {
        day: "Tuesday",
        date: "02/03/2026",
        lessons: [
            { id: "6", subject: "Hindi", subjectCode: "230", className: "Class 1(A)", timeRange: "9:00 AM - 09:45 AM", roomNo: "12", actions: ["report", "edit", "add"] },
            { id: "7", subject: "English", subjectCode: "210", className: "Class 1(A)", timeRange: "10:30 AM - 11:15 AM", roomNo: "12", actions: ["add"] },
            { id: "8", subject: "Hindi", subjectCode: "230", className: "Class 1(B)", timeRange: "9:00 AM - 09:45 AM", roomNo: "12", actions: ["report", "edit", "add"] },
            { id: "9", subject: "English", subjectCode: "210", className: "Class 1(B)", timeRange: "10:30 AM - 11:15 AM", roomNo: "12", actions: ["add"] },
            { id: "10", subject: "English", subjectCode: "210", className: "Class 2(A)", timeRange: "9:00 AM - 09:45 AM", roomNo: "153", actions: ["add"] },
        ]
    },
    {
        day: "Wednesday",
        date: "02/04/2026",
        lessons: [
            { id: "11", subject: "English", subjectCode: "210", className: "Class 1(A)", timeRange: "9:00 AM - 09:45 AM", roomNo: "12", actions: ["report", "edit", "add"] },
            { id: "12", subject: "Mathematics", subjectCode: "110", className: "Class 1(A)", timeRange: "10:30 AM - 11:15 AM", roomNo: "12", actions: ["add"] },
            { id: "13", subject: "Drawing", subjectCode: "200", className: "Class 1(B)", timeRange: "09:45 AM - 10:30 AM", roomNo: "12", actions: ["add"] },
            { id: "14", subject: "English", subjectCode: "210", className: "Class 1(B)", timeRange: "11:15 AM - 12:00 PM", roomNo: "12", actions: ["add"] },
            { id: "15", subject: "Class 2(A)", subjectCode: "110", className: "Class 2(A)", timeRange: "9:00 AM - 09:45 AM", roomNo: "153", actions: ["add"] },
        ]
    },
    {
        day: "Thursday",
        date: "02/05/2026",
        lessons: [
            { id: "16", subject: "Mathematics", subjectCode: "110", className: "Class 1(A)", timeRange: "09:45 AM - 10:30 AM", roomNo: "12", actions: ["report", "edit", "add"] },
            { id: "17", subject: "Hindi", subjectCode: "230", className: "Class 1(A)", timeRange: "10:30 AM - 11:15 AM", roomNo: "12", actions: ["add"] },
            { id: "18", subject: "English", subjectCode: "210", className: "Class 1(B)", timeRange: "9:00 AM - 09:45 AM", roomNo: "12", actions: ["add"] },
            { id: "19", subject: "Hindi", subjectCode: "230", className: "Class 1(B)", timeRange: "10:30 AM - 11:15 AM", roomNo: "12", actions: ["add"] },
            { id: "20", subject: "Class 2(A)", subjectCode: "110", className: "Class 2(A)", timeRange: "9:00 AM - 09:45 AM", roomNo: "153", actions: ["add"] },
        ]
    },
    {
        day: "Friday",
        date: "02/06/2026",
        lessons: [
            { id: "21", subject: "English", subjectCode: "210", className: "Class 1(A)", timeRange: "9:00 AM - 09:45 AM", roomNo: "12", actions: ["report", "edit", "add"] },
            { id: "22", subject: "Hindi", subjectCode: "230", className: "Class 1(A)", timeRange: "10:30 AM - 11:15 AM", roomNo: "12", actions: ["add"] },
            { id: "23", subject: "Hindi", subjectCode: "230", className: "Class 1(B)", timeRange: "9:00 AM - 09:45 AM", roomNo: "12", actions: ["add"] },
            { id: "24", subject: "Drawing", subjectCode: "200", className: "Class 1(B)", timeRange: "11:15 AM - 12:00 PM", roomNo: "12", actions: ["add"] },
            { id: "25", subject: "Mathematics", subjectCode: "110", className: "Class 2(A)", timeRange: "9:00 AM - 09:45 AM", roomNo: "153", actions: ["add"] },
        ]
    },
    {
        day: "Saturday",
        date: "02/07/2026",
        lessons: [
            { id: "26", subject: "Mathematics", subjectCode: "110", className: "Class 1(A)", timeRange: "9:00 AM - 09:45 AM", roomNo: "12", actions: ["report", "edit", "add"] },
            { id: "27", subject: "English", subjectCode: "210", className: "Class 1(A)", timeRange: "10:30 AM - 11:15 AM", roomNo: "12", actions: ["add"] },
            { id: "28", subject: "English", subjectCode: "210", className: "Class 1(B)", timeRange: "9:00 AM - 09:45 AM", roomNo: "12", actions: ["add"] },
            { id: "29", subject: "English", subjectCode: "210", className: "Class 1(B)", timeRange: "10:30 AM - 11:15 AM", roomNo: "12", actions: ["add"] },
            { id: "30", subject: "Hindi", subjectCode: "230", className: "Class 2(A)", timeRange: "9:00 AM - 09:45 AM", roomNo: "153", actions: ["add"] },
        ]
    },
    {
        day: "Sunday",
        date: "02/08/2026",
        lessons: []
    }
];

export default function ManageLessonPlanPage() {
    const [selectedTeacher, setSelectedTeacher] = useState("Shivam Verma (9002)");

    return (
        <div className="p-4 space-y-6 font-sans bg-gray-50/30 min-h-screen">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-medium text-gray-800">Manage Lesson Plan</h1>
            </div>

            <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
                <div className="space-y-2 max-w-2xl">
                    <Label className="text-xs font-bold text-gray-600 uppercase">
                        Teachers <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2 items-center">
                        <Select defaultValue={selectedTeacher} onValueChange={setSelectedTeacher}>
                            <SelectTrigger className="w-full h-9 border-gray-200 text-sm">
                                <SelectValue placeholder="Select Teacher" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Shivam Verma (9002)">Shivam Verma (9002)</SelectItem>
                                <SelectItem value="Joe Black (9000)">Joe Black (9000)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white gap-2 h-9 px-6 text-xs transition-all shadow-sm">
                            <Search className="h-4 w-4" /> Search
                        </Button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border shadow-sm p-4 overflow-x-auto">
                <div className="flex justify-center items-center gap-6 mb-6">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 rounded-full hover:bg-gray-100">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="text-sm font-semibold text-gray-700">
                        02/02/2026 To 02/08/2026
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 rounded-full hover:bg-gray-100">
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-3 min-w-[1200px]">
                    {mockWeekPlan.map((dayPlan) => (
                        <div key={dayPlan.day} className="space-y-3">
                            <div className="bg-gray-50/80 p-2 rounded border border-gray-100 text-center">
                                <div className="text-xs font-bold text-gray-800">{dayPlan.day}</div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-tight">{dayPlan.date}</div>
                            </div>

                            {dayPlan.lessons.length > 0 ? (
                                <div className="space-y-3">
                                    {dayPlan.lessons.map((lesson) => (
                                        <div key={lesson.id} className="bg-white border border-gray-100 rounded shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-1 flex gap-0.5">
                                                {lesson.actions.includes("report") && (
                                                    <div className="h-5 w-5 bg-indigo-500 rounded-sm flex items-center justify-center text-white cursor-pointer hover:bg-indigo-600">
                                                        <ClipboardList className="h-3 w-3" />
                                                    </div>
                                                )}
                                                {lesson.actions.includes("edit") && (
                                                    <div className="h-5 w-5 bg-indigo-500 rounded-sm flex items-center justify-center text-white cursor-pointer hover:bg-indigo-600">
                                                        <Pencil className="h-3 w-3" />
                                                    </div>
                                                )}
                                                {lesson.actions.includes("add") && (
                                                    <div className="h-5 w-5 bg-indigo-500 rounded-sm flex items-center justify-center text-white cursor-pointer hover:bg-indigo-600">
                                                        <Plus className="h-3 w-3" />
                                                    </div>
                                                )}
                                                {lesson.actions.includes("view") && (
                                                    <div className="h-5 w-5 bg-indigo-500 rounded-sm flex items-center justify-center text-white cursor-pointer hover:bg-indigo-600">
                                                        <Eye className="h-3 w-3" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-3 pt-6 space-y-2">
                                                <div className="flex items-start gap-1.5">
                                                    <ClipboardList className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                                                    <div className="text-[11px] leading-tight">
                                                        <span className="font-semibold text-gray-700">Subject:</span>{" "}
                                                        <span className="text-gray-600">{lesson.subject} ({lesson.subjectCode})</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-1.5">
                                                    <Clock className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                                                    <div className="text-[11px] leading-tight">
                                                        <span className="font-semibold text-gray-700">Class:</span>{" "}
                                                        <span className="text-gray-600">{lesson.className}</span>
                                                        <div className="text-gray-500 mt-0.5">{lesson.timeRange}</div>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-1.5 pt-1">
                                                    <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                                                    <div className="text-[11px] leading-tight">
                                                        <span className="font-semibold text-gray-700">Room No:</span>{" "}
                                                        <span className="text-gray-600">{lesson.roomNo}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-red-50/50 border border-red-100 rounded p-3 flex flex-col items-center justify-center gap-2 text-center min-h-[100px]">
                                    <CircleSlash className="h-5 w-5 text-red-500" />
                                    <div className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Not Scheduled</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
