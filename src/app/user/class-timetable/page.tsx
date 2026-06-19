"use client";

import { Printer, BookOpen, Clock, User, Building, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const timetableData = {
    Monday: [
        { subject: "English (210)", time: "8:00 AM - 08:45 AM", teacher: "Shivam Verma (9002)", room: "100" },
        { subject: "Hindi (230)", time: "8:45 AM - 9:30 AM", teacher: "Jason Sharlton (90006)", room: "100" },
        { subject: "Mathematics (110)", time: "9:30 AM - 10:15 AM", teacher: "Nishant Khare (1002)", room: "100" },
        { subject: "Science (111)", time: "10:15 AM - 11:00 AM", teacher: "Aman Verma (654)", room: "100" }
    ],
    Tuesday: [
        { subject: "English (210)", time: "8:00 AM - 08:30 AM", teacher: "Shivam Verma (9002)", room: "12" },
        { subject: "Hindi (230)", time: "08:35 AM - 09:05 AM", teacher: "Jason Sharlton (90006)", room: "12" },
        { subject: "Mathematics (110)", time: "09:10 AM - 09:40 AM", teacher: "Nishant Khare (1002)", room: "12" },
        { subject: "Science (111)", time: "09:45 AM - 10:15 AM", teacher: "Aman Verma (654)", room: "12" }
    ],
    Wednesday: [
        { subject: "English (210)", time: "8:00 AM - 08:30 AM", teacher: "Shivam Verma (9002)", room: "12" },
        { subject: "Hindi (230)", time: "08:35 AM - 09:05 AM", teacher: "Jason Sharlton (90006)", room: "12" },
        { subject: "Mathematics (110)", time: "09:10 AM - 09:40 AM", teacher: "Nishant Khare (1002)", room: "12" },
        { subject: "Science (111)", time: "09:45 AM - 10:15 AM", teacher: "Aman Verma (654)", room: "12" }
    ],
    Thursday: [
        { subject: "English (210)", time: "8:00 AM - 08:30 AM", teacher: "Shivam Verma (9002)", room: "12" },
        { subject: "Hindi (230)", time: "08:35 AM - 09:05 AM", teacher: "Jason Sharlton (90006)", room: "12" },
        { subject: "Mathematics (110)", time: "09:10 AM - 09:40 AM", teacher: "Nishant Khare (1002)", room: "12" },
        { subject: "Science (111)", time: "09:45 AM - 10:15 AM", teacher: "Aman Verma (654)", room: "12" }
    ],
    Friday: [
        { subject: "Hindi (230)", time: "8:00 AM - 08:30 AM", teacher: "Jason Sharlton (90006)", room: "12" },
        { subject: "Mathematics (110)", time: "08:35 AM - 09:05 AM", teacher: "Nishant Khare (1002)", room: "12" },
        { subject: "Science (111)", time: "09:10 AM - 09:40 AM", teacher: "Aman Verma (654)", room: "12" },
        { subject: "English (210)", time: "09:40 AM - 10:05 AM", teacher: "Shivam Verma (9002)", room: "12" }
    ],
    Saturday: [
        { subject: "Science (111)", time: "8:00 AM - 08:30 AM", teacher: "Shivam Verma (9002)", room: "12" },
        { subject: "English (210)", time: "08:35 AM - 09:05 AM", teacher: "Aman Verma (654)", room: "12" }
    ],
    Sunday: []
};

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function UserClassTimetablePage() {
    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="border-b border-gray-100 p-4">
                    <h1 className="text-[15px] font-medium text-gray-700 tracking-tight">Class Timetable</h1>
                </div>

                <div className="p-4">
                    <div className="flex justify-end mb-2">
                        <Button 
                            className="bg-[#7e57c2] hover:bg-[#7048b6] text-white p-2 h-7 w-8 rounded shadow-none flex items-center justify-center transition-all active:scale-95"
                            title="Print Timetable"
                            onClick={() => window.print()}
                        >
                            <Printer className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="border border-gray-100 rounded-lg overflow-x-auto">
                        <table className="w-full min-w-[1200px] border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    {daysOfWeek.map((day) => (
                                        <th key={day} className="py-3 px-3 text-left text-[12px] font-bold text-gray-700 bg-gray-50/30">
                                            {day}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    {daysOfWeek.map((day) => {
                                        const classes = timetableData[day as keyof typeof timetableData] || [];
                                        return (
                                            <td key={day} className="p-2 align-top w-[14.28%] border-r border-gray-100 last:border-r-0">
                                                <div className="space-y-3">
                                                    {classes.length > 0 ? (
                                                        classes.map((c, idx) => (
                                                            <div key={idx} className="border border-gray-200 rounded-md p-2.5 bg-white shadow-sm hover:shadow-md transition-shadow">
                                                                <div className="space-y-1.5">
                                                                    <div className="flex items-start gap-1.5">
                                                                        <BookOpen className="h-3.5 w-3.5 text-gray-500 mt-0.5 shrink-0" />
                                                                        <span className="text-[#4caf50] font-medium leading-tight text-[11px]">Subject: {c.subject}</span>
                                                                    </div>
                                                                    <div className="flex items-start gap-1.5">
                                                                        <Clock className="h-3.5 w-3.5 text-gray-500 mt-0.5 shrink-0" />
                                                                        <span className="text-[#4caf50] font-medium leading-tight text-[11px]">{c.time}</span>
                                                                    </div>
                                                                    <div className="flex items-start gap-1.5">
                                                                        <User className="h-3.5 w-3.5 text-gray-500 mt-0.5 shrink-0" />
                                                                        <span className="text-[#4caf50] font-medium leading-tight text-[11px]">{c.teacher}</span>
                                                                    </div>
                                                                    <div className="flex items-start gap-1.5">
                                                                        <Building className="h-3.5 w-3.5 text-gray-500 mt-0.5 shrink-0" />
                                                                        <span className="text-[#4caf50] font-medium leading-tight text-[11px]">Room No.: {c.room}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="border border-gray-200 rounded-md p-2.5 bg-gray-50/50 flex items-center gap-1.5">
                                                            <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                                            <span className="text-red-500 font-medium text-[11px]">Not Scheduled</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
