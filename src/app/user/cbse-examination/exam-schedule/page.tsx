"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const examScheduleData = [
    {
        examName: "CBSE Assessment Test ( June)",
        subjects: [
            { name: "English (210)", date: "06/26/2026", startTime: "13:00:00", duration: "60", room: "100" },
            { name: "Hindi (230)", date: "06/29/2026", startTime: "13:00:00", duration: "60", room: "100" }
        ]
    },
    {
        examName: "Monthly Test Examination(June)",
        subjects: [
            { name: "English (210)", date: "06/22/2026", startTime: "12:51:41", duration: "60", room: "103" },
            { name: "Mathematics (110)", date: "06/24/2026", startTime: "12:51:41", duration: "60", room: "103" },
            { name: "Computer (00220)", date: "06/26/2026", startTime: "12:51:41", duration: "60", room: "103" }
        ]
    },
    {
        examName: "Unit Test(June)",
        subjects: [
            { name: "English (210)", date: "06/02/2026", startTime: "10:30:00", duration: "60", room: "102" },
            { name: "Mathematics (110)", date: "06/04/2026", startTime: "10:30:00", duration: "60", room: "102" },
            { name: "Science (111)", date: "06/06/2026", startTime: "10:30:00", duration: "60", room: "102" }
        ]
    },
    {
        examName: "CBSE Assessment Test - May",
        subjects: [
            { name: "Mathematics (110)", date: "05/22/2026", startTime: "10:30:10", duration: "60", room: "100" },
            { name: "Science (111)", date: "05/25/2026", startTime: "10:30:10", duration: "60", room: "100" },
            { name: "Computer (00220)", date: "05/28/2026", startTime: "10:30:10", duration: "60", room: "100" }
        ]
    }
];

export default function UserCBSEExamSchedulePage() {
    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="border-b border-gray-100 p-4 flex justify-between items-center">
                    <h1 className="text-[16px] font-medium text-gray-700 tracking-tight">CBSE Exam Timetable</h1>
                    <Button variant="outline" size="icon" className="h-8 w-8 text-gray-500 shadow-none hover:bg-gray-50">
                        <Printer className="h-4 w-4" />
                    </Button>
                </div>

                <div className="p-4 space-y-6">
                    {examScheduleData.map((exam, index) => (
                        <div key={index} className="border border-gray-200 rounded-sm overflow-hidden">
                            {/* Exam Title Bar */}
                            <div className="bg-gray-100/80 p-3 border-b border-gray-200 text-[14px] text-gray-600 font-medium">
                                {exam.examName}
                            </div>
                            
                            {/* Data Table */}
                            <div className="overflow-x-auto">
                                <Table className="min-w-[800px]">
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-b border-gray-200">
                                            <TableHead className="w-[30%] text-[12px] font-bold text-gray-700 h-auto py-3">Subject</TableHead>
                                            <TableHead className="text-center text-[12px] font-bold text-gray-700 h-auto py-3">Date</TableHead>
                                            <TableHead className="text-center text-[12px] font-bold text-gray-700 h-auto py-3">Start Time</TableHead>
                                            <TableHead className="text-center text-[12px] font-bold text-gray-700 h-auto py-3">Duration (minute)</TableHead>
                                            <TableHead className="text-center text-[12px] font-bold text-gray-700 h-auto py-3">Room No.</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {exam.subjects.map((subject, sIdx) => (
                                            <TableRow key={sIdx} className="hover:bg-gray-50/50 border-b border-gray-100">
                                                <TableCell className="text-[13px] text-gray-600 py-3">{subject.name}</TableCell>
                                                <TableCell className="text-center text-[13px] text-gray-600 py-3">{subject.date}</TableCell>
                                                <TableCell className="text-center text-[13px] text-gray-600 py-3">{subject.startTime}</TableCell>
                                                <TableCell className="text-center text-[13px] text-gray-600 py-3">{subject.duration}</TableCell>
                                                <TableCell className="text-center text-[13px] text-gray-600 py-3">{subject.room}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
